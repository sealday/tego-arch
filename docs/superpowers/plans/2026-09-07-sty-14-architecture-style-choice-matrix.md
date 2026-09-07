# STY-14 Architecture Style Choice Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-14 架构风格选择矩阵，用同一个订单履约系统在三类压力下分开判断部署边界与交互方式，并完成原创图、来源治理、独立评审和 Stage A/Stage B 线上发布。

**Architecture:** 页面以“部署与数据所有权边界 × 同步与事件驱动交互”双轴为权威模型。正文固定复用同一订单履约能力，分别施加业务增长、局部故障、团队独立交付压力；每次决策都绑定证据、触发器、单次可逆动作、停止条件和责任人。Draw.io/SVG 负责四象限与压力路径，两个表格负责详细决策合同。

**Tech Stack:** Docusaurus 3、MDX、Node.js `node:test`、Draw.io XML、SVG、JSON source ledger、GitHub Pages、Codex in-app Browser。

## Global Constraints

- 固定 `topic_id: STY-14`、`slug: /styles/sty-14`、`content_type: style`、`status: reviewed`、`difficulty: advanced`、`priority: P1`。
- 标题固定为“架构风格选择矩阵：边界、交互与演进触发器”。
- 固定十个 H2：为什么三选一是错误问题；固定订单履约范围与比较规则；第一轴：部署与数据所有权边界；第二轴：同步与事件驱动交互；压力一：业务增长；压力二：局部故障；压力三：团队独立交付；迁移触发器与停止条件；决策矩阵与评审问题；来源。
- 固定能力范围：提交订单、预留库存、登记支付意图、确认履约、发送通知。
- 固定三类压力：业务增长、局部故障、团队独立交付。
- Event-Driven 是可叠加交互机制；禁止把 Modular Monolith、Microservices、Event-Driven 写成互斥三选一、总分排名或成熟度阶梯。
- 每个压力必须给出最小结构、观测证据、升级触发器、可逆动作、停止条件和责任人。
- 图示格式固定为 Draw.io + SVG；列为模块化单体/微服务，行为同步为主/事件驱动叠加；三种压力不得画成单向升级路径。
- 来源只复用已治理的一手机制记录并新增一条原创插图身份；不引入营销比较、虚构指标、生产经验或普遍效果承诺。
- `depends_on` 固定为 `STY-00, STY-04, STY-05, STY-06`；`adjacent_topics` 固定为 `STY-04, STY-05, STY-06`；`related_cases` 与 `related_questions` 均为空数组。
- STY-04、STY-05、STY-06 必须有准确可见的 STY-14 反向入口；STY-15 不创建、不登记、不发布、不可操作。
- 当前权威基线是 `84 completed / 126 documents / 599 sources`；Stage A 预测 `84 / 127 / 600`，Stage B 预测 `85 / 127 / 600`，但生成器真值优先，差异必须解释且只能更新 current/live fixtures。
- 历史 review、Pages、Browser raw、backlog suffix 与 source identities 不得被当前投影更新改写或弱化。
- 截图只有真实、可追溯且视觉可信时才能 `PASS / ACCEPTED`；否则记录 `BLOCKED / NOT_ACCEPTED`，功能证据与视觉证据分开。

---

## File Structure

