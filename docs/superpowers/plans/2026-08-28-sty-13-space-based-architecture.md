# STY-13 Space-Based Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布 STY-13 Space-Based Architecture 架构决策页，以航班余位说明亲和路由、状态与处理共置、分区主备、持久恢复、热点和跨分区协调，并完成原创 Draw.io/SVG、来源治理、Stage A/Stage B 评审与线上发布闭环。

**Architecture:** 入口把“航段 + 出发日期”规范化为亲和键，并把请求送到唯一分区所有者；每个处理单元共置实时余位状态与查询、暂留、确认服务，同步备份只在确认唯一主权与新纪元后提升。空间内状态是实时写权威，追加日志、检查点与长期记录负责恢复和审计，多航段行程由外部持久工作流协调而不伪造跨分区事务。

**Tech Stack:** Docusaurus 3.10.2、MDX、React 19、Node 24+ test runner、TypeScript 6、Draw.io XML/SVG、JSON source ledger、GitHub Actions、GitHub Pages、in-app Browser。

## Global Constraints

- 本轮只实现 STY-13；STY-14 保持 unchecked、unpublished、pending、non-actionable，正文与 Browser accepted actions 中 actionable count 必须为 `0`。
- 亲和键固定为“航段 + 出发日期”；不得改成整条旅客行程、航空公司或区域粗分区。
- 空间内状态是实时余位写权威；长期数据库、日志或检查点不得形成第二个同步可写权威。
- 查询、暂留、确认与释放保持单分区本地；多航段行程由外部持久工作流协调，不宣称全局 ACID。
- 无法确认唯一主分区时暂停受影响分区写入；查询降级必须公开陈旧度，不允许双主继续售卖后自动合并。
- 主备不等于持久化、异地灾备、零数据丢失或无限扩展；再平衡、内存水位、热点和恢复点必须显式设计。
- 厂商文档只支持窄机制；厂商案例只作为厂商公开陈述的背景，不把性能或商业结果外推为普遍效果。
- 主图格式固定为 `Draw.io + SVG`，必须使用 `creating-drawio-architecture-diagrams`；不得复制外部构图、Logo、水印或品牌视觉。
- Stage A 发布页面但 STY-13 仍 pending；Stage B 只有 exact-head Pages、四态 in-app Browser QA 和三类终审闭合后才推进 completed `65 → 66`。
- 当前主工作区 STY-05 图示、Batch 6 测试、`.codex/config.toml`、`.pi-subagents/` 和 `docs/superpowers/plans/2026-08-28-static-local-search.md` 属于用户 WIP，所有实现只在 `/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch14` 进行。

## File Map

- Create `content/styles/sty-13-space-based-architecture.mdx` — reader-facing decision guide and exact ten-H2 contract.
- Create `diagrams/sty-13-space-based-flight-availability.drawio` — editable three-plane affinity-partition architecture source.
- Create `static/img/diagrams/sty-13-space-based-flight-availability.svg` — accessible responsive publication asset.
- Create `tests/g009-batch14-content.test.mjs` — article, source, relation, diagram, geometry and mutation contracts.
- Create `tests/g009-batch14-deployment.test.mjs` — Stage A/Stage B exact-head evidence, projection, Browser and immutable-history contracts.
- Create `docs/reviews/g009-batch14.md` and Stage A/Stage B Browser JSON files — truthful review and production evidence.
- Modify `scripts/content-schema.mjs` — register STY-13 in the exact architecture-case heading contract.
- Modify `data/source-ledger.json`, `data/source-link-health.json`, `data/source-copyright-review.json` — seven official remote sources and one original SVG provenance record.
- Modify `data/terminology.json` only when a named checker failure proves an executable first-use contract is missing.
- Modify `content/styles/sty-05-microservices.mdx`, `content/styles/sty-08-actor-model.mdx`, `content/cases/aws-cell-shuffle-sharding.mdx`, `content/cases/cloudflare-durable-objects-workerd.mdx` — precise reciprocal STY-13 links.
- Modify generated files under `src/generated/` only via `npm run generate:content`.
- Modify current-projection tests only where RED output proves a stale count, next topic or published adjacency; never weaken historical hashes, run IDs or artifact identities.

---

### Task 1: Establish the STY-13 Contract in Failing Tests

**Files:**
- Create: `tests/g009-batch14-content.test.mjs`
- Modify: `scripts/content-schema.mjs`

**Interfaces:**
- Consumes: generic XML, Markdown, source-ledger and geometry helpers from `tests/g009-batch13-content.test.mjs`.
- Produces: exported STY-13 paths, metadata, tables, source identities, diagram identities and `architectureCaseTopicIds.has('STY-13')` for every later task.

- [ ] **Step 1: Copy the proven harness and replace the public contract**

Run:

```bash
cp tests/g009-batch13-content.test.mjs tests/g009-batch14-content.test.mjs
```

