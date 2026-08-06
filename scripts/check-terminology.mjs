#!/usr/bin/env node

import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {loadTerminologyRegistry} from './terminology-registry.mjs';
import {
  extractMermaidLabels,
  extractVisibleTsxStrings,
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
const ruleOrder = new Map([
  ['registry-error', 0],
  ['bare-english-term', 1],
  ['first-use-required', 2],
  ['unknown-english-term', 3],
  ['invalid-suppression', 4],
]);
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

const lineAtOffset = (source, offset) => source.slice(0, offset).split('\n').length;
const blank = (value) => value.replace(/[^\r\n]/gu, ' ');

const maskExternalCitationTitles = (source) => source.replace(
  /(?<!!)\[([^\]\n]+)\]\((?:https?:\/\/|mailto:)[^)\n]+\)/gu,
  (match, title) => `[${blank(title)}]${match.slice(title.length + 2)}`,
);

const maskDirectQuotationLines = (source) => source.replace(
  /^( {0,3}>[ \t]+[^\r\n]*)$/gmu,
  (match) => blank(match),
);

const collectMarkdownRecords = (source, relativePath) => {
  const protectedSource = maskDirectQuotationLines(maskExternalCitationTitles(source));
  const parsed = parseMdxVisibleCopy(protectedSource, relativePath);
  return [
    ...parsed.frontMatter,
    ...parsed.blocks,
    ...extractMermaidLabels(source, relativePath),
  ];
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
    if (!Number.isInteger(codePoint) || codePoint > 0x10FFFF || (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
      throw new Error(`${relativePath}:${line}: XML parser failed: invalid character reference`);
    }
    return String.fromCodePoint(codePoint);
  },
  );
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
    attributes.set(match[1], decodeXmlEntities(match[2].slice(1, -1), relativePath, line));
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

