# G007 Batch 3 Side-Effect Boundaries Design

**Date:** 2026-07-28

**Status:** Written spec awaiting review

**Scope:** PR-09 through PR-11 only

## Outcome

Publish PR-09 through PR-11 as one governed G007 batch:

- PR-09 explains how least privilege, fail-safe defaults, and defense in depth constrain authorization and damage boundaries at runtime.
- PR-10 explains how idempotency and minimal coordination constrain replay, retry, concurrency, and distributed side effects.
- PR-11 separates method-level Command–Query Separation, architecture-level CQRS, and infrastructure-level read/write separation.

The batch forms one side-effect constraint chain:

1. constrain who may initiate an effect and what authority the effect receives;
2. constrain what happens when an effect is retried, replayed, or coordinated concurrently;
3. separate effect-producing responsibilities from observation responsibilities only at the scale justified by the system.

Each page must remain independently readable. The sequence is a learning path, not a prerequisite chain.

G007 remains in progress after this batch. PR-12 through PR-17 remain unpublished and unchecked.

## Chosen Approach

Use a side-effect constraint chain rather than a security survey, distributed-systems catalog, or unified example.

Each article starts from a different boundary:

- PR-09: the authorization boundary;
- PR-10: the replay and coordination boundary;
- PR-11: the command and query responsibility boundary.

Definitions, source facts, and examples support those decisions but do not become the article structure. Each page includes one original deterministic representation—a decision table, replay matrix, or Mermaid decision flow—whose conclusion remains understandable from the surrounding prose when the visual cannot render.

This approach is preferred because all three topics are frequently promoted as universally desirable labels. A boundary-first treatment forces each page to name its decision inputs, costs, failure modes, non-use conditions, and appropriate scale.

## Alternatives Considered

### Security-first sequence

Frame all three pages as a secure-systems progression from access control to safe distributed execution and command isolation.

This would create a strong narrative, but it would incorrectly absorb PR-10 and PR-11 into security. It would also duplicate the broader threat modeling, secure development lifecycle, and verification responsibilities reserved for PR-16.

### One distributed transaction case

Carry one order, payment, or workflow example through authorization, retry, and CQRS.

This would improve continuity but could make one architecture look canonical. It would also blur the distinction between an illustrative scenario and a generally applicable decision rule. The selected design may reuse compatible published cases, but each page must stand alone and must use evidence from more than one domain.

### Independent glossary pages

Treat the three backlog rows as unrelated definitions.

This would minimize cross-page coupling, but it would lose the common question of how systems constrain side effects. It would also make it easier to repeat slogans without exposing operational trade-offs.

## Shared Content Contract

Each page is an independent MDX knowledge unit with:

- `content_type: principle`;
- canonical slugs `/principles/pr-09`, `/principles/pr-10`, and `/principles/pr-11`;
- PR-09 and PR-10 at `priority: P0`, PR-11 at `priority: P1`;
- `status: reviewed`;
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
- one original Mermaid diagram or Markdown decision table;
- a visible parent link to `/principles`;
- visible reciprocal links for every published adjacent principle where the relationship is accurate;
- at least one visible related-case link;
- an explicit failure mode, non-use condition, scale boundary, and operational cost.

The pages must not expose routes for PR-12 through PR-17 before those pages are published.

## PR-09: Least Privilege, Fail-Safe Defaults, and Defense in Depth

### Decision boundary

PR-09 covers runtime authorization and damage containment:

- least privilege limits the authority granted to a subject, service, process, token, or operation to what its current responsibility requires;
- fail-safe defaults deny or constrain access when no explicit valid authorization decision has been established;
- defense in depth uses independent controls at distinct trust or failure boundaries so one control failure does not immediately expose the protected asset.

The page does not attempt to cover the full secure-by-design lifecycle. Threat modeling, secure development practices, validation strategy, and broader security assurance remain the center of PR-16. PR-09 may point forward conceptually, but it must not render an unpublished PR-16 route.

### Required representation

Include an original authorization decision stack or matrix with at least these inputs:

- subject and workload identity;
- requested action and protected resource;
- minimum capability or scope required for that action;
- explicit grant, explicit deny, missing policy, policy-evaluation failure, and stale identity state;
- trust-boundary crossings;
- blast radius if one control fails;
- independence and observability of additional controls;
- revocation and emergency-access requirements.

The representation must distinguish ordinary rejection from policy-engine failure and must show that a missing or indeterminate authorization decision does not become an implicit grant.

