# G006 Batch 1 Quality Attributes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish and close QA-00 through QA-03 as the first G006 quality-attribute batch, with governed evidence, three original raster illustrations, reciprocal relationships, learning-path integration, independent review, and two-stage Pages evidence.

**Architecture:** Preserve backlog → validated MDX → source ledger → generated manifest/index/source projection as the only content pipeline. QA-00, QA-02, and QA-03 are new articles; QA-01 is deliberately revised, so its G005 immutable hash changes once while all unrelated preservation hashes remain fixed.

**Tech Stack:** Node.js 24, `node:test`, MDX, Docusaurus 3.10, canonical JSON source ledger/link cache, built-in image generation, GitHub Actions, GitHub Pages.

## Global Constraints

- `docs/content-backlog.md` remains the only human-written task-status source.
- Deliver exactly `QA-00`, `QA-01`, `QA-02`, and `QA-03`; later G006 batches own QA-04 through QA-10.
- Every article uses the exact nine H2 sequence: `学习问题`, `定义与业务目标`, `质量属性场景`, `架构策略`, `测量信号与阈值`, `权衡与失败模式`, `相邻质量属性`, `说明性场景`, `来源`.
- QA-01 retains exactly six H3 fields under `质量属性场景`: `Source`, `Stimulus`, `Environment`, `Artifact`, `Response`, `Response measure`.
- Every article asks 3–5 learning questions, distinguishes facts/inference/site analysis, includes a boundary, failure mode, non-use condition, original precise representation, and at least two independent governed domains with one eligible manifest primary.
- Generate artifacts only with `npm run generate:content`; never hand-edit `src/generated/*.json`.
- Use `illustrating-architecture-articles` plus required `imagegen` for raster work; generated images never replace exact prose, tables, or Mermaid.
- New remote sources require complete license fields and reviewed `data/source-link-health.json` entries; original local illustrations use `LicenseRef-Atlas-Original`, `original-atlas`, and no remote cache entry.
- No new dependencies, no custom domain, and no changes to the canonical `/tego-arch/` base.
- All implementation follows RED → observed failure → minimal GREEN → targeted regression → commit.
- Stage A deploys implementation/review while QA-00 through QA-03 remain unchecked; Stage B adds a deployment-closure RED, records literal Stage A SHA/run/live evidence, checks the four rows, and regenerates status.
- G006 remains current after Batch 1; do not run `omx ultragoal checkpoint`.

## Article Contract

| ID | File | Learning questions |
| --- | --- | --- |
| QA-00 | `content/quality-attributes/qa-00-overview.mdx` | How does ISO/IEC 25010:2023 organize product quality? Why are quality models not priority lists? Where do operability, observability, cost, and sustainability enter Tego Arch analysis? |
| QA-01 | `content/quality-attributes/qa-01-scenario-writing.mdx` | How do six fields remove ambiguity? How do response and response measure differ? How does a threshold trace to a business need? |
| QA-02 | `content/quality-attributes/qa-02-reliability-availability-recoverability.mdx` | How do fault and failure differ? How do availability and recoverability constrain different windows? How do RTO, RPO, and unknown outcomes expose recovery boundaries? |
| QA-03 | `content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx` | Why is an average insufficient? How do latency, throughput, concurrency, and capacity interact? How do tail latency and saturation reveal overload before collapse? |

## Relationships and Paths

| ID | Depends on | Reciprocal adjacency | Terminal cases |
| --- | --- | --- | --- |
| QA-00 | FND-02 | QA-01, QA-02, QA-03 | `/cases/microsoft-multi-agent-reference-architecture` |
| QA-01 | FND-02, QA-00 | QA-00, QA-02 | `/cases/aws-cell-shuffle-sharding` |
| QA-02 | QA-00, QA-01 | QA-00, QA-01, QA-03 | `/cases/aws-cell-shuffle-sharding`, `/cases/temporal-saga-durable-execution` |
| QA-03 | QA-00, QA-01 | QA-00, QA-02 | `/cases/apache-kafka-consumer-groups`, `/cases/cloudflare-durable-objects-workerd` |

- `content/paths/01-architecture-thinking.mdx`: replace the QA-00 gap language with QA-00 → QA-01.
- `content/paths/04-reliability-state.mdx`: add QA-02 before reliability tactics/cases.
- `content/paths/03-distributed-systems.mdx`: add QA-03 before throughput/backpressure cases.
- Delete the now-published QA-00 override from `data/topic-relations.json`; published front matter becomes authoritative.

