# STY-03 Vertical Slice Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-03 垂直切片架构主题页，以“提交订单”为统一案例比较分层组织与按用例组织，并完成来源、图示、关系、生成投影和发布验证闭环。

**Architecture:** 新页面沿用现有 `style` 内容契约和 `/styles/sty-03` 路由。正文使用原创比较表与订单请求场景，Draw.io 源文件和 SVG 投影表达分层与垂直切片的控制流、依赖方向、共享不变量及单体部署边界。内容元数据、来源台账和关系由现有生成器生成，定向测试锁定本主题的内容和部署证据。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node test runner、TypeScript、Draw.io XML/SVG、JSON source ledger。

## Global Constraints

- 使用现有 Docusaurus、MDX、内容生成器、来源台账、术语注册和 Draw.io/SVG 校验机制。
- 不新增 npm 依赖，不改变既有页面 URL、全站视觉 token 或发布路由。
- 本轮只实现 STY-03，不实现 STY-04，不新增运行时功能，不进行无关重构。
- 垂直切片不是固定目录模板、独立服务、独立数据库或独立部署单元的同义词。
- 新正文外链必须登记到 `data/source-ledger.json`，并闭合许可证、健康缓存和使用边界。
- 受管术语首次出现必须遵守中文优先格式；专名、协议、代码、路径和字段保持官方拼写。
- 生成文件只能由既有生成脚本更新，不手工维护第二份状态源。
- 桌面验证使用 `1440x1000`，移动验证使用 `390x844`；页面不得产生 document overflow。
- 提交前使用 Bun 优先：`bun test`、`bun run typecheck`、`bun run build`；完整门禁为 `bun run verify`。

---

## 文件职责地图

- Create: `content/styles/sty-03-vertical-slice-architecture.mdx` — STY-03 正文和 front matter。
- Create: `diagrams/sty-03-vertical-slice-boundary.drawio` — 可编辑原创图示源文件。
- Create: `static/img/diagrams/sty-03-vertical-slice-boundary.svg` — 发布用 SVG 投影。
- Create: `tests/g009-batch4-content.test.mjs` — STY-03 内容、来源、关系和图示结构契约。
- Create: `tests/g009-batch4-deployment.test.mjs` — STY-03 发布投影、基线和部署证据契约。
- Modify: `content/styles/sty-01-layered-architecture.mdx` — 增加 STY-03 互惠相邻链接。
- Modify: `content/styles/sty-02-hexagonal-onion-clean.mdx` — 增加 STY-03 互惠相邻链接。
- Modify: `content/paths/02-module-boundaries.mdx` — 把已有垂直切片入口指向 `/styles/sty-03`。
- Modify: `data/source-ledger.json` — 新增实际引用的 Bogard 和 Microsoft 来源记录。
- Modify: `data/source-link-health.json` — 为新增 transport 写入已审健康缓存。
- Modify: `docs/source-license-inventory.md` — 由生成脚本同步新增来源的许可证库存。
- Modify: `docs/content-backlog.md` — 完成发布闭环后更新 STY-03 checkbox 和当前发布基线。
- Regenerate: `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/project-status.json`, `src/generated/source-ledger.json` — 由 `bun run generate:content` 更新。
- Create: `docs/reviews/g009-batch4.md` — 实现、内容、架构和发布审查证据。

## Task 1: Lock the failing STY-03 content contract

**Files:**
- Create: `tests/g009-batch4-content.test.mjs`
- Read-only reference: `tests/g009-batch3-content.test.mjs`, `tests/g009-batch2-content.test.mjs`

**Interfaces:**
- Consumes: `parseFrontMatter`, `readContentDocuments`, `extractInternalLinks`, `extractExternalLinks`, generated manifest/indexes, source ledger, link health and license inventory.
- Produces: named STY-03 assertions that the page, source records, reciprocal relations and diagram pair must satisfy.

- [ ] **Step 1: Write the test fixture imports and exact contract constants.**

  Copy the existing batch-test setup pattern, then define exact constants for:

  - `STY-03`, `/styles/sty-03`, `status: reviewed`, `content_type: style`;
  - eleven required headings in the existing style order;
  - four learning questions about change radius, use-case boundaries, shared invariants and deployment independence;
  - comparison rows for organization unit, control flow, dependency, data ownership, consistency, deployment, team topology, quality attributes, migration and stop conditions;
  - source IDs for `src-bogard-vertical-slice-architecture` and `src-microsoft-eshoponweb-architecture`;
  - diagram paths and minimum inventory labels.

