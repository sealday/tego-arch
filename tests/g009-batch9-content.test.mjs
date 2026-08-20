import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

export const ARTICLE = 'content/styles/sty-08-actor-model.mdx';
export const DRAWIO = 'diagrams/sty-08-actor-order-fulfillment.drawio';
export const SVG = 'static/img/diagrams/sty-08-actor-order-fulfillment.svg';
export const TOPIC_ID = 'STY-08';
export const NEXT_TOPIC = 'STY-09';
export const EXPECTED_HEADINGS = [
  '学习问题', '一页摘要', '事实边界', '架构图', '控制权与任务流',
  '关键源码导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源',
];
export const EPISTEMIC_LABELS = ['已证实事实', '基于证据的推断', '个人分析'];
export const SOURCE_IDS = [
  'src-hewitt-bishop-steiger-actor-formalism-1973',
  'src-akka-actor-model',
  'src-akka-message-delivery-reliability',
  'src-akka-location-transparency',
  'src-microsoft-orleans-overview',
  'src-erlang-28f791c67609',
  'src-atlas-sty08-actor-order-fulfillment',
];
export const ROUTE = '/styles/sty-08';
export const HISTORICAL_STAGE_A = Object.freeze({completed: 60, documents: 103, sources: 535});
export const EXPECTED_CURRENT_PROJECTION = Object.freeze({completed: 63, documents: 106, sources: 550});
export const RELATIONS = Object.freeze({
  depends_on: ['STY-00', 'STY-05'],
  adjacent_topics: ['STY-05', 'STY-06', 'STY-07'],
  related_cases: ['/cases/erlang-otp-supervision-tree'],
  related_questions: [],
});
export const EXACT_METADATA = Object.freeze({
  title: 'Actor Model：用逻辑身份、私有状态与消息隔离并发',
  slug: ROUTE,
  content_type: 'style',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-14',
  source_cutoff: '2026-08-14',
  confidence: 'high',
  domains: ['software-architecture', 'distributed-systems', 'concurrency'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['scalability', 'reliability', 'recoverability', 'operability', 'maintainability'],
  tags: ['架构风格', 'Actor Model', '消息传递', '并发隔离'],
  summary: '以每个订单一个逻辑 Actor 的履约案例，区分身份、私有状态、邮箱、行为与监督，并明确投递、持久化、业务恢复和分布式故障仍需独立设计。',
  topic_id: TOPIC_ID,
  priority: 'P1',
  ...RELATIONS,
});
export const REQUIRED_WRAPPERS = Object.freeze([
  {aria: '共享订单状态与订单 Actor 履约边界对照图，可横向滚动', className: 'architecture-diagram-scroll'},
  {aria: 'Actor、线程、消息消费者、事件驱动与微服务机制对照表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
  {aria: 'Actor Model 采用、谨慎采用与停止决策表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
]);
export const ACTOR_COMPONENTS = Object.freeze([
  ['identity', /逻辑身份[^。；]*(寻址|引用|稳定键)/u, /逻辑身份[^。；]*(不保证|不能|不自动)[^。；]*(生命周期|位置|激活|寻址语义)/u],
  ['private-state', /私有状态[^。；]*(自身行为|Actor 自身)[^。；]*(修改|改变)/u, /私有状态[^。；]*(不隔离|不保证|不能)[^。；]*(数据库|外部服务|网络|共享资源)/u],
  ['mailbox', /邮箱[^。；]*(缓冲|排队)[^。；]*逐条/u, /邮箱[^。；]*(不自动|不保证|不能推导)[^。；]*(持久|有界|FIFO|可靠投递)/u],
  ['behavior', /行为[^。；]*(处理一条消息|改变内部状态|发送后续消息)/u, /行为[^。；]*(不等于|不保证|不能)[^。；]*(业务流程原子|副作用只发生一次|全局事务)/u],
  ['supervision', /监督[^。；]*(重启|停止|升级)/u, /监督[^。；]*(不代替|不能|不保证)[^。；]*(业务恢复|补偿|对账|持久化恢复)/u],
]);
const NEGATED_OWNER = /不负责|不承担|不拥有|不得拥有|不能拥有|不维护|不得维护|不能维护|不由|不得由|不能由|没有所有者|无人负责|责任待定|所有者待定|尚未明确|未指定/u;
const PROHIBITIONS = Object.freeze([
  ['Actor is not thread', /Actor[^。；]*(?:不等于|不是)[^。；]*线程|线程[^。；]*(?:不等于|不是)[^。；]*Actor/iu],
  ['Actor is not consumer', /Actor[^。；]*(?:不等于|不是)[^。；]*(?:普通)?消息消费者|(?:普通)?消息消费者[^。；]*(?:不等于|不是)[^。；]*Actor/iu],
  ['Actor is not event-driven architecture', /Actor[^。；]*(?:不等于|不是)[^。；]*事件驱动架构|事件驱动架构[^。；]*(?:不等于|不是)[^。；]*Actor/iu],
  ['Actor is not microservice', /Actor[^。；]*(?:不等于|不是)[^。；]*微服务|微服务[^。；]*(?:不等于|不是)[^。；]*Actor/iu],
  ['Actor categories can compose', /线程[^。；]*(?:队列|消费者)[^。；]*事件[^。；]*Actor[^。；]*微服务[^。；]*(?:组合|共存)/u],
]);
export const COMPARISONS = ['线程与锁', '普通消息消费者', '事件驱动架构', '微服务'];
export const COMPARISON_ROWS = Object.freeze([
  ['线程与锁', /逻辑并发单元.*私有状态.*消息/u, /不固定绑定线程.*竞争资源.*容量/u],
  ['普通消息消费者', /稳定逻辑身份.*封装状态.*目标身份.*邮箱/u, /共享队列消费者.*不一定.*长期业务实体.*邮箱.*不自动持久/u],
  ['事件驱动架构', /谁拥有状态.*谁处理消息.*事实.*传播/u, /使用事件.*不等于.*Actor.*消息.*不一定.*领域事件/u],
  ['微服务', /更细粒度.*运行时实体.*(?:订单|设备|会话)/u, /不天然.*独立制品.*部署.*数据边界.*团队所有权.*公开服务合同/u],
]);
export const OBSERVATION_POINTS = ['收到消息', '进入邮箱', '开始处理', '业务提交', '发送回复', '外部效果完成'];
export const ADOPTION_ROWS = Object.freeze([
  ['采用', '稳定身份、独立维护有限状态、单实体命令可串行，且活跃集合远小于逻辑实体全集', '身份回收、有界邮箱、状态权威与恢复', '身份冲突、状态无法重建或活跃集合容量不可控'],
  ['谨慎采用', '跨 Actor 查询需要协调、预留或补偿', '幂等、对账、升级、再平衡与故障演练', '热点 Actor 的单邮箱成为吞吐瓶颈'],
  ['停止采用', '即时联接、扫描或聚合查询为主', '评估替代查询与协调边界，并保留数据迁移和回退', '跨 Actor 不变量没有协调机制，或团队无法运营邮箱积压、监督预算、持久化恢复和集群放置'],
]);
const MIGRATION_STEPS = Object.freeze([
  '固定消息合同、状态机、持久化和外部权威',
  '把共享锁或并发写入口收敛为邮箱消息',
  '验证积压、激活、恢复、重放和热点实体',
]);
const MIGRATION_SEQUENCE = `迁移第一步${MIGRATION_STEPS[0]}。第二步${MIGRATION_STEPS[1]}。第三步${MIGRATION_STEPS[2]}。`;
const REQUIRED_SEMANTIC_BOUNDARIES = Object.freeze([
  ['selective mapping', /不(?:把|要求)[^。；]*(?:每个类|每个请求|每个数据库行|每个服务|所有类|所有请求|所有服务)[^。；]*(?:映射|改写|建模)[^。；]*Actor/u],
  ['mailbox limits', /邮箱(?:串行)?[^。；]*(?:不自动|不能)[^。；]*持久化[^。；]*可靠投递[^。；]*全局顺序[^。；]*恰好一次[^。；]*分布式事务[^。；]*外部副作用幂等/u],
  ['supervision limits', /监督[^。；]*(?:不代替|不能)[^。；]*业务拒绝[^。；]*对账[^。；]*补偿[^。；]*(?:业务恢复|持久化恢复)[^。；]*人工终止/u],
  ['location limits', /位置透明[^。；]*(?:不隐藏|不能消除)[^。；]*容量[^。；]*状态迁移[^。；]*故障[^。；]*网络/u],
  ['framework scope', /(?:Akka|Orleans|Erlang\/OTP)[^。；]*(?:实现例证|框架例证|实现合同)[^。；]*(?:不是|不得外推为)[^。；]*(?:模型公理|统一保证)/u],
]);
const MAILBOX_GUARANTEES = Object.freeze(['持久化', '可靠投递', '全局顺序', '恰好一次', '分布式事务', '外部副作用幂等']);
const SUPERVISION_GUARANTEES = Object.freeze(['业务拒绝', '对账', '补偿', '业务恢复', '持久化恢复', '人工终止']);
const LOCATION_HIDDEN_FACTS = Object.freeze(['延迟', '序列化', '网络', '安全', '容量', '放置', '状态迁移', '故障']);
const FORBIDDEN_SEMANTIC_CLAIMS = Object.freeze([
  ['every class is Actor', /每个类[^。；]*(?:都|必须)[^。；]*(?:映射为|建模为|改写为)[^。；]*Actor/u],
  ['every request is Actor', /每个请求[^。；]*(?:都|必须)[^。；]*(?:映射为|建模为|改写为)[^。；]*Actor/u],
  ['every row is Actor', /每个数据库行[^。；]*(?:都|必须)[^。；]*(?:映射为|建模为|改写为)[^。；]*Actor/u],
  ['every service is Actor', /每个(?:微)?服务[^。；]*(?:都|必须)[^。；]*(?:映射为|建模为|改写为)[^。；]*Actor/u],
  ...MAILBOX_GUARANTEES.map((guarantee) => [`mailbox implies ${guarantee}`, new RegExp(`邮箱(?:串行)?(?:(?!不自动|不能|不保证)[^。；])*(?:意味着|保证|自动提供)[^。；]*${guarantee}`, 'u')]),
  ...SUPERVISION_GUARANTEES.map((guarantee) => [`supervision implies ${guarantee}`, new RegExp(`监督(?:(?!不代替|不能|不保证)[^。；])*(?:自动完成|保证|代替)[^。；]*${guarantee}`, 'u')]),
  ...LOCATION_HIDDEN_FACTS.map((hidden) => [`location hides ${hidden}`, new RegExp(`位置透明(?:(?!不隐藏|不能消除)[^。；])*(?:隐藏|消除|无需考虑)[^。；]*${hidden}`, 'u')]),
  ['framework axiom', /(?:Akka|Orleans|Erlang\/OTP)[^。；]*(?:默认行为|实现行为)[^。；]*(?:就是|等于|证明|构成)[^。；]*(?:Actor Model|模型)[^。；]*(?:公理|统一保证)/u],
]);
const FALSE_SEMANTIC_FIXTURES = Object.freeze([
  '每个类都必须映射为 Actor。', '每个请求都必须建模为 Actor。', '每个数据库行都必须改写为 Actor。', '每个微服务都必须映射为 Actor。',
  ...MAILBOX_GUARANTEES.map((guarantee) => `邮箱串行自动提供${guarantee}。`),
  ...SUPERVISION_GUARANTEES.map((guarantee) => `监督自动完成${guarantee}。`),
  ...LOCATION_HIDDEN_FACTS.map((hidden) => `位置透明无需考虑${hidden}。`),
  'Akka 默认行为就是 Actor Model 的公理。',
]);
const ORDER_FLOW_CONTRACTS = Object.freeze([
  ['logical order identity', /Order-123/u], ['command', /SubmitOrder/u], ['operation ID', /操作 ID/u],
  ['correlation ID', /关联 ID/u], ['expected order version', /期望订单版本/u], ['different-order parallelism', /Order-456[^。；]*(并行|同时运行)/u],
  ['inventory authority', /库存(?:边界|系统)[^。；]*(拥有|维护)[^。；]*权威状态/u], ['payment authority', /支付(?:边界|系统)[^。；]*(拥有|维护)[^。；]*权威状态/u], ['notification authority', /通知(?:边界|系统)[^。；]*(拥有|维护)[^。；]*权威状态/u],
  ['order/workflow ownership', /订单 Actor[^。；]*(拥有|管理)[^。；]*订单状态[^。；]*履约协调状态/u], ['timeout unknown', /超时[^。；]*(结果未知|不等于目标未执行)/u],
  ['idempotency', /幂等/u], ['query and reconciliation', /查询[^。；]*对账|对账[^。；]*查询/u], ['external stop path', /外部副作用[^。；]*(人工停止|停止路径)/u],
]);
const RUNTIME_CONTRACTS = Object.freeze([
  ['mailbox capacity', /邮箱[^。；]*(有界|容量|溢出)/u], ['mailbox persistence', /邮箱[^。；]*(持久|不持久)/u], ['mailbox ordering', /邮箱[^。；]*(FIFO|顺序|优先)/u],
  ['framework-scoped delivery', /Akka[^。；]*(至多一次|投递)[^。；]*(实现|框架|范围)/u], ['sender receiver ordering', /发送者[^。；]*接收者[^。；]*(顺序|有序)[^。；]*(跨发送者|重试|中介)/u],
  ['dead letters', /死信/u], ['supervision actions', /重启[^。；]*停止[^。；]*(升级|向上升级)/u], ['restart budget', /重启[^。；]*(预算|强度)/u],
  ['poison message', /毒消息/u], ['business vs execution failure', /业务错误[^。；]*(不等于|不同于|区别)[^。；]*执行故障|执行故障[^。；]*(不等于|不同于|区别)[^。；]*业务错误/u],
  ['state recovery', /状态恢复|恢复状态/u], ['unknown external effect', /外部效果[^。；]*(未知|对账)/u],
  ['location boundary', /位置透明[^。；]*(逻辑身份|逻辑引用)/u], ['latency boundary', /位置透明[^。；]*(不隐藏|不能消除)[^。；]*延迟/u],
  ['serialization boundary', /序列化/u], ['network boundary', /网络(?:分区|故障)/u], ['security boundary', /认证[^。；]*授权[^。；]*加密/u], ['placement boundary', /放置约束|放置[^。；]*节点/u],
  ['hotspot actor', /热点 Actor/u], ['cross-actor invariant', /跨 Actor[^。；]*不变量/u], ['operational stop', /团队无法运营[^。；]*(邮箱积压|监督预算|持久化恢复|集群放置)/u],
]);
export const FAILURE_ROWS = Object.freeze([
  ['邮箱溢出', /邮箱容量.*积压.*丢弃/u, /背压.*拒绝.*降级/u, /容量预算.*仍超限/u, /Actor 运行平台所有者/u],
  ['毒消息', /同一消息.*重复失败.*异常/u, /隔离.*停止自动重放/u, /修复.*验证.*人工批准/u, /消息合同所有者/u],
  ['Actor 崩溃', /执行异常.*健康信号/u, /预算内重启.*停止.*向上升级/u, /重启预算耗尽/u, /Actor 运行平台所有者/u],
  ['状态恢复失败', /快照.*事件日志.*版本冲突/u, /停止激活.*隔离.*恢复/u, /权威状态无法重建/u, /订单状态所有者/u],
  ['外部效果未知', /超时.*无权威结果/u, /操作 ID.*查询.*对账/u, /不可逆效果.*仍未知/u, /履约流程所有者/u],
  ['网络或目标不可用', /超时.*分区.*目标不存在/u, /有界重试.*重新解析.*降级/u, /截止期.*目标仍不可用/u, /运行平台与目标所有者/u],
  ['消息合同不兼容', /反序列化.*版本拒绝.*合同测试/u, /隔离.*兼容版本.*停止发送/u, /无受支持兼容路径/u, /合同生产者与消费者/u],
  ['热点 Actor 积压', /邮箱深度.*最老消息.*处理耗时/u, /限流.*拆分.*转移查询/u, /单邮箱持续违反目标/u, /业务与运行平台所有者/u],
]);
const SOURCE_REQUIRED_FIELDS = ['canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version',
  'source_kind', 'tier', 'allowed_evidence_roles', 'license', 'license_scope', 'license_evidence_url',
  'license_evidence_note', 'copyright_policy', 'usage_boundary'];
const COPYRIGHT_CHECKS = ['original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights'];
const AKKA_ACTOR_READING_ROW = Object.freeze([
  '`Akka 2.10.21` Actor 文档',
  '状态、行为、消息与逐条处理的实现例证',
  '其他运行时采用相同状态、行为或消息处理合同',
]);
const AKKA_ACTOR_SOURCE_LINE = '- [Introduction to Actors](https://doc.akka.io/libraries/akka-core/2.10.21/typed/actors.html) 支持 `Akka Typed` 中的状态封装、行为、消息与逐条处理例证。';
const REMOTE_SOURCE_CONTRACTS = Object.freeze({
  'src-hewitt-bishop-steiger-actor-formalism-1973': Object.freeze({
    canonical_locator: 'https://www.ijcai.org/Proceedings/73/Papers/027B.pdf',
    transport_locator: 'https://www.ijcai.org/Proceedings/73/Papers/027B.pdf', source_kind: 'paper',
    title: 'A Universal Modular ACTOR Formalism for Artificial Intelligence', author_or_org: 'Carl Hewitt, Peter Bishop, and Richard Steiger',
    version: 'IJCAI 1973 proceedings paper 027B; SHA-256 84499709f4e01794f77ba4b623e60a12148c48eba4a86bfc0dc5998ae755bb1a; checked 2026-08-14', checked_at: '2026-08-14', tier: 'primary',
    license: 'LicenseRef-All-Rights-Reserved', license_scope: 'The named IJCAI proceedings paper only; linked and third-party material excluded',
    license_evidence_url: 'https://www.ijcai.org/Proceedings/73/Papers/027B.pdf', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['definition', 'historical-context'], citation_roles: ['definition', 'historical-context'],
    manifest_primary: true,
    license_evidence_note: 'The IJCAI proceedings page exposes no reusable license; Tego Arch retains attribution and uses original factual summary only.',
    usage_boundary: 'Supports the 1973 Actor formalism and historical model boundary; it does not prove behavior, APIs, delivery, persistence, supervision, or production outcomes of a modern runtime.',
    citation_attribution: 'A Universal Modular ACTOR Formalism for Artificial Intelligence, Carl Hewitt, Peter Bishop, and Richard Steiger',
  }),
  'src-akka-actor-model': Object.freeze({
    canonical_locator: 'https://doc.akka.io/libraries/akka-core/2.10.21/typed/actors.html',
    transport_locator: 'https://raw.githubusercontent.com/akka/akka/v2.10.21/akka-docs/src/main/paradox/typed/actors.md', source_kind: 'official-docs',
    title: 'Introduction to Actors', author_or_org: 'Akka maintainers', version: 'Akka 2.10.21, tag v2.10.21, commit f585d64302bf4494b26be705a51ac4050e56d8d1; checked 2026-08-14', checked_at: '2026-08-14', tier: 'primary',
    license: 'LicenseRef-All-Rights-Reserved', license_scope: 'The named Akka 2.10.21 documentation files under the Lightbend Commercial Software License Agreement in akka-docs/LICENSE; no reuse, adaptation, redistribution, code, trademarks, linked works, or third-party material',
    license_evidence_url: 'https://raw.githubusercontent.com/akka/akka/v2.10.21/akka-docs/LICENSE', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['definition', 'implementation', 'runtime-fact'], citation_roles: ['definition', 'implementation'], manifest_primary: false,
    license_evidence_note: 'The v2.10.21 akka-docs/LICENSE is the controlling subdirectory license and grants only limited documentation access/use; Tego Arch uses attributed factual summary without excerpt, adaptation, or redistribution.',
    usage_boundary: 'Akka Typed implementation evidence for encapsulated state, behavior, messaging, and one-message-at-a-time processing; not supervision, failure recovery, or a universal Actor Model guarantee.',
    citation_attribution: 'Introduction to Actors, Akka maintainers',
  }),
  'src-akka-message-delivery-reliability': Object.freeze({
    canonical_locator: 'https://doc.akka.io/libraries/akka-core/2.10.21/general/message-delivery-reliability.html',
    transport_locator: 'https://raw.githubusercontent.com/akka/akka/v2.10.21/akka-docs/src/main/paradox/general/message-delivery-reliability.md', source_kind: 'official-docs',
    title: 'Message Delivery Reliability', author_or_org: 'Akka maintainers', version: 'Akka 2.10.21, tag v2.10.21, commit f585d64302bf4494b26be705a51ac4050e56d8d1; checked 2026-08-14', checked_at: '2026-08-14', tier: 'primary',
    license: 'LicenseRef-All-Rights-Reserved', license_scope: 'The named Akka 2.10.21 documentation files under the Lightbend Commercial Software License Agreement in akka-docs/LICENSE; no reuse, adaptation, redistribution, code, trademarks, linked works, or third-party material',
    license_evidence_url: 'https://raw.githubusercontent.com/akka/akka/v2.10.21/akka-docs/LICENSE', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['comparison', 'implementation', 'runtime-fact'], citation_roles: ['comparison', 'runtime-fact'], manifest_primary: false,
    license_evidence_note: 'The v2.10.21 akka-docs/LICENSE is the controlling subdirectory license and grants only limited documentation access/use; Tego Arch uses attributed factual summary without excerpt, adaptation, or redistribution.',
    usage_boundary: 'Akka-scoped evidence for at-most-once delivery, sender-receiver ordering, dead letters, and local/remote differences; not a cross-framework guarantee.',
    citation_attribution: 'Message Delivery Reliability, Akka maintainers',
  }),
  'src-akka-location-transparency': Object.freeze({
    canonical_locator: 'https://doc.akka.io/libraries/akka-core/2.10.21/general/remoting.html',
    transport_locator: 'https://raw.githubusercontent.com/akka/akka/v2.10.21/akka-docs/src/main/paradox/general/remoting.md', source_kind: 'official-docs',
    title: 'Remoting — Location Transparency', author_or_org: 'Akka maintainers', version: 'Akka 2.10.21, tag v2.10.21, commit f585d64302bf4494b26be705a51ac4050e56d8d1; checked 2026-08-14', checked_at: '2026-08-14', tier: 'primary',
    license: 'LicenseRef-All-Rights-Reserved', license_scope: 'The named Akka 2.10.21 documentation files under the Lightbend Commercial Software License Agreement in akka-docs/LICENSE; no reuse, adaptation, redistribution, code, trademarks, linked works, or third-party material',
    license_evidence_url: 'https://raw.githubusercontent.com/akka/akka/v2.10.21/akka-docs/LICENSE', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['comparison', 'implementation', 'runtime-fact'], citation_roles: ['comparison', 'runtime-fact'], manifest_primary: false,
    license_evidence_note: 'The v2.10.21 akka-docs/LICENSE is the controlling subdirectory license and grants only limited documentation access/use; Tego Arch uses attributed factual summary without excerpt, adaptation, or redistribution.',
    usage_boundary: 'Akka-scoped logical addressing example; it does not hide latency, serialization, network failure, security, placement, or state-migration boundaries.',
    citation_attribution: 'Remoting — Location Transparency, Akka maintainers',
  }),
  'src-microsoft-orleans-overview': Object.freeze({
    canonical_locator: 'https://learn.microsoft.com/en-us/dotnet/orleans/overview',
    transport_locator: 'https://raw.githubusercontent.com/dotnet/docs/a4303ce92aa169102f57793c84aae0603c75c3a3/docs/orleans/overview.md', source_kind: 'official-docs',
    title: 'Orleans overview', author_or_org: 'Microsoft', version: 'dotnet/docs commit a4303ce92aa169102f57793c84aae0603c75c3a3 (overview dated 2026-01-20; version pivots 7.0–10.0); checked 2026-08-14', checked_at: '2026-08-14', tier: 'primary',
    license: 'CC-BY-4.0', license_scope: 'The named dotnet/docs Orleans overview file at commit a4303ce92aa169102f57793c84aae0603c75c3a3 under CC BY 4.0; code, trademarks, linked works, media, and third-party material excluded',
    license_evidence_url: 'https://raw.githubusercontent.com/dotnet/docs/a4303ce92aa169102f57793c84aae0603c75c3a3/LICENSE', copyright_policy: 'adapt-with-attribution',
    allowed_evidence_roles: ['comparison', 'implementation', 'runtime-fact'], citation_roles: ['comparison', 'implementation'], manifest_primary: false,
    license_evidence_note: 'The pinned dotnet/docs LICENSE at the same commit contains CC BY 4.0 and governs the repository documentation snapshot used here.',
    usage_boundary: 'Version-pivoted Microsoft Orleans overview at the pinned documentation commit for virtual identity, activation, placement, and persistence orientation; not proof of one runtime release defaults, configuration, or production outcomes.',
    citation_attribution: 'Orleans overview, Microsoft',
  }),
  'src-erlang-28f791c67609': Object.freeze({
    canonical_locator: 'https://www.erlang.org/doc/system/sup_princ.html',
    transport_locator: 'https://raw.githubusercontent.com/erlang/otp/OTP-28.5/system/doc/design_principles/sup_princ.md', source_kind: 'official-docs',
    title: 'Supervisor Behaviour — OTP Design Principles', author_or_org: 'Erlang/OTP maintainers', version: 'Erlang/OTP 28.5, tag OTP-28.5, commit f4506ee46d68694a1d23ca81c314092fd83e8f85; checked 2026-08-14', checked_at: '2026-08-14', tier: 'primary',
    license: 'Apache-2.0', license_scope: 'The named work/page within the evidenced Apache-2.0 scope; trademarks, linked works, code or media under separate notices, and third-party assets excluded',
    license_evidence_url: 'https://raw.githubusercontent.com/erlang/otp/OTP-28.5/LICENSE.txt', copyright_policy: 'facts-and-short-quotation',
    allowed_evidence_roles: ['case-evidence', 'comparison', 'definition', 'historical-context', 'implementation', 'learning', 'method', 'runtime-fact'], citation_roles: ['comparison', 'runtime-fact'], manifest_primary: false,
    license_evidence_note: 'The pinned OTP-28.5 source file carries an Apache-2.0 SPDX header and the same tag includes LICENSE.txt with Apache License 2.0.',
    usage_boundary: 'Erlang/OTP supervision-tree, escalation, and restart-intensity implementation evidence; not proof that all Actor runtimes use the same hierarchy or recovery semantics.',
    citation_attribution: 'Supervisor Behaviour — OTP Design Principles, Erlang/OTP maintainers',
  }),
});
const RECIPROCALS = Object.freeze([
  'content/styles/sty-05-microservices.mdx', 'content/styles/sty-06-event-driven-architecture.mdx',
  'content/styles/sty-07-service-oriented-architecture.mdx', 'content/cases/erlang-otp-supervision-tree.mdx',
]);
const DIAGRAM_NODES = Object.freeze([
  'actor-comparison-canvas', 'shared-state-boundary', 'actor-runtime-boundary', 'external-authority-boundary', 'legend-band',
  'shared-caller-a', 'shared-caller-b', 'shared-order-state', 'shared-side-effect',
  'runtime-node-a', 'runtime-node-b', 'order-123-actor', 'order-123-mailbox', 'order-123-private-state', 'order-123-behavior',
  'order-456-actor', 'order-456-mailbox', 'order-456-private-state', 'order-456-behavior',
  'order-supervisor', 'order-persistence', 'inventory-authority', 'payment-authority', 'notification-authority', 'recovery-path',
]);
const CONNECTOR_STYLES = Object.freeze({
  'local-message': Object.freeze({strokeColor: '#1D4ED8', strokeWidth: '4', dashed: '0', endArrow: 'block', endFill: '1'}),
  'remote-message': Object.freeze({strokeColor: '#047857', strokeWidth: '4', dashed: '1', dashPattern: '12 8', endArrow: 'block', endFill: '1'}),
  'supervision-signal': Object.freeze({strokeColor: '#7C3AED', strokeWidth: '3', dashed: '1', dashPattern: '4 6', endArrow: 'open', endFill: '0'}),
  'persistence-record': Object.freeze({strokeColor: '#92400E', strokeWidth: '4', dashed: '0', endArrow: 'block', endFill: '1'}),
  reconciliation: Object.freeze({strokeColor: '#0F766E', strokeWidth: '4', dashed: '1', dashPattern: '12 6 3 6', endArrow: 'open', endFill: '0'}),
  'external-effect': Object.freeze({strokeColor: '#BE123C', strokeWidth: '4', dashed: '0', endArrow: 'block', endFill: '1'}),
});
const LEGEND_INVENTORY = Object.freeze([
  ['local-message', 'legend-key-local-message', 'legend-caption-local-message', '本地邮箱消息｜实线闭合箭头'],
  ['remote-message', 'legend-key-remote-message', 'legend-caption-remote-message', '远程消息｜长虚线闭合箭头'],
  ['supervision-signal', 'legend-key-supervision-signal', 'legend-caption-supervision-signal', '监督信号｜短虚线开放箭头'],
  ['persistence-record', 'legend-key-persistence-record', 'legend-caption-persistence-record', '持久化记录｜实线闭合箭头'],
  ['reconciliation', 'legend-key-reconciliation', 'legend-caption-reconciliation', '查询与对账｜点划线开放箭头'],
  ['external-effect', 'legend-key-external-effect', 'legend-caption-external-effect', '外部副作用｜实线闭合箭头'],
]);
const CONNECTOR_INVENTORY = Object.freeze([
  ['submit-order-123', 'runtime-node-a', 'order-123-mailbox', 'local-message', 'SubmitOrder'],
  ['mailbox-to-behavior-123', 'order-123-mailbox', 'order-123-behavior', 'local-message', '逐条处理'],
  ['behavior-to-state-123', 'order-123-behavior', 'order-123-private-state', 'local-message', '修改私有状态'],
  ['reserve-inventory', 'order-123-actor', 'inventory-authority', 'remote-message', '预留库存'],
  ['authorize-payment', 'order-123-actor', 'payment-authority', 'external-effect', '支付授权'],
  ['send-notification', 'order-123-actor', 'notification-authority', 'external-effect', '发送通知'],
  ['supervise-order-123', 'order-supervisor', 'order-123-actor', 'supervision-signal', '重启／停止／升级'],
  ['persist-order-123', 'order-123-actor', 'order-persistence', 'persistence-record', '记录决定与阶段'],
  ['recover-order-123', 'order-persistence', 'recovery-path', 'persistence-record', '恢复持久化事实'],
  ['reconcile-inventory', 'recovery-path', 'inventory-authority', 'reconciliation', '查询库存结果'],
  ['reconcile-payment', 'recovery-path', 'payment-authority', 'reconciliation', '查询支付结果'],
  ['location-transparent-order-456', 'runtime-node-a', 'order-456-mailbox', 'remote-message', '逻辑身份跨节点'],
]);
const STRUCTURAL_CONNECTOR_INVENTORY = Object.freeze([
  ['actor-123-mailbox', 'order-123-actor', 'order-123-mailbox', 'actor-mailbox'],
  ['actor-123-state', 'order-123-actor', 'order-123-private-state', 'actor-private-state'],
  ['actor-123-behavior', 'order-123-actor', 'order-123-behavior', 'actor-behavior'],
  ['actor-456-mailbox', 'order-456-actor', 'order-456-mailbox', 'actor-mailbox'],
  ['actor-456-state', 'order-456-actor', 'order-456-private-state', 'actor-private-state'],
  ['actor-456-behavior', 'order-456-actor', 'order-456-behavior', 'actor-behavior'],
]);
const MEASURED_NODE_IDS = Object.freeze([
  'shared-order-state', 'order-123-actor', 'order-123-mailbox', 'order-123-private-state', 'order-123-behavior',
  'order-456-actor', 'order-supervisor', 'order-persistence', 'inventory-authority', 'payment-authority', 'notification-authority',
]);
const REAL_PANEL_GEOMETRIES = Object.freeze({
  'actor-runtime-boundary': [60, 1320, 2280, 2580],
  'external-authority-boundary': [60, 4550, 2280, 2050],
  'runtime-node-a': [100, 1550, 1190, 2250],
  'runtime-node-b': [1300, 1550, 1040, 2250],
  'order-123-actor': [200, 1900, 1090, 1450],
  'order-456-actor': [1300, 1900, 1040, 1450],
});
const PANEL_IDS = Object.freeze(['shared-state-boundary', 'actor-runtime-boundary', 'external-authority-boundary', 'legend-band', ...Object.keys(REAL_PANEL_GEOMETRIES).filter((id) => !['actor-runtime-boundary', 'external-authority-boundary'].includes(id))]);
const PANEL_TERMINAL_CROSSINGS = Object.freeze([
  ['submit-order-123', 'runtime-node-a', 'source'], ['submit-order-123', 'order-123-actor', 'target'],
  ['reserve-inventory', 'order-123-actor', 'source'], ['reserve-inventory', 'runtime-node-a', 'source'], ['reserve-inventory', 'actor-runtime-boundary', 'source'], ['reserve-inventory', 'external-authority-boundary', 'target'],
  ['authorize-payment', 'order-123-actor', 'source'], ['authorize-payment', 'runtime-node-a', 'source'], ['authorize-payment', 'actor-runtime-boundary', 'source'], ['authorize-payment', 'external-authority-boundary', 'target'],
  ['send-notification', 'order-123-actor', 'source'], ['send-notification', 'runtime-node-a', 'source'], ['send-notification', 'actor-runtime-boundary', 'source'], ['send-notification', 'external-authority-boundary', 'target'],
  ['supervise-order-123', 'order-123-actor', 'target'], ['persist-order-123', 'order-123-actor', 'source'],
  ['recover-order-123', 'runtime-node-a', 'source'], ['recover-order-123', 'actor-runtime-boundary', 'source'], ['recover-order-123', 'external-authority-boundary', 'target'],
  ['location-transparent-order-456', 'runtime-node-a', 'source'], ['location-transparent-order-456', 'runtime-node-b', 'target'], ['location-transparent-order-456', 'order-456-actor', 'target'],
  ['actor-123-mailbox', 'order-123-actor', 'source'], ['actor-123-state', 'runtime-node-a', 'source'], ['actor-123-state', 'order-123-actor', 'source'], ['actor-123-behavior', 'order-123-actor', 'source'],
  ['actor-456-mailbox', 'order-456-actor', 'source'], ['actor-456-state', 'actor-runtime-boundary', 'source'], ['actor-456-state', 'runtime-node-b', 'source'], ['actor-456-state', 'order-456-actor', 'source'], ['actor-456-behavior', 'order-456-actor', 'source'],
]);
const ILLUSTRATION = Object.freeze({
  canonical_locator: '/img/diagrams/sty-08-actor-order-fulfillment.svg',
  transport_locator: '/img/diagrams/sty-08-actor-order-fulfillment.svg',
  source_kind: 'original-illustration', tier: 'primary', allowed_evidence_roles: ['illustration'],
  license: 'LicenseRef-Atlas-Original',
  license_scope: 'The named project-authored sty-08-actor-order-fulfillment.svg asset only',
  license_evidence_url: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/sty-08-actor-order-fulfillment.svg',
  license_evidence_note: 'The project-authored Draw.io/SVG pair contains no third-party topology, reference image, brand visual, signature, watermark, or copied composition.',
  copyright_policy: 'original-atlas',
  usage_boundary: 'Original teaching comparison of shared order state and per-order Actors; illustration-only and not evidence of runtime guarantees or production outcomes.',
});
const ILLUSTRATION_CITATION = Object.freeze({
  citation_url: ILLUSTRATION.canonical_locator, roles: ['illustration'], manifest_primary: false,
  usage_mode: 'original-illustration',
  attribution_note: '共享订单状态与订单 Actor 履约边界对照图，Tego Arch maintainers',
  modification_note: 'Created as an original synchronized Draw.io/SVG pair without third-party topology, reference imagery, brand visuals, signatures, watermarks, or copied composition.',
  excerpt: null, quotation_reviewed: false,
});

function file(path) { try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; } }
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
  assert.equal(document.citations.find(({manifest_primary}) => manifest_primary)?.source_id, remoteIds[0], '1973 Actor paper is primary');
  assert.ok(new Set(remoteIds.map((id) => new URL(REMOTE_SOURCE_CONTRACTS[id].canonical_locator).hostname)).size >= 4, 'at least four independent remote hostnames');
  const rows = inventoryRows(inventorySource);
  for (const id of remoteIds) {
    const expected = REMOTE_SOURCE_CONTRACTS[id]; const source = ledger.sources.find((entry) => entry.id === id);
    const citation = document.citations.find((entry) => entry.source_id === id); assert.ok(source && citation, `${id} source and citation`);
    for (const field of ['canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version', 'checked_at', 'source_kind', 'tier', 'license', 'license_scope', 'license_evidence_url', 'license_evidence_note', 'copyright_policy', 'usage_boundary']) {
      assert.equal(source[field], expected[field], `${id}.${field}`);
    }
    assert.deepEqual(source.allowed_evidence_roles, expected.allowed_evidence_roles, `${id} exact allowed evidence roles`);
    assert.equal(source.license_evidence_note, expected.license_evidence_note, `${id} exact license evidence note`);
    assert.equal(source.usage_boundary, expected.usage_boundary, `${id} framework/model-specific usage boundary`);
    assert.equal(citation.citation_url, expected.canonical_locator, `${id} citation canonical locator`);
    assert.deepEqual(citation.roles, expected.citation_roles, `${id} exact citation roles`);
    assert.equal(citation.manifest_primary, expected.manifest_primary, `${id} exact primary flag`);
    assert.equal(citation.usage_mode, 'facts-summary', `${id} facts-summary only`);
    assert.equal(citation.attribution_note, expected.citation_attribution, `${id} exact citation attribution`);
    const inventory = rows.find(([family]) => family === expected.canonical_locator); assert.ok(inventory, `${id} inventory identity`);
    assert.deepEqual(inventory.slice(1, 9), [expected.canonical_locator, expected.author_or_org, expected.license_evidence_url,
      expected.license_evidence_note, expected.checked_at, expected.license, expected.license_scope, expected.copyright_policy], `${id} exact inventory alignment`);
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
export function assertExactMetadata(source) { assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-08 front matter'); }
export function assertRequiredWrappers(source) {
  for (const wrapper of REQUIRED_WRAPPERS) assert.ok(source.includes(exactWrapperTag(wrapper)), `exact scroll wrapper: ${wrapper.aria}`);
  assert.equal((source.match(/role="region"/gu) ?? []).length, 3, 'exactly three scroll owners');
}
export function assertActorComponents(source) {
  for (const [name, positive, boundary] of ACTOR_COMPONENTS) {
    const sentence = source.split(/[。；\n]/u).find((candidate) => positive.test(candidate));
    assert.ok(sentence, `${name} affirmative responsibility`); assert.doesNotMatch(sentence, NEGATED_OWNER, `${name} positive responsibility cannot be negated`);
    assert.match(source, boundary, `${name} explicit non-guarantee`);
  }
}
export function assertProhibitions(source) {
  for (const [name, pattern] of PROHIBITIONS) assert.match(source, pattern, name);
  const counterpart = '(?:线程|普通消息消费者|事件驱动架构|微服务)'; const equality = '(?:就是|(?<!不)等于)'; const local = '[^。；\\n|]*';
  assert.doesNotMatch(source, new RegExp(`(?:Actor${local}${equality}${local}${counterpart}|${counterpart}${local}${equality}${local}Actor)`, 'iu'), 'Actor/counterpart equivalence is forbidden in either direction');
  for (const clause of source.split(/[。；\n|]/u).map((value) => value.trim()).filter(Boolean)) for (const mechanism of COMPARISONS) {
    const counterpartName = mechanism === '线程与锁' ? '线程' : mechanism; const excludesComposition = /(?:不能|不得)/u.test(clause) && /(?:组合|共存)/u.test(clause);
    assert.ok(!(clause.includes('Actor') && clause.includes(counterpartName) && excludesComposition), `Actor/${counterpartName} mutual exclusion forbidden in any clause ordering`);
  }
  assert.doesNotMatch(source, /(?:只能|必须)[^。；]*(?:Actor|线程|队列|事件驱动|微服务)[^。；]*(?:不能|不得)[^。；]*(?:组合|共存)/u, 'mechanisms cannot be made mutually exclusive');
}
function assertClauseLocalSemanticClaims(source) {
  const domains = [
    ['mailbox', /邮箱/u, MAILBOX_GUARANTEES, /保证|自动提供|意味着/gu],
    ['supervision', /监督/u, SUPERVISION_GUARANTEES, /自动完成|保证|代替/gu],
    ['location transparency', /位置透明/u, LOCATION_HIDDEN_FACTS, /隐藏|消除|无需考虑|不必考虑/gu],
  ];
  for (const sentence of source.split(/[。；\n]/u).filter(Boolean)) for (const [domain, subject, claims, positive] of domains) {
    if (!subject.test(sentence)) continue;
    for (const clause of sentence.split(/[，,]\s*|(?=但|却|而)/u).map((value) => value.trim()).filter(Boolean)) for (const claim of claims) {
      if (!clause.includes(claim)) continue;
      for (const verb of clause.matchAll(positive)) {
        const inherentlyPositive = /^(?:无需考虑|不必考虑)$/u.test(verb[0]); const prefix = clause.slice(0, verb.index);
        assert.ok(!inherentlyPositive && /(?:不|未|不得|不能)(?:自动)?\s*$/u.test(prefix), `${domain} ${claim} positive claim forbidden in its own clause`);
      }
    }
  }
}
export function assertSemanticBoundaries(source) {
  for (const [name, pattern] of REQUIRED_SEMANTIC_BOUNDARIES) assert.match(source, pattern, `${name} explicit boundary`);
  for (const [name, pattern] of FORBIDDEN_SEMANTIC_CLAIMS) assert.doesNotMatch(source, pattern, `${name} contradiction forbidden`);
  assertClauseLocalSemanticClaims(source);
}
function exactRows(table, expected, heading, columns, affirmativeCells = []) {
  assert.deepEqual(table[0], heading, 'exact table header');
  assert.match(table[1].join('|'), /^-+/u, 'table divider');
  assert.equal(table.length, expected.length + 2, 'exact row count');
  for (const [index, [label, ...patterns]] of expected.entries()) {
    const row = table[index + 2]; assert.equal(row[0], label, `row ${index + 1} label/order`);
    assert.equal(row.length, columns, `${label} cell count`);
    for (const [cell, pattern] of patterns.entries()) {
      if (typeof pattern === 'string') assert.equal(row[cell + 1], pattern, `${label} exact cell ${cell + 1}`);
      else assert.match(row[cell + 1], pattern, `${label} cell ${cell + 1}`);
      if (affirmativeCells.includes(cell)) assert.doesNotMatch(row[cell + 1], NEGATED_OWNER, `${label} cell ${cell + 1} affirmative polarity`);
    }
  }
}
export function assertComparisonTable(source) {
  const table = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '对照对象');
  assert.ok(table, 'four-row Actor comparison table');
  exactRows(table, COMPARISON_ROWS, ['对照对象', 'Actor Model 的决定性区别', '不得外推'], 3, [0]);
  assert.match(source, /不是成熟度阶梯/u, 'comparison is not a maturity ladder');
  assert.doesNotMatch(source, /(?:构成|形成|属于|(?<!不)是)(?:一条|一个|同一)?成熟度阶梯/u, 'comparison cannot fabricate a maturity ladder');
}
export function assertFailureTable(source) {
  const table = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别');
  assert.ok(table, 'eight-row failure table');
  exactRows(table, FAILURE_ROWS, ['失败类别', '检测', '自动动作', '停止条件', '人工所有者'], 5, [3]);
  assert.doesNotMatch(source, /无限(?:重启|重试)|无预算(?:重启|重试)/u, 'unlimited restart/retry forbidden');
}
export function assertOrderFlow(source) {
  for (const [name, pattern] of ORDER_FLOW_CONTRACTS) assert.match(source, pattern, name);
  for (const [name, pattern] of ORDER_FLOW_CONTRACTS.filter(([name]) => /authority|ownership/u.test(name))) {
    const sentence = source.split(/[。；\n]/u).find((candidate) => pattern.test(candidate)); assert.ok(sentence, `${name} affirmative sentence`); assert.doesNotMatch(sentence, NEGATED_OWNER, `${name} cannot be negated or unresolved`);
  }
  const observed = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '观察点'); assert.ok(observed, 'observation-point table');
  assert.deepEqual(observed.slice(2).map((row) => row[0]), OBSERVATION_POINTS, 'six distinct checkpoints in order');
  assert.doesNotMatch(source, /进入邮箱即证明(?:支付|外部效果).*完成/u, 'mailbox entry cannot prove an external effect');
  assert.doesNotMatch(source, /超时证明目标未执行/u, 'timeout cannot prove non-execution');
}
export function assertRuntimeBoundaries(source) {
  for (const [name, pattern] of RUNTIME_CONTRACTS) assert.match(source, pattern, name);
  const clauses = source.split(/[。；\n]/u); const mailboxCandidates = RUNTIME_CONTRACTS.slice(0, 3).map(([name, pattern]) => {
    const indices = clauses.flatMap((clause, index) => pattern.test(clause) ? [index] : []); assert.ok(indices.length > 0, `${name} clause`); return indices;
  });
  assert.ok(mailboxCandidates[0].some((capacity) => mailboxCandidates[1].some((persistence) => persistence !== capacity && mailboxCandidates[2].some((ordering) => ordering !== capacity && ordering !== persistence))), 'mailbox capacity, persistence, and ordering use separate clauses');
  assert.doesNotMatch(source, /无限(?:重启|重试)|无预算(?:重启|重试)/u, 'unlimited restart/retry forbidden');
}
export function assertAdoptionContract(source) {
  const table = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '决策'); assert.ok(table, 'adoption/caution/stop matrix');
  exactRows(table, ADOPTION_ROWS, ['决策', '适用信号', '前置责任', '停止或收紧条件'], 4);
  assert.ok(source.includes(MIGRATION_SEQUENCE), 'exact ordered migration sequence');
  assert.match(table.flat().join(' '), /热点 Actor/u, 'hotspot decision visible');
  assert.match(table.flat().join(' '), /跨 Actor.*不变量/u, 'cross-Actor invariant decision visible');
  assert.match(table.flat().join(' '), /团队无法运营.*邮箱积压.*监督预算.*持久化恢复.*集群放置/u, 'operational stopping condition visible');
  assert.doesNotMatch(source, /热点 Actor[^。；]*(?:永远|一定)?不会[^。；]*吞吐瓶颈/u, 'hotspot contradiction forbidden');
  assert.doesNotMatch(source, /跨 Actor[^。；]*不变量[^。；]*(?:无需|不必|没有必要)[^。；]*(?:协调|预留|补偿)/u, 'cross-Actor coordination contradiction forbidden');
  assert.doesNotMatch(source, /团队[^。；]*(?:无需|不必)运营[^。；]*(?:邮箱积压|监督预算|持久化恢复|集群放置)/u, 'operational-responsibility contradiction forbidden');
  assert.doesNotMatch(source, /先把(?:所有|每个)[^。；]*(?:服务|数据库行|实体)[^。；]*改写为 Actor/u, 'universal Actor migration forbidden');
}
export function assertArticleStructure(source) {
  const headings = findMarkdownHeadings(articleParts(source).body).filter(({level}) => level === 2).map(({text}) => text);
  assert.deepEqual(headings, EXPECTED_HEADINGS, 'exact ten-H2 architecture article contract');
  const expectedSections = new Map([['已证实事实', '事实边界'], ['基于证据的推断', '架构决策与权衡'], ['个人分析', '控制权与任务流']]);
  for (const label of EPISTEMIC_LABELS) {
    const matches = [...source.matchAll(new RegExp(`\\*\\*${label}：\\*\\*`, 'gu'))];
    assert.equal(matches.length, 1, `${label} appears exactly once without mechanical repetition`);
    const section = expectedSections.get(label); const start = source.indexOf(`## ${section}\n`); const next = source.indexOf('\n## ', start + 4);
    assert.ok(matches[0].index > start && (next === -1 || matches[0].index < next), `${label} belongs to ${section}`);
  }
}
export function assertAkkaActorEvidenceScope(source) {
  const body = articleParts(source).body;
  assert.ok(body.includes(AKKA_ACTOR_SOURCE_LINE), 'Introduction to Actors exact supported scope');
  const reading = markdownTables(body).find((candidate) => candidate[0]?.[0] === '阅读入口');
  assert.ok(reading, 'decisive-source reading table');
  assert.deepEqual(reading.find(([entry]) => entry === AKKA_ACTOR_READING_ROW[0]), AKKA_ACTOR_READING_ROW, 'Akka Actor reading row stays within pinned file scope');
  assert.match(body, /Erlang\/OTP 28\.5 监督文档[^\n]*层级监督、向上升级与重启强度/u, 'Erlang/OTP remains the supervision implementation evidence');
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
function multiplyTransform(left, right) { return [
  left[0] * right[0] + left[2] * right[1], left[1] * right[0] + left[3] * right[1],
  left[0] * right[2] + left[2] * right[3], left[1] * right[2] + left[3] * right[3],
  left[0] * right[4] + left[2] * right[5] + left[4], left[1] * right[4] + left[3] * right[5] + left[5],
]; }
function transformMatrix(value = '') {
  const transform = value.trim(); let result = [1, 0, 0, 1, 0, 0]; let consumed = 0;
  for (const match of transform.matchAll(/translate\(([^)]+)\)/gu)) {
    const source = match[1]; assert.equal(transform.slice(consumed, match.index).trim(), '', `unsupported non-translation SVG transform ${transform}`); consumed = match.index + match[0].length;
    const values = source.trim().split(/[\s,]+/u).map(Number); assert.ok([1, 2].includes(values.length) && values.every(Number.isFinite), 'finite one/two-value translate transform');
    result = multiplyTransform(result, [1, 0, 0, 1, values[0], values[1] ?? 0]);
  }
  assert.equal(transform.slice(consumed).trim(), '', `unsupported non-translation SVG transform ${transform}`);
  return result;
}
function elementTransform(element) {
  const chain = []; for (let current = element; current; current = current.parent) chain.unshift(transformMatrix(current.attributes.get('transform')));
  return chain.reduce((matrix, next) => multiplyTransform(matrix, next), [1, 0, 0, 1, 0, 0]);
}
function transformPoint(matrix, {x, y}) { return {x: matrix[0] * x + matrix[2] * y + matrix[4], y: matrix[1] * x + matrix[3] * y + matrix[5]}; }
function geometryPoints(element) {
  if (element.name === 'rect') { const {x, y, width, height} = numericBounds(element.attributes); return [{x, y}, {x: x + width, y}, {x: x + width, y: y + height}, {x, y: y + height}]; }
  if (element.name === 'circle') { const cx = Number(element.attributes.get('cx')); const cy = Number(element.attributes.get('cy')); const r = Number(element.attributes.get('r')); return [{x: cx - r, y: cy - r}, {x: cx + r, y: cy + r}]; }
  if (element.name === 'ellipse') { const cx = Number(element.attributes.get('cx')); const cy = Number(element.attributes.get('cy')); const rx = Number(element.attributes.get('rx')); const ry = Number(element.attributes.get('ry')); return [{x: cx - rx, y: cy - ry}, {x: cx + rx, y: cy + ry}]; }
  if (['polygon', 'polyline'].includes(element.name)) { const values = (element.attributes.get('points')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number); return values.reduce((points, value, index) => { if (index % 2 === 0) points.push({x: value, y: values[index + 1]}); return points; }, []); }
  if (element.name === 'path') return parsePathPoints(element.attributes.get('d'));
  assert.fail(`unsupported painted geometry ${element.name}`);
}
function visibleShapeBounds(element) {
  const points = geometryPoints(element).map((point) => transformPoint(elementTransform(element), point)); assert.ok(points.length >= 2 && points.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), `${element.name} visible geometry`);
  return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))};
}
function drawioStyle(cell) { return new Map((cell.attributes.get('style') ?? '').split(';').filter(Boolean).map((entry) => entry.split(/=(.*)/su))); }
function isPrimaryDiagramNode(node) { return !['legend-anchor', 'legend-caption', 'label-title', 'label-type'].includes(node.attributes.get('dataRole')); }
function drawioShape(style) {
  if (style.get('shape') === 'cylinder') return 'cylinder';
  if (style.get('shape') === 'rectangle' && style.get('rounded') === '1') return 'rounded-rect';
  if (style.get('shape') === 'rectangle' && style.get('rounded') === '0') return 'canvas';
  assert.fail(`unsupported effective Draw.io shape ${style.get('shape')}/${style.get('rounded')}`);
}
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
function assertUntransformedGeometry(element, kind) {
  for (let current = element; current; current = current.parent) assert.equal((current.attributes.get('transform') ?? '').trim(), '', `${kind} transform must be flattened into coordinates`);
}
function renderedPathPoints(element) { assertUntransformedGeometry(element, 'connector path'); return parsePathPoints(element.attributes.get('d')); }
function segmentDistance(left, right, box) {
  const horizontal = left.y === right.y; assert.ok(horizontal || left.x === right.x, 'orthogonal segment');
  const dx = horizontal ? Math.max(box.left - Math.max(left.x, right.x), Math.min(left.x, right.x) - box.right, 0) : Math.max(box.left - left.x, left.x - box.right, 0);
  const dy = horizontal ? Math.max(box.top - left.y, left.y - box.bottom, 0) : Math.max(box.top - Math.max(left.y, right.y), Math.min(left.y, right.y) - box.bottom, 0);
  return Math.hypot(dx, dy);
}
function pointSegmentDistance(point, start, end) {
  const dx = end.x - start.x; const dy = end.y - start.y; const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const offset = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + offset * dx), point.y - (start.y + offset * dy));
}
function lineSegmentDistance(leftStart, leftEnd, rightStart, rightEnd) {
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); const epsilon = 1e-9;
  const leftA = cross(leftStart, leftEnd, rightStart); const leftB = cross(leftStart, leftEnd, rightEnd); const rightA = cross(rightStart, rightEnd, leftStart); const rightB = cross(rightStart, rightEnd, leftEnd);
  const onSegment = (point, start, end) => point.x >= Math.min(start.x, end.x) - epsilon && point.x <= Math.max(start.x, end.x) + epsilon && point.y >= Math.min(start.y, end.y) - epsilon && point.y <= Math.max(start.y, end.y) + epsilon;
  const properIntersection = ((leftA > epsilon && leftB < -epsilon) || (leftA < -epsilon && leftB > epsilon)) && ((rightA > epsilon && rightB < -epsilon) || (rightA < -epsilon && rightB > epsilon));
  if (properIntersection || (Math.abs(leftA) <= epsilon && onSegment(rightStart, leftStart, leftEnd)) || (Math.abs(leftB) <= epsilon && onSegment(rightEnd, leftStart, leftEnd)) || (Math.abs(rightA) <= epsilon && onSegment(leftStart, rightStart, rightEnd)) || (Math.abs(rightB) <= epsilon && onSegment(leftEnd, rightStart, rightEnd))) return 0;
  return Math.min(pointSegmentDistance(leftStart, rightStart, rightEnd), pointSegmentDistance(leftEnd, rightStart, rightEnd), pointSegmentDistance(rightStart, leftStart, leftEnd), pointSegmentDistance(rightEnd, leftStart, leftEnd));
}
function strokedGeometryPoints(element) {
  let points;
  if (element.name === 'circle' || element.name === 'ellipse') {
    const cx = Number(element.attributes.get('cx')); const cy = Number(element.attributes.get('cy')); const rx = element.name === 'circle' ? Number(element.attributes.get('r')) : Number(element.attributes.get('rx')); const ry = element.name === 'circle' ? rx : Number(element.attributes.get('ry'));
    points = Array.from({length: 65}, (_, index) => { const angle = index / 64 * Math.PI * 2; return {x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry}; });
  } else {
    points = geometryPoints(element); if (['rect', 'polygon'].includes(element.name)) points = [...points, points[0]];
  }
  const matrix = elementTransform(element); const transformed = points.map((point) => transformPoint(matrix, point)); assert.ok(transformed.length >= 2 && transformed.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), `${element.name} stroked geometry`); return transformed;
}
function paintOpacity(source, element, kind) { let opacity = 1; for (let candidate = element; candidate; candidate = candidate.parent) for (const property of ['opacity', `${kind}-opacity`]) { const value = ownSvgPresentationValue(source, candidate, property); if (value !== undefined) opacity *= Number(value); } assert.ok(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1, 'valid effective opacity'); return opacity; }
function blendHex(foreground, background, opacity) { const channels = (value) => value.match(/[\da-f]{2}/giu).map((entry) => Number.parseInt(entry, 16)); const left = channels(foreground); const right = channels(background); return `#${left.map((value, index) => Math.round(value * opacity + right[index] * (1 - opacity)).toString(16).padStart(2, '0')).join('')}`; }
function luminance(color) { const rgb = color.match(/[\da-f]{2}/giu).map((entry) => Number.parseInt(entry, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4); return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722; }
function contrastRatio(left, right) { const [light, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a); return (light + .05) / (dark + .05); }
function elementText(source, element) { return decodeXmlText(source.match(new RegExp(`${escapeRegExp(element.tag)}([^<]*)<\/${element.name}>`, 'u'))?.[1] ?? '').trim(); }
function labelBox(source, element, label = elementText(source, element)) {
  assertUntransformedGeometry(element, 'text');
  const fontSize = Number.parseFloat(svgPresentationValue(source, element, 'font-size')); const x = Number(element.attributes.get('x')); const y = Number(element.attributes.get('y'));
  const width = [...label].reduce((sum, character) => sum + (/^[\u0000-\u00FF]$/u.test(character) ? .62 : 1), 0) * fontSize;
  const anchor = svgPresentationValue(source, element, 'text-anchor') ?? 'start'; const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return {left, right: left + width, top: y - fontSize, bottom: y + fontSize * .3};
}
function rectangleFromElement(element) { return visibleShapeBounds(element); }
function rectangleDistance(left, right) { const dx = Math.max(left.left - right.right, right.left - left.right, 0); const dy = Math.max(left.top - right.bottom, right.top - left.bottom, 0); return Math.hypot(dx, dy); }
function rectangleAxisClearance(left, right) { return {horizontal: Math.max(left.left - right.right, right.left - left.right, 0), vertical: Math.max(left.top - right.bottom, right.top - left.bottom, 0)}; }
function pointRectangleDistance(point, rectangle) { return Math.hypot(Math.max(rectangle.left - point.x, 0, point.x - rectangle.right), Math.max(rectangle.top - point.y, 0, point.y - rectangle.bottom)); }
function markerBounds(points) { return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function markerGeometry(source, path, points) {
  const markerId = svgPresentationValue(source, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${path.attributes.get('data-edge-id') ?? path.attributes.get('data-structural-edge-id') ?? path.attributes.get('data-legend-key')} marker`);
  const elements = parseSvg(source).elements; const marker = elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const shape = elements.find(({name, parent}) => name === 'path' && parent === marker);
  assert.ok(marker && shape, `${markerId} actual marker shape`); const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.equal(viewBox.length, 4, `${markerId} marker viewBox`);
  assertUntransformedGeometry(shape, `${markerId} marker shape`);
  const width = Number(marker.attributes.get('markerWidth')); const height = Number(marker.attributes.get('markerHeight')); assert.ok(width > 0 && height > 0 && width <= 16 && height <= 16, `${markerId} bounded dimensions`);
  const endpoint = points.at(-1); const previous = points.at(-2); const magnitude = Math.hypot(endpoint.x - previous.x, endpoint.y - previous.y); assert.ok(magnitude > 0, `${markerId} terminal segment`);
  const axis = {x: (endpoint.x - previous.x) / magnitude, y: (endpoint.y - previous.y) / magnitude}; const perpendicular = {x: -axis.y, y: axis.x};
  const unit = marker.attributes.get('markerUnits') === 'userSpaceOnUse' ? 1 : Number(svgPresentationValue(source, path, 'stroke-width')); const refX = Number(marker.attributes.get('refX')); const refY = Number(marker.attributes.get('refY'));
  const values = (shape.attributes.get('d')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number); const result = [];
  for (let index = 0; index < values.length; index += 2) { const localX = (values[index] - refX) * width / viewBox[2] * unit; const localY = (values[index + 1] - refY) * height / viewBox[3] * unit; result.push({x: endpoint.x + axis.x * localX + perpendicular.x * localY, y: endpoint.y + axis.y * localX + perpendicular.y * localY}); }
  assert.ok(result.length >= 3 && result.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), `${markerId} physical marker geometry`); return result;
}
function nodeShape(elements, group) { return elements.find((element) => ['rect', 'path', 'polygon', 'circle', 'ellipse'].includes(element.name) && element.parent === group && element.attributes.has('data-shape')); }
function routeBoundsCollision(points, rectangle, stroke = 0) {
  const expanded = {left: rectangle.left - stroke / 2, right: rectangle.right + stroke / 2, top: rectangle.top - stroke / 2, bottom: rectangle.bottom + stroke / 2};
  return points.slice(1).some((point, index) => segmentDistance(points[index], point, expanded) === 0);
}
function panelStrokeStrips(panel) {
  const {rectangle, stroke} = panel;
  return [
    {left: rectangle.left - stroke / 2, right: rectangle.left + stroke / 2, top: rectangle.top - stroke / 2, bottom: rectangle.bottom + stroke / 2},
    {left: rectangle.right - stroke / 2, right: rectangle.right + stroke / 2, top: rectangle.top - stroke / 2, bottom: rectangle.bottom + stroke / 2},
    {left: rectangle.left - stroke / 2, right: rectangle.right + stroke / 2, top: rectangle.top - stroke / 2, bottom: rectangle.top + stroke / 2},
    {left: rectangle.left - stroke / 2, right: rectangle.right + stroke / 2, top: rectangle.bottom - stroke / 2, bottom: rectangle.bottom + stroke / 2},
  ];
}
function routePanelSegments(points, panel) { return points.slice(1).flatMap((point, index) => panelStrokeStrips(panel).some((strip) => segmentDistance(points[index], point, strip) === 0) ? [index] : []); }
function terminalCrossingKey(edgeId, panelId, terminal) { return `${edgeId}|${panelId}|${terminal}`; }
function partialCollinearOverlap(leftA, leftB, rightA, rightB) {
  const horizontal = leftA.y === leftB.y && rightA.y === rightB.y && leftA.y === rightA.y;
  const vertical = leftA.x === leftB.x && rightA.x === rightB.x && leftA.x === rightA.x;
  if (!horizontal && !vertical) return false;
  const axis = horizontal ? 'x' : 'y'; const left = [leftA[axis], leftB[axis]].sort((a, b) => a - b); const right = [rightA[axis], rightB[axis]].sort((a, b) => a - b);
  return Math.min(left[1], right[1]) - Math.max(left[0], right[0]) > 0;
}
function samePoint(left, right) { return Math.abs(left.x - right.x) <= 1e-9 && Math.abs(left.y - right.y) <= 1e-9; }
function pointOnSegment(point, start, end) {
  return Math.abs((end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x)) <= 1e-9
    && point.x >= Math.min(start.x, end.x) - 1e-9 && point.x <= Math.max(start.x, end.x) + 1e-9
    && point.y >= Math.min(start.y, end.y) - 1e-9 && point.y <= Math.max(start.y, end.y) + 1e-9;
}
function exactSharedTerminalContact(left, right, leftStart, leftEnd, rightStart, rightEnd) {
  const terminals = (connector) => [
    {point: connector.points[0], id: connector.path.attributes.get('data-source')},
    {point: connector.points.at(-1), id: connector.path.attributes.get('data-target')},
  ];
  return terminals(left).some((leftTerminal) => leftTerminal.id && terminals(right).some((rightTerminal) =>
    leftTerminal.id === rightTerminal.id && samePoint(leftTerminal.point, rightTerminal.point)
      && pointOnSegment(leftTerminal.point, leftStart, leftEnd) && pointOnSegment(leftTerminal.point, rightStart, rightEnd)));
}
function assertStructuralOwnership(drawio, svg, source) {
  const actual = drawio.edges.filter(({attributes}) => attributes.get('dataRole')?.startsWith('structural-')).map((edge) => [edge.attributes.get('id'), edge.attributes.get('source'), edge.attributes.get('target'), edge.attributes.get('dataRole').slice('structural-'.length)]);
  assert.deepEqual(actual, STRUCTURAL_CONNECTOR_INVENTORY, 'exact structural ownership inventory');
  assert.deepEqual(svg.elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-structural-edge-id')).map(({attributes}) => attributes.get('data-structural-edge-id')), STRUCTURAL_CONNECTOR_INVENTORY.map(([id]) => id), 'exact SVG structural ownership inventory');
  for (const [id, sourceId, targetId, role] of STRUCTURAL_CONNECTOR_INVENTORY) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('id') === id); assert.ok(edge, `Draw.io structural edge ${id}`); drawioRoute(drawio, edge);
    const path = svg.elements.find(({name, attributes}) => name === 'path' && attributes.get('data-structural-edge-id') === id); assert.ok(path, `SVG structural edge ${id}`);
    assert.deepEqual([path.attributes.get('data-source'), path.attributes.get('data-target'), path.attributes.get('data-role')], [sourceId, targetId, role], `${id} structural topology`);
    assert.deepEqual(renderedPathPoints(path), drawioRoute(drawio, edge), `${id} structural route parity`);
    const style = drawioStyle(edge); assert.equal(svgPresentationValue(source, path, 'stroke'), style.get('strokeColor'), `${id} structural stroke`);
    assert.equal(Number(svgPresentationValue(source, path, 'stroke-width')), Number(style.get('strokeWidth')), `${id} structural stroke width`);
    assert.equal(svgPresentationValue(source, path, 'stroke-dasharray') ?? '', style.get('dashed') === '1' ? style.get('dashPattern') : '', `${id} structural dash`);
    const markerId = svgPresentationValue(source, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${id} structural marker`);
    const marker = svg.elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const markerPath = svg.elements.find(({name, parent}) => name === 'path' && parent === marker);
    assert.ok(marker && markerPath, `${id} structural marker definition`); assert.equal(style.get('endArrow'), 'open', `${id} structural endArrow`);
    assert.equal(svgPresentationValue(source, markerPath, 'fill'), style.get('endFill') === '0' ? 'none' : style.get('strokeColor'), `${id} structural marker fill`);
    assert.equal(svgPresentationValue(source, markerPath, 'stroke'), style.get('strokeColor'), `${id} structural marker stroke`);
  }
  for (const actor of ['123', '456']) for (const role of ['mailbox', 'state', 'behavior']) {
    assert.ok(STRUCTURAL_CONNECTOR_INVENTORY.some(([, sourceId, targetId, edgeRole]) => sourceId === `order-${actor}-actor` && targetId === `order-${actor}-${role === 'state' ? 'private-state' : role}` && edgeRole === `actor-${role === 'state' ? 'private-state' : role}`), `Order-${actor} owns ${role}`);
  }
  assert.match(source, /data-node-id="order-123-actor"[\s\S]*?Order-123/u, 'Order-123 logical identity visible');
  assert.match(source, /data-node-id="order-456-actor"[\s\S]*?Order-456/u, 'Order-456 parallel identity visible');
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
  for (const [role, keyId, captionId, label] of LEGEND_INVENTORY) {
    const key = drawioKeys.find(({attributes}) => attributes.get('id') === keyId); const path = svgKeys.find(({attributes}) => attributes.get('id') === keyId);
    const caption = drawioCaptions.find(({attributes}) => attributes.get('id') === captionId); const text = svgCaptions.find(({attributes}) => attributes.get('id') === captionId);
    assert.ok(key && path && caption && text, `${role} paired legend structure`);
    const sourceId = `legend-anchor-${role}-source`; const targetId = `legend-anchor-${role}-target`; assert.equal(key.attributes.get('source'), sourceId, `${role} legend source terminal`); assert.equal(key.attributes.get('target'), targetId, `${role} legend target terminal`);
    for (const id of [sourceId, targetId]) { const anchor = drawioAnchors.find(({attributes}) => attributes.get('id') === id); assert.ok(anchor, `${id} anchor`); assert.equal(anchor.attributes.get('legendFor'), role, `${id} role`); const anchorStyle = drawioStyle(anchor); assert.equal(anchorStyle.get('opacity'), '0', `${id} invisible`); assert.equal(anchorStyle.get('fillColor'), 'none', `${id} no fill`); assert.equal(anchorStyle.get('strokeColor'), 'none', `${id} no stroke`); }
    assert.equal(key.attributes.get('legendFor'), role, `${role} Draw.io key role`); assert.equal(path.attributes.get('data-legend-key'), role, `${role} SVG key role`); assert.equal(path.attributes.get('data-role'), key.attributes.get('dataRole'), `${role} key data role parity`);
    assert.equal(caption.attributes.get('legendFor'), role, `${role} Draw.io caption role`); assert.equal(text.attributes.get('data-legend-for'), role, `${role} SVG caption role`); assert.equal(text.attributes.get('data-role'), caption.attributes.get('dataRole'), `${role} caption data role parity`);
    assert.deepEqual(renderedPathPoints(path), drawioRoute(drawio, key), `${role} key route parity`);
    assert.equal(caption.label, label, `${role} Draw.io caption label`); assert.equal(elementText(source, text), label, `${role} SVG caption label`);
    const geometry = numericBounds(caption.geometry); const actualBounds = labelBox(source, text); const round = (value) => Math.round(value * 1e6) / 1e6;
    assert.deepEqual([actualBounds.left, actualBounds.top, actualBounds.right - actualBounds.left, actualBounds.bottom - actualBounds.top].map(round), [geometry.x, geometry.y, geometry.width, geometry.height].map(round), `${role} actual caption bounds parity`);
    assert.equal(text.attributes.get('data-label-bounds'), `${actualBounds.left} ${actualBounds.top} ${actualBounds.right} ${actualBounds.bottom}`, `${role} declared caption bounds`);
    const style = drawioStyle(key); for (const [property, expected] of Object.entries(CONNECTOR_STYLES[role])) assert.equal(style.get(property), expected, `${role} Draw.io legend ${property}`);
    assert.equal(svgPresentationValue(source, path, 'stroke'), style.get('strokeColor'), `${role} legend stroke`); assert.equal(Number(svgPresentationValue(source, path, 'stroke-width')), Number(style.get('strokeWidth')), `${role} legend stroke width`);
    assert.equal(svgPresentationValue(source, path, 'stroke-dasharray') ?? '', style.get('dashed') === '1' ? style.get('dashPattern') : '', `${role} legend dash`);
    const markerId = svgPresentationValue(source, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; const marker = svg.elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const markerPath = svg.elements.find(({name, parent}) => name === 'path' && parent === marker);
    assert.ok(marker && markerPath, `${role} legend marker`); assert.equal(markerPath.attributes.get('d'), style.get('endArrow') === 'open' ? 'M 1 1 L 9 5 L 1 9' : 'M 0 0 L 10 5 L 0 10 Z', `${role} legend endArrow shape`); assert.equal(svgPresentationValue(source, markerPath, 'fill'), style.get('endFill') === '0' ? 'none' : style.get('strokeColor'), `${role} legend marker fill`); assert.equal(svgPresentationValue(source, markerPath, 'stroke'), style.get('strokeColor'), `${role} legend marker stroke`);
    const textStyle = drawioStyle(caption); assert.equal(svgPresentationValue(source, text, 'fill'), textStyle.get('fontColor'), `${role} legend caption color`); assert.equal(Number.parseFloat(svgPresentationValue(source, text, 'font-size')), Number(textStyle.get('fontSize')), `${role} legend caption font size`); assert.equal(svgPresentationValue(source, text, 'font-weight'), textStyle.get('fontStyle') === '1' ? '700' : '400', `${role} legend caption font weight`);
  }
}
function assertNodeParity(drawio, svg, source) {
  const drawioIds = drawio.nodes.filter(isPrimaryDiagramNode).map(({attributes}) => attributes.get('id'));
  const svgIds = svg.nodes.map(({attributes}) => attributes.get('data-node-id'));
  assert.deepEqual(drawioIds, DIAGRAM_NODES, 'exact ordered Draw.io node inventory without extras');
  assert.deepEqual(svgIds, DIAGRAM_NODES, 'exact ordered SVG node inventory without extras');
  for (const id of DIAGRAM_NODES) {
    const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id); const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id); assert.ok(node && group, `${id} paired node`);
    const texts = svg.elements.filter(({name, parent, attributes}) => name === 'text' && parent === group && attributes.has('data-text-role'));
    assert.equal(texts.map((element) => elementText(source, element)).join('｜'), node.label, `${id} normalized visible label parity`);
    assert.equal(group.attributes.get('data-role'), node.attributes.get('dataRole'), `${id} role parity`);
    const shape = nodeShape(svg.elements, group); assert.ok(shape, `${id} visible shape`); const style = drawioStyle(node); assertVisibleNodeBounds(drawio, svg, id);
    assert.equal(node.attributes.has('dataPanelBounds'), false, `${id} no self-reported panel geometry`);
    assert.equal(node.attributes.has('dataShape'), false, `${id} no self-reported shape`);
    assert.equal(node.attributes.has('dataTitleFont'), false, `${id} no self-reported title font`);
    assert.equal(shape.attributes.get('data-shape'), drawioShape(style), `${id} effective shape parity`);
    assert.equal(svgPresentationValue(source, shape, 'fill'), style.get('fillColor'), `${id} fill parity`);
    assert.equal(svgPresentationValue(source, shape, 'stroke'), style.get('strokeColor'), `${id} stroke parity`);
    assert.ok(node.label.length > 0, `${id} stable semantic value`);
    assert.equal(style.get('textOpacity'), '0', `${id} effective primary text hidden behind editable text vertices`);
    assert.equal(style.has('labelOpacity'), false, `${id} no ignored labelOpacity style key`);
    if (style.get('shape') === 'cylinder') assert.ok(shape.name === 'path' && /\bC\b/u.test(shape.attributes.get('d') ?? ''), `${id} actual cylinder path geometry`);
    if (Object.hasOwn(REAL_PANEL_GEOMETRIES, id)) assert.deepEqual(Object.values(numericBounds(node.geometry)), REAL_PANEL_GEOMETRIES[id], `${id} actual editable panel geometry`);
  }
}
function assertEditableTextParity(drawio, svg, source) {
  const expectedTextIds = [];
  for (const id of DIAGRAM_NODES) {
    const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id);
    const texts = svg.elements.filter(({name, parent, attributes}) => name === 'text' && parent === group && ['title', 'type'].includes(attributes.get('data-text-role')));
    const roleOccurrences = new Map();
    for (const text of texts) {
      const role = text.attributes.get('data-text-role');
      const occurrence = (roleOccurrences.get(role) ?? 0) + 1; roleOccurrences.set(role, occurrence);
      const textId = `label-${id}-${role}-${occurrence}`; expectedTextIds.push(textId);
      const cell = drawio.nodes.find(({attributes}) => attributes.get('id') === textId);
      assert.ok(cell, `${id} ${role} ${occurrence} editable Draw.io text vertex`);
      assert.equal(cell.attributes.get('dataRole'), `label-${role}`, `${id} ${role} actual text role`);
      assert.equal(cell.label, elementText(source, text), `${id} ${role} visible text`);
      const style = drawioStyle(cell); const bounds = numericBounds(cell.geometry); const actual = labelBox(source, text);
      assert.deepEqual([bounds.x, bounds.y, bounds.width, bounds.height].map((value) => Math.round(value * 1e6) / 1e6), [actual.left, actual.top, actual.right - actual.left, actual.bottom - actual.top].map((value) => Math.round(value * 1e6) / 1e6), `${id} ${role} editable bounds`);
      assert.equal(Number(style.get('fontSize')), Number.parseFloat(svgPresentationValue(source, text, 'font-size')), `${id} ${role} font size`);
      assert.equal(style.get('fontFamily'), svgPresentationValue(source, text, 'font-family'), `${id} ${role} font family`);
      assert.equal(style.get('fontColor'), svgPresentationValue(source, text, 'fill'), `${id} ${role} font color`);
      assert.equal(style.get('fontStyle') === '1' ? '700' : '400', svgPresentationValue(source, text, 'font-weight'), `${id} ${role} font weight`);
    }
  }
  assert.equal(expectedTextIds.length, 47, 'exact visible title/type text count');
  assert.deepEqual(drawio.nodes.filter(({attributes}) => ['label-title', 'label-type'].includes(attributes.get('dataRole'))).map(({attributes}) => attributes.get('id')), expectedTextIds, 'exact ordered editable title/type vertex inventory without extras');
}
function assertVisibleNodeBounds(drawio, svg, id) {
  const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id); const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id); const shape = nodeShape(svg.elements, group); assert.ok(node && group && shape, `${id} visible bounds fixture`);
  const actual = visibleShapeBounds(shape); const geometry = numericBounds(node.geometry); const expected = [geometry.x, geometry.y, geometry.x + geometry.width, geometry.y + geometry.height]; const round = (value) => Math.round(value * 1e6) / 1e6;
  assert.deepEqual([actual.left, actual.top, actual.right, actual.bottom].map(round), expected.map(round), `${id} actual transformed shape bounds match Draw.io`);
  assert.equal(group.attributes.get('data-node-bounds'), `${geometry.x} ${geometry.y} ${geometry.width} ${geometry.height}`, `${id} declared bounds match Draw.io`);
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
  const point = {x: Number(label.attributes.get('x')), y: Number(label.attributes.get('y'))}; const paints = parseSvg(source).elements.filter((element) => ['rect', 'path', 'polygon', 'polyline', 'circle', 'ellipse'].includes(element.name) && element.parent?.name !== 'marker' && element.index < label.index && !/^(?:canvas|background)$/u.test(element.attributes.get('id') ?? '')).filter((element) => {
    const rectangle = rectangleFromElement(element); return point.x >= rectangle.left && point.x <= rectangle.right && point.y >= rectangle.top && point.y <= rectangle.bottom;
  }).map((element) => ({color: svgPresentationValue(source, element, 'fill'), opacity: paintOpacity(source, element, 'fill'), index: element.index})).filter(({color}) => color && color !== 'none').sort((left, right) => left.index - right.index);
  const canvas = parseSvg(source).elements.find(({attributes}) => /^(?:canvas|background)$/u.test(attributes.get('id') ?? '')); const base = canvas ? blendHex(svgPresentationValue(source, canvas, 'fill'), '#FFFFFF', paintOpacity(source, canvas, 'fill')) : '#FFFFFF';
  return paints.reduce((background, paint) => blendHex(paint.color, background, paint.opacity), base);
}
function assertPhysicalGeometry(source, scale, enforceLabelAttachment = true, enforcePanelInventory = false, terminalAllowlist = PANEL_TERMINAL_CROSSINGS) {
  const elements = parseSvg(source).elements; const paths = elements.filter(({name, attributes}) => name === 'path' && attributes.has('data-edge-id')); const labels = elements.filter(({name, attributes}) => name === 'text' && attributes.has('data-edge-id'));
  const geometryFailures = [];
  const minima = {labelToLabel: Infinity, labelToStroke: Infinity, labelToMarker: Infinity, labelToNode: Infinity, labelToPanel: Infinity, headerToPanel: Infinity, legendKeyToCaption: Infinity, legendMarkerToCaption: Infinity};
  const allPaths = elements.filter(({name, attributes}) => name === 'path' && (attributes.has('data-edge-id') || attributes.has('data-structural-edge-id') || attributes.has('data-legend-key')));
  const connectors = allPaths.map((path) => { const points = renderedPathPoints(path); return {path, id: path.attributes.get('data-edge-id') ?? path.attributes.get('data-structural-edge-id') ?? `legend-${path.attributes.get('data-legend-key')}`, points, markers: markerGeometry(source, path, points), stroke: Number(svgPresentationValue(source, path, 'stroke-width') ?? 0)}; });
  const nodeShapes = elements.filter(({name, parent}) => ['rect', 'path', 'polygon', 'circle', 'ellipse'].includes(name) && parent?.attributes.has('data-node-id')).filter((element) => nodeShape(elements, element.parent) === element).map((shape) => ({id: shape.parent.attributes.get('data-node-id'), rectangle: rectangleFromElement(shape), stroke: Number(svgPresentationValue(source, shape, 'stroke-width') ?? 0)}));
  const panels = nodeShapes.filter(({id}) => PANEL_IDS.includes(id));
  if (enforcePanelInventory) assert.deepEqual(panels.map(({id}) => id), PANEL_IDS, 'exact real panel inventory');
  const allowedTerminalCrossings = new Set(terminalAllowlist.map(([edgeId, panelId, terminal]) => terminalCrossingKey(edgeId, panelId, terminal)));
  const observedTerminalCrossings = new Set();
  for (let left = 0; left < connectors.length; left += 1) for (let right = left + 1; right < connectors.length; right += 1) {
    for (let leftSegment = 1; leftSegment < connectors[left].points.length; leftSegment += 1) for (let rightSegment = 1; rightSegment < connectors[right].points.length; rightSegment += 1) {
      const leftStart = connectors[left].points[leftSegment - 1]; const leftEnd = connectors[left].points[leftSegment]; const rightStart = connectors[right].points[rightSegment - 1]; const rightEnd = connectors[right].points[rightSegment];
      if (partialCollinearOverlap(leftStart, leftEnd, rightStart, rightEnd)) geometryFailures.push(`${connectors[left].id}/${connectors[right].id} path/partial-collinear`);
      else if (lineSegmentDistance(leftStart, leftEnd, rightStart, rightEnd) === 0 && !exactSharedTerminalContact(connectors[left], connectors[right], leftStart, leftEnd, rightStart, rightEnd)) geometryFailures.push(`${connectors[left].id}/${connectors[right].id} path/contact`);
    }
  }
  for (const connector of connectors) {
    const sourceId = connector.path.attributes.get('data-source'); const targetId = connector.path.attributes.get('data-target'); const id = connector.id;
    for (const node of nodeShapes.filter(({id: nodeId}) => ![sourceId, targetId, 'actor-comparison-canvas', ...PANEL_IDS].includes(nodeId))) {
      const envelope = {left: node.rectangle.left - node.stroke / 2, right: node.rectangle.right + node.stroke / 2, top: node.rectangle.top - node.stroke / 2, bottom: node.rectangle.bottom + node.stroke / 2};
      if (routeBoundsCollision(connector.points, node.rectangle, node.stroke)) geometryFailures.push(`${id} route/node ${node.id}`);
      if (!(rectangleDistance(markerBounds(connector.markers), envelope) > 0)) geometryFailures.push(`${id} marker/node ${node.id}`);
    }
    for (const panel of panels) {
      const segments = routePanelSegments(connector.points, panel);
      for (const segment of segments) {
        const terminal = segment === 0 ? 'source' : segment === connector.points.length - 2 ? 'target' : undefined;
        const key = terminal && terminalCrossingKey(id, panel.id, terminal);
        if (!key || !allowedTerminalCrossings.has(key)) geometryFailures.push(`${id} route/panel ${panel.id} ${terminal ?? 'nonterminal'}`);
        else observedTerminalCrossings.add(key);
      }
      if (panelStrokeStrips(panel).some((strip) => rectangleDistance(markerBounds(connector.markers), strip) === 0) && !allowedTerminalCrossings.has(terminalCrossingKey(id, panel.id, 'target'))) geometryFailures.push(`${id} marker/panel ${panel.id}`);
    }
  }
  for (let left = 0; left < labels.length; left += 1) for (let right = left + 1; right < labels.length; right += 1) {
    const gap = rectangleDistance(labelBox(source, labels[left]), labelBox(source, labels[right])) * scale;
    minima.labelToLabel = Math.min(minima.labelToLabel, gap);
    if (!(gap >= 12)) geometryFailures.push(`${labels[left].attributes.get('data-edge-id')}/${labels[right].attributes.get('data-edge-id')} label/label ${gap}`);
  }
  for (const label of labels) {
    const id = label.attributes.get('data-edge-id'); const own = paths.find(({attributes}) => attributes.get('data-edge-id') === id); assert.ok(own, `${id} path`); const bounds = labelBox(source, label);
    const actualBounds = [bounds.left, bounds.top, bounds.right, bounds.bottom].join(' '); if (label.attributes.get('data-label-bounds') !== actualBounds) geometryFailures.push(`${id} label/bounds ${label.attributes.get('data-label-bounds')} != ${actualBounds}`);
    for (const connector of connectors) for (const point of connector.points.slice(1)) { /* execute parsed geometry before segment loop */ assert.ok(Number.isFinite(point.x)); }
    const connectorGaps = connectors.map(({id: connectorId, points, stroke}) => ({id: connectorId, gap: (Math.min(...points.slice(1).map((point, index) => segmentDistance(points[index], point, bounds))) - stroke / 2) * scale}));
    const nearestConnector = connectorGaps.reduce((nearest, candidate) => candidate.gap < nearest.gap ? candidate : nearest); const strokeGap = nearestConnector.gap; minima.labelToStroke = Math.min(minima.labelToStroke, strokeGap); if (!(strokeGap >= 8)) geometryFailures.push(`${id} label/stroke ${nearestConnector.id} ${strokeGap}`);
    const ownPoints = renderedPathPoints(own); const ownStroke = Number(svgPresentationValue(source, own, 'stroke-width') ?? 0); const ownGap = (Math.min(...ownPoints.slice(1).map((point, index) => segmentDistance(ownPoints[index], point, bounds))) - ownStroke / 2) * scale;
    const foreignGap = Math.min(...connectors.filter(({path}) => path !== own).flatMap(({points, stroke}) => points.slice(1).map((point, index) => segmentDistance(points[index], point, bounds) - stroke / 2))) * scale;
    if (enforceLabelAttachment) { if (!(ownGap <= 40)) geometryFailures.push(`${id} label/own-attachment ${ownGap}`); if (!(ownGap < foreignGap)) geometryFailures.push(`${id} label/unique-own ${ownGap}/${foreignGap}`); }
    const markerGap = Math.min(...connectors.flatMap(({markers}) => markers.map((point) => pointRectangleDistance(point, bounds)))) * scale; minima.labelToMarker = Math.min(minima.labelToMarker, markerGap); if (!(markerGap >= 16)) geometryFailures.push(`${id} label/marker ${markerGap}`);
    for (const node of nodeShapes.filter(({id: nodeId}) => ![own.attributes.get('data-source'), own.attributes.get('data-target')].includes(nodeId) && !['actor-comparison-canvas', ...PANEL_IDS].includes(nodeId))) { const gap = rectangleDistance(bounds, {left: node.rectangle.left - node.stroke / 2, right: node.rectangle.right + node.stroke / 2, top: node.rectangle.top - node.stroke / 2, bottom: node.rectangle.bottom + node.stroke / 2}) * scale; minima.labelToNode = Math.min(minima.labelToNode, gap); if (!(gap >= 12)) geometryFailures.push(`${id} label/node ${node.id} ${gap}`); }
    for (const panel of panels) {
      const contained = bounds.left >= panel.rectangle.left && bounds.right <= panel.rectangle.right && bounds.top >= panel.rectangle.top && bounds.bottom <= panel.rectangle.bottom;
      const gap = contained ? Math.min(bounds.left - panel.rectangle.left, panel.rectangle.right - bounds.right, bounds.top - panel.rectangle.top, panel.rectangle.bottom - bounds.bottom) - panel.stroke / 2 : rectangleDistance(bounds, panel.rectangle) - panel.stroke / 2;
      minima.labelToPanel = Math.min(minima.labelToPanel, gap * scale); if (!(gap * scale >= 12)) geometryFailures.push(`${id} label/panel ${panel.id} ${gap * scale}`);
    }
  }
  for (const header of elements.filter(({name, attributes}) => name === 'text' && attributes.has('data-header-for'))) {
    const boundary = panels.find(({id}) => id === header.attributes.get('data-header-for')); assert.ok(boundary, `${header.attributes.get('data-header-for')} header panel`); const bounds = labelBox(source, header); const padding = Math.min(bounds.left - boundary.rectangle.left, boundary.rectangle.right - bounds.right, bounds.top - boundary.rectangle.top, boundary.rectangle.bottom - bounds.bottom) - boundary.stroke / 2; minima.headerToPanel = Math.min(minima.headerToPanel, padding * scale); if (!(padding * scale >= 12)) geometryFailures.push(`${boundary.id} header/panel ${padding * scale}`);
  }
  const legends = Object.keys(CONNECTOR_STYLES).map((role) => { const key = elements.find(({name, attributes}) => name === 'path' && attributes.get('data-legend-key') === role); const caption = elements.find(({name, attributes}) => name === 'text' && attributes.get('data-legend-for') === role); assert.ok(key && caption, `${role} legend key/caption`); const points = renderedPathPoints(key); return {role, key, caption, bounds: labelBox(source, caption), points, markers: markerGeometry(source, key, points)}; });
  for (const legend of legends) {
    const keyGap = (Math.min(...legend.points.slice(1).map((point, index) => segmentDistance(legend.points[index], point, legend.bounds))) - Number(svgPresentationValue(source, legend.key, 'stroke-width') ?? 0) / 2) * scale; minima.legendKeyToCaption = Math.min(minima.legendKeyToCaption, keyGap); if (!(keyGap >= 12)) geometryFailures.push(`${legend.role} legend/key-caption ${keyGap}`);
    const ownMarkerGap = Math.min(...legend.markers.map((point) => pointRectangleDistance(point, legend.bounds))) * scale; minima.legendMarkerToCaption = Math.min(minima.legendMarkerToCaption, ownMarkerGap); if (!(ownMarkerGap >= 16)) geometryFailures.push(`${legend.role} legend/own-marker ${ownMarkerGap}`);
    for (const foreign of legends.filter(({role}) => role !== legend.role)) { const gap = Math.min(...foreign.markers.map((point) => pointRectangleDistance(point, legend.bounds))) * scale; if (!(gap >= 16)) geometryFailures.push(`${legend.role} legend/foreign-marker ${foreign.role} ${gap}`); }
  }
  if (enforcePanelInventory) assert.deepEqual([...observedTerminalCrossings].sort(), [...allowedTerminalCrossings].sort(), 'exact allowlisted terminal panel crossings');
  assert.deepEqual(geometryFailures, [], `complete physical geometry table: ${geometryFailures.join(', ')}`);
  return minima;
}
function assertNoOverdraw(source) {
  const {elements} = parseSvg(source); const paths = elements.filter(({name, attributes}) => name === 'path' && (attributes.has('data-edge-id') || attributes.has('data-structural-edge-id') || attributes.has('data-legend-key')));
  const collisions = [];
  for (const path of paths) for (const mask of elements.filter(({name, index, parent, attributes}) => ['rect', 'path', 'polygon', 'polyline', 'circle', 'ellipse'].includes(name) && parent?.name !== 'marker' && !attributes.has('data-edge-id') && !attributes.has('data-structural-edge-id') && !attributes.has('data-legend-key') && index > path.index)) {
    const fill = svgPresentationValue(source, mask, 'fill') ?? '#000000'; const fillOpacity = !['none', 'transparent'].includes(fill.toLowerCase()) ? paintOpacity(source, mask, 'fill') : 0;
    const stroke = svgPresentationValue(source, mask, 'stroke') ?? 'none'; const strokeWidth = Number(svgPresentationValue(source, mask, 'stroke-width') ?? 1); const strokeOpacity = !['none', 'transparent'].includes(stroke.toLowerCase()) && strokeWidth > 0 ? paintOpacity(source, mask, 'stroke') : 0;
    const points = renderedPathPoints(path); const connectorWidth = Number(svgPresentationValue(source, path, 'stroke-width') ?? 1); const id = path.attributes.get('data-edge-id') ?? path.attributes.get('data-structural-edge-id') ?? `legend-${path.attributes.get('data-legend-key')}`;
    if (fillOpacity > 0) { const bounds = visibleShapeBounds(mask); assert.ok(!points.slice(1).some((point, index) => segmentDistance(points[index], point, bounds) === 0), `${id} no later opaque/translucent ${mask.name} fill mask`); }
    if (strokeOpacity > 0) {
      const maskPoints = strokedGeometryPoints(mask); const gap = (strokeWidth + connectorWidth) / 2;
      const overlaps = points.slice(1).some((point, index) => maskPoints.slice(1).some((maskPoint, maskIndex) => lineSegmentDistance(points[index], point, maskPoints[maskIndex], maskPoint) <= gap));
      const maskId = mask.attributes.get('data-edge-id') ?? mask.attributes.get('data-structural-edge-id') ?? mask.attributes.get('data-legend-key') ?? mask.attributes.get('id') ?? mask.name;
      if (overlaps) collisions.push(`${id} -> ${maskId}`);
    }
  }
  assert.deepEqual(collisions, [], `no later opaque/translucent stroke masks: ${collisions.join(', ')}`);
}
function assertCanvasPaint(source) {
  const parsed = parseSvg(source); const canvas = parsed.elements.find(({attributes}) => /^(?:canvas|background)$/u.test(attributes.get('id') ?? '')); assert.ok(canvas, 'canvas paint exists');
  assertUntransformedGeometry(canvas, 'canvas');
  const fill = svgPresentationValue(source, canvas, 'fill'); assert.ok(fill && !['none', 'transparent'].includes(fill.toLowerCase()), 'effective canvas fill is painted');
  assert.ok(paintOpacity(source, canvas, 'fill') > 0, 'effective canvas opacity is nonzero');
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
  for (const [id, label] of [['inventory-authority', '库存权威'], ['payment-authority', '支付权威'], ['notification-authority', '通知权威']]) {
    const group = svg.elements.find(({name: tag, attributes}) => tag === 'g' && attributes.get('data-node-id') === id); assert.ok(group, `${id} visible authority`);
    const end = source.indexOf('</g>', source.indexOf(group.tag)); assert.ok(source.slice(source.indexOf(group.tag), end).includes(label), `${id} authority label`);
  }
  const recoveryTargets = CONNECTOR_INVENTORY.filter(([, sourceId]) => sourceId === 'recovery-path').map(([, , targetId, role]) => [targetId, role]);
  assert.ok(recoveryTargets.some(([targetId, role]) => targetId === 'inventory-authority' && role === 'reconciliation'), 'recovery queries inventory');
  assert.ok(recoveryTargets.some(([targetId, role]) => targetId === 'payment-authority' && role === 'reconciliation'), 'recovery queries payment');
  assert.equal(recoveryTargets.some(([, role]) => role === 'external-effect'), false, 'recovery never reaches an external side effect');
}
function assertDiagramOwnership(drawio, svg, source) {
  for (const [id, pattern] of [
    ['order-123-private-state', /订单状态.*履约协调状态/u], ['inventory-authority', /库存.*权威/u],
    ['payment-authority', /支付.*权威/u], ['notification-authority', /通知.*权威/u],
  ]) {
    const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id); assert.ok(node && pattern.test(node.label), `${id} affirmative ownership`);
    const group = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id); const texts = svg.elements.filter(({name, parent, attributes}) => name === 'text' && parent === group && attributes.has('data-text-role'));
    assert.match(texts.map((element) => elementText(source, element)).join('｜'), pattern, `${id} visible ownership`);
  }
  assert.match(source, /data-node-id="shared-order-state"[\s\S]*?(锁竞争|所有权模糊|重复副作用)/u, 'shared-state anti-pattern remains explicit');
  assert.doesNotMatch(source, /订单 Actor[^<。；]*(?<!不)拥有[^<。；]*(库存|支付|通知)权威/u, 'order Actor cannot own external authority');
}
function assertDiagram(sourceDrawio, sourceSvg, {semanticOnly = false} = {}) {
  assert.match(sourceDrawio, /<mxfile\b/u, 'Draw.io file');
  const root = sourceSvg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.match(root, /role="img"/u); assert.match(root, /viewBox="0 0 [0-9.]+ [0-9.]+"/u);
  assert.doesNotMatch(root, /(?:width|height)="/u, 'responsive SVG');
  const drawio = parseDrawio(sourceDrawio); const svg = parseSvg(sourceSvg);
  for (const element of svg.elements.filter(({name}) => name === 'text')) assertUntransformedGeometry(element, 'text');
  assert.deepEqual(drawio.nodes.filter(isPrimaryDiagramNode).map(({attributes}) => attributes.get('id')), DIAGRAM_NODES, 'exact ordered Draw.io node inventory without extras');
  assert.deepEqual(svg.nodes.map(({attributes}) => attributes.get('data-node-id')), DIAGRAM_NODES, 'exact ordered SVG node inventory without extras');
  for (const id of DIAGRAM_NODES) {
    const node = drawio.nodes.find(({attributes}) => attributes.get('id') === id); const rendered = svg.nodes.find(({attributes}) => attributes.get('data-node-id') === id);
    assert.ok(node, `Draw.io node ${id}`); assert.ok(rendered, `SVG node ${id}`);
    assert.equal(rendered.attributes.get('data-node-bounds'), `${node.geometry.get('x')} ${node.geometry.get('y')} ${node.geometry.get('width')} ${node.geometry.get('height')}`, `${id} bounds parity`);
  }
  const viewBox = root.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/u); const scale = 800 / Number(viewBox?.[1]);
  assert.ok(Number.isFinite(scale) && scale > 0, '800px CSS scale');
  assertConnectorInventory(drawio, svg, sourceSvg);
  for (const [id] of CONNECTOR_INVENTORY) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('id') === id); const path = svg.elements.find(({name, attributes}) => name === 'path' && attributes.get('data-edge-id') === id);
    assert.deepEqual(renderedPathPoints(path), drawioRoute(drawio, edge), `${id} semantic route parity`);
  }
  if (semanticOnly) return {drawio, svg};
  assertDiagramOwnership(drawio, svg, sourceSvg);
  assertStructuralOwnership(drawio, svg, sourceSvg);
  assertLegendParity(drawio, svg, sourceSvg);
  assertNodeParity(drawio, svg, sourceSvg);
  assertEditableTextParity(drawio, svg, sourceSvg);
  for (const [id, , , role] of CONNECTOR_INVENTORY) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('id') === id);
    assert.ok(edge, `Draw.io ${id}`); const route = drawioRoute(drawio, edge);
    const path = svg.elements.find(({name, attributes}) => name === 'path' && attributes.get('data-edge-id') === id); const label = svg.elements.find(({name, attributes}) => name === 'text' && attributes.get('data-edge-id') === id);
    assert.ok(path && label, `SVG ${role} path/label`); assert.equal(path.attributes.get('data-source'), edge.attributes.get('source'), `${id} semantic source`); assert.equal(path.attributes.get('data-target'), edge.attributes.get('target'), `${id} semantic target`);
    assert.deepEqual(renderedPathPoints(path), route, `${id} actual route parity`); assert.equal(label.attributes.get('data-role'), role, `${id} label role`); assert.equal(path.attributes.get('data-role'), role, `${id} path role`);
    const visibleLabel = elementText(sourceSvg, label); assert.equal(visibleLabel, edge.label, `${id} label parity`);
    const style = drawioStyle(edge); assert.equal(svgPresentationValue(sourceSvg, path, 'stroke'), style.get('strokeColor'), `${id} effective stroke`); assert.equal(Number(svgPresentationValue(sourceSvg, path, 'stroke-width')), Number(style.get('strokeWidth')), `${id} stroke width`);
    const markerId = svgPresentationValue(sourceSvg, path, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1]; assert.ok(markerId, `${id} effective marker`); const marker = svg.elements.find(({name, attributes}) => name === 'marker' && attributes.get('id') === markerId); const markerPath = svg.elements.find(({name, parent}) => name === 'path' && parent === marker);
    assert.ok(marker && markerPath, `${id} marker definition`); assert.equal(svgPresentationValue(sourceSvg, markerPath, 'fill'), style.get('endFill') === '0' ? 'none' : style.get('strokeColor'), `${id} marker fill`); assert.equal(svgPresentationValue(sourceSvg, markerPath, 'stroke'), style.get('strokeColor'), `${id} marker stroke`); assert.ok(Number(marker.attributes.get('markerWidth')) * scale <= 16 && Number(marker.attributes.get('markerHeight')) * scale <= 16, `${id} bounded marker`);
    assert.equal(svgPresentationValue(sourceSvg, path, 'stroke-dasharray') ?? '', style.get('dashed') === '1' ? style.get('dashPattern') : '', `${id} dash role`);
    const fontSize = Number.parseFloat(svgPresentationValue(sourceSvg, label, 'font-size')); assert.ok(fontSize * scale >= 15, `${id} rendered font`);
  }
  const canvas = sourceSvg.match(/<(?:rect|path|polygon)\b[^>]*\bid="(?:canvas|background)"[^>]*>/u)?.[0] ?? '';
  assert.ok(canvas, 'canvas element'); assertCanvasPaint(sourceSvg);
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
  const physical = assertPhysicalGeometry(sourceSvg, scale, true, true);
  const typography = typographyMetrics(svg, sourceSvg, scale);
  return {drawio, svg, alphaComposite, typography, physical};
}
async function mutation(source, transform, validator, label) {
  const changed = transform(source); assert.notEqual(changed, source, `${label} mutation applies`);
  assert.throws(() => validator(changed), assert.AssertionError, label);
}
function replaceAllPatternMatches(source, pattern, replacement = '') {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return source.replace(new RegExp(pattern.source, flags), replacement);
}

