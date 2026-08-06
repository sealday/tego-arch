#!/usr/bin/env node

import {lstat, readdir, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseXmlVisibleCopy} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';
import {loadTerminologyRegistry} from './terminology-registry.mjs';
import {citationMatchesSource, parseSourceLedger} from './source-ledger.mjs';
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

const normalizedLinkLabel = (value) => value.normalize('NFC').replace(/\s+/gu, ' ').trim();

const externalCitationSource = (url, sources) => sources.find((source) => {
  if (!citationMatchesSource(url, source) || source.source_kind === 'original-illustration') {
    return false;
  }
  try {
    return ['http:', 'https:'].includes(new URL(source.canonical_locator).protocol);
  } catch {
    return false;
  }
});

const collectMarkdownRecords = (source, relativePath, sources) => {
  const parsed = parseMdxVisibleCopy(source, relativePath, {
    includeAst: true,
    excludeLink: ({hasImage, label, url}) => {
      if (hasImage || !url) return false;
      const citation = externalCitationSource(url, sources);
      return citation
        ? [citation.title, ...(citation.citation_titles ?? [])]
          .some((title) => normalizedLinkLabel(label) === normalizedLinkLabel(title))
        : false;
    },
  });
  const quoteLines = [];
  visitAst(parsed.ast, (node) => {
    if (node.type === 'blockquote') {
      quoteLines.push([node.position.start.line, node.position.end.line]);
    }
  });
  const outsideQuotes = (record) => !quoteLines.some(
    ([start, end]) => record.line >= start && record.line <= end,
  );
  return {
    records: [
      ...parsed.frontMatter,
      ...parsed.blocks.filter(outsideQuotes),
      ...extractMermaidLabels(source, relativePath).filter(outsideQuotes),
    ],
    suppressionComments: parsed.comments,
  };
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
  const ledgerPath = 'data/source-ledger.json';
  let text;
  try {
    text = await readFile(path.join(root, ledgerPath), 'utf8');
  } catch {
    return {
      sources: [],
      issues: [parseError(ledgerPath, `${ledgerPath}: unable to read source ledger`)],
    };
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      sources: [],
      issues: [parseError(ledgerPath, `${ledgerPath}: invalid JSON`)],
    };
  }
  const parsed = parseSourceLedger(value);
  if (parsed.errors.length > 0) {
    return {
      sources: [],
      issues: [parseError(ledgerPath, `${ledgerPath}: ${parsed.errors.join('; ')}`)],
    };
  }
  return {sources: parsed.ledger.sources, issues: []};
};

const collectVisibleRecords = async (root, paths) => {
  const resolvedRoot = await realpath(root);
  const fileSet = new Set();
  const errors = [];
  for (const target of [...new Set(paths)]) {
    await scanTarget(resolvedRoot, target, fileSet, errors, true);
  }
  const files = [...fileSet].sort((left, right) => left.localeCompare(right, 'en'));
  const citationLedger = await loadCitationSources(resolvedRoot);
  errors.push(...citationLedger.issues);
  const output = [];
  for (const file of files) {
    let source;
    try {
      source = await readFile(path.join(resolvedRoot, file), 'utf8');
      const extension = path.extname(file).toLowerCase();
      let collected;
      if (extension === '.md' || extension === '.mdx') {
        collected = collectMarkdownRecords(source, file, citationLedger.sources);
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

const insideForeignTerm = (record, range, term, registry) => registry.registry.terms
  .filter((candidate) => candidate.id !== term.id)
  .flatMap(termForms)
  .some((form) => matchRanges(record.text, form).some(
    ({start, end}) => start <= range.start && end >= range.end
      && (start < range.start || end > range.end),
  ));

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
      .filter((range) => !insideForeignTerm(record, range, term, registry))
      .sort((left, right) => left.start - right.start || right.end - left.end);
    const events = [
      ...fullRanges.map((range) => ({...range, type: 'full'})),
      ...candidates.map((range) => ({...range, type: 'short'})),
    ].sort((left, right) => left.start - right.start || (left.type === 'full' ? -1 : 1));
    let ready = introduced.has(term.id);
    for (const event of events) {
      if (event.type === 'full') {
        if (ready) {
          issues.push(issue(
            record.file,
            record.line,
            'first-use-required',
            event.matched,
            term.subsequent_use[0] ?? term.canonical_zh,
          ));
        } else {
          ready = true;
          introduced.add(term.id);
        }
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
    /(?:https?:\/\/|mailto:|\/)[^\s，。；：！？、（）【】]+|\b[A-Za-z][A-Za-z0-9]*(?:[._][A-Za-z0-9_-]+)+\b|\b[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+\b/gu,
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
    /^(?:<!--\s*|\{\/\*\s*)terminology-exempt:\s*([^|\s]+)\s*\|\s*reason:\s*(.*?)\s*(?:-->|\*\/\})$/u,
  );
  if (!exclusive || !exact || !suppressibleRules.has(exact[1]) || exact[2].trim() === '') {
    return {file, line, valid: false, matched: raw};
  }
  return {file, line, valid: true, ruleId: exact[1], matched: raw};
};

const parseSuppressions = (fileEntry) => {
  const sourceLines = fileEntry.source.split('\n');
  return (fileEntry.suppressionComments ?? [])
    .map((comment) => ({...comment, excerpt: comment.excerpt ?? comment.raw}))
    .filter(({excerpt}) => excerpt?.includes('terminology-exempt'))
    .map((comment) => classifySuppression({
      raw: comment.excerpt,
      file: fileEntry.file,
      line: comment.line,
      exclusive: !comment.excerpt.includes('\n')
        && sourceLines[comment.line - 1]?.trim() === comment.excerpt,
    }));
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
      if (record.kind === 'mermaid' && record.structural) continue;
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
