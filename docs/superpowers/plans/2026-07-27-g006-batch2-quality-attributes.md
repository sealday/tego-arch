# G006 Batch 2 Quality Attributes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish and close QA-04, QA-06, and QA-07 with governed evidence, reciprocal relationships, learning-path integration, deterministic representations, three original raster illustrations, independent review, and two exact Pages deployments while QA-05 remains pending.

**Architecture:** Preserve backlog → validated MDX → source ledger/link cache → generated manifest/index/source/status projections as the only content pipeline. Publish all three mutually adjacent Batch 2 articles and the QA-03 reverse edge in one atomic content task so no generator run sees a dangling Batch 2 relationship. Canonical sources enter only in the task that consumes them; every task ends with a GREEN repository state.

**Tech Stack:** Node.js 24, `node:test`, MDX, Docusaurus 3.10, canonical JSON source ledger/link cache, built-in `imagegen`, GitHub Actions with full history, GitHub Pages.

## Global Constraints

- Start from exact remote/main baseline `4e0b38c790dc4d2e994250cf9c146258d4f5732a`; canonical status is 15 completed topics, 59 documents, 402 governed sources, and G006 current.
- Deliver exactly QA-04, QA-06, and QA-07. QA-05 and QA-08 through QA-10 remain unchecked; G006 remains current.
- Each article uses the exact nine H2 sequence: `学习问题`, `定义与业务目标`, `质量属性场景`, `架构策略`, `测量信号与阈值`, `权衡与失败模式`, `相邻质量属性`, `说明性场景`, `来源`.
- Each article asks 3–5 learning questions, separates source facts from site analysis, includes boundaries/failure modes/non-use conditions, and has an original deterministic table or Mermaid representation independent of its raster.
- Each article has at least two independent governed domains and exactly one eligible remote `manifest_primary: true`; illustration and community-index citations are never manifest primaries.
- GitHub Awesome indexes are `roles: ["learning"]`, `usage_mode: "navigation-only"`, `manifest_primary: false`; they support discovery only and never factual claims.
- New remote records require complete provenance/license fields and reviewed cache entries. Add a record only in the same task as its first document citation.
- Use `illustrating-architecture-articles` and built-in `imagegen`; one original 16:9 PNG per article, with no reference image, logo, watermark, copied composition, invented threshold, or guarantee.
- Generate only with `npm run generate:content`; never hand-edit `src/generated/*.json`.
- Preserve `/tego-arch/`, existing historical evidence, QA-00 through QA-03 closure, and all unrelated source/cache bytes and order.
- TDD stays within each atomic task: write/extend a test, observe RED, implement, run targeted and full GREEN, then commit. No failing test crosses a commit boundary.
- Stage A deploys reviewed implementation while QA-04/06/07 remain unchecked and status stays at 15 topics. Stage B records literal Stage A evidence, checks only those three rows, regenerates 18 topics, and deploys the exact Stage B SHA.
- `.github/workflows/deploy.yml` must retain `actions/checkout` with `fetch-depth: 0`; deployment tests use historical `git cat-file`, so CI requires full history.

## Article, Relationship, and Path Contract

| ID | File | Depends on | Reciprocal adjacency | Terminal cases | Path closure |
| --- | --- | --- | --- | --- | --- |
| QA-04 | `content/quality-attributes/qa-04-scalability-elasticity.mdx` | QA-00, QA-03 | QA-03, QA-06, QA-07 | AWS Cell, Cloudflare Durable Objects | `paths/03-distributed-systems.mdx`, `paths/07-cloud-native-platform.mdx` |
| QA-06 | `content/quality-attributes/qa-06-maintainability-modifiability-testability.mdx` | QA-00, QA-04 | QA-04, QA-07 | Micro Frontends, OpenAI Agents SDK | `paths/02-module-boundaries.mdx` |
| QA-07 | `content/quality-attributes/qa-07-compatibility-interoperability-versioning.mdx` | QA-00, QA-04, QA-06 | QA-04, QA-06 | Google ADK+A2A, Micro Frontends | `paths/10-agent-platform-gateway.mdx` |

