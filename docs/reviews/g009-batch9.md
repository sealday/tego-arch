# G009 Batch 9 Stage A Review

## Stage A projection

- Projection: `60 completed topics / 103 content documents / 535 governed sources`.
- STY-08: `published / pending`.
- STY-09: `unpublished / pending / non-actionable`; actionable route count: `0`.
- This record is a local Stage A candidate only. It does not close the backlog and does not authorize deployment.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-08-actor-model.mdx` | 22,771 | `b9f0af60f535bdce6269e5ffce3ec4aee03730fde344957eee0d3f02196c377c` |
| `diagrams/sty-08-actor-order-fulfillment.drawio` | 43,266 | `d323a34b4130c843f3c3c96547bf61a690d97dcccd93794b9c228f435548e62b` |
| `static/img/diagrams/sty-08-actor-order-fulfillment.svg` | 21,562 | `93a23b5c57334e96d08908146f82677faad887a30cb45b1f8066633b6e185e65` |
| `data/source-ledger.json` | 1,555,131 | `29b62da07c5dedbf8d87baaf56ccd4bce1036b5aadda176b1d7ee64ac908557e` |

- Governed STY-08 sources: `7`; remote anchors per state: `6`; original diagram rights remain governed separately.
- Exactly one STY-08 citation is `manifest_primary`.

## Local in-app Browser QA

The exact implementation candidate `bbb2f4234c4c24993dbea108d2a19a751e778409` was rebuilt and served at `http://127.0.0.1:3418/tego-arch/styles/sty-08`, then collected from scratch using only the Codex in-app Browser.

| State | Viewport/theme | Page client/scroll | Diagram; comparison; decision client/scroll | ArrowRight before→after | Diagnostics |
| --- | --- | --- | --- | --- | --- |
| `desktopLight` | `1440x1000` / light | `1440/1440` | `800/800`; `800/1171`; `800/1764` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `desktopDark` | `1440x1000` / dark | `1440/1440` | `800/800`; `800/1171`; `800/1764` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileLight` | `390x844` / light | `390/390` | `358/800`; `358/1171`; `358/1764` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileDark` | `390x844` / dark | `390/390` | `358/800`; `358/1171`; `358/1764` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |

- States accepted: `4/4`; wrapper interaction checks: `12/12`; every before/after state retained focus, `:focus-visible` and its exact `3px` outline.
- Relation destination/H1/return checks: `16/16`. The Erlang/OTP case route's rendered H1 is `监督树：把失败恢复设计成层级控制协议`; its longer front matter title is not substituted for the observed H1.
- SVG loaded in every state: intrinsic `48x150`; rendered `800x2480`.
- Remote source anchors: `6` per state; exact href/`_blank`/`noopener noreferrer` checks: `24/24`; STY-09 actionable count: `0` per state.
- Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false` and `truncated=false`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch9-stage-a-browser.json`, SHA-256 `fa3fdecb77c55c8e2a013d95bbe9684afde05e3027583a9b3d1feb405a758932`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`. Exactly three fresh IAB full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram. Their exact state, viewport, path, byte size, SHA-256, status and rejection reason are bound in the raw JSON. No Chrome fallback, prior raw, old screenshot or visual PASS is claimed.

## Independent review checkpoint

- Exact implementation candidate head: `bbb2f4234c4c24993dbea108d2a19a751e778409`.
- Exact evidence head: `PENDING`.
- Independent code/spec/security review: `PENDING`.
- Independent content/evidence/rights review: `PENDING`; rights: `PENDING`.
- Independent architecture/invariant review: `PENDING`.
- Final Stage A review judgment: `PENDING`.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.
