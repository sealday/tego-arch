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
export const NEXT_TOPIC = 'STY-09';
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
export const EXPECTED_CURRENT_PROJECTION = Object.freeze({completed_topics: 65, content_documents: 108, governed_sources: 565});

export const RELATIONS = Object.freeze({
  depends_on: ['STY-00', 'STY-05'],
  adjacent_topics: ['STY-04', 'STY-05', 'STY-06', 'STY-08'],
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
const REMOTE_SOURCE_CONTRACTS = Object.freeze({
  'src-oasis-soa-reference-model-1-0': Object.freeze({
    canonical_locator: 'https://docs.oasis-open.org/soa-rm/v1.0/soa-rm.html',
    transport_locator: 'https://docs.oasis-open.org/soa-rm/v1.0/soa-rm.html', source_kind: 'standard',
    license: 'LicenseRef-Proprietary-Standard', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['comparison', 'definition', 'method'], citation_roles: ['definition', 'method'],
    manifest_primary: true,
    license_evidence_note: 'OASIS IPR policies govern the standard; Tego Arch conservatively uses attributed bibliographic facts and original factual summary only.',
  }),
  'src-oasis-soa-reference-architecture-foundation-1-0': Object.freeze({
    canonical_locator: 'https://docs.oasis-open.org/soa-rm/soa-ra/v1.0/soa-ra.html',
    transport_locator: 'https://docs.oasis-open.org/soa-rm/soa-ra/v1.0/soa-ra.html', source_kind: 'standard',
    license: 'LicenseRef-Proprietary-Standard', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['comparison', 'definition', 'method'], citation_roles: ['definition', 'method'],
    manifest_primary: false,
    license_evidence_note: 'OASIS IPR policies govern the specification; Tego Arch conservatively uses attributed bibliographic facts and original factual summary only.',
  }),
  'src-w3c-web-services-architecture': Object.freeze({
    canonical_locator: 'https://www.w3.org/TR/ws-arch/', transport_locator: 'https://www.w3.org/TR/ws-arch/',
    source_kind: 'official-docs', license: 'LicenseRef-Proprietary-Standard', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['comparison', 'definition', 'method'], citation_roles: ['comparison', 'definition'],
    manifest_primary: false,
    license_evidence_note: 'The W3C document-use license governs W3C documents; Tego Arch conservatively uses attributed factual reference and original summary only.',
  }),
  'src-lewis-fowler-microservices': Object.freeze({
    canonical_locator: 'https://martinfowler.com/articles/microservices.html',
    transport_locator: 'https://martinfowler.com/articles/microservices.html', source_kind: 'engineering-blog',
    license: 'LicenseRef-All-Rights-Reserved', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['comparison', 'definition', 'method', 'runtime-fact'],
    citation_roles: ['comparison', 'definition', 'runtime-fact'], manifest_primary: false,
    license_evidence_note: 'The author-hosted Microservices article exposes no reusable license; Tego Arch retains attribution, a link, and original Chinese factual summary only.',
  }),
  'src-microsoft-microservices-architecture-style': Object.freeze({
    canonical_locator: 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices',
    transport_locator: 'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/f69851e7c8b27ca6e8983e7b7d91d35e99423a73/docs/guide/architecture-styles/microservices.md',
    source_kind: 'vendor-reference-architecture', license: 'CC-BY-4.0', copyright_policy: 'vendor-claims-separated',
    allowed_evidence_roles: ['comparison', 'definition', 'implementation', 'learning', 'method', 'runtime-fact'],
    citation_roles: ['comparison', 'definition', 'runtime-fact'], manifest_primary: false,
    license_evidence_note: 'The pinned official Architecture Center repository LICENSE applies CC BY 4.0 to the documentation repository.',
  }),
});
const RECIPROCALS = Object.freeze([
  'content/styles/sty-04-modular-monolith.mdx', 'content/styles/sty-05-microservices.mdx',
  'content/styles/sty-06-event-driven-architecture.mdx', 'content/cases/temporal-saga-durable-execution.mdx',
]);
const DIAGRAM_NODES = Object.freeze([
  'comparison-canvas', 'soa-boundary', 'comparison-axis', 'microservices-boundary', 'legend-band',
  'soa-client', 'soa-orchestrator', 'soa-integration', 'soa-process-state',
  ...['order', 'inventory', 'payment', 'notification'].flatMap((name) => [`soa-${name}-contract`, `soa-${name}-system`, `soa-${name}-store`]),
  ...['order', 'inventory', 'payment', 'notification'].flatMap((name) => [`microservices-${name}-contract`, `microservices-${name}-service`, `microservices-${name}-store`]),
  'microservices-client', 'microservices-workflow', 'microservices-workflow-state', 'microservices-platform',
]);
const CONNECTOR_STYLES = Object.freeze({
  'business-call': Object.freeze({strokeColor: '#1D4ED8', strokeWidth: '4', dashed: '0', endArrow: 'block', endFill: '1'}),
  message: Object.freeze({strokeColor: '#047857', strokeWidth: '4', dashed: '1', dashPattern: '12 8', endArrow: 'block', endFill: '1'}),
  'technical-route': Object.freeze({strokeColor: '#64748B', strokeWidth: '3', dashed: '1', dashPattern: '4 6', endArrow: 'open', endFill: '0'}),
  compensation: Object.freeze({strokeColor: '#9A3412', strokeWidth: '4', dashed: '1', dashPattern: '12 6 3 6', endArrow: 'block', endFill: '1'}),
});
const LEGEND_INVENTORY = Object.freeze([
  ['business-call', 'legend-key-business-call', 'legend-caption-business-call', '业务调用｜实线闭合箭头', [80, 4170, 130, 4170, 180, 4170], [232, 4147, 396, 46.8]],
  ['message', 'legend-key-message', 'legend-caption-message', '消息｜长虚线闭合箭头', [650, 4170, 700, 4170, 750, 4170], [820, 4147, 360, 46.8]],
  ['technical-route', 'legend-key-technical-route', 'legend-caption-technical-route', '技术路由｜短虚线开放箭头', [1220, 4170, 1270, 4170, 1320, 4170], [1374, 4147, 432, 46.8]],
  ['compensation', 'legend-key-compensation', 'legend-caption-compensation', '补偿｜点划线闭合箭头', [1810, 4170, 1860, 4170, 1910, 4170], [1970, 4147, 360, 46.8]],
]);
const CONNECTOR_INVENTORY = Object.freeze([
  ['soa-submit-order', 'soa-client', 'soa-orchestrator', 'business-call', '提交订单'],
  ['soa-reserve-inventory', 'soa-orchestrator', 'soa-inventory-contract', 'business-call', '预留库存'],
  ['soa-authorize-payment', 'soa-orchestrator', 'soa-payment-contract', 'business-call', '支付授权'],
  ['soa-confirm-order', 'soa-orchestrator', 'soa-order-contract', 'business-call', '确认订单'],
  ['soa-send-notification', 'soa-orchestrator', 'soa-notification-contract', 'message', '发送通知'],
  ['soa-release-inventory', 'soa-orchestrator', 'soa-inventory-contract', 'compensation', '释放库存'],
  ['soa-technical-routing', 'soa-integration', 'soa-inventory-contract', 'technical-route', '技术路由与转换'],
  ['microservices-submit-order', 'microservices-client', 'microservices-order-contract', 'business-call', '提交订单'],
  ['microservices-reserve-inventory', 'microservices-order-contract', 'microservices-inventory-contract', 'business-call', '预留库存'],
  ['microservices-authorize-payment', 'microservices-inventory-contract', 'microservices-payment-contract', 'business-call', '支付授权'],
  ['microservices-confirm-order', 'microservices-payment-contract', 'microservices-order-contract', 'message', '确认订单'],
  ['microservices-send-notification', 'microservices-order-contract', 'microservices-notification-contract', 'message', '发送通知'],
  ['microservices-release-inventory', 'microservices-order-contract', 'microservices-inventory-contract', 'compensation', '释放库存'],
]);
const STRUCTURAL_CONNECTOR_INVENTORY = Object.freeze([
  ...['soa', 'microservices'].flatMap((side) => ['order', 'inventory', 'payment', 'notification'].flatMap((name) => {
    const owner = `${side}-${name}-${side === 'soa' ? 'system' : 'service'}`;
    return [
      [`${side}-${name}-contract-owner`, `${side}-${name}-contract`, owner, 'contract-owner'],
      [`${side}-${name}-owner-store`, owner, `${side}-${name}-store`, 'owner-store'],
    ];
  })),
  ['soa-orchestrator-process-state', 'soa-orchestrator', 'soa-process-state', 'workflow-state'],
  ['microservices-order-workflow', 'microservices-order-service', 'microservices-workflow', 'workflow-owner'],
  ['microservices-workflow-state', 'microservices-workflow', 'microservices-workflow-state', 'workflow-state'],
]);
const MEASURED_NODE_IDS = Object.freeze([
  'soa-orchestrator', 'soa-process-state', 'soa-integration', 'soa-order-system', 'soa-order-store',
  'microservices-workflow', 'microservices-workflow-state', 'microservices-order-service', 'microservices-order-store', 'microservices-platform',
]);
const CONTRACT_TITLES = Object.freeze({
  order: '订单合同', inventory: '库存合同', payment: '支付合同', notification: '通知合同',
});
const PARTICIPANT_GRID = Object.freeze({
  order: Object.freeze({column: 0, row: 0}), inventory: Object.freeze({column: 1, row: 0}),
  payment: Object.freeze({column: 0, row: 1}), notification: Object.freeze({column: 1, row: 1}),
});
const PARTICIPANT_NAMES = ['订单', '库存', '支付', '通知'];
const FULFILLMENT_STEPS = ['提交订单', '预留库存', '支付授权', '确认订单', '发送通知', '释放库存'];
const BUSINESS_AUTHORITIES = Object.freeze([
  ...['订单', '库存', '支付', '通知'].map((name) => `${name}权威状态`),
  ...['订单', '库存', '支付', '通知'].map((name) => `${name}私有权威状态`),
]);
const NON_OWNERSHIP_LABELS = Object.freeze([
  ['soa-integration', '集成层不拥有业务状态'],
  ['microservices-platform', '共享平台不拥有业务决定'],
]);
const ILLUSTRATION = Object.freeze({
  canonical_locator: '/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg',
  transport_locator: '/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg',
  source_kind: 'original-illustration', tier: 'primary', allowed_evidence_roles: ['illustration'],
  license: 'LicenseRef-Atlas-Original',
  license_scope: 'The named project-authored sty-07-soa-microservices-order-fulfillment.svg asset only',
  license_evidence_url: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg',
  license_evidence_note: 'The project-authored Draw.io/SVG pair contains no third-party topology, reference image, brand visual, signature, watermark, or copied composition.',
  copyright_policy: 'original-atlas',
  usage_boundary: 'Original teaching comparison of classic SOA and microservices order fulfillment; illustration-only and not evidence of a mandatory ESB topology or production outcomes.',
});
const ILLUSTRATION_CITATION = Object.freeze({
  citation_url: ILLUSTRATION.canonical_locator, roles: ['illustration'], manifest_primary: false,
  usage_mode: 'original-illustration',
  attribution_note: '经典 SOA 与微服务的订单履约机制对照板，Tego Arch maintainers',
  modification_note: 'Created as an original synchronized Draw.io/SVG pair without third-party topology, reference imagery, brand visuals, signatures, watermarks, or copied composition.',
  excerpt: null, quotation_reviewed: false,
});

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
function inventoryRows(source) {
  return source.split(/\r?\n/u).filter((line) => line.startsWith('| ')).map((line) =>
    line.slice(2, -2).split(' | ').map((cell) => cell.trim()));
}
export function assertRemoteSourceContracts(ledger, inventorySource) {
  const document = ledger.documents[ARTICLE]; assert.ok(document, `${ARTICLE} governed document`);
  const remoteIds = SOURCE_IDS.slice(0, -1);
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1, 'exactly one remote primary');
  assert.equal(document.citations.find(({manifest_primary}) => manifest_primary)?.source_id, remoteIds[0], 'OASIS RM is primary');
  const rows = inventoryRows(inventorySource);
  for (const id of remoteIds) {
    const expected = REMOTE_SOURCE_CONTRACTS[id]; const source = ledger.sources.find((entry) => entry.id === id);
    const citation = document.citations.find((entry) => entry.source_id === id); assert.ok(source && citation, `${id} source and citation`);
    for (const field of ['canonical_locator', 'transport_locator', 'source_kind', 'license', 'copyright_policy']) {
      assert.equal(source[field], expected[field], `${id}.${field}`);
    }
    assert.deepEqual(source.allowed_evidence_roles, expected.allowed_evidence_roles, `${id} exact allowed evidence roles`);
    assert.equal(source.license_evidence_note, expected.license_evidence_note, `${id} conservative/evidenced license note`);
    assert.equal(citation.citation_url, expected.canonical_locator, `${id} citation canonical locator`);
    assert.deepEqual(citation.roles, expected.citation_roles, `${id} exact citation roles`);
    assert.equal(citation.manifest_primary, expected.manifest_primary, `${id} exact primary flag`);
    assert.equal(citation.usage_mode, 'facts-summary', `${id} facts-summary only`);
    const inventory = rows.find(([family]) => family === expected.canonical_locator); assert.ok(inventory, `${id} inventory identity`);
    assert.equal(inventory[1], expected.canonical_locator, `${id} inventory governed current URL`);
    assert.equal(inventory[4], expected.license_evidence_note, `${id} inventory evidence note`);
    assert.equal(inventory[6], expected.license, `${id} inventory license`);
  }
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
  assert.doesNotMatch(source, /(?:构成|形成|属于|(?<!不)是)(?:一条|一个|同一)?成熟度阶梯/u, 'comparison cannot fabricate a maturity ladder');
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
  const elements = []; const stack = [];
  for (const match of source.matchAll(/<\/?([A-Za-z][\w:-]*)\b([^>]*)>/gu)) {
    const closing = match[0].startsWith('</'); const name = match[1];
    if (closing) { if (stack.at(-1)?.name === name) stack.pop(); continue; }
    const element = {name, attributes: attrs(match[2]), index: elements.length, tag: match[0], parent: stack.at(-1) ?? null}; elements.push(element);
    if (!match[0].endsWith('/>') && !['path', 'rect'].includes(name)) stack.push(element);
  }
  return {elements, nodes: elements.filter(({attributes}) => attributes.has('data-node-id')),
    edges: elements.filter(({attributes}) => attributes.has('data-edge-id'))};
}
function cssDeclarations(source) { return new Map(source.split(';').map((item) => item.trim()).filter(Boolean).map((declaration) => {
  const split = declaration.indexOf(':'); return [declaration.slice(0, split).trim(), declaration.slice(split + 1).trim()];
})); }
function styleRules(source) {
  const rules = []; let order = 0;
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      for (const selector of selectors.split(',').map((value) => value.trim())) rules.push({selector, declarations: cssDeclarations(declarations), order: order++, specificity: selectorSpecificity(selector)});
    }
  }
  return rules;
}
function selectorSpecificity(selector) { return [(selector.match(/#[\w-]+/gu) ?? []).length, (selector.match(/\.[\w-]+|\[[^\]]+\]/gu) ?? []).length, selector.split(/\s+|>/u).filter((part) => /^[A-Za-z][\w-]*/u.test(part)).length]; }
function compareSpecificity(left, right) { return left[0] - right[0] || left[1] - right[1] || left[2] - right[2]; }
function simpleSelectorMatches(element, selector) {
  const trimmed = selector.trim();
  if (!trimmed || /[>+~]/u.test(trimmed)) return false;
  const id = trimmed.match(/#([\w-]+)/u)?.[1];
  const classes = [...trimmed.matchAll(/\.([\w-]+)/gu)].map((match) => match[1]);
  const tag = trimmed.match(/^[A-Za-z][\w-]*/u)?.[0];
  const attributes = [...trimmed.matchAll(/\[([\w:-]+)(?:="([^"]*)")?\]/gu)];
  return (!tag || element.name === tag) && (!id || element.attributes.get('id') === id) && classes.every((value) => (element.attributes.get('class') ?? '').split(/\s+/u).includes(value)) && attributes.every(([, key, value]) => element.attributes.has(key) && (value === undefined || element.attributes.get(key) === value));
}
function selectorMatches(element, selector) {
  const parts = selector.trim().replace(/\s*>\s*/gu, ' > ').split(/\s+/u).filter(Boolean);
  let candidate = element; let cursor = parts.length - 1;
  if (!simpleSelectorMatches(candidate, parts[cursor])) return false; cursor -= 1;
  while (cursor >= 0) {
    if (parts[cursor] === '>') { candidate = candidate.parent; if (!candidate || !simpleSelectorMatches(candidate, parts[cursor - 1])) return false; cursor -= 2; }
    else { candidate = candidate.parent; while (candidate && !simpleSelectorMatches(candidate, parts[cursor])) candidate = candidate.parent; if (!candidate) return false; cursor -= 1; }
  }
  return true;
}
function ownSvgPresentationValue(source, element, property) {
  let winner = element.attributes.has(property) ? {precedence: 0, order: -1, specificity: [0, 0, 0], value: element.attributes.get(property)} : null;
  for (const rule of styleRules(source)) {
    const raw = rule.declarations.get(property); if (raw === undefined || !selectorMatches(element, rule.selector)) continue;
    const candidate = {...rule, precedence: /\s*!important\s*$/iu.test(raw) ? 2 : 0, value: raw.replace(/\s*!important\s*$/iu, '').trim()};
    if (!winner || candidate.precedence > winner.precedence || (candidate.precedence === winner.precedence && (compareSpecificity(candidate.specificity, winner.specificity) > 0 || (compareSpecificity(candidate.specificity, winner.specificity) === 0 && candidate.order > winner.order)))) winner = candidate;
  }
  const inline = cssDeclarations(element.attributes.get('style') ?? '').get(property);
  if (inline !== undefined) { const candidate = {precedence: /\s*!important\s*$/iu.test(inline) ? 3 : 1, value: inline.replace(/\s*!important\s*$/iu, '').trim()}; if (!winner || candidate.precedence >= winner.precedence) winner = candidate; }
  return winner?.value;
}
export function svgPresentationValue(source, element, property) {
  for (let candidate = element; candidate; candidate = candidate.parent) { const value = ownSvgPresentationValue(source, candidate, property); if (value !== undefined) return value; }
  return undefined;
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
function paintOpacity(source, element, kind) { let opacity = 1; for (let candidate = element; candidate; candidate = candidate.parent) for (const property of ['opacity', `${kind}-opacity`]) { const value = ownSvgPresentationValue(source, candidate, property); if (value !== undefined) opacity *= Number(value); } assert.ok(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1, 'valid effective opacity'); return opacity; }
function blendHex(foreground, background, opacity) { const channels = (value) => value.match(/[\da-f]{2}/giu).map((entry) => Number.parseInt(entry, 16)); const left = channels(foreground); const right = channels(background); return `#${left.map((value, index) => Math.round(value * opacity + right[index] * (1 - opacity)).toString(16).padStart(2, '0')).join('')}`; }
function luminance(color) { const rgb = color.match(/[\da-f]{2}/giu).map((entry) => Number.parseInt(entry, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4); return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722; }
function contrastRatio(left, right) { const [light, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a); return (light + .05) / (dark + .05); }
function elementText(source, element) { return decodeXmlText(source.match(new RegExp(`${escapeRegExp(element.tag)}([^<]*)<\/${element.name}>`, 'u'))?.[1] ?? '').trim(); }
function labelBox(source, element, label = elementText(source, element)) {
  const fontSize = Number.parseFloat(svgPresentationValue(source, element, 'font-size')); const x = Number(element.attributes.get('x')); const y = Number(element.attributes.get('y'));
  const width = [...label].reduce((sum, character) => sum + (/^[\u0000-\u00FF]$/u.test(character) ? .62 : 1), 0) * fontSize;
  const anchor = svgPresentationValue(source, element, 'text-anchor') ?? 'start'; const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return {left, right: left + width, top: y - fontSize, bottom: y + fontSize * .3};
}
function rectangleFromElement(element) { const bounds = numericBounds(element.attributes); return {left: bounds.x, right: bounds.x + bounds.width, top: bounds.y, bottom: bounds.y + bounds.height}; }
function rectangleDistance(left, right) { const dx = Math.max(left.left - right.right, right.left - left.right, 0); const dy = Math.max(left.top - right.bottom, right.top - left.bottom, 0); return Math.hypot(dx, dy); }
function rectangleAxisClearance(left, right) { return {horizontal: Math.max(left.left - right.right, right.left - left.right, 0), vertical: Math.max(left.top - right.bottom, right.top - left.bottom, 0)}; }
function pointRectangleDistance(point, rectangle) { return Math.hypot(Math.max(rectangle.left - point.x, 0, point.x - rectangle.right), Math.max(rectangle.top - point.y, 0, point.y - rectangle.bottom)); }
function markerBounds(points) { return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function markerGeometry(source, path, points) {
  const markerId = svgPresentationValue(source, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${path.attributes.get('data-edge-id') ?? path.attributes.get('data-structural-edge-id') ?? path.attributes.get('data-legend-key')} marker`);
  const elements = parseSvg(source).elements; const marker = elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const shape = elements.find(({name, parent}) => name === 'path' && parent === marker);
  assert.ok(marker && shape, `${markerId} actual marker shape`); const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.equal(viewBox.length, 4, `${markerId} marker viewBox`);
  const width = Number(marker.attributes.get('markerWidth')); const height = Number(marker.attributes.get('markerHeight')); assert.ok(width > 0 && height > 0 && width <= 16 && height <= 16, `${markerId} bounded dimensions`);
  const endpoint = points.at(-1); const previous = points.at(-2); const magnitude = Math.hypot(endpoint.x - previous.x, endpoint.y - previous.y); assert.ok(magnitude > 0, `${markerId} terminal segment`);
  const axis = {x: (endpoint.x - previous.x) / magnitude, y: (endpoint.y - previous.y) / magnitude}; const perpendicular = {x: -axis.y, y: axis.x};
  const unit = marker.attributes.get('markerUnits') === 'userSpaceOnUse' ? 1 : Number(svgPresentationValue(source, path, 'stroke-width')); const refX = Number(marker.attributes.get('refX')); const refY = Number(marker.attributes.get('refY'));
  const values = (shape.attributes.get('d')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number); const result = [];
  for (let index = 0; index < values.length; index += 2) { const localX = (values[index] - refX) * width / viewBox[2] * unit; const localY = (values[index + 1] - refY) * height / viewBox[3] * unit; result.push({x: endpoint.x + axis.x * localX + perpendicular.x * localY, y: endpoint.y + axis.y * localX + perpendicular.y * localY}); }
  assert.ok(result.length >= 3 && result.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), `${markerId} physical marker geometry`); return result;
}
function nodeShape(elements, group) { return elements.find((element) => ['rect', 'path'].includes(element.name) && element.parent === group && element.attributes.has('data-shape')); }
function routeBoundsCollision(points, rectangle, stroke = 0) {
  const expanded = {left: rectangle.left - stroke / 2, right: rectangle.right + stroke / 2, top: rectangle.top - stroke / 2, bottom: rectangle.bottom + stroke / 2};
  return points.slice(1).some((point, index) => segmentDistance(points[index], point, expanded) === 0);
}
function assertStructuralOwnership(drawio, svg, source) {
  const actual = drawio.edges.filter(({attributes}) => attributes.get('dataRole')?.startsWith('structural-')).map((edge) => [edge.attributes.get('id'), edge.attributes.get('source'), edge.attributes.get('target'), edge.attributes.get('dataRole').slice('structural-'.length)]);
  assert.deepEqual(actual, STRUCTURAL_CONNECTOR_INVENTORY, 'exact structural ownership inventory');
  assert.deepEqual(svg.elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-structural-edge-id')).map(({attributes}) => attributes.get('data-structural-edge-id')), STRUCTURAL_CONNECTOR_INVENTORY.map(([id]) => id), 'exact SVG structural ownership inventory');
  for (const [id, sourceId, targetId, role] of STRUCTURAL_CONNECTOR_INVENTORY) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('id') === id); assert.ok(edge, `Draw.io structural edge ${id}`); drawioRoute(drawio, edge);
    const path = svg.elements.find(({name, attributes}) => name === 'path' && attributes.get('data-structural-edge-id') === id); assert.ok(path, `SVG structural edge ${id}`);
    assert.deepEqual([path.attributes.get('data-source'), path.attributes.get('data-target'), path.attributes.get('data-role')], [sourceId, targetId, role], `${id} structural topology`);
    assert.deepEqual(parsePathPoints(path.attributes.get('d')), drawioRoute(drawio, edge), `${id} structural route parity`);
    const style = drawioStyle(edge); assert.equal(svgPresentationValue(source, path, 'stroke'), style.get('strokeColor'), `${id} structural stroke`);
    assert.equal(Number(svgPresentationValue(source, path, 'stroke-width')), Number(style.get('strokeWidth')), `${id} structural stroke width`);
    assert.equal(svgPresentationValue(source, path, 'stroke-dasharray') ?? '', style.get('dashed') === '1' ? style.get('dashPattern') : '', `${id} structural dash`);
    const markerId = svgPresentationValue(source, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${id} structural marker`);
    const marker = svg.elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const markerPath = svg.elements.find(({name, parent}) => name === 'path' && parent === marker);
    assert.ok(marker && markerPath, `${id} structural marker definition`); assert.equal(style.get('endArrow'), 'open', `${id} structural endArrow`);
    assert.equal(svgPresentationValue(source, markerPath, 'fill'), style.get('endFill') === '0' ? 'none' : style.get('strokeColor'), `${id} structural marker fill`);
    assert.equal(svgPresentationValue(source, markerPath, 'stroke'), style.get('strokeColor'), `${id} structural marker stroke`);
  }
  for (const side of ['soa', 'microservices']) for (const name of ['order', 'inventory', 'payment', 'notification']) {
    const owner = `${side}-${name}-${side === 'soa' ? 'system' : 'service'}`;
    assert.ok(STRUCTURAL_CONNECTOR_INVENTORY.some(([, sourceId, targetId, role]) => sourceId === `${side}-${name}-contract` && targetId === owner && role === 'contract-owner'), `${side}-${name} contract reaches owner`);
    assert.ok(STRUCTURAL_CONNECTOR_INVENTORY.some(([, sourceId, targetId, role]) => sourceId === owner && targetId === `${side}-${name}-store` && role === 'owner-store'), `${side}-${name} owner reaches store`);
  }
  assert.match(source, /data-node-id="microservices-workflow"[\s\S]*?履约协调/u, 'microservices workflow coordination visible');
  assert.match(source, /data-node-id="microservices-workflow-state"[\s\S]*?履约流程状态/u, 'microservices workflow state visible');
}
function assertLegendParity(drawio, svg, source) {
  const drawioKeys = drawio.edges.filter(({attributes}) => attributes.get('dataRole') === 'legend-key');
  const drawioCaptions = drawio.nodes.filter(({attributes}) => attributes.get('dataRole') === 'legend-caption');
  const drawioAnchors = drawio.nodes.filter(({attributes}) => attributes.get('dataRole') === 'legend-anchor');
  const svgKeys = svg.elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-legend-key'));
  const svgCaptions = svg.elements.filter(({name, attributes}) => name === 'text' && attributes.has('data-legend-for'));
  assert.deepEqual(drawioKeys.map(({attributes}) => attributes.get('id')), LEGEND_INVENTORY.map(([, keyId]) => keyId), 'exact Draw.io legend key inventory');
  assert.deepEqual(drawioCaptions.map(({attributes}) => attributes.get('id')), LEGEND_INVENTORY.map(([, , captionId]) => captionId), 'exact Draw.io legend caption inventory');
  assert.deepEqual(svgKeys.map(({attributes}) => attributes.get('id')), LEGEND_INVENTORY.map(([, keyId]) => keyId), 'exact SVG legend key inventory');
  assert.deepEqual(svgCaptions.map(({attributes}) => attributes.get('id')), LEGEND_INVENTORY.map(([, , captionId]) => captionId), 'exact SVG legend caption inventory');
  assert.deepEqual(drawioAnchors.map(({attributes}) => attributes.get('id')), LEGEND_INVENTORY.flatMap(([role]) => [`legend-anchor-${role}-source`, `legend-anchor-${role}-target`]), 'exact Draw.io legend anchor inventory');
  for (const [role, keyId, captionId, label, route, bounds] of LEGEND_INVENTORY) {
    const key = drawioKeys.find(({attributes}) => attributes.get('id') === keyId); const path = svgKeys.find(({attributes}) => attributes.get('id') === keyId);
    const caption = drawioCaptions.find(({attributes}) => attributes.get('id') === captionId); const text = svgCaptions.find(({attributes}) => attributes.get('id') === captionId);
    assert.ok(key && path && caption && text, `${role} paired legend structure`);
    const sourceId = `legend-anchor-${role}-source`; const targetId = `legend-anchor-${role}-target`; assert.equal(key.attributes.get('source'), sourceId, `${role} legend source terminal`); assert.equal(key.attributes.get('target'), targetId, `${role} legend target terminal`);
    for (const [id, expectedX] of [[sourceId, route[0] - 1], [targetId, route.at(-2)]]) { const anchor = drawioAnchors.find(({attributes}) => attributes.get('id') === id); assert.ok(anchor, `${id} anchor`); assert.equal(anchor.attributes.get('legendFor'), role, `${id} role`); assert.deepEqual(numericBounds(anchor.geometry), {x: expectedX, y: route[1] - 1, width: 1, height: 2}, `${id} minimal geometry`); const anchorStyle = drawioStyle(anchor); assert.equal(anchorStyle.get('opacity'), '0', `${id} invisible`); assert.equal(anchorStyle.get('fillColor'), 'none', `${id} no fill`); assert.equal(anchorStyle.get('strokeColor'), 'none', `${id} no stroke`); }
    assert.equal(key.attributes.get('legendFor'), role, `${role} Draw.io key role`); assert.equal(path.attributes.get('data-legend-key'), role, `${role} SVG key role`); assert.equal(path.attributes.get('data-role'), key.attributes.get('dataRole'), `${role} key data role parity`);
    assert.equal(caption.attributes.get('legendFor'), role, `${role} Draw.io caption role`); assert.equal(text.attributes.get('data-legend-for'), role, `${role} SVG caption role`); assert.equal(text.attributes.get('data-role'), caption.attributes.get('dataRole'), `${role} caption data role parity`);
    assert.deepEqual(drawioRoute(drawio, key).flatMap(({x, y}) => [x, y]), route, `${role} Draw.io key route`); assert.deepEqual(parsePathPoints(path.attributes.get('d')).flatMap(({x, y}) => [x, y]), route, `${role} SVG key route`);
    assert.equal(caption.label, label, `${role} Draw.io caption label`); assert.equal(elementText(source, text), label, `${role} SVG caption label`);
    const geometry = numericBounds(caption.geometry); assert.deepEqual([geometry.x, geometry.y, geometry.width, geometry.height], bounds, `${role} Draw.io caption bounds`);
    const actualBounds = labelBox(source, text); const round = (value) => Math.round(value * 1e6) / 1e6; assert.deepEqual([actualBounds.left, actualBounds.top, actualBounds.right - actualBounds.left, actualBounds.bottom - actualBounds.top].map(round), bounds, `${role} actual SVG caption bounds`);
    assert.equal(text.attributes.get('data-label-bounds'), `${bounds[0]} ${bounds[1]} ${bounds[0] + bounds[2]} ${bounds[1] + bounds[3]}`, `${role} SVG caption declared bounds`);
    const style = drawioStyle(key); for (const [property, expected] of Object.entries(CONNECTOR_STYLES[role])) assert.equal(style.get(property), expected, `${role} Draw.io legend ${property}`);
    assert.equal(svgPresentationValue(source, path, 'stroke'), style.get('strokeColor'), `${role} legend stroke`); assert.equal(Number(svgPresentationValue(source, path, 'stroke-width')), Number(style.get('strokeWidth')), `${role} legend stroke width`);
    assert.equal(svgPresentationValue(source, path, 'stroke-dasharray') ?? '', style.get('dashed') === '1' ? style.get('dashPattern') : '', `${role} legend dash`);
    const markerId = svgPresentationValue(source, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; const marker = svg.elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const markerPath = svg.elements.find(({name, parent}) => name === 'path' && parent === marker);
    assert.ok(marker && markerPath, `${role} legend marker`); assert.equal(markerPath.attributes.get('d'), style.get('endArrow') === 'open' ? 'M 1 1 L 9 5 L 1 9' : 'M 0 0 L 10 5 L 0 10 Z', `${role} legend endArrow shape`); assert.equal(svgPresentationValue(source, markerPath, 'fill'), style.get('endFill') === '0' ? 'none' : style.get('strokeColor'), `${role} legend marker fill`); assert.equal(svgPresentationValue(source, markerPath, 'stroke'), style.get('strokeColor'), `${role} legend marker stroke`);
    const textStyle = drawioStyle(caption); assert.equal(svgPresentationValue(source, text, 'fill'), textStyle.get('fontColor'), `${role} legend caption color`); assert.equal(Number.parseFloat(svgPresentationValue(source, text, 'font-size')), Number(textStyle.get('fontSize')), `${role} legend caption font size`); assert.equal(svgPresentationValue(source, text, 'font-weight'), textStyle.get('fontStyle') === '1' ? '700' : '400', `${role} legend caption font weight`);
  }
}
function assertNodeParity(drawio, svg, source) {
  for (const id of DIAGRAM_NODES) {
    const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id); const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id); assert.ok(node && group, `${id} paired node`);
    const texts = svg.elements.filter(({name, parent, attributes}) => name === 'text' && parent === group && attributes.has('data-text-role'));
    assert.equal(texts.map((element) => elementText(source, element)).join('｜'), node.label, `${id} normalized visible label parity`);
    assert.equal(group.attributes.get('data-role'), node.attributes.get('dataRole'), `${id} role parity`);
    const shape = nodeShape(svg.elements, group); assert.ok(shape, `${id} visible shape`); const style = drawioStyle(node);
    assert.equal(shape.attributes.get('data-shape'), node.attributes.get('dataShape'), `${id} shape parity`);
    assert.equal(svgPresentationValue(source, shape, 'fill'), style.get('fillColor'), `${id} fill parity`);
    assert.equal(svgPresentationValue(source, shape, 'stroke'), style.get('strokeColor'), `${id} stroke parity`);
    const title = texts.find(({attributes}) => attributes.get('data-text-role') === 'title'); assert.ok(title, `${id} title`);
    assert.equal(Number.parseFloat(svgPresentationValue(source, title, 'font-size')), Number(node.attributes.get('dataTitleFont')), `${id} title font parity`);
  }
}
function assertParticipantGrid(drawio, svg, source, scale) {
  const get = (id) => {
    const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id);
    const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id);
    const shape = nodeShape(svg.elements, group);
    assert.ok(node && group && shape, `${id} participant-grid node`);
    return {node, group, shape, bounds: rectangleFromElement(shape)};
  };
  const textBoxes = (entry) => svg.elements.filter(({name, parent, attributes}) => name === 'text' && parent === entry.group && attributes.has('data-text-role')).map((element) => labelBox(source, element));
  for (const side of ['soa', 'microservices']) {
    const suffix = side === 'soa' ? 'system' : 'service';
    const entries = Object.fromEntries(Object.keys(PARTICIPANT_GRID).map((name) => [name, {
      contract: get(`${side}-${name}-contract`), owner: get(`${side}-${name}-${suffix}`), store: get(`${side}-${name}-store`),
    }]));
    for (const [name, position] of Object.entries(PARTICIPANT_GRID)) {
      const entry = entries[name];
      assert.equal(entry.contract.node.label, CONTRACT_TITLES[name], `${side}-${name} exact contract title`);
      assert.equal(textBoxes(entry.contract).length, 1, `${side}-${name} one-line contract title`);
      const contractText = textBoxes(entry.contract)[0]; const stroke = Number(svgPresentationValue(source, entry.contract.shape, 'stroke-width') ?? 0) / 2;
      assert.ok(Math.min(contractText.left - entry.contract.bounds.left - stroke, entry.contract.bounds.right - stroke - contractText.right) * scale >= 16, `${side}-${name} contract horizontal padding`);
      assert.ok(Math.min(contractText.top - entry.contract.bounds.top - stroke, entry.contract.bounds.bottom - stroke - contractText.bottom) * scale >= 14, `${side}-${name} contract vertical padding`);
      assert.ok(entry.contract.bounds.bottom < entry.owner.bounds.top && entry.owner.bounds.bottom < entry.store.bounds.top, `${side}-${name} stacks contract owner store`);
      const center = (bounds) => ({x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2});
      for (const layer of ['contract', 'owner', 'store']) assert.ok(Math.abs(center(entry[layer].bounds).x - center(entry.contract.bounds).x) <= 1, `${side}-${name} ${layer} shares participant column`);
      const expected = position;
      for (const [otherName, otherPosition] of Object.entries(PARTICIPANT_GRID)) {
        if (name === otherName) continue;
        if (expected.row === otherPosition.row && expected.column < otherPosition.column) assert.ok(entry.contract.bounds.right < entries[otherName].contract.bounds.left, `${side} ${name}/${otherName} contract columns separated`);
        if (expected.column === otherPosition.column && expected.row < otherPosition.row) assert.ok(entry.store.bounds.bottom < entries[otherName].contract.bounds.top, `${side} ${name}/${otherName} participant rows separated`);
      }
      const storeTexts = svg.elements.filter(({name: tag, parent, attributes}) => tag === 'text' && parent === entry.store.group && attributes.has('data-text-role'));
      assert.equal(storeTexts.length, 2, `${side}-${name} store uses two visible lines`);
      assert.equal(elementText(source, storeTexts[0]), PARTICIPANT_NAMES[Object.keys(PARTICIPANT_GRID).indexOf(name)], `${side}-${name} store participant line`);
      assert.equal(elementText(source, storeTexts[1]), side === 'soa' ? '权威状态' : '私有权威状态', `${side}-${name} store authority line`);
      assert.equal(entry.store.shape.attributes.get('data-shape'), 'cylinder', `${side}-${name} store cylinder parity`);
    }
    for (const layer of ['contract', 'store']) {
      const boxes = Object.entries(entries).map(([name, entry]) => ({name, bounds: entry[layer].bounds, text: textBoxes(entry[layer])}));
      for (let left = 0; left < boxes.length; left += 1) for (let right = left + 1; right < boxes.length; right += 1) {
        const clearance = rectangleAxisClearance(boxes[left].bounds, boxes[right].bounds);
        assert.ok(Math.max(clearance.horizontal, clearance.vertical) * scale >= 20, `${side} sibling ${layer} boxes clear ${boxes[left].name}/${boxes[right].name}`);
        for (const leftText of boxes[left].text) for (const rightText of boxes[right].text) assert.ok(rectangleDistance(leftText, rightText) * scale >= 20, `${side} sibling ${layer} visible text clear ${boxes[left].name}/${boxes[right].name}`);
      }
    }
  }
  const labels = svg.elements.filter(({name, attributes}) => name === 'text' && ['soa-submit-order', 'microservices-submit-order'].includes(attributes.get('data-edge-id')));
  for (const label of labels) {
    const side = label.attributes.get('data-edge-id').startsWith('soa-') ? 'soa' : 'microservices'; const requester = get(`${side}-client`);
    assert.ok(rectangleDistance(labelBox(source, label), requester.bounds) * scale >= 20, `${side} submit label clears requester`);
  }
}
function typographyMetrics(svg, source, scale) {
  const values = {horizontal: Infinity, top: Infinity, bottom: Infinity, baseline: Infinity};
  for (const id of MEASURED_NODE_IDS) {
    const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id); const shape = nodeShape(svg.elements, group); assert.ok(group && shape, `${id} measured node`); const bounds = rectangleFromElement(shape); const stroke = Number(svgPresentationValue(source, shape, 'stroke-width') ?? 0);
    const texts = svg.elements.filter(({name, parent, attributes}) => name === 'text' && parent === group && attributes.has('data-text-role'));
    const boxes = texts.map((element) => ({element, box: labelBox(source, element)}));
    for (const {element, box} of boxes) {
      assert.ok(Number.parseFloat(svgPresentationValue(source, element, 'font-size')) * scale >= (element.attributes.get('data-text-role') === 'title' ? 15 : 10), `${id} final text size`);
      values.horizontal = Math.min(values.horizontal, (box.left - bounds.left - stroke / 2) * scale, (bounds.right - stroke / 2 - box.right) * scale);
      values.top = Math.min(values.top, (box.top - bounds.top - stroke / 2) * scale); values.bottom = Math.min(values.bottom, (bounds.bottom - stroke / 2 - box.bottom) * scale);
    }
    const title = texts.find(({attributes}) => attributes.get('data-text-role') === 'title'); const type = texts.find(({attributes}) => attributes.get('data-text-role') === 'type');
    if (type) values.baseline = Math.min(values.baseline, (Number(type.attributes.get('y')) - Number(title.attributes.get('y'))) * scale);
  }
  assert.ok(values.horizontal >= 16, `exact node horizontal padding ${values.horizontal}`); assert.ok(values.top >= 14, `exact node top clearance ${values.top}`); assert.ok(values.bottom >= 14, `exact node bottom clearance ${values.bottom}`); assert.ok(values.baseline >= 22, `exact title/type baseline gap ${values.baseline}`);
  return values;
}
function localBackground(source, label) {
  const point = {x: Number(label.attributes.get('x')), y: Number(label.attributes.get('y'))}; const paints = parseSvg(source).elements.filter((element) => element.name === 'rect' && element.index < label.index && !/^(?:canvas|background)$/u.test(element.attributes.get('id') ?? '')).filter((element) => {
    const rectangle = rectangleFromElement(element); return point.x >= rectangle.left && point.x <= rectangle.right && point.y >= rectangle.top && point.y <= rectangle.bottom;
  }).map((element) => ({color: svgPresentationValue(source, element, 'fill'), opacity: paintOpacity(source, element, 'fill'), index: element.index})).filter(({color}) => color && color !== 'none').sort((left, right) => left.index - right.index);
  const canvas = parseSvg(source).elements.find(({attributes}) => /^(?:canvas|background)$/u.test(attributes.get('id') ?? '')); const base = canvas ? blendHex(svgPresentationValue(source, canvas, 'fill'), '#FFFFFF', paintOpacity(source, canvas, 'fill')) : '#FFFFFF';
  return paints.reduce((background, paint) => blendHex(paint.color, background, paint.opacity), base);
}
function assertPhysicalGeometry(source, scale, enforceLabelAttachment = true) {
  const elements = parseSvg(source).elements; const paths = elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-edge-id')); const labels = elements.filter(({name, attributes}) => name === 'text' && attributes.has('data-edge-id'));
  const allPaths = elements.filter(({name, attributes}) => name === 'path' && (attributes.has('data-edge-id') || attributes.has('data-structural-edge-id') || attributes.has('data-legend-key')));
  const connectors = allPaths.map((path) => ({path, id: path.attributes.get('data-edge-id') ?? path.attributes.get('data-structural-edge-id') ?? `legend-${path.attributes.get('data-legend-key')}`, points: parsePathPoints(path.attributes.get('d')), markers: markerGeometry(source, path, parsePathPoints(path.attributes.get('d')))}));
  const nodeShapes = elements.filter(({name, parent}) => name === 'rect' && parent?.attributes.has('data-node-id')).map((shape) => ({id: shape.parent.attributes.get('data-node-id'), rectangle: rectangleFromElement(shape), stroke: Number(svgPresentationValue(source, shape, 'stroke-width') ?? 0)}));
  const boundaries = nodeShapes.filter(({id}) => ['soa-boundary', 'microservices-boundary', 'comparison-axis', 'legend-band'].includes(id));
  for (const connector of connectors) {
    const sourceId = connector.path.attributes.get('data-source'); const targetId = connector.path.attributes.get('data-target'); const id = connector.id;
    for (const node of nodeShapes.filter(({id: nodeId}) => ![sourceId, targetId, 'comparison-canvas', 'legend-band', 'soa-boundary', 'microservices-boundary', 'comparison-axis'].includes(nodeId))) {
      const envelope = {left: node.rectangle.left - node.stroke / 2, right: node.rectangle.right + node.stroke / 2, top: node.rectangle.top - node.stroke / 2, bottom: node.rectangle.bottom + node.stroke / 2};
      assert.equal(routeBoundsCollision(connector.points, node.rectangle, node.stroke), false, `${id} connector clears foreign node ${node.id}`);
      assert.ok(rectangleDistance(markerBounds(connector.markers), envelope) > 0, `${id} marker clears foreign node envelope ${node.id}`);
    }
    for (const boundary of boundaries) {
      const stroke = boundary.stroke; const strips = [
        {left: boundary.rectangle.left - stroke / 2, right: boundary.rectangle.left + stroke / 2, top: boundary.rectangle.top - stroke / 2, bottom: boundary.rectangle.bottom + stroke / 2},
        {left: boundary.rectangle.right - stroke / 2, right: boundary.rectangle.right + stroke / 2, top: boundary.rectangle.top - stroke / 2, bottom: boundary.rectangle.bottom + stroke / 2},
        {left: boundary.rectangle.left - stroke / 2, right: boundary.rectangle.right + stroke / 2, top: boundary.rectangle.top - stroke / 2, bottom: boundary.rectangle.top + stroke / 2},
        {left: boundary.rectangle.left - stroke / 2, right: boundary.rectangle.right + stroke / 2, top: boundary.rectangle.bottom - stroke / 2, bottom: boundary.rectangle.bottom + stroke / 2},
      ];
      assert.equal(strips.some((strip) => routeBoundsCollision(connector.points, strip)), false, `${id} connector clears boundary stroke ${boundary.id}`);
      assert.equal(strips.some((strip) => rectangleDistance(markerBounds(connector.markers), strip) === 0), false, `${id} marker clears boundary stroke ${boundary.id}`);
    }
  }
  for (const label of labels) {
    const id = label.attributes.get('data-edge-id'); const own = paths.find(({attributes}) => attributes.get('data-edge-id') === id); assert.ok(own, `${id} path`); const bounds = labelBox(source, label);
    assert.equal(label.attributes.get('data-label-bounds'), [bounds.left, bounds.top, bounds.right, bounds.bottom].join(' '), `${id} actual label bounds parity`);
    for (const connector of connectors) for (const point of connector.points.slice(1)) { /* execute parsed geometry before segment loop */ assert.ok(Number.isFinite(point.x)); }
    const connectorGaps = connectors.map(({id: connectorId, points}) => ({id: connectorId, gap: Math.min(...points.slice(1).map((point, index) => segmentDistance(points[index], point, bounds))) * scale}));
    const nearestConnector = connectorGaps.reduce((nearest, candidate) => candidate.gap < nearest.gap ? candidate : nearest); const strokeGap = nearestConnector.gap; assert.ok(strokeGap >= 8, `${id} label to own/foreign connector ${nearestConnector.id} ${strokeGap}`);
    const ownPoints = parsePathPoints(own.attributes.get('d')); const ownGap = Math.min(...ownPoints.slice(1).map((point, index) => segmentDistance(ownPoints[index], point, bounds))) * scale;
    const foreignGap = Math.min(...connectors.filter(({path}) => path !== own).flatMap(({points}) => points.slice(1).map((point, index) => segmentDistance(points[index], point, bounds)))) * scale;
    if (enforceLabelAttachment) { assert.ok(ownGap <= 40, `${id} label remains attached to own route ${ownGap}`); assert.ok(ownGap < foreignGap, `${id} label uniquely nearest own route ${ownGap}/${foreignGap}`); }
    const markerGap = Math.min(...connectors.flatMap(({markers}) => markers.map((point) => pointRectangleDistance(point, bounds)))) * scale; assert.ok(markerGap >= 16, `${id} label to actual own/foreign marker ${markerGap}`);
    for (const node of nodeShapes.filter(({id: nodeId}) => ![own.attributes.get('data-source'), own.attributes.get('data-target')].includes(nodeId) && !['comparison-canvas', 'legend-band', 'soa-boundary', 'microservices-boundary', 'comparison-axis'].includes(nodeId))) assert.ok(rectangleDistance(bounds, {left: node.rectangle.left - node.stroke / 2, right: node.rectangle.right + node.stroke / 2, top: node.rectangle.top - node.stroke / 2, bottom: node.rectangle.bottom + node.stroke / 2}) * scale >= 12, `${id} foreign node ${node.id}`);
    for (const boundary of boundaries) {
      const contained = bounds.left >= boundary.rectangle.left && bounds.right <= boundary.rectangle.right && bounds.top >= boundary.rectangle.top && bounds.bottom <= boundary.rectangle.bottom;
      const gap = contained ? Math.min(bounds.left - boundary.rectangle.left, boundary.rectangle.right - bounds.right, bounds.top - boundary.rectangle.top, boundary.rectangle.bottom - bounds.bottom) - boundary.stroke / 2 : rectangleDistance(bounds, boundary.rectangle) - boundary.stroke / 2;
      assert.ok(gap * scale >= 12, `${id} boundary ${boundary.id}`);
    }
  }
  for (const header of elements.filter(({name, attributes}) => name === 'text' && attributes.has('data-header-for'))) {
    const boundary = nodeShapes.find(({id}) => id === header.attributes.get('data-header-for')); assert.ok(boundary, `${header.attributes.get('data-header-for')} header boundary`); const bounds = labelBox(source, header); const padding = Math.min(bounds.left - boundary.rectangle.left, boundary.rectangle.right - bounds.right, bounds.top - boundary.rectangle.top, boundary.rectangle.bottom - bounds.bottom) - boundary.stroke / 2; assert.ok(padding * scale >= 12, `${boundary.id} header inner-stroke padding`);
  }
  const legends = Object.keys(CONNECTOR_STYLES).map((role) => { const key = elements.find(({name, attributes}) => name === 'path' && attributes.get('data-legend-key') === role); const caption = elements.find(({name, attributes}) => name === 'text' && attributes.get('data-legend-for') === role); assert.ok(key && caption, `${role} legend key/caption`); const points = parsePathPoints(key.attributes.get('d')); return {role, key, caption, bounds: labelBox(source, caption), points, markers: markerGeometry(source, key, points)}; });
  for (const legend of legends) {
    const keyGap = Math.min(...legend.points.slice(1).map((point, index) => segmentDistance(legend.points[index], point, legend.bounds))) * scale; assert.ok(keyGap >= 12, `${legend.role} legend key-caption`);
    assert.ok(Math.min(...legend.markers.map((point) => pointRectangleDistance(point, legend.bounds))) * scale >= 16, `${legend.role} own real marker-caption`);
    for (const foreign of legends.filter(({role}) => role !== legend.role)) assert.ok(Math.min(...foreign.markers.map((point) => pointRectangleDistance(point, legend.bounds))) * scale >= 16, `${legend.role} foreign marker-caption ${foreign.role}`);
  }
}
function assertNoOverdraw(source) {
  const {elements} = parseSvg(source); const paths = elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-edge-id'));
  for (const path of paths) for (const mask of elements.filter(({name, index}) => name === 'rect' && index > path.index)) {
    const fill = svgPresentationValue(source, mask, 'fill'); const opacity = fill && fill !== 'none' ? paintOpacity(source, mask, 'fill') : 0;
    if (opacity > 0) { const bounds = numericBounds(mask.attributes); const points = parsePathPoints(path.attributes.get('d')); assert.ok(!points.slice(1).some((point, index) => segmentDistance(points[index], point, {left: bounds.x, right: bounds.x + bounds.width, top: bounds.y, bottom: bounds.y + bounds.height}) === 0), `${path.attributes.get('data-edge-id')} no later opaque/translucent mask`); }
  }
}
function assertConnectorInventory(drawio, svg, source) {
  const edges = drawio.edges.filter(({attributes}) => !attributes.get('dataRole')?.startsWith('structural-') && attributes.get('dataRole') !== 'legend-key').map((edge) => [edge.attributes.get('id'), edge.attributes.get('source'), edge.attributes.get('target'), edge.attributes.get('dataRole'), edge.label]);
  assert.deepEqual(edges, CONNECTOR_INVENTORY, 'exact stable connector inventory');
  assert.deepEqual(svg.elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-edge-id')).map(({attributes}) => attributes.get('data-edge-id')), CONNECTOR_INVENTORY.map(([id]) => id), 'exact SVG connector inventory');
  for (const [id, sourceId, targetId, role, label] of CONNECTOR_INVENTORY) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('id') === id); const style = drawioStyle(edge);
    for (const [property, expected] of Object.entries(CONNECTOR_STYLES[role])) assert.equal(style.get(property), expected, `${id} ${property}`);
    const path = svg.elements.find(({name, attributes}) => name === 'path' && attributes.get('data-edge-id') === id); assert.ok(path, `${id} SVG connector`);
    assert.deepEqual([path.attributes.get('data-source'), path.attributes.get('data-target'), path.attributes.get('data-role')], [sourceId, targetId, role], `${id} SVG topology`);
    assert.match(source, new RegExp(`<text\\b[^>]*data-edge-id="${escapeRegExp(id)}"[^>]*>${escapeRegExp(label)}<\\/text>`, 'u'), `${id} label`);
  }
  const stepInventory = (prefix) => CONNECTOR_INVENTORY.filter(([id, , , role]) => id.startsWith(prefix) && role !== 'technical-route').map(([, , , , label]) => label);
  assert.deepEqual(stepInventory('soa-'), FULFILLMENT_STEPS, 'SOA fulfillment order'); assert.deepEqual(stepInventory('microservices-'), FULFILLMENT_STEPS, 'microservices fulfillment order');
  assert.ok(CONNECTOR_INVENTORY.filter(([, , , role]) => role !== 'technical-route').some(([, sourceId, targetId]) => sourceId !== 'soa-integration' && targetId !== 'soa-integration'), 'business contracts are not forced through a mandatory ESB center');
  for (const side of ['soa', 'microservices']) for (const [participant, name] of [['order', '订单'], ['inventory', '库存'], ['payment', '支付'], ['notification', '通知']]) {
    const id = `${side}-${participant}-${side === 'soa' ? 'system' : 'service'}`; const group = svg.elements.find(({name: tag, attributes}) => tag === 'g' && attributes.get('data-node-id') === id); assert.ok(group, `${side} ${name} participant`);
    const end = source.indexOf('</g>', source.indexOf(group.tag)); assert.ok(source.slice(source.indexOf(group.tag), end).includes(name), `${side} visibly includes ${name}`);
  }
}
function assertDiagramOwnership(drawio, svg, source) {
  for (const authority of BUSINESS_AUTHORITIES) {
    const drawioNode = drawio.nodes.find(({attributes}) => attributes.get('dataRole') === 'business-authority' && attributes.get('id')?.includes(PARTICIPANT_NAMES.find((name) => authority.startsWith(name)) === '订单' ? 'order' : PARTICIPANT_NAMES.find((name) => authority.startsWith(name)) === '库存' ? 'inventory' : PARTICIPANT_NAMES.find((name) => authority.startsWith(name)) === '支付' ? 'payment' : 'notification') && attributes.get('id')?.startsWith(authority.includes('私有') ? 'microservices-' : 'soa-'));
    assert.equal(drawioNode?.label.replaceAll('｜', ''), authority, `Draw.io business authority ${authority}`);
    const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === drawioNode?.attributes.get('id')); const texts = svg.elements.filter(({name, parent, attributes}) => name === 'text' && parent === group && attributes.has('data-text-role'));
    assert.equal(texts.map((element) => elementText(source, element)).join(''), authority, `visible SVG business authority ${authority}`);
  }
  for (const [id, label] of NON_OWNERSHIP_LABELS) {
    const drawioNode = drawio.nodes.find(({attributes}) => attributes.get('id') === id);
    assert.ok(drawioNode?.label.includes(label), `Draw.io ${id} non-ownership boundary`);
    const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id); assert.ok(group, `SVG ${id}`);
    const end = source.indexOf('</g>', source.indexOf(group.tag)); assert.ok(source.slice(source.indexOf(group.tag), end).includes(label), `visible SVG ${id} non-ownership boundary`);
  }
  assert.doesNotMatch(source, /(?:ESB|集成层|集成基础设施)[^<。；]*(?<!不)拥有[^<。；]*业务状态/u, 'ESB/integration layer cannot own business state');
  assert.doesNotMatch(source, /共享平台[^<。；]*(?<!不)拥有[^<。；]*业务决定/u, 'shared platform cannot own business decisions');
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
  assert.ok(Number.isFinite(scale) && scale > 0, '800px CSS scale');
  assertConnectorInventory(drawio, svg, sourceSvg);
  assertDiagramOwnership(drawio, svg, sourceSvg);
  assertStructuralOwnership(drawio, svg, sourceSvg);
  assertLegendParity(drawio, svg, sourceSvg);
  assertNodeParity(drawio, svg, sourceSvg);
  assertParticipantGrid(drawio, svg, sourceSvg, scale);
  for (const [id, , , role] of CONNECTOR_INVENTORY) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('id') === id);
    assert.ok(edge, `Draw.io ${id}`); const route = drawioRoute(drawio, edge);
    const path = svg.elements.find(({name, attributes}) => name === 'path' && attributes.get('data-edge-id') === id); const label = svg.elements.find(({name, attributes}) => name === 'text' && attributes.get('data-edge-id') === id);
    assert.ok(path && label, `SVG ${role} path/label`); assert.equal(path.attributes.get('data-source'), edge.attributes.get('source'), `${id} semantic source`); assert.equal(path.attributes.get('data-target'), edge.attributes.get('target'), `${id} semantic target`);
    assert.deepEqual(parsePathPoints(path.attributes.get('d')), route, `${id} actual route parity`); assert.equal(label.attributes.get('data-role'), role, `${id} label role`); assert.equal(path.attributes.get('data-role'), role, `${id} path role`);
    const visibleLabel = elementText(sourceSvg, label); assert.equal(visibleLabel, edge.label, `${id} label parity`);
    const style = drawioStyle(edge); assert.equal(svgPresentationValue(sourceSvg, path, 'stroke'), style.get('strokeColor'), `${id} effective stroke`); assert.equal(Number(svgPresentationValue(sourceSvg, path, 'stroke-width')), Number(style.get('strokeWidth')), `${id} stroke width`);
    const markerId = svgPresentationValue(sourceSvg, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${id} effective marker`); const marker = svg.elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const markerPath = svg.elements.find(({name, parent}) => name === 'path' && parent === marker);
    assert.ok(marker && markerPath, `${id} marker definition`); assert.equal(svgPresentationValue(sourceSvg, markerPath, 'fill'), style.get('endFill') === '0' ? 'none' : style.get('strokeColor'), `${id} marker fill`); assert.equal(svgPresentationValue(sourceSvg, markerPath, 'stroke'), style.get('strokeColor'), `${id} marker stroke`); assert.ok(Number(marker.attributes.get('markerWidth')) * scale <= 16 && Number(marker.attributes.get('markerHeight')) * scale <= 16, `${id} bounded marker`);
    assert.equal(svgPresentationValue(sourceSvg, path, 'stroke-dasharray') ?? '', style.get('dashed') === '1' ? style.get('dashPattern') : '', `${id} dash role`);
    const fontSize = Number.parseFloat(svgPresentationValue(sourceSvg, label, 'font-size')); assert.ok(fontSize * scale >= 15, `${id} rendered font`);
  }
  const canvas = sourceSvg.match(/<(?:rect|path)\b[^>]*\bid="(?:canvas|background)"[^>]*>/u)?.[0] ?? '';
  assert.ok(canvas && !/fill="(?:none|transparent)"/iu.test(canvas), 'opaque canvas');
  const canvasElement = svg.elements.find(({attributes}) => /^(?:canvas|background)$/u.test(attributes.get('id') ?? ''));
  const background = svgPresentationValue(sourceSvg, canvasElement, 'fill'); assert.ok(background && background !== 'none', 'effective canvas background');
  const text = svg.elements.filter(({name}) => name === 'text');
  for (const rendered of text) {
    const label = elementText(sourceSvg, rendered); const size = Number.parseFloat(svgPresentationValue(sourceSvg, rendered, 'font-size'));
    if (/图例|业务调用|消息|路由|补偿/u.test(label)) assert.ok(size * scale >= 12, `legend text ${label}`);
    else assert.ok(size * scale >= 15, `essential text ${label}`);
    const local = localBackground(sourceSvg, rendered); assert.ok(contrastRatio(blendHex(svgPresentationValue(sourceSvg, rendered, 'fill'), local, paintOpacity(sourceSvg, rendered, 'fill')), local) >= 4.5, `effective text contrast ${label}`);
  }
  assertNoOverdraw(sourceSvg);
  assertPhysicalGeometry(sourceSvg, scale);
  const typography = typographyMetrics(svg, sourceSvg, scale);
  return {drawio, svg, alphaComposite, typography};
}
async function mutation(source, transform, validator, label) {
  const changed = transform(source); assert.notEqual(changed, source, `${label} mutation applies`);
  assert.throws(() => validator(changed), assert.AssertionError, label);
}

function physicalGeometryFixture() {
  const legend = Object.keys(CONNECTOR_STYLES).map((role, index) => {
    const y = 400 + index * 90;
    return `<path class="legend-edge" data-legend-key="${role}" d="M 100 ${y} H 200"/><text data-legend-for="${role}" x="300" y="${y + 5}">${role}</text>`;
  }).join('');
  return `<svg role="img" viewBox="0 0 800 800"><style>
    text { fill:#111827; font-size:20px; } .edge,.legend-edge { fill:none; stroke:#1D4ED8; stroke-width:2; marker-end:url(#arrow); }
    .boundary { fill:none; stroke:#64748B; stroke-width:2; }
  </style><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#1D4ED8" stroke="#1D4ED8"/></marker></defs>
  <rect id="canvas" x="0" y="0" width="800" height="800" fill="#FFFFFF"/>
  <g data-node-id="soa-boundary" data-node-bounds="0 0 350 300"><rect class="boundary" x="0" y="0" width="350" height="300"/><text data-header-for="soa-boundary" x="80" y="40">SOA</text></g>
  <g data-node-id="microservices-boundary" data-node-bounds="450 0 350 300"><rect class="boundary" x="450" y="0" width="350" height="300"/></g>
  <g data-node-id="comparison-axis" data-node-bounds="360 0 80 300"><rect class="boundary" x="360" y="0" width="80" height="300"/></g>
  <g data-node-id="foreign-node" data-node-bounds="600 40 80 50"><rect x="600" y="40" width="80" height="50" fill="#E2E8F0" stroke="#64748B" stroke-width="2"/></g>
  <path class="edge" data-edge-id="edge-a" data-source="source-node" data-target="target-node" d="M 100 100 H 200"/>
  <text data-edge-id="edge-a" data-label-bounds="393.8 40 406.2 66" x="400" y="60" text-anchor="middle">A</text>${legend}</svg>`;
}

test('SVG cascade, alpha composition, and conservative glyph geometry helpers are meaningful', () => {
  const svg = '<svg><style>.edge { stroke: #111111; fill: #111111; } .outer .edge { font-weight: 700; } .panel > .edge { stroke: #222222; } #x.edge { stroke: #FFFFFF !important; } .late { fill: #333333; } .late { fill: #444444; }</style><g class="outer"><g class="panel" fill="#000000" font-size="18px"><path id="x" class="edge late" stroke="#0F172A" style="stroke: #334155"/></g></g></svg>';
  const element = parseSvg(svg).elements.find(({attributes}) => attributes.get('id') === 'x');
  assert.equal(svgPresentationValue(svg, element, 'stroke'), '#FFFFFF');
  assert.equal(svgPresentationValue(svg, element, 'fill'), '#444444', 'specificity and source-order resolution');
  assert.equal(svgPresentationValue(svg, element, 'font-weight'), '700', 'descendant selector ancestry');
  assert.equal(svgPresentationValue(svg, element, 'font-size'), '18px', 'inherited presentation property');
  assert.equal(svgPresentationValue(svg.replace('#x.edge { stroke: #FFFFFF !important; }', ''), element, 'stroke'), '#334155', 'inline style beats selector and presentation attribute');
  const inlineImportant = svg.replace('style="stroke: #334155"', 'style="stroke: #334155 !important"');
  assert.equal(svgPresentationValue(inlineImportant, parseSvg(inlineImportant).elements.find(({attributes}) => attributes.get('id') === 'x'), 'stroke'), '#334155', 'inline important beats stylesheet important');
  assert.notEqual(svgPresentationValue(svg.replace('#x.edge { stroke: #FFFFFF !important; }', ''), element, 'stroke'), '#FFFFFF', 'specificity mutation changes effective paint');
  assert.equal(alphaComposite('#000000', .5), '#808080');
  assert.equal(blendHex('#000000', '#FFFFFF', .5), '#808080');
  assert.ok(contrastRatio('#000000', '#FFFFFF') >= 21, 'effective foreground/background contrast');
  assert.deepEqual(glyphBox({x: 10, y: 20, text: 'A中', fontSize: 10}), {left: 1.9, right: 18.1, top: 10, bottom: 20});
  const drawio = parseDrawio('<mxfile><mxCell id="a" vertex="1"><mxGeometry x="0" y="0" width="20" height="20"/></mxCell><mxCell id="b" vertex="1"><mxGeometry x="100" y="0" width="20" height="20"/></mxCell><mxCell id="e" edge="1" source="a" target="b" style="exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=1"><mxGeometry><Array as="points"><mxPoint x="60" y="10"/></Array></mxGeometry></mxCell></mxfile>');
  const edge = drawio.edges[0]; assert.deepEqual(drawioRoute(drawio, edge), [{x: 20, y: 10}, {x: 60, y: 10}, {x: 100, y: 10}]);
  assert.throws(() => drawioRoute(drawio, {...edge, body: `${edge.body}<mxPoint as="sourcePoint" x="0" y="0"/>`}), assert.AssertionError, 'fallback terminal point rejected');
  const masked = '<svg><path data-edge-id="e" d="M 0 0 H 20"/><rect x="10" y="-1" width="2" height="2" fill="#000000" opacity="0.5"/></svg>';
  assert.throws(() => assertNoOverdraw(masked), assert.AssertionError, 'ordinary translucent later mask rejected');
  const backgroundFixture = '<svg><rect id="canvas" x="0" y="0" width="100" height="100" fill="#FFFFFF"/><rect x="0" y="0" width="100" height="100" fill="#000000" opacity="0.5"/><text x="50" y="50">x</text></svg>';
  const label = parseSvg(backgroundFixture).elements.find(({name}) => name === 'text'); assert.equal(localBackground(backgroundFixture, label).toUpperCase(), '#808080', 'local alpha-composited background');
  assert.notEqual(localBackground(backgroundFixture.replace('opacity="0.5"', 'opacity="0.8"'), parseSvg(backgroundFixture.replace('opacity="0.5"', 'opacity="0.8"')).elements.find(({name}) => name === 'text')).toUpperCase(), '#808080', 'opacity mutation changes local background');
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

test('STY-07 diagram inventory and geometry fixtures reject physical hazards', () => {
  const fixture = physicalGeometryFixture(); assertPhysicalGeometry(fixture, 1, false);
  for (const [label, changed] of [
    ['moved label', fixture.replace('data-label-bounds="393.8 40 406.2 66" x="400" y="60"', 'data-label-bounds="193.8 75 206.2 101" x="200" y="95"')],
    ['foreign node collision', fixture.replace('x="600" y="40" width="80" height="50" fill="#E2E8F0"', 'x="390" y="35" width="30" height="40" fill="#E2E8F0"')],
    ['boundary collision', fixture.replace('x="360" y="0" width="80" height="300"', 'x="395" y="0" width="10" height="300"')],
    ['header padding', fixture.replace('x="80" y="40">SOA', 'x="80" y="15">SOA')],
    ['legend collision', fixture.replace('data-legend-for="business-call" x="300"', 'data-legend-for="business-call" x="195"')],
    ['oversized marker', fixture.replace('markerWidth="8"', 'markerWidth="20"')],
    ['shifted marker into foreign node', fixture.replace('refX="9" refY="5"', 'refX="-500" refY="15"')],
    ['shifted marker into boundary stroke', fixture.replace('refX="9"', 'refX="-200"')],
  ]) assert.throws(() => assertPhysicalGeometry(changed, 1, false), assert.AssertionError, `${label} rejected by helper fixture`);
  const edges = CONNECTOR_INVENTORY.map((edge) => [...edge]); assert.deepEqual(edges, CONNECTOR_INVENTORY, 'exact connector inventory fixture');
  assert.throws(() => assert.deepEqual(edges.slice(1), CONNECTOR_INVENTORY, 'missing connector'), assert.AssertionError, 'missing connector rejected');
  const miswired = CONNECTOR_INVENTORY.map((edge) => [...edge]); miswired[0][2] = 'integration-infrastructure'; assert.throws(() => assert.deepEqual(miswired, CONNECTOR_INVENTORY, 'miswired connector'), assert.AssertionError, 'mandatory ESB center rejected');
  const participants = {soa: [...PARTICIPANT_NAMES], microservices: [...PARTICIPANT_NAMES]}; const assertParticipants = (value) => { assert.deepEqual(value.soa, PARTICIPANT_NAMES); assert.deepEqual(value.microservices, PARTICIPANT_NAMES); };
  assertParticipants(participants); assert.throws(() => assertParticipants({...participants, soa: participants.soa.slice(1)}), assert.AssertionError, 'SOA participant deletion');
  assert.throws(() => assertParticipants({...participants, microservices: [participants.microservices[1], participants.microservices[0], ...participants.microservices.slice(2)]}), assert.AssertionError, 'microservices participant swap');
  assert.throws(() => assertParticipants({...participants, soa: [...participants.soa, 'side-only']}), assert.AssertionError, 'side-only participant');
  const steps = {soa: [...FULFILLMENT_STEPS], microservices: [...FULFILLMENT_STEPS]}; const assertSteps = (value) => { assert.deepEqual(value.soa, FULFILLMENT_STEPS); assert.deepEqual(value.microservices, FULFILLMENT_STEPS); };
  assertSteps(steps); assert.throws(() => assertSteps({...steps, soa: steps.soa.slice(1)}), assert.AssertionError, 'fulfillment step deletion');
  assert.throws(() => assertSteps({...steps, microservices: [steps.microservices[1], steps.microservices[0], ...steps.microservices.slice(2)]}), assert.AssertionError, 'fulfillment step swap');
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
    const row = `| ${failure.join(' | ')} |`;
    await mutation(source, (candidate) => candidate.replace(row, `| ${[...failure.slice(0, -1), '平台团队'].join(' | ')} |`), assertFailureTable, `${failure[0]} owner changed`);
    await mutation(source, (candidate) => candidate.replace(row, `| ${[...failure.slice(0, 3), '继续自动执行', failure[4]].join(' | ')} |`), assertFailureTable, `${failure[0]} stop condition changed`);
  }
  await mutation(source, (candidate) => `${candidate}\nSOA 与微服务构成成熟度阶梯。\n`, assertComparisonTable, 'fabricated maturity ladder');
  await mutation(source, (candidate) => candidate.replace(/结果未知[^。；]*不盲目[^。；]*(重复支付|预留|补偿)/u, '结果未知时盲目重试'), assertFailureTable, 'unknown result blind retry');
});

test('governs STY-07 sources, reciprocal relations, and current STY-11 next-topic projection', async () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const inventorySource = readFileSync('docs/source-license-inventory.md', 'utf8');
  assertRemoteSourceContracts(ledger, inventorySource);
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
  for (const [field, expected] of Object.entries(ILLUSTRATION)) assert.deepEqual(illustration[field], expected, `${illustration.id}.${field} exact original-illustration policy`);
  const illustrationCitation = document.citations.find(({source_id}) => source_id === illustration.id);
  assert.deepEqual(illustrationCitation, {source_id: illustration.id, ...ILLUSTRATION_CITATION}, 'exact original-illustration citation use, role, attribution, and modification');
  assert.deepEqual(document.copyright_checks, COPYRIGHT_CHECKS, 'complete copyright checks');
  const article = documents.find(({file}) => file === ARTICLE); assert.ok(article, `${ARTICLE} article exists`);
  const links = extractInternalLinks(article); assert.ok(links.includes('/styles')); assert.ok(links.includes('/cases/temporal-saga-durable-execution')); assert.equal(links.includes('/styles/sty-08'), true);
  assert.deepEqual(extractExternalLinks({body: article.body}).sort(), remote.map(({canonical_locator}) => canonical_locator).sort());
  for (const path of RECIPROCALS) {
    const reciprocal = documents.find(({file}) => file === path); assert.ok(reciprocal, `${path} reciprocal`);
    assert.ok(extractInternalLinks(reciprocal).includes(ROUTE), `${path} visible reciprocal`);
    if (path !== 'content/cases/temporal-saga-durable-execution.mdx') assert.ok(parseFrontMatter(reciprocal.source).adjacent_topics.includes(TOPIC_ID), `${path} metadata reciprocal`);
  }
  assert.deepEqual(
    documents.filter((content) => extractInternalLinks(content).includes('/styles/sty-08')).map(({file}) => file).sort(),
    [
      'content/cases/erlang-otp-supervision-tree.mdx',
      'content/styles/sty-05-microservices.mdx',
      'content/styles/sty-06-event-driven-architecture.mdx',
      'content/styles/sty-07-service-oriented-architecture.mdx',
    ],
    'only the four canonical reciprocal documents make STY-08 actionable',
  );
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8'));
  assert.deepEqual(Object.fromEntries(Object.keys(EXPECTED_CURRENT_PROJECTION).map((key) => [key, status[key]])), EXPECTED_CURRENT_PROJECTION);
  const manifest = JSON.parse(readFileSync('src/generated/topic-manifest.json', 'utf8'));
  for (const [id, published, topicStatus] of [[TOPIC_ID, true, 'complete'], [NEXT_TOPIC, true, 'complete'], ['STY-10', true, 'complete'], ['STY-11', true, 'complete'], ['STY-12', true, 'complete'], ['STY-13', false, 'pending']]) {
    const topic = manifest.topics.find((entry) => entry.id === id); assert.equal(topic?.published, published, `${id} publication`); assert.equal(topic?.status.value, topicStatus, `${id} status`);
  }
});

test('STY-07 remote source contracts reject identity, rights, role, primary, and inventory drift', async () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const inventory = readFileSync('docs/source-license-inventory.md', 'utf8');
  const changedLedger = (transform) => { const candidate = structuredClone(ledger); transform(candidate); return candidate; };
  const source = (candidate, id = SOURCE_IDS[0]) => candidate.sources.find((entry) => entry.id === id);
  const citation = (candidate, id = SOURCE_IDS[0]) => candidate.documents[ARTICLE].citations.find((entry) => entry.source_id === id);
  for (const [label, transform] of [
    ['canonical locator', (candidate) => { source(candidate).canonical_locator = 'https://example.invalid/soa'; }],
    ['transport locator', (candidate) => { source(candidate).transport_locator = 'https://example.invalid/transport'; }],
    ['license', (candidate) => { source(candidate).license = 'CC-BY-4.0'; }],
    ['facts-summary policy', (candidate) => { citation(candidate).usage_mode = 'adapted-standard'; }],
    ['allowed evidence role', (candidate) => { source(candidate).allowed_evidence_roles = ['definition']; }],
    ['citation evidence role', (candidate) => { citation(candidate).roles = ['comparison']; }],
    ['manifest primary', (candidate) => { citation(candidate).manifest_primary = false; citation(candidate, SOURCE_IDS[1]).manifest_primary = true; }],
  ]) {
    const candidate = changedLedger(transform);
    assert.throws(() => assertRemoteSourceContracts(candidate, inventory), assert.AssertionError, `${label} mutation rejected`);
  }
  const selfConsistentReusable = changedLedger((candidate) => {
    const item = source(candidate); item.license = 'CC-BY-4.0'; item.license_evidence_note = 'Reusable CC BY 4.0 license claimed.';
  });
  const reusableInventory = inventory.replace(
    '| 2026-08-13 | LicenseRef-Proprietary-Standard | The named OASIS Standard',
    '| 2026-08-13 | CC-BY-4.0 | The named OASIS Standard',
  ).replace(
    'OASIS IPR policies govern the standard; Tego Arch conservatively uses attributed bibliographic facts and original factual summary only.',
    'Reusable CC BY 4.0 license claimed.',
  );
  assert.notEqual(reusableInventory, inventory, 'self-consistent reusable-license inventory mutation applies');
  assert.throws(() => assertRemoteSourceContracts(selfConsistentReusable, reusableInventory), assert.AssertionError, 'unsupported reusable license rejected');
  const inventoryMismatch = inventory.replace(
    REMOTE_SOURCE_CONTRACTS[SOURCE_IDS[0]].license_evidence_note,
    'Different inventory evidence note.',
  );
  assert.notEqual(inventoryMismatch, inventory, 'inventory mismatch mutation applies');
  assert.throws(() => assertRemoteSourceContracts(ledger, inventoryMismatch), assert.AssertionError, 'inventory mismatch rejected');
});

test('STY-07 Draw.io/SVG diagram locks SOA comparison semantics, geometry, and contrast', () => {
  const drawio = file(DRAWIO); const svg = file(SVG);
  assert.ok(drawio, `${DRAWIO} must exist after implementation`); assert.ok(svg, `${SVG} must exist after implementation`);
  assertDiagram(drawio, svg);
  const parsed = parseDrawio(drawio); const first = parsed.edges[0];
  assert.ok(first, 'diagram has edge');
  assert.throws(() => assertDiagram(drawio.replace(`source="${first.attributes.get('source')}"`, ''), svg), assert.AssertionError, 'detached port rejected');
  const changedTerminalPort = drawio.replace(/(<mxCell\b[^>]*\bid="soa-submit-order"[^>]*\bexitX=)([01](?:\.5)?)(;)/u,
    (_, before, current, after) => `${before}${current === '0.5' ? '1' : '0.5'}${after}`);
  assert.notEqual(changedTerminalPort, drawio, 'changed terminal port mutation applies');
  assert.throws(() => assertDiagram(changedTerminalPort, svg), assert.AssertionError, 'changed terminal port rejected');
  assert.throws(() => assertDiagram(drawio.replace(/<Array as="points">/u, '<Array as="points"></Array><Array as="points">'), svg), assert.AssertionError, 'removed waypoint rejected');
  assert.throws(() => assertDiagram(drawio.replace(/(<mxPoint x=")[^"]+(" y="[^"]+"\/>)/u, '$10$2'), svg), assert.AssertionError, 'altered physical waypoint rejected');
  assert.throws(() => assertDiagram(drawio.replace(/(<mxCell\b[^>]*\bedge="1"[^>]*>\s*)<mxGeometry/u, '$1<mxPoint as="sourcePoint" x="0" y="0"/><mxGeometry'), svg), assert.AssertionError, 'ignored fallback rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-edge-id="([^"]+)"/u, 'data-edge-id="moved-label"')), assert.AssertionError, 'retargeted label rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<text\b[^>]*data-edge-id="[^"]+"[^>]*\bx=")[^"]+("[^>]*\by=")[^"]+/u, '$10$20')), assert.AssertionError, 'physically moved label rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<text\b[^>]*data-edge-id="soa-submit-order"[^>]*\bx=")[^"]+("[^>]*\by=")[^"]+/u, (_, beforeX, beforeY) => `${beforeX}1200${beforeY}1200`)), assert.AssertionError, 'detached fulfillment label rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<g\b[^>]*data-node-id="[^"]+"[^>]*data-node-bounds=")[^"]+/u, '$10 0 1 1')), assert.AssertionError, 'node bounds mutation rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<text\b[^>]*data-header-for="[^"]+"[^>]*\by=")[^"]+/u, '$10')), assert.AssertionError, 'header padding mutation rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<text\b[^>]*data-legend-for="[^"]+"[^>]*\bx=")[^"]+/u, '$10')), assert.AssertionError, 'legend collision mutation rejected');
  assert.throws(() => assertDiagram(drawio.replace(/<mxCell\b[^>]*\bid="legend-key-business-call"[\s\S]*?<\/mxCell>/u, ''), svg), assert.AssertionError, 'missing Draw.io legend key rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/<path\b[^>]*\bid="legend-key-business-call"[^>]*\/>/u, '')), assert.AssertionError, 'missing SVG legend key rejected');
  assert.throws(() => assertDiagram(drawio.replace(/(<mxCell\b[^>]*\bid="legend-key-business-call"[^>]*?)\s+source="[^"]+"/u, '$1'), svg), assert.AssertionError, 'missing legend source terminal rejected');
  const changedLegendPort = drawio.replace(/(<mxCell\b[^>]*\bid="legend-key-message"[^>]*\bexitX=)1(;)/u, '$10.5$2'); assert.notEqual(changedLegendPort, drawio, 'changed legend port mutation applies');
  assert.throws(() => assertDiagram(changedLegendPort, svg), assert.AssertionError, 'changed legend port rejected');
  assert.throws(() => assertDiagram(drawio.replace(/(<mxCell\b[^>]*\bid="legend-key-technical-route"[\s\S]*?<Array as="points">)[\s\S]*?(<\/Array>)/u, '$1$2'), svg), assert.AssertionError, 'missing legend waypoint rejected');
  assert.throws(() => assertDiagram(drawio.replace(/(<mxCell\b[^>]*\bid="legend-key-compensation"[^>]*>[\s\S]*?<mxGeometry\b[^>]*>)/u, '$1<mxPoint x="0" y="0" as="sourcePoint"/>'), svg), assert.AssertionError, 'forbidden legend fallback point rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace('id="legend-caption-business-call"', 'id="legend-caption-renamed"')), assert.AssertionError, 'wrong legend caption ID rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace('业务调用｜实线闭合箭头</text>', '业务调用</text>')), assert.AssertionError, 'wrong legend caption label rejected');
  assert.throws(() => assertDiagram(drawio.replace(/(<mxCell\b[^>]*\bid="legend-caption-message"[\s\S]*?<mxGeometry\b[^>]*\bx=")[^"]+/u, '$10'), svg), assert.AssertionError, 'wrong legend caption bounds rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace('id="legend-key-message" class="message" data-legend-key="message" data-role="legend-key" d="M 650 4170 H 700 H 750"', 'id="legend-key-message" class="message" data-legend-key="message" data-role="legend-key" d="M 650 4160 H 700 H 750"')), assert.AssertionError, 'wrong legend key route rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<path\b[^>]*\bid="legend-key-business-call"[^>]*)(\/>)/u, '$1 style="marker-end:none"$2')), assert.AssertionError, 'missing legend key marker rejected');
  const wrongLegendCaptionRole = svg.replace(/(<text\b[^>]*\bid="legend-caption-message"[^>]*\bdata-legend-for=")message/u, '$1business-call'); assert.notEqual(wrongLegendCaptionRole, svg, 'wrong legend caption role mutation applies');
  assert.throws(() => assertDiagram(drawio, wrongLegendCaptionRole), assert.AssertionError, 'wrong legend caption role rejected');
  const wrongLegendKeyStyle = svg.replace(/(<path\b[^>]*\bid="legend-key-technical-route"[^>]*)(\/>)/u, '$1 style="stroke:#1D4ED8"$2'); assert.notEqual(wrongLegendKeyStyle, svg, 'wrong legend key style mutation applies');
  assert.throws(() => assertDiagram(drawio, wrongLegendKeyStyle), assert.AssertionError, 'wrong legend key style rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<path\b[^>]*\bid="legend-key-compensation"[^>]*)(\/>)/u, '$1 style="stroke-dasharray:1 1"$2')), assert.AssertionError, 'wrong legend key dash rejected');
  const wrongLegendCaptionStyle = svg.replace(/(<text\b[^>]*\bid="legend-caption-compensation"[^>]*)(>)/u, '$1 style="font-size:30px"$2'); assert.notEqual(wrongLegendCaptionStyle, svg, 'wrong legend caption text style mutation applies');
  assert.throws(() => assertDiagram(drawio, wrongLegendCaptionStyle), assert.AssertionError, 'wrong legend caption text style rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/markerWidth="[^"]+"/u, 'markerWidth="999"')), assert.AssertionError, 'oversized physical marker rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/stroke-dasharray:[^;}]+/u, 'stroke-dasharray: 1 1')), assert.AssertionError, 'selector dash mutation rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/stroke="#1D4ED8"/u, 'stroke="#64748B"')), assert.AssertionError, 'line style mismatch rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<marker\b[^>]*id="arrow-business"[\s\S]*?<path\b[^>]*fill=")#[0-9A-F]{6}/u, '$1#64748B')), assert.AssertionError, 'marker style mismatch rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/fill="#F8FAFC"/u, 'fill="transparent"')), assert.AssertionError, 'transparent canvas rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-role="business-call"/u, 'data-role="removed"')), assert.AssertionError, 'removed role rejected');
  assert.throws(() => assertDiagram(drawio, `${svg.replace('</svg>', '<rect x="0" y="0" width="99999" height="99999" fill="#000000" opacity="0.5"/></svg>')}`), assert.AssertionError, 'later translucent mask rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace('data-node-id="soa-boundary"', 'data-node-id="microservices-boundary"')), assert.AssertionError, 'swapped side semantics rejected');
  const removedBusinessAuthority = svg.replace(/(<g\b[^>]*data-node-id="soa-order-store"[\s\S]*?<text\b[^>]*data-text-role="type"[^>]*>)权威状态(<\/text>[\s\S]*?<\/g>)/u, '$1普通存储$2');
  assert.notEqual(removedBusinessAuthority, svg, 'removed business authority mutation applies');
  assert.throws(() => assertDiagram(drawio, removedBusinessAuthority), assert.AssertionError, 'removed business authority rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace('集成层不拥有业务状态', 'ESB 拥有业务状态')), assert.AssertionError, 'ESB business-state ownership rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace('共享平台不拥有业务决定', '共享平台拥有业务决定')), assert.AssertionError, 'shared-platform business-decision ownership rejected');
  const lowContrastEssentialRole = svg.replace('.node-title{font-size:48px;font-weight:700}', '.node-title{font-size:48px;font-weight:700;fill:#F8FAFC}');
  assert.notEqual(lowContrastEssentialRole, svg, 'low-contrast essential role mutation applies');
  assert.throws(() => assertDiagram(drawio, lowContrastEssentialRole), assert.AssertionError, 'low-contrast essential role rejected');
  const firstInventory = CONNECTOR_INVENTORY[0];
  assert.throws(() => assertDiagram(drawio.replace(new RegExp(`<mxCell\\b[^>]*\\bid="${firstInventory[0]}"[\\s\\S]*?<\\/mxCell>`, 'u'), ''), svg), assert.AssertionError, 'missing exact connector rejected');
  assert.throws(() => assertDiagram(drawio.replace(`target="${firstInventory[2]}"`, 'target="soa-integration"'), svg), assert.AssertionError, 'miswired ESB-centered connector rejected');
  const participantGroup = (side, participant) => new RegExp(`(<g\\b[^>]*data-node-id="${side}-${participant}-${side === 'soa' ? 'system' : 'service'}"[^>]*>[\\s\\S]*?)(<\\/g>)`, 'u');
  assert.throws(() => assertDiagram(drawio, svg.replace(participantGroup('soa', 'order'), (group) => group.replace('订单', ''))), assert.AssertionError, 'one-side participant deletion rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(participantGroup('microservices', 'inventory'), (group) => group.replace('库存', '支付'))), assert.AssertionError, 'one-side participant swap rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(participantGroup('soa', 'notification'), '')), assert.AssertionError, 'side-only participant rejected');
  assert.throws(() => assertDiagram(drawio.replace('value="提交订单"', 'value="预留库存"'), svg), assert.AssertionError, 'fulfillment step order swap rejected');
  assert.throws(() => assertDiagram(drawio.replace(/<mxCell\b[^>]*\bid="soa-order-owner-store"[\s\S]*?<\/mxCell>/u, ''), svg), assert.AssertionError, 'detached SOA owner/store rejected');
  assert.throws(() => assertDiagram(drawio.replace(/<mxCell\b[^>]*\bid="microservices-order-contract-owner"[\s\S]*?<\/mxCell>/u, ''), svg), assert.AssertionError, 'detached microservices contract/owner rejected');
  assert.throws(() => assertDiagram(drawio.replace(/<mxCell\b[^>]*\bid="microservices-order-workflow"[\s\S]*?<\/mxCell>/u, ''), svg), assert.AssertionError, 'detached microservices workflow owner rejected');
  const removedStructuralSvg = svg.replace(/<path\b[^>]*data-structural-edge-id="soa-order-contract-owner"[^>]*\/>/u, '');
  assert.notEqual(removedStructuralSvg, svg, 'removed structural SVG edge mutation applies');
  assert.throws(() => assertDiagram(drawio, removedStructuralSvg), assert.AssertionError, 'missing structural SVG edge rejected');
  const missingStructuralMarker = svg.replace(/(<path\b[^>]*data-structural-edge-id="soa-order-contract-owner"[^>]*)(\/>)/u, '$1 style="marker-end:none"$2');
  assert.notEqual(missingStructuralMarker, svg, 'missing structural marker mutation applies');
  assert.throws(() => assertDiagram(drawio, missingStructuralMarker), assert.AssertionError, 'missing structural marker rejected');
  const wrongStructuralColor = svg.replace(/(<path\b[^>]*data-structural-edge-id="microservices-order-workflow"[^>]*)(\/>)/u, '$1 style="stroke:#64748B"$2');
  assert.notEqual(wrongStructuralColor, svg, 'wrong structural color mutation applies');
  assert.throws(() => assertDiagram(drawio, wrongStructuralColor), assert.AssertionError, 'wrong structural color rejected');
  const collidingStructuralDrawio = drawio.replace(/(<mxCell\b[^>]*\bid="microservices-order-workflow"[\s\S]*?<Array as="points">)[\s\S]*?(<\/Array>)/u, '$1<mxPoint x="1320" y="1800"/><mxPoint x="1320" y="590"/><mxPoint x="1660" y="590"/><mxPoint x="1660" y="450"/>$2');
  const collidingStructuralSvg = svg.replace(/(<path\b[^>]*data-structural-edge-id="microservices-order-workflow"[^>]*\bd=")[^"]+/u, '$1M 1370 1800 H 1320 V 590 H 1660 V 450 H 1675');
  assert.notEqual(collidingStructuralDrawio, drawio, 'structural label-collision Draw.io mutation applies');
  assert.notEqual(collidingStructuralSvg, svg, 'structural label-collision SVG mutation applies');
  assert.throws(
    () => assertDiagram(collidingStructuralDrawio, collidingStructuralSvg),
    { name: 'AssertionError', message: /microservices-submit-order label to own\/foreign connector microservices-order-workflow 5/u },
    'structural route through semantic label rejected at the measured 5 CSS px gap',
  );
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-node-id="soa-order-store"([\s\S]*?)data-shape="cylinder"/u, 'data-node-id="soa-order-store"$1data-shape="rounded-rect"')), assert.AssertionError, 'store shape drift rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/data-node-id="soa-integration"([\s\S]*?)>集成基础设施</u, 'data-node-id="soa-integration"$1>中央业务总线<')), assert.AssertionError, 'node label drift rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<g\b[^>]*data-node-id="soa-orchestrator"[\s\S]*?<rect\b[^>]*fill=")#[0-9A-F]{6}/u, '$1#FFFFFF')), assert.AssertionError, 'node fill drift rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<text\b[^>]*data-text-role="type"[^>]*\by=")[^"]+/u, '$10')), assert.AssertionError, 'title/type baseline mutation rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<g\b[^>]*data-node-id="soa-order-system"[\s\S]*?<text\b[^>]*data-text-role="title"[^>]*\bx=")[^"]+/u, '$10')), assert.AssertionError, 'node horizontal padding mutation rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<g\b[^>]*data-node-id="soa-order-system"[\s\S]*?<text\b[^>]*data-text-role="title"[^>]*\by=")[^"]+/u, '$11280')), assert.AssertionError, 'node top padding mutation rejected');
  assert.throws(() => assertDiagram(drawio, svg.replace(/(<g\b[^>]*data-node-id="soa-order-system"[\s\S]*?<text\b[^>]*data-text-role="type"[^>]*\by=")[^"]+/u, '$11390')), assert.AssertionError, 'node bottom padding mutation rejected');
  const canvasFontDrift = svg.replace('.title{font-size:60px', '.title{font-size:48px');
  assert.notEqual(canvasFontDrift, svg, 'canvas font drift mutation applies');
  assert.throws(() => assertDiagram(drawio, canvasFontDrift), assert.AssertionError, 'canvas font drift rejected');
  const throughForeignNodeDrawio = drawio.replace(/(<mxCell\b[^>]*\bid="soa-reserve-inventory"[\s\S]*?<Array as="points">)[\s\S]*?(<\/Array>[\s\S]*?<\/mxCell>)/u, '$1<mxPoint x="600" y="528"/><mxPoint x="600" y="1460"/>$2');
  const throughForeignNodeSvg = svg.replace(/(<path\b[^>]*data-edge-id="soa-reserve-inventory"[^>]*\bd=")[^"]+(")/u, '$1M 410 528 H 600 V 1460 H 460$2');
  assert.notEqual(throughForeignNodeDrawio, drawio, 'business connector Draw.io collision mutation applies');
  assert.notEqual(throughForeignNodeSvg, svg, 'business connector SVG collision mutation applies');
  assert.throws(() => assertDiagram(throughForeignNodeDrawio, throughForeignNodeSvg), assert.AssertionError, 'business connector through foreign node rejected');
});
