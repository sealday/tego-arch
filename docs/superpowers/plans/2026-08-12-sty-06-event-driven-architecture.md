# STY-06 Event-Driven Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-06 事件驱动架构主题页，以同一订单案例准确区分事件通知、状态转移、事件携带状态和事件溯源，并完成来源、原创比较图、关系、生成投影、独立审查及 Stage A/Stage B 线上发布闭环。

**Architecture:** 新页面沿用 `style` 十一段内容契约与 `/styles/sty-06` 路由。正文固定订单—库存—支付—通知参与者和五个比较问题，分别改变事件语义、载荷、取数方式与权威状态位置；Draw.io/SVG 用四列五行比较板同步表达四种模式，决策矩阵给出采用与停止条件。Stage A 发布 reviewed 内容但保持 backlog pending，只有 exact-head Pages、四态 in-app Browser QA 和三类独立审查闭合后，Stage B 才把完成数从 58 推进到 59，并保持 STY-07 unpublished/pending/non-actionable。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-06；不实现 STY-07、STY-14 或新的产品运行时功能，不进行无关重构。
- 四类固定为“事件通知、状态转移、事件携带状态、事件溯源”，是 Tego Arch 教学比较框架，不宣称为唯一分类或成熟度阶梯。
- 四轮必须使用同一订单—库存—支付—通知案例和同一组五个比较问题，不用四套无关示例制造伪比较。
- 状态转移描述合法业务状态机，不等于事件携带状态；完整消息载荷不等于事件溯源；代理、Outbox、CQRS、异步或可重放日志都不能单独证明事件溯源。
- 命令、领域事件、集成事件、事件代理、Outbox、事件存储、权威写模型、本地副本和派生投影必须有可测试的不同责任。
- 事件溯源的按聚合有序事件流是权威写入记录；回放只能恢复确定性内部状态，不得再次扣款、发短信或调用不可逆外部系统。
- 传递按至少一次设计；消费者幂等；重复、乱序、模式版本、积压、死信、毒事件、受控重放和人工终止均有明确所有者。
- 新正文外链必须登记 `data/source-ledger.json`，闭合许可证、健康缓存、证据角色与使用边界；恰好一个引用投影为 `manifest_primary`。
- 图示格式固定为 Draw.io + SVG；源文件和发布投影必须语义、ID、几何、marker、有效样式、背景对比和可访问描述同步，不复制外部图示。
- 生成文件只能由 `npm run generate:content` 更新；不新增 npm 依赖，不改变既有 URL、全站视觉 token 或发布路径。
- 桌面验证使用 `1440x1000`，移动验证使用 `390x844`，浅色/暗色均检查；页面不得产生 document overflow，Browser warning/error、`Runtime.exceptionThrown`、`Log.entryAdded` 均为零。
- 保持用户未跟踪的 `.codex/config.toml` 和 `.pi-subagents/` 不变。

---

## 文件职责地图

