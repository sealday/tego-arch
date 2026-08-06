# G008 Batch 11：MOD-13 模型同步策略设计

## 1. 目标、范围与停止条件

本批次只发布 `MOD-13 P2｜模型同步策略`，回答代码、架构图、ADR、期望部署、实际部署和运行观测如何在长期演进中避免互相冒充权威并持续漂移。它是 G008 的最后一个主题；Stage B 完成后关闭 G008，持久故事投影从 `7 / 20` 前进到 `8 / 20`，当前故事切换为 G009，下一项为 STY-00。

本站仓库自身是可核验主案例：`docs/content-backlog.md` 是人工任务状态单写者，MDX front matter 是已发布内容元数据来源，`src/generated/` 是派生投影，测试负责验证合同，GitHub Pages run、jobs、commit SHA 与线上 route 构成发布证据。费用申报系统只作为说明性场景，用于解释代码、图、ADR 与部署事实之间的漂移；它不增加生产事实，也不改变 MOD-02 的权威系统边界与元素名称。

范围包括：

- 为每一类事实明确权威来源、派生产物、同步方向、触发时机、检测方式、责任类型、修复方向与非证明边界；
- 区分内容漂移、结构漂移、决策漂移和运行漂移；
- 给出声明权威、生成或验证、检测差异、分级处置、重建证据、发布复核的六步闭环；
- 提供一张权威事实台账、一张漂移处置台账，以及一组 Draw.io + SVG 教学图；
- 建立 MOD-04、MOD-12、MTH-03、MTH-06 的可见互惠关系，并关联 Kubernetes reconciliation loop 案例；
- 通过两阶段发布关闭 MOD-13 与 G008。

不在本批次范围内：

- 新增通用 drift 平台、GitOps controller、代码扫描器或生产监控；
- 把所有事实压成一个万能真相源；
- 声称代码可以自动推出业务边界、ADR 可以证明实现、图可以证明部署、部署成功可以证明运行健康；
- 改写 MOD-02 的权威图，或为费用申报系统补造接口、协议、身份、拓扑、故障切换和运行数据；
- 启动 STY-00 或其他 G009 内容。

停止条件是：设计、文章、图源与 SVG、来源治理、关系、生成投影、测试、独立审查、Stage A exact-head 部署、浏览器 QA、Stage B closure 和最终 exact-head 部署全部具备可复查证据。任一门槛失败时保持当前阶段未完成。

## 2. 已选方案与备选方案

### 已选：权威事实图与漂移闭环

每条同步关系都从“这一项事实由谁写”开始，而不是从“两个文件怎样保持相同”开始。权威可以因事实而异：代码结构由受测代码与接口合同承担，架构语义由已批准模型或图源承担，决策状态由 ADR 承担，期望部署由版本化声明承担，实际部署和运行状态只能由部署记录与观测证据承担。生成、验证和观测是三种不同关系，不能用一个“双向同步”箭头替代。

该方案与仓库已有单写者、生成投影、mutation-sensitive 测试和 Stage A/B 发布机制一致，也能明确说明自动化不能证明什么。

### 未选：按四种制品分开的检查清单

分别列出代码、图、ADR、部署清单容易阅读，但会形成四个不相交的维护流程，无法回答一个变更怎样跨越多类事实，也无法统一处理冲突、未知和修复证据。

### 未选：所有事实 GitOps 化

声明式、版本化和持续协调适用于被声明并由 agent 管理的期望状态，但代码含义、业务边界、ADR 动机和运行观测不都属于可自动施加的期望状态。将其扩张为通用同步机制会制造新的伪精确。

### 未选：周期性人工评审作为唯一机制

纯人工复核可以发现语义问题，却无法及时锁住生成物、链接、元数据、图源配对和部署身份等确定性合同。人工判断必须保留，但应集中在无法机械证明的语义、权威冲突和接受差异上。

## 3. 学习问题与应保留的判断

正文回答五个学习问题：

1. 为什么“同步”首先是权威与方向问题，而不是文件内容相等？
2. 如何区分生成、验证和观测，并为每种关系设置不同证据？
3. 如何识别内容、结构、决策和运行四类漂移？
4. 发现漂移后，何时自动重建、何时人工裁决、何时阻断发布？
5. 如何用不可变版本、测试、部署记录和线上复核证明一次同步闭环已完成，同时不夸大证明范围？

