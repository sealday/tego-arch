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
const documents = await readContentDocuments(contentRoot);
const ledger = JSON.parse(
  await readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8'),
);
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

test('publishes MOD-07 with the approved metadata and scope', () => {
  const document = requiredDocument('MOD-07');
  assert.equal(document.file, 'modeling/mod-07-uml-diagram-selection-guide.mdx');
  assert.equal(document.metadata.slug, '/modeling/mod-07');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.difficulty, 'intermediate');
  assert.equal(document.metadata.priority, 'P0');
  assert.equal(document.metadata.review_policy, 'quarterly-version-sensitive');
  assert.deepEqual(document.metadata.depends_on, ['MOD-01']);
  assert.deepEqual(document.metadata.adjacent_topics, ['MOD-01', 'MOD-03', 'MOD-06']);
  assert.deepEqual(document.metadata.related_cases, [
    '/cases/temporal-saga-durable-execution',
  ]);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );
  assert.match(document.body, /MOD-02[^。\n]*权威/u);
  assert.match(document.body, /本站原创[^。\n]*教学/u);
  assert.match(
    document.body,
    /MOD-02[^。\n]*系统边界[^。\n]*员工名称；审批人和财务人员[^。\n]*本站原创[^。\n]*教学假设/u,
  );
});

test('routes one review question to exactly five UML choices', () => {
  const graph = fencedBlock(requiredDocument('MOD-07').body, 'mermaid');
  assert.match(graph, /^flowchart TD$/mu);
  const expected = [
    'Q["当前评审问题观察什么？"]',
    'U["参与者与目标<br/>use case"]',
    'S["单场景交互顺序<br/>sequence"]',
    'T["单对象生命周期<br/>state"]',
    'C["静态类型与职责<br/>class"]',
    'D["节点与部署单元<br/>deployment"]',
  ];
  for (const literal of expected) assert.ok(graph.includes(literal), literal);
  assert.equal([...graph.matchAll(/^  Q --> [USTCD]$/gmu)].length, 5);
  assert.doesNotMatch(graph, /MOD-08|timeout|compensation/iu);
});

const expectedEvidenceRows = [
  ['use case', '参与者与目标', '参与者、目标、系统边界和外部交互范围', '操作顺序、内部组件、授权已经正确', '业务规则与授权测试'],
  ['sequence', '单场景交互顺序', '消息顺序、参与者、同步点、分支与异常路径', '性能时限、并发安全、所有状态都被覆盖', '追踪、负载与并发测试'],
  ['state', '单对象生命周期', '状态、事件、守卫、转换和终态', '跨对象原子性、组件所有权、分布式一致性', '事务、故障与恢复测试'],
  ['class', '静态类型与职责', '类型、职责、关联、多重性和泛化', '运行时顺序、数据库 schema、对象数量和生命周期事实', '代码、数据模型与运行检查'],
  ['deployment', '节点与部署单元', '节点、执行环境、部署单元和通信路径', '实际库存、容量、故障切换和安全控制已经验证', '资产、容量、演练与安全证据'],
];

test('locks every diagram proof and non-proof boundary', () => {
  const tables = markdownTables(section(requiredDocument('MOD-07').body, '模型产物'));
  assert.equal(tables.length, 1);
  assert.deepEqual(tables[0][0], ['图', '观察对象', '主要证明', '明确不证明', '补充证据']);
  assert.deepEqual(tables[0].slice(2), expectedEvidenceRows);
});

test('uses five independent expense-claim review records without requiring five diagrams', () => {
  const exercise = section(requiredDocument('MOD-07').body, '完整演练');
  for (const label of ['use case', 'sequence', 'state', 'class', 'deployment']) {
    assert.match(exercise, new RegExp(`^### ${label}：`, 'mu'), label);
  }
  for (const label of ['评审问题', '输入事实', '预期判断', '证据缺口']) {
    assert.equal([...exercise.matchAll(new RegExp(`\\*\\*${label}：\\*\\*`, 'gu'))].length, 5);
  }
  assert.match(exercise, /实际评审[^。\n]*最小子集/u);
  assert.match(exercise, /不是[^。\n]*必须维护五张图/u);
});

test('keeps both overflow regions keyboard accessible', () => {
  const body = requiredDocument('MOD-07').body;
  assert.equal([...body.matchAll(/onKeyDown=\{handleHorizontalArrowKey\}/gu)].length, 2);
  assert.equal([...body.matchAll(/tabIndex=\{0\}/gu)].length, 2);
});

