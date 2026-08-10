# STY-03 Semantic Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the STY-03 diagram's orchestration, boundary, persistence, and evidence semantics, then restore the production-gated G009 Batch 4 release closure.

**Architecture:** Keep `SubmitOrder Handler` as the use-case orchestrator, expose port-to-adapter runtime dispatch and one shared database, and limit the shared-invariant boundary to `Order Rules`. Register the original diagram and archived upstream identity explicitly, then synchronize only current-state regression fixtures before Stage A deployment and Stage B backlog closure.

**Tech Stack:** MDX, Draw.io XML, SVG, JSON source ledger, Bun scripts, Node test runner, Docusaurus, GitHub Pages.

## Global Constraints

- Do not add dependencies or change public routes.
- Preserve STY-04 as unpublished and pending.
- Use `bun run test`, not raw `bun test`, for the canonical nested `node:test` suite.
- Use the existing generators for generated JSON and license inventory; do not hand-edit generated projections.
- Keep `.codex/config.toml` and `.pi-subagents/` untouched.
- Before backlog closure, STY-03 remains published/pending and completed topics remain 55.
- After successful Stage A production evidence, STY-03 becomes complete and completed topics become 56.

---

## File responsibility map

- Modify `tests/g009-batch4-content.test.mjs` — semantic graph, containment, evidence, terminology, and visibility contracts.
- Modify `diagrams/sty-03-vertical-slice-boundary.drawio` — authoritative editable topology.
- Modify `static/img/diagrams/sty-03-vertical-slice-boundary.svg` — synchronized published topology.
- Modify `content/styles/sty-03-vertical-slice-architecture.mdx` — terminology, scenario status, source identity, comparison precision.
- Modify `data/source-ledger.json` — original illustration and archived source identity.
- Regenerate `docs/source-license-inventory.md` and `src/generated/*.json` through existing scripts.
- Modify current-state tests identified by a fresh canonical test run; historical fixture semantics remain frozen.
- Complete `docs/reviews/g009-batch4.md`, `tests/g009-batch4-deployment.test.mjs`, and `docs/content-backlog.md` only in the release phase.

## Task 1: Lock and implement the corrected architecture graph

**Files:**
- Modify: `tests/g009-batch4-content.test.mjs`
- Modify: `diagrams/sty-03-vertical-slice-boundary.drawio`
- Modify: `static/img/diagrams/sty-03-vertical-slice-boundary.svg`

**Interfaces:**
- Consumes: node IDs, edge IDs, visible type children, actual Draw.io offsets, and SVG geometry from the current pair.
- Produces: handler-centred runtime graph, two adapter-to-port source dependencies, one shared database, and enforceable containment rules.

- [ ] **Step 1: Fix the visibility helper and add semantic RED assertions.**

  Change Map access to `values.get('style')`, `values.get('aria-hidden')`, and `values.get('class')`. Add exact assertions for the runtime and dependency inventories from the remediation design, one new `order-persistence-adapter` node, one `shared-database` node, and actual geometry containment/exclusion for `submit-order-boundary` and `shared-domain-invariants`.

- [ ] **Step 2: Run the focused test and record RED.**

  Run: `bun test --timeout 30000 tests/g009-batch4-content.test.mjs --test-name-pattern 'publishes the synchronized'`

  Expected: FAIL because the current pair assigns downstream runtime edges to `order-rules`, lacks the persistence adapter/runtime database path, and over-contains the shared-invariant boundary.

- [ ] **Step 3: Rebuild the Draw.io source and SVG projection.**

  Implement the exact runtime/source-dependency and boundary contracts in the design. Keep all visible labels synchronized, use actual child type cells, use actual Draw.io edge offsets, keep one shared database node, and preserve the deployment/legend semantics.

- [ ] **Step 4: Validate topology and geometry.**

  Run the bundled Draw.io/SVG validator, the focused g009 test, the shared diagram tests, `git diff --check`, and an 800px raster inspection. Then measure all ordinary nodes and every labelled relation in Chromium at the final 800px width using the existing CSS-pixel thresholds.

- [ ] **Step 5: Commit the semantic diagram repair.**

  Commit only the paired diagram and focused test changes with `fix: correct STY-03 orchestration topology`.

## Task 2: Close content and source-governance findings

**Files:**
- Modify: `content/styles/sty-03-vertical-slice-architecture.mdx`
- Modify: `data/source-ledger.json`
- Modify: `tests/g009-batch4-content.test.mjs`
- Regenerate: `docs/source-license-inventory.md`
- Regenerate: `src/generated/source-ledger.json`
- Regenerate: `src/generated/project-status.json`
- Regenerate: `src/generated/topic-manifest.json`
- Regenerate: `src/generated/topic-indexes.json`

**Interfaces:**
- Consumes: the corrected diagram pair and existing source-governance schema.
- Produces: explicit original-illustration provenance, archived eShopOnWeb identity, reader-visible knowledge-state labels, and a 509-source pre-closure projection.

