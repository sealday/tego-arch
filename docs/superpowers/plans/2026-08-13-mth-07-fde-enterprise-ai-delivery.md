# MTH-07 Enterprise AI Delivery Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 MTH-07 企业 AI 前线部署方法页，把微信文章的四阶段十二能力框架重构为可验收、可运行、可停止、可复制的交付门禁闭环，并完成原创图、来源治理、独立审查和 Stage A/Stage B 线上发布。

**Architecture:** 页面使用仅绑定 `MTH-07 + method` 的十节信息架构，正文以十二个统一五段门禁合同为权威说明，Draw.io/SVG 负责四阶段、三条反馈线和责任带的视觉解释。发布页来源层只使用 NIST、Google、Microsoft Learn 一手机制资料并显式区分 Tego Arch 推断；微信文章仅留在内部构思记录，且与 STY-07 工作树完全隔离。

**Tech Stack:** Docusaurus 3.10、MDX、React 19、Node 24 test runner、TypeScript、Draw.io XML/SVG、JSON source governance、GitHub Actions、GitHub Pages。

## Global Constraints

- 只修改独立工作树 `/Users/seal/projects/tego-arch/.worktrees/mth-07-fde-delivery`；不得读取、暂存或提交 STY-07 工作树的未提交资产。
- 固定 `topic_id: MTH-07`、`slug: /methods/mth-07`、`content_type: method`、`priority: P1`、标题“企业 AI 前线部署：从 POC 到可复制系统的交付门禁”。
- 微信文章只作为内部 brainstorming 启发；不得进入来源台账、正文链接、引用或证据角色，也不得复制其图片、表格、长段文字或版式。
- 每个门禁必须含风险、机制、证据、通过条件和单一责任人；POC、生产、验收、放量、复制不得互相等同。
- 图示固定为 Draw.io + SVG，一张主图、最多三张高密度表；visual-balance 必须严格大于 90。
- 不新增 npm 依赖，不改变全站视觉 token、现有 URL、构建流程或历史发布证据。
- `src/generated/` 只能由 `npm run generate:content` 更新。
- Stage A 保持 MTH-07 `published / content-lifecycle reviewed` 且不进入 backlog，完成数保持 59；独立代码、内容/版权、架构评审均通过后才可 Stage B 写入完成记录并标记 complete。
- 浏览器必须使用 in-app Browser；截图不可用时如实记录，不以旧图或功能检查冒充视觉通过。

---

## File Responsibility Map

- Create: `tests/g010-mth07-content.test.mjs` — 元数据、十节例外、十二门禁、来源、关系、图示、密度与 Stage A 投影契约。
- Create: `tests/g010-mth07-deployment.test.mjs` — exact-head 评审、Pages、HTTP、Browser 与 Stage B 完成契约。
- Create: `content/methods/mth-07-fde-enterprise-ai-delivery.mdx` — 方法页正文与三个受控横向滚动容器。
- Create: `diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio` — 可编辑原创门禁图源。
- Create: `static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg` — 同步发布图。
- Create: `docs/reviews/g010-mth07.md` — Stage A/Stage B 三类独立评审、Browser 与部署证据。
- Create after Browser QA: `docs/reviews/evidence/g010-mth07-stage-a-browser.json`, `docs/reviews/evidence/g010-mth07-stage-a-production-browser.json`, `docs/reviews/evidence/g010-mth07-stage-b-production-browser.json`.
- Modify: `content/methods/index.mdx` — 增加 MTH-07 正式入口。
- Modify: `content/methods/mth-01-quality-attribute-workshop.mdx`, `content/methods/mth-04-architecture-fitness-functions.mdx`, `content/methods/mth-06-requirements-to-evolution-loop.mdx` — 必要反向元数据和可见边界链接。
- Modify: `content/cases/temporal-saga-durable-execution.mdx` — 只增加方法参照回链，不改变 Temporal 事实结论。
- Modify: `data/source-ledger.json`, `data/source-link-health.json` — 三个远程来源、一个原创插图、文档引用及 checker 生成的健康结果；`docs/source-license-inventory.md` 是冻结迁移快照，本任务不回填。
- Modify if exact terminology gate requires it: `data/terminology.json`, `tests/terminology-registry.test.mjs`, `tests/terminology-policy.test.mjs` — 只加精确 FDE 术语，不加通配或路径豁免。
- Modify at Stage B only: `docs/content-backlog.md` — 增加并最终勾选 MTH-07，记录 exact evidence。
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json`.

## Fixed Metadata, Relations, Sources, and Accessibility Labels

Use this exact front matter unless a canonical schema validation proves a field illegal; do not silently substitute values:

```yaml
title: 企业 AI 前线部署：从 POC 到可复制系统的交付门禁
slug: /methods/mth-07
content_type: method
status: reviewed
difficulty: advanced
analyzed_at: 2026-08-13
source_cutoff: 2026-08-13
review_policy: quarterly-version-sensitive
confidence: high
domains:
  - software-architecture
  - ai-systems
