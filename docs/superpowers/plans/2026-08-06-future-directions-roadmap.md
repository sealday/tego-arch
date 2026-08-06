# Future Directions Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project-style “future three directions” roadmap and align README and homepage copy around Architecture Decision Quick Reference, Curated Learning Paths, and Tego Reference Architecture.

**Architecture:** Keep the existing initial-release roadmap unchanged as a historical snapshot. Add one new project-owned 16:9 raster visual generated through the repo illustration router and built-in image generation tool, then consume that same asset from README and the React homepage while preserving semantic text outside the image. Lock the approved bilingual terminology, excluded legacy phrases, image contract, responsive layout, and historical-roadmap boundary with source-contract tests.

**Tech Stack:** Docusaurus 3.10.2, React 19, TypeScript 6, CSS Modules, Node.js test runner, built-in `imagegen`, project-local illustration skills.

## Global Constraints

- REQUIRED SKILLS during implementation: `using-git-worktrees`, `illustrating-architecture-articles`, `imagegen`, `test-driven-development`, `verification-before-completion`.
- Execute in an isolated `codex/` worktree created from the current `main`; do not edit or stage the main worktree’s `.codex/config.toml`.
- Node.js remains `>=24.0`; add no dependency and change no package or lock file.
- Preserve `static/img/illustrations/tego-arch-initial-release-roadmap.png` byte-for-byte and preserve its current homepage/README placement and historical-snapshot explanation.
- The new asset path is exactly `static/img/illustrations/tego-arch-future-directions.png`.
- The three approved names are exactly `架构决策速查 / Architecture Decision Quick Reference`, `精选学习路径 / Curated Learning Paths`, and `Tego 参考架构 / Tego Reference Architecture`.
- README and homepage must not contain `初版之后`, `后续产物`, `下一步，让完整内容变得更轻`, `便携小抄`, `精华学习路线`, or the old product name `Tego 实践与规划` after implementation.
- The future roadmap expresses parallel directions only: no sequence numbers, dates, completion/current states, percentages, delivery order, or release promise.
- Do not add an orphan source to `data/source-ledger.json`: its document schema accepts only `content/*.mdx`, while this image is consumed only by README and the React homepage. Record this explicit registration gap in the final report; `LICENSE-CONTENT.md` and `NOTICE.md` remain the rights boundary until a real content document cites the asset.
- The image is not factual evidence; the exact product language remains present as HTML/Markdown text outside the raster asset.

---

## File Structure

- Create `static/img/illustrations/tego-arch-future-directions.png` — the one project-consumed future-directions visual.
- Modify `tests/readme-homepage-contributing.test.mjs` — PNG integrity, approved README/homepage copy, asset references, and legacy-copy exclusion.
- Modify `tests/homepage-decision-observatory.test.mjs` — homepage data shape, section order, responsive styling, and accessible image contract.
- Modify `README.md` — “未来三个方向” narrative, new image, bilingual names, and full descriptions.
- Modify `src/pages/index.tsx` — semantic future-directions data, image, bilingual cards, and updated section naming.
- Modify `src/pages/index.module.css` — light visual integration for the second roadmap and English industry-term labels.
- Do not modify `data/source-ledger.json`, generated source-ledger files, the existing initial roadmap, package manifests, or historical specs/plans.

---

### Task 1: Generate and validate the future-directions illustration

**Files:**
- Create: `static/img/illustrations/tego-arch-future-directions.png`
- Modify: `tests/readme-homepage-contributing.test.mjs`

**Interfaces:**
- Consumes: the approved closed-label list and the existing project visual language in `.codex/skills/illustrating-architecture-articles/references/`.
- Produces: a valid project-native 1672×941 PNG at `/img/illustrations/tego-arch-future-directions.png` for Task 2.

- [ ] **Step 1: Add the failing PNG asset contract**

