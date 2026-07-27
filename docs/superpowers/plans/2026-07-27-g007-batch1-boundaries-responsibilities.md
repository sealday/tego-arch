# G007 Batch 1 Boundary and Responsibility Principles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Review PR-01 and publish PR-02 through PR-05 as one governed, mutually linked architecture-principles batch, then close only those topics after exact-SHA Pages deployment and live-route verification.

**Architecture:** Each principle remains an independent MDX knowledge unit with the canonical nine-section contract. Front matter is the canonical published relationship input, the source ledger governs factual provenance, and generated manifest/index/relation files are written only through the content generator. Delivery uses a test-first Stage A content commit followed by a deployment-backed Stage B closure commit.

**Tech Stack:** Bun command runner, Node test runner through `bun test`, MDX, Mermaid, JSON source ledger, Docusaurus 3.10.2, TypeScript 6, GitHub Pages.

## Global Constraints

- Work only in `/Users/seal/projects/tego-arch/.worktrees/g007-principles` on `codex/g007-principles` until Stage A is ready to fast-forward into `main`.
- Preserve the existing PR-01 argument and illustration; edit only its fact labels, governed relationships, and necessary cross-links.
- Publish PR-02 through PR-05 at canonical slugs `/principles/pr-02` through `/principles/pr-05`.
- Use the exact H2 order: `学习问题`, `要保护的性质`, `冲突与适用上下文`, `机制`, `误用与反原则`, `适用尺度`, `相邻原则`, `说明性场景`, `来源`.
- Every page asks 3–5 learning questions, cites at least two governed sources, has exactly one manifest primary citation, distinguishes source fact/inference/site analysis, and contains an original Mermaid diagram or decision table.
- Do not add visible internal links to unpublished PR-06 through PR-17.
- Do not manually edit files under `src/generated/`; run `bun run generate:content`.
- `docs/content-backlog.md` remains unchecked for PR-01 through PR-05 during Stage A and changes only after an exact-SHA successful Pages deployment and live smoke.
- Use Bun commands instead of invoking Node, npm, pnpm, Yarn, or Vite directly.
- G007 remains in progress after this batch; do not checkpoint it.

---

### Task 1: Define the failing G007 Batch 1 content contract

**Files:**
- Create: `tests/g007-batch1-content.test.mjs`
- Read: `content/principles/pr-01-information-hiding.mdx`
- Read: `src/generated/topic-manifest.json`
- Read: `data/source-ledger.json`

**Interfaces:**
- Consumes: `readContentDocuments(root)`, `extractMarkdownBody(source)`, `findMarkdownHeadings(source)`, `extractInternalLinks(document)`, and `extractExternalLinks(document)` from existing scripts.
- Produces: A real-content contract for PR-01 through PR-05 that later content and ledger tasks must satisfy.

- [ ] **Step 1: Create the expected topic and relationship fixtures**

Create the test with these canonical fixtures at the top:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  extractMarkdownBody,
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const expected = new Map([
  ['PR-01', ['principles/pr-01-information-hiding.mdx', '/principles/pr-01']],
  ['PR-02', ['principles/pr-02-cohesion-coupling.mdx', '/principles/pr-02']],
  ['PR-03', ['principles/pr-03-single-responsibility-separation-of-concerns.mdx', '/principles/pr-03']],
  ['PR-04', ['principles/pr-04-dip-ioc-dependency-injection.mdx', '/principles/pr-04']],
  ['PR-05', ['principles/pr-05-composition-over-inheritance.mdx', '/principles/pr-05']],
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
  ['PR-01', ['PR-02', 'PR-03', 'PR-04', 'STY-00']],
  ['PR-02', ['PR-01', 'PR-03', 'PR-05']],
  ['PR-03', ['PR-01', 'PR-02', 'PR-05']],
  ['PR-04', ['PR-01', 'PR-05']],
  ['PR-05', ['PR-02', 'PR-03', 'PR-04']],
]);
```

- [ ] **Step 2: Add real content, structure, and representation assertions**

Load real content and add a test that checks every page:

```js
const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const byId = new Map(documents
  .filter(({metadata}) => typeof metadata.topic_id === 'string')
  .map((document) => [document.metadata.topic_id, document]));
