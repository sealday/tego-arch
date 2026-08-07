# 术语位图视觉 QA

## 决策与范围

- 格式决策：`位图`。
- 决策理由：该资产是首页的概念性路线总结，本次只编辑既有位图中的一个短标签；保留原有手绘质感与主题变体比改造成确定性图表更重要。
- 视觉任务：架构判断路径的概念性总览。
- 读者应保留的判断：架构判断从需求和约束出发，经过建模、模式、治理、案例与复盘逐步形成。
- 精确表达仍由首页标题、说明和替代文本承担；位图不是唯一的事实表达。

## 最终提示词

为满足报告不得复述被替换旧词的合同，下面以“原标签”代称输入图中的待替换文字；工具执行时使用输入图上的原文。

```text
Use case: text-localization
Asset type: Tego Arch homepage judgment-path infographic
Primary request: Replace only the original label with the exact Chinese label “需求与约束”.
Input images: Image 1: edit target.
Text (verbatim): “需求与约束”
Constraints: preserve every other label verbatim; preserve 1672×941 composition, node positions, arrows, hand-drawn texture, spacing, background, edge color, and theme palette; change no other pixels except those needed around the replaced label.
Closed labels (verbatim, no additional text): “架构判断的形成路径”; “需求与约束”; “建模与方法”; “模式与边界”; “治理与案例”; “学习与复盘”.
Avoid: new labels, English, watermark, signature, logo, status marks, changed topology, changed palette.
```

## 输入角色与输出

| 主题 | 输入角色 | 输出路径 | 尺寸 | 背景边缘 RGB | 结论 |
| --- | --- | --- | --- | --- | --- |
| 浅色 | 独立 edit target | `static/img/illustrations/tego-arch-judgment-path-light.png` | `1672×941` | `rgb(247, 242, 232)` | 浅色 PASS |
| 深色 | 独立 edit target | `static/img/illustrations/tego-arch-judgment-path-dark.png` | `1672×941` | `rgb(31, 29, 26)` | 深色 PASS |

两张输入图都先以原始分辨率查看，再分别调用 built-in imagegen；没有把任一主题图仅作为另一张图的风格参考。最终发布文件仅合入 imagegen 生成的目标标签区域，从而保留原图其余区域和纯色边缘合同。

## 闭集文字核对

1. 架构判断的形成路径
2. 需求与约束
3. 建模与方法
4. 模式与边界
5. 治理与案例
6. 学习与复盘

检查结果：六个标签逐字匹配；待替换文字不再出现；没有额外英文或其他新增文字。

## 视觉检查

| 检查项 | 浅色 | 深色 |
| --- | --- | --- |
| 原始分辨率检查 | PASS | PASS |
| 约 720 px 文章宽度可读性 | PASS | PASS |
| 手机宽度缩放后的阅读顺序 | PASS | PASS |
| 标题、五个节点与标签层级 | 未变 | 未变 |
| 节点位置、连接线、箭头与拓扑 | 未变 | 未变 |
| 手绘纹理、留白、版式与主题配色 | 未变 | 未变 |
| 无水印、签名、logo、状态标记 | PASS | PASS |

结论：桌面宽度下标题和全部标签清晰；约 720 px 宽度下五步路径及标签仍可直接辨认；继续缩放到手机容器时，图像按既有横向整体缩放，没有裁切、溢出或阅读顺序变化。浅色 PASS，深色 PASS。

## 仓库集成

- 首页已通过 `/img/illustrations/tego-arch-judgment-path-light.png` 与 `/img/illustrations/tego-arch-judgment-path-dark.png` 引用这两个稳定路径。
- 本任务只做既有原创资产的文字本地化；`data/source-ledger.json` 当前没有这两个资产的独立登记项。该登记缺口不在 Task 9 所有权内，未扩展修改范围。
