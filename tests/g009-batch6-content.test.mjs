import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const TOPIC_ID = 'STY-05';
const ROUTE = '/styles/sty-05';
const ARTICLE = 'content/styles/sty-05-microservices.mdx';
const DRAWIO = 'diagrams/sty-05-microservices-order-saga.drawio';
const SVG = 'static/img/diagrams/sty-05-microservices-order-saga.svg';
const SOURCE_IDS = [
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-microservicesio-database-per-service',
  'src-microservicesio-saga',
  'src-aws-decompose-business-capability',
  'src-atlas-sty05-microservices-order-saga',
];
const REQUIRED_HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];

const DEPLOYMENT_IDS = [
  'order-service-boundary', 'inventory-service-boundary',
  'payment-service-boundary', 'notification-service-boundary',
];
const DATA_IDS = [
  'order-data', 'inventory-data', 'payment-data', 'notification-data',
];
const PLATFORM_IDS = [
  'api-entry', 'message-broker', 'payment-provider', 'observability-platform',
];
const RECOVERY_IDS = [
  'order-saga-state', 'order-outbox', 'inventory-outbox', 'payment-outbox',
  'notification-outbox', 'payment-reconciliation', 'poison-message-isolation',
];
const PROHIBITED = [
  '微服务由代码行数定义', '容器等于微服务', '远程调用等于微服务',
  '共享数据库仍可由任意服务直接写入', '跨服务事务天然原子',
  'Saga 自动回滚外部副作用', 'Outbox 保证 exactly-once',
  '支付结果未知时直接重复扣款', '拆成服务后天然故障隔离',
];

