# G008 Batch 6：MOD-08 状态机建模设计

日期：2026-08-02  
状态：已批准  
目标分支：`codex/g008-modeling-batch6`

## 1. 目标与范围

本批次只发布并关闭 `MOD-08 P1｜状态机建模`。文章以一个原创的“长时转账与对账”教学场景说明终态、超时、取消、补偿和人工终态，承接 MOD-07 的选图边界，但不把教学状态机描述成现有生产系统、Temporal 默认实现或 UML 标准示例。

本批次不发布 MOD-09..13，不改变 G008 的进行中状态，不扩展到 EventStorming、Domain Storytelling、Context Map 或通用图审阅清单。Stage A 发布 MOD-08 但保持 pending；Stage B 只将 MOD-08 改为 complete，下一项为 MOD-09。

## 2. 已选方案与备选方案

### 已选：业务意图与执行/恢复两个协调状态机

文章分别建模：

1. **业务意图状态机**：回答转账请求在业务上被接受、拒绝、结算、取消、补偿或人工决议后处于什么状态。
2. **执行/恢复状态机**：回答某次外部执行正在尝试、等待回执、结果未知、对账、补偿或升级人工时如何推进。

两张图通过稳定 `transfer_id`、`operation_id`、外部 `effect_ref`、证据截止时间和决议记录关联，不共享一组含糊的“成功/失败”枚举。该拆分使“请求取消”与“已经取消”、“调用超时”与“业务失败”、“补偿已请求”与“补偿完成”保持可检验的区别。

### 未选：单一完整状态机

优点是入口简单，缺点是业务结论、执行尝试和恢复机制被压进同一图，容易产生状态笛卡尔积，并让一次 attempt timeout 错误地改写业务事实。

### 未选：分层状态机或工具特定 statechart

分层状态可以减少重复边，但会提高入门成本，并容易把某个库的并行区、历史状态或事件语义误当作本文的通用契约。本页只使用 UML 可表达的基础状态与转换，工具特定实现留给后续实现文档。

## 3. 教学场景与权威边界

场景是一笔跨边界长时转账：系统接受转账意图，调用外部扣款与入账能力，可能在取得业务结果前超时，随后通过只读查询、重试、补偿或人工决议收束。

教学假设包括参与者、状态名、操作 ID 编码、时间预算、补偿条件和人工决议字段。它们是本站原创，不来自 Temporal 生产部署或真实事故。

权威边界如下：

- UML 2.5.1 只支持状态机、状态、事件、守卫、转换和终态的标准语义范围。
- Temporal 官方资料只支持 Workflow、Activity、Event History、retry/timeout 等运行机制的说明，不定义本文的业务状态或补偿政策。
- Saga 论文只支持长事务由一组子事务及其补偿收束的历史与方法背景，不证明补偿等于回滚，也不证明补偿必然成功。
- 外部业务系统和对账记录才裁定扣款或入账是否发生；图、Workflow history、客户端 timeout 和本地日志都不能单独代替该事实。

## 4. 状态机设计

### 4.1 业务意图状态机

业务状态使用过去分词或稳定事实命名，避免使用动作名。最小状态集合为：

- `requested`：已登记请求，尚未完成接受检查。
- `accepted`：业务前置条件已通过，可以启动外部执行。
- `settlement_pending`：至少一个外部效果可能在途或待确认。
- `settled`：权威证据确认目标业务结果完成，终态。
- `rejected`：执行前被业务规则拒绝，终态。
- `cancelled_before_effect`：权威证据确认外部效果尚未发生且流程已停止，终态。
- `compensated`：已确认的正向效果由已确认补偿收束，终态；不宣称历史从未发生。
- `manually_resolved`：人工根据证据作出耐久决议的终态，必须携带 `disposition`、`decision_ref`、决策人、时间和残余风险。`disposition` 至少区分 confirmed-settled、confirmed-compensated 与 accepted-residual-risk，不能只写“人工关闭”。

