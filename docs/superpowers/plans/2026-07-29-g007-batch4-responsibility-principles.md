# G007 Batch 4 Responsibility Principles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish PR-12 through PR-14 as a governed, test-first G007 batch that separates extension and client contracts, domain and persistence responsibilities, and GRASP responsibility assignment.

**Architecture:** Add three independent principle MDX pages behind one real-content contract, register and observe every cited source before drafting factual conclusions, and derive navigation, source totals, and project status through the existing generators. Deliver through Stage A content publication and Stage B evidence-backed closure while leaving G007 active, PR-15 next, and PR-15 through PR-17 unpublished.

**Tech Stack:** Docusaurus MDX, Node.js 24 `node:test`, Bun 1.3.13 repository commands, JSON source ledger and reviewed link-health cache, generated topic manifest/status/relations, GitHub Pages.

## Global Constraints

- The approved design is `docs/superpowers/specs/2026-07-29-actions-node24-g007-batch4-design.md`; source decisions are grounded in `.superpowers/sdd/source-research.md`.
- Gate 1 is already complete at base `d1c265db1a8750d9cb1f6f0773128137d736abee`. Do not edit `.github/workflows/deploy.yml`, `.github/workflows/link-health.yml`, `tests/workflow-configuration.test.mjs`, or repeat the action-runtime deployment gate.
- Scope is exactly PR-12, PR-13, and PR-14. PR-15 through PR-17 stay unchecked, unpublished, absent from generated routes, and absent from visible navigation.
- PR-12, PR-13, and PR-14 use `priority: P1`, `content_type: principle`, and `status: reviewed`.
- Each page uses the exact nine-H2 contract: `学习问题`, `要保护的性质`, `冲突与适用上下文`, `机制`, `误用与反原则`, `适用尺度`, `相邻原则`, `说明性场景`, `来源`.
- Each page has three to five learning questions, one original deterministic table or Mermaid flow, explicit `来源事实`, `推断`, and `本站分析` labels, plus an explicit failure mode, non-use condition, scale boundary, and operational cost.
- PR-12 treats Open/Closed and Interface Segregation as related but distinct decisions; it rejects “use interfaces everywhere” and “existing code must never change.”
- PR-13 treats Persistence Ignorance as domain-decision independence where useful, not storage ignorance; it rejects ORM necessity, a universal annotation ban, and cost-free persistence.
- PR-14 covers all nine named GRASP patterns as interacting responsibility heuristics and rejects Controller-as-god-object and Information-Expert-as-data-holder interpretations.
- Use facts summaries only for the seven researched source identities. Do not reproduce source figures, diagrams, tables, code listings, book examples, protected taxonomies, or extended prose.
- Source governance precedes content. A source is not healthy until a policy-accepted live observation is reviewed and committed; transport recovery preserves canonical citation identity and records the approved expected transport.
- Front matter is the canonical relationship input. Run `bun run generate:content`; do not hand-edit generated projections.
- The reciprocal graph is exact: PR-12 ↔ PR-01/PR-02/PR-03/PR-04/PR-05/PR-08/PR-14; PR-13 ↔ PR-03/PR-04/PR-11; PR-14 ↔ PR-02/PR-03/PR-04/PR-12.
- Existing pages change only for those accurate reciprocal links and their visible `相邻原则` prose.
- Follow TDD. The first RED is caused by the three missing MDX pages, not broken test syntax, missing imports, source registration, generated drift, or fixture edits.
- Use the two-stage release. Stage A publishes content while PR-12 through PR-14 remain unchecked; Stage B records literal immutable deployment evidence and then closes exactly those three rows.
- Stage A must report 79 content documents and 33 completed topics. Its governed-source count is measured from the final validated ledger after source registration, then copied as an exact integer into affected fixtures and review evidence.
- Stage B must report 79 content documents and exactly 36 completed topics; its governed-source count remains the exact Stage A-derived integer.
- G007 remains current after Stage B and is not checkpointed. Durable-story progress stays `6 / 20`, G006 stays the most recently completed parent story, and PR-15 becomes the next pending principle.
- Historical deployment tests and historical review evidence are immutable. Earlier G007 content tests may change only their unpublished-route ranges and exact reciprocal relationship fixtures.
- Every task receives an independent requirements/content/test review before its commit. Resolve all findings within that task and rerun its targeted gate.
- Use Bun for repository scripts and ordinary test selections. Run nested `node:test` suites such as `tests/source-ledger.test.mjs` with `node --test` if Bun’s nested-test compatibility is insufficient.
- Do not add dependencies or restructure the content platform.

---

## File Structure

### Create

- `tests/g007-batch4-content.test.mjs` — real-repository contract for metadata, distinctions, misconceptions, governed visible sources, reciprocal relations, terminal links, and unpublished routes.
- `content/principles/pr-12-open-closed-interface-segregation.mdx` — extension ownership/cost and coherent client-capability boundary.
- `content/principles/pr-13-persistence-ignorance.mdx` — domain, mapping, transaction, query, and explicit persistence-optimization boundary.
- `content/principles/pr-14-grasp-responsibility-assignment.mdx` — nine-pattern responsibility-assignment decision system.
- `docs/reviews/g007-batch4.md` — independent review, exact Stage A SHA/run, live browser/click/source evidence, and Stage B verdict.
- `tests/g007-batch4-deployment.test.mjs` — immutable exact-evidence regression that rejects missing, duplicate, or contradictory SHA/run evidence.

### Modify

- `data/source-ledger.json` — register seven researched sources and three governed document entries before content is written.
- `data/source-link-health.json` — commit only reviewed live observations keyed by the approved checker transports.
- `docs/source-license-inventory.md` — add one audited license-family row for each of the seven new canonical identities.
- `content/principles/pr-01-information-hiding.mdx` — reciprocal PR-12 relation only.
- `content/principles/pr-02-cohesion-coupling.mdx` — reciprocal PR-12 and PR-14 relations only.
- `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx` — reciprocal PR-12, PR-13, and PR-14 relations only.
- `content/principles/pr-04-dip-ioc-dependency-injection.mdx` — reciprocal PR-12, PR-13, and PR-14 relations only.
- `content/principles/pr-05-composition-over-inheritance.mdx` — reciprocal PR-12 relation only.
- `content/principles/pr-08-evolutionary-design.mdx` — reciprocal PR-12 relation only.
- `content/principles/pr-11-cqs-cqrs-read-write-separation.mdx` — reciprocal PR-13 relation only.
- `tests/g007-batch1-content.test.mjs` — advance unpublished assertions from PR-12..17 to PR-15..17 and accept the exact new reciprocal fixtures.
- `tests/g007-batch2-content.test.mjs` — advance unpublished assertions from PR-12..17 to PR-15..17 and accept the exact new reciprocal fixtures.
- `tests/g007-batch3-content.test.mjs` — advance unpublished assertions from PR-12..17 to PR-15..17 and accept the exact new reciprocal fixtures.
- `tests/content-review-health.test.mjs` — Stage A document total 76→79 and exact ledger-derived source total.
- `tests/source-ledger-rendering.test.mjs` — exact ledger-derived rendered-card total.
- `tests/source-ledger-pagination.test.mjs` — exact ledger-derived per-tier totals, page counts, total IDs, and uniqueness.
- `tests/project-status.test.mjs` — Stage A 33 completed topics/79 documents/derived sources; Stage B 36 completed topics.
- `tests/knowledge-fixtures.test.mjs` — include PR-12 through PR-14 after Stage B closure.
- `docs/content-backlog.md` — Stage B only: close PR-12 through PR-14 and update the release baseline while leaving PR-15 next.

