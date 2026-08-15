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
- Exact evidence head: `4923b7da22d79ecc32400669526196ca852885a4`.
- All three independent reviews examined the same exact implementation and evidence heads named above; remediation history: none.
- Independent code/spec/security review: `READY / APPROVE`; findings: `0`.
- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.
- Final Stage A review judgment: `READY`.
- The final judgment covers the exact-head implementation, governed content and rights, functional IAB evidence and invariants. Screenshot evidence remains `BLOCKED / NOT_ACCEPTED` and outside visual PASS scope.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.

### Stage A production deployment

- Exact implementation head: `70c9c61c55fa383b8619be0fbcddb02485918942`.
- The preflight fetched `origin`, required a tracked-clean worktree, confirmed `origin/main` was the exact merge-base and an ancestor of the implementation head, and measured behind/ahead as `0/23`. The sole publication command was the non-force fast-forward `git push origin HEAD:main`.
- Exact Pages run: `31907316801`; workflow: `completed / success`.
- Build job: `95067060526`; status: `completed / success`.
- Deploy job: `95067389572`; status: `completed / success`.
- The workflow, build and deploy identities above are bound to the exact implementation head; no later evidence-only run is substituted for the implementation run.

| Production route | Status | Content type |
| --- | ---: | --- |
| `/` | `200` | `text/html; charset=utf-8` |
| `/styles` | `200` | `text/html; charset=utf-8` |
| `/styles/sty-08` | `200` | `text/html; charset=utf-8` |
| `/styles/sty-05` | `200` | `text/html; charset=utf-8` |
| `/styles/sty-06` | `200` | `text/html; charset=utf-8` |
| `/styles/sty-07` | `200` | `text/html; charset=utf-8` |
| `/cases/erlang-otp-supervision-tree` | `200` | `text/html; charset=utf-8` |
| `/references` | `200` | `text/html; charset=utf-8` |

