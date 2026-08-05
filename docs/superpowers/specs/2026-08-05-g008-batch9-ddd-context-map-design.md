# G008 Batch 9：MOD-11 DDD Context Map 设计

日期：2026-08-05

状态：已批准

目标分支：`codex/g008-modeling-batch9`

基线：`d785def4c2136fcd310c63a86341c67869b26b1c`

## 1. 目标与范围

本批次只发布并关闭 `MOD-11 P1｜DDD Context Map`。文章沿用费用申报系统教学场景，把 MOD-09 的热点、未知项和边界假设，以及 MOD-10 的语言、协作和权威记录线索，整理为一张证据受限的 Context Map。主产物包含三个候选 Bounded Context、一个外部系统、四条上下游关系、一张边界证据表和一张关系责任表。

`MOD-02` 的图继续作为系统边界与名称的权威：三个候选 Context 都位于“费用申报系统”内部，“银行支付服务”位于系统外部且不是本站为本地领域划定的 Bounded Context。本文只形成可继续验证的候选边界，不批准服务拆分、数据库拆分、部署拓扑、代码仓库、团队结构或组织职责。

本文只引入理解当前四条关系所需的最小 upstream/downstream 语义，并在银行边界具体展示一次 downstream Anti-Corruption Layer（ACL）责任。Partnership、Shared Kernel、Customer/Supplier、Conformist、Open Host Service、Published Language 等完整模式目录留给 DDD-06 或后续专题，不在入门文章中穷举。

本批次不发布 `MOD-12..13`。Stage A 发布 MOD-11 但保持 pending；Stage B 只将 MOD-11 改为 complete，G008 保持 current，下一项为 MOD-12。

## 2. 已选方案与备选方案

### 已选：具体费用场景的证据受限 Context Map

使用 `费用申报`、`费用审批`、`支付结算` 三个候选 Bounded Context，加上外部的 `银行支付服务`，回答“哪些语言、规则和业务权威需要被分别保护，以及边界之间由谁承担翻译和契约责任”。每个候选都必须同时给出支持证据、反证或合并备选，以及下一次验证动作。

该方案保留三类相互校验的产物：

1. 一张原创 Mermaid Context Map，表达 MOD-02 权威系统边界和四条模型影响关系；
2. 一张候选边界证据表，防止把候选命名直接升级为架构事实；
3. 一张关系责任表，明确 U/D、交换事实、翻译责任、契约责任与非证明边界。

### 未选：按系统模块直接切三块

按页面、服务、数据库或现有模块命名 Context 虽然容易落图，却会把解决方案结构误当成业务语言边界，也无法解释规则为何独立变化。本文从语言、规则、权威记录和协作证据出发，不从代码目录反推 Bounded Context。

### 未选：完整关系模式目录

在一篇文章中同时演示全部 Context Mapping patterns 会稀释边界发现主线，并诱导读者仅凭一张图给每条边强行贴模式标签。本文只保留 U/D 和一个可被具体解释的 ACL，其他模式只有在获得组织协作、模型共享和契约治理证据后才可选择。

### 未选：把候选边界直接批准为服务与团队

直接把三个候选 Context 映射为三个服务或三个团队会制造未经证据支持的组织和部署承诺。本文只登记责任类型与待确认 owner，不虚构团队名称，也不假定 Context 与团队一一对应。

## 3. 权威边界与候选判断规则

### 3.1 MOD-02 系统边界

MOD-02 的图对本批次具有以下约束：

- 系统固定称“费用申报系统”；
- 外部支付能力固定称“银行支付服务”；
- `费用申报`、`费用审批`、`支付结算` 都只是系统内部候选 Bounded Context；
- 银行支付服务是外部系统，不是本地候选 Context；
- Context Map 可以细化系统内部模型边界，但不能重画或扩大 MOD-02 已批准的系统范围。

### 3.2 候选 Bounded Context 的证据门槛

每个候选都要回答五类问题：

