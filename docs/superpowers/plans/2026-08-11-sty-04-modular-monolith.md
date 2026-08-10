# STY-04 Modular Monolith Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-04 模块化单体主题页，以提交订单为统一案例解释模块合同、数据所有权、一致性、部署耦合和服务拆分条件，并完成来源、图示、关系、生成投影与发布证据闭环。

**Architecture:** 新页面沿用现有 `style` 十一段内容契约与 `/styles/sty-04` 路由。正文把订单、库存、支付、通知划为同一部署单元内的业务模块，通过公开合同、本地事务和 Outbox/事件路径解释同步与异步协作；Draw.io 源文件与 SVG 投影精确表达模块、数据和部署边界。Stage A 发布 reviewed 内容但保持 backlog pending，只有 exact-head Pages、浏览器 QA 和独立审查全部通过后，Stage B 才关闭 STY-04 并推进到 STY-05。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-04；不实现 STY-05、CASE-04 或 QST-03，不新增运行时功能，不进行无关重构。
- 模块化单体必须同时表达业务模块边界与单一部署形态；不得把目录、框架模块、共享进程或共享数据库写成自动隔离。
- 其他模块只能通过公开合同或已提交事件协作；不得导入内部类型、调用内部仓储或跨模块直接写表。
- 每个权威数据区只有一个模块所有者；共享物理数据库不等于共享数据模型。
- 同数据库本地事务的原子性必须连同耦合成本解释；Outbox/事件路径必须覆盖提交、投递、重复和恢复，不得宣称天然 exactly-once。
- 单一制品不具备独立发布、独立扩缩或进程故障隔离；服务拆分只能由持续可测压力触发。
- 新正文外链必须登记到 `data/source-ledger.json`，闭合许可证、健康缓存、证据角色和使用边界。
- 图示格式固定为 Draw.io + SVG；源文件和发布投影必须语义同步，不复制外部图示。
- 生成文件只能由 `npm run generate:content` 更新；不新增 npm 依赖，不改变既有 URL、视觉 token 或发布路径。
- 桌面验证使用 `1440x1000`，移动验证使用 `390x844`；页面不得产生 document overflow，console warning/error/page error 均为零。
- 保持用户未跟踪的 `.codex/config.toml` 和 `.pi-subagents/` 不变。

---

## 文件职责地图

- Create: `tests/g009-batch5-content.test.mjs` — STY-04 内容、来源、关系、图示和 Stage A 投影契约。
- Create: `tests/g009-batch5-deployment.test.mjs` — exact-head 发布、浏览器证据和 Stage B 关闭契约。
- Create: `content/styles/sty-04-modular-monolith.mdx` — STY-04 正文与 front matter。
- Create: `diagrams/sty-04-modular-monolith-boundaries.drawio` — 可编辑模块/数据/部署拓扑源。
- Create: `static/img/diagrams/sty-04-modular-monolith-boundaries.svg` — 网站发布用同步 SVG。
- Create: `docs/reviews/g009-batch5.md` — 代码、内容、架构、浏览器与发布证据。
- Modify: `content/styles/sty-03-vertical-slice-architecture.mdx` — 把 STY-04 方向升级为正式互惠链接。
- Modify as justified: `content/styles/sty-01-layered-architecture.mdx`, `content/styles/sty-02-hexagonal-onion-clean.mdx` — 仅补确有语义承接的 STY-04 链接。
- Modify: `content/paths/02-module-boundaries.mdx` — 纳入正式 STY-04 学习入口。
- Modify: `data/source-ledger.json`, `data/source-link-health.json`, `docs/source-license-inventory.md` — 新增三条受治理来源及投影。
- Modify after Stage A production evidence: `docs/content-backlog.md` — 记录精确发布证据并只勾选 STY-04。
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json` — 由既有生成器生成。

## 固定来源与投影计数

- `src-fowler-monolith-first` — `https://martinfowler.com/bliki/MonolithFirst.html`，Martin Fowler，来源角色只支持先建立边界、再按证据拆服务以及单体起步的经验性论述；all-rights-reserved，原创中文总结，不复制正文或图。
- `src-spring-modulith-fundamentals` — `https://docs.spring.io/spring-modulith/reference/fundamentals.html`，Spring Modulith 官方参考，用于核对应用模块、公开/内部边界、允许依赖与结构验证；Apache-2.0 仅覆盖官方项目材料，框架机制不提升为普遍定义。
- `src-spring-modulith-events` — `https://docs.spring.io/spring-modulith/reference/events.html`，Spring Modulith 官方事件参考，用于核对事件发布登记、事务提交后的事件协作和失败恢复机制；不外推为 exactly-once 或任意消息系统保证。
- 2026-08-11 已核对三个 URL 均 HTTP 200；Spring Modulith 仓库 `LICENSE` 为 Apache License 2.0。
- 当前基线：56 completed topics / 98 content documents / 509 governed sources。
- Stage A：56 / 99 / 512；STY-04 `published/pending`，STY-05 `unpublished/pending`。
- Stage B：57 / 99 / 512；STY-04 `published/complete`，STY-05 `unpublished/pending`。

