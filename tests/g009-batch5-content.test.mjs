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
  'src-atlas-sty04-modular-monolith-boundaries',
];
const ILLUSTRATION_SOURCE_ID = 'src-atlas-sty04-modular-monolith-boundaries';
const ILLUSTRATION_URL = '/img/diagrams/sty-04-modular-monolith-boundaries.svg';
const REQUIRED_HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];

const SOURCE_URLS = [
  'https://martinfowler.com/bliki/MonolithFirst.html',
  'https://docs.spring.io/spring-modulith/reference/fundamentals.html',
  'https://docs.spring.io/spring-modulith/reference/events.html',
  ILLUSTRATION_URL,
];
const SOURCE_CONTRACTS = [
  {
    id: 'src-fowler-monolith-first',
    license: 'LicenseRef-All-Rights-Reserved',
    licenseFamilyId: 'https://martinfowler.com/bliki/MonolithFirst.html',
    licenseEvidenceUrl: 'https://martinfowler.com/bliki/MonolithFirst.html',
    copyrightPolicy: 'facts-and-short-quotation',
    allowedEvidenceRoles: ['comparison', 'method'],
    citationRoles: ['comparison', 'method'],
    citationUsageMode: 'facts-summary',
    manifestPrimary: false,
    usageBoundary: 'Supports starting with a monolith, establishing boundaries before service extraction, and splitting only from observed evidence; it does not define a universal starting topology, prove production outcomes, or permit copied prose or diagrams.',
  },
  {
    id: 'src-spring-modulith-fundamentals',
    license: 'Apache-2.0',
    licenseFamilyId: 'https://docs.spring.io/spring-modulith/reference/fundamentals.html',
    licenseEvidenceUrl: 'https://github.com/spring-projects/spring-modulith/blob/main/LICENSE',
    copyrightPolicy: 'facts-and-short-quotation',
    allowedEvidenceRoles: ['definition', 'implementation', 'method'],
    citationRoles: ['definition', 'implementation', 'method'],
    citationUsageMode: 'facts-summary',
    manifestPrimary: true,
    usageBoundary: 'Supports documented application modules, public and internal boundaries, allowed dependencies, and structural verification; Spring Modulith mechanisms are implementation evidence, not a universal Modular Monolith definition, and source code, diagrams, and directory layouts are not copied.',
  },
  {
    id: 'src-spring-modulith-events',
    license: 'Apache-2.0',
    licenseFamilyId: 'https://docs.spring.io/spring-modulith/reference/events.html',
    licenseEvidenceUrl: 'https://github.com/spring-projects/spring-modulith/blob/main/LICENSE',
    copyrightPolicy: 'facts-and-short-quotation',
    allowedEvidenceRoles: ['implementation', 'runtime-fact'],
    citationRoles: ['implementation', 'runtime-fact'],
    citationUsageMode: 'facts-summary',
    manifestPrimary: false,
    usageBoundary: 'Supports documented event-publication registration, publication after transaction commit, completion tracking, and recovery mechanisms; it does not establish exactly-once delivery, arbitrary broker guarantees, or production outcomes.',
  },
  {
    id: ILLUSTRATION_SOURCE_ID,
    license: 'LicenseRef-Atlas-Original',
    licenseFamilyId: ILLUSTRATION_URL,
    licenseEvidenceUrl: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/sty-04-modular-monolith-boundaries.svg',
    copyrightPolicy: 'original-atlas',
    allowedEvidenceRoles: ['illustration'],
    citationRoles: ['illustration'],
    citationUsageMode: 'original-illustration',
    manifestPrimary: false,
    usageBoundary: 'Original teaching illustration of module contracts, authoritative data ownership, local transaction coupling, post-commit payment and publication recovery, consumer deduplication, and shared deployment failure scope; it is illustration-only and does not establish factual claims or represent a production implementation.',
  },
];
const ADJACENT_TOPICS = ['STY-01', 'STY-02', 'STY-03'];
const ADJACENT_ROUTES = ['/styles/sty-01', '/styles/sty-02', '/styles/sty-03'];
const MODULES = ['order', 'inventory', 'payment', 'notification'];
const MEASURED_HEADER_NODES = [
  'deployment-boundary',
  ...MODULES.map((module) => `${module}-module-boundary`),
  'shared-process-failure-domain',
  'event-publication',
];
const DIAGRAM_VIEWBOX = '0 0 1200 1800';
const DIAGRAM_RENDER_WIDTH = 800;
const DIAGRAM_RENDER_SCALE = 2 / 3;
const DIAGRAM_GEOMETRY = new Map([
  ['deployment-boundary', [130, 70, 1060, 1570]],
  ['order-module-boundary', [160, 182, 430, 688]],
  ['inventory-module-boundary', [650, 182, 510, 688]],
  ['payment-module-boundary', [160, 952, 430, 628]],
  ['notification-module-boundary', [650, 952, 510, 628]],
  ['order-public-contract', [185, 270, 375, 96]],
  ['inventory-public-contract', [675, 270, 455, 96]],
  ['payment-public-contract', [185, 1040, 375, 96]],
  ['notification-public-contract', [675, 1040, 455, 96]],
  ['order-internal-implementation', [185, 465, 375, 96]],
  ['inventory-internal-implementation', [675, 465, 455, 96]],
  ['payment-internal-implementation', [185, 1235, 375, 96]],
  ['notification-internal-implementation', [675, 1235, 455, 96]],
  ['order-owned-data', [185, 660, 375, 190]],
  ['inventory-owned-data', [675, 660, 455, 170]],
  ['payment-owned-data', [185, 1420, 375, 145]],
  ['payment-recovery-note', [200, 1510, 345, 44]],
  ['notification-owned-data', [675, 1420, 455, 145]],
  ['notification-recovery-note', [690, 1510, 425, 44]],
  ['outbox', [197.5, 745, 350, 90]],
  ['event-publication', [850, 75, 310, 104.25]],
  ['shared-process-failure-domain', [430, 75, 400, 103]],
  ['submit-order-request', [5, 270, 95, 110]],
  ['legend-sync-line', [160, 1690, 90, 24]],
  ['legend-event-line', [160, 1735, 90, 24]],
  ['legend-sync-label', [270, 1680, 390, 44]],
  ['legend-event-label', [270, 1725, 390, 44]],
]);
const DIAGRAM_THRESHOLDS = new Map([
  ['data-node-padding-x-css', 16],
  ['data-node-padding-y-css', 14],
  ['data-baseline-gap-css', 22],
  ['data-text-bottom-clearance-css', 14],
  ['data-edge-stroke-clearance-css', 8],
  ['data-edge-arrow-clearance-css', 16],
  ['data-edge-node-clearance-css', 12],
  ['data-body-font-min-css', 15],
  ['data-type-font-min-css', 10],
]);
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
  ['payment-owned-data', '支付意图与结果', '唯一模块所有者 / Owned Data'],
  ['payment-recovery-note', '待授权 / 待核实 / 待人工处置', ''],
  ['notification-owned-data', '通知去重与投递状态', '唯一模块所有者 / Owned Data'],
  ['notification-recovery-note', '消费者去重 / 毒消息隔离 / 人工重放', ''],
  ['outbox', 'Outbox 不保证 exactly-once', '失败发布保留 / 重试 / 重放'],
  ['event-publication', '事件发布登记', '持久扫描 / 提交后发布'],
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
  ['order-payment-call', 'order-internal-implementation', 'payment-public-contract', '登记支付意图', 'sync'],
  ['order-outbox-write', 'order-internal-implementation', 'outbox', '同事务记录', 'sync'],
  ['outbox-event-publication', 'outbox', 'event-publication', '提交后发布', 'event'],
  ['event-notification-delivery', 'event-publication', 'notification-public-contract', '异步投递', 'event'],
  ['order-owned-data-write', 'order-internal-implementation', 'order-owned-data', '写入订单数据', 'sync'],
  ['inventory-owned-data-write', 'inventory-internal-implementation', 'inventory-owned-data', '写入库存数据', 'sync'],
  ['payment-owned-data-write', 'payment-internal-implementation', 'payment-owned-data', '写入支付数据', 'sync'],
  ['notification-owned-data-write', 'notification-internal-implementation', 'notification-owned-data', '写入通知数据', 'sync'],
];
const PROHIBITED_CLAIMS = [
  ['module-to-service equivalence',
    /(?:业务)?模块.{0,12}(?<!不)(?<!不能)(?<!无法)(?<!并非)(?:是|就是|即为|等于|等同于|相当于|意味着|代表着|必然成为|自动成为|=).{0,12}(?:微)?服务/iu],
  ['service-to-module equivalence',
    /(?:微)?服务.{0,12}(?<!不)(?<!不能)(?<!无法)(?<!并非)(?:是|就是|即为|等于|等同于|相当于|意味着|代表着|=).{0,12}(?:业务)?模块/iu],
  ['module partition implies services',
    /(?:划分|建立|拥有).{0,8}(?:业务)?模块.{0,12}(?:就|便|即可|必然).{0,12}(?:成为|得到|获得).{0,8}(?:微)?服务/iu],
  ['shared database-to-model equivalence',
    /共享(?:物理)?数据库.{0,12}(?<!不)(?<!不能)(?<!无法)(?<!并非)(?:是|就是|即为|等于|等同于|相当于|意味着|代表着|=).{0,12}共享(?:数据)?模型/iu],
  ['shared model-to-database equivalence',
    /共享(?:数据)?模型.{0,12}(?<!不)(?<!不能)(?<!无法)(?<!并非)(?:是|就是|即为|等于|等同于|相当于|意味着|代表着|=).{0,12}共享(?:物理)?数据库/iu],
  ['shared database implies shared model',
    /(?:使用|采用|只要有).{0,8}共享(?:物理)?数据库.{0,12}(?:就|便|即可|必然).{0,12}(?:共享|共用).{0,6}(?:数据)?模型/iu],
  ['modular monolith implies runtime isolation',
    /模块化单体.{0,16}(?<!不)(?<!不能)(?<!无法)(?<!并非)(?:就是|即为|等同于|意味着|保证|天然提供|自动获得|必然具备).{0,16}(?:独立部署|独立扩缩|独立伸缩|故障隔离)/iu],
  ['adoption implies runtime isolation',
    /(?:采用|使用|成为|只要是).{0,8}模块化单体.{0,16}(?:就|便|即可|必然).{0,16}(?:独立部署|独立扩缩|独立伸缩|故障隔离)/iu],
  ['runtime isolation is inherent to modular monolith',
    /(?:独立部署|独立扩缩|独立伸缩|故障隔离).{0,16}(?:是|属于).{0,12}模块化单体.{0,12}(?:固有|天然|默认|必然)/iu],
  ['Outbox-to-exactly-once guarantee',
    /Outbox.{0,28}(?<!不)(?<!不能)(?<!无法)(?<!并非)(?:保证|确保|实现|意味着|等同于|天然提供|自动提供|guarantees?|provides?|ensures?).{0,20}(?:exactly[- ]once|恰好一次|精确一次|仅一次)/iu],
  ['reversed exactly-once guarantee',
    /(?:exactly[- ]once|恰好一次|精确一次|仅一次).{0,24}(?<!不)(?<!不能)(?<!无法)(?:由|通过|依靠|is guaranteed by|is ensured by).{0,12}Outbox/iu],
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

function cssDeclarations(source) {
  return new Map(source.split(';').map((declaration) => declaration.trim()).filter(Boolean).map((declaration) => {
    const separator = declaration.indexOf(':');
    return [declaration.slice(0, separator).trim(),
      declaration.slice(separator + 1).trim().replace(/\s*!important\s*$/iu, '')];
  }).filter(([property]) => property));
}

function svgPresentationValue(source, elementName, attributesSource, property, inheritedClasses = []) {
  const attributes = xmlAttributes(attributesSource);
  const inlineValue = cssDeclarations(attributes.get('style') ?? '').get(property);
  if (inlineValue !== undefined) return inlineValue;
  const classes = new Set([
    ...inheritedClasses,
    ...(attributes.get('class') ?? '').split(/\s+/u).filter(Boolean),
  ]);
  let resolved = attributes.get(property);
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarationsSource] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      const declarations = cssDeclarations(declarationsSource);
      if (!declarations.has(property)) continue;
      for (const rawSelector of selectors.split(',')) {
        const selector = rawSelector.trim();
        if (/^[a-z][\w-]*/iu.test(selector) && !selector.startsWith(elementName)) continue;
        const requiredClasses = [...selector.matchAll(/\.([\w-]+)/gu)].map(([, className]) => className);
        if (requiredClasses.every((className) => classes.has(className))) resolved = declarations.get(property);
      }
    }
  }
  return resolved;
}

