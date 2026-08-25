# STY-11 Serverless Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-11 Serverless Architecture 主题页，以订单结算与异步履约解释执行模型、持久状态、三层并发预算、冷启动、成本账本、供应商边界和人工恢复，并完成原创图、来源治理、Stage A/Stage B 审查与线上发布闭环。

**Architecture:** 新页面沿用 `style` 内容契约与 `/styles/sty-11` 路由。同步入口只完成认证、校验和幂等受理；持久工作流与订单状态记录拥有流程进度，队列限制投递，支付、库存、通知函数只执行有界步骤，业务真相留在权威下游。Stage A 发布 reviewed 页面但保持 STY-11 pending；只有 exact-head Pages、四态 in-app Browser QA 和三类独立审查闭合后，Stage B 才把完成数从 63 推进到 64，并保持 STY-12 unpublished/pending/nonactionable。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-11；不实现 STY-12，不新增真实订单应用、跨云执行层、成本计算器、迁移工具或 npm 依赖。
- 同步入口只认证、校验和幂等受理；持久工作流拥有步骤、状态版本、期限、重试预算、补偿入口和人工终态。
- 函数每次只执行一个有界步骤；函数内存、调用栈和临时文件不得承担恢复所需的业务事实。
- 并发必须同时受入口准入、队列/函数上限和下游容量预算约束；平台可用并发不等于应用必须使用的并发。
- 至少一次投递不等于业务 exactly-once；超时不等于外部效果未发生，支付与库存结果未知时必须查询权威系统或转入对账/人工终态。
- 所有自动重试同时受次数、总时长、业务期限和成本预算限制；通知可降级，支付与库存不得默认跳过。
- 冷启动按入口排队、运行时初始化、依赖初始化、业务执行和下游等待分解；预置容量只有在尾延迟预算无法满足时启用。
- 保持订单状态、幂等语义、事件合同、外部回执、恢复规则、审计记录和成本归因可导出；不追求跨云逐行兼容。
- CNCF、AWS、Microsoft、Google、CloudEvents 和 Open Workflow 只承担设计中规定的窄证据角色；任何供应商参数不得推广为通用 Serverless 定律。
- 不改变既有 URL、全站视觉 token、生成器或 GitHub Pages 工作流；只在 `architectureCaseTopicIds` 中登记 STY-11。
- `src/generated/` 只能由 `npm run generate:content` 更新，不能手工编辑。
- 历史 review、Pages run/job、artifact hash、Browser evidence 与 backlog 历史后缀保持字节不变；只有明确标注 current/latest 的投影断言可推进。
- 所有实现任务遵循 TDD：先观察真实 RED，再写最小实现，运行 GREEN，最后提交；不得弱化 validator、降低几何阈值或用 fallback 掩盖失败。
- 浏览器验证显式使用 in-app Browser；截图不可用或不可信时记录精确三次尝试并标记 `BLOCKED / NOT_ACCEPTED`，不得改用 Chrome、外部 Playwright、旧截图或伪造视觉 PASS。
- 当前基线为 `63 completed / 106 documents / 550 governed sources`。CloudEvents 复用现有记录；九个新远程来源和一项原创插图没有现有去重命中，Stage A 固定为 `63/107/560`，Stage B 固定为 `64/107/560`。

---

## File Map

### New files

- `tests/g009-batch12-content.test.mjs` — STY-11 正文、来源、关系、图示和 Stage A 投影的 mutation-sensitive 契约。
- `tests/g009-batch12-deployment.test.mjs` — Stage A/Stage B 投影、评审、历史锁与生产证据契约。
- `content/styles/sty-11-serverless-architecture.mdx` — STY-11 正文。
- `diagrams/sty-11-serverless-order-fulfillment.drawio` — 可编辑的订单 Serverless 边界图。
- `static/img/diagrams/sty-11-serverless-order-fulfillment.svg` — 发布 SVG。
- `docs/reviews/g009-batch12.md` — Stage A/Stage B exact-head 审查与发布记录。
- `docs/reviews/evidence/g009-batch12-stage-a-browser.json` — tracked 本地 Stage A 四态 Browser 原始证据。
- `docs/reviews/evidence/g009-batch12-stage-a-production-browser.json` — tracked Stage A 生产 Browser 原始证据。
- `docs/reviews/evidence/g009-batch12-stage-b-production-browser.json` — tracked Stage B 生产 Browser 原始证据。

### Existing files expected to change

- `scripts/content-schema.mjs` — 将 STY-11 加入精确 architecture-case 10-H2 合同。
- `data/source-ledger.json` — 九个新远程来源、一项原创插图及 STY-11 文档引用；复用现有 CloudEvents 记录。
- `data/source-link-health.json` — 九个新 remote transport 的健康记录。
- `data/source-ledger.json` 是 STY-11 新来源与原创插图许可证/版权边界的唯一权威记录；不得回填冻结的 G003 迁移快照 `docs/source-license-inventory.md`。
- `data/terminology.json` — 登记 Serverless Architecture、Functions as a Service（FaaS）和 FinOps 所需的最小首次使用合同；已有同义项必须复用。
- `content/styles/sty-06-event-driven-architecture.mdx` — 事件合同和交付语义不由函数运行时自动决定的可见反向关系。
- `content/styles/sty-09-pipes-and-filters.mdx` — 队列、背压和恢复单位边界的可见反向关系。
- `content/cases/cloudflare-durable-objects-workerd.mdx` — 有状态 Serverless 单写者边界的可见反向关系。
- `docs/content-backlog.md` — Stage B 仅勾选 STY-11 并记录 exact Stage A 证据，下一项推进为 STY-12。
- `src/generated/content-ledger.json`, `src/generated/project-status.json`, `src/generated/public-source-ledger.json`, `src/generated/topic-indexes.json`, `src/generated/topic-manifest.json` — 生成器实际产生的 Stage A/Stage B current 投影；无 byte diff 的输出不得为凑数修改。
- 当前投影型 `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs`, `tests/g010-*.test.mjs` — 仅更新 latest/current counts、next topic 和新增反向 adjacency；历史 artifact/run/hash 断言保持不变。

