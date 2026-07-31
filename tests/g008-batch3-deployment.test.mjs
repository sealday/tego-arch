import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = 'e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407';
const expectedPagesRunId = '30610324378';

assert.match(expectedStageASha, /^[0-9a-f]{40}$/u);
assert.match(expectedPagesRunId, /^[0-9]+$/u);
assert.notEqual(
  expectedStageASha,
  '2f42703d09cb63fc1e4e5c16fe745c4beab215ab',
  'Batch 3 must not reuse the Batch 2 Stage B SHA',
);

const [review, backlog, manifest, projectStatus] = await Promise.all([
  readFile(new URL('../docs/reviews/g008-batch3.md', import.meta.url), 'utf8')
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
  assert.equal(sha, expectedStageASha, 'review must use the G008 Batch 3 Stage A SHA');
  assert.equal(run, expectedPagesRunId, 'review must use the G008 Batch 3 Pages run');
  assert.equal(gate, expectedStageASha, 'run gate must use the G008 Batch 3 Stage A SHA');
  return {sha, run};
}

function assertDeploymentEvidence(source) {
  const {sha} = parseEvidence(source);
  for (const literal of [
    '86 content documents',
    '473 governed sources',
    '43 completed topics',
    'Repository tests: 541 / 541',
    'desktop `1440x1000`',
    'mobile `390x844`',
    'HTTP canonical routes: 6 / 6',
    'canonical modeling route: `/modeling`',
    'canonical references route: `/references`',
    'Mermaid: 1 / 1',
    'mapping table: 1 / 1, 4 data rows',
    'source labels: 5 / 5',
    'source clicks: 10 / 10',
    'relation clicks: 12 / 12',
    '0 warnings / 0 errors',
    'no document overflow',
    'contained horizontal overflow',
    'keyboard scroll/focus',
    '44 completed topics',
    '7 / 20',
    'current G008',
    'next MOD-06',
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

function g008Batch3BaselineSegment(source) {
  const baseline = currentReleaseBaseline(source);
  const starts = [...baseline.matchAll(
    /(?:2026-07-31 )?G008 Batch 3 已完成 MOD-05/gu,
  )];
  const ends = [...baseline.matchAll(/此前 G008 Batch 2/gu)];
  assert.equal(starts.length, 1, 'baseline must contain one G008 Batch 3 segment');
  assert.equal(ends.length, 1, 'baseline must contain one G008 Batch 2 history marker');
  assert.ok(
    starts[0].index < ends[0].index,
    'G008 Batch 3 segment must precede G008 Batch 2 history',
  );
  return {
    baseline,
    prefix: baseline.slice(0, starts[0].index),
    segment: baseline.slice(starts[0].index, ends[0].index),
  };
}

function assertCurrentReleaseState(source) {
  const {prefix, segment} = g008Batch3BaselineSegment(source);
  assert.match(segment, /G008 仍在进行中/u);
  assert.match(segment, /下一项为 MOD-06/u);
  assert.doesNotMatch(segment, /G008 已完成/u);
  assert.doesNotMatch(segment, /最近完成 `?G008`?/u);
  if (prefix.includes('G009')) {
    assert.match(prefix, /G008 已完成/u);
    assert.match(prefix, /当前持久故事为 G009/u);
  }
}

function assertBacklogClosure(source) {
  assert.match(source, /^- \[x\] \*\*MOD-05 /mu);
  for (const id of ['06', '07', '08', '09', '10', '11', '12', '13']) {
    assert.match(source, new RegExp(`^- \\[ \\] \\*\\*MOD-${id} `, 'mu'));
  }
  assertCurrentReleaseState(source);
}

test('records exact successful G008 Batch 3 deployment evidence', () => {
  const sha = assertDeploymentEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {stdio: 'pipe'}),
  );
});

test('rejects stale duplicate or missing live deployment evidence', () => {
  const batch2Review = review
    .replaceAll(expectedStageASha, 'ef04cdbc84c2303c115855f571e061262cdbba5f')
    .replaceAll(expectedPagesRunId, '30543389172');
  assert.throws(() => assertDeploymentEvidence(batch2Review), {
    name: 'AssertionError',
  });

  for (const invalidIdentity of [
    review.replace(
      `Exact Stage A SHA: \`${expectedStageASha}\``,
      'Exact Stage A SHA: `STAGE_A_SHA`',
    ),
    review.replace(
      `Exact Stage A SHA: \`${expectedStageASha}\``,
      'Exact Stage A SHA: `<authoritative commit>`',
    ),
    review.replace(
      `GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
      'GitHub Pages run: [`run-30610324378`](https://github.com/sealday/tego-arch/actions/runs/run-30610324378)',
    ),
  ]) {
    assert.throws(() => assertDeploymentEvidence(invalidIdentity), {
      name: 'AssertionError',
    });
  }

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
    'desktop `1440x1000`',
    'mobile `390x844`',
    'HTTP canonical routes: 6 / 6',
    'canonical references route: `/references`',
    'Mermaid: 1 / 1',
    'mapping table: 1 / 1, 4 data rows',
    'source labels: 5 / 5',
    'source clicks: 10 / 10',
    'relation clicks: 12 / 12',
    '0 warnings / 0 errors',
    'no document overflow',
    'contained horizontal overflow',
    'keyboard scroll/focus',
  ]) {
    assert.throws(
      () => assertDeploymentEvidence(review.replace(`- ${literal}\n`, '')),
      {name: 'AssertionError'},
    );
  }
});

test('closes only MOD-05 and preserves the non-terminal G008 baseline', () => {
  const {sha, run} = parseEvidence(review);
  const row = backlog
    .split(/\r?\n/u)
    .find((line) => line.startsWith('- [x] **MOD-05 '));
  assert.ok(row, 'MOD-05 checked');
  assert.ok(row.includes(sha), 'MOD-05 Stage A SHA');
  assert.ok(
    row.includes(`https://github.com/sealday/tego-arch/actions/runs/${run}`),
    'MOD-05 Pages run',
  );
  assert.deepEqual(topicsById.get('MOD-05')?.status, {
    scope: 'backlog-projection',
    value: 'complete',
    source: 'docs/content-backlog.md',
  });
  for (const id of ['MOD-06', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13']) {
    assert.equal(topicsById.get(id)?.status.value, 'pending', id);
  }
  assert.equal(projectStatus.completed_topics, 44);
  assert.equal(projectStatus.content_documents, 86);
  assert.equal(projectStatus.governed_sources, 473);
  assert.deepEqual(projectStatus.durable_stories, {
    completed: 7,
    total: 20,
    current: 'G008',
  });
  assertBacklogClosure(backlog);
  assert.match(backlog, /当前持久故事：\*\* `G008`/u);
  assert.doesNotMatch(backlog, /最近完成 `G008`/u);
});

test('rejects incomplete over-complete or terminal Batch 3 mutations', () => {
  assert.throws(
    () => assertCurrentReleaseState(
      backlog.replace('G008 仍在进行中，下一项为 MOD-06', 'G008 已完成，下一项为 MOD-06'),
    ),
    {name: 'AssertionError'},
  );
  assert.throws(
    () => assertCurrentReleaseState(`${backlog}\n- **当前发布基线：** duplicate\n`),
    {name: 'AssertionError'},
  );

  assert.throws(
    () => assertBacklogClosure(
      backlog.replace('- [x] **MOD-05 ', '- [ ] **MOD-05 '),
    ),
    {name: 'AssertionError'},
  );
  assert.throws(
    () => assertBacklogClosure(
      backlog.replace('- [ ] **MOD-06 ', '- [x] **MOD-06 '),
    ),
    {name: 'AssertionError'},
  );
});

test('accepts a later G009 current baseline with intact Batch 3 history', () => {
  const futureBacklog = backlog.replace(
    '- **当前发布基线：** ',
    '- **当前发布基线：** 2026-08-01 G008 已完成，当前持久故事为 G009。此前 G008 Batch 3 历史完成基线为：',
  );
  assert.doesNotThrow(() => assertBacklogClosure(futureBacklog));
});