Retain generic XML, CSS cascade, marker, geometry and mutation helpers. Replace the public constants with:

```js
export const ARTICLE = 'content/styles/sty-13-space-based-architecture.mdx';
export const DRAWIO = 'diagrams/sty-13-space-based-flight-availability.drawio';
export const SVG = 'static/img/diagrams/sty-13-space-based-flight-availability.svg';
export const ROUTE = '/styles/sty-13';
export const TOPIC_ID = 'STY-13';
export const NEXT_TOPIC = 'STY-14';
export const RELATED_CASES = Object.freeze([
  '/cases/aws-cell-shuffle-sharding',
  '/cases/cloudflare-durable-objects-workerd',
]);
export const EXPECTED_STAGE_A = Object.freeze({completed: 65, documents: 109, sources: 573});
export const EXPECTED_STAGE_B = Object.freeze({completed: 66, documents: 109, sources: 573});
export const EXPECTED_HEADINGS = Object.freeze([
  '学习问题', '一页摘要', '事实边界', '架构图', '亲和分区与预订流',
  '关键机制导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源',
]);
export const MIGRATION_HEADINGS = Object.freeze([
  '可直接复用的机制', '只能有限类比的部分', '不应照搬的部分',
]);
export const WRAPPERS = Object.freeze([
  'Space-Based Architecture 航班余位亲和分区、主备与恢复边界图，可横向滚动',
  'Space-Based Architecture 与四种相邻方案边界表，可横向滚动',
  '航班余位六类操作执行与一致性责任表，可横向滚动',
  'Space-Based Architecture 六类故障信号、保护动作与恢复门槛表，可横向滚动',
]);
export const EXACT_METADATA = Object.freeze({
  title: 'Space-Based Architecture：让状态与处理在亲和分区相遇',
  slug: ROUTE, content_type: 'style', status: 'reviewed', difficulty: 'advanced',
  analyzed_at: '2026-08-28', source_cutoff: '2026-08-28', confidence: 'high',
  domains: ['software-architecture', 'distributed-systems', 'data-intensive-systems'],
  agent_patterns: [], protocols: [],
  quality_attributes: ['scalability', 'performance', 'availability', 'consistency', 'recoverability', 'operability'],
  tags: ['架构风格', 'Space-Based Architecture', '数据亲和', '分区处理', '内存数据网格', '热点治理'],
  summary: '以航班余位与报价说明 Space-Based Architecture：入口按航段与日期路由到唯一分区所有者，状态与处理共置，主备只处理受控切换，日志与检查点负责恢复，多航段行程由外部持久工作流（Workflow）协调。',
  topic_id: TOPIC_ID, priority: 'P2', depends_on: ['STY-00', 'STY-05', 'STY-08'],
  adjacent_topics: ['STY-05', 'STY-08'], related_cases: RELATED_CASES, related_questions: [],
});
export const SOURCE_IDS = Object.freeze([
  'src-gigaspaces-sba-overview',
  'src-gigaspaces-processing-unit-sla',
  'src-gigaspaces-split-brain-resolution',
  'src-gigaspaces-proxy-connectivity',
  'src-oracle-coherence-partitioned-cache',
  'src-oracle-coherence-backing-maps',
  'src-gigaspaces-flight-availability-case',
  'src-atlas-sty13-space-based-flight-availability',
]);
```

- [ ] **Step 2: Lock exact decision tables and affirmative boundaries**