- Required HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.
- Reviewed SVG: `21,562` bytes; MIME `image/svg+xml`; SHA-256 `93a23b5c57334e96d08908146f82677faad887a30cb45b1f8066633b6e185e65`; exact reviewed byte identity: `PASS`.
- Production raw Browser JSON: `docs/reviews/evidence/g009-batch9-stage-a-production-browser.json`; `27,342` bytes; SHA-256 `3b3389d0bdfab77a07793f68161fcab6b8a0a198779af231783512553943e6ca`.
- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `12/12`; relation href/H1/return checks `16/16`; source href/target/rel checks `24/24`.
- SVG geometry: intrinsic `48x150`; rendered `800x2480`; STY-09 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED` because each repeated the opening viewport instead of covering the complete page and architecture diagram.
- No Chrome fallback, prior raw, historical screenshot, or substituted browser surface supports this production record. No visual PASS is claimed.
- Production status: `STAGE_A_FUNCTIONAL_PASS / SCREENSHOTS_BLOCKED_NOT_ACCEPTED`.
- Scope remains `STAGE_A_ONLY`; backlog and Stage B are unchanged.

## Integration candidate after origin/main divergence

This section records the non-destructive integration of the original STY-08 Stage A line with the MTH-07 line already present on `origin/main`. It does not rewrite or widen the scope of the historical Stage A approval above.

### Historical heads and review boundary

- Original STY-08 implementation candidate: `bbb2f4234c4c24993dbea108d2a19a751e778409`.
- Original STY-08 evidence head: `4923b7da22d79ecc32400669526196ca852885a4`.
- Original STY-08 final evidence-binding head: `d83ac7d119f63745f8abb62a7a3fd029c1b32e8a`.
- The three independent approvals in `Independent review checkpoint` apply only to the original implementation/evidence bundle named there. They do not review or approve the integration bundle below.
- MTH-07's existing published production record remains historical evidence: implementation `a413be060c93f7ddd20e7db5417e94f4166dc1e8`. Exact Pages run: `31786075868`; build job: `94722157542`; deploy job: `94722766883`; every status: `completed / success`. This integration neither weakens nor re-labels that production record.

### Exact integration identities

- Integration implementation candidate: `c1aebf57c638d30efe987d1c29e578f502bafb46`.
- Merge parents: `d83ac7d119f63745f8abb62a7a3fd029c1b32e8a` and `00da8b412394e89bf823c7899816026b78c71b74`.
- Integration evidence head: `1b002b8fa0f2c58019fc05e6e93efbae0bd23570`.
- Integration Browser raw: `docs/reviews/evidence/g009-batch9-integration-browser.json`, SHA-256 `14a206017541f2c7f6f09b28a3e2ab34ce0e5c1b01973777b0b4759d9a576733`.

### Combined canonical projection and semantics

- Projection: `60 completed topics / 104 content documents / 539 governed sources`.
- STY-08 remains `published / pending`.
- STY-09 remains `unpublished / pending / non-actionable`; actionable route count: `0`.
- MTH-07 remains `published / reviewed` and retains its content, diagram, sources, review, evidence, tests, and production provenance.
- Canonical ledgers were joined by stable record identity before regenerating derived content; neither branch's ledger or generated fixture was accepted as a whole-file replacement.

### Integration in-app Browser QA

- The exact integration implementation candidate was built and served locally before fresh collection using only the Codex in-app Browser.
- States accepted: `4/4`; wrapper focus checks: `12/12`; ArrowRight checks: `12/12`; relation destination/H1/return checks: `16/16`; exact remote href/target/rel checks: `24/24`.
- STY-09 actionable link count: `0` in every state. Warning/error logs: `0`; diagnostic events: `0`; every diagnostic page reported `hasMore=false` and `truncated=false`.
- Integration screenshot evidence: `BLOCKED / NOT_ACCEPTED`. Exactly three fresh IAB full-page captures repeated the opening viewport rather than the complete page and architecture diagram. No visual PASS is claimed.

### Integration review checkpoint

- Exact reviewed integration head: `2b47267977fedfba933d2d01198a476254a670fc`.
- Integration lineage: implementation `c1aebf57c638d30efe987d1c29e578f502bafb46`; evidence `1b002b8fa0f2c58019fc05e6e93efbae0bd23570`; binding/remediation `21bc9650236059afb0d0c94066394664a162e826` → `18978171ea236bbaa076b722e662ea51650ee317` → `2b47267977fedfba933d2d01198a476254a670fc`.
- Integration review head coverage: all three reviews examined exactly `2b47267977fedfba933d2d01198a476254a670fc`; no verdict covers a later binding commit.
- Independent code/spec/security review for the integration bundle: `READY / APPROVE`; findings: `0`.
- Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent architecture/invariant review for the integration bundle: `CLEAR / READY`; blockers: `0`.
- Final integration readiness: `READY`.
- Integration scope boundary: `INTEGRATION_ONLY`; no Stage B backlog mutation is authorized or performed.
- Integration deployment status: `NOT_RUN`.

## Stage B closure candidate
- Closure date: `2026-08-16`.
- Exact Stage A implementation head: `70c9c61c55fa383b8619be0fbcddb02485918942`.
- Exact Pages run: `31907316801`; workflow: `completed / success`.
- Build job: `95067060526`; status: `completed / success`.
- Deploy job: `95067389572`; status: `completed / success`.
- Required production HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.
- Reviewed production SVG: HTTP `200`; MIME `image/svg+xml`; `21,562` bytes; SHA-256 `93a23b5c57334e96d08908146f82677faad887a30cb45b1f8066633b6e185e65`; exact reviewed byte identity: `PASS`.
- Stage A production raw: `docs/reviews/evidence/g009-batch9-stage-a-production-browser.json`; `27,342` bytes; SHA-256 `3b3389d0bdfab77a07793f68161fcab6b8a0a198779af231783512553943e6ca`.
- Functional production QA: `PASS`; states `4/4`; wrapper interactions `12/12`; relation checks `16/16`; exact source checks `24/24`; STY-09 actionable count `0`; diagnostics complete and empty.
- Stage A production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three attempts were `CAPTURED_REJECTED`; no visual PASS is claimed.
- Projection: `61 completed topics / 104 content documents / 539 governed sources`.
- STY-08 target: `published / complete`.
- STY-09 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.
- Immediate immutable history: complete Batch 8 review SHA-256 `2915584034c0d480ee04713c9fadee2839f03d112ced139901a3fb2033d8ac7e`; Stage A raw `b2a09ad041c156faa1493867741dd7b1c74241fbd96005903335b3d5076d4122`; Stage A production raw `753a94cf2ef53d054959dc6c115d4f29e484c651a06fe4c5c7d617358fd8b192`; Stage B production raw `b5605b255f87041524e25a898bd5f0b27ec912322b8d1fd814c3032abb88a99a`; backlog suffix `dba312f190706ae7112ea057addefe58ceff4cdd15bad39264efbd58b129c354`.
- Exact Stage B reviewed head: `0d94d407177f71376a34ffd572d5a7a35a596903`.
- Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.
- Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.
- Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.
- Final Stage B review judgment: `READY`.
- Stage B scope boundary: `STAGE_B`.
- Stage B deployment status: `PENDING / NOT_RUN`.
