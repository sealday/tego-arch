# G008 Batch 1：模型选择与 C4 视图体系设计

## 背景

G008 要完成 MOD-01..13，覆盖建模、图示与架构文档的完整体系。十三个主题同时进入一个设计和发布批次，会把模型选择、C4、arc42、数据模型、协作建模和模型治理混在一起，难以形成清晰的学习路径，也会放大来源、图资产和线上验证的变更面。

因此 G008 拆分为多个可独立设计、发布和验收的批次。Batch 1 只处理 MOD-01..03：

- MOD-01 建立模型选择总览；
- MOD-02 正式关闭已有的 Context/Container 生产样板；
- MOD-03 补齐 Component、Dynamic 与 Deployment 视图。

三篇共同形成一条从“选择模型”到“保持多视图一致”的 C4 学习路径。MOD-04..13 不进入本批次。

## 目标

本批次完成后，读者能够：

1. 根据评审问题区分问题空间、结构、行为、数据、部署和决策模型；
2. 用 Context 与 Container 明确系统边界、外部参与者、职责和可运行单元；
3. 判断 Component、Dynamic 与 Deployment 视图何时增加证据，何时只制造伪精确；
4. 在多张图中保持系统、容器、组件和部署实例的名称与边界一致；
5. 明确每种视图没有证明的内容，并选择下一种模型补足证据。

## 范围

### 包含

- 新增 MOD-01 正文；
- 审计并正式关闭现有 MOD-02；
- 新增 MOD-03 正文；
- 为 MOD-01 增加模型选择 Mermaid 图和决策表；
- 为 MOD-03 增加 Component、Dynamic、Deployment 三个独立视图；
- 为两个静态结构视图提供 Draw.io 源文件与发布 SVG；
- 建立三篇文章之间以及与既有内容之间的真实互惠关系；
- 补齐来源治理、内容契约、图资产契约和发布回归；
- 完成 Stage A 内容发布、线上视觉与交互验证；
- 完成 Stage B 证据固化、backlog 状态更新和项目投影同步。

### 不包含

- MOD-04 arc42 文档骨架及后续建模主题；
- 新建通用建模引擎、图数据库或模型 DSL；
- 将已有 Mermaid 图全站迁移为 Draw.io；
- 用 Component 图替代代码结构检查；
- 用 Dynamic 图替代可执行测试或追踪证据；
- 用 Deployment 图声称未验证的容量、故障切换或网络事实；
- 无证据地重写 MOD-02 已通过验证的正文和视觉资产。

## 方案比较与决定

### 方案 A：统一 C4 学习路径

MOD-01 负责选择问题，MOD-02 负责 Context/Container 演练，MOD-03 延续同一案例并补齐 Component、Dynamic、Deployment。三篇共享词汇和案例身份，但各自拥有独立的学习问题、产物、完成判断与失败边界。

优点是重复少、跨图一致性可测试、读者能够顺序学习，也便于后续 MOD-12/13 复用。代价是本批次必须显式治理跨页关系和图中名称。

### 方案 B：三篇完全独立

每篇都从零解释输入、受众和 C4 基础。单篇阅读成本较低，但会重复系统边界和 C4 抽象，后续修改容易产生术语漂移。

### 方案 C：扩充 MOD-02 为中心页

把完整 C4 内容集中到 MOD-02，MOD-01 和 MOD-03 只保留导航。维护文件较少，但会破坏 backlog 中三个主题的独立停止条件，并让 MOD-02 过度承担总览、演练和进阶内容。

### 决定

采用方案 A。MOD-02 使用“审计式收尾”：保留现有正文与 Draw.io/SVG，只补必要的跨主题衔接、验证和关闭证据；只有发现明确契约或事实缺口时才修改正文。

## 内容架构

### MOD-01：建模总览

MOD-01 是问题到模型的路由页，不是符号或工具目录。

正文必须覆盖六类问题：

| 问题类别 | 首选产物 | 主要证明 | 明确不证明 |
| --- | --- | --- | --- |
| 问题空间 | EventStorming、Domain Storytelling、Context Map | 事件、参与者、语言与边界假设 | 软件内部结构已经正确 |
| 结构 | C4 Context、Container、Component | 静态边界、责任与依赖 | 运行顺序和部署拓扑 |
| 行为 | sequence、Dynamic、state machine | 场景顺序、状态转换与异常路径 | 静态所有权或容量 |
| 数据 | 概念、逻辑、物理数据模型与 ER | 身份、关系、约束和实现映射 | 业务流程已经完整 |
| 部署 | C4 Deployment、UML deployment | 实例、节点、环境和基础设施关系 | 容量与故障切换已经验证 |
| 决策 | ADR、约束、风险与质量属性场景 | 选择原因、边界与复核条件 | 运行事实自动与决策一致 |

