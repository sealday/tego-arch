# STY-10 Microkernel / Plug-in Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-10 Microkernel / Plug-in Architecture 主题页，以订单平台的进程外税费、支付、库存和通知插件解释扩展点、能力兼容、权限、隔离、受控动态激活与失败责任，并完成原创图、来源治理、Stage A/Stage B 审查和线上发布闭环。

**Architecture:** 新页面沿用 `style` 内容契约与 `/styles/sty-10` 路由。正文采用控制面与执行面双平面：控制面管理插件身份、供应链、兼容、权限和生命周期，订单宿主经受控调用网关调用独立插件进程；业务状态、提交和补偿仍由宿主拥有。Stage A 发布 reviewed 页面但保持 STY-10 pending；只有 exact-head Pages、四态 in-app Browser QA 和三类独立审查闭合后，Stage B 才把完成数从 62 推进到 63，并保持 STY-11 unpublished/pending/non-actionable。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages。

## Global Constraints

- 本轮只实现 STY-10；不实现 STY-11，不新增真实插件运行时、市场、签名服务、容器平台、订单示例应用或 npm 依赖。
- 第三方插件默认进程外运行；进程故障边界不得被描述成完整安全沙箱，权限、凭证、网络、文件、资源和租户数据必须分别约束。
- 订单宿主拥有流程、权威状态、结果提交、补偿和人工终态；插件不得直连订单数据库、互相调用或决定自身权限。
- 兼容采用 API 版本范围与能力协商；插件声明不是授权，没有安全交集时必须拒绝激活。
- 税费、支付和库存失败关闭；通知失败降级并进入有界异步补偿。超时结果未知不得盲目重放外部效果。
- 动态激活固定为验证、预热、灰度、排空、卸载；回滚只恢复新请求绑定，不撤销已经发生的外部效果。
- Eclipse、OSGi、HashiCorp 和 VS Code 只承担窄证据角色；不得把单一产品实现推广为全部微内核系统保证。
- 不改变既有 URL、全站视觉 token、生成器或 GitHub Pages 工作流；只在现有 `architectureCaseTopicIds` 中登记 STY-10。
- `src/generated/` 只能由 `npm run generate:content` 更新，不能手工编辑。
- 历史 review、Pages run/job、artifact hash、Browser evidence 与 backlog 历史后缀保持字节不变；只有明确标注 current/latest 的投影断言可推进。
- 所有实现任务遵循 TDD：先观察真实 RED，再写最小实现，运行 GREEN，最后提交；不得弱化 validator、降低几何阈值或用 fallback 掩盖失败。
- 浏览器验证显式使用 in-app Browser；截图不可用或不可信时记录精确三次尝试并标记 `BLOCKED / NOT_ACCEPTED`，不得改用 Chrome、外部 Playwright、旧截图或伪造视觉 PASS。
- 当前基线为 `62 completed / 105 documents / 544 governed sources`。五个全新远程身份和一项原创插图没有现有去重命中，预期 Stage A 为 `62/106/550`，Stage B 为 `63/106/550`；Task 3 必须用 canonical audit 和生成器确认该值，不得为了维持数字制造重复或孤儿来源。

---

## File Map

### New files

- `tests/g009-batch11-content.test.mjs` — STY-10 正文、来源、关系、图示和 Stage A 投影的 mutation-sensitive 契约。
- `tests/g009-batch11-deployment.test.mjs` — Stage A/Stage B 投影、评审、历史锁与生产证据契约。
- `content/styles/sty-10-microkernel-plugin-architecture.mdx` — STY-10 正文。
- `diagrams/sty-10-microkernel-order-plugins.drawio` — 可编辑的订单双平面微内核图。
- `static/img/diagrams/sty-10-microkernel-order-plugins.svg` — 发布 SVG。
- `docs/reviews/g009-batch11.md` — Stage A/Stage B exact-head 审查与发布记录。
- `docs/reviews/evidence/g009-batch11-stage-a-browser.json` — tracked 本地 Stage A 四态 Browser 原始证据。
- `docs/reviews/evidence/g009-batch11-stage-a-production-browser.json` — tracked Stage A 生产 Browser 原始证据。
- `docs/reviews/evidence/g009-batch11-stage-b-production-browser.json` — tracked Stage B 生产 Browser 原始证据。

### Existing files expected to change

