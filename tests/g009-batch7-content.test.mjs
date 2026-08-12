import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const TOPIC_ID = 'STY-06';
const ROUTE = '/styles/sty-06';
const ARTICLE = 'content/styles/sty-06-event-driven-architecture.mdx';
const DRAWIO = 'diagrams/sty-06-event-driven-four-patterns.drawio';
const SVG = 'static/img/diagrams/sty-06-event-driven-four-patterns.svg';
const MODES = ['事件通知', '状态转移', '事件携带状态', '事件溯源'];
const QUESTIONS = ['收到什么', '是否回查', '权威状态', '是否重建', '失败责任'];
const HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
const SOURCE_IDS = [
  'src-fowler-what-do-you-mean-event-driven',
  'src-microsoft-event-driven-architecture-style',
  'src-microsoft-event-sourcing-pattern',
  'src-cncf-cloudevents-102-spec',
  'src-w3c-scxml-2015',
  'src-atlas-sty06-event-driven-four-patterns',
];

const REQUIRED = {
  eventNotification: ['最小载荷', '回查订单服务', '补偿扫描', '被动攻击式命令'],
  stateTransition: ['from', 'to', '业务原因', '聚合版本', '非法迁移', '缺口'],
  carriedState: ['本地副本', '正常路径不回查', '旧版本不能覆盖新版本', '隐私'],
  eventSourcing: ['事件存储是权威', '按聚合有序', '乐观并发', '回放', '快照', '投影'],
};
const PROHIBITED = [
  '四种模式是成熟度阶梯', '消息带完整数据就是事件溯源', 'Kafka 就是事件存储',
  'Outbox 保证恰好一次', 'CQRS 必须使用事件溯源', '回放可以再次扣款',
];
const COLUMN_IDS = ['notification-column', 'transition-column', 'carried-state-column', 'event-sourcing-column'];
const ROW_IDS = ['producer-write-row', 'event-payload-row', 'consumer-read-row', 'authority-row', 'recovery-row'];
const CRITICAL_IDS = [
  'notification-event', 'notification-lookup', 'transition-event', 'consumer-state-machine',
  'state-snapshot-event', 'consumer-local-copy', 'command-handler', 'aggregate',
  'event-store', 'read-projection', 'integration-event', 'event-broker', 'replay-path',
];

