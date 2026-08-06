# G009 Batch 2：STY-01 Layered Architecture 设计

## 1. 目标、范围与停止条件

本批次只发布并闭环 `STY-01 P0｜Layered Architecture`。文章必须把分层架构写成可检查的职责与依赖合同，而不是目录命名约定、部署拓扑或三层 CRUD 模板。完成后 `STY-01` 为 published/complete，G009 仍为当前持久故事，下一项切换为 `STY-02`。

正文必须让读者完成以下判断：

1. 区分逻辑 layer、代码 module/package 和物理 tier/deployment unit；
2. 为表示层、应用层、领域层和基础设施层定义责任、公开能力与禁止依赖；
3. 以封闭层为默认，识别什么时候旁路只是空转，什么时候是需要治理的开放层例外；
4. 用自动化架构测试、行为测试和运行证据证明依赖合同仍成立；
5. 判断横向技术分层何时开始阻碍按业务能力演进，并记录迁移触发器。

范围包括：

- 发布 `/styles/sty-01` 正文；
- 使用 STY-00 的八维架构剖面复核 Layered Architecture；
- 使用单一部署单元内的订单系统说明写路径和只读查询例外；
- 维护 STY-00 与 STY-01 的 metadata 和正文可见互惠关系；
- 沿用 `/cases/micro-frontends-single-spa`，对比分层团队与按用户价值垂直切片；
- 新增四项受治理来源和完整 link-health 证据；
- 完成专项测试、全量验证、独立审查、Stage A exact-head 部署、浏览器 QA、Stage B closure 和最终部署。

不在本批次范围内：

- 展开 Hexagonal、Onion 或 Clean Architecture 的端口、适配器和向内依赖机制；
- 展开 Vertical Slice、Modular Monolith 或 Microservices 的完整设计；
- 把逻辑层自动映射为独立进程、容器、服务、网络或团队；
- 提供某一种语言、框架或目录结构的可复制模板；
- 新增运行时组件、自动选型引擎或项目依赖；
- 提前完成 G009 或修改 G010 的范围。

停止条件是：设计、正文、Mermaid、两张表、订单案例、来源治理、互惠关系、生成投影、专项测试、`npm run verify`、独立审查、Stage A exact-head Pages、桌面与移动端浏览器 QA、Stage B closure 和最终 exact-head Pages 都具有可复查证据。任一门槛失败时，`STY-01` 保持 pending。

## 2. 已选方案与备选方案

### 已选：契约优先的经典分层

文章先固定层的责任、公开能力和允许依赖，再沿订单写路径验证控制流、事务与错误收敛。默认采用封闭层；开放层旁路必须记录理由、风险、验证、责任角色、复核条件和撤销条件。文章显式保留经典分层的自上而下依赖，不把基础设施依赖反转包装成普通分层。

该方案能直接检查“目录分层但依赖任意穿透”“层等于服务”“只增加转发层”等常见失败，并为 STY-02 的依赖反转对照留下清晰边界。

### 未选：请求流优先

只沿请求时序讲解阅读顺畅，却容易把分层退化为调用顺序，无法解释编译期依赖、开放层治理、循环依赖和长期演进成本。

### 未选：变体目录

并列三层、四层、开放层、封闭层和多个框架模板覆盖面更广，但会弱化默认规则，并与 STY-02、STY-03 和 STY-04 重叠。

## 3. 四层责任与依赖合同

文章使用四个逻辑层，顺序固定为：

1. 表示层；
2. 应用层；
3. 领域层；
4. 基础设施层。

责任合同固定如下：

| 层 | 主要责任 | 公开能力 | 禁止内容 |
| --- | --- | --- | --- |
| 表示层 | 协议解析、输入格式、响应呈现 | 稳定的输入映射和结果呈现 | 业务规则、事务决策、数据库访问 |
| 应用层 | 用例编排、权限入口、事务意图、超时预算和流程结果 | 面向调用方的用例 | 核心业务判断、ORM 与厂商驱动 |
| 领域层 | 订单与库存不变量、状态转换和业务拒绝 | 领域行为与稳定的数据访问能力合同 | HTTP、UI、数据库 schema、ORM 类型和运行配置 |
| 基础设施层 | 持久化、消息、时钟和外部系统实现 | 满足上层所需的数据与外部能力 | 决定业务规则或向上层泄漏厂商类型 |

