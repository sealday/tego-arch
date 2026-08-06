# G009 Batch 1：STY-00 架构风格比较框架设计

## 1. 目标、范围与停止条件

本批次只闭环 `STY-00 P0｜架构风格比较框架`。现有页面已经作为 style 内容契约的生产 fixture 发布，但 backlog 仍为 pending；本批次把它升级为可以重复执行、留下证据并触发复核的风格决策方法。完成后 `STY-00` 为 published/complete，G009 仍是当前持久故事，下一项切换为 `STY-01`。

正文必须让读者完成以下工作：

1. 用可测量的质量属性场景定义问题，而不是从风格名称开始；
2. 把每个候选展开为同构的架构剖面；
3. 先执行硬约束否决，再比较收益、机制、代价与未知项；
4. 识别风险、敏感点和权衡点；
5. 记录选择、被否决候选、置信度和复核触发器。

范围包括：

- 固定八个比较维度：边界、控制流、数据所有权、一致性、部署单元、故障域、团队拓扑、质量属性；
- 提供候选架构剖面表、场景—响应矩阵和决策记录卡；
- 提供一个由六个行动节点和一个判断节点组成的 Mermaid 决策流，并包含“证据不足”恢复回路；
- 用同一订单系统场景完整比较两个候选架构剖面；
- 用官方或第一方资料治理风格定义、质量场景、权衡分析和决策记录依据；
- 保持 `PR-01`、`MOD-02` 与现有案例关系可见、互惠且可操作；
- 完成专项测试、全量验证、独立审查、生产部署、浏览器 QA 和 Stage B closure。

不在本批次范围内：

- 创建 `STY-01` 至 `STY-06` 的正文；
- 修改全站 style 十一段章节契约；
- 建立自动选型引擎、通用评分库或新的运行时组件；
- 把风格名称当成互斥技术产品，或断言某种风格普遍优于另一种；
- 用无证据分数、简单总分或团队规模单独决定架构；
- 提前完成 G009 或改变 G010 的范围。

停止条件是：设计、正文、Mermaid、表格、来源治理、关系、生成投影、专项测试、`npm run verify`、独立审查、Stage A exact-head 部署、桌面与移动端浏览器 QA、Stage B closure 和最终 exact-head 部署都具有可复查证据。任一门槛失败时保持当前阶段未完成。

## 2. 已选方案与备选方案

### 已选：场景驱动的架构剖面比较

先把候选方案转换为同构架构剖面，再用同一场景集比较。比较结果使用 `直接支持`、`需要补充机制`、`与约束冲突` 和 `未知` 四种判断；每项判断同时记录机制、证据、代价和置信度。硬约束先于收益比较，未知项不能获得默认分数。

该方案避免把 Modular Monolith、Microservices 和 Event-Driven 当成同一分类轴上的互斥标签。候选可以组合多种约束，但必须把组合后的边界、通信、数据、部署和故障行为逐项写清。

### 未选：复杂视觉比较板

Draw.io 比较板可以容纳更多信息，但本文的主要判断依赖精确表格字段和可迭代流程。复杂画布会重复表格、提高维护成本，并弱化“先场景、再剖面、后判断”的执行顺序。

### 未选：最小 fixture 扩写

只润色现文并保留 `0/1/2` 加总可以快速关闭 checkbox，却无法成为 STY-01..06 的统一基线，也不能处理硬约束、证据不足、敏感点和复核触发器。

## 3. 方法合同

### 3.1 输入

一次比较必须具备以下输入：

- 业务目标和不可违反的约束；
- 3 至 5 个按优先级排序、含响应度量的质量属性场景；
- 2 至 4 个候选架构剖面；
- 当前系统、团队、部署和运维能力的可核验证据；
- 决策期限、责任角色类型和下一次复核条件。

未定义响应度量的“高可用”“易扩展”“快速交付”不构成可比较场景。缺少事实时字段值是 `未知`，不能根据风格声誉推断。

### 3.2 八维候选架构剖面

每个候选都必须按以下固定顺序填写：

