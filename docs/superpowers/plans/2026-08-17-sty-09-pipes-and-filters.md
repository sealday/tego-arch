# STY-09 Pipes and Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-09 Pipes and Filters 主题页，用同一订单数据处理流水线准确对照批处理与流处理，并完成背压、错误传播、来源、原创图、关系、Stage A/Stage B 审查和线上发布闭环。

**Architecture:** 新页面沿用 `style` 内容契约与 `/styles/sty-09` 路由。正文以 Filter、Pipe、Pipeline 为核心，通过订单校验、标准化、定价、风险标记和汇总/输出的双轨场景，分离转换语义与批流运行合同；Draw.io/SVG 以左右双轨、反向背压、故障隔离和恢复终态表达同一判断。Stage A 发布 reviewed 页面但保持 STY-09 pending，只有 exact-head Pages、四态 in-app Browser QA 和三类独立审查闭合后，Stage B 才把完成数从 61 推进到 62，并保持 STY-10 unpublished/pending/non-actionable。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-09；不实现 STY-10，不新增流处理引擎、消息中间件、示例应用或 npm 依赖。
- Filter、Pipe、Pipeline 必须分别定义；不得把 Pipes and Filters 等同于消息队列、工作流引擎、事件驱动架构、ETL 产品、Saga 或 shell pipeline。
- 批处理轨与流处理轨复用同一订单转换语义，但输入边界、触发、状态、顺序、容量、错误、恢复和输出可见性必须分别说明。
- 所有缓冲有界；背压是逐边界容量协议，不是业务数据倒流，也不得外推为跨不兼容 API、队列或网络的自动端到端流控。
- 模式不自动提供全局顺序、端到端 exactly-once 业务效果、幂等、可靠投递或跨步骤事务。
- 坏记录、临时依赖失败、Filter 崩溃、部分输出、外部效果未知和毒数据必须具有不同的检测、响应、停止条件和人工所有者。
- Microsoft、Apache Beam、Reactive Streams 和 GNU Bash 只作为窄范围证据；不得把单一产品或进程管道语义推广为模式公理。
- 不新增依赖，不改变既有 URL、全站视觉 token、生成器、验证器或 GitHub Pages 工作流。
- `src/generated/` 只能由 `npm run generate:content` 更新，不能手工编辑。
- 历史 review、Pages run/job、artifact hash、Browser evidence 与 backlog 历史后缀保持字节不变；只有明确标注 current/latest 的投影断言可推进。
- 所有实现任务遵循 TDD：先观察真实 RED，再写最小实现，运行 GREEN，最后提交；不得弱化 validator、降低几何阈值或用 fallback 掩盖失败。
- 浏览器验证显式使用 in-app Browser；截图不可用或不可信时记录精确三次尝试并标记 `BLOCKED / NOT_ACCEPTED`，不得改用 Chrome、外部 Playwright、旧截图或伪造视觉 PASS。
- 当前基线为 `61 completed / 104 documents / 539 governed sources`。若新增四个远程身份与一项原创插图，预计 Stage A 为 `61/105/544`，Stage B 为 `62/105/544`；生成器结果不同则审计真实去重结果，只同步 current 投影，不改写历史证据。

---

## File Map

### New files

- `tests/g009-batch10-content.test.mjs` — STY-09 正文、来源、关系、图示和 Stage A 投影的 mutation-sensitive 契约。
- `tests/g009-batch10-deployment.test.mjs` — Stage A/Stage B 投影、评审、历史锁与生产证据契约。
- `content/styles/sty-09-pipes-and-filters.mdx` — STY-09 正文。
- `diagrams/sty-09-pipes-filters-order-processing.drawio` — 可编辑的订单批流双轨图。
- `static/img/diagrams/sty-09-pipes-filters-order-processing.svg` — 发布 SVG。
- `docs/reviews/g009-batch10.md` — Stage A/Stage B exact-head 审查与发布记录。
- `docs/reviews/evidence/g009-batch10-stage-a-browser.json` — tracked 本地 Stage A 四态 Browser 原始证据。
- `docs/reviews/evidence/g009-batch10-stage-a-production-browser.json` — tracked Stage A 生产 Browser 原始证据。
- `docs/reviews/evidence/g009-batch10-stage-b-production-browser.json` — tracked Stage B 生产 Browser 原始证据。

### Existing files expected to change

