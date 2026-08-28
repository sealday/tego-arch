# G009 Batch 14 Stage A Review

## Stage A projection

- Projection: `65 completed topics / 109 content documents / 573 governed sources`.
- STY-13: `published / pending`.
- STY-14: `unpublished / pending / non-actionable`; actionable route count: `0`.
- Exact clean implementation head: `17e596b23ca2e9ec37093d8bda9e6239e6af9d1f`.
- This is a factual Stage A evidence candidate only. It does not close the backlog, claim deployment, or supply any independent verdict.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-13-space-based-architecture.mdx` | 20,026 | `0e0eb3accd69fb1818b83d73ac4c619a77189bf4c6c06d8c8724453da1b247f5` |
| `data/source-ledger.json` | 1,681,721 | `890017bf19925437c6ea2c973bfe9697c0d36ad2df19ab77e1dfd55bbb846981` |
| `diagrams/sty-13-space-based-flight-availability.drawio` | 22,184 | `cff8f280c882f0fab92004b7104f42c7fb79440e3390d7b7aa077f4205c62aeb` |
| `static/img/diagrams/sty-13-space-based-flight-availability.svg` | 26,671 | `68e15b5fe4eefd49f5870c672e125d0fa9e001b5177049d43a09d68d2deb56d7` |
| `docs/reviews/evidence/g009-batch14-stage-a-browser.json` | 27,953 | `415ca7f78747cff78de84bc025b8a870dabca1f993e558b8a2d6dcae8354fa6d` |

- Governed STY-13 sources: `8`; remote anchors per state: `7`; original diagram rights remain governed separately.
- The Browser-observed SVG PageAssets bundle is an exact byte match for the reviewed SVG.

## Immutable immediate history

- Complete immediate Batch 13 review SHA-256: `688c800ecafcfc3ed66529e2896d49fd247680412f9eba6c5a25da357e8ae44c`.
- Complete immediate Batch 13 local raw SHA-256: `a0de2d5ea069b2af87ad4aa4ef4696a9a22e6ff99ba96b616763262f1814ed38`.
- Complete immediate Batch 13 Stage A production raw SHA-256: `a28bb3269f2b7545b7d77f2ec506ce5b1bd737924a5db6945481ee8ec5763560`.
- Complete immediate Batch 13 Stage B production raw SHA-256: `93540ff26f5d7a6fddb2ca5310a838304d04afa6994788fcf1fb8d0b4a6ff958`.
- Complete immediate Batch 13 release-baseline SHA-256: `52c9fe9aa36e1ab9c406162c1d34f489ee439058f73f450e973fe496b35902f0`.
- The validator freezes the complete review, all three raw artifacts, and the complete `40,108`-byte current release-baseline suffix; no historical literal is weakened.

## Local in-app Browser QA

- Exact local URL: `http://127.0.0.1:4173/tego-arch/styles/sty-13`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch14-stage-a-browser.json`; bytes: `27,953`; SHA-256: `415ca7f78747cff78de84bc025b8a870dabca1f993e558b8a2d6dcae8354fa6d`.
- Browser surface: `Codex in-app Browser only`; fallback used: `false`.
- Functional Browser QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation href/H1/return observations `16/16`; source href/target/rel observations `28/28`.
- STY-14 actionable count: `0` per state.
- Diagnostics: `57/57` deliberately paged preparation, interaction, destination, return, screenshot and terminal pages; every accepted page has `count=0`, `hasMore=false`, `truncated=false`; terminal cursor `503 -> 503`.
- Screenshot evidence: `PASS / ACCEPTED`; accepted `4/4`; captures faithfully cover the production-analysis table viewport, not the opening or full page.

| State | Bytes | SHA-256 | Judgment |
| --- | ---: | --- | --- |
| `desktopLight` | 157,503 | `68b661c5451587e6c4c078241e058482dcc1da3a9ae9f86f560ed81db36ede56` | `CAPTURED_ACCEPTED` |
| `desktopDark` | 159,782 | `d36c848666a3768f3427f551314d8c90b4c4523aad4ad7ba1497d45b78c433cc` | `CAPTURED_ACCEPTED` |
| `mobileLight` | 49,728 | `4e788462bd23f4e736a53c5d393b493d3638ff36988371f83e55aeb5e6a1820e` | `CAPTURED_ACCEPTED` |
| `mobileDark` | 49,774 | `7e71b86f5ccdb33eefe2da98a37d1089aa41cc15b44f4a8777945a614f1543e4` | `CAPTURED_ACCEPTED` |

- A pre-session desktop-light attempt produced an actual dark-theme capture (`159,808` bytes; SHA-256 `3de550aadf15b37e8bc320d54d8d322327bc5870282faf1f49d56c47fd1bf0ea`) before the three-state theme control had settled. It is `BLOCKED / NOT_ACCEPTED`, is not present in the accepted raw, and caused a fresh IAB tab and cursor session to be started.
- The mobile light preparation exposed that the public theme control is inside the mobile navigation and cycles through system/light/dark modes. The accepted `mobileLight:prepare` page honestly spans the discovery/retry sequence (`240 -> 289`), with zero Runtime/Log events and no truncation.

## Independent review checkpoint

- Exact reviewed candidate head: `UNBOUND — controller must create and bind the exact post-evidence candidate head`.
- Independent code/spec/security review: `UNBOUND — controller must assign a read-only reviewer`.
- Independent content/evidence/rights review: `UNBOUND — controller must assign a different read-only reviewer`.
- Independent architecture/invariant review: `UNBOUND — controller must assign a third read-only reviewer`.
- Review finding totals: `UNBOUND`.
- Final Stage A review judgment: `NOT_RECORDED`.
- Scope boundary: `STAGE_A_ONLY`.
- Deployment status at this checkpoint: `NOT_RUN`.

No independent verdict is recorded in advance. The controller must bind all three reviews to the same exact candidate head and may record the final judgment only after each review reports its own findings.

## Review requests

### Code / spec / security

Read-only scope: exact-schema validators at every nested object and array; mutation sensitivity; exact implementation/head binding; complete Batch 13 review/raw/backlog identity; unique-writer and split-brain stop contracts; substituted-browser, fabricated-deployment, diagnostic-pagination and screenshot-overclaim rejection.

### Content / evidence / rights

Read-only scope: fact, vendor-case, evidence-based inference and original-analysis boundaries; seven remote source identities and summary limits; eight governed identities; original Draw.io/SVG rights; screenshot scope and the rejected pre-session attempt.

### Architecture / invariant

Read-only scope: stable affinity key; partition-local operation boundary; unique real-time authority; external durable workflow; hotspot and rebalance controls; primary epoch and split-brain stop behavior; checkpoint/log recovery; explicit non-use conditions.

