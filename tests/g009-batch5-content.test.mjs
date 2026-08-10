import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const TOPIC_ID = 'STY-04';
const ROUTE = '/styles/sty-04';
const ARTICLE = 'content/styles/sty-04-modular-monolith.mdx';
const DRAWIO = 'diagrams/sty-04-modular-monolith-boundaries.drawio';
const SVG = 'static/img/diagrams/sty-04-modular-monolith-boundaries.svg';
const SOURCE_IDS = [
  'src-fowler-monolith-first',
  'src-spring-modulith-fundamentals',
  'src-spring-modulith-events',
];
const REQUIRED_HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];

const SOURCE_URLS = [
  'https://martinfowler.com/bliki/MonolithFirst.html',
  'https://docs.spring.io/spring-modulith/reference/fundamentals.html',
  'https://docs.spring.io/spring-modulith/reference/events.html',
];
const ADJACENT_TOPICS = ['STY-01', 'STY-02', 'STY-03'];
const ADJACENT_ROUTES = ['/styles/sty-01', '/styles/sty-02', '/styles/sty-03'];
const MODULES = ['order', 'inventory', 'payment', 'notification'];
const DIAGRAM_NODES = [
  ['deployment-boundary', '单一部署单元', '部署边界 / Deployment Boundary'],
  ['order-module-boundary', '订单模块', '业务模块 / Module Boundary'],
  ['inventory-module-boundary', '库存模块', '业务模块 / Module Boundary'],
  ['payment-module-boundary', '支付模块', '业务模块 / Module Boundary'],
  ['notification-module-boundary', '通知模块', '业务模块 / Module Boundary'],
  ['order-public-contract', '订单公开合同', '公开合同 / Public Contract'],
  ['inventory-public-contract', '库存公开合同', '公开合同 / Public Contract'],
  ['payment-public-contract', '支付公开合同', '公开合同 / Public Contract'],
  ['notification-public-contract', '通知公开合同', '公开合同 / Public Contract'],
  ['order-internal-implementation', '订单内部实现', '内部实现 / Internal Implementation'],
  ['inventory-internal-implementation', '库存内部实现', '内部实现 / Internal Implementation'],
  ['payment-internal-implementation', '支付内部实现', '内部实现 / Internal Implementation'],
  ['notification-internal-implementation', '通知内部实现', '内部实现 / Internal Implementation'],
  ['order-owned-data', '订单数据', '唯一模块所有者 / Owned Data'],
  ['inventory-owned-data', '库存数据', '唯一模块所有者 / Owned Data'],
  ['payment-owned-data', '支付数据', '唯一模块所有者 / Owned Data'],
  ['notification-owned-data', '通知数据', '唯一模块所有者 / Owned Data'],
  ['outbox', 'Outbox', '订单模块拥有 / Transactional Outbox'],
  ['event-publication', '事件发布登记', '提交后事件 / Event Publication'],
  ['shared-process-failure-domain', '共享进程故障域', '共享运行时 / Failure Domain'],
  ['submit-order-request', '提交订单请求', '外部请求 / Request'],
  ['legend-sync-line', '', ''],
  ['legend-event-line', '', ''],
  ['legend-sync-label', '同步调用 / 模块内写入（实线）', ''],
  ['legend-event-label', '提交后事件 / 异步投递（虚线）', ''],
];
const DIAGRAM_EDGES = [
  ['request-entry', 'submit-order-request', 'order-public-contract', '提交订单', 'sync'],
  ['order-contract-dispatch', 'order-public-contract', 'order-internal-implementation', '进入订单模块', 'sync'],
  ['inventory-contract-dispatch', 'inventory-public-contract', 'inventory-internal-implementation', '进入库存模块', 'sync'],
  ['payment-contract-dispatch', 'payment-public-contract', 'payment-internal-implementation', '进入支付模块', 'sync'],
  ['notification-contract-dispatch', 'notification-public-contract', 'notification-internal-implementation', '进入通知模块', 'sync'],
  ['order-inventory-call', 'order-internal-implementation', 'inventory-public-contract', '申请库存预留', 'sync'],
  ['order-payment-call', 'order-internal-implementation', 'payment-public-contract', '请求支付', 'sync'],
  ['order-outbox-write', 'order-internal-implementation', 'outbox', '同事务记录', 'sync'],
  ['outbox-event-publication', 'outbox', 'event-publication', '提交后发布', 'event'],
  ['event-notification-delivery', 'event-publication', 'notification-public-contract', '异步投递', 'event'],
  ['order-owned-data-write', 'order-internal-implementation', 'order-owned-data', '写入订单数据', 'sync'],
  ['inventory-owned-data-write', 'inventory-internal-implementation', 'inventory-owned-data', '写入库存数据', 'sync'],
  ['payment-owned-data-write', 'payment-internal-implementation', 'payment-owned-data', '写入支付数据', 'sync'],
  ['notification-owned-data-write', 'notification-internal-implementation', 'notification-owned-data', '写入通知数据', 'sync'],
];

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
const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const article = documents.find(({file}) => `content/${file}` === ARTICLE);
const sty03 = documents.find(({file}) => file === 'styles/sty-03-vertical-slice-architecture.mdx');
const moduleBoundaries = documents.find(({file}) => file === 'paths/02-module-boundaries.mdx');