### Generated by `bun run generate:content`

- `src/generated/case-catalog.json`
- `src/generated/case-series.json`
- `src/generated/pattern-groups.json`
- `src/generated/topic-manifest.json`
- `src/generated/topic-indexes.json`
- `src/generated/project-status.json`
- `src/generated/source-ledger.json`

---

### Task 1: Create the failing G007 Batch 4 content contract

**Files:**

- Create: `tests/g007-batch4-content.test.mjs`
- Test: `tests/g007-batch4-content.test.mjs`

**Interfaces:**

- Consumes: `readContentDocuments`, `findMarkdownHeadings`, `extractInternalLinks`, `extractExternalLinks`, `src/generated/topic-manifest.json`, and `data/source-ledger.json`.
- Produces: One executable contract that Tasks 2–4 turn from RED to GREEN without weakening assertions.

- [ ] **Step 1: Write the complete failing real-content test**

Create `tests/g007-batch4-content.test.mjs` with these exact fixtures and helpers:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const expected = new Map([
  ['PR-12', [
    'principles/pr-12-open-closed-interface-segregation.mdx',
    '/principles/pr-12',
    'P1',
  ]],
  ['PR-13', [
    'principles/pr-13-persistence-ignorance.mdx',
    '/principles/pr-13',
    'P1',
  ]],
  ['PR-14', [
    'principles/pr-14-grasp-responsibility-assignment.mdx',
    '/principles/pr-14',
    'P1',
  ]],
]);
const h2 = [
  '学习问题',
  '要保护的性质',
  '冲突与适用上下文',
  '机制',
  '误用与反原则',
  '适用尺度',
  '相邻原则',
  '说明性场景',
  '来源',
];
const relationships = new Map([
  ['PR-12', ['PR-01', 'PR-02', 'PR-03', 'PR-04', 'PR-05', 'PR-08', 'PR-14']],
  ['PR-13', ['PR-03', 'PR-04', 'PR-11']],
  ['PR-14', ['PR-02', 'PR-03', 'PR-04', 'PR-12']],
]);
const routeByTopic = new Map([
  ['PR-01', '/principles/pr-01'],
  ['PR-02', '/principles/pr-02'],
  ['PR-03', '/principles/pr-03'],
  ['PR-04', '/principles/pr-04'],
  ['PR-05', '/principles/pr-05'],
  ['PR-08', '/principles/pr-08'],
  ['PR-11', '/principles/pr-11'],
  ['PR-12', '/principles/pr-12'],
  ['PR-13', '/principles/pr-13'],
  ['PR-14', '/principles/pr-14'],
]);
const solePrimary = new Map([
  ['PR-12', 'src-objectmentor-ocp-1996'],
  ['PR-13', 'src-nilsson-ddd-patterns-2006'],
  ['PR-14', 'src-larman-applying-uml-patterns-3e-2004'],
]);
const terminalLink = new Map([
  ['PR-12', /^\/(?:cases|questions)\//u],
  ['PR-13', /^\/(?:cases|questions)\//u],
  ['PR-14', /^\/(?:cases|questions)\//u],
]);

const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8')
    .then(JSON.parse),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8')
    .then(JSON.parse),
]);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);
const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function requiredDocument(id) {
  const document = byId.get(id);
  assert.ok(document, `${id} must be published`);
  return document;
}

function section(body, heading) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `missing ## ${heading}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start === -1 ? end : start + 1, end);
}
```

Add the canonical page and governance tests:

```js
test('publishes PR-12 through PR-14 with the principle contract', () => {
  for (const [id, [file, slug, priority]] of expected) {
    const document = requiredDocument(id);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'principle');
    assert.equal(document.metadata.priority, priority);
    assert.equal(document.metadata.status, 'reviewed');
    assert.deepEqual(document.metadata.adjacent_topics, relationships.get(id));
    assert.deepEqual(
      document.headings.filter(({level}) => level === 2).map(({text}) => text),
      h2,
    );
    const questions = section(document.body, '学习问题')
      .split(/\r?\n/u)
      .filter((line) => /^ {0,3}[-*+]\s+\S.*[?？]\s*$/u.test(line));
    assert.ok(questions.length >= 3 && questions.length <= 5, `${id} learning questions`);
    assert.match(
      document.body,
      /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu,
      `${id} original representation`,
    );
    assert.match(document.body, /\*\*来源事实：\*\*/u, `${id} fact label`);
    assert.match(document.body, /\*\*推断：\*\*/u, `${id} inference label`);
    assert.match(document.body, /\*\*本站分析：\*\*/u, `${id} site-analysis label`);
    assert.match(document.body, /失败模式/u, `${id} failure mode`);
    assert.match(document.body, /不适用|不采用/u, `${id} non-use condition`);
    assert.match(document.body, /运行成本|操作成本|协调成本/u, `${id} operational cost`);
  }
});

test('projects only the published Batch 4 boundary', () => {
  for (const id of expected.keys()) {
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
  for (let number = 15; number <= 17; number += 1) {
    assert.equal(topics.get(`PR-${number}`)?.published, false);
  }
});

test('governs every visible source and relationship', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has multiple governed sources`);
    const primary = governed.citations.filter(({manifest_primary}) => manifest_primary);
    assert.equal(primary.length, 1, `${id} has exactly one manifest primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary identity`);
    const visibleExternal = new Set(extractExternalLinks(document));
    for (const citation of governed.citations) {
      assert.ok(visibleExternal.has(citation.citation_url), `${id} visible ${citation.source_id}`);
    }
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id)) {
      assert.ok(links.has(routeByTopic.get(adjacent)), `${id} visibly links ${adjacent}`);
    }
    assert.ok(
      [...links].some((link) => terminalLink.get(id).test(link)),
      `${id} links a real case or learning question`,
    );
    assert.equal(
      [...links].some((link) => /^\/principles\/pr-1[5-7]$/u.test(link)),
      false,
      `${id} must not link unpublished principles`,
    );
  }
});
```

Add page-specific decision contracts:

```js
const decisionContracts = new Map([
  ['PR-12', [
    ['OCP absorbs evidenced variation', '要保护的性质', /Open\/Closed[^。；\n]*可能变化[^。；\n]*稳定政策[^。；\n]*扩展点/u],
    ['ISP constrains consumer dependencies', '要保护的性质', /Interface Segregation[^。；\n]*消费者[^。；\n]*所需能力/u],
    ['principles remain distinct', '要保护的性质', /一个回答变化在哪里被吸收[^。；\n]*另一个回答消费者依赖哪些能力/u],
    ['extension ownership and compatibility cost', '机制', /所有者、兼容性、测试与运行成本/u],
    ['strategic closure not universal closure', '冲突与适用上下文', /不可能对所有变化关闭|战略性关闭/u],
    ['coherent interfaces not fragments', '机制', /较小接口[^。；\n]*契约仍然内聚/u],
    ['fragmentation failure', '误用与反原则', /接口碎片化[^。；\n]*(?:适配器泛滥|编排泄漏)/u],
    ['interfaces everywhere rejected', '误用与反原则', /并非到处使用接口|不是所有位置都需要接口/u],
    ['existing code may change', '误用与反原则', /不意味着现有代码永远不能修改/u],
  ]],
  ['PR-13', [
    ['definition keeps decisions independent', '要保护的性质', /领域决策[^。；\n]*独立于持久化机制/u],
    ['storage behavior remains relevant', '要保护的性质', /不等于忽略存储行为/u],
    ['domain mapping repository split', '机制', /领域规则[^。；\n]*映射[^。；\n]*仓储/u],
    ['aggregate transaction boundary', '机制', /聚合[^。；\n]*事务边界/u],
    ['query models may bypass domain model', '机制', /报表|查询模型[^。；\n]*不必[^。；\n]*领域模型/u],
    ['leakage is named', '冲突与适用上下文', /身份、延迟加载、并发、批处理与查询形状/u],
    ['persistence-aware optimization is honest', '冲突与适用上下文', /显式[^。；\n]*持久化感知[^。；\n]*优化/u],
    ['ORM requirement rejected', '误用与反原则', /不要求 ORM|并非必须使用 ORM/u],
    ['annotation ban rejected', '误用与反原则', /不要求在所有上下文禁止持久化注解/u],
    ['database costs remain', '误用与反原则', /数据库与事务成本[^。；\n]*(?:不会消失|仍然存在)/u],
  ]],
  ['PR-14', [
    ['decision system not catalog', '要保护的性质', /责任分配决策系统[^。；\n]*不是模式名称目录/u],
    ['all nine patterns', '机制', /Information Expert[\s\S]*Creator[\s\S]*Controller[\s\S]*Low Coupling[\s\S]*High Cohesion[\s\S]*Polymorphism[\s\S]*Pure Fabrication[\s\S]*Indirection[\s\S]*Protected Variations/u],
    ['ownership dimensions', '机制', /信息、创建、协调、变化与基础设施责任/u],
    ['heuristics can conflict', '冲突与适用上下文', /不同方向|相互拉扯|发生冲突/u],
    ['controller is not god object', '误用与反原则', /Controller[^。；\n]*(?:不是|不应成为)[^。；\n]*(?:god object|上帝对象)/u],
    ['expert is not data holder', '误用与反原则', /Information Expert[^。；\n]*(?:不是|不等于)[^。；\n]*(?:数据持有者|数据对象)/u],
    ['fabrication and indirection have cost', '冲突与适用上下文', /Pure Fabrication|Indirection[^。；\n]*成本/u],
    ['protected variation is evidence-led', '机制', /Protected Variations[^。；\n]*变化证据/u],
  ]],
]);

