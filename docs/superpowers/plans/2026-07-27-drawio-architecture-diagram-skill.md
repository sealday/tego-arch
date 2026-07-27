# Draw.io Architecture Diagram Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a project-local Draw.io architecture-diagram skill, use it to remove label/connector and text-boundary defects from MOD-02, and verify the updated article in local desktop and mobile previews.

**Architecture:** Keep layout judgment in a concise project skill and two on-demand references, while a small Node.js CLI validates deterministic `.drawio`/SVG pairing and accessibility constraints. Apply those rules to the existing MOD-02 source and hand-authored SVG, then use the repository test suite plus real browser screenshots for the geometry that static checks cannot prove.

**Tech Stack:** Codex project skills, Draw.io XML, accessible SVG, Node.js ESM, `node:test`, Docusaurus, local browser visual QA.

## Global Constraints

- Store the editable source at `diagrams/<slug>.drawio` and the published asset at `static/img/diagrams/<slug>.svg`.
- Embed only SVG in MDX; preserve the matching `.drawio` source.
- Do not add a dependency or build a general-purpose Draw.io XML generator.
- Keep `mxCell.value` as plain text and do not embed HTML labels.
- Require an SVG `viewBox`, no fixed root `width` or `height`, and accessible `<title>`, `<desc>`, `role="img"`, and `aria-labelledby`.
- Place edge labels in clear space at least 8 px away from connector strokes; do not use opaque label backgrounds to erase a line.
- Keep node title/type baselines separated by at least 22 px and all text at least 14 px from the node bottom.
- Verify the rendered diagram at an 800 px article width and a 390 px mobile viewport.

---

### Task 1: Capture the no-skill baseline

**Files:**
- Create: `docs/reviews/drawio-skill-baseline.md`
- Inspect: `diagrams/mod-02-c4-context-container.drawio`
- Inspect: `static/img/diagrams/mod-02-c4-context-container.svg`

**Interfaces:**
- Consumes: The current MOD-02 `.drawio` and SVG files, without access to the new skill.
- Produces: A baseline record listing the exact layout choices that a future skill must change.

- [ ] **Step 1: Run a no-skill application scenario**

Dispatch a fresh agent without the proposed skill and provide only:

```text
Inspect these raw architecture-diagram artifacts and propose a concrete revision:
- diagrams/mod-02-c4-context-container.drawio
- static/img/diagrams/mod-02-c4-context-container.svg

The revision must preserve the diagram semantics and the paired source/published files.
Return the layout rules you would apply and identify any visual defects visible from the SVG geometry.
```

- [ ] **Step 2: Verify the baseline exhibits the target failures**

Record whether the response independently catches all of:

```text
1. Opaque edge-label backgrounds interrupt connector strokes.
2. Lower node title/type baselines are crowded.
3. The existing automated test proves file pairing but not visual clearance.
4. Desktop and mobile screenshot QA is necessary.
```

Expected: at least one item is missed or described without an enforceable clearance rule. This is the RED result for the skill.

- [ ] **Step 3: Write the baseline record**

Create `docs/reviews/drawio-skill-baseline.md` with:

```markdown
# Draw.io Skill Baseline

## Scenario

The agent inspected the current MOD-02 Draw.io and SVG pair without the
`creating-drawio-architecture-diagrams` skill.

## Observed response

Record the response's proposed layout rules and visual diagnosis faithfully,
including any numeric constraints it supplied.

## Missed requirements

List each of the four target requirements that the response omitted or left
without an operational rule. Independently record that the current SVG itself
is the failing baseline because its opaque label shapes erase connector
segments and its lower title/type baselines are crowded.

## Skill requirements derived from the failure

- Reserve a connector-free label lane and define numeric clearance.
- Size nodes from text before routing edges.
- Separate deterministic file checks from browser visual QA.
```

- [ ] **Step 4: Commit**

```bash
git add docs/reviews/drawio-skill-baseline.md
git commit -m "test: capture drawio skill baseline"
```

### Task 2: Build the deterministic Draw.io/SVG validator with TDD

**Files:**
- Create: `.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs`
- Create: `tests/drawio-diagram-validator.test.mjs`
- Create: `tests/fixtures/drawio-diagram-validator/invalid.drawio`
- Create: `tests/fixtures/drawio-diagram-validator/invalid.svg`
- Create: `tests/fixtures/drawio-diagram-validator/valid.drawio`
- Create: `tests/fixtures/drawio-diagram-validator/valid.svg`