test('governs the four pinned MOD-07 sources and exposes their canonical locators', () => {
  const document = requiredDocument('MOD-07');
  const governed = ledger.documents['content/modeling/mod-07-uml-diagram-selection-guide.mdx'];
  const expectedSources = new Map([
    ['src-omg-uml-2-5-1-2017', 'https://www.omg.org/spec/UML/2.5.1'],
    ['src-c4model-dynamic-diagram', 'https://c4model.com/diagrams/dynamic'],
    ['src-c4model-deployment-diagram', 'https://c4model.com/diagrams/deployment'],
    ['src-larman-applying-uml-patterns-3e-2004', 'https://www.pearson.com/en-us/subject-catalog/p/Larman-Applying-UML-and-Patterns-An-Introduction-to-Object-Oriented-Analysis-and-Design-and-Iterative-Development-3rd-Edition/P200000000422/9780131489066'],
  ]);
  const visible = new Set(extractExternalLinks(document));

  assert.ok(governed, 'MOD-07 source review must exist');
  assert.equal(governed.reviewed_at, '2026-08-01');
  assert.deepEqual(governed.copyright_checks, [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ]);
  assert.deepEqual(governed.citations, [
    {source_id: 'src-omg-uml-2-5-1-2017', citation_url: 'https://www.omg.org/spec/UML/2.5.1', roles: ['definition', 'method'], manifest_primary: true, usage_mode: 'facts-summary', attribution_note: 'Unified Modeling Language 2.5.1, Object Management Group', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-c4model-dynamic-diagram', citation_url: 'https://c4model.com/diagrams/dynamic', roles: ['definition', 'method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'C4 Model — Dynamic diagram, Simon Brown', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-c4model-deployment-diagram', citation_url: 'https://c4model.com/diagrams/deployment', roles: ['definition', 'method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'C4 Model — Deployment diagram, Simon Brown', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-larman-applying-uml-patterns-3e-2004', citation_url: 'https://www.pearson.com/en-us/subject-catalog/p/Larman-Applying-UML-and-Patterns-An-Introduction-to-Object-Oriented-Analysis-and-Design-and-Iterative-Development-3rd-Edition/P200000000422/9780131489066', roles: ['historical-context', 'learning'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Applying UML and Patterns, 3rd edition, Craig Larman / Pearson', modification_note: null, excerpt: null, quotation_reviewed: false},
  ]);

  for (const [sourceId, locator] of expectedSources) {
    assert.equal(ledger.sources.find(({id}) => id === sourceId)?.canonical_locator, locator);
    assert.ok(visible.has(locator), locator);
  }
  const omg = ledger.sources.find(({id}) => id === 'src-omg-uml-2-5-1-2017');
  assert.equal(omg.source_kind, 'standard');
  assert.equal(omg.tier, 'primary');
  assert.equal(omg.version, 'UML 2.5.1, formal, December 2017; checked 2026-08-01');
  assert.equal(omg.license, 'LicenseRef-All-Rights-Reserved');
  assert.equal(omg.checked_at, '2026-08-01');
  assert.equal(governed.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
});

test('connects MOD-07 reciprocally without linking unpublished MOD-08', () => {
  const document = requiredDocument('MOD-07');
  const links = new Set(extractInternalLinks(document));
  for (const href of [
    '/modeling',
    '/modeling/mod-01',
    '/modeling/mod-03',
    '/modeling/mod-06',
    '/cases/temporal-saga-durable-execution',
  ]) assert.ok(links.has(href), href);
  assert.ok(!links.has('/modeling/mod-08'));
  assert.match(document.body, /MOD-08[^。\n]*仍未发布/u);

  for (const id of ['MOD-01', 'MOD-03', 'MOD-06']) {
    const peer = requiredDocument(id);
    assert.ok(peer.metadata.adjacent_topics.includes('MOD-07'), `${id} adjacency`);
    assert.ok(extractInternalLinks(peer).includes('/modeling/mod-07'), `${id} visible link`);
  }
});

test('projects the Stage A counts while MOD-07 remains pending', async () => {
  const [status, indexes] = await Promise.all([
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 7, total: 20, current: 'G008'},
    completed_topics: 45,
    content_documents: 88,
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
  assert.equal(topicsById.get('MOD-07').published, true);
  assert.equal(topicsById.get('MOD-07').status.value, 'pending');
});
