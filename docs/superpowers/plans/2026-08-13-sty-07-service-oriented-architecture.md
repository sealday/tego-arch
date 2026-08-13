# STY-07 Service-Oriented Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-07 面向服务架构主题页，用同一企业级订单履约案例准确比较经典 SOA 与微服务，并完成来源、原创对照图、关系、生成投影、独立审查及 Stage A/Stage B 线上发布闭环。

**Architecture:** 新页面沿用 `style` 十一段内容契约与 `/styles/sty-07` 路由。正文固定订单、库存、支付、通知、持久编排器和集成基础设施，明确业务状态、流程状态与技术传输责任；Draw.io/SVG 用左右机制对照板同步表达经典 SOA 与微服务。Stage A 发布 reviewed 内容但保持 backlog pending，只有 exact-head Pages、四态 in-app Browser QA 和三类独立审查闭合后，Stage B 才把完成数从 59 推进到 60，并保持 STY-08 unpublished/pending/non-actionable。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-07；不实现 STY-08、STY-14 或新的产品运行时功能，不进行无关重构。
- SOA 不等于 ESB、Web Services、消息中间件或共享数据库；测试必须分别锁定这些否定边界。
- 经典 SOA 与微服务使用同一订单履约参与者和步骤，不得用两套案例制造伪比较。
- SOA 与微服务存在重叠；比较的是优化尺度与约束组合，不是互斥分类或成熟度阶梯。
- 编排器拥有跨系统流程状态和恢复决策；集成基础设施只拥有技术传输、路由、转换、策略和技术观测；业务系统拥有业务结果与权威数据。
- 不新增 npm 依赖，不改变现有 URL、全站视觉 token、生成器、验证器或 GitHub Pages 工作流。
- `src/generated/` 只能由 `npm run generate:content` 写入，不能手工修改。
- 历史 review、Pages run/job、artifact hash、Browser evidence 与 backlog 历史后缀保持字节不变；当前投影断言可以随生成器真实结果推进。
- 所有实现任务遵循 TDD：先观察真实 RED，再写最小实现，运行 GREEN，最后提交；不得弱化 validator 或用 fallback 掩盖失败。
- 浏览器验证显式使用 in-app Browser；若截图不可用，记录精确尝试并标记 `BLOCKED / NOT_ACCEPTED`，不得替换为 Chrome、外部 Playwright、旧截图或伪造视觉 PASS。
- 当前基线为 `59 completed / 101 documents / 525 governed sources`。预计新增一篇文章和四个新来源身份后 Stage A 为 `59/102/529`，Stage B 为 `60/102/529`；若生成器结果不同，先解释实际文档/来源差异并同步当前投影测试，不改写历史证据。

---

## File Map

### New files

- `tests/g009-batch8-content.test.mjs` — STY-07 正文、来源、关系、图示与 Stage A 投影的 mutation-sensitive 契约。
- `tests/g009-batch8-deployment.test.mjs` — Stage A/Stage B 投影、评审、历史锁与生产证据契约。
- `content/styles/sty-07-service-oriented-architecture.mdx` — 十一段 SOA 主题正文。
- `diagrams/sty-07-soa-microservices-order-fulfillment.drawio` — 可编辑的左右机制对照板源文件。
- `static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg` — 发布 SVG。
- `docs/reviews/g009-batch8.md` — Stage A/Stage B exact-head 评审与发布记录。
- `docs/reviews/evidence/g009-batch8-stage-a-browser.json` — tracked 本地四态 Stage A Browser 原始证据。
- `docs/reviews/evidence/g009-batch8-stage-a-production-browser.json` — tracked Stage A 生产 Browser 原始证据。
- `docs/reviews/evidence/g009-batch8-stage-b-production-browser.json` — tracked Stage B 生产 Browser 原始证据。

### Existing files expected to change

