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
- Current policy-scope remediation identity: the commit containing this review record; independent re-reviewers must bind the externally supplied full SHA. Code, content/evidence/rights, and architecture slots below remain `PENDING` until fresh verdicts are recorded against that exact commit.

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

- Candidate identity: the commit containing this review record; independent reviewers must bind the externally supplied full SHA before recording verdicts.
- Code review (`code-reviewer`): `PENDING`.
- Content, evidence, and rights review: `PENDING`.
- Architecture review (`architect`): `PENDING`.
- Remediation commits: none at this checkpoint; later reviewers must append findings and superseded verdicts rather than erase history.
- Stage A status: `READY_FOR_INDEPENDENT_REVIEW`.
- Deployment status: `NOT_RUN`.
- No final reviewer verdict is claimed in this checkpoint.
