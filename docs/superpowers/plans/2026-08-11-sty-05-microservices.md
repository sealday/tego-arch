# STY-05 Microservices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-05 微服务主题页，以提交订单为统一案例解释业务服务、独立部署、私有数据、Saga/补偿、分布式故障与组织运行前提，并完成来源、图示、关系、生成投影、独立审查和 Stage A/Stage B 线上发布闭环。

**Architecture:** 新页面沿用 `style` 十一段内容契约与 `/styles/sty-05` 路由。订单、库存、支付和通知成为四个独立部署服务，各自在本地事务中维护权威数据与 Outbox；订单服务持久化 Saga 状态，通过消息协调库存、支付和通知，并对重复、未知支付结果、补偿和人工终止承担明确责任。Draw.io 源文件与 SVG 投影精确表达独立部署、私有数据、同步/异步/补偿连接器和共享平台能力；Stage A 发布 reviewed 内容但保持 backlog pending，只有 exact-head Pages、四态 Browser QA 和独立审查全部通过后，Stage B 才关闭 STY-05 并推进到仍未发布的 STY-06。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-05；不实现 STY-06、STY-14、CASE-04 或 QST-03，不新增产品运行时功能，不进行无关重构。
- 微服务不能按代码量、容器数量或远程调用定义；业务能力、稳定合同、独立部署、私有权威数据和端到端运行责任必须同时可检查。
- 每个服务独立构建、验证、发布和回滚；锁步发布只能作为待消除耦合，不能被称为服务自治。
- 每项权威状态、模式迁移和写入路径只有一个服务所有者；禁止共享表、跨服务直接写库和跨库连接绕过合同。
- 每个服务只在本地事务中提交状态与 Outbox；跨服务任务使用持久 Saga、幂等、补偿、对账和人工终止，不得宣称分布式原子事务或 exactly-once。
- 支付外部副作用位于本地事务之外；结果未知时必须先查询/对账，禁止盲目重复授权或扣款；补偿是新的业务动作，不是假装回滚外部世界。
- 网络超时、部分成功、重复、乱序、积压、毒消息、依赖饱和和未知结果必须有显式所有者、预算、隔离与恢复路径。
- 团队必须端到端负责服务合同、数据、部署、值守、恢复和成本；平台能力不能拥有业务状态或掩盖组织协调。
- 新正文外链必须登记到 `data/source-ledger.json`，闭合许可证、健康缓存、证据角色和使用边界；恰好一个引用可投影为 `manifest_primary`。
- 图示格式固定为 Draw.io + SVG；源文件和发布投影必须语义、ID、几何、颜色对比和可访问描述同步，不复制外部图示。
- 生成文件只能由 `npm run generate:content` 更新；不新增 npm 依赖，不改变既有 URL、全站视觉 token 或发布路径。
- 桌面验证使用 `1440x1000`，移动验证使用 `390x844`，浅色/暗色都必须检查；页面不得产生 document overflow，Browser warning/error、`Runtime.exceptionThrown`、`Log.entryAdded` 均为零。
- 保持用户未跟踪的 `.codex/config.toml` 和 `.pi-subagents/` 不变。

---

## 文件职责地图

