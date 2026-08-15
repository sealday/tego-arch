import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const [ledger, linkHealth] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const [manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const expectedSources = new Map([
  ['src-microsoft-n-tier-architecture', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier'],
  ['src-fowler-presentation-domain-data-layering', 'https://martinfowler.com/bliki/PresentationDomainDataLayering.html'],
  ['src-aws-hexagonal-layered-overview', 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html'],
  ['src-archunit-user-guide', 'https://www.archunit.org/userguide/html/000_Index.html'],
]);

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const sty01 = documents.find(({file}) => file === 'styles/sty-01-layered-architecture.mdx');
const sty00 = documents.find(({file}) => file === 'styles/sty-00-comparison-framework.mdx');
const expectedHeadings = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
const layers = ['表示层', '应用层', '领域层', '基础设施层'];
const dimensions = ['边界', '控制流', '数据所有权', '一致性', '部署单元', '故障域', '团队拓扑', '质量属性'];
const exceptionFields = ['调用方', '被调用层', '被跳过层', '理由', '不变量', '风险', '自动化验证', '责任角色类型', '复核触发器', '撤销条件'];
const approvedExceptionRow = '| 应用层 | 基础设施层 | 领域层 | 报表只读查询避免无业务价值的转发 | 不改变订单、库存或权限不变量 | 查询模型耦合与旁路扩散 | 架构依赖测试、查询契约测试、结果映射测试 | 架构责任人、订单能力负责人 | 查询参与业务决策或返回模型变化 | 恢复逐层调用或重新设计边界 |';
const secondExceptionRow = '| 表示层 | 基础设施层 | 应用层、领域层 | 健康检查避免业务用例编排 | 不改变订单、库存或权限不变量 | 协议与基础设施耦合 | 架构依赖测试、健康检查契约测试、结果映射测试 | 架构责任人、平台负责人 | 健康检查参与业务决策或返回模型变化 | 恢复逐层调用或重新设计边界 |';
const responsibilityRows = [
  ['表示层', '协议解析、输入格式、响应呈现', '稳定的输入映射和结果呈现', '业务规则、事务决策、数据库访问'],
  ['应用层', '用例编排、权限入口、事务意图、超时预算和流程结果', '面向调用方的用例', '核心业务判断、对象关系映射类型与厂商驱动'],
  ['领域层', '订单与库存不变量、状态转换和业务拒绝', '领域行为与稳定的数据访问能力合同', '传输协议、用户界面、数据库结构、对象关系映射类型和运行配置'],
  ['基础设施层', '持久化、消息、时钟和外部系统实现', '满足上层所需的数据与外部能力', '决定业务规则或向上层泄漏厂商类型'],
];
const canonicalSources = [...expectedSources.values()];
const expectedCitations = [
  ['src-microsoft-n-tier-architecture', true],
  ['src-fowler-presentation-domain-data-layering', false],
  ['src-aws-hexagonal-layered-overview', false],
  ['src-archunit-user-guide', false],
];

function assertInOrder(source, values, label) {
  let cursor = -1;
  for (const value of values) {
    const next = source.indexOf(value, cursor + 1);
    assert.ok(next > cursor, `${label}: ${value}`);
    cursor = next;
  }
}

function bodyOf(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '');
}

function internalLinksOf(source) {
  return extractInternalLinks({body: bodyOf(source)});
}

function externalLinksOf(source) {
  return extractExternalLinks({body: bodyOf(source)});
}

function markdownTableDataRows(source, headerRow) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(headerRow);
  assert.notEqual(headerIndex, -1, 'exception table header');
  assert.equal(
    lines[headerIndex + 1],
    `| ${exceptionFields.map(() => '---').join(' | ')} |`,
    'exception table divider',
  );

  const dataRows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith('|')) break;
    dataRows.push(line);
  }
  return dataRows;
}