- [ ] **Step 1: Add failing content/source assertions.**

  Require the governed first uses, `说明性场景（Tego Arch 分析）`, “三种组织视角”, the precise data-ownership row, the original-illustration ledger record/citation/license family, and an archived/community-supported eShopOnWeb identity note.

- [ ] **Step 2: Run focused tests and record RED.**

  Run the g009 content test plus source governance, license inventory, terminology policy, and terminology CLI checks. Expected: failures for the missing illustration record/inventory/citation, stale upstream identity, and missing content labels.

- [ ] **Step 3: Apply the minimal content and ledger repair.**

  Add source ID `src-atlas-sty03-vertical-slice-boundary` for `/img/diagrams/sty-03-vertical-slice-boundary.svg`, with `source_kind: original-illustration`, `LicenseRef-Atlas-Original`, `copyright_policy: original-atlas`, `roles: [illustration]`, and a non-primary `original-illustration` document citation. Correct the eShopOnWeb title/version/usage wording without changing its stable locator or historical evidence role. Apply the four article wording repairs from the design.

- [ ] **Step 4: Regenerate and validate governed projections.**

  Run the existing license-inventory generator and `bun run generate:content`. Verify only the named illustration family/document citation, archived identity wording, source count 509, and expected STY-03 relations change.

- [ ] **Step 5: Commit the evidence repair.**

  Commit the article, ledger, inventory, generated projections, and focused tests with `docs: close STY-03 evidence boundaries`.

## Task 3: Restore the canonical repository regression gate

**Files:**
- Modify: only tests that a fresh `bun run test` proves read the current live projection.

**Interfaces:**
- Consumes: the final 98-document, 509-source, STY-03-published/pre-closure-pending projection.
- Produces: a zero-failure canonical Node test suite without rewriting historical evidence.

- [ ] **Step 1: Capture and classify the full failure list.**

  Run `bun run test` and group failures by stale document/source counts, STY-03 publication/navigation state, source-ledger pagination/render totals, summary copy, or unrelated failure. Record every modified test and why it reads current state.

- [ ] **Step 2: Update one failure family at a time.**

  For each current-state family, change only the expected live values and run its focused test file immediately. Do not alter generator behavior, loosen assertions, or update frozen historical artifacts.

- [ ] **Step 3: Run the canonical gate.**

  Run `bun run test`, `bun run validate:content`, `bun run check:terminology`, `bun run check:content`, `bun run check:links`, `bun run check:reviews`, `bun run typecheck`, `bun run build`, and `git diff --check`. All must exit zero.

- [ ] **Step 4: Commit fixture synchronization.**

  Commit only justified current-state tests with `test: synchronize STY-03 repository projection`.

## Task 4: Re-review, deploy, and close G009 Batch 4

**Files:**
- Modify: `docs/reviews/g009-batch4.md`
- Modify: `tests/g009-batch4-deployment.test.mjs`
- Modify after Stage A success: `docs/content-backlog.md`
- Regenerate after closure: `src/generated/*.json`
- Modify: current-state closure fixtures proven stale by the final test run.

**Interfaces:**
- Consumes: review-clean Stage A head and all local verification evidence.
- Produces: exact Pages run evidence, production browser QA, backlog closure, STY-03 complete/56 projection, and final exact-head verification.

- [ ] **Step 1: Obtain independent code, content, and architecture approval.**

  Review the exact remediation head. Critical and Important findings must be zero before push.

- [ ] **Step 2: Push and verify Stage A.**

  Push the exact reviewed main head, wait for its GitHub Pages run to complete successfully, and record run ID, head SHA, event, conclusion, build job, and deploy job.

- [ ] **Step 3: Run production browser QA.**

  Test the canonical route and SVG at `1440x1000` and `390x844`; record HTTP, document geometry, local overflow, keyboard focus/ArrowRight, source/relation activations, console/page errors, screenshots, artifact hash, and final diagram geometry.

- [ ] **Step 4: Commit review evidence before backlog closure.**

  Complete `docs/reviews/g009-batch4.md` and the pre-closure deployment contract; commit with `docs: record STY-03 review evidence`.

- [ ] **Step 5: Close the backlog and regenerate.**

  Mark only STY-03 complete, retain STY-04 pending, record the exact Stage A evidence, regenerate projections, and update closure assertions to STY-03 complete and 56 completed topics.

- [ ] **Step 6: Run final exact-head verification and commit.**

  Run `git diff --check && bun run verify && git status --short`, commit intended closure files with `docs: close G009 STY-03`, push the closure head, and confirm the final Pages run succeeds.

## Self-review

- Spec coverage: diagram meaning, provenance, upstream identity, current-state regressions, production QA, and backlog closure each have a task.
- Placeholder scan: no TBD, TODO, or unspecified validation step.
- Type/contract consistency: all tasks use the same node IDs, source ID, pre-closure 55/98/509 projection, final 56/98/509 projection, route, and STY-04 pending state.