- `scripts/content-schema.mjs` — 将 STY-10 加入精确 architecture-case 10-H2 合同。
- `data/source-ledger.json` — 五个远程来源、一项原创插图及 STY-10 文档引用。
- `data/source-link-health.json` — 五个新 remote transport 的健康记录。
- `docs/source-license-inventory.md` — 新来源与原创插图的许可证/版权边界。
- `data/terminology.json` — 登记 Microkernel / Plug-in Architecture 所需的最小首次使用合同；无新术语则不修改。
- `content/styles/sty-04-modular-monolith.mdx` — 先在模块内验证扩展点的可见反向关系。
- `content/styles/sty-05-microservices.mdx` — 插件进程仍受宿主扩展点控制的可见反向关系。
- `content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx` — 插件最小权限和纵深防御入口。
- `content/principles/pr-12-open-closed-interface-segregation.mdx` — 扩展点来自真实变化、接口按消费者内聚的入口。
- `docs/content-backlog.md` — Stage B 仅勾选 STY-10 并记录 exact Stage A 证据，下一项推进为 STY-11。
- `src/generated/content-ledger.json`, `src/generated/project-status.json`, `src/generated/public-source-ledger.json`, `src/generated/topic-indexes.json`, `src/generated/topic-manifest.json` — 生成器实际产生的 Stage A/Stage B current 投影；无 byte diff 的输出不得为凑数修改。
- 当前投影型 `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs`, `tests/g010-*.test.mjs` — 仅更新 latest/current counts、next topic 和新增反向 adjacency；历史 artifact/run/hash 断言保持不变。

---

## Task 1: Lock the failing STY-10 content contract

**Files:**
- Create: `tests/g009-batch11-content.test.mjs`
- Read: `docs/superpowers/specs/2026-08-19-sty-10-microkernel-plugin-architecture-design.md`
- Read: `tests/g009-batch10-content.test.mjs`

**Interfaces:**
- Consumes: current `62/105/544` projection and absent STY-10 article/source/diagram state.
- Produces: exact metadata, headings, wrappers, compatibility matrix, failure ownership, source, relation, diagram and Stage A projection validators used by Tasks 2–4.

- [ ] **Step 1: Define exact constants and reuse proven parsers**

  Create the test with these fixed identities:

  ```js
  import assert from 'node:assert/strict';
  import {readFileSync} from 'node:fs';
  import test from 'node:test';

  export const ARTICLE = 'content/styles/sty-10-microkernel-plugin-architecture.mdx';
  export const DRAWIO = 'diagrams/sty-10-microkernel-order-plugins.drawio';
  export const SVG = 'static/img/diagrams/sty-10-microkernel-order-plugins.svg';
  export const ROUTE = '/styles/sty-10';
  export const TOPIC_ID = 'STY-10';
  export const NEXT_TOPIC = 'STY-11';
  export const EXPECTED_STAGE_A = {completed: 62, documents: 106, sources: 550};
  export const SOURCE_IDS = [
    'src-eclipse-plugin-architecture',
    'src-osgi-core-7-lifecycle',
    'src-osgi-semantic-versioning',
    'src-hashicorp-go-plugin',
    'src-vscode-extension-host',
    'src-atlas-sty10-microkernel-order-plugins',
  ];
  ```

  Copy the proven front-matter parser, Markdown table parser, MDX link extractor, XML parser, SVG cascade/specificity resolver, alpha-composition helper, path parser, marker-envelope transform, glyph-box geometry and later-paint-mask helpers from Batch 10. Preserve actual effective-style and real-terminal calculations; do not replace them with regex-only metadata assertions.

- [ ] **Step 2: Bind exact metadata, headings and three wrappers**

  Deep-equal this metadata object, adding only the final audited `analyzed_at` and `source_cutoff` date if execution begins on a later calendar day:

  ```js
  export const EXACT_METADATA = {
    title: 'Microkernel / Plug-in Architecture：让扩展能力可替换，也让风险止步于边界',
    slug: '/styles/sty-10',
    content_type: 'style',
    status: 'reviewed',
    difficulty: 'advanced',
    analyzed_at: '2026-08-19',
    source_cutoff: '2026-08-19',
    confidence: 'high',
    domains: ['software-architecture', 'platform-engineering', 'application-security'],
    agent_patterns: [],
    protocols: ['grpc'],
    quality_attributes: ['extensibility', 'compatibility', 'security', 'reliability', 'operability', 'maintainability'],
    tags: ['架构风格', 'Microkernel', 'Plug-in Architecture', '扩展点', '能力协商', '插件隔离'],
    summary: '以订单平台宿主和进程外税费、支付、库存、通知插件说明双平面微内核：控制面治理身份、兼容、权限与激活，执行面限制调用和故障，宿主保留业务状态、提交与补偿。',
    topic_id: 'STY-10',
    priority: 'P1',
    depends_on: ['STY-00', 'STY-04', 'STY-05'],
    adjacent_topics: ['STY-04', 'STY-05'],
    related_cases: [],
    related_questions: [],
  };
  ```

  Require the exact ten H2 and three migration H3 headings from the design. Require exactly three wrappers with these labels and exact `role="region"`, `tabIndex={0}`, `onKeyDown={handleHorizontalArrowKey}`:

  ```js
  const WRAPPERS = [
    '订单平台双平面微内核与进程外插件图，可横向滚动',
    '插件能力、兼容、权限与生命周期八维治理矩阵，可横向滚动',
    '插件五类故障检测、响应、停止条件与人工所有者表，可横向滚动',
  ];
  ```

  Add non-no-op deletion and changed-value mutations for every metadata field, heading and wrapper attribute.

