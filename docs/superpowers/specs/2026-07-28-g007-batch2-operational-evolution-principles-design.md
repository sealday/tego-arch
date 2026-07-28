# G007 Batch 2 Operational and Evolution Principles Design

**Date:** 2026-07-28

**Status:** Approved design, pending written-spec review

**Scope:** PR-06 through PR-08 only

## Outcome

Publish PR-06 through PR-08 as one governed G007 batch:

- PR-06 explains how KISS, YAGNI, and DRY constrain different design risks.
- PR-07 selects Fail Fast, Fail Safe, or Graceful Degradation from error and side-effect boundaries.
- PR-08 makes evolutionary design concrete through compatibility windows, replaceable seams, incremental migration, observability, and explicit reassessment conditions.

The batch must remain independently readable page by page while forming one decision sequence:

1. avoid unsupported complexity and premature abstraction;
2. choose how the system behaves when assumptions fail;
3. preserve a safe path for later change.

G007 remains in progress after this batch. PR-09 through PR-17 remain unpublished and unchecked.

## Chosen Approach

Use a decision-matrix spine rather than a historical survey or one continuous case study.

Each page starts from a decision that an experienced developer or architect must make. Definitions and source facts support that decision, but do not become the article structure. Each page includes one original deterministic representation—a decision table or Mermaid diagram—whose conclusion remains understandable from surrounding prose if the visual cannot render.

This approach is preferred because the three topics are commonly reduced to slogans. A decision matrix forces the content to state inputs, trade-offs, failure modes, and non-use conditions.

## Alternatives Considered

### Historical-source spine

Organize each page around the origin and later interpretation of its terms.

This would strengthen provenance but risks turning the pages into concept histories. It would also make the operational differences between the three failure strategies and the concrete mechanics of evolutionary design less visible.

### Single-case spine

Use one system and carry it through simplification, failure handling, and migration.

This would improve narrative continuity but could make each article depend on the other two. It also risks treating one scenario as generally representative. The selected design may reuse a compatible case link, but each page must stand alone.

## Shared Content Contract

Each page is an independent MDX knowledge unit with:

- `content_type: principle`;
- canonical slugs `/principles/pr-06`, `/principles/pr-07`, and `/principles/pr-08`;
- `priority: P0` and `status: reviewed`;
- the exact established H2 order:
  1. `学习问题`
  2. `要保护的性质`
  3. `冲突与适用上下文`
  4. `机制`
  5. `误用与反原则`
  6. `适用尺度`
  7. `相邻原则`
  8. `说明性场景`
  9. `来源`
- three to five learning questions;
- an explicit source-fact label, inference label, and site-analysis label;
- at least two visible governed external sources from independent domains;
- exactly one citation eligible as the manifest primary source;
- an original Mermaid diagram or Markdown decision table;
- a visible parent link to `/principles`;
- visible reciprocal links for every published adjacent principle;
- at least one visible related-case link;
- an explicit failure mode, non-use condition, and scale boundary.

The pages must not expose routes for PR-09 through PR-17 before those pages are published.

## PR-06: KISS, YAGNI, and DRY in Tension

### Decision boundary

KISS limits the complexity of the current solution. YAGNI rejects speculative capability without present evidence. DRY reduces knowledge that must be updated consistently in multiple places.

The page must not reduce all three to “write less code.” The decision unit is different:

- KISS asks whether the present mechanism is more complex than the present problem requires.
- YAGNI asks whether a proposed capability is supported by a current requirement or validated near-term constraint.
- DRY asks whether multiple representations encode the same authoritative knowledge and must change together.

### Required representation

Include an original decision matrix with at least these inputs:

- current problem complexity;
- evidence for future requirements;
- whether apparent duplication represents the same knowledge;
- frequency and cost of synchronized changes;
- cost of extracting the wrong abstraction;
- reversibility of leaving duplication temporarily in place.

The representation must show that temporary duplication can be safer than a premature shared abstraction. It must also show that repeated authoritative business rules are materially different from merely similar code shapes.

### Required corrections

The article must explicitly reject:

- treating every duplicate syntax fragment as a DRY violation;
- adding extension points solely because a future use is imaginable;
- using KISS to avoid necessary domain or operational complexity;
- creating a shared abstraction before the stable variation boundary is known.

