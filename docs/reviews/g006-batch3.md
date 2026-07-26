# G006 Batch 3 独立评审记录

- 评审者身份：`Codex independent reviewer / Task 4 recovery`
- 内容作者身份：`G006 Batch 3 Task 2 and Task 3 implementation agents`
- 评审日期：`2026-07-27`
- 评审范围：QA-05、QA-08、QA-09，四条学习路径、九个新增来源卡片和三张原创 PNG。
- 评审基线：`48088d23dfc27271374fff254419f749ddad9037`
- 本地构建：Docusaurus production build，经 `http://127.0.0.1:3210/tego-arch/` 使用 Google Chrome `150.0.7871.184` 检查。
- 状态边界：`18/65/421`，当前故事 `G006`；QA-05、QA-08、QA-09、QA-10 均保持未勾选。

## QA-05

- 路由：`/quality-attributes/qa-05`
- editorial — PASS：合并插图后的重复过渡句；九个 H2、学习问题、六字段场景、策略、信号、权衡、相邻属性、场景与来源顺序保持不变。
- fact — PASS：资产、主体、数据目的、信任边界与隐私风险的边界和来源一致；威胁模型不声称完整，STRIDE 也不被写成穷尽证明。
- copyright — PASS：NIST 只作政府材料事实摘要，OWASP 只作署名方法转述；原创图未复刻 OWASP、NIST 或其他来源构图。
- render — PASS：desktop `1440x1000` 与 mobile `390x844` 均 HTTP 200、H1 正确、页面宽度无溢出；图片分别渲染为 `800x450` 与 `358x201`。
- deterministic representation — PASS：DFD 风格表明确数据与目的、边界前假设、边界后重建和失败动作。
- anti-overclaim：合规不证明系统安全或隐私合规；威胁清单不声称完整；网络或服务身份不等于授权，也不能替代对象、租户与目的级判断。

## QA-08

- 路由：`/quality-attributes/qa-08`
- editorial — PASS：合并插图后的重复过渡句；监控、可观测性、可运维性和事件责任链的叙述保持单一主线。
- fact — PASS：OpenTelemetry 和 Google SRE 仅支持各自的定义与方法边界；站内可运维性定义明确标注为教学工作定义。
- copyright — PASS：OpenTelemetry 以 CC BY 4.0 事实摘要并署名；Google SRE 的 CC BY-NC-ND 内容没有翻译或改编图文。
- render — PASS：desktop `1440x1000` 与 mobile `390x844` 均 HTTP 200、H1 正确、页面宽度无溢出；图片分别渲染为 `800x450` 与 `358x201`。
- deterministic representation — PASS：Mermaid 固定信号、诊断、受控动作、恢复验证、学习回路及失败返回。
- anti-overclaim：observability 不只等于 metrics、logs、traces；遥测、SLO 或自动化不等于可运维性，也不能证明恢复能力。

## QA-09

- 路由：`/quality-attributes/qa-09`
- editorial — PASS：合并插图后的重复过渡句；损失、危害、控制结构、不安全控制动作、约束与残余风险顺序清晰。
- fact — PASS：FAA、STPA 和 NIST 的风险、UCA 与属性边界均限制在来源范围；领域阈值和风险接受没有被泛化。
- copyright — PASS：FAA 与 NIST 只作政府材料事实摘要；STPA 只作事实/短引用用途；未复用来源、STPA 或 FAA 的图或版式。
- render — PASS：desktop `1440x1000` 与 mobile `390x844` 均 HTTP 200、H1 正确、页面宽度无溢出；图片分别渲染为 `800x450` 与 `358x201`。
- deterministic representation — PASS：Mermaid 固定从损失到运行证据的分析顺序，表格固定四类 UCA 与对应控制。
- anti-overclaim：Safety 不等于 Security 或可靠性；认证或方法完成不证明 Safety，也不等于残余风险已被接受。

## 路由、来源卡片与图片

以下页面在两个视口均返回 HTTP 200、H1 正确且无页面级 overflow：

- `/quality-attributes/qa-05`
- `/quality-attributes/qa-08`
- `/quality-attributes/qa-09`
- `/paths/production-governance`
- `/paths/cloud-native-platform`
- `/paths/edge-physical-agents`
- `/paths/agent-platform-gateway`
- `/references/primary/page/20`
- `/references/first-party/page/2`

实际分页规划器生成的九个来源卡片路由均加载匹配的 `<article id="source-id">`：

