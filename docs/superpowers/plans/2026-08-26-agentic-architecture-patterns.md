# Agentic Architecture Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish eight standard Agent control patterns that turn the foundational vocabulary into explicit control, termination, failure, and recovery choices.

**Architecture:** Each pattern is a standalone `pattern` topic with the repository’s fixed eleven-section contract. Simple control flows use Mermaid, decision-heavy comparisons use tables, and the two multi-boundary teaching assets use synchronized Draw.io/SVG pairs.

**Tech Stack:** Docusaurus MDX, Node.js 24 tests, Mermaid, Draw.io + SVG, JSON pattern registry and source ledger.

## Global Constraints

- Execute after `2026-08-26-agentic-architecture-foundations.md` records scoped Foundations PASS: zero Foundations defects, completed browser QA, and only the finite later-owned Pattern-group/generated-projection/forward-route blockers defined by the master plan.
- Work only in `.worktrees/agentic-architecture-topic-system` on `codex/agentic-architecture-topic-system`.
- Use globally unique IDs `AGT-P-01` through `AGT-P-08` and exact routes `/patterns/agt-p-01` through `/patterns/agt-p-08`.
- Every pattern states the control owner, state owner, allowed side effects, loop/branch termination, failure and recovery path, quality trade-offs, migration path, and deterministic fallback.
- Agentic RAG is a retrieval-focused Agent Loop terminated by evidence sufficiency; it is not a peer layer beside Harness and Loop.
- Protocols demonstrate interoperability contracts only; they do not prove authorization, consistency, reliability, or governance.
- Use primary papers, specifications, official repositories, and first-party engineering material; separate facts, inference, and guidance.
- Apply TDD and commit each independently reviewable pattern.
- Close with a scoped Patterns gate: all Pattern-focused contracts and both Draw.io browser checks pass, generation is audited after Task 1 supplies the group prerequisite, and any remaining repository-wide failures form an exact finite set owned by Cases Tasks 2–4 or Release Tasks 1–4. Do not weaken validators, remove forward Case metadata, or create stubs.
- Fresh complete `npm run verify` PASS remains mandatory in Release Task 5 and before merge/publish.

---

## File Map

**Create**

- `tests/agt-patterns-content.test.mjs` — exact eight-pattern metadata, headings, mechanisms, visuals, sources, and group contract.
- `content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx`
- `content/patterns/agt-p-02-agentic-rag.mdx`
- `content/patterns/agt-p-03-planner-executor.mdx`
- `content/patterns/agt-p-04-evaluator-optimizer.mdx`
- `content/patterns/agt-p-05-router-model-dispatch.mdx`
- `content/patterns/agt-p-06-supervisor-handoff-agents-as-tools.mdx`
- `content/patterns/agt-p-07-orchestrator-workers-fanout-fanin.mdx`
- `content/patterns/agt-p-08-durable-agent-hitl.mdx`
- `diagrams/agt-p-06-control-ownership-models.drawio`
- `static/img/diagrams/agt-p-06-control-ownership-models.svg`
- `diagrams/agt-p-08-durable-agent-hitl.drawio`
- `static/img/diagrams/agt-p-08-durable-agent-hitl.svg`

**Modify**

- `data/pattern-groups.json` — replace empty `agent-control.topic_ids` with the exact eight IDs and update its description.
- `data/source-ledger.json` — article citations and two original diagrams.
- `data/source-link-health.json` — refreshed new remote source checks.

## Visual Decisions

| Article | Decision | Visual job |
| --- | --- | --- |
| AGT-P-01 | 无需图 | Decision matrix over uncertainty, side effects, duration, and risk |
| AGT-P-02 | Mermaid | Retrieval/evidence-sufficiency loop |
| AGT-P-03 | Mermaid | Planner/executor/validator control flow |
| AGT-P-04 | Mermaid | Generate/evaluate/revise/terminate loop |
| AGT-P-05 | Mermaid | Rule gate, model router, selected destination, fallback |
| AGT-P-06 | Draw.io + SVG | Side-by-side comparison of three control-ownership topologies |
| AGT-P-07 | Mermaid | Decompose, bounded parallel workers, fan-in, conflict resolution |
| AGT-P-08 | Draw.io + SVG | Long-running state, checkpoint, approval, side effect, resume/recovery |

