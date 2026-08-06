const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?/u;
const XML_S = new Set(['\x20', '\x09', '\x0D', '\x0A']);
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';
const NAMED_ENTITIES = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['gt', '>'],
  ['lt', '<'],
  ['quot', '"'],
]);
const NON_RENDERED_SVG_CONTAINERS = new Set([
  'clipPath',
  'defs',
  'desc',
  'marker',
  'mask',
  'metadata',
  'pattern',
  'script',
  'style',
  'symbol',
  'title',
]);

export const isXmlWhitespace = (character) => XML_S.has(character);

export const skipXmlWhitespace = (source, start = 0) => {
  let cursor = start;
  while (cursor < source.length && isXmlWhitespace(source[cursor])) cursor += 1;
  return cursor;
};

export const allXmlWhitespace = (source) => skipXmlWhitespace(source) === source.length;

export const buildXmlLineOffsets = (source) => {
  const offsets = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) offsets.push(index + 1);
  }
  return offsets;
};

export const xmlLineAt = (offsets, offset) => {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (offsets[middle] <= offset) low = middle + 1;
    else high = middle;
  }
  return Math.max(1, low);
};

const allowedXml10CodePoint = (codePoint) => (
  codePoint === 0x9
  || codePoint === 0xA
  || codePoint === 0xD
  || (codePoint >= 0x20 && codePoint <= 0xD7FF)
  || (codePoint >= 0xE000 && codePoint <= 0xFFFD)
  || (codePoint >= 0x10000 && codePoint <= 0x10FFFF)
);

const fail = (file, line, message) => {
  throw new Error(`${file}:${line}: XML parser failed: ${message}`);
};