- `data/source-ledger.json` — 四个远程来源、一项原创插图及 STY-09 文档引用。
- `data/source-link-health.json` — 四个新 remote transport 的健康记录。
- `docs/source-license-inventory.md` — 新来源与原创插图的许可证/版权边界。
- `content/styles/sty-05-microservices.mdx` — 跨服务 Filter 引入网络、部署和团队所有权成本的可见反向关系。
- `content/styles/sty-06-event-driven-architecture.mdx` — 事件载荷/存储不由 Pipeline 自动决定的可见反向关系。
- `content/cases/apache-kafka-consumer-groups.mdx` — 分区/offset/rebalance 与步骤组合边界的可见反向关系。
- `content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx` — 容量、排队与背压的可见反向关系。
- `content/paths/04-reliability-state.mdx` — 重试预算、恢复和人工终态入口。
- `docs/content-backlog.md` — Stage B 仅勾选 STY-09 并记录 exact Stage A 证据，下一项推进为 STY-10。
- `src/generated/content-ledger.json`, `src/generated/project-status.json`, `src/generated/public-source-ledger.json`, `src/generated/topic-indexes.json`, `src/generated/topic-manifest.json` — 生成器实际产生的 Stage A/Stage B current 投影；无 byte diff 的输出不得为凑数修改。
- 当前投影型 `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs`, `tests/g010-*.test.mjs` — 仅更新 latest/current counts、next topic 和新增反向 adjacency；历史 artifact/run/hash 断言保持不变。

---

## Task 1: Lock the failing STY-09 content contract

**Files:**
- Create: `tests/g009-batch10-content.test.mjs`
- Read: `docs/superpowers/specs/2026-08-17-sty-09-pipes-and-filters-design.md`
- Read: `tests/g009-batch9-content.test.mjs`

**Interfaces:**
- Consumes: current `61/104/539` projection and absent STY-09 article/source/diagram state.
- Produces: exact metadata, headings, wrappers, batch/stream matrices, failure ownership, source, relation, diagram and Stage A projection validators used by Tasks 2–4.

- [ ] **Step 1: Define exact constants and reuse proven parsers**

  Start with fixed paths and identities:

  ```js
  import assert from 'node:assert/strict';
  import {readFileSync} from 'node:fs';
  import test from 'node:test';

  export const ARTICLE = 'content/styles/sty-09-pipes-and-filters.mdx';
  export const DRAWIO = 'diagrams/sty-09-pipes-filters-order-processing.drawio';
  export const SVG = 'static/img/diagrams/sty-09-pipes-filters-order-processing.svg';
  export const ROUTE = '/styles/sty-09';
  export const TOPIC_ID = 'STY-09';
  export const NEXT_TOPIC = 'STY-10';
  export const EXPECTED_STAGE_A = {completed: 61, documents: 105, sources: 544};
  export const SOURCE_IDS = [
    'src-microsoft-pipes-filters-pattern',
    'src-apache-beam-programming-guide',
    'src-reactive-streams-1-0-4',
    'src-gnu-bash-pipelines',
    'src-atlas-sty09-pipes-filters-order-processing',
  ];
  ```

  Copy the proven front-matter parser, Markdown table parser, MDX link extractor, XML parser, SVG cascade/specificity resolver, alpha-composition helper, path parser, marker-envelope transform and glyph-box geometry helpers from Batch 9. Preserve effective-style and real-terminal calculations; do not replace them with regex-only self-reports.

- [ ] **Step 2: Bind exact metadata, headings and three wrappers**

  Fix and deep-equal every front-matter field: title, slug, content type, status, difficulty, dates, confidence, domains, agent patterns, protocols, quality attributes, tags, summary, topic ID, priority and relation arrays. Require the final approved H2 sequence and exactly three horizontal-scroll wrappers: diagram, eight-dimension matrix and six-failure table. Each wrapper must use `role="region"`, an exact approved `aria-label`, `tabIndex={0}` and `onKeyDown={handleHorizontalArrowKey}`.

  Add deletion and changed-value mutations for every metadata field and wrapper attribute; assert each mutation differs from the original before expecting rejection.

- [ ] **Step 3: Bind Filter/Pipe/Pipeline and the shared order transformation**

  Require positive responsibility and explicit non-guarantee for all three constructs:

  ```js
  const CONSTRUCTS = [
    ['Filter', /输入.*(转换|判定).*(输出|过滤原因|错误分类)/u],
    ['Pipe', /(传递|交付).*(容量|缓冲|确认|顺序|错误)/u],
    ['Pipeline', /(组合|连接).*输入.*输出.*合同/u],
  ];
  const ORDER_STEPS = ['校验', '标准化', '定价', '风险标记', '汇总/输出'];
  ```

  Reject mutations claiming every Filter is stateless/pure/idempotent, Pipe is a reliable queue, steps are freely commutative, or Pipeline supplies a transaction. Require the illustrative-scene label and the same five transformations in both batch and stream paths.

