import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

const blankCharacters = (value) => value.replace(/[^\n]/gu, ' ');

const maskLinkDestinations = (source) => {
  const masked = source.split('');

  for (let start = 0; start < source.length; start += 1) {
    const labelOpening = source[start] === '['
      ? start
      : source[start] === '!' && source[start + 1] === '['
        ? start + 1
        : -1;
    if (labelOpening === -1) continue;

    let labelDepth = 1;
    let escaped = false;
    let labelClosing = -1;
    for (let index = labelOpening + 1; index < source.length; index += 1) {
      const character = source[index];
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '[') {
        labelDepth += 1;
      } else if (character === ']') {
        labelDepth -= 1;
        if (labelDepth === 0) {
          labelClosing = index;
          break;
        }
      }
    }

    const opening = labelClosing + 1;
    if (labelClosing === -1 || source[opening] !== '(') continue;

    let depth = 1;
    escaped = false;
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

    if (closing === -1) continue;

    for (let index = opening; index <= closing; index += 1) {
      if (masked[index] !== '\n') masked[index] = ' ';
    }
    start = closing;
  }

  return masked.join('');
};

const maskReferenceDefinitions = (source) => source
  .split('\n')
  .map((line) => (
    /^ {0,3}\[(?:\\.|[^\]\\])+\]:[ \t]*(?:<[^>\n]+>|\S+)/u.test(line)
      ? blankCharacters(line)
      : line
  ))
  .join('\n');

const visibleMdxSource = (source, relativePath) => {
  const lines = source.split('\n');

  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    assert.notEqual(
      end,
      -1,
      `${relativePath}: MDX front matter must have a closing delimiter`,
    );
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

  assert.equal(
    fence,
    null,
    `${relativePath}: MDX fenced code block must have a closing delimiter`,
  );

  const withoutFences = lines.join('\n');
  for (let cursor = 0; cursor < withoutFences.length;) {
    const commentOpening = withoutFences.indexOf('<!--', cursor);
    if (commentOpening === -1) break;
    const commentClosing = withoutFences.indexOf('-->', commentOpening + 4);
    if (commentClosing === -1) {
      assert.fail(`${relativePath}: MDX HTML comment must have a closing delimiter`);
    }
    cursor = commentClosing + 3;
  }

  return maskLinkDestinations(
    maskReferenceDefinitions(
      withoutFences.replace(/<!--[\s\S]*?-->/gu, blankCharacters),
    ),
  );
};