- Modify QA-03 adjacency to include QA-04; preserve all existing QA-03 edges and claims.
- QA-04/06/07 must be created before the first `npm run generate:content`; their pairwise reverse edges are asserted in one test and committed together.
- QA-04 distinguishes scalability, elasticity, capacity, scale unit, and repartitioning. QA-06 distinguishes maintainability, modifiability, and testability through a bounded change scenario. QA-07 distinguishes source, wire, and semantic compatibility from interoperability and version migration.

## Source and Count Contract

| Article | Citation | Roles / usage | Primary |
| --- | --- | --- | --- |
| QA-04 | `src-azure-waf-scale-partition` → `https://learn.microsoft.com/en-us/azure/well-architected/performance-efficiency/scale-partition` | `definition, implementation` / `facts-summary` | true |
| QA-04 | `src-google-cloud-waf-elasticity` → `https://docs.cloud.google.com/architecture/framework/performance-optimization/elasticity` | `comparison, implementation` / `facts-summary` | false |
| QA-06 | `src-sei-maintainability-2020` → `https://www.sei.cmu.edu/library/maintainability/` | `definition, method` / `facts-summary` | true |
| QA-06 | existing `src-iso-11f3b103e932` | `definition, comparison` / `facts-summary` | false |
| QA-07 | `src-oas-3-1-1` → `https://spec.openapis.org/oas/v3.1.1.html` | `definition, runtime-fact` / `facts-summary` | true |
| QA-07 | `src-oas-index` → `https://spec.openapis.org/oas/` | `learning` / `facts-summary` | false |
| QA-07 | `src-google-aip-180` → `https://google.aip.dev/180` | `definition, method` / `facts-summary` | false |
| QA-07 | `src-google-aip-185` → `https://google.aip.dev/185` | `learning` / `facts-summary` | false |

All three articles also cite existing `src-github-432a30aa96cb` with `roles: ["learning"]`, `usage_mode: "navigation-only"`, and `manifest_primary: false`; this reuse adds no source count and supports only navigation to original materials. The seven new remote records are all `tier: primary`; three local original-illustration records are also `tier: primary`. Therefore documents become `59 + 3 = 62`; sources progress `402 + 7 = 409`, then `409 + 3 = 412`; tiers progress `368/23/4/7 → 375/23/4/7 → 378/23/4/7`. With page size 20, final primary pages are `ceil(378 / 20) = 19`, so the primary page count remains 19 rather than being guessed.

---

### Task 1: Verify the exact baseline and lock the execution boundary

**Files:**
- Read: `.github/workflows/deploy.yml`
- Read: `docs/content-backlog.md`
- Read: `data/source-ledger.json`

**Interfaces:**
- Produces: an exact clean baseline for every later count and deployment assertion.

- [ ] **Step 1: Verify baseline identity and status**

```bash
git fetch origin main
test "$(git rev-parse origin/main)" = "4e0b38c790dc4d2e994250cf9c146258d4f5732a"
test "$(git rev-parse HEAD)" = "4e0b38c790dc4d2e994250cf9c146258d4f5732a"
test -z "$(git status --short)"
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==15||s.content_documents!==59||s.governed_sources!==402||s.durable_stories.current!=='G006') process.exit(1)"
```

Expected: every command exits 0.

- [ ] **Step 2: Verify full-history CI and source tiers**

```bash
rg -n -U 'actions/checkout@[^\n]+\n[[:space:]]+with:\n[[:space:]]+fetch-depth: 0' .github/workflows/deploy.yml
node --input-type=module -e "import {readFile} from 'node:fs/promises'; const l=JSON.parse(await readFile('data/source-ledger.json')); const c=Object.groupBy(l.sources,s=>s.tier); if(l.sources.length!==402||c.primary.length!==368||c['first-party'].length!==23||c.secondary.length!==4||c.discovery.length!==7) process.exit(1)"
```