- Create: `tests/g009-batch7-content.test.mjs` — STY-06 内容、来源、关系、图示和 Stage A 投影契约。
- Create: `tests/g009-batch7-deployment.test.mjs` — 独立 verdict、exact-head Pages、Browser 证据和 Stage B 关闭契约。
- Create: `content/styles/sty-06-event-driven-architecture.mdx` — STY-06 正文与 front matter。
- Create: `diagrams/sty-06-event-driven-four-patterns.drawio` — 四模式可编辑比较图源。
- Create: `static/img/diagrams/sty-06-event-driven-four-patterns.svg` — 网站发布用同步 SVG。
- Create: `docs/reviews/g009-batch7.md` — 代码、内容/版权、架构、Browser、Pages 与闭环证据。
- Modify: `content/styles/sty-05-microservices.mdx` — 将 STY-06 plain text 升级为正式互惠链接，不改变已发布 Saga/支付合同。
- Modify: `content/principles/pr-11-cqs-cqrs-read-write-separation.mdx` — 补 STY-06 互惠入口并保持“CQRS 不要求事件溯源”。
- Modify: `content/modeling/mod-08-state-machine-modeling.mdx` — 补 STY-06 状态转移入口，不改变既有状态机结论。
- Modify as required by generated navigation: `content/styles/index.mdx`, `content/paths/02-module-boundaries.mdx` — 只加入正式 STY-06 入口。
- Modify: `data/source-ledger.json`, `data/source-link-health.json`, `docs/source-license-inventory.md` — 五个远程来源、一个原创插图来源及 STY-06 引用。
- Modify if terminology fails without a lawful MDX-local exemption: `data/terminology.json`, `tests/terminology-registry.test.mjs`, `tests/terminology-policy.test.mjs` — 仅增加精确术语条目，不添加路径或通配豁免。
- Modify after Stage A evidence: `docs/content-backlog.md` — 记录精确发布证据并只勾选 STY-06。
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json` — 仅由既有生成器生成。

## 固定来源、关系与投影

实现使用以下六个来源 ID；若远程身份或许可证证据在执行日与这里冲突，停止该来源并先修订计划，不以近似页面替换：

- `src-fowler-what-do-you-mean-event-driven` — canonical `https://martinfowler.com/articles/201701-event-driven.html`；Martin Fowler，2017-02-07；`LicenseRef-All-Rights-Reserved`、`facts-and-short-quotation`。支持事件通知、事件携带状态、事件溯源及被动攻击式命令边界；不支持本文“状态转移”作为业界通用第四分类。它是唯一 `manifest_primary`。
- `src-microsoft-event-driven-architecture-style` — canonical `https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven`；transport `https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/7b4bf26469bc45810c64406ad3cebdae4f60fb6b/docs/guide/architecture-styles/event-driven.md`；`ms.date: 03/06/2026`；仓库 `LICENSE` 为 `CC-BY-4.0`。支持生产者/通道/消费者、keys-vs-full-payload、顺序、幂等、错误处理、观测与模式演进，不把 Azure 产品建议外推为普遍要求。
- `src-microsoft-event-sourcing-pattern` — canonical `https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing`；transport `https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/7b4bf26469bc45810c64406ad3cebdae4f60fb6b/docs/patterns/event-sourcing.md`；`ms.date: 03/27/2026`；同一 pinned repository `CC-BY-4.0`。支持追加式事件存储、按实体事件流、rehydration、投影、并发、快照与演进成本；不复制其图示。
- `src-cncf-cloudevents-102-spec` — canonical `https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md`；transport `https://raw.githubusercontent.com/cloudevents/spec/v1.0.2/cloudevents/spec.md`；version `v1.0.2`；license evidence `https://raw.githubusercontent.com/cloudevents/spec/v1.0.2/LICENSE`；`Apache-2.0`。只支持公共事件上下文字段与协议无关信封，不用于证明四模式分类或业务状态语义。
- `src-w3c-scxml-2015` — canonical `https://www.w3.org/TR/2015/REC-scxml-20150901/`；W3C Recommendation，2015-09-01；`LicenseRef-Proprietary-Standard`、`facts-and-short-quotation`，许可证证据使用该规范的 W3C document-use 链接。只支持事件、活动状态、守卫和合法 transition 的状态机语义；“状态转移”作为第四教学列明确标为 Tego Arch 分析。
- `src-atlas-sty06-event-driven-four-patterns` — `/img/diagrams/sty-06-event-driven-four-patterns.svg`；Tego Arch maintainers；`LicenseRef-Atlas-Original`、`original-atlas`、`illustration-rights`；不含外部参考图、品牌视觉、签名、水印或复制构图。

固定关系：`depends_on: [STY-00, STY-05]`；`adjacent_topics: [STY-04, STY-05, PR-11, MOD-08]`；`related_cases: [/cases/apache-kafka-consumer-groups]`；`related_questions: []`。若生成器禁止跨内容类型 adjacency，保留正文可见互惠链接并按现有 schema 将跨类型关系移到唯一合法字段，测试必须锁定最终表示。

当前基线为 `58 completed / 100 documents / 519 governed sources`。采用上述五个远程来源和一个原创来源后，计划投影为：Stage A `58 / 101 / 525`，STY-06 `published/pending`、STY-07 `unpublished/pending`；Stage B `59 / 101 / 525`，STY-06 `published/complete`、STY-07 `unpublished/pending`。生成器结果若不同，先解释来源或文档差异并更新测试/评审中的当前事实，不修改历史证据来迎合预期。

## Task 1: Lock the failing STY-06 contract

**Files:**
- Create: `tests/g009-batch7-content.test.mjs`
- Read: `tests/g009-batch6-content.test.mjs`, `tests/g009-batch6-deployment.test.mjs`, `content/styles/sty-05-microservices.mdx`

**Interfaces:**
- Consumes: repository MDX/front-matter parsers, source-ledger schema, generated topic projections and existing Draw.io/SVG geometry helpers.
- Produces: exact article/source/relation/diagram/pre-closure assertions consumed by Tasks 2–4.

- [ ] **Step 1: Create exact constants and parsing helpers.**

  Define the public contract verbatim:

  ```js
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
  ```

  Import or locally reproduce only the smallest stable helpers needed for front matter, visible Markdown links, SVG selector resolution, bounding boxes and mutation execution. Do not export private helpers from an old batch merely to share test code.

