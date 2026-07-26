# Tego Arch Canonical Rename and Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the active project to Tego Arch at `sealday/tego-arch`, deploy it at `https://sealday.github.io/tego-arch/`, and add a generated read-only status page derived from the canonical backlog, content, and source ledger.

**Architecture:** Keep `docs/content-backlog.md` as the only human task-status source and derive a strict project-status artifact inside the existing transactional content generator. Active configuration, content, tests, package metadata, and canonical self-authored evidence move to the new identity, while historical plan/spec/evidence files remain untouched.

**Tech Stack:** Node.js 24 built-ins, `node:test`, TypeScript 6, React 19, Docusaurus 3.10, MDX, JSON, GitHub CLI, GitHub Actions, GitHub Pages.

## Global Constraints

- Canonical repository is exactly `sealday/tego-arch`.
- Canonical Pages URL is exactly `https://sealday.github.io/tego-arch/`.
- Brand is exactly `Tego Arch`; Chinese descriptor is exactly `软件架构知识图谱`.
- Do not add a custom domain or `static/CNAME`.
- Accept old Pages discontinuity; do not build redirects or dual-base compatibility.
- Never recreate or reuse the old repository slug after rename.
- Preserve existing `docs/superpowers/specs/`, `docs/superpowers/plans/`, review records, and historical evidence links.
- `docs/content-backlog.md` remains the only manually maintained task source.
- Update only the backlog top baseline to completed G005 evidence; status reports `5 / 20` durable stories and `G006` current.
- Status reports exactly 11 completed topics, 56 content documents, and 394 governed sources from canonical inputs.
- `data/source-ledger.json` is canonical; `src/generated/source-ledger.json` and `src/generated/project-status.json` are generated only through `npm run generate:content`.
- Add no dependency.
- Use TDD for every behavioral change.
- Stage A is the implementation deployment; Stage B records and deploys Stage A evidence.

---

## File Structure

- Create `scripts/project-status.mjs`: strict durable-story parsing and canonical count projection.
- Modify `scripts/generate-content-platform.mjs`: include project status in the staged artifact transaction.
- Create `src/generated/project-status.json`: generated status projection.
- Create `src/pages/status.tsx`: read-only status page.
- Create `src/pages/status.module.css`: status-page presentation.
- Create `tests/project-status.test.mjs`: parser, count, failure, and real-input tests.
- Create `tests/canonical-identity.test.mjs`: active identity, package, Pages, CNAME, and history boundaries.
- Create `tests/status-page.test.mjs`: generated-only page consumption and visible labels.
- Modify `docusaurus.config.ts`: canonical brand, repository, base path, navbar, and footer.
- Modify `package.json` and `package-lock.json`: canonical package name `tego-arch`.
- Modify `content/intro.mdx`: active brand and descriptor.
- Modify `src/pages/index.tsx`: homepage brand, descriptor, status link, and canonical repository link.
- Modify `scripts/source-link-health.mjs`: canonical crawler identity URL.
- Modify `tests/knowledge-fixtures.test.mjs`: canonical live URL assertions.
- Modify `tests/source-ledger-pagination.test.mjs`: canonical base URL.
- Modify `data/source-ledger.json`: canonical Tego Arch names and repository evidence for the 13 self-authored assets.
- Modify `docs/source-license-inventory.md`: canonical maintainer and evidence URL for the self-authored roadmap.
- Modify `docs/content-backlog.md`: replace only the top G004 baseline with completed G005 evidence and the `5 / 20`, `G006` declaration.
- Modify generated `src/generated/*.json` only by running `npm run generate:content`.
- Create `docs/reviews/g006-rename.md`: Stage A rename/deploy/live-smoke evidence.

### Task 1: Lock the canonical identity with failing tests

**Files:**
- Create: `tests/canonical-identity.test.mjs`
- Modify: `tests/knowledge-fixtures.test.mjs`
- Modify: `tests/source-ledger-pagination.test.mjs`

**Interfaces:**
- Consumes: active repository files read as UTF-8.
- Produces: an explicit allowlist of active identity owners; historical specs/plans are intentionally not scanned.

- [ ] **Step 1: Write the failing identity tests**