一张 Mermaid 决策图把“当前要评审什么”路由到适合的模型，并在每个出口提示该模型的证据边界。正文通过同一个费用申报系统举例，但不提前重复 MOD-02/03 的完整演练。

### MOD-02：C4 Context 与 Container

保留现有费用申报系统 Context→Container 演练、Draw.io 源图和发布 SVG。收尾工作限于：

- 将 MOD-01 设为选择模型的上游入口；
- 将 MOD-03 设为继续展开结构、行为与部署的下游入口；
- 确认 Context/Container 的边界、参与者、职责和“不能证明什么”仍与官方定义一致；
- 重跑 Draw.io/SVG、可访问性、桌面和移动视觉检查；
- 在 Stage B 写入不可变部署证据并将 fixture 完成状态改为 true。

如果审计没有发现事实、可读性或契约缺陷，不改写已有段落或图。

### MOD-03：C4 Component、Dynamic 与 Deployment

MOD-03 延续费用申报系统，但只展开已有 Container 层中需要进一步解释的部分。

#### Component

范围限定为“申报 API”单一容器。图中只展示提交用例、审批策略、付款编排和持久化端口四个责任单元。外部容器只作为直接依赖出现。

文章明确：Component 图只有在责任边界、接口或变化所有权需要讨论时才值得长期维护；它不证明类结构与代码完全一致。

#### Dynamic

使用 Mermaid sequence 表达一次“费用审批后发起付款”的关键场景，参与者名称必须来自 Context、Container 或 Component 视图。只展示能解释责任交接、异步边界和失败分支的步骤。

文章明确：Dynamic 图用于有价值的场景，不应枚举所有请求；图中的顺序也不等于性能、重试或生产追踪证据。

#### Deployment

展示一个明确命名的教学演练生产环境，把 Web、API、数据库和支付任务执行器的 Container 实例映射到部署节点，并保留银行支付服务边界。数据库部署节点承载申报数据库 Container 实例；基础设施节点是可选类型，本最小教学图不引入对应实例，也不增加 DNS 或 LB。费用系统拓扑是显式假设，图源、发布资产及来源身份都命名为“费用申报系统 Deployment 教学演练假设拓扑”，不写成未经核验的生产事实。

文章明确：Deployment 图描述记录下来的部署结构，不自动证明实例数量、容量、可用区容灾或故障切换有效。

## 图示设计

### MOD-01

- 一张 Mermaid 决策图；
- 一张可横向滚动的选择表；
- 图和表共享六类问题的固定名称；
- Mermaid 只承担可维护的路由关系，不复制来源图。

### MOD-02

- 继续使用 `diagrams/mod-02-c4-context-container.drawio`；
- 继续发布 `static/img/diagrams/mod-02-c4-context-container.svg`；
- 不改变现有可横向滚动、可聚焦的无障碍容器；
- 静态契约之外仍执行真实浏览器视觉检查。

### MOD-03

- Component：`diagrams/mod-03-c4-component.drawio` 与对应 SVG；
- Dynamic：正文内 Mermaid sequence；
- Deployment：`diagrams/mod-03-c4-deployment.drawio` 与对应 SVG；
- 两个 SVG 均放在可横向滚动、可聚焦、带明确 `aria-label` 的区域；
- 三个视图使用同一组规范名称；
- 每张图有标题、范围、图例、元素类型、关系动词和“不表达什么”的正文说明；
- 不把三个视图压缩成一个小字多面板图。

## 跨页关系

关系以真实学习依赖为准，并保持互惠：

- MOD-01 → MOD-02：从模型选择进入 Context/Container；
- MOD-02 → MOD-01：返回模型选择入口；
- MOD-02 → MOD-03：从系统与容器边界继续展开；
- MOD-03 → MOD-02：声明上游边界来源；
- MOD-01 与既有方法/质量属性入口连接，说明模型服务于评审问题；
- MOD-02 保留与架构风格比较和现有案例的有效关系；
- MOD-03 连接既有 Microsoft multi-agent reference architecture 案例，用于迁移练习，但明确案例事实不能替代费用申报系统的视图证据。

实现计划必须列出最终 frontmatter 关系，并用现有关系契约验证互惠与路由存在性。

## 来源与版权治理

事实边界采用官方一手资料：

- C4 diagrams 总览：`https://c4model.com/diagrams`；
- C4 Component：`https://c4model.com/diagrams/component`；
- C4 Dynamic：`https://c4model.com/diagrams/dynamic`；
- C4 Deployment：`https://c4model.com/diagrams/deployment`；
- C4 notation：`https://c4model.com/diagrams/notation`；
- arc42：`https://arc42.org/`。

