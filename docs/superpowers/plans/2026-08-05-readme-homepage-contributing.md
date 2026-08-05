# Tego Arch README and Homepage Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a repository README and a positioning-first website homepage that explain Tego Arch's audience, initial-release roadmap, future derivative products, contribution workflow, and Apache-2.0/CC BY 4.0 licensing boundary.

**Architecture:** Keep `src/generated/project-status.json` as the homepage's only live status projection and `docs/content-backlog.md` as the exact human-maintained task source. Reuse the generated roadmap PNG as a conceptual overview in README and homepage, add static future-product cards without creating empty routes, and express licensing through three root policy files plus footer links. Add one focused Node test file that locks the repository-facing contract before changing each surface.

**Tech Stack:** Docusaurus 3.10.2, React 19, TypeScript 6, CSS Modules, Node.js test runner, Markdown, Apache-2.0, CC BY 4.0.

## Global Constraints

- Node.js remains `>=24.0`; do not change dependencies or package-manager files.
- `docs/content-backlog.md` remains the only manually maintained exact task-status source.
- `src/generated/project-status.json` remains the homepage status projection; do not hard-code a second numeric status block.
- Code, scripts, tests, configuration, and tooling are Apache-2.0; project-authored articles and original illustrations are CC BY 4.0.
- Third-party sources, quotations, images, trademarks, and linked works retain their own rights and are not relicensed.
- The roadmap is a conceptual overview, not the exact definition of the 20 durable stories.
- Do not create routes or links for the three future products until real content exists.
- Preserve the existing content sections, case order, generated indexes, and navigation routes.
- Do not modify `.codex/config.toml`; it is an unrelated existing untracked file.
- Use TDD: each implementation task begins with a failing contract test and ends with a focused passing test plus a reviewable commit.

---

## File Structure

### New files

- `README.md` — repository positioning, roadmap, local setup, contribution workflow, and license summary.
- `LICENSE` — canonical Apache License 2.0 legal text for project-owned code surfaces.
- `LICENSE-CONTENT.md` — CC BY 4.0 scope and attribution instructions for project-authored articles and illustrations.
- `NOTICE.md` — dual-license scope, third-party exclusions, and non-endorsement boundary.
- `tests/readme-homepage-contributing.test.mjs` — focused contract tests for repository documentation, homepage sections, and footer licensing.

### Existing files modified

- `src/pages/index.tsx` — new positioning copy, roadmap section, future-product section, and contribution link.
- `src/pages/index.module.css` — responsive roadmap and future-product presentation.
- `docusaurus.config.ts` — dual-license footer links and copyright wording.
- `static/img/illustrations/tego-arch-initial-release-roadmap.png` — already generated and visually reviewed; add it to version control.

### Explicitly unchanged

- `docs/content-backlog.md` — no task state changes.
- `src/generated/project-status.json` — no manual edits.
- `data/source-ledger.json` — no false MDX citation; README/homepage use is covered by `LICENSE-CONTENT.md` until an actual governed MDX article cites the image.

---

### Task 1: Lock and publish the dual-license boundary

**Files:**
- Create: `LICENSE`
- Create: `LICENSE-CONTENT.md`
- Create: `NOTICE.md`
- Create: `tests/readme-homepage-contributing.test.mjs`

**Interfaces:**
- Consumes: the approved license decision in `docs/superpowers/specs/2026-08-05-readme-homepage-contributing-design.md`.
- Produces: three stable root policy paths consumed by README and footer links: `/LICENSE`, `/LICENSE-CONTENT.md`, `/NOTICE.md`.

- [ ] **Step 1: Write the failing license contract test**

