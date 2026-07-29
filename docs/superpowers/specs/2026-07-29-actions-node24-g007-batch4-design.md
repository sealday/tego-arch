# Node 24 Actions and G007 Batch 4 Design

## Goal

Complete two ordered deliveries:

1. remove the GitHub Actions Node 20 deprecation annotation by moving every
   first-party action used by this repository to an immutable, official
   Node 24 release;
2. publish G007 Batch 4 as PR-12 through PR-14 without publishing or closing
   PR-15 through PR-17.

The workflow upgrade is a prerequisite, not part of the content batch. It must
be deployed and verified independently before the Batch 4 branch starts.

## Current State

Both workflows already install Node.js 24 for repository commands. The warning
comes from old action implementations that declare a Node 20 runtime, including
the action transitively used by `upload-pages-artifact`.

The current G007 production baseline is Stage B commit
`581ba1c6056a6f3c03962bfb3c3f950b874e4441`. PR-01 through PR-11 are
published and closed. G007 remains current, durable-story progress remains
`6 / 20`, and PR-12 is the next unpublished principle.

## Delivery Strategy

Use two sequential exact-SHA gates.

### Gate 1: Node 24 Actions

Update `.github/workflows/deploy.yml` and
`.github/workflows/link-health.yml` to the following official immutable
releases:

| Action | Release | Commit SHA | Runtime |
| --- | --- | --- | --- |
| `actions/checkout` | `v7.0.1` | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `node24` |
| `actions/setup-node` | `v7.0.0` | `820762786026740c76f36085b0efc47a31fe5020` | `node24` |
| `actions/configure-pages` | `v6.0.0` | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` | `node24` |
| `actions/upload-artifact` | `v7.0.1` | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` | `node24` |
| `actions/upload-pages-artifact` | `v5.0.0` | `fc324d3547104276b827a68afc52ff2a11cc49c9` | composite using `upload-artifact` v7 |
| `actions/deploy-pages` | `v5.0.0` | `cd2ce8fcbc39b97be8ca5fce6e763baed58fa128` | `node24` |

Keep `node-version: 24`, permissions, event boundaries, full-history checkout,
offline verification, artifact names, report paths, and Pages concurrency
semantics unchanged.

`tests/workflow-configuration.test.mjs` must fail against the old pins before
the workflow files change. The regression must protect the exact approved
action-to-SHA mapping and expected release comments, reject floating tags, and
continue to protect the existing security and deployment invariants.

After local verification, merge and push this change independently. Accept Gate
1 only when the exact commit's Pages run is `completed` and `success`, the
workflow annotations contain no Node 20 deprecation message, and the production
principles routes still return HTTP 200.

## G007 Batch 4 Scope

Batch 4 contains exactly three new principle pages.

### PR-12: Open/Closed and Interface Segregation

The page treats Open/Closed and Interface Segregation as related but distinct
boundary decisions:

- Open/Closed asks where a likely variation should be absorbed without editing
  stable policy.
- Interface Segregation asks which capabilities a consumer must depend on.
- An extension point has ownership, compatibility, testing, and operational
  cost; speculative plug-in surfaces are not automatically good design.
- Smaller interfaces reduce irrelevant dependencies only when the resulting
  contracts remain coherent. Fragmentation, adapter proliferation, and
  orchestration leakage are explicit failure modes.

The page must not reduce either principle to “use interfaces everywhere” or
claim that existing code should never change.

### PR-13: Persistence Ignorance

The page defines Persistence Ignorance as keeping domain decisions independent
of persistence mechanisms where that separation improves the model. It does not
mean ignoring storage behavior.

The decision boundary must cover:

- domain rules versus mapping and repository responsibilities;
- aggregate and transaction boundaries;
- reporting and query models that need not be forced through a domain model;
- identity, lazy loading, concurrency, batching, and query-shape leakage;
- cases where explicit persistence-aware optimization is the honest choice.

The page must reject the claims that Persistence Ignorance requires an ORM,
forbids persistence annotations in every context, or makes database and
transaction costs irrelevant.

### PR-14: GRASP Responsibility Assignment

The page presents GRASP as a responsibility-assignment decision system rather
than a pattern-name catalog. It must cover at least:

- Information Expert;
- Creator;
- Controller;
- Low Coupling;
- High Cohesion;
- Polymorphism;
- Pure Fabrication;
- Indirection;
- Protected Variations.

