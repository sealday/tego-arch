# Agentic Architecture Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish six foundational Agentic Architecture concepts and establish the globally unique registry that all later pattern and case work consumes.

**Architecture:** Add all 17 release items to the canonical backlog and a test fixture first, then implement one concept per red-green-commit cycle. The shared reference architecture lives with AGT-C-01; smaller concepts use Mermaid or tables according to the visual format gate.

**Tech Stack:** Docusaurus 3.10.2, MDX, Node.js 24 test runner, JSON registries, Mermaid, Draw.io + SVG, repository source ledger.

## Global Constraints

- Work only in `.worktrees/agentic-architecture-topic-system` on `codex/agentic-architecture-topic-system`.
- The release contains exactly 6 concepts, 8 patterns, and 3 cases and remains unpublished until every plan passes.
- `topic_id` is globally unique: concepts use `AGT-C-01` through `AGT-C-06`; patterns use `AGT-P-01` through `AGT-P-08`.
- Every knowledge article follows the repository heading contract and covers the relevant interaction, control, knowledge/context, state/memory, action/tools, and governance/evaluation planes.
- Model output is not business truth; every loop has explicit success, failure, budget-exhausted, and human-stop outcomes.
- Distinguish source fact, evidence-based inference, and author guidance; do not invent customers, production metrics, incidents, or guarantees.
- Use TDD, focused verification, `npm run verify` at phase gates, and frequent commits.
- For every visual, record exactly one of `无需图`, `Mermaid`, `Draw.io + SVG`, or `位图`; use the smallest form that teaches the architectural judgment.
- For Draw.io work, read and follow `creating-drawio-architecture-diagrams`, keep `.drawio` and `.svg` synchronized, and measure desktop/mobile rendering.

---

## File Map

**Create**

- `tests/fixtures/agentic-topic-system.json` — canonical inventory, route, file, type, order, and visual decision for all 17 release items.
- `tests/agt-foundations-content.test.mjs` — registry and six concept contracts.
- `content/concepts/agt-c-01-agent-system-boundary.mdx` — Model/Augmented LLM/Workflow/Agent boundary.
- `content/concepts/agt-c-02-agent-harness.mdx` — runtime and governance scaffold.
- `content/concepts/agt-c-03-agent-loop.mdx` — plan/act/observe/evaluate/terminate loop.
- `content/concepts/agt-c-04-context-memory-state-checkpoint.mdx` — information lifetime and authority.
- `content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx` — safe action boundary.
- `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx` — quality and policy loop.
- `diagrams/agt-c-01-agent-system-boundary.drawio` — editable shared reference architecture.
- `static/img/diagrams/agt-c-01-agent-system-boundary.svg` — published shared reference architecture.

**Modify**

- `docs/content-backlog.md` — add 14 knowledge topics and three case release tasks without altering existing `AGT-01...AGT-06` platform items.
- `data/source-ledger.json` — register new primary/first-party sources, six concept citation records, and the original diagram.
- `data/source-link-health.json` — refreshed transport checks for newly registered remote sources.

## Visual Decisions

| Article | Decision | Decisive criteria |
| --- | --- | --- |
| AGT-C-01 | Draw.io + SVG | More than 7 nodes, 3 boundaries, labeled connectors, core publication asset |
| AGT-C-02 | Mermaid | 6-node layered responsibility flow, short labels, likely to evolve |
| AGT-C-03 | Mermaid | 5-state loop with explicit terminal branches |
| AGT-C-04 | 无需图 | Lifecycle/authority matrix is clearer than a topology |
| AGT-C-05 | Mermaid | 6-step trust-boundary flow from intent to verified side effect |
| AGT-C-06 | 无需图 | Trace/Evaluation/Guardrail responsibility and failure table carries the judgment |

### Task 1: Register the atomic release inventory

**Files:**
- Create: `tests/fixtures/agentic-topic-system.json`
- Create: `tests/agt-foundations-content.test.mjs`
- Modify: `docs/content-backlog.md`

**Interfaces:**
- Produces: JSON object `{schema_version: 1, concepts: Topic[], patterns: Topic[], cases: Case[]}` consumed by all later topic-system tests.
- `Topic` fields: `{id, file, route, title, order, visual}`.
- `Case` fields: `{backlog_id, file, route, title, order, visual}`.

