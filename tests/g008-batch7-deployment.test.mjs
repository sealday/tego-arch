import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = '683c836cc5058272ec0ba09af6b42f512284cdf6';
const expectedPagesRunId = '30778428606';
const expectedArtifactSha256 =
  '833c815b3ccb23f223aebfdd0de51631fbbb362c22be4637c704480b8649bcd7';
const expectedBatch6AndOlderSha256 =
  '0ffa6047ddb4038eec48cb160a5b18183d531205d12df5a7030eccdcc96efbc6';
const releaseReviewUrl = new URL('../docs/reviews/g008-batch7.md', import.meta.url);

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

const expectedStageAIdentityLines = [
  `- Exact Stage A SHA: \`${expectedStageASha}\``,
  `- GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `- Exact run gate: \`workflow=Verify and deploy Docusaurus to GitHub Pages\`, \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
];

const expectedVerificationLines = [
  '- Stage A projection: 47 completed topics / 90 content documents / 481 governed sources',
  '- Repository tests: 615 / 615',
  '- Content validation: 90 content documents / 481 governed sources',
];

const expectedIndependentReviewLines = [
  '- Critical findings: 0',
  '- Important findings: 0',
  '- Minor findings: 0',
  '- Architecture judgment: CLEAR',
];

const expectedProductionSmokeLines = [
  '- Task 4 production QA — PASS',
  '- desktop `1440x1000`',
  '- mobile `390x844`',
  '- HTTP canonical routes: 9 / 9',
  '- Mermaid regions / SVGs: 1 / 1',
  '- tables: 2 / 2; Big Picture rows: 8; boundary rows: 5',
  '- source activations: 10 / 10',
  '- relation activations: 16 / 16',
  '- closed-world MOD-10 targets: 0',
  '- MOD-11 actionable article links: 0',
  '- warnings / errors / page errors: 0 / 0 / 0',
  `- artifact SHA-256: \`${expectedArtifactSha256}\``,
];

const expectedStageBProjectionLines = [
  '- 48 completed topics',
  '- 90 content documents',
  '- 481 governed sources',
  '- durable stories 7 / 20',
  '- current G008',
  '- next MOD-10',
];

const expectedFinalPassLines = ['Stage B closure — PASS'];

const expectedReviewSections = new Map([
  ['Stage A identity', expectedStageAIdentityLines],
  ['Verification', expectedVerificationLines],
  ['Independent review', expectedIndependentReviewLines],
  ['Production smoke', expectedProductionSmokeLines],
  ['Stage B projection', expectedStageBProjectionLines],
  ['Final PASS', expectedFinalPassLines],
]);

const expectedReviewText = [
  '# G008 Batch 7 Release Review',
  '',
  ...[...expectedReviewSections].flatMap(([heading, lines]) => [
    `## ${heading}`,
    '',
    ...lines,
    '',
  ]),
].join('\n');

function normalizeLf(source) {
  return source.replace(/\r\n?/gu, '\n');
}

function assertDeploymentEvidence(source) {
  const normalizedSource = normalizeLf(source);
  assert.equal(
    normalizedSource.match(/^# G008 Batch 7 Release Review$/gmu)?.length,
    1,
    'exact release review title',
  );
  assert.deepEqual(
    [...normalizedSource.matchAll(/^## ([^\n]+)$/gmu)].map((match) => match[1]),
    [...expectedReviewSections.keys()],
    'exact ordered release review H2 sequence',
  );
  for (const [heading, lines] of expectedReviewSections) {
    assert.deepEqual(reviewSectionLines(normalizedSource, heading), lines);
  }
  for (const lines of expectedReviewSections.values()) {
    for (const line of lines) {
      assert.equal(normalizedSource.split(line).length - 1, 1, `one review literal: ${line}`);
    }
  }
  assert.doesNotMatch(
    normalizedSource,
    /ACTUAL_|STAGE_A_SHA|RUN_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u,
  );
  assert.equal(
    normalizedSource,
    expectedReviewText,
    'release review must contain only the exact title and six approved sections',
  );
}

function currentReleaseBaseline(source) {
  const baselines = source
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(baselines.length, 1, 'backlog must contain one current release baseline');
  return baselines[0];
}

function currentG009Batch6Prefix(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G009 Batch 5 历史完成基线为：';
  const end = baseline.indexOf(marker);
  assert.notEqual(end, -1, 'G009 Batch 5 history boundary');
  return baseline.slice(0, end);
}

function mutateCurrentG009Batch6Prefix(source, replacement) {
  const prefix = currentG009Batch6Prefix(source);
  const mutatedPrefix = prefix.replace('下一项为 STY-06', replacement);
  assert.notEqual(mutatedPrefix, prefix, 'current next-topic mutation must change prefix');
  return source.replace(prefix, mutatedPrefix);
}

function batch7Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 7 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 7 history boundary');
  const end = baseline.indexOf('此前 G008 Batch 6 历史完成基线为：', start);
  assert.notEqual(end, -1, 'Batch 6 history boundary');
  return `- **当前发布基线：** ${baseline.slice(start + marker.length, end)}`;
}

function batch6AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 6 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 6 history boundary');
  return baseline.slice(start + marker.length);
}

const expectedBatch7Evidence = [
  '2026-08-03 G008 Batch 7 已完成 MOD-09',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  '9/9 个 canonical HTTP route 检查通过',
  'desktop `1440x1000`、mobile `390x844`',
  '1/1 Mermaid region/SVG',
  '2/2 张表格（8 行 Big Picture、5 行 boundary）',
  '10/10 次 source 激活',
  '16/16 次 relation 激活',
  'MOD-10 target 为 0',
  'MOD-11 actionable article link 为 0',
  '0 warnings、0 errors、0 page errors',
  `Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  'Stage A 为 47 个已完成主题、90 篇内容文档与 481 个受治理来源',
  '仓库测试 `615/615`',
  'Stage B closure 投影为 48 个已完成主题、90 篇内容文档与 481 个受治理来源',
  '持久故事进度仍为 `7 / 20`',
  'G008 仍在进行中',
  '下一项为 MOD-10',
  'Stage B closure — PASS',
];

const expectedBatch7Segment = `- **当前发布基线：** 2026-08-03 G008 Batch 7 已完成 MOD-09，Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})，Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId}) 以 exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\` 完成部署；9/9 个 canonical HTTP route 检查通过，desktop \`1440x1000\`、mobile \`390x844\`，1/1 Mermaid region/SVG、2/2 张表格（8 行 Big Picture、5 行 boundary），10/10 次 source 激活、16/16 次 relation 激活，MOD-10 target 为 0，MOD-11 actionable article link 为 0，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\`。Stage A 为 47 个已完成主题、90 篇内容文档与 481 个受治理来源，仓库测试 \`615/615\`；Stage B closure 投影为 48 个已完成主题、90 篇内容文档与 481 个受治理来源，持久故事进度仍为 \`7 / 20\`，G008 仍在进行中，下一项为 MOD-10。Stage B closure — PASS。`;