读者最终应保留以下判断：

- 一项事实只能有一个当前权威来源；多个证据可以验证它，但不能同时成为无优先级的写者。
- 派生产物应重新生成，不能手工修补；验证关系只能报告差异，不能未经授权重写权威。
- ADR 记录决定及其状态，不是实现一致性的证明；部署记录证明特定提交完成指定流程，不是运行健康保证。
- 无法读取检测器、实际部署或运行观测时，状态是“未知”，不是“无漂移”。
- 只有修复权威来源、重建派生产物、重跑检测并形成新发布证据后，漂移才算关闭。

## 4. 概念与状态合同

### 4.1 同步关系合同

每条权威事实记录使用九个字段：

| 字段 | 含义 |
| --- | --- |
| 事实 | 需要长期保持可核验的最小语义单元 |
| 权威来源 | 当前唯一允许写入该事实的位置或系统 |
| 派生产物 | 可从权威生成、导出或投影的结果 |
| 同步关系 | `生成`、`验证` 或 `观测`，三者不得混用 |
| 触发时机 | 变更、合并、部署、定时复核或事件发生时 |
| 检测方式 | 可重复执行的命令、查询、比较或人工复述 |
| 责任类型 | 负责裁决和修复的角色类型，不虚构具体团队或人员 |
| 修复方向 | 发生差异时应修改权威、重建派生物或新增替代记录 |
| 非证明边界 | 本证据明确不能推出的结论 |

`生成` 表示目标产物可由权威输入确定性重建；`验证` 表示比较两个具有不同职责的证据，只报告是否满足合同；`观测` 表示从外部或运行环境读取实际事实，观测结果不得反向静默改写期望状态。

### 4.2 四类漂移

| 类型 | 定义 | 典型信号 | 默认处置 |
| --- | --- | --- | --- |
| 内容漂移 | 文档、元数据、索引或发布说明与权威输入不一致 | backlog、front matter 与 generated manifest 不一致 | 修复权威输入并重新生成；禁止手改 generated 文件 |
| 结构漂移 | 代码接口、架构模型、图中元素或关系出现未解释的语义差异 | 图仍展示已删除组件，或代码出现图中宣称不存在的跨界关系 | 先判定哪项结构事实由谁权威，再修改代码或模型并补验证 |
| 决策漂移 | 实现或部署绕过有效 ADR，或 ADR 状态未反映后续替代关系 | 已接受决定被反转但旧 ADR 仍显示有效 | 修改实现以恢复决定，或新增 ADR 并标记旧记录被替代 |
| 运行漂移 | 版本化期望部署、实际制品、配置或运行观测不一致 | 部署 commit、环境状态或可观测版本与期望不同 | 保留实际观测，按责任修复期望或运行状态，再重建部署证据 |

严重度不由漂移类型自动决定。影响系统边界、权限、安全、不可逆副作用、资金、恢复或发布身份的差异默认阻断；确定性派生物可安全重建时可以自动修复；需要业务或架构判断的冲突必须人工裁决；明确接受的临时差异必须记录责任类型、理由、复查条件和到期点。

### 4.3 六步闭环

闭环顺序固定为：

1. **声明权威：** 把事实拆到足以拥有单一写者的粒度，并记录非证明边界。
2. **生成或验证：** 能确定性派生的产物自动生成；不能派生的证据按合同比较或观测。
3. **检测差异：** 保存实际输入、比较结果、时间和版本身份；检测器不可用时记录未知。
4. **分级处置：** 判断自动重建、人工裁决、接受差异或阻断发布，并分配责任类型。
5. **重建证据：** 修改权威来源或新增替代 ADR，重新生成派生物并重跑所有受影响检测。
6. **发布复核：** 用精确提交、工作流、部署状态和线上 route 复核结果；发布成功不扩张为运行健康结论。

## 5. 文章与元数据合同

### 5.1 新文章

创建 `content/modeling/mod-13-model-sync-strategy.mdx`，front matter 固定为：