const MODE_KEYS = ['eventNotification', 'stateTransition', 'carriedState', 'eventSourcing'];
const PARTICIPANTS = ['订单', '库存', '支付', '通知'];
const RELATION_METADATA = {
  depends_on: ['STY-00', 'STY-05'],
  adjacent_topics: ['STY-04', 'STY-05', 'PR-11', 'MOD-08'],
  related_cases: ['/cases/apache-kafka-consumer-groups'],
  related_questions: [],
};
const RECIPROCAL_FILES = [
  'styles/sty-05-microservices.mdx',
  'principles/pr-11-cqs-cqrs-read-write-separation.mdx',
  'modeling/mod-08-state-machine-modeling.mdx',
];
const RELIABILITY_PATTERNS = [
  /至少一次|at-least-once/iu,
  /事件\s*(?:ID|Id|id|标识)/u,
  /聚合(?:键|标识)|业务键/u,
  /(?:模式|schema)版本/iu,
  /关联\s*(?:ID|Id|id|标识)|correlation\s*(?:ID|Id|id)/iu,
  /因果\s*(?:ID|Id|id|标识)|causation\s*(?:ID|Id|id)/iu,
  /幂等/u,
  /有界重试|重试上限/u,
  /(?:DLQ|死信).{0,16}(?:所有者|负责)|(?:所有者|负责).{0,16}(?:DLQ|死信)/iu,
  /毒(?:消息|事件).{0,12}隔离|隔离.{0,12}毒(?:消息|事件)/u,
  /受控重放/u,
  /人工终止/u,
  /积压/u,
  /(?:延迟|lag)/iu,
  /投影水位|projection[- ]watermark/iu,
];
const MATRIX_ROWS = [
  /载荷/u, /回查|取数/u, /时间耦合.*模式耦合|模式耦合.*时间耦合/u,
  /权威|事实来源/u, /副本/u, /顺序/u, /重放/u, /审计/u, /隐私/u,
  /演进/u, /成本/u, /采用.*停止|使用.*停止|适用.*禁用/u,
];
const SOURCE_REQUIRED_FIELDS = [
  'canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version',
  'source_kind', 'tier', 'allowed_evidence_roles', 'license', 'license_scope',
  'license_evidence_url', 'license_evidence_note', 'copyright_policy', 'usage_boundary',
];
const TERM_PATTERNS = new Map([
  ['command', /命令（Command）|命令\s*\(Command\)|Command（命令）/u],
  ['domain-event', /领域事件（Domain Event）|领域事件\s*\(Domain Event\)|Domain Event（领域事件）/u],
  ['integration-event', /集成事件（Integration Event）|集成事件\s*\(Integration Event\)|Integration Event（集成事件）/u],
  ['broker', /事件代理（Event Broker）|事件代理\s*\(Event Broker\)|消息代理（Message Broker）|事件中间件/u],
  ['outbox', /事务性发件箱（Outbox）|事务性发件箱\s*\(Outbox\)|Outbox（事务性发件箱）/u],
  ['event-store', /事件存储（Event Store）|事件存储\s*\(Event Store\)|Event Store（事件存储）/u],
  ['local-copy', /本地副本/u],
  ['projection', /派生投影|读取投影/u],
]);
const CONFLATIONS = [
  /命令(?:就是|等于|即为)领域事件/u,
  /领域事件(?:就是|等于|即为)集成事件/u,
  /(?:事件|消息)代理(?:就是|等于|即为)事件存储/u,
  /Outbox(?:就是|等于|即为)事件存储/iu,
  /本地副本(?:就是|等于|即为)(?:权威状态|权威写模型)/u,
  /投影(?:就是|等于|即为)(?:权威状态|事件存储)/u,
];
const NODE_PLACEMENTS = new Map([
  ['notification-event', ['notification-column', 'event-payload-row']],
  ['notification-lookup', ['notification-column', 'consumer-read-row']],
  ['transition-event', ['transition-column', 'event-payload-row']],
  ['consumer-state-machine', ['transition-column', 'consumer-read-row']],
  ['state-snapshot-event', ['carried-state-column', 'event-payload-row']],
  ['consumer-local-copy', ['carried-state-column', 'authority-row']],
  ['command-handler', ['event-sourcing-column', 'producer-write-row']],
  ['aggregate', ['event-sourcing-column', 'producer-write-row']],
  ['event-store', ['event-sourcing-column', 'authority-row']],
  ['read-projection', ['event-sourcing-column', 'consumer-read-row']],
  ['integration-event', ['event-sourcing-column', 'event-payload-row']],
  ['replay-path', ['event-sourcing-column', 'recovery-row']],
]);

