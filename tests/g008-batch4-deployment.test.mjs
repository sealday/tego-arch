import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = '63d22725f2b16b92b5821828008b4ba4e56763e1';
const expectedPagesRunId = '30626326632';
const releaseReviewUrl = new URL(
  '../docs/reviews/g008-batch4.md',
  import.meta.url,
);

assert.match(expectedStageASha, /^[0-9a-f]{40}$/u);
assert.match(expectedPagesRunId, /^[0-9]+$/u);
assert.notEqual(
  expectedStageASha,
  'e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407',
  'Batch 4 must not reuse the Batch 3 Stage A SHA',
);

async function readReleaseReview(read = readFile) {
  return read(releaseReviewUrl, 'utf8');
}

const [review, backlog, manifest, projectStatus] = await Promise.all([
  readReleaseReview(),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8')
    .then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8')
    .then(JSON.parse),
]);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function parseEvidence(source) {
  const shaMatches = [...source.matchAll(
    /^Exact Stage A SHA: `([0-9a-f]{40})`$/gmu,
  )];
  const runMatches = [...source.matchAll(
    /^GitHub Pages run: \[`([0-9]+)`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\1\)$/gmu,
  )];
  const gateMatches = [...source.matchAll(
    /^Exact run gate: `headSha=([0-9a-f]{40})`, `status=completed`, `conclusion=success`\.$/gmu,
  )];
  assert.equal(shaMatches.length, 1, 'review must contain exactly one Stage A SHA');
  assert.equal(runMatches.length, 1, 'review must contain exactly one Pages run');
  assert.equal(gateMatches.length, 1, 'review must contain exactly one run gate');
  const sha = shaMatches[0][1];
  const run = runMatches[0][1];
  assert.equal(sha, expectedStageASha, 'review must use the G008 Batch 4 Stage A SHA');
  assert.equal(run, expectedPagesRunId, 'review must use the G008 Batch 4 Pages run');
  assert.equal(gateMatches[0][1], expectedStageASha, 'run gate must use the G008 Batch 4 Stage A SHA');
  return {sha, run};
}

function assertDeploymentEvidence(source) {
  const {sha} = parseEvidence(source);
  for (const literal of [
    '87 content documents',
    '475 governed sources',
    '44 completed topics',
    'Repository tests: 557 / 557',
    'desktop `1440x1000`',
    'mobile `390x844`',
    'HTTP canonical routes: 6 / 6',
    'canonical modeling route: `/modeling`',
    'canonical references route: `/references`',
    'Mermaid: 1 / 1, 6 entities, 7 relationships',
    'tables: 2 / 2, 4 + 6 data rows',
    'source labels: 4 / 4',
    'source clicks: 8 / 8',
    'relation clicks: 10 / 10',
    'MOD-05 backlink: desktop / mobile PASS',
    'no MOD-07 / MOD-08 links',
    '0 warnings / 0 errors',
    '0 page errors',
    'no document overflow',
    'contained horizontal overflow',
    'keyboard scroll/focus',
    'artifact SHA-256: `1c6eb07dc5b46de13addca51a88884bf1c075c853f9a03be4b5d323458c1fb9c`',
    '45 completed topics',
    '7 / 20',
    'current G008',
    'next MOD-07',
    'Stage B closure — PASS',
  ]) {
    assert.ok(source.includes(literal), literal);
  }
  assert.doesNotMatch(source, /ACTUAL_|STAGE_A_SHA|RUN_ID|<[^>]+>/u);
  return sha;
}

function currentReleaseBaseline(source) {
  const baselines = source
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(baselines.length, 1, 'backlog must contain exactly one current release baseline');
  return baselines[0];
}

