import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const TOPIC_ID = 'STY-05';
const ROUTE = '/styles/sty-05';
const ARTICLE = 'content/styles/sty-05-microservices.mdx';
const DRAWIO = 'diagrams/sty-05-microservices-order-saga.drawio';
const SVG = 'static/img/diagrams/sty-05-microservices-order-saga.svg';
const SOURCE_IDS = [
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-microservicesio-database-per-service',
  'src-microservicesio-saga',
  'src-aws-decompose-business-capability',
  'src-atlas-sty05-microservices-order-saga',
];
const REQUIRED_HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
const SUMMARY = '以提交订单为统一案例，说明微服务如何把业务能力、独立部署、私有数据和运行责任绑定，并解释 Saga、补偿与组织前提。';
const EXPECTED_METADATA = {
  title: '微服务：用独立部署换取自治，也承担分布式成本',
  slug: ROUTE,
  content_type: 'style',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-11',
  source_cutoff: '2026-08-11',
  confidence: 'high',
  domains: ['software-architecture', 'distributed-systems'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['deployability', 'scalability', 'availability', 'maintainability', 'operability'],
  tags: ['架构风格', '微服务', '服务边界', '分布式一致性'],
  summary: SUMMARY,
  topic_id: TOPIC_ID,
  priority: 'P0',
  depends_on: ['STY-00', 'STY-04'],
  adjacent_topics: ['STY-03', 'STY-04'],
  related_cases: ['/cases/micro-frontends-single-spa'],
  related_questions: [],
};
const DIAGRAM_ARIA = '订单、库存、支付和通知微服务的独立部署、私有数据与 Saga 恢复图，可横向滚动';
const DIAGRAM_ALT = '订单、库存、支付和通知作为独立部署服务，通过消息和持久 Saga 协作，各自拥有数据并显式执行补偿与恢复';
const SCENARIO_LABEL = '说明性场景（Tego Arch 分析）';

const DEPLOYMENT_IDS = [
  'order-service-boundary', 'inventory-service-boundary',
  'payment-service-boundary', 'notification-service-boundary',
];
const DATA_IDS = [
  'order-data', 'inventory-data', 'payment-data', 'notification-data',
];
const PLATFORM_IDS = [
  'api-entry', 'message-broker', 'payment-provider', 'observability-platform',
];
const RECOVERY_IDS = [
  'order-saga-state', 'order-outbox', 'inventory-outbox', 'payment-outbox',
  'notification-outbox', 'payment-reconciliation', 'poison-message-isolation',
];
const PROHIBITED = [
  '微服务由代码行数定义', '容器等于微服务', '远程调用等于微服务',
  '共享数据库仍可由任意服务直接写入', '跨服务事务天然原子',
  'Saga 自动回滚外部副作用', 'Outbox 保证 exactly-once',
  '支付结果未知时直接重复扣款', '拆成服务后天然故障隔离',
];
const ACCEPTED_DENIALS = [
  ['微服务不能由代码行数定义', '微服务不应该按代码行数定义', '微服务并非由代码行数定义'],
  ['容器并不等于微服务', '容器不能被直接当作微服务', '容器并非微服务'],
  ['远程调用不等于微服务', '远程调用不应该被视为微服务', '远程调用并非微服务'],
  ['共享数据库不能由任意服务直接写入', '共享数据库不应该允许所有服务直接写入', '共享数据库并非任何服务都可以直接写入'],
  ['跨服务事务并非天然原子', '跨服务事务不能自动获得原子性', '跨服务事务不应该被假定为原子事务'],
  ['Saga 不会自动回滚外部副作用', 'Saga 不能天然回滚外部副作用', 'Saga 并非外部副作用的自动回滚机制'],
  ['Outbox 不能保证 exactly-once', 'Outbox 不应该被宣称为恰好一次保证', 'Outbox 并非仅一次投递保证'],
  ['支付结果未知时不能直接重复扣款', '支付结果未知时不应该立即重复授权', '支付结果未知并非可以盲目重复扣款'],
  ['拆成服务后并不天然故障隔离', '拆成服务后不能自动获得故障隔离', '拆成服务并非必然具备故障隔离'],
];
const MIXED_AFFIRMATIVE_VIOLATIONS = [
  '微服务不只关心容器，也由代码行数定义',
  '容器不能忽略资源成本，但就是微服务',
  '远程调用不应该忽略延迟，但仍然就是微服务',
  '共享数据库不负责只读投影，但仍可由任意服务直接写入',
  '跨服务事务不能忽略网络失败，但天然原子',
  'Saga 不只协调步骤，也自动回滚外部副作用',
  'Outbox 不负责业务状态，但保证 exactly-once',
  '支付结果未知不能忽略，但可以直接重复扣款',
  '拆成服务后不能忽略运维成本，但天然故障隔离',
];

const ILLUSTRATION_SOURCE_ID = 'src-atlas-sty05-microservices-order-saga';
const ILLUSTRATION_URL = '/img/diagrams/sty-05-microservices-order-saga.svg';
const ADJACENT_TOPICS = ['STY-03', 'STY-04'];
const ADJACENT_ROUTES = ['/styles/sty-03', '/styles/sty-04'];
const SERVICE_KEYS = ['order', 'inventory', 'payment', 'notification'];
const SERVICE_CHILDREN = new Map([
  ['order', ['order-contract', 'order-handler', 'order-data', 'order-saga-state', 'order-outbox', 'order-consumer-dedup']],
  ['inventory', ['inventory-contract', 'inventory-handler', 'inventory-data', 'inventory-outbox', 'inventory-consumer-dedup']],
  ['payment', ['payment-contract', 'payment-dispatcher', 'payment-data', 'payment-outbox', 'payment-reconciliation', 'payment-consumer-dedup']],
  ['notification', ['notification-contract', 'notification-worker', 'notification-data', 'notification-outbox', 'notification-consumer-dedup']],
]);
const LEGEND_IDS = ['legend-sync-line', 'legend-message-line', 'legend-compensation-line'];
const DIAGRAM_NODES = [
  ['client', '客户端', '请求方 / Client'],
  ['order-service-boundary', '订单服务', '独立部署边界 / Deployment Boundary'],
  ['inventory-service-boundary', '库存服务', '独立部署边界 / Deployment Boundary'],
  ['payment-service-boundary', '支付服务', '独立部署边界 / Deployment Boundary'],
  ['notification-service-boundary', '通知服务', '独立部署边界 / Deployment Boundary'],
  ['order-contract', '订单合同', '公开合同 / Public Contract'],
  ['order-handler', '订单处理器', '内部实现 / Internal Implementation'],
  ['order-data', '订单权威数据', '私有数据 / Authoritative Data'],
  ['order-saga-state', '订单 Saga 状态', '持久恢复状态 / Durable State'],
  ['order-outbox', '订单 Outbox', '本地事务发件箱 / Outbox'],
  ['order-consumer-dedup', '订单消费去重', '稳定幂等键 / Deduplication'],
  ['inventory-contract', '库存合同', '公开合同 / Public Contract'],
  ['inventory-handler', '库存处理器', '内部实现 / Internal Implementation'],
  ['inventory-data', '库存权威数据', '私有数据 / Authoritative Data'],
  ['inventory-outbox', '库存 Outbox', '本地事务发件箱 / Outbox'],
  ['inventory-consumer-dedup', '库存消费去重', '稳定幂等键 / Deduplication'],
  ['payment-contract', '支付合同', '公开合同 / Public Contract'],
  ['payment-dispatcher', '支付持久 Dispatcher', '内部实现 / Internal Implementation'],
  ['payment-data', '支付意图与结果', '私有数据 / Authoritative Data'],
  ['payment-outbox', '支付 Outbox', '本地事务发件箱 / Outbox'],
  ['payment-reconciliation', '未知结果查询与对账', '恢复路径 / Reconciliation'],
  ['payment-consumer-dedup', '支付消费去重', '稳定幂等键 / Deduplication'],
  ['notification-contract', '通知合同', '公开合同 / Public Contract'],
  ['notification-worker', '通知工作器', '内部实现 / Internal Implementation'],
  ['notification-data', '通知投递状态', '私有数据 / Authoritative Data'],
  ['notification-outbox', '通知 Outbox', '本地事务发件箱 / Outbox'],
  ['notification-consumer-dedup', '通知消费去重', '稳定幂等键 / Deduplication'],
  ['api-entry', 'API 入口', '共享平台 / Platform'],
  ['message-broker', '消息中间件', '至少一次与重放边界 / Platform'],
  ['payment-provider', '外部支付提供方', '外部副作用 / External System'],
  ['observability-platform', '日志 / 指标 / 追踪', '共享平台 / Observability'],
  ['poison-message-isolation', '毒消息隔离与受控重放', '服务所有者负责；修复 / 手动重放 / 人工终止'],
  ['legend-sync-line', '', ''],
  ['legend-message-line', '', ''],
  ['legend-compensation-line', '', ''],
];
const DIAGRAM_EDGES = [
  ['request-entry', 'client', 'api-entry', '提交订单（稳定幂等键）', 'sync'],
  ['api-order-request', 'api-entry', 'order-contract', '提交订单请求', 'sync'],
  ['order-contract-dispatch', 'order-contract', 'order-consumer-dedup', '请求 / 结果去重', 'sync'],
  ['order-owned-data-write', 'order-handler', 'order-data', '本地事务写订单', 'sync'],
  ['order-saga-state-write', 'order-handler', 'order-saga-state', '持久化 Saga', 'sync'],
  ['order-outbox-write', 'order-handler', 'order-outbox', '同事务记录', 'sync'],
  ['order-created', 'order-outbox', 'message-broker', 'OrderCreated', 'message'],
  ['reserve-inventory-command', 'message-broker', 'inventory-contract', 'ReserveInventory', 'message'],
  ['inventory-consumer-deduplication', 'inventory-contract', 'inventory-consumer-dedup', '消费去重', 'sync'],
  ['inventory-contract-dispatch', 'inventory-consumer-dedup', 'inventory-handler', '处理预留', 'sync'],
  ['inventory-owned-data-write', 'inventory-handler', 'inventory-data', '本地事务写预留', 'sync'],
  ['inventory-outbox-write', 'inventory-handler', 'inventory-outbox', '同事务记录', 'sync'],
  ['inventory-reserved-result', 'inventory-outbox', 'message-broker', 'InventoryReserved', 'message'],
  ['inventory-rejected-result', 'inventory-outbox', 'message-broker', 'InventoryRejected', 'message'],
  ['order-result-deduplication', 'message-broker', 'order-contract', '订单结果进入公开合同', 'message'],
  ['order-result-dispatch', 'order-consumer-dedup', 'order-handler', '处理请求 / 推进持久 Saga', 'sync'],
  ['reserve-inventory-publication', 'order-outbox', 'message-broker', 'ReserveInventory', 'message'],
  ['register-payment-intent', 'order-outbox', 'message-broker', 'RegisterPaymentIntent', 'message'],
  ['payment-command-delivery', 'message-broker', 'payment-contract', '登记支付意图', 'message'],
  ['payment-consumer-deduplication', 'payment-contract', 'payment-consumer-dedup', '消费去重', 'sync'],
  ['payment-contract-dispatch', 'payment-consumer-dedup', 'payment-dispatcher', '持久执行', 'sync'],
  ['payment-owned-data-write', 'payment-dispatcher', 'payment-data', '本地事务写意图', 'sync'],
  ['payment-outbox-write', 'payment-dispatcher', 'payment-outbox', '同事务记录', 'sync'],
  ['provider-authorization', 'payment-dispatcher', 'payment-provider', '授权 / 扣款（稳定幂等键）', 'sync'],
  ['provider-result', 'payment-provider', 'payment-contract', '确认 / 拒绝 / 未知', 'sync'],
  ['payment-unknown-reconciliation', 'payment-dispatcher', 'payment-reconciliation', '未知结果先查询 / 对账', 'sync'],
  ['payment-confirmed', 'payment-outbox', 'message-broker', 'PaymentConfirmed', 'message'],
  ['payment-rejected', 'payment-outbox', 'message-broker', 'PaymentRejected', 'message'],
  ['payment-unknown', 'payment-outbox', 'message-broker', 'PaymentUnknown', 'message'],
  ['order-confirmed', 'order-outbox', 'message-broker', 'OrderConfirmed', 'message'],
  ['notification-delivery', 'message-broker', 'notification-contract', 'DeliverNotification', 'message'],
  ['notification-consumer-deduplication', 'notification-contract', 'notification-consumer-dedup', '消费去重', 'sync'],
  ['notification-contract-dispatch', 'notification-consumer-dedup', 'notification-worker', '重试投递', 'sync'],
  ['notification-owned-data-write', 'notification-worker', 'notification-data', '本地事务写投递状态', 'sync'],
  ['notification-outbox-write', 'notification-worker', 'notification-outbox', '同事务记录', 'sync'],
  ['release-inventory-compensation-publication', 'order-outbox', 'message-broker', 'ReleaseInventory', 'compensation'],
  ['release-inventory-compensation', 'message-broker', 'inventory-contract', 'ReleaseInventory', 'compensation'],
  ['payment-compensation-publication', 'order-outbox', 'message-broker', 'Void / Reversal / Refund', 'compensation'],
  ['payment-void-reversal-refund', 'message-broker', 'payment-contract', 'Void / Reversal / Refund', 'compensation'],
  ['poison-message-routing', 'message-broker', 'poison-message-isolation', '隔离毒消息', 'message'],
  ['order-observability-signal', 'order-handler', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
  ['inventory-observability-signal', 'inventory-handler', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
  ['payment-observability-signal', 'payment-dispatcher', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
  ['notification-observability-signal', 'notification-worker', 'observability-platform', '日志 / 指标 / 追踪', 'message'],
];
const SOURCE_CONTRACTS = [
  {
    id: 'src-lewis-fowler-microservices',
    locator: 'https://martinfowler.com/articles/microservices.html',
    title: 'Microservices',
    author: 'James Lewis and Martin Fowler', publishedAt: '2014-03-25',
    version: 'Original article published 2014-03-25; author-hosted page checked 2026-08-11',
    sourceKind: 'engineering-blog', tier: 'primary',
    allowedRoles: ['comparison', 'definition', 'method', 'runtime-fact'],
    license: 'LicenseRef-All-Rights-Reserved', licenseEvidenceUrl: 'https://martinfowler.com/articles/microservices.html',
    licenseScope: 'The named James Lewis and Martin Fowler article and bibliographic facts only; prose, diagrams, images, examples, marks, linked works, and third-party material excluded',
    licenseEvidenceNote: 'The author-hosted Microservices article exposes no reusable license; Tego Arch retains attribution, a link, and original Chinese factual summary only.',
    copyrightPolicy: 'facts-and-short-quotation', citationRoles: ['comparison', 'definition', 'runtime-fact'],
    usageBoundary: 'Supports commonly observed microservice characteristics including independent deployment, business-capability organization, product-style responsibility, decentralized data management, and designing for failure; it is not a formal standard or a guarantee of production outcomes.',
    expectedApprovalNote: 'Reviewed article identity, authorship, publication date, copyright boundary, and healthy author-hosted transport on 2026-08-11.',
    attribution: 'Microservices, James Lewis and Martin Fowler', usageMode: 'facts-summary', manifestPrimary: true,
  },
  {
    id: 'src-microsoft-microservices-architecture-style',
    locator: 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices',
    title: 'Microservices architecture style',
    transport: 'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/f69851e7c8b27ca6e8983e7b7d91d35e99423a73/docs/guide/architecture-styles/microservices.md',
    author: 'Microsoft', publishedAt: '2025-06-30',
    version: 'MicrosoftDocs architecture-center commit f69851e7c8b27ca6e8983e7b7d91d35e99423a73; source ms.date 2025-06-30',
    sourceKind: 'vendor-reference-architecture', tier: 'first-party',
    allowedRoles: ['comparison', 'definition', 'implementation', 'learning', 'method', 'runtime-fact'],
    license: 'CC-BY-4.0',
    licenseEvidenceUrl: 'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/f69851e7c8b27ca6e8983e7b7d91d35e99423a73/LICENSE',
    licenseScope: 'The named Microsoft Learn microservices page at the pinned official documentation commit; code, trademarks, linked works, media, and third-party assets excluded',
    licenseEvidenceNote: 'The pinned official Architecture Center repository LICENSE applies CC BY 4.0 to the documentation repository.',
    copyrightPolicy: 'vendor-claims-separated', citationRoles: ['comparison', 'definition', 'runtime-fact'],
    usageBoundary: 'Supports Microsoft descriptions of autonomous services, private data, CI/CD, observability, conditional fault isolation, and distributed-system costs; Azure-specific choices and universal outcome claims are excluded.',
    expectedApprovalNote: 'Pinned official source file and CC BY 4.0 repository license returned HTTP 200 on 2026-08-11.',
    attribution: 'Microservices architecture style, Microsoft Azure Architecture Center',
    usageMode: 'facts-summary', manifestPrimary: false,
  },
  {
    id: 'src-microservicesio-database-per-service',
    locator: 'https://microservices.io/patterns/data/database-per-service.html',
    title: 'Pattern: Database per service',
    author: 'Chris Richardson', publishedAt: null,
    version: 'Current Database per Service pattern page checked 2026-08-11',
    sourceKind: 'independent-blog', tier: 'primary',
    allowedRoles: ['comparison', 'definition', 'method', 'runtime-fact'],
    license: 'LicenseRef-All-Rights-Reserved', licenseEvidenceUrl: 'https://microservices.io/patterns/data/database-per-service.html',
    licenseScope: 'The named Database per Service pattern page and bibliographic facts only; prose, diagrams, examples, linked works, and third-party material excluded',
    licenseEvidenceNote: 'The checked Microservices.io footer states Copyright © 2026 Chris Richardson • All rights reserved; Tego Arch uses attribution, a link, and original factual summary only.',
    copyrightPolicy: 'facts-and-short-quotation', citationRoles: ['definition', 'method', 'runtime-fact'],
    usageBoundary: 'Supports private persistent data, access through service APIs, local transactions, and the cross-service transaction/query costs; it does not authorize copied diagrams or prove a universal storage topology.',
    expectedApprovalNote: 'Reviewed canonical page identity, authorship, copyright footer, and healthy transport on 2026-08-11.',
    attribution: 'Database per Service pattern, Chris Richardson', usageMode: 'facts-summary', manifestPrimary: false,
  },
  {
    id: 'src-microservicesio-saga', locator: 'https://microservices.io/patterns/data/saga.html', title: 'Pattern: Saga',
    author: 'Chris Richardson', publishedAt: null,
    version: 'Current Saga pattern page checked 2026-08-11', sourceKind: 'independent-blog', tier: 'primary',
    allowedRoles: ['definition', 'method', 'runtime-fact'],
    license: 'LicenseRef-All-Rights-Reserved', licenseEvidenceUrl: 'https://microservices.io/patterns/data/saga.html',
    licenseScope: 'The named Saga pattern page and bibliographic facts only; prose, diagrams, examples, linked works, and third-party material excluded',
    licenseEvidenceNote: 'The checked Microservices.io footer states Copyright © 2026 Chris Richardson • All rights reserved; Tego Arch uses attribution, a link, and original factual summary only.',
    copyrightPolicy: 'facts-and-short-quotation', citationRoles: ['method', 'runtime-fact'],
    usageBoundary: 'Supports a sequence of local transactions, choreography or orchestration, compensation, lack of automatic rollback and isolation, and the database/message atomicity problem; it does not establish exactly-once delivery, automatic compensation, or production guarantees.',
    expectedApprovalNote: 'Reviewed canonical page identity, authorship, copyright footer, and healthy transport on 2026-08-11.',
    attribution: 'Saga pattern, Chris Richardson', usageMode: 'facts-summary', manifestPrimary: false,
  },
  {
    id: 'src-aws-decompose-business-capability',
    locator: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/decompose-business-capability.html',
    title: 'Decompose by business capability',
    author: 'Amazon Web Services', publishedAt: null,
    version: 'Current AWS Prescriptive Guidance page checked 2026-08-11',
    sourceKind: 'vendor-reference-architecture', tier: 'first-party',
    allowedRoles: ['comparison', 'method'], license: 'CC-BY-SA-4.0',
    licenseEvidenceUrl: 'https://aws.amazon.com/terms/', copyrightPolicy: 'adapt-sharealike-review',
    licenseScope: 'The named current AWS Prescriptive Guidance documentation page text under CC BY-SA 4.0; code under MIT-0, and linked works, images, service marks, and third-party material under separate notices excluded',
    licenseEvidenceNote: 'The AWS Site Terms state that documentation at docs.aws.amazon.com is licensed under CC BY-SA 4.0 and code in the documentation is licensed under MIT-0; this evidence applies to the named current Prescriptive Guidance page.',
    usageBoundary: 'Supports business-capability stability, domain understanding, domain-expert participation, and cross-functional team prerequisites; AWS-specific implementation choices and universal outcome claims are excluded.',
    expectedApprovalNote: 'Reviewed canonical identity, the AWS Site Terms CC BY-SA 4.0 documentation and MIT-0 code boundary, and healthy transport on 2026-08-11.',
    attribution: 'Decompose by business capability, Amazon Web Services',
    citationRoles: ['comparison', 'method'], usageMode: 'facts-summary', manifestPrimary: false,
  },
  {
    id: ILLUSTRATION_SOURCE_ID, locator: ILLUSTRATION_URL,
    title: '微服务订单 Saga 的独立部署、私有数据与恢复路径图',
    author: 'Tego Arch maintainers', publishedAt: null,
    version: 'Original Draw.io/SVG pair authored and checked on 2026-08-11',
    sourceKind: 'original-illustration', tier: 'primary', allowedRoles: ['illustration'],
    license: 'LicenseRef-Atlas-Original',
    licenseEvidenceUrl: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/sty-05-microservices-order-saga.svg',
    licenseScope: 'The named project-authored sty-05-microservices-order-saga.svg asset only',
    licenseEvidenceNote: 'The project-authored Draw.io/SVG pair contains no third-party reference image, icon, signature, watermark, brand visual, or copied composition.',
    copyrightPolicy: 'original-atlas',
    usageBoundary: 'Original teaching illustration of independent service deployment, private authoritative data, local transaction and Outbox boundaries, durable Saga state, payment reconciliation, compensation, poison-message isolation, and observability; it is illustration-only and does not establish production outcomes.',
    expectedApprovalNote: 'Approved the project-local original illustration locator after synchronized Draw.io/SVG semantics, contrast, geometry, and responsive QA on 2026-08-11.',
    attribution: '微服务订单 Saga 的独立部署、私有数据与恢复路径图，Tego Arch maintainers',
    modificationNote: 'Created as an original Draw.io and SVG pair for STY-05 without third-party reference imagery or copied composition.',
    citationRoles: ['illustration'], usageMode: 'original-illustration',
    manifestPrimary: false,
  },
].map((contract) => ({...contract, licenseFamilyId: contract.licenseFamilyId ?? contract.locator}));
const CLAIM_PROPOSITIONS = [
  {subject: /微服务/iu, predicate: /(?:由|按)代码行数定义/iu},
  {subject: /容器/iu, predicate: /(?:等于|就是|即为|当作|视为|成为)?微服务/iu},
  {subject: /远程调用/iu, predicate: /(?:等于|就是|即为|当作|视为|成为)?微服务/iu},
  {subject: /共享数据库/iu, predicate: /(?:任意|任何|所有)服务.{0,12}(?:直接)?写入/iu},
  {subject: /跨服务事务/iu, predicate: /(?:(?:天然|自动|默认|假定为).{0,4})?原子(?:性|事务)?/iu},
  {subject: /Saga/iu, predicate: /(?:(?:自动|天然).{0,6})?回滚.{0,10}外部副作用|外部副作用.{0,10}自动回滚机制/iu},
  {subject: /Outbox/iu, predicate: /(?:保证|确保|实现|宣称为).{0,8}(?:exactly[- ]once|恰好一次|仅一次)|(?:exactly[- ]once|恰好一次|仅一次).{0,8}(?:保证|确保)/iu},
  {subject: /支付结果未知/iu, predicate: /(?:(?:直接|立即|盲目|可以).{0,8})?重复(?:授权|扣款)/iu},
  {subject: /拆成服务/iu, predicate: /(?:(?:天然|自动|必然).{0,8})?(?:(?:获得|具备).{0,4})?故障隔离/iu},
];

const [ledger, licenseInventory, manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const article = documents.find(({file}) => `content/${file}` === ARTICLE);
const sty03 = documents.find(({file}) => file === 'styles/sty-03-vertical-slice-architecture.mdx');
const sty04 = documents.find(({file}) => file === 'styles/sty-04-modular-monolith.mdx');
const moduleBoundaries = documents.find(({file}) => file === 'paths/02-module-boundaries.mdx');

function internalLinksOf(document) {
  return extractInternalLinks({body: document.body});
}

function externalLinksOf(document) {
  return extractExternalLinks({body: document.body});
}

function predicateHasDirectNegation(segment, predicateStart) {
  const prefix = segment.slice(0, predicateStart);
  const negations = [...prefix.matchAll(/不应该|不应|不能|不会|并非|并不|不得|禁止|无法|不可|未能|绝非|不/gu)];
  const negation = negations.at(-1);
  if (!negation) return false;
  const bridge = prefix.slice(negation.index + negation[0].length).trim();
  return /^(?:(?:被|由|是|再|直接|立即|盲目|天然|自动|默认|允许|可以|必然|假定为|宣称为|视为|当作|获得|具备|都)\s*)*$/u
    .test(bridge);
}

function propositionClassifications(source, {subject, predicate}) {
  const results = [];
  for (const sentence of source.split(/[。！？!?；;\n]+/u).map((value) => value.trim()).filter(Boolean)) {
    let subjectActive = false;
    const segments = sentence.split(/(?:[，,]+|但(?:是)?|不过|然而|却|而且|并且|同时|也|仍然|仍|还)/u)
      .map((value) => value.trim()).filter(Boolean);
    for (const segment of segments) {
      const subjectMatch = subject.exec(segment);
      if (subjectMatch) subjectActive = true;
      if (!subjectActive) continue;
      const predicateMatch = predicate.exec(segment);
      if (!predicateMatch) continue;
      const propositionSpan = segment.slice(subjectMatch?.index ?? 0,
        predicateMatch.index + predicateMatch[0].length);
      results.push({
        classification: predicateHasDirectNegation(segment, predicateMatch.index) ? 'negated' : 'affirmative',
        propositionSpan,
      });
    }
  }
  return results;
}

function classifyProposition(source, proposition) {
  return propositionClassifications(source, proposition)[0] ?? null;
}

function assertNoProhibitedClaims(source) {
  for (const [index, proposition] of CLAIM_PROPOSITIONS.entries()) {
    for (const result of propositionClassifications(source, proposition)) {
      assert.notEqual(result?.classification, 'affirmative',
        `prohibited proposition ${index + 1}: ${result.propositionSpan}`);
    }
  }
}

function visibleSectionBlocks(blocks, heading, nextHeading) {
  const start = blocks.findIndex(({text}) => text.trim() === heading);
  assert.ok(start >= 0, `${heading} visible section`);
  const relativeEnd = nextHeading
    ? blocks.slice(start + 1).findIndex(({text}) => text.trim() === nextHeading)
    : -1;
  const end = relativeEnd < 0 ? blocks.length : start + 1 + relativeEnd;
  assert.ok(end > start + 1, `${heading} visible section body`);
  return blocks.slice(start + 1, end);
}

function assertCompoundVisibleBlock(blocks, label, patterns) {
  assert.ok(blocks.some(({text}) => patterns.every((pattern) => pattern.test(text))), label);
}

function assertArticleLiteralContract(source) {
  const metadata = parseFrontMatter(source);
  const semanticFrontMatter = parseMdxVisibleCopy(source, ARTICLE).frontMatter;
  const semanticSummary = semanticFrontMatter.find(({field}) => field === 'summary')?.text;
  assert.deepEqual({...metadata, summary: semanticSummary}, EXPECTED_METADATA, 'exact STY-05 front matter');
  assert.equal(source.split(`summary: ${SUMMARY}`).length - 1, 1, 'exact literal summary line');
  const diagramWrappers = [...source.matchAll(/<div\b[^>]*className="architecture-diagram-scroll"[^>]*>/gu)]
    .map(([tag]) => tag);
  const tableWrappers = [...source.matchAll(/<div\b[^>]*className="table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner"[^>]*>/gu)]
    .map(([tag]) => tag);
  const wrappers = [...diagramWrappers, ...tableWrappers];
  assert.equal(diagramWrappers.length, 1, 'exactly one architecture diagram wrapper');
  assert.equal(tableWrappers.length, 2, 'exactly two governed table wrappers');
  assert.ok(diagramWrappers[0].includes(`aria-label="${DIAGRAM_ARIA}"`), 'exact diagram aria-label');
  assert.equal(source.split(`![${DIAGRAM_ALT}](${ILLUSTRATION_URL})`).length - 1, 1, 'exact diagram alt text');
  assert.equal(source.split(`**${SCENARIO_LABEL}：**`).length - 1, 1, 'exact scenario label');
  assert.equal(wrappers.length, 3, 'exactly three keyboard-scroll wrappers');
  for (const [index, tag] of wrappers.entries()) {
    assert.match(tag, /(?:^|\s)role="region"(?=\s|>)/u,
      `keyboard-scroll wrapper ${index + 1} exposes a region role`);
    assert.match(tag, /(?:^|\s)tabIndex=\{0\}(?=\s|>)/u,
      `keyboard-scroll wrapper ${index + 1} is keyboard focusable`);
  }
  assert.ok(wrappers.every((tag) => tag.includes('onKeyDown={handleHorizontalArrowKey}')),
    'every diagram/table wrapper binds handleHorizontalArrowKey');
  assert.equal(source.match(/onKeyDown=\{handleHorizontalArrowKey\}/gu)?.length, 3,
    'no extra or missing horizontal-arrow handler bindings');
}

function licenseInventoryRows(markdown) {
  const rows = [];
  for (const line of markdown.split(/\r?\n/u)) {
    if (!line.trim().startsWith('|') || !line.trim().endsWith('|')) continue;
    const cells = line.trim().slice(1, -1).split('|').map((cell) => cell.trim());
    if (cells.length !== 11 || cells[0] === 'source_family' || /^:?-{3,}:?$/u.test(cells[0])) continue;
    rows.push({
      source_family: cells[0],
      current_urls: cells[1].split(/\s*<br\s*\/?>\s*/iu).filter(Boolean),
      license_evidence_url: cells[3],
      exact_license: cells[6],
      family_grouping: cells[9],
    });
  }
  return rows;
}

function xmlAttributes(source) {
  return new Map([...source.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value]));
}

function decodeXmlText(value) {
  return value.replace(/&amp;/gu, '&').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"').replace(/&#39;/gu, "'");
}

function visibleDrawioCells(source) {
  return [...source.matchAll(/<mxCell\b[^>]*>/gu)].map(([tag]) => {
    const attributes = xmlAttributes(tag);
    const style = attributes.get('style') ?? '';
    if (attributes.get('visible') === '0' || /(?:^|;)\s*(?:opacity=0|visible=0)(?:;|$)/u.test(style)) return null;
    return {attributes, label: decodeXmlText(attributes.get('value') ?? '')};
  }).filter(Boolean);
}

function drawioDiagramContract(source) {
  const cells = visibleDrawioCells(source);
  const typeCells = cells.filter(({attributes}) => attributes.get('dataRole') === 'type');
  const typesByParent = new Map(typeCells.map(({attributes, label}) => [attributes.get('parent'), label]));
  return {
    nodes: cells.filter(({attributes}) => attributes.get('vertex') === '1' && attributes.get('dataRole') !== 'type')
      .map(({attributes, label}) => ({
        id: attributes.get('id'), label, visibleTypeLabel: typesByParent.get(attributes.get('id')) ?? '',
      })),
    typeCells,
    edges: cells.filter(({attributes}) => attributes.get('edge') === '1')
      .map(({attributes, label}) => ({
        id: attributes.get('id'), label, source: attributes.get('source'), target: attributes.get('target'),
        style: attributes.get('style') ?? '',
      })),
  };
}

function svgDiagramContract(source) {
  const nodes = [...source.matchAll(/<g\b([^>]*)data-node-id="([^"]+)"([^>]*)>([\s\S]*?)<\/g>/gu)]
    .map(([, before, id, after, contents]) => ({
      id,
      label: decodeXmlText((contents.match(/<text\b[^>]*data-text-role="title"[^>]*>([\s\S]*?)<\/text>/u)?.[1] ?? '')
        .replace(/<[^>]+>/gu, '')),
      typeLabel: decodeXmlText(xmlAttributes(`${before}${after}`).get('data-type-label') ?? ''),
      visibleTypeLabel: decodeXmlText((contents.match(/<text\b[^>]*data-text-role="type"[^>]*>([\s\S]*?)<\/text>/u)?.[1] ?? '')
        .replace(/<[^>]+>/gu, '')),
    }));
  const labels = new Map([...source.matchAll(/<text\b[^>]*data-edge-id="([^"]+)"[^>]*>([^<]*)<\/text>/gu)]
    .map(([, id, label]) => [id, decodeXmlText(label).trim()]));
  const edges = [...source.matchAll(/<path\b([^>]*)data-edge-id="([^"]+)"([^>]*)>/gu)]
    .map(([, before, id, after]) => {
      const attributes = xmlAttributes(`${before}${after}`);
      return {id, label: labels.get(id) ?? '', source: attributes.get('data-source'),
        target: attributes.get('data-target'), className: attributes.get('class') ?? ''};
    });
  return {nodes, edges};
}

function cellGeometry(source, id, format) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  if (format === 'drawio') {
    const block = source.match(new RegExp(`<mxCell\\b[^>]*\\bid="${escapedId}"[^>]*>([\\s\\S]*?)<\\/mxCell>`, 'u'))?.[1];
    assert.ok(block, `Draw.io geometry ${id}`);
    const geometry = xmlAttributes(block.match(/<mxGeometry\b([^>]*)\/?>(?:<\/mxGeometry>)?/u)?.[1] ?? '');
    return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(geometry.get(key))]));
  }
  const bounds = source.match(new RegExp(`<g\\b[^>]*data-node-id="${escapedId}"[^>]*data-node-bounds="([^"]+)"`, 'u'))?.[1];
  assert.ok(bounds, `SVG geometry ${id}`);
  const [x, y, width, height] = bounds.split(/\s+/u).map(Number);
  return {x, y, width, height};
}