---

## Task 1: Lock the failing STY-11 content contract

**Files:**
- Create: `tests/g009-batch12-content.test.mjs`
- Read: `docs/superpowers/specs/2026-08-25-sty-11-serverless-architecture-design.md`
- Read: `tests/g009-batch11-content.test.mjs`

**Interfaces:**
- Consumes: current `63/106/550` projection and absent STY-11 article/source/diagram state.
- Produces: exact metadata, headings, wrappers, ownership, order flow, failure, cost, source, relation, diagram and Stage A projection validators used by Tasks 2–4.

- [ ] **Step 1: Define exact constants and reuse proven parsers**

  Create the test with these fixed identities:

  ```js
  import assert from 'node:assert/strict';
  import {readFileSync} from 'node:fs';
  import test from 'node:test';

  export const ARTICLE = 'content/styles/sty-11-serverless-architecture.mdx';
  export const DRAWIO = 'diagrams/sty-11-serverless-order-fulfillment.drawio';
  export const SVG = 'static/img/diagrams/sty-11-serverless-order-fulfillment.svg';
  export const ROUTE = '/styles/sty-11';
  export const TOPIC_ID = 'STY-11';
  export const NEXT_TOPIC = 'STY-12';
  export const RELATED_CASE = '/cases/cloudflare-durable-objects-workerd';
  export const EXPECTED_STAGE_A = Object.freeze({completed: 63, documents: 107, sources: 560});
  export const SOURCE_IDS = Object.freeze([
    'src-cncf-serverless-whitepaper-v1',
    'src-cncf-serverless-glossary',
    'src-aws-lambda-runtime-lifecycle',
    'src-aws-lambda-invocation-retries',
    'src-aws-lambda-concurrency',
    'src-aws-lambda-pricing',
    'src-azure-functions-scale-hosting',
    'src-google-cloud-run-concurrency',
    'src-cncf-cloudevents-102-spec',
    'src-open-workflow-specification-103',
    'src-atlas-sty11-serverless-order-fulfillment',
  ]);
  ```

  Import `findMarkdownHeadings`, `parseFrontMatter`, `readContentDocuments`, `extractInternalLinks`, `architectureCaseTopicIds` and `knowledgeHeadingContract` exactly as Batch 11 does. Copy the proven front-matter/table parser, XML parser, SVG cascade/specificity resolver, alpha-composition helper, path parser, marker-envelope transform, glyph-box geometry and later-paint-mask helpers from `tests/g009-batch11-content.test.mjs`. Preserve effective-style and real-terminal calculations; do not replace them with regex-only metadata assertions.

- [ ] **Step 2: Bind exact metadata, headings and four wrappers**

  Deep-equal this metadata object:

  ```js
  export const EXACT_METADATA = Object.freeze({
    title: 'Serverless Architecture：把运行责任交给平台，不把业务边界一并交出去',
    slug: '/styles/sty-11', content_type: 'style', status: 'reviewed', difficulty: 'advanced',
    analyzed_at: '2026-08-25', source_cutoff: '2026-08-25', confidence: 'high',
    domains: ['software-architecture', 'distributed-systems', 'platform-engineering'],
    agent_patterns: [], protocols: [],
    quality_attributes: ['scalability', 'performance', 'reliability', 'recoverability', 'operability', 'cost-efficiency'],
    tags: ['架构风格', 'Serverless', 'FaaS', '事件驱动', '幂等', '冷启动', '成本治理'],
    summary: '以订单结算与异步履约说明 Serverless：同步入口只受理，持久工作流（Workflow）保存进度，队列和三层并发预算保护下游，有界函数执行单步任务，并把冷启动、成本与供应商退出放进同一决策。',
    topic_id: 'STY-11', priority: 'P1', depends_on: ['STY-00', 'STY-06'],
    adjacent_topics: ['STY-06', 'STY-09'], related_cases: [RELATED_CASE], related_questions: [],
  });
  export const EXPECTED_HEADINGS = Object.freeze([
    '学习问题', '一页摘要', '事实边界', '架构图', '控制权与任务流',
    '关键源码导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源',
  ]);
  export const MIGRATION_HEADINGS = Object.freeze(['可直接复用的机制', '只能有限类比的部分', '不应照搬的部分']);
  export const WRAPPERS = Object.freeze([
    '订单结算与异步履约 Serverless 边界图，可横向滚动',
    'Serverless 执行与状态责任矩阵，可横向滚动',
    'Serverless 七类故障、响应、停止条件与责任表，可横向滚动',
    '冷启动与成本决策表，可横向滚动',
  ]);
  ```

  Require exactly four wrappers with `role="region"`, `tabIndex={0}` and `onKeyDown={handleHorizontalArrowKey}`. Add non-no-op deletion and changed-value mutations for every metadata field, heading and wrapper attribute.

- [ ] **Step 3: Bind ownership, the nine-step order flow and three concurrency budgets**

  Parse the exact `构件 | 正向责任 | 持久事实 | 明确不拥有` table:

  ```js
  export const OWNERSHIP_ROWS = Object.freeze([
    ['同步入口函数', '认证、校验、幂等受理', '受理记录与操作标识', '整条履约进度'],
    ['持久工作流', '步骤、期限、重试、补偿、终态', '状态版本与步骤回执', '支付或库存账本'],
    ['队列与任务分发', '缓冲、重投递、消费限速', '消息与投递状态', '业务成功结论'],
    ['步骤函数', '执行一个支付、库存或通知任务', '只写回标准结果或回执', '长流程状态与无限重试'],
    ['订单状态记录', '保存订单权威进度', '订单版本、阶段与关联回执', '下游业务事实'],
    ['权威下游系统', '原子判定支付、库存或投递结果', '各自账本与结果查询', '订单流程编排'],
    ['容量与成本观测', '关联延迟、并发、节流与费用', '可审计的观测与归因记录', '自动改变业务终态'],
  ]);
  export const ORDER_FLOW = Object.freeze([
    '认证与幂等受理', '返回订单操作标识', '生成支付任务', '受控交付支付任务',
    '记录支付回执或查询结果', '条件状态转移', '库存权威原子判定',
    '订单提交后异步通知', '记录端到端容量账本',
  ]);
  export const CONCURRENCY_LAYERS = Object.freeze(['入口层', '执行层', '下游层']);
  ```

  Require distinct visible definitions for entry idempotency key, order operation ID, step operation ID and event ID. Add mutations for function-memory-as-state, synchronous full-chain wait, queue-is-success, event-ID-as-business-idempotency, blind timeout replay, inventory decided by function scale, missing conditional update and downstream budget greater than authority capacity.

