# G009 Batch 12 Stage A Review

## Stage A projection

- Projection: `63 completed topics / 107 content documents / 560 governed sources`.
- STY-11: `published / pending`.
- STY-12: `unpublished / pending / non-actionable`; actionable route count: `0`.
- This record binds the exact candidate, Browser evidence, regression-guard head and three zero-finding independent reviews as the final Stage A READY checkpoint, and now binds its exact production publication below. It does not close the backlog or run Stage B.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-11-serverless-architecture.mdx` | 23,126 | `85561b6c44acc1518f416e12cb507b6c4a2a57369c6cdda8c8df176165d2bbd6` |
| `data/source-ledger.json` | 1,644,284 | `0f3856dc6291e1e8f78622c08c2fa0da8af54d11cc24cbd679a3557ab920beef` |
| `diagrams/sty-11-serverless-order-fulfillment.drawio` | 47,529 | `9862fcb5be62941553780b2a58751a3f9af2ba7a32dace3549cc3ca6d1daa00e` |
| `static/img/diagrams/sty-11-serverless-order-fulfillment.svg` | 21,881 | `6a166a208e31cb1c6313cd2a21ff17ce124ab6b463821bb3b108275000fa2094` |

- Governed STY-11 sources: `11`; remote anchors per state: `10`; original diagram rights remain governed separately.
- Exactly one STY-11 citation is `manifest_primary`.

## Immutable immediate history

- Complete immediate STY-10 review SHA-256: `9276cb7b4c6e66ac50375a4f58df8220255644afd1f45cb46c943db610c10a39`.
- Complete immediate STY-10 backlog suffix SHA-256: `aa6c304cf11bca2472f884cba795782e03b579415b859864c5c4e5d0d60a978f`.
- The backlog is unchanged: STY-11 remains unchecked and pending; STY-12 remains unchecked, unpublished, pending and non-actionable.

## Generated projection audit

- `npm run generate:content` and `npm run check:content`: `PASS`.
- Generated line delta: `1,693 insertions / 1,088 deletions` across four current projection files.

| Generated artifact | Before bytes | Candidate bytes | Byte delta | Line delta |
| --- | ---: | ---: | ---: | ---: |
| `src/generated/project-status.json` | 415 | 415 | 0 | `+2 / -2` |
| `src/generated/source-ledger.json` | 1,891,418 | 1,923,990 | +32,572 | `+1,621 / -1,042` |
| `src/generated/topic-indexes.json` | 221,774 | 222,221 | +447 | `+35 / -22` |
| `src/generated/topic-manifest.json` | 221,620 | 222,067 | +447 | `+35 / -22` |

- The ten newly projected governed identities are `src-cncf-serverless-whitepaper-v1`, `src-cncf-serverless-glossary`, `src-aws-lambda-runtime-lifecycle`, `src-aws-lambda-invocation-retries`, `src-aws-lambda-concurrency`, `src-aws-lambda-pricing`, `src-azure-functions-scale-hosting`, `src-google-cloud-run-concurrency`, `src-open-workflow-specification-103`, and `src-atlas-sty11-serverless-order-fulfillment`; `src-cncf-cloudevents-102-spec` was already projected for an earlier document and is newly cited by STY-11 without creating a duplicate source identity.
- The first full Node run exposed `72` current projection, pagination, corpus inventory, source-health, reciprocal adjacency and reader-facing seam fixtures; each failure was classified before editing.
- Current-facing fixture synchronization is complete; historical review/raw/Pages/backlog bytes and literals remain unchanged.

## Local in-app Browser QA

- Exact remediation implementation candidate head: `4405d38bc70a3eb3711319c00c54f069e333a8aa`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch12-stage-a-browser.json`; bytes: `34,866`; SHA-256: `a4c80875fbcf06b3f524a55f3a55a80639f3b3335a3ac7e6d173a4f4b98bbe4d`.
- Functional Browser QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation href/H1/return observations `12/12`; source href/target/rel observations `40/40`.
- SVG loaded in every state: source `2400x3600`; rendered `800x1200`; observed asset bytes `21,881`; observed SHA-256 matches the canonical artifact identity.
- STY-12 actionable count: `0` per state.
- Diagnostics are complete and empty in every state: warning/error logs `0`, Runtime/Log events `0`, `hasMore=false`, `truncated=false`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.
- Exactly three fresh full-page attempts are `CAPTURED_REJECTED`; original bytes were inspected; no fourth attempt was made.