- `content/styles/sty-14-architecture-choice-matrix.mdx`：唯一读者正文，持有十节论证、同场景合同、双轴解释与来源链接。
- `diagrams/sty-14-architecture-choice-matrix.drawio`：可编辑语义与几何权威图源。
- `static/img/diagrams/sty-14-architecture-choice-matrix.svg`：发布图，必须与 Draw.io 语义、连接器、样式和几何同步。
- `tests/g009-batch15-content.test.mjs`：内容、来源、关系、图示和 current projection 合同。
- `tests/g009-batch15-deployment.test.mjs`：Stage A/B exact-head、历史、Browser、Pages 与生产证据合同。
- `docs/reviews/g009-batch15.md`：独立评审与发布证据。
- `docs/reviews/evidence/g009-batch15-stage-a-browser.json`：Stage A 本地四态功能证据。
- `docs/reviews/evidence/g009-batch15-stage-a-production-browser.json`：Stage A 生产四态功能证据。
- `docs/reviews/evidence/g009-batch15-stage-b-production-browser.json`：Stage B 生产四态功能证据。
- `data/source-ledger.json`、`data/source-link-health.json`、`docs/source-license-inventory.md`：只增加 STY-14 文档引用和原创插图治理；远程来源身份复用现有记录。
- `content/styles/sty-04-modular-monolith.mdx`、`sty-05-microservices.mdx`、`sty-06-event-driven-architecture.mdx`：准确反向入口。
- `src/generated/*.json` 与历史测试中的 current/live fixtures：只能由当前 canonical truth 推进。

---

## Task 1: Define the RED Content and Evidence Contract

**Files:**
- Create: `tests/g009-batch15-content.test.mjs`
- Create: `tests/g009-batch15-deployment.test.mjs`

**Interfaces:**
- Consumes: design constants and the current `84/126/599` projection.
- Produces: mutation-sensitive helpers consumed unchanged by Tasks 2–7.

- [ ] **Step 1: Write the metadata and structure RED**

Define exact constants and deep equality, not loose regex-only checks:

```js
const ARTICLE = 'content/styles/sty-14-architecture-choice-matrix.mdx';
const DRAWIO = 'diagrams/sty-14-architecture-choice-matrix.drawio';
const SVG = 'static/img/diagrams/sty-14-architecture-choice-matrix.svg';
const EXPECTED_H2 = [
  '为什么三选一是错误问题', '固定订单履约范围与比较规则',
  '第一轴：部署与数据所有权边界', '第二轴：同步与事件驱动交互',
  '压力一：业务增长', '压力二：局部故障', '压力三：团队独立交付',
  '迁移触发器与停止条件', '决策矩阵与评审问题', '来源'
];
```

Require exact arrays, one exact six-column table, one exact five-column table, and three wrappers with distinct approved `aria-label`, `role="region"`, `tabIndex={0}`, and the repository ArrowRight handler shape.

- [ ] **Step 2: Write semantic contradiction mutations**

Implement `assertChoiceContract(text)` and prove it rejects replacements for:

```js
const FORBIDDEN = [
  '三种架构按总分选择', '微服务是模块化单体的下一成熟阶段',
  '事件驱动是微服务之后的最终形态', '事件可以保证 exactly-once 业务效果',
  '共享数据库仍允许多个服务同步写入'
];
```

Add non-no-op mutations that remove one capability, swap one pressure, delete one decision-contract cell, make Event-Driven mutually exclusive, remove one owner, and turn a stop condition into unconditional migration.

- [ ] **Step 3: Write diagram and governance RED**

Require four quadrant IDs, three pressure IDs, five capability labels, semantic axes, no maturity arrow, an opaque canvas, accessible title/description, original-illustration identity, and exact reused source IDs:

```js
const REUSED_SOURCES = [
  'src-fowler-monolith-first',
  'src-spring-modulith-fundamentals',
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-fowler-what-do-you-mean-event-driven',
  'src-microsoft-event-driven-architecture-style'
];
```

Use `src-fowler-monolith-first` as the sole `manifest_primary`; tests must state that it supports a bounded starting heuristic, not the complete matrix.

- [ ] **Step 4: Run the focused RED**

Run:

```bash
node --check tests/g009-batch15-content.test.mjs
node --check tests/g009-batch15-deployment.test.mjs
node --test tests/g009-batch15-content.test.mjs tests/g009-batch15-deployment.test.mjs
```

Expected: helper fixtures pass; production contracts fail only because the STY-14 article, diagram, source document record, review and projection are absent.

- [ ] **Step 5: Commit**