- [ ] **Step 3: Bind dual-plane ownership and the eight-row governance matrix**

  Require positive responsibilities and explicit non-ownership for these components:

  ```js
  const COMPONENTS = [
    '插件注册表', '供应链验证器', '策略与权限引擎', '发布控制器',
    '订单微内核宿主', '受控调用网关', '补偿队列',
    '税费插件', '支付插件', '库存插件', '通知插件',
  ];
  const GOVERNANCE_ROWS = [
    '身份与来源', '协议/API', '能力', '依赖',
    '权限', '资源', '数据与结果', '生命周期',
  ];
  ```

  Parse exact columns `维度 | 插件声明 | 宿主/平台门禁 | 不满足时`. Bind each declaration, gate and failure action to its row. Add row deletion, swap, statement/authorization conflation, unknown-capability silent acceptance, permission widening and forced-adapter mutations.

- [ ] **Step 4: Bind invocation, failure and lifecycle contracts**

  Require the eight-step order invocation, minimum data projection, operation ID, idempotency key, deadline, short-lived credential, result schema/size validation and authoritative-result query after uncertain timeout.

  Parse `故障类别 | 检测 | 自动响应 | 停止条件 | 人工所有者` with exact rows:

  ```js
  const FAILURE_ROWS = [
    '版本/能力不兼容',
    '税费/支付/库存超时或失败',
    '通知插件失败',
    '权限、签名或来源异常',
    '资源耗尽或崩溃风暴',
  ];
  const LIFECYCLE = ['验证', '预热', '灰度', '排空', '卸载'];
  ```

  Add per-cell deletion/change mutations plus unlimited retry, critical fail-open, notification fail-closed, blind external-effect replay, missing human owner, in-place hot replacement and rollback-erases-effects mutations.

- [ ] **Step 5: Bind prohibitions, migration, sources and relations**

  Require explicit rejections of plugin database access, plugin-to-plugin calls, self-granted permissions, process-isolation-as-sandbox, hidden business workflow and speculative extension points. Require the six-step migration from ordinary module to in-process contract, manifest/registry and finally process-out RPC only after independent delivery/risk exists.

  Require all six source IDs, exactly five independent remotes, exactly one `manifest_primary` on Eclipse, conservative facts-summary rights and original illustration registration. Require visible reciprocal links from STY-04, STY-05, PR-09 and PR-12; require no actionable `/styles/sty-11`.

- [ ] **Step 6: Bind diagram inventory and physical geometry**

  Use fixed region IDs `control-plane`, `execution-plane`, `plugin-processes`, `authority-boundary`; component IDs matching Step 3; authority nodes `order-store`, `payment-authority`, `inventory-authority`; and semantic edges:

  ```js
  const EDGE_IDS = [
    'register-manifest', 'verify-artifact', 'approve-binding', 'activate-binding',
    'resolve-capability', 'project-order-data',
    'invoke-tax', 'invoke-payment', 'invoke-inventory', 'invoke-notification',
    'commit-order', 'query-payment-result', 'enqueue-notification-compensation',
    'isolate-plugin', 'rollback-binding',
  ];
  ```

  Derive Draw.io endpoints from source/target bounds and normalized ports; compare SVG route points, roles, bounds, line/marker/font styles and paint order. At 800 CSS-pixel render width require node padding `16/14px`, title/type baseline `22px`, text bottom `14px`, label-to-stroke/arrow/node `8/16/12px`, and body/edge text `15px`. Check all semantic/structural/legend intersections, marker footprints, partial collinear overlaps and later paint masks.

- [ ] **Step 7: Run focused tests and commit meaningful RED**

  ```bash
  node --check tests/g009-batch11-content.test.mjs
  node --test tests/g009-batch11-content.test.mjs
  git diff --check
  ```

  Expected: helper/cascade/mutation-fixture tests pass; implementation tests fail only because the STY-10 article, six source records, reciprocal relations, diagram pair and `62/106/550` projection do not exist.

  ```bash
  git add tests/g009-batch11-content.test.mjs
  git commit -m "test: define STY-10 content contract"
  ```

---

## Task 2: Create the synchronized microkernel diagram

**Files:**
- Create: `diagrams/sty-10-microkernel-order-plugins.drawio`
- Create: `static/img/diagrams/sty-10-microkernel-order-plugins.svg`
- Modify: `tests/g009-batch11-content.test.mjs`
- Read: `.codex/skills/creating-drawio-architecture-diagrams/references/layout-and-typography.md`
- Read before integration: `.codex/skills/creating-drawio-architecture-diagrams/references/repository-integration.md`

**Interfaces:**
- Consumes: exact diagram inventory and geometry contract from Task 1.
- Produces: editable Draw.io and published SVG with identical topology and effective styles for Task 3.

- [ ] **Step 1: Read diagram skills and freeze the inventory**

  Read `illustrating-architecture-articles` and `creating-drawio-architecture-diagrams` completely. Record the four regions, fourteen component/authority nodes, fifteen semantic edges, structural containment edges, four legend roles, labels, prohibited implications and exact article/SVG paths in `.superpowers/sdd/task-2-report.md`.

