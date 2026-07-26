# G006 Batch 3 Security, Operability, and Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish and close QA-05, QA-08, and QA-09 with governed official evidence, reciprocal relationships, learning-path integration, deterministic representations, three original raster illustrations, independent review, and two exact Pages deployments while QA-10 remains pending.

**Architecture:** Preserve backlog → validated MDX → source ledger/link cache → generated manifest/index/source/status projections as the only content pipeline. Publish all three mutually related articles and every reverse edge in one atomic content task so no generator run observes a dangling relationship. Treat Security, operability/observability, and Safety as distinct system qualities with explicit overlap boundaries; Awesome repositories remain discovery-only navigation.

**Tech Stack:** Node.js 24, `node:test`, MDX, Docusaurus 3.10, canonical JSON source ledger/link cache, built-in `imagegen`, GitHub Actions with full history, GitHub Pages.

## Global Constraints

- Start from exact remote/main baseline `00a63aaf2c1569fd2b0a86b9e90d6a262553700f`; canonical status is 18 completed topics, 62 documents, 412 governed sources, and G006 current.
- Deliver exactly QA-05, QA-08, and QA-09. QA-10 remains unchecked and G006 remains current.
- Each article uses the exact nine H2 sequence: `学习问题`, `定义与业务目标`, `质量属性场景`, `架构策略`, `测量信号与阈值`, `权衡与失败模式`, `相邻质量属性`, `说明性场景`, `来源`.
- Each article asks 3–5 learning questions, separates source facts from site analysis, includes boundaries/failure modes/non-use conditions, and has an original deterministic table or Mermaid representation independent of its raster.
- Each article has at least two independent governed domains and exactly one eligible remote `manifest_primary: true`; illustration and community-index citations are never manifest primaries.
- GitHub Awesome indexes, including `mehdihadeli/awesome-software-architecture`, remain `roles: ["learning"]`, `usage_mode: "navigation-only"`, `manifest_primary: false`; they support discovery only and never factual claims. Correct existing `src-github-432a30aa96cb` from its overly narrow Micro-Frontend title/usage boundary to a repository-wide architecture-learning boundary before reusing it.
- Add exactly six remote records, each in the same task as its first citation. Every record requires complete provenance, version/date, copyright/license boundary, claim boundary, stable transport, and a reviewed link-health entry.
- Reuse existing OWASP Threat Modeling and Google SRE monitoring sources; do not duplicate them under new IDs.
- Use `illustrating-architecture-articles` and built-in `imagegen`; one original 16:9 PNG per article, with no reference image, logo, watermark, copied composition, invented universal threshold, certification claim, or guarantee.
- Generate only with `npm run generate:content`; never hand-edit `src/generated/*.json`.
- Preserve `/tego-arch/`, historical deployment evidence, QA-00 through QA-07 closure, and all unrelated source/cache bytes and order.
- TDD stays within each atomic task: write/extend a test, observe RED, implement, run targeted and full GREEN, then commit. No failing test crosses a commit boundary.
- Stage A deploys reviewed implementation while QA-05/08/09 remain unchecked and status stays at 18 topics. Stage B records literal Stage A evidence, checks only those three rows, regenerates 21 topics, and deploys the exact Stage B SHA.
- `.github/workflows/deploy.yml` must retain `actions/checkout` with `fetch-depth: 0`; deployment tests use historical `git cat-file`, so CI requires full history.

## Article, Relationship, and Path Contract

| ID | File | Depends on | Reciprocal adjacency | Terminal cases | Path closure |
| --- | --- | --- | --- | --- | --- |
| QA-05 | `content/quality-attributes/qa-05-security-privacy-trust.mdx` | QA-00, QA-01 | QA-07, QA-08, QA-09 | Microsoft Multi-Agent Reference Architecture, Cloudflare Durable Objects | `paths/05-production-governance.mdx`, `paths/10-agent-platform-gateway.mdx` |
| QA-08 | `content/quality-attributes/qa-08-operability-observability.mdx` | QA-00, QA-02, QA-04 | QA-02, QA-04, QA-05, QA-09 | AWS Cell, OpenAI Agents SDK | `paths/05-production-governance.mdx`, `paths/07-cloud-native-platform.mdx`, `paths/10-agent-platform-gateway.mdx` |
| QA-09 | `content/quality-attributes/qa-09-safety-physical-risk.mdx` | QA-00, QA-02 | QA-05, QA-08 | KubeEdge Cloud-Edge Autonomy | `paths/09-edge-physical-agents.mdx` |

