# GitHub Actions Node 24 Runtime Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the GitHub Actions Node 20 deprecation annotation by upgrading every first-party action used by the repository to an approved immutable Node 24 release.

**Architecture:** Lock the complete action-to-SHA mapping in the existing workflow configuration regression before changing either workflow. Then update only action references and release comments, preserving all workflow behavior, and deploy the isolated change through an exact-SHA Pages gate before beginning G007 Batch 4.

**Tech Stack:** GitHub Actions YAML, Node.js 24, `node:test`, Bun verification scripts, GitHub CLI.

## Global Constraints

- Work only in `/Users/seal/projects/tego-arch/.worktrees/actions-node24` on `codex/actions-node24` until the integration task.
- Keep `node-version: 24` in both workflows.
- Preserve permissions, triggers, concurrency, full-history checkout, offline verification, artifact names, report paths, and Pages deployment behavior.
- Every `uses:` reference remains pinned to a 40-character commit SHA with its exact approved release comment.
- Do not add dependencies or modify production content, generated content, backlog state, or G007 evidence.
- Gate 1 is complete only when the exact deployed commit succeeds and its workflow annotations contain no Node 20 deprecation message.

---

## File Map

- `tests/workflow-configuration.test.mjs` — canonical offline contract for approved action pins and unchanged workflow invariants.
- `.github/workflows/deploy.yml` — build, verify, and deploy the Docusaurus site.
- `.github/workflows/link-health.yml` — scheduled live-link and content-review reporting.
- `docs/superpowers/specs/2026-07-29-actions-node24-g007-batch4-design.md` — approved design and release boundary; no further edits expected.

### Task 1: Lock the approved Node 24 action pins

**Files:**
- Modify: `tests/workflow-configuration.test.mjs`
- Test: `tests/workflow-configuration.test.mjs`

**Interfaces:**
- Consumes: raw workflow text returned by `readWorkflow(url): Promise<string>`.
- Produces: `extractActionReferences(source): string[]` and exact per-workflow action reference arrays used by all workflow pin assertions.

- [ ] **Step 1: Add the exact expected references and extractor**

Insert after `linkHealthUrl`:

```js
const approvedDeployActions = [
  'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
  'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
  'actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0',
  'actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0',
  'actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0',
];
const approvedLinkHealthActions = [
  'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
  'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
  'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
  'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
];

function extractActionReferences(source) {
  return [...source.matchAll(/^[ ]+uses: (?<reference>[^\n]+)$/gmu)].map(
    (match) => match.groups.reference,
  );
}
```

- [ ] **Step 2: Replace the generic pin test with exact mapping assertions**

Replace the `uses` collection and generic SHA loop in
`pins every GitHub action and uploads the live report even on failure` with:

```js
  assert.deepEqual(extractActionReferences(deploy), approvedDeployActions);
  assert.deepEqual(
    extractActionReferences(linkHealth),
    approvedLinkHealthActions,
  );
  for (const reference of [
    ...approvedDeployActions,
    ...approvedLinkHealthActions,
  ]) {
    assert.match(reference, /@[0-9a-f]{40} # v[0-9]+\.[0-9]+\.[0-9]+$/u);
  }
```

Update the live-report assertion to:

```js
  assert.match(
    linkHealth,
    /- name: Upload live link report\n[ ]+if: always\(\)\n[ ]+uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7\.0\.1/,
  );
```

- [ ] **Step 3: Update helper expectations to the approved pins**

In `assertContentReviewUpload`, replace the old `upload-artifact` reference
with:

```text
actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
```

In the full-history checkout test, replace the action line expression with:

```js
/      - name: Check out repository\n        uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1\n        with:\n          fetch-depth: 0/
```

- [ ] **Step 4: Add mutation resistance for floating and stale references**

After the exact `deepEqual` assertions, add:

```js
  assert.notDeepEqual(
    extractActionReferences(
      deploy.replace(
        'actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4',
        'actions/checkout@v7',
      ),
    ),
    approvedDeployActions,
  );
  assert.notDeepEqual(
    extractActionReferences(
      linkHealth.replace(
        'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4',
        'actions/upload-artifact@v7',
      ),
    ),
    approvedLinkHealthActions,
  );
```

These mutations operate on the current old workflows during RED. After Task 2
updates the workflows, change the first argument of each `replace` to the new
approved reference while keeping the mutation target as the floating tag.

- [ ] **Step 5: Run the focused test and verify RED**

Run:

```bash
node --test tests/workflow-configuration.test.mjs
```

Expected: FAIL because both extracted arrays still contain the old v4/v5/v3
pins. Existing permission, history, offline, report, and YAML tests remain
otherwise valid.

- [ ] **Step 6: Commit the failing contract**

```bash
git add tests/workflow-configuration.test.mjs
git commit -m "test: lock node24 github action pins"
```

### Task 2: Upgrade both workflows without changing behavior

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/link-health.yml`
- Modify: `tests/workflow-configuration.test.mjs`
- Test: `tests/workflow-configuration.test.mjs`

**Interfaces:**
- Consumes: exact action arrays defined in Task 1.
- Produces: two workflows whose `uses:` lines exactly match those arrays.

- [ ] **Step 1: Update the deployment workflow pins**

Make only these replacements in `.github/workflows/deploy.yml`:

```yaml
      - name: Check out repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

```yaml
      - name: Set up Node.js
        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
```

```yaml
      - name: Configure GitHub Pages
        if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
        uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0
```

```yaml
      - name: Upload GitHub Pages artifact
        if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
```

```yaml
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0
```

- [ ] **Step 2: Update the scheduled workflow pins**

Make only these replacements in `.github/workflows/link-health.yml`:

```yaml
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
```

Replace both upload steps with:

```yaml
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
```

- [ ] **Step 3: Point mutation tests at the approved references**

In Task 1's two `replace` calls, use these exact source strings:

```js
'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1'
```

and:

```js
'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1'
```

Keep the replacements `actions/checkout@v7` and
`actions/upload-artifact@v7`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/workflow-configuration.test.mjs
```

Expected: all workflow configuration tests PASS.

- [ ] **Step 5: Verify no old action pins or release comments remain**

Run:

```bash
rg -n "actions/(checkout|setup-node|configure-pages|upload-artifact|upload-pages-artifact|deploy-pages)@" .github/workflows tests/workflow-configuration.test.mjs
```

Expected: every production workflow reference uses an approved SHA and exact
release comment; old SHAs appear nowhere in the test after the Task 2 mutation
source strings are updated.

- [ ] **Step 6: Run the complete repository gate**

Run:

```bash
bun run verify
git diff --check
```

Expected: 462/462 tests pass; 76 content documents and 443 governed sources
validate; deterministic generation, link cache, review health, typecheck, build,
and whitespace checks pass.

- [ ] **Step 7: Commit the workflow upgrade**

```bash
git add .github/workflows/deploy.yml .github/workflows/link-health.yml tests/workflow-configuration.test.mjs
git commit -m "ci: move github actions to node24"
```

### Task 3: Review, integrate, deploy, and prove the warning is gone

**Files:**
- Review only: all changes from base `581ba1c6056a6f3c03962bfb3c3f950b874e4441`
- No new tracked files expected.

**Interfaces:**
- Consumes: clean reviewed `codex/actions-node24` branch and exact head SHA.
- Produces: synchronized local and remote `main`, successful exact-SHA Pages run, and annotation/HTTP evidence that unlocks the separate Batch 4 plan.

- [ ] **Step 1: Generate the review package and obtain independent approval**

Run:

```bash
/Users/seal/.agents/skills/subagent-driven-development/scripts/review-package 581ba1c HEAD
```

Reviewer acceptance criteria:

- exact approved SHA and release mapping;
- Node 24 runtime for each direct JavaScript action and the transitive
  `upload-artifact` v7 reference in `upload-pages-artifact` v5;
- no floating action tags;
- no permission, trigger, concurrency, history, offline, artifact, or report
  behavior change;
- focused and full gates green.

Expected: Critical/Important/Minor `0/0/0`, ready to merge.

- [ ] **Step 2: Push the feature branch**

```bash
git push -u origin codex/actions-node24
```

Expected: remote feature branch points to the reviewed head.

- [ ] **Step 3: Fast-forward main and verify the integrated result**

From `/Users/seal/projects/tego-arch`:

```bash
git merge --ff-only codex/actions-node24
bun run verify
git status --short
```

Expected: fast-forward succeeds, 462/462 tests pass, all other gates pass, and
the tracked worktree is clean.

- [ ] **Step 4: Push main and capture the exact deployment run**

```bash
git push origin main
upgrade_sha=$(git rev-parse HEAD)
run_id=$(gh run list --commit "$upgrade_sha" --limit 10 --json databaseId,workflowName,headSha --jq '[.[] | select(.workflowName == "Verify and deploy Docusaurus to GitHub Pages" and .headSha == "'"$upgrade_sha"'")][0].databaseId')
test -n "$run_id"
printf '%s\n' "$run_id"
```

The filter accepts only the `Verify and deploy Docusaurus to GitHub Pages` run
whose `headSha` exactly equals local `HEAD`.

- [ ] **Step 5: Wait for exact-SHA success**

```bash
gh run watch "$run_id" --exit-status
gh run view "$run_id" --json databaseId,status,conclusion,headSha,url,workflowName
```

Expected: `status=completed`, `conclusion=success`, and `headSha` equals the
workflow-upgrade commit.

- [ ] **Step 6: Prove the run has no Node 20 annotation**

List the run jobs:

```bash
gh api "repos/sealday/tego-arch/actions/runs/$run_id/jobs" --jq '.jobs[] | [.id,.name] | @tsv'
```

Capture and inspect every job ID:

```bash
job_ids=$(gh api "repos/sealday/tego-arch/actions/runs/$run_id/jobs" --jq '.jobs[].id')
for job_id in $job_ids; do
  gh api "repos/sealday/tego-arch/check-runs/$job_id/annotations" --paginate --jq '.[].message'
done
```

Expected: no annotation contains `Node.js 20`, `Node 20`, or
`deprecated`. Other unrelated annotations must be reviewed rather than hidden.

- [ ] **Step 7: Smoke-test unchanged production routes**

Run:

```bash
curl -L --silent --show-error --output /dev/null --write-out '%{http_code}\n' https://sealday.github.io/tego-arch/principles
curl -L --silent --show-error --output /dev/null --write-out '%{http_code}\n' https://sealday.github.io/tego-arch/principles/pr-09
curl -L --silent --show-error --output /dev/null --write-out '%{http_code}\n' https://sealday.github.io/tego-arch/principles/pr-10
curl -L --silent --show-error --output /dev/null --write-out '%{http_code}\n' https://sealday.github.io/tego-arch/principles/pr-11
```

Expected: four `200` responses.

- [ ] **Step 8: Confirm synchronization and unlock Batch 4**

Run:

```bash
git rev-parse HEAD
git rev-parse origin/main
git -C /Users/seal/projects/tego-arch/.worktrees/actions-node24 rev-parse HEAD
git status --short
git -C /Users/seal/projects/tego-arch/.worktrees/actions-node24 status --short
```

Expected: all SHAs match and both tracked worktrees are clean. Preserve the
feature worktree. Create the G007 Batch 4 plan and branch only after this gate.