### Task 1: Establish the pattern contract and public group

**Files:** Create `tests/agt-patterns-content.test.mjs`; modify `data/pattern-groups.json`.

**Interfaces:** Consumes `tests/fixtures/agentic-topic-system.json`; produces public `agent-control.topic_ids` in exact learning order.

- [ ] **Step 1: Write the failing group test**

```js
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const registry = JSON.parse(readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'));
const groups = JSON.parse(readFileSync('data/pattern-groups.json', 'utf8')).groups;

test('agent-control group exposes the eight approved patterns in order', () => {
  const group = groups.find(({id}) => id === 'agent-control');
  assert.deepEqual(group.topic_ids, registry.patterns.map(({id}) => id));
  assert.equal(group.description, '从确定性工作流到检索循环、多 Agent 控制与可恢复执行。');
});
```

- [ ] **Step 2: Run and observe the empty-group failure**

Run: `node --test tests/agt-patterns-content.test.mjs`

Expected: FAIL because `agent-control.topic_ids` is empty.

- [ ] **Step 3: Fill the group with `AGT-P-01...AGT-P-08` and exact description**
- [ ] **Step 4: Run `node --test tests/agt-patterns-content.test.mjs tests/content-registries.test.mjs`; expect PASS**
- [ ] **Step 5: Commit `feat(agentic): register agent control pattern group`**

### Task 2: Publish AGT-P-01 Workflow vs Autonomous Agent

**Files:** Create the AGT-P-01 MDX; modify pattern test and source ledger.

**Interfaces:** Consumes AGT-C-01 and AGT-C-03; produces the autonomy decision matrix referenced by all later patterns.

- [ ] Add a failing test for exact pattern headings, `depends_on: [AGT-C-01, AGT-C-03]`, and a decision table with rows `已知步骤/低不确定性`, `开放步骤/可验证结果`, `高风险副作用`, `长时可恢复任务`.
- [ ] Run the focused test; expect missing article failure.
- [ ] Write the article around four axes: task uncertainty, result verifiability, side-effect risk, and execution duration. Define a progressive path `deterministic code → workflow with model step → bounded agent loop → durable/multi-agent` and an explicit rollback to deterministic workflow.
- [ ] Cite Anthropic *Building Effective Agents* and OpenAI *A Practical Guide to Building Agents*; do not claim their taxonomy is an industry standard.
- [ ] Run focused test, content validation, terminology, and source-ledger test; expect PASS.
- [ ] Commit `feat(agentic): add workflow versus agent pattern`.

### Task 3: Publish AGT-P-02 Agentic RAG

**Files:** Create the AGT-P-02 MDX; modify pattern test, source ledger, and link-health cache.

**Interfaces:** Consumes AGT-C-03, AGT-C-04, and AGT-C-06; produces the evidence-sufficiency loop used by the research case.

- [ ] Add a failing test for standard headings, Mermaid states `形成查询`, `检索`, `读取与归因`, `证据充分性评估`, `改写或扩展查询`, `回答`, `拒答`, plus stop conditions for sufficient, exhausted, contradictory, and unsafe evidence.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article with a baseline-RAG versus Agentic-RAG table. Define evidence sufficiency using coverage, authority, freshness, agreement, and attribution; keep the evaluator fallible; bound query count, token cost, elapsed time, and source diversity. Include prompt injection and poisoned retrieval paths.
- [ ] Register/cite the original RAG paper, FLARE, Self-RAG, ReAct, and the Agentic RAG survey. Use original papers for core claims; use the survey for taxonomy/discovery only.
- [ ] Run focused test, `npm run validate:content`, `npm run check:terminology`, and source governance tests; expect PASS.
- [ ] Commit `feat(agentic): add evidence-bounded agentic rag pattern`.

### Task 4: Publish AGT-P-03 Planner–Executor

**Files:** Create the AGT-P-03 MDX; modify pattern test and source ledger.

**Interfaces:** Consumes AGT-C-03; produces explicit plan version, executor scope, and replan triggers.

