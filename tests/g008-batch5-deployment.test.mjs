import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = '21fb1c26624920e78f62ae1c947ff6812fb97e02';
const expectedPagesRunId = '30707375989';
const expectedArtifactSha256 =
  '3795020327a21d4182003cdfdefe169552c8fbff7420710f893ebc3e4733e610';
const expectedBatch4AndOlderSha256 =
  '89bcd44a40b9d6f64454e205dc0c5fcfa37aec0c4bb23cfc3a0bf45dc92c022c';
const releaseReviewUrl = new URL('../docs/reviews/g008-batch5.md', import.meta.url);

assert.match(expectedStageASha, /^[0-9a-f]{40}$/u);
assert.match(expectedPagesRunId, /^[0-9]+$/u);
assert.match(expectedArtifactSha256, /^[0-9a-f]{64}$/u);

async function readReleaseReview(read = readFile) {
  try {
    return await read(releaseReviewUrl, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT' && read === readFile) return '';
    throw error;
  }
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

function reviewSectionLines(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const matches = headings.filter((match) => match[1] === heading);
  assert.equal(matches.length, 1, `review must contain one ${heading} section`);
  const match = matches[0];
  const next = headings.find((candidate) => candidate.index > match.index);
  return source
    .slice(match.index + match[0].length, next?.index ?? source.length)
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean);
}

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
  assert.equal(shaMatches[0][1], expectedStageASha);
  assert.equal(runMatches[0][1], expectedPagesRunId);
  assert.equal(gateMatches[0][1], expectedStageASha);
  return {sha: shaMatches[0][1], run: runMatches[0][1]};
}

const expectedReviewEvidence = [
  '88 content documents',
  '476 governed sources',
  '45 completed topics',
  'Repository tests: 574 / 574',
  'desktop `1440x1000`',
  'mobile `390x844`',
  'HTTP canonical routes: 8 / 8',
  'Mermaid: 1 / 1',
  'five-row evidence table: 1 / 1',
  'review records: 5 / 5',
  'source labels: 4 / 4',
  'source clicks: 8 / 8',
  'relation clicks: 16 / 16',
  'MOD-08 article links: 0; operator requests: 0',
  'wrapper focusability: diagram and table PASS at desktop and mobile',
  'keyboard ArrowRight table scrollLeft: desktop 0 → 40; mobile 0 → 40',
  '0 warnings / 0 errors / 0 page errors',
  `artifact SHA-256: \`${expectedArtifactSha256}\``,
  '46 completed topics',
  '7 / 20',
  'current G008',
  'next MOD-08',
  'Stage B closure — PASS',
];

const expectedStageAReviewLines = [
  '- 88 content documents',
  '- 476 governed sources',
  '- 45 completed topics',
  '- Repository tests: 574 / 574',
];

const expectedIndependentReviewLines = [
  '- spec and content compliance: PASS',
  '- source and copyright boundary: PASS',
  '- code and test quality: PASS',
  '- Task 4 production QA: PASS',
];

const expectedLiveSmokeLines = [
  '- desktop `1440x1000`',
  '- mobile `390x844`',
  '- HTTP canonical routes: 8 / 8',
  '- Mermaid: 1 / 1',
  '- five-row evidence table: 1 / 1',
  '- review records: 5 / 5',
  '- source labels: 4 / 4',
  '- source clicks: 8 / 8',
  '- relation clicks: 16 / 16',
  '- MOD-08 article links: 0; operator requests: 0',
  '- document overflow: 0 at desktop and mobile',
  '- contained horizontal overflow: table PASS at desktop and mobile',
  '- keyboard scroll/focus',
  '- wrapper focusability: diagram and table PASS at desktop and mobile',
  '- keyboard ArrowRight table scrollLeft: desktop 0 → 40; mobile 0 → 40',
  '- 0 warnings / 0 errors / 0 page errors',
  `- artifact SHA-256: \`${expectedArtifactSha256}\``,
];

const expectedStageBReviewLines = [
  '- 46 completed topics',
  '- 88 content documents',
  '- 476 governed sources',
  '- 7 / 20',
  '- current G008',
  '- next MOD-08',
  'Stage B closure — PASS',
];

function assertDeploymentEvidence(source) {
  const identity = parseEvidence(source);
  for (const literal of expectedReviewEvidence) assert.ok(source.includes(literal), literal);
  assert.deepEqual(reviewSectionLines(source, 'Stage A evidence'), expectedStageAReviewLines);
  assert.deepEqual(
    reviewSectionLines(source, 'Independent review'),
    expectedIndependentReviewLines,
  );
  assert.deepEqual(reviewSectionLines(source, 'Live smoke'), expectedLiveSmokeLines);
  assert.deepEqual(reviewSectionLines(source, 'Stage B projection'), expectedStageBReviewLines);
  for (const [literal, count] of [
    ['- 45 completed topics', 1],
    ['- 46 completed topics', 1],
    ['- 88 content documents', 2],
    ['- 476 governed sources', 2],
  ]) {
    assert.equal(source.split(literal).length - 1, count, `${literal} occurrence count`);
  }
  assert.doesNotMatch(source, /ACTUAL_|STAGE_A_SHA|RUN_ID|<[^>]+>/u);
  return identity;
}

