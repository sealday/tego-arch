# G008 Batch 8：MOD-10 Domain Storytelling 设计

日期：2026-08-04

状态：已批准

目标分支：`codex/g008-modeling-batch8`

基线：`fca35e43813c3eca4db3e9fdc803c1cb0b154bba`

## 1. 目标与范围

本批次只发布并关闭 `MOD-10 P1｜Domain Storytelling`。文章沿用费用申报系统教学场景，用一张 digitalized、as-is、典型路径 Domain Story 展示领域专家如何逐句讲述，主持人如何用 actor、work object、activity、sequence number 和 annotation 即时建模，并用故事句子表与四模型比较表完成复述和证据边界检查。

`MOD-02` 的系统边界与名称是本批次权威：本地系统固定称“费用申报系统”，外部支付能力固定称“银行支付服务”。`MOD-08` 的支付结果证据边界继续成立：本地请求、超时或人工登记不能代替银行支付服务回执或查询结果。`MOD-09` 提供协作式问题空间探索的直接比较对象，但 MOD-10 不把 Domain Storytelling 与 EventStorming 解释为可相互替代或存在严格元素映射的方法。

本批次不发布 `MOD-11..13`，不穷举异常和流程分支，不从图中推导 API、事务、同步或异步协议、服务边界、数据所有权、组织 owner、部署拓扑或正式 Bounded Context。Stage A 发布 MOD-10 但保持 pending；Stage B 只将 MOD-10 改为 complete，G008 保持 current，下一项为 MOD-11。

## 2. 已选方案与备选方案

### 已选：单一 digitalized as-is 典型故事

主产物只描述从财务人员查看待支付费用，到费用申报系统取得银行支付回执并向财务人员展示已记录结果的典型路径。软件系统作为 actor 出现在故事中，使文章能直接承接 MOD-02 的既有边界和权威名称；重要变体“支付结果仍未知”只用 annotation 保留，并明确要求另建 Domain Story。

该方案同时保留三类证据：

1. 一张原创 Domain Story Mermaid 提供共同可见的叙事图；
2. 一张故事句子表提供逐句语法与可访问文本等价物；
3. 一张比较表解释 Domain Storytelling、流程图、用例和 EventStorming 的目的与非证明边界。

### 未选：pure 与 digitalized 双故事

先画不含软件的 pure story，再画包含系统 actor 的 digitalized story，可以突出数字化如何改变协作，但会把文章重心从方法入门扩展为双模型差异分析，并显著增加图形、交互和对照验收范围。

### 未选：同一场景四模型并列

分别绘制 Domain Story、流程图、用例和 EventStorming 可以形成直观对照，但容易把文章变成符号翻译练习，并暗示不同方法之间存在并不存在的一一映射。本文只完整绘制 Domain Story，其余三种模型通过受限比较表与已发布文章衔接。

## 3. 教学场景与权威边界

### 3.1 场景连续性

教学范围从“财务复核已完成”开始，到财务人员看到由银行支付服务权威回执支撑的支付结果记录结束。故事包含三类 actor：

- 财务人员；
- 费用申报系统；
- 银行支付服务。

故事使用四类 work object：

- 待支付费用；
- 支付请求；
- 银行支付回执；
- 支付结果记录。

图中的业务动作、工作对象、顺序和协作均为本站原创教学假设，不是生产系统事实。actor 在故事中复用，不因每个活动重复创建；同一种业务对象在不同活动中的呈现可以分开表达，以便保留载体或状态变化，但不得因此虚构新的数据 owner 或存储边界。

### 3.2 Scope 合同

本故事固定为：

- **粒度**：一个可从头复述的窄范围支付协作片段；
- **时间视角**：as-is 教学故事，不承诺现有生产实现；
- **domain purity**：digitalized，允许人物与软件系统共同作为 actor；
- **路径范围**：默认、典型或 80% case；
- **变体策略**：小差异写 annotation，重要替代情形另建故事。

“支付结果仍未知”不得塞进六步典型路径，也不得改写成“支付已失败”。正文只把它记录为 annotation：如果费用申报系统未取得可核验的银行回执，则停止典型故事，并以 MOD-08 的未知结果语义另建异常故事。

## 4. 方法语法与非证明边界

### 4.1 最小语法

