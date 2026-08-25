import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = '749822ac242a99972b5031e8fef157457a96acbd';
const expectedPagesRunId = '30890802473';
const expectedArtifactSha256 =
  '732c65b2d947983d0428edc0ef444f0f2ad0b91a573eb584f04a7629f86bbfe2';
const expectedBatch7AndOlderSha256 =
  '2bfddd4ff10131b463e16aecce12542a91a41a398b55f67f2f5dc5f443cd630e';
const releaseReviewUrl = new URL('../docs/reviews/g008-batch8.md', import.meta.url);

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
  '- Stage A projection: 48 completed topics / 91 content documents / 485 governed sources',
  '- Repository tests: 639 / 639',
  '- Content validation: 91 content documents / 485 governed sources',
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
  '- HTTP canonical routes: 8 / 8',
  '- Mermaid regions / SVGs: 1 / 1',
  '- tables: 2 / 2; story rows: 6; comparison rows: 4',
  '- source activations: 8 / 8',
  '- relation activations: 14 / 14',
  '- closed-world MOD-11 targets: 0',
  '- warnings / errors / page errors: 0 / 0 / 0',
  `- artifact SHA-256: \`${expectedArtifactSha256}\``,
];

const expectedStageBProjectionLines = [
  '- 49 completed topics',
  '- 91 content documents',
  '- 485 governed sources',
  '- durable stories 7 / 20',
  '- current G008',
  '- next MOD-11',
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
  '# G008 Batch 8 Release Review',
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
    normalizedSource.match(/^# G008 Batch 8 Release Review$/gmu)?.length,
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

function batch8Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const startMarker = '此前 G008 Batch 8 历史完成基线为：';
  const start = baseline.indexOf(startMarker);
  assert.notEqual(start, -1, 'Batch 8 history boundary');
  const end = baseline.indexOf('此前 G008 Batch 7 历史完成基线为：');
  assert.notEqual(end, -1, 'Batch 7 history boundary');
  return baseline.slice(start + startMarker.length, end);
}

function batch7AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 7 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 7 history boundary');
  return baseline.slice(start + marker.length);
}

const expectedBatch8Evidence = [
  '2026-08-04 G008 Batch 8 已完成 MOD-10',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  '8/8 个 canonical HTTP route 检查通过',
  'desktop `1440x1000`、mobile `390x844`',
  '1/1 Mermaid region/SVG',
  '2/2 张表格（6 行 story、4 行 comparison）',
  '8/8 次 source 激活',
  '14/14 次 relation 激活',
  'MOD-11 target 为 0',
  '0 warnings、0 errors、0 page errors',
  `Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  'Stage A 为 48 个已完成主题、91 篇内容文档与 485 个受治理来源',
  '仓库测试 `639/639`',
  'Stage B closure 投影为 49 个已完成主题、91 篇内容文档与 485 个受治理来源',
  '持久故事进度仍为 `7 / 20`',
  'G008 仍在进行中',
  '下一项为 MOD-11',
  'Stage B closure — PASS',
];

const expectedBatch8Segment = `- **当前发布基线：** 2026-08-04 G008 Batch 8 已完成 MOD-10，Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})，Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId}) 以 exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\` 完成部署；8/8 个 canonical HTTP route 检查通过，desktop \`1440x1000\`、mobile \`390x844\`，1/1 Mermaid region/SVG、2/2 张表格（6 行 story、4 行 comparison），8/8 次 source 激活、14/14 次 relation 激活，MOD-11 target 为 0，0 warnings、0 errors、0 page errors。Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\`。Stage A 为 48 个已完成主题、91 篇内容文档与 485 个受治理来源，仓库测试 \`639/639\`；Stage B closure 投影为 49 个已完成主题、91 篇内容文档与 485 个受治理来源，持久故事进度仍为 \`7 / 20\`，G008 仍在进行中，下一项为 MOD-11。Stage B closure — PASS。`;

function assertBacklogClosure(source) {
  const segment = batch8Segment(source);
  assert.doesNotMatch(
    segment,
    /ACTUAL_|STAGE_A_SHA|RUN_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u,
  );
  assert.equal(
    segment,
    expectedBatch8Segment.slice('- **当前发布基线：** '.length),
    'Batch 8 current release segment must equal the exact approved measured text',
  );
  for (const literal of expectedBatch8Evidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one Batch 8 ${literal}`);
  }
  assert.equal(
    createHash('sha256').update(batch7AndOlderHistory(source)).digest('hex'),
    expectedBatch7AndOlderSha256,
    'Batch 7 and older baseline text must remain byte-for-byte unchanged',
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
    completed_topics: 63,
    content_documents: 107,
    governed_sources: 560,

    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
}

test('records exact successful G008 Batch 8 deployment evidence', () => {
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

test('preserves Batch 8 evidence while reflecting the live MOD-11 closure', () => {
  assertBacklogClosure(backlog);
  assertGeneratedState(manifest, projectStatus);
});

test('rejects backlog evidence status and next-topic mutations', () => {
  assert.doesNotThrow(() => assertBacklogClosure(backlog));
  const segment = batch8Segment(backlog);
  for (const literal of expectedBatch8Evidence) {
    assert.throws(() => assertBacklogClosure(
      backlog.replace(segment, segment.replace(literal, '__REMOVED__')),
    ));
    assert.throws(() => assertBacklogClosure(
      backlog.replace(segment, `${segment}${literal}`),
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
    mutateCurrentG009Batch6Prefix(backlog, '下一项为 STY-01'),
    backlog.replace('- [x] **STY-00 ', '- [ ] **STY-00 '),
  ];
  assert.equal(
    backlogStateMutations.length,
    9,
    'six MOD-08..13 checkbox mutations plus STY-00, current-story, and next-topic mutations',
  );
  for (const mutation of backlogStateMutations) {
    assert.notEqual(mutation, backlog, 'backlog mutation must change source');
    assert.throws(() => assertBacklogClosure(mutation));
  }
});

test('rejects symbolic or contradictory Batch 8 current-segment content', () => {
  const segment = batch8Segment(backlog);
  for (const mutation of [
    backlog.replace(segment, segment.replace(expectedStageASha, 'STAGE_A_SHA')),
    backlog.replace(
      segment,
      `${segment}Contradictory projection: 47 / 90 / 481; Stage B closure — FAIL。`,
    ),
  ]) {
    assert.throws(() => assertBacklogClosure(mutation));
  }
});

test('locks Batch 7 and all older release evidence byte-for-byte', () => {
  const original = batch7AndOlderHistory(backlog);
  assert.throws(() => assertBacklogClosure(
    backlog.replace(original, original.replace('G008 Batch 7', 'G008 Batch seven')),
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
  const publishedMutations = ['MOD-10', 'MOD-11', 'MOD-12', 'MOD-13'].map((id) => {
    const mutatedManifest = structuredClone(manifest);
    const topic = mutatedManifest.topics.find((candidate) => candidate.id === id);
    topic.published = !topic.published;
    return mutatedManifest;
  });
  assert.equal(publishedMutations.length, 4, 'every MOD-10..13 published flag has a mutation');
  for (const mutatedManifest of publishedMutations) {
    assert.notDeepEqual(mutatedManifest, manifest, 'published mutation must change manifest');
    assert.throws(() => assertGeneratedState(mutatedManifest, projectStatus));
  }
  for (const id of ['MOD-10', 'MOD-11', 'MOD-12', 'MOD-13']) {
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
    ...sourceMutations,
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
