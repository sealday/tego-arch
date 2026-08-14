# STY-08 Actor Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-08 Actor Model 主题页，用每个订单一个逻辑 Actor 的履约案例准确区分 Actor、线程、普通消息消费者、事件驱动与微服务，并完成来源、原创图、关系、Stage A/Stage B 审查和线上发布闭环。

**Architecture:** 新页面沿用 `style` 十一段内容契约与 `/styles/sty-08` 路由。正文以 Actor 的身份、私有状态、邮箱、行为和监督为核心，把邮箱串行、消息投递、持久化、位置透明和业务恢复拆成独立责任；Draw.io/SVG 用共享订单状态与订单 Actor 的左右分层图表达同一判断。Stage A 发布 reviewed 页面但保持 STY-08 pending，只有 exact-head Pages、四态 in-app Browser QA 和三类独立审查闭合后，Stage B 才把完成数从 60 推进到 61，并保持 STY-09 unpublished/pending/non-actionable。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-08；不实现 STY-09、STY-14、完整消息交付专题或新的 Actor 运行时。
- Actor 与线程、普通消息消费者、事件驱动和微服务必须分别比较，不能写成同义词、互斥分类或成熟度阶梯。
- 每个订单一个逻辑 Actor 是说明性案例，不是要求每个数据库行、请求、类或微服务都映射为 Actor。
- 邮箱串行不自动提供持久化、可靠投递、全局顺序、恰好一次、分布式事务或外部副作用幂等。
- 监督只处理执行单元故障；业务拒绝、结果未知、对账、补偿、持久化恢复和人工终止必须另有所有者。
- 位置透明只隐藏当前物理位置，不隐藏延迟、序列化、网络分区、安全、容量、放置或状态迁移事实。
- Akka、Orleans、Erlang/OTP 仅作为窄范围实现证据；不得把单一框架保证推广为 Actor Model 公理。
- 不新增 npm 依赖，不改变既有 URL、全站视觉 token、生成器、验证器或 GitHub Pages 工作流。
- `src/generated/` 只能由 `npm run generate:content` 更新，不能手工编辑。
- 历史 review、Pages run/job、artifact hash、Browser evidence 与 backlog 历史后缀保持字节不变；只有明确标注为 current/latest 的投影断言可推进。
- 所有实现任务遵循 TDD：先观察真实 RED，再写最小实现，运行 GREEN，最后提交；不得弱化 validator、降低几何阈值或用 fallback 掩盖失败。
- 浏览器验证显式使用 in-app Browser；截图不可用或不可信时记录精确尝试并标记 `BLOCKED / NOT_ACCEPTED`，不得改用 Chrome、外部 Playwright、旧截图或伪造视觉 PASS。
- 当前基线为 `60 completed / 102 documents / 529 governed sources`。若新增五个远程身份与一项原创插图，预计 Stage A 为 `60/103/535`，Stage B 为 `61/103/535`；生成器结果不同则审计真实身份后只同步 current 投影，不改写历史证据。

---

## File Map

### New files

- `tests/g009-batch9-content.test.mjs` — STY-08 正文、来源、关系、图示和 Stage A 投影的 mutation-sensitive 契约。
- `tests/g009-batch9-deployment.test.mjs` — Stage A/Stage B 投影、评审、历史锁与生产证据契约。
- `content/styles/sty-08-actor-model.mdx` — 十一段 Actor Model 正文。
- `diagrams/sty-08-actor-order-fulfillment.drawio` — 可编辑的共享状态/订单 Actor 分层对照图。
- `static/img/diagrams/sty-08-actor-order-fulfillment.svg` — 发布 SVG。
- `docs/reviews/g009-batch9.md` — Stage A/Stage B exact-head 审查与发布记录。
- `docs/reviews/evidence/g009-batch9-stage-a-browser.json` — tracked 本地 Stage A 四态 Browser 原始证据。
- `docs/reviews/evidence/g009-batch9-stage-a-production-browser.json` — tracked Stage A 生产 Browser 原始证据。
- `docs/reviews/evidence/g009-batch9-stage-b-production-browser.json` — tracked Stage B 生产 Browser 原始证据。

### Existing files expected to change