- [ ] **Step 1: Write the failing registry test**

```js
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const registry = JSON.parse(readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'));
const backlog = readFileSync('docs/content-backlog.md', 'utf8');

test('agentic topic registry is exact and globally unique', () => {
  assert.equal(registry.schema_version, 1);
  assert.equal(registry.concepts.length, 6);
  assert.equal(registry.patterns.length, 8);
  assert.equal(registry.cases.length, 3);
  const ids = [...registry.concepts, ...registry.patterns].map(({id}) => id);
  assert.equal(new Set(ids).size, 14);
  assert.deepEqual(ids, [
    'AGT-C-01','AGT-C-02','AGT-C-03','AGT-C-04','AGT-C-05','AGT-C-06',
    'AGT-P-01','AGT-P-02','AGT-P-03','AGT-P-04','AGT-P-05','AGT-P-06','AGT-P-07','AGT-P-08',
  ]);
  for (const item of [...registry.concepts, ...registry.patterns]) {
    assert.match(backlog, new RegExp(`- \\[[ x]\\] \\*\\*${item.id} P[0-3]`));
  }
  for (const item of registry.cases) assert.match(backlog, new RegExp(`- \\[[ x]\\] \\*\\*${item.backlog_id} P[0-3]`));
});
```

- [ ] **Step 2: Run the test and verify the fixture/backlog contract fails**

Run: `node --test tests/agt-foundations-content.test.mjs`

Expected: FAIL because `tests/fixtures/agentic-topic-system.json` does not exist.

- [ ] **Step 3: Add the exact inventory and backlog rows**

The fixture must list these routes in order:

```json
{
  "schema_version": 1,
  "concepts": [
    {"id":"AGT-C-01","file":"content/concepts/agt-c-01-agent-system-boundary.mdx","route":"/concepts/agt-c-01","title":"AI Agent 系统边界","order":1,"visual":"Draw.io + SVG"},
    {"id":"AGT-C-02","file":"content/concepts/agt-c-02-agent-harness.mdx","route":"/concepts/agt-c-02","title":"Agent Harness","order":2,"visual":"Mermaid"},
    {"id":"AGT-C-03","file":"content/concepts/agt-c-03-agent-loop.mdx","route":"/concepts/agt-c-03","title":"Agent Loop","order":3,"visual":"Mermaid"},
    {"id":"AGT-C-04","file":"content/concepts/agt-c-04-context-memory-state-checkpoint.mdx","route":"/concepts/agt-c-04","title":"Context、Memory、State 与 Checkpoint","order":4,"visual":"无需图"},
    {"id":"AGT-C-05","file":"content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx","route":"/concepts/agt-c-05","title":"Tool、Sandbox、Permission 与 Side Effect","order":5,"visual":"Mermaid"},
    {"id":"AGT-C-06","file":"content/concepts/agt-c-06-trace-evaluation-guardrail.mdx","route":"/concepts/agt-c-06","title":"Trace、Evaluation 与 Guardrail","order":6,"visual":"无需图"}
  ],
  "patterns": [
    {"id":"AGT-P-01","file":"content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx","route":"/patterns/agt-p-01","title":"Deterministic Workflow vs Autonomous Agent","order":1,"visual":"无需图"},
    {"id":"AGT-P-02","file":"content/patterns/agt-p-02-agentic-rag.mdx","route":"/patterns/agt-p-02","title":"Agentic RAG","order":2,"visual":"Mermaid"},
    {"id":"AGT-P-03","file":"content/patterns/agt-p-03-planner-executor.mdx","route":"/patterns/agt-p-03","title":"Planner–Executor","order":3,"visual":"Mermaid"},
    {"id":"AGT-P-04","file":"content/patterns/agt-p-04-evaluator-optimizer.mdx","route":"/patterns/agt-p-04","title":"Evaluator–Optimizer","order":4,"visual":"Mermaid"},
    {"id":"AGT-P-05","file":"content/patterns/agt-p-05-router-model-dispatch.mdx","route":"/patterns/agt-p-05","title":"Router 与模型驱动分发","order":5,"visual":"Mermaid"},
    {"id":"AGT-P-06","file":"content/patterns/agt-p-06-supervisor-handoff-agents-as-tools.mdx","route":"/patterns/agt-p-06","title":"Supervisor、Handoff 与 Agents-as-Tools","order":6,"visual":"Draw.io + SVG"},
    {"id":"AGT-P-07","file":"content/patterns/agt-p-07-orchestrator-workers-fanout-fanin.mdx","route":"/patterns/agt-p-07","title":"Orchestrator–Workers 与 Fan-out/Fan-in","order":7,"visual":"Mermaid"},
    {"id":"AGT-P-08","file":"content/patterns/agt-p-08-durable-agent-hitl.mdx","route":"/patterns/agt-p-08","title":"Durable Agent 与 Human-in-the-loop","order":8,"visual":"Draw.io + SVG"}
  ],
  "cases": [
    {"backlog_id":"CASE-21","file":"content/cases/multi-agent-research-system.mdx","route":"/cases/multi-agent-research-system","title":"多智能体研究系统","order":19,"visual":"Draw.io + SVG"},
    {"backlog_id":"CASE-22","file":"content/cases/long-running-coding-agent.mdx","route":"/cases/long-running-coding-agent","title":"长时运行 Coding Agent","order":20,"visual":"Draw.io + SVG"},
    {"backlog_id":"CASE-23","file":"content/cases/production-incident-response-agent.mdx","route":"/cases/production-incident-response-agent","title":"生产事故响应 Agent","order":21,"visual":"Draw.io + SVG"}
  ]
}
```