- Create: `tests/g009-batch6-content.test.mjs` — STY-05 内容、来源、关系、图示和 Stage A 投影契约。
- Create: `tests/g009-batch6-deployment.test.mjs` — exact-head 发布、Browser 证据、独立 verdict 和 Stage B 关闭契约。
- Create: `content/styles/sty-05-microservices.mdx` — STY-05 正文与 front matter。
- Create: `diagrams/sty-05-microservices-order-saga.drawio` — 可编辑服务/数据/消息/Saga 拓扑源。
- Create: `static/img/diagrams/sty-05-microservices-order-saga.svg` — 网站发布用同步 SVG。
- Create: `docs/reviews/g009-batch6.md` — 代码、内容/版权、架构、Browser、Pages 和闭环证据。
- Modify: `content/styles/sty-04-modular-monolith.mdx` — 把待发布 STY-05 文字升级为正式互惠链接，并保持既有 STY-04 语义与证据不变。
- Modify as justified: `content/styles/sty-03-vertical-slice-architecture.mdx`, STY-00 对应风格比较页 — 只补确有语义承接的 STY-05 可见关系。
- Modify: `content/paths/02-module-boundaries.mdx` — 纳入正式 STY-05 学习入口。
- Modify: `data/source-ledger.json`, `data/source-link-health.json`, `docs/source-license-inventory.md` — 新增五个远程来源和一个原创图示来源。
- Modify after Stage A production evidence: `docs/content-backlog.md` — 记录精确发布证据并只勾选 STY-05。
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json` — 由既有生成器生成。

## 固定来源与投影计数

- `src-lewis-fowler-microservices` — `https://martinfowler.com/articles/microservices.html`，James Lewis / Martin Fowler，发布于 `2014-03-25`；支持独立部署、业务能力组织、产品式责任、去中心化数据和为故障设计等共同特征。`LicenseRef-All-Rights-Reserved`，只用原创中文事实总结；它是经验性特征描述，不是形式标准或生产效果保证。该引用是唯一 `manifest_primary`。
- `src-microsoft-microservices-architecture-style` — `https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices`，Microsoft Azure Architecture Center；固定官方源码为 `https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/f69851e7c8b27ca6e8983e7b7d91d35e99423a73/docs/guide/architecture-styles/microservices.md`，页面元数据 `ms.date: 06/30/2025`，仓库许可证 `CC-BY-4.0`。只支持 Microsoft 对自治服务、私有数据、CI/CD、观测、故障隔离条件和分布式成本的说明。
- `src-microservicesio-database-per-service` — `https://microservices.io/patterns/data/database-per-service.html`，Chris Richardson；用于核对私有持久数据、只经 API 访问、独立事务以及跨服务事务/查询成本。`LicenseRef-All-Rights-Reserved`，原创事实总结，不复制来源图示或示例表达。
- `src-microservicesio-saga` — `https://microservices.io/patterns/data/saga.html`，Chris Richardson；用于核对本地事务序列、编排/协同、补偿、缺少自动回滚与隔离、数据库和消息发布原子性问题。`LicenseRef-All-Rights-Reserved`，不外推为 exactly-once、自动补偿或订单场景生产保证。
- `src-aws-decompose-business-capability` — `https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/decompose-business-capability.html`，Amazon Web Services；支持业务能力稳定性、领域理解、领域专家和跨职能团队前提。AWS Site Terms 明确将 `docs.aws.amazon.com` 文档置于 `CC-BY-SA-4.0`、其中代码置于 `MIT-0`；本来源使用 `adapt-sharealike-review`，正文仍只保留链接和原创事实总结，不复制来源图示或代码。
- `src-atlas-sty05-microservices-order-saga` — `/img/diagrams/sty-05-microservices-order-saga.svg`，Tego Arch maintainers；`LicenseRef-Atlas-Original`、`original-atlas`、`illustration-rights`，不含外部参考图、品牌视觉、签名、水印或复制构图。
- 2026-08-11 已核对五个远程 URL 均 HTTP 200；Microservices.io 页脚明确 `Copyright © 2026 Chris Richardson • All rights reserved`。
- 当前基线：57 completed topics / 99 content documents / 513 governed sources。
- Stage A：57 / 100 / 519；STY-05 `published/pending`，STY-06 `unpublished/pending`。
- Stage B：58 / 100 / 519；STY-05 `published/complete`，STY-06 `unpublished/pending`。

## Task 1: Lock the failing STY-05 contract

**Files:**
- Create: `tests/g009-batch6-content.test.mjs`
- Read-only references: `tests/g009-batch5-content.test.mjs`, `tests/g009-batch5-deployment.test.mjs`, `tests/g009-batch4-content.test.mjs`

**Interfaces:**
- Consumes: repository MDX/front-matter parsers, source-ledger schema, generated topic manifest/indexes/project status, Draw.io/SVG parsing and geometry conventions.
- Produces: exact assertions for the page, sources, relationships, topology, contrast and pre-closure projection used by Tasks 2–5.

- [ ] **Step 1: Create imports and exact constants.**

  Reuse batch-5 public helpers rather than copying private test-only parsers when an exported helper exists. Define these constants verbatim:

  ```js
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
  ```