Create `tests/canonical-identity.test.mjs` with tests that read `docusaurus.config.ts`, `package.json`, `package-lock.json`, `content/intro.mdx`, `src/pages/index.tsx`, `scripts/source-link-health.mjs`, `data/source-ledger.json`, and `docs/source-license-inventory.md`, then assert:

```js
assert.match(config, /title: 'Tego Arch'/);
assert.match(config, /tagline: '软件架构知识图谱'/);
assert.match(config, /baseUrl: '\/tego-arch\/'/);
assert.match(config, /projectName: 'tego-arch'/);
assert.match(config, /https:\/\/github\.com\/sealday\/tego-arch/);
assert.equal(packageJson.name, 'tego-arch');
assert.equal(packageLock.packages[''].name, 'tego-arch');
assert.match(intro, /title: Tego Arch/);
assert.match(intro, /# Tego Arch/);
assert.match(homepage, /软件架构知识图谱/);
assert.equal(existsSync(new URL('../static/CNAME', import.meta.url)), false);
assert.doesNotMatch(
  [config, homepage, crawler, inventory, JSON.stringify(ledger)].join('\n'),
  /agentic-architecture-atlas|Agentic Architecture Atlas/,
);
```

Also assert that the pre-existing historical files under `docs/superpowers/specs/` and `docs/superpowers/plans/` still exist; do not assert their old text is rewritten.

- [ ] **Step 2: Run the tests and observe RED**

Run:

```bash
node --test tests/canonical-identity.test.mjs
```

Expected: FAIL on the old title, package name, repository URL, and Pages base path.

- [ ] **Step 3: Update existing URL-specific tests**

In `tests/knowledge-fixtures.test.mjs`, replace both active live URL prefixes with:

```js
`https://sealday.github.io/tego-arch${route}`
```

In `tests/source-ledger-pagination.test.mjs`, set:

```js
const baseUrl = '/tego-arch/';
```

- [ ] **Step 4: Commit the RED tests**

```bash
git add tests/canonical-identity.test.mjs tests/knowledge-fixtures.test.mjs tests/source-ledger-pagination.test.mjs
git commit -m "test: lock tego-arch canonical identity"
```

### Task 2: Move active configuration, package metadata, and self-authored evidence

**Files:**
- Modify: `docusaurus.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `content/intro.mdx`
- Modify: `src/pages/index.tsx`
- Modify: `scripts/source-link-health.mjs`
- Modify: `data/source-ledger.json`
- Modify: `docs/source-license-inventory.md`

**Interfaces:**
- Produces: `repositoryUrl = 'https://github.com/sealday/tego-arch'`, Docusaurus `baseUrl = '/tego-arch/'`, package name `tego-arch`.
- Invariant: source IDs, asset paths, citation roles, source count, and document count do not change.

- [ ] **Step 1: Apply the minimal active identity changes**

Use these exact Docusaurus values:

```ts
const repositoryUrl = 'https://github.com/sealday/tego-arch';
title: 'Tego Arch',
tagline: '软件架构知识图谱',
url: 'https://sealday.github.io',
baseUrl: '/tego-arch/',
organizationName: 'sealday',
projectName: 'tego-arch',
```

Use `Tego Arch` for navbar/footer copyright, `Tego Arch` and `软件架构知识图谱` in the homepage and intro, and `https://github.com/sealday/tego-arch` for active contribution/crawler links. Add a homepage link to `/status`.

Set `name` to `tego-arch` in `package.json`, `package-lock.json` top level, and `package-lock.json` package `""`.

For all 13 `src-atlas-*` records in `data/source-ledger.json`, change maintainer branding to `Tego Arch maintainers` and change `license_evidence_url` to the same asset path under:

```text
https://github.com/sealday/tego-arch/blob/main/
```

Update their document `attribution_note` values consistently. Update the self-authored roadmap row in `docs/source-license-inventory.md` to the same maintainer name and canonical repository evidence URL.

- [ ] **Step 2: Run focused identity and governance tests**

```bash
node --test tests/canonical-identity.test.mjs tests/source-governance-data.test.mjs tests/source-license-inventory.test.mjs tests/source-ledger.test.mjs tests/knowledge-fixtures.test.mjs tests/source-ledger-pagination.test.mjs
```