function semanticArticleFixture() {
  return `---
---
逻辑身份通过稳定键寻址。逻辑身份不自动保证生命周期与位置。
私有状态只能由 Actor 自身行为修改。私有状态不隔离共享数据库和外部服务。
邮箱缓冲消息并逐条取得。邮箱不自动保证持久化、有界或 FIFO。
行为处理一条消息并发送后续消息。行为不等于业务流程原子。
监督按策略重启、停止或升级。监督不代替业务恢复与对账。
Actor 不等于线程。Actor 不等于普通消息消费者。Actor 不等于事件驱动架构。Actor 不等于微服务。线程、队列消费者、事件、Actor 与微服务可以组合共存。四者不是成熟度阶梯。
不把每个类、每个请求、每个数据库行或每个服务改写为 Actor。
邮箱串行不自动提供持久化、可靠投递、全局顺序、恰好一次、分布式事务和外部副作用幂等。
监督不代替业务拒绝、对账、补偿、业务恢复和人工终止。
位置透明不隐藏容量、状态迁移、故障和网络边界。
Akka 是实现例证而不是模型公理。
Order-123 接收 SubmitOrder，携带操作 ID、关联 ID 和期望订单版本。Order-456 可以并行运行。
库存边界拥有库存权威状态。支付边界拥有支付权威状态。通知边界拥有通知权威状态。订单 Actor 拥有订单状态与履约协调状态。
超时表示结果未知，不等于目标未执行。接收者执行幂等判断，并先查询再对账。外部副作用具有人工停止路径。
邮箱必须有界并定义容量与溢出策略。邮箱是否持久是独立配置问题。邮箱 FIFO 或优先顺序是独立合同。
Akka 的至多一次投递只在框架实现范围内成立。同一发送者到同一接收者的顺序保证不能外推到跨发送者、重试或中介。死信必须可观测。
监督动作包括重启、停止和向上升级。重启预算必须有限。毒消息进入隔离。业务错误不同于执行故障。状态恢复从持久化事实开始。外部效果未知时必须对账。
位置透明通过逻辑身份寻址。位置透明不隐藏延迟。序列化是远程边界。网络分区必须处理。认证、授权与加密必须显式设计。需要显式放置约束。
热点 Actor 必须监测。跨 Actor 不变量需要协调。团队无法运营邮箱积压、监督预算、持久化恢复和集群放置时停止采用。

| 对照对象 | Actor Model 的决定性区别 | 不得外推 |
| --- | --- | --- |
| 线程与锁 | 逻辑并发单元通过私有状态和消息交互 | 不固定绑定线程，仍有竞争资源与容量约束 |
| 普通消息消费者 | 稳定逻辑身份封装状态，按目标身份进入邮箱 | 共享队列消费者不一定是长期业务实体，邮箱不自动持久化 |
| 事件驱动架构 | 回答谁拥有状态、谁处理消息；事件回答事实如何传播 | 使用事件不等于 Actor，Actor 消息不一定是领域事件 |
| 微服务 | 更细粒度的运行时实体，可按订单、设备或会话建模 | 不天然具有独立制品、部署、数据边界、团队所有权与公开服务合同 |

| 观察点 | 独立证据 |
| --- | --- |
${OBSERVATION_POINTS.map((point) => `| ${point} | 只证明当前检查点 |`).join('\n')}

| 失败类别 | 检测 | 自动动作 | 停止条件 | 人工所有者 |
| --- | --- | --- | --- | --- |
| 邮箱溢出 | 邮箱容量、积压与丢弃 | 背压、拒绝或降级 | 容量预算仍超限 | Actor 运行平台所有者 |
| 毒消息 | 同一消息重复失败与异常 | 隔离并停止自动重放 | 修复、验证与人工批准 | 消息合同所有者 |
| Actor 崩溃 | 执行异常与健康信号 | 预算内重启、停止或向上升级 | 重启预算耗尽 | Actor 运行平台所有者 |
| 状态恢复失败 | 快照、事件日志与版本冲突 | 停止激活、隔离并恢复 | 权威状态无法重建 | 订单状态所有者 |
| 外部效果未知 | 超时且无权威结果 | 操作 ID 查询与对账 | 不可逆效果仍未知 | 履约流程所有者 |
| 网络或目标不可用 | 超时、分区或目标不存在 | 有界重试、重新解析或降级 | 截止期后目标仍不可用 | 运行平台与目标所有者 |
| 消息合同不兼容 | 反序列化、版本拒绝与合同测试 | 隔离、兼容版本并停止发送 | 无受支持兼容路径 | 合同生产者与消费者 |
| 热点 Actor 积压 | 邮箱深度、最老消息与处理耗时 | 限流、拆分或转移查询 | 单邮箱持续违反目标 | 业务与运行平台所有者 |

| 决策 | 适用信号 | 前置责任 | 停止或收紧条件 |
| --- | --- | --- | --- |
| 采用 | 稳定身份、独立维护有限状态、单实体命令可串行，且活跃集合远小于逻辑实体全集 | 身份回收、有界邮箱、状态权威与恢复 | 身份冲突、状态无法重建或活跃集合容量不可控 |
| 谨慎采用 | 跨 Actor 查询需要协调、预留或补偿 | 幂等、对账、升级、再平衡与故障演练 | 热点 Actor 的单邮箱成为吞吐瓶颈 |
| 停止采用 | 即时联接、扫描或聚合查询为主 | 评估替代查询与协调边界，并保留数据迁移和回退 | 跨 Actor 不变量没有协调机制，或团队无法运营邮箱积压、监督预算、持久化恢复和集群放置 |

迁移第一步固定消息合同、状态机、持久化和外部权威。第二步把共享锁或并发写入口收敛为邮箱消息。第三步验证积压、激活、恢复、重放和热点实体。
`;
}

