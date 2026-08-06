#!/usr/bin/env node

import {lstat, readdir, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {loadTerminologyRegistry} from './terminology-registry.mjs';
import {citationMatchesSource, parseSourceLedger} from './source-ledger.mjs';
import {
  extractMermaidLabels,
  extractVisibleTsxStrings,
  normalizeMdxSource,
  parseMdxAst,
  parseMdxVisibleCopy,
} from './visible-copy.mjs';

export const defaultPaths = [
  'README.md',
  'content',
  'src/pages',
  'src/components',
  'diagrams',
  'static/img',
];

const supportedExtensions = new Set(['.md', '.mdx', '.tsx', '.svg', '.drawio']);
export const terminologyRuleOrder = [
  'registry-error',
  'parse-error',
  'bare-english-term',
  'first-use-required',
  'unknown-english-term',
  'invalid-suppression',
];
const ruleOrder = new Map(terminologyRuleOrder.map((ruleId, index) => [ruleId, index]));
const suppressibleRules = new Set([
  'bare-english-term',
  'first-use-required',
  'unknown-english-term',
]);
const kindOrder = new Map([
  ['front-matter', 0],
  ['body', 1],
  ['mermaid', 2],
  ['tsx', 3],
  ['drawio', 4],
  ['svg', 5],
]);

const issue = (file, line, ruleId, matched, expected) => ({
  file,
  line,
  ruleId,
  matched,
  expected,
});

const registryIssue = (message) => {
  const separator = message.indexOf(':');
  const file = separator === -1 ? 'data/terminology.json' : message.slice(0, separator);
  return issue(file, 1, 'registry-error', message, 'a valid terminology registry');
};

const compareIssues = (left, right) => (
  left.file.localeCompare(right.file, 'en')
  || left.line - right.line
  || (ruleOrder.get(left.ruleId) ?? Number.MAX_SAFE_INTEGER)
    - (ruleOrder.get(right.ruleId) ?? Number.MAX_SAFE_INTEGER)
  || left.matched.localeCompare(right.matched, 'en')
  || left.expected.localeCompare(right.expected, 'en')
);

export const buildLineOffsets = (source) => {
  const offsets = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) offsets.push(index + 1);
  }
  return offsets;
};

export const lineFromOffsets = (offsets, offset) => {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (offsets[middle] <= offset) low = middle + 1;
    else high = middle;
  }
  return Math.max(1, low);
};

const visitAst = (node, visit) => {
  visit(node);
  for (const child of node.children ?? []) visitAst(child, visit);
};

const blankAstRange = (characters, node) => {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (!Number.isInteger(start) || !Number.isInteger(end)) return;
  for (let index = start; index < end; index += 1) {
    if (characters[index] !== '\n' && characters[index] !== '\r') characters[index] = ' ';
  }
};

const officialCitation = (url, sources) => sources.some(
  (source) => citationMatchesSource(url, source),
);

const markdownStructure = (source, relativePath, sources) => {
  const normalized = normalizeMdxSource(source, relativePath).source;
  const ast = parseMdxAst(normalized, relativePath);
  const definitions = new Map();
  const quoteLines = [];
  visitAst(ast, (node) => {
    if (node.type === 'definition') definitions.set(node.identifier, node.url);
    if (node.type === 'blockquote') {
      quoteLines.push([node.position.start.line, node.position.end.line]);
    }
  });
  const characters = normalized.split('');
  visitAst(ast, (node) => {
    if (node.type !== 'link' && node.type !== 'linkReference') return;
    const url = node.type === 'link' ? node.url : definitions.get(node.identifier);
    if (!officialCitation(url, sources)) return;
    for (const child of node.children ?? []) blankAstRange(characters, child);
  });
  return {normalized, protectedSource: characters.join(''), quoteLines};
};

const collectMarkdownRecords = (source, relativePath, sources) => {
  const structure = markdownStructure(source, relativePath, sources);
  const parsed = parseMdxVisibleCopy(structure.protectedSource, relativePath);
  const outsideQuotes = (record) => !structure.quoteLines.some(
    ([start, end]) => record.line >= start && record.line <= end,
  );
  return {
    records: [
      ...parsed.frontMatter,
      ...parsed.blocks.filter(outsideQuotes),
      ...extractMermaidLabels(source, relativePath).filter(outsideQuotes),
    ],
    normalizedSource: structure.normalized,
  };
};

