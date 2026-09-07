import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter} from '../scripts/content-metadata.mjs';
import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

export const ARTICLE = 'content/styles/sty-14-architecture-choice-matrix.mdx';
export const DRAWIO = 'diagrams/sty-14-architecture-choice-matrix.drawio';
export const SVG = 'static/img/diagrams/sty-14-architecture-choice-matrix.svg';
export const ROUTE = '/styles/sty-14';
export const TOPIC_ID = 'STY-14';
export const ORIGINAL_SOURCE_ID = 'src-atlas-sty14-architecture-choice-matrix';

export const EXPECTED_H2 = Object.freeze([
  '为什么三选一是错误问题',
  '固定订单履约范围与比较规则',
  '第一轴：部署与数据所有权边界',
  '第二轴：同步与事件驱动交互',
  '压力一：业务增长',
  '压力二：局部故障',
  '压力三：团队独立交付',
  '迁移触发器与停止条件',
  '决策矩阵与评审问题',
  '来源',
]);
export const CAPABILITIES = Object.freeze([
  '提交订单', '预留库存', '登记支付意图', '确认履约', '发送通知',
]);
export const PRESSURES = Object.freeze(['业务增长', '局部故障', '团队独立交付']);
export const FORBIDDEN = Object.freeze([
  '三种架构按总分选择',
  '微服务是模块化单体的下一成熟阶段',
  '事件驱动是微服务之后的最终形态',
  '事件可以保证 exactly-once 业务效果',
  '共享数据库仍允许多个服务同步写入',
]);
export const REUSED_SOURCES = Object.freeze([
  'src-fowler-monolith-first',
  'src-spring-modulith-fundamentals',
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-fowler-what-do-you-mean-event-driven',
  'src-microsoft-event-driven-architecture-style',
]);

