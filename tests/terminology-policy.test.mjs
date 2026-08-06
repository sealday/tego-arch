import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

import {
  buildLineOffsets,
  checkTerminology,
  lineFromOffsets,
  terminologyRuleOrder,
} from '../scripts/check-terminology.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const repositorySourceLedger = JSON.parse(
  await readFile(path.join(repositoryRoot, 'data/source-ledger.json'), 'utf8'),
);
const officialSource = repositorySourceLedger.sources[0];
const officialLocator = officialSource.canonical_locator;

const terms = [
  {
    id: 'quality-attribute',
    canonical_zh: '质量属性',
    english: 'Quality Attribute',
    acronym: null,
    kind: 'translated-term',
    first_use: '质量属性（Quality Attribute）',
    subsequent_use: ['质量属性'],
    allowed_aliases: [],
    forbidden_aliases: ['quality attribute', 'Quality Attribute'],
    note: '测试普通译名。',
    order: 10,
  },
  {
    id: 'architecturally-significant-requirement',
    canonical_zh: '架构重要需求',
    english: 'Architecturally Significant Requirement',
    acronym: 'ASR',
    kind: 'acronym',
    first_use: '架构重要需求（Architecturally Significant Requirement，ASR）',
    subsequent_use: ['架构重要需求', 'ASR'],
    allowed_aliases: [],
    forbidden_aliases: [
      'Architecturally Significant Requirement',
      'architecture significant requirement',
    ],
    note: '测试缩写。',
    order: 20,
  },
  {
    id: 'application-programming-interface',
    canonical_zh: '应用程序编程接口',
    english: 'Application Programming Interface',
    acronym: 'API',
    kind: 'acronym',
    first_use: '应用程序编程接口（Application Programming Interface，API）',
    subsequent_use: ['应用程序编程接口', 'API'],
    allowed_aliases: [],
    forbidden_aliases: ['Application Programming Interface'],
    note: '测试中文夹杂缩写。',
    order: 30,
  },
  {
    id: 'tego-arch',
    canonical_zh: 'Tego Arch 架构知识项目',
    english: 'Tego Arch',
    acronym: null,
    kind: 'proper-noun',
    first_use: 'Tego Arch 架构知识项目（Tego Arch）',
    subsequent_use: ['Tego Arch', '本项目'],
    allowed_aliases: ['Tego Arch'],
    forbidden_aliases: [],
    note: '测试登记的产品专名。',
    order: 40,
  },
];

const withFixture = async (files, callback, registryTerms = terms) => {
  const root = await mkdtemp(path.join(tmpdir(), 'terminology-policy-'));
  try {
    await mkdir(path.join(root, 'data'), {recursive: true});
    await writeFile(
      path.join(root, 'data/terminology.json'),
      JSON.stringify({schema_version: 1, terms: registryTerms}),
    );
    await writeFile(
      path.join(root, 'data/source-ledger.json'),
      JSON.stringify({
        schema_version: 1,
        sources: [officialSource],
        documents: {},
      }),
    );
    for (const [file, source] of Object.entries(files)) {
      const target = path.join(root, file);
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, source);
    }
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
};

const checkFixture = (source, file = 'content/example.mdx') => withFixture(
  {[file]: source},
  (root) => checkTerminology({root, paths: [file]}),
);

test('publishes the stable terminology issue rule order', () => {
  assert.deepEqual(terminologyRuleOrder, [
    'registry-error',
    'parse-error',
    'bare-english-term',
    'first-use-required',
    'unknown-english-term',
    'invalid-suppression',
  ]);
});

test('requires bilingual first use and permits registered subsequent use', async () => {
  const result = await checkFixture('质量属性（Quality Attribute）决定取舍。后续质量属性继续使用。');
  assert.deepEqual(result.issues, []);
});