agent_patterns:
  - human-in-the-loop
protocols: []
quality_attributes:
  - reliability
  - security
  - maintainability
tags:
  - 企业 AI
  - FDE
  - 交付门禁
  - POC
summary: 用四阶段十二门禁把企业 AI 的现场问题、验收证据、生产责任、渐进放量与复制边界连接成可停止的交付闭环。
topic_id: MTH-07
priority: P1
depends_on:
  - MTH-01
  - MTH-04
  - MTH-06
adjacent_topics:
  - MTH-01
  - MTH-04
  - MTH-06
related_cases:
  - /cases/temporal-saga-durable-execution
related_questions: []
```

Use exactly these governed identities:

- `src-nist-ai-rmf-1-0` — canonical `https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10`; report `NIST AI 100-1`, 2023-01-26; sole `manifest_primary`; support roles, TEVV, production monitoring, appeal/override, recovery and decommissioning; do not claim it defines FDE or the twelve gates.
- `src-google-sre-canarying-releases` — canonical `https://sre.google/workbook/canarying-releases/`; support partial time-bounded rollout, control comparison and proceed/stop decisions; do not claim Google’s exact organization is required.
- `src-microsoft-foundry-run-evaluations` — canonical `https://learn.microsoft.com/en-us/azure/ai-studio/how-to/evaluate-generative-ai-app`; support test-data evaluation before deployment and production-quality monitoring; do not generalize Azure product steps into a universal process.
- `src-atlas-mth07-fde-delivery-gates` — local `/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg`; `LicenseRef-Atlas-Original`, `original-atlas`, `illustration-rights`.

Do not add the China generative-AI regulation source unless the final prose includes the exact “向境内公众提供生成式人工智能服务” applicability boundary. If it is needed, add CAC’s official `https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm` as a fifth governed source and update generated counts from actual output.

Use these wrapper labels exactly:

```js
const WRAPPERS = [
  '企业 AI 四阶段十二门禁图，可横向滚动',
  '企业 AI 十二门禁执行表，可横向滚动',
  '人、AI 与程序职责及停止条件表，可横向滚动',
];
```

Baseline is `59 completed / 101 documents / 525 sources`. With one document and four sources, expected Stage A is `59 / 102 / 529`; Stage B is `60 / 102 / 529`. Treat these as assertions to confirm, not numbers to force: if canonical generation differs, explain the exact input difference and update only current projection expectations.

## Task 1: Create the RED Contract

**Files:**
- Create: `tests/g010-mth07-content.test.mjs`
- Read: `tests/g009-batch7-content.test.mjs`, `tests/g005-batch3-content.test.mjs`, `scripts/content-density.mjs`

**Interfaces:**
- Consumes: existing MDX/front-matter, relation, source-governance, XML/SVG and density helpers.
- Produces: exact contracts for Tasks 2–4.

- [ ] **Step 1: Define exact metadata and heading constants.**

  ```js
  const ARTICLE = 'content/methods/mth-07-fde-enterprise-ai-delivery.mdx';
  const DRAWIO = 'diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio';
  const SVG = 'static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg';
  const H2 = ['学习问题','一页摘要','事实边界','交付门禁图','四阶段控制流','证据、产物与责任','架构决策与权衡','生产化分析','可迁移经验','来源'];
  const TRANSFER_H3 = ['可直接复用的机制','只能有限类比的部分','不应照搬的部分'];
  const STAGES = ['进场期','立项期','交付期','放大期'];
  const GATES = ['需求考古','流程测绘','切口选择','验收标准工程','POC 纪律','职责契约','知识结构化','人机分工设计','合规与风险兜底','渐进放量','信任运营','资产化复制'];
  ```