1. 本地语言：同一个词在这里有什么专门含义，何处与其他区域发生含义冲突；
2. 本地规则：哪些政策、不变量或状态变化独立演进；
3. 业务权威：什么业务事实或决定在该边界内具有解释权；
4. 支持证据：MOD-09、MOD-10、政策、事故、权威记录或领域专家提供了什么线索；
5. 反证与验证：它可能与哪个候选合并或继续拆分，下一步由哪类责任人补什么证据。

满足这些字段只表示候选值得继续验证，不表示边界已经获得架构、组织或交付批准。若语言、规则和权威长期共同变化，候选应考虑合并；若一个候选内部持续存在相互冲突的语言和独立变化规则，则应考虑继续拆分。

### 3.3 三个候选的固定教学结论

- **费用申报**：聚焦申请人、费用、凭证、提交与补正；权威范围是被提交并可供后续判断的费用事实，不拥有审批结论或银行支付结果。
- **费用审批**：聚焦审批决定、理由、权限与政策适用；权威范围是审批决定及其依据，“已批准”不得被解释为“已支付”。
- **支付结算**：聚焦支付请求、回执、结果未知、查询、对账与可展示摘要；它负责本地支付执行语义和外部结果翻译，但银行支付结果的外部证据仍来自银行支付服务。

文章不得把以上结论写成既有生产事实。证据表必须保留至少以下备选：费用申报与费用审批可能合并；费用审批与支付结算可能只是同一生命周期的相邻阶段；支付结算中的对账职责未来可能需要进一步拆分。

## 4. 关系语义与责任合同

### 4.1 最小 U/D 语义

`upstream (U)` 表示一条关系中对交换模型或事实具有先行影响的一侧，`downstream (D)` 表示需要消费、适配或承受该影响的一侧。U/D 是逐关系角色，同一个 Context 可以在不同关系中分别处于 U 或 D；它不表示组织权力、网络包方向、运行时调用方向或价值高低。

图中箭头统一从 U 指向 D，只表达模型影响和集成责任。箭头不证明 API、消息、事件、事务、协议、同步/异步、调用顺序、数据复制或部署连接。

### 4.2 四条固定关系

1. `费用申报 U → D 费用审批`：交换已提交的费用事实；审批侧负责按审批语言和政策消费这些事实。
2. `费用审批 U → D 支付结算`：交换审批决定；必须显式保留“已批准 ≠ 已支付”。
3. `银行支付服务 U → D 支付结算`：交换银行回执或查询结果；支付结算作为 downstream 承担 ACL 翻译责任，不据此声称银行提供 OHS/PL。
4. `支付结算 U → D 费用申报`：交换可展示的支付结果摘要；费用申报可以展示摘要，但不是银行结果或支付执行状态的权威来源。

### 4.3 ACL 边界

ACL 在本文中只表示 downstream 的翻译与隔离责任：支付结算把银行回执、状态码或查询语义转换为本地可理解的支付结果，同时保留原始外部证据的可核验性。ACL 标签不证明生产代码中已经存在某个组件、适配器、服务、库或部署单元，也不证明银行侧采用 Open Host Service 或 Published Language。

关系责任表必须为每条关系记录：U、D、交换事实、翻译责任、契约责任类型、当前非证明项和下一次验证责任。owner 只能写职责类型，例如“审批政策责任人”“支付/对账责任人”“外部集成契约责任人”或“系统边界架构责任人”，不能虚构具体团队。

## 5. 内容合同

MOD-11 使用以下九个且仅以下九个 H2，顺序固定：

1. 学习问题
2. 建模目标与输入
3. 边界候选与证据规则
4. 核心产物
5. 完成判断
6. 常见失败
7. 与其他模型的衔接
8. 完整演练
9. 来源

“学习问题”提出三至五个可回答问题，至少覆盖 Bounded Context 与系统/模块的区别、候选证据、U/D、ACL、非证明边界及后续验证。“完整演练”从 MOD-09 与 MOD-10 的线索开始，逐项形成候选、寻找反证、标记关系、分配验证责任并复述整张图，不能只重复图中标签。

