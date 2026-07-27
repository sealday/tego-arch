# Draw.io + SVG Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MOD-02 Mermaid block with a paired Draw.io source and responsive SVG, then prove the page builds and renders locally.

**Architecture:** Keep the editable diagram under `diagrams/` and publish a reviewed SVG under `static/img/diagrams/`. The MDX page references only the SVG; a focused Node test locks the source/render pair, required labels, responsive SVG metadata, and Mermaid removal.

**Tech Stack:** MDX, SVG 1.1/2-compatible markup, Draw.io `mxfile` XML, Node.js `node:test`, Docusaurus 3.10.

## Global Constraints

- Migrate only `content/modeling/mod-02-c4-context-container.mdx`.
- Preserve the existing front matter, headings, prose, links, facts, boundaries, and topology.
- Commit both `diagrams/mod-02-c4-context-container.drawio` and `static/img/diagrams/mod-02-c4-context-container.svg`.
- Do not remove the site-wide Mermaid integration or add dependencies.
- The SVG must use the site's warm-paper, ink, navy, brick, green, and grey visual language.
- The rendered page must not create horizontal document overflow at desktop or mobile widths.

---

### Task 1: Lock the pilot asset and page contract

**Files:**
- Create: `tests/drawio-svg-pilot.test.mjs`
- Read: `content/modeling/mod-02-c4-context-container.mdx`
- Read: `diagrams/mod-02-c4-context-container.drawio`
- Read: `static/img/diagrams/mod-02-c4-context-container.svg`

**Interfaces:**
- Consumes: repository-relative MDX and asset paths.
- Produces: one focused test that fails before the pilot exists and guards the completed source/render pair.

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const pagePath = '../content/modeling/mod-02-c4-context-container.mdx';
const drawioPath = '../diagrams/mod-02-c4-context-container.drawio';
const svgPath = '../static/img/diagrams/mod-02-c4-context-container.svg';