```yaml
title: 模型同步策略
slug: /modeling/mod-13
content_type: modeling
status: reviewed
difficulty: advanced
analyzed_at: 2026-08-06
source_cutoff: 2026-08-06
review_policy: quarterly-version-sensitive
confidence: high
domains:
  - software-architecture
agent_patterns: []
protocols: []
quality_attributes:
  - understandability
  - maintainability
  - auditability
  - reliability
tags:
  - 模型同步
  - 架构漂移
  - ADR
  - GitOps
summary: 为代码、架构图、ADR、期望部署和实际运行事实指定单一权威、同步方向与检测证据，并用四类漂移和六步闭环完成修复与发布复核。
topic_id: MOD-13
priority: P2
depends_on:
  - MOD-04
  - MOD-12
  - MTH-03
  - MTH-06
adjacent_topics:
  - MOD-04
  - MOD-12
  - MTH-03
  - MTH-06
related_cases:
  - /cases/kubernetes-reconciliation-loop
related_questions: []
```

正文 H2 顺序固定为：

1. `## 学习问题`
2. `## 同步目标与输入`
3. `## 权威事实台账`
4. `## 漂移检测闭环`
5. `## 核心产物`
6. `## 完成判断`
7. `## 常见失败`
8. `## 与其他模型的衔接`
9. `## 完整演练`
10. `## 来源`

开头三段内必须给出具体冲突、可迁移判断和证据边界。主阅读路径解释机制、后果和关键限制；固定版本、仓库路径、命令与来源许可放入主题明确的 evidence card。折叠所有 evidence card 后，读者仍能解释控制权、状态、失败、恢复和非证明边界。

### 5.2 仓库主案例

仓库案例至少覆盖以下事实：

- `docs/content-backlog.md` 的 checkbox 是唯一人工任务状态；
- MDX front matter 是已发布主题元数据输入；
- `src/generated/topic-manifest.json`、`topic-indexes.json` 与 `project-status.json` 是可重建派生产物；
- tests 验证来源、关系、生成投影与发布合同，但不成为内容事实的第二写者；
- Stage A 先发布内容并保持 MOD-13 pending，Stage B 才记录不可变部署证据、关闭主题并推进 G008；
- Pages run、build/deploy jobs、exact head SHA 与线上 route 是发布证据，不能证明所有运行行为健康。

所有仓库路径、计数和提交证据只在实施时使用可复查的当前值，不将设计阶段的本地未发布状态写成生产事实。

### 5.3 费用申报说明性场景

说明性场景沿用 MOD-02 的权威名称：员工、Web 应用、申报 API、申报数据库、支付任务执行器、银行支付服务和费用申报系统边界。场景只描述受控变更：例如代码移除一个接口、架构图仍保留旧关系、ADR 尚未被替代、期望部署与实际制品版本不同。所有内容明确标记 `说明性场景`，不提供虚构客户、事故、指标、协议、生产经验或效果保证。

场景必须分别指出：

- 哪项事实的权威在哪里；
- 差异属于哪类漂移；
- 检测器证明什么与不证明什么；
- 应修改哪个权威或新增哪条替代记录；
- 修复后需要重建哪些证据。

## 6. 核心产物合同

### 6.1 权威事实台账

正文第一张表固定八行：

1. backlog 主题状态；
2. 已发布内容元数据；
3. 代码接口与受测结构；
4. 架构模型与图中语义；
5. ADR 决策及状态；
6. 期望部署声明；
7. 实际部署身份与状态；
8. 运行观测。

每行必须完整填写九字段合同。表格使用带 `role="region"`、`aria-label`、`tabIndex={0}` 和 `handleHorizontalArrowKey` 的本地横向滚动 wrapper。台账不得写成“代码永远权威”或“Git 永远权威”；权威粒度以具体事实为准。

### 6.2 漂移处置台账

正文第二张表固定四行，对应内容、结构、决策、运行四类漂移。字段固定为：漂移类型、差异证据、严重度、当前状态、责任类型、修复动作、重新验证证据、明确不证明。四行都必须出现具体的仓库或说明性场景证据，不使用抽象占位符。

状态词汇限定为：`待分级`、`阻断`、`修复中`、`接受差异`、`已验证关闭`、`未知`。`接受差异` 必须同时记录理由、责任类型、复查条件和到期点；`未知` 不能转成 PASS；`已验证关闭` 必须指向修复后的检测与发布证据。

