# Tego Arch Canonical Rename and Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the active project to Tego Arch at `sealday/tego-arch`, deploy it at `https://sealday.github.io/tego-arch/`, and show generated read-only status on the homepage from the canonical backlog, content, and source ledger.

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
- Update the backlog top baseline to completed G005 evidence; status reports `5 / 20` durable stories and `G006` current.
- `docs/content-backlog.md` is an active progress document, but only its top current-status block moves to canonical `/tego-arch/` links. Completed topic rows retain their old Pages/run/commit/live-smoke evidence verbatim.
- Keep existing files under `docs/superpowers/plans/`, `docs/superpowers/specs/`, and `docs/reviews/` historically unchanged except for the new G006 rename evidence file.
- Status reports exactly 11 completed topics, 56 content documents, and 394 governed sources from canonical inputs.
- `data/source-ledger.json` is canonical; `src/generated/source-ledger.json` and `src/generated/project-status.json` are generated only through `npm run generate:content`.
- Add no dependency.
- Use TDD for every behavioral change.
- Stage A is the implementation deployment; Stage B backfills its actual commit/run/live evidence into both the active backlog and the G006 review record, then deploys that evidence.

---

## File Structure

- Create `scripts/project-status.mjs`: strict durable-story parsing and canonical count projection.
- Modify `scripts/generate-content-platform.mjs`: include project status in the staged artifact transaction.
- Create `src/generated/project-status.json`: generated status projection.
- Create `tests/project-status.test.mjs`: parser, count, failure, and real-input tests.
- Create `tests/canonical-identity.test.mjs`: active identity, package, Pages, CNAME, and history boundaries.
- Create `tests/homepage-status.test.mjs`: direct generated-status consumption, visible labels, and no runtime file/network reads.
- Modify `docusaurus.config.ts`: canonical brand, repository, base path, navbar, and footer.
- Modify `package.json` and `package-lock.json`: canonical package name `tego-arch`.
- Modify `content/intro.mdx`: active brand and descriptor.
- Modify `src/pages/index.tsx`: homepage brand, descriptor, canonical repository link, and generated status panel.
- Modify `scripts/source-link-health.mjs`: canonical crawler identity URL.
- Modify `tests/source-ledger-pagination.test.mjs`: canonical base URL.
- Modify `data/source-ledger.json`: canonical Tego Arch names and repository evidence for the 13 self-authored assets.
- Modify `docs/source-license-inventory.md`: canonical maintainer and evidence URL for the self-authored roadmap.
- Modify `docs/content-backlog.md`: replace only the top current-status block with completed G005 evidence, canonical `/tego-arch/` links, and the `5 / 20`, `G006` declaration; later backfill Stage A evidence there.
- Modify generated `src/generated/*.json` only by running `npm run generate:content`.
- Create `docs/reviews/g006-rename.md`: Stage A rename/deploy/live-smoke evidence.

### Task 1: Lock the canonical identity with failing tests

**Files:**
- Create: `tests/canonical-identity.test.mjs`
- Modify: `tests/source-ledger-pagination.test.mjs`

**Interfaces:**
- Consumes: active repository files read as UTF-8.
- Produces: an explicit allowlist of active identity owners; historical specs/plans are intentionally not scanned.

- [ ] **Step 1: Capture the immutable history baseline**

```bash
history_baseline_sha=$(git rev-parse HEAD)
git diff --quiet
```

Expected: a literal baseline SHA is captured and the starting worktree is clean.

- [ ] **Step 2: Write the failing identity tests**

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

Also capture `history_baseline_sha=$(git rev-parse HEAD)` before implementation and assert at every release gate that `git diff --exit-code "$history_baseline_sha" -- docs/superpowers/plans docs/superpowers/specs` succeeds. This diff/hash baseline is the strict immutability gate for all pre-existing plan/spec files. Existing review files are likewise untouched; only `docs/reviews/g006-rename.md` may be added.

- [ ] **Step 3: Run the tests and observe RED**

Run:

```bash
node --test tests/canonical-identity.test.mjs
```

Expected: FAIL on the old title, package name, repository URL, and Pages base path.

- [ ] **Step 4: Update only the active pagination base-path test**