function bodyOf(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '');
}

function internalLinksOf(document) {
  return extractInternalLinks({body: bodyOf(document.source)});
}

function externalLinksOf(document) {
  return extractExternalLinks({body: bodyOf(document.source)});
}

function xmlAttributes(tag) {
  return new Map([...tag.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value]));
}

function decodeXmlText(value) {
  return value.replace(/&amp;/gu, '&').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"').replace(/&#39;/gu, "'");
}

function visibleDrawioCells(source) {
  return [...source.matchAll(/<mxCell\b[^>]*>/gu)].map(([tag]) => {
    const attributes = xmlAttributes(tag);
    const style = attributes.get('style') ?? '';
    if (attributes.get('visible') === '0' || /(?:^|;)\s*(?:opacity=0|visible=0)(?:;|$)/u.test(style)) return null;
    return {attributes, label: decodeXmlText(attributes.get('value') ?? '')};
  }).filter(Boolean);
}

function drawioDiagramContract(source) {
  const cells = visibleDrawioCells(source);
  const typeCells = cells.filter(({attributes}) => attributes.get('dataRole') === 'type');
  const typesByParent = new Map(typeCells.map(({attributes, label}) => [attributes.get('parent'), label]));
  return {
    nodes: cells.filter(({attributes}) => attributes.get('vertex') === '1' && attributes.get('dataRole') !== 'type')
      .map(({attributes, label}) => ({
        id: attributes.get('id'), label, visibleTypeLabel: typesByParent.get(attributes.get('id')) ?? '',
      })),
    typeCells: typeCells.map(({attributes, label}) => ({
      id: attributes.get('id'), parent: attributes.get('parent'), label, style: attributes.get('style') ?? '',
    })),
    edges: cells.filter(({attributes}) => attributes.get('edge') === '1')
      .map(({attributes, label}) => ({
        id: attributes.get('id'), label, source: attributes.get('source'), target: attributes.get('target'),
        style: attributes.get('style') ?? '',
      })),
  };
}

function svgDiagramContract(source) {
  const nodes = [...source.matchAll(/<g\b([^>]*)data-node-id="([^"]+)"([^>]*)>([\s\S]*?)<\/g>/gu)]
    .filter(([, before, , after]) => !/(?:style|visibility)="[^"]*(?:display\s*:\s*none|hidden)/u.test(`${before}${after}`))
    .map(([, before, id, after, contents]) => ({
      id,
      label: decodeXmlText(contents.match(/<text\b[^>]*data-text-role="title"[^>]*>([^<]*)<\/text>/u)?.[1] ?? ''),
      typeLabel: decodeXmlText(xmlAttributes(`${before}${after}`).get('data-type-label') ?? ''),
      visibleTypeLabel: decodeXmlText(contents.match(/<text\b[^>]*data-text-role="type"[^>]*>([^<]*)<\/text>/u)?.[1] ?? ''),
    }));
  const edgeLabels = new Map([...source.matchAll(/<text\b[^>]*data-edge-id="([^"]+)"[^>]*>([^<]*)<\/text>/gu)]
    .map(([, id, label]) => [id, decodeXmlText(label).trim()]));
  const edges = [...source.matchAll(/<path\b([^>]*)data-edge-id="([^"]+)"([^>]*)>/gu)]
    .map(([, before, id, after]) => {
      const attributes = xmlAttributes(`${before}${after}`);
      return {
        id,
        label: edgeLabels.get(id) ?? '',
        source: attributes.get('data-source'),
        target: attributes.get('data-target'),
        className: attributes.get('class') ?? '',
      };
    });
  return {nodes, edges};
}

