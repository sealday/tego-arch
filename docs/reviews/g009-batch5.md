# G009 Batch 5 Stage A Review

## Stage A projection

- Projection: 56 completed topics / 99 content documents / 513 governed sources.
- STY-04: `published / pending`; canonical route `/styles/sty-04`.
- STY-05: `unpublished / pending`; `/styles/sty-05` is absent from the actionable published route inventory.
- Backlog remains pre-closure: `当前 G009，下一项为 STY-04`; STY-04 and STY-05 checkboxes remain unchecked.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-04-modular-monolith.mdx` | 19,239 | `ddaca4c9e1f8577fee0d667e5b5b77a307fa92f78f42a240f78ac31fc038013f` |
| `diagrams/sty-04-modular-monolith-boundaries.drawio` | 22,351 | `6e8d3f97a624e90897c8ffc812a097498fcf2286f9c5cac0e2b095af3ed0f933` |
| `static/img/diagrams/sty-04-modular-monolith-boundaries.svg` | 19,722 | `d78f3231d9aaaa4cdbf39e04ec3070fabc9b4a8cb7f64aad862cc340ce8da8e4` |

- Governed-source implementation: `9ceb43dbf7252f82310fe6a60c8a028bdae320d2`.
- Final article/payment-boundary implementation: `43c34e43236e8e510e39019ffb9372170ca05081`.
- Final deterministic diagram-geometry implementation: `5556c98aa237fc8e865252eacf8dd6fe19d4c128`.
- Initial Stage A projection/test commit: `36cc475` (`test: bind STY-04 Stage A projection`).
- Stage A remediation implementation commit: `7669994f6b5cd29bc5515e2269d778579e954559` (`fix: remediate STY-04 Stage A findings`).
- Final code-review remediation commit: `e33e11f452a3a3ef82e7e2f8a8e74eecff70d05e` (`test: bind STY-04 contrast to rendered roles`).

## Sources, licenses, and evidence boundaries

- `src-fowler-monolith-first`: Martin Fowler, 2015-06-03; all-rights-reserved facts/summary use for comparison and method only; no copied excerpt, diagram, layout, or universal prescription.
- `src-spring-modulith-fundamentals`: official Spring Modulith 2.1.0 documentation; Apache-2.0 evidence at the governed repository license; sole `manifest_primary`; definition/implementation/method evidence only, not a universal topology or style definition.
- `src-spring-modulith-events`: official Spring Modulith 2.1.0 documentation; Apache-2.0 evidence at the governed repository license; implementation/runtime-fact evidence only, with no exactly-once, arbitrary-broker, or production-result claim.
- `src-atlas-sty04-modular-monolith-boundaries`: local original illustration source; `LicenseRef-Atlas-Original`, `original-atlas`, non-primary and illustration-only, with no factual or production-result claim.
- Remote evidence domains: `martinfowler.com` and `docs.spring.io`. The article, order scenario, tables, Draw.io source, and SVG are original Tego Arch synthesis; external prose, code, diagrams, and layouts are not copied.

## Diagram topology and geometry

- Synchronized Draw.io/SVG inventory: 27 stable semantic nodes and 14 directed relations.
- Deployment canvas: `1200 × 1800`; article render width contract: `800px`; render scale: `2/3`.
- Required/observed conservative minima at 800px: label-to-connector `8 / 9.1667px`; label-to-own-marker `16 / 22.5px`; label-to-node `12 / 12.6667px`; label-to-boundary `12 / 15.8333px`.
- Node padding and typography gates: horizontal `16px`, vertical `14px`, title/type baseline separation `22px`, body/edge text `15px`, type text `10px` minimum.
- Exact semantic inventory, direction, solid/dashed connector classes, boundary containment, accessibility metadata, recovery annotations, and Draw.io/SVG synchronization are enforced by `tests/g009-batch5-content.test.mjs`. Its contrast gate resolves the actual canvas, local node backgrounds, stylesheet/presentation cascade, inherited legend styles, edge strokes, and text fills; mutations that turn `.event` stroke or `.edge-label/.legend-label` fill white fail deterministically.

## Deterministic local verification

- `npm run generate:content`: PASS; canonical projection written.
- The remediation TDD RED run failed on the newly required payment transaction/recovery, diagram recovery, illustration governance, contrast, and 513-source assertions before implementation.
- Focused source-governance gate: 155 tests / 155 passed / 0 failed; content validation 99 documents / 513 sources; terminology 101 files / 127 terms / 0 issues; deterministic content check: PASS.
- Focused projection gate: 46 tests / 46 passed / 0 failed; `git diff --check`: PASS.
- Final contrast-review gate: 17 tests / 17 passed / 0 failed, including the two mutation fixtures; Draw.io/SVG validator: PASS.
- Article-density advisory: sentence and paragraph checks are clear; the approved one-diagram/two-table article reports visual-balance `46`, below the case analyzer's `>90` multi-visual advisory. No extra decorative asset was added outside the approved illustration scope.
- Production build: PASS; Docusaurus generated `build/`. Node emitted the repository-known experimental `localStorage` warnings during the build process; no compilation error occurred.
- Full `npm run verify`: PASS — 1110 tests / 1110 passed / 0 failed; content validation 99 documents / 513 sources; terminology 101 files / 127 terms / 0 issues; deterministic content, link-cache, review-health, typecheck, and production-build gates passed.

## Local browser QA

- Target: `http://127.0.0.1:3100/tego-arch/styles/sty-04`.
- Canonical SVG route: `http://127.0.0.1:3100/tego-arch/img/diagrams/sty-04-modular-monolith-boundaries.svg`; root SVG present with `viewBox="0 0 1200 1800"`, `role="img"`, and `aria-labelledby="sty04-title sty04-desc"`.
- Desktop `1440x1000`, light and dark: document `1440/1440`; diagram wrapper `800/800`; both table wrappers `800/1024`; rendered SVG `800 × 1200`; no document overflow.
- Mobile `390x844`, light and dark: document `390/390`; diagram wrapper `358/800`; both table wrappers `358/1024`; rendered SVG `800 × 1200`; overflow remains inside the labelled focusable regions.
- Keyboard: the raw artifact contains wrappers and interaction results for every named state: `desktopLight`, `desktopDark`, `mobileLight`, and `mobileDark`. All 12 checks started at `0`, focused the intended region, matched `:focus-visible`, rendered a `3px solid` outline, and preserved ArrowRight behavior. Desktop diagrams remained `0→0`; desktop tables moved `0→40`; all mobile regions moved `0→40`.
- Governed sources: 5 visible source anchors in each of the four viewport/theme combinations. Every link retained its exact governed HTTPS locator, `target="_blank"`, and `rel="noopener noreferrer"`.
- Reciprocal published relations: exact STY-01, STY-02, and STY-03 anchors remained visible in all four checks. STY-05 actionable article links: `0` in all four checks.
- Browser diagnostics are stored per state; every state recorded empty warning/error logs, empty runtime exception/error events, `hasMore: false`, and `truncated: false`.
- Accepted viewport screenshots: desktop light `5b24490aead909fc9997106b71786d5dd5e13713bc73b252556d85537fd80e7c`, desktop dark `8400db58fbd3dfe0910e413e4bc32460c7d49674aa9c369abc8bc3016c9664e6`, mobile light `b8439084eb31578a1e5eebd8991abe480df22299b318f7ae88417a5e985ee44e`, and mobile dark `1e68e1fa15ec55383b2f5d322fced3727618364d02e82bd8384c2e2c56a2a378` under `.superpowers/sdd/task-5-final-*`.
- Raw evidence: `.superpowers/sdd/task-5-final-browser-qa.json` (`e3e5f3a2013adb84d25c8d2ad120a06c73d24fdb840cf2a98854d1b2bde48cf3`). Browser artifacts remain local and are not release-review inputs.

