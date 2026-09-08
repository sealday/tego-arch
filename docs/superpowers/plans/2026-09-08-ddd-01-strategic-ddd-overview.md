# DDD-01 Strategic DDD Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish and close DDD-01 as an evidence-governed strategic DDD overview that derives five candidate bounded contexts from one illustrative order-fulfillment scenario.

**Architecture:** Build the deliverable as four independently reviewable layers: executable content/governance contracts, a deterministic Draw.io/SVG Context Map, the article plus source/relation graph, and two exact-head publication stages. Stage A publishes the reviewed article while the backlog stays pending; Stage B closes only DDD-01 after independent reviews and fresh production evidence.

**Tech Stack:** Docusaurus MDX, Node.js `node:test`, repository content generator and source ledger, Draw.io XML, SVG, Codex in-app Browser/CUA, GitHub Pages and GitHub CLI.

## Global Constraints

- Canonical route: `/patterns/ddd-01`; article path: `content/patterns/ddd-01-strategic-ddd-overview.mdx`.
- Fixed scenario contexts: sales order, inventory promise, payment settlement, fulfillment delivery, and customer support.
- The scenario is explicitly illustrative; it never claims a real company, incident, metric, benchmark, organization, or production result.
- A bounded context is not equated with a microservice, team, repository, database, or deployment unit.
- Subdomain classification is conditional on the business; technical complexity or service count never determines core/supporting/generic status.
- Every context exposes local language, invariant, authoritative facts, change driver, and falsification signal.
- Every Context Map relationship exposes direction, exchanged fact, relationship pattern, contract owner, translation owner, failure impact, and redraw condition.
- Customer/Supplier, OHS/PL, and ACL are selected by their collaboration semantics; they are not decorative connector labels and are not combined contrary to the governed definitions.
- Visual format is Draw.io + SVG at `diagrams/ddd-01-strategic-ddd-context-map.drawio` and `static/img/diagrams/ddd-01-strategic-ddd-context-map.svg`.
- Article contains the exact architecture-case ten-H2 sequence and exact three-H3 sequence under `可迁移经验`.
- Frontmatter is `pattern / reviewed / advanced / DDD-01 / P0`, `depends_on: []`, `adjacent_topics: [STY-14]`, `related_cases: []`, `related_questions: []`.
- STY-14 receives a visible reciprocal DDD-01 link; DDD-02 remains unpublished, absent from actionable links, and is never fabricated.
- Reuse existing source identities `src-docs-8fb33e125d2a`, `src-docs-1ad75d39a251`, and `src-docs-ac85a74ed0b2`; add only necessary identities for the Eric Evans DDD Reference, Fowler Ubiquitous Language, Microsoft domain analysis, and the original illustration.
- The WeChat article discussed earlier is not a source, citation, evidence record, or proof.
- Current generator baseline is `85 completed / 127 documents / 600 sources`; predicted Stage A is `85/128/604`, predicted Stage B is `86/128/604`, but generator truth wins.
- Historical reviews, raw Browser artifacts, source identities, and backlog publication suffixes remain byte-locked; only current/live fixtures advance.
- Functional Browser PASS is separate from screenshot evidence. Unreliable full-page screenshots remain `BLOCKED / NOT_ACCEPTED` and can never be promoted to visual PASS.

---

### Task 1: Establish the DDD-01 RED Contracts

**Files:**
- Create: `tests/g009-batch16-content.test.mjs`
- Create: `tests/g009-batch16-deployment.test.mjs`
- Read: `scripts/content-schema.mjs`
- Read: `scripts/content-relations.mjs`
- Read: `tests/g009-batch15-content.test.mjs`
- Read: `tests/g009-batch15-deployment.test.mjs`

**Interfaces:**
- Consumes: exact design constants and immutable `d0ba33e2f9dd2b66eacf2b46de7757f65754b191` production baseline.
- Produces: exported DDD-01 article, diagram, source, relation, projection, review, and Browser-evidence validators reused by Tasks 2–7.

- [ ] **Step 1: Freeze the exact design constants**

