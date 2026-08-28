# STY-12 Micro-Frontend Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-12 Micro-Frontend 架构决策页，以电商前台说明独立交付、运行时组合、后端权威状态、最小共享依赖、原子清单和有限故障隔离，并完成原创 Draw.io/SVG、来源治理、Stage A/Stage B 评审与线上发布闭环。

**Architecture:** 商品、购物车、结算和账户切片独立交付；薄 Shell 只解析顶层路由、版本化清单和槽位，权威业务状态与逐请求授权留在后端。发布控制面验证不可变制品与完整候选清单后原子提升或回滚；同页错误边界只提供切片级降级，不宣称主线程、DOM、同源存储或网络会话隔离。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages、in-app Browser。

## Global Constraints

- 本轮只实现 STY-12；STY-13 保持 unpublished、pending、non-actionable，正文与 Browser accepted actions 中 actionable count 必须为 `0`。
- 不创建真实电商应用、前端框架、制品仓库、签名服务、灰度平台、授权系统或 npm 依赖。
- 购物车、订单、商品和账户真相留在后端；切片只传稳定 ID、预期版本和幂等键，不共享写入全局 Store。
- Shell 只拥有身份上下文、顶层路由、清单、槽位、系统级观测和恢复入口；后端逐请求认证、授权并校验业务不变量。
- 制品不可变；清单是完整、版本化、可审计的提升与回滚单位；生产不得自动解析 `latest` 或拼接未知组合。
- 公共运行时采用最小共享；领域模型、可变业务状态和跨域写入不进入公共层。
- 浏览器同页组合只能隔离制品、发布、槽位、降级和责任，不能自动隔离主线程、DOM、全局 CSS、同源存储或网络会话。
- 主图格式固定为 `Draw.io + SVG`，必须使用 `creating-drawio-architecture-diagrams`；不得复制外部构图、Logo、水印或品牌视觉。
- Stage A 发布页面但 STY-12 仍 pending；Stage B 只有 exact-head Pages、四态 in-app Browser QA 和三类终审闭合后才推进 completed `64 → 65`。
- 当前主工作区 STY-05 图示、Batch 6 测试、`.codex/config.toml` 与 `.pi-subagents/` 属于用户 WIP，所有实现只在 `/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch13` 进行。

## File Map

- Create `content/styles/sty-12-micro-frontend-architecture.mdx` — reader-facing decision guide and exact ten-H2 contract.
- Create `diagrams/sty-12-micro-frontend-commerce-runtime.drawio` — editable three-plane architecture source.
- Create `static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg` — accessible responsive publication asset.
- Create `tests/g009-batch13-content.test.mjs` — article, source, relation, diagram, geometry and mutation contracts.
- Create `tests/g009-batch13-deployment.test.mjs` — Stage A/Stage B exact-head evidence, projection, Browser and immutable-history contracts.
- Create `docs/reviews/g009-batch13.md` and Stage A/Stage B Browser JSON files — truthful review and production evidence.
- Modify `scripts/content-schema.mjs` — register STY-12 in the exact architecture-case heading contract.
- Modify `data/source-ledger.json`, `data/source-link-health.json`, `data/source-copyright-review.json` — four new standards sources, reused Micro-Frontend sources and original SVG provenance.
- Modify `data/terminology.json` only if the checker proves Micro-Frontend, Import Map, SRI or CSP lacks an executable first-use contract.
- Modify `content/styles/sty-03-vertical-slice-architecture.mdx`, `content/styles/sty-10-microkernel-plugin-architecture.mdx`, `content/cases/micro-frontends-single-spa.mdx` — precise reciprocal STY-12 links.
- Modify generated files under `src/generated/` only via `npm run generate:content`.
- Modify current-projection tests only where RED output proves a stale current count, next topic or published adjacency; never weaken historical hashes, run IDs or artifact identities.

---

### Task 1: Establish the STY-12 Contract in Failing Tests

**Files:**
- Create: `tests/g009-batch13-content.test.mjs`
- Modify: `scripts/content-schema.mjs:135`

**Interfaces:**
- Consumes: generic XML, Markdown, source-ledger and geometry helpers from `tests/g009-batch12-content.test.mjs`.
- Produces: exported STY-12 paths, metadata, table rows, diagram identities and `architectureCaseTopicIds.has('STY-12')` for every later task.

- [ ] **Step 1: Copy the proven harness and replace the public contract**

Run:

```bash
cp tests/g009-batch12-content.test.mjs tests/g009-batch13-content.test.mjs
```

Replace the STY-11 contract constants and article assertion with these exact values; retain generic XML/geometry helpers unchanged:

