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
      canonical_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
      expected_final_transport_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
      license: 'LicenseRef-All-Rights-Reserved',
      copyright_policy: 'facts-and-short-quotation',
    },
  ],
  [
    'src-sap-powerdesigner-physical-model-16-7-sp10',
    {
      canonical_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
      expected_final_transport_locator: 'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
      license: 'LicenseRef-All-Rights-Reserved',
      copyright_policy: 'facts-and-short-quotation',
    },
  ],
  [
    'src-ibm-ida-logical-data-model-9-1-1',
    {
      canonical_locator: 'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
      expected_final_transport_locator: 'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
      license: 'LicenseRef-All-Rights-Reserved',
      copyright_policy: 'facts-and-short-quotation',
    },
  ],
  [
    'src-postgresql-18-constraints',
    {
      canonical_locator: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
      expected_final_transport_locator: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
      license: 'PostgreSQL',
      copyright_policy: 'adapt-with-attribution',
    },
  ],
  [
    'src-postgresql-18-indexes',
    {
      canonical_locator: 'https://www.postgresql.org/docs/current/indexes.html',
      expected_final_transport_locator: 'https://www.postgresql.org/docs/current/indexes.html',
      license: 'PostgreSQL',
      copyright_policy: 'adapt-with-attribution',
    },
  ],
]);
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

function parseMermaidEdges(source) {
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
  for (const line of source.split('\n').slice(1).filter((value) => value.trim())) {
    const match = line.match(edgePattern);
    assert.ok(match, `illegal Mermaid edge: ${line.trim()}`);
    const [
      ,
      fromId,
      fromLabel,
      solidConnector,
      ,
      dottedConnector,
      ,
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
    edges.push(`${nodeLabels.get(fromId)} -> ${nodeLabels.get(toId)}`);
  }
  assert.equal(new Set(edges).size, edges.length, 'duplicate Mermaid edge');
  return edges.sort();
}

function assertMermaidSemantics(source) {
  const expectedEdges = [
    '业务概念 -> 逻辑实体',
    '逻辑实体 -> 可移植关系模式',
    '可移植关系模式 -> 物理实现切片',
    '物理实现切片 -> 验证缺口',
    '本站教学假设 -> 逻辑实体',
    '本站教学假设 -> 可移植关系模式',
    '未知项 -> 物理实现切片',
    '未知项 -> 验证缺口',
  ].sort();
  assert.deepEqual(parseMermaidEdges(source), expectedEdges);
}

function assertMappingWording(source) {
  assert.match(source, /映射并澄清词义/u);
  assert.doesNotMatch(source, /先执行/u);
  assert.match(source, /箭头表示层次间映射或新增决定，不表示运行时序/u);
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
}

function assertSourceGovernance(source) {
  const expected = expectedSourceGovernance.get(source.id);
  assert.ok(expected, `unexpected governed source: ${source.id}`);
  assert.deepEqual(
    {
      canonical_locator: source.canonical_locator,
      expected_final_transport_locator:
        source.expected_final_transport_locator,
      license: source.license,
      copyright_policy: source.copyright_policy,
    },
    expected,
  );
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
  assert.deepEqual(document.metadata.adjacent_topics, ['MOD-04', 'PR-13']);
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

  for (const forbiddenMutation of [
    body.replace(
      '可移植关系模式不是严格意义上的完整物理模型',
      '可移植关系模式就是已验证物理模型',
    ),
    body.replace('本站原创的教学假设', '生产事实'),
    body.replace('索引候选不证明性能', '索引保证性能'),
  ]) {
    assert.throws(
      () => assertDataModelBoundaries(forbiddenMutation),
      {name: 'AssertionError'},
    );
  }
});

test('uses only published relationships and leaves MOD-06 unlinked', () => {
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
  assert.equal(links.has('/modeling/mod-06'), false);
  assert.match(document.body, /MOD-06[^。\n]*尚未发布/u);
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
    assertMermaidSemantics(
      mermaid.replace('-->|映射并澄清词义|', '-->'),
    )
  );
  assert.doesNotThrow(() =>
    assertMermaidSemantics([lines[0], ...lines.slice(1).reverse()].join('\n'))
  );
  for (const invalidMutation of [
    mermaid.replace('-->', '==>'),
    `${mermaid}\n${lines[1]}`,
    lines.filter((_, index) => index !== 1).join('\n'),
  ]) {
    assert.throws(
      () => assertMermaidSemantics(invalidMutation),
      {name: 'AssertionError'},
    );
  }
  assert.throws(
    () => assertMappingWording(body.replace('映射并澄清词义', '先执行')),
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
    review.citations.map(({source_id, citation_url}) => [
      source_id,
      citation_url,
    ]),
    [...expectedSourceGovernance]
      .map(([sourceId, {canonical_locator}]) => [
        sourceId,
        canonical_locator,
      ]),
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
  }
  const authorDerivedFalsePositive = {
    ...governedSources.find(({id}) => id === 'src-postgresql-18-indexes'),
    author_or_org: 'SAP',
    license: 'LicenseRef-All-Rights-Reserved',
    copyright_policy: 'facts-and-short-quotation',
  };
  assert.throws(
    () => assertSourceGovernance(authorDerivedFalsePositive),
    {name: 'AssertionError'},
  );

  for (const sourceId of expectedSourceGovernance.keys()) {
    const results = linkHealth.results.filter(({source_ids}) =>
      source_ids.includes(sourceId)
    );
    assert.equal(results.length, 1, `${sourceId} exact link-health association`);
    assertStableSourceHealth(sourceId, results[0]);
  }
  assert.equal(ledger.sources.length, 473);
});

test('projects the exact G008 Batch 3 Stage A repository state', () => {
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 7, total: 20, current: 'G008'},
    completed_topics: 43,
    content_documents: 86,
    governed_sources: 473,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assert.match(backlog, /^- \[ \] \*\*MOD-05 /mu);
  assert.match(backlog, /下一项[^。\n]*MOD-05/u);
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

  for (const invalidResult of [
    authRequired,
    extraAssociation,
    redirectOnly,
    finalLocatorDrift,
  ]) {
    assert.throws(
      () => assertStableSourceHealth(sourceId, invalidResult),
      {name: 'AssertionError'},
    );
  }
});
