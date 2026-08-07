import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import test from 'node:test';

import {
  extractMermaidLabels,
  extractVisibleTsxStrings,
  parseMdxVisibleCopy,
} from '../scripts/visible-copy.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const walk = async (directory, extension) => {
  const entries = await readdir(directory, {withFileTypes: true});
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target, extension);
    return entry.isFile() && entry.name.endsWith(extension) ? [target] : [];
  }));
  return nested.flat().sort();
};

const mermaidFences = (source) => [...source.matchAll(
  /^```mermaid\s*\n([\s\S]*?)^```\s*$/gmu,
)].map((match) => `\`\`\`mermaid\n${match[1]}\`\`\``);

const jsxTextOracle = (text) => {
  const output = ts.transpileModule(
    `const value = <>${text}</>;`,
    {compilerOptions: {jsx: ts.JsxEmit.React}},
  ).outputText;
  const react = {
    Fragment: Symbol('Fragment'),
    createElement: (_type, _properties, ...children) => children.join(''),
  };
  return Function('React', `${output}\nreturn value;`)(react);
};

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

test('returns parser-owned HTML comment records outside YAML, code, and literals', () => {
  const directive = '<!-- terminology-exempt: unknown-english-term | reason: 测试 -->';
  const source = [
    '---',
    'summary: |',
    `  ${directive}`,
    '---',
    `\`\`\`text\n${directive}\n\`\`\``,
    `\`${directive}\``,
    directive,
    'unknown worker',
  ].join('\n');
  const result = parseMdxVisibleCopy(source, 'content/comments.mdx');
  assert.deepEqual(result.comments, [{
    file: 'content/comments.mdx',
    line: 9,
    text: 'terminology-exempt: unknown-english-term | reason: 测试',
    excerpt: directive,
    kind: 'html-comment',
  }]);
});

test('returns parser-owned MDX comment records for native suppression directives', () => {
  const directive = '{/* terminology-exempt: unknown-english-term | reason: 测试 */}';
  const result = parseMdxVisibleCopy(`${directive}\n\n正文`, 'content/native-comment.mdx');
  assert.deepEqual(result.comments, [{
    file: 'content/native-comment.mdx',
    line: 1,
    text: 'terminology-exempt: unknown-english-term | reason: 测试',
    excerpt: directive,
    kind: 'mdx-comment',
  }]);
});

test('collects many HTML comments without candidate-by-candidate parsing', () => {
  for (const count of [50, 100, 200, 400]) {
    const source = Array.from(
      {length: count},
      (_, index) => `<!-- comment ${index} -->\n段落 ${index}`,
    ).join('\n');
    const result = parseMdxVisibleCopy(source, `content/comments-${count}.mdx`);
    assert.equal(result.comments.length, count);
    assert.equal(result.blocks.length, count);
  }
});

test('classifies image comment openers with non-quadratic scaling', () => {
  const measure = (count) => {
    const source = Array.from(
      {length: count},
      (_, index) => `![alt ${index} <!-- visible ${index} -->](./img-${index}.png "title")`,
    ).join('\n');
    const started = performance.now();
    const parsed = parseMdxVisibleCopy(source, `content/images-${count}.mdx`);
    assert.equal(parsed.comments.length, count);
    return performance.now() - started;
  };
  measure(20);
  const timings = new Map();
  for (const count of [50, 100, 200, 400]) {
    timings.set(count, Math.min(measure(count), measure(count)));
  }
  assert.ok(
    timings.get(400) / timings.get(100) < 12,
    `expected non-quadratic image scaling: ${JSON.stringify(Object.fromEntries(timings))}`,
  );
});

test('probe tokens cannot collide with numeric entities or raw surrogate content', async () => {
  const module = await import('../scripts/visible-copy.mjs');
  assert.equal(typeof module.commentProbeTokenForTest, 'function');
  const token = module.commentProbeTokenForTest(0);
  const numericEntities = Array.from(token, (character) => (
    `&#x${character.charCodeAt(0).toString(16)};`
  )).join('');
  for (const alt of [numericEntities, `replacement-�-${token}`]) {
    const parsed = parseMdxVisibleCopy(
      `![${alt}](./image.png "metadata <!-- not a comment -->")`,
      'content/sentinel-collision.mdx',
    );
    assert.deepEqual(parsed.comments, []);
    assert.equal(parsed.blocks.length, 1);
  }
});

