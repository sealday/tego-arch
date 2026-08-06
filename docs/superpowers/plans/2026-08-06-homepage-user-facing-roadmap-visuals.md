# Homepage User-Facing Roadmap Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage’s project-status language and mismatched whiteboard images with user-facing copy and four theme-matched editorial roadmap assets while preserving the detailed README history.

**Architecture:** Generate two simplified editorial diagrams as independent light/dark PNG pairs, then render them through Docusaurus `ThemedComponent` so the homepage follows the active color mode without a second theme state. Keep the original detailed images and README copy unchanged; remove homepage-only status disclosures and lock every boundary with focused source-contract tests plus responsive visual QA.

**Tech Stack:** Docusaurus 3, React 19, TypeScript, CSS Modules, `@docusaurus/theme-common`, Node.js 24 test runner, built-in `imagegen`, GitHub Pages.

## Global Constraints

- Use Node.js `>=24.0`; add no runtime or development dependency.
- Preserve the user-owned untracked `.codex/config.toml`; never stage, edit, delete, or mention its contents.
- Preserve `README.md` byte-for-byte and keep its references to `tego-arch-initial-release-roadmap.png` and `tego-arch-future-directions.png`.
- Do not modify `docs/content-backlog.md`, project status, content documents, package manifests, generated source files, or either source-ledger file.
- Do not add an orphan `data/source-ledger.json` entry: homepage React code cannot close a `content/*.mdx` document citation.
- Homepage section 01 copy is exactly `01 / 判断路径`, `建立架构判断的主线`, and `从基础与质量出发，经过建模、模式与治理，在案例和复盘中形成判断`.
- Homepage section 04 copy is exactly `04 / 使用方式`, `从理解架构到做出取舍`, and `需要判断时快速查，系统学习时沿路径走，也从真实架构中理解取舍`.
- Current homepage product copy must not contain `让完整体系进入不同使用场景` or `三个方向并行演进，不代表固定顺序或发布日期`.
- The three approved bilingual direction names and their current HTML descriptions remain unchanged.
- Homepage images use only the site light palette `#f7f2e8`, `#fffaf0`, `#292723`, `#5d584f`, `#9f3f31`, `#d8cebf` or the dark palette `#1f1d1a`, `#292621`, `#eee7dc`, `#c5bbac`, `#e3907d`, `#62594e`.
- Do not use saturated blue, green completion semantics, orange current semantics, people, logos, signatures, watermarks, 3D, photorealism, circuit-board decoration, dates, progress, release flags, or delivery promises.
- Prefer the project-native `1672×941` canvas; never crop or distort a label or relationship to force a size.
- Every implementation task ends with a fresh independent review; do not continue with an unresolved Critical, High, Important, or Major finding.

---

## File Structure

- `static/img/illustrations/tego-arch-judgment-path-light.png` — light-theme homepage judgment-path illustration.
- `static/img/illustrations/tego-arch-judgment-path-dark.png` — exact dark-theme companion to the judgment-path illustration.
- `static/img/illustrations/tego-arch-use-modes-light.png` — light-theme homepage usage-modes illustration.
- `static/img/illustrations/tego-arch-use-modes-dark.png` — exact dark-theme companion to the usage-modes illustration.
- `src/pages/index.tsx` — homepage copy, `ThemedRoadmapImage`, and simplified section composition.
- `src/pages/index.module.css` — theme-native image containers and removal of obsolete roadmap-status presentation.
- `tests/readme-homepage-contributing.test.mjs` — PNG pair contracts, README preservation, and top-level homepage copy/assets.
- `tests/homepage-decision-observatory.test.mjs` — scoped component, theme switching, semantic alt, CSS, and user-facing-copy contracts.

---

### Task 0: Reconcile the approved design branch with remote main

**Files:**
- Preserve: `.codex/config.toml` (user-owned, untracked, never stage or copy into an isolated worktree)
- Verify: repository baseline only; no product file changes belong to this task

**Interfaces:**
- Consumes: the local approved design/plan commits and the latest `origin/main` commits.
- Produces: one non-rebased baseline containing both histories before implementation starts.

- [ ] **Step 1: Inspect the divergence without changing either history**

Run from the primary worktree:

```bash
git status --short --branch
git fetch origin
git rev-list --left-right --count main...origin/main
git log --oneline --decorate --graph --max-count=16 main origin/main
```