export const EXACT_METADATA = Object.freeze({
  title: '架构风格选择矩阵：边界、交互与演进触发器',
  slug: ROUTE,
  content_type: 'style',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-09-07',
  source_cutoff: '2026-09-07',
  confidence: 'high',
  domains: ['software-architecture', 'distributed-systems'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['scalability', 'availability', 'modifiability', 'deployability', 'operability'],
  tags: ['架构风格', '模块化单体', '微服务', '事件驱动', '决策矩阵', '演进式架构'],
  summary: '用同一个订单履约系统分开判断部署与数据所有权边界、同步与事件驱动交互，并以可观测证据、可逆动作和停止条件约束演进。',
  topic_id: TOPIC_ID,
  priority: 'P1',
  depends_on: ['STY-00', 'STY-04', 'STY-05', 'STY-06'],
  adjacent_topics: ['STY-04', 'STY-05', 'STY-06'],
  related_cases: [],
  related_questions: [],
});

export const WRAPPERS = Object.freeze([
  Object.freeze({
    className: 'architecture-diagram-scroll',
    role: 'region',
    'aria-label': '架构风格选择矩阵双轴图，可横向滚动',
    tabIndex: '0',
    onKeyDown: 'handleHorizontalArrowKey',
  }),
  Object.freeze({
    className: 'table-wrapper table-wrapper--mapping',
    role: 'region',
    'aria-label': '三类压力与四种结构决策矩阵，可横向滚动',
    tabIndex: '0',
    onKeyDown: 'handleHorizontalArrowKey',
  }),
  Object.freeze({
    className: 'table-wrapper table-wrapper--mapping',
    role: 'region',
    'aria-label': '演进动作、观察窗口与回滚路径表，可横向滚动',
    tabIndex: '0',
    onKeyDown: 'handleHorizontalArrowKey',
  }),
]);

export const DECISION_HEADERS = Object.freeze([
  '压力', '最小结构', '观测证据', '触发器', '停止条件', '责任人',
]);
export const DECISION_ROWS = Object.freeze([
  ['业务增长', '同步为主的模块化单体', '热点位置、数据库容量、锁等待与部署频率', '模块边界内的容量治理仍能满足目标', '证据未达到约定阈值就停止，保持当前结构', '订单履约负责人'],
  ['业务增长', '单体内事件驱动叠加', '非关键派生工作的队列等待与消费者延迟', '时间解耦或缓冲能隔离非即时工作', '积压年龄或恢复成本超过收益就回退同步', '订单履约负责人'],
  ['业务增长', '同步协作的微服务', '单一能力持续独立扩容或独立发布的证据', '该能力必须拥有独立部署、数据权威与容量预算', '独立部署未减少协调就停止继续拆分', '能力服务负责人'],
  ['业务增长', '跨服务事件驱动叠加', '多消费者传播、积压年龄与恢复时长', '已拆服务之间确需缓冲或多消费者传播', '消费者没有恢复所有者就不扩大事件范围', '平台与消费方负责人'],
  ['局部故障', '同步为主的模块化单体', '本地事务回滚、故障影响范围与恢复时长', '本地故障仍能在一个运行边界内隔离和恢复', '故障半径满足目标就停止改变边界', '运行负责人'],
  ['局部故障', '单体内事件驱动叠加', '非关键路径失败率、积压年龄与毒消息数量', '非即时工作需要缓冲并独立恢复', '未知结果更难确认或毒消息无人处置就回滚', '消息消费负责人'],
  ['局部故障', '同步协作的微服务', '远程调用超时、未知结果与故障传播链', '故障必须由独立运行边界隔离', '新网络边界未缩小故障半径就停止拆分', '服务运行负责人'],
  ['局部故障', '跨服务事件驱动叠加', '重复交付、顺序偏差、重放和补偿时长', '故障恢复需要时间解耦与可控重放', '重复副作用或恢复责任未闭合就停止迁移', '事件链路负责人'],
  ['团队独立交付', '同步为主的模块化单体', '团队等待时间、联动发布率与模块依赖', '模块 API 与唯一写入责任足以支持协调', '团队等待未越过阈值就保持一个部署边界', '工程负责人'],
  ['团队独立交付', '单体内事件驱动叠加', '跨模块等待、事件合同变更与消费方恢复时长', '同一部署边界内确需时间解耦', '事件合同增加的协调超过收益就回退', '模块所有者'],
  ['团队独立交付', '同步协作的微服务', '代码所有权、发布节奏、值班与审批等待', '团队能独立承担数据、部署、告警和值班', '共享同步写或联动发布仍是主路径就停止', '服务团队负责人'],
  ['团队独立交付', '跨服务事件驱动叠加', '消费者数量、团队等待与合同演进频率', '独立团队之间确需异步传播', '消费者恢复和合同演进没有责任人就停止', '生产者与消费者负责人'],
]);
export const ACTION_HEADERS = Object.freeze(['现状', '单次动作', '观察窗口', '回滚路径', '禁止越界']);
export const ACTION_ROWS = Object.freeze([
  ['模块边界与写入责任模糊', '先收紧模块 API 与唯一写入责任', '一个完整发布与故障复盘周期', '恢复原调用路径并保留边界测量', '不得同时拆服务和引入消息基础设施'],
  ['一条非关键同步路径需要缓冲', '只把该路径改为事务性发布与单一消费者', '覆盖峰值、积压和恢复演练的窗口', '停用消费者并切回原同步路径', '不得把即时接受或拒绝结果改为最终一致'],
  ['一个能力必须独立扩容或发布', '只拆出一个拥有独立数据与运行责任的服务', '覆盖独立发布、故障和回滚的窗口', '流量切回原模块并冻结新服务写入', '不得保留共享数据库的多服务同步写'],
]);

const CAPABILITY_SCOPE = `固定能力范围：${CAPABILITIES.join('、')}。`;
export const PRESSURE_DETAILS = Object.freeze({
  业务增长: Object.freeze([
    ['当前最小结构', '同步为主的模块化单体'],
    ['观测证据', '热点位置、数据库容量、锁竞争、队列等待、部署频率和模块依赖'],
    ['升级触发条件', '某个能力持续需要独立扩展或独立部署'],
    ['可逆动作', '先强化模块边界，或只把一条非关键路径异步化'],
    ['停止条件', '证据未达到预先约定阈值就保持当前结构'],
    ['责任人', '订单履约负责人'],
  ]),
  局部故障: Object.freeze([
    ['当前最小结构', '保留本地事务并测量真实故障半径'],
    ['观测证据', '本地回滚、远程未知结果、事件积压、毒消息和恢复时长'],
    ['升级触发条件', '故障必须由独立运行边界或时间窗口隔离'],
    ['可逆动作', '只隔离一条非即时路径或一个独立运行边界'],
    ['停止条件', '一致性、幂等或恢复责任没有所有者就停止'],
    ['责任人', '运行负责人'],
  ]),
  团队独立交付: Object.freeze([
    ['当前最小结构', '以模块 API 和唯一写入责任支持团队协作'],
    ['观测证据', '代码所有权、发布节奏、容量预算、告警、值班与团队等待时间'],
    ['升级触发条件', '团队能够独立承担数据、部署、容量、故障和值班责任'],
    ['可逆动作', '只拆出一个责任闭合的服务并保留流量回切路径'],
    ['停止条件', '共享同步写、联动发布或跨团队审批仍是主路径就停止'],
    ['责任人', '工程负责人'],
  ]),
});

export const REQUIRED_SENTENCES = Object.freeze([
  '服务边界和交互方式是两条独立的决策轴。',
  'Event-Driven 是可叠加的交互机制；模块化单体和微服务都可以采用同步、事件驱动或混合交互。',
  '模块化单体保留一个部署边界，通过模块 API、唯一写入责任和本地事务管理内部耦合。',
  '微服务只有在代码、数据权威、部署、容量、故障处置和值班责任真实独立时才形成有效边界。',
  '同步远程调用必须处理超时和未知结果，不能把超时直接当作失败。',
  '事件消费者必须处理重复、顺序、积压、重放、毒消息、合同演进和恢复责任。',
  '外部支付副作用不属于本地数据库事务，未知结果必须查询权威状态或进入补偿与人工终态。',
  '默认从模块化单体开始只是有边界的起点启发，不是完整矩阵的来源结论。',
]);

export const QUADRANT_IDS = Object.freeze([
  'quadrant-monolith-sync', 'quadrant-monolith-event',
  'quadrant-microservices-sync', 'quadrant-microservices-event',
]);
export const PRESSURE_IDS = Object.freeze(['pressure-growth', 'pressure-failure', 'pressure-teams']);
export const CAPABILITY_LABELS = Object.freeze([
  ['capability-submit-order', '提交订单'],
  ['capability-reserve-inventory', '预留库存'],
  ['capability-record-payment-intent', '登记支付意图'],
  ['capability-confirm-fulfillment', '确认履约'],
  ['capability-send-notification', '发送通知'],
]);
export const AXES = Object.freeze([
  ['axis-deployment', '部署与数据所有权边界'],
  ['axis-interaction', '同步与事件驱动交互'],
]);

const REUSED_SOURCE_HASHES = Object.freeze({
  'src-fowler-monolith-first': 'a1469a64437c532cf937e4a21437260c29a761c52257d8f7cc17f2c0e06a616b',
  'src-spring-modulith-fundamentals': '57fb04714fd4e5c1f118ae6b6c5b5b81a2e07be8ceed5d488b5174ca7fca087c',
  'src-lewis-fowler-microservices': '8e5a63900cd6f7e12311119922658e2a11fd312cef8e5cdb36c9c25eb1d504fb',
  'src-microsoft-microservices-architecture-style': '49925f09a8d01e0c5f7afdabbe74743d99a5fce7bcfa30b7e7a9dab606d5edc2',
  'src-fowler-what-do-you-mean-event-driven': 'b377a919281e3df88e5463920e550dd4e6d028c2bf0fbc173627186537030d30',
  'src-microsoft-event-driven-architecture-style': '6e799be47cb84f4316145fe4306ee66fc0759891ebfad1e39e139ac2a9076391',
});
const STARTING_HEURISTIC_BOUNDARY = 'Supports a bounded starting heuristic only; it does not support the complete two-axis choice matrix.';
export const ORIGINAL_SOURCE = Object.freeze({
  id: ORIGINAL_SOURCE_ID,
  canonical_locator: '/img/diagrams/sty-14-architecture-choice-matrix.svg',
  transport_locator: '/img/diagrams/sty-14-architecture-choice-matrix.svg',
  query_insensitive: false,
  locator_aliases: [],
  tombstone: null,
  title: '架构风格选择矩阵：部署边界与交互方式双轴图 SVG',
  citation_titles: ['架构风格选择矩阵双轴图'],
  author_or_org: 'Tego Arch maintainers',
  published_at: '2026-09-07',
  registered_at: '2026-09-07',
  checked_at: '2026-09-07',
  version: 'original-atlas synchronized drawio+svg published 2026-09-07',
  source_kind: 'original-illustration',
  tier: 'primary',
  allowed_evidence_roles: ['illustration'],
  license: 'LicenseRef-Atlas-Original',
  license_scope: 'The named project-authored sty-14-architecture-choice-matrix.svg image/svg+xml asset only',
  license_evidence_url: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/sty-14-architecture-choice-matrix.svg',
  license_evidence_note: 'Created as an original synchronized Draw.io/SVG teaching diagram without third-party diagrams, reference imagery, logos, brand visuals, signatures, watermarks or copied composition.',
  license_family_id: '/img/diagrams/sty-14-architecture-choice-matrix.svg',
  license_family_grouping: 'identity',
  family_grouping_evidence_url: null,
  copyright_policy: 'original-atlas',
  usage_boundary: 'Original teaching illustration for the independent deployment-boundary and interaction axes; illustration-only and not evidence of production outcomes.',
  link_policy: 'project-local',
  expected_final_transport_locator: '/img/diagrams/sty-14-architecture-choice-matrix.svg',
  expected_final_approved_at: '2026-09-07',
  expected_final_approval_note: 'Approved project-local original image/svg+xml identity after synchronized Draw.io/SVG semantic, geometry, contrast and rendered-raster QA.',
});

const CITATIONS = Object.freeze([
  Object.freeze({source_id: REUSED_SOURCES[0], citation_url: 'https://martinfowler.com/bliki/MonolithFirst.html', roles: ['comparison', 'method'], manifest_primary: true, usage_mode: 'facts-summary', attribution_note: 'Monolith First, Martin Fowler', modification_note: STARTING_HEURISTIC_BOUNDARY, excerpt: null, quotation_reviewed: false}),
  Object.freeze({source_id: REUSED_SOURCES[1], citation_url: 'https://docs.spring.io/spring-modulith/reference/fundamentals.html', roles: ['definition', 'implementation', 'method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Fundamentals, Spring Modulith reference documentation 2.1.0', modification_note: null, excerpt: null, quotation_reviewed: false}),
  Object.freeze({source_id: REUSED_SOURCES[2], citation_url: 'https://martinfowler.com/articles/microservices.html', roles: ['comparison', 'definition', 'runtime-fact'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Microservices, James Lewis and Martin Fowler', modification_note: null, excerpt: null, quotation_reviewed: false}),
  Object.freeze({source_id: REUSED_SOURCES[3], citation_url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices', roles: ['comparison', 'definition', 'runtime-fact'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Microservices architecture style, Microsoft Azure Architecture Center', modification_note: 'Original Chinese synthesis; Azure-specific choices and universal outcome claims excluded.', excerpt: null, quotation_reviewed: false}),
  Object.freeze({source_id: REUSED_SOURCES[4], citation_url: 'https://martinfowler.com/articles/201701-event-driven.html', roles: ['comparison', 'definition', 'method', 'runtime-fact'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'What do you mean by “Event-Driven”?, Martin Fowler', modification_note: null, excerpt: null, quotation_reviewed: false}),
  Object.freeze({source_id: REUSED_SOURCES[5], citation_url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven', roles: ['comparison', 'definition', 'method', 'runtime-fact'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Event-driven architecture style, Microsoft Azure Architecture Center', modification_note: 'Original Chinese synthesis; Azure product-specific recommendations and universal outcomes excluded.', excerpt: null, quotation_reviewed: false}),
  Object.freeze({source_id: ORIGINAL_SOURCE_ID, citation_url: '/img/diagrams/sty-14-architecture-choice-matrix.svg', roles: ['illustration'], manifest_primary: false, usage_mode: 'original-illustration', attribution_note: '架构风格选择矩阵双轴图，Tego Arch maintainers', modification_note: 'Created as an original Draw.io/SVG pair from the approved STY-14 design without third-party diagrams, reference imagery, logos, brand visuals, signatures, watermarks or copied composition.', excerpt: null, quotation_reviewed: false}),
]);
const DOCUMENT_RECORD = Object.freeze({
  reviewed_at: '2026-09-07',
  copyright_checks: ['original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights'],
  citations: CITATIONS,
});

const optionalText = (path) => {
  try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; }
};
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'); }
function replaceOnce(source, before, after, label) { const changed = source.replace(before, after); assert.notEqual(changed, source, `${label} mutation applies`); return changed; }
function frontMatterFixture(metadata) {
  return Object.entries(metadata).flatMap(([key, value]) => Array.isArray(value) ? value.length ? [key + ':', ...value.map((item) => '  - ' + item)] : [key + ': []'] : [key + ': ' + value]).join('\n');
}
function tableLines(headers, rows) { return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row) => `| ${row.join(' | ')} |`).join('\n')}`; }
function markdownTables(source) {
  const tables = []; const lines = source.split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith('|')) continue;
    const rows = [];
    while (index < lines.length && lines[index].startsWith('|')) { rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim())); index += 1; }
    if (rows.length >= 3 && rows[1].every((cell) => /^:?-{3,}:?$/u.test(cell))) tables.push(rows);
  }
  return tables;
}
function jsxAttributes(source) {
  return Object.fromEntries([...source.matchAll(/\b(?<name>[A-Za-z][\w-]*)=(?:"(?<quoted>[^"]*)"|\{(?<expression>[^}]*)\})/gu)].map(({groups}) => [groups.name, groups.quoted ?? groups.expression]));
}
function wrapperContracts(source) {
  return [...source.matchAll(/<div\b(?<attributes>[^>]*)>/gu)].map(({groups}) => jsxAttributes(groups.attributes)).filter((attributes) => attributes.role === 'region').map(({className, role, 'aria-label': ariaLabel, tabIndex, onKeyDown}) => ({className, role, 'aria-label': ariaLabel, tabIndex, onKeyDown}));
}
function h2Section(source, heading) {
  const match = [...source.matchAll(/^## (?<heading>.+)$/gmu)].find(({groups}) => groups.heading === heading);
  assert.ok(match, `${heading} section exists`);
  const start = match.index + match[0].length; const rest = source.slice(start); const end = rest.search(/^## /mu);
  return rest.slice(0, end === -1 ? rest.length : end);
}
function pressureEntries(section) {
  return section.split(/\r?\n/u).flatMap((line) => { const match = line.match(/^- \*\*(?<label>[^：]+)：\*\*\s*(?<value>.+)$/u); return match ? [[match.groups.label, match.groups.value]] : []; });
}

export function assertChoiceContract(source) {
  assert.ok(source, `${ARTICLE} must exist after implementation`);
  assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-14 front matter');
  assert.deepEqual(findMarkdownHeadings(source).filter(({level}) => level === 2).map(({text}) => text), EXPECTED_H2, 'exact STY-14 H2 order');
  assert.equal(source.split("import {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';").length - 1, 1, 'exact repository ArrowRight handler import');
  assert.deepEqual(wrapperContracts(source), WRAPPERS, 'exact three distinct keyboard-scroll wrapper contracts');
  assert.equal(new Set(WRAPPERS.map((item) => item['aria-label'])).size, WRAPPERS.length, 'approved wrapper labels are distinct');
  const tables = markdownTables(source); assert.equal(tables.length, 2, 'exactly two STY-14 Markdown tables');
  assert.deepEqual(tables[0], [DECISION_HEADERS, DECISION_HEADERS.map(() => '---'), ...DECISION_ROWS], 'exact six-column pressure/structure decision table');
  assert.deepEqual(tables[1], [ACTION_HEADERS, ACTION_HEADERS.map(() => '---'), ...ACTION_ROWS], 'exact five-column reversible action table');
  for (const pressure of PRESSURES) {
    const section = h2Section(source, `压力${['一', '二', '三'][PRESSURES.indexOf(pressure)]}：${pressure}`);
    assert.equal(section.split(CAPABILITY_SCOPE).length - 1, 1, `${pressure} uses the exact shared capability scope once`);
    assert.deepEqual(pressureEntries(section), PRESSURE_DETAILS[pressure], `${pressure} exact evidence/trigger/action/stop/owner contract`);
  }
  for (const sentence of REQUIRED_SENTENCES) assert.equal(source.split(sentence).length - 1, 1, `one exact visible boundary: ${sentence}`);
  for (const phrase of FORBIDDEN) assert.equal(source.includes(phrase), false, `forbidden choice claim: ${phrase}`);
  assert.doesNotMatch(source, /Event-Driven[^。\n]*(?:互斥|只能三选一)|(?:成熟度|最终形态)[^。\n]*(?:单体|微服务|事件驱动)|(?:性能|可用性|团队效率)[^。\n]*(?:天然|必然|保证)/iu, 'no mutual-exclusion, maturity-ladder, or universal-outcome claim');
  assert.doesNotMatch(source, /href=["']\/styles\/sty-15["']/u, 'STY-15 remains non-actionable');
}

function xmlAttributes(source) { return new Map([...source.matchAll(/([:\w-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value])); }
function xmlElements(source, name) { return [...source.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gu'))].map(([open]) => ({open, attributes: xmlAttributes(open)})); }
function styleMap(style = '') { return new Map(style.split(';').filter(Boolean).map((entry) => entry.split(/=(.*)/su))); }
function exactIds(actual, expected, label) { assert.equal(new Set(actual).size, actual.length, `${label} duplicate-free`); assert.deepEqual([...actual].sort(), [...expected].sort(), `${label} exact IDs`); }
function semanticDrawioCells(source, role) { return xmlElements(source, 'mxCell').filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === role); }

export function assertChoiceDiagram(drawioSource, svgSource) {
  assert.ok(drawioSource, `${DRAWIO} must exist after implementation`); assert.ok(svgSource, `${SVG} must exist after implementation`);
  const drawioCanvas = semanticDrawioCells(drawioSource, 'canvas'); assert.equal(drawioCanvas.length, 1, 'one Draw.io opaque canvas');
  assert.deepEqual([styleMap(drawioCanvas[0].attributes.get('style')).get('fillColor'), styleMap(drawioCanvas[0].attributes.get('style')).get('opacity')], ['#FFFFFF', '100'], 'Draw.io canvas is opaque');
  const svgCanvas = xmlElements(svgSource, 'rect').filter(({attributes}) => attributes.get('data-canvas') === 'true'); assert.equal(svgCanvas.length, 1, 'one SVG opaque canvas');
  assert.deepEqual([svgCanvas[0].attributes.get('fill'), svgCanvas[0].attributes.get('opacity')], ['#FFFFFF', '1'], 'SVG canvas is opaque');

  for (const [role, ids, svgAttribute] of [
    ['quadrant', QUADRANT_IDS, 'data-quadrant-id'], ['pressure', PRESSURE_IDS, 'data-pressure-id'], ['capability', CAPABILITY_LABELS.map(([id]) => id), 'data-capability-id'], ['axis', AXES.map(([id]) => id), 'data-axis-id'],
  ]) {
    exactIds(semanticDrawioCells(drawioSource, role).map(({attributes}) => attributes.get('id')), ids, `Draw.io ${role}`);
    exactIds(xmlElements(svgSource, 'g').filter(({attributes}) => attributes.has(svgAttribute)).map(({attributes}) => attributes.get(svgAttribute)), ids, `SVG ${role}`);
  }
  for (const [id, label] of [...AXES, ...CAPABILITY_LABELS]) {
    const drawio = xmlElements(drawioSource, 'mxCell').find(({attributes}) => attributes.get('id') === id); assert.equal(drawio?.attributes.get('value'), label, `${id} exact Draw.io label`);
    const svg = xmlElements(svgSource, 'g').find(({attributes}) => [...attributes.values()].includes(id)); assert.equal(svg?.attributes.get('data-label'), label, `${id} exact SVG label`);
  }
  assert.equal(semanticDrawioCells(drawioSource, 'maturity-arrow').length, 0, 'no Draw.io maturity arrow');
  assert.equal(xmlElements(svgSource, 'path').some(({attributes}) => attributes.get('data-edge-role') === 'maturity-arrow'), false, 'no SVG maturity arrow');
  assert.doesNotMatch(`${drawioSource}\n${svgSource}`, /(?:单体|Monolith)\s*(?:→|-->|到)\s*(?:微服务|Microservices)\s*(?:→|-->|到)\s*(?:事件驱动|Event-Driven)|成熟度阶梯/iu, 'diagram has no maturity-ladder semantics');
  const svgRoot = xmlElements(svgSource, 'svg')[0]?.attributes; assert.ok(svgRoot, 'SVG root');
  assert.deepEqual([svgRoot.get('role'), svgRoot.get('aria-labelledby'), svgRoot.get('data-illustration-id'), svgRoot.get('data-original-illustration')], ['img', 'sty14-title sty14-desc', ORIGINAL_SOURCE_ID, 'true'], 'accessible original-illustration identity');
  assert.equal(svgSource.split('<title id="sty14-title">架构风格选择矩阵：部署边界与交互方式</title>').length - 1, 1, 'one exact accessible SVG title');
  assert.equal(svgSource.split('<desc id="sty14-desc">四个象限展示模块化单体与微服务如何分别采用同步或事件驱动交互，三类压力只提供评估入口，不形成升级路线。</desc>').length - 1, 1, 'one exact accessible SVG description');
}

function stableJson(value) { return Array.isArray(value) ? `[${value.map(stableJson).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}` : JSON.stringify(value); }
function recordHash(value) { return createHash('sha256').update(stableJson(value)).digest('hex'); }

export function assertChoiceGovernance(ledger) {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const id of REUSED_SOURCES) { assert.ok(records.has(id), `${id} reused source exists`); assert.equal(recordHash(records.get(id)), REUSED_SOURCE_HASHES[id], `${id} exact pre-existing source identity`); }
  const document = ledger.documents?.[ARTICLE]; assert.ok(document, 'STY-14 governed source document record must exist after implementation');
  assert.deepEqual(document, DOCUMENT_RECORD, 'exact STY-14 document citation and rights contract');
  assert.deepEqual(document.citations.map(({source_id}) => source_id), [...REUSED_SOURCES, ORIGINAL_SOURCE_ID], 'exact reused sources plus one original illustration');
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1, 'exactly one manifest primary');
  assert.equal(document.citations.find(({manifest_primary}) => manifest_primary)?.source_id, 'src-fowler-monolith-first', 'Monolith First is the sole manifest primary');
  assert.equal(document.citations[0].modification_note, STARTING_HEURISTIC_BOUNDARY, 'primary supports a bounded starting heuristic, not the complete matrix');
  assert.deepEqual(records.get(ORIGINAL_SOURCE_ID), ORIGINAL_SOURCE, 'exact original-illustration identity and no-copy rights boundary');
  assert.equal(ledger.sources.filter(({id}) => id === ORIGINAL_SOURCE_ID).length, 1, 'one original illustration record');
}

function articleFixture() {
  const sections = EXPECTED_H2.map((heading) => {
    const pressure = PRESSURES.find((item) => heading.endsWith(item));
    if (!pressure) return `## ${heading}`;
    return `## ${heading}\n\n${CAPABILITY_SCOPE}\n\n${PRESSURE_DETAILS[pressure].map(([label, value]) => `- **${label}：** ${value}`).join('\n')}`;
  }).join('\n\n');
  return `---\n${frontMatterFixture(EXACT_METADATA)}\n---\nimport {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';\n\n${sections}\n\n${WRAPPERS.map((wrapper) => `<div className="${wrapper.className}" role="${wrapper.role}" aria-label="${wrapper['aria-label']}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`).join('\n')}\n\n${tableLines(DECISION_HEADERS, DECISION_ROWS)}\n\n${tableLines(ACTION_HEADERS, ACTION_ROWS)}\n\n${REQUIRED_SENTENCES.join('\n')}\n`;
}
function diagramFixture() {
  const cell = (id, label, role) => `<mxCell id="${id}" value="${label}" vertex="1" style="semanticRole=${role};"/>`;
  const drawio = `<mxGraphModel><root><mxCell id="canvas" value="" vertex="1" style="semanticRole=canvas;fillColor=#FFFFFF;opacity=100;"/>${AXES.map(([id, label]) => cell(id, label, 'axis')).join('')}${QUADRANT_IDS.map((id) => cell(id, id, 'quadrant')).join('')}${PRESSURE_IDS.map((id) => cell(id, id, 'pressure')).join('')}${CAPABILITY_LABELS.map(([id, label]) => cell(id, label, 'capability')).join('')}</root></mxGraphModel>`;
  const group = (attribute, id, label) => `<g ${attribute}="${id}" data-label="${label}"></g>`;
  const svg = `<svg role="img" aria-labelledby="sty14-title sty14-desc" data-illustration-id="${ORIGINAL_SOURCE_ID}" data-original-illustration="true"><title id="sty14-title">架构风格选择矩阵：部署边界与交互方式</title><desc id="sty14-desc">四个象限展示模块化单体与微服务如何分别采用同步或事件驱动交互，三类压力只提供评估入口，不形成升级路线。</desc><rect data-canvas="true" x="0" y="0" width="1200" height="900" fill="#FFFFFF" opacity="1"/>${AXES.map(([id, label]) => group('data-axis-id', id, label)).join('')}${QUADRANT_IDS.map((id) => group('data-quadrant-id', id, id)).join('')}${PRESSURE_IDS.map((id) => group('data-pressure-id', id, id)).join('')}${CAPABILITY_LABELS.map(([id, label]) => group('data-capability-id', id, label)).join('')}</svg>`;
  return {drawio, svg};
}
function governanceFixture(base) {
  const ledger = structuredClone(base);
  ledger.sources = ledger.sources.filter(({id}) => id !== ORIGINAL_SOURCE_ID);
  delete ledger.documents[ARTICLE];
  ledger.sources.push(structuredClone(ORIGINAL_SOURCE));
  ledger.documents[ARTICLE] = structuredClone(DOCUMENT_RECORD);
  return ledger;
}

const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));