test('scans sentinel occupancy once and scales through 6400 image openers', () => {
  const measure = (count) => {
    const instrumentation = {};
    const source = Array.from(
      {length: count},
      () => '![<!-- c -->](x)',
    ).join('\n');
    const started = performance.now();
    const parsed = parseMdxVisibleCopy(source, `content/images-${count}.mdx`, {
      probeInstrumentation: instrumentation,
    });
    assert.equal(parsed.comments.length, count);
    assert.equal(instrumentation.sourceScans, 1);
    assert.equal(instrumentation.allocatedTokens, count);
    return performance.now() - started;
  };
  measure(200);
  const timings = new Map();
  for (const count of [1600, 3200, 6400]) {
    timings.set(count, Math.min(measure(count), measure(count)));
  }
  assert.ok(
    timings.get(6400) / timings.get(1600) < 10,
    `expected non-quadratic 6400-image scaling: ${JSON.stringify(Object.fromEntries(timings))}`,
  );
});

test('parses visible YAML front matter scalars without leaking YAML syntax', () => {
  const source = `---
title: "Agent: API" # reader title
sidebar_label: 'Agent worker'
summary: |-
  第一行 Agent
  第二行 worker
slug: /agent-worker
---
`;

  assert.deepEqual(
    parseMdxVisibleCopy(source, 'content/yaml.mdx').frontMatter,
    [
      {
        field: 'title',
        file: 'content/yaml.mdx',
        line: 2,
        text: 'Agent: API',
        excerpt: 'title: "Agent: API" # reader title',
        kind: 'front-matter',
      },
      {
        field: 'sidebar_label',
        file: 'content/yaml.mdx',
        line: 3,
        text: 'Agent worker',
        excerpt: "sidebar_label: 'Agent worker'",
        kind: 'front-matter',
      },
      {
        field: 'summary',
        file: 'content/yaml.mdx',
        line: 4,
        text: '第一行 Agent\n第二行 worker',
        excerpt: 'summary: |-',
        kind: 'front-matter',
      },
    ],
  );

  assert.deepEqual(
    parseMdxVisibleCopy(
      '---\nsummary: "Agent\\nworker\\u0020API" # hidden comment\n---\n',
      'content/escaped-yaml.mdx',
    ).frontMatter.map(({text}) => text),
    ['Agent\nworker API'],
  );
  assert.throws(
    () => parseMdxVisibleCopy('---\nsummary: "bad \\q"\n---\n', 'content/bad-yaml.mdx'),
    /content\/bad-yaml\.mdx: front matter parser failed/u,
  );
  assert.throws(
    () => parseMdxVisibleCopy('---\nsummary:\n  nested: value\n---\n', 'content/object.mdx'),
    /content\/object\.mdx: visible front matter field "summary" must be a string/u,
  );
});

test('uses one parser-owned front matter boundary for block scalars, BOM and CRLF', () => {
  const blockScalar = `---
summary: |-
  第一行 Agent
  ---
  第二行 worker
---
正文 Agent`;
  const parsedBlock = parseMdxVisibleCopy(blockScalar, 'content/block-boundary.mdx');
  assert.deepEqual(parsedBlock.frontMatter.map(({field, line, text}) => ({field, line, text})), [
    {field: 'summary', line: 2, text: '第一行 Agent\n---\n第二行 worker'},
  ]);
  assert.deepEqual(parsedBlock.blocks, [
    {
      file: 'content/block-boundary.mdx',
      line: 7,
      text: '正文 Agent',
      excerpt: '正文 Agent',
      kind: 'body',
    },
  ]);

  const crlf = '\uFEFF---\r\ntitle: "CRLF Agent"\r\nsummary: "摘要 worker"\r\n---\r\n正文 Agent';
  const parsedCrlf = parseMdxVisibleCopy(crlf, 'content/crlf.mdx');
  assert.deepEqual(
    parsedCrlf.frontMatter.map(({field, line, text}) => ({field, line, text})),
    [
      {field: 'title', line: 2, text: 'CRLF Agent'},
      {field: 'summary', line: 3, text: '摘要 worker'},
    ],
  );
  assert.deepEqual(parsedCrlf.blocks.map(({line, text, excerpt}) => ({line, text, excerpt})), [
    {line: 5, text: '正文 Agent', excerpt: '正文 Agent'},
  ]);
});

