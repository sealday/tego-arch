# G006 Batch 1 独立评审记录

- 评审日期：2026-07-27
- 评审范围：QA-00、QA-01、QA-02、QA-03，以及三条受影响学习路径、资料库页面和三张原创 PNG。
- 评审阶段：Task 7 Stage A，仅记录 editorial、fact、copyright、render 与本地交互证据；本记录尚不包含 Pages 部署 SHA、run 或 live-smoke 证据。
- 浏览器与视口：Google Chrome 150.0.7871.184；desktop `1440x1000`，mobile `390x844`。

## QA-00

- 路由：`/quality-attributes/qa-00`
- editorial — PASS：开篇把“属性名称不能决定架构”作为冲突，正文依次说明模型、六字段场景、策略、测量、权衡和非使用条件；长段落仍围绕失败模式与轻量化边界推进，没有把来源清单塞入主叙事。
- fact — PASS：ISO/IEC 25010:2023 只承担产品质量模型的名称、版本与索引边界；SEI `CMU/SEI-95-TR-021` 只承担 1995 年质量属性与架构推理的历史背景。正文明确不把标准顺序当优先级、不把历史材料当当前标准，也不把策略当达标证据。
- copyright — PASS：ISO 仅作公开事实和顶层命名摘要，没有复制付费标准的表格或子特性正文；SEI 仅作原创事实摘要，没有复用报告图表、长引文或衍生文本。原创插图有 `original-illustration`、`LicenseRef-Atlas-Original`、`original-atlas` 与 `illustration-rights` 记录。
- render — PASS：desktop 与 mobile 的 H1、学习问题、正文、Mermaid、来源和相邻链接可见，无页面级 overflow，console warning/error 均为 0。插图原始尺寸 `1664x936`；desktop 以 `800x450` 显示在 `823px` article 内，mobile 以 `358x201` 显示在 `358px` article 内，无裁切或伪中文。

## QA-01

- 路由：`/quality-attributes/qa-01`
- editorial — PASS：六字段按 Source、Stimulus、Environment、Artifact、Response、Response measure 连续展开，响应与响应度量、策略与需求、阈值与业务依据的区别清楚；说明性场景回到可测试的评审输入。
- fact — PASS：SEI QAW 官方页面支持“早期召集利益相关者发现驱动质量属性并形成优先、细化场景”的方法边界；ISO 仍只作模型名称与索引依据。`30 秒`、零重复扣款和支付场景均明确为原创说明，不是来源规定或生产事实。
- copyright — PASS：正文和决策表为原创归纳；ISO 与 SEI 只使用带出处的 facts-summary，没有长引文、来源图表或标准分类复制。
- render — PASS：desktop 与 mobile 的 H1、六个 H3、决策表、来源与相邻链接正常；表格实测为 desktop `644/644px`、mobile `358/358px`（`scrollWidth/clientWidth`），无页面级 overflow，console warning/error 均为 0。

## QA-02

- 路由：`/quality-attributes/qa-02`
- editorial — PASS：fault、failure、可用性、RTO、RPO、结果未知和恢复验证各自承担一个判断，业务状态与服务恢复没有混为一谈；失败模式和自动化禁用边界保持在可见正文。
- fact — PASS：Google SRE Availability Table 只支持时间型可用性与允许不可用窗口的换算假设；Addressing Cascading Failures 支持资源耗尽、正反馈、重试与恢复困难的有语境机制。正文没有从二者推出通用 SLO、RTO/RPO 数值或恢复保证。
- copyright — PASS：两页 SRE Book 的 `CC-BY-NC-ND-4.0` 边界已记录，正文只作原创 facts-summary，不复制其表格、图或段落；SEI 也保持历史背景用途。原创插图的权利、生成说明和事实声明排除均完整。
- render — PASS：desktop 与 mobile 的 H1、六字段场景、边界表、来源和相邻链接正常；表格为 desktop `540/540px`、mobile `358/358px`，无页面级 overflow，console warning/error 均为 0。插图原始尺寸 `1664x936`，分别以 `800x450` 与 `358x201` 显示，文字和箭头未裁切。
- topology — PASS：图中上支明确为 `故障 → 隔离成功 → 自动解决 → 恢复验证`，下支明确为 `故障传播 → 服务失效 → 恢复验证`；两支都可进入 `结果未知 → 核对 → 自动解决/人工终态`。图没有暗示每个 fault 都成为 failure，也没有承诺所有恢复或未知结果都能自动解决。

## QA-03

- 路由：`/quality-attributes/qa-03`
- editorial — PASS：workload、offered load、concurrency、service time、throughput、分位数、utilization、queue、rejection 与 capacity 形成同一观察窗口；非使用条件明确排除短 benchmark、未知依赖配额和无限队列。
- fact — PASS：Handling Overload 支持配额、优先级、过载保护和拒绝的有语境机制；Monitoring Distributed Systems 支持 latency、traffic、errors、saturation、症状/原因与尾部分布边界。正文没有宣称通用 QPS/CPU 公式、当前 Google 政策或单一阈值。
- copyright — PASS：SRE Book 仅作带出处的原创 facts-summary，没有复制来源表格、图或长文本；数值场景、Mermaid 与信号图均为本站原创并明确不构成生产基准或效果保证。原创 PNG 的权利与使用边界完整登记。
- render — PASS：desktop 与 mobile 的 H1、六字段场景、Mermaid、来源和相邻链接正常，无页面级 overflow，console warning/error 均为 0。插图原始尺寸 `1664x936`，分别以 `800x450` 与 `358x201` 显示，所有标签可读且未裁切。
- plateau/rejection scope — PASS：图把 offered load、并发、服务时间、队列和吞吐平台放在主路径，把 p99 上升画在饱和膝点附近，并将 rejection 作为独立分支；正文紧邻声明“不设定阈值，也不声称过载必然使吞吐崩溃”。