```bash
git add tests/g009-batch15-content.test.mjs tests/g009-batch15-deployment.test.mjs
git commit -m "test: define STY-14 choice contract"
```

---

## Task 2: Create the Four-Quadrant Draw.io and SVG

**Files:**
- Modify: `tests/g009-batch15-content.test.mjs`
- Create: `diagrams/sty-14-architecture-choice-matrix.drawio`
- Create: `static/img/diagrams/sty-14-architecture-choice-matrix.svg`

**Interfaces:**
- Consumes: Task 1 exact IDs, labels, typography and geometry helpers.
- Produces: synchronized original asset pair embedded by Task 3.

- [ ] **Step 1: Read the diagram skills and write geometry RED**

Read completely:

```text
.codex/skills/illustrating-architecture-articles/SKILL.md
.codex/skills/creating-drawio-architecture-diagrams/SKILL.md
```

Extend the test to measure effective SVG cascade, paint order, transformed text boxes, actual markers, node envelopes, axis/boundary strokes, legend entries and later occluders at 800px article width. Require at least 15 CSS px text, 8px label-to-own-stroke, 16px label-to-own-marker, 12px label-to-node/boundary/foreign-marker, and no shared collinear business-route segment.

- [ ] **Step 2: Implement exact diagram semantics**

Create an opaque-canvas diagram with these primary regions:

```text
axis-deployment, axis-interaction
quadrant-monolith-sync, quadrant-monolith-event
quadrant-microservices-sync, quadrant-microservices-event
pressure-growth, pressure-failure, pressure-teams
capability-submit-order, capability-reserve-inventory,
capability-record-payment-intent, capability-confirm-fulfillment,
capability-send-notification
```

Connect each pressure to multiple evaluation regions without a single forward-only path. Use labeled line styles and marker shapes so meaning is color-independent.

- [ ] **Step 3: Enforce actual Draw.io/SVG parity**

Tests must calculate Draw.io endpoints from terminal bounds plus `exitX/exitY/entryX/entryY`, compare real waypoint lists with SVG paths, resolve effective marker/dash/stroke/font/fill, and deep-compare node label/role/bounds/shape. Reject `dataRoute` or dangling-point self-reporting.

- [ ] **Step 4: Render and inspect**

Run the repository Draw.io/SVG validator and render the SVG at 800px width. Inspect at original raster size for text overflow, route-label collisions, axis/header clearance, legend separation, opaque masks, crop, watermark, signature, logo, and readable light/dark presentation.

- [ ] **Step 5: Verify and commit**

```bash
node --test --test-name-pattern='STY-14.*diagram|diagram.*STY-14' tests/g009-batch15-content.test.mjs
npm run check:terminology
git diff --check
git add tests/g009-batch15-content.test.mjs diagrams/sty-14-architecture-choice-matrix.drawio static/img/diagrams/sty-14-architecture-choice-matrix.svg
git commit -m "docs: add STY-14 choice matrix diagram"
```

Expected: every diagram test and mutation passes; non-diagram production tests remain RED.

---

## Task 3: Publish the Article, Sources and Reciprocal Relations

**Files:**
- Create: `content/styles/sty-14-architecture-choice-matrix.mdx`
- Modify: `content/styles/index.mdx`
- Modify: `content/styles/sty-04-modular-monolith.mdx`
- Modify: `content/styles/sty-05-microservices.mdx`
- Modify: `content/styles/sty-06-event-driven-architecture.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json` only if canonical health refresh changes observations
- Modify: `docs/source-license-inventory.md`
- Modify: `tests/g009-batch15-content.test.mjs`
- Modify current source-count fixtures only if the original illustration advances the count

**Interfaces:**
- Consumes: Task 2 asset paths and Task 1 content contract.
- Produces: independently readable article and governed citation graph for Task 4 generation.

- [ ] **Step 1: Write source/document RED**