for (const [id, contracts] of decisionContracts) {
  test(`keeps ${id} responsibility boundaries explicit`, () => {
    const body = requiredDocument(id).body;
    for (const [label, heading, pattern] of contracts) {
      assert.match(section(body, heading), pattern, `${id}: ${label}`);
    }
  });
}

test('does not collapse the Batch 4 misconceptions into slogans', () => {
  assert.doesNotMatch(requiredDocument('PR-12').body, /应该在所有地方使用接口/u);
  assert.doesNotMatch(requiredDocument('PR-12').body, /现有代码永远不应修改/u);
  assert.doesNotMatch(requiredDocument('PR-13').body, /Persistence Ignorance[^。\n]*必须使用 ORM/u);
  assert.doesNotMatch(requiredDocument('PR-13').body, /数据库成本可以忽略/u);
  assert.doesNotMatch(requiredDocument('PR-14').body, /Information Expert[^。\n]*就是数据持有者/u);
});
```

- [ ] **Step 2: Run the isolated test and prove the intended RED**

Run:

```bash
bun test tests/g007-batch4-content.test.mjs
```

Expected: FAIL first at `PR-12 must be published`; no syntax error, import error, source-ledger error, or generated-fixture failure.

- [ ] **Step 3: Independently review the RED contract**

The reviewer checks the test against every G007 Batch 4 content requirement, confirms each misconception has both a positive boundary and a negative guard, confirms PR-15..17 are the only unpublished range, and confirms no assertion depends on prose outside the named section. Fix findings and rerun Step 2; the same missing-page RED remains.

- [ ] **Step 4: Commit the reviewed RED contract**

```bash
git add tests/g007-batch4-content.test.mjs
git commit -m "test: define g007 responsibility batch contract"
```

Expected: one commit containing only the new failing contract.

---

### Task 2: Govern and observe the Batch 4 source set

**Files:**

- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Test: `tests/source-ledger.test.mjs`
- Test: `tests/source-link-health.test.mjs`
- Test: `tests/source-governance-data.test.mjs`
- Test: `tests/source-license-inventory.test.mjs`

**Interfaces:**

- Consumes: the seven approved identities from `.superpowers/sdd/source-research.md` and the canonical/transport separation enforced by `scripts/source-ledger.mjs`.
- Produces: seven validated source records, three document citation records, reviewed cache observations, and the exact measured governed-source total used by Tasks 4–6.

- [ ] **Step 1: Register all seven source identities before writing content**

Add records with these exact identity and policy fields; retain the existing schema fields `query_insensitive: false`, `locator_aliases: []`, `tombstone: null`, `registered_at: "2026-07-29"`, `checked_at: "2026-07-29"`, `license_family_grouping: "identity"`, `family_grouping_evidence_url: null`, `copyright_policy: "facts-and-short-quotation"`, and `expected_final_approved_at: "2026-07-29"`.

| ID | Canonical identity | Initial checker transport | Kind/tier | Version | Allowed roles | Rights and factual boundary |
| --- | --- | --- | --- | --- | --- | --- |
| `src-objectmentor-ocp-1996` | `https://objectmentor.com/resources/articles/ocp.pdf` | same, unless Step 3 observes an unacceptable result | `paper` / `primary` | `Original C++ Report Engineering Notebook article, 1996-01; checked 2026-07-29` | `definition`, `historical-context`, `learning` | `LicenseRef-All-Rights-Reserved`; original summary and bibliographic facts only; no figures, tables, listings, or extended prose |
| `src-objectmentor-isp-1996` | `https://objectmentor.com/resources/articles/isp.pdf` | same, unless Step 3 observes an unacceptable result | `paper` / `primary` | `Original C++ Report Engineering Notebook article, 1996-08; checked 2026-07-29` | `definition`, `historical-context`, `learning` | `LicenseRef-All-Rights-Reserved`; original summary and bibliographic facts only |
| `src-nilsson-ddd-patterns-2006` | `https://www.informit.com/store/applying-domain-driven-design-and-patterns-with-examples-9780321268204` | same | `textbook` / `primary` | `First edition, ISBN 9780321268204; checked 2026-07-29` | `definition`, `historical-context`, `learning` | `LicenseRef-All-Rights-Reserved`; bibliographic facts and original summary only |
| `src-ms-ddd-oriented-microservice-persistence-ignorance` | Microsoft DDD-oriented microservice URL from the research file | same | `official-docs` / `secondary` | `Updated 2022-04-13; checked 2026-07-29` | `comparison`, `implementation`, `learning` | `CC-BY-4.0` with Microsoft Learn terms as evidence; facts and short quotation only; no diagrams or code |
| `src-ms-infrastructure-persistence-layer-design` | Microsoft infrastructure persistence layer URL from the research file | same | `official-docs` / `secondary` | `Updated 2023-02-21; checked 2026-07-29` | `comparison`, `implementation`, `learning` | `CC-BY-4.0` with Microsoft Learn terms as evidence; facts and short quotation only; .NET guidance is not universal |
| `src-larman-applying-uml-patterns-3e-2004` | Pearson product URL from the research file | same | `textbook` / `primary` | `Third edition, published 2004-10-20, copyright 2005, ISBN 9780131489066; checked 2026-07-29` | `definition`, `historical-context`, `learning` | `LicenseRef-All-Rights-Reserved`; publisher metadata and original summary only |
| `src-larman-applying-uml-patterns-author-page` | `https://www.craiglarman.com/wiki/index.php?title=Book_Applying_UML_and_Patterns` | same | `official-docs` / `primary` | `Author page checked 2026-07-29` | `historical-context`, `learning` | `LicenseRef-All-Rights-Reserved`; provenance and bibliographic facts only |