Expected: checkout is full-history and tier counts are exactly 368/23/4/7. This read-only task creates no commit.

### Task 2: Publish all three articles, sources, relationships, and paths atomically

**Files:**
- Create: `tests/g006-batch2-content.test.mjs`
- Create: `content/quality-attributes/qa-04-scalability-elasticity.mdx`
- Create: `content/quality-attributes/qa-06-maintainability-modifiability-testability.mdx`
- Create: `content/quality-attributes/qa-07-compatibility-interoperability-versioning.mdx`
- Modify: `content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx`
- Modify: `tests/g006-batch1-content.test.mjs`
- Modify: `content/paths/03-distributed-systems.mdx`, `content/paths/07-cloud-native-platform.mdx`, `content/paths/02-module-boundaries.mdx`, `content/paths/10-agent-platform-gateway.mdx`
- Modify: `data/source-ledger.json`, `data/source-link-health.json`
- Modify: `tests/project-status.test.mjs`, `tests/content-review-health.test.mjs`, `tests/source-ledger-pagination.test.mjs`, `tests/source-ledger-rendering.test.mjs`
- Generate: `src/generated/*.json`

**Interfaces:**
- Produces: three generator-valid articles, seven immediately consumed remote records/cache results, reciprocal graph/path closures, and an intermediate GREEN 15/62/409 projection.

- [ ] **Step 1: Write the content/source RED**

In `tests/g006-batch2-content.test.mjs`, define exact IDs/files/slugs, nine H2s, the relationship table above, seven remote IDs, sole-primary mapping, and affected paths. Use named tests for `articles and deterministic representations`, `reciprocal relationships`, `remote governance`, and `learning paths`. Assert QA-05 remains absent and unchecked; do not assert Batch 2 completion.

```js
const expected = new Map([
  ['QA-04', ['quality-attributes/qa-04-scalability-elasticity.mdx', '/quality-attributes/qa-04']],
  ['QA-06', ['quality-attributes/qa-06-maintainability-modifiability-testability.mdx', '/quality-attributes/qa-06']],
  ['QA-07', ['quality-attributes/qa-07-compatibility-interoperability-versioning.mdx', '/quality-attributes/qa-07']],
]);
const solePrimary = new Map([
  ['QA-04', 'src-azure-waf-scale-partition'],
  ['QA-06', 'src-sei-maintainability-2020'],
  ['QA-07', 'src-oas-3-1-1'],
]);
```

- [ ] **Step 2: Observe RED without committing it**

```bash
node --test tests/g006-batch2-content.test.mjs
```

Expected: FAIL only for absent QA-04/06/07 articles, citations, reciprocal edges, and path links.

- [ ] **Step 3: Register and consume exactly seven remote sources**

Add the seven records from the source contract with literal checked version/date, author, `tier: primary`, allowed roles, license evidence/scope, copyright policy, claim boundary, stable transport, and no adapted source composition. Add article document citations in the same worktree state; each article has the exact sole primary listed above and at least two independent domains. Add the existing Awesome citation to all three articles only as navigation-only learning evidence.

```bash
npm run check:links:live -- --output /tmp/g006-batch2-live-cache.json
```

Merge only the seven literal transport results into `data/source-link-health.json`; never replace the canonical cache wholesale.

- [ ] **Step 4: Write the three articles and close graph/path edges**

QA-04 must include a demand series, capacity/scale-unit table, scale-out/in control loop, partition trigger, bottleneck branch, hysteresis/cooldown boundary, and the warning that elasticity neither creates architectural scalability nor guarantees linear throughput.