### 6.3 完成检查

一次同步闭环只有在以下条件全部满足时完成：

- 每项事实拥有一个当前权威、一个关系类型和明确修复方向；
- 所有派生产物都由权威重新生成，没有手工修补；
- 四类漂移均已被检测，或明确记录不适用的原因；
- 所有阻断项关闭，所有未知项保持可见且不会被误报为同步；
- ADR 冲突通过恢复实现或新增替代记录解决，历史记录未被静默重写；
- 发布证据绑定精确提交、workflow run、jobs、状态和线上 route；
- 未参与修复的人可以从台账与图中复述权威、方向、差异、修复和非证明边界。

## 7. 视觉设计合同

### 7.1 格式选择

格式判定为 `Draw.io + SVG`。决定性条件是：图包含超过七个主节点、至少三个视觉区域、长中文关系标签、需要区分生成/验证/观测三类关系，并且是本文核心教学资产。Mermaid 会依赖布局技巧；位图不能承担精确关系语义。

文件固定为：

- `diagrams/mod-13-authority-drift-loop.drawio`
- `static/img/diagrams/mod-13-authority-drift-loop.svg`
- MDX public path `/img/diagrams/mod-13-authority-drift-loop.svg`

图的单一教学判断是：不同事实可以拥有不同权威，生成、验证和观测把它们送入同一个漂移处置闭环，但修复必须回到对应权威来源。

### 7.2 语义与拓扑

图分为三个区域：

1. **权威事实源：** `代码事实`、`架构模型与图源`、`ADR 决策状态`、`部署与运行证据`；
2. **同步合同与检测：** `权威事实合同`、`生成器`、`验证器`、`观测器`；
3. **漂移处置与发布：** `漂移队列`、`责任人修复`、`重新验证`、`已验证发布证据`。

必需关系：

- 四个事实源以 `声明权威` 指向权威事实合同；
- 合同分别以 `生成`、`验证`、`观测` 指向三类检测节点；
- 三类检测节点以 `差异或未知` 指向漂移队列；
- 漂移队列以 `分级与分派` 指向责任人修复；
- 责任人修复以虚线反馈关系返回对应事实源，标签为 `修改权威或新增替代记录`；
- 修复后经过 `重新验证`，只有通过时进入 `已验证发布证据`；
- 发布证据不反向覆盖权威事实。

图例必须同时说明形状、线型和关系：实线箭头表示正向生成/检查流程，虚线箭头表示经裁决的修复反馈，点线边框表示实际观测或未知边界。颜色只作辅助，不得成为唯一语义。

### 7.3 几何与可访问性

SVG `viewBox="0 0 1200 900"`，不设置固定根 `width` 或 `height`。文章桌面宽度固定渲染为 `800px`，authoring-to-rendered scale 为 `800 / 1200 = 2/3`；移动端保持 50rem 图宽并在 wrapper 内局部滚动。

按最终渲染 CSS 像素执行以下门槛：

- 正文与边标签至少 `15px`，对应 authoring font size 至少 `22.5`；设计使用 `23` authoring units，约 `15.33px`；
- 类型或角色标签至少 `10px`，对应 authoring font size 至少 `15`；设计使用 `16` authoring units，约 `10.67px`；
- 节点水平 padding 至少 `16px`，对应 `24` authoring units；
- 节点垂直 padding 至少 `14px`，对应 `21` authoring units；
- 标题与类型 baseline 间距至少 `22px`，对应 `33` authoring units；设计使用至少 `36` authoring units，约 `24px`；
- 文字到底边至少 `14px`，对应 `21` authoring units；
- 边标签到 stroke 至少 `8px`，对应 `12` authoring units；
- 边标签到 arrow footprint 至少 `16px`，对应 `24` authoring units；
- 边标签到节点 visible stroke envelope 至少 `12px`，对应 `18` authoring units。

节点标题最多两行；长解释移到正文。连接器使用明确端口和正交路由，预留无连接器穿过的标签通道，opaque label background 不得擦除线段。Draw.io 与 SVG 使用同一 slug、节点、区域、关系方向和措辞。