For every record:

- `license_scope`, `license_evidence_url`, `license_evidence_note`, and `usage_boundary` state the page-specific boundary above;
- the two Microsoft records use `https://learn.microsoft.com/en-us/legal/termsofuse` as `license_evidence_url` and name the documentation’s CC-BY-4.0 boundary in `license_evidence_note`;
- `license_family_id` is the canonical identity;
- `expected_final_transport_locator` equals the reviewed transport selected in Step 3;
- `expected_final_approval_note` names the actual observation and why that transport is accepted;
- `link_policy` is `stable` for dated papers/books and `floating` for current official/author documentation.

- [ ] **Step 2: Add governed document entries before the MDX files exist**

Add:

```json
"content/principles/pr-12-open-closed-interface-segregation.mdx": {
  "reviewed_at": "2026-07-29",
  "copyright_checks": [
    "original-structure",
    "quotation-boundary",
    "attribution-complete",
    "illustration-rights"
  ],
  "citations": [
    {
      "source_id": "src-objectmentor-ocp-1996",
      "citation_url": "https://objectmentor.com/resources/articles/ocp.pdf",
      "roles": ["definition", "historical-context"],
      "manifest_primary": true,
      "usage_mode": "facts-summary",
      "attribution_note": "The Open-Closed Principle, Robert C. Martin / Object Mentor",
      "modification_note": null,
      "excerpt": null,
      "quotation_reviewed": false
    },
    {
      "source_id": "src-objectmentor-isp-1996",
      "citation_url": "https://objectmentor.com/resources/articles/isp.pdf",
      "roles": ["definition", "historical-context"],
      "manifest_primary": false,
      "usage_mode": "facts-summary",
      "attribution_note": "The Interface Segregation Principle, Robert C. Martin / Object Mentor",
      "modification_note": null,
      "excerpt": null,
      "quotation_reviewed": false
    }
  ]
}
```

Add equivalent exact entries:

- PR-13 cites Nilsson as the sole `manifest_primary`, then both Microsoft records as non-primary `comparison`/`implementation` evidence.
- PR-14 cites the Pearson third-edition record as the sole `manifest_primary`, then the author page as non-primary `historical-context`.
- Every citation uses its canonical identity URL even if the checker transport is later decoupled.
- No Pearson sample PDF is registered or cited.

- [ ] **Step 3: Add the seven audited license-family inventory rows**

In `docs/source-license-inventory.md`, add one eleven-column row per new `license_family_id`. Use the canonical identity in `source_family` and `current_urls`, the exact author/organization and `license_evidence_url` from Step 1, `checked_at` `2026-07-29`, and the exact approved license. Use `identity` for `family_grouping` and `not-applicable` for `grouping_evidence_url`.

The `scope_exclusions` and `migration_policy` cells must state:

- Object Mentor OCP/ISP: PDF figures, tables, listings, examples, marks, and extended prose excluded; facts summary and short quotation only.
- Nilsson and Pearson/Larman: book text, diagrams, tables, examples, and marks excluded; bibliographic facts and original summary only.
- Microsoft: diagrams, code, linked works, and third-party assets excluded; attributed factual summary under the named documentation license.
- Larman author page: page prose, images, and linked works excluded; provenance and bibliographic facts only.

Keep every URL literal and escape Markdown table pipes inside prose. Do not merge the two Object Mentor works, the two Microsoft works, or the two Larman/Pearson works into one family.

- [ ] **Step 4: Run live observations and truthfully select checker transports**

Run:

```bash
bun run check:links:live
```

Expected: the report prints an observation for every new transport. Review status, HTTP status, redirect chain, login-wall detection, and final transport.

For an accepted observation, refresh the cache:

```bash
bun run refresh:links
```

Expected: `data/source-link-health.json` contains exactly one cache result per approved new transport, with the source IDs grouped by transport and `review_status` matching the accepted policy state.

If either Object Mentor canonical URL cannot produce a policy-accepted observation, keep its `canonical_locator`, `citation_url`, `license_family_id`, and visible citation unchanged. Select a verified immutable Internet Archive snapshot of that exact article as `transport_locator` and `expected_final_transport_locator`, record the canonical URL in `locator_aliases` only if the schema requires it, explain the observed canonical failure and archive approval in `expected_final_approval_note`, rerun the live check against the archive, then refresh. Do not copy the prior DIP snapshot or invent an archive timestamp.

If another canonical transport fails, prefer an equivalent official publisher transport. Use the same decoupling contract and record the observed failure; do not label a failed, unobserved, or manually assumed transport healthy.

- [ ] **Step 5: Measure the governed source total after ledger validation**

Run:

```bash
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-governance-data.test.mjs tests/source-license-inventory.test.mjs
bun run check:links
node -e "const l=require('./data/source-ledger.json'); console.log(JSON.stringify({governed_sources:l.sources.length,tiers:Object.fromEntries(Object.entries(Object.groupBy(l.sources,s=>s.tier)).map(([k,v])=>[k,v.length]))},null,2))"
```

Expected: all tests and the offline cache check PASS. Save the printed `governed_sources` integer and tier counts in the Task 2 review; these are the only allowed source-count fixtures for later tasks.

- [ ] **Step 6: Confirm the content contract remains RED for the intended reason**

Run:

```bash
bun test tests/g007-batch4-content.test.mjs
```

Expected: FAIL at `PR-12 must be published`; source records themselves are valid.

- [ ] **Step 7: Independently review source governance**