const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function section(body, heading) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `missing ## ${heading}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start + 1, end);
}

test('publishes PR-01 through PR-05 with the principle contract', () => {
  for (const [id, [file, slug]] of expected) {
    const document = byId.get(id);
    assert.ok(document, `${id} must be published`);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'principle');
    assert.equal(document.metadata.priority, id === 'PR-01' ? 'P0' : 'P0');
    assert.equal(document.metadata.status, 'reviewed');
    assert.deepEqual(document.metadata.adjacent_topics, relationships.get(id));
    assert.deepEqual(
      document.headings.filter(({level}) => level === 2).map(({text}) => text),
      h2,
    );
    const questions = section(document.body, '学习问题')
      .split(/\r?\n/)
      .filter((line) => /^ {0,3}[-*+]\s+\S.*[?？]\s*$/u.test(line));
    assert.ok(questions.length >= 3 && questions.length <= 5, `${id} learning questions`);
    assert.match(document.body, /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu, `${id} original representation`);
    assert.match(document.body, /来源事实|事实/u, `${id} fact label`);
    assert.match(document.body, /推断|推论/u, `${id} inference label`);
    assert.match(document.body, /本站分析|本站整理|本站绘制/u, `${id} site-analysis label`);
    assert.match(document.body, /不应|不适用|反例|误用/u, `${id} negative boundary`);
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
});
```

- [ ] **Step 3: Add source, relation, and concept-correction assertions**

Add tests that require exactly one manifest primary, two or more citations, reciprocal visible links, no unpublished principle links, and the page-specific vocabulary:

```js
test('governs sources and reciprocal visible relationships', () => {
  for (const [id, [file]] of expected) {
    const document = byId.get(id);
    assert.ok(document);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has two sources`);
    assert.equal(
      governed.citations.filter(({manifest_primary}) => manifest_primary).length,
      1,
      `${id} has exactly one manifest primary`,
    );
    assert.ok(extractExternalLinks(document).length >= 2, `${id} visible sources`);
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id).filter((topic) => topic.startsWith('PR-'))) {
      assert.ok(links.has(`/principles/${adjacent.toLowerCase()}`), `${id} visibly links ${adjacent}`);
    }
    assert.ok([...links].some((link) => link.startsWith('/cases/')), `${id} links a case`);
    assert.equal([...links].some((link) => /^\/principles\/pr-(?:0[6-9]|1[0-7])$/u.test(link)), false);
  }
});