## Task 1: Lock the failing STY-04 contract

**Files:**
- Create: `tests/g009-batch5-content.test.mjs`
- Read-only references: `tests/g009-batch4-content.test.mjs`, `tests/g009-batch3-content.test.mjs`

**Interfaces:**
- Consumes: repository content parsers, source ledger parser, generated topic manifest/indexes, project status, Draw.io/SVG parsing conventions.
- Produces: exact assertions for the page, sources, relationships, topology and pre-closure projection used by Tasks 2–5.

- [ ] **Step 1: Create imports and exact constants.**

  Reuse the batch-4 helper pattern and define these constants verbatim:

  ```js
  const TOPIC_ID = 'STY-04';
  const ROUTE = '/styles/sty-04';
  const ARTICLE = 'content/styles/sty-04-modular-monolith.mdx';
  const DRAWIO = 'diagrams/sty-04-modular-monolith-boundaries.drawio';
  const SVG = 'static/img/diagrams/sty-04-modular-monolith-boundaries.svg';
  const SOURCE_IDS = [
    'src-fowler-monolith-first',
    'src-spring-modulith-fundamentals',
    'src-spring-modulith-events',
  ];
  const REQUIRED_HEADINGS = [
    '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
    '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
    '禁用条件', '对比案例', '来源',
  ];
  ```

- [ ] **Step 2: Assert metadata, semantics and prohibited claims.**

  Require `content_type: style`, `status: reviewed`, `topic_id: STY-04`, `priority: P0`, `depends_on: [STY-00, STY-03]`, actionable published adjacency to STY-01/02/03, and no actionable STY-05 route. Require the article to distinguish public contract/internal implementation, unique data owner/shared physical database, local transaction coupling, Outbox commit/delivery/duplicate/recovery, single artifact/shared process failure domain, and measurable split signals. Reject statements equivalent to “模块等于服务”, “共享数据库等于共享模型”, “模块化单体天然独立部署/扩缩/故障隔离”, or “Outbox 保证 exactly-once”.

- [ ] **Step 3: Assert sources and exact Stage A projection.**

  Require the three source IDs, two independent remote domains, exactly one eligible `manifest_primary`, complete license/evidence-role boundaries, `completed_topics: 56`, `content_documents: 99`, `governed_sources: 512`, STY-04 `published/pending`, and STY-05 `unpublished/pending`.

- [ ] **Step 4: Assert exact diagram inventories.**

  Define stable node IDs for `deployment-boundary`, four module boundaries, four public contracts, four internal implementations, four owned data stores, `outbox`, `event-publication`, and `shared-process-failure-domain`. Define exact edges for request entry, order→inventory, order→payment, order→outbox, outbox→event publication, event publication→notification, and owned-data writes. Require paired Draw.io/SVG inventories, visible type labels, boundary containment, solid sync edges, dashed async/event edges, semantic title/description, color-independent legend, and no cross-module internal/data edge.

- [ ] **Step 5: Run the test and observe RED.**

  Run: `node --test tests/g009-batch5-content.test.mjs`

  Expected: FAIL because the STY-04 article, source records and diagram pair do not exist; existing batch-4 tests remain green.