- [ ] **Step 2: Assert metadata, headings and the same-case comparison.**

  Require `content_type: style`, `status: reviewed`, `topic_id: STY-06`, `priority: P0`, exact route and fixed relationships. Require all eleven headings once and in order. For every mode require the literals `订单`, `库存`, `支付`, `通知` plus answers for the five comparison questions. Reject a mutation that replaces one mode’s scenario with an unrelated customer/catalog example.

- [ ] **Step 3: Assert the four semantic boundaries and prohibitions.**

  Require:

  ```js
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
  ```

  Require separate definitions for command/domain event/integration event/broker/Outbox/event store/local copy/projection and controlled mutations that conflate each critical pair.

- [ ] **Step 4: Assert reliability and decision matrix coverage.**

  Require at-least-once, event ID, aggregate/business key, schema version, correlation ID, causation ID, idempotency, bounded retry, DLQ owner, poison isolation, controlled replay, manual terminal, backlog/lag/projection-watermark observability. Require a four-column decision matrix with rows for payload, lookup, temporal/schema coupling, source of truth, copies, ordering, replay, audit, privacy, evolution, cost and use/stop signals.

- [ ] **Step 5: Assert source, relation and Stage A projection contracts.**

  Require all six source IDs, at least four independent remote hostnames, exactly one `manifest_primary`, complete license/evidence-role boundaries and original illustration rights. Require visible reciprocal links from STY-05, PR-11 and MOD-08; `/cases/apache-kafka-consumer-groups`; no actionable `/styles/sty-07`. Require Stage A `58/101/525`, STY-06 `published/pending`, STY-07 `unpublished/pending`.

- [ ] **Step 6: Assert diagram inventory, geometry and contrast.**

  Lock these groups before drawing:

  ```js
  const COLUMN_IDS = ['notification-column', 'transition-column', 'carried-state-column', 'event-sourcing-column'];
  const ROW_IDS = ['producer-write-row', 'event-payload-row', 'consumer-read-row', 'authority-row', 'recovery-row'];
  const CRITICAL_IDS = [
    'notification-event', 'notification-lookup', 'transition-event', 'consumer-state-machine',
    'state-snapshot-event', 'consumer-local-copy', 'command-handler', 'aggregate',
    'event-store', 'read-projection', 'integration-event', 'event-broker', 'replay-path',
  ];
  ```

  Require Draw.io/SVG ID parity, containment in the correct column/row, no replay edge to payment/notification side-effect nodes, separate event-store and broker nodes, unique connector paths, actual marker-aware label clearance, selector-bound effective contrast and mutation rejection.

- [ ] **Step 7: Run RED and commit.**

  Run: `node --test tests/g009-batch7-content.test.mjs`

  Expected: FAIL because the article, source records, relationships and diagram pair do not exist.

  ```bash
  git add tests/g009-batch7-content.test.mjs
  git commit -m "test: define STY-06 content contract"
  ```

## Task 2: Create the synchronized four-pattern diagram

**Files:**
- Create: `diagrams/sty-06-event-driven-four-patterns.drawio`
- Create: `static/img/diagrams/sty-06-event-driven-four-patterns.svg`
- Modify: `tests/g009-batch7-content.test.mjs`

**Interfaces:**
- Consumes: exact semantic IDs, rows, columns and thresholds from Task 1.
- Produces: synchronized accessible Draw.io/SVG assets embedded and governed in Task 3.

- [ ] **Step 1: Load the required diagram skills.**

  Read and follow `creating-drawio-architecture-diagrams` and `illustrating-architecture-articles`, including every required reference they route to. Record the format decision as Draw.io + SVG because the visual has four comparison columns, five semantic rows, multiple path classes, a legend and recovery routes.

- [ ] **Step 2: Build the four-column/five-row source.**

  Use a fixed opaque canvas. Give every column and row the IDs from Task 1. Reuse the same order/inventory/payment/notification vocabulary in each column. Place each node wholly inside its assigned cell; keep column headers and row labels in reserved bands rather than over connector lanes.

- [ ] **Step 3: Draw the four decisive paths.**

  Encode exactly:

  ```text
  notification: order authority -> minimal OrderSubmitted -> broker -> consumer -> synchronous lookup -> order authority
  transition: order transition -> {from,to,reason,aggregateVersion} -> consumer state machine -> accept/ignore/hold
  carried-state: order authority -> versioned state event -> consumer local copy -> autonomous read
  event-sourcing: command -> handler -> load/replay aggregate -> append expectedVersion -> event store -> read projection
                  event store/domain stream -> integration mapper -> broker -> external consumers
  ```

  The replay route terminates only at aggregate/projection nodes. External payment and notification side effects appear only as a crossed-out/forbidden legend note or prose annotation, never as replay targets.