- [ ] **Step 2: Lock the narrow method exception.**

  Deep-equal the full front matter and H2/H3 order. Iterate every other `content/methods/*.mdx` file and assert its existing nine-heading contract is unchanged. Add non-no-op mutations for wrong topic ID/type, fallback to normal headings, missing transfer H3, and injected `关键源码导读`.

- [ ] **Step 3: Lock the twelve five-part gate contracts.**

  Parse the execution table as exact ordered rows. Every row must contain stage, gate, risk, mechanism, evidence, pass condition, owner, failure/return target. Mutate each field in representative rows, delete each of the twelve rows, duplicate one ownerless row, and assert rejection.

- [ ] **Step 4: Lock evidence boundaries and responsibility semantics.**

  Require visible labels `来源事实`, `独立证据`, `Tego Arch 推断`; reject text that treats salary/market/policy numbers as fact without an independently cited identity. Require exact POC/production/acceptance/rollout/replication inequalities, deterministic program duties, AI candidate duties, human irreversible authorization, bounded manual queue, and explicit stop authority. Add semantic mutations for each conflation.

- [ ] **Step 5: Lock sources, relations, wrappers, density, and projection.**

  Require the four source IDs, three remote domains, sole NIST primary, no WeChat source/citation/link, original illustration rights, exact parent/relations, Temporal boundary text, no QA-09 relation, exact three wrappers and ArrowRight handler. Require visual-balance >90. Require Stage A `59/102/529`, MTH-07 `published / content-lifecycle reviewed`, absent from backlog.

- [ ] **Step 6: Define diagram contracts and mutations.**

  ```js
  const STAGE_IDS = ['stage-entry','stage-initiation','stage-delivery','stage-scale'];
  const GATE_IDS = GATES.map((_, index) => `gate-${String(index + 1).padStart(2, '0')}`);
  const FEEDBACK_IDS = ['feedback-rollout-to-acceptance','feedback-compliance-to-scope','feedback-reuse-to-contract'];
  const RESPONSIBILITY_IDS = ['owner-customer','owner-delivery','owner-product','owner-platform','owner-security-data'];
  ```

  Require actual Draw.io terminal ports/waypoints and SVG path parity, twelve contained gates, three distinct feedback routes, stop node, responsibility band, marker/style parity, 800px CSS text ≥15px, label→stroke ≥8px, marker ≥16px, node/boundary ≥12px, selector-bound contrast ≥4.5:1, no partial shared segment, no later occluding rect, and mutation rejection for every class.

- [ ] **Step 7: Run and commit RED.**

  Run: `node --test tests/g010-mth07-content.test.mjs`

  Expected: helper fixtures pass; implementation tests fail only because MTH-07 article, sources, relations and diagram are absent.

  ```bash
  git add tests/g010-mth07-content.test.mjs
  git commit -m "test: define MTH-07 delivery-gate contract"
  ```

## Task 2: Research and Lock the Evidence Contract

**Files:**
- Modify: `tests/g010-mth07-content.test.mjs`
- Create: `.superpowers/sdd/mth07-source-research.md` (ignored implementation evidence; do not commit)

**Interfaces:**
- Consumes: fixed identities in this plan and existing source schema.
- Produces: exact mutation-sensitive source contract and verified research handoff for Task 4; it deliberately does not register uncited sources because source governance rejects non-discovery identities without a live document citation.

- [ ] **Step 1: Write source-governance mutations.** Require exact canonical locator, author/org, date/version, source kind, evidence role, license family, copyright policy, citation scope, non-copy boundary, unique primary and original illustration record.
- [ ] **Step 2: Run source contract RED.** Run `node --test tests/g010-mth07-content.test.mjs`; expect missing source identities/citations alongside the still-missing article and diagram.
- [ ] **Step 3: Research all four identities without mutating governance data.** Inspect existing ledger families for exact NIST/Google/Microsoft Learn reuse, verify current official pages and license evidence, and record the complete proposed ledger/citation/health fields in `.superpowers/sdd/mth07-source-research.md`. Record explicitly that WeChat is excluded from governed sources and do not probe unrelated cache entries.
- [ ] **Step 4: Prove the governance ordering constraint.** In the report, cite the existing validator behavior that rejects an uncited non-discovery source and a ledger document key whose MDX does not exist. Do not commit knowingly invalid provisional source records.
- [ ] **Step 5: Verify and commit only the strengthened contract.** Run `node --test tests/g010-mth07-content.test.mjs`; expected helper/source-contract tests pass and implementation tests remain RED only for absent article/source records/diagram/projection.

  ```bash
  git add tests/g010-mth07-content.test.mjs
  git commit -m "test: bind MTH-07 evidence identities"
  ```