- [ ] **Step 2: Add diagram-specific RED mutations**

  Add non-no-op mutations for missing/changed ports, missing waypoint, injected `sourcePoint`, plugin/database edge, plugin/plugin edge, detached control-plane decision, critical failure sent to compensation queue, notification failure sent to order abort, rollback entering an external effect, legend drift, changed font, opaque label mask, partial overlap and shifted marker into a foreign node/boundary. Run:

  ```bash
  node --test --test-name-pattern='SVG cascade|diagram inventory|Draw.io/SVG diagram' tests/g009-batch11-content.test.mjs
  ```

  Expected: helper fixtures pass and the production diagram test fails because both assets are absent.

- [ ] **Step 3: Author the Draw.io topology with real terminals**

  Use a `2400×3900` authoring canvas so final scale is exactly `800/2400 = 1/3`. Place control plane above execution plane, plugin processes to the right and authority boundary below. Use real `source`/`target` cells, normalized `exitX/exitY/entryX/entryY`, perimeter flags, zero offsets and explicit waypoint arrays. Give control, business calls, external-result queries, compensation and rollback separate corridors; no line may pass through a label band or an unrelated region.

  Use actual edge cells plus terminal anchor vertices for legend keys. All visible text lives in paired editable text vertices; owner node values remain empty or hidden through valid `textOpacity=0`, never duplicated visibly.

- [ ] **Step 4: Export and synchronize the SVG**

  Flatten SVG geometry while retaining stable `data-*` IDs and exact visible text. Match every endpoint, waypoint, stroke, width, dash, arrow marker, label box, font, rounded corner and paint order. Keep SVG `viewBox="0 0 2400 3900"`, yielding an article render of `800×1300` CSS pixels.

- [ ] **Step 5: Run deterministic and visual gates**

  ```bash
  node --test --test-name-pattern='SVG cascade|diagram inventory|Draw.io/SVG diagram' tests/g009-batch11-content.test.mjs
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
    diagrams/sty-10-microkernel-order-plugins.drawio \
    static/img/diagrams/sty-10-microkernel-order-plugins.svg \
    --label 插件注册表 --label 供应链验证器 --label 订单微内核宿主 \
    --label 受控调用网关 --label 税费插件 --label 支付插件 \
    --label 库存插件 --label 通知插件 --label 补偿队列
  npm run check:terminology
  git diff --check
  ```

  Expected: focused tests pass; validator prints `Validated sty-10-microkernel-order-plugins`; terminology reports zero issues. Render at exactly 800px width, inspect the full `800×1300` raster and crops at original size, and record CSS minima and raster SHA. Any label collision, ambiguous arrow, clipping, false database connection or color-only distinction keeps Task 2 RED.

- [ ] **Step 6: Commit the synchronized pair**

  ```bash
  git add diagrams/sty-10-microkernel-order-plugins.drawio \
    static/img/diagrams/sty-10-microkernel-order-plugins.svg \
    tests/g009-batch11-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-10 microkernel diagram"
  ```

---

## Task 3: Write the article, govern sources and close relations

**Files:**
- Create: `content/styles/sty-10-microkernel-plugin-architecture.mdx`
- Modify: `scripts/content-schema.mjs`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Modify only if required: `data/terminology.json`
- Modify: `content/styles/sty-04-modular-monolith.mdx`
- Modify: `content/styles/sty-05-microservices.mdx`
- Modify: `content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx`
- Modify: `content/principles/pr-12-open-closed-interface-segregation.mdx`
- Modify: `tests/g009-batch11-content.test.mjs`

**Interfaces:**
- Consumes: Task 1 content/source/relationship contract and Task 2 SVG path.
- Produces: publishable article and canonical governance data; generated projections remain stale RED for Task 4.

- [ ] **Step 1: Read the writing contract and freeze exact reader-facing structure**

  Read `.codex/skills/writing-architecture-cases/references/article-contract.md` completely. Add `STY-10` to `architectureCaseTopicIds`, preserving `['STY-08', 'STY-09', 'STY-10']`. Fix exact metadata, ten H2s, three H3s and wrapper labels in the test before writing prose. Run focused tests and verify failures point only to missing article/source/relations.

- [ ] **Step 2: Audit and register six exact source identities**

  Register these canonical sources and immutable transport/version seams:

  ```text
  https://www.eclipse.org/articles/Article-Plug-in-architecture/plugin_architecture.html
  https://docs.osgi.org/specification/osgi.core/7.0.0/framework.lifecycle.html
  https://docs.osgi.org/whitepaper/semantic-versioning/040-semantic-versions.html
  https://github.com/hashicorp/go-plugin  @ dd3617ad0257b2e8fe63d5afe805b16a146c3ab9
  https://code.visualstudio.com/api/advanced-topics/extension-host
  /img/diagrams/sty-10-microkernel-order-plugins.svg
  ```

  Use conservative initial rights: Eclipse and VS Code website facts as `LicenseRef-All-Rights-Reserved` unless exact repository evidence proves a narrower applicable license; OSGi pages as `LicenseRef-Proprietary-Standard`; HashiCorp repository as `MPL-2.0` with its exact LICENSE at `dd3617a`; original illustration as `LicenseRef-Atlas-Original`. If exact evidence differs, first update the test to the factual classification and observe RED, then update ledger and inventory; never downgrade accuracy to preserve constants.

  Use existing legal evidence roles: Eclipse `definition` + `historical-context` and sole primary; OSGi lifecycle `runtime-fact`; OSGi versions `method`; HashiCorp `implementation` + `runtime-fact`; VS Code `implementation` + `comparison`; original art `illustration`. Keep `usage_mode=facts-summary` for every remote and no excerpts/adapted diagrams.

