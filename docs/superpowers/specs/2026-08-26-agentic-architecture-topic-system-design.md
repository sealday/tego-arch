# Agentic Architecture 专题体系设计

- **状态：** Approved design
- **主题：** Agent Harness、Agent Loop、Agentic RAG 及相关架构概念、模式与案例
- **范围：** 6 篇概念、8 篇模式、3 篇案例，以及学习路径、索引、分组和双向导航
- **发布方式：** 单一原子批次，全部通过后合并 `main` 并发布
- **隔离分支：** `codex/agentic-architecture-topic-system`
- **来源截点：** 2026-08-26

## 1. 背景与目标

仓库已经有 `/paths/agentic-architecture` 学习路径，以及 OpenAI Agents SDK、LangGraph Supervisor、Google ADK + A2A、AWS CLI Agent Orchestrator、Microsoft Multi-Agent Reference Architecture、Kong AI Gateway 等具体案例，但还缺少一组可独立引用的基础概念和标准模式文章。现有内容能够展示具体实现，尚不能稳定回答以下问题：

1. Model、Augmented LLM、Workflow 与 Agent 的系统边界是什么；
2. Agent Harness 和 Agent Loop 分别拥有何种责任，二者如何组合；
3. Agentic RAG 为什么可以视为 Agent Loop 在证据充分性条件下的具象；
4. Context、Memory、State、Checkpoint、Tool、Sandbox、Permission、Trace、Evaluation 与 Guardrail 如何分工；
5. Router、Planner–Executor、Evaluator–Optimizer、Supervisor、Handoff、Agents-as-Tools、Orchestrator–Workers、Fan-out/Fan-in 与 Durable Agent 等模式如何选择；
6. 这些模式进入生产后如何停止、恢复、审批、评测并约束副作用。

本专题建立一套从系统边界、单 Agent 基础、控制模式、能力扩展到生产验证的完整知识体系。读者完成专题后，应能识别控制权、状态权、工具副作用、证据充分性、终止条件和恢复责任，并能判断何时使用确定性 Workflow、何时引入 Agent Loop、何时才需要多 Agent 或持久执行。

## 2. 非目标

本轮不建设 Agent 框架、RAG 服务、代码执行沙箱、评测平台或多 Agent Demo，不做厂商产品排行、模型排行榜、性能基准或成本计算器，也不承诺某种模式适用于所有组织。

文章不把 Prompt 技巧包装成架构模式，不把消息互发等同于多 Agent 协作正确性，不把检索到内容等同于证据充分，不把协议互操作等同于权限、可靠性或治理完成，不把演示结果外推为生产事实。

## 3. 已批准的组织原则

专题采用三种视角组合，而不是三选一：

1. **渐进自治阶梯是目录与学习主线。** 内容从确定性系统逐步走向带循环、工具、副作用、多 Agent 和持久执行的自治系统；
2. **六个架构平面是每篇文章的共同分析框架。** 每个概念和模式都说明交互、控制、知识与上下文、状态与记忆、动作与工具、治理与评测的责任归属；
3. **三个生产案例是验证面。** 案例不再创建另一套分类，而是检验概念和模式在研究、编码与事故响应约束下是否成立。

已有厂商或开源项目案例继续作为具体实现证据，与新专题双向链接，不重复改写成通用概念文章。

## 4. 统一参考架构

专题共用一张总参考架构，其核心关系固定如下：

```text
User / Event
    ↓
Policy & Routing ── Budget & Termination ── Human Approval
    ↓
Agent Harness
    └── Agent Loop: Plan → Act → Observe → Evaluate → Terminate
            ├── Knowledge / Retrieval
            ├── Tools / Sandbox
            └── Human / Other Agents

Cross-cutting foundation:
State ── Memory ── Checkpoint ── Trace / Evaluation / Guardrail
```

参考架构保留四个判断：