Create `tests/readme-homepage-contributing.test.mjs` with:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('publishes separate code, content, and third-party license boundaries', async () => {
  const [codeLicense, contentLicense, notice] = await Promise.all([
    read('LICENSE'),
    read('LICENSE-CONTENT.md'),
    read('NOTICE.md'),
  ]);

  assert.match(codeLicense, /Apache License\s+Version 2\.0, January 2004/u);
  assert.match(codeLicense, /http:\/\/www\.apache\.org\/licenses\//u);

  assert.match(contentLicense, /Creative Commons Attribution 4\.0 International/u);
  assert.match(contentLicense, /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//u);
  assert.match(contentLicense, /文章与原创插图/u);
  assert.match(contentLicense, /署名/u);
  assert.match(contentLicense, /说明修改/u);

  assert.match(notice, /第三方/u);
  assert.match(notice, /不重新授权/u);
  assert.match(notice, /商标/u);
  assert.match(notice, /source ledger/u);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
```

Expected: FAIL with `ENOENT` for `LICENSE`, `LICENSE-CONTENT.md`, or `NOTICE.md`.

- [ ] **Step 3: Add the three policy files**

Create `LICENSE` from the complete, unmodified canonical Apache License 2.0 legal text published at `https://www.apache.org/licenses/LICENSE-2.0.txt`. The file must begin:

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/
```

and end with the canonical `END OF TERMS AND CONDITIONS` appendix text. Do not add project-specific scope language inside the canonical license; scope belongs in `NOTICE.md`.

Create `LICENSE-CONTENT.md` with this complete project notice:

```markdown
# Tego Arch 内容许可证

除非文件或页面另有说明，Tego Arch 项目自行创作并拥有权利的中文文章与原创插图采用 [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)（CC BY 4.0）许可。

你可以复制、分发、展示、改编并用于商业目的，但必须：

1. 以合理方式署名“Tego Arch contributors”；
2. 链接到 CC BY 4.0 许可证；
3. 说明是否作出修改；
4. 不暗示 Tego Arch 或贡献者为你的使用背书。

此许可只覆盖 Tego Arch 对相关作品拥有权利的部分，不覆盖第三方来源、短引用、外部图片、商标、链接作品或 source ledger 中标记为其他许可证的材料。详细边界见 [NOTICE.md](./NOTICE.md)。
```

Create `NOTICE.md` with this complete scope statement:

```markdown
# Tego Arch 版权与第三方材料说明

Copyright © Tego Arch contributors.

- 项目自有源代码、构建脚本、测试、配置和工具代码依照 [Apache License 2.0](./LICENSE) 提供。
- 项目自有中文文章与原创插图依照 [CC BY 4.0](./LICENSE-CONTENT.md) 提供。
- 第三方来源、短引用、外部图片、商标和链接作品继续受各自许可证或权利约束；Tego Arch 的许可证不重新授权这些材料。
- `data/source-ledger.json` 中记录的许可证只覆盖该记录明确限定的作品范围，不能扩展到其外链、商标或第三方资产。
- 事实性总结、链接和引用不表示 Tego Arch 获得了原作品的版权，也不表示原作者为本站背书。

如果具体文件、页面或图片带有更窄的许可证或使用边界，以该具体说明为准。
```

- [ ] **Step 4: Run the license contract test and verify GREEN**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
```

Expected: PASS, `1` test passed.

- [ ] **Step 5: Review and commit the license boundary**

Run:

```bash
git diff --check -- LICENSE LICENSE-CONTENT.md NOTICE.md tests/readme-homepage-contributing.test.mjs
git diff -- LICENSE-CONTENT.md NOTICE.md tests/readme-homepage-contributing.test.mjs
```

Confirm the canonical Apache text is unmodified and the project-specific scope appears only in the Markdown notices.

Commit:

```bash
git add LICENSE LICENSE-CONTENT.md NOTICE.md tests/readme-homepage-contributing.test.mjs
git commit -m "docs: define code and content licenses"
```

---

### Task 2: Create the positioning-first README and add the roadmap asset

**Files:**
- Create: `README.md`
- Modify: `tests/readme-homepage-contributing.test.mjs`
- Add: `static/img/illustrations/tego-arch-initial-release-roadmap.png`

**Interfaces:**
- Consumes: `LICENSE`, `LICENSE-CONTENT.md`, `NOTICE.md`, `docs/content-backlog.md`, and the existing PNG at `static/img/illustrations/tego-arch-initial-release-roadmap.png`.
- Produces: stable GitHub anchors `#初版方向`, `#初版之后`, `#本地开发`, `#参与贡献`, and `#许可证与第三方材料` for homepage and contributors.

- [ ] **Step 1: Extend the test with the README contract**

Append:

```js
test('README positions the project, shows the roadmap, and closes the contribution loop', async () => {
  const readme = await read('README.md');

  assert.match(readme, /面向有经验的高级工程师/u);
  assert.match(readme, /从实现到架构决策/u);
  assert.match(
    readme,
    /static\/img\/illustrations\/tego-arch-initial-release-roadmap\.png/u,
  );
  assert.match(readme, /精确进度.*docs\/content-backlog\.md/su);
  assert.match(readme, /便携小抄/u);
  assert.match(readme, /精华学习路线/u);
  assert.match(readme, /Tego 实践与规划/u);
  assert.match(readme, /Node\.js.*>=24\.0/su);
  assert.match(readme, /npm ci/u);
  assert.match(readme, /npm run start/u);
  assert.match(readme, /npm run verify/u);
  assert.match(readme, /data\/source-ledger\.json/u);
  assert.match(readme, /LICENSE-CONTENT\.md/u);
  assert.match(readme, /NOTICE\.md/u);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
```

Expected: the license test passes and the README test fails with `ENOENT` for `README.md`.

- [ ] **Step 3: Create README.md with the approved information architecture**

Create the following complete section structure and copy. Keep paragraphs concise; do not add badges that require third-party services.

```markdown
# Tego Arch

面向有经验的高级工程师，用证据、权衡与真实案例训练从实现到架构决策的能力。

[在线阅读](https://sealday.github.io/tego-arch/) · [学习路径](https://sealday.github.io/tego-arch/paths) · [案例库](https://sealday.github.io/tego-arch/cases) · [参与贡献](#参与贡献)

Tego Arch 不是架构名词或外部链接的重新排列。项目把架构基础、质量属性、设计方法、原则、建模、模式、风格与真实案例内化为可独立阅读、可验证、可比较的中文知识体系，并明确区分事实、基于证据的推断、本站分析与未知项。

## 初版方向

初版以“完整”为目标：沿 20 个持久故事建立从内容治理到架构知识、生产实践、案例与练习的闭环。每个阶段都必须经过验证、独立评审、发布和线上检查。

![Tego Arch 初版发布路线图](static/img/illustrations/tego-arch-initial-release-roadmap.png)

路线图是阶段概览，不是实时任务清单。精确进度、当前故事和停止条件只在 [`docs/content-backlog.md`](docs/content-backlog.md) 维护。

## 适合谁

- 已有扎实开发经验，准备承担架构设计、技术决策或跨团队协作职责；
- 希望从业务目标和质量属性推导架构，而不是先选模式或产品；
- 需要系统训练边界、控制权、状态、失败恢复、安全、观测、成本与演化判断；
- 愿意回到标准、官方文档、论文、源码和一手工程材料核对结论。

如果你只需要框架功能清单、面试速记或可以直接复制的“最佳架构”，这里可能不适合你。

## 如何使用

1. 从[学习路径](https://sealday.github.io/tego-arch/paths)建立主线；
2. 用[真实案例](https://sealday.github.io/tego-arch/cases)观察控制、状态和故障边界；
3. 在原则、质量属性、方法、建模、模式与风格之间比较相邻选择；
4. 通过资料库回到一手来源，通过设计题检验自己的取舍。

## 初版之后

### 便携小抄

从完整版提炼第一性原理、关键判断和高代价错误提醒，以尽可能小的记忆占用帮助你在关键时刻不犯基础性错误。

### 精华学习路线

从完整版选择一组连贯主题，形成更短、更易进入的学习线索，服务更广泛的工程师群体，同时保留回到完整证据和边界的链接。

### Tego 实践与规划

说明这些架构判断在 Tego 设计中的实际应用位置、当前取舍与未来规划。真实材料形成后再发布入口，不提前创建空白栏目。

## 本地开发

要求 Node.js `>=24.0`。

```bash
npm ci
npm run start
```

提交前运行完整验证：

```bash
npm run verify
```

需要重新联网检查外部链接时，单独运行 `npm run check:links:live`。

## 参与贡献

欢迎贡献以下内容：

- 内容：概念、原则、质量属性、方法、建模、模式、风格、案例、反模式和设计题；
- 证据：来源补充、版本固定、错误纠正、失效链接和许可证边界；
- 图示：原创位图、Mermaid 或 Draw.io + SVG；
- 工程：内容契约、生成器、验证、可访问性、性能和导航改进。

小型事实纠错、错别字、失效链接和局部测试修复可以直接提交 PR。新主题、页面结构变化、许可证变化、来源模型变化或跨页面重构，请先创建 issue，写明读者问题、范围、来源候选和停止条件。

贡献时请遵守：

1. 从 [`docs/content-backlog.md`](docs/content-backlog.md) 读取活跃任务；历史 spec/plan 不恢复为活任务。
2. 优先使用标准、原作者、官方文档、论文、源码和一手工程材料；Awesome、路线图和聚合索引只用于 discovery/learning。
3. 明确区分事实、基于证据的推断、厂商自述、本站分析和未知项。
4. 使用原创中文表达，不逐段翻译，不复制第三方图表或目录文案。
5. 把外部来源登记到 [`data/source-ledger.json`](data/source-ledger.json)，让正文 citation、许可证和使用角色闭合。
6. 图示遵守 [项目插图技能](.codex/skills/illustrating-architecture-articles/SKILL.md) 的格式决策与集成规则。
7. 提交前运行 `npm run verify`，并完成 PR 模板中的来源与版权检查。

## 许可证与第三方材料

- 项目自有代码、构建脚本、测试、配置和工具代码：[Apache License 2.0](LICENSE)。
- 项目自有中文文章与原创插图：[CC BY 4.0](LICENSE-CONTENT.md)。
- 第三方来源、短引用、外部图片、商标和链接作品不被上述许可证重新授权，详见 [NOTICE.md](NOTICE.md) 与 [`data/source-ledger.json`](data/source-ledger.json)。
```

- [ ] **Step 4: Verify and stage the image asset**

Run:

```bash
file static/img/illustrations/tego-arch-initial-release-roadmap.png
sips -g pixelWidth -g pixelHeight static/img/illustrations/tego-arch-initial-release-roadmap.png
```

Expected: PNG, `1672 x 941`, RGB, no alpha requirement.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
```

Expected: PASS, `2` tests passed.

- [ ] **Step 6: Review and commit README plus roadmap**

Run:

```bash
git diff --check -- README.md tests/readme-homepage-contributing.test.mjs
git diff -- README.md tests/readme-homepage-contributing.test.mjs
```

Commit:

```bash
git add README.md tests/readme-homepage-contributing.test.mjs static/img/illustrations/tego-arch-initial-release-roadmap.png
git commit -m "docs: add project README and roadmap"
```

---

### Task 3: Add homepage positioning, roadmap, and future-product sections

**Files:**
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/index.module.css`
- Modify: `tests/readme-homepage-contributing.test.mjs`

**Interfaces:**
- Consumes: `projectStatus`, `useBaseUrl`, the public asset path `/img/illustrations/tego-arch-initial-release-roadmap.png`, and the README anchor `#参与贡献`.
- Produces: `RoadmapSection` and `FutureDeliverablesSection` React components rendered immediately after `Hero`.

- [ ] **Step 1: Extend the test with the homepage contract**

Append:

```js
test('homepage leads with the transition to architecture design and the release roadmap', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(homepage, /从高级工程师到架构设计者/u);
  assert.match(homepage, /面向有经验的高级工程师/u);
  assert.match(homepage, /tego-arch-initial-release-roadmap\.png/u);
  assert.match(homepage, /Tego Arch 初版发布路线图/u);
  assert.match(homepage, /docs\/content-backlog\.md/u);
  assert.match(homepage, /便携小抄/u);
  assert.match(homepage, /精华学习路线/u);
  assert.match(homepage, /Tego 实践与规划/u);
  assert.match(homepage, /https:\/\/github\.com\/sealday\/tego-arch#参与贡献/u);

  assert.match(styles, /\.roadmapSection/u);
  assert.match(styles, /\.roadmapImage/u);
  assert.match(styles, /\.futureGrid/u);
  assert.match(styles, /@media\s*\(max-width:\s*996px\)/u);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
```

Expected: first two tests pass; homepage test fails on missing positioning or roadmap text.

- [ ] **Step 3: Add the homepage data and components**

In `src/pages/index.tsx`, add:

```tsx
import useBaseUrl from '@docusaurus/useBaseUrl';
```

Add after `expansionPorts`:

```tsx
const futureDeliverables = [
  {
    index: '01',
    title: '便携小抄',
    description:
      '提炼第一性原理、关键判断和高代价错误提醒，以尽可能小的记忆占用守住关键决策。',
  },
  {
    index: '02',
    title: '精华学习路线',
    description:
      '从完整版选择一组连贯主题，形成更短、更易进入，同时能回到完整证据的学习线索。',
  },
  {
    index: '03',
    title: 'Tego 实践与规划',
    description:
      '说明这些架构判断在 Tego 设计中的应用位置、当前取舍与未来规划。',
  },
] as const;

function RoadmapSection(): ReactNode {
  const roadmapSrc = useBaseUrl(
    '/img/illustrations/tego-arch-initial-release-roadmap.png',
  );

  return (
    <section className={styles.roadmapSection} aria-labelledby="roadmap-title">
      <div className="container">
        <SectionHeading
          id="roadmap-title"
          eyebrow="INITIAL RELEASE"
          title="初版先完成一套完整的架构知识体系"
          description="路线图展示阶段顺序；精确任务、当前故事与停止条件只在长期 backlog 维护。"
        />
        <figure className={styles.roadmapFigure}>
          <img
            className={styles.roadmapImage}
            src={roadmapSrc}
            width={1672}
            height={941}
            loading="eager"
            alt="Tego Arch 从基线与知识主干，经架构风格、领域模式、治理专题和学习闭环走向初版发布的路线图"
          />
          <figcaption>
            这是执行概览，不是实时任务清单。{' '}
            <Link href="https://github.com/sealday/tego-arch/blob/main/docs/content-backlog.md">
              查看最新 backlog <span aria-hidden="true">↗</span>
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function FutureDeliverablesSection(): ReactNode {
  return (
    <section className={styles.futureSection} aria-labelledby="future-title">
      <div className="container">
        <SectionHeading
          id="future-title"
          eyebrow="AFTER THE COMPLETE EDITION"
          title="从完整版继续提炼三类产物"
          description="先建立完整上下文，再针对记忆、学习和实践形成更轻的入口。"
        />
        <div className={styles.futureGrid}>
          {futureDeliverables.map((deliverable) => (
            <article className={styles.futureCard} key={deliverable.index}>
              <span aria-hidden="true">{deliverable.index}</span>
              <Heading as="h3">{deliverable.title}</Heading>
              <p>{deliverable.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Change `Hero` copy and actions to:

```tsx
<Heading as="h1">从高级工程师到架构设计者。</Heading>
<p className={styles.lede}>
  面向有经验的高级工程师，用证据、权衡与真实案例训练从实现到架构决策的能力。
</p>
<div className={styles.heroActions}>
  <Link className={styles.primaryAction} to="/paths">
    沿学习路径开始 <span aria-hidden="true">→</span>
  </Link>
  <Link
    className={styles.secondaryAction}
    href="https://github.com/sealday/tego-arch#参与贡献">
    参与贡献
  </Link>
</div>
```

Update `Layout` description to the same audience positioning. Render the new sections immediately after `<Hero />`:

```tsx
<Hero />
<main>
  <RoadmapSection />
  <FutureDeliverablesSection />
  {/* preserve every existing section below */}
</main>
```

Update the existing contribution primary link to `https://github.com/sealday/tego-arch#参与贡献` and change its paragraph to mention content, evidence corrections, original diagrams, and engineering improvements.

- [ ] **Step 4: Add responsive CSS for the new sections**

In `src/pages/index.module.css`, add `roadmapSection` and `futureSection` to the existing section padding rules and add:

```css
.roadmapSection {
  border-bottom: 1px solid var(--atlas-line);
  background: var(--atlas-paper-muted);
}

.roadmapFigure {
  max-width: 72rem;
  margin: 2.5rem auto 0;
}

.roadmapImage {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--atlas-line-strong);
  background: #f7f2e8;
  box-shadow: var(--atlas-shadow);
}

.roadmapFigure figcaption {
  margin-top: 0.85rem;
  color: var(--atlas-muted);
  font-size: 0.78rem;
  line-height: 1.7;
  text-align: center;
}

.roadmapFigure figcaption a {
  color: var(--ifm-color-primary);
  font-weight: 700;
}

.futureSection {
  border-bottom: 1px solid var(--atlas-line);
  background: var(--atlas-paper);
}

.futureGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
  margin-top: 2.5rem;
}

.futureCard {
  border-top: 2px solid var(--ifm-color-primary);
  background: var(--atlas-paper-raised);
  padding: 1.4rem;
}

.futureCard > span {
  color: var(--ifm-color-primary);
  font-family: var(--atlas-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.futureCard h3 {
  margin: 0.65rem 0 0.75rem;
  font-size: 1.15rem;
}

.futureCard p {
  margin: 0;
  color: var(--atlas-ink-soft);
  font-size: 0.9rem;
  line-height: 1.8;
}

@media (max-width: 996px) {
  .futureGrid {
    grid-template-columns: 1fr;
  }

  .roadmapFigure {
    margin-top: 2rem;
  }
}
```

If the file already has a `@media (max-width: 996px)` block, merge these declarations into it rather than creating a duplicate block.

- [ ] **Step 5: Run the focused test, typecheck, and build**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
npm run typecheck
npm run build
```

Expected: `3` focused tests pass; TypeScript exits `0`; Docusaurus build exits `0` without broken links.

- [ ] **Step 6: Review and commit the homepage sections**

Run:

```bash
git diff --check -- src/pages/index.tsx src/pages/index.module.css tests/readme-homepage-contributing.test.mjs
git diff -- src/pages/index.tsx src/pages/index.module.css tests/readme-homepage-contributing.test.mjs
```

Confirm every existing homepage section still renders exactly once and the future cards have no empty links.

Commit:

```bash
git add src/pages/index.tsx src/pages/index.module.css tests/readme-homepage-contributing.test.mjs
git commit -m "feat: add roadmap to project homepage"
```

---

### Task 4: Publish license links in the website footer

**Files:**
- Modify: `docusaurus.config.ts`
- Modify: `tests/readme-homepage-contributing.test.mjs`

**Interfaces:**
- Consumes: `repositoryUrl` and the stable root policy file paths from Task 1.
- Produces: visible footer links to the code license, content license, and third-party notice.

- [ ] **Step 1: Extend the test with the footer contract**

Append:

```js
test('website footer exposes the dual-license and third-party boundaries', async () => {
  const config = await read('docusaurus.config.ts');

  assert.match(config, /代码 · Apache-2\.0/u);
  assert.match(config, /内容 · CC BY 4\.0/u);
  assert.match(config, /第三方材料/u);
  assert.match(config, /blob\/main\/LICENSE/u);
  assert.match(config, /blob\/main\/LICENSE-CONTENT\.md/u);
  assert.match(config, /blob\/main\/NOTICE\.md/u);
  assert.match(config, /Tego Arch contributors/u);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
```

Expected: first three tests pass; footer test fails on missing license labels.

- [ ] **Step 3: Update the footer project links and copyright line**

Replace the footer `项目` items with:

```ts
items: [
  {label: 'GitHub', href: repositoryUrl},
  {label: '代码 · Apache-2.0', href: `${repositoryUrl}/blob/main/LICENSE`},
  {
    label: '内容 · CC BY 4.0',
    href: `${repositoryUrl}/blob/main/LICENSE-CONTENT.md`,
  },
  {label: '第三方材料', href: `${repositoryUrl}/blob/main/NOTICE.md`},
],
```

Replace the copyright expression with:

```ts
copyright: `Copyright © ${new Date().getFullYear()} Tego Arch contributors. Code Apache-2.0; original content CC BY 4.0.`,
```

- [ ] **Step 4: Run the focused test and build**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
npm run typecheck
npm run build
```

Expected: `4` focused tests pass; typecheck and build exit `0`.

- [ ] **Step 5: Review and commit the footer policy**

Run:

```bash
git diff --check -- docusaurus.config.ts tests/readme-homepage-contributing.test.mjs
git diff -- docusaurus.config.ts tests/readme-homepage-contributing.test.mjs
```

Commit:

```bash
git add docusaurus.config.ts tests/readme-homepage-contributing.test.mjs
git commit -m "docs: expose project license boundaries"
```

---

### Task 5: Run full validation and visual QA

**Files:**
- Modify only if a validation or rendering defect is found: `README.md`, `src/pages/index.tsx`, `src/pages/index.module.css`, `docusaurus.config.ts`, `tests/readme-homepage-contributing.test.mjs`.
- Verify: `static/img/illustrations/tego-arch-initial-release-roadmap.png`.

**Interfaces:**
- Consumes: the completed README, policy files, homepage, footer, test contract, and roadmap asset.
- Produces: fresh repository and visual evidence that the feature is ready for review.

- [ ] **Step 1: Run focused repository checks**

Run:

```bash
node --test tests/readme-homepage-contributing.test.mjs
npm run validate:content
npm run check:content
npm run check:reviews
```

Expected: `4` focused tests pass; every content command exits `0`; generated content reports no drift.

- [ ] **Step 2: Run the complete verification gate**

Run:

```bash
npm run verify
```

Expected: all Node tests, content validation, generated-content check, cached link check, review check, typecheck, and Docusaurus build pass.

- [ ] **Step 3: Serve the built site locally**

Run in a persistent terminal session:

```bash
npm run serve -- --host 127.0.0.1
```

Expected: Docusaurus serves the built site without startup errors and prints a local URL under `/tego-arch/`.

- [ ] **Step 4: Inspect desktop and mobile homepage rendering**

At desktop `1440x1000` and mobile `390x844`, verify:

- Hero communicates the advanced-engineer-to-architect transition before other content.
- Project status still shows generated values and links no second hand-maintained status block.
- Roadmap is fully visible, preserves its 1672:941 ratio, and has no document-level horizontal overflow.
- Warm-white roadmap remains bounded in both light and dark themes.
- Alt text is present and purpose-oriented.
- Future-product cards render three-to-one on desktop and stack on mobile; none is interactive.
- Existing featured cases, migration map, learning protocol, expansion ports, and contribution section remain present.
- Contribution and footer links resolve to GitHub README/license targets.
- Browser console has `0` warnings, `0` errors, and `0` page errors.

- [ ] **Step 5: Confirm source and copyright scope**

Verify:

```bash
rg -n "tego-arch-initial-release-roadmap|Apache-2.0|CC BY 4.0|第三方" README.md src/pages/index.tsx docusaurus.config.ts LICENSE-CONTENT.md NOTICE.md
git status --short
```

Expected: all intended surfaces contain the correct scope; no source-ledger citation was fabricated; `.codex/config.toml` remains untouched and untracked if it was untracked before execution.

- [ ] **Step 6: Fix only evidence-backed defects and rerun affected gates**

For each defect, first add or tighten the focused test when the behavior can regress, make the smallest change, rerun the focused test, and then rerun `npm run verify`. Do not refactor unrelated homepage sections.

- [ ] **Step 7: Commit any final verification fixes**

If Step 6 changed files:

```bash
git add README.md src/pages/index.tsx src/pages/index.module.css docusaurus.config.ts tests/readme-homepage-contributing.test.mjs
git commit -m "fix: harden project onboarding surfaces"
```

If Step 6 changed nothing, do not create an empty commit.

- [ ] **Step 8: Produce the completion report**

Report:

- README, license, notice, homepage, CSS, footer, test, and image paths;
- focused-test and `npm run verify` results;
- desktop/mobile visual QA result;
- the explicit source-ledger registration gap for non-MDX roadmap use;
- remaining unrelated worktree items, especially `.codex/config.toml`.
