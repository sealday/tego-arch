# G008 Batch 10：MOD-12 架构图审阅清单设计

日期：2026-08-05

状态：已批准

目标分支：`codex/g008-modeling-batch10`

基线：`897c884387eda16527e76ede4686e38162469882`

## 1. 目标与范围

本批次只发布并关闭 `MOD-12 P1｜架构图审阅清单`。文章提供一套与表示法无关的审阅方法，覆盖路线图固定要求的九项信息：标题、范围、图例、边界、数据、协议、信任域、失败域和版本。文章不替代 C4、UML、Context Map、数据模型或部署图各自的语义规则，也不把一张图扩张为完整架构评审、威胁建模、可靠性分析或生产验证。

完整演练沿用 `MOD-02` 的权威名称和系统边界：目标系统固定称“费用申报系统”，外部支付能力固定称“银行支付服务”。本批次不修改或贬低 MOD-02 的权威图，而是创建一张明确标注为“故意含缺陷的审阅练习图”的独立资产。读者先审阅问题图，再把结论写入结构化发现台账，最后用修正图验证问题是否真正关闭。

本批次不发布 `MOD-13`。Stage A 发布 MOD-12、两组 Draw.io/SVG 资产、来源、关系和测试，但保持 MOD-12 pending；Stage B 只在 exact-head 生产部署与双视口 QA 全部通过后将 MOD-12 改为 complete。G008 保持 current，下一项为 MOD-13。

## 2. 已选方案与备选方案

### 已选：四道审阅门、九项显式检查和完整闭环

文章使用四道按顺序执行的审阅门：

1. **身份与范围**：标题、范围、版本；
2. **表示与边界**：图例、边界；
3. **运行与交换**：数据、协议；
4. **风险与隔离**：信任域、失败域。

九项要求不会被四道门合并或隐藏。每一项都必须在审阅矩阵中拥有独立行，并在完整演练中形成一条独立发现。四道门只是本站提供的记忆和执行顺序，不宣称是 C4、arc42 或 OWASP 的官方分组。

已选视觉结构为：

1. 含缺陷练习图；
2. 结构化发现台账；
3. 修正后架构图。

该顺序让读者先观察、后判断、再验证，避免把修正答案直接暴露在问题图旁边。发现台账可以直接被后续 MOD-13 复用为版本、责任与复查输入。

### 未选：九项平铺打勾

平铺清单简单，但容易把审阅变成“有或没有”的机械判断，无法说明问题为何危险、由什么图中证据触发、该由哪类责任人补证据，以及修正后如何复查。本文保留九项独立契约，同时增加四道门、严重度和关闭条件。

### 未选：单图编号批注

在一张图上同时放置九个编号可以快速定位，但会在移动端产生密集标记，并把观察、风险和修复结论混在同一视觉层。本文把完整结论放入可审计表格，图只承担拓扑和边界表达。

### 未选：分层交互式审阅

逐层开关标题、边界、数据、信任和失败信息适合大型评审工具，但会引入不必要的客户端状态、交互与测试面。本批次坚持静态、可打印、可复查的最小教学闭环。

## 3. 四道审阅门与九项合同

### 3.1 身份与范围

- **标题**：必须说明图的类型、目标系统或主题，以及本图回答的主要问题。只有项目名或“架构图”不足以让图独立成立。
- **范围**：必须说明抽象层级、受众、场景、环境和明确不回答的问题。不同层级或观察单位不得在没有说明的情况下混入一张图。
- **版本**：必须记录 `as-is / to-be / teaching assumption`、修订号、事实截止日期和维护责任类型。日期不是生产真实性证明，责任类型也不是自动批准人。

### 3.2 表示与边界

- **图例**：必须解释元素类型、线型、箭头、颜色、边框、缩写和任何尺寸含义；颜色不得成为唯一语义载体。
- **边界**：必须区分系统内外、外部参与者与相邻系统；若图表达 Container、Component、Deployment 或候选 Context，边界必须与该抽象层级一致。

### 3.3 运行与交换

- **数据**：每条重要关系要说明交换的业务事实、数据方向、权威或消费责任；数据库图标、连线或动词不能自动证明数据所有权、一致性或运行顺序。
- **协议**：只有获得证据时才写具体协议、通道、同步/异步、消息或调用语义。没有证据时固定写“待确认”，不得为了让图完整而补成 HTTPS、Kafka、REST、事件或数据库共享。

### 3.4 风险与隔离

