# G009 Batch 8 Stage A Review

## Stage A projection

- Projection: 59 completed topics / 102 content documents / 529 governed sources.
- STY-07: `published / pending`.
- STY-08: `unpublished / pending`; actionable route count: `0`.
- Scope: only the STY-07 Stage A candidate; Stage B backlog closure has not run.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-07-service-oriented-architecture.mdx` | 18,643 | `f98c075a6bf38c4d7d345d792f3dbdba361b682eef2c458095b96bcd4dbb4bf4` |
| `diagrams/sty-07-soa-microservices-order-fulfillment.drawio` | 34,359 | `b985dcaea8f5fe4ebd3601f34dcdc1eb51ff1f2a08acf7407dd4e309a51ed78e` |
| `static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg` | 29,229 | `b4827479133743999c7c14cf14b5d61abf91c7e217a540378ac0d4b9b77b3c8f` |
| `data/source-ledger.json` | 1,540,278 | `52e33d9996222026ffe74e53b5d6da77a61e442d982fa9e93b14517216f5f778` |

- Governed STY-07 sources: `6`; remote anchors per state: `5`; distinct remote domains: `4` (`docs.oasis-open.org`, `w3.org`, `martinfowler.com`, `learn.microsoft.com`).
- Exactly one STY-07 citation is `manifest_primary`; the original diagram is governed separately as illustration rights.

## Local in-app Browser QA

The exact implementation candidate `4398f045f0595043878102d59353bf1e3ae4de21` was rebuilt and served at `/tego-arch/styles/sty-07`, then recollected from scratch using only the Codex in-app Browser.

| State | Viewport/theme | Page client/scroll | Diagram; comparison; decision client/scroll | ArrowRight before→after | Diagnostics |
| --- | --- | --- | --- | --- | --- |
| `desktopLight` | `1440x1000` / light | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `desktopDark` | `1440x1000` / dark | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileLight` | `390x844` / light | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileDark` | `390x844` / dark | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |

- States accepted: `4/4`; wrapper interaction checks: `12/12`; relation H1/return checks: `16/16`.
- SVG loaded in every state: intrinsic `82x150`; rendered `800x1466.6640625`.
- Remote source anchors: `5` per state across at least `4` domains; STY-08 actionable count: `0` per state.
- Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch8-stage-a-browser.json`, SHA-256 `b2a09ad041c156faa1493867741dd7b1c74241fbd96005903335b3d5076d4122`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`. Exactly three fresh IAB full-page captures were returned but repeated viewport slices and could not prove whole-page coverage of both the opening and architecture diagram. Their exact state, viewport, path, byte size, hash, status and rejection reason are bound in the raw JSON. No Chrome fallback, prior functional raw, old screenshot or visual PASS is claimed.

## Independent review checkpoint

- Exact implementation candidate head: `4398f045f0595043878102d59353bf1e3ae4de21`.
- Exact evidence head: `570b55eddac0d888f5f5356b5e97a80106958259`.
- Evidence history: the earlier `76607c67242757e0e1da1f9e352844b36481fcef` observation and `56828172f3d7e7b5e1916b879c7fdcb07df20b91` binding were superseded after W3C wording changed render-affecting bytes. Commit `4398f045f0595043878102d59353bf1e3ae4de21` corrected the W3C Working Group Note classification and screenshot overclaim; `570b55eddac0d888f5f5356b5e97a80106958259` then bound fresh four-state in-app Browser functional evidence and all three rejected screenshot attempts to that exact implementation.
- Independent code/spec/security review: `READY / APPROVE`; findings: `0`.
- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.
- Final Stage A review judgment: `READY`.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.

The three independent reviews found no runtime, geometry, relation, source-destination, rights-identity, or next-topic blocker in the exact implementation and evidence pair. Screenshot evidence remains `BLOCKED / NOT_ACCEPTED` for the reasons and rejected captures recorded above; this does not convert those captures into visual PASS evidence. The bound judgment is limited to Stage A and does not claim deployment or Stage B completion.

## Production Stage A evidence

- Exact implementation SHA: `087ebc19322bbb5660ba9f2997e8384d209e3494`.
- Publication preflight: prior `origin/main` and merge-base were `3726483e685891fe07e3a26a764cae57f2798076`; ahead/behind was `17/0`; tracked worktree was clean. Publication used only `git push origin HEAD:main` and did not force-push.
- Exact push-triggered Pages run: `31724488128`, `completed / success`.
- Build job: `94529359551`, `completed / success`; deploy job: `94530100965`, `completed / success`.
- Production route probes: `/`, `/tego-arch/`, `/tego-arch/styles`, `/tego-arch/styles/sty-07`, `/tego-arch/styles/sty-04`, `/tego-arch/styles/sty-05`, `/tego-arch/styles/sty-06`, `/tego-arch/cases/temporal-saga-durable-execution`, and `/tego-arch/references` all returned HTTP `200` with `text/html; charset=utf-8`.
- Published SVG: `/tego-arch/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg`, HTTP `200`, `image/svg+xml`, `29,229` bytes, SHA-256 `b4827479133743999c7c14cf14b5d61abf91c7e217a540378ac0d4b9b77b3c8f`; bytes and hash exactly match the reviewed asset.
- Raw production in-app Browser JSON: `docs/reviews/evidence/g009-batch8-stage-a-production-browser.json`, `24,889` bytes, SHA-256 `753a94cf2ef53d054959dc6c115d4f29e484c651a06fe4c5c7d617358fd8b192`.
- Production states: `4/4`; wrapper focus/`:focus-visible`/3px outline/ArrowRight: `12/12`; exact relation href/H1/return: `16/16`; source href/target/rel: `20/20`; STY-08 actionable count: `0` in every state.
- Every state loaded the published SVG at intrinsic `82x150` and rendered `800x1466.6640625`; page width remained `1440/1440` or `390/390`; warning/error logs, `Runtime.exceptionThrown`, and `Log.entryAdded` were `0`; `hasMore=false`; `truncated=false`.
- Relation activation used direct exact-href navigation and direct article return because the targets are offscreen in the tested state; the selected href and resulting H1 are recorded, and no physical relation click is claimed.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`. Exactly three fresh production IAB full-page captures were inspected: both desktop captures repeated viewport slices and omitted the architecture diagram, while the mobile capture contained only repeated skip-link fragments on an otherwise blank page. All three paths, bytes, hashes, viewports, rejection statuses, and reasons are bound in the raw JSON. No Chrome fallback or visual PASS is claimed.
- Stage A deployment status: `SUCCESS`.
- Final Stage A production judgment: `PASS` for exact-head deployment, HTTP/SVG identity, functional DOM, interaction, navigation, source attributes, STY-08 exclusion, and zero diagnostics. Screenshot evidence remains explicitly outside that PASS scope.
- Stage B remains `NOT_RUN`; STY-07 stays `published / pending`, STY-08 stays `unpublished / pending`, and the backlog is unchanged.