| 维度 | 必须回答的问题 |
| --- | --- |
| 边界 | 组件如何划分，哪些依赖被允许或禁止？ |
| 控制流 | 谁启动、推进、暂停和终止一次业务流程？ |
| 数据所有权 | 谁能写入权威状态，其他单元如何读取？ |
| 一致性 | 哪些变化原子完成，哪些允许延迟、补偿或冲突解决？ |
| 部署单元 | 哪些单元独立构建、发布、回滚和扩缩？ |
| 故障域 | 哪种故障会传播，隔离、恢复和降级边界在哪里？ |
| 团队拓扑 | 变更、值班、审批和所有权实际如何分配？ |
| 质量属性 | 候选通过什么机制支持场景，又引入什么代价？ |

剖面表字段固定为：`维度`、`候选约束`、`实现机制`、`当前证据`、`未知项`。表中不能只填写风格名称或产品名称。

### 3.3 六步决策流

流程顺序固定为：

1. 定义并排序质量属性场景；
2. 建立候选架构剖面；
3. 执行硬约束检查；
4. 比较机制、证据、风险与代价；
5. 记录决策、置信度和复核触发器；
6. 用原型、测量或故障演练验证未知项。

Mermaid 必须表达从第 4 步进入“证据足够？”判断。`否`分支进入第 6 步并回到第 4 步；`是`分支进入第 5 步。违反硬约束的候选被记录为否决，不再参与后续总分竞争。

### 3.4 判断语义

| 判断 | 语义 |
| --- | --- |
| `直接支持` | 候选已有明确机制和足够证据满足场景 |
| `需要补充机制` | 候选只有在增加已说明的机制与成本后才可能满足场景 |
| `与约束冲突` | 候选违反不可协商约束，或补充机制会取消候选的核心前提 |
| `未知` | 证据不足，必须原型、测量、演练或继续调查 |

允许在辅助讨论中使用序数或测量结果，但禁止用 `0/1/2` 简单加总直接产生结论。不同质量场景不可假定等权，硬约束不可被其他高分抵消。

### 3.5 场景—响应矩阵与决策记录卡

场景—响应矩阵字段固定为：`场景与响应度量`、`候选响应`、`判断`、`所需机制`、`风险或代价`、`证据`、`置信度`。

决策记录卡字段固定为：

- 决策范围与日期；
- 参与的责任角色类型；
- 选定候选；
- 被否决候选与原因；
- 关键敏感点；
- 关键权衡点；
- 仍未关闭的风险；
- 验证动作；
- 复核触发器。

## 4. 文章与元数据合同

修改 `content/styles/sty-00-comparison-framework.mdx`，保留以下身份：

```yaml
title: 架构风格比较框架
slug: /styles/sty-00
content_type: style
status: reviewed
difficulty: intermediate
topic_id: STY-00
priority: P0
depends_on: []
adjacent_topics:
  - PR-01
  - MOD-02
related_cases:
  - /cases/micro-frontends-single-spa
related_questions: []
```

`analyzed_at` 与 `source_cutoff` 更新为 `2026-08-06`。summary 必须说明文章使用质量属性场景、八维架构剖面、硬约束和证据完成比较。现有互惠关系不改变，不为尚未发布的 STY-01..06 建立可见链接。

正文继续遵守 style 十一段 H2 顺序：

1. `## 学习问题`
2. `## 组件、连接器与约束`
3. `## 边界与控制流`
4. `## 数据所有权与一致性`
5. `## 部署单元与故障域`
6. `## 团队拓扑`
7. `## 质量属性收益与成本`
8. `## 迁移路径`
9. `## 禁用条件`
10. `## 对比案例`
11. `## 来源`

方法构件在既有章节内分布，不新增 H2：

- `组件、连接器与约束` 定义输入、候选剖面和硬约束；
- 中间四节完整解释八个比较维度；
- `质量属性收益与成本` 放置 Mermaid、判断语义、场景—响应矩阵和决策记录卡；
- `迁移路径` 解释验证动作、复核触发器和渐进迁移；
- `禁用条件` 收敛伪精确、标签驱动和证据缺失；
- `对比案例` 完成同场景比较与明确决策。

## 5. 视觉合同