- **信任域**：标出已知或候选信任边界、跨界数据与仍需安全证据确认的部分。系统边界、网络边界和信任边界不得自动等同。
- **失败域**：标出已知或候选失败边界、外部依赖和传播问题；没有部署与运行证据时，必须把独立失败域、故障隔离、切换与恢复结论保留为未知。

审阅矩阵固定九行，列固定为：`审阅门｜检查项｜必须回答的问题｜所需证据｜失败信号｜明确不证明`。矩阵是方法入口，不记录本次演练的修复状态。

## 4. 权威输入与问题图缺陷合同

### 4.1 MOD-02 权威输入

问题图和修正图可以使用以下已发布元素与关系语义：

- 员工：`PERSON`；
- 费用申报系统：目标系统；
- Web 应用：`CONTAINER`；
- 申报 API：`CONTAINER`；
- 申报数据库：`DATA STORE`；
- 支付任务执行器：`CONTAINER`；
- 银行支付服务：边界外的 `EXTERNAL SYSTEM`；
- 已支持的关系意图：使用、提交申报、读写、创建支付任务、请求付款。

MOD-11 可以补充业务数据语义，例如已提交的费用事实、审批决定、支付请求以及银行回执或查询结果，但不得把候选 Bounded Context 直接重命名为 Container，也不得从 Context Map 箭头推导协议或运行顺序。

### 4.2 九类受控缺陷

含缺陷练习图必须独立、显式标为教学练习，并且只包含以下九类受控问题：

1. 标题只有模糊的“费用平台架构图”，没有图类型和评审问题；
2. 把系统、Container、数据库和外部系统放在同一未说明层级；
3. 没有图例，元素类型、边框、线型和缩写无法解释；
4. 把银行支付服务错误放入费用申报系统边界；
5. 关系未说明交换数据、方向和权威责任；
6. 连线使用“同步/事件？”或等价含混标签，既暗示协议又没有证据；
7. 没有标出任何已知或候选信任边界；
8. 把本地支付任务与外部银行画成一个未经证据支持的失败域；
9. 没有 as-is/to-be、修订号、事实截止日期和维护责任类型。

不得为了增加缺陷数量再加入错误容量、实例数、团队名、数据库共享、SLA、认证机制或生产事故。问题图不是生产快照，也不是对 MOD-02 原图的质量判决。

### 4.3 固定严重度

九条演练发现使用以下严重度：

- **阻断**：可能导致错误的系统边界、信任、失败或数据权威决定；
- **重要**：图的语义不能被独立评审者稳定复述；
- **待澄清**：需要补证据，但当前不能自行推断。

固定分配为五条阻断、三条重要、一条待澄清：范围、边界、数据、信任域和失败域为阻断；标题、图例和版本为重要；协议为待澄清。测试必须拒绝严重度被弱化、互换或删除。

## 5. 内容合同

MOD-12 使用以下九个且仅以下九个 H2，顺序固定：

1. 学习问题
2. 审阅目标与输入
3. 四道审阅门
4. 核心产物
5. 完成判断
6. 常见失败
7. 与其他模型的衔接
8. 完整演练
9. 来源

“学习问题”提出三至五个可回答问题，至少覆盖独立理解、层级与边界、数据与协议证据、信任与失败边界，以及版本和复查。“完整演练”必须从问题图开始，按四道门填写九条发现，修正图后逐项复查；不能先展示答案再反推问题。

### 5.1 审阅输入

开始前必须收集：

- 图的原始文件、目标受众和要做出的决策；
- 图类型、抽象层级、系统或场景范围；
- 可用的代码、运行、部署、数据、接口、安全、事故和决策证据；
- MOD-02 权威名称与系统边界；
- MOD-11 仍为候选的领域边界和非证明规则；
- QA-02 的可靠性、可用性与恢复证据边界；
- QA-05 的安全、隐私与信任边界；
- 当前无法确认的协议、信任、失败和版本信息；
- 能补充系统边界、接口、安全、可靠性和文档版本证据的责任类型。

缺少输入不是跳过检查的理由，而是形成“待澄清”发现的证据。审阅者不得访问图外事实后把它悄悄补进结论；新增证据必须可追溯。

### 5.2 七步演练