function currentReleaseBaseline(source) {
  const baselines = source
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(baselines.length, 1, 'backlog must contain one current release baseline');
  return baselines[0];
}

function batch5Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 5 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 5 history boundary');
  const end = baseline.indexOf('此前 G008 Batch 4 历史完成基线为：');
  assert.notEqual(end, -1, 'Batch 4 history boundary');
  return baseline.slice(start + marker.length, end);
}

const expectedBatch5Evidence = [
  '2026-08-01 G008 Batch 5 已完成 MOD-07',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  '8/8 个 canonical HTTP route 检查通过',
  'desktop `1440x1000`',
  'mobile `390x844`',
  'desktop/mobile 均无 document overflow',
  '五行证据边界表在 desktop/mobile 均使用 contained horizontal overflow',
  'keyboard focus/ArrowRight scroll 可用',
  'diagram/table wrappers 在 desktop/mobile 均可聚焦',
  'table ArrowRight scrollLeft 在 desktop/mobile 均为 0→40',
  '1/1 Mermaid',
  '1/1 五行证据边界表',
  '5/5 条评审记录',
  '4/4 source label',
  '8/8 次 source 点击',
  '16/16 次 relation 点击',
  'MOD-08 article link 为 0 且 operator request 为 0',
  '0 warnings、0 errors、0 page errors',
  `Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  'Stage A 为 45 个已完成主题、88 篇内容文档与 476 个受治理来源',
  '仓库测试 `574/574`',
  'Stage B closure 投影为 46 个已完成主题、88 篇内容文档与 476 个受治理来源',
  '持久故事进度仍为 `7 / 20`',
  'G008 仍在进行中',
  '下一项为 MOD-08',
  'Stage B closure — PASS',
];

function assertBatch5BaselineEvidence(source) {
  const segment = batch5Segment(source);
  for (const literal of expectedBatch5Evidence) assert.ok(segment.includes(literal), literal);
  for (const literal of [
    `[\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
    `[\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
    'Stage A 为 45 个已完成主题、88 篇内容文档与 476 个受治理来源',
    'Stage B closure 投影为 46 个已完成主题、88 篇内容文档与 476 个受治理来源',
  ]) {
    assert.equal(segment.split(literal).length - 1, 1, `one Batch 5 ${literal}`);
  }
  return segment;
}

function batch4AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 4 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 4 history boundary');
  return baseline.slice(start + marker.length);
}

function assertBatch4AndOlderHistory(source) {
  assert.equal(
    createHash('sha256').update(batch4AndOlderHistory(source)).digest('hex'),
    expectedBatch4AndOlderSha256,
    'Batch 4 and older baseline text must remain byte-for-byte unchanged',
  );
}

function assertBacklogClosure(source) {
  assertBatch5BaselineEvidence(source);
  assertBatch4AndOlderHistory(source);
  assert.match(source, /^- \[x\] \*\*MOD-07 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-08 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-09 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-10 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-11 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-12 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-13 /mu);
  assert.match(source, /^- \[x\] \*\*STY-00 /mu);
  assert.match(source, /当前持久故事：\*\* `G009`/u);
  assert.match(source, /最近完成 `G008`/u);
}

test('records exact successful G008 Batch 5 deployment evidence', () => {
  const {sha} = assertDeploymentEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {stdio: 'pipe'}),
  );
});

test('rejects symbolic duplicate incomplete or weakened deployment evidence', () => {
  for (const duplicate of [
    `Exact Stage A SHA: \`${expectedStageASha}\``,
    `GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `Exact run gate: \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]) {
    assert.throws(() => assertDeploymentEvidence(`${review}\n${duplicate}\n`));
  }
  for (const literal of expectedReviewEvidence) {
    assert.throws(() => assertDeploymentEvidence(review.replaceAll(literal, '__REMOVED__')));
  }
  for (const symbolic of ['ACTUAL_SHA', 'STAGE_A_SHA', 'RUN_ID', '<run-id>']) {
    assert.throws(() => assertDeploymentEvidence(review.replace(expectedStageASha, symbolic)));
  }
});

