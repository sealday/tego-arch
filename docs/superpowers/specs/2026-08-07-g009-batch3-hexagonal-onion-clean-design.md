# G009 Batch 3：STY-02 Hexagonal、Onion 与 Clean Architecture 对照设计

## 1. 目标与完成定义

本批次只闭环 `STY-02 P0｜Hexagonal、Onion 与 Clean Architecture 对照`。文章使用同一个“提交订单”案例，把三种架构的共同内核与命名差异放在同一依赖规则下解释，使读者能够：

- 判断接口和边界由谁拥有；
- 区分运行时控制流与源码依赖方向；
- 在 Hexagonal、Onion、Clean 三套术语之间做有边界的映射；
- 识别当前系统不值得迁移或不应套用这些名称的情况；
- 把迁移理解为修复具体依赖违规，而不是在三个标签之间切换。

完成后 `STY-02` 为 published/complete，G009 仍为当前持久故事，下一项为 `STY-03`。本批不得 checkpoint G009。

## 2. 已批准的设计方向

采用“共同内核 + 术语叠加”，不写三篇平行定义，也不制造 Layered → Hexagonal → Onion → Clean 的固定演进路线。

文章先定义共同不变量：

1. 业务策略位于内部，技术机制位于外部；
2. 源码依赖指向内部策略或由内部拥有的抽象；
3. 运行时控制流可以向外执行，但不能迫使内部代码依赖外部实现；
4. 跨边界使用显式接口和简单数据结构；
5. 业务核心能够脱离真实 UI、数据库和外部服务进行测试。

随后用三种观察视角解释同一个订单结构：

- Hexagonal 关注有业务含义的端口、驱动适配器和被驱动适配器；
- Onion 关注独立对象模型、应用核心拥有的接口和外置基础设施；
- Clean 关注策略层级、Entities、Use Cases、Interface Adapters、Dependency Rule 和边界数据。

三者可以形成相似代码，但推理起点不同；文章不得把它们写成同义词，也不得用目录名代替依赖证据。

## 3. 范围

### 3.1 包含

- 新建 STY-02 正文；
- 新建一对 Draw.io/SVG 订单边界图；
- 新增四条原作者来源记录并复用一条 AWS 来源；
- 更新 STY-01 与 STY-02 的互惠相邻关系；
- 更新来源治理、专项测试、生成物、目录投影和发布证据；
- 完成 Stage A 发布、生产 QA、Stage B 关闭与最终 exact-head 部署。

### 3.2 不包含

- 不创建或发布 STY-03 正文；
- 不提供 Java、C#、TypeScript、Spring、ASP.NET 等框架目录模板；
- 不把依赖注入容器当作三种架构成立的必要条件；
- 不扩展为完整订单系统、分布式事务或微服务设计；
- 不声称代码边界自动提供独立部署、扩缩、网络隔离或故障隔离；
- 不复制原作者图、表、代码结构或长段落；
- 不修改 Batch 2 及更早批次的不可变历史证据。

## 4. 内容身份与元数据

目标文件：`content/styles/sty-02-hexagonal-onion-clean.mdx`

```yaml
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
```

文章必须以固定顺序保留十一节 H2：

1. `学习问题`
2. `组件、连接器与约束`
3. `边界与控制流`
4. `数据所有权与一致性`
5. `部署单元与故障域`
6. `团队拓扑`
7. `质量属性收益与成本`
8. `迁移路径`
9. `禁用条件`
10. `对比案例`
11. `来源`

## 5. 共同内核与术语边界

### 5.1 共同内核

正文必须明确：

- 业务规则不依赖 HTTP、ORM、数据库驱动、供应商 SDK 或消息中间件；
- 外部机制依赖由应用核心拥有的抽象；
- 接口位置表达所有权，不只表达调用语法；
- 调用方向和源码依赖方向是两个独立维度；
- 边界不允许外部数据类型直接穿透；
- 自动化测试或内存实现可以替代外部适配器，但测试替身不是架构本身。

### 5.2 术语矩阵

第一张表使用五列：`关注点 | 共同语义 | Hexagonal | Onion | Clean`。至少覆盖：

- 内部核心；
- 输入边界；
- 输出边界；
- 外部实现；
- 依赖规则；
- 主要观察重点。

允许有条件地映射下列术语，但不得宣称完全等价：

| 共同语义 | Hexagonal | Onion | Clean |
| --- | --- | --- | --- |
| 业务核心 | Application | Domain Model / Application Core | Entities + Use Cases |
| 输入边界 | Driving Port | Application Interface | Input Boundary |
| 输出边界 | Driven Port | Core Interface | Output Boundary / Gateway |
| 外部实现 | Adapter | Infrastructure | Interface Adapter / Frameworks and Drivers |

正文必须保留下列差异：