test('reports bare, unknown, and premature acronym uses together in stable rule order', async () => {
  const result = await checkFixture('Quality Attribute 与 ASR 影响 unknown worker。');
  assert.deepEqual(result.issues.map(({ruleId}) => ({ruleId})), [
    {ruleId: 'bare-english-term'},
    {ruleId: 'first-use-required'},
    {ruleId: 'unknown-english-term'},
  ]);
  assert.deepEqual(Object.keys(result.issues[0]), [
    'file', 'line', 'ruleId', 'matched', 'expected',
  ]);
});

test('reports a registered English full name when it is used bare', async () => {
  const result = await checkFixture('Architecturally Significant Requirement 需要说明。');
  assert.deepEqual(result.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'bare-english-term', matched: 'Architecturally Significant Requirement'},
  ]);
});

test('exempts literals, commands, paths, URLs, identifiers, fields, and registered citation titles', async () => {
  const result = await checkFixture([
    '`retry_count` 与 `config.worker.name`',
    '```bash\nnpm run verify -- --config ./worker.json\n```',
    `[Quality Attributes](${officialLocator})`,
    `[Quality Attributes][official]\n\n[official]: ${officialLocator}`,
    '> Direct quotation title',
    '字段 `worker_id` 通过 `/api/v1/workers` 访问。',
  ].join('\n\n'));
  assert.deepEqual(result.issues, []);
});

test('does not exempt arbitrary external link labels', async () => {
  const result = await checkFixture('[Unknown External Title](https://example.com/not-registered)');
  assert.deepEqual(result.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'Unknown External Title'},
  ]);
});

test('does not grant citation exemptions from an invalid source ledger', async () => {
  await withFixture({'content/example.mdx': `[Unknown External Title](${officialLocator})`}, async (root) => {
    await writeFile(path.join(root, 'data/source-ledger.json'), JSON.stringify({
      schema_version: 1,
      sources: [{canonical_locator: officialLocator}],
      documents: {},
    }));
    const result = await checkTerminology({root, paths: ['content/example.mdx']});
    assert.deepEqual(result.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
      {ruleId: 'unknown-english-term', matched: 'Unknown External Title'},
    ]);
  });
});

test('excludes complete AST blockquotes including compact and lazy continuation forms', async () => {
  const result = await checkFixture([
    '>Quoted English Title',
    'lazy continuation phrase',
    '',
    'outside worker',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({line, matched}) => ({line, matched})), [
    {line: 4, matched: 'outside worker'},
  ]);
});

test('tracks first use per file and follows front matter then body reader order', async () => {
  const result = await withFixture({
    'content/a.mdx': '---\ntitle: API 指南\n---\n应用程序编程接口（Application Programming Interface，API）随后 API。',
    'content/b.mdx': '---\ntitle: 应用程序编程接口（Application Programming Interface，API）\n---\nAPI 正文。',
  }, (root) => checkTerminology({root, paths: ['content']}));
  assert.deepEqual(result.checkedFiles, ['content/a.mdx', 'content/b.mdx']);
  assert.deepEqual(result.issues.map(({file, line, ruleId, matched}) => ({file, line, ruleId, matched})), [
    {file: 'content/a.mdx', line: 2, ruleId: 'first-use-required', matched: 'API'},
  ]);
});