- `actor` 是主动参与者，可以是人、人员群体或软件系统。
- `work object` 是被创建、处理或交换的业务对象、文档、实物、数字对象或信息。
- `activity` 使用动词表达 actor 对 work object 做什么以及与谁协作。
- `sequence number` 只排序本故事中的句子，不证明运行时调用、同步协议或完整时间语义。
- `annotation` 保存假设、术语、差异、错误、可选活动或待验证问题，不是形式化分支或异常语法。
- `group` 可以帮助标记重复、可选、地点、组织边界或子域，但本文主图不使用 group，避免过早增加边界暗示。

每个句子都应能被读成“谁，对什么 work object，做了什么，与谁协作”。模型全程对参与者可见，主持人逐句朗读，领域专家即时纠正遗漏、术语和顺序。

### 4.2 非证明规则

文章必须逐项锁定以下边界：

- actor 不等于团队、长期 owner、服务或部署单元；
- software actor 不证明真实 API、契约、协议、SLA 或安全责任；
- work object 不等于数据库表、聚合、数据 owner 或权威存储；
- activity arrow 不等于同步调用、消息、事务或网络连接；
- sequence number 不等于完整时序、并发语义或性能保证；
- annotation 不等于已经实现的分支、错误处理或正式需求；
- 一张典型 Domain Story 不证明全部异常、循环、合规路径或流程完备性；
- 一次 workshop 不单独确认正式系统边界、Bounded Context 或组织结构。

## 5. 内容合同

MOD-10 使用以下九个且仅以下九个 H2，顺序固定：

1. 学习问题
2. 建模目标与输入
3. 元素选择与证据边界
4. 核心产物
5. 完成判断
6. 常见失败
7. 与其他模型的衔接
8. 完整演练
9. 来源

“学习问题”提出三至五个可回答问题，至少覆盖 scope 选择、最小语法、workshop 协作、典型路径与变体分离，以及与流程图、用例和 EventStorming 的边界。“完整演练”必须从 scope 选择开始，逐句建模、朗读校正、记录 annotation、从头复述并确定后续故事，不能只重复图中标签。

### 5.1 建模目标与输入

workshop 开始前记录：

- 一个具体而有业务意义的支付协作场景；
- 粒度、as-is/to-be 与 pure/digitalized 三项 scope 决定；
- 真正执行日常工作的领域专家、IT 专家和主持人；
- MOD-02 的权威系统边界与“银行支付服务”名称；
- MOD-08 的外部支付结果证据边界；
- 可用的业务术语、流程、政策、事故和权威记录；
- 已知分歧、假设和不能在本次 workshop 决定的事项；
- 典型路径结束条件和重要变体的另建故事规则。

已有流程图、用例、系统图和 EventStorming 产物只能作为对话输入，不能预先决定 Domain Story 的句子、顺序或边界。

### 5.2 Workshop 步骤

1. 主持人说明场景、scope、权威名称和非目标。
2. 领域专家从一个具体实例开始，用自己的领域语言讲“接下来发生什么”。
3. 主持人逐句画出 actor、work object、activity 和 sequence number，并当场朗读。
4. 参与者即时纠正术语、遗漏、顺序和工作对象，不用抽象词掩盖真实分歧。
5. 先完成典型路径；小差异写 annotation，重要替代情形排入新的 Domain Story。
6. 全体从第一句开始复述，检查是否明显错误、遗漏或无法被领域专家认可。
7. 复查 annotations，为每个分歧或变体确定澄清方式、后续故事或其他模型。

完成条件不是达到抽象的“100% 一致”，而是得到一张可共同复述、无已知明显错误、保留真实分歧并足以支持下一步工作的故事。

## 6. 核心产物与视觉设计

本文只使用仓库现有 Mermaid 和 Markdown 可访问包装，不创建 Draw.io、SVG、raster 资产或第三方图标，不复制 Egon 文件、官方示例、书中案例、图标集合、模板或布局。

### 6.1 Domain Story Mermaid

主图位于一个可聚焦的 `diagram-wrapper` 中，使用本站原创简单形状和文字区分 actor 与 work object。图中固定出现三个 actor、四类 work object 和六个按顺序编号的 activity。六个故事句子为：

1. 费用申报系统向财务人员展示待支付费用。
2. 财务人员向费用申报系统提交支付请求。
3. 费用申报系统向银行支付服务传递支付请求。
4. 银行支付服务向费用申报系统提供银行支付回执。
5. 费用申报系统依据银行支付回执创建支付结果记录。
6. 费用申报系统向财务人员展示支付结果记录。

