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

The local production build had the exact render-affecting bytes committed at implementation candidate head `76607c67242757e0e1da1f9e352844b36481fcef` and was served at `/tego-arch/styles/sty-07` using only the Codex in-app Browser; the subsequent evidence-only commit does not change the build.

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
- Raw Browser JSON: `docs/reviews/evidence/g009-batch8-stage-a-browser.json`, SHA-256 `067a0a461a250ff9a10e89e7d06f287a6ac8631e63167c578abbef9b1e90fce7`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`. Inspection proved the captured full-page image started at “禁用条件” and did not cover the article opening or diagram; two subsequent supported IAB reconnect attempts reported the selector/family unavailable. The raw JSON records all three attempts, including the rejected image bytes/hash. No Chrome fallback, old image, or visual PASS is claimed.

## Independent review checkpoint

- Exact implementation candidate head: `76607c67242757e0e1da1f9e352844b36481fcef`.
- Evidence candidate: the tracked generated projection, deployment contract, review draft, and raw Browser artifact in this Task 4 commit.
- Independent code/spec/security review: `PENDING`.
- Independent content/evidence/rights review: `PENDING`.
- Independent architecture/invariant review: `PENDING`.
- Final Stage A review judgment: `PENDING`.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.

The implementation assessment found no runtime, geometry, relation, source-destination, rights-identity, or next-topic blocker in the exact candidate. The implementation agent does not issue any independent verdict; root-owned reviewers must bind all three slots to one exact head before final `READY` can be claimed.