The reviewer checks canonical identity versus checker transport, source authorship/version, exact evidence roles, one eligible primary per page, factual limits, cache observation truthfulness, and the absence of protected reuse. Resolve findings and rerun Steps 4–6.

- [ ] **Step 8: Commit source governance separately**

```bash
git add data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md
git commit -m "docs: govern g007 responsibility principle sources"
```

Expected: one source-only commit; the Batch 4 content contract remains intentionally RED.

---

### Task 3: Publish PR-12 and its reciprocal extension-boundary graph

**Files:**

- Create: `content/principles/pr-12-open-closed-interface-segregation.mdx`
- Modify: `content/principles/pr-01-information-hiding.mdx`
- Modify: `content/principles/pr-02-cohesion-coupling.mdx`
- Modify: `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx`
- Modify: `content/principles/pr-04-dip-ioc-dependency-injection.mdx`
- Modify: `content/principles/pr-05-composition-over-inheritance.mdx`
- Modify: `content/principles/pr-08-evolutionary-design.mdx`
- Test: `tests/g007-batch4-content.test.mjs`

**Interfaces:**

- Consumes: Task 1’s PR-12 contracts and Task 2’s governed OCP/ISP citations.
- Produces: PR-12 plus reciprocal PR-01/02/03/04/05/08 links; PR-14 remains a declared unpublished adjacency until Task 4 creates it, so generation is deferred.

- [ ] **Step 1: Write PR-12 with exact canonical metadata**

Use:

```yaml
---
title: Open/Closed 与 Interface Segregation
slug: /principles/pr-12
content_type: principle
status: reviewed
analyzed_at: 2026-07-29
source_cutoff: 2026-07-29
review_policy: quarterly-version-sensitive
topic_id: PR-12
priority: P1
depends_on:
  - PR-01
adjacent_topics:
  - PR-01
  - PR-02
  - PR-03
  - PR-04
  - PR-05
  - PR-08
  - PR-14
related_cases:
  - /cases/micro-frontends-single-spa
related_questions: []
---
```

Add the exact nine H2 headings in Global Constraints order. The article must include:

- a decision table with columns `决策问题 | 证据 | 边界选择 | 所有者 | 兼容与测试义务 | 退出条件`;
- separate rows for stable policy with evidenced variants, a client needing a coherent subset, speculative variation, fragmented client APIs, and a breaking compatibility change;
- a statement that OCP selects where evidenced variation is absorbed and ISP selects what coherent capabilities a consumer depends on;
- extension-point ownership, compatibility window, contract tests, version/removal policy, observability, operational cost, and rollback/exit conditions;
- fragmentation, adapter proliferation, orchestration leakage, and incoherent micro-interfaces as explicit failure modes;
- explicit rejection of interfaces everywhere, universal plug-in surfaces, and never modifying existing code;
- visible links to `/principles`, PR-01/02/03/04/05/08/14, and `/cases/micro-frontends-single-spa`;
- two visible source links using the canonical OCP and ISP URLs from the ledger;
- an original scenario that compares adding a supported provider capability through a stable policy extension with forcing every consumer to depend on unrelated operations.

- [ ] **Step 2: Add six published reciprocal edges**

Append `PR-12` to each exact `adjacent_topics` list in PR-01, PR-02, PR-03, PR-04, PR-05, and PR-08, preserving the existing order and adding PR-12 after the last principle ID and before non-principle IDs.

In each page’s `## 相邻原则`, add one visible `/principles/pr-12` link that explains only that page’s relationship:

- PR-01: hidden likely variation becomes an owned extension decision.
- PR-02: interface size is judged by coherent consumer dependency and propagation, not line count.
- PR-03: extension and client contracts still require a named responsibility owner.
- PR-04: dependency direction does not itself justify an extension surface.
- PR-05: composition can host a stable extension point but does not prove it is needed.
- PR-08: extension points need current variation evidence, compatibility windows, and retirement paths.

Do not add PR-14 to existing pages yet; Task 4 adds both sides atomically.

- [ ] **Step 3: Run the focused contract and inspect the expected remaining RED**

Run:

```bash
bun test tests/g007-batch4-content.test.mjs
```

Expected: PR-12 metadata, semantic, source, and visible reciprocal checks pass. Remaining failures are limited to missing PR-13/PR-14 pages and the deliberately ungenerated Batch 4 manifest projection.

- [ ] **Step 4: Independently review PR-12**

The reviewer checks OCP/ISP distinction, strategic rather than universal closure, coherent rather than maximally small interfaces, extension costs, copyright boundary, source labels, and every reciprocal link. Resolve findings and rerun Step 3.

- [ ] **Step 5: Commit the independently reviewable PR-12 slice**

```bash
git add content/principles/pr-12-open-closed-interface-segregation.mdx \
  content/principles/pr-01-information-hiding.mdx \
  content/principles/pr-02-cohesion-coupling.mdx \
  content/principles/pr-03-single-responsibility-separation-of-concerns.mdx \
  content/principles/pr-04-dip-ioc-dependency-injection.mdx \
  content/principles/pr-05-composition-over-inheritance.mdx \
  content/principles/pr-08-evolutionary-design.mdx
git commit -m "docs: add open closed and interface segregation"
```

Expected: one content commit; generation is still deferred because PR-14 is a declared reciprocal target not yet published.

---

### Task 4: Publish PR-13 and PR-14, reconcile fixtures, and generate Stage A

**Files:**

- Create: `content/principles/pr-13-persistence-ignorance.mdx`
- Create: `content/principles/pr-14-grasp-responsibility-assignment.mdx`
- Modify: `content/principles/pr-02-cohesion-coupling.mdx`
- Modify: `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx`
- Modify: `content/principles/pr-04-dip-ioc-dependency-injection.mdx`
- Modify: `content/principles/pr-11-cqs-cqrs-read-write-separation.mdx`
- Modify: `tests/g007-batch1-content.test.mjs`
- Modify: `tests/g007-batch2-content.test.mjs`
- Modify: `tests/g007-batch3-content.test.mjs`
- Modify: `tests/content-review-health.test.mjs`
- Modify: `tests/source-ledger-rendering.test.mjs`
- Modify: `tests/source-ledger-pagination.test.mjs`
- Modify: `tests/project-status.test.mjs`
- Modify: generated files listed in File Structure
- Test: all content, source, relation, project-status, and generation suites

**Interfaces:**

- Consumes: Task 2’s exact measured source/tier counts and Task 3’s PR-12 side of PR-12↔PR-14.
- Produces: all three published pages, a fully reciprocal graph, 79 documents, 33 completed topics, exact measured governed-source fixtures, and deterministic Stage A generated state.

- [ ] **Step 1: Write PR-13 with exact canonical metadata and decision matrix**

Use:

```yaml
---
title: Persistence Ignorance
slug: /principles/pr-13
content_type: principle
status: reviewed
analyzed_at: 2026-07-29
source_cutoff: 2026-07-29
review_policy: quarterly-version-sensitive
topic_id: PR-13
priority: P1
depends_on:
  - PR-03
adjacent_topics:
  - PR-03
  - PR-04
  - PR-11
related_cases:
  - /cases/temporal-saga-durable-execution
related_questions: []
---
```