### Required corrections

The article must explicitly reject:

- equating least privilege with creating the largest possible number of roles;
- assuming a narrowly named role is least-privileged without checking its actual resources, actions, duration, and delegation path;
- treating fail-safe defaults as silent failure or an excuse to hide authorization outages;
- treating authentication as sufficient authorization;
- adding duplicate controls that share the same credential, policy source, implementation defect, or failure mode and calling that defense in depth;
- adding controls without naming the protected asset, threat, trust boundary, and residual risk;
- claiming least privilege while retaining permanent broad emergency credentials without ownership, audit, expiry, and revocation rules.

### Scale and non-use boundary

The principle applies from in-process capabilities and database permissions through service identities, cloud roles, deployment credentials, and operator access. The mechanism must match the scale: a local module boundary does not require an enterprise policy engine, while a cross-tenant administrative path cannot rely only on an in-process boolean.

Defense in depth is not a requirement to duplicate every control. An additional layer is justified only when it addresses a named threat or failure mode with meaningful independence and an acceptable operational burden.

### Relations

PR-09 links visibly to:

- PR-04 for policy boundaries and dependency direction;
- PR-07 for explicit failure behavior when authorization or a security control is unavailable;
- PR-10 for limiting the authority carried by retried or replayed operations;
- at least one published case with explicit gateway, identity, policy, or tenant boundaries.

PR-04 and PR-07 gain reciprocal PR-09 links only where the new sentence preserves their existing argument. PR-10 links back to PR-09.

## PR-10: Idempotency and Minimal Coordination

### Decision boundary

PR-10 treats idempotency as an observable operation contract under retry or replay, not as the absence of side effects. Repeating a logically identical operation under the declared identity and validity window must not multiply the protected effect, even though internal work, logging, reads, or response envelopes may differ.

Minimal coordination means reducing the number, duration, and scope of decisions that require participants to agree synchronously. It does not mean eliminating every lock, consensus decision, transaction, serialization point, or ownership rule.

The page must separate:

- duplicate delivery from concurrent conflicting operations;
- request identity from payload equality;
- transport retries from business-operation retries;
- deduplication retention from the business validity window;
- a completed result from an unknown outcome;
- prevention from compensation or manual resolution.

### Required representation

Include an original replay matrix covering at least:

- first attempt succeeds and the response is lost;
- first attempt fails before any protected side effect;
- first attempt produces a side effect but completion recording is uncertain;
- duplicate arrives while the first attempt is still running;
- duplicate arrives after the deduplication record expires;
- the same idempotency key arrives with a different payload;
- two distinct commands conflict over the same invariant;
- an irreversible external side effect cannot be atomically coupled to local persistence.

For each row, state the required identity, stored state, coordination point, observable response class, and terminal path: return recorded outcome, reject conflict, resume safely, retry bounded work, compensate, or escalate manually.

### Required corrections

The article must explicitly reject:

- claiming an operation is idempotent merely because the HTTP method is conventionally idempotent;
- equating idempotency with producing byte-for-byte identical responses;
- generating a fresh idempotency key for every transport retry;
- storing only a success flag when callers must distinguish in-progress, completed, rejected, expired, and unknown outcomes;
- using deduplication to solve concurrent invariant conflicts that require ownership, serialization, or conditional updates;
- assuming exactly-once delivery removes the need for idempotent consumers or effect boundaries;
- describing “no coordination” as universally superior when correctness depends on a named shared invariant;
- retrying irreversible effects indefinitely without compensation, reconciliation, or a manual terminal state.

### Scale and non-use boundary

Idempotency may be implemented at a function, API, message consumer, workflow, or business-operation boundary. The declared key scope and retention window must match that boundary. A process-local cache is not sufficient for a durable cross-instance operation.

Coordination should be minimized around independently owned state and commutative work. It remains necessary where multiple actors can violate the same invariant and no partitioned owner, monotonic rule, escrow technique, or conditional write removes that shared decision.

### Relations

PR-10 links visibly to:

- PR-07 for retry classification and truthful failure behavior;
- PR-08 for compatibility during protocol and workflow evolution;
- PR-09 for minimizing the authority and blast radius of replayed work;
- PR-11 for keeping side-effecting commands explicit when read and write paths diverge;
- at least one published event, workflow, messaging, or control-plane case.

PR-07 and PR-08 gain reciprocal PR-10 links only where accurate. PR-09 and PR-11 link back to PR-10.