- [ ] **Step 4: Add color-independent connector semantics and legend.**

  Use distinct dash/marker combinations for command, event delivery, synchronous lookup and replay. Bind each legend key/caption to the corresponding connector class with `legendFor`/`data-legend-for`. Include authority, derived copy and projection symbols. Do not use masking rectangles over paths.

- [ ] **Step 5: Export SVG and enforce exact geometry.**

  Export a stable `viewBox` with no fixed root width/height, Chinese `<title>`/`<desc>`, semantic IDs and CSS classes. At an 800px rendered width require: label-to-stroke `>=8px`, label-to-real-marker `>=16px`, label-to-node `>=12px`, label-to-boundary inner stroke `>=12px`, header inner-stroke padding `>=12px`, and legend caption/key/foreign-marker clearance `>=12/12/16px`. Require zero shared/overdrawn connector segments and a reserved connector-free legend band.

- [ ] **Step 6: Add mutation-resistant presentation tests.**

  Resolve actual element presentation, class rules, inheritance, opacity and effective local background. Verify WCAG-style contrast for every essential node label, edge, edge label, legend label and note. Mutations must be non-no-op and fail when: `.replay` targets the side-effect node; `event-store` and `event-broker` IDs are merged; an edge crosses a foreign label; an essential edge becomes white on white; a legend key points at the wrong class.

- [ ] **Step 7: Validate and visually inspect.**

  Run:

  ```bash
  node --test tests/g009-batch7-content.test.mjs tests/drawio-diagram-validator.test.mjs tests/drawio-svg-pilot.test.mjs
  npm run check:terminology
  git diff --check
  ```

  Render the SVG at exactly 800px wide, inspect the full raster at original resolution, and record actual minima plus any intentionally deferred browser-only measurement. Expected: diagram assertions pass; content/source/projection assertions remain RED.

- [ ] **Step 8: Commit the visual pair.**

  ```bash
  git add diagrams/sty-06-event-driven-four-patterns.drawio static/img/diagrams/sty-06-event-driven-four-patterns.svg tests/g009-batch7-content.test.mjs
  git commit -m "docs: add STY-06 four-pattern diagram"
  ```

## Task 3: Write the article, register sources and close relationships

**Files:**
- Create: `content/styles/sty-06-event-driven-architecture.mdx`
- Modify: `content/styles/sty-05-microservices.mdx`
- Modify: `content/principles/pr-11-cqs-cqrs-read-write-separation.mdx`
- Modify: `content/modeling/mod-08-state-machine-modeling.mdx`
- Modify as generated navigation requires: `content/styles/index.mdx`, `content/paths/02-module-boundaries.mdx`
- Modify: `data/source-ledger.json`, `data/source-link-health.json`, `docs/source-license-inventory.md`
- Modify if required: `data/terminology.json`, `tests/terminology-registry.test.mjs`, `tests/terminology-policy.test.mjs`
- Test: `tests/g009-batch7-content.test.mjs`

**Interfaces:**
- Consumes: diagram route and semantics from Task 2; six fixed source identities and relationship contract.
- Produces: independently readable STY-06 page, governed citations and reciprocal navigation used by generation in Task 4.

- [ ] **Step 1: Recheck exact source identities, licenses and health.**

  For each fixed remote source, fetch canonical and transport locators, record actual final URL/status/title/date, and verify license evidence. Use check date `2026-08-12`. Do not add uncited provisional ledger rows: `validateSourceGovernance()` requires every non-discovery source to be cited by an existing document, so article and source records land in this same task.

- [ ] **Step 2: Add the exact front matter and opening contract.**

  Use:

  ```yaml
  ---
  title: 事件驱动架构：先分清事件携带什么，再决定状态放在哪里
  slug: /styles/sty-06
  content_type: style
  status: reviewed
  difficulty: advanced
  analyzed_at: 2026-08-12
  source_cutoff: 2026-08-12
  confidence: high
  domains: [software-architecture, distributed-systems, data-architecture]
  agent_patterns: []
  protocols: []
  quality_attributes: [scalability, availability, evolvability, recoverability, operability]
  tags: [架构风格, 事件驱动, 事件通知, 状态转移, 事件携带状态, 事件溯源]
  summary: 以同一订单案例并排区分事件通知、状态转移、事件携带状态和事件溯源，比较载荷、回查、权威状态、重建与恢复责任。
  topic_id: STY-06
  priority: P0
  depends_on: [STY-00, STY-05]
  adjacent_topics: [STY-04, STY-05, PR-11, MOD-08]
  related_cases: [/cases/apache-kafka-consumer-groups]
  related_questions: []
  ---
  ```

  If YAML flow collections violate repository conventions or parser rules, expand them to block lists without changing values.