SVG 必须含 `<title>`、`<desc>`、`role="img"` 和 `aria-labelledby`。MDX 使用可聚焦的 `.architecture-diagram-scroll` wrapper、目的导向 alt text 和 `handleHorizontalArrowKey`。

### 7.4 浏览器几何门槛

在 `/modeling/mod-13` 的 desktop `1440x1000` 与 mobile `390x844` 进行真实浏览器测量：

- desktop SVG rendered width 必须精确为 `800px`；
- 记录全部十二个语义节点的标题/类型 baseline、baseline gap 和可见文字到节点边距；
- 记录所有带文字关系的 label-to-stroke、label-to-arrow 和 label-to-node clearance；
- mobile 必须满足 wrapper `scrollWidth > clientWidth`，且 `document.documentElement.scrollWidth === clientWidth`；
- 键盘 focus indicator 可见，ArrowRight 后 wrapper `scrollLeft` 增加而 document width 不变；
- 两种视口均无裁切、连接器中断、标签碰撞、错误方向、伪文字或仅靠颜色区分的语义。

## 8. 知识关系合同

MOD-13 的 parent link 指向 `/modeling`。四个 dependency 与 adjacency 在正文全部有可见链接和明确交接边界：

- MOD-04 提供事实、推断、决定与未知的文档分层；MOD-13 补充持续同步与漂移治理；
- MOD-12 提供图的版本和九项审阅结果；MOD-13 负责在后续变化中保持权威与复查证据；
- MTH-03 提供 ADR 状态和替代关系；MOD-13 检查实现与有效决定是否漂移；
- MTH-06 提供从需求、决定、实现到运行反馈的演进闭环；MOD-13 给每次反馈设置权威与检测合同。

修改下列已发布页面，使关系互惠且正文可见：

- `content/modeling/mod-04-arc42-documentation-skeleton.mdx`：把“MOD-13 尚未发布”交接改成真实链接，`adjacent_topics` 增加 `MOD-13`；
- `content/modeling/mod-12-architecture-diagram-review.mdx`：把普通文字交接改成真实链接，`adjacent_topics` 增加 `MOD-13`；
- `content/methods/mth-03-adr-lifecycle.mdx`：在模型衔接处增加 MOD-13 回链与边界，`adjacent_topics` 增加 `MOD-13`；
- `content/methods/mth-06-requirements-to-evolution-loop.mdx`：在模型衔接处增加 MOD-13 回链与边界，`adjacent_topics` 增加 `MOD-13`。

MOD-13 related case 固定为 `/cases/kubernetes-reconciliation-loop`，正文说明 desired/actual reconciliation 的机制可用于理解观测与修复循环，但不能证明所有文档、图、ADR 都能由 controller 自动协调。

不使用 `data/topic-relations.json` override 修补已发布关系，不修改无关关系。

## 9. 来源治理

复用现有来源：

- `src-nygard-documenting-architecture-decisions-2011`：支持 ADR 的 context/decision/consequences、状态和 superseded 关系；不证明本地实现遵守 ADR。

新增三个外部来源身份：

1. `src-structurizr-dsl-model-as-code`
   - canonical：`https://docs.structurizr.com/dsl`
   - pinned transport：`https://raw.githubusercontent.com/structurizr/structurizr.github.io/d7f521eb9c6c55f7e9a4dcaf2a1122b844dbcb7f/dsl/index.md`
   - version：Structurizr documentation commit `d7f521eb9c6c55f7e9a4dcaf2a1122b844dbcb7f`，checked `2026-08-06`
   - author/org：Structurizr
   - kind/tier：official-doc / primary
   - license：MIT；evidence `https://github.com/structurizr/structurizr.github.io/blob/d7f521eb9c6c55f7e9a4dcaf2a1122b844dbcb7f/LICENSE`
   - boundary：支持文本 DSL 定义 C4 软件架构模型，以及 model/views 同一 workspace 的做法；不证明模型与代码、部署或运行状态自动一致。
