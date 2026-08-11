# G009 Batch 6 Stage A Review

## Stage A projection

- Projection: 57 completed topics / 100 content documents / 519 governed sources.
- STY-05: `published / pending`; canonical route `/styles/sty-05`.
- STY-06: `unpublished / pending`; `/styles/sty-06` is absent from the actionable published route inventory.
- Backlog remains pre-closure: `当前 G009，下一项为 STY-05`; STY-05 and STY-06 checkboxes remain unchecked.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-05-microservices.mdx` | 13,651 | `493a227b19702a78d0141e6254eb2bb153ea0b00073c0b9773854e5c714e460f` |
| `diagrams/sty-05-microservices-order-saga.drawio` | 55,145 | `3a5bb4db02eb8b81513807b59f879155c206607df7a28c6c78dce7b19a5436e5` |
| `static/img/diagrams/sty-05-microservices-order-saga.svg` | 36,867 | `35bf03e73a1fda674701dd98a9f5dd016eaedbfb10a7a6f89485e110c5b9eb65` |
| `data/source-ledger.json` | 1,515,289 | `21253b11dd39eebf75fba34e4f661d08bfbe19a95dc61cf5e2201c0d067d019c` |

- Canonical source IDs: `src-lewis-fowler-microservices`, `src-microsoft-microservices-architecture-style`, `src-microservicesio-database-per-service`, `src-microservicesio-saga`, `src-aws-decompose-business-capability`, and `src-atlas-sty05-microservices-order-saga`.
- The article exposes five governed remote anchors from four observed hostnames (`martinfowler.com`, `learn.microsoft.com`, `microservices.io`, and `docs.aws.amazon.com`), satisfying the minimum three-domain boundary. Fowler alone is `manifest_primary`; the local illustration is non-primary and illustration-only.

## Stage A implementation evidence

- TDD deployment RED: 5 tests, 1 passed and 4 failed for the expected stale 57/99/513 projection, unpublished STY-05 route, and absent review/evidence record.
- Task 5 prerequisite remediation RED: the focused parent-link contract failed because STY-05 lacked a visible `/styles` parent, and both deletion/wrong-href mutation fixtures were initially inapplicable.
- Task 5 prerequisite remediation GREEN: `[架构风格目录](/styles)` was added using the existing style-page pattern; the focused parent-link and mutation contract passed 2/2, then `npm run generate:content` wrote the canonical projection without weakening the generator.
- Generated projection changes are limited to the four canonical `src/generated/` files. The current/live project-status fixture advances to 57/100/519; immutable historical review payloads and hashes remain unchanged.
- Selector-bound contrast provenance: the content contract resolves actual `.sync`, `.message`, `.compensation`, `.edge-label`, canvas, node, and legend presentation from the synchronized SVG. All expected contrast values are derived from those selected elements.
- Deployment has not run. Local verification and Browser evidence establish only a candidate for independent review.

## Independent review and remediation history

- Pre-remediation Stage A snapshot `7b4b96a54731af7ff983c6c7a15101f6cfc0ceaf`: code review and architecture review reported no blocking findings; content/evidence/rights review reported one `IMPORTANT` AWS documentation-license finding. That snapshot and its observations are superseded checkpoint history, not the current remediation candidate or final verdicts.
- The finding was independently verified against the official [AWS Site Terms](https://aws.amazon.com/terms/), which state that documentation hosted on `docs.aws.amazon.com` is `CC-BY-SA-4.0` and code within that documentation is `MIT-0`.
- Remediation corrects only `src-aws-decompose-business-capability`: `CC-BY-SA-4.0`, identity-scoped family, AWS Site Terms evidence, explicit documentation/code boundary, and `adapt-sharealike-review`. Source count, source kind, evidence roles, citation roles, remote locator, and `manifest_primary=false` remain unchanged.
- The superseded `data/source-ledger.json` hash was `b35b92e29d9db47a4a9d19c7ba9ee23e55569f436441f630f972bcabf04817c4`; the corrected hash is recorded in Artifact identities. Historical Batch 1–5 review payloads and hashes remain byte-identical.
- The corrected contract rejects downgrading this exact AWS source to `LicenseRef-All-Rights-Reserved`. A focused validator regression gives share-alike obligations precedence for a `CC-BY-SA-4.0` vendor reference without changing other vendor-license policies.
- AWS-license remediation candidate `bb5d5dae9ffe181aa5b1717d1f6a2bad885eb353`: content/evidence/rights and architecture re-reviews reported no blocking findings; code re-review reported one `IMPORTANT` validator-scope finding and one `MINOR` checkpoint-wording finding. The policy-scope remediation narrows the share-alike exception to a `CC-BY-SA-4.0` vendor reference and proves that an original illustration still requires `original-atlas`.
- Policy-scope remediation candidate `40283eeadb9525df93ea884d23bd1953070d78a8`: this became the exact reviewed head after the three independent re-reviews completed cleanly. The final exact-head verdicts are recorded in Independent review checkpoint below; earlier PENDING states remain preserved only as superseded history.

## Local in-app Browser QA

- Browser surface: Codex in-app Browser against `http://127.0.0.1:3100/tego-arch/styles/sty-05`, built and served from the local Stage A candidate.
- States accepted: `4/4`.
- Wrapper interaction checks: `12/12`.
- Relation destination/H1/return checks: `16/16`.
- Remote source anchors: `5` per state; unique remote domains: `4` observed per state (minimum `3`).
- STY-06 actionable count: `0` in every state.
- Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.
- Visual inspection: diagram `PASS` in light and dark themes. Browser measurements prove the same opaque synchronized SVG loaded at `800 × 2736`; the direct 800px raster inspection showed all four deployment boundaries, private-data nodes, distinct sync/message/compensation lanes, recovery annotations, and legend without clipping or theme-dependent loss.