Extend the import and helpers in `tests/readme-homepage-contributing.test.mjs`:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const readBinary = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url));
```

Add this focused test before the README test:

```js
test('ships one readable 16:9 future-directions roadmap', async () => {
  const image = await readBinary(
    'static/img/illustrations/tego-arch-future-directions.png',
  );

  assert.ok(image.length > 50 * 1024, 'future roadmap must exceed 50 KB');
  assert.deepEqual(
    [...image.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    'future roadmap must be a PNG',
  );
  assert.equal(image.toString('ascii', 12, 16), 'IHDR');
  assert.equal(image.readUInt32BE(16), 1672);
  assert.equal(image.readUInt32BE(20), 941);
});
```

- [ ] **Step 2: Run the test and verify the missing-asset failure**

Run:

```bash
node --test --test-name-pattern='future-directions roadmap' tests/readme-homepage-contributing.test.mjs
```

Expected: FAIL with `ENOENT` for `static/img/illustrations/tego-arch-future-directions.png`; no unrelated assertion should run.

- [ ] **Step 3: Generate the source image with the built-in image tool**

Record the illustration router result in the task report:

```text
格式判定：位图
决定因素：概念性视觉总结；一个共同基础连接三个并行方向；不承担精确拓扑或状态事实。
视觉任务：visual summary
```

Call the built-in `imagegen` tool once with no reference-image input and this exact prompt:

```text
Use case: infographic-diagram
Asset type: Tego Arch README and homepage future-directions roadmap
Primary request: explain that one complete architecture knowledge foundation will evolve into three parallel ways of use, with no delivery sequence or release promise
Scene/backdrop: warm white paper with generous outer margins
Style/medium: original Chinese hand-drawn technical whiteboard infographic, flat 2D felt-tip marker lines, editorially polished, matching the Tego Arch warm hand-drawn visual language
Composition/framing: near-16:9 landscape on the project-native 1672×941 canvas; title at top; one foundation card on the left or center; exactly three equally weighted direction cards branching independently from it; no arrows between the three direction cards; one concise conclusion band at the bottom
Color palette: deep blue for the shared foundation and connectors; orange only for direction emphasis; charcoal text; do not use green completion or red failure semantics
Text (verbatim): "Tego Arch 未来三个方向"; "一套知识基础 · 三种使用方式"; "完整架构知识体系"; "架构决策速查"; "QUICK REFERENCE"; "精选学习路径"; "CURATED LEARNING PATHS"; "Tego 参考架构"; "REFERENCE ARCHITECTURE"; "并行演进 · 不代表交付顺序"
Architecture: nodes are one shared foundation and exactly three parallel directions; edges are exactly three independent foundation-to-direction connectors; the direction nodes have no ordering edges
Critical boundary: show no date, sequence number, status, percentage, finish flag, current marker, release milestone, or delivery promise
Constraints: simplified Chinese exactly as supplied; exact English labels; readable at article width; direction relationship remains clear without color; small project-neutral technical icons only; no person
Avoid: extra labels, pseudo-Chinese, paragraphs, photorealism, 3D, logos, signatures, watermarks, copied layouts, decorative circuit boards, green checkmarks, numbered stages, timelines, calendars, flags
```

The generated image is project-bound. Copy the returned built-in output into the worktree as `static/img/illustrations/tego-arch-future-directions.png`; do not leave the consumed asset only under `$CODEX_HOME/generated_images/`.

- [ ] **Step 4: Verify the project-native 1672×941 canvas**

Inspect the returned file:

```bash
sips -g pixelWidth -g pixelHeight static/img/illustrations/tego-arch-future-directions.png
```

Expected: `pixelWidth: 1672` and `pixelHeight: 941`. Preserve this native output without crop, resampling, or distortion; it matches the existing project roadmap asset and remains visually near 16:9 at page width.

- [ ] **Step 5: Perform image-only visual QA**

Inspect `static/img/illustrations/tego-arch-future-directions.png` with `view_image` at original detail. Verify and record all of these as PASS or FAIL:

```text
Text: all ten closed labels are exact; no extra text.
Topology: one foundation; three independent branches; no direction-to-direction edge.
Scope: no status, date, order, percentage, flag, or delivery promise.
Hierarchy: title first; shared foundation second; three equal directions third; boundary conclusion last.
Accessibility: nodes and connectors explain the relationship without relying on color.
Originality: no person, logo, signature, watermark, copied composition, or decorative circuit motif.
Responsive: every label remains legible when the image is viewed near 720 px wide.
```

If exactly one visual defect exists, make one targeted built-in `imagegen` edit that repeats every invariant and changes only that defect, then repeat the complete QA list. Do not integrate a version with inaccurate text.

- [ ] **Step 6: Run the asset test and commit**

Run:

```bash
node --test --test-name-pattern='future-directions roadmap' tests/readme-homepage-contributing.test.mjs
git diff --check
```

Expected: 1/1 PASS and no `git diff --check` output.

Commit only the test and selected asset:

```bash
git add tests/readme-homepage-contributing.test.mjs static/img/illustrations/tego-arch-future-directions.png
git commit -m "feat: add future directions roadmap"
```

---

### Task 2: Integrate the approved terminology into README and homepage

**Files:**
- Modify: `tests/readme-homepage-contributing.test.mjs`
- Modify: `tests/homepage-decision-observatory.test.mjs`
- Modify: `README.md`
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/index.module.css`

**Interfaces:**
- Consumes: `static/img/illustrations/tego-arch-future-directions.png` from Task 1.
- Produces: `futureDirections: readonly FutureDirection[]`, `FutureDirectionsSection`, semantic bilingual direction cards, and responsive `.futureRoadmap` / `.futureTerm` styles.

- [ ] **Step 1: Replace old copy expectations with exact future-direction contracts**

In `tests/readme-homepage-contributing.test.mjs`, replace the three old-product assertions in the README test and extend the asset assertions with:

```js
  assert.match(
    readme,
    /static\/img\/illustrations\/tego-arch-future-directions\.png/u,
  );
  assert.match(readme, /^## 未来三个方向$/mu);
  assert.match(
    readme,
    /完整知识体系是共同基础[\s\S]*不构成固定的交付顺序或发布日期/u,
  );
  for (const [title, term] of [
    ['架构决策速查', 'Architecture Decision Quick Reference'],
    ['精选学习路径', 'Curated Learning Paths'],
    ['Tego 参考架构', 'Tego Reference Architecture'],
  ]) {
    assert.match(readme, new RegExp(`^### ${title}$[\\s\\S]*${term}`, 'mu'));
  }
  assert.doesNotMatch(
    readme,
    /初版之后|后续产物|下一步，让完整内容变得更轻|便携小抄|精华学习路线|Tego 实践与规划/u,
  );