## Task 3: Build the Original Draw.io/SVG Gate Diagram

**Files:**
- Create: `diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio`
- Create: `static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg`
- Modify: `tests/g010-mth07-content.test.mjs`

**Interfaces:**
- Consumes: stage/gate/feedback/owner IDs and thresholds from Task 1.
- Produces: synchronized accessible diagram pair for Task 4.

- [ ] **Step 1: Read required visual skills.** Read `creating-drawio-architecture-diagrams/SKILL.md`, `illustrating-architecture-articles/SKILL.md`, and every routed reference in full; record Draw.io + SVG decision in the report.
- [ ] **Step 2: Create RED mutation fixtures first.** Cover missing/changed terminal port, feedback route crossing, gate outside stage, caption/stroke collision, marker collision, foreign node/boundary collision, responsibility loss, translucent background, white essential paint, later opaque mask, partial shared segment and Draw.io/SVG drift.
- [ ] **Step 3: Draw the synchronized pair.** Use four stage bands, twelve gate nodes, five owner lanes, one explicit stop node, three feedback routes and a separate legend band. Give every connector real `source`/`target`, `exitX/Y`, `entryX/Y`, perimeter flags and waypoint array; SVG paths must derive the same endpoints.
- [ ] **Step 4: Run focused geometry until GREEN.** Run `node --test --test-name-pattern='MTH-07.*diagram|diagram.*MTH-07' tests/g010-mth07-content.test.mjs`; expected all diagram tests pass and all mutations are non-no-op/rejected.
- [ ] **Step 5: Validate and raster inspect.** Run the repository Draw.io/SVG validator, `npm run check:terminology`, render SVG at 800px width, inspect original pixels for text overflow, crop, route ambiguity, label collision, legend collision and white/dark readability.
- [ ] **Step 6: Commit.**

  ```bash
  git add diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg tests/g010-mth07-content.test.mjs
  git commit -m "docs: add MTH-07 delivery-gate diagram"
  ```

## Task 4: Write the Method Page and Reciprocal Relations

