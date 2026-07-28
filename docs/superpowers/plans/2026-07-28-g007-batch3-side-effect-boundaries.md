# G007 Batch 3 Side-Effect Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish PR-09 through PR-11 as a governed, test-first G007 batch that distinguishes authorization boundaries, replay and coordination boundaries, and command/query responsibility boundaries.

**Architecture:** Add three independent principle MDX pages behind one real-content contract, govern every cited source before drafting factual conclusions, and derive navigation and status through the existing content generator. Deliver through the repository’s established Stage A content deployment and Stage B evidence-backed closure, leaving G007 active with PR-12 next.

**Tech Stack:** Docusaurus MDX, Node.js `node:test`, Bun 1.3.13 commands, JSON source ledger and link-health cache, generated topic manifest/status/relations, GitHub Pages.

## Global Constraints

- The approved design is `docs/superpowers/specs/2026-07-28-g007-batch3-side-effect-boundaries-design.md`.
- Scope is exactly PR-09, PR-10, and PR-11. PR-12 through PR-17 stay unpublished and unchecked.
- PR-09 and PR-10 use `priority: P0`; PR-11 uses `priority: P1`; all three use `content_type: principle` and `status: reviewed`.
- Each page uses the exact nine-H2 contract: `学习问题`, `要保护的性质`, `冲突与适用上下文`, `机制`, `误用与反原则`, `适用尺度`, `相邻原则`, `说明性场景`, `来源`.
- Each page has three to five learning questions, one original deterministic table or Mermaid flow, explicit `来源事实`, `推断`, and `本站分析` labels, and an explicit failure mode, non-use condition, scale boundary, and operational cost.
- Each page has at least two visible governed external sources from independent domains and exactly one `manifest_primary` citation.
- Use facts summaries only for all new external sources. Do not copy source diagrams, tables, examples, taxonomies, or protected prose.
- Front matter is the canonical relationship input. Run `bun run generate:content`; do not hand-edit generated projections.
- Existing pages change only for accurate reciprocal links required by this batch.
- Follow TDD: the first RED must be caused by the three missing MDX pages, not by broken test syntax or fixtures.
- Use the existing two-stage release: Stage A publishes content while backlog rows remain unchecked; Stage B records exact deployment evidence and then closes exactly PR-09 through PR-11.
- G007 remains the current durable story after Stage B. Do not checkpoint it; PR-12 is next.
- At execution time, create or reuse `.worktrees/g007-principles-batch3` on branch `codex/g007-principles-batch3` through `superpowers:using-git-worktrees`.
- Use Bun for repository scripts and compatible tests. Run nested `node:test` suites such as `tests/source-ledger.test.mjs` with `node --test` when Bun’s nested-test compatibility is insufficient.

---

## File Structure

### Create

- `tests/g007-batch3-content.test.mjs` — real-repository contract for publication, page semantics, governed sources, relationships, and unpublished-route boundaries.
- `content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx` — runtime authorization and damage-containment boundary.
- `content/principles/pr-10-idempotency-minimal-coordination.mdx` — retry, replay, unknown-outcome, and invariant-coordination boundary.
- `content/principles/pr-11-cqs-cqrs-read-write-separation.mdx` — method, architecture, and infrastructure-scale separation boundary.
- `docs/reviews/g007-batch3.md` — Stage A SHA/run/runtime/editorial evidence and Stage B verdict.
- `tests/g007-batch3-deployment.test.mjs` — immutable regression for exact deployment evidence and backlog closure.

### Modify

- `data/source-ledger.json` — add seven source identities and three governed document entries; reuse two existing source identities.
- `data/source-link-health.json` — retain script-observed transport status for new and reused sources.
- `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx` — reciprocal PR-11 relation only.
- `content/principles/pr-04-dip-ioc-dependency-injection.mdx` — reciprocal PR-09 and PR-11 relations only.
- `content/principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx` — reciprocal PR-09 and PR-10 relations only.
- `content/principles/pr-08-evolutionary-design.mdx` — reciprocal PR-10 relation only.
- `tests/g007-batch1-content.test.mjs` — advance unpublished-principle assertions from PR-09..17 to PR-12..17 and accept accurate new reciprocal relations.
- `tests/g007-batch2-content.test.mjs` — advance unpublished-principle assertions from PR-09..17 to PR-12..17 and accept accurate new reciprocal relations.
- `tests/content-review-health.test.mjs` — Stage A count fixtures from 73 to 76 documents and 436 to 443 sources.
- `tests/source-ledger-rendering.test.mjs` — source-card count from 436 to 443.
- `tests/source-ledger-pagination.test.mjs` — paginated source count and uniqueness from 436 to 443.
- `tests/project-status.test.mjs` — Stage A expectations 30 completed topics, 76 documents, 443 sources; Stage B completed topics becomes 33.
- `tests/knowledge-fixtures.test.mjs` — include PR-09 through PR-11 after Stage B closure.
- `docs/content-backlog.md` — Stage B only: close PR-09 through PR-11 and update the deployment baseline.

### Generated by `bun run generate:content`

- `src/generated/topic-manifest.json`
- `src/generated/topic-index.json`
- `src/generated/topic-relations.json`
- `src/generated/project-status.json`
- `src/generated/source-ledger.json`
- `src/generated/source-license-inventory.json`
- `docs/source-license-inventory.md`

---

### Task 1: Create the failing G007 Batch 3 content contract

**Files:**

- Create: `tests/g007-batch3-content.test.mjs`
- Test: `tests/g007-batch3-content.test.mjs`

**Interfaces:**

- Consumes: `readContentDocuments`, `findMarkdownHeadings`, `extractInternalLinks`, `extractExternalLinks`, `src/generated/topic-manifest.json`, and `data/source-ledger.json`.
- Produces: A single executable contract that Tasks 2–4 turn from RED to GREEN without weakening assertions.

- [ ] **Step 1: Write the complete failing real-content test**

