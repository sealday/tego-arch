import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const documentsById = new Map(
  documents.map((content) => [content.metadata.topic_id, content]),
);
const document = documents.find(
  ({file}) => file === 'modeling/mod-08-state-machine-modeling.mdx',
);
const ledger = JSON.parse(
  await readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8'),
);

const expectedHeadings = [
  '学习问题',
  '建模目标与输入',
  '两类状态与权威记录',
  '模型产物',
  '转换合同',
  '超时、取消与补偿',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];

const expectedBusinessStates = [
  {id: 'accepted', label: '已接受'},
  {id: 'cancelled_before_effect', label: '效果前已取消'},
  {id: 'compensated', label: '已补偿'},
  {id: 'manually_resolved', label: '已人工决议'},
  {id: 'rejected', label: '已拒绝'},
  {id: 'requested', label: '已请求'},
  {id: 'settled', label: '已结算'},
  {id: 'settlement_pending', label: '待结算'},
];

const expectedBusinessEdges = [
  {from: 'accepted', to: 'cancelled_before_effect', label: '权威确认效果未发生'},
  {from: 'accepted', to: 'settlement_pending', label: '提交外部效果'},
  {from: 'requested', to: 'accepted', label: '业务前置条件通过'},
  {from: 'requested', to: 'rejected', label: '业务规则拒绝'},
  {from: 'settlement_pending', to: 'compensated', label: '权威确认补偿完成'},
  {from: 'settlement_pending', to: 'manually_resolved', label: '持久人工决议'},
  {from: 'settlement_pending', to: 'settled', label: '权威确认目标结果'},
];

const expectedExecutionStates = [
  {id: 'attempting', label: '尝试执行'},
  {id: 'awaiting_receipt', label: '等待回执'},
  {id: 'compensated', label: '已补偿'},
  {id: 'compensation_pending', label: '待补偿'},
  {id: 'confirmed_success', label: '已确认成功'},
  {id: 'manual_closed', label: '人工已关闭'},
  {id: 'manual_review', label: '人工复核中'},
  {id: 'ready', label: '就绪'},
  {id: 'reconciling', label: '对账中'},
  {id: 'stopped_before_effect', label: '效果前已停止'},
  {id: 'unknown', label: '结果未知'},
];

const expectedExecutionEdges = [
  {from: 'attempting', to: 'awaiting_receipt', label: '外部请求已提交'},
  {from: 'awaiting_receipt', to: 'confirmed_success', label: '取得权威 effect_ref'},
  {from: 'awaiting_receipt', to: 'unknown', label: '超时、连接中断或回执缺失'},
  {from: 'compensation_pending', to: 'compensated', label: '权威确认补偿效果'},
  {from: 'compensation_pending', to: 'manual_review', label: '补偿失败或不可逆'},
  {from: 'manual_review', to: 'manual_closed', label: '保存耐久人工决议'},
  {from: 'ready', to: 'attempting', label: '以稳定 operation_id 开始'},
  {from: 'ready', to: 'stopped_before_effect', label: '权威确认效果未发生'},
  {from: 'reconciling', to: 'compensation_pending', label: '确认部分效果且需补偿'},
  {from: 'reconciling', to: 'confirmed_success', label: '确认原效果已发生'},
  {from: 'reconciling', to: 'manual_review', label: '证据冲突或预算耗尽'},
  {from: 'reconciling', to: 'ready', label: '权威确认未发生且可安全重试'},
  {from: 'unknown', to: 'reconciling', label: '启动只读查询或对账'},
];