- [ ] **Step 2: Assert metadata, semantics and prohibited claims.**

  Require `content_type: style`, `status: reviewed`, `topic_id: STY-05`, `priority: P0`, `depends_on: [STY-00, STY-04]`, actionable published adjacency to STY-03/04, one related micro-frontends case and no actionable STY-06 route. Require independent deployment/rollback, business contracts, private authoritative data, local transaction + Outbox, durable Saga state, stable idempotency keys, explicit compensation/reconciliation/manual terminal state, partial failure, service-owned runtime responsibility and platform boundaries.

  Reject source mutations equivalent to:

  ```js
  const PROHIBITED = [
    '微服务由代码行数定义', '容器等于微服务', '远程调用等于微服务',
    '共享数据库仍可由任意服务直接写入', '跨服务事务天然原子',
    'Saga 自动回滚外部副作用', 'Outbox 保证 exactly-once',
    '支付结果未知时直接重复扣款', '拆成服务后天然故障隔离',
  ];
  ```

- [ ] **Step 3: Assert sources and exact Stage A projection.**

  Require six citation/source IDs, three independent remote domains, exactly one eligible `manifest_primary`, complete copyright/license/evidence-role boundaries, `completed_topics: 57`, `content_documents: 100`, `governed_sources: 519`, STY-05 `published/pending`, STY-06 `unpublished/pending`, and no `/styles/sty-06` in published routes or visible actionable links.

- [ ] **Step 4: Assert exact diagram inventories and containment.**

  Fix these semantic node groups before drawing:

  ```js
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
  ```

  Define exact edges for request entry, order-created, reserve-inventory command/result, register-payment-intent, provider authorization/result, payment-confirmed/rejected/unknown, order-confirmed, notification delivery, release-inventory compensation, payment void/reversal/refund, per-service owned-data writes, Outbox publication, consumer deduplication and observability signals. Require Draw.io/SVG ID parity, deployment/data containment, no cross-service owned-data edge, solid sync edges, dashed messages, distinct compensation styling, marker-aware label clearance, opaque readable canvas, selector-bound contrast and mutation rejection.

- [ ] **Step 5: Run the test and observe RED.**

  Run: `node --test tests/g009-batch6-content.test.mjs`

  Expected: FAIL because the STY-05 article, source records and diagram pair do not exist; all existing batch-5 tests remain green.

- [ ] **Step 6: Commit the failing contract.**

  ```bash
  git add tests/g009-batch6-content.test.mjs
  git commit -m "test: define STY-05 content contract"
  ```

## Task 2: Register governed source evidence

**Files:**
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Test: `tests/g009-batch6-content.test.mjs`

**Interfaces:**
- Consumes: the five fixed remote URLs, pinned Microsoft source, exact source IDs and repository source-governance schema.
- Produces: five validated remote records and citation contracts; the original diagram record is added in Task 3 when the asset exists.

- [ ] **Step 1: Capture immutable identity and current health.**

  Recheck all five canonical URLs, the pinned Microsoft raw file and the Microsoft repository `LICENSE`. Record HTTP status, redirect/final URL, title, author/organization, published/update date or checked-current boundary, check date `2026-08-11`, source kind, tier, allowed roles, license evidence, usage boundary and prohibited external claims. Preserve the canonical Microsoft Learn URL while using the pinned raw file as `transport_locator` and `expected_final_transport_locator`.

- [ ] **Step 2: Add five complete source records.**

  Copy the full schema of the existing Fowler, Microsoft Architecture Center and AWS records. Use `LicenseRef-All-Rights-Reserved` plus `facts-and-short-quotation` for Fowler/Microservices.io; use `CC-BY-4.0` plus `vendor-claims-separated` for Microsoft; use `CC-BY-SA-4.0` plus `adapt-sharealike-review` for AWS documentation, with the AWS Site Terms as evidence and the embedded-code `MIT-0` boundary recorded separately. Add only citation-title variants that appear verbatim in the planned article. Do not group different works under one license family merely because they share a domain.

- [ ] **Step 3: Add five health-cache observations.**

  Follow `data/source-link-health.json` current-result and observation ordering. Use the actual attempt timestamp and final transport; include body probes when HEAD content type is missing or ambiguous. Do not copy an old healthy result from a different source ID.

- [ ] **Step 4: Add provisional STY-05 document citations without publishing the article.**

  Add the future document key `content/styles/sty-05-microservices.mdx` only when the source-governance parser accepts a citation target without the MDX file; otherwise defer document citations to Task 4 and keep this task limited to source records/health. Exactly one future citation (`src-lewis-fowler-microservices`) is `manifest_primary: true`; the others are false and use roles allowed by their source records.