function sourceContractFixture() {
  const remoteIds = SOURCE_IDS.slice(0, -1); const sources = remoteIds.map((id) => {
    const expected = REMOTE_SOURCE_CONTRACTS[id]; return {id, ...Object.fromEntries(['canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version', 'checked_at', 'source_kind', 'tier', 'license', 'license_scope', 'license_evidence_url', 'license_evidence_note', 'copyright_policy', 'usage_boundary', 'allowed_evidence_roles'].map((field) => [field, expected[field]]))};
  });
  const citations = remoteIds.map((id) => { const expected = REMOTE_SOURCE_CONTRACTS[id]; return {source_id: id, citation_url: expected.canonical_locator, roles: expected.citation_roles, manifest_primary: expected.manifest_primary, usage_mode: 'facts-summary', attribution_note: expected.citation_attribution}; });
  const rows = remoteIds.map((id) => { const expected = REMOTE_SOURCE_CONTRACTS[id]; return `| ${expected.canonical_locator} | ${expected.canonical_locator} | ${expected.author_or_org} | ${expected.license_evidence_url} | ${expected.license_evidence_note} | ${expected.checked_at} | ${expected.license} | ${expected.license_scope} | ${expected.copyright_policy} | identity | not-applicable |`; });
  return {ledger: {sources, documents: {[ARTICLE]: {citations}}}, inventory: `| source_family | current_urls | author_or_org | license_evidence_url | license_evidence_note | checked_at | exact_license | scope_exclusions | migration_policy | family_grouping | grouping_evidence_url |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`};
}

