import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {parseMdxVisibleCopy, renderVisibleBlock} from '../scripts/visible-copy.mjs';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

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

const issueFromLine = (relativePath, source, line, ruleId, excerpt) => ({
  file: relativePath,
  line,
  ruleId,
  excerpt: excerpt ?? source.split('\n')[line - 1].trim(),
});

const findEditorialIssues = (relativePath, source, ast) => {
  const issues = [];
  const inspectList = (list) => {
    for (const node of list.children ?? []) {
      if (node.type !== 'listItem') continue;
      const text = renderVisibleBlock(node, {includeInlineCode: true}).text.trim();
      if (/^补充[^\n]+$/u.test(text)) {
        issues.push(issueFromLine(
          relativePath,
          source,
          node.position.start.line,
          'editorial-task-item',
        ));
      }
    }
  };

  const processContainer = (container) => {
    let insideEditorialSection = false;
    for (const node of container.children ?? []) {
      if (node.type === 'heading' && node.depth <= 2) {
        const heading = renderVisibleBlock(node, {includeInlineCode: true}).text.trim();
        insideEditorialSection = node.depth === 2 && heading === '后续待补';
        if (insideEditorialSection) {
          issues.push(issueFromLine(
            relativePath,
            source,
            node.position.start.line,
            'editorial-todo-heading',
          ));
        }
      } else if (insideEditorialSection && node.type === 'list') {
        inspectList(node);
      }

      if (node.children?.length) processContainer(node);
    }
  };

  processContainer(ast);

  return issues;
};

const findMdxIssues = (relativePath, source) => {
  const {ast, blocks, normalized} = parseMdxVisibleCopy(
    source,
    relativePath,
    {includeInlineCode: true, includeStructure: true},
  );
  const generatedRule = rules.find(({id}) => id === 'generated-page-meta');
  const issues = [];

  for (const block of blocks) {
    const matches = block.text.matchAll(
      new RegExp(generatedRule.pattern.source, generatedRule.pattern.flags),
    );
    for (const match of matches) {
      const line = block.lines[match.index];
      issues.push(issueFromLine(
        relativePath,
        normalized,
        line,
        generatedRule.id,
        block.excerptAt(line),
      ));
    }
  }

  return [...issues, ...findEditorialIssues(relativePath, normalized, ast)];
};