Create `tests/g007-batch3-content.test.mjs`:

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
  [
    'PR-09',
    [
      'principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx',
      '/principles/pr-09',
      'P0',
    ],
  ],
  [
    'PR-10',
    [
      'principles/pr-10-idempotency-minimal-coordination.mdx',
      '/principles/pr-10',
      'P0',
    ],
  ],
  [
    'PR-11',
    [
      'principles/pr-11-cqs-cqrs-read-write-separation.mdx',
      '/principles/pr-11',
      'P1',
    ],
  ],
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
  ['PR-09', ['PR-04', 'PR-07', 'PR-10']],
  ['PR-10', ['PR-07', 'PR-08', 'PR-09', 'PR-11']],
  ['PR-11', ['PR-03', 'PR-04', 'PR-10']],
]);
const routeByTopic = new Map([
  ['PR-03', '/principles/pr-03'],
  ['PR-04', '/principles/pr-04'],
  ['PR-07', '/principles/pr-07'],
  ['PR-08', '/principles/pr-08'],
  ['PR-09', '/principles/pr-09'],
  ['PR-10', '/principles/pr-10'],
  ['PR-11', '/principles/pr-11'],
]);
const solePrimary = new Map([
  ['PR-09', 'src-saltzer-schroeder-protection-1975'],
  ['PR-10', 'src-aws-making-retries-safe-idempotent-apis-2020'],
  ['PR-11', 'src-martin-fowler-cqrs-2011'],
]);
const requiredCase = new Map([
  ['PR-09', '/cases/litellm-virtual-keys-governance'],
  ['PR-10', '/cases/temporal-saga-durable-execution'],
  ['PR-11', '/cases/temporal-saga-durable-execution'],
]);
const decisionContracts = new Map([
  [
    'PR-09',
    [
      ['least privilege is not role count', '误用与反原则', /最小权限不等于角色数量最大化/u],
      ['actual authority includes scope and duration', '机制', /资源、动作、时长与委派路径/u],
      ['indeterminate is not allow', '机制', /缺少策略或策略求值失败都不得变成隐式允许/u],
      ['fail-safe default remains observable', '误用与反原则', /安全默认值不等于静默失败/u],
      ['defense layers require independence', '机制', /额外控制必须针对已命名威胁，并具有有意义的独立性/u],
      ['emergency access has lifecycle', '机制', /紧急权限必须有所有者、审计、过期与撤销/u],
    ],
  ],
  [
    'PR-10',
    [
      ['idempotency protects effect not bytes', '要保护的性质', /幂等保护的是受约束效果，而不是逐字节相同响应/u],
      ['retry keeps one operation identity', '机制', /同一逻辑操作的传输重试必须复用同一幂等键/u],
      ['replay states are explicit', '机制', /in-progress、completed、conflict、expired 与 unknown/u],
      ['unknown is not failed', '机制', /未知结果不是可盲重试的失败/u],
      ['dedupe is not invariant coordination', '冲突与适用上下文', /去重不能替代共享不变量所需的所有权、条件写或串行化/u],
      ['minimal coordination is not zero', '误用与反原则', /最小协调不等于零协调/u],
    ],
  ],
  [
    'PR-11',
    [
      ['CQS scale', '要保护的性质', /CQS 约束方法或接口的可观察状态语义/u],
      ['CQRS scale', '要保护的性质', /CQRS 分离命令与查询责任及其模型/u],
      ['replica is not CQRS', '要保护的性质', /只读副本只是基础设施路由，不能单独证明 CQRS/u],
      ['four outcomes', '机制', /保留现有模型并应用 CQS[\s\S]*优化单模型读取[\s\S]*基础设施读写分流[\s\S]*采用 CQRS/u],
      ['CQRS costs are explicit', '冲突与适用上下文', /投影延迟、read-your-write、回放重建、对账与模式演化/u],
      ['simple CRUD non-use', '误用与反原则', /简单 CRUD 边界没有模型分歧证据时不采用 CQRS/u],
    ],
  ],
]);

const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
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

test('publishes PR-09 through PR-11 with the principle contract', () => {
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
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
});

