# G009 Batch 5 Stage A Review

## Stage A projection

- Projection: 56 completed topics / 99 content documents / 512 governed sources.
- STY-04: `published / pending`; canonical route `/styles/sty-04`.
- STY-05: `unpublished / pending`; `/styles/sty-05` is absent from the actionable published route inventory.
- Backlog remains pre-closure: `当前 G009，下一项为 STY-04`; STY-04 and STY-05 checkboxes remain unchecked.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-04-modular-monolith.mdx` | 18,106 | `6ee80ac00e2127bcc511fd3799306cc70546ba05cfb7294aa61a5666168c5c28` |
| `diagrams/sty-04-modular-monolith-boundaries.drawio` | 21,544 | `f699ec91b2527d5a707efb396fde19ceacf6d2ae193e6983fe3d74bd537ebf27` |
| `static/img/diagrams/sty-04-modular-monolith-boundaries.svg` | 18,778 | `48f0f0eb2ce6a284cb4353037c79896b8656b3a59a53fae975910c1362846559` |

- Governed-source implementation: `9ceb43dbf7252f82310fe6a60c8a028bdae320d2`.
- Final article/payment-boundary implementation: `43c34e43236e8e510e39019ffb9372170ca05081`.
- Final deterministic diagram-geometry implementation: `5556c98aa237fc8e865252eacf8dd6fe19d4c128`.
- Stage A projection/test commit: pending until this local evidence record is complete.

## Sources, licenses, and evidence boundaries

- `src-fowler-monolith-first`: Martin Fowler, 2015-06-03; all-rights-reserved facts/summary use for comparison and method only; no copied excerpt, diagram, layout, or universal prescription.
- `src-spring-modulith-fundamentals`: official Spring Modulith 2.1.0 documentation; Apache-2.0 evidence at the governed repository license; sole `manifest_primary`; definition/implementation/method evidence only, not a universal topology or style definition.
- `src-spring-modulith-events`: official Spring Modulith 2.1.0 documentation; Apache-2.0 evidence at the governed repository license; implementation/runtime-fact evidence only, with no exactly-once, arbitrary-broker, or production-result claim.
- Remote evidence domains: `martinfowler.com` and `docs.spring.io`. The article, order scenario, tables, Draw.io source, and SVG are original Tego Arch synthesis; external prose, code, diagrams, and layouts are not copied.

## Diagram topology and geometry

- Synchronized Draw.io/SVG inventory: 25 stable semantic nodes and 14 directed relations.
- Deployment canvas: `1200 × 1800`; article render width contract: `800px`; render scale: `2/3`.
- Required/observed conservative minima at 800px: label-to-connector `8 / 9.1667px`; label-to-own-marker `16 / 22.5px`; label-to-node `12 / 12.6667px`; label-to-boundary `12 / 15.8333px`.
- Node padding and typography gates: horizontal `16px`, vertical `14px`, title/type baseline separation `22px`, body/edge text `15px`, type text `10px` minimum.
- Exact semantic inventory, direction, solid/dashed connector classes, boundary containment, accessibility metadata, and Draw.io/SVG synchronization are enforced by `tests/g009-batch5-content.test.mjs`.

## Deterministic local verification

- `npm run generate:content`: PASS; canonical projection written.
- `node --test tests/g009-batch5-content.test.mjs tests/g009-batch5-deployment.test.mjs`: 14 tests / 13 passed / 1 expected review-scaffold RED before this file was added.
- Focused projection gate: 44 tests / 44 passed / 0 failed; content validation 99 documents / 512 sources; terminology 101 files / 127 terms / 0 issues; deterministic content check and `git diff --check`: PASS.
- Production build: PASS; Docusaurus generated `build/`. Node emitted the repository-known experimental `localStorage` warnings during the build process; no compilation error occurred.
- Full `npm run verify`: PASS — 1107 tests / 1107 passed / 0 failed; content validation 99 documents / 512 sources; terminology 101 files / 127 terms / 0 issues; deterministic content, link-cache, review-health, typecheck, and production-build gates passed.

## Local browser QA

- Target: `http://127.0.0.1:3100/tego-arch/styles/sty-04`.
- Canonical SVG route: `http://127.0.0.1:3100/tego-arch/img/diagrams/sty-04-modular-monolith-boundaries.svg`; root SVG present with `viewBox="0 0 1200 1800"`, `role="img"`, and `aria-labelledby="sty04-title sty04-desc"`.
- Desktop `1440x1000`: document `1440/1440`; diagram wrapper `800/800`; both table wrappers `800/1024`; rendered SVG `800 × 1200`; no document overflow.
- Mobile `390x844`: document `390/390`; diagram wrapper `358/800`; both table wrappers `358/1024`; rendered SVG `800 × 1200`; overflow remains inside the labelled focusable regions.
- Keyboard: all 6 wrapper/viewport checks focused the intended region, matched `:focus-visible`, and rendered a `3px solid` outline. Desktop ArrowRight: diagram `0→0`, tables `0→40` and `0→40`; mobile ArrowRight: diagram `0→40`, tables `0→40` and `0→40`.
- Governed sources: 5 visible source anchors per viewport; 10/10 click actions accepted. Every link retained its exact governed HTTPS locator, `target="_blank"`, and `rel="noopener noreferrer"`.
- Reciprocal published relations: STY-01, STY-02, and STY-03 activated at both viewports, 6/6 landed on the canonical local route, and each target article exposed one visible STY-04 backlink.
- STY-05 actionable article links: `0` at desktop and mobile.
- Browser diagnostics: warnings / errors / runtime exceptions: `0 / 0 / 0` at desktop and mobile.
- Accepted screenshots: `.superpowers/sdd/task-5-desktop-1440x1000.png` (`b4aeeeaeebada6cd1f64ff9aa32efa6f6ecc8440beeaf26a42c067a9b35d1298`) and `.superpowers/sdd/task-5-mobile-390x844.png` (`2ea82dc7b3cef4b0a7b7c82670e4b8ad172b3df851c1cc6c812de618e25d4969`).
- Raw evidence: `.superpowers/sdd/task-5-browser-qa.json`. Browser artifacts remain local and are not release-review inputs.

## Independent review

- Code review: `PENDING` — leader must dispatch an independent code reviewer against the exact Stage A head.
- Content/evidence review: `PENDING` — leader must dispatch an independent content/evidence reviewer against the exact Stage A head.
- Architecture review: `PENDING` — leader must dispatch an independent architecture reviewer against the exact Stage A head.
- Remediation commits: none recorded; add only after a reviewer reports a concrete finding and the finding is fixed.
- Final Stage A release judgment: `PENDING`.

## Release state

- This record contains local Stage A evidence only. No Pages run, production observation, Stage B closure, or independent verdict is claimed.
- Publication handoff is blocked only on the three leader-dispatched independent reviews and any resulting remediation.