| State | Bytes | SHA-256 | Dimensions | Judgment |
| --- | ---: | --- | --- | --- |
| `desktopLight` | 839,708 | `d73aa6857bd8aedf7bd0f63b330e4712e485c29ffe121f1f3df3257612f4fc71` | `1440x10881` | Rejected: repeated article sections and architecture diagram. |
| `desktopDark` | 842,052 | `619545ee7e57f01eaceca1cdb6b5969e8fb1534c9b0b207403f15870687be5c9` | `1440x10881` | Rejected: repeated article sections and architecture diagram. |
| `mobileLight` | 599,835 | `e649e892ed2f16ebc0cce8432c87688d888518c9d51213a622b2a478ce344572` | `390x15730` | Rejected: repeated sections, a large blank interval, and omitted faithful continuous diagram coverage. |

- Rejected screenshot originals remain untracked in the active in-app Browser evidence session; no Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.

## Independent review checkpoint

- Exact implementation candidate head: `4405d38bc70a3eb3711319c00c54f069e333a8aa`.
- Exact Browser evidence head: `0e074a91731ae5fe77bca550bf905c213eca5af1`.
- Exact independent review head: `c4431c9d13998ec88cebe716db9156700917b6c2`.
- Independent code/spec/security review: `READY / APPROVE`; findings: `0`.
- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.
- Final Stage A review judgment: `READY`.
- Scope boundary: `STAGE_A_ONLY`.
- Deployment status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`.

## Stage A production deployment

- Exact published Stage A READY head: `1cf010f13c6e9e98240de7e1d5e7d1c380bdc073`.
- Exact Pages push run: `32936647570`; `headSha=1cf010f13c6e9e98240de7e1d5e7d1c380bdc073`; workflow: `completed / success`.
- Build job: `98079000160`; status: `completed / success`.
- Deploy job: `98079641183`; status: `completed / success`.
- The workflow, build and deploy identities bind the exact reviewed READY head; no evidence-only run is substituted.

| Production route | Status | Content type |
| --- | ---: | --- |
| `/tego-arch/` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles/sty-06` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles/sty-09` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles/sty-11` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/cases` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/cases/cloudflare-durable-objects-workerd` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/references` | `200` | `text/html; charset=utf-8` |

- Required HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.
- Reviewed SVG: `21,881` bytes; MIME `image/svg+xml`; SHA-256 `6a166a208e31cb1c6313cd2a21ff17ce124ab6b463821bb3b108275000fa2094`; exact reviewed byte identity: `PASS`.
- Production raw Browser JSON: `docs/reviews/evidence/g009-batch12-stage-a-production-browser.json`; `36,313` bytes; SHA-256 `31c7ac54204040af70b529a45ef2fbba2cb92b4635a52f0f0086385f1bee346e`.
- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `16/16`; relation href/H1/return checks `12/12`; source href/target/rel checks `40/40`.
- Relation destinations used direct exact-href navigation followed by Browser back; no physical relation click is claimed.
- SVG geometry: source `viewBox="0 0 2400 3600"` and `2400x3600`; Browser-natural `100x150`; rendered `800x1200`; STY-12 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED`; all repeated article sections or the architecture diagram, and the mobile attempt also contained a large blank interval and omitted faithful continuous diagram coverage.
- No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.
- Stage A deployment status: `SUCCESS`; functional production status: `PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.
- Scope remains `STAGE_A_ONLY`; backlog, generated projection, Stage B and STY-12 are unchanged.

## Stage B closure candidate

- Closure date: `2026-08-26`.
- Exact Stage A implementation head: `1cf010f13c6e9e98240de7e1d5e7d1c380bdc073`.
- Exact Pages run: `32936647570`; workflow: `completed / success`.
- Build job: `98079000160`; status: `completed / success`.
- Deploy job: `98079641183`; status: `completed / success`.
- Required production HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.
- Reviewed production SVG: HTTP `200`; MIME `image/svg+xml`; `21,881` bytes; SHA-256 `6a166a208e31cb1c6313cd2a21ff17ce124ab6b463821bb3b108275000fa2094`; exact reviewed byte identity: `PASS`.
- Stage A Browser raw: `docs/reviews/evidence/g009-batch12-stage-a-browser.json`; `34,866` bytes; SHA-256 `a4c80875fbcf06b3f524a55f3a55a80639f3b3335a3ac7e6d173a4f4b98bbe4d`.
- Stage A production Browser raw: `docs/reviews/evidence/g009-batch12-stage-a-production-browser.json`; `36,313` bytes; SHA-256 `31c7ac54204040af70b529a45ef2fbba2cb92b4635a52f0f0086385f1bee346e`.
- Functional production QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation checks `12/12`; exact source checks `40/40`; STY-12 actionable count `0`; diagnostics complete and empty.
- Stage A production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three attempts were `CAPTURED_REJECTED`; no visual PASS is claimed.
- Projection: `64 completed topics / 107 content documents / 560 governed sources`.
- STY-11 target: `published / complete`.
- STY-12 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.
- Immediate immutable history: complete Batch 11 review SHA-256 `9276cb7b4c6e66ac50375a4f58df8220255644afd1f45cb46c943db610c10a39`; backlog suffix `aa6c304cf11bca2472f884cba795782e03b579415b859864c5c4e5d0d60a978f`.
- Exact Stage B reviewed head: `fabd8adc8338ecaa7dddf0baff98ad7bd68996f7`.
- Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.
- Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent Stage B architecture/invariant review: `ARCHITECTURE READY`; findings: `0`; blockers: `0`.
- Final Stage B readiness: `READY`.
- Stage B scope boundary: `STAGE_B`.
- Stage B deployment status: `PENDING / NOT_RUN`.
- Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.

## Stage B production deployment

- Exact published Stage B READY head: `0b0127d4d658d0300d6d20395080000955f0fc47`.
- Exact Pages push run: `32941341129`; `headSha=0b0127d4d658d0300d6d20395080000955f0fc47`; workflow: `completed / success`.
- Build job: `98092768863`; status: `completed / success`.
- Deploy job: `98093498138`; status: `completed / success`.
- The workflow, build and deploy identities bind the exact Stage B READY head; no evidence-only run is substituted.

| Production route | Status | Content type |
| --- | ---: | --- |
| `/tego-arch/` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles/sty-06` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles/sty-09` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/styles/sty-11` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/cases` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/cases/cloudflare-durable-objects-workerd` | `200` | `text/html; charset=utf-8` |
| `/tego-arch/references` | `200` | `text/html; charset=utf-8` |