Define literal constants for the route, metadata, ten H2s, three H3s, five contexts, six table columns per context, eight relationship columns, diagram paths, governed source IDs, forbidden equivalences, DDD-02 actionable patterns, and Stage A/B lifecycle values. Do not derive expected values from the production files being tested.

- [ ] **Step 2: Add reader-visible article contracts**

Implement helpers that parse MDX/frontmatter and require the exact heading order, explicit `说明性场景`, the five context contracts, both physical tables, three focusable wrappers, conditional subdomain language, source anchors, and the visible prohibitions against context/service/team/database equivalence. Reader-visible AST text must exclude comments, hidden HTML, code literals, evidence-card bodies used to satisfy primary narrative requirements, and negated or contradictory matches.

- [ ] **Step 3: Add deterministic diagram contracts**

Require uncompressed Draw.io XML and published SVG to contain exact semantic IDs for five contexts, support view, external payment provider, system boundary, U/D direction, relationship patterns, exchanged facts, translation positions, legend, and failure boundaries. Require real connectors with terminals, ports or waypoints, arrow markers, effective styles, visible labels, and Draw.io/SVG endpoint parity.

- [ ] **Step 4: Add governance and lifecycle contracts**

Require reuse of the three existing identities, exact bounded roles for the three new remote identities, one local original-illustration identity, matching license inventory rows, STY-14 reciprocity, DDD-02 actionable count zero, Stage A `published/pending`, and Stage B `published/complete`. Add non-no-op mutations for new identity duplication, remote URL drift, license weakening, WeChat insertion, reciprocal-link loss, fabricated DDD-02, lifecycle drift, and historical artifact modification.

- [ ] **Step 5: Capture the expected RED**

Run:

```bash
node --test tests/g009-batch16-content.test.mjs tests/g009-batch16-deployment.test.mjs
```

Expected: helper fixtures and historical locks pass; production assertions fail only because the DDD-01 article/assets/sources/review and generated publication do not exist.

- [ ] **Step 6: Commit the RED contracts**

```bash
git add tests/g009-batch16-content.test.mjs tests/g009-batch16-deployment.test.mjs
git commit -m "test: define DDD-01 publication contract"
```

---

### Task 2: Register the Governed Evidence Set

**Files:**
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Test: `tests/g009-batch16-content.test.mjs`

**Interfaces:**
- Consumes: Task 1 source ID and role constants.
- Produces: seven exact governed identities available to the article: three reused remote records, three new remote records, and one original illustration record.

- [ ] **Step 1: Verify existing identities without editing them**

Assert byte identity and current governed roles for:

```text
src-docs-8fb33e125d2a  Martin Fowler / Bounded Context
src-docs-1ad75d39a251 DDD Crew / Context Mapping pinned repository
src-docs-ac85a74ed0b2 Context Mapper / Anti-Corruption Layer
```

The tests must reject changes to their locators, version, license, allowed roles, usage boundary, or health transport.

- [ ] **Step 2: Add three narrowly scoped remote records**

Register exact identities for:

```text
https://www.domainlanguage.com/ddd/reference/
https://martinfowler.com/bliki/UbiquitousLanguage.html
https://learn.microsoft.com/azure/architecture/microservices/model/domain-analysis
```

The Eric Evans record is the sole manifest primary and records the visible CC BY 4.0 scope. Fowler is facts-and-short-quotation under its observed rights boundary. Microsoft supports sequence and iterative boundary analysis only; it cannot prove that bounded contexts are microservices or approve this article's five boundaries.

- [ ] **Step 3: Add the original illustration record and license row**

Register `src-atlas-ddd01-strategic-context-map` as a local original illustration with `canonical_locator: /img/diagrams/ddd-01-strategic-ddd-context-map.svg`, no remote transport, `link_policy: null`, and the repository's original-illustration license policy. Add exactly one matching inventory row.

- [ ] **Step 4: Refresh only new remote health entries**

Use the repository source-health command for the three new transports, preserving all existing observations and archives. Record redirects and content types exactly; do not replace a failed live attempt with an assumed healthy state.