function diagramSemanticFixture() {
  const nodeIndex = new Map(DIAGRAM_NODES.map((id, index) => [id, index]));
  const nodeCells = DIAGRAM_NODES.map((id, index) => `<mxCell id="${id}" value="${id}" vertex="1" dataRole="node" style="shape=rectangle;rounded=1;fontSize=20;fontFamily=Arial;fontColor=#0F172A;fontStyle=1;"><mxGeometry x="${index * 20}" y="${index * 20}" width="10" height="10"/></mxCell>`).join('');
  const route = (sourceId, targetId) => { const source = nodeIndex.get(sourceId) * 20; const target = nodeIndex.get(targetId) * 20; return {sourceX: source + 10, sourceY: source + 5, waypointX: source + 10, waypointY: target + 5, targetX: target, targetY: target + 5}; };
  const edgeCells = CONNECTOR_INVENTORY.map(([id, sourceId, targetId, role, label]) => { const style = CONNECTOR_STYLES[role]; const point = route(sourceId, targetId); return `<mxCell id="${id}" value="${label}" edge="1" source="${sourceId}" target="${targetId}" dataRole="${role}" style="strokeColor=${style.strokeColor};strokeWidth=${style.strokeWidth};dashed=${style.dashed};dashPattern=${style.dashPattern ?? ''};endArrow=${style.endArrow};endFill=${style.endFill};exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=1"><mxGeometry><Array as="points"><mxPoint x="${point.waypointX}" y="${point.waypointY}"/></Array></mxGeometry></mxCell>`; }).join('');
  const drawio = `<mxfile>${nodeCells}${edgeCells}</mxfile>`;
  const nodes = DIAGRAM_NODES.map((id, index) => { const label = ({'inventory-authority': '库存权威', 'payment-authority': '支付权威', 'notification-authority': '通知权威'})[id] ?? id; return `<g data-node-id="${id}" data-node-bounds="${index * 20} ${index * 20} 10 10">${label}</g>`; }).join('');
  const edges = CONNECTOR_INVENTORY.map(([id, sourceId, targetId, role, label]) => { const point = route(sourceId, targetId); return `<path data-edge-id="${id}" data-source="${sourceId}" data-target="${targetId}" data-role="${role}" d="M ${point.sourceX} ${point.sourceY} V ${point.waypointY} H ${point.targetX}"/><text data-edge-id="${id}">${label}</text>`; }).join('');
  return {drawio, svg: `<svg role="img" viewBox="0 0 1000 1000">${nodes}${edges}</svg>`};
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
  <g data-node-id="shared-state-boundary" data-node-bounds="0 0 350 300"><rect data-shape="boundary" class="boundary" x="0" y="0" width="350" height="300"/><text data-header-for="shared-state-boundary" x="80" y="40">共享状态</text></g>
  <g data-node-id="actor-runtime-boundary" data-node-bounds="450 0 350 300"><rect data-shape="boundary" class="boundary" x="450" y="0" width="350" height="300"/></g>
  <g data-node-id="external-authority-boundary" data-node-bounds="360 0 80 300"><rect data-shape="boundary" class="boundary" x="360" y="0" width="80" height="300"/></g>
  <g data-node-id="foreign-node" data-node-bounds="600 40 80 50"><rect data-shape="rounded-rect" x="600" y="40" width="80" height="50" fill="#E2E8F0" stroke="#64748B" stroke-width="2"/></g>
  <path class="edge" data-edge-id="edge-a" data-source="source-node" data-target="target-node" d="M 100 100 H 200"/>
  <text data-edge-id="edge-a" data-label-bounds="393.8 40 406.2 66" x="400" y="60" text-anchor="middle">A</text>
  <path class="edge" data-edge-id="edge-b" data-source="source-b" data-target="target-b" d="M 500 200 H 550"/>
  <text data-edge-id="edge-b" data-label-bounds="700 230 712.4 256" x="700" y="250">B</text>${legend}</svg>`;
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

test('semantic, comparison, failure, adoption, and migration fixtures execute contradiction-sensitive validators', async () => {
  const source = semanticArticleFixture(); assertActorComponents(source); assertProhibitions(source); assertSemanticBoundaries(source);
  assertComparisonTable(source); assertFailureTable(source); assertOrderFlow(source); assertRuntimeBoundaries(source); assertAdoptionContract(source);
  for (const claim of [
    '邮箱串行不自动提供持久化，但保证恰好一次。',
    '监督不能代替业务恢复，但自动完成对账。',
    '位置透明不隐藏延迟，但无需考虑容量。',
  ]) await mutation(source, (candidate) => `${candidate}\n${claim}\n`, assertSemanticBoundaries, `clause-local mixed contradiction: ${claim}`);
  for (const guarantee of ['持久化', '可靠投递', '全局顺序', '恰好一次', '分布式事务', '外部副作用幂等']) await mutation(source, (candidate) => `${candidate}\n邮箱不自动提供持久化，但保证${guarantee}。\n`, assertSemanticBoundaries, `clause-local mailbox ${guarantee}`);
  for (const guarantee of ['业务拒绝', '对账', '补偿', '持久化恢复', '人工终止']) await mutation(source, (candidate) => `${candidate}\n监督不能代替业务恢复，但自动完成${guarantee}。\n`, assertSemanticBoundaries, `clause-local supervision ${guarantee}`);
  for (const hidden of ['延迟', '序列化', '网络', '安全', '容量', '放置', '状态迁移', '故障']) await mutation(source, (candidate) => `${candidate}\n位置透明不隐藏延迟，但无需考虑${hidden}。\n`, assertSemanticBoundaries, `clause-local location ${hidden}`);
  for (const counterpart of ['线程', '普通消息消费者', '事件驱动架构', '微服务']) for (const claim of [`Actor 就是${counterpart}。`, `${counterpart}就是 Actor。`, `Actor 与${counterpart}不能共存。`, `${counterpart}与 Actor 不能组合。`, `Actor 不能与${counterpart}共存。`, `${counterpart}不能与 Actor 组合。`]) await mutation(source, (candidate) => `${candidate}\n${claim}\n`, assertProhibitions, `symmetric prohibition: ${claim}`);
  for (const [name, pattern] of REQUIRED_SEMANTIC_BOUNDARIES) await mutation(source, (candidate) => replaceAllPatternMatches(candidate, pattern), assertSemanticBoundaries, `${name} boundary deleted`);
  assert.equal(FALSE_SEMANTIC_FIXTURES.length, FORBIDDEN_SEMANTIC_CLAIMS.length, 'one false fixture per forbidden claim');
  for (const [index, [name]] of FORBIDDEN_SEMANTIC_CLAIMS.entries()) await mutation(source, (candidate) => `${candidate}\n${FALSE_SEMANTIC_FIXTURES[index]}\n`, assertSemanticBoundaries, `${name} contradiction`);
  const tables = markdownTables(articleParts(source).body); const comparison = tables.find((table) => table[0][0] === '对照对象'); const failures = tables.find((table) => table[0][0] === '失败类别'); const adoption = tables.find((table) => table[0][0] === '决策');
  for (const [table, validator] of [[comparison, assertComparisonTable], [failures, assertFailureTable], [adoption, assertAdoptionContract]]) for (const row of table.slice(2)) {
    const exact = `| ${row.join(' | ')} |`; await mutation(source, (candidate) => candidate.replace(`${exact}\n`, ''), validator, `${row[0]} standalone row deletion`);
    for (let cell = 1; cell < row.length; cell += 1) { if ((validator === assertComparisonTable && cell === 1) || (validator === assertFailureTable && cell === 4)) continue; const changed = [...row]; changed[cell] = `不适用：${row[cell].slice(0, 2)}（诱饵）`; await mutation(source, (candidate) => candidate.replace(exact, `| ${changed.join(' | ')} |`), validator, `${row[0]} standalone cell ${cell} mutation`); }
  }
  for (const row of comparison.slice(2)) { const exact = `| ${row.join(' | ')} |`; const changed = [...row]; changed[1] = `${row[1]}，但不负责该状态或消息`; await mutation(source, (candidate) => candidate.replace(exact, `| ${changed.join(' | ')} |`), assertComparisonTable, `${row[0]} tempting negative decisive cell`); }
  const microservice = comparison.find(([label]) => label === '微服务'); const exactMicroservice = `| ${microservice.join(' | ')} |`; const corruptMicroservice = [...microservice]; corruptMicroservice[1] = '设备';
  await mutation(source, (candidate) => candidate.replace(exactMicroservice, `| ${corruptMicroservice.join(' | ')} |`), assertComparisonTable, 'microservice decisive cell requires grouped Actor distinction');
  for (const row of failures.slice(2)) { const exact = `| ${row.join(' | ')} |`; const changed = [...row]; changed[4] = `${row[4]}不负责处置`; await mutation(source, (candidate) => candidate.replace(exact, `| ${changed.join(' | ')} |`), assertFailureTable, `${row[0]} tempting negative owner`); }
  const firstAdoption = `| ${adoption[2].join(' | ')} |`; const secondAdoption = `| ${adoption[3].join(' | ')} |`;
  await mutation(source, (candidate) => candidate.replace(firstAdoption, '__ADOPT_SWAP__').replace(secondAdoption, firstAdoption).replace('__ADOPT_SWAP__', secondAdoption), assertAdoptionContract, 'adoption row order');
  for (const claim of ['热点 Actor 的单邮箱永远不会成为吞吐瓶颈。', '跨 Actor 不变量无需协调、预留或补偿。', '团队无需运营邮箱积压与监督预算。', '先把所有服务改写为 Actor。']) await mutation(source, (candidate) => `${candidate}\n${claim}\n`, assertAdoptionContract, claim);
  for (const [index, step] of MIGRATION_STEPS.entries()) await mutation(source, (candidate) => candidate.replace(step, `跳过第 ${index + 1} 步`), assertAdoptionContract, `migration step ${index + 1} semantic mutation`);
  await mutation(source, (candidate) => candidate.replace('第一步固定消息合同、状态机、持久化和外部权威。第二步把共享锁或并发写入口收敛为邮箱消息。', '第二步把共享锁或并发写入口收敛为邮箱消息。第一步固定消息合同、状态机、持久化和外部权威。'), assertAdoptionContract, 'migration order swapped');
});

test('remote-source fixtures execute exact field, inventory, and self-consistent fabrication mutations', () => {
  const fixture = sourceContractFixture(); assertRemoteSourceContracts(fixture.ledger, fixture.inventory);
  const fields = ['canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version', 'checked_at', 'source_kind', 'tier', 'license', 'license_scope', 'license_evidence_url', 'license_evidence_note', 'copyright_policy', 'usage_boundary'];
  for (const field of fields) { const changed = structuredClone(fixture.ledger); changed.sources[0][field] = `${changed.sources[0][field]} changed`; assert.throws(() => assertRemoteSourceContracts(changed, fixture.inventory), assert.AssertionError, `${field} exact mutation`); }
  for (const field of ['allowed_evidence_roles', 'roles']) { const changed = structuredClone(fixture.ledger); if (field === 'roles') changed.documents[ARTICLE].citations[0].roles = ['comparison']; else changed.sources[0][field] = ['comparison']; assert.throws(() => assertRemoteSourceContracts(changed, fixture.inventory), assert.AssertionError, `${field} exact mutation`); }
  for (const [field, value] of [['citation_url', 'https://example.invalid/citation'], ['manifest_primary', false], ['usage_mode', 'verbatim'], ['attribution_note', 'fabricated attribution']]) {
    const changed = structuredClone(fixture.ledger); changed.documents[ARTICLE].citations[0][field] = value; assert.throws(() => assertRemoteSourceContracts(changed, fixture.inventory), assert.AssertionError, `citation ${field} exact mutation`);
  }
  for (const [column, field] of ['current URL', 'author/org', 'license evidence URL', 'license evidence note', 'checked date', 'license', 'scope', 'policy'].entries()) {
    const lines = fixture.inventory.split('\n'); const row = lines.findIndex((line) => line.startsWith(`| ${fixture.ledger.sources[0].canonical_locator} |`)); assert.ok(row > 1, `${field} governed inventory row`);
    const cells = lines[row].split('|'); cells[column + 2] = `${cells[column + 2]} changed`; lines[row] = cells.join('|'); const changed = lines.join('\n');
    assert.notEqual(changed, fixture.inventory, `${field} inventory mutation applies`); assert.throws(() => assertRemoteSourceContracts(fixture.ledger, changed), assert.AssertionError, `${field} inventory mutation rejected`);
  }
  const selfConsistent = structuredClone(fixture.ledger); const original = selfConsistent.sources[0].canonical_locator; selfConsistent.sources[0].canonical_locator = 'https://example.invalid/fabricated'; selfConsistent.documents[ARTICLE].citations[0].citation_url = selfConsistent.sources[0].canonical_locator;
  const fabricatedInventory = fixture.inventory.replaceAll(original, selfConsistent.sources[0].canonical_locator); assert.notEqual(fabricatedInventory, fixture.inventory, 'self-consistent inventory fabrication applies');
  assert.throws(() => assertRemoteSourceContracts(selfConsistent, fabricatedInventory), assert.AssertionError, 'self-consistent ledger/inventory fabrication rejected');
  const supervisionRole = structuredClone(fixture.ledger);
  supervisionRole.sources.find(({id}) => id === 'src-akka-actor-model').usage_boundary = 'Akka Typed implementation evidence for encapsulated state, behavior, messaging, one-message-at-a-time processing, and supervision.';
  assert.throws(() => assertRemoteSourceContracts(supervisionRole, fixture.inventory), assert.AssertionError, 'Akka Actor supervision-role mutation rejected');
});

test('diagram semantic, visible-bounds, painted-stroke, canvas, and mask fixtures execute validators', () => {
  const fixture = diagramSemanticFixture(); assertDiagram(fixture.drawio, fixture.svg, {semanticOnly: true});
  const unsafeDrawio = fixture.drawio.replace(/(<mxCell\b[^>]*\bid="reconcile-payment"[^>]*\btarget=")payment-authority/u, '$1notification-authority').replace(/(<mxCell\b[^>]*\bid="reconcile-payment"[^>]*\bdataRole=")reconciliation/u, '$1external-effect');
  const unsafeSvg = fixture.svg.replace(/(<path\b[^>]*data-edge-id="reconcile-payment"[^>]*\bdata-target=")payment-authority/u, '$1notification-authority').replace(/(<path\b[^>]*data-edge-id="reconcile-payment"[^>]*\bdata-role=")reconciliation/u, '$1external-effect').replace(/(<path\b[^>]*data-edge-id="reconcile-payment"[^>]*\bd=")[^"]+/u, '$1M 370 365 V 405 H 400');
  assert.notEqual(unsafeDrawio, fixture.drawio, 'unsafe recovery Draw.io role/target/path mutation applies'); assert.notEqual(unsafeSvg, fixture.svg, 'unsafe recovery SVG role/target/path mutation applies');
  assert.throws(() => assertDiagram(unsafeDrawio, unsafeSvg, {semanticOnly: true}), assert.AssertionError, 'assertDiagram rejects recovery to external effect');
  const routeOnly = fixture.svg.replace(/(<path\b[^>]*data-edge-id="reconcile-payment"[^>]*\bd=")[^"]+/u, '$1M 370 365 V 405 H 400'); assert.notEqual(routeOnly, fixture.svg, 'unsafe recovery path-only mutation applies');
  assert.throws(() => assertDiagram(fixture.drawio, routeOnly, {semanticOnly: true}), assert.AssertionError, 'assertDiagram independently rejects recovery path drift');
  const extraNodeDrawio = fixture.drawio.replace('</mxfile>', '<mxCell id="extra-node" vertex="1" dataRole="node"><mxGeometry x="0" y="0" width="1" height="1"/></mxCell></mxfile>'); const extraNodeSvg = fixture.svg.replace('</svg>', '<g data-node-id="extra-node" data-node-bounds="0 0 1 1"></g></svg>');
  assert.throws(() => assertDiagram(extraNodeDrawio, extraNodeSvg, {semanticOnly: true}), assert.AssertionError, 'extra node inventory rejected');
  const boundsDrawio = parseDrawio('<mxfile><mxCell id="n" vertex="1"><mxGeometry x="10" y="20" width="30" height="40"/></mxCell></mxfile>');
  const boundsSource = '<svg><g data-node-id="n" data-node-bounds="10 20 30 40" transform="translate(10 20)"><rect data-shape="rounded-rect" x="0" y="0" width="30" height="40"/></g></svg>'; const boundsSvg = parseSvg(boundsSource); assertVisibleNodeBounds(boundsDrawio, boundsSvg, 'n');
  for (const changed of [boundsSource.replace('x="0"', 'x="1"'), boundsSource.replace('width="30"', 'width="31"'), boundsSource.replace('translate(10 20)', 'translate(11 20)')]) assert.throws(() => assertVisibleNodeBounds(boundsDrawio, parseSvg(changed), 'n'), assert.AssertionError, 'actual visible shape drift rejected while metadata is unchanged');
  for (const transform of ['rotate(15)', 'skewX(10)', 'skewY(10)']) { const transformed = boundsSource.replace('translate(10 20)', transform); assert.throws(() => assertVisibleNodeBounds(boundsDrawio, parseSvg(transformed), 'n'), assert.AssertionError, `${transform} cannot be silently ignored`); }
  for (const [shape, label] of [
    ['<circle cx="10" cy="10" r="5" transform="matrix(0 1 -1 0 20 0)"/>', 'matrix-rotated circle'],
    ['<ellipse cx="10" cy="10" rx="6" ry="3" transform="matrix(1 0.5 0.75 1 0 0)"/>', 'matrix-sheared ellipse'],
  ]) { const transformed = `<svg>${shape}</svg>`; const element = parseSvg(transformed).elements.find(({name}) => name === shape.match(/^<(\w+)/u)[1]); assert.throws(() => visibleShapeBounds(element), assert.AssertionError, `${label} rejected before approximate bounds`); }
  const transformedText = '<svg><text x="10" y="20" transform="translate(5 0)" font-size="10">label</text></svg>'; const textElement = parseSvg(transformedText).elements.find(({name}) => name === 'text'); assert.throws(() => labelBox(transformedText, textElement), assert.AssertionError, 'transformed text geometry explicitly rejected');
  const transformedRoute = '<svg><path data-edge-id="e" d="M 0 0 H 20" transform="translate(5 0)"/></svg>'; const routeElement = parseSvg(transformedRoute).elements.find(({name}) => name === 'path'); assert.throws(() => renderedPathPoints(routeElement), assert.AssertionError, 'transformed route geometry explicitly rejected');
  const transformedMarker = physicalGeometryFixture().replace('<path d="M 0 0 L 10 5 L 0 10 Z"', '<path transform="rotate(15)" d="M 0 0 L 10 5 L 0 10 Z"'); assert.notEqual(transformedMarker, physicalGeometryFixture(), 'transformed marker mutation applies'); assert.throws(() => assertPhysicalGeometry(transformedMarker, 1, false), assert.AssertionError, 'transformed marker geometry explicitly rejected');
  const canvas = '<svg><rect id="canvas" x="0" y="0" width="100" height="100" fill="#FFFFFF" opacity="1"/></svg>'; assertCanvasPaint(canvas); assert.throws(() => assertCanvasPaint(canvas.replace('opacity="1"', 'opacity="0"')), assert.AssertionError, 'zero effective canvas opacity rejected');
  const unmasked = '<svg><path data-edge-id="e" d="M 0 0 H 20" fill="none" stroke="#000000" stroke-width="2"/></svg>'; assertNoOverdraw(unmasked);
  for (const mask of ['<rect x="9" y="-1" width="2" height="2" fill="#000000"/>', '<path d="M 9 -1 H 11 V 1 H 9 V -1" fill="#000000"/>', '<polygon points="9,-1 11,-1 11,1 9,1" fill="#000000"/>', '<polyline points="9,-1 11,-1 11,1 9,1" fill="#000000"/>', '<circle cx="10" cy="0" r="1" fill="#000000"/>', '<ellipse cx="10" cy="0" rx="1" ry="2" fill="#000000"/>']) assert.throws(() => assertNoOverdraw(unmasked.replace('</svg>', `${mask}</svg>`)), assert.AssertionError, `${mask.slice(1, mask.indexOf(' '))} later painted mask rejected`);
  for (const mask of ['<rect x="8" y="-3" width="4" height="6"/>', '<path d="M 10 -3 V 3"/>', '<polygon points="8,-3 12,0 8,3"/>', '<polyline points="10,-3 10,3"/>', '<circle cx="10" cy="0" r="3"/>', '<ellipse cx="10" cy="0" rx="3" ry="2"/>']) {
    const paintedStroke = mask.replace('/>', ' fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.5"/>'); assert.throws(() => assertNoOverdraw(unmasked.replace('</svg>', `${paintedStroke}</svg>`)), assert.AssertionError, `${mask.slice(1, mask.indexOf(' '))} later translucent stroke mask rejected`);
  }
  for (const [transform, label] of [['matrix(1 0 0 10 0 0)', 'matrix-scaled'], ['scale(5)', 'uniformly scaled']]) {
    const scaledMask = `<path d="M 5 1 H 15" transform="${transform}" fill="none" stroke="#FFFFFF" stroke-width="2"/>`; assert.throws(() => assertNoOverdraw(unmasked.replace('</svg>', `${scaledMask}</svg>`)), assert.AssertionError, `${label} thick-stroke mask rejected before under-measured footprint`);
  }
  const geometry = physicalGeometryFixture(); const thickStroke = geometry.replace('stroke-width:2', 'stroke-width:400'); assert.notEqual(thickStroke, geometry, 'painted stroke mutation applies'); assert.throws(() => assertPhysicalGeometry(thickStroke, 1, false), assert.AssertionError, 'clearance measures painted stroke edge');
});

test('metadata, wrapper, component, and prohibition fixtures prove mutations are non-no-op', () => {
  const scalar = Object.entries(EXACT_METADATA).filter(([, value]) => !Array.isArray(value)).map(([field, value]) => `${field}: ${value}`);
  const arrays = Object.entries(EXACT_METADATA).filter(([, value]) => Array.isArray(value)).flatMap(([field, values]) =>
    values.length === 0 ? [`${field}: []`] : [`${field}:`, ...values.map((value) => `  - ${value}`)]);
  const metadata = `---\n${[...scalar, ...arrays].join('\n')}\n---\n`; assertExactMetadata(metadata);
  for (const field of Object.keys(EXACT_METADATA)) {
    const deleted = removeFrontMatterField(metadata, field); const changed = changeFrontMatterField(metadata, field);
    assert.notEqual(deleted, metadata, `${field} deletion fixture mutates`); assert.notEqual(changed, metadata, `${field} change fixture mutates`);
    assert.throws(() => assertExactMetadata(deleted), assert.AssertionError); assert.throws(() => assertExactMetadata(changed), assert.AssertionError);
  }
  const wrappers = REQUIRED_WRAPPERS.map(exactWrapperTag).join('\n'); assertRequiredWrappers(wrappers);
  for (const wrapper of REQUIRED_WRAPPERS) for (const [name, from, deleted, changed] of [
    ['className', `className="${wrapper.className}"`, '', 'className="changed"'], ['role', ' role="region"', '', ' role="group"'],
    ['aria', ` aria-label="${wrapper.aria}"`, '', ` aria-label="${wrapper.aria} changed"`], ['tabIndex', ' tabIndex={0}', '', ' tabIndex={-1}'],
    ['handler', ' onKeyDown={handleHorizontalArrowKey}', '', ' onKeyDown={() => {}}'],
  ]) {
    const opening = exactWrapperTag(wrapper); const removed = wrappers.replace(opening, opening.replace(from, deleted)); const altered = wrappers.replace(opening, opening.replace(from, changed));
    assert.notEqual(removed, wrappers, `${wrapper.aria} ${name} deletion fixture mutates`); assert.notEqual(altered, wrappers, `${wrapper.aria} ${name} change fixture mutates`);
    assert.throws(() => assertRequiredWrappers(removed), assert.AssertionError); assert.throws(() => assertRequiredWrappers(altered), assert.AssertionError);
  }
  const components = [
    '逻辑身份通过稳定键寻址。逻辑身份不自动保证生命周期与位置。',
    '私有状态只能由 Actor 自身行为修改。私有状态不隔离共享数据库和外部服务。',
    '邮箱缓冲消息并逐条取得。邮箱不自动保证持久化、有界或 FIFO。',
    '行为处理一条消息并发送后续消息。行为不等于业务流程原子。',
    '监督按策略重启、停止或升级。监督不代替业务恢复与对账。',
  ].join(''); assertActorComponents(components);
  for (const [name, positive] of ACTOR_COMPONENTS) {
    const matched = components.match(positive)?.[0]; assert.ok(matched, `${name} positive fixture match`);
    const negated = components.replace(matched, `${matched}，责任待定`); assert.notEqual(negated, components, `${name} negative mutation applies`);
    assert.throws(() => assertActorComponents(negated), assert.AssertionError, `${name} polarity mutation rejected`);
  }
  assertProhibitions('Actor 不等于线程。Actor 不等于普通消息消费者。Actor 不等于事件驱动架构。Actor 不等于微服务。线程、队列消费者、事件、Actor 与微服务可以组合共存。');
});

test('STY-08 diagram inventory and geometry fixtures reject physical hazards', () => {
  const fixture = physicalGeometryFixture(); assertPhysicalGeometry(fixture, 1, false);
  for (const [label, changed] of [
    ['moved label', fixture.replace('data-label-bounds="393.8 40 406.2 66" x="400" y="60"', 'data-label-bounds="193.8 75 206.2 101" x="200" y="95"')],
    ['foreign node collision', fixture.replace('x="600" y="40" width="80" height="50" fill="#E2E8F0"', 'x="390" y="35" width="30" height="40" fill="#E2E8F0"')],
    ['boundary collision', fixture.replace('x="360" y="0" width="80" height="300"', 'x="395" y="0" width="10" height="300"')],
    ['header padding', fixture.replace('x="80" y="40">共享状态', 'x="80" y="15">共享状态')],
    ['legend collision', fixture.replace('data-legend-for="local-message" x="300"', 'data-legend-for="local-message" x="195"')],
    ['oversized marker', fixture.replace('markerWidth="8"', 'markerWidth="20"')],
    ['shifted marker into foreign node', fixture.replace('refX="9" refY="5"', 'refX="-500" refY="15"')],
    ['shifted marker into boundary stroke', fixture.replace('refX="9"', 'refX="-200"')],
    ['partial collinear overlap', fixture.replace('<text data-edge-id="edge-a"', '<path class="edge" data-edge-id="edge-b" data-source="other-a" data-target="other-b" d="M 150 100 H 250"/><text data-edge-id="edge-a"')],
    ['perpendicular path contact', fixture.replace('d="M 500 200 H 550"', 'd="M 150 50 V 150"')],
    ['edge label-to-label overlap', fixture.replace('data-label-bounds="700 230 712.4 256" x="700" y="250"', 'data-label-bounds="400 40 412.4 66" x="400" y="60"')],
  ]) {
    assert.notEqual(changed, fixture, `${label} mutation applies`);
    assert.throws(() => assertPhysicalGeometry(changed, 1, false), assert.AssertionError, `${label} rejected`);
  }
  const inventory = CONNECTOR_INVENTORY.map((edge) => [...edge]); assert.deepEqual(inventory, CONNECTOR_INVENTORY);
  assert.throws(() => assert.deepEqual(inventory.slice(1), CONNECTOR_INVENTORY), assert.AssertionError, 'missing connector rejected');
  const detached = CONNECTOR_INVENTORY.map((edge) => [...edge]); detached.find(([id]) => id === 'reserve-inventory')[2] = 'runtime-node-a';
  assert.throws(() => assert.deepEqual(detached, CONNECTOR_INVENTORY), assert.AssertionError, 'detached authority rejected');
  const unsafe = CONNECTOR_INVENTORY.map((edge) => [...edge]); unsafe.find(([id]) => id === 'reconcile-payment')[3] = 'external-effect';
  assert.throws(() => assert.deepEqual(unsafe, CONNECTOR_INVENTORY), assert.AssertionError, 'recovery external effect rejected');
});

test('locks the exact ten-H2 article contract and non-mechanical epistemic labels', async () => {
  const source = file(ARTICLE); assertArticleStructure(source);
  for (const heading of EXPECTED_HEADINGS) await mutation(source, (candidate) => candidate.replace(`## ${heading}\n`, ''), assertArticleStructure, `${heading} heading deleted`);
  await mutation(source, (candidate) => candidate.replace(`## ${EXPECTED_HEADINGS[0]}\n`, `## ${EXPECTED_HEADINGS[0]}（改）\n`), assertArticleStructure, 'heading renamed');
  await mutation(source, (candidate) => candidate.replace(`## ${EXPECTED_HEADINGS[0]}\n`, '## __HEADING_SWAP__\n').replace(`## ${EXPECTED_HEADINGS[1]}\n`, `## ${EXPECTED_HEADINGS[0]}\n`).replace('## __HEADING_SWAP__\n', `## ${EXPECTED_HEADINGS[1]}\n`), assertArticleStructure, 'heading order changed');
  await mutation(source, (candidate) => candidate.replace('## 来源\n', '## 额外章节\n\n## 来源\n'), assertArticleStructure, 'extra H2 inserted');
  for (const label of EPISTEMIC_LABELS) {
    await mutation(source, (candidate) => candidate.replace(`**${label}：**`, ''), assertArticleStructure, `${label} deleted`);
    await mutation(source, (candidate) => `${candidate}\n**${label}：** 重复标签。\n`, assertArticleStructure, `${label} duplicated`);
  }
});