- Modify QA-02 adjacency to include QA-08, QA-04 adjacency to include QA-08, and QA-07 adjacency to include QA-05. Preserve every existing edge and claim.
- QA-05/08/09 must be created before the first `npm run generate:content`; their pairwise reverse edges and the three existing reverse edges are asserted and committed together.
- QA-05 teaches assets, subjects, data flows, trust-boundary assumption changes, threat/privacy purpose and minimization; it does not equate network location, encryption, consent, or compliance with Security or privacy proof.
- QA-08 distinguishes monitoring, observability, and the site's bounded operability definition, then teaches signal → diagnosis → controlled action → user-visible recovery → learning with explicit responsibility.
- QA-09 distinguishes Safety from Security and reliability, then teaches loss → hazard → control structure → unsafe control action → constraint → residual-risk acceptance and operational re-evaluation.

## Source and Count Contract

| Article | Citation | Source tier | Roles / usage | Manifest primary |
| --- | --- | --- | --- | --- |
| QA-05 | `src-nist-sp800-160v1r1` → `https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final` | primary | `definition, method` / `facts-summary` | true |
| QA-05 | `src-nist-privacy-framework-1` → `https://doi.org/10.6028/NIST.CSWP.01162020` | primary | `definition, method, learning` / `facts-summary` | false |
| QA-05 | existing `src-cheatsheetseries-ea079221bd09` | primary | `method, learning` / `facts-summary` | false |
| QA-08 | `src-opentelemetry-observability-primer` → `https://opentelemetry.io/docs/concepts/observability-primer/` | primary | `definition, learning` / `facts-summary` | true |
| QA-08 | `src-sre-managing-incidents` → `https://sre.google/sre-book/managing-incidents/` | primary | `method, learning` / `facts-summary` | false |
| QA-08 | existing `src-sre-monitoring-distributed-systems` | primary | `definition, method` / `facts-summary` | false |
| QA-09 | `src-faa-order-8040-4c` → `https://www.faa.gov/documentLibrary/media/Order/FAA_Order_8040.4C.pdf` | primary | `definition, method` / `facts-summary` | true |
| QA-09 | `src-stpa-handbook-2018` → `https://psas.scripts.mit.edu/home/get_file.php?name=STPA_handbook.pdf` | primary | `definition, method, learning` / `facts-summary` | false |
| QA-09 | reuse `src-nist-sp800-160v1r1` | primary | `comparison, learning` / `facts-summary` | false |