```js
export const COMPARISON_ROWS = Object.freeze([
  ['Space-Based Architecture', '状态与处理按亲和键共置', '分区内运行状态', '外部工作流', '热点、内存与恢复复杂度可控'],
  ['普通数据库分区', '数据按键分布，应用可远程处理', '数据库', '数据库事务或应用协调', '数据库已经满足延迟与容量目标'],
  ['读缓存', '副本加速读取，写入仍回权威库', '数据库', '数据库或应用', '写瓶颈不是主要问题'],
  ['Actor Model', '逻辑身份拥有私有状态并串行处理消息', 'Actor 持久模型', '消息与工作流', '按实体身份而非数据分区建模更自然'],
  ['单元架构', '按租户或请求集合限制故障半径', '单元内各自系统', '单元外控制面', '首要目标是隔离而非数据处理亲和'],
]);
export const OPERATION_ROWS = Object.freeze([
  ['余位查询', '亲和分区本地服务', '分区状态版本', '可返回带版本结果，不能直接证明后续可售'],
  ['暂留', '亲和分区所有者', '余位、期限、幂等键', '本地原子判断并写入暂留'],
  ['确认', '原暂留所在分区', '暂留令牌、版本、期限', '重复请求返回同一权威结果'],
  ['释放', '原暂留所在分区', '暂留状态与幂等键', '超时后查询，不假定释放成功'],
  ['多航段协调', '外部持久工作流', '步骤、期限、补偿与人工终态', '不直接写分区，不宣称全局 ACID'],
  ['全局统计', '派生读模型或批处理', '更新时间与来源版本', '不得处理最新余位写判断'],
]);
export const FAILURE_ROWS = Object.freeze([
  ['热点分区', '在途量、队列时长、拒绝率', '排队、限流、隔离读模型', '只有业务语义允许才拆亲和键'],
  ['主节点失败', '心跳、复制进度、纪元', '隔离旧主并确认唯一主权', '新主完成状态校验后恢复写'],
  ['网络分区与脑裂', '同分区出现多个主权候选', '暂停写入；查询标注陈旧度', '选择权威分支并重建副本'],
  ['再平衡', '迁移流量、延迟、内存峰值', '限速、暂停或回滚迁移', '业务延迟和容量水位恢复'],
  ['内存压力', '主备、索引、暂留与迁移水位', '拒绝新暂留并保护权威写', '容量回落且索引状态完整'],
  ['恢复失败', '日志损坏、检查点过旧、重放超时', '保持隔离或只读', '纪元、版本与日志位置全部验证'],
]);
export const REQUIRED_SENTENCES = Object.freeze([
  'Space-Based Architecture 不是数据库前加一层读缓存。',
  '航段与出发日期共同形成亲和键，余位状态与处理该状态的服务位于同一分区。',
  '空间内状态是实时余位写权威；长期记录不得形成第二个同步可写权威。',
  '单航段暂留与确认保持分区本地，多航段行程由外部持久工作流协调。',
  '无法确认唯一主分区时暂停写入，不能让双主继续售卖后再自动合并。',
  '同步备份不等于持久日志、异地灾备、零数据丢失或跨分区事务。',
  '增加无关节点不会消除热门航班形成的热点分区。',
  '若普通数据库分区或读缓存已满足延迟与容量目标，不应引入专用空间运行时。',
]);
```

- [ ] **Step 3: Register STY-13 in the schema and run RED**

Change the architecture-case registry to:

```js
export const architectureCaseTopicIds = new Set([
  'STY-08', 'STY-09', 'STY-10', 'STY-11', 'STY-12', 'STY-13',
]);
```

Run:

```bash
node --test tests/g009-batch14-content.test.mjs
```

Expected: one harness-loading PASS followed by an implementation FAIL naming `content/styles/sty-13-space-based-architecture.mdx`; no helper or syntax failure may precede it.

- [ ] **Step 4: Commit the executable RED contract**

```bash
git add tests/g009-batch14-content.test.mjs scripts/content-schema.mjs
git commit -m "test(g009): define STY-13 space-based contract"
```

---

### Task 2: Implement the Article, Governed Sources and Reciprocal Relations

