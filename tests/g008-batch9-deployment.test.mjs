import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = 'ce92d866444769927755b7d87280ddb238d961c9';
const expectedPagesRunId = '30984920687';
const expectedArtifactSha256 =
  '7f3f2be12ebe0551fae1228781f63a9b2d46a76e76bc7cac23057552aa399a89';
const expectedBatch8AndOlderSha256 =
  'f4ea7bfd273e3a430e77625df71e8d482722381d4875061a68d0b52740daeab6';
const releaseReviewUrl = new URL('../docs/reviews/g008-batch9.md', import.meta.url);

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
  '- Stage A projection: 49 completed topics / 92 content documents / 488 governed sources',
  '- Repository tests: 661 / 661',
  '- Content validation: 92 content documents / 488 governed sources',
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
  '- HTTP canonical routes: 10 / 10',
  '- Mermaid regions / SVGs: 1 / 1',
  '- tables: 2 / 2; boundary rows: 3; relationship rows: 4',
  '- source activations: 8 / 8',
  '- relation activations: 24 / 24',
  '- closed-world MOD-12 targets: 0',
  '- warnings / errors / page errors: 0 / 0 / 0',
  `- artifact SHA-256: \`${expectedArtifactSha256}\``,
];

const expectedStageBProjectionLines = [
  '- 50 completed topics',
  '- 92 content documents',
  '- 488 governed sources',
  '- durable stories 7 / 20',
  '- current G008',
  '- next MOD-12',
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
  '# G008 Batch 9 Release Review',
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
    normalizedSource.match(/^# G008 Batch 9 Release Review$/gmu)?.length,
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

function batch9Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 9 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 9 history boundary');
  const end = baseline.indexOf('此前 G008 Batch 8 历史完成基线为：', start);
  assert.notEqual(end, -1, 'Batch 8 history boundary');
  return `- **当前发布基线：** ${baseline.slice(start + marker.length, end)}`;
}

function batch8AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 8 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 8 history boundary');
  return baseline.slice(start + marker.length);
}

const expectedBatch9Evidence = [
  '2026-08-05 G008 Batch 9 已完成 MOD-11',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  '10/10 个 canonical HTTP route 检查通过',
  'desktop `1440x1000`、mobile `390x844`',
  '1/1 Mermaid region/SVG',
  '2/2 张表格（3 行 boundary、4 行 relationship）',
  '8/8 次 source 激活',
  '24/24 次 relation 激活',
  'MOD-12 target 为 0',
  '0 warnings、0 errors、0 page errors',
  `Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  'Stage A 为 49 个已完成主题、92 篇内容文档与 488 个受治理来源',
  '仓库测试 `661/661`',
  'Stage B closure 投影为 50 个已完成主题、92 篇内容文档与 488 个受治理来源',
  '持久故事进度仍为 `7 / 20`',
  'G008 仍在进行中',
  '下一项为 MOD-12',
  'Stage B closure — PASS',
];

const expectedBatch9Segment = `- **当前发布基线：** 2026-08-05 G008 Batch 9 已完成 MOD-11，Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})，Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId}) 以 exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\` 完成部署；10/10 个 canonical HTTP route 检查通过，desktop \`1440x1000\`、mobile \`390x844\`，1/1 Mermaid region/SVG、2/2 张表格（3 行 boundary、4 行 relationship），8/8 次 source 激活、24/24 次 relation 激活，MOD-12 target 为 0，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\`。Stage A 为 49 个已完成主题、92 篇内容文档与 488 个受治理来源，仓库测试 \`661/661\`；Stage B closure 投影为 50 个已完成主题、92 篇内容文档与 488 个受治理来源，持久故事进度仍为 \`7 / 20\`，G008 仍在进行中，下一项为 MOD-12。Stage B closure — PASS。`;