- [ ] **Step 5: Run source gates.**

  Run:

  ```bash
  node --test tests/source-governance-data.test.mjs tests/source-link-health.test.mjs tests/source-license-inventory.test.mjs tests/g009-batch6-content.test.mjs
  npm run check:links
  ```

  Expected: source and health tests pass; STY-05 content test fails only on missing article/diagram/relations/original illustration record.

- [ ] **Step 6: Commit source registration.**

  ```bash
  git add data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md tests/g009-batch6-content.test.mjs
  git commit -m "docs: register STY-05 microservices sources"
  ```

## Task 3: Create the synchronized service/Saga diagram

**Files:**
- Create: `diagrams/sty-05-microservices-order-saga.drawio`
- Create: `static/img/diagrams/sty-05-microservices-order-saga.svg`
- Modify: `data/source-ledger.json`
- Modify: `docs/source-license-inventory.md`
- Modify: `tests/g009-batch6-content.test.mjs`

**Interfaces:**
- Consumes: exact node/edge IDs and geometry/contrast thresholds from Task 1 plus repository Draw.io conventions.
- Produces: synchronized, accessible diagram pair and original-illustration governance record embedded by Task 4.

- [ ] **Step 1: Load required diagram instructions.**

  Use `creating-drawio-architecture-diagrams` and its required references. Preserve editable XML, semantic IDs, deterministic routing and synchronized SVG. Do not introduce raster output because this visual encodes exact service/data/transaction topology.

- [ ] **Step 2: Draw four independent deployment boundaries.**

  Place order, inventory, payment and notification in four non-overlapping service regions. Each contains a public contract, internal handler/worker, private data node and Outbox. Order additionally contains `order-saga-state`; payment contains `payment-reconciliation`; broker poison-message isolation sits beside the broker with explicit owner/manual replay annotation. Do not place all services inside a box labelled one deployment unit.

- [ ] **Step 3: Encode normal, failure and compensation paths.**

  Use solid arrows for client/API and payment-provider calls, dashed arrows for commands/events, and a third color-independent dash/marker pattern for compensation. Keep `支付结果未知 → 查询/对账` distinct from `支付拒绝`; keep `释放库存` and `撤销/冲正/退款` as new actions; make notification retry non-transactional with order confirmation. Every cross-service connector must terminate at a public contract or broker, never another service’s internal/data node.

- [ ] **Step 4: Add platform boundary and legend.**

  Observability receives one-way logs/metrics/traces from every service and owns no business state. The legend explains sync/message/compensation lines, local transaction + Outbox, at-least-once/replay boundary and private authoritative data. Use an opaque light canvas so the SVG remains readable on dark pages.

- [ ] **Step 5: Export synchronized SVG and verify geometry.**

  Require stable `viewBox`, no fixed root width/height, Chinese `<title>`/`<desc>`, semantic ID parity, resolved CSS presentation, actual marker footprints and measured clearances at 800px article render. At minimum assert label-to-stroke `>= 8 CSS px`, label-to-marker `>= 16 CSS px`, label-to-node `>= 12 CSS px`, label-to-boundary `>= 12 CSS px`, and header inner-stroke padding `>= 12 CSS px`. Bind contrast assertions to actual selectors/elements/backgrounds and include mutations that turn an essential edge or label white on white.

- [ ] **Step 6: Register original illustration rights.**

  Add `src-atlas-sty05-microservices-order-saga`, the STY-05 citation with role `illustration`, and the exact license-inventory row. State that the project-authored pair uses no third-party reference image, icon, signature, watermark or copied composition.

- [ ] **Step 7: Run diagram/content gates.**

  Run:

  ```bash
  node --test tests/drawio-diagram-validator.test.mjs tests/drawio-svg-pilot.test.mjs tests/source-governance-data.test.mjs tests/g009-batch6-content.test.mjs
  npm run check:terminology -- diagrams/sty-05-microservices-order-saga.drawio static/img/diagrams/sty-05-microservices-order-saga.svg
  ```

  Expected: diagram, rights, topology, geometry and contrast tests pass; remaining failures concern missing article/relations/projection.

