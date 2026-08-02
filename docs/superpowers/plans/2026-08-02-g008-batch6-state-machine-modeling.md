# G008 Batch 6 State Machine Modeling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish MOD-08 as an evidence-bounded guide to coordinating a business-intent state machine with an execution/recovery state machine, then deploy and close only MOD-08.

**Architecture:** One original long-running transfer/reconciliation scenario is represented by two Mermaid `stateDiagram-v2` artifacts and one seven-row Markdown mapping table. The article separates business facts from attempt/recovery control, reuses five governed sources, adds reciprocal links to MOD-07, PR-10, QA-02 and the Temporal Saga case, and preserves G008 as current with MOD-09 next.

**Tech Stack:** Docusaurus MDX, Mermaid, Markdown tables, Node.js 26.5.0, `node:test`, generated JSON, governed source ledger and committed link-health cache, GitHub Pages.

## Global Constraints

- Work only in `/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch6` on `codex/g008-modeling-batch6`.
- Use `PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH` for every Node/npm command.
- Publish only MOD-08; MOD-09..13 remain pending and unlinked.
- Do not add dependencies, Draw.io, SVG, raster images, or `data/topic-relations.json` overrides.
- Use exactly two Mermaid state diagrams and exactly one seven-row Markdown mapping table.
- Keep timeout distinct from business failure, cancellation request distinct from cancelled, and compensation distinct from rollback.
- Reuse exactly five governed source identities; OMG UML 2.5.1 is the only MOD-08 `manifest_primary: true` citation.
- Stage A projection is `46 / 89 / 476`, with MOD-08 published/pending.
- Stage B projection is `47 / 89 / 476`, durable stories `7 / 20`, current G008, next MOD-09.
- Preserve every G008 Batch 5 and older SHA, run, count, observation and historical paragraph.
- Use Node 26.5.0; do not use Node 20.

---

### Task 1: Build the MOD-08 article and mutation-sensitive content contract

**Files:**
- Create: `content/modeling/mod-08-state-machine-modeling.mdx`
- Create: `tests/g008-batch6-content.test.mjs`

**Interfaces:**
- Consumes: the MOD-07 modeling boundary, `handleHorizontalArrowKey`, the approved business/execution state sets, and the Temporal Saga teaching boundary.
- Produces: a published MOD-08 document body whose metadata, heading sequence, state graphs, mapping rows, interaction wrappers and non-proof rules can be governed in Task 2.

- [ ] **Step 1: Write the failing metadata and structure contract**

Create `tests/g008-batch6-content.test.mjs`. Use `readContentDocument` from `../scripts/content-parser.mjs` and require:

```js
const document = await readContentDocument(
  new URL('../content/modeling/mod-08-state-machine-modeling.mdx', import.meta.url),
);

assert.equal(document.metadata.topic_id, 'MOD-08');
assert.equal(document.metadata.slug, '/modeling/mod-08');
assert.equal(document.metadata.content_type, 'modeling');
assert.equal(document.metadata.status, 'reviewed');
assert.equal(document.metadata.priority, 'P1');
assert.deepEqual(document.metadata.depends_on, ['MOD-07']);
assert.deepEqual(document.metadata.adjacent_topics, ['MOD-07', 'PR-10', 'QA-02']);
assert.deepEqual(document.metadata.related_cases, [
  '/cases/temporal-saga-durable-execution',
]);
assert.deepEqual(document.metadata.related_questions, []);
assert.deepEqual(
  document.headings.filter(({level}) => level === 2).map(({text}) => text),
  [
    '学习问题',
    '建模目标与输入',
    '两类状态与权威记录',
    '模型产物',
    '转换合同',
    '超时、取消与补偿',
    '完成判断',
    '常见失败',
    '与其他模型的衔接',
    '完整演练',
    '来源',
  ],
);
```

Expected: RED because the document does not exist.

- [ ] **Step 2: Add the failing exact state-graph contract**

Extract the two `stateDiagram-v2` fences. Parse every `state "label" as id` declaration and every `left --> right` transition into sorted sets. Require exactly these business states:

```js
const expectedBusinessStates = new Set([
  'requested',
  'accepted',
  'settlement_pending',
  'settled',
  'rejected',
  'cancelled_before_effect',
  'compensated',
  'manually_resolved',
]);
```

Require exactly these execution/recovery states:

```js
const expectedExecutionStates = new Set([
  'ready',
  'attempting',
  'awaiting_receipt',
  'unknown',
  'reconciling',
  'confirmed_success',
  'compensation_pending',
  'compensated',
  'manual_review',
  'manual_closed',
  'stopped_before_effect',
]);
```