- [ ] **Step 2: Add assertions for the expected page and generated projection.**

  Assert that the new page is absent before implementation, so the targeted test fails for the expected reason; then add the final assertions for metadata, heading order, internal/external links, source identity, relation reciprocity, STY-04 pending state, generated counts and exact diagram asset paths.

- [ ] **Step 3: Run only the new test and record the expected failure.**

  Run: `bun test tests/g009-batch4-content.test.mjs`

  Expected: FAIL because `content/styles/sty-03-vertical-slice-architecture.mdx` and its generated source/diagram artifacts do not yet exist. Do not weaken the assertions to make the empty fixture pass.

- [ ] **Step 4: Commit the contract test.**

  ```bash
  git add tests/g009-batch4-content.test.mjs
  git commit -m "test: define STY-03 content contract"
  ```

## Task 2: Register and verify the STY-03 evidence sources

**Files:**
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Test: `tests/g009-batch4-content.test.mjs`

**Interfaces:**
- Consumes: exact source URLs `https://www.jimmybogard.com/vertical-slice-architecture/` and `https://github.com/dotnet-architecture/eShopOnWeb`.
- Produces: complete source records referenced by the STY-03 page and accepted by source/license validators.

- [ ] **Step 1: Verify the two source identities and current transports.**

  Use the existing source-health workflow to check the author article and Microsoft-maintained sample repository. Record title, author/organization, publication or repository version boundary, check date `2026-08-08`, final transport, source kind, evidence roles, license evidence and exclusions. If the live transport differs, use the canonical final transport returned by the existing health tooling and make the page link match it.

- [ ] **Step 2: Add complete ledger records.**

  Add stable IDs `src-bogard-vertical-slice-architecture` and `src-microsoft-eshoponweb-architecture`. Each record must contain the same complete identity, license, copyright policy, usage boundary, evidence-role and health fields used by the STY-02 records; the Microsoft sample’s implementation details remain examples rather than normative architecture requirements.

- [ ] **Step 3: Add reviewed health-cache entries and regenerate the license inventory.**

  Add every transport used by the page to `data/source-link-health.json`, then run the repository generator that updates `docs/source-license-inventory.md`. Verify that the source/license consistency checks accept both records.

- [ ] **Step 4: Run source-specific tests.**

  Run: `bun test tests/source-governance-data.test.mjs tests/source-link-health.test.mjs tests/source-license-inventory.test.mjs tests/g009-batch4-content.test.mjs`

  Expected: the source governance tests pass; the STY-03 test still fails only on missing page/projection/diagram content.

- [ ] **Step 5: Commit the evidence registration.**

  ```bash
  git add data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md tests/g009-batch4-content.test.mjs
  git commit -m "docs: register STY-03 architecture sources"
  ```

## Task 3: Create the synchronized STY-03 diagram pair

**Files:**
- Create: `diagrams/sty-03-vertical-slice-boundary.drawio`
- Create: `static/img/diagrams/sty-03-vertical-slice-boundary.svg`
- Modify: `tests/g009-batch4-content.test.mjs`

**Interfaces:**
- Consumes: the repository Draw.io/SVG style and validator contract used by `mod-02`, `mod-03` and `sty-02` diagrams.
- Produces: one synchronized SVG pair with a stable inventory of nodes, boundaries, directed relations and readable edge labels.

- [ ] **Step 1: Add the diagram inventory assertions to the failing test.**

  Assert both files exist, the Draw.io XML has an `mxfile`, the SVG has a semantic `title`/`desc`, and both contain the exact agreed labels: `分层架构`, `垂直切片`, `SubmitOrder`, `共享领域不变量`, `数据库`, `单体部署边界`, `运行时控制流`, `源码依赖`, and `切片不等于独立部署单元`. Assert at least two top-level comparison boundaries, one `SubmitOrder` boundary, at least eight visible nodes and at least ten directed relations.

- [ ] **Step 2: Create the Draw.io source.**

  Build a two-column original diagram. The left column shows `HTTP 请求 → Controller → Application Service → Shared Repository → Database` across a single deployment boundary. The right column shows `HTTP 请求 → SubmitOrder Handler → Order Rules → Inventory Port / Order Store → Response Mapper`, with the shared invariant boundary and database inside the same single deployment boundary. Use solid arrows for runtime control and dashed arrows for source dependency; label the distinction in the diagram. Keep labels as XML-safe text and avoid copying any source diagram.

- [ ] **Step 3: Create the SVG projection.**

  Export or construct the SVG using the project’s accepted SVG conventions: no fixed root width/height, a stable `viewBox`, semantic `title` and `desc`, visible edge labels without label-background rectangles, and enough whitespace for mobile contained scrolling. Ensure the SVG node/edge inventory matches the Draw.io source.