Add unchecked backlog rows for all 17 items. Keep the existing `AGT-01...AGT-06` Agent platform rows unchanged.

- [ ] **Step 4: Run registry and global backlog tests**

Run: `node --test tests/agt-foundations-content.test.mjs tests/backlog-topics.test.mjs tests/project-status.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the inventory**

```bash
git add docs/content-backlog.md tests/fixtures/agentic-topic-system.json tests/agt-foundations-content.test.mjs
git commit -m "test(agentic): register topic-system release inventory"
```

### Task 2: Publish AGT-C-01 and the shared reference architecture

**Files:**
- Create: `content/concepts/agt-c-01-agent-system-boundary.mdx`
- Create: `diagrams/agt-c-01-agent-system-boundary.drawio`
- Create: `static/img/diagrams/agt-c-01-agent-system-boundary.svg`
- Modify: `tests/agt-foundations-content.test.mjs`
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`

**Interfaces:**
- Produces: the canonical boundary vocabulary and `/concepts/agt-c-01`, depended on by every later knowledge topic.
- Required diagram labels: `User / Event`, `Policy & Routing`, `Agent Harness`, `Agent Loop`, `Knowledge / Retrieval`, `Tools / Sandbox`, `State`, `Memory`, `Checkpoint`, `Trace / Evaluation / Guardrail`.

- [ ] **Step 1: Extend the test with exact metadata, headings, claims, and diagram paths**

Assert `topic_id: AGT-C-01`, slug `/concepts/agt-c-01`, concept H2 order from `knowledgeTypeContracts.concept`, and visible statements equivalent to:

```js
const requiredClaims = [
  'Model 生成候选输出，不拥有任务控制权',
  'Augmented LLM 增加检索、工具或记忆能力，但不必拥有循环',
  'Workflow 的步骤和分支主要由代码预先定义',
  'Agent 让模型在受约束边界内选择下一步动作',
  '自治程度是连续谱，不是四个互斥产品类别',
];
```

Also assert the responsive diagram wrapper and both paired assets exist.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/agt-foundations-content.test.mjs`

Expected: FAIL because AGT-C-01 and its assets do not exist.

- [ ] **Step 3: Write the article and diagram pair**

Use frontmatter relations `depends_on: []`, `adjacent_topics: [AGT-C-02, AGT-C-03, AGT-P-01]`, and related cases `/cases/openai-agents-sdk` and `/cases/kubernetes-reconciliation-loop`. The article must include a four-row boundary table, the six-plane ownership matrix, a deterministic workflow fallback, and the shared reference diagram.

Apply the Draw.io geometry contract at the final 800px desktop width: 16/14px node padding, 22px title/type baseline gap, 14px bottom clearance, and 8/16/12px edge-label clearance from stroke/arrow/node. Embed the SVG in the focusable `architecture-diagram-scroll` wrapper.

- [ ] **Step 4: Register sources and original illustration**

Register/reuse citations for Anthropic *Building Effective Agents* and OpenAI *A Practical Guide to Building Agents* with `facts-summary`, plus original source ID `src-atlas-agt-c-01-agent-system-boundary` with `LicenseRef-Atlas-Original` and `original-illustration`.

- [ ] **Step 5: Validate the article and paired asset**

Run:

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs diagrams/agt-c-01-agent-system-boundary.drawio static/img/diagrams/agt-c-01-agent-system-boundary.svg --label "Agent Harness" --label "Agent Loop" --label "Knowledge / Retrieval" --label "Tools / Sandbox" --label "Checkpoint"
node --test tests/agt-foundations-content.test.mjs tests/drawio-diagram-validator.test.mjs
npm run validate:content
```