---

### Task 1: Lock Batch 1 with RED tests

**Files:**
- Create: `tests/g006-batch1-content.test.mjs`
- Modify: `tests/g005-batch3-content.test.mjs`

**Interfaces:**
- Consumes: `readContentDocuments`, `findMarkdownHeadings`, canonical backlog/ledger/generated manifest.
- Produces: exact four-topic metadata, structure, relationship, evidence, image, and path gates; it does not assert backlog completion before deployment.

- [ ] **Step 1: Create the failing Batch 1 test**

Define:

```js
const expected = new Map([
  ['QA-00', ['quality-attributes/qa-00-overview.mdx', '/quality-attributes/qa-00']],
  ['QA-01', ['quality-attributes/qa-01-scenario-writing.mdx', '/quality-attributes/qa-01']],
  ['QA-02', ['quality-attributes/qa-02-reliability-availability-recoverability.mdx', '/quality-attributes/qa-02']],
  ['QA-03', ['quality-attributes/qa-03-performance-latency-throughput-capacity.mdx', '/quality-attributes/qa-03']],
]);
const h2 = [
  '学习问题', '定义与业务目标', '质量属性场景', '架构策略',
  '测量信号与阈值', '权衡与失败模式', '相邻质量属性', '说明性场景', '来源',
];
const images = new Map([
  ['QA-00', '/img/illustrations/qa-00-quality-model-boundaries.png'],
  ['QA-02', '/img/illustrations/qa-02-failure-recovery-boundaries.png'],
  ['QA-03', '/img/illustrations/qa-03-load-saturation-boundaries.png'],
]);
```

Assert exact files/slugs, `content_type: quality-attribute`, `priority: P0`, `review_policy: quarterly-version-sensitive`, exact nine H2, 3–5 questions, the relationship table above, visible parent/adjacent/case links, exact image paths, governed illustration citations, two independent domains, one eligible primary, and all three path links. Do not inspect QA backlog checkbox state in this content test.

- [ ] **Step 2: Add the QA-01 deliberate-hash RED**

In `tests/g005-batch3-content.test.mjs`, isolate QA-01 from `immutableFiles`, retain every other immutable hash, and set:

```js
const preBatchQa01Hash =
  'd95a8299ed2b25e51007c0f0970b2d95698051e079e146da36c1c77d4612df2b';
```

This pre-batch hash must pass before editing QA-01, fail after the deliberate revision, and then be replaced once with the literal reviewed SHA-256 emitted by:

```bash
shasum -a 256 content/quality-attributes/qa-01-scenario-writing.mdx
```

No other preservation hash may change.

- [ ] **Step 3: Observe RED**

```bash
node --test tests/g006-batch1-content.test.mjs tests/g005-batch3-content.test.mjs
```

Expected: FAIL because QA-00/02/03, their images, reciprocal graph, paths, and governed citations do not exist; the pre-batch QA-01 hash assertion itself is initially PASS.

- [ ] **Step 4: Commit RED**

```bash
git add tests/g006-batch1-content.test.mjs tests/g005-batch3-content.test.mjs
git commit -m "test: define g006 quality attribute batch1"
```

### Task 2: Govern the evidence set before writing claims