## Stage B closure candidate

- Projection: `60 completed topics / 102 content documents / 529 governed sources`.
- STY-07 target: `published / complete`.
- STY-08 target: `unpublished / pending`; actionable route count: `0`; sole next topic.
- Closure input: successful Stage A production evidence for exact implementation SHA `087ebc19322bbb5660ba9f2997e8384d209e3494`, Pages run `31724488128`, build job `94529359551`, deploy job `94530100965`, and production Browser JSON SHA-256 `753a94cf2ef53d054959dc6c115d4f29e484c651a06fe4c5c7d617358fd8b192`.
- Immediate history locks: complete G009 Batch 7 review SHA-256 `d8438c66127e9b4411d5dc121a19842aaaab4e03c31a2285cb02fcfde689cf6b`; complete prior STY-06 backlog suffix SHA-256 `4f53eceafe34f274d494bacf5bc35be770a872666dacce54a818f796542e01c8`.
- Exact Stage B reviewed head: `44cfed91f9773e2e43d271b30a76a1ed1a70f10e`.
- Review history: initial closure candidate `4b9d2c718d96adeba6910805bd02116b162f3c06` was remediated by `44cfed91f9773e2e43d271b30a76a1ed1a70f10e`.
- Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.
- Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.
- Final Stage B review judgment: `READY`.
- Stage B deployment status: `SUCCESS`.