- [ ] **Step 4: Parse and bind the exact eight-dimension matrix**

  Parse a fixed ordered table with columns `维度 | 批处理轨 | 流处理轨 | 决策问题`. Require exactly these rows:

  ```js
  const DIMENSIONS = [
    '输入边界', '触发方式', '状态位置', '顺序',
    '容量控制', '错误传播', '恢复单位', '输出可见性',
  ];
  ```

  Bind each batch answer, stream answer and decision question to its row, not to a global literal inventory. Add row deletion, row swap, answer swap, ownership deletion and false-equivalence mutations. Explicitly reject “批处理天然有序”“流处理天然实时”“微批等于批流合同相同”。

- [ ] **Step 5: Bind backpressure, failure and recovery contracts**

  Require the six Filter contract fields: input identity/schema, output/rejection, state, bounded capacity, replay/idempotency and owner. Require bounded buffers and exact response choices: pause reads, reduce concurrency, delay acknowledgement, admission reduction, load shedding or rejection. Require a visible statement that backpressure stops at incompatible boundaries.

  Parse the exact table `故障 | 检测 | 自动响应 | 停止条件 | 人工所有者` with rows `坏记录`, `临时依赖失败`, `Filter 崩溃`, `部分输出`, `外部效果未知`, `毒数据持续失败`. Add row deletion and per-cell semantic mutations, plus unlimited retry, silent drop, default-success, blind replay and missing-owner mutations.

- [ ] **Step 6: Bind prohibitions, migration, sources and relations**

  Require the visible prohibitions `不保证全局顺序`, `不保证端到端 exactly-once 业务效果`, `不替代跨步骤业务事务`. Require incremental extraction from a monolithic processing function, intermediate contract, idempotency key, bounded Pipe and replay boundary, plus all stop conditions from the design.

  Require the five source IDs, at least four independent remote identities, exactly one `manifest_primary` on the Microsoft pattern source, exact canonical/transport/license/evidence roles and original illustration rights. Require visible reciprocal links from STY-05, STY-06, Kafka Consumer Groups, QA-03 and reliability path; require no actionable `/styles/sty-10`.

- [ ] **Step 7: Bind diagram inventory, effective parity and physical geometry**

  Define stable IDs for shared order input, batch/stream boundaries, ten matched filters, batch barrier/release, stream window/checkpoint, outputs, backpressure controller, three error classes, four recovery/terminal targets and four legend roles. Derive Draw.io endpoints from actual source/target terminal bounds and normalized ports; compare SVG route points, roles, bounds, line/marker/font styles and paint order.

  At 800 CSS-pixel render width require: node horizontal/vertical padding `16/14px`, title/type baseline `22px`, text bottom `14px`, label-to-stroke/arrow/node `8/16/12px`, body/edge text `15px`. Check all semantic, structural and legend path intersections, real marker footprints against labels/nodes/boundaries, partial collinear overlaps and later paint masks. Reject missing terminals, changed ports, ignored fallback points, detached backpressure, error branches without terminal recovery and a replay path entering an irreversible side effect.

- [ ] **Step 8: Run focused tests and commit meaningful RED**

  Run:

  ```bash
  node --check tests/g009-batch10-content.test.mjs
  node --test tests/g009-batch10-content.test.mjs
  git diff --check
  ```

  Expected: helper/cascade/mutation-fixture tests pass; implementation tests fail only because STY-09 article, new source records, relations, diagram pair and `61/105/544` projection do not exist.

  ```bash
  git add tests/g009-batch10-content.test.mjs
  git commit -m "test: define STY-09 content contract"
  ```

---

## Task 2: Create the synchronized batch/stream diagram

**Files:**
- Create: `diagrams/sty-09-pipes-filters-order-processing.drawio`
- Create: `static/img/diagrams/sty-09-pipes-filters-order-processing.svg`
- Modify: `tests/g009-batch10-content.test.mjs`
- Read: `.codex/skills/creating-drawio-architecture-diagrams/references/layout-and-typography.md`
- Read before integration: `.codex/skills/creating-drawio-architecture-diagrams/references/repository-integration.md`

**Interfaces:**
- Consumes: exact diagram inventory and geometry contract from Task 1.
- Produces: editable Draw.io and published SVG with identical topology and effective styles for Task 3.