- `data/source-ledger.json` — 五个新远程来源、一项原创插图及 STY-08 文档引用；复用既有 Erlang 监督来源。
- `data/source-link-health.json` — 五个新远程 transport 的健康记录。
- `docs/source-license-inventory.md` — 新来源与原创插图的许可证/版权边界。
- `content/styles/sty-05-microservices.mdx` — 微服务不等于 Actor 的可见反向关系与 metadata adjacency。
- `content/styles/sty-06-event-driven-architecture.mdx` — 事件语义不由 Actor 身份/邮箱决定的可见反向关系。
- `content/styles/sty-07-service-oriented-architecture.mdx` — 企业合同/治理不由 Actor 粒度替代的可见反向关系。
- `content/cases/erlang-otp-supervision-tree.mdx` — 仅在关系生成器要求时增加精确可见反向入口，不改变案例事实。
- `docs/content-backlog.md` — Stage B 仅勾选 STY-08 并记录 exact Stage A 证据，下一项推进为 STY-09。
- `src/generated/content-ledger.json`, `src/generated/project-status.json`, `src/generated/public-source-ledger.json`, `src/generated/topic-indexes.json`, `src/generated/topic-manifest.json` — 生成器产生的 Stage A/Stage B current 投影。
- 当前投影型 `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs` — 仅更新 latest/current counts、next topic 和新增反向 adjacency；历史 artifact/run/hash 断言保持不变。

---

## Task 1: Lock the failing STY-08 content contract

**Files:**
- Create: `tests/g009-batch9-content.test.mjs`
- Read: `docs/superpowers/specs/2026-08-14-sty-08-actor-model-design.md`
- Read: `tests/g009-batch8-content.test.mjs`

**Interfaces:**
- Consumes: current `60/102/529` projection and absent STY-08 article/source/diagram state.
- Produces: exact metadata, headings, wrappers, semantic matrices, ownership, source, relation, diagram and Stage A projection validators used by Tasks 2–4.

- [ ] **Step 1: Define exact constants and reuse proven parsers**

  Create the test with these fixed paths and identities:

  ```js
  import assert from 'node:assert/strict';
  import {readFileSync} from 'node:fs';
  import test from 'node:test';

  const ARTICLE = 'content/styles/sty-08-actor-model.mdx';
  const DRAWIO = 'diagrams/sty-08-actor-order-fulfillment.drawio';
  const SVG = 'static/img/diagrams/sty-08-actor-order-fulfillment.svg';
  const TOPIC_ID = 'STY-08';
  const NEXT_TOPIC = 'STY-09';
  const EXPECTED_STAGE_A = {completed: 60, documents: 103, sources: 535};
  const EXPECTED_HEADINGS = [
    '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
    '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
    '禁用条件', '对比案例', '来源',
  ];
  const SOURCE_IDS = [
    'src-hewitt-bishop-steiger-actor-formalism-1973',
    'src-akka-actor-model',
    'src-akka-message-delivery-reliability',
    'src-akka-location-transparency',
    'src-microsoft-orleans-overview',
    'src-erlang-28f791c67609',
    'src-atlas-sty08-actor-order-fulfillment',
  ];
  ```

  Copy the proven front-matter parser, Markdown table parser, MDX link extractor, XML parser, SVG cascade/specificity resolver, alpha-composition helper, path parser, marker-envelope transform and glyph-box geometry helpers from Batch 8. Do not replace them with regex-only metadata or hard-coded style assertions.

- [ ] **Step 2: Bind exact metadata, headings and three wrappers**

  Deep-equal every front-matter field: title, slug, content type, status, difficulty, dates, confidence, domains, agent patterns, protocols, quality attributes, tags, summary, topic ID, priority and all relation arrays. Require the exact eleven H2 headings and exactly three horizontal-scroll wrappers: the diagram, mechanism matrix and adoption matrix. Each wrapper must be the approved opening tag with `role="region"`, exact `aria-label`, `tabIndex={0}` and `onKeyDown={handleHorizontalArrowKey}`.

  For every metadata field and wrapper attribute, add a deletion mutation and a changed-value mutation. Require every mutation to be non-no-op before asserting rejection.

- [ ] **Step 3: Bind five Actor components and four comparisons**

  Use affirmative, polarity-aware ownership contracts:

  ```js
  const ACTOR_COMPONENTS = [
    ['identity', /逻辑身份[^。；]*(寻址|引用|稳定键)/u],
    ['private-state', /私有状态[^。；]*(自身行为|Actor 自身)[^。；]*(修改|改变)/u],
    ['mailbox', /邮箱[^。；]*(缓冲|排队)[^。；]*逐条/u],
    ['behavior', /行为[^。；]*(处理一条消息|改变内部状态|发送后续消息)/u],
    ['supervision', /监督[^。；]*(重启|停止|升级)/u],
  ];
  const COMPARISONS = ['线程与锁', '普通消息消费者', '事件驱动架构', '微服务'];
  ```

  Require positive responsibility plus its explicit non-guarantee for each component. Parse the fixed comparison table and reject swapped rows, Actor=thread, Actor=consumer, Actor=event-driven, Actor=microservice, mutual-exclusion and maturity-ladder mutations independently.