In `tests/source-ledger-pagination.test.mjs`, set:

```js
const baseUrl = '/tego-arch/';
```

Do not change `tests/knowledge-fixtures.test.mjs`; its old Pages URLs protect completed historical deployment evidence.

- [ ] **Step 5: Commit the RED tests**

```bash
git add tests/canonical-identity.test.mjs tests/source-ledger-pagination.test.mjs
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

Use `Tego Arch` for navbar/footer copyright, `Tego Arch` and `软件架构知识图谱` in the homepage and intro, and `https://github.com/sealday/tego-arch` for active contribution/crawler links. Do not add a `/status` route or link.

Set `name` to `tego-arch` in `package.json`, `package-lock.json` top level, and `package-lock.json` package `""`.

For all 13 `src-atlas-*` records in `data/source-ledger.json`, change maintainer branding to `Tego Arch maintainers` and change `license_evidence_url` to the same asset path under:

```text
https://github.com/sealday/tego-arch/blob/main/
```

Update their document `attribution_note` values consistently. Update the self-authored roadmap row in `docs/source-license-inventory.md` to the same maintainer name and canonical repository evidence URL.

- [ ] **Step 2: Run focused identity and governance tests**

```bash
node --test tests/canonical-identity.test.mjs tests/source-governance-data.test.mjs tests/source-license-inventory.test.mjs tests/source-ledger.test.mjs tests/source-ledger-pagination.test.mjs
```

Expected: PASS with 394 ledger sources and 56 governed documents unchanged.

- [ ] **Step 3: Commit the canonical identity**

```bash
git add docusaurus.config.ts package.json package-lock.json content/intro.mdx src/pages/index.tsx scripts/source-link-health.mjs data/source-ledger.json docs/source-license-inventory.md tests/canonical-identity.test.mjs tests/source-ledger-pagination.test.mjs
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

- [ ] **Step 1: Write failing status tests**

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

Add rejection tests for absent/duplicate story lines, `6 / 20`, current `G007`, duplicate topic IDs, non-array documents, and a ledger without `sources`. Fixture backlogs must contain their own two durable-story declarations, and fixture expectations must use their own topic/document/source counts rather than the real repository's 11/56/394.

For the real backlog, assert its top current-status block contains `https://sealday.github.io/tego-arch/`, while the complete file still contains old Pages evidence from completed topic rows. This prevents both a stale current link and accidental historical rewriting.

- [ ] **Step 2: Run the tests and observe initial RED**

```bash
node --test tests/project-status.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/project-status.mjs`.

- [ ] **Step 3: Implement strict projection**

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

- [ ] **Step 4: Run again and observe canonical-input RED**

```bash
node --test tests/project-status.test.mjs
```

Expected: fixture tests PASS, while the real-repository test FAILS because the backlog top block does not yet contain the strict durable-story declarations.

- [ ] **Step 5: Update only the backlog top current-status block**

Replace the top G004 baseline paragraph with completed G005 evidence from `docs/reviews/g005-batch1.md`, `docs/reviews/g005-batch2.md`, and `docs/reviews/g005-batch3.md`, using canonical `https://github.com/sealday/tego-arch/` and `https://sealday.github.io/tego-arch/` links in this top block. Add exactly:

```markdown
- **持久故事进度：** 已完成 `5 / 20`；最近完成 `G005`。
- **当前持久故事：** `G006`。
```

Do not modify any completed backlog topic row or its old Pages/run/commit/live-smoke links. Do not modify historical files under `docs/superpowers/plans/`, `docs/superpowers/specs/`, or `docs/reviews/`.

- [ ] **Step 6: Run status tests GREEN**

```bash
node --test tests/project-status.test.mjs tests/backlog-topics.test.mjs
```

Expected: PASS; real inputs report 11, 56, and 394.

- [ ] **Step 7: Commit canonical status inputs and model**

```bash
git add docs/content-backlog.md scripts/project-status.mjs tests/project-status.test.mjs
git commit -m "feat: derive canonical project status"
```

### Task 4: Generate status transactionally and render it on the homepage