**Interfaces:**
- Consumes: CLI arguments `node validate_drawio_svg.mjs <source.drawio> <published.svg> [--label <text>]...`.
- Produces: Exit code `0` and `Validated <slug>` on success; exit code `1` with one line per violated contract on failure.

- [ ] **Step 1: Initialize the skill scaffold after the RED baseline**

Run:

```bash
python3 /Users/seal/.codex/skills/.system/skill-creator/scripts/init_skill.py \
  creating-drawio-architecture-diagrams \
  --path .codex/skills \
  --resources scripts,references \
  --interface 'display_name=Draw.io 架构图' \
  --interface 'short_description=为 Tego Arch 创建并验收清晰、可编辑的 Draw.io 架构图' \
  --interface 'default_prompt=Use $creating-drawio-architecture-diagrams to create or revise a paired Draw.io and SVG architecture diagram for this article.'
```

Expected: the scaffold contains `SKILL.md`, `agents/openai.yaml`,
`references/`, and `scripts/`. Do not customize the generated skill content
until the validator test has failed.

- [ ] **Step 2: Write the failing validator tests**

Create `tests/drawio-diagram-validator.test.mjs` using `node:test` and `spawnSync`. Cover:

```js
test('rejects mismatched, inaccessible, fixed-size diagram pairs', () => {
  const result = runValidator('invalid.drawio', 'invalid.svg');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /matching slug/u);
  assert.match(result.stderr, /HTML in mxCell.value/u);
  assert.match(result.stderr, /viewBox/u);
  assert.match(result.stderr, /fixed root width or height/u);
  assert.match(result.stderr, /accessible title and description/u);
});

test('accepts an accessible paired diagram and required labels', () => {
  const result = runValidator(
    'valid.drawio',
    'valid.svg',
    '--label',
    '费用申报系统',
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Validated valid/u);
});
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```bash
node --test tests/drawio-diagram-validator.test.mjs
```

Expected: FAIL because `validate_drawio_svg.mjs` does not exist.

- [ ] **Step 4: Create minimal XML fixtures**

The valid pair must contain:

```xml
<mxfile><diagram name="Architecture"><mxGraphModel><root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>
  <mxCell id="node" value="费用申报系统" vertex="1" parent="1"/>
</root></mxGraphModel></diagram></mxfile>
```

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"
  role="img" aria-labelledby="title desc">
  <title id="title">费用申报系统</title>
  <desc id="desc">测试架构图</desc>
  <text x="10" y="20">费用申报系统</text>
</svg>
```

The invalid pair must use different basenames, put `<b>系统</b>` in an encoded `mxCell.value`, omit `viewBox`, add fixed root width/height, and omit accessible metadata.

- [ ] **Step 5: Implement the minimal CLI**

Implement helpers with these exact responsibilities:

```js
function parseArgs(argv) // -> {drawioPath, svgPath, labels}
function rootTag(xml, tagName) // -> opening tag string or ''
function attribute(tag, name) // -> decoded attribute string or ''
function validatePair({drawioPath, svgPath, labels}) // -> Promise<string[]>
async function main() // prints success or violations and sets process.exitCode
```

Use only Node.js built-ins. Detect HTML in `mxCell.value` after XML entity decoding. Treat the SVG root as fixed-size if its opening tag contains either `width` or `height`.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/drawio-diagram-validator.test.mjs
```

Expected: 2 tests pass.

- [ ] **Step 7: Commit**

```bash
git add \
  .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  tests/drawio-diagram-validator.test.mjs \
  tests/fixtures/drawio-diagram-validator
