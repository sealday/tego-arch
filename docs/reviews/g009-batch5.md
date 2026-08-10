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

- Code review: `PENDING` — leader must dispatch an independent code reviewer against the exact Stage A head.
- Content/evidence review: `PENDING` — leader must dispatch an independent content/evidence reviewer against the exact Stage A head.
- Architecture review: `PENDING` — leader must dispatch an independent architecture reviewer against the exact Stage A head.
- Remediation commit: `7669994f6b5cd29bc5515e2269d778579e954559`; independent re-review remains `PENDING` until the leader dispatches fresh code, content/evidence, and architecture reviews.
- Final Stage A release judgment: `PENDING`.

## Release state

- This record contains local Stage A evidence only. No Pages run, production observation, Stage B closure, or independent verdict is claimed.
- Publication handoff is blocked only on the three leader-dispatched independent reviews and any resulting remediation.