QA-06 must include a change scenario with source/stimulus/environment/artifact/response/measure, impacted modules, blast radius, contract tests, verification signal, rollback/containment, and the warning that test coverage percentage alone proves neither maintainability nor safe modifiability.

QA-07 must include a compatibility matrix for old/new source code, wire representation, and semantics; separate protocol interoperability from business compatibility; show additive/deprecate/migrate/remove phases; and state that OAS conformance or matching versions do not guarantee semantic interoperability.

Create all three files before modifying QA-03 and before generation. Add visible reciprocal article links and terminal cases, QA-03 ↔ QA-04, and exact path links in the order described by the contract. Update the QA-03 expectation in `tests/g006-batch1-content.test.mjs` to include QA-04 while preserving every Batch 1 edge.

- [ ] **Step 5: Update intermediate hard-coded counts and generate**

Update real-input expectations to 15 topics, 62 documents, 409 sources. In pagination/rendering tests set tiers to 375/23/4/7, total cards/IDs to 409, and retain primary page count 19 because `ceil(375/20)=19`.

```bash
npm run generate:content
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==15||s.content_documents!==62||s.governed_sources!==409) process.exit(1)"
```

- [ ] **Step 6: Run Task 2 GREEN and commit**

```bash
node --test tests/g006-batch2-content.test.mjs tests/g006-batch1-content.test.mjs tests/learning-path.test.mjs
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-governance-data.test.mjs
node --test tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs
npm run check:links
npm run verify
git diff --check
git add tests/g006-batch2-content.test.mjs tests/g006-batch1-content.test.mjs content/quality-attributes content/paths data/source-ledger.json data/source-link-health.json tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs src/generated
git commit -m "feat: publish g006 quality attributes batch2"
```

Expected: full GREEN at 15/62/409; no dangling relationship, unused new source, or failing count test crosses the commit.

### Task 3: Add three original raster illustrations and final count gates

**Files:**
- Modify: `tests/g006-batch2-content.test.mjs`
- Create: `static/img/illustrations/qa-04-demand-capacity-scaling.png`
- Create: `static/img/illustrations/qa-06-change-blast-radius-verification.png`
- Create: `static/img/illustrations/qa-07-compatibility-version-migration.png`
- Modify: the three Batch 2 MDX files and `data/source-ledger.json`
- Modify: `tests/project-status.test.mjs`, `tests/content-review-health.test.mjs`, `tests/source-ledger-pagination.test.mjs`, `tests/source-ledger-rendering.test.mjs`
- Generate: `src/generated/*.json`

**Interfaces:**
- Produces: one built-in-imagegen PNG and one non-primary illustration citation per article; final Stage A counts 15/62/412 and tiers 378/23/4/7.

- [ ] **Step 1: Extend raster/asset tests and observe RED**

Add a named `raster assets and rights` test asserting exact paths, PNG signature, 16:9 dimensions, meaningful alt/caption, MDX embedding, local illustration records, `roles: ["illustration"]`, `usage_mode: "original-illustration"`, non-empty generation note, and `manifest_primary: false`.

```bash
node --test --test-name-pattern='raster assets and rights' tests/g006-batch2-content.test.mjs
```

Expected: FAIL for the three absent assets and citations.

- [ ] **Step 2: Generate and inspect the QA-04 raster**

Use built-in `imagegen` with no reference image. Brief: simplified-Chinese 16:9 systems map titled `需求、容量与扩展边界`; demand enters measured capacity, then a bounded scale-out/scale-in control loop; scale units lead to a partition/repartition branch; a separate bottleneck/singleton branch caps gains. Show observation delay and cooldown without numeric thresholds. Do not imply autoscaling guarantees demand satisfaction, linear throughput, or successful repartitioning.

- [ ] **Step 3: Generate and inspect the QA-06 raster**

