# G007 Batch 1 Review and Deployment Evidence

- 内容作者身份：`codex-g007-principles`
- 评审者身份：`independent-code-reviewer-and-repository-contracts`
- 评审关系：独立 reviewer 以设计、来源账本、真实内容契约、完整 CI 和 exact-SHA 线上检查为依据，不把正文结论本身作为通过证据。
- Exact Stage A SHA: `66dbc54f8b570fe05c21f69eed87faf1222d6dea`
- GitHub Pages run: [`30327594616`](https://github.com/sealday/tego-arch/actions/runs/30327594616)
- Exact run gate：`headSha=66dbc54f8b570fe05c21f69eed87faf1222d6dea`，`status=completed`，`conclusion=success`。
- Live-smoke date：`2026-07-28`
- Canonical live base：[`https://sealday.github.io/tego-arch/`](https://sealday.github.io/tego-arch/)

## PR-01 through PR-05

### PR-01 信息隐藏与封装

- editorial — PASS：保留原有隐藏设计决策的主论证与 Mermaid，补齐来源事实、推断、本站分析、反例、适用尺度和相邻原则。
- fact — PASS：Parnas 与 SEI 只支撑模块分解、信息隐藏和架构原则边界；未把 `private`、getter 或 DTO 直接等同于信息隐藏。
- copyright — PASS：外部材料只作原创中文事实摘要；Mermaid、场景和判断结构为本站原创。
- deterministic representation — PASS：图失效时，正文仍明确表达泄漏决策与稳定能力接口的差异。
- anti-overclaim — PASS：访问修饰符不证明边界成立；判断依据是设计决策变化是否迫使边界外同步修改。

### PR-02 高内聚与低耦合

- editorial — PASS：九段式结构、四维耦合决策表、反例、尺度和场景均完整。
- fact — PASS：Structured Design 与 SEI Maintainability 分别支撑历史模块设计和变化场景；四维传播模型明确标为本站整理。
- copyright — PASS：未复用外部分类表、图或原文结构。
- deterministic representation — PASS：决策表在桌面和移动宽度均可读，且正文说明降低一种耦合可能增加另一种耦合。
- anti-overclaim — PASS：低 import 数、单个 API 或网络拆分均不自动证明低耦合。

### PR-03 单一职责与关注点分离

- editorial — PASS：责任主体、变化原因、SoC 观察维度和原创变化原因矩阵相互一致。
- fact — PASS：Parnas 支撑隐藏决策，Dijkstra EWD447 支撑暂时隔离一个方面进行推理的原始 SoC 讨论，Martin 仅作 SRP 人/角色解释的交叉材料。
- copyright — PASS：EWD447 的 Springer all-rights-reserved 边界已登记；本站仅作事实摘要，不复制受保护正文、扫描或结构。
- deterministic representation — PASS：矩阵和正文同时表达责任主体、变化原因和部署边界不是同一件事。
- anti-overclaim — PASS：文件大小、方法数量、技术分层和“只做一件事”都不是 SRP 的充分测试。

### PR-04 依赖倒置、控制反转与依赖注入

- editorial — PASS：DIP、IoC 与 DI 分别以源代码依赖、运行时控制和对象装配三类边表达。
- fact — PASS：Object Mentor DIP 与 Fowler IoC/DI 材料只用于各自定义和比较边界。
- copyright — PASS：Mermaid 和示例均为原创表达，不复用来源图示或代码。
- deterministic representation — PASS：图不可用时，正文和三列表仍能区分三类边。
- anti-overclaim — PASS：使用容器不等于遵守 DIP；手写装配可以是 DI；IoC 不要求容器。

### PR-05 组合优于继承

- editorial — PASS：同时给出继承与组合的有效上下文、代价、反例和原创决策表。
- fact — PASS：GoF 书目记录支撑历史设计指导，Oracle 教程支撑 Java 继承机制；WorldCat 是实际审计 transport。
- copyright — PASS：商业书籍只用于书目信息和事实摘要，不复用正文、目录、图或代码。
- deterministic representation — PASS：决策表在无图时仍比较类型关系、共享实现、状态耦合与替换成本。
- anti-overclaim — PASS：未把组合写成绝对规则；稳定且可替换的类型层次仍可使用继承。

## Runtime

- routes — PASS：`/principles`、`/principles/pr-01`、`/principles/pr-02`、`/principles/pr-03`、`/principles/pr-04`、`/principles/pr-05` 均 HTTP 200，标题与 H1 正确。
- production assets — PASS：`/assets/css/styles.9684c33a.css` 与 `/assets/js/runtime~main.c39e820a.js` 均 HTTP 200。
- desktop `1440x1000` — PASS：页面 `scrollWidth=clientWidth=1440`；PR-02、PR-03、PR-05 表格位于文章宽度内。
- mobile `390x844` — PASS：六条路由均 `scrollWidth=clientWidth=390`；表格收敛到 358px，PR-01 与 PR-04 Mermaid 位于 `overflow-x: auto` 的 358px 局部容器，未造成页面横向溢出。
- console — PASS：浏览器 warning/error 记录为 0。
- unpublished links — PASS：渲染 HTML 不含 PR-06 至 PR-17 的站内路由。
- discovery and reciprocal clicks — PASS：五页的原则目录入口、全部 14 条正文相邻原则链接及五条案例链接均完成实际点击并到达目标路由。
- source visibility — PASS：PR-03 线上正文可见 Dijkstra EWD447 链接；来源账本 transport health 为 HTTP 206、`healthy`。
- repository gates — PASS：最新主线集成后 437/437 测试通过，70 篇内容、431 个来源通过校验，生成检查、链接缓存、审校健康、TypeScript 与生产构建均通过。

## Closure

Stage B closure — PASS：PR-01 至 PR-05 已以 exact Stage A SHA、Pages run、live routes、响应式渲染、来源治理和真实点击证据关闭。G007 保持当前持久故事，PR-06 至 PR-17 继续未完成；下一批为 PR-06 至 PR-08。