function source(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('publishes the MOD-02 Draw.io source and responsive SVG pair', async () => {
  const page = await source(pagePath);

  assert.doesNotMatch(page, /```mermaid/u);
  assert.match(
    page,
    /!\[[^\]]+\]\(\/img\/diagrams\/mod-02-c4-context-container\.svg\)/u,
  );

  const [drawio, svg] = await Promise.all([
    source(drawioPath),
    source(svgPath),
  ]);

  assert.match(drawio, /<mxfile\b/u);
  assert.match(drawio, /<diagram\b[^>]*name="Context → Container"/u);
  assert.match(svg, /<svg\b/u);
  assert.match(svg, /\bviewBox="0 0 1200 760"/u);
  assert.doesNotMatch(svg, /\bwidth="\d+(?:px)?"/u);
  assert.doesNotMatch(svg, /\bheight="\d+(?:px)?"/u);

  for (const label of [
    'Context：费用申报系统边界',
    'Container：展开费用申报系统',
    '员工',
    '费用申报系统',
    '银行支付服务',
    'Web 应用',
    '申报 API',
    '申报数据库',
    '支付任务执行器',
  ]) {
    assert.match(drawio, new RegExp(label, 'u'));
    assert.match(svg, new RegExp(label, 'u'));
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/drawio-svg-pilot.test.mjs
```

Expected: FAIL at `assert.doesNotMatch(page, /```mermaid/u)` because MOD-02
still contains its Mermaid block.

- [ ] **Step 3: Commit the verified failing test**

```bash
git add tests/drawio-svg-pilot.test.mjs
git commit -m "test: define drawio svg pilot contract"
```

### Task 2: Create the editable diagram and rendered SVG

**Files:**
- Create: `diagrams/mod-02-c4-context-container.drawio`
- Create: `static/img/diagrams/mod-02-c4-context-container.svg`
- Modify: `content/modeling/mod-02-c4-context-container.mdx:49-68`
- Test: `tests/drawio-svg-pilot.test.mjs`

**Interfaces:**
- Consumes: the existing Mermaid topology and the exact paths asserted in Task 1.
- Produces: a valid Draw.io `mxfile`, a responsive SVG with `viewBox="0 0 1200 760"`, and an MDX image reference.

- [ ] **Step 1: Create the Draw.io source**

Create one uncompressed `mxfile` page named `Context → Container`. Use these
stable cell IDs and relationships:

```text
context-boundary
  employee -> expense-system -> bank-context

zoom-link
  expense-system -.展开.-> web-app

container-boundary
  employee-container -> web-app -> expense-api
  expense-api -> expense-db
  expense-api -> payment-worker -> bank-container
```

Use rounded rectangles for people, systems, applications, and services; use a
cylinder for the database. Keep both bank cells visually external and keep the
Container boundary visually nested only around owned application containers.

- [ ] **Step 2: Create the responsive SVG**

The root must have this interface:

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 1200 760"
  role="img"
  aria-labelledby="diagram-title diagram-description"
>
  <title id="diagram-title">费用申报系统的 C4 Context 与 Container 映射</title>
  <desc id="diagram-description">
    上半部分展示员工、费用申报系统和外部银行的 Context 关系，下半部分展开 Web 应用、申报 API、申报数据库和支付任务执行器；箭头只表示关系。
  </desc>
</svg>
```

Do not add numeric `width` or `height` attributes. Define arrow markers,
typography, fills, strokes, boundary labels, owned/external badges, relationship
labels, and a dashed zoom connector inside the SVG.

- [ ] **Step 3: Replace the Mermaid fence in MDX**

Replace lines 51–68 with:

```mdx
下面是本站原创的 Context→Container 两层映射。先看上层如何把目标系统与员工、外部银行分开，再沿“展开”关系检查下层的可运行与存储单元；箭头只表达关系，不声称调用顺序。

![从费用申报系统 Context 边界展开到 Web、API、数据库与支付任务执行器等 Container](/img/diagrams/mod-02-c4-context-container.svg)

Context 层保留系统整体，Container 层只展开目标系统；外部银行仍在边界外。SVG 用视觉层级区分两个抽象层次，但不增加运行顺序、部署位置或故障切换方面的证据。
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/drawio-svg-pilot.test.mjs
```

Expected: PASS with one test and zero failures.

- [ ] **Step 5: Commit the pilot implementation**

```bash
git add diagrams/mod-02-c4-context-container.drawio \
  static/img/diagrams/mod-02-c4-context-container.svg \
  content/modeling/mod-02-c4-context-container.mdx
git commit -m "feat: replace MOD-02 mermaid with drawio svg"
```

### Task 3: Verify build and local visual behavior

**Files:**
- Verify: `content/modeling/mod-02-c4-context-container.mdx`
- Verify: `static/img/diagrams/mod-02-c4-context-container.svg`
- Verify: generated local screenshots outside tracked source files.

**Interfaces:**
- Consumes: the completed pilot page and assets.
- Produces: fresh automated verification plus desktop and mobile screenshots from the isolated worktree.

- [ ] **Step 1: Run automated verification**

Run:

```bash
npm test
npm run validate:content
npm run typecheck
npm run build
```

Expected: every command exits `0`.

- [ ] **Step 2: Start the local production preview**

Run:

```bash
npm run serve -- --host 127.0.0.1 --port 3100
```

Expected: the built site is available below
`http://127.0.0.1:3100/tego-arch/modeling/mod-02`.

- [ ] **Step 3: Capture and inspect desktop and mobile**

Capture the page at `1440×1000` and `390×844`. Verify:

```text
HTTP 200
document.scrollWidth === document.clientWidth
SVG natural width and height are non-zero
Context and Container labels are visible
no browser console error
```

Inspect both screenshots for label legibility, connector clarity, boundary
distinction, cropping, and consistency with the article's visual language.

- [ ] **Step 4: Record the final worktree state**

Run:

```bash
git status --short
git log --oneline -3
```

Expected: only intentional tracked changes or a clean tree; the latest commits
are the design, focused contract, and pilot implementation.