Require the graph to include, at minimum, these exact directed transitions and reject duplicates or undeclared endpoints:

```js
const expectedExecutionEdges = new Set([
  'ready->attempting',
  'attempting->awaiting_receipt',
  'awaiting_receipt->confirmed_success',
  'awaiting_receipt->unknown',
  'unknown->reconciling',
  'reconciling->confirmed_success',
  'reconciling->ready',
  'reconciling->compensation_pending',
  'reconciling->manual_review',
  'compensation_pending->compensated',
  'compensation_pending->manual_review',
  'manual_review->manual_closed',
  'ready->stopped_before_effect',
]);
```

- [ ] **Step 3: Add the failing seven-row mapping contract**

Require one and only one Markdown table in the complete document. Parse the table into records with these exact keys:

```js
const expectedTriggers = [
  '接受请求',
  '提交外部效果',
  '执行超时',
  '效果前取消',
  '未知结果后取消',
  '确认部分效果后补偿',
  '证据无法收敛后人工决议',
];
```

Each record must retain the five columns `触发 / 业务状态变化 / 执行状态变化 / 所需权威证据 / 禁止推断`. Deep-compare all seven records, including these non-proof clauses:

```js
assert.match(rowsByTrigger.get('执行超时').禁止推断, /超时.*(?:失败|未发生)/u);
assert.match(rowsByTrigger.get('未知结果后取消').禁止推断, /取消请求.*已经取消/u);
assert.match(rowsByTrigger.get('确认部分效果后补偿').禁止推断, /补偿.*回滚/u);
assert.match(rowsByTrigger.get('证据无法收敛后人工决议').所需权威证据, /disposition.*decision_ref/u);
```