Expected: `.codex/config.toml` remains the only unrelated worktree entry; record the actual ahead/behind counts and confirm the local-only commits are the approved design and implementation-plan documents.

- [ ] **Step 2: Merge remote main into the local approved baseline**

Run:

```bash
git merge --no-edit origin/main
```

Do not rebase or force-update either history. If a conflict appears, preserve both the approved design/plan intent and the newer remote product behavior; resolve only after inspecting the complete conflicting files. Never include `.codex/config.toml` in the merge.

Expected: merge succeeds and `git rev-list --left-right --count main...origin/main` reports a nonzero-ahead/zero-behind result. The exact ahead count depends on whether Git creates a merge commit and whether the remote advances after planning.

- [ ] **Step 3: Verify the reconciled baseline before creating an isolated implementation worktree**

Run:

```bash
npm run verify
git diff --check
git status --short --branch
```

Expected: repository verification passes, diff check is empty, and the only untracked entry remains `.codex/config.toml`.

Then use `using-git-worktrees` to create an isolated `codex/` implementation branch from the reconciled local `main`. Do not copy `.codex/config.toml` into it.

---

### Task 1: Generate the light/dark judgment-path editorial pair

**Files:**
- Create: `static/img/illustrations/tego-arch-judgment-path-light.png`
- Create: `static/img/illustrations/tego-arch-judgment-path-dark.png`
- Modify: `tests/readme-homepage-contributing.test.mjs`

**Interfaces:**
- Consumes: the six-label closed vocabulary and site palette in the approved design spec.
- Produces: two `1672×941` PNGs used by `ThemedRoadmapImage` in Task 3.

- [ ] **Step 1: Add the failing judgment-path PNG pair contract**

After `readBinary` in `tests/readme-homepage-contributing.test.mjs`, add:

```js
const assertPng = (image, label) => {
  assert.ok(image.length > 50 * 1024, `${label} must exceed 50 KB`);
  assert.deepEqual(
    [...image.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    `${label} must be a PNG`,
  );
  assert.equal(image.toString('ascii', 12, 16), 'IHDR');
  assert.equal(image.readUInt32BE(16), 1672, `${label} width`);
  assert.equal(image.readUInt32BE(20), 941, `${label} height`);
};
```

Replace the current future-roadmap test’s repeated binary assertions with `assertPng(image, 'future roadmap')`, preserving its name and asset path.

Add immediately after it:

```js
test('ships matching light and dark judgment-path editorial assets', async () => {
  const [light, dark] = await Promise.all([
    readBinary('static/img/illustrations/tego-arch-judgment-path-light.png'),
    readBinary('static/img/illustrations/tego-arch-judgment-path-dark.png'),
  ]);

  assertPng(light, 'light judgment path');
  assertPng(dark, 'dark judgment path');
  assert.equal(light.readUInt32BE(16), dark.readUInt32BE(16));
  assert.equal(light.readUInt32BE(20), dark.readUInt32BE(20));
});
```

- [ ] **Step 2: Run the focused test and confirm the asset-only RED state**

Run:

```bash
node --test --test-name-pattern='judgment-path editorial assets' tests/readme-homepage-contributing.test.mjs
```

Expected: FAIL with `ENOENT` for `tego-arch-judgment-path-light.png`; no copy or source-ledger assertion should fail.

- [ ] **Step 3: Load the required image workflow instructions**

Read completely before generating:

```text
/Users/seal/.codex/skills/.system/imagegen/SKILL.md
.codex/skills/illustrating-architecture-articles/references/visual-language.md
.codex/skills/illustrating-architecture-articles/references/prompt-contract.md
.codex/skills/illustrating-architecture-articles/references/repository-integration.md
```

Record in `.superpowers/sdd/task-1-report.md`:

```text
格式判定：位图
决定因素：概念性学习主线；五个短阶段；不承担实时状态或精确项目进度。
视觉任务：overview flow
```

- [ ] **Step 4: Generate the light judgment-path master with built-in imagegen**

Call built-in `imagegen` with no reference input and this exact prompt:

```text
Use case: infographic-diagram
Asset type: Tego Arch homepage editorial roadmap, light theme
Primary request: show how architecture judgment develops through one simple five-step learning path, not a project delivery roadmap
Scene/backdrop: exact warm paper background #f7f2e8, seamless to the Tego Arch homepage
Style/medium: original restrained Chinese hand-drawn editorial line illustration; flat 2D ink and pencil texture; fewer borders, icons, and decorative marks than a whiteboard diagram; no named-artist imitation
Composition/framing: near-16:9 landscape on a 1672x941 canvas; one concise title; five equal stations in one clearly connected left-to-right path; generous outer margins; readable when rendered 358 px wide
Color palette: primary ink #292723, secondary ink #5d584f, brick-red emphasis #9f3f31, separator #d8cebf, optional raised paper #fffaf0; no other saturated hue
Text (verbatim and only): "架构判断的形成路径"; "基础与质量"; "建模与方法"; "模式与边界"; "治理与案例"; "学习与复盘"
Architecture: exactly five stations, in the supplied order, connected as one path; no branches, status colors, progress, current marker, or release endpoint
Critical boundary: the diagram teaches a reader-facing knowledge path; it must not show G identifiers, completion ratios, dates, flags, checkmarks, calendars, deployment steps, or delivery promises
Constraints: simplified Chinese exactly as supplied; each label appears exactly once; relationship remains clear without color; small project-neutral abstract icons only when they improve recognition
Avoid: extra text, pseudo-Chinese, English, blue, green, orange, paragraphs, thick card borders, glows, shadows, logos, signatures, watermarks, people, 3D, photorealism, circuit boards, copied layout
```

Copy the selected built-in output to:

`static/img/illustrations/tego-arch-judgment-path-light.png`

Do not leave the consumed asset only in the generator output directory.

- [ ] **Step 5: Verify dimensions and visually reject inaccurate light outputs**

Run:

```bash
sips -g pixelWidth -g pixelHeight static/img/illustrations/tego-arch-judgment-path-light.png
```

Expected: `pixelWidth: 1672`, `pixelHeight: 941`.

Inspect the original image with `view_image` and record PASS/FAIL for:

```text
Text: the six closed labels are exact, appear once, and no extra text exists.
Topology: five stations form one path in the approved order.
Scope: no G id, state, date, progress, flag, checkmark, release, or delivery promise.
Palette: only paper, ink, brick red, and muted separator colors are visible.
Hierarchy: title first; five equal stages second; no stage appears current or complete.
Responsive: every label remains readable at approximately 358 px width.
Originality: no person, logo, signature, watermark, copied composition, circuit motif, or 3D effect.
```

Reject and regenerate once with the same closed labels if any item fails. Do not repair text by painting over it with another tool.

- [ ] **Step 6: Edit the approved light master into the exact dark companion**

Call built-in `imagegen` as an edit with `referenced_image_paths` containing only the approved light master and this exact prompt:

```text
Create the exact dark-theme companion of the referenced Tego Arch judgment-path illustration.
Preserve verbatim every Chinese label, its count, spelling, order, geometry, station position, connector, icon, margin, and 1672x941 composition.
Change only the theme treatment:
- background #1f1d1a
- optional raised surface #292621
- primary ink #eee7dc
- secondary ink #c5bbac
- brick-red emphasis #e3907d
- separator #62594e
Keep the restrained hand-drawn editorial line texture.
No inversion artifacts, white rectangle, glow, new border, new icon, new label, removed label, moved connector, status color, date, progress, signature, logo, or watermark.
```

Save the selected edit as:

`static/img/illustrations/tego-arch-judgment-path-dark.png`

- [ ] **Step 7: Verify the dark companion against the light master**

Run the same `sips` command on the dark asset and inspect both images side by side with `view_image`.

Expected: both are `1672×941`; all six labels, station geometry, and connectors match; only background and palette differ. Record both files’ SHA-256 hashes in the task report.

- [ ] **Step 8: Run the focused contract and commit the pair**

Run:

```bash
node --test --test-name-pattern='judgment-path editorial assets' tests/readme-homepage-contributing.test.mjs
git diff --check
```

Expected: `1/1` focused test passes; `git diff --check` prints no output.

Commit only the pair and its test contract:

```bash
git add static/img/illustrations/tego-arch-judgment-path-light.png \
  static/img/illustrations/tego-arch-judgment-path-dark.png \
  tests/readme-homepage-contributing.test.mjs
git commit -m "feat(homepage): add themed judgment path artwork"
```

---

### Task 2: Generate the light/dark usage-modes editorial pair

**Files:**
- Create: `static/img/illustrations/tego-arch-use-modes-light.png`
- Create: `static/img/illustrations/tego-arch-use-modes-dark.png`
- Modify: `tests/readme-homepage-contributing.test.mjs`

