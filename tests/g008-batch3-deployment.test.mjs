import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = 'e7b712ed6e6b1e2f6780bd41fa5e6a5d8d4e4407';
const expectedPagesRunId = '30610324378';
const releaseReviewUrl = new URL(
  '../docs/reviews/g008-batch3.md',
  import.meta.url,
);

assert.match(expectedStageASha, /^[0-9a-f]{40}$/u);
assert.match(expectedPagesRunId, /^[0-9]+$/u);
assert.notEqual(
  expectedStageASha,
  '2f42703d09cb63fc1e4e5c16fe745c4beab215ab',
  'Batch 3 must not reuse the Batch 2 Stage B SHA',
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

function assertBatch3HistoricalSegment(source) {
  const extracted = g008Batch3BaselineSegment(source);
  const {segment} = extracted;
  const shaMatches = [...segment.matchAll(new RegExp(
    `Stage A 发布基线为 \\[\`${expectedStageASha}\`\\]\\(https://github\\.com/sealday/tego-arch/commit/${expectedStageASha}\\)`,
    'gu',
  ))];
  const runMatches = [...segment.matchAll(new RegExp(
    `Pages run \\[\`${expectedPagesRunId}\`\\]\\(https://github\\.com/sealday/tego-arch/actions/runs/${expectedPagesRunId}\\)`,
    'gu',
  ))];
  assert.equal(shaMatches.length, 1, 'Batch 3 history must contain one exact Stage A SHA link');
  assert.equal(runMatches.length, 1, 'Batch 3 history must contain one exact Pages run link');
  for (const literal of [
    `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
    '6/6 个 canonical HTTP route 检查通过',
    'canonical modeling route 为 `/modeling`',
    'canonical references route 为 `/references`',
    'desktop `1440x1000`',
    'mobile `390x844`',
    '无 document overflow',
    'Mermaid 与 mapping table 使用 contained horizontal overflow',
    'keyboard focus/ArrowRight scroll 可用',
    '1/1 Mermaid',
    '1/1 mapping table（4 data rows）',
    '5/5 source label',
    '10/10 次 source 点击',
    '12/12 次 relation 点击',
    '0 warnings、0 errors',
    'Stage A 为 43 个已完成主题、86 篇内容文档与 473 个受治理来源',
    '仓库测试 `541/541`',
    'Stage B closure 投影为 44 个已完成主题、86 篇内容文档与 473 个受治理来源',
    '持久故事进度仍为 `7 / 20`',
    'G008 仍在进行中',
    '下一项为 MOD-06',
    'Stage B closure — PASS',
  ]) {
    assert.ok(segment.includes(literal), literal);
  }
  assert.doesNotMatch(segment, /G008 已完成/u);
  assert.doesNotMatch(segment, /最近完成 `?G008`?/u);
  return extracted;
}

function replaceBatch3HistoricalLiteral(source, literal, replacement) {
  const {segment} = g008Batch3BaselineSegment(source);
  assert.ok(segment.includes(literal), `Batch 3 history must contain ${literal}`);
  return source.replace(segment, segment.replace(literal, replacement));
}

function assertCurrentReleaseState(source) {
  const {prefix} = assertBatch3HistoricalSegment(source);
  assert.match(
    prefix,
    /^- \*\*当前发布基线：\*\* 2026-07-31 G008 Batch 4 已完成 MOD-06/u,
  );
  assert.match(prefix, /G008 仍在进行中，下一项为 MOD-07/u);
}

function assertBacklogClosure(source) {
  assert.match(source, /^- \[x\] \*\*MOD-05 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-06 /mu);
  for (const id of ['07', '08', '09', '10', '11', '12', '13']) {
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

test('preserves Batch 3 closure under the current non-terminal G008 baseline', () => {
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
  assert.equal(topicsById.get('MOD-06')?.status.value, 'complete');
  for (const id of ['MOD-07', 'MOD-08', 'MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13']) {
    assert.equal(topicsById.get(id)?.status.value, 'pending', id);
  }
  assert.equal(projectStatus.completed_topics, 45);
  assert.equal(projectStatus.content_documents, 88);
  assert.equal(projectStatus.governed_sources, 476);
  assert.deepEqual(projectStatus.durable_stories, {
    completed: 7,
    total: 20,
    current: 'G008',
  });
  assertBacklogClosure(backlog);
  assert.match(backlog, /当前持久故事：\*\* `G008`/u);
  assert.doesNotMatch(backlog, /最近完成 `G008`/u);
});

test('rejects incomplete over-complete or terminal current mutations', () => {
  assert.throws(
    () => assertCurrentReleaseState(
      backlog.replace('G008 仍在进行中，下一项为 MOD-07', 'G008 已完成，下一项为 MOD-07'),
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
      backlog.replace('- [x] **MOD-06 ', '- [ ] **MOD-06 '),
    ),
    {name: 'AssertionError'},
  );
  assert.throws(
    () => assertBacklogClosure(
      backlog.replace('- [ ] **MOD-07 ', '- [x] **MOD-07 '),
    ),
    {name: 'AssertionError'},
  );
});

test('locks the full immutable Batch 3 historical segment', () => {
  assert.doesNotThrow(() => assertBatch3HistoricalSegment(backlog));
  for (const mutatedBacklog of [
    replaceBatch3HistoricalLiteral(backlog, expectedStageASha, '0'.repeat(40)),
    replaceBatch3HistoricalLiteral(backlog, '`/references`', '`/sources`'),
    replaceBatch3HistoricalLiteral(backlog, 'Stage A 为 43 个已完成主题', 'Stage A 为 42 个已完成主题'),
    replaceBatch3HistoricalLiteral(backlog, '12/12 次 relation 点击', '11/12 次 relation 点击'),
    replaceBatch3HistoricalLiteral(backlog, '0 warnings、0 errors', '0 warnings、1 error'),
    replaceBatch3HistoricalLiteral(backlog, '无 document overflow', '存在 document overflow'),
  ]) {
    assert.throws(() => assertBatch3HistoricalSegment(mutatedBacklog), {
      name: 'AssertionError',
    });
  }
});

test('accepts intact Batch 3 history under a coherent later G009 baseline', () => {
  const originalSegment = g008Batch3BaselineSegment(backlog).segment;
  let futureBacklog = backlog.replace(
    '- **当前发布基线：** ',
    '- **当前发布基线：** 2026-08-01 G008 已完成，当前持久故事为 G009，下一项为 G009 首批主题。此前 G008 Batch 3 历史完成基线为：',
  );
  for (const id of ['06', '07', '08', '09', '10', '11', '12', '13']) {
    futureBacklog = futureBacklog.replace(
      `- [ ] **MOD-${id} `,
      `- [x] **MOD-${id} `,
    );
  }
  futureBacklog = futureBacklog
    .replace('- **当前持久故事：** `G008`。', '- **当前持久故事：** `G009`。')
    .replace(
      '- **持久故事进度：** 已完成 `7 / 20`；最近完成 `G007`。',
      '- **持久故事进度：** 已完成 `8 / 20`；最近完成 `G008`。',
    );

  assert.doesNotThrow(() => assertBatch3HistoricalSegment(futureBacklog));
  assert.equal(g008Batch3BaselineSegment(futureBacklog).segment, originalSegment);
  assert.throws(() => assertBacklogClosure(futureBacklog), {
    name: 'AssertionError',
  });
});

test('preserves release-review I/O failures', async () => {
  const permissionError = Object.assign(new Error('permission denied'), {
    code: 'EACCES',
  });
  await assert.rejects(
    () => readReleaseReview(async () => {
      throw permissionError;
    }),
    (error) => error === permissionError,
  );
});