git commit -m "test: validate drawio svg pairs"
```

### Task 3: Customize and forward-test the project skill

**Files:**
- Create: `.codex/skills/creating-drawio-architecture-diagrams/SKILL.md`
- Create: `.codex/skills/creating-drawio-architecture-diagrams/agents/openai.yaml`
- Create: `.codex/skills/creating-drawio-architecture-diagrams/references/layout-and-typography.md`
- Create: `.codex/skills/creating-drawio-architecture-diagrams/references/repository-integration.md`
- Modify: `docs/reviews/drawio-skill-baseline.md`

**Interfaces:**
- Consumes: Requests to create, revise, export, or integrate Draw.io architecture diagrams for Tego Arch articles.
- Produces: A paired `.drawio`/SVG artifact that passes the validator and a visual QA report.

- [ ] **Step 1: Write the two focused references**

`references/layout-and-typography.md` must define:

```text
- node padding: 16 px horizontal, 14 px vertical minimum
- title/type baseline separation: 22 px minimum
- text-to-bottom clearance: 14 px minimum
- edge-label-to-stroke clearance: 8 px minimum
- edge-label-to-arrow clearance: 16 px minimum
- edge-label-to-node clearance: 12 px minimum
- node title: one line preferred, two lines maximum
- edge label: short verb or verb-object phrase; omit on short edges
- opaque label backgrounds may not erase connector strokes
```

It must also describe a layout sequence: inventory semantics → choose reading direction → size text/nodes → reserve label lanes → route edges → export → inspect.

`references/repository-integration.md` must define the exact source/published paths, MDX embedding rule, validator invocation, responsive wrapper, and desktop/mobile QA commands.

- [ ] **Step 2: Write the minimal SKILL.md**

Use this frontmatter:

```yaml
---
name: creating-drawio-architecture-diagrams
description: Use when creating, revising, exporting, or integrating Draw.io or diagrams.net architecture diagrams for Tego Arch articles, especially paired .drawio and SVG assets with connector-label collisions, text overflow, unclear routing, or responsive readability concerns.
---
```

The body must:

```text
1. State that readable topology outranks decoration.
2. Require reading layout-and-typography.md for every create/revise task.
3. Require reading repository-integration.md before saving or embedding.
4. Require source and SVG to remain semantically synchronized.
5. Require the bundled validator and real browser QA.
6. Return paths, assumptions, validator output, and desktop/mobile visual verdict.
7. Include a compact common-mistakes table derived from the baseline.
```

- [ ] **Step 3: Validate skill metadata**

Run:

```bash
python3 /Users/seal/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  .codex/skills/creating-drawio-architecture-diagrams
```

Expected: `Skill is valid!`

- [ ] **Step 4: Forward-test the same application scenario**

Dispatch a fresh agent with only the raw MOD-02 artifacts and:

```text
Use $creating-drawio-architecture-diagrams at
.codex/skills/creating-drawio-architecture-diagrams
to propose a concrete revision of:
- diagrams/mod-02-c4-context-container.drawio
- static/img/diagrams/mod-02-c4-context-container.svg

Preserve semantics and paired files. Return the layout rules, validation steps,
and visual defects identified from the SVG geometry.
```

Expected: the response explicitly includes all four baseline requirements and numeric clearance rules without being shown the desired answer.

- [ ] **Step 5: Record GREEN and commit**

Append a `## Forward-test result` section to `docs/reviews/drawio-skill-baseline.md` recording the observed compliance and any skill wording adjustment.

```bash
git add .codex/skills/creating-drawio-architecture-diagrams docs/reviews/drawio-skill-baseline.md
git commit -m "feat: add drawio architecture diagram skill"
```

### Task 4: Apply the skill to MOD-02

**Files:**
- Modify: `diagrams/mod-02-c4-context-container.drawio`
- Modify: `static/img/diagrams/mod-02-c4-context-container.svg`
- Modify: `tests/drawio-svg-pilot.test.mjs`
- Modify: `content/modeling/mod-02-c4-context-container.mdx`

**Interfaces:**
- Consumes: The layout contract from Task 3 and validator CLI from Task 2.
- Produces: A synchronized, accessible MOD-02 diagram pair and an article that embeds the revised SVG.

- [ ] **Step 1: Extend the MOD-02 contract test**

Add assertions that:

```js
assert.doesNotMatch(svg, /class="edge-label-background"/u);
assert.match(svg, /class="edge-label"/u);
assert.match(svg, /data-clearance="8"/u);
assert.match(drawio, /html=0/u);
assert.doesNotMatch(drawio, /labelBackgroundColor=/u);
```