function drawioCellGeometry(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = source.match(new RegExp(`<mxCell\\b[^>]*\\bid="${escapedId}"[^>]*>([\\s\\S]*?)<\\/mxCell>`, 'u'));
  assert.ok(match, `Draw.io cell geometry ${id}`);
  const geometryTag = match[1].match(/<mxGeometry\b([^>]*)\/?>(?:<\/mxGeometry>)?/u);
  assert.ok(geometryTag, `Draw.io mxGeometry ${id}`);
  const geometry = xmlAttributes(geometryTag[1]);
  return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(geometry.get(key) ?? 0)]));
}

function svgCellGeometry(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = source.match(new RegExp(`<g\\b[^>]*data-node-id="${escapedId}"[^>]*data-node-bounds="([^"]+)"`, 'u'));
  assert.ok(match, `SVG node geometry ${id}`);
  const [x, y, width, height] = match[1].split(/\s+/u).map(Number);
  return {x, y, width, height};
}

function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height;
}

test('publishes exact STY-04 metadata, headings, and actionable published adjacency', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const metadata = parseFrontMatter(article.source);
  assert.equal(metadata.topic_id, TOPIC_ID);
  assert.equal(metadata.slug, ROUTE);
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'intermediate');
  assert.equal(metadata.priority, 'P0');
  assert.deepEqual(metadata.depends_on, ['STY-00', 'STY-03']);
  assert.deepEqual(metadata.adjacent_topics, ADJACENT_TOPICS);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(findMarkdownHeadings(article.body).map(({text}) => text), REQUIRED_HEADINGS);
  const links = internalLinksOf(article);
  for (const route of ADJACENT_ROUTES) assert.ok(links.includes(route), `actionable adjacency ${route}`);
  assert.equal(links.includes('/styles/sty-05'), false, 'STY-05 stays non-actionable');
  assert.ok(sty03 && parseFrontMatter(sty03.source).adjacent_topics.includes(TOPIC_ID), 'STY-03 reciprocal metadata');
  assert.ok(sty03 && internalLinksOf(sty03).includes(ROUTE), 'STY-03 reciprocal route');
  assert.ok(moduleBoundaries && internalLinksOf(moduleBoundaries).includes(ROUTE), 'module-boundaries path route');
});

test('locks module contracts, data ownership, consistency, failure domain, and split signals', () => {
  assert.ok(article);
  const visibleCopy = parseMdxVisibleCopy(article.source, ARTICLE).blocks.map(({text}) => text).join('\n');
  assert.match(visibleCopy, /模块化单体（Modular Monolith）/u, 'governed bilingual first use');
  assert.match(visibleCopy, /公开合同/u);
  assert.match(visibleCopy, /内部实现/u);
  assert.match(visibleCopy, /(?:只能|仅能).*公开合同|公开合同.*(?:唯一|允许).*入口/u, 'public-only module collaboration');
  assert.match(visibleCopy, /共享物理数据库/u);
  assert.match(visibleCopy, /(?:唯一|单一)(?:模块)?所有者|每(?:张|个).*权威.*(?:表|数据).*(?:唯一|单一).*所有者/u,
    'unique authority owner');
  assert.match(visibleCopy, /共享(?:物理)?数据库不等于共享(?:数据)?模型/u);
  assert.match(visibleCopy, /本地事务/u);
  assert.match(visibleCopy, /跨模块.*(?:原子)?事务.*耦合|本地事务.*跨模块.*耦合/u);
  assert.match(visibleCopy, /Outbox/u);
  for (const term of ['提交', '投递', '重复', '恢复']) assert.match(visibleCopy, new RegExp(term, 'u'), `Outbox boundary: ${term}`);
  assert.match(visibleCopy, /(?:单一|一个)(?:构建)?制品|一个部署制品/u);
  assert.match(visibleCopy, /共享进程故障域/u);
  for (const signal of [
    /协调等待|协调延迟/u, /独立发布/u, /非对称扩缩|资源曲线/u, /合规|数据驻留/u,
    /爆炸半径|故障影响半径/u, /团队自治/u, /迁移就绪|迁移准备/u, /回滚/u,
  ]) assert.match(visibleCopy, signal, `measurable split signal ${signal}`);
  assert.match(article.source,
    /<div className="architecture-diagram-scroll" role="region" aria-label="模块化单体的模块合同、数据所有权与单一部署边界图，可横向滚动" tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}>[\s\S]*?\/img\/diagrams\/sty-04-modular-monolith-boundaries\.svg[\s\S]*?<\/div>/u,
    'accessible diagram embed');
});