第 4 句必须明确银行支付回执是支付结果的外部权威证据；第 5 句只表示教学故事中的本地记录动作，不把本地记录升级为独立外部事实。图前说明观察范围，图后列出完整非证明边界。

Mermaid 只表达 Domain Story 的教学语法，不使用 sequence diagram、BPMN 或调用链外观，以免暗示形式化时序或运行时协议。actor 节点只定义一次并在多条 activity 中复用。

### 6.2 故事句子表

第一张可横向滚动表固定六行，每行包含：

- 序号；
- 主体 actor；
- activity；
- work object；
- 协作 actor；
- 证据说明。

表格是 Mermaid 的可访问文本等价物，也是主持人逐句朗读和参与者复述时的检查台账。六行必须与图中的 actor、对象、动作和编号逐项一致，测试不得只做关键词计数。

### 6.3 四模型比较表

第二张可横向滚动表固定四行：Domain Storytelling、流程图、用例、EventStorming。列固定为：

- 主要问题；
- 典型输入；
- 核心产物；
- 适合发现什么；
- 明确不证明什么。

比较边界固定为：

- Domain Storytelling 从一个具体典型场景建立共同语言和协作理解，不证明完整分支或系统设计；
- 流程图强调活动、判断、分支和路径，不自动证明参与者对领域语言已有共同理解；
- 用例围绕 actor 目标、系统交互、前后条件及主/替代流程组织需求，不与 actor、work object 或 activity 一一对应；
- EventStorming 从过去时领域事件、热点和未知项展开探索，可与 Domain Storytelling 组合，但二者不等价且没有严格元素转换规则。

两张表均使用现有可聚焦 mapping wrapper，支持容器内横向 overflow 与 ArrowLeft/ArrowRight 键盘滚动。桌面与移动端不得出现 document overflow。

## 7. 完成判断、失败模式与恢复

### 7.1 完成判断

一次教学 workshop 只有在以下条件全部满足时才可结束：

- 场景与三项 scope 决定可见；
- 真正执行日常工作的领域专家参与，并使用其领域语言；
- 三个 actor、四类 work object 与六个 activity 可以逐句朗读；
- 图与句子表完全一致；
- 参与者能从头复述故事，没有已知明显遗漏或错误；
- “支付结果仍未知”等重要变体保留为 annotation，并明确另建故事；
- 分歧和未知项没有为了图形整洁而被强行消除；
- 所有人理解故事是当前共同理解，不是生产事实、完整需求或架构批准；
- 与 MOD-01、MOD-02、MOD-08、MOD-09 和后续 MOD-11 的交接边界清楚。

### 7.2 常见失败与恢复

- **从抽象流程开始**：改用一个具体费用支付实例，让领域专家逐句讲述。
- **由只听说业务的人代替领域专家**：邀请真正执行日常工作的跨部门参与者。
- **先画所有分支**：先完成典型路径，小差异写 annotation，重要变体另建故事。
- **把系统 actor 当成接口文档**：恢复为业务协作视图，将 API、协议和 SLA 交给契约或运行模型。
- **把 work object 当成数据库表**：使用业务语言重新命名，并把持久化决定交给数据模型。
- **把序号当成调用时序**：强调序号只服务本故事复述，运行顺序由行为或执行模型验证。
- **为了共识删除分歧**：保留 annotation，明确谁补证据以及何时另开故事。
- **把故事直接命名为 Context**：仅记录边界线索，交由 MOD-11 或等价架构活动验证。

## 8. 与其他模型的关系

MOD-10 metadata 固定为：

- `depends_on: [MOD-01, MOD-02, MOD-09]`
- `adjacent_topics: [MOD-08, MOD-09]`
- `related_cases: [/cases/temporal-saga-durable-execution]`
- `related_questions: []`

这是对已批准 metadata 的最小修订：既有知识内容合同要求 `related_cases` 或 `related_questions` 至少保留一个 terminal relation，而发布关系清单要求 adjacency 在 manifest 中互为 reciprocal。选用已存在的 Temporal Saga 案例只作为超时、重试、补偿与人工收敛的受限后续检验，不为 Domain Story 增加正式执行语义；将 MOD-09 加入 `adjacent_topics` 只表达两种协作方法的双向衔接，不改变二者不可替代且没有严格元素映射的边界。

发布时必须添加并测试以下可见关系：