## Independent review

- Exact reviewed head: `2edba43`.
- Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`. Evidence: the selector-bound contrast gate resolves the actual canvas, node backgrounds, text fills, sync/event strokes, legend inheritance, and opacity cascade; white `.event` and `.edge-label/.legend-label` mutations fail, while the complete four-state browser evidence records every wrapper, focus indicator, ArrowRight movement, and non-truncated diagnostic result.
- Independent content and rights reviewer: `READY`; rights: `PASS`; findings: `0`. Evidence: original-illustration governance is complete across the ledger, document citation, public projection, and source-license inventory with `LicenseRef-Atlas-Original`, `original-atlas`, non-primary illustration-only limits; payment recovery distinguishes local transaction participants, durable intent ownership, never-attempted and unknown results, partial-failure continuation, compensation, reconciliation, deadlines, and manual disposition.
- Independent architecture reviewer (`architect`): `CLEAR / READY`; findings: `0`. Evidence: invariant proof keeps the order row, inventory reservation row, payment-intent row, and Outbox record atomic inside the local transaction; external authorization remains post-commit, unknown results reconcile by stable idempotency key, Outbox explicitly does not guarantee exactly-once, consumers deduplicate and isolate poison messages, and the single deployment retains its shared failure domain.
- Remediation commits reviewed: `7669994f6b5cd29bc5515e2269d778579e954559` and `e33e11f452a3a3ef82e7e2f8a8e74eecff70d05e`.
- Final Stage A release judgment: `READY` — independent review is complete and the exact head may proceed to the deployment step; this verdict is not evidence that deployment ran.

## Stage A deployment evidence

- Stage A exact head: `9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63`.
- Pages run: [`31436111404`](https://github.com/sealday/tego-arch/actions/runs/31436111404); build job `93610482485`; deploy job `93611048927`.
- Exact run gate: workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, `headSha=9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63`, `status=completed`, `conclusion=success`.
- Implementation build job `93610482485`: `status=completed`, `conclusion=success`.
- Implementation deploy job `93611048927`: `status=completed`, `conclusion=success`.
- Run timing: created `2026-08-10T21:56:13Z`, completed/updated `2026-08-10T21:59:03Z`.
- Evidence commit exact head: `9d60259599c43dbd10c7ec31507dabf6db5d0ac5`.
- Evidence-contract Pages run: [`31438264944`](https://github.com/sealday/tego-arch/actions/runs/31438264944); workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, `headSha=9d60259599c43dbd10c7ec31507dabf6db5d0ac5`, `status=completed`, `conclusion=success`.
- Evidence build job `93617237855`: `status=completed`, `conclusion=success`.
- Evidence deploy job `93617748403`: `status=completed`, `conclusion=success`.
- The evidence-contract run verifies the evidence commit; it does not replace the implementation run bound to the Stage A head.

## Production HTTP smoke

- Target: `https://sealday.github.io/tego-arch`.
- Routes: `/styles/sty-04`, `/styles`, `/paths/module-boundaries`, `/styles/sty-01`, `/styles/sty-02`, `/styles/sty-03`, `/cases/micro-frontends-single-spa`, and `/references` all returned HTTP 200 with `text/html; charset=utf-8`.
- Canonical SVG `/img/diagrams/sty-04-modular-monolith-boundaries.svg` returned HTTP 200 with `image/svg+xml`, 19,722 bytes, and SHA-256 `d78f3231d9aaaa4cdbf39e04ec3070fabc9b4a8cb7f64aad862cc340ce8da8e4`.
- Production HTTP probes: `9/9` passed (`8` HTML routes + `1` SVG asset).