已有 C4 与 arc42 来源身份继续复用；新增的 C4 子页面分别登记为受治理身份，避免用主页替代具体定义。正文只做事实总结和本站原创演练，不复制官方示例图、目录结构或大段原文。原创 Draw.io/SVG 继续作为独立来源身份记录。

## 失败处理与停止条件

以下任一情况阻止 Stage A：

- 正文缺少 modeling 类型的必需章节；
- 图或表未声明范围、受众、产物或证据边界；
- Draw.io 与 SVG 缺少配对或关键名称不一致；
- Mermaid 无法渲染；
- 来源身份缺失、许可证边界不清或引用不可见；
- reciprocal relation、站内路由或生成产物漂移；
- 目标测试、内容校验、类型检查或构建失败。

以下任一情况阻止 Stage B：

- Pages run 的 `headSha` 不等于 Stage A 提交；
- Pages run 未达到 `completed/success`；
- 任一生产页面或 SVG 非 HTTP 200；
- 桌面或移动视口发生 document overflow、不可操作的图示滚动或不可读标签；
- 浏览器控制台出现 warning/error；
- 来源标签或要求的 parent/adjacent/case/question 链接不能真实点击；
- 部署证据尚未写入 backlog 和审查记录。

验证失败时保留 MOD-01..03 为未完成状态，修复后重新执行相应阶段；不使用推测性证据关闭主题。

## 测试设计

### 内容契约

新增 G008 Batch 1 回归，验证：

- MOD-01 和 MOD-03 路由及 frontmatter；
- 三篇各自的学习问题、输入、参与者/步骤、产物、完成判断、失败边界和完整演练；
- MOD-01 六类问题与模型选择矩阵；
- MOD-03 Component、Dynamic、Deployment 的使用条件与伪精确边界；
- 三篇互惠关系和真实案例/问题链接；
- 受治理来源可见；
- Stage A 与 Stage B 的状态投影。

### 图资产契约

复用并扩展现有 Draw.io/SVG 测试，验证：

- 每个声明的 Draw.io 都有同名 SVG；
- SVG 有 `title`、`desc`、有效 `viewBox` 和非空文字；
- 正文嵌入正确 SVG；
- 关键名称在正文和对应图中一致；
- 禁止已知的标签遮线和 HTML label 回归；
- 图区域可聚焦且允许局部横向滚动。

自动测试不声称证明几何可读性，几何仍由真实浏览器截图和交互检查负责。

### 验证顺序

1. 新增失败的目标回归；
2. 实现最小内容和资产使目标回归通过；
3. 运行内容生成、来源、关系和图资产相关测试；
4. 运行完整 `npm run verify`、类型检查和构建；
5. Stage A 部署并执行桌面/移动线上 smoke；
6. Stage B 只写入已经获得的不可变证据；
7. 重新运行目标回归和完整验证；
8. 确认工作树、分支、main 与 origin 的预期同步状态。

## 发布与状态投影

### Stage A

- 发布 MOD-01、审计后的 MOD-02 和 MOD-03；
- 内容文档从 82 增至 84；
- MOD-01..03 在 backlog 中仍保持未勾选；
- 已完成主题仍为 39；
- G008 仍为当前持久故事，持久故事进度仍为 `7 / 20`；
- 来源总数从 457 增至 464：五个 C4 官方子页面身份和两个原创 Draw.io/SVG 图对身份；
- 保存 exact Stage A SHA 与成功 Pages run。

### Stage B

- 在 backlog 写入 Stage A SHA、Pages run 和线上验证摘要；
- 勾选 MOD-01、MOD-02、MOD-03；
- 已完成主题从 39 增至 42；
- MOD-02 fixture 完成状态改为 true；
- G008 仍处于进行中，当前下一项为 MOD-04；
- 持久故事进度仍为 `7 / 20`；
- 内容文档仍为 84，来源总数仍为 464；
- 更新项目状态、生成产物、G008 审查记录和持久目标审计证据。

本批次不会把 G008 标记为完成，也不会把当前故事推进到 G009。

## 完成标准

本批次仅在以下条件全部满足后完成：

- MOD-01 和 MOD-03 已发布，MOD-02 已完成审计式收尾；
- 三篇内容契约、来源、关系和图资产契约通过；
- 两个新 Draw.io/SVG 配对和两个 Mermaid 视图正常；
- 全量验证、类型检查与构建通过；
- Stage A exact SHA 对应的 Pages run 成功；
- 三篇页面和 SVG 的线上桌面/移动视觉、交互、控制台和链接检查通过；
- Stage B 仅记录真实证据并正确投影 42 个已完成主题；
- G008 保持当前且进行中，MOD-04 是下一项；
- 独立审查没有未解决的高优先级发现；
- 分支、main、origin/main 和目标工作树达到发布流程要求的同步状态。