function assertBacklogClosure(source) {
  const segment = batch7Segment(source);
  assert.doesNotMatch(
    segment,
    /ACTUAL_|STAGE_A_SHA|RUN_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u,
  );
  assert.equal(
    segment,
    expectedBatch7Segment,
    'Batch 7 current release segment must equal the exact approved measured text',
  );
  for (const literal of expectedBatch7Evidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one Batch 7 ${literal}`);
  }
  assert.equal(
    createHash('sha256').update(batch6AndOlderHistory(source)).digest('hex'),
    expectedBatch6AndOlderSha256,
    'Batch 6 and older baseline text must remain byte-for-byte unchanged',
  );
  for (const id of ['08', '09', '10', '11']) {
    assert.match(source, new RegExp(`^- \\[x\\] \\*\\*MOD-${id} `, 'mu'));
  }
  assert.match(source, /^- \[x\] \*\*MOD-12 /mu);
  assert.match(source, /^- \[x\] \*\*MOD-13 /mu);
  assert.match(source, /^- \[x\] \*\*STY-00 /mu);
  assert.match(source, /当前持久故事：\*\* `G009`/u);
  assert.match(source, /最近完成 `G008`/u);
  assert.equal(
    currentG009Batch6Prefix(source).split('下一项为 STY-06').length - 1,
    1,
    'G009 Batch 6 current prefix must identify STY-06 as next',
  );
}

function assertGeneratedState(manifestValue, statusValue) {
  const topicsById = new Map(manifestValue.topics.map((topic) => [topic.id, topic]));
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
  assert.deepEqual(statusValue, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 84,
    content_documents: 126,
    governed_sources: 599,


    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
}

test('records exact successful G008 Batch 7 deployment evidence', () => {
  assertDeploymentEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${expectedStageASha}^{commit}`], {stdio: 'pipe'}),
  );
});

test('rejects missing duplicate symbolic or weakened review evidence', () => {
  assert.doesNotThrow(() => assertDeploymentEvidence(review));
  for (const lines of expectedReviewSections.values()) {
    for (const literal of lines) {
      assert.throws(() => assertDeploymentEvidence(review.replace(literal, '__REMOVED__')));
      assert.throws(() => assertDeploymentEvidence(`${review}\n${literal}\n`));
    }
  }
  for (const symbolic of [
    'ACTUAL_SHA',
    'STAGE_A_SHA',
    'RUN_ID',
    'TEST_COUNT',
    'ARTIFACT_SHA',
    '<authoritative value>',
  ]) {
    assert.throws(() => assertDeploymentEvidence(review.replace(expectedStageASha, symbolic)));
  }
});

test('rejects reordered extra or contradictory review content', () => {
  const verificationBlock = [
    '## Verification',
    '',
    ...expectedVerificationLines,
  ].join('\n');
  const independentReviewBlock = [
    '## Independent review',
    '',
    ...expectedIndependentReviewLines,
  ].join('\n');
  const reordered = review.replace(
    `${verificationBlock}\n\n${independentReviewBlock}`,
    `${independentReviewBlock}\n\n${verificationBlock}`,
  );
  assert.notEqual(reordered, review, 'review section reorder mutant must apply');
  for (const mutation of [
    reordered,
    `${review}\n## Unexpected evidence\n\n- unapproved: PASS\n`,
    `${review}\nContradictory conclusion: Stage B closure — FAIL\n`,
  ]) {
    assert.throws(() => assertDeploymentEvidence(mutation));
  }
});

