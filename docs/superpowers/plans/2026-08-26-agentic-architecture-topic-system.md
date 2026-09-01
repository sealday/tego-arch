# Agentic Architecture Topic System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute and publish the complete 17-article Agentic Architecture topic system as one verified release.

**Architecture:** The implementation is split into four reviewable plans: shared registry plus six concepts, eight control patterns, three reference cases, and atomic integration/release. Phase commits remain on one isolated feature branch; none are published until the release plan closes navigation, QA, review, merge, deployment, and production evidence.

**Tech Stack:** Docusaurus 3.10.2, MDX, Node.js 24, TypeScript 6, Mermaid, Draw.io/SVG, JSON content/source registries, GitHub Actions and Pages.

## Global Constraints

- Design authority: `docs/superpowers/specs/2026-08-26-agentic-architecture-topic-system-design.md` at commit `cefdf61`.
- Isolated branch/worktree: `codex/agentic-architecture-topic-system` in `.worktrees/agentic-architecture-topic-system`.
- Exact release inventory: 6 concepts, 8 patterns, 3 cases.
- Globally unique knowledge IDs: `AGT-C-01...AGT-C-06` and `AGT-P-01...AGT-P-08`.
- Exact case routes: `/cases/multi-agent-research-system`, `/cases/long-running-coding-agent`, `/cases/production-incident-response-agent`.
- Release is atomic: all 17 pages, visuals, sources, indexes, learning path, groups, reciprocal links, tests, reviews, and production evidence must pass before completion.
- Foundations, Patterns, and Cases each close with a **scoped phase gate**: all focused contracts and browser checks owned by that phase pass, generation is run and audited when its prerequisites allow it, and every remaining repository-wide failure is recorded as an exact finite blocker owned by a later named task.
- A scoped phase may proceed only when it has zero defects in its own deliverables. Scoped PASS never weakens a validator, creates a stub route, hides an atomic-release link, or substitutes for the fresh complete `npm run verify` required by Release Task 5 and again before merge/publish.
- Preserve unrelated work and never merge uncommitted changes from another worktree.

---

## Controller decision: staged verification without circular gates

The phase plans intentionally publish forward metadata before all 17 routes exist. Requiring a green repository-wide build at the end of Foundations would require Pattern and Case routes that later plans have not yet created; requiring Patterns to start only after that impossible result is circular. The controller therefore authorizes a scoped PASS to advance the next named plan when the current phase has zero scoped defects and the only remaining failures are an explicit, finite downstream set. For Foundations, the approved downstream set is (1) `AGT-P-01...AGT-P-08` group assignment owned by Patterns Task 1 and (2) missing forward Pattern and Case routes owned by Patterns Tasks 2–9 and Cases Tasks 2–4. Full-project PASS is deferred, not waived: Release Task 5 and the merge/publish tasks require fresh complete `npm run verify` evidence.

---

### Task 1: Build the shared registry and six concept foundations

**Plan:** `docs/superpowers/plans/2026-08-26-agentic-architecture-foundations.md`

**Produces:** The canonical 17-item fixture/backlog, `AGT-C-01...06`, shared reference architecture, foundation tests, governed sources, and a scoped Foundations PASS with exact downstream blockers.

- [ ] Execute every checkbox in the foundation plan in order.
- [ ] Confirm all Foundations-focused contracts pass and any repository-wide failures are exactly the approved Pattern-group and missing forward-route blockers named in the controller decision above.
- [ ] Confirm the six concept routes render locally and the AGT-C-01 Draw.io/SVG evidence is recorded.

### Task 2: Build the eight standard control patterns

**Plan:** `docs/superpowers/plans/2026-08-26-agentic-architecture-patterns.md`

**Consumes:** The concept vocabulary and canonical fixture from Task 1.

**Produces:** `AGT-P-01...08`, populated `agent-control` registry, two complex diagram pairs, pattern tests, governed sources, and a scoped Patterns PASS with any remaining Case/Release blockers assigned to later named tasks.

- [ ] Execute every checkbox in the pattern plan in order.
- [ ] Confirm the exact eight-ID group order and all pattern fallback/termination contracts.
- [ ] Confirm all Patterns-focused contracts and desktop/mobile checks pass; audit repository-wide failures and permit only an exact finite set owned by Cases or Release tasks.

### Task 3: Build the three production-constrained reference cases

**Plan:** `docs/superpowers/plans/2026-08-26-agentic-architecture-cases.md`

**Consumes:** Concepts and patterns from Tasks 1–2.

**Produces:** Three case pages, three diagram pairs, catalog projections, evidence-boundary tests, source records, density evidence, and a scoped Cases PASS with any remaining integration blockers assigned to Release tasks.

- [ ] Execute every checkbox in the case plan in order.
- [ ] Confirm every case says it is an original reference design and does not imply a fabricated production deployment.
- [ ] Confirm all Cases-focused contracts and measured desktop/mobile diagram checks pass; audit repository-wide failures and permit only an exact finite set owned by later Release tasks.

### Task 4: Integrate, review, merge, publish, and verify production

**Plan:** `docs/superpowers/plans/2026-08-26-agentic-architecture-release.md`

**Consumes:** All 17 scoped-PASS pages and six synchronized diagram pairs from Tasks 1–3, plus their exact downstream-blocker audits.

**Produces:** Five-stage learning path, category entrances, reciprocal graph, generated projections, full local QA, four independent review verdicts, merged `main`, exact-head GitHub Pages deployment, live-route proof, completed backlog, and final release evidence.

- [ ] Execute every checkbox in the atomic release plan in order.
- [ ] Do not start the merge task until local full verification and all independent review verdicts reference the same release-candidate SHA.
- [ ] Do not mark the project complete until the post-evidence `main` SHA has a successful exact-head Pages run and the deployment test passes.