## PR-11: CQS, CQRS, and Read/Write Separation

### Decision boundary

The page separates three decisions made at different scales:

- Command–Query Separation is a design rule for an operation or interface: a command changes state and does not masquerade as a query, while a query observes state without changing the externally relevant domain state.
- CQRS is an architectural separation of command and query responsibilities, potentially with different APIs, models, stores, deployment paths, and consistency behavior.
- read/write separation is an infrastructure or routing technique that sends reads and writes through different endpoints or database roles; it may retain one domain model and therefore is not, by itself, CQRS.

The page must not imply that CQS requires two databases, that CQRS always requires asynchronous events, or that a read replica creates separate command and query models.

### Required representation

Include an original decision flow or comparison matrix driven by:

- whether a single operation mixes observation with domain mutation;
- whether the read model and write model require materially different shapes or rules;
- read-to-write ratio and scaling pressure;
- latency and freshness requirements;
- consistency and read-your-write requirements;
- projection, backfill, reconciliation, and schema-evolution cost;
- operational ownership, observability, and incident-response capacity;
- whether a simpler API, index, cache, replica, or reporting store solves the actual bottleneck.

The representation must end in at least four distinct outcomes:

1. apply CQS within the existing model;
2. retain one model and optimize reads;
3. use infrastructure read/write separation;
4. adopt CQRS with explicit projection and consistency contracts.

### Required corrections

The article must explicitly reject:

- calling every function that returns a value a query;
- treating all internal bookkeeping, metrics, caching, or lazy loading as equivalent to a domain command without naming observable semantics;
- equating CQS with CQRS;
- calling a primary/read-replica topology CQRS without separate command and query responsibilities or models;
- adopting CQRS only because reads outnumber writes;
- hiding eventual consistency, projection lag, duplicate events, rebuild cost, and read-your-write behavior from callers;
- assuming separate models require separate physical databases;
- applying CQRS to a simple CRUD boundary without evidence that model divergence or scale pressure repays its operational cost.

### Scale and non-use boundary

CQS can clarify a single method, handler, or API contract. CQRS is a system or bounded-context choice and must not be inferred from local naming. Read/write separation is a deployment and data-access choice whose consistency semantics remain visible to the application.

CQRS is not selected when the command and query models remain materially identical, when strict immediate consistency dominates, or when the team cannot own projections, replay, reconciliation, schema evolution, and additional runtime paths. In those conditions, CQS plus targeted read optimization is the default.

### Relations

PR-11 links visibly to:

- PR-03 for separating reasons to change and responsibilities;
- PR-04 for keeping policy independent from delivery and persistence mechanisms;
- PR-10 for explicit command identity, replay, and side-effect handling;
- at least one published data, workflow, or event-driven case.

PR-03 and PR-04 gain reciprocal PR-11 links only where accurate. PR-10 links back to PR-11.

## Source Governance

Source selection occurs before drafting factual conclusions.

For every accepted source:

- establish a stable canonical identity independent of incidental query strings or anchors;
- record author or responsible organization, publication or version evidence, audit date, final transport, source kind, evidence role, rights evidence, license policy, and a narrow usage boundary;
- prefer primary, standards, author-controlled, or official sources for the central definition or mechanism;
- use secondary material only for comparison, operational interpretation, or an independently sourced example;
- register facts-summary usage unless a short quotation is necessary and separately reviewed;
- avoid copying diagrams, tables, taxonomies, examples, or protected book structure;
- reject a source whose authorship, version, final transport, or reuse boundary cannot be established.

Candidate source families to audit include:

- PR-09: primary security-design principles or official authorization guidance, plus an independent operational source demonstrating scoped credentials, default denial, or independent control layers;
- PR-10: official idempotency or retry contracts and primary distributed-systems guidance, plus an independent workflow, messaging, or control-plane source exposing duplicate and unknown-outcome behavior;
- PR-11: the original or author-controlled CQS/CQRS definitions, plus independent official database or architecture guidance that distinguishes model separation from replica routing.

Candidate examples such as LiteLLM, Microsoft architecture guidance, Kafka, Temporal, or Kubernetes are not pre-approved evidence. They may be used only when the source audit establishes a precise fit, independent provenance, and a narrow facts-summary boundary. The final source ledger, not this candidate list, is authoritative.

Each page needs at least two independent governed sources and exactly one manifest-primary citation.

## Relationship and Generation Rules

