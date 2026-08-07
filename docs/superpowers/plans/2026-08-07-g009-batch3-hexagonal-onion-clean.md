# G009 Batch 3 Hexagonal、Onion 与 Clean Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish and close STY-02 as a source-governed, diagram-backed comparison of Hexagonal, Onion, and Clean Architecture using one order-submission scenario and exact-head production proof.

**Architecture:** Define one common inward-dependency kernel, then overlay the three vocabularies without treating them as synonyms or a migration sequence. Publish a synchronized Draw.io/SVG control-flow and dependency-direction diagram, make STY-01 ↔ STY-02 reciprocal, and require Stage A production evidence before deriving Stage B completion.

**Tech Stack:** Docusaurus 3, MDX, Draw.io XML, accessible responsive SVG, Node.js 26.5.0, `node:test`, deterministic JSON generation, repository source-ledger/link-health tooling, GitHub Actions/Pages, in-app Browser QA.

## Global Constraints

- Work only in `/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch3` on `codex/g009-styles-batch3`.
- Preserve `/Users/seal/projects/tego-arch`, Batch 1/2, all G008 worktrees, and root untracked `.codex/config.toml` unchanged.
- Use Node.js `v26.5.0`; `package.json` requires `>=24.0`; do not use Node 20.
- Do not add dependencies or change the global eleven-heading `style` schema.
- Close only `STY-02`; keep G009 current and do not create STY-03..06 content.
- Use “依赖方向与边界所有权” as the primary comparison axis.
- Use the approved “共同内核 + 术语叠加” content structure.
- Use only one “提交订单” behavior across all three vocabularies.
- Do not call Hexagonal, Onion, and Clean synonyms, replacements, maturity levels, or a fixed migration sequence.
- Do not claim that folder names, DI containers, concentric circles, or a six-sided drawing prove conformance.
- Do not let HTTP request, ORM entity, database row, or vendor SDK types enter the application core.
- Do not infer transaction, consistency, deployment, network, scaling, performance, or failure-isolation guarantees from code boundaries.
- Use one original Draw.io + SVG pair; use MOD-02 as the visual-contract authority without copying its topology.
- Stage A projects `54 / 96 / 506` with STY-02 published/pending and next STY-02.
- Stage B projects `55 / 96 / 506` with STY-02 published/complete, G009 current, and next STY-03.
- Never hand-edit `src/generated/`; update canonical inputs and run `npm run generate:content`.
- Never fabricate source health, review verdicts, deployment IDs, browser observations, hashes, geometry, or test totals.
- Tracked release evidence must contain literal values captured after they exist, never symbolic tokens.
- Preserve the complete G009 Batch 2 and older release-history suffix byte-for-byte.
- Every implementation task ends with targeted tests and an independently reviewable commit or an explicit release gate.

---

## File Map

- Create `content/styles/sty-02-hexagonal-onion-clean.mdx`: canonical STY-02 article, two comparison tables, order exercise, visible sources and relationships.
- Modify `content/styles/sty-01-layered-architecture.mdx`: add only reciprocal STY-02 metadata and visible link; preserve the existing layer contract.
- Create `diagrams/sty-02-hexagonal-onion-clean-order.drawio`: editable semantic source for the order-boundary diagram.
- Create `static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg`: responsive accessible published diagram.
- Modify `data/source-ledger.json`: four source records and STY-02 citation review.
- Modify `docs/source-license-inventory.md`: four conservative ARR identity-family rows.
- Modify `data/source-link-health.json`: checker-produced accepted observations for four new transports.
- Create `tests/g009-batch3-content.test.mjs`: source, metadata, common-kernel, terminology, diagram, relation, anti-overclaim, mutation, and Stage A projection contract.
- Create `tests/g009-batch3-deployment.test.mjs`: Stage B exact review, deployment, backlog, generated-state, and historical-suffix contract.
- Modify generator-owned `src/generated/topic-manifest.json`, `src/generated/topic-indexes.json`, `src/generated/source-ledger.json`, and `src/generated/project-status.json` only by running the generator.
- Modify historical `tests/g007-*`, `tests/g008-*`, `tests/g009-batch1-*`, `tests/g009-batch2-*`, `tests/knowledge-fixtures.test.mjs`, and `tests/project-status.test.mjs` only where they assert the live projection.
- Modify `docs/content-backlog.md` only in Stage B: STY-02 checkbox and current release baseline prefix.
- Create `docs/reviews/g009-batch3.md` only after Stage A evidence exists.
- Create ignored `.superpowers/sdd/g009-batch3-browser-qa.json`, screenshots, task reports, and `final-audit-report.md` as execution evidence.

## Task 1: Govern the Four Original STY-02 Sources

**Files:**
- Create: `tests/g009-batch3-content.test.mjs`
- Modify: `data/source-ledger.json`
- Modify: `docs/source-license-inventory.md`
- Modify: `data/source-link-health.json`

**Interfaces:**
- Consumes: canonical source-ledger schema, link-health cache schema, license-inventory eleven-column contract.
- Produces: `src-cockburn-hexagonal-architecture-2005`, `src-palermo-onion-architecture-part-1`, `src-palermo-onion-architecture-part-3`, and `src-martin-clean-architecture-2012`, plus an explicitly bounded STY-02 role for existing `src-aws-hexagonal-layered-overview`.

- [ ] **Step 1: Write the failing source-governance tests**

Create `tests/g009-batch3-content.test.mjs` with this initial contract:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [ledger, linkHealth, licenseInventory] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
]);

const expectedNewSources = new Map([
  ['src-cockburn-hexagonal-architecture-2005', 'https://alistair.cockburn.us/hexagonal-architecture/'],
  ['src-palermo-onion-architecture-part-1', 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/'],
  ['src-palermo-onion-architecture-part-3', 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/'],
  ['src-martin-clean-architecture-2012', 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html'],
]);

test('governs the four original STY-02 sources as conservative identity families', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, locator] of expectedNewSources) {
    const record = records.get(id);
    assert.equal(record?.canonical_locator, locator, id);
    assert.equal(record.transport_locator, locator, `${id} transport`);
    assert.equal(record.license, 'LicenseRef-All-Rights-Reserved', `${id} license`);
    assert.equal(record.license_family_grouping, 'identity', `${id} grouping`);
    assert.equal(record.copyright_policy, 'facts-and-short-quotation', `${id} copyright policy`);
    assert.equal(record.checked_at, '2026-08-07', `${id} checked_at`);
    assert.ok(record.version, `${id} version`);
    assert.ok(record.license_evidence_url, `${id} license evidence`);
    assert.ok(record.usage_boundary, `${id} usage boundary`);
    assert.ok(licenseInventory.includes(locator), `${id} license inventory row`);
  }
});