1. 只看问题图，用一句话复述它声称回答的问题，并记录无法复述的部分。
2. 执行身份与范围门，检查标题、范围和版本。
3. 执行表示与边界门，检查图例和系统内外边界。
4. 执行运行与交换门，检查数据事实、方向、权威和协议依据。
5. 执行风险与隔离门，检查信任域、失败域和未知项。
6. 将九条发现写入台账，分配严重度、责任类型和复查状态，再制作修正图。
7. 由未参与修图的人重新复述，逐项关闭、保留或退回发现，并确认没有引入新事实。

## 6. 核心产物与视觉设计

### 6.1 格式路由

格式决策固定为 `Draw.io + SVG`。决定性条件是：两张图都有多个边界或视觉区域，连接线携带解释性标签，系统、外部系统、信任与失败标记需要精确布局，而且它们是文章的核心教学与发布资产。Mermaid 的自动布局难以稳定保持问题图与修正图的对照几何，也不适合受控展示边界错误与标签缺失。

创建以下两组语义同步资产：

- `diagrams/mod-12-architecture-review-problem.drawio`
- `static/img/diagrams/mod-12-architecture-review-problem.svg`
- `diagrams/mod-12-architecture-review-corrected.drawio`
- `static/img/diagrams/mod-12-architecture-review-corrected.svg`

两图使用相同的核心节点、主阅读方向和稳定节点位置，使读者可以把每项修正映射回问题图。问题图可以故意缺失图例、标签或正确边界，但 Draw.io 与其 SVG 仍必须在“实际可见内容”上同步；不能让源文件偷偷包含 SVG 中未显示的正确答案。

### 6.2 修正图合同

修正图标题固定表达：费用申报系统、Container 图、费用提交与支付协作、`as-is teaching exercise`、修订号和 2026-08-05 事实截止日期。图例解释 Person、Container、Data Store、External System、系统边界、候选信任边界、候选失败边界、实线关系与待确认标签。

银行支付服务必须位于费用申报系统之外。系统与银行之间只标为“外部依赖 / 候选信任边界”，不得宣称认证、加密、协议、SLA 或独立故障切换已经存在。员工与系统之间的认证和授权边界、内部组件是否属于独立失败域、所有具体协议都保持“待确认”，直到有安全、部署或运行证据。

修正图可以写出已支持的业务数据或关系意图，但不得把关系标签升级为调用顺序、事务、一致性、共享数据库或消息保证。图旁正文必须说明：系统边界不等于信任边界，Container 边界不等于失败域，外部系统也不自动证明故障已经隔离。

### 6.3 几何、可访问性与响应式合同

两张 SVG 的桌面文章宽度必须精确测量为 `800px`，并记录 `800 / viewBox width` 的 authoring-to-rendered 比例。所有几何阈值都按最终 CSS 像素验证：

- 节点水平 padding 至少 16px，垂直 padding 至少 14px；
- 标题与类型基线间距至少 22px；
- 文本到底部至少 14px；
- 边标签到线至少 8px，到真实箭头 footprint 至少 16px，到节点至少 12px；
- 正文与边标签至少 15px，类型或角色标签至少 10px；
- 节点标题最多两行；
- 不得用不透明标签背景擦除连接线；
- 颜色不能成为区分内部、外部、信任或失败语义的唯一方式。

两张图都放入可聚焦的局部横向滚动 wrapper，支持 Tab 和 ArrowLeft/ArrowRight。mobile `390x844` 下允许 wrapper overflow，不允许 document-level overflow。Draw.io 与 SVG 必须包含同步的可见语义标签，并通过仓库 validator。

### 6.4 两张九行表

第一张审阅矩阵固定九行，列为：`审阅门｜检查项｜必须回答的问题｜所需证据｜失败信号｜明确不证明`。

第二张发现台账固定九行，列为：`检查项｜严重度｜图中证据｜风险｜修复建议｜责任类型｜复查状态`。责任只能写类型，例如系统边界维护者、接口契约责任人、安全责任人、可靠性责任人或架构文档维护者；不得虚构团队或个人。Stage A 的九条状态在演练正文中可以显示“待复查”，修正图复查结果必须逐项说明已关闭、保留待澄清或退回，不能用一个总 PASS 覆盖全部行。

## 7. 完成判断、非证明规则与恢复

### 7.1 完成判断

一次架构图审阅只有在以下条件全部满足时才完成：