| State | Viewport/theme | Document client/scroll | Diagram; table 1; table 2 client/scroll | SVG loaded / intrinsic / rendered | Focus-visible outline and ArrowRight before→after | Diagnostics |
| --- | --- | --- | --- | --- | --- | --- |
| `desktopLight` | `1440x1000` / `light` | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `true`; `44x150`; `800x2736` | all active and `:focus-visible`; `3px solid`; `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `desktopDark` | `1440x1000` / `dark` | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `true`; `44x150`; `800x2736` | all active and `:focus-visible`; `3px solid`; `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileLight` | `390x844` / `light` | `390/390` | `358/800`; `358/1024`; `358/1024` | `true`; `44x150`; `800x2736` | all active and `:focus-visible`; `3px solid`; `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileDark` | `390x844` / `dark` | `390/390` | `358/800`; `358/1024`; `358/1024` | `true`; `44x150`; `800x2736` | all active and `:focus-visible`; `3px solid`; `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |

The four intended visible relation hrefs were selected from the local article DOM, opened directly in the same in-app Browser tab, checked by exact H1, and returned to `/styles/sty-05`. This `visible-DOM href selection + direct navigation (local relation audit fallback)` is recorded accurately; no physical relation click is claimed.

| Relation | Destination H1 | Per-state return |
| --- | --- | --- |
| `/styles` | `架构风格` | `4/4` returned to `/styles/sty-05` |
| `/styles/sty-04` | `模块化单体：在一个部署单元内保护业务边界` | `4/4` returned to `/styles/sty-05` |
| `/styles/sty-03` | `垂直切片架构：按用例收拢变化边界` | `4/4` returned to `/styles/sty-05` |
| `/cases/micro-frontends-single-spa` | `微前端：用垂直业务切片约束跨团队所有权` | `4/4` returned to `/styles/sty-05` |

Every state exposed the exact five remote locators for Lewis/Fowler, Microsoft, Database per service, Saga, and AWS. All retained `target="_blank"` and `rel="noopener noreferrer"`; local QA inspected those governed anchors and did not claim popup activation or external deployment.

- Raw Browser JSON: `.superpowers/sdd/task-5-browser-qa.json`, SHA-256 `b139a174432e1684d9a9387e839807fc22b22c6ba0b2cb6e18009536a416f767`.
- desktopLight screenshot: `.superpowers/sdd/task-5-desktopLight.jpg`, SHA-256 `b2939596c3ddaadcd2700c32eb019ef943e89160a4e88c896957e8259030ac7e`.
- desktopDark screenshot: `.superpowers/sdd/task-5-desktopDark.jpg`, SHA-256 `9f49172f0c2d631799c7b41b92d870913133dfa4ebf9d1d9429f99a3f98c375c`.
- mobileLight screenshot: `.superpowers/sdd/task-5-mobileLight.jpg`, SHA-256 `438b4f50bee195a80aac053662d44dd95e75bba4a1bd9723678480f42a1d3b1b`.
- mobileDark screenshot: `.superpowers/sdd/task-5-mobileDark.jpg`, SHA-256 `7262a8f5e2066ff57eca1bb287e3b8d7f9faa941f3fe043870b748fe286404d7`.

