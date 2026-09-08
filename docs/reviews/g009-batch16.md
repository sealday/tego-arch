# G009 Batch 16

## Stage A candidate

Scope: STAGE_A_PENDING.

DDD-01 lifecycle: published / pending.

DDD-02 lifecycle: planned / unpublished / pending / non-actionable.

Final judgment: PENDING.

Deployment: NOT_RUN.

Screenshot evidence: BLOCKED / NOT_ACCEPTED; accepted 0/4; functional PASS is not visual acceptance.

## Independent reviews

code/spec/security: PENDING.

content/evidence/rights: PENDING.

architecture/invariants: PENDING.

## Browser evidence

Browser raw: docs/reviews/evidence/g009-batch16-stage-a-browser.json; bytes 24566; SHA-256 a5ab2380c428f462d8a7125fec59ed770360e767f052b4c8a67132a24d528901.

Local build: e499588ab97cc116435fa3fa4cfc6b307dc7576a; files 288; SHA-256 239e1575ba779dc9d4896696075bba34a7f6b628c8b8e840b662cd4024c44c48.

<details className="evidence-card">
<summary>本地浏览器观测明细与诚实边界</summary>

一次初始键盘检查因焦点丢失而失败，随后使用真实 Tab/ArrowRight 输入重跑；本候选只记录成功重跑的焦点、轮廓与滚动观测。关联目标通过 exact href direct goto 验证并使用 Browser back 返回，不声称发生了物理点击导航。

四态功能观测均通过：桌面明暗主题视口为 1440x1000，移动明暗主题视口为 390x844；三个包装器的滚动宽度为 800/1447/1529，真实键盘增量符合桌面 0/40/40 与移动 40/40/40。SVG 源文件为 13806 bytes、SHA-256 bcf229ac78b2efd0c9cf7f2b3cd36935337c710669bba4276dcfab855540d4bc，浏览器 natural size 53x150，渲染尺寸 800x2260。

H1、STY-14 直达目标 H1、回链与返回状态均精确；每态 7 个来源锚点的 href/target/rel 完整，DDD-02 actionable count 为 0。原生日志为空；Runtime.exceptionThrown 与 Log.entryAdded 的完整空游标为 157→181，Runtime.consoleAPICalled 的完整空游标为 157→191。

仅在 mobile-dark 状态进行过一次全页截图尝试，返回约 427000 bytes，但无法持久化为可复核文件；desktop-light、desktop-dark 与 mobile-light 均未尝试截图。因此接受结果仍为 0/4，视觉证据保持 BLOCKED / NOT_ACCEPTED，artifact 为 null，不把功能通过提升为截图通过。

</details>

## Publication