- [ ] **Step 3: Write the article and three exact wrappers**

  Implement the ten H2s and three H3s. The opening must state the stable-host/controlled-extension thesis, process-isolation limitation and original order scenario. Wrap only the main diagram, eight-row matrix and five-row failure table with the exact Task 1 labels and keyboard handler. Use evidence cards for version/license seams; keep ownership, failure actions, stop conditions, unsafe recovery and prohibitions in visible prose.

- [ ] **Step 4: Add reciprocal links and terminology**

  Add one concise visible reciprocal paragraph to STY-04, STY-05, PR-09 and PR-12 without changing their existing conclusions. Add only the minimal terminology entries needed for `Microkernel`, `Plug-in Architecture` and `gRPC` first use; if `gRPC` already has a protected/introduced form, reuse it instead of duplicating a term.

- [ ] **Step 5: Run content, rights and relationship gates**

  ```bash
  node --test tests/g009-batch11-content.test.mjs \
    tests/source-ledger.test.mjs tests/content-relations.test.mjs \
    tests/terminology.test.mjs
  npm run validate:content
  npm run check:terminology
  npm run check:links
  npm run typecheck
  npm run build
  node scripts/analyze-architecture-case-density.mjs content/styles/sty-10-microkernel-plugin-architecture.mdx
  git diff --check
  ```

  Expected: article/source/relations/diagram tests pass; the sole planned RED is stale generated projection `62/105/544` versus `62/106/550`. Validation reports 106 documents and 550 sources; terminology zero; density visual-balance strictly greater than 90 with zero warnings.

- [ ] **Step 6: Run local Browser QA and commit**

  Build and serve the exact candidate. Using in-app Browser only, check desktop light/dark `1440×1000` and mobile light/dark `390×844`: no document overflow; SVG `800×1300`; exactly three wrappers; focus, `:focus-visible`, 3px outline and ArrowRight; required links/sources; STY-11 actionable count zero; warning/error/runtime/log events zero with complete pagination. Record functional facts in `.superpowers/sdd/task-3-report.md`; screenshots are not a Task 3 gate.

  ```bash
  git add content/styles/sty-10-microkernel-plugin-architecture.mdx \
    scripts/content-schema.mjs data/source-ledger.json data/source-link-health.json \
    docs/source-license-inventory.md data/terminology.json \
    content/styles/sty-04-modular-monolith.mdx content/styles/sty-05-microservices.mdx \
    content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx \
    content/principles/pr-12-open-closed-interface-segregation.mdx \
    tests/g009-batch11-content.test.mjs
  git diff --cached --check
  git commit -m "docs: add STY-10 microkernel architecture"
  ```

---

## Task 4: Generate Stage A, collect exact evidence and bind independent reviews

**Files:**
- Create: `tests/g009-batch11-deployment.test.mjs`
- Create: `docs/reviews/g009-batch11.md`
- Create: `docs/reviews/evidence/g009-batch11-stage-a-browser.json`
- Modify: generated files changed by `npm run generate:content`
- Modify: current projection fixtures under `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs`, `tests/g010-*.test.mjs`

**Interfaces:**
- Consumes: Task 3 canonical article/source/relations and expected Stage A `62/106/550`.
- Produces: exact implementation candidate, tracked local four-state Browser evidence, three independent Stage A verdicts and final `STAGE_A_ONLY` READY review for Task 5.

- [ ] **Step 1: Write the Stage A deployment contract and observe RED**

  Create constants:

  ```js
  export const EXPECTED_STAGE_A = {completed: 62, documents: 106, sources: 550};
  export const CURRENT_TOPIC = 'STY-10';
  export const NEXT_TOPIC = 'STY-11';
  export const REVIEW = 'docs/reviews/g009-batch11.md';
  export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch11-stage-a-browser.json';
  ```

  Lock the complete immediate STY-09 backlog suffix and `docs/reviews/g009-batch10.md` bytes to fixed SHA-256 values computed from the Task 3 head. Require STY-10 published/pending, STY-11 unpublished/pending/non-actionable, review slots/final PENDING, `STAGE_A_ONLY`, deployment `NOT_RUN`, absent Stage B claims and absent STY-11 implementation.

  ```bash
  node --test tests/g009-batch11-deployment.test.mjs
  ```

  Expected: history locks pass; projection, review and raw evidence fail because generation/evidence are absent.

