import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

export const ARTICLE = 'content/styles/sty-09-pipes-and-filters.mdx';
export const DRAWIO = 'diagrams/sty-09-pipes-filters-order-processing.drawio';
export const SVG = 'static/img/diagrams/sty-09-pipes-filters-order-processing.svg';
export const ROUTE = '/styles/sty-09';
export const TOPIC_ID = 'STY-09';
export const NEXT_TOPIC = 'STY-10';
export const EXPECTED_STAGE_A = Object.freeze({completed: 61, documents: 105, sources: 544});
export const SOURCE_IDS = Object.freeze([
  'src-microsoft-pipes-filters-pattern',
  'src-apache-beam-programming-guide',
  'src-reactive-streams-1-0-4',
  'src-gnu-bash-pipelines',
  'src-atlas-sty09-pipes-filters-order-processing',
]);
export const EXPECTED_HEADINGS = Object.freeze([
  '学习问题', '一页摘要', 'Filter、Pipe 与 Pipeline 合同', '订单双轨：相同转换，不同运行合同',
  '八维批流机制对照', '背压与容量传播', '错误、恢复与人工终态', '状态、顺序与输出边界',
  '适用、迁移与停止条件', '对比与边界', '来源',
]);
export const RELATIONS = Object.freeze({
  depends_on: ['STY-00', 'STY-05', 'STY-06'],
  adjacent_topics: ['STY-05', 'STY-06'],
  related_cases: ['/cases/apache-kafka-consumer-groups'],
  related_questions: ['/quality-attributes/qa-03-performance-latency-throughput-capacity', '/paths/04-reliability-state'],
});
export const EXACT_METADATA = Object.freeze({
  title: 'Pipes and Filters：用明确合同拆分批处理与流处理',
  slug: ROUTE,
  content_type: 'style',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-17',
  source_cutoff: '2026-08-17',
  confidence: 'high',
  domains: ['software-architecture', 'data-processing', 'distributed-systems'],
  agent_patterns: [],
  protocols: ['reactive-streams'],
  quality_attributes: ['performance', 'reliability', 'recoverability', 'operability', 'maintainability'],
  tags: ['架构风格', 'Pipes and Filters', '批处理', '流处理', '背压', '错误恢复'],
  summary: '以同一订单处理链对照批处理与流处理：Filter 负责转换或判定，Pipe 承担传递与容量合同；顺序、状态、恢复、输出可见性和外部效果边界必须逐轨明确设计。',
  topic_id: TOPIC_ID,
  priority: 'P1',
  ...RELATIONS,
});
export const REQUIRED_WRAPPERS = Object.freeze([
  {className: 'architecture-diagram-scroll', aria: '订单数据批处理与流处理双轨管道图，可横向滚动'},
  {className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner', aria: '批处理轨与流处理轨八维机制对照表，可横向滚动'},
  {className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner', aria: 'Pipes and Filters 六类故障检测、响应、停止条件与人工所有者表，可横向滚动'},
]);
export const CONSTRUCTS = Object.freeze([
  ['Filter', /输入.*(转换|判定).*(输出|过滤原因|错误分类)/u, /Filter[^。；\n]*(?:不证明|不保证|不自动)[^。；\n]*(?:无状态|纯函数|幂等|并行)/u],
  ['Pipe', /(传递|交付).*(容量|缓冲|确认|顺序|错误)/u, /Pipe[^。；\n]*(?:不自动|不保证|不等于)[^。；\n]*(?:可靠消息队列|事务边界|共享内存)/u],
  ['Pipeline', /(组合|连接).*输入.*输出.*合同/u, /Pipeline[^。；\n]*(?:不保证|不提供|不自动)[^。；\n]*(?:交换律|事务)/u],
]);
export const ORDER_STEPS = Object.freeze(['校验', '标准化', '定价', '风险标记', '汇总/输出']);
export const DIMENSIONS = Object.freeze(['输入边界', '触发方式', '状态位置', '顺序', '容量控制', '错误传播', '恢复单位', '输出可见性']);
export const DIMENSION_ROWS = Object.freeze([
  ['输入边界', '有限且可枚举的批次', '持续、当下不可完整枚举的数据', '何时知道输入已经结束？'],
  ['触发方式', '计划、文件到达或人工启动', '订阅、持续读取或事件到达', '谁负责启动、暂停和恢复？'],
  ['状态位置', '批次、分区或阶段局部状态', '窗口、键控或检查点状态', '状态由谁持久化和版本化？'],
  ['顺序', '批内、分区内或显式排序', '来源/分区/键内的有限顺序', '哪个范围外不能推导顺序？'],
  ['容量控制', '并行度、分片、调度和批次准入', '有界缓冲、请求量、暂停读取或负载削减', '压力能否逐边界传回？'],
  ['错误传播', '失败记录、分区、阶段或批次', '单记录、算子、分区或持续任务', '最小恢复单位是什么？'],
  ['恢复单位', '重跑记录/分区/阶段/批次', '从检查点恢复并受控重放', '重放会不会重复外部效果？'],
  ['输出可见性', '完整批次版本或明确部分版本', '追加、更新、撤回或窗口结果', '消费者何时可以信任结果？'],
]);
export const FAILURE_ROWS = Object.freeze([
  ['坏记录', '合同/语义校验失败及同类比例', '隔离并保留诊断上下文', '隔离率或同类错误超预算', '数据合同所有者'],
  ['临时依赖失败', '超时、限流或短时不可用', '有界重试并施加背压', '重试预算耗尽', '依赖与管道运行所有者'],
  ['Filter 崩溃', '进程/任务退出和健康信号', '从阶段或检查点恢复', '恢复循环或状态不一致', 'Filter 代码所有者'],
  ['部分输出', '输入清单、输出清单或版本不完整', '阻止发布或标记部分版本', '无法证明输出集合完整', '批次/输出所有者'],
  ['外部效果未知', '超时后缺少权威结果', '查询、对账或目标侧幂等恢复', '无法自动判定真实结果', '业务边界所有者'],
  ['毒数据持续失败', '相同记录跨恢复仍失败', '隔离→修复→受控重放', '再次失败后人工终止', '数据与业务联合所有者'],
]);
export const FILTER_CONTRACTS = Object.freeze(['输入结构及身份', '成功输出与过滤原因', '状态位置', '容量和缓冲上限', '重放与幂等边界', '所有者']);
export const PROHIBITIONS = Object.freeze(['不保证全局顺序', '不保证端到端 exactly-once 业务效果', '不替代跨步骤业务事务', '不保证可靠投递', '不保证幂等']);
export const FORBIDDEN_EQUIVALENCES = Object.freeze(['消息队列', '工作流引擎', '事件驱动架构', 'ETL 产品', 'Saga', 'shell pipeline']);
export const STOP_CONDITIONS = Object.freeze([
  '步骤必须共享一个可变事务状态', '业务要求同步交互反馈而无法接受阶段结果', '中间数据合同无法稳定',
  '序列化和持久化成本超过复用收益', '恢复需要整条链全局协调却无可证明边界',
  '背压无法跨关键依赖传播且无准入/溢出方案', '团队无法运营积压、检查点、隔离、重放和人工终态',
]);
export const DIAGRAM_NODES = Object.freeze([
  'order-input', 'batch-boundary', 'stream-boundary',
  'batch-validate', 'batch-normalize', 'batch-price', 'batch-risk', 'batch-output',
  'stream-validate', 'stream-normalize', 'stream-price', 'stream-risk', 'stream-output',
  'batch-barrier', 'batch-release', 'stream-window-state', 'stream-checkpoint', 'batch-published-output', 'stream-continuous-output',
  'backpressure-controller', 'bad-record-error', 'technical-failure-error', 'unknown-external-effect-error',
  'rerun-partition', 'checkpoint-recovery', 'reconcile-authority', 'manual-terminal', 'legend-data-flow', 'legend-backpressure', 'legend-error', 'legend-recovery',
]);
export const CONNECTOR_INVENTORY = Object.freeze([
  ['batch-input', 'order-input', 'batch-boundary', 'data-flow'], ['stream-input', 'order-input', 'stream-boundary', 'data-flow'],
  ['batch-validate', 'batch-boundary', 'batch-validate', 'data-flow'], ['batch-normalize', 'batch-validate', 'batch-normalize', 'data-flow'], ['batch-price', 'batch-normalize', 'batch-price', 'data-flow'], ['batch-risk', 'batch-price', 'batch-risk', 'data-flow'], ['batch-output', 'batch-risk', 'batch-output', 'data-flow'], ['batch-output-barrier', 'batch-output', 'batch-barrier', 'data-flow'],
  ['batch-barrier-release', 'batch-barrier', 'batch-release', 'data-flow'], ['stream-checkpoint-recovery', 'stream-checkpoint', 'checkpoint-recovery', 'recovery'],
  ['batch-publish', 'batch-release', 'batch-published-output', 'data-flow'], ['stream-validate', 'stream-boundary', 'stream-validate', 'data-flow'], ['stream-normalize', 'stream-validate', 'stream-normalize', 'data-flow'], ['stream-price', 'stream-normalize', 'stream-price', 'data-flow'], ['stream-risk', 'stream-price', 'stream-risk', 'data-flow'], ['stream-output', 'stream-risk', 'stream-output', 'data-flow'], ['stream-window', 'stream-output', 'stream-window-state', 'data-flow'], ['stream-checkpoint', 'stream-window-state', 'stream-checkpoint', 'data-flow'], ['stream-publish', 'stream-checkpoint', 'stream-continuous-output', 'data-flow'],
  ['backpressure-to-stream', 'backpressure-controller', 'stream-boundary', 'backpressure'], ['bad-record-isolation', 'bad-record-error', 'manual-terminal', 'error'],
  ['technical-recovery', 'technical-failure-error', 'checkpoint-recovery', 'recovery'], ['unknown-effect-reconcile', 'unknown-external-effect-error', 'reconcile-authority', 'recovery'],
]);
export const ROLE_STYLES = Object.freeze({
  'data-flow': Object.freeze({stroke: '#0F766E', width: 3, dash: ''}),
  backpressure: Object.freeze({stroke: '#7C3AED', width: 3, dash: '8 6'}),
  error: Object.freeze({stroke: '#B91C1C', width: 3, dash: '4 4'}),
  recovery: Object.freeze({stroke: '#0369A1', width: 3, dash: '10 5'}),
});

function file(path) { try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; } }
function articleParts(source) { assert.ok(source, `${ARTICLE} must exist after implementation`); const close = source.indexOf('\n---', 3); assert.ok(close >= 0, 'front matter closes'); return {source, body: source.slice(close + 4)}; }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'); }
export function markdownTables(body) {
  const tables = []; const lines = body.split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\|/u.test(lines[index])) continue;
    const rows = []; while (index < lines.length && /^\|/u.test(lines[index])) { rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim())); index += 1; }
    if (rows.length >= 3 && rows[1].every((cell) => /^:?-{3,}:?$/u.test(cell))) tables.push(rows);
  }
  return tables;
}
function exactWrapperTag(wrapper) { return `<div className="${wrapper.className}" role="region" aria-label="${wrapper.aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`; }
function clause(source, expression, label) { const found = source.split(/[。；\n]/u).find((part) => expression.test(part)); assert.ok(found, label); return found; }
function table(body, header) { const found = markdownTables(body).find((candidate) => JSON.stringify(candidate[0]) === JSON.stringify(header)); assert.ok(found, `table ${header.join(' | ')}`); return found; }
function exactRows(actual, expected, name) { assert.deepEqual(actual.slice(2), expected, `${name} exact ordered rows`); }
function replaceOnce(source, oldValue, newValue, label) { const changed = source.replace(oldValue, newValue); assert.notEqual(changed, source, `${label} mutation applies`); return changed; }
function frontMatterFixture(metadata) { return Object.entries(metadata).flatMap(([key, value]) => Array.isArray(value) ? [`${key}:`, ...value.map((item) => `  - ${item}`)] : [`${key}: ${value}`]).join('\n'); }
function removeFrontMatterField(source, key) { const expression = new RegExp(`^${escapeRegExp(key)}:.*(?:\\r?\\n  - [^\\r\\n]+)*(?:\\r?\\n|$)`, 'mu'); assert.match(source, expression, `${key} field exists`); return source.replace(expression, ''); }
function changeFrontMatterField(source, key) { const value = EXACT_METADATA[key]; if (Array.isArray(value)) { const token = `  - ${value[0]}`; return replaceOnce(source, token, '  - changed', `${key} changed value`); } return replaceOnce(source, `${key}: ${value}`, `${key}: changed`, `${key} changed value`); }