Require one STY-14 document record with `reviewed_at: 2026-09-07`, copyright checks `original-structure`, `quotation-boundary`, `attribution-complete`, `illustration-rights`, six exact reused remote citations, and a new `src-atlas-sty14-architecture-choice-matrix` citation using `original-illustration`. Reject any new remote identity or changed existing source record.

- [ ] **Step 2: Draft the exact article**

Use the ten H2s verbatim. Place the diagram after the paragraph that tells the reader to inspect the independent axes. Build two exact tables:

```text
三压力 × 四结构：压力｜最小结构｜观测证据｜触发器｜停止条件｜责任人
演进动作：现状｜单次动作｜观察窗口｜回滚路径｜禁止越界
```

Wrap diagram and both tables in three named semantic regions. Keep the five capabilities and every consequential payment, consistency, retry, poison-message, recovery and stop boundary visible outside evidence cards.

- [ ] **Step 3: Register sources and original rights**

Reuse the six exact source records without editing their identities. Add the local illustration record with canonical locator `/img/diagrams/sty-14-architecture-choice-matrix.svg`, source kind `original-illustration`, license `LicenseRef-Atlas-Original`, evidence role `illustration`, and a no-copy provenance note. Add the exact license-inventory row.

- [ ] **Step 4: Add reciprocal links**

Add visible STY-14 links to STY-04, STY-05 and STY-06 at their exact comparison boundary. Add the parent `/styles` link to STY-14. Ensure no STY-15 href exists.

- [ ] **Step 5: Run editorial and repository gates**

```bash
node --test tests/g009-batch15-content.test.mjs
npm run validate:content
npm run check:terminology
npm run check:links
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/styles
npm run typecheck
npm run build
git diff --check
```

Expected: all article/source/relation/diagram tests pass; only Stage A generated/review assertions remain RED. `visual-balance` must be greater than 90.

- [ ] **Step 6: Commit**

```bash
git add content/styles/sty-14-architecture-choice-matrix.mdx content/styles/index.mdx content/styles/sty-04-modular-monolith.mdx content/styles/sty-05-microservices.mdx content/styles/sty-06-event-driven-architecture.mdx data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md tests/g009-batch15-content.test.mjs
git commit -m "docs: add STY-14 architecture choice matrix"
```

Do not stage `data/source-link-health.json` when a canonical refresh produces no diff.

---

## Task 4: Generate and Bind the Stage A Candidate

**Files:**
- Regenerate: `src/generated/*.json`
- Create: `docs/reviews/g009-batch15.md`
- Create: `docs/reviews/evidence/g009-batch15-stage-a-browser.json`
- Modify: `tests/g009-batch15-content.test.mjs`
- Modify: `tests/g009-batch15-deployment.test.mjs`
- Modify current/live projection fixtures only

**Interfaces:**
- Consumes: complete Task 3 article/source/relation graph.
- Produces: reproducible Stage A candidate with independent review slots still PENDING.

- [ ] **Step 1: Capture Stage A projection RED**

Require STY-14 `published/pending`, exact current generator totals, STY-15 absent/unpublished/pending/non-actionable according to canonical schema, and a review record with code/content-rights/architecture `PENDING`, final `PENDING`, deployment `NOT_RUN`, scope `STAGE_A_ONLY`.

- [ ] **Step 2: Generate canonical content**

```bash
npm run generate:content
npm run check:content
```

Expected assertion to verify, not force: `84/127/600`. Explain any difference using exact document/source inputs, then update only current/live projection fixtures.

- [ ] **Step 3: Run local four-state Browser QA**

Build and serve the exact candidate. Using only Codex in-app Browser, capture desktop light/dark `1440×1000` and mobile light/dark `390×844`: page width, three wrapper widths, focus, `:focus-visible`, 3px outline, ArrowRight deltas, SVG loaded/intrinsic/rendered dimensions, three reciprocal relation href/H1/return checks, six governed remote anchors and destinations, STY-15 actionable count `0`, warnings/errors, `Runtime.exceptionThrown`, `Log.entryAdded`, `hasMore=false`, `truncated=false`.