test('locks exact STY-08 metadata, wrappers, components, order flow, and runtime boundaries', async () => {
  const source = file(ARTICLE); const {body} = articleParts(source); assertExactMetadata(source);
  assertArticleStructure(source);
  assertRequiredWrappers(source); assertActorComponents(source); assertProhibitions(source); assertSemanticBoundaries(source); assertOrderFlow(source); assertRuntimeBoundaries(source); assertAdoptionContract(source);
  for (const field of Object.keys(EXACT_METADATA)) {
    await mutation(source, (candidate) => removeFrontMatterField(candidate, field), assertExactMetadata, `${field} deleted`);
    await mutation(source, (candidate) => changeFrontMatterField(candidate, field), assertExactMetadata, `${field} changed`);
  }
  for (const wrapper of REQUIRED_WRAPPERS) for (const [name, from, deleted, changed] of [
    ['className', `className="${wrapper.className}"`, '', 'className="changed"'], ['role', ' role="region"', '', ' role="group"'],
    ['aria', ` aria-label="${wrapper.aria}"`, '', ` aria-label="${wrapper.aria} changed"`], ['tabIndex', ' tabIndex={0}', '', ' tabIndex={-1}'],
    ['handler', ' onKeyDown={handleHorizontalArrowKey}', '', ' onKeyDown={() => {}}'],
  ]) {
    await mutation(source, (candidate) => candidate.replace(exactWrapperTag(wrapper), exactWrapperTag(wrapper).replace(from, deleted)), assertRequiredWrappers, `${wrapper.aria} ${name} deleted`);
    await mutation(source, (candidate) => candidate.replace(exactWrapperTag(wrapper), exactWrapperTag(wrapper).replace(from, changed)), assertRequiredWrappers, `${wrapper.aria} ${name} changed`);
  }
  for (const [name, positive, boundary] of ACTOR_COMPONENTS) {
    await mutation(source, (candidate) => replaceAllPatternMatches(candidate, positive, '责任待定'), assertActorComponents, `${name} responsibility removed`);
    await mutation(source, (candidate) => replaceAllPatternMatches(candidate, boundary), assertActorComponents, `${name} non-guarantee removed`);
  }
  for (const [name, pattern] of ORDER_FLOW_CONTRACTS) await mutation(source, (candidate) => replaceAllPatternMatches(candidate, pattern), assertOrderFlow, `${name} removed`);
  for (const [name, pattern] of RUNTIME_CONTRACTS) await mutation(source, (candidate) => replaceAllPatternMatches(candidate, pattern), assertRuntimeBoundaries, `${name} removed`);
  for (const point of OBSERVATION_POINTS) await mutation(source, (candidate) => candidate.replace(`| ${point} |`, '| 删除观察点 |'), assertOrderFlow, `${point} removed`);
  await mutation(source, (candidate) => `${candidate}\n进入邮箱即证明支付完成。\n`, assertOrderFlow, 'mailbox false implication');
  await mutation(source, (candidate) => `${candidate}\n超时证明目标未执行。\n`, assertOrderFlow, 'timeout false implication');
  await mutation(source, (candidate) => `${candidate}\n无限重启。\n`, assertRuntimeBoundaries, 'unlimited restart');
  for (const [name, pattern] of PROHIBITIONS) await mutation(source, (candidate) => replaceAllPatternMatches(candidate, pattern, 'Actor 就是线程'), assertProhibitions, name);
  for (const equivalent of ['线程', '普通消息消费者', '事件驱动架构', '微服务']) await mutation(source, (candidate) => `${candidate}\nActor 就是${equivalent}。\n`, assertProhibitions, `Actor equals ${equivalent}`);
  await mutation(source, (candidate) => `${candidate}\n只能采用 Actor，线程、队列、事件驱动与微服务不能组合。\n`, assertProhibitions, 'mutual exclusion');
  for (const [index, [name]] of FORBIDDEN_SEMANTIC_CLAIMS.entries()) await mutation(source, (candidate) => `${candidate}\n${FALSE_SEMANTIC_FIXTURES[index]}\n`, assertSemanticBoundaries, `${name} implementation contradiction`);
});