- [ ] **Step 5: Verify governance and commit**

```bash
node --test tests/g009-batch16-content.test.mjs
npm run check:links
git diff --check
git add data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md tests/g009-batch16-content.test.mjs
git commit -m "docs: govern DDD-01 evidence sources"
```

Expected: source helper and real-ledger assertions pass; article and diagram production assertions remain RED.

---

### Task 3: Create the Strategic Context Map

**Files:**
- Create: `diagrams/ddd-01-strategic-ddd-context-map.drawio`
- Create: `static/img/diagrams/ddd-01-strategic-ddd-context-map.svg`
- Modify: `tests/g009-batch16-content.test.mjs`

**Interfaces:**
- Consumes: the exact context, relationship, label, source identity, and responsive geometry contracts from Tasks 1–2.
- Produces: one editable Draw.io source and one byte-bound accessible SVG used by the article and Browser evidence.

- [ ] **Step 1: Read the diagram skill and fix the semantic inventory**

Use `creating-drawio-architecture-diagrams`. Record every node, boundary, exchanged fact, relationship pattern, translation position, legend item, terminal, port, waypoint, marker, z-order, and effective style before drawing.

- [ ] **Step 2: Author the Draw.io source**

Create an uncompressed single-page diagram with sales order central; inventory promise and payment settlement on the upstream/cooperation side; fulfillment delivery on the consumption side; customer support and support view below; and the payment provider outside the system boundary. Label every relationship with direction, exchanged fact, and only the approved pattern combination.

- [ ] **Step 3: Export an accessible SVG**

Export the exact source to SVG, preserve semantic group IDs, include title and description, use visible arrowheads and color-independent labels, and ensure a transparent background works in light and dark themes. Do not embed external images, scripts, links, logos, watermarks, or foreign objects.

- [ ] **Step 4: Run geometry and raster QA**

Validate the source/SVG pair and rasterize the SVG at 800px article width in light and dark backgrounds. Measure minimum text-to-boundary padding, marker clearance, connector-to-label clearance, connector-to-node clearance, legend padding, clipping, and transformed text baselines. Inspect the original raster, not a thumbnail.

- [ ] **Step 5: Prove mutation sensitivity and commit**

Add mutations for missing/swapped context, fake relationship label, illegal C/S+OHS combination, reversed U/D, missing ACL owner, connector without terminal, waypoint drift, hidden label, marker loss, line-over-text/node/route, Draw.io/SVG mismatch, opaque background, and narrow-padding regression.

```bash
node --test tests/g009-batch16-content.test.mjs
git diff --check
git add diagrams/ddd-01-strategic-ddd-context-map.drawio static/img/diagrams/ddd-01-strategic-ddd-context-map.svg tests/g009-batch16-content.test.mjs
git commit -m "docs: illustrate DDD-01 strategic context map"
```

---

### Task 4: Publish the Article Candidate and Relation Graph

**Files:**
- Create: `content/patterns/ddd-01-strategic-ddd-overview.mdx`
- Modify: `content/patterns/index.mdx`
- Modify: `content/styles/sty-14-architecture-choice-matrix.mdx`
- Modify: `scripts/content-schema.mjs`
- Modify: `scripts/content-relations.mjs`
- Modify: relevant schema and relation tests
- Modify: `tests/g009-batch16-content.test.mjs`

**Interfaces:**
- Consumes: governed source identities and the reviewed diagram pair.
- Produces: a schema-valid DDD-01 MDX page, visible pattern-index entry, and exact STY-14 reciprocal relation.

- [ ] **Step 1: Capture schema and relation REDs**

Add regression fixtures requiring only `pattern && DDD-01` to accept exact empty `depends_on`, `related_cases`, and `related_questions` with `adjacent_topics: [STY-14]`. Parent and reciprocal checks still execute. DDD-02, another pattern, and a non-pattern using the same ID must not inherit the exception.

- [ ] **Step 2: Write the two-layer article**

Use the exact ten H2s and three H3s. Keep the definition, five boundary hypotheses, authoritative facts, unknown-payment boundary, relationship semantics, failure signals, and redraw conditions in visible narrative. Put versions, locator details, rights notes, and repeated verification anchors into one-topic evidence cards.