- `data/source-ledger.json` — 三个新标准来源、一个原创插图来源及 STY-07 文档引用。
- `data/source-link-health.json` — 三个新远程 transport 的健康记录；现有 Fowler/Microsoft 记录复用。
- `docs/source-license-inventory.md` — 三个新标准身份与原创插图的许可证边界。
- `content/styles/sty-04-modular-monolith.mdx` — 必要的 STY-07 可见反向关系与 metadata adjacency。
- `content/styles/sty-05-microservices.mdx` — SOA/微服务双向比较关系。
- `content/styles/sty-06-event-driven-architecture.mdx` — 事件通信不决定 SOA 治理的反向关系。
- `content/cases/temporal-saga-durable-execution.mdx` — 仅在生成器要求时加入精确可见反向链接，不改变案例事实。
- `docs/content-backlog.md` — Stage B 仅勾选 STY-07 并记录 exact Stage A 证据，下一项推进为 STY-08。
- `src/generated/content-ledger.json`, `src/generated/project-status.json`, `src/generated/public-source-ledger.json`, `src/generated/topic-indexes.json`, `src/generated/topic-manifest.json` — 生成器产生的 Stage A/Stage B 当前投影。
- 当前投影型 `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs` — 只更新 latest/current counts、next topic 和新反向 adjacency；历史 artifact/run/hash 断言保持不变。

---

## Task 1: Lock the failing STY-07 content contract

**Files:**
- Create: `tests/g009-batch8-content.test.mjs`
- Read: `docs/superpowers/specs/2026-08-13-sty-07-service-oriented-architecture-design.md`
- Read: `tests/g009-batch7-content.test.mjs`

**Interfaces:**
- Consumes: current `59/101/525` generated projection and absent STY-07 article/source/diagram state.
- Produces: exported constants and pure assertion helpers for exact metadata, eleven headings, responsibility polarity, eight-row comparison, seven-row failure table, source identities, reciprocal relations, diagram semantics/geometry and expected Stage A projection.

- [ ] **Step 1: Define exact constants and parsers**

  Create the test with exact paths and immutable contracts:

  ```js
  import assert from 'node:assert/strict';
  import {readFileSync} from 'node:fs';
  import test from 'node:test';

  const ARTICLE = 'content/styles/sty-07-service-oriented-architecture.mdx';
  const DRAWIO = 'diagrams/sty-07-soa-microservices-order-fulfillment.drawio';
  const SVG = 'static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg';
  const TOPIC_ID = 'STY-07';
  const NEXT_TOPIC = 'STY-08';
  const EXPECTED_HEADINGS = [
    '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
    '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
    '禁用条件', '对比案例', '来源',
  ];
  const SOURCE_IDS = [
    'src-oasis-soa-reference-model-1-0',
    'src-oasis-soa-reference-architecture-foundation-1-0',
    'src-w3c-web-services-architecture',
    'src-lewis-fowler-microservices',
    'src-microsoft-microservices-architecture-style',
    'src-atlas-sty07-soa-microservices-order-fulfillment',
  ];
  ```

  Copy the repository-tested front-matter parser, Markdown table parser, MDX link extractor, XML parser, SVG cascade resolver, alpha-composition helper and conservative glyph-box geometry helper from Batch 7. Do not simplify them to regex-only metadata checks or hard-coded expected colors.

- [ ] **Step 2: Add exact article and wrapper contracts**

  Deep-equal all front matter fields, including title, slug, content type, status, difficulty, dates, confidence, domains, patterns, protocols, quality attributes, tags, summary, topic ID, priority and all relation arrays. Require exact H2 order and exactly three scroll owners: one diagram plus two tables, each with `role="region"`, the approved `aria-label`, `tabIndex={0}` and `onKeyDown={handleHorizontalArrowKey}`.

  For every front-matter field and wrapper attribute, create non-no-op delete/change mutations and assert the validator rejects them.

- [ ] **Step 3: Add responsibility, comparison and failure contracts**

  Require affirmative ownership for each concern:

  ```js
  const OWNERSHIP = [
    ['order-authority', /订单系统[^。；]*拥有[^。；]*订单状态/u],
    ['inventory-authority', /库存系统[^。；]*拥有[^。；]*预留/u],
    ['payment-authority', /支付系统[^。；]*拥有[^。；]*支付/u],
    ['notification-authority', /通知系统[^。；]*拥有[^。；]*投递状态/u],
    ['orchestration-state', /编排器[^。；]*拥有[^。；]*流程状态|编排器[^。；]*持久化[^。；]*流程/u],
    ['integration-transport', /集成基础设施[^。；]*负责[^。；]*(路由|转换|技术传输)/u],
  ];
  ```

  Reject polarity reversals such as “不负责”“没有所有者”“责任待定” by replacing the affirmative clause itself. Independently lock the three prohibitions: SOA is not ESB, not Web Services, and does not authorize shared-database writes.

  Parse the exact ordered eight-row SOA/microservices matrix and exact ordered seven-row failure table. For every row, validate every semantic cell and owner; exercise row deletion, swapped cells, changed owner, changed stop condition, fabricated maturity ladder, and “unknown result → blind retry” mutations.

