import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {parseFrontMatter} from '../scripts/content-metadata.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {parseXml, xmlElements as parsedXmlElements, xmlTextContent, svgPresentationState} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';
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
export const QUADRANT_LABELS = Object.freeze(QUADRANT_IDS.map((id, index) => [id, [
  '模块化单体＋同步交互', '模块化单体＋事件驱动', '微服务＋同步交互', '微服务＋事件驱动',
][index]]));
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
export const EVALUATION_LABEL = '评估候选（可保持现状）';
export const QUADRANT_DETAILS = Object.freeze([
  ['控制：模块 API 同步调用', '状态：唯一写入责任与本地事务', '运行代价：模块耦合与联动发布'],
  ['控制：事务性发布与单体内消费', '状态：本地权威与派生状态', '运行代价：重复交付与积压恢复'],
  ['控制：跨服务同步调用', '状态：服务独立数据权威', '运行代价：超时与远程未知结果'],
  ['控制：跨服务事件传播', '状态：生产者权威与消费者派生状态', '运行代价：重放、补偿与合同演进'],
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
// Parse first, then mask non-reader content by AST offsets for table containment.
// Semantic assertions use rendered AST blocks, never the masked source's lines.
// This intentionally accepts
// a narrow, static MDX subset: unknown components, spreads and dynamic rendering fail
// closed rather than allowing assertions to be satisfied by source-only strings.
function readerContract(source) {
  let parsed;
  try { parsed = parseMdxVisibleCopy(source, ARTICLE, {includeAst: true}); }
  catch (error) { assert.fail(`valid closed MDX required: ${error.message}`); }
  const characters = parsed.normalized.split('');
  const mask = (start, end) => { for (let i = start; i < end; i += 1) if (characters[i] !== '\n') characters[i] = ' '; };
  const wrappers = []; const images = []; const links = []; const definitions = new Map(); const excluded = new Set();
  const walk = (node, owner) => {
    const start = node.position?.start.offset; const end = node.position?.end.offset;
    if (['code', 'inlineCode', 'mdxjsEsm', 'definition'].includes(node.type)) {
      if (node.type === 'definition') definitions.set(node.identifier, node.url);
      if (node.type !== 'inlineCode') excluded.add(node);
      mask(start, end); return;
    }
    if (['mdxFlowExpression', 'mdxTextExpression'].includes(node.type)) {
      assert.match(node.value.trim(), /^(?:\/\*[\s\S]*?\*\/\s*)*$/u, 'visible MDX cannot depend on a dynamic expression');
      excluded.add(node);
      mask(start, end); return;
    }
    if (node.type === 'link') links.push(node.url);
    if (node.type === 'linkReference') links.push({reference: node.identifier});
    if (node.type === 'image') images.push({url: node.url, owner});
    if (node.type.startsWith('mdxJsx')) {
      const attrs = {};
      for (const attr of node.attributes) {
        assert.equal(attr.type, 'mdxJsxAttribute', 'visible MDX does not accept spread attributes');
        assert.ok(!Object.hasOwn(attrs, attr.name), 'visible MDX attributes are duplicate-free');
        attrs[attr.name] = attr.value;
      }
      if (Object.hasOwn(attrs, 'hidden') || attrs['aria-hidden'] === 'true') { excluded.add(node); mask(start, end); return; }
      assert.ok(['div', 'span', 'p', 'a', 'img', 'Link'].includes(node.name), `visible MDX unsupported component: ${node.name}`);
      assert.ok(!Object.hasOwn(attrs, 'style'), 'visible MDX inline styles require explicit review');
      for (const [name, value] of Object.entries(attrs)) {
        assert.ok(['className', 'role', 'aria-label', 'tabIndex', 'onKeyDown', 'href', 'to', 'src', 'alt', 'title'].includes(name), `visible MDX unsupported attribute: ${name}`);
        if (value && typeof value === 'object') {
          assert.ok((name === 'tabIndex' && value.value === '0') || (name === 'onKeyDown' && value.value === 'handleHorizontalArrowKey'), `visible MDX unsupported expression: ${name}`);
          attrs[name] = value.value;
        }
      }
      if (attrs.className) assert.ok(WRAPPERS.some((wrapper) => wrapper.className === attrs.className), 'visible MDX unknown CSS class');
      if (attrs.href || attrs.to) links.push(attrs.href ?? attrs.to);
      if (attrs.role === 'region') {
        assert.equal(node.name, 'div', 'wrapper is a native div');
        assert.equal(owner, undefined, 'wrapper regions cannot nest');
        owner = wrappers.length;
        wrappers.push({attributes: attrs, start, end});
      }
      if (node.name === 'img') images.push({url: attrs.src, owner});
      // Mask opening/closing JSX markup but preserve the original Markdown body.
      const children = node.children ?? [];
      if (!children.length) mask(start, end);
      else { mask(start, children[0].position.start.offset); mask(children.at(-1).position.end.offset, end); }
    }
    for (const child of node.children ?? []) walk(child, owner);
  };
  walk(parsed.ast);
  const render = (node) => {
    if (excluded.has(node) || ['image', 'imageReference'].includes(node.type)) return '';
    if (node.type === 'text' || node.type === 'inlineCode') return node.value;
    if (node.type === 'break') return ' ';
    return (node.children ?? []).map(render).join('');
  };
  const blocks = [];
  const collect = (node, parent) => {
    if (excluded.has(node)) return;
    const isBlock = ['paragraph', 'heading'].includes(node.type) || node.type === 'mdxJsxFlowElement' && !(node.children ?? []).some((child) => child.type === 'paragraph' || child.type === 'mdxJsxFlowElement');
    if (isBlock) {
      blocks.push({text: render(node).replace(/\s+/gu, ' ').trim(), start: node.position.start.offset, heading: node.type === 'heading' ? node.depth : undefined, listItem: parent?.type === 'listItem'});
      return;
    }
    for (const child of node.children ?? []) collect(child, node);
  };
  collect(parsed.ast);
  const visible = characters.join('');
  return {visible, blocks, wrappers, images, links: links.map((link) => typeof link === 'string' ? link : definitions.get(link.reference))};
}
export function assertChoiceContract(source) {
  assert.ok(source, `${ARTICLE} must exist after implementation`);
  assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-14 front matter');
  const {visible, blocks, wrappers, images, links} = readerContract(source);
  const headings = blocks.filter(({heading}) => heading === 2);
  assert.deepEqual(headings.map(({text}) => text), EXPECTED_H2, 'exact visible STY-14 H2 order');
  assert.equal(source.split("import {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';").length - 1, 1, 'exact repository ArrowRight handler import');
  assert.deepEqual(wrappers.map(({attributes}) => attributes), WRAPPERS, 'exact three distinct visible keyboard-scroll wrapper contracts');
  assert.equal(new Set(WRAPPERS.map((item) => item['aria-label'])).size, WRAPPERS.length, 'approved wrapper labels are distinct');
  assert.deepEqual(images, [{url: ORIGINAL_SOURCE.canonical_locator, owner: 0}], 'diagram wrapper owns exactly one visible SVG image');
  const tables = markdownTables(visible); assert.equal(tables.length, 2, 'exactly two visible STY-14 Markdown tables');
  assert.deepEqual(tables[0], [DECISION_HEADERS, DECISION_HEADERS.map(() => '---'), ...DECISION_ROWS], 'exact six-column pressure/structure decision table');
  assert.deepEqual(tables[1], [ACTION_HEADERS, ACTION_HEADERS.map(() => '---'), ...ACTION_ROWS], 'exact five-column reversible action table');
  for (const [index, wrapper] of wrappers.entries()) assert.deepEqual(markdownTables(visible.slice(wrapper.start, wrapper.end)), index === 0 ? [] : [tables[index - 1]], `wrapper ${index} owns only its approved visible table`);
  for (const pressure of PRESSURES) {
    const index = headings.findIndex(({text}) => text === `压力${['一', '二', '三'][PRESSURES.indexOf(pressure)]}：${pressure}`);
    const section = blocks.filter(({start}) => start > headings[index].start && start < headings[index + 1].start);
    assert.equal(section.filter(({text}) => text === CAPABILITY_SCOPE).length, 1, `${pressure} affirmative visible capability scope`);
    const labels = PRESSURE_DETAILS[pressure].map(([label]) => label);
    // Only explicitly labeled list entries are the six-item contract. Narrative
    // paragraphs and subheadings remain in blocks for the global semantic scan.
    const entries = section.filter(({text, listItem}) => listItem && labels.some((label) => text.startsWith(`${label}：`))).map(({text}) => text.split(/：\s*/u));
    assert.deepEqual(entries, PRESSURE_DETAILS[pressure], `${pressure} exact evidence/trigger/action/stop/owner contract`);
  }
  const compact = (text) => text.replace(/\s/gu, '');
  const rendered = blocks.map(({text}) => compact(text)).join('\n');
  const statements = blocks.flatMap(({text}) => text.split(/(?<=[。！？])/u)).map(compact).filter(Boolean);
  for (const phrase of FORBIDDEN) assert.equal(rendered.includes(compact(phrase)), false, `forbidden choice claim: ${phrase}`);
  for (const sentence of REQUIRED_SENTENCES) {
    assert.equal(statements.filter((text) => text === compact(sentence)).length, 1, `one affirmative visible boundary: ${sentence}`);
    const polaritySkeleton = (value) => value.replace(/并非|不是|不|非|未|无需|无须|没|\s/gu, (token) => token === '不是' ? '是' : '');
    assert.equal(statements.filter((text) => polaritySkeleton(text) === polaritySkeleton(sentence)).length, 1, `no duplicate or opposing visible boundary: ${sentence}`);
  }
  assert.doesNotMatch(rendered, /Event-Driven[^。\n]*(?:互斥|只能三选一)|(?:成熟度|最终形态)[^。\n]*(?:单体|微服务|事件驱动)|(?:性能|可用性|团队效率)[^。\n]*(?:天然|必然|保证)/iu, 'no mutual-exclusion, maturity-ladder, or universal-outcome claim');
  const destinations = [...links, ...extractInternalLinks({body: source})];
  assert.equal(destinations.some((href) => typeof href === 'string' && href.split(/[?#]/u)[0].replace(/\/+$/u, '') === '/styles/sty-15'), false, 'STY-15 remains non-actionable across Markdown/MDX/HTML links');
}

function xmlRoot(source) {
  try { return parseXml(source).root; } catch (error) { assert.fail(`visible diagram requires valid XML: ${error.message}`); }
}
function xmlElements(source, name) { return parsedXmlElements(xmlRoot(source), name); }
function styleMap(style = '') { return new Map(style.split(';').filter(Boolean).map((entry) => entry.split(/=(.*)/su))); }
function exactIds(actual, expected, label) { assert.equal(new Set(actual).size, actual.length, `${label} duplicate-free`); assert.deepEqual([...actual].sort(), [...expected].sort(), `${label} exact IDs`); }
function semanticDrawioCells(source, role) { return xmlElements(source, 'mxCell').filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === role); }

function assertVisibleSvg(root) {
  // Deliberately static, flattened SVG. Task 2 owns layout/raster QA, but must not
  // weaken this paint/text/connector inventory or satisfy it with data-label alone.
  const groups = new Map(); const axisLines = new Map(); const edges = new Map(); const markers = new Map();
  const labels = new Map([...AXES, ...QUADRANT_LABELS, ...PRESSURE_IDS.map((id, index) => [id, PRESSURES[index]]), ...CAPABILITY_LABELS]);
  const visit = (element, parentState, owner, markerOwner, parentName) => {
    const {localName: name, attributes: attrs} = element;
    assert.equal(element.namespace, 'http://www.w3.org/2000/svg', 'visible SVG namespace');
    assert.ok(['svg', 'g', 'rect', 'text', 'tspan', 'title', 'desc', 'line', 'path', 'defs', 'marker'].includes(name), `visible SVG unsupported shape/connector: ${name}`);
    for (const [attribute, value] of attrs) {
      assert.ok(!['class', 'style', 'transform', 'clip-path', 'mask', 'filter', 'hidden'].includes(attribute) && !attribute.startsWith('on'), `visible SVG unsupported presentation: ${attribute}`);
      if (attribute.startsWith('marker-')) assert.ok(attribute === 'marker-end' && ['path', 'line'].includes(name) && edges.has(owner), 'evaluation connector owns its directed marker');
      if (attribute.endsWith('opacity')) assert.ok(Number(value) > 0 && Number(value) <= 1, `visible SVG positive ${attribute}`);
      if (attribute === 'font-size' || attribute === 'stroke-width') assert.ok(Number(value) > 0, `visible SVG positive inherited ${attribute}`);
    }
    const state = svgPresentationState(element, parentState);
    assert.ok(state.display !== 'none' && !['hidden', 'collapse'].includes(state.visibility) && Number(state.opacity) > 0 && attrs.get('aria-hidden') !== 'true', 'visible SVG subtree cannot be hidden');
    if (name === 'title' || name === 'desc') return;
    if (name === 'defs') assert.ok(element.children.every((child) => child.localName === 'marker'), 'evaluation marker definitions contain only markers');
    if (name === 'marker') {
      assert.equal(parentName, 'defs', 'evaluation marker lives in defs');
      markerOwner = attrs.get('id'); assert.ok(markerOwner && !markers.has(markerOwner), 'evaluation marker has a unique ID');
      assert.equal(attrs.get('data-marker-role'), 'pressure-evaluation', 'marker expresses evaluation, not maturity/upgrade');
      assert.ok(Number(attrs.get('markerWidth')) > 0 && Number(attrs.get('markerHeight')) > 0, 'visible evaluation marker dimensions');
      markers.set(markerOwner, {paths: 0});
    }
    const semanticIds = [...attrs].filter(([key]) => /^data-(?:axis|quadrant|pressure|capability)-id$/u.test(key));
    if (semanticIds.length) {
      assert.equal(name, 'g', 'visible semantic owner must be a group');
      assert.equal(semanticIds.length, 1, 'visible group has exactly one semantic identity');
      assert.equal(owner, undefined, 'visible semantic groups cannot nest');
      owner = semanticIds[0][1]; assert.ok(labels.has(owner), `visible known group: ${owner}`);
      assert.ok(!groups.has(owner), 'visible semantic group IDs are unique');
      groups.set(owner, {text: [], shapes: 0});
    }
    if (attrs.has('data-edge-id')) {
      assert.equal(name, 'g', 'evaluation connector group');
      assert.equal(owner, undefined, 'evaluation connector cannot nest inside a semantic region');
      owner = attrs.get('data-edge-id'); assert.ok(owner && !edges.has(owner), 'evaluation connector IDs are unique');
      const role = attrs.get('data-edge-role'); const source = attrs.get('data-source-id'); const target = attrs.get('data-target-id');
      assert.equal(role, 'pressure-evaluation', 'connector role rejects maturity/upgrade routes');
      assert.ok(PRESSURE_IDS.includes(source) && QUADRANT_IDS.includes(target), 'evaluation connector endpoints must be pressure → candidate region, not an upgrade chain');
      edges.set(owner, {id: owner, role, source, target, texts: [], paths: [], markers: []});
    }
    const positivePaint = (paint) => /^#[\da-f]{6}$/iu.test(state[paint]) || ['black', 'white'].includes(state[paint]);
    if (['rect', 'text', 'tspan', 'line', 'path'].includes(name)) {
      assert.ok(positivePaint('fill') || positivePaint('stroke'), `visible ${name} must have supported opaque paint`);
      if (attrs.has('font-size')) assert.ok(Number(attrs.get('font-size')) > 0, 'visible text font size is positive');
      if (attrs.has('stroke-width')) assert.ok(Number(attrs.get('stroke-width')) > 0, 'visible shape stroke width is positive');
    }
    if (name === 'text') {
      assert.ok(owner, 'visible text belongs to an approved semantic group');
      const text = xmlTextContent(element).trim(); assert.ok(text, `${owner} visible text is nonblank`);
      for (const phrase of FORBIDDEN) assert.ok(!text.replace(/\s/gu, '').includes(phrase.replace(/\s/gu, '')), 'visible diagram text rejects maturity/upgrade and forbidden claims');
      if (edges.has(owner)) edges.get(owner).texts.push(text);
      else groups.get(owner).text.push({role: attrs.get('data-text-role') ?? 'title', text});
    }
    if (name === 'rect') {
      assert.ok(Number(attrs.get('width')) > 0 && Number(attrs.get('height')) > 0, 'visible shape has positive dimensions');
      assert.ok(owner || attrs.get('data-canvas') === 'true', 'visible shape belongs to a semantic group or canvas');
      if (owner) groups.get(owner).shapes += 1;
    }
    if (name === 'line' && !edges.has(owner)) {
      assert.ok(AXES.some(([id]) => id === owner), 'connector is owned by a semantic axis, not an upgrade route');
      assert.ok(positivePaint('stroke'), 'visible axis connector has opaque stroke');
      const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((key) => Number(attrs.get(key)));
      assert.ok([x1, y1, x2, y2].every(Number.isFinite), 'connector coordinates are finite');
      assert.ok(owner === 'axis-deployment' ? y1 === y2 && x1 !== x2 : x1 === x2 && y1 !== y2, 'connector is a nonzero independent horizontal/vertical axis');
      axisLines.set(owner, (axisLines.get(owner) ?? 0) + 1);
    }
    if (name === 'path' || name === 'line' && edges.has(owner)) {
      assert.ok(markerOwner || edges.has(owner), 'visible connector must have evaluation ownership; unclassified upgrade route rejected');
      if (name === 'path') {
        const d = attrs.get('d') ?? ''; const numbers = d.match(/-?\d+(?:\.\d+)?/gu)?.map(Number) ?? [];
        assert.ok(/^\s*M[\d\s.,+\-MLHVCSQTAZmlhvcsqtaz]*$/u.test(d) && numbers.length >= 4 && new Set(numbers).size > 1, 'visible connector/marker has nonempty actual path geometry');
      }
      if (markerOwner) {
        assert.ok(!owner && name === 'path' && positivePaint('fill') && /Z\s*$/iu.test(attrs.get('d') ?? ''), 'visible evaluation marker is an actual closed painted shape');
        markers.get(markerOwner).paths += 1;
      } else {
        assert.ok(positivePaint('stroke'), 'visible evaluation connector has opaque stroke');
        assert.ok((attrs.get('stroke-dasharray') ?? '').split(/[ ,]+/u).map(Number).filter((number) => number > 0).length >= 2, 'evaluation connector uses a visible dashed line classification');
        const markerId = /^url\(#([\w-]+)\)$/u.exec(attrs.get('marker-end') ?? '')?.[1];
        assert.ok(markerId, 'evaluation connector has an actual referenced marker');
        edges.get(owner).paths.push(element); edges.get(owner).markers.push(markerId);
      }
    }
    for (const child of element.children) visit(child, state, owner, markerOwner, name);
  };
  visit(root);
  exactIds([...groups.keys()], [...labels.keys()], 'visible SVG semantic groups');
  for (const [id, label] of labels) {
    const texts = groups.get(id).text;
    assert.deepEqual(texts.filter(({role}) => role === 'title').map(({text}) => text), [label], `${id} exact visible title (not data-label)`);
    const details = texts.filter(({role}) => role !== 'title');
    if (QUADRANT_IDS.includes(id)) {
      exactIds(details.map(({role}) => role), ['control', 'state', 'cost'], `${id} visible quadrant explanation roles`);
      for (const {role, text} of details) assert.ok(text.startsWith({control: '控制：', state: '状态：', cost: '运行代价：'}[role]) && text.length > {control: 3, state: 3, cost: 5}[role], `${id} visible nonempty quadrant ${role} explanation`);
    } else assert.equal(details.length, 0, `${id} no unclassified visible text`);
    assert.ok(groups.get(id).shapes > 0 || axisLines.get(id) === 1, `${id} visible shape or axis connector`);
  }
  assert.deepEqual([...axisLines].sort(), AXES.map(([id]) => [id, 1]).sort(), 'two visible independent axes alongside pressure evaluation connectors');
  for (const edge of edges.values()) {
    assert.deepEqual(edge.texts, [EVALUATION_LABEL], `${edge.id} visible evaluation label rejects upgrade wording`);
    assert.equal(edge.paths.length, 1, `${edge.id} one real visible evaluation connector`);
    for (const id of edge.markers) assert.equal(markers.get(id)?.paths, 1, `${edge.id} resolves one real visible evaluation marker`);
  }
  for (const pressure of PRESSURE_IDS) assert.ok(new Set([...edges.values()].filter(({source}) => source === pressure).map(({target}) => target)).size >= 2, `${pressure} evaluation branches to multiple candidate regions, not one forward-only path`);
  return {
    edges: [...edges.values()].map(({id, role, source, target, texts}) => ({id, role, source, target, label: texts[0]})).sort((a, b) => a.id.localeCompare(b.id)),
    details: QUADRANT_IDS.flatMap((parent) => groups.get(parent).text.filter(({role}) => role !== 'title').map(({role, text}) => ({parent, role, label: text}))).sort((a, b) => `${a.parent}/${a.role}`.localeCompare(`${b.parent}/${b.role}`)),
  };
}

export function assertChoiceDiagram(drawioSource, svgSource) {
  assert.ok(drawioSource, `${DRAWIO} must exist after implementation`); assert.ok(svgSource, `${SVG} must exist after implementation`);
  const visibleSvg = assertVisibleSvg(xmlRoot(svgSource));
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
  for (const [id, label] of [...AXES, ...QUADRANT_LABELS, ...PRESSURE_IDS.map((id, index) => [id, PRESSURES[index]]), ...CAPABILITY_LABELS]) {
    const drawio = xmlElements(drawioSource, 'mxCell').find(({attributes}) => attributes.get('id') === id); assert.equal(drawio?.attributes.get('value'), label, `${id} exact Draw.io label`);
    const svg = xmlElements(svgSource, 'g').find(({attributes}) => [...attributes.values()].includes(id)); assert.equal(svg?.attributes.get('data-label'), label, `${id} exact SVG label`);
  }
  assert.equal(semanticDrawioCells(drawioSource, 'maturity-arrow').length, 0, 'no Draw.io maturity arrow');
  const drawioEdges = xmlElements(drawioSource, 'mxCell').filter(({attributes}) => attributes.get('edge') === '1').map(({attributes}) => {
    const style = styleMap(attributes.get('style'));
    const edge = {id: attributes.get('id'), role: style.get('semanticRole'), source: attributes.get('source'), target: attributes.get('target'), label: attributes.get('value')};
    assert.equal(edge.role, 'pressure-evaluation', 'Draw.io connector role rejects maturity/upgrade routes');
    assert.ok(PRESSURE_IDS.includes(edge.source) && QUADRANT_IDS.includes(edge.target), 'Draw.io evaluation connector endpoints reject upgrade chains');
    assert.equal(edge.label, EVALUATION_LABEL, 'Draw.io evaluation label rejects upgrade wording');
    assert.deepEqual([style.get('dashed'), style.get('endArrow')], ['1', 'block'], 'Draw.io evaluation connector has matching dashed/marker classification');
    return edge;
  }).sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(drawioEdges, visibleSvg.edges, 'Draw.io/SVG evaluation connector semantic parity');
  const drawioDetails = semanticDrawioCells(drawioSource, 'quadrant-detail').map(({attributes}) => ({parent: attributes.get('parent'), role: styleMap(attributes.get('style')).get('detailRole'), label: attributes.get('value')})).sort((a, b) => `${a.parent}/${a.role}`.localeCompare(`${b.parent}/${b.role}`));
  assert.deepEqual(drawioDetails, visibleSvg.details, 'Draw.io/SVG quadrant explanation semantic parity');
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
  const contents = ['![架构风格选择矩阵双轴图](/img/diagrams/sty-14-architecture-choice-matrix.svg)', tableLines(DECISION_HEADERS, DECISION_ROWS), tableLines(ACTION_HEADERS, ACTION_ROWS)];
  return `---\n${frontMatterFixture(EXACT_METADATA)}\n---\nimport {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';\n\n${sections}\n\n${WRAPPERS.map((wrapper, index) => `<div className="${wrapper.className}" role="${wrapper.role}" aria-label="${wrapper['aria-label']}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>\n\n${contents[index]}\n\n</div>`).join('\n\n')}\n\n${REQUIRED_SENTENCES.join('\n\n')}\n`;
}
function diagramFixture() {
  const cell = (id, label, role) => `<mxCell id="${id}" value="${label}" vertex="1" style="semanticRole=${role};"/>`;
  const drawio = `<mxGraphModel><root><mxCell id="canvas" value="" vertex="1" style="semanticRole=canvas;fillColor=#FFFFFF;opacity=100;"/>${AXES.map(([id, label]) => cell(id, label, 'axis')).join('')}${QUADRANT_LABELS.map(([id, label]) => cell(id, label, 'quadrant')).join('')}${PRESSURE_IDS.map((id, index) => cell(id, PRESSURES[index], 'pressure')).join('')}${CAPABILITY_LABELS.map(([id, label]) => cell(id, label, 'capability')).join('')}</root></mxGraphModel>`;
  const group = (attribute, id, label) => `<g ${attribute}="${id}" data-label="${label}"><rect x="20" y="20" width="200" height="80" fill="#FFFFFF" stroke="#111111"/><text x="30" y="50" fill="#111111">${label}</text></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="sty14-title sty14-desc" data-illustration-id="${ORIGINAL_SOURCE_ID}" data-original-illustration="true"><title id="sty14-title">架构风格选择矩阵：部署边界与交互方式</title><desc id="sty14-desc">四个象限展示模块化单体与微服务如何分别采用同步或事件驱动交互，三类压力只提供评估入口，不形成升级路线。</desc><rect data-canvas="true" x="0" y="0" width="1200" height="900" fill="#FFFFFF" opacity="1"/>${AXES.map(([id, label], index) => group('data-axis-id', id, label).replace('</g>', `<line x1="${index ? 600 : 0}" y1="${index ? 0 : 450}" x2="${index ? 600 : 1200}" y2="${index ? 900 : 450}" stroke="#111111"/></g>`)).join('')}${QUADRANT_LABELS.map(([id, label]) => group('data-quadrant-id', id, label)).join('')}${PRESSURE_IDS.map((id, index) => group('data-pressure-id', id, PRESSURES[index])).join('')}${CAPABILITY_LABELS.map(([id, label]) => group('data-capability-id', id, label)).join('')}</svg>`;
  const detailRoles = ['control', 'state', 'cost'];
  const details = QUADRANT_IDS.flatMap((id, index) => QUADRANT_DETAILS[index].map((label, offset) => ({id: `${id}-${detailRoles[offset]}`, parent: id, role: detailRoles[offset], label})));
  const routes = PRESSURE_IDS.flatMap((source, index) => [QUADRANT_IDS[index], QUADRANT_IDS[(index + 2) % 4]].map((target, offset) => ({id: `evaluation-${index}-${offset}`, source, target})));
  const drawioDetails = details.map(({id, parent, role, label}) => `<mxCell id="${id}" parent="${parent}" value="${label}" vertex="1" style="semanticRole=quadrant-detail;detailRole=${role};"/>`).join('');
  const drawioEdges = routes.map(({id, source, target}) => `<mxCell id="${id}" source="${source}" target="${target}" value="${EVALUATION_LABEL}" edge="1" style="semanticRole=pressure-evaluation;dashed=1;endArrow=block;"/>`).join('');
  let expandedSvg = svg;
  for (const [index, id] of QUADRANT_IDS.entries()) {
    const label = QUADRANT_LABELS[index][1];
    expandedSvg = expandedSvg.replace(`>${label}</text>`, `>${label}</text>${details.filter((detail) => detail.parent === id).map(({role, label: text}) => `<text data-text-role="${role}" x="30" y="70" fill="#111111">${text}</text>`).join('')}`);
  }
  const marker = '<defs><marker id="evaluation-arrow" data-marker-role="pressure-evaluation" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#111111"/></marker></defs>';
  const svgEdges = routes.map(({id, source, target}) => `<g data-edge-id="${id}" data-edge-role="pressure-evaluation" data-source-id="${source}" data-target-id="${target}"><path d="M 20 100 L 120 200" fill="none" stroke="#111111" stroke-dasharray="6 4" marker-end="url(#evaluation-arrow)"/><text x="30" y="150" fill="#111111">${EVALUATION_LABEL}</text></g>`).join('');
  return {drawio: drawio.replace('</root>', `${drawioDetails}${drawioEdges}</root>`), svg: expandedSvg.replace('</svg>', `${marker}${svgEdges}</svg>`)};
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
  for (const phrase of FORBIDDEN) {
    const mutation = `${fixture}\n${phrase}。\n`;
    assert.notEqual(mutation, fixture, 'additive forbidden mutation applies');
    assert.throws(() => assertChoiceContract(mutation), (error) => error instanceof assert.AssertionError && error.message.split('\n')[0] === `forbidden choice claim: ${phrase}`, `${phrase} rejected by the forbidden guard with all positive prose intact`);
  }
  const region = {scrollWidth: 900, clientWidth: 360, scrollLeft: 0}; let prevented = false;
  handleHorizontalArrowKey({key: 'ArrowRight', currentTarget: region, target: region, preventDefault() { prevented = true; }});
  assert.deepEqual({scrollLeft: region.scrollLeft, prevented}, {scrollLeft: 40, prevented: true}, 'repository ArrowRight handler scrolls the focused region by 40px');
});

test('STY-14 content helper permits rendered Markdown emphasis links and soft wraps', () => {
  const fixture = articleFixture();
  const formatted = fixture.replace(REQUIRED_SENTENCES[0], '**服务边界**和[交互方式](/styles/sty-06)是两条\n独立的决策轴。');
  assert.notEqual(formatted, fixture, 'normal Markdown fixture change applies');
  assertChoiceContract(formatted);
});

test('STY-14 content helper permits pressure explanation paragraphs and H3 alongside six contract entries', () => {
  const fixture = articleFixture();
  const expanded = replaceOnce(fixture, '## 压力二：局部故障', '### 增长证据如何解释\n\n先观察热点是否集中在同一模块，再比较容量治理的收益与拆分后的运行成本。\n\n## 压力二：局部故障', 'pressure narrative');
  assertChoiceContract(expanded);
});

test('STY-14 content helper rejects contradictions in ordinary pressure explanation paragraphs', () => {
  const fixture = articleFixture();
  const mutation = replaceOnce(fixture, '## 压力二：局部故障', '### 增长证据如何解释\n\n三种架构**按总分**选择。\n\n## 压力二：局部故障', 'pressure narrative contradiction');
  assert.throws(() => assertChoiceContract(mutation), /forbidden choice claim: 三种架构按总分选择/u);
});

for (const [label, prose, diagnostic] of [
  ['soft-line negation', `并非\n${REQUIRED_SENTENCES[0]}`, /affirmative|opposing/u],
  ['bold scoring', '三种架构**按总分**选择。', /forbidden choice claim: 三种架构按总分选择/u],
  ['bold exactly-once', '事件可以保证 **exactly-once** 业务效果。', /forbidden choice claim: 事件可以保证 exactly-once 业务效果/u],
  ['bold opposing copula', '服务边界和交互方式**不是**两条独立的决策轴。', /opposing/u],
]) test(`STY-14 content helper rejects rendered ${label}`, () => {
  const fixture = articleFixture();
  const mutation = label === 'soft-line negation' ? replaceOnce(fixture, REQUIRED_SENTENCES[0], prose, label) : `${fixture}\n\n${prose}\n`;
  assert.notEqual(mutation, fixture, `${label} applies`);
  assert.throws(() => assertChoiceContract(mutation), diagnostic);
});

for (const [label, mutate] of [
  ['hidden boundary', (s) => s.replace(REQUIRED_SENTENCES[0], `<span hidden>${REQUIRED_SENTENCES[0]}</span>`)],
  ['CSS hidden boundary', (s) => s.replace(REQUIRED_SENTENCES[0], `<span style={{display: 'none'}}>${REQUIRED_SENTENCES[0]}</span>`)],
  ['MDX comment boundary', (s) => s.replace(REQUIRED_SENTENCES[0], `{/* ${REQUIRED_SENTENCES[0]} */}`)],
  ['HTML comment boundary', (s) => s.replace(REQUIRED_SENTENCES[0], `<!-- ${REQUIRED_SENTENCES[0]} -->`)],
  ['negated boundary', (s) => s.replace(REQUIRED_SENTENCES[0], `并非${REQUIRED_SENTENCES[0]}`)],
  ['duplicate conflicting boundary', (s) => `${s}\n并非${REQUIRED_SENTENCES[0]}\n`],
  ['opposing boundary alongside positive prose', (s) => `${s}\n服务边界和交互方式不是两条独立的决策轴。\n`],
  ['hidden pressure scope', (s) => s.replace(CAPABILITY_SCOPE, `<span hidden>${CAPABILITY_SCOPE}</span>`)],
  ['negated pressure scope', (s) => s.replace(CAPABILITY_SCOPE, `并非${CAPABILITY_SCOPE}`)],
  ['unclosed wrapper', (s) => s.replace('</div>', '')],
  ['hidden wrapper', (s) => s.replace('<div ', '<div hidden ')],
  ['hidden diagram', (s) => s.replace('![架构风格选择矩阵双轴图]', '<span hidden>![架构风格选择矩阵双轴图]').replace('.svg)\n', '.svg)</span>\n')],
  ['hidden decision table', (s) => s.replace(tableLines(DECISION_HEADERS, DECISION_ROWS), `<div hidden>\n\n${tableLines(DECISION_HEADERS, DECISION_ROWS)}\n\n</div>`)],
  ['action table outside wrapper', (s) => s.replace(`${tableLines(ACTION_HEADERS, ACTION_ROWS)}\n\n</div>`, `</div>\n\n${tableLines(ACTION_HEADERS, ACTION_ROWS)}`)],
  ['diagram outside wrapper', (s) => s.replace('![架构风格选择矩阵双轴图](/img/diagrams/sty-14-architecture-choice-matrix.svg)', '').concat('\n![架构风格选择矩阵双轴图](/img/diagrams/sty-14-architecture-choice-matrix.svg)\n')],
  ['decision table outside wrapper', (s) => s.replace(`${tableLines(DECISION_HEADERS, DECISION_ROWS)}\n\n</div>`, `</div>\n\n${tableLines(DECISION_HEADERS, DECISION_ROWS)}`)],
  ['interchanged table wrappers', (s) => s.replace(WRAPPERS[1]['aria-label'], 'SWAP').replace(WRAPPERS[2]['aria-label'], WRAPPERS[1]['aria-label']).replace('SWAP', WRAPPERS[2]['aria-label'])],
  ['table in diagram wrapper', (s) => s.replace('![架构风格选择矩阵双轴图](/img/diagrams/sty-14-architecture-choice-matrix.svg)', 'SWAP').replace(tableLines(DECISION_HEADERS, DECISION_ROWS), '![架构风格选择矩阵双轴图](/img/diagrams/sty-14-architecture-choice-matrix.svg)').replace('SWAP', tableLines(DECISION_HEADERS, DECISION_ROWS))],
  ['Markdown STY-15 link', (s) => `${s}\n[下一篇](/styles/sty-15)\n`],
  ['MDX STY-15 link', (s) => `${s}\n<Link to="/styles/sty-15#next">下一篇</Link>\n`],
  ['HTML STY-15 link', (s) => `${s}\n<a href="/styles/sty-15?next=1">下一篇</a>\n`],
]) test(`STY-14 content helper rejects ${label}`, () => {
  const fixture = articleFixture(); assertChoiceContract(fixture);
  const mutation = mutate(fixture); assert.notEqual(mutation, fixture, `${label} mutation applies`);
  assert.throws(() => assertChoiceContract(mutation), /visible|affirmative|MDX|wrapper|STY-15|scope|table/u, label);
});

for (const [label, mutate] of [
  ['empty semantic groups', (s) => s.replace(/<rect x="20"[^>]*\/><text[^>]*>[^<]*<\/text>/gu, '')],
  ['hidden SVG root', (s) => s.replace('<svg ', '<svg style="display:none" ')],
  ['hidden semantic group', (s) => s.replace('<g ', '<g display="none" ')],
  ['zero-size inherited text', (s) => s.replace('<g ', '<g font-size="0" ')],
  ['blank visible capability', (s) => s.replace('>提交订单</text>', '> </text>')],
  ['contradictory visible capability', (s) => s.replace('>提交订单</text>', '>删减能力</text>')],
  ['unclassified upgrade connector', (s) => s.replace('</svg>', '<path d="M 0 0 L 100 100" stroke="#111111" marker-end="url(#arrow)"/></svg>')],
  ['missing axis connector', (s) => s.replace(/<line[^>]*\/>/u, '')],
  ['diagonal upgrade posing as axis', (s) => s.replace('x2="1200" y2="450"', 'x2="1200" y2="900"')],
  ['unclassified contradictory text', (s) => s.replace('</svg>', '<text x="10" y="10">微服务是模块化单体的下一成熟阶段</text></svg>')],
]) test(`STY-14 diagram helper rejects ${label}`, () => {
  const fixture = diagramFixture(); assertChoiceDiagram(fixture.drawio, fixture.svg);
  const mutation = mutate(fixture.svg); assert.notEqual(mutation, fixture.svg, `${label} mutation applies`);
  assert.throws(() => assertChoiceDiagram(fixture.drawio, mutation), /visible|connector/u, label);
});

test('STY-14 diagram helper permits branching evaluation markers and quadrant explanations', () => {
  const fixture = diagramFixture(); assertChoiceDiagram(fixture.drawio, fixture.svg);
  assert.equal(xmlElements(fixture.svg, 'marker').length, 1, 'positive fixture has a real marker');
  assert.equal(xmlElements(fixture.drawio, 'mxCell').filter(({attributes}) => attributes.get('edge') === '1').length, 6, 'positive fixture has six real Draw.io evaluation edges');
});

for (const [label, mutate] of [
  ['maturity role', ({drawio, svg}) => ({drawio, svg: svg.replace('data-edge-role="pressure-evaluation"', 'data-edge-role="maturity-arrow"')})],
  ['upgrade endpoints disguised as evaluation', ({drawio, svg}) => ({drawio: drawio.replace('source="pressure-growth"', 'source="quadrant-monolith-sync"'), svg: svg.replace('data-source-id="pressure-growth"', 'data-source-id="quadrant-monolith-sync"')})],
  ['upgrade label disguised as evaluation', ({drawio, svg}) => ({drawio: drawio.replace(`value="${EVALUATION_LABEL}"`, 'value="升级到微服务"'), svg: svg.replace(`>${EVALUATION_LABEL}</text>`, '>升级到微服务</text>')})],
  ['missing visible route', ({drawio, svg}) => ({drawio, svg: svg.replace('<path d="M 20 100 L 120 200" fill="none" stroke="#111111" stroke-dasharray="6 4" marker-end="url(#evaluation-arrow)"/>', '')})],
  ['unresolved marker', ({drawio, svg}) => ({drawio, svg: svg.replace('marker-end="url(#evaluation-arrow)"', 'marker-end="url(#missing-arrow)"')})],
  ['hidden marker', ({drawio, svg}) => ({drawio, svg: svg.replace('<marker ', '<marker display="none" ')})],
  ['hidden route label', ({drawio, svg}) => ({drawio, svg: svg.replace(`>${EVALUATION_LABEL}</text>`, `><tspan display="none">${EVALUATION_LABEL}</tspan></text>`)})],
  ['contradictory quadrant detail', ({drawio, svg}) => ({drawio, svg: svg.replace(QUADRANT_DETAILS[0][0], '微服务是模块化单体的下一成熟阶段')})],
  ['Drawio SVG endpoint drift', ({drawio, svg}) => ({drawio: drawio.replace('target="quadrant-monolith-sync"', 'target="quadrant-monolith-event"'), svg})],
]) test(`STY-14 diagram helper independently rejects ${label}`, () => {
  const fixture = diagramFixture(); assertChoiceDiagram(fixture.drawio, fixture.svg);
  const mutation = mutate(fixture); assert.notDeepEqual(mutation, fixture, `${label} mutation applies`);
  assert.throws(() => assertChoiceDiagram(mutation.drawio, mutation.svg), /maturity|upgrade|evaluation|connector|visible|quadrant|parity/u, label);
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