Use built-in `imagegen` with no reference image. Brief: simplified-Chinese 16:9 change-scenario map titled `变化半径必须被验证`; stimulus → changed contract/module → dependency blast radius → targeted tests → runtime verification, with rollback/containment and unverified-impact branches. Distinguish “tests passed” from production verification; no universal coverage threshold or guarantee that smaller modules are automatically maintainable.

- [ ] **Step 4: Generate and inspect the QA-07 raster**

Use built-in `imagegen` with no reference image. Brief: simplified-Chinese 16:9 three-layer compatibility map titled `兼容不只发生在接口形状`; source, wire, and semantic layers each have old/new consumer-provider checks; version flow is add → deprecate → migrate → remove with a breaking-change branch. Show interoperability as an additional protocol/behavior boundary; do not imply shared OAS, transport, or version labels guarantee semantic compatibility.

- [ ] **Step 5: Register illustrations and update final hard-coded counts**

Inspect each original and ~720px render for exact text, topology, crop, overflow, color-independent states, and absence of extra text/logo/watermark. Register three local `tier: primary`, `source_kind: original-illustration` records with `LicenseRef-Atlas-Original`, `original-atlas`, canonical repository evidence URL, factual-claim exclusion, and no remote cache entry.

Update real-input tests from 409 to 412 sources; pagination/rendering tiers from 375 to 378 primary and totals from 409 to 412. Keep 62 documents, 15 topics, other tiers 23/4/7, and primary pages 19 because `ceil(378/20)=19`.

- [ ] **Step 6: Generate, run full GREEN, and commit**

```bash
npm run generate:content
node --test tests/g006-batch2-content.test.mjs tests/project-status.test.mjs tests/content-review-health.test.mjs
node --test tests/source-governance-data.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs
npm run verify
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==15||s.content_documents!==62||s.governed_sources!==412) process.exit(1)"
git diff --check
git add static/img/illustrations/qa-*.png content/quality-attributes/qa-*.mdx data/source-ledger.json tests/g006-batch2-content.test.mjs tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs src/generated
git commit -m "feat: illustrate g006 quality attributes batch2"
```

Expected: all gates PASS at 15/62/412; primary pagination remains exactly 19.

### Task 4: Perform independent review and deploy exact Stage A

**Files:**
- Create: `tests/g006-batch2-review.test.mjs`
- Create: `docs/reviews/g006-batch2.md`

**Interfaces:**
- Produces: independent editorial/fact/copyright/render approval and the exact Stage A commit deployed while Batch 2 rows remain unchecked.

- [ ] **Step 1: Write review gates, review independently, and make them GREEN**

The test requires per-page `editorial`, `fact`, `copyright`, and `render` PASS; reviewer identity distinct from the author; desktop 1440x1000 and mobile 390x844 evidence; exact article/path/source-primary routes; all three PNG routes; zero console warnings/errors; no overflow; deterministic representation legibility; reciprocal links; and copyright/anti-overclaim findings. It does not own backlog completion state, so it remains GREEN after Stage B.

```bash
node --test tests/g006-batch2-review.test.mjs
```

Expected before the review file: RED for missing evidence. Create the literal review report, correct any finding in its owning implementation file, rerun `npm run generate:content` if content changes, then require GREEN.

- [ ] **Step 2: Run Stage A closure and commit**

```bash
node --test tests/g006-batch2-review.test.mjs tests/g006-batch2-content.test.mjs
npm run verify
for id in 04 05 06 07; do rg -n -- "^- \\[ \\] \\*\\*QA-$id " docs/content-backlog.md; done
git diff --check
git add tests/g006-batch2-review.test.mjs docs/reviews/g006-batch2.md content/quality-attributes/qa-*.mdx content/paths data/source-ledger.json data/source-link-health.json static/img/illustrations/qa-*.png src/generated
git commit -m "docs: review g006 quality attributes batch2"
stage_a_sha=$(git rev-parse HEAD)
```

Expected: clean GREEN commit; QA-04/06/07 remain unchecked and generated status is 15/62/412.

