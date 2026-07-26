# G006 Batch 2 独立评审记录

- 评审日期：2026-07-27
- 评审阶段：Task 4 Stage A
- 评审目标 implementation HEAD：`296366de060af98788ce57fc635e11468f202952`
- 评审者身份：`Codex Verifier /root/g006_b2_task4_review（独立评审者 / independent reviewer）`
- 内容作者身份：`张琳 Lin Zhang <sealday@gmail.com>`
- 评审范围：QA-04、QA-06、QA-07，四条受影响学习路径、两条来源分页路由和三张原创 PNG。
- 浏览器与视口：Google Chrome `150.0.7871.184`；desktop `1440x1000`，mobile `390x844`。
- Stage A 状态：`15/62/412`，当前故事 `G006`；QA-04、QA-05、QA-06、QA-07 均保持未勾选。

## QA-04

- 路由：`/quality-attributes/qa-04`
- editorial — PASS：开篇先拆开“实例自动变化”与“系统能随负载扩展”，随后把 scalability、elasticity、capacity、scale unit、控制延迟和 repartitioning 放进同一条判断链。需求序列表、控制环、失败模式与说明性场景各自承担不同问题，结尾回到动作效果与架构边界。
- fact — PASS：Microsoft Azure Well-Architected 官方页支持 scale unit 是按比例一起扩展的资源组、基础设施副本不等于应用能利用副本、共享依赖与分区仍需独立验证；Google Cloud 官方页支持按需求扩缩、实时扩容可能需要数分钟以及容量未必及时增加。正文明确把阈值、场景与结论限定为本站分析，没有把供应商建议外推为线性吞吐或成功重分区保证。
- copyright — PASS：两份官方页面仅以带链接的原创 facts-summary 使用，没有复制来源表格、插图、代码或长引文。原创 PNG 的 ledger 记录包含 `original-illustration`、`LicenseRef-Atlas-Original`、`original-atlas`、生成说明和 `illustration-rights`。
- render — PASS：desktop `1440x1000` 与 mobile `390x844` 均为 HTTP 200，H1、需求表、PNG、Mermaid、来源和相邻链接可见；document width 分别为 `1440/1440` 与 `390/390`，console warning/error 为 0。
- deterministic representation — PASS：需求/容量表在 desktop 为 `534/534px`、mobile 为 `358/358px`；Mermaid 在 desktop 完整显示，在 mobile 的 `358px` 容器内以 `overflow-x: auto` 提供 `672px` 可滚动图面，23 个文字/节点对象均保留。
- anti-overclaim — PASS：正文和图注同时声明弹性不创造架构可扩展性、不保证线性吞吐、自动扩缩不证明需求已满足，重分区必须验证数据完整性、路由收敛与回滚。

## QA-06

- 路由：`/quality-attributes/qa-06`
- editorial — PASS：开篇直接否定“测试全绿等于安全修改”，六字段场景把 change source、stimulus、environment、artifact、response 与 measure 串到 impact、contract test、运行验证和 rollback。说明性场景以离线消费者拒绝事件展示遗漏影响，并回到可维护性判断。
- fact — PASS：SEI `CMU/SEI-2020-TR-006` 官方页支持用场景表达维护性需求、分析架构机制与风险，并明确检查架构文档是否足以支持分析。ISO/IEC 25010:2023 只作产品质量模型中的定义背景；正文没有复制付费标准正文，也没有把覆盖率或模块大小写成通用证明。
- copyright — PASS：SEI 与 ISO 只承担事实摘要和定义背景，没有复用报告图表、长引文或标准分类正文。原创 PNG 的权利字段、事实声明排除、生成说明和 article citation 均完整。
- render — PASS：desktop `1440x1000` 与 mobile `390x844` 均为 HTTP 200，H1、六字段表、PNG、Mermaid、来源和相邻链接可见；document width 分别为 `1440/1440` 与 `390/390`，console warning/error 为 0。
- deterministic representation — PASS：六字段表在 desktop 为 `653/653px`、mobile 为 `358/358px`；Mermaid 在 desktop 完整显示，在 mobile 的 `358px` 容器内以 `overflow-x: auto` 提供 `672px` 可滚动图面，20 个文字/节点对象均保留。
- anti-overclaim — PASS：正文明确 coverage percentage 不证明 maintainability 或 safe modifiability，测试通过与生产验证是两道证据门，小模块也不自动可维护；未验证影响必须进入 containment 或 rollback。