```

In the homepage test in the same file, replace the old-product assertions and component-order assertion with:

```js
  assert.match(homepage, /tego-arch-future-directions\.png/u);
  assert.match(homepage, /label="04 \/ 未来方向"/u);
  assert.match(homepage, /title="让完整体系进入不同使用场景"/u);
  assert.match(homepage, /三个方向并行演进，不代表固定顺序或发布日期/u);
  for (const text of [
    '架构决策速查',
    'Architecture Decision Quick Reference',
    '精选学习路径',
    'Curated Learning Paths',
    'Tego 参考架构',
    'Tego Reference Architecture',
  ]) {
    assert.match(homepage, new RegExp(text, 'u'));
  }
  assert.doesNotMatch(
    homepage,
    /初版之后|后续产物|下一步，让完整内容变得更轻|便携小抄|精华学习路线|Tego 实践与规划/u,
  );
  assert.match(
    homepage,
    /<Hero\s*\/>\s*<main>\s*<RoadmapSection\s*\/>\s*<EntrySection\s*\/>\s*<ResearchHighlights\s*\/>\s*<FutureDirectionsSection\s*\/>\s*<ContributionBand\s*\/>/u,
  );
```

In `tests/homepage-decision-observatory.test.mjs`:

1. Rename the configured heading source from `futureOutputs` to `futureDirections`.
2. Change the mapping contract to:

```js
  assert.match(
    homepage,
    /futureDirections\.map\([\s\S]*<Heading as="h3">\{direction\.title\}<\/Heading>[\s\S]*\{direction\.term\}/u,
  );
```

3. Add this test after the current roadmap-detail test:

```js
test('presents future directions as an accessible parallel roadmap', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(
    homepage,
    /useBaseUrl\('\/img\/illustrations\/tego-arch-future-directions\.png'\)/u,
  );
  assert.match(homepage, /width=\{1672\}/u);
  assert.match(homepage, /height=\{941\}/u);
  assert.match(homepage, /loading="lazy"/u);
  assert.match(homepage, /decoding="async"/u);
  assert.match(
    homepage,
    /alt="Tego Arch 从完整架构知识体系并行发展出架构决策速查、精选学习路径和 Tego 参考架构三个未来方向"/u,
  );
  assert.match(styles, /\.futureRoadmap\s*\{[^}]*max-width:\s*64rem;[^}]*margin:\s*0 auto 2rem;/u);
  assert.match(styles, /\.futureTerm\s*\{[^}]*font-family:\s*var\(--atlas-mono\);/u);
  assert.match(styles, /@media \(max-width: 996px\)[\s\S]*\.futureList\s*\{[^}]*grid-template-columns:\s*1fr;/u);
});
```

- [ ] **Step 2: Run focused tests and verify copy/integration failures**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs tests/homepage-decision-observatory.test.mjs
```

Expected: the PNG integrity test remains green; README/homepage tests fail on `未来三个方向`, the new bilingual terms, `FutureDirectionsSection`, and `.futureRoadmap` / `.futureTerm` because implementation still uses the old product copy.