test('keeps the five concepts distinct at their decision boundaries', () => {
  assert.match(byId.get('PR-01').body, /设计决策|访问修饰符|private/iu);
  assert.match(byId.get('PR-02').body, /变化耦合|运行时耦合|数据耦合|团队耦合/u);
  assert.match(byId.get('PR-03').body, /变化原因|责任主体|关注点分离|一件事/u);
  assert.match(byId.get('PR-04').body, /依赖倒置|控制反转|依赖注入|容器/u);
  assert.match(byId.get('PR-05').body, /多态|共享实现|状态耦合|替换成本/u);
});
```

- [ ] **Step 4: Run the new test and verify the intended RED**

Run:

```bash
bun test tests/g007-batch1-content.test.mjs
```

Expected: FAIL assertions stating `PR-02 must be published` through `PR-05 must be published`. It must not fail with a syntax error, missing import, or wrong path.

- [ ] **Step 5: Commit the RED contract**

```bash
git add tests/g007-batch1-content.test.mjs
git commit -m "test: define g007 boundary principle contracts"
```

### Task 2: Govern the source set before drafting conclusions

**Files:**
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Test: `tests/g007-batch1-content.test.mjs`

**Interfaces:**
- Consumes: Existing source schema and PR-01 source IDs `src-acm-96e876360753` and `src-sei-bfb2b903b4eb`.
- Produces: Stable source IDs and governed document citation entries for PR-02 through PR-05, consumed by the MDX source sections and generator.

- [ ] **Step 1: Audit each candidate transport and freeze usage boundaries**

Check these candidate families in a browser or with read-only HTTP requests; use the canonical final URL, bibliographic date/version, author/organization, and explicit reuse terms:

- PR-02: a primary modularity/cohesion-coupling source plus SEI maintainability/modularity material;
- PR-03: Parnas or another primary responsibility/decomposition source plus Robert C. Martin’s SRP clarification as secondary interpretation;
- PR-04: Robert C. Martin’s DIP material plus Martin Fowler’s `Inversion of Control Containers and the Dependency Injection pattern`;
- PR-05: the original Design Patterns bibliographic record plus an official language/platform source that documents inheritance and composition mechanics.

Reject a candidate if its final transport cannot be stabilized, authorship/version cannot be established, or it would only support copied prose/figures. Record a narrow `usage_boundary` that states what the source does **not** prove.

- [ ] **Step 2: Add or reuse canonical source records**

For every accepted source, derive a stable semantic `src-*` ID from the work rather than the transport hash. Populate all fields required by `parseSourceLedger`: canonical/final transport, aliases, exact title and authorship, publication and audit dates, version, source kind, tier, evidence roles, rights evidence, copyright policy, a narrow usage boundary, and expected-final approval data. Set `registered_at`, `checked_at`, and `expected_final_approved_at` to `2026-07-27`.

Use `LicenseRef-All-Rights-Reserved` plus `facts-and-short-quotation` unless the audited rights page grants a more permissive license. The `usage_boundary` must name both the fact supported and a non-claim—for example, a coupling taxonomy does not prove that one numeric coupling score predicts maintainability. Use the actual source kind, tier, dates, roles, and license discovered in Step 1; never copy a neighboring record’s rights fields without checking its license family.

- [ ] **Step 3: Add pending document governance entries**

Add `content/principles/pr-02-cohesion-coupling.mdx` through `pr-05-composition-over-inheritance.mdx` to `ledger.documents`. Set `reviewed_at` to `2026-07-27` and use all four copyright checks: `original-structure`, `quotation-boundary`, `attribution-complete`, and `illustration-rights`.

Each entry must have at least two citations. Mark exactly one primary source with `manifest_primary: true`; mark all others false. Every citation uses `usage_mode: facts-summary`, `modification_note: null`, `excerpt: null`, and `quotation_reviewed: false`, plus roles and an attribution note that exactly match the governed source. Update PR-01 `reviewed_at` to `2026-07-27` without changing its two established source identities.

- [ ] **Step 4: Refresh only the new link transports**

Run:

```bash
bun run refresh:links
```

Review `data/source-link-health.json`; retain only factual transport results generated by the script. Do not hand-author a successful status for an unreachable source.

- [ ] **Step 5: Validate source schema before writing pages**

Run:

```bash
bun test tests/source-ledger.test.mjs tests/g007-batch1-content.test.mjs
```

Expected: source-ledger tests PASS; G007 remains FAIL only because PR-02 through PR-05 content is absent.

- [ ] **Step 6: Commit governed source inputs**

```bash
git add data/source-ledger.json data/source-link-health.json
git commit -m "content: govern g007 boundary principle sources"
```

### Task 3: Review PR-01 and publish PR-02 and PR-03

**Files:**
- Modify: `content/principles/pr-01-information-hiding.mdx`
- Create: `content/principles/pr-02-cohesion-coupling.mdx`
- Create: `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx`
- Test: `tests/g007-batch1-content.test.mjs`

**Interfaces:**
- Consumes: Source IDs and URLs established in Task 2; canonical slugs and relationships from Task 1.
- Produces: Three mutually linked principle documents used by PR-04 and PR-05.

- [ ] **Step 1: Update PR-01 metadata and visible links**

Set `analyzed_at` and `source_cutoff` to `2026-07-27`, and set:

```yaml
adjacent_topics:
  - PR-02
  - PR-03
  - PR-04
  - STY-00
```

Add visible links to `/principles/pr-02`, `/principles/pr-03`, and `/principles/pr-04` in `## 相邻原则`. Add the exact labels `来源事实`, `推断`, and `本站分析` around existing claims without replacing the current Parnas argument or Mermaid illustration.

- [ ] **Step 2: Write PR-02 with the four-dimensional coupling model**

Create front matter with `topic_id: PR-02`, `slug: /principles/pr-02`, `priority: P0`, `status: reviewed`, the Task 1 adjacency list, and at least one existing related case. Write all nine H2 sections. In `## 机制`, include an original table with rows for 变化耦合、运行时耦合、数据耦合、团队耦合 and columns for signal, propagation boundary, and mitigation. Explicitly state that reducing one dimension can increase another.

- [ ] **Step 3: Write PR-03 around change reasons and responsibility owners**

Create front matter with `topic_id: PR-03`, `slug: /principles/pr-03`, `priority: P0`, `status: reviewed`, the Task 1 adjacency list, and at least one existing related case. In `## 机制`, include an original responsibility/change matrix. Explain why method count, file size, technical layers, and “one thing” are insufficient tests. Separate SRP’s responsibility ownership from SoC’s concern dimensions.

- [ ] **Step 4: Run the targeted test and inspect the remaining RED**

Run:

```bash
bun test tests/g007-batch1-content.test.mjs
```

Expected: PR-01, PR-02, and PR-03 assertions advance to PASS; failure remains for missing PR-04 and PR-05. Fix content-contract failures in these three pages before continuing.

- [ ] **Step 5: Commit the first content cluster**

```bash
git add content/principles/pr-01-information-hiding.mdx content/principles/pr-02-cohesion-coupling.mdx content/principles/pr-03-single-responsibility-separation-of-concerns.mdx
git commit -m "content: add responsibility boundary principles"
```