- [ ] **Step 3: Deploy exact Stage A and smoke live**

```bash
git push origin HEAD:main
gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --limit 30 --json databaseId,headSha,status,conclusion,url
```

Select only the run whose `headSha` equals `$stage_a_sha`; wait for `completed/success`. Smoke the three articles, four affected paths, three PNGs, `/references/primary/page/19`, CSS/JS assets, desktop/mobile overflow, console, reciprocal navigation, and visible 15/62/412 homepage status. Do not accept a newer run, branch head, or local preview as Stage A evidence.

### Task 5: Close only Batch 2 with literal post-live evidence

**Files:**
- Create: `tests/g006-batch2-deployment.test.mjs`
- Modify: `docs/reviews/g006-batch2.md`, `docs/content-backlog.md`, `tests/project-status.test.mjs`, `tests/g006-batch1-deployment.test.mjs`
- Generate: `src/generated/*.json`

**Interfaces:**
- Produces: literal Stage A SHA/run/live evidence on QA-04/06/07, keeps QA-05 pending, and changes completed topics 15 → 18.

- [ ] **Step 1: Write the deployment-closure RED**

The test extracts one full 40-character Stage A SHA, numeric Pages run ID and matching repository run URL, live date, canonical base, routes/assets/viewports, and exact successful run gate. It uses `git cat-file -e "$sha^{commit}"`, asserts `.github/workflows/deploy.yml` retains `fetch-depth: 0`, requires QA-04/06/07 `[x]` with the same evidence, and requires QA-05 plus QA-08/09/10 `[ ]`.

```bash
node --test tests/g006-batch2-deployment.test.mjs
```

Expected: RED because literal deployment closure and checked Batch 2 rows are absent.

- [ ] **Step 2: Backfill observed evidence and update Stage B status**

Write the observed Stage A SHA, run ID/URL, live date, article/path/PNG/reference routes, viewports, console and overflow results into the review and QA-04/06/07 backlog rows. Check only those three rows. Change only the real-input completed-topic expectation from 15 to 18; keep 62 documents, 412 sources, G006 current, and QA-05 unchecked. Narrow the historical Batch 1 deployment test's future-topic assertion from QA-04..10 to QA-05/08/09/10; the new Batch 2 deployment test now exclusively owns QA-04/06/07 closure.

```bash
npm run generate:content
node --test tests/g006-batch2-deployment.test.mjs tests/g006-batch2-review.test.mjs tests/g006-batch2-content.test.mjs
node --test tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs
npm run verify
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==18||s.content_documents!==62||s.governed_sources!==412||s.durable_stories.current!=='G006') process.exit(1)"
git diff --check
git add tests/g006-batch2-deployment.test.mjs tests/g006-batch1-deployment.test.mjs tests/project-status.test.mjs docs/content-backlog.md docs/reviews/g006-batch2.md src/generated
git commit -m "docs: record g006 batch2 deployment"
stage_b_sha=$(git rev-parse HEAD)
```

Expected: Stage B commit is fully GREEN at 18/62/412 with QA-05 pending.

- [ ] **Step 3: Deploy and verify exact Stage B**

```bash
git push origin HEAD:main
gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --limit 30 --json databaseId,headSha,status,conclusion,url
```

Select only `headSha=$stage_b_sha`; wait for `completed/success`. Repeat all canonical route/asset/viewports/console/overflow checks and confirm homepage status 18/62/412, G006 current, QA-04/06/07 checked, QA-05 unchecked, and `/references/primary/page/19` present with no page 20.

- [ ] **Step 4: Final full-history and cleanliness proof**

```bash
git cat-file -e "${stage_a_sha}^{commit}"
git cat-file -e "${stage_b_sha}^{commit}"
npm run verify
git diff --check
test -z "$(git status --short)"
```

Expected: both deployment commits are available from full history, all tests/build gates pass, and the tree is clean.