**Files:**
- Create: `content/styles/sty-13-space-based-architecture.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `data/source-copyright-review.json`
- Modify only after a named checker failure: `data/terminology.json`
- Modify: `content/styles/sty-05-microservices.mdx`
- Modify: `content/styles/sty-08-actor-model.mdx`
- Modify: `content/cases/aws-cell-shuffle-sharding.mdx`
- Modify: `content/cases/cloudflare-durable-objects-workerd.mdx`
- Test: `tests/g009-batch14-content.test.mjs`

**Interfaces:**
- Consumes: Task 1 constants and `docs/superpowers/specs/2026-08-28-sty-13-space-based-architecture-design.md`.
- Produces: one valid architecture-case MDX document, eight ordered citations, one sole manifest primary, four wrappers and four reciprocal links.

- [ ] **Step 1: Add exact frontmatter and section skeleton**

Create the article using `EXACT_METADATA`, then use this exact visible order:

Frontmatter `summary` 是读者顺序首个“工作流”术语，使用 registry 规定的 first-use 形式“工作流（Workflow）”；正文后续保持中文“工作流”。

```mdx
import SourceLedger from '@site/src/components/SourceLedger';
import {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

# Space-Based Architecture：让状态与处理在亲和分区相遇

## 学习问题
## 一页摘要
## 事实边界
## 架构图
## 亲和分区与预订流
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

The diagram wrapper and the three table wrappers use the four exact `WRAPPERS` values, `role="region"`, `tabIndex={0}` and `onKeyDown={handleHorizontalArrowKey}`. Render `COMPARISON_ROWS`, `OPERATION_ROWS` and `FAILURE_ROWS` exactly; do not add a fourth table or fifth wrapper.

- [ ] **Step 2: Write the mechanism-first guide against exact boundaries**

Include every `REQUIRED_SENTENCES` entry verbatim. The data-flow section must use this ordered sequence:

```text
1. 入口认证调用方并规范化航段、出发日期和请求幂等键。
2. 路由目录按当前纪元把请求送到唯一分区所有者。
3. 查询在本地读取余位与价格规则，返回带版本结果。
4. 暂留在一个本地原子操作中校验余位、版本、期限和重复请求。
5. 多航段工作流保存每个分区的步骤标识、暂留令牌和补偿状态。
6. 确认只接受匹配行程、暂留令牌、幂等键、状态版本和期限的请求。
7. 响应丢失时按原幂等键查询权威结果，不创建第二次扣减。
8. 处理单元恢复时验证分区纪元、检查点和日志位置后才接受写入。
```

Label external claims as `已证实事实` or `厂商案例陈述`; label the flight topology, authority choice, workflow and stop actions as `本站原创分析` or `基于证据的推断`.

- [ ] **Step 3: Register seven remote sources and one original asset identity**

Add these exact source identities and locators with `registered_at`, `checked_at` and review date `2026-08-28`; remote vendor pages use conservative factual summary without quotation:

```js
export const REMOTE_SOURCES = Object.freeze([
  ['src-gigaspaces-sba-overview', 'https://docs.gigaspaces.com/16.2/overview/space-based-architecture.html', 'Space-Based Architecture', 'GigaSpaces', 'XAP 16.2; checked 2026-08-28'],
  ['src-gigaspaces-processing-unit-sla', 'https://docs.gigaspaces.com/16.2.1/admin/the-sla-overview.html', 'Defining the SLA for Your Processing Unit', 'GigaSpaces', 'XAP 16.2.1; checked 2026-08-28'],
  ['src-gigaspaces-split-brain-resolution', 'https://docs.gigaspaces.com/16.2/admin/leader-election-availability-biased.html', 'Availability Biased — Split Brain and Primary Resolution', 'GigaSpaces', 'XAP 16.2; checked 2026-08-28'],
  ['src-gigaspaces-proxy-connectivity', 'https://docs.gigaspaces.com/16.2/admin/tuning-proxy-connectivity.html', 'Proxy Connectivity', 'GigaSpaces', 'XAP 16.2; checked 2026-08-28'],
  ['src-oracle-coherence-partitioned-cache', 'https://docs.oracle.com/en/middleware/fusion-middleware/coherence/12.2.1.4/develop-applications/introduction-coherence.html', 'Introduction to Coherence', 'Oracle', 'Coherence 12.2.1.4; checked 2026-08-28'],
  ['src-oracle-coherence-backing-maps', 'https://docs.oracle.com/middleware/1221/coherence/develop-applications/cache_back.htm', 'Implementing Storage and Backing Maps', 'Oracle', 'Coherence 12.2.1; checked 2026-08-28'],
  ['src-gigaspaces-flight-availability-case', 'https://www.gigaspaces.com/case_studies/booking-and-flight-availability', 'Booking and Flight Availability', 'GigaSpaces', 'live customer case; checked 2026-08-28'],
]);
```

Use `source_kind: 'official-docs'`, `tier: 'primary'`, `license: 'LicenseRef-All-Rights-Reserved'`, `copyright_policy: 'facts-and-short-quotation'` and citation `usage_mode: 'facts-summary'` for the six documentation records. Use `source_kind: 'vendor-reference-architecture'`, `tier: 'first-party'`, `license: 'LicenseRef-All-Rights-Reserved'`, `copyright_policy: 'vendor-claims-separated'` and citation `usage_mode: 'facts-summary'` for the customer case. Every citation has `quotation: null` and `adaptation: null`. Each `usage_boundary` must name the specific mechanism and say it does not prove the original flight design or general performance. Register `src-atlas-sty13-space-based-flight-availability` as a local `original-illustration` source with `LicenseRef-Atlas-Original` and `illustration` role.

Set only `src-gigaspaces-sba-overview` to `manifest_primary: true` in the STY-13 citations. Preserve `SOURCE_IDS` order. Add one policy-accepted link-health attempt per remote transport and exact copyright review records; do not reuse vendor logos, images or diagrams.

- [ ] **Step 4: Add exact reciprocal relations**

Append these visible sentences in the relevant relationship sections:

```md
[Space-Based Architecture 决策](/styles/sty-13)继续判断微服务何时需要把状态与处理按亲和键共置；它不取消服务所有权，也不把跨分区协调变回本地事务。
```

```md
[Space-Based Architecture 决策](/styles/sty-13)比较分区处理单元与 Actor 的状态所有权；两者都收敛本地决定，但亲和分区、主备数据网格与邮箱语义不能互换。
```

```md
[Space-Based Architecture 决策](/styles/sty-13)可有限类比本案例的放置、热点和故障域边界；Cell 与 Shuffle Sharding 不证明状态和处理已经共置于分区数据空间。
```

```md
[Space-Based Architecture 决策](/styles/sty-13)可有限类比按稳定标识路由到状态所有者；Durable Objects 不证明分区数据网格、同步主备或跨对象事务。
```

Add `STY-13` to the `adjacent_topics` arrays of STY-05 and STY-08. Do not add STY-14 anywhere.

- [ ] **Step 5: Run focused GREEN checks and commit**

```bash
node --test tests/g009-batch14-content.test.mjs
npm run validate:content
npm run check:content
npm run check:links
npm run check:reviews
npm run check:terminology
```

Expected: article, sources, tables and relations pass; only missing Draw.io/SVG assertions remain RED; terminology reports `0 issues`.

```bash
git add content/styles/sty-13-space-based-architecture.mdx content/styles/sty-05-microservices.mdx content/styles/sty-08-actor-model.mdx content/cases/aws-cell-shuffle-sharding.mdx content/cases/cloudflare-durable-objects-workerd.mdx data/source-ledger.json data/source-link-health.json data/source-copyright-review.json data/terminology.json tests/g009-batch14-content.test.mjs
git commit -m "docs: add STY-13 space-based decision guide"
```

---

### Task 3: Create and Prove the Draw.io/SVG Architecture Asset

**Files:**
- Create: `diagrams/sty-13-space-based-flight-availability.drawio`
- Create: `static/img/diagrams/sty-13-space-based-flight-availability.svg`
- Modify: `content/styles/sty-13-space-based-architecture.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-copyright-review.json`
- Test: `tests/g009-batch14-content.test.mjs`

**Interfaces:**
- Consumes: article vocabulary and Task 1 semantic constants.
- Produces: synchronized accessible Draw.io/SVG pair with stable region, node, edge and legend identities.

- [ ] **Step 1: Invoke the diagram workflow and extend the RED inventory**

Use `creating-drawio-architecture-diagrams` before editing either asset. Add:

```js
export const REGION_IDS = Object.freeze([
  'entry-routing-plane', 'affinity-partition-plane', 'recovery-coordination-plane',
]);
export const NODE_IDS = Object.freeze([
  'authenticated-entry', 'affinity-key', 'partition-router', 'route-epoch',
  'partition-a', 'query-a', 'hold-a', 'confirm-a', 'primary-a', 'backup-a',
  'partition-b', 'primary-b', 'backup-b',
  'hot-partition', 'hot-queue', 'hot-limit',
  'append-log', 'checkpoint-store', 'reservation-record',
  'itinerary-workflow', 'derived-read-model',
]);
export const EDGE_IDS = Object.freeze([
  'authenticate-request', 'derive-affinity-key', 'resolve-owner',
  'route-partition-a', 'route-partition-b', 'route-hot-partition',
  'query-local-a', 'hold-local-a', 'confirm-local-a',
  'replicate-a', 'replicate-b', 'promote-backup-a',
  'persist-append-log', 'write-checkpoint', 'publish-reservation-record',
  'coordinate-partition-a', 'coordinate-partition-b',
  'publish-derived-read-model', 'stop-split-brain-write',
]);
export const LEGEND_ROLES = Object.freeze([
  'request-route', 'local-command', 'replication', 'persistence', 'coordination', 'stop',
]);
```

Run `node --test tests/g009-batch14-content.test.mjs`. Expected: FAIL on the first missing Draw.io/SVG pair or semantic inventory item.

- [ ] **Step 2: Build synchronized editable and published assets**

Use `viewBox="0 0 2400 3600"`. Every node is a direct child of its region. Every Draw.io edge has real `source` and `target`; every SVG edge has matching `data-source-id`, `data-target-id` and `data-legend-role`. Use marker and dash patterns as well as color.

The SVG root begins with:

```xml
<title>Space-Based Architecture 航班余位亲和分区、主备与恢复边界</title>
<desc>入口按航段与出发日期生成亲和键并路由到唯一分区所有者；每个处理单元共置余位状态和本地服务，同步备份只在确认唯一主权后提升，日志、检查点、长期记录和外部工作流分别承担恢复、审计与多航段协调。</desc>
```

Use `width="100%"`, omit fixed rendered height, include no embedded HTML, raster image, script, external font, logo or watermark. A warning band must contain:

```text
非保证边界：跨分区事务、无限扩展、主备即持久、任意全局查询和脑裂自动合并均不成立
```

- [ ] **Step 3: Prove semantic and geometry invariants**

Add mutation fixtures that reject duplicate IDs, missing terminals, extra processing units, backup business writes, a database direct-write edge, multi-partition direct transaction edge, split-brain continue-write edge, hidden labels and later paint masks.

At 800 CSS pixels article width require at least: 12px node-to-region padding, 8px glyph-to-stroke/marker clearance, 12px edge-label-to-node clearance, 16px legend caption/marker clearance, no positive collinear connector overlap and no unrelated-node crossing.

Run:

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs diagrams/sty-13-space-based-flight-availability.drawio static/img/diagrams/sty-13-space-based-flight-availability.svg
node --test tests/g009-batch14-content.test.mjs
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/styles/sty-13-space-based-architecture.mdx
```

Expected: pair validation PASS; focused tests PASS; density visual-balance strictly greater than `90` with `0 warnings`.

- [ ] **Step 4: Commit the publication asset**

```bash
git add diagrams/sty-13-space-based-flight-availability.drawio static/img/diagrams/sty-13-space-based-flight-availability.svg content/styles/sty-13-space-based-architecture.mdx tests/g009-batch14-content.test.mjs data/source-ledger.json data/source-copyright-review.json
git commit -m "docs: illustrate STY-13 affinity partitions"
```

---

### Task 4: Generate the Stage A Projection and Close Repository Regressions

**Files:**
- Modify: `src/generated/content-ledger.json`
- Modify: `src/generated/project-status.json`
- Modify: `src/generated/public-source-ledger.json`
- Modify: `src/generated/topic-indexes.json`
- Modify: `src/generated/topic-manifest.json`
- Modify only RED-proven current fixtures under `tests/`
- Test: `tests/g009-batch14-content.test.mjs`

**Interfaces:**
- Consumes: complete STY-13 content, source and relation graph.
- Produces: Stage A projection `65 completed / 109 documents / 573 sources`, STY-13 `published/pending`, STY-14 `unpublished/pending/nonactionable`.

- [ ] **Step 1: Generate once and capture expected RED**

```bash
npm run generate:content
node --test tests/*.test.mjs
```

Expected: generated artifacts update deterministically; remaining failures name only stale current counts, `next_topic: STY-13`, old adjacency, or tests that incorrectly assume Batch 13 remains the current baseline.

- [ ] **Step 2: Update only RED-proven current projections**

Use the exact Stage A state:

```js
{
  completed_topics: 65,
  content_documents: 109,
  governed_sources: 573,
  durable_stories: {completed: 8, total: 20},
  current_goal: 'G009',
  next_topic: 'STY-14',
}
```

When a historical test needs Batch 13, extract it after `此前 G009 Batch 13 历史完成基线为：` and preserve the existing Batch 13 review, Browser raw, commit, run, job and backlog suffix identities exactly.

- [ ] **Step 3: Run the complete gate and commit**

```bash
npm run verify
git diff --check
```

Expected: all tests pass; content reports `109 document(s) and 573 registered source(s)`; terminology `0 issues`; links, reviews, typecheck and build PASS.

```bash
git add src/generated tests
git commit -m "chore: project STY-13 Stage A content"
```

---

### Task 5: Capture Local Browser Evidence and Bind Stage A Reviews

**Files:**
- Create: `docs/reviews/g009-batch14.md`
- Create: `docs/reviews/evidence/g009-batch14-stage-a-browser.json`
- Create: `.superpowers/sdd/sty13-stage-a-browser.md`
- Create: `tests/g009-batch14-deployment.test.mjs`

**Interfaces:**
- Consumes: exact clean implementation head, 65/109/573 projection and built site.
- Produces: immutable local Browser artifact, exact byte hash, three independent zero-finding review slots and a READY Stage A candidate.

- [ ] **Step 1: Write deployment-contract RED before recording evidence**

Copy exact-schema and immutable-history helpers from `tests/g009-batch13-deployment.test.mjs`, then define:

```js
export const ARTICLE = 'content/styles/sty-13-space-based-architecture.mdx';
export const REVIEW = 'docs/reviews/g009-batch14.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch14-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch14-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch14-stage-b-production-browser.json';
export const CURRENT_TOPIC = 'STY-13';
export const NEXT_TOPIC = 'STY-14';
export const EXPECTED_STAGE_A = Object.freeze({completed: 65, documents: 109, sources: 573});
export const EXPECTED_STAGE_B = Object.freeze({completed: 66, documents: 109, sources: 573});
export const EXPECTED_BROWSER = Object.freeze({states: 4, wrappersPerState: 4, relationsPerState: 4, remoteSourcesPerState: 7, nextTopicActions: 0});
```

The validator must reject additive fields at every nested object and array, wrong head, nonzero findings, stale PENDING, fabricated deployment, incomplete diagnostic pagination, STY-14 actions, substituted browser, screenshot overclaim and mutation of the complete immediate Batch 13 review/backlog suffix.

- [ ] **Step 2: Build, serve and run four-state in-app Browser QA**

Run `npm run build`, serve the exact build, then use only the in-app Browser at desktop light/dark `1440×1000` and mobile light/dark `390×844`. Record per state:

```js
{
  documentGeometry: {clientWidth, scrollWidth},
  wrappers: [{label, clientWidth, scrollWidth, before, after, focus, focusVisible, outlineWidth}],
  relations: [{href, expectedH1, h1, visibleCount: 1, returnedToArticle: true}],
  sources: [{href, target: '_blank', rel: 'noopener noreferrer'}],
  sty14ActionableCount: 0,
  logs: [],
  runtimeEvents: [],
}
```

After each preparation, interaction, destination, return and screenshot step, page Runtime/Log diagnostics with continuous cursors and require `hasMore=false`, `truncated=false`. Save raw observations to `LOCAL_RAW`; calculate exact bytes and SHA-256. Accept screenshots only when fresh, faithful and accurately scoped; otherwise record exact attempts as `BLOCKED / NOT_ACCEPTED` without fallback.

- [ ] **Step 3: Obtain three independent exact-head reviews**

Request read-only reviews for:

- code/spec/security: exact-schema validators, mutation sensitivity, unique-writer and split-brain stop contracts;
- content/evidence/rights: fact/case/inference boundaries, source identity, ARR summary limits and original visual rights;
- architecture: affinity key, local operation boundary, external workflow, hotspot, epoch, recovery and non-use conditions.

Every verdict binds the exact candidate head and reports Critical/Important/Minor/⚠️ `0` before READY. Record no verdict in advance.

- [ ] **Step 4: Verify and commit Stage A READY evidence**

```bash
node --test tests/g009-batch14-content.test.mjs tests/g009-batch14-deployment.test.mjs
npm run verify
git diff --check
git add docs/reviews/g009-batch14.md docs/reviews/evidence/g009-batch14-stage-a-browser.json tests/g009-batch14-deployment.test.mjs .superpowers/sdd/sty13-stage-a-browser.md
git commit -m "docs(g009): bind STY-13 Stage A verdicts"
```

Expected: focused and full verification PASS; worktree clean.

---

### Task 6: Merge and Publish the Exact Stage A Candidate

**Files:**
- Modify after observation: `docs/reviews/g009-batch14.md`
- Create: `docs/reviews/evidence/g009-batch14-stage-a-production-browser.json`
- Modify: `tests/g009-batch14-deployment.test.mjs`

**Interfaces:**
- Consumes: exact reviewed Stage A READY head.
- Produces: exact-head Pages success, production route/SVG identity and fresh four-state evidence while STY-13 remains pending.

- [ ] **Step 1: Integrate without touching user WIP**

Use `finishing-a-development-branch`. Before temporarily stashing user WIP, record SHA-256 for each tracked WIP file, `.codex/config.toml`, and the sorted `.pi-subagents` file manifest; also preserve the untracked static-local-search plan. Fast-forward only the release commits into `main`, push, then restore and verify every WIP identity. Keep the Batch 14 worktree and branch for Stage B.

- [ ] **Step 2: Wait for exact-head Pages**

```bash
git push origin main
head_sha=$(git rev-parse HEAD)
run_id=$(gh run list --commit "$head_sha" --workflow "Verify and deploy Docusaurus to GitHub Pages" --limit 1 --json databaseId --jq '.[0].databaseId')
test -n "$run_id"
gh run watch "$run_id" --exit-status
gh run view "$run_id" --json status,conclusion,headSha,event,jobs,url
```

Require `event=push`, exact `headSha`, `status=completed`, `conclusion=success`, and completed/success build and deploy jobs.

- [ ] **Step 3: Probe production and collect a fresh Browser artifact**

Require HTTP `200` for:

```text
/tego-arch/
/tego-arch/styles
/tego-arch/styles/sty-05
/tego-arch/styles/sty-08
/tego-arch/styles/sty-13
/tego-arch/cases
/tego-arch/cases/aws-cell-shuffle-sharding
/tego-arch/cases/cloudflare-durable-objects-workerd
/tego-arch/references
/tego-arch/img/diagrams/sty-13-space-based-flight-availability.svg
```

Compare the live SVG bytes and SHA-256 with the reviewed asset. Repeat Task 5 four-state checks against production and save a new `g009-batch14-stage-a-production-browser.json`; local raw and screenshots cannot be reused.

- [ ] **Step 4: Commit and publish Stage A production evidence**

Add exact run/job/probe/raw expectations to the deployment test first and observe RED, then update review/raw to restore GREEN.

```bash
node --test tests/g009-batch14-deployment.test.mjs
npm run verify
git add docs/reviews/g009-batch14.md docs/reviews/evidence/g009-batch14-stage-a-production-browser.json tests/g009-batch14-deployment.test.mjs
git commit -m "docs(g009): record STY-13 Stage A production evidence"
git push origin main
```

Wait for the evidence commit's own Pages run, then fast-forward the isolated worktree to `main`.

---

### Task 7: Close STY-13 Stage B from Exact Production Evidence

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch14.md`
- Modify: `src/generated/*.json` via generator
- Modify: `tests/g009-batch14-deployment.test.mjs`
- Modify only RED-proven current projection fixtures.

**Interfaces:**
- Consumes: exact Stage A READY head, exact Stage A production evidence and immutable Batch 13 history.
- Produces: STY-13 checked/complete, 66/109/573 projection, STY-14 sole next unpublished pending nonactionable topic, Stage B zero-finding candidate.

- [ ] **Step 1: Write exact Stage B RED expectations**

```js
assert.deepEqual(projectStatus, {
  completed_topics: 66,
  content_documents: 109,
  governed_sources: 573,
  durable_stories: {completed: 8, total: 20},
  current_goal: 'G009',
  next_topic: 'STY-14',
});
```

Reject unchecked STY-13, checked STY-14, any `/styles/sty-14` action, nonzero review finding, stale `PENDING / NOT_RUN`, visual PASS without accepted evidence, or mutation of immediate Batch 13 identities.

- [ ] **Step 2: Close only STY-13 and regenerate**

Change the canonical backlog row to checked and append exact Stage A implementation/evidence commits, Pages runs, jobs, route/SVG identity, Browser raw hash, functional verdict and screenshot disposition. Leave STY-14 unchecked.

```bash
npm run generate:content
node --test tests/g009-batch14-deployment.test.mjs
node --test tests/*.test.mjs
```

Update only RED-proven current projection fixtures to 66/109/573 and STY-14. Preserve every historical artifact identity.

- [ ] **Step 3: Bind independent Stage B reviews and full gate**

Freeze a candidate commit with all Stage B verdict fields honestly `PENDING`. Obtain independent code/security, content/rights and architecture reviews bound to that exact candidate. Require all four finding classes `0`, then bind READY in a separate commit.

```bash
npm run verify
git diff --check
```

- [ ] **Step 4: Publish Stage B READY**

Use `finishing-a-development-branch` to fast-forward the exact reviewed head into main while preserving user WIP hashes, then push and wait for the exact Stage B Pages run to complete successfully. Do not clean the worktree or branch yet.

---

### Task 8: Record Final Stage B Evidence and Recovery Baseline

**Files:**
- Create: `docs/reviews/evidence/g009-batch14-stage-b-production-browser.json`
- Modify: `docs/reviews/g009-batch14.md`
- Modify: `docs/content-backlog.md`
- Modify: `tests/g009-batch14-deployment.test.mjs`
- Modify only historical fixtures whose RED output proves they assumed Batch 13 stayed current.

**Interfaces:**
- Consumes: exact Stage B reviewed/deployed head and immutable Stage A/Batch 13 evidence.
- Produces: fresh Stage B production raw, final recovery baseline, final exact-head Pages success and published main.

- [ ] **Step 1: Repeat HTTP/SVG and fresh Browser QA**

Probe the same nine HTML routes and exact SVG from Task 6. Run a fresh four-state in-app Browser session against the Stage B head. Require four states, four wrapper interactions per state, four relation round trips per state, seven remote source checks per state, STY-14 actionable count `0`, complete empty diagnostics and honest screenshot disposition.

- [ ] **Step 2: Bind exact evidence with TDD**

Add expected run, build/deploy jobs, route/SVG bytes and hashes, raw bytes/hash, interaction counts and exact-schema mutations to the deployment test before editing the review. Observe RED, write `g009-batch14-stage-b-production-browser.json`, then restore GREEN.

Move the former current release paragraph behind the exact marker `此前 G009 Batch 13 历史完成基线为：`. The new current baseline must identify the Stage B head, run/jobs, probes, Browser evidence, 66/109/573 projection, STY-13 complete, STY-14 unpublished/pending/nonactionable, three zero-finding reviews and deployment `SUCCESS`.

- [ ] **Step 3: Repair only stale historical fixture assumptions**

Run all tests. For any older test that assumed Batch 13 remained current, add an exact historical-marker extractor while preserving its original review, evidence and suffix byte hashes. Never replace deep equality with permissive regexes or delete a mutation case.

- [ ] **Step 4: Final reviews, verification and publication**

Require final code/security, content/rights and architecture findings `0`, then:

```bash
npm run verify
git diff --check
git add docs/content-backlog.md docs/reviews/g009-batch14.md docs/reviews/evidence/g009-batch14-stage-b-production-browser.json tests
git commit -m "docs(g009): publish STY-13 recovery baseline"
git push origin main
```

Wait for this recovery-baseline commit's own Pages run. Re-probe all routes and exact SVG, fetch `origin`, and require `HEAD=origin/main`, divergence `0 0`.

- [ ] **Step 5: Clean only the completed Batch 14 workspace**

Use `finishing-a-development-branch` to remove only `/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch14` and `codex/g009-styles-batch14` after verifying both are clean and merged. Confirm main still contains the exact pre-existing user WIP identities and no temporary publish stash remains.

Final report must include the live STY-13 URL, final main SHA, Pages run/build/deploy IDs, full test count, 66/109/573 projection, three zero-finding reviews, route/SVG checks, honest screenshot status, STY-14 pending/nonactionable state and WIP preservation.
