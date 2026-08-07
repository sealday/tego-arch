import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {
  validateInventoryLedgerConsistency,
  validateSourceLicenseInventory,
} from '../scripts/validate-source-license-inventory.mjs';

const [ledger, linkHealth, licenseInventory] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
]);

const [manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const licenseScope = 'The named article/page and bibliographic facts only; prose, code, diagrams, images, marks, comments, linked works, and third-party material excluded';
const migrationPolicy = 'Facts summary and reviewed short quotation only; no adaptation or copied structure';

test('projects Stage B after closing STY-02 without activating STY-03', () => {
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  assert.equal(topics.get('STY-02')?.published, true);
  assert.equal(topics.get('STY-02')?.status.value, 'complete');
  assert.deepEqual(topics.get('STY-02')?.primary_sources, [
    'https://alistair.cockburn.us/hexagonal-architecture/',
    'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
  ]);
  assert.equal(topics.get('STY-03')?.published, false);
  assert.equal(topics.get('STY-03')?.status.value, 'pending');
  assert.equal(projectStatus.completed_topics, 55);
  assert.equal(projectStatus.content_documents, 97);
  assert.equal(projectStatus.governed_sources, 506);
  assert.equal(publicLedger.sources.length, 506);
  assert.ok(indexes.style.some(({id, status}) => id === 'STY-02' && status.value === 'complete'));
});

const expectedNewSources = new Map([
  ['src-cockburn-hexagonal-architecture-2005', {
    canonical_locator: 'https://alistair.cockburn.us/hexagonal-architecture/',
    transport_locator: 'https://alistair.cockburn.us/hexagonal-architecture/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'Hexagonal architecture the original 2005 article',
    author_or_org: 'Alistair Cockburn',
    published_at: '2005-09-04',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'HaT Technical Report 2005.02, version 0.9 dated 2005-09-04; page checked 2026-08-07',
    source_kind: 'paper',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://alistair.cockburn.us/hexagonal-architecture/',
    license_evidence_note: 'The Alistair Cockburn article at https://alistair.cockburn.us/hexagonal-architecture/ was checked on 2026-08-07; the page carries Copyright © Alistair Cockburn 2022 All Rights Reserved and exposes no reusable license for the work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://alistair.cockburn.us/hexagonal-architecture/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the original Ports and Adapters intent, purposeful ports, adapters, primary and secondary actors, and isolated application testing; source diagrams, code structure, and later interpretations are not copied.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://alistair.cockburn.us/hexagonal-architecture',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Approved the 2026-08-07 live 301 normalization from the canonical trailing-slash transport to the author-hosted no-trailing-slash final transport.',
  }],
  ['src-palermo-onion-architecture-part-1', {
    canonical_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    transport_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Onion Architecture : part 1',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-07-29',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2008-07-29; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    license_evidence_note: 'The Jeffrey Palermo article “The Onion Architecture : part 1” at https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/ was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines Onion Architecture scope, inward coupling, the independent Domain Model, core-owned repository interfaces, and external infrastructure; maintenance claims remain attributed author experience.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
  ['src-palermo-onion-architecture-part-3', {
    canonical_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    transport_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Onion Architecture : part 3',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-08-04',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2008-08-04; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    license_evidence_note: 'The Jeffrey Palermo article “The Onion Architecture : part 3” at https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/ was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the four Onion tenets and its contrast with traditional layered dependencies; C#, IoC product recommendations, source diagrams, and universal outcome claims are excluded.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
  ['src-martin-clean-architecture-2012', {
    canonical_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    transport_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Clean Architecture',
    author_or_org: 'Robert C. Martin',
    published_at: '2012-08-13',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2012-08-13; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    license_evidence_note: 'The Robert C. Martin article “The Clean Architecture” at https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the Dependency Rule, Entities, Use Cases, Interface Adapters, Frameworks and Drivers, boundary crossing, and simple boundary data; the source diagram and fixed four-circle layout are not copied or required.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
]);

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const sty02 = documents.find(({file}) => file === 'styles/sty-02-hexagonal-onion-clean.mdx');
const sty01 = documents.find(({file}) => file === 'styles/sty-01-layered-architecture.mdx');
const expectedHeadings = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
const expectedCitationIds = [
  'src-cockburn-hexagonal-architecture-2005',
  'src-palermo-onion-architecture-part-1',
  'src-palermo-onion-architecture-part-3',
  'src-martin-clean-architecture-2012',
  'src-aws-hexagonal-layered-overview',
];

function bodyOf(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '');
}

function internalLinksOf(source) {
  return extractInternalLinks({body: bodyOf(source)});
}

function externalLinksOf(source) {
  return extractExternalLinks({body: bodyOf(source)});
}

function visibleExternalLinksOf(source) {
  return [...source.matchAll(/\]\((https?:\/\/[^)]+)\)/gu)].map(([, locator]) => locator);
}

function assertInOrder(source, values, label) {
  let cursor = -1;
  for (const value of values) {
    const next = source.indexOf(value, cursor + 1);
    assert.ok(next > cursor, `${label}: ${value}`);
    cursor = next;
  }
}

const expectedLearningQuestions = [
  '三种架构共享哪些依赖和边界不变量，又在哪些命名与推理起点上不同？',
  '同一次提交订单控制流如何在三套术语中保持同一行为？',
  '当运行时调用外部机制时，源码依赖为什么仍能指向内部？',
  '什么情况下迁移成本超过边界隔离带来的价值？',
];

const expectedTerminologyTable = [
  ['关注点', '共同语义', '六边形架构', '洋葱架构', '整洁架构'],
  ['内部核心', '业务策略位于内部，技术机制位于外部', '应用', '领域模型与应用核心', '实体与用例'],
  ['输入边界', '外部驱动方以显式接口发起用例', '驱动端口', '应用接口', '输入边界'],
  ['输出边界', '核心声明所需的外部能力', '被驱动端口', '核心接口', '输出边界或网关'],
  ['外部实现', '技术机制实现内侧合同', '适配器', '基础设施', '接口适配器、框架与驱动程序'],
  ['依赖规则', '源码依赖指向内部或内侧抽象', '适配器依赖端口', '外层依赖内层接口', '源码依赖指向内部'],
  ['主要观察重点', '边界所有权可被检查', '有目的的对话与可替换适配器', '独立对象模型和核心接口', '策略层级、用例和边界数据'],
];

const expectedDecisionTable = [
  ['判断信号', '六边形架构视角', '洋葱架构视角', '整洁架构视角', '不采用或停止条件'],
  ['端口对话', '按驱动方和被驱动方识别有目的的对话', '只在核心需要能力时定义接口', '用输入与输出边界保护用例', '只有单一稳定入口且替换价值很低'],
  ['核心所有权', '应用不知道适配器技术', '内层定义接口，外层实现', '高层策略不提及外层名称', '接口仍由数据库或框架模块拥有'],
  ['策略层级', '不强制固定圈数', '领域模型位于中心', '区分实体与用例', '分层只增加转发而没有独立策略'],
  ['测试', '用测试适配器驱动端口', '核心可脱离基础设施运行', '用例和实体可独立测试', '测试仍必须启动真实用户界面或数据库'],
  ['部署', '不从端口推导部署拓扑', '不从同心层推导故障域', '框架位于外圈不等于独立服务', '目标是独立扩缩或网络隔离却没有额外设计'],
  ['迁移成本', '先包围有变化压力的对话', '把接口所有权移回核心', '在边界转换外部数据', '小型、短生命周期、变化压力低的增删改查应用'],
];

const expectedOrderRestatements = [
  '**六边形架构：** 超文本传输协议客户端、命令行客户端或自动化测试通过驱动适配器和驱动端口调用提交订单；用例通过被驱动端口使用库存和持久化能力，外侧适配器实现这些端口。',
  '**洋葱架构：** 应用服务编排订单领域模型；库存和仓储接口属于应用核心，基础设施在外圈实现并依赖这些接口。',
  '**整洁架构：** 控制器调用输入边界；用例调用实体，并通过输出边界或网关使用库存和持久化机制。',
];

const expectedVisibleSourceOrder = [
  'https://alistair.cockburn.us/hexagonal-architecture/',
  'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
  'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
  'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
  'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html',
];

function sectionBody(source, heading, nextHeading) {
  const start = source.indexOf(`## ${heading}`);
  assert.ok(start >= 0, `${heading} section`);
  const end = nextHeading ? source.indexOf(`## ${nextHeading}`, start + heading.length + 3) : source.length;
  assert.ok(end > start, `${heading} section end`);
  return source.slice(start, end);
}

function markdownTables(source) {
  const tables = [];
  const lines = source.split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\|.*\|$/u.test(lines[index]) || !/^\|(?:\s*:?-+:?\s*\|)+$/u.test(lines[index + 1] ?? '')) continue;
    const rows = [];
    for (; index < lines.length && /^\|.*\|$/u.test(lines[index]); index += 1) {
      if (/^\|(?:\s*:?-+:?\s*\|)+$/u.test(lines[index])) continue;
      rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim()));
    }
    tables.push(rows);
  }
  return tables;
}