- [ ] **Step 3: Add the physical tables and focus wrappers**

Create exactly three named wrappers: Context Map SVG, context-contract table, and relationship-contract table. Each wrapper is keyboard focusable, labelled, and locally scrollable. The first table has one row per five contexts and the exact six decision fields; the second has only actual map relationships and all eight contract fields.

- [ ] **Step 4: Add visible navigation without fabricating DDD-02**

Add DDD-01 to the Pattern index general-design group and a visible reciprocal link in STY-14 explaining that domain-model boundaries and deployment boundaries are different decisions. Scan Markdown, MDX, HTML, generated data, and visible source labels for actionable DDD-02 links; require count zero.

- [ ] **Step 5: Run editorial and repository validation**

```bash
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/patterns/ddd-01-strategic-ddd-overview.mdx
node --test tests/g009-batch16-content.test.mjs
npm run validate:content
npm run check:terminology
npm run check:links
git diff --check
```

Expected: density score strictly above 90 with zero unresolved warnings; all production content, diagram, source, relation, schema, and rights assertions pass.

- [ ] **Step 6: Run local four-state Browser integration**

Build and serve the exact candidate. With Codex in-app Browser, inspect desktop light/dark `1440×1000` and mobile light/dark `390×844`; require no document overflow, three exact wrappers, 3px focus-visible outline, ArrowRight local scrolling, loaded SVG dimensions/bytes, STY-14 href→H1→return, all governed source anchors, DDD-02 actionable count zero, and complete empty console/CDP diagnostics. Screenshot conclusions remain separate.

- [ ] **Step 7: Verify and commit**

```bash
npm run verify
git diff --check
git add content/patterns/ddd-01-strategic-ddd-overview.mdx content/patterns/index.mdx content/styles/sty-14-architecture-choice-matrix.mdx scripts/content-schema.mjs scripts/content-relations.mjs tests
git commit -m "docs: add DDD-01 strategic overview"
```

---

### Task 5: Generate and Bind the Stage A Candidate

**Files:**
- Regenerate: `src/generated/*.json`
- Create: `docs/reviews/g009-batch16.md`
- Create: `docs/reviews/evidence/g009-batch16-stage-a-browser.json`
- Modify: `tests/g009-batch16-content.test.mjs`
- Modify: `tests/g009-batch16-deployment.test.mjs`
- Modify: current/live projection fixtures only

**Interfaces:**
- Consumes: the complete Task 4 article/source/relation graph and local Browser observations.
- Produces: reproducible Stage A candidate with independent review slots PENDING and deployment NOT_RUN.

- [ ] **Step 1: Capture projection and evidence REDs**

Require DDD-01 `published/pending`, DDD-02 absent/unpublished/pending/non-actionable, exact generator totals, a tracked raw local Browser artifact, and review fields `code=PENDING`, `content-rights=PENDING`, `architecture=PENDING`, `final=PENDING`, `deployment=NOT_RUN`, `scope=STAGE_A_ONLY`.

- [ ] **Step 2: Generate canonical content**

```bash
npm run generate:content
npm run check:content
```

Verify rather than force the predicted `85/128/604`. Explain every difference using exact document/source inputs and update only live/current fixtures; immutable snapshot totals and historical review/raw bytes do not move.

- [ ] **Step 3: Track exact local Browser evidence**

Serialize the four states observed in Task 4 with viewport/theme identity, document and wrapper geometry, focus-visible style, real keyboard deltas, SVG bytes/dimensions, STY-14 destination/H1/return, all source anchors, DDD-02 count, native console messages, Runtime/Log cursor continuity, and screenshot attempt status. Bind exact raw bytes/SHA and the complete build-input tree including `sidebars.ts`.

- [ ] **Step 4: Add evidence mutations**