- [ ] **Step 8: Commit the visual pair.**

  ```bash
  git add diagrams/sty-05-microservices-order-saga.drawio static/img/diagrams/sty-05-microservices-order-saga.svg data/source-ledger.json docs/source-license-inventory.md tests/g009-batch6-content.test.mjs
  git commit -m "docs: add STY-05 microservices Saga diagram"
  ```

## Task 4: Write the article and reciprocal navigation

**Files:**
- Create: `content/styles/sty-05-microservices.mdx`
- Modify: `content/styles/sty-04-modular-monolith.mdx`
- Modify if semantically required: `content/styles/sty-03-vertical-slice-architecture.mdx`, the STY-00 style comparison article
- Modify: `content/paths/02-module-boundaries.mdx`
- Modify: `data/source-ledger.json`
- Test: `tests/g009-batch6-content.test.mjs`

**Interfaces:**
- Consumes: Task 2 governed URLs/roles and Task 3 synchronized diagram.
- Produces: independently readable STY-05 content plus reciprocal published relationships and complete document citations.

- [ ] **Step 1: Add exact front matter.**

  Use repository multiline YAML form equivalent to:

  ```yaml
  title: 微服务：用独立部署换取自治，也承担分布式成本
  slug: /styles/sty-05
  content_type: style
  status: reviewed
  difficulty: advanced
  analyzed_at: 2026-08-11
  source_cutoff: 2026-08-11
  confidence: high
  domains: [software-architecture, distributed-systems]
  quality_attributes: [deployability, scalability, availability, maintainability, operability]
  tags: [架构风格, 微服务, 服务边界, 分布式一致性]
  summary: 以提交订单为统一案例，说明微服务如何把业务能力、独立部署、私有数据和运行责任绑定，并解释 Saga、补偿与组织前提。
  topic_id: STY-05
  priority: P0
  depends_on: [STY-00, STY-04]
  adjacent_topics: [STY-03, STY-04]
  related_cases: [/cases/micro-frontends-single-spa]
  related_questions: []
  ```

- [ ] **Step 2: Write all eleven sections around the order Saga.**

  Use Chinese-primary terms and define `Saga` with Chinese context on first use. Explain service/public contract/private implementation, independent deployment/rollback, order/inventory/payment/notification ownership, local transactions + Outbox, durable Saga state, idempotency, repeated/out-of-order delivery, unknown payment results, reconciliation, compensation/manual terminal state, network failure/latency/backpressure, security/observability/platform prerequisites, cross-functional ownership, quality benefits/costs, incremental extraction and stop conditions. Label the order flow `说明性场景（Tego Arch 分析）`; do not invent production metrics or incidents.

- [ ] **Step 3: Embed the diagram with the exact wrapper contract.**

  ```mdx
  <div className="architecture-diagram-scroll" role="region" aria-label="订单、库存、支付和通知微服务的独立部署、私有数据与 Saga 恢复图，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>

  ![订单、库存、支付和通知作为独立部署服务，通过消息和持久 Saga 协作，各自拥有数据并显式执行补偿与恢复](/img/diagrams/sty-05-microservices-order-saga.svg)

  </div>
  ```

- [ ] **Step 4: Add two governed tables.**

  First table compares modular monolith and microservices across business boundary, invocation, data ownership, consistency, deployment, rollback, failure domain, scaling, team responsibility, platform cost and adoption signal. Second table maps evidence to `保持单体 / 收紧模块 / 提取一个服务 / 停止拆分`, including release wait, resource curve, regulatory isolation, blast radius, contract maturity, data migration, CI/CD, observability, on-call and rollback rehearsal. Both tables use `table-wrapper--mapping`, keyboard focus and `handleHorizontalArrowKey`.

- [ ] **Step 5: Add exact source boundaries and ledger citations.**

  The source section names all five remote works and the original illustration. Each paragraph states what the source supports and what it does not prove. Complete the document citation entry with six citations, exactly one `manifest_primary`, no quotation excerpts and `illustration-rights` in copyright checks.

- [ ] **Step 6: Add reciprocal visible links without premature STY-06 activation.**

  Upgrade STY-04’s plain STY-05 mention to `/styles/sty-05`; add STY-05 to the module-boundaries path. Add STY-03/STY-00 links only if the article’s declared relationship becomes visible and reciprocal without duplicate anchors. Mention STY-06 only as plain text; reject `/styles/sty-06`, JSX href equivalents and linked images.