- [ ] **Step 4: Add source, relation and Stage A projection contracts**

  Require the six source IDs, at least four independent remote hostnames, exactly one `manifest_primary` on `src-oasis-soa-reference-model-1-0`, complete license/evidence-role boundaries and original illustration rights. Require visible reciprocal links from STY-04/05/06 and the Temporal case when metadata demands it; require `/styles` and `/cases/temporal-saga-durable-execution`; require no actionable `/styles/sty-08`.

  Assert Stage A projection `59/102/529`, STY-07 `published/pending`, STY-08 `unpublished/pending`. Keep these values isolated in one `EXPECTED_STAGE_A` object so actual generator differences can be reviewed without touching history locks.

- [ ] **Step 5: Add diagram inventory, parity, geometry and contrast contracts**

  Define exact semantic inventories for the SOA side, microservices side, shared comparison boundary, business systems/services, authoritative data, orchestrator, integration infrastructure, platform guardrails, legend and connectors. Require Draw.io edges to use real terminal ports and waypoints; derive actual SVG path/marker/style from rendered selectors and compare labels, endpoints, routes, dash patterns, marker fill/stroke, roles, bounds and font sizes.

  At 800 CSS-pixel render width require at least: connector-stroke clearance `8px`, real marker clearance `16px`, node/boundary clearance `12px`, header inner-stroke padding `12px`, essential text `15px`, legend caption/key `12px`, own marker/caption `16px`. Reject partial collinear overlap, ordinary later-painted opaque/translucent masks, selector-specificity changes, transparent canvas, oversized marker, removed role, changed port, detached participant, moved label and swapped SOA/microservices semantics.

- [ ] **Step 6: Run the focused suite and record meaningful RED**

  Run:

  ```bash
  node --check tests/g009-batch8-content.test.mjs
  node --test tests/g009-batch8-content.test.mjs
  git diff --check
  ```

  Expected: helper/cascade fixtures pass; implementation tests fail only because the STY-07 article, three new remote source records, original illustration record, reciprocal relations, diagram pair and `59/102/529` projection do not yet exist. Fix test defects now; do not weaken the intended contract.

- [ ] **Step 7: Commit the RED contract**

  ```bash
  git add tests/g009-batch8-content.test.mjs
  git commit -m "test: define STY-07 content contract"
  ```

---

## Task 2: Create the synchronized SOA/microservices comparison diagram

**Files:**
- Create: `diagrams/sty-07-soa-microservices-order-fulfillment.drawio`
- Create: `static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg`
- Modify: `tests/g009-batch8-content.test.mjs`

**Interfaces:**
- Consumes: Task 1 diagram inventory, real-port parity and geometry/contrast assertions.
- Produces: synchronized editable/published assets with stable node/edge IDs and a white opaque canvas, ready for the article wrapper in Task 3.

- [ ] **Step 1: Read both required diagram skills completely**

  Read:

  ```text
  .codex/skills/illustrating-architecture-articles/SKILL.md
  .codex/skills/creating-drawio-architecture-diagrams/SKILL.md
  ```

  Follow every referenced geometry, SVG/Draw.io synchronization, export, raster inspection and validator instruction. Record any skill-driven constraint in `.superpowers/sdd/task-2-report.md`.

- [ ] **Step 2: Write the diagram-specific RED mutations**

  Run only the diagram-named tests after adding mutations for: removed business authority, ESB owning business state, shared platform owning business decisions, mismatched participant, missing port, altered waypoint, line/marker style mismatch, label collision, boundary collision, legend collision, later-painted mask, transparent background and low-contrast essential role.

  Expected: current missing assets fail inventory/parity assertions; mutation helpers themselves pass their non-no-op checks.