- [ ] **Step 3: Replace the README future section exactly**

Replace the complete `## 初版之后` block in `README.md` with:

```md
## 未来三个方向

完整知识体系是共同基础。接下来将沿三个方向并行演进；它们代表不同的使用场景，不构成固定的交付顺序或发布日期。

![Tego Arch 从完整架构知识体系并行发展出架构决策速查、精选学习路径和 Tego 参考架构三个未来方向](static/img/illustrations/tego-arch-future-directions.png)

### 架构决策速查

Architecture Decision Quick Reference

把核心原则、决策检查项和常见失误模式整理成可快速查用的工作资料，服务方案设计、架构评审与故障复盘。

### 精选学习路径

Curated Learning Paths

按经验阶段、角色与任务场景组织更短的学习序列，同时保留回到完整论证、真实案例和来源证据的入口。

### Tego 参考架构

Tego Reference Architecture

持续公开 Tego 的架构决策、取舍依据、验证结果与演进路线，形成可审视、可讨论，但不鼓励直接复制的实践参考。
```

Do not change the preceding `## 初版方向` section, its image, or its historical-snapshot paragraph.

- [ ] **Step 4: Implement the typed homepage direction model**

In `src/pages/index.tsx`, replace `FutureOutput` and `futureOutputs` with:

```tsx
type FutureDirection = Readonly<{
  title: string;
  term: string;
  description: string;
}>;

const futureDirections: readonly FutureDirection[] = [
  {
    title: '架构决策速查',
    term: 'Architecture Decision Quick Reference',
    description: '用于设计、评审与复盘的决策参考',
  },
  {
    title: '精选学习路径',
    term: 'Curated Learning Paths',
    description: '按角色与任务场景组织学习序列',
  },
  {
    title: 'Tego 参考架构',
    term: 'Tego Reference Architecture',
    description: '公开真实决策、验证结果与演进路线',
  },
] as const;
```

Replace `FutureOutputSection` with:

```tsx
function FutureDirectionsSection(): ReactNode {
  const futureRoadmapSrc = useBaseUrl('/img/illustrations/tego-arch-future-directions.png');

  return (
    <section className={styles.pageSection} aria-labelledby="future-title">
      <div className="container">
        <SectionIntro
          id="future-title"
          label="04 / 未来方向"
          title="让完整体系进入不同使用场景"
          description="三个方向并行演进，不代表固定顺序或发布日期"
        />
        <div className={`${styles.roadmapMedia} ${styles.futureRoadmap}`}>
          <img
            className={styles.roadmapImage}
            src={futureRoadmapSrc}
            width={1672}
            height={941}
            loading="lazy"
            decoding="async"
            alt="Tego Arch 从完整架构知识体系并行发展出架构决策速查、精选学习路径和 Tego 参考架构三个未来方向"
          />
        </div>
        <ul className={styles.futureList}>
          {futureDirections.map((direction) => (
            <li key={direction.title}>
              <Heading as="h3">{direction.title}</Heading>
              <span className={styles.futureTerm}>{direction.term}</span>
              <p>{direction.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

In the page composition, replace `<FutureOutputSection />` with `<FutureDirectionsSection />`. Do not change the order of any other homepage section.

- [ ] **Step 5: Add only the styles required by the new visual and bilingual terms**

In `src/pages/index.module.css`, add before `.futureList`:

```css
.futureRoadmap {
  max-width: 64rem;
  margin: 0 auto 2rem;
}
```

Replace the current future heading/paragraph spacing block with:

```css
.futureList h3 {
  margin: 0 0 0.35rem;
  font-size: 1.1rem;
}