### Relations

PR-06 links visibly to:

- PR-01 for hiding volatile decisions;
- PR-02 for the coupling introduced by shared abstractions;
- PR-05 for composition and replaceability;
- PR-08 for deferring irreversible choices while preserving an evolution path.

PR-08 reciprocally links to PR-06. PR-01, PR-02, and PR-05 gain a PR-06 link only if the reciprocal relation remains accurate and does not distort their existing argument.

## PR-07: Fail Fast, Fail Safe, and Graceful Degradation

### Decision boundary

The three strategies operate on different questions:

- Fail Fast exposes an invalid assumption or unusable state close to its origin and stops the affected operation.
- Fail Safe moves the system toward a state whose remaining hazards are bounded when failure occurs.
- Graceful Degradation preserves a reduced service level when full capability is unavailable.

They are not mutually exclusive system-wide labels. One request path may fail fast on invalid input, move an actuator or transaction boundary to a safe state, and degrade an optional feature.

### Required representation

Include an original decision table or flowchart driven by:

- whether the error is detectable before side effects;
- whether continuing can cause safety, security, financial, or integrity harm;
- whether side effects are reversible;
- whether a safe state exists;
- whether a reduced service retains truthful semantics;
- whether dependencies and operators can distinguish degraded from healthy behavior.

The representation must prevent “return stale or partial data” from being called graceful degradation when the response would be misleading.

### Required corrections

The article must explicitly reject:

- treating Fail Fast as crashing the whole process for every local error;
- confusing fail-safe behavior with silent error swallowing;
- calling an incorrect but available response graceful degradation;
- applying one strategy uniformly across validation, persistence, control, and presentation boundaries;
- claiming safety without naming the hazard and safe state.

### Relations

PR-07 links visibly to:

- PR-02 for runtime and dependency coupling;
- PR-04 for control and policy boundaries;
- QA-01 for scenario fields that name stimulus, environment, response, and measure;
- at least one published case with observable failure or fallback behavior.

No link to a future reliability topic may be rendered until that topic is published.

## PR-08: Designing for Evolution

### Decision boundary

Evolutionary design protects the ability to change a system through evidence-backed, bounded steps. It is not advance construction of a universal framework.

The page must make five mechanisms concrete:

- compatibility windows with named producers and consumers;
- replaceable seams around volatile decisions;
- incremental or parallel migration paths;
- telemetry that distinguishes old and new behavior;
- explicit reassessment and removal conditions.

### Required representation

Include an original migration loop or decision table covering:

1. identify the volatile decision and affected consumers;
2. establish a compatibility seam;
3. introduce the new path in a bounded slice;
4. observe correctness, load, and adoption;
5. expand, revise, or roll back;
6. remove the compatibility layer when an explicit exit condition is met.

The text must state that compatibility layers and feature switches create carrying cost. A migration is incomplete while the old and new paths remain indefinitely without an owner and removal condition.

### Required corrections

The article must explicitly reject:

- building generic extension frameworks for hypothetical futures;
- equating microservices or plugin systems with evolvability;
- treating backward compatibility as permanent support for every behavior;
- describing a big-bang replacement as incremental evolution;
- adding indirection without an identified volatility or migration boundary.

### Relations

PR-08 links visibly to:

- PR-01 for hiding volatile decisions;
- PR-04 for dependency direction and replaceable policy boundaries;
- PR-05 for composition and substitution;
- PR-06 for deferring speculative abstraction;
- MTH-03 for ADR reassessment and supersession;
- MTH-04 for measurable fitness and migration signals;
- at least one published migration case.

PR-06 reciprocally links to PR-08. Existing pages gain reciprocal links only where their current argument genuinely introduces the same decision boundary.

## Source Governance

Source selection occurs before drafting factual conclusions.

For every accepted source:

- establish a stable canonical identity independent of incidental query strings or anchors;
- record author or responsible organization, publication or version evidence, audit date, final transport, source kind, evidence role, rights evidence, license policy, and a narrow usage boundary;
- prefer primary or official sources for the core definition or mechanism;
- use secondary material only for comparison or interpretation;
- register facts-summary usage unless a short quotation is both necessary and separately reviewed;
- avoid copying diagrams, tables, taxonomies, examples, or protected book structure;
- reject a source whose authorship, version, final transport, or reuse boundary cannot be established.