- [ ] **Step 3: Write the eleven sections around the fixed five questions.**

  Use the exact heading sequence from Task 1. In “边界与控制流”, embed the SVG inside a focusable region:

  ```mdx
  <div className="architecture-diagram-scroll" role="region" aria-label="订单事件的四种模式并排比较图，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>

  ![同一订单事实分别采用事件通知、状态转移、事件携带状态与事件溯源时，载荷、取数、权威状态和恢复路径的差异](/img/diagrams/sty-06-event-driven-four-patterns.svg)

  </div>
  ```

  Give each of the four modes its own named subsection and answer the five questions in the same order. State that only three names align directly with Fowler’s comparison; the fourth is the project’s state-machine teaching lens supported separately by W3C SCXML semantics.

- [ ] **Step 4: Add the exact decision and reliability tables.**

  Add one focusable horizontal wrapper containing the four-mode matrix with the rows locked in Task 1. Add a second focusable table mapping failure class to detection, automatic response, stop condition and human owner. Both wrappers use `role="region"`, an exact Chinese `aria-label`, `tabIndex={0}` and `handleHorizontalArrowKey`; mutations remove/change each focus semantic and must fail.

- [ ] **Step 5: Register all six sources and citations.**

  Add five remote records and the local illustration record with the fixed IDs. Add the STY-06 document citation list with exactly one `manifest_primary` (Fowler). Use Microsoft pinned raw transports and shared CC-BY-4.0 repository license evidence but separate source identity/license family per named work. Use CloudEvents `Apache-2.0`; use W3C `LicenseRef-Proprietary-Standard`; use the local illustration contract. Add exact license-inventory rows and current health observations.

- [ ] **Step 6: Add reciprocal links without semantic expansion.**

  In STY-05 replace only the final plain-text STY-06 mention with a visible `/styles/sty-06` link and a sentence that events do not erase service/data ownership. In PR-11 link to STY-06 while retaining the literal conclusion that CQRS can exist without event sourcing. In MOD-08 link “状态转移” to STY-06 while retaining that a state diagram alone does not prove cross-system effects. Add the directory/path link only if generator or navigation tests require it. Do not add any `/styles/sty-07` href.

- [ ] **Step 7: Resolve terminology narrowly.**

  Run `npm run check:terminology`. Prefer valid MDX-native local suppressions with exact reasons for one-off visible literals. If a required front-matter literal cannot be suppressed, add one exact registry entry and mutation tests proving deletion returns `unknown-english-term` or `first-use-required`. Never add wildcard, directory or file-path exemptions.

- [ ] **Step 8: Run article/source/relationship gates.**

  Run:

  ```bash
  node --test tests/g009-batch7-content.test.mjs tests/source-governance-data.test.mjs tests/source-link-health.test.mjs tests/source-license-inventory.test.mjs tests/content-relations.test.mjs tests/terminology-registry.test.mjs tests/terminology-policy.test.mjs
  npm run validate:content
  npm run check:terminology
  npm run check:links
  npm run typecheck
  npm run build
  git diff --check
  ```

  Expected: all content/source/diagram/relation assertions pass; only Stage A generated projection remains RED.

- [ ] **Step 9: Commit the publishable content slice.**

  ```bash
  git add content/styles/sty-06-event-driven-architecture.mdx content/styles/sty-05-microservices.mdx content/principles/pr-11-cqs-cqrs-read-write-separation.mdx content/modeling/mod-08-state-machine-modeling.mdx content/styles/index.mdx content/paths/02-module-boundaries.mdx data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md data/terminology.json tests/terminology-registry.test.mjs tests/terminology-policy.test.mjs tests/g009-batch7-content.test.mjs
  git commit -m "docs: add STY-06 event-driven architecture"
  ```

  Stage only files that actually changed; absent optional files are not an error.

## Task 4: Generate, review and bind the Stage A candidate

