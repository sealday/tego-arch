import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = '66111544b489c083a315e84561a01cd8dac00373';
const expectedPagesRunId = '31001453418';
const expectedRepositoryTestTotal = 688;
const expectedArtifactSha256 =
  '35fbdf9aa818e955b3c8c4dd3f6c5eb4830892e3ce358c8fd270e8f92b7bcb72';
const expectedRemediationSha = '4e06d24eac7b82dc4ddd0fe25a5e07186aa0e574';
const expectedRemediationPagesRunId = '31070354568';
const expectedRemediationBuildJobId = '92516850799';
const expectedRemediationDeployJobId = '92517013250';
const expectedRemediationTestTotal = 706;
const expectedRemediationQaSha256 =
  'f32cd5fefaf46c15c38948ad298d8247ee782ddad33b99eba8722c1eed3c9fdb';
const expectedBatch9AndOlderSha256 =
  '2fc5c3532293652f59bedd85eabdc3435be5277221af062998d49f7155eab5c5';
const reviewUrl = new URL('../docs/reviews/g008-batch10.md', import.meta.url);

assert.match(expectedStageASha, /^[0-9a-f]{40}$/u);
assert.match(expectedPagesRunId, /^[0-9]+$/u);
assert.equal(Number.isInteger(expectedRepositoryTestTotal), true);
assert.match(expectedArtifactSha256, /^[0-9a-f]{64}$/u);
assert.match(expectedRemediationSha, /^[0-9a-f]{40}$/u);
assert.match(expectedRemediationPagesRunId, /^[0-9]+$/u);
assert.match(expectedRemediationBuildJobId, /^[0-9]+$/u);
assert.match(expectedRemediationDeployJobId, /^[0-9]+$/u);
assert.equal(Number.isInteger(expectedRemediationTestTotal), true);
assert.match(expectedRemediationQaSha256, /^[0-9a-f]{64}$/u);
assert.match(expectedBatch9AndOlderSha256, /^[0-9a-f]{64}$/u);

