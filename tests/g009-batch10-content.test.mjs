import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
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
export const EXPECTED_CURRENT_PROJECTION = Object.freeze({completed: 62, documents: 105, sources: 544});
const CONTENT_ROOT = fileURLToPath(new URL('../content/', import.meta.url));
const CONTENT_DOCUMENTS = (await readContentDocuments(CONTENT_ROOT)).map((document) => ({...document, file: `content/${document.file}`}));
export const SOURCE_IDS = Object.freeze([
  'src-microsoft-pipes-filters-pattern',
  'src-apache-beam-programming-guide',
  'src-reactive-streams-1-0-4',
  'src-gnu-bash-pipelines',
  'src-atlas-sty09-pipes-filters-order-processing',
]);
export const EXPECTED_HEADINGS = Object.freeze([
  '学习问题', '一页摘要', '事实边界', '架构图', '控制权与任务流',
  '关键源码导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源',
]);
export const EXPECTED_MIGRATION_HEADINGS = Object.freeze([
  '可直接复用的机制', '只能有限类比的部分', '不应照搬的部分',
]);
export const RELATIONS = Object.freeze({
  depends_on: ['STY-00', 'STY-05', 'STY-06'],
  adjacent_topics: ['STY-05', 'STY-06'],
  related_cases: ['/cases/apache-kafka-consumer-groups'],
  related_questions: [],
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
  recovery: Object.freeze({stroke: '#0369A1', width: 3, dash: '10 5 2 5'}),
});
export const PRODUCTION_NODES = Object.freeze(DIAGRAM_NODES.filter((id) => !id.startsWith('legend-')).map((id) => `node-${id}`));
export const PRODUCTION_CONNECTORS = Object.freeze([
  ...CONNECTOR_INVENTORY.map(([id, source, target, role]) => [id, `node-${source}`, `node-${target}`, role, true]),
  ['bad-record-branch', 'node-stream-validate', 'node-bad-record-error', 'error', true],
  ['technical-failure-branch', 'node-stream-window-state', 'node-technical-failure-error', 'error', true],
  ['unknown-effect-branch', 'node-stream-risk', 'node-unknown-external-effect-error', 'error', true],
  ['bad-record-rerun', 'node-bad-record-error', 'node-rerun-partition', 'recovery', true],
  ['legend-edge-data-flow', 'legend-anchor-data-flow-source', 'legend-anchor-data-flow-target', 'data-flow', false],
  ['legend-edge-backpressure', 'legend-anchor-backpressure-source', 'legend-anchor-backpressure-target', 'backpressure', false],
  ['legend-edge-error', 'legend-anchor-error-source', 'legend-anchor-error-target', 'error', false],
  ['legend-edge-recovery', 'legend-anchor-recovery-source', 'legend-anchor-recovery-target', 'recovery', false],
]);
export const REGION_INVENTORY = Object.freeze(['batch', 'stream', 'capacity', 'failure', 'legend'].map((name) => `region-${name}`));
export const LEGEND_ROLES = Object.freeze(['data-flow', 'backpressure', 'error', 'recovery']);
export const NOTE_INVENTORY = Object.freeze([
  ['note-global-order', '不保证全局顺序'],
  ['note-exactly-once', '不保证端到端 exactly-once 业务效果'],
  ['note-transaction', '不替代跨步骤业务事务'],
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
export function assertArticleHeadingContract(source) {
  const headings = findMarkdownHeadings(source);
  assert.deepEqual(headings.filter(({level}) => level === 2).map(({text}) => text), EXPECTED_HEADINGS, 'approved H2 order');
  const migration = headings.find(({level, text}) => level === 2 && text === '可迁移经验');
  assert.ok(migration, '可迁移经验 H2');
  const nextH2 = headings.find(({level, offset}) => level === 2 && offset > migration.offset);
  const migrationHeadings = headings
    .filter(({level, offset}) => level === 3 && offset > migration.offset && (!nextH2 || offset < nextH2.offset))
    .map(({text}) => text);
  assert.deepEqual(migrationHeadings, EXPECTED_MIGRATION_HEADINGS, 'approved H3 order under 可迁移经验');
}
export function assertRequiredWrappers(source) {
  for (const wrapper of REQUIRED_WRAPPERS) assert.ok(source.includes(exactWrapperTag(wrapper)), `exact scroll wrapper: ${wrapper.aria}`);
  assert.equal((source.match(/role="region"/gu) ?? []).length, 3, 'exactly three horizontal scroll owners');
}
export function assertConstructsAndOrder(source) {
  for (const [name, affirmative, boundary] of CONSTRUCTS) { clause(source, affirmative, `${name} affirmative responsibility`); assert.match(source, boundary, `${name} explicit non-guarantee`); }
  assert.match(source, /说明性场景（Tego Arch 架构知识项目分析）/u, 'illustrative scene label');
  for (const track of ['批处理轨', '流处理轨']) {
    const match = new RegExp(`${track}：([^。；\\n]+)`, 'u').exec(source); assert.ok(match, `${track} transformation list`);
    for (const step of ORDER_STEPS) assert.match(match[1], new RegExp(escapeRegExp(step), 'u'), `${track} includes ${step}`);
  }
  for (const forbidden of [/所有[^。；\n]*Filter[^。；\n]*(?:无状态|纯函数|幂等)/u, /Pipe[^。；\n]*(?:就是|等于)[^。；\n]*可靠消息队列/u, /步骤[^。；\n]*(?:可以|能够)[^。；\n]*任意(?:交换|重排)/u, /Pipeline[^。；\n]*(?:提供|形成)[^。；\n]*事务/u]) assert.doesNotMatch(source, forbidden, 'false construct guarantee');
  for (const counterpart of FORBIDDEN_EQUIVALENCES) assert.doesNotMatch(source, new RegExp(`(?:Pipes? and Filters|Pipeline)[^。；\\n]*(?:就是|(?<!不)等于|是|属于|可视为|等同于)[^。；\\n]*${escapeRegExp(counterpart)}|${escapeRegExp(counterpart)}[^。；\\n]*(?:就是|(?<!不)等于|是|属于|可视为|等同于)[^。；\\n]*(?:Pipes? and Filters|Pipeline)`, 'iu'), `${counterpart} equivalence prohibited`);
}
export function assertDimensionMatrix(source) {
  const rows = table(source, ['维度', '批处理轨', '流处理轨', '决策问题']); exactRows(rows, DIMENSION_ROWS, 'eight-dimension matrix');
  assert.deepEqual(rows.slice(2).map(([dimension]) => dimension), DIMENSIONS, 'dimension row order');
  for (const forbidden of ['批处理天然有序', '流处理天然实时', '微批等于批流合同相同']) assert.equal(source.includes(forbidden), false, `${forbidden} rejected`);
  assert.doesNotMatch(source, /(?:批处理|流处理)[^。；\n]*(?:天然|自动)[^。；\n]*(?:相同|等价)|微批[^。；\n]*(?:等于|意味着)[^。；\n]*批流合同相同/u, 'batch/stream false equivalence');
}
export function assertFailureContracts(source) {
  const filterSection = /(?:^|\n)## (?:控制权与任务流|Filter、Pipe 与 Pipeline 合同)\n([\s\S]*?)(?=\n## |$)/u.exec(source)?.[1]; assert.ok(filterSection, 'Filter contract section'); for (const item of FILTER_CONTRACTS) assert.match(filterSection, new RegExp(escapeRegExp(item), 'u'), `Filter contract: ${item}`);
  assert.match(source, /(?:缓冲|队列)[^。；\n]*(?:有界|上限)|有界[^。；\n]*(?:缓冲|队列)/u, 'bounded capacity');
  for (const action of ['暂停读取', '降低并发', '延迟确认', '缩小准入', '负载削减', '拒绝']) assert.match(source, new RegExp(action, 'u'), `capacity response: ${action}`);
  assert.match(source, /背压[^。；\n]*(?:(?:中断|停止)[^。；\n]*(?:不支持|不兼容|无界写入|固定速率)|(?:不支持|不兼容|无界写入|固定速率)[^。；\n]*(?:中断|停止))/u, 'backpressure incompatible-boundary stop');
  assert.match(source, /背压[^。；\n]*(?:逐边界|容量协议)|(?:逐边界|容量协议)[^。；\n]*背压/u, 'backpressure is a per-boundary capacity protocol');
  for (const forbidden of [/背压[^。；\n]*(?:使|让)(?:业务数据|数据)[^。；\n]*(?:倒流|反向)/u, /背压[^。；\n]*(?:自动|天然)[^。；\n]*(?:端到端|跨(?:越)?不兼容|跨网络|跨队列)/u]) assert.doesNotMatch(source, forbidden, 'backpressure false propagation');
  const rows = table(source, ['故障', '检测', '自动响应', '停止条件', '人工所有者']); exactRows(rows, FAILURE_ROWS, 'failure ownership');
  for (const forbidden of [/无限重试/u, /悄悄丢失/u, /默认值[^。；\n]*(?:成功|成功处理)/u, /(?:阶段重跑|恢复)[^。；\n]*(?:直接|盲目)重放[^。；\n]*(?:支付|通知|不可逆)/u]) assert.doesNotMatch(source, forbidden, 'unsafe recovery claim');
}
export function assertNarrativeBoundaries(source) {
  for (const prohibition of PROHIBITIONS) assert.match(source, new RegExp(escapeRegExp(prohibition), 'u'), prohibition);
  for (const migration of ['单体处理函数', '提取一个', '中间合同', '幂等键', '有界 Pipe', '重放边界']) assert.match(source, new RegExp(escapeRegExp(migration), 'u'), `migration: ${migration}`);
  for (const condition of STOP_CONDITIONS) assert.match(source, new RegExp(escapeRegExp(condition), 'u'), `stop condition: ${condition}`);
}

export const REMOTE_SOURCE_CONTRACTS = Object.freeze({
  'src-microsoft-pipes-filters-pattern': Object.freeze({canonical_locator: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/pipes-and-filters', transport_locator: 'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/c8d425de181f581df8ec98953ec6cd5f1825f0ba/docs/patterns/pipes-and-filters-content.md', title: 'Pipes and Filters pattern', author_or_org: 'Microsoft', version: 'MicrosoftDocs architecture-center commit c8d425de181f581df8ec98953ec6cd5f1825f0ba; source ms.date 2024-04-10', checked_at: '2026-08-17', source_kind: 'vendor-reference-architecture', tier: 'first-party', license: 'CC-BY-4.0', license_scope: 'The named Microsoft Learn Pipes and Filters page at the pinned official documentation commit; code, trademarks, linked works, media, and third-party assets excluded', license_evidence_url: 'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/c8d425de181f581df8ec98953ec6cd5f1825f0ba/LICENSE', license_evidence_note: 'The pinned official Architecture Center repository LICENSE applies CC BY 4.0 to the documentation repository.', copyright_policy: 'vendor-claims-separated', allowed_evidence_roles: ['definition', 'runtime-fact'], citation_roles: ['definition', 'runtime-fact'], manifest_primary: true, usage_boundary: 'Supports Filter/Pipe composition, schema-compatible reordering conditions, and duplicate-message and failure considerations only; it does not prove a universal delivery, transaction, idempotency, ordering, or backpressure guarantee.'}),
  'src-apache-beam-programming-guide': Object.freeze({canonical_locator: 'https://beam.apache.org/documentation/programming-guide/', transport_locator: 'https://raw.githubusercontent.com/apache/beam/befa812ecc546d19c4d47816388ffbb12bb7c11b/website/www/site/content/en/documentation/programming-guide.md', title: 'Apache Beam Programming Guide', author_or_org: 'Apache Software Foundation', version: 'apache/beam commit befa812ecc546d19c4d47816388ffbb12bb7c11b; Programming Guide last updated 2026-08-16', checked_at: '2026-08-17', source_kind: 'official-docs', tier: 'primary', license: 'Apache-2.0', license_scope: 'The named Apache Beam Programming Guide file at the pinned official repository commit; code samples, trademarks, linked works, media, and third-party assets excluded', license_evidence_url: 'https://raw.githubusercontent.com/apache/beam/befa812ecc546d19c4d47816388ffbb12bb7c11b/LICENSE', license_evidence_note: 'The pinned official Apache Beam repository LICENSE applies Apache License 2.0 to the named documentation file; this article copies no guide text or code.', copyright_policy: 'facts-and-short-quotation', allowed_evidence_roles: ['runtime-fact'], citation_roles: ['runtime-fact'], manifest_primary: false, usage_boundary: 'Supports bounded and unbounded input and windowing distinctions only; it does not require Beam or transfer Beam execution semantics to every pipeline.'}),
  'src-reactive-streams-1-0-4': Object.freeze({canonical_locator: 'https://www.reactive-streams.org/', transport_locator: 'https://raw.githubusercontent.com/reactive-streams/reactive-streams-jvm/v1.0.4/README.md', title: 'Reactive Streams for the JVM 1.0.4', author_or_org: 'Reactive Streams Initiative', version: 'Reactive Streams for the JVM 1.0.4, released 2022-05-26; tag v1.0.4 at 944163a4b2477a2bebaaada86b0ba910b6302f2f', checked_at: '2026-08-17', source_kind: 'standard', tier: 'primary', license: 'MIT-0', license_scope: 'The Reactive Streams JVM v1.0.4 README specification; implementation code, TCK, examples, artifacts, trademarks, and linked works excluded', license_evidence_url: 'https://raw.githubusercontent.com/reactive-streams/reactive-streams-jvm/v1.0.4/LICENSE', license_evidence_note: 'The v1.0.4 project site and repository license identify MIT No Attribution (SPDX: MIT-0) for the specification and artifacts; this article uses a factual summary only.', copyright_policy: 'facts-and-short-quotation', allowed_evidence_roles: ['runtime-fact'], citation_roles: ['runtime-fact'], manifest_primary: false, usage_boundary: 'Supports the minimum asynchronous stream protocol with non-blocking backpressure and its stated exclusions only; it does not prove end-to-end control across incompatible APIs, queues, processes, or networks.'}),
  'src-gnu-bash-pipelines': Object.freeze({canonical_locator: 'https://www.gnu.org/software/bash/manual/html_node/Pipelines.html', transport_locator: 'https://www.gnu.org/software/bash/manual/html_node/Pipelines.html', title: 'Pipelines', author_or_org: 'Free Software Foundation', version: 'GNU Bash Reference Manual Edition 5.3, last updated 2025-05-18', checked_at: '2026-08-17', source_kind: 'official-docs', tier: 'primary', license: 'GFDL-1.3-or-later', license_scope: 'GNU Bash Reference Manual Edition 5.3; Bash program source, linked works, and separately licensed material excluded', license_evidence_url: 'https://www.gnu.org/software/bash/manual/bash.html#GNU-Free-Documentation-License', license_evidence_note: 'The Bash Reference Manual identifies GNU Free Documentation License 1.3 or later; this article uses no manual excerpt or adaptation.', copyright_policy: 'facts-and-short-quotation', allowed_evidence_roles: ['historical-context'], citation_roles: ['historical-context'], manifest_primary: false, usage_boundary: 'Supports the process-pipeline exit-status and pipefail historical example only; it does not define distributed Pipes and Filters semantics.'}),
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
export function assertSourceLinkHealth(health) {
  for (const [id, expected] of Object.entries(REMOTE_SOURCE_CONTRACTS)) {
    const entry = health.results?.find(({transport_locator}) => transport_locator === expected.transport_locator); assert.ok(entry, `${id} link-health entry`); assert.deepEqual(entry.source_ids, [id], `${id} link-health source identity`);
    assert.deepEqual(entry.last_attempt, {at: '2026-08-17T00:00:00.000Z', outcome: 'healthy', final_transport_locator: expected.transport_locator, http_status: 200, login_wall_detected: false, redirects: []}, `${id} audited attempt`);
    assert.deepEqual(entry.last_success, {at: '2026-08-17T00:00:00.000Z', outcome: 'healthy', final_transport_locator: expected.transport_locator, http_status: 200, login_wall_detected: false}, `${id} audited success`);
    assert.deepEqual(entry.attempt_history.at(-1), entry.last_success, `${id} audited history`); assert.equal(entry.review_status, 'healthy', `${id} review status`);
  }
}
export function assertRelationsAndProjection() {
  const documents = CONTENT_DOCUMENTS; const article = documents.find(({file: path}) => path === ARTICLE); assert.ok(article, 'STY-09 article appears in content documents');
  const links = extractInternalLinks(article); for (const route of ['/styles/sty-05', '/styles/sty-06', '/cases/apache-kafka-consumer-groups', '/quality-attributes/qa-03', '/paths/reliability-state']) assert.ok(links.includes(route), `visible STY-09 link: ${route}`);
  assert.equal(links.includes('/styles/sty-10'), false, 'STY-10 remains non-actionable');
  const reciprocal = [
    ['content/styles/sty-05-microservices.mdx', '/styles/sty-09'], ['content/styles/sty-06-event-driven-architecture.mdx', '/styles/sty-09'],
    ['content/cases/apache-kafka-consumer-groups.mdx', '/styles/sty-09'], ['content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx', '/styles/sty-09'], ['content/paths/04-reliability-state.mdx', '/styles/sty-09'],
  ];
  for (const [path, route] of reciprocal) { const target = documents.find((document) => document.file === path); assert.ok(target, `${path} exists`); assert.ok(extractInternalLinks(target).includes(route), `${path} reciprocates STY-09`); }
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8')); assert.deepEqual({completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}, EXPECTED_CURRENT_PROJECTION, 'current Stage B projection');
}

function attributes(tag) { return new Map([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)].map(([, key, double, single]) => [key, double ?? single])); }
function decodeXmlText(value) { return value.replace(/&(?:#(\d+)|#x([\da-f]+)|amp|lt|gt|quot|apos);/giu, (entity, decimal, hex) => {
  if (decimal) return String.fromCodePoint(Number(decimal)); if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
  return ({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"})[entity] ?? entity;
}); }
export function parseDrawio(source) {
  const cells = [...source.matchAll(/<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/gu)].map(([raw]) => {
    const open = /^<mxCell\b[^>]*>/u.exec(raw)?.[0] ?? raw; const geometry = /<mxGeometry\b([^>]*)/u.exec(raw)?.[1] ?? ''; const array = /<Array\s+as="points"[^>]*>([\s\S]*?)<\/Array>/u.exec(raw); const points = array ? [...array[1].matchAll(/<mxPoint\b([^>]*)/gu)].map(([, point]) => attributes(`<mxPoint ${point}>`)) : []; const misplacedPoints = [...raw.matchAll(/<mxPoint\b([^>]*)/gu)].length - points.length;
    return {name: 'mxCell', attributes: attributes(open), geometry: attributes(`<mxGeometry ${geometry}>`), points, hasPointsArray: Boolean(array), misplacedPoints, raw, label: decodeXmlText(attributes(open).get('value') ?? '')};
  });
  return {cells, nodes: cells.filter(({attributes: item}) => item.get('vertex') === '1'), edges: cells.filter(({attributes: item}) => item.get('edge') === '1')};
}
export function assertUniqueDrawioIds(source) { const ids = parseDrawio(source).cells.map(({attributes: item}) => item.get('id')); assert.ok(ids.every(Boolean), 'every mxCell has an id'); assert.equal(new Set(ids).size, ids.length, 'globally unique mxCell ids'); }
export function parseSvg(source) {
  const elements = []; const stack = [];
  for (const match of source.matchAll(/<\/?([A-Za-z][\w:.-]*)\b([^>]*)>/gu)) {
    const closing = match[0].startsWith('</'); const name = match[1];
    if (closing) { const element = stack.pop(); assert.equal(element?.name, name, `balanced SVG element ${name}`); element.closeIndex = match.index; continue; }
    const element = {name, attributes: attributes(match[2]), index: elements.length, sourceIndex: match.index, openEnd: match.index + match[0].length, closeIndex: match.index + match[0].length, tag: match[0], parent: stack.at(-1) ?? null};
    elements.push(element); if (!match[0].endsWith('/>')) stack.push(element);
  }
  assert.equal(stack.length, 0, 'balanced SVG tree');
  return {elements, nodes: elements.filter(({attributes: item}) => item.has('data-node-id')), edges: elements.filter(({name, attributes: item}) => name === 'path' && item.has('data-edge-id'))};
}
export function parseXml(source) { return parseSvg(source).elements; }
function cssDeclarations(source = '') {
  const result = new Map(); for (const declaration of source.split(';').map((item) => item.trim()).filter(Boolean)) { const split = declaration.indexOf(':'); if (split < 0) continue; const property = declaration.slice(0, split).trim().toLowerCase(); const raw = declaration.slice(split + 1).trim(); result.set(property, {value: raw.replace(/\s*!important\s*$/iu, '').trim(), important: /\s*!important\s*$/iu.test(raw)}); } return result;
}
function styleMap(value = '') { return new Map(value.split(';').filter(Boolean).map((item) => item.split(/=(.*)/su).map((part) => part.trim()))); }
function styleRules(source) {
  const rules = []; let order = 0;
  for (const [, sheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) for (const [, selectors, declarations] of sheet.replace(/\/\*[\s\S]*?\*\//gu, '').matchAll(/([^{}]+)\{([^{}]*)\}/gu)) for (const selector of selectors.split(',').map((item) => item.trim()).filter(Boolean)) rules.push({selector, declarations: cssDeclarations(declarations), specificity: selectorSpecificity(selector), order: order++});
  return rules;
}
function selectorSpecificity(selector) { return [(selector.match(/#[\w-]+/gu) ?? []).length, (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/gu) ?? []).length, (selector.match(/(?:^|[\s>+~])([A-Za-z][\w-]*)/gu) ?? []).length]; }
function compareSpecificity(left, right) { return left[0] - right[0] || left[1] - right[1] || left[2] - right[2]; }
function simpleSelectorMatches(element, selector) {
  const simple = selector.trim(); if (!simple || /[+~>\s]/u.test(simple)) return false;
  if (simple.includes(':root') && element.parent) return false;
  const id = simple.match(/#([\w-]+)/u)?.[1]; const tag = simple.match(/^[A-Za-z][\w-]*/u)?.[0]; const classes = [...simple.matchAll(/\.([\w-]+)/gu)].map((match) => match[1]); const selectors = [...simple.matchAll(/\[([\w:-]+)(?:\s*=\s*["']?([^\]"']+)["']?)?\]/gu)];
  return (!tag || element.name === tag) && (!id || element.attributes.get('id') === id) && classes.every((name) => (element.attributes.get('class') ?? '').split(/\s+/u).includes(name)) && selectors.every(([, key, value]) => element.attributes.has(key) && (value === undefined || element.attributes.get(key) === value.trim()));
}
function selectorMatches(element, selector) {
  const parts = selector.trim().replace(/\s*>\s*/gu, ' > ').split(/\s+/u).filter(Boolean); let candidate = element; let cursor = parts.length - 1;
  if (!simpleSelectorMatches(candidate, parts[cursor])) return false; cursor -= 1;
  while (cursor >= 0) { if (parts[cursor] === '>') { candidate = candidate.parent; if (!candidate || cursor === 0 || !simpleSelectorMatches(candidate, parts[cursor - 1])) return false; cursor -= 2; } else { candidate = candidate.parent; while (candidate && !simpleSelectorMatches(candidate, parts[cursor])) candidate = candidate.parent; if (!candidate) return false; cursor -= 1; } }
  return true;
}
function ownSvgPresentationValue(source, element, property) {
  let winner = element.attributes.has(property) ? {tier: 0, specificity: [0, 0, 0], order: -1, value: element.attributes.get(property)} : null;
  for (const rule of styleRules(source)) { const declaration = rule.declarations.get(property); if (!declaration || !selectorMatches(element, rule.selector)) continue; const candidate = {tier: declaration.important ? 3 : 1, specificity: rule.specificity, order: rule.order, value: declaration.value}; if (!winner || candidate.tier > winner.tier || (candidate.tier === winner.tier && (compareSpecificity(candidate.specificity, winner.specificity) > 0 || (compareSpecificity(candidate.specificity, winner.specificity) === 0 && candidate.order > winner.order)))) winner = candidate; }
  const inline = cssDeclarations(element.attributes.get('style')).get(property); if (inline) { const candidate = {tier: inline.important ? 4 : 2, specificity: [1, 0, 0], order: Number.MAX_SAFE_INTEGER, value: inline.value}; if (!winner || candidate.tier >= winner.tier) winner = candidate; }
  return winner?.value;
}
const INHERITED_SVG_PROPERTIES = new Set(['color', 'fill', 'fill-opacity', 'fill-rule', 'font-family', 'font-size', 'font-style', 'font-weight', 'marker-end', 'marker-mid', 'marker-start', 'stroke', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'stroke-width', 'text-anchor', 'visibility']);
export function svgPresentationValue(source, element, property) {
  const own = ownSvgPresentationValue(source, element, property); if (own !== undefined && !['inherit', 'unset'].includes(own)) return own === 'initial' ? undefined : own;
  if ((own === 'inherit' || own === 'unset' && INHERITED_SVG_PROPERTIES.has(property) || own === undefined && INHERITED_SVG_PROPERTIES.has(property)) && element.parent) return svgPresentationValue(source, element.parent, property); return undefined;
}
export function effectiveStyle(attributesMap, inherited = new Map()) { const result = new Map(inherited); for (const [key, declaration] of cssDeclarations(attributesMap.get('style'))) result.set(key, declaration.value); for (const key of INHERITED_SVG_PROPERTIES) if (attributesMap.has(key)) result.set(key, attributesMap.get(key)); return result; }
function number(value, label) { const parsed = Number.parseFloat(value); assert.ok(Number.isFinite(parsed), label); return parsed; }
function numericBounds(attributesMap, label) { const result = Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, number(attributesMap.get(key), `${label} ${key}`)])); assert.ok(result.width >= 0 && result.height >= 0, `${label} nonnegative size`); return result; }
function multiplyTransform(left, right) { return [left[0] * right[0] + left[2] * right[1], left[1] * right[0] + left[3] * right[1], left[0] * right[2] + left[2] * right[3], left[1] * right[2] + left[3] * right[3], left[0] * right[4] + left[2] * right[5] + left[4], left[1] * right[4] + left[3] * right[5] + left[5]]; }
function transformMatrix(value = '') {
  let result = [1, 0, 0, 1, 0, 0]; let cursor = 0;
  for (const match of value.matchAll(/([A-Za-z]+)\(([^)]*)\)/gu)) { assert.match(value.slice(cursor, match.index), /^[\s,]*$/u, `supported transform list ${value}`); cursor = match.index + match[0].length; const values = match[2].trim().split(/[\s,]+/u).filter(Boolean).map(Number); assert.ok(values.every(Number.isFinite), `finite ${match[1]} transform`); let next;
    if (match[1] === 'matrix') { assert.equal(values.length, 6, 'matrix transform arity'); next = values; }
    else if (match[1] === 'translate') { assert.ok([1, 2].includes(values.length), 'translate transform arity'); next = [1, 0, 0, 1, values[0], values[1] ?? 0]; }
    else if (match[1] === 'scale') { assert.ok([1, 2].includes(values.length), 'scale transform arity'); next = [values[0], 0, 0, values[1] ?? values[0], 0, 0]; }
    else if (match[1] === 'rotate') { assert.ok([1, 3].includes(values.length), 'rotate transform arity'); const radians = values[0] * Math.PI / 180; const rotation = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0]; next = values.length === 1 ? rotation : multiplyTransform(multiplyTransform([1, 0, 0, 1, values[1], values[2]], rotation), [1, 0, 0, 1, -values[1], -values[2]]); }
    else if (match[1] === 'skewX' || match[1] === 'skewY') { assert.equal(values.length, 1, `${match[1]} transform arity`); const tangent = Math.tan(values[0] * Math.PI / 180); next = match[1] === 'skewX' ? [1, 0, tangent, 1, 0, 0] : [1, tangent, 0, 1, 0, 0]; }
    else assert.fail(`unsupported SVG transform ${match[1]}`); result = multiplyTransform(result, next);
  }
  assert.match(value.slice(cursor), /^[\s,]*$/u, `supported transform list ${value}`); return result;
}
function elementTransform(element, stopParent = null) { const chain = []; for (let candidate = element; candidate && candidate !== stopParent; candidate = candidate.parent) chain.unshift(transformMatrix(candidate.attributes.get('transform') ?? '')); return chain.reduce((result, item) => multiplyTransform(result, item), [1, 0, 0, 1, 0, 0]); }
function transformPoint(matrix, point) { return {x: matrix[0] * point.x + matrix[2] * point.y + matrix[4], y: matrix[1] * point.x + matrix[3] * point.y + matrix[5]}; }
function pathGeometryPoints(data) {
  assert.ok(data, 'SVG path data'); const tokens = data.match(/[A-Za-z]|-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/giu) ?? []; const points = []; let cursor = 0; let command; let current = {x: 0, y: 0}; let start = current;
  const take = () => { const value = Number(tokens[cursor++]); assert.ok(Number.isFinite(value), `finite path coordinate in ${data}`); return value; }; const add = (x, y) => { current = {x, y}; points.push(current); };
  while (cursor < tokens.length) { if (/^[A-Za-z]$/u.test(tokens[cursor])) command = tokens[cursor++]; assert.ok(command, `path command in ${data}`); const relative = command === command.toLowerCase(); const upper = command.toUpperCase(); const base = current;
    if (upper === 'M' || upper === 'L' || upper === 'T') { const x = take(); const y = take(); add(relative ? base.x + x : x, relative ? base.y + y : y); if (upper === 'M') { start = current; command = relative ? 'l' : 'L'; } }
    else if (upper === 'H') { const x = take(); add(relative ? base.x + x : x, base.y); }
    else if (upper === 'V') { const y = take(); add(base.x, relative ? base.y + y : y); }
    else if (upper === 'C') { for (let index = 0; index < 3; index += 1) { const x = take(); const y = take(); const point = {x: relative ? base.x + x : x, y: relative ? base.y + y : y}; points.push(point); if (index === 2) current = point; } }
    else if (upper === 'S' || upper === 'Q') { for (let index = 0; index < 2; index += 1) { const x = take(); const y = take(); const point = {x: relative ? base.x + x : x, y: relative ? base.y + y : y}; points.push(point); if (index === 1) current = point; } }
    else if (upper === 'A') { const rx = take(); const ry = take(); take(); take(); take(); const x = take(); const y = take(); const endpoint = {x: relative ? base.x + x : x, y: relative ? base.y + y : y}; points.push({x: base.x - Math.abs(rx), y: base.y - Math.abs(ry)}, {x: base.x + Math.abs(rx), y: base.y + Math.abs(ry)}, {x: endpoint.x - Math.abs(rx), y: endpoint.y - Math.abs(ry)}, {x: endpoint.x + Math.abs(rx), y: endpoint.y + Math.abs(ry)}, endpoint); current = endpoint; }
    else if (upper === 'Z') { add(start.x, start.y); command = undefined; }
    else assert.fail(`unsupported SVG path command ${command}`);
  }
  assert.ok(points.length >= 2, `visible SVG path geometry ${data}`); return points;
}
export function parsePathPoints(data) {
  assert.doesNotMatch(data ?? '', /[CQSAZ]/iu, 'connector path uses only M/L/H/V segments'); const points = pathGeometryPoints(data); assert.ok(points.length >= 2, `connector path ${data}`); return points;
}
function shapePoints(element) {
  if (element.name === 'rect') { const {x, y, width, height} = numericBounds(element.attributes, 'rect'); return [{x, y}, {x: x + width, y}, {x: x + width, y: y + height}, {x, y: y + height}]; }
  if (element.name === 'circle' || element.name === 'ellipse') { const cx = number(element.attributes.get('cx'), `${element.name} cx`); const cy = number(element.attributes.get('cy'), `${element.name} cy`); const rx = element.name === 'circle' ? number(element.attributes.get('r'), 'circle r') : number(element.attributes.get('rx'), 'ellipse rx'); const ry = element.name === 'circle' ? rx : number(element.attributes.get('ry'), 'ellipse ry'); return Array.from({length: 65}, (_, index) => ({x: cx + Math.cos(index / 64 * Math.PI * 2) * rx, y: cy + Math.sin(index / 64 * Math.PI * 2) * ry})); }
  if (element.name === 'line') return [{x: number(element.attributes.get('x1'), 'line x1'), y: number(element.attributes.get('y1'), 'line y1')}, {x: number(element.attributes.get('x2'), 'line x2'), y: number(element.attributes.get('y2'), 'line y2')}];
  if (['polygon', 'polyline'].includes(element.name)) { const values = (element.attributes.get('points')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number); assert.ok(values.length >= 4 && values.length % 2 === 0, `${element.name} points`); const points = []; for (let index = 0; index < values.length; index += 2) points.push({x: values[index], y: values[index + 1]}); return points; }
  if (element.name === 'path') return pathGeometryPoints(element.attributes.get('d')); assert.fail(`unsupported painted shape ${element.name}`);
}
function boundsFromPoints(points) { assert.ok(points.length >= 2 && points.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), 'finite painted points'); return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function visibleShapeBounds(element, stopParent = null) { return boundsFromPoints(shapePoints(element).map((point) => transformPoint(elementTransform(element, stopParent), point))); }
function ancestorNamed(element, name) { for (let candidate = element.parent; candidate; candidate = candidate.parent) if (candidate.name === name) return candidate; return undefined; }
export function terminalPort(cell, endpoint) { const style = styleMap(cell.attributes.get('style')); for (const key of [`${endpoint}X`, `${endpoint}Y`, `${endpoint}Dx`, `${endpoint}Dy`, `${endpoint}Perimeter`]) assert.ok(style.has(key), `${cell.attributes.get('id')} has ${key}`); assert.equal(style.get(`${endpoint}Dx`), '0', `${endpoint}Dx is explicit`); assert.equal(style.get(`${endpoint}Dy`), '0', `${endpoint}Dy is explicit`); assert.equal(style.get(`${endpoint}Perimeter`), '1', `${endpoint} perimeter`); const x = Number(style.get(`${endpoint}X`)); const y = Number(style.get(`${endpoint}Y`)); assert.ok(Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1, `${cell.attributes.get('id')} normalized ${endpoint} port`); assert.ok(x === 0 || x === 1 || y === 0 || y === 1, `${endpoint} lies on perimeter`); return {x, y}; }
function bounds(cell) { return numericBounds(cell.geometry, cell.attributes.get('id')); }
function pointOn(box, port) { return {x: box.x + box.width * port.x, y: box.y + box.height * port.y}; }
function drawioRoute(edge, nodeById) { const source = nodeById.get(edge.attributes.get('source')); const target = nodeById.get(edge.attributes.get('target')); assert.ok(source && target, `${edge.attributes.get('id')} real terminals`); assert.ok(edge.hasPointsArray, `${edge.attributes.get('id')} waypoint array`); assert.equal(edge.misplacedPoints, 0, `${edge.attributes.get('id')} points only in waypoint array`); assert.equal(edge.points.some((point) => ['sourcePoint', 'targetPoint'].includes(point.get('as'))), false, `${edge.attributes.get('id')} fallback points forbidden`); const waypoints = edge.points.map((point) => ({x: number(point.get('x'), 'waypoint x'), y: number(point.get('y'), 'waypoint y')})); return [pointOn(bounds(source), terminalPort(edge, 'exit')), ...waypoints, pointOn(bounds(target), terminalPort(edge, 'entry'))]; }
function close(left, right, label) { assert.ok(Math.abs(left - right) < 0.01, `${label}: ${left} !== ${right}`); }
function equalRoute(actual, expected, label) { assert.equal(actual.length, expected.length, `${label} point count`); actual.forEach((point, index) => { close(point.x, expected[index].x, `${label}[${index}].x`); close(point.y, expected[index].y, `${label}[${index}].y`); }); }
function parseBounds(value, label) { const parts = String(value ?? '').trim().split(/[\s,]+/u).map(Number); assert.equal(parts.length, 4, `${label} four bounds`); assert.ok(parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0, `${label} positive finite bounds`); return {x: parts[0], y: parts[1], width: parts[2], height: parts[3], left: parts[0], top: parts[1], right: parts[0] + parts[2], bottom: parts[1] + parts[3]}; }
function renderedPathPoints(path) { return parsePathPoints(path.attributes.get('d')).map((point) => transformPoint(elementTransform(path), point)); }
function elementText(source, element) { return decodeXmlText(source.slice(element.openEnd, element.closeIndex).replace(/<[^>]+>/gu, '')).trim(); }
export function glyphBox({x, y, text, fontSize, anchor = 'start'}) { const width = [...text].reduce((sum, character) => sum + (/^[\u0000-\u00ff]$/u.test(character) ? .64 : 1), 0) * fontSize; const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x; return {left, right: left + width, top: y - fontSize * .82, bottom: y + fontSize * .22}; }
function textBox(source, element) { const text = elementText(source, element); assert.ok(text, 'visible text content'); const fontSize = number(svgPresentationValue(source, element, 'font-size'), 'effective text font-size'); const local = glyphBox({x: number(element.attributes.get('x'), 'text x'), y: number(element.attributes.get('y'), 'text y'), text, fontSize, anchor: svgPresentationValue(source, element, 'text-anchor') ?? 'start'}); const matrix = elementTransform(element); return boundsFromPoints([{x: local.left, y: local.top}, {x: local.right, y: local.top}, {x: local.right, y: local.bottom}, {x: local.left, y: local.bottom}].map((point) => transformPoint(matrix, point))); }
function transformScale(matrix) { return Math.max(Math.hypot(matrix[0], matrix[1]), Math.hypot(matrix[2], matrix[3])); }
function textScale(matrix) { return Math.hypot(matrix[2], matrix[3]); }
function rectangleDistance(left, right) { const dx = Math.max(left.left - right.right, right.left - left.right, 0); const dy = Math.max(left.top - right.bottom, right.top - left.bottom, 0); return Math.hypot(dx, dy); }
function pointSegmentDistance(point, start, end) { const dx = end.x - start.x; const dy = end.y - start.y; const size = dx * dx + dy * dy; if (size === 0) return Math.hypot(point.x - start.x, point.y - start.y); const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / size)); return Math.hypot(point.x - start.x - ratio * dx, point.y - start.y - ratio * dy); }
function cross(first, second, point) { return (second.x - first.x) * (point.y - first.y) - (second.y - first.y) * (point.x - first.x); }
function pointOnSegment(point, start, end) { return Math.abs(cross(start, end, point)) <= 1e-9 && point.x >= Math.min(start.x, end.x) - 1e-9 && point.x <= Math.max(start.x, end.x) + 1e-9 && point.y >= Math.min(start.y, end.y) - 1e-9 && point.y <= Math.max(start.y, end.y) + 1e-9; }
function lineSegmentDistance(leftStart, leftEnd, rightStart, rightEnd) { const leftA = cross(leftStart, leftEnd, rightStart); const leftB = cross(leftStart, leftEnd, rightEnd); const rightA = cross(rightStart, rightEnd, leftStart); const rightB = cross(rightStart, rightEnd, leftEnd); const intersects = ((leftA > 0 && leftB < 0) || (leftA < 0 && leftB > 0)) && ((rightA > 0 && rightB < 0) || (rightA < 0 && rightB > 0)) || Math.abs(leftA) <= 1e-9 && pointOnSegment(rightStart, leftStart, leftEnd) || Math.abs(leftB) <= 1e-9 && pointOnSegment(rightEnd, leftStart, leftEnd) || Math.abs(rightA) <= 1e-9 && pointOnSegment(leftStart, rightStart, rightEnd) || Math.abs(rightB) <= 1e-9 && pointOnSegment(leftEnd, rightStart, rightEnd); if (intersects) return 0; return Math.min(pointSegmentDistance(leftStart, rightStart, rightEnd), pointSegmentDistance(leftEnd, rightStart, rightEnd), pointSegmentDistance(rightStart, leftStart, leftEnd), pointSegmentDistance(rightEnd, leftStart, leftEnd)); }
function segmentRectangleDistance(start, end, rectangle) { const corners = [{x: rectangle.left, y: rectangle.top}, {x: rectangle.right, y: rectangle.top}, {x: rectangle.right, y: rectangle.bottom}, {x: rectangle.left, y: rectangle.bottom}]; if ([start, end].some((point) => point.x >= rectangle.left && point.x <= rectangle.right && point.y >= rectangle.top && point.y <= rectangle.bottom)) return 0; return Math.min(...corners.map((point, index) => lineSegmentDistance(start, end, point, corners[(index + 1) % 4]))); }
function routeRectangleDistance(points, rectangle) { return Math.min(...points.slice(1).map((point, index) => segmentRectangleDistance(points[index], point, rectangle))); }
function samePoint(left, right) { return Math.abs(left.x - right.x) <= 1e-9 && Math.abs(left.y - right.y) <= 1e-9; }
function partialCollinearOverlap(leftStart, leftEnd, rightStart, rightEnd) { if (Math.abs(cross(leftStart, leftEnd, rightStart)) > 1e-9 || Math.abs(cross(leftStart, leftEnd, rightEnd)) > 1e-9) return false; const axis = Math.abs(leftEnd.x - leftStart.x) >= Math.abs(leftEnd.y - leftStart.y) ? 'x' : 'y'; const left = [leftStart[axis], leftEnd[axis]].sort((a, b) => a - b); const right = [rightStart[axis], rightEnd[axis]].sort((a, b) => a - b); return Math.min(left[1], right[1]) - Math.max(left[0], right[0]) > 1e-9; }
function exactSharedEndpointContact(left, right, leftStart, leftEnd, rightStart, rightEnd) { const endpoints = (route) => [{point: route.points[0], id: route.source}, {point: route.points.at(-1), id: route.target}]; return endpoints(left).some((first) => first.id && endpoints(right).some((second) => first.id === second.id && samePoint(first.point, second.point) && [leftStart, leftEnd].some((point) => samePoint(point, first.point)) && [rightStart, rightEnd].some((point) => samePoint(point, first.point)))); }
function assertRouteIntersections(routes) { for (let first = 0; first < routes.length; first += 1) for (let second = first + 1; second < routes.length; second += 1) for (let leftSegment = 1; leftSegment < routes[first].points.length; leftSegment += 1) for (let rightSegment = 1; rightSegment < routes[second].points.length; rightSegment += 1) { const leftStart = routes[first].points[leftSegment - 1]; const leftEnd = routes[first].points[leftSegment]; const rightStart = routes[second].points[rightSegment - 1]; const rightEnd = routes[second].points[rightSegment]; assert.equal(partialCollinearOverlap(leftStart, leftEnd, rightStart, rightEnd), false, `${routes[first].id}/${routes[second].id} partial collinear overlap`); if (lineSegmentDistance(leftStart, leftEnd, rightStart, rightEnd) === 0) assert.ok(exactSharedEndpointContact(routes[first], routes[second], leftStart, leftEnd, rightStart, rightEnd), `${routes[first].id}/${routes[second].id} contact only at exact shared terminal`); } }
function paintOpacity(source, element, kind) { let opacity = 1; for (let candidate = element; candidate; candidate = candidate.parent) { const ownOpacity = ownSvgPresentationValue(source, candidate, 'opacity'); if (ownOpacity !== undefined) opacity *= number(ownOpacity, 'opacity'); const ownKind = ownSvgPresentationValue(source, candidate, `${kind}-opacity`); if (ownKind !== undefined) opacity *= number(ownKind, `${kind}-opacity`); } assert.ok(opacity >= 0 && opacity <= 1, 'effective paint opacity'); return opacity; }
function painted(source, element, kind) { const value = svgPresentationValue(source, element, kind) ?? (kind === 'fill' ? '#000000' : 'none'); return !['none', 'transparent'].includes(value.toLowerCase()) && paintOpacity(source, element, kind) > 0; }
function expanded(rectangle, amount) { return {left: rectangle.left - amount, right: rectangle.right + amount, top: rectangle.top - amount, bottom: rectangle.bottom + amount}; }
function strokedPolygonPoints(input, strokeWidth, miterLimit = 4) {
  const points = [...input]; if (points.length > 1 && samePoint(points[0], points.at(-1))) points.pop(); assert.ok(points.length >= 3, 'closed stroke polygon'); const area = points.reduce((sum, point, index) => { const next = points[(index + 1) % points.length]; return sum + point.x * next.y - next.x * point.y; }, 0); assert.notEqual(area, 0, 'nondegenerate stroke polygon'); const side = area > 0 ? 1 : -1; const half = strokeWidth / 2; const outline = [...points];
  for (let index = 0; index < points.length; index += 1) { const previous = points[(index + points.length - 1) % points.length]; const point = points[index]; const next = points[(index + 1) % points.length]; const incomingLength = Math.hypot(point.x - previous.x, point.y - previous.y); const outgoingLength = Math.hypot(next.x - point.x, next.y - point.y); assert.ok(incomingLength > 0 && outgoingLength > 0, 'nonzero polygon edges'); const incoming = {x: (point.x - previous.x) / incomingLength, y: (point.y - previous.y) / incomingLength}; const outgoing = {x: (next.x - point.x) / outgoingLength, y: (next.y - point.y) / outgoingLength}; const incomingNormal = {x: side * incoming.y, y: -side * incoming.x}; const outgoingNormal = {x: side * outgoing.y, y: -side * outgoing.x}; const sum = {x: incomingNormal.x + outgoingNormal.x, y: incomingNormal.y + outgoingNormal.y}; const magnitude = Math.hypot(sum.x, sum.y); assert.ok(magnitude > 0, 'finite polygon join'); const direction = {x: sum.x / magnitude, y: sum.y / magnitude}; const denominator = direction.x * outgoingNormal.x + direction.y * outgoingNormal.y; const length = half / denominator; if (length <= half * miterLimit) outline.push({x: point.x + direction.x * length, y: point.y + direction.y * length}); else outline.push({x: point.x + incomingNormal.x * half, y: point.y + incomingNormal.y * half}, {x: point.x + outgoingNormal.x * half, y: point.y + outgoingNormal.y * half}); }
  return outline;
}
function paintedShapeBounds(source, shape, stopParent = null) { const matrix = elementTransform(shape, stopParent); const geometry = shapePoints(shape); let paintedPoints = geometry; if (painted(source, shape, 'stroke')) { const strokeWidth = number(svgPresentationValue(source, shape, 'stroke-width') ?? 1, 'painted shape stroke width'); const closed = shape.name === 'polygon' || shape.name === 'rect' || shape.name === 'path' && /z\s*$/iu.test(shape.attributes.get('d') ?? ''); const lineJoin = svgPresentationValue(source, shape, 'stroke-linejoin') ?? 'miter'; if (closed && lineJoin === 'miter') paintedPoints = strokedPolygonPoints(geometry, strokeWidth, number(svgPresentationValue(source, shape, 'stroke-miterlimit') ?? 4, 'stroke miter limit')); else { const result = boundsFromPoints(geometry.map((point) => transformPoint(matrix, point))); return expanded(result, strokeWidth / 2 * transformScale(matrix)); } } return boundsFromPoints(paintedPoints.map((point) => transformPoint(matrix, point))); }
function markerGeometry(source, parsed, path, points) { const edgeId = path.attributes.get('data-edge-id'); const markerId = svgPresentationValue(source, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${edgeId} effective marker`); const marker = parsed.elements.find(({name, attributes: item}) => name === 'marker' && item.get('id') === markerId); assert.ok(marker, `${markerId} definition`); const markerWidth = number(marker.attributes.get('markerWidth'), `${markerId} markerWidth`); const markerHeight = number(marker.attributes.get('markerHeight'), `${markerId} markerHeight`); assert.ok(markerWidth > 0 && markerHeight > 0, `${markerId} positive marker viewport`); const viewBox = parseBounds(marker.attributes.get('viewBox'), `${markerId} viewBox`); const refX = number(marker.attributes.get('refX'), `${markerId} refX`); const refY = number(marker.attributes.get('refY'), `${markerId} refY`); const markerUnits = marker.attributes.get('markerUnits') ?? 'strokeWidth'; assert.ok(['strokeWidth', 'userSpaceOnUse'].includes(markerUnits), `${markerId} markerUnits`); const orient = marker.attributes.get('orient') ?? '0';
  const preserve = marker.attributes.get('preserveAspectRatio') ?? 'xMidYMid meet'; let scaleX = markerWidth / viewBox.width; let scaleY = markerHeight / viewBox.height; let offsetX = -viewBox.x * scaleX; let offsetY = -viewBox.y * scaleY;
  if (preserve !== 'none') { assert.match(preserve, /^(?:xMin|xMid|xMax)Y(?:Min|Mid|Max)(?:\s+(?:meet|slice))?$/u, `${markerId} preserveAspectRatio`); const scale = preserve.endsWith('slice') ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY); const horizontal = preserve.slice(0, 4); const vertical = preserve.slice(4, 8); offsetX = -viewBox.x * scale + (horizontal === 'xMid' ? (markerWidth - viewBox.width * scale) / 2 : horizontal === 'xMax' ? markerWidth - viewBox.width * scale : 0); offsetY = -viewBox.y * scale + (vertical === 'YMid' ? (markerHeight - viewBox.height * scale) / 2 : vertical === 'YMax' ? markerHeight - viewBox.height * scale : 0); scaleX = scale; scaleY = scale; }
  const mapViewBox = (point) => ({x: point.x * scaleX + offsetX, y: point.y * scaleY + offsetY}); const reference = mapViewBox({x: refX, y: refY}); const shapes = parsed.elements.filter((element) => ['rect', 'path', 'polygon', 'polyline', 'circle', 'ellipse', 'line'].includes(element.name) && ancestorNamed(element, 'marker') === marker && (painted(source, element, 'fill') || painted(source, element, 'stroke'))); assert.ok(shapes.length > 0, `${markerId} painted child geometry`); const markerBounds = shapes.map((shape) => paintedShapeBounds(source, shape, marker)); const local = {left: Math.min(...markerBounds.map((item) => item.left)), right: Math.max(...markerBounds.map((item) => item.right)), top: Math.min(...markerBounds.map((item) => item.top)), bottom: Math.max(...markerBounds.map((item) => item.bottom))}; const localCorners = [{x: local.left, y: local.top}, {x: local.right, y: local.top}, {x: local.right, y: local.bottom}, {x: local.left, y: local.bottom}].map(mapViewBox);
  const endpoint = points.at(-1); const previous = points.at(-2); const terminalAngle = Math.atan2(endpoint.y - previous.y, endpoint.x - previous.x); assert.ok(Number.isFinite(terminalAngle) && !samePoint(endpoint, previous), `${markerId} terminal direction`); let angle; if (orient === 'auto' || orient === 'auto-start-reverse') angle = terminalAngle; else { const match = /^(-?(?:\d+(?:\.\d*)?|\.\d+))(?:deg)?$/u.exec(orient); assert.ok(match, `${markerId} supported orient`); angle = Number(match[1]) * Math.PI / 180; } const unit = markerUnits === 'strokeWidth' ? number(svgPresentationValue(source, path, 'stroke-width'), `${edgeId} marker stroke scale`) : 1; const cosine = Math.cos(angle); const sine = Math.sin(angle); const paintedPoints = localCorners.map((point) => { const x = (point.x - reference.x) * unit; const y = (point.y - reference.y) * unit; return {x: endpoint.x + cosine * x - sine * y, y: endpoint.y + sine * x + cosine * y}; }); return {marker, shapes, points: paintedPoints, bounds: boundsFromPoints(paintedPoints)}; }
function mxGraphBlockMarker(edgeStyle, points, label) { const endpoint = points.at(-1); const previous = points.at(-2); const length = Math.hypot(endpoint.x - previous.x, endpoint.y - previous.y); assert.ok(length > 0, `${label} terminal direction`); const unit = {x: (endpoint.x - previous.x) / length, y: (endpoint.y - previous.y) / length}; const normal = {x: -unit.y, y: unit.x}; const strokeWidth = number(edgeStyle.get('strokeWidth'), `${label} mxGraph strokeWidth`); const endSize = number(edgeStyle.get('endSize'), `${label} mxGraph endSize`); const size = endSize + strokeWidth; const tipOffset = strokeWidth * 1.118; const tip = {x: endpoint.x - unit.x * tipOffset, y: endpoint.y - unit.y * tipOffset}; const rear = {x: tip.x - unit.x * size, y: tip.y - unit.y * size}; const geometry = [tip, {x: rear.x + normal.x * size / 2, y: rear.y + normal.y * size / 2}, {x: rear.x - normal.x * size / 2, y: rear.y - normal.y * size / 2}]; return {endSize, strokeWidth, size, tipOffset, geometry, bounds: boundsFromPoints(strokedPolygonPoints(geometry, strokeWidth, 10))}; }
function nodeShape(parsed, node) { if (['rect', 'path', 'polygon', 'circle', 'ellipse'].includes(node.name)) return node; const candidates = parsed.elements.filter((element) => ['rect', 'path', 'polygon', 'circle', 'ellipse'].includes(element.name) && (() => { let parent = element.parent; while (parent && !parent.attributes.has('data-node-id')) parent = parent.parent; return parent === node; })()); assert.equal(candidates.length, 1, `${node.attributes.get('data-node-id')} one painted node shape`); return candidates[0]; }
function assertNoOverdraw(source, parsed, routes) {
  const supported = new Set(['rect', 'path', 'polygon', 'polyline', 'circle', 'ellipse']); const masksFor = (index) => parsed.elements.filter((element) => supported.has(element.name) && element.index > index && !ancestorNamed(element, 'marker') && !element.attributes.has('data-edge-id') && !element.attributes.has('data-node-id') && element.parent?.attributes.get('data-node-id') === undefined); const maskEnvelope = (mask) => { let result = visibleShapeBounds(mask); if (painted(source, mask, 'stroke')) result = expanded(result, number(svgPresentationValue(source, mask, 'stroke-width') ?? 1, 'mask stroke width') / 2 * transformScale(elementTransform(mask))); return result; };
  for (const route of routes) for (const mask of masksFor(route.path.index)) { const envelope = maskEnvelope(mask); if (painted(source, mask, 'fill') || painted(source, mask, 'stroke')) { assert.ok(routeRectangleDistance(route.points, envelope) > 0, `${route.id} no later opaque/translucent ${mask.name} paint mask over stroke`); assert.ok(rectangleDistance(route.marker.bounds, envelope) > 0, `${route.id} no later ${mask.name} mask over marker`); if (route.label) assert.ok(rectangleDistance(textBox(source, route.label), envelope) > 0, `${route.id} no later ${mask.name} mask over label`); } if (painted(source, mask, 'stroke')) { let maskPoints = shapePoints(mask).map((point) => transformPoint(elementTransform(mask), point)); if (['rect', 'polygon'].includes(mask.name)) maskPoints = [...maskPoints, maskPoints[0]]; const maskWidth = number(svgPresentationValue(source, mask, 'stroke-width') ?? 1, 'mask stroke width') * transformScale(elementTransform(mask)); const overlaps = route.points.slice(1).some((point, index) => maskPoints.slice(1).some((maskPoint, maskIndex) => lineSegmentDistance(route.points[index], point, maskPoints[maskIndex], maskPoint) <= (route.stroke + maskWidth) / 2)); assert.equal(overlaps, false, `${route.id} no later translucent ${mask.name} stroke mask`); } }
  const essentialText = parsed.elements.filter(({name, attributes: item}) => name === 'text' && (item.has('data-header-for') || item.has('data-type-for'))); for (const text of essentialText) for (const mask of masksFor(text.index)) if (painted(source, mask, 'fill') || painted(source, mask, 'stroke')) assert.ok(rectangleDistance(textBox(source, text), maskEnvelope(mask)) > 0, `${text.attributes.get('data-header-for') ?? text.attributes.get('data-type-for')} no later ${mask.name} mask over node text`);
  const essentialShapes = parsed.elements.filter((element) => supported.has(element.name) && element.parent?.attributes.has('data-node-id')); for (const shape of essentialShapes) for (const mask of masksFor(shape.index)) if (painted(source, mask, 'fill') || painted(source, mask, 'stroke')) assert.ok(rectangleDistance(visibleShapeBounds(shape), maskEnvelope(mask)) > 0, `${shape.parent.attributes.get('data-node-id')} no later ${mask.name} mask over node shape`);
}
function assertPhysicalGeometry(source, parsed, routes, nodeBoxes, viewBox, scale) { const failures = []; const minima = {nodeHorizontal: Infinity, nodeTop: Infinity, nodeBottom: Infinity, baseline: Infinity, bodyFont: Infinity, edgeFont: Infinity, labelStroke: Infinity, labelMarker: Infinity, labelForeignNode: Infinity, labelPair: Infinity}; assertRouteIntersections(routes); for (const route of routes) { for (const [id, node] of nodeBoxes) if (![route.source, route.target].includes(id)) { if (routeRectangleDistance(route.points, expanded(node.bounds, node.stroke / 2)) === 0) failures.push(`${route.id} route/foreign-node ${id}`); if (rectangleDistance(route.marker.bounds, expanded(node.bounds, node.stroke / 2)) === 0) failures.push(`${route.id} marker/foreign-node ${id}`); } if (route.marker.bounds.left < viewBox.left || route.marker.bounds.right > viewBox.right || route.marker.bounds.top < viewBox.top || route.marker.bounds.bottom > viewBox.bottom) failures.push(`${route.id} marker/boundary`); }
  for (const route of routes.filter(({label}) => label)) { const label = textBox(source, route.label); const finalFont = number(svgPresentationValue(source, route.label, 'font-size'), `${route.id} label font`) * textScale(elementTransform(route.label)) * scale; minima.edgeFont = Math.min(minima.edgeFont, finalFont); const strokeDistances = routes.map((candidate) => ({id: candidate.id, gap: (routeRectangleDistance(candidate.points, label) - candidate.stroke / 2) * scale})); const closestStroke = strokeDistances.reduce((closest, candidate) => candidate.gap < closest.gap ? candidate : closest); minima.labelStroke = Math.min(minima.labelStroke, closestStroke.gap); if (!(closestStroke.gap >= 8)) failures.push(`${route.id} label/stroke ${closestStroke.id} ${closestStroke.gap}`); const markerGap = Math.min(...routes.map((candidate) => rectangleDistance(candidate.marker.bounds, label))) * scale; minima.labelMarker = Math.min(minima.labelMarker, markerGap); if (!(markerGap >= 16)) failures.push(`${route.id} label/real-arrow ${markerGap}`); for (const [id, node] of nodeBoxes) if (![route.source, route.target].includes(id)) { const gap = rectangleDistance(label, expanded(node.bounds, node.stroke / 2)) * scale; minima.labelForeignNode = Math.min(minima.labelForeignNode, gap); if (!(gap >= 12)) failures.push(`${route.id} label/foreign-node ${id} ${gap}`); } }
  const labeledRoutes = routes.filter(({label}) => label); for (let first = 0; first < labeledRoutes.length; first += 1) for (let second = first + 1; second < labeledRoutes.length; second += 1) { const gap = rectangleDistance(textBox(source, labeledRoutes[first].label), textBox(source, labeledRoutes[second].label)) * scale; minima.labelPair = Math.min(minima.labelPair, gap); if (!(gap >= 4)) failures.push(`${labeledRoutes[first].id}/${labeledRoutes[second].id} label/label ${gap}`); }
  for (const [id, node] of nodeBoxes) { const title = parsed.elements.filter(({name, attributes: item}) => name === 'text' && item.get('data-header-for') === id); const type = parsed.elements.filter(({name, attributes: item}) => name === 'text' && item.get('data-type-for') === id); assert.equal(title.length, 1, `${id} mandatory title node`); assert.equal(type.length, 1, `${id} mandatory type node`); const texts = [title[0], type[0]]; const boxes = texts.map((element) => textBox(source, element)); for (let index = 0; index < texts.length; index += 1) { const finalFont = number(svgPresentationValue(source, texts[index], 'font-size'), `${id} body font`) * textScale(elementTransform(texts[index])) * scale; minima.bodyFont = Math.min(minima.bodyFont, finalFont); if (!(finalFont >= 15)) failures.push(`${id} body/font ${finalFont}`); const horizontal = Math.min(boxes[index].left - node.bounds.left - node.stroke / 2, node.bounds.right - node.stroke / 2 - boxes[index].right) * scale; minima.nodeHorizontal = Math.min(minima.nodeHorizontal, horizontal); if (!(horizontal >= 16)) failures.push(`${id} glyph/horizontal ${horizontal}`); } const top = (Math.min(...boxes.map((item) => item.top)) - node.bounds.top - node.stroke / 2) * scale; const bottom = (node.bounds.bottom - node.stroke / 2 - Math.max(...boxes.map((item) => item.bottom))) * scale; minima.nodeTop = Math.min(minima.nodeTop, top); minima.nodeBottom = Math.min(minima.nodeBottom, bottom); if (!(top >= 14)) failures.push(`${id} glyph/top ${top}`); if (!(bottom >= 14)) failures.push(`${id} glyph/bottom ${bottom}`); const titleBaseline = transformPoint(elementTransform(title[0]), {x: number(title[0].attributes.get('x'), `${id} title x`), y: number(title[0].attributes.get('y'), `${id} title y`)}); const typeBaseline = transformPoint(elementTransform(type[0]), {x: number(type[0].attributes.get('x'), `${id} type x`), y: number(type[0].attributes.get('y'), `${id} type y`)}); const baseline = Math.hypot(typeBaseline.x - titleBaseline.x, typeBaseline.y - titleBaseline.y) * scale; minima.baseline = Math.min(minima.baseline, baseline); if (!(baseline >= 22)) failures.push(`${id} title/type baseline ${baseline}`); }
  assert.deepEqual(failures, [], `complete CSS-pixel physical geometry: ${failures.join(', ')}`); assertNoOverdraw(source, parsed, routes); return minima;
}
export function assertDiagram(drawio, svg, contract = {}) {
  const nodeInventory = contract.nodes ?? DIAGRAM_NODES; const connectorInventory = contract.connectors ?? CONNECTOR_INVENTORY; const production = contract.production === true; const named = (id) => production ? `node-${id}` : id;
  assert.doesNotMatch(drawio, /(?:sourcePoint|targetPoint|dataRoute)/u, 'fallback route claims forbidden'); assert.doesNotMatch(svg, /(?:dataRoute|data-terminal)/u, 'SVG self-reported route claims forbidden'); const root = svg.match(/<svg\b[^>]*>/u)?.[0] ?? ''; assert.match(root, /role="img"/u, 'SVG image role'); assert.doesNotMatch(root, /(?:width|height)="/u, 'responsive SVG'); const viewBox = parseBounds(attributes(root).get('viewBox'), 'SVG viewBox'); const scale = 800 / viewBox.width; const parsedDrawio = parseDrawio(drawio); const parsedSvg = parseSvg(svg); const roleOf = (cell) => styleMap(cell.attributes.get('style')).get('semanticRole'); const drawioNodes = production ? parsedDrawio.nodes.filter((cell) => roleOf(cell) === 'node-shape') : parsedDrawio.nodes; const nodes = drawioNodes.map(({attributes: item}) => item.get('id')); assert.deepEqual([...nodes].sort(), [...nodeInventory].sort(), 'exact Draw.io node inventory'); const svgNodes = parsedSvg.nodes.filter(({name}) => name === 'g' || ['rect', 'path', 'polygon', 'circle', 'ellipse'].includes(name)); assert.deepEqual(svgNodes.map(({attributes: item}) => item.get('data-node-id')).sort(), [...nodeInventory].sort(), 'exact SVG node inventory'); const nodeById = new Map(parsedDrawio.nodes.map((node) => [node.attributes.get('id'), node])); const nodeBoxes = new Map();
  for (const id of nodeInventory) { const cell = nodeById.get(id); const node = svgNodes.find(({attributes: item}) => item.get('data-node-id') === id); assert.ok(cell && node, `${id} synchronized node`); const shape = nodeShape(parsedSvg, node); const actual = visibleShapeBounds(shape); const expected = bounds(cell); assert.deepEqual([actual.left, actual.top, actual.right, actual.bottom].map((value) => Math.round(value * 1e6) / 1e6), [expected.x, expected.y, expected.x + expected.width, expected.y + expected.height], `${id} actual painted bounds parity`); const stroke = number(svgPresentationValue(svg, shape, 'stroke-width') ?? 0, `${id} node stroke`); const title = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get('data-header-for') === id); const type = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get('data-type-for') === id); assert.ok(title && type, `${id} title/type text`); const style = styleMap(cell.attributes.get('style')); if (production) assert.equal(cell.label, '', `${id} parent owns no duplicate wording`); else { assert.equal(`${elementText(svg, title)}｜${elementText(svg, type)}`, cell.label, `${id} visible label synchronized with Draw.io`); for (const text of [title, type]) { assert.equal(number(svgPresentationValue(svg, text, 'font-size'), `${id} text font`), number(style.get('fontSize'), `${id} Draw.io font`), `${id} font metric parity`); assert.equal(svgPresentationValue(svg, text, 'font-family'), style.get('fontFamily'), `${id} inherited text font family`); assert.equal(svgPresentationValue(svg, text, 'fill'), style.get('fontColor'), `${id} effective text color`); } } assert.equal(svgPresentationValue(svg, shape, 'fill'), style.get('fillColor'), `${id} effective fill`); assert.equal(svgPresentationValue(svg, shape, 'stroke'), style.get('strokeColor'), `${id} effective stroke`); nodeBoxes.set(id, {bounds: actual, stroke}); }
  const edges = parsedDrawio.edges; assert.deepEqual(edges.map(({attributes: item}) => item.get('id')).sort(), connectorInventory.map(([id]) => id).sort(), 'exact Draw.io connector inventory'); assert.deepEqual(parsedSvg.edges.map(({attributes: item}) => item.get('data-edge-id')).sort(), connectorInventory.map(([id]) => id).sort(), 'exact SVG connector inventory'); const routes = [];
  for (const [id, source, target, role, requiresLabel = true] of connectorInventory) { const edge = edges.find(({attributes: item}) => item.get('id') === id); const path = parsedSvg.edges.find(({attributes: item}) => item.get('data-edge-id') === id); assert.ok(edge && path, `${id} synchronized connector`); assert.deepEqual([edge.attributes.get('source'), edge.attributes.get('target'), path.attributes.get('data-source'), path.attributes.get('data-target'), path.attributes.get('data-role')], [source, target, source, target, role], `${id} semantic parity`); const points = renderedPathPoints(path); equalRoute(points, drawioRoute(edge, nodeById), `${id} real route parity`); const expected = ROLE_STYLES[role]; assert.equal(svgPresentationValue(svg, path, 'stroke'), expected.stroke, `${id} effective stroke`); const stroke = number(svgPresentationValue(svg, path, 'stroke-width'), `${id} effective width`); assert.equal(stroke, expected.width, `${id} stroke width`); const dash = svgPresentationValue(svg, path, 'stroke-dasharray') ?? ''; assert.equal(dash === 'none' ? '' : dash, expected.dash, `${id} effective dash`); const label = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get('data-edge-id') === id); const edgeStyle = styleMap(edge.attributes.get('style')); const labelOwner = production && requiresLabel ? parsedDrawio.cells.find(({attributes: item}) => item.get('id') === `label-${id}`) : edge; const labelStyle = styleMap(labelOwner?.attributes.get('style')); assert.equal(edgeStyle.get('strokeColor'), expected.stroke, `${id} Draw.io stroke`); assert.equal(number(edgeStyle.get('strokeWidth'), `${id} Draw.io strokeWidth`), expected.width, `${id} Draw.io width`); assert.equal(edgeStyle.get('dashPattern') ?? '', expected.dash, `${id} Draw.io dash`); assert.equal(edgeStyle.get('dashed'), expected.dash ? '1' : '0', `${id} Draw.io dashed flag`); assert.equal(edgeStyle.get('endArrow'), 'block', `${id} Draw.io marker shape`); assert.equal(edgeStyle.get('endFill'), '1', `${id} Draw.io filled marker`); if (requiresLabel) { assert.ok(label && labelOwner, `${id} visible label pair`); if (production) assert.equal(edge.label, '', `${id} edge owns no duplicate wording`); assert.equal(elementText(svg, label), labelOwner.label, `${id} Draw.io/SVG label parity`); assert.equal(svgPresentationValue(svg, label, 'font-family'), labelStyle.get('fontFamily'), `${id} inherited label font family`); assert.equal(svgPresentationValue(svg, label, 'fill'), labelStyle.get('fontColor'), `${id} effective label color`); assert.equal(number(svgPresentationValue(svg, label, 'font-size'), `${id} label source font`), number(labelStyle.get('fontSize'), `${id} Draw.io label font`), `${id} label metric parity`); const finalFont = number(svgPresentationValue(svg, label, 'font-size'), `${id} label font`) * textScale(elementTransform(label)) * scale; assert.ok(finalFont >= 15, `${id} edge label final font ${finalFont}`); } else { assert.equal(edge.label, '', `${id} legend edge has no duplicate label`); assert.equal(label, undefined, `${id} legend edge caption is separate`); } const marker = markerGeometry(svg, parsedSvg, path, points); for (const shape of marker.shapes) { assert.equal(svgPresentationValue(svg, shape, 'fill'), expected.stroke, `${id} marker effective fill`); assert.equal(svgPresentationValue(svg, shape, 'stroke'), expected.stroke, `${id} marker effective stroke`); } if (production) { const mxMarker = mxGraphBlockMarker(edgeStyle, points, id); const markerViewBox = parseBounds(marker.marker.attributes.get('viewBox'), `${id} marker viewBox`); const localGeometry = [{x: 0, y: 0}, {x: mxMarker.size, y: mxMarker.size / 2}, {x: 0, y: mxMarker.size}]; const localPaint = boundsFromPoints(strokedPolygonPoints(localGeometry, mxMarker.strokeWidth, 10)); const expectedViewBox = [localPaint.left, localPaint.top, localPaint.right - localPaint.left, localPaint.bottom - localPaint.top]; [markerViewBox.x, markerViewBox.y, markerViewBox.width, markerViewBox.height].forEach((value, index) => close(value, expectedViewBox[index], `${id} mxGraph painted marker viewBox[${index}]`)); [number(marker.marker.attributes.get('markerWidth'), `${id} markerWidth`), number(marker.marker.attributes.get('markerHeight'), `${id} markerHeight`)].forEach((value, index) => close(value, expectedViewBox[index + 2], `${id} painted marker viewport[${index}]`)); close(number(marker.marker.attributes.get('refX'), `${id} marker refX`), mxMarker.size + mxMarker.tipOffset, `${id} stroke-offset marker refX`); close(number(marker.marker.attributes.get('refY'), `${id} marker refY`), mxMarker.size / 2, `${id} marker refY`); assert.equal(marker.marker.attributes.get('markerUnits'), 'userSpaceOnUse', `${id} marker dimensions are author units`); assert.equal(marker.marker.attributes.get('preserveAspectRatio'), 'none', `${id} marker keeps mxGraph author-unit geometry`); assert.equal(marker.marker.attributes.get('overflow'), 'visible', `${id} painted marker envelope is not clipped`); assert.equal(marker.shapes.length, 1, `${id} one marker shape`); assert.equal(marker.shapes[0].name, 'path', `${id} block marker uses path geometry`); assert.equal(marker.shapes[0].attributes.get('d'), `M 0 0 L ${mxMarker.size} ${mxMarker.size / 2} L 0 ${mxMarker.size} z`, `${id} mxGraph size=endSize+strokeWidth path`); assert.equal(number(svgPresentationValue(svg, marker.shapes[0], 'stroke-width'), `${id} marker shape strokeWidth`), mxMarker.strokeWidth, `${id} marker stroke-width parity`); assert.equal(svgPresentationValue(svg, marker.shapes[0], 'stroke-linejoin') ?? 'miter', 'miter', `${id} mxGraph marker line join`); assert.equal(number(svgPresentationValue(svg, marker.shapes[0], 'stroke-miterlimit') ?? 4, `${id} marker miter limit`), 10, `${id} mxGraph marker miter limit`); [marker.bounds.left, marker.bounds.right, marker.bounds.top, marker.bounds.bottom].forEach((value, index) => close(value, [mxMarker.bounds.left, mxMarker.bounds.right, mxMarker.bounds.top, mxMarker.bounds.bottom][index], `${id} transformed mxGraph painted marker envelope[${index}]`)); } routes.push({id, source, target, role, points, path, marker, label, stroke}); }
  const geometry = assertPhysicalGeometry(svg, parsedSvg, routes, nodeBoxes, viewBox, scale);
  const adjacency = new Map(); for (const route of routes) { const links = adjacency.get(route.source) ?? []; links.push(route.target); adjacency.set(route.source, links); } const irreversible = [named('batch-published-output'), named('stream-continuous-output')]; const terminals = [named('rerun-partition'), named('checkpoint-recovery'), named('reconcile-authority'), named('manual-terminal')]; const errors = [named('bad-record-error'), named('technical-failure-error'), named('unknown-external-effect-error')]; const reachesAny = (start, wanted, visited = new Set()) => { if (wanted.includes(start)) return true; if (visited.has(start)) return false; visited.add(start); return (adjacency.get(start) ?? []).some((target) => reachesAny(target, wanted, visited)); }; for (const start of [...terminals, ...errors]) assert.equal(reachesAny(start, irreversible), false, `${start} recovery/replay cannot reach irreversible output`); for (const errorId of errors) assert.equal(reachesAny(errorId, terminals), true, `${errorId} reaches a recovery or human terminal`); assert.ok(routes.some(({id, source, target}) => id === 'backpressure-to-stream' && source === named('backpressure-controller') && target === named('stream-boundary')), 'backpressure remains attached to stream boundary');
  if (production) { for (const id of ['bad-record-branch', 'technical-failure-branch', 'unknown-effect-branch']) assert.ok(routes.some((route) => route.id === id && route.role === 'error'), `${id} is an explicit business-pipeline failure branch`); assert.ok(routes.some(({id, target}) => id === 'bad-record-rerun' && target === named('rerun-partition')), 'rerun partition has a real incoming recovery edge'); }
  return {nodes, edges, routes, parsedDrawio, parsedSvg, nodeBoxes, viewBox, scale, geometry};
}
function cellRole(cell) { return styleMap(cell.attributes.get('style')).get('semanticRole'); }
function roundedBounds(box) { return [box.left ?? box.x, box.top ?? box.y, box.right ?? box.x + box.width, box.bottom ?? box.y + box.height].map((value) => Math.round(value * 1e6) / 1e6); }
function absoluteCellBounds(cell, cellById) { const own = bounds(cell); const parent = cellById.get(cell.attributes.get('parent')); if (!parent || !parent.geometry.has('x')) return own; const outer = absoluteCellBounds(parent, cellById); return {...own, x: outer.x + own.x, y: outer.y + own.y}; }
function drawioTextBaseline(cell, cellById, label) {
  const box = absoluteCellBounds(cell, cellById); const style = styleMap(cell.attributes.get('style')); const font = number(style.get('fontSize'), `${label} fontSize`); const align = style.get('align') ?? 'center'; const vertical = style.get('verticalAlign') ?? 'middle';
  assert.ok(['left', 'center', 'right'].includes(align), `${label} supported horizontal alignment`); assert.ok(['top', 'middle', 'bottom'].includes(vertical), `${label} supported vertical alignment`);
  const x = align === 'left' ? box.x : align === 'right' ? box.x + box.width : box.x + box.width / 2; const y = vertical === 'top' ? box.y + font * .82 : vertical === 'bottom' ? box.y + box.height - font * .22 : box.y + box.height / 2 + font * .3;
  return {x, y};
}
function normalizedSvgWeight(value) { if (value === undefined || value === 'normal') return 400; if (value === 'bold') return 700; return number(value, 'SVG font weight'); }
function drawioWeight(style) { return Number(style.get('fontStyle') ?? 0) & 1 ? 700 : 400; }
function drawioCornerRadius(cell, label) { const style = styleMap(cell.attributes.get('style')); const box = bounds(cell); assert.equal(style.get('rounded'), '1', `${label} rounded shape`); assert.equal(style.get('absoluteArcSize'), '1', `${label} absolute corner radius`); return Math.min(box.width / 2, box.height / 2, number(style.get('arcSize'), `${label} arcSize`) / 2); }
function assertTextCounterpart(drawioCell, svgText, svg, label, cellById) {
  assert.ok(drawioCell && svgText, `${label} Draw.io/SVG text pair`); assert.equal(drawioCell.attributes.get('vertex'), '1', `${label} is a real Draw.io text vertex`); const style = styleMap(drawioCell.attributes.get('style')); assert.equal(drawioCell.label, elementText(svg, svgText), `${label} visible text parity`); assert.deepEqual(roundedBounds(absoluteCellBounds(drawioCell, cellById)), roundedBounds(textBox(svg, svgText)), `${label} conservative text bounds parity`); assert.equal(style.has('baselineX') || style.has('baselineY'), false, `${label} baseline is not self-reported metadata`); assert.equal(style.get('verticalAlign'), 'middle', `${label} vertical alignment is explicit`); const baseline = drawioTextBaseline(drawioCell, cellById, label); close(baseline.x, number(svgText.attributes.get('x'), `${label} SVG x`), `${label} geometry-derived baseline x`); close(baseline.y, number(svgText.attributes.get('y'), `${label} SVG y`), `${label} geometry-derived baseline y`); assert.equal(number(style.get('fontSize'), `${label} fontSize`), number(svgPresentationValue(svg, svgText, 'font-size'), `${label} SVG font-size`), `${label} font-size parity`); assert.equal(style.get('fontFamily'), svgPresentationValue(svg, svgText, 'font-family'), `${label} font-family parity`); assert.equal(style.get('fontColor'), svgPresentationValue(svg, svgText, 'fill'), `${label} text color parity`); assert.equal(drawioWeight(style), normalizedSvgWeight(svgPresentationValue(svg, svgText, 'font-weight')), `${label} font-weight parity`); assert.equal(({left: 'start', center: 'middle', right: 'end'})[style.get('align') ?? 'center'], svgPresentationValue(svg, svgText, 'text-anchor') ?? 'start', `${label} text alignment parity`); assert.equal(style.get('fillOpacity'), '0', `${label} transparent text vertex fill`); assert.equal(style.get('strokeOpacity'), '0', `${label} transparent text vertex stroke`); assert.equal(style.has('textOpacity'), false, `${label} uses default visible text rather than opacity metadata`);
}
function assertShapeCounterpart(drawioCell, svgShape, svg, label) {
  assert.ok(drawioCell && svgShape, `${label} Draw.io/SVG shape pair`); const style = styleMap(drawioCell.attributes.get('style')); assert.equal(drawioCell.attributes.get('vertex'), '1', `${label} is a real Draw.io shape vertex`); assert.deepEqual(roundedBounds(bounds(drawioCell)), roundedBounds(visibleShapeBounds(svgShape)), `${label} painted bounds parity`); assert.equal(style.get('fillColor'), svgPresentationValue(svg, svgShape, 'fill'), `${label} fill parity`); assert.equal(style.get('strokeColor'), svgPresentationValue(svg, svgShape, 'stroke'), `${label} stroke parity`); assert.equal(number(style.get('strokeWidth'), `${label} strokeWidth`), number(svgPresentationValue(svg, svgShape, 'stroke-width'), `${label} SVG stroke-width`), `${label} stroke-width parity`); assert.equal(drawioCornerRadius(drawioCell, label), number(svgShape.attributes.get('rx'), `${label} SVG rx`), `${label} rendered corner radius parity`); assert.equal(number(svgShape.attributes.get('ry') ?? svgShape.attributes.get('rx'), `${label} SVG ry`), number(svgShape.attributes.get('rx'), `${label} SVG rx`), `${label} symmetric SVG corners`);
}
export function assertEditableCounterparts(drawio, svg) {
  const parsedDrawio = parseDrawio(drawio); const parsedSvg = parseSvg(svg); const cellById = new Map(parsedDrawio.cells.map((cell) => [cell.attributes.get('id'), cell]));
  const exactRoleIds = (role, expected) => assert.deepEqual(parsedDrawio.cells.filter((cell) => cellRole(cell) === role).map(({attributes: item}) => item.get('id')).sort(), [...expected].sort(), `exact Draw.io ${role} inventory`);
  exactRoleIds('region-title', REGION_INVENTORY.map((id) => `title-${id}`)); exactRoleIds('node-title', PRODUCTION_NODES.map((id) => `title-${id}`)); exactRoleIds('node-type', PRODUCTION_NODES.map((id) => `type-${id}`)); exactRoleIds('edge-label', PRODUCTION_CONNECTORS.filter(([, , , , required]) => required).map(([id]) => `label-${id}`)); exactRoleIds('legend-caption', LEGEND_ROLES.flatMap((role) => ['title', 'type'].map((kind) => `legend-caption-${role}-${kind}`))); exactRoleIds('note', NOTE_INVENTORY.map(([id]) => id));
  assert.deepEqual(parsedSvg.elements.filter(({name, attributes: item}) => name === 'text' && item.has('data-region-title-for')).map(({attributes: item}) => item.get('data-region-title-for')).sort(), [...REGION_INVENTORY].sort(), 'exact SVG region-title inventory'); assert.deepEqual(parsedSvg.elements.filter(({name, attributes: item}) => name === 'text' && item.has('data-header-for')).map(({attributes: item}) => item.get('data-header-for')).sort(), [...PRODUCTION_NODES].sort(), 'exact SVG node-title inventory'); assert.deepEqual(parsedSvg.elements.filter(({name, attributes: item}) => name === 'text' && item.has('data-type-for')).map(({attributes: item}) => item.get('data-type-for')).sort(), [...PRODUCTION_NODES].sort(), 'exact SVG node-type inventory'); assert.deepEqual(parsedSvg.elements.filter(({name, attributes: item}) => name === 'text' && item.has('data-edge-id')).map(({attributes: item}) => item.get('data-edge-id')).sort(), PRODUCTION_CONNECTORS.filter(([, , , , required]) => required).map(([id]) => id).sort(), 'exact SVG edge-label inventory'); assert.deepEqual(parsedSvg.elements.filter(({name, attributes: item}) => name === 'text' && item.has('data-legend-caption-for')).map(({attributes: item}) => `${item.get('data-legend-caption-for')}:${item.get('data-caption-kind')}`).sort(), LEGEND_ROLES.flatMap((role) => ['title', 'type'].map((kind) => `${role}:${kind}`)).sort(), 'exact SVG legend-caption inventory');
  for (const id of REGION_INVENTORY) { const region = cellById.get(id); assert.equal(cellRole(region), 'region', `${id} real region role`); const shape = parsedSvg.elements.find(({name, attributes: item}) => name === 'rect' && item.get('data-region-id') === id); assertShapeCounterpart(region, shape, svg, id); const title = cellById.get(`title-${id}`); assert.equal(cellRole(title), 'region-title', `${id} real title role`); assert.equal(title.attributes.get('parent'), id, `${id} title is a real child vertex`); const svgTitle = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get('data-region-title-for') === id); assertTextCounterpart(title, svgTitle, svg, `${id} title`, cellById); }
  for (const id of PRODUCTION_NODES) { const parent = cellById.get(id); assert.equal(cellRole(parent), 'node-shape', `${id} real node role`); assert.equal(parent.label, '', `${id} parent owns no duplicate wording`); assert.equal(styleMap(parent.attributes.get('style')).has('textOpacity'), false, `${id} parent uses no text-opacity hack`); const svgNode = parsedSvg.nodes.find(({attributes: item}) => item.get('data-node-id') === id); assertShapeCounterpart(parent, nodeShape(parsedSvg, svgNode), svg, id); for (const kind of ['title', 'type']) { const child = cellById.get(`${kind}-${id}`); assert.equal(cellRole(child), `node-${kind}`, `${id} real ${kind} role`); assert.equal(child.attributes.get('parent'), id, `${id} ${kind} is a real child vertex`); const svgText = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get(kind === 'title' ? 'data-header-for' : 'data-type-for') === id); assertTextCounterpart(child, svgText, svg, `${id} ${kind}`, cellById); } }
  for (const [id, , , , requiresLabel] of PRODUCTION_CONNECTORS.filter(([, , , , required]) => required)) { assert.equal(requiresLabel, true); const edge = cellById.get(id); assert.equal(edge.label, '', `${id} edge owns no duplicate wording`); assert.equal(styleMap(edge.attributes.get('style')).has('textOpacity'), false, `${id} edge uses no text-opacity hack`); const label = cellById.get(`label-${id}`); assert.equal(cellRole(label), 'edge-label', `${id} real edge-label role`); const svgText = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get('data-edge-id') === id); assertTextCounterpart(label, svgText, svg, `${id} edge label`, cellById); }
  for (const role of LEGEND_ROLES) { const card = cellById.get(`legend-card-${role}`); assert.equal(cellRole(card), 'legend-card', `${role} real legend card`); const svgCard = parsedSvg.elements.find(({name, attributes: item}) => name === 'rect' && item.get('data-legend-card-id') === `legend-card-${role}`); assertShapeCounterpart(card, svgCard, svg, `${role} legend card`); const source = cellById.get(`legend-anchor-${role}-source`); const target = cellById.get(`legend-anchor-${role}-target`); for (const anchor of [source, target]) { assert.equal(cellRole(anchor), 'legend-anchor', `${role} real legend anchor`); const style = styleMap(anchor.attributes.get('style')); assert.equal(style.get('fillOpacity'), '0', `${role} anchor fill hidden`); assert.equal(style.get('strokeOpacity'), '0', `${role} anchor stroke hidden`); } const edge = cellById.get(`legend-edge-${role}`); assert.equal(cellRole(edge), 'legend-edge', `${role} actual legend edge role`); assert.equal(edge.label, '', `${role} legend edge owns no wording`); assert.equal(edge.points.length, 1, `${role} legend has one explicit midpoint waypoint`); const route = drawioRoute(edge, new Map(parsedDrawio.nodes.map((node) => [node.attributes.get('id'), node]))); close(route[1].x, (route[0].x + route[2].x) / 2, `${role} legend midpoint x`); close(route[1].y, (route[0].y + route[2].y) / 2, `${role} legend midpoint y`); for (const kind of ['title', 'type']) { const caption = cellById.get(`legend-caption-${role}-${kind}`); assert.equal(cellRole(caption), 'legend-caption', `${role} real legend caption`); assert.equal(caption.attributes.get('parent'), `legend-card-${role}`, `${role} ${kind} is a real legend-card child`); const svgText = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get('data-legend-caption-for') === role && item.get('data-caption-kind') === kind); assertTextCounterpart(caption, svgText, svg, `${role} legend ${kind}`, cellById); } }
  const drawioNotes = parsedDrawio.cells.filter((cell) => cellRole(cell) === 'note'); const svgNotes = parsedSvg.elements.filter(({name, attributes: item}) => name === 'text' && item.has('data-note-id')); assert.deepEqual(drawioNotes.map(({attributes: item}) => item.get('id')).sort(), NOTE_INVENTORY.map(([id]) => id).sort(), 'exact Draw.io note inventory'); assert.deepEqual(svgNotes.map(({attributes: item}) => item.get('data-note-id')).sort(), NOTE_INVENTORY.map(([id]) => id).sort(), 'exact SVG note inventory');
  for (const [id, text] of NOTE_INVENTORY) { const note = cellById.get(id); const svgText = svgNotes.find(({attributes: item}) => item.get('data-note-id') === id); assert.equal(note.label, text, `${id} exact Draw.io note text`); assert.equal(elementText(svg, svgText), text, `${id} exact SVG note text`); assertTextCounterpart(note, svgText, svg, id, cellById); }
  return {parsedDrawio, parsedSvg};
}
export function assertProductionDiagram(drawio, svg) { assertUniqueDrawioIds(drawio); const result = assertDiagram(drawio, svg, {nodes: PRODUCTION_NODES, connectors: PRODUCTION_CONNECTORS, production: true}); assertEditableCounterparts(drawio, svg); return result; }
function fixtureDiagram() {
  const position = new Map([
    ['order-input', [0, 175]], ['batch-boundary', [240, 0]], ['batch-validate', [480, 0]], ['batch-normalize', [720, 0]], ['batch-price', [960, 0]], ['batch-risk', [1200, 0]], ['batch-output', [1440, 0]], ['batch-barrier', [1680, 0]], ['batch-release', [1920, 0]], ['batch-published-output', [2160, 0]],
    ['stream-boundary', [240, 350]], ['stream-validate', [480, 350]], ['stream-normalize', [720, 350]], ['stream-price', [960, 350]], ['stream-risk', [1200, 350]], ['stream-output', [1440, 350]], ['stream-window-state', [1680, 350]], ['stream-checkpoint', [1920, 350]], ['stream-continuous-output', [2160, 350]],
    ['bad-record-error', [240, 700]], ['technical-failure-error', [1680, 700]], ['unknown-external-effect-error', [1200, 700]], ['backpressure-controller', [0, 700]], ['rerun-partition', [0, 1050]], ['checkpoint-recovery', [2160, 1050]], ['reconcile-authority', [1440, 1050]], ['manual-terminal', [480, 1050]],
    ['legend-data-flow', [0, 1350]], ['legend-backpressure', [600, 1350]], ['legend-error', [1200, 1350]], ['legend-recovery', [1800, 1350]],
  ]);
  const box = (id) => { const [x, y] = position.get(id); return {x, y, width: 200, height: 220}; };
  const nodes = DIAGRAM_NODES.map((id) => { const item = box(id); return `<mxCell id="${id}" value="节点｜类" vertex="1" style="shape=rectangle;rounded=1;fillColor=#FFFFFF;strokeColor=#0F172A;strokeWidth=2;fontSize=45;fontFamily=Arial;fontColor=#111827;"><mxGeometry x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" as="geometry"/></mxCell>`; }).join('');
  const route = (source, target) => { const left = box(source); const right = box(target); return [{x: left.x + left.width, y: left.y + left.height / 2}, {x: right.x, y: right.y + right.height / 2}]; };
  const edges = CONNECTOR_INVENTORY.map(([id, source, target, role]) => { const style = ROLE_STYLES[role]; return `<mxCell id="${id}" value="流" edge="1" source="${source}" target="${target}" style="strokeColor=${style.stroke};strokeWidth=${style.width};dashed=${style.dash ? 1 : 0};dashPattern=${style.dash};endArrow=block;endFill=1;endSize=12;fontSize=45;fontFamily=Arial;fontColor=#111827;exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=1;"><mxGeometry relative="1" as="geometry"><Array as="points"></Array></mxGeometry></mxCell>`; }).join('');
  const markerDefs = Object.keys(ROLE_STYLES).map((role) => `<marker id="arrow-${role}" class="marker marker-${role}" viewBox="-1.5 -2.427051 19.854102 19.854102" refX="18.354" refY="7.5" markerWidth="19.854102" markerHeight="19.854102" markerUnits="userSpaceOnUse" orient="auto" preserveAspectRatio="none" overflow="visible"><path class="marker-shape" d="M 0 0 L 15 7.5 L 0 15 z" stroke-width="3" stroke-linejoin="miter" stroke-miterlimit="10"/></marker>`).join('');
  const shapes = DIAGRAM_NODES.map((id) => { const item = box(id); return `<g class="node" data-node-id="${id}"><rect class="node-shape" x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}"/><text class="node-text" data-header-for="${id}" x="${item.x + 100}" y="${item.y + 80}">节点</text><text class="node-text" data-type-for="${id}" x="${item.x + 100}" y="${item.y + 146}">类</text></g>`; }).join('');
  const paths = CONNECTOR_INVENTORY.map(([id, source, target, role]) => { const points = route(source, target); const dx = points[1].x - points[0].x; const dy = points[1].y - points[0].y; const magnitude = Math.hypot(dx, dy); const offset = id === 'stream-publish' ? -100 : 100; const labelX = (points[0].x + points[1].x) / 2 - dy / magnitude * offset; const labelY = (points[0].y + points[1].y) / 2 + dx / magnitude * offset; return `<path class="edge role-${role}" data-edge-id="${id}" data-source="${source}" data-target="${target}" data-role="${role}" d="M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}"/><text class="edge-label" data-edge-id="${id}" x="${labelX}" y="${labelY}">流</text>`; }).join('');
  const stylesheet = `<style>.diagram { font-family:Arial; } .diagram .node-shape { fill:#FFFFFF; stroke:#0F172A; stroke-width:2; } .node-text,.edge-label { fill:#111827; font-size:45px; text-anchor:middle; } .edge-layer > .edge { fill:none; stroke-width:3; } .role-data-flow { stroke:#0F766E; stroke-dasharray:none; marker-end:url(#arrow-data-flow); } .role-backpressure { stroke:#7C3AED; stroke-dasharray:8 6; marker-end:url(#arrow-backpressure); } .role-error { stroke:#B91C1C; stroke-dasharray:4 4; marker-end:url(#arrow-error); } .role-recovery { stroke:#0369A1; stroke-dasharray:10 5 2 5; marker-end:url(#arrow-recovery); } ${Object.entries(ROLE_STYLES).map(([role, style]) => `.marker-${role} { fill:${style.stroke}; stroke:${style.stroke}; }`).join(' ')}</style>`;
  return {drawio: `<mxfile><root>${nodes}${edges}</root></mxfile>`, svg: `<svg role="img" viewBox="0 0 2400 1600">${stylesheet}<defs>${markerDefs}</defs><g class="diagram">${shapes}<g class="edge-layer">${paths}</g></g></svg>`};
}

test('STY-09 SVG cascade uses the real ancestor tree', () => {
  const source = '<svg><style>.edge-layer { font:15px Arial; font-size:15px; } .edge-layer > .edge { stroke:#0F766E !important; } .marker-role > .marker-shape { fill:#0F766E; stroke:#0F766E; }</style><defs><marker id="m" class="marker-role"><path class="marker-shape" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs><g class="edge-layer" stroke="#B91C1C"><path data-edge-id="edge" class="edge" stroke="#DC2626" style="stroke:#334155"/><text class="edge-label">label</text></g></svg>';
  const parsed = parseSvg(source); const elements = parsed.elements; const edge = elements.find(({attributes: item}) => item.get('data-edge-id') === 'edge'); const label = elements.find(({name}) => name === 'text'); const markerShape = elements.find(({attributes: item}) => item.get('class') === 'marker-shape');
  assert.equal(edge.parent?.attributes.get('class'), 'edge-layer', 'edge retains its actual SVG parent for cascade and inheritance');
  assert.equal(svgPresentationValue(source, edge, 'stroke'), '#0F766E', 'stylesheet important beats inline normal and presentation attributes'); assert.equal(svgPresentationValue(source, label, 'font-size'), '15px', 'inherited group font size resolves'); assert.equal(svgPresentationValue(source, markerShape, 'fill'), '#0F766E', 'marker child selector resolves through parent');
  for (const [name, mutation, elementSelector, property] of [
    ['group class', source.replace('class="edge-layer"', 'class="renamed-layer"'), (items) => items.find(({attributes: item}) => item.get('data-edge-id') === 'edge'), 'stroke'],
    ['edge class', source.replace('class="edge"', 'class="renamed-edge"'), (items) => items.find(({attributes: item}) => item.get('data-edge-id') === 'edge'), 'stroke'],
    ['stylesheet value', source.replace('#0F766E !important', '#000000 !important'), (items) => items.find(({attributes: item}) => item.get('data-edge-id') === 'edge'), 'stroke'],
    ['important removal', source.replace('#0F766E !important', '#0F766E'), (items) => items.find(({attributes: item}) => item.get('data-edge-id') === 'edge'), 'stroke'],
    ['inline important', source.replace('stroke:#334155', 'stroke:#334155 !important'), (items) => items.find(({attributes: item}) => item.get('data-edge-id') === 'edge'), 'stroke'],
    ['marker class', source.replace('class="marker-role"', 'class="renamed-marker"'), (items) => items.find(({attributes: item}) => item.get('class') === 'marker-shape'), 'fill'],
  ]) { assert.notEqual(mutation, source, `${name} mutation applies`); const mutated = parseSvg(mutation).elements; assert.notEqual(svgPresentationValue(mutation, elementSelector(mutated), property), svgPresentationValue(source, elementSelector(elements), property), `${name} changes effective ${property}`); }
});

test('STY-09 glyph clearances use conservative visible boxes at CSS scale', () => {
  const {drawio, svg} = fixtureDiagram();
  const nodeStyle = 'vertex="1" style="shape=rectangle;rounded=1;fillColor=#FFFFFF;strokeColor=#0F172A;strokeWidth=2;fontSize=45';
  for (const [name, mutation, drawioMutation = drawio, expected = /complete CSS-pixel physical geometry/u] of [
    ['horizontal padding', replaceOnce(svg, 'data-header-for="order-input" x="100" y="255">节点</text>', 'data-header-for="order-input" x="100" y="255">节点节点节点</text>', 'near-miss glyph padding'), replaceOnce(drawio, 'value="节点｜类"', 'value="节点节点节点｜类"', 'synchronized long title')],
    ['top padding', replaceOnce(svg, 'data-header-for="batch-boundary" x="340" y="80"', 'data-header-for="batch-boundary" x="340" y="79"', 'near-miss top padding')],
    ['baseline', replaceOnce(svg, 'data-type-for="batch-boundary" x="340" y="146"', 'data-type-for="batch-boundary" x="340" y="145"', 'near-miss baseline')],
    ['bottom padding', replaceOnce(svg, 'data-type-for="batch-boundary" x="340" y="146"', 'data-type-for="batch-boundary" x="340" y="168"', 'near-miss bottom padding')],
    ['edge font', replaceOnce(svg, 'font-size:45px', 'font-size:44.9px', 'near-miss final font'), drawio.replaceAll('fontSize=45', 'fontSize=44.9'), /edge label final font/u],
    ['body font', replaceOnce(svg, '</style>', '.node-text { font-size:44.9px; }</style>', 'near-miss body font'), drawio.replaceAll(nodeStyle, nodeStyle.replace('fontSize=45', 'fontSize=44.9'))],
    ['label to stroke', replaceOnce(svg, 'data-edge-id="batch-validate" x="460" y="210"', 'data-edge-id="batch-validate" x="460" y="172"', 'near-miss label stroke')],
    ['label to real arrow', replaceOnce(svg, 'data-edge-id="batch-validate" x="460" y="210"', 'data-edge-id="batch-validate" x="470" y="70"', 'near-miss label arrow')],
    ['label to foreign node', replaceOnce(svg, 'data-edge-id="batch-validate" x="460" y="210"', 'data-edge-id="batch-validate" x="340" y="430"', 'near-miss foreign node')],
  ]) assert.throws(() => assertDiagram(drawioMutation, mutation), expected, `${name} threshold near miss rejected by measured geometry`);
  const missingTitle = replaceOnce(svg, '<text class="node-text" data-header-for="batch-boundary" x="340" y="80">节点</text>', '', 'mandatory title'); assert.throws(() => assertDiagram(drawio, missingTitle), assert.AssertionError, 'missing mandatory title rejected');
});

test('STY-09 marker clearances use transformed painted geometry', () => {
  const {drawio, svg} = fixtureDiagram(); const markerPath = '<path class="marker-shape" d="M 0 0 L 15 7.5 L 0 15 z" stroke-width="3" stroke-linejoin="miter" stroke-miterlimit="10"/>';
  const harmless = replaceOnce(svg, markerPath, '<path class="marker-shape" transform="translate(0 0) rotate(0) scale(1)" d="M 0 0 L 15 7.5 L 0 15 z" stroke-width="3" stroke-linejoin="miter" stroke-miterlimit="10"/>', 'harmless marker transform'); assert.doesNotThrow(() => assertDiagram(drawio, harmless), 'supported no-op marker transforms are evaluated, not rejected');
  const polygon = replaceOnce(svg, markerPath, '<polygon class="marker-shape" points="0,0 15,7.5 0,15" stroke-width="3" stroke-linejoin="miter" stroke-miterlimit="10"/>', 'marker polygon'); assert.doesNotThrow(() => assertDiagram(drawio, polygon), 'supported marker child shapes are evaluated');
  for (const [name, mutation, expected = /complete CSS-pixel physical geometry/u] of [
    ['transform', replaceOnce(svg, markerPath, '<path class="marker-shape" transform="translate(0 100)" d="M 0 0 L 15 7.5 L 0 15 z" stroke-width="3" stroke-linejoin="miter" stroke-miterlimit="10"/>', 'marker child transform')],
    ['reference point', replaceOnce(svg, 'refX="18.354"', 'refX="-1000"', 'marker refX')],
    ['reference y', replaceOnce(svg, 'refY="7.5"', 'refY="-1000"', 'marker refY')],
    ['viewBox', replaceOnce(svg, 'viewBox="-1.5 -2.427051 19.854102 19.854102"', 'viewBox="0 0 1 1"', 'marker viewBox')],
    ['viewport', replaceOnce(replaceOnce(svg, 'markerWidth="19.854102"', 'markerWidth="600"', 'marker width'), 'markerHeight="19.854102"', 'markerHeight="600"', 'marker height')],
    ['units', replaceOnce(svg, 'markerUnits="userSpaceOnUse"', 'markerUnits="unsupported"', 'marker units'), /markerUnits/u],
    ['orientation', replaceOnce(svg, 'orient="auto"', 'orient="sideways"', 'marker orientation'), /supported orient/u],
    ['painted geometry', replaceOnce(svg, 'd="M 0 0 L 15 7.5 L 0 15 z"', 'd="M 0 0 L 15 600 L 0 15 z"', 'marker painted path')],
  ]) assert.throws(() => assertDiagram(drawio, mutation), expected, `${name} marker mutation rejected from real envelope`);
});

test('STY-09 shared-terminal routes reject a second contact', () => {
  const terminal = {x: 0, y: 0}; const routes = [
    {id: 'left', source: 'shared', target: 'a', points: [terminal, {x: 10, y: 10}, {x: 20, y: 0}]},
    {id: 'right', source: 'shared', target: 'b', points: [terminal, {x: 10, y: 0}, {x: 10, y: 10}, {x: 20, y: 10}]},
  ];
  assert.throws(() => assertRouteIntersections(routes), assert.AssertionError, 'shared endpoint does not excuse a later crossing');
});

test('STY-09 later non-rect paint masks are rejected', () => {
  const {drawio, svg} = fixtureDiagram(); for (const shape of [
    '<path d="M 208 185 L 232 185 L 232 210 L 208 210 z" fill="#FFFFFF"/>',
    '<polygon points="208,185 232,185 232,210 208,210" fill="#FFFFFF" fill-opacity="0.5"/>',
    '<polyline points="208,185 232,185 232,210 208,210" fill="#FFFFFF" fill-opacity="0.5"/>',
    '<circle cx="220" cy="197.5" r="12" fill="#FFFFFF" fill-opacity="0.5"/>',
    '<ellipse cx="220" cy="197.5" rx="12" ry="8" fill="#FFFFFF" fill-opacity="0.5"/>',
    '<circle cx="0" cy="0" r="12" transform="translate(220 197.5)" fill="#FFFFFF" fill-opacity="0.5"/>',
    '<ellipse cx="220" cy="197.5" rx="12" ry="8" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-opacity="0.5"/>',
  ]) { const masked = svg.replace('</svg>', `${shape}</svg>`); assert.notEqual(masked, svg, `${shape.slice(1, shape.indexOf(' '))} mask mutation applies`); assert.throws(() => assertDiagram(drawio, masked), assert.AssertionError, `${shape.slice(1, shape.indexOf(' '))} later translucent mask rejected`); }
  const nodeTextMask = svg.replace('</svg>', '<ellipse cx="340" cy="65" rx="50" ry="30" fill="#FFFFFF"/></svg>'); assert.throws(() => assertDiagram(drawio, nodeTextMask), assert.AssertionError, 'later opaque non-rect mask over node text rejected');
});

test('STY-09 diagram inventory mutation fixtures reject semantic and geometric drift', () => {
  const {drawio, svg} = fixtureDiagram();
  const mutations = [
    ['missing exit port', replaceOnce(drawio, 'exitX=1;', '', 'missing exit port'), svg],
    ['changed entry port', replaceOnce(drawio, 'entryX=0;', 'entryX=0.3;', 'changed entry port'), svg],
    ['missing waypoint array', replaceOnce(drawio, '<Array as="points"></Array>', '', 'missing waypoint array'), svg],
    ['injected sourcePoint', replaceOnce(drawio, '<Array as="points"></Array></mxGeometry>', '<Array as="points"></Array><mxPoint x="0" y="0" as="sourcePoint"/></mxGeometry>', 'injected sourcePoint'), svg],
    ['injected targetPoint', replaceOnce(drawio, '<Array as="points"></Array></mxGeometry>', '<Array as="points"></Array><mxPoint x="1" y="1" as="targetPoint"/></mxGeometry>', 'injected targetPoint'), svg],
    ['swapped batch/stream Filter', replaceOnce(drawio, 'target="batch-normalize"', 'target="stream-normalize"', 'swapped batch/stream Filter'), svg],
    ['removed backpressure arrow', drawio, replaceOnce(svg, 'marker-end:url(#arrow-backpressure);', '', 'removed backpressure arrow')],
    ['backpressure rendered as forward business data', drawio, replaceOnce(svg, 'class="edge role-backpressure" data-edge-id="backpressure-to-stream" data-source="backpressure-controller" data-target="stream-boundary" data-role="backpressure"', 'class="edge role-data-flow" data-edge-id="backpressure-to-stream" data-source="backpressure-controller" data-target="stream-boundary" data-role="data-flow"', 'forward business-data backpressure')],
    ['error branch without terminal', replaceOnce(drawio, 'target="manual-terminal"', 'target="batch-output"', 'error without terminal'), svg],
    ['replay into external effect', replaceOnce(drawio, 'target="reconcile-authority"', 'target="stream-continuous-output"', 'unsafe replay'), svg],
    ['legend drift', drawio, replaceOnce(svg, 'data-header-for="legend-data-flow" x="100" y="1430">节点</text>', 'data-header-for="legend-data-flow" x="100" y="1430">恢复</text>', 'legend drift')],
    ['changed font', drawio.replaceAll('fontSize=45', 'fontSize=44.9'), replaceOnce(svg, 'font-size:45px', 'font-size:44.9px', 'changed font')],
    ['opaque label mask', drawio, svg.replace('</svg>', '<rect x="430" y="170" width="60" height="60" fill="#FFFFFF"/></svg>')],
    ['shifted marker into foreign node or boundary', drawio, replaceOnce(svg, 'refX="18.354"', 'refX="-1000"', 'shifted marker')],
  ];
  for (const [name, drawioMutation, svgMutation] of mutations) {
    assert.notEqual(`${drawioMutation}\n${svgMutation}`, `${drawio}\n${svg}`, `${name} mutation applies`);
    assert.throws(() => assertDiagram(drawioMutation, svgMutation), assert.AssertionError, `${name} rejected`);
  }

  const separated = [
    {id: 'left', source: 'a', target: 'b', points: [{x: 0, y: 0}, {x: 10, y: 0}]},
    {id: 'right', source: 'c', target: 'd', points: [{x: 20, y: 0}, {x: 30, y: 0}]},
  ];
  assert.doesNotThrow(() => assertRouteIntersections(separated), 'separated route baseline');
  const partialOverlap = structuredClone(separated); partialOverlap[1].points[0].x = 5;
  assert.notDeepEqual(partialOverlap, separated, 'partial collinear overlap mutation applies');
  assert.throws(() => assertRouteIntersections(partialOverlap), assert.AssertionError, 'partial collinear overlap rejected');
});

test('STY-09 diagram inventory requires globally unique Draw.io cell IDs', () => {
  const drawio = file(DRAWIO); assert.ok(drawio, 'Draw.io source exists'); assertUniqueDrawioIds(drawio);
  const duplicate = replaceOnce(drawio, 'id="node-order-input"', 'id="node-batch-boundary"', 'duplicate Draw.io id');
  assert.throws(() => assertUniqueDrawioIds(duplicate), /globally unique mxCell ids/u, 'duplicate-ID mutation rejected explicitly');
});

test('STY-09 Draw.io/SVG diagram requires real editable region, text, edge-label and legend counterparts', () => {
  const drawio = file(DRAWIO); assert.ok(drawio, 'Draw.io source exists'); const parsed = parseDrawio(drawio); const roles = parsed.cells.map(({attributes: item}) => styleMap(item.get('style')).get('semanticRole')).filter(Boolean);
  for (const [role, count] of [['region', 5], ['region-title', 5], ['node-shape', 27], ['node-title', 27], ['node-type', 27], ['edge-label', 27], ['legend-card', 4], ['legend-anchor', 8], ['legend-caption', 8], ['note', 3]]) assert.equal(roles.filter((candidate) => candidate === role).length, count, `${count} real Draw.io ${role} cells`);
  assert.equal(parsed.edges.filter(({attributes: item}) => styleMap(item.get('style')).get('semanticRole') === 'legend-edge').length, 4, 'four actual Draw.io legend edge cells');
});

test('STY-09 diagram inventory assigns wording only to visible text vertices', () => {
  const parsed = parseDrawio(file(DRAWIO)); for (const cell of parsed.cells.filter((candidate) => ['node-shape', 'semantic-edge', 'legend-edge'].includes(cellRole(candidate)))) { assert.equal(cell.label, '', `${cell.attributes.get('id')} owner value is empty`); assert.equal(styleMap(cell.attributes.get('style')).has('textOpacity'), false, `${cell.attributes.get('id')} has no text-opacity workaround`); }
});

test('STY-09 Draw.io/SVG diagram derives baselines from real text geometry', () => {
  const parsed = parseDrawio(file(DRAWIO)); for (const cell of parsed.cells.filter((candidate) => ['region-title', 'node-title', 'node-type', 'edge-label', 'legend-caption', 'note'].includes(cellRole(candidate)))) assert.equal(/baseline[XY]=/u.test(cell.attributes.get('style') ?? ''), false, `${cell.attributes.get('id')} has no self-reported baseline`);
});

test('STY-09 Draw.io/SVG diagram binds rendered rounded corners', () => {
  const parsed = parseDrawio(file(DRAWIO)); for (const cell of parsed.cells.filter((candidate) => ['region', 'node-shape', 'legend-card'].includes(cellRole(candidate)))) { const style = styleMap(cell.attributes.get('style')); assert.equal(style.get('absoluteArcSize'), '1', `${cell.attributes.get('id')} absolute arc`); assert.ok(Number(style.get('arcSize')) > 0, `${cell.attributes.get('id')} explicit arcSize`); }
});

test('STY-09 Draw.io/SVG diagram binds actual marker dimensions', () => {
  const drawio = file(DRAWIO); const svg = file(SVG); const parsed = parseDrawio(drawio); for (const edge of parsed.edges) assert.equal(number(styleMap(edge.attributes.get('style')).get('endSize'), `${edge.attributes.get('id')} endSize`), 12, `${edge.attributes.get('id')} explicit marker size`); assertProductionDiagram(drawio, svg); const oldSvgDefault = replaceOnce(svg, 'stroke-miterlimit="10"', 'stroke-miterlimit="4"', 'old SVG marker miter limit'); assert.throws(() => assertProductionDiagram(drawio, oldSvgDefault), /mxGraph marker miter limit/u, 'SVG default miter limit 4 is rejected against mxGraph effective 10');
});

test('STY-09 Draw.io/SVG diagram synchronizes every visible note', () => {
  const drawio = file(DRAWIO); const svg = file(SVG); const parsedDrawio = parseDrawio(drawio); const parsedSvg = parseSvg(svg); const cells = new Map(parsedDrawio.cells.map((cell) => [cell.attributes.get('id'), cell])); for (const [id, text] of NOTE_INVENTORY) { const cell = cells.get(id); const visible = parsedSvg.elements.find(({name, attributes: item}) => name === 'text' && item.get('data-note-id') === id); assert.equal(cell.label, text, `${id} Draw.io text`); assert.equal(elementText(svg, visible), text, `${id} SVG text`); assert.equal(styleMap(cell.attributes.get('style')).get('fontColor'), svgPresentationValue(svg, visible, 'fill'), `${id} note color parity`); }
});

test('STY-09 diagram inventory rejects editable counterpart removal and geometry/style drift', () => {
  const drawio = file(DRAWIO); const svg = file(SVG); const cells = new Map(parseDrawio(drawio).cells.map((cell) => [cell.attributes.get('id'), cell]));
  const cellMutation = (id, change, label) => { const raw = cells.get(id)?.raw; assert.ok(raw, `${label} fixture cell`); const replacement = change(raw); assert.notEqual(replacement, raw, `${label} mutation applies`); return replaceOnce(drawio, raw, replacement, label); };
  for (const [label, id] of [['region removal', 'region-batch'], ['region title removal', 'title-region-batch'], ['node title removal', 'title-node-order-input'], ['node type removal', 'type-node-order-input'], ['edge label removal', 'label-batch-input'], ['legend anchor removal', 'legend-anchor-data-flow-source'], ['legend edge removal', 'legend-edge-data-flow'], ['legend caption removal', 'legend-caption-data-flow-title'], ['note removal', 'note-global-order']]) {
    const mutation = cellMutation(id, () => '', label); assert.throws(() => assertProductionDiagram(mutation, svg), `${label} rejected`);
  }
  for (const [label, id, from, to] of [
    ['region geometry', 'region-batch', 'x="2"', 'x="3"'],
    ['region stroke', 'region-batch', 'strokeWidth=3', 'strokeWidth=4'],
    ['node title geometry baseline', 'title-node-order-input', 'y="53.1"', 'y="54.1"'],
    ['node title vertical alignment', 'title-node-order-input', 'verticalAlign=middle', 'verticalAlign=top'],
    ['node title font', 'title-node-order-input', 'fontSize=45', 'fontSize=44.9'],
    ['node old half-radius arc', 'node-order-input', 'arcSize=48', 'arcSize=24'],
    ['region old half-radius arc', 'region-batch', 'arcSize=56', 'arcSize=28'],
    ['legend card old half-radius arc', 'legend-card-data-flow', 'arcSize=48', 'arcSize=24'],
    ['edge label geometry', 'label-batch-input', 'x="160"', 'x="161"'],
    ['edge owner duplicate wording', 'batch-input', 'value=""', 'value="有限批次"'],
    ['node owner duplicate wording', 'node-order-input', 'value=""', 'value="订单｜输入"'],
    ['legend waypoint', 'legend-edge-data-flow', 'x="300"', 'x="301"'],
    ['legend line width', 'legend-edge-data-flow', 'strokeWidth=3', 'strokeWidth=4'],
    ['legend dash semantics', 'legend-edge-recovery', 'dashPattern=10 5 2 5', 'dashPattern=10 5'],
    ['marker end size', 'batch-input', 'endSize=12', 'endSize=11'],
    ['note font color', 'note-global-order', 'fontColor=#475569', 'fontColor=#111827'],
    ['note geometry', 'note-global-order', 'x="42"', 'x="43"'],
  ]) {
    const mutation = cellMutation(id, (raw) => replaceOnce(raw, from, to, label), label); assert.throws(() => assertProductionDiagram(mutation, svg), `${label} rejected`);
  }
  for (const [label, from, to] of [['SVG node corner', 'data-node-id="node-order-input"><rect class="node-shape node-input" x="2" y="700" width="236" height="260" rx="24"', 'data-node-id="node-order-input"><rect class="node-shape node-input" x="2" y="700" width="236" height="260" rx="23"'], ['SVG region corner', 'data-region-id="region-batch" class="region-shape" x="2" y="60" width="2396" height="560" rx="28"', 'data-region-id="region-batch" class="region-shape" x="2" y="60" width="2396" height="560" rx="27"'], ['SVG nominal marker viewport', 'viewBox="-1.5 -2.427051 19.854102 19.854102"', 'viewBox="0 0 12 12"'], ['SVG marker viewport width', 'markerWidth="19.854102"', 'markerWidth="12"'], ['SVG marker stroke width', 'stroke-width="3" stroke-linejoin="miter"', 'stroke-width="2" stroke-linejoin="miter"'], ['SVG marker reference/tip offset', 'refX="18.354"', 'refX="15"'], ['SVG marker tip/path geometry', 'd="M 0 0 L 15 7.5 L 0 15 z"', 'd="M 0 0 L 12 7.5 L 0 15 z"'], ['SVG note weight', '.region-note { fill:#475569; font-size:36px; font-weight:400; text-anchor:start; }', '.region-note { fill:#475569; font-size:36px; font-weight:700; text-anchor:start; }']]) { const mutation = replaceOnce(svg, from, to, label); assert.throws(() => assertProductionDiagram(drawio, mutation), `${label} rejected`); }
});

test('STY-09 Draw.io/SVG diagram connects business failures and every recovery terminal', () => {
  const drawio = file(DRAWIO); assert.ok(drawio, 'Draw.io source exists'); const ids = new Set(parseDrawio(drawio).edges.map(({attributes: item}) => item.get('id')));
  for (const id of ['bad-record-branch', 'technical-failure-branch', 'unknown-effect-branch', 'bad-record-rerun']) assert.ok(ids.has(id), `${id} connected topology edge`);
});

test('STY-09 diagram inventory uses real mxPoint fallback mutation fixtures', () => {
  const self = readFileSync(new URL(import.meta.url), 'utf8');
  assert.match(self, /<mxPoint[^>]+as="sourcePoint"/u, 'sourcePoint mutation is an actual mxGeometry child');
  assert.match(self, /<mxPoint[^>]+as="targetPoint"/u, 'targetPoint mutation is an actual mxGeometry child');
});

test('STY-09 helper validators reject semantic, table, source, and geometry mutations', () => {
  const article = `---\n${frontMatterFixture(EXACT_METADATA)}\n---\n${REQUIRED_WRAPPERS.map(exactWrapperTag).join('\n')}\n## Filter、Pipe 与 Pipeline 合同\n说明性场景（Tego Arch 架构知识项目分析）。Filter 接受输入并执行转换或判定，产生输出、过滤原因或错误分类。Filter 不证明无状态、纯函数、幂等或并行。Pipe 传递输出并承载容量、缓冲、确认、顺序和错误。Pipe 不自动形成可靠消息队列或事务边界。Pipeline 组合或连接兼容输入合同和输出合同。Pipeline 不保证交换律或事务。Pipes and Filters 不等于消息队列、工作流引擎、事件驱动架构、ETL 产品、Saga 或 shell pipeline。输入结构及身份；成功输出与过滤原因；状态位置；容量和缓冲上限；重放与幂等边界；所有者。\n## 订单双轨：相同转换，不同运行合同\n批处理轨：校验、标准化、定价、风险标记、汇总/输出。流处理轨：校验、标准化、定价、风险标记、汇总/输出。\n${PROHIBITIONS.join('。')}。\n单体处理函数先提取一个 Filter，固定中间合同和幂等键，再建立有界 Pipe 与重放边界。${STOP_CONDITIONS.join('。')}。\n有界缓冲。暂停读取、降低并发、延迟确认、缩小准入、负载削减或拒绝。背压是逐边界容量协议，在不支持反馈的不兼容边界中断。\n| 维度 | 批处理轨 | 流处理轨 | 决策问题 |\n| --- | --- | --- | --- |\n${DIMENSION_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n| 故障 | 检测 | 自动响应 | 停止条件 | 人工所有者 |\n| --- | --- | --- | --- | --- |\n${FAILURE_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}`;
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
    ['copula equivalence', `${article}\nPipeline 可视为消息队列。`, assertConstructsAndOrder],
    ['reverse business data', `${article}\n背压使业务数据反向倒流。`, assertFailureContracts],
    ['automatic end-to-end flow control', `${article}\n背压自动提供跨不兼容边界的端到端流控。`, assertFailureContracts],
  ]) assert.throws(() => validator(changed), assert.AssertionError, `${label} mutation rejected`);
  const bypass = replaceOnce(article, '输入结构及身份；成功输出与过滤原因；状态位置；容量和缓冲上限；重放与幂等边界；所有者。', '', 'Filter-local fields removed') + '\n输入结构及身份；成功输出与过滤原因；状态位置；容量和缓冲上限；重放与幂等边界；所有者。'; assert.throws(() => assertFailureContracts(bypass), assert.AssertionError, 'unrelated Filter-field inventory bypass rejected');
  const {drawio, svg} = fixtureDiagram(); assertDiagram(drawio, svg);
  for (const [name, mutation] of [
    ['edge group class', replaceOnce(svg, 'class="edge-layer"', 'class="renamed-edge-layer"', 'edge group class')],
    ['edge role class', replaceOnce(svg, 'class="edge role-data-flow"', 'class="edge renamed-role"', 'edge role class')],
    ['edge stylesheet', replaceOnce(svg, '.role-data-flow { stroke:#0F766E;', '.role-data-flow { stroke:#000000;', 'edge stylesheet')],
    ['important override', replaceOnce(svg, '</style>', '.role-data-flow { stroke:#000000 !important; }</style>', 'important override')],
    ['label stylesheet', replaceOnce(svg, 'font-size:45px', 'font-size:44.9px', 'label stylesheet')],
    ['marker class', replaceOnce(svg, 'class="marker marker-data-flow"', 'class="marker renamed-marker"', 'marker class')],
  ]) assert.throws(() => assertDiagram(drawio, mutation), assert.AssertionError, `${name} changes effective style and is rejected`);
  const detached = replaceOnce(drawio, 'source="order-input"', '', 'terminal'); assert.throws(() => assertDiagram(detached, svg), assert.AssertionError, 'missing terminal rejected'); const changedPort = replaceOnce(drawio, 'exitX=1', 'exitX=0.7', 'port'); assert.throws(() => assertDiagram(changedPort, svg), assert.AssertionError, 'changed port rejected'); assert.throws(() => assertDiagram(replaceOnce(drawio, '<Array as="points"></Array>', '', 'missing waypoint array'), svg), assert.AssertionError, 'missing waypoint array rejected'); assert.throws(() => assertDiagram(replaceOnce(drawio, '</mxGeometry>', '<mxPoint x="1" y="1"/></mxGeometry>', 'misplaced waypoint'), svg), assert.AssertionError, 'misplaced waypoint rejected'); assert.throws(() => assertDiagram(replaceOnce(drawio, '<Array as="points"></Array></mxGeometry>', '<Array as="points"></Array><mxPoint x="0" y="0" as="sourcePoint"/></mxGeometry>', 'real source fallback point'), svg), assert.AssertionError, 'sourcePoint rejected'); assert.throws(() => assertDiagram(replaceOnce(drawio, '<Array as="points"></Array></mxGeometry>', '<Array as="points"></Array><mxPoint x="1" y="1" as="targetPoint"/></mxGeometry>', 'real target fallback point'), svg), assert.AssertionError, 'targetPoint rejected'); assert.throws(() => assertDiagram(drawio, replaceOnce(svg, 'data-target="stream-boundary"', 'data-target="stream-output"', 'detached backpressure')), assert.AssertionError, 'detached backpressure rejected'); assert.throws(() => assertDiagram(replaceOnce(drawio, 'target="manual-terminal"', 'target="batch-output"', 'error recovery target'), svg), assert.AssertionError, 'error branch without terminal recovery rejected'); const unsafeEdge = '<mxCell id="unsafe-replay-output" edge="1" source="checkpoint-recovery" target="stream-continuous-output" style="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"><mxGeometry relative="1" as="geometry"><Array as="points"></Array></mxGeometry></mxCell>'; assert.throws(() => assertDiagram(drawio.replace('</root>', `${unsafeEdge}</root>`), svg), assert.AssertionError, 'extra unsafe recovery edge rejected');
});

test('STY-09 source fixture rejects coordinated identity, role, primary, and rights mutations', () => {
  const remoteIds = SOURCE_IDS.slice(0, -1); const ledger = {sources: [...remoteIds.map((id) => ({id, ...REMOTE_SOURCE_CONTRACTS[id]})), {id: SOURCE_IDS.at(-1), ...ILLUSTRATION}], documents: {[ARTICLE]: {citations: remoteIds.map((id) => ({source_id: id, citation_url: REMOTE_SOURCE_CONTRACTS[id].canonical_locator, roles: REMOTE_SOURCE_CONTRACTS[id].citation_roles, manifest_primary: REMOTE_SOURCE_CONTRACTS[id].manifest_primary}))}}};
  const inventory = remoteIds.map((id) => `| ${REMOTE_SOURCE_CONTRACTS[id].canonical_locator} |`).join('\n'); const health = {results: remoteIds.map((id) => { const expected = REMOTE_SOURCE_CONTRACTS[id]; const success = {at: '2026-08-17T00:00:00.000Z', outcome: 'healthy', final_transport_locator: expected.transport_locator, http_status: 200, login_wall_detected: false}; return {transport_locator: expected.transport_locator, source_ids: [id], last_attempt: {...success, redirects: []}, last_success: success, attempt_history: [success], review_status: 'healthy'}; })}; assertRemoteSourceContracts(ledger, inventory); assertSourceLinkHealth(health);
  for (const id of SOURCE_IDS) { const deleted = structuredClone(ledger); deleted.sources = deleted.sources.filter((source) => source.id !== id); assert.throws(() => assertRemoteSourceContracts(deleted, inventory), assert.AssertionError, `${id} deletion rejected`); }
  const changed = structuredClone(ledger); changed.sources[0].canonical_locator = 'https://example.invalid/fabricated'; changed.documents[ARTICLE].citations[0].citation_url = 'https://example.invalid/fabricated'; const fabricatedInventory = inventory.replace(REMOTE_SOURCE_CONTRACTS[remoteIds[0]].canonical_locator, 'https://example.invalid/fabricated'); assert.throws(() => assertRemoteSourceContracts(changed, fabricatedInventory), assert.AssertionError, 'coordinated ledger and inventory canonical fabrication rejected');
  const role = structuredClone(ledger); role.sources[1].allowed_evidence_roles = ['learning']; role.documents[ARTICLE].citations[1].roles = ['learning']; assert.throws(() => assertRemoteSourceContracts(role, inventory), assert.AssertionError, 'coordinated source and citation role mutation rejected');
  const primary = structuredClone(ledger); primary.documents[ARTICLE].citations[0].manifest_primary = false; primary.documents[ARTICLE].citations[1].manifest_primary = true; assert.throws(() => assertRemoteSourceContracts(primary, inventory), assert.AssertionError, 'primary reassignment rejected');
  const rights = structuredClone(ledger); rights.sources.at(-1).license_evidence_note = 'fabricated rights'; assert.throws(() => assertRemoteSourceContracts(rights, inventory), assert.AssertionError, 'illustration rights mutation rejected');
  const missingHealth = structuredClone(health); missingHealth.results.shift(); assert.throws(() => assertSourceLinkHealth(missingHealth), assert.AssertionError, 'link-health deletion rejected');
  const changedHealth = structuredClone(health); changedHealth.results[0].last_attempt.final_transport_locator = 'https://example.invalid/fabricated'; assert.throws(() => assertSourceLinkHealth(changedHealth), assert.AssertionError, 'link-health transport fabrication rejected');
});

test('STY-09 article locks metadata, headings, wrappers, components and recovery semantics', () => {
  const {source, body} = articleParts(file(ARTICLE)); assertExactMetadata(source); assertArticleHeadingContract(source); assertRequiredWrappers(source); assertConstructsAndOrder(body); assertDimensionMatrix(body); assertFailureContracts(body); assertNarrativeBoundaries(body);
  for (const [label, changed] of [
    ['H2 deletion', replaceOnce(source, '## 事实边界\n', '', 'H2 deletion')],
    ['H2 reorder', source.replace('## 事实边界', '__HEADING__').replace('## 架构图', '## 事实边界').replace('__HEADING__', '## 架构图')],
    ['H2 duplicate', replaceOnce(source, '## 事实边界\n', '## 事实边界\n\n## 事实边界\n', 'H2 duplicate')],
    ['H2 malformed', replaceOnce(source, '## 事实边界', '##事实边界', 'H2 malformed')],
    ['H3 deletion', replaceOnce(source, '### 可直接复用的机制\n', '', 'H3 deletion')],
    ['H3 reorder', source.replace('### 可直接复用的机制', '__MIGRATION__').replace('### 只能有限类比的部分', '### 可直接复用的机制').replace('__MIGRATION__', '### 只能有限类比的部分')],
    ['H3 duplicate', replaceOnce(source, '### 可直接复用的机制\n', '### 可直接复用的机制\n\n### 可直接复用的机制\n', 'H3 duplicate')],
    ['H3 malformed', replaceOnce(source, '### 可直接复用的机制', '###可直接复用的机制', 'H3 malformed')],
  ]) assert.throws(() => assertArticleHeadingContract(changed), assert.AssertionError, `${label} rejected`);
});

test('STY-09 source governance, reciprocal links, and current Stage B projection are exact', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8')); assertRemoteSourceContracts(ledger, readFileSync('docs/source-license-inventory.md', 'utf8')); assertSourceLinkHealth(JSON.parse(readFileSync('data/source-link-health.json', 'utf8'))); assertRelationsAndProjection();
  for (const source of CONTENT_DOCUMENTS) assert.equal(extractInternalLinks(source).includes('/styles/sty-10'), false, `${source.file} keeps STY-10 non-actionable`);
  const external = extractExternalLinks(CONTENT_DOCUMENTS.find(({file: path}) => path === ARTICLE)); for (const expected of Object.values(REMOTE_SOURCE_CONTRACTS)) assert.ok(external.includes(expected.canonical_locator), `article cites ${expected.canonical_locator}`);
});

test('STY-09 Draw.io/SVG diagram locks batch-stream inventory, terminals, ports, routes and recovery endpoints', () => {
  const drawio = file(DRAWIO); const svg = file(SVG); assert.ok(drawio, `${DRAWIO} must exist after implementation`); assert.ok(svg, `${SVG} must exist after implementation`); assertProductionDiagram(drawio, svg);
  const unsafe = replaceOnce(drawio, 'target="node-reconcile-authority"', 'target="node-stream-continuous-output"', 'replay endpoint'); assert.throws(() => assertProductionDiagram(unsafe, svg), assert.AssertionError, 'replay cannot enter irreversible output');
});