**Files:**
- Create: `tests/g009-batch7-deployment.test.mjs`
- Create: `docs/reviews/g009-batch7.md`
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json`
- Modify current-projection tests only where they intentionally assert the live latest state
- Local ignored evidence: `.superpowers/sdd/sty06-task-4-*`

**Interfaces:**
- Consumes: publishable content, diagram and source slice from Task 3.
- Produces: exact reviewed Stage A commit with generated `58/101/525`, local four-state evidence and final independent verdicts; deployment remains `NOT_RUN`.

- [ ] **Step 1: Write the Stage A deployment RED.**

  Require generated `58/101/525`, STY-06 `published/pending`, STY-07 `unpublished/pending`, six exact governed sources, current G009/next STY-06, a review with exact artifact hashes, four local Browser states, three independent verdict slots, final `READY`, scope `STAGE_A_ONLY`, deployment `NOT_RUN`, and no Stage B closure. Run it before generation and observe projection/review failures.

- [ ] **Step 2: Generate canonical projections.**

  Run: `npm run generate:content`

  Expected: `58 completed / 101 documents / 525 sources`; `/styles/sty-06` published; STY-06 pending; STY-07 absent from actionable routes. If generation requires a visible parent link, add exactly `/styles` to the article and lock it with a test.

- [ ] **Step 3: Synchronize only live-projection fixtures.**

  Run the full tests once. For failures caused solely by 100→101 documents, 519→525 sources or STY-06 becoming published/pending, update only tests whose documented contract is the latest projection. Preserve historical review payloads, hashes, Pages IDs and previous batch facts byte-for-byte; add an immediate-history hash lock before touching any historical-looking fixture.

- [ ] **Step 4: Run local four-state in-app Browser QA.**

  Build and serve the exact local head. For `desktopLight`, `desktopDark` at `1440x1000` and `mobileLight`, `mobileDark` at `390x844`, record: page client/scroll width; diagram plus two table wrapper client/scroll widths; SVG loaded/intrinsic/rendered dimensions; active `:focus-visible`, outline and ArrowRight before→after for all three wrappers; exact intended relation href/H1/return; five remote anchors with href/target/rel and at least four unique domains; STY-07 actionable count zero; warning/error, `Runtime.exceptionThrown`, `Log.entryAdded`, `hasMore`, `truncated`. Save one uniform raw JSON plus four fresh screenshots under `.superpowers/sdd/`, hash each and visually inspect the diagram in both themes. If screenshot capture fails, record exact attempts and mark visual evidence blocked; do not reuse old files.

- [ ] **Step 5: Run three independent reviews and remediate.**

  Obtain separate code-reviewer, content/evidence/rights and architect reviews against one exact head. Code review checks mutation resistance, selector-bound presentation, generator/history safety and no validator weakening. Content review checks originality, source roles/licenses, all four mode boundaries and Chinese clarity. Architecture review proves authority/replay invariants, command/event separation, no exactly-once claim and no replayed external side effects. Fix findings, preserve superseded verdict history and rerun the affected reviewer.

- [ ] **Step 6: Bind exact hashes, Browser evidence and verdicts.**

  `docs/reviews/g009-batch7.md` records exact article/Draw.io/SVG/ledger hashes, projection, local Browser artifact/screenshot hashes or honest screenshot limitation, relation/source totals and exact reviewed head. Bind final literals: code `READY / APPROVE` findings `0`; content `CONTENT READY`, rights `PASS`, findings `0`; architecture `CLEAR / READY`, findings `0`; final Stage A `READY`; deployment `NOT_RUN`. Add mutations for wrong head/hash/count, weakened verdict, missing Browser state, truncated diagnostics, fabricated screenshot success and fabricated STY-07 absence.

- [ ] **Step 7: Run full Stage A verification and commit.**

  Run: `npm run verify && git diff --check`

  ```bash
  git add src/generated/topic-manifest.json src/generated/topic-indexes.json src/generated/project-status.json src/generated/source-ledger.json tests/g009-batch7-deployment.test.mjs docs/reviews/g009-batch7.md
  git commit -m "test: bind STY-06 Stage A projection"
  ```

## Task 5: Publish Stage A and capture exact production evidence

**Files:**
- Modify: `docs/reviews/g009-batch7.md`
- Modify: `tests/g009-batch7-deployment.test.mjs`
- Local ignored evidence: `.superpowers/sdd/sty06-task-5-*`

**Interfaces:**
- Consumes: clean reviewed Stage A commit from Task 4.
- Produces: immutable exact-head Pages, HTTP, SVG and production Browser evidence required for Stage B closure.

- [ ] **Step 1: Perform safe publication preflight.**

  Record local HEAD, `origin/main`, merge-base, ahead/behind, tracked-clean state and user-untracked preservation. Push only with `git push origin HEAD:main` when it is a fast-forward; if remote advanced, fetch and integrate without force or destructive reset.

- [ ] **Step 2: Bind the exact Pages workflow.**

  Wait for workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, exact `headSha`, `status=completed`, `conclusion=success`. Record run, build job and deploy job IDs with each status/conclusion. A successful run for another SHA is not evidence.

- [ ] **Step 3: Probe production routes and asset identity.**

  Require HTTP 200 and correct content types for `/`, `/styles`, `/styles/sty-06`, `/styles/sty-05`, `/principles/pr-11`, `/modeling/mod-08`, `/cases/apache-kafka-consumer-groups`, `/references` and `/img/diagrams/sty-06-event-driven-four-patterns.svg`. Record bytes/SHA for every route and require the live SVG SHA to equal the reviewed asset.

- [ ] **Step 4: Repeat production four-state Browser QA.**

  Repeat every Task 4 measurement and activation against `https://sealday.github.io/tego-arch/styles/sty-06`. If `_blank` popup or offscreen physical click is unavailable, first capture the exact visible-DOM href, then directly open that identical target and record that no physical click occurred. Never substitute Chrome/Playwright when the task explicitly requires the in-app Browser.

