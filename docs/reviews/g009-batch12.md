# G009 Batch 12 Stage A Review

## Stage A projection

- Projection: `63 completed topics / 107 content documents / 560 governed sources`.
- STY-11: `published / pending`.
- STY-12: `unpublished / pending / non-actionable`; actionable route count: `0`.
- This record is the implementation-candidate checkpoint. Browser evidence and independent review verdicts remain pending, and it does not close the backlog or authorize deployment.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-11-serverless-architecture.mdx` | 22,944 | `b10dc45592afb5a9456108cfbc9616de1285e00199615f566df2011102d1ff34` |
| `data/source-ledger.json` | 1,644,284 | `0f3856dc6291e1e8f78622c08c2fa0da8af54d11cc24cbd679a3557ab920beef` |
| `diagrams/sty-11-serverless-order-fulfillment.drawio` | 45,682 | `30d7342c98e646f1f57ab7489081aa178b2ece91fac11fd3e2ac8c5b7955c51f` |
| `static/img/diagrams/sty-11-serverless-order-fulfillment.svg` | 20,933 | `6a280c627194922d8d9300d40388ece52bc3043414c6ac34d327a157153e376f` |

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

- Exact implementation candidate head: `ac9fd538721c1bb41503eff9dc9789354f48f700`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch12-stage-a-browser.json`; bytes: `34,985`; SHA-256: `b0db5d8e7010f227ed87464d77c1b25364dd9c13c62c70ad87364d3ce1350e5b`.
- Functional Browser QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation href/H1/return observations `12/12`; source href/target/rel observations `40/40`.
- SVG loaded in every state: source `2400x3600`; rendered `800x1200`; observed asset bytes `20,933`; exact reviewed SVG SHA-256 match: `PASS`.
- STY-12 actionable count: `0` per state.
- Diagnostics are complete and empty in every state: warning/error logs `0`, Runtime/Log events `0`, `hasMore=false`, `truncated=false`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.
- Exactly three fresh full-page attempts are `CAPTURED_REJECTED`; original bytes were inspected; no fourth attempt was made.

| Screenshot attempt | Encoded bytes | Dimensions | SHA-256 | Result |
| --- | ---: | ---: | --- | --- |
| `desktopLight` | 838,534 | `1440x10831` | `8640ae56458788dae909a992855e3596a176b38792a1298d1e439b801fcb0bd0` | `CAPTURED_REJECTED`: repeated article sections and architecture diagram |
| `desktopDark` | 839,953 | `1440x10831` | `56b2927cb9d673f16bfcd8f784fe66a523ff1f5b26994af0bc5a99cd2da3190d` | `CAPTURED_REJECTED`: repeated article sections and architecture diagram |
| `mobileLight` | 563,157 | `390x15619` | `e27bac3d9ce728cf8b3802eb89ad1c9a7964883d5236d2cf8084b1cdce87f5df` | `CAPTURED_REJECTED`: repeated sections, large blank interval and missing faithful continuous diagram coverage |

- The rejected screenshot originals remain untracked; their exact in-memory Browser bytes were inspected and bound in the raw record by format, dimensions, byte count and SHA-256.
- No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.

## Independent review checkpoint

- Exact implementation candidate head: `ac9fd538721c1bb41503eff9dc9789354f48f700`.
- Exact Browser evidence head: `PENDING`.
- Exact independent review head: `PENDING`.
- Independent code/spec/security review: `PENDING`; findings: `PENDING`.
- Independent content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.
- Independent architecture/invariant review: `PENDING`; blockers: `PENDING`.
- Final Stage A review judgment: `PENDING`.
- Scope boundary: `STAGE_A_ONLY`.
- Deployment status: `NOT_RUN`.
