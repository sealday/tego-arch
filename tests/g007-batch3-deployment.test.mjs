import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = ['09', '10', '11'];
const expectedStageASha = 'c0497bbe8d1ef9d19e8ed99d69411764095f03ce';
const expectedPagesRunId = '30356377127';
const cssAsset =
  'https://sealday.github.io/tego-arch/assets/css/styles.9684c33a.css';
const jsAsset =
  'https://sealday.github.io/tego-arch/assets/js/runtime~main.c69c1453.js';
const clickMatrix =
  'PR-09 `5/5 = parent 1 + adjacent 3 + case 1`; PR-10 `6/6 = parent 1 + adjacent 4 + case 1`; PR-11 `5/5 = parent 1 + adjacent 3 + case 1`; `16/16 total`';

const [review, backlog, manifest] = await Promise.all([
  readFile(new URL('../docs/reviews/g007-batch3.md', import.meta.url), 'utf8').catch(
    () => '',
  ),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
]);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function parseLiteralEvidence(source) {
  const stageAShaMatches = [
    ...source.matchAll(/^Exact Stage A SHA: `([0-9a-f]{40})`$/gmu),
  ];
  const pagesRunMatches = [
    ...source.matchAll(
      /^GitHub Pages run: \[`([0-9]+)`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\1\)$/gmu,
    ),
  ];
  const runGateMatches = [
    ...source.matchAll(
      /^Exact run gate: `headSha=([0-9a-f]{40})`, `status=completed`, `conclusion=success`\.$/gmu,
    ),
  ];
  assert.equal(
    stageAShaMatches.length,
    1,
    'review must contain exactly one literal Stage A SHA',
  );
  assert.equal(
    pagesRunMatches.length,
    1,
    'review must contain exactly one literal Pages run and matching URL',
  );
  assert.equal(
    runGateMatches.length,
    1,
    'review must contain exactly one literal successful run gate',
  );
  assert.equal(
    stageAShaMatches[0][1],
    expectedStageASha,
    'review must record the expected Stage A SHA',
  );
  assert.equal(
    pagesRunMatches[0][1],
    expectedPagesRunId,
    'review must record the expected Pages run',
  );
  assert.equal(
    runGateMatches[0][1],
    expectedStageASha,
    'run gate must record the expected Stage A SHA',
  );
  return {
    stageASha: expectedStageASha,
    pagesRunId: expectedPagesRunId,
  };
}

function assertLiteralEvidence(source) {
  const {stageASha, pagesRunId} = parseLiteralEvidence(source);
  const pagesRunUrl = `https://github.com/sealday/tego-arch/actions/runs/${pagesRunId}`;
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
    cssAsset,
    jsAsset,
    clickMatrix,
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
    'Repository test gate: `462/462` tests passed.',
    'Stage B closure — PASS',
  ]) {
    assert.ok(source.includes(literal), `review must record ${literal}`);
  }
}

test('records an exact successful G007 Batch 3 deployment', () => {
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
    ['16/16 total', '15/16 total'],
    ['Stage B closure — PASS', 'Stage B closure — FAIL'],
  ]) {
    assert.throws(
      () => assertLiteralEvidence(review.replaceAll(literal, mutation)),
      {name: 'AssertionError'},
    );
  }
  const conflictingSha = '0'.repeat(40);
  const conflictingRunId = '30356377128';
  const conflictingReview = [
    review,
    `Exact Stage A SHA: \`${conflictingSha}\``,
    `GitHub Pages run: [\`${conflictingRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${conflictingRunId})`,
    `Exact run gate: \`headSha=${conflictingSha}\`, \`status=completed\`, \`conclusion=success\`.`,
    '',
  ].join('\n');
  assert.throws(
    () => assertLiteralEvidence(conflictingReview),
    {name: 'AssertionError'},
    'a second conflicting SHA/run/run-gate evidence group must be rejected',
  );
});

test('closes only PR-09 through PR-11 and leaves PR-12 next', () => {
  const {stageASha, pagesRunId} = parseLiteralEvidence(review);
  const pagesRunUrl = `https://github.com/sealday/tego-arch/actions/runs/${pagesRunId}`;
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
  assert.ok(
    backlog.includes(
      `当前发布基线：** 2026-07-28 G007 Batch 3 已完成 PR-09..11，发布基线为 [\`${stageASha}\`](https://github.com/sealday/tego-arch/commit/${stageASha})，Pages run [\`${pagesRunId}\`](${pagesRunUrl})`,
    ),
  );
  assert.match(backlog, /G007 仍在进行中，下一批从 PR-12 开始。/u);
});
