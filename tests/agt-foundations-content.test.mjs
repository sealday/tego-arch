import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

import {
  findMarkdownHeadings,
  parseFrontMatter,
} from '../scripts/content-metadata.mjs';
import {knowledgeTypeContracts} from '../scripts/content-schema.mjs';

const articlePath = 'content/concepts/agt-c-01-agent-system-boundary.mdx';
const harnessArticlePath = 'content/concepts/agt-c-02-agent-harness.mdx';
const loopArticlePath = 'content/concepts/agt-c-03-agent-loop.mdx';
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
  '模型生成候选输出，不拥有任务控制权',
  '增强型大语言模型增加检索、工具或记忆能力，但不必拥有循环',
  '工作流的步骤和分支主要由代码预先定义',
  '智能体让模型在受约束边界内选择下一步动作',
  '自治程度是连续谱，不是四个互斥产品类别',
];
const requiredTerminologyContracts = [
  {
    id: 'agent-harness', canonical_zh: '智能体运行框架', english: 'Agent Harness', acronym: null,
    kind: 'translated-term', first_use: '智能体运行框架（Agent Harness）', subsequent_use: ['智能体运行框架'],
    allowed_aliases: [], forbidden_aliases: ['Agent Harness', 'Harness'],
    note: '包住并约束智能体循环的运行时与治理责任边界。', order: 1810,
  },
  {
    id: 'agent-loop', canonical_zh: '智能体循环', english: 'Agent Loop', acronym: null,
    kind: 'translated-term', first_use: '智能体循环（Agent Loop）', subsequent_use: ['智能体循环'],
    allowed_aliases: [], forbidden_aliases: ['Agent Loop', 'Loop'],
    note: '智能体在受约束边界内反复计划、行动、观察、评估并终止任务的推进机制。', order: 1820,
  },
  {
    id: 'checkpoint', canonical_zh: '执行检查点', english: 'Checkpoint', acronym: null,
    kind: 'translated-term', first_use: '执行检查点（Checkpoint）', subsequent_use: ['执行检查点'],
    allowed_aliases: [], forbidden_aliases: ['Checkpoint'],
    note: '记录已确认的可恢复执行位置，不等同于副作用已生效的证明。', order: 1830,
  },
  {
    id: 'sandbox', canonical_zh: '隔离沙箱', english: 'Sandbox', acronym: null,
    kind: 'translated-term', first_use: '隔离沙箱（Sandbox）', subsequent_use: ['隔离沙箱'],
    allowed_aliases: [], forbidden_aliases: ['Sandbox'],
    note: '在受限网络、文件、凭据与资源边界内执行工具的隔离环境。', order: 1840,
  },
  {
    id: 'augmented-large-language-model', canonical_zh: '增强型大语言模型', english: 'Augmented LLM', acronym: null,
    kind: 'translated-term', first_use: '增强型大语言模型（Augmented LLM）', subsequent_use: ['增强型大语言模型'],
    allowed_aliases: [], forbidden_aliases: ['Augmented LLM'],
    note: '在模型调用上增加检索、工具或记忆能力，但不必拥有多步循环。', order: 1850,
  },
  {
    id: 'agentic-rag', canonical_zh: '智能体检索增强生成', english: 'Agentic RAG', acronym: null,
    kind: 'translated-term', first_use: '智能体检索增强生成（Agentic RAG）', subsequent_use: ['智能体检索增强生成'],
    allowed_aliases: [], forbidden_aliases: ['Agentic RAG'],
    note: '智能体循环围绕证据充分性反复检索、阅读、评估并作答或拒答的具象。', order: 1860,
  },
];
const harnessResponsibilities = [
  '运行时',
  '上下文装配',
  '工具注册与协议',
  '权限与沙箱',
  '检查点与恢复',
  '追踪与评测钩子',
];
const harnessSourceContracts = [
  {
    id: 'src-anthropic-effective-harnesses-long-running-agents',
    title: 'Effective harnesses for long-running agents',
    locator: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents',
  },
  {
    id: 'src-anthropic-harness-design-long-running-apps',
    title: 'Harness design for long-running application development',
    locator: 'https://www.anthropic.com/engineering/harness-design-long-running-apps',
  },
  {
    id: 'src-anthropic-managed-agents',
    title: 'Scaling Managed Agents: Decoupling the brain from the hands',
    locator: 'https://www.anthropic.com/engineering/managed-agents',
  },
];
const loopPhases = [
  ['PLAN', 'Plan', '计划'],
  ['ACT', 'Act', '行动'],
  ['OBSERVE', 'Observe', '观察'],
  ['EVALUATE', 'Evaluate', '评估'],
  ['TERMINATE', 'Terminate', '终止'],
];
const loopTerminalOutcomes = [
  ['SUCCESS', 'success', '成功'],
  ['FAILURE', 'failure', '失败'],
  ['BUDGET_EXHAUSTED', 'budget exhausted', '预算耗尽'],
  ['HUMAN_STOP', 'human stop', '人工停止'],
];
const loopEdges = [
  'PLAN->ACT',
  'ACT->OBSERVE',
  'OBSERVE->EVALUATE',
  'EVALUATE->PLAN',
  'EVALUATE->TERMINATE',
  'TERMINATE->SUCCESS',
  'TERMINATE->FAILURE',
  'TERMINATE->BUDGET_EXHAUSTED',
  'TERMINATE->HUMAN_STOP',
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

test('registers exact reusable terminology contracts for the agent foundations', () => {
  const terminology = JSON.parse(readFileSync('data/terminology.json', 'utf8'));
  for (const expected of requiredTerminologyContracts) {
    assert.deepEqual(
      terminology.terms.find(({id}) => id === expected.id),
      expected,
      `${expected.id} exact terminology contract`,
    );
  }
});

test('AGT-C-01 protects the complete boundary, ownership, and runtime contracts', () => {
  const source = readFileSync(articlePath, 'utf8');
  const boundaryRows = markdownTableRows(
    source,
    '| 边界 | 候选能力 | 下一步由谁决定 | 不自动证明 |',
  );
  assert.deepEqual(boundaryRows.map((row) => row.split('|')[1].trim()), [
    '模型', '增强型大语言模型', '工作流', '智能体',
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
  assert.match(source, /智能体运行框架包住并约束智能体循环/u);
  assert.match(source, /智能体检索增强生成（Agentic RAG）不是与智能体运行框架和智能体循环并列的底层构件/u);
  assert.match(source, /停止智能体循环[^\n]*预定步骤[^\n]*显式分支[^\n]*人工批准的工作流/u);
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

test('AGT-C-01 preserves measured padding geometry and connector endpoint identities', () => {
  const drawio = readFileSync(drawioPath, 'utf8');
  const svg = readFileSync(svgPath, 'utf8');

  const widenedNodes = [
    ['budget', '580', '45', '318', '120'],
    ['approval', '924', '45', '256', '120'],
    ['knowledge', '110', '550', '318', '110'],
    ['human-agents', '760', '550', '330', '110'],
    ['checkpoint', '440', '780', '190', '74'],
  ];
  for (const [nodeId, x, y, width, height] of widenedNodes) {
    assert.match(
      drawio,
      new RegExp(`id="${nodeId}"[\\s\\S]*?<mxGeometry x="${x}" y="${y}" width="${width}" height="${height}"`, 'u'),
    );
    assert.match(
      svg,
      new RegExp(`data-node-id="${nodeId}" x="${x}" y="${y}" width="${width}" height="${height}"`, 'u'),
    );
  }

  for (const nodeId of ['state', 'memory', 'trace']) {
    assert.match(
      drawio,
      new RegExp(`id="${nodeId}"[\\s\\S]*?<mxGeometry[^>]*y="780"[^>]*height="74"`, 'u'),
    );
    assert.match(
      svg,
      new RegExp(`data-node-id="${nodeId}"[^>]*y="780"[^>]*height="74"`, 'u'),
    );
  }
  assert.match(svg, /data-node-id="foundation"[\s\S]*?<text x="110" y="760"/u);
  assert.match(svg, /data-node-id="state"[\s\S]*?<text x="165" y="825\.5"/u);

  const endpoints = [
    ['edge-loop-knowledge', 'loop', 'knowledge'],
    ['edge-loop-tools', 'loop', 'tools'],
    ['edge-loop-human', 'loop', 'human-agents'],
  ];
  for (const [edgeId, sourceId, targetId] of endpoints) {
    assert.match(
      drawio,
      new RegExp(`id="${edgeId}"[^>]*source="${sourceId}" target="${targetId}"`, 'u'),
    );
    assert.match(
      svg,
      new RegExp(`data-edge-id="${edgeId}" data-source="${sourceId}" data-target="${targetId}"`, 'u'),
    );
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

function assertAgentHarnessContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-02');
  assert.equal(metadata.slug, '/concepts/agt-c-02');
  assert.equal(metadata.content_type, 'concept');
  assert.deepEqual(metadata.depends_on, ['AGT-C-01']);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);
  assert.match(source, /智能体运行框架约束并运行智能体循环；它本身不决定任务/u);

  const responsibilityRows = markdownTableRows(
    source,
    '| 智能体运行框架责任 | 输入 / 资产 | 强制合同 | 失败时行为 |',
  );
  assert.equal(responsibilityRows.length, 6);
  assert.deepEqual(
    responsibilityRows.map((row) => row.split('|')[1].trim()),
    harnessResponsibilities,
  );

  const mermaid = source.match(/```mermaid\n([\s\S]*?)```/u)?.[1];
  assert.ok(mermaid, 'Mermaid layered flow');
  assert.match(mermaid, /subgraph HARNESS\["智能体运行框架"\]/u);
  assert.match(mermaid, /subgraph LOOP\["智能体循环"\]/u);
  for (const responsibility of harnessResponsibilities) {
    assert.match(mermaid, new RegExp(responsibility, 'u'));
  }
  assert.match(mermaid, /运行时[\s\S]*上下文装配[\s\S]*智能体循环/u);
  assert.match(mermaid, /智能体循环[\s\S]*工具注册与协议[\s\S]*权限与沙箱/u);
  assert.match(mermaid, /CR\["检查点与恢复"\][\s\S]*CR --> EXIT\["恢复或升级人工"\]/u);
  assert.doesNotMatch(mermaid, /CR .*\.-> RT/u);
  assert.match(source, /末端分支表示核对后恢复或升级人工/u);
  assert.doesNotMatch(source, /图中的回边/u);

  assert.match(source, /### 薄 SDK 反例/u);
  assert.match(source, /只转发模型请求[\s\S]*不是智能体运行框架/u);
  assert.match(source, /上下文预算[\s\S]*工具预算[\s\S]*智能体运行框架/u);
  assert.match(source, /工具调用真正执行之前[\s\S]*权限与沙箱/u);
  assert.match(source, /副作用账本[\s\S]*恢复时[\s\S]*不盲目重试/u);

  const evidenceRows = markdownTableRows(
    source,
    '| 智能体运行框架能证明 | 智能体运行框架不能证明 |',
  );
  assert.equal(evidenceRows.length, 4);
  for (const boundary of [
    '请求经过已声明的运行与权限边界',
    '上下文和工具消耗受预算约束',
    '可从已确认检查点恢复',
    '执行链留下可评测追踪',
    '模型选择的动作正确',
    '工具结果天然可信',
    '恢复一定不会重复副作用',
    '一次评测代表生产质量',
  ]) {
    assert.match(evidenceRows.join('\n'), new RegExp(boundary, 'u'));
  }
}

test('AGT-C-02 publishes the Agent Harness responsibility contract and layered Mermaid', () => {
  assert.ok(existsSync(harnessArticlePath), `Missing ${harnessArticlePath}`);
  assertAgentHarnessContract(readFileSync(harnessArticlePath, 'utf8'));
});

test('AGT-C-02 contract rejects responsibility, SDK, recovery, and evidence-boundary mutations', () => {
  const source = readFileSync(harnessArticlePath, 'utf8');
  const mutations = [
    ...harnessResponsibilities.map((label) => source.replaceAll(label, `${label}（缺失）`)),
    source.replace('### 薄 SDK 反例', '### SDK 包装'),
    source.replaceAll('副作用账本', '运行日志'),
    source.replace('模型选择的动作正确', '模型输出可用'),
  ];
  for (const mutant of mutations) {
    assert.throws(() => assertAgentHarnessContract(mutant));
  }
});

test('AGT-C-02 governs exact Anthropic engineering sources and matching health transports', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const document = ledger.documents[harnessArticlePath];
  assert.ok(document, `${harnessArticlePath} source document`);
  assert.deepEqual(
    document.citations.map(({source_id}) => source_id),
    harnessSourceContracts.map(({id}) => id),
  );
  assert.ok(document.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));

  for (const contract of harnessSourceContracts) {
    const source = ledger.sources.find(({id}) => id === contract.id);
    assert.ok(source, contract.id);
    assert.equal(source.title, contract.title);
    assert.equal(source.author_or_org, 'Anthropic');
    assert.equal(source.tier, 'first-party');
    assert.equal(source.license, 'LicenseRef-All-Rights-Reserved');
    assert.equal(source.copyright_policy, 'facts-and-short-quotation');
    assert.equal(source.canonical_locator, contract.locator);
    assert.equal(source.transport_locator, contract.locator);
    assert.equal(source.expected_final_transport_locator, contract.locator);

    const result = health.results.find(({source_ids}) => source_ids.includes(contract.id));
    assert.ok(result, `${contract.id} health observation`);
    assert.deepEqual(result.source_ids, [contract.id]);
    assert.equal(result.transport_locator, contract.locator);
    assert.equal(result.last_attempt.outcome, 'healthy');
    assert.equal(result.last_attempt.http_status, 200);
    assert.equal(result.last_attempt.final_transport_locator, contract.locator);
  }
});

function assertAgentLoopContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-03');
  assert.equal(metadata.slug, '/concepts/agt-c-03');
  assert.equal(metadata.content_type, 'concept');
  assert.deepEqual(metadata.depends_on, ['AGT-C-01', 'AGT-C-02']);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);

  const mermaid = source.match(/```mermaid\n([\s\S]*?)```/u)?.[1];
  assert.ok(mermaid, 'Mermaid Agent Loop');
  for (const [, phase, chinese] of loopPhases) {
    assert.match(
      mermaid,
      new RegExp(`\\["${chinese}"\\]`, 'u'),
      `loop phase: ${phase}`,
    );
    assert.ok(source.includes(`\`${phase}\``), `canonical phase vocabulary: ${phase}`);
  }
  for (const [, outcome, chinese] of loopTerminalOutcomes) {
    assert.match(mermaid, new RegExp(`\\["${chinese}"\\]`, 'u'), `terminal: ${outcome}`);
    assert.ok(source.includes(`\`${outcome}\``), `documented terminal: ${outcome}`);
  }

  const actualEdges = [...mermaid.matchAll(
    /^\s*([A-Z][A-Z_]*)\s*(?:\[[^\n]*?\])?\s*-->(?:\|[^|]+\|)?\s*([A-Z][A-Z_]*)(?:\[[^\n]*?\])?\s*$/gmu,
  )].map(([, from, to]) => `${from}->${to}`);
  assert.deepEqual(actualEdges.sort(), [...loopEdges].sort());

  assert.match(source, /观察是结构化环境反馈/u);
  assert.match(source, /模型选择[“"]下一步做什么[”"]/u);
  assert.match(source, /代码强制执行[“"]还能不能继续[”"]/u);
  assert.match(source, /拒绝[“"]直到足够好[”"]的无限循环/u);
  assert.match(source, /ReAct[^\n]*提示与交互模式[^\n]*不是生产运行时保证/u);
}

test('AGT-C-03 publishes the canonical five-phase Agent Loop and terminal contract', () => {
  assert.ok(existsSync(loopArticlePath), `Missing ${loopArticlePath}`);
  assertAgentLoopContract(readFileSync(loopArticlePath, 'utf8'));
});

test('AGT-C-03 rejects phase, terminal, and evaluation-bypass topology mutations', () => {
  const source = readFileSync(loopArticlePath, 'utf8');
  const mutations = [
    source.replace('PLAN["计划"]', 'PLAN["思考"]'),
    source.replace('TERMINATE --> SUCCESS["成功"]', 'TERMINATE --> SUCCESS["完成"]'),
    source.replace('OBSERVE --> EVALUATE', 'OBSERVE --> PLAN'),
    source.replace('EVALUATE -->|继续| PLAN', 'ACT -->|继续| PLAN'),
    source.replace('EVALUATE -->|停止| TERMINATE', 'OBSERVE -->|停止| TERMINATE'),
    source.replace('ACT --> OBSERVE', 'ACT --> OBSERVE\n    ACT --> TERMINATE'),
  ];
  for (const mutant of mutations) {
    assert.notEqual(mutant, source, 'mutation fixture must alter the article');
    assert.throws(() => assertAgentLoopContract(mutant));
  }
});

test('AGT-C-03 governs ReAct and reuses the exact Anthropic workflow/agent source', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const document = ledger.documents[loopArticlePath];
  assert.ok(document, `${loopArticlePath} source document`);
  assert.deepEqual(document.citations.map(({source_id}) => source_id), [
    'src-react-reasoning-acting-language-models',
    'src-anthropic-building-effective-agents',
  ]);
  assert.ok(document.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));

  const react = ledger.sources.find(
    ({id}) => id === 'src-react-reasoning-acting-language-models',
  );
  assert.ok(react, 'src-react-reasoning-acting-language-models');
  assert.equal(react.canonical_locator, 'https://arxiv.org/abs/2210.03629');
  assert.equal(react.title, 'ReAct: Synergizing Reasoning and Acting in Language Models');
  assert.equal(react.author_or_org, 'Shunyu Yao et al.');
  assert.equal(react.source_kind, 'paper');
  assert.equal(react.tier, 'primary');
  assert.equal(react.license, 'CC-BY-4.0');
  assert.equal(react.copyright_policy, 'adapt-with-attribution');
  assert.match(react.usage_boundary, /prompting and interaction pattern/u);
  assert.match(react.usage_boundary, /production runtime guarantees/u);
  const reactHealth = health.results.find(
    ({source_ids: sourceIds}) => sourceIds.includes(react.id),
  );
  assert.ok(reactHealth, `${react.id} health observation`);
  assert.equal(reactHealth.transport_locator, react.transport_locator);
  assert.deepEqual(reactHealth.source_ids, [react.id]);
  assert.equal(reactHealth.last_attempt.outcome, 'healthy');
  assert.equal(
    reactHealth.last_attempt.final_transport_locator,
    react.expected_final_transport_locator,
  );

  const anthropic = ledger.sources.filter(
    ({id}) => id === 'src-anthropic-building-effective-agents',
  );
  assert.equal(anthropic.length, 1);
  assert.deepEqual(anthropic[0], {
    id: 'src-anthropic-building-effective-agents',
    canonical_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    transport_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'Building Effective Agents',
    author_or_org: 'Anthropic',
    published_at: '2024-12-19',
    registered_at: '2026-08-26',
    checked_at: '2026-08-26',
    version: 'Official engineering article published 2024-12-19 and checked directly in a browser on 2026-08-26',
    source_kind: 'official-docs',
    tier: 'first-party',
    allowed_evidence_roles: ['definition', 'method'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: 'The named Anthropic engineering article and bibliographic facts only; prose, examples, diagrams, linked works, trademarks and third-party material excluded',
    license_evidence_url: 'https://www.anthropic.com/engineering/building-effective-agents',
    license_evidence_note: 'The official page exposes no reusable page license; Tego Arch uses attributed factual summary without copying prose, examples, structure or diagrams.',
    license_family_id: 'https://www.anthropic.com/engineering/building-effective-agents',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: "Supports Anthropic's stated workflow/agent distinction and augmented-LLM building block; it does not establish the article's Harness/Loop ownership model or prove production outcomes.",
    link_policy: 'floating',
    expected_final_transport_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    expected_final_approved_at: '2026-08-26',
    expected_final_approval_note: 'The exact canonical article returned HTTP 200 and exposed the expected title and workflow/agent distinction in a real browser on 2026-08-26; no non-equivalent companion page is used as health evidence.',
  });
});