const decodeXmlEntities = (value, relativePath, line) => {
  const invalid = value.match(/&([^;\s<]*);/u);
  if (invalid && !/^&(?:#(?:x[\da-f]+|\d+)|amp|lt|gt|quot|apos);$/iu.test(invalid[0])) {
    throw new Error(`${relativePath}:${line}: XML parser failed: unknown entity "${invalid[0]}"`);
  }
  if (/&(?!#(?:x[\da-f]+|\d+);|(?:amp|lt|gt|quot|apos);)/iu.test(value)) {
    throw new Error(`${relativePath}:${line}: XML parser failed: unescaped ampersand`);
  }
  return value.replace(
    /&(#(?:x[\da-f]+|\d+)|amp|lt|gt|quot|apos);/giu,
  (_match, entity) => {
    const named = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"};
    if (!entity.startsWith('#')) return named[entity.toLowerCase()];
    const hexadecimal = entity[1].toLowerCase() === 'x';
    const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    if (!Number.isInteger(codePoint) || !allowedXmlCodePoint(codePoint)) {
      throw new Error(`${relativePath}:${line}: XML parser failed: invalid character reference`);
    }
    return String.fromCodePoint(codePoint);
  },
  );
};

const allowedXmlCodePoint = (codePoint) => (
  codePoint === 0x9
  || codePoint === 0xA
  || codePoint === 0xD
  || (codePoint >= 0x20 && codePoint <= 0xD7FF)
  || (codePoint >= 0xE000 && codePoint <= 0xFFFD)
  || (codePoint >= 0x10000 && codePoint <= 0x10FFFF)
);

const validateXmlCharacters = (source, relativePath) => {
  for (const character of source) {
    const codePoint = character.codePointAt(0);
    if (!allowedXmlCodePoint(codePoint)) {
      throw new Error(
        `${relativePath}:1: XML parser failed: forbidden XML 1.0 character U+${codePoint.toString(16).toUpperCase()}`,
      );
    }
  }
};

const qualifiedName = (name) => {
  const parts = name.split(':');
  if (parts.length > 2 || parts.some((part) => !/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(part))) {
    return null;
  }
  return parts.length === 1
    ? {prefix: '', localName: parts[0]}
    : {prefix: parts[0], localName: parts[1]};
};

const parseAttributes = (tag, relativePath, line) => {
  const attributes = new Map();
  const nameEnd = tag.search(/[\s/>]/u);
  const tail = tag.slice(nameEnd === -1 ? tag.length : nameEnd);
  const attributePattern = /([^\s=/>]+)\s*=\s*("[^"]*"|'[^']*')/gu;
  let cursor = 0;
  for (const match of tail.matchAll(attributePattern)) {
    const between = tail.slice(cursor, match.index).replace(/^\s+|\s+$/gu, '');
    if (between && between !== '/') {
      throw new Error(`${relativePath}:${line}: XML parser failed: malformed attribute`);
    }
    if (attributes.has(match[1])) {
      throw new Error(`${relativePath}:${line}: XML parser failed: duplicate attribute "${match[1]}"`);
    }
    if (!qualifiedName(match[1])) {
      throw new Error(`${relativePath}:${line}: XML parser failed: invalid attribute name "${match[1]}"`);
    }
    const rawValue = match[2].slice(1, -1);
    if (rawValue.includes('<')) {
      throw new Error(`${relativePath}:${line}: XML parser failed: raw < in attribute value`);
    }
    attributes.set(match[1], decodeXmlEntities(rawValue, relativePath, line));
    cursor = match.index + match[0].length;
  }
  const remainder = tail.slice(cursor).replace(/^\s+|\s+$/gu, '');
  if (remainder && remainder !== '/' && remainder !== '>') {
    throw new Error(`${relativePath}:${line}: XML parser failed: malformed attribute`);
  }
  return attributes;
};

const stripMarkup = (value) => value
  .replace(/<br\s*\/?>/giu, ' ')
  .replace(/<[^>]*>/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim();

const tokenizeXml = (source, relativePath, lineAt) => {
  const tokens = [];
  let cursor = 0;
  const terminated = (label, openingLength, closing) => {
    const end = source.indexOf(closing, cursor + openingLength);
    if (end === -1) {
      throw new Error(`${relativePath}:${lineAt(cursor)}: XML parser failed: unterminated ${label}`);
    }
    return end + closing.length;
  };
  while (cursor < source.length) {
    const start = cursor;
    if (source.startsWith('<!--', cursor)) {
      cursor = terminated('comment', 4, '-->');
    } else if (source.startsWith('<![CDATA[', cursor)) {
      cursor = terminated('CDATA', 9, ']]>');
    } else if (source.startsWith('<?', cursor)) {
      cursor = terminated('processing instruction', 2, '?>');
    } else if (source.startsWith('<!', cursor)) {
      throw new Error(`${relativePath}:${lineAt(cursor)}: XML parser failed: unsupported declaration`);
    } else if (source[cursor] === '<') {
      let quote = '';
      cursor += 1;
      for (; cursor < source.length; cursor += 1) {
        const character = source[cursor];
        if (quote) {
          if (character === quote) quote = '';
        } else if (character === '"' || character === "'") {
          quote = character;
        } else if (character === '>') {
          cursor += 1;
          break;
        }
      }
      if (cursor > source.length || source[cursor - 1] !== '>') {
        throw new Error(`${relativePath}:${lineAt(start)}: XML parser failed: unterminated tag`);
      }
    } else {
      const next = source.indexOf('<', cursor);
      cursor = next === -1 ? source.length : next;
    }
    tokens.push({index: start, token: source.slice(start, cursor)});
  }
  return tokens;
};

const parseXmlVisibleCopy = (source, relativePath, type) => {
  validateXmlCharacters(source, relativePath);
  const lineOffsets = buildLineOffsets(source);
  const lineAt = (offset) => lineFromOffsets(lineOffsets, offset);
  const records = [];
  const suppressionComments = [];
  const stack = [];
  let cursor = 0;
  let textBuffer = null;
  let roots = 0;
  let rootElement = null;
  let diagrams = 0;
  let compressedDiagram = false;
  const svgNamespace = 'http://www.w3.org/2000/svg';

  const styleValue = (attributes, name) => {
    const declaration = (attributes.get('style') ?? '').split(';').find((part) => (
      part.slice(0, part.indexOf(':')).trim().toLowerCase() === name
    ));
    if (declaration) return declaration.slice(declaration.indexOf(':') + 1).trim().toLowerCase();
    return (attributes.get(name) ?? '').trim().toLowerCase();
  };

  const zeroOpacity = (value) => {
    const normalized = value.trim().replace(/%$/u, '');
    return normalized !== '' && Number(normalized) === 0;
  };

  const hiddenByAttributes = (attributes) => {
    const visibility = styleValue(attributes, 'visibility');
    return styleValue(attributes, 'display') === 'none'
      || visibility === 'hidden'
      || visibility === 'collapse'
      || zeroOpacity(styleValue(attributes, 'opacity'))
      || attributes.get('aria-hidden')?.trim().toLowerCase() === 'true';
  };

  const presentation = (attributes, parent) => {
    const inherited = (name, initial) => styleValue(attributes, name) || parent?.[name] || initial;
    return {
      fill: inherited('fill', 'black'),
      fillOpacity: inherited('fill-opacity', '1'),
      stroke: inherited('stroke', 'none'),
      strokeOpacity: inherited('stroke-opacity', '1'),
    };
  };

  const paintsText = (state) => {
    const fill = state.fill !== 'none' && !zeroOpacity(state.fillOpacity);
    const stroke = state.stroke !== 'none' && !zeroOpacity(state.strokeOpacity);
    return fill || stroke;
  };

  for (const {index, token} of tokenizeXml(source, relativePath, lineAt)) {
    if (index !== cursor) {
      throw new Error(`${relativePath}:${lineAt(cursor)}: XML parser failed: unparsed input`);
    }
    cursor = index + token.length;
    const line = lineAt(index);
    if (token.startsWith('<!--')) {
      if (!token.endsWith('-->') || /--(?:[^>]|$)/u.test(token.slice(4, -3))) {
        throw new Error(`${relativePath}:${line}: XML parser failed: malformed comment`);
      }
      if (token.includes('terminology-exempt')) {
        const lineStart = lineOffsets[line - 1];
        const newline = source.indexOf('\n', lineStart);
        const lineEnd = newline === -1 ? source.length : newline;
        suppressionComments.push({
          raw: token.trim(),
          line,
          exclusive: source.slice(lineStart, lineEnd).trim() === token,
        });
      }
      continue;
    }
    if (token.startsWith('<?') || /^<!DOCTYPE/iu.test(token)) continue;
    if (token.startsWith('<![CDATA[')) {
      if (stack.length === 0) {
        throw new Error(`${relativePath}:${line}: XML parser failed: CDATA outside root element`);
      }
      const value = token.slice(9, -3);
      if (textBuffer && stack.at(-1)?.painted) textBuffer.value += value;
      if (type === 'drawio' && value.trim() && stack.at(-1)?.localName === 'diagram') {
        compressedDiagram = true;
      }
      continue;
    }
    if (!token.startsWith('<')) {
      const decoded = decodeXmlEntities(token, relativePath, line);
      if (textBuffer && stack.at(-1)?.painted) {
        textBuffer.value += decoded;
      }
      else if (decoded.trim() && stack.length === 0) {
        throw new Error(`${relativePath}:${line}: XML parser failed: text outside root element`);
      }
      if (type === 'drawio' && decoded.trim() && stack.at(-1)?.localName === 'diagram') {
        compressedDiagram = true;
      }
      if (token.includes(']]>')) {
        throw new Error(`${relativePath}:${line}: XML parser failed: ]]> outside CDATA`);
      }
      continue;
    }
    if (token.startsWith('</')) {
      const name = token.match(/^<\/\s*([^\s>]+)\s*>$/u)?.[1];
      const current = stack.pop();
      if (!name || !current || current.name !== name) {
        throw new Error(`${relativePath}:${line}: XML parser failed: mismatched closing tag`);
      }
      if (type === 'drawio' && current.localName === 'diagram') {
        if (compressedDiagram) {
          throw new Error(`${relativePath}:${line}: XML parser failed: compressed Draw.io diagrams are unsupported`);
        }
        if (!current.namedDiagram || !current.hasGraphModel) {
          throw new Error(`${relativePath}:${line}: XML parser failed: named diagram with mxGraphModel required`);
        }
      }
      if (type === 'svg' && current.namespace === svgNamespace && current.localName === 'text' && textBuffer) {
        const text = textBuffer.value.replace(/\s+/gu, ' ').trim();
        if (text) {
          records.push({file: relativePath, line: textBuffer.line, text, excerpt: text, kind: 'svg'});
        }
        textBuffer = null;
      }
      continue;
    }

    const parsed = token.match(/^<\s*([^\s/>]+)[\s\S]*?>$/u);
    if (!parsed) throw new Error(`${relativePath}:${line}: XML parser failed: malformed tag`);
    const name = parsed[1];
    const parsedName = qualifiedName(name);
    if (!parsedName) throw new Error(`${relativePath}:${line}: XML parser failed: invalid qualified name`);
    const attributes = parseAttributes(token.slice(1, -1), relativePath, line);
    if (stack.length === 0) roots += 1;
    if (roots > 1) throw new Error(`${relativePath}:${line}: XML parser failed: multiple root elements`);
    const parent = stack.at(-1);
    const namespaces = new Map(parent?.namespaces ?? []);
    for (const [attribute, value] of attributes) {
      if (attribute === 'xmlns') namespaces.set('', value);
      else if (attribute.startsWith('xmlns:')) namespaces.set(attribute.slice(6), value);
    }
    for (const [attribute] of attributes) {
      if (!attribute.startsWith('xmlns') && attribute.includes(':')) {
        const attributeName = qualifiedName(attribute);
        if (!attributeName || (attributeName.prefix !== 'xml' && !namespaces.has(attributeName.prefix))) {
          throw new Error(`${relativePath}:${line}: XML parser failed: undeclared attribute namespace`);
        }
      }
    }
    if (parsedName.prefix && !namespaces.has(parsedName.prefix)) {
      throw new Error(`${relativePath}:${line}: XML parser failed: undeclared element namespace`);
    }
    const namespace = namespaces.get(parsedName.prefix) ?? '';
    const parentHidden = parent?.hidden ?? false;
    const state = presentation(attributes, parent?.state);
    const hidden = parentHidden
      || hiddenByAttributes(attributes)
      || (type === 'svg' && namespace === svgNamespace && [
        'defs', 'metadata', 'title', 'desc', 'script', 'style', 'symbol', 'clipPath',
        'mask', 'pattern', 'marker',
      ].includes(parsedName.localName));
    const painted = !hidden && paintsText(state);
    const selfClosing = /\/\s*>$/u.test(token);

    if (roots === 1 && !rootElement) {
      rootElement = {namespace, localName: parsedName.localName};
    }
    if (type === 'drawio' && namespace === '' && parsedName.localName === 'diagram') {
      diagrams += 1;
      if (selfClosing) {
        throw new Error(`${relativePath}:${line}: XML parser failed: named diagram with mxGraphModel required`);
      }
    }
    if (type === 'drawio' && namespace === '' && parsedName.localName === 'mxGraphModel') {
      const diagram = [...stack].reverse().find((element) => element.localName === 'diagram');
      if (!diagram) {
        throw new Error(`${relativePath}:${line}: XML parser failed: mxGraphModel must be inside diagram`);
      }
      diagram.hasGraphModel = true;
    }
    if (type === 'drawio' && namespace === '' && parsedName.localName === 'mxCell') {
      const raw = attributes.get('value') ?? '';
      if (/<[^>]+>/u.test(raw)) {
        throw new Error(`${relativePath}:${line}: XML parser failed: HTML in mxCell.value is unsupported`);
      }
      const text = stripMarkup(raw);
      if (text && !hidden && attributes.get('visible') !== '0') {
        records.push({file: relativePath, line, text, excerpt: text, kind: 'drawio'});
      }
    }
    if (type === 'svg' && namespace === svgNamespace && parsedName.localName === 'text' && !selfClosing) {
      textBuffer = {line, value: ''};
    }
    if (!selfClosing) stack.push({
      name,
      localName: parsedName.localName,
      namespace,
      namespaces,
      hidden,
      painted,
      state,
      namedDiagram: parsedName.localName === 'diagram' && Boolean((attributes.get('name') ?? '').trim()),
      hasGraphModel: false,
    });
  }

  if (cursor !== source.length || stack.length > 0 || roots !== 1 || !source.trim().startsWith('<')) {
    throw new Error(`${relativePath}:${lineAt(cursor)}: XML parser failed: unclosed or missing root element`);
  }
  if (type === 'svg' && (rootElement?.localName !== 'svg' || rootElement.namespace !== svgNamespace)) {
    throw new Error(`${relativePath}:1: XML parser failed: SVG root must be svg in ${svgNamespace}`);
  }
  if (type === 'drawio' && (rootElement?.localName !== 'mxfile' || rootElement.namespace !== '')) {
    throw new Error(`${relativePath}:1: XML parser failed: Draw.io root must be unnamespaced mxfile`);
  }
  if (type === 'drawio' && diagrams === 0) {
    throw new Error(`${relativePath}:1: XML parser failed: named diagram with mxGraphModel required`);
  }
  return {records, suppressionComments};
};

const parseError = (file, message) => {
  const lineMatch = message.startsWith(`${file}:`)
    ? message.slice(file.length + 1).match(/^(\d+):/u)
    : null;
  return issue(
    file,
    lineMatch ? Number(lineMatch[1]) : 1,
    'parse-error',
    message,
    'a readable, supported, well-formed file inside the scan root',
  );
};

const containedBy = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

const traversesSymlink = async (root, absolute) => {
  const relative = path.relative(root, absolute);
  let cursor = root;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    try {
      if ((await lstat(cursor)).isSymbolicLink()) return true;
    } catch {
      return false;
    }
  }
  return false;
};

const scanTarget = async (root, target, files, errors, explicit = false) => {
  const absolute = path.resolve(root, target);
  if (!containedBy(root, absolute)) {
    errors.push(parseError(target, `${target}: scan path escapes root`));
    return;
  }
  if (await traversesSymlink(root, absolute)) {
    errors.push(parseError(target, `${target}: symbolic links are not allowed`));
    return;
  }
  let metadata;
  try {
    metadata = await lstat(absolute);
  } catch (error) {
    errors.push(parseError(target, `${target}: unable to read: ${error.message}`));
    return;
  }
  if (metadata.isSymbolicLink()) {
    errors.push(parseError(target, `${target}: symbolic links are not allowed`));
    return;
  }
  let resolved;
  try {
    resolved = await realpath(absolute);
  } catch (error) {
    errors.push(parseError(target, `${target}: unable to resolve: ${error.message}`));
    return;
  }
  if (!containedBy(root, resolved)) {
    errors.push(parseError(target, `${target}: resolved path escapes root`));
    return;
  }
  const display = path.relative(root, absolute) || '.';
  if (metadata.isFile()) {
    if (!supportedExtensions.has(path.extname(display).toLowerCase())) {
      if (explicit) errors.push(parseError(display, `${display}: unsupported file type`));
    } else {
      files.add(display);
    }
    return;
  }
  if (!metadata.isDirectory()) {
    errors.push(parseError(display, `${display}: scan target is neither a file nor directory`));
    return;
  }
  const before = files.size;
  const errorCount = errors.length;
  let entries;
  try {
    entries = await readdir(absolute, {withFileTypes: true});
  } catch (error) {
    errors.push(parseError(display, `${display}: unable to list directory: ${error.message}`));
    return;
  }
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    if (entry.name.startsWith('.')) continue;
    await scanTarget(root, path.join(display, entry.name), files, errors, false);
  }
  if (explicit && files.size === before && errors.length === errorCount) {
    errors.push(parseError(display, `${display}: path contains no supported files`));
  }
};

const loadCitationSources = async (root) => {
  try {
    const value = JSON.parse(await readFile(path.join(root, 'data/source-ledger.json'), 'utf8'));
    const parsed = parseSourceLedger(value);
    return parsed.errors.length === 0 ? parsed.ledger.sources : [];
  } catch {
    return [];
  }
};

const collectVisibleRecords = async (root, paths) => {
  const resolvedRoot = await realpath(root);
  const fileSet = new Set();
  const errors = [];
  for (const target of [...new Set(paths)]) {
    await scanTarget(resolvedRoot, target, fileSet, errors, true);
  }
  const files = [...fileSet].sort((left, right) => left.localeCompare(right, 'en'));
  const citationSources = await loadCitationSources(resolvedRoot);
  const output = [];
  for (const file of files) {
    let source;
    try {
      source = await readFile(path.join(resolvedRoot, file), 'utf8');
      const extension = path.extname(file).toLowerCase();
      let collected;
      if (extension === '.md' || extension === '.mdx') {
        collected = collectMarkdownRecords(source, file, citationSources);
      } else if (extension === '.tsx') {
        collected = {records: extractVisibleTsxStrings(source, file)};
      } else {
        collected = parseXmlVisibleCopy(source, file, extension.slice(1));
      }
      collected.records.sort((left, right) => (
        left.line - right.line
        || (kindOrder.get(left.kind) ?? 99) - (kindOrder.get(right.kind) ?? 99)
      ));
      collected.records.forEach((record, recordIndex) => {
        record.recordIndex = recordIndex;
      });
      output.push({file, source, ...collected});
    } catch (error) {
      errors.push(parseError(file, error.message));
      output.push({file, source: source ?? '', records: []});
    }
  }
  return {files: output, issues: errors};
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
const aliasPattern = (alias, flags = 'gu') => new RegExp(
  `(?<![A-Za-z0-9_])${escapeRegex(alias)}(?![A-Za-z0-9_])`,
  flags,
);

const matchRanges = (text, value) => [...text.matchAll(aliasPattern(value))]
  .map((match) => ({start: match.index, end: match.index + match[0].length, matched: match[0]}));
const insideAny = (range, containers) => containers.some(
  ({start, end}) => range.start >= start && range.end <= end,
);

const termForms = (term) => [...new Set([
  term.first_use,
  term.canonical_zh,
  ...(term.subsequent_use ?? []),
  ...(term.allowed_aliases ?? []),
  ...(term.forbidden_aliases ?? []),
  ...(term.english ? [term.english] : []),
  ...(term.acronym ? [term.acronym] : []),
])].sort((left, right) => right.length - left.length || left.localeCompare(right, 'en'));

const inspectFirstUse = (record, registry, introduced) => {
  const issues = [];
  for (const term of registry.registry.terms) {
    const fullRanges = matchRanges(record.text, term.first_use);
    const candidates = [...new Set([
      term.canonical_zh,
      ...(term.subsequent_use ?? []),
      ...(term.allowed_aliases ?? []),
      ...(term.acronym ? [term.acronym] : []),
    ])]
      .flatMap((value) => matchRanges(record.text, value))
      .filter((range) => !insideAny(range, fullRanges))
      .sort((left, right) => left.start - right.start || right.end - left.end);
    const events = [
      ...fullRanges.map((range) => ({...range, type: 'full'})),
      ...candidates.map((range) => ({...range, type: 'short'})),
    ].sort((left, right) => left.start - right.start || (left.type === 'full' ? -1 : 1));
    let ready = introduced.has(term.id);
    for (const event of events) {
      if (event.type === 'full') {
        ready = true;
        introduced.add(term.id);
      } else if (!ready) {
        issues.push(issue(record.file, record.line, 'first-use-required', event.matched, term.first_use));
      }
    }
  }
  return issues;
};

const inspectBareAliases = (record, registry) => {
  const issues = [];
  for (const term of registry.registry.terms) {
    const fullRanges = matchRanges(record.text, term.first_use);
    for (const alias of term.forbidden_aliases) {
      for (const range of matchRanges(record.text, alias)) {
        if (!insideAny(range, fullRanges)) {
          issues.push(issue(record.file, record.line, 'bare-english-term', range.matched, term.first_use));
        }
      }
    }
  }
  return issues;
};

const blankRange = (characters, start, end) => {
  for (let index = start; index < end; index += 1) characters[index] = '\uFFFF';
};

const inspectUnknownEnglish = (record, registry) => {
  const characters = record.text.split('');
  const known = registry.registry.terms.flatMap(termForms)
    .sort((left, right) => right.length - left.length || left.localeCompare(right, 'en'));
  for (const form of known) {
    for (const range of matchRanges(characters.join(''), form)) blankRange(characters, range.start, range.end);
  }
  let candidate = characters.join('');
  candidate = candidate.replace(
    /(?:https?:\/\/|mailto:|\/)[^\s，。；：！？、（）【】]+|\b[A-Za-z][A-Za-z0-9]*(?:[._][A-Za-z0-9_-]+)+\b|\b[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+\b|\b[a-z][a-z0-9]*(?:[A-Z][A-Za-z0-9]*)+\b|\b(?:[A-Z][a-z0-9]+){2,}\b/gu,
    (match) => '\uFFFF'.repeat(match.length),
  );
  const phrasePattern = /(?<![A-Za-z0-9_])[A-Za-z][A-Za-z0-9]*(?:[-/][A-Za-z0-9]+)*(?:[ \t]+[A-Za-z][A-Za-z0-9]*(?:[-/][A-Za-z0-9]+)*)*(?![A-Za-z0-9_])/gu;
  return [...candidate.matchAll(phrasePattern)].map((match) => issue(
    record.file,
    record.line,
    'unknown-english-term',
    match[0],
    'register the term or use Chinese reader-facing copy',
  ));
};

const classifySuppression = ({raw, file, line, exclusive}) => {
  const exact = raw.match(
    /^<!--\s*terminology-exempt:\s*([^|\s]+)\s*\|\s*reason:\s*(.*?)\s*-->$/u,
  );
  if (!exclusive || !exact || !suppressibleRules.has(exact[1]) || exact[2].trim() === '') {
    return {file, line, valid: false, matched: raw};
  }
  return {file, line, valid: true, ruleId: exact[1], matched: raw};
};

const parseSuppressions = (fileEntry) => {
  const xmlSuppressions = (fileEntry.suppressionComments ?? []).map((comment) => (
    classifySuppression({...comment, file: fileEntry.file})
  ));
  if (!fileEntry.normalizedSource) return xmlSuppressions;
  const {source, file, normalizedSource} = fileEntry;
  const lineOffsets = buildLineOffsets(source);
  const suppressions = [];
  for (const match of source.matchAll(/<!--[\s\S]*?-->/gu)) {
    if (!match[0].includes('terminology-exempt')) continue;
    const candidate = source.split('');
    const probe = 'SUPPRESSION';
    for (let index = 0; index < match[0].length; index += 1) {
      candidate[match.index + index] = probe[index] ?? ' ';
    }
    let candidateNormalized;
    try {
      candidateNormalized = normalizeMdxSource(candidate.join(''), file).source;
    } catch {
      continue;
    }
    const originalRange = normalizedSource.slice(match.index, match.index + match[0].length);
    const candidateRange = candidateNormalized.slice(match.index, match.index + match[0].length);
    const parserConfirmed = originalRange.trim() === '' && candidateRange.includes(probe);
    if (!parserConfirmed) continue;
    const line = lineFromOffsets(lineOffsets, match.index);
    const lineStart = lineOffsets[line - 1];
    const lineEnd = source.indexOf('\n', lineStart) === -1
      ? source.length
      : source.indexOf('\n', lineStart);
    const exclusive = source.slice(lineStart, lineEnd).trim() === match[0];
    suppressions.push(classifySuppression({
      raw: match[0].trim(), file, line, exclusive,
    }));
  }
  return [...xmlSuppressions, ...suppressions];
};

const applySuppressions = (fileEntry, recordIssues) => {
  const invalid = [];
  const pending = parseSuppressions(fileEntry);
  for (const suppression of pending) {
    if (!suppression.valid) {
      invalid.push(issue(
        suppression.file,
        suppression.line,
        'invalid-suppression',
        suppression.matched,
        'a known rule, non-empty reason, and exactly one matching next visible record',
      ));
      continue;
    }
    const nextRecord = fileEntry.records.find((record) => record.line > suppression.line);
    const targetIndex = recordIssues.findIndex((candidate) => (
      candidate.ruleId === suppression.ruleId
      && candidate._recordIndex === nextRecord?.recordIndex
      && !candidate.suppressed
    ));
    if (targetIndex === -1) {
      invalid.push(issue(
        suppression.file,
        suppression.line,
        'invalid-suppression',
        suppression.matched,
        `the next visible record must trigger ${suppression.ruleId}`,
      ));
    } else {
      recordIssues[targetIndex].suppressed = true;
    }
  }
  return [
    ...recordIssues
      .filter(({suppressed}) => !suppressed)
      .map(({suppressed: _suppressed, _recordIndex, ...rest}) => rest),
    ...invalid,
  ];
};

export async function checkTerminology({root, paths = defaultPaths}) {
  const registry = await loadTerminologyRegistry(root);
  if (registry.errors.length > 0) {
    return {issues: registry.errors.map(registryIssue).sort(compareIssues), checkedFiles: []};
  }

  const collected = await collectVisibleRecords(root, paths);
  const issues = [];
  for (const fileEntry of collected.files) {
    const introduced = new Set();
    const fileIssues = [];
    for (const record of fileEntry.records) {
      const inspected = [
        ...inspectBareAliases(record, registry),
        ...inspectFirstUse(record, registry, introduced),
        ...inspectUnknownEnglish(record, registry),
      ];
      for (const candidate of inspected) candidate._recordIndex = record.recordIndex;
      fileIssues.push(...inspected);
    }
    issues.push(...applySuppressions(fileEntry, fileIssues));
  }
  return {
    issues: [...collected.issues, ...issues].sort(compareIssues),
    checkedFiles: collected.files.map(({file}) => file),
  };
}

const parseCliPaths = (arguments_) => {
  let paths = defaultPaths;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--paths') {
      const value = arguments_[index + 1];
      if (!value) throw new Error('--paths requires a comma-separated value');
      paths = value.split(',').map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (argument.startsWith('--paths=')) {
      paths = argument.slice('--paths='.length).split(',').map((item) => item.trim()).filter(Boolean);
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (paths.length === 0) throw new Error('--paths must contain at least one path');
  return paths;
};

export async function runTerminologyCli(arguments_, root = process.cwd()) {
  const paths = parseCliPaths(arguments_);
  const result = await checkTerminology({root, paths});
  if (result.issues.length > 0) {
    for (const entry of result.issues) {
      process.stdout.write(
        `${entry.file}:${entry.line} [${entry.ruleId}] ${JSON.stringify(entry.matched)} -> ${JSON.stringify(entry.expected)}\n`,
      );
    }
    process.stdout.write(
      `${result.issues.length} issues in ${result.checkedFiles.length} checked ${result.checkedFiles.length === 1 ? 'file' : 'files'}\n`,
    );
    return 1;
  }
  const registry = await loadTerminologyRegistry(root);
  process.stdout.write(
    `checked ${result.checkedFiles.length} ${result.checkedFiles.length === 1 ? 'file' : 'files'} with ${registry.registry.terms.length} registered terms; 0 issues\n`,
  );
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runTerminologyCli(process.argv.slice(2))
    .then((status) => {
      process.exitCode = status;
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