- [ ] **Step 5: Add mutation-sensitive production evidence.**

  Bind exact implementation SHA, run/jobs, route totals, live SVG identity, four states, 12 wrapper interactions, per-state relation/source outcomes, STY-07 zero actionable count, complete non-truncated diagnostics and screenshot hashes/status. Mutations must reject wrong SHA/run/job/outcome, omitted state, wrong geometry, missing relation return, altered href/target/rel, truncated logs, old screenshot substitution and fabricated visual PASS.

- [ ] **Step 6: Verify, commit and observe the bounded evidence run.**

  Run focused deployment/review gates, then `npm run verify && git diff --check`.

  ```bash
  git add docs/reviews/g009-batch7.md tests/g009-batch7-deployment.test.mjs
  git commit -m "docs: record STY-06 production evidence"
  git push origin HEAD:main
  ```

  Wait for the evidence commit’s own Pages run and record it only in an ignored report unless a tracked contract explicitly requires it. Do not create recursive evidence commits.

## Task 6: Close STY-06 in Stage B

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch7.md`
- Modify: `tests/g009-batch7-deployment.test.mjs`
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json`
- Modify current-projection tests only where the declared contract is latest state

**Interfaces:**
- Consumes: successful exact Stage A production evidence and final Stage A verdicts.
- Produces: STY-06 complete, STY-07 next/unpublished, verified local Stage B closure candidate `59/101/525`.

- [ ] **Step 1: Write the closure RED and history locks.**

  Hash the complete immediately previous STY-05 backlog/review suffix and assert byte identity. Add Stage B assertions requiring one checked STY-06 line with exact Stage A SHA/run/date/live route/SVG evidence; current G009/next STY-07; `59/101/525`; STY-06 `published/complete`; STY-07 `unpublished/pending/nonactionable`; final Stage B review slots; deployment still `PENDING`. Run and observe expected failures on pre-closure truth.

- [ ] **Step 2: Update only the canonical backlog line and current baseline.**

  Change only `- [ ] **STY-06` to `- [x] **STY-06` and append exact Stage A closure evidence. Update the current release baseline so G009 remains current and STY-07 is the sole next topic. Preserve all prior historical evidence and later backlog wording; do not check or link STY-07.

- [ ] **Step 3: Regenerate Stage B and update current-state fixtures.**

  Run: `npm run generate:content`

  Expected: `59/101/525`; STY-06 complete; STY-07 unpublished/pending/nonactionable. Update only current-projection expectations. Every touched historical suite must retain explicit hash/byte locks for its immutable evidence.

- [ ] **Step 4: Run bounded anti-slop cleanup.**

  Invoke `ai-slop-cleaner` only on the changed Stage B files after behavior locks exist. Remove stale STY-06 “next” messages, obsolete mutation literals, duplicated conclusion prose and dead compatibility branches. Preserve grounded `_blank`/offscreen Browser fallbacks, exact-href evidence and mutation coverage. Add no dependency or abstraction.

- [ ] **Step 5: Obtain and bind independent Stage B verdicts.**

  Run distinct code, content/rights and architecture reviews against one exact local closure head. Require code `READY/APPROVE`, content `READY` + rights `PASS`, architecture `CLEAR/READY`, zero findings/blockers and final `READY`. Preserve remediation history. Keep deployment status `PENDING`; local review readiness is not production success.

- [ ] **Step 6: Verify and commit the closure candidate.**

  Run focused content/deployment/history/source/diagram/review tests, then `npm run verify && git diff --check`.

  ```bash
  git add docs/content-backlog.md docs/reviews/g009-batch7.md tests/g009-batch7-deployment.test.mjs src/generated/topic-manifest.json src/generated/topic-indexes.json src/generated/project-status.json src/generated/source-ledger.json
  git commit -m "docs: close STY-06 event-driven architecture"
  ```

## Task 7: Publish Stage B and reconcile the final repository

