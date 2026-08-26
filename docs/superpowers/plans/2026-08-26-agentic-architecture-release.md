# Agentic Architecture Atomic Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the 17 Agentic Architecture pages into one navigable topic system, independently review it, merge it to `main`, publish through GitHub Pages, and record production evidence.

**Architecture:** Treat the six concepts, eight patterns, and three cases as one release unit. Generated indexes expose the pages, the Agentic Architecture path provides the progressive-autonomy spine, precise reciprocal links connect existing evidence cases, and publication is blocked until content, sources, diagrams, browser QA, and independent review all pass.

**Tech Stack:** Docusaurus 3.10.2, React 19, Node.js 24, TypeScript 6, Git/GitHub Actions, GitHub Pages, in-app Browser QA, repository content/source generators.

## Global Constraints

- Execute only after the foundation, pattern, and case plans have passed their phase gates.
- Work in `.worktrees/agentic-architecture-topic-system` on `codex/agentic-architecture-topic-system` until the explicit merge task.
- Publish all 17 routes together; do not merge partial concepts, an empty pattern group, incomplete cases, or links to absent routes.
- Preserve existing `AGT-01...AGT-06` Agent-platform backlog items; the new knowledge IDs are `AGT-C-*` and `AGT-P-*`.
- `/paths/agentic-architecture` is navigation and decision guidance, not duplicated article prose.
- Reciprocal links state the exact mechanism or boundary being connected; do not use generic “相关阅读” lists.
- Existing vendor/project cases remain implementation evidence; do not rewrite their proven facts or historical source boundaries.
- `src/generated/` is changed only by `npm run generate:content`.
- Release Task 5 is the first mandatory fresh complete `npm run verify` PASS for the assembled 17-page system; fresh complete PASS remains mandatory again before merge/publish. No release claim is made before that evidence, desktop/mobile Browser evidence, independent reviews, exact-head GitHub Pages success, and production route checks.
- Use `requesting-code-review` before merge, `verification-before-completion` before completion claims, and `finishing-a-development-branch` for integration.

---

## File Map

**Create**

- `tests/agt-topic-system-integration.test.mjs` — 17-route, learning-order, reciprocal-link, index, group, and no-island contracts.
- `tests/agt-topic-system-deployment.test.mjs` — exact release commit, workflow run, production routes, evidence files, and backlog completion contract.
- `docs/reviews/agentic-architecture-topic-system.md` — content/source/visual/release review record.
- `docs/reviews/evidence/agentic-architecture-topic-system-local-browser.json` — desktop/mobile local evidence.
- `docs/reviews/evidence/agentic-architecture-topic-system-production-browser.json` — production route evidence.
- `docs/reviews/evidence/agentic-architecture-topic-system-deployment.json` — exact commit and GitHub Actions run/job evidence.

**Modify**

- `content/paths/06-agentic-architecture.mdx` — five-stage progressive-autonomy learning spine and three reader branches.
- `content/concepts/index.mdx` — introduce the six Agentic Architecture foundations while retaining generated `TopicIndex`.
- `content/patterns/index.mdx` — replace unlinked overview-only sections with the eight published pattern entries and protocol boundary notes.
- `content/cases/index.mdx` — describe the three reference designs and update stale count language.
- Existing reciprocal evidence pages:
  - `content/cases/openai-agents-sdk.mdx`
  - `content/cases/langgraph-supervisor.mdx`
  - `content/cases/google-adk-a2a.mdx`
  - `content/cases/aws-cli-agent-orchestrator.mdx`
  - `content/cases/microsoft-multi-agent-reference-architecture.mdx`
  - `content/cases/kong-ai-gateway-routing-resilience.mdx`
  - `content/cases/temporal-saga-durable-execution.mdx`
- All 17 new pages — add final new-to-new reciprocal links and path return links.
- `data/terminology.json` — first-use and preferred-name entries required by validation.
- `data/source-link-health.json` — final live refresh.
- `docs/content-backlog.md` — mark 17 items complete only after production verification.
- `src/generated/content-ledger.json`
- `src/generated/project-status.json`
- `src/generated/public-source-ledger.json`
- `src/generated/topic-indexes.json`
- `src/generated/topic-manifest.json`
- Other generated outputs actually changed by `npm run generate:content`; do not edit them manually.