2. `src-opengitops-principles-v1`
   - canonical：`https://opengitops.dev/`
   - pinned transport：`https://raw.githubusercontent.com/open-gitops/documents/d36cde829c6ef2c7e5cab662ab98a7173a591a49/PRINCIPLES.md`
   - version：GitOps Principles v1.0.0 peeled commit `d36cde829c6ef2c7e5cab662ab98a7173a591a49`，checked `2026-08-06`
   - author/org：OpenGitOps / CNCF GitOps Working Group
   - kind/tier：standard / primary
   - license：CC-BY-4.0 for content；evidence `https://github.com/open-gitops/documents/blob/d36cde829c6ef2c7e5cab662ab98a7173a591a49/LICENSE.md`
   - boundary：支持声明式、版本化不可变、自动拉取、持续观察与协调；只适用于 GitOps 管理的期望状态，不推广为所有架构知识的自动同步。
3. `src-github-deployment-history`
   - canonical：`https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history`
   - pinned transport：`https://raw.githubusercontent.com/github/docs/738593aef7b8d80183a376d5c692feefc0e8a5ff/content/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history.md`
   - version：GitHub Docs commit `738593aef7b8d80183a376d5c692feefc0e8a5ff`，checked `2026-08-06`
   - author/org：GitHub
   - kind/tier：official-doc / primary
   - license：CC-BY-4.0 for documentation；evidence `https://github.com/github/docs/blob/738593aef7b8d80183a376d5c692feefc0e8a5ff/LICENSE`
   - boundary：支持部署历史关联环境、提交、workflow logs、URL 与状态；不证明应用功能、性能、可靠性或全部运行健康。

新增一个本站原创图来源：

- `src-atlas-mod13-authority-drift-loop`
  - canonical：`atlas://illustrations/mod-13-authority-drift-loop`
  - transport：`/img/diagrams/mod-13-authority-drift-loop.svg`
  - source kind：`original-illustration`
  - roles：`illustration-rights`、`learning`
  - usage boundary：本站原创权威事实与漂移闭环教学图，不表示特定生产拓扑、团队或工具实现。

Stage A 预计从 490 增加到 494 个唯一来源：三个新增外部身份、一个原创图身份，ADR 来源复用。实现时必须由 source-ledger validator 证明 canonical identity、许可证、角色和 link-health cache；如果实际 canonical 去重结果与 494 不同，先修订设计与计数合同，不能静默改变目标。

正文仅使用原创中文综合与 facts-summary，不复制外部图、表、目录、长段落或工具界面。

## 10. 错误处理与恢复

### 10.1 检测器失败

命令失败、权限不足、环境不可达或观测超时都产生 `未知`，保存失败证据并阻断依赖该证据的关闭。不得把“没有得到差异”解释成“没有漂移”。恢复后重跑同一输入与版本的检测，再决定是否关闭。

### 10.2 权威冲突

如果两个来源都声称拥有同一事实，停止自动修复，拆分事实粒度或由责任类型明确当前权威。裁决前保留两个证据及冲突；裁决后修改权威合同，并按新方向重建派生产物。

### 10.3 派生产物漂移

generated manifest、SVG 或其他确定性派生产物发生差异时，修改权威输入或生成器并完整重建。禁止直接修改生成 JSON；Draw.io/SVG 语义变更必须同步修改成对资产并通过 pair validator。

### 10.4 ADR 漂移

有效 ADR 与实现冲突时只有两条恢复路径：恢复实现以符合仍有效的决定，或创建新的决定并把旧 ADR 标为 deprecated/superseded 且指向替代记录。不得删除或改写旧决定来伪造连续性。

### 10.5 部署与运行漂移

期望与实际不一致时保留真实部署或运行观测，不能让声明覆盖实际证据。修复可以回滚/前滚运行状态，或经批准修改期望状态；两者都需要新的部署身份和复核。workflow success 只说明指定 jobs 成功，不代替线上 route、控制台、响应式与语义检查。

## 11. 测试与发布门槛

### 11.1 TDD 与内容合同

先创建失败的 `tests/g008-batch11-content.test.mjs`，mutation-sensitive 锁定：