test('STY-14 content helper fixture is GREEN and rejects semantic contradictions', () => {
  const fixture = articleFixture(); assertChoiceContract(fixture);
  const mutations = [
    ['remove one capability', replaceOnce(fixture, CAPABILITY_SCOPE, CAPABILITY_SCOPE.replace('、发送通知', ''), 'capability')],
    ['swap one pressure', replaceOnce(fixture, '## 压力一：业务增长', '## 压力一：局部故障', 'pressure')],
    ['delete one decision-contract cell', replaceOnce(fixture, DECISION_ROWS[0][2], '', 'decision cell')],
    ['make Event-Driven mutually exclusive', replaceOnce(fixture, REQUIRED_SENTENCES[1], 'Event-Driven 与模块化单体、微服务互斥，只能三选一。', 'Event-Driven exclusivity')],
    ['remove one owner', replaceOnce(fixture, '| 订单履约负责人 |', '|  |', 'owner')],
    ['turn a stop condition into unconditional migration', replaceOnce(fixture, DECISION_ROWS[0][4], '无论证据是否达到阈值都继续迁移', 'stop condition')],
    ['change exact metadata array', replaceOnce(fixture, '  - STY-04\n  - STY-05\n  - STY-06\nadjacent_topics:', '  - STY-04\n  - STY-06\nadjacent_topics:', 'depends_on')],
    ['change wrapper handler', replaceOnce(fixture, 'onKeyDown={handleHorizontalArrowKey}', 'onKeyDown={() => {}}', 'wrapper handler')],
    ['change wrapper label', replaceOnce(fixture, WRAPPERS[0]['aria-label'], '未批准的图示标签', 'wrapper label')],
    ['change wrapper focusability', replaceOnce(fixture, 'tabIndex={0}', 'tabIndex={-1}', 'wrapper focusability')],
  ];
  for (const [label, mutation] of mutations) assert.throws(() => assertChoiceContract(mutation), assert.AssertionError, `${label} rejected`);
  for (const [index, phrase] of FORBIDDEN.entries()) {
    const mutation = replaceOnce(fixture, REQUIRED_SENTENCES[index], phrase, `forbidden ${index}`);
    assert.throws(() => assertChoiceContract(mutation), assert.AssertionError, `${phrase} replacement rejected`);
  }
  const region = {scrollWidth: 900, clientWidth: 360, scrollLeft: 0}; let prevented = false;
  handleHorizontalArrowKey({key: 'ArrowRight', currentTarget: region, target: region, preventDefault() { prevented = true; }});
  assert.deepEqual({scrollLeft: region.scrollLeft, prevented}, {scrollLeft: 40, prevented: true}, 'repository ArrowRight handler scrolls the focused region by 40px');
});