### 5.1 建模输入

工作开始前记录：

- MOD-02 的权威系统边界和“银行支付服务”名称；
- MOD-09 中审批与支付语言差异、热点、未知项和候选边界线索；
- MOD-10 中 actor、work object、语言分歧、协作变化和权威记录冲突；
- 真实业务术语、政策、规则变更历史、事故、权威记录与跨阶段不变量；
- 每个候选的支持证据、反证、合并或拆分备选；
- 能确认术语、政策、支付证据、外部契约和系统边界的责任类型；
- 本次不会决定的服务、数据库、部署、代码和团队问题。

既有流程图、状态机、数据模型、EventStorming 或 Domain Story 只能提供线索，不能自动生成 Bounded Context。Temporal Saga 案例只能检验超时、重试、补偿和人工收敛，不得反向决定业务边界。

### 5.2 七步演练

1. 复述 MOD-02 权威系统边界，明确银行支付服务位于系统外。
2. 从 MOD-09 与 MOD-10 收集语言、规则、权威记录和协作变化线索，不按现有模块分组。
3. 提出三个候选 Context，并为每个候选填写支持证据、反证和备选划分。
4. 为四条关系逐条判断 U/D，写清交换的业务事实，不画运行时调用链。
5. 只在银行边界标注 downstream ACL，说明翻译内容和未被证明的模式。
6. 为每个未决边界和关系登记责任类型、下一项证据与复查条件。
7. 从系统边界到四条关系完整复述，确认候选、权威和非证明规则没有相互矛盾。

## 6. 核心产物与视觉设计

本文只使用仓库现有 Mermaid 和 Markdown 可访问包装，不创建 Draw.io、SVG、raster 资产或第三方模板，不复制 DDD Crew cheat sheet、Miro 模板、示例地图、图标或布局。

### 6.1 Context Map Mermaid

主图位于可聚焦的 `diagram-wrapper diagram-wrapper--scroll-owner` 中，外层是实际横向滚动 owner。Mermaid 使用一个标注为“费用申报系统（MOD-02 权威系统边界）”的 subgraph，内部只有三个候选节点：费用申报、费用审批、支付结算；银行支付服务节点必须位于 subgraph 外部。

图固定包含四条且仅四条有向关系：

- 费用申报到费用审批：`U→D：已提交的费用事实`；
- 费用审批到支付结算：`U→D：审批决定（已批准 ≠ 已支付）`；
- 银行支付服务到支付结算：`U→D：银行回执/查询结果；D 侧 ACL`；
- 支付结算到费用申报：`U→D：可展示的支付结果摘要`。

图例必须说明“候选 Bounded Context”“外部系统”“U/D 为逐关系模型影响角色”“箭头不是运行时流”。不得通过颜色、容器或箭头暗示团队、服务、数据库、部署、协议或正式所有权。

### 6.2 候选边界证据表

第一张可横向滚动表固定三行，列固定为：

- 候选 Context；
- 本地语言；
- 独立规则；
- 业务权威；
- 支持证据；
- 反证或备选；
- 下一项验证与责任类型。

三行必须与图中三个候选逐项一致。表中不得出现虚构团队、数据库或服务名称；每行至少有一个可能导致合并、拆分或否决候选的真实备选。

### 6.3 关系责任表

第二张可横向滚动表固定四行，列固定为：

- 上游 U；
- 下游 D；
- 交换事实；
- 翻译或适配责任；
- 契约责任类型；
- 当前不证明什么；
- 下一项验证与责任类型。

四行必须与 Mermaid 的方向、标签和事实逐项一致。银行关系是唯一显式 ACL 行；其他三行不得被顺手贴上未验证的 Context Mapping pattern。

两张表和主图都必须支持容器内横向 overflow、Tab 聚焦以及 ArrowLeft/ArrowRight 键盘滚动。桌面与移动端不得出现 document overflow。