test('governs sources and visible Batch 3 relationships', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has at least two sources`);
    const primary = governed.citations.filter(({manifest_primary}) => manifest_primary);
    assert.equal(primary.length, 1, `${id} has exactly one manifest primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary identity`);
    const visibleExternal = new Set(extractExternalLinks(document));
    const domains = new Set();
    for (const citation of governed.citations) {
      assert.ok(visibleExternal.has(citation.citation_url), `${id} visible ${citation.source_id}`);
      domains.add(new URL(citation.citation_url).hostname);
    }
    assert.ok(domains.size >= 2, `${id} independent source domains`);
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id)) {
      assert.ok(links.has(routeByTopic.get(adjacent)), `${id} visibly links ${adjacent}`);
    }
    assert.ok(links.has(requiredCase.get(id)), `${id} links its required case`);
    assert.equal(
      [...links].some((link) => /^\/principles\/pr-1[2-7]$/u.test(link)),
      false,
      `${id} must not link unpublished principles`,
    );
  }
});

test('keeps authorization replay and responsibility decisions distinct', () => {
  for (const [id, contracts] of decisionContracts) {
    const body = requiredDocument(id).body;
    for (const [label, heading, pattern] of contracts) {
      assert.match(section(body, heading), pattern, `${id}: ${label}`);
    }
  }
});
```

- [ ] **Step 2: Run the new contract and confirm a clean content-missing RED**

Run:

```bash
bun test tests/g007-batch3-content.test.mjs
```

Expected: all three subtests fail at their first call to `requiredDocument`, with `PR-09 must be published` as the earliest missing-content cause. There must be no syntax, import, JSON, or fixture error.

- [ ] **Step 3: Commit the RED contract**

```bash
git add tests/g007-batch3-content.test.mjs
git commit -m "test: define g007 side-effect boundary contract"
```

---

### Task 2: Govern the Batch 3 source set before drafting conclusions

**Files:**

- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Test: `tests/source-ledger.test.mjs`
- Test: `tests/g007-batch3-content.test.mjs`

**Interfaces:**

- Consumes: Existing source identities `src-nist-sp800-160v1r1` and `src-learn-1abc9c267864`, plus the current source-ledger schema.
- Produces: Seven new stable source identities and three pending governed document entries used verbatim by the MDX source sections and generated manifest.

- [ ] **Step 1: Audit the exact source transports, rights evidence, and non-claims**

Open every locator and record the final transport observed on the execution date:

| Source ID | Canonical locator | Author/org | Fact boundary | Non-claim |
| --- | --- | --- | --- | --- |
| `src-saltzer-schroeder-protection-1975` | `https://web.mit.edu/Saltzer/www/publications/protection/` | Jerome H. Saltzer and Michael D. Schroeder | Defines fail-safe defaults as permission-based access decisions and least privilege as the minimum privileges necessary to complete the job | Does not define modern IAM products or prove a deployed policy is least-privileged |
| `src-nist-sp800-160v1r1` | existing canonical locator | National Institute of Standards and Technology | Supports trustworthy-system treatment of least privilege, distributed privilege, and defense in depth | Does not replace system-specific threat analysis or prove controls are independent |
| `src-aws-making-retries-safe-idempotent-apis-2020` | `https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/` | Malcolm Featonby / Amazon Web Services | Uses a caller-supplied request identity and semantic equivalence to make selected mutating API retries safe within a declared contract | Does not establish universal exactly-once execution or make arbitrary external effects retry-safe |
| `src-berkeley-coordination-avoidance-2015` | `https://www2.eecs.berkeley.edu/Pubs/TechRpts/2015/EECS-2015-206.html` | Peter Bailis / UC Berkeley EECS | Defines coordination avoidance as using as little coordination as possible while preserving application integrity | Does not prove all workloads are coordination-free or eliminate ownership and serialization |
| `src-learn-1abc9c267864` | existing canonical locator | Microsoft | Retry guidance notes possible repeated execution and the need to consider idempotency | Does not prove a particular operation is idempotent |
| `src-martin-fowler-cqs-2005` | `https://martinfowler.com/bliki/CommandQuerySeparation.html` | Martin Fowler | Separates queries that return results without changing observable state from commands that change state, while acknowledging useful exceptions | Does not define CQRS or require absolute application at every method |
| `src-martin-fowler-cqrs-2011` | `https://martinfowler.com/bliki/CQRS.html` | Martin Fowler | CQRS uses different conceptual models for update and display and can use one or multiple stores | Does not require event sourcing, messaging, or separate physical databases and warns of risky complexity |
| `src-microsoft-cqrs-pattern-2025` | `https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs` | Microsoft | Separates command and query models, documents shared-store and separate-store variants, eventual consistency, and unsuitable simple CRUD contexts | Does not make every read replica a CQRS architecture |
| `src-aws-rds-read-replicas` | `https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html` | Amazon Web Services | Documents read-only replicas, asynchronous propagation, stale-read risk, and routing reads away from the primary | Does not create separate command/query domain models or guarantee read-your-write |

Use these rights boundaries:

- Saltzer/Schroeder MIT-hosted author page: `LicenseRef-All-Rights-Reserved`, facts-summary only; exclude embedded scans, diagrams, and publisher-formatted copies.
- Existing NIST SP 800-160: retain `LicenseRef-US-Gov-Public-Domain` and its current third-party exclusions.
- AWS Builders’ Library: `LicenseRef-All-Rights-Reserved`, facts-summary only; exclude diagrams, code, service marks, and linked works.
- UC Berkeley thesis record: `LicenseRef-All-Rights-Reserved`, facts-summary only; do not adapt its figures, formalism, prototype results, or examples.
- Existing Microsoft Retry record: retain its current CC BY 4.0 identity and usage boundary.
- Both MartinFowler.com records: `LicenseRef-All-Rights-Reserved`, facts-summary only; exclude diagrams, code, images, and linked works.
- Microsoft CQRS page: `CC-BY-4.0`, `copyright_policy: "vendor-claims-separated"`, facts-summary only; exclude code and third-party assets unless separately audited.
- AWS RDS documentation: `LicenseRef-All-Rights-Reserved`, facts-summary only; exclude diagrams, code, service marks, and linked works.

- [ ] **Step 2: Add the seven new canonical source records**

Add one source record for each new ID in Step 1. Every record uses:

```json
{
  "query_insensitive": false,
  "locator_aliases": [],
  "tombstone": null,
  "registered_at": "2026-07-28",
  "checked_at": "2026-07-28",
  "allowed_evidence_roles": [
    "definition",
    "historical-context",
    "implementation",
    "learning",
    "method",
    "comparison"
  ],
  "license_family_grouping": "identity",
  "family_grouping_evidence_url": null,
  "expected_final_approved_at": "2026-07-28"
}
```

Set identity-specific fields exactly as follows:

- Saltzer/Schroeder: `source_kind: "paper"`, `tier: "primary"`, `published_at: null`, `link_policy: "stable"`. Record Proceedings of the IEEE Vol. 63 No. 9, September 1975 in `version` without inventing a day-level date.
- AWS idempotent APIs: `source_kind: "engineering-blog"`, `tier: "first-party"`, `published_at: null`, `link_policy: "floating"`. The version text must say that the PDF visibly carries 2020 copyright and the page was checked on 2026-07-28; do not invent a day-level publication date.
- Berkeley coordination avoidance: `source_kind: "paper"`, `tier: "primary"`, `published_at: "2015-10-30"`, `link_policy: "stable"`, `license_family_id` equal to the canonical HTML URL.
- Fowler CQS: `source_kind: "independent-blog"`, `tier: "primary"`, `published_at: "2005-12-05"`, `link_policy: "stable"`.
- Fowler CQRS: `source_kind: "independent-blog"`, `tier: "primary"`, `published_at: "2011-07-14"`, `link_policy: "stable"`.
- Microsoft CQRS: `source_kind: "vendor-reference-architecture"`, `tier: "first-party"`, `published_at: "2025-02-21"`, `link_policy: "floating"`.
- AWS RDS read replicas: `source_kind: "official-docs"`, `tier: "first-party"`, `published_at: null`, `link_policy: "floating"`.

For `usage_boundary`, copy the exact fact boundary and non-claim from Step 1 into one concise sentence. Set `expected_final_transport_locator` to the canonical locator and write an `expected_final_approval_note` naming the transport, authorship/version, and rights evidence actually checked.

- [ ] **Step 3: Add the three governed document entries**

Add these entries to `ledger.documents`:

```json
{
  "content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx": {
    "reviewed_at": "2026-07-28",
    "copyright_checks": [
      "original-structure",
      "quotation-boundary",
      "attribution-complete",
      "illustration-rights"
    ],
    "citations": [
      {
        "source_id": "src-saltzer-schroeder-protection-1975",
        "citation_url": "https://web.mit.edu/Saltzer/www/publications/protection/",
        "roles": ["definition", "historical-context"],
        "manifest_primary": true,
        "usage_mode": "facts-summary",
        "attribution_note": "The Protection of Information in Computer Systems, Jerome H. Saltzer and Michael D. Schroeder",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      },
      {
        "source_id": "src-nist-sp800-160v1r1",
        "citation_url": "https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final",
        "roles": ["definition", "method"],
        "manifest_primary": false,
        "usage_mode": "facts-summary",
        "attribution_note": "NIST SP 800-160 Vol. 1 Rev. 1, Engineering Trustworthy Secure Systems",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      }
    ]
  },
  "content/principles/pr-10-idempotency-minimal-coordination.mdx": {
    "reviewed_at": "2026-07-28",
    "copyright_checks": [
      "original-structure",
      "quotation-boundary",
      "attribution-complete",
      "illustration-rights"
    ],
    "citations": [
      {
        "source_id": "src-aws-making-retries-safe-idempotent-apis-2020",
        "citation_url": "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/",
        "roles": ["definition", "implementation", "method"],
        "manifest_primary": true,
        "usage_mode": "facts-summary",
        "attribution_note": "Making retries safe with idempotent APIs, Malcolm Featonby / Amazon Web Services",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      },
      {
        "source_id": "src-berkeley-coordination-avoidance-2015",
        "citation_url": "https://www2.eecs.berkeley.edu/Pubs/TechRpts/2015/EECS-2015-206.html",
        "roles": ["definition", "method"],
        "manifest_primary": false,
        "usage_mode": "facts-summary",
        "attribution_note": "Coordination Avoidance in Distributed Databases, Peter Bailis / UC Berkeley EECS",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      },
      {
        "source_id": "src-learn-1abc9c267864",
        "citation_url": "https://learn.microsoft.com/en-us/azure/architecture/patterns/retry",
        "roles": ["implementation", "method"],
        "manifest_primary": false,
        "usage_mode": "facts-summary",
        "attribution_note": "Retry pattern, Azure Architecture Center",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      }
    ]
  },
  "content/principles/pr-11-cqs-cqrs-read-write-separation.mdx": {
    "reviewed_at": "2026-07-28",
    "copyright_checks": [
      "original-structure",
      "quotation-boundary",
      "attribution-complete",
      "illustration-rights"
    ],
    "citations": [
      {
        "source_id": "src-martin-fowler-cqs-2005",
        "citation_url": "https://martinfowler.com/bliki/CommandQuerySeparation.html",
        "roles": ["definition", "historical-context"],
        "manifest_primary": false,
        "usage_mode": "facts-summary",
        "attribution_note": "Command Query Separation, Martin Fowler",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      },
      {
        "source_id": "src-martin-fowler-cqrs-2011",
        "citation_url": "https://martinfowler.com/bliki/CQRS.html",
        "roles": ["definition", "historical-context", "method"],
        "manifest_primary": true,
        "usage_mode": "facts-summary",
        "attribution_note": "CQRS, Martin Fowler",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      },
      {
        "source_id": "src-microsoft-cqrs-pattern-2025",
        "citation_url": "https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs",
        "roles": ["implementation", "method"],
        "manifest_primary": false,
        "usage_mode": "facts-summary",
        "attribution_note": "CQRS pattern, Azure Architecture Center",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      },
      {
        "source_id": "src-aws-rds-read-replicas",
        "citation_url": "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html",
        "roles": ["implementation", "comparison"],
        "manifest_primary": false,
        "usage_mode": "facts-summary",
        "attribution_note": "Working with DB instance read replicas, Amazon RDS",
        "modification_note": null,
        "excerpt": null,
        "quotation_reviewed": false
      }
    ]
  }
}
```

- [ ] **Step 4: Refresh link health and retain only observed facts**

Run:

```bash
bun run refresh:links
```

Review all nine source locators. Do not hand-author `healthy`. Preserve the script’s actual status, redirect, authentication, retirement, or transport failure. Revert unrelated timestamp-only churn if it obscures review, while preserving any factual final-transport change.

- [ ] **Step 5: Validate source governance while preserving the content RED**

Run:

```bash
node --test tests/source-ledger.test.mjs
bun test tests/g007-batch3-content.test.mjs
```

Expected: source-ledger tests PASS. Batch 3 remains RED only because the three MDX files are absent.

- [ ] **Step 6: Commit governed source inputs**

```bash
git add data/source-ledger.json data/source-link-health.json
git commit -m "content: govern g007 side-effect boundary sources"
```

---

### Task 3: Publish PR-09 and its accurate reciprocal relations

**Files:**

- Create: `content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx`
- Modify: `content/principles/pr-04-dip-ioc-dependency-injection.mdx`
- Modify: `content/principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx`
- Modify: `tests/g007-batch1-content.test.mjs`
- Modify: `tests/g007-batch2-content.test.mjs`
- Test: `tests/g007-batch3-content.test.mjs`

**Interfaces:**

- Consumes: The governed PR-09 citations from Task 2 and existing routes `/principles/pr-04`, `/principles/pr-07`, and `/cases/litellm-virtual-keys-governance`.
- Produces: Published PR-09 with reciprocal published-page relations and no visible PR-12..17 route.

- [ ] **Step 1: Create PR-09 front matter and fixed section shell**

Create the file with this front matter:

```yaml
---
title: 最小权限、安全默认值与纵深防御
slug: /principles/pr-09
content_type: principle
status: reviewed
difficulty: advanced
analyzed_at: 2026-07-28
source_cutoff: 2026-07-28
confidence: high
domains:
  - software-architecture
  - security
agent_patterns: []
protocols: []
quality_attributes:
  - security
  - operability
tags:
  - 最小权限
  - 安全默认值
  - 纵深防御
summary: 从授权决策、权限生命周期和控制独立性约束运行时权限与故障半径。
topic_id: PR-09
priority: P0
depends_on:
  - PR-04
adjacent_topics:
  - PR-04
  - PR-07
  - PR-10
related_cases:
  - /cases/litellm-virtual-keys-governance
related_questions: []
---
```

Follow it with the title and exact nine H2 headings from Global Constraints.

- [ ] **Step 2: Write the PR-09 decision content and original authorization matrix**

Write four learning questions and make these exact assertions visible in the named sections:

- `要保护的性质`: Saltzer/Schroeder support permission-based defaults and least privilege; NIST supports a broader trustworthy-system and defense-in-depth context; neither proves the deployed controls.
- `冲突与适用上下文`: finer permissions reduce blast radius but increase policy, issuance, audit, revocation, and emergency-access cost.
- `机制`: include the exact sentences required by Task 1 and this original table:

```markdown
| 决策状态 | 当前请求结果 | 必需证据 | 后续动作 |
| --- | --- | --- | --- |
| 身份、动作、资源、约束均有明确授权 | 只发放本次操作所需能力 | subject、resource、action、scope、expiry | 执行并留下决策与使用审计 |
| 明确拒绝 | 拒绝 | 命中的 deny 与政策版本 | 返回可区分拒绝，不降级为匿名或宽权限 |
| 没有匹配策略 | 拒绝 | no-match 与输入摘要 | 修订策略或请求，不自动补 allow |
| 策略求值失败或身份陈旧 | 保守拒绝并标记控制故障 | error、identity age、dependency state | 告警、恢复控制面、禁止静默放行 |
| 紧急访问获批 | 发放短时、窄范围能力 | approver、owner、scope、expiry、ticket | 强审计，到期撤销并复盘 |
| 一层控制失效 | 由独立层限制剩余路径 | threat、trust boundary、independent signal | 隔离、告警并验证残余风险 |
```

- `误用与反原则`: include the exact role-count, silent-failure, authentication-only, correlated-control, and permanent-emergency-credential corrections.
- `适用尺度`: compare in-process capability, database privilege, service identity, cloud role, deployment credential, and operator access; state that a local module does not require an enterprise policy engine.
- `说明性场景`: trace a LiteLLM tenant request through virtual key, route policy, provider credential, rejected policy-engine state, and independently audited upstream scope. Label it as illustrative and do not claim the case implements every mechanism.
- `来源`: visibly link both governed source URLs and state their use boundaries.

Use the literal labels `失败模式`, `不适用`, and `运行成本` in prose so the contract tests the actual editorial boundary.

- [ ] **Step 3: Add only accurate reciprocal links**

Update front matter:

```yaml
# PR-04 adjacent_topics
  - PR-01
  - PR-05
  - PR-07
  - PR-08
  - PR-09
  - PR-11
```

```yaml
# PR-07 adjacent_topics
  - PR-02
  - PR-04
  - PR-09
  - PR-10
  - QA-01
```

In PR-04 `## 相邻原则`, add one sentence that PR-09 applies policy independence to runtime authorization and PR-11 separates command/query responsibility from injection mechanics.

In PR-07 `## 相邻原则`, add one sentence that PR-09 defines the conservative authorization result when policy is missing or unavailable and PR-10 handles truthful retry/unknown outcomes.

Do not add any visible PR-11 link from PR-04 until Task 4 creates PR-11. Front matter may list the relation because Task 3 and Task 4 integrate before generation; if running a page-level preview between tasks, complete Task 4 first.

- [ ] **Step 4: Advance historical unpublished-route and relation fixtures**

Update the historical contracts precisely:

- change unpublished principle checks from PR-09..17 to PR-12..17;
- in `tests/g007-batch1-content.test.mjs`, expand expected PR-04 relations with PR-09 and PR-11;
- in `tests/g007-batch2-content.test.mjs`, expand expected PR-07 relations with PR-09 and PR-10;
- keep all other historical assertions unchanged.

Use:

```js
assert.equal(
  [...links].some((link) => /^\/principles\/pr-1[2-7]$/u.test(link)),
  false,
  `${id} must not link unpublished principles`,
);
```

- [ ] **Step 5: Run the targeted contract**

Run:

```bash
bun test tests/g007-batch1-content.test.mjs tests/g007-batch2-content.test.mjs tests/g007-batch3-content.test.mjs
```

Expected: Batch 1 and Batch 2 PASS. All three Batch 3 subtests now reach PR-10 as their first missing page; no assertion fails on PR-09.

- [ ] **Step 6: Commit PR-09**

```bash
git add content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx content/principles/pr-04-dip-ioc-dependency-injection.mdx content/principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx tests/g007-batch1-content.test.mjs tests/g007-batch2-content.test.mjs
git commit -m "content: add authorization boundary principle"
```

---

### Task 4: Publish PR-10 and PR-11, then regenerate Stage A

**Files:**

- Create: `content/principles/pr-10-idempotency-minimal-coordination.mdx`
- Create: `content/principles/pr-11-cqs-cqrs-read-write-separation.mdx`
- Modify: `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx`
- Modify: `content/principles/pr-08-evolutionary-design.mdx`
- Modify: count fixtures listed in File Structure
- Generated: all generated files listed in File Structure
- Test: `tests/g007-batch3-content.test.mjs`

**Interfaces:**

- Consumes: Task 2 source records, Task 3 reciprocal relation state, and published Temporal case route.
- Produces: All three Batch 3 pages, complete reciprocal relations, 76 content documents, 443 governed sources, and a GREEN Stage A contract while backlog completion remains 30.

- [ ] **Step 1: Create PR-10 with the fixed front matter**

Use:

```yaml
---
title: 幂等与最小协调
slug: /principles/pr-10
content_type: principle
status: reviewed
difficulty: advanced
analyzed_at: 2026-07-28
source_cutoff: 2026-07-28
confidence: high
domains:
  - software-architecture
  - distributed-systems
agent_patterns: []
protocols: []
quality_attributes:
  - reliability
  - consistency
  - scalability
tags:
  - 幂等
  - 重试
  - 最小协调
summary: 用稳定操作身份、显式重放状态和共享不变量判断约束重复副作用与协调成本。
topic_id: PR-10
priority: P0
depends_on:
  - PR-07
adjacent_topics:
  - PR-07
  - PR-08
  - PR-09
  - PR-11
related_cases:
  - /cases/temporal-saga-durable-execution
related_questions: []
---
```

Follow with four learning questions and the exact nine H2 headings.

- [ ] **Step 2: Write PR-10 around the complete replay matrix**

In `机制`, include this original matrix:

```markdown
| 重放情形 | 权威状态 | 同键处理 | 协调或终态 |
| --- | --- | --- | --- |
| 首次尚未开始受保护副作用 | `accepted` | 原执行者取得租约或条件写 | 其余请求返回 in-progress |
| 首次成功但响应丢失 | `completed + result_ref` | 返回语义等价的已记录结果 | 不重复受保护效果 |
| 副作用可能成功但完成记录缺失 | `unknown` | 禁止盲重放 | 查询权威结果、补偿或人工处置 |
| 同键并发到达 | `in-progress` | 复用状态或返回处理中 | 不启动第二执行者 |
| 同键不同规范化意图 | `conflict` | 拒绝 | 记录 payload hash 与调用者 |
| 去重记录已过期 | `expired` | 不假定安全 | 新业务操作或人工核对 |
| 不同命令竞争同一不变量 | 各有独立键 | 幂等键不能解决冲突 | 所有权、条件写、配额或串行化 |
| 外部不可逆效果无法原子耦合 | `pending/unknown` | 稳定目标侧键与 receipt | 对账、补偿或人工终态 |
```

Include the Task 1 exact phrases and make these boundaries explicit:

- idempotency scope is logical operation identity plus a declared validity/retention window;
- byte-identical responses are not required, but semantic outcome must not multiply the protected effect;
- duplicate suppression does not resolve concurrent invariant conflicts;
- coordination is removed only when ownership, monotonicity, commutativity, escrow, or conditional writes preserve the named invariant;
- `unknown` is a first-class terminal or recovery state, not a generic failure;
- Temporal is illustrative evidence for replay and target-side idempotency, not proof of business exactly-once.

Use the literal labels `失败模式`, `不适用`, and `协调成本`.

- [ ] **Step 3: Create PR-11 with the fixed front matter**

Use:

```yaml
---
title: CQS、CQRS 与读写分离
slug: /principles/pr-11
content_type: principle
status: reviewed
difficulty: advanced
analyzed_at: 2026-07-28
source_cutoff: 2026-07-28
confidence: high
domains:
  - software-architecture
  - data-architecture
agent_patterns: []
protocols: []
quality_attributes:
  - maintainability
  - performance
  - scalability
  - consistency
tags:
  - CQS
  - CQRS
  - 读写分离
summary: 按方法、模型和基础设施三个尺度区分命令查询分离，并以模型分歧与运行成本决定是否采用 CQRS。
topic_id: PR-11
priority: P1
depends_on:
  - PR-03
adjacent_topics:
  - PR-03
  - PR-04
  - PR-10
related_cases:
  - /cases/temporal-saga-durable-execution
related_questions: []
---
```

Follow with four learning questions and the exact nine H2 headings.

- [ ] **Step 4: Write PR-11 around a four-outcome decision table**

In `机制`, include:

```markdown
| 证据 | 选择 | 数据与一致性责任 | 不增加的复杂度 |
| --- | --- | --- | --- |
| 单个操作混合观察与领域变更 | 在现有模型内应用 CQS | 明确可观察状态与例外 | 不拆模型、不拆存储 |
| 模型相同，只是查询慢或读多 | 优化单模型读取 | 索引、缓存、查询 DTO 与容量证据 | 不引入投影流水线 |
| 只需卸载读取或提高可用性 | 基础设施读写分流 | 副本延迟、read-your-write 与路由 | 不声称 CQRS |
| 命令规则与查询形状长期不同，且团队能承担运维 | 采用 CQRS | 投影、重复事件、重建、对账、模式演化 | 不默认要求 Event Sourcing 或双数据库 |
```

Include the Task 1 exact phrases and state:

- CQS is an operation/interface rule about observable state, with documented exceptions such as combined atomic operations;
- CQRS separates responsibilities and conceptual models, not necessarily stores;
- Amazon RDS read replicas demonstrate infrastructure read routing and asynchronous lag, not CQRS;
- CQRS is rejected for simple CRUD, materially identical models, strict immediate-consistency dominance, or insufficient projection ownership;
- the Temporal scenario separates state-changing commands from read-only reconciliation/query paths but remains an illustration, not a declaration that Temporal itself equals CQRS.

Use the literal labels `失败模式`, `不采用`, and `运行成本`.

- [ ] **Step 5: Close remaining reciprocal relations**

Update front matter:

```yaml
# PR-03 adjacent_topics
  - PR-01
  - PR-02
  - PR-05
  - PR-11
```

```yaml
# PR-08 adjacent_topics
  - PR-01
  - PR-04
  - PR-05
  - PR-06
  - PR-10
  - MTH-03
  - MTH-04
```

Add one sentence in PR-03 `## 相邻原则` stating that PR-11 applies responsibility separation to command and query models only when scale and model divergence justify it.

Add one sentence in PR-08 `## 相邻原则` stating that PR-10 requires compatibility migrations and retries to preserve stable operation identity and explicit unknown outcomes.

In `tests/g007-batch1-content.test.mjs`, add PR-11 to PR-03. In `tests/g007-batch2-content.test.mjs`, add PR-10 to PR-08. Do not alter unrelated prose or relations.

- [ ] **Step 6: Regenerate and update only deterministic Stage A counts**

Run:

```bash
bun run generate:content
```

Expected generated state:

- PR-09, PR-10, and PR-11 are `published: true`;
- PR-12 through PR-17 are `published: false`;
- `content_documents` is 76;
- `governed_sources` is 443;
- `completed_topics` remains 30 because Stage A backlog rows are still unchecked.

Update exact count fixtures:

- `tests/content-review-health.test.mjs`: 73→76 documents and 436→443 sources;
- `tests/source-ledger-rendering.test.mjs`: 436→443 cards;
- `tests/source-ledger-pagination.test.mjs`: 436→443 IDs and unique IDs;
- `tests/project-status.test.mjs`: 73→76 documents, 436→443 sources, keep 30 completed topics during Stage A.

- [ ] **Step 7: Run the complete targeted Stage A gate**

Run:

```bash
bun test tests/g007-batch1-content.test.mjs tests/g007-batch2-content.test.mjs tests/g007-batch3-content.test.mjs tests/content-review-health.test.mjs tests/source-ledger-rendering.test.mjs tests/source-ledger-pagination.test.mjs tests/project-status.test.mjs
node --test tests/source-ledger.test.mjs
bun run validate:content
bun run check:content
git diff --check
```

Expected: every command PASS and no generated drift.

- [ ] **Step 8: Commit complete Stage A content**

```bash
git add content/principles data/source-ledger.json data/source-link-health.json src/generated docs/source-license-inventory.md tests/g007-batch1-content.test.mjs tests/g007-batch2-content.test.mjs tests/g007-batch3-content.test.mjs tests/content-review-health.test.mjs tests/source-ledger-rendering.test.mjs tests/source-ledger-pagination.test.mjs tests/project-status.test.mjs
git commit -m "content: publish side-effect boundary principles"
```

---

### Task 5: Verify, independently review, integrate, and deploy exact Stage A

**Files:**

- Review: all Stage A files from Tasks 1–4
- No new tracked file until Stage A production evidence exists

**Interfaces:**

- Consumes: A clean feature branch whose targeted contract is GREEN.
- Produces: A main-branch Stage A commit with a successful exact-SHA Pages run and recorded runtime observations for Stage B.

- [ ] **Step 1: Run the full repository gate from a clean worktree**

Run:

```bash
bun run verify
git diff --check
git status --short
```

Expected: the full test/validation/generation/link/review/typecheck/build chain PASS, no whitespace errors, and no uncommitted changes.

- [ ] **Step 2: Obtain an independent editorial and test review**

Review PR-09, PR-10, and PR-11 separately for:

- every exact decision boundary in the approved spec;
- factual claims supported by the citation attached to that page;
- original structure and copyright/quotation scope;
- explicit non-claims and anti-overclaim language;
- deterministic representation completeness;
- parent, reciprocal adjacent, and case links;
- no visible PR-12..17 routes;
- test strength, including exact misconception phrases and mutation resistance.

Any Critical or Important finding blocks integration. Add a targeted regression before fixing the content, rerun Task 4 Step 7 and Task 5 Step 1, and obtain a clean follow-up verdict.

- [ ] **Step 3: Push the feature branch and integrate without rewriting verified commits**

Run:

```bash
git push -u origin codex/g007-principles-batch3
```

Integrate through the repository’s normal reviewed path. If fast-forwarding locally:

```bash
git -C /Users/seal/projects/tego-arch merge --ff-only codex/g007-principles-batch3
git -C /Users/seal/projects/tego-arch push origin main
```

Record:

```bash
git -C /Users/seal/projects/tego-arch rev-parse HEAD
git -C /Users/seal/projects/tego-arch rev-parse origin/main
```

Expected: both SHAs are identical. This exact value is the Stage A SHA.

- [ ] **Step 4: Wait for the exact-SHA GitHub Pages run**

Use GitHub CLI:

```bash
STAGE_A_SHA="$(git -C /Users/seal/projects/tego-arch rev-parse HEAD)"
gh run list --repo sealday/tego-arch --workflow deploy.yml --limit 20 --json databaseId,headSha,status,conclusion,url
```

Resolve and poll only the run whose `headSha` equals `STAGE_A_SHA`:

```bash
PAGES_RUN_ID="$(gh run list --repo sealday/tego-arch --workflow deploy.yml --limit 20 --json databaseId,headSha --jq ".[] | select(.headSha == \"$STAGE_A_SHA\") | .databaseId" | head -1)"
test -n "$PAGES_RUN_ID"
gh run view "$PAGES_RUN_ID" --repo sealday/tego-arch --json databaseId,headSha,status,conclusion,url
```

Expected: matching `headSha`, `status=completed`, and `conclusion=success`. A newer successful run for a different SHA does not satisfy the gate.

- [ ] **Step 5: Verify production routes, assets, viewports, and real navigation**

Check HTTP 200 for:

- `https://sealday.github.io/tego-arch/principles`
- `https://sealday.github.io/tego-arch/principles/pr-09`
- `https://sealday.github.io/tego-arch/principles/pr-10`
- `https://sealday.github.io/tego-arch/principles/pr-11`
- the current hashed CSS asset loaded by the deployed HTML;
- the current hashed runtime JavaScript asset loaded by the deployed HTML.

Inspect each page at desktop `1440x1000` and mobile `390x844`:

- no page-level horizontal overflow;
- tables or Mermaid overflow only inside their local container;
- zero console warnings and errors on clean navigation;
- every governed source link is visible;
- no PR-12..17 link is visible;
- every parent, adjacent, and required case link is clicked and reaches the expected production route.

Record the exact CSS URL, JavaScript URL, per-page click totals, console result, overflow result, and source labels for Task 6. Do not infer them from local build output.

---

### Task 6: Close Batch 3 with deployment-backed Stage B evidence

**Files:**

- Create: `docs/reviews/g007-batch3.md`
- Create: `tests/g007-batch3-deployment.test.mjs`
- Modify: `docs/content-backlog.md`
- Modify: `tests/project-status.test.mjs`
- Modify: `tests/knowledge-fixtures.test.mjs`
- Generated: generated files listed in File Structure

**Interfaces:**

- Consumes: The observed Stage A SHA, matching successful Pages run, production assets, viewport/console/overflow results, source labels, and actual click matrix from Task 5.
- Produces: Immutable Stage B evidence, exactly three closed backlog rows, 33 completed topics, 76 documents, 443 sources, and G007 still current with PR-12 next.

- [ ] **Step 1: Write the review with literal observed evidence**

Create `docs/reviews/g007-batch3.md` only after Task 5 succeeds. Produce the three literal evidence lines from the observed shell variables:

```bash
printf 'Exact Stage A SHA: `%s`\\n' "$STAGE_A_SHA"
printf 'GitHub Pages run: [`%s`](https://github.com/sealday/tego-arch/actions/runs/%s)\\n' "$PAGES_RUN_ID" "$PAGES_RUN_ID"
printf 'Exact run gate: `headSha=%s`, `status=completed`, `conclusion=success`.\\n' "$STAGE_A_SHA"
```

Copy the command output into the review exactly. Do not save shell variable names or command text as evidence.

Add:

- one editorial/fact/copyright/representation/anti-overclaim subsection per principle;
- the independent reviewer identity and clean verdict;
- the exact full Stage A repository test count observed from `bun run verify`;
- production routes and exact hashed asset URLs;
- desktop/mobile viewport evidence;
- page-level and local-overflow evidence;
- zero console diagnostics;
- the exact click matrix with adjacent and case categories;
- visible labels for Saltzer/Schroeder, NIST SP 800-160, AWS idempotent APIs, Berkeley coordination avoidance, Fowler CQS/CQRS, Microsoft CQRS, and Amazon RDS read replicas;
- `Stage B closure — PASS`.

State `76 content documents`, `443 governed sources`, G007 current, and PR-12 next.

- [ ] **Step 2: Close exactly PR-09 through PR-11 in the backlog**

For PR-09, PR-10, and PR-11 only:

- change `[ ]` to `[x]`;
- append the exact Stage A commit link;
- append the exact Pages run link;
- append the canonical production route;
- summarize the verified representation, viewports, source visibility, and click evidence.

Update the current release baseline to Batch 3 with:

- 33 completed topics;
- 76 content documents;
- 443 governed sources;
- the literal Stage A SHA and exact Pages run;
- G007 still current;
- PR-12 as the next batch start.

Keep durable story progress `6 / 20` and most recently completed parent story `G006`.

- [ ] **Step 3: Add the exact deployment regression**

Create `tests/g007-batch3-deployment.test.mjs`. Parse the literal evidence from the completed review, validate its format, cross-check it against the backlog, and require the referenced commit to exist:

```js
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = ['09', '10', '11'];

const [review, backlog, manifest] = await Promise.all([
  readFile(new URL('../docs/reviews/g007-batch3.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
]);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));
const stageAShaMatch = review.match(/^Exact Stage A SHA: `([0-9a-f]{40})`$/mu);
const pagesRunMatch = review.match(
  /^GitHub Pages run: \[`([0-9]+)`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\1\)$/mu,
);
assert.ok(stageAShaMatch, 'review must contain one literal Stage A SHA');
assert.ok(pagesRunMatch, 'review must contain one literal Pages run and matching URL');
const stageASha = stageAShaMatch[1];
const pagesRunId = pagesRunMatch[1];
const pagesRunUrl = `https://github.com/sealday/tego-arch/actions/runs/${pagesRunId}`;

function assertLiteralEvidence(source) {
  assert.ok(source.includes(`Exact Stage A SHA: \`${stageASha}\``));
  assert.ok(
    source.includes(`GitHub Pages run: [\`${pagesRunId}\`](${pagesRunUrl})`),
  );
  assert.ok(
    source.includes(
      `Exact run gate: \`headSha=${stageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
    ),
  );
  for (const literal of [
    'desktop `1440x1000`',
    'mobile `390x844`',
    '0 warnings、0 errors',
    'Saltzer/Schroeder',
    'NIST SP 800-160',
    'AWS idempotent APIs',
    'Berkeley coordination avoidance',
    'Fowler CQS/CQRS',
    'Microsoft CQRS',
    'Amazon RDS read replicas',
    '76 content documents',
    '443 governed sources',
    'Stage B closure — PASS',
  ]) {
    assert.ok(source.includes(literal), `review must record ${literal}`);
  }
}

test('records an exact successful G007 Batch 3 deployment', () => {
  assertLiteralEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${stageASha}^{commit}`], {
      cwd: root,
      stdio: 'pipe',
    }),
  );
  for (const [literal, mutation] of [
    ['0 warnings、0 errors', '1 warning、0 errors'],
    ['Stage B closure — PASS', 'Stage B closure — FAIL'],
  ]) {
    assert.throws(() => assertLiteralEvidence(review.replaceAll(literal, mutation)), {
      name: 'AssertionError',
    });
  }
});

