import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

import {checkTerminology} from '../scripts/check-terminology.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

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

test('exempts literals, commands, paths, URLs, identifiers, fields, and citation titles', async () => {
  const result = await checkFixture([
    '`retry_count` 与 `config.worker.name`',
    '```bash\nnpm run verify -- --config ./worker.json\n```',
    '[Quality Attributes](https://www.sei.cmu.edu/library/quality-attributes/)',
    '> Direct quotation title',
    '字段 `worker_id` 通过 `/api/v1/workers` 访问。',
  ].join('\n\n'));
  assert.deepEqual(result.issues, []);
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
    'diagrams/example.drawio': '<mxfile><diagram><mxGraphModel><root>\n<mxCell id="1" value="unknown router" vertex="1"/>\n<mxCell id="unknown-worker" value=""/>\n</root></mxGraphModel></diagram></mxfile>',
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

  await assert.rejects(
    () => checkFixture('<svg><text>unknown worker</svg>', 'static/broken.svg'),
    /static\/broken\.svg:1: XML parser failed/u,
  );
  await assert.rejects(
    () => checkFixture('<mxfile><diagram></mxfile>', 'diagrams/broken.drawio'),
    /diagrams\/broken\.drawio:1: XML parser failed/u,
  );
  await assert.rejects(
    () => checkFixture('<svg><text>bad &unknown;</text></svg>', 'static/entity.svg'),
    /static\/entity\.svg:1: XML parser failed: unknown entity/u,
  );
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