## 7. 完成判断、失败模式与恢复

### 7.1 完成判断

一次教学 Context Mapping 活动只有在以下条件全部满足时才可结束：

- 每个候选都记录本地语言、独立规则、业务权威、支持证据、反证或备选以及下一项验证责任；
- 每条关系都记录 U/D、交换事实、翻译责任、契约责任、非证明边界和下一项验证；
- 参与者能在不使用 API、调用链或组织权力解释的情况下复述四条箭头；
- 银行支付服务保持外部系统身份，支付结算的 ACL 责任与银行结果权威不混淆；
- MOD-09、MOD-10 的线索被明确接受、否决或保留为待验证项；
- 所有未决项都有责任类型、下一项证据和复查条件；
- 所有人理解三块都是候选，不是已批准的系统、服务、数据库、团队或部署划分；
- 与 MOD-01、MOD-02、MOD-05、MOD-08、MOD-09、MOD-10 和后续 MOD-12 的交接边界清楚。

### 7.2 非证明规则

文章必须逐项锁定：

- Bounded Context 不等于子域、系统、服务、模块、数据库、仓库、部署单元或团队；
- Context 与团队不存在自动的一对一关系；
- 图中的箭头不等于 API、调用、事件、事务、协议、网络方向或执行顺序；
- U/D 不等于组织权力、价值高低或数据包方向；
- ACL 标签不证明实现已经存在；
- 业务权威不等于数据库、存储位置或组织所有权；
- 银行支付服务是外部系统，不是本地 Bounded Context；
- 三个候选都可能在后续证据下合并、拆分或被否决。

### 7.3 常见失败与恢复

- **按微服务或数据库切 Context**：回到语言、规则、权威记录和变化原因，再判断边界。
- **把子域与 Bounded Context 画成同一层**：分别说明问题空间与模型适用边界，不做名称一一映射。
- **从 EventStorming 泳道直接生成 Context**：把泳道只当线索，为每个候选补证据与反证。
- **把 Domain Story actor 当 owner**：回到语言和权威判断，actor 只表示具体故事中的参与者。
- **把箭头读成调用链**：隐藏技术名词，只用 U/D、交换事实和翻译责任复述。
- **给每条边强行贴模式**：删除无证据标签，只保留可解释的 U/D 和银行侧 ACL。
- **把外部银行画进本地 Context**：恢复 MOD-02 权威系统边界，将银行放回外部。
- **候选一落图就宣布组织拆分**：恢复“候选”状态，登记责任类型与下一项验证证据。

## 8. 与其他模型和知识关系的衔接

MOD-11 metadata 固定为：

- `depends_on: [MOD-01, MOD-02, MOD-09, MOD-10]`
- `adjacent_topics: [MOD-05, MOD-08]`
- `related_cases: [/cases/temporal-saga-durable-execution]`
- `related_questions: []`

发布时必须添加并测试以下可见关系：

- MOD-11 链接到 `/modeling`、MOD-01、MOD-02、MOD-05、MOD-08、MOD-09、MOD-10 和现有 Temporal Saga terminal case；
- MOD-05 新增 MOD-11 reciprocal adjacency，并说明数据模型中的实体、关系和权威记录只能作为边界证据，不能单独决定 Context；
- MOD-08 新增 MOD-11 reciprocal adjacency，并说明状态与不变量的独立变化可以验证边界，但状态机不等于 Context Map；
- MOD-09 将“交给 MOD-11”等后续文字改为可操作 MOD-11 链接，但它仍是 MOD-11 的方法输入，不新增无必要的 adjacency；
- MOD-10 将“交给 MOD-11”等后续文字改为可操作 MOD-11 链接，但 actor 或 work object 不直接映射 Context；
- MOD-12 只作为下一步聚合边界方向以普通文字出现，在其发布前不建立可操作文章链接。

不使用 `data/topic-relations.json` override 修补关系。依赖关系说明输入顺序，adjacency 只保留需要双向导航的直接模型邻接，两者不得为追求链接数量而混用。