**Files:**
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`

**Interfaces:**
- Reuses: `src-iso-11f3b103e932`, `src-sei-0547756e19ba`, `src-sre-6c547d0b7e0e`.
- Adds: source records for SEI Quality Attributes and the exact Google SRE chapters cited by QA-02/03.

- [ ] **Step 1: Register the researched locators**

Add complete records for:

```text
https://www.sei.cmu.edu/library/quality-attributes/
https://sre.google/sre-book/availability-table/
https://sre.google/sre-book/addressing-cascading-failures/
https://sre.google/sre-book/monitoring-distributed-systems/
https://sre.google/sre-book/handling-overload/
```

Use facts-summary only; do not copy ISO tables, SEI prose, SRE diagrams, or source composition. Record checked version/date, author, tier, evidence roles, exact license evidence/scope, copyright policy, usage boundary, and expected final transport. Use distinct stable `src-sei-quality-attributes-*` / `src-sre-*` IDs following existing ledger conventions.

- [ ] **Step 2: Add reviewed cache entries**

Generate a complete temporary live result with the existing CLI, then extract and merge only the five new transport entries into `data/source-link-health.json`. Preserve every pre-existing canonical cache entry and its bytes/order.

```bash
npm run check:links:live -- --output /tmp/g006-live-cache.json
```

Expected: the temporary file covers the complete canonical ledger. Copy the literal results whose `transport_locator` equals one of the five locators above; do not replace the canonical cache wholesale. Each new transport has one policy-compatible reviewed result, and auth/redirect facts remain literal.

- [ ] **Step 3: Validate governance**

```bash
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs
npm run check:links
```

Expected: PASS with no missing, duplicate, stale, or policy-incompatible transport.

- [ ] **Step 4: Commit evidence inputs**

```bash
git add data/source-ledger.json data/source-link-health.json
git commit -m "data: govern g006 quality attribute sources"
```

### Task 3: Write QA-00 and revise QA-01

**Files:**
- Create: `content/quality-attributes/qa-00-overview.mdx`
- Modify: `content/quality-attributes/qa-01-scenario-writing.mdx`
- Modify: `data/topic-relations.json`
- Modify: `content/paths/01-architecture-thinking.mdx`

**Interfaces:**
- Produces: QA-00 model boundary and a reciprocal QA-00 ↔ QA-01 ↔ QA-02 graph.
- Preserves: QA-01 six-field scenario and all source-backed boundary wording.

- [ ] **Step 1: Write both articles to the contract**

QA-00 must treat ISO/IEC 25010:2023 as a naming/index boundary, not a copied taxonomy or universal priority order; separate product qualities from Tego Arch operational analysis lenses. QA-01 must retain the six H3 fields, add visible QA-00/QA-02 links, and explain scenario → tactic → signal without claiming that a percentage alone is a scenario.

- [ ] **Step 2: Close the path gap and relation override**

Delete only `QA-00` from `data/topic-relations.json`. In `content/paths/01-architecture-thinking.mdx`, replace both “QA-00 gap” statements and add QA-00 before QA-01 in the order/checkpoint.

- [ ] **Step 3: Run focused content tests**

```bash
node --test tests/g006-batch1-content.test.mjs tests/content-validation.test.mjs tests/content-relations.test.mjs
npm run validate:content
```

After editing QA-01, run `node --test tests/g005-batch3-content.test.mjs` once and observe the old literal hash FAIL while its semantic/schema assertions remain PASS. Remaining Batch 1 failures refer only to QA-02/03 and raster registration.

- [ ] **Step 4: Commit**

```bash
git add content/quality-attributes/qa-00-overview.mdx content/quality-attributes/qa-01-scenario-writing.mdx data/topic-relations.json content/paths/01-architecture-thinking.mdx
git commit -m "feat: publish quality model and scenario foundation"
```

### Task 4: Write QA-02 and QA-03

**Files:**
- Create: `content/quality-attributes/qa-02-reliability-availability-recoverability.mdx`
- Create: `content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx`
- Modify: `content/paths/04-reliability-state.mdx`
- Modify: `content/paths/03-distributed-systems.mdx`

**Interfaces:**
- Produces: fault/failure/recovery/data-loss boundaries and load/latency/throughput/capacity/saturation boundaries.

- [ ] **Step 1: Write QA-02**

Use one original scenario that names source, stimulus, environment, artifact, response, and measure in prose/table. Distinguish fault from externally visible failure, availability from recovery, RTO from RPO, and automated recovery from unknown business outcomes requiring reconciliation or human terminal state.

- [ ] **Step 2: Write QA-03**

Use one original scenario with workload shape, concurrency, service time, throughput, p50/p95/p99 latency, utilization, queue depth, rejection, and saturation. State that averages hide tails, throughput without offered load is incomplete, and capacity is a bounded operating envelope rather than a single benchmark maximum.

- [ ] **Step 3: Add paths and run focused tests**

```bash
node --test tests/g006-batch1-content.test.mjs tests/learning-path.test.mjs
npm run validate:content
```

Expected: article/path assertions PASS; raster and illustration-ledger gates remain RED. The deliberate QA-01 old-hash failure remains until Task 6 pins the reviewed bytes.

- [ ] **Step 4: Commit**

```bash
git add content/quality-attributes/qa-02-reliability-availability-recoverability.mdx content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx content/paths/04-reliability-state.mdx content/paths/03-distributed-systems.mdx
git commit -m "feat: publish reliability and performance attributes"
```

### Task 5: Generate and integrate three original raster illustrations

**Files:**
- Create: `static/img/illustrations/qa-00-quality-model-boundaries.png`
- Create: `static/img/illustrations/qa-02-failure-recovery-boundaries.png`
- Create: `static/img/illustrations/qa-03-load-saturation-boundaries.png`
- Modify: the three corresponding MDX files
- Modify: `data/source-ledger.json`

**Interfaces:**
- Produces: three local original-illustration records and document citations with `roles: ["illustration"]`.

- [ ] **Step 1: Generate QA-00 visual**

Brief: reader judgment “质量模型命名关注点，业务场景决定优先级”; comparison board; center has `产品质量模型`, surrounding groups `功能适合性`, `性能效率`, `兼容性`, `交互能力`, `可靠性`, `安全性`, `维护性`, `灵活性`, `安全保障`; lower separate lens band `可操作性`, `可观测性`, `成本`, `可持续性`; dashed boundary separates ISO-index facts from Tego Arch lenses. Closed title `质量属性不是优先级清单`. No ISO logo/table recreation.

- [ ] **Step 2: Generate QA-02 visual**

Brief: reader judgment “恢复成功必须同时满足服务、时间和数据边界”; state/recovery map; nodes `正常`, `故障`, `失效`, `隔离`, `恢复`, `核对`, `人工终态`; edges normal→fault→failure, failure→isolate→recover, recover→normal only after verification, unknown outcome→reconcile→human terminal. Boundaries `RTO` and `RPO`; title `从故障到可验证恢复`.

- [ ] **Step 3: Generate QA-03 visual**

Brief: reader judgment “负载越过容量拐点后，尾延迟和队列先于吞吐崩溃”; layered load/saturation flow; nodes `请求负载`, `并发`, `服务时间`, `队列`, `吞吐`, `p50`, `p99`, `拒绝`, `饱和`; normal blue path, orange knee, red overload branch; title `容量边界不是平均延迟`. No invented numeric thresholds.

- [ ] **Step 4: Perform visual QA and register**

For each 16:9 PNG inspect original size and ~720px width: exact simplified Chinese, no extra text, correct topology, color-independent states, no unsupported guarantee, no crop, no logo/person/signature/watermark/copied composition. Embed purpose-oriented alt text and caption beside an exact table/Mermaid representation.

Add three ledger sources with local locator, `source_kind: original-illustration`, illustration-only role, `LicenseRef-Atlas-Original`, `copyright_policy: original-atlas`, canonical GitHub evidence URL, and factual-claim exclusion. Add article citations with `usage_mode: original-illustration` and non-empty project-specific generation notes.

- [ ] **Step 5: Validate and commit**

```bash
node --test tests/g006-batch1-content.test.mjs tests/source-governance-data.test.mjs
npm run validate:content
git add static/img/illustrations/qa-*.png content/quality-attributes/qa-00-overview.mdx content/quality-attributes/qa-02-reliability-availability-recoverability.mdx content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx data/source-ledger.json
git commit -m "feat: illustrate g006 quality attribute boundaries"
```

Expected: image existence, dimensions, MDX embedding, rights, and ledger gates PASS.

### Task 6: Complete the Stage A implementation without closing backlog rows

**Files:**
- Modify: `tests/g005-batch3-content.test.mjs`
- Generate: `src/generated/*.json`

**Interfaces:**
- Produces: reviewed QA-01 hash and fresh generated manifest/index/source/status projections while all four QA backlog rows remain unchecked.

- [ ] **Step 1: Pin the intentional QA-01 hash after observing RED**

First run the preservation test against the revised article and retain its old-hash failure output:

```bash
node --test tests/g005-batch3-content.test.mjs
```

Expected: FAIL only because QA-01 no longer equals `d95a8299ed2b25e51007c0f0970b2d95698051e079e146da36c1c77d4612df2b`; semantic QA-01 assertions and every unrelated immutable hash PASS.

Then calculate the reviewed bytes:

```bash
qa01_hash=$(shasum -a 256 content/quality-attributes/qa-01-scenario-writing.mdx | awk '{print $1}')
printf '%s\n' "$qa01_hash"
```

Replace only the old QA-01 literal with `$qa01_hash`, rerun the test GREEN, and retain all semantic assertions so the hash update cannot conceal content-contract regression.

- [ ] **Step 2: Generate and run full Stage A verification**

```bash
npm run generate:content
node --test tests/g006-batch1-content.test.mjs tests/g005-batch3-content.test.mjs
npm run verify
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==11||s.content_documents!==59||s.governed_sources!==402) process.exit(1)"
git diff --check
test ! -e src/generated/.content-platform-stage
```

Expected: all gates PASS; QA-00 through QA-03 are still `[ ]`; generated project status is exactly 11 completed topics, 59 content documents, and 402 governed sources (394 baseline + 5 remote + 3 illustrations).

- [ ] **Step 3: Commit implementation closure**

```bash
git add tests/g005-batch3-content.test.mjs src/generated
git commit -m "feat: complete g006 quality attributes batch1"
```

### Task 7: Independent review and two-stage publication

**Files:**
- Create: `docs/reviews/g006-batch1.md`
- Create in Stage B: `tests/g006-batch1-deployment.test.mjs`
- Modify in Stage B: `docs/content-backlog.md`, `docs/reviews/g006-batch1.md`
- Generate in Stage B: `src/generated/*.json`

**Interfaces:**
- Produces: editorial/factual/copyright/render approval and exact Stage A deployment evidence.

- [ ] **Step 1: Run independent review**

Require per-page visible `editorial`, `fact`, `copyright`, and `render` PASS; inspect desktop 1440x1000 and mobile 390x844; verify the three raster images at article width, no overflow, console warning/error=0, reciprocal links, paths, source pages, and `/references/primary/page/<final>`.

- [ ] **Step 2: Record and commit review**

```bash
git add docs/reviews/g006-batch1.md
git commit -m "docs: review g006 quality attributes batch1"
stage_a_sha=$(git rev-parse HEAD)
```

- [ ] **Step 3: Deploy Stage A**

```bash
git push origin HEAD:main
gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --limit 30 --json databaseId,headSha,status,conclusion,url
```

Select the run whose `headSha` exactly equals `$stage_a_sha`, watch it to `completed/success`, then smoke `/quality-attributes/qa-00` through `/qa-03`, all three PNGs, the three affected paths, CSS/JS, desktop/mobile overflow, console, and reciprocal navigation.

- [ ] **Step 4: Add the Stage B deployment-closure RED**

After the successful Stage A live smoke, create `tests/g006-batch1-deployment.test.mjs`. It must extract the full 40-character Stage A SHA, numeric Pages run ID, matching run URL, and live date from `docs/reviews/g006-batch1.md`; assert the SHA names a local commit; reject `pending`/template evidence; and require every QA-00 through QA-03 backlog row to be `[x]` and contain that extracted SHA, run ID/URL, and its canonical live route.

```bash
node --test tests/g006-batch1-deployment.test.mjs
```

Expected: RED because the review has no literal deployment closure and all four backlog rows remain unchecked.

- [ ] **Step 5: Backfill evidence, check rows, and regenerate Stage B**

Write the observed literal Stage A SHA, Pages run ID/URL, live date/routes/assets/viewports into `docs/reviews/g006-batch1.md` and the four QA rows, then change only QA-00 through QA-03 to `[x]`. Keep G006 current and QA-04 through QA-10 unchecked.

```bash
npm run generate:content
node --test tests/g006-batch1-deployment.test.mjs tests/g006-batch1-content.test.mjs
npm run check:content
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==15||s.content_documents!==59||s.governed_sources!==402) process.exit(1)"
git diff --check
git add tests/g006-batch1-deployment.test.mjs docs/content-backlog.md docs/reviews/g006-batch1.md src/generated
git commit -m "docs: record g006 quality attributes deployment"
git push origin HEAD:main
```

Expected: deployment-closure test GREEN from actual observed evidence; generated status is exactly 15 completed topics, 59 documents, and 402 sources.

- [ ] **Step 6: Verify Stage B**

Wait for the exact Stage B SHA to reach Pages `completed/success`; repeat canonical live smoke and finish with:

```bash
npm run verify
git status --short
```

Expected: PASS and clean tree; G006 remains current, with no `omx ultragoal checkpoint`.