test('checks Mermaid labels in source order without treating diagram identifiers as prose', async () => {
  const result = await checkFixture(`应用程序编程接口（Application Programming Interface，API）

\`\`\`mermaid
flowchart LR
  WorkerNode[API 网关] -->|unknown worker| TargetNode[完成]
\`\`\``);
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {line: 5, ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('checks visible TSX strings but excludes imports, paths, props, and ordinary literals', async () => {
  const source = `import workerIcon from './unknown-worker.svg';
const config = {worker_id: 'unknown worker'};
export function Page() {
  return <main aria-label="质量属性（Quality Attribute）">
    <a href="/worker" data-field="worker_id">质量属性与 unknown worker</a>
  </main>;
}`;
  const result = await checkFixture(source, 'src/pages/example.tsx');
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {line: 5, ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('checks SVG and Draw.io visible labels and fails closed on malformed XML', async () => {
  await withFixture({
    'static/example.svg': `<svg xmlns="http://www.w3.org/2000/svg">
<title>hidden title phrase</title>
<defs><text>hidden definition phrase</text></defs>
<g style="display:none"><text>hidden ancestor phrase</text></g>
<text fill="none">hidden unpainted phrase</text>
<text>unknown worker <tspan visibility="hidden">hidden tspan phrase</tspan></text>
<path id="unknown-worker" d="M0 0"/>
</svg>`,
    'diagrams/example.drawio': '<mxfile><diagram name="Page-1"><mxGraphModel><root>\n<mxCell id="1" value="unknown router" vertex="1"/>\n<mxCell id="unknown-worker" value=""/>\n</root></mxGraphModel></diagram></mxfile>',
  }, async (root) => {
    const result = await checkTerminology({
      root,
      paths: ['static/example.svg', 'diagrams/example.drawio'],
    });
    assert.deepEqual(result.issues.map(({file, line, matched}) => ({file, line, matched})), [
      {file: 'diagrams/example.drawio', line: 2, matched: 'unknown router'},
      {file: 'static/example.svg', line: 6, matched: 'unknown worker'},
    ]);
  });

  for (const [file, source, message] of [
    ['static/broken.svg', '<svg><text>unknown worker</svg>', 'mismatched closing tag'],
    ['diagrams/broken.drawio', '<mxfile><diagram></mxfile>', 'mismatched closing tag'],
    [
      'static/entity.svg',
      '<svg xmlns="http://www.w3.org/2000/svg"><text>bad &unknown;</text></svg>',
      'unknown entity',
    ],
  ]) {
    const malformed = await checkFixture(source, file);
    assert.equal(malformed.issues.length, 1);
    assert.equal(malformed.issues[0].ruleId, 'parse-error');
    assert.match(malformed.issues[0].matched, new RegExp(message, 'u'));
  }
});

test('applies a suppression to exactly the next visible record and requires a real hit', async () => {
  const result = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: 官方界面原始标签 -->
unknown worker

second worker`);
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {line: 4, ruleId: 'unknown-english-term', matched: 'second worker'},
  ]);

  const unused = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: 官方界面原始标签 -->
纯中文内容`);
  assert.deepEqual(unused.issues.map(({ruleId}) => ruleId), ['invalid-suppression']);
});

test('ignores suppression-shaped text in fenced code, inline code, TS comments, and strings', async () => {
  const directive = '<!-- terminology-exempt: unknown-english-term | reason: 测试 -->';
  const markdown = await checkFixture([
    `\`\`\`text\n${directive}\n\`\`\``,
    `\`${directive}\``,
    'unknown worker',
  ].join('\n'));
  assert.deepEqual(markdown.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);

  const tsx = await checkFixture([
    `// ${directive}`,
    `const hidden = '${directive}';`,
    'export const Page = () => <div>unknown worker</div>;',
  ].join('\n'), 'src/pages/suppression.tsx');
  assert.deepEqual(tsx.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('requires an exclusive parser-confirmed comment line', async () => {
  const result = await checkFixture([
    '前缀 <!-- terminology-exempt: unknown-english-term | reason: 测试 -->',
    'unknown worker',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 1, ruleId: 'invalid-suppression'},
    {line: 2, ruleId: 'unknown-english-term'},
  ]);
});

test('binds suppression to one stable record instead of another record on the same line', async () => {
  const result = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: 测试 -->
\`\`\`mermaid
flowchart LR
  A[纯中文] -->|unknown worker| B[完成]
\`\`\``);
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {
      line: 1,
      ruleId: 'invalid-suppression',
      matched: '<!-- terminology-exempt: unknown-english-term | reason: 测试 -->',
    },
    {line: 4, ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('reports empty, unknown, and whole-file suppressions as invalid', async () => {
  const result = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: -->
unknown worker
<!-- terminology-exempt: made-up-rule | reason: 测试 -->
other worker
<!-- terminology-exempt-file: unknown-english-term | reason: 不允许 -->`);
  assert.deepEqual(result.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 1, ruleId: 'invalid-suppression'},
    {line: 2, ruleId: 'unknown-english-term'},
    {line: 3, ruleId: 'invalid-suppression'},
    {line: 4, ruleId: 'unknown-english-term'},
    {line: 5, ruleId: 'invalid-suppression'},
  ]);
});

test('uses explicit phrase boundaries and allows introduced acronyms and registered proper nouns', async () => {
  const result = await checkFixture([
    '应用程序编程接口（Application Programming Interface，API）支持中文 API 调用。',
    'Tego Arch 架构知识项目（Tego Arch）提供资料，后续使用 Tego Arch。',
    '`unknown worker` 不进入检查，worker_id 也不是读者术语。',
    '但 unknown-worker 与 workers 都必须独立报告。',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({matched}) => matched), ['unknown-worker', 'workers']);
});

test('uses UTF-16-safe masking and excludes program identifiers without hiding prose', async () => {
  const result = await checkFixture([
    '😀 应用程序编程接口（Application Programming Interface，API）支持中文 API。',
    'retry_count dotted.identifier retryPolicy WorkerNode',
    'Ordinary Title Phrase 与 unknown-workers。',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({line, matched}) => ({line, matched})), [
    {line: 3, matched: 'Ordinary Title Phrase'},
    {line: 3, matched: 'unknown-workers'},
  ]);
});

test('does not join unknown phrases across a registered acronym', async () => {
  const result = await checkFixture([
    '应用程序编程接口（Application Programming Interface，API）。',
    'unknown API worker',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({matched}) => matched), ['unknown', 'worker']);
});

test('returns registry errors before scanning content and CLI reports every issue', async () => {
  await withFixture({'content/example.mdx': 'unknown worker'}, async (root) => {
    await writeFile(path.join(root, 'data/terminology.json'), '{bad json');
    const result = await checkTerminology({root, paths: ['content/example.mdx']});
    assert.equal(result.checkedFiles.length, 0);
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), ['registry-error']);
    assert.deepEqual(Object.keys(result.issues[0]), [
      'file', 'line', 'ruleId', 'matched', 'expected',
    ]);
  });

  await withFixture({'content/example.mdx': 'Quality Attribute 与 unknown worker。'}, async (root) => {
    const run = spawnSync(
      process.execPath,
      [path.join(repositoryRoot, 'scripts/check-terminology.mjs'), '--paths', 'content/example.mdx'],
      {cwd: root, encoding: 'utf8'},
    );
    assert.equal(run.status, 1);
    assert.match(run.stdout, /bare-english-term/u);
    assert.match(run.stdout, /unknown-english-term/u);
    assert.match(run.stdout, /2 issues? in 1 checked file/u);
  });
});

test('collects parse errors with other file issues and keeps CLI diagnostics on stdout', async () => {
  await withFixture({
    'content/bad.mdx': '```text\nunclosed',
    'content/good.mdx': 'unknown worker',
    'static/bad.svg': '<svg><text>broken</svg>',
  }, async (root) => {
    const result = await checkTerminology({root, paths: ['content', 'static/bad.svg']});
    assert.deepEqual(result.issues.map(({file, ruleId}) => ({file, ruleId})), [
      {file: 'content/bad.mdx', ruleId: 'parse-error'},
      {file: 'content/good.mdx', ruleId: 'unknown-english-term'},
      {file: 'static/bad.svg', ruleId: 'parse-error'},
    ]);

    const run = spawnSync(
      process.execPath,
      [path.join(repositoryRoot, 'scripts/check-terminology.mjs'), '--paths', 'content,static/bad.svg'],
      {cwd: root, encoding: 'utf8'},
    );
    assert.equal(run.status, 1);
    assert.equal(run.stderr, '');
    assert.match(run.stdout, /\[parse-error\]/u);
    assert.match(run.stdout, /\[unknown-english-term\]/u);
    assert.match(run.stdout, /3 issues in 3 checked files/u);
  });
});

test('preserves a parser-provided source line on parse-error issues', async () => {
  const result = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg">\n<text>broken</svg>',
    'static/line.svg',
  );
  assert.deepEqual(result.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 2, ruleId: 'parse-error'},
  ]);
});

test('rejects unsafe, symlinked, missing, and unsupported scan paths while deduplicating files', async () => {
  await withFixture({'content/example.mdx': 'unknown worker'}, async (root) => {
    await symlink(path.join(root, 'content/example.mdx'), path.join(root, 'content/link.mdx'));
    const result = await checkTerminology({
      root,
      paths: [
        'content/example.mdx',
        'content/example.mdx',
        'content/link.mdx',
        '../outside.mdx',
        'missing.mdx',
        'data/terminology.json',
      ],
    });
    assert.deepEqual(result.checkedFiles, ['content/example.mdx']);
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), [
      'parse-error',
      'unknown-english-term',
      'parse-error',
      'parse-error',
      'parse-error',
    ]);
  });
});

test('rejects a scan path that traverses a symlinked parent directory', async () => {
  await withFixture({'real/example.mdx': 'unknown worker'}, async (root) => {
    await symlink(path.join(root, 'real'), path.join(root, 'alias'));
    const result = await checkTerminology({root, paths: ['alias/example.mdx']});
    assert.deepEqual(result.checkedFiles, []);
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), ['parse-error']);
    assert.match(result.issues[0].matched, /symbolic links are not allowed/u);
  });
});