- [ ] **Step 2: Generate and synchronize current-only fixtures**

  ```bash
  npm run generate:content
  npm run check:content
  node --test tests/g009-batch11-content.test.mjs tests/g009-batch11-deployment.test.mjs
  npm test
  ```

  Require exact `62/106/550`; STY-10 published/pending; STY-11 unpublished/pending/non-actionable. Classify every full-suite failure before editing. Update only current/latest projection, pagination, reciprocal adjacency and reader-facing counts. Split current prefixes from immutable historical suffixes before changing predicates; mutations must alter the current STY-11 value, not a historical STY-10 literal.

- [ ] **Step 3: Create and commit the implementation candidate**

  Create `docs/reviews/g009-batch11.md` with exact artifact bytes/SHA, source count, history hashes, three independent Stage A slots `PENDING`, final `PENDING`, screenshot `NOT_RUN`, scope `STAGE_A_ONLY` and deployment `NOT_RUN`. Do not claim Browser or review success.

  ```bash
  npm run verify
  git diff --check
  git add docs/reviews/g009-batch11.md src/generated tests
  git diff --cached --check
  git commit -m "docs: generate STY-10 Stage A candidate"
  ```

  Record the exact candidate SHA before Browser collection. Any later render-affecting change creates a new candidate and requires fresh Browser evidence.

- [ ] **Step 4: Collect exact candidate IAB evidence**

  Build and serve the exact candidate. Use in-app Browser only. Collect four states in this exact order: `desktopLight`, `desktopDark`, `mobileLight`, `mobileDark`; exact viewports `1440×1000` and `390×844`. For every state record page geometry, exact three wrapper labels/client/scroll widths, focus/`:focus-visible`/3px outline, ArrowRight before/after, four exact relation href→H1→return records, five exact remote href/target/rel records, SVG loaded/intrinsic/rendered dimensions, STY-11 zero, warnings/errors, Runtime/Log events, `hasMore=false`, `truncated=false`.

  Capture exactly three fresh full-page screenshots: desktop light, desktop dark, mobile light. Inspect original bytes. If repeated, cropped, blank or missing diagram coverage, mark each `CAPTURED_REJECTED` and overall `BLOCKED / NOT_ACCEPTED`; do not take a fourth screenshot.

- [ ] **Step 5: Bind raw bytes and semantic mutations**

  Track the JSON at `LOCAL_RAW`. Fix its byte length/SHA and candidate head in the test and review. Parse bytes rather than trusting Markdown counts. Assert exact state order, wrapper labels/geometries, interaction deltas, four relation maps, five source URLs, SVG `2400×3900` intrinsic ratio rendered at `800×1300`, diagnostics and all three screenshot attempts.

  Add non-no-op mutations for wrong head/raw hash, duplicate/swap wrapper, changed client/scroll width, missing focus-visible/outline, changed delta, fabricated relation/H1, changed source, unloaded/resized SVG, STY-11 fabrication, truncated diagnostics, deleted/changed screenshot attempt and visual PASS.

- [ ] **Step 6: Run three independent exact-head reviews**

  Dispatch separate read-only reviewers against the exact implementation candidate and evidence head. Require these exact verdicts:

  ```text
  Code/spec/security: READY / APPROVE, findings 0
  Content/evidence/rights: CONTENT READY, rights PASS, findings 0
  Architecture/invariants: CLEAR / READY, blockers 0
  ```

  Any finding keeps final PENDING. Apply review feedback with TDD, commit a remediation head, recollect Browser evidence if rendered or canonical content changed, and rerun all three reviews on one exact head.

- [ ] **Step 7: Bind Stage A verdicts and verify**

  Update the deployment contract first so the old PENDING review is RED. Then update `docs/reviews/g009-batch11.md` with exact implementation/evidence/review heads, three zero-finding verdicts and final Stage A `READY`. Keep screenshot `BLOCKED / NOT_ACCEPTED`, scope `STAGE_A_ONLY` and deployment `NOT_RUN`.

  ```bash
  node --test tests/g009-batch11-deployment.test.mjs
  npm run verify
  git diff --check
  git add docs/reviews/g009-batch11.md tests/g009-batch11-deployment.test.mjs \
    docs/reviews/evidence/g009-batch11-stage-a-browser.json
  git commit -m "docs: bind STY-10 Stage A verdicts"
  ```

---

## Task 5: Publish Stage A and bind production evidence

**Files:**
- Create: `docs/reviews/evidence/g009-batch11-stage-a-production-browser.json`
- Modify: `docs/reviews/g009-batch11.md`
- Modify: `tests/g009-batch11-deployment.test.mjs`
- Create ignored: `.superpowers/sdd/task-5-report.md`

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

  Require HTTP 200 `text/html` for these nine routes:

  ```text
  /tego-arch/
  /tego-arch/styles
  /tego-arch/styles/sty-04
  /tego-arch/styles/sty-05
  /tego-arch/styles/sty-10
  /tego-arch/principles
  /tego-arch/principles/pr-09
  /tego-arch/principles/pr-12
  /tego-arch/references
  ```

  Require `/tego-arch/img/diagrams/sty-10-microkernel-order-plugins.svg` as HTTP 200 `image/svg+xml`; compare exact bytes and SHA with the reviewed local SVG.

