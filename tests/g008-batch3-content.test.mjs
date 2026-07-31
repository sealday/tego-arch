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
const requiredSources = new Map([
  [
    'src-sap-powerdesigner-data-modeling-16-7-sp10',
    'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2bf926e1b1014a7c7c75eb751dd6e.html',
  ],
  [
    'src-sap-powerdesigner-physical-model-16-7-sp10',
    'https://help.sap.com/docs/SAP_POWERDESIGNER/856348b84a7c479489d5172a630f014d/c7c2e0646e1b1014b15599cfaffb4f4a.html',
  ],
  [
    'src-ibm-ida-logical-data-model-9-1-1',
    'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
  ],
  [
    'src-postgresql-18-constraints',
    'https://www.postgresql.org/docs/current/ddl-constraints.html',
  ],
  [
    'src-postgresql-18-indexes',
    'https://www.postgresql.org/docs/current/indexes.html',
  ],
]);
const expectedMappingRows = [
  ['层次', '回答的问题', '费用申报示例', '新增决定', '明确不证明'],
  ['概念模型', '业务中有哪些事物与词义', '员工、费用申报、审批、付款', '概念边界与业务关系', '实体键、基数、表结构或流程顺序'],
  ['逻辑模型', '实体如何识别、关联并受约束', 'Employee、ExpenseClaim、Approval、PaymentInstruction', '唯一标识、属性、关系、基数与业务约束', 'SQL 表已设计或查询性能达标'],
  ['可移植关系模式', '逻辑实体如何映射为关系结构', 'employee、expense_claim、approval、payment_instruction', '表、PK/FK、唯一性、类型族和索引候选', '严格意义上的 DBMS 物理模型或可部署 schema'],
  ['PostgreSQL 18 物理实现切片', '平台如何落实约束与访问路径', 'PostgreSQL 约束、类型与索引类别', '实际约束类别、类型选择和索引候选', '完整生产 DDL、容量、迁移安全或性能结果'],
];
const expectedMermaid = `flowchart LR
  C["业务概念"] -->|映射并澄清词义| L["逻辑实体"]
  L -->|加入身份、关系与约束| R["可移植关系模式"]
  R -->|选择 PostgreSQL 18| P["物理实现切片"]
  P -->|需要迁移与运行证据| V["验证缺口"]
  A["本站教学假设"] -.标注字段、键与索引.-> L
  A -.标注表与类型候选.-> R
  U["未知项"] -.保留查询与容量事实.-> P
  U -.保留性能与迁移结果.-> V`;
const [documents, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8')
    .then(JSON.parse),
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

test('keeps the portable schema distinct from a DBMS physical model', () => {
  const body = requiredDocument('MOD-05').body;
  assert.match(body, /可移植关系模式[^。\n]*(?:不等于|不是)[^。\n]*(?:严格|完整)[^。\n]*物理模型/u);
  assert.match(body, /PostgreSQL 18[^。\n]*(?:切片|示例)/u);
  assert.match(body, /不是[^。\n]*(?:生产 schema|生产数据库|可部署 schema)/u);
  assert.match(body, /本站原创[^。\n]*教学/u);
  assert.doesNotMatch(body, /CREATE\s+TABLE/iu);
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

test('locks the single mapping table and Mermaid topology', () => {
  const artifacts = section(requiredDocument('MOD-05').body, '模型产物');
  assert.equal(
    [...artifacts.matchAll(/table-wrapper--mapping/gu)].length,
    1,
    'expected exactly one primary mapping table',
  );
  assert.deepEqual(markdownTableRows(artifacts), expectedMappingRows);

  const mermaid = fencedBlock(artifacts, 'mermaid');
  assert.equal(mermaid, expectedMermaid);
  assert.equal(
    mermaid.split('\n').filter((line) => /(?:-->|-\.)(?:[^>]*->)?/u.test(line)).length,
    8,
  );
});

test('governs exactly the five visible MOD-05 official sources', () => {
  const document = requiredDocument('MOD-05');
  assert.deepEqual(
    extractExternalLinks(document),
    [...requiredSources.values()],
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
    [...requiredSources],
  );

  const governedSources = ledger.sources
    .filter(({id}) => requiredSources.has(id))
    .map(({id, canonical_locator}) => [id, canonical_locator]);
  assert.deepEqual(governedSources, [...requiredSources]);
});
