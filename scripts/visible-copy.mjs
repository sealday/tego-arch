import assert from 'node:assert/strict';
import {createProcessor} from '@mdx-js/mdx';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const grayMatter = require('@11ty/gray-matter');
const ts = require('typescript');

const blankCharacters = (value) => value.replace(/[^\n]/gu, ' ');

export const normalizeMdxSource = (source, relativePath, frontMatterEnd = 0) => {
  const maskedFrontMatter = frontMatterEnd > 0
    ? `${blankCharacters(source.slice(0, frontMatterEnd))}${source.slice(frontMatterEnd)}`
    : source;
  const lines = maskedFrontMatter.split('\n');

  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^\s*(`{3,}|~{3,})/u);
    if (!fence && opening) {
      fence = {character: opening[1][0], length: opening[1].length};
      lines[index] = blankCharacters(lines[index]);
      continue;
    }
    if (fence) {
      const closing = new RegExp(
        `^\\s*${fence.character}{${fence.length},}\\s*$`,
        'u',
      );
      const closesFence = closing.test(lines[index]);
      lines[index] = blankCharacters(lines[index]);
      if (closesFence) fence = null;
    }
  }

  assert.equal(
    fence,
    null,
    `${relativePath}: MDX fenced code block must have a closing delimiter`,
  );

  const withoutFences = lines.join('\n');
  return maskHtmlComments(withoutFences, relativePath);
};

export const parseMdxAst = (source, relativePath) => {
  let ast;
  const captureAst = () => (tree) => {
    ast = tree;
  };

  try {
    createProcessor({remarkPlugins: [captureAst]}).processSync({
      value: source,
      path: relativePath,
    });
  } catch (error) {
    throw new Error(`${relativePath}: MDX parser failed: ${error.message}`, {cause: error});
  }

  assert.ok(ast, `${relativePath}: MDX parser did not produce an AST`);
  return ast;
};

const protectedCommentNodeTypes = new Set([
  'code',
  'inlineCode',
  'mdxFlowExpression',
  'mdxTextExpression',
  'mdxjsEsm',
]);
const commentOpeningProbe = 'CMNT';
const comparisonCommentOpeningProbe = 'OPNR';
const imageNodeTypes = new Set(['image', 'imageReference']);

const nodePositionKey = (node) => (
  `${node.type}:${node.position?.start.offset}:${node.position?.end.offset}`
);

const nodesByTypeAndPosition = (ast, type) => {
  const nodes = new Map();
  const visit = (node) => {
    if (node.type === type) {
      nodes.set(nodePositionKey(node), node);
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return nodes;
};

const countToken = (value, token) => value.split(token).length - 1;

const withCandidateOpenings = (baselineProbe, offsets) => {
  const candidate = baselineProbe.split('');
  for (const offset of offsets) {
    for (let index = 0; index < comparisonCommentOpeningProbe.length; index += 1) {
      candidate[offset + index] = comparisonCommentOpeningProbe[index];
    }
  }
  return candidate.join('');
};

const classifyImageOpenings = (
  baselineProbe,
  baselineAst,
  openingOffsets,
  relativePath,
) => {
  const classifications = new Map();
  const baselineImages = new Map([
    ...nodesByTypeAndPosition(baselineAst, 'image'),
    ...nodesByTypeAndPosition(baselineAst, 'imageReference'),
  ]);
  const baselineDefinitions = [...nodesByTypeAndPosition(baselineAst, 'definition').values()];

  for (const opening of openingOffsets) {
    const imageEntry = [...baselineImages.entries()].find(([, image]) => (
      opening >= image.position.start.offset && opening < image.position.end.offset
    ));
    if (!imageEntry) continue;

    const [imageKey, baselineImage] = imageEntry;
    const findCandidateImage = (candidateOffsets) => {
      const candidateProbe = withCandidateOpenings(baselineProbe, candidateOffsets);
      assert.equal(candidateProbe.length, baselineProbe.length);
      return nodesByTypeAndPosition(
        parseMdxAst(candidateProbe, relativePath),
        baselineImage.type,
      ).get(imageKey);
    };

    let candidateImage = findCandidateImage([opening]);
    if (!candidateImage && baselineImage.type === 'imageReference') {
      const matchingDefinitions = baselineDefinitions.filter(
        (definition) => definition.identifier === baselineImage.identifier,
      );
      assert.ok(
        matchingDefinitions.length > 0,
        `${relativePath}: MDX image reference has no matching definition at ${imageKey}`,
      );
      const synchronizedCandidates = [];
      for (const definition of matchingDefinitions) {
        const definitionOpenings = openingOffsets.filter((definitionOpening) => (
          definitionOpening >= definition.position.start.offset
          && definitionOpening < definition.position.end.offset
        ));
        for (const definitionOpening of definitionOpenings) {
          const synchronizedImage = findCandidateImage([opening, definitionOpening]);
          if (synchronizedImage) synchronizedCandidates.push(synchronizedImage);
        }
      }
      assert.equal(
        synchronizedCandidates.length,
        1,
        `${relativePath}: MDX image-reference probe cannot pair offset ${opening}`,
      );
      [candidateImage] = synchronizedCandidates;
    }
    assert.ok(
      candidateImage,
      `${relativePath}: MDX comment probe must preserve ${imageKey}`,
    );

    const baselineAlt = baselineImage.alt ?? '';
    const candidateAlt = candidateImage.alt ?? '';
    const visibleByBaseline = countToken(baselineAlt, commentOpeningProbe)
      - countToken(candidateAlt, commentOpeningProbe);
    const visibleByCandidate = countToken(candidateAlt, comparisonCommentOpeningProbe)
      - countToken(baselineAlt, comparisonCommentOpeningProbe);
    assert.equal(
      visibleByBaseline,
      visibleByCandidate,
      `${relativePath}: MDX comment probes disagree at offset ${opening}`,
    );
    assert.ok(
      visibleByBaseline === 0 || visibleByBaseline === 1,
      `${relativePath}: MDX comment probe has ambiguous visibility at offset ${opening}`,
    );
    classifications.set(opening, visibleByBaseline === 1);
  }

  return classifications;
};

const collectProtectedCommentRanges = (ast, openingOffsets, imageOpeningVisibility) => {
  const ranges = [];
  const addRange = (start, end) => {
    if (Number.isInteger(start) && Number.isInteger(end) && start < end) {
      ranges.push({start, end});
    }
  };

  const addMetadataGaps = (start, end, visibleRanges) => {
    let cursor = start;
    for (const range of visibleRanges
      .filter(({start: rangeStart, end: rangeEnd}) => (
        Number.isInteger(rangeStart)
        && Number.isInteger(rangeEnd)
        && rangeStart < rangeEnd
      ))
      .sort((left, right) => left.start - right.start)) {
      addRange(cursor, Math.max(start, range.start));
      cursor = Math.max(cursor, Math.min(end, range.end));
    }
    addRange(cursor, end);
  };

  const visit = (node) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (protectedCommentNodeTypes.has(node.type)) {
      addRange(start, end);
      return;
    }

    if (node.type === 'definition') {
      addRange(start, end);
      return;
    }

    if (node.type === 'link') {
      addMetadataGaps(start, end, (node.children ?? []).map((child) => ({
        start: child.position?.start.offset,
        end: child.position?.end.offset,
      })));
    }

    if (imageNodeTypes.has(node.type)) {
      const imageOpenings = openingOffsets.filter(
        (opening) => opening >= start && opening < end,
      );
      for (const opening of imageOpenings) {
        assert.ok(
          imageOpeningVisibility.has(opening),
          `MDX comment probe must classify image opener at offset ${opening}`,
        );
        if (!imageOpeningVisibility.get(opening)) {
          addRange(opening, opening + commentOpeningProbe.length);
        }
      }
    }

    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const children = node.children ?? [];
      if (children.length === 0) {
        addRange(start, end);
      } else {
        addRange(start, children[0].position?.start.offset);
        addRange(children.at(-1).position?.end.offset, end);
      }
      for (const attribute of node.attributes ?? []) {
        addRange(attribute.position?.start.offset, attribute.position?.end.offset);
      }
    }

    for (const child of node.children ?? []) visit(child);
  };

  visit(ast);
  return ranges;
};

const collectVisibleOpeningOffsets = (ast, openingOffsets, imageOpeningVisibility) => {
  const visible = new Set();
  const addOpeningsInNode = (node) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    for (const opening of openingOffsets) {
      if (opening >= start && opening < end) visible.add(opening);
    }
  };

  const visit = (node) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      addOpeningsInNode(node);
      return;
    }
    if (imageNodeTypes.has(node.type)) {
      for (const [opening, isVisible] of imageOpeningVisibility) {
        if (isVisible) {
          const start = node.position?.start.offset;
          const end = node.position?.end.offset;
          if (opening >= start && opening < end) visible.add(opening);
        }
      }
      return;
    }
    if (protectedCommentNodeTypes.has(node.type) || node.type === 'definition') return;
    for (const child of node.children ?? []) visit(child);
  };

  visit(ast);
  return visible;
};

const hasOddBackslashRunBefore = (source, offset) => {
  let backslashes = 0;
  for (let index = offset - 1; index >= 0 && source[index] === '\\'; index -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
};

const maskHtmlComments = (source, relativePath) => {
  const openingOffsets = [];
  for (let opening = source.indexOf('<!--'); opening !== -1;
    opening = source.indexOf('<!--', opening + 4)) {
    openingOffsets.push(opening);
  }
  const baselineProbe = source
    .replaceAll('<!--', commentOpeningProbe)
    .replaceAll('-->', 'END');
  assert.equal(baselineProbe.length, source.length);
  const baselineAst = parseMdxAst(baselineProbe, relativePath);
  const imageOpeningVisibility = classifyImageOpenings(
    baselineProbe,
    baselineAst,
    openingOffsets,
    relativePath,
  );
  const protectedRanges = collectProtectedCommentRanges(
    baselineAst,
    openingOffsets,
    imageOpeningVisibility,
  );
  const visibleOpeningOffsets = collectVisibleOpeningOffsets(
    baselineAst,
    openingOffsets,
    imageOpeningVisibility,
  );
  const visibleEscapedOpenings = new Set();
  const masked = source.split('');

  for (let cursor = 0; cursor < source.length;) {
    const opening = source.indexOf('<!--', cursor);
    if (opening === -1) break;
    if (hasOddBackslashRunBefore(source, opening)) {
      if (visibleOpeningOffsets.has(opening)) visibleEscapedOpenings.add(opening);
      cursor = opening + 4;
      continue;
    }
    const isProtected = protectedRanges.some(
      ({start, end}) => opening >= start && opening < end,
    );
    if (isProtected) {
      cursor = opening + 4;
      continue;
    }

    const closing = source.indexOf('-->', opening + 4);
    if (closing === -1) {
      assert.fail(`${relativePath}: MDX HTML comment must have a closing delimiter`);
    }
    for (let index = opening; index < closing + 3; index += 1) {
      if (masked[index] !== '\n') masked[index] = ' ';
    }
    cursor = closing + 3;
  }

  return {source: masked.join(''), visibleEscapedOpenings};
};

export const restoreEscapedCommentOpeners = (
  source,
  line,
  excerpt,
  visibleEscapedOpenings,
) => {
  const sourceLines = source.split('\n');
  const originalLine = sourceLines[line - 1] ?? '';
  const lineOffset = sourceLines
    .slice(0, line - 1)
    .reduce((offset, sourceLine) => offset + sourceLine.length + 1, 0);
  const escapedRuns = [];
  for (let opening = originalLine.indexOf('<!--'); opening !== -1;
    opening = originalLine.indexOf('<!--', opening + 4)) {
    if (!visibleEscapedOpenings.has(lineOffset + opening)) continue;
    let runStart = opening;
    while (runStart > 0 && originalLine[runStart - 1] === '\\') runStart -= 1;
    escapedRuns.push(originalLine.slice(runStart, opening));
  }

  let restored = excerpt;
  let cursor = 0;
  for (const escapedRun of escapedRuns) {
    const opening = restored.indexOf('<!--', cursor);
    if (opening === -1) break;
    let runStart = opening;
    while (runStart > cursor && restored[runStart - 1] === '\\') runStart -= 1;
    restored = `${restored.slice(0, runStart)}${escapedRun}${restored.slice(opening)}`;
    cursor = runStart + escapedRun.length + 4;
  }
  return restored;
};

const excludedAstTypes = new Set([
  'code',
  'definition',
  'html',
  'mdxFlowExpression',
  'mdxTextExpression',
  'mdxjsEsm',
]);

export const renderVisibleBlock = (node, {includeInlineCode = false} = {}) => {
  const block = {text: '', lines: [], display: '', displayLines: []};

  const append = (field, lineField, value, startLine) => {
    let line = startLine;
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      block[field] += character;
      block[lineField].push(line);
      if (character === '\n') line += 1;
    }
  };

  const appendVisible = (value, visibleNode) => {
    const line = visibleNode.position?.start.line ?? node.position?.start.line ?? 1;
    append('text', 'lines', value, line);
    append('display', 'displayLines', value, line);
  };

  const appendDisplay = (value, line) => {
    append('display', 'displayLines', value, line);
  };

  const visit = (current) => {
    if (excludedAstTypes.has(current.type)) return;

    if (current.type === 'text') {
      appendVisible(current.value, current);
      return;
    }

    if (current.type === 'inlineCode') {
      if (includeInlineCode) appendVisible(current.value, current);
      return;
    }

    if (current.type === 'break') {
      appendVisible('\n', current);
      return;
    }

    if (current.type === 'image' || current.type === 'imageReference') {
      const alt = current.alt ?? '';
      const startLine = current.position?.start.line ?? 1;
      append('text', 'lines', alt, startLine);
      appendDisplay('![', startLine);
      append('display', 'displayLines', alt, startLine);
      appendDisplay(']', current.position?.end.line ?? startLine);
      return;
    }

    if (current.type === 'link' || current.type === 'linkReference') {
      appendDisplay('[', current.position?.start.line ?? 1);
      for (const child of current.children ?? []) visit(child);
      appendDisplay(']', current.position?.end.line ?? current.position?.start.line ?? 1);
      return;
    }

    for (const child of current.children ?? []) visit(child);
  };

  visit(node);
  block.excerptAt = (line) => {
    let excerpt = '';
    for (let index = 0; index < block.display.length; index += 1) {
      if (block.displayLines[index] === line) excerpt += block.display[index];
    }
    return excerpt.trim();
  };
  return block;
};

export const collectVisibleBlocks = (ast, options) => {
  const blocks = [];
  const visit = (node) => {
    if (excludedAstTypes.has(node.type)) return;
    if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'tableCell') {
      blocks.push({...renderVisibleBlock(node, options), node});
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return blocks;
};

const visibleFrontMatterFields = ['title', 'sidebar_label', 'summary'];

const parseFrontMatterRegion = (source, relativePath) => {
  const lines = source.split('\n');
  const bomLength = source.startsWith('\uFEFF') ? 1 : 0;
  if (!source.startsWith('---', bomLength)) return {endOffset: 0, records: []};

  let parsed;
  try {
    parsed = grayMatter(source, {});
  } catch (error) {
    throw new Error(
      `${relativePath}: front matter parser failed: ${error.message}`,
      {cause: error},
    );
  }
  const matterStart = bomLength + 3;
  const separatorOffset = matterStart + parsed.matter.length;
  if (!source.startsWith('\n---', separatorOffset)) {
    throw new Error(`${relativePath}: MDX front matter must have a closing delimiter`);
  }
  const closingStart = separatorOffset + 1;
  const afterClosing = closingStart + 3;
  const closingSuffix = source.slice(afterClosing, afterClosing + 2);
  if (
    afterClosing < source.length
    && !closingSuffix.startsWith('\n')
    && closingSuffix !== '\r\n'
  ) {
    throw new Error(`${relativePath}: MDX front matter closing delimiter must own its line`);
  }
  const endOffset = closingSuffix === '\r\n'
    ? afterClosing + 2
    : afterClosing + (closingSuffix.startsWith('\n') ? 1 : 0);
  const endLine = source.slice(0, endOffset).split('\n').length;
  const metadata = parsed.data;

  const records = [];
  for (const field of visibleFrontMatterFields) {
    if (!(field in metadata)) continue;
    if (typeof metadata[field] !== 'string') {
      throw new Error(
        `${relativePath}: visible front matter field "${field}" must be a string`,
      );
    }
    const index = lines.findIndex((line, lineIndex) => (
      lineIndex > 0
      && lineIndex < endLine
      && new RegExp(`^${field}:(?:\\s|$)`, 'u').test(line)
    ));
    if (index === -1) {
      throw new Error(
        `${relativePath}: visible front matter field "${field}" must be declared at top level`,
      );
    }
    const text = metadata[field];
    if (!text) continue;
    records.push({
      field,
      file: relativePath,
      line: index + 1,
      text,
      excerpt: lines[index].trim(),
      kind: 'front-matter',
    });
  }
  return {endOffset, records};
};

const sourceExcerpt = (source, line) => source.split('\n')[line - 1]?.trim() ?? '';

export const parseMdxVisibleCopy = (
  source,
  relativePath,
  {includeInlineCode = false, includeStructure = false} = {},
) => {
  const frontMatterRegion = parseFrontMatterRegion(source, relativePath);
  const frontMatter = frontMatterRegion.records;
  const {source: normalized, visibleEscapedOpenings} = normalizeMdxSource(
    source,
    relativePath,
    frontMatterRegion.endOffset,
  );
  const ast = parseMdxAst(normalized, relativePath);
  const renderedBlocks = collectVisibleBlocks(ast, {includeInlineCode});
  const structuredBlocks = renderedBlocks.map((block) => {
    const line = block.node.position?.start.line ?? 1;
    const excerptAt = (targetLine) => restoreEscapedCommentOpeners(
      normalized,
      targetLine,
      block.excerptAt(targetLine),
      visibleEscapedOpenings,
    );
    const record = {
      file: relativePath,
      line,
      text: block.text,
      excerpt: excerptAt(line),
      kind: 'body',
    };
    return {...record, lines: block.lines, excerptAt};
  }).filter(({text}) => text.trim().length > 0);

  const blocks = includeStructure
    ? structuredBlocks
    : renderedBlocks.flatMap((block) => {
      const textByLine = new Map();
      for (let index = 0; index < block.text.length; index += 1) {
        if (block.text[index] === '\n') continue;
        const line = block.lines[index];
        textByLine.set(line, `${textByLine.get(line) ?? ''}${block.text[index]}`);
      }
      return [...textByLine].flatMap(([line, text]) => {
        const visibleText = text.trim();
        if (!visibleText) return [];
        return [{
          file: relativePath,
          line,
          text: visibleText,
          excerpt: restoreEscapedCommentOpeners(
            normalized,
            line,
            block.excerptAt(line),
            visibleEscapedOpenings,
          ),
          kind: 'body',
        }];
      });
    });

  return includeStructure
    ? {blocks, frontMatter, ast, normalized}
    : {blocks, frontMatter};
};

const cleanMermaidLabel = (value) => {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2
    && ((trimmed.startsWith('"') && trimmed.endsWith('"'))
      || (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const mermaidError = (relativePath, line, message) => (
  new Error(`${relativePath}:${line}: ${message}`)
);

const mermaidRecord = (relativePath, lines, index, text) => ({
  file: relativePath,
  line: index + 1,
  text: cleanMermaidLabel(text),
  excerpt: lines[index].trim(),
  kind: 'mermaid',
});

const findShapeEnd = (line, start, closing, relativePath, lineNumber) => {
  let quote = null;
  for (let index = start; index <= line.length - closing.length; index += 1) {
    const character = line[index];
    if (quote) {
      if (character === quote && line[index - 1] !== '\\') quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (line.startsWith(closing, index)) return index;
  }
  throw mermaidError(relativePath, lineNumber, 'unsupported or malformed flowchart statement');
};

const flowShapeOpenings = [
  ['(((', ')))'],
  ['[/', '/]'],
  ['[\\', '\\]'],
  ['[[', ']]'],
  ['([', '])'],
  ['[(', ')]'],
  ['((', '))'],
  ['{{', '}}'],
  ['[', ']'],
  ['{', '}'],
  ['(', ')'],
  ['>', ']'],
];

const flowNodeLabels = (line, relativePath, lineNumber) => {
  const labels = [];
  const candidate = /\b([A-Za-z_][\w-]*)\s*(?=\[\[|\(\[|\[\(|\(\(|\{\{|\[|\{|\(|>)/gu;
  for (let match = candidate.exec(line); match; match = candidate.exec(line)) {
    const openingStart = candidate.lastIndex;
    if (line.startsWith('{{{', openingStart)) {
      throw mermaidError(relativePath, lineNumber, 'unsupported Mermaid node shape');
    }
    const [opening, closing] = flowShapeOpenings.find(([value]) => (
      line.startsWith(value, openingStart)
    )) ?? [];
    if (!opening) continue;
    const contentStart = openingStart + opening.length;
    const contentEnd = findShapeEnd(
      line,
      contentStart,
      closing,
      relativePath,
      lineNumber,
    );
    const text = cleanMermaidLabel(line.slice(contentStart, contentEnd));
    if (opening === '(' && text.includes(',') && !/(?:-->|==>|\.->|<-->)/u.test(line)) {
      throw mermaidError(relativePath, lineNumber, 'unsupported or malformed flowchart statement');
    }
    if (text) labels.push({index: match.index, text});
    candidate.lastIndex = contentEnd + closing.length;
  }
  return labels;
};

const flowEdgeLabels = (line) => {
  const labels = [];
  const patterns = [
    /\|([^|]+)\|/gu,
    /--\s+(.+?)\s+-->/gu,
    /-\.\s*(.+?)\s*\.->/gu,
    /==\s*(.+?)\s*==>/gu,
  ];
  for (const pattern of patterns) {
    for (const match of line.matchAll(pattern)) {
      const text = cleanMermaidLabel(match[1]);
      if (text) labels.push({index: match.index, text});
    }
  }
  return labels;
};

const hasCompleteFlowEdge = (line) => {
  const edges = [...line.matchAll(/<-->|-->|==>|\.->|---|~~~/gu)];
  if (edges.length === 0) return true;
  if (!/^[A-Za-z_][\w-]*/u.test(line.trimStart())) return false;
  const edge = edges.at(-1);
  const remainder = line.slice(edge.index + edge[0].length);
  return /^\s*(?:\|[^|]+\|\s*)?[A-Za-z_][\w-]*/u.test(remainder);
};

const flowDirectivePatterns = new Map([
  ['direction', /^(?:TB|TD|BT|RL|LR)$/u],
  ['style', /^[A-Za-z_][\w-]*\s+[A-Za-z-]+\s*:\s*[^,]+(?:,\s*[A-Za-z-]+\s*:\s*[^,]+)*$/u],
  ['classDef', /^[A-Za-z_][\w-]*(?:,[A-Za-z_][\w-]*)*\s+[A-Za-z-]+\s*:\s*[^,]+(?:,\s*[A-Za-z-]+\s*:\s*[^,]+)*$/u],
  ['class', /^[A-Za-z_][\w-]*(?:,[A-Za-z_][\w-]*)*\s+[A-Za-z_][\w-]*$/u],
  ['linkStyle', /^(?:default|\d+(?:,\d+)*)\s+[A-Za-z-]+\s*:\s*[^,]+(?:,\s*[A-Za-z-]+\s*:\s*[^,]+)*$/u],
  ['click', /^(?:[A-Za-z_][\w-]*)\s+(?:"[^"]+"|'[^']+'|href\s+(?:"[^"]+"|'[^']+'|\S+)|call\s+\S+)(?:\s+(?:"[^"]*"|'[^']*'))?(?:\s+_(?:self|blank|parent|top))?$/u],
]);

const validateFlowDirective = (trimmed, relativePath, lineNumber) => {
  const match = trimmed.match(/^(classDef|class|style|linkStyle|click|direction)\b\s*(.*)$/u);
  if (!match) return false;
  const [, directive, value] = match;
  if (!flowDirectivePatterns.get(directive).test(value)) {
    throw mermaidError(relativePath, lineNumber, `malformed Mermaid ${directive} directive`);
  }
  return true;
};

const parseFlowchart = (lines, indexes, relativePath) => {
  const records = [];
  for (const index of indexes) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    const accessible = trimmed.match(/^acc(?:Title|Descr):\s*(.+)$/u);
    if (accessible) {
      records.push(mermaidRecord(relativePath, lines, index, accessible[1]));
      continue;
    }
    if (trimmed === 'end') continue;
    if (validateFlowDirective(trimmed, relativePath, index + 1)) continue;
    if (trimmed.startsWith('subgraph ')) {
      const labelSource = trimmed.slice('subgraph '.length);
      const labels = flowNodeLabels(labelSource, relativePath, index + 1);
      const text = labels[0]?.text ?? labelSource.replace(/^[A-Za-z_][\w-]*\s*/u, '').trim();
      if (!text) {
        throw mermaidError(relativePath, index + 1, 'unsupported or malformed flowchart subgraph');
      }
      records.push(mermaidRecord(relativePath, lines, index, text));
      continue;
    }

    const labels = [
      ...flowNodeLabels(trimmed, relativePath, index + 1),
      ...flowEdgeLabels(trimmed),
    ].sort((left, right) => left.index - right.index);
    const hasFlowSyntax = labels.length > 0 || /(?:-->|==>|\.->|<-->|---|~~~)/u.test(trimmed);
    if (!hasFlowSyntax || !hasCompleteFlowEdge(trimmed)) {
      throw mermaidError(relativePath, index + 1, 'unsupported or malformed flowchart statement');
    }
    for (const {text} of labels) {
      records.push(mermaidRecord(relativePath, lines, index, text));
    }
  }
  return records;
};

const parseSequenceDiagram = (lines, indexes, relativePath) => {
  const records = [];
  for (const index of indexes) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('%%') || trimmed === 'end') continue;
    const accessible = trimmed.match(/^acc(?:Title|Descr):\s*(.+)$/u);
    if (accessible) {
      records.push(mermaidRecord(relativePath, lines, index, accessible[1]));
      continue;
    }
    const participant = trimmed.match(/^(?:actor|participant)\s+(?:[A-Za-z_][\w-]*\s+as\s+)?(.+)$/u);
    if (participant) {
      records.push(mermaidRecord(relativePath, lines, index, participant[1]));
      continue;
    }
    const note = trimmed.match(/^Note\s+(?:over|left of|right of)\s+[^:]+:\s*(.+)$/u);
    if (note) {
      records.push(mermaidRecord(relativePath, lines, index, note[1]));
      continue;
    }
    const control = trimmed.match(/^(?:alt|else|opt|loop|par|and|critical|break|rect|box)(?:\s+(.+))?$/u);
    if (control) {
      if (control[1]) records.push(mermaidRecord(relativePath, lines, index, control[1]));
      continue;
    }
    if (/^(?:activate|deactivate|autonumber)\b/u.test(trimmed)) continue;
    const colon = trimmed.indexOf(':');
    if (colon !== -1 && /(?:-{1,2}>>|-{1,2}>|-{1,2}x|-{1,2}\))/u.test(trimmed.slice(0, colon))) {
      const text = trimmed.slice(colon + 1).trim();
      if (!text) throw mermaidError(relativePath, index + 1, 'malformed sequenceDiagram message');
      records.push(mermaidRecord(relativePath, lines, index, text));
      continue;
    }
    throw mermaidError(relativePath, index + 1, 'unsupported or malformed sequenceDiagram statement');
  }
  return records;
};

const parseStateDiagram = (lines, indexes, relativePath) => {
  const records = [];
  const states = new Set();
  const addState = (index, id, label = id) => {
    if (id === '[*]' || states.has(id)) return;
    states.add(id);
    records.push(mermaidRecord(relativePath, lines, index, label));
  };

  for (const index of indexes) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    const accessible = trimmed.match(/^acc(?:Title|Descr):\s*(.+)$/u);
    if (accessible) {
      records.push(mermaidRecord(relativePath, lines, index, accessible[1]));
      continue;
    }
    const declaration = trimmed.match(/^state\s+(["'])(.+)\1\s+as\s+([A-Za-z_][\w-]*)$/u);
    if (declaration) {
      addState(index, declaration[3], declaration[2]);
      continue;
    }
    const transition = trimmed.match(/^(\[\*\]|[A-Za-z_][\w-]*)\s+-->\s+(\[\*\]|[A-Za-z_][\w-]*)(?:\s*:\s*(.+))?$/u);
    if (transition) {
      addState(index, transition[1]);
      addState(index, transition[2]);
      if (transition[3]) records.push(mermaidRecord(relativePath, lines, index, transition[3]));
      continue;
    }
    throw mermaidError(relativePath, index + 1, 'unsupported or malformed stateDiagram statement');
  }
  return records;
};

const parseErDiagram = (lines, indexes, relativePath) => {
  const records = [];
  const entities = new Set();
  let entity = null;
  const addEntity = (index, name) => {
    if (entities.has(name)) return;
    entities.add(name);
    records.push(mermaidRecord(relativePath, lines, index, name));
  };

  for (const index of indexes) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    const accessible = trimmed.match(/^acc(?:Title|Descr):\s*(.+)$/u);
    if (accessible) {
      records.push(mermaidRecord(relativePath, lines, index, accessible[1]));
      continue;
    }
    if (trimmed === '}') {
      if (!entity) throw mermaidError(relativePath, index + 1, 'malformed erDiagram entity');
      entity = null;
      continue;
    }
    if (entity) {
      const field = trimmed.match(/^(\S+)\s+(\S+)(?:\s+.*)?$/u);
      if (!field) throw mermaidError(relativePath, index + 1, 'malformed erDiagram field');
      records.push(mermaidRecord(relativePath, lines, index, field[1]));
      records.push(mermaidRecord(relativePath, lines, index, field[2]));
      continue;
    }
    const opening = trimmed.match(/^([A-Za-z_][\w-]*)\s*\{$/u);
    if (opening) {
      entity = opening[1];
      addEntity(index, entity);
      continue;
    }
    const relation = trimmed.match(/^([A-Za-z_][\w-]*)\s+\S+\s+([A-Za-z_][\w-]*)\s*:\s*(.+)$/u);
    if (relation) {
      addEntity(index, relation[1]);
      addEntity(index, relation[2]);
      records.push(mermaidRecord(relativePath, lines, index, relation[3]));
      continue;
    }
    throw mermaidError(relativePath, index + 1, 'unsupported or malformed erDiagram statement');
  }
  if (entity) throw mermaidError(relativePath, indexes.at(-1) + 1, 'unclosed erDiagram entity');
  return records;
};

const parseMermaidFence = (lines, indexes, relativePath) => {
  const headerIndex = indexes.find((index) => {
    const trimmed = lines[index].trim();
    return trimmed && !trimmed.startsWith('%%');
  });
  if (headerIndex === undefined) {
    throw mermaidError(relativePath, indexes[0] + 1, 'empty Mermaid fence');
  }
  const header = lines[headerIndex].trim();
  const body = indexes.filter((index) => index > headerIndex);
  if (/^(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)$/u.test(header)) {
    return parseFlowchart(lines, body, relativePath);
  }
  if (header === 'sequenceDiagram') return parseSequenceDiagram(lines, body, relativePath);
  if (/^stateDiagram(?:-v2)?$/u.test(header)) return parseStateDiagram(lines, body, relativePath);
  if (header === 'erDiagram') return parseErDiagram(lines, body, relativePath);
  throw mermaidError(relativePath, headerIndex + 1, `unsupported Mermaid diagram "${header}"`);
};

export const extractMermaidLabels = (source, relativePath) => {
  const lines = source.split('\n');
  const records = [];
  let fence = null;

  for (let index = 0; index < lines.length; index += 1) {
    if (!fence) {
      const opening = lines[index].match(/^\s*(`{3,}|~{3,})\s*mermaid(?:\s+.*)?$/iu);
      if (opening) {
        fence = {
          character: opening[1][0],
          length: opening[1].length,
          indexes: [],
          openingLine: index + 1,
        };
      }
      continue;
    }

    const closesFence = new RegExp(
      `^\\s*${fence.character}{${fence.length},}\\s*$`,
      'u',
    ).test(lines[index]);
    if (closesFence) {
      records.push(...parseMermaidFence(lines, fence.indexes, relativePath));
      fence = null;
      continue;
    }
    fence.indexes.push(index);
  }

  if (fence) {
    throw new Error(
      `${relativePath}:${fence.openingLine}: Mermaid fenced code block must have a closing delimiter`,
    );
  }
  return records;
};