默认依赖顺序是：

`表示层 → 应用层 → 领域层 → 基础设施层`

这代表经典分层的自上而下依赖。领域层可以依赖基础设施层公开的数据访问能力合同，但不能接触 schema、ORM、连接配置或厂商类型。由领域或应用定义端口、再让基础设施向内依赖的变体属于 STY-02 的依赖反转讨论，本批次只在边界提示中说明差异。

封闭层默认要求调用逐层经过紧邻下层。反向依赖和循环依赖始终禁止。开放层只允许上层跳过一个或多个中间层去调用更低层，不允许低层反向调用高层。

## 4. 开放层例外合同

每个开放层例外必须记录：

- 调用方；
- 被调用层；
- 被跳过层；
- 业务和技术理由；
- 不能被绕过的不变量；
- 风险与耦合变化；
- 自动化验证；
- 责任角色类型；
- 复核触发器；
- 撤销条件。

订单案例只有一个开放层例外：应用层可以直接调用基础设施层的只读报表查询能力，跳过领域层。它成立的前提是查询不改变权威状态、不重算业务不变量、不返回 ORM 或数据库类型，并由架构依赖测试、查询契约测试和结果映射测试锁定。

若报表开始参与订单确认、权限判断、库存计算或业务状态转换，该旁路立即失效，必须恢复逐层调用或重新设计边界。文章不得把性能猜测、代码行数或“查询很简单”单独当成旁路理由。

## 5. 订单系统数据流与错误收敛

写路径固定为：

1. 表示层解析下单请求并完成格式检查；
2. 应用层执行权限入口、超时预算和下单用例编排；
3. 领域层检查订单与库存不变量并生成明确业务结果；
4. 基础设施层在同一本地事务中持久化订单确认与库存预留；
5. 结果按稳定错误类别逐层返回并由表示层映射为协议响应。

本案例保持单一部署单元。逻辑层不暗示独立进程、服务、容器、网络跳或团队。订单确认与库存预留仍在同一本地事务中，文章不虚构吞吐、延迟、恢复时间或生产事故数据。

错误边界固定为：

- 表示层处理格式错误和协议映射；
- 应用层处理权限入口、用例超时和流程失败；
- 领域层产生业务拒绝，不抛出 HTTP 或数据库错误；
- 基础设施层保留技术故障细节，上层只接收稳定错误类别；
- 数据库异常、ORM 类型、HTTP 类型和厂商错误不得贯穿所有层。

## 6. STY-00 八维架构剖面

正文必须按 STY-00 的固定顺序填写八维剖面：

| 维度 | Layered Architecture 在本案例中的判断 |
| --- | --- |
| 边界 | 四层按技术责任划分，默认只允许紧邻向下依赖 |
| 控制流 | 表示层发起，应用层编排，领域层决策，基础设施层执行外部副作用 |
| 数据所有权 | 领域规则决定合法状态变化，基础设施实现持久化；报表查询只读 |
| 一致性 | 订单确认与库存预留在单一本地事务中完成 |
| 部署单元 | 四层随同一制品发布和回滚 |
| 故障域 | 进程内层不能提供独立故障隔离；基础设施失败仍会影响写路径 |
| 团队拓扑 | 一个跨层共同值班团队拥有完整订单能力，不按技术层拆团队 |
| 质量属性 | 降低局部认知范围、提供测试接缝和替换点；代价是横向变更传播、转发层和基础设施依赖 |

收益只能绑定到具体机制和当前证据。文章必须明确：分层本身不提供独立部署、独立扩缩、网络隔离或团队自治。

## 7. 文章与元数据合同

新增 `content/styles/sty-01-layered-architecture.mdx`，metadata 固定为：