- 精确 front matter、H2 顺序、slug 和摘要边界；
- 九字段同步关系合同、四类漂移、六步闭环及顺序；
- 八行权威台账、四行漂移处置台账和限定状态词汇；
- 仓库案例与费用申报说明性场景的事实/推断边界；
- “未知不是 PASS”“生成物不能手改”“ADR 不证明实现”“部署成功不证明运行健康”等关键禁止项；
- Draw.io/SVG 路径、required labels、可访问 wrapper 与 keyboard handler；
- MOD-04、MOD-12、MTH-03、MTH-06 的精确 reciprocal adjacency 与可见 backlink；
- Kubernetes reconciliation case 的有限类比；
- 四个来源身份、正文 citations、license 和 anti-overclaim boundary；
- Stage A 投影为 `51 / 94 / 494`，MOD-13 仍 pending，G008 仍 current。

每个语义合同都必须有至少一个受控 mutation，证明断言会因删除、交换、弱化或越界表述而失败；禁止只检查关键词集合而不检查行、顺序、关系和非证明边界。

### 11.2 图对验证

使用 bundled validator 验证 Draw.io/SVG XML、配对、可访问性与 required labels。required labels 至少覆盖十二个节点、三个区域、六类关键关系和图例词汇。仓库测试另行锁定 SVG `viewBox`、无固定根宽高、语义同步、字号、区域与 wrapper 合同。

确定性 validator 不能替代浏览器几何测量。所有节点与带文字关系均进入 measured-node/edge 清单。

### 11.3 Stage A

Stage A 提交文章、图对、来源、关系、测试和生成产物；`docs/content-backlog.md` 中 MOD-13 保持 `[ ]`。预期投影：

- 51 completed topics；
- 94 content documents；
- 494 governed sources；
- durable stories `7 / 20`；
- current G008；
- next MOD-13。

运行 targeted tests、图对 validator、source/license/link validators、density analysis、`npm run typecheck`、`npm run build` 与 `npm run verify`。独立审查无 Critical/Important 后提交并推送，等待 exact Stage A head 的 GitHub Pages workflow、build job 与 deploy job `completed/success`。

浏览器 QA 固定检查八个 canonical routes：`/modeling/mod-13`、`/modeling/mod-04`、`/modeling/mod-12`、`/methods/mth-03`、`/methods/mth-06`、`/cases/kubernetes-reconciliation-loop`、`/modeling`、`/references`，另检查一个 SVG asset。desktop/mobile 共 16 个 page observations 与 2 个 asset observations，检查 HTTP、导航、来源、互惠关系、两张表、图、键盘滚动、几何、document overflow、console warnings/errors/page errors。原始 browser artifact 保存哈希并只追加，不覆盖失败尝试。

### 11.4 Stage B 与 G008 closure

Stage A 线上验证成功后创建发布复审与 deployment evidence test，记录 exact Stage A SHA、Pages run、build/deploy job、QA artifact hash、计数与结论。然后只在 Stage B：

- 将 MOD-13 checkbox 改为 `[x]`；
- 将持久故事进度改为 `8 / 20`；
- 将最近完成改为 G008；
- 将当前持久故事改为 G009；
- 将下一项改为 STY-00；
- 更新当前发布基线并保留 Batch10 及更早历史后缀逐字节不变；
- 生成最终 manifest、indexes 与 project status。

Stage B 预期投影：

- 52 completed topics；
- 94 content documents；
- 494 governed sources；
- durable stories `8 / 20`；
- recently completed G008；
- current G009；
- next STY-00。

最终运行 targeted tests、全部测试、typecheck、build、verify、独立复审、exact-head Pages 部署和线上 smoke。只有 Stage B 证据提交自身也成功部署后，才允许 checkpoint G008。不得提前开始 STY-00。

## 12. 工作区与实施边界

实施工作区固定为 `/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch11`，分支 `codex/g008-modeling-batch11`，基线 `a381f24c637141eea72e979f374fc635d70d1a41`。使用 Node `26.5.0` 与 npm `11.17.0`，不使用 Node 20。根检出中的 `.codex/config.toml` 是受保护的未跟踪文件，不纳入本批次，也不修改根检出状态。

历史 review、deployment tests、设计、计划与发布证据不可为适配新计数而重写；新测试必须只约束 Batch11 当前段并保留历史后缀。生成文件通过仓库命令更新，不手工编辑。

实施按 TDD、小提交、逐任务审查和两阶段发布执行。任何外部来源 transport、许可证、canonical identity、计数、关系或几何门槛与本设计不一致时，先停在未完成阶段，修订设计并重新获批，不以实现便利静默改变合同。