const visibleJsxAttributes = new Set([
  'alt',
  'title',
  'label',
  'description',
  'aria-label',
]);
const visibleObjectProperties = new Set(['title', 'term', 'description']);

const jsxTextDecodeCache = new Map();

const findOutOfRangeJsxReference = (value) => (
  [...value.matchAll(/&#(?:([0-9]+)|x([\da-fA-F]+));/gu)]
    .find((match) => Number.parseInt(match[1] ?? match[2], match[1] ? 10 : 16) > 0x10FFFF)
    ?.[0]
);

const decodeJsxCharacterReferences = (value, relativePath, line) => {
  if (!value.includes('&')) return value;
  const cached = jsxTextDecodeCache.get(value);
  if (cached !== undefined) return cached;

  let output;
  try {
    output = ts.transpileModule(
      `const __visibleCopyJsxText = <>${value}</>;`,
      {
        compilerOptions: {
          jsx: ts.JsxEmit.React,
          target: ts.ScriptTarget.ESNext,
        },
      },
    ).outputText;
  } catch (error) {
    const reference = findOutOfRangeJsxReference(value);
    if (reference) {
      throw new Error(
        `${relativePath}:${line}: invalid JSX numeric character reference "${reference}"`,
        {cause: error},
      );
    }
    throw new Error(
      `${relativePath}:${line}: TypeScript JSX text decoding failed: ${error.message}`,
      {cause: error},
    );
  }

  const emitted = ts.createSourceFile(
    'visible-copy-jsx-text.js',
    output,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const declaration = emitted.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((node) => node.name.getText(emitted) === '__visibleCopyJsxText');
  const decoded = declaration?.initializer?.arguments?.[2];
  if (!decoded || !ts.isStringLiteral(decoded)) {
    throw new Error(`${relativePath}:${line}: TypeScript JSX text decoding produced no text`);
  }
  jsxTextDecodeCache.set(value, decoded.text);
  return decoded.text;
};

const collectStaticTsxStrings = (node, collect) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    collect(node, node.text);
    return;
  }
  if (ts.isTemplateExpression(node)) {
    collect(node.head, node.head.text);
    for (const span of node.templateSpans) collect(span.literal, span.literal.text);
    return;
  }
  if (ts.isConditionalExpression(node)) {
    collectStaticTsxStrings(node.whenTrue, collect);
    collectStaticTsxStrings(node.whenFalse, collect);
    return;
  }
  if (ts.isParenthesizedExpression(node)) {
    collectStaticTsxStrings(node.expression, collect);
    return;
  }
  if (
    ts.isBinaryExpression(node)
  ) {
    if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      collectStaticTsxStrings(node.left, collect);
      collectStaticTsxStrings(node.right, collect);
      return;
    }
    if (
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind)
    ) {
      collectStaticTsxStrings(node.left, collect);
      collectStaticTsxStrings(node.right, collect);
    }
  }
};

