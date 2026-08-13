# G009 Batch 7 Stage A Review

## Stage A projection

- Projection: 58 completed topics / 101 content documents / 525 governed sources.
- STY-06: `published / pending`.
- STY-07: `unpublished / pending`; actionable route count: `0`.
- Scope: only the STY-06 Stage A candidate; Stage B backlog closure has not run.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-06-event-driven-architecture.mdx` | 22,808 | `ebae2fcdb42bf59b57f9ee27c9b013c8fa99cab3bb7bea68a075feabf438ff7f` |
| `diagrams/sty-06-event-driven-four-patterns.drawio` | 42,873 | `b6b704da9045795aa7dab7c8b8b0bd1a54a26ee02e11c347284ef8a7ad037d90` |
| `static/img/diagrams/sty-06-event-driven-four-patterns.svg` | 28,517 | `72d99df5265620262517c218eb83555b6004de77432630e87eaa8a55cbc6388b` |
| `data/source-ledger.json` | 1,530,168 | `d190f155af33d18e40a106cc08ade2adde71e3928e9b4d12b823940a85a7c96c` |

- Governed STY-06 sources: `6`; remote anchors per state: `5`; distinct remote domains: `4` (`martinfowler.com`, `learn.microsoft.com`, `github.com`, `w3.org`).
- Exactly one STY-06 citation is `manifest_primary`; the original diagram is governed separately as illustration rights.

## Local in-app Browser QA

The exact local production build was served from candidate head `44fcafbef24b68f14a9cbf4be0b3fba09cc6002d` at `/tego-arch/styles/sty-06` using only the Codex in-app Browser.

| State | Requested viewport/theme | Page client/scroll | Diagram; failure table; matrix client/scroll | ArrowRight before→after | Diagnostics |
| --- | --- | --- | --- | --- | --- |
| `desktopLight` | `1440x1000` / light | `1440/1440` | `800/800`; `800/1118`; `800/1342` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `desktopDark` | `1440x1000` / dark | `1440/1440` | `800/800`; `800/1118`; `800/1342` | `0→0`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileLight` | `390x844` / light | `390/390` | `358/800`; `358/1118`; `358/1342` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |
| `mobileDark` | `390x844` / dark | `390/390` | `358/800`; `358/1118`; `358/1342` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |

- States accepted: `4/4`.
- Wrapper interaction checks: `12/12`.
- Relation destination/H1/return checks: `16/16`.
- Remote source anchors: `5` per state; unique remote domains: at least `4` per state.
- STY-07 actionable count: `0` in every state.
- Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.
- SVG loaded in all four states; intrinsic `92x150`; rendered `800x1300`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch7-stage-a-browser.json`, SHA-256 `805a0f92b4e0f50847b5d013419584a3972641bf560fa9669ecd4c5228e5467c`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.
- Screenshot limitation: four fresh files were created, but repeated in-app Browser viewport overrides changed other open tabs and the mobile light/dark captures became byte-identical. Those files are retained only as rejected diagnostic artifacts; no visual PASS or screenshot hash is claimed. No Chrome, standalone Playwright, old screenshot, or invented evidence was substituted.

## Independent review checkpoint

- Exact reviewed head: `44fcafbef24b68f14a9cbf4be0b3fba09cc6002d`.
- Exact evidence/remediation head: `f24b4d4a4ebd95bf454f6e87200c83476dc91971`.
- Remediation history: `8cb36055d3aeafdbcecf39d7b370619bef3d4b60` bound the uniform four-state evidence and restored the historical Batch 6 artifact locks; `f24b4d4a4ebd95bf454f6e87200c83476dc91971` archived the raw evidence and tightened its exact semantic contract.
- Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.
- Independent content, evidence, and rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent architecture reviewer (`architect`): `CLEAR / READY`; blockers: `0`.
- Final Stage A review judgment: `READY`.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.

The implementation agent did not issue any independent verdict. Root-owned reviewers bound their final results to the immutable implementation candidate and tracked evidence/remediation head above; Stage B closure and deployment remain outside this verdict.