- [ ] **Step 4: Bind seven failures and the cold-start/cost decision table**

  Parse these exact ordered rows:

  ```js
  export const FAILURE_ROWS = Object.freeze([
    ['重复或乱序交付', '相同幂等键、陈旧状态版本或乱序步骤', '幂等查重、条件状态转移、丢弃陈旧版本', '事件无法关联订单或状态版本', '订单域负责人'],
    ['队列积压与函数节流', '队列深度、最老任务年龄、节流和业务期限', '降低入口、限制消费、保护下游并告警', '业务期限已无法满足', '平台运行负责人'],
    ['冷启动导致同步超时', '初始化时长、尾延迟、客户端断开', '预算内重试或使用预置容量；异步步骤继续查状态', '客户端期限耗尽或结果未知', '接口与容量负责人'],
    ['支付或库存结果未知', '调用超时、连接中断、缺少确定回执', '用业务操作标识查询权威系统并对账', '无法证明是否已产生外部效果', '支付或库存域负责人'],
    ['毒任务或确定性业务错误', '同一输入与版本重复确定失败', '隔离任务并保留输入、版本和尝试证据', '重试不会改变结果', '对应业务能力负责人'],
    ['重试风暴或成本异常', '调用放大、并发、错误率和费用预算', '熔断、降低并发、暂停非关键步骤和新流量', '单订单或时间窗预算耗尽', 'FinOps 与平台负责人'],
    ['托管工作流或区域故障', '工作流不可用、检查点中断或区域信号', '停止新推进，依据持久检查点恢复或切换', '状态副本、事件顺序或外部回执不可信', '业务连续性负责人'],
  ]);
  export const COLD_COST_ROWS = Object.freeze([
    ['少量同步请求尾延迟升高', '初始化与下游等待各占多少', '缩小依赖、延迟非必要初始化', '初始化持续击穿业务期限'],
    ['突发流量产生冷启动', '入口速率、并发和下游预算', '缓冲、限流、调整并发', '同步请求不可缓冲且期限严格'],
    ['预置容量利用率低', '时段分布和空闲费用', '调低或按时段调度', '业务要求全时段稳定低延迟'],
    ['异步任务处理变慢', '队列年龄、消费速率和业务期限', '调整消费与批量，保护下游', '最老任务接近不可逆期限'],
    ['持续高负载且波动小', '单位成本、利用率和运维成本', '比较按量函数与常驻服务', '常驻服务在约束内更可预测'],
  ]);
  ```

  Add per-cell deletion/change mutations plus unlimited retry, critical fail-open, notification rollback, poison-message retry, prewarm-by-default, price-only comparison and missing human owner mutations.

- [ ] **Step 5: Bind vendor boundaries, sources and relations**

  Require exact ordered boundary labels `必须保持可导出`, `可以合理适配`, `可以明确绑定`; the seven-step exit drill from state export through old-trigger credential revocation; applicability signals; and every stop condition from the design. Require all eleven source IDs, exactly ten remote citations, exactly one `manifest_primary` on `src-cncf-serverless-whitepaper-v1`, conservative facts-summary usage and original illustration registration.

  Require visible reciprocal links from STY-06, STY-09 and `/cases/cloudflare-durable-objects-workerd`; require no actionable `/styles/sty-12`. Add mutations for CloudEvents-implies-delivery, workflow-DSL-implies-runtime-equivalence, forced portability adapter and migrated-functions-only exit.

- [ ] **Step 6: Bind diagram inventory and physical geometry**

  Use these fixed IDs:

  ```js
  export const REGION_IDS = Object.freeze(['request-boundary', 'durable-control', 'function-execution', 'authority-boundary']);
  export const NODE_IDS = Object.freeze([
    'client', 'sync-ingress', 'admission-store', 'durable-workflow', 'order-state', 'task-queue',
    'payment-function', 'inventory-function', 'notification-function', 'payment-authority',
    'inventory-authority', 'notification-provider', 'capacity-cost-observability',
    'reconciliation', 'manual-terminal',
  ]);
  export const EDGE_IDS = Object.freeze([
    'submit-order', 'idempotent-accept', 'start-workflow', 'read-order-state',
    'enqueue-payment', 'deliver-payment', 'invoke-payment', 'payment-receipt',
    'enqueue-inventory', 'deliver-inventory', 'reserve-inventory', 'inventory-receipt',
    'enqueue-notification', 'deliver-notification', 'send-notification',
    'query-unknown-result', 'reconcile-manually', 'close-manual-terminal',
    'limit-ingress', 'limit-execution', 'limit-downstream',
  ]);
  export const LEGEND_ROLES = Object.freeze(['request', 'work', 'receipt', 'recovery', 'budget']);
  ```

  Define an `EDGE_CONTRACTS` object that maps every edge above to exact source node, target node and one legend role. Derive Draw.io endpoints from source/target bounds and normalized ports; compare SVG route points, roles, bounds, line/marker/font styles and paint order. At 800 CSS-pixel render width require node padding `16/14px`, title/type baseline `22px`, text bottom `14px`, label-to-stroke/arrow/node `8/16/12px`, and body/edge text `15px`. Check semantic/structural/legend intersections, marker footprints, partial collinear overlaps and later paint masks.

