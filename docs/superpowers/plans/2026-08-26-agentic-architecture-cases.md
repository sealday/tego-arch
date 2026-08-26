# Agentic Architecture Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish three evidence-disciplined reference cases that validate the concept and pattern system under research, coding, and production incident-response constraints.

**Architecture:** Each case is explicitly labeled as a reference design assembled from governed mechanisms, not a fabricated customer deployment. All use the repository’s ten-section case contract, a synchronized Draw.io/SVG topology, a failure contract, and a three-level evidence boundary.

**Tech Stack:** Docusaurus MDX, Node.js 24 tests, Draw.io + accessible SVG, case catalog JSON generation, governed source ledger.

## Global Constraints

- Execute after foundation and pattern plans pass `npm run verify`.
- Use `writing-architecture-cases` for every case and `creating-drawio-architecture-diagrams` for every asset pair.
- Work only in `.worktrees/agentic-architecture-topic-system` on `codex/agentic-architecture-topic-system`.
- Case frontmatter uses `content_type: case`, `series: ai-native`, global `catalog_order` 19, 20, and 21, and no fabricated `topic_id`.
- All three cases explicitly say they are reference designs; public mechanisms support components, but no source proves the complete topology was deployed as drawn.
- Fixed H2 order: 学习问题、一页摘要、事实边界、架构图、控制权与任务流、关键源码导读、架构决策与权衡、生产化分析、可迁移经验、来源.
- `可迁移经验` contains exactly: 可直接复用的机制、只能有限类比的部分、不应照搬的部分.
- Each case includes degraded operation, timeout, partial failure, recovery verification, and a condition for stopping automation.
- Draw.io/SVG geometry is measured in final CSS pixels at 800px desktop width and inspected at desktop `1440x1000` and mobile `390x844`.

---

## File Map

**Create**

- `tests/agt-reference-cases.test.mjs` — exact metadata, headings, evidence boundary, diagram topology, failures, and source contracts.
- `content/cases/multi-agent-research-system.mdx`
- `diagrams/multi-agent-research-system.drawio`
- `static/img/diagrams/multi-agent-research-system.svg`
- `content/cases/long-running-coding-agent.mdx`
- `diagrams/long-running-coding-agent.drawio`
- `static/img/diagrams/long-running-coding-agent.svg`
- `content/cases/production-incident-response-agent.mdx`
- `diagrams/production-incident-response-agent.drawio`
- `static/img/diagrams/production-incident-response-agent.svg`

**Modify**

- `data/source-ledger.json` — case citations and three original diagrams.
- `data/source-link-health.json` — checks for new remote sources.
- Generated case catalog files written by `npm run generate:content`.

## Visual Decisions

All three cases use `Draw.io + SVG`: each has more than seven primary nodes, multiple trust/state boundaries, labeled control and recovery connectors, and the topology is a core teaching asset.

### Task 1: Establish the reference-case contract

**Files:** Create `tests/agt-reference-cases.test.mjs`.

**Interfaces:** Consumes `tests/fixtures/agentic-topic-system.json`; produces shared assertions for all three case tasks.

- [ ] **Step 1: Write the failing inventory and heading test**

```js
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';
import {findMarkdownHeadings, parseFrontMatter} from '../scripts/content-metadata.mjs';

const registry = JSON.parse(readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'));
const expectedH2 = ['学习问题','一页摘要','事实边界','架构图','控制权与任务流','关键源码导读','架构决策与权衡','生产化分析','可迁移经验','来源'];

test('the three approved reference cases exist with the fixed contract', () => {
  for (const item of registry.cases) {
    assert.equal(existsSync(item.file), true, item.file);
    const source = readFileSync(item.file, 'utf8');
    assert.equal(parseFrontMatter(source).content_type, 'case');
    assert.deepEqual(findMarkdownHeadings(source).filter(({level}) => level === 2).map(({text}) => text), expectedH2);
    assert.match(source, /参考设计/u);
    assert.match(source, /不证明.*生产/u);
  }
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/agt-reference-cases.test.mjs`

Expected: FAIL on the first missing case.

- [ ] **Step 3: Add reusable assertions**