function svgEdgeDashArray(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = source.match(new RegExp(`<path\\b([^>]*)data-edge-id="${escapedId}"([^>]*)>`, 'u'));
  assert.ok(match, `SVG edge presentation ${id}`);
  return svgPresentationValue(source, 'path', `${match[1]}${match[2]}`, 'stroke-dasharray');
}

function svgLegendDashArray(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const group = source.match(new RegExp(`<g\\b([^>]*)data-node-id="${escapedId}"([^>]*)>([\\s\\S]*?)<\\/g>`, 'u'));
  assert.ok(group, `SVG legend group ${id}`);
  const groupClasses = xmlAttributes(`${group[1]}${group[2]}`).get('class')?.split(/\s+/u).filter(Boolean) ?? [];
  const line = group[3].match(/<(path|line)\b([^>]*)>/u);
  assert.ok(line, `SVG legend line ${id}`);
  return svgPresentationValue(source, line[1], line[2], 'stroke-dasharray', groupClasses);
}

function strokeDashKind(value) {
  if (typeof value !== 'string') return 'invalid';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'none') return 'solid';
  if (!normalized || /^(?:inherit|initial|revert|revert-layer|unset)$/u.test(normalized) || /(?:var|calc)\(/u.test(normalized)) {
    return 'invalid';
  }
  const components = normalized.split(/[\s,]+/u);
  const dashComponent = /^(?:\d+(?:\.\d*)?|\.\d+)(?:%|px|em|rem|ex|ch|vh|vw|vmin|vmax|cm|mm|q|in|pt|pc)?$/u;
  if (components.some((component) => !dashComponent.test(component))) return 'invalid';
  if (components.every((component) => Number.parseFloat(component) === 0)) return 'invalid';
  return 'dashed';
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

function drawioEdgeWaypoints(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const block = source.match(new RegExp(
    `<mxCell\\b[^>]*\\bid="${escapedId}"[^>]*>([\\s\\S]*?)<\\/mxCell>`, 'u',
  ))?.[1] ?? '';
  const points = block.match(/<Array\b[^>]*\bas="points"[^>]*>([\s\S]*?)<\/Array>/u)?.[1] ?? '';
  return [...points.matchAll(/<mxPoint\b([^>]*)\/>/gu)].map(([, attributesSource]) => {
    const attributes = xmlAttributes(attributesSource);
    return {x: Number(attributes.get('x')), y: Number(attributes.get('y'))};
  });
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

function overlaps(first, second) {
  return first.x < second.x + second.width && first.x + first.width > second.x &&
    first.y < second.y + second.height && first.y + first.height > second.y;
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
  return points;
}

function conservativeLabelBounds(tag, label, fontSize) {
  const attributes = xmlAttributes(tag);
  const x = Number(attributes.get('x'));
  const bottom = Number(attributes.get('y'));
  const width = [...label].length * fontSize;
  const anchor = attributes.get('text-anchor') || 'start';
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return {bottom, left, right: left + width, top: bottom - fontSize};
}

function conservativeTextWidth(text, fontSize) {
  return [...text].reduce((width, character) => {
    if (/\p{Script=Han}/u.test(character)) return width + fontSize;
    if (/\s/u.test(character)) return width + fontSize * 0.33;
    if (character === '/') return width + fontSize * 0.4;
    return width + fontSize * 0.6;
  }, 0);
}

function rectangleDistance(first, second) {
  const horizontal = Math.max(second.left - first.right, first.left - second.right, 0);
  const vertical = Math.max(second.top - first.bottom, first.top - second.bottom, 0);
  return Math.hypot(horizontal, vertical);
}

function expandedRectangle(rectangle, expansion) {
  return {
    bottom: rectangle.bottom + expansion,
    left: rectangle.left - expansion,
    right: rectangle.right + expansion,
    top: rectangle.top - expansion,
  };
}

function boundaryStrokeDistance(label, boundary, strokeWidth) {
  const inside = label.left >= boundary.left && label.right <= boundary.right &&
    label.top >= boundary.top && label.bottom <= boundary.bottom;
  if (inside) {
    const halfStroke = strokeWidth / 2;
    return Math.min(
      label.left - boundary.left - halfStroke,
      boundary.right - halfStroke - label.right,
      label.top - boundary.top - halfStroke,
      boundary.bottom - halfStroke - label.bottom,
    );
  }
  return rectangleDistance(label, expandedRectangle(boundary, strokeWidth / 2));
}

function segmentDistance(label, start, end) {
  return rectangleDistance(label, {
    bottom: Math.max(start.y, end.y),
    left: Math.min(start.x, end.x),
    right: Math.max(start.x, end.x),
    top: Math.min(start.y, end.y),
  });
}

function projectedInterval(points, axis) {
  const values = points.map((point) => point.x * axis.x + point.y * axis.y);
  return {maximum: Math.max(...values), minimum: Math.min(...values)};
}

function intervalGap(first, second) {
  return Math.max(second.minimum - first.maximum, first.minimum - second.maximum);
}

function markerGeometry(svg, connectorTag, points) {
  const connector = xmlAttributes(connectorTag);
  const markerId = svgPresentationValue(svg, 'path', connectorTag, 'marker-end')
    ?.match(/^url\(#([^)]+)\)$/u)?.[1];
  assert.ok(markerId, 'connector marker-end');
  const markerBlock = svg.match(
    new RegExp(`<marker\\b[^>]*\\bid="${markerId}"[^>]*>[\\s\\S]*?<\\/marker>`, 'u'),
  )?.[0] ?? '';
  const markerTag = markerBlock.match(/<marker\b[^>]*>/u)?.[0] ?? '';
  const markerPath = markerBlock.match(/<path\b[^>]*>/u)?.[0] ?? '';
  const markerAttributes = xmlAttributes(markerTag);
  assert.ok(markerTag, `${markerId} marker definition`);
  const coordinates = (xmlAttributes(markerPath).get('d')?.match(
    /-?(?:\d+(?:\.\d*)?|\.\d+)/gu,
  ) ?? []).map(Number);
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
  assert.ok(markerPoints.length >= 3 && markerPoints.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)),
    `${markerId} marker points`);
  return {axis, points: markerPoints};
}

function sectionBody(source, heading, nextHeading) {
  const start = source.indexOf(`## ${heading}`);
  assert.ok(start >= 0, `${heading} section`);
  const end = nextHeading ? source.indexOf(`## ${nextHeading}`, start + heading.length + 3) : source.length;
  assert.ok(end > start, `${heading} section end`);
  return source.slice(start, end);
}

function markdownParagraphs(source) {
  return source.split(/\r?\n\s*\r?\n/u).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function normalizeHexColor(value) {
  const match = value?.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/iu);
  assert.ok(match, `supported opaque hex color: ${String(value)}`);
  const expanded = match[1].length === 3
    ? [...match[1]].map((component) => component.repeat(2)).join('')
    : match[1];
  return `#${expanded.toUpperCase()}`;
}

function relativeLuminance(hex) {
  const channels = normalizeHexColor(hex).match(/[\da-f]{2}/giu)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first, second) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)]
    .sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeColor(foreground, background, opacity) {
  assert.ok(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1, `valid paint opacity ${opacity}`);
  const channels = (color) => normalizeHexColor(color).match(/[\da-f]{2}/giu)
    .map((value) => Number.parseInt(value, 16));
  const foregroundChannels = channels(foreground);
  const backgroundChannels = channels(background);
  return `#${foregroundChannels.map((channel, index) =>
    Math.round(channel * opacity + backgroundChannels[index] * (1 - opacity))
      .toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function presentationOpacity(source, elementName, attributesSource, property, inheritedClasses = []) {
  const paintOpacity = Number(svgPresentationValue(
    source, elementName, attributesSource, `${property}-opacity`, inheritedClasses,
  ) ?? 1);
  const elementOpacity = Number(svgPresentationValue(
    source, elementName, attributesSource, 'opacity', inheritedClasses,
  ) ?? 1);
  assert.ok(Number.isFinite(paintOpacity) && Number.isFinite(elementOpacity),
    `${elementName} ${property} opacity resolves numerically`);
  return paintOpacity * elementOpacity;
}

function svgGroupBlock(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const group = source.match(new RegExp(
    `<g\\b([^>]*)data-node-id="${escapedId}"([^>]*)>([\\s\\S]*?)<\\/g>`, 'u',
  ));
  assert.ok(group, `SVG group ${id}`);
  return {
    attributesSource: `${group[1]}${group[2]}`,
    classes: (xmlAttributes(`${group[1]}${group[2]}`).get('class') ?? '').split(/\s+/u).filter(Boolean),
    contents: group[3],
  };
}

function effectiveGroupBackground(source, id, canvas) {
  const group = svgGroupBlock(source, id);
  const shape = group.contents.match(/<(rect|path)\b([^>]*)>/u);
  if (!shape) return canvas;
  const fill = svgPresentationValue(source, shape[1], shape[2], 'fill', group.classes);
  if (!fill || fill === 'none') return canvas;
  return compositeColor(fill, canvas,
    presentationOpacity(source, shape[1], shape[2], 'fill', group.classes));
}

function assertSvgRoleContrast(source, role, elementName, attributesSource, property, background, inheritedClasses = []) {
  const foreground = svgPresentationValue(
    source, elementName, attributesSource, property, inheritedClasses,
  );
  const effectiveForeground = compositeColor(
    foreground,
    background,
    presentationOpacity(source, elementName, attributesSource, property, inheritedClasses),
  );
  const ratio = contrastRatio(effectiveForeground, background);
  assert.ok(ratio >= 4.5, `${role} contrast ${ratio.toFixed(2)}:1 (${effectiveForeground} on ${background})`);
}

function assertGroupTextContrast(source, id, role, canvas) {
  const group = svgGroupBlock(source, id);
  const background = effectiveGroupBackground(source, id, canvas);
  for (const textRole of ['title', 'type']) {
    const text = group.contents.match(new RegExp(
      `<text\\b([^>]*)data-text-role="${textRole}"([^>]*)>`, 'u',
    ));
    if (!text) continue;
    assertSvgRoleContrast(
      source, `${role} ${textRole} ${id}`, 'text', `${text[1]}${text[2]}`, 'fill', background, group.classes,
    );
  }
}

function assertEssentialDiagramContrast(source) {
  const canvasTag = source.match(
    /<rect\b([^>]*)data-canvas-role="background"([^>]*)>/u,
  );
  assert.ok(canvasTag, 'opaque canvas element');
  const canvasAttributes = `${canvasTag[1]}${canvasTag[2]}`;
  const canvas = normalizeHexColor(svgPresentationValue(source, 'rect', canvasAttributes, 'fill'));
  assert.equal(canvas, '#FFFFFF', 'canvas resolves to white');
  assert.equal(presentationOpacity(source, 'rect', canvasAttributes, 'fill'), 1, 'canvas is opaque');

  const noteIds = new Set(['payment-recovery-note', 'notification-recovery-note']);
  const legendIds = new Set(['legend-sync-line', 'legend-event-line', 'legend-sync-label', 'legend-event-label']);
  for (const [id] of DIAGRAM_NODES) {
    if (noteIds.has(id) || legendIds.has(id)) continue;
    assertGroupTextContrast(source, id, id.includes('boundary') ? 'boundary/module' : 'node', canvas);
  }
  for (const id of noteIds) assertGroupTextContrast(source, id, 'note', canvas);

  for (const [id, , , , connectorClass] of DIAGRAM_EDGES) {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const edge = source.match(new RegExp(`<path\\b([^>]*)data-edge-id="${escapedId}"([^>]*)>`, 'u'));
    assert.ok(edge, `SVG edge ${id}`);
    assertSvgRoleContrast(
      source, `${connectorClass} edge ${id}`, 'path', `${edge[1]}${edge[2]}`, 'stroke', canvas,
    );
    const label = source.match(new RegExp(`<text\\b([^>]*)data-edge-id="${escapedId}"([^>]*)>`, 'u'));
    assert.ok(label, `SVG edge label ${id}`);
    assertSvgRoleContrast(source, `edge label ${id}`, 'text', `${label[1]}${label[2]}`, 'fill', canvas);
  }

  for (const [id, connectorClass] of [['legend-sync-line', 'sync'], ['legend-event-line', 'event']]) {
    const group = svgGroupBlock(source, id);
    const line = group.contents.match(/<(line|path)\b([^>]*)>/u);
    assert.ok(line, `SVG legend line ${id}`);
    assertSvgRoleContrast(
      source, `${connectorClass} legend ${id}`, line[1], line[2], 'stroke', canvas, group.classes,
    );
  }
  for (const id of ['legend-sync-label', 'legend-event-label']) {
    const group = svgGroupBlock(source, id);
    const label = group.contents.match(/<text\b([^>]*)>/u);
    assert.ok(label, `SVG legend label ${id}`);
    assertSvgRoleContrast(source, `legend label ${id}`, 'text', label[1], 'fill', canvas, group.classes);
  }

  const deploymentNote = source.match(
    /<text\b([^>]*)>一个部署单元不等于一个数据所有者<\/text>/u,
  );
  assert.ok(deploymentNote, 'deployment note');
  assertSvgRoleContrast(source, 'deployment note', 'text', deploymentNote[1], 'fill', canvas);
}

test('SVG presentation parser resolves stylesheet, presentation, inline, and inherited dash semantics', () => {
  const fixture = `<svg>
    <style>.sync { stroke-dasharray: none; } path.event { stroke-dasharray: 8 4; } .legend-event { stroke-dasharray: 6,3; }</style>
    <path data-edge-id="sync-edge" class="sync" stroke-dasharray="9 9"></path>
    <path data-edge-id="event-edge" class="event"></path>
    <path data-edge-id="inline-sync" class="event" style="stroke-dasharray: none"></path>
    <g data-node-id="legend-event-line" class="legend-event"><line></line></g>
  </svg>`;
  assert.equal(strokeDashKind(svgEdgeDashArray(fixture, 'sync-edge')), 'solid',
    'stylesheet overrides presentation attribute');
  assert.equal(strokeDashKind(svgEdgeDashArray(fixture, 'event-edge')), 'dashed', 'stylesheet event dash');
  assert.equal(strokeDashKind(svgEdgeDashArray(fixture, 'inline-sync')), 'solid', 'inline style wins cascade');
  assert.equal(strokeDashKind(svgLegendDashArray(fixture, 'legend-event-line')), 'dashed',
    'legend inherits dash semantics');
  for (const dashed of ['8 4', '0 4', '2px, 1px', '.5em 25%']) {
    assert.equal(strokeDashKind(dashed), 'dashed', `valid nonzero dash array: ${dashed}`);
  }
  assert.equal(strokeDashKind('none'), 'solid', 'explicitly resolved solid style');
  for (const invalid of [
    undefined, '', '   ', 'inherit', 'initial', 'unset', 'revert', 'revert-layer',
    'var(--event-dash)', 'calc(4px + 1px) 2px', '4 invalid', '-1 3', '0', '0 0',
  ]) assert.equal(strokeDashKind(invalid), 'invalid', `reject unresolved/invalid dash array: ${String(invalid)}`);
});

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
  const consistencySection = sectionBody(article.source, '数据所有权与一致性', '部署单元与故障域');
  const outboxParagraph = markdownParagraphs(consistencySection).find((paragraph) => /Outbox/u.test(paragraph));
  assert.ok(outboxParagraph, 'Outbox lifecycle paragraph in the consistency section');
  for (const term of ['提交', '投递', '重复', '恢复']) {
    assert.match(outboxParagraph, new RegExp(term, 'u'), `Outbox lifecycle paragraph: ${term}`);
  }
  assert.match(visibleCopy, /(?:单一|一个)(?:构建)?制品|一个部署制品/u);
  assert.match(visibleCopy, /共享进程故障域/u);
  for (const signal of [
    /协调等待|协调延迟/u, /独立发布/u, /非对称扩缩|资源曲线/u, /合规|数据驻留/u,
    /爆炸半径|故障影响半径/u, /团队自治/u, /迁移就绪|迁移准备/u, /回滚/u,
  ]) assert.match(visibleCopy, signal, `measurable split signal ${signal}`);
  const migrationSection = sectionBody(article.source, '迁移路径', '禁用条件');
  assert.match(migrationSection, /(?:拆分|提取|抽取)/u, 'split decision in migration section');
  assert.match(migrationSection, /指标/u, 'split decisions name a metric');
  assert.match(migrationSection, /阈值/u, 'split decisions name a threshold');
  assert.match(migrationSection, /观察窗口|连续\s*\d+\s*(?:天|周|月|个迭代)/u,
    'split decisions name an observation window');
  assert.match(article.source,
    /<div className="architecture-diagram-scroll" role="region" aria-label="模块化单体的模块合同、数据所有权与单一部署边界图，可横向滚动" tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}>[\s\S]*?\/img\/diagrams\/sty-04-modular-monolith-boundaries\.svg[\s\S]*?<\/div>/u,
    'accessible diagram embed');
});

test('locks the complete local payment transaction and post-commit recovery boundary', () => {
  assert.ok(article);
  const visibleCopy = parseMdxVisibleCopy(article.source, ARTICLE).blocks.map(({text}) => text).join('\n');
  for (const pattern of [
    /订单行.*库存预留行.*支付意图行/u,
    /订单模式.*库存模式.*支付模式/u,
    /锁竞争.*失败耦合/u,
    /支付模块拥有.*持久.*待授权.*支付意图/u,
    /稳定幂等键/u,
    /持久调度器.*待处理扫描/u,
    /本地事务提交后.*外部.*授权/u,
    /从未尝试.*结果未知/u,
    /记录授权结果.*推进或取消订单.*释放库存/u,
    /部分失败.*恢复/u,
    /处置期限/u,
    /重试.*撤销.*冲正.*退款.*对账/u,
    /待人工处置状态/u,
  ]) assert.match(visibleCopy, pattern, `payment boundary ${pattern}`);
  assert.doesNotMatch(visibleCopy, /爆炸半径证据/u);
  assert.match(visibleCopy, /故障影响半径证据/u);
});

test('rejects claims that erase module, data, deployment, or delivery boundaries', () => {
  assert.ok(article);
  const visibleCopy = parseMdxVisibleCopy(article.source, ARTICLE).blocks.map(({text}) => text).join(' ')
    .replace(/\s+/gu, ' ');
  for (const [label, pattern] of PROHIBITED_CLAIMS) assert.doesNotMatch(visibleCopy, pattern, label);
});

test('prohibited-claim patterns cover equivalents while permitting explicit denials', () => {
  const positiveSamples = [
    '业务模块是服务。',
    '服务是业务模块。',
    '业务模块意味着微服务。',
    '微服务等同于业务模块。',
    '只要建立业务模块，就必然成为服务。',
    '共享数据库是共享数据模型。',
    '共享数据模型是共享数据库。',
    '共享物理数据库代表着共享数据模型。',
    '共享数据模型相当于共享数据库。',
    '采用共享数据库即可共用数据模型。',
    '模块化单体天然提供独立部署。',
    '采用模块化单体就能故障隔离。',
    '独立扩缩是模块化单体天然具备的能力。',
    'Outbox guarantees exactly-once delivery.',
    'exactly-once is guaranteed by Outbox.',
  ];
  for (const sample of positiveSamples) {
    assert.ok(PROHIBITED_CLAIMS.some(([, pattern]) => pattern.test(sample)), `must reject: ${sample}`);
  }
  for (const denial of [
    '业务模块不是服务。',
    '服务不是业务模块。',
    '业务模块不等于服务。',
    '共享数据库不是共享数据模型。',
    '共享数据模型不是共享数据库。',
    '共享数据库不意味着共享数据模型。',
    '模块化单体不能保证独立部署。',
    'Outbox 不能保证 exactly-once。',
    'exactly-once 不能由 Outbox 保证。',
  ]) assert.ok(PROHIBITED_CLAIMS.every(([, pattern]) => !pattern.test(denial)), `must permit denial: ${denial}`);
});

test('governs the STY-04 evidence and original illustration with one manifest primary', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  const healthBySource = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  const review = ledger.documents[ARTICLE];
  assert.ok(review, `${ARTICLE} source review`);
  assert.deepEqual(review.citations.map(({source_id}) => source_id), SOURCE_IDS);
  assert.deepEqual(SOURCE_CONTRACTS.map(({id}) => id), SOURCE_IDS, 'source contracts stay aligned with citation order');
  assert.equal(review.citations.filter(({manifest_primary}) => manifest_primary).length, 1,
    'exactly one manifest-primary citation');
  assert.deepEqual(review.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.ok(article, `${ARTICLE} visible citations`);
  const citedDomains = new Set();
  for (const [index, sourceId] of SOURCE_IDS.entries()) {
    const sourceContract = SOURCE_CONTRACTS[index];
    const record = records.get(sourceId);
    assert.ok(record, `${sourceId} ledger record`);
    assert.equal(record.canonical_locator, SOURCE_URLS[index]);
    if (record.canonical_locator.startsWith('https://')) citedDomains.add(new URL(record.canonical_locator).hostname);
    for (const field of [
      'author_or_org', 'version', 'source_kind', 'copyright_policy', 'license', 'license_family_id',
      'license_evidence_url', 'license_evidence_note', 'usage_boundary',
    ]) assert.ok(record[field]?.length, `${sourceId} ${field}`);
    assert.equal(record.license, sourceContract.license, `${sourceId} exact license`);
    assert.equal(record.license_family_id, sourceContract.licenseFamilyId, `${sourceId} exact license family`);
    assert.equal(record.license_evidence_url, sourceContract.licenseEvidenceUrl,
      `${sourceId} exact license evidence URL`);
    assert.equal(record.copyright_policy, sourceContract.copyrightPolicy, `${sourceId} exact copyright policy`);
    assert.deepEqual(record.allowed_evidence_roles, sourceContract.allowedEvidenceRoles,
      `${sourceId} exact allowed evidence roles`);
    assert.equal(record.usage_boundary, sourceContract.usageBoundary, `${sourceId} exact usage boundary`);
    assert.ok(review.citations[index].roles?.length, `${sourceId} citation roles must not be empty`);
    assert.deepEqual(review.citations[index].roles, sourceContract.citationRoles, `${sourceId} exact citation roles`);
    assert.equal(review.citations[index].usage_mode, sourceContract.citationUsageMode,
      `${sourceId} exact citation usage mode`);
    assert.equal(review.citations[index].manifest_primary, sourceContract.manifestPrimary,
      `${sourceId} exact manifest-primary eligibility`);
    assert.ok(review.citations[index].attribution_note?.trim(), `${sourceId} attribution`);
    assert.equal(review.citations[index].excerpt, null, `${sourceId} no copied excerpt`);
    assert.equal(review.citations[index].quotation_reviewed, false, `${sourceId} no quotation`);
    if (record.canonical_locator.startsWith('https://')) {
      assert.ok(externalLinksOf(article).includes(record.canonical_locator), `${sourceId} visible citation`);
      const health = healthBySource.get(sourceId);
      assert.equal(health?.last_attempt?.outcome, 'healthy', `${sourceId} current transport`);
      assert.equal(health?.review_status, 'healthy', `${sourceId} reviewed health`);
      assert.equal(health?.last_attempt?.final_transport_locator, record.transport_locator,
        `${sourceId} final transport`);
    } else {
      assert.match(article.source, new RegExp(record.canonical_locator.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'),
        `${sourceId} visible illustration`);
    }
    const escapedFamily = record.license_family_id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    assert.match(licenseInventory, new RegExp(`^\\|\\s*${escapedFamily}\\s*\\|`, 'mu'),
      `${sourceId} license inventory`);
  }
  assert.deepEqual([...citedDomains].sort(), ['docs.spring.io', 'martinfowler.com']);
  const illustration = records.get(ILLUSTRATION_SOURCE_ID);
  assert.equal(illustration?.source_kind, 'original-illustration');
  assert.equal(illustration?.tier, 'primary');
  assert.equal(illustration?.license_scope,
    'The named project-authored sty-04-modular-monolith-boundaries.svg asset only');
  const illustrationCitation = review.citations.at(-1);
  assert.ok(illustrationCitation?.modification_note?.trim());
  assert.equal(illustrationCitation?.excerpt, null);
  assert.equal(illustrationCitation?.quotation_reviewed, false);
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
  const nextStyleIndexEntry = indexes.style.find(({id}) => id === 'STY-05');
  assert.equal(nextStyleIndexEntry?.published, false);
  assert.equal(nextStyleIndexEntry?.status.value, 'pending');
  assert.equal(projectStatus.completed_topics, 56);
  assert.equal(projectStatus.content_documents, 99);
  assert.equal(projectStatus.governed_sources, 513);
  assert.equal(publicLedger.sources.length, 513);
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
  const svgRoot = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.equal(xmlAttributes(svgRoot).get('viewBox'), DIAGRAM_VIEWBOX, 'stable STY-04 SVG viewBox');
  assert.doesNotMatch(svgRoot, /\b(?:width|height)="/u, 'responsive SVG root');
  assert.match(svg, /<rect\b(?=[^>]*data-canvas-role="background")(?=[^>]*fill="#FFFFFF")(?=[^>]*width="1200")(?=[^>]*height="1800")[^>]*>/u,
    'opaque light canvas makes rendering theme-independent');
  assert.match(svg, /<desc\b[^>]*>[^<]*各自拥有权威数据的唯一写入责任[^<]*<\/desc>/u);
  assert.doesNotMatch(svg, /每个模块独占自己的数据/u);
  assert.equal(Number(xmlAttributes(svgRoot).get('data-render-width-css')), DIAGRAM_RENDER_WIDTH,
    'planned article render width');
  assert.equal(Number(xmlAttributes(svgRoot).get('data-authoring-to-render-scale')), DIAGRAM_RENDER_SCALE,
    'authoring-to-rendered scale');
  for (const [attribute, threshold] of DIAGRAM_THRESHOLDS) {
    assert.equal(Number(xmlAttributes(svgRoot).get(attribute)), threshold, `${attribute} threshold`);
  }

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
    assert.equal(strokeDashKind(svgEdgeDashArray(svg, id)), connectorClass === 'event' ? 'dashed' : 'solid',
      `SVG edge ${id} rendered stroke pattern`);
  }
  assert.deepEqual(drawioEdgeWaypoints(drawio, 'order-inventory-call'), [
    {x: 620, y: 495}, {x: 620, y: 318},
  ], 'Draw.io order-to-inventory upper lane');
  assert.deepEqual(drawioEdgeWaypoints(drawio, 'outbox-event-publication'), [
    {x: 372, y: 880}, {x: 1170, y: 880}, {x: 1170, y: 135},
  ], 'Draw.io outbox publication inter-row and right-side lane');

  for (const geometryOf of [
    (id) => drawioCellGeometry(drawio, id),
    (id) => svgCellGeometry(svg, id),
  ]) {
    for (const [id, expected] of DIAGRAM_GEOMETRY) {
      assert.deepEqual(Object.values(geometryOf(id)), expected, `${id} exact source geometry`);
    }
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
    for (let left = 0; left < MODULES.length; left += 1) {
      for (let right = left + 1; right < MODULES.length; right += 1) {
        assert.equal(overlaps(
          geometryOf(`${MODULES[left]}-module-boundary`),
          geometryOf(`${MODULES[right]}-module-boundary`),
        ), false, `${MODULES[left]} and ${MODULES[right]} module regions do not overlap`);
      }
    }
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
    assert.equal(strokeDashKind(svgLegendDashArray(svg, lineId)), connectorClass === 'event' ? 'dashed' : 'solid',
      `SVG ${lineId} rendered stroke pattern`);
  }
});

test('keeps every essential diagram role contrast-safe on the opaque canvas', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertEssentialDiagramContrast(svg);
  assert.doesNotMatch(svg, /prefers-color-scheme|currentColor/u,
    'diagram presentation cannot inherit a dark theme canvas or text color');
});

test('contrast gate rejects event-edge and label mutations on their rendered roles', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  const whiteEvent = svg.replace(/(\.event\{[^}]*\bstroke:)#[0-9A-F]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteEvent, svg, 'event stroke mutation applied');
  assert.throws(() => assertEssentialDiagramContrast(whiteEvent), /event edge .* contrast/u);

  const whiteLabels = svg.replace(
    /(\.edge-label,\.legend-label\{[^}]*\bfill:)#[0-9A-F]{6}/u,
    '$1#FFFFFF',
  );
  assert.notEqual(whiteLabels, svg, 'edge/legend label fill mutation applied');
  assert.throws(() => assertEssentialDiagramContrast(whiteLabels), /edge label .* contrast/u);
});

test('keeps every measured STY-04 header above node-text padding and baseline thresholds', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);

  for (const nodeId of MEASURED_HEADER_NODES) {
    const group = svg.match(new RegExp(
      `<g\\b[^>]*data-node-id="${nodeId}"[^>]*data-node-bounds="([^"]+)"[^>]*>([\\s\\S]*?)<\\/g>`,
      'u',
    )) ?? [];
    const [x, y, width, height] = (group[1] ?? '').split(/\s+/u).map(Number);
    const contents = group[2] ?? '';
    const outline = contents.match(/<(rect|path)\b([^>]*)>/u) ?? [];
    const strokeWidth = Number.parseFloat(
      svgPresentationValue(svg, outline[1], outline[2], 'stroke-width'),
    );
    assert.ok(Number.isFinite(strokeWidth) && strokeWidth > 0,
      `${nodeId} measurable stroke width`);
    const halfStroke = strokeWidth / 2;
    const titleMatch = contents.match(
      /(<text\b[^>]*data-text-role="title"[^>]*>)([^<]+)<\/text>/u,
    ) ?? [];
    const typeMatch = contents.match(
      /(<text\b[^>]*data-text-role="type"[^>]*>)([^<]+)<\/text>/u,
    ) ?? [];
    assert.ok(titleMatch[1], `${nodeId} measurable title`);
    assert.ok(typeMatch[1], `${nodeId} measurable type`);
    const titleAttributesSource = titleMatch[1].replace(/^<text\b|>$/gu, '');
    const typeAttributesSource = typeMatch[1].replace(/^<text\b|>$/gu, '');
    const titleAttributes = xmlAttributes(titleAttributesSource);
    const typeAttributes = xmlAttributes(typeAttributesSource);
    const titleFontSize = Number.parseFloat(svgPresentationValue(svg, 'text', titleAttributesSource, 'font-size'));
    const typeFontSize = Number.parseFloat(svgPresentationValue(svg, 'text', typeAttributesSource, 'font-size'));
    const titleBaseline = Number(titleAttributes.get('y'));
    const typeBaseline = Number(typeAttributes.get('y'));

    for (const [role, attributes, textValue, fontSize] of [
      ['title', titleAttributes, titleMatch[2], titleFontSize],
      ['type', typeAttributes, typeMatch[2], typeFontSize],
    ]) {
      const textWidth = conservativeTextWidth(textValue, fontSize);
      const textX = Number(attributes.get('x'));
      const anchor = attributes.get('text-anchor') ?? 'start';
      const left = anchor === 'middle' ? textX - textWidth / 2 : anchor === 'end' ? textX - textWidth : textX;
      const right = left + textWidth;
      const horizontalPadding = Math.min(
        left - (x + halfStroke),
        x + width - halfStroke - right,
      );
      assert.ok(horizontalPadding >= 24,
        `${nodeId} ${role} has only ${horizontalPadding} authoring units horizontal padding`);
    }

    const topPadding = titleBaseline - titleFontSize - (y + halfStroke);
    const baselineGap = typeBaseline - titleBaseline;
    const bottomClearance = y + height - halfStroke - typeBaseline;
    assert.ok(topPadding >= 21,
      `${nodeId} title has only ${topPadding} authoring units vertical padding`);
    assert.ok(baselineGap >= 33,
      `${nodeId} title/type baselines are only ${baselineGap} authoring units apart`);
    assert.ok(bottomClearance >= 21,
      `${nodeId} type has only ${bottomClearance} authoring units bottom clearance`);
    assert.deepEqual(Object.values(drawioCellGeometry(drawio, nodeId)), [x, y, width, height],
      `${nodeId} measured header geometry stays synchronized`);
  }
});

