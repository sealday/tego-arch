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
- Homepage promise: 在复杂系统里 做清醒的选择

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
- Dependency constraints: 不增加 npm 依赖
- Compatibility constraints: Node.js >=24.0；现有浅色/深色主题
- Test/screenshot expectations: 定向 node:test、typecheck、build、verify、四种视口/主题视觉检查

## Open questions
- 无阻塞问题；新内容上线后再决定未来产物是否获得首页链接