Expected: PASS with 394 ledger sources and 56 governed documents unchanged.

- [ ] **Step 3: Commit the canonical identity**

```bash
git add docusaurus.config.ts package.json package-lock.json content/intro.mdx src/pages/index.tsx scripts/source-link-health.mjs data/source-ledger.json docs/source-license-inventory.md tests/canonical-identity.test.mjs tests/knowledge-fixtures.test.mjs tests/source-ledger-pagination.test.mjs
git commit -m "feat: rename active project to Tego Arch"
```

### Task 3: Derive project status from canonical inputs

**Files:**
- Create: `scripts/project-status.mjs`
- Create: `tests/project-status.test.mjs`
- Modify: `docs/content-backlog.md`

**Interfaces:**
- Consumes: backlog Markdown, parsed topics, validated content documents, parsed canonical ledger.
- Produces: `buildProjectStatus({backlogSource, topics, documents, ledger})`.

- [ ] **Step 1: Update only the backlog top baseline**

Replace the top G004 baseline paragraph with completed G005 evidence from `docs/reviews/g005-batch1.md`, `docs/reviews/g005-batch2.md`, and `docs/reviews/g005-batch3.md`. Add exactly these machine-readable lines beside that baseline:

```markdown
- **持久故事进度：** 已完成 `5 / 20`；最近完成 `G005`。
- **当前持久故事：** `G006`。
```

Do not rewrite any lower historical row or historical URL.

- [ ] **Step 2: Write failing status tests**

Create tests for a fixture and the real repository:

```js
assert.deepEqual(status, {
  schema_version: 1,
  durable_stories: {completed: 5, total: 20, current: 'G006'},
  completed_topics: 11,
  content_documents: 56,
  governed_sources: 394,
  sources: {
    durable_stories: 'docs/content-backlog.md',
    completed_topics: 'docs/content-backlog.md',
    content_documents: 'content/**/*.{md,mdx}',
    governed_sources: 'data/source-ledger.json',
  },
});
```

Add rejection tests for absent/duplicate story lines, `6 / 20`, current `G007`, duplicate topic IDs, non-array documents, and a ledger without `sources`.

- [ ] **Step 3: Run the tests and observe RED**

```bash
node --test tests/project-status.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/project-status.mjs`.

- [ ] **Step 4: Implement strict projection**

Implement:

```js
export function parseDurableStoryStatus(backlogSource) {
  const progress = [...backlogSource.matchAll(/^- \*\*持久故事进度：\*\* 已完成 `(\d+) \/ (\d+)`；最近完成 `G(\d{3})`。$/gm)];
  const current = [...backlogSource.matchAll(/^- \*\*当前持久故事：\*\* `G(\d{3})`。$/gm)];
  if (progress.length !== 1 || current.length !== 1) {
    throw new Error('docs/content-backlog.md must contain exactly one durable story progress and current story declaration');
  }
  const completed = Number(progress[0][1]);
  const total = Number(progress[0][2]);
  const lastCompleted = Number(progress[0][3]);
  const currentNumber = Number(current[0][1]);
  if (completed !== 5 || total !== 20 || lastCompleted !== 5 || currentNumber !== 6) {
    throw new Error('durable story baseline must be 5 / 20 with G005 complete and G006 current');
  }
  return {completed, total, current: `G${current[0][1]}`};
}
```

`buildProjectStatus` must validate arrays, reject duplicate topic IDs, count `topic.complete === true`, and return the exact object asserted above.

- [ ] **Step 5: Run status tests GREEN**

```bash
node --test tests/project-status.test.mjs tests/backlog-topics.test.mjs
```

Expected: PASS; real inputs report 11, 56, and 394.

- [ ] **Step 6: Commit canonical status inputs and model**

```bash
git add docs/content-backlog.md scripts/project-status.mjs tests/project-status.test.mjs
git commit -m "feat: derive canonical project status"
```

### Task 4: Generate status transactionally and render `/status`

**Files:**
- Modify: `scripts/generate-content-platform.mjs`
- Modify: `tests/content-platform-generation.test.mjs`
- Create: `src/generated/project-status.json`
- Create: `src/pages/status.tsx`
- Create: `src/pages/status.module.css`
- Create: `tests/status-page.test.mjs`