- Hexagonal 从“应用通过哪些有目的的对话与外界协作”出发，六边形边数没有语义；
- Onion 从“独立对象模型和应用核心拥有哪些接口”出发，并把基础设施推向外圈；
- Clean 明确区分企业级规则和应用级用例，并更细地约束策略层级和跨边界数据；
- Onion 的原始表述具有面向对象偏向，正文不得将这一点推广为所有语言的必要实现方式；
- Clean 的四圈图是示意，不得把固定圈数或目录层数当作规则。

## 6. 统一“提交订单”案例

案例只包含以下语义节点：

- `HTTP / CLI / 自动化测试`
- `输入适配器`
- `提交订单用例`
- `订单领域规则`
- `库存端口`
- `订单仓储端口`
- `库存服务适配器`
- `数据库适配器`

控制流为：外部驱动方经输入适配器调用提交订单用例；用例调用领域规则，并通过库存端口与订单仓储端口使用外部能力；外侧适配器实现这些端口。

三套复述必须使用同一行为，不得偷偷改变拓扑：

- Hexagonal：输入侧是 driving adapter/port，库存和仓储侧是 driven port/adapter；
- Onion：应用服务编排领域模型，核心拥有库存和仓储接口，基础设施在外圈实现；
- Clean：Controller 调用 Input Boundary，Use Case 调用 Entity，并经 Output Boundary/Gateway 使用外部能力。

边界数据合同：

- HTTP request、ORM entity、database row、SDK response 不得进入应用核心；
- 边界转换为用例需要的简单输入/输出数据；
- 外部失败转换为应用可理解的稳定结果；
- 不把领域实体直接当作协议响应或数据库记录；
- 本案例不承诺分布式一致性、事务范围、性能或生产事故收益。

## 7. 十一节正文职责

### 学习问题

提出三至五个问题，覆盖共同原则、术语差异、依赖方向、边界所有权和非使用判断。

### 组件、连接器与约束

定义共同内核并放置术语矩阵。明确三种架构的共同目标与不同推理起点。

### 边界与控制流

插入订单 Draw.io/SVG 图。使用两种不依赖颜色的视觉语法区分运行时控制流和内向源码依赖，不允许用同一种箭头产生歧义。

### 数据所有权与一致性

领域规则拥有合法状态变化；外部设施只实现能力。说明采用这些架构不自动决定事务边界、数据库所有权或分布式一致性策略。

### 部署单元与故障域

说明代码依赖边界与部署/故障边界正交。单进程内的端口和同心层不会自动提供隔离；部署决策需要另行证明。

### 团队拓扑

说明能力所有者应同时拥有内侧接口和业务判断；不得按 Controller、Repository、Database 等技术角色机械拆团队。

### 质量属性收益与成本

收益包括测试接缝、机制可替换性和可自动检查的依赖方向。成本包括接口、映射、组合根、边界错误处理和认知负担。不得把“可替换”写成“替换必然便宜”。

### 迁移路径

迁移对象是具体依赖违规：识别被机制类型污染的策略；在现有调用点建立稳定边界；把接口所有权移入核心；逐个替换外部实现；加入依赖和行为测试；保持每一步可发布、可回退。

### 禁用条件

明确小型、短生命周期、变化压力低的 CRUD 应用可能不值得承担成本。若只有目录改名、缺少依赖约束或团队无法维护映射和接口，不得宣称采用成功。

### 对比案例

用同一订单行为依次复述三套术语，再使用第二张表完成选择闭环。该表使用：`判断信号 | Hexagonal 视角 | Onion 视角 | Clean 视角 | 不采用/停止条件`，覆盖端口对话、核心所有权、策略层级、测试、部署误区和迁移成本。

### 来源

列出四项原作者资料与 AWS 补充资料，说明文章图、表、案例和术语综合为 Tego Arch 原创，未复制来源图示或结构。

## 8. 图示设计合同

### 8.1 格式与路径

格式门结论为 `Draw.io + SVG`，因为图包含超过七个主要节点、多个边界、解释性关系，并承担核心教学职责。

- 编辑源：`diagrams/sty-02-hexagonal-onion-clean-order.drawio`
- 发布资产：`static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg`
- 插入文章：`content/styles/sty-02-hexagonal-onion-clean.mdx`

MOD-02 的图示合同为权威视觉基线，但 STY-02 必须使用原创布局和订单语义，不复制 MOD-02 或外部来源的拓扑。

### 8.2 拓扑与语义

主阅读方向从左到右：`外部驱动方 → 应用核心 → 外部机制`。应用核心内部把 `提交订单用例` 和 `订单领域规则` 分开。库存、仓储端口位于核心边界，外部适配器位于边界外。

图必须表达：