- [ ] **Step 1: Re-read both diagram skills and freeze the semantic inventory**

  Read `illustrating-architecture-articles` and `creating-drawio-architecture-diagrams` completely. Record source/published/article paths, reading direction, boundaries, node IDs, edge IDs, control owners, failure branches, recovery terminals, forbidden implications and exact labels in `.superpowers/sdd/task-2-report.md`.

- [ ] **Step 2: Add diagram-specific RED mutations**

  Add non-no-op mutations for: missing/changed port, missing waypoint, injected `sourcePoint`, swapped batch/stream Filter, removed backpressure arrow, backpressure rendered as forward business data, error branch without terminal, replay into external effect, legend drift, changed font, opaque label mask, partial collinear overlap and shifted marker into a foreign node/boundary. Run the focused diagram pattern and verify RED before authoring assets.

- [ ] **Step 3: Author Draw.io with real terminals and measured lanes**

  Use one 2400-author-unit-wide canvas so final scale is `800/2400 = 1/3`. Create separate batch, stream, capacity-control and failure/recovery regions. Use real `source`/`target` cells with normalized `exitX/exitY/entryX/entryY`, `exitPerimeter=1`, `entryPerimeter=1`, `Dx/Dy=0`, and explicit `Array as="points"` waypoints. Give backpressure, error and recovery dedicated corridors; do not route them through label bands.

  Size every visible text node from final CSS requirements before routing. Use actual edge cells plus terminal anchor vertices for legend keys; never use text vertices with connector metadata or dangling `sourcePoint`/`targetPoint` geometry.

- [ ] **Step 4: Export and synchronize the SVG**

  Flatten the SVG geometry while retaining stable `data-*` roles, exact visible text and actual marker definitions. Match every Draw.io endpoint, waypoint, stroke, width, dash, arrow shape/fill, label bounds and typography. Keep `viewBox` width 2400 and let article CSS render it at 800px.

- [ ] **Step 5: Run parity, geometry, validator and raster gates**

  ```bash
  node --test --test-name-pattern='SVG cascade|diagram inventory|Draw.io/SVG diagram' tests/g009-batch10-content.test.mjs
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
    diagrams/sty-09-pipes-filters-order-processing.drawio \
    static/img/diagrams/sty-09-pipes-filters-order-processing.svg \
    --label 校验 --label 标准化 --label 定价 --label 风险标记 \
    --label 批次发布 --label 持续输出 --label 背压 --label 人工终态
  npm run check:terminology
  git diff --check
  ```

  Expected: focused diagram tests pass, validator prints `Validated sty-09-pipes-filters-order-processing`, terminology reports zero issues and diff check exits 0.

  Render the SVG at exactly 800px width using the repository/browser rendering path. Inspect the full raster at original size and focused crops for labels, topology, arrows, legend, boundaries, masks, clipping and color-independent distinctions. Record exact CSS minima and raster SHA in the ignored report; any visible defect keeps Task 2 RED.

- [ ] **Step 6: Commit the synchronized pair**

  ```bash
  git add diagrams/sty-09-pipes-filters-order-processing.drawio \
    static/img/diagrams/sty-09-pipes-filters-order-processing.svg \
    tests/g009-batch10-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-09 batch and stream diagram"
  ```

---

## Task 3: Write the article, govern sources and close relations

