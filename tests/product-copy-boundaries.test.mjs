import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

const blankCharacters = (value) => value.replace(/[^\n]/gu, ' ');

const maskLinkDestinations = (source) => {
  const link = /(!?)\[([^\]\n]+)\]\(/gu;
  const parts = [];
  let cursor = 0;

  for (let match = link.exec(source); match; match = link.exec(source)) {
    const opening = link.lastIndex - 1;
    let depth = 1;
    let escaped = false;
    let closing = -1;

    for (let index = opening + 1; index < source.length; index += 1) {
      const character = source[index];
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '(') {
        depth += 1;
      } else if (character === ')') {
        depth -= 1;
        if (depth === 0) {
          closing = index;
          break;
        }
      }
    }

    if (closing === -1) break;

    parts.push(
      source.slice(cursor, match.index),
      `${match[1]}${match[2]}`,
      blankCharacters(source.slice(opening, closing + 1)),
    );
    cursor = closing + 1;
    link.lastIndex = cursor;
  }

  parts.push(source.slice(cursor));
  return parts.join('');
};

const visibleMdxSource = (source) => {
  const lines = source.split('\n');

  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    assert.notEqual(end, -1, 'MDX front matter must have a closing delimiter');
    for (let index = 0; index <= end; index += 1) lines[index] = '';
  }

  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^\s*(`{3,}|~{3,})/u);
    if (!fence && opening) {
      fence = {character: opening[1][0], length: opening[1].length};
      lines[index] = '';
      continue;
    }
    if (fence) {
      const closing = new RegExp(
        `^\\s*${fence.character}{${fence.length},}\\s*$`,
        'u',
      );
      const closesFence = closing.test(lines[index]);
      lines[index] = '';
      if (closesFence) fence = null;
    }
  }

  assert.equal(fence, null, 'MDX fenced code block must have a closing delimiter');

  return maskLinkDestinations(
    lines.join('\n').replace(/<!--[\s\S]*?-->/gu, blankCharacters),
  );
};

const rules = [
  {
    id: 'homepage-design-rationale',
    applies: (file) => file === 'src/pages/index.tsx',
    pattern: /首页保留方向|实时进度回到\s*backlog/giu,
  },
  {
    id: 'homepage-internal-progress-label',
    applies: (file) => file === 'src/pages/index.tsx',
    pattern: /查看实时\s*backlog/giu,
  },
  {
    id: 'generated-page-meta',
    applies: (file) => file.endsWith('.mdx'),
    pattern: /本页从机器可读主题清单生成|计划主题[^。\n]{0,40}长期\s+backlog\s+跟踪/giu,
  },
];

const findProductCopyIssues = (relativePath, source) => {
  const visible = relativePath.endsWith('.mdx') ? visibleMdxSource(source) : source;
  const issues = [];

  for (const rule of rules) {
    if (!rule.applies(relativePath)) continue;
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of visible.matchAll(pattern)) {
      const line = visible.slice(0, match.index).split('\n').length;
      issues.push({
        file: relativePath,
        line,
        ruleId: rule.id,
        excerpt: visible.split('\n')[line - 1].trim(),
      });
    }
  }

  return issues;
};

const walkMdx = async (directory) => {
  const entries = await readdir(directory, {withFileTypes: true});
  const nested = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return walkMdx(absolute);
        return entry.isFile() && entry.name.endsWith('.mdx') ? [absolute] : [];
      }),
  );
  return nested.flat();
};

test('normalizes only non-visible MDX regions', () => {
  const fixture = `---
title: 首页保留方向
---

本文以固定版本为证据范围。Kafka queue backlog 是领域术语。

\`\`\`text
查看实时 backlog
TODO from upstream
\`\`\`

<!-- 本页从机器可读主题清单生成 -->
[上游 TODO](https://example.com/长期-backlog)
`;

  assert.deepEqual(findProductCopyIssues('content/cases/example.mdx', fixture), []);
});

test('keeps shorter fence runs hidden without changing source line numbers', () => {
  const fixture = `# Example

\`\`\`\`mdx
\`\`\`
本页从机器可读主题清单生成
\`\`\`
\`\`\`\`

计划主题仍由长期 backlog 跟踪。
`;

  assert.deepEqual(findProductCopyIssues('content/cases/example.mdx', fixture), [
    {
      file: 'content/cases/example.mdx',
      line: 9,
      ruleId: 'generated-page-meta',
      excerpt: '计划主题仍由长期 backlog 跟踪。',
    },
  ]);
});

test('masks balanced and escaped parentheses in link destinations', () => {
  const fixture = `# Example
[上游参考](https://example.com/path_(nested(value))/escaped\\(part\\)/本页从机器可读主题清单生成)

计划主题仍由长期 backlog 跟踪。
`;

  assert.deepEqual(findProductCopyIssues('content/cases/example.mdx', fixture), [
    {
      file: 'content/cases/example.mdx',
      line: 4,
      ruleId: 'generated-page-meta',
      excerpt: '计划主题仍由长期 backlog 跟踪。',
    },
  ]);
});

test('reports rule id, line, and excerpt for product-process language', () => {
  const fixture = `# 架构方法

本页从机器可读主题清单生成。计划主题仍由长期 backlog 跟踪。
`;
  const issues = findProductCopyIssues('content/methods/index.mdx', fixture);

  assert.deepEqual(issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 3, ruleId: 'generated-page-meta'},
    {line: 3, ruleId: 'generated-page-meta'},
  ]);
  assert.ok(issues.every(({excerpt}) => excerpt.startsWith('本页从机器可读主题清单生成')));
});

test('keeps public pages free of internal product-process language', async () => {
  const mdxFiles = await walkMdx(path.join(repositoryRoot, 'content'));
  const relativeFiles = [
    'src/pages/index.tsx',
    ...mdxFiles.map((file) => path.relative(repositoryRoot, file)),
  ];
  const issues = (
    await Promise.all(
      relativeFiles.map(async (file) =>
        findProductCopyIssues(file, await readFile(path.join(repositoryRoot, file), 'utf8')),
      ),
    )
  ).flat();

  assert.equal(
    issues.length,
    0,
    `Internal product-process language found:\n${issues
      .map(({file, line, ruleId, excerpt}) => `${file}:${line} [${ruleId}] ${excerpt}`)
      .join('\n')}`,
  );
});