## QA-07

- 路由：`/quality-attributes/qa-07`
- editorial — PASS：开篇以“OpenAPI 校验通过仍可能语义不同”建立冲突，兼容矩阵分别检查 source、wire、semantics，新旧组合之后再讨论 interoperability 与 additive → deprecate → migrate → remove。失败分支、移除条件和不适用边界保持可见。
- fact — PASS：AIP-180 官方页明确区分 source、wire、semantic compatibility，并说明指导是 indicative 而非穷尽；AIP-185 支持新旧版本并存、合理迁移期和充分沟通的弃用期；OpenAPI Specification 3.1.1 官方页支持语言无关的 HTTP API 描述。正文没有把 Google API 规则扩展为通用强制时长，也没有把 OAS 一致推导成业务语义一致。
- copyright — PASS：AIP 页面按其 `CC-BY-4.0` 页脚边界作归纳，OAS 3.1.1 按官方 `Apache-2.0` 边界作事实摘要；没有复制来源图、规范大段文字或代码样例。原创 PNG 的权利、生成与非事实声明记录完整。
- render — PASS：desktop `1440x1000` 与 mobile `390x844` 均为 HTTP 200，H1、兼容矩阵、PNG、Mermaid、来源和相邻链接可见；document width 分别为 `1440/1440` 与 `390/390`，console warning/error 为 0。
- deterministic representation — PASS：兼容矩阵在 desktop 为 `800/800px`；mobile 表格为 `424/358px`，表格自身 `overflow-x: auto` 且实际可滚动。Mermaid 在 mobile 的 `358px` 容器内提供 `672px` 可滚动图面，14 个文字/节点对象均保留。
- anti-overclaim — PASS：正文明确 OAS conformance、共同 transport 或相同 version label 都不保证 semantic interoperability；remove 需要旧流量、数据与回退证据，协议可解析也不证明权限、金额、幂等或终态一致。

## 路由、视口与运行时矩阵

以下路由均使用 production build 在 Chrome 中检查；每项 HTTP 200、H1 可见，desktop `1440x1000` 的 document width 为 `1440/1440`，mobile `390x844` 为 `390/390`。

| 路由 | desktop 1440x1000 | mobile 390x844 |
| --- | --- | --- |
| `/quality-attributes/qa-04` | PASS | PASS |
| `/quality-attributes/qa-06` | PASS | PASS |
| `/quality-attributes/qa-07` | PASS | PASS |
| `/paths/distributed-systems` | PASS | PASS |
| `/paths/cloud-native-platform` | PASS | PASS |
| `/paths/module-boundaries` | PASS | PASS |
| `/paths/agent-platform-gateway` | PASS | PASS |
| `/references/primary/page/19` | PASS，H1 为“一手来源 · 第 19 页” | PASS，H1 为“一手来源 · 第 19 页” |
| `/references/first-party/page/2` | PASS，H1 为“第一方工程资料 · 第 2 页” | PASS，H1 为“第一方工程资料 · 第 2 页” |

- CSS — PASS：production stylesheet `/assets/css/styles.b12e7ca6.css` 返回 HTTP 200。
- JS — PASS：runtime、main 与页面 chunks 均返回 HTTP 200，failed requests 为 0。
- console warnings/errors 0 — PASS：上述路由、图片滚动加载和点击交互均未记录浏览器 console warning 或 error。
- no overflow — PASS：全部九条路由在两个视口中均满足 `documentElement.scrollWidth === clientWidth`。
- homepage status — PASS：`/` 可见持久故事 `5 / 20`、已完成主题 `15`、内容文档 `62`、治理来源 `412` 与当前故事 `G006`。

