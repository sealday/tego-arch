import {readFile} from 'node:fs/promises';
import path from 'node:path';

const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*/u;
const NAMED_ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};
const USAGE =
  'Usage: node validate_drawio_svg.mjs <source.drawio> <published.svg> [--label <text>]...';
const NON_RENDERED_SVG_CONTAINERS = new Set([
  'defs',
  'desc',
  'metadata',
  'symbol',
  'title',
]);

function isAllowedXml10CodePoint(codePoint) {
  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  );
}

function validateRawXmlCharacters(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (!isAllowedXml10CodePoint(codePoint)) {
      throw new Error(
        `forbidden XML 1.0 character U+${codePoint
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')}`,
      );
    }
  }
}

function decodeXml(value) {
  let decoded = '';

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '&') {
      decoded += value[index];
      continue;
    }

    const end = value.indexOf(';', index + 1);
    if (end === -1) {
      throw new Error('unterminated XML entity');
    }

    const entity = value.slice(index + 1, end);
    let codePoint;

    if (/^#x[0-9a-f]+$/iu.test(entity)) {
      codePoint = Number.parseInt(entity.slice(2), 16);
    } else if (/^#[0-9]+$/u.test(entity)) {
      codePoint = Number.parseInt(entity.slice(1), 10);
    } else if (Object.hasOwn(NAMED_ENTITIES, entity)) {
      decoded += NAMED_ENTITIES[entity];
      index = end;
      continue;
    } else {
      throw new Error(`unsupported XML entity &${entity};`);
    }

    if (!Number.isInteger(codePoint) || !isAllowedXml10CodePoint(codePoint)) {
      throw new Error(
        `forbidden XML 1.0 character reference &${entity};`,
      );
    }

    decoded += String.fromCodePoint(codePoint);
    index = end;
  }

  return decoded;
}

function parseArgs(argv) {
  const errors = [];
  const [drawioPath, svgPath, ...options] = argv;
  const labels = [];

  if (
    !drawioPath ||
    !svgPath ||
    drawioPath.startsWith('--') ||
    svgPath.startsWith('--')
  ) {
    errors.push(USAGE);
    return {drawioPath, svgPath, labels, errors};
  }

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option !== '--label') {
      errors.push(`Unknown option: ${option}`);
      continue;
    }

    const value = options[index + 1];
    if (value === undefined || value.startsWith('--')) {
      errors.push('--label requires a value');
      continue;
    }

    labels.push(value);
    index += 1;
  }

  return {drawioPath, svgPath, labels, errors};
}