- MOD-10 链接到 `/modeling`、MOD-01、MOD-02、MOD-08、MOD-09 和现有 Temporal Saga terminal case；
- MOD-08 新增 MOD-10 reciprocal adjacency，并说明状态机适合细化重要变体的状态、终态和恢复语义；
- MOD-09 新增 MOD-10 reciprocal adjacency，并说明 EventStorming 与 Domain Storytelling 可以组合，但不能相互替代；
- MOD-01 提供模型选择和问题空间非证明边界；
- MOD-02 提供系统范围及权威名称；
- MOD-11 只作为下一步边界验证方向以普通文字出现，在其发布前不建立可操作文章链接。

不使用 `data/topic-relations.json` override 修补关系，不为 MOD-01 或 MOD-02 增加无必要的 reciprocal adjacency。

## 9. 来源治理

本批次新增四个 Domain Storytelling 官方来源身份，检索日期统一为 2026-08-04：

1. `https://domainstorytelling.org/quick-start-guide` — 核心语法、scope、典型路径、annotation、参与者、主持方式与完成检查；`official / primary`；MOD-10 唯一 `manifest_primary: true`。
2. `https://domainstorytelling.org/` — 方法目的、共同语言、活动、工作对象、边界发现和需求衔接的官方概览；`official / primary`；不作为 manifest primary。
3. `https://domainstorytelling.org/requirements` — 从 Domain Story 衔接需求和 user story 的范围，以及场景到需求之间仍需桥接的限制；`official / primary`；不作为 manifest primary。
4. `https://domainstorytelling.org/articles/how-to-model-loops/` — 重复活动、具体实例和 annotation/group 的表达边界；`official / primary`；不作为 manifest primary。

四个页面均按 living/unversioned 页面治理，`source_version` 记录“retrieved 2026-08-04”，不得将官网整体更新时间、书籍年份或 Egon 工具版本写成页面版本。官网页脚的 CC BY 4.0 只适用于其明确许可范围；`license_scope` 必须排除商标、第三方图标、书籍、外链作品、工具代码和另有声明的媒体。

账本按 `CC-BY-4.0` 与现有 `adapt-with-attribution` 治理规则登记，但 MOD-10 的实际引用只使用 `facts-summary`，不复制或改编文字、图、模板、图标、案例或布局。文章的一张 Mermaid、两张表、费用故事、六个句子、annotations 和比较结论均为本站原创教学内容。

设计研究曾考虑 dpunkt 2024 年第 2 版官方简介 PDF，但 2026-08-04 的重复 live 请求出现 DNS 解析失败，因此不把该 PDF 纳入稳定来源集合。设计改用可稳定访问的官方 Requirements 页面，避免手写或掩盖链接健康证据。

与用例和 EventStorming 的比较通过已发布 MOD-07、MOD-09 及其既有受治理来源衔接，不新增或重复登记来源身份。Stage A 新增一篇内容文档和四个治理来源，预期投影为 `48 / 91 / 485`；Stage B 只关闭 MOD-10，来源和文档数保持不变，预期投影为 `49 / 91 / 485`。持久故事保持 `7 / 20`，G008 保持 current，MOD-11 为 next。

## 10. 测试与发布门槛

### 10.1 Mutation-sensitive 内容合同

新增 Batch 8 内容测试，至少锁定：

- MOD-10 metadata、九个 H2 及精确顺序；
- 一张且仅一张 Mermaid、两张且仅两张 Markdown 表；
- 三个 actor、四类 work object、六个有序 activity 与完整故事句子；
- actor 只定义一次并在关系中复用；
- 故事句子表的六个字段、六行及其与 Mermaid 的逐项一致性；
- 四模型比较表的五个字段、四行和每种模型的非证明边界；
- annotation 中“支付结果仍未知”的独立故事规则；
- 八项非证明规则、workshop 输入、七步流程和完成条件；
- MOD-08、MOD-09 reciprocal adjacency，MOD-11 零操作链接；
- 四个精确来源身份、唯一 manifest primary、CC BY 4.0 范围、facts-summary 与 living-page 版本边界；
- Stage A `48 / 91 / 485`、MOD-10 published/pending、G008 current、durable `7 / 20` 和 next MOD-10。

Mutation 测试必须分别删除、交换或替换 H2、actor、work object、activity 编号、表字段、表行、非证明规则、annotation、来源、关系和 reciprocal link，证明合同拒绝结构或语义漂移，而不是只检查关键词存在。

### 10.2 Stage A