**Interfaces:**
- Extends `generatedPaths` with `projectStatus: 'src/generated/project-status.json'`.
- `src/pages/status.tsx` imports the generated JSON and never reads backlog, content, or ledger at runtime.

- [ ] **Step 1: Write failing generation and page tests**

Add fixture expectations to `tests/content-platform-generation.test.mjs` for `generatedPaths.projectStatus`, stale-file detection, staged replay, and exact JSON serialization. Create `tests/status-page.test.mjs` asserting:

```js
assert.match(page, /from '@site\/src\/generated\/project-status\.json'/);
assert.doesNotMatch(page, /docs\/content-backlog|data\/source-ledger|readFile|fetch\(/);
for (const label of ['持久故事', '已完成主题', '内容文档', '治理来源', '当前故事']) {
  assert.match(page, new RegExp(label));
}
```

- [ ] **Step 2: Run and observe RED**

```bash
node --test tests/content-platform-generation.test.mjs tests/status-page.test.mjs
```

Expected: FAIL because `projectStatus` and `src/pages/status.tsx` do not exist.

- [ ] **Step 3: Add the generated artifact**

Import `buildProjectStatus`, build it from the already loaded `backlogSource`, `parsedBacklog.topics`, `validation.documents`, and `parsedLedger.ledger`, then return:

```js
[generatedPaths.projectStatus]: `${JSON.stringify(projectStatus, null, 2)}\n`,
```

Because replay iterates `Object.values(generatedPaths)`, the new artifact must participate in stage verification, atomic replacement, stale detection, and cleanup without a second writer.

- [ ] **Step 4: Add the read-only page**

Render five `<dd>` values from the generated object. Use:

```tsx
<Layout title="项目状态" description="Tego Arch 的只读项目状态">
```

Show `5 / 20`, `11`, `56`, `394`, and `G006`, plus a note that status is generated from canonical inputs and task changes belong only in `docs/content-backlog.md`.

- [ ] **Step 5: Generate, test, and verify freshness**

```bash
npm run generate:content
node --test tests/project-status.test.mjs tests/content-platform-generation.test.mjs tests/status-page.test.mjs
npm run check:content
git diff --exit-code -- src/generated
```

Expected: all tests PASS; content check exits 0; generated tree is stable after regeneration.

- [ ] **Step 6: Commit generation and page**

```bash
git add scripts/generate-content-platform.mjs tests/content-platform-generation.test.mjs src/generated src/pages/status.tsx src/pages/status.module.css tests/status-page.test.mjs
git commit -m "feat: publish generated project status"
```

### Task 5: Full verification and local production smoke

**Files:**
- No source changes expected.

- [ ] **Step 1: Run full offline verification**

```bash
npm run verify
git diff --check
```

Expected: tests, content validation, generated checks, cached links, review gates, typecheck, and production build all PASS; `git diff --check` prints nothing.

- [ ] **Step 2: Run local production smoke**

```bash
npm run serve -- --host 127.0.0.1 --port 4173
```

In a second shell:

```bash
curl --fail --silent --show-error http://127.0.0.1:4173/tego-arch/ -o /tmp/tego-arch-home.html
curl --fail --silent --show-error http://127.0.0.1:4173/tego-arch/status -o /tmp/tego-arch-status.html
curl --fail --silent --show-error http://127.0.0.1:4173/tego-arch/concepts/fnd-01 -o /tmp/tego-arch-concept.html
rg -F 'Tego Arch' /tmp/tego-arch-home.html
rg -F '软件架构知识图谱' /tmp/tego-arch-home.html
rg -F '5 / 20' /tmp/tego-arch-status.html
rg -F 'G006' /tmp/tego-arch-status.html
rg -F '软件架构、应用设计与代码设计的尺度边界' /tmp/tego-arch-concept.html
```

Expected: every curl exits 0 and every exact text check matches.

- [ ] **Step 3: Confirm implementation tree**

```bash
git status --short
git log -4 --oneline
```

Expected: no uncommitted implementation files; the RED, identity, status-model, and generated-page commits are present.

### Task 6: Rename repository and complete two-stage deployment evidence