test('bounds the reused AWS source for STY-01 comparison and STY-02 implementation context', () => {
  const record = ledger.sources.find(({id}) => id === 'src-aws-hexagonal-layered-overview');
  assert.equal(record?.canonical_locator, 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html');
  assert.deepEqual(record.allowed_evidence_roles, ['comparison', 'definition', 'implementation', 'learning']);
  assert.match(record.usage_boundary, /STY-01/u);
  assert.match(record.usage_boundary, /STY-02/u);
  assert.match(record.usage_boundary, /AWS-specific/u);
});

test('keeps every new STY-02 transport in the reviewed health cache', () => {
  const results = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  for (const id of expectedNewSources.keys()) {
    const result = results.get(id);
    assert.ok(result, `${id} health result`);
    assert.equal(result.last_attempt.outcome, 'healthy', `${id} current transport`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
  }
});
```

- [ ] **Step 2: Run the source tests and verify RED**

Run:

```bash
node --test tests/g009-batch3-content.test.mjs
```

Expected: FAIL because the four source records, four inventory rows, and health observations do not exist.

- [ ] **Step 3: Add the four exact source records**

Insert these contracts into the sorted `sources` array in `data/source-ledger.json`:

```js
const sourceContracts = [
  {
    id: 'src-cockburn-hexagonal-architecture-2005',
    canonical_locator: 'https://alistair.cockburn.us/hexagonal-architecture/',
    title: 'Hexagonal architecture the original 2005 article',
    author_or_org: 'Alistair Cockburn',
    published_at: '2005-09-04',
    version: 'HaT Technical Report 2005.02, version 0.9 dated 2005-09-04; page checked 2026-08-07',
    source_kind: 'paper',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license_evidence_note: 'The checked Alistair Cockburn page carries Copyright © Alistair Cockburn 2022 All Rights Reserved and exposes no reusable license for the article; Tego Arch retains attribution, a link, and original factual summary only.',
    usage_boundary: 'Defines the original Ports and Adapters intent, purposeful ports, adapters, primary and secondary actors, and isolated application testing; source diagrams, code structure, and later interpretations are not copied.',
  },
  {
    id: 'src-palermo-onion-architecture-part-1',
    canonical_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    title: 'The Onion Architecture : part 1',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-07-29',
    version: 'Original article published 2008-07-29; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license_evidence_note: 'The checked Jeffrey Palermo author-hosted article exposes no reusable license for this work; Tego Arch retains attribution, a link, and original factual summary only.',
    usage_boundary: 'Defines Onion Architecture scope, inward coupling, the independent Domain Model, core-owned repository interfaces, and external infrastructure; maintenance claims remain attributed author experience.',
  },
  {
    id: 'src-palermo-onion-architecture-part-3',
    canonical_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    title: 'The Onion Architecture : part 3',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-08-04',
    version: 'Original article published 2008-08-04; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license_evidence_note: 'The checked Jeffrey Palermo author-hosted article exposes no reusable license for this work; Tego Arch retains attribution, a link, and original factual summary only.',
    usage_boundary: 'Defines the four Onion tenets and its contrast with traditional layered dependencies; C#, IoC product recommendations, source diagrams, and universal outcome claims are excluded.',
  },
  {
    id: 'src-martin-clean-architecture-2012',
    canonical_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    title: 'The Clean Architecture',
    author_or_org: 'Robert C. Martin',
    published_at: '2012-08-13',
    version: 'Original article published 2012-08-13; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license_evidence_note: 'The checked Robert C. Martin author-hosted blog article exposes no reusable license for this work; Tego Arch retains attribution, a link, and original factual summary only.',
    usage_boundary: 'Defines the Dependency Rule, Entities, Use Cases, Interface Adapters, Frameworks and Drivers, boundary crossing, and simple boundary data; the source diagram and fixed four-circle layout are not copied or required.',
  },
];
```

For each record, materialize the schema-required fields from its literal canonical URL with this exact construction; write the resulting object values into the JSON array, not this JavaScript helper:

```js
const completeSourceContracts = sourceContracts.map((source) => ({
  ...source,
  transport_locator: source.canonical_locator,
  query_insensitive: false,
  locator_aliases: [],
  tombstone: null,
  registered_at: '2026-08-07',
  checked_at: '2026-08-07',
  license: 'LicenseRef-All-Rights-Reserved',
  license_scope: 'The named article/page and bibliographic facts only; prose, code, diagrams, images, marks, comments, linked works, and third-party material excluded',
  license_evidence_url: source.canonical_locator,
  license_evidence_note: source.license_evidence_note,
  license_family_id: source.canonical_locator,
  license_family_grouping: 'identity',
  family_grouping_evidence_url: null,
  copyright_policy: 'facts-and-short-quotation',
  link_policy: 'stable',
  expected_final_transport_locator: source.canonical_locator,
  expected_final_approved_at: '2026-08-07',
  expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
}));
```

The canonical ledger must contain the four fully materialized JSON objects and no symbolic token.

Update existing `src-aws-hexagonal-layered-overview` without changing its identity, version, license, transport, or health history:

```json
{
  "allowed_evidence_roles": ["comparison", "definition", "implementation", "learning"],
  "usage_boundary": "Supports the STY-01 contrast between classic top-down layered dependencies and dependency inversion, and the STY-02 official engineering description of domain core, ports, adapters, primary and secondary adapters, and dependency inversion; AWS-specific implementation choices, source diagrams, and universal outcome claims are excluded."
}
```

- [ ] **Step 4: Add four exact license-inventory rows**

Append one eleven-column identity-family row per article to `docs/source-license-inventory.md`. Use the exact canonical URL in the work, locator, evidence, and family identity fields; use the named author; checked date `2026-08-07`; license `LicenseRef-All-Rights-Reserved`; scope `The named checked article/page only; linked and third-party material excluded`; permitted use `Facts summary and reviewed short quotation only; no adaptation or copied structure`; grouping `identity`; grouping evidence `not-applicable`.

- [ ] **Step 5: Refresh checker-managed health evidence**

Run:

```bash
npm run refresh:links
npm run check:links
```

Expected: current accepted observations exist for all four new IDs and the complete cache passes. If an author-hosted page returns a transient 429/5xx, retain the checker output under `.superpowers/sdd/`, retry only within checker policy, and keep Task 1 RED until an accepted current observation exists; do not hand-write a healthy result.

- [ ] **Step 6: Run focused validation and commit**

Run:

```bash
node --test tests/g009-batch3-content.test.mjs
npm run check:links
git diff --check
```

Expected: 2/2 new tests pass and the cache contract passes.

Commit:

```bash
git add tests/g009-batch3-content.test.mjs data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md
git commit -m "content(styles): govern STY-02 sources"
```

## Task 2: Create the Synchronized Order-Boundary Diagram

**Files:**
- Modify: `tests/g009-batch3-content.test.mjs`
- Create: `diagrams/sty-02-hexagonal-onion-clean-order.drawio`
- Create: `static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg`

**Interfaces:**
- Consumes: Draw.io/SVG pairing skill, MOD-02 visual contract, eight semantic nodes, three boundaries, runtime-control and source-dependency relation types.
- Produces: one editable/published pair with identical visible semantics and responsive accessibility.

- [ ] **Step 1: Add the diagram inventory test before creating assets**

Append:

```js
const diagramSourceUrl = new URL('../diagrams/sty-02-hexagonal-onion-clean-order.drawio', import.meta.url);
const diagramSvgUrl = new URL('../static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg', import.meta.url);
const requiredDiagramLabels = [
  '外部驱动方', '应用核心', '外部机制',
  'HTTP / CLI / 自动化测试', '输入适配器', '提交订单用例', '订单领域规则',
  '库存端口', '订单仓储端口', '库存服务适配器', '数据库适配器',
  'Driving Adapter / UI Edge / Controller',
  'Driving Port / Application Interface / Input Boundary',
  'Domain Model / Entity Policy',
  'Driven Port / Core Interface / Output Gateway',
  'Driven Adapter / Infrastructure / Interface Adapter',
  '运行时控制流', '源码依赖指向内侧接口',
];

test('publishes the synchronized STY-02 Draw.io and SVG pair', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  for (const label of requiredDiagramLabels) {
    assert.ok(drawio.includes(label), `Draw.io label: ${label}`);
    assert.ok(svg.includes(label), `SVG label: ${label}`);
  }
  assert.match(svg, /viewBox="0 0 1200 760"/u);
  assert.doesNotMatch(svg, /<svg[^>]+(?:width|height)="[0-9]/u);
  assert.match(svg, /role="img"/u);
  assert.match(svg, /aria-labelledby="diagram-title diagram-description"/u);
});
```

- [ ] **Step 2: Run the diagram test and verify RED**

```bash
node --test tests/g009-batch3-content.test.mjs
```

Expected: FAIL with ENOENT for the Draw.io/SVG pair.

- [ ] **Step 3: Create the Draw.io source from the exact semantic inventory**

Use plain-text `mxCell.value` labels and `viewBox 0 0 1200 760`. The original narrow semantic-node geometry is superseded by the following readability amendment. The three boundary rectangles remain unchanged; semantic nodes expand only enough to render every full role label without `textLength`/`lengthAdjust` glyph compression while preserving the approved topology:

| ID | Label | x | y | w | h | Boundary/role |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `b-driver` | 外部驱动方 | 30 | 100 | 220 | 520 | boundary |
| `b-core` | 应用核心 | 400 | 70 | 550 | 620 | boundary |
| `b-mechanism` | 外部机制 | 980 | 100 | 190 | 520 | boundary |
| `n-driver` | HTTP / CLI / 自动化测试 | 45 | 300 | 190 | 130 | external driver |
| `n-input-adapter` | 输入适配器 | 260 | 265 | 135 | 210 | outside core |
| `n-usecase` | 提交订单用例 | 430 | 255 | 270 | 150 | core |
| `n-domain` | 订单领域规则 | 430 | 475 | 270 | 135 | core |
| `n-inventory-port` | 库存端口 | 710 | 135 | 230 | 160 | core boundary |
| `n-order-port` | 订单仓储端口 | 710 | 455 | 230 | 160 | core boundary |
| `n-inventory-adapter` | 库存服务适配器 | 985 | 155 | 180 | 210 | external mechanism |
| `n-database-adapter` | 数据库适配器 | 985 | 400 | 180 | 210 | external mechanism |

Use these secondary role labels inside the corresponding nodes:

- 输入适配器：`Driving Adapter / UI Edge / Controller`
- 提交订单用例：`Driving Port / Application Interface / Input Boundary`
- 订单领域规则：`Domain Model / Entity Policy`
- 库存端口、订单仓储端口：`Driven Port / Core Interface / Output Gateway`
- 两个外部适配器：`Driven Adapter / Infrastructure / Interface Adapter`

Use solid dark orthogonal connectors for runtime control:

```text
c1 n-driver -> n-input-adapter  label=提交
c2 n-input-adapter -> n-usecase label=调用用例
c3 n-usecase -> n-domain label=执行业务判断
c4 n-usecase -> n-inventory-port label=查询库存
c5 n-inventory-port -> n-inventory-adapter label=调用外部能力
c6 n-usecase -> n-order-port label=保存订单
c7 n-order-port -> n-database-adapter label=调用持久化
```

Use visually separate dashed blue connectors for source dependencies:

```text
d1 n-input-adapter -> n-usecase
d2 n-inventory-adapter -> n-inventory-port
d3 n-database-adapter -> n-order-port
```

Route every source-dependency connector in a reserved parallel lane so it cannot overlap its control connector. The marker of `d2` and `d3` must point left into the core-owned ports. Add the two exact legend labels `运行时控制流` and `源码依赖指向内侧接口`. Do not draw transaction, network, retry, database ownership, deployment, or failure-recovery semantics.

- [ ] **Step 4: Export the synchronized accessible SVG**

The SVG root must have `viewBox="0 0 1200 760"`, no fixed root width/height, `role="img"`, `aria-labelledby="diagram-title diagram-description"`, and visible `<text>` for every required label. Use:

```xml
<title id="diagram-title">提交订单在 Hexagonal、Onion 与 Clean Architecture 中的共同边界</title>
<desc id="diagram-description">同一提交订单控制流从外部驱动方进入应用核心，再经核心拥有的库存和仓储接口调用外部机制；实线表示运行时控制流，虚线表示源码依赖指向内侧接口。</desc>
```

Size the authoring fonts so final rendering at `800 / 1200 = 2/3` yields body/edge text at least 15 CSS px and role text at least 10 CSS px. Do not use `textLength`, `lengthAdjust`, `spacingAndGlyphs`, or another transform that compresses glyphs to satisfy geometry. Reflow full role labels over two to four natural-width lines. Preserve the normative minima (horizontal padding 16, vertical padding 14, title/type baseline gap 22, bottom clearance 14, edge-label-to-stroke 8, edge-label-to-arrow 16, and edge-label-to-node 12) and target a conservative measured safety buffer of at least 17 CSS px horizontal padding and 15 CSS px top/bottom clearance. Do not use color as the only distinction.

- [ ] **Step 5: Run deterministic pair validation**

Run:

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/sty-02-hexagonal-onion-clean-order.drawio \
  static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg \
  --label "外部驱动方" \
  --label "应用核心" \
  --label "外部机制" \
  --label "HTTP / CLI / 自动化测试" \
  --label "输入适配器" \
  --label "提交订单用例" \
  --label "订单领域规则" \
  --label "库存端口" \
  --label "订单仓储端口" \
  --label "库存服务适配器" \
  --label "数据库适配器" \
  --label "Driving Adapter / UI Edge / Controller" \
  --label "Driving Port / Application Interface / Input Boundary" \
  --label "Domain Model / Entity Policy" \
  --label "Driven Port / Core Interface / Output Gateway" \
  --label "Driven Adapter / Infrastructure / Interface Adapter" \
  --label "运行时控制流" \
  --label "源码依赖指向内侧接口"
node --test tests/g009-batch3-content.test.mjs tests/drawio-diagram-validator.test.mjs
git diff --check
```

Expected: validator PASS; diagram and generic validator tests pass.

- [ ] **Step 6: Commit the diagram pair**

```bash
git add tests/g009-batch3-content.test.mjs diagrams/sty-02-hexagonal-onion-clean-order.drawio static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg
git commit -m "docs(styles): add STY-02 boundary diagram"
```

## Task 3: Publish the Article and Reciprocal Relation

**Files:**
- Modify: `tests/g009-batch3-content.test.mjs`
- Create: `content/styles/sty-02-hexagonal-onion-clean.mdx`
- Modify: `content/styles/sty-01-layered-architecture.mdx`
- Modify: `data/source-ledger.json`

**Interfaces:**
- Consumes: four new sources, existing AWS source, diagram pair, style metadata parser, link extractors.
- Produces: exact STY-02 article contract, STY-01 ↔ STY-02 adjacency, five governed citations, four visible STY-02 relationships.

- [ ] **Step 1: Extend the test with metadata, content, relation, and citation contracts**

Add imports and loaded documents:

```js
import {fileURLToPath} from 'node:url';
import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const sty02 = documents.find(({file}) => file === 'styles/sty-02-hexagonal-onion-clean.mdx');
const sty01 = documents.find(({file}) => file === 'styles/sty-01-layered-architecture.mdx');
const expectedHeadings = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
const expectedCitationIds = [
  'src-cockburn-hexagonal-architecture-2005',
  'src-palermo-onion-architecture-part-1',
  'src-palermo-onion-architecture-part-3',
  'src-martin-clean-architecture-2012',
  'src-aws-hexagonal-layered-overview',
];

function bodyOf(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '');
}

function internalLinksOf(source) {
  return extractInternalLinks({body: bodyOf(source)});
}

function externalLinksOf(source) {
  return extractExternalLinks({body: bodyOf(source)});
}

function assertInOrder(source, values, label) {
  let cursor = -1;
  for (const value of values) {
    const next = source.indexOf(value, cursor + 1);
    assert.ok(next > cursor, `${label}: ${value}`);
    cursor = next;
  }
}

function assertStyleContract(source) {
  assertInOrder(source, ['业务策略位于内部', '技术机制位于外部', '源码依赖指向内部', '显式接口', '简单数据'], 'common kernel');
  assert.match(source, /Hexagonal[\s\S]*有目的的对话/u);
  assert.match(source, /Onion[\s\S]*核心[\s\S]*接口/u);
  assert.match(source, /Clean[\s\S]*策略层级[\s\S]*边界数据/u);
  assert.match(source, /运行时控制流[\s\S]*源码依赖/u);
  assert.match(source, /接口由需要它的内侧策略拥有/u);
  assert.match(source, /HTTP request[\s\S]*ORM entity[\s\S]*database row[\s\S]*SDK response[\s\S]*必须在边界转换[\s\S]*不得进入应用核心/u);
  assert.match(source, /代码边界[\s\S]*不自动[\s\S]*独立部署/u);
  assert.match(source, /小型[\s\S]*短生命周期[\s\S]*CRUD/u);
  assert.match(source, /修复具体依赖违规/u);
  assert.doesNotMatch(source, /完全等价|三者同义|Hexagonal.*→.*Onion.*→.*Clean|六个端口|就是源码依赖方向|可以直接进入应用核心/u);
  assert.doesNotMatch(source, /必然降低|必然提升|自动提供独立部署|自动提供故障隔离/u);
  assert.equal((source.match(/table-wrapper--mapping/g) ?? []).length, 2);
  assert.equal((source.match(/architecture-diagram-scroll/g) ?? []).length, 1);
  assert.equal((source.match(/tabIndex=\{0\}/g) ?? []).length, 3);
  assert.equal((source.match(/onKeyDown=\{handleHorizontalArrowKey\}/g) ?? []).length, 2);
  assert.ok(source.includes('/img/diagrams/sty-02-hexagonal-onion-clean-order.svg'));
  for (const locator of [...expectedNewSources.values(), 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html']) {
    assert.ok(externalLinksOf(source).includes(locator), locator);
  }
  for (const link of ['/styles', '/styles/sty-00', '/styles/sty-01', '/cases/micro-frontends-single-spa']) {
    assert.ok(internalLinksOf(source).includes(link), link);
  }
  assert.ok(!internalLinksOf(source).includes('/styles/sty-03'));
}

test('publishes the exact STY-02 metadata and eleven headings', () => {
  assert.ok(sty02);
  const metadata = parseFrontMatter(sty02.source);
  assert.equal(metadata.title, 'Hexagonal、Onion 与 Clean Architecture：用依赖方向判断边界所有权');
  assert.equal(metadata.slug, '/styles/sty-02');
  assert.equal(metadata.topic_id, 'STY-02');
  assert.equal(metadata.priority, 'P0');
  assert.deepEqual(metadata.depends_on, ['STY-00', 'STY-01']);
  assert.deepEqual(metadata.adjacent_topics, ['STY-01']);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(findMarkdownHeadings(sty02.body).map(({text}) => text), expectedHeadings);
});

test('locks the common kernel, vocabulary overlays, order boundary, and non-use conditions', () => {
  assert.ok(sty02);
  assertStyleContract(sty02.source);
});

test('makes STY-01 and STY-02 reciprocal while keeping STY-03 non-actionable', () => {
  assert.ok(sty01);
  assert.ok(sty02);
  assert.ok(parseFrontMatter(sty01.source).adjacent_topics.includes('STY-02'));
  assert.ok(internalLinksOf(sty01.source).includes('/styles/sty-02'));
  assert.ok(parseFrontMatter(sty02.source).adjacent_topics.includes('STY-01'));
  assert.ok(internalLinksOf(sty02.source).includes('/styles/sty-01'));
  assert.ok(!internalLinksOf(sty02.source).includes('/styles/sty-03'));
});

test('records the approved STY-02 citation review', () => {
  const review = ledger.documents['content/styles/sty-02-hexagonal-onion-clean.mdx'];
  assert.ok(review);
  assert.equal(review.reviewed_at, '2026-08-07');
  assert.deepEqual(review.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(review.citations.map(({source_id}) => source_id), expectedCitationIds);
  assert.deepEqual(review.citations.map(({manifest_primary}) => manifest_primary), [true, false, true, true, false]);
  for (const citation of review.citations) {
    assert.equal(citation.usage_mode, 'facts-summary');
    assert.equal(citation.excerpt, null);
    assert.equal(citation.quotation_reviewed, false);
  }
});
```

- [ ] **Step 2: Add mutation-sensitive rejection tests**

Append:

```js
test('rejects mutations of the STY-02 decision contract', () => {
  assert.ok(sty02);
  for (const [label, mutated] of [
    ['synonym collapse', sty02.source.replace('观察视角不同', '三者完全等价')],
    ['fixed evolution', sty02.source.replace('不是三个标签之间的迁移', 'Hexagonal → Onion → Clean')],
    ['six ports', sty02.source.replace('六边形的边数没有架构语义', '六边形代表六个端口')],
    ['outer-owned interface', sty02.source.replace('接口由需要它的内侧策略拥有', '仓储接口由数据库适配器拥有')],
    ['control equals dependency', sty02.source.replace('两种方向不能混为一谈', '运行时控制流就是源码依赖方向')],
    ['ORM crosses boundary', sty02.source.replace('不得进入应用核心', '可以直接进入应用核心')],
    ['deployment overclaim', sty02.source.replace('不自动形成独立部署', '自动提供独立部署')],
    ['missing non-use', sty02.source.replace('小型、短生命周期、变化压力低的 CRUD 应用', '所有应用')],
    ['STY-03 actionable', `${sty02.source}\n[下一个风格](/styles/sty-03)\n`],
  ]) {
    assert.notEqual(mutated, sty02.source, `${label} mutation must change source`);
    assert.throws(() => assertStyleContract(mutated), {name: 'AssertionError'});
  }
});
```

Every `.replace()` needle must occur exactly once in the final article. If copy changes during review, update the contract and mutation together; never permit a no-op mutation.

- [ ] **Step 3: Run the expanded test and verify RED**

```bash
node --test tests/g009-batch3-content.test.mjs
```

Expected: FAIL because STY-02, reciprocal relation, and citation review do not exist.

- [ ] **Step 4: Create the exact STY-02 front matter and article structure**

Start `content/styles/sty-02-hexagonal-onion-clean.mdx` with:

```mdx
---
title: Hexagonal、Onion 与 Clean Architecture：用依赖方向判断边界所有权
slug: /styles/sty-02
content_type: style
status: reviewed
difficulty: intermediate
analyzed_at: 2026-08-07
source_cutoff: 2026-08-07
confidence: high
domains:
  - software-architecture
agent_patterns: []
protocols: []
quality_attributes:
  - maintainability
  - testability
  - deployability
tags:
  - 架构风格
  - Hexagonal Architecture
  - Onion Architecture
  - Clean Architecture
  - 依赖反转
summary: 用同一个提交订单案例合并三种架构的共同内核，并保留端口、核心所有权、策略层级和边界数据规则的差异。
topic_id: STY-02
priority: P0
depends_on:
  - STY-00
  - STY-01
adjacent_topics:
  - STY-01
related_cases:
  - /cases/micro-frontends-single-spa
related_questions: []
---

import {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';
```

Use the eleven headings in the exact required order. The opening paragraph must link `[风格目录](/styles)`, `[架构风格比较框架](/styles/sty-00)`, and `[Layered Architecture](/styles/sty-01)` and state: `三者共享依赖向内的共同内核，但观察视角不同，不能仅凭目录名称判定采用了哪一种。`

Under `学习问题`, use these four questions:

```md
- 三种架构共享哪些依赖和边界不变量，又在哪些命名与推理起点上不同？
- 同一次提交订单控制流如何在三套术语中保持同一行为？
- 当运行时调用外部机制时，源码依赖为什么仍能指向内部？
- 什么情况下迁移成本超过边界隔离带来的价值？
```

- [ ] **Step 5: Add the two exact table contracts**

The terminology table wrapper must be:

```mdx
<div className="table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner" role="region" aria-label="三种架构术语与关注点矩阵，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>
```

Close it immediately after the table with `</div>`. Use this header and ordered rows:

```md
| 关注点 | 共同语义 | Hexagonal | Onion | Clean |
| --- | --- | --- | --- | --- |
| 内部核心 | 业务策略位于内部，技术机制位于外部 | Application | Domain Model / Application Core | Entities + Use Cases |
| 输入边界 | 外部驱动方以显式接口发起用例 | Driving Port | Application Interface | Input Boundary |
| 输出边界 | 核心声明所需的外部能力 | Driven Port | Core Interface | Output Boundary / Gateway |
| 外部实现 | 技术机制实现内侧合同 | Adapter | Infrastructure | Interface Adapter / Frameworks and Drivers |
| 依赖规则 | 源码依赖指向内部或内侧抽象 | Adapter 依赖 Port | Outer Layer 依赖 Inner Interface | Source Dependency points inward |
| 主要观察重点 | 边界所有权可被检查 | 有目的的对话与可替换适配器 | 独立对象模型和核心接口 | 策略层级、用例和边界数据 |
```

The decision table uses the same classes and handler with `aria-label="三种架构选择、迁移与禁用条件矩阵，可横向滚动"`. Use this exact header and ordered rows:

```md
| 判断信号 | Hexagonal 视角 | Onion 视角 | Clean 视角 | 不采用或停止条件 |
| --- | --- | --- | --- | --- |
| 端口对话 | 按驱动方和被驱动方识别有目的的对话 | 只在核心需要能力时定义接口 | 用输入与输出边界保护用例 | 只有单一稳定入口且替换价值很低 |
| 核心所有权 | Application 不知道适配器技术 | 内层定义接口，外层实现 | 高层策略不提及外层名称 | 接口仍由数据库或框架模块拥有 |
| 策略层级 | 不强制固定圈数 | Domain Model 位于中心 | 区分 Entities 与 Use Cases | 分层只增加转发而没有独立策略 |
| 测试 | 用测试适配器驱动端口 | 核心可脱离基础设施运行 | 用例和实体可独立测试 | 测试仍必须启动真实 UI 或数据库 |
| 部署 | 不从端口推导部署拓扑 | 不从同心层推导故障域 | Frameworks 位于外圈不等于独立服务 | 目标是独立扩缩或网络隔离却没有额外设计 |
| 迁移成本 | 先包围有变化压力的对话 | 把接口所有权移回核心 | 在边界转换外部数据 | 小型、短生命周期、变化压力低的 CRUD 应用 |
```

- [ ] **Step 6: Embed the diagram and write the exact boundary claims**

Embed only the SVG:

```mdx
<div className="architecture-diagram-scroll" role="region" aria-label="提交订单的控制流与向内源码依赖图，可横向滚动" tabIndex={0}>

![同一提交订单控制流在 Hexagonal、Onion 与 Clean Architecture 中的端口、核心和适配器映射](/img/diagrams/sty-02-hexagonal-onion-clean-order.svg)

</div>
```

The surrounding prose must contain these exact decisions:

- `共同内核是：业务策略位于内部，技术机制位于外部；源码依赖指向内部；跨边界使用显式接口和简单数据。`
- `实线表示运行时控制流，虚线表示源码依赖指向内侧接口，两种方向不能混为一谈。`
- `接口由需要它的内侧策略拥有，外侧适配器实现并依赖该接口。`
- `HTTP request、ORM entity、database row 与 SDK response 必须在边界转换，不得进入应用核心。`
- `代码边界不自动形成独立部署、独立扩缩或故障隔离。`
- `迁移修复具体依赖违规，不是三个标签之间的迁移。`
- `六边形的边数没有架构语义。`
- `小型、短生命周期、变化压力低的 CRUD 应用可能不值得承担接口、映射和组合成本。`

Re-state the same order behavior exactly once per vocabulary:

```md
- **Hexagonal：** HTTP、CLI 或自动化测试通过 driving adapter 和 driving port 调用提交订单；用例通过 driven port 使用库存和持久化能力，外侧 adapter 实现这些 port。
- **Onion：** 应用服务编排订单领域模型；库存和仓储接口属于 application core，基础设施在外圈实现并依赖这些接口。
- **Clean：** Controller 调用 Input Boundary；Use Case 调用 Entity，并通过 Output Boundary 或 Gateway 使用库存和持久化机制。
```

Keep the remaining section claims explicit:

- `数据所有权与一致性`：订单领域规则拥有合法状态变化；数据库适配器只实现持久化能力；采用这些架构不自动决定事务边界或分布式一致性。
- `部署单元与故障域`：代码依赖边界与部署、扩缩和故障边界正交，必须用单独证据决定运行拓扑。
- `团队拓扑`：业务能力所有者同时维护内侧策略及其所需接口，不按 Controller、Repository、Database 技术角色机械拆队。
- `质量属性收益与成本`：收益是测试接缝、机制可替换性和可检查依赖；成本是接口、映射、组合根、边界错误转换和认知负担；可替换不等于替换必然便宜。
- `迁移路径`：依次识别被机制类型污染的策略、在现有调用点建立稳定边界、把接口所有权移入核心、逐个替换外部实现、加入依赖与行为测试，并保持每一步可发布和可回退。
- `禁用条件`：若只有目录改名、没有依赖约束，或团队无法维护接口与映射，不得宣称采用成功。

Close the comparison case with the existing `/cases/micro-frontends-single-spa` link and explicitly bound it to ownership/team/deployment pressure rather than implementation evidence.

- [ ] **Step 7: Add the exact visible source links**

The `来源` section must link these URLs in this order:

```text
https://alistair.cockburn.us/hexagonal-architecture/
https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/
https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/
https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html
```

State that the tables, order scenario, and diagram are original Tego Arch synthesis and do not reproduce source diagrams, structures, or long passages.

- [ ] **Step 8: Add reciprocal STY-01 metadata and link only**

Append `STY-02` after `STY-00` in STY-01 `adjacent_topics`. In STY-01 `迁移路径`, replace the non-actionable “后续主题” phrase with a visible `[Hexagonal、Onion 与 Clean Architecture 对照](/styles/sty-02)` link. Do not alter STY-01's sources, layer table, Mermaid, exception table, order exercise, case relation, or claims.

- [ ] **Step 9: Add the STY-02 citation review**

Add `data/source-ledger.json` document key `content/styles/sty-02-hexagonal-onion-clean.mdx` with:

```json
{
  "reviewed_at": "2026-08-07",
  "copyright_checks": ["original-structure", "quotation-boundary", "attribution-complete", "illustration-rights"],
  "citations": [
    {"source_id":"src-cockburn-hexagonal-architecture-2005","citation_url":"https://alistair.cockburn.us/hexagonal-architecture/","roles":["definition","comparison","historical-context","learning"],"manifest_primary":true,"usage_mode":"facts-summary","attribution_note":"Hexagonal architecture the original 2005 article, Alistair Cockburn","modification_note":null,"excerpt":null,"quotation_reviewed":false},
    {"source_id":"src-palermo-onion-architecture-part-1","citation_url":"https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/","roles":["definition","comparison","historical-context","learning"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"The Onion Architecture : part 1, Jeffrey Palermo","modification_note":null,"excerpt":null,"quotation_reviewed":false},
    {"source_id":"src-palermo-onion-architecture-part-3","citation_url":"https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/","roles":["definition","comparison","historical-context","learning"],"manifest_primary":true,"usage_mode":"facts-summary","attribution_note":"The Onion Architecture : part 3, Jeffrey Palermo","modification_note":null,"excerpt":null,"quotation_reviewed":false},
    {"source_id":"src-martin-clean-architecture-2012","citation_url":"https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html","roles":["definition","comparison","historical-context","learning"],"manifest_primary":true,"usage_mode":"facts-summary","attribution_note":"The Clean Architecture, Robert C. Martin","modification_note":null,"excerpt":null,"quotation_reviewed":false},
    {"source_id":"src-aws-hexagonal-layered-overview","citation_url":"https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html","roles":["comparison","implementation"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"Hexagonal architecture overview, Amazon Web Services","modification_note":null,"excerpt":null,"quotation_reviewed":false}
  ]
}
```

- [ ] **Step 10: Run focused validation and commit**

```bash
node --test tests/g009-batch3-content.test.mjs
npm run validate:content
git diff --check
```

Expected: content tests pass; validation sees 96 content documents and 506 governed sources. Generated projections may still be stale until Task 4.

Commit:

```bash
git add content/styles/sty-01-layered-architecture.mdx content/styles/sty-02-hexagonal-onion-clean.mdx data/source-ledger.json tests/g009-batch3-content.test.mjs
git commit -m "docs(styles): publish STY-02 comparison"
```

## Task 4: Generate and Lock the Stage A Projection

**Files:**
- Modify: `tests/g009-batch3-content.test.mjs`
- Modify: generator-owned `src/generated/*.json`
- Modify: historical tests that assert only the live projection.

**Interfaces:**
- Consumes: canonical article, backlog, source ledger, diagram, content generator.
- Produces: Stage A `54 / 96 / 506`, STY-02 published/pending, STY-03 planned/pending, and immutable historical evidence.

- [ ] **Step 1: Add the Stage A projection test before generation**

```js
const [manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);

test('projects Stage A without closing STY-02 or activating STY-03', () => {
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  assert.equal(topics.get('STY-02')?.published, true);
  assert.equal(topics.get('STY-02')?.status.value, 'pending');
  assert.deepEqual(topics.get('STY-02')?.primary_sources, [
    'https://alistair.cockburn.us/hexagonal-architecture/',
    'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
  ]);
  assert.equal(topics.get('STY-03')?.published, false);
  assert.equal(topics.get('STY-03')?.status.value, 'pending');
  assert.equal(projectStatus.completed_topics, 54);
  assert.equal(projectStatus.content_documents, 96);
  assert.equal(projectStatus.governed_sources, 506);
  assert.equal(publicLedger.sources.length, 506);
  assert.ok(indexes.style.some(({id, status}) => id === 'STY-02' && status.value === 'pending'));
});
```

- [ ] **Step 2: Verify stale projections fail**

```bash
node --test tests/g009-batch3-content.test.mjs
npm run check:content
```

Expected: FAIL because generated artifacts do not yet include STY-02 or the four new sources.

- [ ] **Step 3: Generate canonical projections**

```bash
npm run generate:content
```

Expected: generator-owned topic manifest, topic indexes, public source ledger, project status, and deterministic indexes update. Canonical inputs are not rewritten.

- [ ] **Step 4: Classify and repair only live-projection test failures**

Run:

```bash
npm test
```

For each failure, distinguish immutable history from current projection. Update only live assertions from `95/502` to `96/506`, add STY-02 published/pending, and preserve STY-03 pending. Never change prior release reviews, historical baseline text, SHAs, job IDs, artifact hashes, old batch-local counts, or old next-topic evidence.

Audit candidate files with:

```bash
rg -l "content_documents: 95|governed_sources: 502|STY-02.*pending|next STY-02" tests | sort
```

Every mutation test must reverse the new live value to an old invalid value and assert the mutation changed the source.

- [ ] **Step 5: Run full Stage A verification and commit**

```bash
node --test tests/g009-batch3-content.test.mjs tests/drawio-diagram-validator.test.mjs
npm run validate:content
npm run check:content
npm run check:links
npm run check:reviews
npm run verify
git diff --check
```

Expected: all tests pass; 96 documents, 506 sources; typecheck and production build succeed.

Commit:

```bash
git add src/generated tests
git commit -m "test(styles): lock STY-02 Stage A projection"
```

## Task 5: Review, Deploy, and Browser-QA Stage A

**Files:**
- Create ignored: `.superpowers/sdd/g009-batch3-browser-qa.json`
- Create ignored: `.superpowers/sdd/screenshots/g009-batch3-*`
- Modify tracked files only for reviewer-approved remediation, each in a separate commit.

**Interfaces:**
- Consumes: clean Stage A exact HEAD and complete verification.
- Produces: exact Stage A SHA, successful Pages run/build/deploy jobs, independent review verdicts, measured diagram geometry, and accepted local/production browser observations.

- [ ] **Step 1: Run independent content, code, and architecture reviews**

Bind all reviews to `git rev-parse HEAD`. Require Critical 0, Important 0, content READY, code READY, architecture CLEAR and READY. Review source accuracy against the four original articles and AWS supplement; review the Draw.io/SVG pair against its semantic inventory and geometry rules. Apply fixes in narrow commits and rerun affected reviews against the new exact HEAD.

- [ ] **Step 2: Run fresh pre-push proof**

```bash
npm run verify
git diff --check
git status --short --branch
git rev-parse HEAD
```

Expected: all checks pass and the worktree is clean.

- [ ] **Step 3: Push feature and exact main**

```bash
git push -u origin codex/g009-styles-batch3
git push origin HEAD:main
git fetch origin
git rev-parse HEAD origin/codex/g009-styles-batch3 origin/main
```

Expected: all three refs print the same Stage A SHA.

- [ ] **Step 4: Resolve the exact Pages run**

```bash
gh run list --workflow deploy.yml --branch main --limit 10 --json databaseId,headSha,status,conclusion,event,url
```

Use a push-triggered run only if `headSha` equals the Stage A SHA. If no exact run appears during a bounded wait, dispatch `gh workflow run deploy.yml --ref main`, record `event=workflow_dispatch`, wait with `gh run watch`, and capture build/deploy job IDs with `gh run view`. Require exact head, completed status, successful conclusion, and both jobs successful.

- [ ] **Step 5: Start the local production build and use Browser QA**

```bash
npm run build
npm run serve -- --host 127.0.0.1 --port 3100
```

Use the in-app Browser skill. Test local `http://127.0.0.1:3100/tego-arch` and production `https://sealday.github.io/tego-arch` at desktop `1440x1000` and mobile `390x844` for:

- `/styles/sty-02`
- `/styles/sty-01`
- `/styles/sty-00`
- `/styles`
- `/cases/micro-frontends-single-spa`
- `/references`
- `/img/diagrams/sty-02-hexagonal-onion-clean-order.svg`

Planned coverage is exact:

- HTTP probes: `14/14` for seven targets across local/production;
- page/viewport observations: `24/24` for six pages across two environments and two viewports;
- SVG environment/viewport observations: `4/4`;
- source activations: `20/20` for five sources across two environments and two viewports;
- relation activations: `16/16` for STY-02→STY-00, STY-02→STY-01, STY-02→case, and STY-01→STY-02 across two environments and two viewports;
- table ArrowRight movements: `8/8` for two tables across four environment/viewport combinations;
- diagram-wrapper keyboard movements: `4/4`;
- total interactions: `48/48`;
- Tego Arch warnings/errors/page errors: `0/0/0`;
- accepted focused screenshots: `4/4`.

Require exact H1, two tables, one SVG, three focusable wrappers, no document overflow, and STY-03 actionable target count `0`.

- [ ] **Step 6: Measure the diagram in final rendered CSS pixels**

At desktop, require `image.getBoundingClientRect().width === 800` and record scale `2/3`. For all eight semantic nodes—driver, input adapter, use case, domain rule, inventory port, order repository port, inventory adapter, database adapter—record rendered title/type baselines, baseline gap, horizontal/vertical text clearance, and bottom clearance. For every visible edge label record clearance from stroke, marker, node, and boundary.

At mobile require:

```js
wrapper.scrollWidth > wrapper.clientWidth
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Focus the wrapper, send ArrowRight, and require `scrollLeft` to increase while document width remains fixed. Inspect text, connector continuity, arrow direction, labels, boundaries, no crop, and color-independent meaning.

- [ ] **Step 7: Record the Stage A gate**

Write `.superpowers/sdd/g009-batch3-browser-qa.json` with attempt dispositions, exact SHA/run/jobs, route and asset coverage, actual wrapper geometry, all node/label measurements, interactions, diagnostics, screenshots, and a computed artifact SHA-256. Do not edit backlog yet. Task 5 ends only after every Stage A production gate is accepted.

## Task 6: Close STY-02 with Exact Stage B Evidence

**Files:**
- Create: `docs/reviews/g009-batch3.md`
- Create: `tests/g009-batch3-deployment.test.mjs`
- Modify: `docs/content-backlog.md`
- Modify: generator-owned `src/generated/*.json`
- Modify: historical tests only for the new live projection.

**Interfaces:**
- Consumes: Task 5 literal Stage A identity, reviews, browser artifact, and measured geometry.
- Produces: exact mutation-sensitive review/current baseline, `55 / 96 / 506`, STY-02 complete, G009 current, next STY-03, and immutable Batch 2-and-older history.

- [ ] **Step 1: Write the deployment test before closure**

Create `tests/g009-batch3-deployment.test.mjs` using the Batch 2 deployment test structure. Insert the literal Stage A SHA, run ID, build/deploy job IDs, repository test total, browser artifact SHA-256, and actual geometry from Task 5. Require these headings exactly once and in order:

```js
const expectedReviewSections = [
  'Stage A identity',
  'Verification',
  'Independent review',
  'Production smoke',
  'Diagram geometry',
  'Stage B projection',
  'Final PASS',
];
```

Reject `ACTUAL_`, `STAGE_A_SHA`, `RUN_ID`, `JOB_ID`, `TEST_COUNT`, `ARTIFACT_SHA`, and angle-bracket tokens. The first RED run must fail because the review does not exist, STY-02 remains unchecked, and generated status remains pending.

- [ ] **Step 2: Write the exact review and current baseline**

Create `docs/reviews/g009-batch3.md` from Task 5 evidence. Require exact normalized equality in the deployment test. Include literal:

- exact Stage A SHA, workflow event/run and build/deploy jobs;
- Stage A `54 / 96 / 506`;
- repository test total and full validation PASS;
- Critical/Important `0/0`, code/content READY, architecture CLEAR/READY;
- six page routes and one SVG route;
- `14/14` HTTP, `24/24` page/viewport, `4/4` SVG observations;
- two tables, one diagram, three wrappers;
- `8/8` table movement, `4/4` diagram movement, `20/20` sources, `16/16` relations, `48/48` interactions;
- exact desktop/mobile document and wrapper geometry;
- desktop SVG `800px`, scale `2/3`, node/label measurement PASS;
- diagnostics `0/0/0`, screenshots `4/4`, artifact SHA-256;
- Stage B `55 / 96 / 506`, durable `8 / 20`, current G009, next STY-03;
- STY-02 published/complete and STY-03 planned/pending;
- `Stage B closure — PASS`.

Replace only the current baseline prefix in `docs/content-backlog.md`, preserving the marker `此前 G009 Batch 2 历史完成基线为：` and every byte after it. End the new prefix with `STY-02 为 published/complete，STY-03 为 planned/pending，Stage B closure — PASS。`

- [ ] **Step 3: Close only STY-02 and regenerate**

Change only:

```md
- [ ] **STY-02 P0｜Hexagonal、Onion 与 Clean Architecture 对照**：合并共性，保留依赖规则和命名差异，避免三篇重复定义。
```

to:

```md
- [x] **STY-02 P0｜Hexagonal、Onion 与 Clean Architecture 对照**：合并共性，保留依赖规则和命名差异，避免三篇重复定义。
```

Run:

```bash
npm run generate:content
```

Expected: completed topics 55; content documents 96; governed sources 506; G009 current; STY-02 complete; STY-03 pending.

- [ ] **Step 4: Protect the historical suffix and reject contradictions**

Compute SHA-256 for the exact text after the Batch 2 marker before and after closure and require equality. Store the literal hash in the deployment test. Reconstruct the full new current prefix and require exact equality and exactly one occurrence of every evidence literal.

Add contradiction mutations, each guarded by `assert.notEqual` before `assert.throws`, for:

- run conclusion success → failure;
- Critical or Important 0 → 1;
- CLEAR/READY → BLOCK/NOT READY;
- HTTP `14/14` → `13/14`;
- page/viewport `24/24` → `23/24`;
- SVG `4/4` → `3/4`;
- interaction `48/48` → `47/48`;
- SVG width `800` → `799`;
- diagnostics `0/0/0` → nonzero;
- repository test total minus one;
- Stage B `55/96/506` regression;
- next STY-03 → STY-02;
- Stage B closure PASS → FAIL.

- [ ] **Step 5: Update only Stage B live projections**

Run `npm test`, then update only current projections:

- completed topics `54` → `55`;
- STY-02 pending → complete;
- STY-02 `[ ]` → `[x]`;
- next STY-02 → STY-03;
- current baseline root → G009 Batch 3;
- documents/sources remain `96/506`;
- STY-03 remains unpublished/pending/non-actionable.

Do not rewrite G009 Batch 2 or older review/baseline literals. Mutation tests must reverse the new live values and prove the mutation changed the source.

- [ ] **Step 6: Run closure verification and commit**

```bash
node --test tests/g009-batch3-content.test.mjs tests/g009-batch3-deployment.test.mjs tests/drawio-diagram-validator.test.mjs
npm run verify
git diff --check
```

Expected: all tests pass; 96 documents, 506 sources; typecheck and build pass.

Commit:

```bash
git add docs/content-backlog.md docs/reviews/g009-batch3.md src/generated tests
git commit -m "docs: close G009 STY-02 comparison"
```

## Task 7: Final Review, Deploy, Production Audit, and Handoff

**Files:**
- Create ignored: `.superpowers/sdd/final-audit-report.md`
- Modify tracked files only for verified review remediation, each in a separate commit.

**Interfaces:**
- Consumes: clean exact Stage B HEAD.
- Produces: final READY/CLEAR verdict, exact final Pages deployment, production status proof, clean synchronized refs, and next target STY-03.

- [ ] **Step 1: Run final exact-HEAD reviews**

Run independent code, content/evidence, and architecture reviews against the exact Stage B SHA. Require Critical 0, Important 0, code READY, content READY, architecture CLEAR and READY. Any Important finding blocks release and requires a new commit plus exact-HEAD re-review.

- [ ] **Step 2: Run fresh full proof**

```bash
npm run verify
git diff --check
git show --check HEAD
git status --short --branch
```

Expected: all checks pass and the worktree is clean.

- [ ] **Step 3: Push feature and main to one exact SHA**

```bash
git push origin HEAD:codex/g009-styles-batch3 HEAD:main
git fetch origin
git rev-parse HEAD origin/codex/g009-styles-batch3 origin/main
```

Expected: all three refs are identical.

- [ ] **Step 4: Verify final Pages identity and success**

Resolve the exact final run using the Task 5 procedure. Use workflow dispatch only if a bounded push-trigger search does not produce the exact final SHA. Capture final run/build/deploy IDs and require completed/success for the exact final SHA.

- [ ] **Step 5: Run final production QA**

Repeat all six pages, the SVG, both viewports, five sources, four relations, two tables, the diagram wrapper, H1, local overflow, diagram geometry, diagnostics, and screenshots. `/styles` must show STY-02 as `任务已完成` with an article link and STY-03 as `计划主题` without an article link. Accepted action target count for STY-03 must be zero.

- [ ] **Step 6: Write the ignored final audit and close Browser state**

Write exact final SHA/ref equality, final run/jobs, repository test total, `55/96/506`, durable `8/20`, current G009, next STY-03, review verdicts, production QA, diagram measurements, historical suffix hash, root-checkout observation, and clean worktree status to `.superpowers/sdd/final-audit-report.md`. Reset viewport and finalize Browser tabs only after QA is complete.

- [ ] **Step 7: Handoff**

Keep the worktree for audit. Report final SHA, Pages URL, verification totals, review verdicts, production observations, diagram QA, and next target STY-03. Do not checkpoint G009.
