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
  ['integration-transport', /集成基础设施[^。；]*负责[^。；]*(路由|转换|技术传输)/u],
]);
const NEGATED_OWNER = /不负责|没有所有者|无人负责|责任待定|所有者待定|尚未明确|未指定/u;
const PROHIBITIONS = Object.freeze([
  ['SOA is not ESB', /SOA[^。；]*(?:不等于|不是)[^。；]*ESB|ESB[^。；]*(?:不等于|不是)[^。；]*SOA/iu],
  ['SOA is not Web Services', /SOA[^。；]*(?:不等于|不是)[^。；]*Web Services|Web Services[^。；]*(?:不等于|不是)[^。；]*SOA/iu],
  ['SOA does not authorize shared writes', /(?:不授权|禁止)[^。；]*(?:共享数据库写入|共享写入)|共享数据库写入[^。；]*(?:不被|不得|禁止)/u],
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
const RECIPROCALS = Object.freeze([
  'styles/sty-04-modular-monolith.mdx', 'styles/sty-05-microservices.mdx',
  'styles/sty-06-event-driven-architecture.mdx', 'cases/temporal-saga-durable-execution.mdx',
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
export function markdownTable(body, label) {
  const lines = body.split(/\r?\n/u);
  const start = lines.findIndex((line) => /^\|[^|]+\|[^|]+\|[^|]+(?:\|[^|]+)?\|\s*$/u.test(line));
  assert.ok(start >= 0, `${label} table exists`);
  const table = [];
  for (const line of lines.slice(start)) {
    if (!/^\|/u.test(line)) break;
    table.push(line.slice(1, -1).split('|').map((cell) => cell.trim()));
  }
  return table;
}
export function tables(body) {
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
  return result;
}
function exactWrapperTag(wrapper) {
  return `<div className="${wrapper.className}" role="region" aria-label="${wrapper.aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`;
}
function removeFrontMatterField(source, field) {
  const fieldLine = new RegExp(`^${escapeRegExp(field)}:.*(?:\\r?\\n  - [^\\r\\n]+)*(?:\\r?\\n|$)`, 'mu');
  assert.match(source, fieldLine, `${field} front-matter field exists for deletion mutation`);
  return source.replace(fieldLine, '');
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
export function assertProhibitions(source) { for (const [name, pattern] of PROHIBITIONS) assert.match(source, pattern, name); }
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
  const table = tables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '问题');
  assert.ok(table, 'eight-row SOA/microservices comparison table');
  exactRows(table, COMPARISON_ROWS, ['问题', '经典 SOA', '微服务'], 3);
  assert.match(source, /不是成熟度阶梯/u, 'comparison is not a maturity ladder');
}
export function assertFailureTable(source) {
  const table = tables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别');
  assert.ok(table, 'seven-row failure table');
  exactRows(table, FAILURE_ROWS, ['失败类别', '检测', '自动动作', '停止条件', '人工所有者'], 5);
  assert.match(source, /结果未知[^。；]*不盲目[^。；]*(重复支付|预留|补偿)/u, 'unknown result does not blind-retry');
}
function attrs(tag) { return new Map([...tag.matchAll(/([:\w-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value])); }
export function parseDrawio(source) {
  const cells = [...source.matchAll(/<mxCell\b([^>]*)(?:\/>|>([\s\S]*?)<\/mxCell>)/gu)].map((match) => ({attributes: attrs(match[1]), body: match[2] ?? ''}));
  return {nodes: cells.filter(({attributes}) => attributes.get('vertex') === '1'), edges: cells.filter(({attributes}) => attributes.get('edge') === '1')};
}
export function parseSvg(source) {
  const elements = [...source.matchAll(/<(g|path|rect|text|marker)\b([^>]*)>/gu)].map((match) => ({name: match[1], attributes: attrs(match[2])}));
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
function geometry(attributes) { return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(attributes.get(key))])); }
function assertDiagram(sourceDrawio, sourceSvg) {
  assert.match(sourceDrawio, /<mxfile\b/u, 'Draw.io file');
  const root = sourceSvg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.match(root, /role="img"/u); assert.match(root, /viewBox="0 0 [0-9.]+ [0-9.]+"/u);
  assert.doesNotMatch(root, /(?:width|height)="/u, 'responsive SVG');
  const drawio = parseDrawio(sourceDrawio); const svg = parseSvg(sourceSvg);
  for (const id of DIAGRAM_NODES) {
    assert.ok(drawio.nodes.some(({attributes}) => attributes.get('id') === id), `Draw.io node ${id}`);
    assert.ok(svg.nodes.some(({attributes}) => attributes.get('data-node-id') === id), `SVG node ${id}`);
  }
  for (const role of DIAGRAM_EDGES) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('dataRole') === role);
    assert.ok(edge, `Draw.io ${role}`); assert.ok(edge.attributes.get('source') && edge.attributes.get('target'), `${role} real terminals`);
    assert.match(edge.body, /<mxPoint[^>]*as="(?:sourcePoint|targetPoint)"/u, `${role} terminal port geometry`);
    assert.ok(svg.edges.some(({attributes}) => attributes.get('data-edge-id') === edge.attributes.get('id')), `SVG ${role} parity`);
  }
  const canvas = sourceSvg.match(/<(?:rect|path)\b[^>]*\bid="(?:canvas|background)"[^>]*>/u)?.[0] ?? '';
  assert.ok(canvas && !/fill="(?:none|transparent)"/iu.test(canvas), 'opaque canvas');
  const text = [...sourceSvg.matchAll(/<text\b([^>]*)>([^<]+)<\/text>/gu)];
  for (const [, raw, label] of text) {
    const attributes = attrs(raw); const size = Number(svgPresentationValue(sourceSvg, {attributes}, 'font-size'));
    if (/图例|业务调用|消息|路由|补偿/u.test(label)) assert.ok(size >= 12, `legend text ${label}`);
    else assert.ok(size >= 15, `essential text ${label}`);
  }
  const edgePaths = [...sourceSvg.matchAll(/<path\b([^>]*)>/gu)].map((match) => ({attributes: attrs(match[1])}))
    .filter(({attributes}) => attributes.has('data-edge-id'));
  for (const path of edgePaths) {
    assert.ok(svgPresentationValue(sourceSvg, path, 'stroke'), `${path.attributes.get('data-edge-id')} effective stroke`);
    assert.match(svgPresentationValue(sourceSvg, path, 'marker-end') ?? '', /^url\(#.+\)$/u, 'real marker');
  }
  return {drawio, svg, alphaComposite};
}
async function mutation(source, transform, validator, label) {
  const changed = transform(source); assert.notEqual(changed, source, `${label} mutation applies`);
  assert.throws(() => validator(changed), assert.AssertionError, label);
}

test('SVG cascade, alpha composition, and conservative glyph geometry helpers are meaningful', () => {
  const svg = '<svg><style>#x.edge { stroke: #FFFFFF !important; }</style><path id="x" class="edge" style="stroke: #334155"/></svg>';
  const element = parseSvg(svg).elements[0];
  assert.equal(svgPresentationValue(svg, element, 'stroke'), '#FFFFFF');
  assert.equal(alphaComposite('#000000', .5), '#808080');
  assert.deepEqual(glyphBox({x: 10, y: 20, text: 'A中', fontSize: 10}), {left: 1.9, right: 18.1, top: 10, bottom: 20});
});

test('locks exact STY-07 article metadata, headings, wrappers, ownership, and prose boundaries', async () => {
  const source = file(ARTICLE); const {body} = articleParts(source);
  assertExactMetadata(source);
  assert.deepEqual(findMarkdownHeadings(body).filter(({level}) => level === 2).map(({text}) => text), EXPECTED_HEADINGS);
  assertRequiredWrappers(source); assertOwnership(source); assertProhibitions(source);
  for (const [field, value] of Object.entries(EXACT_METADATA)) {
    const original = parseFrontMatter(source)[field];
    await mutation(source, (candidate) => removeFrontMatterField(candidate, field), assertExactMetadata, `${field} deleted`);
    await mutation(source, (candidate) => candidate.replace(String(Array.isArray(original) ? original[0] : original), 'changed'), assertExactMetadata, `${field} changed`);
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
});

test('locks exact eight-row comparison and seven-row failure responsibilities', async () => {
  const source = file(ARTICLE); articleParts(source); assertComparisonTable(source); assertFailureTable(source);
  for (const validator of [assertComparisonTable, assertFailureTable]) {
    const table = validator === assertComparisonTable ? tables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '问题') : tables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别');
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
  const failures = tables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别').slice(2);
  for (const failure of failures) {
    await mutation(source, (candidate) => candidate.replace(failure.at(-1), '平台团队'), assertFailureTable, `${failure[0]} owner changed`);
    await mutation(source, (candidate) => candidate.replace(failure[3], '继续自动执行'), assertFailureTable, `${failure[0]} stop condition changed`);
  }
  await mutation(source, (candidate) => `${candidate}\nSOA 与微服务构成成熟度阶梯。\n`, assertComparisonTable, 'fabricated maturity ladder');
  await mutation(source, (candidate) => candidate.replace(/结果未知[^。；]*不盲目[^。；]*(重复支付|预留|补偿)/u, '结果未知时盲目重试'), assertFailureTable, 'unknown result blind retry');
});

test('governs STY-07 sources, reciprocal relations, and Stage A projection', async () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const documents = await readContentDocuments('content');
  const document = ledger.documents[ARTICLE]; assert.ok(document, `${ARTICLE} source ledger record`);
  assert.deepEqual(document.citations.map(({source_id}) => source_id), SOURCE_IDS);
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  assert.equal(document.citations.find(({manifest_primary}) => manifest_primary)?.source_id, SOURCE_IDS[0]);
  const remote = SOURCE_IDS.slice(0, -1).map((id) => ledger.sources.find((source) => source.id === id));
  for (const id of SOURCE_IDS) {
    const source = ledger.sources.find((entry) => entry.id === id); const citation = document.citations.find((entry) => entry.source_id === id);
    assert.ok(source, `${id} source`); for (const field of SOURCE_REQUIRED_FIELDS) assert.ok(source[field]?.length !== 0 && source[field] !== undefined, `${id}.${field}`);
    assert.ok(citation.roles.every((role) => source.allowed_evidence_roles.includes(role)), `${id} evidence roles`);
  }
  assert.ok(new Set(remote.map(({canonical_locator}) => new URL(canonical_locator).hostname)).size >= 4, 'four remote hosts');
  const illustration = ledger.sources.find(({id}) => id === SOURCE_IDS.at(-1));
  assert.equal(illustration.license, 'LicenseRef-Atlas-Original'); assert.equal(illustration.copyright_policy, 'original-atlas');
  assert.ok(document.copyright_checks.includes('illustration-rights'), 'illustration rights');
  const article = documents.find(({file}) => file === ARTICLE); assert.ok(article, `${ARTICLE} article exists`);
  const links = extractInternalLinks(article); assert.ok(links.includes('/styles')); assert.ok(links.includes('/cases/temporal-saga-durable-execution')); assert.equal(links.includes('/styles/sty-08'), false);
  assert.deepEqual(extractExternalLinks({body: article.body}).sort(), remote.map(({canonical_locator}) => canonical_locator).sort());
  for (const path of RECIPROCALS) {
    const reciprocal = documents.find(({file}) => file === path); assert.ok(reciprocal, `${path} reciprocal`);
    assert.ok(parseFrontMatter(reciprocal.source).adjacent_topics.includes(TOPIC_ID), `${path} metadata reciprocal`);
    assert.ok(extractInternalLinks(reciprocal).includes(ROUTE), `${path} visible reciprocal`);
  }
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
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-node-id="soa-side"/u, 'data-node-id="microservices-side"')), assert.AssertionError, 'swapped semantics rejected');
});