Expected: all PASS.

- [ ] **Step 6: Commit AGT-C-01**

```bash
git add content/concepts/agt-c-01-agent-system-boundary.mdx diagrams/agt-c-01-agent-system-boundary.drawio static/img/diagrams/agt-c-01-agent-system-boundary.svg data/source-ledger.json data/source-link-health.json tests/agt-foundations-content.test.mjs
git commit -m "feat(agentic): add agent system boundary concept"
```

### Task 3: Publish AGT-C-02 Agent Harness

**Files:** Create `content/concepts/agt-c-02-agent-harness.mdx`; modify `tests/agt-foundations-content.test.mjs`, `data/source-ledger.json`, and `data/source-link-health.json`.

**Interfaces:** Consumes AGT-C-01 vocabulary; produces the Harness responsibility contract used by AGT-C-03, AGT-P-06, AGT-P-08, and the coding-agent case.

- [ ] Write a failing contract asserting the standard concept headings, `depends_on: [AGT-C-01]`, a six-row Harness responsibility table, and a Mermaid layered flow containing runtime, context assembly, tool registry, permission/sandbox, checkpoint/recovery, and trace/eval hooks.
- [ ] Run `node --test tests/agt-foundations-content.test.mjs`; expect FAIL because AGT-C-02 is missing.
- [ ] Write the article around the invariant “Harness constrains and operates the Loop; it does not decide the task by itself.” Include the thin-SDK counterexample, context/tool budget ownership, permission enforcement point, crash recovery, and a table of what Harness proves/does not prove.
- [ ] Register Anthropic *Effective Harnesses for Long-Running Agents*, *Harness Design for Long-Running Application Development*, and *Managed Agents* as first-party engineering sources with `LicenseRef-All-Rights-Reserved`, `facts-and-short-quotation`, and `facts-summary` citations.
- [ ] Run `node --test tests/agt-foundations-content.test.mjs && npm run validate:content && npm run check:terminology`; expect PASS.
- [ ] Commit with `git commit -am "feat(agentic): add agent harness concept"` after explicitly staging the new MDX file.

### Task 4: Publish AGT-C-03 Agent Loop

**Files:** Create `content/concepts/agt-c-03-agent-loop.mdx`; modify `tests/agt-foundations-content.test.mjs` and `data/source-ledger.json`.

**Interfaces:** Consumes AGT-C-01 and AGT-C-02; produces the Plan/Act/Observe/Evaluate/Terminate vocabulary used by all eight patterns.

- [ ] Add a failing test for the five loop phases, four terminal outcomes (`success`, `failure`, `budget exhausted`, `human stop`), standard concept headings, and a Mermaid loop with no edge that bypasses evaluation.
- [ ] Run the focused test; expect missing article failure.
- [ ] Write the article with `depends_on: [AGT-C-01, AGT-C-02]`, separate model-selected next action from code-enforced limits, explain observation as structured environment feedback, and reject infinite “until good” loops.
- [ ] Cite ReAct for interleaved reasoning/action and Anthropic *Building Effective Agents* for the workflow/agent distinction; state that ReAct demonstrates a prompting/interaction pattern, not a production runtime guarantee.
- [ ] Run focused test, content validation, and terminology check; expect PASS.
- [ ] Commit `feat(agentic): add agent loop concept`.

### Task 5: Publish AGT-C-04 Context, Memory, State, and Checkpoint

**Files:** Create `content/concepts/agt-c-04-context-memory-state-checkpoint.mdx`; modify `tests/agt-foundations-content.test.mjs` and `data/source-ledger.json`.