- [ ] **Step 6: Commit the failing contract.**

  ```bash
  git add tests/g009-batch5-content.test.mjs
  git commit -m "test: define STY-04 content contract"
  ```

## Task 2: Register governed source evidence

**Files:**
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Test: `tests/g009-batch5-content.test.mjs`

**Interfaces:**
- Consumes: the three fixed URLs and IDs above, existing STY-03 ledger schema and health-cache provenance contract.
- Produces: source records accepted by validators and later cited verbatim by the STY-04 page.

- [ ] **Step 1: Capture immutable identity and current health.**

  Fetch the three fixed URLs plus the Spring Modulith repository license. Record HTTP 200, final URL, title, author/organization, publication/update or documentation version boundary, check date `2026-08-11`, source kind, copyright policy, license evidence and explicit non-claims. If a canonical redirect changes, update both ledger and article URL to the exact final transport.

- [ ] **Step 2: Add three complete ledger entries.**

  Copy the field shape of the current STY-03 entries. Set exactly one direct source to `manifest_primary`; set the remaining two to narrower factual roles. Add `citation_titles` for the STY-04 title only where the source is actually used. Do not register the same transport twice.

- [ ] **Step 3: Add health-cache observations and regenerate public source artifacts.**

  Update `data/source-link-health.json` with the existing merge-provenance contract, then run:

  ```bash
  npm run generate:content
  npm run check:links
  ```

  Expected: three new sources are projected; cache and ledger commitments agree.

- [ ] **Step 4: Run the source gates.**

  Run: `node --test tests/source-governance-data.test.mjs tests/source-link-health.test.mjs tests/source-license-inventory.test.mjs tests/g009-batch5-content.test.mjs`

  Expected: source tests pass; STY-04 test fails only on the missing article/diagram/relations.

- [ ] **Step 5: Commit source registration.**

  ```bash
  git add data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md src/generated/source-ledger.json tests/g009-batch5-content.test.mjs
  git commit -m "docs: register STY-04 modular monolith sources"
  ```

## Task 3: Create the synchronized module-boundary diagram

**Files:**
- Create: `diagrams/sty-04-modular-monolith-boundaries.drawio`
- Create: `static/img/diagrams/sty-04-modular-monolith-boundaries.svg`
- Modify: `tests/g009-batch5-content.test.mjs`

**Interfaces:**
- Consumes: the exact node/edge IDs from Task 1 and repository Draw.io conventions.
- Produces: a synchronized, accessible diagram pair embedded by Task 4.

- [ ] **Step 1: Load the required diagram skill and repository visual language.**

  Use `creating-drawio-architecture-diagrams`; preserve editable XML, semantic IDs and synchronized SVG output. Do not introduce raster output because this visual encodes exact topology rather than metaphor.

- [ ] **Step 2: Draw the topology with explicit containment.**

  Create one outer `单一部署单元` boundary. Inside it place four non-overlapping module regions: `订单模块`, `库存模块`, `支付模块`, `通知模块`. Each region contains one `公开合同`, one `内部实现`, and one uniquely owned data node. Place `Outbox` inside the order-owned data area and `事件发布登记` as the bridge to notifications. Place a labelled `共享进程故障域` annotation across the deployment boundary without making it a fifth business module.

- [ ] **Step 3: Encode connection classes.**

  Use solid labelled arrows for synchronous public-contract calls and module-owned writes. Use dashed labelled arrows for committed event publication and delivery. Do not draw any arrow from one module to another module’s internal implementation or owned data. Add a visible legend explaining line types and a note that one deployment unit does not mean one data owner.

- [ ] **Step 4: Export synchronized SVG and verify geometry.**

  The SVG root has a stable `viewBox`, no fixed root width/height, a Chinese `<title>` and `<desc>`, semantic node/edge IDs, arrow markers, readable labels at 800px article width, and enough horizontal width for contained mobile scrolling. Ensure every Draw.io node and edge has an exact SVG counterpart.