const findProductCopyIssues = (relativePath, source) => {
  if (relativePath.endsWith('.mdx')) return findMdxIssues(relativePath, source);

  const issues = [];

  for (const rule of rules) {
    if (!rule.applies(relativePath) || rule.id === 'generated-page-meta') continue;
    const matches = source.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));

    for (const match of matches) {
      const line = source.slice(0, match.index).split('\n').length;
      issues.push(issueFromLine(relativePath, source, line, rule.id));
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

test('reference-definition grammar leaves trailing visible text unmasked', () => {
  const fixture = `# Example
[ref]: /safe 本页从机器可读主题清单生成
`;

  assert.deepEqual(findProductCopyIssues('content/cases/invalid-reference.mdx', fixture), [
    {
      file: 'content/cases/invalid-reference.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '[ref]: /safe 本页从机器可读主题清单生成',
    },
  ]);
});

test('reference-definition grammar masks next-line destinations and valid titles', () => {
  const fixture = `# Example
[next-destination]:
  /本页从机器可读主题清单生成
[same-line-title]: /safe "本页从机器可读主题清单生成"
[next-line-title]: /safe
  (本页从机器可读主题清单生成)

本页从机器可读主题清单生成。
`;

  assert.deepEqual(findProductCopyIssues('content/cases/multiline-references.mdx', fixture), [
    {
      file: 'content/cases/multiline-references.mdx',
      line: 8,
      ruleId: 'generated-page-meta',
      excerpt: '本页从机器可读主题清单生成。',
    },
  ]);
});

test('reference-definition grammar leaves extra text after a title visible', () => {
  const fixture = `# Example
[ref]: /safe "title" 本页从机器可读主题清单生成
`;

  assert.deepEqual(findProductCopyIssues('content/cases/invalid-title.mdx', fixture), [
    {
      file: 'content/cases/invalid-title.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '[ref]: /safe "title" 本页从机器可读主题清单生成',
    },
  ]);
});

test('matches MDX compiler paragraph-interruption visibility', () => {
  const fixture = `Foo
[ref]: /本页从机器可读主题清单生成
`;

  assert.deepEqual(findProductCopyIssues('content/cases/interrupted-definition.mdx', fixture), [
    {
      file: 'content/cases/interrupted-definition.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '[ref]: /本页从机器可读主题清单生成',
    },
  ]);
});

test('matches MDX compiler container-definition visibility', () => {
  const fixture = `# Example
> [quote]: /本页从机器可读主题清单生成
> [quote]

- [list]: /本页从机器可读主题清单生成
- [list]

本页从机器可读主题清单生成。
`;

  assert.deepEqual(findProductCopyIssues('content/cases/container-definitions.mdx', fixture), [
    {
      file: 'content/cases/container-definitions.mdx',
      line: 8,
      ruleId: 'generated-page-meta',
      excerpt: '本页从机器可读主题清单生成。',
    },
  ]);
});

test('matches MDX compiler invalid-inline-link visibility', () => {
  const fixture = `# Example
[x](/safe 本页从机器可读主题清单生成)
`;

  assert.deepEqual(findProductCopyIssues('content/cases/invalid-inline-link.mdx', fixture), [
    {
      file: 'content/cases/invalid-inline-link.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '[x](/safe 本页从机器可读主题清单生成)',
    },
  ]);
});

test('matches MDX compiler code-span link-label visibility', () => {
  const fixture = `# Example
[foo \`]\` bar](/本页从机器可读主题清单生成)

计划主题仍由长期 backlog 跟踪。
`;

  assert.deepEqual(findProductCopyIssues('content/cases/code-span-label.mdx', fixture), [
    {
      file: 'content/cases/code-span-label.mdx',
      line: 4,
      ruleId: 'generated-page-meta',
      excerpt: '计划主题仍由长期 backlog 跟踪。',
    },
  ]);
});

test('joins visible text across link boundaries for contextual rules', () => {
  const fixture = `# Example
计划主题仍由[长期 backlog](https://example.com/internal) 跟踪。
`;

  assert.deepEqual(findProductCopyIssues('content/cases/split-context.mdx', fixture), [
    {
      file: 'content/cases/split-context.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '计划主题仍由[长期 backlog] 跟踪。',
    },
  ]);
});

test('AST comment preprocessing preserves closed tokens in inline code', () => {
  const fixture = `# Example
\`<!-- 本页从机器可读主题清单生成 -->\`
`;

  assert.deepEqual(findProductCopyIssues('content/cases/closed-comment-code.mdx', fixture), [
    {
      file: 'content/cases/closed-comment-code.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '<!-- 本页从机器可读主题清单生成 -->',
    },
  ]);
});

test('AST comment preprocessing preserves unclosed tokens in inline code', () => {
  const fixture = `# Example
\`<!-- 本页从机器可读主题清单生成\`
`;

  assert.deepEqual(findProductCopyIssues('content/cases/unclosed-comment-code.mdx', fixture), [
    {
      file: 'content/cases/unclosed-comment-code.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '<!-- 本页从机器可读主题清单生成',
    },
  ]);
});

test('AST comment preprocessing still masks and validates actual comments', () => {
  assert.deepEqual(
    findProductCopyIssues(
      'content/cases/closed-comment.mdx',
      '<!-- 本页从机器可读主题清单生成 -->\n',
    ),
    [],
  );
  assert.throws(
    () => findProductCopyIssues(
      'content/cases/unclosed-comment.mdx',
      '<!-- 本页从机器可读主题清单生成\n',
    ),
    (error) => {
      assert.match(error.message, /content\/cases\/unclosed-comment\.mdx/u);
      assert.match(error.message, /HTML comment/u);
      return true;
    },
  );
});

test('escaped opener comment classification keeps visible source text', () => {
  const fixture = `# Example
\\<!-- 本页从机器可读主题清单生成 -->
`;

  assert.deepEqual(findProductCopyIssues('content/cases/escaped-comment.mdx', fixture), [
    {
      file: 'content/cases/escaped-comment.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '\\<!-- 本页从机器可读主题清单生成 -->',
    },
  ]);
  assert.deepEqual(
    findProductCopyIssues(
      'content/cases/even-backslashes-comment.mdx',
      `# Example
\\\\<!-- 本页从机器可读主题清单生成 -->
`,
    ),
    [],
  );
});

test('escaped opener diagnostic restoration preserves a longer odd backslash run', () => {
  const tripleBackslashOpener = String.raw`\\\<!-- 本页从机器可读主题清单生成 -->`;
  assert.deepEqual(
    findProductCopyIssues(
      'content/cases/triple-backslash-comment.mdx',
      `# Example\n${tripleBackslashOpener}\n`,
    ),
    [
      {
        file: 'content/cases/triple-backslash-comment.mdx',
        line: 2,
        ruleId: 'generated-page-meta',
        excerpt: tripleBackslashOpener,
      },
    ],
  );
});

test('escaped opener diagnostic restoration preserves multiple openers', () => {
  const singleBackslashOpener = String.raw`\<!-- 本页从机器可读主题清单生成 -->`;
  const repeatedLine = `${singleBackslashOpener} 与 ${singleBackslashOpener}`;
  assert.deepEqual(
    findProductCopyIssues(
      'content/cases/repeated-escaped-comments.mdx',
      `# Example\n${repeatedLine}\n`,
    ),
    [
      {
        file: 'content/cases/repeated-escaped-comments.mdx',
        line: 2,
        ruleId: 'generated-page-meta',
        excerpt: repeatedLine,
      },
      {
        file: 'content/cases/repeated-escaped-comments.mdx',
        line: 2,
        ruleId: 'generated-page-meta',
        excerpt: repeatedLine,
      },
    ],
  );
});

test('AST metadata comment classification protects link and definition titles', () => {
  const fixture = `# Example
[inline](/safe "<!-- 本页从机器可读主题清单生成")

[reference]: /safe "<!-- 本页从机器可读主题清单生成"
`;

  assert.deepEqual(findProductCopyIssues('content/cases/comment-titles.mdx', fixture), []);
});

test('AST metadata comment classification protects image titles', () => {
  const fixture = `# Example
![diagram](/safe "<!-- 本页从机器可读主题清单生成")
`;

  assert.deepEqual(findProductCopyIssues('content/cases/image-comment-title.mdx', fixture), []);
});

test('entity-safe image metadata classification ignores decoded alt collisions', () => {
  const fixture = `# Example
![CM&#78;T](/safe "<!-- 本页从机器可读主题清单生成")
`;

  assert.deepEqual(findProductCopyIssues('content/cases/entity-image-title.mdx', fixture), []);
});

test('per-opener image alt classification handles nested metadata before visible alt', () => {
  const fixture = `# Example
![outer [inner](/safe "<!-- hidden") \\<!-- 本页从机器可读主题清单生成 -->](/outer)
`;

  assert.deepEqual(findProductCopyIssues('content/cases/nested-image-opener.mdx', fixture), [
    {
      file: 'content/cases/nested-image-opener.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '![outer inner \\<!-- 本页从机器可读主题清单生成 -->]',
    },
  ]);
});

test('image-reference opener classification handles nested metadata before visible alt', () => {
  const fixture = `# Example
![outer [inner](/safe "<!-- hidden") \\<!-- 本页从机器可读主题清单生成 -->][outer]

[outer]: /image
`;

  assert.deepEqual(findProductCopyIssues('content/cases/full-image-reference.mdx', fixture), [
    {
      file: 'content/cases/full-image-reference.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '![outer inner \\<!-- 本页从机器可读主题清单生成 -->]',
    },
  ]);
});

test('image-reference opener classification excludes hidden full-reference labels', () => {
  const visibleAlt = String.raw`\<!-- 本页从机器可读主题清单生成 -->`;
  const hiddenLabel = String.raw`\<!-- hidden`;
  const fixture = `# Example
![${visibleAlt}][${hiddenLabel}]

[${hiddenLabel}]: /image
`;

  assert.deepEqual(findProductCopyIssues('content/cases/label-image-reference.mdx', fixture), [
    {
      file: 'content/cases/label-image-reference.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: `![${visibleAlt}]`,
    },
  ]);
});

test('image-reference opener classification preserves collapsed visible alt', () => {
  const visibleAlt = String.raw`\<!-- 本页从机器可读主题清单生成 -->`;
  const fixture = `# Example
![${visibleAlt}][]

[${visibleAlt}]: /image
`;

  assert.deepEqual(findProductCopyIssues('content/cases/collapsed-image-reference.mdx', fixture), [
    {
      file: 'content/cases/collapsed-image-reference.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: `![${visibleAlt}]`,
    },
  ]);
});

test('image-reference opener classification preserves shortcut visible alt', () => {
  const visibleAlt = String.raw`\<!-- 本页从机器可读主题清单生成 -->`;
  const fixture = `# Example
![${visibleAlt}]

[${visibleAlt}]: /image
`;

  assert.deepEqual(findProductCopyIssues('content/cases/shortcut-image-reference.mdx', fixture), [
    {
      file: 'content/cases/shortcut-image-reference.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: `![${visibleAlt}]`,
    },
  ]);
});

test('per-opener diagnostic restoration ignores escaped metadata openers', () => {
  const hiddenLink = String.raw`[x](/safe "\<!-- hidden")`;
  const visibleOpener = String.raw`\\\<!-- 本页从机器可读主题清单生成 -->`;
  const fixture = `# Example\n${hiddenLink} and ${visibleOpener}\n`;

  assert.deepEqual(findProductCopyIssues('content/cases/metadata-before-visible.mdx', fixture), [
    {
      file: 'content/cases/metadata-before-visible.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: `[x] and ${visibleOpener}`,
    },
  ]);
});

test('escaped opener comment classification keeps image alt text visible', () => {
  const fixture = `# Example
![\\<!-- 本页从机器可读主题清单生成 -->](/safe "diagram")
`;

  assert.deepEqual(findProductCopyIssues('content/cases/image-comment-alt.mdx', fixture), [
    {
      file: 'content/cases/image-comment-alt.mdx',
      line: 2,
      ruleId: 'generated-page-meta',
      excerpt: '![\\<!-- 本页从机器可读主题清单生成 -->]',
    },
  ]);
});

test('finds nested editorial sections inside blockquotes without duplicates', () => {
  const fixture = `> ## 后续待补
>
> - 补充容器案例。
`;

  assert.deepEqual(findProductCopyIssues('content/paths/blockquote.mdx', fixture), [
    {
      file: 'content/paths/blockquote.mdx',
      line: 1,
      ruleId: 'editorial-todo-heading',
      excerpt: '> ## 后续待补',
    },
    {
      file: 'content/paths/blockquote.mdx',
      line: 3,
      ruleId: 'editorial-task-item',
      excerpt: '> - 补充容器案例。',
    },
  ]);
});

test('finds nested editorial sections inside MDX JSX without duplicates', () => {
  const fixture = `<Section>
## 后续待补

- 补充容器案例。
</Section>
`;

  assert.deepEqual(findProductCopyIssues('content/paths/jsx-section.mdx', fixture), [
    {
      file: 'content/paths/jsx-section.mdx',
      line: 2,
      ruleId: 'editorial-todo-heading',
      excerpt: '## 后续待补',
    },
    {
      file: 'content/paths/jsx-section.mdx',
      line: 4,
      ruleId: 'editorial-task-item',
      excerpt: '- 补充容器案例。',
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
    {
      structure: 'MDX parser',
      source: '# Example\n\n<Component\n',
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