- [ ] **Step 7: Run focused tests and commit meaningful RED**

  ```bash
  node --check tests/g009-batch12-content.test.mjs
  node --test tests/g009-batch12-content.test.mjs
  git diff --check
  ```

  Expected: helper/cascade/mutation-fixture tests pass; implementation tests fail only because the STY-11 article, ten new source records, reciprocal relations, diagram pair and `63/107/560` projection do not exist.

  ```bash
  git add tests/g009-batch12-content.test.mjs
  git commit -m "test: define STY-11 content contract"
  ```

---

## Task 2: Create the synchronized Serverless diagram

**Files:**
- Create: `diagrams/sty-11-serverless-order-fulfillment.drawio`
- Create: `static/img/diagrams/sty-11-serverless-order-fulfillment.svg`
- Modify: `tests/g009-batch12-content.test.mjs`
- Read: `.codex/skills/creating-drawio-architecture-diagrams/references/layout-and-typography.md`
- Read: `.codex/skills/creating-drawio-architecture-diagrams/references/repository-integration.md`

**Interfaces:**
- Consumes: exact diagram inventory and geometry contract from Task 1.
- Produces: editable Draw.io and published SVG with identical topology and effective styles for Task 3.

- [ ] **Step 1: Read the required diagram skill and freeze layout data**

  Read `creating-drawio-architecture-diagrams/SKILL.md` completely, then both references listed above. Record the four regions, fifteen nodes, twenty-one semantic edges, five legend roles, three prohibition notes, exact text and paths in `.superpowers/sdd/sty11-task2-inventory.md`.

  Use a `2400×3600` authoring canvas and this region order: request boundary top, durable control center-left, function execution center-right, authority boundary bottom. The capacity/cost observer sits outside the business path and sends only budget controls; reconciliation and manual terminal sit in the recovery corridor.

- [ ] **Step 2: Add diagram-specific RED mutations**

  Add non-no-op mutations for missing/changed ports, missing waypoint, injected `sourcePoint`, function-to-order-store edge, queue-declares-success edge, timeout-direct-retry edge, budget arrow reversed into observability, detached receipt, missing manual terminal, legend drift, changed font, opaque label mask, partial overlap and shifted marker into a foreign node or boundary.

  ```bash
  node --test --test-name-pattern='SVG cascade|diagram inventory|Draw.io/SVG diagram' tests/g009-batch12-content.test.mjs
  ```

  Expected: helper fixtures pass and the production diagram test fails because both assets are absent.

- [ ] **Step 3: Author Draw.io with real terminals and explicit corridors**

  Every semantic edge uses real `source`/`target` cells, normalized `exitX/exitY/entryX/entryY`, perimeter flags, zero offsets and explicit waypoint arrays. Use separate corridors for request, queued work, authoritative receipts, recovery and budgets. No connector may pass through a node, label band, unrelated region or later-painted opaque shape.

  Use empty owner-node values plus paired editable text vertices; do not duplicate visible labels. Include these three exact notes:

  ```text
  函数内存 ≠ 业务状态
  自动扩缩 ≠ 无限容量
  超时 ≠ 外部效果未发生
  ```

- [ ] **Step 4: Export and synchronize the SVG**

  Flatten SVG geometry while retaining stable `data-region-id`, `data-node-id`, `data-edge-id`, `data-edge-role` and `data-note-id` attributes. Match every endpoint, waypoint, stroke, width, dash, marker, label box, font, corner and paint order. Keep `viewBox="0 0 2400 3600"`, yielding `800×1200` CSS pixels at article width.

- [ ] **Step 5: Run deterministic and visual gates**

  ```bash
  node --test --test-name-pattern='SVG cascade|diagram inventory|Draw.io/SVG diagram' tests/g009-batch12-content.test.mjs
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
    diagrams/sty-11-serverless-order-fulfillment.drawio \
    static/img/diagrams/sty-11-serverless-order-fulfillment.svg \
    --label 同步入口函数 --label 持久工作流 --label 队列与任务分发 \
    --label 支付步骤函数 --label 库存步骤函数 --label 通知步骤函数 \
    --label 支付权威系统 --label 库存权威系统 --label 人工终态
  npm run check:terminology
  git diff --check
  ```

  Expected: focused tests pass; validator prints `Validated sty-11-serverless-order-fulfillment`; terminology reports zero issues. Render at exactly 800px width, inspect the full `800×1200` raster and original-size crops, and record CSS minima and raster SHA. Any label collision, ambiguous arrow, clipping, false data ownership, missing recovery or color-only distinction keeps Task 2 RED.

- [ ] **Step 6: Commit the synchronized pair**

  ```bash
  git add diagrams/sty-11-serverless-order-fulfillment.drawio \
    static/img/diagrams/sty-11-serverless-order-fulfillment.svg \
    tests/g009-batch12-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-11 Serverless diagram"
  ```

---

## Task 3: Write the article, govern sources and close relations

**Files:**
- Create: `content/styles/sty-11-serverless-architecture.mdx`
- Modify: `scripts/content-schema.mjs`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `data/terminology.json`
- Modify: `content/styles/sty-06-event-driven-architecture.mdx`
- Modify: `content/styles/sty-09-pipes-and-filters.mdx`
- Modify: `content/cases/cloudflare-durable-objects-workerd.mdx`
- Modify: `tests/g009-batch12-content.test.mjs`

**Interfaces:**
- Consumes: Task 1 content/source/relationship contract and Task 2 SVG path.
- Produces: publishable article and canonical governance data; generated projections remain stale RED for Task 4.

- [ ] **Step 1: Freeze the architecture-case schema and reader structure**

  Add `STY-11` to `architectureCaseTopicIds`, preserving:

  ```js
  export const architectureCaseTopicIds = new Set(['STY-08', 'STY-09', 'STY-10', 'STY-11']);
  ```

  STY-11 uses `architectureCaseHeadings` without a special override. Run the focused contract before writing prose; expected failures remain missing article, sources and relations.