```yaml
title: Layered Architecture：用依赖方向约束职责分层
slug: /styles/sty-01
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
  - 分层架构
  - 依赖治理
summary: 用封闭层默认、受控开放层例外和自动化架构测试约束职责分层，并区分逻辑层、部署单元与依赖反转。
topic_id: STY-01
priority: P0
depends_on:
  - STY-00
adjacent_topics:
  - STY-00
related_cases:
  - /cases/micro-frontends-single-spa
related_questions: []
```

同时修改 `content/styles/sty-00-comparison-framework.mdx`：

- 在 `adjacent_topics` 中加入 `STY-01`；
- 在正文可见位置加入 `/styles/sty-01`；
- 不改变 STY-00 的方法合同、来源和既有案例判断。

STY-01 正文必须遵守现有 style 十一段 H2 顺序：

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

四层合同表放在 `组件、连接器与约束`。Mermaid 放在 `边界与控制流`。开放层例外表放在 `质量属性收益与成本`。八维剖面分布在中间章节并在 `质量属性收益与成本` 收敛。订单完整演练放在 `对比案例`。

## 8. 视觉合同

格式判定为 `Mermaid`。决定性条件是：图只有一个单一部署单元边界、四个短标签层和一个只读查询能力；主要表达默认依赖与唯一旁路例外；内容需要随文章规则迭代，文本 diff 与低修改成本比精确坐标更重要。

图使用 `flowchart TD`，必须表达：

- 一个标记为“单一部署单元”的 subgraph；
- 表示层、应用层、领域层、基础设施层四个节点；
- 三条默认向下实线依赖；
- 一条从应用层到基础设施层只读查询能力的虚线例外；
- 不绘制反向依赖、独立服务、网络边界或 Hexagonal 向内依赖。

Mermaid 和两张表必须位于可聚焦的局部横向滚动容器内；键盘 ArrowRight 必须移动真正的 overflow owner，document 不得产生横向溢出。图的文字、箭头和边界必须在 desktop `1440x1000` 和 mobile `390x844` 下可读。

## 9. 来源与版权合同

正文固定引用四项新来源：

| 来源 | 作用 | 证据边界 |
| --- | --- | --- |
| Microsoft N-tier architecture style | 逻辑 layer 与物理 tier、开放/封闭层定义和代价 | 不把 Azure VM 参考部署当成 STY-01 的必需拓扑 |
| Martin Fowler Presentation Domain Data Layering | 经典自上而下依赖、逻辑层不等于部署单元、领域模块内部再分层 | 作者经验与分析不能写成行业普遍保证 |
| AWS Hexagonal Architecture Overview | 经典分层与依赖反转的区别 | 只用于边界提示，不提前教授 STY-02 |
| ArchUnit User Guide | 层间访问和循环可转化为自动化架构规则 | Java 示例只证明可执行性，不把工具绑定为通用要求 |

canonical locator 固定为：

- `https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier`
- `https://martinfowler.com/bliki/PresentationDomainDataLayering.html`
- `https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html`
- `https://www.archunit.org/userguide/html/000_Index.html`

Microsoft 来源作为 manifest primary；其余三项为 secondary comparison/implementation evidence。四项均只使用原创事实摘要和短标签，不复制来源图、表格、结构或长段落。

Microsoft Learn 复用仓库既有 CC BY 4.0 family 证据。AWS、Martin Fowler 和 ArchUnit 文档必须分别使用本次检查到的页面或上游许可作为 evidence；在许可范围未被明确证明前，按 `facts-and-short-quotation` 和最保守 rights 边界登记，不从软件仓库许可证推导网页内容改编权。

四项来源在 Stage A 前必须具有完整 provenance、version、rights、link policy、copyright evidence、citation review 和 cache observation。任一来源的事实或权利边界无法闭环时，不得承担正文结论。

## 10. 自动化验证合同

新增 `tests/g009-batch2-content.test.mjs`，至少锁定：