- [ ] **Step 4: Collect fresh production IAB evidence**

  Repeat the Task 4 four-state functional schema against production. Direct-open exact href is acceptable for relation destination verification only when recorded honestly; do not claim physical clicks. Capture exactly three fresh screenshots and inspect originals. Preserve `BLOCKED / NOT_ACCEPTED` if they do not cover the full article and diagram.

- [ ] **Step 5: TDD-bind production identity and semantics**

  Add RED assertions for missing production review/raw. Then bind exact implementation head, run/build/deploy IDs, nine routes, SVG bytes/SHA, 4 states, 12 interactions, 16 relation checks, 20 source checks, SVG dimensions, STY-11 zero, diagnostics and three screenshot attempts. Add semantic and additive mutations for every group plus fabricated deployment/visual PASS.

- [ ] **Step 6: Verify, commit and publish evidence only**

  ```bash
  node --test tests/g009-batch11-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  git add docs/reviews/evidence/g009-batch11-stage-a-production-browser.json \
    docs/reviews/g009-batch11.md tests/g009-batch11-deployment.test.mjs
  git diff --cached --check
  git commit -m "docs(g009): record STY-10 Stage A production evidence"
  git fetch origin
  git merge-base --is-ancestor origin/main HEAD
  git push origin HEAD:main
  ```

  Observe the evidence commit's own Pages run/build/deploy success in the ignored report only. Final state must be `HEAD=origin/main=merge-base`, ahead/behind `0/0`, clean. Do not touch backlog, generated projection, Stage B or STY-11.

---

