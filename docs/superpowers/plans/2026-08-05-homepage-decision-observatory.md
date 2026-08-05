# Homepage Decision Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Tego Arch 首页从项目说明书重设计为克制、可信、面向高级工程师的“架构决策观察”入口，并在桌面与手机上提供轻量、可访问的路线图说明。

**Architecture:** 保留 Docusaurus 与现有生成数据边界，重写 `src/pages/index.tsx` 的首页组合和 `index.module.css` 的页面视觉；状态继续来自 `projectStatus`，精选研究继续来自 `featuredCases`。新增根级 `DESIGN.md` 固化品牌与内容声音，测试使用现有 Node source-contract 风格锁定文案、信息顺序、数据来源、路线图语义和性能合同，再用 Visual Ralph 对批准的视觉伴侣基线做桌面/手机实测。

**Tech Stack:** Docusaurus 3.10.2、React 19、TypeScript 6、CSS Modules、Node.js `node:test`、Codex Visual Ralph/browser visual QA

## Global Constraints

- Node.js 版本保持 `>=24.0`。
- 不增加 npm 依赖，不引入动画库、CSS 框架或第二套设计系统。
- 首页核心承诺是“架构判断力”，不得恢复职业转换式 Hero。
- 可见 H1/H2/H3 标题不得以中文或英文句号结尾。
- Hero 不使用发光渐变、玻璃卡片、夸张大字、视差或滚动触发动画。
- Hero 桌面标题目标范围 `3rem–4.25rem`，手机范围 `2.25rem–3rem`，手机最多三行。
- 普通区块不使用完整外框；普通入口不使用悬浮阴影；圆角控制在 `0–6px`。
- 路线图 PNG 不修改、不复制；保留 `width={1672}`、`height={941}`、`loading="lazy"`、`decoding="async"`，生产 HTML 不得 preload。
- `docs/content-backlog.md` 是实时精确进度唯一事实源；首页不得手写实时状态数字。
- 状态只从 `src/generated/project-status.json` 读取；精选研究只从 `featuredCases` 派生。
- 桌面路线图说明支持 hover 与 keyboard focus；手机使用原生 `details/summary`，不依赖 hover。
- 路线图状态说明不得只依赖颜色。
- 首页移出迁移地图、五步阅读协议、完整五案例网格和稳定入口区，但不删除其目标页面或全局导航。
- 视觉验证覆盖 `1440×1000` 与 `390×844` 的浅色、深色四种组合。
- 保持 `.codex/config.toml` 未跟踪且不修改。

---

## File Structure

- Create: `DESIGN.md` — 项目级品牌、首页视觉、内容声音、响应式与可访问性决策源。
- Create: `tests/homepage-decision-observatory.test.mjs` — 本次重设计的专属结构、文案、样式与路线图合同。
- Modify: `tests/homepage-status.test.mjs` — 更新生成状态字段与 Hero 合同，删除旧职业转换预期。
- Modify: `tests/readme-homepage-contributing.test.mjs` — 保留 README/许可证覆盖，更新首页路线图与未来产物集成预期。
- Modify: `src/pages/index.tsx` — 首页数据投影、六段信息架构、文案、链接与路线图语义。
- Modify: `src/pages/index.module.css` — Hero、目录入口、精选研究、路线图羽化、后续产物、贡献带与响应式样式。
- Modify: `src/css/custom.css` — 只增加首页复用所需的 Hero 中性色 token；不改变文档页面现有视觉。
- Create during visual QA: `.omx/artifacts/visual-ralph/homepage-decision-observatory/` — 批准参考、实测截图和视觉 verdict；是否提交由 Visual Ralph 规则决定。

## Shared Interfaces

`src/pages/index.tsx` 保持以下局部接口，后续任务不得重命名：

```tsx
type HomepageEntry = Readonly<{
  index: string;
  title: string;
  description: string;
  href: string;
}>;

type FutureOutput = Readonly<{
  title: string;
  description: string;
}>;

const homepageCases = featuredCases.slice(0, 3);
```

页面组件保持以下职责名：

```tsx
function Hero(): ReactNode;
function SectionIntro(props: SectionIntroProps): ReactNode;
function RoadmapSection(): ReactNode;
function EntrySection(): ReactNode;
function ResearchHighlights(): ReactNode;
function FutureOutputSection(): ReactNode;
function ContributionBand(): ReactNode;
```

---

### Task 1: Establish the durable design contract

**Required skill:** Use `$design` to create the repo-local design source of truth from the approved spec. Do not interview again; the approved spec closes the required product and visual decisions.

**Files:**
- Create: `DESIGN.md`
- Create: `tests/homepage-decision-observatory.test.mjs`
- Reference: `docs/superpowers/specs/2026-08-05-homepage-decision-observatory-design.md`

**Interfaces:**
- Consumes: the approved spec and current `src/css/custom.css` tokens.
- Produces: root `DESIGN.md` with `Status: Active`; shared `read(path)` helper in the new test file.

- [ ] **Step 1: Write the failing design-contract test**