**Interfaces:**
- Consumes: the Task 1 `assertPng(image, label)` helper and the approved four-label vocabulary.
- Produces: two `1672×941` PNGs used by `ThemedRoadmapImage` in Task 3.

- [ ] **Step 1: Add the failing usage-modes PNG pair contract**

Add after the judgment-path pair test:

```js
test('ships matching light and dark use-modes editorial assets', async () => {
  const [light, dark] = await Promise.all([
    readBinary('static/img/illustrations/tego-arch-use-modes-light.png'),
    readBinary('static/img/illustrations/tego-arch-use-modes-dark.png'),
  ]);

  assertPng(light, 'light use modes');
  assertPng(dark, 'dark use modes');
  assert.equal(light.readUInt32BE(16), dark.readUInt32BE(16));
  assert.equal(light.readUInt32BE(20), dark.readUInt32BE(20));
});
```

- [ ] **Step 2: Run the focused test and confirm the asset-only RED state**

Run:

```bash
node --test --test-name-pattern='use-modes editorial assets' tests/readme-homepage-contributing.test.mjs
```

Expected: FAIL with `ENOENT` for `tego-arch-use-modes-light.png`.

- [ ] **Step 3: Record the visual routing decision**

In `.superpowers/sdd/task-2-report.md`, record:

```text
格式判定：位图
决定因素：一个共同知识基础连接三种使用方式；概念性视觉总结；不承担交付顺序或状态事实。
视觉任务：visual summary
```

- [ ] **Step 4: Generate the light usage-modes master with built-in imagegen**

Call built-in `imagegen` with no reference input and this exact prompt:

```text
Use case: infographic-diagram
Asset type: Tego Arch homepage editorial usage map, light theme
Primary request: show that one architecture knowledge system can be used in three reader-facing ways: quick decision reference, curated learning, and a real reference architecture
Scene/backdrop: exact warm paper background #f7f2e8, seamless to the Tego Arch homepage
Style/medium: original restrained Chinese hand-drawn editorial line illustration; flat 2D ink and pencil texture; minimal borders and icons; no named-artist imitation
Composition/framing: near-16:9 landscape on a 1672x941 canvas; one concise title; one unlabeled shared foundation shape or symbol; exactly three equal destination panels branching independently from it; generous margins; readable at 358 px width
Color palette: primary ink #292723, secondary ink #5d584f, brick-red emphasis #9f3f31, separator #d8cebf, optional raised paper #fffaf0; no other saturated hue
Text (verbatim and only): "一套知识体系 三种用法"; "架构决策速查"; "精选学习路径"; "Tego 参考架构"
Architecture: one common foundation connects independently to exactly three equal directions; the directions have no connector or ordering relationship between them
Critical boundary: no date, sequence number, progress, status, current marker, completion marker, release milestone, delivery promise, English subtitle, or paragraph
Constraints: simplified Chinese exactly as supplied; every label appears exactly once; relationship remains clear without color; small project-neutral abstract icons only when useful
Avoid: extra text, pseudo-Chinese, English, blue, green, orange, thick card borders, glows, shadows, logos, signatures, watermarks, people, 3D, photorealism, circuit boards, copied layout
```

Save the selected output as:

`static/img/illustrations/tego-arch-use-modes-light.png`

- [ ] **Step 5: Verify the light master’s closed labels and topology**

Run `sips` and inspect at original detail. Record PASS/FAIL for:

```text
Text: all four closed labels are exact, appear once, and no extra text exists.
Topology: one shared foundation branches to exactly three equal directions.
Scope: no order, date, status, progress, English, release, or delivery promise.
Palette: only approved paper, ink, brick red, and separator tones.
Responsive: all four labels and the three-way relationship remain readable at 358 px.
Originality: no person, logo, signature, watermark, copied composition, circuit motif, or 3D effect.
```

Reject and regenerate once if any item fails.

- [ ] **Step 6: Edit the approved light master into the exact dark companion**

Call built-in `imagegen` as an edit referencing only the approved light master:

```text
Create the exact dark-theme companion of the referenced Tego Arch usage-modes illustration.
Preserve verbatim all four Chinese labels, their count, spelling, positions, foundation shape, three branch connectors, three destination geometries, icons, margins, and 1672x941 composition.
Change only the theme treatment:
- background #1f1d1a
- optional raised surface #292621
- primary ink #eee7dc
- secondary ink #c5bbac
- brick-red emphasis #e3907d
- separator #62594e
Keep the restrained hand-drawn editorial line texture.
No inversion artifacts, white rectangle, glow, new border, new icon, new label, removed label, moved connector, ordering cue, status, date, progress, signature, logo, or watermark.
```

