# G009 Batch 12 Stage A Review

## Stage A projection

- Projection: `63 completed topics / 107 content documents / 560 governed sources`.
- STY-11: `published / pending`.
- STY-12: `unpublished / pending / non-actionable`; actionable route count: `0`.
- This record is the implementation-candidate checkpoint. Browser evidence and independent review verdicts remain pending, and it does not close the backlog or authorize deployment.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-11-serverless-architecture.mdx` | 23,126 | `85561b6c44acc1518f416e12cb507b6c4a2a57369c6cdda8c8df176165d2bbd6` |
| `data/source-ledger.json` | 1,644,284 | `0f3856dc6291e1e8f78622c08c2fa0da8af54d11cc24cbd679a3557ab920beef` |
| `diagrams/sty-11-serverless-order-fulfillment.drawio` | 47,529 | `9862fcb5be62941553780b2a58751a3f9af2ba7a32dace3549cc3ca6d1daa00e` |
| `static/img/diagrams/sty-11-serverless-order-fulfillment.svg` | 21,797 | `cab720062be02939b78988613102852453d86aa984ab38226ffc273a856ac251` |

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

- Exact remediation implementation candidate head: `a84f24b5bfae09f3d58a1dbb1d8ef14795727d9f`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch12-stage-a-browser.json`; bytes: `34,350`; SHA-256: `7e3f4c9243eaaf0e9028e29b9ff1d8c08bf3c5aaf47002023eaecddaa7f6738c`.
- Functional Browser QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation href/H1/return observations `12/12`; source href/target/rel observations `40/40`.
- SVG loaded in every state: source `2400x3600`; rendered `800x1200`; observed asset bytes `21,797`; exact reviewed SVG SHA-256 match: `PASS`.
- STY-12 actionable count: `0` per state.
- Diagnostics are complete and empty in every state: warning/error logs `0`, Runtime/Log events `0`, `hasMore=false`, `truncated=false`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.
- Exactly three fresh full-page attempts are `CAPTURED_REJECTED`; original bytes were inspected; no fourth attempt was made.

| Screenshot attempt | Encoded bytes | Dimensions | SHA-256 | Result |
| --- | ---: | ---: | --- | --- |
| `desktopLight` | 839,763 | `1440x10881` | `269ad548942a6e5ffe6ba8608d40b06c23b6e2c24b0b442be3de2718c7a9af69` | `CAPTURED_REJECTED`: repeated article sections and architecture diagram |
| `desktopDark` | 841,946 | `1440x10881` | `0e491d3c8f0fd25d8a2949df7bda40b00de04f9753fe383d879e3ca6ee94978c` | `CAPTURED_REJECTED`: repeated article sections and architecture diagram |
| `mobileLight` | 599,835 | `390x15730` | `e649e892ed2f16ebc0cce8432c87688d888518c9d51213a622b2a478ce344572` | `CAPTURED_REJECTED`: repeated sections, large blank interval and missing faithful continuous diagram coverage |

- The rejected screenshot originals remain untracked; their exact in-memory Browser bytes were inspected and bound in the raw record by format, dimensions, byte count and SHA-256.
- The prior candidate's raw observations and screenshot attempts are not accepted for this render-changing remediation. No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.

## Independent review checkpoint

- Exact implementation candidate head: `a84f24b5bfae09f3d58a1dbb1d8ef14795727d9f`.
- Exact Browser evidence head: `PENDING`.
- Exact independent review head: `PENDING`.
- Independent code/spec/security review: `PENDING`; findings: `PENDING`.
- Independent content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.
- Independent architecture/invariant review: `PENDING`; blockers: `PENDING`.
- Final Stage A review judgment: `PENDING`.
- Scope boundary: `STAGE_A_ONLY`.
- Deployment status: `NOT_RUN`.