const validateRawCharacters = (source, file, offsets) => {
  for (let offset = 0; offset < source.length;) {
    const codePoint = source.codePointAt(offset);
    if (!allowedXml10CodePoint(codePoint)) {
      fail(
        file,
        xmlLineAt(offsets, offset),
        `forbidden XML 1.0 character U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
      );
    }
    offset += codePoint > 0xFFFF ? 2 : 1;
  }
};

const decodeXml = (value, file, line) => {
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '&') {
      decoded += value[index];
      continue;
    }
    const end = value.indexOf(';', index + 1);
    if (end === -1) fail(file, line, 'unterminated XML entity');
    const entity = value.slice(index + 1, end);
    let codePoint;
    if (/^#x[0-9a-f]+$/iu.test(entity)) {
      codePoint = Number.parseInt(entity.slice(2), 16);
    } else if (/^#[0-9]+$/u.test(entity)) {
      codePoint = Number.parseInt(entity.slice(1), 10);
    } else if (NAMED_ENTITIES.has(entity)) {
      decoded += NAMED_ENTITIES.get(entity);
      index = end;
      continue;
    } else {
      fail(file, line, `unknown entity "&${entity};"`);
    }
    if (!Number.isInteger(codePoint) || !allowedXml10CodePoint(codePoint)) {
      fail(file, line, `forbidden XML 1.0 character reference &${entity};`);
    }
    decoded += String.fromCodePoint(codePoint);
    index = end;
  }
  return decoded;
};

const qualifiedName = (name, file, line) => {
  const parts = name.split(':');
  if (
    parts.length > 2
    || parts.some((part) => !/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(part))
  ) {
    fail(file, line, `invalid qualified name "${name}"`);
  }
  return parts.length === 1
    ? {localName: parts[0], prefix: ''}
    : {localName: parts[1], prefix: parts[0]};
};

const readMarkupEnd = (source, start, file, line) => {
  let quote = '';
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = '';
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }
  fail(file, line, 'unterminated XML tag');
};

const parseStartTag = (markup, file, line) => {
  let contents = markup.slice(1, -1);
  let selfClosing = false;
  if (contents.endsWith('/')) {
    selfClosing = true;
    contents = contents.slice(0, -1);
  }
  const name = contents.match(XML_NAME)?.[0] ?? '';
  if (!name) fail(file, line, 'invalid XML element name');
  const nameParts = qualifiedName(name, file, line);
  let cursor = name.length;
  const attributes = new Map();
  while (cursor < contents.length) {
    const afterWhitespace = skipXmlWhitespace(contents, cursor);
    if (afterWhitespace === cursor) fail(file, line, `expected whitespace after ${name}`);
    cursor = afterWhitespace;
    if (cursor >= contents.length) break;
    const attributeName = contents.slice(cursor).match(XML_NAME)?.[0] ?? '';
    if (!attributeName) fail(file, line, `invalid attribute on ${name}`);
    qualifiedName(attributeName, file, line);
    if (attributes.has(attributeName)) {
      fail(file, line, `duplicate attribute "${attributeName}"`);
    }
    cursor += attributeName.length;
    cursor = skipXmlWhitespace(contents, cursor);
    if (contents[cursor] !== '=') {
      fail(file, line, `attribute ${attributeName} must have a value`);
    }
    cursor += 1;
    cursor = skipXmlWhitespace(contents, cursor);
    const quote = contents[cursor];
    if (quote !== '"' && quote !== "'") {
      fail(file, line, `attribute ${attributeName} must be quoted`);
    }
    const valueStart = cursor + 1;
    const valueEnd = contents.indexOf(quote, valueStart);
    if (valueEnd === -1) fail(file, line, `unterminated attribute ${attributeName}`);
    const rawValue = contents.slice(valueStart, valueEnd);
    if (rawValue.includes('<')) fail(file, line, 'raw < is not allowed in an XML attribute');
    attributes.set(attributeName, decodeXml(rawValue, file, line));
    cursor = valueEnd + 1;
  }
  return {attributes, name, nameParts, selfClosing};
};

const XML_DECLARATION = /^xml[ \t\r\n]+version[ \t\r\n]*=[ \t\r\n]*(?:"1\.0"|'1\.0')(?:[ \t\r\n]+encoding[ \t\r\n]*=[ \t\r\n]*(?:"[A-Za-z][A-Za-z0-9._-]*"|'[A-Za-z][A-Za-z0-9._-]*'))?(?:[ \t\r\n]+standalone[ \t\r\n]*=[ \t\r\n]*(?:"(?:yes|no)"|'(?:yes|no)'))?[ \t\r\n]*$/u;
const XML_PI_TARGET = /^([A-Za-z_:][A-Za-z0-9_.:-]*)(?:[ \t\r\n]|$)/u;

export const parseXml = (source, file = '<xml>') => {
  const xml = source.replace(/^\uFEFF/u, '');
  const offsets = buildXmlLineOffsets(xml);
  validateRawCharacters(xml, file, offsets);
  const lineAt = (offset) => xmlLineAt(offsets, offset);
  const comments = [];
  const stack = [];
  let root;
  let cursor = 0;
  let seenXmlDeclaration = false;

  while (cursor < xml.length) {
    const line = lineAt(cursor);
    if (xml.startsWith('<!--', cursor)) {
      const end = xml.indexOf('-->', cursor + 4);
      if (end === -1) fail(file, line, 'unterminated XML comment');
      const text = xml.slice(cursor + 4, end);
      if (text.includes('--')) fail(file, line, 'XML comments must not contain --');
      if (text.endsWith('-')) fail(file, line, 'XML comments must not end with -');
      comments.push({
        file,
        line,
        text: text.trim(),
        excerpt: xml.slice(cursor, end + 3).trim(),
        kind: 'xml-comment',
      });
      cursor = end + 3;
      continue;
    }
    if (xml.startsWith('<?', cursor)) {
      const end = xml.indexOf('?>', cursor + 2);
      if (end === -1) fail(file, line, 'unterminated XML processing instruction');
      const instruction = xml.slice(cursor + 2, end);
      const target = instruction.match(XML_PI_TARGET)?.[1];
      if (!target) fail(file, line, 'invalid XML processing instruction target');
      if (target.toLowerCase() === 'xml') {
        if (target !== 'xml') {
          fail(file, line, 'XML processing instruction target is reserved');
        }
        if (cursor !== 0 || seenXmlDeclaration) {
          fail(file, line, 'XML declaration must appear once at the start of the document');
        }
        if (!XML_DECLARATION.test(instruction)) {
          fail(file, line, 'invalid XML declaration');
        }
        seenXmlDeclaration = true;
      }
      cursor = end + 2;
      continue;
    }
    if (xml.startsWith('<![CDATA[', cursor)) {
      if (stack.length === 0) fail(file, line, 'CDATA outside root element');
      const end = xml.indexOf(']]>', cursor + 9);
      if (end === -1) fail(file, line, 'unterminated CDATA section');
      stack.at(-1).content.push({line, text: xml.slice(cursor + 9, end), type: 'text'});
      cursor = end + 3;
      continue;
    }
    if (xml[cursor] !== '<') {
      const next = xml.indexOf('<', cursor);
      const end = next === -1 ? xml.length : next;
      const raw = xml.slice(cursor, end);
      if (raw.includes(']]>')) fail(file, line, ']]> is not allowed in normal XML character data');
      if (stack.length === 0) {
        if (!allXmlWhitespace(raw)) {
          const invalidOffset = skipXmlWhitespace(raw);
          fail(file, lineAt(cursor + invalidOffset), 'non-XML whitespace outside root element');
        }
      } else {
        const text = decodeXml(raw, file, line);
        stack.at(-1).content.push({line, text, type: 'text'});
      }
      cursor = end;
      continue;
    }
    if (xml.startsWith('</', cursor)) {
      const end = readMarkupEnd(xml, cursor + 2, file, line);
      const contents = xml.slice(cursor + 2, end);
      const closingName = contents.match(XML_NAME)?.[0] ?? '';
      if (!closingName || !allXmlWhitespace(contents.slice(closingName.length))) {
        fail(file, line, 'invalid XML closing tag');
      }
      qualifiedName(closingName, file, line);
      const open = stack.pop();
      if (!open || open.name !== closingName) fail(file, line, 'mismatched closing tag');
      cursor = end + 1;
      continue;
    }
    if (xml.startsWith('<!', cursor)) fail(file, line, 'unsupported XML declaration');

    const end = readMarkupEnd(xml, cursor + 1, file, line);
    const parsed = parseStartTag(xml.slice(cursor, end + 1), file, line);
    const parent = stack.at(-1);
    const namespaces = new Map(parent?.namespaces ?? [
      ['xml', XML_NAMESPACE],
    ]);
    for (const [attribute, value] of parsed.attributes) {
      if (attribute === 'xmlns') {
        if (value === XML_NAMESPACE || value === XMLNS_NAMESPACE) {
          fail(file, line, `reserved namespace URI cannot be the default namespace`);
        }
        namespaces.set('', value);
      } else if (attribute.startsWith('xmlns:')) {
        const prefix = attribute.slice(6);
        if (prefix === 'xmlns') fail(file, line, 'xmlns prefix must not be declared');
        if (prefix === 'xml') {
          if (value !== XML_NAMESPACE) {
            fail(file, line, `xml prefix must bind ${XML_NAMESPACE}`);
          }
        } else if (value === '') {
          fail(file, line, `namespace prefix "${prefix}" must not bind an empty URI`);
        } else if (value === XML_NAMESPACE || value === XMLNS_NAMESPACE) {
          fail(file, line, `namespace prefix "${prefix}" uses a reserved URI`);
        }
        namespaces.set(prefix, value);
      }
    }
    if (parsed.nameParts.prefix && !namespaces.has(parsed.nameParts.prefix)) {
      fail(file, line, `undeclared element namespace "${parsed.nameParts.prefix}"`);
    }
    const expandedAttributes = new Set();
    for (const [attribute] of parsed.attributes) {
      if (attribute === 'xmlns' || attribute.startsWith('xmlns:')) continue;
      const attributeParts = qualifiedName(attribute, file, line);
      if (attributeParts.prefix && !namespaces.has(attributeParts.prefix)) {
        fail(file, line, `undeclared attribute namespace "${attributeParts.prefix}"`);
      }
      const namespace = attributeParts.prefix ? namespaces.get(attributeParts.prefix) : '';
      const expandedName = `${namespace}\0${attributeParts.localName}`;
      if (expandedAttributes.has(expandedName)) {
        fail(file, line, `duplicate expanded attribute "${attributeParts.localName}"`);
      }
      expandedAttributes.add(expandedName);
    }
    const element = {
      ...parsed,
      children: [],
      content: [],
      line,
      localName: parsed.nameParts.localName,
      namespace: namespaces.get(parsed.nameParts.prefix) ?? '',
      namespaces,
      prefix: parsed.nameParts.prefix,
    };
    if (parent) {
      parent.children.push(element);
      parent.content.push(element);
    } else if (root) {
      fail(file, line, 'multiple root elements');
    } else {
      root = element;
    }
    if (!parsed.selfClosing) stack.push(element);
    cursor = end + 1;
  }
  if (stack.length > 0) fail(file, stack.at(-1).line, `unclosed XML element ${stack.at(-1).name}`);
  if (!root) fail(file, 1, 'XML document root is missing');
  return {comments, lineOffsets: offsets, root};
};

export const xmlElements = (root, localName, namespace) => {
  const matches = [];
  const visit = (element) => {
    if (
      element.localName === localName
      && (namespace === undefined || element.namespace === namespace)
    ) matches.push(element);
    for (const child of element.children) visit(child);
  };
  visit(root);
  return matches;
};

export const xmlTextContent = (element) => element.content.map((item) => (
  item.type === 'text' ? item.text : xmlTextContent(item)
)).join('');

export const normalizedXmlLabel = (value) => value.replace(/\s+/gu, ' ').trim();

const inlineStyles = (element) => {
  const styles = new Map();
  for (const [order, declaration] of (element.attributes.get('style') ?? '').split(';').entries()) {
    const separator = declaration.indexOf(':');
    if (separator === -1) continue;
    const name = declaration.slice(0, separator).trim().toLowerCase();
    const rawValue = declaration.slice(separator + 1);
    const important = /\s*!important\s*$/iu.test(rawValue);
    const value = rawValue.replace(/\s*!important\s*$/iu, '').trim().toLowerCase();
    const previous = styles.get(name);
    if (name && (!previous || important || !previous.important)) {
      styles.set(name, {important, order, value});
    }
  }
  return styles;
};

const presentationValue = (element, name) => {
  const styles = inlineStyles(element);
  return styles.has(name)
    ? styles.get(name).value
    : (element.attributes.get(name) ?? '').trim().toLowerCase();
};

const resolvedPresentationValue = (
  element,
  parentState,
  name,
  initialValue,
  inherited,
  file,
) => {
  const ownValue = presentationValue(element, name);
  if (!ownValue) return inherited ? (parentState?.[name] ?? initialValue) : initialValue;
  if (ownValue === 'inherit') return parentState?.[name] ?? initialValue;
  if (ownValue === 'unset') {
    return inherited ? (parentState?.[name] ?? initialValue) : initialValue;
  }
  if (ownValue === 'initial') return initialValue;
  if (ownValue === 'revert' || ownValue === 'revert-layer') {
    fail(file, element.line, `unsupported CSS-wide keyword "${ownValue}" for ${name}`);
  }
  return ownValue;
};

const zeroOpacity = (value) => {
  const normalized = value.trim().replace(/%$/u, '');
  return normalized !== '' && Number(normalized) === 0;
};

export const svgPresentationState = (element, parentState, file = '<svg>') => {
  const inherited = (name, initial) => resolvedPresentationValue(
    element,
    parentState,
    name,
    initial,
    true,
    file,
  );
  return {
    display: resolvedPresentationValue(element, parentState, 'display', 'inline', false, file),
    fill: inherited('fill', 'black'),
    'fill-opacity': inherited('fill-opacity', '1'),
    opacity: resolvedPresentationValue(element, parentState, 'opacity', '1', false, file),
    stroke: inherited('stroke', 'none'),
    'stroke-opacity': inherited('stroke-opacity', '1'),
    visibility: inherited('visibility', 'visible'),
  };
};

const hidesSvgSubtree = (element, state) => (
  NON_RENDERED_SVG_CONTAINERS.has(element.localName)
  || element.attributes.get('aria-hidden')?.trim().toLowerCase() === 'true'
  || state.display === 'none'
  || zeroOpacity(state.opacity)
);

const paintsText = (state) => (
  state.visibility !== 'hidden'
  && state.visibility !== 'collapse'
  && (
    (state.fill !== 'none' && !zeroOpacity(state['fill-opacity']))
    || (state.stroke !== 'none' && !zeroOpacity(state['stroke-opacity']))
  )
);

const visibleTextContent = (element, state, hiddenByAncestor, file) => {
  const hidden = hiddenByAncestor || hidesSvgSubtree(element, state);
  const painted = !hidden && paintsText(state);
  return element.content.map((item) => {
    if (item.type === 'text') return painted ? item.text : '';
    return visibleTextContent(item, svgPresentationState(item, state, file), hidden, file);
  }).join('');
};

export const visibleSvgTextRecords = (root, file = '<svg>') => {
  const records = [];
  const visit = (element, parentState, hiddenByAncestor) => {
    const state = svgPresentationState(element, parentState, file);
    const hidden = hiddenByAncestor || hidesSvgSubtree(element, state);
    if (element.namespace === SVG_NAMESPACE && element.localName === 'text' && !hidden) {
      const text = normalizedXmlLabel(visibleTextContent(element, state, hiddenByAncestor, file));
      if (text) records.push({file, line: element.line, text, excerpt: text, kind: 'svg'});
      return;
    }
    for (const child of element.children) visit(child, state, hidden);
  };
  visit(root, undefined, false);
  return records;
};

const descendant = (element, localName, namespace) => xmlElements(element, localName, namespace)
  .some((candidate) => candidate !== element);

const validateDrawio = (root, file) => {
  const diagrams = xmlElements(root, 'diagram', '');
  if (diagrams.length === 0) fail(file, root.line, 'named diagram with mxGraphModel required');
  for (const diagram of diagrams) {
    if (!(diagram.attributes.get('name') ?? '').trim()) {
      fail(file, diagram.line, 'named diagram with mxGraphModel required');
    }
    if (!descendant(diagram, 'mxGraphModel', '')) {
      if (normalizedXmlLabel(xmlTextContent(diagram))) {
        fail(file, diagram.line, 'compressed Draw.io diagrams are unsupported');
      }
      fail(file, diagram.line, 'named diagram with mxGraphModel required');
    }
  }
  for (const model of xmlElements(root, 'mxGraphModel', '')) {
    if (!diagrams.some((diagram) => xmlElements(diagram, 'mxGraphModel', '').includes(model))) {
      fail(file, model.line, 'mxGraphModel must be inside diagram');
    }
  }
};

export const visibleDrawioCellRecords = (root, file = '<drawio>') => {
  const records = [];
  for (const cell of xmlElements(root, 'mxCell', '')) {
    if (cell.attributes.get('visible') === '0') continue;
    const text = normalizedXmlLabel(cell.attributes.get('value') ?? '');
    if (/<[^>]+>/u.test(text)) fail(file, cell.line, 'HTML in mxCell.value is unsupported');
    if (text) records.push({file, line: cell.line, text, excerpt: text, kind: 'drawio'});
  }
  return records;
};

export const collectDrawioPairValidation = (parsed, file) => {
  if (parsed.root.localName !== 'mxfile' || parsed.root.namespace !== '') {
    fail(file, parsed.root.line, 'Draw.io root must be unnamespaced mxfile');
  }
  const diagrams = xmlElements(parsed.root, 'diagram', '');
  if (!diagrams.some((diagram) => (diagram.attributes.get('name') ?? '').trim())) {
    fail(file, parsed.root.line, 'named diagram page required');
  }
  return {
    records: visibleDrawioCellRecords(parsed.root, file),
    root: parsed.root,
  };
};

export const collectXmlVisibleCopy = (parsed, file, type) => {
  if (
    type === 'svg'
    && (parsed.root.localName !== 'svg' || parsed.root.namespace !== SVG_NAMESPACE)
  ) {
    fail(file, parsed.root.line, `SVG root must be svg in ${SVG_NAMESPACE}`);
  }
  if (
    type === 'drawio'
    && (parsed.root.localName !== 'mxfile' || parsed.root.namespace !== '')
  ) {
    fail(file, parsed.root.line, 'Draw.io root must be unnamespaced mxfile');
  }
  if (type === 'drawio') validateDrawio(parsed.root, file);
  return {
    records: type === 'svg'
      ? visibleSvgTextRecords(parsed.root, file)
      : visibleDrawioCellRecords(parsed.root, file),
    root: parsed.root,
    suppressionComments: parsed.comments,
  };
};

export const parseXmlVisibleCopy = (source, file, type) => (
  collectXmlVisibleCopy(parseXml(source, file), file, type)
);