function readMarkupEnd(xml, start) {
  let quote = '';

  for (let index = start; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote) {
      if (character === quote) {
        quote = '';
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }

  throw new Error('unterminated XML tag');
}

function parseStartTag(markup) {
  let contents = markup.slice(1, -1);
  let selfClosing = false;

  if (/\/\s*$/u.test(contents)) {
    selfClosing = true;
    contents = contents.replace(/\/\s*$/u, '');
  }

  let cursor = 0;
  const name = contents.match(XML_NAME)?.[0] ?? '';
  if (!name) {
    throw new Error('invalid XML element name');
  }
  cursor = name.length;
  const attributes = new Map();

  while (cursor < contents.length) {
    const whitespace = contents.slice(cursor).match(/^\s+/u)?.[0] ?? '';
    if (!whitespace) {
      throw new Error(`expected whitespace after ${name}`);
    }
    cursor += whitespace.length;
    if (cursor >= contents.length) {
      break;
    }

    const attributeName = contents.slice(cursor).match(XML_NAME)?.[0] ?? '';
    if (!attributeName) {
      throw new Error(`invalid attribute on ${name}`);
    }
    if (attributes.has(attributeName)) {
      throw new Error(`duplicate attribute ${attributeName} on ${name}`);
    }
    cursor += attributeName.length;
    cursor += contents.slice(cursor).match(/^\s*/u)?.[0].length ?? 0;
    if (contents[cursor] !== '=') {
      throw new Error(`attribute ${attributeName} must have a value`);
    }
    cursor += 1;
    cursor += contents.slice(cursor).match(/^\s*/u)?.[0].length ?? 0;

    const quote = contents[cursor];
    if (quote !== '"' && quote !== "'") {
      throw new Error(`attribute ${attributeName} must be quoted`);
    }
    const valueStart = cursor + 1;
    const valueEnd = contents.indexOf(quote, valueStart);
    if (valueEnd === -1) {
      throw new Error(`unterminated attribute ${attributeName}`);
    }
    const rawValue = contents.slice(valueStart, valueEnd);
    if (rawValue.includes('<')) {
      throw new Error('raw < is not allowed in an XML attribute');
    }

    attributes.set(attributeName, decodeXml(rawValue));
    cursor = valueEnd + 1;
  }

  return {
    attributes,
    children: [],
    content: [],
    name,
    selfClosing,
  };
}

function parseXml(source) {
  const xml = source.replace(/^\uFEFF/u, '');
  validateRawXmlCharacters(xml);
  const stack = [];
  let root;
  let cursor = 0;

  while (cursor < xml.length) {
    if (xml.startsWith('<!--', cursor)) {
      const end = xml.indexOf('-->', cursor + 4);
      if (end === -1) {
        throw new Error('unterminated XML comment');
      }
      const comment = xml.slice(cursor + 4, end);
      if (comment.includes('--')) {
        throw new Error('XML comments must not contain --');
      }
      if (comment.endsWith('-')) {
        throw new Error('XML comments must not end with -');
      }
      cursor = end + 3;
      continue;
    }

    if (xml.startsWith('<?', cursor)) {
      const end = xml.indexOf('?>', cursor + 2);
      if (end === -1) {
        throw new Error('unterminated XML processing instruction');
      }
      cursor = end + 2;
      continue;
    }

    if (xml.startsWith('<![CDATA[', cursor)) {
      if (stack.length === 0) {
        throw new Error('CDATA must be inside an XML element');
      }
      const end = xml.indexOf(']]>', cursor + 9);
      if (end === -1) {
        throw new Error('unterminated CDATA section');
      }
      stack.at(-1).content.push(xml.slice(cursor + 9, end));
      cursor = end + 3;
      continue;
    }

    if (xml[cursor] !== '<') {
      const nextTag = xml.indexOf('<', cursor);
      const end = nextTag === -1 ? xml.length : nextTag;
      const value = xml.slice(cursor, end);
      if (value.includes(']]>')) {
        throw new Error(']]> is not allowed in normal XML character data');
      }

      if (stack.length === 0) {
        if (value.trim()) {
          throw new Error('text is not allowed outside the document root');
        }
      } else {
        stack.at(-1).content.push(decodeXml(value));
      }
      cursor = end;
      continue;
    }

    if (xml.startsWith('</', cursor)) {
      const end = readMarkupEnd(xml, cursor + 2);
      const contents = xml.slice(cursor + 2, end).trim();
      const closingName = contents.match(XML_NAME)?.[0] ?? '';
      if (!closingName || closingName.length !== contents.length) {
        throw new Error('invalid XML closing tag');
      }
      const openElement = stack.pop();
      if (!openElement || openElement.name !== closingName) {
        throw new Error(
          `closing tag ${closingName} does not match ${openElement?.name ?? 'the document root'}`,
        );
      }
      cursor = end + 1;
      continue;
    }

    if (xml.startsWith('<!', cursor)) {
      throw new Error('unsupported XML declaration');
    }

    const end = readMarkupEnd(xml, cursor + 1);
    const element = parseStartTag(xml.slice(cursor, end + 1));
    if (stack.length === 0) {
      if (root) {
        throw new Error('XML must contain exactly one document root');
      }
      root = element;
    } else {
      stack.at(-1).children.push(element);
      stack.at(-1).content.push(element);
    }
    if (!element.selfClosing) {
      stack.push(element);
    }
    cursor = end + 1;
  }

  if (stack.length > 0) {
    throw new Error(`unclosed XML element ${stack.at(-1).name}`);
  }
  if (!root) {
    throw new Error('XML document root is missing');
  }

  return root;
}

function elements(root, name) {
  const matches = [];

  function visit(element) {
    if (element.name === name) {
      matches.push(element);
    }
    for (const child of element.children) {
      visit(child);
    }
  }

  visit(root);
  return matches;
}

function textContent(element) {
  return element.content
    .map((item) => (typeof item === 'string' ? item : textContent(item)))
    .join('');
}

function normalizedLabel(value) {
  return value.replace(/\s+/gu, ' ').trim();
}

function inlineStyles(element) {
  const styles = new Map();

  for (const declaration of (element.attributes.get('style') ?? '').split(';')) {
    const separator = declaration.indexOf(':');
    if (separator === -1) {
      continue;
    }
    const name = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration
      .slice(separator + 1)
      .replace(/\s*!important\s*$/iu, '')
      .trim();
    if (name) {
      styles.set(name, value);
    }
  }

  return styles;
}

function presentationValue(element, name) {
  const styles = inlineStyles(element);
  return styles.has(name)
    ? styles.get(name)
    : (element.attributes.get(name) ?? '');
}

function isZeroOpacity(value) {
  const normalized = value.trim().replace(/%$/u, '');
  return normalized !== '' && Number(normalized) === 0;
}

function inheritedPresentationValue(element, parentState, name, initialValue) {
  const ownValue = presentationValue(element, name).trim().toLowerCase();
  return ownValue || parentState?.[name] || initialValue;
}

function presentationState(element, parentState) {
  return {
    fill: inheritedPresentationValue(element, parentState, 'fill', 'black'),
    'fill-opacity': inheritedPresentationValue(
      element,
      parentState,
      'fill-opacity',
      '1',
    ),
    stroke: inheritedPresentationValue(element, parentState, 'stroke', 'none'),
    'stroke-opacity': inheritedPresentationValue(
      element,
      parentState,
      'stroke-opacity',
      '1',
    ),
    visibility: inheritedPresentationValue(
      element,
      parentState,
      'visibility',
      'visible',
    ),
  };
}

function hidesSvgSubtree(element) {
  return (
    NON_RENDERED_SVG_CONTAINERS.has(element.name) ||
    element.attributes.get('aria-hidden')?.trim().toLowerCase() === 'true' ||
    presentationValue(element, 'display').trim().toLowerCase() === 'none' ||
    isZeroOpacity(presentationValue(element, 'opacity'))
  );
}

function paintsText(state) {
  const fillIsPainted =
    state.fill !== 'none' && !isZeroOpacity(state['fill-opacity']);
  const strokeIsPainted =
    state.stroke !== 'none' && !isZeroOpacity(state['stroke-opacity']);

  return (
    state.visibility !== 'hidden' &&
    state.visibility !== 'collapse' &&
    (fillIsPainted || strokeIsPainted)
  );
}

function visibleTextContent(element, state, hiddenByAncestor) {
  const hidden = hiddenByAncestor || hidesSvgSubtree(element);
  const textIsPainted = !hidden && paintsText(state);

  return element.content
    .map((item) => {
      if (typeof item === 'string') {
        return textIsPainted ? item : '';
      }
      const childState = presentationState(item, state);
      return visibleTextContent(item, childState, hidden);
    })
    .join('');
}

function visibleSvgTextLabels(svgRoot) {
  const labels = [];

  function visit(element, parentState, hiddenByAncestor) {
    const state = presentationState(element, parentState);
    const hidden = hiddenByAncestor || hidesSvgSubtree(element);
    if (element.name === 'text' && !hidden) {
      const label = normalizedLabel(
        visibleTextContent(element, state, hiddenByAncestor),
      );
      if (label) {
        labels.push(label);
      }
    }
    for (const child of element.children) {
      visit(child, state, hidden);
    }
  }

  visit(svgRoot, undefined, false);
  return labels;
}

function slug(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function hasNamedDiagram(drawioRoot) {
  return elements(drawioRoot, 'diagram').some((diagram) =>
    diagram.attributes.get('name')?.trim(),
  );
}

function hasHtmlCellValue(drawioRoot) {
  return elements(drawioRoot, 'mxCell').some((cell) =>
    /<[^>]+>/u.test(cell.attributes.get('value') ?? ''),
  );
}

function hasAccessibleMetadata(svgRoot) {
  const titles = elements(svgRoot, 'title');
  const descriptions = elements(svgRoot, 'desc');
  const title = titles.find((element) => normalizedLabel(textContent(element)));
  const description = descriptions.find((element) =>
    normalizedLabel(textContent(element)),
  );
  const titleId = title?.attributes.get('id') ?? '';
  const descriptionId = description?.attributes.get('id') ?? '';
  const labelledBy = (svgRoot.attributes.get('aria-labelledby') ?? '')
    .trim()
    .split(/\s+/u);

  return Boolean(
    titleId &&
      descriptionId &&
      svgRoot.attributes.get('role') === 'img' &&
      labelledBy.includes(titleId) &&
      labelledBy.includes(descriptionId),
  );
}

async function validatePair({drawioPath, svgPath, labels}) {
  const errors = [];
  let drawio = '';
  let svg = '';
  let drawioRoot;
  let svgRoot;

  try {
    drawio = await readFile(drawioPath, 'utf8');
  } catch {
    errors.push(`Cannot read Draw.io source: ${drawioPath}`);
  }

  try {
    svg = await readFile(svgPath, 'utf8');
  } catch {
    errors.push(`Cannot read SVG publication: ${svgPath}`);
  }

  if (drawioPath && svgPath && slug(drawioPath) !== slug(svgPath)) {
    errors.push('Draw.io and SVG must have a matching slug');
  }

  if (drawio) {
    try {
      drawioRoot = parseXml(drawio);
    } catch (error) {
      errors.push(
        `Draw.io source must be well-formed XML in the supported subset: ${error.message}`,
      );
    }
  }
  if (svg) {
    try {
      svgRoot = parseXml(svg);
    } catch (error) {
      errors.push(
        `Published SVG must be well-formed XML in the supported subset: ${error.message}`,
      );
    }
  }

  if (drawioRoot && drawioRoot.name !== 'mxfile') {
    errors.push('Draw.io source must be XML rooted at mxfile');
  }
  if (drawioRoot?.name === 'mxfile' && !hasNamedDiagram(drawioRoot)) {
    errors.push('Draw.io source must contain a named diagram page');
  }
  if (drawioRoot?.name === 'mxfile' && hasHtmlCellValue(drawioRoot)) {
    errors.push('Draw.io must not contain HTML in mxCell.value');
  }

  if (svgRoot && svgRoot.name !== 'svg') {
    errors.push('Published SVG must be XML rooted at svg');
  }
  if (svgRoot?.name === 'svg' && !svgRoot.attributes.get('viewBox')) {
    errors.push('SVG root must include a viewBox');
  }
  if (
    svgRoot?.name === 'svg' &&
    (svgRoot.attributes.has('width') || svgRoot.attributes.has('height'))
  ) {
    errors.push('SVG root must not include fixed root width or height');
  }
  if (svgRoot?.name === 'svg' && !hasAccessibleMetadata(svgRoot)) {
    errors.push('SVG must include an accessible title and description');
  }

  const drawioLabels = new Set(
    drawioRoot?.name === 'mxfile'
      ? elements(drawioRoot, 'mxCell')
          .map((cell) => normalizedLabel(cell.attributes.get('value') ?? ''))
          .filter(Boolean)
      : [],
  );
  const svgLabels = new Set(
    svgRoot?.name === 'svg' ? visibleSvgTextLabels(svgRoot) : [],
  );

  for (const label of labels) {
    if (!drawioLabels.has(label) || !svgLabels.has(label)) {
      errors.push(
        `Required label "${label}" must appear as a Draw.io mxCell.value and visible SVG text`,
      );
    }
  }

  return errors;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.errors.length > 0) {
    for (const error of options.errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  const errors = await validatePair(options);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${slug(options.drawioPath)}`);
}

await main();