test('reports a symlink encountered during recursive directory scanning', async () => {
  await withFixture({'content/example.mdx': 'unknown worker'}, async (root) => {
    await symlink(path.join(root, 'content/example.mdx'), path.join(root, 'content/link.mdx'));
    const result = await checkTerminology({root, paths: ['content']});
    assert.deepEqual(result.checkedFiles, ['content/example.mdx']);
    assert.deepEqual(result.issues.map(({file, ruleId}) => ({file, ruleId})), [
      {file: 'content/example.mdx', ruleId: 'unknown-english-term'},
      {file: 'content/link.mdx', ruleId: 'parse-error'},
    ]);
  });
});

test('CLI succeeds with accurate file and term counts', async () => {
  await withFixture({'content/example.mdx': '纯中文内容。'}, async (root) => {
    const run = spawnSync(
      process.execPath,
      [path.join(repositoryRoot, 'scripts/check-terminology.mjs'), '--paths=content/example.mdx'],
      {cwd: root, encoding: 'utf8'},
    );
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /checked 1 file with 4 registered terms; 0 issues/u);
  });
});

test('the repository registry contains every approved foundational term in unique order', async () => {
  const registry = JSON.parse(await readFile(path.join(repositoryRoot, 'data/terminology.json')));
  const required = [
    'architecture-decision-record',
    'quality-attribute-workshop',
    'architecture-tradeoff-analysis-method',
    'application-programming-interface',
    'hypertext-transfer-protocol',
    'uniform-resource-locator',
    'c4-model',
    'unified-modeling-language',
    'domain-driven-design',
    'command-query-responsibility-segregation',
    'conflict-free-replicated-data-type',
    'model-context-protocol',
    'agent-to-agent-protocol',
    'retry',
    'exponential-backoff',
    'jitter',
    'fail-fast',
    'fail-safe',
    'graceful-degradation',
    'human-in-the-loop',
    'router',
    'supervisor',
    'handoff',
    'fan-out-fan-in',
    'checkpointer',
    'reducer',
    'workflow',
    'agent',
    'software-development-kit',
  ];
  assert.deepEqual(required.filter((id) => !registry.terms.some((term) => term.id === id)), []);
  assert.equal(new Set(registry.terms.map(({order}) => order)).size, registry.terms.length);
});