- [ ] **Step 3: Author the Draw.io source with stable IDs and real ports**

  Use a single page and opaque canvas. Required top-level regions:

  ```text
  comparison-canvas
  soa-boundary
  comparison-axis
  microservices-boundary
  legend-band
  ```

  SOA nodes include `soa-client`, `soa-orchestrator`, `soa-integration`, four business-system contracts, four business systems, four authoritative stores and `soa-process-state`. Microservices nodes include four service contracts, four services, four private authoritative stores and `microservices-platform`. Every connector uses `source`/`target`, normalized `exitX/exitY/entryX/entryY`, perimeter flags and actual `mxGeometry` waypoints; never use `dataRoute`, ignored `sourcePoint` or ignored `targetPoint` as parity evidence.

- [ ] **Step 4: Export and synchronize the SVG**

  Preserve exact semantic IDs through `data-node-id`, `data-edge-id`, `data-role`, `data-source`, `data-target` and `data-legend-for`. Use distinct line styles for business calls, messages, technical routing and compensation. Keep integration/platform boxes visually secondary and explicitly caption their non-ownership boundaries.

- [ ] **Step 5: Run geometry, contrast and parity gates**

  Run:

  ```bash
  node --test --test-name-pattern='STY-07.*(diagram|Draw.io|SVG|geometry|contrast)' tests/g009-batch8-content.test.mjs
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_diagram.py diagrams/sty-07-soa-microservices-order-fulfillment.drawio static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg
  npm run check:terminology
  git diff --check
  ```

  Expected: all diagram-focused tests and bundled validator pass; terminology reports zero issues.

- [ ] **Step 6: Render and inspect at final size**

  Render SVG at 800 CSS pixels wide. Inspect the full raster at original size for cropped text, node overflow, label-to-stroke collisions, obscured connectors, false ownership, legend ambiguity, light/dark readability and SOA/microservices symmetry. Record exact measured minima and raster dimensions; if any visible defect exists, keep the task RED and fix both assets.

- [ ] **Step 7: Commit the synchronized pair**

  ```bash
  git add diagrams/sty-07-soa-microservices-order-fulfillment.drawio \
    static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg \
    tests/g009-batch8-content.test.mjs
  git commit -m "docs: add STY-07 SOA comparison diagram"
  ```

---

## Task 3: Write the article, govern sources and close relationships