- **Harness 包住并约束 Loop。** Harness 提供运行时、上下文装配、工具协议、权限、沙箱、预算、恢复和评测钩子；Loop 决定一次任务如何计划、行动、观察、评估和停止；
- **Agentic RAG 是 Loop 的一种具象。** Loop 围绕“证据是否充分”决定检索、阅读、反思、改写查询、再次检索、回答或拒答；它不是与 Harness、Loop 并列的底层构件；
- **状态底座贯穿控制面和执行面。** 任务事实、跨轮偏好、恢复检查点和可观测记录必须分开建模；
- **治理不只在入口。** 权限、副作用、预算、人工审批、质量评测与停止自动化的条件必须覆盖完整执行链。

## 5. 内容清单与信息架构

### 5.1 概念层：6 篇

仓库要求 `topic_id` 全局唯一，因此概念使用 `AGT-C` 编号并发布在 `/concepts`：

| Topic ID | 文件 | 路由 | 核心问题 |
| --- | --- | --- | --- |
| AGT-C-01 | `content/concepts/agt-c-01-agent-system-boundary.mdx` | `/concepts/agt-c-01` | Model、Augmented LLM、Workflow 与 Agent 如何划界 |
| AGT-C-02 | `content/concepts/agt-c-02-agent-harness.mdx` | `/concepts/agt-c-02` | Harness 拥有哪些运行与治理责任 |
| AGT-C-03 | `content/concepts/agt-c-03-agent-loop.mdx` | `/concepts/agt-c-03` | Loop 如何推进、评估并终止任务 |
| AGT-C-04 | `content/concepts/agt-c-04-context-memory-state-checkpoint.mdx` | `/concepts/agt-c-04` | 四类信息的生命周期与权威性如何区分 |
| AGT-C-05 | `content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx` | `/concepts/agt-c-05` | Agent 如何安全地产生外部效果 |
| AGT-C-06 | `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx` | `/concepts/agt-c-06` | 记录、判断质量与执行约束如何分工 |

### 5.2 模式层：8 篇

模式文章使用独立的 `AGT-P` 编号并发布在 `/patterns`：

| Topic ID | 文件 | 路由 | 核心问题 |
| --- | --- | --- | --- |
| AGT-P-01 | `content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx` | `/patterns/agt-p-01` | 如何选择确定性 Workflow 或自主 Agent |
| AGT-P-02 | `content/patterns/agt-p-02-agentic-rag.mdx` | `/patterns/agt-p-02` | 如何围绕证据充分性组织检索循环 |
| AGT-P-03 | `content/patterns/agt-p-03-planner-executor.mdx` | `/patterns/agt-p-03` | 何时分离规划权与执行权 |
| AGT-P-04 | `content/patterns/agt-p-04-evaluator-optimizer.mdx` | `/patterns/agt-p-04` | 如何用反馈循环迭代候选结果 |
| AGT-P-05 | `content/patterns/agt-p-05-router-model-dispatch.mdx` | `/patterns/agt-p-05` | 如何做规则与模型驱动的分发 |
| AGT-P-06 | `content/patterns/agt-p-06-supervisor-handoff-agents-as-tools.mdx` | `/patterns/agt-p-06` | 三种多 Agent 控制权模型如何选择 |
| AGT-P-07 | `content/patterns/agt-p-07-orchestrator-workers-fanout-fanin.mdx` | `/patterns/agt-p-07` | 如何分解、并行执行并汇聚结果 |
| AGT-P-08 | `content/patterns/agt-p-08-durable-agent-hitl.mdx` | `/patterns/agt-p-08` | 长时任务如何暂停、恢复与人工审批 |

`data/pattern-groups.json` 的 `agent-control` 分组必须填入上述 8 个模式主题，并由 `/patterns` 索引提供可见入口。

### 5.3 案例层：3 篇

| 文件 | 路由 | 验证重点 |
| --- | --- | --- |
| `content/cases/multi-agent-research-system.mdx` | `/cases/multi-agent-research-system` | 问题分解、并行检索、证据合成与引用核验 |
| `content/cases/long-running-coding-agent.mdx` | `/cases/long-running-coding-agent` | Harness、沙箱、Checkpoint、测试反馈与可恢复工作 |
| `content/cases/production-incident-response-agent.mdx` | `/cases/production-incident-response-agent` | 只读诊断、假设评估、人工批准、变更执行与恢复验证 |