- Required HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.
- Reviewed SVG: `21,881` bytes; MIME `image/svg+xml`; SHA-256 `6a166a208e31cb1c6313cd2a21ff17ce124ab6b463821bb3b108275000fa2094`; exact reviewed byte identity: `PASS`.
- Stage B production raw Browser JSON: `docs/reviews/evidence/g009-batch12-stage-b-production-browser.json`; `36,594` bytes; SHA-256 `f3616447f2b5db750c5d6a66b9befe15105beda023255c83d3888903a9e7e4e3`.
- Projection: `64 completed topics / 107 content documents / 560 governed sources`; STY-11 is `published / complete`; STY-12 is `unpublished / pending / non-actionable` with actionable count `0`.
- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `16/16`; relation href/H1/return checks `12/12`; source href/target/rel checks `40/40`.
- Relation destinations used direct exact-href navigation followed by Browser back; no physical relation click is claimed.
- SVG geometry: source `viewBox="0 0 2400 3600"` and `2400x3600`; Browser-natural `100x150`; rendered `800x1200`; STY-12 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh full-page attempts are `CAPTURED_REJECTED`; original bytes were inspected; all repeated article sections or the architecture diagram, and the mobile attempt also contained a large blank interval and omitted faithful continuous diagram coverage; no fourth attempt was made and no visual PASS is claimed.
- No Chrome fallback, external Playwright, prior raw, historical screenshot, substituted browser surface or fabricated success is claimed.
- Stage B deployment status: `SUCCESS`; functional production status: `PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.
- Scope is closed at `STAGE_B`; STY-12 remains untouched, unpublished, pending and non-actionable.