test('rejects segment-local review and interaction evidence mutations', () => {
  for (const mutatedReview of [
    review.replace(
      '- spec and content compliance: PASS',
      '- spec and content compliance: FAIL',
    ),
    review.replace(
      '## Stage B projection\n\n- 46 completed topics\n- 88 content documents',
      '## Stage B projection\n\n- 46 completed topics\n- 87 content documents',
    ),
    review.replace(
      '## Stage B projection\n\n- 46 completed topics\n- 88 content documents\n- 476 governed sources',
      '## Stage B projection\n\n- 46 completed topics\n- 88 content documents\n- 475 governed sources',
    ),
    review.replace('- document overflow: 0 at desktop and mobile\n', ''),
    review.replace(
      '- contained horizontal overflow: table PASS at desktop and mobile\n',
      '',
    ),
    review.replace('- keyboard scroll/focus\n', ''),
    review.replace(
      '- wrapper focusability: diagram and table PASS at desktop and mobile\n',
      '',
    ),
    review.replace(
      '- keyboard ArrowRight table scrollLeft: desktop 0 → 40; mobile 0 → 40\n',
      '',
    ),
  ]) {
    assert.throws(() => assertDeploymentEvidence(mutatedReview));
  }

  const current = batch5Segment(backlog);
  for (const mutatedSegment of [
    current.replace(
      '五行证据边界表在 desktop/mobile 均使用 contained horizontal overflow',
      '五行证据边界表未验证 contained horizontal overflow',
    ),
    current.replace(
      'keyboard focus/ArrowRight scroll 可用',
      'keyboard focus/ArrowRight scroll 未验证',
    ),
    current.replace(
      'diagram/table wrappers 在 desktop/mobile 均可聚焦',
      'diagram/table wrappers 未验证可聚焦',
    ),
    current.replace(
      'table ArrowRight scrollLeft 在 desktop/mobile 均为 0→40',
      'table ArrowRight scrollLeft 未验证',
    ),
    current.replace(
      'Stage A 为 45 个已完成主题、88 篇内容文档与 476 个受治理来源',
      'Stage A 为 45 个已完成主题、87 篇内容文档与 476 个受治理来源',
    ),
    current.replace(
      'Stage B closure 投影为 46 个已完成主题、88 篇内容文档与 476 个受治理来源',
      'Stage B closure 投影为 46 个已完成主题、88 篇内容文档与 475 个受治理来源',
    ),
  ]) {
    assert.throws(() => assertBacklogClosure(
      backlog.replace(current, mutatedSegment),
    ));
  }
});

test('preserves Batch 5 evidence under the current Batch 8 projection', () => {
  const {sha, run} = parseEvidence(review);
  const row = backlog.split(/\r?\n/u).find((line) => line.startsWith('- [x] **MOD-07 '));
  assert.ok(row?.includes(sha), 'MOD-07 exact Stage A SHA');
  assert.ok(row?.includes(`/actions/runs/${run}`), 'MOD-07 exact Pages run');
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
    completed_topics: 60,
    content_documents: 102,
    governed_sources: 529,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assertBacklogClosure(backlog);
});

test('rejects current-state and Batch 5 baseline mutations', () => {
  assert.doesNotThrow(() => assertBacklogClosure(backlog));
  for (const literal of expectedBatch5Evidence) {
    const segment = batch5Segment(backlog);
    assert.ok(segment.includes(literal));
    assert.throws(() => assertBacklogClosure(
      backlog.replace(segment, segment.replace(literal, '__REMOVED__')),
    ));
  }
  assert.throws(() => assertBacklogClosure(backlog.replace('- [x] **MOD-07 ', '- [ ] **MOD-07 ')));
  assert.throws(() => assertBacklogClosure(backlog.replace('- [x] **MOD-08 ', '- [ ] **MOD-08 ')));
  assert.throws(() => assertBacklogClosure(backlog.replace('- [x] **MOD-09 ', '- [ ] **MOD-09 ')));
  assert.throws(() => assertBacklogClosure(backlog.replace('- [x] **MOD-11 ', '- [ ] **MOD-11 ')));
  assert.throws(() => assertBacklogClosure(backlog.replace('- [x] **STY-00 ', '- [ ] **STY-00 ')));
});

test('locks Batch 4 and all older release evidence byte-for-byte', () => {
  const original = batch4AndOlderHistory(backlog);
  assert.doesNotThrow(() => assertBatch4AndOlderHistory(backlog));
  assert.throws(() => assertBatch4AndOlderHistory(
    backlog.replace(original, original.replace('G008 Batch 4', 'G008 Batch four')),
  ));
});

test('preserves release-review I/O failures', async () => {
  const permissionError = Object.assign(new Error('permission denied'), {code: 'EACCES'});
  await assert.rejects(
    () => readReleaseReview(async () => { throw permissionError; }),
    (error) => error === permissionError,
  );
});