test('rejects claims that erase module, data, deployment, or delivery boundaries', () => {
  assert.ok(article);
  const visibleCopy = parseMdxVisibleCopy(article.source, ARTICLE).blocks.map(({text}) => text).join('\n');
  assert.doesNotMatch(visibleCopy, /模块(?:就是|等同于|等于|=)服务/u);
  assert.doesNotMatch(visibleCopy, /共享(?:物理)?数据库(?:就是|等同于|等于|=)共享(?:数据)?模型/u);
  assert.doesNotMatch(visibleCopy,
    /模块化单体(?:天然|自动)(?:获得|具备|支持|实现)?[^。；\n]*(?:独立部署|独立扩缩|故障隔离)/u);
  assert.doesNotMatch(visibleCopy, /Outbox[^。；\n]*(?:保证|实现)[^。；\n]*exactly[- ]once/iu);
});

test('governs the three STY-04 sources with bounded evidence and one manifest primary', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  const healthBySource = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  const review = ledger.documents[ARTICLE];
  assert.ok(review, `${ARTICLE} source review`);
  assert.deepEqual(review.citations.map(({source_id}) => source_id), SOURCE_IDS);
  assert.equal(review.citations.filter(({manifest_primary}) => manifest_primary).length, 1,
    'exactly one manifest-primary citation');
  assert.deepEqual(review.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.ok(article, `${ARTICLE} visible citations`);
  const citedDomains = new Set();
  for (const [index, sourceId] of SOURCE_IDS.entries()) {
    const record = records.get(sourceId);
    assert.ok(record, `${sourceId} ledger record`);
    assert.equal(record.canonical_locator, SOURCE_URLS[index]);
    citedDomains.add(new URL(record.canonical_locator).hostname);
    for (const field of [
      'author_or_org', 'version', 'source_kind', 'copyright_policy', 'license', 'license_family_id',
      'license_evidence_url', 'license_evidence_note', 'usage_boundary',
    ]) assert.ok(record[field]?.length, `${sourceId} ${field}`);
    assert.ok(record.allowed_evidence_roles?.length, `${sourceId} allowed_evidence_roles`);
    assert.ok(review.citations[index].roles?.every((role) => record.allowed_evidence_roles.includes(role)),
      `${sourceId} citation roles remain within ledger authority`);
    assert.ok(review.citations[index].attribution_note?.trim(), `${sourceId} attribution`);
    assert.equal(review.citations[index].excerpt, null, `${sourceId} no copied excerpt`);
    assert.equal(review.citations[index].quotation_reviewed, false, `${sourceId} no quotation`);
    assert.ok(externalLinksOf(article).includes(record.canonical_locator), `${sourceId} visible citation`);
    const health = healthBySource.get(sourceId);
    assert.equal(health?.last_attempt?.outcome, 'healthy', `${sourceId} current transport`);
    assert.equal(health?.review_status, 'healthy', `${sourceId} reviewed health`);
    assert.equal(health?.last_attempt?.final_transport_locator, record.transport_locator,
      `${sourceId} final transport`);
    const escapedFamily = record.license_family_id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    assert.match(licenseInventory, new RegExp(`^\\|\\s*${escapedFamily}\\s*\\|`, 'mu'),
      `${sourceId} license inventory`);
  }
  assert.deepEqual([...citedDomains].sort(), ['docs.spring.io', 'martinfowler.com']);
});