- [ ] **Step 4: Run the diagram validators and targeted assertions.**

  Run: `bun test tests/drawio-diagram-validator.test.mjs tests/drawio-svg-pilot.test.mjs tests/g009-batch4-content.test.mjs`

  Expected: shared validators pass and the STY-03 inventory assertions pass.

- [ ] **Step 5: Commit the diagram pair.**

  ```bash
  git add diagrams/sty-03-vertical-slice-boundary.drawio static/img/diagrams/sty-03-vertical-slice-boundary.svg tests/g009-batch4-content.test.mjs
  git commit -m "docs: add STY-03 vertical slice diagram"
  ```

## Task 4: Write the STY-03 article and navigation links

**Files:**
- Create: `content/styles/sty-03-vertical-slice-architecture.mdx`
- Modify: `content/styles/sty-01-layered-architecture.mdx`
- Modify: `content/styles/sty-02-hexagonal-onion-clean.mdx`
- Modify: `content/paths/02-module-boundaries.mdx`
- Test: `tests/g009-batch4-content.test.mjs`

**Interfaces:**
- Consumes: source IDs and URLs from Task 2, diagram asset from Task 3, existing style-page headings and `handleHorizontalArrowKey` import.
- Produces: a complete independently readable STY-03 page and reciprocal actionable links from published adjacent topics.

- [ ] **Step 1: Add the page front matter.**

  Use `topic_id: STY-03`, `content_type: style`, `slug: /styles/sty-03`, `status: reviewed`, `difficulty: intermediate`, `priority: P0`, `depends_on: [STY-00, STY-01]`, `adjacent_topics: [STY-01, STY-02, STY-04]`, related case `/cases/micro-frontends-single-spa`, and the same quality-attribute fields used by STY-01/STY-02.

- [ ] **Step 2: Write the eleven required sections in Chinese.**

  Explain the definition, forces, control flow, dependency and data boundaries using the order scenario. State that a slice is a change-oriented code boundary first, not a process boundary. Include failure mapping at the request boundary, consistency limits, single-process deployment, team ownership, quality trade-offs, migration steps, explicit non-adoption conditions and a comparison table with Layered Architecture, STY-02 and Modular Monolith. Separate source-backed facts, evidence-based inference, Tego Arch analysis and unknown production outcomes.

- [ ] **Step 3: Embed the diagram in a keyboard-scrollable accessible region.**

  Import `handleHorizontalArrowKey` and use the established wrapper pattern:

  ```mdx
  <div className="architecture-diagram-scroll" role="region" aria-label="分层架构与垂直切片的提交订单边界对照图，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>

  ![提交订单在分层架构与垂直切片架构中的边界、控制流与单体部署关系](/img/diagrams/sty-03-vertical-slice-boundary.svg)

  </div>
  ```

- [ ] **Step 4: Add reciprocal links and the formal learning-path link.**

  In STY-01 and STY-02, add visible links to `/styles/sty-03` in the existing comparison/migration prose. In `content/paths/02-module-boundaries.mdx`, replace the community-index-only vertical-slice link with the formal `/styles/sty-03` link while retaining the index as discovery-only evidence if needed.

- [ ] **Step 5: Run content and terminology tests.**

  Run: `bun test tests/g009-batch4-content.test.mjs tests/content-relations.test.mjs tests/terminology-content-contract.test.mjs tests/terminology-policy.test.mjs tests/terminology-registry.test.mjs`

  Expected: all targeted tests pass, including reciprocal relation and Chinese-first terminology checks.

- [ ] **Step 6: Commit the page and links.**

  ```bash
  git add content/styles/sty-03-vertical-slice-architecture.mdx content/styles/sty-01-layered-architecture.mdx content/styles/sty-02-hexagonal-onion-clean.mdx content/paths/02-module-boundaries.mdx tests/g009-batch4-content.test.mjs
  git commit -m "docs: publish STY-03 vertical slice architecture"
  ```

## Task 5: Regenerate projections and bind the deployment contract

**Files:**
- Modify: `src/generated/topic-manifest.json`
- Modify: `src/generated/topic-indexes.json`
- Modify: `src/generated/project-status.json`
- Modify: `src/generated/source-ledger.json`
- Modify: `tests/g009-batch4-deployment.test.mjs`
- Test: `tests/g009-batch4-content.test.mjs`

**Interfaces:**
- Consumes: all content, source and relation changes from Tasks 1–4.
- Produces: deterministic generated projections showing STY-03 published/complete while STY-04 remains pending, plus deployment assertions for the current batch.