test('projects every approved foundational term exactly', async () => {
  const registry = JSON.parse(await readFile(path.join(repositoryRoot, 'data/terminology.json')));
  const approved = [
    ['architecture-decision-record', '架构决策记录', 'Architecture Decision Record', 'ADR'],
    ['quality-attribute-workshop', '质量属性工作坊', 'Quality Attribute Workshop', 'QAW'],
    ['architecture-tradeoff-analysis-method', '架构权衡分析方法', 'Architecture Tradeoff Analysis Method', 'ATAM'],
    ['application-programming-interface', '应用程序编程接口', 'Application Programming Interface', 'API'],
    ['hypertext-transfer-protocol', '超文本传输协议', 'Hypertext Transfer Protocol', 'HTTP'],
    ['uniform-resource-locator', '统一资源定位符', 'Uniform Resource Locator', 'URL'],
    ['c4-model', 'C4 架构模型', 'C4 Model', null],
    ['unified-modeling-language', '统一建模语言', 'Unified Modeling Language', 'UML'],
    ['domain-driven-design', '领域驱动设计', 'Domain-Driven Design', 'DDD'],
    ['command-query-responsibility-segregation', '命令查询职责分离', 'Command Query Responsibility Segregation', 'CQRS'],
    ['conflict-free-replicated-data-type', '无冲突复制数据类型', 'Conflict-free Replicated Data Type', 'CRDT'],
    ['model-context-protocol', '模型上下文协议', 'Model Context Protocol', 'MCP'],
    ['agent-to-agent-protocol', '智能体间协议', 'Agent2Agent Protocol', 'A2A'],
    ['retry', '重试', 'Retry', null],
    ['exponential-backoff', '指数退避', 'Exponential Backoff', null],
    ['jitter', '抖动', 'Jitter', null],
    ['fail-fast', '快速失败', 'Fail Fast', null],
    ['fail-safe', '故障安全', 'Fail Safe', null],
    ['graceful-degradation', '优雅降级', 'Graceful Degradation', null],
    ['human-in-the-loop', '人在回路', 'Human-in-the-loop', null],
    ['router', '路由器', 'Router', null],
    ['supervisor', '监督者', 'Supervisor', null],
    ['handoff', '移交', 'Handoff', null],
    ['fan-out-fan-in', '扇出与扇入', 'Fan-out/Fan-in', null],
    ['checkpointer', '检查点器', 'Checkpointer', null],
    ['reducer', '归约器', 'Reducer', null],
    ['workflow', '工作流', 'Workflow', null],
    ['agent', '智能体', 'Agent', null],
    ['software-development-kit', '软件开发工具包', 'Software Development Kit', 'SDK'],
  ].map(([id, canonical_zh, english, acronym]) => ({
    id,
    canonical_zh,
    first_use: acronym === null
      ? `${canonical_zh}（${english}）`
      : `${canonical_zh}（${english}，${acronym}）`,
    acronym,
    subsequent_use: acronym === null ? [canonical_zh] : [canonical_zh, acronym],
    forbidden_english: english,
  }));
  const actual = approved.map(({id}) => {
    const term = registry.terms.find((candidate) => candidate.id === id);
    return {
      id: term.id,
      canonical_zh: term.canonical_zh,
      first_use: term.first_use,
      acronym: term.acronym,
      subsequent_use: term.subsequent_use,
      forbidden_english: term.forbidden_aliases.find((alias) => alias === term.english),
    };
  });
  assert.deepEqual(actual, approved);
});