`settlement_pending` 不能因为一次 timeout 直接进入 rejected 或 cancelled。只有业务权威证据或有权限的人工决议可以形成业务终态。

### 4.2 执行/恢复状态机

执行状态只描述控制过程，不冒充业务结果：

- `ready` → `attempting`：开始一次有稳定 operation ID 的执行。
- `attempting` → `awaiting_receipt`：外部请求已提交，等待权威结果。
- `awaiting_receipt` → `confirmed_success`：取得可核对 effect ref，控制终态。
- `awaiting_receipt` → `unknown`：调用 timeout、连接中断或回执缺失；这不是业务失败。
- `unknown` → `reconciling`：只读查询或对账。
- `reconciling` → `confirmed_success`：确认原效果已发生。
- `reconciling` → `ready`：权威确认未发生且同一 operation ID 仍可安全重试。
- `reconciling` → `compensation_pending`：确认部分效果已发生且政策要求补偿。
- `compensation_pending` → `compensated`：补偿效果有权威确认，控制终态。
- `reconciling` 或 `compensation_pending` → `manual_review`：证据冲突、预算耗尽、补偿失败或不可逆动作需要人工处理。
- `manual_review` → `manual_closed`：记录耐久人工决议，控制终态；它只有与业务机的 `manually_resolved` 决议记录配对后才构成业务收束。
- `ready` → `stopped_before_effect`：取消发生在任何外部效果前且“未发生”得到权威确认，控制终态。

取消是事件和意图，不是天然终态。执行已提交或结果未知时，取消只能阻止后续动作并触发对账；已确认效果存在时，取消转为补偿判断。

## 5. 可视化与内容结构

MOD-08 使用仓库现有的 Mermaid 与 Markdown 可访问包装，不创建 Draw.io、SVG 或 raster 资产：

1. 一张 Mermaid `stateDiagram-v2` 表示业务意图状态机。
2. 一张 Mermaid `stateDiagram-v2` 表示执行/恢复状态机。
3. 一张七行 Markdown 映射表，把关键触发、两台状态机的变化、所需证据和禁止推断绑定在一起。

映射表七行固定覆盖：接受请求、提交外部效果、执行超时、效果前取消、未知结果后取消、确认部分效果后补偿、证据无法收敛后人工决议。

每张图前写明观察对象和截止时间，图后写明它不能证明什么。两张图都必须处于 `diagram-wrapper`，表格处于可聚焦的 mapping wrapper；键盘 ArrowLeft/ArrowRight 行为沿用现有 overflow contract。

文章采用以下 H2 顺序：

1. 学习问题
2. 建模目标与输入
3. 两类状态与权威记录
4. 模型产物
5. 转换合同
6. 超时、取消与补偿
7. 完成判断
8. 常见失败
9. 与其他模型的衔接
10. 完整演练
11. 来源

完整演练必须逐步经过 `accepted → settlement_pending`，制造一次外部调用 timeout，进入 unknown/reconciling，确认部分效果后发起补偿，并分别说明自动补偿成功与转人工决议两种收束。它不使用虚构的生产时延、金额、容量或成功率。

## 6. 转换合同与不变量

每条转换至少记录：当前状态、事件、守卫、动作、下一状态、权威证据、幂等身份、截止时间和 owner。

必须锁定以下不变量：

- timeout 只改变观察/控制状态，不能单独宣告业务失败。
- cancellation request 不能单独产生 cancelled 终态。
- 只有权威 not-found 且稳定 operation ID 仍有效时才允许重试外部写入。
- 已确认正向效果才进入补偿判断；补偿是新业务动作，不是历史回滚。
- 补偿也可能 timeout、重复或失败，必须拥有自己的 operation ID、预算和对账路径。
- 人工终态必须保存可审计 disposition 与 decision ref，不能用 generic closed 隐藏未知结果。
- 业务机与执行机通过记录关联，但任何一台机都不能从另一台机的内存状态推导外部事实。

## 7. 来源治理

优先复用已治理来源，不新增来源身份：