Create `tests/homepage-decision-observatory.test.mjs`:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('publishes the approved homepage design contract', async () => {
  const design = await read('DESIGN.md');

  for (const heading of [
    '## Source of truth',
    '## Brand',
    '## Product goals',
    '## Personas and jobs',
    '## Information architecture',
    '## Design principles',
    '## Visual language',
    '## Components',
    '## Accessibility',
    '## Responsive behavior',
    '## Interaction states',
    '## Content voice',
    '## Implementation constraints',
    '## Open questions',
  ]) {
    assert.match(design, new RegExp(`^${heading}$`, 'mu'));
  }

  assert.match(design, /Status: Active/u);
  assert.match(design, /在复杂系统里 做清醒的选择/u);
  assert.match(design, /科技感来自结构、关系、状态与信息秩序/u);
  assert.match(design, /标题不得以中文或英文句号结尾/u);
  assert.match(design, /1440 × 1000/u);
  assert.match(design, /390 × 844/u);
  assert.match(design, /不增加 npm 依赖/u);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test tests/homepage-decision-observatory.test.mjs
```

Expected: FAIL with `ENOENT` for `DESIGN.md`.

- [ ] **Step 3: Create `DESIGN.md` with the approved decisions**

Use the `design` skill's complete required structure. The file must contain these exact decision records rather than placeholders:

```markdown
# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-08-05
- Primary product surfaces: Docusaurus homepage, learning paths, case library, source ledger
- Evidence reviewed: approved homepage spec, current homepage JSX/CSS, desktop and mobile screenshots

## Brand
- Personality: 克制、清醒、研究导向、可追溯
- Trust signals: 一手来源、真实案例、显式权衡、生成状态、独立验证
- Avoid: 职业晋升承诺、苹果式发布页、大字宣言、发光渐变、玻璃卡片、营销话术

## Product goals
- Goals: 用最少首页内容建立架构判断力主张，并引导进入路径、案例和证据
- Non-goals: 不在首页复刻完整目录，不提供最佳架构答案，不实现未来产物
- Success signals: 首屏理解主张；三类入口清楚；路线图说明按需可访问；四种视口/主题无溢出

## Personas and jobs
- Primary personas: 已有扎实工程经验、承担架构设计或跨团队技术决策的高级工程师
- User jobs: 建立判断坐标、拆解真实系统、回到证据现场
- Key contexts of use: 桌面深度阅读、手机快速定位、设计评审与方案比较

## Information architecture
- Primary navigation: 首页、案例库、架构模式、设计题、学习路径、资料库
- Core routes/screens: `/`, `/paths`, `/cases`, `/references`, `/intro`
- Content hierarchy: Hero → 初版路线 → 进入方式 → 研究档案 → 后续产物 → 开放研究

## Design principles
- 科技感来自结构、关系、状态与信息秩序
- 首页是判断入口，不是项目说明书或完整目录
- 桌面展示上下文，手机只保留下一步所需信息
- Tradeoffs: 宁可减少首页内容，也不牺牲阅读节奏与事实边界

## Visual language
- Color: 炭灰 Hero、暖白正文、砖红操作、低密度蓝灰/黄褐关系节点
- Typography: 中文衬线标题、无衬线正文、等宽编号；中等字号和字重
- Spacing/layout rhythm: 依靠留白、编号和低对比结构线分区
- Shape/radius/elevation: 0–6px；普通内容无悬浮阴影；浮层允许低强度阴影
- Motion: 仅 160ms 以内的链接和说明反馈；尊重 reduced motion
- Imagery/iconography: 路线图羽化融合；装饰关系图 aria-hidden；不使用产品渲染图

## Components
- Existing components to reuse: Docusaurus Layout、Heading、Link、generated projectStatus、featuredCases
- New/changed components: Hero、SectionIntro、RoadmapSection、EntrySection、ResearchHighlights、FutureOutputSection、ContributionBand
- Variants and states: 路线图桌面 hover/focus 与手机 details；研究档案 lead/compact
- Token/component ownership: 全站中性色 token 在 custom.css；首页布局留在 index.module.css

## Accessibility
- Target standard: 键盘可达、语义标题、可见焦点、颜色之外的状态说明
- Keyboard/focus behavior: 路线图说明支持 focus-within；整行入口有明确 accessible name
- Contrast/readability: 深浅主题均保持正文与操作对比；装饰不得覆盖正文
- Screen-reader semantics: 装饰 aria-hidden；路线图有目的型 alt；details/summary 可读
- Reduced motion and sensory considerations: 不使用视差或滚动动画；reduced motion 取消过渡

## Responsive behavior
- Supported breakpoints/devices: 1440 × 1000 desktop；390 × 844 mobile；现有 996px/700px breakpoints
- Layout adaptations: 手机减少状态、案例与说明；入口目录隐藏描述；未来产物垂直排列
- Touch/hover differences: 手机没有 hover 依赖；路线图说明使用 details；提供查看大图

## Interaction states
- Loading: 路线图 lazy/async 且固定尺寸
- Empty: featuredCases 不足三项时渲染现有项，不生成占位卡
- Error: 生成状态缺失继续由构建失败关闭，不增加静默兜底
- Success: 链接与详情状态使用现有焦点和强调色
- Disabled: 首页没有禁用操作
- Offline/slow network: 路线图不 preload，正文与入口先于图片可用

## Content voice
- Tone: 克制的命题，短、有判断、不喊口号
- Terminology: 架构判断、边界、状态、控制、质量属性、证据、研究档案
- Microcopy rules: 标题不得以中文或英文句号结尾；按钮说明获得什么；英文仅作小标签

## Implementation constraints
- Framework/styling system: Docusaurus 3.10.2、React 19、TypeScript、CSS Modules
- Design-token constraints: 复用 atlas token，只新增 Hero 中性色；不建立第二套系统
- Performance constraints: 路线图不修改、不复制、不 preload；无新运行时依赖
- Compatibility constraints: Node.js >=24.0；现有浅色/深色主题
- Test/screenshot expectations: 定向 node:test、typecheck、build、verify、四种视口/主题视觉检查

## Open questions
- 无阻塞问题；新内容上线后再决定未来产物是否获得首页链接
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/homepage-decision-observatory.test.mjs
```

Expected: 1 test passes.

- [ ] **Step 5: Commit Task 1**

```bash
git add DESIGN.md tests/homepage-decision-observatory.test.mjs
git commit -m "docs: establish homepage design contract"
```

---

### Task 2: Rebuild the homepage semantic structure and copy

**Files:**
- Modify: `tests/homepage-decision-observatory.test.mjs`
- Modify: `tests/homepage-status.test.mjs`
- Modify: `tests/readme-homepage-contributing.test.mjs`
- Modify: `src/pages/index.tsx`

**Interfaces:**
- Consumes: `projectStatus.content_documents`, `projectStatus.governed_sources`, `projectStatus.durable_stories.current`, `featuredCases`.
- Produces: the shared `HomepageEntry`, `FutureOutput`, `homepageCases`, and seven component names defined above.

- [ ] **Step 1: Add failing information-architecture tests**

Append to `tests/homepage-decision-observatory.test.mjs`:

```js
test('uses the approved decision-observatory narrative in exact order', async () => {
  const homepage = await read('src/pages/index.tsx');
  const orderedCopy = [
    '在复杂系统里 做清醒的选择',
    '一张持续展开的架构坐标',
    '从问题出发',
    '正在研究的系统',
    '下一步，让完整内容变得更轻',
    '这是一份开放的研究记录',
  ];

  let previous = -1;
  for (const copy of orderedCopy) {
    const position = homepage.indexOf(copy);
    assert.ok(position > previous, `${copy} must follow the preceding section`);
    previous = position;
  }

  for (const removed of [
    '从高级工程师到架构设计者。',
    '初版先完成一套完整的架构知识体系',
    '经典架构迁移地图',
    '五步读懂一个软件架构主题',
    '为上百个案例留下稳定入口',
  ]) {
    assert.doesNotMatch(homepage, new RegExp(removed, 'u'));
  }

  const visibleHeadings = [...homepage.matchAll(/<Heading[^>]*>([^<]+)<\/Heading>/gu)]
    .map((match) => match[1].trim());
  assert.ok(visibleHeadings.length >= 6);
  for (const heading of visibleHeadings) {
    assert.doesNotMatch(heading, /[。.]+$/u);
  }
});

test('publishes three problem-led entrances and generated research highlights', async () => {
  const homepage = await read('src/pages/index.tsx');

  for (const [title, href] of [
    ['建立判断坐标', '/paths'],
    ['拆解真实系统', '/cases'],
    ['回到证据现场', '/references'],
  ]) {
    assert.match(homepage, new RegExp(`title: '${title}'[\\s\\S]*href: '${href}'`, 'u'));
  }

  assert.match(homepage, /const homepageCases = featuredCases\.slice\(0, 3\)/u);
  assert.doesNotMatch(homepage, /secondCollectionCases|groupCasesBySeries|migrationGroups/u);
  assert.match(homepage, /homepageCases\.slice\(1\)\.map/u);
});
```

Replace the stale Hero/status expectations in `tests/homepage-status.test.mjs` with:

```js
for (const label of ['研究主题', '治理来源', '当前研究']) {
  assert.match(homepage, new RegExp(label, 'u'));
}
for (const field of [
  'content_documents',
  'governed_sources',
  'durable_stories.current',
]) {
  assert.match(homepage, new RegExp(field.replace('.', '\\.'), 'u'));
}
for (const removedField of [
  'durable_stories.completed',
  'durable_stories.total',
  'completed_topics',
]) {
  assert.doesNotMatch(homepage, new RegExp(removedField.replace('.', '\\.'), 'u'));
}

assert.match(homepage, /<Heading as="h1">\s*在复杂系统里 做清醒的选择\s*<\/Heading>/u);
assert.match(homepage, /从边界、状态、控制与质量属性出发，让每个架构决定都能解释、验证和演化/u);
assert.match(homepage, /to="\/paths"[\s\S]*开始建立判断坐标/u);
assert.match(homepage, /to="\/intro"[\s\S]*了解研究方法/u);
```

Replace only the existing homepage test in `tests/readme-homepage-contributing.test.mjs`; leave README and license tests unchanged:

```js
test('homepage presents architecture judgment and the release roadmap', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(homepage, /在复杂系统里 做清醒的选择/u);
  assert.match(homepage, /开始建立判断坐标/u);
  assert.match(homepage, /了解研究方法/u);
  assert.match(homepage, /tego-arch-initial-release-roadmap\.png/u);
  assert.match(homepage, /一张持续展开的架构坐标/u);
  assert.match(homepage, /docs\/content-backlog\.md/u);
  assert.match(homepage, /便携小抄/u);
  assert.match(homepage, /精华学习路线/u);
  assert.match(homepage, /Tego 实践与规划/u);
  assert.match(homepage, /https:\/\/github\.com\/sealday\/tego-arch#参与贡献/u);
  assert.match(homepage, /<Hero\s*\/>\s*<main>\s*<RoadmapSection\s*\/>\s*<EntrySection\s*\/>\s*<ResearchHighlights\s*\/>\s*<FutureOutputSection\s*\/>\s*<ContributionBand\s*\/>/u);
  assert.doesNotMatch(homepage, /Migration|migrationGroups|learningSteps|expansionPorts/u);
  assert.match(styles, /\.hero/u);
  assert.match(styles, /\.roadmapMedia/u);
  assert.match(styles, /\.entryList/u);
  assert.match(styles, /\.researchGrid/u);
  assert.match(styles, /\.futureList/u);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs
```

Expected: FAIL on the old Hero, old section order, old status fields, and missing new component names.

- [ ] **Step 3: Replace old homepage data and composition**

In `src/pages/index.tsx`, remove `CaseCard`, `groupCasesBySeries`, `caseSeries`, `secondCollectionCases`, `seriesLabels`, `learningSteps`, `expansionPorts`, `migrationGroups`, and the old future-card structure.

Define the approved data:

```tsx
type HomepageEntry = Readonly<{
  index: string;
  title: string;
  description: string;
  href: string;
}>;

type FutureOutput = Readonly<{
  title: string;
  description: string;
}>;

const homepageEntries: readonly HomepageEntry[] = [
  {
    index: '01',
    title: '建立判断坐标',
    description: '理解驱动因素、边界与权衡如何连成主线',
    href: '/paths',
  },
  {
    index: '02',
    title: '拆解真实系统',
    description: '观察控制、状态、协议与失败在系统中如何发生',
    href: '/cases',
  },
  {
    index: '03',
    title: '回到证据现场',
    description: '核对标准、源码、论文与一手工程材料',
    href: '/references',
  },
] as const;

const futureOutputs: readonly FutureOutput[] = [
  {title: '便携小抄', description: '守住第一性原理与高代价错误'},
  {title: '精华学习路线', description: '从完整体系提取连贯学习线索'},
  {title: 'Tego 实践与规划', description: '说明判断在 Tego 设计中的应用与后续方向'},
] as const;

const homepageCases = featuredCases.slice(0, 3);
```

Use this exact Hero content and generated status projection:

```tsx
function Hero(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Tego Arch / 架构决策观察</p>
          <Heading as="h1">在复杂系统里 做清醒的选择</Heading>
          <p className={styles.lede}>
            从边界、状态、控制与质量属性出发，让每个架构决定都能解释、验证和演化
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} to="/paths">
              开始建立判断坐标 <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondaryAction} to="/intro">
              了解研究方法
            </Link>
          </div>
          <dl className={styles.statusRail} aria-label="项目研究状态">
            <div><dt>研究主题</dt><dd>{projectStatus.content_documents}</dd></div>
            <div><dt>治理来源</dt><dd>{projectStatus.governed_sources}</dd></div>
            <div><dt>当前研究</dt><dd>{projectStatus.durable_stories.current}</dd></div>
          </dl>
        </div>
        <div className={styles.heroRelations} aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </header>
  );
}
```

Use a shared section intro:

```tsx
type SectionIntroProps = Readonly<{
  id: string;
  label: string;
  title: string;
  description?: string;
}>;

function SectionIntro({id, label, title, description}: SectionIntroProps): ReactNode {
  return (
    <div className={styles.sectionIntro}>
      <p className={styles.sectionLabel}>{label}</p>
      <div>
        <Heading id={id} as="h2">{title}</Heading>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
```

Add the section components exactly as follows. Task 4 will replace the temporary compact roadmap metadata with the full disclosure without changing the component name.

```tsx
function RoadmapSection(): ReactNode {
  const roadmapSrc = useBaseUrl('/img/illustrations/tego-arch-initial-release-roadmap.png');

  return (
    <section className={`${styles.pageSection} ${styles.roadmapSection}`} aria-labelledby="roadmap-title">
      <div className="container">
        <SectionIntro
          id="roadmap-title"
          label="01 / 初版路线"
          title="一张持续展开的架构坐标"
          description="初版沿一条可验证的研究路线展开。首页保留方向，实时进度回到 backlog"
        />
        <figure className={styles.roadmapFigure}>
          <div className={styles.roadmapMedia}>
            <img
              className={styles.roadmapImage}
              src={roadmapSrc}
              width={1672}
              height={941}
              loading="lazy"
              decoding="async"
              alt="Tego Arch 初版发布路线图：从基线与知识主干走向完整初版发布"
            />
          </div>
          <figcaption className={styles.roadmapMeta}>初版路线图 · 2026-08-05 快照</figcaption>
        </figure>
      </div>
    </section>
  );
}

function EntrySection(): ReactNode {
  return (
    <section className={styles.pageSection} aria-labelledby="entry-title">
      <div className="container">
        <SectionIntro
          id="entry-title"
          label="02 / 进入方式"
          title="从问题出发"
          description="选择与你当前任务最接近的入口，不必先读完整个知识体系"
        />
        <div className={styles.entryList}>
          {homepageEntries.map((entry) => (
            <Link className={styles.entryRow} to={entry.href} key={entry.href}>
              <span className={styles.entryIndex} aria-hidden="true">{entry.index}</span>
              <Heading as="h3">{entry.title}</Heading>
              <p>{entry.description}</p>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchHighlights(): ReactNode {
  const leadCase = homepageCases[0];

  return (
    <section className={styles.pageSection} aria-labelledby="research-title">
      <div className="container">
        <SectionIntro
          id="research-title"
          label="03 / 研究档案"
          title="正在研究的系统"
          description="从真实案例观察架构选择如何落到控制、状态、协议与失败边界"
        />
        <div className={styles.researchGrid}>
          {leadCase && (
            <Link className={styles.researchLead} to={leadCase.slug}>
              <span className={styles.sectionLabel}>FEATURED NOTE</span>
              <Heading as="h3">{leadCase.title}</Heading>
              <p>{leadCase.summary}</p>
              <span>打开研究档案 <span aria-hidden="true">→</span></span>
            </Link>
          )}
          <div>
            <ul className={styles.researchList}>
              {homepageCases.slice(1).map((caseStudy) => (
                <li key={caseStudy.slug}>
                  <Link to={caseStudy.slug}>{caseStudy.title} <span aria-hidden="true">→</span></Link>
                </li>
              ))}
            </ul>
            <Link className={styles.textLink} to="/cases">查看全部研究档案 <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FutureOutputSection(): ReactNode {
  return (
    <section className={styles.pageSection} aria-labelledby="future-title">
      <div className="container">
        <SectionIntro id="future-title" label="04 / 后续产物" title="下一步，让完整内容变得更轻" />
        <ul className={styles.futureList}>
          {futureOutputs.map((output) => (
            <li key={output.title}>
              <Heading as="h3">{output.title}</Heading>
              <p>{output.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ContributionBand(): ReactNode {
  return (
    <section className={`${styles.pageSection} ${styles.contributionBand}`} aria-labelledby="contribution-title">
      <div className="container">
        <SectionIntro
          id="contribution-title"
          label="OPEN RESEARCH"
          title="这是一份开放的研究记录"
          description="欢迎修订证据、补充案例、贡献原创图示，或改进研究工具链"
        />
        <Link className={styles.primaryAction} href="https://github.com/sealday/tego-arch#参与贡献">
          参与修订与共建 <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
```

Compose the page in this exact order:

```tsx
<Hero />
<main>
  <RoadmapSection />
  <EntrySection />
  <ResearchHighlights />
  <FutureOutputSection />
  <ContributionBand />
</main>
```

Set Layout description to:

```tsx
description="从边界、状态、控制与质量属性出发，让每个架构决定都能解释、验证和演化。"
```

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs
npm run typecheck
```

Expected: all focused tests pass and TypeScript exits 0. Styling may still be transitional until Task 3.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/pages/index.tsx tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs
git commit -m "feat(homepage): focus narrative on architecture judgment"
```

---

### Task 3: Implement the restrained decision-observatory visual system

**Required skill:** Use `$ui-ux-pro-max` for a bounded recommendation pass before editing. Search only the relevant domains and treat `DESIGN.md` as the authority when a generic recommendation conflicts.

**Files:**
- Modify: `tests/homepage-decision-observatory.test.mjs`
- Modify: `src/css/custom.css`
- Replace homepage rules in: `src/pages/index.module.css`
- Reference: `DESIGN.md`

**Interfaces:**
- Consumes: Task 2 component class names.
- Produces: `--atlas-hero`, `--atlas-hero-ink`, `--atlas-hero-muted`, and responsive styles for all six sections.

- [ ] **Step 1: Run the bounded UI/UX style searches**

Run the skill-provided search commands for product, style, landing, color, and typography with this exact query intent:

```bash
python3 /Users/seal/.codex/skills/ui-ux-pro-max/scripts/search.py "developer tool architecture research editorial restrained" --domain product
python3 /Users/seal/.codex/skills/ui-ux-pro-max/scripts/search.py "technical editorial minimal dark hero no glassmorphism" --domain style
python3 /Users/seal/.codex/skills/ui-ux-pro-max/scripts/search.py "hero content hierarchy three entry points research archive" --domain landing
python3 /Users/seal/.codex/skills/ui-ux-pro-max/scripts/search.py "warm neutral brick red charcoal developer tool" --domain color
python3 /Users/seal/.codex/skills/ui-ux-pro-max/scripts/search.py "Chinese editorial serif sans mono hierarchy" --domain typography
```

Expected: recommendations are recorded in the Task report. Reject glassmorphism, neon, excessive gradients, oversized Hero, and generic SaaS pricing/social-proof patterns because they violate `DESIGN.md`.

- [ ] **Step 2: Add failing CSS-contract tests**

Append:

```js
test('uses restrained homepage tokens and responsive density rules', async () => {
  const [styles, globalStyles] = await Promise.all([
    read('src/pages/index.module.css'),
    read('src/css/custom.css'),
  ]);

  for (const token of ['--atlas-hero', '--atlas-hero-ink', '--atlas-hero-muted']) {
    assert.match(globalStyles, new RegExp(token, 'u'));
  }

  assert.match(styles, /\.hero\s*\{[\s\S]*background:\s*var\(--atlas-hero\)/u);
  assert.match(styles, /\.heroRelations\s*\{/u);
  assert.match(styles, /\.entryRow/u);
  assert.match(styles, /\.researchLead/u);
  assert.match(styles, /\.futureList/u);
  assert.match(styles, /@media\s*\(max-width:\s*996px\)/u);
  assert.match(styles, /@media\s*screen and \(max-width:\s*700px\)/u);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/u);
  assert.doesNotMatch(styles, /backdrop-filter/u);
});
```

Also keep the JSX contract in Task 2 that renders `heroRelations` with `aria-hidden="true"`.

- [ ] **Step 3: Run focused tests and verify RED**

```bash
node --test tests/homepage-decision-observatory.test.mjs
```

Expected: FAIL for missing tokens and new class rules.

- [ ] **Step 4: Add the exact global tokens**

Add to `:root` in `src/css/custom.css`:

```css
--atlas-hero: #242522;
--atlas-hero-ink: #eee8de;
--atlas-hero-muted: rgba(238, 232, 222, 0.66);
```

Add to `[data-theme='dark']`:

```css
--atlas-hero: #181916;
--atlas-hero-ink: #f0ebe2;
--atlas-hero-muted: rgba(240, 235, 226, 0.68);
```

- [ ] **Step 5: Replace the homepage CSS with restrained structural styles**

Use these exact foundations and extend them for the named Task 2 classes:

```css
.hero {
  position: relative;
  overflow: hidden;
  background: var(--atlas-hero);
  color: var(--atlas-hero-ink);
  padding: clamp(4.5rem, 9vw, 7.5rem) 0 clamp(2.5rem, 5vw, 4rem);
}

.heroContent {
  position: relative;
  z-index: 1;
  max-width: 48rem;
}

.heroLabel,
.sectionLabel {
  margin: 0;
  color: var(--ifm-color-primary-light);
  font-family: var(--atlas-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.hero h1 {
  max-width: 12ch;
  margin: 1.35rem 0 1rem;
  color: var(--atlas-hero-ink);
  font-size: clamp(3rem, 5.4vw, 4.25rem);
  font-weight: 560;
  letter-spacing: -0.04em;
  line-height: 1.14;
}

.lede {
  max-width: 40rem;
  margin: 0;
  color: var(--atlas-hero-muted);
  font-size: clamp(1rem, 1.5vw, 1.12rem);
  line-height: 1.8;
}

.heroRelations {
  position: absolute;
  top: 3rem;
  right: max(2rem, calc((100vw - 1200px) / 2));
  width: min(28vw, 22rem);
  height: 15rem;
  opacity: 0.52;
  pointer-events: none;
}

.statusRail {
  display: flex;
  gap: clamp(1.25rem, 4vw, 3rem);
  margin: 2.5rem 0 0;
  border-top: 1px solid rgba(238, 232, 222, 0.12);
  padding: 1rem 0 0;
}

.pageSection {
  padding: clamp(4rem, 8vw, 6.5rem) 0;
}

.pageSection + .pageSection {
  border-top: 1px solid color-mix(in srgb, var(--atlas-line) 72%, transparent);
}

.sectionIntro {
  display: grid;
  grid-template-columns: minmax(7rem, 0.25fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  max-width: 58rem;
  margin-bottom: 2.5rem;
}

.sectionIntro h2 {
  margin: 0 0 0.75rem;
  font-size: clamp(2rem, 3.8vw, 2.75rem);
  font-weight: 560;
  letter-spacing: -0.035em;
  line-height: 1.2;
}

.entryList {
  border-top: 1px solid var(--atlas-line);
}

.entryRow {
  display: grid;
  grid-template-columns: 3rem minmax(10rem, 0.4fr) minmax(0, 1fr) 1.5rem;
  gap: 1.25rem;
  align-items: center;
  border-bottom: 1px solid var(--atlas-line);
  padding: 1.25rem 0;
  color: var(--atlas-ink);
  text-decoration: none;
}

.entryRow:hover,
.entryRow:focus-visible {
  color: var(--ifm-color-primary);
  text-decoration: none;
}

.researchGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
  gap: clamp(2rem, 5vw, 4rem);
}

.researchLead {
  border-top: 2px solid var(--ifm-color-primary);
  padding-top: 1.25rem;
}

.researchList,
.futureList {
  margin: 0;
  padding: 0;
  list-style: none;
}

.futureList {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--atlas-line);
}

.contributionBand {
  background: var(--atlas-paper-muted);
}
```

Responsive rules must implement these exact behaviors:

```css
@media (max-width: 996px) {
  .heroRelations { opacity: 0.32; }
  .researchGrid { grid-template-columns: 1fr; }
  .futureList { grid-template-columns: 1fr; }
}

@media screen and (max-width: 700px) {
  .hero { padding: 3.5rem 0 2.5rem; }
  .hero h1 { max-width: 9ch; font-size: clamp(2.25rem, 11vw, 3rem); }
  .heroRelations { right: -4rem; width: 15rem; opacity: 0.2; }
  .statusRail div:nth-child(n + 3) { display: none; }
  .sectionIntro { grid-template-columns: 1fr; gap: 0.75rem; }
  .sectionIntro h2 { font-size: clamp(1.65rem, 8vw, 2.1rem); }
  .entryRow { grid-template-columns: 2rem minmax(0, 1fr) 1rem; gap: 0.75rem; }
  .entryRow p { display: none; }
  .researchList li:nth-child(n + 2) { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .entryRow,
  .primaryAction,
  .secondaryAction { transition: none; }
}
```

Do not copy old `.fieldNote`, `.futureGrid`, `.migrationSection`, `.learningSteps`, `.portGrid`, or `.caseGrid` rules into the new file.

- [ ] **Step 6: Run focused tests, typecheck, and build**

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs
npm run typecheck
npm run build
```

Expected: focused tests pass, TypeScript exits 0, Docusaurus build succeeds.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/css/custom.css src/pages/index.module.css tests/homepage-decision-observatory.test.mjs
git commit -m "style(homepage): add restrained decision-observatory system"
```

---

### Task 4: Add feathered roadmap presentation and accessible disclosures

**Files:**
- Modify: `tests/homepage-decision-observatory.test.mjs`
- Modify: `tests/readme-homepage-contributing.test.mjs`
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/index.module.css`

**Interfaces:**
- Consumes: `RoadmapSection`, `roadmapSrc`, global paper variables.
- Produces: `roadmapInfoPanel`, `roadmapMobileDetails`, and direct large-image link.

- [ ] **Step 1: Add failing roadmap behavior tests**

Append:

```js
test('keeps roadmap details available without forcing them into the reading flow', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(homepage, /初版路线图 · 2026-08-05 快照/u);
  assert.match(homepage, /<button[\s\S]*aria-describedby="roadmap-status-note"[\s\S]*状态与图例说明/u);
  assert.match(homepage, /id="roadmap-status-note"[\s\S]*role="note"/u);
  assert.match(homepage, /<details className=\{styles\.roadmapMobileDetails\}>/u);
  assert.match(homepage, /<summary>关于这张路线图<\/summary>/u);
  assert.match(homepage, /href=\{roadmapSrc\}[\s\S]*target="_blank"[\s\S]*查看大图/u);

  for (const text of [
    '历史快照',
    '绿色表示快照当日已完成',
    '橙色表示快照当日当前阶段',
    '蓝色表示快照当日待执行',
    '验证、评审、发布与线上检查',
    'docs/content-backlog.md',
  ]) {
    assert.match(homepage, new RegExp(text, 'u'));
  }

  assert.match(homepage, /width=\{1672\}/u);
  assert.match(homepage, /height=\{941\}/u);
  assert.match(homepage, /loading="lazy"/u);
  assert.match(homepage, /decoding="async"/u);
  assert.match(styles, /\.roadmapMedia::after/u);
  assert.match(styles, /\.roadmapDesktopInfo:hover[\s\S]*\.roadmapInfoPanel/u);
  assert.match(styles, /\.roadmapDesktopInfo:focus-within[\s\S]*\.roadmapInfoPanel/u);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/readme-homepage-contributing.test.mjs
```

Expected: FAIL for missing disclosures, large-image link, and feathering classes.

- [ ] **Step 3: Implement the exact roadmap semantic structure**

Use:

```tsx
function RoadmapStatusContent(): ReactNode {
  return (
    <>
      <strong>这是一张历史快照</strong>
      <p>图中颜色只表示 2026-08-05 快照当日状态。</p>
      <ul>
        <li>绿色表示快照当日已完成</li>
        <li>橙色表示快照当日当前阶段</li>
        <li>蓝色表示快照当日待执行</li>
      </ul>
      <p>每个阶段仍需经过验证、评审、发布与线上检查。</p>
      <Link href="https://github.com/sealday/tego-arch/blob/main/docs/content-backlog.md">
        查看实时 backlog <span aria-hidden="true">↗</span>
      </Link>
    </>
  );
}

function RoadmapSection(): ReactNode {
  const roadmapSrc = useBaseUrl('/img/illustrations/tego-arch-initial-release-roadmap.png');

  return (
    <section className={`${styles.pageSection} ${styles.roadmapSection}`} aria-labelledby="roadmap-title">
      <div className="container">
        <SectionIntro
          id="roadmap-title"
          label="01 / 初版路线"
          title="一张持续展开的架构坐标"
          description="初版沿一条可验证的研究路线展开。首页保留方向，实时进度回到 backlog"
        />
        <figure className={styles.roadmapFigure}>
          <div className={styles.roadmapMedia}>
            <img
              className={styles.roadmapImage}
              src={roadmapSrc}
              width={1672}
              height={941}
              loading="lazy"
              decoding="async"
              alt="Tego Arch 初版发布路线图：从基线与知识主干走向完整初版发布"
            />
          </div>
          <figcaption className={styles.roadmapMeta}>
            <span>初版路线图 · 2026-08-05 快照</span>
            <div className={styles.roadmapDesktopInfo}>
              <button
                type="button"
                className={styles.roadmapInfoControl}
                aria-describedby="roadmap-status-note">
                状态与图例说明
              </button>
              <div id="roadmap-status-note" role="note" className={styles.roadmapInfoPanel}>
                <RoadmapStatusContent />
              </div>
            </div>
            <a href={roadmapSrc} target="_blank" rel="noreferrer" className={styles.roadmapLargeLink}>
              查看大图 <span aria-hidden="true">↗</span>
            </a>
          </figcaption>
          <details className={styles.roadmapMobileDetails}>
            <summary>关于这张路线图</summary>
            <div><RoadmapStatusContent /></div>
          </details>
        </figure>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement feathering and desktop/mobile disclosure styles**

```css
.roadmapMedia {
  position: relative;
  overflow: hidden;
}

.roadmapMedia::after {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, var(--atlas-paper) 0, transparent 7%, transparent 93%, var(--atlas-paper) 100%),
    linear-gradient(var(--atlas-paper) 0, transparent 9%, transparent 90%, var(--atlas-paper) 100%);
  content: '';
  pointer-events: none;
}

.roadmapImage {
  display: block;
  width: 100%;
  height: auto;
  filter: saturate(0.86) contrast(0.97);
}

.roadmapMeta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.75rem;
  color: var(--atlas-muted);
  font-size: 0.78rem;
}

.roadmapDesktopInfo {
  position: relative;
  margin-left: auto;
}

.roadmapInfoControl {
  border: 0;
  border-bottom: 1px dotted var(--ifm-color-primary);
  background: transparent;
  color: var(--ifm-color-primary);
  cursor: help;
  font: inherit;
}

.roadmapInfoPanel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.75rem);
  z-index: 3;
  width: min(20rem, 80vw);
  border: 1px solid var(--atlas-line);
  border-radius: 4px;
  background: var(--atlas-paper-raised);
  box-shadow: var(--atlas-shadow-hover);
  padding: 1rem;
  color: var(--atlas-ink-soft);
  line-height: 1.65;
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.35rem);
  transition: opacity 140ms ease, transform 140ms ease;
}

.roadmapDesktopInfo:hover .roadmapInfoPanel,
.roadmapDesktopInfo:focus-within .roadmapInfoPanel {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.roadmapMobileDetails,
.roadmapLargeLink {
  display: none;
}

@media screen and (max-width: 700px) {
  .roadmapDesktopInfo { display: none; }
  .roadmapLargeLink { display: inline; }
  .roadmapMobileDetails { display: block; border-block: 1px solid var(--atlas-line); margin-top: 0.9rem; }
  .roadmapMobileDetails summary { cursor: pointer; padding: 0.8rem 0; color: var(--atlas-ink-soft); }
  .roadmapMobileDetails > div { padding-bottom: 1rem; color: var(--atlas-muted); font-size: 0.82rem; line-height: 1.7; }
}

@media (prefers-reduced-motion: reduce) {
  .roadmapInfoPanel { transition: none; }
}
```

If dark mode uses `--atlas-paper` behind the image, the same mask automatically blends with the theme. Do not hard-code `#f4efe6` into this component.

- [ ] **Step 5: Run focused tests, typecheck, and production preload check**

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/readme-homepage-contributing.test.mjs
npm run typecheck
npm run build
```

Then run:

```bash
if rg -n '<link[^>]+rel="preload"[^>]+tego-arch-initial-release-roadmap' build/index.html; then
  echo 'FAIL: roadmap image is preloaded'
  exit 1
else
  echo 'PASS: roadmap image is not preloaded'
fi
```

Expected: focused tests pass, build succeeds, and the preload check prints PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/pages/index.tsx src/pages/index.module.css tests/homepage-decision-observatory.test.mjs tests/readme-homepage-contributing.test.mjs
git commit -m "feat(homepage): add accessible roadmap disclosure"
```

---

### Task 5: Iterate against the approved visual baseline

**Required skill:** Use `$visual-ralph`. The approved sources are the V2 structure screen and roadmap-interaction screen from the brainstorming session; capture them into a durable reference before implementation comparison.

**Files:**
- Create: `.omx/artifacts/visual-ralph/homepage-decision-observatory/reference-desktop.png`
- Create: `.omx/artifacts/visual-ralph/homepage-decision-observatory/reference-roadmap.png`
- Create: `.omx/artifacts/visual-ralph/homepage-decision-observatory/actual-*.png`
- Create: `.omx/artifacts/visual-ralph/homepage-decision-observatory/verdict.md`
- Modify only if verdict requires: `src/pages/index.tsx`, `src/pages/index.module.css`, `src/css/custom.css`, homepage tests

**Interfaces:**
- Consumes: Tasks 1–4 completed branch, `DESIGN.md`, approved companion screens.
- Produces: four actual screenshots, visual verdict, and any bounded visual fixes.

- [ ] **Step 1: Capture durable approved references**

Read the complete Visual Ralph skill before action. Capture the approved companion files:

```text
.superpowers/brainstorm/39651-1785927327/content/homepage-structure-v2.html
.superpowers/brainstorm/39651-1785927327/content/roadmap-interaction.html
```

Save the rendered reference screenshots at the paths above. The companion HTML is ignored session state; the screenshots are the comparison baseline.

- [ ] **Step 2: Start the current branch locally and capture actuals**

```bash
npm run start -- --host 127.0.0.1 --port 3100
```

Capture:

- `actual-desktop-light.png` at `1440×1000`;
- `actual-desktop-dark.png` at `1440×1000`;
- `actual-mobile-light.png` at `390×844`;
- `actual-mobile-dark.png` at `390×844`.

For each capture, record current URL, theme, viewport, console errors/warnings, and horizontal overflow result.

- [ ] **Step 3: Run Visual Verdict against the design contract**

The verdict must separately score:

```text
1. Narrative hierarchy: Hero → roadmap → entrances → research → future → contribution
2. Restraint: no oversized launch-page typography, glow, glass, or floating-card field
3. Technical identity: structure lines, numbered sections, relation motif, generated status
4. Readability: desktop and mobile text density, title wrapping, contrast
5. Roadmap integration: feathering, no hard frame, compact default note
6. Interaction: desktop hover/focus note, mobile details, large-image target
7. Responsiveness: deliberate information reduction, no horizontal overflow
```

Required threshold: no Critical/High finding and overall verdict `PASS`. Pixel identity is not required because the approved reference is a structural mood target, not a final pixel specification.

- [ ] **Step 4: Apply one bounded visual-fix pass if needed**

Only fix findings tied to `DESIGN.md` or the seven verdict dimensions. Typical allowed fixes:

```css
/* title wraps beyond three mobile lines */
.hero h1 { max-width: 8.5ch; font-size: clamp(2.25rem, 10.5vw, 2.85rem); }

/* roadmap mask hides labels */
.roadmapMedia::after { opacity: 0.72; }

/* mobile section density remains too high */
.researchList li:nth-child(n + 2) { display: none; }
```

Do not add new sections, marketing copy, animation, dependencies, or a replacement roadmap asset during this pass.

- [ ] **Step 5: Re-capture affected viewports and finalize verdict**

Expected: `verdict.md` reports PASS, no horizontal overflow, no runtime errors, and documents any non-blocking visual differences.

- [ ] **Step 6: Run focused tests and commit visual fixes/artifacts**

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs
npm run typecheck
git diff --check
```

Stage only artifacts required by Visual Ralph plus actual code/test changes:

```bash
git add DESIGN.md src/pages/index.tsx src/pages/index.module.css src/css/custom.css tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs .omx/artifacts/visual-ralph/homepage-decision-observatory
git commit -m "fix(homepage): refine decision-observatory visuals"
```

If no visual code changes are needed and the project policy keeps `.omx` artifacts untracked, do not create an empty commit; record Task 5 as verified with no commit.

---

### Task 6: Run full verification and final branch review

**Required skills:** Use `verification-before-completion`, then `requesting-code-review`. After approval, use `finishing-a-development-branch`.

**Files:**
- Verify: all Task 1–5 files
- Do not modify unless a verification or review finding requires a fix

**Interfaces:**
- Consumes: completed implementation and Visual Ralph PASS.
- Produces: fresh full-gate evidence and final merge readiness verdict.

- [ ] **Step 1: Run the focused suite**

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 2: Run the complete repository gate**

```bash
npm run verify
```

Expected: every Node test passes; 92 content documents and current registered-source count validate; content, links, reviews, typecheck, and production build pass.

- [ ] **Step 3: Verify production performance and repository cleanliness**

```bash
if rg -n '<link[^>]+rel="preload"[^>]+tego-arch-initial-release-roadmap' build/index.html; then
  echo 'FAIL: roadmap image is preloaded'
  exit 1
fi
git diff --check
git status --short
```

Expected: no roadmap preload, no whitespace errors, and only the user's pre-existing untracked `.codex/config.toml` may remain in the main checkout; the implementation worktree itself is clean.

- [ ] **Step 4: Request final whole-branch code review**

Generate a review package from the plan base to HEAD. Review must check:

```text
- exact approved copy and absence of old occupational/project-management titles
- six-section order and removal of homepage-only old sections
- generated status/case data boundaries
- accessible roadmap hover/focus/details behavior
- no roadmap preload or duplicate asset
- CSS restraint and mobile information reduction
- DESIGN.md alignment
- focused/full test evidence and four-view visual verdict
```

Expected: reviewer returns `Ready to merge: Yes` with no Critical or Important findings. One fix agent handles all blocking findings, then regenerate the review package and re-review.

- [ ] **Step 5: Finish the branch**

Use `finishing-a-development-branch` to present the standard local merge / PR / keep / discard options. Do not push or merge without the user's selected finishing option.

---

## Plan Self-Review Record

- Spec coverage: every section of `2026-08-05-homepage-decision-observatory-design.md` maps to Tasks 1–6.
- Placeholder scan: no placeholder markers or cross-task shorthand remain.
- Type consistency: `HomepageEntry`, `FutureOutput`, `homepageCases`, component names, CSS class names, and route targets are defined once and reused consistently.
- Scope: one subsystem—the Docusaurus homepage and its durable design/test contract. No content-platform or backlog changes are included.