const findEditorialTaskItems = (source) => {
  const matches = [];
  let offset = 0;
  let insideEditorialSection = false;

  for (const line of source.split('\n')) {
    const sectionHeading = line.match(/^(#{1,2})\s+(.+?)\s*$/u);
    if (sectionHeading) {
      insideEditorialSection =
        sectionHeading[1] === '##' && sectionHeading[2] === '后续待补';
    }

    if (insideEditorialSection) {
      const item = line.match(/^-\s+补充[^\n]+$/u);
      if (item) matches.push({index: offset + item.index, text: item[0]});
    }

    offset += line.length + 1;
  }

  return matches;
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
  {
    id: 'editorial-todo-heading',
    applies: (file) => file.endsWith('.mdx'),
    pattern: /^##\s+后续待补\s*$/gmu,
  },
  {
    id: 'editorial-task-item',
    applies: (file) => file.endsWith('.mdx'),
    find: findEditorialTaskItems,
  },
];

const findProductCopyIssues = (relativePath, source) => {
  const visible = relativePath.endsWith('.mdx')
    ? visibleMdxSource(source, relativePath)
    : source;
  const issues = [];

  for (const rule of rules) {
    if (!rule.applies(relativePath)) continue;
    const matches = rule.find
      ? rule.find(visible)
      : visible.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));

    for (const match of matches) {
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

test('masks complex inline destinations without changing source line numbers', () => {
  const fixtures = [
    {
      name: 'empty-alt image',
      source: '![](https://example.com/本页从机器可读主题清单生成)',
      visibleLine: 4,
    },
    {
      name: 'escaped label',
      source: '[escaped \\] label](https://example.com/本页从机器可读主题清单生成)',
      visibleLine: 4,
    },
    {
      name: 'nested label',
      source: '[nested [label]](https://example.com/本页从机器可读主题清单生成)',
      visibleLine: 4,
    },
    {
      name: 'multiline label',
      source: '[multiline\nlabel](https://example.com/本页从机器可读主题清单生成)',
      visibleLine: 5,
    },
    {
      name: 'valid link after unmatched candidate',
      source: '[broken](https://example.com/unclosed\n[later](https://example.com/本页从机器可读主题清单生成)',
      visibleLine: 5,
    },
  ];

  for (const {name, source, visibleLine} of fixtures) {
    const fixture = `# Example\n${source}\n\n计划主题仍由长期 backlog 跟踪。\n`;
    assert.deepEqual(
      findProductCopyIssues(`content/cases/${name}.mdx`, fixture),
      [
        {
          file: `content/cases/${name}.mdx`,
          line: visibleLine,
          ruleId: 'generated-page-meta',
          excerpt: '计划主题仍由长期 backlog 跟踪。',
        },
      ],
      name,
    );
  }
});

test('masks reference-definition destinations without changing source line numbers', () => {
  const fixture = `# Example
[raw]: https://example.com/本页从机器可读主题清单生成
[angle]: <https://example.com/本页从机器可读主题清单生成>

本页从机器可读主题清单生成。
`;

  assert.deepEqual(findProductCopyIssues('content/cases/references.mdx', fixture), [
    {
      file: 'content/cases/references.mdx',
      line: 5,
      ruleId: 'generated-page-meta',
      excerpt: '本页从机器可读主题清单生成。',
    },
  ]);
});

test('preserves visible link labels and image markers exactly', () => {
  const fixture = `# Example
[本页从机器可读主题清单生成](https://example.com/reference)
![本页从机器可读主题清单生成](https://example.com/image.png)
`;

  assert.deepEqual(findProductCopyIssues('content/cases/visible-labels.mdx', fixture), [
    {
      file: 'content/cases/visible-labels.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '[本页从机器可读主题清单生成]',
    },
    {
      file: 'content/cases/visible-labels.mdx',
      line: 3,
      ruleId: 'generated-page-meta',
      excerpt: '![本页从机器可读主题清单生成]',
    },
  ]);
});

test('reports file context for unsafe MDX structures', () => {
  const fixtures = [
    {
      structure: 'front matter',
      source: '---\ntitle: Example\n',
    },
    {
      structure: 'fenced code block',
      source: '# Example\n\n```text\nunclosed\n',
    },
    {
      structure: 'HTML comment',
      source: '# Example\n\n<!-- unclosed\n',
    },
  ];

  for (const {structure, source} of fixtures) {
    assert.throws(
      () => findProductCopyIssues('content/cases/broken.mdx', source),
      (error) => {
        assert.match(error.message, /content\/cases\/broken\.mdx/u);
        assert.match(error.message, new RegExp(structure, 'u'));
        return true;
      },
    );
  }
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

  const pathFixture = `# 云原生与平台

## 后续待补

- 补充镜像供应链案例。
`;
  assert.deepEqual(
    findProductCopyIssues('content/paths/example.mdx', pathFixture).map(({ruleId}) => ruleId),
    ['editorial-todo-heading', 'editorial-task-item'],
  );

  const legitimatePathFixture = `# 容量设计

- 补充容量用于吸收短时突发，并不是编辑任务。

## 延伸问题

- 补充容量应由哪些负载信号决定？
`;
  assert.deepEqual(
    findProductCopyIssues('content/paths/example.mdx', legitimatePathFixture),
    [],
  );
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