function drawioEdgeRoute(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const blockMatch = source.match(new RegExp(`(<mxCell\\b[^>]*\\bid="${escapedId}"[^>]*>)([\\s\\S]*?)<\\/mxCell>`, 'u'));
  assert.ok(blockMatch, `Draw.io edge route ${id}`);
  const attributes = xmlAttributes(blockMatch[1]);
  const sourceBounds = cellGeometry(source, attributes.get('source'), 'drawio');
  const targetBounds = cellGeometry(source, attributes.get('target'), 'drawio');
  const waypoints = [...blockMatch[2].matchAll(/<mxPoint\b([^>]*)\/>/gu)].map(([, raw]) => {
    const point = xmlAttributes(raw);
    return {x: Number(point.get('x')), y: Number(point.get('y'))};
  });
  return [
    {x: Number(attributes.get('routeSourceX') ?? sourceBounds.x + sourceBounds.width / 2),
      y: Number(attributes.get('routeSourceY') ?? sourceBounds.y + sourceBounds.height / 2)},
    ...waypoints,
    {x: Number(attributes.get('routeTargetX') ?? targetBounds.x + targetBounds.width / 2),
      y: Number(attributes.get('routeTargetY') ?? targetBounds.y + targetBounds.height / 2)},
  ];
}

function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}