- `src-omg-uml-2-5-1-2017` — OMG UML 2.5.1；`standard / primary`；作为 MOD-08 唯一 `manifest_primary: true` 引用。
- `src-docs-abd3e18c34a9` — Temporal Workflow；支持 durable Workflow 控制语义。
- `src-docs-1743ee34e211` — Temporal Activity；支持 Activity 与外部 I/O/取消边界。
- `src-docs-9950c767c50f` — Temporal Retry Policies；支持 retry policy 机制边界。
- `src-doi-c4c907db05fa` — Garcia-Molina 与 Salem 的《Sagas》；支持补偿方法的历史背景。

所有引用均使用 facts-summary，不复制来源图表、状态图、示例流程或大段措辞。文章的两张状态图、映射表、状态名和转账演练均为原创教学内容。

来源数保持 476。新增 MOD-08 文档和文档审查记录后，Stage A 预期投影为 `46 / 89 / 476`；Stage B 关闭 MOD-08 后为 `47 / 89 / 476`。

## 8. 关系设计

MOD-08 metadata：

- `depends_on: [MOD-07]`
- `adjacent_topics: [MOD-07, PR-10, QA-02]`
- `related_cases: [/cases/temporal-saga-durable-execution]`
- `related_questions: []`

发布时必须添加并测试互惠链接：

- MOD-07 移除“MOD-08 未发布”措辞，新增 MOD-08 可见链接和 reciprocal adjacency。
- PR-10 与 QA-02 新增 MOD-08 reciprocal adjacency 和一条最小相关链接。
- MOD-08 可见链接到 `/modeling`、MOD-07、PR-10、QA-02 和 Temporal Saga 案例。
- 不建立 MOD-09 链接，正文明确 MOD-09 尚未发布。

不使用 `data/topic-relations.json` override 修补已发布关系。

## 9. 测试与发布门槛

内容合约必须以 mutation-sensitive 方式锁定：

- metadata、11 个 H2、两张且仅两张 Mermaid state diagram、一张且仅一张七行映射表。
- 两台状态机的完整状态集合与有向转换集合，不依赖 Mermaid 行顺序。
- 七个映射记录的完整字段和非证明边界。
- timeout、cancel、retry、compensation 与 manual disposition 七项不变量。
- 三个 reciprocal adjacent topic、Temporal 案例和无 MOD-09 链接。
- 五个精确来源身份、唯一 manifest primary 和健康缓存兼容性。
- Stage A `46 / 89 / 476` 与 MOD-08 published/pending。

Stage A 在完整 verify、独立内容/版权/测试审查后发布。生产 QA 使用 desktop `1440×1000` 与 mobile `390×844`，检查两张 Mermaid、一张七行表、wrapper focus/overflow/ArrowRight、来源和关系真实点击、MOD-09 无链接、console warnings/errors/page errors 为零，并保存带 SHA-256 的原始 artifact。

Stage B 发布审查固定 exact Stage A SHA、Pages run、仓库测试总数和 QA artifact hash，只关闭 MOD-08；最终投影必须为 `47 / 89 / 476`，G008 保持 current，MOD-09 为 next。

## 10. 错误处理与停止条件

- 来源刷新出现外部网络失败时保留真实失败历史，使用现有 checker 的正式注入/批次机制重试，不手写健康成功记录。
- 关系校验失败时修正 metadata 或 reciprocal content，不增加 override。
- Mermaid、表格或生产交互不满足可访问性门槛时返回内容任务修复并重新部署 Stage A。
- 任何 Important 或 Critical 独立审查发现必须修复并重新验证。
- 当 final SHA 的完整 verify、Pages exact-head success、以下 8 个 canonical routes 全部 HTTP 200、双视口 QA、Stage B closure 和四个 Git 引用同步全部成立时，本批次完成；不清理 worktree 或分支：`/`、`/modeling`、`/modeling/mod-07`、`/modeling/mod-08`、`/principles/pr-10`、`/quality-attributes/qa-02`、`/cases/temporal-saga-durable-execution`、`/references`。