const [ledger, manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const article = documents.find(({file}) => `content/${file}` === ARTICLE);

function visibleTextOf(source) {
  return parseMdxVisibleCopy(source, ARTICLE, {includeStructure: true}).blocks.map(({text}) => text).join('\n');
}

function section(source, heading, nextHeading) {
  const start = source.search(new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, 'mu'));
  assert.ok(start >= 0, `${heading} section`);
  const rest = source.slice(start);
  if (!nextHeading) return rest;
  const end = rest.search(new RegExp(`^## ${escapeRegExp(nextHeading)}\\s*$`, 'mu'));
  assert.ok(end > 0, `${nextHeading} follows ${heading}`);
  return rest.slice(0, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertSameCaseComparison(source) {
  const comparison = section(source, '边界与控制流', '数据所有权与一致性');
  for (let index = 0; index < MODES.length; index += 1) {
    const nextMode = MODES[index + 1];
    const start = comparison.search(new RegExp(`^### ${escapeRegExp(MODES[index])}\\s*$`, 'mu'));
    assert.ok(start >= 0, `${MODES[index]} subsection`);
    const rest = comparison.slice(start);
    const end = nextMode ? rest.search(new RegExp(`^### ${escapeRegExp(nextMode)}\\s*$`, 'mu')) : -1;
    if (nextMode) assert.ok(end > 0, `${nextMode} follows ${MODES[index]}`);
    const modeSource = end > 0 ? rest.slice(0, end) : rest;
    for (const participant of PARTICIPANTS) assert.match(modeSource, new RegExp(participant, 'u'), `${MODES[index]} ${participant}`);
    for (const question of QUESTIONS) assert.match(modeSource, new RegExp(question, 'u'), `${MODES[index]} answers ${question}`);
  }
}

function assertSemanticContract(source) {
  const visible = visibleTextOf(source);
  for (const [index, key] of MODE_KEYS.entries()) {
    for (const literal of REQUIRED[key]) assert.ok(visible.includes(literal), `${MODES[index]} literal ${literal}`);
  }
  for (const prohibited of PROHIBITED) assert.equal(visible.includes(prohibited), false, `prohibited claim: ${prohibited}`);
  for (const [term, pattern] of TERM_PATTERNS) assert.match(visible, pattern, `${term} separate definition`);
  for (const conflation of CONFLATIONS) assert.doesNotMatch(visible, conflation, `critical conflation ${conflation}`);
}

function markdownTable(source, label) {
  const tables = [...source.matchAll(/(?:^|\n)(\|[^\n]+\|\n\|(?:\s*:?-{3,}:?\s*\|)+\n(?:\|[^\n]+\|\n?)+)/gu)]
    .map(([, raw]) => raw.trim());
  const table = tables.find((candidate) => MODES.every((mode) => candidate.split('\n')[0].includes(mode)));
  assert.ok(table, label);
  return table;
}

function xmlAttributes(source) {
  return new Map([...source.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value]));
}

function decodeXmlText(value) {
  return value.replace(/&amp;/gu, '&').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"').replace(/&#39;/gu, "'");
}

function drawioContract(source) {
  const cells = [...source.matchAll(/<mxCell\b([^>]*)>([\s\S]*?)<\/mxCell>|<mxCell\b([^>]*)\/>/gu)]
    .map((match) => {
      const attributes = xmlAttributes(match[1] ?? match[3] ?? '');
      const geometry = xmlAttributes((match[2] ?? '').match(/<mxGeometry\b([^>]*)/u)?.[1] ?? '');
      return {attributes, geometry, label: decodeXmlText(attributes.get('value') ?? ''), body: match[2] ?? ''};
    });
  return {
    nodes: cells.filter(({attributes}) => attributes.get('vertex') === '1'),
    edges: cells.filter(({attributes}) => attributes.get('edge') === '1'),
  };
}

function svgContract(source) {
  const nodes = [...source.matchAll(/<g\b([^>]*)data-node-id="([^"]+)"([^>]*)>/gu)]
    .map(([, before, id, after]) => ({id, attributes: xmlAttributes(`${before}${after}`)}));
  const labels = new Map([...source.matchAll(/<text\b[^>]*data-edge-id="([^"]+)"[^>]*>([^<]*)<\/text>/gu)]
    .map(([, id, label]) => [id, decodeXmlText(label).trim()]));
  const edges = [...source.matchAll(/<path\b([^>]*)data-edge-id="([^"]+)"([^>]*)>/gu)]
    .map(([, before, id, after]) => ({id, attributes: xmlAttributes(`${before}${after}`), label: labels.get(id) ?? ''}));
  return {nodes, edges};
}

function geometry(source, id, format) {
  if (format === 'drawio') {
    const cell = drawioContract(source).nodes.find(({attributes}) => attributes.get('id') === id);
    assert.ok(cell, `Draw.io node ${id}`);
    return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(cell.geometry.get(key))]));
  }
  const node = svgContract(source).nodes.find((candidate) => candidate.id === id);
  assert.ok(node, `SVG node ${id}`);
  const [x, y, width, height] = (node.attributes.get('data-node-bounds') ?? '').split(/\s+/u).map(Number);
  return {x, y, width, height};
}

function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}

function cssDeclarations(source) {
  return new Map(source.split(';').map((item) => item.trim()).filter(Boolean).map((declaration) => {
    const split = declaration.indexOf(':');
    return [declaration.slice(0, split).trim(), declaration.slice(split + 1).trim()];
  }));
}