function overlaps(first, second) {
  return first.x < second.x + second.width && first.x + first.width > second.x &&
    first.y < second.y + second.height && first.y + first.height > second.y;
}

function cssDeclarations(source) {
  return new Map(source.split(';').map((value) => value.trim()).filter(Boolean).map((declaration) => {
    const split = declaration.indexOf(':');
    return [declaration.slice(0, split).trim(), declaration.slice(split + 1).trim()];
  }));
}

function svgPresentationValue(source, elementName, attributesSource, property, inheritedClasses = []) {
  const attributes = xmlAttributes(attributesSource);
  const inline = cssDeclarations(attributes.get('style') ?? '').get(property);
  if (inline !== undefined) return inline;
  const classes = new Set([...inheritedClasses, ...(attributes.get('class') ?? '').split(/\s+/u).filter(Boolean)]);
  let resolved = attributes.get(property);
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      const value = cssDeclarations(declarations).get(property);
      if (value === undefined) continue;
      for (const rawSelector of selectors.split(',')) {
        const selector = rawSelector.trim();
        if (/^[a-z][\w-]*/iu.test(selector) && !selector.startsWith(elementName)) continue;
        const required = [...selector.matchAll(/\.([\w-]+)/gu)].map(([, className]) => className);
        if (required.every((className) => classes.has(className))) resolved = value;
      }
    }
  }
  return resolved?.replace(/\s*!important\s*$/iu, '');
}