## Task 6: Close Stage B and bind independent verdicts

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch11.md`
- Modify: `src/generated/project-status.json`
- Modify: `src/generated/topic-indexes.json`
- Modify: `src/generated/topic-manifest.json`
- Modify: `tests/g009-batch11-deployment.test.mjs`
- Modify current-projection fixtures discovered by the full suite only
- Create ignored: `.superpowers/sdd/task-6-report.md`

**Interfaces:**
- Consumes: exact Task 5 Stage A production evidence.
- Produces: reviewed local Stage B READY head at `63 / 106 / 550`; no push or deployment.

- [ ] **Step 1: Write the closure contract and capture RED**

  Extend the Batch 11 deployment test to require exactly one newly checked STY-10 backlog item, exact Stage A implementation/run/route/SVG evidence, `63` completed topics, `106` documents and `550` governed sources. Require STY-10 `published/complete`, STY-11 `unpublished/pending/nonactionable`, and STY-11 as the sole next topic.

  Lock exact bytes and SHA-256 for the complete immediate STY-09 backlog suffix, Batch 10 review, STY-10 article, source ledger, Draw.io/SVG pair, local Stage A raw and Stage A production raw. Add non-no-op mutations for each identity and for stale current `next=STY-10` masking. Require all Stage B review slots, final readiness and deployment to remain `PENDING / NOT_RUN` before review.

  ```bash
  node --test tests/g009-batch10-deployment.test.mjs \
    tests/g009-batch11-deployment.test.mjs
  ```

  Expected RED: STY-10 is unchecked, the projection is `62 / 106 / 550`, and the Stage B section is absent or pending.

- [ ] **Step 2: Close only STY-10 and regenerate current truth**

  Check exactly the STY-10 backlog line and attach the exact Task 5 production identity. Update only STY-10's current review/projection state; do not alter STY-09 history or STY-11 content. Generate the projection:

  ```bash
  npm run generate:content
  npm run check:content
  node --test tests/g009-batch10-deployment.test.mjs \
    tests/g009-batch11-deployment.test.mjs
  npm test
  ```

  Mechanically synchronize only fixtures that explicitly model current live truth. Split current prefixes from immutable historical suffixes before changing expectations. Current stale-next mutations must change STY-11 to STY-10 and fail the current predicate; historical STY-10 assertions must stay inside explicit Batch 10 history.

- [ ] **Step 3: Verify and commit the pending closure candidate**

  ```bash
  npm run verify
  git diff --check
  git add docs/content-backlog.md docs/reviews/g009-batch11.md \
    src/generated tests
  git diff --cached --check
  git commit -m "docs: close STY-10 Stage B candidate"
  ```

  Require the tracked tree clean. The candidate review must still say Stage B code/content/architecture/final `PENDING` and deployment `PENDING / NOT_RUN`.

- [ ] **Step 4: Run three independent exact-head closure reviews**

  Reviewers inspect the exact pending candidate and return:

  1. code/spec/security: `READY / APPROVE`, findings `0`;
  2. content/evidence/rights: `CONTENT READY`, rights `PASS`, findings `0`;
  3. architecture/invariants: `CLEAR / READY`, blockers `0`.

  Any finding reopens implementation, requires a new exact candidate head and all three reviews rerun. Reviewers must verify `63 / 106 / 550`, STY-11 as sole unpublished/pending/nonactionable next item, Stage A byte identities, history locks, and absence of fabricated Stage B deployment.

- [ ] **Step 5: Bind verdicts and create the local Stage B READY head**

  First change the deployment contract to exact reviewed head and exact verdicts so the pending document is RED. Then update the review to record the three verdicts and `Final Stage B readiness: READY`, while retaining `Deployment status: PENDING / NOT_RUN` and screenshot `BLOCKED / NOT_ACCEPTED` where applicable. Add mutations for wrong head, weakened verdicts/findings/rights/blockers, stale PENDING, scope drift, fabricated deployment and visual PASS.

  ```bash
  node --test tests/g009-batch11-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  git add docs/reviews/g009-batch11.md tests/g009-batch11-deployment.test.mjs
  git diff --cached --check
  git commit -m "docs: bind STY-10 Stage B verdicts"
  ```

  Stop with a clean local READY head. Do not push, deploy, create STY-11 or claim Stage B production success.

---

## Task 7: Publish Stage B and bind final production evidence

**Files:**
- Create: `docs/reviews/evidence/g009-batch11-stage-b-production-browser.json`
- Modify: `docs/reviews/g009-batch11.md`
- Modify: `tests/g009-batch11-deployment.test.mjs`
- Create ignored: `.superpowers/sdd/task-7-report.md`
- Create ignored: `.superpowers/sdd/sty10-task7-final-publish-report.md`

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

  Bind the exact push Pages run whose `headSha` is the Stage B READY head. Require run, build and deploy `completed/success`. Probe the same nine HTML routes and exact SVG identity from Task 5. Verify production projection `63 / 106 / 550`, STY-10 complete and STY-11 absent from actionable UI.

- [ ] **Step 3: Collect fresh Stage B IAB evidence**

  Do not reuse Stage A raw, screenshots or Browser state. Select the in-app Browser explicitly and collect four exact viewport/theme states, 12 wrapper interactions, 16 relation destination/H1/returns, 20 source href/target/rel checks, SVG intrinsic/rendered dimensions, STY-11 zero, and complete empty logs/runtime diagnostics. Capture exactly three fresh full-page screenshots and inspect original bytes; record `BLOCKED / NOT_ACCEPTED` if coverage repeats or omits the diagram. Do not fall back to Chrome or external Playwright.

- [ ] **Step 4: TDD-bind the closed production contract**

  Add RED assertions for the missing Stage B raw/review section. Bind exact implementation head, Pages run/build/deploy IDs, routes, SVG bytes/SHA, projection, Browser schema and exactly three screenshot attempts. Add non-no-op semantic/additive mutations for every group, including fabricated success, visual PASS, duplicate/displaced readiness lines and altered screenshot attempts.

  ```bash
  node --test tests/g009-batch11-deployment.test.mjs
  npm run check:reviews
  npm run verify
  git diff --check
  ```

- [ ] **Step 5: Commit exactly the evidence closure and publish it**

  ```bash
  git add docs/reviews/evidence/g009-batch11-stage-b-production-browser.json \
    docs/reviews/g009-batch11.md tests/g009-batch11-deployment.test.mjs
  git diff --cached --check
  git commit -m "docs(g009): record STY-10 Stage B production evidence"
  git fetch origin
  git merge-base --is-ancestor origin/main HEAD
  git push origin HEAD:main
  ```

  Observe the evidence commit's own Pages run/build/deploy success only in the ignored reports. Final fetch must prove `HEAD=origin/main=merge-base`, ahead/behind `0/0`, tracked and untracked status clean. Do not touch the backlog, generated projection, content, rights records or STY-11.

---

## Final Review Gate

- [ ] **Run the complete repository verification on the final evidence head**

  ```bash
  npm run verify
  node --test tests/g009-batch11-content.test.mjs \
    tests/g009-batch11-deployment.test.mjs
  node scripts/validate_drawio_svg.mjs \
    diagrams/sty-10-microkernel-order-plugins.drawio \
    static/img/diagrams/sty-10-microkernel-order-plugins.svg
  node scripts/check-content-density.mjs content/styles/sty-10-microkernel-plugin-architecture.mdx
  git diff --check
  git fetch origin
  git rev-list --left-right --count origin/main...HEAD
  git status --short
  ```

- [ ] **Perform a read-only end-to-end audit**

  Audit the design parent through the final evidence head. Require zero code/spec/security, content/evidence/rights and architecture/invariant findings. Confirm every design section is implemented and mutation-bound: exact metadata/headings, three wrappers, dual-plane controls and execution, out-of-process trust boundary, capability negotiation, asymmetric failure policy, lifecycle sequence, governance/failure tables, prohibitions/migration, source rights, editable diagram parity, responsive keyboard behavior, Stage A/B identities and honest screenshot status.

- [ ] **Accept completion only when all release invariants hold**

  Require the full repository suite to pass with no skipped failure, projection exactly `63 / 106 / 550`, STY-10 `published/complete`, STY-11 `unpublished/pending/nonactionable` and absent from actionable UI. Require implementation and evidence Pages runs successful, production routes/SVG exact, `HEAD=origin/main=merge-base`, ahead/behind `0/0`, and a completely clean worktree. Any failure reopens the owning task; do not waive it in the report.
