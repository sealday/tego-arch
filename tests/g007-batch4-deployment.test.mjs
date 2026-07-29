import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = ['12', '13', '14'];
const expectedStageASha = 'bed310e71808e7c19821c6efac8b084876cfb552';
const expectedPagesRunId = '30422992605';
const cssAsset = 'https://sealday.github.io/tego-arch/assets/css/styles.9684c33a.css';
const jsAsset = 'https://sealday.github.io/tego-arch/assets/js/runtime~main.eef39224.js';
const repositoryGate = 'Repository test gate: `472/472` tests passed.';
const governedSourceLiteral = '450 governed sources';
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
const batch4Manifest = JSON.parse(
  execFileSync(
    'git',
    ['show', `${expectedStageASha}:src/generated/topic-manifest.json`],
    {cwd: root, encoding: 'utf8'},
  ),
);
const batch4TopicsById = new Map(
  batch4Manifest.topics.map((topic) => [topic.id, topic]),
);

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
    'https://sealday.github.io/tego-arch/assets/js/main.46153266.js',
    clickMatrix,
    repositoryGate,
    governedSourceLiteral,
    'desktop `1440x1000`',
    'mobile `390x844`',
    '0 warnings、0 errors',
    '无 document overflow',
    'contained overflow',
    'The Open-Closed Principle',
    'The Interface Segregation Principle',
    'Applying Domain-Driven Design and Patterns',
    'Microsoft 的 DDD-oriented microservice',
    'Microsoft 的 infrastructure persistence layer 指南',
    'Applying UML and Patterns（Pearson 书目页）',
    'Craig Larman 的书籍页面',
    '`470/470` tests passed',
    '33 completed topics',
    '36 completed topics',
    '79 content documents',
    'Stage B closure — PASS',
  ]) {
    assert.ok(source.includes(literal), `review must record ${literal}`);
  }
}

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
    ['无 document overflow', '存在 document overflow'],
    ['contained overflow', 'local clipping'],
    ['The Open-Closed Principle', 'OCP alias'],
    ['`470/470` tests passed', '`469/470` tests passed'],
    ['33 completed topics', '32 completed topics'],
    ['36 completed topics', '35 completed topics'],
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
    assert.equal(batch4TopicsById.get(id)?.published, false);
  }
  assert.match(backlog, /- \*\*当前持久故事：\*\* `G007`。/u);
  assert.match(
    backlog,
    /- \*\*持久故事进度：\*\* 已完成 `6 \/ 20`；最近完成 `G006`。/u,
  );
  assert.match(backlog, /G007 仍在进行中，下一项为 PR-15|PR-15 为下一项/u);
});
