import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

import {
  findMarkdownHeadings,
  parseFrontMatter,
} from '../scripts/content-metadata.mjs';
import {knowledgeTypeContracts} from '../scripts/content-schema.mjs';

const articlePath = 'content/concepts/agt-c-01-agent-system-boundary.mdx';
const drawioPath = 'diagrams/agt-c-01-agent-system-boundary.drawio';
const svgPath = 'static/img/diagrams/agt-c-01-agent-system-boundary.svg';
const requiredDiagramLabels = [
  'User / Event',
  'Policy & Routing',
  'Agent Harness',
  'Agent Loop',
  'Knowledge / Retrieval',
  'Tools / Sandbox',
  'State',
  'Memory',
  'Checkpoint',
  'Trace / Evaluation / Guardrail',
];
const requiredClaims = [
  'Model 生成候选输出，不拥有任务控制权',
  'Augmented LLM 增加检索、工具或记忆能力，但不必拥有循环',
  'Workflow 的步骤和分支主要由代码预先定义',
  'Agent 让模型在受约束边界内选择下一步动作',
  '自治程度是连续谱，不是四个互斥产品类别',
];

const registry = JSON.parse(
  readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'),
);
const backlog = readFileSync('docs/content-backlog.md', 'utf8');

function markdownTableRows(source, header) {
  const lines = source.split(/\r?\n/u);
  const index = lines.findIndex((line) => line === header);
  assert.notEqual(index, -1, `Missing table header: ${header}`);
  assert.match(lines[index + 1] ?? '', /^\|(?:\s*:?-{3,}:?\s*\|)+$/u);
  const rows = [];
  for (let cursor = index + 2; /^\|.*\|$/u.test(lines[cursor] ?? ''); cursor += 1) {
    rows.push(lines[cursor]);
  }
  return rows;
}

test('agentic topic registry is exact and globally unique', () => {
  assert.equal(registry.schema_version, 1);
  assert.equal(registry.concepts.length, 6);
  assert.equal(registry.patterns.length, 8);
  assert.equal(registry.cases.length, 3);
  const ids = [...registry.concepts, ...registry.patterns].map(({id}) => id);
  assert.equal(new Set(ids).size, 14);
  assert.deepEqual(ids, [
    'AGT-C-01', 'AGT-C-02', 'AGT-C-03', 'AGT-C-04', 'AGT-C-05',
    'AGT-C-06', 'AGT-P-01', 'AGT-P-02', 'AGT-P-03', 'AGT-P-04',
    'AGT-P-05', 'AGT-P-06', 'AGT-P-07', 'AGT-P-08',
  ]);
  for (const item of [...registry.concepts, ...registry.patterns]) {
    assert.match(backlog, new RegExp(`- \\[[ x]\\] \\*\\*${item.id} P[0-3]`));
  }
  for (const item of registry.cases) {
    assert.match(
      backlog,
      new RegExp(`- \\[[ x]\\] \\*\\*${item.backlog_id} P[0-3]`),
    );
  }
});

test('AGT-C-01 publishes the canonical agent-system boundary and diagram pair', () => {
  assert.ok(existsSync(articlePath), `Missing ${articlePath}`);
  assert.ok(existsSync(drawioPath), `Missing ${drawioPath}`);
  assert.ok(existsSync(svgPath), `Missing ${svgPath}`);

  const source = readFileSync(articlePath, 'utf8');
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-01');
  assert.equal(metadata.slug, '/concepts/agt-c-01');
  assert.equal(metadata.content_type, 'concept');
  assert.deepEqual(metadata.depends_on, []);
  assert.deepEqual(metadata.adjacent_topics, ['AGT-C-02', 'AGT-C-03', 'AGT-P-01']);
  assert.deepEqual(metadata.related_cases, [
    '/cases/openai-agents-sdk',
    '/cases/kubernetes-reconciliation-loop',
  ]);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);
  for (const claim of requiredClaims) assert.match(source, new RegExp(claim, 'u'));

  assert.match(
    source,
    /<div\b(?=[^>]*className="architecture-diagram-scroll")(?=[^>]*role="region")(?=[^>]*tabIndex=\{0\})[^>]*>/u,
  );
  assert.match(source, /\/img\/diagrams\/agt-c-01-agent-system-boundary\.svg/u);
});

test('AGT-C-01 protects the complete boundary, ownership, and runtime contracts', () => {
  const source = readFileSync(articlePath, 'utf8');
  const boundaryRows = markdownTableRows(
    source,
    '| 边界 | 候选能力 | 下一步由谁决定 | 不自动证明 |',
  );
  assert.deepEqual(boundaryRows.map((row) => row.split('|')[1].trim()), [
    'Model', 'Augmented LLM', 'Workflow', 'Agent',
  ]);

  const ownershipRows = markdownTableRows(
    source,
    '| 架构平面 | 主要所有者 | 必须显式化的合同 |',
  );
  assert.deepEqual(ownershipRows.map((row) => row.split('|')[1].trim()), [
    '交互', '控制', '知识与上下文', '状态与记忆', '动作与工具', '治理与评测',
  ]);

  for (const terminal of ['成功', '明确失败', '预算耗尽', '人工中止']) {
    assert.match(source, new RegExp(terminal, 'u'), `terminal outcome: ${terminal}`);
  }
  assert.match(source, /Harness 包住并约束 Loop/u);
  assert.match(source, /Agentic RAG 不是与 Harness 和 Loop 并列的底层构件/u);
  assert.match(source, /停止 Loop[^\n]*预定步骤[^\n]*显式分支[^\n]*人工批准的 Workflow/u);
  assert.match(source, /模型输出不能在未经外部验证时成为权威业务状态/u);
});

test('AGT-C-01 keeps the full shared label set visible and connectors above the Harness fill', () => {
  const drawio = readFileSync(drawioPath, 'utf8');
  const svg = readFileSync(svgPath, 'utf8');
  for (const label of requiredDiagramLabels) {
    const escaped = label.replaceAll('&', '&amp;');
    assert.match(drawio, new RegExp(`\\bvalue="${escaped.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"`, 'u'));
    assert.match(svg, new RegExp(`>${escaped.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}<`, 'u'));
  }

  const harnessFill = svg.indexOf('<rect data-node-id="harness"');
  const capabilityFill = svg.indexOf('<rect data-node-id="knowledge"');
  assert.ok(harnessFill >= 0, 'Harness fill has stable node identity');
  assert.ok(capabilityFill >= 0, 'capability fill has stable node identity');
  for (const edgeId of ['edge-loop-knowledge', 'edge-loop-tools', 'edge-loop-human']) {
    const connector = svg.indexOf(`<path data-edge-id="${edgeId}"`);
    assert.ok(connector > harnessFill, `${edgeId} paints after opaque Harness fill`);
    assert.ok(connector < capabilityFill, `${edgeId} paints before capability nodes`);
  }
});

test('AGT-C-01 source health observes the cited Anthropic article, not a companion work', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const id = 'src-anthropic-building-effective-agents';
  const expected = 'https://www.anthropic.com/engineering/building-effective-agents';
  const source = ledger.sources.find((item) => item.id === id);
  assert.ok(source, id);
  assert.equal(source.canonical_locator, expected);
  assert.equal(source.transport_locator, expected);
  assert.equal(source.expected_final_transport_locator, expected);
  const result = health.results.find((item) => item.source_ids.includes(id));
  assert.ok(result, `${id} health observation`);
  assert.equal(result.transport_locator, expected);
  assert.equal(result.last_attempt.final_transport_locator, expected);
});