**Files:**
- Create: `content/styles/sty-09-pipes-and-filters.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Modify: `content/styles/sty-05-microservices.mdx`
- Modify: `content/styles/sty-06-event-driven-architecture.mdx`
- Modify: `content/cases/apache-kafka-consumer-groups.mdx`
- Modify: `content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx`
- Modify: `content/paths/04-reliability-state.mdx`
- Modify: `tests/g009-batch10-content.test.mjs`
- Modify only if required: `data/terminology.json`

**Interfaces:**
- Consumes: Task 1 content/source/relationship contract and Task 2 SVG path.
- Produces: publishable article and canonical governance data; generated projections remain stale RED for Task 4.

- [ ] **Step 1: Read the complete writing contract and fix exact metadata**

  Read `.codex/skills/writing-architecture-cases/references/article-contract.md` before drafting. Fix the precise front matter, H2 order, three wrapper labels, relation arrays and source contracts in the test before prose. Run focused tests and verify the failure now points to missing article/source content, not ambiguous constants.

- [ ] **Step 2: Register exact source identities and rights**

  Register these canonical identities with audited transport/version/license seams:

  ```text
  https://learn.microsoft.com/en-us/azure/architecture/patterns/pipes-and-filters
  https://beam.apache.org/documentation/programming-guide/
  https://www.reactive-streams.org/  (bind JVM specification 1.0.4 evidence separately)
  https://www.gnu.org/software/bash/manual/html_node/Pipelines.html
  /img/diagrams/sty-09-pipes-filters-order-processing.svg
  ```

  Bind Microsoft only to the pattern definition and its issues; Beam only to bounded/unbounded/windowing; Reactive Streams only to non-blocking backpressure and exclusions; Bash only to process-pipeline exit status/`pipefail`; the original illustration only to the named asset. Add exact deletion/change and coordinated ledger+inventory fabrication mutations.

- [ ] **Step 3: Draft the visible narrative and two exact tables**

  Write a complete first-reader path: opening conflict, Filter/Pipe/Pipeline, order scenario, batch track, stream track, eight-dimension matrix, backpressure, failure/recovery table, state/order/output boundaries, adoption/migration/stop conditions, comparisons and sources. Keep all consequential recovery and irreversible-effect boundaries visible; move version/license/source seams into labeled evidence cards.

  Embed `/img/diagrams/sty-09-pipes-filters-order-processing.svg` immediately after the paragraph explaining what to inspect. Use exactly three `.table-scroll`/diagram wrapper regions with the approved keyboard contract.

- [ ] **Step 4: Add reciprocal links without activating STY-10**

  Add concise visible backlinks and metadata adjacency only where relationship generation requires them. Preserve each existing article’s core claim. Verify the five intended reverse edges and assert no `/styles/sty-10` link in any published surface.

- [ ] **Step 5: Run content, source, relation, terminology and build gates**

  ```bash
  node --test tests/g009-batch10-content.test.mjs \
    tests/source-ledger.test.mjs tests/source-link-health.test.mjs \
    tests/source-license-inventory.test.mjs tests/content-relations.test.mjs \
    tests/terminology-policy.test.mjs
  npm run validate:content
  npm run check:terminology
  npm run check:links
  npm run typecheck
  npm run build
  git diff --check
  ```

  Expected: all article/source/relation/diagram assertions pass; exactly one planned Stage A projection assertion remains RED at `61/104/539` versus `61/105/544`. Validation reports 105 documents and the audited governed-source count; terminology, links, typecheck, build and diff check pass.

- [ ] **Step 6: Run editorial and rendered-page review**

  ```bash
  node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/styles/sty-09-pipes-and-filters.mdx
  ```

  Resolve every structural warning and require visual-balance strictly greater than 90. Read `.codex/skills/writing-architecture-cases/references/review-checklist.md` and pass its four gates. Build/serve the page and use the in-app Browser at `1440×1000` and `390×844` to verify opening, SVG, three wrappers, local scroll, document width, keyboard ArrowRight and source/relation rendering. Record evidence as Task 3 QA; do not present it as Task 4 exact-candidate evidence after render-affecting commits.

- [ ] **Step 7: Commit article and governance**

  ```bash
  git add content/styles/sty-09-pipes-and-filters.mdx \
    content/styles/sty-05-microservices.mdx \
    content/styles/sty-06-event-driven-architecture.mdx \
    content/cases/apache-kafka-consumer-groups.mdx \
    content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx \
    content/paths/04-reliability-state.mdx \
    data/source-ledger.json data/source-link-health.json \
    docs/source-license-inventory.md tests/g009-batch10-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-09 pipes and filters"
  ```

---

## Task 4: Generate, independently review and bind Stage A

**Files:**
- Create: `tests/g009-batch10-deployment.test.mjs`
- Create: `docs/reviews/g009-batch10.md`
- Create: `docs/reviews/evidence/g009-batch10-stage-a-browser.json`
- Modify: generator-produced `src/generated/*.json` files with actual byte changes
- Modify: current/latest projection fixtures only

**Interfaces:**
- Consumes: Task 3 render-affecting candidate and expected current projection.
- Produces: exact implementation head, tracked Browser evidence, three independent review verdicts and Stage A READY head; no push or backlog checkbox.

- [ ] **Step 1: Write Stage A deployment RED and immutable-history locks**

  Copy the Batch 9 deployment parser structure, then bind Batch 10 paths, artifacts and current projection. Hash the complete immediate STY-08 review and the complete immediate STY-08 backlog suffix; assert byte identity and mutation sensitivity. Require STY-09 `published/pending`, STY-10 `unpublished/pending/non-actionable`, three PENDING review slots, final PENDING, scope `STAGE_A_ONLY` and deployment `NOT_RUN`.

- [ ] **Step 2: Generate canonical Stage A projections**

  ```bash
  npm run generate:content
  npm run check:content
  git diff -- src/generated
  ```

  Expected current truth: `61 completed / 105 documents / 544 governed sources`, STY-09 published/pending, STY-10 unpublished/pending. If source count differs, enumerate new unique identities and update the single current expectation only after audit. Stage exactly the generated files with real byte differences.

- [ ] **Step 3: Synchronize only current projection fixtures**

  Run the full Node suite once, classify every failure, and update only assertions explicitly representing current/latest projection, pagination, next topic or reciprocal adjacency. Split live prefixes from immutable historical suffixes before changing a literal. Mutations must target current STY-10, never a historical STY-09 occurrence. Do not weaken artifact hashes, review identities or prior Pages evidence.

- [ ] **Step 4: Commit the implementation candidate before Browser collection**

  ```bash
  git add src/generated tests docs/reviews/g009-batch10.md
  git diff --cached --check
  git commit -m "docs: prepare STY-09 Stage A candidate"
  git rev-parse HEAD
  ```

  Record this exact SHA as `implementationHead`. Rebuild from this clean head; no later render-affecting edit may reuse its Browser evidence.

- [ ] **Step 5: Collect uniform local in-app Browser evidence**

  Build and serve the exact candidate on a dedicated localhost port. Use only the in-app Browser for desktop light/dark `1440×1000` and mobile light/dark `390×844`. For every state bind exact page width, three wrapper client/scroll widths, focus, `:focus-visible`, 3px outline, ArrowRight delta, SVG loaded/intrinsic/rendered dimensions, five exact relations with H1/return, four exact remote source destinations, STY-10 count zero and complete diagnostics with empty warnings/errors/runtime/log events.

  Capture exactly three fresh supported full-page screenshots and inspect original bytes. If any repeats viewports, omits the diagram or otherwise cannot prove visual coverage, record each exact path/bytes/hash/reason as `CAPTURED_REJECTED` and set overall `BLOCKED / NOT_ACCEPTED`; do not add a fourth attempt.

- [ ] **Step 6: Bind raw bytes and exact semantics with mutations**

  Track `docs/reviews/evidence/g009-batch10-stage-a-browser.json`. Bind exact candidate head, raw byte count/SHA, state order, viewport/theme/page geometry, wrapper labels/order/geometry, per-index ArrowRight results, unique href→H1 relation map, exact source list, SVG dimensions, diagnostics and all three screenshot attempt objects. Add wrong-head/hash, duplicate/swap wrapper, swapped interaction, fabricated relation/source, unloaded SVG, STY-10 fabrication, screenshot PASS and attempt removal/change mutations.

- [ ] **Step 7: Run three independent exact-head reviews**

  Obtain and record:

  - code/spec/security: `READY / APPROVE`, findings `0`;
  - content/evidence/rights: `CONTENT READY`, rights `PASS`, findings `0`;
  - architecture/invariants: `CLEAR / READY`, blockers `0`.

  Reviewers must bind exact implementation and evidence heads, verify history hashes, actual raw bytes and clean-checkout tests. Any finding returns to RED; after render-affecting remediation, recollect Browser evidence against the new implementation head.

- [ ] **Step 8: Bind Stage A verdicts and verify fully**

  Update the deployment contract first so the PENDING review is RED, then record exact heads and verdicts in `docs/reviews/g009-batch10.md`. Keep `STAGE_A_ONLY`, deployment `NOT_RUN`, and the truthful screenshot status.

  ```bash
  npm run verify
  git diff --check
  git status --short
  ```

  Expected: all tests pass, validate reports the audited document/source counts, terminology reports zero issues, generation/links/reviews/typecheck/build pass and tracked status is clean after commits.

  ```bash
  git add docs/reviews/g009-batch10.md \
    docs/reviews/evidence/g009-batch10-stage-a-browser.json \
    tests/g009-batch10-deployment.test.mjs
  git commit -m "docs: bind STY-09 Stage A verdicts"
  ```

---

## Task 5: Publish Stage A and capture production evidence

**Files:**
- Create: `docs/reviews/evidence/g009-batch10-stage-a-production-browser.json`
- Modify: `docs/reviews/g009-batch10.md`
- Modify: `tests/g009-batch10-deployment.test.mjs`
- Write ignored report: `.superpowers/sdd/sty09-task5-publish-report.md`

**Interfaces:**
- Consumes: exact Stage A READY head from Task 4.
- Produces: fast-forward production publication, exact Pages/run/job/HTTP/SVG/IAB evidence and evidence-only head; backlog remains unchecked.

- [ ] **Step 1: Perform publication safety preflight**

  ```bash
  git fetch origin
  git status --short
  git rev-parse HEAD origin/main
  git merge-base origin/main HEAD
  git rev-list --left-right --count origin/main...HEAD
  ```

  Require tracked clean, `origin/main` an ancestor of HEAD and behind count zero. On divergence stop; do not force, rebase or silently merge unrelated remote work.

- [ ] **Step 2: Push only the reviewed head and observe exact Pages run**

  ```bash
  git push origin HEAD:main
  ```

  Find the `push` Pages run whose `headSha` equals the reviewed head. Require run, build job and deploy job all `completed/success`; record exact IDs. Do not accept a later evidence commit’s run as proof of the implementation head.

- [ ] **Step 3: Probe routes and immutable SVG identity**

  Probe the root/base route, styles index, STY-09, every reciprocal destination, references and canonical SVG. Require HTML routes `200 text/html`, SVG `200 image/svg+xml`, and production SVG bytes/SHA exactly equal the reviewed local asset.

- [ ] **Step 4: Collect production four-state IAB evidence**

  Repeat all four functional states and exact semantics from Task 4 against `https://sealday.github.io/tego-arch/styles/sty-09`. Preserve diagnostics pagination completeness. Capture exactly three fresh screenshots and accept only original-size evidence that actually covers the page and diagram; otherwise record `BLOCKED / NOT_ACCEPTED` without changing the functional PASS.

- [ ] **Step 5: Bind production evidence and publish the evidence-only commit**

  Write the production raw JSON and first make tests RED on missing production evidence. Bind implementation head, Pages/job IDs, route probes, SVG identity, four states and screenshot attempts. Update the review to `Stage A deployment SUCCESS / functional PASS` while keeping visual status separate.

  ```bash
  npm run verify
  git diff --check
  git add docs/reviews/evidence/g009-batch10-stage-a-production-browser.json \
    docs/reviews/g009-batch10.md tests/g009-batch10-deployment.test.mjs
  git commit -m "docs(g009): record STY-09 Stage A production evidence"
  git push origin HEAD:main
  ```

  Observe the evidence commit’s own Pages run to success and record it only in the ignored report. Finish with HEAD/origin/main equality, ahead/behind `0/0` and clean status.

---

## Task 6: Close STY-09 in Stage B

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch10.md`
- Modify: generator-produced current projection files
- Modify: `tests/g009-batch10-deployment.test.mjs`
- Modify: current/latest projection fixtures only

**Interfaces:**
- Consumes: Task 5 exact Stage A production closure.
- Produces: reviewed local Stage B candidate with STY-09 complete and STY-10 as sole next topic; deployment remains `PENDING / NOT_RUN`.

- [ ] **Step 1: Write closure RED and immediate-history locks**

  Require exact Stage A commit/date/run/build/deploy/route/SVG/browser evidence on the STY-09 line. Hash the complete immediate STY-08 backlog suffix and review bytes. Add Stage B slots and final/deployment fields as PENDING. Run focused tests and observe RED at `61` completed and the unchecked STY-09 line.

- [ ] **Step 2: Change only the canonical backlog line and regenerate**

  Change `[ ] STY-09` to `[x] STY-09` and append exact Stage A closure evidence. Do not check STY-10. Run:

  ```bash
  npm run generate:content
  npm run check:content
  ```

  Expected: `62 completed / 105 documents / 544 governed sources`, STY-09 published/complete, STY-10 unpublished/pending/non-actionable and sole next topic; source counts remain unchanged from Stage A.

- [ ] **Step 3: Synchronize current truth and perform bounded cleanup**

  Update only live/current projections from 61→62, pending→complete and next STY-09→STY-10. Split current prefixes from immutable Batch 9/earlier history. Update mutation targets to current STY-10 and correct stale test names/messages. Search and resolve masking patterns where an old STY-09 historical occurrence could satisfy a current assertion.

- [ ] **Step 4: Run three independent Stage B reviews**

  Bind the exact closure candidate and require code `READY/APPROVE`, content `CONTENT READY` with rights `PASS`, architecture `CLEAR/READY`, all findings/blockers zero. Verify article, source ledger, diagrams, Stage A raw and production raw are byte-identical; review only backlog/current projection and test cleanup changes.

- [ ] **Step 5: Bind Stage B verdicts and commit**

  Make the deployment contract RED on PENDING verdicts, then write exact reviewed head and three verdicts. Set final Stage B readiness `READY`; keep deployment exactly `PENDING / NOT_RUN`, screenshot status unchanged and scope `STAGE_B`.

  ```bash
  npm run verify
  git diff --check
  git add docs/content-backlog.md docs/reviews/g009-batch10.md \
    src/generated tests
  git diff --cached --check
  git commit -m "docs: bind STY-09 Stage B verdicts"
  ```

---

## Task 7: Publish Stage B and reconcile the repository

**Files:**
- Create: `docs/reviews/evidence/g009-batch10-stage-b-production-browser.json`
- Modify: `docs/reviews/g009-batch10.md`
- Modify: `tests/g009-batch10-deployment.test.mjs`
- Write ignored report: `.superpowers/sdd/sty09-task7-final-publish-report.md`

**Interfaces:**
- Consumes: exact Stage B READY head from Task 6.
- Produces: final production closure, tracked Stage B evidence, synchronized remote and clean repository.

- [ ] **Step 1: Repeat fast-forward preflight and push**

  Repeat Task 5 preflight. Push only when tracked clean, origin/main is an ancestor and behind is zero. Use `git push origin HEAD:main`; never force.

- [ ] **Step 2: Observe exact closure run/jobs and probe production**

  Require the exact Stage B head’s Pages run/build/deploy to complete successfully. Repeat all HTML route and exact SVG byte/hash probes. Record no result until every route and job is complete.

- [ ] **Step 3: Collect fresh Stage B IAB evidence**

  Recollect four states, 12 wrapper interactions, exact relation H1/returns, exact source links, SVG dimensions, STY-10 zero and complete diagnostics. Do not reuse Stage A raw. Capture exactly three fresh screenshots; reject untrustworthy full-page output honestly.

- [ ] **Step 4: Bind Stage B production evidence with mutations**

  Write `g009-batch10-stage-b-production-browser.json`. Make tests RED before editing the review. Bind closure implementation head, exact run/job IDs, route/SVG probes, raw bytes/hash, every functional semantic and three screenshot attempts. Update Stage B deployment to `SUCCESS / PASS` while keeping screenshot evidence outside PASS scope when rejected.

- [ ] **Step 5: Verify, commit and push evidence only**

  ```bash
  npm run verify
  git diff --check
  git add docs/reviews/evidence/g009-batch10-stage-b-production-browser.json \
    docs/reviews/g009-batch10.md tests/g009-batch10-deployment.test.mjs
  git commit -m "docs(g009): record STY-09 Stage B production evidence"
  git push origin HEAD:main
  ```

  Observe the evidence commit’s own Pages run/build/deploy to success and record it only in the ignored report.

- [ ] **Step 6: Reconcile final state**

  ```bash
  git fetch origin
  git rev-parse HEAD origin/main
  git merge-base HEAD origin/main
  git rev-list --left-right --count origin/main...HEAD
  git status --short
  ```

  Expected: HEAD, origin/main and merge-base are the evidence commit; ahead/behind `0/0`; tracked and untracked status clean. Confirm canonical projection `62/105/544` or the audited actual source count, STY-09 published/complete, STY-10 unpublished/pending/non-actionable and no fabricated visual PASS.

---

## Final Verification Matrix

| Gate | Required evidence |
| --- | --- |
| Content | Exact front matter, approved section order, same five order transformations, eight-dimension matrix, six-failure table |
| Semantics | Filter/Pipe/Pipeline boundaries; bounded capacity; per-boundary backpressure; no global order/exactly-once/transaction claim |
| Recovery | Retry, isolate, stop, query/reconcile, controlled replay and human terminal with explicit owners |
| Diagram | Real Draw.io terminals/ports/waypoints; exact SVG parity; all paths/markers/labels/nodes/boundaries collision-safe; 800px raster PASS |
| Sources/Rights | Four exact remote identities, one original illustration, one primary, exact roles/licenses/usage boundaries, no copied composition |
| Relations | STY-05, STY-06, Kafka, QA-03, reliability path reciprocal; STY-10 zero actionable links |
| Stage A | Current audited projection, STY-09 published/pending, three reviews zero findings, exact-head local and production IAB evidence |
| Stage B | Completion advances by one, source count unchanged, STY-09 complete, STY-10 sole next, three reviews zero findings |
| Publication | Exact FF heads, exact Pages run/build/deploy success, HTTP routes, byte-identical SVG, four-state production QA |
| Repository | `npm run verify` PASS, diff check PASS, HEAD=origin/main, ahead/behind 0/0, clean status |
