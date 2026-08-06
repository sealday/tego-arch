import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractMermaidLabels,
  extractVisibleTsxStrings,
  parseMdxVisibleCopy,
} from '../scripts/visible-copy.mjs';

test('extracts reader-visible MDX copy with stable source locations', () => {
  const source = `---
title: 示例 API
sidebar_label: API 示例
slug: /example-api
---

正文 Agent，[官方标题](https://example.com/internal/Agent)。

\`const Agent = 1\`

![Agent 图](./agent.png)

{/* 隐藏的 Agent 表达式 */}

<!-- 隐藏的 Agent 注释 -->

\`\`\`text
/private/Agent.ts
\`\`\`
`;

  const result = parseMdxVisibleCopy(source, 'content/example.mdx');

  assert.deepEqual(result.frontMatter, [
    {
      field: 'title',
      file: 'content/example.mdx',
      line: 2,
      text: '示例 API',
      excerpt: 'title: 示例 API',
      kind: 'front-matter',
    },
    {
      field: 'sidebar_label',
      file: 'content/example.mdx',
      line: 3,
      text: 'API 示例',
      excerpt: 'sidebar_label: API 示例',
      kind: 'front-matter',
    },
  ]);
  assert.ok(result.blocks.some(({line, text}) => line === 7 && text.includes('正文 Agent')));
  assert.ok(result.blocks.some(({text}) => text.includes('官方标题')));
  assert.ok(result.blocks.some(({line, text}) => line === 11 && text === 'Agent 图'));
  assert.ok(result.blocks.every(({file, excerpt, kind}) => (
    file === 'content/example.mdx'
    && typeof excerpt === 'string'
    && kind === 'body'
  )));

  const visibleText = result.blocks.map(({text}) => text).join('\n');
  assert.doesNotMatch(visibleText, /example\.com|internal|const Agent|private|表达式|注释/u);
});

test('extracts only reader-visible Mermaid labels', () => {
  const source = `# Diagram

\`\`\`mermaid
flowchart LR
  A[Agent worker] -->|调用 API| B{完成}
  B -- 校验 Agent --> C((结束))
  C -. 异步 worker .-> D[归档]
  %% X[隐藏标签]
\`\`\`
`;

  assert.deepEqual(
    extractMermaidLabels(source, 'content/diagram.mdx'),
    [
      {
        file: 'content/diagram.mdx',
        line: 5,
        text: 'Agent worker',
        excerpt: 'A[Agent worker] -->|调用 API| B{完成}',
        kind: 'mermaid',
      },
      {
        file: 'content/diagram.mdx',
        line: 5,
        text: '调用 API',
        excerpt: 'A[Agent worker] -->|调用 API| B{完成}',
        kind: 'mermaid',
      },
      {
        file: 'content/diagram.mdx',
        line: 5,
        text: '完成',
        excerpt: 'A[Agent worker] -->|调用 API| B{完成}',
        kind: 'mermaid',
      },
      {
        file: 'content/diagram.mdx',
        line: 6,
        text: '校验 Agent',
        excerpt: 'B -- 校验 Agent --> C((结束))',
        kind: 'mermaid',
      },
      {
        file: 'content/diagram.mdx',
        line: 6,
        text: '结束',
        excerpt: 'B -- 校验 Agent --> C((结束))',
        kind: 'mermaid',
      },
      {
        file: 'content/diagram.mdx',
        line: 7,
        text: '异步 worker',
        excerpt: 'C -. 异步 worker .-> D[归档]',
        kind: 'mermaid',
      },
      {
        file: 'content/diagram.mdx',
        line: 7,
        text: '归档',
        excerpt: 'C -. 异步 worker .-> D[归档]',
        kind: 'mermaid',
      },
    ],
  );
});

test('extracts only reader-visible TSX strings through the TypeScript AST', () => {
  const source = `import icon from './agent-worker.svg';
import type {Worker} from './types';

const entries = [
  {term: 'Agent', title: 'Agent worker', description: '执行任务', path: '/agent-worker'},
  {code: 'hidden Agent literal'},
];

export function Card() {
  return (
    <a href="/agent-worker" className="AgentCard" aria-label="打开 Agent 页面">
      可见 Agent 文本
      <img src={icon} alt="Agent 图" title="执行流程" />
      <Badge label="Agent 标签" description={'读者描述'} to="/hidden" />
    </a>
  );
}
`;

  assert.deepEqual(
    extractVisibleTsxStrings(source, 'src/Card.tsx').map(({line, text, kind}) => ({
      line,
      text,
      kind,
    })),
    [
      {line: 5, text: 'Agent', kind: 'tsx'},
      {line: 5, text: 'Agent worker', kind: 'tsx'},
      {line: 5, text: '执行任务', kind: 'tsx'},
      {line: 11, text: '打开 Agent 页面', kind: 'tsx'},
      {line: 12, text: '可见 Agent 文本', kind: 'tsx'},
      {line: 13, text: 'Agent 图', kind: 'tsx'},
      {line: 13, text: '执行流程', kind: 'tsx'},
      {line: 14, text: 'Agent 标签', kind: 'tsx'},
      {line: 14, text: '读者描述', kind: 'tsx'},
    ],
  );

  const records = extractVisibleTsxStrings(source, 'src/Card.tsx');
  assert.ok(records.every(({file, excerpt}) => (
    file === 'src/Card.tsx' && typeof excerpt === 'string' && excerpt.length > 0
  )));
  assert.doesNotMatch(
    records.map(({text}) => text).join('\n'),
    /agent-worker\.svg|\.\/types|\/agent-worker|AgentCard|hidden Agent literal|\/hidden/u,
  );
});

test('surfaces MDX and TSX parse errors with file context', () => {
  assert.throws(
    () => parseMdxVisibleCopy('```mdx\nunclosed', 'content/broken.mdx'),
    /content\/broken\.mdx: MDX fenced code block must have a closing delimiter/u,
  );
  assert.throws(
    () => extractVisibleTsxStrings('export const broken = <div>', 'src/broken.tsx'),
    /src\/broken\.tsx: TSX parser failed/u,
  );
});