test('locks comparison, checkpoints, failure, adoption, and migration responsibilities', async () => {
  const source = file(ARTICLE); articleParts(source); assertComparisonTable(source); assertFailureTable(source); assertOrderFlow(source); assertAdoptionContract(source); assertAkkaActorEvidenceScope(source);
  const comparison = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '对照对象');
  const failure = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '失败类别');
  for (const [table, validator] of [[comparison, assertComparisonTable], [failure, assertFailureTable]]) for (const cells of table.slice(2)) {
    const row = `| ${cells.join(' | ')} |`; await mutation(source, (candidate) => candidate.replace(`${row}\n`, ''), validator, `${cells[0]} row deleted`);
    for (let cell = 1; cell < cells.length; cell += 1) {
      if ((validator === assertComparisonTable && cell === 1) || (validator === assertFailureTable && cell === 4)) continue;
      const changed = [...cells]; changed[cell] = '错误语义';
      await mutation(source, (candidate) => candidate.replace(row, `| ${changed.join(' | ')} |`), validator, `${cells[0]} cell ${cell} corrupted`);
    }
  }
  const first = `| ${comparison[2].join(' | ')} |`; const second = `| ${comparison[3].join(' | ')} |`;
  await mutation(source, (candidate) => candidate.replace(first, '__SWAP__').replace(second, first).replace('__SWAP__', second), assertComparisonTable, 'comparison rows swapped');
  for (const row of failure.slice(2)) {
    const exact = `| ${row.join(' | ')} |`;
    await mutation(source, (candidate) => candidate.replace(exact, `| ${[...row.slice(0, -1), `${row.at(-1)}不负责处置`].join(' | ')} |`), assertFailureTable, `${row[0]} tempting negative owner`);
  }
  for (const row of comparison.slice(2)) { const exact = `| ${row.join(' | ')} |`; const changed = [...row]; changed[1] = `${row[1]}，但不负责该状态或消息`; await mutation(source, (candidate) => candidate.replace(exact, `| ${changed.join(' | ')} |`), assertComparisonTable, `${row[0]} tempting negative decisive cell`); }
  const adoption = markdownTables(articleParts(source).body).find((candidate) => candidate[0]?.[0] === '决策');
  for (const row of adoption.slice(2)) { const exact = `| ${row.join(' | ')} |`; await mutation(source, (candidate) => candidate.replace(`${exact}\n`, ''), assertAdoptionContract, `${row[0]} adoption deletion`); for (let cell = 1; cell < row.length; cell += 1) { const changed = [...row]; changed[cell] = '错误决策语义'; await mutation(source, (candidate) => candidate.replace(exact, `| ${changed.join(' | ')} |`), assertAdoptionContract, `${row[0]} adoption cell ${cell}`); } }
  const firstAdoption = `| ${adoption[2].join(' | ')} |`; const secondAdoption = `| ${adoption[3].join(' | ')} |`; await mutation(source, (candidate) => candidate.replace(firstAdoption, '__SWAP__').replace(secondAdoption, firstAdoption).replace('__SWAP__', secondAdoption), assertAdoptionContract, 'adoption order');
  await mutation(source, (candidate) => `${candidate}\nActor、线程、消费者、事件驱动和微服务形成一条成熟度阶梯。\n`, assertComparisonTable, 'maturity ladder');
  await mutation(source, (candidate) => `${candidate}\n无限重启可以持续恢复 Actor。\n`, assertFailureTable, 'unlimited restart');
  await mutation(source, (candidate) => candidate.replace(AKKA_ACTOR_SOURCE_LINE, AKKA_ACTOR_SOURCE_LINE.replace('逐条处理', '监督')), assertAkkaActorEvidenceScope, 'Akka source line reintroduces supervision');
  await mutation(source, (candidate) => candidate.replace(AKKA_ACTOR_READING_ROW[1], AKKA_ACTOR_READING_ROW[1].replace('逐条处理', '监督')), assertAkkaActorEvidenceScope, 'Akka reading row reintroduces supervision');
});