格式判定为 `Mermaid`。决定性条件是：流程只有六个行动节点和一个判断节点，全部使用短标签，主要表达顺序和一个恢复回路，且后续会随方法迭代；文本 diff 与低修改成本比精确坐标更重要。Draw.io 的边界与排线能力在此没有新增教学价值；位图无法承担精确流程证据。

Mermaid 使用 `flowchart TD`，必须包含并只表达以下语义节点：

- 质量属性场景；
- 候选架构剖面；
- 硬约束检查；
- 机制与证据比较；
- 证据足够判断；
- 原型、测量或故障演练；
- 决策记录与复核触发器。

`证据足够判断` 的否分支进入验证节点并回到比较节点，是图中唯一回路。图不绘制具体候选拓扑，避免与后续 STY-01..06 的机制图重复。

页面渲染时，Mermaid 与两张表必须位于可聚焦的局部横向滚动容器内；键盘 ArrowRight 能移动真正的 overflow owner，页面本身不得产生横向溢出。

## 6. 完整演练合同

说明性场景是单团队维护的订单系统。它必须满足以下输入事实，不增加虚构生产指标：

- 下单与库存预留必须在订单确认前得到一致结果；
- 报表消费者可短暂不可用，不能阻断订单写入；
- 报表允许有界延迟，并需要明确恢复行为；
- 团队当前共同值班，尚无独立服务平台能力；
- 发布失败必须有明确回滚路径，已接受订单不能丢失。

候选 A 是“模块化单体 + 事务性 Outbox + 独立报表消费者”：订单事务留在单进程边界内，报表通过已提交事件异步更新。

候选 B 是“订单、库存、报表独立部署”：订单与库存通过同步调用确认，报表通过事件更新；服务间失败、版本兼容、数据归属和恢复必须显式处理。

演练必须：

1. 分别填写两个候选的八维剖面；
2. 对相同质量场景填写场景—响应矩阵；
3. 先执行硬约束和能力约束检查；
4. 将未实测的恢复时间或吞吐能力标为未知；
5. 选择候选 A，并说明选择来自当前约束与证据，而不是“单体永远更简单”；
6. 记录至少三个复核触发器：团队所有权拆分、订单容量或故障隔离目标变化、独立发布需求持续出现；
7. 明确后续可以重新选择或组合候选，不把当前结论写成永久规则。

## 7. 来源与版权合同

正文使用五项具体来源：

| 来源 | 作用 | ledger 处理 |
| --- | --- | --- |
| SEI Quality Attribute Workshop Collection | 场景形成、排序与细化 | 新增受治理来源 |
| SEI Architecture Tradeoff Analysis Method Collection | 风险、敏感点、权衡点与场景分析 | 新增受治理来源，并作为 manifest primary |
| Microsoft Architecture Styles | 风格是约束集合、收益与挑战必须同时比较 | 新增受治理来源 |
| arc42 Architecture Decisions | 决策、备选与理由记录 | 新增受治理来源 |
| arc42 Quality Requirements | 可测量质量需求与场景 | 复用现有受治理来源 |

具体 locator 固定为：

- `https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/`
- `https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/`
- `https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/`
- `https://docs.arc42.org/section-9/`
- `https://docs.arc42.org/section-10/`

STY-00 文档引用不再依赖通用的 SEI training 页面和 arc42 首页，但这些全局 source record 继续保留，因为其他文章仍在使用。所有五项引用都使用事实摘要，不复制来源结构、图或长段落；表格、判断词汇、Mermaid 和演练为本站原创。

四项新 source record 必须具有完整 provenance、version、rights、link policy、copyright evidence 和 citation review。Microsoft Learn 沿用仓库既有 CC BY 4.0 family 证据；SEI 与 arc42 权利边界按各自已有家族规则治理，不从软件许可证推导文档改编权。

## 8. 异常与恢复合同

