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

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const modelingHeadings = [
  '学习问题',
  '建模目标与输入',
  '参与者与步骤',
  '模型产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];
const expectedSourceGovernance = new Map([
  [
    'src-sap-powerdesigner-data-modeling-16-7-sp10',
    {
      title: 'Getting Started with Data Modeling — SAP PowerDesigner 16.7 SP10',
      author_or_org: 'SAP',
      published_at: null,
      version: 'SAP PowerDesigner 16.7 SP10 documentation checked on 2026-07-31',
      canonical_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
      transport_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
      expected_final_transport_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
      allowed_evidence_roles: ['definition', 'learning', 'method'],
      license: 'LicenseRef-All-Rights-Reserved',
      license_scope: 'Facts and the named SAP PowerDesigner documentation page only; prose, figures, tables, screenshots, product UI, logos, linked works, and third-party material excluded; named trademarks require first-use symbols and the article-end attribution and are not licensed for reuse',
      license_evidence_url: 'https://www.sap.com/about/legal/trademark.html',
      license_evidence_note: 'SAP trademark guidelines require first-use trademark marking and an end-of-document attribution for named SAP marks; Tego Arch marks the first public product-name use, keeps official document titles unchanged, and otherwise uses textual references, links, original factual summaries, and the required attribution only.',
      license_family_id: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
      license_family_grouping: 'identity',
      family_grouping_evidence_url: null,
      copyright_policy: 'facts-and-short-quotation',
      usage_boundary: 'Supports the named PowerDesigner abstraction or physical-model concept only; it is a product method, not a universal data-modeling standard, and the required trademark attribution does not imply SAP sponsorship or endorsement.',
      expected_final_approval_note: 'Reviewed G008 Batch 3 SAP documentation transport, all-rights-reserved boundary, first-use trademark marking, and required attribution',
    },
  ],
  [
    'src-sap-powerdesigner-physical-model-16-7-sp10',
    {
      title: 'Physical Data Models — SAP PowerDesigner 16.7 SP10',
      author_or_org: 'SAP',
      published_at: null,
      version: 'SAP PowerDesigner 16.7 SP10 documentation checked on 2026-07-31',
      canonical_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
      transport_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
      expected_final_transport_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
      allowed_evidence_roles: ['definition', 'learning', 'method'],
      license: 'LicenseRef-All-Rights-Reserved',
      license_scope: 'Facts and the named SAP PowerDesigner documentation page only; prose, figures, tables, screenshots, product UI, logos, linked works, and third-party material excluded; named trademarks require first-use symbols and the article-end attribution and are not licensed for reuse',
      license_evidence_url: 'https://www.sap.com/about/legal/trademark.html',
      license_evidence_note: 'SAP trademark guidelines require first-use trademark marking and an end-of-document attribution for named SAP marks; Tego Arch marks the first public product-name use, keeps official document titles unchanged, and otherwise uses textual references, links, original factual summaries, and the required attribution only.',
      license_family_id: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
      license_family_grouping: 'identity',
      family_grouping_evidence_url: null,
      copyright_policy: 'facts-and-short-quotation',
      usage_boundary: 'Supports the named PowerDesigner abstraction or physical-model concept only; it is a product method, not a universal data-modeling standard, and the required trademark attribution does not imply SAP sponsorship or endorsement.',
      expected_final_approval_note: 'Reviewed G008 Batch 3 SAP documentation transport, all-rights-reserved boundary, first-use trademark marking, and required attribution',
    },
  ],
  [
    'src-ibm-ida-logical-data-model-9-1-1',
    {
      title: 'Logical Data Models — IBM InfoSphere Data Architect 9.1.1',
      author_or_org: 'IBM',
      published_at: null,
      version: 'IBM InfoSphere Data Architect 9.1.1 documentation checked on 2026-07-31',
      canonical_locator: 'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
      transport_locator: 'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
      expected_final_transport_locator: 'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
      allowed_evidence_roles: ['definition', 'learning', 'method'],
      license: 'LicenseRef-All-Rights-Reserved',
      license_scope: 'Facts and the named IBM documentation page only; prose, figures, tables, screenshots, product UI, logos, linked works, and third-party material excluded; IBM and InfoSphere trademark references require first-use symbols and attribution and are not licensed for reuse',
      license_evidence_url: 'https://www.ibm.com/legal/copyright-trademark',
      license_evidence_note: 'IBM copyright and trademark information identifies IBM and InfoSphere as IBM trademarks and requires first-use marking plus attribution on the page or in the legal section; Tego Arch marks the first public product-name use, keeps the official document title unchanged, and otherwise uses textual references, links, original factual summaries, and the required attribution only.',
      license_family_id: 'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
      license_family_grouping: 'identity',
      family_grouping_evidence_url: null,
      copyright_policy: 'facts-and-short-quotation',
      usage_boundary: 'Supports DBMS-independent logical entities, identifiers, relationships, and constraints; it does not establish current DBMS behavior, and the trademark attribution does not imply IBM sponsorship or endorsement.',
      expected_final_approval_note: 'Reviewed G008 Batch 3 IBM documentation transport, all-rights-reserved boundary, first-use trademark marking, and required attribution',
    },
  ],
  [
    'src-postgresql-18-constraints',
    {
      title: 'PostgreSQL 18 — Constraints',
      author_or_org: 'PostgreSQL Global Development Group',
      published_at: '2025-09-25',
      version: 'PostgreSQL 18 documentation checked on 2026-07-31',
      canonical_locator: 'https://www.postgresql.org/docs/18/ddl-constraints.html',
      transport_locator: 'https://www.postgresql.org/docs/18/ddl-constraints.html',
      expected_final_transport_locator: 'https://www.postgresql.org/docs/18/ddl-constraints.html',
      allowed_evidence_roles: ['definition', 'implementation', 'learning'],
      license: 'PostgreSQL',
      license_scope: 'The named PostgreSQL 18 documentation page under the PostgreSQL License; trademarks, linked works, and separately licensed third-party material excluded',
      license_evidence_url: 'https://www.postgresql.org/about/licence/',
      license_evidence_note: 'The official PostgreSQL license page permits use, copy, modification, and distribution subject to its copyright and permission notice.',
      license_family_id: 'https://www.postgresql.org/docs/18/',
      license_family_grouping: 'identity',
      family_grouping_evidence_url: null,
      copyright_policy: 'adapt-with-attribution',
      usage_boundary: 'Supports PostgreSQL 18 constraint mechanism behavior only; it does not define the conceptual/logical/physical taxonomy, expense-domain rules, type choices, or application performance.',
      expected_final_approval_note: 'Reviewed G008 Batch 3 PostgreSQL 18 pinned documentation transport and license boundary',
    },
  ],
  [
    'src-postgresql-18-indexes',
    {
      title: 'PostgreSQL 18 — Indexes',
      author_or_org: 'PostgreSQL Global Development Group',
      published_at: '2025-09-25',
      version: 'PostgreSQL 18 documentation checked on 2026-07-31',
      canonical_locator: 'https://www.postgresql.org/docs/18/indexes.html',
      transport_locator: 'https://www.postgresql.org/docs/18/indexes.html',
      expected_final_transport_locator: 'https://www.postgresql.org/docs/18/indexes.html',
      allowed_evidence_roles: ['definition', 'implementation', 'learning'],
      license: 'PostgreSQL',
      license_scope: 'The named PostgreSQL 18 documentation page under the PostgreSQL License; trademarks, linked works, and separately licensed third-party material excluded',
      license_evidence_url: 'https://www.postgresql.org/about/licence/',
      license_evidence_note: 'The official PostgreSQL license page permits use, copy, modification, and distribution subject to its copyright and permission notice.',
      license_family_id: 'https://www.postgresql.org/docs/18/',
      license_family_grouping: 'identity',
      family_grouping_evidence_url: null,
      copyright_policy: 'adapt-with-attribution',
      usage_boundary: 'Supports PostgreSQL 18 index mechanism behavior only; it does not define the conceptual/logical/physical taxonomy, expense-domain rules, type choices, or application performance.',
      expected_final_approval_note: 'Reviewed G008 Batch 3 PostgreSQL 18 pinned documentation transport and license boundary',
    },
  ],
]);
const expectedCitations = new Map([
  ['src-sap-powerdesigner-data-modeling-16-7-sp10', {
    citation_url: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
    roles: ['definition', 'method'],
    manifest_primary: true,
    usage_mode: 'facts-summary',
    attribution_note: 'Getting Started with Data Modeling, SAP PowerDesigner 16.7 SP10',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  }],
  ['src-sap-powerdesigner-physical-model-16-7-sp10', {
    citation_url: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
    roles: ['definition', 'method'],
    manifest_primary: false,
    usage_mode: 'facts-summary',
    attribution_note: 'Physical Data Models, SAP PowerDesigner 16.7 SP10',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  }],
  ['src-ibm-ida-logical-data-model-9-1-1', {
    citation_url: 'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
    roles: ['definition', 'method'],
    manifest_primary: true,
    usage_mode: 'facts-summary',
    attribution_note: 'Logical data models, IBM InfoSphere Data Architect 9.1.1',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  }],
  ['src-postgresql-18-constraints', {
    citation_url: 'https://www.postgresql.org/docs/18/ddl-constraints.html',
    roles: ['implementation'],
    manifest_primary: true,
    usage_mode: 'facts-summary',
    attribution_note: 'PostgreSQL 18 Constraints, PostgreSQL Global Development Group',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  }],
  ['src-postgresql-18-indexes', {
    citation_url: 'https://www.postgresql.org/docs/18/indexes.html',
    roles: ['implementation'],
    manifest_primary: false,
    usage_mode: 'facts-summary',
    attribution_note: 'PostgreSQL 18 Indexes, PostgreSQL Global Development Group',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  }],
]);
const sapTrademarkNotice =
  'SAP 和 SAP PowerDesigner 是 SAP SE 或其关联公司在德国及其他国家/地区的商标或注册商标。';
const ibmTrademarkNotice =
  'IBM 和 InfoSphere 是 International Business Machines Corporation 在美国和/或其他国家/地区的商标或注册商标。';
const sapFirstProductUse = 'SAP® PowerDesigner® 软件的官方文档';
const ibmFirstProductUse =
  'IBM® InfoSphere® Data Architect 软件的官方文档';
const expectedMappingRows = [
  ['层次', '回答的问题', '费用申报示例', '新增决定', '明确不证明'],
  ['概念模型', '业务中有哪些事物与词义', '员工、费用申报、审批、付款', '概念边界与业务关系', '实体键、基数、表结构或流程顺序'],
  ['逻辑模型', '实体如何识别、关联并受约束', 'Employee、ExpenseClaim、Approval、PaymentInstruction', '唯一标识、属性、关系、基数与业务约束', 'SQL 表已设计或查询性能达标'],
  ['可移植关系模式', '逻辑实体如何映射为关系结构', 'employee、expense_claim、approval、payment_instruction', '表、PK/FK、唯一性、类型族和索引候选', '严格意义上的 DBMS 物理模型或可部署 schema'],
  ['PostgreSQL 18 物理实现切片', '平台如何落实约束与访问路径', 'PostgreSQL 约束、类型与索引类别', '实际约束类别、类型选择和索引候选', '完整生产 DDL、容量、迁移安全或性能结果'],
];
const [documents, ledger, linkHealth, status, backlog] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8')
    .then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8')
    .then(JSON.parse),
  readFile(
    new URL('../src/generated/project-status.json', import.meta.url),
    'utf8',
  ).then(JSON.parse),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
]);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);