案例必须区分说明性架构与已证实事实，不虚构客户、事故、指标或生产结果。实现阶段使用 `writing-architecture-cases` 约束案例结构与证据边界。

## 6. 学习路径与依赖顺序

`/paths/agentic-architecture` 只负责组织学习，不复制正文。固定顺序为：

1. **系统边界：** Model → Augmented LLM → Workflow → Agent；
2. **单 Agent 基础：** Harness → Loop → Context/Memory/State/Checkpoint → Tool/Sandbox/Permission → Trace/Evaluation/Guardrail；
3. **控制模式：** Workflow vs Agent → Planner–Executor → Evaluator–Optimizer → Router；
4. **能力扩展：** Agentic RAG → Supervisor/Handoff/Agents-as-Tools → Orchestrator–Workers/Fan-out/Fan-in → Durable Agent/HITL；
5. **生产验证：** 多 Agent 研究系统 → 长时 Coding Agent → 生产事故响应 Agent。

学习路径应提供三个分支入口：

- 只需可控自动化的读者在 Workflow、Router 和 Evaluator–Optimizer 后停止；
- 建设知识型 Agent 的读者进入 Agentic RAG 与多 Agent 研究案例；
- 建设能产生副作用的长时 Agent 的读者进入工具安全、Durable Agent、Coding Agent 和事故响应案例。

新文章与已有 OpenAI Agents SDK、LangGraph Supervisor、Google ADK + A2A、AWS CLI Agent Orchestrator、Microsoft Multi-Agent Reference Architecture、Kong AI Gateway 等案例建立精确双向链接。链接文字必须说明责任分界或被验证的机制，不能只写“相关阅读”。

## 7. 统一文章契约

每篇文章都必须包含以下内容：

1. **读者问题：** 先提出需要解决的架构判断，不从孤立术语表开始；
2. **定义与边界：** 说明适用范围、非目标及相邻概念；
3. **六平面责任：** 分析交互、控制、知识与上下文、状态与记忆、动作与工具、治理与评测；
4. **运行合同：** 描述正常路径、失败路径、停止条件、恢复方式和最终负责人；
5. **决策信号：** 给出采用、升级、降级和不采用的条件；
6. **证据边界：** 明确该概念、模式或案例能够证明什么、不能证明什么；
7. **来源：** 使用论文、正式规范和官方工程材料，并标明来源事实、架构推导与作者建议；
8. **双向导航：** 提供前置概念、相邻模式、验证案例和返回学习路径的入口。

三类文章各自强化不同维度：

- 概念篇强调边界、生命周期和责任归属；
- 模式篇强调控制权、循环、终止条件、失败与恢复；
- 案例篇强调真实约束、方案比较、端到端执行、事故路径和可验证结果。

正文应保持折叠证据卡后仍能独立阅读，不能把关键限制只藏在来源或注释中。

## 8. 六个架构平面的固定定义

| 平面 | 必须回答的问题 | 常见错误 |
| --- | --- | --- |
| 交互 | 谁提出目标、补充信息、接受结果 | 把聊天界面等同于 Agent |
| 控制 | 谁选步骤、分支、重试和终止 | 控制权在模型与代码之间隐式漂移 |
| 知识与上下文 | 哪些信息进入当前推理窗口，来源是否可信 | 把召回内容直接当成事实 |
| 状态与记忆 | 哪些是任务事实、跨轮偏好和恢复点 | 用模型记忆承载业务真相 |
| 动作与工具 | 哪些能力只读，哪些会产生副作用 | 超时后盲目重试写操作 |
| 治理与评测 | 如何审计、判断质量、执行约束和升级人工 | 把日志、评测与护栏混为一谈 |

每篇文章不必平均分配篇幅，但不得省略与其核心机制有关的平面。

## 9. 统一失败模型与安全不变量

整套专题必须覆盖以下不变量：