const propertyName = (node) => {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return null;
};

export const extractVisibleTsxStrings = (source, relativePath) => {
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    throw new Error(`${relativePath}: TSX parser failed: ${message}`);
  }

  const records = [];
  const addRecordAtPosition = (position, text) => {
    const normalized = text.replace(/\s+/gu, ' ').trim();
    if (!normalized) return;
    const line = sourceFile.getLineAndCharacterOfPosition(position).line + 1;
    records.push({
      file: relativePath,
      line,
      text: normalized,
      excerpt: sourceExcerpt(source, line),
      kind: 'tsx',
    });
  };
  const addRecord = (node, text) => addRecordAtPosition(node.getStart(sourceFile), text);
  const addJsxTextRecords = (node) => {
    const raw = source.slice(node.pos, node.end);
    for (const match of raw.matchAll(/[^\r\n]+/gu)) {
      const leadingWhitespace = match[0].search(/\S/u);
      if (leadingWhitespace === -1) continue;
      const position = node.pos + match.index + leadingWhitespace;
      const line = sourceFile.getLineAndCharacterOfPosition(position).line + 1;
      addRecordAtPosition(
        position,
        decodeJsxCharacterReferences(match[0], relativePath, line),
      );
    }
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      addJsxTextRecords(node);
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (visibleJsxAttributes.has(name) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          addRecord(node.initializer, node.initializer.text);
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          collectStaticTsxStrings(node.initializer.expression, addRecord);
        }
      }
      return;
    } else if (ts.isJsxExpression(node) && node.expression) {
      collectStaticTsxStrings(node.expression, addRecord);
    } else if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      if (visibleObjectProperties.has(name)) {
        collectStaticTsxStrings(node.initializer, addRecord);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return records;
};
