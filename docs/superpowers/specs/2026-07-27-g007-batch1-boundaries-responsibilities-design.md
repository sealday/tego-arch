# G007 Batch 1：边界、责任与依赖原则设计

**日期：** 2026-07-27  
**状态：** 已确认，待实施  
**范围：** 审校 PR-01，新增 PR-02 至 PR-05；作为一个原子批次验证、审查和发布。

## 目标

建立 G007 架构设计原则体系的第一组知识主干，使读者能够从变化隔离、责任分配、依赖方向和复用机制四个角度判断模块边界，而不是只记忆访问修饰符或 SOLID 缩写。

本批次交付五篇可独立阅读且相互连接的原则页：

- PR-01 信息隐藏与封装：保留现有正文并审校来源、关系和测试覆盖。
- PR-02 高内聚与低耦合：区分变化耦合、运行时耦合、数据耦合和团队耦合。
- PR-03 单一职责与关注点分离：从“一个类只做一件事”提升到变化原因和责任边界。
- PR-04 依赖倒置、控制反转与依赖注入：分别解释原则、控制结构和实现技术。
- PR-05 组合优于继承：覆盖多态、共享实现、状态耦合和替换成本。

PR-06 至 PR-17 不在本批次实现。G007 在本批次结束后仍保持进行中。

## 内容架构

### 文件边界

新增四个独立内容单元：

- `content/principles/pr-02-cohesion-coupling.mdx`
- `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx`
- `content/principles/pr-04-dip-ioc-dependency-injection.mdx`
- `content/principles/pr-05-composition-over-inheritance.mdx`

审校现有单元：

- `content/principles/pr-01-information-hiding.mdx`

PR-01 只补齐与新页面的关系、来源边界、事实标签和必要的案例/决策表达，不无必要重写已有正文。

### 统一文章契约

五篇页面沿用仓库现有 `principle` 内容契约，并严格使用以下 H2 顺序：

1. 学习问题
2. 要保护的性质
3. 冲突与适用上下文
4. 机制
5. 误用与反原则
6. 适用尺度
7. 相邻原则
8. 说明性场景
9. 来源

每篇还必须满足：

- 包含 3–5 个学习问题；
- 至少使用两个来源，其中至少一个是一手论文、原作者、标准或官方材料；
- 明确区分来源事实、基于证据的推断和本站分析；
- 包含至少一个反例、失败模式或不适用条件；
- 包含一个原创 Mermaid 图、决策表或结构化说明性场景；
- 即使图不可渲染，正文仍完整表达判断；
- 可见链接连接原则目录、至少一个相邻原则和至少一个现有案例；
- 不产生指向未发布 PR-06 至 PR-10 的虚假站内链接。

## 主题关系

本批次构建以下原则簇：

```text
PR-01 信息隐藏与封装
 ├─ PR-02 高内聚与低耦合
 ├─ PR-03 单一职责与关注点分离
 └─ PR-04 依赖倒置、控制反转与依赖注入

PR-05 组合优于继承
 ├─ PR-02 高内聚与低耦合
 ├─ PR-03 单一职责与关注点分离
 └─ PR-04 依赖倒置、控制反转与依赖注入
```

关系必须在 front matter、生成 manifest 和正文可见链接中一致，并满足仓库的反向边关系校验。五篇继续连接已发布的 `STY-00` 和适合的真实案例。后续原则只可保留为 backlog 主题，不登记成要求正文点击的已发布相邻主题。

## 各页判断边界

### PR-01：信息隐藏与封装

保护可变化设计决策的所有权。强调 `private`、getter 或 DTO 包装并不自动构成信息隐藏；验收标准是设计决策变化时边界外需要同步修改的范围。

保留现有原创“决策泄漏穿过模块边界”图，并补充与 PR-02、PR-03、PR-04 的关系。

### PR-02：高内聚与低耦合

不把内聚和耦合压缩为单个分数。页面分别检查：

- 变化耦合：同一业务变化会触达哪些模块；
- 运行时耦合：同步调用、共同可用性和故障传播；
- 数据耦合：共享 schema、共享状态和语义泄漏；
- 团队耦合：交付是否需要跨团队同步。

原创表达采用四维耦合决策表或传播图，显示局部便利可能如何换取更大的变化或故障范围。

### PR-03：单一职责与关注点分离

把职责定义为面向变化原因和责任主体的边界，不使用“一个类只能做一件事”作为充分条件。区分：

- SRP 对责任所有权和变化原因的判断；
- SoC 对问题维度的分离；
- 仅按技术层、方法数量或文件大小拆分的表面分离。

原创表达采用变化原因矩阵，比较同一模块面对不同责任主体变化时的传播范围。

### PR-04：依赖倒置、控制反转与依赖注入

三者必须分开定义：

- DIP 是高层策略与低层细节之间的依赖方向原则；
- IoC 是控制权从业务代码转移到框架、容器或调用者的控制结构；
- DI 是向对象或模块提供依赖的一种实现技术。

页面必须说明：使用 DI 容器不等于符合 DIP；IoC 也不必依赖容器。原创图同时展示源代码依赖、运行时控制和对象装配，防止三条边混为一谈。

### PR-05：组合优于继承

不否定继承或多态。页面比较：

