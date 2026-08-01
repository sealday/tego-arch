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

function requiredSlug(slug) {
  const document = documents.find(({metadata}) => metadata.slug === slug);
  assert.ok(document, `${slug} must be published`);
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

function markdownTables(body) {
  const lines = body.split('\n');
  const tables = [];
  let current = [];
  for (const line of lines) {
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

function fencedBlock(body, language) {
  const matches = [...body.matchAll(
    new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'gu'),
  )];
  assert.equal(matches.length, 1, `expected exactly one ${language} block`);
  return matches[0][1];
}

function horizontalArrowEvent({
  key = 'ArrowRight',
  clientWidth = 100,
  scrollWidth = 300,
  scrollLeft = 80,
  childTarget = false,
  ...modifiers
} = {}) {
  const region = {clientWidth, scrollWidth, scrollLeft};
  let defaultPrevented = false;
  return {
    event: {
      key,
      currentTarget: region,
      target: childTarget ? {} : region,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      ...modifiers,
      preventDefault() {
        defaultPrevented = true;
      },
    },
    region,
    wasDefaultPrevented: () => defaultPrevented,
  };
}

test('publishes MOD-06 with the approved scope and metadata', () => {
  const document = requiredDocument('MOD-06');
  assert.equal(
    document.file,
    'modeling/mod-06-er-model-relationship-boundaries.mdx',
  );
  assert.equal(document.metadata.slug, '/modeling/mod-06');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.priority, 'P0');
  assert.deepEqual(document.metadata.depends_on, ['MOD-05']);
  assert.deepEqual(document.metadata.adjacent_topics, [
    'MOD-01',
    'MOD-05',
    'MOD-07',
    'PR-13',
  ]);
  assert.deepEqual(document.metadata.related_cases, [
    '/cases/temporal-saga-durable-execution',
  ]);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );
  assert.match(document.body, /MOD-02[^。\n]*权威/u);
  assert.match(document.body, /本站原创[^。\n]*教学/u);
});

test('renders exactly the approved six-entity seven-relation ER model', () => {
  const body = requiredDocument('MOD-06').body;
  const graph = fencedBlock(body, 'mermaid');
  assert.match(graph, /^erDiagram$/mu);
  for (const entity of [
    'Employee',
    'OrganizationalUnit',
    'EmployeeOrgAssignment',
    'ExpenseClaim',
    'Approval',
    'PaymentInstruction',
  ]) {
    assert.match(graph, new RegExp(`^  ${entity} \\{`, 'mu'), entity);
  }
  const relations = graph
    .split('\n')
    .filter((line) => /^\s+\w+\s+[|}{o.]{2}--[|}{o.]{2}\s+\w+\s+:/u.test(line));
  assert.equal(relations.length, 7);
  for (const literal of [
    'Employee ||--o{ ExpenseClaim : submits',
    'ExpenseClaim ||--o{ Approval : receives',
    'Employee ||--o{ Approval : decides',
    'ExpenseClaim ||--o| PaymentInstruction : authorizes',
    'Employee ||--o{ EmployeeOrgAssignment : has',
    'OrganizationalUnit ||--o{ EmployeeOrgAssignment : hosts',
    'EmployeeOrgAssignment ||--o{ ExpenseClaim : anchors',
  ]) {
    assert.ok(graph.includes(literal), literal);
  }
  assert.doesNotMatch(graph, /CREATE TABLE|varchar|btree|index/iu);
});

test('separates identity decisions from graph-external constraint evidence', () => {
  const artifacts = section(requiredDocument('MOD-06').body, '模型产物');
  const tables = markdownTables(artifacts);
  assert.equal(tables.length, 2);
  assert.deepEqual(tables[0][0], ['类别', '判断问题', '费用申报示例', '边界']);
  assert.deepEqual(tables[1][0], ['规则', 'ER 图', '主要表达位置', '仍需验证']);
  for (const label of ['实体', '属性', '值对象', '关联实体']) {
    assert.ok(tables[0].some((row) => row[0] === label), label);
  }
  for (const label of [
    '结构关系与普通基数',
    '业务唯一性',
    '时间区间有效性与不重叠',
    '跨实体一致性',
    '状态前置条件',
    '并发、迁移与性能',
  ]) {
    assert.ok(tables[1].some((row) => row[0] === label), label);
  }
});

test('makes every MOD-06 overflow region explicitly keyboard-scrollable', () => {
  const body = requiredDocument('MOD-06').body;
  assert.match(
    body,
    /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u,
  );
  assert.equal(
    [...body.matchAll(/onKeyDown=\{handleHorizontalArrowKey\}/gu)].length,
    3,
  );
});

test('scrolls a directly focused overflow region by 40px and clamps bounds', () => {
  for (const [key, initial, expected] of [
    ['ArrowRight', 80, 120],
    ['ArrowLeft', 80, 40],
    ['ArrowLeft', 20, 0],
    ['ArrowRight', 190, 200],
  ]) {
    const probe = horizontalArrowEvent({key, scrollLeft: initial});
    handleHorizontalArrowKey(probe.event);
    assert.equal(probe.region.scrollLeft, expected, `${key} from ${initial}`);
    assert.equal(probe.wasDefaultPrevented(), true, `${key} prevents default`);
  }
});