## 图片与 deterministic representation

三条公开 PNG 路径均返回 HTTP 200、`image/png`：

- `/img/illustrations/qa-04-demand-capacity-scaling.png`
- `/img/illustrations/qa-06-change-blast-radius-verification.png`
- `/img/illustrations/qa-07-compatibility-version-migration.png`

- article-width — PASS：三图 natural size 均为 `1664x936`；desktop 在 `823px` article 内渲染为 `800x450`，mobile 在 `358px` article 内渲染为 `358x201`。
- original-size inspection — PASS：简体中文标题和标签可读，箭头、回路、分支与状态符合正文；没有裁切、伪中文、人物、logo、签名、水印、来源构图复刻、无依据阈值或保证。
- responsive inspection — PASS：三图在 mobile article width 仍能区分 QA-04 的扩缩/分区/单点瓶颈、QA-06 的测试/运行验证/回滚、QA-07 的三层兼容/互操作/迁移分支。

## 交互与关系检查

- reciprocal clicks — PASS：desktop 与 mobile 均实际点击 QA-03 ↔ QA-04、QA-04 ↔ QA-06、QA-04 ↔ QA-07、QA-06 ↔ QA-07；每次均到达目标 URL 和正确 H1。
- path clicks — PASS：两个视口均实际点击 `/paths/distributed-systems` → QA-04、`/paths/cloud-native-platform` → QA-04、`/paths/module-boundaries` → QA-06、`/paths/agent-platform-gateway` → QA-07。
- source routes — PASS：`/references/primary/page/19` 与 `/references/first-party/page/2` 在两个视口均可直接访问，分页 H1 正确，无 overflow 或 console 事件。

## 来源、版权与主张边界

- license findings — PASS：Azure Learn 与 Google Cloud 页的 CC BY 4.0 范围、SEI 的保守 facts-summary 边界、ISO 的付费标准边界、AIP 页的 CC BY 4.0、OAS 3.1.1 的 Apache 2.0、Awesome index 的 navigation-only，以及三张原创图的 `LicenseRef-Atlas-Original` 均与 ledger/citation 一致。
- anti-overclaim findings — PASS：三篇均将来源事实、本站分析和说明性场景分开；未出现虚构用户、事故、生产经验、基准、通用阈值或上游保证。扩缩、覆盖率、OAS/版本一致这三类最易越界结论均有显式否定。
- manifest primary — PASS：QA-04 唯一 primary 为 Azure scale/partition 官方页，QA-06 唯一 primary 为 SEI Maintainability，QA-07 唯一 primary 为 OAS 3.1.1；原创图与 Awesome index 均不是 manifest primary。

## 验证命令

- `node --test tests/g006-batch2-content.test.mjs tests/g006-batch1-content.test.mjs tests/learning-path.test.mjs tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-governance-data.test.mjs tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs` — PASS，124 tests、0 failures。
- `npm run build` — PASS；生成 production static files。Node 构建进程仅输出既有 `localStorage` experimental warning，浏览器运行时 warning/error 为 0。
- Playwright + Google Chrome production audit — PASS：九条页面路由、两个视口、三张 article-width 图片、三条 PNG、CSS/JS、scrollable deterministic representations、reciprocal clicks、path clicks、homepage `15/62/412`、overflow 与 console 检查均完成。

## Stage A 结论

QA-04、QA-06、QA-07 的 editorial、fact、copyright、render 均为 PASS。Stage A review 可提交；本任务不改变 backlog 完成状态，QA-04、QA-05、QA-06、QA-07 继续保持未勾选，生成状态保持 `15/62/412`。