test('closes only PR-09 through PR-11 and leaves PR-12 next', () => {
  for (const id of routes) {
    const row = backlog
      .split(/\r?\n/u)
      .find((line) => line.startsWith(`- [x] **PR-${id} `));
    assert.ok(row, `PR-${id} must be checked`);
    assert.ok(row.includes(stageASha));
    assert.ok(row.includes(pagesRunUrl));
    assert.ok(
      row.includes(`https://sealday.github.io/tego-arch/principles/pr-${id}`),
    );
    assert.deepEqual(topicsById.get(`PR-${id}`)?.status, {
      scope: 'backlog-projection',
      value: 'complete',
      source: 'docs/content-backlog.md',
    });
  }
  for (let number = 12; number <= 17; number += 1) {
    const id = `PR-${number}`;
    assert.match(backlog, new RegExp(`^- \\[ \\] \\*\\*${id} `, 'mu'));
    assert.equal(topicsById.get(id)?.published, false);
  }
  assert.match(backlog, /- \*\*当前持久故事：\*\* `G007`。/u);
  assert.match(
    backlog,
    /- \*\*持久故事进度：\*\* 已完成 `6 \/ 20`；最近完成 `G006`。/u,
  );
});
```

Before saving this test, add the observed production CSS URL, JavaScript URL, and click-matrix string from the review to `assertLiteralEvidence`. These are copied values, not predicted hashes or counts.

- [ ] **Step 4: Regenerate Stage B and update completion fixtures**

Run:

```bash
bun run generate:content
```

Expected:

- PR-09 through PR-11 remain published and now have complete backlog-projection status;
- PR-12 through PR-17 remain pending and unpublished;
- `completed_topics` is 33;
- `content_documents` is 76;
- `governed_sources` is 443.

Update:

- `tests/project-status.test.mjs` from 30 to 33 completed topics while keeping 76 documents and 443 sources;
- `tests/knowledge-fixtures.test.mjs` so the principle fixture includes PR-09, PR-10, and PR-11 with complete status.

- [ ] **Step 5: Run the complete Stage B gate**

Run:

```bash
bun test tests/g007-batch3-deployment.test.mjs tests/g007-batch3-content.test.mjs tests/project-status.test.mjs tests/knowledge-fixtures.test.mjs
bun run verify
git diff --check
```

Expected: every command PASS. Record the exact current full-test count in the review and strengthen the deployment regression to require that literal count before committing.

- [ ] **Step 6: Commit, push, and verify Stage B**

```bash
git add docs/reviews/g007-batch3.md docs/content-backlog.md tests/g007-batch3-deployment.test.mjs tests/project-status.test.mjs tests/knowledge-fixtures.test.mjs src/generated
git commit -m "docs: close g007 side-effect boundary batch"
git push origin main
```

Wait for the Pages run whose `headSha` equals this Stage B commit and require `completed/success`. Recheck `/principles` and `/principles/pr-09` through `/principles/pr-11` for HTTP 200.

Finally verify:

```bash
git rev-parse HEAD
git rev-parse origin/main
git status --short
```

Expected: local and remote main SHAs match, the implementation worktree is clean, G007 remains current, and PR-12 is the next pending principle.