test('leaves unrelated keyboard input and non-overflow regions untouched', () => {
  const probes = [
    horizontalArrowEvent({key: 'Enter'}),
    horizontalArrowEvent({clientWidth: 300, scrollWidth: 300}),
    horizontalArrowEvent({childTarget: true}),
    ...['altKey', 'ctrlKey', 'metaKey', 'shiftKey'].map((modifier) => (
      horizontalArrowEvent({[modifier]: true})
    )),
  ];

  for (const probe of probes) {
    handleHorizontalArrowKey(probe.event);
    assert.equal(probe.region.scrollLeft, 80);
    assert.equal(probe.wasDefaultPrevented(), false);
  }
});

test('defines effective-dated relationship history without claiming bitemporal storage', () => {
  const body = requiredDocument('MOD-06').body;
  for (const pattern of [
    /\[validFrom, validTo\)/u,
    /validTo[^。\n]*为空[^。\n]*仍有效/u,
    /validTo[^。\n]*晚于[^。\n]*validFrom/u,
    /同一员工[^。\n]*主要组织归属[^。\n]*不得重叠/u,
    /提交时间[^。\n]*归属[^。\n]*有效期/u,
    /申报员工[^。\n]*归属[^。\n]*员工[^。\n]*一致/u,
    /关闭旧区间[^。\n]*增加新记录/u,
  ]) {
    assert.match(body, pattern);
  }
  for (const label of ['当前状态', '有效期', '审计记录', '事件日志']) {
    assert.match(body, new RegExp(label, 'u'), label);
  }
  assert.match(body, /不(?:是|包含)[^。\n]*双时态/u);
  assert.match(body, /不(?:是|采用)[^。\n]*Event Sourcing/u);
});

test('governs the exact pinned MOD-06 source set', () => {
  const document = requiredDocument('MOD-06');
  const links = new Set(extractExternalLinks(document));
  const requiredSources = new Map([
    [
      'src-ibm-ida-logical-data-model-9-1-1',
      'https://www.ibm.com/docs/en/ida/9.1.1?topic=modeling-logical-data-models',
    ],
    [
      'src-mermaid-er-diagram-11-16-0',
      'https://github.com/mermaid-js/mermaid/blob/mermaid%4011.16.0/packages/mermaid/src/docs/syntax/entityRelationshipDiagram.md',
    ],
    [
      'src-postgresql-18-constraints',
      'https://www.postgresql.org/docs/18/ddl-constraints.html',
    ],
    [
      'src-postgresql-18-range-types',
      'https://www.postgresql.org/docs/18/rangetypes.html',
    ],
  ]);
  for (const [id, locator] of requiredSources) {
    const source = ledger.sources.find((candidate) => candidate.id === id);
    assert.ok(source, id);
    assert.equal(source.canonical_locator, locator);
    assert.equal(source.transport_locator, locator);
    assert.equal(source.tier, 'primary');
    assert.equal(source.checked_at, '2026-07-31');
    assert.ok(links.has(locator), locator);
  }
  assert.match(document.body, /Mermaid[^。\n]*11\.16\.0/u);
  assert.match(document.body, /PostgreSQL 18/u);
  assert.match(document.body, /Mermaid[^。\n]*(?:语法|渲染工具)[^。\n]*(?:不是|不作为)[^。\n]*(?:理论|标准)/u);
  assert.match(document.body, /官方文档[^。\n]*不支持[^。\n]*费用申报/u);
});

test('publishes only the approved MOD-06 relationships and reciprocal links', () => {
  const document = requiredDocument('MOD-06');
  const links = new Set(extractInternalLinks(document));
  for (const slug of [
    '/modeling',
    '/modeling/mod-01',
    '/modeling/mod-02',
    '/modeling/mod-05',
    '/modeling/mod-07',
    '/principles/pr-13',
    '/cases/temporal-saga-durable-execution',
  ]) {
    assert.ok(links.has(slug), slug);
  }
  for (const slug of ['/modeling/mod-08']) {
    assert.equal(links.has(slug), false, slug);
  }
  assert.match(document.body, /MOD-08[^。\n]*尚未发布/u);

  for (const id of ['MOD-01', 'MOD-05', 'PR-13']) {
    const peer = requiredDocument(id);
    assert.ok(peer.metadata.adjacent_topics.includes('MOD-06'), id);
    assert.ok(
      new Set(extractInternalLinks(peer)).has('/modeling/mod-06'),
      `${id} visible MOD-06 link`,
    );
  }
  assert.ok(
    new Set(extractInternalLinks(requiredSlug(
      '/cases/temporal-saga-durable-execution',
    ))).has('/modeling/mod-06'),
  );
});