Save as:

`static/img/illustrations/tego-arch-use-modes-dark.png`

- [ ] **Step 7: Verify the pair, run the contract, and commit**

Verify both dimensions with `sips`, inspect the pair side by side, and record SHA-256 hashes. Then run:

```bash
node --test --test-name-pattern='use-modes editorial assets' tests/readme-homepage-contributing.test.mjs
git diff --check
```

Expected: `1/1` passes and the diff check is empty.

Commit:

```bash
git add static/img/illustrations/tego-arch-use-modes-light.png \
  static/img/illustrations/tego-arch-use-modes-dark.png \
  tests/readme-homepage-contributing.test.mjs
git commit -m "feat(homepage): add themed usage artwork"
```

---

### Task 3: Replace homepage project language with themed reader-facing diagrams

**Files:**
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/index.module.css`
- Modify: `tests/readme-homepage-contributing.test.mjs`
- Modify: `tests/homepage-decision-observatory.test.mjs`

**Interfaces:**
- Consumes: the four Task 1–2 image paths and Docusaurus `ThemedComponent` named export.
- Produces: `ThemedRoadmapImage(props: ThemedRoadmapImageProps)`, a simplified `RoadmapSection`, and the revised `FutureDirectionsSection`.

- [ ] **Step 1: Replace top-level homepage expectations with the approved product contract**

In the homepage test in `tests/readme-homepage-contributing.test.mjs`, replace the current roadmap/future copy assertions with:

```js
  for (const path of [
    'tego-arch-judgment-path-light.png',
    'tego-arch-judgment-path-dark.png',
    'tego-arch-use-modes-light.png',
    'tego-arch-use-modes-dark.png',
  ]) {
    assert.match(homepage, new RegExp(path.replace('.', String.raw`\.`), 'u'));
  }
  assert.match(homepage, /label="01 \/ 判断路径"/u);
  assert.match(homepage, /title="建立架构判断的主线"/u);
  assert.match(
    homepage,
    /从基础与质量出发，经过建模、模式与治理，在案例和复盘中形成判断/u,
  );
  assert.match(homepage, /label="04 \/ 使用方式"/u);
  assert.match(homepage, /title="从理解架构到做出取舍"/u);
  assert.match(
    homepage,
    /需要判断时快速查，系统学习时沿路径走，也从真实架构中理解取舍/u,
  );
  assert.doesNotMatch(
    homepage,
    /tego-arch-initial-release-roadmap\.png|tego-arch-future-directions\.png|让完整体系进入不同使用场景|三个方向并行演进，不代表固定顺序或发布日期/u,
  );