Front matter remains the canonical published relationship input. Generated manifest, topic-index, project-status, and sidebar projections must be updated only through `bun run generate:content`.

Existing page relations may change only to provide accurate reciprocal links required by this batch. Do not opportunistically rewrite PR-01 through PR-08.

The principle index must discover PR-09 through PR-11 through generated data; it must not receive a manually maintained duplicate list.

PR-12 through PR-17 remain absent from generated published routes and visible navigation.

## Test Strategy

Implementation follows test-first delivery.

### Stage A content contract

A new real-content test must fail before content is added and then prove:

- exact files, IDs, slugs, status, and per-page priority;
- exact H2 order;
- three to five questions and one deterministic representation per page;
- the page-specific decision distinctions and misconception corrections in this spec;
- source-fact, inference, and site-analysis markers;
- at least two visible governed sources and exactly one manifest primary;
- explicit failure mode, non-use condition, scale boundary, and operational cost;
- visible parent, reciprocal adjacent, and case links;
- no visible PR-12 through PR-17 routes;
- generated publication and relationship projections.

The first RED must be caused by missing PR-09 through PR-11 content, not by syntax, import, or fixture errors.

### Page-specific regression strength

Tests must assert exact page-specific labels or phrases rather than relying only on broad vocabulary:

- PR-09 distinguishes explicit deny, missing policy, and policy-evaluation failure, and rejects correlated duplicate controls as defense in depth.
- PR-10 covers in-progress, completed, conflicting-payload, expired, and unknown-outcome replay states, and distinguishes duplicate suppression from invariant coordination.
- PR-11 distinguishes CQS, CQRS, and replica routing, and exposes projection lag, read-your-write behavior, rebuild cost, and the simpler non-CQRS outcomes.

### Source validation

Source-ledger tests and targeted G007 tests must pass after governance entries are added. Live link refresh results must be reviewed rather than manually declaring unreachable sources healthy.

### Repository gate

Before Stage A integration:

- targeted G007 tests pass;
- `bun run verify` passes;
- `git diff --check` passes;
- an independent reviewer checks editorial boundaries, factual support, copyright scope, anti-overclaim language, relationship correctness, and test adequacy.

Any important or critical review finding blocks integration. Fixes require targeted regression coverage and a clean follow-up review.

## Delivery and Deployment

Use the established two-stage closure.

### Stage A

Stage A contains:

- the failing-then-passing content contract;
- governed sources and reviewed link-health observations;
- PR-09 through PR-11;
- only necessary reciprocal edits to published pages;
- generated projections.

PR-09 through PR-11 remain unchecked in `docs/content-backlog.md` during Stage A.

After Stage A is integrated into `main`:

1. push the exact commit;
2. wait for the GitHub Pages run whose `headSha` equals that commit;
3. require `status=completed` and `conclusion=success`;
4. verify `/principles`, `/principles/pr-09`, `/principles/pr-10`, and `/principles/pr-11`;
5. verify current production CSS and JavaScript;
6. inspect desktop `1440x1000` and mobile `390x844`;
7. check page-level overflow, local table or Mermaid overflow, console warnings and errors, source visibility, and actual internal-link navigation.

### Stage B

Only after successful Stage A deployment:

- create `docs/reviews/g007-batch3.md`;
- record the exact Stage A SHA, Pages run, live routes, assets, viewports, interaction evidence, source and copyright verdicts, and reviewer identity;
- check only PR-09 through PR-11 in `docs/content-backlog.md`;
- update the current release baseline and completed-topic counts;
- add a deployment-closure regression test;
- regenerate derived files;
- run the full repository gate;
- commit, push, and verify the Stage B deployment.

G007 remains the current durable story, and the next batch begins at PR-12.

## Acceptance Criteria

The batch is complete only when:

- PR-09 through PR-11 satisfy the shared content contract and their page-specific corrections;
- each page preserves the boundary assigned in this spec without absorbing PR-12 through PR-17;
- source governance is complete and validated;
- targeted and full repository gates pass;
- independent review has no unresolved important finding;
- exact-SHA Stage A Pages deployment succeeds;
- all affected production routes and assets pass live smoke;
- desktop and mobile render checks pass;
- real parent, adjacent, and case link clicks reach their intended routes;
- Stage B evidence and backlog closure are committed and deployed;
- G007 remains current with PR-12 as the next unpublished topic;
- `main` equals `origin/main` and the implementation worktree is clean.
