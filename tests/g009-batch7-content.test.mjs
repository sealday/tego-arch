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
    adjacent_topics: ['STY-04', 'STY-05', 'STY-07', 'STY-08', 'STY-09', 'STY-11', 'PR-11', 'MOD-08'],
  related_cases: ['/cases/apache-kafka-consumer-groups'],
  related_questions: [],
};
const EXACT_METADATA = {
  title: '事件驱动架构：先分清事件携带什么，再决定状态放在哪里',
  slug: ROUTE,
  content_type: 'style',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-12',
  source_cutoff: '2026-08-12',
  confidence: 'high',
  domains: ['software-architecture', 'distributed-systems', 'data-architecture'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['scalability', 'availability', 'evolvability', 'recoverability', 'operability'],
  tags: ['架构风格', '事件驱动', '事件通知', '状态转移', '事件携带状态', '事件溯源'],
  summary: '以同一订单案例并排区分事件通知、状态转移、事件携带状态和事件溯源，比较载荷、回查、权威状态、重建与恢复责任。',
  topic_id: TOPIC_ID,
  priority: 'P0',
  ...RELATION_METADATA,
};
const METADATA_YAML_TOKENS = new Map([
  ['title', 'title: 事件驱动架构：先分清事件携带什么，再决定状态放在哪里\n'],
  ['slug', 'slug: /styles/sty-06\n'], ['content_type', 'content_type: style\n'],
  ['status', 'status: reviewed\n'], ['difficulty', 'difficulty: advanced\n'],
  ['analyzed_at', 'analyzed_at: 2026-08-12\n'], ['source_cutoff', 'source_cutoff: 2026-08-12\n'],
  ['confidence', 'confidence: high\n'],
  ['domains', 'domains:\n  - software-architecture\n  - distributed-systems\n  - data-architecture\n'],
  ['agent_patterns', 'agent_patterns: []\n'], ['protocols', 'protocols: []\n'],
  ['quality_attributes', 'quality_attributes:\n  - scalability\n  - availability\n  - evolvability\n  - recoverability\n  - operability\n'],
  ['tags', 'tags:\n  - 架构风格\n  - 事件驱动\n  - 事件通知\n  - 状态转移\n  - 事件携带状态\n  - 事件溯源\n'],
  ['summary', 'summary: 以同一订单案例并排区分事件通知、状态转移、事件携带状态和事件溯源，比较载荷、回查、权威状态、重建与恢复责任。\n'],
  ['topic_id', 'topic_id: STY-06\n'], ['priority', 'priority: P0\n'],
  ['depends_on', 'depends_on:\n  - STY-00\n  - STY-05\n'],
  ['adjacent_topics', 'adjacent_topics:\n  - STY-04\n  - STY-05\n  - STY-07\n  - STY-08\n  - STY-09\n  - STY-11\n  - PR-11\n  - MOD-08\n'],
  ['related_cases', 'related_cases:\n  - /cases/apache-kafka-consumer-groups\n'],
  ['related_questions', 'related_questions: []\n'],
]);
const REQUIRED_WRAPPERS = [
  {aria: '订单事件的四种模式并排比较图，可横向滚动', className: 'architecture-diagram-scroll'},
  {aria: '事件驱动故障检测、自动响应、停止条件与人工责任表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
  {aria: '订单事件四种模式决策矩阵，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
];
const MODE_ANSWER_PATTERNS = new Map([
  ['事件通知', [/\u6700\u5c0f\u8f7d\u8377/u, /\u56de\u67e5\u8ba2\u5355\u670d\u52a1/u, /\u8ba2\u5355\u670d\u52a1.{0,16}\u6743\u5a01\u72b6\u6001/u, /\u4e0d\u53c2\u4e0e.{0,16}\u91cd\u5efa/u, /\u6709\u754c\u91cd\u8bd5.{0,32}\u964d\u7ea7.{0,40}\u4eba\u5de5\u5904\u7f6e/u]],
  ['状态转移', [/\u524d\u540e\u72b6\u6001.{0,16}\u805a\u5408\u7248\u672c/u, /\u7248\u672c\u7f3a\u53e3.{0,16}\u8865\u53d6/u, /\u8ba2\u5355\u670d\u52a1.{0,16}\u6743\u5a01/u, /\u4e0d.{0,12}\u6743\u5a01\u5386\u53f2/u, /\u975e\u6cd5\u8fc1\u79fb.{0,96}\u4e8b\u4ef6\u5408\u540c\u8d1f\u8d23\u4eba/u]],
  ['事件携带状态', [/\u7248\u672c\u5316\u8ba2\u5355\u72b6\u6001.{0,16}\u6240\u9700\u5b57\u6bb5/u, /\u6b63\u5e38\u8def\u5f84\u4e0d\u56de\u67e5/u, /\u8ba2\u5355\u670d\u52a1.{0,16}\u6743\u5a01\u5199\u6a21\u578b/u, /\u91cd\u5efa\u6d88\u8d39\u8005\u526f\u672c.{0,16}\u4e0d.{0,16}\u6743\u5a01/u, /\u53bb\u91cd\u66f4\u65b0.{0,24}\u4e8b\u4ef6\u5408\u540c\u8d1f\u8d23\u4eba/u]],
  ['事件溯源', [/\u6309\u805a\u5408\u6709\u5e8f.{0,16}\u9886\u57df\u4e8b\u4ef6/u, /\u4e8b\u4ef6\u5b58\u50a8.{0,16}\u6062\u590d/u, /\u4e8b\u4ef6\u5b58\u50a8\u662f\u6743\u5a01/u, /\u56de\u653e\u91cd\u5efa\u805a\u5408\u4e0e\u6295\u5f71/u, /\u547d\u4ee4\u5904\u7406\u5668.{0,16}\u4e50\u89c2\u5e76\u53d1.{0,24}\u6295\u5f71\u5904\u7406\u5668/u]],
]);
const TRANSITION_FAILURE_CONTRACTS = new Map([
  ['illegal transition rejection', /\u975e\u6cd5\u8fc1\u79fb.{0,8}\u62d2\u7edd/u],
  ['same-version idempotent ignore', /\u540c\u7248\u672c\u91cd\u590d.{0,8}\u5e42\u7b49\u5ffd\u7565/u],
  ['old-version rejection', /\u65e7\u7248\u672c.{0,8}(?:\u62d2\u7edd|\u4e22\u5f03)/u],
  ['version-gap recovery', /\u7248\u672c\u7f3a\u53e3.{0,8}(?:\u6682\u5b58|\u7f13\u51b2).{0,8}\u8865\u53d6/u],
]);
const RELIABILITY_TABLE_ROWS = new Map([
  ['\u4e8b\u4ef6\u901a\u77e5\u56de\u67e5\u5931\u8d25', [
    /\u56de\u67e5.{0,12}(?:\u8d85\u65f6|\u4e0d\u53ef\u7528)/u, /\u6709\u754c\u91cd\u8bd5.{0,12}\u964d\u7ea7/u,
    /\u8865\u507f.{0,12}\u4ecd.{0,8}(?:\u5931\u8d25|\u4e0d\u53ef\u7528)/u, /\u670d\u52a1\u6240\u6709\u8005/u,
  ]],
  ['\u91cd\u590d\u6295\u9012', [/\u4e8b\u4ef6\u6807\u8bc6.{0,8}\u5df2\u5904\u7406/u, /\u8fd4\u56de\u5df2\u6709\u7ed3\u679c/u, /\u53bb\u91cd\u8bb0\u5f55\u51b2\u7a81/u, /\u6d88\u8d39\u8005\u6240\u6709\u8005/u]],
  ['\u4e71\u5e8f\u6216\u7248\u672c\u7f3a\u53e3', [/\u805a\u5408\u7248\u672c\u4e0d\u8fde\u7eed/u, /\u6682\u5b58.{0,8}\u8865\u53d6.{0,8}\u62d2\u7edd\u65e7\u7248/u, /\u7f3a\u53e3\u8d85\u8fc7\u4fdd\u7559\u7a97\u53e3/u, /\u6d88\u8d39\u8005\u6240\u6709\u8005/u]],
  ['\u4e8b\u4ef6\u7ed3\u6784\u4e0d\u517c\u5bb9', [/\u672a\u8bc6\u522b\u4e8b\u4ef6\u7ed3\u6784\u7248\u672c/u, /\u517c\u5bb9\u8bfb\u53d6.{0,8}\u9694\u79bb/u, /\u65e0\u5b89\u5168\u5347\u7ea7\u8def\u5f84/u, /\u4e8b\u4ef6\u5408\u540c\u8d1f\u8d23\u4eba/u]],
  ['\u6295\u5f71\u79ef\u538b\u6216\u5ef6\u8fdf', [/\u79ef\u538b.{0,12}\u5904\u7406\u5ef6\u8fdf.{0,12}\u5931\u8d25\u7387.{0,12}\u6295\u5f71\u6c34\u4f4d/u, /\u6269\u5bb9.{0,12}\u6682\u505c\u975e\u5173\u952e\u91cd\u5efa/u, /\u6c34\u4f4d\u6301\u7eed\u4e0d\u524d\u8fdb/u, /\u6295\u5f71\u5904\u7406\u5668/u]],
  ['\u6bd2\u4e8b\u4ef6\u4e0e\u6b7b\u4fe1\u961f\u5217', [/\u91cd\u8bd5\u4e0a\u9650.{0,8}\u6b7b\u4fe1\u544a\u8b66/u, /\u9694\u79bb.{0,8}\u4fee\u590d.{0,8}\u53d7\u63a7\u91cd\u653e/u, /\u65e0\u6cd5\u8bc1\u660e\u5b89\u5168.{0,8}\u4eba\u5de5\u7ec8\u6b62/u, /\u670d\u52a1\u6240\u6709\u8005.{0,12}\u5904\u7f6e\u65f6\u9650\u56db\u5c0f\u65f6/u]],
]);
const RECIPROCAL_FILES = [
  'styles/sty-04-modular-monolith.mdx',
  'styles/sty-05-microservices.mdx',
  'principles/pr-11-cqs-cqrs-read-write-separation.mdx',
  'modeling/mod-08-state-machine-modeling.mdx',
];
const RELIABILITY_PATTERNS = [
  /至少一次|at-least-once/iu,
  /事件\s*(?:ID|Id|id|标识)/u,
  /聚合(?:键|标识)|业务键/u,
  /事件结构（schema）版本/iu,
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
  /失败率/u,
];
const OWNERSHIP_CONTRACTS = new Map([
  ['poison-isolation', /毒(?:消息|事件).{0,20}隔离/u],
  ['controlled-replay', /受控重放/u],
  ['manual-terminal', /人工终止/u],
  ['backlog', /积压/u],
  ['lag/watermark', /(?:lag|投影水位)/iu],
  ['at-least-once', /(?:至少一次|at-least-once)/iu],
  ['idempotency', /幂等/u],
  ['ordering', /(?:顺序|乱序)/u],
  ['schema-evolution', /事件结构（schema）演进/iu],
]);
const AFFIRMATIVE_OWNER_PATTERN = /(?:由|交由|归属|明确为).{0,16}(?:服务所有者|消费者|生产者|平台团队|运维团队|投影处理器|事件合同负责人|值班人员).{0,12}(?:负责|承担|处置|维护)|(?:服务所有者|消费者|生产者|平台团队|运维团队|投影处理器|事件合同负责人|值班人员).{0,12}(?:负责|承担|处置|维护)/u;
const UNRESOLVED_OWNER_PATTERN = /不负责|没有所有者|无人负责|所有者待定|责任待定|待定|尚未明确|未指定/u;
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
const RESPONSIBILITY_PATTERNS = new Map([
  ['command', /命令.{0,24}(?:意图|请求|要求).{0,24}(?:处理器|接收方|执行)/u],
  ['domain-event', /领域事件.{0,24}(?:聚合|领域).{0,24}(?:已经发生|事实|状态变化)/u],
  ['integration-event', /集成事件.{0,28}(?:边界外|外部消费者|跨边界|公开合同)/u],
  ['broker', /(?:事件|消息)代理.{0,24}(?:传递|路由|投递).{0,24}(?:不拥有|不是权威|不决定).{0,16}(?:业务状态|业务语义)|(?:事件|消息)代理.{0,24}(?:不拥有|不是权威|不决定).{0,16}(?:业务状态|业务语义)/u],
  ['outbox', /(?:Outbox|事务性发件箱).{0,24}(?:本地事务|同一事务).{0,24}(?:待发布|可靠发布|消息)|(?:本地事务|同一事务).{0,24}(?:Outbox|事务性发件箱).{0,24}(?:待发布|可靠发布|消息)/iu],
  ['event-store', /事件存储.{0,24}(?:追加|有序事件流).{0,24}(?:权威|事实记录)|(?:权威|事实记录).{0,24}(?:追加|有序事件流).{0,24}事件存储/u],
  ['authority', /权威(?:状态|写模型).{0,24}(?:唯一写入|业务决定|源服务|事件存储)|(?:唯一写入|业务决定|源服务|事件存储).{0,24}权威(?:状态|写模型)/u],
  ['local-copy', /本地副本.{0,24}(?:派生|只读|消费者拥有).{0,24}(?:不取得|不是|不能成为).{0,16}(?:权威|写入权)|本地副本.{0,24}(?:不取得|不是|不能成为).{0,16}(?:权威|写入权)/u],
  ['projection', /投影.{0,24}(?:事件|权威记录).{0,24}(?:派生|重建).{0,24}(?:读取|查询)|投影.{0,24}(?:读取模型|查询模型).{0,24}(?:派生|重建)/u],
  ['ordered-authority', /按聚合有序.{0,24}(?:事件流|领域事件).{0,24}(?:权威写入记录|权威事实|权威状态)|(?:权威写入记录|权威事实|权威状态).{0,24}按聚合有序.{0,24}(?:事件流|领域事件)/u],
]);
const TEACHING_FRAMEWORK_PATTERN = /(?:四种模式|四类).{0,24}(?:教学比较框架|教学框架)/u;
const NON_UNIQUE_TAXONOMY_PATTERN = /(?:四种模式|四类|教学比较框架|教学框架).{0,32}(?:并非|不是|不宣称为).{0,12}唯一|(?:并非|不是|不宣称为).{0,12}唯一.{0,32}(?:四种模式|四类|教学比较框架|教学框架)/u;
const NON_EXHAUSTIVE_TAXONOMY_PATTERN = /(?:四种模式|四类|教学比较框架|教学框架).{0,32}(?:并非|不是|不宣称为).{0,12}穷尽|(?:并非|不是|不宣称为).{0,12}穷尽.{0,32}(?:四种模式|四类|教学比较框架|教学框架)/u;
const NON_LADDER_PATTERN = /(?:四种模式|四类|教学比较框架|教学框架).{0,32}(?:不构成|不是|并非).{0,16}(?:成熟度阶梯|逐级升级|渐进升级)|(?:不构成|不是|并非).{0,16}(?:成熟度阶梯|逐级升级|渐进升级).{0,32}(?:四种模式|四类|教学比较框架|教学框架)/u;
const NON_PROOF_PATTERNS = [
  /(?:完整载荷|完整数据|全量数据).{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}(?:完整载荷|完整数据|全量数据).{0,8}(?:证明|决定)/u,
  /(?:事件|消息)代理.{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}(?:事件|消息)代理.{0,8}(?:证明|决定)/u,
  /Outbox.{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}Outbox.{0,8}(?:证明|决定)/iu,
  /CQRS.{0,24}(?:不要求|不等于|不能证明|并非必须).{0,16}事件溯源|事件溯源.{0,24}(?:不是|并非).{0,12}CQRS.{0,8}(?:必然|要求)/iu,
  /异步.{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}异步.{0,8}(?:证明|决定)/u,
  /可重放(?:日志|流).{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}可重放(?:日志|流).{0,8}(?:证明|决定)/u,
];
const REPLAY_SAFETY_PATTERNS = new Map([
  ['payment/charge', /回放.{0,40}(?:不得|不能|禁止|不会).{0,24}(?:再次|重新).{0,12}(?:扣款|支付)|(?:扣款|支付).{0,40}(?:不得|不能|禁止|不会).{0,16}(?:回放|再次执行)/u],
  ['notification/SMS', /回放.{0,40}(?:不得|不能|禁止|不会).{0,24}(?:再次|重新).{0,12}(?:发短信|发送通知|通知)|(?:发短信|发送通知|通知).{0,40}(?:不得|不能|禁止|不会).{0,16}(?:回放|再次执行)/u],
  ['irreversible external effects', /回放.{0,40}(?:不得|不能|禁止|不会).{0,24}(?:再次|重新).{0,12}(?:不可逆外部副作用|不可逆外部系统|外部副作用)|(?:不可逆外部副作用|不可逆外部系统|外部副作用).{0,40}(?:不得|不能|禁止|不会).{0,16}(?:回放|再次执行)/u],
]);
const MODE_BOUNDARY_PATTERNS = [
  /状态转移.{0,32}(?:不等于|不是|不能替代|不意味着).{0,20}事件携带状态|事件携带状态.{0,32}(?:不等于|不是|不能替代).{0,20}状态转移/u,
  /状态转移.{0,40}(?:from|to|前后状态|合法迁移|状态机).{0,32}(?:不携带|不要求|并非).{0,20}(?:完整快照|完整状态)|(?:完整快照|完整状态).{0,32}(?:不是|不等于).{0,20}状态转移/iu,
  /事件携带状态.{0,40}(?:完整状态|所需字段|变化集).{0,32}(?:本地副本|正常路径不回查)/u,
];
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
  const modeHeadings = findMarkdownHeadings(comparison).filter(({level}) => level === 3).map(({text}) => text);
  assert.deepEqual(modeHeadings, MODES, 'exact four ordered mode H3 headings');
  for (let index = 0; index < MODES.length; index += 1) {
    const nextMode = MODES[index + 1];
    const start = comparison.search(new RegExp(`^### ${escapeRegExp(MODES[index])}\\s*$`, 'mu'));
    assert.ok(start >= 0, `${MODES[index]} subsection`);
    const rest = comparison.slice(start);
    const end = nextMode ? rest.search(new RegExp(`^### ${escapeRegExp(nextMode)}\\s*$`, 'mu')) : -1;
    if (nextMode) assert.ok(end > 0, `${nextMode} follows ${MODES[index]}`);
    const modeSource = end > 0 ? rest.slice(0, end) : rest;
    for (const participant of PARTICIPANTS) assert.match(modeSource, new RegExp(participant, 'u'), `${MODES[index]} ${participant}`);
    let previousQuestionIndex = -1;
    const answers = QUESTIONS.map((question, questionIndex) => {
      const match = modeSource.match(new RegExp(`(?:^|\\n)(?:[-*]\\s*)?(?:\\*\\*)?${escapeRegExp(question)}(?:\\*\\*)?\\s*[：:]\\s*([^\\n]+)`, 'u'));
      assert.ok(match, `${MODES[index]} structured answer for ${question}`);
      const questionPosition = modeSource.indexOf(match[0]);
      assert.ok(questionPosition > previousQuestionIndex, `${MODES[index]} ${question} fixed question order`);
      previousQuestionIndex = questionPosition;
      assert.ok(match[1].trim().length >= 4, `${MODES[index]} non-empty answer for ${question}`);
      assert.match(match[1], MODE_ANSWER_PATTERNS.get(MODES[index])[questionIndex],
        `${MODES[index]} mode-specific answer for ${question}`);
      return match[1].trim();
    });
    assert.equal(new Set(answers).size, QUESTIONS.length, `${MODES[index]} five distinct structured answers`);
  }
}

function assertExactMetadata(source) {
  assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact complete STY-06 frontmatter');
}

function exactWrapperTag({aria, className}) {
  return `<div className="${className}" role="region" aria-label="${aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`;
}

function assertRequiredWrappers(source) {
  for (const wrapper of REQUIRED_WRAPPERS) {
    const expected = exactWrapperTag(wrapper);
    assert.equal(source.split(expected).length - 1, 1, `${wrapper.aria} exact focusable wrapper`);
  }
}

function transitionFailureAnswer(source) {
  const comparison = section(source, '\u8fb9\u754c\u4e0e\u63a7\u5236\u6d41', '\u6570\u636e\u6240\u6709\u6743\u4e0e\u4e00\u81f4\u6027');
  const transition = comparison.match(/^### \u72b6\u6001\u8f6c\u79fb\s*$([\s\S]*?)(?=^### \u4e8b\u4ef6\u643a\u5e26\u72b6\u6001\s*$)/mu)?.[1] ?? '';
  const answer = transition.match(/^- \*\*\u5931\u8d25\u8d23\u4efb\uff1a\*\*\s*([^\n]+)$/mu)?.[1] ?? '';
  assert.ok(answer, 'state-transition failure answer');
  for (const [label, pattern] of TRANSITION_FAILURE_CONTRACTS) assert.match(answer, pattern, label);
  return answer;
}

function reliabilityTableRows(source) {
  const reliability = section(source, '\u90e8\u7f72\u5355\u5143\u4e0e\u6545\u969c\u57df', '\u56e2\u961f\u62d3\u6251');
  const table = [...reliability.matchAll(/(?:^|\n)(\|[^\n]+\|\n\|(?:\s*:?-{3,}:?\s*\|)+\n(?:\|[^\n]+\|\n?)+)/gu)]
    .map(([, raw]) => raw.trim()).find((candidate) => candidate.startsWith('| \u6545\u969c\u7c7b |'));
  assert.ok(table, 'reliability table');
  const cells = table.split('\n').filter((_, index) => index !== 1)
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));
  assert.deepEqual(cells[0], ['\u6545\u969c\u7c7b', '\u68c0\u6d4b', '\u81ea\u52a8\u54cd\u5e94', '\u505c\u6b62\u6761\u4ef6', '\u4eba\u5de5\u6240\u6709\u8005'],
    'exact reliability columns');
  const rows = new Map(cells.slice(1).map((row) => [row[0], row]));
  assert.deepEqual([...rows.keys()], [...RELIABILITY_TABLE_ROWS.keys()], 'exact reliability rows and order');
  for (const [rowLabel, patterns] of RELIABILITY_TABLE_ROWS) {
    const row = rows.get(rowLabel);
    assert.equal(row.length, 5, `${rowLabel} five cells`);
    for (let index = 1; index < row.length; index += 1) {
      assert.ok(row[index].length > 0, `${rowLabel} nonempty cell ${index}`);
      assert.match(row[index], patterns[index - 1], `${rowLabel} row-specific cell ${index}`);
    }
  }
  return {rows, table};
}

const RELIABILITY_CONTRACTS = new Map([
  ['notification lookup bounded degradation', /\u4e8b\u4ef6\u901a\u77e5\u56de\u67e5\u5931\u8d25.{0,24}\u6709\u754c\u91cd\u8bd5.{0,24}\u964d\u7ea7.{0,24}\u4eba\u5de5\u5904\u7f6e/u],
  ['poison controlled lifecycle', /\u6bd2(?:\u6d88\u606f|\u4e8b\u4ef6).{0,24}\u9694\u79bb.{0,24}\u4fee\u590d.{0,24}\u53d7\u63a7\u91cd\u653e.{0,24}\u4eba\u5de5\u7ec8\u6b62/u],
  ['DLQ owner alert deadline', /(?:DLQ|\u6b7b\u4fe1\u961f\u5217).{0,24}(?:\u670d\u52a1\u6240\u6709\u8005|\u6240\u6709\u8005).{0,24}\u544a\u8b66.{0,24}\u5904\u7f6e\u65f6\u9650/iu],
  ['observability failure rate', /\u53ef\u89c2\u6d4b.{0,32}\u5931\u8d25\u7387/u],
  ['schema owner', /\u4e8b\u4ef6\u7ed3\u6784\uff08schema\uff09(?:\u7248\u672c|\u6f14\u8fdb).{0,24}\u4e8b\u4ef6\u5408\u540c\u8d1f\u8d23\u4eba.{0,12}(?:\u8d1f\u8d23|\u7ef4\u62a4)/iu],
]);

function assertReliabilityContract(source) {
  const visible = visibleTextOf(source);
  for (const [label, pattern] of RELIABILITY_CONTRACTS) assert.match(visible, pattern, label);
  assert.doesNotMatch(visible, /\u6a21\u5f0f\u7248\u672c|\u6a21\u5f0f\u8d1f\u8d23\u4eba/u, 'no ambiguous mode version/owner terminology');
  reliabilityTableRows(source);
}

function assertSemanticContract(source) {
  const visible = visibleTextOf(source);
  for (const [index, key] of MODE_KEYS.entries()) {
    for (const literal of REQUIRED[key]) assert.ok(visible.includes(literal), `${MODES[index]} literal ${literal}`);
  }
  for (const prohibited of PROHIBITED) assert.equal(visible.includes(prohibited), false, `prohibited claim: ${prohibited}`);
  for (const [term, pattern] of TERM_PATTERNS) assert.match(visible, pattern, `${term} separate definition`);
  assert.match(visible, TEACHING_FRAMEWORK_PATTERN, 'positive teaching framework');
  assert.match(visible, NON_UNIQUE_TAXONOMY_PATTERN, 'taxonomy is not unique');
  assert.match(visible, NON_EXHAUSTIVE_TAXONOMY_PATTERN, 'taxonomy is not exhaustive');
  assert.match(visible, NON_LADDER_PATTERN, 'taxonomy is not a maturity ladder or progressive upgrade');
  for (const [responsibility, pattern] of RESPONSIBILITY_PATTERNS) assert.match(visible, pattern, `${responsibility} positive responsibility`);
  for (const pattern of NON_PROOF_PATTERNS) assert.match(visible, pattern, `event-sourcing non-proof ${pattern}`);
  for (const pattern of MODE_BOUNDARY_PATTERNS) assert.match(visible, pattern, `mode boundary ${pattern}`);
  for (const [effect, pattern] of REPLAY_SAFETY_PATTERNS) assert.match(visible, pattern, `replay excludes ${effect}`);
  for (const conflation of CONFLATIONS) assert.doesNotMatch(visible, conflation, `critical conflation ${conflation}`);
}

function sentences(source) {
  return source.split(/[。！？!?；;\n]+/u).map((value) => value.trim()).filter(Boolean);
}

function assertAffirmativeOwnership(source) {
  const visible = visibleTextOf(source);
  for (const [concern, concernPattern] of OWNERSHIP_CONTRACTS) {
    const candidates = sentences(visible).filter((sentence) => concernPattern.test(sentence));
    assert.ok(candidates.length > 0, `${concern} ownership sentence`);
    assert.ok(candidates.some((sentence) => AFFIRMATIVE_OWNER_PATTERN.test(sentence) &&
      !UNRESOLVED_OWNER_PATTERN.test(sentence)), `${concern} affirmative named owner/component`);
  }
}

function replaceAffirmativeOwnerClause(source, concernPattern, replacement, concern) {
  const matchingSentences = sentences(source).filter((sentence) => concernPattern.test(sentence) &&
    AFFIRMATIVE_OWNER_PATTERN.test(sentence) && !UNRESOLVED_OWNER_PATTERN.test(sentence));
  assert.ok(matchingSentences.length > 0, `${concern} ownership mutation fixture`);
  return matchingSentences.reduce((mutatedSource, matchingSentence) => {
    const affirmativeClause = matchingSentence.match(AFFIRMATIVE_OWNER_PATTERN)?.[0];
    assert.ok(affirmativeClause, `${concern} affirmative owner clause`);
    const mutatedSentence = matchingSentence.replace(affirmativeClause, replacement);
    assert.notEqual(mutatedSentence, matchingSentence, `${concern} owner clause replacement applies`);
    return mutatedSource.replace(matchingSentence, mutatedSentence);
  }, source);
}

function replaceFirstMatching(source, pattern, replacement, label) {
  const mutated = source.replace(pattern, replacement);
  assert.notEqual(mutated, source, `${label} fixture phrase exists`);
  return mutated;
}

function replaceEveryMatching(source, pattern, replacement, label) {
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  const mutated = source.replace(globalPattern, replacement);
  assert.notEqual(mutated, source, `${label} fixture phrase exists`);
  return mutated;
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
  const labels = new Map([...source.matchAll(/<text\b[^>]*data-edge-id="([^"]+)"[^>]*>([\s\S]*?)<\/text>/gu)]
    .map(([, id, body]) => {
      const lines = [...body.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/gu)].map(([, line]) => decodeXmlText(line).trim());
      return [id, lines.length > 0 ? lines.join('｜') : decodeXmlText(body).trim()];
    }));
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

function svgElements(source) {
  const elements = [];
  const stack = [];
  for (const match of source.matchAll(/<\/?([A-Za-z][\w:-]*)\b([^>]*)>/gu)) {
    const [tag, name, rawAttributes] = match;
    if (tag.startsWith('</')) {
      if (stack.at(-1)?.name === name) stack.pop();
      continue;
    }
    const element = {attributes: xmlAttributes(rawAttributes), index: elements.length,
      name, parent: stack.at(-1) ?? null, tag};
    elements.push(element);
    if (!tag.endsWith('/>') && !['path', 'rect'].includes(name)) stack.push(element);
  }
  return elements;
}

function simpleSelectorMatches(element, selector) {
  const name = selector.match(/^[A-Za-z][\w-]*/u)?.[0];
  if (name && name !== element.name) return false;
  const id = selector.match(/#([\w-]+)/u)?.[1];
  if (id && element.attributes.get('id') !== id) return false;
  const classes = new Set((element.attributes.get('class') ?? '').split(/\s+/u).filter(Boolean));
  if (![...selector.matchAll(/\.([\w-]+)/gu)].every(([, className]) => classes.has(className))) return false;
  return [...selector.matchAll(/\[([\w:-]+)(?:="([^"]*)")?\]/gu)].every(([, key, value]) =>
    element.attributes.has(key) && (value === undefined || element.attributes.get(key) === value));
}

function selectorMatches(element, selector) {
  const parts = selector.trim().replace(/\s*>\s*/gu, ' > ').split(/\s+/u).filter(Boolean);
  let candidate = element;
  let cursor = parts.length - 1;
  if (!simpleSelectorMatches(candidate, parts[cursor])) return false;
  cursor -= 1;
  while (cursor >= 0) {
    if (parts[cursor] === '>') {
      const expected = parts[cursor - 1];
      candidate = candidate.parent;
      if (!candidate || !simpleSelectorMatches(candidate, expected)) return false;
      cursor -= 2;
    } else {
      const expected = parts[cursor];
      candidate = candidate.parent;
      while (candidate && !simpleSelectorMatches(candidate, expected)) candidate = candidate.parent;
      if (!candidate) return false;
      cursor -= 1;
    }
  }
  return true;
}

function selectorSpecificity(selector) {
  return [
    [...selector.matchAll(/#[\w-]+/gu)].length,
    [...selector.matchAll(/\.[\w-]+|\[[^\]]+\]/gu)].length,
    selector.split(/\s+|>/u).filter((part) => /^[A-Za-z][\w-]*/u.test(part)).length,
  ];
}

function compareSpecificity(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function styleRules(source) {
  const rules = [];
  let order = 0;
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      for (const selector of selectors.split(',').map((value) => value.trim())) {
        rules.push({declarations: cssDeclarations(declarations), order: order++, selector,
          specificity: selectorSpecificity(selector)});
      }
    }
  }
  return rules;
}

function ownSvgPresentationValue(source, element, property) {
  let winner = element.attributes.has(property)
    ? {precedence: 0, order: -2, specificity: [0, 0, 0], value: element.attributes.get(property)} : null;
  for (const rule of styleRules(source)) {
    const rawValue = rule.declarations.get(property);
    if (rawValue === undefined || !selectorMatches(element, rule.selector)) continue;
    const important = /\s*!important\s*$/iu.test(rawValue);
    const candidate = {...rule, precedence: important ? 2 : 0,
      value: rawValue.replace(/\s*!important\s*$/iu, '')};
    if (!winner || candidate.precedence > winner.precedence ||
      (candidate.precedence === winner.precedence && (compareSpecificity(candidate.specificity, winner.specificity) > 0 ||
      (compareSpecificity(candidate.specificity, winner.specificity) === 0 && candidate.order > winner.order)))) winner = candidate;
  }
  const inline = cssDeclarations(element.attributes.get('style') ?? '').get(property);
  if (inline !== undefined) {
    const candidate = {precedence: /\s*!important\s*$/iu.test(inline) ? 3 : 1,
      value: inline.replace(/\s*!important\s*$/iu, '')};
    if (!winner || candidate.precedence >= winner.precedence) winner = candidate;
  }
  return winner?.value;
}

function svgPresentationValue(source, element, property) {
  for (let candidate = element; candidate; candidate = candidate.parent) {
    const value = ownSvgPresentationValue(source, candidate, property);
    if (value !== undefined) return value;
  }
  return undefined;
}

function effectiveOpacity(source, element, paintKind) {
  let opacity = 1;
  for (let candidate = element; candidate; candidate = candidate.parent) {
    for (const property of ['opacity', `${paintKind}-opacity`]) {
      const value = ownSvgPresentationValue(source, candidate, property);
      if (value !== undefined) opacity *= Number(value);
    }
  }
  assert.ok(Number.isFinite(opacity) && opacity > 0 && opacity <= 1, `${element.name} visible effective opacity`);
  return opacity;
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

function blendHex(foreground, background, opacity) {
  const channels = (color) => color.match(/[\da-f]{2}/giu).map((value) => Number.parseInt(value, 16));
  const foregroundChannels = channels(foreground);
  const backgroundChannels = channels(background);
  return `#${foregroundChannels.map((value, index) => Math.round(
    value * opacity + backgroundChannels[index] * (1 - opacity),
  ).toString(16).padStart(2, '0')).join('')}`;
}

function compositePaints(paints, baseColor = '#FFFFFF') {
  return paints.reduce((background, {color, opacity}) => blendHex(color, background, opacity), baseColor);
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

function rectangleDistance(left, right) {
  const dx = Math.max(left.left - right.right, right.left - left.right, 0);
  const dy = Math.max(left.top - right.bottom, right.top - left.bottom, 0);
  return Math.hypot(dx, dy);
}

function visibleTextBounds(source, element, label) {
  const fontSize = Number.parseFloat(svgPresentationValue(source, element, 'font-size'));
  const x = Number(element.attributes.get('x'));
  const y = Number(element.attributes.get('y'));
  const width = [...label].reduce((sum, character) => sum + (/^[\u0000-\u00ff]$/u.test(character) ? 0.62 : 1), 0) * fontSize;
  const anchor = svgPresentationValue(source, element, 'text-anchor') ?? 'start';
  const left = anchor === 'middle' ? x - width / 2 : (anchor === 'end' ? x - width : x);
  return {bottom: y + fontSize * 0.3, left, right: left + width, top: y - fontSize};
}

function visibleTextBoxes(source, element, fallbackLabel) {
  const children = svgElements(source).filter(({name, parent}) => name === 'tspan' && parent?.tag === element.tag);
  if (children.length === 0) return [visibleTextBounds(source, element, fallbackLabel)];
  return children.map((child) => {
    const label = source.match(new RegExp(`${escapeRegExp(child.tag)}([^<]*)<\\/tspan>`, 'u'))?.[1] ?? '';
    return visibleTextBounds(source, child, decodeXmlText(label).trim());
  });
}

function rectangleStrokeDistance(bounds, rectangle, strokeWidth, inner = false) {
  const inset = strokeWidth / 2;
  const sides = inner ? [
    bounds.left - (rectangle.left + inset),
    (rectangle.right - inset) - bounds.right,
    bounds.top - (rectangle.top + inset),
    (rectangle.bottom - inset) - bounds.bottom,
  ] : [
    rectangleDistance(bounds, {left: rectangle.left - inset, right: rectangle.right + inset,
      top: rectangle.top - inset, bottom: rectangle.bottom + inset}),
  ];
  return Math.min(...sides);
}

function assertAllTextClearances(source) {
  const elements = svgElements(source);
  const edges = svgContract(source).edges;
  const semanticGeometry = edges.map((edge) => {
    const path = elements.find(({attributes, name}) => name === 'path' && attributes.get('data-edge-id') === edge.id);
    const label = elements.find(({attributes, name}) => name === 'text' && attributes.get('data-edge-id') === edge.id);
    return {edge, label, path, points: parsePathPoints(path.attributes.get('d'))};
  });
  const structuralGeometry = elements.filter(({attributes, name}) => name === 'path' &&
    attributes.has('data-structural-edge-id')).map((path) => ({
    edge: {id: path.attributes.get('data-structural-edge-id'), attributes: new Map([
      ['data-source', `${path.parent.attributes.get('data-mode')}-participants`],
      ['data-target', path.attributes.get('data-target')],
    ])},
    path,
    points: parsePathPoints(path.attributes.get('d')),
  }));
  const connectorGeometry = [...semanticGeometry, ...structuralGeometry];
  const participantLabels = elements.filter(({attributes, name, parent}) => name === 'text' &&
    attributes.has('data-participant-label') && parent?.attributes.has('data-mode')).map((label) => {
    const participant = label.attributes.get('data-participant-label');
    const mode = label.parent.attributes.get('data-mode');
    const connector = structuralGeometry.find(({edge}) => edge.id === `${mode}-${participant}-participant-link`);
    assert.ok(connector, `${mode}/${participant} clearance connector`);
    return {...connector, label, labelBounds: visibleTextBounds(source, label, label.text ??
      source.match(new RegExp(`${escapeRegExp(label.tag)}([^<]*)<\\/text>`, 'u'))?.[1] ?? '')};
  });
  const semanticLabels = semanticGeometry.flatMap((geometry) => visibleTextBoxes(source, geometry.label, geometry.edge.label)
    .map((labelBounds) => ({...geometry, labelBounds})));
  const labelGeometry = [...semanticLabels, ...participantLabels];
  const nodeEnvelopes = svgContract(source).nodes.filter(({id}) =>
    ![...COLUMN_IDS, ...ROW_IDS, 'canvas', 'legend-band'].includes(id) && !id.startsWith('legend-'))
    .map(({id}) => {
      const group = elements.find(({attributes, name}) => name === 'g' && attributes.get('data-node-id') === id);
      const shape = elements.find(({name, parent}) => ['rect', 'ellipse', 'polygon'].includes(name) && parent === group);
      return shape ? {id, rectangle: rectangleFromElement(shape), strokeWidth: Number(svgPresentationValue(source, shape, 'stroke-width') ?? 0)} : null;
    }).filter(Boolean);
  const boundaryEnvelopes = [...COLUMN_IDS, ...ROW_IDS].map((id) => {
    const group = elements.find(({attributes, name}) => name === 'g' && attributes.get('data-node-id') === id);
    const shape = elements.find(({name, parent}) => name === 'rect' && parent === group);
    return {id, rectangle: rectangleFromElement(shape), strokeWidth: Number(svgPresentationValue(source, shape, 'stroke-width'))};
  });
  const minima = {boundary: Infinity, marker: Infinity, node: Infinity, stroke: Infinity};
  const failures = [];
  for (const current of labelGeometry) {
    for (const connector of connectorGeometry) for (const segment of pathSegments(connector.points)) {
      const gap = segmentRectangleDistance(segment.left, segment.right, current.labelBounds);
      minima.stroke = Math.min(minima.stroke, gap);
      if (gap < 24) failures.push(`${current.edge.id}/stroke:${connector.edge.id}=${gap}`);
    }
    for (const connector of semanticGeometry) for (const point of markerGeometry(source, connector.path, connector.points)) {
      const gap = pointRectangleDistance(point, current.labelBounds);
      minima.marker = Math.min(minima.marker, gap);
      if (gap < 48) failures.push(`${current.edge.id}/marker:${connector.edge.id}=${gap}`);
    }
    for (const node of nodeEnvelopes.filter(({id}) => ![current.edge.attributes.get('data-source'),
      current.edge.attributes.get('data-target')].includes(id))) {
      const gap = rectangleStrokeDistance(current.labelBounds, node.rectangle, node.strokeWidth);
      minima.node = Math.min(minima.node, gap);
      if (gap < 36) failures.push(`${current.edge.id}/node:${node.id}=${gap}`);
    }
    for (const boundary of boundaryEnvelopes) {
      if (!(current.labelBounds.left >= boundary.rectangle.left && current.labelBounds.right <= boundary.rectangle.right &&
        current.labelBounds.top >= boundary.rectangle.top && current.labelBounds.bottom <= boundary.rectangle.bottom)) continue;
      const gap = rectangleStrokeDistance(current.labelBounds, boundary.rectangle, boundary.strokeWidth, true);
      minima.boundary = Math.min(minima.boundary, gap);
      if (gap < 36) failures.push(`${current.edge.id}/boundary:${boundary.id}=${gap}`);
    }
  }
  assert.deepEqual(failures, [], `all conservative edge-label clearances:\n${failures.join('\n')}`);
  return minima;
}

function assertLegendClearance(source) {
  const elements = svgElements(source);
  let minima = {captionKey: Infinity, foreignMarker: Infinity, markerCaption: Infinity};
  const entries = ['command', 'event-delivery', 'sync-lookup', 'replay'].map((kind) => {
    const key = elements.find(({attributes, name}) => name === 'path' && attributes.get('data-legend-key') === kind);
    const caption = elements.find(({attributes, name}) => name === 'text' && attributes.get('data-legend-for') === kind);
    const captionText = source.match(new RegExp(`<text\\b[^>]*data-legend-for="${kind}"[^>]*>([^<]*)<\\/text>`, 'u'))?.[1] ?? '';
    return {caption, captionBounds: visibleTextBounds(source, caption, captionText), key, kind,
      points: parsePathPoints(key.attributes.get('d'))};
  });
  for (const entry of entries) {
    const ownGap = Math.min(...pathSegments(entry.points)
      .map(({left, right}) => segmentRectangleDistance(left, right, entry.captionBounds)));
    minima.captionKey = Math.min(minima.captionKey, ownGap);
    assert.ok(ownGap >= 36, `${entry.kind} legend caption/key ${ownGap}`);
    const ownMarkerGap = Math.min(...markerGeometry(source, entry.key, entry.points)
      .map((point) => pointRectangleDistance(point, entry.captionBounds)));
    minima.markerCaption = Math.min(minima.markerCaption, ownMarkerGap);
    assert.ok(ownMarkerGap >= 48, `${entry.kind} legend marker/caption ${ownMarkerGap}`);
    for (const foreign of entries.filter(({kind}) => kind !== entry.kind)) {
      for (const point of markerGeometry(source, foreign.key, foreign.points)) {
        const gap = pointRectangleDistance(point, entry.captionBounds);
        minima.foreignMarker = Math.min(minima.foreignMarker, gap);
        assert.ok(gap >= 48, `${entry.kind} legend foreign marker ${foreign.kind} ${gap}`);
      }
    }
  }
  return minima;
}

function segmentRectangleDistance(left, right, rectangle) {
  const horizontal = left.y === right.y;
  const vertical = left.x === right.x;
  assert.ok(horizontal || vertical, 'orthogonal segment');
  if (horizontal) {
    const segmentLeft = Math.min(left.x, right.x);
    const segmentRight = Math.max(left.x, right.x);
    const dx = Math.max(rectangle.left - segmentRight, 0, segmentLeft - rectangle.right);
    const dy = Math.max(rectangle.top - left.y, 0, left.y - rectangle.bottom);
    return Math.hypot(dx, dy);
  }
  const segmentTop = Math.min(left.y, right.y);
  const segmentBottom = Math.max(left.y, right.y);
  const dx = Math.max(rectangle.left - left.x, 0, left.x - rectangle.right);
  const dy = Math.max(rectangle.top - segmentBottom, 0, segmentTop - rectangle.bottom);
  return Math.hypot(dx, dy);
}

function pathSegments(points) {
  return points.slice(1).map((point, index) => ({left: points[index], right: point}));
}

function canonicalSegment({left, right}) {
  return left.x === right.x
    ? `V:${left.x}:${Math.min(left.y, right.y)}:${Math.max(left.y, right.y)}`
    : `H:${left.y}:${Math.min(left.x, right.x)}:${Math.max(left.x, right.x)}`;
}

function collinearOverlapLength(left, right) {
  const leftVertical = left.left.x === left.right.x;
  const rightVertical = right.left.x === right.right.x;
  if (leftVertical !== rightVertical) return 0;
  if (leftVertical) {
    if (left.left.x !== right.left.x) return 0;
    return Math.max(0, Math.min(Math.max(left.left.y, left.right.y), Math.max(right.left.y, right.right.y)) -
      Math.max(Math.min(left.left.y, left.right.y), Math.min(right.left.y, right.right.y)));
  }
  if (left.left.y !== right.left.y) return 0;
  return Math.max(0, Math.min(Math.max(left.left.x, left.right.x), Math.max(right.left.x, right.right.x)) -
    Math.max(Math.min(left.left.x, left.right.x), Math.min(right.left.x, right.right.x)));
}

function rectangleFromElement(element) {
  const x = Number(element.attributes.get('x'));
  const y = Number(element.attributes.get('y'));
  const width = Number(element.attributes.get('width'));
  const height = Number(element.attributes.get('height'));
  assert.ok([x, y, width, height].every(Number.isFinite), 'finite rectangle geometry');
  return {bottom: y + height, left: x, right: x + width, top: y};
}

function segmentIntersectsRectangle({left, right}, rectangle) {
  if (left.x === right.x) return left.x >= rectangle.left && left.x <= rectangle.right &&
    Math.max(Math.min(left.y, right.y), rectangle.top) <= Math.min(Math.max(left.y, right.y), rectangle.bottom);
  return left.y >= rectangle.top && left.y <= rectangle.bottom &&
    Math.max(Math.min(left.x, right.x), rectangle.left) <= Math.min(Math.max(left.x, right.x), rectangle.right);
}

function assertNoConnectorOverdraw(source) {
  const elements = svgElements(source);
  const segments = [];
  const paths = elements.filter(({attributes, name}) => name === 'path' &&
    (attributes.has('data-edge-id') || attributes.has('data-structural-edge-id')));
  for (const path of paths) {
    const edge = {id: path.attributes.get('data-edge-id') ?? path.attributes.get('data-structural-edge-id')};
    segments.push(...pathSegments(parsePathPoints(path.attributes.get('d'))).map((segment) => ({...segment, edge: edge.id})));
    for (const rectangle of elements.filter(({index, name}) => name === 'rect' && index > path.index)) {
      const fill = svgPresentationValue(source, rectangle, 'fill');
      const opacity = fill && fill !== 'none' ? effectiveOpacity(source, rectangle, 'fill') : 0;
      assert.ok(opacity === 0 || !pathSegments(parsePathPoints(path.attributes.get('d')))
        .some((segment) => segmentIntersectsRectangle(segment, rectangleFromElement(rectangle))),
      `${edge.id} is not obscured by later-painted rectangle`);
    }
  }
  for (let left = 0; left < segments.length; left += 1) for (let right = left + 1; right < segments.length; right += 1) {
    if (segments[left].edge !== segments[right].edge) assert.equal(collinearOverlapLength(segments[left], segments[right]), 0,
      `no partially overlapping connector interval ${segments[left].edge}/${segments[right].edge}`);
  }
}

function drawioStyle(cell) {
  return new Map((cell.attributes.get('style') ?? '').split(';').filter(Boolean).map((declaration) => {
    const split = declaration.indexOf('=');
    return [declaration.slice(0, split), declaration.slice(split + 1)];
  }));
}

function drawioTerminalPortPoint(drawio, cell, terminalKind) {
  const style = drawioStyle(cell);
  const prefix = terminalKind === 'source' ? 'exit' : 'entry';
  const terminalId = cell.attributes.get(terminalKind);
  const terminal = drawioContract(drawio).nodes.find(({attributes}) => attributes.get('id') === terminalId);
  assert.ok(terminal, `${cell.attributes.get('id')} ${terminalKind} terminal`);
  assert.equal(style.get(`${prefix}Perimeter`), '1', `${cell.attributes.get('id')} ${prefix} perimeter`);
  assert.equal(style.get(`${prefix}Dx`), '0', `${cell.attributes.get('id')} ${prefix}Dx`);
  assert.equal(style.get(`${prefix}Dy`), '0', `${cell.attributes.get('id')} ${prefix}Dy`);
  const x = Number(style.get(`${prefix}X`));
  const y = Number(style.get(`${prefix}Y`));
  assert.ok(Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1,
    `${cell.attributes.get('id')} normalized ${prefix} port`);
  assert.ok(x === 0 || x === 1 || y === 0 || y === 1, `${cell.attributes.get('id')} ${prefix} port on perimeter`);
  return {
    x: Number(terminal.geometry.get('x')) + Number(terminal.geometry.get('width')) * x,
    y: Number(terminal.geometry.get('y')) + Number(terminal.geometry.get('height')) * y,
  };
}

function drawioEdgePoints(drawio, cell) {
  assert.doesNotMatch(cell.body, /<mxPoint\b[^>]*\bas="(?:sourcePoint|targetPoint)"/u,
    `${cell.attributes.get('id')} has no ignored terminal fallback points`);
  const array = cell.body.match(/<Array\b[^>]*\bas="points"[^>]*>([\s\S]*?)<\/Array>/u)?.[1] ?? '';
  const waypoints = [...array.matchAll(/<mxPoint\b([^>]*)\/>/gu)].map(([, raw]) => xmlAttributes(raw));
  const toPoint = (attributes, label) => {
    const point = {x: Number(attributes.get('x')), y: Number(attributes.get('y'))};
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `${cell.attributes.get('id')} ${label}`);
    return point;
  };
  return [drawioTerminalPortPoint(drawio, cell, 'source'),
    ...waypoints.map((point) => toPoint(point, 'waypoint')),
    drawioTerminalPortPoint(drawio, cell, 'target')];
}

function effectiveDrawioEdgeRole(cell) {
  const style = drawioStyle(cell);
  const arrow = style.get('endArrow');
  const filled = style.get('endFill') ?? '1';
  const dashed = style.get('dashed') === '1';
  const dash = dashed ? (style.get('dashPattern') ?? '') : '';
  if (arrow === 'diamond' && filled === '1' && dash === '5 15') return ['replay-edge', 'arrow-replay', dash];
  if (arrow === 'block' && filled === '0' && !dashed) return ['sync-lookup-edge', 'arrow-lookup', ''];
  if (arrow === 'block' && filled === '1' && dash === '22 14') return ['event-delivery-edge', 'arrow-event', dash];
  if (arrow === 'block' && filled === '1' && !dashed) return ['command-edge', 'arrow-command', ''];
  assert.fail(`${cell.attributes.get('id')} effective Draw.io marker/dash role`);
}

function assertNodeFillParity(drawio, svg) {
  const svgElementsByNode = new Map([...svg.matchAll(/<g\b[^>]*data-node-id="([^"]+)"[^>]*>([\s\S]*?)<\/g>/gu)]
    .map(([, id, body]) => [id, svgElements(`<svg>${body}</svg>`).find(({name}) => name === 'rect')]));
  for (const cell of drawioContract(drawio).nodes) {
    const id = cell.attributes.get('id');
    const rectangle = svgElementsByNode.get(id);
    if (!rectangle) continue;
    const expected = drawioStyle(cell).get('fillColor');
    if (expected && expected !== 'none') assert.equal(svgPresentationValue(svg, rectangle, 'fill'), expected,
      `${id} fill parity`);
  }
}

function nodeGroupBody(source, id) {
  return source.match(new RegExp(`<g\\b[^>]*data-node-id="${escapeRegExp(id)}"[^>]*>([\\s\\S]*?)<\\/g>`, 'u'))?.[1] ?? '';
}

function visibleGroupLabel(source, id) {
  return [...nodeGroupBody(source, id).matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map(([, label]) => decodeXmlText(label).trim()).filter(Boolean).join('｜');
}

function assertFullDrawioSvgParity(drawio, svg) {
  const elements = svgElements(svg);
  const svgNodes = new Map(svgContract(svg).nodes.map((node) => [node.id, node]));
  for (const cell of drawioContract(drawio).nodes) {
    const id = cell.attributes.get('id');
    const svgNode = svgNodes.get(id);
    assert.ok(svgNode, `${id} SVG parity node`);
    assert.deepEqual(geometry(drawio, id, 'drawio'), geometry(svg, id, 'svg'), `${id} exact bounds parity`);
    const group = elements.find(({attributes, name}) => name === 'g' && attributes.get('data-node-id') === id);
    const shape = elements.find(({name, parent}) => ['rect', 'polygon', 'ellipse'].includes(name) && parent === group);
    const text = elements.find(({name, parent}) => name === 'text' && parent === group);
    assert.ok(svgNode.attributes.has('data-role'), `${id} explicit SVG role`);
    assert.equal(svgNode.attributes.get('data-role'), cell.attributes.get('dataRole'), `${id} role parity`);
    assert.equal(visibleGroupLabel(svg, id), cell.label, `${id} label parity`);
    const drawioShape = drawioStyle(cell).get('shape') ?? ((cell.attributes.get('style') ?? '').startsWith('text;')
      ? 'text' : (drawioStyle(cell).get('rounded') === '0' ? 'rectangle' : 'rounded'));
    const svgShape = shape?.attributes.get('data-shape') ?? (shape?.name === 'rect'
      ? (Number(shape.attributes.get('rx') ?? 0) > 0 ? 'rounded' : 'rectangle') : (shape?.name ?? 'text'));
    assert.equal(svgShape, drawioShape, `${id} shape parity`);
    if (shape) {
      const expectedFill = drawioStyle(cell).get('fillColor');
      const expectedStroke = drawioStyle(cell).get('strokeColor');
      if (expectedFill) assert.equal(svgPresentationValue(svg, shape, 'fill'), expectedFill, `${id} fill parity`);
      if (expectedStroke) assert.equal(svgPresentationValue(svg, shape, 'stroke'), expectedStroke, `${id} stroke parity`);
      assert.equal(Number.parseFloat(svgPresentationValue(svg, shape, 'stroke-width')),
        Number(drawioStyle(cell).get('strokeWidth') ?? 1), `${id} stroke width parity`);
    }
    if (text) {
      assert.equal(svgPresentationValue(svg, text, 'fill'), drawioStyle(cell).get('fontColor'), `${id} font color parity`);
      assert.equal(Number.parseFloat(svgPresentationValue(svg, text, 'font-size')),
        Number(drawioStyle(cell).get('fontSize')), `${id} font size parity`);
      assert.equal(svgPresentationValue(svg, text, 'font-weight'), '700', `${id} font weight parity`);
      assert.equal(svgPresentationValue(svg, text, 'font-family')?.split(',')[0].trim(),
        drawioStyle(cell).get('fontFamily'), `${id} font family parity`);
    }
  }
  const svgEdges = new Map(svgContract(svg).edges.map((edge) => [edge.id, edge]));
  for (const cell of drawioContract(drawio).edges) {
    const id = cell.attributes.get('id');
    if (cell.attributes.get('dataRole') === 'participantLink') continue;
    const edge = svgEdges.get(id);
    assert.ok(edge, `${id} SVG parity edge`);
    const path = elements.find(({attributes, name}) => name === 'path' && attributes.get('data-edge-id') === id);
    const label = elements.find(({attributes, name}) => name === 'text' && attributes.get('data-edge-id') === id);
    const [expectedClass, expectedMarker, expectedDash] = effectiveDrawioEdgeRole(cell);
    assert.ok((path.attributes.get('class') ?? '').split(/\s+/u).includes(expectedClass), `${id} connector role parity`);
    assert.equal(svgPresentationValue(svg, path, 'marker-end'), `url(#${expectedMarker})`, `${id} marker role parity`);
    assert.equal(svgPresentationValue(svg, path, 'stroke-dasharray') ?? '', expectedDash, `${id} dash parity`);
    assert.equal(svgPresentationValue(svg, path, 'stroke'), drawioStyle(cell).get('strokeColor'), `${id} stroke parity`);
    assert.equal(Number.parseFloat(svgPresentationValue(svg, path, 'stroke-width')),
      Number(drawioStyle(cell).get('strokeWidth')), `${id} stroke width parity`);
    assert.equal(edge.label.replace(/｜/gu, ''), cell.label.replace(/｜/gu, ''), `${id} edge label parity`);
    assert.equal(svgPresentationValue(svg, label, 'fill'), drawioStyle(cell).get('fontColor'), `${id} label fill parity`);
    assert.equal(Number.parseFloat(svgPresentationValue(svg, label, 'font-size')),
      Number(drawioStyle(cell).get('fontSize')), `${id} edge font parity`);
    assert.equal(svgPresentationValue(svg, label, 'font-weight'), '700', `${id} edge font weight parity`);
    assert.equal(svgPresentationValue(svg, label, 'font-family')?.split(',')[0].trim(),
      drawioStyle(cell).get('fontFamily'), `${id} edge font family parity`);
    assert.equal(cell.attributes.has('dataRoute'), false, `${id} has no self-reported dataRoute`);
    assert.deepEqual(parsePathPoints(edge.attributes.get('d')), drawioEdgePoints(drawio, cell),
      `${id} effective route parity`);
  }
}

function pointOnRectangleBoundary(point, rectangle) {
  const onHorizontal = (point.y === rectangle.top || point.y === rectangle.bottom) &&
    point.x >= rectangle.left && point.x <= rectangle.right;
  const onVertical = (point.x === rectangle.left || point.x === rectangle.right) &&
    point.y >= rectangle.top && point.y <= rectangle.bottom;
  return onHorizontal || onVertical;
}

function assertParticipantConnectivity(drawio, source) {
  const modes = ['notification', 'transition', 'carried', 'event-sourcing'];
  const participantLabels = new Map([['order', '订单'], ['inventory', '库存'], ['payment', '支付'], ['notification', '通知']]);
  const coreTargets = new Map([
    ['notification', new Map([...participantLabels.keys()].map((participant) => [participant, 'notification-authority']))],
    ['transition', new Map([...participantLabels.keys()].map((participant) => [participant, 'order-transition']))],
    ['carried', new Map([...participantLabels.keys()].map((participant) => [participant, 'carried-authority']))],
    ['event-sourcing', new Map([
      ['order', 'command'], ['inventory', 'command-handler'], ['payment', 'aggregate'], ['notification', 'aggregate'],
    ])],
  ]);
  const requiredReachable = new Map([
    ['notification', 'notification-consumer'], ['transition', 'consumer-state-machine'],
    ['carried', 'consumer-local-copy'], ['event-sourcing', 'external-consumers'],
  ]);
  const elements = svgElements(source);
  const drawioEdges = new Map(drawioContract(drawio).edges.map((cell) => [cell.attributes.get('id'), cell]));
  const adjacency = new Map();
  for (const edge of svgContract(source).edges) {
    const sourceId = edge.attributes.get('data-source');
    if (!adjacency.has(sourceId)) adjacency.set(sourceId, new Set());
    adjacency.get(sourceId).add(edge.attributes.get('data-target'));
  }
  for (const mode of modes) for (const [participant, visibleLabel] of participantLabels) {
    const edgeId = `${mode}-${participant}-participant-link`;
    const path = elements.find(({attributes, name, parent}) => name === 'path' &&
      attributes.get('data-structural-edge-id') === edgeId && attributes.get('data-participant') === participant &&
      parent?.attributes.get('data-mode') === mode);
    assert.ok(path, `${mode} structural ${participant} edge`);
    const label = elements.find(({attributes, name, parent}) => name === 'text' && parent === path.parent &&
      attributes.get('data-participant-label') === participant);
    assert.ok(label, `${mode}/${participant} visible participant label`);
    const points = parsePathPoints(path.attributes.get('d'));
    const labelBounds = visibleTextBounds(source, label, visibleLabel);
    assert.ok(points[0].x >= labelBounds.left && points[0].x <= labelBounds.right &&
      points[0].y - labelBounds.bottom >= 24 && points[0].y - labelBounds.bottom <= 30,
    `${mode}/${participant} edge originates at participant label`);
    const targetId = path.attributes.get('data-target');
    assert.equal(targetId, coreTargets.get(mode).get(participant), `${mode}/${participant} targets mode core`);
    const targetGroup = elements.find(({attributes, name}) => name === 'g' && attributes.get('data-node-id') === targetId);
    const targetShape = elements.find(({name, parent}) => name === 'rect' && parent === targetGroup);
    assert.ok(pointOnRectangleBoundary(points.at(-1), rectangleFromElement(targetShape)),
      `${mode}/${participant} reaches mode core boundary`);
    const reachable = new Set([targetId]);
    for (const queue = [targetId]; queue.length > 0;) {
      const current = queue.shift();
      for (const next of adjacency.get(current) ?? []) if (!reachable.has(next)) {
        reachable.add(next); queue.push(next);
      }
    }
    assert.ok(reachable.has(requiredReachable.get(mode)),
      `${mode}/${participant} traverses core flow to ${requiredReachable.get(mode)}`);
    const drawioEdge = drawioEdges.get(edgeId);
    assert.ok(drawioEdge, `${edgeId} Draw.io structural edge`);
    assert.equal(drawioEdge.attributes.get('source'), `${mode}-${participant}-participant`, `${edgeId} Draw.io source`);
    assert.equal(drawioEdge.attributes.get('target'), targetId, `${edgeId} Draw.io target`);
    assert.deepEqual(drawioEdgePoints(drawio, drawioEdge), points, `${edgeId} Draw.io/SVG route`);
    const style = drawioStyle(drawioEdge);
    assert.equal(style.get('endArrow'), 'none', `${edgeId} effective marker`);
    assert.notEqual(style.get('dashed'), '1', `${edgeId} effective dash`);
    assert.equal(svgPresentationValue(source, path, 'marker-end'), undefined, `${edgeId} SVG marker`);
    assert.equal(svgPresentationValue(source, path, 'stroke-dasharray'), undefined, `${edgeId} SVG dash`);
    assert.equal(svgPresentationValue(source, path, 'stroke'), style.get('strokeColor'), `${edgeId} stroke parity`);
    assert.equal(Number(svgPresentationValue(source, path, 'stroke-width')), Number(style.get('strokeWidth')),
      `${edgeId} stroke-width parity`);
  }
}

function assertExpectedVersionAppend(drawio, source) {
  const drawioEdge = drawioContract(drawio).edges.find(({attributes}) => attributes.get('id') === 'es-append');
  const svgEdge = svgContract(source).edges.find(({id}) => id === 'es-append');
  assert.ok(drawioEdge && svgEdge, 'event-sourcing append edge exists in both assets');
  assert.match(drawioEdge.label, /expectedVersion/u, 'Draw.io append declares expectedVersion');
  assert.match(svgEdge.label, /expectedVersion/u, 'SVG append declares expectedVersion');
  const normalize = (label) => label.replace(/[｜\s]/gu, '');
  assert.equal(normalize(svgEdge.label), normalize(drawioEdge.label), 'expectedVersion append label parity');
}

function assertColumnHeaderClearance(source) {
  const elements = svgElements(source);
  for (const columnId of COLUMN_IDS) {
    const group = elements.find(({attributes, name}) => name === 'g' && attributes.get('data-node-id') === columnId);
    const rectangle = elements.find(({name, parent}) => name === 'rect' && parent === group);
    const label = elements.find(({attributes, name, parent}) => name === 'text' && parent === group &&
      (attributes.get('class') ?? '').split(/\s+/u).includes('column-label'));
    const bounds = labelBounds(label.tag, '', Number.parseFloat(svgPresentationValue(source, label, 'font-size')));
    const box = rectangleFromElement(rectangle);
    const halfStroke = Number(svgPresentationValue(source, rectangle, 'stroke-width')) / 2;
    assert.ok(bounds.top - (box.top + halfStroke) >= 36, `${columnId} header top inner-stroke clearance`);
    assert.ok((box.bottom - halfStroke) - bounds.bottom >= 36, `${columnId} header bottom inner-stroke clearance`);
  }
}

function assertCompleteComparison(source) {
  const participants = ['订单', '库存', '支付', '通知'];
  for (const column of COLUMN_IDS) {
    const prefix = column === 'carried-state-column' ? 'carried' : column.replace('-column', '');
    const participantNode = svgContract(source).nodes.find(({id}) => id === `${prefix}-participants`);
    assert.ok(participantNode, `${column} participant inventory`);
    const modeParticipants = [...source.matchAll(new RegExp(
      `<g\\b[^>]*data-mode="${prefix}"[^>]*>([\\s\\S]*?)<\\/g>`, 'gu'))].map(([, body]) => body).join('');
    for (const participant of participants) assert.ok(modeParticipants.includes(participant),
      `${column} visibly uses ${participant}`);
  }
  const placements = new Map([
    ['notification-column', ['notification-authority', 'notification-event', 'notification-consumer', 'notification-authority-row', 'notification-recovery']],
    ['transition-column', ['order-transition', 'transition-event', 'consumer-state-machine', 'transition-decision', 'transition-recovery']],
    ['carried-state-column', ['carried-authority', 'state-snapshot-event', 'autonomous-read', 'consumer-local-copy', 'carried-recovery']],
    ['event-sourcing-column', ['command-handler', 'integration-event', 'read-projection', 'event-store', 'replay-path']],
  ]);
  for (const [column, nodes] of placements) {
    assert.equal(nodes.length, ROW_IDS.length, `${column} five row contents`);
    nodes.forEach((node, index) => {
      assert.ok(contains(geometry(source, column, 'svg'), geometry(source, node, 'svg')), `${column} contains ${node}`);
      assert.ok(contains(geometry(source, ROW_IDS[index], 'svg'), geometry(source, node, 'svg')), `${ROW_IDS[index]} contains ${node}`);
    });
  }
}

function assertMeasuredDiagramGeometry(source) {
  const elements = svgElements(source);
  const scale = 800 / 2400;
  const edges = svgContract(source).edges;
  const allSegments = [];
  let minima = {marker: Infinity, stroke: Infinity};
  for (const edge of edges) {
    const path = elements.find(({attributes, name}) => name === 'path' && attributes.get('data-edge-id') === edge.id);
    const label = elements.find(({attributes, name}) => name === 'text' && attributes.get('data-edge-id') === edge.id);
    const fontSize = Number.parseFloat(svgPresentationValue(source, label, 'font-size'));
    assert.ok(fontSize * scale >= 15, `${edge.id} essential text >=15px`);
    const bounds = labelBounds(label.tag, edge.label, fontSize);
    const points = parsePathPoints(path.attributes.get('d'));
    const ownSegments = pathSegments(points);
    const strokeDistance = Math.min(...ownSegments.map(({left, right}) => segmentRectangleDistance(left, right, bounds)));
    const markerDistance = Math.min(...markerGeometry(source, path, points).map((point) => pointRectangleDistance(point, bounds)));
    minima.stroke = Math.min(minima.stroke, strokeDistance);
    minima.marker = Math.min(minima.marker, markerDistance);
    assert.ok(strokeDistance >= 24, `${edge.id} label-to-stroke ${strokeDistance}`);
    assert.ok(markerDistance >= 48, `${edge.id} label-to-marker ${markerDistance}`);
    allSegments.push(...ownSegments.map((segment) => ({...segment, edge: edge.id})));
  }
  for (let left = 0; left < allSegments.length; left += 1) for (let right = left + 1; right < allSegments.length; right += 1) {
    if (allSegments[left].edge !== allSegments[right].edge) assert.notEqual(canonicalSegment(allSegments[left]),
      canonicalSegment(allSegments[right]), `no shared connector segment ${allSegments[left].edge}/${allSegments[right].edge}`);
  }
  const legend = geometry(source, 'legend-band', 'svg');
  for (const edge of edges) for (const point of parsePathPoints(edge.attributes.get('d'))) {
    assert.ok(point.y < legend.y, `${edge.id} stays outside connector-free legend band`);
  }
  assert.doesNotMatch(source, /<rect\b[^>]*data-mask-over-path[^>]*>/u, 'no path-masking rectangles');
  return minima;
}

function assertEssentialLabelPresentation(source) {
  const elements = svgElements(source);
  const scale = 800 / 2400;
  const classes = ['node-label', 'small-label', 'column-label', 'row-label', 'legend-label', 'note'];
  for (const className of classes) {
    const labels = elements.filter(({attributes, name}) => name === 'text' &&
      (attributes.get('class') ?? '').split(/\s+/u).includes(className));
    assert.ok(labels.length > 0, `${className} labels exist`);
    for (const label of labels) {
      const fontSize = Number.parseFloat(svgPresentationValue(source, label, 'font-size'));
      const foreground = svgPresentationValue(source, label, 'fill');
      const background = localBackground(source, label);
      assert.ok(fontSize * scale >= (className === 'column-label' ? 18 : 15), `${className} rendered font size`);
      assert.ok(contrastRatio(foreground, background) >= 4.5, `${className} effective contrast`);
    }
  }
}

function markerGeometry(source, edgeElement, points) {
  const markerId = svgPresentationValue(source, edgeElement, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1];
  assert.ok(markerId, `${edgeElement.attributes.get('data-edge-id')} marker-end resolves`);
  const elements = svgElements(source);
  const marker = elements.find(({attributes, name}) => name === 'marker' && attributes.get('id') === markerId);
  assert.ok(marker, `${markerId} marker definition`);
  const markerPath = elements.find(({name, parent}) => name === 'path' && parent === marker);
  assert.ok(markerPath, `${markerId} marker shape`);
  const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number);
  assert.equal(viewBox.length, 4, `${markerId} marker viewBox`);
  const markerWidth = Number(marker.attributes.get('markerWidth'));
  const markerHeight = Number(marker.attributes.get('markerHeight'));
  assert.ok(markerWidth > 0 && markerHeight > 0 && markerWidth <= 16 && markerHeight <= 16,
    `${markerId} bounded marker dimensions`);
  const endpoint = points.at(-1);
  const previous = points.at(-2);
  const magnitude = Math.hypot(endpoint.x - previous.x, endpoint.y - previous.y);
  assert.ok(magnitude > 0, `${markerId} non-zero terminal segment`);
  const axis = {x: (endpoint.x - previous.x) / magnitude, y: (endpoint.y - previous.y) / magnitude};
  const perpendicular = {x: -axis.y, y: axis.x};
  const strokeWidth = Number(svgPresentationValue(source, edgeElement, 'stroke-width'));
  const unitScale = marker.attributes.get('markerUnits') === 'userSpaceOnUse' ? 1 : strokeWidth;
  const scaleX = markerWidth / viewBox[2] * unitScale;
  const scaleY = markerHeight / viewBox[3] * unitScale;
  const refX = Number(marker.attributes.get('refX'));
  const refY = Number(marker.attributes.get('refY'));
  const coordinates = (markerPath.attributes.get('d')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number);
  const pointsOnMarker = [];
  for (let index = 0; index < coordinates.length; index += 2) {
    const localX = (coordinates[index] - refX) * scaleX;
    const localY = (coordinates[index + 1] - refY) * scaleY;
    pointsOnMarker.push({
      x: endpoint.x + axis.x * localX + perpendicular.x * localY,
      y: endpoint.y + axis.y * localX + perpendicular.y * localY,
    });
  }
  assert.ok(pointsOnMarker.length >= 3 && pointsOnMarker.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)),
    `${markerId} actual marker bounds`);
  return pointsOnMarker;
}

function localBackground(source, labelElement) {
  const x = Number(labelElement.attributes.get('x'));
  const y = Number(labelElement.attributes.get('y'));
  const candidates = svgElements(source).filter(({attributes, index, name}) => {
    if (name !== 'rect') return false;
    const left = Number(attributes.get('x'));
    const top = Number(attributes.get('y'));
    const width = Number(attributes.get('width'));
    const height = Number(attributes.get('height'));
    return index < labelElement.index && [left, top, width, height].every(Number.isFinite) &&
      x >= left && x <= left + width && y >= top && y <= top + height;
  }).map((element) => ({
    color: svgPresentationValue(source, element, 'fill'),
    index: element.index,
    opacity: effectiveOpacity(source, element, 'fill'),
  })).filter(({color}) => color && color !== 'none').sort((left, right) => left.index - right.index);
  assert.ok(candidates.length > 0, `${labelElement.attributes.get('data-edge-id')} painted local background`);
  return compositePaints(candidates);
}

function assertDiagramPresentation(source) {
  const elements = svgElements(source);
  const root = elements.find(({name}) => name === 'svg');
  const viewBox = (root?.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number);
  assert.equal(viewBox.length, 4, 'SVG viewBox');
  const scale = 800 / viewBox[2];
  assert.ok(Number.isFinite(scale) && scale > 0 && scale <= 1, '800px/viewBox rendered scale');
  const edges = svgContract(source).edges;
  assert.equal(new Set(edges.map(({attributes}) => attributes.get('d'))).size, edges.length, 'unique connector paths');
  for (const edge of edges) {
    const pathElement = elements.find(({attributes, name}) => name === 'path' && attributes.get('data-edge-id') === edge.id);
    const labelElement = elements.find(({attributes, name}) => name === 'text' && attributes.get('data-edge-id') === edge.id);
    assert.ok(pathElement && labelElement, `${edge.id} visible edge and label`);
    const backgroundColor = localBackground(source, labelElement);
    const pathColor = blendHex(svgPresentationValue(source, pathElement, 'stroke'), backgroundColor,
      effectiveOpacity(source, pathElement, 'stroke'));
    const labelColor = blendHex(svgPresentationValue(source, labelElement, 'fill'), backgroundColor,
      effectiveOpacity(source, labelElement, 'fill'));
    assert.ok(contrastRatio(pathColor, backgroundColor) >= 3, `${edge.id} effective path contrast`);
    assert.ok(contrastRatio(labelColor, backgroundColor) >= 4.5, `${edge.id} effective label contrast`);
    const labelText = edge.label;
    const fontSize = Number.parseFloat(svgPresentationValue(source, labelElement, 'font-size'));
    const bounds = labelBounds(labelElement.tag, labelText, fontSize);
    const points = parsePathPoints(edge.attributes.get('d') ?? '');
    const markerGap = Math.min(...markerGeometry(source, pathElement, points)
      .map((point) => pointRectangleDistance(point, bounds))) * scale;
    assert.ok(markerGap >= 16, `${edge.id} marker-aware label clearance ${markerGap}`);
  }
}

function assertLegendBindings(source) {
  const expected = new Map([
    ['command', 'command-edge'],
    ['event-delivery', 'event-delivery-edge'],
    ['sync-lookup', 'sync-lookup-edge'],
    ['replay', 'replay-edge'],
  ]);
  for (const [kind, connectorClass] of expected) {
    const key = source.match(new RegExp(`<path\\b(?=[^>]*\\bclass="[^"]*\\b${connectorClass}\\b)(?=[^>]*\\bdata-legend-key="${kind}")[^>]*>`, 'u'));
    const caption = source.match(new RegExp(`<text\\b(?=[^>]*\\bdata-legend-for="${kind}")(?=[^>]*\\bdata-legend-entry="${kind}")[^>]*>`, 'u'));
    assert.ok(key, `${kind} legend key binds ${connectorClass}`);
    assert.ok(caption, `${kind} legend caption binding`);
  }
}

function assertDistinctDiagramResponsibilities(source) {
  const nodes = svgContract(source).nodes.map(({id}) => id);
  assert.equal(nodes.filter((id) => id === 'event-store').length, 1, 'one event-store responsibility');
  assert.equal(nodes.filter((id) => id === 'event-broker').length, 1, 'one event-broker responsibility');
  assert.notEqual('event-store', 'event-broker');
  for (const edge of svgContract(source).edges.filter(({id, attributes}) =>
    id.includes('replay') || attributes.get('data-source') === 'replay-path')) {
    assert.match(edge.attributes.get('data-target') ?? '', /^(?:aggregate|read-projection)$/u,
      `${edge.id} replay target is reconstructable state only`);
  }
}

async function runMutation(source, mutate, validator, label) {
  const mutated = mutate(source);
  assert.notEqual(mutated, source, `${label} mutation applies`);
  await assert.rejects(async () => validator(mutated), {name: 'AssertionError'}, label);
}

test('resolves SVG inline and important author cascade precedence', () => {
  const elementFrom = (source) => svgElements(source).find(({attributes}) => attributes.get('id') === 'cascade-target');
  const normalInline = '<svg><style>#cascade-target.edge { stroke: #FFFFFF; }</style>' +
    '<path id="cascade-target" class="edge" style="stroke: #334155"/></svg>';
  assert.equal(ownSvgPresentationValue(normalInline, elementFrom(normalInline), 'stroke'), '#334155',
    'normal inline declaration beats high-specificity normal stylesheet rule');
  const stylesheetImportant = '<svg><style>#cascade-target.edge { stroke: #FFFFFF !important; }</style>' +
    '<path id="cascade-target" class="edge" style="stroke: #334155"/></svg>';
  assert.equal(ownSvgPresentationValue(stylesheetImportant, elementFrom(stylesheetImportant), 'stroke'), '#FFFFFF',
    'stylesheet important beats normal inline declaration');
  const inlineImportant = '<svg><style>#cascade-target.edge { stroke: #FFFFFF !important; }</style>' +
    '<path id="cascade-target" class="edge" style="stroke: #334155 !important"/></svg>';
  assert.equal(ownSvgPresentationValue(inlineImportant, elementFrom(inlineImportant), 'stroke'), '#334155',
    'inline important beats stylesheet important declaration');
  const brokenInlinePrecedence = normalInline.replace('style="stroke: #334155"', 'stroke="#334155"');
  assert.notEqual(ownSvgPresentationValue(brokenInlinePrecedence, elementFrom(brokenInlinePrecedence), 'stroke'), '#334155',
    'removing inline tier lets high-specificity stylesheet rule win');
});

test('rejects every negated or unresolved reliability owner mutation', async () => {
  const fixture = [
    '积压由服务所有者负责处置。',
    'lag 与投影水位由投影处理器负责维护。',
    '至少一次投递由平台团队负责维护。',
    '幂等由消费者负责维护。',
    '乱序由消费者负责处置。',
    '事件结构（schema）演进由事件合同负责人负责维护。',
    '毒消息隔离由服务所有者负责处置。',
    '受控重放由值班人员负责处置。',
    '人工终止由服务所有者负责处置。',
  ].join('\n');
  assertAffirmativeOwnership(fixture);
  for (const [concern, pattern] of OWNERSHIP_CONTRACTS) {
    await runMutation(fixture, (source) => replaceAffirmativeOwnerClause(
      source, pattern, '无人负责，所有者待定', concern,
    ), assertAffirmativeOwnership, `${concern} owner clause is replaced`);
  }
});

test('publishes exact STY-06 metadata, headings, relations, and one same-case comparison', async () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  assertExactMetadata(article.source);
  for (const [field, token] of METADATA_YAML_TOKENS) {
    await runMutation(article.source, (source) => source.replace(token, ''), assertExactMetadata,
      `${field} metadata deletion`);
    await runMutation(article.source, (source) => source.replace(token,
      token.includes(': []') ? token.replace('[]', '[changed]') :
        (token.includes('\n  - ') ? token.replace(/\n  - [^\n]+/u, '\n  - changed') : `${field}: changed\n`)),
    assertExactMetadata, `${field} metadata change`);
  }
  const headings = findMarkdownHeadings(article.body);
  const h2Headings = headings.filter(({level}) => level === 2).map(({text}) => text);
  assert.deepEqual(h2Headings, HEADINGS, 'exact eleven ordered H2 headings');
  for (const heading of HEADINGS) assert.equal(h2Headings.filter((candidate) => candidate === heading).length, 1, `${heading} H2 once`);
  assertSameCaseComparison(article.source);
  transitionFailureAnswer(article.source);
  const comparison = section(article.source, '边界与控制流', '数据所有权与一致性');
  for (const mode of MODES) {
    const nextMode = MODES[MODES.indexOf(mode) + 1];
    const modeStart = comparison.search(new RegExp(`^### ${escapeRegExp(mode)}\\s*$`, 'mu'));
    const rest = comparison.slice(modeStart);
    const modeEnd = nextMode ? rest.search(new RegExp(`^### ${escapeRegExp(nextMode)}\\s*$`, 'mu')) : -1;
    const modeSource = modeEnd > 0 ? rest.slice(0, modeEnd) : rest;
    const answerLines = QUESTIONS.map((question) => modeSource.match(
      new RegExp(`^- \\*\\*${escapeRegExp(question)}：\\*\\*[^\\n]+$`, 'mu'),
    )?.[0]);
    assert.ok(answerLines.every(Boolean), `${mode} mutation fixtures`);
    await runMutation(article.source, (source) => source.replace(answerLines[0], ''),
      assertSameCaseComparison, `${mode} question removal`);
    await runMutation(article.source, (source) => source.replace(
      `${answerLines[0]}\n${answerLines[1]}`, `${answerLines[1]}\n${answerLines[0]}`,
    ), assertSameCaseComparison, `${mode} question swap`);
    await runMutation(article.source, (source) => source.replace(answerLines[4],
      '- **失败责任：** 平台团队统一负责所有失败。'), assertSameCaseComparison, `${mode} failure ownership`);
  }
  await runMutation(article.source, (source) => source.replace(
    /(^### 事件携带状态\s*$)([\s\S]*?)(?=^### 事件溯源\s*$)/mu,
    '$1\n\n客户资料变更后，目录消费者更新商品分类。\n\n',
  ), assertSameCaseComparison, 'unrelated customer/catalog scenario');
  for (const [label, pattern] of TRANSITION_FAILURE_CONTRACTS) {
    await runMutation(article.source, (source) => {
      const answer = transitionFailureAnswer(source);
      return source.replace(answer, answer.replace(pattern, ''));
    },
      transitionFailureAnswer, `transition ${label} deletion`);
    await runMutation(article.source, (source) => {
      const answer = transitionFailureAnswer(source);
      return source.replace(answer, answer.replace(pattern, '\u5e73\u53f0\u7edf\u4e00\u5904\u7406'));
    }, transitionFailureAnswer, `transition ${label} semantic change`);
  }
});

test('locks each required focusable wrapper and all four focus semantics', async () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  assertRequiredWrappers(article.source);
  for (const wrapper of REQUIRED_WRAPPERS) {
    const exact = exactWrapperTag(wrapper);
    for (const [label, from, to] of [
      ['role removal', ' role="region"', ''], ['role change', 'role="region"', 'role="group"'],
      ['aria removal', ` aria-label="${wrapper.aria}"`, ''],
      ['aria change', `aria-label="${wrapper.aria}"`, `aria-label="${wrapper.aria} changed"`],
      ['tabIndex removal', ' tabIndex={0}', ''], ['tabIndex change', 'tabIndex={0}', 'tabIndex={-1}'],
      ['handler removal', ' onKeyDown={handleHorizontalArrowKey}', ''],
      ['handler change', 'onKeyDown={handleHorizontalArrowKey}', 'onKeyDown={() => {}}'],
    ]) {
      await runMutation(article.source, (source) => source.replace(exact, exact.replace(from, to)),
        assertRequiredWrappers, `${wrapper.aria} ${label}`);
    }
  }
});

test('locks semantic boundaries, distinct responsibilities, prohibitions, and reliability ownership', async () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  assertSemanticContract(article.source);
  assertAffirmativeOwnership(article.source);
  assertReliabilityContract(article.source);
  const visible = visibleTextOf(article.source);
  for (const pattern of RELIABILITY_PATTERNS) assert.match(visible, pattern, `reliability ${pattern}`);
  for (const [index, conflation] of CONFLATIONS.entries()) {
    await runMutation(article.source, (source) => `${source}\n\n${[
      '命令就是领域事件。', '领域事件就是集成事件。', '事件代理就是事件存储。',
      'Outbox就是事件存储。', '本地副本就是权威状态。', '投影就是事件存储。',
    ][index]}\n`, assertSemanticContract, `critical conflation ${conflation}`);
  }
  for (const prohibited of PROHIBITED) {
    await runMutation(article.source, (source) => `${source}\n\n${prohibited}。\n`, assertSemanticContract, prohibited);
  }
  const semanticMutations = [
    ['taxonomy claimed unique', NON_UNIQUE_TAXONOMY_PATTERN, '这套教学分类是唯一分类。'],
    ['taxonomy claimed exhaustive', NON_EXHAUSTIVE_TAXONOMY_PATTERN, '这套教学分类是穷尽分类。'],
    ['taxonomy claimed maturity ladder', NON_LADDER_PATTERN, '四种模式构成成熟度阶梯并要求逐级升级。'],
    ['transition conflated with carried state', MODE_BOUNDARY_PATTERNS[0], '状态转移就是事件携带状态'],
    ['full payload proves event sourcing', NON_PROOF_PATTERNS[0], '完整数据就是事件溯源'],
    ['broker proves event sourcing', NON_PROOF_PATTERNS[1], '消息代理就是事件溯源'],
    ['Outbox proves event sourcing', NON_PROOF_PATTERNS[2], 'Outbox 就是事件溯源'],
    ['CQRS proves event sourcing', NON_PROOF_PATTERNS[3], 'CQRS 必须使用事件溯源'],
    ['async proves event sourcing', NON_PROOF_PATTERNS[4], '异步就是事件溯源'],
    ['replayable log proves event sourcing', NON_PROOF_PATTERNS[5], '可重放日志就是事件溯源'],
  ];
  for (const [label, pattern, replacement] of semanticMutations) {
    await runMutation(article.source,
      (source) => replaceFirstMatching(source, pattern, replacement, label), assertSemanticContract, label);
  }
  for (const [effect, pattern] of REPLAY_SAFETY_PATTERNS) {
    await runMutation(article.source, (source) => replaceFirstMatching(source, pattern,
      `回放可以重新执行 ${effect}。`, `replay ${effect}`), assertSemanticContract, `replay ${effect}`);
  }
  for (const [concern, pattern] of OWNERSHIP_CONTRACTS) {
    await runMutation(article.source, (source) => replaceAffirmativeOwnerClause(
      source, pattern, '无人负责，所有者待定', concern,
    ), assertAffirmativeOwnership, `${concern} unresolved/negated owner`);
  }
  for (const [label, pattern] of RELIABILITY_CONTRACTS) {
    await runMutation(article.source, (source) => replaceEveryMatching(source, pattern, '', label),
      assertReliabilityContract, `${label} deletion`);
  }
  const {rows} = reliabilityTableRows(article.source);
  for (const [rowLabel, row] of rows) {
    const rowLine = `| ${row.join(' | ')} |`;
    await runMutation(article.source, (source) => source.replace(`${rowLine}\n`, ''),
      assertReliabilityContract, `${rowLabel} row deletion`);
    for (let cellIndex = 1; cellIndex <= 3; cellIndex += 1) {
      const changed = [...row];
      changed[cellIndex] = '\u65e0\u5173\u5904\u7406';
      await runMutation(article.source, (source) => source.replace(rowLine, `| ${changed.join(' | ')} |`),
        assertReliabilityContract, `${rowLabel} cell ${cellIndex} semantic change`);
    }
    const changedOwner = [...row];
    changedOwner[4] = '\u5e73\u53f0\u56e2\u961f';
    await runMutation(article.source, (source) => source.replace(rowLine, `| ${changedOwner.join(' | ')} |`),
      assertReliabilityContract, `${rowLabel} owner mutation`);
  }
  await runMutation(article.source, (source) => source.replace(/\u5904\u7f6e\u65f6\u9650\u56db\u5c0f\u65f6/gu, '\u5904\u7f6e\u65f6\u9650\u516b\u5c0f\u65f6'),
    assertReliabilityContract, 'dead-letter deadline four-to-eight mutation');
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

test('locks reciprocal visible links and includes actionable STY-07', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const articleLinks = extractInternalLinks({body: article.body});
  assert.ok(articleLinks.includes('/styles'), 'visible parent styles route');
  assert.ok(articleLinks.includes('/cases/apache-kafka-consumer-groups'), 'visible related case');
  assert.equal(articleLinks.includes('/styles/sty-07'), true, 'STY-07 is actionable');
  for (const file of RECIPROCAL_FILES) {
    const document = documents.find((candidate) => candidate.file === file);
    assert.ok(document, `${file} reciprocal document`);
    const metadata = parseFrontMatter(document.source);
    assert.ok(metadata.adjacent_topics.includes(TOPIC_ID), `${file} reverse adjacency ${TOPIC_ID}`);
    if (file !== 'styles/sty-04-modular-monolith.mdx') {
      assert.ok(extractInternalLinks({body: document.body}).includes(ROUTE), `${file} visible ${ROUTE}`);
    }
  }
});

test('preserves the STY-06 closure under the current STY-10 next-topic projection', () => {
  assert.deepEqual({
    completed_topics: projectStatus.completed_topics,
    content_documents: projectStatus.content_documents,
    governed_sources: projectStatus.governed_sources,
  }, {completed_topics: 84, content_documents: 126, governed_sources: 599});
  assert.equal(publicLedger.sources.length, 599);


  const topic = manifest.topics.find(({id}) => id === TOPIC_ID);
  assert.equal(topic?.slug, ROUTE);
  assert.equal(topic?.published, true);
  assert.equal(topic?.status.value, 'complete');
  assert.deepEqual(topic?.dependencies, RELATION_METADATA.depends_on);
  assert.deepEqual(topic?.adjacent_topics, RELATION_METADATA.adjacent_topics);
  assert.deepEqual(topic?.related_cases, RELATION_METADATA.related_cases);
  assert.deepEqual(topic?.primary_sources, ['https://martinfowler.com/articles/201701-event-driven.html']);
  const nextTopic = manifest.topics.find(({id}) => id === 'STY-07');
  assert.equal(nextTopic?.published, true);
  assert.equal(nextTopic?.status.value, 'complete');
  assert.equal(indexes.style.find(({id}) => id === TOPIC_ID)?.published, true);
  assert.equal(indexes.style.find(({id}) => id === 'STY-07')?.published, true);
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
  const drawioEdges = drawioContract(drawio).edges.filter(({attributes}) =>
    attributes.get('dataRole') !== 'participantLink').map(({attributes}) => ({
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
  const removedMarker = svg.replace(/(\.[\w-]+\s*\{[^}]*?)\s*marker-end\s*:\s*url\(#[^)]+\)\s*;/u, '$1');
  assert.notEqual(removedMarker, svg, 'marker removal mutation applies');
  assert.throws(() => assertDiagramPresentation(removedMarker), {name: 'AssertionError'}, 'missing effective marker-end');
  const oversizedMarker = svg.replace(/(<marker\b[^>]*\bmarkerWidth=")[^"]+("[^>]*\bmarkerHeight=")[^"]+/u,
    '$1999$2999');
  assert.notEqual(oversizedMarker, svg, 'oversized marker mutation applies');
  assert.throws(() => assertDiagramPresentation(oversizedMarker), {name: 'AssertionError'}, 'oversized actual marker bounds');
  const localBackgroundMutation = svg.replace(
    /(<rect\b(?=[^>]*(?:data-label-background|data-edge-label-background))[^>]*\bfill=")#[0-9A-Fa-f]{6}/u,
    '$1#111827',
  );
  assert.notEqual(localBackgroundMutation, svg, 'local edge-label background mutation applies');
  assert.throws(() => assertDiagramPresentation(localBackgroundMutation), {name: 'AssertionError'},
    'local-background effective contrast');
  const opacityMutation = svg.replace(/(<text\b[^>]*data-edge-id="[^"]+"[^>]*)(>)/u, '$1 opacity="0.05"$2');
  assert.notEqual(opacityMutation, svg, 'edge-label opacity mutation applies');
  assert.throws(() => assertDiagramPresentation(opacityMutation), {name: 'AssertionError'}, 'effective opacity contrast');
  const firstPath = svgElements(svg).find(({attributes, name}) => name === 'path' && attributes.has('data-edge-id'));
  const firstLabel = svgElements(svg).find(({attributes, name}) => name === 'text' && attributes.has('data-edge-id'));
  assert.ok(firstPath && firstLabel, 'cascade mutation edge and label');
  const ancestorSelectorMutation = svg.replace(firstPath.tag, `<g class="ancestor-edge-mutation">${firstPath.tag}</g>`)
    .replace('</style>', '.ancestor-edge-mutation path.edge { stroke: #FFFFFF; }\n</style>');
  assert.notEqual(ancestorSelectorMutation, svg, 'ancestor-selector mutation applies');
  assert.throws(() => assertDiagramPresentation(ancestorSelectorMutation), {name: 'AssertionError'},
    'ancestor selector effective contrast');
  const specificityMutation = svg.replace(firstLabel.tag, `<g class="ancestor-label-mutation">${firstLabel.tag}`)
    .replace('</text>', '</text></g>')
    .replace('</style>', '.ancestor-label-mutation text.edge-label { fill: #FFFFFF; }\n.edge-label { fill: #111827; }\n</style>');
  assert.notEqual(specificityMutation, svg, 'specificity/source-order mutation applies');
  assert.throws(() => assertDiagramPresentation(specificityMutation), {name: 'AssertionError'},
    'specificity beats later lower-specificity rule');
  const labelX = firstLabel.attributes.get('x');
  const labelY = firstLabel.attributes.get('y');
  const topmostPaintMutation = svg.replace(firstLabel.tag,
    `<rect data-edge-label-background="paint-order-mutation" x="${Number(labelX) - 2000}" y="${Number(labelY) - 500}" width="4000" height="1000" fill="#111827"/>\n${firstLabel.tag}`);
  assert.notEqual(topmostPaintMutation, svg, 'topmost paint-order mutation applies');
  assert.throws(() => assertDiagramPresentation(topmostPaintMutation), {name: 'AssertionError'},
    'topmost painted background wins by document order');
  const translucentPaintMutation = svg.replace(firstLabel.tag,
    `<rect data-edge-label-background="alpha-mutation" x="${Number(labelX) - 2000}" y="${Number(labelY) - 500}" width="4000" height="1000" fill="#111827" opacity="0.8"/>\n${firstLabel.tag}`);
  assert.notEqual(translucentPaintMutation, svg, 'translucent background mutation applies');
  assert.throws(() => assertDiagramPresentation(translucentPaintMutation), {name: 'AssertionError'},
    'translucent backgrounds are alpha-composited');
});

test('binds color-independent legend keys and rejects responsibility/replay conflations', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertLegendBindings(svg);
  assertDistinctDiagramResponsibilities(svg);
  const wrongLegend = svg.replace('data-legend-key="replay"', 'data-legend-key="command"');
  assert.notEqual(wrongLegend, svg, 'wrong legend fixture applies');
  assert.throws(() => assertLegendBindings(wrongLegend), {name: 'AssertionError'}, 'wrong legend class binding');
  const mergedResponsibilities = svg.replaceAll('event-broker', 'event-store');
  assert.notEqual(mergedResponsibilities, svg, 'merged responsibility fixture applies');
  assert.throws(() => assertDistinctDiagramResponsibilities(mergedResponsibilities), {name: 'AssertionError'},
    'event store and broker remain distinct');
  const replaySideEffect = svg.replace(
    /(data-edge-id="es-replay-projection"[^>]*data-target=")[^"]+/u, '$1forbidden-side-effects',
  );
  assert.notEqual(replaySideEffect, svg, 'replay side-effect fixture applies');
  assert.throws(() => assertDistinctDiagramResponsibilities(replaySideEffect), {name: 'AssertionError'},
    'replay cannot target payment/notification side effects');
});

test('requires every participant and semantic row in every comparison column', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertCompleteComparison(svg);
  for (const participant of PARTICIPANTS) {
    const mutated = svg.replace(new RegExp(`(<g\\b[^>]*data-node-id="notification-participants"[^>]*>[\\s\\S]*?)${participant}`, 'u'), '$1');
    assert.notEqual(mutated, svg, `${participant} participant mutation applies`);
    assert.throws(() => assertCompleteComparison(mutated), {name: 'AssertionError'}, `${participant} required in every column`);
  }
  const rowMutation = svg.replace('data-node-id="transition-recovery"', 'data-node-id="transition-recovery-removed"');
  assert.notEqual(rowMutation, svg, 'row content mutation applies');
  assert.throws(() => assertCompleteComparison(rowMutation), {name: 'AssertionError'}, 'every column has meaningful recovery row');
});

test('measures connector lanes, real markers, text size, segment uniqueness, and legend isolation', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertMeasuredDiagramGeometry(svg);
  const first = svgContract(svg).edges[0];
  const collision = svg.replace(new RegExp(`(<text\\b[^>]*data-edge-id="${first.id}"[^>]*\\bx=")[^"]+("[^>]*\\by=")[^"]+`, 'u'), '$1395$2520');
  assert.notEqual(collision, svg, 'stroke collision mutation applies');
  assert.throws(() => assertMeasuredDiagramGeometry(collision), {name: 'AssertionError'}, 'actual label-stroke bounds');
  const smallText = svg.replace(/(\.edge-label\s*\{[^}]*font-size:\s*)45px/u, '$130px');
  assert.notEqual(smallText, svg, 'small text mutation applies');
  assert.throws(() => assertMeasuredDiagramGeometry(smallText), {name: 'AssertionError'}, 'essential edge text >=15px');
  const sharedSegment = svg.replace(/(data-edge-id="t-event"[^>]*d=")[^"]+/u, '$1M 420 520 H 740 V 790 H 1025');
  assert.notEqual(sharedSegment, svg, 'shared segment mutation applies');
  assert.throws(() => assertMeasuredDiagramGeometry(sharedSegment), {name: 'AssertionError'}, 'partial/shared connector segment');
  const legendIntrusion = svg.replace(/(data-edge-id="n-deliver"[^>]*d=")[^"]+/u, '$1M 395 520 H 410 V 3650');
  assert.notEqual(legendIntrusion, svg, 'legend intrusion mutation applies');
  assert.throws(() => assertMeasuredDiagramGeometry(legendIntrusion), {name: 'AssertionError'}, 'connector-free legend band');
  const mask = svg.replace('<path class="event-delivery-edge edge"', '<rect data-mask-over-path="true" x="0" y="0" width="10" height="10"/><path class="event-delivery-edge edge"');
  assert.notEqual(mask, svg, 'mask mutation applies');
  assert.throws(() => assertMeasuredDiagramGeometry(mask), {name: 'AssertionError'}, 'mask-over-path prohibited');
});

test('rejects partial connector overlap and ordinary later-painted occluders', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertNoConnectorOverdraw(svg);
  const partialOverlap = svg.replace(/(data-edge-id="t-event"[^>]*d=")[^"]+/u,
    '$1M 500 520 H 700 V 840 H 1015');
  assert.notEqual(partialOverlap, svg, 'partial interval overlap mutation applies');
  assert.throws(() => assertNoConnectorOverdraw(partialOverlap), {name: 'AssertionError'},
    'partial collinear overlap is rejected');
  const ordinaryWhiteOccluder = svg.replace(/(<path\b[^>]*data-edge-id="n-deliver"[^>]*>)/u,
    '$1<rect x="400" y="510" width="20" height="40" fill="#FFFFFF"/>');
  assert.notEqual(ordinaryWhiteOccluder, svg, 'ordinary white occluder mutation applies');
  assert.throws(() => assertNoConnectorOverdraw(ordinaryWhiteOccluder), {name: 'AssertionError'},
    'ordinary later-painted white rectangle is rejected');
});

test('enforces fill parity, structural participant paths, and actual column-header clearance', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);
  assertNodeFillParity(drawio, svg);
  assertParticipantConnectivity(drawio, svg);
  assertColumnHeaderClearance(svg);
  const fillMutation = svg.replace('style="fill:#DBEAFE;stroke:#1D4ED8" x="300"',
    'style="fill:#FFFFFF;stroke:#1D4ED8" x="300"');
  assert.notEqual(fillMutation, svg, 'node fill mutation applies');
  assert.throws(() => assertNodeFillParity(drawio, fillMutation), {name: 'AssertionError'}, 'node fill parity');
  for (const mode of ['notification', 'transition', 'carried', 'event-sourcing']) {
    for (const participant of ['order', 'inventory', 'payment', 'notification']) {
      const participantMutation = svg.replace(new RegExp(
        `<path\\b[^>]*data-structural-edge-id="${mode}-${participant}-participant-link"[^>]*/>`, 'u'), '');
      assert.notEqual(participantMutation, svg, `${mode}/${participant} path mutation applies`);
      assert.throws(() => assertParticipantConnectivity(drawio, participantMutation), {name: 'AssertionError'},
        `${mode}/${participant} path is structural`);
      const detachedPathMutation = svg.replace(new RegExp(
        `(data-structural-edge-id="${mode}-${participant}-participant-link"[^>]*d="M\\s+[0-9.]+\\s+)[0-9.]+`, 'u'),
      '$1999');
      assert.notEqual(detachedPathMutation, svg, `${mode}/${participant} detach mutation applies`);
      assert.throws(() => assertParticipantConnectivity(drawio, detachedPathMutation), {name: 'AssertionError'},
        `${mode}/${participant} edge cannot detach from participant node`);
      const participantNodeMutation = svg.replace(new RegExp(
        `(data-mode="${mode}"[\\s\\S]*?data-participant-label=")${participant}"`, 'u'), '$1removed');
      assert.notEqual(participantNodeMutation, svg, `${mode}/${participant} node mutation applies`);
      assert.throws(() => assertParticipantConnectivity(drawio, participantNodeMutation), {name: 'AssertionError'},
        `${mode}/${participant} participant node is structural`);
    }
    const flowEdge = new Map([
      ['notification', 'n-consume'], ['transition', 't-consume'],
      ['carried', 'c-copy'], ['event-sourcing', 'es-external-delivery'],
    ]).get(mode);
    const coreFlowMutation = svg.replace(new RegExp(`<path\\b[^>]*data-edge-id="${flowEdge}"[^>]*/>`), '');
    assert.notEqual(coreFlowMutation, svg, `${mode} core flow mutation applies`);
    assert.throws(() => assertParticipantConnectivity(drawio, coreFlowMutation), {name: 'AssertionError'},
      `${mode} participants traverse actual core flow`);
  }
  const participantStyleMutation = drawio.replace(
    'id="notification-order-participant-link" value="" dataRole="participantLink" style="edgeStyle=orthogonalEdgeStyle;exitX=0.5;exitY=1;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0.125;entryY=0;entryDx=0;entryDy=0;entryPerimeter=1;html=0;endArrow=none;strokeColor=#1D4ED8',
    'id="notification-order-participant-link" value="" dataRole="participantLink" style="edgeStyle=orthogonalEdgeStyle;exitX=0.5;exitY=1;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0.125;entryY=0;entryDx=0;entryDy=0;entryPerimeter=1;html=0;endArrow=block;strokeColor=#111827');
  assert.notEqual(participantStyleMutation, drawio, 'participant effective-style mutation applies');
  assert.throws(() => assertParticipantConnectivity(participantStyleMutation, svg), {name: 'AssertionError'},
    'participant effective marker/stroke parity');
  const participantPortMutation = drawio.replace(
    'id="notification-order-participant-link" value="" dataRole="participantLink" style="edgeStyle=orthogonalEdgeStyle;exitX=0.5;exitY=1;',
    'id="notification-order-participant-link" value="" dataRole="participantLink" style="edgeStyle=orthogonalEdgeStyle;exitX=0.6;exitY=1;');
  assert.notEqual(participantPortMutation, drawio, 'participant effective-port mutation applies');
  assert.throws(() => assertParticipantConnectivity(participantPortMutation, svg), {name: 'AssertionError'},
    'participant effective terminal port parity');
  const participantBoundsMutation = drawio.replace(
    'id="notification-order-participant" value="订单" dataRole="participant" style="text;html=0;fontColor=#111827;fontFamily=system-ui;fontStyle=1;fontSize=45;" vertex="1" parent="1"><mxGeometry x="300" y="340" width="90" height="83"',
    'id="notification-order-participant" value="订单" dataRole="participant" style="text;html=0;fontColor=#111827;fontFamily=system-ui;fontStyle=1;fontSize=45;" vertex="1" parent="1"><mxGeometry x="300" y="340" width="90" height="82"');
  assert.notEqual(participantBoundsMutation, drawio, 'participant terminal-bounds mutation applies');
  assert.throws(() => assertParticipantConnectivity(participantBoundsMutation, svg), {name: 'AssertionError'},
    'participant terminal bounds determine effective endpoint');
  const participantDashMutation = svg.replace(
    'data-structural-edge-id="notification-order-participant-link" data-participant="order"',
    'data-structural-edge-id="notification-order-participant-link" data-participant="order" stroke-dasharray="5 15"');
  assert.notEqual(participantDashMutation, svg, 'participant dash mutation applies');
  assert.throws(() => assertParticipantConnectivity(drawio, participantDashMutation), {name: 'AssertionError'},
    'participant effective dash parity');
  const headerMutation = svg.replace(/(<g\b[^>]*data-node-id="notification-column"[^>]*>[\s\S]*?<text\b[^>]*\by=")[^"]+/u,
    '$190');
  assert.notEqual(headerMutation, svg, 'header clearance mutation applies');
  assert.throws(() => assertColumnHeaderClearance(headerMutation), {name: 'AssertionError'}, 'header uses actual text bounds');
});

test('enforces complete Draw.io/SVG node and connector parity classes', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);
  assertFullDrawioSvgParity(drawio, svg);
  assertExpectedVersionAppend(drawio, svg);
  const expectedVersionMutation = svg.replace('expectedVersion', 'version');
  assert.notEqual(expectedVersionMutation, svg, 'expectedVersion removal mutation applies');
  assert.throws(() => assertExpectedVersionAppend(drawio, expectedVersionMutation), {name: 'AssertionError'},
    'append must retain expectedVersion concurrency guard');
  for (const [label, mutation] of [
    ['bounds', (source) => source.replace('data-node-bounds="300 440 240 80"', 'data-node-bounds="301 440 240 80"')],
    ['label', (source) => source.replace('>订单权威</text>', '>订单写模型</text>')],
    ['role', (source) => source.replace('data-node-id="notification-authority" data-role="authority"',
      'data-node-id="notification-authority" data-role="derived"')],
    ['missing role', (source) => source.replace('data-node-id="notification-authority" data-role="authority"',
      'data-node-id="notification-authority"')],
    ['shape', (source) => source.replace(/(<g\b[^>]*data-node-id="notification-broker"[^>]*>)<rect/u, '$1<ellipse')],
    ['route', (source) => source.replace('data-target="notification-event" d="M 420 520 H 740 V 790 H 495"',
      'data-target="notification-event" d="M 420 520 H 730 V 790 H 495"')],
    ['marker', (source) => source.replace('marker-end: url(#arrow-command)', 'marker-end: url(#arrow-replay)')],
    ['dash', (source) => source.replace('stroke-dasharray: 22 14', 'stroke-dasharray: 5 15')],
    ['stroke', (source) => source.replace('.command-edge { fill: none; stroke: #6B21A8',
      '.command-edge { fill: none; stroke: #111827')],
    ['font', (source) => source.replace('font-size: 45px', 'font-size: 44px')],
  ]) {
    const mutated = mutation(svg);
    assert.notEqual(mutated, svg, `${label} parity mutation applies`);
    assert.throws(() => assertFullDrawioSvgParity(drawio, mutated), {name: 'AssertionError'}, `${label} parity`);
  }
  for (const [label, mutation] of [
    ['effective waypoint', (source) => source.replace('<mxPoint x="740" y="520"/>', '<mxPoint x="730" y="520"/>')],
    ['missing effective source port', (source) => source.replace('exitX=0.5;', '')],
    ['changed effective target port', (source) => source.replace('entryX=0.5;entryY=0;',
      'entryX=0.5;entryY=0.1;')],
    ['effective marker', (source) => source.replace(/(id="es-command"[^>]*\bendArrow=)block/u, '$1diamond')],
    ['effective dash', (source) => source.replace(/(id="n-deliver"[^>]*\bdashPattern=)22 14/u, '$15 15')],
    ['effective stroke', (source) => source.replace(/(id="es-command"[^>]*\bstrokeColor=)#6B21A8/u, '$1#111827')],
    ['effective font', (source) => source.replace(/(id="es-command"[^>]*\bfontSize=)45/u, '$144')],
  ]) {
    const mutated = mutation(drawio);
    assert.notEqual(mutated, drawio, `${label} Draw.io mutation applies`);
    assert.throws(() => assertFullDrawioSvgParity(mutated, svg), {name: 'AssertionError'}, `${label} Draw.io parity`);
  }
});

test('measures every label against every connector, marker, node, boundary, and legend item', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  const measuredClearances = assertAllTextClearances(svg);
  const measuredLegend = assertLegendClearance(svg);
  if (process.env.STY06_REPORT_MINIMA === '1') console.error(JSON.stringify({measuredClearances, measuredLegend}));
  const foreignStroke = svg.replace(/(<text\b[^>]*data-edge-id="n-broker"[^>]*\bx=")[^"]+("[^>]*\by=")[^"]+/, '$1410$2520');
  assert.notEqual(foreignStroke, svg, 'foreign connector collision mutation applies');
  assert.throws(() => assertAllTextClearances(foreignStroke), {name: 'AssertionError'}, 'every foreign connector stroke');
  const nodeCollision = svg.replace(/(<text\b[^>]*data-edge-id="n-broker"[^>]*\bx=")[^"]+("[^>]*\by=")[^"]+/, '$1595$2557');
  assert.notEqual(nodeCollision, svg, 'node collision mutation applies');
  assert.throws(() => assertAllTextClearances(nodeCollision), {name: 'AssertionError'}, 'every node envelope');
  const boundaryCollision = svg.replace(/(<text\b[^>]*data-edge-id="n-deliver"[^>]*\bx=")[^"]+/, '$1285');
  assert.notEqual(boundaryCollision, svg, 'boundary collision mutation applies');
  assert.throws(() => assertAllTextClearances(boundaryCollision), {name: 'AssertionError'}, 'boundary inner stroke');
  const rowBoundaryCollision = svg.replace(/(<text\b[^>]*data-edge-id="n-deliver"[^>]*\by=")[^"]+/, '$11250');
  assert.notEqual(rowBoundaryCollision, svg, 'row-boundary collision mutation applies');
  assert.throws(() => assertAllTextClearances(rowBoundaryCollision), {name: 'AssertionError'}, 'row boundary inner stroke');
  const legendCollision = svg.replace(/(<text\b[^>]*data-legend-for="command"[^>]*\bx=")[^"]+/, '$1435');
  assert.notEqual(legendCollision, svg, 'legend collision mutation applies');
  assert.throws(() => assertLegendClearance(legendCollision), {name: 'AssertionError'}, 'legend caption/key');
  const legendMarkerCollision = svg.replace(/(<text\b[^>]*data-legend-for="command"[^>]*\bx=")[^"]+/, '$1480');
  assert.notEqual(legendMarkerCollision, svg, 'legend marker/caption collision mutation applies');
  assert.throws(() => assertLegendClearance(legendMarkerCollision), {name: 'AssertionError'}, 'legend marker/caption');
});

test('keeps node, row, column, legend, and note labels readable on effective backgrounds', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertEssentialLabelPresentation(svg);
  for (const className of ['node-label', 'small-label', 'column-label', 'row-label', 'legend-label', 'note']) {
    const mutation = svg.replace(new RegExp(`(\\.${className}\\s*\\{[^}]*fill:\\s*)#[0-9A-Fa-f]{6}`, 'u'), '$1#FFFFFF');
    assert.notEqual(mutation, svg, `${className} contrast mutation applies`);
    assert.throws(() => assertEssentialLabelPresentation(mutation), {name: 'AssertionError'}, `${className} contrast`);
  }
});