test('STY-14 diagram helper fixture is GREEN and rejects missing semantics or maturity arrows', () => {
  const fixture = diagramFixture(); assertChoiceDiagram(fixture.drawio, fixture.svg);
  const mutations = [
    ['missing Draw.io quadrant', replaceOnce(fixture.drawio, 'semanticRole=quadrant;', 'semanticRole=missing-quadrant;', 'Draw.io quadrant'), fixture.svg],
    ['missing SVG pressure', fixture.drawio, replaceOnce(fixture.svg, 'data-pressure-id="pressure-growth"', 'data-pressure-id="missing-growth"', 'SVG pressure')],
    ['changed capability label', replaceOnce(fixture.drawio, 'value="提交订单"', 'value="删减能力"', 'capability label'), fixture.svg],
    ['changed semantic axis', fixture.drawio, replaceOnce(fixture.svg, 'data-label="同步与事件驱动交互"', 'data-label="成熟度"', 'semantic axis')],
    ['transparent canvas', fixture.drawio, replaceOnce(fixture.svg, 'fill="#FFFFFF" opacity="1"', 'fill="none" opacity="0"', 'canvas')],
    ['missing accessible title', fixture.drawio, replaceOnce(fixture.svg, '<title id="sty14-title">架构风格选择矩阵：部署边界与交互方式</title>', '', 'title')],
    ['wrong original identity', fixture.drawio, replaceOnce(fixture.svg, ORIGINAL_SOURCE_ID, 'src-copied-external-visual', 'illustration identity')],
    ['maturity arrow', replaceOnce(fixture.drawio, '</root>', '<mxCell id="upgrade" edge="1" style="semanticRole=maturity-arrow;"/></root>', 'maturity arrow'), fixture.svg],
  ];
  for (const [label, drawio, svg] of mutations) assert.throws(() => assertChoiceDiagram(drawio, svg), assert.AssertionError, `${label} rejected`);
});