const ILLUSTRATION_SOURCE_ID = 'src-atlas-sty05-microservices-order-saga';
const ILLUSTRATION_URL = '/img/diagrams/sty-05-microservices-order-saga.svg';
const ADJACENT_TOPICS = ['STY-03', 'STY-04'];
const ADJACENT_ROUTES = ['/styles/sty-03', '/styles/sty-04'];
const SERVICE_KEYS = ['order', 'inventory', 'payment', 'notification'];
const SERVICE_CHILDREN = new Map([
  ['order', ['order-contract', 'order-handler', 'order-data', 'order-saga-state', 'order-outbox', 'order-consumer-dedup']],
  ['inventory', ['inventory-contract', 'inventory-handler', 'inventory-data', 'inventory-outbox', 'inventory-consumer-dedup']],
  ['payment', ['payment-contract', 'payment-dispatcher', 'payment-data', 'payment-outbox', 'payment-reconciliation', 'payment-consumer-dedup']],
  ['notification', ['notification-contract', 'notification-worker', 'notification-data', 'notification-outbox', 'notification-consumer-dedup']],
]);
const LEGEND_IDS = ['legend-sync-line', 'legend-message-line', 'legend-compensation-line'];
const DIAGRAM_NODES = [
  ['client', '客户端', '请求方 / Client'],
  ['order-service-boundary', '订单服务', '独立部署边界 / Deployment Boundary'],
  ['inventory-service-boundary', '库存服务', '独立部署边界 / Deployment Boundary'],
  ['payment-service-boundary', '支付服务', '独立部署边界 / Deployment Boundary'],
  ['notification-service-boundary', '通知服务', '独立部署边界 / Deployment Boundary'],
  ['order-contract', '订单合同', '公开合同 / Public Contract'],
  ['order-handler', '订单处理器', '内部实现 / Internal Implementation'],
  ['order-data', '订单权威数据', '私有数据 / Authoritative Data'],
  ['order-saga-state', '订单 Saga 状态', '持久恢复状态 / Durable State'],
  ['order-outbox', '订单 Outbox', '本地事务发件箱 / Outbox'],
  ['order-consumer-dedup', '订单消费去重', '稳定幂等键 / Deduplication'],
  ['inventory-contract', '库存合同', '公开合同 / Public Contract'],
  ['inventory-handler', '库存处理器', '内部实现 / Internal Implementation'],
  ['inventory-data', '库存权威数据', '私有数据 / Authoritative Data'],
  ['inventory-outbox', '库存 Outbox', '本地事务发件箱 / Outbox'],
  ['inventory-consumer-dedup', '库存消费去重', '稳定幂等键 / Deduplication'],
  ['payment-contract', '支付合同', '公开合同 / Public Contract'],
  ['payment-dispatcher', '支付持久 Dispatcher', '内部实现 / Internal Implementation'],
  ['payment-data', '支付意图与结果', '私有数据 / Authoritative Data'],
  ['payment-outbox', '支付 Outbox', '本地事务发件箱 / Outbox'],
  ['payment-reconciliation', '未知结果查询与对账', '恢复路径 / Reconciliation'],
  ['payment-consumer-dedup', '支付消费去重', '稳定幂等键 / Deduplication'],
  ['notification-contract', '通知合同', '公开合同 / Public Contract'],
  ['notification-worker', '通知工作器', '内部实现 / Internal Implementation'],
  ['notification-data', '通知投递状态', '私有数据 / Authoritative Data'],
  ['notification-outbox', '通知 Outbox', '本地事务发件箱 / Outbox'],
  ['notification-consumer-dedup', '通知消费去重', '稳定幂等键 / Deduplication'],
  ['api-entry', 'API 入口', '共享平台 / Platform'],
  ['message-broker', '消息中间件', '至少一次与重放边界 / Platform'],
  ['payment-provider', '外部支付提供方', '外部副作用 / External System'],
  ['observability-platform', '日志 / 指标 / 追踪', '共享平台 / Observability'],
  ['poison-message-isolation', '毒消息隔离', '修复 / 重放 / 人工终止'],
  ['legend-sync-line', '', ''],
  ['legend-message-line', '', ''],
  ['legend-compensation-line', '', ''],
];
const DIAGRAM_EDGES = [
  ['request-entry', 'client', 'api-entry', '提交订单（稳定幂等键）', 'sync'],
  ['api-order-request', 'api-entry', 'order-contract', '提交订单请求', 'sync'],
  ['order-contract-dispatch', 'order-contract', 'order-handler', '处理请求', 'sync'],
  ['order-owned-data-write', 'order-handler', 'order-data', '本地事务写订单', 'sync'],
  ['order-saga-state-write', 'order-handler', 'order-saga-state', '持久化 Saga', 'sync'],
  ['order-outbox-write', 'order-handler', 'order-outbox', '同事务记录', 'sync'],
  ['order-created', 'order-outbox', 'message-broker', 'OrderCreated', 'message'],
  ['reserve-inventory-command', 'message-broker', 'inventory-contract', 'ReserveInventory', 'message'],
  ['inventory-consumer-deduplication', 'inventory-contract', 'inventory-consumer-dedup', '消费去重', 'sync'],
  ['inventory-contract-dispatch', 'inventory-consumer-dedup', 'inventory-handler', '处理预留', 'sync'],
  ['inventory-owned-data-write', 'inventory-handler', 'inventory-data', '本地事务写预留', 'sync'],
  ['inventory-outbox-write', 'inventory-handler', 'inventory-outbox', '同事务记录', 'sync'],
  ['inventory-reserved-result', 'inventory-outbox', 'message-broker', 'InventoryReserved', 'message'],
  ['inventory-rejected-result', 'inventory-outbox', 'message-broker', 'InventoryRejected', 'message'],
  ['order-result-deduplication', 'message-broker', 'order-consumer-dedup', '结果去重', 'message'],
  ['register-payment-intent', 'order-outbox', 'message-broker', 'RegisterPaymentIntent', 'message'],
  ['payment-command-delivery', 'message-broker', 'payment-contract', '登记支付意图', 'message'],
  ['payment-consumer-deduplication', 'payment-contract', 'payment-consumer-dedup', '消费去重', 'sync'],
  ['payment-contract-dispatch', 'payment-consumer-dedup', 'payment-dispatcher', '持久执行', 'sync'],
  ['payment-owned-data-write', 'payment-dispatcher', 'payment-data', '本地事务写意图', 'sync'],
  ['payment-outbox-write', 'payment-dispatcher', 'payment-outbox', '同事务记录', 'sync'],
  ['provider-authorization', 'payment-dispatcher', 'payment-provider', '授权 / 扣款（稳定幂等键）', 'sync'],
  ['provider-result', 'payment-provider', 'payment-dispatcher', '确认 / 拒绝 / 未知', 'sync'],
  ['payment-unknown-reconciliation', 'payment-dispatcher', 'payment-reconciliation', '未知结果先查询 / 对账', 'sync'],
  ['payment-confirmed', 'payment-outbox', 'message-broker', 'PaymentConfirmed', 'message'],
  ['payment-rejected', 'payment-outbox', 'message-broker', 'PaymentRejected', 'message'],
  ['payment-unknown', 'payment-outbox', 'message-broker', 'PaymentUnknown', 'message'],
  ['order-confirmed', 'order-outbox', 'message-broker', 'OrderConfirmed', 'message'],
  ['notification-delivery', 'message-broker', 'notification-contract', 'DeliverNotification', 'message'],
  ['notification-consumer-deduplication', 'notification-contract', 'notification-consumer-dedup', '消费去重', 'sync'],
  ['notification-contract-dispatch', 'notification-consumer-dedup', 'notification-worker', '重试投递', 'sync'],
  ['notification-owned-data-write', 'notification-worker', 'notification-data', '本地事务写投递状态', 'sync'],
  ['notification-outbox-write', 'notification-worker', 'notification-outbox', '同事务记录', 'sync'],
  ['release-inventory-compensation', 'message-broker', 'inventory-contract', 'ReleaseInventory', 'compensation'],
  ['payment-void-reversal-refund', 'message-broker', 'payment-contract', 'Void / Reversal / Refund', 'compensation'],
  ['poison-message-routing', 'message-broker', 'poison-message-isolation', '隔离毒消息', 'message'],
  ['order-observability-signal', 'order-handler', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
  ['inventory-observability-signal', 'inventory-handler', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
  ['payment-observability-signal', 'payment-dispatcher', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
  ['notification-observability-signal', 'notification-worker', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
];
const SOURCE_CONTRACTS = [
  ['src-lewis-fowler-microservices', 'https://martinfowler.com/articles/microservices.html', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', ['comparison', 'definition'], true],
  ['src-microsoft-microservices-architecture-style', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices', 'CC-BY-4.0', 'vendor-claims-separated', ['comparison', 'runtime-fact'], false],
  ['src-microservicesio-database-per-service', 'https://microservices.io/patterns/data/database-per-service.html', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', ['method', 'runtime-fact'], false],
  ['src-microservicesio-saga', 'https://microservices.io/patterns/data/saga.html', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', ['method', 'runtime-fact'], false],
  ['src-aws-decompose-business-capability', 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/decompose-business-capability.html', 'LicenseRef-All-Rights-Reserved', 'vendor-claims-separated', ['method'], false],
  [ILLUSTRATION_SOURCE_ID, ILLUSTRATION_URL, 'LicenseRef-Atlas-Original', 'original-atlas', ['illustration'], false],
];
const PROHIBITED_PATTERNS = [
  /微服务.{0,12}(?:由|按).{0,8}代码行数定义/iu,
  /容器.{0,8}(?:等于|就是|即为|天然成为).{0,8}微服务/iu,
  /远程调用.{0,8}(?:等于|就是|即为|天然成为).{0,8}微服务/iu,
  /共享数据库.{0,20}(?:任意|任何|所有)服务.{0,12}(?:直接)?写入/iu,
  /跨服务事务.{0,12}(?:天然|自动|默认).{0,8}原子/iu,
  /Saga.{0,12}(?:自动|天然).{0,8}回滚.{0,10}外部副作用/iu,
  /Outbox.{0,16}(?:保证|确保|实现).{0,8}(?:exactly[- ]once|恰好一次|仅一次)/iu,
  /支付结果未知.{0,16}(?:直接|立即|盲目).{0,8}重复(?:授权|扣款)/iu,
  /拆成服务.{0,16}(?:天然|自动|必然).{0,8}故障隔离/iu,
];

const [ledger, licenseInventory, manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const article = documents.find(({file}) => `content/${file}` === ARTICLE);
const sty03 = documents.find(({file}) => file === 'styles/sty-03-vertical-slice-architecture.mdx');
const sty04 = documents.find(({file}) => file === 'styles/sty-04-modular-monolith.mdx');
const moduleBoundaries = documents.find(({file}) => file === 'paths/02-module-boundaries.mdx');

function internalLinksOf(document) {
  return extractInternalLinks({body: document.body});
}

function externalLinksOf(document) {
  return extractExternalLinks({body: document.body});
}

function assertNoProhibitedClaims(source) {
  for (const pattern of PROHIBITED_PATTERNS) assert.doesNotMatch(source, pattern, String(pattern));
}

function xmlAttributes(source) {
  return new Map([...source.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value]));
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
    typeCells,
    edges: cells.filter(({attributes}) => attributes.get('edge') === '1')
      .map(({attributes, label}) => ({
        id: attributes.get('id'), label, source: attributes.get('source'), target: attributes.get('target'),
        style: attributes.get('style') ?? '',
      })),
  };
}

function svgDiagramContract(source) {
  const nodes = [...source.matchAll(/<g\b([^>]*)data-node-id="([^"]+)"([^>]*)>([\s\S]*?)<\/g>/gu)]
    .map(([, before, id, after, contents]) => ({
      id,
      label: decodeXmlText(contents.match(/<text\b[^>]*data-text-role="title"[^>]*>([^<]*)<\/text>/u)?.[1] ?? ''),
      typeLabel: decodeXmlText(xmlAttributes(`${before}${after}`).get('data-type-label') ?? ''),
      visibleTypeLabel: decodeXmlText(contents.match(/<text\b[^>]*data-text-role="type"[^>]*>([^<]*)<\/text>/u)?.[1] ?? ''),
    }));
  const labels = new Map([...source.matchAll(/<text\b[^>]*data-edge-id="([^"]+)"[^>]*>([^<]*)<\/text>/gu)]
    .map(([, id, label]) => [id, decodeXmlText(label).trim()]));
  const edges = [...source.matchAll(/<path\b([^>]*)data-edge-id="([^"]+)"([^>]*)>/gu)]
    .map(([, before, id, after]) => {
      const attributes = xmlAttributes(`${before}${after}`);
      return {id, label: labels.get(id) ?? '', source: attributes.get('data-source'),
        target: attributes.get('data-target'), className: attributes.get('class') ?? ''};
    });
  return {nodes, edges};
}

function cellGeometry(source, id, format) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  if (format === 'drawio') {
    const block = source.match(new RegExp(`<mxCell\\b[^>]*\\bid="${escapedId}"[^>]*>([\\s\\S]*?)<\\/mxCell>`, 'u'))?.[1];
    assert.ok(block, `Draw.io geometry ${id}`);
    const geometry = xmlAttributes(block.match(/<mxGeometry\b([^>]*)\/?>(?:<\/mxGeometry>)?/u)?.[1] ?? '');
    return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(geometry.get(key))]));
  }
  const bounds = source.match(new RegExp(`<g\\b[^>]*data-node-id="${escapedId}"[^>]*data-node-bounds="([^"]+)"`, 'u'))?.[1];
  assert.ok(bounds, `SVG geometry ${id}`);
  const [x, y, width, height] = bounds.split(/\s+/u).map(Number);
  return {x, y, width, height};
}

function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}

function overlaps(first, second) {
  return first.x < second.x + second.width && first.x + first.width > second.x &&
    first.y < second.y + second.height && first.y + first.height > second.y;
}

function cssDeclarations(source) {
  return new Map(source.split(';').map((value) => value.trim()).filter(Boolean).map((declaration) => {
    const split = declaration.indexOf(':');
    return [declaration.slice(0, split).trim(), declaration.slice(split + 1).trim()];
  }));
}

function svgPresentationValue(source, elementName, attributesSource, property, inheritedClasses = []) {
  const attributes = xmlAttributes(attributesSource);
  const inline = cssDeclarations(attributes.get('style') ?? '').get(property);
  if (inline !== undefined) return inline;
  const classes = new Set([...inheritedClasses, ...(attributes.get('class') ?? '').split(/\s+/u).filter(Boolean)]);
  let resolved = attributes.get(property);
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      const value = cssDeclarations(declarations).get(property);
      if (value === undefined) continue;
      for (const rawSelector of selectors.split(',')) {
        const selector = rawSelector.trim();
        if (/^[a-z][\w-]*/iu.test(selector) && !selector.startsWith(elementName)) continue;
        const required = [...selector.matchAll(/\.([\w-]+)/gu)].map(([, className]) => className);
        if (required.every((className) => classes.has(className))) resolved = value;
      }
    }
  }
  return resolved?.replace(/\s*!important\s*$/iu, '');
}

function strokeDashKind(value) {
  if (value?.trim().toLowerCase() === 'none') return 'solid';
  const values = value?.trim().split(/[\s,]+/u) ?? [];
  if (values.length === 0 || values.some((item) => !/^\d+(?:\.\d+)?(?:px)?$/u.test(item))) return 'invalid';
  return values.some((item) => Number.parseFloat(item) > 0) ? 'dashed' : 'invalid';
}

function svgEdgeDashArray(source, id) {
  const edge = source.match(new RegExp(`<path\\b([^>]*)data-edge-id="${id}"([^>]*)>`, 'u'));
  assert.ok(edge, `SVG edge ${id}`);
  return svgPresentationValue(source, 'path', `${edge[1]}${edge[2]}`, 'stroke-dasharray');
}

function normalizeHexColor(value) {
  const match = value?.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/iu);
  assert.ok(match, `opaque hex color ${String(value)}`);
  return `#${match[1].length === 3 ? [...match[1]].map((item) => item.repeat(2)).join('') : match[1]}`.toUpperCase();
}