const expectedMappingRows = [
  {
    '触发': '接受请求',
    '业务状态变化': '`requested` → `accepted`',
    '执行状态变化': '创建 `ready`',
    '所需权威证据': '已通过业务前置条件的持久接受记录',
    '禁止推断': '接受记录不证明外部效果已发生',
  },
  {
    '触发': '提交外部效果',
    '业务状态变化': '`accepted` → `settlement_pending`',
    '执行状态变化': '`ready` → `attempting` → `awaiting_receipt`',
    '所需权威证据': '稳定 `operation_id`、提交记录与外部回执查询键',
    '禁止推断': '本地提交成功不证明转账已结算',
  },
  {
    '触发': '执行超时',
    '业务状态变化': '保持 `settlement_pending`',
    '执行状态变化': '`awaiting_receipt` → `unknown`',
    '所需权威证据': '超时记录、原 `operation_id` 与证据截止时间',
    '禁止推断': '超时不证明业务失败或外部效果未发生',
  },
  {
    '触发': '效果前取消',
    '业务状态变化': '`accepted` → `cancelled_before_effect`',
    '执行状态变化': '`ready` → `stopped_before_effect`',
    '所需权威证据': '权威 not-found 证据与流程停止记录',
    '禁止推断': '只有取消意图不证明效果从未发生',
  },
  {
    '触发': '未知结果后取消',
    '业务状态变化': '保持 `settlement_pending`',
    '执行状态变化': '`unknown` → `reconciling`',
    '所需权威证据': '取消请求、外部只读查询与 `effect_ref` 核对结果',
    '禁止推断': '取消请求不等于已经取消',
  },
  {
    '触发': '确认部分效果后补偿',
    '业务状态变化': '`settlement_pending` → `compensated`',
    '执行状态变化': '`reconciling` → `compensation_pending` → `compensated`',
    '所需权威证据': '正向 `effect_ref`、补偿 `operation_id` 与补偿回执',
    '禁止推断': '补偿是新效果，不是把历史回滚成从未发生',
  },
  {
    '触发': '证据无法收敛后人工决议',
    '业务状态变化': '`settlement_pending` → `manually_resolved`',
    '执行状态变化': '`manual_review` → `manual_closed`',
    '所需权威证据': '`disposition`：`confirmed-settled` 表示权威证据确认预期结算结果；`confirmed-compensated` 表示权威证据同时确认正向效果与对应补偿；`accepted-residual-risk` 表示有权限的 owner 明确接受尚未解决的残余风险；并持久保存 `decision_ref`、决策人、时间与残余风险',
    '禁止推断': '`manual_closed` 不能在缺少业务决议时被当作业务终态',
  },
];

const invariantSentences = [
  '调用超时只说明观察者没有按时得到结果，不能单独证明业务失败或外部效果未发生。',
  '取消是事件和意图，不等于已经取消；执行已提交或结果未知时必须先对账。',
  '只有权威 not-found 且原稳定 operation_id 仍然有效时，才允许重试外部写入。',
  '补偿创建新的业务事实，不是把历史回滚成从未发生。',
  '补偿必须拥有自己的 operation_id、预算和对账路径，并且也可能超时、重复或失败。',
  '人工终态必须保存可审计的 disposition、decision_ref、决策人、时间和残余风险，不能用 generic closed 隐藏未知结果。',
  '两台状态机只通过持久记录关联，任何一台都不能从另一台的内存状态推导外部事实。',
];

const manualDispositionMeanings = [
  '`confirmed-settled` 表示权威证据确认预期结算结果',
  '`confirmed-compensated` 表示权威证据同时确认正向效果与对应补偿',
  '`accepted-residual-risk` 表示有权限的 owner 明确接受尚未解决的残余风险',
];

const expectedSourceUsageBoundaries = [
  '仅支持 UML 2.5.1 的图名称与标准语义范围；不支持领域示例、本地建模工作流、生产事实，也不能据此声称图证明了实现行为。本文还不以该标准定义转账状态政策或补偿政策。',
  '仅支持已记录页面与版本中的 Temporal Workflow 文档语义；不证明未记录行为或其他版本的行为。',
  '仅支持已记录页面与版本中的 Temporal Activity 文档语义；不证明未记录行为或其他版本的行为。',
  '仅支持已记录页面与版本中的 Temporal Retry Policies 文档语义；不证明未记录行为或其他版本的行为。',
  '提供 Sagas 的原始方法与历史模型；没有独立证据时，不确立其对现代实现的适用性。',
];

