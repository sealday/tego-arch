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
export const PROHIBITIONS = Object.freeze(['不保证全局顺序', '不保证端到端 exactly-once 业务效果', '不替代跨步骤业务事务']);
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
  ['batch-barrier-release', 'batch-barrier', 'batch-release', 'data-flow'], ['stream-checkpoint-recovery', 'stream-checkpoint', 'checkpoint-recovery', 'recovery'],
  ['backpressure-to-stream', 'backpressure-controller', 'stream-boundary', 'backpressure'], ['bad-record-isolation', 'bad-record-error', 'manual-terminal', 'error'],
  ['technical-recovery', 'technical-failure-error', 'checkpoint-recovery', 'recovery'], ['unknown-effect-reconcile', 'unknown-external-effect-error', 'reconcile-authority', 'recovery'],
]);

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
}
export function assertDimensionMatrix(source) {
  const rows = table(source, ['维度', '批处理轨', '流处理轨', '决策问题']); exactRows(rows, DIMENSION_ROWS, 'eight-dimension matrix');
  assert.deepEqual(rows.slice(2).map(([dimension]) => dimension), DIMENSIONS, 'dimension row order');
  for (const forbidden of ['批处理天然有序', '流处理天然实时', '微批等于批流合同相同']) assert.equal(source.includes(forbidden), false, `${forbidden} rejected`);
}
export function assertFailureContracts(source) {
  for (const item of FILTER_CONTRACTS) assert.match(source, new RegExp(escapeRegExp(item), 'u'), `Filter contract: ${item}`);
  assert.match(source, /(?:缓冲|队列)[^。；\n]*(?:有界|上限)|有界[^。；\n]*(?:缓冲|队列)/u, 'bounded capacity');
  for (const action of ['暂停读取', '降低并发', '延迟确认', '缩小准入', '负载削减', '拒绝']) assert.match(source, new RegExp(action, 'u'), `capacity response: ${action}`);
  assert.match(source, /背压[^。；\n]*(?:(?:中断|停止)[^。；\n]*(?:不支持|不兼容|无界写入|固定速率)|(?:不支持|不兼容|无界写入|固定速率)[^。；\n]*(?:中断|停止))/u, 'backpressure incompatible-boundary stop');
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
export function parseXml(source) { return [...source.matchAll(/<(mxCell|g|path|rect|text|svg)\b[^>]*>/gu)].map(([tag, name]) => ({name, attributes: attributes(tag), tag})); }
export function parseDrawio(source) { return parseXml(source).filter(({name}) => name === 'mxCell'); }
export function parseSvg(source) { return parseXml(source).filter(({name}) => name !== 'mxCell'); }
export function parsePathPoints(data) {
  assert.ok(data, 'SVG path data'); const points = []; let current = {x: 0, y: 0};
  for (const [, command, values] of data.matchAll(/([MLHV])\s*([\d.\-\s,]+)/gu)) { const nums = values.trim().split(/[\s,]+/u).map(Number); if (command === 'M' || command === 'L') for (let index = 0; index < nums.length; index += 2) { current = {x: nums[index], y: nums[index + 1]}; points.push(current); } else if (command === 'H') for (const x of nums) { current = {x, y: current.y}; points.push(current); } else for (const y of nums) { current = {x: current.x, y}; points.push(current); } }
  return points;
}
function styleMap(value = '') { return new Map(value.split(';').filter(Boolean).map((item) => item.split('=').map((part) => part.trim()))); }
export function effectiveStyle(attributesMap, inherited = new Map()) { const own = styleMap(attributesMap.get('style')); const result = new Map(inherited); for (const [key, value] of own) result.set(key, value); for (const key of ['stroke', 'fill', 'font-size', 'stroke-width', 'marker-end', 'opacity']) if (attributesMap.has(key)) result.set(key, attributesMap.get(key)); return result; }
export function terminalPort(cell, endpoint) { const style = styleMap(cell.attributes.get('style')); const x = Number(style.get(`${endpoint}X`)); const y = Number(style.get(`${endpoint}Y`)); assert.ok(Number.isFinite(x) && Number.isFinite(y), `${cell.attributes.get('id')} has normalized ${endpoint} port`); assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `${endpoint} port normalized`); return {x, y}; }
export function assertDiagram(drawio, svg) {
  const cells = parseDrawio(drawio); const nodes = cells.filter(({attributes: a}) => a.get('vertex') === '1').map(({attributes: a}) => a.get('id')); assert.deepEqual(nodes.sort(), [...DIAGRAM_NODES].sort(), 'exact Draw.io node inventory');
  const edges = cells.filter(({attributes: a}) => a.get('edge') === '1'); for (const [id, source, target, role] of CONNECTOR_INVENTORY) { const edge = edges.find(({attributes: a}) => a.get('id') === id); assert.ok(edge, `Draw.io edge ${id}`); assert.equal(edge.attributes.get('source'), source, `${id}.source`); assert.equal(edge.attributes.get('target'), target, `${id}.target`); assert.deepEqual(terminalPort(edge, 'exit'), {x: 0.5, y: 1}, `${id}.exit port`); assert.deepEqual(terminalPort(edge, 'entry'), {x: 0.5, y: 0}, `${id}.entry port`); const svgPath = parseSvg(svg).find(({name, attributes: a}) => name === 'path' && a.get('data-edge-id') === id); assert.ok(svgPath, `SVG edge ${id}`); assert.deepEqual([svgPath.attributes.get('data-source'), svgPath.attributes.get('data-target'), svgPath.attributes.get('data-role')], [source, target, role], `${id} semantic parity`); assert.ok(parsePathPoints(svgPath.attributes.get('d')).length >= 2, `${id} route geometry`); }
  for (const node of DIAGRAM_NODES) assert.ok(parseSvg(svg).some(({attributes: a}) => a.get('data-node-id') === node), `SVG node ${node}`);
  assert.doesNotMatch(drawio, /(?:sourcePoint|targetPoint|dataRoute)/u, 'fallback route claims forbidden');
  assert.doesNotMatch(svg, /(?:dataRoute|data-terminal)/u, 'SVG self-reported route claims forbidden');
  return {nodes, edges};
}