- [ ] **Step 2: Audit and register eleven exact source identities**

  Reuse `src-cncf-cloudevents-102-spec`. Register the other ten records with these exact canonical/transport seams:

  ```text
  src-cncf-serverless-whitepaper-v1
    canonical: https://github.com/cncf/wg-serverless/blob/79c8a13c26be9066a8723c5896d8aaa0e2ab9e08/whitepapers/serverless-overview/cncf_serverless_whitepaper_v1.0.pdf
    transport: https://raw.githubusercontent.com/cncf/wg-serverless/79c8a13c26be9066a8723c5896d8aaa0e2ab9e08/whitepapers/serverless-overview/cncf_serverless_whitepaper_v1.0.pdf
  src-cncf-serverless-glossary
    canonical/transport: https://glossary.cncf.io/serverless/
    version: cncf/glossary@334ce7e82d20cd8cdcd12bc828d12cc518be0f19; checked 2026-08-25
  src-aws-lambda-runtime-lifecycle
    canonical/transport: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html
  src-aws-lambda-invocation-retries
    canonical/transport: https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html
  src-aws-lambda-concurrency
    canonical/transport: https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html
  src-aws-lambda-pricing
    canonical/transport: https://aws.amazon.com/lambda/pricing/
  src-azure-functions-scale-hosting
    canonical/transport: https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale
  src-google-cloud-run-concurrency
    canonical: https://cloud.google.com/run/docs/about-concurrency
    expected final transport: https://docs.cloud.google.com/run/docs/about-concurrency
  src-open-workflow-specification-103
    canonical: https://github.com/open-workflow-specification/specification/blob/2dd2c84170d5f3e05d58e913e9ca298dcf8d543a/schema/workflow.yaml
    transport: https://raw.githubusercontent.com/open-workflow-specification/specification/2dd2c84170d5f3e05d58e913e9ca298dcf8d543a/schema/workflow.yaml
  src-atlas-sty11-serverless-order-fulfillment
    canonical/transport: /img/diagrams/sty-11-serverless-order-fulfillment.svg
  ```

  Rights policy: CNCF whitepaper and Open Workflow use pinned Apache-2.0 repository evidence; CNCF Glossary documentation uses CC-BY-4.0 with its pinned README evidence; Google documentation uses the page's CC-BY-4.0 notice; AWS and Microsoft pages use conservative `LicenseRef-All-Rights-Reserved`; the original illustration uses `LicenseRef-Atlas-Original`. In the ledger's copyright-policy field, AWS and Microsoft use `facts-and-short-quotation`, CNCF Glossary and Google use `adapt-with-attribution`, and the Apache-2.0 records retain their approved policy. In document citations, every remote uses `usage_mode: facts-summary`; no copied diagrams, code or long excerpts. Map the AWS pricing source to the registered `comparison` evidence role and Open Workflow to `method`; do not expand the global role enum. Only the CNCF whitepaper is `manifest_primary`.

- [ ] **Step 3: Write the article and four exact wrappers**

  Implement the ten exact H2s and three H3s. Within the first three paragraphs state: Serverless transfers capacity provisioning and part of runtime responsibility; durable business state remains explicit; the order scenario is original and not production evidence. Place the main diagram immediately after the paragraph that names the ownership path to inspect.

  Wrap only the main diagram, seven-row ownership matrix, seven-row failure table and five-row cold/cost table with the exact Task 1 labels and keyboard handler. Use evidence cards for version/license/source seams; keep state ownership, concurrency limits, unknown-result recovery, cost stop conditions and exit rules visible. Validate all new-source and original-illustration rights from `data/source-ledger.json`, the sole runtime authority; do not modify or require entries in the frozen G003 migration snapshot `docs/source-license-inventory.md`.

- [ ] **Step 4: Add reciprocal links and terminology**

  Add one concise visible reciprocal paragraph to STY-06, STY-09 and Cloudflare Durable Objects + workerd without changing their conclusions. Register only the minimal terminology entries needed for `Serverless Architecture`, `Functions as a Service（FaaS）` and `FinOps`; preserve exact first-use display forms and do not add source titles to the terminology registry.

- [ ] **Step 5: Run content, rights and relationship gates**

  ```bash
  node --test tests/g009-batch12-content.test.mjs \
    tests/source-ledger.test.mjs tests/content-relations.test.mjs \
    tests/terminology-policy.test.mjs
  npm run validate:content
  npm run check:terminology
  npm run check:links
  npm run typecheck
  npm run build
  node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs \
    content/styles/sty-11-serverless-architecture.mdx
  git diff --check
  ```

  Expected: article/source/relations/diagram tests pass; the sole planned RED is stale generated projection `63/106/550` versus `63/107/560`. Validation reports 107 documents and 560 sources; terminology zero; density visual-balance strictly greater than 90 with zero warnings.

- [ ] **Step 6: Run local Browser QA and commit**

  Build and serve the exact candidate. Using in-app Browser only, check desktop light/dark `1440×1000` and mobile light/dark `390×844`: no document overflow; SVG `800×1200`; exactly four wrappers; focus, `:focus-visible`, 3px outline and ArrowRight; three relations; ten remote sources; STY-12 actionable count zero; warning/error/runtime/log events zero with complete pagination. Record functional facts in `.superpowers/sdd/sty11-task3-browser.md`; screenshots are not a Task 3 gate.

  ```bash
  git add content/styles/sty-11-serverless-architecture.mdx scripts/content-schema.mjs \
    data/source-ledger.json data/source-link-health.json \
    data/terminology.json content/styles/sty-06-event-driven-architecture.mdx \
    content/styles/sty-09-pipes-and-filters.mdx content/cases/cloudflare-durable-objects-workerd.mdx \
    tests/g009-batch12-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-11 Serverless architecture"
  ```