- 九项检查都有明确结论，没有被空白或“看起来可以”代替；
- 每条发现都有图中证据、风险、修复建议、责任类型和复查状态；
- 所有阻断项已关闭，或有可见的拒绝发布决定；
- 待澄清项没有被转换为具体协议、部署、安全或可靠性事实；
- 修正图与可追溯证据一致，并保留仍未知的内容；
- 未参与修图的评审者能复述图的类型、范围、边界、数据关系和非证明项；
- 两组 Draw.io/SVG 语义同步，桌面与移动端均可读；
- 与 MOD-01、MOD-02、MOD-03、MOD-04、MOD-11、QA-02、QA-05 和后续 MOD-13 的交接边界清楚。

### 7.2 非证明规则

文章必须逐项锁定：

- 标题完整不等于图中事实正确；
- 图例完整不等于所有抽象层级可以混用；
- 系统边界不等于信任边界、网络边界、部署边界或组织边界；
- 数据关系不等于数据所有权、一致性、事务或运行顺序；
- 协议标签不证明实现、配置、兼容性或运行健康；
- Container、Context、数据库或团队不存在自动一一映射；
- 外部系统不自动构成独立失败域或完成故障隔离；
- 版本块不证明图与当前代码、部署或运行状态一致；
- 审阅清单不替代威胁建模、可靠性演练、代码检查、部署盘点或生产观测。

### 7.3 失败与恢复

- **来源不支持结论**：把结论降级为“待澄清”，记录下一项证据，不补写事实。
- **问题图和修正图无法一一对照**：恢复稳定节点位置和共同标签，再复查九条发现。
- **Draw.io 与 SVG 漂移**：验证直接失败，重新同步两端后才能继续。
- **标签或连线发生遮挡**：按最终 CSS 像素重新测量节点、箭头和标签 clearance，不用缩小字体绕过。
- **移动端页面溢出**：修复 wrapper ownership；不得把页面级 overflow 记录成可接受限制。
- **Stage A 生产 QA 不完整**：MOD-12 保持 pending，不写 Stage B 关闭证据。
- **本地 main 存在并行提交或文件**：保护并行工作，采用可验证、非破坏的集成路径，不 reset、clean 或强制覆盖。

## 8. 与其他模型和知识关系的衔接

MOD-12 metadata 固定为：

- `title: 架构图审阅清单`
- `slug: /modeling/mod-12`
- `content_type: modeling`
- `status: reviewed`
- `difficulty: intermediate`
- `analyzed_at: 2026-08-05`
- `source_cutoff: 2026-08-05`
- `review_policy: quarterly-version-sensitive`
- `confidence: high`
- `domains: [software-architecture]`
- `agent_patterns: []`
- `protocols: []`
- `quality_attributes: [understandability, maintainability, reliability, security]`
- `tags: [架构图, 架构评审, C4, 威胁建模]`
- `summary: 用四道审阅门检查标题、范围、图例、边界、数据、协议、信任域、失败域和版本，并用问题图、发现台账与修正图完成复查。`
- `topic_id: MOD-12`
- `priority: P1`
- `depends_on: [MOD-01, MOD-02, MOD-03]`
- `adjacent_topics: [MOD-11, QA-02, QA-05]`
- `related_cases: [/cases/microsoft-multi-agent-reference-architecture]`
- `related_questions: []`

发布时必须添加并测试以下可见关系：

- MOD-12 链接到 `/modeling`、MOD-01、MOD-02、MOD-03、MOD-04、MOD-11、QA-02、QA-05 和 Microsoft terminal case；
- MOD-11 将“后续 MOD-12”改为可操作链接，并新增 reciprocal adjacency；候选 Context 仍不能直接成为组件拆分；
- QA-02 新增 reciprocal adjacency，说明失败边界需要运行、部署与恢复证据，图形隔离不是故障隔离证明；
- QA-05 新增 reciprocal adjacency，说明信任边界需要数据、身份、权限和威胁证据，系统边界不是信任边界证明；
- MOD-04 作为文档、事实分类和版本交接被正文链接，但不新增不必要的 adjacency；
- MOD-13 只作为下一步模型同步、版本与漂移治理方向以普通文字出现，在其发布前不创建 `/modeling/mod-13` 链接或 adjacency。

不使用 `data/topic-relations.json` override 修补已发布关系。依赖表示学习和输入顺序，adjacency 只表示需要双向导航的直接邻接。

## 9. 来源治理

本批次可见引用四个独立来源，其中新增两个来源身份、复用两个既有身份；检索日期统一为 2026-08-05：

