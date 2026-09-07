# G009 Batch 15 — STY-14 Architecture Style Choice Matrix Review

## Stage A candidate

- Scope: `STAGE_A_ONLY`.
- STY-14 lifecycle: `published / pending`.
- STY-15 lifecycle: `absent / unpublished / pending / non-actionable`.
- Projection: `84 completed topics / 127 content documents / 600 governed sources`.
- Reviewed implementation/evidence head: `1b5ab36d4fd7fb660f7a3df90c2e564d95e331cb`.
- Code/spec/security review: `READY / APPROVE / findings 0`.
- Content/evidence/rights review: `CONTENT READY / rights PASS / findings 0`.
- Architecture/invariant review: `CLEAR / READY / blockers 0`.
- Final Stage A judgment: `READY`.
- Deployment status: `SUCCESS / functional PASS; screenshots BLOCKED / NOT_ACCEPTED`.

## Independent Stage A reviews

- Code/spec/security: exact head `1b5ab36d4fd7fb660f7a3df90c2e564d95e331cb`; reviewed range `6a6ebe3..1b5ab36`; verdict `READY / APPROVE / findings 0`; Critical/Important/Minor `0/0/0`; `352` targeted tests and full repository/gates passed.
- Content/evidence/rights: exact head `1b5ab36d4fd7fb660f7a3df90c2e564d95e331cb`; verdict `CONTENT READY / rights PASS / findings 0`; `391` targeted tests passed; no new Browser observations performed.
- Architecture/invariants: exact head `1b5ab36d4fd7fb660f7a3df90c2e564d95e331cb`; verdict `CLEAR / READY / blockers 0`; `1804/1804` repository tests passed; no new Browser observations performed; production still requires fresh four-state verification.
- Binding boundary: these three independent read-only verdicts review the candidate and existing evidence, not a deployment. Task 5 performs no new Browser collection or deployment; screenshot evidence remains `BLOCKED / NOT_ACCEPTED`; deployment remains `NOT_RUN`.

## Local Browser evidence

- Raw Browser artifact: `docs/reviews/evidence/g009-batch15-stage-a-browser.json`; bytes `32300`; SHA-256 `b27cf34181529dfbcaf6eccd533d65fd0db5f8552b1dd08def0fbd95150c4609`.
- Browser build input identity: `286 files / 76c94055d82ab1460f1a6f93f21245b3e4adf1bd11ac9f21b57535fe2091d610`; base head `463f1dec2ae0b35eedcf6fef2933f11ad60d74f8`; working-tree candidate, not a deployed head.
- Input identity correction: added previously omitted `sidebars.ts`; its bytes are unchanged between the base head, observed-candidate commit `eb723b4de6c5d9ef27072d6dbf797c9e7fe13156`, and this correction. No new Browser observations were performed; original capture time, measurements and screenshot limitations remain unchanged.
- Functional observations: `4/4 states`; `12/12 wrapper checks`; `12/12 relation href/H1/return checks`; `24/24 source anchors`; STY-15 actionable total `0`; console warnings/errors and complete CDP diagnostics empty.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`; viewport images were inspected in tool output, but no durable full-article screenshot artifact was retained.
- Collection boundary: Codex in-app Browser / CUA only; actual Tab/Right keyboard input with DOM focus; exact-href relation navigation plus Browser back, not physical clicks; source destinations are resolved anchors, not remote-page probes. Preliminary tab/log-scope observations remain disclosed in raw collection notes.

## Production Stage A evidence

- Implementation push: `ea452848ac0b77b4271c465a3643799abd17d863`; fast-forward from `23a0afc5af16bc85f1f8991fde1f53ecf5118e81`; exact merge-base, behind `0`, ahead `13`, tracked clean, merge commits `0`, remote unchanged after review.
- Pages workflow: `Verify and deploy Docusaurus to GitHub Pages`; `.github/workflows/deploy.yml`; event `push`; headSha `ea452848ac0b77b4271c465a3643799abd17d863`; run `34134613000`; `completed / success`; created/started `2026-09-07T14:44:31Z`; updated `2026-09-07T14:49:19Z`.
- Build job: `101782500593`; `completed / success`; `2026-09-07T14:45:10Z` → `2026-09-07T14:49:02Z`. Deploy job: `101783809244`; `completed / success`; `2026-09-07T14:49:07Z` → `2026-09-07T14:49:18Z`.
- Production probes: `8/8 HTTP 200`; `/`, `/styles`, `/styles/sty-14`, `/styles/sty-04`, `/styles/sty-05`, `/styles/sty-06`, `/references` are `text/html; charset=utf-8`; STY-14 SVG is `image/svg+xml`, `9959` bytes, SHA-256 `d2032346802f2e722c39c0c5d8772816ff1233a4c96883d0d38e415129e27de5`, matching reviewed and Browser-decoded bytes.
- Raw production artifact: `docs/reviews/evidence/g009-batch15-stage-a-production-browser.json`; bytes `37303`; SHA-256 `28967cff0dad4941577ddb62c3c063b4228cd71647dcc0841face601be54feb0`; captured `2026-09-07T14:56:11.391Z`.
- Production functional judgment: `SUCCESS / PASS`; `4/4 states`; `12/12 wrapper focus-visible 3px / ArrowRight checks`; `12/12 exact relation href/H1/return checks`; `24/24 source anchors`; SVG loaded; STY-15 actionable total `0`; console and complete CDP diagnostics empty, continuous cursor chain `22→151→390→513→780`.
- Production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`. Desktop-light full-page output had duplicate/incomplete stitching; other captures were viewport-only. No trustworthy durable full-article artifact was retained; functional PASS is not visual acceptance.
- Production collection boundary: fresh Codex in-app Browser / CUA tab after exact-head deployment; exact-href navigation plus Browser back, no physical relation click claim; sources are observed/resolved anchors, not external loads. Theme-selection retries and continuous diagnostics are disclosed in raw evidence; viewport/theme instrumentation was restored and task tabs closed.
- Stage A only: STY-14 remains `published / pending`, projection `84/127/600`; STY-15 absent and non-actionable. Stage B was not performed. The evidence commit own Pages run is recorded only in the ignored task report to avoid recursive evidence commits.

