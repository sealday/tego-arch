# G008 Batch 7：MOD-09 EventStorming 设计

日期：2026-08-03

状态：已批准

目标分支：`codex/g008-modeling-batch7`

## 1. 目标与范围

本批次只发布并关闭 `MOD-09 P1｜EventStorming`。文章沿用费用申报系统教学场景，先用 Big Picture 建立从费用提交到支付确认或人工处理的事件证据链，再对“审批通过到支付结果确认”做一次窄范围 Process Modelling，最后把观察到的信号记录为候选边界假设。

本批次不发布 `MOD-10..13`，不把 EventStorming 写成确定性的系统分解方法，也不改变 `MOD-02` 已确立的系统边界、组件关系和外部“银行支付服务”名称。Software Design 只作为后续工作坊的交接方向，不在本文展开。Stage A 发布 MOD-09 但保持 pending；Stage B 只将 MOD-09 改为 complete，G008 保持 current，下一项为 MOD-10。

## 2. 已选方案与备选方案

### 已选：两阶段证据链

文章使用一条可追踪的教学链：

1. **Big Picture**：用过去时领域事件建立时间线，标出参与者、外部系统、关键转折候选、热点和未知项。
2. **Process Modelling**：从大图中选择“审批通过到支付结果确认”的高风险片段，用 Person、Read Model、Command、System、Policy 和 Event 描述协作过程。
3. **候选边界台账**：把重复语言、政策变化、不同节奏、所有权争议和外部依赖等观察信号记录为假设，同时保留替代解释和待补证据。

该方案既给出完整工作坊路径，又避免把一次大图讨论直接等同于 Bounded Context、团队或服务设计。

### 未选：只做 Big Picture

该方案易于入门，也适合发现共同语言和热点，但不能充分展示如何把大图中的高风险片段转成可验证的流程模型，更容易让读者在得到一墙事件后不知道下一步做什么。

### 未选：完整覆盖三个官方格式

同时展开 Big Picture、Process Modelling 和 Software Design 会增加文章跨度，并让边界假设、聚合设计和实现决策过早混合。本文只说明 Software Design 的交接条件，具体边界确认由后续 Context Map 等模型承担。

## 3. 教学场景与权威边界

### 3.1 场景连续性

教学场景沿用 MOD-05 的费用申报过程，并以 MOD-02 的系统图为权威：员工提交费用、经理审批、财务复核、系统请求外部“银行支付服务”执行支付，随后确认支付、发现未知结果或转人工处理。

工作坊中的事件顺序、角色安排、热点、关键转折、命令、政策和候选边界均为本站原创教学假设，不是既有生产事实。文章不得新增或改名 MOD-02 的系统边界，也不得把“银行支付服务”缩写为支付模块、支付域或内部服务。

### 3.2 方法边界

- EventStorming 是协作式探索和建模活动，产出的是共享证据、问题与假设，不是形式证明。
- 官方材料区分 Big Picture、Process Modelling 和 Software Design 三种工作坊格式；本文不把它们命名为形式化“层级”。
- Big Picture 的事件、时间线、关键转折候选、泳道和热点帮助组织讨论，但不能自动推导 Bounded Context、团队或服务。
- Process Modelling 的 Person、Read Model、Command、System、Policy 和 Event 描述协作链，不能冒充运行时调用顺序、消息协议或一致性保证。
- Software Design 可继续移动边界、聚合、Read Model 与热点，但其结果仍需架构判断和后续证据确认。
- MOD-11 Context Map 才负责显式记录上下文及其关系；即使到该阶段，边界仍须由架构决策确认，而不是由便签位置自动生成。

## 4. 内容合同

MOD-09 使用以下九个且仅以下九个 H2，顺序固定：

1. 学习问题
2. 建模目标与输入
3. 参与者与步骤
4. 模型产物
5. 完成判断
6. 常见失败
7. 与其他模型的衔接
8. 完整演练
9. 来源

“学习问题”提出三至五个可回答问题，至少覆盖工作坊输入、参与者、产物、热点处理和边界推导限制。“完整演练”必须连贯执行 Big Picture、窄范围 Process Modelling 和候选边界台账，不把三部分写成互不相关的清单。

### 4.1 建模目标与输入

工作坊在开始前记录：