Add helpers that assert exact route, series `ai-native`, catalog order, evidence labels `已证实事实` / `基于证据的推断` / `个人分析`, the three transfer H3s, one responsive diagram wrapper, five required failure categories, and a governed `data/source-ledger.json` document record.

- [ ] **Step 4: Commit the red contract**

```bash
git add tests/agt-reference-cases.test.mjs
git commit -m "test(agentic): define reference case contracts"
```

The test intentionally remains red until Tasks 2–4 finish; run the per-case test names added in each task to keep each intermediate commit green for its own scope.

### Task 2: Publish the multi-agent research system reference case

**Files:** Create case MDX, `diagrams/multi-agent-research-system.drawio`, and paired SVG; modify case test, source ledger, and link health.

**Interfaces:** Consumes AGT-P-02, AGT-P-06, and AGT-P-07; produces a reference decomposition/retrieval/synthesis topology.

- [ ] Add a named test `multi-agent research case contract` for exact metadata: slug `/cases/multi-agent-research-system`, `series: ai-native`, `catalog_order: 19`, source kinds `paper`, `engineering-blog`, `official-repository`, `original-illustration`, and migration targets `task-decomposition`, `evidence-sufficiency`, `fan-out-fan-in`.
- [ ] Assert exact diagram labels: `Research Orchestrator`, `Question Decomposer`, `Task Ledger`, `Research Workers`, `Retrieval Boundary`, `Evidence Store`, `Citation Verifier`, `Synthesis Agent`, `Human Review`, `Budget / Stop`.
- [ ] Run only the named test; expect missing article/assets failure.
- [ ] Write the case using one scenario: a research request decomposes into bounded questions, workers retrieve independently, evidence records preserve source identity, synthesis waits for coverage/conflict checks, and citation verification can force another bounded retrieval round or abstention. The orchestrator owns task completion; workers never write the final answer directly.
- [ ] Include failure rows for duplicate questions, poisoned source, conflicting evidence, worker timeout, partial coverage, synthesis hallucination, citation mismatch, and budget exhaustion. Stop automation when evidence authority is inadequate or a material contradiction cannot be resolved.
- [ ] In `关键源码导读`, inspect governed ReAct/Self-RAG mechanisms and an official multi-agent research implementation if source intake confirms one; clearly state that the complete reference topology is an original synthesis.
- [ ] Create the paired diagram with regions `Control`, `Parallel research`, `Evidence authority`, `Review/terminal`. Register `src-atlas-multi-agent-research-system` as original illustration.
- [ ] Validate the pair with required labels `Research Orchestrator`, `Evidence Store`, `Citation Verifier`, `Human Review`, and `Budget / Stop`; run the named test, source tests, and content validation; expect PASS.
- [ ] Commit `feat(agentic): add multi-agent research reference case`.

### Task 3: Publish the long-running Coding Agent reference case

**Files:** Create case MDX, `diagrams/long-running-coding-agent.drawio`, paired SVG; modify case test, source ledger, and link health.

**Interfaces:** Consumes AGT-C-02, AGT-C-04, AGT-C-05, AGT-P-04, and AGT-P-08; produces a harness/sandbox/checkpoint/test-feedback reference topology.

- [ ] Add named test `long-running coding agent case contract` for exact metadata: slug `/cases/long-running-coding-agent`, series `ai-native`, order 20, source kinds `engineering-blog`, `official-repository`, `source-code`, `original-illustration`, and migration targets `agent-harness`, `sandboxed-execution`, `checkpoint-recovery`, `test-feedback`.
- [ ] Assert exact diagram labels: `Task Intake`, `Agent Harness`, `Plan / Progress Ledger`, `Coding Loop`, `Isolated Worktree`, `Sandbox`, `Test Runner`, `Checkpoint Store`, `Approval Gate`, `Version Control`, `Recovery / Reconcile`.
- [ ] Run the named test; expect FAIL.
- [ ] Write the case around an isolated repository task. The Harness assembles context and tools; the Loop edits only inside a worktree/sandbox; tests provide structured observation; progress and commits are durable checkpoints; risky commands and external publication require approval. A model context window is never the only record of completed work.
- [ ] Include failure rows for context loss, stale plan, test flake, sandbox escape attempt, destructive command, dependency drift, partial commit, credential expiry, and restart after unknown external effect. Recovery begins from repository/checkpoint truth and reruns verification.
- [ ] Use Anthropic long-running harness articles as first-party evidence and governed OpenAI/LangGraph/Temporal sources for bounded mechanisms. Do not claim any one vendor implements the complete reference case.
- [ ] Create the paired diagram with boundaries `Harness control`, `Isolated execution`, `Durable state`, `External authority`. Register `src-atlas-long-running-coding-agent`.
- [ ] Validate pair labels, named test, density analyzer for this case, source governance, and content validation; expect PASS.
- [ ] Commit `feat(agentic): add long-running coding agent reference case`.