---

## Task 4: Generate Stage A, collect exact evidence and bind independent reviews

**Files:**
- Create: `tests/g009-batch12-deployment.test.mjs`
- Create: `docs/reviews/g009-batch12.md`
- Create: `docs/reviews/evidence/g009-batch12-stage-a-browser.json`
- Modify: generated files changed by `npm run generate:content`
- Modify: current projection fixtures under `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs`, `tests/g010-*.test.mjs`

**Interfaces:**
- Consumes: Task 3 canonical article/source/relations and Stage A `63/107/560`.
- Produces: exact implementation candidate, tracked local four-state Browser evidence, three independent Stage A verdicts and final `STAGE_A_ONLY` READY review for Task 5.

- [ ] **Step 1: Write the Stage A deployment contract and observe RED**

  Create constants:

  ```js
  export const EXPECTED_STAGE_A = Object.freeze({completed: 63, documents: 107, sources: 560});
  export const CURRENT_TOPIC = 'STY-11';
  export const NEXT_TOPIC = 'STY-12';
  export const REVIEW = 'docs/reviews/g009-batch12.md';
  export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch12-stage-a-browser.json';
  export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch12-stage-a-production-browser.json';
  export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch12-stage-b-production-browser.json';
  export const STATES = Object.freeze(['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark']);
  ```

  Lock the complete immediate STY-10 backlog suffix and `docs/reviews/g009-batch11.md` bytes to SHA-256 values computed from the Task 3 head. Require STY-11 published/pending, STY-12 unpublished/pending/nonactionable, review slots/final PENDING, `STAGE_A_ONLY`, deployment `NOT_RUN`, absent Stage B claims and absent STY-12 implementation.

  ```bash
  node --test tests/g009-batch12-deployment.test.mjs
  ```

  Expected: history locks pass; projection, review and raw evidence fail because generation/evidence are absent.

- [ ] **Step 2: Generate and synchronize current-only fixtures**

  ```bash
  npm run generate:content
  npm run check:content
  node --test tests/g009-batch12-content.test.mjs tests/g009-batch12-deployment.test.mjs
  npm test
  ```

  Require exact `63/107/560`; STY-11 published/pending; STY-12 unpublished/pending/nonactionable. Classify every full-suite failure before editing. Update only current/latest projection, pagination, reciprocal adjacency and reader-facing counts. Split current prefixes from immutable historical suffixes before changing predicates; mutations must alter current STY-12, not a historical STY-11 literal.

- [ ] **Step 3: Create and commit the implementation candidate**

  Create `docs/reviews/g009-batch12.md` with exact article/ledger/Draw.io/SVG bytes and SHA, source count, history hashes, three independent Stage A slots `PENDING`, final `PENDING`, screenshot `NOT_RUN`, scope `STAGE_A_ONLY` and deployment `NOT_RUN`.

  ```bash
  npm run verify
  git diff --check
  git add docs/reviews/g009-batch12.md src/generated tests
  git diff --cached --check
  git commit -m "docs: generate STY-11 Stage A candidate"
  ```

  Record the exact candidate SHA before Browser collection. Any later render-affecting change creates a new candidate and requires fresh evidence.

- [ ] **Step 4: Collect exact-candidate IAB evidence**

  Build and serve the exact candidate. Use in-app Browser only. Collect `desktopLight`, `desktopDark`, `mobileLight`, `mobileDark` in that order at `1440×1000` and `390×844`. For every state record page geometry; exact four wrapper labels/client/scroll widths; focus/`:focus-visible`/3px outline; ArrowRight before/after; three exact relation href→H1→return records; ten source href/target/rel records; SVG loaded/intrinsic/rendered dimensions; STY-12 zero; warnings/errors; Runtime/Log events; `hasMore=false`; `truncated=false`.

  Capture exactly three fresh full-page screenshots: desktop light, desktop dark, mobile light. Inspect original bytes. If repeated, cropped, blank or missing diagram coverage, mark each `CAPTURED_REJECTED` and overall `BLOCKED / NOT_ACCEPTED`; do not take a fourth screenshot.

- [ ] **Step 5: Bind raw bytes and semantic mutations**

  Track `LOCAL_RAW`. Fix its byte length/SHA and candidate head in the test and review. Assert exact state order, 16 wrapper interactions, 12 relation destination/H1/return observations, 40 source observations, SVG `2400×3600` rendered at `800×1200`, diagnostics and three screenshot attempts.

  Add mutations for wrong head/raw hash, duplicate/swap wrapper, changed client/scroll width, missing focus-visible/outline, changed delta, fabricated relation/H1, changed source, unloaded/resized SVG, STY-12 fabrication, truncated diagnostics, deleted/changed screenshot attempt and visual PASS.

- [ ] **Step 6: Run three independent exact-head reviews**

  Dispatch separate read-only reviewers against the exact implementation candidate and evidence head. Require:

  ```text
  Code/spec/security: READY / APPROVE, findings 0
  Content/evidence/rights: CONTENT READY, rights PASS, findings 0
  Architecture/invariants: CLEAR / READY, blockers 0
  ```

  Any finding keeps final PENDING. Apply feedback with TDD, commit a remediation head, recollect Browser evidence if rendered or canonical content changed, and rerun all three reviews on one exact head.

- [ ] **Step 7: Bind Stage A verdicts and verify**

  Update the deployment contract first so the old PENDING review is RED. Then update `docs/reviews/g009-batch12.md` with exact implementation/evidence/review heads, three zero-finding verdicts and final Stage A `READY`. Keep screenshot `BLOCKED / NOT_ACCEPTED`, scope `STAGE_A_ONLY` and deployment `NOT_RUN`.

  ```bash
  node --test tests/g009-batch12-deployment.test.mjs
  npm run verify
  git diff --check
  git add docs/reviews/g009-batch12.md tests/g009-batch12-deployment.test.mjs \
    docs/reviews/evidence/g009-batch12-stage-a-browser.json
  git commit -m "docs: bind STY-11 Stage A verdicts"
  ```