```

Keep the bilingual direction loop, contribution URL, section order, and general style assertions unchanged.

- [ ] **Step 2: Replace the old roadmap-detail contracts with theme-scoped user-facing contracts**

In `tests/homepage-decision-observatory.test.mjs`, replace the entire test named `keeps roadmap details available without forcing them into the reading flow` with:

```js
test('presents a themed judgment path without homepage project status', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(homepage, /import \{ThemedComponent\} from '@docusaurus\/theme-common';/u);
  const themedImage = homepage.match(
    /function ThemedRoadmapImage\([\s\S]*?\n\}/u,
  );
  assert.ok(themedImage, 'themed roadmap image component must remain statically inspectable');
  assert.match(themedImage[0], /theme === 'dark' \? darkImageSrc : lightImageSrc/u);
  assert.match(themedImage[0], /width=\{1672\}/u);
  assert.match(themedImage[0], /height=\{941\}/u);
  assert.match(themedImage[0], /loading="lazy"/u);
  assert.match(themedImage[0], /decoding="async"/u);
  assert.match(themedImage[0], /alt=\{alt\}/u);

  const roadmapSection = homepage.match(
    /function RoadmapSection\(\): ReactNode \{([\s\S]*?)\n\}\n\nfunction EntrySection/u,
  );
  assert.ok(roadmapSection, 'judgment path section must remain statically inspectable');
  for (const path of [
    '/img/illustrations/tego-arch-judgment-path-light.png',
    '/img/illustrations/tego-arch-judgment-path-dark.png',
  ]) {
    assert.match(roadmapSection[1], new RegExp(path.replaceAll('/', String.raw`\/`).replace('.', String.raw`\.`), 'u'));
  }
  assert.match(
    roadmapSection[1],
    /alt="架构判断从基础与质量出发，经过建模、模式与治理，在案例和复盘中逐步形成"/u,
  );
  assert.doesNotMatch(
    homepage,
    /RoadmapStatusContent|roadmapDesktopInfo|roadmapInfoPanel|roadmapMobileDetails|初版路线图 · 2026-08-05 快照|状态与图例说明|查看项目进度/u,
  );
  assert.doesNotMatch(styles, /\.roadmap(?:DesktopInfo|InfoControl|InfoPanel|MobileDetails|Meta)/u);
  assert.doesNotMatch(styles, /\.roadmapMedia::after/u);
  assert.doesNotMatch(cssBlock(styles, '.roadmapMedia'), /\b(?:border|box-shadow)\s*:/u);
});
```

Replace the test named `presents future directions as an accessible parallel roadmap` with:

```js
test('presents themed usage modes with semantic bilingual cards', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  const futureDirectionsSection = homepage.match(
    /function FutureDirectionsSection\(\): ReactNode \{([\s\S]*?)\n\}\n\nfunction ContributionBand/u,
  );
  assert.ok(futureDirectionsSection, 'future directions section must remain statically inspectable');
  for (const path of [
    '/img/illustrations/tego-arch-use-modes-light.png',
    '/img/illustrations/tego-arch-use-modes-dark.png',
  ]) {
    assert.match(
      futureDirectionsSection[1],
      new RegExp(path.replaceAll('/', String.raw`\/`).replace('.', String.raw`\.`), 'u'),
    );
  }
  assert.match(
    futureDirectionsSection[1],
    /alt="一套架构知识体系可以用于快速校准决策、组织学习路径和理解 Tego 的真实架构取舍"/u,
  );
  assert.match(
    futureDirectionsSection[1],
    /futureDirections\.map\([\s\S]*<Heading as="h3">\{direction\.title\}<\/Heading>[\s\S]*\{direction\.term\}/u,
  );
  assert.match(styles, /\.futureRoadmap\s*\{[^}]*max-width:\s*64rem;[^}]*margin:\s*0 auto 2rem;/u);
  assert.match(styles, /\.futureTerm\s*\{[^}]*font-family:\s*var\(--atlas-mono\);/u);
  assert.match(styles, /@media \(max-width: 996px\)[\s\S]*\.futureList\s*\{[^}]*grid-template-columns:\s*1fr;/u);
});
```

Replace the reader-facing roadmap-copy test’s two positive assertions with:

```js
  for (const text of [
    '建立架构判断的主线',
    '从基础与质量出发，经过建模、模式与治理，在案例和复盘中形成判断',
    '从理解架构到做出取舍',
    '需要判断时快速查，系统学习时沿路径走，也从真实架构中理解取舍',
  ]) {
    assert.match(homepage, new RegExp(text, 'u'));
  }
```

Extend its forbidden list with the two removed project-planning phrases.

- [ ] **Step 3: Run the focused tests and confirm the expected integration RED state**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs tests/homepage-decision-observatory.test.mjs
```

Expected: both PNG pair tests remain green; integration tests fail on the old homepage asset paths, copy, status components, and missing `ThemedRoadmapImage` / `ThemedComponent` contracts.

- [ ] **Step 4: Add the theme-native image component**

In `src/pages/index.tsx`, add this import with the Docusaurus imports:

```tsx
import {ThemedComponent} from '@docusaurus/theme-common';
```

After `SectionIntro`, add:

```tsx
type ThemedRoadmapImageProps = Readonly<{
  lightSrc: string;
  darkSrc: string;
  alt: string;
}>;

function ThemedRoadmapImage({lightSrc, darkSrc, alt}: ThemedRoadmapImageProps): ReactNode {
  const lightImageSrc = useBaseUrl(lightSrc);
  const darkImageSrc = useBaseUrl(darkSrc);

  return (
    <ThemedComponent>
      {({theme, className}) => (
        <img
          className={`${styles.roadmapImage} ${className}`}
          src={theme === 'dark' ? darkImageSrc : lightImageSrc}
          width={1672}
          height={941}
          loading="lazy"
          decoding="async"
          alt={alt}
        />
      )}
    </ThemedComponent>
  );
}
```

Delete `RoadmapStatusContent`; it has no homepage consumer after the next step.

