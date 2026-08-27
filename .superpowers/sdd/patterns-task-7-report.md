# Patterns Task 7 — AGT-P-06 report

## Scope and outcome

- Implemented only AGT-P-06: `content/patterns/agt-p-06-supervisor-handoff-agents-as-tools.mdx`.
- Added the synchronized editable/published pair `diagrams/agt-p-06-control-ownership-models.drawio` and `static/img/diagrams/agt-p-06-control-ownership-models.svg`.
- Registered the four governed implementation/reference sources plus original illustration `src-atlas-agt-p-06-control-ownership-models` and the complete document citation boundary.
- Did not modify `.superpowers/sdd/progress.md` and did not implement P07, P08, or cases.

## TDD evidence

- RED: `node --test tests/agt-patterns-content.test.mjs` produced 31 PASS / 2 FAIL. The failures were the missing P06 article/assets and missing P06 source document/original illustration registration.
- GREEN: `node --test tests/agt-patterns-content.test.mjs tests/drawio-diagram-validator.test.mjs` produced 61 PASS / 0 FAIL after implementation.
- Mutants cover exact metadata, ordered tags, dependency list, exact comparison cells, legal MDX, missing/drifted pairs, region/topology/accessibility/width/padding/clearance drift, and source identity/license/usage/document/health drift.
- Browser RED/GREEN: the initial focusable overflow region did not move on ArrowRight. The final article reuses `handleHorizontalArrowKey` from the shared `KeyboardScrollableRegion` module; IAB then measured ArrowLeft/Right, Home/End and both boundaries.

## Illustration decision and export

- Format: Draw.io + SVG, because three independent ownership regions, six nodes and five directional relationships carry the teaching claim; a text-only or decorative asset would not preserve move-versus-return semantics.
- Topology is color-independent: region titles, node labels, solid/dashed direction, arrowheads and explicit notes distinguish retained control, moved control and bounded return.
- Final source SHA-256: `461ca95919bc97a7a4cf6db97641fb9be09079b44bcbb9f2719a4c2c90fd7f44`.
- The final source was loaded in diagrams.net and exported as a real SVG at `2026-08-27 16:10:04`; raw export SHA-256 `6640be9ff30cb26f313c2ff9f2103ac55bff2309735b64392660811823d2d650`.
- The diagrams.net export was deterministically normalized (embedded editor payload removed, accessibility metadata/data identities added, cropped drawing padded into `viewBox="0 0 1200 720"`); published SHA-256 `61b89834d6d7aeb5d9ae13a5d5729bc49fc7363296eacc3ec0d295335a46b9cd`.
- Exact paired command: `node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs diagrams/agt-p-06-control-ownership-models.drawio static/img/diagrams/agt-p-06-control-ownership-models.svg --label "Supervisor" --label "Handoff" --label "Agent as Tool" --label "Active Agent" --label "Parent Agent"` → `Validated agt-p-06-control-ownership-models`.

## Geometry and local visual QA

- Local `rsvg-convert` render: 1200×720, visually inspected at original detail. PASS: three separated regions; six labels and five labeled arrows readable; return and delegation lanes no longer concatenate; opaque label backgrounds do not erase connectors.
- Browser scale is 800/1200 = 2/3. Desktop rendered SVG is exactly 800×480 CSS px.
- Each node renders 186.67×73.33 CSS px. Declared final-CSS minimum padding is 16 px horizontal and 14 px vertical.
- Title/type baseline gap is about 27 px (40.5 authoring units × 2/3); type baseline-to-bottom clearance is about 19.7 px. The six measured nodes are Supervisor, Worker Agent, Handoff, Active Agent, Parent Agent and Agent as Tool.
- Edge-label contracts are 8 px stroke, 16 px arrowhead and 12 px node clearance. Actual reserved horizontal lanes are at least 12 px from the associated connector at the final CSS scale; labels and arrowheads were legible in the rendered image.

## Sources and evidence limits

- Reused governed fixed OpenAI Agents SDK multi-agent documentation, LangGraph Supervisor README, A2A specification and Microsoft multi-agent reference architecture repository.
- Locked canonical/transport/final locator, title, author, version, kind, tier, roles, license, usage boundary and cached health observations.
- The article limits these to implementation/reference evidence. A2A interoperability does not prove authorization, business-state consistency, reliability or governance; examples/reference architectures do not prove production guarantees.

## Fresh gates

- Paired validator: PASS.
- Focused P06 + Draw.io validators: 61/61 PASS.
- Related drawio/registry/source/content/topic tests: 137/137 PASS.
- `npm run validate:content`: PASS, 119 documents and 574 sources.
- `npm run check:terminology`: PASS.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.

## Content dry-run

- `npm run check:content` is intentionally not globally green because planned publications are absent.
- Fixed P06's own reverse-edge blocker by adding P06 → P01 metadata and a visible P01 link.
- Exact remaining count is 37 relation errors: P07 appears 8 times (owner: Patterns Task 8), P08 appears 9 times (owner: Patterns Task 9), `/cases/long-running-coding-agent` appears 8 times (owner: Cases Task 3), `/cases/multi-agent-research-system` appears 6 times (owner: Cases Task 2), and `/cases/production-incident-response-agent` appears 6 times (owner: Cases Task 4). These five downstream identities account for all 37 reports.

## IAB QA

- Route: `http://127.0.0.1:3212/tego-arch/patterns/agt-p-06`; HTTP 200.
- Desktop 1440×1000: document client/scroll width 1440/1440; figure 800×480; wrapper 800/800; PASS.
- Mobile 390×844: document client/scroll width 390/390; wrapper client/scroll width 358/800; figure width 800; PASS local horizontal overflow with no document overflow.
- Keyboard/focus at mobile: active region, solid 3 px outline. Start 0; ArrowLeft stayed 0; ArrowRight moved to 40; End moved to max 442; ArrowRight stayed 442; Home returned to 0. PASS.
- Console warning/error log: 0.
- SVG validator/local render confirmed all six exact labels, three regions and arrowheads; no browser or local visual defect remained.

## Self-review

- Exact 11 H2 order, summary, ordered tags, dependencies, route, relations and matrix semantics are locked.
- Article covers mixed topology, context leakage, ping-pong handoff, supervisor bottleneck, human escalation, control/state/permission/effects/termination/recovery/fallback/migration and evidence limits.
- No progress update, generated catalog write, later task implementation, or unrelated worktree change is included.