Invoke the validator with every major node label and assert exit status `0`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test tests/drawio-svg-pilot.test.mjs tests/drawio-diagram-validator.test.mjs
```

Expected: the MOD-02 test fails because the current pair uses `html=1`, label background colors, and connector-covering label shapes.

- [ ] **Step 3: Redraw the `.drawio` source**

Preserve all existing semantic nodes and relations, then:

```text
- enlarge the canvas and page height from 760 to 840
- enlarge the lower panel to preserve 14 px bottom clearance
- use html=0 for text and shape cells
- remove every labelBackgroundColor
- route Context labels above horizontal connectors
- place the zoom label beside the dashed vertical connector
- reserve a lower-panel label lane between the top row and bottom row
- increase payment-worker and bank-container height
- keep all title/type baselines at least 22 px apart
```

- [ ] **Step 4: Redraw the SVG to match**

Use `viewBox="0 0 1200 840"` with no root width/height. Draw connector paths continuously. Render edge labels as text only:

```xml
<text class="edge-label" data-clearance="8" ...>提交费用</text>
```

Do not place a filled rectangle behind edge-label text. Position every label at least 8 px away from its connector and at least 16 px away from the arrowhead.

- [ ] **Step 5: Update the article description**

Keep the article semantics unchanged. Revise the sentence after the diagram to:

```text
Context 层保留系统整体，Container 层只展开目标系统；外部银行仍在边界外。图中关系标签与连线分离，便于辨认方向，但这些箭头仍不增加运行顺序、部署位置或故障切换方面的证据。
```

- [ ] **Step 6: Run focused tests and validator**

Run:

```bash
node --test tests/drawio-svg-pilot.test.mjs tests/drawio-diagram-validator.test.mjs
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/mod-02-c4-context-container.drawio \
  static/img/diagrams/mod-02-c4-context-container.svg \
  --label 'Context：费用申报系统边界' \
  --label 'Container：展开费用申报系统' \
  --label '支付任务执行器'
```

Expected: all tests pass and CLI prints `Validated mod-02-c4-context-container`.

- [ ] **Step 7: Commit**

```bash
git add \
  diagrams/mod-02-c4-context-container.drawio \
  static/img/diagrams/mod-02-c4-context-container.svg \
  content/modeling/mod-02-c4-context-container.mdx \
  tests/drawio-svg-pilot.test.mjs
git commit -m "fix: improve drawio diagram readability"
```

### Task 5: Run full verification and refresh local preview

**Files:**
- Verify: all changed files
- Produce outside repository: `/tmp/tego-mod02-drawio-desktop.png`
- Produce outside repository: `/tmp/tego-mod02-drawio-mobile-left.png`
- Produce outside repository: `/tmp/tego-mod02-drawio-mobile-right.png`

**Interfaces:**
- Consumes: The revised article and diagram pair from Task 4.
- Produces: Fresh automated evidence, browser screenshots, and a running local preview at `/tego-arch/modeling/mod-02`.

- [ ] **Step 1: Run repository verification**

Run:

```bash
npm test
npm run validate:content
npm run typecheck
npm run build
```

Expected: all tests pass, content validation reports no errors, typecheck exits `0`, and Docusaurus production build succeeds.

- [ ] **Step 2: Restart the local production preview**

Stop only the existing preview process bound to port `3100`, then run:

```bash
npm run serve -- --host 127.0.0.1 --port 3100
```

Expected: `http://127.0.0.1:3100/tego-arch/modeling/mod-02` returns HTTP 200.

- [ ] **Step 3: Inspect at desktop width**

At a 1440 px browser viewport, capture `/tmp/tego-mod02-drawio-desktop.png`. Verify:

```text
- rendered diagram width is 800 px
- no node text crosses a shape boundary
- no edge label overlaps or erases a connector
- every arrowhead remains visible
- no console errors
```

- [ ] **Step 4: Inspect mobile left and right extents**

At a 390 px browser viewport:

```text
- verify document width equals viewport width
- verify the diagram wrapper has local horizontal overflow
- capture the left extent
- scroll the diagram wrapper to its maximum scrollLeft
- capture the right extent
- verify all labels and nodes remain intact at both extents
```

- [ ] **Step 5: Review the final diff**

Run:

```bash
git diff --check
git status --short
git log --oneline -8
```

Expected: no whitespace errors, no uncommitted implementation files, and all planned commits visible.

- [ ] **Step 6: Hand off**

Return:

```text
- local preview URL
- project skill path
- updated article, .drawio, and SVG paths
- automated test/build evidence
- desktop/mobile visual QA verdict
- the three screenshot paths
```