Examples must show that the patterns can pull in different directions. The page
must explain how to choose an owner for information, creation, coordination,
variation, and infrastructure responsibilities without turning Controller into
a god object or Information Expert into a data-holder rule.

## Relationships and Publication Boundary

The implementation plan will select the smallest reciprocal relationship graph
supported by the finished pages. The expected centers are:

- PR-12 with information hiding, cohesion/coupling, responsibility separation,
  dependency direction, composition, evolutionary design, and PR-14;
- PR-13 with responsibility separation, dependency direction, and CQS/CQRS;
- PR-14 with cohesion/coupling, responsibility separation, dependency
  direction, and PR-12.

Every declared adjacency between published topics must be reciprocal and
visible in both documents. Every new page must expose its parent principles
index and at least one real case or learning question.

PR-15 through PR-17 remain absent from generated published routes and visible
navigation. A page may discuss a concept reserved for those topics, but it must
not render an unpublished internal route or absorb their full scope.

## Source Governance

Research and register sources before drafting factual conclusions. Prefer
original authors, official publishers, standards bodies, and official framework
documentation. Each source record must preserve:

- canonical identity and truthful checker transport;
- author or institution, title, version or publication date;
- copyright status and evidence;
- evidence role and factual boundary;
- review and link-policy metadata.

PR-12 must separately support Open/Closed and Interface Segregation. PR-13 must
support both the definition and practical persistence boundary. PR-14 must use
an authoritative GRASP source and must not reproduce protected diagrams,
tables, or extended book text.

No source may be declared healthy without a policy-accepted observation. Any
transport recovery must preserve canonical citation identity and its approved
expected transport.

## Content Contract

Create `tests/g007-batch4-content.test.mjs` before any production content. Its
initial failure must be caused by the three missing pages.

The contract must independently protect:

- the canonical principle metadata and heading sequence;
- each page's concept distinctions and required counterexamples;
- governed visible sources and one eligible primary source per page;
- reciprocal visible relationships and terminal case/question links;
- absence of visible PR-15 through PR-17 routes;
- the page-specific misconceptions described above.

Earlier G007 content tests may advance only their unpublished-route assertions
from PR-12..17 to PR-15..17 and their exact reciprocal relationship fixtures.
Historical deployment evidence must not be rewritten.

## Generated State

After the three pages are added, deterministic generation should report:

- 79 content documents;
- 33 completed topics during Stage A because PR-12 through PR-14 are not
  checked before deployment evidence exists;
- a governed-source count derived from the final approved ledger rather than a
  preselected target.

Stage A publishes the pages while PR-12 through PR-14 remain unchecked in the
backlog. Stage B may check only those three rows after exact deployment and live
review evidence exists.

After Stage B:

- completed topics are exactly 36;
- G007 remains the current durable story;
- durable-story progress remains `6 / 20`;
- G006 remains the most recently completed parent story;
- PR-15 is the next pending principle.

G007 is not checkpointed in this batch.

## Verification and Evidence

The implementation follows the established test-first two-stage delivery:

1. RED content contract;
2. source governance and truthful link observations;
3. PR-12 through PR-14 content and reciprocal relation updates;
4. deterministic generation and complete repository verification;
5. independent code/content review;
6. Stage A exact-SHA deployment;
7. desktop `1440x1000` and mobile `390x844` browser review;
8. page-level and local overflow checks;
9. zero browser warnings and errors;
10. real parent, adjacent, and case/question clicks;
11. visible governed-source label checks;
12. Stage B evidence record, backlog closure, regeneration, review, deployment,
    and HTTP smoke verification.

Stage B evidence must use literal immutable SHA and Pages run values, validate
that the commit resolves, and reject duplicate or contradictory deployment
evidence.

## Stop Conditions

Gate 1 is complete only when the exact workflow-upgrade run succeeds without a
Node 20 deprecation annotation.

Batch 4 is complete only when:

- PR-12 through PR-14 are published, reviewed, deployed, and closed with exact
  evidence;
- PR-15 through PR-17 remain pending and unpublished;
- all targeted and full repository gates pass;
- generated files are deterministic;
- local `main`, `origin/main`, and the retained feature branch agree on the
  final Stage B SHA;
- production `/principles` and PR-12 through PR-14 routes return HTTP 200.