- [ ] **Step 5: Replace RoadmapSection with the user-facing judgment path**

Replace the complete `RoadmapSection` with:

```tsx
function RoadmapSection(): ReactNode {
  return (
    <section className={`${styles.pageSection} ${styles.roadmapSection}`} aria-labelledby="roadmap-title">
      <div className="container">
        <SectionIntro
          id="roadmap-title"
          label="01 / 判断路径"
          title="建立架构判断的主线"
          description="从基础与质量出发，经过建模、模式与治理，在案例和复盘中形成判断"
        />
        <div className={styles.roadmapMedia}>
          <ThemedRoadmapImage
            lightSrc="/img/illustrations/tego-arch-judgment-path-light.png"
            darkSrc="/img/illustrations/tego-arch-judgment-path-dark.png"
            alt="架构判断从基础与质量出发，经过建模、模式与治理，在案例和复盘中逐步形成"
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Replace FutureDirectionsSection copy and artwork**

Remove the local `futureRoadmapSrc` variable and replace the `SectionIntro` plus roadmap image block with:

```tsx
        <SectionIntro
          id="future-title"
          label="04 / 使用方式"
          title="从理解架构到做出取舍"
          description="需要判断时快速查，系统学习时沿路径走，也从真实架构中理解取舍"
        />
        <div className={`${styles.roadmapMedia} ${styles.futureRoadmap}`}>
          <ThemedRoadmapImage
            lightSrc="/img/illustrations/tego-arch-use-modes-light.png"
            darkSrc="/img/illustrations/tego-arch-use-modes-dark.png"
            alt="一套架构知识体系可以用于快速校准决策、组织学习路径和理解 Tego 的真实架构取舍"
          />
        </div>
```

Keep the `futureDirections.map` list unchanged.

- [ ] **Step 7: Remove obsolete status CSS and the white feather overlay**

In `src/pages/index.module.css`, replace the current roadmap base block with:

```css
.roadmapSection {
  background: var(--atlas-paper-muted);
}

.roadmapMedia {
  max-width: 68rem;
  margin: 0 auto;
  overflow: hidden;
  background: var(--atlas-paper);
}

.roadmapImage {
  display: block;
  width: 100%;
  height: auto;
}
```

Delete every complete rule for:

```text
.roadmapFigure
.roadmapMedia::after
.roadmapMeta
.roadmapDesktopInfo
.roadmapInfoControl
.roadmapInfoPanel
.roadmapInfoPanel::after
.roadmapDesktopInfo:hover .roadmapInfoPanel,
.roadmapDesktopInfo:focus-within .roadmapInfoPanel
.roadmapLargeLink
.roadmapMobileDetails
.roadmapMobileDetails summary
.roadmapMobileDetails > div
```

Delete the corresponding selectors from the `@media (max-width: 996px)` block. Keep `.futureRoadmap`, `.futureList`, `.futureTerm`, and the mobile single-column rule.

- [ ] **Step 8: Run focused tests and leakage checks**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs tests/homepage-decision-observatory.test.mjs
rg -n "让完整体系进入不同使用场景|三个方向并行演进，不代表固定顺序或发布日期|初版路线图 · 2026-08-05 快照|状态与图例说明|查看项目进度" src/pages/index.tsx
git diff --check
```

Expected: `19/19` focused tests pass; both `rg` and `git diff --check` print no output.

- [ ] **Step 9: Verify README, governance, types, and production build**

Run:

```bash
git diff --exit-code HEAD -- README.md
git diff HEAD -- data/source-ledger.json src/generated/source-ledger.json package.json package-lock.json
npm run typecheck
npm run build
```

Expected: README and governance diffs are empty; TypeScript exits 0; Docusaurus reports `Generated static files in "build"`.

- [ ] **Step 10: Commit the homepage integration**

```bash
git add src/pages/index.tsx src/pages/index.module.css \
  tests/readme-homepage-contributing.test.mjs \
  tests/homepage-decision-observatory.test.mjs
git commit -m "feat(homepage): center roadmap visuals on readers"
```

---

### Task 4: Verify the complete themed homepage change

**Files:**
- Verify: `README.md`
- Verify: `src/pages/index.tsx`
- Verify: `src/pages/index.module.css`
- Verify: `static/img/illustrations/tego-arch-judgment-path-light.png`
- Verify: `static/img/illustrations/tego-arch-judgment-path-dark.png`
- Verify: `static/img/illustrations/tego-arch-use-modes-light.png`
- Verify: `static/img/illustrations/tego-arch-use-modes-dark.png`
- Verify: `tests/readme-homepage-contributing.test.mjs`
- Verify: `tests/homepage-decision-observatory.test.mjs`