test('projects the exact pre-closure Stage A state', () => {
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID);
  const nextTopic = manifest.topics.find(({id}) => id === 'STY-05');
  assert.equal(topic?.published, true);
  assert.equal(topic?.slug, ROUTE);
  assert.equal(topic?.status.value, 'pending');
  assert.deepEqual(topic?.dependencies, ['STY-00', 'STY-03']);
  assert.deepEqual(topic?.adjacent_topics, ADJACENT_TOPICS);
  assert.deepEqual(topic?.related_cases, ['/cases/micro-frontends-single-spa']);
  const primarySourceIds = ledger.documents[ARTICLE]?.citations
    .filter(({manifest_primary}) => manifest_primary).map(({source_id}) => source_id) ?? [];
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  const projectedPrimaryUrls = primarySourceIds.map((id) => records.get(id)?.canonical_locator)
    .sort((left, right) => left.localeCompare(right, 'en'));
  assert.deepEqual(topic?.primary_sources, projectedPrimaryUrls);
  const styleIndexEntry = indexes.style.find(({id}) => id === TOPIC_ID);
  assert.equal(styleIndexEntry?.published, true);
  assert.equal(styleIndexEntry?.status.value, 'pending');
  assert.deepEqual(styleIndexEntry?.primary_sources, projectedPrimaryUrls);
  assert.equal(nextTopic?.published, false);
  assert.equal(nextTopic?.status.value, 'pending');
  assert.equal(projectStatus.completed_topics, 56);
  assert.equal(projectStatus.content_documents, 99);
  assert.equal(projectStatus.governed_sources, 512);
  assert.equal(publicLedger.sources.length, 512);
});

