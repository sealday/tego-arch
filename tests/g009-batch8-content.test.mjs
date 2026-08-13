import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

export const ARTICLE = 'content/styles/sty-07-service-oriented-architecture.mdx';
export const DRAWIO = 'diagrams/sty-07-soa-microservices-order-fulfillment.drawio';
export const SVG = 'static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg';
export const TOPIC_ID = 'STY-07';
export const NEXT_TOPIC = 'STY-08';
export const EXPECTED_HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
export const SOURCE_IDS = [
  'src-oasis-soa-reference-model-1-0',
  'src-oasis-soa-reference-architecture-foundation-1-0',
  'src-w3c-web-services-architecture',
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-atlas-sty07-soa-microservices-order-fulfillment',
];
export const ROUTE = '/styles/sty-07';
export const EXPECTED_STAGE_A = Object.freeze({completed_topics: 59, content_documents: 102, governed_sources: 529});
export const RELATIONS = Object.freeze({
  depends_on: ['STY-00', 'STY-05'],
  adjacent_topics: ['STY-04', 'STY-05', 'STY-06'],
  related_cases: ['/cases/temporal-saga-durable-execution'],
  related_questions: [],
});
export const EXACT_METADATA = Object.freeze({
  title: '面向服务架构：用稳定合同连接企业能力，也约束集中治理',
  slug: ROUTE,
  content_type: 'style',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-13',
  source_cutoff: '2026-08-13',
  confidence: 'high',
  domains: ['software-architecture', 'enterprise-integration', 'distributed-systems'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['interoperability', 'maintainability', 'deployability', 'recoverability', 'operability'],
  tags: ['架构风格', '面向服务架构', '服务合同', '企业集成'],
  summary: '以企业级订单履约为统一案例，比较经典面向服务架构与微服务的合同、编排、数据权威、部署和治理责任，并明确企业服务总线不是架构定义。',
  topic_id: TOPIC_ID,
  priority: 'P1',
  ...RELATIONS,
});
export const REQUIRED_WRAPPERS = Object.freeze([
  {aria: '经典面向服务架构与微服务订单履约机制对照图，可横向滚动', className: 'architecture-diagram-scroll'},
  {aria: '经典面向服务架构与微服务八维机制对照表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
  {aria: '面向服务架构采用、收紧与停止决策表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
]);
export const OWNERSHIP = Object.freeze([
  ['order-authority', /订单系统[^。；]*拥有[^。；]*订单状态/u],
  ['inventory-authority', /库存系统[^。；]*拥有[^。；]*预留/u],
  ['payment-authority', /支付系统[^。；]*拥有[^。；]*支付/u],
  ['notification-authority', /通知系统[^。；]*拥有[^。；]*投递状态/u],
  ['orchestration-state', /编排器[^。；]*拥有[^。；]*流程状态|编排器[^。；]*持久化[^。；]*流程/u],
  ['orchestration-recovery-decision', /编排器[^。；]*(?:负责|作出)[^。；]*(?:恢复决策|恢复|终止流程)/u],
  ['integration-transport', /集成基础设施[^。；]*负责[^。；]*(路由|转换|技术传输)/u],
]);
const NEGATED_OWNER = /不负责|没有所有者|无人负责|责任待定|所有者待定|尚未明确|未指定/u;
const PROHIBITIONS = Object.freeze([
  ['SOA is not ESB', /SOA[^。；]*(?:不等于|不是)[^。；]*ESB|ESB[^。；]*(?:不等于|不是)[^。；]*SOA/iu],
  ['SOA is not Web Services', /SOA[^。；]*(?:不等于|不是)[^。；]*Web Services|Web Services[^。；]*(?:不等于|不是)[^。；]*SOA/iu],
  ['SOA is not messaging middleware', /SOA[^。；]*(?:不等于|不是)[^。；]*(?:消息中间件|Messaging Middleware)|(?:消息中间件|Messaging Middleware)[^。；]*(?:不等于|不是)[^。；]*SOA/iu],
  ['SOA does not authorize shared writes', /(?:不授权|禁止)[^。；]*(?:共享数据库写入|共享写入)|共享数据库写入[^。；]*(?:不被|不得|禁止)/u],
  ['integration infrastructure does not own business outcomes', /集成基础设施[^。；]*(?:不拥有|不得拥有|不能拥有)[^。；]*(?:业务状态|业务结果|业务决定)|(?:业务状态|业务结果|业务决定)[^。；]*(?:不归|不属于)[^。；]*集成基础设施/u],
]);
export const COMPARISON_ROWS = Object.freeze([
  ['优化尺度', /企业能力复用.*异构系统互操作/u, /单个团队.*快速自治交付/u],
  ['合同', /企业级.*稳定.*显式治理.*服务合同/u, /团队拥有.*兼容演进.*业务合同/u],
  ['协作', /可集中编排.*消息/u, /分散协作.*不禁止编排/u],
  ['数据权威', /各业务系统.*不因集成.*共享写入/u, /服务私有权威数据/u],
  ['部署', /参与系统.*独立部署.*协调窗口/u, /独立部署.*独立回滚.*核心约束/u],
  ['平台', /共享注册.*策略.*转换.*编排.*观测/u, /平台.*护栏.*不拥有业务决定/u],
  ['故障责任', /编排器.*流程推进.*参与系统.*本地结果.*恢复/u, /服务团队.*端到端.*合同.*数据.*部署.*运行/u],
  ['主要风险', /中央集成层.*业务逻辑.*共享状态中心/u, /服务碎片化.*分布式运行成本/u],
]);
export const FAILURE_ROWS = Object.freeze([
  ['路由或协议转换失败', /集成错误.*目标不可达/u, /有界技术重试.*隔离.*切换/u, /重试预算耗尽.*映射不可信/u, /集成平台所有者/u],
  ['业务拒绝', /合同返回.*明确拒绝/u, /编排器.*业务分支/u, /无安全自动分支/u, /对应业务系统所有者/u],
  ['结果未知', /超时.*无权威结果/u, /稳定标识.*查询.*对账/u, /截止期.*仍未知/u, /编排器.*业务系统.*共同升级/u],
  ['重复调用或消息', /请求标识.*去重记录/u, /既有结果.*幂等忽略/u, /标识冲突.*结果不一致/u, /接收业务系统所有者/u],
  ['合同不兼容', /合同测试.*运行拒绝/u, /兼容版本.*停止切换/u, /无受支持兼容路径/u, /合同生产者.*消费者/u],
  ['补偿失败', /补偿结果.*拒绝.*未知.*超时/u, /查询.*对账.*受控重试/u, /动作不可逆.*预算耗尽/u, /业务流程所有者/u],
  ['死信或积压', /队列深度.*最老消息.*失败率/u, /隔离.*修复后.*受控重放/u, /重放会重复不可逆副作用/u, /集成.*业务所有者.*技术.*业务判断/u],
]);
const SOURCE_REQUIRED_FIELDS = ['canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version',
  'source_kind', 'tier', 'allowed_evidence_roles', 'license', 'license_scope', 'license_evidence_url',
  'license_evidence_note', 'copyright_policy', 'usage_boundary'];
const COPYRIGHT_CHECKS = ['original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights'];
const RECIPROCALS = Object.freeze([
  'content/styles/sty-04-modular-monolith.mdx', 'content/styles/sty-05-microservices.mdx',
  'content/styles/sty-06-event-driven-architecture.mdx', 'content/cases/temporal-saga-durable-execution.mdx',
]);
const DIAGRAM_NODES = Object.freeze([
  'soa-side', 'microservices-side', 'comparison-boundary', 'order-system', 'inventory-system',
  'payment-system', 'notification-system', 'soa-orchestrator', 'integration-infrastructure',
  'microservices-order', 'microservices-inventory', 'microservices-payment', 'microservices-notification',
  'platform-guardrails', 'legend',
]);
const DIAGRAM_EDGES = Object.freeze(['business-call', 'message', 'technical-route', 'compensation']);

function file(path) { return existsSync(path) ? readFileSync(path, 'utf8') : undefined; }
function articleParts(source) {
  assert.ok(source, `${ARTICLE} must exist after implementation`);
  const close = source.indexOf('\n---', 3);
  assert.ok(close >= 0, 'front matter closes');
  return {source, body: source.slice(close + 4)};
}
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'); }
export function markdownTables(body) {
  const result = [];
  const lines = body.split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\|/u.test(lines[index])) continue;
    const table = [];
    while (index < lines.length && /^\|/u.test(lines[index])) {
      table.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim())); index += 1;
    }
    result.push(table); index -= 1;
  }
  return result.filter((table) => table.length >= 3 && table[1].every((cell) => /^:?-{3,}:?$/u.test(cell)));
}
function exactWrapperTag(wrapper) {
  return `<div className="${wrapper.className}" role="region" aria-label="${wrapper.aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`;
}
function removeFrontMatterField(source, field) {
  const fieldLine = new RegExp(`^${escapeRegExp(field)}:.*(?:\\r?\\n  - [^\\r\\n]+)*(?:\\r?\\n|$)`, 'mu');
  assert.match(source, fieldLine, `${field} front-matter field exists for deletion mutation`);
  return source.replace(fieldLine, '');
}
function changeFrontMatterField(source, field) {
  const original = EXACT_METADATA[field];
  if (Array.isArray(original)) {
    if (original.length === 0) {
      const token = `${field}: []`;
      assert.ok(source.includes(token), `${field} empty-array field exists for change mutation`);
      return source.replace(token, `${field}: [changed]`);
    }
    const token = `  - ${original[0]}`;
    assert.ok(source.includes(token), `${field} first array item exists for change mutation`);
    return source.replace(token, '  - changed');
  }
  const token = `${field}: ${original}`;
  assert.ok(source.includes(token), `${field} scalar field exists for change mutation`);
  return source.replace(token, `${field}: changed`);
}
export function assertExactMetadata(source) { assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-07 front matter'); }
export function assertRequiredWrappers(source) {
  for (const wrapper of REQUIRED_WRAPPERS) assert.ok(source.includes(exactWrapperTag(wrapper)), `exact scroll wrapper: ${wrapper.aria}`);
  assert.equal((source.match(/role="region"/gu) ?? []).length, 3, 'exactly three scroll owners');
}
export function assertOwnership(source) {
  for (const [name, pattern] of OWNERSHIP) {
    const sentence = source.split(/[。；\n]/u).find((candidate) => pattern.test(candidate));
    assert.ok(sentence, `${name} affirmative responsibility`);
    assert.doesNotMatch(sentence, NEGATED_OWNER, `${name} cannot be negated or unresolved`);
  }
}
export function assertProhibitions(source) {
  for (const [name, pattern] of PROHIBITIONS) assert.match(source, pattern, name);
  assert.doesNotMatch(source, /(?:SOA|面向服务架构)[^。；]*(?:(?<!不)等于|就是)[^。；]*(?:ESB|Web Services|消息中间件)|(?:ESB|Web Services|消息中间件)[^。；]*(?:(?<!不)等于|就是)[^。；]*(?:SOA|面向服务架构)/iu, 'SOA product equivalence is forbidden');
  assert.doesNotMatch(source, /集成基础设施[^。；]*(?:(?<!不)拥有|(?<!不)决定)[^。；]*(?:业务状态|业务结果|业务决定)/u, 'integration infrastructure cannot own business state/outcomes');
}
function exactRows(table, expected, heading, columns) {
  assert.deepEqual(table[0], heading, 'exact table header');
  assert.match(table[1].join('|'), /^-+/u, 'table divider');
  assert.equal(table.length, expected.length + 2, 'exact row count');
  for (const [index, [label, ...patterns]] of expected.entries()) {
    const row = table[index + 2]; assert.equal(row[0], label, `row ${index + 1} label/order`);
    assert.equal(row.length, columns, `${label} cell count`);
    for (const [cell, pattern] of patterns.entries()) assert.match(row[cell + 1], pattern, `${label} cell ${cell + 1}`);
  }
}
export function assertComparisonTable(source) {
  const table = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '问题');
  assert.ok(table, 'eight-row SOA/microservices comparison table');
  exactRows(table, COMPARISON_ROWS, ['问题', '经典 SOA', '微服务'], 3);
  assert.match(source, /不是成熟度阶梯/u, 'comparison is not a maturity ladder');
}
export function assertFailureTable(source) {
  const table = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别');
  assert.ok(table, 'seven-row failure table');
  exactRows(table, FAILURE_ROWS, ['失败类别', '检测', '自动动作', '停止条件', '人工所有者'], 5);
  assert.match(source, /结果未知[^。；]*不盲目[^。；]*(重复支付|预留|补偿)/u, 'unknown result does not blind-retry');
}
function attrs(tag) { return new Map([...tag.matchAll(/([:\w-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value])); }
function decodeXmlText(value) { return value.replace(/&(?:#(\d+)|#x([\da-f]+)|amp|lt|gt|quot);/giu, (entity, decimal, hex) => {
  if (decimal) return String.fromCodePoint(Number(decimal));
  if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
  return ({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'})[entity] ?? entity;
}); }
export function parseDrawio(source) {
  const cells = [...source.matchAll(/<mxCell\b([^>]*)(?:\/>|>([\s\S]*?)<\/mxCell>)/gu)].map((match) => {
    const body = match[2] ?? ''; const geometryTag = body.match(/<mxGeometry\b([^>]*)/u)?.[1] ?? '';
    return {attributes: attrs(match[1]), body, geometry: attrs(geometryTag), label: decodeXmlText(attrs(match[1]).get('value') ?? '')};
  });
  return {nodes: cells.filter(({attributes}) => attributes.get('vertex') === '1'), edges: cells.filter(({attributes}) => attributes.get('edge') === '1')};
}
export function parseSvg(source) {
  const elements = [...source.matchAll(/<(svg|g|path|rect|text|marker)\b([^>]*)>/gu)].map((match, index) => ({name: match[1], attributes: attrs(match[2]), index, tag: match[0]}));
  return {elements, nodes: elements.filter(({attributes}) => attributes.has('data-node-id')),
    edges: elements.filter(({attributes}) => attributes.has('data-edge-id'))};
}
function styleRules(source) {
  const styles = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)].map(([, css]) => css).join('\n');
  return [...styles.matchAll(/([^{}]+)\{([^}]*)\}/gu)].map(([, selectors, declarations]) => ({selectors, declarations}));
}
function selectorMatches(element, selector) {
  const trimmed = selector.trim();
  if (!trimmed || /[ >+~]/u.test(trimmed)) return false;
  const id = trimmed.match(/#([\w-]+)/u)?.[1];
  const classes = [...trimmed.matchAll(/\.([\w-]+)/gu)].map((match) => match[1]);
  return (!id || element.attributes.get('id') === id) && classes.every((value) => (element.attributes.get('class') ?? '').split(/\s+/u).includes(value));
}
export function svgPresentationValue(source, element, property) {
  const candidates = [];
  for (const rule of styleRules(source)) for (const selector of rule.selectors.split(',')) if (selectorMatches(element, selector)) {
    const declaration = rule.declarations.match(new RegExp(`(?:^|;)\\s*${escapeRegExp(property)}\\s*:\\s*([^;]+)`, 'iu'))?.[1];
    if (declaration) candidates.push({value: declaration.replace(/\s*!important\s*$/iu, '').trim(), important: /!important/iu.test(declaration), specificity: selector.split(/[.#]/u).length});
  }
  const inline = element.attributes.get('style')?.match(new RegExp(`(?:^|;)\\s*${escapeRegExp(property)}\\s*:\\s*([^;]+)`, 'iu'))?.[1];
  if (inline) candidates.push({value: inline.replace(/\s*!important\s*$/iu, '').trim(), important: /!important/iu.test(inline), specificity: 99});
  if (element.attributes.has(property)) candidates.push({value: element.attributes.get(property), important: false, specificity: 0});
  return candidates.sort((left, right) => Number(right.important) - Number(left.important) || right.specificity - left.specificity)[0]?.value;
}
function alphaComposite(hex, alpha, background = '#FFFFFF') {
  const channel = (value, index) => Number.parseInt(value.slice(index, index + 2), 16);
  const toHex = (value) => Math.round(value).toString(16).padStart(2, '0');
  return `#${[1, 3, 5].map((index) => toHex(channel(hex, index) * alpha + channel(background, index) * (1 - alpha))).join('')}`.toUpperCase();
}
export function glyphBox({x, y, text, fontSize}) {
  const width = [...text].reduce((sum, character) => sum + (/^[\u0000-\u00FF]$/u.test(character) ? .62 : 1), 0) * fontSize;
  const round = (value) => Math.round(value * 1e6) / 1e6;
  return {left: round(x - width / 2), right: round(x + width / 2), top: y - fontSize, bottom: y};
}
function numericBounds(attributes) {
  const bounds = Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(attributes.get(key))]));
  assert.ok(Object.values(bounds).every(Number.isFinite), 'finite node bounds'); return bounds;
}
function drawioStyle(cell) { return new Map((cell.attributes.get('style') ?? '').split(';').filter(Boolean).map((entry) => entry.split(/=(.*)/su))); }
export function drawioTerminalPoint(drawio, edge, kind) {
  const style = drawioStyle(edge); const prefix = kind === 'source' ? 'exit' : 'entry'; const id = edge.attributes.get(kind);
  const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id); assert.ok(node, `${edge.attributes.get('id')} ${kind} terminal`);
  for (const property of [`${prefix}X`, `${prefix}Y`, `${prefix}Dx`, `${prefix}Dy`, `${prefix}Perimeter`]) assert.ok(style.has(property), `${edge.attributes.get('id')} ${property}`);
  assert.equal(style.get(`${prefix}Perimeter`), '1', `${edge.attributes.get('id')} ${prefix} perimeter`);
  assert.equal(style.get(`${prefix}Dx`), '0', `${edge.attributes.get('id')} ${prefix}Dx`); assert.equal(style.get(`${prefix}Dy`), '0', `${edge.attributes.get('id')} ${prefix}Dy`);
  const x = Number(style.get(`${prefix}X`)); const y = Number(style.get(`${prefix}Y`));
  assert.ok([x, y].every((value) => Number.isFinite(value) && value >= 0 && value <= 1), `${edge.attributes.get('id')} normalized ${prefix} port`);
  assert.ok(x === 0 || x === 1 || y === 0 || y === 1, `${edge.attributes.get('id')} ${prefix} port on perimeter`);
  const bounds = numericBounds(node.geometry); return {x: bounds.x + bounds.width * x, y: bounds.y + bounds.height * y};
}
export function drawioRoute(drawio, edge) {
  assert.doesNotMatch(edge.body, /<mxPoint\b[^>]*\bas="(?:sourcePoint|targetPoint)"/u, `${edge.attributes.get('id')} has no ignored fallback point`);
  assert.equal(edge.attributes.has('dataRoute'), false, `${edge.attributes.get('id')} has no self-reported route`);
  const array = edge.body.match(/<Array\b[^>]*\bas="points"[^>]*>([\s\S]*?)<\/Array>/u)?.[1]; assert.ok(array !== undefined, `${edge.attributes.get('id')} waypoint Array`);
  const waypoints = [...array.matchAll(/<mxPoint\b([^>]*)\/>/gu)].map(([, raw]) => attrs(raw)).map((point) => ({x: Number(point.get('x')), y: Number(point.get('y'))}));
  assert.ok(waypoints.length > 0 && waypoints.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), `${edge.attributes.get('id')} actual waypoints`);
  return [drawioTerminalPoint(drawio, edge, 'source'), ...waypoints, drawioTerminalPoint(drawio, edge, 'target')];
}
export function parsePathPoints(data) {
  const tokens = data.match(/[MHV]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []; const points = []; let cursor = 0; let x = 0; let y = 0;
  while (cursor < tokens.length) { const command = tokens[cursor++]; if (command === 'M') { x = Number(tokens[cursor++]); y = Number(tokens[cursor++]); } else if (command === 'H') x = Number(tokens[cursor++]); else if (command === 'V') y = Number(tokens[cursor++]); else assert.fail(`unsupported connector path command ${command}`); points.push({x, y}); }
  assert.ok(points.length >= 2, `orthogonal connector path ${data}`); return points;
}
function segmentDistance(left, right, box) {
  const horizontal = left.y === right.y; assert.ok(horizontal || left.x === right.x, 'orthogonal segment');
  const dx = horizontal ? Math.max(box.left - Math.max(left.x, right.x), Math.min(left.x, right.x) - box.right, 0) : Math.max(box.left - left.x, left.x - box.right, 0);
  const dy = horizontal ? Math.max(box.top - left.y, left.y - box.bottom, 0) : Math.max(box.top - Math.max(left.y, right.y), Math.min(left.y, right.y) - box.bottom, 0);
  return Math.hypot(dx, dy);
}
function paintOpacity(source, element, kind) { return Number(svgPresentationValue(source, element, `${kind}-opacity`) ?? svgPresentationValue(source, element, 'opacity') ?? 1); }
function blendHex(foreground, background, opacity) { const channels = (value) => value.match(/[\da-f]{2}/giu).map((entry) => Number.parseInt(entry, 16)); const left = channels(foreground); const right = channels(background); return `#${left.map((value, index) => Math.round(value * opacity + right[index] * (1 - opacity)).toString(16).padStart(2, '0')).join('')}`; }
function luminance(color) { const rgb = color.match(/[\da-f]{2}/giu).map((entry) => Number.parseInt(entry, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4); return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722; }
function contrastRatio(left, right) { const [light, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a); return (light + .05) / (dark + .05); }
function labelBox(element, label, fontSize) { const x = Number(element.attributes.get('x')); const y = Number(element.attributes.get('y')); return glyphBox({x, y, text: label, fontSize}); }
function assertNoOverdraw(source) {
  const {elements} = parseSvg(source); const paths = elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-edge-id'));
  for (const path of paths) for (const mask of elements.filter(({name, index}) => name === 'rect' && index > path.index)) {
    const fill = svgPresentationValue(source, mask, 'fill'); const opacity = fill && fill !== 'none' ? paintOpacity(source, mask, 'fill') : 0;
    if (opacity > 0) { const bounds = numericBounds(mask.attributes); const points = parsePathPoints(path.attributes.get('d')); assert.ok(!points.slice(1).some((point, index) => segmentDistance(points[index], point, {left: bounds.x, right: bounds.x + bounds.width, top: bounds.y, bottom: bounds.y + bounds.height}) === 0), `${path.attributes.get('data-edge-id')} no later opaque/translucent mask`); }
  }
}
function assertDiagram(sourceDrawio, sourceSvg) {
  assert.match(sourceDrawio, /<mxfile\b/u, 'Draw.io file');
  const root = sourceSvg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.match(root, /role="img"/u); assert.match(root, /viewBox="0 0 [0-9.]+ [0-9.]+"/u);
  assert.doesNotMatch(root, /(?:width|height)="/u, 'responsive SVG');
  const drawio = parseDrawio(sourceDrawio); const svg = parseSvg(sourceSvg);
  for (const id of DIAGRAM_NODES) {
    const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id); const rendered = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id);
    assert.ok(node, `Draw.io node ${id}`); assert.ok(rendered, `SVG node ${id}`);
    assert.equal(rendered.attributes.get('data-node-bounds'), `${node.geometry.get('x')} ${node.geometry.get('y')} ${node.geometry.get('width')} ${node.geometry.get('height')}`, `${id} bounds parity`);
  }
  const viewBox = root.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/u); const scale = 800 / Number(viewBox?.[1]);
  for (const role of DIAGRAM_EDGES) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('dataRole') === role);
    assert.ok(edge, `Draw.io ${role}`); const route = drawioRoute(drawio, edge); const id = edge.attributes.get('id');
    const path = svg.elements.find(({name, attributes}) => name === 'path' && attributes.get('data-edge-id') === id); const label = svg.elements.find(({name, attributes}) => name === 'text' && attributes.get('data-edge-id') === id);
    assert.ok(path && label, `SVG ${role} path/label`); assert.equal(path.attributes.get('data-source'), edge.attributes.get('source'), `${id} semantic source`); assert.equal(path.attributes.get('data-target'), edge.attributes.get('target'), `${id} semantic target`);
    assert.deepEqual(parsePathPoints(path.attributes.get('d')), route, `${id} actual route parity`); assert.equal(label.attributes.get('data-role'), role, `${id} label role`); assert.equal(path.attributes.get('data-role'), role, `${id} path role`);
    const visibleLabel = decodeXmlText(sourceSvg.match(new RegExp(`${escapeRegExp(label.tag)}([^<]*)<\\/text>`, 'u'))?.[1] ?? ''); assert.equal(visibleLabel, edge.label, `${id} label parity`);
    const style = drawioStyle(edge); assert.equal(svgPresentationValue(sourceSvg, path, 'stroke'), style.get('strokeColor'), `${id} effective stroke`); assert.equal(Number(svgPresentationValue(sourceSvg, path, 'stroke-width')), Number(style.get('strokeWidth')), `${id} stroke width`);
    const markerId = svgPresentationValue(sourceSvg, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${id} effective marker`); const marker = svg.elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const markerRaw = sourceSvg.match(new RegExp(`<marker\\b[^>]*\\bid="${escapeRegExp(markerId)}"[^>]*>([\\s\\S]*?)<\\/marker>`, 'u'))?.[1] ?? ''; const markerPath = {attributes: attrs(markerRaw.match(/<path\\b([^>]*)>/u)?.[1] ?? '')};
    assert.ok(marker && markerRaw && markerPath.attributes.size > 0, `${id} marker definition`); assert.equal(svgPresentationValue(sourceSvg, markerPath, 'fill'), style.get('endFill') === '0' ? 'none' : style.get('strokeColor'), `${id} marker fill`); assert.equal(svgPresentationValue(sourceSvg, markerPath, 'stroke'), style.get('strokeColor'), `${id} marker stroke`); assert.ok(Number(marker.attributes.get('markerWidth')) * scale <= 16 && Number(marker.attributes.get('markerHeight')) * scale <= 16, `${id} bounded marker`);
    assert.equal(svgPresentationValue(sourceSvg, path, 'stroke-dasharray') ?? '', style.get('dashed') === '1' ? style.get('dashPattern') : '', `${id} dash role`);
    const fontSize = Number(svgPresentationValue(sourceSvg, label, 'font-size')); const text = sourceSvg.match(new RegExp(`${escapeRegExp(label.tag)}([^<]*)<\\/text>`, 'u'))?.[1] ?? ''; const box = labelBox(label, decodeXmlText(text), fontSize);
    const points = parsePathPoints(path.attributes.get('d')); const strokeGap = Math.min(...points.slice(1).map((point, index) => segmentDistance(points[index], point, box))) * scale; assert.ok(strokeGap >= 8, `${id} connector clearance`); const markerGap = Math.hypot(points.at(-1).x - (box.left + box.right) / 2, points.at(-1).y - (box.top + box.bottom) / 2) * scale; assert.ok(markerGap >= 16, `${id} marker clearance`);
    assert.ok(fontSize * scale >= (/图例|业务调用|消息|路由|补偿/u.test(text) ? 12 : 15), `${id} rendered font`);
  }
  const canvas = sourceSvg.match(/<(?:rect|path)\b[^>]*\bid="(?:canvas|background)"[^>]*>/u)?.[0] ?? '';
  assert.ok(canvas && !/fill="(?:none|transparent)"/iu.test(canvas), 'opaque canvas');
  const canvasElement = svg.elements.find(({attributes}) => /^(?:canvas|background)$/u.test(attributes.get('id') ?? ''));
  const background = svgPresentationValue(sourceSvg, canvasElement, 'fill'); assert.ok(background && background !== 'none', 'effective canvas background');
  const text = [...sourceSvg.matchAll(/<text\b([^>]*)>([^<]+)<\/text>/gu)];
  for (const [, raw, label] of text) {
    const attributes = attrs(raw); const rendered = {attributes}; const size = Number(svgPresentationValue(sourceSvg, rendered, 'font-size'));
    if (/图例|业务调用|消息|路由|补偿/u.test(label)) assert.ok(size * scale >= 12, `legend text ${label}`);
    else assert.ok(size * scale >= 15, `essential text ${label}`);
    assert.ok(contrastRatio(blendHex(svgPresentationValue(sourceSvg, rendered, 'fill'), background, paintOpacity(sourceSvg, rendered, 'fill')), background) >= 4.5, `effective text contrast ${label}`);
  }
  assertNoOverdraw(sourceSvg);
  return {drawio, svg, alphaComposite};
}
async function mutation(source, transform, validator, label) {
  const changed = transform(source); assert.notEqual(changed, source, `${label} mutation applies`);
  assert.throws(() => validator(changed), assert.AssertionError, label);
}

test('SVG cascade, alpha composition, and conservative glyph geometry helpers are meaningful', () => {
  const svg = '<svg><style>#x.edge { stroke: #FFFFFF !important; }</style><path id="x" class="edge" style="stroke: #334155"/></svg>';
  const element = parseSvg(svg).elements.find(({attributes}) => attributes.get('id') === 'x');
  assert.equal(svgPresentationValue(svg, element, 'stroke'), '#FFFFFF');
  assert.equal(alphaComposite('#000000', .5), '#808080');
  assert.equal(blendHex('#000000', '#FFFFFF', .5), '#808080');
  assert.ok(contrastRatio('#000000', '#FFFFFF') >= 21, 'effective foreground/background contrast');
  assert.deepEqual(glyphBox({x: 10, y: 20, text: 'A中', fontSize: 10}), {left: 1.9, right: 18.1, top: 10, bottom: 20});
  const drawio = parseDrawio('<mxfile><mxCell id="a" vertex="1"><mxGeometry x="0" y="0" width="20" height="20"/></mxCell><mxCell id="b" vertex="1"><mxGeometry x="100" y="0" width="20" height="20"/></mxCell><mxCell id="e" edge="1" source="a" target="b" style="exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=1"><mxGeometry><Array as="points"><mxPoint x="60" y="10"/></Array></mxGeometry></mxCell></mxfile>');
  const edge = drawio.edges[0]; assert.deepEqual(drawioRoute(drawio, edge), [{x: 20, y: 10}, {x: 60, y: 10}, {x: 100, y: 10}]);
  assert.throws(() => drawioRoute(drawio, {...edge, body: `${edge.body}<mxPoint as="sourcePoint" x="0" y="0"/>`}), assert.AssertionError, 'fallback terminal point rejected');
  const masked = '<svg><path data-edge-id="e" d="M 0 0 H 20"/><rect x="10" y="-1" width="2" height="2" fill="#000000" opacity="0.5"/></svg>';
  assert.throws(() => assertNoOverdraw(masked), assert.AssertionError, 'ordinary translucent later mask rejected');
});

test('metadata, wrapper, ownership, and prohibition fixtures prove all mutations are non-no-op', () => {
  const scalar = Object.entries(EXACT_METADATA).filter(([, value]) => !Array.isArray(value)).map(([field, value]) => `${field}: ${value}`);
  const arrays = Object.entries(EXACT_METADATA).filter(([, value]) => Array.isArray(value)).flatMap(([field, values]) =>
    values.length === 0 ? [`${field}: []`] : [`${field}:`, ...values.map((value) => `  - ${value}`)]);
  const metadata = `---\n${[...scalar, ...arrays].join('\n')}\n---\n`;
  assertExactMetadata(metadata);
  for (const field of Object.keys(EXACT_METADATA)) {
    const deleted = removeFrontMatterField(metadata, field); const changed = changeFrontMatterField(metadata, field);
    assert.notEqual(deleted, metadata, `${field} deletion fixture mutates`); assert.notEqual(changed, metadata, `${field} change fixture mutates`);
    assert.throws(() => assertExactMetadata(deleted), assert.AssertionError, `${field} deletion fixture rejects`);
    assert.throws(() => assertExactMetadata(changed), assert.AssertionError, `${field} change fixture rejects`);
  }
  const wrappers = REQUIRED_WRAPPERS.map(exactWrapperTag).join('\n'); assertRequiredWrappers(wrappers);
  for (const wrapper of REQUIRED_WRAPPERS) assert.throws(() => assertRequiredWrappers(wrappers.replace(' role="region"', ' role="group"')), assert.AssertionError, `${wrapper.aria} wrapper change fixture rejects`);
  const ownership = [
    '订单系统拥有订单状态。库存系统拥有预留。支付系统拥有支付结果。通知系统拥有投递状态。',
    '编排器拥有流程状态并负责恢复决策。集成基础设施负责路由、转换和技术传输。',
  ].join('');
  assertOwnership(ownership); assertProhibitions('SOA 不等于 ESB。SOA 不等于 Web Services。SOA 不等于消息中间件。SOA 不授权共享数据库写入。集成基础设施不拥有业务状态或业务结果。');
});

test('locks exact STY-07 article metadata, headings, wrappers, ownership, and prose boundaries', async () => {
  const source = file(ARTICLE); const {body} = articleParts(source);
  assertExactMetadata(source);
  assert.deepEqual(findMarkdownHeadings(body).filter(({level}) => level === 2).map(({text}) => text), EXPECTED_HEADINGS);
  assertRequiredWrappers(source); assertOwnership(source); assertProhibitions(source);
  for (const field of Object.keys(EXACT_METADATA)) {
    await mutation(source, (candidate) => removeFrontMatterField(candidate, field), assertExactMetadata, `${field} deleted`);
    await mutation(source, (candidate) => changeFrontMatterField(candidate, field), assertExactMetadata, `${field} changed`);
  }
  for (const wrapper of REQUIRED_WRAPPERS) for (const [name, from, deleted, changed] of [
    ['role', ' role="region"', '', ' role="group"'], ['aria', ` aria-label="${wrapper.aria}"`, '', ` aria-label="${wrapper.aria} changed"`],
    ['tabIndex', ' tabIndex={0}', '', ' tabIndex={-1}'], ['handler', ' onKeyDown={handleHorizontalArrowKey}', '', ' onKeyDown={() => {}}'],
  ]) {
    await mutation(source, (candidate) => candidate.replace(exactWrapperTag(wrapper), exactWrapperTag(wrapper).replace(from, deleted)), assertRequiredWrappers, `${wrapper.aria} ${name} deleted`);
    await mutation(source, (candidate) => candidate.replace(exactWrapperTag(wrapper), exactWrapperTag(wrapper).replace(from, changed)), assertRequiredWrappers, `${wrapper.aria} ${name} changed`);
  }
  for (const [name, pattern] of OWNERSHIP) await mutation(source, (candidate) => candidate.replace(pattern, '责任待定'), assertOwnership, `${name} polarity reversal`);
  for (const [name, pattern] of PROHIBITIONS) await mutation(source, (candidate) => candidate.replace(pattern, 'SOA 等于 ESB'), assertProhibitions, name);
  await mutation(source, (candidate) => `${candidate}\n集成基础设施拥有支付是否成功和订单终止等业务结果。\n`, assertProhibitions, 'integration business ownership introduced');
});

test('locks exact eight-row comparison and seven-row failure responsibilities', async () => {
  const source = file(ARTICLE); articleParts(source); assertComparisonTable(source); assertFailureTable(source);
  for (const validator of [assertComparisonTable, assertFailureTable]) {
    const table = validator === assertComparisonTable ? markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '问题') : markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别');
    for (const cells of table.slice(2)) {
      const row = `| ${cells.join(' | ')} |`;
      await mutation(source, (candidate) => candidate.replace(`${row}\n`, ''), validator, `${cells[0]} deletion`);
      for (let cell = 1; cell < cells.length; cell += 1) {
        const changed = [...cells]; changed[cell] = '错误语义';
        await mutation(source, (candidate) => candidate.replace(row, `| ${changed.join(' | ')} |`), validator, `${cells[0]} cell ${cell} changed`);
      }
      if (cells.length > 2) await mutation(source, (candidate) => candidate.replace(row,
        `| ${[cells[0], cells[2], cells[1], ...cells.slice(3)].join(' | ')} |`), validator, `${cells[0]} swapped cells`);
    }
  }
  const failures = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别').slice(2);
  for (const failure of failures) {
    await mutation(source, (candidate) => candidate.replace(failure.at(-1), '平台团队'), assertFailureTable, `${failure[0]} owner changed`);
    await mutation(source, (candidate) => candidate.replace(failure[3], '继续自动执行'), assertFailureTable, `${failure[0]} stop condition changed`);
  }
  await mutation(source, (candidate) => `${candidate}\nSOA 与微服务构成成熟度阶梯。\n`, assertComparisonTable, 'fabricated maturity ladder');
  await mutation(source, (candidate) => candidate.replace(/结果未知[^。；]*不盲目[^。；]*(重复支付|预留|补偿)/u, '结果未知时盲目重试'), assertFailureTable, 'unknown result blind retry');
});

test('governs STY-07 sources, reciprocal relations, and Stage A projection', async () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const documents = (await readContentDocuments('content')).map((entry) => ({...entry, file: `content/${entry.file}`}));
  const document = ledger.documents[ARTICLE]; assert.ok(document, `${ARTICLE} source ledger record`);
  assert.deepEqual(document.citations.map(({source_id}) => source_id), SOURCE_IDS);
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  assert.equal(document.citations.find(({manifest_primary}) => manifest_primary)?.source_id, SOURCE_IDS[0]);
  const remote = SOURCE_IDS.slice(0, -1).map((id) => ledger.sources.find((source) => source.id === id));
  for (const id of SOURCE_IDS) {
    const source = ledger.sources.find((entry) => entry.id === id); const citation = document.citations.find((entry) => entry.source_id === id);
    assert.ok(source, `${id} source`); for (const field of SOURCE_REQUIRED_FIELDS) assert.ok(source[field]?.length !== 0 && source[field] !== undefined, `${id}.${field}`);
    assert.ok(Array.isArray(source.allowed_evidence_roles) && source.allowed_evidence_roles.length > 0, `${id} allowed roles`);
    assert.ok(Array.isArray(citation?.roles) && citation.roles.length > 0, `${id} nonempty citation roles`);
    assert.ok(citation.roles.every((role) => source.allowed_evidence_roles.includes(role)), `${id} evidence roles`);
    assert.ok(typeof citation.usage_mode === 'string' && citation.usage_mode.length > 0, `${id} usage mode`);
    assert.ok(typeof citation.attribution_note === 'string' && citation.attribution_note.length > 0, `${id} attribution`);
  }
  assert.ok(new Set(remote.map(({canonical_locator}) => new URL(canonical_locator).hostname)).size >= 4, 'four remote hosts');
  const illustration = ledger.sources.find(({id}) => id === SOURCE_IDS.at(-1));
  assert.equal(illustration.license, 'LicenseRef-Atlas-Original'); assert.equal(illustration.copyright_policy, 'original-atlas');
  assert.deepEqual(document.copyright_checks, COPYRIGHT_CHECKS, 'complete copyright checks');
  const article = documents.find(({file}) => file === ARTICLE); assert.ok(article, `${ARTICLE} article exists`);
  const links = extractInternalLinks(article); assert.ok(links.includes('/styles')); assert.ok(links.includes('/cases/temporal-saga-durable-execution')); assert.equal(links.includes('/styles/sty-08'), false);
  assert.deepEqual(extractExternalLinks({body: article.body}).sort(), remote.map(({canonical_locator}) => canonical_locator).sort());
  for (const path of RECIPROCALS) {
    const reciprocal = documents.find(({file}) => file === path); assert.ok(reciprocal, `${path} reciprocal`);
    assert.ok(extractInternalLinks(reciprocal).includes(ROUTE), `${path} visible reciprocal`);
    if (path !== 'content/cases/temporal-saga-durable-execution.mdx') assert.ok(parseFrontMatter(reciprocal.source).adjacent_topics.includes(TOPIC_ID), `${path} metadata reciprocal`);
  }
  for (const content of documents) assert.equal(extractInternalLinks(content).includes('/styles/sty-08'), false, `${content.file} STY-08 remains non-actionable`);
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8'));
  assert.deepEqual(Object.fromEntries(Object.keys(EXPECTED_STAGE_A).map((key) => [key, status[key]])), EXPECTED_STAGE_A);
  const manifest = JSON.parse(readFileSync('src/generated/topic-manifest.json', 'utf8'));
  for (const [id, published] of [[TOPIC_ID, true], [NEXT_TOPIC, false]]) {
    const topic = manifest.topics.find((entry) => entry.id === id); assert.equal(topic?.published, published, `${id} publication`); assert.equal(topic?.status.value, 'pending', `${id} pending`);
  }
});

test('locks Draw.io/SVG SOA comparison semantics, parity, ports, and presentation geometry', () => {
  const drawio = file(DRAWIO); const svg = file(SVG);
  assert.ok(drawio, `${DRAWIO} must exist after implementation`); assert.ok(svg, `${SVG} must exist after implementation`);
  assertDiagram(drawio, svg);
  const parsed = parseDrawio(drawio); const first = parsed.edges[0];
  assert.ok(first, 'diagram has edge');
  assert.throws(() => assertDiagram(drawio.replace(`source="${first.attributes.get('source')}"`, ''), svg), assert.AssertionError, 'detached port rejected');
  assert.throws(() => assertDiagram(drawio.replace(/exitX=[^;]+/u, 'exitX=0.5'), svg), assert.AssertionError, 'changed terminal port rejected');
  assert.throws(() => assertDiagram(drawio.replace(/<Array as="points">/u, '<Array as="points"></Array><Array as="points">'), svg), assert.AssertionError, 'removed waypoint rejected');
  assert.throws(() => assertDiagram(drawio.replace(/<mxGeometry/u, '<mxPoint as="sourcePoint" x="0" y="0"/><mxGeometry'), svg), assert.AssertionError, 'ignored fallback rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-edge-id="([^"]+)"/u, 'data-edge-id="moved-label"')), assert.AssertionError, 'moved/retargeted label rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/stroke-dasharray:[^;}]+/u, 'stroke-dasharray: 1 1')), assert.AssertionError, 'selector dash mutation rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/fill="#F8FAFC"/u, 'fill="transparent"')), assert.AssertionError, 'transparent canvas rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-role="business-call"/u, 'data-role="removed"')), assert.AssertionError, 'removed role rejected');
  assert.throws(() => assertDiagram(drawio, `${svg.replace('</svg>', '<rect x="0" y="0" width="99999" height="99999" fill="#000000" opacity="0.5"/></svg>')}`), assert.AssertionError, 'later translucent mask rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-node-id="soa-side"/u, 'data-node-id="microservices-side"')), assert.AssertionError, 'swapped semantics rejected');
});