const expectedWrappers = [
  `<div
  className="diagram-wrapper"
  role="region"
  aria-label="业务意图状态机，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>`,
  `<div
  className="diagram-wrapper"
  role="region"
  aria-label="执行与恢复状态机，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>`,
  `<div
  className="table-wrapper table-wrapper--mapping"
  role="region"
  aria-label="业务与执行状态转换映射表，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>`,
];

function requiredDocument() {
  assert.ok(document, 'MOD-08 content document must exist');
  return document;
}

function stateDiagrams(body) {
  const diagrams = [...body.matchAll(
    /```mermaid\n(stateDiagram-v2[\s\S]*?)\n```/gu,
  )].map((match) => match[1]);
  assert.equal(diagrams.length, 2, 'MOD-08 must have exactly two state diagrams');
  return diagrams;
}

function parseStateDiagram(graph) {
  const [header, ...lines] = graph.split('\n').filter((line) => line.trim() !== '');
  assert.equal(header, 'stateDiagram-v2', 'state diagram header');

  const declarations = [];
  const edges = [];
  for (const line of lines) {
    const declaration = line.match(/^\s*state "([^"]+)" as ([a-z_]+)\s*$/u);
    if (declaration) {
      declarations.push({id: declaration[2], label: declaration[1]});
      continue;
    }

    const edge = line.match(/^\s*([a-z_]+) --> ([a-z_]+)\s*:\s*(.+?)\s*$/u);
    if (edge) {
      edges.push({from: edge[1], to: edge[2], label: edge[3]});
      continue;
    }

    assert.fail(`unsupported state diagram line: ${line.trim()}`);
  }
  const stateIds = new Set(declarations.map(({id}) => id));

  assert.equal(stateIds.size, declarations.length, 'state declarations must be unique');
  assert.equal(
    new Set(edges.map(({from, to}) => `${from}->${to}`)).size,
    edges.length,
    'directed transitions must be unique',
  );
  for (const {from, to} of edges) {
    assert.ok(stateIds.has(from), `transition endpoint must be declared: ${from}`);
    assert.ok(stateIds.has(to), `transition endpoint must be declared: ${to}`);
  }
  return {
    states: declarations.toSorted((left, right) => left.id.localeCompare(right.id)),
    edges: edges.toSorted((left, right) =>
      `${left.from}->${left.to}`.localeCompare(`${right.from}->${right.to}`)),
  };
}

function assertStateGraphs(body) {
  const [business, execution] = stateDiagrams(body).map(parseStateDiagram);
  assert.deepEqual(business.states, expectedBusinessStates);
  assert.deepEqual(business.edges, expectedBusinessEdges);
  assert.deepEqual(execution.states, expectedExecutionStates);
  assert.deepEqual(execution.edges, expectedExecutionEdges);
}

function markdownTables(body) {
  const tables = [];
  let current = [];
  for (const line of body.split('\n')) {
    if (/^\|.+\|$/u.test(line)) {
      current.push(line.slice(1, -1).split('|').map((cell) => cell.trim()));
    } else if (current.length > 0) {
      tables.push(current);
      current = [];
    }
  }
  if (current.length > 0) tables.push(current);
  return tables;
}

function mappingRows(body) {
  const tables = markdownTables(body);
  assert.equal(tables.length, 1, 'MOD-08 must contain exactly one Markdown table');
  const [header, separator, ...rows] = tables[0];
  assert.deepEqual(header, [
    '触发',
    '业务状态变化',
    '执行状态变化',
    '所需权威证据',
    '禁止推断',
  ]);
  assert.deepEqual(separator, ['---', '---', '---', '---', '---']);
  assert.equal(rows.length, 7, 'mapping table must contain seven records');
  return rows.map((row) => {
    assert.equal(row.length, header.length, 'mapping record column count');
    return Object.fromEntries(header.map((key, index) => [key, row[index]]));
  });
}