Candidate families to audit include:

- PR-06: original or author-controlled YAGNI material, the authoritative DRY book record or author material, and an independent source on abstraction or technical-debt trade-offs;
- PR-07: official resilience, safety, or reliability guidance that names response and hazard boundaries, plus an independent operational source on partial service or degradation;
- PR-08: author-controlled evolutionary architecture or parallel-change material, plus an official compatibility, migration, or architecture-evaluation source.

The final ledger, not this candidate list, is authoritative. Each page needs at least two independent governed sources and exactly one manifest-primary citation.

## Relationship and Generation Rules

Front matter remains the canonical published relationship input. Generated manifest, topic-index, project-status, and sidebar projections must be updated only through `bun run generate:content`.

Existing page relations may change only to provide accurate reciprocal links required by this batch. Do not opportunistically rewrite PR-01 through PR-05.

The principle index must discover PR-06 through PR-08 through generated data; it must not receive a manually maintained duplicate list.

## Test Strategy

Implementation follows test-first delivery.

### Stage A contract

A new real-content test must fail before content is added and then prove:

- exact files, IDs, slugs, status, priority, and H2 order;
- three to five questions and one deterministic representation per page;
- required concept-correction vocabulary;
- source-fact, inference, and site-analysis markers;
- at least two visible governed sources and exactly one manifest primary;
- visible parent, reciprocal adjacent, and case links;
- no visible PR-09 through PR-17 routes;
- generated publication and relationship projections.

The first RED must be caused by missing PR-06 through PR-08 content, not by syntax, import, or fixture errors.

### Source validation

Source-ledger tests and targeted G007 tests must pass after governance entries are added. Live link refresh results must be reviewed rather than manually declaring unreachable sources healthy.

### Repository gate

Before Stage A integration:

- targeted G007 tests pass;
- `bun run verify` passes;
- `git diff --check` passes;
- an independent reviewer checks editorial boundaries, factual support, copyright scope, anti-overclaim language, relationship correctness, and test adequacy.

## Delivery and Deployment

Use the established two-stage closure.

### Stage A

Stage A contains:

- the failing-then-passing content contract;
- governed sources and link-health observations;
- PR-06 through PR-08;
- only necessary reciprocal edits to published pages;
- generated projections.

PR-06 through PR-08 remain unchecked in `docs/content-backlog.md` during Stage A.

After Stage A is integrated into `main`:

1. push the exact commit;
2. wait for the GitHub Pages run whose `headSha` equals that commit;
3. require `status=completed` and `conclusion=success`;
4. verify `/principles`, `/principles/pr-06`, `/principles/pr-07`, and `/principles/pr-08`;
5. verify current production CSS and JavaScript;
6. inspect desktop `1440x1000` and mobile `390x844`;
7. check page-level overflow, local table or Mermaid overflow, console warnings and errors, source visibility, and actual internal-link navigation.

### Stage B

Only after successful Stage A deployment:

- create `docs/reviews/g007-batch2.md`;
- record the exact Stage A SHA, Pages run, live routes, assets, viewports, interaction evidence, source and copyright verdicts, and reviewer identity;
- check only PR-06 through PR-08 in `docs/content-backlog.md`;
- update the current release baseline and completed-topic counts;
- add a deployment-closure regression test;
- regenerate derived files;
- run the full repository gate;
- commit, push, and verify the Stage B deployment.

G007 remains the current durable story, and the next batch begins at PR-09.

## Acceptance Criteria

The batch is complete only when:

- PR-06 through PR-08 satisfy the shared content contract and their page-specific corrections;
- source governance is complete and validated;
- targeted and full repository gates pass;
- independent review has no unresolved important finding;
- exact-SHA Stage A Pages deployment succeeds;
- all affected production routes and assets pass live smoke;
- desktop and mobile render checks pass;
- real parent, adjacent, method, and case link clicks reach their intended routes;
- Stage B evidence and backlog closure are committed and deployed;
- `main` equals `origin/main` and the implementation worktree is clean.