The reviewed candidate changes only the canonical STY-07 completion state, current generated projection, and current-projection fixtures. Stage A artifacts and evidence remain byte-identical; all earlier history remains immutable. The three independent reviews found zero findings or blockers. The exact reviewed closure was published and the production result is bound below.

## Stage B production evidence

- Exact Stage B deployed head: `01bc03fc7b4831aabc0b9239af9d3a6d804dedf9`.
- Publication preflight: prior `origin/main` and merge-base were `bff6981b729064f94f19b6da3ddb1fc207166e45`; ahead/behind was `3/0`; tracked worktree was clean. Publication used only `git push origin HEAD:main` and did not force-push.
- Exact push-triggered Pages run: `31766813992`, `completed / success`.
- Build job: `94664311129`, `completed / success`; deploy job: `94664696586`, `completed / success`.
- Production route probes: `9/9`. `/`, `/tego-arch/`, `/tego-arch/styles`, `/tego-arch/styles/sty-07`, `/tego-arch/styles/sty-04`, `/tego-arch/styles/sty-05`, `/tego-arch/styles/sty-06`, `/tego-arch/cases/temporal-saga-durable-execution`, and `/tego-arch/references` all returned HTTP `200` with `text/html; charset=utf-8` in the fresh Stage B in-app Browser run.
- Published SVG: `/tego-arch/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg`, HTTP `200`, `image/svg+xml`, `29,229` bytes, SHA-256 `b4827479133743999c7c14cf14b5d61abf91c7e217a540378ac0d4b9b77b3c8f`; bytes and hash exactly match the reviewed asset.
- Raw Stage B production in-app Browser JSON: `docs/reviews/evidence/g009-batch8-stage-b-production-browser.json`, `25,949` bytes, SHA-256 `b5605b255f87041524e25a898bd5f0b27ec912322b8d1fd814c3032abb88a99a`. It binds `freshStageB=true`, `stageAArtifactReused=false`, the exact deployed head, run/jobs, routes, SVG identity, states and screenshot boundary.
- Production Browser states: `4/4`. Wrapper interactions: `12/12`. Relation destination/H1/return checks: `16/16`. Exact source destinations: `20/20`. STY-08 actionable count: `0` in every state.
- Desktop light/dark used `1440x1000`; mobile light/dark used `390x844`. Page width remained `1440/1440` or `390/390`; all three wrappers retained expected contained overflow and keyboard focus/`:focus-visible`/3px outline/ArrowRight behavior.
- Every application QA state loaded the published SVG at intrinsic `82x150` and rendered `800x1466.6640625`; warning/error logs, `Runtime.exceptionThrown`, and `Log.entryAdded` were `0`; `hasMore=false`; `truncated=false`.
- The canonical raw-SVG top-level identity probe emitted one browser-injected viewer-helper `Runtime.exceptionThrown` event. The raw JSON preserves its exact boundary and message; it occurred outside the Docusaurus application QA states and is not represented as an application error.
- Screenshot evidence remains `BLOCKED / NOT_ACCEPTED` and explicitly outside that PASS scope. Exactly three fresh Stage B IAB full-page captures were inspected and rejected because they repeated top-of-page viewport slices and omitted trustworthy whole-page coverage including the architecture diagram. Their exact paths, states, viewports, bytes, hashes and rejection reasons are bound in the raw JSON. No Chrome fallback, Stage A screenshot reuse or visual PASS is claimed.
- Stage B deployment status: `SUCCESS`.
- Final Stage B closure judgment: `PASS` for exact-head deployment, HTTP/SVG identity, functional DOM, interaction, navigation, source attributes, STY-08 exclusion, and zero application-state diagnostics.
- Final projection remains `60 completed topics / 102 content documents / 529 governed sources`; STY-07 is `published / complete`; STY-08 is `unpublished / pending / non-actionable` and the sole next topic.