function svgPresentationValue(source, elementName, attributesSource, property) {
  const attributes = xmlAttributes(attributesSource);
  const inline = cssDeclarations(attributes.get('style') ?? '').get(property);
  if (inline !== undefined) return inline;
  const classes = new Set((attributes.get('class') ?? '').split(/\s+/u).filter(Boolean));
  let resolved = attributes.get(property);
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      const value = cssDeclarations(declarations).get(property);
      if (value === undefined) continue;
      for (const rawSelector of selectors.split(',')) {
        const selector = rawSelector.trim();
        if (/^[a-z][\w-]*/iu.test(selector) && !selector.startsWith(elementName)) continue;
        const requiredClasses = [...selector.matchAll(/\.([\w-]+)/gu)].map(([, className]) => className);
        if (requiredClasses.every((className) => classes.has(className))) resolved = value;
      }
    }
  }
  return resolved?.replace(/\s*!important\s*$/iu, '');
}

function luminance(color) {
  const match = color?.trim().match(/^#([\da-f]{6})$/iu);
  assert.ok(match, `opaque six-digit color ${String(color)}`);
  const channels = match[1].match(/.{2}/gu).map((item) => Number.parseInt(item, 16) / 255)
    .map((item) => item <= 0.04045 ? item / 12.92 : ((item + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(left, right) {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function parsePathPoints(data) {
  const tokens = data.match(/[MHV]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? [];
  const points = [];
  let cursor = 0;
  let x = 0;
  let y = 0;
  while (cursor < tokens.length) {
    const command = tokens[cursor++];
    if (command === 'M') {
      x = Number(tokens[cursor++]); y = Number(tokens[cursor++]);
    } else if (command === 'H') x = Number(tokens[cursor++]);
    else if (command === 'V') y = Number(tokens[cursor++]);
    else assert.fail(`unsupported connector path command ${command}`);
    points.push({x, y});
  }
  assert.ok(points.length >= 2, `orthogonal connector path ${data}`);
  return points;
}

function labelBounds(tag, label, fontSize) {
  const attributes = xmlAttributes(tag);
  const x = Number(attributes.get('x'));
  const y = Number(attributes.get('y'));
  const width = [...label].reduce((sum, character) => sum + (/^[\u0000-\u00ff]$/u.test(character) ? 0.62 : 1), 0) * fontSize;
  return {left: x - width / 2, right: x + width / 2, top: y - fontSize, bottom: y + fontSize * 0.3};
}

function pointRectangleDistance(point, rectangle) {
  const dx = Math.max(rectangle.left - point.x, 0, point.x - rectangle.right);
  const dy = Math.max(rectangle.top - point.y, 0, point.y - rectangle.bottom);
  return Math.hypot(dx, dy);
}

function assertDiagramPresentation(source) {
  const root = xmlAttributes(source.match(/<svg\b[^>]*>/u)?.[0] ?? '');
  const scale = Number(root.get('data-authoring-to-render-scale'));
  assert.ok(Number.isFinite(scale) && scale > 0 && scale <= 1, 'positive authoring-to-render scale');
  const background = source.match(/<rect\b([^>]*)data-canvas-role="background"([^>]*)>/u);
  assert.ok(background, 'opaque SVG canvas');
  const backgroundColor = svgPresentationValue(source, 'rect', `${background[1]}${background[2]}`, 'fill');
  const edges = svgContract(source).edges;
  assert.equal(new Set(edges.map(({attributes}) => attributes.get('d'))).size, edges.length, 'unique connector paths');
  const fontSize = Number.parseFloat(svgPresentationValue(source, 'text', 'class="edge-label"', 'font-size'));
  for (const edge of edges) {
    const pathTag = source.match(new RegExp(`<path\\b[^>]*data-edge-id="${escapeRegExp(edge.id)}"[^>]*>`, 'u'))?.[0] ?? '';
    const labelMatch = source.match(new RegExp(`(<text\\b[^>]*data-edge-id="${escapeRegExp(edge.id)}"[^>]*>)([^<]*)<\\/text>`, 'u'));
    assert.ok(labelMatch, `${edge.id} visible edge label`);
    const pathColor = svgPresentationValue(source, 'path', pathTag, 'stroke');
    const labelColor = svgPresentationValue(source, 'text', labelMatch[1], 'fill');
    assert.ok(contrastRatio(pathColor, backgroundColor) >= 3, `${edge.id} selector-bound path contrast`);
    assert.ok(contrastRatio(labelColor, backgroundColor) >= 4.5, `${edge.id} selector-bound label contrast`);
    const bounds = labelBounds(labelMatch[1], decodeXmlText(labelMatch[2]), fontSize);
    const points = parsePathPoints(edge.attributes.get('d') ?? '');
    const markerGap = pointRectangleDistance(points.at(-1), bounds) * scale;
    assert.ok(markerGap >= 16, `${edge.id} marker-aware label clearance ${markerGap}`);
  }
}

async function runMutation(source, mutate, validator, label) {
  const mutated = mutate(source);
  assert.notEqual(mutated, source, `${label} mutation applies`);
  await assert.rejects(async () => validator(mutated), {name: 'AssertionError'}, label);
}

test('publishes exact STY-06 metadata, headings, relations, and one same-case comparison', async () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const metadata = parseFrontMatter(article.source);
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.topic_id, TOPIC_ID);
  assert.equal(metadata.priority, 'P0');
  assert.equal(metadata.slug, ROUTE);
  for (const [field, value] of Object.entries(RELATION_METADATA)) assert.deepEqual(metadata[field], value, field);
  const headings = findMarkdownHeadings(article.body).map(({text}) => text);
  assert.deepEqual(headings, HEADINGS);
  for (const heading of HEADINGS) assert.equal(headings.filter((candidate) => candidate === heading).length, 1, `${heading} once`);
  assertSameCaseComparison(article.source);
  await runMutation(article.source, (source) => source.replace(
    /(^### 事件携带状态\s*$)([\s\S]*?)(?=^### 事件溯源\s*$)/mu,
    '$1\n\n客户资料变更后，目录消费者更新商品分类。\n\n',
  ), assertSameCaseComparison, 'unrelated customer/catalog scenario');
});

test('locks semantic boundaries, distinct responsibilities, prohibitions, and reliability ownership', async () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  assertSemanticContract(article.source);
  const visible = visibleTextOf(article.source);
  for (const pattern of RELIABILITY_PATTERNS) assert.match(visible, pattern, `reliability ${pattern}`);
  for (const [index, conflation] of CONFLATIONS.entries()) {
    await runMutation(article.source, (source) => `${source}\n\n${[
      '命令就是领域事件。', '领域事件就是集成事件。', '事件代理就是事件存储。',
      'Outbox 就是事件存储。', '本地副本就是权威状态。', '投影就是事件存储。',
    ][index]}\n`, assertSemanticContract, `critical conflation ${conflation}`);
  }
  for (const prohibited of PROHIBITED) {
    await runMutation(article.source, (source) => `${source}\n\n${prohibited}。\n`, assertSemanticContract, prohibited);
  }
});

test('locks the four-mode decision matrix dimensions', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const table = markdownTable(article.body, 'four-mode decision matrix');
  const rows = table.split('\n').map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));
  assert.deepEqual(rows[0].slice(1), MODES, 'fixed four mode columns');
  assert.ok(rows.slice(2).every((row) => row.length === 5), 'one dimension plus four mode answers');
  const rowLabels = rows.slice(2).map(([label]) => label).join('\n');
  for (const pattern of MATRIX_ROWS) assert.match(rowLabels, pattern, `decision row ${pattern}`);
});

test('governs six sources, independent hosts, evidence roles, rights, and one manifest primary', () => {
  const documentRecord = ledger.documents[ARTICLE];
  assert.ok(documentRecord, `${ARTICLE} source-ledger document`);
  assert.deepEqual(documentRecord.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(documentRecord.citations.map(({source_id}) => source_id), SOURCE_IDS);
  assert.equal(documentRecord.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  assert.equal(documentRecord.citations.find(({manifest_primary}) => manifest_primary)?.source_id,
    'src-fowler-what-do-you-mean-event-driven');
  for (const sourceId of SOURCE_IDS) {
    const source = ledger.sources.find(({id}) => id === sourceId);
    const citation = documentRecord.citations.find(({source_id}) => source_id === sourceId);
    assert.ok(source, `${sourceId} governed source`);
    for (const field of SOURCE_REQUIRED_FIELDS) {
      assert.notDeepEqual(source[field], undefined, `${sourceId}.${field}`);
      assert.notDeepEqual(source[field], '', `${sourceId}.${field} nonempty`);
    }
    assert.ok(Array.isArray(source.allowed_evidence_roles) && source.allowed_evidence_roles.length > 0,
      `${sourceId} allowed evidence roles`);
    assert.ok(Array.isArray(citation?.roles) && citation.roles.length > 0, `${sourceId} citation roles`);
    assert.ok(citation.roles.every((role) => source.allowed_evidence_roles.includes(role)), `${sourceId} role boundary`);
    assert.equal(typeof citation.usage_mode, 'string', `${sourceId} usage mode`);
    assert.equal(typeof citation.attribution_note, 'string', `${sourceId} attribution`);
  }
  const remoteSources = SOURCE_IDS.slice(0, -1).map((id) => ledger.sources.find((source) => source.id === id));
  assert.ok(new Set(remoteSources.map(({canonical_locator}) => new URL(canonical_locator).hostname)).size >= 4,
    'at least four independent remote hostnames');
  const illustration = ledger.sources.find(({id}) => id === SOURCE_IDS.at(-1));
  assert.equal(illustration.source_kind, 'original-illustration');
  assert.equal(illustration.license, 'LicenseRef-Atlas-Original');
  assert.equal(illustration.copyright_policy, 'original-atlas');
  assert.match(illustration.license_evidence_note, /不含|no third-party/iu);
  assert.match(illustration.license_evidence_note, /参考图|reference image/iu);
  assert.match(illustration.license_evidence_note, /品牌|brand/iu);
  assert.match(illustration.license_evidence_note, /签名|signature/iu);
  assert.match(illustration.license_evidence_note, /水印|watermark/iu);
  assert.match(illustration.license_evidence_note, /构图|composition/iu);
  assert.ok(article, `${ARTICLE} visible sources`);
  assert.deepEqual(extractExternalLinks({body: article.body}).sort(), remoteSources.map(({canonical_locator}) => canonical_locator).sort());
});

test('locks reciprocal visible links and excludes actionable STY-07', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const articleLinks = extractInternalLinks({body: article.body});
  assert.ok(articleLinks.includes('/styles'), 'visible parent styles route');
  assert.ok(articleLinks.includes('/cases/apache-kafka-consumer-groups'), 'visible related case');
  assert.equal(articleLinks.includes('/styles/sty-07'), false, 'STY-07 is non-actionable');
  for (const file of RECIPROCAL_FILES) {
    const document = documents.find((candidate) => candidate.file === file);
    assert.ok(document, `${file} reciprocal document`);
    assert.ok(extractInternalLinks({body: document.body}).includes(ROUTE), `${file} visible ${ROUTE}`);
  }
  for (const document of documents) {
    assert.equal(extractInternalLinks({body: document.body}).includes('/styles/sty-07'), false,
      `${document.file} no actionable STY-07`);
  }
});

test('projects the exact STY-06 Stage A pre-closure state', () => {
  assert.deepEqual({
    completed_topics: projectStatus.completed_topics,
    content_documents: projectStatus.content_documents,
    governed_sources: projectStatus.governed_sources,
  }, {completed_topics: 58, content_documents: 101, governed_sources: 525});
  assert.equal(publicLedger.sources.length, 525);
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID);
  assert.equal(topic?.slug, ROUTE);
  assert.equal(topic?.published, true);
  assert.equal(topic?.status.value, 'pending');
  assert.deepEqual(topic?.dependencies, RELATION_METADATA.depends_on);
  assert.deepEqual(topic?.adjacent_topics, RELATION_METADATA.adjacent_topics);
  assert.deepEqual(topic?.related_cases, RELATION_METADATA.related_cases);
  assert.deepEqual(topic?.primary_sources, ['https://martinfowler.com/articles/201701-event-driven.html']);
  const nextTopic = manifest.topics.find(({id}) => id === 'STY-07');
  assert.equal(nextTopic?.published, false);
  assert.equal(nextTopic?.status.value, 'pending');
  assert.equal(indexes.style.find(({id}) => id === TOPIC_ID)?.published, true);
  assert.equal(indexes.style.find(({id}) => id === 'STY-07')?.published, false);
});

test('locks synchronized four-column/five-row diagram geometry and replay boundaries', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<title\b[^>]*>[^<]*(?:事件通知|事件驱动)[^<]*<\/title>/u);
  assert.match(svg, /<desc\b[^>]*>[^<]*(?=[^<]*事件通知)(?=[^<]*状态转移)(?=[^<]*事件携带状态)(?=[^<]*事件溯源)[^<]*<\/desc>/u);
  const root = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.match(root, /\bviewBox="0 0 [0-9.]+ [0-9.]+"/u);
  assert.match(root, /\brole="img"/u);
  assert.doesNotMatch(root, /\b(?:width|height)="/u);
  const drawioNodes = new Set(drawioContract(drawio).nodes.map(({attributes}) => attributes.get('id')));
  const svgNodes = new Set(svgContract(svg).nodes.map(({id}) => id));
  for (const id of [...COLUMN_IDS, ...ROW_IDS, ...CRITICAL_IDS]) {
    assert.ok(drawioNodes.has(id), `Draw.io ${id}`);
    assert.ok(svgNodes.has(id), `SVG ${id}`);
  }
  assert.deepEqual([...drawioNodes].sort(), [...svgNodes].sort(), 'Draw.io/SVG node ID parity');
  const drawioEdges = drawioContract(drawio).edges.map(({attributes}) => ({
    id: attributes.get('id'), source: attributes.get('source'), target: attributes.get('target'),
  }));
  const svgEdges = svgContract(svg).edges.map(({id, attributes}) => ({
    id, source: attributes.get('data-source'), target: attributes.get('data-target'),
  }));
  assert.deepEqual(drawioEdges.sort((left, right) => left.id.localeCompare(right.id)),
    svgEdges.sort((left, right) => left.id.localeCompare(right.id)), 'Draw.io/SVG edge ID and endpoint parity');
  for (const format of ['drawio', 'svg']) {
    const source = format === 'drawio' ? drawio : svg;
    for (const [nodeId, [columnId, rowId]] of NODE_PLACEMENTS) {
      assert.ok(contains(geometry(source, columnId, format), geometry(source, nodeId, format)),
        `${format} ${columnId} contains ${nodeId}`);
      assert.ok(contains(geometry(source, rowId, format), geometry(source, nodeId, format)),
        `${format} ${rowId} contains ${nodeId}`);
    }
  }
  for (const edges of [drawioEdges, svgEdges]) {
    const replayEdges = edges.filter(({id, source}) => id?.includes('replay') || source === 'replay-path');
    assert.ok(replayEdges.length > 0, 'explicit replay connector');
    for (const edge of replayEdges) assert.doesNotMatch(edge.target ?? '', /payment|notification|side-effect/u,
      `${edge.id} replay cannot target an external side effect`);
    assert.notEqual(edges.some(({source, target}) => source === 'event-store' && target === 'event-broker'), true,
      'event store and broker are separate responsibilities');
  }
});

test('keeps marker-aware label clearance and selector-bound effective contrast mutation-sensitive', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertDiagramPresentation(svg);
  const whiteEdge = svg.replace(/(\.[\w-]*edge[\w-]*\s*\{[^}]*\bstroke\s*:\s*)#[0-9A-Fa-f]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteEdge, svg, 'edge selector mutation applies');
  assert.throws(() => assertDiagramPresentation(whiteEdge), {name: 'AssertionError'}, 'selector-bound edge contrast');
  const whiteLabel = svg.replace(/(\.edge-label\s*\{[^}]*\bfill\s*:\s*)#[0-9A-Fa-f]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteLabel, svg, 'edge-label selector mutation applies');
  assert.throws(() => assertDiagramPresentation(whiteLabel), {name: 'AssertionError'}, 'selector-bound label contrast');
  const firstEdge = svgContract(svg).edges[0];
  const targetPoint = parsePathPoints(firstEdge.attributes.get('d') ?? '').at(-1);
  const hiddenLabel = svg.replace(
    new RegExp(`(<text\\b[^>]*data-edge-id="${escapeRegExp(firstEdge.id)}"[^>]*\\bx=")[^"]+("[^>]*\\by=")[^"]+`, 'u'),
    `$1${targetPoint.x}$2${targetPoint.y}`,
  );
  assert.notEqual(hiddenLabel, svg, 'marker/label collision mutation applies');
  assert.throws(() => assertDiagramPresentation(hiddenLabel), {name: 'AssertionError'}, 'actual marker-aware label clearance');
});