test('governs STY-08 sources, reciprocal relations, and the current Stage B projection', async () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8')); const inventory = readFileSync('docs/source-license-inventory.md', 'utf8'); assertRemoteSourceContracts(ledger, inventory);
  const linkHealth = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const document = ledger.documents[ARTICLE]; assert.ok(document); assert.deepEqual(document.citations.map(({source_id}) => source_id), SOURCE_IDS);
  const documents = (await readContentDocuments('content')).map((entry) => ({...entry, file: `content/${entry.file}`}));
  const remote = SOURCE_IDS.slice(0, -1).map((id) => ledger.sources.find((entry) => entry.id === id));
  for (const governed of remote) {
    const health = linkHealth.results.find(({transport_locator}) => transport_locator === governed.transport_locator);
    assert.ok(health, `${governed.id} exact pinned transport health`);
    assert.deepEqual(health.source_ids, [governed.id], `${governed.id} exact health identity`);
    assert.deepEqual([health.last_attempt?.outcome, health.last_attempt?.http_status, health.last_attempt?.final_transport_locator], ['healthy', 200, governed.transport_locator], `${governed.id} pinned transport healthy`);
  }
  for (const id of SOURCE_IDS) {
    const governed = ledger.sources.find((entry) => entry.id === id); const citation = document.citations.find((entry) => entry.source_id === id);
    assert.ok(governed, `${id} source`); for (const field of SOURCE_REQUIRED_FIELDS) assert.ok(governed[field]?.length !== 0 && governed[field] !== undefined, `${id}.${field}`);
    assert.ok(citation?.roles?.every((role) => governed.allowed_evidence_roles.includes(role)), `${id} evidence roles`); assert.ok(citation?.attribution_note && citation?.usage_mode, `${id} attribution and usage`);
  }
  const illustration = ledger.sources.find(({id}) => id === SOURCE_IDS.at(-1)); for (const [field, expected] of Object.entries(ILLUSTRATION)) assert.deepEqual(illustration[field], expected);
  assert.deepEqual(document.citations.find(({source_id}) => source_id === SOURCE_IDS.at(-1)), {source_id: SOURCE_IDS.at(-1), ...ILLUSTRATION_CITATION}); assert.deepEqual(document.copyright_checks, COPYRIGHT_CHECKS);
  const article = documents.find(({file}) => file === ARTICLE); const links = extractInternalLinks(article); assert.ok(links.includes('/styles')); assert.ok(links.includes('/cases/erlang-otp-supervision-tree')); assert.equal(links.includes('/styles/sty-09'), false);
  assert.deepEqual(extractExternalLinks({body: article.body}).sort(), remote.map(({canonical_locator}) => canonical_locator).sort());
  for (const path of RECIPROCALS) {
    const reciprocal = documents.find(({file}) => file === path); assert.ok(reciprocal); assert.ok(extractInternalLinks(reciprocal).includes(ROUTE), `${path} visible reciprocal`);
    if (!path.startsWith('content/cases/')) assert.ok(parseFrontMatter(reciprocal.source).adjacent_topics.includes(TOPIC_ID), `${path} metadata reciprocal`);
  }
  for (const content of documents) assert.equal(extractInternalLinks(content).includes('/styles/sty-11'), false, `${content.file} STY-11 non-actionable`);
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8')); assert.deepEqual({completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}, EXPECTED_CURRENT_PROJECTION);
  const manifest = JSON.parse(readFileSync('src/generated/topic-manifest.json', 'utf8'));
  for (const [id, published, topicStatus] of [[TOPIC_ID, true, 'complete'], [NEXT_TOPIC, true, 'complete'], ['STY-10', true, 'complete'], ['STY-11', false, 'pending']]) {
    const topic = manifest.topics.find((entry) => entry.id === id); assert.equal(topic?.published, published); assert.equal(topic?.status.value, topicStatus);
  }
  const changedLedger = (transform) => { const candidate = structuredClone(ledger); transform(candidate); return candidate; };
  const source = (candidate, id = SOURCE_IDS[0]) => candidate.sources.find((entry) => entry.id === id);
  const citation = (candidate, id = SOURCE_IDS[0]) => candidate.documents[ARTICLE].citations.find((entry) => entry.source_id === id);
  for (const id of SOURCE_IDS.slice(0, -1)) for (const [label, field, value] of [
    ['canonical', 'canonical_locator', 'https://example.invalid/actor'],
    ['transport', 'transport_locator', 'https://example.invalid/transport'],
    ['version', 'version', 'floating version'],
    ['license', 'license', 'LicenseRef-Fabricated'],
    ['license scope', 'license_scope', 'reusable without restriction'],
    ['license evidence URL', 'license_evidence_url', 'https://example.invalid/license'],
    ['license evidence note', 'license_evidence_note', 'changed'],
    ['copyright policy', 'copyright_policy', 'adapted-text'],
    ['usage boundary', 'usage_boundary', 'universal guarantee'],
  ]) assert.throws(() => assertRemoteSourceContracts(changedLedger((candidate) => { source(candidate, id)[field] = value; }), inventory), assert.AssertionError, `${id} ${label} mutation rejected`);
  for (const [label, transform] of [
    ['allowed roles', (candidate) => { source(candidate).allowed_evidence_roles = ['definition']; }],
    ['citation roles', (candidate) => { citation(candidate).roles = ['comparison']; }],
    ['primary', (candidate) => { citation(candidate).manifest_primary = false; citation(candidate, SOURCE_IDS[1]).manifest_primary = true; }],
  ]) assert.throws(() => assertRemoteSourceContracts(changedLedger(transform), inventory), assert.AssertionError, `${label} mutation rejected`);
  const inventoryDrift = inventory.replace(REMOTE_SOURCE_CONTRACTS[SOURCE_IDS[0]].canonical_locator, 'https://example.invalid/inventory'); assert.notEqual(inventoryDrift, inventory);
  assert.throws(() => assertRemoteSourceContracts(ledger, inventoryDrift), assert.AssertionError, 'inventory drift rejected');
});