Add the exact nine H2 headings and a table with:

```markdown
| 决策位置 | 责任所有者 | 必须保持独立的领域决策 | 允许显式泄漏的存储事实 | 事务/查询代价 | 选择 |
| --- | --- | --- | --- | --- | --- |
```

Cover domain rules versus mappings/repositories; aggregate and transaction boundaries; direct reporting/query models; identity, lazy loading, concurrency tokens, batching, and query-shape leakage; plus a measured case where explicit persistence-aware optimization is the honest choice. State that repositories are optional, ORM is not required, annotations are context-dependent, and database/transaction costs remain real. Link visibly to `/principles`, PR-03/04/11, and `/cases/temporal-saga-durable-execution`; show all three canonical governed sources.

- [ ] **Step 2: Write PR-14 with exact canonical metadata and all nine interacting heuristics**

Use:

```yaml
---
title: GRASP 责任分配
slug: /principles/pr-14
content_type: principle
status: reviewed
analyzed_at: 2026-07-29
source_cutoff: 2026-07-29
review_policy: quarterly-version-sensitive
topic_id: PR-14
priority: P1
depends_on:
  - PR-03
adjacent_topics:
  - PR-02
  - PR-03
  - PR-04
  - PR-12
related_cases:
  - /cases/litellm-virtual-keys-governance
related_questions: []
---
```

Add the exact nine H2 headings and an original responsibility matrix with:

```markdown
| 待分配责任 | 候选所有者 | 首要 GRASP 提问 | 拉扯它的其他启发式 | 失败模式 | 最终证据 |
| --- | --- | --- | --- | --- | --- |
```

Include distinct rows for information, creation, coordination, variation, and infrastructure. Across those rows explicitly use Information Expert, Creator, Controller, Low Coupling, High Cohesion, Polymorphism, Pure Fabrication, Indirection, and Protected Variations. At least two rows must show conflicting pulls and explain the chosen owner. Reject god-object Controller and data-holder Information Expert. Link visibly to `/principles`, PR-02/03/04/12, and `/cases/litellm-virtual-keys-governance`; show both canonical governed sources. Use original examples, not the protected point-of-sale case.

- [ ] **Step 3: Complete every reciprocal existing-page edge**

Update metadata and visible prose:

- PR-02 adds PR-14 after PR-12 and explains cohesion/coupling as evaluation criteria for responsibility assignment.
- PR-03 adds PR-13 and PR-14 after PR-12 and distinguishes change ownership, persistence responsibility, and GRASP ownership selection.
- PR-04 adds PR-13 and PR-14 after PR-12 and distinguishes dependency direction from persistence placement and responsibility choice.
- PR-11 adds PR-13 after PR-10 and explains that query-model separation does not force domain persistence concerns into one model.

PR-12 already links PR-14. Confirm PR-14 links PR-12. No other new edge is allowed.

- [ ] **Step 4: Advance only permitted historical content-test fixtures**

In each of `tests/g007-batch1-content.test.mjs`, `tests/g007-batch2-content.test.mjs`, and `tests/g007-batch3-content.test.mjs`:

- change unpublished route patterns/ranges from PR-12..17 to PR-15..17;
- add PR-12/13/14 only to relationship arrays for existing pages changed in Steps 2–3;
- leave historical source assertions, semantic assertions, deployment evidence, and expected historical routes unchanged.

Run:

```bash
bun test tests/g007-batch1-content.test.mjs tests/g007-batch2-content.test.mjs tests/g007-batch3-content.test.mjs tests/g007-batch4-content.test.mjs
```

Expected: all selected content suites PASS.

- [ ] **Step 5: Generate once and copy exact derived Stage A counts**

Run:

```bash
bun run generate:content
node -e "const s=require('./src/generated/project-status.json'); const l=require('./src/generated/source-ledger.json'); console.log(JSON.stringify({completed_topics:s.completed_topics,content_documents:s.content_documents,governed_sources:s.governed_sources,tiers:Object.fromEntries(Object.entries(Object.groupBy(l.sources,x=>x.tier)).map(([k,v])=>[k,v.length]))},null,2))"
```

Expected: `completed_topics` is exactly 33; `content_documents` is exactly 79; `governed_sources` equals the Task 2 measured source count. PR-12 through PR-14 are published but their backlog-projection status is pending.

Copy the printed exact integers into:

- `tests/content-review-health.test.mjs`: 76→79 documents; 443→the measured source total.
- `tests/source-ledger-rendering.test.mjs`: 443→the measured source total.
- `tests/source-ledger-pagination.test.mjs`: replace tier totals, total ID count, uniqueness count, and only page-count fixtures changed by the measured tier totals.
- `tests/project-status.test.mjs`: keep 33 completed topics; change 76→79 documents and 443→the measured source total.

Do not encode `443 + 7`, infer a target from research, or alter generator logic.

- [ ] **Step 6: Verify deterministic Stage A**

Run:

```bash
bun test tests/g007-batch1-content.test.mjs tests/g007-batch2-content.test.mjs tests/g007-batch3-content.test.mjs tests/g007-batch4-content.test.mjs
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-governance-data.test.mjs tests/source-license-inventory.test.mjs
bun test tests/source-ledger-rendering.test.mjs tests/source-ledger-pagination.test.mjs tests/content-review-health.test.mjs tests/project-status.test.mjs tests/content-relations.test.mjs
bun run validate:content
bun run check:content
bun run check:links
bun run check:reviews
git diff --check
```

Expected: every command PASS, generation reports no drift, document count is 79, completed topics remain 33, and the source total equals the measured ledger.

- [ ] **Step 7: Independently review PR-13, PR-14, and generated state**

Use separate requirements/content/test review passes for PR-13 and PR-14. Review persistence tradeoffs, all nine GRASP terms and their conflicts, reciprocal visibility, protected-source boundaries, PR-15..17 absence, count derivation, and generated-only changes. Resolve findings and rerun Step 6.

- [ ] **Step 8: Commit complete Stage A content**

```bash
git add content data/source-ledger.json data/source-link-health.json \
  tests/g007-batch1-content.test.mjs tests/g007-batch2-content.test.mjs \
  tests/g007-batch3-content.test.mjs tests/g007-batch4-content.test.mjs \
  tests/content-review-health.test.mjs tests/source-ledger-rendering.test.mjs \
  tests/source-ledger-pagination.test.mjs tests/project-status.test.mjs \
  src/generated docs/source-license-inventory.md
git commit -m "docs: publish g007 responsibility principle batch"
```

Expected: a Stage A candidate commit with PR-12..14 published and still unchecked.

---

### Task 5: Verify, integrate, deploy, and live-review exact Stage A

**Files:**

- Review: all Stage A files from Tasks 1–4
- No new tracked file until exact Stage A production observations exist

**Interfaces:**

- Consumes: the Stage A candidate with green local verification.
- Produces: an exact reachable main-branch SHA, successful matching Pages run, independent review verdicts, and live observations for Stage B.

- [ ] **Step 1: Run the complete repository gate and record the observed test count**