- [ ] Add a failing test for Mermaid nodes `Goal`, `Planner`, `Versioned plan`, `Executor`, `Result validator`, and branches `continue`, `replan`, `stop`.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article distinguishing plan from authoritative task state. Require bounded plan size, step preconditions, executor least privilege, observation schema, stale-plan detection, replan budget, and stop-on-unknown-side-effect.
- [ ] Reuse Anthropic and OpenAI agent-pattern sources; use the fixed OpenAI Agents SDK deterministic-flow example only as implementation evidence.
- [ ] Run focused validation; expect PASS.
- [ ] Commit `feat(agentic): add planner executor pattern`.

### Task 5: Publish AGT-P-04 Evaluator–Optimizer

**Files:** Create the AGT-P-04 MDX; modify pattern test and source ledger.

**Interfaces:** Consumes AGT-C-03 and AGT-C-06; produces evaluation criteria, revision budget, and acceptance/abstention outputs.

- [ ] Add a failing test for the loop `Generate → Evaluate → Feedback → Revise`, with terminal `accept`, `reject`, `budget exhausted`, and `human review` branches.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article requiring an external rubric, preserved candidate/version history, evaluator uncertainty, independent checks for high-risk outputs, and regression tests. Explain correlated model errors and why a judge score is not truth.
- [ ] Cite Anthropic pattern/evaluation material and the governed OpenAI Agents SDK `llm_as_a_judge.py` as a bounded implementation example.
- [ ] Run focused validation; expect PASS.
- [ ] Commit `feat(agentic): add evaluator optimizer pattern`.

### Task 6: Publish AGT-P-05 Router and model-driven dispatch

**Files:** Create the AGT-P-05 MDX; modify pattern test and source ledger.

**Interfaces:** Consumes AGT-C-03; produces rule-gate/model-router/fallback ownership used by multi-agent routing.

- [ ] Add a failing test for a Mermaid flow with deterministic policy gate before model routing, one selected destination, confidence/unknown fallback, and no uncontrolled fan-out.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article separating policy routing, semantic classification, capability discovery, and load/cost routing. Cover ambiguous input, unavailable destination, version drift, adversarial routing, fallback, and route-level evaluation.
- [ ] Reuse governed OpenAI routing example and Kong/New API gateway cases; explain that traffic routing and task-control routing have analogous selection mechanics but different state and failure ownership.
- [ ] Run focused validation; expect PASS.
- [ ] Commit `feat(agentic): add router and model dispatch pattern`.

### Task 7: Publish AGT-P-06 Supervisor, Handoff, and Agents-as-Tools

**Files:** Create AGT-P-06 MDX, Draw.io source, SVG; modify pattern test and source ledger.

**Interfaces:** Consumes AGT-C-02, AGT-C-03, and AGT-C-04; produces the three-way control ownership comparison used by existing agent SDK/supervisor/A2A cases.