- [ ] **Step 5: Run diagram/content tests.**

  Run: `node --test tests/drawio-diagram-validator.test.mjs tests/drawio-svg-pilot.test.mjs tests/g009-batch5-content.test.mjs`

  Expected: diagram pair and geometry assertions pass; remaining failures concern the missing article/relations.

- [ ] **Step 6: Commit the visual pair.**

  ```bash
  git add diagrams/sty-04-modular-monolith-boundaries.drawio static/img/diagrams/sty-04-modular-monolith-boundaries.svg tests/g009-batch5-content.test.mjs
  git commit -m "docs: add STY-04 module boundary diagram"
  ```

## Task 4: Write the article and reciprocal navigation

**Files:**
- Create: `content/styles/sty-04-modular-monolith.mdx`
- Modify: `content/styles/sty-03-vertical-slice-architecture.mdx`
- Modify if semantically needed: `content/styles/sty-01-layered-architecture.mdx`, `content/styles/sty-02-hexagonal-onion-clean.mdx`
- Modify: `content/paths/02-module-boundaries.mdx`
- Test: `tests/g009-batch5-content.test.mjs`

**Interfaces:**
- Consumes: Task 2 source URLs and Task 3 diagram asset.
- Produces: independently readable STY-04 content plus reciprocal published relationships.

- [ ] **Step 1: Add exact front matter.**

  Use:

  ```yaml
  title: 模块化单体：在一个部署单元内保护业务边界
  slug: /styles/sty-04
  content_type: style
  status: reviewed
  difficulty: intermediate
  analyzed_at: 2026-08-11
  source_cutoff: 2026-08-11
  confidence: high
  topic_id: STY-04
  priority: P0
  depends_on: [STY-00, STY-03]
  adjacent_topics: [STY-01, STY-02, STY-03]
  related_cases: [/cases/micro-frontends-single-spa]
  related_questions: []
  ```

  Expand arrays to the repository’s accepted multiline YAML form and use existing quality-attribute/tag conventions.

- [ ] **Step 2: Write all eleven sections around the order scenario.**

  In Chinese-first terminology, explain public contract/internal implementation, order/inventory/payment/notification ownership, local transaction coupling, Outbox commit and recovery, shared process failure domain, team ownership, quality benefits/costs, incremental migration and measurable extraction signals. Mark each source-backed fact, evidence inference, Tego Arch scenario and unknown production result. Include failure branches for inventory rejection, payment uncertainty, transaction rollback, post-commit publication failure, duplicate delivery and notification poison messages.

- [ ] **Step 3: Embed the diagram and exact explanatory caption.**

  Use the existing keyboard-scrollable wrapper:

  ```mdx
  <div className="architecture-diagram-scroll" role="region" aria-label="模块化单体的模块合同、数据所有权与单一部署边界图，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>

  ![订单、库存、支付和通知模块在一个部署单元内通过公开合同与提交后事件协作，各自拥有数据](/img/diagrams/sty-04-modular-monolith-boundaries.svg)

  </div>
  ```

- [ ] **Step 4: Add the comparison and split-decision tables.**

  First table compares ordinary layered monolith, modular monolith and microservices across business boundary, call type, data ownership, consistency, deployment, failure domain, team topology and operating cost. Second table maps measurable pressure to keep/refine/extract decisions; include coordination delay, independent release demand, asymmetric scaling, compliance boundary, blast-radius evidence, migration readiness and rollback ability.

- [ ] **Step 5: Add reciprocal visible links without premature STY-05 activation.**

  Link STY-03 to `/styles/sty-04`; add STY-04 to the module-boundaries path. Update STY-01/STY-02 only where the new page truly resolves an existing comparison direction. Mention STY-05 as the next topic in plain text, never as `/styles/sty-05` or another actionable route.

- [ ] **Step 6: Run targeted content gates.**

  Run: `node --test tests/g009-batch5-content.test.mjs tests/content-relations.test.mjs tests/terminology-content-contract.test.mjs tests/terminology-policy.test.mjs tests/terminology-registry.test.mjs`

  Expected: all targeted tests pass; generated drift is expected until Task 5.