## Stage B closure candidate

- Scope: `STAGE_B_FINAL`; STY-14 and the G009 architecture-style batch are closed; the published recovery baseline and all preceding evidence bytes remain unchanged.
- Stage A implementation head: `ea452848ac0b77b4271c465a3643799abd17d863`; Pages run `34134613000`; build job `101782500593`; deploy job `101783809244`; `push / completed / success`; `2026-09-07T14:44:31Z` → `2026-09-07T14:49:19Z`.
- Stage A evidence head: `215908786dde13e7fb19c752ba61b3bfb340a89b`; Pages run `34136330002`; build job `101788065505`; deploy job `101789152187`; `push / completed / success`; `2026-09-07T15:04:01Z` → `2026-09-07T15:08:02Z`.
- Stage A production evidence: `2026-09-07`; HTML routes `7/7` and SVG asset `1/1`, HTTP `200`; functional Browser `SUCCESS / PASS`; states `4/4`, wrappers `12/12`, exact relation href/H1/return `12/12`, source anchors `24/24`, STY-15 actionable `0`, complete diagnostics empty; screenshots `BLOCKED / NOT_ACCEPTED`, accepted `0/4`.
- Immediate history: complete backlog `124996 bytes / 16d9c4013c0df279e1f809ba2fe3dfc35ed2f596f84011feb776de591230d674`; complete release suffix `41918 bytes / 13358d8a29848f9b873225cab669be9e5f2f0f1533245eb12cd591e8b6bc2237`; Stage A review `5767 bytes / 8b649f83c8a3d37af2c29eb47c5ea476a9f48685323b14f57a603db6e5f76eb0`; all `75` prior review/evidence files locked by tree SHA-256 `7fe265f26e05f02cdd66ad4805e5f8a1944fe1da4bc3b49871cc53fb5ee966df`.
- Canonical Stage B projection: `85 completed topics / 127 content documents / 600 governed sources`; durable stories remain `8/20`, current `G009`.
- STY-14 lifecycle: `published / complete`; exact status `{"scope":"backlog-projection","value":"complete","source":"docs/content-backlog.md"}`.
- STY-15 lifecycle: `absent / unpublished / non-actionable`; no new topic is created.
- Independent Stage B code/spec/security review: exact candidate head `0cbf5f77c77ae6cca1868ce7279d5057fbc25512`; verdict `READY / APPROVE / findings 0`; Critical/Important/Minor `0/0/0`; full repository and all gates passed.
- Independent Stage B content/evidence/rights review: exact candidate head `0cbf5f77c77ae6cca1868ce7279d5057fbc25512`; verdict `CONTENT READY / rights PASS / findings 0`; Critical/Important/Minor `0/0/0`; targeted tests `324/324` passed.
- Independent Stage B architecture/invariant review: exact candidate head `0cbf5f77c77ae6cca1868ce7279d5057fbc25512`; verdict `CLEAR / READY / blockers 0`; Critical/Important/Minor `0/0/0`; targeted tests `360/360` passed.
- Final Stage B review judgment: `READY`; all three independent verdicts bind the same exact candidate, not a deployment.
- Stage B deployment status: `SUCCESS / functional PASS; screenshots BLOCKED / NOT_ACCEPTED`.
- Stage B production raw: `docs/reviews/evidence/g009-batch15-stage-b-production-browser.json`; bytes `37120`; SHA-256 `b21fec79aca51707109b3420b5ccfe7d465242c5d4fcddbe3bf62de6af61abba`; captured `2026-09-07T15:48:13.701Z`.
- Stage B implementation push: `c9b0b0bb2c6aa32108b2c7b098c738b995706fcd`; fast-forward from `215908786dde13e7fb19c752ba61b3bfb340a89b`; exact merge-base, behind `0`, ahead `2`, tracked clean, merge commits `0`, remote unchanged after review.
- Stage B Pages workflow: `Verify and deploy Docusaurus to GitHub Pages`; `.github/workflows/deploy.yml`; event `push`; headSha `c9b0b0bb2c6aa32108b2c7b098c738b995706fcd`; run `34139436579`; `completed / success`; created/started `2026-09-07T15:39:40Z`; updated `2026-09-07T15:44:24Z`.
- Stage B build job: `101797853088`; `completed / success`; `2026-09-07T15:40:19Z` → `2026-09-07T15:44:11Z`. Deploy job: `101799017907`; `completed / success`; `2026-09-07T15:44:15Z` → `2026-09-07T15:44:23Z`.
- Stage B production probes: `8/8 HTTP 200`; `/`, `/styles`, `/styles/sty-14`, `/styles/sty-04`, `/styles/sty-05`, `/styles/sty-06`, `/references` are `text/html; charset=utf-8`; STY-14 SVG is `image/svg+xml`, `9959` bytes, SHA-256 `d2032346802f2e722c39c0c5d8772816ff1233a4c96883d0d38e415129e27de5`, matching reviewed and fresh Browser-decoded bytes.
- Stage B production functional judgment: `SUCCESS / PASS`; `4/4 states`; desktop light/dark `1440×1000`, mobile dark/light `390×844`; `12/12 wrapper focus-visible solid 3px / ArrowRight checks`; `12/12 exact relation href/H1/return checks`; `24/24 source anchors`; SVG loaded; STY-15 actionable total `0`; console and complete CDP diagnostics empty, continuous cursor chain `23→147→263→384→508`.
- Stage B production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`. Four viewport images were inspected inline; no durable full-article artifact was retained. Functional PASS is not visual acceptance.
- Stage B production collection boundary: fresh hidden Codex in-app Browser / CUA tab after exact-head deployment; actual Tab/Right plus DOM focus, no synthetic key event; exact-href navigation plus Browser back, no physical relation click claim; sources are observed/resolved anchors, not external loads. Inventory timeouts and preliminary system-dark observation are disclosed in raw evidence; actual site theme selection and complete fresh states were used; original system theme restored, viewport override reset and task tab closed.
- Final Stage B publication judgment: `SUCCESS / PASS`; STY-14 `published / complete`; G009 architecture-style batch `closed`; projection `85/127/600`; durable-story projection remains `8/20`, current `G009`; no STY-15 topic or actionable link is created. The evidence commit own exact-head Pages run is recorded only in the ignored task report to avoid recursive evidence commits.
- Completion boundary: the candidate review, implementation deployment and fresh production functional QA are separate exact identities; all required functional gates passed. Screenshot evidence remains `BLOCKED / NOT_ACCEPTED`, accepted `0/4`; no full-article visual clearance is claimed. The unchanged backlog closure row records the earlier local candidate checkpoint, not the final publication judgment recorded here.
