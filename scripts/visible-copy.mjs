import assert from 'node:assert/strict';
import {createProcessor} from '@mdx-js/mdx';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const blankCharacters = (value) => value.replace(/[^\n]/gu, ' ');

export const normalizeMdxSource = (source, relativePath) => {
  const lines = source.split('\n');

  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    assert.notEqual(
      end,
      -1,
      `${relativePath}: MDX front matter must have a closing delimiter`,
    );
    for (let index = 0; index <= end; index += 1) {
      lines[index] = blankCharacters(lines[index]);
    }
  }

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

const visibleFrontMatterFields = new Set(['title', 'sidebar_label', 'description']);

const unquoteScalar = (value) => {
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

const extractVisibleFrontMatter = (source, relativePath) => {
  const lines = source.split('\n');
  if (lines[0]?.trim() !== '---') return [];
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  assert.notEqual(
    end,
    -1,
    `${relativePath}: MDX front matter must have a closing delimiter`,
  );

  const records = [];
  for (let index = 1; index < end; index += 1) {
    const match = lines[index].match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/u);
    if (!match || !visibleFrontMatterFields.has(match[1])) continue;
    const text = unquoteScalar(match[2]);
    if (!text) continue;
    records.push({
      field: match[1],
      file: relativePath,
      line: index + 1,
      text,
      excerpt: lines[index].trim(),
      kind: 'front-matter',
    });
  }
  return records;
};

const sourceExcerpt = (source, line) => source.split('\n')[line - 1]?.trim() ?? '';

export const parseMdxVisibleCopy = (
  source,
  relativePath,
  {includeInlineCode = false, includeStructure = false} = {},
) => {
  const frontMatter = extractVisibleFrontMatter(source, relativePath);
  const {source: normalized, visibleEscapedOpenings} = normalizeMdxSource(
    source,
    relativePath,
  );
  const ast = parseMdxAst(normalized, relativePath);
  const blocks = collectVisibleBlocks(ast, {includeInlineCode}).map((block) => {
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
    return includeStructure
      ? {...record, lines: block.lines, excerptAt}
      : record;
  }).filter(({text}) => text.trim().length > 0);

  return includeStructure
    ? {blocks, frontMatter, ast, normalized}
    : {blocks, frontMatter};
};

const cleanMermaidLabel = (value) => value.trim().replace(/^(?:"|')|(?:"|')$/gu, '');

const mermaidLabelsOnLine = (line) => {
  const labels = [];
  const addMatches = (pattern) => {
    for (const match of line.matchAll(pattern)) {
      const text = cleanMermaidLabel(
        match.slice(1).find((value) => value !== undefined) ?? '',
      );
      if (text) labels.push({index: match.index, text});
    }
  };

  addMatches(/\b[A-Za-z_][\w-]*\s*\[([^\[\]]+)\]/gu);
  addMatches(/\b[A-Za-z_][\w-]*\s*\{([^{}]+)\}/gu);
  addMatches(/\b[A-Za-z_][\w-]*\s*\(\(([^()]+)\)\)/gu);
  addMatches(/\b[A-Za-z_][\w-]*\s*\(([^()]+)\)/gu);
  addMatches(/--\s+(.+?)\s+-->/gu);
  addMatches(/-\.\s*(.+?)\s*\.->/gu);
  addMatches(/==\s*(.+?)\s*==>/gu);
  addMatches(/\|([^|]+)\|/gu);
  return labels.sort((left, right) => left.index - right.index);
};

export const extractMermaidLabels = (source, relativePath) => {
  const lines = source.split('\n');
  const records = [];
  let fence = null;

  for (let index = 0; index < lines.length; index += 1) {
    if (!fence) {
      const opening = lines[index].match(/^\s*(`{3,}|~{3,})\s*mermaid(?:\s+.*)?$/iu);
      if (opening) fence = {character: opening[1][0], length: opening[1].length};
      continue;
    }

    const closesFence = new RegExp(
      `^\\s*${fence.character}{${fence.length},}\\s*$`,
      'u',
    ).test(lines[index]);
    if (closesFence) {
      fence = null;
      continue;
    }

    if (lines[index].trimStart().startsWith('%%')) continue;
    for (const {text} of mermaidLabelsOnLine(lines[index])) {
      records.push({
        file: relativePath,
        line: index + 1,
        text,
        excerpt: lines[index].trim(),
        kind: 'mermaid',
      });
    }
  }

  if (fence) {
    throw new Error(`${relativePath}: Mermaid fenced code block must have a closing delimiter`);
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

const tsxStringValue = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isJsxExpression(node) && node.expression) return tsxStringValue(node.expression);
  return null;
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
  const addRecord = (node, text) => {
    const normalized = text.replace(/\s+/gu, ' ').trim();
    if (!normalized) return;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    records.push({
      file: relativePath,
      line,
      text: normalized,
      excerpt: sourceExcerpt(source, line),
      kind: 'tsx',
    });
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      addRecord(node, node.text);
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (visibleJsxAttributes.has(name) && node.initializer) {
        const text = tsxStringValue(node.initializer);
        if (text !== null) addRecord(node.initializer, text);
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      if (visibleObjectProperties.has(name)) {
        const text = tsxStringValue(node.initializer);
        if (text !== null) addRecord(node.initializer, text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return records;
};