### Task 4: Publish PR-04 and PR-05 and close reciprocal content relations

**Files:**
- Create: `content/principles/pr-04-dip-ioc-dependency-injection.mdx`
- Create: `content/principles/pr-05-composition-over-inheritance.mdx`
- Modify: `content/principles/pr-02-cohesion-coupling.mdx`
- Modify: `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx`
- Test: `tests/g007-batch1-content.test.mjs`

**Interfaces:**
- Consumes: PR-01 through PR-03 links and Task 2 source governance.
- Produces: Complete reciprocal PR-01 through PR-05 content graph.

- [ ] **Step 1: Write PR-04 with three distinct edge types**

Create canonical front matter and all nine sections. In the original Mermaid diagram, visually distinguish:

```text
source-code dependency: high-level policy -> abstraction <- low-level detail
runtime control: framework/caller -> application callback
object assembly: composition root -> concrete dependency -> consumer
```

State directly that a DI container neither proves DIP nor is required for IoC. Include at least one situation where direct construction is simpler and appropriate.

- [ ] **Step 2: Write PR-05 with inheritance and composition decision boundaries**

Create canonical front matter and all nine sections. Include an original inheritance-tree versus object-composition diagram or decision table. Cover stable substitutable type relationships, shared implementation, protected/state coupling, initialization order, forwarding/assembly cost, and replacement cost. Include a case where inheritance is appropriate and a case where composition is needlessly indirect.

- [ ] **Step 3: Complete reciprocal visible links in PR-02 and PR-03**

Ensure PR-02 visibly links PR-01, PR-03, and PR-05; PR-03 visibly links PR-01, PR-02, and PR-05; PR-04 visibly links PR-01 and PR-05; PR-05 visibly links PR-02, PR-03, and PR-04. Every page must also visibly link `/principles` and one existing `/cases/...` route.

- [ ] **Step 4: Generate canonical projections**

Run:

```bash
bun run generate:content
```

Expected generated changes: PR-02 through PR-05 become published in `src/generated/topic-manifest.json` and `src/generated/topic-indexes.json`; `data/topic-relations.json` changes only if the generator requires a projection update. Inspect the diff and reject unrelated generated drift.

- [ ] **Step 5: Run the targeted GREEN gate**

Run:

```bash
bun test tests/g007-batch1-content.test.mjs
```

Expected: all G007 Batch 1 tests PASS with zero failures.

- [ ] **Step 6: Run content and relation regressions**

Run:

```bash
bun test tests/content-validation.test.mjs tests/content-relations.test.mjs tests/topic-manifest.test.mjs tests/topic-index.test.mjs tests/knowledge-fixtures.test.mjs
bun run validate:content
bun run check:content
```

Expected: all selected tests and both commands PASS. If a fixed published count changes, update only the exact fixture that models that count, then rerun this step.

- [ ] **Step 7: Commit the complete content graph**

```bash
git add content/principles data/source-ledger.json data/source-link-health.json data/topic-relations.json src/generated tests
git commit -m "feat: publish g007 boundary principles"
```

### Task 5: Stage A verification, independent review, merge, and deployment

**Files:**
- Do not create yet: `docs/reviews/g007-batch1.md`
- Do not modify: `docs/content-backlog.md` during Stage A.

**Interfaces:**
- Consumes: Complete content graph and generated projections.
- Produces: Exact Stage A SHA, review findings, Pages run ID, and live smoke evidence required by Task 6.

- [ ] **Step 1: Run the full pre-commit verification gate**

Run:

```bash
bun run generate:content
bun run verify
git diff --check
git status --short
```

Expected: generation has no unexpected drift; full verify exits 0; diff check exits 0. Any failure blocks deployment.

- [ ] **Step 2: Perform an independent repository-contract review**

Review each page separately for editorial completeness, factual support, copyright boundaries, anti-overclaim language, deterministic representation, visible reciprocal links, parent-index links, and related-case links. Record findings by PR ID. A reviewer must be independent of the page prose: use repository contract tests and source-ledger evidence rather than accepting article claims as proof.

- [ ] **Step 3: Push the feature branch and fast-forward main**

```bash
git push -u origin codex/g007-principles
cd /Users/seal/projects/tego-arch
git fetch origin --prune
git merge --ff-only codex/g007-principles
git push origin main
```

Record the exact Stage A SHA:

```bash
git rev-parse HEAD
```

- [ ] **Step 4: Wait for the exact-SHA Pages run**