### Task 1: Lock the integration contract

**Files:** Create `tests/agt-topic-system-integration.test.mjs`.

**Interfaces:** Consumes the canonical fixture and all 17 pages; produces the release gate used through local QA and deployment.

- [ ] **Step 1: Write exact route and learning-order assertions**

```js
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {readContentDocuments} from '../scripts/content-metadata.mjs';

const registry = JSON.parse(readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'));
const inventoryRoutes = [
  ...registry.concepts.map(({route}) => route),
  ...registry.patterns.map(({route}) => route),
  ...registry.cases.map(({route}) => route),
];
const learningRoutes = [
  ...registry.concepts.map(({route}) => route),
  '/patterns/agt-p-01',
  '/patterns/agt-p-03',
  '/patterns/agt-p-04',
  '/patterns/agt-p-05',
  '/patterns/agt-p-02',
  '/patterns/agt-p-06',
  '/patterns/agt-p-07',
  '/patterns/agt-p-08',
  ...registry.cases.map(({route}) => route),
];

test('agentic path exposes the exact progressive-autonomy order', () => {
  const path = readFileSync('content/paths/06-agentic-architecture.mdx', 'utf8');
  let cursor = -1;
  for (const route of learningRoutes) {
    const next = path.indexOf(`](${route})`, cursor + 1);
    assert.ok(next > cursor, `${route} is visible in order`);
    cursor = next;
  }
});
```

- [ ] **Step 2: Add no-island and reciprocal-link assertions**

Require every new route to receive at least one internal link and emit at least two internal links. Require these exact existing-page edges:

```js
const reciprocal = {
  '/cases/openai-agents-sdk': ['/concepts/agt-c-03','/patterns/agt-p-06'],
  '/cases/langgraph-supervisor': ['/concepts/agt-c-04','/patterns/agt-p-06','/patterns/agt-p-08'],
  '/cases/google-adk-a2a': ['/patterns/agt-p-06'],
  '/cases/aws-cli-agent-orchestrator': ['/concepts/agt-c-02','/cases/long-running-coding-agent'],
  '/cases/microsoft-multi-agent-reference-architecture': ['/patterns/agt-p-07','/cases/multi-agent-research-system'],
  '/cases/kong-ai-gateway-routing-resilience': ['/patterns/agt-p-05','/cases/production-incident-response-agent'],
  '/cases/temporal-saga-durable-execution': ['/patterns/agt-p-08'],
};
```

Also require each new page to link back to `/paths/agentic-architecture` and to its category index.

- [ ] **Step 3: Add index/group/generated-manifest assertions**

Assert concepts index visibly introduces the six-item foundation set, patterns index links all eight routes, cases index links all three reference cases, `agent-control` contains exactly eight IDs, and generated manifest resolves all 14 knowledge IDs without duplicate IDs/slugs.

- [ ] **Step 4: Run and verify meaningful RED**

Run: `node --test tests/agt-topic-system-integration.test.mjs`

Expected: FAIL on the old learning path, missing final reciprocals, and stale generated projections.

- [ ] **Step 5: Commit the red integration contract**

```bash
git add tests/agt-topic-system-integration.test.mjs
git commit -m "test(agentic): define atomic topic-system integration"
```

### Task 2: Build the learning spine and category entrances

**Files:** Modify the path and three index files listed in the file map.

**Interfaces:** Produces the public five-stage learning spine and three branch decisions.