async function readReview(read = readFile) {
  try {
    return await read(reviewUrl, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT' && read === readFile) return '';
    throw error;
  }
}

const [review, backlog, manifest, projectStatus] = await Promise.all([
  readReview(),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const expectedReviewSections = [
  'Stage A identity',
  'Verification',
  'Independent review',
  'Production smoke',
  'Stage B projection',
  'Final PASS',
];

const expectedRoutes = [
  '/',
  '/modeling',
  '/modeling/mod-01',
  '/modeling/mod-02',
  '/modeling/mod-03',
  '/modeling/mod-04',
  '/modeling/mod-11',
  '/modeling/mod-12',
  '/quality-attributes/qa-02',
  '/quality-attributes/qa-05',
  '/cases/microsoft-multi-agent-reference-architecture',
  '/references',
  '/references/primary',
];

const expectedAssets = [
  '/img/diagrams/mod-12-architecture-review-problem.svg',
  '/img/diagrams/mod-12-architecture-review-corrected.svg',
];

const expectedProjection = {
  completed_topics: 53,
  content_documents: 94,
  governed_sources: 498,
  durable_stories: {completed: 8, total: 20},
  current_goal: 'G009',
  next_topic: 'STY-01',
};

const reviewSections = new Map([
  ['Stage A identity', [
    `- Exact Stage A SHA: \`${expectedStageASha}\``,
    `- GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `- Exact run gate: \`workflow=Verify and deploy Docusaurus to GitHub Pages\`, \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]],
  ['Verification', [
    '- Stage A projection: 50 completed topics / 93 content documents / 490 governed sources',
    `- Repository tests: ${expectedRepositoryTestTotal} / ${expectedRepositoryTestTotal}`,
    '- Content validation: 93 content documents / 490 governed sources',
  ]],
  ['Independent review', [
    '- Critical findings: 0',
    '- Important findings: 0',
    '- Minor findings: 0',
    '- Architecture judgment: CLEAR',
  ]],
  ['Production smoke', [
    '- Task 5 production QA — PASS',
    '- desktop `1440x1000`',
    '- mobile `390x844`',
    '- HTTP page routes: 13 / 13',
    `- routes: ${expectedRoutes.map((route) => `\`${route}\``).join(', ')}`,
    '- SVG assets: 2 / 2',
    `- assets: ${expectedAssets.map((asset) => `\`${asset}\``).join(', ')}`,
    '- Draw.io / SVG pairs: 2 / 2',
    '- tables: 2 / 2; review rows: 9; findings rows: 9',
    '- source activations: 8 / 8',
    '- relation activations: 24 / 24',
    '- closed-world MOD-13 targets: 0',
    '- warnings / errors / page errors: 0 / 0 / 0',
    `- artifact SHA-256: \`${expectedArtifactSha256}\``,
  ]],
  ['Stage B projection', [
    '- 51 completed topics',
    '- 93 content documents',
    '- 490 governed sources',
    '- durable stories 7 / 20',
    '- current G008',
    '- next MOD-13',
  ]],
  ['Final PASS', [
    'Stage B closure — PASS',
    `- R1 remediation SHA: \`${expectedRemediationSha}\``,
    `- R1 GitHub Pages run: [\`${expectedRemediationPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedRemediationPagesRunId})`,
    `- R1 Pages jobs: build \`${expectedRemediationBuildJobId}\`; deploy \`${expectedRemediationDeployJobId}\``,
    `- R1 repository tests: ${expectedRemediationTestTotal} / ${expectedRemediationTestTotal}`,
    `- R1 browser QA artifact SHA-256: \`${expectedRemediationQaSha256}\``,
    '- R1 browser QA totals: 13 / 13 canonical page routes; 2 / 2 SVG assets; 26 / 26 page/viewport observations; 4 / 4 asset/viewport observations; 8 / 8 source activations; 24 / 24 relation activations; 0 MOD-13 targets; 0 / 0 / 0 warnings / errors / page errors',
    '- R1 semantic verdict: trust/failure findings close only the erroneous representation while evidence remains unknown; protocol remains 待澄清; the problem failure-domain claim is visibly unverified; the corrected diagram legend is complete and scoped',
    'Post-review remediation — PASS',
  ]],
]);

const expectedReviewText = [
  '# G008 Batch 10 Release Review',
  '',
  ...[...reviewSections].flatMap(([heading, lines]) => [`## ${heading}`, '', ...lines, '']),
].join('\n');

function normalized(source) {
  return source.replace(/\r\n?/gu, '\n');
}

function sectionLines(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const matches = headings.filter((match) => match[1] === heading);
  assert.equal(matches.length, 1, `one ${heading} section`);
  const match = matches[0];
  const next = headings.find((candidate) => candidate.index > match.index);
  return source.slice(match.index + match[0].length, next?.index ?? source.length)
    .trim().split(/\r?\n/u).filter(Boolean);
}

function assertReview(source) {
  const value = normalized(source);
  assert.equal(value.match(/^# G008 Batch 10 Release Review$/gmu)?.length, 1);
  assert.deepEqual(
    [...value.matchAll(/^## ([^\n]+)$/gmu)].map((match) => match[1]),
    expectedReviewSections,
  );
  for (const [heading, lines] of reviewSections) {
    assert.deepEqual(sectionLines(value, heading), lines);
    for (const line of lines) {
      assert.equal(value.split(line).length - 1, 1, `one review literal: ${line}`);
    }
  }
  assert.doesNotMatch(value, /ACTUAL_|STAGE_A_SHA|RUN_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u);
  assert.equal(value, expectedReviewText);
}

function currentBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0];
}

function batch10Segment(source) {
  const baseline = currentBaseline(source);
  const marker = '此前 G008 Batch 10 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 10 history boundary');
  const end = baseline.indexOf('此前 G008 Batch 9 历史完成基线为：');
  assert.notEqual(end, -1, 'Batch 9 history boundary');
  return baseline.slice(start + marker.length, end);
}

function batch9AndOlderHistory(source) {
  const baseline = currentBaseline(source);
  const marker = '此前 G008 Batch 9 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 9 history boundary');
  return baseline.slice(start + marker.length);
}

const backlogEvidence = [
  '2026-08-06 G008 Batch 10 MOD-12 复审修复已完成',
  `R1 修复提交为 [\`${expectedRemediationSha}\`](https://github.com/sealday/tego-arch/commit/${expectedRemediationSha})`,
  `R1 Pages run [\`${expectedRemediationPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedRemediationPagesRunId})`,
  `exact \`headSha=${expectedRemediationSha}\`、\`status=completed\`、\`conclusion=success\``,
  `build job \`${expectedRemediationBuildJobId}\`、deploy job \`${expectedRemediationDeployJobId}\``,
  '13/13 个 canonical HTTP page route 与 2/2 个 SVG asset 检查通过',
  'desktop `1440x1000`、mobile `390x844`',
  '26/26 个 page/viewport 与 4/4 个 asset/viewport observation',
  '2/2 Draw.io/SVG pairs',
  '2/2 张表格（9 行 review、9 行 findings）',
  '8/8 次 source 激活',
  '24/24 次 relation 激活',
  'MOD-13 target 为 0',
  '0 warnings、0 errors、0 page errors',
  `原 Task 5 artifact SHA-256 仍为 \`${expectedArtifactSha256}\``,
  `R1 browser QA artifact SHA-256 为 \`${expectedRemediationQaSha256}\``,
  'Stage A 仍为 50 个已完成主题、93 篇内容文档与 490 个受治理来源',
  `R1 仓库测试 \`${expectedRemediationTestTotal}/${expectedRemediationTestTotal}\``,
  'Stage B closure 投影仍为 51 个已完成主题、93 篇内容文档与 490 个受治理来源',
  '持久故事进度仍为 `7 / 20`',
  'G008 仍在进行中',
  '下一项为 MOD-13',
  'Stage B closure — PASS',
  'Post-review remediation — PASS',
];

const expectedBatch10Segment = `- **当前发布基线：** 2026-08-06 G008 Batch 10 MOD-12 复审修复已完成，R1 修复提交为 [\`${expectedRemediationSha}\`](https://github.com/sealday/tego-arch/commit/${expectedRemediationSha})，R1 Pages run [\`${expectedRemediationPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedRemediationPagesRunId}) 以 exact \`headSha=${expectedRemediationSha}\`、\`status=completed\`、\`conclusion=success\` 完成部署，build job \`${expectedRemediationBuildJobId}\`、deploy job \`${expectedRemediationDeployJobId}\`；13/13 个 canonical HTTP page route 与 2/2 个 SVG asset 检查通过，desktop \`1440x1000\`、mobile \`390x844\`，26/26 个 page/viewport 与 4/4 个 asset/viewport observation，2/2 Draw.io/SVG pairs、2/2 张表格（9 行 review、9 行 findings），8/8 次 source 激活、24/24 次 relation 激活，MOD-13 target 为 0，0 warnings、0 errors、0 page errors。原 Task 5 artifact SHA-256 仍为 \`${expectedArtifactSha256}\`，R1 browser QA artifact SHA-256 为 \`${expectedRemediationQaSha256}\`。Stage A 仍为 50 个已完成主题、93 篇内容文档与 490 个受治理来源，R1 仓库测试 \`${expectedRemediationTestTotal}/${expectedRemediationTestTotal}\`；Stage B closure 投影仍为 51 个已完成主题、93 篇内容文档与 490 个受治理来源，持久故事进度仍为 \`7 / 20\`，G008 仍在进行中，下一项为 MOD-13。Stage B closure — PASS。Post-review remediation — PASS。`;

function assertBacklog(source) {
  const segment = batch10Segment(source);
  assert.equal(`- **当前发布基线：** ${segment}`, expectedBatch10Segment);
  assert.doesNotMatch(segment, /ACTUAL_|STAGE_A_SHA|RUN_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u);
  for (const literal of backlogEvidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one backlog literal: ${literal}`);
  }
  assert.equal(
    createHash('sha256').update(batch9AndOlderHistory(source)).digest('hex'),
    expectedBatch9AndOlderSha256,
    'Batch 9 and older baseline text remains byte-for-byte unchanged',
  );
  for (const id of ['08', '09', '10', '11', '12']) {
    assert.match(source, new RegExp(`^- \\[x\\] \\*\\*MOD-${id} `, 'mu'));
  }
  assert.match(source, /^- \[x\] \*\*MOD-13 /mu);
  assert.match(source, /^- \[x\] \*\*STY-00 /mu);
  assert.match(source, /当前持久故事：\*\* `G009`/u);
  assert.match(source, /最近完成 `G008`/u);
  assert.equal(currentBaseline(source).split('下一项为 STY-01').length - 1, 1);
}

function assertGeneratedState(manifestValue, statusValue) {
  const topics = new Map(manifestValue.topics.map((topic) => [topic.id, topic]));
  assert.equal(topics.get('MOD-12')?.published, true);
  assert.equal(topics.get('MOD-12')?.status.value, 'complete');
  assert.equal(topics.get('MOD-13')?.published, true);
  assert.equal(topics.get('MOD-13')?.status.value, 'complete');
  assert.equal(topics.get('STY-00')?.published, true);
  assert.equal(topics.get('STY-00')?.status.value, 'complete');
  assert.deepEqual(statusValue, {
    schema_version: 1,
    durable_stories: {...expectedProjection.durable_stories, current: expectedProjection.current_goal},
    completed_topics: expectedProjection.completed_topics,
    content_documents: expectedProjection.content_documents,
    governed_sources: expectedProjection.governed_sources,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
}

test('records exact successful G008 Batch 10 deployment evidence', () => {
  assertReview(review);
  assert.doesNotThrow(() => execFileSync('git', ['cat-file', '-e', `${expectedStageASha}^{commit}`], {stdio: 'pipe'}));
  assert.doesNotThrow(() => execFileSync('git', ['cat-file', '-e', `${expectedRemediationSha}^{commit}`], {stdio: 'pipe'}));
});

test('rejects every missing duplicate symbolic or weakened review literal', () => {
  assertReview(review);
  for (const lines of reviewSections.values()) {
    for (const literal of lines) {
      assert.throws(() => assertReview(review.replace(literal, '__REMOVED__')));
      assert.throws(() => assertReview(`${review}\n${literal}\n`));
    }
  }
  for (const symbolic of ['ACTUAL_SHA', 'STAGE_A_SHA', 'RUN_ID', 'TEST_COUNT', 'ARTIFACT_SHA', '<value>']) {
    assert.throws(() => assertReview(review.replace(expectedStageASha, symbolic)));
  }
});

test('rejects reordered extra or contradictory review content', () => {
  const reordered = review.replace('## Verification', '## TEMP')
    .replace('## Independent review', '## Verification')
    .replace('## TEMP', '## Independent review');
  for (const mutation of [reordered, `${review}\n## Extra\n`, `${review}\nStage B closure — FAIL\n`]) {
    assert.throws(() => assertReview(mutation));
  }
});

test('closes only MOD-12 and projects MOD-13 next', () => {
  assertBacklog(backlog);
  assertGeneratedState(manifest, projectStatus);
});

test('rejects every backlog evidence status and projection mutation', () => {
  const segment = batch10Segment(backlog);
  for (const literal of backlogEvidence) {
    assert.throws(() => assertBacklog(backlog.replace(segment, segment.replace(literal, '__REMOVED__'))));
    assert.throws(() => assertBacklog(backlog.replace(segment, `${segment}${literal}`)));
  }
  for (const mutation of [
    backlog.replace('- [x] **MOD-12 ', '- [ ] **MOD-12 '),
    backlog.replace('- [x] **MOD-13 ', '- [ ] **MOD-13 '),
    backlog.replace('- **当前持久故事：** `G009`。', '- **当前持久故事：** `G008`。'),
    backlog.replace('下一项为 STY-01', '下一项为 STY-00'),
    backlog.replace('- [x] **STY-00 ', '- [ ] **STY-00 '),
  ]) assert.throws(() => assertBacklog(mutation));
});

test('locks Batch 9 and all older release evidence byte-for-byte', () => {
  const history = batch9AndOlderHistory(backlog);
  assert.throws(() => assertBacklog(backlog.replace(history, history.replace('G008 Batch 9', 'G008 Batch nine'))));
});

test('rejects every generated Stage B state mutation', () => {
  assertGeneratedState(manifest, projectStatus);
  for (const id of ['MOD-12', 'MOD-13']) {
    for (const field of ['published', 'status']) {
      const mutated = structuredClone(manifest);
      const topic = mutated.topics.find((candidate) => candidate.id === id);
      if (field === 'published') topic.published = !topic.published;
      else topic.status.value = topic.status.value === 'complete' ? 'pending' : 'complete';
      assert.throws(() => assertGeneratedState(mutated, projectStatus));
    }
  }
  for (const mutate of [
    (value) => { value.schema_version = 2; },
    (value) => { value.durable_stories.completed = 7; },
    (value) => { value.durable_stories.total = 21; },
    (value) => { value.durable_stories.current = 'G008'; },
    (value) => { value.completed_topics = 50; },
    (value) => { value.content_documents = 92; },
    (value) => { value.governed_sources = 489; },
    (value) => { value.sources.completed_topics = 'other'; },
  ]) {
    const mutated = structuredClone(projectStatus);
    mutate(mutated);
    assert.throws(() => assertGeneratedState(manifest, mutated));
  }
});

test('preserves release-review I/O failures', async () => {
  const error = Object.assign(new Error('permission denied'), {code: 'EACCES'});
  await assert.rejects(() => readReview(async () => { throw error; }), (actual) => actual === error);
});