- 控制流从驱动方进入核心，并由核心调用外部能力；
- 源码依赖在边界上指向内侧拥有的端口；
- 三套术语是观察视角映射，不是完全等价声明；
- 图不表达时序、事务、网络、部署位置、容量、重试或故障恢复。

Draw.io 和 SVG 必须具有相同 slug、节点、边界、关系、方向和可见措辞。

### 8.3 几何与可读性

- SVG `viewBox` 计划宽度为 `1200`；
- 桌面文章内渲染宽度必须精确为 `800px`；
- authoring-to-rendered scale 为 `800 / 1200 = 2/3`；
- 正文和边标签最终至少 `15 CSS px`；
- 类型/角色标签最终至少 `10 CSS px`；
- 节点水平内边距至少 `16 CSS px`；
- 节点垂直内边距至少 `14 CSS px`；
- 标题/类型基线距离至少 `22 CSS px`；
- 文本到底边至少 `14 CSS px`；
- 边标签到线、箭头、节点分别至少 `8 / 16 / 12 CSS px`；
- 不透明标签背景不得擦除连接线；
- 不得仅用颜色区分边界或关系。

实现阶段必须测量所有八个语义节点的最终 CSS 像素文本、基线和边缘净空。

### 8.4 图示验证

设计阶段 browser QA 为 `NOT RUN`。实现阶段必须：

- 运行仓库 Draw.io/SVG validator；
- 在桌面 `1440x1000` 下断言 SVG 精确渲染为 `800px` 宽；
- 在移动端 `390x844` 下证明图容器局部横向滚动；
- 证明 document-level overflow 为零；
- 检查文字、拓扑、箭头、标签、色彩无关语义和禁止表达范围。

## 9. 来源治理

新增四条来源：

| ID | Canonical URL | 角色 | 使用边界 |
| --- | --- | --- | --- |
| `src-cockburn-hexagonal-architecture-2005` | `https://alistair.cockburn.us/hexagonal-architecture/` | definition, primary | 意图、端口、适配器、主/次参与方、隔离测试 |
| `src-palermo-onion-architecture-part-1` | `https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/` | definition, scope | 适用范围、核心、基础设施外置、依赖向心 |
| `src-palermo-onion-architecture-part-3` | `https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/` | definition, primary, comparison | 四项原则及与传统分层的差异 |
| `src-martin-clean-architecture-2012` | `https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html` | definition, primary | Dependency Rule、策略层级、边界穿越、边界数据 |

复用：

| ID | Canonical URL | 角色 | 使用边界 |
| --- | --- | --- | --- |
| `src-aws-hexagonal-layered-overview` | `https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html` | comparison, implementation-boundary | 工程落地与成本补充，不覆盖原作者定义 |

所有新增来源均使用 `facts-summary`，`excerpt: null`，`quotation_reviewed: false`。来源页面、图片和代码按保守 ARR 边界处理：只链接、归纳事实，不改编图示或复制结构。每条来源必须同时进入 canonical ledger、document citation review、license inventory 和生成物，并通过链接健康与 manifest-primary 资格验证。

预计受治理来源从 `502` 增加至 `506`。

## 10. 关系治理

- STY-02 正文必须可见链接 `/styles`、`/styles/sty-00`、`/styles/sty-01` 和 `/cases/micro-frontends-single-spa`；
- STY-01 `adjacent_topics` 增加 `STY-02`；
- STY-01 原“后续主题”文字升级为真实 `/styles/sty-02` 链接；
- STY-02 与 STY-01 的相邻关系必须互惠；
- STY-02 对 STY-00 是依赖关系和正文回链，不要求把 STY-00 再扩成新的相邻边；
- Micro-Frontend 案例只用于比较边界所有权、团队与部署压力，不作为三种架构实现证据；
- STY-03 在正文、目录、accepted browser actions 中都必须不可执行。

## 11. 测试设计

### 11.1 RED 合同

在正文与图示实现前先新增专项测试，至少覆盖：

- STY-02 文件、slug、topic、priority、状态与完整元数据；
- 十一节 H2 的精确顺序；
- 三至五个学习问题；
- 共同内核五项规则；
- 术语矩阵和选择矩阵的列、行与顺序；
- 唯一“提交订单”案例及八个图节点；
- 控制流与源码依赖方向的区别；
- 外部数据类型不得越界；
- 部署/故障边界不由代码层自动推导；
- 迁移对象是依赖违规而非标签切换；
- 禁用条件和成本边界；
- 四个新来源与一个复用来源的精确顺序和治理字段；
- STY-01 reciprocal adjacency/link；
- STY-03 无可执行链接；
- Draw.io/SVG 配对、可访问性、必要标签和语义同步；
- Stage A 与 Stage B 的状态投影。

### 11.2 Mutation-sensitive 反例

测试必须证明会拒绝：