```js
export const ARTICLE = 'content/styles/sty-12-micro-frontend-architecture.mdx';
export const DRAWIO = 'diagrams/sty-12-micro-frontend-commerce-runtime.drawio';
export const SVG = 'static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg';
export const ROUTE = '/styles/sty-12';
export const TOPIC_ID = 'STY-12';
export const NEXT_TOPIC = 'STY-13';
export const RELATED_CASE = '/cases/micro-frontends-single-spa';
export const EXPECTED_STAGE_A = Object.freeze({completed: 64, documents: 108, sources: 565});
export const EXPECTED_HEADINGS = Object.freeze([
  '学习问题', '一页摘要', '事实边界', '架构图', '运行时组合与发布流',
  '关键机制导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源',
]);
export const MIGRATION_HEADINGS = Object.freeze(['可直接复用的机制', '只能有限类比的部分', '不应照搬的部分']);
export const WRAPPERS = Object.freeze([
  'Micro-Frontend 电商运行时、发布与权威状态边界图，可横向滚动',
  'Micro-Frontend 五种组合方式决策表，可横向滚动',
  'Micro-Frontend 构件所有权矩阵，可横向滚动',
  'Micro-Frontend 六类故障检测、降级与恢复表，可横向滚动',
]);
export const EXACT_METADATA = Object.freeze({
  title: 'Micro-Frontend：用独立交付证明运行时拆分', slug: ROUTE,
  content_type: 'style', status: 'reviewed', difficulty: 'advanced',
  analyzed_at: '2026-08-26', source_cutoff: '2026-08-26', confidence: 'high',
  domains: ['software-architecture', 'frontend-architecture', 'platform-engineering'],
  agent_patterns: [], protocols: ['https', 'es-modules'],
  quality_attributes: ['deployability', 'modularity', 'reliability', 'operability', 'security', 'performance'],
  tags: ['架构风格', 'Micro-Frontend', '运行时组合', '独立部署', '共享依赖', '故障隔离'],
  summary: '以商品、购物车、结算和账户切片说明 Micro-Frontend：薄 Shell 通过完整版本化清单组合不可变制品，业务真相与授权留在后端，公共运行时保持最小，同页错误只做有限降级。',
  topic_id: TOPIC_ID, priority: 'P1', depends_on: ['STY-00', 'STY-03', 'STY-04'],
  adjacent_topics: ['STY-03', 'STY-10'], related_cases: [RELATED_CASE], related_questions: [],
});
export const SOURCE_IDS = Object.freeze([
  'src-martinfowler-0ec749cd01b8', 'src-single-spa-03f49f2c5ddb',
  'src-single-spa-f1207fc2c485', 'src-whatwg-html-import-maps',
  'src-w3c-subresource-integrity', 'src-w3c-content-security-policy-3',
  'src-w3c-long-tasks-api', 'src-atlas-sty12-micro-frontend-commerce-runtime',
]);
```

Define exact decision data:

```js
export const COMPOSITION_ROWS = Object.freeze([
  ['模块化前端单体', '单一团队或统一发布节奏', '构建时', '最低', '独立上线成为持续瓶颈'],
  ['构建时包组合', '代码边界稳定但无需独立上线', '构建时', '低', '仍需整体重建发布'],
  ['浏览器运行时组合', '多个稳定业务团队确需独立交付', '浏览器', '高', '共享运行时与同页故障成本失控'],
  ['服务端组合', '首屏与边缘装配优先', '服务端或边缘', '高', '片段合同与缓存协调失控'],
  ['跨源 iframe', '安全或运行时隔离是硬要求', '浏览器隔离上下文', '最高', '体验、通信和可访问性成本不可接受'],
]);
export const OWNER_ROWS = Object.freeze([
  ['Shell', '顶层路由、完整清单、槽位、系统恢复入口', '领域规则、业务真相、跨域授权'],
  ['业务切片', '私有 DOM、内部路由、公开入口、流水线与值班', '其他切片私有状态与发布'],
  ['公共运行时', '少量高收益依赖与兼容矩阵', '领域模型、可变全局状态、跨域写入'],
  ['发布控制面', '不可变制品校验、候选清单、原子提升与回滚', '运行时猜测版本、业务终态'],
  ['权威业务面', '逐请求授权、不变量、购物车与订单事实', '浏览器挂载与展示状态'],
]);
export const FAILURE_ROWS = Object.freeze([
  ['清单无效', '真实性、内容身份或结构校验', '保留上一已知可用清单', '阻止候选提升', '发布控制面'],
  ['制品加载失败', '网络、超时、完整性错误', '只降级对应槽位', '回退清单或离开旅程', '切片团队'],
  ['挂载或运行失败', '错误边界与长任务信号', '清理槽位并限制重试', '持续失败时回退', '切片团队'],
  ['合同不兼容', '公开入口与兼容范围', '拒绝未知组合', '回退整份清单', '平台与切片共同负责'],
  ['后端结果不确定', '订单 ID、幂等键与权威查询', '显示待确认而非重放', '进入人工终态', '业务域团队'],
  ['全局资源争用', '主线程、内存、CSS 与同源资源', '停止非关键切片并降级', '改用更强隔离或合并切片', '平台与责任切片'],
]);
export const REGION_IDS = Object.freeze(['release-control-plane', 'browser-runtime-plane', 'authority-business-plane']);
export const NODE_IDS = Object.freeze([
  'catalog-pipeline', 'cart-pipeline', 'checkout-pipeline', 'account-pipeline',
  'immutable-artifacts', 'compatibility-gate', 'versioned-manifest', 'atomic-promotion',
  'shell', 'top-router', 'catalog-slice', 'cart-slice', 'checkout-slice', 'account-slice',
  'shared-runtime', 'slice-fallback', 'catalog-api', 'cart-api', 'order-api', 'account-api',
]);
export const LEGEND_ROLES = Object.freeze(['release', 'resolve', 'business', 'recovery']);
export const NOTE_COPY = Object.freeze({
  'authority-note': '稳定 ID 跨切片；业务真相留在后端',
  'isolation-warning': '非隔离边界：主线程、DOM、全局 CSS、同源存储与网络会话',
  'auth-warning': '切片已挂载 ≠ 已获业务权限',
});
```