test('keeps all STY-04 relationship labels clear of connectors, markers, nodes, and boundaries', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  const renderedScale = DIAGRAM_RENDER_SCALE;
  const labelFontSize = Number.parseFloat(
    svgPresentationValue(svg, 'text', 'class="edge-label"', 'font-size'),
  );
  const boundaryIds = new Set([
    'deployment-boundary', ...MODULES.map((module) => `${module}-module-boundary`),
  ]);
  const ignoredNodeIds = new Set([
    'legend-sync-line', 'legend-event-line', 'legend-sync-label', 'legend-event-label',
  ]);
  const nodeBounds = new Map();
  const boundaryBounds = new Map();

  for (const [, id, boundsValue, contents] of svg.matchAll(
    /<g\b[^>]*data-node-id="([^"]+)"[^>]*data-node-bounds="([^"]+)"[^>]*>([\s\S]*?)<\/g>/gu,
  )) {
    if (ignoredNodeIds.has(id)) continue;
    const [x, y, width, height] = boundsValue.split(/\s+/u).map(Number);
    const rectangle = {bottom: y + height, left: x, right: x + width, top: y};
    const outline = contents.match(/<(rect|path)\b([^>]*)>/u);
    assert.ok(outline, `${id} visible outline`);
    const strokeWidth = Number(svgPresentationValue(svg, outline[1], outline[2], 'stroke-width'));
    assert.ok(Number.isFinite(strokeWidth) && strokeWidth > 0, `${id} visible stroke width`);
    if (boundaryIds.has(id)) boundaryBounds.set(id, {rectangle, strokeWidth});
    else nodeBounds.set(id, expandedRectangle(rectangle, strokeWidth / 2));
  }

  const connectorTags = new Map([...svg.matchAll(/<path\b[^>]*data-edge-id="([^"]+)"[^>]*>/gu)]
    .map(([tag, id]) => [id, tag]));
  assert.equal(connectorTags.size, DIAGRAM_EDGES.length, 'all relationship connector paths');
  assert.deepEqual(parseOrthogonalPath(xmlAttributes(connectorTags.get('order-inventory-call')).get('d')), [
    {x: 560, y: 495}, {x: 620, y: 495}, {x: 620, y: 318}, {x: 672, y: 318},
  ], 'order-to-inventory owns its upper connector lane');
  assert.deepEqual(parseOrthogonalPath(xmlAttributes(connectorTags.get('outbox-event-publication')).get('d')), [
    {x: 372, y: 835}, {x: 372, y: 880}, {x: 1170, y: 880}, {x: 1170, y: 135}, {x: 1163, y: 135},
  ], 'outbox publication owns its separate inter-row and right-side lane');

  for (const [edgeId, , , expectedLabel] of DIAGRAM_EDGES) {
    const connectorTag = connectorTags.get(edgeId) ?? '';
    const labelMatch = svg.match(new RegExp(
      `(<text\\b[^>]*data-edge-id="${edgeId}"[^>]*>)([^<]+)<\\/text>`, 'u',
    )) ?? [];
    const labelTag = labelMatch[1] ?? '';
    const label = labelMatch[2] ?? '';
    assert.equal(label, expectedLabel, `${edgeId} visible label`);
    const labelBounds = conservativeLabelBounds(labelTag, label, labelFontSize);
    const ownPoints = parseOrthogonalPath(xmlAttributes(connectorTag).get('d') ?? '');
    const ownMarker = markerGeometry(svg, connectorTag, ownPoints);
    const labelCorners = [
      {x: labelBounds.left, y: labelBounds.top},
      {x: labelBounds.right, y: labelBounds.top},
      {x: labelBounds.right, y: labelBounds.bottom},
      {x: labelBounds.left, y: labelBounds.bottom},
    ];
    const markerClearance = intervalGap(
      projectedInterval(labelCorners, ownMarker.axis),
      projectedInterval(ownMarker.points, ownMarker.axis),
    ) * renderedScale;
    assert.ok(markerClearance >= 16,
      `${edgeId} has only ${markerClearance}px of real marker clearance`);

    for (const [connectorId, otherConnectorTag] of connectorTags) {
      const points = parseOrthogonalPath(xmlAttributes(otherConnectorTag).get('d') ?? '');
      const halfStroke = Number(svgPresentationValue(
        svg, 'path', otherConnectorTag, 'stroke-width',
      )) / 2;
      const strokeClearance = (Math.min(
        ...points.slice(1).map((point, index) => segmentDistance(labelBounds, points[index], point)),
      ) - halfStroke) * renderedScale;
      assert.ok(strokeClearance >= 8,
        `${edgeId} label has only ${strokeClearance}px clearance from ${connectorId} stroke`);
    }

    for (const [nodeId, rectangle] of nodeBounds) {
      const renderedClearance = rectangleDistance(labelBounds, rectangle) * renderedScale;
      assert.ok(renderedClearance >= 12,
        `${edgeId} has only ${renderedClearance}px of ${nodeId} clearance`);
    }
    for (const [boundaryId, {rectangle, strokeWidth}] of boundaryBounds) {
      const renderedClearance = boundaryStrokeDistance(
        labelBounds, rectangle, strokeWidth,
      ) * renderedScale;
      assert.ok(renderedClearance >= 12,
        `${edgeId} has only ${renderedClearance}px of ${boundaryId} stroke clearance`);
    }
  }
});