1. `https://c4model.com/diagrams/checklist` — 新增 C4 Model 官方 Software Architecture Diagram Review Checklist；支持标题、图类型、范围、图例、元素名称/类型/职责、关系方向、标签和适用时的协议检查；`official-docs / primary`；MOD-12 唯一 `manifest_primary: true`。C4 网站页脚声明 CC BY 4.0，按 `CC-BY-4.0` 与 `adapt-with-attribution` 治理，但文章只做 `facts-summary`，不复制官方表格、措辞或布局。
2. `https://c4model.com/diagrams/notation` — 复用 `src-c4model-notation`；支持自描述符号、标题、scope、legend、元素类型/职责、关系方向和关系标签；不证明本站练习图正确或可读。
3. `https://docs.arc42.org/section-3/` — 新增 arc42 v9 Context and Scope；支持系统与通信伙伴的范围区分、业务输入输出、技术通道/协议以及业务与技术上下文分离；`official-docs / primary`。许可证据复用 `https://arc42.org/license` 的 CC BY-SA 4.0 家族记录，按 `CC-BY-SA-4.0` 与 `adapt-sharealike-review` 治理，正文只使用 `facts-summary`，不复制模板或示例。
4. `https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html` — 复用 `src-cheatsheetseries-ea079221bd09`；支持系统建模需要理解数据流和信任边界，以及模型应持续更新和复查；不把 MOD-12 变成完整威胁建模流程，也不支持失败域或版本结论。

四道门、九项矩阵、严重度、费用申报系统的问题图、修正图、两张表、七步演练和中文表述均为本站原创综合方法。C4 只支撑通用图示与 C4 语境，arc42 只支撑 context/scope 与业务/技术接口，OWASP 只支撑数据流、信任边界和持续复查。失败域和恢复边界由已发布 QA-02 及其受治理来源衔接，不能反向宣称外部资料认可本站九项清单。

Stage A 新增一篇内容文档和两个来源身份，预期投影为 `50 / 93 / 490`；Stage B 只关闭 MOD-12，来源和文档数保持不变，预期投影为 `51 / 93 / 490`。持久故事保持 `7 / 20`，G008 保持 current，MOD-13 为 next。

## 10. 测试与发布门槛

### 10.1 Mutation-sensitive 内容合同

新增 Batch 10 内容测试，至少锁定：

- MOD-12 metadata、九个 H2 及精确顺序；
- 四道门、九项独立检查、两张九行表和精确列名；
- 问题图的九类受控缺陷和 `5 blocking / 3 important / 1 clarification`；
- 修正图恢复 MOD-02 的 Person、Container、Data Store、External System、系统名称与银行外部身份；
- 具体协议、认证、加密、SLA、部署、故障切换和团队名称保持未知；
- 两组 Draw.io/SVG 路径、可见标签、边界、方向、角色和语义同步；
- 两图 wrapper、两表 wrapper、Tab 聚焦和 ArrowLeft/ArrowRight 局部滚动；
- 九项非证明规则、七步演练、完成条件、责任类型与逐项复查；
- MOD-11、QA-02、QA-05 reciprocal adjacency，MOD-04 普通关系和 MOD-13 零操作链接；
- 两个新来源、两个复用来源、唯一 manifest primary、精确许可证据和全部 `facts-summary` 边界；
- Stage A `50 / 93 / 490`、MOD-12 published/pending、G008 current、durable `7 / 20` 和 next MOD-12。

Mutation 必须分别删除、交换或替换 H2、审阅门、检查项、表列、表行、严重度、系统边界、银行归属、节点类型、未知协议、信任/失败候选、版本字段、责任类型、来源和关系，证明测试拒绝结构与语义漂移，而不是只检查关键词存在。

### 10.2 Draw.io/SVG 验证

两组资产分别运行：

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/mod-12-architecture-review-problem.drawio \
  static/img/diagrams/mod-12-architecture-review-problem.svg \
  --label '费用平台架构图' \
  --label '员工' \
  --label 'Web 应用' \
  --label '申报 API' \
  --label '申报数据库' \
  --label '支付任务执行器' \
  --label '银行支付服务' \
  --label '同步/事件？'

node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/mod-12-architecture-review-corrected.drawio \
  static/img/diagrams/mod-12-architecture-review-corrected.svg \
  --label '费用申报系统 Container 图' \
  --label '员工' \
  --label 'Web 应用' \
  --label '申报 API' \
  --label '申报数据库' \
  --label '支付任务执行器' \
  --label '银行支付服务' \
  --label '协议：待确认' \
  --label '候选信任边界' \
  --label '候选失败边界'