**Files:**
- Modify: `scripts/generate-content-platform.mjs`
- Modify: `tests/content-platform-generation.test.mjs`
- Create: `src/generated/project-status.json`
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/index.module.css`
- Create: `tests/homepage-status.test.mjs`

**Interfaces:**
- Extends `generatedPaths` with `projectStatus: 'src/generated/project-status.json'`.
- `src/pages/index.tsx` imports the generated JSON directly and never reads backlog, content, or ledger at runtime.

- [ ] **Step 1: Write failing generation and page tests**

Add fixture-specific durable-story declarations to every repository fixture in `tests/content-platform-generation.test.mjs`. Assert fixture status using that fixture's actual completed-topic, document, and source counts. Then add expectations for `generatedPaths.projectStatus`, stale-file detection, staged replay, and exact JSON serialization. Create `tests/homepage-status.test.mjs` asserting:

```js
assert.match(homepage, /from '@site\/src\/generated\/project-status\.json'/);
assert.doesNotMatch(homepage, /docs\/content-backlog|data\/source-ledger|readFile|fetch\(/);
for (const label of ['持久故事', '已完成主题', '内容文档', '治理来源', '当前故事']) {
  assert.match(homepage, new RegExp(label));
}
```

Also assert that the homepage references all five generated fields and does not contain a hard-coded status object or a `/status` link.

- [ ] **Step 2: Run and observe RED**

```bash
node --test tests/content-platform-generation.test.mjs tests/homepage-status.test.mjs
```

Expected: FAIL because `projectStatus` does not exist and `src/pages/index.tsx` does not import it.

- [ ] **Step 3: Add the generated artifact**

Import `buildProjectStatus`, build it from the already loaded `backlogSource`, `parsedBacklog.topics`, `validation.documents`, and `parsedLedger.ledger`, then return:

```js
[generatedPaths.projectStatus]: `${JSON.stringify(projectStatus, null, 2)}\n`,
```

Because replay iterates `Object.values(generatedPaths)`, the new artifact must participate in stage verification, atomic replacement, stale detection, and cleanup without a second writer.

- [ ] **Step 4: Add the read-only homepage status panel**

Import the generated artifact directly:

```tsx
import projectStatus from '@site/src/generated/project-status.json';
```

Render five `<dd>` values in `src/pages/index.tsx` from `projectStatus.durable_stories.completed`, `projectStatus.durable_stories.total`, `projectStatus.completed_topics`, `projectStatus.content_documents`, `projectStatus.governed_sources`, and `projectStatus.durable_stories.current`. The homepage must visibly show labels `持久故事`, `已完成主题`, `内容文档`, `治理来源`, and `当前故事`, with values `5 / 20`, `11`, `56`, `394`, and `G006`. Add presentation rules to `src/pages/index.module.css` and a note that task changes belong only in `docs/content-backlog.md`.

- [ ] **Step 5: Generate, test, and verify freshness**

```bash
npm run generate:content
node --test tests/project-status.test.mjs tests/content-platform-generation.test.mjs tests/homepage-status.test.mjs
npm run check:content
find src/generated -maxdepth 1 -type f -print0 | sort -z | xargs -0 shasum -a 256 > /tmp/tego-generated-first.sha256
npm run generate:content
find src/generated -maxdepth 1 -type f -print0 | sort -z | xargs -0 shasum -a 256 > /tmp/tego-generated-second.sha256
diff -u /tmp/tego-generated-first.sha256 /tmp/tego-generated-second.sha256
test ! -e src/generated/.content-platform-stage
```

Expected: all tests PASS; content check exits 0; two complete generated-tree hash manifests are identical; no staging directory remains.

- [ ] **Step 6: Commit generation and page**

```bash
git add scripts/generate-content-platform.mjs tests/content-platform-generation.test.mjs src/generated src/pages/index.tsx src/pages/index.module.css tests/homepage-status.test.mjs
git commit -m "feat: publish generated project status"
```

### Task 5: Full verification and local production smoke

**Files:**
- No source changes expected.

- [ ] **Step 1: Run full offline verification**

```bash
npm run verify
git diff --check
git diff --exit-code "$history_baseline_sha" -- docs/superpowers/plans docs/superpowers/specs
```

Expected: tests, content validation, generated checks, cached links, review gates, typecheck, and production build all PASS; whitespace is clean; pre-existing plan/spec history matches the execution baseline.

- [ ] **Step 2: Run local production smoke**

```bash
npm run serve -- --host 127.0.0.1 --port 4173
```

In a second shell:

```bash
curl --fail --silent --show-error http://127.0.0.1:4173/tego-arch/ -o /tmp/tego-arch-home.html
curl --fail --silent --show-error http://127.0.0.1:4173/tego-arch/concepts/fnd-01 -o /tmp/tego-arch-concept.html
rg -F 'Tego Arch' /tmp/tego-arch-home.html
rg -F '软件架构知识图谱' /tmp/tego-arch-home.html
rg -F '5 / 20' /tmp/tego-arch-home.html
rg -F '11' /tmp/tego-arch-home.html
rg -F '56' /tmp/tego-arch-home.html
rg -F '394' /tmp/tego-arch-home.html
rg -F 'G006' /tmp/tego-arch-home.html
! rg -F '/agentic-architecture-atlas/' /tmp/tego-arch-home.html
rg -F '软件架构、应用设计与代码设计的尺度边界' /tmp/tego-arch-concept.html
css_asset=$(rg -o '/tego-arch/assets/css/[^"]+\\.css' /tmp/tego-arch-home.html | head -n 1)
js_asset=$(rg -o '/tego-arch/assets/js/[^"]+\\.js' /tmp/tego-arch-home.html | head -n 1)
test -n "$css_asset"
test -n "$js_asset"
curl --fail --silent --show-error "http://127.0.0.1:4173${css_asset}" -o /tmp/tego-arch.css
curl --fail --silent --show-error "http://127.0.0.1:4173${js_asset}" -o /tmp/tego-arch.js
curl --fail --silent --show-error http://127.0.0.1:4173/tego-arch/img/paths/software-architecture-learning-roadmap.png -o /tmp/tego-arch-roadmap.png
test -s /tmp/tego-arch.css
test -s /tmp/tego-arch.js
test -s /tmp/tego-arch-roadmap.png
```

Expected: every HTML, CSS, JavaScript, and image request succeeds; exact status text matches; homepage HTML contains no old base path.

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
wait_for_pages_run() {
  local expected_sha="$1"
  local run_json=""
  for attempt in $(seq 1 30); do
    run_json=$(gh run list --repo sealday/tego-arch --workflow deploy.yml --branch main --limit 30 \
      --json databaseId,headSha,status,conclusion,url \
      --jq "map(select(.headSha == \"$expected_sha\"))[0] // empty")
    test -n "$run_json" && break
    sleep 10
  done
  test -n "$run_json"
  PAGES_RUN_ID=$(node -e 'const v=JSON.parse(process.argv[1]); process.stdout.write(String(v.databaseId))' "$run_json")
  PAGES_RUN_URL=$(node -e 'const v=JSON.parse(process.argv[1]); process.stdout.write(v.url)' "$run_json")
  gh run watch "$PAGES_RUN_ID" --repo sealday/tego-arch --exit-status
  verified=$(gh run view "$PAGES_RUN_ID" --repo sealday/tego-arch \
    --json headSha,status,conclusion,url \
    --jq 'select(.headSha == "'"$expected_sha"'" and .status == "completed" and .conclusion == "success")')
  test -n "$verified"
}

stage_a_sha=$(git rev-parse HEAD)
git push origin HEAD:main
wait_for_pages_run "$stage_a_sha"
stage_a_run="$PAGES_RUN_ID"
stage_a_run_url="$PAGES_RUN_URL"
```

Expected: discovery is bounded to 300 seconds and fails closed unless the exact SHA reaches completed/success.

- [ ] **Step 3: Smoke Stage A live**

```bash
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ -o /tmp/tego-arch-live-home.html
curl --fail --silent --show-error https://sealday.github.io/tego-arch/concepts/fnd-01 -o /tmp/tego-arch-live-concept.html
rg -F 'Tego Arch' /tmp/tego-arch-live-home.html
rg -F '软件架构知识图谱' /tmp/tego-arch-live-home.html
rg -F '5 / 20' /tmp/tego-arch-live-home.html
rg -F '11' /tmp/tego-arch-live-home.html
rg -F '56' /tmp/tego-arch-live-home.html
rg -F '394' /tmp/tego-arch-live-home.html
rg -F 'G006' /tmp/tego-arch-live-home.html
! rg -F '/agentic-architecture-atlas/' /tmp/tego-arch-live-home.html
rg -F '软件架构、应用设计与代码设计的尺度边界' /tmp/tego-arch-live-concept.html
live_css=$(rg -o '/tego-arch/assets/css/[^"]+\\.css' /tmp/tego-arch-live-home.html | head -n 1)
live_js=$(rg -o '/tego-arch/assets/js/[^"]+\\.js' /tmp/tego-arch-live-home.html | head -n 1)
test -n "$live_css"
test -n "$live_js"
curl --fail --silent --show-error "https://sealday.github.io${live_css}" -o /tmp/tego-arch-live.css
curl --fail --silent --show-error "https://sealday.github.io${live_js}" -o /tmp/tego-arch-live.js
curl --fail --silent --show-error https://sealday.github.io/tego-arch/img/paths/software-architecture-learning-roadmap.png -o /tmp/tego-arch-live-roadmap.png
test -s /tmp/tego-arch-live.css
test -s /tmp/tego-arch-live.js
test -s /tmp/tego-arch-live-roadmap.png
```

Expected: canonical routes return successfully with exact expected content.

- [ ] **Step 4: Backfill Stage A evidence into backlog and review as Stage B**

Update `docs/content-backlog.md` with the literal Stage A implementation commit, Pages run ID/URL, canonical homepage URL, homepage status smoke (`5 / 20`, `11`, `56`, `394`, `G006`), and representative content-route smoke emitted above. Keep G006 current; this evidence records the rename deployment but does not complete the durable story.

Then create `docs/reviews/g006-rename.md` with the same literal Stage A identifiers, canonical repository URL, canonical Pages URL, local `npm run verify` result, local-smoke routes, and successful live-smoke routes. State that old Pages discontinuity is accepted, no custom domain exists, and the old repository slug must not be reused.

```bash
git add docs/content-backlog.md docs/reviews/g006-rename.md
git commit -m "docs: record tego-arch rename evidence"
stage_b_sha=$(git rev-parse HEAD)
git push origin HEAD:main
```

Expected: Stage B contains only the active backlog evidence backfill and the new G006 review record.

- [ ] **Step 5: Wait for Stage B and repeat live smoke**

```bash
wait_for_pages_run "$stage_b_sha"
stage_b_run="$PAGES_RUN_ID"
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ | rg -F 'Tego Arch'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ | rg -F '5 / 20'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ | rg -F '11'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ | rg -F '56'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ | rg -F '394'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/ | rg -F 'G006'
curl --fail --silent --show-error https://sealday.github.io/tego-arch/concepts/fnd-01 | rg -F '软件架构、应用设计与代码设计的尺度边界'
curl --fail --silent --show-error "https://sealday.github.io${live_css}" -o /tmp/tego-arch-stage-b.css
curl --fail --silent --show-error "https://sealday.github.io${live_js}" -o /tmp/tego-arch-stage-b.js
curl --fail --silent --show-error https://sealday.github.io/tego-arch/img/paths/software-architecture-learning-roadmap.png -o /tmp/tego-arch-stage-b-roadmap.png
test -s /tmp/tego-arch-stage-b.css
test -s /tmp/tego-arch-stage-b.js
test -s /tmp/tego-arch-stage-b-roadmap.png
```

Expected: Stage B deploys the exact evidence SHA and all canonical live routes still match.

- [ ] **Step 6: Final acceptance audit**

```bash
npm run verify
git diff --check
git diff --exit-code "$history_baseline_sha" -- docs/superpowers/plans docs/superpowers/specs
git status --short
git remote get-url origin
test ! -e static/CNAME
gh repo view sealday/tego-arch --json nameWithOwner,url --jq '{nameWithOwner,url}'
```

Expected: verification PASS; no whitespace errors; clean tree; canonical remote/repository; no CNAME. Stop with G006 still current and without recreating the old repository slug.