test('STY-14 governance helper fixture is GREEN and locks reused identities and the sole bounded primary', () => {
  const fixture = governanceFixture(ledger); assertChoiceGovernance(fixture);
  const reused = structuredClone(fixture); reused.sources.find(({id}) => id === REUSED_SOURCES[1]).version = 'mutated'; assert.throws(() => assertChoiceGovernance(reused), /exact pre-existing source identity/u);
  const primary = structuredClone(fixture); primary.documents[ARTICLE].citations[0].manifest_primary = false; primary.documents[ARTICLE].citations[1].manifest_primary = true; assert.throws(() => assertChoiceGovernance(primary), /exact STY-14 document citation|sole manifest primary/u);
  const boundary = structuredClone(fixture); boundary.documents[ARTICLE].citations[0].modification_note = 'Supports the complete matrix.'; assert.throws(() => assertChoiceGovernance(boundary), /exact STY-14 document citation|bounded starting heuristic/u);
  const copied = structuredClone(fixture); copied.sources.find(({id}) => id === ORIGINAL_SOURCE_ID).license_evidence_note = 'Copied from an external diagram.'; assert.throws(() => assertChoiceGovernance(copied), /exact original-illustration identity/u);
});

test('STY-14 production article satisfies the exact content contract', () => {
  const source = optionalText(ARTICLE); assert.ok(source, `${ARTICLE} is absent: Task 3 must publish the article`); assertChoiceContract(source);
});

test('STY-14 production Draw.io and SVG satisfy the semantic diagram contract', () => {
  const drawio = optionalText(DRAWIO); const svg = optionalText(SVG);
  assert.ok(drawio && svg, `${DRAWIO} and ${SVG} are absent: Task 2 must create the synchronized pair`); assertChoiceDiagram(drawio, svg);
});

test('STY-14 production source document and original illustration satisfy governance', () => {
  assertChoiceGovernance(ledger);
});