- [ ] Add a failing test for a comparison matrix with columns `下一步控制者`, `当前会话所有者`, `专家结果返回点`, `共享状态`, `停止责任`, and exact diagram labels `Supervisor`, `Worker Agent`, `Handoff`, `Active Agent`, `Agent as Tool`, `Parent Agent`.
- [ ] Run focused test; expect missing article/assets failure.
- [ ] Write the article: supervisor repeatedly delegates and retains global control; handoff moves active conversation/control; agent-as-tool delegates a bounded subtask and returns to the parent. Include mixed-topology risks, context leakage, ping-pong handoff, supervisor bottleneck, and human escalation.
- [ ] Create `agt-p-06-control-ownership-models` Draw.io/SVG with three separated regions and color-independent topology. Apply the exact 800px, padding, baseline, and label-clearance contract.
- [ ] Reuse governed OpenAI Agents SDK, LangGraph Supervisor, A2A, and Microsoft reference architecture sources; register `src-atlas-agt-p-06-control-ownership-models` as original illustration.
- [ ] Validate with:

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs diagrams/agt-p-06-control-ownership-models.drawio static/img/diagrams/agt-p-06-control-ownership-models.svg --label "Supervisor" --label "Handoff" --label "Agent as Tool" --label "Active Agent" --label "Parent Agent"
node --test tests/agt-patterns-content.test.mjs tests/drawio-diagram-validator.test.mjs
```

- [ ] Commit `feat(agentic): compare multi-agent control ownership patterns`.

### Task 8: Publish AGT-P-07 Orchestrator–Workers and Fan-out/Fan-in

**Files:** Create AGT-P-07 MDX; modify pattern test and source ledger.

**Interfaces:** Consumes AGT-C-03 and AGT-C-04; produces bounded decomposition and result-reconciliation semantics.

- [ ] Add a failing test for Mermaid nodes `Orchestrator`, `Task ledger`, three bounded workers, `Fan-in`, `Conflict resolver`, and terminal branches for complete, partial, and budget exhausted.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article distinguishing dynamic task decomposition from static parallelism. Require stable task IDs, concurrency budget, isolated worker context, duplicate suppression, partial-result policy, conflict resolution, and cancellation propagation.
- [ ] Cite Anthropic parallelization/orchestrator-worker material and reuse Microsoft/AWS orchestrator governed evidence; do not infer production scale from examples.
- [ ] Run focused validation; expect PASS.
- [ ] Commit `feat(agentic): add orchestrator workers pattern`.

### Task 9: Publish AGT-P-08 Durable Agent and Human-in-the-loop

**Files:** Create AGT-P-08 MDX, Draw.io source, SVG; modify pattern test and source ledger.

**Interfaces:** Consumes AGT-C-02, AGT-C-04, AGT-C-05, and AGT-C-06; produces pause/resume/replay/approval semantics used by coding and incident-response cases.

- [ ] Add a failing test for state rows `running`, `waiting`, `approval required`, `paused`, `resuming`, `completed`, `failed`, `manual terminal`; require operation IDs and checkpoint schema/version fields.
- [ ] Run focused test; expect missing article/assets failure.
- [ ] Write the article separating durable control state from external business truth. Cover checkpoint timing, deterministic replay boundary, code/model version drift, expired credentials, approval context, timeout while waiting, idempotent resume, cancellation, and reconciliation of unknown effects.
- [ ] Create `agt-p-08-durable-agent-hitl` Draw.io/SVG with control store, checkpoint, approval service, sandbox/tool, authority system, reconciliation, and manual terminal. Show recovery and rejection branches, not only happy path.
- [ ] Reuse Anthropic harness/managed-agent sources, governed LangGraph persistence/interrupt sources, Temporal workflow/history sources, and OpenAI HITL. Register original illustration source `src-atlas-agt-p-08-durable-agent-hitl`.
- [ ] Run paired-asset validator with labels `Checkpoint`, `Approval required`, `Resume`, `Result reconciliation`, `Manual terminal`, then focused tests and content validation; expect PASS.
- [ ] Commit `feat(agentic): add durable agent and human approval pattern`.

### Task 10: Verify the patterns phase

**Files:** Modify only defects found in the eight pattern pages, two diagram pairs, pattern group, or their governed sources.

- [ ] Run `node --test tests/agt-patterns-content.test.mjs tests/content-registries.test.mjs tests/topic-manifest.test.mjs tests/content-validation.test.mjs tests/source-ledger.test.mjs tests/source-license-inventory.test.mjs`; require zero Pattern-owned failures.
- [ ] Run `npm run generate:content` after the exact eight-ID Pattern group exists, inspect every topic-manifest and Pattern-registry diff, and keep only deterministic current projections.
- [ ] Run `npm run verify` as a downstream-blocker audit. A scoped Patterns PASS permits only an exact finite failure set caused by unpublished Case routes owned by Cases Tasks 2–4 or final reciprocal/index/path work owned by Release Tasks 1–4; any Pattern-owned failure must be fixed.
- [ ] Attempt the production build without changing broken-link policy. Serve it when successful; if only later-owned Case routes block it, record the exact routes and use the compiled development site for browser QA.
- [ ] Inspect all eight routes at `1440x1000` and `390x844`. For both Draw.io routes, record exact 800px desktop width, scale, named-node geometry, label clearance, local mobile scroll, fixed document width, focus indicator, keyboard scroll, visible labels, HTTP 200, and zero console errors.
- [ ] Declare scoped Patterns PASS only when focused defects are zero, deterministic generation and browser evidence are recorded, and every remaining repository-wide failure has one later named owner. Do not claim full verification PASS.
- [ ] Commit deterministic generated files or verified corrections as `test(agentic): verify agent control patterns`.