- STY-01 文件、slug、topic id、元数据和十一段 H2 顺序；
- 四层名称、顺序、职责、公开能力和禁止内容；
- 三条默认相邻向下依赖、零条反向依赖和唯一开放层例外；
- 开放层例外的十个记录字段和失效条件；
- layer、module/package、tier/deployment unit 的区别；
- 订单写路径、本地事务、错误类别和只读查询路径；
- STY-00 八维剖面名称、顺序、收益和代价；
- Mermaid subgraph、四层节点、三条实线和一条虚线；
- 两张表的可聚焦 overflow wrapper 合同；
- 四项正文引用、四项新 source record 和唯一 manifest primary；
- STY-00 ↔ STY-01 metadata 与正文可见互惠关系；
- Micro-Frontend 案例链接；
- Stage A 投影保持 STY-01 published/pending。

mutation tests 必须拒绝：

- 跳过领域层的写路径；
- 基础设施反向依赖应用或表示层；
- 领域层接收 HTTP、ORM 或数据库类型；
- 无理由、无验证或无撤销条件的开放层例外；
- 把四层画成四个部署单元；
- 把 Hexagonal 的向内依赖写成经典分层默认；
- 删除 STY-00 互惠关系或让未发布 STY-02 变为 actionable link。

新增 `tests/g009-batch2-deployment.test.mjs`，Stage B 至少锁定：

- exact Stage A commit、workflow run、build/deploy job、状态和生产 routes；
- desktop `1440x1000` 与 mobile `390x844`；
- Mermaid、两张表、焦点、局部 overflow 和 ArrowRight 行为；
- 四项来源和全部关系真实激活；
- warnings、errors、page errors 为 0；
- `STY-01` published/complete、G009 current、STY-02 next；
- Stage B 投影为 `54 / 95 / 502`；
- G009 Batch 1 及更早历史发布证据保持字节级不变；
- G009 Batch 2 review 和当前发布基线具有 exact、mutation-sensitive 门禁。

## 11. 异常与恢复合同

- 无法区分逻辑层和物理 tier：停止写作，修正边界后再继续；
- 层的职责只有名称没有禁止依赖：合同不完整，不进入 Stage A；
- 开放层例外缺少理由、验证或撤销条件：视为任意旁路并拒绝；
- 订单写路径绕过领域层：拒绝该设计，不以性能收益抵消；
- 来源不可访问、rights 或 citation 边界不清：不得承担事实结论；
- 生成物与权威输入不一致：修改权威输入并重新生成，禁止手改 generated 文件；
- 浏览器 overflow、来源或关系激活失败：Stage A 不进入 closure；
- Stage A exact-head 或 jobs 不匹配：STY-01 保持 pending；
- Stage B 投影、历史证据或 production 状态不一致：修复后重新验证与部署。

## 12. 发布与状态投影

设计和实现基于 `origin/main` 的 `f10a2c7dde69ae4e5211cc6222e9dd2f1cb670dd`，使用独立 worktree `/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch2` 和分支 `codex/g009-styles-batch2`。根 checkout、Batch 1 worktree 和根目录未跟踪 `.codex/config.toml` 都是受保护的外部状态，不在本批次修改范围内。

Stage A：

- 新增 STY-01、更新 STY-00 互惠关系、登记四项来源并生成内容投影；
- backlog 中 STY-01 保持 `[ ]`；
- 预期投影为 `53 / 95 / 502`，STY-01 published/pending；
- 运行专项测试、完整 `npm run verify` 和独立内容/代码/架构审查；
- 推送 exact HEAD 并等待 Pages build/deploy 成功；
- QA routes 至少包含 `/styles/sty-01`、`/styles/sty-00`、`/styles`、`/cases/micro-frontends-single-spa` 和 `/references`。

Stage B：

- 将 STY-01 backlog 行改为 `[x]`；
- 写入 Stage A exact SHA、Pages run/jobs、测试总数、审查和浏览器证据；
- 生成并锁定 `54 / 95 / 502`，STY-01 published/complete、G009 current、STY-02 next；
- 运行 focused 与 full verification、独立终审和 mutation-sensitive deployment closure；
- 推送最终 exact HEAD，等待 Pages 成功并复查生产 routes、状态、来源、关系和图表交互。

G009 只有在 STY-00..06 全部闭环后才完成。本批次不得 checkpoint G009。