- [ ] **Step 4: Bind the order flow and six observation points**

  Require `Order-123`, `SubmitOrder`, operation ID, correlation ID, expected order version, different-order parallelism, inventory/payment/notification authority, order/workflow ownership, timeout-as-unknown, idempotency, query/reconciliation and external-side-effect stop paths.

  Parse and require these six distinct checkpoints in order:

  ```js
  const OBSERVATION_POINTS = [
    '收到消息', '进入邮箱', '开始处理', '业务提交', '发送回复', '外部效果完成',
  ];
  ```

  Add deletion and false-implication mutations such as “进入邮箱即证明支付完成” and “超时证明目标未执行”; the validator must reject each without relying on unrelated prose.

- [ ] **Step 5: Bind mailbox, supervision, distribution and decision contracts**

  Require separate clauses for mailbox capacity, persistence and ordering; framework-scoped delivery guarantees; sender/receiver ordering limits; dead letters; restart/stop/escalate; restart budget; poison message; state recovery; unknown external effect; location/latency/serialization/network/security/placement boundaries; hotspot Actor; cross-Actor invariant; and operational stopping conditions.

  Parse a fixed failure table with columns `失败类别 | 检测 | 自动动作 | 停止条件 | 人工所有者`. Require rows for mailbox overflow, poison message, Actor crash, state recovery failure, unknown external effect, network/target unavailable, incompatible message contract and hotspot backlog. Exercise row deletion, cell corruption, negative ownership and unlimited-restart mutations.

- [ ] **Step 6: Bind exact sources, reciprocal relations and projection**

  Require all seven source IDs, at least four independent remote hostnames, exactly one `manifest_primary` on the 1973 paper, exact canonical/transport/license/evidence roles, framework-specific usage boundaries and original illustration rights. Require visible reciprocal links from STY-05/06/07 and the Erlang supervision case; require no actionable `/styles/sty-09`.

  Assert `60/103/535`, STY-08 `published/pending` and STY-09 `unpublished/pending`. Keep counts only in `EXPECTED_STAGE_A` so an audited generator difference changes one current object, not history literals.

- [ ] **Step 7: Bind diagram inventory, effective parity and physical geometry**

  Define exact IDs for shared-state anti-pattern, two order actors, mailboxes, private states, behaviors, supervisor, persistence, two runtime nodes, inventory/payment/notification authorities, recovery path and six legend roles. Derive Draw.io endpoints from real source/target terminal bounds and normalized ports; compare SVG routes, labels, roles, bounds, line/marker/font styles and paint order.

  At 800 CSS-pixel render width require at least: label-to-any-stroke `8px`, real marker-to-label `16px`, text/marker-to-foreign-node and boundary nonintersection with `12px` text clearance, essential text `15px`, header inner padding `12px`, legend key-caption `12px`, own marker-caption `16px`. Reject partial collinear overlap, later opaque/translucent masks, selector-specificity changes, transparent canvas, changed port, detached authority path and a recovery arrow that reaches an external side effect.

- [ ] **Step 8: Run focused tests and commit meaningful RED**

  Run:

  ```bash
  node --check tests/g009-batch9-content.test.mjs
  node --test tests/g009-batch9-content.test.mjs
  git diff --check
  ```

  Expected: pure helper/cascade/mutation-fixture tests pass; implementation tests fail only because the STY-08 article, new source records, relations, diagram pair and `60/103/535` projection do not exist.

  Commit:

  ```bash
  git add tests/g009-batch9-content.test.mjs
  git commit -m "test: define STY-08 content contract"
  ```

---

## Task 2: Create the synchronized Actor order diagram

**Files:**
- Create: `diagrams/sty-08-actor-order-fulfillment.drawio`
- Create: `static/img/diagrams/sty-08-actor-order-fulfillment.svg`
- Modify: `tests/g009-batch9-content.test.mjs`