- [ ] **Step 4: Track and bind raw evidence**

Write `docs/reviews/evidence/g009-batch15-stage-a-browser.json`, bind exact bytes and SHA-256, and add mutations for duplicate/swapped wrappers, wrong viewport/theme, fabricated relation/H1, missing return, changed source href/rel/target, unloaded SVG, truncated diagnostics, fabricated STY-15, and screenshot PASS inconsistent with actual artifacts.

- [ ] **Step 5: Verify and commit**

```bash
npm run verify
git diff --check
git add src/generated docs/reviews/g009-batch15.md docs/reviews/evidence/g009-batch15-stage-a-browser.json tests/g009-batch15-content.test.mjs tests/g009-batch15-deployment.test.mjs tests
git commit -m "test: bind STY-14 Stage A projection"
```

Stage A review slots and deployment must still be PENDING/NOT_RUN.

---

## Task 5: Obtain and Bind Independent Stage A Verdicts

**Files:**
- Modify: `docs/reviews/g009-batch15.md`
- Modify: `tests/g009-batch15-deployment.test.mjs`

**Interfaces:**
- Consumes: exact Task 4 candidate head and tracked Browser evidence.
- Produces: Stage A READY record; no deployment claim.

- [ ] **Step 1: Dispatch three read-only reviews**

Obtain exact-head reviews for code/spec/security, content/evidence/rights, and architecture/invariants. Each must inspect the article, tables, source roles, diagram semantics/geometry, generated projection, Browser artifact, historical locks and forbidden claims.

- [ ] **Step 2: Remediate all Critical/Important findings**

Use TDD for every fix, rerun covering tests, and request exact-head re-review. Record Minor findings and either close them or carry them explicitly into the final branch review.

- [ ] **Step 3: Bind verdict RED then GREEN**

Require exact reviewed head and exact verdicts:

```text
code: READY / APPROVE / findings 0
content: CONTENT READY / rights PASS / findings 0
architecture: CLEAR / READY / blockers 0
final Stage A: READY
deployment: NOT_RUN
```

Mutations must reject wrong head, weakened verdict, rights failure, stale PENDING, fabricated deployment success and displaced/additive review claims.

- [ ] **Step 4: Verify and commit**

```bash
npm run verify
git diff --check
git add docs/reviews/g009-batch15.md tests/g009-batch15-deployment.test.mjs
git commit -m "docs: record STY-14 Stage A verdicts"
```

---

## Task 6: Publish and Verify Stage A

**Files:**
- Create: `docs/reviews/evidence/g009-batch15-stage-a-production-browser.json`
- Modify: `docs/reviews/g009-batch15.md`
- Modify: `tests/g009-batch15-deployment.test.mjs`

**Interfaces:**
- Consumes: exact Stage A READY head from Task 5.
- Produces: production-verified Stage A while STY-14 remains pending.

- [ ] **Step 1: Run publication safety preflight**

Require tracked-clean state, fresh fetch/`ls-remote`, exact merge-base, zero behind, remote unchanged after review, no merge commit and no unrelated file package. Stop on remote advance or semantic conflict.

- [ ] **Step 2: Fast-forward push only**

```bash
git push origin HEAD:main
```

No force push. Bind the exact implementation SHA, workflow name, push event, `headSha`, run ID, build job ID, deploy job ID, `completed/success` statuses and timestamps.

- [ ] **Step 3: Probe production**

Require HTTP 200 and correct content types for `/`, `/styles`, `/styles/sty-14`, `/styles/sty-04`, `/styles/sty-05`, `/styles/sty-06`, `/references`, and the STY-14 SVG. Bind SVG bytes/SHA to the reviewed asset.

- [ ] **Step 4: Capture fresh production IAB evidence**