const expectedBatch4BaselineEvidence = [
  '2026-07-31 G008 Batch 4 已完成 MOD-06',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  '6/6 个 canonical HTTP route 检查通过',
  'canonical modeling route 为 `/modeling`',
  'canonical references route 为 `/references`',
  'desktop `1440x1000`',
  'mobile `390x844`',
  '无 document overflow',
  'Mermaid 与两张 table 使用 contained horizontal overflow',
  'keyboard focus/ArrowRight scroll 可用',
  '1/1 Mermaid（6 entities、7 relationships）',
  '2/2 tables（4 + 6 data rows）',
  '4/4 source label',
  '8/8 次 source 点击',
  '10/10 次 relation 点击',
  'MOD-05 backlink 在 desktop/mobile 均通过',
  '无 MOD-07/MOD-08 链接',
  '0 warnings、0 errors、0 page errors',
  'Task 4 raw artifact SHA-256 为 `1c6eb07dc5b46de13addca51a88884bf1c075c853f9a03be4b5d323458c1fb9c`',
  'Stage A 为 44 个已完成主题、87 篇内容文档与 475 个受治理来源',
  '仓库测试 `557/557`',
  'Stage B closure 投影为 45 个已完成主题、87 篇内容文档与 475 个受治理来源',
  '持久故事进度仍为 `7 / 20`',
  'G008 仍在进行中',
  '下一项为 MOD-07',
  'Stage B closure — PASS',
];

function batch4Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const end = baseline.indexOf('此前 G008 Batch 3');
  assert.notEqual(end, -1, 'Batch 3 history marker');
  return baseline.slice(0, end);
}

function assertBatch4BaselineEvidence(source) {
  const segment = batch4Segment(source);
  for (const literal of expectedBatch4BaselineEvidence) {
    assert.ok(segment.includes(literal), literal);
  }
  assert.equal(
    segment.split(
      `[\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
    ).length - 1,
    1,
    'Batch 4 baseline must contain one exact Stage A commit link',
  );
  assert.equal(
    segment.split(
      `[\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    ).length - 1,
    1,
    'Batch 4 baseline must contain one exact Pages run link',
  );
  assert.equal(
    segment.split(
      `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
    ).length - 1,
    1,
    'Batch 4 baseline must contain one exact run gate',
  );
  return segment;
}

function replaceBatch4Baseline(source, literal, replacement) {
  const segment = batch4Segment(source);
  assert.ok(segment.includes(literal), `Batch 4 baseline must contain ${literal}`);
  return source.replace(segment, segment.replaceAll(literal, replacement));
}

function batch3Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const start = baseline.indexOf('此前 G008 Batch 3');
  const end = baseline.indexOf('此前 G008 Batch 2');
  assert.notEqual(start, -1, 'Batch 3 history marker');
  assert.notEqual(end, -1, 'Batch 2 history marker');
  assert.ok(start < end, 'Batch 3 history must precede Batch 2 history');
  return baseline.slice(start, end);
}

const expectedBatch3Identity = [
  'G008 Batch 3 已完成 MOD-05',
  'e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407',
  '30610324378',
  'Stage A 为 43 个已完成主题、86 篇内容文档与 473 个受治理来源',
  '仓库测试 `541/541`',
  'Stage B closure 投影为 44 个已完成主题、86 篇内容文档与 473 个受治理来源',
  'G008 仍在进行中',
  '下一项为 MOD-06',
  'Stage B closure — PASS',
];

function assertBatch3History(source) {
  const segment = batch3Segment(source);
  for (const literal of expectedBatch3Identity) assert.ok(segment.includes(literal), literal);
  return segment;
}

function replaceBatch3History(source, literal, replacement) {
  const segment = batch3Segment(source);
  assert.ok(segment.includes(literal), `Batch 3 history must contain ${literal}`);
  return source.replace(segment, segment.replaceAll(literal, replacement));
}

function assertBacklogClosure(source) {
  assertBatch4BaselineEvidence(source);
  assert.match(source, /^- \[x\] \*\*MOD-06 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-07 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-08 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-09 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-10 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-11 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-12 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-13 /mu);
  assert.match(source, /^- \[x\] \*\*STY-00 /mu);
  assertBatch3History(source);
}

test('records exact successful G008 Batch 4 deployment evidence', () => {
  const sha = assertDeploymentEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {stdio: 'pipe'}),
  );
});

test('rejects symbolic duplicate or incomplete live evidence', () => {
  for (const duplicate of [
    `Exact Stage A SHA: \`${expectedStageASha}\``,
    `GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `Exact run gate: \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]) {
    assert.throws(() => assertDeploymentEvidence(`${review}\n${duplicate}\n`), {name: 'AssertionError'});
  }
  for (const symbolic of ['ACTUAL_SHA', 'STAGE_A_SHA', 'RUN_ID', '<run-id>']) {
    assert.throws(
      () => assertDeploymentEvidence(review.replace(expectedStageASha, symbolic)),
      {name: 'AssertionError'},
    );
  }
});