```

计划中的浏览器 QA 状态为 `NOT RUN`，直到资产实际创建。实现时必须记录桌面 `1440x1000` 下每张 SVG 精确 `800px` 宽度、authoring-to-rendered scale、指定节点标题/类型基线、底部 clearance、每个边标签到线/箭头/节点的真实 clearance，以及 mobile `390x844` 的 wrapper scroll 和 document overflow。

### 10.3 Stage A

Stage A 发布正文、两组 Draw.io/SVG、两个新来源、两个复用引用、双向关系、内容测试和审查记录，但保持 MOD-12 backlog checkbox 未完成。每个 Node/npm 命令固定使用 `PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH`。提交前运行 targeted tests、两组 diagram validator、density 检查、`npm run verify`、`git diff --check`，并完成独立内容、事实、版权、可访问性、视觉和测试审查。

Stage A 推送后，等待 exact-head GitHub Pages run `completed/success`，再执行生产 QA。canonical page routes 至少覆盖：

1. `/`
2. `/modeling`
3. `/modeling/mod-01`
4. `/modeling/mod-02`
5. `/modeling/mod-03`
6. `/modeling/mod-04`
7. `/modeling/mod-11`
8. `/modeling/mod-12`
9. `/quality-attributes/qa-02`
10. `/quality-attributes/qa-05`
11. `/cases/microsoft-multi-agent-reference-architecture`
12. `/references`
13. `/references/primary`

另行验证两张 SVG asset route。生产 QA 使用 desktop `1440x1000` 与 mobile `390x844`，必须验证：

- Draw.io/SVG pair `2/2`，问题图九类缺陷和修正图九类修复可见；
- 表格 `2/2`，数据行分别为 `9 + 9`；
- 两图和两表 wrapper 可聚焦且是实际 overflow owner，ArrowLeft/ArrowRight 只驱动聚焦容器；
- desktop 与 mobile 的 document overflow 均为零；
- 来源激活 `8/8`：四个可见来源乘两个视口；
- 关系激活预计 `24/24`：MOD-12 的九个可见站内关系乘两个视口，加 MOD-11、QA-02、QA-05 reciprocal backlink 各乘两个视口；
- closed-world MOD-13 operator target 为零；
- console warnings、console errors、page errors 均为零。

保存原始 JSON artifact 和 SHA-256；截图只作辅助，不替代结构化页面、几何与交互证据。若本地 Node/Docusaurus 出现既有 `localStorage` ExperimentalWarning，单独记录为环境噪声，并以生产浏览器 `0/0/0` 为运行时门槛。

### 10.4 Stage B

只有 Stage A exact-head 部署和全部生产 QA 通过后才关闭 MOD-12。Stage B 必须：

- 创建 `docs/reviews/g008-batch10.md`，固定 Stage A SHA、Pages run、测试总数、页面与资产路由、双视口、图表、交互、几何、来源、关系、MOD-13 零操作和诊断证据；
- 固定 QA artifact 路径与 SHA-256；
- 将 MOD-12 backlog checkbox 改为完成，保留 Batch 9 及更早的 SHA、run、计数、观察和历史段落；
- 将状态投影更新为 `51 / 93 / 490`、持久故事 `7 / 20`、current G008、next MOD-13；
- 再次运行 targeted tests、diagram validators、density、`npm run verify`、`git diff --check` 和独立终审；
- 采用不破坏根工作区并行修改的集成路径，推送 origin/main；
- 验证 final SHA 的 exact-head Pages run 与全部 canonical production smoke。

## 11. 工作区、错误处理与停止条件

- 所有设计与实现只在 `/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch10` 的 `codex/g008-modeling-batch10` 分支进行。
- 基线固定为 origin/main 的 `897c884387eda16527e76ede4686e38162469882`；不得把根工作区本地 main 的并行提交混入 Batch 10。
- 根工作区现有 `.codex/config.toml`、`static/img/illustrations/tego-arch-initial-release-roadmap.png` 和并行 README/homepage 提交必须保持未修改、未暂存、未删除、未重写。
- 不新增 npm 依赖、第三方图标、位图或关系 override。所有新图为本站原创 Draw.io/SVG pair。
- 网络、来源许可、diagram validator、几何、构建、测试、部署或 QA 失败必须保留原始证据并修复；不得通过删减断言、跳过检查、缩小不可读字体或伪造完成记录绕过。
- Stage A 生产 QA 未全部通过时不得关闭 MOD-12；Stage B final exact-head 部署与 smoke 未通过时不得宣布 Batch 10 完成。
