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

const expectedBusinessStates = new Set([
  'requested',
  'accepted',
  'settlement_pending',
  'settled',
  'rejected',
  'cancelled_before_effect',
  'compensated',
  'manually_resolved',
]);

const expectedExecutionStates = new Set([
  'ready',
  'attempting',
  'awaiting_receipt',
  'unknown',
  'reconciling',
  'confirmed_success',
  'compensation_pending',
  'compensated',
  'manual_review',
  'manual_closed',
  'stopped_before_effect',
]);

const expectedExecutionEdges = new Set([
  'ready->attempting',
  'attempting->awaiting_receipt',
  'awaiting_receipt->confirmed_success',
  'awaiting_receipt->unknown',
  'unknown->reconciling',
  'reconciling->confirmed_success',
  'reconciling->ready',
  'reconciling->compensation_pending',
  'reconciling->manual_review',
  'compensation_pending->compensated',
  'compensation_pending->manual_review',
  'manual_review->manual_closed',
  'ready->stopped_before_effect',
]);

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
    '所需权威证据': '持久 `disposition`、`decision_ref`、决策人、时间与残余风险',
    '禁止推断': '`manual_closed` 不能在缺少业务决议时被当作业务终态',
  },
];

const invariantSentences = [
  '调用超时只说明观察者没有按时得到结果，不能单独证明业务失败或外部效果未发生。',
  '取消是事件和意图，不等于已经取消；执行已提交或结果未知时必须先对账。',
  '补偿创建新的业务事实，不是把历史回滚成从未发生。',
  '人工终态必须保存 disposition、decision_ref、决策人、时间和残余风险。',
];

const expectedSourceUsageBoundaries = [
  '仅支持 UML 2.5.1 的图名称与标准语义范围；不支持费用领域示例、模型选择工作流、生产事实，也不能据此声称图证明了实现行为。',
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
  const declarations = [...graph.matchAll(
    /^\s*state "[^"]+" as ([a-z_]+)\s*$/gmu,
  )].map((match) => match[1]);
  const edges = [...graph.matchAll(
    /^\s*([a-z_]+) --> ([a-z_]+)(?:\s*:.*)?$/gmu,
  )].map((match) => `${match[1]}->${match[2]}`);
  const states = new Set(declarations);

  assert.equal(states.size, declarations.length, 'state declarations must be unique');
  assert.equal(new Set(edges).size, edges.length, 'directed transitions must be unique');
  for (const edge of edges) {
    const [left, right] = edge.split('->');
    assert.ok(states.has(left), `transition endpoint must be declared: ${left}`);
    assert.ok(states.has(right), `transition endpoint must be declared: ${right}`);
  }
  return {states, edges: new Set(edges)};
}

function assertStateGraphs(body) {
  const [business, execution] = stateDiagrams(body).map(parseStateDiagram);
  assert.deepEqual(
    [...business.states].sort(),
    [...expectedBusinessStates].sort(),
  );
  assert.deepEqual(
    [...execution.states].sort(),
    [...expectedExecutionStates].sort(),
  );
  for (const edge of expectedExecutionEdges) {
    assert.ok(execution.edges.has(edge), `missing execution transition: ${edge}`);
  }
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

test('states the four timeout, cancellation, compensation and manual invariants verbatim', () => {
  assertInvariantSentences(requiredDocument().body);
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

test('rejects state, edge, mapping, table, wrapper and invariant mutations', () => {
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
});