- [ ] Rewrite `/paths/agentic-architecture` into these exact stages: `系统边界`, `单 Agent 基础`, `控制模式`, `能力扩展`, `生产验证`.
- [ ] Place all 17 links in canonical fixture order. Add branch cards for `可控自动化`, `知识型 Agent`, and `有副作用的长时 Agent`, each with an entry condition, required pages, and a stop/skip condition.
- [ ] Update concepts index copy to distinguish foundations from product/framework guides while retaining `<TopicIndex type="concept" />`.
- [ ] Update patterns index so each old overview points to a published AGT-P route; retain A2A/MCP protocol distinction and explicitly state protocols are not control/governance guarantees.
- [ ] Update cases index with the three reference-design links, the evidence disclaimer, and catalog language that does not hard-code a stale total.
- [ ] Run `node --test tests/agt-topic-system-integration.test.mjs tests/learning-path.test.mjs tests/topic-index.test.mjs`; expect remaining failures only for reciprocal links/generated projections.
- [ ] Commit `docs(agentic): build progressive autonomy learning path`.

### Task 3: Close new-to-new and existing reciprocal relationships

**Files:** Modify all 17 new pages and seven existing evidence cases listed above.

**Interfaces:** Produces a connected knowledge graph with visible, semantically precise edges.

- [ ] Add final metadata `depends_on`, `adjacent_topics`, and `related_cases` values consistent with the design and global fixture; never add unpublished IDs.
- [ ] Add visible prose links at the point where each mechanism is discussed. Examples: OpenAI control case → Agent Loop and control-ownership pattern; LangGraph persistence → state/checkpoint and durable execution; Temporal history → durable execution; Kong routing → Router and incident-response reference case.
- [ ] Add every new page’s category-index and learning-path return links.
- [ ] Run integration, content-relations, topic-manifest, and content-validation tests; expect PASS after generated projections are refreshed in Task 4.
- [ ] Commit `docs(agentic): connect concepts patterns and evidence cases`.

### Task 4: Finalize terminology, sources, and generated projections

**Files:** Modify `data/terminology.json`, source/link-health data, and generated files.

**Interfaces:** Produces the deterministic build inputs for the atomic release.

- [ ] Run `npm run check:terminology`; add only missing preferred-term or first-use contracts for Agent Harness, Agent Loop, Agentic RAG, Planner–Executor, Evaluator–Optimizer, Orchestrator–Workers, Fan-out/Fan-in, Human-in-the-loop, Checkpoint, Guardrail, and Sandbox. Reuse existing entries when present.
- [ ] Run `npm run refresh:links`; inspect every changed transport result and do not convert a failing source to healthy manually. Replace a source only with an authoritative equivalent and update its citation boundary.
- [ ] Run `npm run generate:content`; inspect every generated diff for 14 new knowledge topics, 3 cases, 8 pattern-group members, 17 governed documents, and source counts derived from the ledger.
- [ ] Run `node --test tests/agt-topic-system-integration.test.mjs tests/agt-foundations-content.test.mjs tests/agt-patterns-content.test.mjs tests/agt-reference-cases.test.mjs`; expect PASS.
- [ ] Commit `chore(agentic): refresh topic system governance projections`.

### Task 5: Run the full local release gate and Browser QA

**Files:** Create `docs/reviews/evidence/agentic-architecture-topic-system-local-browser.json`; modify concrete defects only.

**Interfaces:** Produces fresh local evidence for independent review.