test('rejects wrong XML roots, undeclared namespaced text, compressed Draw.io, and XML 1.0 NUL', async () => {
  const fixtures = [
    ['static/wrong.svg', '<html><text>unknown worker</text></html>'],
    ['static/prefixed.svg', '<svg xmlns="http://www.w3.org/2000/svg"><svg:text>unknown worker</svg:text></svg>'],
    ['diagrams/compressed.drawio', '<mxfile><diagram name="Page-1">eJyrVkrLz1eyUkpKLFKqBQAQSwQJ</diagram></mxfile>'],
    ['diagrams/nul.drawio', '<mxfile><diagram name="Page-1"><mxGraphModel value="&#0;"/></diagram></mxfile>'],
    ['static/cdata-outside.svg', '<![CDATA[text]]><svg xmlns="http://www.w3.org/2000/svg"/>'],
    ['static/bad-attribute.svg', '<svg xmlns="http://www.w3.org/2000/svg" 1bad="value"/>'],
    ['static/raw-less-than.svg', '<svg xmlns="http://www.w3.org/2000/svg" data-note="a < b"/>'],
  ];
  await withFixture(Object.fromEntries(fixtures), async (root) => {
    const result = await checkTerminology({root, paths: fixtures.map(([file]) => file)});
    assert.deepEqual(result.issues.map(({file, ruleId}) => ({file, ruleId})), fixtures
      .map(([file]) => ({file, ruleId: 'parse-error'}))
      .sort((left, right) => left.file.localeCompare(right.file, 'en')));
    assert.match(
      result.issues.find(({file}) => file === 'diagrams/compressed.drawio').matched,
      /compressed Draw\.io diagrams are unsupported/u,
    );
  });
});