Repeat the exact four states and functional schema from Task 4 against production. Relation checks must bind exact href→H1→return results; direct navigation fallbacks must name the compatibility limitation and never claim a physical click. Track raw evidence and bind exact bytes/SHA.

- [ ] **Step 5: Bind Stage A production PASS**

Write a production section that separates functional `SUCCESS/PASS` from screenshot status. Add mutation rejection for every run/job/route/SVG/state/wrapper/relation/source/diagnostic/screenshot field.

- [ ] **Step 6: Verify, commit, push and observe evidence run**

```bash
npm run verify
git diff --check
git add docs/reviews/g009-batch15.md docs/reviews/evidence/g009-batch15-stage-a-production-browser.json tests/g009-batch15-deployment.test.mjs
git commit -m "docs: record STY-14 Stage A production evidence"
git push origin HEAD:main
```

Observe the evidence commit's own exact-head Pages run to `completed/success`; record it only in the ignored task report to avoid recursive evidence commits. Leave STY-14 pending.

---

## Task 7: Close Stage B and Finalize G009

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch15.md`
- Modify: `tests/g009-batch15-deployment.test.mjs`
- Create: `docs/reviews/evidence/g009-batch15-stage-b-production-browser.json`
- Regenerate: `src/generated/*.json`
- Modify current/live projection fixtures only

**Interfaces:**
- Consumes: exact successful Stage A implementation/evidence runs and verdicts.
- Produces: STY-14 complete, G009 architecture-style batch closed, production-verified `main`.

- [ ] **Step 1: Lock immediate history**

Hash the complete immediately previous backlog suffix, G009 Batch 14 review, G010 MTH-07 review, and all Stage A STY-14 review/evidence bytes. Add add/edit/delete mutation rejection before changing lifecycle state.

- [ ] **Step 2: Write Stage B RED**

Require exactly one new checked STY-14 backlog row with exact Stage A SHA/run/date/HTTP/functional/screenshot evidence, STY-14 complete, actual generator totals, independent Stage B review slots PENDING and deployment PENDING.

- [ ] **Step 3: Close and regenerate**

Check only STY-14, preserve prior bytes, run `npm run generate:content`, and synchronize only current/live projection fixtures. Expected assertion to verify, not force: `85/127/600`.

- [ ] **Step 4: Run AI-slop cleanup**

Remove stale current-topic names/messages and duplicate/dead code. Retain only exact-href, mutation-tested Browser compatibility fallbacks. Do not weaken validators, source governance or historical hash locks.

- [ ] **Step 5: Obtain three independent Stage B reviews**

Bind exact candidate head and zero-blocker code/content-rights/architecture verdicts. Keep deployment PENDING until production succeeds.

- [ ] **Step 6: Publish and verify Stage B**

Run full verification and publication preflight, fast-forward push, bind exact Pages run/build/deploy jobs, probe the same HTTP/SVG set, and capture fresh four-state production IAB evidence in `g009-batch15-stage-b-production-browser.json`.

- [ ] **Step 7: Bind final SUCCESS/PASS**

Add mutation-sensitive Stage B evidence assertions, run `npm run verify && git diff --check`, commit/push only the review/raw/test evidence, observe its own Pages run, and leave tracked worktree clean with `HEAD=origin/main`. Final review must state STY-14 complete and G009 closed without fabricating STY-15.

---

## Plan Self-Review

- Spec coverage: all thirteen design sections map to Tasks 1–7; double-axis semantics, same-scenario fairness, pressures, triggers, stop conditions, diagram, sources, relations, Stage A/B and production QA each have an owner task.
- Placeholder scan: every task names exact files, commands, assertions and expected boundaries; no implementation placeholder remains.
- Interface consistency: Task 1 constants feed Tasks 2–4; Task 2 asset paths feed Task 3; Task 4 creates the evidence schema consumed by Tasks 5–7; Stage A and Stage B exact heads are always literal evidence, never inferred from mutable `HEAD` prose.