- 要探索的业务问题与时间范围；
- 已知参与者、外部系统和权威记录；
- MOD-02 权威边界和“银行支付服务”名称；
- 可用的访谈、流程、事故、政策和术语证据；
- 明确未知项、争议项和不能在本次工作坊决定的事项；
- 本轮结束时要获得的模型、热点清单和下一步验证责任。

输入不要求先有完整需求或既定服务划分。已有组织图、系统图和流程只能作为讨论证据，不能预先决定泳道或候选边界。

### 4.2 参与者与步骤

参与者至少包括熟悉业务日常的领域人员、能追问规则与异常的软件人员，以及一位维持节奏和记录争议的主持人。Process Modelling 中使用官方语法的 `Person`，不以泛化 `Actor` 取代来源术语，也不因某人贴出命令就把该人认定为长期 owner。

工作坊步骤固定为：

1. 说明问题、时间范围、权威边界和非目标。
2. 独立写出过去时领域事件，再按业务时间线排列。
3. 补充事件来源、参与者、外部系统、关键转折候选、热点和未知项。
4. 共同 walkthrough，合并同义词但保留真实分歧。
5. 选择“费用已批准到支付结果已确认”的高风险片段。
6. 用 Person、Read Model、Command、System、Policy 和 Event 建立 Process Model。
7. 回到热点，记录已回答、待验证和超出本轮范围的事项。
8. 把边界信号写入候选台账，给出替代解释、所需证据和处置。

## 5. 模型产物与视觉设计

本文只使用仓库现有 Mermaid 和 Markdown 可访问包装，不创建 Draw.io、SVG 或 raster 资产。固定产物为一张 Mermaid 和两张横向可滚动 Markdown 表格。

### 5.1 Big Picture 时间线表

第一张表包含 7–9 个过去时领域事件，覆盖从费用提交到支付确认或人工处理的主线。每行必须包含：

- 过去时领域事件；
- 事件来源或权威记录；
- 关键转折候选；
- 热点；
- 未知项。

建议事件集合围绕“费用已提交、费用已审批、财务复核已完成、支付已请求、支付结果已确认、支付结果仍未知、人工处理已登记”组织；最终正文可以加入一至两个必要事件，但不得超过九行，也不得把命令或待办写成领域事件。

表中“关键转折候选”只表示叙事或规则可能发生显著变化的位置；“热点”表示值得继续讨论的冲突、风险或缺口；“未知项”必须保留可追踪问题，不能为了让模型看起来完整而虚构答案。

### 5.2 Process Model Mermaid

Mermaid 聚焦“费用已审批到支付结果已确认”，至少展示以下闭环：

```text
Person → Read Model → Command → System → Event
                          ↑          |
                          └─ Policy ─┘
```

具体教学语义为：财务人员读取待支付费用，发出“请求支付”命令；费用申报系统调用权威命名的“银行支付服务”；“支付已请求”或可核验的支付结果事件触发政策；政策决定查询结果、确认支付或转人工处理。图必须区分人的观察、命令意图、系统参与、已发生事件和政策反应，不能把 Policy 画成拥有业务事实的服务。

图位于 `diagram-wrapper`。图前写明观察范围和截止点，图后写明它不能证明实际运行时顺序、同步/异步协议、事务边界、服务边界或组织 owner。

### 5.3 候选边界台账

第二张表约五行，每行固定包含：

- 观察到的信号；
- 候选边界假设；
- 替代解释；
- 仍需的证据；
- 当前处置。

信号应覆盖语言差异、规则或节奏变化、外部依赖、权威数据归属和所有权争议。处置枚举至少区分“保留假设”“下一轮验证”“交给 MOD-11”“不作为边界证据”。不得将表中候选直接写成最终 Bounded Context、服务或团队。

两张表均使用现有可聚焦 mapping wrapper，支持横向 overflow 和键盘 ArrowLeft/ArrowRight。表头、行标签和上下文说明必须在桌面与移动端保持可读。

## 6. 完成判断与非证明规则

一次教学工作坊只有在以下条件全部满足时才可结束：

- 时间范围、参与者和权威记录可见；
- Big Picture 事件以过去时表达，并能完成一次端到端 walkthrough；
- 每个关键转折候选、热点和未知项都有记录，不强行消除分歧；
- 选中的高风险片段已建立可解释的 Process Model；
- 候选边界台账包含替代解释、待补证据和责任明确的下一步；
- 与 MOD-02、MOD-05、MOD-08 和后续 MOD-11 的交接边界写清；
- 所有参与者理解模型是当前证据的共同视图，而不是生产事实或架构批准。