- 缺少场景响应度量：停止比较，先补充可验证目标；
- 候选字段缺证据：写 `未知`，安排原型、测量或故障演练；
- 候选违反硬约束：记录否决原因，不允许其他收益抵消；
- 候选无法区分：不强制选胜者，缩小问题或执行验证动作；
- 来源不可访问或边界不清：不得用该来源承担事实结论，保留可追踪检查结果；
- 生成物与源文件不一致：修改权威输入并重新生成，禁止手改 `src/generated/`；
- 浏览器交互、overflow、来源或关系点击失败：Stage A 不进入 closure；
- Stage A 部署身份不匹配或 jobs 未成功：STY-00 checkbox 保持未完成；
- Stage B 投影与 backlog、manifest 或生产页面不一致：保持 G009 current/STY-00 pending 并修复后重跑。

## 9. 测试与审查合同

新增 `tests/g009-batch1-content.test.mjs`，至少锁定：

- STY-00 身份、元数据和十一段 H2 顺序；
- 八维名称、顺序和剖面表字段；
- 四种判断语义；
- Mermaid 节点、分支和唯一恢复回路；
- 场景—响应矩阵与决策记录卡字段；
- 两候选演练、硬约束、未知项、结论和三个复核触发器；
- 禁止简单 `0/1/2` 总分产生结论；
- 五项正文引用、四项新 source record 和唯一 manifest primary；
- PR-01、MOD-02、案例与 `/styles` 的可见关系；
- Stage A 投影保持 STY-00 published/pending。

新增 `tests/g009-batch1-deployment.test.mjs`，Stage B 至少锁定：

- exact Stage A commit、workflow run、build/deploy job、状态和线上 route；
- desktop `1440x1000` 与 mobile `390x844`；
- Mermaid 与两张表的 wrapper、焦点、局部 overflow 和 ArrowRight 行为；
- 全部来源与关系真实点击；
- warnings、errors、page errors 都为 0；
- `STY-00` published/complete、G009 current、STY-01 next；
- 完成投影为 `53` 个主题、`94` 篇内容文档、`498` 个受治理来源；
- G008 Batch 11 及更早历史发布证据保持不变。

创建 `docs/reviews/g009-batch1.md`，记录 editorial、factual、copyright、relations、render 和 deployment 六类 PASS 证据。独立审查至少包含 content/factual review、code review 与 architecture review；Critical 或 Important 未清零时不得进入下一阶段。

验证顺序固定为：

1. `node --test tests/g009-batch1-content.test.mjs`；
2. `npm run validate:content`；
3. `npm run generate:content` 后确认只出现预期生成差异；
4. `npm run check:content`、`npm run check:links`、`npm run check:reviews`；
5. `npm run verify`；
6. `git diff --check`；
7. Stage A exact-head Pages 与生产浏览器 QA；
8. Stage B deployment test、全量验证、最终 exact-head Pages 与生产 smoke。

## 10. 发布与状态投影

实现从 `origin/main` 的 `b0ac010174c3c325b1f049e2ed8147f482c90be7` 创建在独立 worktree `/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch1` 和分支 `codex/g009-styles-batch1` 中。根 checkout、G008 worktree 和根目录未跟踪 `.codex/config.toml` 都是受保护的外部状态，不在本批次修改范围内。

Stage A：

- 修改 STY-00、source ledger、专项内容测试和 review 草稿；
- 保持 backlog checkbox 未勾选；
- 预期投影仍为 `52 / 94 / 498`，STY-00 published/pending；
- 通过全量验证、独立审查后推送并等待 exact-head Pages 成功；
- 对 `/styles`、`/styles/sty-00`、`/principles/pr-01`、`/modeling/mod-02`、案例页和 `/references` 做桌面与移动端 QA。

Stage B：

- 将 STY-00 backlog 行改为 `[x]`，写入 Stage A 不可变部署证据；
- 更新 `docs/content-backlog.md` 当前发布基线与 `docs/reviews/g009-batch1.md`；
- 生成并锁定 `53 / 94 / 498`，STY-00 published/complete、G009 current、STY-01 next；
- 全量验证、独立最终审查、推送并等待最终 exact-head Pages；
- 复查生产 route、来源、关系、图表交互和投影后，保留 worktree 供审计。

G009 只有在 STY-00..06 全部闭环后才完成。本批次不得 checkpoint G009。