test('extracts all 72 existing summary fields with exact source lines', async () => {
  const files = await walk('content', '.mdx');
  const summaries = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const expected = source.split('\n').find((line) => line.startsWith('summary: '));
    if (!expected) continue;
    const [summary] = parseMdxVisibleCopy(source, file).frontMatter.filter(
      ({field}) => field === 'summary',
    );
    assert.ok(summary, file);
    assert.equal(summary.text, expected.slice('summary: '.length), file);
    assert.equal(summary.excerpt, expected, file);
    assert.equal(source.split('\n')[summary.line - 1], expected, file);
    summaries.push(summary);
  }

  assert.equal(summaries.length, 72);
});

test('locates each visible MDX body record on the line containing its text', () => {
  const source = `第一行没有术语
第二行出现 Agent
跨越 {/* hidden */} Agent 节点与[链接 Agent](https://example.com/Agent)
![图片 Agent](./agent.png)
<!-- suppression: next-line -->
下一行 Agent`;
  const {blocks} = parseMdxVisibleCopy(source, 'content/lines.mdx');

  assert.deepEqual(
    blocks.map(({line, text, excerpt}) => ({line, text, excerpt})),
    [
      {line: 1, text: '第一行没有术语', excerpt: '第一行没有术语'},
      {line: 2, text: '第二行出现 Agent', excerpt: '第二行出现 Agent'},
      {
        line: 3,
        text: '跨越  Agent 节点与链接 Agent',
        excerpt: '跨越  Agent 节点与[链接 Agent]',
      },
      {line: 4, text: '图片 Agent', excerpt: '![图片 Agent]'},
      {line: 6, text: '下一行 Agent', excerpt: '下一行 Agent'},
    ],
  );
  for (const block of blocks) {
    assert.ok(block.excerpt.includes('Agent') || block.line === 1);
  }
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

test('treats Mermaid HTML break tags as layout rather than reader terminology', () => {
  const labels = extractMermaidLabels(
    '```mermaid\nflowchart LR\n  A["第一行<br/>第二行"]\n```',
    'content/diagram.mdx',
  );
  assert.equal(labels[0].text, '第一行 第二行');
});

test('parses current flowchart, sequence and state diagram reader labels', async () => {
  const fixtures = [
    {
      file: 'content/methods/mth-03-adr-lifecycle.mdx',
      expected: ['已提议', '已接受', '权衡与授权完成', '已弃用', '已取代'],
    },
    {
      file: 'content/modeling/mod-08-state-machine-modeling.mdx',
      expected: ['已请求', '已接受', '业务前置条件通过', '权威确认补偿完成'],
    },
    {
      file: 'content/cases/aws-cli-agent-orchestrator.mdx',
      expected: [
        '命令行智能体编排器控制面',
        'SQLite 终端 / 收件箱 / 工作流日志簿',
        '用户',
        '目标与约束',
        '并行分派',
        '工作进程错误或超时',
      ],
    },
  ];

  for (const {file, expected} of fixtures) {
    const labels = extractMermaidLabels(await readFile(file, 'utf8'), file).map(({text}) => text);
    for (const text of expected) assert.ok(labels.includes(text), `${file}: ${text}`);
    assert.ok(labels.every((text) => !/^(?:\[\[|\[\(|\(\[|\(\(|\{\{)/u.test(text)), file);
    assert.ok(!labels.includes('planner, task, timeout'), file);
  }
});

test('covers every current Mermaid fence and fails closed on unknown structures', async () => {
  const files = await walk('content', '.mdx');
  let fenceCount = 0;
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const fence of mermaidFences(source)) {
      fenceCount += 1;
      const labels = extractMermaidLabels(fence, file);
      assert.ok(labels.length > 0, `${file}: Mermaid fence ${fenceCount} produced no labels`);
    }
  }
  assert.equal(fenceCount, 52);

  assert.throws(
    () => extractMermaidLabels('```mermaid\npie\n  "Agent": 1\n```', 'content/pie.mdx'),
    /content\/pie\.mdx:2: unsupported Mermaid diagram "pie"/u,
  );
  assert.throws(
    () => extractMermaidLabels('```mermaid\nflowchart LR\n  A[unclosed\n```', 'content/broken-flow.mdx'),
    /content\/broken-flow\.mdx:3: unsupported or malformed flowchart statement/u,
  );
  assert.throws(
    () => extractMermaidLabels('```mermaid\nflowchart LR\n  A -->\n```', 'content/incomplete-flow.mdx'),
    /content\/incomplete-flow\.mdx:3: unsupported or malformed flowchart statement/u,
  );
  assert.throws(
    () => extractMermaidLabels(
      '```mermaid\nflowchart LR\n  A[可见] --> B\n  invoke(hidden, path)\n```',
      'content/function.mdx',
    ),
    /content\/function\.mdx:4: unsupported or malformed flowchart statement/u,
  );
});

test('normalizes supported Mermaid shapes and validates non-copy directives', () => {
  const source = `\`\`\`mermaid
flowchart LR
  A[/Parallelogram/]
  B[\\Trapezoid\\]
  C(((Double Circle)))
  style A fill:#fff,stroke:#000
  classDef emphasized fill:#f00,color:#fff
  class A emphasized
  linkStyle 0 stroke:#333
  click A "https://example.com" "External docs"
\`\`\``;
  assert.deepEqual(
    extractMermaidLabels(source, 'content/shapes.mdx').map(({text}) => text),
    ['Parallelogram', 'Trapezoid', 'Double Circle'],
  );

  assert.throws(
    () => extractMermaidLabels(
      '```mermaid\nflowchart LR\n  A[visible]\n  style A\n```',
      'content/bad-style.mdx',
    ),
    /content\/bad-style\.mdx:4: malformed Mermaid style directive/u,
  );
  assert.throws(
    () => extractMermaidLabels(
      '```mermaid\nflowchart LR\n  A{{{unsupported}}}\n```',
      'content/unsupported-shape.mdx',
    ),
    /content\/unsupported-shape\.mdx:3: unsupported Mermaid node shape/u,
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

test('extracts static JSX expression branches without scanning ordinary code', () => {
  const source = `const hidden = "普通代码 Agent";
const asset = "/agent.svg";
export function Example({ready, name}) {
  return <section aria-label={\`Agent 面板：\${name}\`}>
    {"可见静态表达式"}
    {ready ? "任务已完成" : '计划主题'}
    {\`前缀 Agent \${name} 后缀 worker\`}
  </section>;
}`;
  const text = extractVisibleTsxStrings(source, 'src/Example.tsx').map((record) => record.text);

  assert.deepEqual(text, [
    'Agent 面板：',
    '可见静态表达式',
    '任务已完成',
    '计划主题',
    '前缀 Agent',
    '后缀 worker',
  ]);
  assert.doesNotMatch(text.join('\n'), /普通代码|agent\.svg/u);
});

test('walks concatenated JSX and object copy while preserving multiline source lines', () => {
  const source = `const dynamic = getValue();
const copy = {
  title: "标题 Agent：" + dynamic + " 完成",
  term: dynamic ? "术语 worker" : '备用 API',
  description: \`描述前缀 \${dynamic} 描述后缀\`,
};
export function Copy() {
  return <section aria-label={"属性 Agent：" + dynamic + " 可见"}>
    第一行 Agent
    第二行 worker
    {"表达式 API：" + dynamic + " 结束"}
    {dynamic && "逻辑分支 Agent"}
    {dynamic || "逻辑备用 worker"}
  </section>;
}`;
  assert.deepEqual(
    extractVisibleTsxStrings(source, 'src/Copy.tsx').map(({line, text, excerpt}) => ({
      line,
      text,
      excerpt,
    })),
    [
      {line: 3, text: '标题 Agent：', excerpt: 'title: "标题 Agent：" + dynamic + " 完成",'},
      {line: 3, text: '完成', excerpt: 'title: "标题 Agent：" + dynamic + " 完成",'},
      {line: 4, text: '术语 worker', excerpt: 'term: dynamic ? "术语 worker" : \'备用 API\','},
      {line: 4, text: '备用 API', excerpt: 'term: dynamic ? "术语 worker" : \'备用 API\','},
      {line: 5, text: '描述前缀', excerpt: 'description: `描述前缀 ${dynamic} 描述后缀`,'},
      {line: 5, text: '描述后缀', excerpt: 'description: `描述前缀 ${dynamic} 描述后缀`,'},
      {line: 8, text: '属性 Agent：', excerpt: 'return <section aria-label={"属性 Agent：" + dynamic + " 可见"}>'},
      {line: 8, text: '可见', excerpt: 'return <section aria-label={"属性 Agent：" + dynamic + " 可见"}>'},
      {line: 9, text: '第一行 Agent', excerpt: '第一行 Agent'},
      {line: 10, text: '第二行 worker', excerpt: '第二行 worker'},
      {line: 11, text: '表达式 API：', excerpt: '{"表达式 API：" + dynamic + " 结束"}'},
      {line: 11, text: '结束', excerpt: '{"表达式 API：" + dynamic + " 结束"}'},
      {line: 12, text: '逻辑分支 Agent', excerpt: '{dynamic && "逻辑分支 Agent"}'},
      {line: 13, text: '逻辑备用 worker', excerpt: '{dynamic || "逻辑备用 worker"}'},
    ],
  );
});

test('decodes raw JSX character references without changing JavaScript literals', () => {
  const source = `const copy = {
  title: "JavaScript &amp; literal",
  description: \`Template &apos; literal\`,
};
export function Entities() {
  return <div>
    Agent&nbsp;worker &amp; API &apos;ok&apos; &quot;q&quot; &lt;x&gt; &#65; &#x1F600;
    unknown &bogus; malformed &amp
  </div>;
}`;

  assert.deepEqual(
    extractVisibleTsxStrings(source, 'src/Entities.tsx').map(({line, text, excerpt}) => ({
      line,
      text,
      excerpt,
    })),
    [
      {
        line: 2,
        text: 'JavaScript &amp; literal',
        excerpt: 'title: "JavaScript &amp; literal",',
      },
      {
        line: 3,
        text: 'Template &apos; literal',
        excerpt: 'description: `Template &apos; literal`,',
      },
      {
        line: 7,
        text: 'Agent worker & API \'ok\' "q" <x> A 😀',
        excerpt: 'Agent&nbsp;worker &amp; API &apos;ok&apos; &quot;q&quot; &lt;x&gt; &#65; &#x1F600;',
      },
      {
        line: 8,
        text: 'unknown &bogus; malformed &amp',
        excerpt: 'unknown &bogus; malformed &amp',
      },
    ],
  );
});

test('matches TypeScript JSX named character reference semantics', () => {
  const raw = '&AMP; &Abreve; &lang; &rang; we&apos;ll A&amp;B left&nbsp;right &#65; &#x41;';
  const expected = jsxTextOracle(raw).replace(/\s+/gu, ' ').trim();
  assert.equal(expected, "&AMP; &Abreve; 〈 〉 we'll A&B left right A A");

  const source = `export function ExactEntities() {
  return <div>
    ${raw}
  </div>;
}`;
  assert.deepEqual(
    extractVisibleTsxStrings(source, 'src/ExactEntities.tsx').map(({line, text, excerpt}) => ({
      line,
      text,
      excerpt,
    })),
    [{line: 3, text: expected, excerpt: raw}],
  );
});

test('fails closed on an out-of-range JSX numeric character reference', () => {
  assert.throws(
    () => extractVisibleTsxStrings(
      'export const Broken = () => <div>\n  invalid &#x110000;\n</div>;',
      'src/Broken.tsx',
    ),
    /src\/Broken\.tsx:2: invalid JSX numeric character reference "&#x110000;"/u,
  );
});

test('decodes reader-visible character references in HomepageFeatures', async () => {
  const file = 'src/components/HomepageFeatures/index.tsx';
  const records = extractVisibleTsxStrings(await readFile(file, 'utf8'), file);
  assert.ok(records.some(({line, text, excerpt}) => (
    line === 28
    && text === "Docusaurus lets you focus on your docs, and we'll do the chores. Go"
    && excerpt.includes('we&apos;ll')
  )));
  assert.doesNotMatch(records.map(({text}) => text).join('\n'), /&apos;/u);
});

test('extracts reader copy from current CaseCard and topic indexes', async () => {
  const fixtures = [
    {
      file: 'src/components/CaseCard/index.tsx',
      expected: ['阅读案例：', '涉及的架构主题', 'CASE', '打开研究档案'],
    },
    {
      file: 'src/components/PatternTopicIndex/index.tsx',
      expected: ['该分组尚无已登记主题。', '内容状态：', '计划主题', '外部学习起点'],
    },
    {
      file: 'src/components/TopicIndex/index.tsx',
      expected: ['当前没有符合条件的主题。', '任务已完成', '计划主题', '内容状态：'],
    },
  ];

  for (const {file, expected} of fixtures) {
    const records = extractVisibleTsxStrings(await readFile(file, 'utf8'), file);
    const text = records.map((record) => record.text);
    for (const value of expected) assert.ok(text.includes(value), `${file}: ${value}`);
    assert.ok(records.every((record) => record.excerpt === record.excerpt.trim()), file);
  }
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