function requiredDocument(id) {
  const document = byId.get(id);
  assert.ok(document, `${id} must be published`);
  return document;
}

function section(body, heading) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `missing ## ${heading}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start === -1 ? end : start + 1, end);
}

function markdownTableRows(body) {
  return body
    .split('\n')
    .filter((line) => /^\|.+\|$/u.test(line))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/u.test(cell)));
}

function fencedBlock(body, language) {
  const matches = [...body.matchAll(
    new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'gu'),
  )];
  assert.equal(matches.length, 1, `expected exactly one ${language} block`);
  return matches[0][1];
}

function parseMermaidGraph(source) {
  const [header, ...edgeLines] = source.split('\n');
  assert.equal(header, 'flowchart LR');
  const nodeLabels = new Map();
  for (const match of source.matchAll(/\b([A-Za-z][\w-]*)\["([^"]+)"\]/gu)) {
    const [, id, label] = match;
    const existing = nodeLabels.get(id);
    assert.ok(existing === undefined || existing === label, `${id} label conflict`);
    nodeLabels.set(id, label);
  }

  const edges = [];
  const edgePattern =
    /^\s*([A-Za-z][\w-]*)(?:\["([^"]+)"\])?\s+(?:(-->)(?:\|([^|\n]+)\|)?|(-\.(.+?)\.->))\s+([A-Za-z][\w-]*)(?:\["([^"]+)"\])?\s*$/u;
  for (const line of edgeLines.filter((value) => value.trim())) {
    const match = line.match(edgePattern);
    assert.ok(match, `illegal Mermaid edge: ${line.trim()}`);
    const [
      ,
      fromId,
      fromLabel,
      solidConnector,
      solidLabel,
      dottedConnector,
      dottedLabel,
      toId,
      toLabel,
    ] = match;
    assert.ok(solidConnector === '-->' || dottedConnector !== undefined);
    if (fromLabel !== undefined) {
      assert.equal(nodeLabels.get(fromId), fromLabel);
    }
    if (toLabel !== undefined) {
      assert.equal(nodeLabels.get(toId), toLabel);
    }
    assert.ok(nodeLabels.has(fromId), `unresolved Mermaid node: ${fromId}`);
    assert.ok(nodeLabels.has(toId), `unresolved Mermaid node: ${toId}`);
    const connectorKind = solidConnector === '-->' ? 'solid' : 'dotted';
    const connectorLabel = solidLabel ?? dottedLabel ?? '';
    edges.push(
      `${connectorKind}|${connectorLabel}|` +
      `${fromId} -> ${toId}`,
    );
  }
  assert.equal(new Set(edges).size, edges.length, 'duplicate Mermaid edge');
  return {
    nodes: Object.fromEntries([...nodeLabels.entries()].sort()),
    edges,
  };
}

function assertMermaidSemantics(source) {
  const expectedNodes = {
    A: '本站教学假设',
    C: '业务概念<br/>员工 · 费用申报 · 审批 · 付款',
    L: '逻辑实体<br/>Employee · ExpenseClaim · Approval · PaymentInstruction',
    P: 'PostgreSQL 18 物理决定<br/>PK / FK / UNIQUE / CHECK / NOT NULL<br/>类型选择 · 索引候选',
    R: '可移植关系表<br/>employee · expense_claim · approval · payment_instruction',
    U: '未知项',
    V: '验证缺口<br/>迁移窗口 · 回填与回滚<br/>查询分布 · 写入竞争 · 完整性与运行测量',
  };
  const expectedEdges = [
    'solid|映射业务词义|C -> L',
    'solid|映射为关系结构|L -> R',
    'solid|加入 PostgreSQL 18 决定|R -> P',
    'solid|保留迁移与运行验证|P -> V',
    'dotted|标注字段、键与约束|A -> L',
    'dotted|标注类型与索引候选|A -> P',
    'dotted|保留查询、写入与完整性事实|U -> R',
    'dotted|保留性能与迁移结果|U -> V',
  ].sort();
  const graph = parseMermaidGraph(source);
  assert.deepEqual(graph.nodes, expectedNodes);
  assert.deepEqual(new Set(graph.edges), new Set(expectedEdges));
}

function assertMappingWording(source) {
  assert.match(source, /映射业务词义/u);
  assert.doesNotMatch(source, /先执行/u);
  assert.match(source, /箭头表示层次间映射或新增决定，不表示运行时序/u);
}

function assertRequiredInputs(source) {
  const inputs = section(source, '建模目标与输入');
  assert.match(inputs, /身份、生命周期、时间与金额语义/u);
  assert.match(inputs, /数据保留、审计、权限与迁移约束/u);
  assert.match(inputs, /可验证的查询、写入和完整性要求/u);
  assert.match(inputs, /本站原创的教学假设/u);
}

function assertRequiredFailures(source) {
  const failures = section(source, '常见失败');
  assert.match(failures, /把逻辑模型画成流程[^。\n]*运行顺序/u);
  assert.match(failures, /从 C4 或 arc42[^。\n]*生产 schema/u);
  assert.match(failures, /忽略金额、时间、身份、历史和迁移语义/u);
}

function assertDataModelBoundaries(source) {
  assert.match(source, /可移植关系模式不是严格意义上的完整物理模型/u);
  assert.match(source, /本站原创的教学假设/u);
  assert.match(source, /索引候选不证明性能/u);
  assert.match(source, /不是生产 schema，也不是可部署 schema/u);
  assert.doesNotMatch(source, /CREATE\s+TABLE/iu);
  assert.doesNotMatch(source, /可移植关系模式就是已验证物理模型/u);
  assert.doesNotMatch(source, /生产事实/u);
  assert.doesNotMatch(source, /索引保证性能/u);
  assert.match(
    source,
    /约束、类型选择和索引候选[^。\n]*本站原创[^。\n]*教学决定/u,
  );
  assert.match(
    source,
    /PostgreSQL 18 官方文档[^。\n]*机制行为[^。\n]*不支持[^。\n]*费用申报领域规则/u,
  );
  assert.match(
    source,
    /金额[^。\n]*数值类型[^。\n]*本站教学决定[^。\n]*验证/u,
  );
}

function assertSourceGovernance(source) {
  const expected = expectedSourceGovernance.get(source.id);
  assert.ok(expected, `unexpected governed source: ${source.id}`);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(expected).map((field) => [field, source[field]]),
    ),
    expected,
  );
}

function assertCitationGovernance(citation) {
  const expected = expectedCitations.get(citation.source_id);
  assert.ok(expected, `unexpected citation: ${citation.source_id}`);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(expected).map((field) => [field, citation[field]]),
    ),
    expected,
  );
}

function mutatedValue(value) {
  if (Array.isArray(value)) {
    return value.slice(1);
  }
  if (value === null) {
    return 'https://example.com/unapproved';
  }
  if (typeof value === 'boolean') {
    return !value;
  }
  return `${value}-drift`;
}

function healthObservation(observation) {
  assert.ok(observation, 'missing link-health observation');
  return {
    at: observation.at,
    outcome: observation.outcome,
    final_transport_locator: observation.final_transport_locator,
    http_status: observation.http_status,
    login_wall_detected: observation.login_wall_detected,
  };
}

function assertStableSourceHealth(sourceId, result) {
  const expected = expectedSourceGovernance.get(sourceId);
  assert.ok(expected, `unexpected stable source: ${sourceId}`);
  assert.ok(result, `${sourceId} link health`);
  assert.deepEqual(result.source_ids, [sourceId]);
  assert.equal(result.transport_locator, expected.canonical_locator);
  assert.equal(result.review_status, 'healthy');
  assert.equal(result.last_attempt?.outcome, 'healthy');
  assert.equal(result.last_attempt?.login_wall_detected, false);
  assert.equal(result.last_success?.login_wall_detected, false);
  assert.ok(
    Number.isInteger(result.last_attempt?.http_status) &&
      result.last_attempt.http_status >= 200 &&
      result.last_attempt.http_status < 300,
    `${sourceId} current result must be 2xx`,
  );
  assert.equal(
    result.last_attempt.final_transport_locator,
    expected.expected_final_transport_locator,
  );
  assert.deepEqual(
    healthObservation(result.last_success),
    healthObservation(result.last_attempt),
  );
}

test('publishes MOD-05 as one progressive expense-claim data model', () => {
  const document = requiredDocument('MOD-05');
  assert.equal(
    document.file,
    'modeling/mod-05-conceptual-logical-physical-data-model.mdx',
  );
  assert.equal(document.metadata.slug, '/modeling/mod-05');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.priority, 'P0');
  assert.deepEqual(document.metadata.depends_on, ['MOD-01']);
  assert.deepEqual(document.metadata.adjacent_topics, [
    'MOD-04',
    'MOD-06',
    'MOD-09',
    'MOD-11',
    'PR-13',
  ]);
  assert.deepEqual(document.metadata.related_cases, [
    '/cases/temporal-saga-durable-execution',
  ]);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );
  for (const label of [
    '概念模型',
    '逻辑模型',
    '可移植关系模式',
    'PostgreSQL 18 物理实现切片',
  ]) {
    assert.match(document.body, new RegExp(label, 'u'), label);
  }
  assert.match(document.body, /费用申报系统/u);
  assert.match(document.body, /银行支付服务/u);
});

test('keeps terminology and evidence boundaries mutation-sensitive', () => {
  const body = requiredDocument('MOD-05').body;
  assertDataModelBoundaries(body);
  assertRequiredInputs(body);
  assertRequiredFailures(body);

  for (const forbiddenMutation of [
    body.replace(
      '可移植关系模式不是严格意义上的完整物理模型',
      '可移植关系模式就是已验证物理模型',
    ),
    body.replace('本站原创的教学假设', '生产事实'),
    body.replace('索引候选不证明性能', '索引保证性能'),
    body.replace('本站原创的教学决定', 'PostgreSQL 官方结论'),
    body.replace('不支持费用申报领域规则', '支持费用申报领域规则'),
  ]) {
    assert.throws(
      () => assertDataModelBoundaries(forbiddenMutation),
      {name: 'AssertionError'},
    );
  }
  for (const missingInput of [
    '身份、生命周期、时间与金额语义',
    '数据保留、审计、权限与迁移约束',
    '可验证的查询、写入和完整性要求',
  ]) {
    assert.throws(
      () => assertRequiredInputs(body.replace(missingInput, '未定义输入')),
      {name: 'AssertionError'},
      missingInput,
    );
  }
  for (const missingFailure of [
    '把逻辑模型画成流程',
    '从 C4 或 arc42',
    '忽略金额、时间、身份、历史和迁移语义',
  ]) {
    assert.throws(
      () => assertRequiredFailures(body.replace(missingFailure, '忽略失败模式')),
      {name: 'AssertionError'},
      missingFailure,
    );
  }
});

test('uses only published relationships including MOD-06', () => {
  const document = requiredDocument('MOD-05');
  const links = new Set(extractInternalLinks(document));
  for (const slug of [
    '/modeling',
    '/modeling/mod-01',
    '/modeling/mod-02',
    '/modeling/mod-04',
    '/principles/pr-13',
    '/cases/temporal-saga-durable-execution',
  ]) {
    assert.ok(links.has(slug), slug);
  }
  assert.equal(links.has('/modeling/mod-06'), true);
  assert.doesNotMatch(document.body, /MOD-06[^。\n]*尚未发布/u);
});

test('renders one exact four-layer mapping table and one visual', () => {
  const body = requiredDocument('MOD-05').body;
  const artifacts = section(body, '模型产物');
  const rows = markdownTableRows(artifacts);
  assert.equal(rows.length, 5, 'one header plus four data rows');
  assert.deepEqual(rows[0], [
    '层次',
    '回答的问题',
    '费用申报示例',
    '新增决定',
    '明确不证明',
  ]);
  assert.deepEqual(rows.slice(1).map(([layer]) => layer), [
    '概念模型',
    '逻辑模型',
    '可移植关系模式',
    'PostgreSQL 18 物理实现切片',
  ]);
  assert.equal(new Set(rows.slice(1).map(([layer]) => layer)).size, 4);
  assert.equal(
    [...artifacts.matchAll(
      /className="table-wrapper table-wrapper--mapping"/gu,
    )].length,
    1,
  );
  assert.match(artifacts, /tabIndex=\{0\}/u);
  assert.match(artifacts, /可横向滚动/u);
  assert.deepEqual(rows, expectedMappingRows);
  assert.equal([...body.matchAll(/```mermaid\n/gu)].length, 1);
});