function assertBacklogClosure(source) {
  const segment = batch9Segment(source);
  assert.doesNotMatch(
    segment,
    /ACTUAL_|STAGE_A_SHA|RUN_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u,
  );
  assert.equal(
    segment,
    expectedBatch9Segment,
    'Batch 9 current release segment must equal the exact approved measured text',
  );
  for (const literal of expectedBatch9Evidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one Batch 9 ${literal}`);
  }
  assert.equal(
    createHash('sha256').update(batch8AndOlderHistory(source)).digest('hex'),
    expectedBatch8AndOlderSha256,
    'Batch 8 and older baseline text must remain byte-for-byte unchanged',
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
    currentReleaseBaseline(source).split('下一项为 STY-01').length - 1,
    1,
    'live current segment must identify STY-01 as next',
  );
}

function assertGeneratedState(manifestValue, statusValue) {
  const topicsById = new Map(manifestValue.topics.map((topic) => [topic.id, topic]));
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
  assert.equal(topicsById.get('STY-01')?.status.value, 'pending');
  assert.deepEqual(statusValue, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 53,
    content_documents: 95,
    governed_sources: 502,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
}

test('records exact successful G008 Batch 9 deployment evidence', () => {
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

test('closes only MOD-11 while keeping G008 current and MOD-12 next', () => {
  assertBacklogClosure(backlog);
  assertGeneratedState(manifest, projectStatus);
});

test('rejects backlog evidence status and next-topic mutations', () => {
  assert.doesNotThrow(() => assertBacklogClosure(backlog));
  const segment = batch9Segment(backlog);
  const storedSegment = segment.slice('- **当前发布基线：** '.length);
  for (const literal of expectedBatch9Evidence) {
    assert.throws(() => assertBacklogClosure(
      backlog.replace(storedSegment, storedSegment.replace(literal, '__REMOVED__')),
    ));
    assert.throws(() => assertBacklogClosure(
      backlog.replace(storedSegment, `${storedSegment}${literal}`),
    ));
  }
  const backlogStateMutations = [
    backlog.replace('- [x] **MOD-08 ', '- [ ] **MOD-08 '),
    backlog.replace('- [x] **MOD-09 ', '- [ ] **MOD-09 '),
    backlog.replace('- [x] **MOD-10 ', '- [ ] **MOD-10 '),
    backlog.replace('- [x] **MOD-11 ', '- [ ] **MOD-11 '),
    backlog.replace('- [x] **MOD-12 ', '- [ ] **MOD-12 '),
    backlog.replace('- [x] **MOD-13 ', '- [ ] **MOD-13 '),
    backlog.replace('- **当前持久故事：** `G009`。', '- **当前持久故事：** `G008`。'),
    backlog.replace('下一项为 STY-01', '下一项为 STY-00'),
    backlog.replace('- [x] **STY-00 ', '- [ ] **STY-00 '),
  ];
  assert.equal(
    backlogStateMutations.length,
    9,
    'six MOD-08..13 checkbox mutations plus STY-00, current-story, and next-topic mutations',
  );
  for (const mutation of backlogStateMutations) {
    assert.throws(() => assertBacklogClosure(mutation));
  }
});

test('rejects symbolic or contradictory Batch 9 current-segment content', () => {
  const segment = batch9Segment(backlog);
  const storedSegment = segment.slice('- **当前发布基线：** '.length);
  for (const mutation of [
    backlog.replace(storedSegment, storedSegment.replace(expectedStageASha, 'STAGE_A_SHA')),
    backlog.replace(
      storedSegment,
      `${storedSegment}Contradictory projection: 49 / 92 / 488; Stage B closure — FAIL。`,
    ),
  ]) {
    assert.throws(() => assertBacklogClosure(mutation));
  }
});

test('locks Batch 8 and all older release evidence byte-for-byte', () => {
  const original = batch8AndOlderHistory(backlog);
  assert.throws(() => assertBacklogClosure(
    backlog.replace(original, original.replace('G008 Batch 8', 'G008 Batch eight')),
  ));
});

test('rejects every generated status and count mutation', () => {
  assert.doesNotThrow(() => assertGeneratedState(manifest, projectStatus));
  const sourceMutations = [
    (value) => { value.sources.durable_stories = 'other'; },
    (value) => { value.sources.completed_topics = 'other'; },
    (value) => { value.sources.content_documents = 'other'; },
    (value) => { value.sources.governed_sources = 'other'; },
  ];
  assert.equal(sourceMutations.length, 4, 'every project-status source has a mutation');
  const publishedMutations = ['MOD-11', 'MOD-12', 'MOD-13'].map((id) => {
    const mutatedManifest = structuredClone(manifest);
    const topic = mutatedManifest.topics.find((candidate) => candidate.id === id);
    topic.published = !topic.published;
    return mutatedManifest;
  });
  assert.equal(publishedMutations.length, 3, 'every MOD-11..13 published flag has a mutation');
  for (const mutatedManifest of publishedMutations) {
    assert.throws(() => assertGeneratedState(mutatedManifest, projectStatus));
  }
  for (const id of ['MOD-11', 'MOD-12', 'MOD-13']) {
    const mutatedManifest = structuredClone(manifest);
    const topic = mutatedManifest.topics.find((candidate) => candidate.id === id);
    topic.status.value = topic.status.value === 'complete' ? 'pending' : 'complete';
    assert.throws(() => assertGeneratedState(mutatedManifest, projectStatus));
  }
  for (const mutate of [
    (value) => { value.schema_version = 2; },
    (value) => { value.durable_stories.completed = 7; },
    (value) => { value.durable_stories.total = 21; },
    (value) => { value.durable_stories.current = 'G008'; },
    (value) => { value.completed_topics = 49; },
    (value) => { value.content_documents = 94; },
    (value) => { value.governed_sources = 498; },
    ...sourceMutations,
  ]) {
    const mutatedStatus = structuredClone(projectStatus);
    mutate(mutatedStatus);
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