- [ ] **Step 1: Write deployment assertions for the new projection.**

  Assert the current backlog projection has STY-03 as the next topic before closure, then define the post-closure expectations: STY-03 is `published: true` and `status.value: complete`; STY-04 is `published: false` and `status.value: pending`; project counts increase by exactly one document and one completed topic plus the exact number of new governed sources. Assert the canonical `/styles/sty-03` route and SVG asset are included in the deployment inventory.

- [ ] **Step 2: Generate projections.**

  Run: `bun run generate:content`

  Expected: the four generated JSON projections and source inventory update without warnings. Review the diff to ensure only STY-03, its relations, sources, and expected counts changed.

- [ ] **Step 3: Run the full local content projection checks.**

  Run: `bun test tests/g009-batch4-content.test.mjs tests/g009-batch4-deployment.test.mjs tests/project-status.test.mjs tests/topic-manifest.test.mjs tests/topic-index.test.mjs && bun run check:content`

  Expected: PASS; no stale generated files and no premature STY-04 link.

- [ ] **Step 4: Commit generated projections and deployment contract.**

  ```bash
  git add src/generated/topic-manifest.json src/generated/topic-indexes.json src/generated/project-status.json src/generated/source-ledger.json tests/g009-batch4-deployment.test.mjs
  git commit -m "test: bind STY-03 generated deployment projection"
  ```

## Task 6: Complete review evidence and full verification

**Files:**
- Create: `docs/reviews/g009-batch4.md`
- Modify: `tests/g009-batch4-deployment.test.mjs`
- Modify: `docs/content-backlog.md` only after release evidence exists

**Interfaces:**
- Consumes: all implementation artifacts and generated projections from Tasks 1–5.
- Produces: reproducible local/production review evidence and final backlog closure only after all gates pass.

- [ ] **Step 1: Run deterministic repository validation.**

  Run:

  ```bash
  bun test
  bun run validate:content content
  bun run check:terminology
  bun run check:content
  bun run check:links
  bun run check:reviews
  bun run typecheck
  bun run build
  ```

  Expected: every command exits `0`; record the exact test count, build result and route/asset inventory in the review file.

- [ ] **Step 2: Run the existing browser/deployment workflow for STY-03.**

  Check local and production canonical routes at desktop `1440x1000` and mobile `390x844`. Record HTTP status, document geometry, SVG loading, contained table/diagram widths, keyboard focus and ArrowRight behavior, source and relation activations, console warnings/errors/page errors, and accepted screenshots. Do not mark backlog complete from local-only evidence.

- [ ] **Step 3: Write the review report.**

  In `docs/reviews/g009-batch4.md`, record:

  - implementation commit and exact head SHA;
  - source IDs, URLs, license decisions and health-cache results;
  - content, code and architecture review verdicts;
  - full test count and validation commands;
  - local/production route and asset observations for both viewports;
  - diagram node/boundary/relation inventory and screenshot/artifact hashes;
  - any remediation commit and its exact-head recheck.

- [ ] **Step 4: Commit review evidence before changing the backlog.**

  ```bash
  git add docs/reviews/g009-batch4.md tests/g009-batch4-deployment.test.mjs
  git commit -m "docs: record STY-03 review evidence"
  ```

- [ ] **Step 5: Update the backlog only after successful deployment.**

  Change the STY-03 item in `docs/content-backlog.md` from `- [ ]` to `- [x]`, add its implementation commit, Pages run, canonical route, viewport/interaction evidence, test count and successful deployment date to the current baseline, and keep STY-04 as the next pending item. Regenerate projections if the backlog change affects them.

- [ ] **Step 6: Run the final exact-head validation and commit the closure.**

  Run: `git diff --check && bun run verify && git status --short`

  Expected: `bun run verify` passes, only intended closure files are changed, and no generated projection is stale. Commit with:

  ```bash
  git add docs/content-backlog.md src/generated tests/g009-batch4-deployment.test.mjs
  git commit -m "docs: close G009 STY-03"
  ```

## Self-review checklist

- **Spec coverage:** Tasks 1–2 cover content and source/license governance; Task 3 covers the Draw.io/SVG pair and accessibility; Task 4 covers the complete article and reciprocal navigation; Task 5 covers deterministic generated projections and STY-04 non-activation; Task 6 covers local verification, production deployment evidence, review records and backlog closure.
- **Placeholder scan:** no `TBD`, `TODO`, “implement later”, or unspecified validation step is used in this plan.
- **Type/contract consistency:** all tasks use the same filenames, source IDs, `/styles/sty-03` route, diagram labels, generated projection names and STY-04 pending-state contract.