- [ ] **Step 4: Verify RED**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch6-content.test.mjs
```

Expected: FAIL because MOD-08 is absent.

- [ ] **Step 5: Write the minimal complete MOD-08 article**

Create front matter with the exact Task 1 metadata. Import:

```mdx
import {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';
```

Render each Mermaid fence inside:

```mdx
<div
  className="diagram-wrapper"
  role="region"
  aria-label="业务意图状态机，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>

```mermaid
stateDiagram-v2
...
```

</div>
```

Use the same exact contract for `执行与恢复状态机，可横向滚动`. Wrap the only table in `table-wrapper table-wrapper--mapping` with role, aria label, `tabIndex={0}` and `onKeyDown={handleHorizontalArrowKey}`.

State verbatim in prose:

```text
调用超时只说明观察者没有按时得到结果，不能单独证明业务失败或外部效果未发生。
取消是事件和意图，不等于已经取消；执行已提交或结果未知时必须先对账。
补偿创建新的业务事实，不是把历史回滚成从未发生。
人工终态必须保存 disposition、decision_ref、决策人、时间和残余风险。
```

- [ ] **Step 6: Add interaction and mutation tests**

Require two exact `diagram-wrapper` blocks and one exact mapping wrapper. Load `handleHorizontalArrowKey` and test a focused overflowing region moves by 40 pixels while a non-overflowing region stays still. Add controlled mutations that remove one workflow state, reverse one edge, alter each of the seven mapping records, add a second Markdown table, remove `tabIndex`, remove `onKeyDown`, and weaken each of the four invariant sentences. Every mutation must throw.

- [ ] **Step 7: Run Task 1 verification and commit**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch6-content.test.mjs
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run typecheck
git diff --check
git add content/modeling/mod-08-state-machine-modeling.mdx \
  tests/g008-batch6-content.test.mjs
git commit -m "docs: add mod08 state machine modeling"
```

Expected: focused tests and typecheck pass; commit contains only the article and focused test.

---

### Task 2: Govern sources, reciprocal relations and the Stage A projection

**Files:**
- Modify: `tests/g008-batch6-content.test.mjs`
- Modify: `data/source-ledger.json`
- Modify: `content/modeling/mod-07-uml-diagram-selection-guide.mdx`
- Modify: `content/principles/pr-10-idempotency-minimal-coordination.mdx`
- Modify: `content/quality-attributes/qa-02-reliability-availability-recoverability.mdx`
- Modify: `data/source-link-health.json` only through the checker
- Modify: generated JSON under `src/generated/`
- Modify only proven live assertions in older tests

**Interfaces:**
- Consumes: Task 1 article and the five already registered source records.
- Produces: a fully governed MOD-08 document, reciprocal published relationships and Stage A `46 / 89 / 476`.

- [ ] **Step 1: Add the failing exact source-review contract**

Require these canonical source identities:

```js
const expectedSources = new Map([
  ['src-omg-uml-2-5-1-2017', 'https://www.omg.org/spec/UML/2.5.1'],
  ['src-docs-abd3e18c34a9', 'https://docs.temporal.io/workflows'],
  ['src-docs-1743ee34e211', 'https://docs.temporal.io/activities'],
  ['src-docs-9950c767c50f', 'https://docs.temporal.io/encyclopedia/retry-policies'],
  ['src-doi-c4c907db05fa', 'https://dl.acm.org/doi/10.1145/38713.38742'],
]);
```

Require a `documents["content/modeling/mod-08-state-machine-modeling.mdx"]` review dated `2026-08-02`, the four standard copyright checks, exactly five citations, facts-summary usage, no quotations or adaptations, and OMG as the only `manifest_primary: true` citation.

- [ ] **Step 2: Add the exact MOD-08 citation review**

Add citations with roles:

```json
[
  {"source_id":"src-omg-uml-2-5-1-2017","citation_url":"https://www.omg.org/spec/UML/2.5.1","roles":["definition","method"],"manifest_primary":true,"usage_mode":"facts-summary","attribution_note":"Unified Modeling Language 2.5.1, Object Management Group","modification_note":null,"excerpt":null,"quotation_reviewed":false},
  {"source_id":"src-docs-abd3e18c34a9","citation_url":"https://docs.temporal.io/workflows","roles":["runtime-fact"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"Temporal Workflow, Temporal Technologies","modification_note":null,"excerpt":null,"quotation_reviewed":false},
  {"source_id":"src-docs-1743ee34e211","citation_url":"https://docs.temporal.io/activities","roles":["runtime-fact"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"Temporal Activity, Temporal Technologies","modification_note":null,"excerpt":null,"quotation_reviewed":false},
  {"source_id":"src-docs-9950c767c50f","citation_url":"https://docs.temporal.io/encyclopedia/retry-policies","roles":["runtime-fact"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"Temporal Retry Policies, Temporal Technologies","modification_note":null,"excerpt":null,"quotation_reviewed":false},
  {"source_id":"src-doi-c4c907db05fa","citation_url":"https://dl.acm.org/doi/10.1145/38713.38742","roles":["historical-context","method"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"Sagas, Hector Garcia-Molina and Kenneth Salem","modification_note":null,"excerpt":null,"quotation_reviewed":false}
]
```

In `## 来源`, expose all five canonical links and state every registered usage boundary. Do not reproduce source diagrams or examples.

- [ ] **Step 3: Refresh and validate link health**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run refresh:links
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run check:links
```

Preserve real attempt history. If one external origin fails under Node but succeeds through an independently verified transport, use only `checkSourceLink`'s `fetchImpl` injection plus `mergeLinkHealthCaches`; never hand-write a successful attempt.

- [ ] **Step 4: Add reciprocal relationship tests and content**

Require MOD-08 visible links to `/modeling`, `/modeling/mod-07`, `/principles/pr-10`, `/quality-attributes/qa-02`, and `/cases/temporal-saga-durable-execution`. Require zero `/modeling/mod-09` links and visible text that MOD-09 is not published.

Require MOD-07, PR-10 and QA-02 metadata `adjacent_topics` to include MOD-08 and each article to expose one `/modeling/mod-08` link. Remove MOD-07's stale “MOD-08 未发布” sentence. Update no unrelated paragraph and do not add a relation override.

- [ ] **Step 5: Generate and lock Stage A**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run generate:content
```

Require:

```js
assert.deepEqual(status, {
  schema_version: 1,
  durable_stories: {completed: 7, total: 20, current: 'G008'},
  completed_topics: 46,
  content_documents: 89,
  governed_sources: 476,
  sources: {
    durable_stories: 'docs/content-backlog.md',
    completed_topics: 'docs/content-backlog.md',
    content_documents: 'content/**/*.{md,mdx}',
    governed_sources: 'data/source-ledger.json',
  },
});
assert.equal(topicsById.get('MOD-08').published, true);
assert.equal(topicsById.get('MOD-08').status.value, 'pending');
```

Update older tests only where a live count, current prefix, published reciprocal edge or current pending topic changed. Never change historical SHA/run/count literals.

- [ ] **Step 6: Verify, review and commit Task 2**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch6-content.test.mjs tests/project-status.test.mjs
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run validate:content
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run check:content
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run check:links
git diff --check
git add content/modeling/mod-07-uml-diagram-selection-guide.mdx \
  content/modeling/mod-08-state-machine-modeling.mdx \
  content/principles/pr-10-idempotency-minimal-coordination.mdx \
  content/quality-attributes/qa-02-reliability-availability-recoverability.mdx \
  data/source-ledger.json data/source-link-health.json src/generated tests
git commit -m "docs: govern mod08 sources and relations"
```

Before staging, inspect `git diff --name-only` and exclude every file not justified by Task 2. A fresh reviewer must approve source/copyright, reciprocal relations, live-vs-historical assertions and mutation strength.

---

### Task 3: Verify, independently review and publish Stage A

**Files:**
- Modify only for review findings: Task 1–2 files
- Create ignored: `.superpowers/sdd/task-3-stagea-report.md`

**Interfaces:**
- Consumes: committed Stage A `46 / 89 / 476`.
- Produces: one exact Stage A SHA on feature, local main, origin feature and origin/main, plus a successful exact-head Pages run.

- [ ] **Step 1: Run targeted and full verification**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch6-content.test.mjs \
  tests/content-validation.test.mjs tests/project-status.test.mjs
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run verify
git diff --check
git status --short
```

Record exact pass/total, 89 documents, 476 sources and all warnings.

- [ ] **Step 2: Run independent cumulative review**

Review the design commit through current HEAD with separate judgments for content/state semantics, visual/accessibility contracts, source/copyright governance, test/mutation quality, historical evidence safety and architecture. Fix every Important or Critical finding, rerun full verify and commit each narrow repair.

- [ ] **Step 3: Publish exact Stage A**

```bash
git push origin codex/g008-modeling-batch6
```

In `/Users/seal/projects/tego-arch`, confirm the only status entry is `?? .codex/config.toml`, then:

```bash
git merge --ff-only codex/g008-modeling-batch6
git push origin main
```

Require feature HEAD, origin feature, local main and origin/main to equal the same 40-character SHA.

- [ ] **Step 4: Wait for the exact Pages run**

Find the `Verify and deploy Docusaurus to GitHub Pages` run whose `headSha` equals Stage A HEAD. Store its numeric ID in `G008_B6_STAGE_A_RUN_ID`, watch with `--exit-status`, then require `status=completed`, `conclusion=success`, the exact workflow and exact head SHA. Record the run URL.

---

### Task 4: Execute exact production browser QA

**Files:**
- Create ignored: `.superpowers/sdd/task-4-final-browser-qa.json`
- Create ignored: `.superpowers/sdd/task-4-report.md`

**Interfaces:**
- Consumes: exact Stage A SHA/run and deployed MOD-08.
- Produces: immutable measured browser evidence and its SHA-256 for Stage B.

- [ ] **Step 1: Verify the exact eight canonical routes**

Require HTTP 200 for:

```text
/
/modeling
/modeling/mod-07
/modeling/mod-08
/principles/pr-10
/quality-attributes/qa-02
/cases/temporal-saga-durable-execution
/references
```

- [ ] **Step 2: Verify desktop `1440x1000` and mobile `390x844`**

Use fresh browser tabs per viewport. At each exact viewport measure and store exact title/H1, 11 H2 strings, two Mermaid regions/SVGs, one seven-row table, zero document overflow, wrapper client/scroll widths, role, aria label and tab index. Press ArrowRight only after verifying a unique wrapper; require `scrollLeft` to move by 40 where overflow exists and remain unchanged where it does not.

- [ ] **Step 3: Activate every source and relationship**

At each viewport click all five source links and all five MOD-08 outbound relations. On MOD-07, PR-10 and QA-02 activate the reciprocal MOD-08 backlink at each viewport. Expected totals: 10 source activations and 16 relation activations. Record before URL, clicked href/name, interaction method and landed URL for every activation.

- [ ] **Step 4: Record forbidden publication and diagnostics**

Require zero MOD-09 article links. Store a closed-world operator target ledger proving no action targeted `/modeling/mod-09`. Collect fresh warning/error diagnostics from each viewport tab and require console warnings/errors/page errors `0/0/0`.

- [ ] **Step 5: Freeze and independently review evidence**

Write all measured values to JSON, compute SHA-256, copy equal counts to the report, and have a fresh verifier compare every artifact key against this plan. Task 4 passes only with the exact line `Task 4 production QA — PASS` and zero Important/Critical findings.

---

### Task 5: Record Stage B closure and deploy the final state

**Files:**
- Create: `docs/reviews/g008-batch6.md`
- Create: `tests/g008-batch6-deployment.test.mjs`
- Modify: `docs/content-backlog.md`
- Modify: generated JSON under `src/generated/`
- Modify only proven live assertions in older tests

**Interfaces:**
- Consumes: exact Stage A SHA, exact numeric Pages run, exact Stage A verify count, Task 4 artifact hash and measured QA counts.
- Produces: immutable Batch 6 evidence and Stage B `47 / 89 / 476`, current G008, next MOD-09.

- [ ] **Step 1: Write and prove the failing deployment contract**

Copy structural I/O and history helpers from `tests/g008-batch5-deployment.test.mjs`. Before the first run, paste the actual 40-character Stage A SHA and numeric Pages run as literals; never derive them from Stage B HEAD and never use symbolic placeholders.

Require exact review sections for Stage A identity, verification, independent review, production smoke, Stage B projection and final PASS. Require the literal artifact SHA-256 and exact measured counts from Task 4. Scope Stage A and Stage B assertions to their own sections so identical `89` and `476` values cannot satisfy each other.

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch6-deployment.test.mjs
```

Expected: RED because review/backlog closure is absent and MOD-08 is pending.

- [ ] **Step 2: Create the exact release review and backlog segment**

Create `docs/reviews/g008-batch6.md` from measured values only. Prepend one `2026-08-02 G008 Batch 6 已完成 MOD-08` segment to the current baseline, preserve the complete Batch 5 and older suffix byte-for-byte, and change only MOD-08 from `[ ]` to `[x]`.

The new segment must say Stage A `46 / 89 / 476`, Stage B `47 / 89 / 476`, `7 / 20`, G008 current, MOD-09 next, and `Stage B closure — PASS`.

- [ ] **Step 3: Generate Stage B and update live assertions**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run generate:content
```

Require exact project status:

```js
{
  schema_version: 1,
  durable_stories: {completed: 7, total: 20, current: 'G008'},
  completed_topics: 47,
  content_documents: 89,
  governed_sources: 476,
  sources: {
    durable_stories: 'docs/content-backlog.md',
    completed_topics: 'docs/content-backlog.md',
    content_documents: 'content/**/*.{md,mdx}',
    governed_sources: 'data/source-ledger.json',
  },
}
```

Update only current-state assertions proven stale by the full suite. Preserve every historical Stage A/Stage B literal. Add controlled mutations for each required review/backlog literal, exact occurrences, MOD-08-only closure, G008 current and MOD-09 next.

- [ ] **Step 4: Verify, independently review and commit Stage B**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch6-content.test.mjs \
  tests/g008-batch6-deployment.test.mjs tests/project-status.test.mjs \
  tests/g008-batch5-deployment.test.mjs
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run verify
git diff --check
```

Run a fresh cumulative review from the design commit through HEAD. Repair every Important/Critical finding, rerun full verify, then:

```bash
git add docs/content-backlog.md docs/reviews/g008-batch6.md \
  src/generated tests
git commit -m "docs: close g008 batch6 state machine modeling"
git push origin codex/g008-modeling-batch6
```

Inspect the staged file list and exclude anything unrelated.

- [ ] **Step 5: Fast-forward main and verify final deployment**

Fast-forward local main, push origin/main, wait for the exact final Pages run and require completed/success at final HEAD. Recheck the eight routes and `/modeling`: MOD-08 must be linked/complete; MOD-09 must be unlinked/planned.

---

### Task 6: Run final consistency audit and deliver

**Files:**
- No intended tracked changes

**Interfaces:**
- Consumes: verified final Stage B SHA/run.
- Produces: synchronized refs, clean feature worktree, preserved user files and concise delivery evidence.

- [ ] **Step 1: Run fresh committed-HEAD verification**

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run verify
git diff --check 618f653..HEAD
```

Record exact tests, 89 documents, 476 sources and warnings.

- [ ] **Step 2: Verify refs, deployment and status**

Require feature HEAD, origin feature, local main and fresh origin/main to equal the final SHA. Require feature worktree clean and main checkout to contain only preserved `?? .codex/config.toml`. Verify final Pages exact workflow/head/status, eight HTTP routes, linked complete MOD-08 and unlinked planned MOD-09.

- [ ] **Step 3: Deliver exact evidence**

Report final SHA/run, full verify count, `47 / 89 / 476`, durable `7 / 20`, current G008, next MOD-09, exact viewports/source/relation/diagnostic totals, Task 4 artifact hash, independent review result and any warning gap. Preserve the feature worktree and branch.