1. 模型输出不是业务事实；共享真相落在显式状态或权威数据源；
2. Agent Loop 具有成功、失败、预算耗尽和人工中止等明确终止条件；
3. Agentic RAG 能判断证据不足、继续检索或拒答，不把召回等同于充分证据；
4. 工具调用区分只读和写入；副作用动作具有权限、幂等身份、结果验证与补偿策略；
5. Harness 约束上下文、工具、沙箱、预算、恢复与评测，不只是模型调用包装器；
6. 长时任务支持 Checkpoint、恢复、重放和重复动作防护；
7. 多 Agent 系统明确控制权、任务所有权、共享状态与冲突处理；
8. 高风险动作按风险与不可逆性设置人工批准，不任意暂停；
9. Trace 负责记录，Evaluation 判断质量，Guardrail 执行约束；
10. MCP、A2A 等协议只解决特定互操作边界，不自动解决权限、可靠性、状态一致性或治理；
11. 案例覆盖降级、超时、部分失败、恢复验证和停止自动化的条件；
12. 所有模式说明何时退回确定性 Workflow，避免为自治而自治。

## 10. 图示系统

专题使用一张统一参考架构和三类文章插图：

1. **概念边界图：** 表达包含、相邻、生命周期、权威性和责任归属，回答“它是什么、归谁管”；
2. **模式控制流图：** 表达控制权、循环、停止条件、失败分支和恢复路径，回答“它如何运行”；
3. **案例端到端图：** 表达系统拓扑、关键时序、权限边界、部分失败和恢复，回答“生产中如何落地”。

实现阶段必须先使用 `illustrating-architecture-articles` 为每篇文章判断图示类型。总参考架构和三个案例原则上采用 Draw.io + SVG；简单概念边界和模式流程可使用 Mermaid 或可访问表格，但同一语义不得用多张装饰图重复表达。采用 Draw.io 时必须继续遵循 `creating-drawio-architecture-diagrams` 的源文件、导出、几何和移动端验证要求。

所有图示遵守以下规则：

- 颜色不是唯一编码；
- 图内节点和箭头使用与正文一致的术语；
- 失败与恢复路径可见，不只画成功流程；
- 图注说明图能证明与不能证明的范围；
- 移动端局部滚动，不造成 document 级横向溢出；
- Draw.io 源文件与 SVG 导出保持语义和几何一致。

## 11. 来源与证据策略

来源分成五组：

| 证据组 | 核心来源 | 用途 |
| --- | --- | --- |
| Agent 边界与模式 | Anthropic *Building Effective Agents*；OpenAI *A Practical Guide to Building Agents* | 定义 workflow/agent、常见组合模式与渐进自治原则 |
| Harness 与长期运行 | Anthropic *Effective Harnesses for Long-Running Agents*、*Harness Design for Long-Running Application Development*、*Managed Agents* | 支持运行脚手架、长时任务、恢复和受管执行边界 |
| Loop 与检索 | ReAct、RAG、FLARE、Self-RAG、Agentic RAG survey | 支持推理—行动循环、基础 RAG 与主动/反思式检索演进 |
| 协议与互操作 | MCP Specification、A2A Protocol Specification | 支持工具/上下文协议和 Agent 间协作的能力边界 |
| 评测与治理 | Anthropic *Demystifying Evals for AI Agents*、OpenTelemetry semantic conventions、NIST AI RMF | 支持评测、追踪、风险与治理框架 |

来源使用规则：

- 概念定义优先引用论文、正式规范和官方工程资料；
- 厂商材料只证明该厂商公开描述的机制，不外推为全行业事实；
- 综述用于建立术语谱系和查找原始研究，不替代关键原始来源；
- 明确区分“来源直接支持”“基于来源的架构推导”“作者建议”；
- 不大段复制来源文字，不使用无出处图像，不超过合理引用范围；
- 建立逐篇来源台账，记录 URL、标题、机构、发布日期或版本、访问日期、支持主张和不能支持的结论。

实现时至少核验以下入口：