## 9. 来源治理

本批次引用四个来源，其中新增三个来源身份并复用一个既有身份；检索日期统一为 2026-08-05：

1. `https://martinfowler.com/bliki/BoundedContext.html` — Martin Fowler 对 Bounded Context、语言/模型边界和 Context Map 关系的概览；`independent-blog / primary`，其中 primary 只表示它是本文的定义性主要证据，不把独立文章变成 DDD 官方规范；MOD-11 唯一 `manifest_primary: true`；未发现开放内容许可，按 `all-rights-reserved`、`facts-summary` 治理。
2. `https://github.com/ddd-crew/context-mapping/tree/970c1ff3a61f7aa8b61b789b697c05bc585f614d` — DDD Crew Context Mapping 仓库在固定提交 `970c1ff3a61f7aa8b61b789b697c05bc585f614d` 的 README 事实；支持小型、问题驱动的 map、U/D 与关系模式语境；`community / secondary`；仓库 LICENSE 按 `CC-BY-SA-4.0` 治理，实际只使用 `facts-summary`。
3. `https://contextmapper.org/docs/anticorruption-layer/` — Context Mapper ACL 文档；支持 ACL 位于 downstream 并承担翻译/隔离角色；`official / primary`；未发现适用于页面内容的开放许可，保守按 `all-rights-reserved`、`facts-summary` 治理。
4. `https://www.avanscoperta.it/en/context-mapping/` — 复用既有 `src-docs-fc6e554f1153`；支持边界指标不是可靠证明、Bounded Context 不等于业务关注点以及边界仍需架构判断；不创建重复来源身份，继续按既有 `facts-summary` 和保守权利记录治理。

DDD Crew 的许可证据固定到 `https://github.com/ddd-crew/context-mapping/blob/970c1ff3a61f7aa8b61b789b697c05bc585f614d/LICENSE`。仓库页面简述可能使用“CC BY”措辞，但许可证文件为 CC BY-SA 4.0，账本必须采用更具体、更保守的 `CC-BY-SA-4.0`，不得降级为 CC BY。本文不复制或改编 cheat sheet、Miro board、示例图、模板、文字或布局，因此不触发衍生内容发布；所有图、表、费用场景判断和中文表述均为本站原创教学内容。

Fowler 与 Context Mapper 页面使用 living/unversioned 版本说明，`source_version` 记录“retrieved 2026-08-05”，不得把站点页脚年份或软件版本冒充页面版本。只有 Fowler 作为 manifest primary；DDD Crew、Context Mapper 和复用的 Avanscoperta 都提供补充事实或边界校验。

Stage A 新增一篇内容文档和三个来源身份，预期投影为 `49 / 92 / 488`；Stage B 只关闭 MOD-11，来源和文档数保持不变，预期投影为 `50 / 92 / 488`。持久故事保持 `7 / 20`，G008 保持 current，MOD-12 为 next。

## 10. 测试与发布门槛

### 10.1 Mutation-sensitive 内容合同

新增 Batch 9 内容测试，至少锁定：

- MOD-11 metadata、九个 H2 及精确顺序；
- 一张且仅一张 Mermaid、两张且仅两张 Markdown 表；
- MOD-02 系统 subgraph、三个候选 Context、外部银行节点与四条精确关系；
- 每条边的 U/D、交换事实、方向以及唯一银行侧 ACL；
- 候选边界证据表的七列、三行及其与 Mermaid 节点的一致性；
- 关系责任表的七列、四行及其与 Mermaid 边的一致性；
- 八项非证明规则、七步演练、完成条件、责任类型和候选反证；
- MOD-05、MOD-08 reciprocal adjacency，MOD-09、MOD-10 的可操作后续链接，以及 MOD-12 零操作链接；
- 三个新来源身份、一个复用来源、唯一 manifest primary、固定 DDD Crew commit、CC BY-SA 4.0 许可证据和全部 `facts-summary` 边界；
- Stage A `49 / 92 / 488`、MOD-11 published/pending、G008 current、durable `7 / 20` 和 next MOD-11。