test('STY-08 Draw.io/SVG locks Actor ownership, route parity, effective styles, and physical geometry', () => {
  const drawio = file(DRAWIO); const svg = file(SVG); assert.ok(drawio, `${DRAWIO} must exist after implementation`); assert.ok(svg, `${SVG} must exist after implementation`); const result = assertDiagram(drawio, svg);
  if (process.env.STY08_GEOMETRY_REPORT === '1') console.log(`STY08_GEOMETRY_METRICS ${JSON.stringify({typography: result.typography, physical: result.physical})}`);
  const parsed = parseDrawio(drawio); const first = parsed.edges.find(({attributes}) => attributes.get('id') === CONNECTOR_INVENTORY[0][0]); assert.ok(first);
  const cases = [
    ['detached terminal', drawio.replace(`source="${first.attributes.get('source')}"`, ''), svg],
    ['removed waypoint', drawio.replace(/<Array as="points">[\s\S]*?<\/Array>/u, '<Array as="points"></Array>'), svg],
    ['fallback point', drawio.replace(/(<mxCell\b[^>]*\bedge="1"[^>]*>\s*)<mxGeometry/u, '$1<mxPoint as="sourcePoint" x="0" y="0"/><mxGeometry'), svg],
    ['retargeted label', drawio, svg.replace(/data-edge-id="([^"]+)"/u, 'data-edge-id="moved-label"')],
    ['changed bounds', drawio, svg.replace(/(<g\b[^>]*data-node-id="[^"]+"[^>]*data-node-bounds=")[^"]+/u, '$10 0 1 1')],
    ['header padding', drawio, svg.replace(/(<text\b[^>]*data-header-for="[^"]+"[^>]*\by=")[^"]+/u, '$10')],
    ['legend collision', drawio, svg.replace(/(<text\b[^>]*data-legend-for="[^"]+"[^>]*\bx=")[^"]+/u, '$10')],
    ['oversized marker', drawio, svg.replace(/markerWidth="[^"]+"/u, 'markerWidth="999"')],
    ['selector specificity', drawio, svg.replace(/\.local-message\s*\{/u, '#selector-drift.local-message {')],
    ['transparent canvas', drawio, svg.replace(/(<(?:rect|path)\b[^>]*\bid="(?:canvas|background)"[^>]*\bfill=")[^"]+/u, '$1transparent')],
    ['removed role', drawio, svg.replace(/data-role="local-message"/u, 'data-role="removed"')],
    ['extra editable text', drawio.replace('</root>', '<mxCell id="label-extra-title-1" value="伪造文字" vertex="1" parent="1" dataRole="label-title" style="shape=rectangle;rounded=0;fontSize=48;fontFamily=Arial;fontColor=#0F172A;fontStyle=1;fillColor=none;strokeColor=none;"><mxGeometry x="0" y="0" width="192" height="62.4" as="geometry"/></mxCell></root>'), svg],
    ['later mask', drawio, svg.replace('</svg>', '<rect x="0" y="0" width="99999" height="99999" fill="#000000" opacity="0.5"/></svg>')],
    ['detached authority path', drawio.replace('target="inventory-authority"', 'target="runtime-node-a"'), svg],
    ['recovery external effect', drawio.replace('id="reconcile-payment"', 'id="reconcile-payment-unsafe"'), svg],
  ];
  for (const [label, changedDrawio, changedSvg] of cases) {
    assert.ok(changedDrawio !== drawio || changedSvg !== svg, `${label} mutation applies`); assert.throws(() => assertDiagram(changedDrawio, changedSvg), assert.AssertionError, label);
  }
  const portMutation = drawio.replace(/(<mxCell\b[^>]*\bid="submit-order-123"[^>]*\bexitX=)(0(?:\.\d+)?|1(?:\.0+)?)(;)/u, (_, before, current, after) => `${before}${current === '0.5' ? '1' : '0.5'}${after}`);
  assert.notEqual(portMutation, drawio); assert.throws(() => assertDiagram(portMutation, svg), assert.AssertionError, 'changed port rejected');
  for (const [label, changed] of [
    ['self-reported panel geometry', drawio.replace('id="actor-runtime-boundary"', 'id="actor-runtime-boundary" dataPanelBounds="60 1320 2280 2580"')],
    ['self-reported shape', drawio.replace('id="shared-order-state"', 'id="shared-order-state" dataShape="cylinder"')],
    ['self-reported title font', drawio.replace('id="order-123-mailbox"', 'id="order-123-mailbox" dataTitleFont="48"')],
    ['removed effective shape', drawio.replace('shape=rectangle;rounded=0;', '')],
    ['removed hidden primary text style', drawio.replace('textOpacity=0;', '')],
    ['changed hidden primary text to visible', drawio.replace('textOpacity=0;', 'textOpacity=100;')],
    ['changed effective visible title font', drawio.replace('id="label-order-123-mailbox-title-1" value="邮箱" vertex="1" parent="1" dataRole="label-title" style="shape=rectangle;rounded=0;fontSize=48;', 'id="label-order-123-mailbox-title-1" value="邮箱" vertex="1" parent="1" dataRole="label-title" style="shape=rectangle;rounded=0;fontSize=47;')],
  ]) { assert.notEqual(changed, drawio, `${label} mutation applies`); assert.throws(() => assertDiagram(changed, svg), assert.AssertionError, `${label} rejected`); }
  const panelScale = 800 / 2400;
  const missingAllowlist = PANEL_TERMINAL_CROSSINGS.filter(([edgeId, panelId]) => edgeId !== 'submit-order-123' || panelId !== 'order-123-actor');
  assert.throws(() => assertPhysicalGeometry(svg, panelScale, true, true, missingAllowlist), assert.AssertionError, 'missing exact terminal panel allowlist rejected');
  const wrongAllowlist = PANEL_TERMINAL_CROSSINGS.map((entry) => [...entry]); wrongAllowlist[0][1] = 'legend-band';
  assert.throws(() => assertPhysicalGeometry(svg, panelScale, true, true, wrongAllowlist), assert.AssertionError, 'wrong exact terminal panel allowlist rejected');
  const shiftedDrawio = drawio.replace('<mxPoint x="150" y="1800"/><mxPoint x="460" y="1800"/>', '<mxPoint x="500" y="3800"/><mxPoint x="500" y="1800"/><mxPoint x="460" y="1800"/>');
  const shiftedSvg = svg.replace('M 150 3800 V 1800 H 460 V 2100', 'M 150 3800 H 500 V 1800 H 460 V 2100');
  assert.notEqual(shiftedDrawio, drawio, 'nonterminal panel route shift Draw.io mutation applies'); assert.notEqual(shiftedSvg, svg, 'nonterminal panel route shift SVG mutation applies'); assert.throws(() => assertDiagram(shiftedDrawio, shiftedSvg), assert.AssertionError, 'nonterminal panel route shift rejected');
  const wrongDrawio = drawio.replace(/(<mxCell\b[^>]*\bid="reconcile-payment"[^>]*\btarget=")payment-authority/u, '$1notification-authority');
  const wrongSvg = svg.replace(/(<path\b[^>]*data-edge-id="reconcile-payment"[^>]*\bdata-target=")payment-authority/u, '$1notification-authority');
  assert.notEqual(wrongDrawio, drawio); assert.notEqual(wrongSvg, svg); assert.throws(() => assertDiagram(wrongDrawio, wrongSvg), assert.AssertionError, 'self-consistent recovery misroute rejected');
});