- 继承用于稳定的可替换类型关系；
- 组合用于独立变化的能力和策略；
- 继承共享实现时产生的受保护状态、初始化顺序和脆弱基类耦合；
- 组合产生的装配、转发和对象数量成本。

原创表达对比继承树与组合对象图，并以变化传播和替换成本作为选择依据。

## 来源策略

每篇至少使用两类来源，并以原始材料或官方资料为主：

| 页面 | 主要来源方向 | 交叉核验方向 |
| --- | --- | --- |
| PR-01 | Parnas 的模块分解/信息隐藏论文 | SEI 架构原则与实践 |
| PR-02 | Constantine/Yourdon 的内聚与耦合材料 | SEI 或可核查的模块化设计资料 |
| PR-03 | Parnas 与 Separation of Concerns 原始讨论 | Martin 的职责边界解释，仅作二手交叉材料 |
| PR-04 | DIP、IoC、DI 的原作者或官方技术资料 | Martin Fowler 的 IoC/DI 文章 |
| PR-05 | 设计模式原始来源 | 官方语言或框架关于多态、继承与组合的材料 |

每条来源登记作者/机构、来源类型、日期或版本、核查日期、使用边界、引用文档和许可证判断。聚合目录不能作为结论的唯一依据；不复制书籍章节结构、外站分类或受版权保护图示。

治理文件为：

- `data/source-ledger.json`
- `data/source-link-health.json`

只登记本批实际引用的来源和 transport。

## 测试设计

新增 `tests/g007-batch1-content.test.mjs`，直接读取真实内容、生成 manifest、来源账本和关系数据。测试不得以 mock 代替真实内容契约。

测试覆盖：

1. PR-01 至 PR-05 的文件、slug、`topic_id`、`content_type`、优先级和 reviewed 状态；
2. 九个 H2 的顺序与 3–5 个学习问题；
3. 每篇至少两个受治理来源及至少一个 primary source；
4. 每篇原创 Mermaid、决策表或结构化表达；
5. 事实、推断、本站分析、边界、反例和不适用条件；
6. PR-02 至 PR-05 各自的关键概念纠错；
7. front matter、manifest、关系数据和正文可见链接的一致性；
8. 原则目录能发现五个已发布页面；
9. 不存在指向未发布原则的正文链接；
10. PR-01 现有内容与案例入口未被破坏。

测试必须先因 PR-02 至 PR-05 缺失而失败，而非因测试语法、路径或 fixture 错误失败。实现后运行定向测试和完整仓库验证。

## 生成与状态管理

生成器负责更新实际发生漂移的产物，包括：

- `src/generated/topic-manifest.json`
- `src/generated/topic-indexes.json`
- `data/topic-relations.json`

不得手工编辑生成内容。若 manifest 与 backlog 不一致，修复 canonical 内容、backlog 或生成逻辑输入。

`docs/content-backlog.md` 只在 Stage A 已合并到 `main`、GitHub Pages 成功且线上检查通过后将 PR-01 至 PR-05 标为完成。G007 不在本批次 checkpoint。

## 发布流程

### 设计与计划

先提交本设计，再编写详细实施计划。

### RED

新增定向测试并运行，确认因四篇新文章不存在而失败。

### Stage A

实现文章、来源、关系和生成产物，运行：

```bash
bun run generate:content
bun test tests/g007-batch1-content.test.mjs
bun run validate:content
bun run check:content
bun run verify
git diff --check
```

通过后提交并推送实现，快进合并到 `main`，等待 GitHub Pages。

### 线上检查

检查以下 route 返回 HTTP 200：

- `/principles`
- `/principles/pr-01`
- `/principles/pr-02`
- `/principles/pr-03`
- `/principles/pr-04`
- `/principles/pr-05`

同时检查生产 CSS/JS、桌面与移动宽度、Mermaid/决策表可读性、五篇页面的双向点击、来源卡和不存在未发布原则链接。

### Stage B

部署证据完整后新增 `docs/reviews/g007-batch1.md`，更新 backlog 和状态投影；再次运行：

```bash
bun run generate:content
bun run verify
git diff --check
```

然后提交并推送 closure。Stage B 的 Pages 部署也必须成功，才算本批次持久关闭。

## 提交边界

计划采用四个可审查提交：

1. `docs: plan g007 boundary principles`：设计和实施计划；
2. `test: define g007 boundary principle contracts`：可确认 RED 的测试；
3. `feat: publish g007 boundary principles`：Stage A 内容、来源、关系和生成产物；
4. `docs: close g007 boundary principles batch`：Stage B 审查与部署证据。

测试 fixture 只有在固定数量或主题集合因新增页面真实变化时才调整；不做无关重构。

## 成功标准

本批次成功必须同时满足：

- PR-01 审校完成，PR-02 至 PR-05 发布；
- 五篇满足原则页结构、来源、原创表达、反例和关系契约；
- 定向测试经历正确 RED 并转为 GREEN；
- `bun run verify` 和 `git diff --check` 通过；
- 独立内容、事实、版权和渲染审查通过；
- Stage A exact SHA 的 GitHub Pages run 成功；
- 六条目标 route 与必要静态资源线上检查通过；
- Stage B 将 PR-01 至 PR-05 以 commit、Pages run 和 live route 证据关闭；
- G007 保持进行中，下一批为 PR-06 至 PR-08。