Run:

```bash
bun run verify
git diff --check
git status --short
```

Expected: full test, content, generation, offline link, review-health, typecheck, and production build gates PASS; no uncommitted tracked change exists. Record the exact `node:test` pass count for the Stage B review.

- [ ] **Step 2: Obtain independent code, content, source, and test reviews**

Review the complete Stage A diff against the approved design. Require clean verdicts for:

- PR-12 distinctions and extension/interface costs;
- PR-13 domain/persistence/query/transaction honesty;
- PR-14 nine-pattern completeness and conflicts;
- source provenance, transport/cache truth, and protected-work boundary;
- exact reciprocal graph and PR-15..17 absence;
- test strength, fixture derivation, generator determinism, and Stage A backlog state.

Resolve every finding with a focused commit and rerun Step 1. The final reviewed Stage A SHA is the commit after all fixes.

- [ ] **Step 3: Integrate Stage A without altering its tree**

From the main checkout, merge or fast-forward the reviewed Batch 4 branch according to repository policy, rerun:

```bash
bun run verify
git diff --check
```

Expected: PASS on main with the same tree. Push main, then capture:

```bash
git rev-parse HEAD
git rev-parse origin/main
```

Expected: identical 40-character SHAs. Save that literal value as the Stage A SHA.

- [ ] **Step 4: Require the exact SHA’s Pages deployment**

Inspect Pages runs and accept only the run whose `headSha` equals the literal Stage A SHA and whose terminal fields are `status=completed`, `conclusion=success`. Reject a successful run for another SHA.

Verify the Stage A commit resolves:

```bash
STAGE_A_SHA="$(git rev-parse HEAD)"
git cat-file -e "${STAGE_A_SHA}^{commit}"
```

Expected: exit 0.

- [ ] **Step 5: Perform live HTTP and browser review**

Require HTTP 200 for:

- `https://sealday.github.io/tego-arch/principles`
- `https://sealday.github.io/tego-arch/principles/pr-12`
- `https://sealday.github.io/tego-arch/principles/pr-13`
- `https://sealday.github.io/tego-arch/principles/pr-14`
- the exact CSS and runtime JavaScript assets loaded by those pages.

In a real browser, review every new route at desktop `1440x1000` and mobile `390x844`. For each page record:

- document-level horizontal overflow result;
- local table/code/diagram overflow behavior;
- `0 warnings、0 errors` in the browser console;
- visible canonical source labels and links;
- actual clicks for parent `/principles`, every adjacent principle, and one real case/question link;
- successful return navigation after each click.

The exact click matrix implied by the graph is:

```text
PR-12 9/9 = parent 1 + adjacent 7 + case/question 1
PR-13 5/5 = parent 1 + adjacent 3 + case/question 1
PR-14 6/6 = parent 1 + adjacent 4 + case/question 1
20/20 total
```

Record actual outcomes, not only link presence from tests.

- [ ] **Step 6: Retain the feature branch and hand exact observations to Stage B**

Do not delete the feature branch. Preserve the literal Stage A SHA, Pages run ID/URL, run gate, CSS/JS asset URLs, test count, viewport/overflow/console results, source-label results, 20/20 click matrix, and reviewer identities/verdicts.

---

### Task 6: Close Batch 4 with immutable Stage B evidence

**Files:**

- Create: `docs/reviews/g007-batch4.md`
- Create: `tests/g007-batch4-deployment.test.mjs`
- Modify: `docs/content-backlog.md`
- Modify: `tests/project-status.test.mjs`
- Modify: `tests/knowledge-fixtures.test.mjs`
- Modify: generated files listed in File Structure

**Interfaces:**

- Consumes: literal observations from Task 5 and the exact Stage A-derived source total from Task 2.
- Produces: unique immutable deployment evidence, exactly three closed backlog rows, 36 completed topics, 79 documents, unchanged governed-source total, G007 current, G006 most recent, and PR-15 next.

- [ ] **Step 1: Write the Stage B review from observed literals**

Create `docs/reviews/g007-batch4.md`. In the main checkout, print the exact evidence lines:

```bash
printf 'Exact Stage A SHA: `%s`\n' "$STAGE_A_SHA"
printf 'GitHub Pages run: [`%s`](https://github.com/sealday/tego-arch/actions/runs/%s)\n' "$PAGES_RUN_ID" "$PAGES_RUN_ID"
printf 'Exact run gate: `headSha=%s`, `status=completed`, `conclusion=success`.\n' "$STAGE_A_SHA"
```

Copy the three printed lines verbatim into the review. Never save the shell variable names or command text as evidence.

Also record:

- one editorial/fact/copyright/representation/anti-overclaim subsection per principle;
- independent reviewer identities and clean verdicts;
- the exact repository test count from `bun run verify`;
- 79 content documents, the exact derived governed-source total, and 33 Stage A completed topics;
- production routes and exact hashed CSS/JavaScript URLs;
- desktop/mobile, document/local overflow, and zero-console evidence;
- exact visible labels for both Object Mentor articles, Nilsson/Addison-Wesley, both Microsoft pages, Pearson/Larman, and the Larman author page;
- the exact 20/20 click matrix;
- `Stage B closure — PASS`;
- G007 current, durable stories `6 / 20`, G006 most recently completed, PR-15 next.

- [ ] **Step 2: Close exactly PR-12 through PR-14 in the backlog**

For PR-12, PR-13, and PR-14 only:

- change `[ ]` to `[x]`;
- append the literal Stage A commit link;
- append the literal Pages run link;
- append the canonical production route;
- summarize the observed representation, viewports, source visibility, and click evidence.

Update the current release baseline to Batch 4 with 36 completed topics, 79 content documents, the exact derived source total, the literal Stage A SHA/run, G007 current, G006 most recently completed, and PR-15 next. Leave PR-15, PR-16, and PR-17 text and checkboxes unchanged.

- [ ] **Step 3: Add a duplicate- and contradiction-rejecting deployment regression**

Create `tests/g007-batch4-deployment.test.mjs`. First print JavaScript declarations containing the observed values:

```bash
printf "const expectedStageASha = '%s';\n" "$STAGE_A_SHA"
printf "const expectedPagesRunId = '%s';\n" "$PAGES_RUN_ID"
printf "const cssAsset = '%s';\n" "$CSS_ASSET_URL"
printf "const jsAsset = '%s';\n" "$JS_ASSET_URL"
printf "const repositoryGate = '%s';\n" "$REPOSITORY_GATE_LITERAL"
printf "const governedSourceLiteral = '%s';\n" "$GOVERNED_SOURCE_LITERAL"
```

Copy those six printed declarations directly below `const routes`; the committed test must contain literal strings and no environment-variable reads. Then add:

```js
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = ['12', '13', '14'];
const clickMatrix =
  'PR-12 `9/9 = parent 1 + adjacent 7 + case/question 1`; PR-13 `5/5 = parent 1 + adjacent 3 + case/question 1`; PR-14 `6/6 = parent 1 + adjacent 4 + case/question 1`; `20/20 total`';

const [review, backlog, manifest] = await Promise.all([
  readFile(new URL('../docs/reviews/g007-batch4.md', import.meta.url), 'utf8')
    .catch(() => ''),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8')
    .then(JSON.parse),
]);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function parseLiteralEvidence(source) {
  const shaMatches = [...source.matchAll(/^Exact Stage A SHA: `([0-9a-f]{40})`$/gmu)];
  const runMatches = [...source.matchAll(
    /^GitHub Pages run: \[`([0-9]+)`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\1\)$/gmu,
  )];
  const gateMatches = [...source.matchAll(
    /^Exact run gate: `headSha=([0-9a-f]{40})`, `status=completed`, `conclusion=success`\.$/gmu,
  )];
  assert.equal(shaMatches.length, 1, 'review must contain exactly one Stage A SHA');
  assert.equal(runMatches.length, 1, 'review must contain exactly one Pages run');
  assert.equal(gateMatches.length, 1, 'review must contain exactly one run gate');
  assert.equal(shaMatches[0][1], expectedStageASha);
  assert.equal(runMatches[0][1], expectedPagesRunId);
  assert.equal(gateMatches[0][1], expectedStageASha);
  return {stageASha: expectedStageASha, pagesRunId: expectedPagesRunId};
}

function assertLiteralEvidence(source) {
  parseLiteralEvidence(source);
  for (const literal of [
    cssAsset,
    jsAsset,
    clickMatrix,
    repositoryGate,
    governedSourceLiteral,
    'desktop `1440x1000`',
    'mobile `390x844`',
    '0 warnings、0 errors',
    '79 content documents',
    'Stage B closure — PASS',
  ]) {
    assert.ok(source.includes(literal), `review must record ${literal}`);
  }
}
```

Add the behavioral tests:

```js
test('records one exact successful G007 Batch 4 deployment', () => {
  const {stageASha} = parseLiteralEvidence(review);
  assertLiteralEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${stageASha}^{commit}`], {
      cwd: root,
      stdio: 'pipe',
    }),
  );
  for (const [literal, mutation] of [
    ['0 warnings、0 errors', '1 warning、0 errors'],
    ['20/20 total', '19/20 total'],
    ['Stage B closure — PASS', 'Stage B closure — FAIL'],
  ]) {
    assert.throws(() => assertLiteralEvidence(review.replaceAll(literal, mutation)), {
      name: 'AssertionError',
    });
  }
  const otherSha = '0'.repeat(40);
  const otherRun = String(Number(expectedPagesRunId) + 1);
  const contradictory = [
    review,
    `Exact Stage A SHA: \`${otherSha}\``,
    `GitHub Pages run: [\`${otherRun}\`](https://github.com/sealday/tego-arch/actions/runs/${otherRun})`,
    `Exact run gate: \`headSha=${otherSha}\`, \`status=completed\`, \`conclusion=success\`.`,
    '',
  ].join('\n');
  assert.throws(() => assertLiteralEvidence(contradictory), {
    name: 'AssertionError',
  });
});

test('closes only PR-12 through PR-14 and leaves PR-15 next', () => {
  const {stageASha, pagesRunId} = parseLiteralEvidence(review);
  const runUrl = `https://github.com/sealday/tego-arch/actions/runs/${pagesRunId}`;
  for (const id of routes) {
    const row = backlog.split(/\r?\n/u)
      .find((line) => line.startsWith(`- [x] **PR-${id} `));
    assert.ok(row, `PR-${id} must be checked`);
    assert.ok(row.includes(stageASha));
    assert.ok(row.includes(runUrl));
    assert.ok(row.includes(`https://sealday.github.io/tego-arch/principles/pr-${id}`));
    assert.deepEqual(topicsById.get(`PR-${id}`)?.status, {
      scope: 'backlog-projection',
      value: 'complete',
      source: 'docs/content-backlog.md',
    });
  }
  for (let number = 15; number <= 17; number += 1) {
    const id = `PR-${number}`;
    assert.match(backlog, new RegExp(`^- \\[ \\] \\*\\*${id} `, 'mu'));
    assert.equal(topicsById.get(id)?.published, false);
  }
  assert.match(backlog, /- \*\*当前持久故事：\*\* `G007`。/u);
  assert.match(
    backlog,
    /- \*\*持久故事进度：\*\* 已完成 `6 \/ 20`；最近完成 `G006`。/u,
  );
  assert.match(backlog, /G007 仍在进行中，下一项为 PR-15|PR-15 为下一项/u);
});
```

- [ ] **Step 4: Regenerate Stage B and update completion fixtures**

Run:

```bash
bun run generate:content
```

Expected:

- PR-12 through PR-14 remain published and now have complete backlog-projection status;
- PR-15 through PR-17 remain pending and unpublished;
- `completed_topics` is exactly 36;
- `content_documents` is exactly 79;
- `governed_sources` equals the unchanged Stage A-derived count;
- durable stories remain `{completed: 6, total: 20, current: "G007"}`.

Update:

- `tests/project-status.test.mjs`: 33→36 completed topics, retaining 79 documents and the derived source count.
- `tests/knowledge-fixtures.test.mjs`: add PR-12/13/14 exact files to `fixtureById` and `true` entries to `fixtureCompletionById`.

- [ ] **Step 5: Run the complete Stage B gate and freeze the exact test literal**

Run:

```bash
bun test tests/g007-batch4-deployment.test.mjs tests/g007-batch4-content.test.mjs tests/project-status.test.mjs tests/knowledge-fixtures.test.mjs
bun run verify
git diff --check
```

Expected: every command PASS. Copy the exact full test count into the review and `repositoryGate` constant, then rerun both commands and require PASS again.

- [ ] **Step 6: Independently review Stage B immutability and state**

The reviewer confirms exactly one SHA/run/run-gate evidence group, literal constants matching the review, commit resolvability, duplicate/contradiction mutation rejection, PR-12..14 closure only, PR-15..17 pending/unpublished, exact 36/79/derived counts, G007/G006/6-of-20 state, and unchanged historical deployment files. Resolve findings and rerun Step 5.

- [ ] **Step 7: Commit, push, and verify Stage B**

```bash
git add docs/reviews/g007-batch4.md docs/content-backlog.md \
  tests/g007-batch4-deployment.test.mjs tests/project-status.test.mjs \
  tests/knowledge-fixtures.test.mjs src/generated
git commit -m "docs: close g007 responsibility principle batch"
git push origin main
```

Accept only the Pages run whose `headSha` equals this Stage B commit and whose terminal result is `completed/success`. Recheck `/principles` and PR-12 through PR-14 for HTTP 200.

Finally run:

```bash
git rev-parse HEAD
git rev-parse origin/main
git rev-parse codex/g007-principles-batch4
git status --short
```

Expected: local main, origin/main, and the retained feature branch resolve to the final Stage B SHA; the implementation worktree is clean; G007 remains current; G006 remains the most recent completed parent; PR-15 is next.

---

## Execution Stop Rule

Stop only after Stage B verification is green, the exact Stage B Pages run succeeds, production routes return HTTP 200, local/remote/retained-branch SHAs agree, PR-15 through PR-17 remain unpublished, and no tracked work remains.