Reject duplicate/swapped wrapper, wrong viewport/theme, lost focus, thin outline, wrong scroll delta, fabricated relation/H1/return, altered source href/rel/target, unloaded or stale SVG, incomplete/truncated diagnostics, fabricated DDD-02, screenshot overclaim, stale build input, missing `sidebars.ts`, and displaced/additive review claims.

- [ ] **Step 5: Verify and commit**

```bash
npm run verify
git diff --check
git add src/generated docs/reviews/g009-batch16.md docs/reviews/evidence/g009-batch16-stage-a-browser.json tests
git commit -m "test: bind DDD-01 Stage A projection"
```

---

### Task 6: Review, Publish, and Verify Stage A

**Files:**
- Modify: `docs/reviews/g009-batch16.md`
- Create: `docs/reviews/evidence/g009-batch16-stage-a-production-browser.json`
- Modify: `tests/g009-batch16-deployment.test.mjs`
- Modify: historical-namespace tests only through exact-path allowlists when required

**Interfaces:**
- Consumes: exact Task 5 head and local Browser artifact.
- Produces: independent Stage A READY verdicts and production-verified Stage A while DDD-01 remains pending.

- [ ] **Step 1: Obtain three exact-head independent reviews**

Dispatch read-only code/spec/security, content/evidence/rights, and architecture/invariants reviews. All three inspect the article, source roles, rights, Draw.io/SVG semantics and geometry, generator projection, Browser raw, relation graph, historical locks, and forbidden equivalences. Remediate every Critical or Important finding with RED/GREEN tests and exact-head re-review.

- [ ] **Step 2: Bind review verdicts**

Require exact reviewed head and literal zero-finding verdicts:

```text
code: READY / APPROVE / findings 0
content: CONTENT READY / rights PASS / findings 0
architecture: CLEAR / READY / blockers 0
final Stage A: READY
deployment: NOT_RUN
```

Mutations reject wrong head, weakened verdict, rights failure, stale PENDING, fabricated deployment, screenshot overclaim, and displaced/additive claims.

- [ ] **Step 3: Run strict publication preflight and push**

Require tracked clean, fresh fetch and `ls-remote`, exact merge-base, zero behind, reviewed remote unchanged, no merge commit, and no unrelated package. Run fresh `npm run verify`, then only `git push origin HEAD:main`; never force push. Stop on remote advance or semantic conflict.

- [ ] **Step 4: Observe exact Pages run and probe production**

Bind exact implementation SHA, workflow/event, headSha, run ID, build/deploy job IDs, timestamps, and `completed/success`. Require HTTP 200 and correct content type for `/`, `/patterns`, `/patterns/ddd-01`, `/styles/sty-14`, `/references`, and the DDD-01 SVG; bind live SVG bytes/SHA to the reviewed asset.

- [ ] **Step 5: Capture fresh production Browser evidence**

Repeat all four states and functional fields against production using Codex in-app Browser. Relation checks bind exact DDD-01↔STY-14 href/H1/return; source checks validate actual anchors without claiming remote page loads. Diagnostics must be complete and empty. Track exact raw bytes/SHA; screenshots remain independently accepted or blocked.

- [ ] **Step 6: Bind, verify, commit, and push evidence**

Add mutation-sensitive run/job/route/SVG/state/wrapper/relation/source/diagnostic/screenshot assertions. If namespace protection rejects the new artifact, add only its exact path plus a near-match rejection.

```bash
npm run verify
git diff --check
git add docs/reviews/g009-batch16.md docs/reviews/evidence/g009-batch16-stage-a-production-browser.json tests/g009-batch16-deployment.test.mjs tests
git commit -m "docs: record DDD-01 Stage A production evidence"
git push origin HEAD:main
```

Observe the evidence commit's own exact-head Pages run to `completed/success` and record it only in an ignored task report. Leave DDD-01 pending.

---

### Task 7: Close Stage B and Finalize DDD-01

**Files:**
- Modify: `docs/content-backlog.md`
- Modify: `docs/reviews/g009-batch16.md`
- Create: `docs/reviews/evidence/g009-batch16-stage-b-production-browser.json`
- Modify: `tests/g009-batch16-deployment.test.mjs`
- Regenerate: `src/generated/*.json`
- Modify: current/live projection fixtures only

