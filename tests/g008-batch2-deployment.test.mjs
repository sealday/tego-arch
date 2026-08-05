import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = 'ef04cdbc84c2303c115855f571e061262cdbba5f';
const expectedPagesRunId = '30543389172';

const [review, backlog, manifest, projectStatus] = await Promise.all([
  readFile(new URL('../docs/reviews/g008-batch2.md', import.meta.url), 'utf8')
    .catch(() => ''),
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
  const gate = gateMatches[0][1];
  assert.equal(sha, expectedStageASha, 'review must use the G008 Batch 2 Stage A SHA');
  assert.equal(run, expectedPagesRunId, 'review must use the G008 Batch 2 Pages run');
  assert.equal(gate, expectedStageASha, 'run gate must use the G008 Batch 2 Stage A SHA');
  return {sha, run};
}

function assertDeploymentEvidence(source) {
  const {sha} = parseEvidence(source);
  for (const literal of [
    '85 content documents',
    '468 governed sources',
    '42 completed topics',
    'desktop `1440x1000`',
    'mobile `390x844`',
    'HTTP canonical routes: 5 / 5',
    'canonical modeling route: `/modeling`',
    'Mermaid: 1 / 1',
    'mapping table: 1 / 1',
    'source labels: 7 / 7',
    'relation clicks: 20 / 20',
    '0 warnings / 0 errors',
    'no document overflow',
    'contained horizontal overflow for the mapping table',
    'keyboard scroll/focus',
    '43 completed topics',
    '7 / 20',
    'current G008',
    'next MOD-05',
    'Stage B closure — PASS',
  ]) {
    assert.ok(source.includes(literal), literal);
  }
  return sha;
}

function currentReleaseBaseline(source) {
  const baselines = source
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(baselines.length, 1, 'backlog must contain exactly one current release baseline');
  return baselines[0];
}

function g008Batch2HistoricalSegment(source) {
  const baseline = currentReleaseBaseline(source);
  const starts = [...baseline.matchAll(/此前 G008 Batch 2 历史完成基线为：/gu)];
  const ends = [...baseline.matchAll(/此前 G008 Batch 1/gu)];
  assert.equal(starts.length, 1, 'baseline must contain one G008 Batch 2 history marker');
  assert.equal(ends.length, 1, 'current baseline must contain one G008 Batch 1 history marker');
  assert.ok(
    starts[0].index < ends[0].index,
    'G008 Batch 2 history must precede G008 Batch 1 history',
  );
  return baseline.slice(starts[0].index, ends[0].index);
}

function assertBatch2HistoricalClosure(source) {
  const batch2 = g008Batch2HistoricalSegment(source);
  assert.match(batch2, /G008 Batch 2 已完成 MOD-04/u);
  assert.match(batch2, new RegExp(expectedStageASha, 'u'));
  assert.match(batch2, new RegExp(expectedPagesRunId, 'u'));
  assert.match(batch2, /Stage A 为 42 个已完成主题/u);
  assert.match(batch2, /Stage B closure 投影为 43 个已完成主题/u);
  assert.match(batch2, /G008 仍在进行中/u);
  assert.match(batch2, /下一项为 MOD-05/u);
  assert.doesNotMatch(batch2, /G008 已完成/u);
  assert.doesNotMatch(batch2, /最近完成 `?G008`?/u);
}

function assertLiveReleaseState(source) {
  const baseline = currentReleaseBaseline(source);
  assert.match(baseline, /^-\s\*\*当前发布基线：\*\* 2026-08-05 G008 Batch 10 已完成 MOD-12/u);
  assert.match(baseline, /G008 仍在进行中，下一项为 MOD-13/u);
}

test('records exact successful G008 Batch 2 deployment evidence', () => {
  const sha = assertDeploymentEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {stdio: 'pipe'}),
  );
});

test('rejects stale duplicate incomplete or rewritten historical closure evidence', () => {
  const batch1Review = review
    .replaceAll(expectedStageASha, 'f3d0576a3d04ff1e9ecf7511da1c6c6e6f30aa72')
    .replaceAll(expectedPagesRunId, '30529090957');
  assert.throws(() => assertDeploymentEvidence(batch1Review), {
    name: 'AssertionError',
  });

  for (const duplicate of [
    `Exact Stage A SHA: \`${expectedStageASha}\``,
    `GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `Exact run gate: \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]) {
    assert.throws(() => assertDeploymentEvidence(`${review}\n${duplicate}\n`), {
      name: 'AssertionError',
    });
  }

  for (const literal of [
    'HTTP canonical routes: 5 / 5',
    'canonical modeling route: `/modeling`',
    'relation clicks: 20 / 20',
    'contained horizontal overflow for the mapping table',
  ]) {
    assert.throws(
      () => assertDeploymentEvidence(review.replace(`- ${literal}\n`, '')),
      {name: 'AssertionError'},
    );
  }

  assert.throws(
    () => assertBatch2HistoricalClosure(
      backlog.replace(
        'G008 Batch 2 已完成 MOD-04',
        'G008 Batch 2 已完成 MOD-05',
      ),
    ),
    {name: 'AssertionError'},
  );
  assert.throws(
    () => assertBatch2HistoricalClosure(
      backlog.replace(
        'Stage B closure 投影为 43 个已完成主题，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-05。',
        'Stage B closure 投影为 44 个已完成主题，持久故事进度仍为 `7 / 20`，G008 仍在进行中，下一项为 MOD-06。',
      ),
    ),
    {name: 'AssertionError'},
  );
  assert.throws(
    () => assertBatch2HistoricalClosure(
      `${backlog}\n- **当前发布基线：** duplicate\n`,
    ),
    {name: 'AssertionError'},
  );
});

test('preserves Batch 2 closure history separately from the live projection', () => {
  const {sha, run} = parseEvidence(review);
  const row = backlog
    .split(/\r?\n/u)
    .find((line) => line.startsWith('- [x] **MOD-04 '));
  assert.ok(row, 'MOD-04 checked');
  assert.ok(row.includes(sha), 'MOD-04 Stage A SHA');
  assert.ok(
    row.includes(`https://github.com/sealday/tego-arch/actions/runs/${run}`),
    'MOD-04 Pages run',
  );
  assert.deepEqual(topicsById.get('MOD-04')?.status, {
    scope: 'backlog-projection',
    value: 'complete',
    source: 'docs/content-backlog.md',
  });
  assert.equal(topicsById.get('MOD-05')?.status.value, 'complete');
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
  for (const id of ['MOD-13']) {
    assert.equal(topicsById.get(id)?.published, false, id);
    assert.equal(topicsById.get(id)?.status.value, 'pending', id);
  }
  assert.equal(projectStatus.completed_topics, 51);
  assert.equal(projectStatus.content_documents, 93);
  assert.equal(projectStatus.governed_sources, 490);
  assert.deepEqual(projectStatus.durable_stories, {
    completed: 7,
    total: 20,
    current: 'G008',
  });
  assertBatch2HistoricalClosure(backlog);
  assertLiveReleaseState(backlog);
  assert.match(backlog, /当前持久故事：\*\* `G008`/u);
  assert.doesNotMatch(backlog, /最近完成 `G008`/u);
});