- <https://www.anthropic.com/engineering/building-effective-agents>
- <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>
- <https://www.anthropic.com/engineering/harness-design-long-running-apps>
- <https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents>
- <https://www.anthropic.com/engineering/managed-agents>
- <https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/>
- <https://arxiv.org/abs/2210.03629>
- <https://arxiv.org/abs/2005.11401>
- <https://arxiv.org/abs/2305.06983>
- <https://arxiv.org/abs/2310.11511>
- <https://arxiv.org/abs/2501.09136>
- <https://modelcontextprotocol.io/specification/2025-06-18/index>
- <https://a2a-protocol.org/latest/specification>
- <https://opentelemetry.io/docs/specs/semconv/>
- <https://www.nist.gov/itl/ai-risk-management-framework>

## 12. 测试与验收

### 12.1 内容契约

实现必须先增加失败测试，再完成正文。测试至少验证：

- 17 条新路由、Topic ID、content type、状态和分类正确；
- 概念、模式、案例索引均包含新页面；
- `agent-control` 分组包含 8 个模式；
- 学习路径覆盖 17 篇文章且顺序正确；
- 新旧文章之间存在可见、精确的双向链接；
- 每篇文章包含所需边界、失败、恢复、停止、证据和来源结构；
- 没有孤立页面、重复路由、失效内部链接或未发布依赖。

### 12.2 资产与链接

- 检查外部来源链接可访问或记录合理的替代来源；
- Mermaid 能成功构建；
- Draw.io 源文件与 SVG 均存在并通过仓库的图示验证；
- 图片路径、替代文本、图注和暗色主题显示正确；
- 不引入未经授权的第三方图像或大段文本。

### 12.3 全量工程验证

- 运行新增专题测试；
- 运行仓库全量测试、类型检查、lint 和生产构建；
- 保持项目现有内容密度门槛，并检查导航数据和生成页面；
- 对桌面与移动视口执行浏览器抽查，重点检查宽表格、长标题、图中文字、局部滚动和暗色主题；
- 由独立审阅检查概念准确性、架构合理性、来源支持度、文案一致性和导航完整性。

构建成功不能替代内容、证据和视觉验收。

## 13. 发布方案

本专题在 `.worktrees/agentic-architecture-topic-system` 和 `codex/agentic-architecture-topic-system` 中独立开发，不读取或合入其他工作分支的未提交内容。发布采用一个原子批次：

1. 完成 17 篇正文、全部图示、索引、模式分组、学习路径和双向链接；
2. 完成来源台账、专题测试、全量验证、浏览器 QA 和独立审阅；
3. 记录发布前证据；
4. 合并到 `main`；
5. 执行生产发布；
6. 在线验证学习路径、三个索引、代表性概念/模式/案例、图像资源和内部跳转；
7. 记录发布后证据。

任一必要检查失败都停止发布。不得先上线部分文章、空模式分组或指向未发布页面的导航。

## 14. 成功标准

专题完成时应满足：

1. 读者能够准确解释 Harness、Loop 与 Agentic RAG 的层级关系；
2. 读者能够在六个架构平面上定位 Agent 系统责任；
3. 读者能够根据不确定性、副作用、时长和风险选择 Workflow、单 Agent、多 Agent 或 Durable Agent；
4. 每个模式都具有停止、恢复、权限、评测和降级到确定性流程的说明；
5. 三个案例能够验证研究、编码和事故响应三种不同生产约束；
6. 17 篇文章、已有案例、索引和学习路径构成无孤岛的双向导航；
7. 所有来源、图示、测试、构建和线上验证均留下可复核证据。

## 15. 设计决策摘要

- 采用渐进自治阶梯作为目录主线，六平面作为统一分析框架，案例作为验证面；
- Agentic RAG 被定义为以证据充分性为终止判断的 Agent Loop 具象；
- 使用 6 篇概念、8 篇模式、3 篇案例组成完整专题，不用单篇总论代替知识体系；
- 概念使用全局唯一的 `AGT-C-01...`，模式使用 `AGT-P-01...`，案例使用语义化路由；
- 一次性发布全部正文、图示、导航和证据，不产生半完成的线上分类；
- 所有文章围绕控制权、状态权、副作用、证据、停止与恢复形成共同架构语言。