**Interfaces:**
- Consumes: the committed asset pairs and homepage integration from Tasks 1–3.
- Produces: complete repository evidence, four-viewport theme evidence, and an independent merge-readiness verdict.

- [ ] **Step 1: Run the complete repository gate**

Run:

```bash
npm run verify
```

Expected: all Node tests, 94 or more content documents, all governed sources, generated-content checks, offline-link checks, review health, TypeScript, and the production build pass. Record actual counts instead of copying counts from this plan.

- [ ] **Step 2: Serve the production build**

Run in a persistent terminal:

```bash
npm run serve -- --host 127.0.0.1 --port 4180 --no-open
```

Expected: `http://127.0.0.1:4180/tego-arch/` responds successfully.

- [ ] **Step 3: Perform four-viewport visual and theme-switch QA**

Use `browser:control-in-app-browser` and inspect:

```text
1440×1000 light
1440×1000 dark
390×844 light
390×844 dark
```

For each viewport record PASS/FAIL for:

```text
Section 01 says judgment path, not initial-release project status.
Section 04 says usage modes and reader value, not sequence/date policy.
The judgment-path image uses the correct current-theme asset.
The usage-modes image uses the correct current-theme asset.
No white glowing rectangle, hard image edge, saturated blue/green/orange, crop, or horizontal overflow appears.
All six judgment-path labels and all four usage-mode labels are readable.
Three bilingual HTML cards remain readable and do not collide.
Images support the hierarchy instead of competing with headings and body text.
Switching the site theme updates both images without stale assets or layout shift.
No information depends on hover.
Console errors from the new component or assets equal zero.
```

If a CSS or component defect appears, add one focused failing assertion before the smallest fix, rerun the focused tests, then repeat all four viewports. Do not edit approved copy or image labels during responsive fixes.

- [ ] **Step 4: Verify README, rights, source governance, and asset reachability**

Run:

```bash
git diff origin/main...HEAD -- README.md data/source-ledger.json src/generated/source-ledger.json package.json package-lock.json
rg -n "tego-arch-initial-release-roadmap\.png|tego-arch-future-directions\.png" README.md
rg -n "文章与原创插图" LICENSE-CONTENT.md
rg -n "第三方|不重新授权" NOTICE.md
```

Expected: scoped diff is empty; README still names both original images; existing rights boundaries remain present.

Record in the final report:

```text
Source-ledger registration gap: the four editorial assets are used only by src/pages/index.tsx, while ledger document keys are restricted to content/*.mdx. No orphan source or false content citation was added. LICENSE-CONTENT.md and NOTICE.md cover the project-owned illustrations; register a dedicated source only if a real content document later embeds one.
```

- [ ] **Step 5: Request independent whole-branch review**

Prepare a base-to-head review package and ask a fresh reviewer to check:

```text
Approved section 01 and 04 copy is exact and reader-facing.
Removed homepage project-status and delivery-policy copy is absent.
README and both original detailed image references are unchanged.
Each light/dark asset pair has exact labels, topology, dimensions, and theme palette.
ThemedComponent uses only Docusaurus theme context and preserves semantic alt, fixed dimensions, lazy loading, and async decoding.
Obsolete status disclosure CSS and white feather overlay are fully removed without unrelated style loss.
Mobile, desktop, light, dark, and live theme switching evidence is sufficient.
No source-ledger, generated ledger, dependency, project-status, backlog, or content change entered the branch.
Regression tests are scoped to the correct component and cannot be satisfied by an unrelated image.
```

Resolve every Critical, High, Important, or Major finding with a regression test first. Repeat review until the reviewer states `Findings: none` or explicitly confirms that only non-blocking LOW observations remain and `Ready to merge: yes`.

- [ ] **Step 6: Run final clean-state verification**

Run fresh after the last review fix:

```bash
npm run verify
git diff --check
git status --short --branch
git diff --name-status origin/main...HEAD
```

Expected: the full gate passes; the diff check is empty; the worktree is clean; product changes are limited to four new assets, homepage TSX/CSS, and the two focused test files, plus the approved design/plan documents carried by the branch.

Use `finishing-a-development-branch` to offer local merge, push/PR, keep, or discard. Do not push or deploy until the user selects that option.