- [ ] Run `npm ci` only if `node_modules` is missing or lockfile state requires it; do not change dependencies.
- [ ] Run `npm run verify`; save command, start/end time, commit SHA, and exit code in the review document.
- [ ] Start `npm run serve -- --host 127.0.0.1 --port 3100` and use the in-app Browser skill.
- [ ] Inspect all 17 routes at desktop `1440x1000` and mobile `390x844`: HTTP 200, correct H1/title, no console warnings/errors, no document overflow, tables/diagrams locally scroll, focus indicator visible, and internal links clickable.
- [ ] For the six Draw.io routes, record exact desktop rendered SVG width `800px`, `rendered width / viewBox width` scale, named-node baseline/clearance measurements, edge label clearances, and mobile assertions `wrapper.scrollWidth > wrapper.clientWidth` plus `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- [ ] Save the evidence as JSON with `{commit, base_url, viewports, routes, diagrams, console, verdict}`; any failed route or visual measurement keeps the release blocked.
- [ ] After fixes, rerun focused tests and a fresh complete `npm run verify`, then commit evidence/fixes as `test(agentic): record local atomic release evidence`.

### Task 6: Obtain independent reviews and freeze the release candidate

**Files:** Create `docs/reviews/agentic-architecture-topic-system.md`; modify only review findings.

**Interfaces:** Produces an exact-head release candidate approved on four axes.

- [ ] Use `requesting-code-review` to request separate reviews for: concept/pattern accuracy; case evidence and source boundaries; diagram topology/accessibility; integration/release safety.
- [ ] Record each finding with severity, file/route, evidence, resolution, reviewer verdict, and exact reviewed commit SHA.
- [ ] Fix every Critical/High issue and all release-relevant Medium issues; rerun the affected focused test and `npm run verify`.
- [ ] Require four PASS verdicts on the same final candidate SHA. If a fix changes the SHA, revalidate impacted reviews rather than copying an old approval forward.
- [ ] Run `git diff --check`, `git status --short`, and `npm run verify`; require clean status after committing `docs(agentic): record release candidate reviews`.

### Task 7: Integrate the verified branch into `main`

**Files:** Git history only; no content edits unless integrating a newer `origin/main` exposes a real conflict.

**Interfaces:** Produces an exact `main` release commit for GitHub Pages.

- [ ] Use `finishing-a-development-branch`. Fetch `origin`, compare `merge-base`, and check both the feature worktree and `/Users/seal/projects/tego-arch` main worktree status.
- [ ] If `origin/main` advanced, merge it into the feature branch without discarding either side, resolve only semantic conflicts, and rerun `npm run verify` plus affected browser checks.
- [ ] Stop if the main worktree contains unrelated uncommitted changes that overlap integration; do not stash, reset, or overwrite them.
- [ ] In the clean main worktree run `git pull --ff-only origin main`, then `git merge --ff-only codex/agentic-architecture-topic-system`. If fast-forward is impossible after the feature branch has integrated current main, diagnose before choosing a merge strategy.
- [ ] Run `npm run verify` on the exact merged `main` SHA and record it as `RELEASE_SHA`.
- [ ] Push with `git push origin main`; do not force push.

### Task 8: Verify GitHub Pages and close production evidence

**Files:** Create deployment and production Browser evidence; create deployment test; update review/backlog; regenerate projections.

**Interfaces:** Consumes `RELEASE_SHA`; produces durable proof that all 17 routes are live together.

- [ ] Create `tests/agt-topic-system-deployment.test.mjs` asserting the evidence JSON names `RELEASE_SHA`, workflow `.github/workflows/deploy.yml`, completed/success build and deploy jobs, all 17 canonical production URLs, and backlog completion only after every production route verdict is PASS.
- [ ] Run the deployment test; expect FAIL because evidence/backlog completion does not yet exist.
- [ ] Poll `gh run list --workflow deploy.yml --branch main --commit "$RELEASE_SHA" --json databaseId,headSha,status,conclusion,url` until exact-head completion. Inspect `gh run view <run-id> --json jobs` and require both `build` and `deploy` success.
- [ ] Use the in-app Browser on `https://sealday.github.io/tego-arch` to inspect the path, three indexes, all 17 routes, six SVG URLs, representative reciprocal links, desktop/mobile overflow, and console state. Save exact results in `agentic-architecture-topic-system-production-browser.json`.
- [ ] Save workflow run/job IDs, URLs, SHA, timestamps, and conclusion in `agentic-architecture-topic-system-deployment.json`; update the review document with the production verdict.
- [ ] Only after all production checks pass, mark the 14 AGT-C/AGT-P and CASE-21/22/23 backlog rows `[x]` with release SHA, Pages run, and live-route evidence. Run `npm run generate:content` and `npm run verify`.
- [ ] Commit the post-release evidence on `main` as `docs(agentic): record production release evidence`, push normally, wait for its exact-head Pages run, and rerun the deployment test.
- [ ] Use `verification-before-completion`: require clean `main`, exact-head successful Pages, all deployment tests PASS, and all 17 live routes PASS before claiming publication complete.