**Interfaces:**
- Consumes: Task 1 stable semantic inventories, route/style parity and geometry assertions.
- Produces: synchronized editable/published assets with stable IDs and verified 800px layout for Task 3.

- [ ] **Step 1: Read the diagram skills and references completely**

  Read:

  ```text
  .codex/skills/illustrating-architecture-articles/SKILL.md
  .codex/skills/creating-drawio-architecture-diagrams/SKILL.md
  ```

  Follow every referenced SVG/Draw.io synchronization, geometry, raster, validator and reporting requirement. Record skill-driven decisions in ignored `.superpowers/sdd/task-2-report.md`.

- [ ] **Step 2: Add diagram-specific RED mutations**

  Add named tests that reject: missing mailbox, shared mutable Actor state, supervisor owning business state, persistence connected directly to payment effect, missing real port, altered waypoint, line/marker mismatch, label collision, marker/node collision, boundary collision, legend mismatch, later mask, transparent background and low-contrast essential role.

  Run:

  ```bash
  node --test --test-name-pattern='STY-08.*(diagram|Draw.io|SVG|geometry|contrast)' tests/g009-batch9-content.test.mjs
  ```

  Expected: production assertions RED because both assets are absent; helper mutations prove non-no-op behavior.

- [ ] **Step 3: Author the Draw.io source with real terminals**

  Use one opaque-canvas page. Required top-level regions and stable IDs:

  ```text
  actor-comparison-canvas
  shared-state-boundary
  actor-runtime-boundary
  runtime-node-a
  runtime-node-b
  external-authority-boundary
  legend-band
  ```

  Include callers, shared order state, `order-123`, `order-456`, two mailboxes, two private states, behavior loops, supervisor, persistence, inventory/payment/notification authorities and recovery query. Every connector uses `source`/`target`, normalized `exitX/exitY/entryX/entryY`, perimeter flags and actual `mxGeometry` waypoints. Do not use `dataRoute`, `sourcePoint` or `targetPoint` as semantic parity evidence.

- [ ] **Step 4: Export and synchronize the SVG**

  Preserve exact semantic identities with `data-node-id`, `data-edge-id`, `data-role`, `data-source`, `data-target` and `data-legend-for`. Use different, text-labeled styles for mailbox message, remote message, supervision signal, persistence record, query/reconciliation and external effect. Ensure the recovery path terminates at restored internal state or authority query, never at a repeated payment/notification effect.

- [ ] **Step 5: Run parity, geometry and contrast gates**

  Run:

  ```bash
  node --test --test-name-pattern='STY-08.*(diagram|Draw.io|SVG|geometry|contrast)' tests/g009-batch9-content.test.mjs
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_diagram.py diagrams/sty-08-actor-order-fulfillment.drawio static/img/diagrams/sty-08-actor-order-fulfillment.svg
  npm run check:terminology
  git diff --check
  ```

  Expected: focused tests, paired validator, terminology and diff check pass.

- [ ] **Step 6: Render and inspect at final width**

  Render at exactly 800 CSS pixels wide and inspect the raster at original size. Verify opening labels, both order Actors, mailboxes, all authority boundaries, routes, arrows, supervision/recovery semantics, legend, cropping and absence of copied marks. Record exact raster dimensions, SHA-256 and measured minima in the ignored report. Any visible defect keeps the task RED and requires synchronized Draw.io/SVG correction.

- [ ] **Step 7: Commit the synchronized diagram**

  ```bash
  git add diagrams/sty-08-actor-order-fulfillment.drawio \
    static/img/diagrams/sty-08-actor-order-fulfillment.svg \
    tests/g009-batch9-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-08 actor order diagram"
  ```

---

## Task 3: Write the article, govern sources and close relations