function assertLayerContract(source) {
  for (const row of responsibilityRows) {
    assert.ok(source.includes(`| ${row.join(' | ')} |`), row[0]);
  }

  assert.match(source, /PRESENTATION\["表示层"\]\s*-->\s*APPLICATION\["应用层"\]/u);
  assert.match(source, /APPLICATION\s*-->\s*DOMAIN\["领域层"\]/u);
  assert.match(source, /DOMAIN\s*-->\s*INFRASTRUCTURE\["基础设施层"\]/u);
  assert.equal((source.match(/\s-->\s/gu) ?? []).length, 3);
  for (const reverseEdge of [
    /APPLICATION\s*-->\s*PRESENTATION/u,
    /DOMAIN\s*-->\s*PRESENTATION/u,
    /DOMAIN\s*-->\s*APPLICATION/u,
    /INFRASTRUCTURE\s*-->\s*PRESENTATION/u,
    /INFRASTRUCTURE\s*-->\s*APPLICATION/u,
    /INFRASTRUCTURE\s*-->\s*DOMAIN/u,
  ]) {
    assert.doesNotMatch(source, reverseEdge);
  }
  assert.equal((source.match(/-\.->/gu) ?? []).length, 1);
  assert.match(source, /APPLICATION\s*-\.->\|只读查询例外\|\s*INFRASTRUCTURE/u);

  const exceptionTableHeader = `| ${exceptionFields.join(' | ')} |`;
  assert.deepEqual(markdownTableDataRows(source, exceptionTableHeader), [approvedExceptionRow]);

  assert.match(source, /逻辑层/u);
  assert.match(source, /代码模块或程序包/u);
  assert.match(source, /物理层级或部署单元/u);
  assert.match(source, /subgraph DEPLOY\["单一部署单元"\]/u);
  assert.doesNotMatch(source, /表示层独立部署|应用层独立部署|领域层独立部署|基础设施层独立部署/u);
  assert.equal((source.match(/diagram-wrapper--scroll-owner/g) ?? []).length, 3);
  assert.equal((source.match(/tabIndex=\{0\}/g) ?? []).length, 3);
  assert.equal((source.match(/onKeyDown=\{handleHorizontalArrowKey\}/g) ?? []).length, 3);
  assertInOrder(source, dimensions.map((dimension) => `| ${dimension} |`), 'dimension order');
  assert.match(source, /同一本地事务/u);
  assert.match(source, /格式错误[\s\S]*流程失败[\s\S]*业务拒绝[\s\S]*稳定错误类别/u);
  const visibleExternalLinks = externalLinksOf(source);
  for (const locator of canonicalSources) assert.ok(visibleExternalLinks.includes(locator), locator);
  assert.ok(internalLinksOf(source).includes('/cases/micro-frontends-single-spa'));
  assert.ok(internalLinksOf(source).includes('/styles/sty-02'));
  assert.doesNotMatch(source, /吞吐提升|延迟降低|恢复时间缩短|生产事故减少/u);
}

function assertReciprocalRelation(sty01Source, sty00Source) {
  assert.ok(internalLinksOf(sty01Source).includes('/styles/sty-00'));
  assert.ok(internalLinksOf(sty00Source).includes('/styles/sty-01'));
  assert.ok(internalLinksOf(sty01Source).includes('/styles/sty-02'));
  assert.ok(parseFrontMatter(sty00Source).adjacent_topics.includes('STY-01'));
}

test('governs the four approved STY-01 sources', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, locator] of expectedSources) {
    const record = records.get(id);
    assert.equal(record?.canonical_locator, locator, id);
    assert.ok(record.version, `${id} version`);
    assert.ok(record.license_evidence_url, `${id} license evidence`);
    assert.ok(record.usage_boundary, `${id} usage boundary`);
  }
  assert.equal(records.get('src-microsoft-n-tier-architecture').version.includes('ef79621488119c618cd3ebeb8f81443f023cc452'), true);
  assert.equal(records.get('src-archunit-user-guide').version.includes('v1.5.0'), true);
});

test('preserves the Batch 2 STY-01 facts under the current STY-07 Stage B projection', () => {
  const topic = manifest.topics.find(({id}) => id === 'STY-01');
  assert.equal(topic.published, true);
  assert.equal(topic.status.value, 'complete');
  assert.deepEqual(topic.primary_sources, [
    'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier',
  ]);
  assert.equal(manifest.topics.find(({id}) => id === 'STY-02')?.status.value, 'complete');
  assert.equal(manifest.topics.find(({id}) => id === 'STY-03')?.published, true);
  assert.equal(manifest.topics.find(({id}) => id === 'STY-03')?.status.value, 'complete');
  assert.equal(manifest.topics.find(({id}) => id === 'STY-04')?.published, true);
  assert.equal(manifest.topics.find(({id}) => id === 'STY-04')?.status.value, 'complete');
  assert.equal(projectStatus.completed_topics, 60);
  assert.equal(projectStatus.content_documents, 103);
  assert.equal(projectStatus.governed_sources, 535);
  assert.equal(publicLedger.sources.length, 535);
  assert.ok(indexes.style.some(({id, status}) => id === 'STY-01' && status.value === 'complete'));
  assert.ok(indexes.style.some(({id, status}) => id === 'STY-02' && status.value === 'complete'));
});