test('publishes a synchronized, accessible Draw.io and SVG semantic inventory', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<title\b[^>]*>[^<]*模块化单体[^<]*<\/title>/u);
  assert.match(svg, /<desc\b[^>]*>[^<]*(?=[^<]*单一部署)(?=[^<]*订单)(?=[^<]*库存)(?=[^<]*支付)(?=[^<]*通知)(?=[^<]*公开合同)(?=[^<]*数据)(?=[^<]*同步)(?=[^<]*异步)[^<]*<\/desc>/u);
  assert.match(svg, /<svg\b(?=[^>]*\bviewBox="0 0 [0-9.]+ [0-9.]+")(?=[^>]*\brole="img")(?=[^>]*\baria-labelledby="[^"]+")[^>]*>/u);
  assert.doesNotMatch(svg.match(/<svg\b[^>]*>/u)?.[0] ?? '', /\b(?:width|height)="/u, 'responsive SVG root');

  const drawioContract = drawioDiagramContract(drawio);
  const svgContract = svgDiagramContract(svg);
  const drawioNodes = new Map(drawioContract.nodes.map((node) => [node.id, node]));
  const svgNodes = new Map(svgContract.nodes.map((node) => [node.id, node]));
  assert.equal(drawioNodes.size, drawioContract.nodes.length, 'unique Draw.io node IDs');
  assert.equal(svgNodes.size, svgContract.nodes.length, 'unique SVG node IDs');
  assert.deepEqual([...drawioNodes.keys()].sort(), DIAGRAM_NODES.map(([id]) => id).sort(),
    'exact Draw.io node inventory');
  assert.deepEqual([...svgNodes.keys()].sort(), DIAGRAM_NODES.map(([id]) => id).sort(),
    'exact SVG node inventory');
  for (const [id, label, typeLabel] of DIAGRAM_NODES) {
    assert.equal(drawioNodes.get(id)?.label, label, `Draw.io node ${id} title`);
    assert.equal(svgNodes.get(id)?.label, label, `SVG node ${id} title`);
    assert.equal(drawioNodes.get(id)?.visibleTypeLabel, typeLabel, `Draw.io node ${id} visible type`);
    assert.equal(svgNodes.get(id)?.typeLabel, typeLabel, `SVG node ${id} data type`);
    assert.equal(svgNodes.get(id)?.visibleTypeLabel, typeLabel, `SVG node ${id} visible type`);
    if (typeLabel) {
      const typeCell = drawioContract.typeCells.find(({parent}) => parent === id);
      assert.equal(typeCell?.id, `${id}-type`, `Draw.io node ${id} stable type child ID`);
      assert.equal(typeCell?.label, typeLabel, `Draw.io node ${id} visible type child`);
      assert.match(typeCell?.style ?? '', /(?:^|;)text(?:;|$)/u, `Draw.io node ${id} type is text`);
    }
  }

  const drawioEdges = new Map(drawioContract.edges.map((edge) => [edge.id, edge]));
  const svgEdges = new Map(svgContract.edges.map((edge) => [edge.id, edge]));
  assert.equal(drawioEdges.size, drawioContract.edges.length, 'unique Draw.io edge IDs');
  assert.equal(svgEdges.size, svgContract.edges.length, 'unique SVG edge IDs');
  assert.deepEqual([...drawioEdges.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort(),
    'exact Draw.io relation inventory');
  assert.deepEqual([...svgEdges.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort(),
    'exact SVG relation inventory');
  for (const [id, source, target, label, connectorClass] of DIAGRAM_EDGES) {
    const drawioEdge = drawioEdges.get(id);
    const svgEdge = svgEdges.get(id);
    assert.deepEqual([drawioEdge?.source, drawioEdge?.target, drawioEdge?.label], [source, target, label],
      `Draw.io edge ${id}`);
    assert.deepEqual([svgEdge?.source, svgEdge?.target, svgEdge?.label], [source, target, label],
      `SVG edge ${id}`);
    assert.equal(/(?:^|;)dashed=1(?:;|$)/u.test(drawioEdge?.style ?? ''), connectorClass === 'event',
      `Draw.io edge ${id} line class`);
    assert.ok(svgEdge?.className.split(/\s+/u).includes(connectorClass), `SVG edge ${id} ${connectorClass} class`);
  }

  for (const geometryOf of [
    (id) => drawioCellGeometry(drawio, id),
    (id) => svgCellGeometry(svg, id),
  ]) {
    const deployment = geometryOf('deployment-boundary');
    for (const id of [
      ...MODULES.map((module) => `${module}-module-boundary`),
      'event-publication', 'shared-process-failure-domain',
    ]) assert.ok(contains(deployment, geometryOf(id)), `deployment-boundary contains ${id}`);
    for (const module of MODULES) {
      const boundary = geometryOf(`${module}-module-boundary`);
      for (const id of [
        `${module}-public-contract`, `${module}-internal-implementation`, `${module}-owned-data`,
      ]) assert.ok(contains(boundary, geometryOf(id)), `${module}-module-boundary contains ${id}`);
    }
    assert.ok(contains(geometryOf('order-owned-data'), geometryOf('outbox')), 'order-owned-data contains outbox');
  }

  for (const edge of [...drawioEdges.values(), ...svgEdges.values()]) {
    const protectedTarget = edge.target?.match(/^(order|inventory|payment|notification)-(internal-implementation|owned-data)$/u);
    if (!protectedTarget) continue;
    const [targetModule] = protectedTarget.slice(1);
    assert.match(edge.source ?? '', new RegExp(`^${targetModule}-(?:public-contract|internal-implementation)$`, 'u'),
      `${edge.id} cannot cross a module's internal/data boundary`);
  }
  for (const [lineId, connectorClass] of [['legend-sync-line', 'sync'], ['legend-event-line', 'event']]) {
    assert.match(drawio,
      new RegExp(`<mxCell\\b(?=[^>]*\\bid="${lineId}")(?=[^>]*\\blegendLine="${connectorClass}")[^>]*>`, 'u'),
      `Draw.io ${lineId}`);
    assert.match(svg,
      new RegExp(`<g\\b[^>]*data-node-id="${lineId}"[^>]*data-legend-line="${connectorClass}"[^>]*>`, 'u'),
      `SVG ${lineId}`);
  }
});