test('parses the exact Mermaid edge multiset independent of line order', () => {
  const body = requiredDocument('MOD-05').body;
  const mermaid = fencedBlock(body, 'mermaid');
  assertMermaidSemantics(mermaid);
  assertMappingWording(body);

  const lines = mermaid.split('\n');
  assert.doesNotThrow(() =>
    assertMermaidSemantics([lines[0], ...lines.slice(1).reverse()].join('\n'))
  );
  for (const invalidMutation of [
    mermaid.replace('flowchart LR', 'flowchart TD'),
    mermaid.replace('-->', '==>'),
    mermaid.replace(
      '-.标注字段、键与约束.->',
      '-->|标注字段、键与约束|',
    ),
    mermaid.replace('员工 · 费用申报 · 审批 · 付款', '费用申报'),
    mermaid.replace('PaymentInstruction', 'Payment'),
    mermaid.replace('payment_instruction', 'payment'),
    mermaid.replace('PK / FK / UNIQUE / CHECK / NOT NULL', 'PK / FK'),
    mermaid.replace('迁移窗口 · 回填与回滚', '待验证'),
    mermaid.replace('映射为关系结构', '随后创建表'),
    mermaid.replace(
      'A -.标注类型与索引候选.-> P',
      'A -.标注类型与索引候选.-> R',
    ),
    `${mermaid}\n${lines[1]}`,
    lines.filter((_, index) => index !== 1).join('\n'),
  ]) {
    assert.throws(
      () => assertMermaidSemantics(invalidMutation),
      {name: 'AssertionError'},
    );
  }
  assert.throws(
    () => assertMappingWording(body.replace('映射业务词义', '先执行')),
    {name: 'AssertionError'},
  );
});

