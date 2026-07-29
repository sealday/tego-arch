import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const reviewUrl = new URL('../docs/reviews/g006-batch3.md', import.meta.url);
const backlogUrl = new URL('../docs/content-backlog.md', import.meta.url);
const workflowUrl = new URL('../.github/workflows/deploy.yml', import.meta.url);
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

function extractDeploymentEvidence(review) {
  const sha = review.match(/- Exact Stage A SHA：`([0-9a-f]{40})`/u)?.[1];
  const run = review.match(
    /- GitHub Pages run：\[`([0-9]+)`\]\((https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\1)\)/u,
  );
  const liveDate = review.match(
    /- Live-smoke date：`(\d{4}-\d{2}-\d{2})`/u,
  )?.[1];

  assert.ok(sha, 'review must contain the full 40-character Stage A SHA');
  assert.ok(run, 'review must contain a numeric Pages run ID and matching run URL');
  assert.ok(liveDate, 'review must contain the literal live-smoke date');

  return {sha, runId: run[1], runUrl: run[2], liveDate};
}

test('records the exact successful Batch 3 Stage A deployment', async () => {
  const [review, workflow] = await Promise.all([
    readFile(reviewUrl, 'utf8'),
    readFile(workflowUrl, 'utf8'),
  ]);
  const evidence = extractDeploymentEvidence(review);

  assert.doesNotMatch(
    review,
    /\b(?:pending|tbd|todo)\b|<stage-a-sha>|<run-id>|<live-date>/iu,
  );
  assert.ok(
    review.includes(
      `- Exact run gate：\`headSha=${evidence.sha}\`，\`status=completed\`，\`conclusion=success\`。`,
    ),
    'review must record the exact successful run gate',
  );
  assert.match(
    review,
    /- Canonical live base：\[`https:\/\/sealday\.github\.io\/tego-arch\/`\]\(https:\/\/sealday\.github\.io\/tego-arch\/\)/u,
  );
  assert.match(workflow, /fetch-depth:\s*0/u);

  execFileSync('git', ['cat-file', '-e', `${evidence.sha}^{commit}`], {
    cwd: repositoryRoot,
    stdio: 'pipe',
  });
});

test('records every observed Batch 3 route, asset, source card and runtime gate', async () => {
  const review = await readFile(reviewUrl, 'utf8');

  for (const route of [
    '/quality-attributes/qa-05',
    '/quality-attributes/qa-08',
    '/quality-attributes/qa-09',
    '/paths/production-governance',
    '/paths/cloud-native-platform',
    '/paths/edge-physical-agents',
    '/paths/agent-platform-gateway',
    '/references/primary/page/20',
    '/references/first-party/page/2',
    '/references/primary#src-stpa-handbook-2018',
    '/references/primary/page/3#src-sre-managing-incidents',
    '/references/primary/page/5#src-faa-order-8040-4c',
    '/references/primary/page/6#src-nist-privacy-framework-1',
    '/references/primary/page/6#src-nist-sp800-160v1r1',
    '/references/primary/page/7#src-opentelemetry-observability-primer',
    '/references/primary/page/19#src-atlas-qa05-data-trust-boundaries-8d53f1c92a64',
    '/references/primary/page/19#src-atlas-qa09-safety-control-loop-c4a7e83b1d96',
    '/references/primary/page/20#src-atlas-qa08-operability-recovery-loop-6b1e9d42c7f5',
  ]) {
    assert.ok(review.includes(route), `review must record ${route}`);
  }

  for (const asset of [
    '/img/illustrations/qa-05-data-trust-boundaries.png',
    '/img/illustrations/qa-08-operability-recovery-loop.png',
    '/img/illustrations/qa-09-safety-control-loop.png',
  ]) {
    assert.ok(review.includes(asset), `review must record ${asset}`);
  }

  assert.match(review, /desktop `1440x1000`/u);
  assert.match(review, /mobile `390x844`/u);
  assert.match(review, /console warning\/error 为 0/u);
  assert.match(review, /无 overflow/u);
  assert.match(review, /production CSS\/JS 响应为 HTTP 200/u);
  assert.match(review, /homepage.*`18\/65\/421`.*`G006`/iu);
  assert.match(review, /primary page 21.*HTTP 404/iu);
  assert.match(review, /first-party page 3.*HTTP 404/iu);
  assert.match(review, /Stage B closure — PASS/u);
});

test('closes only QA-05, QA-08 and QA-09 with the same deployment evidence', async () => {
  const [review, backlog] = await Promise.all([
    readFile(reviewUrl, 'utf8'),
    readFile(backlogUrl, 'utf8'),
  ]);
  const evidence = extractDeploymentEvidence(review);

  for (const number of ['05', '08', '09']) {
    const line = backlog
      .split('\n')
      .find((candidate) => candidate.includes(`**QA-${number} `));
    assert.ok(line, `backlog must contain QA-${number}`);
    assert.match(line, /^- \[x\]/u, `QA-${number} must be checked`);
    assert.ok(line.includes(evidence.sha), `QA-${number} must contain the Stage A SHA`);
    assert.ok(
      line.includes(`Pages run [\`${evidence.runId}\`](${evidence.runUrl})`),
      `QA-${number} must contain the matching Pages run ID and URL`,
    );
    assert.ok(
      line.includes(
        `https://sealday.github.io/tego-arch/quality-attributes/qa-${number}`,
      ),
      `QA-${number} must contain its canonical live route`,
    );
  }

  assert.match(
    backlog,
    /^- \[x\] \*\*QA-10 /mu,
    'QA-10 must be closed by the later final G006 deployment',
  );
});