- `/references/primary#src-stpa-handbook-2018`
- `/references/primary/page/3#src-sre-managing-incidents`
- `/references/primary/page/5#src-faa-order-8040-4c`
- `/references/primary/page/6#src-nist-privacy-framework-1`
- `/references/primary/page/6#src-nist-sp800-160v1r1`
- `/references/primary/page/7#src-opentelemetry-observability-primer`
- `/references/primary/page/19#src-atlas-qa05-data-trust-boundaries-8d53f1c92a64`
- `/references/primary/page/19#src-atlas-qa09-safety-control-loop-c4a7e83b1d96`
- `/references/primary/page/20#src-atlas-qa08-operability-recovery-loop-6b1e9d42c7f5`

三张静态图片均为 HTTP 200、`image/png`，源文件为 `1664x936`：

- `/img/illustrations/qa-05-data-trust-boundaries.png`
- `/img/illustrations/qa-08-operability-recovery-loop.png`
- `/img/illustrations/qa-09-safety-control-loop.png`

## 运行时与交互结论

- CSS PASS：直接页面加载观察到的样式资源全部成功。
- JS PASS：直接页面加载观察到的运行时与页面 chunk 全部成功。
- console warnings/errors 0 — PASS：每个文章直接加载在两个视口均无 console warning/error 和 page error。
- no overflow — PASS：所有文章、路径、来源页与点击目标均满足 `documentElement.scrollWidth === clientWidth`。
- article-width PASS：文章宽度 desktop 为 `823px`、mobile 为 `358px`；三图显示宽度分别为 `800px` 和 `358px`。
- reciprocal clicks PASS：实际点击 QA-05 → QA-07/08/09、QA-08 → QA-02/04、QA-09 → QA-05，均到达目标 URL 与正确 H1。
- path clicks PASS：实际点击 production governance → QA-05/08、cloud native → QA-08、edge/physical agents → QA-09、agent platform gateway → QA-05，均到达目标 URL 与正确 H1。
- 快速连续导航产生的 lazy/prefetch `ERR_ABORTED` 只出现在离开页面时；逐页新上下文直接加载为 0 failed requests、0 console/page errors。
- license findings PASS：六个远程来源和三个原创图的许可、用途、非主证据边界与页面引用一致。
- anti-overclaim findings PASS：三篇均保留合规、威胁完整性、遥测/自动化、Safety/Security/可靠性与认证方法的禁止性边界。

结论：QA-05、QA-08、QA-09 的 editorial、fact、copyright、render 均为 PASS；Stage A 评审可提交，且不改变 backlog 完成状态。

## Stage A 部署与线上复核

- Live-smoke date：`2026-07-27`
- Exact Stage A SHA：`a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a`
- GitHub Pages run：[`30224008179`](https://github.com/sealday/tego-arch/actions/runs/30224008179)
- Exact run gate：`headSha=a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a`，`status=completed`，`conclusion=success`。
- Canonical live base：[`https://sealday.github.io/tego-arch/`](https://sealday.github.io/tego-arch/)
- 视口与运行时：desktop `1440x1000`、mobile `390x844`；所有复核页面均无 overflow，console warning/error 为 0，production CSS/JS 响应为 HTTP 200。
- homepage status — PASS：线上首页显示 `18/65/421` 与当前故事 `G006`，和 Stage A 生成状态一致。

### 线上路由、来源卡片与图片

- QA-05、QA-08、QA-09、四条学习路径、`/references/primary/page/20` 与 `/references/first-party/page/2` 均在两个视口返回 HTTP 200、H1 正确且无页面级 overflow。
- 九个来源卡片的精确 `route#source-id` 均加载唯一匹配的 `<article id="source-id">`；这些路径与“路由、来源卡片与图片”一节逐项相同。
- 三张 `/img/illustrations/qa-*.png` 均返回 HTTP 200、`image/png`，文件字节数分别为 `1712809`、`2098531`、`1939799`；文章内显示宽度为 desktop `800px`、mobile `358px`。
- primary page 21 返回 HTTP 404；first-party page 3 返回 HTTP 404，证明 Stage A 没有越过 `20 / 2` 的实际分页边界。
- 每个页面使用独立浏览器上下文复核；failed CSS/JS request、console warning/error 与 page error 均为 0，`documentElement.scrollWidth === clientWidth`。

Stage B closure — PASS：上述 exact SHA/run gate、三条 QA 路由、四条学习路径、三张 PNG、primary page 20、first-party page 2、九个精确来源卡片、CSS/JS、overflow 与 console 结果均来自成功的 Stage A live smoke；本阶段仅关闭 QA-05、QA-08、QA-09，QA-10 保持未完成。