- [ ] **Step 2: Register STY-12 in the schema and run RED**

Change:

```js
export const architectureCaseTopicIds = new Set(['STY-08', 'STY-09', 'STY-10', 'STY-11', 'STY-12']);
```

Run:

```bash
node --test tests/g009-batch13-content.test.mjs
```

Expected: FAIL because the article, Draw.io and SVG do not exist; the failure must name `content/styles/sty-12-micro-frontend-architecture.mdx` first, not a syntax or helper error.

- [ ] **Step 3: Commit the executable RED contract**

```bash
git add tests/g009-batch13-content.test.mjs scripts/content-schema.mjs
git commit -m "test(g009): define STY-12 micro-frontend contract"
```

---

### Task 2: Implement the Article, Governed Sources and Reciprocal Relations

**Files:**
- Create: `content/styles/sty-12-micro-frontend-architecture.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `data/source-copyright-review.json`
- Modify if required by an actual checker failure: `data/terminology.json`
- Modify: `content/styles/sty-03-vertical-slice-architecture.mdx`
- Modify: `content/styles/sty-10-microkernel-plugin-architecture.mdx`
- Modify: `content/cases/micro-frontends-single-spa.mdx`
- Test: `tests/g009-batch13-content.test.mjs`

**Interfaces:**
- Consumes: exact constants from Task 1 and the approved design at `docs/superpowers/specs/2026-08-26-sty-12-micro-frontend-architecture-design.md`.
- Produces: one valid architecture-case MDX document, eight ordered citations, one sole eligible primary, four wrappers and three reciprocal links.

- [ ] **Step 1: Add exact frontmatter and section skeleton**

Create the MDX with `EXACT_METADATA`, the standard imports, and this exact visible structure:

```mdx
import SourceLedger from '@site/src/components/SourceLedger';
import {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

# Micro-Frontend：用独立交付证明运行时拆分

## 学习问题
## 一页摘要
## 事实边界
## 架构图
## 运行时组合与发布流
## 关键机制导读
## 架构决策与权衡
## 生产化分析
## 可迁移经验
### 可直接复用的机制
### 只能有限类比的部分
### 不应照搬的部分
## 来源

<SourceLedger />
```

The diagram wrapper must use this exact structure; use the same four attributes with the other three exact `WRAPPERS` values around their corresponding tables:

```mdx
<div role="region" aria-label="Micro-Frontend 电商运行时、发布与权威状态边界图，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>
  <img src="/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg" alt="Micro-Frontend 电商运行时、发布与权威状态边界" />
</div>
```

- [ ] **Step 2: Write the decision guide against exact affirmative contracts**

Include these sentences verbatim so mutation tests lock the intended boundary:

```text
购物车和订单真相留在权威后端；切片之间只交换稳定标识、预期版本和幂等键。
Shell 只解析顶层路由、完整版本化清单和挂载槽位，不拥有商品、购物车、结算或账户规则。
候选发布以整份清单原子提升或回滚；生产 Shell 不解析漂移的 latest，也不拼接未知组合。
公共运行时只共享体积收益明确、兼容策略成熟且维护者清晰的依赖；领域模型与可变业务状态不进入公共层。
错误边界可以限制槽位影响，但同一主线程、DOM、全局 CSS、同源存储和网络会话不构成安全沙箱。
切片挂载成功只说明界面生命周期完成，不代表后端授权通过。
网络超时不等于订单失败；结算切片用订单 ID 或幂等键查询权威结果，无法判定时进入待确认或人工终态。
若只有一个小团队、一个优先级和一个发布节奏，模块化前端单体通常拥有更低的组合、测试、安全和治理成本。
```

Render `COMPOSITION_ROWS`, `OWNER_ROWS` and `FAILURE_ROWS` exactly; do not add a fourth table or fifth wrapper.

- [ ] **Step 3: Register exact source governance**

Reuse the first three existing source IDs. Add these records with `registered_at` and review timestamps `2026-08-26`, conservative factual use, and no quotation:

```js
const NEW_REMOTE_SOURCES = {
  'src-whatwg-html-import-maps': {
    canonical_locator: 'https://html.spec.whatwg.org/multipage/webappapis.html#import-maps',
    title: 'HTML Standard — Import maps', author_or_org: 'WHATWG',
    version: 'Living Standard; checked 2026-08-26', license: 'CC-BY-4.0',
    copyright_policy: 'facts-and-short-quotation',
    roles: ['definition', 'mechanism'],
    usage_boundary: 'Supports import-map module-specifier resolution, scopes and integrity metadata only; it does not prove atomic release, rollback, team autonomy or application compatibility.',
  },
  'src-w3c-subresource-integrity': {
    canonical_locator: 'https://www.w3.org/TR/SRI/', title: 'Subresource Integrity', author_or_org: 'W3C',
    version: 'Latest published specification; checked 2026-08-26', license: 'LicenseRef-Proprietary-Standard',
    copyright_policy: 'facts-and-short-quotation',
    roles: ['security', 'mechanism'],
    usage_boundary: 'Supports digest-based subresource response verification and failure handling only; it does not authenticate a release approver or make a manifest atomic.',
  },
  'src-w3c-content-security-policy-3': {
    canonical_locator: 'https://www.w3.org/TR/CSP3/', title: 'Content Security Policy Level 3', author_or_org: 'W3C',
    version: 'Working Draft 5 May 2026', license: 'LicenseRef-Proprietary-Standard',
    copyright_policy: 'facts-and-short-quotation', roles: ['security'],
    usage_boundary: 'Supports browser resource and execution policy as defense in depth only; it is not a replacement for input validation, backend authorization or origin isolation.',
  },
  'src-w3c-long-tasks-api': {
    canonical_locator: 'https://www.w3.org/TR/longtasks-1/', title: 'Long Tasks API', author_or_org: 'W3C',
    version: 'Latest published specification; checked 2026-08-26', license: 'LicenseRef-Proprietary-Standard',
    copyright_policy: 'facts-and-short-quotation',
    roles: ['observability', 'mechanism'],
    usage_boundary: 'Supports observing tasks above the specified long-task threshold and bounded attribution only; it does not isolate the main thread or prove which business slice caused every delay.',
  },
};
```

Register `src-atlas-sty12-micro-frontend-commerce-runtime` as a self-authored `image/svg+xml` source for the final SVG. In the STY-12 document citation list, preserve `SOURCE_IDS` order and set only `src-single-spa-03f49f2c5ddb` to `manifest_primary: true`. Update link-health with one policy-accepted current attempt per new remote source and update copyright review without changing reused source identities.

- [ ] **Step 4: Add precise reciprocal links**

Add one visible sentence to each page:

```md
[Micro-Frontend 架构决策](/styles/sty-12)继续判断垂直业务边界何时需要浏览器运行时独立交付；本页只负责代码变化边界，不把切片自动提升为部署或故障边界。
```

```md
[Micro-Frontend 架构决策](/styles/sty-12)比较薄 Shell 与独立业务切片；它与插件宿主都治理版本和生命周期，但同页切片共享浏览器资源，不能复用本文的进程隔离结论。
```

```md
[Micro-Frontend 架构决策](/styles/sty-12)把本案例的运行时机制放回采用门槛、完整清单、后端权威状态和退出条件中；本案例仍只证明 single-spa 固定证据范围内的生命周期行为。
```

Also add reciprocal `STY-12` metadata only where the content schema requires the published adjacency; never add STY-13.

- [ ] **Step 5: Run focused GREEN checks and commit**

```bash
node --test tests/g009-batch13-content.test.mjs
npm run check:content
npm run check:links
npm run check:terminology
```

Expected: article/source/relation/table assertions pass; diagram assertions remain the only expected failures. `check:terminology` must report `0 issues`; edit `data/terminology.json` only in response to a named missing or malformed term.

```bash
git add content/styles/sty-12-micro-frontend-architecture.mdx content/styles/sty-03-vertical-slice-architecture.mdx content/styles/sty-10-microkernel-plugin-architecture.mdx content/cases/micro-frontends-single-spa.mdx data/source-ledger.json data/source-link-health.json data/source-copyright-review.json data/terminology.json tests/g009-batch13-content.test.mjs
git commit -m "docs: add STY-12 micro-frontend decision guide"
```

---

### Task 3: Create and Prove the Draw.io/SVG Architecture Asset

**Files:**
- Create: `diagrams/sty-12-micro-frontend-commerce-runtime.drawio`
- Create: `static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg`
- Modify: `content/styles/sty-12-micro-frontend-architecture.mdx`
- Test: `tests/g009-batch13-content.test.mjs`

**Interfaces:**
- Consumes: `REGION_IDS`, `NODE_IDS`, `LEGEND_ROLES`, `NOTE_COPY` and the three-plane semantics from Task 1.
- Produces: one accessible exact-pair Draw.io/SVG asset with stable `data-region-id`, `data-node-id`, `data-edge-id` and `data-legend-role` identities.

- [ ] **Step 1: Invoke the required diagram workflow and extend the RED inventory**

Use `creating-drawio-architecture-diagrams` before editing either asset. Add this exact edge identity set and one endpoint/role contract per identity:

```js
export const EDGE_IDS = Object.freeze([
  'catalog-release', 'cart-release', 'checkout-release', 'account-release',
  'store-artifacts', 'validate-candidate', 'publish-manifest', 'promote-manifest',
  'resolve-manifest', 'route-control', 'activate-catalog', 'activate-cart',
  'activate-checkout', 'activate-account', 'share-runtime-catalog', 'share-runtime-cart',
  'share-runtime-checkout', 'share-runtime-account', 'checkout-read-cart',
  'checkout-submit-order', 'catalog-query', 'cart-query', 'account-query',
  'load-failure', 'rollback-manifest', 'return-catalog', 'return-cart-version',
  'return-order-id', 'return-account',
]);
```

The four `*-release`, `store-artifacts`, `validate-candidate`, `publish-manifest` and `promote-manifest` edges use role `release`; `resolve-manifest`, `route-control`, four `activate-*` and four `share-runtime-*` edges use `resolve`; five `*-query`/`checkout-*` requests and four `return-*` paths use `business`; `load-failure` and `rollback-manifest` use `recovery`. Tests must bind every edge to the named source/target node and reject duplicate, hidden or dangling paths.

Run:

```bash
node --test tests/g009-batch13-content.test.mjs
```

Expected: FAIL on missing exact edge/label inventory.

- [ ] **Step 2: Build synchronized editable and published assets**

Use a `2400 × 3600` viewBox and three vertically stacked regions. Every node must be a direct child of its declared region wrapper; every visible edge must have real source/target terminals in Draw.io and the matching stable endpoints in SVG. Use four color-independent line styles for `release`, `resolve`, `business`, and `recovery`; use marker shapes plus dash patterns, not color alone. Put `NOTE_COPY.isolation-warning` in a bordered warning band around the browser plane, and keep `authority-note` next to stable-ID business edges.

The SVG root must include:

```xml
<title>Micro-Frontend 电商运行时、发布与权威状态边界</title>
<desc>四条独立流水线生成不可变制品，兼容门禁产生完整版本化清单并原子提升；薄 Shell 在共享浏览器环境加载商品、购物车、结算和账户切片，稳定标识连接权威后端，失败只降级对应槽位并可回退整份清单。</desc>
```

Use `width="100%"`, omit a fixed rendered height, preserve `viewBox="0 0 2400 3600"`, and include no embedded HTML, image, script, external font, Logo or watermark.

- [ ] **Step 3: Prove geometry at article width**

Rasterize the SVG at 800 CSS pixels wide and make tests require at least: 12px node-to-region padding, 8px visible glyph-to-stroke/marker clearance, 12px edge-label-to-node clearance, 16px legend caption/marker clearance, no positive collinear connector overlap, no connector crossing an unrelated node, and no later-painted mask over a semantic route. Inspect the raster at original size and record text, topology, arrows, labels, legend, warning band, crop and color-independent PASS.

Run:

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/sty-12-micro-frontend-commerce-runtime.drawio \
  static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg
node --test tests/g009-batch13-content.test.mjs
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs \
  content/styles/sty-12-micro-frontend-architecture.mdx
```

Expected: diagram pair PASS; focused tests PASS; density visual-balance strictly greater than `90` with `0 warnings`.

- [ ] **Step 4: Commit the publication asset**

```bash
git add diagrams/sty-12-micro-frontend-commerce-runtime.drawio static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg content/styles/sty-12-micro-frontend-architecture.mdx tests/g009-batch13-content.test.mjs data/source-ledger.json data/source-copyright-review.json
git commit -m "docs: illustrate STY-12 runtime composition"
```

---

### Task 4: Generate Stage A Projection and Close Repository Regressions

**Files:**
- Modify: `src/generated/content-ledger.json`
- Modify: `src/generated/project-status.json`
- Modify: `src/generated/public-source-ledger.json`
- Modify: `src/generated/topic-indexes.json`
- Modify: `src/generated/topic-manifest.json`
- Modify only RED-proven current fixtures: `tests/g008-*.test.mjs`, `tests/g009-*.test.mjs`, `tests/g010-*.test.mjs`
- Test: `tests/g009-batch13-content.test.mjs`

**Interfaces:**
- Consumes: complete STY-12 content, source and relation graph.
- Produces: Stage A projection `64 completed / 108 documents / 565 sources`, STY-12 `published/pending`, STY-13 `unpublished/pending/nonactionable`.

- [ ] **Step 1: Generate once and capture expected RED**

```bash
npm run generate:content
node --test tests/*.test.mjs
```

Expected: generated artifacts change deterministically; any failures are limited to stale current counts, `next_topic: STY-12`, old published adjacency or tests that incorrectly treat the Batch 12 baseline prefix as permanently current.

- [ ] **Step 2: Update only current projections and preserve history**

For every RED fixture, change current state to:

```js
{completed: 64, documents: 108, sources: 565, current_goal: 'G009', next_topic: 'STY-13'}
```

When a historical test needs the STY-11 baseline, extract it after the exact marker `此前 G009 Batch 12 历史完成基线为：` rather than weakening or deleting its existing hash assertion. Do not change any prior article, diagram, Browser artifact, commit, run or job identity.

- [ ] **Step 3: Run the complete local gate and commit**

```bash
npm run verify
git diff --check
```

Expected: all tests pass; content reports `108 documents / 565 sources`; terminology `0 issues`; links, reviews, typecheck and Docusaurus build PASS.

```bash
git add src/generated tests
git commit -m "chore: project STY-12 Stage A content"
```

---

### Task 5: Capture Local Browser Evidence and Bind Stage A Reviews

**Files:**
- Create: `docs/reviews/g009-batch13.md`
- Create: `docs/reviews/evidence/g009-batch13-stage-a-browser.json`
- Create: `.superpowers/sdd/sty12-stage-a-browser.md`
- Modify: `tests/g009-batch13-deployment.test.mjs`

**Interfaces:**
- Consumes: exact clean implementation head, 64/108/565 projection and built site.
- Produces: one immutable Stage A Browser artifact, exact byte hash, three independent zero-finding review slots and a READY candidate.

- [ ] **Step 1: Write the deployment test RED before recording verdicts**

Copy the generic deployment/history helpers from `tests/g009-batch12-deployment.test.mjs`, then replace all current identities with exported constants:

```js
export const ARTICLE = 'content/styles/sty-12-micro-frontend-architecture.mdx';
export const REVIEW = 'docs/reviews/g009-batch13.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch13-stage-b-production-browser.json';
export const CURRENT_TOPIC = 'STY-12';
export const NEXT_TOPIC = 'STY-13';
export const EXPECTED_STAGE_A = Object.freeze({completed: 64, documents: 108, sources: 565});
export const EXPECTED_STAGE_B = Object.freeze({completed: 65, documents: 108, sources: 565});
```

Make the test reject missing exact head, nonzero findings, stale PENDING, fabricated deployment, incomplete diagnostic pagination, STY-13 actionable links, substituted browser, screenshot overclaim and changed immediate Batch 12 history.

- [ ] **Step 2: Build, serve and run four-state in-app Browser QA**

Run `npm run build`, serve the exact build, then use only the in-app Browser at desktop light/dark `1440×1000` and mobile light/dark `390×844`. Record per state: document width, diagram source/natural/rendered geometry, four wrapper focus/`:focus-visible`/3px/ArrowRight results, three relation href/H1/return results, seven remote source href/target/rel results, STY-13 actionable count `0`, warning/error logs `0`, Runtime/Log events `0`, `hasMore=false`, `truncated=false`.

Write raw observations to `LOCAL_RAW`; calculate exact bytes and SHA-256. Attempt screenshots only through supported in-app capture. Accept only faithful evidence; otherwise record exact attempts and `BLOCKED / NOT_ACCEPTED` without fallback.

- [ ] **Step 3: Obtain independent reviews and bind the exact evidence head**

Request read-only reviews for:

- code/spec/security: contracts, mutation sensitivity, no client authorization or hidden shared state;
- content/evidence/rights: fact/inference boundaries, source identity, license, no copied composition;
- architecture: thin Shell, authority boundaries, atomic manifest, failure and non-use conditions.

Every verdict must bind the exact implementation/evidence head and report findings `0` before READY. Record no result in advance.

- [ ] **Step 4: Verify and commit Stage A READY evidence**

```bash
node --test tests/g009-batch13-content.test.mjs tests/g009-batch13-deployment.test.mjs
npm run verify
git diff --check
git add docs/reviews/g009-batch13.md docs/reviews/evidence/g009-batch13-stage-a-browser.json tests/g009-batch13-deployment.test.mjs .superpowers/sdd/sty12-stage-a-browser.md
git commit -m "docs(g009): bind STY-12 Stage A verdicts"
```

Expected: full verification PASS and worktree clean.

---

### Task 6: Merge and Publish the Exact Stage A Candidate

**Files:**
- Modify after production observation: `docs/reviews/g009-batch13.md`
- Create: `docs/reviews/evidence/g009-batch13-stage-a-production-browser.json`
- Modify: `tests/g009-batch13-deployment.test.mjs`

**Interfaces:**
- Consumes: exact reviewed Stage A READY head.
- Produces: exact-head Pages run/build/deploy success, production route/SVG identity and fresh four-state functional evidence while backlog remains pending.

- [ ] **Step 1: Finish the branch without touching user WIP**

Use `finishing-a-development-branch`: verify the branch is based on current `origin/main`, integrate only the isolated branch into `main`, and preserve the dirty main worktree files exactly. Before push, require `npm run verify`, clean release diff and `origin/main` ancestry. Defer branch/worktree deletion because Task 7 still uses them.

- [ ] **Step 2: Push and wait for exact-head Pages**

```bash
git push origin main
head_sha=$(git rev-parse HEAD)
gh run list --commit "$head_sha" --limit 10 --json databaseId,workflowName,status,conclusion,headSha,event,url
run_id=$(gh run list --commit "$head_sha" --workflow "Verify and deploy Docusaurus to GitHub Pages" --limit 1 --json databaseId --jq '.[0].databaseId')
test -n "$run_id"
gh run watch "$run_id" --exit-status
```

Require the returned exact-head run to have `event=push`, `status=completed`, `conclusion=success`, and record build/deploy job IDs. A different commit's success is not evidence.

- [ ] **Step 3: Probe production and collect fresh Browser evidence**

Require HTTP `200` for `/tego-arch/`, `/tego-arch/styles`, `/tego-arch/styles/sty-03`, `/tego-arch/styles/sty-10`, `/tego-arch/styles/sty-12`, `/tego-arch/cases`, `/tego-arch/cases/micro-frontends-single-spa`, `/tego-arch/references`, plus the STY-12 SVG. Compare live SVG bytes and SHA-256 exactly with the reviewed local asset. Repeat Task 5 four-state functional checks against production and save `g009-batch13-stage-a-production-browser.json`; do not reuse local raw.

- [ ] **Step 4: Commit Stage A production evidence and publish that evidence commit**

Update deployment tests first and observe RED, then write the exact run/job/probe/raw identities and restore GREEN.

```bash
node --test tests/g009-batch13-deployment.test.mjs
npm run verify
git add docs/reviews/g009-batch13.md docs/reviews/evidence/g009-batch13-stage-a-production-browser.json tests/g009-batch13-deployment.test.mjs
git commit -m "docs(g009): record STY-12 Stage A production evidence"
git push origin main
```

Wait for this evidence commit's own Pages run to succeed before Stage B.

Fast-forward the isolated branch to that evidence commit before Task 7:

```bash
git -C /Users/seal/projects/tego-arch/.worktrees/g009-styles-batch13 merge --ff-only main
```

---

### Task 7: Close STY-12 Stage B from Exact Production Evidence

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch13.md`
- Modify: `src/generated/*.json` via generator
- Modify: `tests/g009-batch13-deployment.test.mjs`
- Modify only RED-proven current projection fixtures.

**Interfaces:**
- Consumes: exact Stage A READY head, exact Stage A production and evidence-commit Pages identities, production raw and immutable Batch 12 history.
- Produces: STY-12 checked/complete, 65/108/565 projection, STY-13 sole next unpublished pending nonactionable topic, Stage B zero-finding candidate.

- [ ] **Step 1: Write Stage B RED expectations**

Require exactly:

```js
assert.deepEqual(projectStatus, {
  completed_topics: 65, content_documents: 108, governed_sources: 565,
  durable_stories: {completed: 8, total: 20}, current_goal: 'G009', next_topic: 'STY-13',
});
```

Make tests reject an unchecked STY-12 row, checked STY-13, actionable `/styles/sty-13`, nonzero review findings, visual PASS without accepted evidence, stale `PENDING / NOT_RUN`, or any mutation to the complete immediate Batch 12 review and backlog suffix hashes.

- [ ] **Step 2: Close only STY-12 and regenerate**

Change the canonical row to checked and append exact Stage A evidence: closure date, implementation commit, Pages run, build/deploy jobs, production route/SVG identity, production Browser raw hash, functional PASS and honest screenshot status. Leave STY-13 unchecked. Run:

```bash
npm run generate:content
node --test tests/g009-batch13-deployment.test.mjs
node --test tests/*.test.mjs
```

Update only RED-proven current projection fixtures to 65/108/565 and STY-13. Preserve every historical hash and exact identity.

- [ ] **Step 3: Run independent Stage B reviews and full gate**

Bind code/security, content/rights and architecture reviews to the exact Stage B candidate head. Require findings `0`, then run:

```bash
npm run verify
git diff --check
```

- [ ] **Step 4: Commit and publish Stage B READY**

```bash
git add docs/content-backlog.md docs/reviews/g009-batch13.md src/generated tests
git commit -m "docs: close STY-12 Stage B candidate"
```

Use `finishing-a-development-branch` again to integrate this exact branch head into `main`, still deferring cleanup, then run `git push origin main`. Wait for the exact merged Stage B head's Pages run to complete successfully before final production QA.

---

### Task 8: Record Final Stage B Production Evidence and Recovery Baseline

**Files:**
- Create: `docs/reviews/evidence/g009-batch13-stage-b-production-browser.json`
- Modify: `docs/reviews/g009-batch13.md`
- Modify: `docs/content-backlog.md`
- Modify: `tests/g009-batch13-deployment.test.mjs`
- Modify only historical tests that fail because they assumed Batch 12 remained current.

**Interfaces:**
- Consumes: exact Stage B reviewed/deployed head and immutable Stage A/Batch 12 evidence.
- Produces: fresh Stage B production raw, final recovery baseline, final exact-head Pages success and clean published main.

- [ ] **Step 1: Repeat production probes and fresh Browser QA**

Probe the same eight HTML routes and exact SVG identity. Run a fresh four-state in-app Browser session against the Stage B head; save raw bytes to `g009-batch13-stage-b-production-browser.json`. Require four states, four wrapper interactions per state, three relation round trips per state, seven remote source checks per state, STY-13 actionable count `0`, complete empty diagnostics, and honest screenshot disposition.

- [ ] **Step 2: Bind exact evidence with TDD**

Add expected run, build/deploy jobs, routes, SVG bytes/hash, raw bytes/hash and functional counts to the deployment test first; observe RED. Update review and test to GREEN. Then change the top `当前发布基线` and `G009 Batch 13 Stage B 当前关闭候选` to the same exact Stage B success identity while preserving the complete Batch 12 suffix behind `此前 G009 Batch 12 历史完成基线为：`.

- [ ] **Step 3: Repair only stale current-baseline fixture assumptions**

Run full tests. If older tests fail because they parse Batch 12 as current, add an exact Batch 12 historical-marker extractor while keeping their original suffix hashes and artifact identities. Never delete mutation checks or relax exact equality to broad regexes.

- [ ] **Step 4: Final reviews, verification, commit and exact-head publication**

Require final code/security, content/rights and architecture findings `0`, then:

```bash
npm run verify
git diff --check
git add docs/content-backlog.md docs/reviews/g009-batch13.md docs/reviews/evidence/g009-batch13-stage-b-production-browser.json tests
git commit -m "docs(g009): publish STY-12 recovery baseline"
git push origin main
```

Wait for this recovery-baseline commit's own Pages run. Re-probe all routes and exact SVG, fetch `origin`, and require `HEAD=origin/main`, divergence `0 0`, and release worktree clean before cleanup.

- [ ] **Step 5: Clean the feature workspace and restore user state**

Use `finishing-a-development-branch` to remove only `/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch13` and `codex/g009-styles-batch13` after verifying they are clean and merged. Do not touch any other worktree or branch. Confirm the main worktree still contains the exact pre-existing user WIP files and no temporary publish stash remains.

Final report must include the live STY-12 URL, final main SHA, Pages run/build/deploy IDs, full test count, 65/108/565 projection, three zero-finding reviews, route/SVG checks, honest screenshot status, STY-13 pending/nonactionable state and WIP preservation.
