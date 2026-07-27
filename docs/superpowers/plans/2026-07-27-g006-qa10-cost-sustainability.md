# G006 QA-10 Cost Efficiency and Sustainability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish QA-10, close the final G006 quality-attribute topic, and preserve the repository's governed content, review, and deployment evidence model.

**Architecture:** Keep the existing backlog → MDX → source ledger/link cache → generated manifest/index/status pipeline. QA-10 treats cost efficiency as value or useful work per bounded cost and sustainability as a wider resource/environmental constraint; neither is reduced to a cloud bill, utilization percentage, or carbon estimate. The article links reciprocally to QA-03, QA-04, QA-06, and QA-08 and closes through the production-governance and Agent-platform learning paths.

**Tech Stack:** Node.js 24, `node:test`, MDX, Docusaurus 3.10, canonical JSON source governance, deterministic Mermaid/table representations, PNG illustration, GitHub Pages.

## Global Constraints

- Start from clean `origin/main` SHA `57c9466b` and preserve all G006 Batch 1–3 evidence.
- Deliver only QA-10 and the reciprocal/path/source/status changes needed to close G006.
- Use the existing nine-H2 quality-attribute contract and six explicit scenario fields.
- Require two independent governed remote domains and exactly one eligible `manifest_primary` citation.
- Separate financial cost, useful work, demand, allocation, embodied/operational effects, and externalities; do not claim that lower spend, higher utilization, migration to cloud, or one carbon score proves sustainability.
- Generate `src/generated/*.json` only with `npm run generate:content`.
- Use TDD: content tests fail before article/source/relationship implementation.
- Stage A publishes reviewed implementation while QA-10 remains unchecked. Stage B records immutable Stage A evidence, checks QA-10, closes G006, regenerates status, and deploys the exact closure SHA.

---

### Task 1: Lock the QA-10 content contract

**Files:**
- Create: `tests/g006-qa10-content.test.mjs`
- Modify later: QA-03/04/06/08 reciprocal content

**Interfaces:**
- Produces: exact metadata, headings, scenario, source, anti-overclaim, reciprocal relationship, path, and status assertions.

- [ ] Write tests requiring `content/quality-attributes/qa-10-cost-efficiency-sustainability.mdx`, slug `/quality-attributes/qa-10`, dependencies QA-00/01, adjacency QA-03/04/06/08, terminal LiteLLM and AWS Cell cases, and the canonical nine H2 headings.
- [ ] Require explicit useful-work/cost scope, allocation, unit economics, demand avoidance, operational/embodied boundary, rebound risk, and non-use conditions.
- [ ] Require one deterministic Mermaid/table representation, one raster path, two independent source domains, and exactly one manifest primary.
- [ ] Run `node --test tests/g006-qa10-content.test.mjs`; expect failure because QA-10 is absent.

### Task 2: Publish QA-10 atomically

**Files:**
- Create: `content/quality-attributes/qa-10-cost-efficiency-sustainability.mdx`
- Create: `static/img/illustrations/qa-10-value-cost-sustainability-boundaries.png`
- Modify: `content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx`
- Modify: `content/quality-attributes/qa-04-scalability-elasticity.mdx`
- Modify: `content/quality-attributes/qa-06-maintainability-modifiability-testability.mdx`
- Modify: `content/quality-attributes/qa-08-operability-observability.mdx`
- Modify: `content/paths/05-production-governance.mdx`
- Modify: `content/paths/10-agent-platform-gateway.mdx`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Generate: `src/generated/*.json`

**Interfaces:**
- Consumes: Task 1 contract.
- Produces: generator-valid QA-10 and reciprocal visible graph/path closure.

- [ ] Register FinOps unit-economics and Green Software Foundation SCI sources with conservative copyright and claim boundaries; add current reviewed link observations.
- [ ] Write the nine-section article with all six H3 scenario fields, an original allocation table, and a deterministic feedback loop.
- [ ] Add visible reciprocal links without deleting existing edges.
- [ ] Create an original 16:9 PNG whose composition is independent of external sources and register it as an Atlas original illustration.
- [ ] Run `npm run generate:content` and targeted tests; expect all targeted tests to pass.
- [ ] Commit the reviewed implementation as Stage A.

### Task 3: Review, verify, and close G006

**Files:**
- Create: `docs/reviews/g006-qa10.md`
- Create: `tests/g006-qa10-review.test.mjs`
- Create: `tests/g006-qa10-deployment.test.mjs`
- Modify after Stage A deployment: `docs/content-backlog.md`
- Generate: `src/generated/project-status.json`, topic projections

**Interfaces:**
- Consumes: immutable Stage A SHA, successful Pages run ID, live route observations.
- Produces: QA-10 checked with exact evidence and G006 complete/G007 current status.

- [ ] Record independent editorial, factual, copyright, desktop/mobile render, link, source-card, CSS/JS, console, overflow, and anti-overclaim review evidence.
- [ ] Push Stage A, wait for the exact successful Pages run, and smoke-test the QA-10, path, source-card, and PNG routes.
- [ ] Write deployment tests against literal SHA/run/date evidence and observe RED while QA-10 remains unchecked.
- [ ] Check only QA-10 in the backlog with exact evidence; update the durable story projection to G006 complete and G007 current through the canonical source, then regenerate.
- [ ] Run targeted tests, `npm run verify`, and `git diff --check`; all must pass.
- [ ] Commit and push Stage B, verify the exact closure Pages run and live homepage/status route.