function assertExactArticleStructures(source) {
  const learningQuestions = [...sectionBody(source, '学习问题', '组件、连接器与约束')
    .matchAll(/^- (.+？)$/gmu)].map(([, question]) => question);
  assert.ok(learningQuestions.length >= 3 && learningQuestions.length <= 5, 'learning question count');
  assert.deepEqual(learningQuestions, expectedLearningQuestions);
  assert.deepEqual(markdownTables(source), [expectedTerminologyTable, expectedDecisionTable]);

  const comparison = sectionBody(source, '对比案例', '来源');
  const restatements = [...comparison.matchAll(/^- (\*\*(?:六边形架构|洋葱架构|整洁架构)：\*\* .+)$/gmu)]
    .map(([, restatement]) => restatement);
  assert.deepEqual(restatements, expectedOrderRestatements);
  assert.equal((source.match(/同一订单行为和拓扑/gu) ?? []).length, 1, 'one explicit shared order scenario');
  assert.deepEqual(visibleExternalLinksOf(sectionBody(source, '来源')), expectedVisibleSourceOrder);
}

function assertStyleContract(source) {
  assertExactArticleStructures(source);
  assertInOrder(source, ['业务策略位于内部', '技术机制位于外部', '源码依赖指向内部', '显式接口', '简单数据'], 'common kernel');
  assert.match(source, /六边形架构[\s\S]*有目的的对话/u);
  assert.match(source, /洋葱架构[\s\S]*核心[\s\S]*接口/u);
  assert.match(source, /整洁架构[\s\S]*策略层级[\s\S]*边界数据/u);
  assert.match(source, /运行时控制流[\s\S]*源码依赖/u);
  assert.match(source, /接口由需要它的内侧策略拥有/u);
  assert.match(source, /超文本传输协议请求[\s\S]*对象关系映射实体[\s\S]*数据库行[\s\S]*软件开发工具包响应[\s\S]*必须在边界转换[\s\S]*不得进入应用核心/u);
  assert.match(source, /代码边界[\s\S]*不自动[\s\S]*独立部署/u);
  assert.match(source, /小型[\s\S]*短生命周期[\s\S]*增删改查/u);
  assert.match(source, /小型、短生命周期、变化压力低的增删改查应用可能不值得承担接口、映射和组合成本。/u);
  assert.match(source, /修复具体依赖违规/u);
  assert.doesNotMatch(source, /完全等价|三者同义|六边形架构.*→.*洋葱架构.*→.*整洁架构|六个端口|就是源码依赖方向|可以直接进入应用核心/u);
  assert.doesNotMatch(source, /必然降低|必然提升|自动提供独立部署|自动提供故障隔离/u);
  assert.equal((source.match(/table-wrapper--mapping/g) ?? []).length, 2);
  assert.equal((source.match(/architecture-diagram-scroll/g) ?? []).length, 1);
  assert.equal((source.match(/tabIndex=\{0\}/g) ?? []).length, 3);
  assert.equal((source.match(/onKeyDown=\{handleHorizontalArrowKey\}/g) ?? []).length, 3);
  assert.ok(source.includes(
    '<div className="architecture-diagram-scroll" role="region" aria-label="提交订单的控制流与向内源码依赖图，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>',
  ));
  assert.ok(source.includes('/img/diagrams/sty-02-hexagonal-onion-clean-order.svg'));
  for (const locator of [...expectedNewSources.values(), 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html']) {
    const expectedLocator = typeof locator === 'string' ? locator : locator.canonical_locator;
    assert.ok(externalLinksOf(source).includes(expectedLocator), expectedLocator);
  }
  for (const link of ['/styles', '/styles/sty-00', '/styles/sty-01', '/cases/micro-frontends-single-spa']) {
    assert.ok(internalLinksOf(source).includes(link), link);
  }
  assert.ok(!internalLinksOf(source).includes('/styles/sty-03'));
}

const inventoryColumns = [
  'source_family',
  'current_urls',
  'author_or_org',
  'license_evidence_url',
  'license_evidence_note',
  'checked_at',
  'exact_license',
  'scope_exclusions',
  'migration_policy',
  'family_grouping',
  'grouping_evidence_url',
];

const expectedInventoryEntries = [...expectedNewSources.values()].map((source) => ({
  source_family: source.license_family_id,
  current_urls: [source.canonical_locator],
  author_or_org: source.author_or_org,
  license_evidence_url: source.license_evidence_url,
  license_evidence_note: source.license_evidence_note,
  checked_at: source.checked_at,
  exact_license: source.license,
  scope_exclusions: source.license_scope,
  migration_policy: migrationPolicy,
  family_grouping: source.license_family_grouping,
  grouping_evidence_url: 'not-applicable',
}));

function selectFields(record, expected) {
  return Object.fromEntries(Object.keys(expected).map((field) => [field, record?.[field]]));
}

function sourceContractErrors(sources) {
  const records = new Map(sources.map((source) => [source.id, source]));
  const errors = [];
  for (const [id, expected] of expectedNewSources) {
    const record = records.get(id);
    if (!record) {
      errors.push(`${id}: missing record`);
      continue;
    }
    for (const [field, value] of Object.entries(expected)) {
      if (isDeepStrictEqual(record[field], value)) continue;
      errors.push(`${id}: ${field}`);
    }
  }
  return errors;
}

function inventoryTable(entries) {
  const rows = entries.map((entry) => inventoryColumns.map((column) =>
    column === 'current_urls' ? entry.current_urls.join('<br>') : entry[column]));
  return [
    `| ${inventoryColumns.join(' | ')} |`,
    `| ${inventoryColumns.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

test('governs the four original STY-02 sources with complete exact records', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, expected] of expectedNewSources) {
    assert.deepEqual(selectFields(records.get(id), expected), expected, id);
  }
});

test('parses and matches all eleven inventory columns against ledger authority', () => {
  const inventory = validateSourceLicenseInventory(licenseInventory, []);
  const entries = new Map(inventory.entries.map((entry) => [entry.source_family, entry]));
  for (const expected of expectedInventoryEntries) {
    assert.deepEqual(selectFields(entries.get(expected.source_family), expected), expected);
  }

  const focusedInventory = validateSourceLicenseInventory(
    inventoryTable(expectedInventoryEntries),
    expectedInventoryEntries.flatMap(({current_urls}) => current_urls),
  );
  assert.deepEqual(focusedInventory.errors, []);
  assert.deepEqual(
    validateInventoryLedgerConsistency(
      focusedInventory.entries,
      ledger.sources,
      ledger.documents,
    ).errors,
    [],
  );
});

test('rejects copied or non-canonical ARR evidence notes', () => {
  const copied = structuredClone(expectedInventoryEntries);
  copied[2].license_evidence_note = copied[1].license_evidence_note;
  const copiedResult = validateSourceLicenseInventory(
    inventoryTable(copied),
    copied.flatMap(({current_urls}) => current_urls),
  );
  assert.match(copiedResult.errors.join('\n'), /ARR evidence note.*reused|ARR evidence note.*evidence URL/iu);

  const vague = structuredClone(expectedInventoryEntries);
  vague[0].license_evidence_note = 'A unique but non-canonical note about an unavailable reuse license.';
  const vagueResult = validateSourceLicenseInventory(
    inventoryTable(vague),
    vague.flatMap(({current_urls}) => current_urls),
  );
  assert.match(vagueResult.errors.join('\n'), /ARR evidence note.*author/iu);
  assert.match(vagueResult.errors.join('\n'), /ARR evidence note.*evidence URL/iu);
});

test('detects inventory scope drift from authoritative ledger records', () => {
  const drifted = structuredClone(expectedInventoryEntries);
  drifted[0].scope_exclusions = 'The named page only';
  const result = validateInventoryLedgerConsistency(drifted, ledger.sources, ledger.documents);
  assert.match(result.errors.join('\n'), /field "license_scope" differs/iu);
});

test('detects controlled evidence-role and usage-boundary mutations', () => {
  const roleMutation = structuredClone(ledger.sources);
  roleMutation.find(({id}) => id === 'src-palermo-onion-architecture-part-1')
    .allowed_evidence_roles = ['definition', 'historical-context', 'learning'];
  assert.match(sourceContractErrors(roleMutation).join('\n'), /allowed_evidence_roles/u);

  const boundaryMutation = structuredClone(ledger.sources);
  boundaryMutation.find(({id}) => id === 'src-martin-clean-architecture-2012')
    .usage_boundary = 'Generic architecture summary.';
  assert.match(sourceContractErrors(boundaryMutation).join('\n'), /usage_boundary/u);
});

test('bounds the reused AWS source for STY-01 comparison and STY-02 implementation context', () => {
  const record = ledger.sources.find(({id}) => id === 'src-aws-hexagonal-layered-overview');
  assert.equal(record?.canonical_locator, 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html');
  assert.deepEqual(record.allowed_evidence_roles, ['comparison', 'definition', 'implementation', 'learning']);
  assert.match(record.usage_boundary, /STY-01/u);
  assert.match(record.usage_boundary, /STY-02/u);
  assert.match(record.usage_boundary, /AWS-specific/u);
});

test('keeps every new STY-02 transport in the reviewed health cache', () => {
  const results = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  for (const id of expectedNewSources.keys()) {
    const result = results.get(id);
    assert.ok(result, `${id} health result`);
    assert.equal(result.last_attempt.outcome, 'healthy', `${id} current transport`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
  }
});

test('publishes the exact STY-02 metadata and eleven headings', () => {
  assert.ok(sty02);
  const metadata = parseFrontMatter(sty02.source);
  assert.equal(metadata.title, '六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权');
  assert.equal(metadata.slug, '/styles/sty-02');
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'intermediate');
  assert.equal(metadata.analyzed_at, '2026-08-07');
  assert.equal(metadata.source_cutoff, '2026-08-07');
  assert.equal(metadata.confidence, 'high');
  assert.deepEqual(metadata.domains, ['software-architecture']);
  assert.deepEqual(metadata.agent_patterns, []);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, ['maintainability', 'testability', 'deployability']);
  assert.deepEqual(metadata.tags, ['架构风格', '六边形架构', '洋葱架构', '整洁架构', '依赖反转']);
  assert.equal(metadata.summary, '用同一个提交订单案例比较三种架构对质量属性（Quality Attribute）的影响，并保留端口、核心所有权、策略层级和边界数据规则的差异。');
  assert.equal(metadata.topic_id, 'STY-02');
  assert.equal(metadata.priority, 'P0');
  assert.deepEqual(metadata.depends_on, ['STY-00', 'STY-01']);
  assert.deepEqual(metadata.adjacent_topics, ['STY-01']);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(findMarkdownHeadings(sty02.body).map(({text}) => text), expectedHeadings);
});

test('locks the common kernel, vocabulary overlays, order boundary, and non-use conditions', () => {
  assert.ok(sty02);
  assertStyleContract(sty02.source);
});

test('makes STY-01 and STY-02 reciprocal while keeping STY-03 non-actionable', () => {
  assert.ok(sty01);
  assert.ok(sty02);
  assert.ok(parseFrontMatter(sty01.source).adjacent_topics.includes('STY-02'));
  assert.ok(internalLinksOf(sty01.source).includes('/styles/sty-02'));
  assert.ok(parseFrontMatter(sty02.source).adjacent_topics.includes('STY-01'));
  assert.ok(internalLinksOf(sty02.source).includes('/styles/sty-01'));
  assert.ok(!internalLinksOf(sty02.source).includes('/styles/sty-03'));
});

test('records the approved STY-02 citation review', () => {
  const review = ledger.documents['content/styles/sty-02-hexagonal-onion-clean.mdx'];
  assert.ok(review);
  assert.equal(review.reviewed_at, '2026-08-07');
  assert.deepEqual(review.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(review.citations.map(({source_id}) => source_id), expectedCitationIds);
  assert.deepEqual(review.citations.map(({manifest_primary}) => manifest_primary), [true, false, true, true, false]);
  for (const citation of review.citations) {
    assert.equal(citation.usage_mode, 'facts-summary');
    assert.equal(citation.excerpt, null);
    assert.equal(citation.quotation_reviewed, false);
  }
});

test('rejects mutations of the STY-02 decision contract', () => {
  assert.ok(sty02);
  for (const [label, needle, mutated] of [
    ['synonym collapse', '观察视角不同', sty02.source.replace('观察视角不同', '三者完全等价')],
    ['fixed evolution', '不是三个标签之间的迁移', sty02.source.replace('不是三个标签之间的迁移', '六边形架构 → 洋葱架构 → 整洁架构')],
    ['six ports', '六边形的边数没有架构语义', sty02.source.replace('六边形的边数没有架构语义', '六边形代表六个端口')],
    ['outer-owned interface', '接口由需要它的内侧策略拥有', sty02.source.replace('接口由需要它的内侧策略拥有', '仓储接口由数据库适配器拥有')],
    ['control equals dependency', '两种方向不能混为一谈', sty02.source.replace('两种方向不能混为一谈', '运行时控制流就是源码依赖方向')],
    ['ORM crosses boundary', '不得进入应用核心', sty02.source.replace('不得进入应用核心', '可以直接进入应用核心')],
    ['deployment overclaim', '不自动形成独立部署', sty02.source.replace('不自动形成独立部署', '自动提供独立部署')],
    ['missing non-use', '小型、短生命周期、变化压力低的增删改查应用可能不值得承担接口、映射和组合成本。', sty02.source.replace('小型、短生命周期、变化压力低的增删改查应用可能不值得承担接口、映射和组合成本。', '所有应用都值得承担接口、映射和组合成本。')],
    ['STY-03 actionable', null, `${sty02.source}\n[下一个风格](/styles/sty-03)\n`],
    ['removed terminology row', '| 输出边界 |', sty02.source.replace(/^\| 输出边界 \|.*\n/mu, '')],
    ['reordered decision rows', '| 核心所有权 |', sty02.source.replace(/(\| 端口对话 \|.*\n)(\| 核心所有权 \|.*\n)/u, '$2$1')],
    ['altered terminology header', '| 关注点 |', sty02.source.replace('| 关注点 | 共同语义 |', '| 比较项 | 共同语义 |')],
    ['too few learning questions', '- 三种架构共享哪些', sty02.source.replace(/^- 三种架构共享哪些.*\n/mu, '')],
    ['too many learning questions', null, sty02.source.replace('## 组件、连接器与约束', '- 是否还有第五个问题？\n- 是否还有第六个问题？\n\n## 组件、连接器与约束')],
    ['reordered visible sources', '阿利斯泰尔·科伯恩', sty02.source.replace(/(\[阿利斯泰尔·科伯恩[^\n]+?。)(\[杰弗里·帕勒莫的洋葱架构第一部分[^\n]+?。)/u, '$2$1')],
    ['changed Clean restatement', '**整洁架构：**', sty02.source.replace('**整洁架构：** 控制器调用输入边界', '**整洁架构：** 控制器直接调用数据库')],
  ]) {
    if (needle) assert.equal(sty02.source.split(needle).length - 1, 1, `${label} mutation needle count`);
    assert.notEqual(mutated, sty02.source, `${label} mutation must change source`);
    assert.throws(() => assertStyleContract(mutated), {name: 'AssertionError'});
  }
});

const diagramSourceUrl = new URL('../diagrams/sty-02-hexagonal-onion-clean-order.drawio', import.meta.url);
const diagramSvgUrl = new URL('../static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg', import.meta.url);
const requiredDiagramLabels = [
  '外部驱动方', '应用核心', '外部机制',
  'HTTP / CLI / 自动化测试', '输入适配器', '输入端口', '提交订单用例', '订单领域规则',
  '库存端口', '订单仓储端口', '库存服务适配器', '数据库适配器',
  'Driving Adapter / UI Edge / Controller',
  'Driving Port / Application Interface / Input Boundary',
  'Use Case / Application Service / Interactor',
  'Domain Model / Entity Policy',
  'Driven Port / Core Interface / Output Gateway',
  'Driven Adapter / Infrastructure / Interface Adapter',
  '运行时控制流', '源码依赖指向内侧接口', '术语映射用于对照，不表示节点完全等价',
];

const expectedDiagramNodeLabels = new Map([
  ['n-driver', ['HTTP / CLI / 自动化测试', null]],
  ['n-input-adapter', ['输入适配器', 'Driving Adapter / UI Edge / Controller']],
  ['n-input-port', ['输入端口', 'Driving Port / Application Interface / Input Boundary']],
  ['n-usecase', ['提交订单用例', 'Use Case / Application Service / Interactor']],
  ['n-domain', ['订单领域规则', 'Domain Model / Entity Policy']],
  ['n-inventory-port', ['库存端口', 'Driven Port / Core Interface / Output Gateway']],
  ['n-order-port', ['订单仓储端口', 'Driven Port / Core Interface / Output Gateway']],
  ['n-inventory-adapter', ['库存服务适配器', 'Driven Adapter / Infrastructure / Interface Adapter']],
  ['n-database-adapter', ['数据库适配器', 'Driven Adapter / Infrastructure / Interface Adapter']],
]);

const expectedDiagramEdgeLabels = new Map([
  ['c1', '提交'],
  ['c2', '调用输入边界'],
  ['c8', '进入用例'],
  ['c3', '执行业务判断'],
  ['c4', '查询库存'],
  ['c5', '调用外部能力'],
  ['c6', '保存订单'],
  ['c7', '调用持久化'],
]);

test('publishes the synchronized STY-02 Draw.io and SVG pair', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  for (const label of requiredDiagramLabels) {
    assert.ok(drawio.includes(label), `Draw.io label: ${label}`);
    assert.ok(visibleXmlText(svg).includes(label), `SVG visible label: ${label}`);
  }
  assert.match(svg, /viewBox="0 0 1200 760"/u);
  assert.doesNotMatch(svg, /<svg[^>]+(?:width|height)="[0-9]/u);
  assert.match(svg, /role="img"/u);
  assert.match(svg, /aria-labelledby="diagram-title diagram-description"/u);
});

function parseXmlAttributes(fragment) {
  return Object.fromEntries(
    [...fragment.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, name, value]) => [name, value]),
  );
}

function xmlElements(xml, name) {
  return [...xml.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gu'))]
    .map(([fragment]) => parseXmlAttributes(fragment));
}

function drawioCells(drawio) {
  return new Map(xmlElements(drawio, 'mxCell').map((cell) => [cell.id, cell]));
}

function drawioGeometries(drawio) {
  const geometries = new Map();
  for (const match of drawio.matchAll(/<mxCell\b([^>]*)>\s*<mxGeometry\b([^>]*)\/>/gu)) {
    const cell = parseXmlAttributes(match[1]);
    const geometry = parseXmlAttributes(match[2]);
    geometries.set(cell.id, ['x', 'y', 'width', 'height'].map((field) => Number(geometry[field])));
  }
  return geometries;
}

function svgElementsById(svg, name, idAttribute) {
  return new Map(xmlElements(svg, name).map((element) => [element[idAttribute], element]));
}

function visibleXmlText(fragment) {
  return fragment
    .replace(/<[^>]+>/gu, '')
    .replace(/&amp;/gu, '&')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/\s+/gu, ' ')
    .trim();
}

function svgVisibleNodeLabels(svg) {
  return new Map([...svg.matchAll(/<g\b([^>]*\bdata-node-id="[^"]+"[^>]*)>([\s\S]*?)<\/g>/gu)]
    .map(([, attributes, body]) => {
      const id = parseXmlAttributes(attributes)['data-node-id'];
      return [id, visibleXmlText(body.match(/<text\b[\s\S]*?<\/text>/gu)?.join(' ') ?? '')];
    }));
}

function svgVisibleEdgeLabels(svg) {
  return new Map([...svg.matchAll(/<text\b([^>]*\bdata-edge-id="[^"]+"[^>]*)>([\s\S]*?)<\/text>/gu)]
    .map(([, attributes, body]) => [parseXmlAttributes(attributes)['data-edge-id'], visibleXmlText(body)]));
}

function assertExactDiagramLabels(drawio, svg) {
  const cells = drawioCells(drawio);
  const svgNodes = svgVisibleNodeLabels(svg);
  for (const [id, [title, role]] of expectedDiagramNodeLabels) {
    assert.equal(cells.get(id)?.value, title, `${id} Draw.io title`);
    assert.equal(role ? cells.get(`${id}-role`)?.value : undefined, role ?? undefined, `${id} Draw.io role`);
    assert.equal(svgNodes.get(id), [title, role].filter(Boolean).join(' '), `${id} SVG visible text`);
  }
  const svgEdges = svgVisibleEdgeLabels(svg);
  for (const [id, label] of expectedDiagramEdgeLabels) {
    assert.equal(cells.get(id)?.value, label, `${id} Draw.io visible label`);
    assert.equal(svgEdges.get(id), label, `${id} SVG visible label`);
  }
  assert.deepEqual([...svgEdges.keys()].sort(), [...expectedDiagramEdgeLabels.keys()].sort(), 'SVG visible edge-label IDs');
}

function svgNodeShapes(svg) {
  return new Map([...svg.matchAll(/<g\b([^>]*\bdata-node-id="[^"]+"[^>]*)>[\s\S]*?<path\b([^>]*)\/>/gu)]
    .map((match) => {
      const group = parseXmlAttributes(match[1]);
      return [group['data-node-id'], parseXmlAttributes(match[2])];
    }));
}

function svgPathBounds(pathData) {
  const tokens = pathData.match(/[MHVQZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const points = [];
  let cursor = 0;
  let command;
  let x = 0;
  let y = 0;
  while (cursor < tokens.length) {
    if (/^[MHVQZ]$/u.test(tokens[cursor])) command = tokens[cursor++];
    if (command === 'M') {
      x = Number(tokens[cursor++]); y = Number(tokens[cursor++]); points.push([x, y]); command = 'L';
    } else if (command === 'H') {
      x = Number(tokens[cursor++]); points.push([x, y]);
    } else if (command === 'V') {
      y = Number(tokens[cursor++]); points.push([x, y]);
    } else if (command === 'Q') {
      const controlX = Number(tokens[cursor++]); const controlY = Number(tokens[cursor++]);
      x = Number(tokens[cursor++]); y = Number(tokens[cursor++]);
      points.push([controlX, controlY], [x, y]);
    } else if (command === 'Z') {
      command = undefined;
    } else {
      assert.fail(`unsupported SVG path command in ${pathData}`);
    }
  }
  const xs = points.map(([pointX]) => pointX);
  const ys = points.map(([, pointY]) => pointY);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}

function svgMarker(svg, id) {
  const match = svg.match(new RegExp(`<marker\\b([^>]*\\bid="${id}"[^>]*)>([\\s\\S]*?)<\\/marker>`, 'u'));
  assert.ok(match, `${id} marker`);
  const pathMatch = match[2].match(/<path\b([^>]*)\/>/u);
  assert.ok(pathMatch, `${id} marker path`);
  return {attributes: parseXmlAttributes(match[1]), path: parseXmlAttributes(pathMatch[1])};
}

function parsePathEndpoint(pathData) {
  const coordinates = [...pathData.matchAll(/([HV])(-?\d+(?:\.\d+)?)/gu)];
  assert.ok(coordinates.length > 0, `path coordinates: ${pathData}`);
  let [x, y] = pathData.match(/^M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/u)
    .slice(1).map(Number);
  for (const [, axis, value] of coordinates) {
    if (axis === 'H') x = Number(value);
    else y = Number(value);
  }
  return {x, y};
}

function orthogonalPathPoints(pathData) {
  const tokens = pathData.match(/[MHV]|-?\d+(?:\.\d+)?/gu) ?? [];
  const points = [];
  let cursor = 0;
  let command;
  let x;
  let y;
  while (cursor < tokens.length) {
    if (/^[MHV]$/u.test(tokens[cursor])) command = tokens[cursor++];
    if (command === 'M') {
      x = Number(tokens[cursor++]); y = Number(tokens[cursor++]); points.push({x, y});
    } else if (command === 'H') {
      x = Number(tokens[cursor++]); points.push({x, y});
    } else if (command === 'V') {
      y = Number(tokens[cursor++]); points.push({x, y});
    } else {
      assert.fail(`unsupported orthogonal path command in ${pathData}`);
    }
  }
  return points;
}

function hasCollinearSegmentOverlap(firstPath, secondPath) {
  const segments = (pathData) => {
    const points = orthogonalPathPoints(pathData);
    return points.slice(1).map((point, index) => [points[index], point]);
  };
  for (const [a, b] of segments(firstPath)) {
    for (const [c, d] of segments(secondPath)) {
      if (a.y === b.y && c.y === d.y && a.y === c.y) {
        if (Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) < Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x))) return true;
      }
      if (a.x === b.x && c.x === d.x && a.x === c.x) {
        if (Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) < Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))) return true;
      }
    }
  }
  return false;
}

const plannedDiagramGeometries = new Map([
  ['b-driver', [30, 100, 220, 520]],
  ['b-core', [400, 70, 550, 620]],
  ['b-mechanism', [980, 100, 190, 520]],
  ['n-driver', [45, 300, 190, 130]],
  ['n-input-adapter', [260, 265, 135, 210]],
  ['n-input-port', [430, 130, 270, 145]],
  ['n-usecase', [430, 355, 270, 130]],
  ['n-domain', [430, 555, 270, 120]],
  ['n-inventory-port', [710, 135, 230, 160]],
  ['n-order-port', [710, 455, 230, 160]],
  ['n-inventory-adapter', [985, 155, 180, 210]],
  ['n-database-adapter', [985, 400, 180, 210]],
]);

const plannedDiagramRelations = new Map([
  ['c1', ['n-driver', 'n-input-adapter']],
  ['c2', ['n-input-adapter', 'n-input-port']],
  ['c8', ['n-input-port', 'n-usecase']],
  ['c3', ['n-usecase', 'n-domain']],
  ['c4', ['n-usecase', 'n-inventory-port']],
  ['c5', ['n-inventory-port', 'n-inventory-adapter']],
  ['c6', ['n-usecase', 'n-order-port']],
  ['c7', ['n-order-port', 'n-database-adapter']],
  ['d1', ['n-input-adapter', 'n-input-port']],
  ['d2', ['n-inventory-adapter', 'n-inventory-port']],
  ['d3', ['n-database-adapter', 'n-order-port']],
]);

function assertExactDiagramInventory(drawio, svg) {
  const cells = drawioCells(drawio);
  const svgNodes = svgVisibleNodeLabels(svg);
  const svgBoundaries = svgElementsById(svg, 'path', 'data-boundary-id');
  const svgEdges = svgElementsById(svg, 'path', 'data-edge-id');
  const expectedNodeIds = [...plannedDiagramGeometries.keys()].filter((id) => id.startsWith('n-')).sort();
  const expectedBoundaryIds = [...plannedDiagramGeometries.keys()].filter((id) => id.startsWith('b-')).sort();
  const expectedRelationIds = [...plannedDiagramRelations.keys()].sort();
  const drawioNodeIds = [...cells.values()]
    .filter(({id, vertex}) => vertex === '1' && /^n-/u.test(id) && !id.endsWith('-role'))
    .map(({id}) => id)
    .sort();
  const drawioBoundaryIds = [...cells.values()]
    .filter(({id, vertex}) => vertex === '1' && /^b-/u.test(id))
    .map(({id}) => id)
    .sort();
  const drawioRelationIds = [...cells.values()]
    .filter(({edge}) => edge === '1')
    .map(({id}) => id)
    .sort();

  assert.deepEqual(drawioNodeIds, expectedNodeIds, 'Draw.io semantic node IDs');
  assert.deepEqual([...svgNodes.keys()].filter(Boolean).sort(), expectedNodeIds, 'SVG semantic node IDs');
  assert.deepEqual(drawioBoundaryIds, expectedBoundaryIds, 'Draw.io boundary IDs');
  assert.deepEqual([...svgBoundaries.keys()].filter(Boolean).sort(), expectedBoundaryIds, 'SVG boundary IDs');
  assert.deepEqual(drawioRelationIds, expectedRelationIds, 'Draw.io relation IDs');
  assert.deepEqual([...svgEdges.keys()].filter(Boolean).sort(), expectedRelationIds, 'SVG relation IDs');
}

test('parses the exact STY-02 geometry and directed relation inventory', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  const geometries = drawioGeometries(drawio);
  const cells = drawioCells(drawio);
  const svgNodes = svgNodeShapes(svg);
  const svgBoundaries = svgElementsById(svg, 'path', 'data-boundary-id');
  const svgEdges = svgElementsById(svg, 'path', 'data-edge-id');

  assertExactDiagramInventory(drawio, svg);

  for (const [id, geometry] of plannedDiagramGeometries) {
    assert.deepEqual(geometries.get(id), geometry, `${id} Draw.io geometry`);
    const svgElement = id.startsWith('b-') ? svgBoundaries.get(id) : svgNodes.get(id);
    assert.deepEqual(svgPathBounds(svgElement?.d), geometry, `${id} SVG rendered path geometry`);
  }

  for (const [id, [source, target]] of plannedDiagramRelations) {
    assert.deepEqual([cells.get(id)?.source, cells.get(id)?.target], [source, target], `${id} Draw.io relation`);
    assert.deepEqual([svgEdges.get(id)?.['data-source'], svgEdges.get(id)?.['data-target']], [source, target], `${id} SVG relation`);
  }
});

test('rejects extra paired semantic nodes and relations in both diagram assets', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  const extraNodeDrawio = drawio.replace(
    '</root>',
    '<mxCell id="n-extra" value="额外节点" vertex="1" parent="1"><mxGeometry x="10" y="10" width="10" height="10" as="geometry"/></mxCell></root>',
  );
  const extraNodeSvg = svg.replace(
    '</svg>',
    '<g data-node-id="n-extra"><path d="M10 10H20V20H10Z"/><text x="15" y="16">额外节点</text></g></svg>',
  );
  assert.notEqual(extraNodeDrawio, drawio, 'extra Draw.io node mutation must change source');
  assert.notEqual(extraNodeSvg, svg, 'extra SVG node mutation must change source');
  assert.throws(() => assertExactDiagramInventory(extraNodeDrawio, extraNodeSvg), {name: 'AssertionError'});

  const extraRelationDrawio = drawio.replace(
    '</root>',
    '<mxCell id="c-extra" value="额外关系" edge="1" parent="1" source="n-driver" target="n-domain"><mxGeometry relative="1" as="geometry"/></mxCell></root>',
  );
  const extraRelationSvg = svg.replace(
    '</svg>',
    '<path data-edge-id="c-extra" data-source="n-driver" data-target="n-domain" d="M1 1H2"/></svg>',
  );
  assert.notEqual(extraRelationDrawio, drawio, 'extra Draw.io relation mutation must change source');
  assert.notEqual(extraRelationSvg, svg, 'extra SVG relation mutation must change source');
  assert.throws(() => assertExactDiagramInventory(extraRelationDrawio, extraRelationSvg), {name: 'AssertionError'});
});

test('binds every diagram title, role, and visible edge label to its semantic ID', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  assertExactDiagramLabels(drawio, svg);
});

test('rejects swapped node labels and changed edge labels despite preserved IDs', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  const swappedSvg = svg
    .replace('>库存端口</text>', '>临时交换标签</text>')
    .replace('>订单仓储端口</text>', '>库存端口</text>')
    .replace('>临时交换标签</text>', '>订单仓储端口</text>');
  assert.notEqual(swappedSvg, svg, 'node-label swap must mutate SVG');
  assert.throws(() => assertExactDiagramLabels(drawio, swappedSvg), {name: 'AssertionError'});

  const changedDrawio = drawio.replace('id="c4" value="查询库存"', 'id="c4" value="保存订单"');
  assert.notEqual(changedDrawio, drawio, 'edge-label mutation must mutate Draw.io');
  assert.throws(() => assertExactDiagramLabels(changedDrawio, svg), {name: 'AssertionError'});
});

test('parses distinct runtime and inward source-dependency routing contracts', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  const cells = drawioCells(drawio);
  const edges = svgElementsById(svg, 'path', 'data-edge-id');
  const runtimeMarker = svgMarker(svg, 'arrow-runtime');
  const dependencyMarker = svgMarker(svg, 'arrow-dependency');

  for (const id of ['c1', 'c2', 'c8', 'c3', 'c4', 'c5', 'c6', 'c7']) {
    assert.match(cells.get(id).style, /strokeWidth=3/u, `${id} Draw.io runtime width`);
    assert.doesNotMatch(cells.get(id).style, /dashed=1/u, `${id} Draw.io runtime solid`);
    assert.match(cells.get(id).style, /endArrow=block;endFill=1/u, `${id} Draw.io runtime marker`);
    assert.equal(edges.get(id).stroke, '#263238', `${id} SVG runtime stroke`);
    assert.equal(edges.get(id)['stroke-dasharray'], undefined, `${id} SVG runtime solid`);
    assert.equal(edges.get(id)['marker-end'], 'url(#arrow-runtime)', `${id} SVG runtime marker`);
  }
  for (const id of ['d1', 'd2', 'd3']) {
    assert.match(cells.get(id).style, /dashed=1/u, `${id} Draw.io dependency dashed`);
    assert.match(cells.get(id).style, /endArrow=open;endFill=0/u, `${id} Draw.io dependency marker`);
    assert.equal(edges.get(id).stroke, '#2F6F9F', `${id} SVG dependency stroke`);
    assert.ok(edges.get(id)['stroke-dasharray'], `${id} SVG dependency dashed`);
    assert.equal(edges.get(id)['marker-end'], 'url(#arrow-dependency)', `${id} SVG dependency marker`);
  }

  assert.notEqual(edges.get('c2').d, edges.get('d1').d, 'input runtime/dependency lanes');
  assert.notEqual(parsePathEndpoint(edges.get('c5').d).y, parsePathEndpoint(edges.get('d2').d).y, 'inventory lanes');
  assert.notEqual(parsePathEndpoint(edges.get('c7').d).y, parsePathEndpoint(edges.get('d3').d).y, 'repository lanes');
  assert.equal(hasCollinearSegmentOverlap(edges.get('c2').d, edges.get('d1').d), false, 'input lanes do not share a segment');
  assert.equal(hasCollinearSegmentOverlap(edges.get('c5').d, edges.get('d2').d), false, 'inventory lanes do not share a segment');
  assert.equal(hasCollinearSegmentOverlap(edges.get('c7').d, edges.get('d3').d), false, 'repository lanes do not share a segment');
  assert.ok(parsePathEndpoint(edges.get('d2').d).x < 995, 'd2 points inward');
  assert.ok(parsePathEndpoint(edges.get('d3').d).x < 995, 'd3 points inward');
  assert.equal(runtimeMarker.attributes.markerUnits, 'userSpaceOnUse');
  assert.notEqual(runtimeMarker.path.fill, 'none', 'runtime arrowhead is filled');
  assert.equal(dependencyMarker.attributes.markerUnits, 'userSpaceOnUse');
  assert.equal(dependencyMarker.path.fill, 'none', 'dependency arrowhead is open');
  assert.ok(dependencyMarker.path.stroke, 'dependency arrowhead has a visible outline');
});

test('connects every visible SVG arrow tip to its target-node boundary', async () => {
  const svg = await readFile(diagramSvgUrl, 'utf8');
  const edges = svgElementsById(svg, 'path', 'data-edge-id');
  const expectedTips = new Map([
    ['c1', {x: 260, y: 365}], ['c2', {x: 430, y: 200}], ['c8', {x: 565, y: 355}], ['c3', {x: 470, y: 555}],
    ['c4', {x: 710, y: 215}], ['c5', {x: 985, y: 230}], ['c6', {x: 710, y: 535}],
    ['c7', {x: 985, y: 500}], ['d1', {x: 430, y: 245}], ['d2', {x: 940, y: 280}],
    ['d3', {x: 940, y: 580}],
  ]);
  const expectedStarts = new Map([
    ['c1', {x: 235, y: 365}], ['c2', {x: 395, y: 315}], ['c8', {x: 565, y: 275}], ['c3', {x: 470, y: 485}],
    ['c4', {x: 700, y: 390}], ['c5', {x: 940, y: 230}], ['c6', {x: 700, y: 450}],
    ['c7', {x: 940, y: 500}], ['d1', {x: 395, y: 435}], ['d2', {x: 985, y: 280}],
    ['d3', {x: 985, y: 580}],
  ]);
  const markerTipOffset = new Map(['arrow-runtime', 'arrow-dependency'].map((id) => {
    const marker = svgMarker(svg, id);
    const xCoordinates = [...marker.path.d.matchAll(/[ML](-?\d+(?:\.\d+)?)[ ,]-?\d+(?:\.\d+)?/gu)]
      .map(([, x]) => Number(x));
    return [`url(#${id})`, Math.max(...xCoordinates) - Number(marker.attributes.refX)];
  }));

  for (const [id, expectedTip] of expectedTips) {
    const edge = edges.get(id);
    assert.deepEqual(orthogonalPathPoints(edge.d)[0], expectedStarts.get(id), `${id} source-boundary contact`);
    const endpoint = parsePathEndpoint(edge.d);
    const previousHorizontal = /H/u.test(edge.d.slice(edge.d.lastIndexOf('V') + 1));
    const offset = markerTipOffset.get(edge['marker-end']);
    const direction = id === 'd2' || id === 'd3' ? -1 : 1;
    const actualTip = previousHorizontal
      ? {x: endpoint.x + (offset * direction), y: endpoint.y}
      : {x: endpoint.x, y: endpoint.y + offset};
    assert.deepEqual(actualTip, expectedTip, `${id} visible marker tip`);
  }
});