**Files:**
- Modify: `docs/reviews/g009-batch7.md`
- Modify: `tests/g009-batch7-deployment.test.mjs`
- Local ignored evidence: `.superpowers/sdd/sty06-task-7-*`

**Interfaces:**
- Consumes: exact reviewed Stage B closure candidate from Task 6.
- Produces: production-confirmed STY-06 closure, bounded evidence commit, final whole-range approval and clean synchronized `main`.

- [ ] **Step 1: Fast-forward publish the reviewed closure.**

  Repeat the safe preflight, push only `HEAD:main`, wait for the exact closure SHA’s successful Pages run/build/deploy jobs, and probe the same nine routes/SVG. Record exact IDs, statuses, response types, byte sizes and hashes.

- [ ] **Step 2: Verify Stage B production four-state behavior.**

  Use the in-app Browser to prove homepage/project status reflects the generated authority exposed by current UI, `/styles` makes STY-06 actionable and STY-07 nonactionable, the article retains all wrapper geometry/focus/ArrowRight behavior, every relation/source destination resolves, the SVG identity is unchanged, and diagnostics are zero/non-truncated. Record any supported fallback precisely. Screenshot failure remains a limitation, never an invented PASS.

- [ ] **Step 3: Bind final evidence through TDD.**

  First add exact production assertions and observe RED. Then update review evidence to `SUCCESS/PASS` only for scopes actually proved. Bind the exact closure SHA/run/jobs, HTTP totals, raw Browser artifact hash/size, per-state totals, screenshot hashes or `BLOCKED/NOT_AVAILABLE`, and STY-07 zero actionable count. Mutations reject every evidence class.

- [ ] **Step 4: Verify, commit and push a bounded evidence commit.**

  Run focused tests, `npm run check:reviews`, then `npm run verify && git diff --check`.

  ```bash
  git add docs/reviews/g009-batch7.md tests/g009-batch7-deployment.test.mjs
  git commit -m "docs: record STY-06 Stage B production evidence"
  git push origin HEAD:main
  ```

  Wait for this evidence commit’s own Pages run and record it only in the ignored report. Do not recursively edit tracked evidence.

- [ ] **Step 5: Run final whole-change review and merged-main verification.**

  Review the full range from `cf736849ec87ead5b8fa3efe00e776d72b9e9847` through the evidence commit. Require no unresolved Critical/High/Medium/Low findings; fix and re-review any finding. Run fresh `npm run verify && git diff --check` on final `main`, require `HEAD == origin/main`, tracked clean, 0 ahead/behind, STY-06 complete, STY-07 pending/nonactionable and user untracked files unchanged.

- [ ] **Step 6: Clean only owned execution resources.**

  If execution used a dedicated worktree/branch, remove only that verified merged worktree and delete only its `codex/` branch after final parity. Never remove `.codex/config.toml`, `.pi-subagents/` or unrelated worktrees/branches.

## Final verification matrix

- `node --test tests/g009-batch7-content.test.mjs tests/g009-batch7-deployment.test.mjs` — STY-06 semantics, topology, evidence and release contracts.
- `node --test tests/source-governance-data.test.mjs tests/source-link-health.test.mjs tests/source-license-inventory.test.mjs` — five remote identities, one original illustration, roles, licenses and current health.
- `node --test tests/drawio-diagram-validator.test.mjs tests/drawio-svg-pilot.test.mjs` — XML/SVG validity, ID parity, geometry, markers and effective presentation.
- `node --test tests/terminology-registry.test.mjs tests/terminology-policy.test.mjs tests/terminology-content-contract.test.mjs` — Chinese-first terminology and mutation-resistant narrow exemptions.
- `npm run validate:content` — front matter, sources, routes and sections for the actual document/source totals.
- `npm run check:terminology` — MDX/Draw.io/SVG visible terminology.
- `npm run check:content` — deterministic Stage A `58/101/525` and Stage B `59/101/525` projections without drift.
- `npm run check:links` — ledger/health-cache agreement.
- `npm run check:reviews` — review freshness, exact hashes, verdicts and evidence.
- `npm run typecheck` — MDX imports/components and TypeScript validity.
- `npm run build` — production route and SVG asset build.
- `npm run verify` — full repository gate after Stage A, Stage B and final integration.
- `git diff --check` — whitespace integrity.
- Independent code/content/rights/architecture reviews — zero unresolved findings; final APPROVE/READY/CLEAR and rights PASS.
- Exact-head Stage A and Stage B Pages plus production four-state in-app Browser QA — successful deployment, HTTP/asset/interaction/source/relation checks, zero diagnostics and STY-07 unpublished/pending/nonactionable.