### Task 4: Publish the production incident-response Agent reference case

**Files:** Create case MDX, `diagrams/production-incident-response-agent.drawio`, paired SVG; modify case test, source ledger, and link health.

**Interfaces:** Consumes AGT-C-05, AGT-C-06, AGT-P-03, AGT-P-04, AGT-P-05, and AGT-P-08; produces a read-only-first diagnosis/approval/change/verification reference topology.

- [ ] Add named test `incident response agent case contract` for exact metadata: slug `/cases/production-incident-response-agent`, series `ai-native`, order 21, source kinds `textbook`, `standard`, `official-docs`, `original-illustration`, and migration targets `read-only-diagnosis`, `hypothesis-evaluation`, `human-approval`, `recovery-verification`.
- [ ] Assert exact diagram labels: `Alert / Incident`, `Policy Router`, `Read-only Diagnostic Agent`, `Telemetry`, `Hypothesis Ledger`, `Evaluator`, `Incident Commander`, `Approval Gate`, `Change Executor`, `Authority Systems`, `Recovery Verifier`, `Manual Control`.
- [ ] Run the named test; expect FAIL.
- [ ] Write the case with strict phases: intake and severity policy; read-only evidence gathering; versioned hypotheses with disconfirming evidence; evaluator ranking; incident commander approval; narrow idempotent change; recovery verification against service indicators; rollback or manual control. Diagnosis tools and change tools use separate identities.
- [ ] Include failure rows for stale telemetry, missing trace correlation, alert storm, plausible-but-wrong hypothesis, approval timeout, concurrent human change, unknown change result, rollback failure, and false recovery. Automation stops on data uncertainty, conflicting authority, safety boundary, or exhausted change budget.
- [ ] Reuse governed Google SRE incident-management/monitoring sources, NIST AI RMF, least-privilege/idempotency material, and existing Kong/Temporal cases. State that the incident and results are illustrative.
- [ ] Create the paired diagram with boundaries `Read-only control`, `Human command`, `Write execution`, `Service authority`. Register `src-atlas-production-incident-response-agent`.
- [ ] Validate pair labels, named test, case density, source governance, and content validation; expect PASS.
- [ ] Commit `feat(agentic): add incident response agent reference case`.

### Task 5: Verify the complete case phase

**Files:** Modify only concrete defects found in the three case pages, diagrams, catalog projection, or sources.

- [ ] Run the complete `node --test tests/agt-reference-cases.test.mjs`; expect all three named contracts and shared contract PASS.
- [ ] Run `npm run report:writing-density`; require every new case to remain above the repository’s accepted density threshold and manually inspect any low-information block.
- [ ] Run all three Draw.io/SVG validator commands with each case’s required labels, then `node --test tests/drawio-diagram-validator.test.mjs tests/case-catalog.test.mjs tests/case-prose-boundaries.test.mjs`.
- [ ] Run `npm run generate:content` and `npm run verify`; expect PASS.
- [ ] Serve the build and inspect all three routes at desktop/mobile. Record exact 800px desktop widths, final scales, named-node baselines/clearances, local mobile scroll, no document overflow, focus/keyboard scroll, visible failure/recovery paths, HTTP 200, and zero console errors.
- [ ] Commit deterministic catalog projections and verified corrections as `test(agentic): verify reference cases`.