**Files:**
- Create: `content/methods/mth-07-fde-enterprise-ai-delivery.mdx`
- Modify: `content/methods/index.mdx`
- Modify: `content/methods/mth-01-quality-attribute-workshop.mdx`
- Modify: `content/methods/mth-04-architecture-fitness-functions.mdx`
- Modify: `content/methods/mth-06-requirements-to-evolution-loop.mdx`
- Modify: `content/cases/temporal-saga-durable-execution.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `tests/g010-mth07-content.test.mjs`

**Interfaces:**
- Consumes: verified source research/contract from Task 2 and SVG from Task 3.
- Produces: independently readable publishable method page, four cited governed source records, and valid relationship graph.

- [ ] **Step 1: Run article contract RED.** Run focused content test; expect metadata/headings/gates/wrappers/relations failures.
- [ ] **Step 2: Write the exact front matter and ten sections.** Use the fixed metadata and heading order; create three wrappers with exact labels, `role="region"`, `tabIndex={0}` and the existing ArrowRight scroll handler.
- [ ] **Step 3: Write the twelve-row gate table.** Each row carries risk/mechanism/evidence/pass/owner/failure return. Keep prose authoritative and diagram labels concise.
- [ ] **Step 4: Write responsibility and stop-condition tables.** Bind program/AI/human duties; distinguish POC→production, production→rollout, customer→reuse; state measurable stop/re-entry conditions.
- [ ] **Step 5: Add citations and governed source records atomically.** Cite NIST for risk/evaluation/monitoring/oversight, Google SRE for canary decisions, Microsoft Learn for pre-deployment and production evaluation mechanics, and label Tego Arch synthesis explicitly. Do not cite or link WeChat. In the same change, add the four complete ledger identities and exact document citations. Reuse an exact existing family rather than duplicate it. Then run the normal link-health checker and commit only its generated cache/provenance result; do not hand-copy candidate observations. Do not modify the frozen `docs/source-license-inventory.md`. Do not introduce unverified market/salary/policy figures.
- [ ] **Step 6: Add reciprocal links.** Add exact metadata and visible links in MTH-01/04/06 and Temporal only where generator requires them; preserve each existing conclusion and avoid QA-09.
- [ ] **Step 7: Verify density, source governance, content, terminology, links, typecheck and build.** Run:

  ```bash
  node --test tests/g010-mth07-content.test.mjs
  node --test tests/source-governance-data.test.mjs tests/source-link-health.test.mjs
  node scripts/content-density.mjs content/methods/mth-07-fde-enterprise-ai-delivery.mdx
  npm run validate:content
  npm run check:terminology
  npm run check:links
  npm run typecheck
  npm run build
  git diff --check
  ```

  Expected: all content/source/diagram tests pass except Stage A projection; density >90 and no visual-balance warning.

- [ ] **Step 8: Commit.**

  ```bash
  git add content/methods/mth-07-fde-enterprise-ai-delivery.mdx content/methods/index.mdx content/methods/mth-01-quality-attribute-workshop.mdx content/methods/mth-04-architecture-fitness-functions.mdx content/methods/mth-06-requirements-to-evolution-loop.mdx content/cases/temporal-saga-durable-execution.mdx data/source-ledger.json data/source-link-health.json tests/g010-mth07-content.test.mjs
  git commit -m "docs: add MTH-07 enterprise AI delivery method"
  ```

## Task 5: Generate Stage A Projection and Bind Local Browser Evidence

**Files:**
- Create: `docs/reviews/g010-mth07.md`
- Create: `docs/reviews/evidence/g010-mth07-stage-a-browser.json`
- Create: `tests/g010-mth07-deployment.test.mjs`
- Regenerate: `src/generated/*.json`
- Modify current-projection fixtures only where generator truth requires it.

**Interfaces:**
- Consumes: completed page/source/diagram/relations.
- Produces: reviewed Stage A candidate with MTH-07 `published / content-lifecycle reviewed`, absent from backlog, and reproducible local Browser evidence.

- [ ] **Step 1: Write deployment RED.** Require exact generated totals, complete MTH-07 status object `{scope: content-lifecycle, value: reviewed, source: content/methods/mth-07-fde-enterprise-ai-delivery.mdx}`, MTH-07 absent from backlog, 59 completed topics, review slots PENDING, tracked raw Browser artifact, exact wrapper/relation/source/diagnostic schema and no fabricated deployment success.
- [ ] **Step 2: Generate canonical projection.** Run `npm run generate:content`; inspect actual totals and update only current projection assertions if they differ from `59/102/529` for an explained reason.
- [ ] **Step 3: Run local production build and in-app Browser four-state QA.** At `1440x1000` light/dark and `390x844` light/dark record exact document width, three wrapper widths/focus/ArrowRight, SVG intrinsic/rendered size, sources, reciprocal relations with H1+return, zero broken next-topic link, logs, runtime exceptions and pagination completeness. Capture and hash screenshots only if IAB returns real bytes.
- [ ] **Step 4: Track immutable raw evidence and review candidate.** Store the JSON under `docs/reviews/evidence/`, include exact candidate head/hash, keep code/content/architecture slots PENDING and deployment NOT_RUN.
- [ ] **Step 5: Run full verification and commit.** Run `npm run verify && git diff --check`; expected all tests pass.

  ```bash
  git add src/generated tests/g010-mth07-deployment.test.mjs docs/reviews/g010-mth07.md docs/reviews/evidence/g010-mth07-stage-a-browser.json
  git commit -m "test: bind MTH-07 Stage A projection"
  ```

## Task 6: Independent Stage A Reviews and Production Publication

**Files:**
- Modify: `docs/reviews/g010-mth07.md`
- Modify: `tests/g010-mth07-deployment.test.mjs`
- Create: `docs/reviews/evidence/g010-mth07-stage-a-production-browser.json`

**Interfaces:**
- Consumes: exact Task 5 candidate and tracked evidence.
- Produces: three zero-blocker verdicts, Stage A READY, exact-head Pages and production QA.

- [ ] **Step 1: Obtain three independent reviews.** Code/spec/security must inspect mutation resistance and historical locks; content/rights must inspect claim/evidence/copyright boundaries; architecture must prove gate/owner/stop/feedback invariants. Record exact reviewed head and every finding.
- [ ] **Step 2: Remediate findings TDD-first.** For every accepted finding add a failing mutation/contract, implement the narrow fix, rerun focused and full gates, and obtain exact-head re-review. Do not mark review slots ready from implementer self-report.
- [ ] **Step 3: Bind final Stage A verdicts.** Mutations must reject wrong head, weakened verdict, stale PENDING slot, rights failure and fabricated deployment.
- [ ] **Step 4: Fast-forward push exact Stage A head.** Preflight clean tree, merge-base, ahead/behind and remote non-advance; use `git push origin HEAD:main`, never force.
- [ ] **Step 5: Observe exact Pages run/jobs and HTTP.** Record workflow/run/head/build/deploy status and probe `/`, `/methods`, `/methods/mth-07`, three reciprocal methods, Temporal case, references and SVG with content type/bytes/hash.
- [ ] **Step 6: Run production IAB four-state QA and track evidence.** Repeat exact local schema against production; do not reuse local evidence. Bind raw bytes/hash and screenshots or honest screenshot limitation.
- [ ] **Step 7: Verify and commit evidence.** Run focused deployment mutations, `npm run verify`, `git diff --check`; commit and push an evidence-only commit, then observe its own Pages run in the untracked report without recursive tracked evidence.

## Task 7: Stage B Closeout and Final Publication

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g010-mth07.md`
- Modify: `tests/g010-mth07-deployment.test.mjs`
- Create: `docs/reviews/evidence/g010-mth07-stage-b-production-browser.json`
- Regenerate: `src/generated/*.json`
- Modify current-projection fixtures only.

**Interfaces:**
- Consumes: exact successful Stage A implementation/evidence run and independent verdicts.
- Produces: MTH-07 complete, exact Stage B review/deploy evidence, production-verified `main`.

- [ ] **Step 1: Lock immediate history before editing.** Hash the complete immediately previous backlog suffix and review bytes; add mutation rejection so historical evidence cannot drift.
- [ ] **Step 2: Write Stage B RED.** Require only MTH-07 checkbox change, exact Stage A SHA/run/date/HTTP evidence, MTH-07 complete, actual current totals, review slots PENDING and deployment PENDING.
- [ ] **Step 3: Close backlog and regenerate.** Check only MTH-07, preserve prior bytes, run generator and synchronize only live-projection fixtures. Expected total is `60/102/529` unless generator evidence explains otherwise.
- [ ] **Step 4: Run AI-slop cleanup.** Remove stale names/messages and duplicate/dead code; retain only exact-href, mutation-tested Browser compatibility fallbacks. Do not weaken validators or historical locks.
- [ ] **Step 5: Obtain three independent Stage B reviews.** Record exact head and zero-blocker code/content-rights/architecture verdicts; deployment remains PENDING.
- [ ] **Step 6: Full verify, fast-forward push, observe exact Pages, probe HTTP and run fresh production IAB four-state QA.** Track immutable raw Stage B evidence; bind exact relations, wrappers, sources, SVG, diagnostics and honest screenshots.
- [ ] **Step 7: Bind `SUCCESS / PASS`, run `npm run verify && git diff --check`, commit/push evidence, observe its own Pages run, and leave tracked worktree clean with `HEAD=origin/main` and no STY-07 files in the package.**

## Plan Self-Review

- Spec coverage: all thirteen design sections map to Tasks 1–7; source boundary, narrow headings, twelve contracts, responsibility matrix, original visual, density, relations, Stage A/B and production QA each have an owner task.
- Placeholder scan: every task names exact files, commands, expected state and commit boundary; no unresolved implementation marker remains.
- Interface consistency: Task 1 constants are consumed unchanged by Tasks 2–4; Task 5 creates the evidence schema consumed by Tasks 6–7; Stage A and Stage B exact heads are never inferred from mutable `HEAD` text.