**Interfaces:** Produces the information-lifecycle matrix consumed by Agentic RAG, multi-agent coordination, durable execution, and all three cases.

- [ ] Add a failing test requiring a four-row matrix with columns `内容`, `生命周期`, `权威性`, `写入者`, `恢复用途`, plus the sentence `Memory 不承载共享业务真相`.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article without a diagram. Define Context as current inference input, Memory as retained preference/experience, State as explicit task/business facts, and Checkpoint as resumable execution snapshot; cover stale memory, checkpoint/schema drift, replay, and deletion/retention.
- [ ] Reuse governed LangGraph persistence, interrupt, and fault-tolerance sources; cite only their documented behavior and do not generalize one framework’s state model to all agents.
- [ ] Run focused test and `npm run validate:content`; expect PASS.
- [ ] Commit `feat(agentic): separate context memory state and checkpoint`.

### Task 6: Publish AGT-C-05 Tool, Sandbox, Permission, and Side Effect

**Files:** Create `content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx`; modify `tests/agt-foundations-content.test.mjs` and `data/source-ledger.json`.

**Interfaces:** Produces the action safety contract consumed by durable agents, coding agents, and incident response.

- [ ] Add a failing test requiring a read/write/destructive action matrix and Mermaid flow `Intent → Policy → Sandbox → Tool → Authority → Result verification`, with an approval branch before irreversible effects.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article with `depends_on: [AGT-C-01, AGT-C-02, AGT-C-03]`. Separate tool schema from authorization, sandbox containment from identity, timeout from known failure, and stable operation ID from transport request ID. Include least privilege, default deny, idempotency, result query, compensation, and credential revocation.
- [ ] Reuse governed MCP architecture, OpenAI Agents SDK tool/guardrail sources, PR-09, PR-10, and NIST governance sources. State that MCP exposes capabilities but does not grant safe authorization automatically.
- [ ] Run focused test, content validation, and terminology; expect PASS.
- [ ] Commit `feat(agentic): add tool sandbox and side-effect boundaries`.

### Task 7: Publish AGT-C-06 Trace, Evaluation, and Guardrail

**Files:** Create `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx`; modify `tests/agt-foundations-content.test.mjs`, `data/source-ledger.json`, and `data/source-link-health.json`.

**Interfaces:** Produces the quality/governance contract consumed by Evaluator–Optimizer, Agentic RAG, durable execution, and production cases.

- [ ] Add a failing test requiring three distinct responsibilities (`记录`, `判断质量`, `执行约束`), offline/online evaluation rows, trace correlation fields, and guardrail bypass/fail-closed cases.
- [ ] Run focused test; expect FAIL.
- [ ] Write the article without a diagram. Explain that traces are evidence, evaluations transform evidence into quality judgments, and guardrails enforce policy before/after model or tool actions. Include evaluator drift, judge bias, missing spans, policy bypass, false positives, and human escalation.
- [ ] Register Anthropic *Demystifying Evals for AI Agents* and OpenTelemetry semantic conventions; reuse NIST AI RMF. Use facts-summary only and identify recommendations as author guidance.
- [ ] Run focused test, source-ledger tests, content validation, and terminology; expect PASS.
- [ ] Commit `feat(agentic): distinguish traces evaluations and guardrails`.

### Task 8: Verify the foundations phase

**Files:** Modify only files needed to fix phase defects; do not add cross-links to unpublished pattern/case routes yet.

- [ ] Run `node --test tests/agt-foundations-content.test.mjs tests/topic-manifest.test.mjs tests/content-validation.test.mjs tests/source-ledger.test.mjs tests/source-license-inventory.test.mjs tests/source-link-health.test.mjs`.
- [ ] Run `npm run generate:content` and inspect generated changes; keep only deterministic projections caused by the six published concepts and the 17-item backlog registry.
- [ ] Run `npm run verify`; expect PASS.
- [ ] Serve the build and inspect `/tego-arch/concepts/agt-c-01` through `/agt-c-06` at `1440x1000` and `390x844`; for AGT-C-01 record exact 800px desktop SVG width, local mobile overflow, no document overflow, keyboard focus/scroll, label visibility, and measured geometry.
- [ ] Record defects and fixes in the commit body, then commit generated projections or QA corrections as `test(agentic): verify foundation concepts`.