## Independent review checkpoint

- Exact reviewed head: `40283eeadb9525df93ea884d23bd1953070d78a8`.
- Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.
- Independent content, evidence, and rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent architecture reviewer (`architect`): `CLEAR / READY`; findings: `0`.
- Remediation commits reviewed: `bb5d5dae9ffe181aa5b1717d1f6a2bad885eb353` and `40283eeadb9525df93ea884d23bd1953070d78a8`.
- Final Stage A review judgment: `READY`.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.
- These verdicts authorize only the next local Stage B step; they do not claim backlog closure, publication, production evidence, or deployment success.

## Production Stage A evidence

- Exact implementation head: `e82760843a55ba98a09793215e5f13e0c1fbfaa8`.
- Workflow: `Verify and deploy Docusaurus to GitHub Pages`; event: `push`.
- Run: `31490981657`; status: `completed`; conclusion: `success`.
- Build job: `93777183963`; status: `completed`; conclusion: `success`.
- Deploy job: `93777844175`; status: `completed`; conclusion: `success`.
- Run URL: `https://github.com/sealday/tego-arch/actions/runs/31490981657`.
- Stage A deployment status: `SUCCESS`.
- Stage B backlog closure status: `PENDING`.

HTTP probes: `9/9` returned `200`; HTML content types: `8/8`; SVG content types: `1/1`.

| Route | Status | Content type | Bytes | SHA-256 |
| --- | ---: | --- | ---: | --- |
| `/` | `200` | `text/html; charset=utf-8` | `17,310` | `13d73ea045a747ea795fca2a76c3072917d5042b2571cd07a4e935e9ddd20935` |
| `/styles` | `200` | `text/html; charset=utf-8` | `20,880` | `c527ee34a2f37ec5601968075ea7ee2417ed2c286d165b19c6277dcd96ccba9f` |
| `/styles/sty-05` | `200` | `text/html; charset=utf-8` | `37,081` | `221ef647ea10832e17157ffff7267d4fb12e545b22fcfa2e4b5919960f800ed0` |
| `/styles/sty-04` | `200` | `text/html; charset=utf-8` | `42,330` | `e338a3fd0e1345bf9885b99dca836b7ba1a144152b1643a8866312851fa42ce2` |
| `/styles/sty-03` | `200` | `text/html; charset=utf-8` | `39,856` | `940e6ed0f3207edaa594bbd98f1dd96d5895f2681adefc7ffb33a42233cbf5c9` |
| `/paths/module-boundaries` | `200` | `text/html; charset=utf-8` | `28,296` | `a18e4f44007df4d6c6a2676abc93425bcfa08c878b691eae05245fd1ae0101bd` |
| `/references` | `200` | `text/html; charset=utf-8` | `23,533` | `f321a67506a8cc9afbb37a95685b17e228873fd68aeb19b78e18c77e9ecb92d1` |
| `/cases/micro-frontends-single-spa` | `200` | `text/html; charset=utf-8` | `61,331` | `d31f69f3c86531f23309ac0d77f0103f96b974098cc9a6900bc5a6abc1f036a6` |
| `/img/diagrams/sty-05-microservices-order-saga.svg` | `200` | `image/svg+xml` | `36,867` | `35bf03e73a1fda674701dd98a9f5dd016eaedbfb10a7a6f89485e110c5b9eb65` |

Live SVG: `36,867` bytes; SHA-256 `35bf03e73a1fda674701dd98a9f5dd016eaedbfb10a7a6f89485e110c5b9eb65`; exact reviewed-asset match: `true`.

