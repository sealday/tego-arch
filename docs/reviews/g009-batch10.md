# G009 Batch 10 Stage A Review

## Stage A projection

- Projection: `61 completed topics / 105 content documents / 544 governed sources`.
- STY-09: `published / pending`.
- STY-10: `unpublished / pending / non-actionable`; actionable route count: `0`.
- This record is a local Stage A candidate only. It does not close the backlog and does not authorize deployment.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-09-pipes-and-filters.mdx` | 20,209 | `1dcf55ace2a6b8f30da94e81d36d9f79a16db400bc419c35318cc8dbe8eba7b6` |
| `diagrams/sty-09-pipes-filters-order-processing.drawio` | 70,558 | `36da252d3fe71b1f0c3df6db5a887677b83def7ee11f542f938c9d3027fbf97c` |
| `static/img/diagrams/sty-09-pipes-filters-order-processing.svg` | 25,205 | `1568fc09dbb6637d54e66d0058d9479cbf2e59d990753489781a119a06fb1a29` |
| `data/source-ledger.json` | 1,599,660 | `cc94104f499f07400785118fb791efed66d9d4588f7b3ba9de160eb031e29a7f` |

- Governed STY-09 sources: `5`; remote anchors per state: `4`; original diagram rights remain governed separately.
- Exactly one STY-09 citation is `manifest_primary`.

## Immutable immediate history

- Complete immediate STY-08 review SHA-256: `f7d0aba59dd69d6479bbfbdb6f9f3cf1befadcf076c44ff5f97f31d6452778ed`.
- Complete immediate STY-08 backlog suffix SHA-256: `3a8d6ccda815614132a33ca8ec2c0dca286628c20900d9e32a4403f0ffd56c6b`.
- The backlog is unchanged: STY-09 remains unchecked for Stage A and STY-10 remains unchecked, unpublished, pending and non-actionable.

## Generated projection audit

- `npm run generate:content` and `npm run check:content`: `PASS`.
- Generated line delta: `360 insertions / 46 deletions` across four current projection files.

| Generated artifact | Before bytes | Candidate bytes | Byte delta | Line delta |
| --- | ---: | ---: | ---: | ---: |
| `src/generated/project-status.json` | 415 | 415 | 0 | `+2 / -2` |
| `src/generated/source-ledger.json` | 1,855,594 | 1,871,834 | +16,240 | `+286 / -0` |
| `src/generated/topic-indexes.json` | 221,023 | 221,389 | +366 | `+36 / -22` |
| `src/generated/topic-manifest.json` | 220,869 | 221,235 | +366 | `+36 / -22` |

- The five new unique governed identities are `src-microsoft-pipes-filters-pattern`, `src-apache-beam-programming-guide`, `src-reactive-streams-1-0-4`, `src-gnu-bash-pipelines`, and `src-atlas-sty09-pipes-filters-order-processing`.
- The first full Node run correctly exposed `66` current projection, pagination, corpus inventory, reciprocal adjacency, prose seam, rights-inventory and current schema-registry fixtures. No historical review/raw/Pages/backlog evidence literal was changed.
- Current-facing fixture synchronization and reciprocal prose seam repair are complete; the final pre-candidate full Node suite is `1260/1260 PASS`.

## Local in-app Browser QA

- The exact implementation candidate `d2748e204cd55654d1cd5b6dce4fdc88ca95bbb4` was rebuilt and served at `http://127.0.0.1:3420/tego-arch/styles/sty-09` through the Codex in-app Browser only.
- States accepted: `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks: `12/12`.
- Relation destination/H1/return checks: `20/20`.
- SVG loaded in every state: intrinsic `120x150`; rendered `800x1000`.
- Source href/`_blank`/`noopener noreferrer` checks: `16/16`; STY-10 actionable count: `0` per state.
- Diagnostics are complete and empty in every state: warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false` and `truncated=false`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch10-stage-a-browser.json`; `24,971` bytes; SHA-256 `acc7c8154a8c6199cd92b8d68d258d7a0fb5e2e86eb8a1931219d36d9c72d7bf`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.
- Exactly three fresh IAB full-page captures repeated viewport content and omitted complete architecture-diagram coverage. Each original is recorded as `CAPTURED_REJECTED` with its exact path, byte count, SHA-256 and reason; no fourth attempt was made.
- No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed.

## Independent review checkpoint

- Exact implementation candidate head: `d2748e204cd55654d1cd5b6dce4fdc88ca95bbb4`.
- Exact evidence head: `1691a914037b25d363e33c6c3d5ab3b8a5bf2206`.
- Independent code/spec/security review: `READY / APPROVE`; findings: `0`.
- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.
- Final Stage A review judgment: `READY`.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.

## Stage A production deployment

- Exact reviewed Stage A head: `50ba9d2b18617b3bed84c6e17ddb696665b5a434`.
- Preflight: tracked clean; `origin/main` exact merge-base and ancestor; behind/ahead `0/20`; publication used one non-force fast-forward push.
- Exact Pages run: `32014770938`; workflow: `completed / success`.
- Build job: `95341784622`; status: `completed / success`.
- Deploy job: `95342598744`; status: `completed / success`.
- The workflow, build and deploy identities bind the reviewed Stage A head; no evidence-only run is substituted.

| Production route | Status | Content type |
| --- | ---: | --- |
| `/` | `200` | `text/html; charset=utf-8` |
| `/styles` | `200` | `text/html; charset=utf-8` |
| `/styles/sty-09` | `200` | `text/html; charset=utf-8` |
| `/styles/sty-05` | `200` | `text/html; charset=utf-8` |
| `/styles/sty-06` | `200` | `text/html; charset=utf-8` |
| `/cases/apache-kafka-consumer-groups` | `200` | `text/html; charset=utf-8` |
| `/quality-attributes/qa-03` | `200` | `text/html; charset=utf-8` |
| `/paths/reliability-state` | `200` | `text/html; charset=utf-8` |
| `/references` | `200` | `text/html; charset=utf-8` |

- Required HTML routes: `9/9`; every route returned `200` with `text/html; charset=utf-8`.
- Reviewed SVG: `25,205` bytes; MIME `image/svg+xml`; SHA-256 `1568fc09dbb6637d54e66d0058d9479cbf2e59d990753489781a119a06fb1a29`; exact reviewed byte identity: `PASS`.
- Production raw Browser JSON: `docs/reviews/evidence/g009-batch10-stage-a-production-browser.json`; `26,937` bytes; SHA-256 `f2c0e43de924aedb9afba39ec26500c869b42f170f4b46e3792003433aa953aa`.
- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `12/12`; relation href/H1/return checks `20/20`; source href/target/rel checks `16/16`.
- SVG geometry: intrinsic `120x150`; rendered `800x1000`; STY-10 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED` because each repeated viewport content and omitted complete architecture-diagram coverage.
- No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.
- Stage A deployment status: `SUCCESS`; functional production status: `PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.
- Scope remains `STAGE_A_ONLY`; the STY-09 backlog checkbox and all Stage B/STY-10 state are unchanged.