const parseXmlVisibleCopy = (source, relativePath, type) => {
  const records = [];
  const stack = [];
  const tokenPattern = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[^>]*\?>|<!DOCTYPE[^>]*>|<[^>]+>|[^<]+/giu;
  let cursor = 0;
  let textBuffer = null;
  let roots = 0;

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

  for (const match of source.matchAll(tokenPattern)) {
    if (match.index !== cursor) {
      throw new Error(`${relativePath}:${lineAtOffset(source, cursor)}: XML parser failed: unparsed input`);
    }
    cursor = match.index + match[0].length;
    const token = match[0];
    const line = lineAtOffset(source, match.index);
    if (token.startsWith('<!--')) {
      if (!token.endsWith('-->') || /--(?:[^>]|$)/u.test(token.slice(4, -3))) {
        throw new Error(`${relativePath}:${line}: XML parser failed: malformed comment`);
      }
      continue;
    }
    if (token.startsWith('<?') || /^<!DOCTYPE/iu.test(token)) continue;
    if (token.startsWith('<![CDATA[')) {
      if (textBuffer && stack.at(-1)?.painted) textBuffer.value += token.slice(9, -3);
      continue;
    }
    if (!token.startsWith('<')) {
      if (textBuffer && stack.at(-1)?.painted) textBuffer.value += token;
      else if (token.trim() && stack.length === 0) {
        throw new Error(`${relativePath}:${line}: XML parser failed: text outside root element`);
      }
      continue;
    }
    if (token.startsWith('</')) {
      const name = token.match(/^<\/\s*([^\s>]+)\s*>$/u)?.[1];
      const current = stack.pop();
      if (!name || !current || current.name !== name) {
        throw new Error(`${relativePath}:${line}: XML parser failed: mismatched closing tag`);
      }
      if (type === 'svg' && current.name === 'text' && textBuffer) {
        const text = decodeXmlEntities(stripMarkup(textBuffer.value), relativePath, textBuffer.line);
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
    const attributes = parseAttributes(token.slice(1, -1), relativePath, line);
    if (stack.length === 0) roots += 1;
    if (roots > 1) throw new Error(`${relativePath}:${line}: XML parser failed: multiple root elements`);
    const parent = stack.at(-1);
    const parentHidden = parent?.hidden ?? false;
    const state = presentation(attributes, parent?.state);
    const hidden = parentHidden
      || hiddenByAttributes(attributes)
      || (type === 'svg' && [
        'defs', 'metadata', 'title', 'desc', 'script', 'style', 'symbol', 'clipPath',
        'mask', 'pattern', 'marker',
      ].includes(name));
    const painted = !hidden && paintsText(state);
    const selfClosing = /\/\s*>$/u.test(token);

    if (type === 'drawio' && name === 'mxCell') {
      const raw = attributes.get('value') ?? '';
      const text = decodeXmlEntities(stripMarkup(raw), relativePath, line);
      if (text && !hidden && attributes.get('visible') !== '0') {
        records.push({file: relativePath, line, text, excerpt: text, kind: 'drawio'});
      }
    }
    if (type === 'svg' && name === 'text' && !selfClosing) {
      textBuffer = {line, value: ''};
    }
    if (!selfClosing) stack.push({name, hidden, painted, state});
  }

  if (cursor !== source.length || stack.length > 0 || roots !== 1 || !source.trim().startsWith('<')) {
    throw new Error(`${relativePath}:${lineAtOffset(source, cursor)}: XML parser failed: unclosed or missing root element`);
  }
  return records;
};

const walk = async (root, target) => {
  const absolute = path.join(root, target);
  let metadata;
  try {
    metadata = await stat(absolute);
  } catch (error) {
    throw new Error(`${target}: unable to read: ${error.message}`, {cause: error});
  }
  if (metadata.isFile()) return supportedExtensions.has(path.extname(target).toLowerCase()) ? [target] : [];
  if (!metadata.isDirectory()) return [];
  const entries = await readdir(absolute, {withFileTypes: true});
  const nested = await Promise.all(entries
    .filter((entry) => !entry.name.startsWith('.'))
    .map((entry) => walk(root, path.join(target, entry.name))));
  return nested.flat().sort((left, right) => left.localeCompare(right, 'en'));
};

const collectVisibleRecords = async (root, paths) => {
  const files = [...new Set((await Promise.all(paths.map((target) => walk(root, target)))).flat())]
    .sort((left, right) => left.localeCompare(right, 'en'));
  const output = [];
  for (const file of files) {
    const source = await readFile(path.join(root, file), 'utf8');
    const extension = path.extname(file).toLowerCase();
    let records;
    if (extension === '.md' || extension === '.mdx') records = collectMarkdownRecords(source, file);
    else if (extension === '.tsx') records = extractVisibleTsxStrings(source, file);
    else records = parseXmlVisibleCopy(source, file, extension.slice(1));
    records.sort((left, right) => (
      left.line - right.line
      || (kindOrder.get(left.kind) ?? 99) - (kindOrder.get(right.kind) ?? 99)
    ));
    output.push({file, source, records});
  }
  return output;
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
  const characters = [...record.text];
  const known = registry.registry.terms.flatMap(termForms)
    .sort((left, right) => right.length - left.length || left.localeCompare(right, 'en'));
  for (const form of known) {
    for (const range of matchRanges(characters.join(''), form)) blankRange(characters, range.start, range.end);
  }
  let candidate = characters.join('');
  candidate = candidate.replace(
    /(?:https?:\/\/|mailto:|\/)[^\s，。；：！？、（）【】]+|\b[A-Za-z][\w]*(?:[._][A-Za-z0-9_-]+)+\b/gu,
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

const parseSuppressions = (source, file) => {
  const suppressions = [];
  for (const match of source.matchAll(/<!--[\s\S]*?-->/gu)) {
    if (!match[0].includes('terminology-exempt')) continue;
    const line = lineAtOffset(source, match.index);
    const exact = match[0].match(
      /^<!--\s*terminology-exempt:\s*([^|\s]+)\s*\|\s*reason:\s*(.*?)\s*-->$/u,
    );
    if (!exact || !suppressibleRules.has(exact[1]) || exact[2].trim() === '') {
      suppressions.push({file, line, valid: false, matched: match[0].trim()});
    } else {
      suppressions.push({file, line, valid: true, ruleId: exact[1], matched: match[0].trim()});
    }
  }
  return suppressions;
};

const applySuppressions = (fileEntry, recordIssues) => {
  const invalid = [];
  const pending = parseSuppressions(fileEntry.source, fileEntry.file);
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
      && candidate.line === nextRecord?.line
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
    ...recordIssues.filter(({suppressed}) => !suppressed).map(({suppressed: _suppressed, ...rest}) => rest),
    ...invalid,
  ];
};

export async function checkTerminology({root, paths = defaultPaths}) {
  const registry = await loadTerminologyRegistry(root);
  if (registry.errors.length > 0) {
    return {issues: registry.errors.map(registryIssue).sort(compareIssues), checkedFiles: []};
  }

  const files = await collectVisibleRecords(root, paths);
  const issues = [];
  for (const fileEntry of files) {
    const introduced = new Set();
    const fileIssues = [];
    for (const record of fileEntry.records) {
      fileIssues.push(...inspectBareAliases(record, registry));
      fileIssues.push(...inspectFirstUse(record, registry, introduced));
      fileIssues.push(...inspectUnknownEnglish(record, registry));
    }
    issues.push(...applySuppressions(fileEntry, fileIssues));
  }
  return {
    issues: issues.sort(compareIssues),
    checkedFiles: files.map(({file}) => file),
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