test('governs exactly the five visible MOD-05 official sources', () => {
  const document = requiredDocument('MOD-05');
  assert.deepEqual(
    extractExternalLinks(document),
    [...expectedSourceGovernance.values()]
      .map(({canonical_locator}) => canonical_locator),
  );

  const review = ledger.documents[
    'content/modeling/mod-05-conceptual-logical-physical-data-model.mdx'
  ];
  assert.ok(review, 'MOD-05 ledger review must exist');
  assert.deepEqual(
    review.citations.map(({source_id}) => source_id),
    [...expectedCitations.keys()],
  );
  assert.deepEqual(
    review.citations
      .filter(({manifest_primary}) => manifest_primary)
      .map(({source_id}) => source_id),
    [
      'src-sap-powerdesigner-data-modeling-16-7-sp10',
      'src-ibm-ida-logical-data-model-9-1-1',
      'src-postgresql-18-constraints',
    ],
  );

  const governedSources = ledger.sources
    .filter(({id}) => expectedSourceGovernance.has(id));
  assert.equal(governedSources.length, expectedSourceGovernance.size);
  for (const source of governedSources) {
    assertSourceGovernance(source);
    assert.ok(document.body.includes(source.canonical_locator), source.id);
    const expected = expectedSourceGovernance.get(source.id);
    for (const field of Object.keys(expected)) {
      assert.throws(
        () => assertSourceGovernance({
          ...source,
          [field]: mutatedValue(source[field]),
        }),
        {name: 'AssertionError'},
        `${source.id}.${field}`,
      );
    }
  }
  for (const citation of review.citations) {
    assertCitationGovernance(citation);
    const expected = expectedCitations.get(citation.source_id);
    for (const field of Object.keys(expected)) {
      assert.throws(
        () => assertCitationGovernance({
          ...citation,
          [field]: mutatedValue(citation[field]),
        }),
        {name: 'AssertionError'},
        `${citation.source_id}.${field}`,
      );
    }
  }
  const sourcesBody = section(document.body, '来源');
  assert.match(sourcesBody, new RegExp(sapFirstProductUse, 'u'));
  assert.match(sourcesBody, new RegExp(ibmFirstProductUse, 'u'));
  assert.equal(
    sourcesBody.indexOf('SAP'),
    sourcesBody.indexOf(sapFirstProductUse),
    'first public SAP product use must carry the official marks',
  );
  assert.equal(
    sourcesBody.indexOf('IBM'),
    sourcesBody.indexOf(ibmFirstProductUse),
    'first public IBM product use must carry the official marks',
  );
  assert.equal(
    document.body.trimEnd().endsWith(
      `${sapTrademarkNotice}\n\n${ibmTrademarkNotice}`,
    ),
    true,
    'SAP and IBM trademark notices must close the article',
  );

  for (const sourceId of expectedSourceGovernance.keys()) {
    const results = linkHealth.results.filter(({source_ids}) =>
      source_ids.includes(sourceId)
    );
    assert.equal(results.length, 1, `${sourceId} exact link-health association`);
    assertStableSourceHealth(sourceId, results[0]);
  }
  assert.equal(ledger.sources.length, 506);
});