- 把三种架构改写为同义词；
- 注入固定演进顺序；
- 将六边形解释为六个端口；
- 把 Onion 改成基础设施拥有仓储接口；
- 把 Clean 的控制流方向误写为源码依赖方向；
- 让 HTTP、ORM、database row 或 SDK 类型穿过核心边界；
- 把代码边界宣称为独立部署或故障隔离；
- 删除禁用条件或把小型 CRUD 写成必然适用；
- 改变图中任一核心节点、边界或方向；
- 删除 reciprocal link；
- 注入 STY-03 actionable link；
- 把 Stage A pending 提前改为 complete；
- 修改历史 SHA、run/job ID、旧计数、旧 artifact hash 或旧 next-topic 文本。

### 11.3 验证顺序

使用仓库合同 `Node >=24`，不得回退到 Node 20。顺序为：

1. STY-02 专项测试；
2. Draw.io/SVG validator；
3. `npm run generate:content` 及生成物一致性；
4. `npm test`；
5. `npm run typecheck`；
6. `npm run build`；
7. 本地浏览器 QA；
8. Stage A exact-head 部署与生产 QA；
9. Stage B closure 全量验证；
10. 最终复审和 final exact-head 部署验证。

## 12. 发布与状态投影

### 12.1 Stage A

Stage A 发布正文、图、来源、关系、测试与生成物，但不勾选 STY-02：

- completed topics：`54`；
- content documents：`96`；
- governed sources：`506`；
- STY-02：published/pending；
- STY-03：planned/pending；
- current durable story：G009；
- next topic：STY-02，直到 exact-head 生产证据完成。

必须记录不可变 Stage A SHA、Pages run、build/deploy jobs、测试总数、QA artifact SHA-256 和浏览器总量。

### 12.2 生产 QA

页面集合：

- `/styles`
- `/styles/sty-00`
- `/styles/sty-01`
- `/styles/sty-02`
- `/cases/micro-frontends-single-spa`
- `/references`

资产：`/img/diagrams/sty-02-hexagonal-onion-clean-order.svg`

在桌面 `1440x1000` 和移动端 `390x844` 上检查：

- 六个页面与一个资产 HTTP 成功；
- 十二个 page/viewport observation；
- H1、正文和 SVG 加载；
- 两张 table 和一个 diagram wrapper 可聚焦、可局部横向滚动；
- 移动端无 document-level overflow；
- 五个来源在两个视口均可激活；
- STY-02 必需关系与 STY-01 reciprocal link 在两个视口均可激活；
- `/styles` 显示 STY-02 已发布、STY-03 为无链接计划项；
- Tego Arch console warnings/errors/page errors 为 `0/0/0`。

最终实施计划必须根据真实 DOM 锁定来源、关系、键盘滚动和截图的精确总数；不得在完成证据中使用估计值。

### 12.3 Stage B

只有 exact-head Stage A 部署和生产 QA 全部成功后才关闭 STY-02：

- backlog STY-02 `[ ]` → `[x]`；
- completed topics：`55`；
- content documents：`96`；
- governed sources：`506`；
- STY-02：published/complete；
- STY-03：planned/pending；
- durable story progress：`8 / 20`；
- current durable story：G009；
- next topic：STY-03。

关闭后再次运行全量测试、typecheck、build、最终复审和 final exact-head Pages/production QA。不得 checkpoint G009。

## 13. 失败、回退与停止条件

- 来源身份、版权或 transport 无法通过治理：保持 STY-02 pending，移除不合格事实或更换为可治理的一手来源；
- Draw.io/SVG 语义不同步或移动端溢出：不得进入 Stage A；
- Stage A SHA 与 Pages `headSha` 不一致或 job 未成功：不得关闭 backlog；
- 生产来源/关系/键盘交互/诊断任一失败：修复后产生新 exact-head 部署；
- Stage B 投影与 backlog、manifest、目录或生产页面不一致：保持 G009 current/STY-02 pending；
- 无法证明修改未触及历史证据：回退本批相关改动，不重写历史；
- 只有代码、测试、内容、来源、图示、关系、部署和生产证据全部通过，才可报告 STY-02 complete。

## 14. 规格验收清单

- [x] 用户选择“共同内核 + 术语叠加”；
- [x] 用户选择“依赖方向与边界所有权”为主比较轴；
- [x] 用户批准统一“提交订单”案例；
- [x] 用户批准共同内核和精确差异；
- [x] 用户批准控制流、数据和边界穿越；
- [x] 用户批准 Draw.io + SVG 图示设计；
- [x] 用户批准来源与关系治理；
- [x] 用户批准十一节内容结构；
- [x] 用户批准测试、Stage A/Stage B 与状态投影；
- [x] STY-03 保持 planned/pending 且不可执行；
- [x] G009 保持 current，不做 checkpoint。