function luminance(color) {
  const channels = normalizeHexColor(color).slice(1).match(/.{2}/gu).map((item) => Number.parseInt(item, 16) / 255)
    .map((item) => item <= 0.04045 ? item / 12.92 : ((item + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(left, right) {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function assertEssentialContrast(source) {
  const canvas = source.match(/<rect\b([^>]*)data-canvas-role="background"([^>]*)>/u);
  assert.ok(canvas, 'opaque canvas');
  const canvasColor = normalizeHexColor(svgPresentationValue(source, 'rect', `${canvas[1]}${canvas[2]}`, 'fill'));
  assert.equal(canvasColor, '#FFFFFF');
  for (const [id, , , , connectorClass] of DIAGRAM_EDGES) {
    const edge = source.match(new RegExp(`<path\\b([^>]*)data-edge-id="${id}"([^>]*)>`, 'u'));
    const label = source.match(new RegExp(`<text\\b([^>]*)data-edge-id="${id}"([^>]*)>`, 'u'));
    assert.ok(edge && label, `${id} edge and label`);
    const edgeColor = svgPresentationValue(source, 'path', `${edge[1]}${edge[2]}`, 'stroke');
    const labelColor = svgPresentationValue(source, 'text', `${label[1]}${label[2]}`, 'fill');
    assert.ok(contrastRatio(edgeColor, canvasColor) >= 3, `${connectorClass} edge ${id} contrast`);
    assert.ok(contrastRatio(labelColor, canvasColor) >= 4.5, `edge label ${id} contrast`);
  }
}

function parseOrthogonalPath(data) {
  const tokens = data.match(/[MHV]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? [];
  const points = [];
  let cursor = 0;
  let x = 0;
  let y = 0;
  while (cursor < tokens.length) {
    const command = tokens[cursor];
    cursor += 1;
    if (command === 'M') {
      x = Number(tokens[cursor]);
      y = Number(tokens[cursor + 1]);
      cursor += 2;
    } else if (command === 'H') {
      x = Number(tokens[cursor]);
      cursor += 1;
    } else if (command === 'V') {
      y = Number(tokens[cursor]);
      cursor += 1;
    } else {
      throw new Error(`Unsupported path command ${command}`);
    }
    points.push({x, y});
  }
  assert.ok(points.length >= 2, `orthogonal connector has at least two points: ${data}`);
  return points;
}

function conservativeTextWidth(text, fontSize) {
  return [...text].reduce((width, character) => {
    if (/\p{Script=Han}/u.test(character)) return width + fontSize;
    if (/\s/u.test(character)) return width + fontSize * 0.33;
    if (character === '/') return width + fontSize * 0.4;
    return width + fontSize * 0.6;
  }, 0);
}

function labelBounds(tag, label, fontSize) {
  const attributes = xmlAttributes(tag);
  const x = Number(attributes.get('x'));
  const bottom = Number(attributes.get('y'));
  const width = conservativeTextWidth(label, fontSize);
  const anchor = attributes.get('text-anchor') || 'start';
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return {bottom, left, right: left + width, top: bottom - fontSize};
}

function rectangleDistance(first, second) {
  const horizontal = Math.max(second.left - first.right, first.left - second.right, 0);
  const vertical = Math.max(second.top - first.bottom, first.top - second.bottom, 0);
  return Math.hypot(horizontal, vertical);
}

function expandedRectangle(rectangle, expansion) {
  return {bottom: rectangle.bottom + expansion, left: rectangle.left - expansion,
    right: rectangle.right + expansion, top: rectangle.top - expansion};
}

function boundaryStrokeDistance(label, boundary, strokeWidth) {
  const inside = label.left >= boundary.left && label.right <= boundary.right &&
    label.top >= boundary.top && label.bottom <= boundary.bottom;
  if (!inside) return rectangleDistance(label, expandedRectangle(boundary, strokeWidth / 2));
  return Math.min(
    label.left - boundary.left - strokeWidth / 2,
    boundary.right - strokeWidth / 2 - label.right,
    label.top - boundary.top - strokeWidth / 2,
    boundary.bottom - strokeWidth / 2 - label.bottom,
  );
}

function segmentDistance(label, start, end) {
  return rectangleDistance(label, {bottom: Math.max(start.y, end.y), left: Math.min(start.x, end.x),
    right: Math.max(start.x, end.x), top: Math.min(start.y, end.y)});
}

function projectedInterval(points, axis) {
  const values = points.map((point) => point.x * axis.x + point.y * axis.y);
  return {maximum: Math.max(...values), minimum: Math.min(...values)};
}

function intervalGap(first, second) {
  return Math.max(second.minimum - first.maximum, first.minimum - second.maximum);
}

function markerGeometry(svg, connectorTag, points) {
  const markerId = svgPresentationValue(svg, 'path', connectorTag, 'marker-end')
    ?.match(/^url\(#([^)]+)\)$/u)?.[1];
  assert.ok(markerId, 'connector marker-end');
  const markerBlock = svg.match(new RegExp(`<marker\\b[^>]*\\bid="${markerId}"[^>]*>[\\s\\S]*?<\\/marker>`, 'u'))?.[0] ?? '';
  const markerTag = markerBlock.match(/<marker\b[^>]*>/u)?.[0] ?? '';
  const markerPath = markerBlock.match(/<path\b[^>]*>/u)?.[0] ?? '';
  const markerAttributes = xmlAttributes(markerTag);
  const coordinates = (xmlAttributes(markerPath).get('d')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number);
  const endpoint = points.at(-1);
  const previous = points.at(-2);
  const magnitude = Math.hypot(endpoint.x - previous.x, endpoint.y - previous.y);
  const axis = {x: (endpoint.x - previous.x) / magnitude, y: (endpoint.y - previous.y) / magnitude};
  const perpendicular = {x: -axis.y, y: axis.x};
  const viewBox = (markerAttributes.get('viewBox') ?? '').split(/\s+/u).map(Number);
  const scale = Number(markerAttributes.get('markerWidth')) / viewBox[2] *
    Number(svgPresentationValue(svg, 'path', connectorTag, 'stroke-width'));
  assert.ok(Number.isFinite(scale) && scale > 0, `${markerId} marker scale`);
  const refX = Number(markerAttributes.get('refX'));
  const refY = Number(markerAttributes.get('refY'));
  const markerPoints = [];
  for (let index = 0; index < coordinates.length; index += 2) {
    markerPoints.push({
      x: endpoint.x + axis.x * (coordinates[index] - refX) * scale +
        perpendicular.x * (coordinates[index + 1] - refY) * scale,
      y: endpoint.y + axis.y * (coordinates[index] - refX) * scale +
        perpendicular.y * (coordinates[index + 1] - refY) * scale,
    });
  }
  assert.ok(markerPoints.length >= 3 && markerPoints.every(({x: pointX, y: pointY}) =>
    Number.isFinite(pointX) && Number.isFinite(pointY)), `${markerId} marker geometry`);
  return {axis, points: markerPoints};
}

test('publishes exact STY-05 metadata, headings, and actionable relations', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const metadata = parseFrontMatter(article.source);
  assert.equal(metadata.topic_id, TOPIC_ID);
  assert.equal(metadata.slug, ROUTE);
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.priority, 'P0');
  assert.deepEqual(metadata.depends_on, ['STY-00', 'STY-04']);
  assert.deepEqual(metadata.adjacent_topics, ADJACENT_TOPICS);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(findMarkdownHeadings(article.body).map(({text}) => text), REQUIRED_HEADINGS);
  const links = internalLinksOf(article);
  for (const route of [...ADJACENT_ROUTES, '/cases/micro-frontends-single-spa']) {
    assert.ok(links.includes(route), `visible relation ${route}`);
  }
  assert.equal(links.includes('/styles/sty-06'), false, 'STY-06 stays non-actionable');
  assert.ok(sty03 && parseFrontMatter(sty03.source).adjacent_topics.includes(TOPIC_ID), 'STY-03 reciprocal metadata');
  assert.ok(sty03 && internalLinksOf(sty03).includes(ROUTE), 'STY-03 reciprocal route');
  assert.ok(sty04 && parseFrontMatter(sty04.source).adjacent_topics.includes(TOPIC_ID), 'STY-04 reciprocal metadata');
  assert.ok(sty04 && internalLinksOf(sty04).includes(ROUTE), 'STY-04 reciprocal route');
  assert.ok(moduleBoundaries && internalLinksOf(moduleBoundaries).includes(ROUTE), 'module-boundaries path route');
});

test('locks microservice boundaries, the order Saga, and owned runtime responsibility', () => {
  assert.ok(article);
  const visible = parseMdxVisibleCopy(article.source, ARTICLE).blocks.map(({text}) => text).join('\n');
  for (const requirement of [
    /业务能力|稳定子域/u, /稳定合同/u, /独立(?:构建|验证|发布)/u, /独立回滚/u, /锁步发布/u,
    /私有权威数据|权威状态.*唯一服务所有者/u, /禁止.*(?:共享表|跨服务直接写库|跨库连接)/u,
    /本地事务/u, /Outbox/u, /持久.*Saga|Saga.*持久/u, /稳定幂等键/u,
    /重复/u, /乱序/u, /部分成功/u, /毒消息/u, /补偿/u, /查询|对账/u, /人工终止/u,
    /支付结果未知|结果未知/u, /不(?:盲目|直接)重复(?:授权|扣款)/u,
    /服务合同.*数据.*部署.*值守.*恢复.*成本|端到端.*(?:值守|恢复)/u,
    /平台.*(?:不拥有|不能拥有).*业务状态/u,
  ]) assert.match(visible, requirement, `semantic contract ${requirement}`);
  assertNoProhibitedClaims(visible);
});

test('prohibited claim mutations are rejected while explicit boundaries remain expressible', () => {
  assert.equal(PROHIBITED.length, PROHIBITED_PATTERNS.length);
  for (let index = 0; index < PROHIBITED.length; index += 1) {
    assert.throws(() => assertNoProhibitedClaims(PROHIBITED[index]), {name: 'AssertionError'}, PROHIBITED[index]);
  }
  assert.doesNotThrow(() => assertNoProhibitedClaims(
    '容器并非微服务；跨服务事务不具备分布式原子性；Outbox 无法提供 exactly-once；禁止在未知支付结果时重复扣款。',
  ));
});

test('governs six sources, three remote domains, rights, and one manifest primary', () => {
  const records = SOURCE_IDS.map((id) => ledger.sources.find((source) => source.id === id));
  assert.ok(records.every(Boolean), 'all STY-05 source records');
  const documentRecord = ledger.documents[ARTICLE];
  assert.ok(documentRecord, `${ARTICLE} citation record`);
  assert.deepEqual(documentRecord.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(documentRecord.citations.map(({source_id}) => source_id).sort(), [...SOURCE_IDS].sort());
  assert.equal(documentRecord.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  for (const [id, locator, license, copyrightPolicy, roles, manifestPrimary] of SOURCE_CONTRACTS) {
    const source = ledger.sources.find((candidate) => candidate.id === id);
    const citation = documentRecord.citations.find(({source_id}) => source_id === id);
    assert.equal(source.canonical_locator, locator, `${id} locator`);
    assert.equal(source.license, license, `${id} license`);
    assert.equal(source.copyright_policy, copyrightPolicy, `${id} copyright policy`);
    assert.ok(source.license_scope && source.license_evidence_url && source.license_evidence_note, `${id} license evidence`);
    assert.ok(source.usage_boundary && source.expected_final_approval_note, `${id} evidence boundary`);
    assert.deepEqual(citation.roles, roles, `${id} citation roles`);
    assert.equal(citation.manifest_primary, manifestPrimary, `${id} primary eligibility`);
    assert.ok(citation.attribution_note && citation.usage_mode, `${id} attribution and usage mode`);
    assert.match(licenseInventory, new RegExp(`\\| \\x60${id}\\x60 \\|`, 'u'), `${id} license inventory`);
  }
  const remoteDomains = new Set(externalLinksOf(article).map((url) => new URL(url).hostname));
  assert.ok(remoteDomains.size >= 3, 'at least three independent remote source domains');
  assert.deepEqual(externalLinksOf(article).sort(), SOURCE_CONTRACTS.slice(0, 5).map(([, url]) => url).sort());
});

test('projects the exact STY-05 Stage A pre-closure state', () => {
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID);
  assert.equal(topic?.slug, ROUTE);
  assert.equal(topic?.published, true);
  assert.equal(topic?.status.value, 'pending');
  assert.deepEqual(topic?.dependencies, ['STY-00', 'STY-04']);
  assert.deepEqual(topic?.adjacent_topics, ADJACENT_TOPICS);
  assert.deepEqual(topic?.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(topic?.primary_sources, ['https://martinfowler.com/articles/microservices.html']);
  const nextTopic = manifest.topics.find(({id}) => id === 'STY-06');
  assert.equal(nextTopic?.published, false);
  assert.equal(nextTopic?.status.value, 'pending');
  assert.equal(indexes.style.find(({id}) => id === TOPIC_ID)?.published, true);
  assert.equal(indexes.style.find(({id}) => id === 'STY-06')?.published, false);
  assert.equal(projectStatus.completed_topics, 57);
  assert.equal(projectStatus.content_documents, 100);
  assert.equal(projectStatus.governed_sources, 519);
  assert.equal(publicLedger.sources.length, 519);
  const publishedRoutes = manifest.topics.filter(({published}) => published).map(({slug}) => slug);
  assert.ok(publishedRoutes.includes(ROUTE));
  assert.equal(publishedRoutes.includes('/styles/sty-06'), false);
  for (const document of documents) {
    assert.equal(internalLinksOf(document).includes('/styles/sty-06'), false, `${document.file} STY-06 route`);
  }
});

test('publishes synchronized Draw.io and SVG inventories, containment, and connector semantics', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<title\b[^>]*>[^<]*微服务[^<]*订单[^<]*Saga[^<]*<\/title>/u);
  assert.match(svg, /<desc\b[^>]*>[^<]*(?=[^<]*独立部署)(?=[^<]*私有)(?=[^<]*Saga)(?=[^<]*补偿)(?=[^<]*对账)[^<]*<\/desc>/u);
  const root = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.match(root, /\bviewBox="0 0 [0-9.]+ [0-9.]+"/u);
  assert.match(root, /\brole="img"/u);
  assert.doesNotMatch(root, /\b(?:width|height)="/u);
  assert.match(svg, /<rect\b(?=[^>]*data-canvas-role="background")(?=[^>]*fill="#FFFFFF")[^>]*>/u);

  const drawioContract = drawioDiagramContract(drawio);
  const svgContract = svgDiagramContract(svg);
  const drawioNodes = new Map(drawioContract.nodes.map((node) => [node.id, node]));
  const svgNodes = new Map(svgContract.nodes.map((node) => [node.id, node]));
  assert.deepEqual([...drawioNodes.keys()].sort(), DIAGRAM_NODES.map(([id]) => id).sort());
  assert.deepEqual([...svgNodes.keys()].sort(), DIAGRAM_NODES.map(([id]) => id).sort());
  for (const [id, label, typeLabel] of DIAGRAM_NODES) {
    assert.deepEqual([drawioNodes.get(id)?.label, drawioNodes.get(id)?.visibleTypeLabel], [label, typeLabel], `Draw.io ${id}`);
    assert.deepEqual([svgNodes.get(id)?.label, svgNodes.get(id)?.typeLabel, svgNodes.get(id)?.visibleTypeLabel],
      [label, typeLabel, typeLabel], `SVG ${id}`);
  }
  assert.deepEqual([...DEPLOYMENT_IDS].sort(), SERVICE_KEYS.map((key) => `${key}-service-boundary`).sort());
  assert.deepEqual([...DATA_IDS].sort(), SERVICE_KEYS.map((key) => `${key}-data`).sort());
  assert.ok(PLATFORM_IDS.every((id) => svgNodes.has(id)) && RECOVERY_IDS.every((id) => svgNodes.has(id)));

  const drawioEdges = new Map(drawioContract.edges.map((edge) => [edge.id, edge]));
  const svgEdges = new Map(svgContract.edges.map((edge) => [edge.id, edge]));
  assert.deepEqual([...drawioEdges.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort());
  assert.deepEqual([...svgEdges.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort());
  for (const [id, source, target, label, connectorClass] of DIAGRAM_EDGES) {
    const drawioEdge = drawioEdges.get(id);
    const svgEdge = svgEdges.get(id);
    assert.deepEqual([drawioEdge?.source, drawioEdge?.target, drawioEdge?.label], [source, target, label], `Draw.io ${id}`);
    assert.deepEqual([svgEdge?.source, svgEdge?.target, svgEdge?.label], [source, target, label], `SVG ${id}`);
    assert.ok(svgEdge?.className.split(/\s+/u).includes(connectorClass), `SVG ${id} ${connectorClass}`);
    assert.equal(/(?:^|;)dashed=1(?:;|$)/u.test(drawioEdge?.style ?? ''), connectorClass !== 'sync', `Draw.io ${id} dash`);
    assert.equal(strokeDashKind(svgEdgeDashArray(svg, id)), connectorClass === 'sync' ? 'solid' : 'dashed', `SVG ${id} dash`);
    if (connectorClass === 'compensation') {
      assert.match(drawioEdge?.style ?? '', /(?:^|;)strokeColor=#[0-9A-Fa-f]{6}(?:;|$)/u, `${id} compensation color`);
      assert.match(svgEdge?.className ?? '', /(?:^|\s)compensation(?:\s|$)/u, `${id} compensation class`);
    }
  }

  for (const format of ['drawio', 'svg']) {
    const source = format === 'drawio' ? drawio : svg;
    for (const key of SERVICE_KEYS) {
      const boundary = cellGeometry(source, `${key}-service-boundary`, format);
      for (const id of SERVICE_CHILDREN.get(key)) assert.ok(contains(boundary, cellGeometry(source, id, format)), `${format} ${key} contains ${id}`);
    }
    for (let left = 0; left < DEPLOYMENT_IDS.length; left += 1) {
      for (let right = left + 1; right < DEPLOYMENT_IDS.length; right += 1) {
        assert.equal(overlaps(cellGeometry(source, DEPLOYMENT_IDS[left], format), cellGeometry(source, DEPLOYMENT_IDS[right], format)), false,
          `${format} deployment regions do not overlap`);
      }
    }
  }
  for (const edge of [...drawioEdges.values(), ...svgEdges.values()]) {
    const dataTarget = edge.target?.match(/^(order|inventory|payment|notification)-data$/u);
    if (dataTarget) assert.match(edge.source ?? '', new RegExp(`^${dataTarget[1]}-`, 'u'), `${edge.id} owned-data writer`);
  }
  for (const [id, connectorClass] of [['legend-sync-line', 'sync'], ['legend-message-line', 'message'], ['legend-compensation-line', 'compensation']]) {
    assert.match(drawio, new RegExp(`<mxCell\\b(?=[^>]*\\bid="${id}")(?=[^>]*\\blegendLine="${connectorClass}")[^>]*>`, 'u'));
    assert.match(svg, new RegExp(`<g\\b[^>]*data-node-id="${id}"[^>]*data-legend-line="${connectorClass}"[^>]*>`, 'u'));
  }
});

test('keeps marker-aware label clearances and selector-bound contrast mutation-sensitive', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  const root = xmlAttributes(svg.match(/<svg\b[^>]*>/u)?.[0] ?? '');
  for (const [attribute, minimum] of [
    ['data-edge-stroke-clearance-css', 8], ['data-edge-marker-clearance-css', 16],
    ['data-edge-node-clearance-css', 12], ['data-edge-boundary-clearance-css', 12],
    ['data-header-inner-stroke-padding-css', 12],
  ]) assert.ok(Number(root.get(attribute)) >= minimum, `${attribute} >= ${minimum}`);
  const renderedScale = Number(root.get('data-authoring-to-render-scale'));
  assert.ok(Number.isFinite(renderedScale) && renderedScale > 0 && renderedScale <= 1,
    'positive authoring-to-render scale');
  const fontSize = Number.parseFloat(svgPresentationValue(svg, 'text', 'class="edge-label"', 'font-size'));
  assert.ok(Number.isFinite(fontSize) && fontSize > 0, 'edge-label font size');
  const boundaryIds = new Set(DEPLOYMENT_IDS);
  const ignoredNodes = new Set(LEGEND_IDS);
  const nodeBounds = new Map();
  const boundaryBounds = new Map();
  for (const [, id, boundsValue, contents] of svg.matchAll(
    /<g\b[^>]*data-node-id="([^"]+)"[^>]*data-node-bounds="([^"]+)"[^>]*>([\s\S]*?)<\/g>/gu,
  )) {
    if (ignoredNodes.has(id)) continue;
    const [x, y, width, height] = boundsValue.split(/\s+/u).map(Number);
    const rectangle = {bottom: y + height, left: x, right: x + width, top: y};
    const outline = contents.match(/<(rect|path)\b([^>]*)>/u);
    assert.ok(outline, `${id} outline`);
    const strokeWidth = Number(svgPresentationValue(svg, outline[1], outline[2], 'stroke-width'));
    assert.ok(Number.isFinite(strokeWidth) && strokeWidth > 0, `${id} stroke width`);
    if (boundaryIds.has(id)) boundaryBounds.set(id, {rectangle, strokeWidth});
    else nodeBounds.set(id, expandedRectangle(rectangle, strokeWidth / 2));
  }
  const connectorTags = new Map([...svg.matchAll(/<path\b[^>]*data-edge-id="([^"]+)"[^>]*>/gu)]
    .map(([tag, id]) => [id, tag]));
  assert.deepEqual([...connectorTags.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort());
  for (const [edgeId, , , expectedLabel] of DIAGRAM_EDGES) {
    const connectorTag = connectorTags.get(edgeId);
    const labelMatch = svg.match(new RegExp(`(<text\\b[^>]*data-edge-id="${edgeId}"[^>]*>)([^<]+)<\\/text>`, 'u'));
    assert.equal(decodeXmlText(labelMatch?.[2] ?? ''), expectedLabel, `${edgeId} visible label`);
    const bounds = labelBounds(labelMatch?.[1] ?? '', expectedLabel, fontSize);
    const ownPoints = parseOrthogonalPath(xmlAttributes(connectorTag).get('d') ?? '');
    const ownMarker = markerGeometry(svg, connectorTag, ownPoints);
    const corners = [
      {x: bounds.left, y: bounds.top}, {x: bounds.right, y: bounds.top},
      {x: bounds.right, y: bounds.bottom}, {x: bounds.left, y: bounds.bottom},
    ];
    const markerClearance = intervalGap(
      projectedInterval(corners, ownMarker.axis), projectedInterval(ownMarker.points, ownMarker.axis),
    ) * renderedScale;
    assert.ok(markerClearance >= 16, `${edgeId} marker clearance ${markerClearance}`);
    for (const [connectorId, otherTag] of connectorTags) {
      const points = parseOrthogonalPath(xmlAttributes(otherTag).get('d') ?? '');
      const halfStroke = Number(svgPresentationValue(svg, 'path', otherTag, 'stroke-width')) / 2;
      const clearance = (Math.min(...points.slice(1).map((point, index) =>
        segmentDistance(bounds, points[index], point))) - halfStroke) * renderedScale;
      assert.ok(clearance >= 8, `${edgeId} to ${connectorId} stroke clearance ${clearance}`);
    }
    for (const [nodeId, rectangle] of nodeBounds) {
      const clearance = rectangleDistance(bounds, rectangle) * renderedScale;
      assert.ok(clearance >= 12, `${edgeId} to ${nodeId} clearance ${clearance}`);
    }
    for (const [boundaryId, {rectangle, strokeWidth}] of boundaryBounds) {
      const clearance = boundaryStrokeDistance(bounds, rectangle, strokeWidth) * renderedScale;
      assert.ok(clearance >= 12, `${edgeId} to ${boundaryId} boundary clearance ${clearance}`);
    }
  }
  assertEssentialContrast(svg);
  assert.doesNotMatch(svg, /prefers-color-scheme|currentColor/u);
  const whiteMessage = svg.replace(/(\.message\s*\{[^}]*\bstroke\s*:\s*)#[0-9A-F]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteMessage, svg, 'message selector mutation applies');
  assert.throws(() => assertEssentialContrast(whiteMessage), {name: 'AssertionError'});
  const whiteLabel = svg.replace(/(\.edge-label\s*\{[^}]*\bfill\s*:\s*)#[0-9A-F]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteLabel, svg, 'edge-label selector mutation applies');
  assert.throws(() => assertEssentialContrast(whiteLabel), {name: 'AssertionError'});
});