function strokeDashKind(value) {
  if (value?.trim().toLowerCase() === 'none') return 'solid';
  const values = value?.trim().split(/[\s,]+/u) ?? [];
  if (values.length === 0 || values.some((item) => !/^\d+(?:\.\d+)?(?:px)?$/u.test(item))) return 'invalid';
  return values.some((item) => Number.parseFloat(item) > 0) ? 'dashed' : 'invalid';
}

function svgEdgeDashArray(source, id) {
  const edge = source.match(new RegExp(`<path\\b([^>]*)data-edge-id="${id}"([^>]*)>`, 'u'));
  assert.ok(edge, `SVG edge ${id}`);
  return svgPresentationValue(source, 'path', `${edge[1]}${edge[2]}`, 'stroke-dasharray');
}

function normalizeHexColor(value) {
  const match = value?.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/iu);
  assert.ok(match, `opaque hex color ${String(value)}`);
  return `#${match[1].length === 3 ? [...match[1]].map((item) => item.repeat(2)).join('') : match[1]}`.toUpperCase();
}

function luminance(color) {
  const channels = normalizeHexColor(color).slice(1).match(/.{2}/gu).map((item) => Number.parseInt(item, 16) / 255)
    .map((item) => item <= 0.04045 ? item / 12.92 : ((item + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(left, right) {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function assertEssentialContrast(source) {
  const canvas = source.match(/<rect\b([^>]*)data-canvas-role="background"([^>]*)>/u);
  assert.ok(canvas, 'opaque canvas');
  const canvasColor = normalizeHexColor(svgPresentationValue(source, 'rect', `${canvas[1]}${canvas[2]}`, 'fill'));
  assert.equal(canvasColor, '#FFFFFF');
  for (const [id, , , , connectorClass] of DIAGRAM_EDGES) {
    const edge = source.match(new RegExp(`<path\\b([^>]*)data-edge-id="${id}"([^>]*)>`, 'u'));
    const label = source.match(new RegExp(`<text\\b([^>]*)data-edge-id="${id}"([^>]*)>`, 'u'));
    assert.ok(edge && label, `${id} edge and label`);
    const edgeColor = svgPresentationValue(source, 'path', `${edge[1]}${edge[2]}`, 'stroke');
    const labelColor = svgPresentationValue(source, 'text', `${label[1]}${label[2]}`, 'fill');
    assert.ok(contrastRatio(edgeColor, canvasColor) >= 3, `${connectorClass} edge ${id} contrast`);
    assert.ok(contrastRatio(labelColor, canvasColor) >= 4.5, `edge label ${id} contrast`);
  }
}

function parseOrthogonalPath(data) {
  const tokens = data.match(/[MHV]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? [];
  const points = [];
  let cursor = 0;
  let x = 0;
  let y = 0;
  while (cursor < tokens.length) {
    const command = tokens[cursor];
    cursor += 1;
    if (command === 'M') {
      x = Number(tokens[cursor]);
      y = Number(tokens[cursor + 1]);
      cursor += 2;
    } else if (command === 'H') {
      x = Number(tokens[cursor]);
      cursor += 1;
    } else if (command === 'V') {
      y = Number(tokens[cursor]);
      cursor += 1;
    } else {
      throw new Error(`Unsupported path command ${command}`);
    }
    points.push({x, y});
  }
  assert.ok(points.length >= 2, `orthogonal connector has at least two points: ${data}`);
  return points;
}

function primaryHorizontalLane(points) {
  const horizontal = points.slice(1).map((point, index) => ({
    end: point,
    length: Math.abs(point.x - points[index].x),
    start: points[index],
  })).filter(({end, length, start}) => end.y === start.y && length > 0);
  assert.ok(horizontal.length > 0, 'connector has a horizontal routing lane');
  return horizontal.sort((left, right) => right.length - left.length)[0];
}

function positiveSegments(points) {
  return points.slice(1).map((end, index) => ({end, start: points[index]}))
    .filter(({end, start}) => end.x !== start.x || end.y !== start.y);
}

function collinearOverlapLength(left, right) {
  if (left.start.y === left.end.y && right.start.y === right.end.y && left.start.y === right.start.y) {
    return Math.max(0, Math.min(Math.max(left.start.x, left.end.x), Math.max(right.start.x, right.end.x)) -
      Math.max(Math.min(left.start.x, left.end.x), Math.min(right.start.x, right.end.x)));
  }
  if (left.start.x === left.end.x && right.start.x === right.end.x && left.start.x === right.start.x) {
    return Math.max(0, Math.min(Math.max(left.start.y, left.end.y), Math.max(right.start.y, right.end.y)) -
      Math.max(Math.min(left.start.y, left.end.y), Math.min(right.start.y, right.end.y)));
  }
  return 0;
}

function assertNoPositiveSegmentOverlap(connectorTags) {
  const routes = [...connectorTags].map(([id, tag]) => ({
    className: xmlAttributes(tag).get('class') ?? '',
    id,
    segments: positiveSegments(parseOrthogonalPath(xmlAttributes(tag).get('d') ?? '')),
  }));
  for (let left = 0; left < routes.length; left += 1) {
    for (let right = left + 1; right < routes.length; right += 1) {
      for (const leftSegment of routes[left].segments) {
        for (const rightSegment of routes[right].segments) {
          const overlap = collinearOverlapLength(leftSegment, rightSegment);
          assert.equal(overlap, 0,
            `${routes[left].id} (${routes[left].className}) and ${routes[right].id} (${routes[right].className}) segment overlap ${overlap}`);
        }
      }
    }
  }
}

function conservativeTextWidth(text, fontSize) {
  return [...text].reduce((width, character) => {
    if (/\p{Script=Han}/u.test(character)) return width + fontSize;
    if (/\s/u.test(character)) return width + fontSize * 0.33;
    if (character === '/') return width + fontSize * 0.4;
    return width + fontSize * 0.6;
  }, 0);
}

function labelBounds(tag, label, fontSize) {
  const attributes = xmlAttributes(tag);
  const x = Number(attributes.get('x'));
  const bottom = Number(attributes.get('y'));
  const width = conservativeTextWidth(label, fontSize);
  const anchor = attributes.get('text-anchor') || 'start';
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return {bottom, left, right: left + width, top: bottom - fontSize};
}

function svgTextLineBounds(svg, contents, role) {
  const block = contents.match(new RegExp(`(<text\\b[^>]*data-text-role="${role}"[^>]*>)([\\s\\S]*?)<\\/text>`, 'u'));
  assert.ok(block, `${role} text block`);
  const textAttributes = xmlAttributes(block[1]);
  const fontSize = Number.parseFloat(svgPresentationValue(svg, 'text', block[1], 'font-size'));
  const inheritedX = Number(textAttributes.get('x'));
  const inheritedY = Number(textAttributes.get('y'));
  const inheritedAnchor = textAttributes.get('text-anchor') || 'start';
  const tspans = [...block[2].matchAll(/<tspan\b([^>]*)>([^<]*)<\/tspan>/gu)];
  const lines = tspans.length > 0 ? tspans.map(([, raw, value]) => {
    const attributes = xmlAttributes(raw);
    return {anchor: attributes.get('text-anchor') || inheritedAnchor, text: decodeXmlText(value),
      x: Number(attributes.get('x') ?? inheritedX), y: Number(attributes.get('y') ?? inheritedY)};
  }) : [{anchor: inheritedAnchor, text: decodeXmlText(block[2]), x: inheritedX, y: inheritedY}];
  return lines.map(({anchor, text, x, y}) => {
    const width = conservativeTextWidth(text.trimEnd(), fontSize);
    const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
    return {bottom: y, left, right: left + width, top: y - fontSize};
  });
}

function rectangleDistance(first, second) {
  const horizontal = Math.max(second.left - first.right, first.left - second.right, 0);
  const vertical = Math.max(second.top - first.bottom, first.top - second.bottom, 0);
  return Math.hypot(horizontal, vertical);
}

function assertPoisonTextGeometry(svg, renderedScale) {
  const match = svg.match(/<g\b[^>]*data-node-id="poison-message-isolation"[^>]*data-node-bounds="([^"]+)"[^>]*>([\s\S]*?)<\/g>/u);
  assert.ok(match, 'poison recovery node');
  const [x, y, width, height] = match[1].split(/\s+/u).map(Number);
  const outline = match[2].match(/<rect\b([^>]*)>/u);
  assert.ok(outline, 'poison recovery outline');
  const halfStroke = Number(svgPresentationValue(svg, 'rect', outline[1], 'stroke-width')) / 2;
  const titleLines = svgTextLineBounds(svg, match[2], 'title');
  const typeLines = svgTextLineBounds(svg, match[2], 'type');
  for (const [role, lines] of [['title', titleLines], ['type', typeLines]]) {
    for (const bounds of lines) {
      const horizontalPadding = Math.min(bounds.left - x - halfStroke, x + width - halfStroke - bounds.right) * renderedScale;
      assert.ok(horizontalPadding >= 12, `poison ${role} horizontal inner-stroke padding ${horizontalPadding}`);
    }
  }
  const topPadding = (titleLines[0].top - y - halfStroke) * renderedScale;
  const bottomPadding = (y + height - halfStroke - typeLines.at(-1).bottom) * renderedScale;
  const titleTypeGap = (typeLines[0].bottom - titleLines.at(-1).bottom) * renderedScale;
  assert.ok(topPadding >= 14, `poison title top padding ${topPadding}`);
  assert.ok(bottomPadding >= 14, `poison type bottom padding ${bottomPadding}`);
  assert.ok(titleTypeGap >= 22, `poison title/type baseline separation ${titleTypeGap}`);
}

function expandedRectangle(rectangle, expansion) {
  return {bottom: rectangle.bottom + expansion, left: rectangle.left - expansion,
    right: rectangle.right + expansion, top: rectangle.top - expansion};
}

function boundaryStrokeDistance(label, boundary, strokeWidth) {
  const inside = label.left >= boundary.left && label.right <= boundary.right &&
    label.top >= boundary.top && label.bottom <= boundary.bottom;
  if (!inside) return rectangleDistance(label, expandedRectangle(boundary, strokeWidth / 2));
  return Math.min(
    label.left - boundary.left - strokeWidth / 2,
    boundary.right - strokeWidth / 2 - label.right,
    label.top - boundary.top - strokeWidth / 2,
    boundary.bottom - strokeWidth / 2 - label.bottom,
  );
}

function segmentDistance(label, start, end) {
  return rectangleDistance(label, {bottom: Math.max(start.y, end.y), left: Math.min(start.x, end.x),
    right: Math.max(start.x, end.x), top: Math.min(start.y, end.y)});
}

function projectedInterval(points, axis) {
  const values = points.map((point) => point.x * axis.x + point.y * axis.y);
  return {maximum: Math.max(...values), minimum: Math.min(...values)};
}

function intervalGap(first, second) {
  return Math.max(second.minimum - first.maximum, first.minimum - second.maximum);
}

function markerGeometry(svg, connectorTag, points) {
  const markerId = svgPresentationValue(svg, 'path', connectorTag, 'marker-end')
    ?.match(/^url\(#([^)]+)\)$/u)?.[1];
  assert.ok(markerId, 'connector marker-end');
  const markerBlock = svg.match(new RegExp(`<marker\\b[^>]*\\bid="${markerId}"[^>]*>[\\s\\S]*?<\\/marker>`, 'u'))?.[0] ?? '';
  const markerTag = markerBlock.match(/<marker\b[^>]*>/u)?.[0] ?? '';
  const markerPath = markerBlock.match(/<path\b[^>]*>/u)?.[0] ?? '';
  const markerAttributes = xmlAttributes(markerTag);
  const coordinates = (xmlAttributes(markerPath).get('d')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number);
  const endpoint = points.at(-1);
  const previous = points.at(-2);
  const magnitude = Math.hypot(endpoint.x - previous.x, endpoint.y - previous.y);
  const axis = {x: (endpoint.x - previous.x) / magnitude, y: (endpoint.y - previous.y) / magnitude};
  const perpendicular = {x: -axis.y, y: axis.x};
  const viewBox = (markerAttributes.get('viewBox') ?? '').split(/\s+/u).map(Number);
  const scale = Number(markerAttributes.get('markerWidth')) / viewBox[2] *
    Number(svgPresentationValue(svg, 'path', connectorTag, 'stroke-width'));
  assert.ok(Number.isFinite(scale) && scale > 0, `${markerId} marker scale`);
  const refX = Number(markerAttributes.get('refX'));
  const refY = Number(markerAttributes.get('refY'));
  const markerPoints = [];
  for (let index = 0; index < coordinates.length; index += 2) {
    markerPoints.push({
      x: endpoint.x + axis.x * (coordinates[index] - refX) * scale +
        perpendicular.x * (coordinates[index + 1] - refY) * scale,
      y: endpoint.y + axis.y * (coordinates[index] - refX) * scale +
        perpendicular.y * (coordinates[index + 1] - refY) * scale,
    });
  }
  assert.ok(markerPoints.length >= 3 && markerPoints.every(({x: pointX, y: pointY}) =>
    Number.isFinite(pointX) && Number.isFinite(pointY)), `${markerId} marker geometry`);
  return {axis, points: markerPoints};
}

function assertMarkerOutsideTargetFill(svg, connectorTag, targetRectangle, renderedScale, edgeId) {
  const points = parseOrthogonalPath(xmlAttributes(connectorTag).get('d') ?? '');
  const marker = markerGeometry(svg, connectorTag, points);
  const clearance = Math.min(...marker.points.map(({x, y}) => rectangleDistance(
    {bottom: y, left: x, right: x, top: y}, targetRectangle,
  ))) * renderedScale;
  assert.ok(clearance >= 2, `${edgeId} marker-to-target-fill visibility clearance ${clearance}`);
  return clearance;
}

function assertLegendClearance(svg, connectorTags, renderedScale) {
  const connectorSegments = [...connectorTags.values()].flatMap((tag) => {
    const points = parseOrthogonalPath(xmlAttributes(tag).get('d') ?? '');
    const halfStroke = Number(svgPresentationValue(svg, 'path', tag, 'stroke-width')) / 2;
    return points.slice(1).map((point, index) => ({end: point, halfStroke, start: points[index]}));
  });
  let minimumConnectorClearance = Number.POSITIVE_INFINITY;
  let minimumMarkerClearance = Number.POSITIVE_INFINITY;
  let minimumForeignKeyClearance = Number.POSITIVE_INFINITY;
  let minimumCaptionClearance = Number.POSITIVE_INFINITY;
  const keys = new Map();
  for (const kind of ['sync', 'message', 'compensation']) {
    const group = svg.match(new RegExp(`<g\\b[^>]*data-legend-line="${kind}"[^>]*>([\\s\\S]*?)<\\/g>`, 'u'))?.[1] ?? '';
    const keyTag = group.match(/<path\b[^>]*>/u)?.[0] ?? '';
    assert.ok(keyTag, `${kind} legend path`);
    const keyPoints = parseOrthogonalPath(xmlAttributes(keyTag).get('d') ?? '');
    const keyHalfStroke = Number(svgPresentationValue(svg, 'path', keyTag, 'stroke-width')) / 2;
    const caption = svg.match(new RegExp(`(<text\\b[^>]*data-legend-for="${kind}"[^>]*>)([^<]+)<\\/text>`, 'u'));
    assert.ok(caption, `${kind} legend caption`);
    const fontSize = Number.parseFloat(svgPresentationValue(svg, 'text', caption[1], 'font-size'));
    const bounds = labelBounds(caption[1], decodeXmlText(caption[2]), fontSize);
    const marker = markerGeometry(svg, keyTag, keyPoints);
    keys.set(kind, {halfStroke: keyHalfStroke, marker, points: keyPoints});
    const markerGap = intervalGap(projectedInterval(marker.points, marker.axis), projectedInterval([
      {x: bounds.left, y: bounds.top}, {x: bounds.right, y: bounds.top},
      {x: bounds.left, y: bounds.bottom}, {x: bounds.right, y: bounds.bottom},
    ], marker.axis)) * renderedScale;
    minimumMarkerClearance = Math.min(minimumMarkerClearance, markerGap);
    assert.ok(markerGap >= 16, `${kind} legend marker-to-caption clearance ${markerGap}`);
    for (const segment of connectorSegments) {
      const captionGap = (segmentDistance(bounds, segment.start, segment.end) - segment.halfStroke) * renderedScale;
      const keyGap = (segmentDistance({bottom: keyPoints[0].y, left: keyPoints[0].x,
        right: keyPoints[1].x, top: keyPoints[0].y}, segment.start, segment.end) - keyHalfStroke - segment.halfStroke) * renderedScale;
      minimumConnectorClearance = Math.min(minimumConnectorClearance, captionGap, keyGap);
      assert.ok(captionGap >= 12, `${kind} legend caption-to-connector clearance ${captionGap}`);
      assert.ok(keyGap >= 12, `${kind} legend key-to-connector clearance ${keyGap}`);
    }
  }
  const captions = [...svg.matchAll(/(<text\b[^>]*data-legend-entry="([^"]+)"[^>]*>)([^<]+)<\/text>/gu)]
    .map(([, tag, id, value]) => {
      const fontSize = Number.parseFloat(svgPresentationValue(svg, 'text', tag, 'font-size'));
      return {bounds: labelBounds(tag, decodeXmlText(value), fontSize), id};
    });
  assert.equal(captions.length, 5, 'five measured legend captions');
  for (let left = 0; left < captions.length; left += 1) {
    for (let right = left + 1; right < captions.length; right += 1) {
      const gap = rectangleDistance(captions[left].bounds, captions[right].bounds) * renderedScale;
      minimumCaptionClearance = Math.min(minimumCaptionClearance, gap);
      assert.ok(gap >= 8, `${captions[left].id}/${captions[right].id} legend caption clearance ${gap}`);
    }
    for (const [kind, key] of keys) {
      if (captions[left].id === kind) continue;
      const keyGap = (Math.min(...key.points.slice(1).map((point, index) =>
        segmentDistance(captions[left].bounds, key.points[index], point))) - key.halfStroke) * renderedScale;
      const markerGap = Math.min(...key.marker.points.map(({x, y}) => rectangleDistance(captions[left].bounds,
        {bottom: y, left: x, right: x, top: y}))) * renderedScale;
      minimumForeignKeyClearance = Math.min(minimumForeignKeyClearance, keyGap);
      minimumMarkerClearance = Math.min(minimumMarkerClearance, markerGap);
      assert.ok(keyGap >= 12, `${captions[left].id} caption-to-${kind}-key clearance ${keyGap}`);
      assert.ok(markerGap >= 16, `${captions[left].id} caption-to-${kind}-marker clearance ${markerGap}`);
    }
  }
  return {minimumCaptionClearance, minimumConnectorClearance, minimumForeignKeyClearance, minimumMarkerClearance};
}

test('publishes exact STY-05 metadata, headings, and actionable relations', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  assertArticleLiteralContract(article.source);
  const metadata = parseFrontMatter(article.source);
  assert.equal(metadata.topic_id, TOPIC_ID);
  assert.equal(metadata.slug, ROUTE);
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.priority, 'P0');
  assert.deepEqual(metadata.depends_on, ['STY-00', 'STY-04']);
  assert.deepEqual(metadata.adjacent_topics, ADJACENT_TOPICS);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(findMarkdownHeadings(article.body).map(({text}) => text), REQUIRED_HEADINGS);
  const links = internalLinksOf(article);
  assert.ok(links.includes('/styles'), 'visible parent /styles');
  for (const route of [...ADJACENT_ROUTES, '/cases/micro-frontends-single-spa']) {
    assert.ok(links.includes(route), `visible relation ${route}`);
  }
  assert.equal(links.includes('/styles/sty-06'), false, 'STY-06 stays non-actionable');
  assert.ok(sty03 && parseFrontMatter(sty03.source).adjacent_topics.includes(TOPIC_ID), 'STY-03 reciprocal metadata');
  assert.ok(sty03 && internalLinksOf(sty03).includes(ROUTE), 'STY-03 reciprocal route');
  assert.ok(sty04 && parseFrontMatter(sty04.source).adjacent_topics.includes(TOPIC_ID), 'STY-04 reciprocal metadata');
  assert.ok(sty04 && internalLinksOf(sty04).includes(ROUTE), 'STY-04 reciprocal route');
  assert.ok(moduleBoundaries && internalLinksOf(moduleBoundaries).includes(ROUTE), 'module-boundaries path route');
});

test('rejects changed STY-05 labels and incomplete keyboard-scroll semantics', () => {
  assert.ok(article);
  const mutations = [
    article.source.replace(DIAGRAM_ARIA, DIAGRAM_ARIA.replace('Saga', '长事务')),
    article.source.replace(DIAGRAM_ALT, DIAGRAM_ALT.replace('持久 Saga', '持久流程')),
    article.source.replace(SCENARIO_LABEL, '说明性场景（本站分析）'),
    article.source.replace('onKeyDown={handleHorizontalArrowKey}', ''),
    article.source.replace(' role="region"', ''),
    article.source.replace('role="region"', 'role="group"'),
    article.source.replace(' tabIndex={0}', ''),
    article.source.replace('tabIndex={0}', 'tabIndex={-1}'),
    article.source.replace('[架构风格目录](/styles)', '架构风格目录'),
    article.source.replace('[架构风格目录](/styles)', '[架构风格目录](/stylez)'),
  ];
  for (const [index, mutation] of mutations.entries()) {
    assert.notEqual(mutation, article.source, `article literal mutation ${index + 1} applies`);
    assert.throws(() => {
      assertArticleLiteralContract(mutation);
      assert.match(mutation, /\[架构风格目录\]\(\/styles\)/u, 'visible parent /styles');
    }, {name: 'AssertionError'}, `article literal mutation ${index + 1} is rejected`);
  }
});

test('locks microservice boundaries, the order Saga, and owned runtime responsibility', () => {
  assert.ok(article);
  const visibleBlocks = parseMdxVisibleCopy(article.source, ARTICLE, {includeStructure: true}).blocks;
  const visible = visibleBlocks.map(({text}) => text).join('\n');
  for (const requirement of [
    /业务能力|稳定子域/u, /稳定合同/u, /独立部署/u, /独立回滚/u, /锁步发布/u,
    /私有权威数据|权威状态.*唯一服务所有者/u, /禁止.*(?:共享表|跨服务直接写库|跨库连接)/u,
    /本地事务/u, /Outbox/u, /持久.*Saga|Saga.*持久/u, /稳定幂等键/u,
    /重复/u, /乱序/u, /部分成功/u, /毒消息/u, /补偿/u, /查询|对账/u, /人工终止/u,
    /支付结果未知|结果未知/u, /不(?:盲目|直接)重复(?:授权|扣款)/u,
    /服务合同.*数据.*部署.*值守.*恢复.*成本|端到端.*(?:值守|恢复)/u,
    /平台.*(?:不拥有|不能拥有).*业务状态/u,
  ]) assert.match(visible, requirement, `semantic contract ${requirement}`);
  const consistency = visibleSectionBlocks(visibleBlocks, '数据所有权与一致性', '部署单元与故障域');
  assertCompoundVisibleBlock(consistency, 'state and Outbox commit in the same local transaction', [
    /本地事务/u, /(?:同一|同一个|原子地).{0,12}(?:Outbox|发件箱)|(?:Outbox|发件箱).{0,12}(?:同一|同一个|原子地)/u,
  ]);
  assertCompoundVisibleBlock(consistency, 'unknown payment result reconciles before another side effect', [
    /支付.{0,8}结果未知|未知.{0,8}支付结果/u, /查询|对账/u, /(?:禁止|不得|不能|不).{0,12}重复(?:授权|扣款)/u,
  ]);
  const deployment = visibleSectionBlocks(visibleBlocks, '部署单元与故障域', '团队拓扑');
  assertCompoundVisibleBlock(deployment, 'independent deployment includes rollback and rejects lockstep release', [
    /独立部署/u, /独立回滚|回滚.{0,8}独立|独立.{0,8}回滚/u,
    /(?:不能|不得|不应|并非|禁止).{0,16}锁步发布|锁步发布.{0,16}(?:不能|不得|不应|并非|禁止)/u,
  ]);
  assertCompoundVisibleBlock(deployment, 'distributed failure paragraph owns timeout, partial failure, backlog, and isolation', [
    /网络超时/u, /部分成功|部分失败/u, /积压|背压/u, /隔离/u, /所有者|负责/u,
  ]);
  const teamTopology = visibleSectionBlocks(visibleBlocks, '团队拓扑', '质量属性收益与成本');
  assertCompoundVisibleBlock(teamTopology, 'service owner owns observability and security while platform owns no business state', [
    /(?:服务所有者|跨职能团队).{0,32}(?:负责|拥有|承担).{0,32}(?:日志|指标|追踪|可观测)|(?:日志|指标|追踪|可观测).{0,32}由(?:服务所有者|跨职能团队)(?:负责|拥有|承担)/u,
    /安全/u,
    /平台.{0,16}(?:不拥有|不能拥有|不得拥有).{0,8}业务状态/u,
  ]);
  assertNoProhibitedClaims(visible);
});

test('prohibited claim mutations are rejected while explicit boundaries remain expressible', () => {
  assert.equal(PROHIBITED.length, CLAIM_PROPOSITIONS.length);
  assert.equal(ACCEPTED_DENIALS.length, CLAIM_PROPOSITIONS.length);
  assert.equal(MIXED_AFFIRMATIVE_VIOLATIONS.length, CLAIM_PROPOSITIONS.length);
  for (let index = 0; index < PROHIBITED.length; index += 1) {
    assert.equal(classifyProposition(PROHIBITED[index], CLAIM_PROPOSITIONS[index])?.classification,
      'affirmative', PROHIBITED[index]);
    assert.throws(() => assertNoProhibitedClaims(PROHIBITED[index]), {name: 'AssertionError'}, PROHIBITED[index]);
    for (const denial of ACCEPTED_DENIALS[index]) {
      assert.equal(classifyProposition(denial, CLAIM_PROPOSITIONS[index])?.classification, 'negated', denial);
      const visibleDenial = parseMdxVisibleCopy(`## 边界\n\n${denial}\n`, 'visible-denial-fixture.mdx')
        .blocks.map(({text}) => text).join('\n');
      assert.doesNotThrow(() => assertNoProhibitedClaims(visibleDenial), denial);
    }
    const mixedViolation = MIXED_AFFIRMATIVE_VIOLATIONS[index];
    const mixedVisible = parseMdxVisibleCopy(`## 边界\n\n${mixedViolation}\n`, 'mixed-violation-fixture.mdx')
      .blocks.map(({text}) => text).join('\n');
    assert.ok(propositionClassifications(mixedVisible, CLAIM_PROPOSITIONS[index])
      .some(({classification}) => classification === 'affirmative'), mixedViolation);
    assert.throws(() => assertNoProhibitedClaims(mixedVisible), {name: 'AssertionError'}, mixedViolation);
  }
});

test('parses the current license inventory source-family and URL columns', () => {
  const inventoryRows = licenseInventoryRows(licenseInventory);
  for (const sourceId of [
    'src-fowler-monolith-first',
    'src-spring-modulith-fundamentals',
    'src-spring-modulith-events',
    'src-atlas-sty04-modular-monolith-boundaries',
  ]) {
    const source = ledger.sources.find(({id}) => id === sourceId);
    assert.ok(source, `${sourceId} Batch-5 source record`);
    const row = inventoryRows.find(({source_family}) => source_family === source.license_family_id);
    assert.ok(row, `${sourceId} source_family column`);
    assert.ok(row.current_urls.includes(source.canonical_locator), `${sourceId} current_urls column`);
    assert.equal(row.license_evidence_url, source.license_evidence_url, `${sourceId} evidence column`);
    assert.equal(row.exact_license, source.license, `${sourceId} exact_license column`);
    assert.equal(row.family_grouping, 'identity', `${sourceId} family_grouping column`);
  }
});

test('governs six sources, three remote domains, rights, and one manifest primary', () => {
  const records = SOURCE_IDS.map((id) => ledger.sources.find((source) => source.id === id));
  assert.ok(records.every(Boolean), 'all STY-05 source records');
  const documentRecord = ledger.documents[ARTICLE];
  assert.ok(documentRecord, `${ARTICLE} citation record`);
  assert.deepEqual(documentRecord.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(documentRecord.citations.map(({source_id}) => source_id).sort(), [...SOURCE_IDS].sort());
  assert.equal(documentRecord.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  const inventoryRows = licenseInventoryRows(licenseInventory);
  for (const contract of SOURCE_CONTRACTS) {
    const source = ledger.sources.find(({id}) => id === contract.id);
    const citation = documentRecord.citations.find(({source_id}) => source_id === contract.id);
    assert.deepEqual({
      id: source.id,
      canonical_locator: source.canonical_locator,
      transport_locator: source.transport_locator,
      query_insensitive: source.query_insensitive,
      locator_aliases: source.locator_aliases,
      tombstone: source.tombstone,
      title: source.title,
      author_or_org: source.author_or_org,
      published_at: source.published_at,
      registered_at: source.registered_at,
      checked_at: source.checked_at,
      version: source.version,
      source_kind: source.source_kind,
      tier: source.tier,
      allowed_evidence_roles: source.allowed_evidence_roles,
      license: source.license,
      license_scope: source.license_scope,
      license_evidence_url: source.license_evidence_url,
      license_evidence_note: source.license_evidence_note,
      license_family_id: source.license_family_id,
      license_family_grouping: source.license_family_grouping,
      family_grouping_evidence_url: source.family_grouping_evidence_url,
      copyright_policy: source.copyright_policy,
      usage_boundary: source.usage_boundary,
      link_policy: source.link_policy,
      expected_final_transport_locator: source.expected_final_transport_locator,
      expected_final_approved_at: source.expected_final_approved_at,
      expected_final_approval_note: source.expected_final_approval_note,
    }, {
      id: contract.id,
      canonical_locator: contract.locator,
      transport_locator: contract.transport ?? contract.locator,
      query_insensitive: false,
      locator_aliases: [],
      tombstone: null,
      title: contract.title,
      author_or_org: contract.author,
      published_at: contract.publishedAt,
      registered_at: '2026-08-11',
      checked_at: '2026-08-11',
      version: contract.version,
      source_kind: contract.sourceKind,
      tier: contract.tier,
      allowed_evidence_roles: contract.allowedRoles,
      license: contract.license,
      license_scope: contract.licenseScope,
      license_evidence_url: contract.licenseEvidenceUrl,
      license_evidence_note: contract.licenseEvidenceNote,
      license_family_id: contract.licenseFamilyId,
      license_family_grouping: 'identity',
      family_grouping_evidence_url: null,
      copyright_policy: contract.copyrightPolicy,
      usage_boundary: contract.usageBoundary,
      link_policy: contract.sourceKind === 'original-illustration' ? null : 'stable',
      expected_final_transport_locator: contract.transport ?? contract.locator,
      expected_final_approved_at: '2026-08-11',
      expected_final_approval_note: contract.expectedApprovalNote,
    }, `${contract.id} exact governed source record`);
    assert.deepEqual(citation, {
      source_id: contract.id,
      citation_url: contract.locator,
      roles: contract.citationRoles,
      manifest_primary: contract.manifestPrimary,
      usage_mode: contract.usageMode,
      attribution_note: contract.attribution,
      modification_note: contract.modificationNote ?? null,
      excerpt: null,
      quotation_reviewed: false,
    }, `${contract.id} exact citation record`);
    const inventoryRow = inventoryRows.find(({source_family}) => source_family === contract.licenseFamilyId);
    assert.deepEqual(inventoryRow, {
      source_family: contract.licenseFamilyId,
      current_urls: [contract.locator],
      license_evidence_url: contract.licenseEvidenceUrl,
      exact_license: contract.license,
      family_grouping: 'identity',
    }, `${contract.id} exact source_family/current_urls/license inventory row`);
  }
  assert.ok(article, `${ARTICLE} must exist before checking visible remote sources`);
  const remoteDomains = new Set(externalLinksOf(article).map((url) => new URL(url).hostname));
  assert.ok(remoteDomains.size >= 3, 'at least three independent remote source domains');
  assert.deepEqual(externalLinksOf(article).sort(), SOURCE_CONTRACTS.slice(0, 5).map(({locator}) => locator).sort());
});

test('locks the AWS Prescriptive Guidance documentation license and rejects an ARR downgrade', () => {
  const source = ledger.sources.find(({id}) => id === 'src-aws-decompose-business-capability');
  const assertAwsDocumentationRights = (candidate) => assert.deepEqual({
    license: candidate.license,
    license_evidence_url: candidate.license_evidence_url,
    copyright_policy: candidate.copyright_policy,
  }, {
    license: 'CC-BY-SA-4.0',
    license_evidence_url: 'https://aws.amazon.com/terms/',
    copyright_policy: 'adapt-sharealike-review',
  });

  assertAwsDocumentationRights(source);
  assert.throws(() => assertAwsDocumentationRights({
    ...source,
    license: 'LicenseRef-All-Rights-Reserved',
    copyright_policy: 'vendor-claims-separated',
  }), {name: 'AssertionError'}, 'AWS documentation ARR downgrade');
});

test('projects the exact STY-05 Stage A pre-closure state', () => {
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID);
  assert.equal(topic?.slug, ROUTE);
  assert.equal(topic?.published, true);
  assert.equal(topic?.status.value, 'pending');
  assert.deepEqual(topic?.dependencies, ['STY-00', 'STY-04']);
  assert.deepEqual(topic?.adjacent_topics, ADJACENT_TOPICS);
  assert.deepEqual(topic?.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(topic?.primary_sources, ['https://martinfowler.com/articles/microservices.html']);
  const nextTopic = manifest.topics.find(({id}) => id === 'STY-06');
  assert.equal(nextTopic?.published, false);
  assert.equal(nextTopic?.status.value, 'pending');
  assert.equal(indexes.style.find(({id}) => id === TOPIC_ID)?.published, true);
  assert.equal(indexes.style.find(({id}) => id === 'STY-06')?.published, false);
  assert.equal(projectStatus.completed_topics, 57);
  assert.equal(projectStatus.content_documents, 100);
  assert.equal(projectStatus.governed_sources, 519);
  assert.equal(publicLedger.sources.length, 519);
  const publishedRoutes = manifest.topics.filter(({published}) => published).map(({slug}) => slug);
  assert.ok(publishedRoutes.includes(ROUTE));
  assert.equal(publishedRoutes.includes('/styles/sty-06'), false);
  for (const document of documents) {
    assert.equal(internalLinksOf(document).includes('/styles/sty-06'), false, `${document.file} STY-06 route`);
  }
});

test('publishes synchronized Draw.io and SVG inventories, containment, and connector semantics', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<title\b[^>]*>[^<]*微服务[^<]*订单[^<]*Saga[^<]*<\/title>/u);
  assert.match(svg, /<desc\b[^>]*>[^<]*(?=[^<]*独立部署)(?=[^<]*私有)(?=[^<]*Saga)(?=[^<]*补偿)(?=[^<]*对账)[^<]*<\/desc>/u);
  const root = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.match(root, /\bviewBox="0 0 [0-9.]+ [0-9.]+"/u);
  assert.match(root, /\brole="img"/u);
  assert.doesNotMatch(root, /\b(?:width|height)="/u);
  assert.match(svg, /<rect\b(?=[^>]*data-canvas-role="background")(?=[^>]*fill="#FFFFFF")[^>]*>/u);

  const drawioContract = drawioDiagramContract(drawio);
  const svgContract = svgDiagramContract(svg);
  const drawioNodes = new Map(drawioContract.nodes.map((node) => [node.id, node]));
  const svgNodes = new Map(svgContract.nodes.map((node) => [node.id, node]));
  assert.equal(drawioNodes.size, drawioContract.nodes.length, 'unique Draw.io node IDs');
  assert.equal(svgNodes.size, svgContract.nodes.length, 'unique SVG node IDs');
  assert.deepEqual([...drawioNodes.keys()].sort(), DIAGRAM_NODES.map(([id]) => id).sort());
  assert.deepEqual([...svgNodes.keys()].sort(), DIAGRAM_NODES.map(([id]) => id).sort());
  for (const [id, label, typeLabel] of DIAGRAM_NODES) {
    assert.deepEqual([drawioNodes.get(id)?.label, drawioNodes.get(id)?.visibleTypeLabel], [label, typeLabel], `Draw.io ${id}`);
    assert.deepEqual([svgNodes.get(id)?.label, svgNodes.get(id)?.typeLabel, svgNodes.get(id)?.visibleTypeLabel],
      [label, typeLabel, typeLabel], `SVG ${id}`);
  }
  assert.deepEqual([...DEPLOYMENT_IDS].sort(), SERVICE_KEYS.map((key) => `${key}-service-boundary`).sort());
  assert.deepEqual([...DATA_IDS].sort(), SERVICE_KEYS.map((key) => `${key}-data`).sort());
  assert.ok(PLATFORM_IDS.every((id) => svgNodes.has(id)) && RECOVERY_IDS.every((id) => svgNodes.has(id)));

  const drawioEdges = new Map(drawioContract.edges.map((edge) => [edge.id, edge]));
  const svgEdges = new Map(svgContract.edges.map((edge) => [edge.id, edge]));
  assert.equal(drawioEdges.size, drawioContract.edges.length, 'unique Draw.io edge IDs');
  assert.equal(svgEdges.size, svgContract.edges.length, 'unique SVG edge IDs');
  assert.deepEqual([...drawioEdges.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort());
  assert.deepEqual([...svgEdges.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort());
  for (const [id, source, target, label, connectorClass] of DIAGRAM_EDGES) {
    const drawioEdge = drawioEdges.get(id);
    const svgEdge = svgEdges.get(id);
    assert.deepEqual([drawioEdge?.source, drawioEdge?.target, drawioEdge?.label], [source, target, label], `Draw.io ${id}`);
    assert.deepEqual([svgEdge?.source, svgEdge?.target, svgEdge?.label], [source, target, label], `SVG ${id}`);
    assert.ok(svgEdge?.className.split(/\s+/u).includes(connectorClass), `SVG ${id} ${connectorClass}`);
    assert.equal(/(?:^|;)dashed=1(?:;|$)/u.test(drawioEdge?.style ?? ''), connectorClass !== 'sync', `Draw.io ${id} dash`);
    assert.equal(strokeDashKind(svgEdgeDashArray(svg, id)), connectorClass === 'sync' ? 'solid' : 'dashed', `SVG ${id} dash`);
    if (connectorClass === 'compensation') {
      assert.match(drawioEdge?.style ?? '', /(?:^|;)strokeColor=#[0-9A-Fa-f]{6}(?:;|$)/u, `${id} compensation color`);
      assert.match(svgEdge?.className ?? '', /(?:^|\s)compensation(?:\s|$)/u, `${id} compensation class`);
    }
    const svgPath = svg.match(new RegExp(`<path\\b[^>]*data-edge-id="${id}"[^>]*\\bd="([^"]+)"`, 'u'))?.[1] ?? '';
    assert.deepEqual(parseOrthogonalPath(svgPath), drawioEdgeRoute(drawio, id), `${id} synchronized route`);
  }

  for (const format of ['drawio', 'svg']) {
    const source = format === 'drawio' ? drawio : svg;
    for (const key of SERVICE_KEYS) {
      const boundary = cellGeometry(source, `${key}-service-boundary`, format);
      for (const id of SERVICE_CHILDREN.get(key)) assert.ok(contains(boundary, cellGeometry(source, id, format)), `${format} ${key} contains ${id}`);
    }
    for (let left = 0; left < DEPLOYMENT_IDS.length; left += 1) {
      for (let right = left + 1; right < DEPLOYMENT_IDS.length; right += 1) {
        assert.equal(overlaps(cellGeometry(source, DEPLOYMENT_IDS[left], format), cellGeometry(source, DEPLOYMENT_IDS[right], format)), false,
          `${format} deployment regions do not overlap`);
      }
    }
  }
  for (const edge of [...drawioEdges.values(), ...svgEdges.values()]) {
    const dataTarget = edge.target?.match(/^(order|inventory|payment|notification)-data$/u);
    if (dataTarget) assert.match(edge.source ?? '', new RegExp(`^${dataTarget[1]}-`, 'u'), `${edge.id} owned-data writer`);
  }
  const ownerByNode = new Map([...SERVICE_CHILDREN].flatMap(([owner, ids]) => ids.map((id) => [id, owner])));
  for (const edge of [...drawioEdges.values(), ...svgEdges.values()]) {
    const targetOwner = ownerByNode.get(edge.target);
    const sourceOwner = ownerByNode.get(edge.source);
    if (targetOwner && sourceOwner !== targetOwner) {
      assert.equal(edge.target, `${targetOwner}-contract`, `${edge.id} cross-boundary ingress uses public contract`);
    }
  }
  for (const [id, connectorClass] of [['legend-sync-line', 'sync'], ['legend-message-line', 'message'], ['legend-compensation-line', 'compensation']]) {
    assert.match(drawio, new RegExp(`<mxCell\\b(?=[^>]*\\bid="${id}")(?=[^>]*\\blegendLine="${connectorClass}")[^>]*>`, 'u'));
    assert.match(svg, new RegExp(`<g\\b[^>]*data-node-id="${id}"[^>]*data-legend-line="${connectorClass}"[^>]*>`, 'u'));
    assert.match(drawio, new RegExp(`<mxCell\\b(?=[^>]*\\bid="legend-${connectorClass}-caption")(?=[^>]*\\blegendFor="${connectorClass}")[^>]*>`, 'u'));
    assert.match(svg, new RegExp(`<text\\b[^>]*data-legend-for="${connectorClass}"[^>]*>`, 'u'));
  }
});

test('keeps marker-aware label clearances and selector-bound contrast mutation-sensitive', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  const root = xmlAttributes(svg.match(/<svg\b[^>]*>/u)?.[0] ?? '');
  for (const [attribute, minimum] of [
    ['data-edge-stroke-clearance-css', 8], ['data-edge-marker-clearance-css', 16],
    ['data-edge-node-clearance-css', 12], ['data-edge-boundary-clearance-css', 12],
    ['data-header-inner-stroke-padding-css', 12],
  ]) assert.ok(Number(root.get(attribute)) >= minimum, `${attribute} >= ${minimum}`);
  assert.ok(Number(root.get('data-edge-own-stroke-max-clearance-css')) <= 24,
    'data-edge-own-stroke-max-clearance-css <= 24');
  const renderedScale = Number(root.get('data-authoring-to-render-scale'));
  assert.ok(Number.isFinite(renderedScale) && renderedScale > 0 && renderedScale <= 1,
    'positive authoring-to-render scale');
  const fontSize = Number.parseFloat(svgPresentationValue(svg, 'text', 'class="edge-label"', 'font-size'));
  assert.ok(Number.isFinite(fontSize) && fontSize > 0, 'edge-label font size');
  const boundaryIds = new Set(DEPLOYMENT_IDS);
  const ignoredNodes = new Set(LEGEND_IDS);
  const nodeBounds = new Map();
  const nodeFillBounds = new Map();
  const boundaryBounds = new Map();
  for (const [, id, boundsValue, contents] of svg.matchAll(
    /<g\b[^>]*data-node-id="([^"]+)"[^>]*data-node-bounds="([^"]+)"[^>]*>([\s\S]*?)<\/g>/gu,
  )) {
    if (ignoredNodes.has(id)) continue;
    const [x, y, width, height] = boundsValue.split(/\s+/u).map(Number);
    const rectangle = {bottom: y + height, left: x, right: x + width, top: y};
    const outline = contents.match(/<(rect|path)\b([^>]*)>/u);
    assert.ok(outline, `${id} outline`);
    const strokeWidth = Number(svgPresentationValue(svg, outline[1], outline[2], 'stroke-width'));
    assert.ok(Number.isFinite(strokeWidth) && strokeWidth > 0, `${id} stroke width`);
    if (boundaryIds.has(id)) boundaryBounds.set(id, {rectangle, strokeWidth});
    else {
      nodeBounds.set(id, expandedRectangle(rectangle, strokeWidth / 2));
      nodeFillBounds.set(id, rectangle);
    }
  }
  assertPoisonTextGeometry(svg, renderedScale);
  const poisonOverflowMutation = svg.replace(
    /(<tspan\b[^>]*>毒消息隔离)(<\/tspan>)/u, '$1毒消息隔离$2',
  );
  assert.notEqual(poisonOverflowMutation, svg, 'poison overflow mutation applies');
  assert.throws(() => assertPoisonTextGeometry(poisonOverflowMutation, renderedScale), {name: 'AssertionError'});
  const connectorTags = new Map([...svg.matchAll(/<path\b[^>]*data-edge-id="([^"]+)"[^>]*>/gu)]
    .map(([tag, id]) => [id, tag]));
  assert.deepEqual([...connectorTags.keys()].sort(), DIAGRAM_EDGES.map(([id]) => id).sort());
  const pathData = [...connectorTags].map(([id, tag]) => [id, xmlAttributes(tag).get('d') ?? '']);
  assert.equal(new Set(pathData.map(([, data]) => data)).size, DIAGRAM_EDGES.length,
    'semantically distinct connectors do not share coincident paths');
  assertNoPositiveSegmentOverlap(connectorTags);
  assertLegendClearance(svg, connectorTags, renderedScale);
  const foreignKeyMutation = svg.replace(/data-legend-entry="message" x="[^"]+" y="[^"]+"/u,
    'data-legend-entry="message" x="500" y="32385"');
  assert.throws(() => assertLegendClearance(foreignKeyMutation, connectorTags, renderedScale), {name: 'AssertionError'});
  const captionOverlapMutation = svg.replace(/data-legend-entry="ownership" x="[^"]+" y="[^"]+"/u,
    'data-legend-entry="ownership" x="950" y="32385"');
  assert.throws(() => assertLegendClearance(captionOverlapMutation, connectorTags, renderedScale), {name: 'AssertionError'});
  const legendCrossingMutation = new Map(connectorTags);
  legendCrossingMutation.set('order-created', connectorTags.get('order-created').replace(/\bd="[^"]+"/u,
    'd="M 500 500 V 32330 H 700"'));
  assert.throws(() => assertLegendClearance(svg, legendCrossingMutation, renderedScale), {name: 'AssertionError'});
  const orderCreatedPath = xmlAttributes(connectorTags.get('order-created')).get('d');
  const overlapMutation = svg.replace(
    /(<path\b[^>]*data-edge-id="release-inventory-compensation-publication"[^>]*\bd=")[^"]+/u,
    `$1${orderCreatedPath}`,
  );
  const overlapTags = new Map([...overlapMutation.matchAll(/<path\b[^>]*data-edge-id="([^"]+)"[^>]*>/gu)]
    .map(([tag, id]) => [id, tag]));
  assert.throws(() => assertNoPositiveSegmentOverlap(overlapTags), {name: 'AssertionError'});
  const primaryLanes = pathData.map(([id, data]) => [id, primaryHorizontalLane(parseOrthogonalPath(data))]);
  for (let left = 0; left < primaryLanes.length; left += 1) {
    for (let right = left + 1; right < primaryLanes.length; right += 1) {
      const laneGap = Math.abs(primaryLanes[left][1].start.y - primaryLanes[right][1].start.y) * renderedScale;
      assert.ok(laneGap >= 24,
        `${primaryLanes[left][0]} and ${primaryLanes[right][0]} primary lane separation ${laneGap}`);
    }
  }
  for (const [edgeId, , , expectedLabel] of DIAGRAM_EDGES) {
    const connectorTag = connectorTags.get(edgeId);
    const labelMatch = svg.match(new RegExp(`(<text\\b[^>]*data-edge-id="${edgeId}"[^>]*>)([^<]+)<\\/text>`, 'u'));
    assert.equal(decodeXmlText(labelMatch?.[2] ?? ''), expectedLabel, `${edgeId} visible label`);
    const bounds = labelBounds(labelMatch?.[1] ?? '', expectedLabel, fontSize);
    const ownPoints = parseOrthogonalPath(xmlAttributes(connectorTag).get('d') ?? '');
    const ownHalfStroke = Number(svgPresentationValue(svg, 'path', connectorTag, 'stroke-width')) / 2;
    const ownStrokeClearance = (Math.min(...ownPoints.slice(1).map((point, index) =>
      segmentDistance(bounds, ownPoints[index], point))) - ownHalfStroke) * renderedScale;
    assert.ok(ownStrokeClearance <= 24, `${edgeId} own-stroke association ${ownStrokeClearance}`);
    const ownMarker = markerGeometry(svg, connectorTag, ownPoints);
    const expectedTarget = DIAGRAM_EDGES.find(([id]) => id === edgeId)?.[2];
    assertMarkerOutsideTargetFill(svg, connectorTag, nodeFillBounds.get(expectedTarget), renderedScale, edgeId);
    const corners = [
      {x: bounds.left, y: bounds.top}, {x: bounds.right, y: bounds.top},
      {x: bounds.right, y: bounds.bottom}, {x: bounds.left, y: bounds.bottom},
    ];
    const markerClearance = intervalGap(
      projectedInterval(corners, ownMarker.axis), projectedInterval(ownMarker.points, ownMarker.axis),
    ) * renderedScale;
    assert.ok(markerClearance >= 16, `${edgeId} marker clearance ${markerClearance}`);
    for (const [connectorId, otherTag] of connectorTags) {
      const points = parseOrthogonalPath(xmlAttributes(otherTag).get('d') ?? '');
      const halfStroke = Number(svgPresentationValue(svg, 'path', otherTag, 'stroke-width')) / 2;
      const clearance = (Math.min(...points.slice(1).map((point, index) =>
        segmentDistance(bounds, points[index], point))) - halfStroke) * renderedScale;
      assert.ok(clearance >= 8, `${edgeId} to ${connectorId} stroke clearance ${clearance}`);
    }
    for (const [nodeId, rectangle] of nodeBounds) {
      const clearance = rectangleDistance(bounds, rectangle) * renderedScale;
      assert.ok(clearance >= 12, `${edgeId} to ${nodeId} clearance ${clearance}`);
    }
    for (const [boundaryId, {rectangle, strokeWidth}] of boundaryBounds) {
      const clearance = boundaryStrokeDistance(bounds, rectangle, strokeWidth) * renderedScale;
      assert.ok(clearance >= 12, `${edgeId} to ${boundaryId} boundary clearance ${clearance}`);
    }
  }
  const providerTag = connectorTags.get('provider-result');
  const paymentContractFill = nodeFillBounds.get('payment-contract');
  const hiddenProviderTag = providerTag.replace(/(\bV)-?[0-9.]+(?=[^V]*$)/u,
    `$1${(paymentContractFill.top + paymentContractFill.bottom) / 2}`);
  assert.notEqual(hiddenProviderTag, providerTag, 'hidden provider marker mutation applies');
  assert.throws(() => assertMarkerOutsideTargetFill(
    svg, hiddenProviderTag, paymentContractFill, renderedScale, 'provider-result mutation',
  ), {name: 'AssertionError'});
  assertEssentialContrast(svg);
  assert.doesNotMatch(svg, /prefers-color-scheme|currentColor/u);
  const whiteMessage = svg.replace(/(\.message\s*\{[^}]*\bstroke\s*:\s*)#[0-9A-F]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteMessage, svg, 'message selector mutation applies');
  assert.throws(() => assertEssentialContrast(whiteMessage), {name: 'AssertionError'});
  const whiteLabel = svg.replace(/(\.edge-label\s*\{[^}]*\bfill\s*:\s*)#[0-9A-F]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteLabel, svg, 'edge-label selector mutation applies');
  assert.throws(() => assertEssentialContrast(whiteLabel), {name: 'AssertionError'});
});