.futureTerm {
  display: block;
  margin-bottom: 0.75rem;
  color: var(--ifm-color-primary);
  font-family: var(--atlas-mono);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

.futureList p {
  margin: 0;
  color: var(--atlas-ink-soft);
  font-size: 0.88rem;
  line-height: 1.75;
}
```

Reuse `.roadmapMedia` and `.roadmapImage` for the feathered asset integration. Do not add borders, shadows, large radii, hover-only content, or new motion.

- [ ] **Step 6: Run the focused contracts and check product-surface leakage**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs tests/homepage-decision-observatory.test.mjs
rg -n "初版之后|后续产物|下一步，让完整内容变得更轻|便携小抄|精华学习路线|Tego 实践与规划" README.md src/pages/index.tsx
git diff --check
```

Expected: all focused tests pass; `rg` prints no matches; `git diff --check` prints no output.

- [ ] **Step 7: Run type and production checks and commit**

Run:

```bash
npm run typecheck
npm run build
```

Expected: TypeScript exits 0 and Docusaurus reports `Generated static files in "build"`.

Commit only the integration files:

```bash
git add README.md src/pages/index.tsx src/pages/index.module.css tests/readme-homepage-contributing.test.mjs tests/homepage-decision-observatory.test.mjs
git commit -m "feat(homepage): present future directions"
```

---

### Task 3: Render, review, and verify the complete change

**Files:**
- Verify: `README.md`
- Verify: `src/pages/index.tsx`
- Verify: `src/pages/index.module.css`
- Verify: `static/img/illustrations/tego-arch-future-directions.png`
- Verify: `tests/readme-homepage-contributing.test.mjs`
- Verify: `tests/homepage-decision-observatory.test.mjs`

**Interfaces:**
- Consumes: the committed image and semantic homepage integration from Tasks 1–2.
- Produces: desktop/mobile visual evidence, a clean independent review, and final repository verification.

- [ ] **Step 1: Run the complete repository gate**

Run:

```bash
npm run verify
```

Expected: all Node tests, 94 or more content documents, all governed sources, generated-content checks, offline-link checks, review health, TypeScript, and the production build pass. Record exact counts from the actual output; do not copy counts from this plan.

- [ ] **Step 2: Serve the production build**

Run in a persistent terminal:

```bash
npm run serve -- --host 127.0.0.1 --port 4180 --no-open
```

Expected: the production site is reachable at `http://127.0.0.1:4180/tego-arch/`.

- [ ] **Step 3: Perform responsive homepage visual QA**

Use the available browser-control or computer-use skill to inspect the homepage at these exact viewports:

```text
1440×1000, light theme
1440×1000, dark theme
390×844, light theme
390×844, dark theme
```

For every viewport record PASS or FAIL for:

```text
The initial-release roadmap remains unchanged and readable.
The future roadmap appears only in the future-directions section.
The future image is not cropped and has no horizontal overflow.
All three image directions and all three HTML cards are readable.
The image and HTML explain parallel directions without an implied order.
English terms do not wrap into unreadable fragments or collide with adjacent cards.
The feathering blends with the page in both themes without hiding text.
No content depends on hover.
No console error is produced by the new section or image.
```

If a CSS-only defect is found, add one focused regression assertion to `tests/homepage-decision-observatory.test.mjs`, make the smallest CSS correction, rerun the focused tests and all four viewports, then commit:

```bash
git add src/pages/index.module.css tests/homepage-decision-observatory.test.mjs
git commit -m "fix(homepage): refine future directions layout"
```

Do not edit the approved product copy during visual QA.

- [ ] **Step 4: Verify rights and source-governance boundaries**

Run:

```bash
git diff origin/main...HEAD -- data/source-ledger.json src/generated/source-ledger.json package.json package-lock.json
rg -n "文章与原创插图" LICENSE-CONTENT.md
rg -n "第三方|不重新授权" NOTICE.md
```

Expected: the scoped diff is empty; the existing license and NOTICE boundaries are present. Record in the final implementation report:

```text
Source-ledger registration gap: the asset is used only by README.md and src/pages/index.tsx, while ledger document keys are restricted to content/*.mdx. No orphan source or false content citation was added. LICENSE-CONTENT.md and NOTICE.md cover the project-owned illustration; register a dedicated source only if a real content document later embeds it.
```

- [ ] **Step 5: Request independent code and visual review**

Prepare a full base-to-head diff and ask an independent reviewer to verify:

```text
Approved bilingual names and descriptions are exact.
Legacy product wording is absent from README and homepage.
The existing initial-release roadmap and history boundary are unchanged.
The new image contains only the ten closed labels and the approved parallel topology.
The homepage preserves semantic text, accessible alt, fixed dimensions, and responsive behavior.
No source-ledger, dependency, generated-source, or unrelated content change entered the branch.
```

Resolve every Important or Major finding with a failing regression first. Repeat review until the reviewer explicitly states `Ready to merge: yes`.

- [ ] **Step 6: Run final clean-state verification**

After the last review fix, run fresh:

```bash
npm run verify
git diff --check
git status --short --branch
git diff --name-status origin/main...HEAD
```

Expected: the full gate passes; `git diff --check` is empty; worktree status is clean; changed files are limited to the planned asset, README, homepage TSX/CSS, and the two focused test files plus any approved plan/spec commits carried by the branch.

Use `finishing-a-development-branch` to offer merge, push/PR, keep, or discard choices. Do not push or deploy until the user selects the corresponding option.