---

## Task 5: Publish Stage A and bind production evidence

**Files:**
- Create: `docs/reviews/evidence/g009-batch12-stage-a-production-browser.json`
- Modify: `docs/reviews/g009-batch12.md`
- Modify: `tests/g009-batch12-deployment.test.mjs`
- Create ignored: `.superpowers/sdd/sty11-task5-production.md`

**Interfaces:**
- Consumes: exact Stage A READY head from Task 4.
- Produces: successful production run and evidence-only head; backlog and Stage B remain untouched.

- [ ] **Step 1: Enforce strict fast-forward preflight**

  ```bash
  git fetch origin
  git status --porcelain=v1
  git merge-base --is-ancestor origin/main HEAD
  git rev-list --left-right --count origin/main...HEAD
  ```

  Expected: clean status, ancestor exit 0, remote-only/behind `0`. If origin diverged, behind is nonzero or HEAD is not the reviewed READY head, stop `BLOCKED`; do not merge, rebase, force or collect production evidence.

- [ ] **Step 2: Publish exact READY head and observe Pages**

  ```bash
  git push origin HEAD:main
  ```

  Identify the exact `push` Pages run whose `headSha` equals the READY head. Require run/build/deploy `completed/success` and record exact IDs. Do not use an older run or a run for an evidence commit as implementation evidence.

- [ ] **Step 3: Probe production routes and exact SVG bytes**

  Require HTTP 200 `text/html` for these eight routes:

  ```text
  /tego-arch/
  /tego-arch/styles
  /tego-arch/styles/sty-06
  /tego-arch/styles/sty-09
  /tego-arch/styles/sty-11
  /tego-arch/cases
  /tego-arch/cases/cloudflare-durable-objects-workerd
  /tego-arch/references
  ```

  Require `/tego-arch/img/diagrams/sty-11-serverless-order-fulfillment.svg` as HTTP 200 `image/svg+xml`; compare exact bytes and SHA with the reviewed local SVG.

- [ ] **Step 4: Collect fresh production IAB evidence**

  Repeat Task 4's four-state schema against production. Direct-open exact href is acceptable for destination verification only when recorded honestly; do not claim physical clicks. Capture exactly three fresh screenshots and inspect originals. Preserve `BLOCKED / NOT_ACCEPTED` if they do not cover the full article and diagram.

- [ ] **Step 5: TDD-bind production identity and semantics**

  Add RED assertions for missing production review/raw. Bind exact implementation head, run/build/deploy IDs, eight routes, SVG bytes/SHA, four states, 16 wrapper interactions, 12 relation destination/H1/return checks, 40 source checks, SVG dimensions, STY-12 zero, diagnostics and three screenshot attempts. Add semantic/additive mutations for every group plus fabricated deployment/visual PASS.

- [ ] **Step 6: Verify, commit and publish evidence only**

  ```bash
  node --test tests/g009-batch12-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  git add docs/reviews/evidence/g009-batch12-stage-a-production-browser.json \
    docs/reviews/g009-batch12.md tests/g009-batch12-deployment.test.mjs
  git diff --cached --check
  git commit -m "docs(g009): record STY-11 Stage A production evidence"
  git fetch origin
  git merge-base --is-ancestor origin/main HEAD
  git push origin HEAD:main
  ```

  Observe the evidence commit's own Pages run success in the ignored report only. Final state is `HEAD=origin/main=merge-base`, ahead/behind `0/0`, clean. Do not touch backlog, generated projection, Stage B or STY-12.

---