Stage A 发布正文、四个来源、双向关系、内容测试和审查记录，但保持 MOD-10 backlog checkbox 未完成。每个 Node/npm 命令固定使用 `PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH`。提交前运行 targeted tests、`npm run verify`、`git diff --check`，并完成独立内容、事实、版权、可访问性和测试审查。

Stage A 推送后，等待 exact-head GitHub Pages run `completed/success`，再执行生产 QA。生产 QA 使用 desktop `1440×1000` 与 mobile `390×844`，覆盖以下八条 canonical routes：

1. `/`
2. `/modeling`
3. `/modeling/mod-01`
4. `/modeling/mod-02`
5. `/modeling/mod-08`
6. `/modeling/mod-09`
7. `/modeling/mod-10`
8. `/references`

QA 必须验证：

- Mermaid `1/1`，三个 actor、四类 work object、六个 activity 标签可见；
- 表格 `2/2`，数据行分别为 `6 + 4`；
- diagram 和 table wrapper 可聚焦，容器内 overflow 与 ArrowLeft/ArrowRight 可用；
- document overflow 为零；
- 来源激活 `8/8`：四个来源乘两个视口；
- 关系激活 `14/14`：MOD-10 的 `/modeling` 加四个主题关系乘两个视口，再加 MOD-08、MOD-09 reciprocal backlink 各乘两个视口；
- closed-world MOD-11 operator target 为零；
- console warnings、console errors、page errors 均为零。

保存原始 JSON artifact 和 SHA-256；截图只作辅助，不代替结构化交互证据。若本地 Node/Docusaurus 仍出现既有 `localStorage` ExperimentalWarning，必须单独记录为环境噪声，并以生产浏览器 `0/0/0` 为运行时门槛，不得删除或掩盖警告。

### 10.3 Stage B

只有 Stage A exact-head 部署和全部生产 QA 通过后才关闭 MOD-10。Stage B 必须：

- 创建 `docs/reviews/g008-batch8.md`，固定 Stage A SHA、Pages run、测试总数、八条路由、双视口、视觉、交互、来源、关系、MOD-11 零操作和诊断证据；
- 固定 QA artifact 路径与 SHA-256；
- 将 MOD-10 backlog checkbox 改为完成，保留 Batch 7 及更早的 SHA、run、计数、观察和历史段落；
- 将状态投影更新为 `49 / 91 / 485`、持久故事 `7 / 20`、current G008、next MOD-11；
- 再次运行 targeted tests、`npm run verify` 和独立终审；
- 快进本地 main，推送 origin/main，并验证 final SHA 的 exact-head Pages run 与 canonical production smoke；
- 使功能分支、origin feature、本地 main 和 origin/main 最终解析到同一 SHA。

## 11. 工作区、错误处理与停止条件

- 所有设计与实现只在 `/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch8` 的 `codex/g008-modeling-batch8` 分支进行。
- 主工作区原有未跟踪 `.codex/config.toml` 必须保持未修改、未暂存、未提交。
- 不新增 npm 依赖、图片文件、第三方图标或关系 override。
- 来源刷新失败时保留真实失败历史，使用现有 checker 的正式机制重试，不手写健康成功记录。
- 关系校验失败时修正 metadata 或 reciprocal content，不增加 override。
- Mermaid、表格、移动布局、键盘滚动或真实点击不满足门槛时返回内容任务修复并重新部署 Stage A。
- Pages run 的 `headSha` 与目标提交不一致时不得使用该 run 作为证据。
- 任何 Important 或 Critical 独立审查发现必须修复并重新验证。
- final SHA 的完整 verify、exact-head Pages success、八条 canonical routes、双视口 QA、Stage B closure 和四个 Git 引用同步全部成立后，本批次完成。
- 完成后保留工作区和分支，不主动清理。

## 12. 设计批准记录

用户已依次批准：

- 沿用费用申报场景，并以 MOD-02 的边界和“银行支付服务”为权威；
- 采用单一 digitalized as-is 典型故事；
- 教学目标、非目标与重要变体范围；
- 一张 Mermaid、故事句子表和四模型比较表的产物合同；
- 四个官方来源与 Stage A/Stage B 投影；
- 用稳定的官方 Requirements 页面替换 DNS 失败的 dpunkt PDF；
- Batch 8 工作树、Node 26.5.0、测试先行和发布闭环；
- 将遗漏父级 `/modeling` 导航后的生产关系激活数修正为 `14/14`。