test('supports explicitly bound SVG namespace prefixes', async () => {
  const result = await checkFixture(
    '<svg:svg svg:data="value" xmlns:svg="http://www.w3.org/2000/svg"><svg:text>unknown worker</svg:text></svg:svg>',
    'static/prefixed.svg',
  );
  assert.deepEqual(result.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('parses quoted greater-than and CDATA while validating hidden XML entities', async () => {
  const valid = await checkFixture(
    '<!----><svg xmlns="http://www.w3.org/2000/svg"><text data-note="a > b"><![CDATA[unknown & worker]]></text></svg>',
    'static/cdata.svg',
  );
  assert.deepEqual(valid.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown'},
    {ruleId: 'unknown-english-term', matched: 'worker'},
  ]);

  const hidden = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg"><desc>bad &unknown;</desc></svg>',
    'static/hidden-entity.svg',
  );
  assert.deepEqual(hidden.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(hidden.issues[0].matched, /unknown entity/u);
});

test('accepts parser-confirmed XML suppression and requires named Draw.io pages', async () => {
  const svg = await checkFixture(`<svg xmlns="http://www.w3.org/2000/svg">
<!-- terminology-exempt: unknown-english-term | reason: 官方图示标签 -->
<text>unknown worker</text>
</svg>`, 'static/suppressed.svg');
  assert.deepEqual(svg.issues, []);

  const drawio = await checkFixture(
    '<mxfile><diagram><mxGraphModel><root/></mxGraphModel></diagram></mxfile>',
    'diagrams/unnamed.drawio',
  );
  assert.deepEqual(drawio.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(drawio.issues[0].matched, /named diagram/u);

  const misplaced = await checkFixture(
    '<mxfile><diagram name="Page-1"></diagram><mxGraphModel/> </mxfile>',
    'diagrams/misplaced.drawio',
  );
  assert.deepEqual(misplaced.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(misplaced.issues[0].matched, /mxGraphModel/u);
});

test('decodes Draw.io entities once and rejects embedded HTML cell values', async () => {
  const escaped = await checkFixture(
    '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell value="unknown &amp; worker"/></root></mxGraphModel></diagram></mxfile>',
    'diagrams/escaped.drawio',
  );
  assert.deepEqual(escaped.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown'},
    {ruleId: 'unknown-english-term', matched: 'worker'},
  ]);

  const html = await checkFixture(
    '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell value="&lt;b&gt;unknown worker&lt;/b&gt;"/></root></mxGraphModel></diagram></mxfile>',
    'diagrams/html.drawio',
  );
  assert.deepEqual(html.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(html.issues[0].matched, /HTML in mxCell.value/u);
});

test('uses indexed XML line lookup with near-linear 5k/10k scaling', async () => {
  const source = `${'line\n'.repeat(10_000)}tail`;
  const offsets = buildLineOffsets(source);
  assert.equal(offsets.length, 10_001);
  assert.equal(lineFromOffsets(offsets, source.length), 10_001);

  const measure = async (count) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${'<text>纯中文</text>\n'.repeat(count)}</svg>`;
    const started = performance.now();
    await checkFixture(svg, 'static/scale.svg');
    return performance.now() - started;
  };
  await measure(1_000);
  const small = Math.min(await measure(5_000), await measure(5_000));
  const large = Math.min(await measure(10_000), await measure(10_000));
  assert.ok(large / small < 3.5, `expected near-linear scaling, got ${small}ms -> ${large}ms`);
});