**Files:**
- Create: `docs/reviews/g006-rename.md`

**Interfaces:**
- Consumes: authenticated `gh`, implementation HEAD, existing `deploy.yml`.
- Produces: canonical remote, successful Stage A and Stage B Pages runs, live-smoke evidence.

- [ ] **Step 1: Rename the repository and pin the canonical remote**

```bash
gh api --method PATCH repos/sealday/agentic-architecture-atlas -f name=tego-arch --jq '.full_name'
git remote set-url origin https://github.com/sealday/tego-arch.git
git remote get-url origin
gh repo view sealday/tego-arch --json nameWithOwner,url --jq '{nameWithOwner,url}'
```

Expected: all outputs identify only `sealday/tego-arch`; do not create a replacement repository under the old slug.

- [ ] **Step 2: Push Stage A and wait for its exact deployment**

```bash
stage_a_sha=$(git rev-parse HEAD)
git push origin HEAD:main
stage_a_run=$(gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --commit "$stage_a_sha" --limit 1 --json databaseId --jq '.[0].databaseId')
test -n "$stage_a_run"
gh run watch "$stage_a_run" --repo sealday/tego-arch --exit-status
gh run view "$stage_a_run" --repo sealday/tego-arch --json headSha,status,conclusion,url --jq 'select(.headSha == "'"$stage_a_sha"'" and .status == "completed" and .conclusion == "success")'
```

Expected: the selected run has the exact Stage A SHA and succeeds.

- [ ] **Step 3: Smoke Stage A live**

```bash
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ -o /tmp/tego-arch-live-home.html
curl --fail --silent --show-error https://sealday.github.io/tego-arch/status -o /tmp/tego-arch-live-status.html
curl --fail --silent --show-error https://sealday.github.io/tego-arch/concepts/fnd-01 -o /tmp/tego-arch-live-concept.html
rg -F 'Tego Arch' /tmp/tego-arch-live-home.html
rg -F '软件架构知识图谱' /tmp/tego-arch-live-home.html
rg -F '5 / 20' /tmp/tego-arch-live-status.html
rg -F 'G006' /tmp/tego-arch-live-status.html
rg -F '软件架构、应用设计与代码设计的尺度边界' /tmp/tego-arch-live-concept.html
```

Expected: canonical routes return successfully with exact expected content.

- [ ] **Step 4: Record Stage A evidence as Stage B**

Create `docs/reviews/g006-rename.md` containing the literal `stage_a_sha`, Stage A run ID and URL emitted above, canonical repository URL, canonical Pages URL, local `npm run verify` result, local-smoke routes, and the three successful live-smoke routes. State that old Pages discontinuity is accepted, no custom domain exists, and the old repository slug must not be reused.

```bash
git add docs/reviews/g006-rename.md
git commit -m "docs: record tego-arch rename evidence"
stage_b_sha=$(git rev-parse HEAD)
git push origin HEAD:main
```

Expected: exactly one evidence file is committed in Stage B.

- [ ] **Step 5: Wait for Stage B and repeat live smoke**

```bash
stage_b_run=$(gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --commit "$stage_b_sha" --limit 1 --json databaseId --jq '.[0].databaseId')
test -n "$stage_b_run"
gh run watch "$stage_b_run" --repo sealday/tego-arch --exit-status
gh run view "$stage_b_run" --repo sealday/tego-arch --json headSha,status,conclusion,url --jq 'select(.headSha == "'"$stage_b_sha"'" and .status == "completed" and .conclusion == "success")'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ | rg -F 'Tego Arch'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/status | rg -F 'G006'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/concepts/fnd-01 | rg -F '软件架构、应用设计与代码设计的尺度边界'
```

Expected: Stage B deploys the exact evidence SHA and all canonical live routes still match.

- [ ] **Step 6: Final acceptance audit**

```bash
npm run verify
git diff --check
git status --short
git remote get-url origin
test ! -e static/CNAME
gh repo view sealday/tego-arch --json nameWithOwner,url --jq '{nameWithOwner,url}'
```

Expected: verification PASS; no whitespace errors; clean tree; canonical remote/repository; no CNAME. Stop with G006 still current and without recreating the old repository slug.