export function assertExactMetadata(source) { assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-09 front matter'); }
export function assertRequiredWrappers(source) {
  for (const wrapper of REQUIRED_WRAPPERS) assert.ok(source.includes(exactWrapperTag(wrapper)), `exact scroll wrapper: ${wrapper.aria}`);
  assert.equal((source.match(/role="region"/gu) ?? []).length, 3, 'exactly three horizontal scroll owners');
}
export function assertConstructsAndOrder(source) {
  for (const [name, affirmative, boundary] of CONSTRUCTS) { clause(source, affirmative, `${name} affirmative responsibility`); assert.match(source, boundary, `${name} explicit non-guarantee`); }
  assert.match(source, /说明性场景（Tego Arch 分析）/u, 'illustrative scene label');
  for (const track of ['批处理轨', '流处理轨']) {
    const match = new RegExp(`${track}：([^。；\\n]+)`, 'u').exec(source); assert.ok(match, `${track} transformation list`);
    for (const step of ORDER_STEPS) assert.match(match[1], new RegExp(escapeRegExp(step), 'u'), `${track} includes ${step}`);
  }
  for (const forbidden of [/所有[^。；\n]*Filter[^。；\n]*(?:无状态|纯函数|幂等)/u, /Pipe[^。；\n]*(?:就是|等于)[^。；\n]*可靠消息队列/u, /步骤[^。；\n]*(?:可以|能够)[^。；\n]*任意(?:交换|重排)/u, /Pipeline[^。；\n]*(?:提供|形成)[^。；\n]*事务/u]) assert.doesNotMatch(source, forbidden, 'false construct guarantee');
  for (const counterpart of FORBIDDEN_EQUIVALENCES) assert.doesNotMatch(source, new RegExp(`(?:Pipes? and Filters|Pipeline)[^。；\\n]*(?:就是|(?<!不)等于)[^。；\\n]*${escapeRegExp(counterpart)}|${escapeRegExp(counterpart)}[^。；\\n]*(?:就是|(?<!不)等于)[^。；\\n]*(?:Pipes? and Filters|Pipeline)`, 'iu'), `${counterpart} equivalence prohibited`);
}
export function assertDimensionMatrix(source) {
  const rows = table(source, ['维度', '批处理轨', '流处理轨', '决策问题']); exactRows(rows, DIMENSION_ROWS, 'eight-dimension matrix');
  assert.deepEqual(rows.slice(2).map(([dimension]) => dimension), DIMENSIONS, 'dimension row order');
  for (const forbidden of ['批处理天然有序', '流处理天然实时', '微批等于批流合同相同']) assert.equal(source.includes(forbidden), false, `${forbidden} rejected`);
  assert.doesNotMatch(source, /(?:批处理|流处理)[^。；\n]*(?:天然|自动)[^。；\n]*(?:相同|等价)|微批[^。；\n]*(?:等于|意味着)[^。；\n]*批流合同相同/u, 'batch/stream false equivalence');
}
export function assertFailureContracts(source) {
  for (const item of FILTER_CONTRACTS) assert.match(source, new RegExp(escapeRegExp(item), 'u'), `Filter contract: ${item}`);
  assert.match(source, /(?:缓冲|队列)[^。；\n]*(?:有界|上限)|有界[^。；\n]*(?:缓冲|队列)/u, 'bounded capacity');
  for (const action of ['暂停读取', '降低并发', '延迟确认', '缩小准入', '负载削减', '拒绝']) assert.match(source, new RegExp(action, 'u'), `capacity response: ${action}`);
  assert.match(source, /背压[^。；\n]*(?:(?:中断|停止)[^。；\n]*(?:不支持|不兼容|无界写入|固定速率)|(?:不支持|不兼容|无界写入|固定速率)[^。；\n]*(?:中断|停止))/u, 'backpressure incompatible-boundary stop');
  assert.match(source, /背压[^。；\n]*(?:逐边界|容量协议)|(?:逐边界|容量协议)[^。；\n]*背压/u, 'backpressure is a per-boundary capacity protocol');
  for (const forbidden of [/背压[^。；\n]*(?:业务数据|数据)[^。；\n]*(?:倒流|反向)/u, /背压[^。；\n]*(?:自动|天然)[^。；\n]*(?:端到端|跨(?:越)?不兼容|跨网络|跨队列)/u]) assert.doesNotMatch(source, forbidden, 'backpressure false propagation');
  const rows = table(source, ['故障', '检测', '自动响应', '停止条件', '人工所有者']); exactRows(rows, FAILURE_ROWS, 'failure ownership');
  for (const forbidden of [/无限重试/u, /悄悄丢失/u, /默认值[^。；\n]*(?:成功|成功处理)/u, /(?:阶段重跑|恢复)[^。；\n]*(?:直接|盲目)重放[^。；\n]*(?:支付|通知|不可逆)/u]) assert.doesNotMatch(source, forbidden, 'unsafe recovery claim');
}
export function assertNarrativeBoundaries(source) {
  for (const prohibition of PROHIBITIONS) assert.match(source, new RegExp(escapeRegExp(prohibition), 'u'), prohibition);
  for (const migration of ['单体处理函数', '提取一个', '中间合同', '幂等键', '有界 Pipe', '重放边界']) assert.match(source, new RegExp(escapeRegExp(migration), 'u'), `migration: ${migration}`);
  for (const condition of STOP_CONDITIONS) assert.match(source, new RegExp(escapeRegExp(condition), 'u'), `stop condition: ${condition}`);
}

export const REMOTE_SOURCE_CONTRACTS = Object.freeze({
  'src-microsoft-pipes-filters-pattern': Object.freeze({canonical_locator: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/pipes-and-filters', transport_locator: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/pipes-and-filters', title: 'Pipes and Filters pattern', author_or_org: 'Microsoft', version: '2026-08-17', checked_at: '2026-08-17', source_kind: 'documentation', tier: 'primary', license: 'CC-BY-4.0', license_scope: 'Microsoft Learn content license', license_evidence_url: 'https://learn.microsoft.com/en-us/legal/termsofuse', license_evidence_note: 'Microsoft Learn terms identify the applicable content license boundary; this article uses an attributed factual summary only.', copyright_policy: 'facts-summary', allowed_evidence_roles: ['definition', 'boundary'], citation_roles: ['definition', 'boundary'], manifest_primary: true, usage_boundary: 'Supports Filter/Pipe composition, schema, reordering conditions and duplicate-message risk; it does not prove a universal delivery, transaction, or backpressure guarantee.'}),
  'src-apache-beam-programming-guide': Object.freeze({canonical_locator: 'https://beam.apache.org/documentation/programming-guide/', transport_locator: 'https://beam.apache.org/documentation/programming-guide/', title: 'Apache Beam Programming Guide', author_or_org: 'Apache Software Foundation', version: '2026-08-17', checked_at: '2026-08-17', source_kind: 'documentation', tier: 'primary', license: 'Apache-2.0', license_scope: 'Apache Beam documentation', license_evidence_url: 'https://www.apache.org/licenses/LICENSE-2.0', license_evidence_note: 'Apache License 2.0 is the recorded evidence boundary; this article does not copy guide text or code.', copyright_policy: 'facts-summary', allowed_evidence_roles: ['mechanism', 'boundary'], citation_roles: ['mechanism', 'boundary'], manifest_primary: false, usage_boundary: 'Supports bounded/unbounded input and windowing distinctions only; it does not require Beam or transfer Beam execution semantics to every pipeline.'}),
  'src-reactive-streams-1-0-4': Object.freeze({canonical_locator: 'https://www.reactive-streams.org/', transport_locator: 'https://github.com/reactive-streams/reactive-streams-jvm/tree/v1.0.4', title: 'Reactive Streams Specification 1.0.4', author_or_org: 'Reactive Streams Initiative', version: '1.0.4', checked_at: '2026-08-17', source_kind: 'specification', tier: 'primary', license: 'CC-BY-4.0', license_scope: 'Reactive Streams specification and project site', license_evidence_url: 'https://github.com/reactive-streams/reactive-streams-jvm/blob/v1.0.4/LICENSE', license_evidence_note: 'The fixed 1.0.4 repository license is recorded for an attributed factual summary of the specification.', copyright_policy: 'facts-summary', allowed_evidence_roles: ['mechanism', 'boundary'], citation_roles: ['mechanism', 'boundary'], manifest_primary: false, usage_boundary: 'Supports the minimum non-blocking backpressure protocol and its exclusions; it does not prove end-to-end control across incompatible APIs, queues, or networks.'}),
  'src-gnu-bash-pipelines': Object.freeze({canonical_locator: 'https://www.gnu.org/software/bash/manual/html_node/Pipelines.html', transport_locator: 'https://www.gnu.org/software/bash/manual/html_node/Pipelines.html', title: 'Pipelines', author_or_org: 'GNU Project', version: 'Bash manual checked 2026-08-17', checked_at: '2026-08-17', source_kind: 'documentation', tier: 'primary', license: 'GFDL-1.3-or-later', license_scope: 'GNU Bash Reference Manual', license_evidence_url: 'https://www.gnu.org/licenses/fdl-1.3.html', license_evidence_note: 'GNU Free Documentation License 1.3 is the recorded manual license boundary; this article uses no manual excerpt.', copyright_policy: 'facts-summary', allowed_evidence_roles: ['historical-context', 'boundary'], citation_roles: ['historical-context', 'boundary'], manifest_primary: false, usage_boundary: 'Supports the historical process-pipeline exit-status and pipefail example only; it does not define distributed Pipes and Filters semantics.'}),
});
export const ILLUSTRATION = Object.freeze({canonical_locator: '/img/diagrams/sty-09-pipes-filters-order-processing.svg', transport_locator: '/img/diagrams/sty-09-pipes-filters-order-processing.svg', source_kind: 'original-illustration', tier: 'primary', allowed_evidence_roles: ['illustration'], license: 'LicenseRef-Atlas-Original', license_scope: 'The named project-authored sty-09-pipes-filters-order-processing.svg asset only', license_evidence_url: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/sty-09-pipes-filters-order-processing.svg', license_evidence_note: 'The project-authored Draw.io/SVG pair contains no third-party topology, reference image, brand visual, signature, watermark, or copied composition.', copyright_policy: 'original-atlas', usage_boundary: 'Original teaching comparison of order processing in batch and stream tracks; illustration-only and not evidence of production outcomes.'});
function inventoryRows(source) { return source.split(/\r?\n/u).filter((line) => line.startsWith('| ')).map((line) => line.slice(2, -2).split(' | ').map((cell) => cell.trim())); }
export function assertRemoteSourceContracts(ledger, inventorySource) {
  const document = ledger.documents?.[ARTICLE]; assert.ok(document, `${ARTICLE} governed document`);
  const remoteIds = SOURCE_IDS.slice(0, -1); assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1, 'exactly one primary citation');
  assert.equal(document.citations.find(({manifest_primary}) => manifest_primary)?.source_id, remoteIds[0], 'Microsoft pattern source is primary');
  assert.ok(new Set(remoteIds.map((id) => new URL(REMOTE_SOURCE_CONTRACTS[id].canonical_locator).hostname)).size >= 4, 'four independent remote identities');
  const rows = inventoryRows(inventorySource);
  for (const id of remoteIds) {
    const expected = REMOTE_SOURCE_CONTRACTS[id]; const source = ledger.sources.find((entry) => entry.id === id); const citation = document.citations.find((entry) => entry.source_id === id); assert.ok(source && citation, `${id} source and citation`);
    for (const field of ['canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version', 'checked_at', 'source_kind', 'tier', 'license', 'license_scope', 'license_evidence_url', 'license_evidence_note', 'copyright_policy', 'usage_boundary']) assert.equal(source[field], expected[field], `${id}.${field}`);
    assert.deepEqual(source.allowed_evidence_roles, expected.allowed_evidence_roles, `${id}.roles`); assert.equal(citation.citation_url, expected.canonical_locator, `${id}.citation`); assert.deepEqual(citation.roles, expected.citation_roles, `${id}.citation roles`); assert.equal(citation.manifest_primary, expected.manifest_primary, `${id}.primary`);
    assert.ok(rows.some((row) => row.includes(expected.canonical_locator)), `${id} inventory identity`);
  }
  const original = ledger.sources.find((entry) => entry.id === SOURCE_IDS.at(-1)); assert.ok(original, 'original illustration source');
  for (const field of Object.keys(ILLUSTRATION)) assert.deepEqual(original[field], ILLUSTRATION[field], `illustration ${field}`);
}
export function assertRelationsAndProjection() {
  const documents = readContentDocuments(); const article = documents.find(({file: path}) => path === ARTICLE); assert.ok(article, 'STY-09 article appears in content documents');
  const links = extractInternalLinks(article); for (const route of ['/styles/sty-05', '/styles/sty-06', '/cases/apache-kafka-consumer-groups', '/quality-attributes/qa-03-performance-latency-throughput-capacity', '/paths/04-reliability-state']) assert.ok(links.includes(route), `visible STY-09 link: ${route}`);
  assert.equal(links.includes('/styles/sty-10'), false, 'STY-10 remains non-actionable');
  const reciprocal = [
    ['content/styles/sty-05-microservices.mdx', '/styles/sty-09'], ['content/styles/sty-06-event-driven-architecture.mdx', '/styles/sty-09'],
    ['content/cases/apache-kafka-consumer-groups.mdx', '/styles/sty-09'], ['content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx', '/styles/sty-09'], ['content/paths/04-reliability-state.mdx', '/styles/sty-09'],
  ];
  for (const [path, route] of reciprocal) { const target = documents.find((document) => document.file === path); assert.ok(target, `${path} exists`); assert.ok(extractInternalLinks(target).includes(route), `${path} reciprocates STY-09`); }
  const ledger = JSON.parse(readFileSync('src/generated/content-ledger.json', 'utf8')); assert.deepEqual({completed: ledger.summary.completedTopics, documents: ledger.summary.documents, sources: ledger.summary.sources}, EXPECTED_STAGE_A, 'Stage A projection');
}

function attributes(tag) { return new Map([...tag.matchAll(/([:\w-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value])); }
export function parseXml(source) { return [...source.matchAll(/<([A-Za-z][:\w.-]*)\b[^>]*>/gu)].map(([tag, name], index) => ({name, attributes: attributes(tag), tag, index})); }
export function parseDrawio(source) {
  return [...source.matchAll(/<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/gu)].map(([raw]) => {
    const open = /^<mxCell\b[^>]*>/u.exec(raw)?.[0] ?? raw; const geometry = /<mxGeometry\b([^>]*)/u.exec(raw)?.[1] ?? ''; const points = [...raw.matchAll(/<mxPoint\b([^>]*)/gu)].map(([, point]) => attributes(`<mxPoint ${point}>`));
    return {name: 'mxCell', attributes: attributes(open), geometry: attributes(`<mxGeometry ${geometry}>`), points, raw};
  });
}
export function parseSvg(source) { return parseXml(source); }
export function parsePathPoints(data) {
  assert.ok(data, 'SVG path data'); const points = []; let current = {x: 0, y: 0};
  for (const [, command, values] of data.matchAll(/([MLHV])\s*([\d.\-\s,]+)/gu)) { const nums = values.trim().split(/[\s,]+/u).map(Number); if (command === 'M' || command === 'L') for (let index = 0; index < nums.length; index += 2) { current = {x: nums[index], y: nums[index + 1]}; points.push(current); } else if (command === 'H') for (const x of nums) { current = {x, y: current.y}; points.push(current); } else for (const y of nums) { current = {x: current.x, y}; points.push(current); } }
  return points;
}
function styleMap(value = '') { return new Map(value.split(';').filter(Boolean).map((item) => item.split('=').map((part) => part.trim()))); }
export function effectiveStyle(attributesMap, inherited = new Map()) { const own = styleMap(attributesMap.get('style')); const result = new Map(inherited); for (const [key, value] of own) result.set(key, value); for (const key of ['stroke', 'fill', 'font-size', 'stroke-width', 'marker-end', 'opacity']) if (attributesMap.has(key)) result.set(key, attributesMap.get(key)); return result; }
export function terminalPort(cell, endpoint) { const style = styleMap(cell.attributes.get('style')); const x = Number(style.get(`${endpoint}X`)); const y = Number(style.get(`${endpoint}Y`)); assert.ok(Number.isFinite(x) && Number.isFinite(y), `${cell.attributes.get('id')} has normalized ${endpoint} port`); assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `${endpoint} port normalized`); return {x, y}; }
function number(value, label) { const parsed = Number(value); assert.ok(Number.isFinite(parsed), label); return parsed; }
function bounds(cell) { const geometry = cell.geometry; return {x: number(geometry.get('x'), `${cell.attributes.get('id')} x`), y: number(geometry.get('y'), `${cell.attributes.get('id')} y`), width: number(geometry.get('width'), `${cell.attributes.get('id')} width`), height: number(geometry.get('height'), `${cell.attributes.get('id')} height`)}; }
function pointOn(box, port) { return {x: box.x + box.width * port.x, y: box.y + box.height * port.y}; }
function drawioRoute(edge, nodeById) { const source = nodeById.get(edge.attributes.get('source')); const target = nodeById.get(edge.attributes.get('target')); assert.ok(source && target, `${edge.attributes.get('id')} real terminals`); assert.equal(edge.points.some((point) => ['sourcePoint', 'targetPoint'].includes(point.get('as'))), false, `${edge.attributes.get('id')} fallback points forbidden`); const waypoints = edge.points.filter((point) => point.get('as') !== 'sourcePoint' && point.get('as') !== 'targetPoint').map((point) => ({x: number(point.get('x'), 'waypoint x'), y: number(point.get('y'), 'waypoint y')})); return [pointOn(bounds(source), terminalPort(edge, 'exit')), ...waypoints, pointOn(bounds(target), terminalPort(edge, 'entry'))]; }
function close(left, right, label) { assert.ok(Math.abs(left - right) < 0.01, `${label}: ${left} !== ${right}`); }
function equalRoute(actual, expected, label) { assert.equal(actual.length, expected.length, `${label} point count`); actual.forEach((point, index) => { close(point.x, expected[index].x, `${label}[${index}].x`); close(point.y, expected[index].y, `${label}[${index}].y`); }); }
function parseBounds(value, label) { const parts = String(value ?? '').trim().split(/[\s,]+/u).map(Number); assert.equal(parts.length, 4, `${label} four bounds`); parts.forEach((part) => assert.ok(Number.isFinite(part), `${label} numeric`)); return {x: parts[0], y: parts[1], width: parts[2], height: parts[3]}; }
function contains(box, point) { return point.x >= box.x - 0.01 && point.x <= box.x + box.width + 0.01 && point.y >= box.y - 0.01 && point.y <= box.y + box.height + 0.01; }
function segmentHit(first, second, third, fourth) { const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); const on = (a, b, c) => Math.min(a.x, b.x) - 0.01 <= c.x && c.x <= Math.max(a.x, b.x) + 0.01 && Math.min(a.y, b.y) - 0.01 <= c.y && c.y <= Math.max(a.y, b.y) + 0.01; const a = cross(first, second, third); const b = cross(first, second, fourth); const c = cross(third, fourth, first); const d = cross(third, fourth, second); return (a === 0 && on(first, second, third)) || (b === 0 && on(first, second, fourth)) || (c === 0 && on(third, fourth, first)) || (d === 0 && Math.sign(a) !== Math.sign(b) && Math.sign(c) !== Math.sign(d)); }
function routeIntersects(first, second) { for (let i = 1; i < first.length; i += 1) for (let j = 1; j < second.length; j += 1) if (segmentHit(first[i - 1], first[i], second[j - 1], second[j])) return true; return false; }
function routeHitsBox(route, box) { const edges = [{x: box.x, y: box.y}, {x: box.x + box.width, y: box.y}, {x: box.x + box.width, y: box.y + box.height}, {x: box.x, y: box.y + box.height}]; for (let index = 1; index < route.length; index += 1) { if (contains(box, route[index - 1]) || contains(box, route[index])) return true; for (let edge = 0; edge < 4; edge += 1) if (segmentHit(route[index - 1], route[index], edges[edge], edges[(edge + 1) % 4])) return true; } return false; }
function svgPath(svgNodes, id) { const found = svgNodes.find(({name, attributes: a}) => name === 'path' && a.get('data-edge-id') === id); assert.ok(found, `SVG edge ${id}`); return found; }
function svgNodeBounds(svgNodes, id) { const shape = svgNodes.find(({name, attributes: a}) => ['rect', 'path', 'polygon'].includes(name) && a.get('data-node-id') === id); assert.ok(shape, `SVG ${id} has actual painted node geometry`); assert.equal(shape.attributes.get('data-node-bounds') !== undefined, false, `${id} cannot self-report bounds on its painted shape`); if (shape.name === 'rect') return {x: number(shape.attributes.get('x'), `${id} SVG x`), y: number(shape.attributes.get('y'), `${id} SVG y`), width: number(shape.attributes.get('width'), `${id} SVG width`), height: number(shape.attributes.get('height'), `${id} SVG height`)}; throw new Error(`${id} must use rect geometry for measurable parity`); }
function styleValue(attributesMap, key) { const style = effectiveStyle(attributesMap); return attributesMap.get(key) ?? style.get(key); }
function markerBox(svgNodes, path) { const marker = String(styleValue(path.attributes, 'marker-end') ?? '').match(/url\(#([^)]*)\)/u)?.[1]; assert.ok(marker, `${path.attributes.get('data-edge-id')} marker`); const markerNode = svgNodes.find(({name, attributes: a}) => name === 'marker' && a.get('id') === marker); assert.ok(markerNode, `${marker} marker definition`); const width = number(markerNode.attributes.get('markerWidth'), `${marker} width`); const height = number(markerNode.attributes.get('markerHeight'), `${marker} height`); const markerPath = svgNodes.find(({name, attributes: a, index}) => name === 'path' && index > markerNode.index && index < markerNode.index + 4 && a.get('d')); assert.ok(markerPath, `${marker} real marker shape`); assert.ok(styleValue(markerPath.attributes, 'fill') && styleValue(markerPath.attributes, 'stroke'), `${marker} fill/stroke`); const point = parsePathPoints(path.attributes.get('d')).at(-1); return {x: point.x - width, y: point.y - height / 2, width, height}; }
function assertRouteIntersections(routes) { for (let first = 0; first < routes.length; first += 1) for (let second = first + 1; second < routes.length; second += 1) { const [left, right] = [routes[first], routes[second]]; const sharesTerminal = left.source === right.source || left.source === right.target || left.target === right.source || left.target === right.target; assert.ok(sharesTerminal || !routeIntersects(left.points, right.points), `${left.id}/${right.id} semantic, structural, and legend routes do not intersect`); } }
function assertPaintOrder(svgNodes, routes, nodeBoxes) { const lastRoute = Math.max(...routes.map(({svg}) => svg.index)); for (const node of svgNodes.filter(({name}) => ['rect', 'path', 'polygon'].includes(name))) if (node.index > lastRoute && !node.attributes.get('data-node-id') && styleValue(node.attributes, 'fill') !== 'none' && styleValue(node.attributes, 'fill') !== 'transparent') { const mask = node.name === 'rect' ? {x: number(node.attributes.get('x'), 'mask x'), y: number(node.attributes.get('y'), 'mask y'), width: number(node.attributes.get('width'), 'mask width'), height: number(node.attributes.get('height'), 'mask height')} : undefined; assert.ok(!mask || routes.every(({points}) => !routeHitsBox(points, mask)), 'later painted mask cannot cover a route'); }
  for (const route of routes) for (const [id, box] of nodeBoxes) if (id !== route.source && id !== route.target) assert.equal(routeHitsBox(route.points, box), false, `${route.id} avoids nonterminal node ${id}`);
}
export function assertDiagram(drawio, svg) {
  const cells = parseDrawio(drawio); const vertices = cells.filter(({attributes: a}) => a.get('vertex') === '1'); const nodes = vertices.map(({attributes: a}) => a.get('id')); assert.deepEqual(nodes.sort(), [...DIAGRAM_NODES].sort(), 'exact Draw.io node inventory'); const nodeById = new Map(vertices.map((node) => [node.attributes.get('id'), node])); const svgNodes = parseSvg(svg); const nodeBoxes = new Map();
  for (const id of DIAGRAM_NODES) { const drawioBox = bounds(nodeById.get(id)); const svgBox = svgNodeBounds(svgNodes, id); assert.deepEqual(svgBox, drawioBox, `${id} actual SVG/Draw.io bounds parity`); nodeBoxes.set(id, svgBox); }
  const edges = cells.filter(({attributes: a}) => a.get('edge') === '1'); const routes = [];
  for (const [id, source, target, role] of CONNECTOR_INVENTORY) { const edge = edges.find(({attributes: a}) => a.get('id') === id); assert.ok(edge, `Draw.io edge ${id}`); assert.equal(edge.attributes.get('source'), source, `${id}.source`); assert.equal(edge.attributes.get('target'), target, `${id}.target`); const expected = drawioRoute(edge, nodeById); const path = svgPath(svgNodes, id); assert.deepEqual([path.attributes.get('data-source'), path.attributes.get('data-target'), path.attributes.get('data-role')], [source, target, role], `${id} semantic parity`); const actual = parsePathPoints(path.attributes.get('d')); equalRoute(actual, expected, `${id} real route parity`); const expectedStyle = ROLE_STYLES[role]; assert.equal(styleValue(path.attributes, 'stroke'), expectedStyle.stroke, `${id} stroke`); assert.equal(number(styleValue(path.attributes, 'stroke-width'), `${id} width`), expectedStyle.width, `${id} width`); assert.equal(path.attributes.get('stroke-dasharray') ?? '', expectedStyle.dash, `${id} dash`); const label = svgNodes.find(({name, attributes: a}) => name === 'text' && a.get('data-edge-id') === id); assert.ok(label, `${id} visible label`); assert.ok(number(label.attributes.get('font-size'), `${id} label font`) >= 15, `${id} label typography`); const marker = markerBox(svgNodes, path); for (const [nodeId, box] of nodeBoxes) if (nodeId !== target) assert.equal(routeHitsBox([actual.at(-1), {x: marker.x, y: marker.y}], box), false, `${id} marker avoids ${nodeId}`); routes.push({id, source, target, role, points: actual, svg: path, marker, label}); }
  assert.doesNotMatch(drawio, /(?:sourcePoint|targetPoint|dataRoute)/u, 'fallback route claims forbidden');
  assert.doesNotMatch(svg, /(?:dataRoute|data-terminal)/u, 'SVG self-reported route claims forbidden');
  assertRouteIntersections(routes); assertPaintOrder(svgNodes, routes, nodeBoxes);
  for (const route of routes) { const labelBox = {x: number(route.label.attributes.get('x'), `${route.id} label x`), y: number(route.label.attributes.get('y'), `${route.id} label y`) - 15, width: Math.max(15, String(route.label.attributes.get('data-label') ?? route.id).length * 8), height: 18}; assert.equal(routeHitsBox(route.points, labelBox), false, `${route.id} label has 8px path clearance`); }
  const viewBox = svgNodes.find(({name}) => name === 'svg')?.attributes.get('viewBox'); const width = parseBounds(viewBox, 'viewBox').width; const scale = 800 / width; for (const [id, box] of nodeBoxes) { assert.ok(box.width * scale >= 32 && box.height * scale >= 28, `${id} node horizontal/vertical padding 16/14px`); const title = svgNodes.find(({name, attributes: a}) => name === 'text' && a.get('data-header-for') === id); const type = svgNodes.find(({name, attributes: a}) => name === 'text' && a.get('data-type-for') === id); if (title && type) assert.ok(Math.abs(number(type.attributes.get('y'), `${id} type y`) - number(title.attributes.get('y'), `${id} title y`)) * scale >= 22, `${id} title/type baseline 22px`); }
  for (const errorId of ['bad-record-error', 'technical-failure-error', 'unknown-external-effect-error']) assert.ok(routes.some(({source}) => source === errorId && ['rerun-partition', 'checkpoint-recovery', 'reconcile-authority', 'manual-terminal'].includes(routes.find(({source: candidate}) => candidate === errorId)?.target)), `${errorId} has terminal recovery`);
  assert.ok(routes.some(({id, source, target}) => id === 'backpressure-to-stream' && source === 'backpressure-controller' && target === 'stream-boundary'), 'backpressure remains attached to stream boundary');
  return {nodes, edges, routes};
}
function fixtureDiagram() {
  const position = new Map([
    ['order-input', [0, 150]], ['batch-boundary', [220, 0]], ['batch-validate', [440, 0]], ['batch-normalize', [660, 0]], ['batch-price', [880, 0]], ['batch-risk', [1100, 0]], ['batch-output', [1320, 0]], ['batch-barrier', [1540, 0]], ['batch-release', [1760, 0]], ['batch-published-output', [1980, 0]],
    ['stream-boundary', [220, 300]], ['stream-validate', [440, 300]], ['stream-normalize', [660, 300]], ['stream-price', [880, 300]], ['stream-risk', [1100, 300]], ['stream-output', [1320, 300]], ['stream-window-state', [1540, 300]], ['stream-checkpoint', [1760, 300]], ['stream-continuous-output', [1980, 300]],
    ['bad-record-error', [220, 600]], ['technical-failure-error', [660, 600]], ['unknown-external-effect-error', [1100, 600]], ['backpressure-controller', [1980, 600]], ['rerun-partition', [220, 900]], ['checkpoint-recovery', [660, 900]], ['reconcile-authority', [1100, 900]], ['manual-terminal', [1540, 900]],
    ['legend-data-flow', [0, 1200]], ['legend-backpressure', [440, 1200]], ['legend-error', [880, 1200]], ['legend-recovery', [1320, 1200]],
  ]);
  const box = (id) => { const [x, y] = position.get(id); return {x, y, width: 160, height: 120}; };
  const nodes = DIAGRAM_NODES.map((id) => { const item = box(id); return `<mxCell id="${id}" vertex="1"><mxGeometry x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" as="geometry"/></mxCell>`; }).join('');
  const route = (source, target) => { const left = box(source); const right = box(target); return [{x: left.x + left.width, y: left.y + left.height / 2}, {x: right.x, y: right.y + right.height / 2}]; };
  const edges = CONNECTOR_INVENTORY.map(([id, source, target]) => `<mxCell id="${id}" edge="1" source="${source}" target="${target}" style="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"><mxGeometry relative="1" as="geometry"/></mxCell>`).join('');
  const markerDefs = Object.entries(ROLE_STYLES).map(([role, style]) => `<marker id="arrow-${role}" markerWidth="12" markerHeight="12"><path d="M 0 0 L 12 6 L 0 12 z" fill="${style.stroke}" stroke="${style.stroke}"/></marker>`).join('');
  const shapes = DIAGRAM_NODES.map((id) => { const item = box(id); return `<rect data-node-id="${id}" x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" fill="#FFFFFF" stroke="#0F172A"/><text data-header-for="${id}" x="${item.x + 16}" y="${item.y + 28}" font-size="15">${id}</text><text data-type-for="${id}" x="${item.x + 16}" y="${item.y + 94}" font-size="15">Filter</text>`; }).join('');
  const paths = CONNECTOR_INVENTORY.map(([id, source, target, role]) => { const points = route(source, target); const style = ROLE_STYLES[role]; const labelX = (points[0].x + points[1].x) / 2; const labelY = (points[0].y + points[1].y) / 2 - 24; return `<path data-edge-id="${id}" data-source="${source}" data-target="${target}" data-role="${role}" d="M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}" stroke="${style.stroke}" stroke-width="${style.width}" stroke-dasharray="${style.dash}" fill="none" marker-end="url(#arrow-${role})"/><text data-edge-id="${id}" data-label="${id}" x="${labelX}" y="${labelY}" font-size="15">${id}</text>`; }).join('');
  return {drawio: `<mxfile><root>${nodes}${edges}</root></mxfile>`, svg: `<svg viewBox="0 0 2200 1400"><defs>${markerDefs}</defs>${shapes}${paths}</svg>`};
}

test('STY-09 helper validators reject semantic, table, source, and geometry mutations', () => {
  const article = `---\n${frontMatterFixture(EXACT_METADATA)}\n---\n${REQUIRED_WRAPPERS.map(exactWrapperTag).join('\n')}\n说明性场景（Tego Arch 分析）。Filter 接受输入并执行转换或判定，产生输出、过滤原因或错误分类。Filter 不证明无状态、纯函数、幂等或并行。Pipe 传递输出并承载容量、缓冲、确认、顺序和错误。Pipe 不自动形成可靠消息队列或事务边界。Pipeline 组合或连接兼容输入合同和输出合同。Pipeline 不保证交换律或事务。Pipes and Filters 不等于消息队列、工作流引擎、事件驱动架构、ETL 产品、Saga 或 shell pipeline。批处理轨：校验、标准化、定价、风险标记、汇总/输出。流处理轨：校验、标准化、定价、风险标记、汇总/输出。\n${PROHIBITIONS.join('。')}。\n单体处理函数先提取一个 Filter，固定中间合同和幂等键，再建立有界 Pipe 与重放边界。${STOP_CONDITIONS.join('。')}。\n输入结构及身份；成功输出与过滤原因；状态位置；容量和缓冲上限；重放与幂等边界；所有者。有界缓冲。暂停读取、降低并发、延迟确认、缩小准入、负载削减或拒绝。背压是逐边界容量协议，在不支持反馈的不兼容边界中断。\n| 维度 | 批处理轨 | 流处理轨 | 决策问题 |\n| --- | --- | --- | --- |\n${DIMENSION_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n| 故障 | 检测 | 自动响应 | 停止条件 | 人工所有者 |\n| --- | --- | --- | --- | --- |\n${FAILURE_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}`;
  assertExactMetadata(article); assertRequiredWrappers(article); assertConstructsAndOrder(article); assertDimensionMatrix(article); assertFailureContracts(article); assertNarrativeBoundaries(article);
  for (const key of Object.keys(EXACT_METADATA)) {
    const removed = removeFrontMatterField(article, key); assert.notEqual(removed, article, `${key} deletion mutation applies`); assert.throws(() => assertExactMetadata(removed), assert.AssertionError, `${key} deletion rejected`);
    assert.throws(() => assertExactMetadata(changeFrontMatterField(article, key)), assert.AssertionError, `${key} changed value rejected`);
  }
  for (const wrapper of REQUIRED_WRAPPERS) for (const [label, from, to] of [['class', 'className=', 'classNameX=' ], ['role', 'role="region"', 'role="table"'], ['aria', 'aria-label=', 'aria-labelX='], ['tab index', 'tabIndex={0}', 'tabIndex={-1}'], ['key handler', 'onKeyDown={handleHorizontalArrowKey}', 'onKeyDown={undefined}']]) { const tag = exactWrapperTag(wrapper); const changed = replaceOnce(article, tag, replaceOnce(tag, from, to, `${wrapper.aria} ${label}`), `${wrapper.aria} ${label}`); assert.throws(() => assertRequiredWrappers(changed), assert.AssertionError, `${wrapper.aria} ${label} mutation rejected`); }
  for (const row of DIMENSION_ROWS) { const exact = `| ${row.join(' | ')} |`; assert.throws(() => assertDimensionMatrix(replaceOnce(article, `${exact}\n`, '', `${row[0]} row deletion`)), assert.AssertionError, `${row[0]} deletion rejected`); for (let index = 1; index < row.length; index += 1) { const changed = [...row]; changed[index] = '错误语义'; assert.throws(() => assertDimensionMatrix(replaceOnce(article, exact, `| ${changed.join(' | ')} |`, `${row[0]} cell ${index}`)), assert.AssertionError, `${row[0]} cell ${index} rejected`); } }
  const [firstDimension, secondDimension] = DIMENSION_ROWS; const firstRow = `| ${firstDimension.join(' | ')} |`; const secondRow = `| ${secondDimension.join(' | ')} |`; assert.throws(() => assertDimensionMatrix(article.replace(firstRow, '__SWAP__').replace(secondRow, firstRow).replace('__SWAP__', secondRow)), assert.AssertionError, 'matrix row swap rejected'); assert.throws(() => assertDimensionMatrix(replaceOnce(article, firstRow, `| ${[firstDimension[0], firstDimension[2], firstDimension[1], firstDimension[3]].join(' | ')} |`, 'batch/stream answer swap')), assert.AssertionError, 'batch/stream answer swap rejected');
  for (const row of FAILURE_ROWS) { const exact = `| ${row.join(' | ')} |`; assert.throws(() => assertFailureContracts(replaceOnce(article, `${exact}\n`, '', `${row[0]} row deletion`)), assert.AssertionError, `${row[0]} failure deletion rejected`); for (let index = 1; index < row.length; index += 1) { const changed = [...row]; changed[index] = '错误故障语义'; assert.throws(() => assertFailureContracts(replaceOnce(article, exact, `| ${changed.join(' | ')} |`, `${row[0]} failure cell ${index}`)), assert.AssertionError, `${row[0]} failure cell ${index} rejected`); } }
  for (const [label, changed, validator] of [
    ['matrix answer', replaceOnce(article, DIMENSION_ROWS[0][1], DIMENSION_ROWS[0][2], 'matrix answer'), assertDimensionMatrix],
    ['failure owner', replaceOnce(article, FAILURE_ROWS[0][4], '所有者待定', 'failure owner'), assertFailureContracts],
    ['false Filter guarantee', `${article}\n所有 Filter 都是无状态、纯函数且幂等。`, assertConstructsAndOrder],
    ['queue equivalence', `${article}\nPipeline 就是消息队列。`, assertConstructsAndOrder],
    ['workflow equivalence', `${article}\nPipes and Filters 等于工作流引擎。`, assertConstructsAndOrder],
    ['event equivalence', `${article}\nPipeline 就是事件驱动架构。`, assertConstructsAndOrder],
    ['ETL equivalence', `${article}\nPipes and Filters 等于 ETL 产品。`, assertConstructsAndOrder],
    ['Saga equivalence', `${article}\nPipeline 就是 Saga。`, assertConstructsAndOrder],
    ['shell equivalence', `${article}\nshell pipeline 等于 Pipeline。`, assertConstructsAndOrder],
    ['reverse business data', `${article}\n背压使业务数据反向倒流。`, assertFailureContracts],
    ['automatic end-to-end flow control', `${article}\n背压自动提供跨不兼容边界的端到端流控。`, assertFailureContracts],
  ]) assert.throws(() => validator(changed), assert.AssertionError, `${label} mutation rejected`);
  const {drawio, svg} = fixtureDiagram(); assertDiagram(drawio, svg); const detached = replaceOnce(drawio, 'source="order-input"', '', 'terminal'); assert.throws(() => assertDiagram(detached, svg), assert.AssertionError, 'missing terminal rejected'); const changedPort = replaceOnce(drawio, 'exitX=1', 'exitX=0.7', 'port'); assert.throws(() => assertDiagram(changedPort, svg), assert.AssertionError, 'changed port rejected'); assert.throws(() => assertDiagram(replaceOnce(drawio, 'source="order-input"', 'sourcePoint="0,0" source="order-input"', 'fallback point'), svg), assert.AssertionError, 'sourcePoint rejected'); assert.throws(() => assertDiagram(drawio, replaceOnce(svg, 'data-target="stream-boundary"', 'data-target="stream-output"', 'detached backpressure')), assert.AssertionError, 'detached backpressure rejected'); assert.throws(() => assertDiagram(replaceOnce(drawio, 'target="manual-terminal"', 'target="batch-output"', 'error recovery target'), svg), assert.AssertionError, 'error branch without terminal recovery rejected');
});

test('STY-09 source fixture rejects coordinated identity, role, primary, and rights mutations', () => {
  const remoteIds = SOURCE_IDS.slice(0, -1); const ledger = {sources: [...remoteIds.map((id) => ({id, ...REMOTE_SOURCE_CONTRACTS[id]})), {id: SOURCE_IDS.at(-1), ...ILLUSTRATION}], documents: {[ARTICLE]: {citations: remoteIds.map((id) => ({source_id: id, citation_url: REMOTE_SOURCE_CONTRACTS[id].canonical_locator, roles: REMOTE_SOURCE_CONTRACTS[id].citation_roles, manifest_primary: REMOTE_SOURCE_CONTRACTS[id].manifest_primary}))}}};
  const inventory = remoteIds.map((id) => `| ${REMOTE_SOURCE_CONTRACTS[id].canonical_locator} |`).join('\n'); assertRemoteSourceContracts(ledger, inventory);
  const changed = structuredClone(ledger); changed.sources[0].canonical_locator = 'https://example.invalid/fabricated'; changed.documents[ARTICLE].citations[0].citation_url = 'https://example.invalid/fabricated'; assert.throws(() => assertRemoteSourceContracts(changed, inventory), assert.AssertionError, 'coordinated canonical fabrication rejected');
  const primary = structuredClone(ledger); primary.documents[ARTICLE].citations[0].manifest_primary = false; primary.documents[ARTICLE].citations[1].manifest_primary = true; assert.throws(() => assertRemoteSourceContracts(primary, inventory), assert.AssertionError, 'primary reassignment rejected');
  const rights = structuredClone(ledger); rights.sources.at(-1).license_evidence_note = 'fabricated rights'; assert.throws(() => assertRemoteSourceContracts(rights, inventory), assert.AssertionError, 'illustration rights mutation rejected');
});

test('STY-09 article locks metadata, headings, wrappers, components and recovery semantics', () => {
  const {source, body} = articleParts(file(ARTICLE)); assertExactMetadata(source); assert.deepEqual(findMarkdownHeadings(source).filter(({depth}) => depth === 2).map(({text}) => text), EXPECTED_HEADINGS, 'approved H2 order'); assertRequiredWrappers(source); assertConstructsAndOrder(body); assertDimensionMatrix(body); assertFailureContracts(body); assertNarrativeBoundaries(body);
});

test('STY-09 source governance, reciprocal links, and Stage A projection are exact', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8')); assertRemoteSourceContracts(ledger, readFileSync('docs/source-license-inventory.md', 'utf8')); assertRelationsAndProjection();
  for (const source of readContentDocuments()) assert.equal(extractInternalLinks(source).includes('/styles/sty-10'), false, `${source.file} keeps STY-10 non-actionable`);
  const external = extractExternalLinks(readContentDocuments().find(({file: path}) => path === ARTICLE)); for (const expected of Object.values(REMOTE_SOURCE_CONTRACTS)) assert.ok(external.includes(expected.canonical_locator), `article cites ${expected.canonical_locator}`);
});

test('STY-09 Draw.io/SVG locks batch-stream inventory, terminals, ports, routes and recovery endpoints', () => {
  const drawio = file(DRAWIO); const svg = file(SVG); assert.ok(drawio, `${DRAWIO} must exist after implementation`); assert.ok(svg, `${SVG} must exist after implementation`); assertDiagram(drawio, svg);
  const unsafe = replaceOnce(drawio, 'target="reconcile-authority"', 'target="stream-continuous-output"', 'replay endpoint'); assert.throws(() => assertDiagram(unsafe, svg), assert.AssertionError, 'replay cannot enter irreversible output');
});