**Interfaces:**
- Consumes: exact successful Stage A runs, evidence, and verdicts.
- Produces: DDD-01 complete, production-verified current `main`, with DDD-02 still absent and non-actionable.

- [ ] **Step 1: Lock immediate history before lifecycle change**

Hash the complete immediately previous backlog prefix/suffix, G009 Batch 15 review, G010 MTH-07 review, all Batch 16 Stage A review/evidence bytes, and the complete pre-Stage-B review/evidence tree. Add non-no-op add/edit/delete/membership mutations before changing the checkbox.

- [ ] **Step 2: Write Stage B RED and close only DDD-01**

Require exactly one new checked DDD-01 row with exact Stage A implementation/evidence SHA, run/jobs/date, HTTP, functional, and screenshot evidence. Keep DDD-02 unchecked and non-actionable. Require DDD-01 complete, predicted generator totals `86/128/604` subject to generator truth, Stage B review slots PENDING, and deployment PENDING/NOT_RUN.

- [ ] **Step 3: Regenerate and synchronize only current truth**

```bash
npm run generate:content
npm run check:content
```

Update current/live counts, DDD-01 lifecycle, and next-pending selectors only. Preserve historical totals and raw/review bytes. Any historical validator compatibility must normalize only the exact new DDD-01 closure row by fixed SHA before applying its unchanged old hash.

- [ ] **Step 4: Run cleanup and three Stage B reviews**

Remove stale current-topic names/messages and duplicate dead code without weakening validators. Obtain exact-head zero-blocker code/spec/security, content/evidence/rights, and architecture/invariants verdicts. Bind them while deployment stays PENDING; fix and re-review every Critical or Important finding.

- [ ] **Step 5: Publish the Stage B verdict candidate**

Run full verification and strict remote preflight, commit the exact verdict-bound candidate, fast-forward push to main, and wait for its exact-head Pages build/deploy jobs to finish successfully.

- [ ] **Step 6: Capture fresh Stage B production evidence**

Probe the same routes and SVG, then repeat the four-state production IAB contract into `g009-batch16-stage-b-production-browser.json`. Require DDD-01 `published/complete`, DDD-02 actionable count zero, exact relation/source results, and complete diagnostics. Record screenshots honestly and never reuse Stage A observations as Stage B facts.

- [ ] **Step 7: Bind final SUCCESS and publish the evidence commit**

Add all-field mutation rejection, set final Stage B `SUCCESS/PASS`, and state DDD-01 complete without declaring all DDD topics or current G009 complete. Run fresh `npm run verify && git diff --check`, commit only review/raw/test evidence, fast-forward push, and observe its own exact-head Pages run to `completed/success` in the ignored report to avoid recursive evidence commits.

- [ ] **Step 8: Final independent branch review**

Review the complete design range for zero Critical/Important findings, exact source and rights boundaries, 86/128/generator-truth projection, DDD-02 absence, successful exact-head runs, production HTTP/SVG/four-state evidence, tracked-clean state, and `HEAD=origin/main`. Preserve the isolated worktree unless the user explicitly chooses cleanup.

---

## Plan Self-Review

- Spec coverage: Tasks 1–7 cover all thirteen design sections, including the five context contracts, conditional subdomain classification, relationship semantics, Draw.io/SVG, two tables, evidence cards, failure/redraw conditions, sources/rights, reciprocity, DDD-02 exclusion, Stage A/B, and production QA.
- Scope: one article, one diagram pair, one reciprocal STY-14 edit, necessary source records, tests, generated projections, and release evidence. DDD-02 and tactical DDD implementation remain outside the plan.
- Interface consistency: Task 1 constants feed every later validator; Task 2 source IDs feed Task 4; Task 3 asset paths feed Tasks 4–7; Task 5 evidence schema is reused in both publication stages; all review verdicts bind literal heads rather than mutable branch names.
- Placeholder scan: no TBD/TODO, unspecified handler, deferred implementation, or “similar to” step remains. Expected counts are explicitly predictions that must yield to generator truth.