- [ ] **Step 7: Commit article and navigation.**

  ```bash
  git add content/styles/sty-04-modular-monolith.mdx content/styles/sty-03-vertical-slice-architecture.mdx content/styles/sty-01-layered-architecture.mdx content/styles/sty-02-hexagonal-onion-clean.mdx content/paths/02-module-boundaries.mdx tests/g009-batch5-content.test.mjs
  git commit -m "docs: publish STY-04 modular monolith"
  ```

## Task 5: Generate and verify the Stage A projection

**Files:**
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json`
- Create: `tests/g009-batch5-deployment.test.mjs`
- Create: `docs/reviews/g009-batch5.md`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: deterministic Stage A projection and local review record ready for exact-head publication.

- [ ] **Step 1: Add Stage A deployment assertions.**

  Require 56/99/512 counts, STY-04 `published/pending`, STY-05 `unpublished/pending`, canonical route `/styles/sty-04`, SVG route, exact source IDs, no actionable STY-05 URL, and backlog text `当前 G009，下一项为 STY-04` until closure.

- [ ] **Step 2: Generate canonical projections.**

  Run: `npm run generate:content`

  Expected: only STY-04, intended reciprocal relations, three new sources and 56/99/512 projection changes appear.

- [ ] **Step 3: Run focused projection verification.**

  Run: `node --test tests/g009-batch5-content.test.mjs tests/g009-batch5-deployment.test.mjs tests/project-status.test.mjs tests/topic-manifest.test.mjs tests/topic-index.test.mjs && npm run validate:content && npm run check:terminology && npm run check:content && git diff --check`

  Expected: PASS with STY-04 still unchecked in backlog.

- [ ] **Step 4: Perform local browser QA.**

  Build and serve locally. At desktop `1440x1000` and mobile `390x844`, record document width, diagram/table wrapper widths, SVG load, focus-visible state, `ArrowRight` movement, all governed source activations, published reciprocal links, absence of actionable STY-05, and console warning/error/page error counts. Save raw evidence and accepted screenshots under `.superpowers/sdd/`; do not commit transient browser artifacts unless existing batch conventions require them.

- [ ] **Step 5: Run independent reviews and record findings.**

  Obtain distinct code-reviewer, content/evidence and architect judgments. `docs/reviews/g009-batch5.md` records exact artifact SHAs, source/license boundaries, diagram topology/geometry, local verification counts, browser observations, remediation commits and final READY/APPROVE/CLEAR verdicts. Fix all Critical/Important issues before Stage A.

- [ ] **Step 6: Run full Stage A verification and commit.**

  Run: `npm run verify && git diff --check`

  Then:

  ```bash
  git add src/generated/topic-manifest.json src/generated/topic-indexes.json src/generated/project-status.json src/generated/source-ledger.json tests/g009-batch5-deployment.test.mjs docs/reviews/g009-batch5.md
  git commit -m "test: bind STY-04 Stage A projection"
  ```

## Task 6: Publish Stage A and collect exact production evidence

**Files:**
- Modify: `docs/reviews/g009-batch5.md`
- Modify: `tests/g009-batch5-deployment.test.mjs`

**Interfaces:**
- Consumes: clean Stage A commit from Task 5.
- Produces: immutable Pages run and production browser evidence required for closure.

- [ ] **Step 1: Push the exact Stage A head to `origin/main`.**

  Verify `git rev-parse HEAD`, `git rev-parse origin/main`, and clean tracked state before and after push. Do not stage the user’s unrelated untracked files.

- [ ] **Step 2: Wait for the exact GitHub Pages workflow.**

  Require workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, exact `headSha`, `status=completed`, `conclusion=success`, and record build/deploy job IDs. A successful run for another SHA is not evidence.

- [ ] **Step 3: Run production smoke and browser QA.**

  Verify HTTP 200 and expected content type for `/styles/sty-04`, `/styles`, `/paths/module-boundaries`, affected adjacent pages, `/references`, and the SVG. Repeat desktop/mobile overflow, diagram/table keyboard scroll, source/relation activations, STY-05 absence and zero-console checks against production.

- [ ] **Step 4: Bind exact evidence in tests and review.**

  Add the literal Stage A SHA, run ID, jobs, route counts, viewport observations and evidence artifact hash. Run the deployment test and expect PASS while STY-04 remains pending.

- [ ] **Step 5: Commit the immutable Stage A evidence.**

  ```bash
  git add docs/reviews/g009-batch5.md tests/g009-batch5-deployment.test.mjs
  git commit -m "docs: record STY-04 production evidence"
  ```

## Task 7: Close STY-04 in Stage B

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch5.md`
- Modify: `tests/g009-batch5-deployment.test.mjs`
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json`

**Interfaces:**
- Consumes: exact successful Stage A evidence from Task 6.
- Produces: STY-04 complete, STY-05 next and a verified/published 57/99/512 closure.

- [ ] **Step 1: Make the deployment test fail on the pre-closure backlog.**

  Add assertions requiring one checked STY-04 line with exact Stage A SHA, Pages run, review date and live route evidence; require current G009/next STY-05, 57 completed topics, 99 documents, 512 sources, STY-04 `published/complete`, and STY-05 `unpublished/pending`. Run the test and observe RED because STY-04 is still unchecked.

- [ ] **Step 2: Update only the canonical backlog closure.**

  Change `- [ ] **STY-04` to `- [x] **STY-04` and append exact Stage A commit/run/live-review evidence. Update the current release baseline so G009 remains current and STY-05 becomes next. Do not check STY-05 or alter unrelated backlog entries.

- [ ] **Step 3: Regenerate Stage B projections.**

  Run: `npm run generate:content`

  Expected: 57/99/512; STY-04 complete; STY-05 pending and non-actionable.

- [ ] **Step 4: Run post-cleanup verification and independent final review.**

  Run the changed-files `ai-slop-cleaner` pass, then rerun targeted tests and `npm run verify`. Obtain final independent code-reviewer APPROVE and architect CLEAR; confirm architecture invariants for module contracts, unique data ownership, explicit transaction/event semantics, shared deployment/failure boundaries and evidence-based extraction.

- [ ] **Step 5: Commit and push Stage B.**

  ```bash
  git add docs/content-backlog.md docs/reviews/g009-batch5.md tests/g009-batch5-deployment.test.mjs src/generated/topic-manifest.json src/generated/topic-indexes.json src/generated/project-status.json src/generated/source-ledger.json
  git commit -m "docs: close STY-04 modular monolith"
  git push origin main
  ```

- [ ] **Step 6: Verify exact Stage B Pages and final live state.**

  Wait for the exact closure SHA’s successful Pages run. Verify `/`, `/styles`, `/styles/sty-04`, `/paths/module-boundaries`, `/references`, the SVG, desktop/mobile layout, all intended source/relation interactions, zero diagnostics, 57/99/512 project status and STY-05 pending/non-actionable. Append the Stage B deployment evidence and make any final evidence-only commit required by the existing convention.

- [ ] **Step 7: Checkpoint durable project state.**

  Reconcile `.omx/ultragoal/goals.json` with `docs/content-backlog.md` without falsely reviving G006: record that G006–G008 are historical-complete and G009 remains active at STY-05 only through the supported Ultragoal steering/checkpoint path. Do not hand-edit ledger history or mark G009 complete before STY-06 closes.

## Final verification matrix

- `node --test tests/g009-batch5-content.test.mjs tests/g009-batch5-deployment.test.mjs` — STY-04 semantic and release contracts.
- `npm run validate:content` — front matter, source, route and section integrity.
- `npm run check:terminology` — Chinese-first terminology across MDX/Draw.io/SVG.
- `npm run check:content` — deterministic generated projection with no drift.
- `npm run check:links` — ledger/health-cache agreement.
- `npm run check:reviews` — review freshness and closure evidence.
- `npm run typecheck` — component/import validity.
- `npm run build` — production Docusaurus route and asset build.
- `npm run verify` — full repository gate.
- `git diff --check` — whitespace integrity.
- Independent code/content/architecture reviews — no Critical/Important findings; final APPROVE/READY/CLEAR.
- Exact-head Pages plus production desktop/mobile browser QA — successful deployment, HTTP/asset/interaction checks and zero diagnostics.