test('projects the exact G008 Batch 3 Stage B repository state', () => {
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 55,
    content_documents: 96,
    governed_sources: 506,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assert.match(backlog, /^- \[x\] \*\*MOD-05 /mu);
  assert.match(backlog, /下一项[^。\n]*MOD-06/u);
});

test('rejects policy-incompatible stable-source health mutations', () => {
  const sourceId = 'src-sap-powerdesigner-data-modeling-16-7-sp10';
  const stableResult = structuredClone(
    linkHealth.results.find(({source_ids}) =>
      source_ids.includes(sourceId)
    ),
  );
  const authRequired = structuredClone(stableResult);
  authRequired.review_status = 'auth-required';
  authRequired.last_attempt.outcome = 'auth-required';
  authRequired.last_attempt.http_status = 401;
  authRequired.last_success.outcome = 'auth-required';
  authRequired.last_success.http_status = 401;

  const extraAssociation = structuredClone(stableResult);
  extraAssociation.source_ids.push('src-postgresql-18-indexes');

  const redirectOnly = structuredClone(stableResult);
  redirectOnly.last_attempt.http_status = 302;
  redirectOnly.last_success.http_status = 302;

  const finalLocatorDrift = structuredClone(stableResult);
  finalLocatorDrift.last_attempt.final_transport_locator =
    'https://example.com/drift';
  finalLocatorDrift.last_success.final_transport_locator =
    'https://example.com/drift';

  const loginWall = structuredClone(stableResult);
  loginWall.last_attempt.login_wall_detected = true;
  loginWall.last_success.login_wall_detected = true;

  for (const invalidResult of [
    authRequired,
    extraAssociation,
    redirectOnly,
    finalLocatorDrift,
    loginWall,
  ]) {
    assert.throws(
      () => assertStableSourceHealth(sourceId, invalidResult),
      {name: 'AssertionError'},
    );
  }
});
