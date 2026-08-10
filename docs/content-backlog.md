# 软件架构内容内化长期 Backlog

> 本文件是仓库唯一的长期内容任务清单。`docs/superpowers/specs/` 与
> `docs/superpowers/plans/` 记录历史设计和阶段实施过程，不再作为日常任务状态来源。
>
> 最近盘点：2026-07-23。

## 进度跟踪与恢复

- **唯一人工任务状态：** 只人工维护本文件 checkbox。历史 spec/plan 只保存设计与实施背景，不恢复为活任务；未来 manifest 的 `status` 必须是由本 backlog/content metadata 生成的只读投影，或只描述内容生命周期，不能成为第二个人工任务进度源。
- **本地执行层：** Ultragoal 由负责人运行 `omx ultragoal status` 查看当前故事、运行 `omx ultragoal complete-goals` 取得下一步。执行者不得自行改写 `.omx/ultragoal/`，也不得在父故事尚未通过全部门槛时 checkpoint。
- **每个父故事的完成门槛：** 依次完成 targeted verification、`npm run verify`、独立审查、提交到 `main`、推送 `origin/main`、等待 GitHub Pages 成功、检查受影响的线上 route，再把成功部署日期和 commit 更新到“当前发布基线”。基线记录也必须提交并推送到 `origin/main`；上述证据齐全后，负责人才能运行 `omx ultragoal checkpoint` 并进入下一故事。
- **远端持久层：** 完成项必须同时有本文件的 `[x]`、对应 Git commit、成功部署和线上 route 证据。任一门槛失败时保持当前 story 未完成；本地状态丢失时，从本文件第一个未完成 story 和“当前发布基线”所指的最后成功部署 commit 恢复，不以未部署的本地提交或历史 plan checkbox 推断完成。
- **当前发布基线：** 2026-08-10 G009 Batch 4 已完成 STY-03，Stage A 发布基线为 [`75b1838eb37d1bc41bc3260c6fc5f71cd2f9a00e`](https://github.com/sealday/tego-arch/commit/75b1838eb37d1bc41bc3260c6fc5f71cd2f9a00e)，Pages run [`31366156479`](https://github.com/sealday/tego-arch/actions/runs/31366156479)，exact `headSha=75b1838eb37d1bc41bc3260c6fc5f71cd2f9a00e`、`event=push`、`status=completed`、`conclusion=success`，build job `93384860162`、deploy job `93385369626`，production article/SVG HTTP `200/200`，desktop `1440x1000`、mobile `390x844`，desktop document geometry `1440/1440`、mobile document geometry `390/390`，desktop SVG `800x866.664`，mobile diagram wrapper `358/800`、table wrapper `358/1024`，diagram ArrowRight `0→40`，Tego Arch warnings/errors `0/0`，diagram inventory 为 13 ordinary nodes、one shared database，geometry minima 为 node horizontal `16.430px`、top `14.833px`、baseline `22.222px`、bottom `14.889px`、label-to-stroke `10.333px`、label-to-arrow `19.312px`、label-to-node `35.270px`，仓库测试 `1093/1093`，full validation PASS，code/content/architecture review verdicts 为 APPROVE/READY/CLEAR，Critical `0`、Important `0`、Minor `0`，Stage B closure 为 56 个已完成主题、98 篇内容文档与 509 个受治理来源，持久故事进度为 `8 / 20`，当前 G009，下一项为 STY-04，STY-03 为 published/complete，STY-04 为 planned/pending，Stage B closure — PASS。此前 G009 Batch 3 历史完成基线为：2026-08-07 G009 Batch 3 已完成 STY-02，Stage A 发布基线为 [`21647637a06585f7ba52996f3581dfb3d53b490a`](https://github.com/sealday/tego-arch/commit/21647637a06585f7ba52996f3581dfb3d53b490a)，Pages run [`31152763623`](https://github.com/sealday/tego-arch/actions/runs/31152763623)，exact `headSha=21647637a06585f7ba52996f3581dfb3d53b490a`、`event=push`、`status=completed`、`conclusion=success`，build job `92785696406`、deploy job `92785920108`，local/production HTTP probes `14/14`，page/viewport observations `24/24`、SVG observations `4/4`，desktop `1440x1000`、mobile `390x844`，desktop document geometry `1440/1440`、mobile document geometry `390/390`，desktop wrappers 为 tables `800/1254`、`800/1279` 与 diagram `800/800`，mobile wrappers 为 tables `358/1254`、`358/1279` 与 diagram `358/800`，table ArrowRight `8/8`，diagram keyboard checks `4/4`，其中 mobile movement `2/2`（`0→40`）、desktop non-overflow no-op `2/2`（`0→0`），source activations `20/20`、relation activations `16/16`，interactions `48/48`，Tego Arch warnings/errors/page errors `0/0/0`，accepted screenshots `4/4`，Task 5 browser artifact SHA-256 为 `46908af13a1fb66ea4dbebdc5c5c89459160b4b6e28e6cdcfa970fca736b92a9`，desktop SVG article width `800px`、scale `2/3`，diagram inventory 为 9 nodes、3 boundaries、11 relations、8 visible edge labels，diagram minima 为 node horizontal `19.17px`、top `15.56px`、bottom `13.78px`、edge-to-own-stroke `11px`、edge-to-own-marker `16.05px`、edge-to-node `13.33px`、edge-to-boundary `4px`，仓库测试 `886/886`，full validation PASS，code/content/architecture review verdicts 为 READY/READY/CLEAR/READY，Critical `0`、Important `0`、Minor `0`，narrow remediation exact-head review READY/CLEAR，Stage B closure 为 55 个已完成主题、96 篇内容文档与 506 个受治理来源，持久故事进度为 `8 / 20`，当前 G009，下一项为 STY-03，STY-02 为 published/complete，STY-03 为 planned/pending，Stage B closure — PASS。此前 G009 Batch 2 历史完成基线为：2026-08-07 G009 Batch 2 已完成 STY-01，Stage A 发布基线为 [`124d6ae24d073286787b15387c25163df3cd3f39`](https://github.com/sealday/tego-arch/commit/124d6ae24d073286787b15387c25163df3cd3f39)，Pages run [`31129131129`](https://github.com/sealday/tego-arch/actions/runs/31129131129)，exact `headSha=124d6ae24d073286787b15387c25163df3cd3f39`、`event=workflow_dispatch`、`status=completed`、`conclusion=success`，build job `92713285167`、deploy job `92713365859`，local/production HTTP probes `10/10`，route/viewport observations `20/20`，desktop `1440x1000`、mobile `390x844`，desktop document geometry `1440/1440`、mobile document geometry `390/390`，desktop wrappers 为 responsibility `800/1187`、Mermaid `800/800`、exception `800/2075`，mobile wrappers 为 responsibility `358/1187`、Mermaid `358/672`、exception `358/2075`，table ArrowRight `8/8`，source activations `16/16`、reciprocal/case activations `12/12`，interactions `36/36`，Tego Arch warnings/errors/page errors `0/0/0`，accepted screenshots `4/4`，Task 4 browser artifact SHA-256 为 `ed3e0e69e3c4c63cc174c80b2e13da4f762becaf4429ab0449d082135a0c9531`，仓库测试 `847/847`，code/content/architecture review verdicts 为 READY/READY/CLEAR，Critical `0`、Important `0`，Stage B closure 为 54 个已完成主题、95 篇内容文档与 502 个受治理来源，持久故事进度为 `8 / 20`，最近完成 G008，当前 G009，下一项为 STY-02，STY-01 为 published/complete，STY-02 为 planned/pending，Stage B closure — PASS。此前 G009 Batch 1 历史完成基线为：2026-08-06 G009 Batch 1 已完成 STY-00，Stage A 发布基线为 [`fb490e4410047c3047d094c49688bfc431527e89`](https://github.com/sealday/tego-arch/commit/fb490e4410047c3047d094c49688bfc431527e89)，Pages run [`31126499205`](https://github.com/sealday/tego-arch/actions/runs/31126499205)，exact `headSha=fb490e4410047c3047d094c49688bfc431527e89`、`status=completed`、`conclusion=success`，build job `92698927987`、deploy job `92699010802`，6/6 个 canonical page route，12/12 个 page/viewport observation，desktop `1440x1000`、mobile `390x844`，1/1 Mermaid、2/2 张表格，10/10 次 source 激活、8/8 次 relation 激活，desktop wrappers 为 profile `800/1024`、Mermaid `800/800`、matrix `800/1760`，mobile wrappers 为 profile `358/1024`、Mermaid `358/672`、matrix `358/1760`，profile 与 matrix 的 ArrowRight 在 desktop/mobile 均为 `0→40`，0 warnings、0 errors、0 page errors，local screenshots `4/4`、production screenshots `4/4`，`local-initial` 由 code review superseded、`local-review-remediation` 由 architecture review superseded、`local-final-head` accepted，Task 4 browser artifact SHA-256 为 `a1d6ec5b1d749f4816e330dff13d908e06c6a26f04ae2feb7eeba1211a805f75`，仓库测试 `824/824`，Stage B closure 为 53 个已完成主题、94 篇内容文档与 498 个受治理来源，持久故事进度为 `8 / 20`，最近完成 G008，当前 G009，下一项为 STY-01，STY-00 为 published/complete，STY-01 为 planned/pending，Stage B closure — PASS。此前 G008 Batch 11 历史完成基线为：2026-08-06 G008 Batch 11 已完成 MOD-13 并关闭 G008，Stage A 发布基线为 [`d9283368f9b25b4491d9edb8c57d26478b2aa686`](https://github.com/sealday/tego-arch/commit/d9283368f9b25b4491d9edb8c57d26478b2aa686)，Pages run [`31089738016`](https://github.com/sealday/tego-arch/actions/runs/31089738016)，exact `headSha=d9283368f9b25b4491d9edb8c57d26478b2aa686`、`status=completed`、`conclusion=success`，build job `92577587037`、deploy job `92577837296`，8/8 个 canonical page route 与 1/1 个 SVG asset，16/16 个 page/viewport observation，desktop `1440x1000`、mobile `390x844`，2/2 个 loaded-image capture 与 4/4 个 screenshot file，2/2 张表格（8 + 4 行），8/8 次 source 激活、20/20 次 relation 激活，Batch11 accepted source/relation/operator action 的 STY-00 target 为 `0/0/0`，既有生产 STY-00 链接为每个视口 3 个，0 warnings、0 errors、0 page errors，182 次尝试中 46 failed、15 superseded、121 passed，61 次 discarded attempt 均可追踪，Task 5 artifact SHA-256 为 `6b2853a49569d8580c33c63f06f3be501a0b37b7a3535533e436bc387671dedf`，仓库测试 `758/758`，Stage B closure 为 52 个已完成主题、94 篇内容文档与 494 个受治理来源，持久故事进度为 `8 / 20`，最近完成 G008，当前 G009，下一项为 STY-00，MOD-13 为 published/complete，STY-00 已有 published 内容且 backlog 保持 pending/planned，Stage B closure — PASS。此前 G008 Batch 10 历史完成基线为：2026-08-06 G008 Batch 10 MOD-12 复审修复已完成，R1 修复提交为 [`4e06d24eac7b82dc4ddd0fe25a5e07186aa0e574`](https://github.com/sealday/tego-arch/commit/4e06d24eac7b82dc4ddd0fe25a5e07186aa0e574)，R1 Pages run [`31070354568`](https://github.com/sealday/tego-arch/actions/runs/31070354568) 以 exact `headSha=4e06d24eac7b82dc4ddd0fe25a5e07186aa0e574`、`status=completed`、`conclusion=success` 完成部署，build job `92516850799`、deploy job `92517013250`；13/13 个 canonical HTTP page route 与 2/2 个 SVG asset 检查通过，desktop `1440x1000`、mobile `390x844`，26/26 个 page/viewport 与 4/4 个 asset/viewport observation，2/2 Draw.io/SVG pairs、2/2 张表格（9 行 review、9 行 findings），8/8 次 source 激活、24/24 次 relation 激活，MOD-13 target 为 0，0 warnings、0 errors、0 page errors。原 Task 5 artifact SHA-256 仍为 `35fbdf9aa818e955b3c8c4dd3f6c5eb4830892e3ce358c8fd270e8f92b7bcb72`，R1 browser QA artifact SHA-256 为 `f32cd5fefaf46c15c38948ad298d8247ee782ddad33b99eba8722c1eed3c9fdb`。Stage A 仍为 50 个已完成主题、93 篇内容文档与 490 个受治理来源，R1 仓库测试 `706/706`；Stage B closure 投影仍为 51 个已完成主题、93 篇内容文档与 490 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-13。Stage B closure — PASS。Post-review remediation — PASS。此前 G008 Batch 9 历史完成基线为：2026-08-05 G008 Batch 9 已完成 MOD-11，Stage A 发布基线为 [`ce92d866444769927755b7d87280ddb238d961c9`](https://github.com/sealday/tego-arch/commit/ce92d866444769927755b7d87280ddb238d961c9)，Pages run [`30984920687`](https://github.com/sealday/tego-arch/actions/runs/30984920687) 以 exact `headSha=ce92d866444769927755b7d87280ddb238d961c9`、`status=completed`、`conclusion=success` 完成部署；10/10 个 canonical HTTP route 检查通过，desktop `1440x1000`、mobile `390x844`，1/1 Mermaid region/SVG、2/2 张表格（3 行 boundary、4 行 relationship），8/8 次 source 激活、24/24 次 relation 激活，MOD-12 target 为 0，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 `7f3f2be12ebe0551fae1228781f63a9b2d46a76e76bc7cac23057552aa399a89`。Stage A 为 49 个已完成主题、92 篇内容文档与 488 个受治理来源，仓库测试 `661/661`；Stage B closure 投影为 50 个已完成主题、92 篇内容文档与 488 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-12。Stage B closure — PASS。此前 G008 Batch 8 历史完成基线为：2026-08-04 G008 Batch 8 已完成 MOD-10，Stage A 发布基线为 [`749822ac242a99972b5031e8fef157457a96acbd`](https://github.com/sealday/tego-arch/commit/749822ac242a99972b5031e8fef157457a96acbd)，Pages run [`30890802473`](https://github.com/sealday/tego-arch/actions/runs/30890802473) 以 exact `headSha=749822ac242a99972b5031e8fef157457a96acbd`、`status=completed`、`conclusion=success` 完成部署；8/8 个 canonical HTTP route 检查通过，desktop `1440x1000`、mobile `390x844`，1/1 Mermaid region/SVG、2/2 张表格（6 行 story、4 行 comparison），8/8 次 source 激活、14/14 次 relation 激活，MOD-11 target 为 0，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 `732c65b2d947983d0428edc0ef444f0f2ad0b91a573eb584f04a7629f86bbfe2`。Stage A 为 48 个已完成主题、91 篇内容文档与 485 个受治理来源，仓库测试 `639/639`；Stage B closure 投影为 49 个已完成主题、91 篇内容文档与 485 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-11。Stage B closure — PASS。此前 G008 Batch 7 历史完成基线为：2026-08-03 G008 Batch 7 已完成 MOD-09，Stage A 发布基线为 [`683c836cc5058272ec0ba09af6b42f512284cdf6`](https://github.com/sealday/tego-arch/commit/683c836cc5058272ec0ba09af6b42f512284cdf6)，Pages run [`30778428606`](https://github.com/sealday/tego-arch/actions/runs/30778428606) 以 exact `headSha=683c836cc5058272ec0ba09af6b42f512284cdf6`、`status=completed`、`conclusion=success` 完成部署；9/9 个 canonical HTTP route 检查通过，desktop `1440x1000`、mobile `390x844`，1/1 Mermaid region/SVG、2/2 张表格（8 行 Big Picture、5 行 boundary），10/10 次 source 激活、16/16 次 relation 激活，MOD-10 target 为 0，MOD-11 actionable article link 为 0，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 `833c815b3ccb23f223aebfdd0de51631fbbb362c22be4637c704480b8649bcd7`。Stage A 为 47 个已完成主题、90 篇内容文档与 481 个受治理来源，仓库测试 `615/615`；Stage B closure 投影为 48 个已完成主题、90 篇内容文档与 481 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-10。Stage B closure — PASS。此前 G008 Batch 6 历史完成基线为：2026-08-02 G008 Batch 6 已完成 MOD-08，Stage A 发布基线为 [`c6f00af333640dca5b65b92c77ed9dea34df4964`](https://github.com/sealday/tego-arch/commit/c6f00af333640dca5b65b92c77ed9dea34df4964)，Pages run [`30734305213`](https://github.com/sealday/tego-arch/actions/runs/30734305213) 以 exact `headSha=c6f00af333640dca5b65b92c77ed9dea34df4964`、`status=completed`、`conclusion=success` 完成部署；8/8 个 canonical HTTP route 检查通过，desktop `1440x1000`、mobile `390x844`、desktop/mobile 均无 document overflow，2/2 Mermaid region/SVG、1/1 七行映射表、10/10 次 source 激活、16/16 次 relation 激活，26 次 closed-world operator action 且 MOD-09 target 为 0，diagram ArrowRight 在 desktop/mobile 均为 0→0，mapping table ArrowRight 在 desktop/mobile 均为 0→40，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 `6888658877c9187cd7f387b4619bce8de9beb6886c33bf25fe6e1e24af0ca51b`。Stage A 为 46 个已完成主题、89 篇内容文档与 476 个受治理来源，仓库测试 `595/595`；Stage B closure 投影为 47 个已完成主题、89 篇内容文档与 476 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-09。Stage B closure — PASS。此前 G008 Batch 5 历史完成基线为：2026-08-01 G008 Batch 5 已完成 MOD-07，Stage A 发布基线为 [`21fb1c26624920e78f62ae1c947ff6812fb97e02`](https://github.com/sealday/tego-arch/commit/21fb1c26624920e78f62ae1c947ff6812fb97e02)，Pages run [`30707375989`](https://github.com/sealday/tego-arch/actions/runs/30707375989) 以 exact `headSha=21fb1c26624920e78f62ae1c947ff6812fb97e02`、`status=completed`、`conclusion=success` 完成部署；8/8 个 canonical HTTP route 检查通过，desktop `1440x1000`、mobile `390x844`、desktop/mobile 均无 document overflow，五行证据边界表在 desktop/mobile 均使用 contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，diagram/table wrappers 在 desktop/mobile 均可聚焦，table ArrowRight scrollLeft 在 desktop/mobile 均为 0→40，1/1 Mermaid、1/1 五行证据边界表、5/5 条评审记录、4/4 source label、8/8 次 source 点击、16/16 次 relation 点击，MOD-08 article link 为 0 且 operator request 为 0，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 `3795020327a21d4182003cdfdefe169552c8fbff7420710f893ebc3e4733e610`。Stage A 为 45 个已完成主题、88 篇内容文档与 476 个受治理来源，仓库测试 `574/574`；Stage B closure 投影为 46 个已完成主题、88 篇内容文档与 476 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-08。Stage B closure — PASS。此前 G008 Batch 4 历史完成基线为：2026-07-31 G008 Batch 4 已完成 MOD-06，Stage A 发布基线为 [`63d22725f2b16b92b5821828008b4ba4e56763e1`](https://github.com/sealday/tego-arch/commit/63d22725f2b16b92b5821828008b4ba4e56763e1)，Pages run [`30626326632`](https://github.com/sealday/tego-arch/actions/runs/30626326632) 以 exact `headSha=63d22725f2b16b92b5821828008b4ba4e56763e1`、`status=completed`、`conclusion=success` 完成部署；6/6 个 canonical HTTP route 检查通过，canonical modeling route 为 `/modeling`，canonical references route 为 `/references`，desktop `1440x1000`、mobile `390x844`、无 document overflow，Mermaid 与两张 table 使用 contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，1/1 Mermaid（6 entities、7 relationships）、2/2 tables（4 + 6 data rows）、4/4 source label、8/8 次 source 点击、10/10 次 relation 点击，MOD-05 backlink 在 desktop/mobile 均通过，无 MOD-07/MOD-08 链接，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 `1c6eb07dc5b46de13addca51a88884bf1c075c853f9a03be4b5d323458c1fb9c`。Stage A 为 44 个已完成主题、87 篇内容文档与 475 个受治理来源，仓库测试 `557/557`；Stage B closure 投影为 45 个已完成主题、87 篇内容文档与 475 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-07。Stage B closure — PASS。此前 G008 Batch 3 历史完成基线为：2026-07-31 G008 Batch 3 已完成 MOD-05，Stage A 发布基线为 [`e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407`](https://github.com/sealday/tego-arch/commit/e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407)，Pages run [`30610324378`](https://github.com/sealday/tego-arch/actions/runs/30610324378) 以 exact `headSha=e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407`、`status=completed`、`conclusion=success` 完成部署；6/6 个 canonical HTTP route 检查通过，canonical modeling route 为 `/modeling`，canonical references route 为 `/references`，desktop `1440x1000`、mobile `390x844`、无 document overflow，Mermaid 与 mapping table 使用 contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，1/1 Mermaid、1/1 mapping table（4 data rows）、5/5 source label、10/10 次 source 点击、12/12 次 relation 点击、0 warnings、0 errors。Stage A 为 43 个已完成主题、86 篇内容文档与 473 个受治理来源，仓库测试 `541/541`；Stage B closure 投影为 44 个已完成主题、86 篇内容文档与 473 个受治理来源，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-06。Stage B closure — PASS。此前 G008 Batch 2 历史完成基线为：2026-07-30 G008 Batch 2 已完成 MOD-04，Stage A 发布基线为 [`ef04cdbc84c2303c115855f571e061262cdbba5f`](https://github.com/sealday/tego-arch/commit/ef04cdbc84c2303c115855f571e061262cdbba5f)，Pages run [`30543389172`](https://github.com/sealday/tego-arch/actions/runs/30543389172) 以 exact `headSha`、`completed`、`success` 完成部署；5/5 个 canonical HTTP route 检查通过，desktop `1440x1000`、mobile `390x844`、无 document overflow，MOD-04 mapping table 使用 contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，1/1 Mermaid、1/1 mapping table、7/7 source label、20/20 次 relation 点击、0 warnings、0 errors。Stage A 为 42 个已完成主题、85 篇内容文档与 468 个受治理来源，仓库测试 `527/527`；Stage B closure 投影为 43 个已完成主题，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-05。此前 G008 Batch 1 及更早历史完成基线为：2026-07-30 G008 Batch 1 已完成 MOD-01..03，Stage A 发布基线为 [`f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72`](https://github.com/sealday/tego-arch/commit/f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72)，Pages run [`30529090957`](https://github.com/sealday/tego-arch/actions/runs/30529090957) 以 exact `headSha`、`completed`、`success` 完成部署；7/7 个 canonical HTTP route、8/8 个 page/viewport、2/2 个 Mermaid、3/3 个 diagram、9/9 个 source label 与 13/13 次真实鼠标 relation 点击检查通过，desktop `1440x1000`、mobile `390x844`、无 document overflow，diagram 与 MOD-01 decision table 使用 contained overflow，keyboard focus/scroll 可用，0 warnings、0 errors。Stage A 为 39 个已完成主题、84 篇内容文档与 464 个受治理来源，仓库测试 `516/516`；Stage B closure 投影为 42 个已完成主题，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-04。此前完整 G007 Batch 5 历史完成基线为：2026-07-29 G007 Batch 5 已完成 PR-15..17，Stage A 发布基线为 [`2169c3a0f09fc9edbe4589ea657d1383eeecf758`](https://github.com/sealday/tego-arch/commit/2169c3a0f09fc9edbe4589ea657d1383eeecf758)，Pages run [`30445404784`](https://github.com/sealday/tego-arch/actions/runs/30445404784) 以 exact `headSha`、`completed`、`success` 完成部署；线上原则目录、PR-15..17 及两项 SVG 资产均 HTTP 200，desktop `1440x1000`、mobile `390x844`、无 document overflow，Draw.io/SVG 与 Mermaid 使用 contained overflow，focus/scroll 可用，0 warnings、0 errors，全部受治理来源标签及 15/15 条 parent/adjacent/case 点击检查通过。Stage A 为 36 个已完成主题、82 篇内容文档与 457 个受治理来源，仓库测试 `487/487`；Stage B closure 投影为 39 个已完成主题，G007 已完成，持久故事进度为 `7 / 20`，当前持久故事为 G008。此前 G007 Batch 4 历史完成基线为 Stage A [`bed310e71808e7c19821c6efac8b084876cfb552`](https://github.com/sealday/tego-arch/commit/bed310e71808e7c19821c6efac8b084876cfb552)、Pages run [`30422992605`](https://github.com/sealday/tego-arch/actions/runs/30422992605) 与 Stage B closure [`3520f4f9e469019b9f3dbf84ec3170171264174d`](https://github.com/sealday/tego-arch/commit/3520f4f9e469019b9f3dbf84ec3170171264174d)；当时线上原则目录、PR-12..14、hashed CSS、runtime JS 与 main JS 均 HTTP 200，desktop `1440x1000`、mobile `390x844`、无 document overflow，PR-13/14 Mermaid 与 PR-14 table 使用 contained overflow，0 warnings、0 errors，全部受治理来源标签及 20/20 条 parent/adjacent/case-or-question 点击检查通过，closure 后为 36 个已完成主题、79 篇内容文档与 450 个受治理来源，当时 G007 仍在进行中且下一项为 PR-15。此前 G007 Batch 3 完成基线 [`c0497bbe8d1ef9d19e8ed99d69411764095f03ce`](https://github.com/sealday/tego-arch/commit/c0497bbe8d1ef9d19e8ed99d69411764095f03ce) 与 Pages run [`30356377127`](https://github.com/sealday/tego-arch/actions/runs/30356377127)，G007 Batch 2 完成基线 [`5f586df19d51a9a29f88ad93c0b3a208ce3651f3`](https://github.com/sealday/tego-arch/commit/5f586df19d51a9a29f88ad93c0b3a208ce3651f3) 与 Pages run [`30339518113`](https://github.com/sealday/tego-arch/actions/runs/30339518113)，G007 Batch 1 完成基线 [`66dbc54f8b570fe05c21f69eed87faf1222d6dea`](https://github.com/sealday/tego-arch/commit/66dbc54f8b570fe05c21f69eed87faf1222d6dea) 与 Pages run [`30327594616`](https://github.com/sealday/tego-arch/actions/runs/30327594616)，G006 完成基线 [`8a2f440`](https://github.com/sealday/tego-arch/commit/8a2f4408945919643f71a0aae48e009b537de377) 与 Pages run [`30243000249`](https://github.com/sealday/tego-arch/actions/runs/30243000249)，以及更早 G005/G006 分批和仓库改名证据，继续保留在对应主题行和审查记录中。
- **当前持久故事：** `G009`。
- **持久故事进度：** 已完成 `8 / 20`；最近完成 `G008`。

## 目标与停止条件

本站不复制外部目录，也不把外部链接换一种顺序重新陈列。长期目标是把值得学习的架构知识转化为可独立阅读、可验证、可比较的中文内容，同时保留原始来源、版本边界和本站推断边界。

一个主题只有同时满足以下条件，才算从“外部入口”内化为“站内知识”：

1. 不打开外链，读者也能解释该主题解决什么问题、依赖什么上下文、如何工作。
2. 正文说明适用条件、代价、失败模式、反例和不应使用的情况。
3. 至少与一个相邻原则、模式、风格或方法形成可见比较。
4. 至少包含一个原创图、状态流、请求路径、决策表或标为“说明性场景”的例子。
5. 至少使用两个来源，其中一个是标准、原作者、官方文档、论文或可检查实现。
6. 事实、基于证据的推断和本站分析保持可区分；真实案例固定版本、日期或 commit。
7. 参考链接登记作者或机构、来源类型、核查日期、版本与使用边界。
8. 通过结构、元数据、链接、构建和桌面/移动渲染检查。

## 当前基线

- 当前发布内容包括 18 篇证据化案例、六阶段学习主线、四个专题入口、一个资料库、一个模式总览和一个设计题入口。
- 案例文章已有固定的十段式结构、证据标签、来源边界和自动化校验，是当前最成熟的内容形态。
- 通用原则、建模、架构风格和非 Agent 模式尚未形成独立内容体系。现有学习路线仍把 Awesome Software Architecture、System Design Primer 等作为“查漏补缺”入口。
- `content/patterns/index.mdx` 目前主要覆盖 Agent 控制模式；`content/questions/index.mdx` 只有少量短题干。
- Awesome Software Architecture 当前约有 305 个 Markdown 页面。2026-07-23 的粗略文本盘点中，约 218 个页面接近链接清单，约 83 个页面只有很薄的说明；该数字只用于估算工作量，不作为内容质量判决。
- [Conceptual Modeling](https://awesome-architecture.com/modeling/conceptual-modeling/)、
  [Architectural Design Principles](https://awesome-architecture.com/architectural-design-principles/architectural-design-principles/)、
  [Design Patterns](https://awesome-architecture.com/design-patterns/design-patterns/) 和
  [Cloud Design Patterns](https://awesome-architecture.com/cloud-design-patterns/cloud-design-patterns/)
  都是典型的“有导航、缺少站内解释”页面。

## 选题与来源原则

### 外部来源的角色

1. **选题雷达**：Awesome Software Architecture、System Design Primer、awesome-scalability、其他 Awesome 列表。只用于发现主题和原始材料。
2. **定义与方法来源**：标准、SEI、C4、arc42、ADR、OWASP、NIST、原作者文章和奠基论文。
3. **模式来源**：Enterprise Integration Patterns、Patterns of Enterprise Application Architecture、Microservices.io、Azure/AWS/Google 架构中心。模式目录仍需回到原作者、标准或实现交叉核验。
4. **案例来源**：官方工程博客、开源仓库、论文、事故报告、会议演讲和可复查配置。企业自述必须标为企业自述。
5. **站内证据**：现有案例、后续案例、源码固定点、测试和本站说明性场景。

来源优先级为：标准/原作者/官方/论文/源码 > 工程团队一手材料 > 高质量二手解释 > 聚合索引。聚合索引不能成为结论的唯一来源。

### 版权边界

- 默认使用原创中文结构、原创解释、原创例子和重绘图，不做逐段翻译。
- 外部仓库的许可证不自动覆盖其链接的第三方文章、书籍、视频和图片。
- CC BY 内容保留作者、原链接、许可证和修改说明。
- CC BY-SA 内容在改编前检查本站许可证兼容性；不确定时只做短引用和原创总结。
- “All rights reserved”或许可不清的材料只用于事实核验和选题，不复制目录文案、定义集合、图表或案例叙事。
- 厂商参考架构必须分开写“通用机制”与“厂商实现”，不能把产品能力表述为行业保证。
- 真实案例的数字必须保留时间、环境和来源；没有公开结果时，不补造效果。

## 目标信息架构

长期内容按下列类型组织，避免把定理、原则、模式、风格和工具放在同一层：

| 类型 | 回答的问题 | 建议入口 |
| --- | --- | --- |
| `concept` | 术语是什么，边界在哪里 | `/concepts` |
| `principle` | 设计时应优先保护什么，何时不成立 | `/principles` |
| `quality-attribute` | 系统希望达到什么可验证质量 | `/quality-attributes` |
| `method` | 如何发现、记录、评审和演进架构 | `/methods` |
| `modeling` | 如何理解并表达问题、结构、行为和部署 | `/modeling` |
| `style` | 系统级组件、连接器和约束如何组织 | `/styles` |
| `pattern` | 特定上下文中的重复问题如何解决 | `/patterns` |
| `case` | 真实系统在明确约束下如何取舍 | `/cases` |
| `question` | 如何把知识用于设计与评审 | `/questions` |
| `path` | 应按什么依赖顺序学习 | `/paths` |

工具、云产品和框架默认不拥有知识主干页面。只有当它们能提供可迁移的架构机制或真实案例证据时，才进入案例或实现附录。

## 内容单元模板

### 原则页

必须回答：要保护的性质、产生冲突的上下文、机制、误用、反原则或张力、适用尺度、与相邻原则的关系、说明性场景、来源。

### 模式页

必须包含：问题、上下文、forces、方案、控制/状态/数据流、结果与代价、失败模式、替代方案、组合关系、何时不用、站内案例、来源。

### 架构风格页

必须包含：组件与连接器、边界、控制流、数据所有权、一致性、部署单元、故障域、团队拓扑、质量属性收益与成本、迁移路径、禁用条件、对比案例。

### 方法与建模页

必须包含：输入、参与者、步骤、产物、完成判断、常见失败、与其他方法的衔接、一个从问题到产物的完整演练、来源。

### 质量属性页

统一使用 `source → stimulus → environment → artifact → response → response measure` 场景结构，区分业务目标、架构策略、测量信号和接受阈值。

### 案例页

继续遵循现有十段式文章契约。折叠所有证据卡后，正文仍应完整解释控制、状态、任务流、失败、恢复、权衡和关键边界。

## 每个 TODO 的执行闭环

每个主题任务按以下顺序完成。一个普通主题页通常占一个工作日；复杂风格、方法或真实案例允许拆成 2–3 天，但每一天都应留下可审阅产物。

- [ ] 固定 3–5 个学习问题和读者应保留的判断。
- [ ] 建立 source ledger：URL、作者/机构、发布日期、核查日期、版本或 commit、来源类型、许可证、使用方式。
- [ ] 建立事实清单：事实、推断、未知、版本边界、相邻主题和禁止过度推导的结论。
- [ ] 按对应模板写出中文内化提纲，删除纯链接目录和同义重复。
- [ ] 完成正文、原创图或决策表、说明性场景、反例与不适用条件。
- [ ] 增加与路线、相邻知识页和案例的双向链接。
- [ ] 把来源登记到全站资料库或机器可读来源清单。
- [ ] 添加或更新结构、元数据、来源注册、链接和内容密度测试。
- [ ] 完成事实审校、版权审校、桌面/移动渲染审校。
- [ ] 更新本 backlog 状态；每十篇做一次术语、重复内容和导航复盘。

## 优先级

- **P0**：建立内容系统和知识主干；缺失会让后续文章继续成为孤岛。
- **P1**：补齐常用模式、风格、方法和生产能力；应在主干稳定后连续完成。
- **P2**：按案例、专题或读者问题拉动的深度内容。
- **P3**：具体工具和产品；只在有明确架构判断或案例价值时启动。

---

## E0：内容工程与现有债务

- [x] **E0-01 P0｜建立内容类型契约**：[`869050b`](https://github.com/sealday/agentic-architecture-atlas/commit/869050b4c69fae263ecdc45b329b33f1a03a1549) 已为 `concept`、`principle`、`quality-attribute`、`method`、`modeling` 和 `style` 落实必需元数据、章节顺序与校验测试，并由 [Pages run 30018577871](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30018577871) 成功发布。
- [x] **E0-02 P0｜建立唯一主题清单**：[`869050b`](https://github.com/sealday/agentic-architecture-atlas/commit/869050b4c69fae263ecdc45b329b33f1a03a1549) 已生成含 ID、类型、slug、优先级、只读状态投影、依赖、来源、相关案例和复核日期的 manifest 及十类索引；线上 [`/concepts`](https://sealday.github.io/agentic-architecture-atlas/concepts)、[`/quality-attributes`](https://sealday.github.io/agentic-architecture-atlas/quality-attributes)、[`/cases`](https://sealday.github.io/agentic-architecture-atlas/cases) 与 [`/paths`](https://sealday.github.io/agentic-architecture-atlas/paths) 已验证。
- [x] **E0-03 P0｜建立全站 source ledger**：[`3ff09a8`](https://github.com/sealday/agentic-architecture-atlas/commit/3ff09a86cbd2237bb60b3d9a08445b44fc06265e) 已建立 361-source canonical ledger、文档引用与公开资料库投影，并由 [Pages run 30062252970](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30062252970) 成功发布。
- [x] **E0-04 P0｜落实五类文章模板**：[`8052e80`](https://github.com/sealday/agentic-architecture-atlas/commit/8052e80ae085ab8a3703b53a5972a68ab5c0545c) 已发布原则、模式、风格、方法、建模和质量属性六篇生产 fixture，建立独立章节契约、来源治理与渲染检查，并由 [Pages run 30068337906](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30068337906) 成功部署。本次父故事完成不自动勾选主题项；`PR-01`、`REL-02`、`STY-00`、`MTH-03`、`MOD-02`、`QA-01` 等主题仍保持待办，须分别满足各自停止条件后再更新。
- [x] **E0-05 P0｜建立版权与署名检查表**：[`3ff09a8`](https://github.com/sealday/agentic-architecture-atlas/commit/3ff09a86cbd2237bb60b3d9a08445b44fc06265e) 已落实许可证、使用方式、署名、引文与改编边界的可执行版权矩阵，并由 [Pages run 30062252970](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30062252970) 成功发布。
- [x] **E0-06 P0｜拆分通用模式与 Agent 模式导航**：[`9eda726`](https://github.com/sealday/agentic-architecture-atlas/commit/9eda726df8c7ea13d758e2df89be2558129f822e) 已在 [`62eaa1a`](https://github.com/sealday/agentic-architecture-atlas/commit/62eaa1a58b971fd416ca7eeab570d57d69912cf1) 建立的 canonical registry 基础上，为通用设计、集成、可靠性、数据和迁移模式提供独立分组，保留完整 Agent 控制内容，并由 [Pages run 30069822760](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30069822760) 成功发布；72 个 Pattern topic 均唯一归组，计划主题不生成站内链接。
- [x] **E0-07 P0｜修复案例分类扩展性**：最终实现 commit [`192dd70`](https://github.com/sealday/agentic-architecture-atlas/commit/192dd7030c34849c8ce90969686896a313836940) 在 [`9906bc2`](https://github.com/sealday/agentic-architecture-atlas/commit/9906bc2da8a772836d68cd35e0093869c6581f06) 建立的 canonical case-series registry 基础上，通过 [`e159626`](https://github.com/sealday/agentic-architecture-atlas/commit/e159626ca180c77f947ec13d0872045e60ade1ed) 将 New API、LiteLLM 与 Kong 归入 `agent-platform-gateway`，并让筛选、分组、标签与首页可见性消费生成 registry；既有 18 个案例 slug 和顺序保持不变，并由 [Pages run 30071129911](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30071129911) 成功发布。
- [x] **E0-08 P0｜把事实库存扩到全部 18 篇案例**：事实库存测试现由 18-case canonical manifest 校验覆盖集合，并保护 New API、LiteLLM、Kong 的关键运行字段；不再保留固定 15 篇断言。
- [x] **E0-09 P0｜补齐学习路线图片资产**：图片已提交到 `static/img/paths/software-architecture-learning-roadmap.png`，学习路线测试校验文件存在，且[线上图片 URL](https://sealday.github.io/agentic-architecture-atlas/img/paths/software-architecture-learning-roadmap.png)返回成功。
- [x] **E0-10 P0｜标记过期历史计划**：单页学习路线、五篇首发案例和十五篇案例阶段的 design/plan 均已标为 `Superseded`，并链接到当前替代文档或本 backlog。
- [x] **E0-11 P1｜建立外链健康检查**：[`3ff09a8`](https://github.com/sealday/agentic-architecture-atlas/commit/3ff09a86cbd2237bb60b3d9a08445b44fc06265e) 已提交覆盖 360 个 transport 的已审缓存、离线失败门禁与只读定时/手工 live workflow，并由 [Pages run 30062252970](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30062252970) 成功发布。
- [x] **E0-12 P1｜建立“索引不等于证据”检查**：[`3ff09a8`](https://github.com/sealday/agentic-architecture-atlas/commit/3ff09a86cbd2237bb60b3d9a08445b44fc06265e) 已强制 `community-index` 只能承担 discovery/learning，不能满足事实证据门槛，并由 [Pages run 30062252970](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30062252970) 成功发布。
- [x] **E0-13 P1｜建立页面间关系检查**：最终实现 commit [`87c5d9c`](https://github.com/sealday/agentic-architecture-atlas/commit/87c5d9cf226457a57bdcaefd376827e974a3e95d) 在 [`56d5e72`](https://github.com/sealday/agentic-architecture-atlas/commit/56d5e72a4e36d7167b0d7b6c584d93e4cf0b0e4d) 与 [`6a1388b`](https://github.com/sealday/agentic-architecture-atlas/commit/6a1388b64a2d05da81810354a15bf4804ff90b22) 建立的关系元数据、目标合法性和互惠相邻检查基础上，通过 [`df76fd8`](https://github.com/sealday/agentic-architecture-atlas/commit/df76fd8fd431c4a93376990d18fa5322dcbd4532) 把上位入口、全部已发布相邻主题及至少一个案例或练习的正文可见链接纳入生成门禁，并关闭图片、linked-image 与 JSX 伪属性绕过；六篇知识页已由 [Pages run 30073279141](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30073279141) 成功发布并逐页验证。
- [x] **E0-14 P1｜建立周期复核机制**：完整实现已随 [`9cf9cf0`](https://github.com/sealday/agentic-architecture-atlas/commit/9cf9cf029603aee97b068f6978fda4e976887f14) 由 [Pages run 30079287376](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30079287376) 成功部署；363 个 registered source 与显式季度策略驱动确定性的月度/季度结构化报告，新增来源报告保留稳定 ID 并列出 canonical 引用文档、roles 与 discovery/learning-only 边界，到期判断只接受显式策略和日历月间隔。只读 [monthly workflow run 30079367933](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30079367933) 已成功上传 `source-link-health-live` 和 `content-review-health`：362 个去重 transport 的 live 结果为 359 healthy、2 auth-required、1 retired、0 stale/errors；2026-06-01 至 2026-07-01 复核窗口的 inputs、policy 与 review-health gate 全部通过，new/rechecked/orphan/due/approaching 均为 0。

## E1：架构基础、质量属性与评审方法

### 基础概念

- [x] **FND-01 P0｜软件架构、应用设计与代码设计的尺度边界**：核心内容 [`48a72a1`](https://github.com/sealday/agentic-architecture-atlas/commit/48a72a1)、最终修复 [`0f6eebb`](https://github.com/sealday/agentic-architecture-atlas/commit/0f6eebb) 与最终评审 [`c68f134`](https://github.com/sealday/agentic-architecture-atlas/commit/c68f134) 已由 [Pages run 30089504406](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30089504406) 成功部署；线上 [`/concepts/fnd-01`](https://sealday.github.io/agentic-architecture-atlas/concepts/fnd-01) 已验证。
- [x] **FND-02 P0｜架构驱动因素**：业务目标、约束、质量属性和架构重要需求（ASR）；核心内容 [`48a72a1`](https://github.com/sealday/agentic-architecture-atlas/commit/48a72a1)、最终修复 [`0f6eebb`](https://github.com/sealday/agentic-architecture-atlas/commit/0f6eebb) 与最终评审 [`c68f134`](https://github.com/sealday/agentic-architecture-atlas/commit/c68f134) 已由 [Pages run 30089504406](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30089504406) 成功部署；线上 [`/concepts/fnd-02`](https://sealday.github.io/agentic-architecture-atlas/concepts/fnd-02) 已验证。
- [x] **FND-03 P0｜原则、战术、模式、风格、参考架构和最佳实践的分类边界**：核心内容 [`48a72a1`](https://github.com/sealday/agentic-architecture-atlas/commit/48a72a1)、最终修复 [`0f6eebb`](https://github.com/sealday/agentic-architecture-atlas/commit/0f6eebb) 与最终评审 [`c68f134`](https://github.com/sealday/agentic-architecture-atlas/commit/c68f134) 已由 [Pages run 30089504406](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30089504406) 成功部署；线上 [`/concepts/fnd-03`](https://sealday.github.io/agentic-architecture-atlas/concepts/fnd-03) 已验证。
- [x] **FND-04 P0｜权衡、敏感点、权衡点、风险与非风险**。证据：[implementation `15afc9d`](https://github.com/sealday/agentic-architecture-atlas/commit/15afc9d)、[Stage A deploy/review `eea2d76`](https://github.com/sealday/agentic-architecture-atlas/commit/eea2d76)、[Pages run `30095517683`](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30095517683)；[live route](https://sealday.github.io/agentic-architecture-atlas/concepts/fnd-04) 于 2026-07-24 live smoke 200/标题通过。
- [x] **FND-05 P1｜技术债、架构债与演进式设计**。证据：[implementation `15afc9d`](https://github.com/sealday/agentic-architecture-atlas/commit/15afc9d)、[Stage A deploy/review `eea2d76`](https://github.com/sealday/agentic-architecture-atlas/commit/eea2d76)、[Pages run `30095517683`](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30095517683)；[live route](https://sealday.github.io/agentic-architecture-atlas/concepts/fnd-05) 于 2026-07-24 live smoke 200/标题通过。

### 质量属性

- [x] **QA-00 P0｜质量属性总览**：以 ISO/IEC 25010:2023 为主索引，并说明本站扩展的 operability、observability、cost 和 sustainability 视角。Stage A [`6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7`](https://github.com/sealday/tego-arch/commit/6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7) 已由 Pages run [`30214900439`](https://github.com/sealday/tego-arch/actions/runs/30214900439) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-00`](https://sealday.github.io/tego-arch/quality-attributes/qa-00) 已完成 desktop/mobile、overflow、console 与相邻导航复核。
- [x] **QA-01 P0｜质量属性场景写法**：完成六字段模板和一个从模糊口号到可测试场景的演练。Stage A [`6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7`](https://github.com/sealday/tego-arch/commit/6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7) 已由 Pages run [`30214900439`](https://github.com/sealday/tego-arch/actions/runs/30214900439) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-01`](https://sealday.github.io/tego-arch/quality-attributes/qa-01) 已完成 desktop/mobile、overflow、console 与相邻导航复核。
- [x] **QA-02 P0｜可靠性、可用性与可恢复性**：区分故障、失效、恢复目标和数据丢失边界。Stage A [`6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7`](https://github.com/sealday/tego-arch/commit/6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7) 已由 Pages run [`30214900439`](https://github.com/sealday/tego-arch/actions/runs/30214900439) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-02`](https://sealday.github.io/tego-arch/quality-attributes/qa-02) 已完成 desktop/mobile、overflow、console 与相邻导航复核。
- [x] **QA-03 P0｜性能、延迟、吞吐与容量**：区分平均值、尾延迟、并发和饱和。Stage A [`6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7`](https://github.com/sealday/tego-arch/commit/6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7) 已由 Pages run [`30214900439`](https://github.com/sealday/tego-arch/actions/runs/30214900439) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-03`](https://sealday.github.io/tego-arch/quality-attributes/qa-03) 已完成 desktop/mobile、overflow、console 与相邻导航复核。
- [x] **QA-04 P0｜可扩展性与弹性**：区分规模增长、短时弹性和架构重分区。Stage A [`234630c1a7eece85ca605756c28c1f5fecb9eb3b`](https://github.com/sealday/tego-arch/commit/234630c1a7eece85ca605756c28c1f5fecb9eb3b) 已由 Pages run [`30220229198`](https://github.com/sealday/tego-arch/actions/runs/30220229198) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-04`](https://sealday.github.io/tego-arch/quality-attributes/qa-04)、[`/paths/distributed-systems`](https://sealday.github.io/tego-arch/paths/distributed-systems)、[`/paths/cloud-native-platform`](https://sealday.github.io/tego-arch/paths/cloud-native-platform)、[`qa-04-demand-capacity-scaling.png`](https://sealday.github.io/tego-arch/img/illustrations/qa-04-demand-capacity-scaling.png)、[`/references/primary/page/19`](https://sealday.github.io/tego-arch/references/primary/page/19) 与 [`/references/first-party/page/2`](https://sealday.github.io/tego-arch/references/first-party/page/2) 已完成 desktop `1440x1000` / mobile `390x844`、HTTP 200、CSS/JS、无 overflow、console warning/error 为 0 的 live smoke。
- [x] **QA-05 P1｜安全、隐私与信任边界**。Stage A [`a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a`](https://github.com/sealday/tego-arch/commit/a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a) 已由 Pages run [`30224008179`](https://github.com/sealday/tego-arch/actions/runs/30224008179) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-05`](https://sealday.github.io/tego-arch/quality-attributes/qa-05) 已完成 desktop/mobile、来源卡片、图片、overflow 与 console 复核。
- [x] **QA-06 P1｜可维护性、可修改性与可测试性**。Stage A [`234630c1a7eece85ca605756c28c1f5fecb9eb3b`](https://github.com/sealday/tego-arch/commit/234630c1a7eece85ca605756c28c1f5fecb9eb3b) 已由 Pages run [`30220229198`](https://github.com/sealday/tego-arch/actions/runs/30220229198) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-06`](https://sealday.github.io/tego-arch/quality-attributes/qa-06)、[`/paths/module-boundaries`](https://sealday.github.io/tego-arch/paths/module-boundaries)、[`qa-06-change-blast-radius-verification.png`](https://sealday.github.io/tego-arch/img/illustrations/qa-06-change-blast-radius-verification.png)、[`/references/primary/page/19`](https://sealday.github.io/tego-arch/references/primary/page/19) 与 [`/references/first-party/page/2`](https://sealday.github.io/tego-arch/references/first-party/page/2) 已完成 desktop `1440x1000` / mobile `390x844`、HTTP 200、CSS/JS、无 overflow、console warning/error 为 0 的 live smoke。
- [x] **QA-07 P1｜兼容性、互操作性与版本演进**。Stage A [`234630c1a7eece85ca605756c28c1f5fecb9eb3b`](https://github.com/sealday/tego-arch/commit/234630c1a7eece85ca605756c28c1f5fecb9eb3b) 已由 Pages run [`30220229198`](https://github.com/sealday/tego-arch/actions/runs/30220229198) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-07`](https://sealday.github.io/tego-arch/quality-attributes/qa-07)、[`/paths/agent-platform-gateway`](https://sealday.github.io/tego-arch/paths/agent-platform-gateway)、[`qa-07-compatibility-version-migration.png`](https://sealday.github.io/tego-arch/img/illustrations/qa-07-compatibility-version-migration.png)、[`/references/primary/page/19`](https://sealday.github.io/tego-arch/references/primary/page/19) 与 [`/references/first-party/page/2`](https://sealday.github.io/tego-arch/references/first-party/page/2) 已完成 desktop `1440x1000` / mobile `390x844`、HTTP 200、CSS/JS、无 overflow、console warning/error 为 0 的 live smoke。
- [x] **QA-08 P1｜可操作性与可观测性**：说明信号、诊断、控制动作和恢复责任。Stage A [`a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a`](https://github.com/sealday/tego-arch/commit/a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a) 已由 Pages run [`30224008179`](https://github.com/sealday/tego-arch/actions/runs/30224008179) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-08`](https://sealday.github.io/tego-arch/quality-attributes/qa-08) 已完成 desktop/mobile、来源卡片、图片、overflow 与 console 复核。
- [x] **QA-09 P1｜安全性（Safety）与物理风险**：与 Security 分开，并连接边缘/物理智能体专题。Stage A [`a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a`](https://github.com/sealday/tego-arch/commit/a2ca8ae4ecc2c5426432049dab2608c7df8e3f9a) 已由 Pages run [`30224008179`](https://github.com/sealday/tego-arch/actions/runs/30224008179) 成功部署；2026-07-27 线上 [`/quality-attributes/qa-09`](https://sealday.github.io/tego-arch/quality-attributes/qa-09) 已完成 desktop/mobile、来源卡片、图片、overflow 与 console 复核。
- [x] **QA-10 P2｜成本效率与可持续性**：已由实现 [`8a2f440`](https://github.com/sealday/tego-arch/commit/8a2f4408945919643f71a0aae48e009b537de377) 发布，Pages run [`30243000249`](https://github.com/sealday/tego-arch/actions/runs/30243000249) 成功；线上 [`/quality-attributes/qa-10`](https://sealday.github.io/tego-arch/quality-attributes/qa-10) 与原创插图已验证 HTTP 200。

### 方法

- [x] **MTH-01 P0｜QAW**：从利益相关者关切形成可排序的质量属性场景。证据：[implementation `15afc9d`](https://github.com/sealday/agentic-architecture-atlas/commit/15afc9d)、[Stage A deploy/review `eea2d76`](https://github.com/sealday/agentic-architecture-atlas/commit/eea2d76)、[Pages run `30095517683`](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30095517683)；[live route](https://sealday.github.io/agentic-architecture-atlas/methods/mth-01) 于 2026-07-24 live smoke 200/标题通过。
- [x] **MTH-02 P0｜ATAM**：用场景、架构方法、敏感点和权衡点评估风险。证据：[implementation `15afc9d`](https://github.com/sealday/agentic-architecture-atlas/commit/15afc9d)、[Stage A deploy/review `eea2d76`](https://github.com/sealday/agentic-architecture-atlas/commit/eea2d76)、[Pages run `30095517683`](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30095517683)；[live route](https://sealday.github.io/agentic-architecture-atlas/methods/mth-02) 于 2026-07-24 live smoke 200/标题通过。
- [x] **MTH-03 P0｜ADR 生命周期**：提出、接受、替代、废弃和重新评估。证据：[implementation `15afc9d`](https://github.com/sealday/agentic-architecture-atlas/commit/15afc9d)、[Stage A deploy/review `eea2d76`](https://github.com/sealday/agentic-architecture-atlas/commit/eea2d76)、[Pages run `30095517683`](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30095517683)；[live route](https://sealday.github.io/agentic-architecture-atlas/methods/mth-03) 于 2026-07-24 live smoke 200/标题通过。
- [x] **MTH-04 P1｜架构适应度函数**：integrated implementation `c4a76ac` 与 Stage A review/deploy `e196683` 经 [Pages run 30101647896](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30101647896) 发布；2026-07-24 smoke 确认 [live `/methods/mth-04`](https://sealday.github.io/agentic-architecture-atlas/methods/mth-04) 返回 200、标题正确，test/metric/monitor 不等于 SLO 或 release gate 的关键边界可见。
- [x] **MTH-05 P1｜风险风暴与预演**：integrated implementation `c4a76ac` 与 Stage A review/deploy `e196683` 经 [Pages run 30101647896](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30101647896) 发布；2026-07-24 smoke 确认 [live `/methods/mth-05`](https://sealday.github.io/agentic-architecture-atlas/methods/mth-05) 返回 200、标题正确，想象故障、模型分析与 GameDay 实际演练不等于生产保证的关键边界可见。
- [x] **MTH-06 P1｜从需求到演进的闭环**：integrated implementation `c4a76ac` 与 Stage A review/deploy `e196683` 经 [Pages run 30101647896](https://github.com/sealday/agentic-architecture-atlas/actions/runs/30101647896) 发布；2026-07-24 smoke 确认 [live `/methods/mth-06`](https://sealday.github.io/agentic-architecture-atlas/methods/mth-06) 返回 200、标题正确，反馈环顺序可变且 C4/arc42 不替代 QAW、ATAM、ADR 与适应度函数的关键边界可见。

主要来源：
[ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html)、
[SEI Quality Attributes](https://www.sei.cmu.edu/library/quality-attributes/)、
[SEI QAW](https://www.sei.cmu.edu/library/quality-attribute-workshops-qaws-third-edition/)、
[SEI ATAM](https://www.sei.cmu.edu/library/the-architecture-tradeoff-analysis-method-2/)、
[ADR](https://adr.github.io/)。

## E2：架构设计原则

- [x] **PR-01 P0｜信息隐藏与封装**：区分隐藏决策、隐藏数据和仅使用访问修饰符。Stage A [`66dbc54f8b570fe05c21f69eed87faf1222d6dea`](https://github.com/sealday/tego-arch/commit/66dbc54f8b570fe05c21f69eed87faf1222d6dea) 由 [Pages run `30327594616`](https://github.com/sealday/tego-arch/actions/runs/30327594616) 成功部署；2026-07-28 线上 [`/principles/pr-01`](https://sealday.github.io/tego-arch/principles/pr-01) 完成 desktop/mobile、Mermaid、overflow、console、来源和相邻导航检查。
- [x] **PR-02 P0｜高内聚与低耦合**：给出变化耦合、运行时耦合、数据耦合和团队耦合的比较。Stage A [`66dbc54f8b570fe05c21f69eed87faf1222d6dea`](https://github.com/sealday/tego-arch/commit/66dbc54f8b570fe05c21f69eed87faf1222d6dea) 由 [Pages run `30327594616`](https://github.com/sealday/tego-arch/actions/runs/30327594616) 成功部署；2026-07-28 线上 [`/principles/pr-02`](https://sealday.github.io/tego-arch/principles/pr-02) 完成 desktop/mobile、决策表、overflow、console、来源和相邻导航检查。
- [x] **PR-03 P0｜单一职责与关注点分离**：从“一个类只做一件事”提升到变化原因和责任边界。Stage A [`66dbc54f8b570fe05c21f69eed87faf1222d6dea`](https://github.com/sealday/tego-arch/commit/66dbc54f8b570fe05c21f69eed87faf1222d6dea) 由 [Pages run `30327594616`](https://github.com/sealday/tego-arch/actions/runs/30327594616) 成功部署；2026-07-28 线上 [`/principles/pr-03`](https://sealday.github.io/tego-arch/principles/pr-03) 完成 desktop/mobile、变化原因矩阵、Dijkstra EWD447、overflow、console 和相邻导航检查。
- [x] **PR-04 P0｜依赖倒置、控制反转与依赖注入**：分别说明原则、控制结构和实现技术。Stage A [`66dbc54f8b570fe05c21f69eed87faf1222d6dea`](https://github.com/sealday/tego-arch/commit/66dbc54f8b570fe05c21f69eed87faf1222d6dea) 由 [Pages run `30327594616`](https://github.com/sealday/tego-arch/actions/runs/30327594616) 成功部署；2026-07-28 线上 [`/principles/pr-04`](https://sealday.github.io/tego-arch/principles/pr-04) 完成 desktop/mobile、Mermaid、overflow、console、来源和相邻导航检查。
- [x] **PR-05 P0｜组合优于继承**：说明多态、共享实现、状态耦合和替换成本。Stage A [`66dbc54f8b570fe05c21f69eed87faf1222d6dea`](https://github.com/sealday/tego-arch/commit/66dbc54f8b570fe05c21f69eed87faf1222d6dea) 由 [Pages run `30327594616`](https://github.com/sealday/tego-arch/actions/runs/30327594616) 成功部署；2026-07-28 线上 [`/principles/pr-05`](https://sealday.github.io/tego-arch/principles/pr-05) 完成 desktop/mobile、决策表、overflow、console、来源和相邻导航检查。
- [x] **PR-06 P0｜KISS、YAGNI 与 DRY 的张力**：包含过早抽象和错误复用反例。Stage A [`5f586df19d51a9a29f88ad93c0b3a208ce3651f3`](https://github.com/sealday/tego-arch/commit/5f586df19d51a9a29f88ad93c0b3a208ce3651f3) 由 [Pages run `30339518113`](https://github.com/sealday/tego-arch/actions/runs/30339518113) 成功部署；2026-07-28 线上 [`/principles/pr-06`](https://sealday.github.io/tego-arch/principles/pr-06) 完成 desktop/mobile、决策表局部 overflow、无页面 overflow、零 console 诊断、Fowler/Pragmatic/SEI 受治理来源和相邻原则/案例真实点击检查。
- [x] **PR-07 P0｜Fail Fast、Fail Safe 与 Graceful Degradation**：按错误类型和副作用边界选择。Stage A [`5f586df19d51a9a29f88ad93c0b3a208ce3651f3`](https://github.com/sealday/tego-arch/commit/5f586df19d51a9a29f88ad93c0b3a208ce3651f3) 由 [Pages run `30339518113`](https://github.com/sealday/tego-arch/actions/runs/30339518113) 成功部署；2026-07-28 线上 [`/principles/pr-07`](https://sealday.github.io/tego-arch/principles/pr-07) 完成 desktop/mobile、决策表局部 overflow、无页面 overflow、零 console 诊断、AWS/Google SRE 受治理来源和相邻原则/质量属性/案例真实点击检查。
- [x] **PR-08 P0｜为演化设计**：兼容性、可替换点、渐进迁移和重新评估条件。Stage A [`5f586df19d51a9a29f88ad93c0b3a208ce3651f3`](https://github.com/sealday/tego-arch/commit/5f586df19d51a9a29f88ad93c0b3a208ce3651f3) 由 [Pages run `30339518113`](https://github.com/sealday/tego-arch/actions/runs/30339518113) 成功部署；2026-07-28 线上 [`/principles/pr-08`](https://sealday.github.io/tego-arch/principles/pr-08) 完成 desktop/mobile、Mermaid 局部 overflow、无页面 overflow、零 console 诊断、Fowler/Google/O'Reilly 受治理来源和相邻原则/方法/案例真实点击检查。
- [x] **PR-09 P0｜最小权限、安全默认值与纵深防御**：区分授权范围、默认拒绝与多层控制。Stage A [`c0497bbe8d1ef9d19e8ed99d69411764095f03ce`](https://github.com/sealday/tego-arch/commit/c0497bbe8d1ef9d19e8ed99d69411764095f03ce) 由 [Pages run `30356377127`](https://github.com/sealday/tego-arch/actions/runs/30356377127) 成功部署；2026-07-28 线上 [`/principles/pr-09`](https://sealday.github.io/tego-arch/principles/pr-09) 完成 desktop/mobile、表格适配、无页面 overflow、零 console 诊断、Saltzer/Schroeder 与 NIST SP 800-160 来源可见及 parent 1 + adjacent 3 + case 1（5/5）真实点击检查。
- [x] **PR-10 P0｜幂等与最小协调**：说明它们如何减少重试和分布式协作成本。Stage A [`c0497bbe8d1ef9d19e8ed99d69411764095f03ce`](https://github.com/sealday/tego-arch/commit/c0497bbe8d1ef9d19e8ed99d69411764095f03ce) 由 [Pages run `30356377127`](https://github.com/sealday/tego-arch/actions/runs/30356377127) 成功部署；2026-07-28 线上 [`/principles/pr-10`](https://sealday.github.io/tego-arch/principles/pr-10) 完成 desktop/mobile、表格局部 `overflow-x:auto`、无页面 overflow、零 console 诊断、AWS idempotent APIs 与 Berkeley coordination avoidance 来源可见及 parent 1 + adjacent 4 + case 1（6/6）真实点击检查。
- [x] **PR-11 P1｜CQS、CQRS 与读写分离**：纠正把不同尺度概念混为一谈。Stage A [`c0497bbe8d1ef9d19e8ed99d69411764095f03ce`](https://github.com/sealday/tego-arch/commit/c0497bbe8d1ef9d19e8ed99d69411764095f03ce) 由 [Pages run `30356377127`](https://github.com/sealday/tego-arch/actions/runs/30356377127) 成功部署；2026-07-28 线上 [`/principles/pr-11`](https://sealday.github.io/tego-arch/principles/pr-11) 完成 desktop/mobile、表格适配、无页面 overflow、零 console 诊断、Fowler CQS/CQRS、Microsoft CQRS 与 Amazon RDS read replicas 来源可见及 parent 1 + adjacent 3 + case 1（5/5）真实点击检查。
- [x] **PR-12 P1｜Open/Closed 与 Interface Segregation**：说明扩展点成本和接口碎片化风险。Stage A [`bed310e71808e7c19821c6efac8b084876cfb552`](https://github.com/sealday/tego-arch/commit/bed310e71808e7c19821c6efac8b084876cfb552) 由 [Pages run `30422992605`](https://github.com/sealday/tego-arch/actions/runs/30422992605) 以 exact head SHA、`completed/success` 部署；2026-07-29 线上 [`/principles/pr-12`](https://sealday.github.io/tego-arch/principles/pr-12) 完成 desktop `1440x1000`、mobile `390x844`、无 document overflow、表格适配、0 warnings、0 errors、Object Mentor OCP/ISP 来源可见及 parent 1 + adjacent 7 + case/question 1（9/9）真实点击检查。
- [x] **PR-13 P1｜Persistence Ignorance**：说明领域模型纯度与查询、事务、性能现实之间的边界。Stage A [`bed310e71808e7c19821c6efac8b084876cfb552`](https://github.com/sealday/tego-arch/commit/bed310e71808e7c19821c6efac8b084876cfb552) 由 [Pages run `30422992605`](https://github.com/sealday/tego-arch/actions/runs/30422992605) 以 exact head SHA、`completed/success` 部署；2026-07-29 线上 [`/principles/pr-13`](https://sealday.github.io/tego-arch/principles/pr-13) 完成两种视口、无 document overflow、Mermaid contained overflow、0 warnings、0 errors、Nilsson/Addison-Wesley 与 both Microsoft pages 来源可见及 parent 1 + adjacent 3 + case/question 1（5/5）真实点击检查。
- [x] **PR-14 P1｜GRASP 责任分配**：Information Expert、Creator、Controller、Low Coupling、High Cohesion 等形成一篇责任决策页。Stage A [`bed310e71808e7c19821c6efac8b084876cfb552`](https://github.com/sealday/tego-arch/commit/bed310e71808e7c19821c6efac8b084876cfb552) 由 [Pages run `30422992605`](https://github.com/sealday/tego-arch/actions/runs/30422992605) 以 exact head SHA、`completed/success` 部署；2026-07-29 线上 [`/principles/pr-14`](https://sealday.github.io/tego-arch/principles/pr-14) 完成两种视口、无 document overflow、Mermaid 与 table contained overflow、0 warnings、0 errors、Pearson/Larman 与 Larman author 来源可见及 parent 1 + adjacent 4 + case/question 1（6/6）真实点击检查。
- [x] **PR-15 P1｜Conway 定律与团队边界**：说明描述性规律、反向康威策略和组织改造成本。Stage A [`2169c3a0f09fc9edbe4589ea657d1383eeecf758`](https://github.com/sealday/tego-arch/commit/2169c3a0f09fc9edbe4589ea657d1383eeecf758) 由 [Pages run `30445404784`](https://github.com/sealday/tego-arch/actions/runs/30445404784) 以 exact head SHA、`completed/success` 部署；2026-07-29 线上 [`/principles/pr-15`](https://sealday.github.io/tego-arch/principles/pr-15) 完成 desktop `1440x1000`、mobile `390x844`、无 document overflow、800px Draw.io/SVG 的 contained overflow 与 focus/scroll、0 warnings、0 errors、Mel Conway、Team Topologies 与原创图来源可见及 parent 1 + adjacent 4 + case 1（6/6）真实点击检查。
- [x] **PR-16 P2｜Secure by Design**：连接威胁建模、最小权限、默认拒绝与安全验证。Stage A [`2169c3a0f09fc9edbe4589ea657d1383eeecf758`](https://github.com/sealday/tego-arch/commit/2169c3a0f09fc9edbe4589ea657d1383eeecf758) 由 [Pages run `30445404784`](https://github.com/sealday/tego-arch/actions/runs/30445404784) 以 exact head SHA、`completed/success` 部署；2026-07-29 线上 [`/principles/pr-16`](https://sealday.github.io/tego-arch/principles/pr-16) 完成两种视口、无 document overflow、Mermaid contained overflow、0 warnings、0 errors、CISA、NIST 与 OWASP 来源可见及 parent 1 + adjacent 3 + case 1（5/5）真实点击检查。
- [x] **PR-17 P2｜不要重复原站的分类错误**：把 CAP 放到分布式理论，把 Strangler 放到迁移模式，把 GRASP 放到责任分配方法。Stage A [`2169c3a0f09fc9edbe4589ea657d1383eeecf758`](https://github.com/sealday/tego-arch/commit/2169c3a0f09fc9edbe4589ea657d1383eeecf758) 由 [Pages run `30445404784`](https://github.com/sealday/tego-arch/actions/runs/30445404784) 以 exact head SHA、`completed/success` 部署；2026-07-29 线上 [`/principles/pr-17`](https://sealday.github.io/tego-arch/principles/pr-17) 完成两种视口、无 document overflow、800px Draw.io/SVG 的 contained overflow 与 focus/scroll、0 warnings、0 errors、CAP、Fowler、Larman 与原创图来源可见及 parent 1 + adjacent 2 + case 1（4/4）真实点击检查。

## E3：建模、图示与架构文档

- [x] **MOD-01 P0｜建模总览**：问题空间、结构、行为、数据、部署和决策分别用什么模型。Stage A [`f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72`](https://github.com/sealday/tego-arch/commit/f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72) 由 [Pages run `30529090957`](https://github.com/sealday/tego-arch/actions/runs/30529090957) 以 exact `headSha`、`completed/success` 部署；2026-07-30 canonical live route [`/modeling/mod-01`](https://sealday.github.io/tego-arch/modeling/mod-01) 属于 7/7 HTTP、8/8 page/viewport 检查，desktop `1440x1000`、mobile `390x844`、无 document overflow，decision table contained overflow，keyboard focus/scroll 可用，0 warnings、0 errors；2/2 Mermaid、3/3 diagram、9/9 source label（含最终标题“费用申报系统 Deployment 教学演练假设拓扑”）与 13/13 次真实鼠标 relation 点击均通过。
- [x] **MOD-02 P0｜C4 Context 与 Container**：完成一个系统边界和部署责任演练。Stage A [`f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72`](https://github.com/sealday/tego-arch/commit/f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72) 由 [Pages run `30529090957`](https://github.com/sealday/tego-arch/actions/runs/30529090957) 以 exact `headSha`、`completed/success` 部署；2026-07-30 canonical live route [`/modeling/mod-02`](https://sealday.github.io/tego-arch/modeling/mod-02) 属于 7/7 HTTP、8/8 page/viewport 检查，desktop `1440x1000`、mobile `390x844`、无 document overflow，diagram contained overflow，keyboard focus/scroll 可用，0 warnings、0 errors；2/2 Mermaid、3/3 diagram、9/9 source label（含权威名称“银行支付服务”及最终标题“费用申报系统 Deployment 教学演练假设拓扑”）与 13/13 次真实鼠标 relation 点击均通过。
- [x] **MOD-03 P0｜C4 Component、Dynamic 与 Deployment**：说明何时需要，何时制造伪精确。Stage A [`f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72`](https://github.com/sealday/tego-arch/commit/f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72) 由 [Pages run `30529090957`](https://github.com/sealday/tego-arch/actions/runs/30529090957) 以 exact `headSha`、`completed/success` 部署；2026-07-30 canonical live route [`/modeling/mod-03`](https://sealday.github.io/tego-arch/modeling/mod-03) 属于 7/7 HTTP、8/8 page/viewport 检查，desktop `1440x1000`、mobile `390x844`、无 document overflow，diagram contained overflow，keyboard focus/scroll 可用，0 warnings、0 errors；2/2 Mermaid、3/3 diagram、9/9 source label（含最终标题“费用申报系统 Deployment 教学演练假设拓扑”）与 13/13 次真实鼠标 relation 点击均通过。
- [x] **MOD-04 P0｜arc42 文档骨架**：把现有案例映射到约束、构建块、运行时、部署、决策、风险。Stage A [`ef04cdbc84c2303c115855f571e061262cdbba5f`](https://github.com/sealday/tego-arch/commit/ef04cdbc84c2303c115855f571e061262cdbba5f) 由 [Pages run `30543389172`](https://github.com/sealday/tego-arch/actions/runs/30543389172) 以 exact `headSha`、`completed/success` 部署；2026-07-30 canonical live route [`/modeling/mod-04`](https://sealday.github.io/tego-arch/modeling/mod-04) 属于 5/5 HTTP canonical route 检查，desktop `1440x1000`、mobile `390x844`、无 document overflow，mapping table contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，0 warnings、0 errors；1/1 Mermaid、1/1 mapping table、7/7 source label 与 20/20 次 relation 点击均通过。
- [x] **MOD-05 P0｜概念、逻辑与物理数据模型**：用同一业务问题展示三层模型如何逐步加入实现决策。Stage A [`e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407`](https://github.com/sealday/tego-arch/commit/e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407) 由 [Pages run `30610324378`](https://github.com/sealday/tego-arch/actions/runs/30610324378) 以 exact `headSha`、`completed/success` 部署；2026-07-31 canonical live route [`/modeling/mod-05`](https://sealday.github.io/tego-arch/modeling/mod-05) 属于 6/6 HTTP canonical route 检查（含 [`/references`](https://sealday.github.io/tego-arch/references)），desktop `1440x1000`、mobile `390x844`、无 document overflow，Mermaid 与 mapping table 使用 contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，0 warnings、0 errors；1/1 Mermaid、1/1 mapping table（4 data rows）、5/5 source label、10/10 次 source 点击与 12/12 次 relation 点击均通过。
- [x] **MOD-06 P0｜ER 模型与关系边界**：实体身份、关系、基数、约束和历史变化。Stage A [`63d22725f2b16b92b5821828008b4ba4e56763e1`](https://github.com/sealday/tego-arch/commit/63d22725f2b16b92b5821828008b4ba4e56763e1) 由 [Pages run `30626326632`](https://github.com/sealday/tego-arch/actions/runs/30626326632) 以 exact `headSha`、`completed/success` 部署；2026-07-31 canonical live route [`/modeling/mod-06`](https://sealday.github.io/tego-arch/modeling/mod-06) 属于 6/6 HTTP canonical route 检查（含 [`/modeling`](https://sealday.github.io/tego-arch/modeling) 与 [`/references`](https://sealday.github.io/tego-arch/references)），desktop `1440x1000`、mobile `390x844`、无 document overflow，Mermaid 与两张 table 使用 contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，0 warnings、0 errors、0 page errors；1/1 Mermaid（6 entities、7 relationships）、2/2 tables（4 + 6 data rows）、4/4 source label、8/8 次 source 点击、10/10 次 relation 点击，MOD-05 backlink 在两种视口均通过，且无 MOD-07/MOD-08 链接。
- [x] **MOD-07 P0｜UML 选图指南**：sequence、state、deployment、class、use case 各自证明什么。Stage A [`21fb1c26624920e78f62ae1c947ff6812fb97e02`](https://github.com/sealday/tego-arch/commit/21fb1c26624920e78f62ae1c947ff6812fb97e02) 由 [Pages run `30707375989`](https://github.com/sealday/tego-arch/actions/runs/30707375989) 以 exact `headSha`、`completed/success` 部署；2026-08-01 canonical live route [`/modeling/mod-07`](https://sealday.github.io/tego-arch/modeling/mod-07) 属于 8/8 HTTP canonical route 检查，desktop `1440x1000`、mobile `390x844`、无 document overflow，Mermaid 与五行证据边界表使用 contained horizontal overflow，keyboard focus/ArrowRight scroll 可用，0 warnings、0 errors、0 page errors；1/1 Mermaid、1/1 五行证据边界表、5/5 条评审记录、4/4 source label、8/8 次 source 点击与 16/16 次 relation 点击均通过，MOD-08 无 article link 且无 operator request。
- [x] **MOD-08 P1｜状态机建模**：终态、超时、取消、补偿和人工终态。Stage A [`c6f00af333640dca5b65b92c77ed9dea34df4964`](https://github.com/sealday/tego-arch/commit/c6f00af333640dca5b65b92c77ed9dea34df4964) 由 [Pages run `30734305213`](https://github.com/sealday/tego-arch/actions/runs/30734305213) 以 exact `headSha`、`completed/success` 部署；2026-08-02 canonical live route [`/modeling/mod-08`](https://sealday.github.io/tego-arch/modeling/mod-08) 属于 8/8 HTTP canonical route 检查，desktop `1440x1000`、mobile `390x844`、无 document overflow，2/2 Mermaid region/SVG、1/1 七行映射表、10/10 次 source 激活与 16/16 次 relation 激活均通过，26 次 closed-world operator action 未触及 MOD-09，0 warnings、0 errors、0 page errors；Task 4 raw artifact SHA-256 为 `6888658877c9187cd7f387b4619bce8de9beb6886c33bf25fe6e1e24af0ca51b`。
- [x] **MOD-09 P1｜EventStorming**：输入、参与者、产物、热点和从事件到边界的推导限制。
- [x] **MOD-10 P1｜Domain Storytelling**：与流程图、用例和 EventStorming 比较。
- [x] **MOD-11 P1｜DDD Context Map**：关系模式、语言边界、集成责任和团队所有权。
- [x] **MOD-12 P1｜架构图审阅清单**：标题、范围、图例、边界、数据、协议、信任域、失败域和版本。
- [x] **MOD-13 P2｜模型同步策略**：代码、图、ADR 和部署事实如何避免长期漂移。

主要来源：
[C4 Model](https://c4model.com/)、
[arc42](https://arc42.org/overview)、
[EventStorming](https://www.eventstorming.com/book/)。

## E4：架构风格与边界

- [x] **STY-00 P0｜架构风格比较框架**：统一使用边界、控制流、数据所有权、一致性、部署、故障域、团队拓扑和质量属性比较。
- [x] **STY-01 P0｜Layered Architecture**。
- [x] **STY-02 P0｜Hexagonal、Onion 与 Clean Architecture 对照**：合并共性，保留依赖规则和命名差异，避免三篇重复定义。
- [x] **STY-03 P0｜Vertical Slice Architecture**：与分层、组件和领域边界比较。
- [ ] **STY-04 P0｜Modular Monolith**：模块隔离、数据库边界、部署耦合和拆分条件。
- [ ] **STY-05 P0｜Microservices**：服务边界、独立部署、数据所有权、分布式成本和组织前提。
- [ ] **STY-06 P0｜Event-Driven Architecture**：事件通知、状态转移、事件携带状态和事件溯源的边界。
- [ ] **STY-07 P1｜Service-Oriented Architecture**：与微服务和企业集成的历史与机制差异。
- [ ] **STY-08 P1｜Actor Model**：隔离状态、邮箱、监督、位置透明与分布式边界。
- [ ] **STY-09 P1｜Pipes and Filters**：批处理、流处理、背压和错误传播。
- [ ] **STY-10 P1｜Microkernel / Plug-in Architecture**：扩展点、兼容性和插件隔离。
- [ ] **STY-11 P1｜Serverless Architecture**：执行模型、状态、并发、冷启动、成本和供应商边界。
- [ ] **STY-12 P1｜Micro-Frontend**：运行时组合、团队所有权、共享依赖和故障隔离。
- [ ] **STY-13 P2｜Space-Based Architecture**：仅在找到足够一手机制与案例后启动。
- [ ] **STY-14 P1｜风格选择矩阵**：用三个相同业务场景比较 Modular Monolith、Microservices 与 Event-Driven。

## E5：DDD、企业应用模式与代码级设计模式

### DDD 与企业应用

- [ ] **DDD-01 P0｜战略 DDD 总览**：子域、统一语言、Bounded Context 和 Context Map。
- [ ] **DDD-02 P0｜聚合与一致性边界**：事务、并发、引用和跨聚合流程。
- [ ] **DDD-03 P0｜Entity、Value Object 与 Domain Primitive**。
- [ ] **DDD-04 P0｜Domain Service、Application Service 与 Infrastructure Service**。
- [ ] **DDD-05 P1｜Domain Event 与 Integration Event**：语义、事务边界、发布时机和兼容性。
- [ ] **DDD-06 P1｜Context Mapping 模式**：ACL、Open Host Service、Published Language、Customer/Supplier 等。
- [ ] **APP-01 P0｜Transaction Script、Table Module 与 Domain Model 对照**。
- [ ] **APP-02 P0｜Repository、Unit of Work 与 Data Mapper**。
- [ ] **APP-03 P1｜Specification 与 Query Object**。
- [ ] **APP-04 P1｜Service Layer 与 Application Service**。

### 设计模式核心集

- [ ] **DP-01 P1｜Adapter 与 Anti-Corruption Layer**：代码接口适配与上下文语义翻译的尺度差异。
- [ ] **DP-02 P1｜Strategy 与 Policy**。
- [ ] **DP-03 P1｜Observer 与发布订阅**：进程内通知和跨网络消息的边界。
- [ ] **DP-04 P1｜Command、Command Message 与 CQS**。
- [ ] **DP-05 P1｜Decorator 与中间件链**。
- [ ] **DP-06 P1｜Factory、Builder 与对象创建边界**。
- [ ] **DP-07 P1｜State Pattern 与显式状态机**。
- [ ] **DP-08 P1｜Chain of Responsibility 与责任链失败语义**。
- [ ] **DP-09 P1｜Mediator 与消息中介**。
- [ ] **DP-10 P2｜Service Locator 反模式**：与依赖注入比较。

模式来源只提供术语和线索。正文不得复刻
[Fowler EAA Catalog](https://martinfowler.com/eaaCatalog/)、
[Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/) 或书籍章节结构。

## E6：分布式、数据与集成模式

### 基础机制

- [ ] **DST-01 P0｜CAP、网络分区与可用性选择**：从请求结果而不是三字母口号解释。
- [ ] **DST-02 P0｜一致性模型总览**：线性一致、顺序一致、因果一致、最终一致和会话保证。
- [ ] **DST-03 P0｜消息交付语义**：at-most-once、at-least-once、effectively-once 与业务副作用。
- [ ] **DST-04 P0｜超时、不确定结果与重复执行窗口**。
- [ ] **DST-05 P0｜复制**：leader/follower、quorum、延迟副本和故障切换边界。
- [ ] **DST-06 P0｜分片与再均衡**。
- [ ] **DST-07 P1｜一致性哈希与虚拟节点**。
- [ ] **DST-08 P1｜分布式锁与租约**：fencing token、时钟和所有权过期。
- [ ] **DST-09 P1｜缓存与源数据权威**：cache-aside、失效、穿透、击穿和陈旧读。

### 一致性与事件模式

- [ ] **PAT-DC-01 P0｜Transactional Outbox**。
- [ ] **PAT-DC-02 P0｜Inbox / Idempotent Consumer**。
- [ ] **PAT-DC-03 P0｜Saga 与补偿事务**：orchestration、choreography 和不可补偿副作用。
- [ ] **PAT-DC-04 P0｜CDC**：日志捕获、顺序、schema 演进和重放。
- [ ] **PAT-DC-05 P0｜CQRS**：模型分离、数据同步和查询陈旧。
- [ ] **PAT-DC-06 P1｜Event Sourcing**：事件作为事实、投影、版本和重建成本。
- [ ] **PAT-DC-07 P1｜Materialized View**。
- [ ] **PAT-DC-08 P1｜Compensating Transaction**：与业务撤销、技术回滚比较。
- [ ] **PAT-DC-09 P1｜Exactly-once 声明审查**：分别检查传输、处理、状态提交和外部副作用。

### 集成与伸缩

- [ ] **PAT-IN-01 P0｜API Gateway**：路由、认证、聚合、策略执行和单点边界。
- [ ] **PAT-IN-02 P0｜BFF**：客户端差异、重复逻辑和团队所有权。
- [ ] **PAT-IN-03 P0｜Anti-Corruption Layer**。
- [ ] **PAT-IN-04 P1｜Service Discovery 与 Registry**。
- [ ] **PAT-IN-05 P1｜Message Router、Filter、Translator 与 Aggregator 组合**。
- [ ] **PAT-IN-06 P1｜Competing Consumers 与 Queue-Based Load Leveling**。
- [ ] **PAT-IN-07 P1｜Sidecar 与 Ambassador**：部署、信任、资源和故障边界。
- [ ] **PAT-IN-08 P2｜AsyncAPI 与消息契约演进**。

### 迁移模式

- [ ] **PAT-MIG-01 P0｜Strangler Fig 渐进迁移**：按可观测业务切片逐步替换旧系统，并定义流量迁移、回退和退役条件。
- [ ] **PAT-MIG-02 P1｜Branch by Abstraction**：在稳定抽象后并行替换实现，控制双写、切换和旧分支删除窗口。
- [ ] **PAT-MIG-03 P1｜Expand/Contract**：用兼容性扩展、分阶段迁移和最终收缩完成 schema/API 演进。

## E7：可靠性、可观测性、安全与生产治理

### 可靠性模式

- [ ] **REL-01 P0｜Timeout Budget**：连接、请求、任务和端到端 deadline。
- [ ] **REL-02 P0｜Retry、Exponential Backoff 与 Jitter**：重试资格、预算和放大风险。
- [ ] **REL-03 P0｜Circuit Breaker**：状态机、探测、恢复和错误分类。
- [ ] **REL-04 P0｜Bulkhead 与 Cell**：资源隔离、租户映射、容量和故障半径。
- [ ] **REL-05 P0｜Back Pressure、Load Shedding 与 Queue Limit**。
- [ ] **REL-06 P0｜Rate Limit、Quota 与 Admission Control**。
- [ ] **REL-07 P1｜Health Check、Liveness、Readiness 与真实可服务性**。
- [ ] **REL-08 P1｜High Availability 与 Disaster Recovery**：RTO、RPO、故障转移和恢复演练。
- [ ] **REL-09 P1｜Graceful Shutdown 与任务排空**。
- [ ] **REL-10 P1｜Chaos / Fault Injection**：假设、保护边界和停止条件。

### 运行与安全

- [ ] **OPS-01 P0｜SLI、SLO 与错误预算**。
- [ ] **OPS-02 P0｜Metrics、Logs、Traces 与 Profiles 的证据边界**。
- [ ] **OPS-03 P0｜分布式追踪与业务关联 ID**。
- [ ] **OPS-04 P1｜容量规划、饱和点与排队效应**。
- [ ] **OPS-05 P1｜渐进发布、回滚与版本兼容窗口**。
- [ ] **OPS-06 P1｜事故响应、复盘与架构反馈闭环**。
- [ ] **SEC-01 P0｜Threat Modeling**：资产、信任边界、威胁、缓解和剩余风险。
- [ ] **SEC-02 P0｜身份、认证、授权与委托链**。
- [ ] **SEC-03 P1｜Zero Trust Architecture**：以 NIST SP 800-207 为定义边界。
- [ ] **SEC-04 P1｜Secrets、Key Management 与凭据轮换**。
- [ ] **SEC-05 P1｜软件供应链、SBOM、签名与准入**。
- [ ] **SEC-06 P1｜安全验证清单**：把 OWASP ASVS/SAMM 控制映射到架构检查点。

主要来源：
[Google SRE Books](https://sre.google/books/)、
[AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/2025-02-25/framework/the-pillars-of-the-framework.html)、
[OWASP Secure by Design](https://owasp.org/www-project-secure-by-design-framework/)、
[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)。

## E8：云原生与平台专题

以下任务直接承接 `content/paths/07-cloud-native-platform.mdx` 的公开缺口：

- [ ] **CLD-01 P1｜镜像供应链、签名验证、制品晋级与运行时准入案例**。
- [ ] **CLD-02 P1｜Service Mesh、Gateway API 与多集群流量故障切换比较**。
- [ ] **CLD-03 P1｜HPA、VPA、集群扩容和队列背压的容量联动案例**。
- [ ] **CLD-04 P1｜GitOps 漂移处理、IaC 状态所有权和平台 API 版本演进案例**。
- [ ] **CLD-05 P1｜从 SLI 到错误预算、发布暂停和复盘的完整闭环案例**。
- [ ] **CLD-06 P2｜平台工程责任模型**：业务团队、平台团队、安全团队和基础设施供应商的边界。
- [ ] **CLD-07 P2｜CNCF Reference Architecture 案例组**：先核验 Adobe、AllianzDirect、Swisscom、CERN 中哪些具备足够一手证据。

## E9：协作前端、边缘物理与 Agent 平台专题

### 协作状态与前端

- [ ] **FE-01 P1｜OT 与 CRDT 在同一编辑场景中的语义和失败窗口对照**。
- [ ] **FE-02 P1｜离线队列、快照压缩、增量同步与服务端恢复案例**。
- [ ] **FE-03 P1｜权限撤销与离线编辑相遇时的重新授权、拒绝和审计**。
- [ ] **FE-04 P1｜评论、审批、删除和唯一约束的语义冲突案例**。
- [ ] **FE-05 P1｜共享依赖升级、跨微前端通信和 shell 故障隔离案例**。

### 边缘与物理系统

- [ ] **EDGE-01 P1｜云边模型、工具和配置包的签名分发、回滚与反回滚**。
- [ ] **EDGE-02 P1｜长时间断网后的冲突分类、审计重放与人工裁决**。
- [ ] **EDGE-03 P2｜ROS 2、实时操作系统和设备总线的端到端延迟预算案例**。
- [ ] **EDGE-04 P1｜急停、限位、硬件联锁与软件降级相互独立的安全案例**。
- [ ] **EDGE-05 P1｜网络分区下避免重复物理任务和双重控制**。

### Agent 平台与模型网关

- [ ] **AGT-01 P1｜跨供应商能力声明、语义回退和数据驻留约束验证**。
- [ ] **AGT-02 P1｜端用户、服务、Agent、工具和上游模型之间的身份委托与撤销**。
- [ ] **AGT-03 P1｜输入、输出、工具执行和人工审批多层 Guardrail 的绕过测试**。
- [ ] **AGT-04 P1｜A2A 与 MCP 的发现、版本协商、授权和失败恢复互操作测试**。
- [ ] **AGT-05 P1｜离线评估、在线反馈、追踪、成本和安全事件关联到同一任务**。
- [ ] **AGT-06 P1｜多租户执行沙箱、缓存/记忆泄漏和故障半径验证**。

## E10：真实案例候选池

候选进入写作前先做 go/no-go 评审：至少具备明确问题、约束、机制、时间或版本边界、结果或失败证据，以及两个可交叉核验的来源。只有产品宣传页、架构图无上下文或无法区分事实与推断时，留在候选池而不写。

- [ ] **CASE-01 P0｜SLO Engineering 案例**：从 Google SRE Workbook 的 Evernote/Home Depot 案例中选择证据更完整者。
- [ ] **CASE-02 P0｜重试、退避与抖动**：以 AWS Builders’ Library 机制材料和可复现实验形成小型失败案例。
- [ ] **CASE-03 P0｜Adobe Cell-Based Architecture**：与现有 AWS cell/shuffle sharding 案例形成企业落地对照。
- [ ] **CASE-04 P0｜模块化单体演进案例**：从有代码或明确迁移边界的一手工程材料中选择，不写抽象“成功故事”。
- [ ] **CASE-05 P0｜单体拆分与 Strangler 迁移案例**：以 Martin Fowler 原始材料和真实迁移证据交叉核验。
- [ ] **CASE-06 P1｜Netflix API 重构**：聚焦工程权衡与边界变化，不写技术栈目录。
- [ ] **CASE-07 P1｜GitHub 数据库高可用或迁移案例**：优先选择有故障窗口和恢复机制的文章。
- [ ] **CASE-08 P1｜Cloudflare 全球网络或 DDoS 隔离案例**：区分公开机制与公司自述结果。
- [ ] **CASE-09 P1｜CNCF 云原生参考架构案例**：从可追到配置、仓库或多篇一手材料的组织中选择。
- [ ] **CASE-10 P1｜Outbox/CDC 真实实现案例**：必须覆盖事务边界、重复、顺序和恢复。
- [ ] **CASE-11 P1｜Saga 失败与补偿案例**：必须包含不可补偿副作用和人工终态。
- [ ] **CASE-12 P1｜缓存事故或一致性案例**：必须覆盖权威源、失效策略和陈旧读后果。
- [ ] **CASE-13 P1｜分片与再均衡案例**：必须覆盖热点、迁移、路由和回滚。
- [ ] **CASE-14 P1｜供应链签名与准入案例**。
- [ ] **CASE-15 P1｜Zero Trust 实现案例**：优先使用 NIST NCCoE 可复查实现。
- [ ] **CASE-16 P2｜OT/CRDT 对照案例**。
- [ ] **CASE-17 P2｜多区域故障切换与恢复演练案例**。
- [ ] **CASE-18 P2｜平台 API 与 GitOps 漂移案例**。
- [ ] **CASE-19 P2｜多租户 Agent 沙箱与泄漏边界案例**。
- [ ] **CASE-20 P2｜边缘断网、重连与物理安全链案例**。

案例发现来源包括：
[CNCF Reference Architecture](https://architecture.cncf.io/)、
[CNCF Case Studies](https://www.cncf.io/case-studies/)、
[Google SRE Books](https://sre.google/books/)、
[Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)、
[AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/2025-02-25/framework/welcome.html)、
[Google Cloud Architecture Center](https://docs.cloud.google.com/architecture/)、
[Uber Engineering](https://www.uber.com/blog/engineering/)、
[GitHub Engineering](https://github.blog/engineering/) 和
[Cloudflare Blog](https://blog.cloudflare.com/)。

## E11：反模式、设计题与学习闭环

### 反模式

- [ ] **ANTI-01 P1｜Big Ball of Mud**。
- [ ] **ANTI-02 P1｜Distributed Monolith**。
- [ ] **ANTI-03 P1｜Shared Database Across Services**。
- [ ] **ANTI-04 P1｜Retry Storm**。
- [ ] **ANTI-05 P1｜Chatty I/O 与 N+1 跨网络调用**。
- [ ] **ANTI-06 P1｜God Object / God Service**。
- [ ] **ANTI-07 P1｜Leaky Abstraction**。
- [ ] **ANTI-08 P1｜Premature Generalization 与错误 DRY**。
- [ ] **ANTI-09 P2｜Optional/Partial Object 与非法状态可表示**。
- [ ] **ANTI-10 P2｜Static Cling 与隐藏依赖**。

### 设计题与评测

- [ ] **QST-01 P0｜建立设计题回答契约**：需求澄清、规模估算、质量场景、架构图、状态/数据、失败、权衡、验证和演进。
- [ ] **QST-02 P0｜为现有三道设计题补完整参考答案和评分 rubric**。
- [ ] **QST-03 P1｜模块化单体还是微服务**。
- [ ] **QST-04 P1｜订单、库存与支付的一致性设计**。
- [ ] **QST-05 P1｜多租户限流、配额与隔离**。
- [ ] **QST-06 P1｜高流量通知系统与背压**。
- [ ] **QST-07 P1｜多人协作编辑与离线冲突**。
- [ ] **QST-08 P1｜跨区域读写、故障切换与恢复**。
- [ ] **QST-09 P1｜Agent 工具副作用、审批与恢复**。
- [ ] **QST-10 P2｜边缘断网自治与物理安全**。

## 首个 20 个工作日

这 20 天用于建立可复制的生产节奏，不追求一次覆盖所有 Awesome 条目。

| 天 | 任务 | 当日产物 |
| --- | --- | --- |
| 1 | E0-01 内容类型契约 | 类型、章节与元数据测试 |
| 2 | E0-03 source ledger + E0-05 版权检查 | 来源登记格式与审查清单 |
| 3 | FND-01 | 架构与设计尺度页 |
| 4 | FND-02 | 驱动因素与 ASR 页 |
| 5 | QA-00 | 质量属性总览 |
| 6 | QA-01 | 六字段场景方法 |
| 7 | QA-02 | 可靠性/可用性/可恢复性 |
| 8 | QA-03 | 性能/延迟/吞吐/容量 |
| 9 | PR-01 | 信息隐藏与封装 |
| 10 | PR-02 | 高内聚与低耦合 |
| 11 | PR-04 | DIP、IoC 与 DI |
| 12 | PR-06 | KISS、YAGNI 与 DRY |
| 13 | MOD-02 | C4 Context/Container |
| 14 | MOD-04 | arc42 文档骨架 |
| 15 | MTH-03 | ADR 生命周期 |
| 16 | MOD-05 | 概念/逻辑/物理数据模型 |
| 17 | REL-01 + REL-02 | Timeout/Retry 组合页 |
| 18 | REL-03 | Circuit Breaker |
| 19 | PAT-DC-01 + PAT-DC-02 | Outbox/Inbox 组合页 |
| 20 | STY-00 + CASE-01 证据盘点 | 风格比较框架；首个 SLO 案例进入可写状态 |

第 20 天结束时应进行一次交叉审查：术语是否统一、重复文章是否应合并、路线是否能进入新页面、每页是否有案例或练习、source ledger 与文末引用是否一致。

## 后续里程碑

### M1：知识主干可用

完成 E0、FND、QA、MTH、PR、MOD 的全部 P0。读者不再需要通过外链才能理解架构驱动因素、质量属性、核心原则、C4、arc42、ADR 和基础数据建模。

### M2：模式语言可用

完成 STY、DDD/APP、E6 和 E7 的全部 P0。每个主干模式都有问题、机制、代价、替代、组合关系和案例入口。

### M3：专题闭环

完成云原生、协作前端、边缘物理和 Agent 平台四个专题页公开列出的 21 项缺口；专题页的“后续待补”只保留尚未开始或证据不足的内容。

### M4：案例与练习形成飞轮

至少完成 10 篇新增案例、10 道带 rubric 的设计题和 8 篇反模式；原则、模式、案例、题目和学习路线之间全部双向可达。

### M5：持续维护

每新增 10 篇内容执行一次：

- [ ] 术语和 slug 去重。
- [ ] 相邻主题比较与双向链接检查。
- [ ] 来源版本、失效链接和许可证复核。
- [ ] 事实、推断与说明性材料抽样审查。
- [ ] 内容密度、桌面/移动渲染和无障碍检查。
- [ ] 根据读者问题调整优先级，不按外部目录机械补齐。

## 明确不做

- 不以“覆盖 Awesome Software Architecture 的 305 个页面”为完成目标。
- 不为每个工具、云产品或框架建立百科页。
- 不复制第三方目录结构、课程章节、图表和案例叙事。
- 不为了凑数量拆出只有定义、链接或代码片段的薄页。
- 不把模式名称当作结论，不隐藏适用前提、运行成本和失败边界。
- 不把厂商功能、社区惯例或本站推断写成普遍保证。