test('preserves MOD-06 closure under the current G009 baseline', () => {
  const {sha, run} = parseEvidence(review);
  const row = backlog.split(/\r?\n/u).find((line) => line.startsWith('- [x] **MOD-06 '));
  assert.ok(row?.includes(sha), 'MOD-06 exact Stage A SHA');
  assert.ok(row?.includes(`/actions/runs/${run}`), 'MOD-06 exact Pages run');
  assert.equal(topicsById.get('MOD-06')?.status.value, 'complete');
  assert.equal(topicsById.get('MOD-07')?.status.value, 'complete');
  assert.equal(topicsById.get('MOD-08')?.status.value, 'complete');
  assert.equal(topicsById.get('MOD-09')?.status.value, 'complete');
  assert.equal(topicsById.get('MOD-10')?.published, true);
  assert.equal(topicsById.get('MOD-10')?.status.value, 'complete');
  assert.equal(topicsById.get('MOD-11')?.published, true);
  assert.equal(topicsById.get('MOD-11')?.status.value, 'complete');
  assert.equal(topicsById.get('MOD-12')?.published, true);
  assert.equal(topicsById.get('MOD-12')?.status.value, 'complete');
  assert.equal(topicsById.get('MOD-13')?.published, true);
  assert.equal(topicsById.get('MOD-13')?.status.value, 'complete');
  assert.equal(topicsById.get('STY-00')?.published, true);
  assert.equal(topicsById.get('STY-00')?.status.value, 'complete');
  assert.equal(topicsById.get('STY-01')?.published, true);
  assert.equal(topicsById.get('STY-01')?.status.value, 'complete');
  assert.deepEqual(projectStatus, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 56,
    content_documents: 99,
    governed_sources: 512,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assertBacklogClosure(backlog);
  assert.match(backlog, /当前持久故事：\*\* `G009`/u);
  assert.match(backlog, /最近完成 `G008`/u);
});

test('locks the Batch 3 completion identity below Batch 4', () => {
  const original = assertBatch3History(backlog);
  for (const literal of expectedBatch3Identity) {
    assert.throws(
      () => assertBatch3History(replaceBatch3History(backlog, literal, '__REMOVED__')),
      {name: 'AssertionError'},
    );
  }
  assert.equal(assertBatch3History(backlog), original);
});

test('rejects drift in the current Batch 4 baseline evidence', () => {
  assert.doesNotThrow(() => assertBatch4BaselineEvidence(backlog));
  for (const literal of expectedBatch4BaselineEvidence) {
    assert.throws(
      () => assertBatch4BaselineEvidence(
        replaceBatch4Baseline(backlog, literal, '__REMOVED__'),
      ),
      {name: 'AssertionError'},
    );
  }
});

test('preserves release-review I/O failures', async () => {
  const permissionError = Object.assign(new Error('permission denied'), {code: 'EACCES'});
  await assert.rejects(
    () => readReleaseReview(async () => { throw permissionError; }),
    (error) => error === permissionError,
  );
});