## Task 6: Close Stage B and bind independent verdicts

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch12.md`
- Modify: generated files changed by `npm run generate:content`
- Modify: `tests/g009-batch12-deployment.test.mjs`
- Modify: current-projection fixtures discovered by the full suite only
- Create ignored: `.superpowers/sdd/sty11-task6-closure.md`

**Interfaces:**
- Consumes: exact Task 5 Stage A production evidence.
- Produces: reviewed local Stage B READY head at `64/107/560`; no push or deployment.

- [ ] **Step 1: Write the closure contract and capture RED**

  Extend the deployment test to require exactly one newly checked STY-11 backlog item, exact Stage A implementation/run/route/SVG evidence, `64` completed topics, `107` documents and `560` governed sources. Require STY-11 `published/complete`, STY-12 `unpublished/pending/nonactionable`, and STY-12 as the sole next topic.

  Lock exact bytes/SHA for the immediate STY-10 backlog suffix, Batch 11 review, STY-11 article, source ledger, Draw.io/SVG pair, local Stage A raw and Stage A production raw. Require Stage B review slots, final readiness and deployment to remain `PENDING / NOT_RUN` before review.

  ```bash
  node --test tests/g009-batch11-deployment.test.mjs tests/g009-batch12-deployment.test.mjs
  ```

  Expected RED: STY-11 is unchecked, projection is `63/107/560`, and Stage B section is absent or pending.

- [ ] **Step 2: Close only STY-11 and regenerate current truth**

  Check exactly the STY-11 backlog line and attach exact Task 5 production identity. Update only STY-11 current review/projection state; do not alter STY-10 history or STY-12 content.

  ```bash
  npm run generate:content
  npm run check:content
  node --test tests/g009-batch11-deployment.test.mjs tests/g009-batch12-deployment.test.mjs
  npm test
  ```

  Synchronize only fixtures that explicitly model current live truth. Split current prefixes from immutable historical suffixes before changing expectations. Current stale-next mutations must change STY-12 to STY-11 and fail the current predicate.

- [ ] **Step 3: Verify and commit the pending closure candidate**

  ```bash
  npm run verify
  git diff --check
  git add docs/content-backlog.md docs/reviews/g009-batch12.md src/generated tests
  git diff --cached --check
  git commit -m "docs: close STY-11 Stage B candidate"
  ```

  The candidate review still says Stage B code/content/architecture/final `PENDING` and deployment `PENDING / NOT_RUN`.

- [ ] **Step 4: Run three independent exact-head closure reviews**

  Reviewers inspect the exact pending candidate and return the same three zero-finding verdicts from Task 4. They must verify `64/107/560`, STY-12 as sole unpublished/pending/nonactionable next item, Stage A byte identities, history locks and absence of fabricated Stage B deployment. Any finding creates a new candidate and requires all three reviews again.

- [ ] **Step 5: Bind verdicts and create the local Stage B READY head**

  First change the deployment contract to exact reviewed head and verdicts so the pending document is RED. Then update the review with the three verdicts and `Final Stage B readiness: READY`, retaining `Deployment status: PENDING / NOT_RUN` and honest screenshot status. Add mutations for wrong head, weakened verdicts/findings/rights/blockers, stale PENDING, scope drift, fabricated deployment and visual PASS.

  ```bash
  node --test tests/g009-batch12-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  git add docs/reviews/g009-batch12.md tests/g009-batch12-deployment.test.mjs
  git diff --cached --check
  git commit -m "docs: bind STY-11 Stage B verdicts"
  ```

  Stop with a clean local READY head. Do not push, deploy, create STY-12 or claim Stage B production success.

---

## Task 7: Publish Stage B and bind final production evidence

**Files:**
- Create: `docs/reviews/evidence/g009-batch12-stage-b-production-browser.json`
- Modify: `docs/reviews/g009-batch12.md`
- Modify: `tests/g009-batch12-deployment.test.mjs`
- Create ignored: `.superpowers/sdd/sty11-task7-production.md`
- Create ignored: `.superpowers/sdd/sty11-final-publish-report.md`

**Interfaces:**
- Consumes: exact Task 6 Stage B READY head.
- Produces: published Stage B closure plus an evidence-only head synchronized with `origin/main`.

- [ ] **Step 1: Enforce strict fast-forward publication preflight**

  ```bash
  git fetch origin
  git status --porcelain=v1
  git merge-base --is-ancestor origin/main HEAD
  git rev-list --left-right --count origin/main...HEAD
  ```

  Require a clean exact READY head, origin/main as its ancestor and behind `0`. Stop on divergence; never merge, rebase or force within this task.

- [ ] **Step 2: Publish the exact READY head and verify Pages**

  ```bash
  git push origin HEAD:main
  ```

  Bind the exact push Pages run whose `headSha` is the Stage B READY head. Require run, build and deploy `completed/success`. Probe the same eight HTML routes and exact SVG identity from Task 5. Verify production projection `64/107/560`, STY-11 complete and STY-12 absent from actionable UI.

- [ ] **Step 3: Collect fresh Stage B IAB evidence**

  Do not reuse Stage A raw, screenshots or Browser state. Collect four exact viewport/theme states, 16 wrapper interactions, 12 relation destination/H1/returns, 40 source checks, SVG intrinsic/rendered dimensions, STY-12 zero and complete empty diagnostics. Capture exactly three fresh full-page screenshots and inspect originals; record `BLOCKED / NOT_ACCEPTED` if coverage repeats or omits the diagram. Do not fall back to Chrome or external Playwright.

- [ ] **Step 4: TDD-bind the closed production contract**

  Add RED assertions for missing Stage B raw/review section. Bind exact implementation head, Pages run/build/deploy IDs, routes, SVG bytes/SHA, projection, Browser schema and three screenshot attempts. Add non-no-op semantic/additive mutations for every group, including fabricated success, visual PASS, duplicate/displaced readiness lines and altered screenshot attempts.

  ```bash
  node --test tests/g009-batch12-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  ```

- [ ] **Step 5: Commit exactly the evidence closure and publish it**

  ```bash
  git add docs/reviews/evidence/g009-batch12-stage-b-production-browser.json \
    docs/reviews/g009-batch12.md tests/g009-batch12-deployment.test.mjs
  git diff --cached --check
  git commit -m "docs(g009): record STY-11 Stage B production evidence"
  git fetch origin
  git merge-base --is-ancestor origin/main HEAD
  git push origin HEAD:main
  ```

  Observe the evidence commit's own Pages run/build/deploy success only in ignored reports. Final fetch must prove `HEAD=origin/main=merge-base`, ahead/behind `0/0`, tracked status clean. Do not touch backlog, generated projection, content, rights records or STY-12.

---

## Final Review Gate

- [ ] **Run the complete repository verification on the final evidence head**

  ```bash
  npm run verify
  node --test tests/g009-batch12-content.test.mjs tests/g009-batch12-deployment.test.mjs
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
    diagrams/sty-11-serverless-order-fulfillment.drawio \
    static/img/diagrams/sty-11-serverless-order-fulfillment.svg
  node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs \
    content/styles/sty-11-serverless-architecture.mdx
  git diff --check
  git fetch origin
  git rev-list --left-right --count origin/main...HEAD
  git status --short
  ```

- [ ] **Perform a read-only end-to-end audit**

  Audit the design parent through the final evidence head. Require zero code/spec/security, content/evidence/rights and architecture/invariant findings. Confirm every design section is mutation-bound: exact metadata/headings; four wrappers; ownership matrix; nine-step flow; three concurrency budgets; seven failures; cold/cost table; vendor boundaries and exit drill; source rights; three relations with 12 four-state observations; ten remote sources with 40 observations; editable diagram parity; responsive keyboard behavior; Stage A/B identities; honest screenshot status.

- [ ] **Accept completion only when all release invariants hold**

  Require the full repository suite to pass with no skipped failure, projection exactly `64/107/560`, STY-11 `published/complete`, STY-12 `unpublished/pending/nonactionable` and absent from actionable UI. Require implementation and evidence Pages runs successful, production routes/SVG exact, `HEAD=origin/main=merge-base`, ahead/behind `0/0`, and a clean tracked worktree. Any failure reopens the owning task; do not waive it in the report.