test('preserves Batch 7 evidence while accepting the live Batch 10 projection', () => {
  assertBacklogClosure(backlog);
  assertGeneratedState(manifest, projectStatus);
});

test('rejects backlog evidence status and next-topic mutations', () => {
  assert.doesNotThrow(() => assertBacklogClosure(backlog));
  const segment = batch7Segment(backlog);
  const storedSegment = segment.slice('- **当前发布基线：** '.length);
  for (const literal of expectedBatch7Evidence) {
    assert.throws(() => assertBacklogClosure(
      backlog.replace(storedSegment, storedSegment.replace(literal, '__REMOVED__')),
    ));
    assert.throws(() => assertBacklogClosure(
      backlog.replace(storedSegment, `${storedSegment}${literal}`),
    ));
  }
  for (const mutation of [
    backlog.replace('- [x] **MOD-08 ', '- [ ] **MOD-08 '),
    backlog.replace('- [x] **MOD-09 ', '- [ ] **MOD-09 '),
    backlog.replace('- [x] **MOD-10 ', '- [ ] **MOD-10 '),
    backlog.replace('- [x] **MOD-11 ', '- [ ] **MOD-11 '),
    backlog.replace('- **当前持久故事：** `G009`。', '- **当前持久故事：** `G008`。'),
    mutateCurrentG009Batch6Prefix(backlog, '下一项为 STY-01'),
    backlog.replace('- [x] **STY-00 ', '- [ ] **STY-00 '),
  ]) {
    assert.notEqual(mutation, backlog, 'backlog mutation must change source');
    assert.throws(() => assertBacklogClosure(mutation));
  }
});

test('rejects symbolic or contradictory Batch 7 current-segment content', () => {
  const segment = batch7Segment(backlog);
  const storedSegment = segment.slice('- **当前发布基线：** '.length);
  for (const mutation of [
    backlog.replace(storedSegment, storedSegment.replace(expectedStageASha, 'STAGE_A_SHA')),
    backlog.replace(
      storedSegment,
      `${storedSegment}Contradictory projection: 47 / 90 / 481; Stage B closure — FAIL。`,
    ),
  ]) {
    assert.throws(() => assertBacklogClosure(mutation));
  }
});

test('locks Batch 6 and all older release evidence byte-for-byte', () => {
  const original = batch6AndOlderHistory(backlog);
  assert.throws(() => assertBacklogClosure(
    backlog.replace(original, original.replace('G008 Batch 6', 'G008 Batch six')),
  ));
});

test('rejects every generated status and count mutation', () => {
  assert.doesNotThrow(() => assertGeneratedState(manifest, projectStatus));
  for (const id of ['MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13']) {
    const mutatedManifest = structuredClone(manifest);
    const topic = mutatedManifest.topics.find((candidate) => candidate.id === id);
    topic.status.value = topic.status.value === 'complete' ? 'pending' : 'complete';
    assert.notDeepEqual(mutatedManifest, manifest, `${id} status mutation must change manifest`);
    assert.throws(() => assertGeneratedState(mutatedManifest, projectStatus));
  }
  const staleSty01 = structuredClone(manifest);
  const sty01 = staleSty01.topics.find((candidate) => candidate.id === 'STY-01');
  sty01.status.value = 'pending';
  assert.notDeepEqual(staleSty01, manifest, 'STY-01 stale-state mutation must change manifest');
  assert.throws(() => assertGeneratedState(staleSty01, projectStatus));
  const staleCompletedTopics = structuredClone(projectStatus);
  staleCompletedTopics.completed_topics = 53;
  assert.equal(staleCompletedTopics.completed_topics, 53);
  assert.notEqual(staleCompletedTopics.completed_topics, projectStatus.completed_topics);
  assert.throws(() => assertGeneratedState(manifest, staleCompletedTopics));
  for (const mutate of [
    (value) => { value.schema_version = 2; },
    (value) => { value.durable_stories.completed = 7; },
    (value) => { value.durable_stories.total = 21; },
    (value) => { value.durable_stories.current = 'G008'; },
    (value) => { value.content_documents = 95; },
    (value) => { value.governed_sources = 502; },
    (value) => { value.sources.completed_topics = 'other'; },
  ]) {
    const mutatedStatus = structuredClone(projectStatus);
    mutate(mutatedStatus);
    assert.notDeepEqual(mutatedStatus, projectStatus, 'project-status mutation must change input');
    assert.throws(() => assertGeneratedState(manifest, mutatedStatus));
  }
});

test('preserves release-review I/O failures', async () => {
  const permissionError = Object.assign(new Error('permission denied'), {code: 'EACCES'});
  await assert.rejects(
    () => readReleaseReview(async () => { throw permissionError; }),
    (error) => error === permissionError,
  );
});