## Production Browser QA

- Browser surface: Codex in-app Browser; canonical article `https://sealday.github.io/tego-arch/styles/sty-04`.
- Desktop light and dark, `1440x1000`: document `1440/1440`; diagram wrapper `800/800`; both table wrappers `800/1024`; rendered diagram `800 × 1200`; no document overflow. ArrowRight movement was `0/40/40` for diagram and tables.
- Mobile light and dark, `390x844`: document `390/390`; diagram wrapper `358/800`; both table wrappers `358/1024`; rendered diagram `800 × 1200`; overflow remained inside the three labelled focusable regions. ArrowRight movement was `40/40/40`.
- Keyboard evidence: all 12 wrapper checks began at `0`, focused the intended region, matched `:focus-visible`, rendered a `3px solid` outline, and preserved the document width.

Exact per-state relation destination, H1, and return outcomes:

| State | Activation path | Exact destination H1 and return outcomes |
| --- | --- | --- |
| `desktopLight` | visible-DOM click | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |
| `desktopDark` | visible-DOM click | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |
| `mobileLight` | visible-DOM href selection + direct navigation (`responsive offscreen-click fallback`) | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |
| `mobileDark` | visible-DOM href selection + direct navigation (`responsive offscreen-click fallback`) | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |

The production relation routes were `/styles/sty-01`, `/styles/sty-02`, `/styles/sty-03`, and `/cases/micro-frontends-single-spa`. On mobile, the visible-DOM href was selected first; direct navigation and the return to `/styles/sty-04` were the recorded fallback after responsive offscreen clicks proved unreliable.

Governed source fallback outcomes:

| State | `_blank` popup and direct-open path | Outcome |
| --- | --- | --- |
| `desktopLight` | visible-DOM anchor click; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |
| `desktopDark` | visible-DOM anchor click; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |
| `mobileLight` | exact anchor resolution; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |
| `mobileDark` | exact anchor resolution; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |

The three exact governed destinations were `https://martinfowler.com/bliki/MonolithFirst.html`, `https://docs.spring.io/spring-modulith/reference/fundamentals.html`, and `https://docs.spring.io/spring-modulith/reference/events.html`. Five source anchors per state retained their exact governed locator, `target="_blank"`, and `rel="noopener noreferrer"`.

Exact per-state diagnostic outcomes:

| State | Browser and CDP diagnostics |
| --- | --- |
| `desktopLight` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |
| `desktopDark` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |
| `mobileLight` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |
| `mobileDark` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |

- STY-05 actionable article links: `0` in each state.
- Production screenshot SHA-256 values: desktop light `ff220fe6595578400011fabc7776d9c5c2dab82b6b90c4ebecd03ce42d12d961`; desktop dark `5ac79ac96baef4192704504d8ced113bbf73fe44d402652c0e37ca1974621c82`; mobile light `c50f50bbba21d1e36e9415063d786b2c7cca3a254d26db1fbc9e02d5728bd0e5`; mobile dark `ecb38667f37778277925f67dda957d569e3c73f49e3118eb9105dbfa68c4110d`.
- Raw production evidence: `.superpowers/sdd/task-6-production-evidence.json`, SHA-256 `f2bfe05bd293c5f896cfedb591143bbcdd736d70aa8d88c69302ec44876879de`. The raw Browser artifact remains local and is not staged as release-review input.
- Stage A production verdict: **PASS**.

## Release state

- The exact Stage A implementation head has a successful Pages run and production observation bound above.
- This is Stage A publication evidence only. STY-04 remains `published / pending`; its backlog checkbox remains unchecked, the baseline still names STY-04 as the next G009 item, and STY-05 remains `unpublished / pending`.
- No Stage B closure is claimed. Backlog and generated status closure remain a later task.