- [ ] **Step 7: Run targeted content gates and density review.**

  Run:

  ```bash
  node --test tests/g009-batch6-content.test.mjs tests/content-relations.test.mjs tests/terminology-content-contract.test.mjs tests/terminology-policy.test.mjs tests/terminology-registry.test.mjs tests/source-governance-data.test.mjs
  node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/styles/sty-05-microservices.mdx
  npm run validate:content
  npm run typecheck
  npm run build
  ```

  Expected: semantic/source/relationship/MDX/build gates pass; visual-balance is strictly greater than 90; generated projection drift is the only allowed remaining failure before Task 5.

- [ ] **Step 8: Commit article and navigation.**

  ```bash
  git add content/styles/sty-05-microservices.mdx content/styles/sty-04-modular-monolith.mdx content/styles/sty-03-vertical-slice-architecture.mdx content/paths/02-module-boundaries.mdx data/source-ledger.json tests/g009-batch6-content.test.mjs
  git commit -m "docs: publish STY-05 microservices"
  ```

  Stage only files actually changed; do not include an unchanged STY-00/STY-03 file merely because it was listed as conditional.

## Task 5: Generate and verify the Stage A projection

**Files:**
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json`
- Create: `tests/g009-batch6-deployment.test.mjs`
- Create: `docs/reviews/g009-batch6.md`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: deterministic 57/100/519 Stage A projection, local Browser evidence and independent verdicts ready for exact-head publication.

- [ ] **Step 1: Add Stage A deployment assertions and observe RED.**

  Require 57/100/519, STY-05 `published/pending`, STY-06 `unpublished/pending`, canonical article/SVG routes, six exact source IDs, no actionable STY-06 URL, backlog current prefix still naming STY-05 as next, and review slots initially `PENDING`. Run `node --test tests/g009-batch6-deployment.test.mjs`; expect failure because generated projection/review do not yet exist.

- [ ] **Step 2: Generate canonical projections.**

  Run: `npm run generate:content`

  Expected: only STY-05, justified reciprocal relations, six new sources and 57/100/519 current-projection changes appear. Historical immutable review payloads remain byte-identical; current-status fixtures may advance only where their contract intentionally follows the latest projection.

- [ ] **Step 3: Run focused projection verification.**

  Run:

  ```bash
  node --test tests/g009-batch6-content.test.mjs tests/g009-batch6-deployment.test.mjs tests/project-status.test.mjs tests/topic-manifest.test.mjs tests/topic-index.test.mjs
  npm run validate:content
  npm run check:terminology
  npm run check:content
  npm run check:links
  git diff --check
  ```

  Expected: PASS with STY-05 still unchecked in backlog and STY-06 absent from published/actionable routes.

- [ ] **Step 4: Perform local four-state Browser QA.**

  Build and serve the exact local head. With the in-app Browser, inspect desktop light/dark `1440x1000` and mobile light/dark `390x844`. For each state record document client/scroll width, diagram and both table wrapper client/scroll widths, SVG loaded/rendered dimensions, focus-visible outline and `ArrowRight` before/after for all three wrappers, four intended relation destinations/H1/return, all five remote source anchors plus three unique remote domains, STY-06 actionable count zero, warning/error logs, `Runtime.exceptionThrown`, `Log.entryAdded`, `hasMore` and `truncated`. Save raw JSON and four screenshots under `.superpowers/sdd/`, hash every artifact and visually inspect the diagram in both themes.

- [ ] **Step 5: Run independent reviews and remediate.**

  Obtain distinct code-reviewer, content/evidence/rights and architect judgments against the exact local head. The content reviewer verifies source roles, originality, payment/Saga recovery and STY-06 boundary. The architect verifies independent deployment, unique data ownership, no cross-service atomicity claim, persistent recovery and organization/platform boundaries. The code reviewer verifies mutation-resistant selectors/elements/geometry/contrast/evidence tests and no validator weakening. Fix every Critical/Important and all justified lower findings; record superseded verdicts rather than erasing history.

- [ ] **Step 6: Bind final local evidence and verdicts.**

  `docs/reviews/g009-batch6.md` records exact article/Draw.io/SVG/source hashes, counts, four-state Browser artifact/screenshot hashes, source/relationship activation results, remediation commits and final `READY / APPROVE`, `READY / PASS`, `CLEAR / READY` verdicts. Add mutation fixtures that reject wrong hashes, incomplete four-state evidence, hard-coded expected contrast colors unrelated to actual selectors, missing fallback provenance and fabricated deployment success.

- [ ] **Step 7: Run full Stage A verification and commit.**

  Run: `npm run verify && git diff --check`

  Then:

  ```bash
  git add src/generated/topic-manifest.json src/generated/topic-indexes.json src/generated/project-status.json src/generated/source-ledger.json tests/g009-batch6-deployment.test.mjs docs/reviews/g009-batch6.md
  git commit -m "test: bind STY-05 Stage A projection"
  ```

## Task 6: Publish Stage A and collect exact production evidence

**Files:**
- Modify: `docs/reviews/g009-batch6.md`
- Modify: `tests/g009-batch6-deployment.test.mjs`
- Local ignored evidence: `.superpowers/sdd/task-6-production-evidence.json`, screenshots and report

**Interfaces:**
- Consumes: clean reviewed Stage A commit from Task 5.
- Produces: immutable exact-head Pages and production Browser evidence required for Stage B closure.

- [ ] **Step 1: Rebase/fast-forward safely and push exact Stage A head.**

  Verify `git rev-parse HEAD`, `git rev-parse origin/main`, merge-base, clean tracked state and unchanged user untracked files. Push only a fast-forward to `origin/main`; abort rather than overwrite if the remote advanced unexpectedly.

- [ ] **Step 2: Wait for the exact Pages workflow.**

  Require workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, exact `headSha`, `status=completed`, `conclusion=success`; record workflow run, build job and deploy job IDs. A success for any other SHA is not evidence.

- [ ] **Step 3: Run production HTTP probes.**

  Require HTTP 200 and expected content type for `/`, `/styles`, `/styles/sty-05`, `/styles/sty-04`, `/styles/sty-03`, `/paths/module-boundaries`, `/references`, the related micro-frontends case and `/img/diagrams/sty-05-microservices-order-saga.svg`. Record SVG byte size and SHA-256 and confirm it matches the reviewed asset.

- [ ] **Step 4: Run production four-state Browser QA.**

  Repeat the Task 5 per-state geometry, focus, `ArrowRight`, relation/H1/return, source anchor/target/rel, unique external destination resolution, STY-06 absence and complete diagnostics checks against production. If the in-app Browser suppresses `_blank` or cannot click an offscreen locator, capture the exact selected href from visible DOM and directly open that same URL; record the compatibility fallback and never claim a physical click occurred.

- [ ] **Step 5: Bind production evidence with mutations.**

  Add literal Stage A SHA/run/jobs/status, route totals, Browser artifact/screenshot hashes and fallback provenance to the review and deployment test. Mutations must reject wrong SHA/run/job/outcome, omitted state, wrong geometry, truncated diagnostics, missing relation return, changed href, rel/target weakening, screenshot mismatch and fabricated STY-06 absence.

- [ ] **Step 6: Run verification and commit immutable evidence.**

  Run focused content/deployment/review tests, `npm run check:reviews`, then `npm run verify && git diff --check`.

  ```bash
  git add docs/reviews/g009-batch6.md tests/g009-batch6-deployment.test.mjs
  git commit -m "docs: record STY-05 production evidence"
  git push origin main
  ```

  Wait for this evidence commit’s own Pages run and record it only in the ignored task report unless a tracked requirement explicitly needs it; do not create recursive evidence commits.

## Task 7: Close STY-05 in Stage B

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch6.md`
- Modify: `tests/g009-batch6-deployment.test.mjs`
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json`
- Modify current-projection tests only where intentional latest-state contracts require it

**Interfaces:**
- Consumes: exact successful Stage A evidence and final independent verdicts from Task 6.
- Produces: STY-05 complete, STY-06 next/unpublished and a verified/published 58/100/519 closure.

- [ ] **Step 1: Make the closure test fail on pre-closure truth.**

  Add assertions requiring one checked STY-05 line with exact Stage A SHA, Pages run, review date and live route/SVG evidence; current G009/next STY-06; 58 completed topics, 100 documents, 519 sources; STY-05 `published/complete`; STY-06 `unpublished/pending`; final Stage B code/content/architecture verdicts and deployment status `PENDING`. Run the test and observe RED because STY-05 is unchecked and current projection remains 57.

- [ ] **Step 2: Update only the canonical backlog closure.**

  Change `- [ ] **STY-05` to `- [x] **STY-05` and append exact Stage A commit/run/live-review evidence. Update the current release baseline so G009 remains current and STY-06 becomes next. Preserve the complete historical suffix byte-for-byte; do not check STY-06 or modify later topic wording.

- [ ] **Step 3: Regenerate Stage B projections and synchronize current-status fixtures.**

  Run: `npm run generate:content`

  Expected: 58/100/519; STY-05 complete; STY-06 pending/non-actionable. Update only tests whose declared contract tracks current project status; immutable historical payload/hash locks must remain byte-identical and must be tested as such.

- [ ] **Step 4: Run the required ai-slop cleanup.**

  Use `ai-slop-cleaner` on the changed Stage B files. First lock behavior with the deployment test; remove stale STY-05 “next” messages or mutation literals, redundant prose and dead compatibility branches. Preserve grounded Browser `_blank`/offscreen fallbacks, exact href evidence and mutation tests. Add no dependency or abstraction.

- [ ] **Step 5: Obtain independent Stage B verdicts.**

  Run distinct code, content/rights and architecture reviews against the exact closure head. Bind code `READY/APPROVE`, content `READY` + rights `PASS`, architecture `CLEAR/READY`, and zero blocking findings in the review/test. Keep Stage B deployment `PENDING`; local readiness is not production deployment success.

- [ ] **Step 6: Run full closure verification and commit.**

  Run focused content/deployment/history tests, source/diagram/review gates and `npm run verify && git diff --check`.

  ```bash
  git add docs/content-backlog.md docs/reviews/g009-batch6.md tests/g009-batch6-deployment.test.mjs src/generated/topic-manifest.json src/generated/topic-indexes.json src/generated/project-status.json src/generated/source-ledger.json
  git commit -m "docs: close STY-05 microservices"
  git push origin main
  ```

- [ ] **Step 7: Verify exact Stage B production state.**

  Wait for the exact closure SHA’s successful Pages run/jobs. Probe the same production routes and SVG. Use the in-app Browser to verify homepage visible metrics `100/519/G009`, `/styles` STY-05 actionable and STY-06 non-actionable, article four-state geometry/relations/sources, and unchanged interaction contract. Record exact observations in a bounded evidence-only commit whose own successful Pages run is kept in the ignored report to avoid recursion.

- [ ] **Step 8: Run final whole-change audit and reconcile local main.**

  Obtain a final whole-range code review from the pre-STY-05 merge base to the evidence commit. Require zero unresolved Critical/High/Medium/Low findings or fix/re-review them. Run fresh `npm run verify`, fast-forward local `main` to `origin/main`, verify exact SHA parity, remove the owned `.worktrees/g009-styles-batch6` worktree and delete its feature branch only after merged-result verification. Preserve `.codex/config.toml` and `.pi-subagents/`.

## Final verification matrix

- `node --test tests/g009-batch6-content.test.mjs tests/g009-batch6-deployment.test.mjs` — STY-05 semantic, source, topology and release contracts.
- `node --test tests/source-governance-data.test.mjs tests/source-link-health.test.mjs tests/source-license-inventory.test.mjs` — source identities, roles, licenses and current health.
- `node --test tests/drawio-diagram-validator.test.mjs tests/drawio-svg-pilot.test.mjs` — Draw.io/SVG XML, ID parity, geometry and CSS/contrast behavior.
- `npm run validate:content` — front matter, source, route and section integrity for 100 documents / 519 sources.
- `npm run check:terminology` — Chinese-first terminology across MDX/Draw.io/SVG.
- `npm run check:content` — deterministic 58/100/519 projection with no drift.
- `npm run check:links` — ledger/health-cache agreement.
- `npm run check:reviews` — review freshness, exact hashes and closure evidence.
- `npm run typecheck` — component/import validity.
- `npm run build` — production Docusaurus route and asset build.
- `npm run verify` — full repository gate after Stage A, Stage B and merged-result integration.
- `git diff --check` — whitespace integrity.
- Independent code/content/architecture reviews — no unresolved findings; final APPROVE/READY/CLEAR and rights PASS.
- Exact-head Stage A and Stage B Pages plus production four-state in-app Browser QA — successful deployment, HTTP/asset/interaction/source/relation checks, zero diagnostics, STY-06 unpublished/pending/non-actionable.