**Files:**
- Create: `content/styles/sty-08-actor-model.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Modify: `content/styles/sty-05-microservices.mdx`
- Modify: `content/styles/sty-06-event-driven-architecture.mdx`
- Modify: `content/styles/sty-07-service-oriented-architecture.mdx`
- Modify if required: `content/cases/erlang-otp-supervision-tree.mdx`
- Modify: `tests/g009-batch9-content.test.mjs`
- Modify only current source-governance/terminology count fixtures when exact counts advance.

**Interfaces:**
- Consumes: Task 1 article/source/relationship contracts and Task 2 published asset.
- Produces: independently readable MDX, seven governed citations and source-valid relations with only Stage A generation remaining RED.

- [ ] **Step 1: Fix exact metadata and source identities before prose**

  Extract the exact front matter and three wrapper aria labels from current style-page conventions, then lock them in Task 1 before creating the article. Register these new source IDs in deterministic ledger order:

  ```text
  src-hewitt-bishop-steiger-actor-formalism-1973
  src-akka-actor-model
  src-akka-message-delivery-reliability
  src-akka-location-transparency
  src-microsoft-orleans-overview
  src-atlas-sty08-actor-order-fulfillment
  ```

  Reuse `src-erlang-28f791c67609`. Each remote record must have exact canonical and transport URLs, source kind, verified rights boundary, license evidence, allowed roles and a narrow usage boundary. Add the STY-08 citation map in the same change; never leave provisional uncited identities.

- [ ] **Step 2: Write the opening and five-component model**

  Import `SourceLedger` and `handleHorizontalArrowKey`. Within three short opening paragraphs state the shared-state conflict, the transferable Actor lens and the model/framework evidence boundary. Define identity, private state, mailbox, behavior and supervision with positive responsibility plus explicit non-guarantee.

- [ ] **Step 3: Write the order flow and four-way comparison**

  Trace `SubmitOrder` through `Order-123`, inventory, payment and notification with operation ID, correlation ID, expected version, persistence, timeout-as-unknown and reconciliation. Keep `Order-456` as the parallelism contrast. Add the exact Actor/thread/consumer/event-driven/microservices matrix and follow it with the non-maturity conclusion.

- [ ] **Step 4: Write failure, distribution and stopping contracts**

  Distinguish the six observation points. Add the exact eight-row failure table from Task 1 and visible clauses for bounded mailbox, dead letters, restart/stop/escalate, restart budget, poison-message quarantine, state restore, external-effect reconciliation, remote target failure, message compatibility and hotspot backlog. State that logical location may be hidden while physical failure is not.

- [ ] **Step 5: Add migration, decision table and evidence cards**

  Write the one-entity pilot migration sequence and the adoption/caution/stop matrix. Keep safety, irreversible effect, version, recovery and manual-stop boundaries in visible prose. Put exact paper/framework versions, license seams and implementation-specific exceptions in topic-labeled evidence cards; folding every card must leave a complete argument.

- [ ] **Step 6: Add visible reciprocal links without activating STY-09**

  Add exact STY-08 links to STY-05/06/07 and the Erlang case only where the relationship is visible and semantically accurate. Run `npm run check:content`; if the generator requires reverse metadata, add the matching exact reverse edge and visible prose. Never add `/styles/sty-09` as a link or published adjacency.

- [ ] **Step 7: Run content, source, relation and build gates**

  Run:

  ```bash
  node --test tests/g009-batch9-content.test.mjs tests/source-governance*.test.mjs tests/content-relations.test.mjs tests/terminology*.test.mjs
  npm run validate:content
  npm run check:terminology
  npm run check:links
  npm run typecheck
  npm run build
  git diff --check
  ```

  Expected: content/source/relation/diagram assertions pass; only the isolated Stage A projection remains RED because generated files are still `60/102/529`.

- [ ] **Step 8: Run article density and visual balance review**

  Read the complete article-writing contract and review checklist referenced by `.codex/skills/writing-architecture-cases/SKILL.md`, then run its density analyzer against the new article. Require visual-balance strictly above 90, no missing visual and no blocking density finding. Review advisory long sentences individually; do not shorten away guarantees or ownership boundaries.

- [ ] **Step 9: Commit article, sources and reciprocal links**

  ```bash
  git add content/styles/sty-08-actor-model.mdx \
    content/styles/sty-05-microservices.mdx \
    content/styles/sty-06-event-driven-architecture.mdx \
    content/styles/sty-07-service-oriented-architecture.mdx \
    data/source-ledger.json data/source-link-health.json \
    docs/source-license-inventory.md tests/g009-batch9-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-08 actor model"
  ```

  If the Erlang case or exact current governance fixtures changed, add only those inspected paths to the same commit.

---

## Task 4: Generate, independently review and bind Stage A

**Files:**
- Create: `tests/g009-batch9-deployment.test.mjs`
- Create: `docs/reviews/g009-batch9.md`
- Create: `docs/reviews/evidence/g009-batch9-stage-a-browser.json`
- Modify: five `src/generated/*.json` projections.
- Modify: only current projection fixtures surfaced by the full suite.

**Interfaces:**
- Consumes: reviewed Task 3 content/source/diagram candidate and exact Batch 8 history.
- Produces: STY-08 `published/pending`, tracked local four-state evidence and final Stage A `READY / STAGE_A_ONLY / NOT_RUN` review.

- [ ] **Step 1: Write the Stage A deployment RED and complete history locks**

  Require `60/103/535`, STY-08 `published/pending`, STY-09 `unpublished/pending/non-actionable`, exact artifact identities, a tracked Browser artifact, three independent verdict slots, final Stage A READY, scope `STAGE_A_ONLY` and deployment `NOT_RUN`.

  Hash the complete immediate STY-07 backlog suffix and complete `docs/reviews/g009-batch8.md` bytes. Add appended/deleted-byte mutations. Run:

  ```bash
  node --test tests/g009-batch9-deployment.test.mjs
  ```

  Expected: history helpers pass; projection, review and Browser assertions RED.

- [ ] **Step 2: Generate canonical Stage A projections**

  ```bash
  npm run generate:content
  npm run check:content
  ```

  Expected: `60/103/535`, STY-08 published/pending, STY-09 unpublished/pending and zero actionable routes. If counts differ, enumerate exact added identities and update only `EXPECTED_STAGE_A` plus current fixtures.

- [ ] **Step 3: Synchronize only current projection fixtures**

  Run `npm run test`, classify every failure, and update only assertions explicitly representing latest/current counts, current next topic or new adjacency. Split current prefixes from immutable historical suffixes before replacing STY-08/STY-09 literals. Preserve every old artifact SHA, raw evidence hash, Pages run/job and historical review byte contract.

- [ ] **Step 4: Build and collect uniform local IAB evidence**

  Build and serve the exact implementation candidate. Using in-app Browser only, collect `desktopLight`, `desktopDark` at `1440x1000` and `mobileLight`, `mobileDark` at `390x844`. Every state records page width, three wrapper widths, three one-to-one focus/`:focus-visible`/3px-outline/ArrowRight interactions, exact SVG intrinsic/rendered dimensions, four relation href/H1/return checks, all remote source href/target/rel values, STY-09 actionable zero and complete empty diagnostics with `hasMore=false`, `truncated=false`.

  Save tracked JSON to `docs/reviews/evidence/g009-batch9-stage-a-browser.json`. Record exactly up to three fresh screenshot attempts; accept only images that cover the intended page/diagram at the requested viewport. Otherwise bind `BLOCKED / NOT_ACCEPTED` and the exact failure reason.

- [ ] **Step 5: Bind raw bytes and exact semantics with mutations**

  The deployment test must read tracked JSON bytes and assert fixed SHA-256, exact candidate head, state order, viewport/theme/page widths, wrapper labels/order/client/scroll widths, interaction index and expected scroll delta, exact unique relation map, exact source order, SVG dimensions, STY-09 zero, diagnostics and every screenshot attempt object. Reject wrong head/hash, duplicate/swapped wrapper, swapped interaction, fabricated self-consistent relation, missing return, changed source, unloaded SVG, truncated log, deleted screenshot attempt and fabricated visual PASS.

- [ ] **Step 6: Run three independent exact-head reviews**

  Review the same implementation/evidence candidate for:

  ```text
  code/spec/security: READY / APPROVE; findings 0
  content/evidence/rights: CONTENT READY; RIGHTS PASS; findings 0
  architecture/invariants: CLEAR / READY; blockers 0
  ```

  Any finding requires scoped RED→GREEN remediation and re-review at a new exact head. A remediation that changes render-affecting bytes requires fresh exact-head Browser evidence; do not call it evidence-only.

- [ ] **Step 7: Bind Stage A verdicts and verify fully**

  Record exact implementation/evidence heads and remediation history in `docs/reviews/g009-batch9.md`. Add mutations for wrong heads, weakened verdict/findings/rights/blockers, stale PENDING final, fabricated deployment and screenshot PASS.

  Run:

  ```bash
  npm run verify
  git diff --check
  ```

  Expected: all tests pass; validate reports audited documents/sources; terminology zero; content, links, reviews, generation, typecheck and production build pass.

- [ ] **Step 8: Commit the Stage A candidate and evidence binding**

  Commit coherent generated/current-fixture changes as the implementation candidate, then commit tracked Browser evidence and exact verdict binding. End with one exact implementation head named by the review, one exact evidence head, and tracked worktree clean.

---

## Task 5: Publish Stage A and capture production evidence

**Files:**
- Create: `docs/reviews/evidence/g009-batch9-stage-a-production-browser.json`
- Modify: `docs/reviews/g009-batch9.md`
- Modify: `tests/g009-batch9-deployment.test.mjs`

**Interfaces:**
- Consumes: Task 4 Stage A READY head and clean verified worktree.
- Produces: fast-forward production publication, exact Pages/HTTP/SVG evidence and Stage A production PASS while backlog remains pending.

- [ ] **Step 1: Perform publication safety preflight**

  Record local HEAD, `origin/main`, merge-base, ahead/behind and tracked status. Require origin to be an ancestor, local behind zero and no unexpected tracked changes. Abort on divergence; never force-push.

- [ ] **Step 2: Push only the reviewed head**

  ```bash
  git push origin HEAD:main
  ```

  Re-read `refs/remotes/origin/main` and require it equals the reviewed head.

- [ ] **Step 3: Observe exact Pages run and jobs**

  Identify the push workflow by exact `headSha`. Require workflow, build job and deploy job all `completed / success`. Do not substitute a later evidence-only run for the implementation run.

- [ ] **Step 4: Probe routes and SVG identity**

  Require HTTP 200 and correct content types for `/`, `/styles`, `/styles/sty-08`, `/styles/sty-05`, `/styles/sty-06`, `/styles/sty-07`, `/cases/erlang-otp-supervision-tree`, `/references` and the SVG. Record SVG bytes/SHA-256 and require exact match to the reviewed asset.

- [ ] **Step 5: Collect production four-state IAB evidence**

  Repeat the exact Task 4 viewport/wrapper/interaction/relation/source/SVG/STY-09/diagnostic contract on production. Direct-open is allowed only for an exact `_blank` href when IAB cannot activate it; record that no physical click occurred. Save tracked JSON at `docs/reviews/evidence/g009-batch9-stage-a-production-browser.json` and record screenshot attempts honestly.

- [ ] **Step 6: Bind production evidence and publish evidence-only commit**

  Add mutations for wrong SHA/run/job, omitted state, wrong wrapper geometry, missing return, changed href/target/rel, SVG mismatch, STY-09 fabrication, truncated diagnostics and visual PASS. Run:

  ```bash
  node --test tests/g009-batch9-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  ```

  Commit and fast-forward push the evidence-only change. Observe its Pages run only in the ignored Task 5 report to avoid recursive tracked evidence commits.

---

## Task 6: Close STY-08 in Stage B

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: five `src/generated/*.json` projections.
- Modify: `docs/reviews/g009-batch9.md`
- Modify: `tests/g009-batch9-deployment.test.mjs`
- Modify: only current projection fixtures surfaced by verification.

**Interfaces:**
- Consumes: exact successful Stage A production evidence and final Stage A verdicts.
- Produces: STY-08 complete, STY-09 sole next/unpublished and local Stage B READY candidate.

- [ ] **Step 1: Write closure RED and immediate-history locks**

  Require one checked STY-08 backlog line with exact Stage A SHA/date/run/jobs/routes/SVG evidence, `61/103/535`, STY-08 published/complete, STY-09 unpublished/pending/non-actionable, Stage B review slots and deployment PENDING. Hash the complete immediate STY-07 backlog suffix and complete Batch 8 review; mutate appended bytes and current STY-09→STY-08.

- [ ] **Step 2: Change only the canonical backlog line**

  Replace exactly one `- [ ] **STY-08` with `- [x] **STY-08` and append exact Stage A closure evidence. Preserve every earlier backlog byte and all later unchecked lines. Do not add an actionable STY-09 link.

- [ ] **Step 3: Regenerate and synchronize current truth**

  ```bash
  npm run generate:content
  npm run check:content
  ```

  Require STY-08 complete and STY-09 unpublished/pending. Update only live/current count, next-topic and adjacency fixtures; preserve Stage A artifacts and all history hashes.

- [ ] **Step 4: Perform bounded cleanup review**

  Search touched files for stale `STY-08 next`, stale Batch labels, masking mutations, duplicate current baselines, dead fallback and misleading messages. Scope current assertions to the prefix before the immutable Batch 8 history marker; scope historical STY-08 assertions inside that marker. Mutations must change current STY-09, not historical STY-08.

- [ ] **Step 5: Run three independent Stage B reviews**

  Require exact-head verdicts with zero findings:

  ```text
  code/spec/security: READY / APPROVE
  content/rights: CONTENT READY / RIGHTS PASS
  architecture/invariants: CLEAR / READY
  ```

  Bind the reviewed remediation head and preserve Stage B deployment as `PENDING / NOT_RUN`.

- [ ] **Step 6: Verify and commit the closure candidate**

  ```bash
  node --test tests/g009-batch8-deployment.test.mjs tests/g009-batch9-deployment.test.mjs
  npm run check:content
  npm run check:reviews
  npm run verify
  git diff --check
  ```

  Expected: all pass; completion 61; audited documents/sources; STY-09 zero actionable. Commit canonical closure/current projections first and exact Stage B verdict binding second. Do not push until the reviewed closure head is final.

---

## Task 7: Publish Stage B and reconcile the repository

**Files:**
- Create: `docs/reviews/evidence/g009-batch9-stage-b-production-browser.json`
- Modify: `docs/reviews/g009-batch9.md`
- Modify: `tests/g009-batch9-deployment.test.mjs`

**Interfaces:**
- Consumes: Task 6 exact Stage B READY head with clean tracked worktree.
- Produces: final production evidence, Stage B SUCCESS/PASS and `HEAD=origin/main` with STY-09 sole next.

- [ ] **Step 1: Repeat fast-forward preflight and push**

  Require remote ancestor, zero behind, expected ahead count and tracked clean. Push `HEAD:main` without force and record the exact deployed closure head.

- [ ] **Step 2: Observe exact closure Pages run/jobs and HTTP routes**

  Bind the push run by exact closure SHA; require workflow/build/deploy completed/success. Probe the same route set and exact SVG identity after deployment.

- [ ] **Step 3: Collect fresh Stage B IAB evidence**

  Do not reuse Stage A JSON or screenshots. Repeat four states, 12 wrapper interactions, 16 relation/H1/return checks, all source checks, required extra-route navigation, STY-09 zero, SVG dimensions and complete diagnostics. Save `docs/reviews/evidence/g009-batch9-stage-b-production-browser.json`; record screenshot outcome honestly.

- [ ] **Step 4: Bind Stage B production evidence with mutations**

  Assert exact closure head/run/jobs/date, routes, SVG bytes/hash, states, interactions, relations, sources, diagnostics and screenshot attempts. Reject reused Stage A head/hash, wrong route totals, missing interaction/return/source, STY-09 fabrication, truncated diagnostics and fabricated visual PASS.

- [ ] **Step 5: Verify and push the evidence-only commit**

  ```bash
  node --test tests/g009-batch9-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  ```

  Commit exact evidence, fast-forward push it and observe its Pages run only in the ignored final report.

- [ ] **Step 6: Reconcile final state**

  Require:

  ```text
  local HEAD == refs/remotes/origin/main
  merge-base(HEAD, origin/main) == HEAD
  ahead/behind == 0/0
  tracked worktree clean
  project status == 61 completed topics / 103 documents / 535 sources
  STY-08 == published/complete
  STY-09 == unpublished/pending/non-actionable and sole next topic
  ```

  Substitute only audited actual document/source counts if generation differs, and record the exact reason in Batch 9 review. Stop local servers without deleting user untracked files.

---

## Final Verification Matrix

| Area | Required evidence |
| --- | --- |
| Content | Exact metadata, eleven headings, five Actor components, same order case, two fixed matrices |
| Semantics | Actor≠thread/consumer/event-driven/microservice; mailbox/supervision/location guarantees bounded |
| Reliability | Six observation points, timeout unknown, idempotency, restart budget, recovery and external-effect stop |
| Diagram | Draw.io/SVG real-port parity, semantic/structural routes, marker/node/boundary geometry, fresh 800px raster |
| Sources | Seven citations, at least four remote domains, one primary, framework-scoped roles, original illustration rights |
| Relations | STY-05/06/07 and Erlang case reciprocal where required; STY-09 zero actionable |
| Projection | Stage A pending and Stage B complete counts generated, never hand-edited |
| Reviews | Exact-head code/content-rights/architecture verdicts with zero findings/blockers |
| Deployment | Exact implementation and closure Pages runs/jobs, route probes, exact SVG identity |
| Browser | Four states, 12 interactions, 16 relations, exact sources, SVG loaded, complete diagnostics |
| History | Complete immediate STY-07 backlog/review hashes and all earlier evidence unchanged |
| Repository | Full verify and diff-check pass; HEAD=origin/main; tracked clean; STY-09 sole next |