文章必须逐项锁定以下非证明规则：

- pivotal event 不等于 Bounded Context；
- swimlane 不等于团队、系统或服务；
- hotspot 不等于 backlog item、服务或已批准决策；
- Person 不等于长期 owner；
- 工作坊排列顺序不等于运行时调用顺序；
- 一次 EventStorming 工作坊不能单独确认正式边界，候选关系仍须在 MOD-11 或等价架构活动中验证。

## 7. 常见失败与恢复方式

- **先画系统再找事件**：回到业务时间线，隐藏既有服务名，只保留 MOD-02 必须尊重的权威边界。
- **把命令写成过去时事实**：区分“请求支付”和“支付已请求/支付已确认”。
- **只有软件人员参加**：补充真正掌握日常规则与例外的领域人员，不用代码或数据库反推全部业务语义。
- **主持人过早合并分歧**：保留热点和未知项，让替代术语并列到 walkthrough 后再处理。
- **把便签聚类命名为 Context**：移入候选边界台账，补充替代解释和验证证据。
- **追求一张完整大图**：缩窄到高风险片段做 Process Modelling，并把其余问题排入后续验证。
- **从工作坊直接创建服务 backlog**：先交给 MOD-11 或架构决策过程确认边界和关系。

## 8. 与其他模型的关系

MOD-09 metadata 固定为：

- `depends_on: [MOD-01, MOD-02]`
- `adjacent_topics: [MOD-05, MOD-08]`
- `related_cases: [/cases/temporal-saga-durable-execution]`
- `related_questions: []`

发布时必须添加并测试互惠关系：

- MOD-05 新增 MOD-09 reciprocal adjacency，并说明数据模型可以提供事件来源和权威记录，但不能代替协作探索。
- MOD-08 移除“MOD-09 尚未发布”措辞，新增 MOD-09 reciprocal adjacency，并说明状态机可以细化被选流程片段的状态与转换。
- MOD-09 可见链接到 `/modeling`、MOD-01、MOD-02、MOD-05、MOD-08 和 Temporal Saga 案例。
- MOD-10 保持 pending 且不建立可操作链接。
- 正文可以说明 MOD-11 是候选边界的后续验证方向，但在 MOD-11 未发布前不建立可操作链接。

不使用 `data/topic-relations.json` override 修补已发布关系。

## 9. 来源治理

本批次新增五个来源身份，检索日期统一为 2026-08-03：

1. `https://www.avanscoperta.it/en/eventstorming/` — Avanscoperta 官方 EventStorming overview；支持三种工作坊格式、协作目的和核心产物；`official / primary`；MOD-09 唯一 `manifest_primary: true`。
2. `https://medium.com/@ziobrando/collaborative-process-modelling-with-eventstorming-17ed363650c0` — Alberto Brandolini 的 Process Modelling 说明；支持 Person、System、Command、Policy、Read Model 与 Event 的语法；`author / primary`；不作为 manifest primary。
3. `https://www.avanscoperta.it/en/eventstorming/pivotal-events/` — Avanscoperta Pivotal Events；支持关键转折候选、时间线和泳道的讨论范围；`official / primary`；不作为 manifest primary。
4. `https://www.avanscoperta.it/en/context-mapping/` — Avanscoperta Context Mapping；支持边界指标并非可靠证明、Bounded Context 不等于业务关注点以及边界需要架构判断的限制；`official / primary`；不作为 manifest primary。
5. `https://www.eventstorming.com/patterns/chaotic-exploration/` — EventStorming Patterns 的 Chaotic Exploration；支持独立探索与共同整理的工作坊步骤；`official / primary`；不作为 manifest primary。

实现时由现有来源账本规则分配稳定 source ID，并在内容合同中锁定最终 ID 与 locator。五个页面均按 living/unversioned 页面治理，`source_version` 明确记录“retrieved 2026-08-03”，不得虚构发行版本。

版权边界为保守 `copyright-reserved`：只使用 facts-summary，不复制或改编来源文字、图、模板、便签布局、示例或大段措辞。本文的一张 Mermaid、两张表、费用演练、事件集合、热点和边界假设均为本站原创。未选择书籍样章作为事实来源，因为样章版权受限且内容未完成。