All three articles also cite existing `src-github-432a30aa96cb` only as navigation-only learning evidence after its title and usage boundary are corrected to describe the full Awesome Software Architecture repository. This discovery record adds no count. The six new remote records are primary tier; three local original-illustration records are also primary tier. Therefore documents become `62 + 3 = 65`; sources progress `412 + 6 = 418`, then `418 + 3 = 421`; tiers progress `376/25/4/7 → 382/25/4/7 → 385/25/4/7`. With page size 20, primary pages change from 19 to `ceil(385 / 20) = 20`; first-party pages stay `ceil(25 / 20) = 2`.

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
test "$(git rev-parse origin/main)" = "00a63aaf2c1569fd2b0a86b9e90d6a262553700f"
test "$(git merge-base HEAD origin/main)" = "00a63aaf2c1569fd2b0a86b9e90d6a262553700f"
test -z "$(git status --short)"
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==18||s.content_documents!==62||s.governed_sources!==412||s.durable_stories.current!=='G006') process.exit(1)"
```

Expected: every command exits 0; local HEAD may include approved plan commits descended from the exact remote/main baseline.

- [ ] **Step 2: Verify full-history CI and source tiers**

```bash
rg -n -U 'actions/checkout@[^\n]+\n[[:space:]]+with:\n[[:space:]]+fetch-depth: 0' .github/workflows/deploy.yml
node --input-type=module -e "import {readFile} from 'node:fs/promises'; const l=JSON.parse(await readFile('data/source-ledger.json')); const c=Object.groupBy(l.sources,s=>s.tier); if(l.sources.length!==412||c.primary.length!==376||c['first-party'].length!==25||c.secondary.length!==4||c.discovery.length!==7) process.exit(1)"
```

Expected: checkout is full-history and tier counts are exactly 376/25/4/7. This task creates no commit.

### Task 2: Publish all three articles, sources, relationships, and paths atomically

**Files:**
- Create: `tests/g006-batch3-content.test.mjs`
- Create: `content/quality-attributes/qa-05-security-privacy-trust.mdx`
- Create: `content/quality-attributes/qa-08-operability-observability.mdx`
- Create: `content/quality-attributes/qa-09-safety-physical-risk.mdx`
- Modify: `content/quality-attributes/qa-02-reliability-availability-recoverability.mdx`
- Modify: `content/quality-attributes/qa-04-scalability-elasticity.mdx`
- Modify: `content/quality-attributes/qa-07-compatibility-interoperability-versioning.mdx`
- Modify: `tests/g006-batch1-content.test.mjs`, `tests/g006-batch2-content.test.mjs`
- Modify: `content/paths/05-production-governance.mdx`, `content/paths/07-cloud-native-platform.mdx`, `content/paths/09-edge-physical-agents.mdx`, `content/paths/10-agent-platform-gateway.mdx`
- Modify: `data/source-ledger.json`, `data/source-link-health.json`
- Modify: `tests/project-status.test.mjs`, `tests/content-review-health.test.mjs`, `tests/source-ledger-pagination.test.mjs`, `tests/source-ledger-rendering.test.mjs`
- Generate: `src/generated/*.json`

**Interfaces:**
- Produces: three generator-valid articles, six immediately consumed remote records/cache results, reciprocal graph/path closures, and an intermediate GREEN 18/65/418 projection.

- [ ] **Step 1: Write the content/source RED**

In `tests/g006-batch3-content.test.mjs`, define exact IDs/files/slugs, nine H2s, relationship table, six remote IDs, sole-primary mapping, affected paths, boundary assertions, and final representation markers.

```js
const expected = new Map([
  ['QA-05', ['quality-attributes/qa-05-security-privacy-trust.mdx', '/quality-attributes/qa-05']],
  ['QA-08', ['quality-attributes/qa-08-operability-observability.mdx', '/quality-attributes/qa-08']],
  ['QA-09', ['quality-attributes/qa-09-safety-physical-risk.mdx', '/quality-attributes/qa-09']],
]);
const solePrimary = new Map([
  ['QA-05', 'src-nist-sp800-160v1r1'],
  ['QA-08', 'src-opentelemetry-observability-primer'],
  ['QA-09', 'src-faa-order-8040-4c'],
]);
```

Name tests `articles and deterministic representations`, `security privacy and safety boundaries`, `reciprocal relationships`, `remote governance`, and `learning paths`. Assert QA-10 remains absent and unchecked; do not assert Batch 3 completion. In `tests/g006-batch2-content.test.mjs`, replace the historical QA-05 absence/unchecked assertions with QA-10 absence/unchecked assertions because QA-05 becomes published in this task.

- [ ] **Step 2: Observe RED without committing it**

```bash
node --test tests/g006-batch3-content.test.mjs
```

Expected: FAIL only for absent QA-05/08/09 articles, citations, reciprocal edges, and path links.

- [ ] **Step 3: Register and consume exactly six remote sources**

Add the six records from the source contract. Also correct `src-github-432a30aa96cb` to title `Awesome Software Architecture` and a usage boundary that permits repository-wide architecture learning/discovery while continuing to forbid factual, implementation, runtime, and effectiveness claims. Do not change its canonical transport, discovery tier, community-index kind, CC0 evidence, or source count. Use literal publication/version context for the new records:

- NIST SP 800-160 Vol. 1 Rev. 1: Final, 2022-11-16; `LicenseRef-US-Gov-Public-Domain`; exclude third-party/standards excerpts; facts summary only.
- NIST Privacy Framework 1.0: Final, 2020-01-16; `LicenseRef-US-Gov-Public-Domain`; do not claim draft 1.1 is final or that the framework is law/compliance.
- OpenTelemetry primer: rolling official docs, checked 2026-07-27; `CC-BY-4.0`; original explanation and diagram with attribution.
- Google SRE Managing Incidents: online edition, 2017, checked 2026-07-27; `CC-BY-NC-ND-4.0`; facts/short quotation only, no translated/adapted diagram or prose.
- FAA Order 8040.4C: 2023-09-29; `LicenseRef-US-Gov-Public-Domain`; facts summary only, excluding third-party marks/assets; not a cross-industry compliance standard.
- STPA Handbook MIT-STAMP-001: 2018-03; `LicenseRef-All-Rights-Reserved`; facts/short quotation only; do not mirror, translate, or adapt its figures.

Add article citations in the same worktree state. Reuse OWASP and the existing Google SRE monitoring source rather than adding duplicates. Every article cites two independent domains and exactly one sole manifest primary. Add the existing Awesome citation only as navigation-only learning evidence.

```bash
npm run check:links:live -- --output /tmp/g006-batch3-live-cache.json
```

Merge only the six literal transport results into `data/source-link-health.json`; preserve failed attempts before later success and never replace the canonical cache wholesale.

- [ ] **Step 4: Write the three articles and close graph/path edges**

QA-05 must include:

- an asset/subject/data-purpose inventory;
- a DFD-style boundary table that treats a trust boundary as an assumption/authorization-context change, not a network segment;
- threats and privacy harms as separate but overlapping questions;
- purpose limitation, minimization, retention/deletion, derived data, logs and backups;
- a six-field cross-tenant export scenario with bounded test evidence;
- warnings that encryption, service identity, consent, STRIDE, or compliance do not prove Security/privacy.

QA-08 must include:

- a monitoring/observability/operability comparison table;
- a deterministic loop: user impact/change → signal/SLI and correlation context → alert/triage → diagnosis → guarded control action → user-visible recovery verification → learning;
- explicit on-call, incident command, operations, communication and long-term owner responsibilities without requiring separate people on small teams;
- a six-field incident scenario with version/configuration/region/request correlation;
- warnings that telemetry, “three pillars”, dashboards, SLO panels, or automation do not prove operability.

QA-09 must include:

- a Safety/Security/reliability boundary table;
- loss → hazard → control structure → unsafe control action → constraint → residual-risk acceptance and operating evidence;
- the four UCA categories: not provided, provided in an unsafe context, wrong timing/order, and applied too long/stopped too soon;
- fail-safe/degraded-mode/human takeover conditions with feedback, authority, timing and actuator availability;
- a six-field warehouse robot or edge-control scenario whose numeric thresholds remain domain-derived placeholders, never universal constants;
- warnings that reliability, redundancy, “human in the loop”, STPA, a risk matrix, or a certification label do not prove Safety.

Create all three files before generation. Add visible reciprocal links and the exact path links from the contract. Update Batch 1/2 relationship expectations only for the new reverse edges while preserving every previous edge.

- [ ] **Step 5: Update intermediate hard-coded counts and generate**

Update real-input expectations to 18 topics, 65 documents, 418 sources. In pagination/rendering tests set tiers to 382/25/4/7 and total cards/IDs to 418; primary pages become 20 because `ceil(382/20)=20`, while first-party pages remain 2.

```bash
npm run generate:content
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==18||s.content_documents!==65||s.governed_sources!==418||s.durable_stories.current!=='G006') process.exit(1)"
```

- [ ] **Step 6: Run Task 2 GREEN and commit**

```bash
node --test tests/g006-batch3-content.test.mjs tests/g006-batch1-content.test.mjs tests/g006-batch2-content.test.mjs tests/learning-path.test.mjs
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-governance-data.test.mjs
node --test tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs
npm run check:links
npm run verify
git diff --check
git add tests/g006-batch3-content.test.mjs tests/g006-batch1-content.test.mjs tests/g006-batch2-content.test.mjs content/quality-attributes content/paths data/source-ledger.json data/source-link-health.json tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs src/generated
git commit -m "feat: publish g006 quality attributes batch3"
```

Expected: full GREEN at 18/65/418 and tiers 382/25/4/7; primary/first-party pagination is 20/2.

### Task 3: Add three original raster illustrations and final count gates

**Files:**
- Modify: `tests/g006-batch3-content.test.mjs`
- Create: `static/img/illustrations/qa-05-data-trust-boundaries.png`
- Create: `static/img/illustrations/qa-08-operability-recovery-loop.png`
- Create: `static/img/illustrations/qa-09-safety-control-loop.png`
- Modify: the three Batch 3 MDX files and `data/source-ledger.json`
- Modify: `tests/project-status.test.mjs`, `tests/content-review-health.test.mjs`, `tests/source-ledger-pagination.test.mjs`, `tests/source-ledger-rendering.test.mjs`, `tests/canonical-identity.test.mjs`
- Generate: `src/generated/*.json`

**Interfaces:**
- Produces: one built-in-imagegen PNG and one non-primary illustration citation per article; final Stage A counts 18/65/421 and tiers 385/25/4/7.

- [ ] **Step 1: Extend raster/asset tests and observe RED**

Add a named `raster assets and rights` test asserting exact paths, PNG signature, 16:9 dimensions, meaningful alt/caption, MDX embedding, local illustration records, `roles: ["illustration"]`, `usage_mode: "original-illustration"`, non-empty generation note, and `manifest_primary: false`.

```bash
node --test --test-name-pattern='raster assets and rights' tests/g006-batch3-content.test.mjs
```

Expected: FAIL for the three absent assets and citations.

- [ ] **Step 2: Generate and inspect the QA-05 raster**

Use built-in `imagegen` with no reference image. Brief: simplified-Chinese 16:9 architecture map titled `数据流、处理目的与信任边界`; subjects and external actors cross TB-1 into identity/edge, TB-2 into a tenant application, and TB-3 into queue/analytics/storage/backup. Every arrow carries data class, purpose and minimal fields; each of TB-1, TB-2, and TB-3 independently displays both exact lines `身份·租户·权限` and `目的·完整性`, without splitting the five constraints across boundaries or substituting a policy-version label; show retention/deletion, derived data and audit. State visually that it is an authorization/data model, not network topology. Do not reproduce OWASP/NIST figures or imply complete threat coverage/compliance.

- [ ] **Step 3: Generate and inspect the QA-08 raster**

Use built-in `imagegen` with no reference image. Brief: simplified-Chinese 16:9 loop titled `从信号到恢复的可操作性闭环`; user impact/change → correlated signals → monitoring/alert → diagnosis → guarded control → user-visible recovery verification → post-incident learning, with a responsibility band for service owner, on-call, incident command, operations, communication and long-term owner. Show rollback/stop/audit guards and an independent degraded access path. Do not draw a “three pillars” Venn diagram or imply telemetry/SLO/automation guarantees recovery.

- [ ] **Step 4: Generate and inspect the QA-09 raster**

Use built-in `imagegen` with no reference image. Brief: simplified-Chinese 16:9 physical-control loop titled `从数字决策到物理伤害`; sensors/data quality → state estimate → decision/control → actuator/physical process → feedback, with operator/safety owner, command/feedback/timing/authority/operating-boundary annotations and four UCA branches. Add horizontal Security and Safety bands and a degraded/fail-safe branch. Do not reproduce STPA/FAA/NASA figures or imply reliability, human review, redundancy, a method, or certification proves Safety.

- [ ] **Step 5: Register illustrations and update final hard-coded counts**

Inspect each original and ~720px render for exact text, topology, crop, overflow, color-independent states, and absence of extra text/logo/watermark. Register three local `tier: primary`, `source_kind: original-illustration` records with `LicenseRef-Atlas-Original`, `original-atlas`, canonical repository evidence URL, factual-claim exclusion, and no remote cache entry.

Update real-input tests from 418 to 421 sources; primary tiers from 382 to 385 and totals from 418 to 421. Update the exact self-authored asset count from 19 to 22. Keep 65 documents, 18 topics, first-party/secondary/discovery tiers at 25/4/7, primary pages at 20, and first-party pages at 2.

- [ ] **Step 6: Generate, run full GREEN, and commit**

```bash
npm run generate:content
node --test tests/g006-batch3-content.test.mjs tests/project-status.test.mjs tests/content-review-health.test.mjs
node --test tests/source-governance-data.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs
npm run verify
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==18||s.content_documents!==65||s.governed_sources!==421) process.exit(1)"
git diff --check
git add static/img/illustrations/qa-05-data-trust-boundaries.png static/img/illustrations/qa-08-operability-recovery-loop.png static/img/illustrations/qa-09-safety-control-loop.png content/quality-attributes/qa-05-security-privacy-trust.mdx content/quality-attributes/qa-08-operability-observability.mdx content/quality-attributes/qa-09-safety-physical-risk.mdx data/source-ledger.json tests/g006-batch3-content.test.mjs tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs tests/canonical-identity.test.mjs src/generated
git commit -m "feat: illustrate g006 quality attributes batch3"
```

Expected: all gates PASS at 18/65/421 and tiers 385/25/4/7; primary/first-party pagination is exactly 20/2.

### Task 4: Perform independent review and deploy exact Stage A

**Files:**
- Create: `tests/g006-batch3-review.test.mjs`
- Create: `docs/reviews/g006-batch3.md`

**Interfaces:**
- Produces: independent editorial/fact/copyright/render approval and the exact Stage A commit deployed while Batch 3 rows remain unchecked.

- [ ] **Step 1: Write review gates, review independently, and make them GREEN**

The test requires per-page `editorial`, `fact`, `copyright`, and `render` PASS; reviewer identity distinct from the author; desktop 1440x1000 and mobile 390x844 evidence; exact article/path/source-primary routes; all three PNG routes; zero console warnings/errors; no page-level overflow; deterministic representation legibility; reciprocal links; and copyright/anti-overclaim findings. It must explicitly verify:

- QA-05 does not claim compliance, complete threats, or that network/service identity equals authorization.
- QA-08 does not define observability as only metrics/logs/traces or equate telemetry/SLO/automation with operability.
- QA-09 does not equate Safety with Security/reliability, reuse source figures, or claim certification/method completion.

```bash
node --test tests/g006-batch3-review.test.mjs
```

Expected before the review file: RED for missing evidence. Create the literal review report, correct any finding in its owning implementation file, rerun `npm run generate:content` if content changes, then require GREEN.

- [ ] **Step 2: Run Stage A closure and commit**

```bash
node --test tests/g006-batch3-review.test.mjs tests/g006-batch3-content.test.mjs
npm run verify
for id in 05 08 09 10; do rg -n -- "^- \\[ \\] \\*\\*QA-$id " docs/content-backlog.md; done
git diff --check
git add tests/g006-batch3-review.test.mjs docs/reviews/g006-batch3.md content/quality-attributes content/paths data/source-ledger.json data/source-link-health.json static/img/illustrations/qa-*.png src/generated
git commit -m "docs: review g006 quality attributes batch3"
stage_a_sha=$(git rev-parse HEAD)
```

Expected: clean GREEN commit; QA-05/08/09/10 remain unchecked and generated status is 18/65/421.

- [ ] **Step 3: Deploy exact Stage A and smoke live**

```bash
git push origin HEAD:main
gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --limit 30 --json databaseId,headSha,status,conclusion,url
```

Select only the run whose `headSha` equals `$stage_a_sha`; wait for `completed/success`. Smoke the three articles, four affected paths, three PNGs, `/references/primary/page/20`, `/references/first-party/page/2`, CSS/JS assets, desktop/mobile overflow, console, reciprocal navigation, and visible 18/65/421 homepage status. Confirm `/references/primary/page/21` and `/references/first-party/page/3` are absent. Do not accept a newer run, branch head, or local preview as Stage A evidence.

After generation, derive the exact card route for all six remote IDs and three illustration IDs from the same deterministic page planner used by Docusaurus, then smoke every `route#source-id` rather than assuming all new cards live on page 20:

```bash
node --input-type=module - <<'NODE'
import {readFile} from 'node:fs/promises';
import {buildSourceLedgerPages} from './plugins/source-ledger-pages/index.mjs';
const ids = new Set([
  'src-nist-sp800-160v1r1',
  'src-nist-privacy-framework-1',
  'src-opentelemetry-observability-primer',
  'src-sre-managing-incidents',
  'src-faa-order-8040-4c',
  'src-stpa-handbook-2018',
  'src-atlas-qa05-data-trust-boundaries-8d53f1c92a64',
  'src-atlas-qa08-operability-recovery-loop-6b1e9d42c7f5',
  'src-atlas-qa09-safety-control-loop-c4a7e83b1d96',
]);
const ledger = JSON.parse(await readFile('src/generated/source-ledger.json', 'utf8'));
const found = [];
for (const page of buildSourceLedgerPages(ledger)) {
  for (const source of page.sources) {
    if (ids.has(source.id)) found.push(`${page.route}#${source.id}`);
  }
}
if (found.length !== ids.size) process.exit(1);
console.log(found.join('\n'));
NODE
```

Expected: nine unique routes are printed. Each exact live route must load its matching `<article id="source-id">`.

### Task 5: Close only Batch 3 with literal post-live evidence

**Files:**
- Create: `tests/g006-batch3-deployment.test.mjs`
- Modify: `docs/reviews/g006-batch3.md`, `docs/content-backlog.md`, `tests/project-status.test.mjs`, `tests/g006-batch1-deployment.test.mjs`, `tests/g006-batch2-deployment.test.mjs`
- Generate: `src/generated/*.json`

**Interfaces:**
- Produces: literal Stage A SHA/run/live evidence on QA-05/08/09, keeps QA-10 pending, and changes completed topics 18 → 21.

- [ ] **Step 1: Write the deployment-closure RED**

The test extracts one full 40-character Stage A SHA, numeric Pages run ID and matching repository run URL, live date, canonical base, routes/assets/viewports, and exact successful run gate. It uses `git cat-file -e "$sha^{commit}"`, asserts `.github/workflows/deploy.yml` retains `fetch-depth: 0`, requires QA-05/08/09 `[x]` with the same evidence, and requires QA-10 `[ ]`.

```bash
node --test tests/g006-batch3-deployment.test.mjs
```

Expected: RED because literal deployment closure and checked Batch 3 rows are absent.

- [ ] **Step 2: Backfill observed evidence and update Stage B status**

Write the observed Stage A SHA, run ID/URL, live date, article/path/PNG/reference routes, all nine derived source-card routes, viewports, console and overflow results into the review and QA-05/08/09 backlog rows. Check only those three rows. Change only the real-input completed-topic expectation from 18 to 21; keep 65 documents, 421 sources, G006 current, and QA-10 unchecked. Narrow both historical deployment tests: `tests/g006-batch1-deployment.test.mjs` and `tests/g006-batch2-deployment.test.mjs` must assert only QA-10 remains future/unchecked. The new Batch 3 deployment test exclusively owns QA-05/08/09 closure.

```bash
npm run generate:content
node --test tests/g006-batch3-deployment.test.mjs tests/g006-batch3-review.test.mjs tests/g006-batch3-content.test.mjs
node --test tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs
npm run verify
node -e "const s=require('./src/generated/project-status.json'); if(s.completed_topics!==21||s.content_documents!==65||s.governed_sources!==421||s.durable_stories.current!=='G006') process.exit(1)"
git diff --check
git add tests/g006-batch3-deployment.test.mjs tests/g006-batch1-deployment.test.mjs tests/g006-batch2-deployment.test.mjs tests/project-status.test.mjs docs/content-backlog.md docs/reviews/g006-batch3.md src/generated
git commit -m "docs: record g006 batch3 deployment"
stage_b_sha=$(git rev-parse HEAD)
```

Expected: Stage B commit is fully GREEN at 21/65/421 with QA-10 pending.

- [ ] **Step 3: Deploy and verify exact Stage B**

```bash
git push origin HEAD:main
gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --limit 30 --json databaseId,headSha,status,conclusion,url
```

Select only `headSha=$stage_b_sha`; wait for `completed/success`. Repeat canonical article/path/image/reference/viewports/console/overflow checks, including all nine derived `route#source-id` cards, and confirm homepage status 21/65/421, G006 current, QA-05/08/09 checked, QA-10 unchecked, `/references/primary/page/20` present with no page 21, and `/references/first-party/page/2` present with no page 3.

- [ ] **Step 4: Final full-history and cleanliness proof**

```bash
git cat-file -e "${stage_a_sha}^{commit}"
git cat-file -e "${stage_b_sha}^{commit}"
npm run verify
git diff --check
test -z "$(git status --short)"
```

Expected: both deployment commits are available from full history, all tests/build gates pass, and the tree is clean. Do not checkpoint G006; QA-10 remains the final G006 batch.