Mutation 测试必须分别删除、交换或替换 H2、Context、系统归属、边方向、U/D、交换事实、ACL、表字段、表行、反证、责任类型、非证明规则、来源和关系，证明合同拒绝结构或语义漂移，而不是只检查关键词存在。

### 10.2 Stage A

Stage A 发布正文、三个新来源、一个复用引用、双向关系、内容测试和审查记录，但保持 MOD-11 backlog checkbox 未完成。每个 Node/npm 命令固定使用 `PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH`。提交前运行 targeted tests、`npm run verify`、`git diff --check`，并完成独立内容、事实、版权、可访问性和测试审查。

Stage A 推送后，等待 exact-head GitHub Pages run `completed/success`，再执行生产 QA。生产 QA 使用 desktop `1440×1000` 与 mobile `390×844`，覆盖以下十条 canonical routes：

1. `/`
2. `/modeling`
3. `/modeling/mod-01`
4. `/modeling/mod-02`
5. `/modeling/mod-05`
6. `/modeling/mod-08`
7. `/modeling/mod-09`
8. `/modeling/mod-10`
9. `/modeling/mod-11`
10. `/references`

QA 必须验证：

- Mermaid `1/1`，系统边界、三个候选、外部银行和四条关系标签可见；
- 表格 `2/2`，数据行分别为 `3 + 4`；
- diagram 和 table wrapper 可聚焦且是实际 overflow owner，ArrowLeft/ArrowRight 由聚焦容器驱动；
- desktop 与 mobile 的 document overflow 均为零；
- 来源激活 `8/8`：四个可见来源乘两个视口；
- 关系激活 `24/24`：MOD-11 的八个可见站内关系乘两个视口，加 MOD-05/MOD-08 reciprocal backlink 与 MOD-09/MOD-10 后续链接各乘两个视口；
- closed-world MOD-12 operator target 为零；
- console warnings、console errors、page errors 均为零。

保存原始 JSON artifact 和 SHA-256；截图只作辅助，不代替结构化交互证据。若本地 Node/Docusaurus 仍出现既有 `localStorage` ExperimentalWarning，必须单独记录为环境噪声，并以生产浏览器 `0/0/0` 为运行时门槛，不得删除或掩盖警告。

### 10.3 Stage B

只有 Stage A exact-head 部署和全部生产 QA 通过后才关闭 MOD-11。Stage B 必须：

- 创建 `docs/reviews/g008-batch9.md`，固定 Stage A SHA、Pages run、测试总数、十条路由、双视口、视觉、交互、来源、关系、MOD-12 零操作和诊断证据；
- 固定 QA artifact 路径与 SHA-256；
- 将 MOD-11 backlog checkbox 改为完成，保留 Batch 8 及更早的 SHA、run、计数、观察和历史段落；
- 将状态投影更新为 `50 / 92 / 488`、持久故事 `7 / 20`、current G008、next MOD-12；
- 再次运行 targeted tests、`npm run verify` 和独立终审；
- 快进本地 main，推送 origin/main，并验证 final SHA 的 exact-head Pages run 与 canonical production smoke；
- 使功能分支、origin feature、本地 main 和 origin/main 最终解析到同一 SHA。

## 11. 工作区、错误处理与停止条件

- 所有设计与实现只在 `/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch9` 的 `codex/g008-modeling-batch9` 分支进行。
- 主工作区原有未跟踪 `.codex/config.toml` 必须保持未修改、未暂存、未提交。
- 不新增 npm 依赖、图片文件、第三方图标或关系 override。
- 网络、来源许可、构建、测试、部署或 QA 失败必须保留原始证据并修复，不得通过删减断言、跳过检查或伪造完成记录绕过。
- Stage A 生产 QA 未全部通过时不得关闭 MOD-11；Stage B final exact-head 部署与 smoke 未通过时不得宣布 Batch 9 完成。