test('keeps every STY-01 transport in the reviewed health cache', () => {
  const results = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  for (const id of expectedSources.keys()) {
    const result = results.get(id);
    assert.ok(result, `${id} health result`);
    assert.equal(result.last_attempt.outcome, 'healthy', `${id} current transport`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
  }
});

test('publishes the approved STY-01 metadata and style headings', () => {
  assert.ok(sty01);
  const metadata = parseFrontMatter(sty01.source);
  assert.equal(metadata.title, '分层架构：用依赖方向约束职责分层');
  assert.equal(metadata.slug, '/styles/sty-01');
  assert.equal(metadata.topic_id, 'STY-01');
  assert.deepEqual(metadata.depends_on, ['STY-00']);
  assert.deepEqual(metadata.adjacent_topics, ['STY-00', 'STY-02', 'STY-03', 'STY-04']);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(findMarkdownHeadings(sty01.body).map(({text}) => text), expectedHeadings);
});

test('locks four closed layers and one controlled read-query exception', () => {
  assert.ok(sty01);
  let cursor = -1;
  for (const layer of layers) {
    const next = sty01.body.indexOf(`| ${layer} |`);
    assert.ok(next > cursor, `${layer} order`);
    cursor = next;
  }
  assertLayerContract(sty01.source);
});

test('locks responsibilities, logical-versus-physical boundaries, visual wrappers, profile, and evidence', () => {
  assert.ok(sty01);
  assertLayerContract(sty01.source);
  assert.match(sty01.body, /aria-label="四层责任合同，可横向滚动"/u);
  assert.doesNotMatch(sty01.body, /aria-label="四层责任合同与八维架构剖面，可横向滚动"/u);
});

test('keeps the STY-00 relation reciprocal and STY-02 actionable', () => {
  assert.ok(sty01);
  assert.ok(sty00);
  assertReciprocalRelation(sty01.source, sty00.source);
  assert.ok(extractInternalLinks(sty01).includes('/cases/micro-frontends-single-spa'));
});

test('rejects mutations of the closed-layer contract', () => {
  assert.ok(sty01);
  for (const [label, mutated] of [
    ['write-path bypass', sty01.source.replace('APPLICATION --> DOMAIN["领域层"]', 'APPLICATION --> INFRASTRUCTURE["基础设施层"]')],
    ['reverse dependency', sty01.source.replace('DOMAIN --> INFRASTRUCTURE["基础设施层"]', 'INFRASTRUCTURE --> DOMAIN["领域层"]')],
    ['domain receives transport type', sty01.source.replace('传输协议、用户界面、数据库结构、对象关系映射类型和运行配置', '允许传输协议请求类型')],
    ['domain receives object-relational mapping type', sty01.source.replace('传输协议、用户界面、数据库结构、对象关系映射类型和运行配置', '允许对象关系映射实体类型')],
    ['missing exception validation', sty01.source.replace('架构依赖测试、查询契约测试、结果映射测试', '')],
    ['missing exception rollback', sty01.source.replace('恢复逐层调用或重新设计边界', '')],
    ['second exception row', sty01.source.replace(approvedExceptionRow, `${approvedExceptionRow}\n${secondExceptionRow}`)],
    ['four deployments', sty01.source.replace('subgraph DEPLOY["单一部署单元"]', 'subgraph DEPLOY["四个独立部署单元"]')],
    ['hexagonal inversion as default', sty01.source.replace('PRESENTATION["表示层"] --> APPLICATION["应用层"]', 'INFRASTRUCTURE["基础设施层"] --> DOMAIN["领域层"]')],
    [
      'source URL is plain text',
      sty01.source.replace(
        '[微软分层架构指南](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier)',
        '微软分层架构指南：https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier',
      ),
    ],
  ]) {
    assert.notEqual(mutated, sty01.source, `${label} mutation must change source`);
    assert.throws(() => assertLayerContract(mutated), {name: 'AssertionError'});
  }
});

test('rejects mutations of the reciprocal relation', () => {
  assert.ok(sty01);
  assert.ok(sty00);
  const withoutSty01 = sty00.source.replace('/styles/sty-01', '/styles');
  const withoutSty02 = sty01.source.replace('/styles/sty-02', '/styles');
  assert.notEqual(withoutSty01, sty00.source, 'STY-00 mutation must change source');
  assert.notEqual(withoutSty02, sty01.source, 'STY-01 mutation must change source');
  assert.throws(() => assertReciprocalRelation(sty01.source, withoutSty01), {name: 'AssertionError'});
  assert.throws(() => assertReciprocalRelation(withoutSty02, sty00.source), {name: 'AssertionError'});
});

test('records the approved STY-01 citation review', () => {
  const review = ledger.documents['content/styles/sty-01-layered-architecture.mdx'];
  assert.ok(review);
  assert.equal(review.reviewed_at, '2026-08-07');
  assert.deepEqual(review.copyright_checks, [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ]);
  assert.deepEqual(
    review.citations.map(({source_id, manifest_primary}) => [source_id, manifest_primary]),
    expectedCitations,
  );
  for (const citation of review.citations) {
    assert.equal(citation.usage_mode, 'facts-summary');
    assert.equal(citation.excerpt, null);
  }
});