## 路由、视口与运行时矩阵

以下路由均以 production build 在 Chrome 中完整滚动检查；每项 HTTP 200、H1 可见、`documentElement.scrollWidth === clientWidth`，console warning/error 为 0，CSS 与 JS 响应均为 200。

| 路由 | desktop 1440x1000 | mobile 390x844 |
| --- | --- | --- |
| `/quality-attributes/qa-00` | PASS，`1440/1440` | PASS，`390/390` |
| `/quality-attributes/qa-01` | PASS，`1440/1440` | PASS，`390/390` |
| `/quality-attributes/qa-02` | PASS，`1440/1440` | PASS，`390/390` |
| `/quality-attributes/qa-03` | PASS，`1440/1440` | PASS，`390/390` |
| `/paths/architecture-thinking` | PASS，`1440/1440` | PASS，`390/390` |
| `/paths/distributed-systems` | PASS，`1440/1440` | PASS，`390/390` |
| `/paths/reliability-state` | PASS，`1440/1440` | PASS，`390/390` |
| `/references` | PASS，`1440/1440` | PASS，`390/390` |
| `/references/primary/page/18` | PASS，含 QA-02 illustration source card | PASS，含 QA-02 illustration source card |
| `/references/primary/page/19` | PASS，最终一手来源页 | PASS，最终一手来源页 |

三条公开 PNG 路径均返回 HTTP 200 和 `image/png`：

- `/img/illustrations/qa-00-quality-model-boundaries.png`
- `/img/illustrations/qa-02-failure-recovery-boundaries.png`
- `/img/illustrations/qa-03-load-saturation-boundaries.png`

## 交互与关系检查

- interaction — PASS：从 `/quality-attributes/qa-00` 点击 QA-01 链接，进入 `/quality-attributes/qa-01`，H1 为“质量属性场景写法”。
- interaction — PASS：从 `/quality-attributes/qa-01` 点击 QA-02 链接，进入 `/quality-attributes/qa-02`，H1 为“可靠性、可用性与可恢复性”。
- interaction — PASS：从 `/quality-attributes/qa-02` 点击 QA-03 链接，进入 `/quality-attributes/qa-03`，H1 为“性能、延迟、吞吐与容量”。
- interaction — PASS：从 `/quality-attributes/qa-03` 点击 QA-00 链接，回到 `/quality-attributes/qa-00`，H1 为“质量属性总览”。
- reciprocal-links — PASS：desktop 与 mobile 均实际找到 QA-00 → QA-01/02/03、QA-01 → QA-00/02、QA-02 → QA-00/01/03、QA-03 → QA-00/02 的可见链接。
- path interaction — PASS：`/paths/architecture-thinking` → QA-00、`/paths/distributed-systems` → QA-03、`/paths/reliability-state` → QA-02 均通过实际点击到达正确 H1。
- pagination interaction — PASS：从 `/references/primary/page/19` 点击第 18 页后执行浏览器 Back，返回 `/references/primary/page/19`；最终页 H1 为“一手来源 · 第 19 页”。

## 来源与版权边界复核

- 官方来源页复核 — PASS：SEI Quality Attributes、SEI QAW Third Edition，以及四页 Google SRE Book 均在 2026-07-27 直接返回 HTTP 200；标题、作者/机构、版本语境和正文所用机制与 ledger 对齐。
- ISO 边界 — PASS：官方 ISO 页面公开元数据确认 `ISO/IEC 25010:2023`、Edition 2、2023-11 与 product quality model；正文只保留名称、版本和索引用途。自动化 `curl` 当前收到 ISO 的 HTTP 403 访问控制，因此不把机器抓取状态写成内容事实；离线受治理链接检查仍通过。
- SEI 权利边界 — PASS：报告版权页确认 Carnegie Mellon University 1995，以及内部复制/衍生需保留 copyright 和 No Warranty、外部或商业复用需向 SEI Licensing Agent 申请；本站没有行使这些复用权，只使用原创事实摘要。
- SRE 权利边界 — PASS：四页页脚均给出 Google/O'Reilly 与 `CC BY-NC-ND 4.0`；本站采用更窄的 facts-summary，不发布来源改编、表格或插图。
- 原创插图 — PASS：三张图在原始尺寸和 article 宽度均检查了简体中文、箭头、状态、分支、RTO/RPO、吞吐平台、饱和与拒绝；无伪中文、裁切、人物、logo、签名、水印、来源构图复刻或无依据保证。

## 验证命令

- `node --test tests/g006-batch1-content.test.mjs tests/g005-batch3-content.test.mjs tests/learning-path.test.mjs tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-governance-data.test.mjs tests/project-status.test.mjs tests/content-review-health.test.mjs` — PASS，118 tests、0 failures。
- `npm run build` — PASS；仅出现既有 Node `localStorage` experimental warning，浏览器运行时 warning/error 为 0。
- Playwright + Chrome production-site audit — PASS：上述 10 条路由、两个视口、三张 article-width 图片、三条公开 PNG、CSS/JS、reciprocal links、path clicks 与 pagination interaction 均完成。

## Stage A 结论

QA-00、QA-01、QA-02、QA-03 的 editorial、fact、copyright、render 均为 PASS。Stage A review 可以提交；QA-00 至 QA-03 的 backlog 行保持未勾选，部署闭环留给后续 Stage B。