test('STY-09 helper validators reject semantic, table, source, and geometry mutations', () => {
  const article = `---\n${frontMatterFixture(EXACT_METADATA)}\n---\n${REQUIRED_WRAPPERS.map(exactWrapperTag).join('\n')}\n说明性场景（Tego Arch 分析）。Filter 接受输入并执行转换或判定，产生输出、过滤原因或错误分类。Filter 不证明无状态、纯函数、幂等或并行。Pipe 传递输出并承载容量、缓冲、确认、顺序和错误。Pipe 不自动形成可靠消息队列或事务边界。Pipeline 组合或连接兼容输入合同和输出合同。Pipeline 不保证交换律或事务。批处理轨：校验、标准化、定价、风险标记、汇总/输出。流处理轨：校验、标准化、定价、风险标记、汇总/输出。\n${PROHIBITIONS.join('。')}。\n单体处理函数先提取一个 Filter，固定中间合同和幂等键，再建立有界 Pipe 与重放边界。${STOP_CONDITIONS.join('。')}。\n输入结构及身份；成功输出与过滤原因；状态位置；容量和缓冲上限；重放与幂等边界；所有者。有界缓冲。暂停读取、降低并发、延迟确认、缩小准入、负载削减或拒绝。背压在不支持反馈的不兼容边界中断。\n| 维度 | 批处理轨 | 流处理轨 | 决策问题 |\n| --- | --- | --- | --- |\n${DIMENSION_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n| 故障 | 检测 | 自动响应 | 停止条件 | 人工所有者 |\n| --- | --- | --- | --- | --- |\n${FAILURE_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}`;
  assertExactMetadata(article); assertRequiredWrappers(article); assertConstructsAndOrder(article); assertDimensionMatrix(article); assertFailureContracts(article); assertNarrativeBoundaries(article);
  for (const key of Object.keys(EXACT_METADATA)) {
    const removed = removeFrontMatterField(article, key); assert.notEqual(removed, article, `${key} deletion mutation applies`); assert.throws(() => assertExactMetadata(removed), assert.AssertionError, `${key} deletion rejected`);
    assert.throws(() => assertExactMetadata(changeFrontMatterField(article, key)), assert.AssertionError, `${key} changed value rejected`);
  }
  for (const [label, from, to] of [['class', 'className=', 'classNameX=' ], ['role', 'role="region"', 'role="table"'], ['aria', 'aria-label=', 'aria-labelX='], ['tab index', 'tabIndex={0}', 'tabIndex={-1}'], ['key handler', 'onKeyDown={handleHorizontalArrowKey}', 'onKeyDown={undefined}']]) assert.throws(() => assertRequiredWrappers(replaceOnce(article, from, to, label)), assert.AssertionError, `${label} mutation rejected`);
  for (const [label, changed, validator] of [
    ['matrix answer', replaceOnce(article, DIMENSION_ROWS[0][1], DIMENSION_ROWS[0][2], 'matrix answer'), assertDimensionMatrix],
    ['failure owner', replaceOnce(article, FAILURE_ROWS[0][4], '所有者待定', 'failure owner'), assertFailureContracts],
    ['false Filter guarantee', `${article}\n所有 Filter 都是无状态、纯函数且幂等。`, assertConstructsAndOrder],
  ]) assert.throws(() => validator(changed), assert.AssertionError, `${label} mutation rejected`);
  const drawio = `<mxfile><root>${DIAGRAM_NODES.map((id) => `<mxCell id="${id}" vertex="1"/>`).join('')}${CONNECTOR_INVENTORY.map(([id, source, target]) => `<mxCell id="${id}" edge="1" source="${source}" target="${target}" style="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"/>`).join('')}</root></mxfile>`;
  const svg = `<svg>${DIAGRAM_NODES.map((id) => `<g data-node-id="${id}"/>`).join('')}${CONNECTOR_INVENTORY.map(([id, source, target, role]) => `<path data-edge-id="${id}" data-source="${source}" data-target="${target}" data-role="${role}" d="M 0 0 L 10 10"/>`).join('')}</svg>`;
  assertDiagram(drawio, svg); const detached = replaceOnce(drawio, 'source="order-input"', '', 'terminal'); assert.throws(() => assertDiagram(detached, svg), assert.AssertionError, 'missing terminal rejected'); const changedPort = replaceOnce(drawio, 'exitX=0.5', 'exitX=0.7', 'port'); assert.throws(() => assertDiagram(changedPort, svg), assert.AssertionError, 'changed port rejected');
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