Stage A 新增一篇内容文档和五个治理来源，预期投影为 `47 / 90 / 481`；Stage B 只关闭 MOD-09，来源和文档数保持不变，预期投影为 `48 / 90 / 481`。持久故事保持 `7 / 20`，G008 保持 current，MOD-10 为 next。

## 10. 测试与发布门槛

### 10.1 Mutation-sensitive 内容合同

新增 Batch 7 内容测试，至少锁定：

- MOD-09 metadata、九个 H2 及其精确顺序；
- 一张且仅一张 Mermaid、两张且仅两张 Markdown 表；
- Big Picture 表的 7–9 个过去时事件和五个精确字段；
- Mermaid 中 Person、Read Model、Command、System、Policy、Event 的完整节点种类与有向关系，不依赖源码行顺序；
- 候选边界表的五个精确字段、约五条记录和处置枚举；
- 六项非证明规则与完成条件；
- MOD-05、MOD-08 的 reciprocal adjacency、Temporal Saga 案例及 MOD-10 零操作链接；
- 五个精确来源身份、唯一 manifest primary、facts-summary、版权和 living-page 版本边界；
- Stage A `47 / 90 / 481` 且 MOD-09 为 published/pending；
- 当前 G008、持久故事 `7 / 20` 和 next MOD-09 的 Stage A 状态投影。

Mutation 测试必须分别删除或交换 H2、表字段、节点类型、关系、非证明规则、来源和 reciprocal link，证明合同能拒绝缺失、重排或错误替换，而不是只检查关键词出现。

### 10.2 Stage A

Stage A 发布正文、来源治理、双向关系、内容测试和审查记录，但保持 MOD-09 backlog checkbox 未完成。提交前使用固定 Node `26.5.0` 运行 targeted tests 和 `npm run verify`，记录实际测试数，并完成独立内容、事实、版权、可访问性和测试审查。

Stage A 提交推送后，等待 exact-head GitHub Pages run `completed/success`，再执行生产 QA。生产 QA 使用 desktop `1440×1000` 与 mobile `390×844`，覆盖以下九条 canonical routes：

1. `/`
2. `/modeling`
3. `/modeling/mod-01`
4. `/modeling/mod-02`
5. `/modeling/mod-05`
6. `/modeling/mod-08`
7. `/modeling/mod-09`
8. `/cases/temporal-saga-durable-execution`
9. `/references`

QA 必须验证一张 Mermaid、两张表、表格 focus/overflow/ArrowLeft/ArrowRight、10 次来源点击、16 次关系点击、MOD-10 操作链接为零，以及 console warnings、console errors、page errors 均为零。保存原始 JSON artifact 和 SHA-256；截图只作辅助，不代替结构化交互证据。

### 10.3 Stage B

只有 Stage A exact-head 部署和全部生产 QA 通过后才关闭 MOD-09。Stage B 必须：

- 在 `docs/reviews/g008-batch7.md` 固定 Stage A SHA、Pages run、测试总数、九条路由、双视口、视觉、交互、来源、关系、MOD-10 零操作和诊断证据；
- 固定 QA artifact 路径与 SHA-256；
- 将 MOD-09 backlog checkbox 改为完成，保留历史 Stage A 证据，不覆盖早期批次记录；
- 将状态投影更新为 `48 / 90 / 481`、持久故事 `7 / 20`、current G008、next MOD-10；
- 再次运行 targeted tests 和 `npm run verify`，完成独立终审；
- 推送并验证 final SHA 的 exact-head Pages run 与 canonical production smoke；
- 使功能分支、本地 `main`、`origin/main` 和 `origin/codex/g008-modeling-batch7` 最终解析到同一 SHA。

## 11. 错误处理与停止条件

- 来源刷新失败时保留真实失败历史，使用现有 checker 的正式注入或批次机制重试，不手写健康成功记录。
- 关系校验失败时修正 metadata 或 reciprocal content，不增加 override。
- Mermaid、表格、移动布局、键盘滚动或真实点击不满足门槛时返回内容任务修复并重新部署 Stage A。
- Pages run 的 `headSha` 与目标提交不一致时不得使用该 run 作为证据。
- 任何 Important 或 Critical 独立审查发现必须修复并重新验证。
- final SHA 的完整 verify、exact-head Pages success、九条 canonical routes、双视口 QA、Stage B closure 和四个 Git 引用同步全部成立后，本批次完成。
- 完成后保留工作区 `/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch7` 和分支，不主动清理。