Use GitHub CLI to find the `deploy.yml` run whose `headSha` equals the recorded Stage A SHA, then wait for `status=completed` and `conclusion=success`. A successful run for another SHA is not evidence.

- [ ] **Step 5: Run live route and asset smoke**

Verify HTTP 200 for:

```text
https://sealday.github.io/tego-arch/principles
https://sealday.github.io/tego-arch/principles/pr-01
https://sealday.github.io/tego-arch/principles/pr-02
https://sealday.github.io/tego-arch/principles/pr-03
https://sealday.github.io/tego-arch/principles/pr-04
https://sealday.github.io/tego-arch/principles/pr-05
```

Inspect one production CSS and one production JS URL from the deployed HTML. At desktop `1440x1000` and mobile `390x844`, verify no horizontal page overflow and readable Mermaid/tables. Click all PR-01 through PR-05 reciprocal links and one case link per page. Confirm rendered HTML has no PR-06 through PR-17 internal route.

### Task 6: Close G007 Batch 1 with durable deployment evidence

**Files:**
- Create: `docs/reviews/g007-batch1.md`
- Modify: `docs/content-backlog.md`
- Modify as generated: `src/generated/project-status.json`
- Modify as generated: `src/generated/topic-manifest.json`
- Modify as generated: `src/generated/topic-indexes.json`
- Test: `tests/g007-batch1-content.test.mjs`
- Create: `tests/g007-batch1-deployment.test.mjs`

**Interfaces:**
- Consumes: Exact Stage A SHA, exact Pages run ID/URL, live-smoke date, and per-route evidence from Task 5.
- Produces: Durable checked backlog rows and review record while leaving G007 current/in progress.

- [ ] **Step 1: Write the deployment review record**

Create `docs/reviews/g007-batch1.md`. Copy the exact 40-character Stage A SHA from `git rev-parse HEAD`; copy the run ID, URL, `headSha`, status, and conclusion from `gh run view "$RUN_ID" --json databaseId,url,headSha,status,conclusion`. Record live-smoke date `2026-07-27`.

Under `## PR-01 through PR-05`, write concrete findings for editorial completeness, fact boundaries, copyright boundaries, desktop `1440x1000` and mobile `390x844` rendering, deterministic text/table fallback, every reciprocal route clicked, `/principles` discovery, and each corrected misconception. End with `Stage B closure — PASS` and explicitly state that G007 remains current for PR-06 through PR-17. Do not write a PASS without the matching Task 5 evidence.

- [ ] **Step 2: Close exactly PR-01 through PR-05 in the backlog**

Change only those five rows from `[ ]` to `[x]`. On each row add the exact Stage A commit link, exact Pages run link, and that topic’s canonical live route. Keep PR-06 through PR-17 unchecked. Keep the current persistent story as G007 and progress as `6 / 20` because the parent story is not complete.

- [ ] **Step 3: Add deployment assertions**

Create `tests/g007-batch1-deployment.test.mjs`. Read `docs/reviews/g007-batch1.md`, extract the exact SHA with `/Exact Stage A SHA: `([0-9a-f]{40})`/u`, and extract the run ID/URL with `/GitHub Pages run: \[`(\d+)`\]\((https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\d+)\)/u`. Assert the review contains the same SHA in `headSha=...`, plus `status=completed`, `conclusion=success`, and `Stage B closure — PASS`.

Then read the backlog and, for every ID in `01` through `05`, require the checked row to contain the extracted SHA, run ID, and `https://sealday.github.io/tego-arch/principles/pr-<id>` route. Also assert PR-06 remains unchecked, the current persistent story is G007, and progress remains `6 / 20` with G006 as the most recently completed parent story. This derives runtime evidence from the canonical review rather than hard-coding a future SHA.

- [ ] **Step 4: Regenerate and run the complete closure gate**

```bash
bun run generate:content
bun test tests/g007-batch1-content.test.mjs tests/g007-batch1-deployment.test.mjs
bun run verify
git diff --check
```

If deployment assertions were kept in one file, omit the nonexistent second path. Expected: all commands exit 0.

- [ ] **Step 5: Commit and push Stage B**

```bash
git add docs/content-backlog.md docs/reviews/g007-batch1.md src/generated tests/g007-batch1-*.test.mjs
git commit -m "docs: close g007 boundary principles batch"
git push origin main
```

- [ ] **Step 6: Verify the Stage B deployment and leave G007 active**

Wait for the exact Stage B SHA’s Pages run to complete successfully. Recheck `/principles` and one representative new page. Run:

```bash
git status --short --branch
```

Expected: clean `main` synchronized with `origin/main`. Do not checkpoint G007; record PR-06 through PR-08 as the next batch.