function assertMappingContract(body) {
  const rows = mappingRows(body);
  assert.deepEqual(rows, expectedMappingRows);
  const rowsByTrigger = new Map(rows.map((row) => [row['触发'], row]));
  assert.deepEqual(
    [...rowsByTrigger.keys()],
    expectedMappingRows.map((row) => row['触发']),
  );
  assert.match(rowsByTrigger.get('执行超时')['禁止推断'], /超时.*(?:失败|未发生)/u);
  assert.match(rowsByTrigger.get('未知结果后取消')['禁止推断'], /取消请求.*已经取消/u);
  assert.match(rowsByTrigger.get('确认部分效果后补偿')['禁止推断'], /补偿.*回滚/u);
  assert.match(rowsByTrigger.get('证据无法收敛后人工决议')['所需权威证据'], /disposition.*decision_ref/u);
}

function overflowWrappers(body) {
  return [...body.matchAll(
    /<div\n  className="(?:diagram-wrapper|table-wrapper table-wrapper--mapping)"\n  role="region"\n  aria-label="[^"]+"\n  tabIndex=\{0\}\n  onKeyDown=\{handleHorizontalArrowKey\}\n>/gu,
  )].map((match) => match[0]);
}

function assertInteractionContract(body) {
  assert.match(
    body,
    /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u,
  );
  assert.deepEqual(overflowWrappers(body), expectedWrappers);
}

function assertInvariantSentences(body) {
  for (const sentence of invariantSentences) assert.ok(body.includes(sentence), sentence);
}

function assertManualDispositionContract(body) {
  for (const heading of ['超时、取消与补偿', '转换合同', '完整演练']) {
    const content = section(body, heading);
    for (const meaning of manualDispositionMeanings) {
      assert.ok(content.includes(meaning), `${heading}: ${meaning}`);
    }
    for (const field of ['decision_ref', '决策人', '时间', '残余风险']) {
      assert.ok(content.includes(field), `${heading}: ${field}`);
    }
  }
}