**Files:**
- Create: `content/styles/sty-07-service-oriented-architecture.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Modify: `content/styles/sty-04-modular-monolith.mdx`
- Modify: `content/styles/sty-05-microservices.mdx`
- Modify: `content/styles/sty-06-event-driven-architecture.mdx`
- Modify if required: `content/cases/temporal-saga-durable-execution.mdx`
- Modify: `tests/g009-batch8-content.test.mjs`
- Modify current source-governance/terminology count fixtures only when exact counts advance.

**Interfaces:**
- Consumes: Task 1 exact article/source/relation contracts and Task 2 asset paths/IDs.
- Produces: independently readable reviewed MDX, six governed citations, visible reciprocal links and a source-valid pre-generation candidate.

- [ ] **Step 1: Register exact new source identities without provisional citations**

  Add these IDs in deterministic ledger order:

  ```text
  src-oasis-soa-reference-model-1-0
  src-oasis-soa-reference-architecture-foundation-1-0
  src-w3c-web-services-architecture
  src-atlas-sty07-soa-microservices-order-fulfillment
  ```

  Reuse `src-lewis-fowler-microservices` and `src-microsoft-microservices-architecture-style`. For OASIS/W3C, bind exact version/date, canonical and transport locator, standards-body source kind, license evidence and facts-summary boundary. Do not claim a reusable license until the authoritative terms page supports it; use the repository’s narrow ARR/standards policy if necessary. Add the STY-07 document citation map in the same commit so governance never sees uncited provisional records.

- [ ] **Step 2: Write exact front matter and introduction**

  Use the approved metadata and relation arrays. Import `SourceLedger` and `handleHorizontalArrowKey`. State in the opening that SOA is contract/capability/governance oriented, not equivalent to ESB/Web Services/shared DB, and that the comparison is not a maturity ladder.

- [ ] **Step 3: Write the eleven sections and embed the asset**

  Include the exact three focusable wrappers. In control flow, describe the seven-step order orchestration with stable request IDs, local transactions, unknown-result reconciliation and new-business-action compensation. In data/failure sections, preserve separate business authority, workflow state and integration transport ownership. Include the exact eight-row comparison and seven-row failure table from the design.

- [ ] **Step 4: Write migration, adoption and stopping rules**

  Encode the six-step migration sequence and a decision table covering heterogeneous integration, enterprise reuse, independent-release pressure, contract maturity, shared writes, lockstep releases, business-logic growth in the integration layer, platform ownership, observability and recovery drills. Explicitly stop when the central layer becomes a domain/state owner or when governance adds delay without measurable reuse/recovery benefit.

- [ ] **Step 5: Add visible reciprocal links without activating STY-08**

  Add the exact STY-07 relationship to STY-04/05/06 and the Temporal case only where semantically warranted. Run `npm run check:content`; if it reports reverse metadata omissions, add those exact reverse edges and visible links. Never add `/styles/sty-08` as an href or published adjacency.

- [ ] **Step 6: Run source, article, relation and build gates**

  Run:

  ```bash
  node --test tests/g009-batch8-content.test.mjs tests/source-governance*.test.mjs tests/content-relations.test.mjs tests/terminology*.test.mjs
  npm run validate:content
  npm run check:terminology
  npm run check:links
  npm run typecheck
  npm run build
  git diff --check
  ```

  Expected: every content/source/relation/diagram assertion passes; only the isolated Stage A projection assertion remains RED because `src/generated/` has not yet been regenerated.

- [ ] **Step 7: Run writing-density analysis and correct only actionable issues**

  Invoke the architecture-article writing skill required by the repository, then run its density analyzer against the new style page using the supported command form. Require visual-balance above 90 and no blocking warning; advisory long-sentence findings are reviewed, not mechanically shortened at the cost of precision.

- [ ] **Step 8: Commit article, sources and relations**

  Stage only the article, governed source data, precise reciprocal files, count fixtures and focused test. Confirm `git diff --cached --check`, then:

  ```bash
  git commit -m "docs: add STY-07 service-oriented architecture"
  ```

---

## Task 4: Generate, review and bind the Stage A candidate

**Files:**
- Create: `tests/g009-batch8-deployment.test.mjs`
- Create: `docs/reviews/g009-batch8.md`
- Create: `docs/reviews/evidence/g009-batch8-stage-a-browser.json`
- Modify: `src/generated/content-ledger.json`
- Modify: `src/generated/project-status.json`
- Modify: `src/generated/public-source-ledger.json`
- Modify: `src/generated/topic-indexes.json`
- Modify: `src/generated/topic-manifest.json`
- Modify: current projection fixtures surfaced by the full suite.

**Interfaces:**
- Consumes: reviewed Task 3 article/source/diagram candidate and exact current history.
- Produces: Stage A `published/pending` projection, tracked uniform local Browser artifact, exact artifact hashes, independent verdicts and final Stage A `READY / STAGE_A_ONLY / NOT_RUN` review.

- [ ] **Step 1: Write the Stage A deployment RED and immediate-history locks**

  Require expected `59/102/529`, STY-07 `published/pending`, STY-08 `unpublished/pending`, six exact governed sources, current G009/next STY-07, a review with exact article/Draw.io/SVG/ledger hashes, four local Browser states, three independent verdict slots, final `READY`, scope `STAGE_A_ONLY`, deployment `NOT_RUN`, and no Stage B closure.

  Hash the complete immediately previous STY-06 backlog suffix and complete `docs/reviews/g009-batch7.md` bytes. Add non-no-op mutations for appended/deleted historical bytes. Run the test and observe projection/review failures.

- [ ] **Step 2: Generate canonical projections**

  Run:

  ```bash
  npm run generate:content
  npm run check:content
  ```

  Expected: `59/102/529`; `/styles/sty-07` published; STY-07 pending; STY-08 absent from actionable routes. If actual counts differ, audit exact new document/source identities, update only `EXPECTED_STAGE_A` and current projection fixtures, and record the reason in the review.

- [ ] **Step 3: Synchronize only current projection fixtures**

  Run `npm run test`, classify every failure, and update only assertions whose meaning is explicitly “latest/current projection”, “current next topic”, current document/source counts or new reciprocal adjacency. Preserve immutable history payloads, artifact hashes, old Pages IDs and source citations byte-for-byte. Add exact history hashes where an old test depended on live files instead of immutable evidence.

- [ ] **Step 4: Build and collect uniform local four-state Browser evidence**

  Build and serve the exact candidate. Using in-app Browser only, capture `desktopLight`, `desktopDark` at `1440x1000` and `mobileLight`, `mobileDark` at `390x844`. Each state records exact page width, three wrapper widths, three one-to-one focus/ArrowRight interactions, SVG loaded/intrinsic/rendered dimensions, four intended relation href/H1/return checks, five remote anchors across at least four domains, STY-08 actionable count zero, warnings/errors/runtime/log events, `hasMore=false`, `truncated=false`.

  Track the uniform JSON at `docs/reviews/evidence/g009-batch8-stage-a-browser.json`. If screenshots fail, include exact attempts and `BLOCKED / NOT_ACCEPTED`; otherwise store fresh images outside tracked source and bind their hashes.

- [ ] **Step 5: Bind exact raw semantics and mutation resistance**

  The deployment test reads tracked JSON bytes and asserts exact candidate head/hash, state keys, viewport/theme/page geometry, wrapper labels/order/widths, interaction index and ArrowRight delta, exact unique relation href→H1 map, return outcome, exact source href/target/rel, SVG dimensions, STY-08 zero, diagnostics and screenshot status. Add mutations for duplicate/swapped wrappers, swapped interactions, fabricated self-consistent relation, missing return, screenshot PASS, unloaded SVG, truncated diagnostics and changed next-topic count.

- [ ] **Step 6: Run three independent reviews and remediate**

  Dispatch independent code/spec/security, content/evidence/rights and architecture/invariant reviews against one exact implementation head. Each reviewer reports ranked findings and a machine-bindable verdict. Resolve every blocker with RED→GREEN evidence and rerun affected reviews until verdicts are:

  ```text
  code: READY / APPROVE; findings 0
  content: CONTENT READY; rights PASS; findings 0
  architecture: CLEAR / READY; blockers 0
  ```

- [ ] **Step 7: Bind Stage A verdicts and run full verification**

  Record exact reviewed/evidence heads and remediation history in `docs/reviews/g009-batch8.md`. Add mutations for wrong head/hash/count, weakened verdict/rights, stale PENDING final, fabricated deployment, missing Browser state and fabricated screenshot success.

  Run:

  ```bash
  npm run verify
  git diff --check
  ```

  Expected: all tests pass, validate reports 102 documents/529 sources unless audited actual counts differ, terminology zero issues, deterministic generation, links, reviews, typecheck and production build all pass.

- [ ] **Step 8: Commit the Stage A candidate**

  Commit generated projections/current fixtures first if they form a coherent reviewed candidate, then commit exact review evidence/verdict binding. End with tracked worktree clean and one exact Stage A implementation head referenced by the review.

---

## Task 5: Publish Stage A and capture production evidence

**Files:**
- Create: `docs/reviews/evidence/g009-batch8-stage-a-production-browser.json`
- Modify: `docs/reviews/g009-batch8.md`
- Modify: `tests/g009-batch8-deployment.test.mjs`

**Interfaces:**
- Consumes: Task 4 final Stage A `READY`, exact implementation SHA and clean verified worktree.
- Produces: fast-forward `origin/main`, successful exact-head Pages run/jobs, production HTTP/SVG identity, four-state functional QA and Stage A `SUCCESS / PASS` evidence without changing backlog completion.

- [ ] **Step 1: Perform publication safety preflight**

  Record exact local HEAD, `origin/main`, merge-base, ahead/behind counts and tracked cleanliness. Require remote to be an ancestor and local behind count zero. Abort on divergence or unexpected tracked files; never force-push.

- [ ] **Step 2: Fast-forward push only the reviewed head**

  Run:

  ```bash
  git push origin HEAD:main
  ```

  Record the exact output and re-read `refs/remotes/origin/main`.

- [ ] **Step 3: Observe the exact GitHub Pages run and jobs**

  Identify the push-triggered workflow by exact `headSha`. Require workflow, build job and deploy job all `completed / success`. Do not substitute a later evidence-commit run for the implementation run.

- [ ] **Step 4: Probe production routes and SVG identity**

  Require HTTP 200 with expected content types for `/`, `/styles`, `/styles/sty-07`, `/styles/sty-04`, `/styles/sty-05`, `/styles/sty-06`, `/cases/temporal-saga-durable-execution`, `/references` and the SVG. Record SVG bytes/SHA-256 and require exact match to the reviewed asset.

- [ ] **Step 5: Collect production four-state Browser evidence**

  Repeat the exact Task 4 state/interaction/relation/source/SVG/diagnostic contract against production. Save tracked JSON at `docs/reviews/evidence/g009-batch8-stage-a-production-browser.json`. Direct-open compatibility is permitted only when IAB suppresses `_blank` or cannot physically activate an offscreen exact href; record selected href and that no physical click occurred. It is not a fallback for wrong content or failed navigation.

- [ ] **Step 6: Add mutation-sensitive production evidence and commit**

  Bind exact SHA/run/jobs/routes/SVG/four states/12 interactions/16 relations/20 source checks/STY-08 zero/diagnostics/screenshot status. Add wrong-SHA/run/job, omitted-state, wrong geometry, missing return, altered href/target/rel, truncated log and fabricated visual-PASS mutations.

  Run focused deployment tests, `npm run check:reviews`, `npm run verify` and `git diff --check`; then commit and fast-forward push the evidence-only change. Observe its own Pages run in the ignored task report only, avoiding recursive tracked evidence commits.

---

## Task 6: Close STY-07 in Stage B

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `src/generated/content-ledger.json`
- Modify: `src/generated/project-status.json`
- Modify: `src/generated/public-source-ledger.json`
- Modify: `src/generated/topic-indexes.json`
- Modify: `src/generated/topic-manifest.json`
- Modify: `docs/reviews/g009-batch8.md`
- Modify: `tests/g009-batch8-deployment.test.mjs`
- Modify only current projection fixtures surfaced by verification.

**Interfaces:**
- Consumes: successful exact Stage A production evidence and final Stage A verdicts.
- Produces: STY-07 complete, STY-08 next/unpublished, verified local Stage B closure candidate `60/102/529` unless audited actual counts differ.

- [ ] **Step 1: Write the closure RED and exact immediate-history locks**

  Hash the complete immediately previous STY-06 backlog suffix and complete Batch 7 review. Require one checked STY-07 line with exact Stage A SHA/run/date/live route/SVG evidence; current G009/next STY-08; `60/102/529`; STY-07 `published/complete`; STY-08 `unpublished/pending/nonactionable`; final Stage B review slots; deployment still `PENDING`. Run and observe expected failures on pre-closure truth.

- [ ] **Step 2: Update only the canonical backlog line and current baseline**

  Change only `- [ ] **STY-07` to `- [x] **STY-07` and append exact Stage A closure evidence. Update the current release baseline so G009 remains current and STY-08 is the sole next topic. Preserve all previous historical text and later backlog lines; do not check or link STY-08.

- [ ] **Step 3: Regenerate and synchronize only current truth**

  Run `npm run generate:content`; require STY-07 complete and STY-08 unpublished/pending. Update only live projection/count/next-topic fixtures. Preserve source-ledger identity and all Stage A artifacts byte-for-byte.

- [ ] **Step 4: Perform bounded cleanup review**

  Search touched tests/docs for stale `STY-07 next`, Batch-number labels, duplicated assertions, dead code, masking fallbacks and misleading current-state messages. Correct only exact current literals/messages; preserve predicate strength and historical evidence. Classify Browser direct-open behavior as grounded compatibility only if exact href evidence and mutation tests remain.

- [ ] **Step 5: Run three independent Stage B reviews**

  Review exact closure head for code/spec/security, content/rights and architecture invariants. Require zero findings/blockers and exact verdicts `READY / APPROVE`, `CONTENT READY + RIGHTS PASS`, `CLEAR / READY`. Bind the exact reviewed head and remediation history; keep Stage B deployment `PENDING`.

- [ ] **Step 6: Verify and commit the Stage B candidate**

  Run focused Batch 7/8 history/deployment suites, source governance, `npm run check:content`, `npm run check:reviews`, full `npm run verify` and `git diff --check`. Expected: all pass; completion count is 60; docs/sources match audited actual projection; STY-08 remains zero-actionable. Commit closure and verdict binding without pushing until review is final.

---

## Task 7: Publish Stage B and reconcile the final repository

**Files:**
- Create: `docs/reviews/evidence/g009-batch8-stage-b-production-browser.json`
- Modify: `docs/reviews/g009-batch8.md`
- Modify: `tests/g009-batch8-deployment.test.mjs`

**Interfaces:**
- Consumes: Task 6 exact Stage B `READY` head with tracked worktree clean.
- Produces: final `SUCCESS / PASS`, exact production evidence, `HEAD=origin/main`, STY-08 as the only next unpublished topic.

- [ ] **Step 1: Repeat fast-forward safety preflight and push**

  Require remote ancestor, zero behind, expected ahead count and tracked clean. Push `HEAD:main` without force and record exact deployed head.

- [ ] **Step 2: Observe exact closure Pages run/jobs and HTTP routes**

  Bind the push run by exact Stage B head SHA; require workflow/build/deploy completed/success. Probe the same nine routes and exact SVG identity after deployment.

- [ ] **Step 3: Collect fresh Stage B production Browser evidence**

  Do not reuse Stage A JSON or screenshots. Repeat four states, 12 wrapper interactions, 16 relation/H1/return checks, 20 source resolutions, required extra-route navigation, STY-08 zero, SVG dimensions and complete diagnostics. Save tracked JSON at `docs/reviews/evidence/g009-batch8-stage-b-production-browser.json`; record screenshot outcome honestly.

- [ ] **Step 4: Bind Stage B production evidence with mutations**

  Assert exact closure head/run/jobs/date, route totals, SVG bytes/hash, state geometry, interactions, relations, sources, diagnostics and screenshot status. Add mutations for each evidence class, including reused Stage A head/hash and fabricated visual PASS.

- [ ] **Step 5: Run final verification and publish evidence-only commit**

  Run focused deployment/history suites, `npm run check:reviews`, full `npm run verify` and `git diff --check`. Commit exact evidence, fast-forward push it and observe its Pages run only in the ignored report to avoid recursive evidence commits.

- [ ] **Step 6: Reconcile final repository state**

  Require:

  ```text
  local HEAD == refs/remotes/origin/main
  merge-base(HEAD, origin/main) == HEAD
  ahead/behind == 0/0
  tracked worktree clean
  project status == 60 completed topics / 102 documents / 529 sources
  STY-07 == published/complete
  STY-08 == unpublished/pending/non-actionable and sole next topic
  ```

  If audited document/source counts differ, substitute only the verified actual counts and preserve the exact explanation in Batch 8 review. Stop the visual companion server and any local Docusaurus server. Do not delete user untracked files.

---

## Final Verification Matrix

Before reporting publication complete, independently confirm:

| Area | Required evidence |
| --- | --- |
| Content | Exact metadata, eleven headings, same order case, eight-row comparison, seven-row failure table |
| Semantics | SOA≠ESB/Web Services/shared DB; responsibilities affirmative; no maturity ladder |
| Diagram | Draw.io/SVG effective parity, ports/routes/markers, geometry minima, contrast mutations, fresh raster |
| Sources | Six citations, four remote domains, one primary, exact license roles, original illustration rights |
| Relations | STY-04/05/06 and Temporal reciprocal where required; STY-08 zero actionable |
| Projection | Stage A pending and Stage B complete counts generated, not hand-edited |
| Reviews | Code/content-rights/architecture exact-head verdicts with zero findings/blockers |
| Deployment | Exact implementation and closure Pages runs/jobs, nine HTTP 200 probes, exact SVG hash |
| Browser | Four states, 12 interactions, 16 relations, 20 sources, SVG loaded, complete diagnostics |
| History | Complete immediate STY-06 backlog/review hashes and all earlier evidence unchanged |
| Repository | Full verify and diff-check pass; HEAD=origin/main; tracked clean; STY-08 sole next |