- Production Browser surface: Codex in-app Browser against `https://sealday.github.io/tego-arch/styles/sty-05`.
- Production Browser states accepted: `4/4`.
- Production wrapper interaction checks: `12/12`.
- Production relation destination/H1/return checks: `16/16`.
- Production source destinations resolved: `20/20` from five exact anchors and four unique hostnames per state.
- STY-06 production actionable DOM count: `0` in every state.
- Every production state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.
- Every wrapper became the active `:focus-visible` element with a `3px solid` outline before `ArrowRight`; the same opaque SVG loaded at intrinsic `44x150` and rendered `800x2736` in every state.
- Production visual inspection: `PASS` in light and dark themes. The four service boundaries, private-data nodes, distinct message/compensation lanes, recovery annotations, and legend remained readable without clipping or theme-dependent loss.

| State | Viewport/theme | Document client/scroll | Diagram; table 1; table 2 client/scroll | ArrowRight before→after | Diagnostics |
| --- | --- | --- | --- | --- | --- |
| `desktopLight` | `1440x1000` / `light` | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `desktopDark` | `1440x1000` / `dark` | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileLight` | `390x844` / `light` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileDark` | `390x844` / `dark` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |

Relation fallback: `visible-DOM href selection + direct navigation (production offscreen relation audit fallback); browser history return; no physical relation click claimed`.

| Selected relation href | Exact destination H1 | Per-state return |
| --- | --- | ---: |
| `/tego-arch/styles` | `架构风格` | `4/4` |
| `/tego-arch/styles/sty-04` | `模块化单体：在一个部署单元内保护业务边界` | `4/4` |
| `/tego-arch/styles/sty-03` | `垂直切片架构：按用例收拢变化边界` | `4/4` |
| `/tego-arch/cases/micro-frontends-single-spa` | `微前端：用垂直业务切片约束跨团队所有权` | `4/4` |

Source fallback: `visible-DOM exact href selection + direct open of the same URL in an in-app Browser destination tab (_blank compatibility fallback); no physical source-anchor click claimed`.

| Selected source href | Target | Rel | Exact destination resolved |
| --- | --- | --- | ---: |
| `https://martinfowler.com/articles/microservices.html` | `_blank` | `noopener noreferrer` | `4/4` |
| `https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices` | `_blank` | `noopener noreferrer` | `4/4` |
| `https://microservices.io/patterns/data/database-per-service.html` | `_blank` | `noopener noreferrer` | `4/4` |
| `https://microservices.io/patterns/data/saga.html` | `_blank` | `noopener noreferrer` | `4/4` |
| `https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/decompose-business-capability.html` | `_blank` | `noopener noreferrer` | `4/4` |

- Raw production Browser JSON: `.superpowers/sdd/task-6-production-evidence.json`, SHA-256 `638b6141975cba48c43e5956f78fe029b780f6d74b8d9c8ddb1afad4b7be2ff2`.
- desktopLight screenshot: `.superpowers/sdd/task-6-production-desktopLight.jpg`, SHA-256 `abb7a3b4a0280221c2eb2282917788e3427e5dc75cbddd6dbb9b5cc0e9e70da0`.
- desktopDark screenshot: `.superpowers/sdd/task-6-production-desktopDark.jpg`, SHA-256 `56d3f8184b7bf00d0247bc3521bec4c8c9f84eb9e323445c28819ad3f3839124`.
- mobileLight screenshot: `.superpowers/sdd/task-6-production-mobileLight.jpg`, SHA-256 `9953a1b1cae9bc858e622b2e592906a46ee39f391d0906e9224a48ef2f12c312`.
- mobileDark screenshot: `.superpowers/sdd/task-6-production-mobileDark.jpg`, SHA-256 `c49b336de616c04c4e5df114844c2fe89828ee360acb12ce6702d034e85594ee`.
- Diagram light inspection screenshot: `.superpowers/sdd/task-6-production-diagram-light.jpg`, SHA-256 `c07446eb1828e2eb1738ac8f40fde78295e0b6a60c18302903510f18ce22329b`.
- Diagram dark inspection screenshot: `.superpowers/sdd/task-6-production-diagram-dark.jpg`, SHA-256 `926e2ea49ef54b99f69ae85588911b3e1dead5064fdff403322a08cd000111aa`.
- Full-page screenshot stitching repeated visible bands in the viewer, so the two focused viewport captures above bind the same production SVG to the light/dark visual inspection without claiming a different asset.