function section(body, heading) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `missing ## ${heading}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start === -1 ? end : start + 1, end);
}

function assertSourceUsageBoundaries(body) {
  const sources = section(body, '来源');
  for (const boundary of expectedSourceUsageBoundaries) {
    assert.ok(sources.includes(boundary), boundary);
  }
}

function assertGlobalPublicationBoundary(topicsById, routes) {
  for (let number = 9; number <= 13; number += 1) {
    const id = `MOD-${String(number).padStart(2, '0')}`;
    const topic = topicsById.get(id);
    assert.ok(topic, `${id} backlog projection`);
    assert.equal(topic.published, false, `${id} published`);
    assert.equal(topic.status.value, 'pending', `${id} status`);
    assert.ok(!routes.has(topic.slug), `${id} route`);
  }
}

function horizontalArrowEvent({clientWidth = 100, scrollWidth = 300} = {}) {
  const region = {clientWidth, scrollWidth, scrollLeft: 0};
  let defaultPrevented = false;
  return {
    event: {
      key: 'ArrowRight',
      currentTarget: region,
      target: region,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() {
        defaultPrevented = true;
      },
    },
    region,
    wasDefaultPrevented: () => defaultPrevented,
  };
}

test('publishes MOD-08 with the approved metadata and structure', () => {
  const content = requiredDocument();
  assert.equal(content.metadata.topic_id, 'MOD-08');
  assert.equal(content.metadata.slug, '/modeling/mod-08');
  assert.equal(content.metadata.content_type, 'modeling');
  assert.equal(content.metadata.status, 'reviewed');
  assert.equal(content.metadata.priority, 'P1');
  assert.deepEqual(content.metadata.depends_on, ['MOD-07']);
  assert.deepEqual(content.metadata.adjacent_topics, ['MOD-07', 'PR-10', 'QA-02']);
  assert.deepEqual(content.metadata.related_cases, [
    '/cases/temporal-saga-durable-execution',
  ]);
  assert.deepEqual(content.metadata.related_questions, []);
  assert.deepEqual(
    content.headings.filter(({level}) => level === 2).map(({text}) => text),
    expectedHeadings,
  );
});

test('locks the complete business and execution state graph contracts', () => {
  assertStateGraphs(requiredDocument().body);
});

test('locks all seven business-to-execution mapping records', () => {
  assertMappingContract(requiredDocument().body);
});

test('keeps both diagrams and the mapping table keyboard accessible', () => {
  assertInteractionContract(requiredDocument().body);
});

test('scrolls only a directly focused overflowing region by 40 pixels', () => {
  const overflow = horizontalArrowEvent();
  handleHorizontalArrowKey(overflow.event);
  assert.equal(overflow.region.scrollLeft, 40);
  assert.equal(overflow.wasDefaultPrevented(), true);

  const staticRegion = horizontalArrowEvent({clientWidth: 300, scrollWidth: 300});
  handleHorizontalArrowKey(staticRegion.event);
  assert.equal(staticRegion.region.scrollLeft, 0);
  assert.equal(staticRegion.wasDefaultPrevented(), false);
});

test('states all seven state-machine design invariants verbatim', () => {
  assertInvariantSentences(requiredDocument().body);
});

test('carries all three audited manual dispositions through prose, mapping and exercise', () => {
  assertManualDispositionContract(requiredDocument().body);
});

test('governs the five exact MOD-08 sources and exposes every canonical locator', () => {
  const governed = ledger.documents['content/modeling/mod-08-state-machine-modeling.mdx'];
  const expectedSources = new Map([
    ['src-omg-uml-2-5-1-2017', 'https://www.omg.org/spec/UML/2.5.1'],
    ['src-docs-abd3e18c34a9', 'https://docs.temporal.io/workflows'],
    ['src-docs-1743ee34e211', 'https://docs.temporal.io/activities'],
    ['src-docs-9950c767c50f', 'https://docs.temporal.io/encyclopedia/retry-policies'],
    ['src-doi-c4c907db05fa', 'https://dl.acm.org/doi/10.1145/38713.38742'],
  ]);
  const visible = new Set(extractExternalLinks(requiredDocument()));

  assert.ok(governed, 'MOD-08 source review must exist');
  assert.equal(governed.reviewed_at, '2026-08-02');
  assert.deepEqual(governed.copyright_checks, [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ]);
  assert.deepEqual(governed.citations, [
    {source_id: 'src-omg-uml-2-5-1-2017', citation_url: 'https://www.omg.org/spec/UML/2.5.1', roles: ['definition', 'method'], manifest_primary: true, usage_mode: 'facts-summary', attribution_note: 'Unified Modeling Language 2.5.1, Object Management Group', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-docs-abd3e18c34a9', citation_url: 'https://docs.temporal.io/workflows', roles: ['runtime-fact'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Temporal Workflow, Temporal Technologies', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-docs-1743ee34e211', citation_url: 'https://docs.temporal.io/activities', roles: ['runtime-fact'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Temporal Activity, Temporal Technologies', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-docs-9950c767c50f', citation_url: 'https://docs.temporal.io/encyclopedia/retry-policies', roles: ['runtime-fact'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Temporal Retry Policies, Temporal Technologies', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-doi-c4c907db05fa', citation_url: 'https://dl.acm.org/doi/10.1145/38713.38742', roles: ['historical-context', 'method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Sagas, Hector Garcia-Molina and Kenneth Salem', modification_note: null, excerpt: null, quotation_reviewed: false},
  ]);

  for (const [sourceId, locator] of expectedSources) {
    assert.equal(ledger.sources.find(({id}) => id === sourceId)?.canonical_locator, locator);
    assert.ok(visible.has(locator), locator);
  }
  assert.equal(governed.citations.length, 5);
  assert.equal(governed.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  assert.ok(governed.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));
  assert.ok(governed.citations.every(({excerpt}) => excerpt === null));
  assert.ok(governed.citations.every(({modification_note}) => modification_note === null));
  assert.ok(governed.citations.every(({quotation_reviewed}) => quotation_reviewed === false));
  assertSourceUsageBoundaries(requiredDocument().body);

  for (const boundary of expectedSourceUsageBoundaries) {
    assert.throws(
      () => assertSourceUsageBoundaries(requiredDocument().body.replace(boundary, '边界被弱化。')),
      {name: 'AssertionError'},
      boundary,
    );
  }
});

test('connects MOD-08 reciprocally while keeping unpublished MOD-09 unlinked', () => {
  const links = new Set(extractInternalLinks(requiredDocument()));
  for (const href of [
    '/modeling',
    '/modeling/mod-07',
    '/principles/pr-10',
    '/quality-attributes/qa-02',
    '/cases/temporal-saga-durable-execution',
  ]) assert.ok(links.has(href), href);
  assert.ok(!links.has('/modeling/mod-09'));
  assert.match(requiredDocument().body, /MOD-09[^。\n]*尚未发布/u);

  for (const id of ['MOD-07', 'PR-10', 'QA-02']) {
    const peer = documentsById.get(id);
    assert.ok(peer, `${id} must be published`);
    assert.ok(peer.metadata.adjacent_topics.includes('MOD-08'), `${id} adjacency`);
    assert.ok(extractInternalLinks(peer).includes('/modeling/mod-08'), `${id} visible link`);
  }
  assert.doesNotMatch(documentsById.get('MOD-07').body, /MOD-08[^。\n]*仍未发布/u);
});

test('projects the G008 Batch 6 Stage A counts with MOD-08 pending', async () => {
  const [status, indexes] = await Promise.all([
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 7, total: 20, current: 'G008'},
    completed_topics: 46,
    content_documents: 89,
    governed_sources: 476,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  const topicsById = new Map(
    Object.values(indexes).flat().map((topic) => [topic.id, topic]),
  );
  assert.equal(topicsById.get('MOD-08').published, true);
  assert.equal(topicsById.get('MOD-08').status.value, 'pending');
  const routes = new Set(extractInternalLinks(requiredDocument()));
  assertGlobalPublicationBoundary(topicsById, routes);

  for (let number = 9; number <= 13; number += 1) {
    const id = `MOD-${String(number).padStart(2, '0')}`;
    const topic = topicsById.get(id);
    assert.throws(
      () => assertGlobalPublicationBoundary(
        new Map(topicsById).set(id, {...topic, published: true}),
        routes,
      ),
      {name: 'AssertionError'},
      `${id} published mutation`,
    );
    assert.throws(
      () => assertGlobalPublicationBoundary(
        new Map(topicsById).set(id, {
          ...topic,
          status: {...topic.status, value: 'complete'},
        }),
        routes,
      ),
      {name: 'AssertionError'},
      `${id} status mutation`,
    );
    assert.throws(
      () => assertGlobalPublicationBoundary(topicsById, new Set(routes).add(topic.slug)),
      {name: 'AssertionError'},
      `${id} route mutation`,
    );
  }
});

test('rejects state, edge, label, mapping, table, wrapper, disposition and invariant mutations', () => {
  const body = requiredDocument().body;

  assert.throws(
    () => assertStateGraphs(body.replace('  state "尝试执行" as attempting\n', '')),
    {name: 'AssertionError'},
    'removed execution state',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      '  ready --> attempting',
      '  attempting --> ready',
    )),
    {name: 'AssertionError'},
    'reversed execution transition',
  );
  assert.throws(
    () => assertStateGraphs(body.replace('  requested --> rejected : 业务规则拒绝\n', '')),
    {name: 'AssertionError'},
    'removed business transition',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      '  requested --> rejected : 业务规则拒绝',
      '  requested --> rejected : 业务规则拒绝\n  requested --> settled : 非法直达',
    )),
    {name: 'AssertionError'},
    'extra business transition',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      '  ready --> attempting : 以稳定 operation_id 开始',
      '  ready --> attempting : 以稳定 operation_id 开始\n  ready --> manual_closed : 非法直达',
    )),
    {name: 'AssertionError'},
    'extra execution transition',
  );
  assert.throws(
    () => assertStateGraphs(body.replace('state "结果未知" as unknown', 'state "业务失败" as unknown')),
    {name: 'AssertionError'},
    'semantic state relabel',
  );
  assert.throws(
    () => assertStateGraphs(body.replace('权威确认未发生且可安全重试', '任意超时后均可重试')),
    {name: 'AssertionError'},
    'weakened retry edge label',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      '  requested --> rejected : 业务规则拒绝',
      '  requested --> rejected : 业务规则拒绝\n  requested --> settled',
    )),
    {name: 'AssertionError'},
    'unlabeled business transition',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      '  ready --> attempting : 以稳定 operation_id 开始',
      '  ready --> attempting : 以稳定 operation_id 开始\n  ready --> manual_closed',
    )),
    {name: 'AssertionError'},
    'unlabeled execution transition',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      '  state "已请求" as requested',
      '  state "已请求" as requested\n  state rogue',
    )),
    {name: 'AssertionError'},
    'shorthand state declaration',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      '  requested --> rejected : 业务规则拒绝',
      '  requested --> rejected : 业务规则拒绝\n  rogue --> settled : 隐式状态',
    )),
    {name: 'AssertionError'},
    'implicit-state transition',
  );
  assert.throws(
    () => assertStateGraphs(body.replace(
      'stateDiagram-v2',
      'stateDiagram-v2\n  direction LR',
    )),
    {name: 'AssertionError'},
    'unsupported diagram directive',
  );

  for (const row of expectedMappingRows) {
    assert.throws(
      () => assertMappingContract(body.replace(
        `| ${row['触发']} |`,
        `| ${row['触发']}（篡改） |`,
      )),
      {name: 'AssertionError'},
      row['触发'],
    );
  }
  assert.throws(
    () => assertMappingContract(`${body}\n| 额外 | 表格 |\n| --- | --- |\n`),
    {name: 'AssertionError'},
    'second Markdown table',
  );

  assert.throws(
    () => assertInteractionContract(body.replace('  tabIndex={0}\n', '')),
    {name: 'AssertionError'},
    'removed tabIndex',
  );
  assert.throws(
    () => assertInteractionContract(body.replace(
      '  onKeyDown={handleHorizontalArrowKey}\n',
      '',
    )),
    {name: 'AssertionError'},
    'removed onKeyDown',
  );

  for (const sentence of invariantSentences) {
    assert.throws(
      () => assertInvariantSentences(body.replace(sentence, `${sentence.slice(0, -1)}（弱化）。`)),
      {name: 'AssertionError'},
      sentence,
    );
  }
  for (const meaning of manualDispositionMeanings) {
    assert.throws(
      () => assertManualDispositionContract(body.replaceAll(meaning, '人工 disposition 含义被删除')),
      {name: 'AssertionError'},
      meaning,
    );
  }
});

test('uses a source-wide OMG ledger boundary without changing MOD-07 local wording', () => {
  const omg = ledger.sources.find(({id}) => id === 'src-omg-uml-2-5-1-2017');
  assert.equal(
    omg.usage_boundary,
    'Supports UML 2.5.1 diagram names and standard semantic scope only; it does not support domain examples, local modeling workflows, production facts, or claims that a diagram proves implementation behavior.',
  );
  assert.match(
    documentsById.get('MOD-07').body,
    /不支持本文的费用领域示例、选图流程、生产事实，也不证明实现行为/u,
  );
});
