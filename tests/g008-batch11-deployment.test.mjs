import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = 'd9283368f9b25b4491d9edb8c57d26478b2aa686';
const expectedPagesRunId = '31089738016';
const expectedBuildJobId = '92577587037';
const expectedDeployJobId = '92577837296';
const expectedRepositoryTestTotal = 758;
const expectedArtifactSha256 =
  '6b2853a49569d8580c33c63f06f3be501a0b37b7a3535533e436bc387671dedf';
const expectedBatch10AndOlderSha256 =
  'e6d5387ea694c4759bc46282660ca9c85379d2617dd556d45d260e34a193927e';
const reviewUrl = new URL('../docs/reviews/g008-batch11.md', import.meta.url);

for (const value of [expectedStageASha]) assert.match(value, /^[0-9a-f]{40}$/u);
for (const value of [expectedPagesRunId, expectedBuildJobId, expectedDeployJobId]) {
  assert.match(value, /^[0-9]+$/u);
}
assert.equal(Number.isInteger(expectedRepositoryTestTotal), true);
for (const value of [expectedArtifactSha256, expectedBatch10AndOlderSha256]) {
  assert.match(value, /^[0-9a-f]{64}$/u);
}

async function readReview(read = readFile) {
  try {
    return await read(reviewUrl, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT' && read === readFile) return '';
    throw error;
  }
}

const [review, backlog, manifest, projectStatus, plan] = await Promise.all([
  readReview(),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(
    new URL('../docs/superpowers/plans/2026-08-06-g008-batch11-model-sync-strategy.md', import.meta.url),
    'utf8',
  ),
]);

const expectedReviewSections = [
  'Stage A identity',
  'Verification',
  'Independent review',
  'Production smoke',
  'Stage B projection',
  'Final PASS',
];

const expectedProjection = {
  completed_topics: 52,
  content_documents: 95,
  governed_sources: 494,
  durable_stories: {completed: 8, total: 20, current: 'G009'},
  recently_completed: 'G008',
  next_topic: 'STY-00',
};

const expectedRoutes = [
  '/modeling/mod-13',
  '/modeling/mod-04',
  '/modeling/mod-12',
  '/methods/mth-03',
  '/methods/mth-06',
  '/cases/kubernetes-reconciliation-loop',
  '/modeling',
  '/references',
];

const expectedAsset = '/img/diagrams/mod-13-authority-drift-loop.svg';

const reviewSections = new Map([
  ['Stage A identity', [
    `- Exact Stage A SHA: \`${expectedStageASha}\``,
    `- GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `- Pages jobs: build \`${expectedBuildJobId}\`; deploy \`${expectedDeployJobId}\``,
    `- Exact run gate: \`workflow=Verify and deploy Docusaurus to GitHub Pages\`, \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]],
  ['Verification', [
    '- Stage A projection: 51 completed topics / 94 content documents / 494 governed sources',
    `- Repository tests: ${expectedRepositoryTestTotal} / ${expectedRepositoryTestTotal}`,
    '- Content validation: 94 content documents / 494 governed sources',
    '- Draw.io / SVG pairs: 1 / 1',
  ]],
  ['Independent review', [
    '- Critical findings: 0',
    '- Important findings: 0',
    '- Minor findings: 0',
    '- Architecture judgment: CLEAR',
    '- Production readiness: READY',
  ]],
  ['Production smoke', [
    '- Task 5 production QA — PASS',
    '- canonical pages: 8 / 8',
    `- routes: ${expectedRoutes.map((route) => `\`${route}\``).join(', ')}`,
    '- page / viewport observations: 16 / 16',
    '- desktop viewport: `1440x1000`',
    '- mobile viewport: `390x844`',
    '- SVG assets: 1 / 1',
    `- asset: \`${expectedAsset}\`; HTTP 200; \`image/svg+xml\``,
    '- loaded-image captures: 2 / 2; screenshot files: 4 / 4',
    '- diagram geometry: rendered width `800px`; scale `2/3`; nodes `12/12`; edge labels `12/12`',
    '- mobile geometry: document `390 == 390`; wrappers `3/3` overflow and focus; ArrowRight `0→40`',
    '- tables: 2 / 2; rows: 8 + 4',
    '- source activations: 8 / 8',
    '- relation activations: 20 / 20',
    '- Batch11 accepted source / relation / operator actions targeting STY-00: 0 / 0 / 0',
    '- existing production STY-00 links: 3 desktop + 3 mobile',
    '- warnings / errors / page errors: 0 / 0 / 0',
    '- attempts: 182 total; 46 failed; 15 superseded; 121 passed; 61 discarded traceable',
    `- artifact SHA-256: \`${expectedArtifactSha256}\``,
  ]],
  ['Stage B projection', [
    '- 52 completed topics',
    '- 94 content documents',
    '- 494 governed sources',
    '- durable stories 8 / 20',
    '- recently completed G008',
    '- current G009',
    '- next STY-00',
    '- MOD-13 published / complete',
    '- STY-00 published / pending / planned',
  ]],
  ['Final PASS', [
    'Stage B closure — PASS',
  ]],
]);

const expectedReviewText = [
  '# G008 Batch 11 Release Review',
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
  assert.equal(value.match(/^# G008 Batch 11 Release Review$/gmu)?.length, 1);
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
  assert.doesNotMatch(value, /ACTUAL_|STAGE_A_SHA|RUN_ID|JOB_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u);
  assert.equal(value, expectedReviewText);
}

function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0];
}

function batch11Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const end = baseline.indexOf('此前 G008 Batch 10 历史完成基线为：');
  assert.notEqual(end, -1, 'Batch 10 history boundary');
  return baseline.slice(0, end);
}

function batch10AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 10 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 10 history boundary');
  return baseline.slice(start + marker.length);
}

const backlogEvidence = [
  '2026-08-06 G008 Batch 11 已完成 MOD-13 并关闭 G008',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  `build job \`${expectedBuildJobId}\`、deploy job \`${expectedDeployJobId}\``,
  '8/8 个 canonical page route 与 1/1 个 SVG asset',
  '16/16 个 page/viewport observation',
  'desktop `1440x1000`、mobile `390x844`',
  '2/2 个 loaded-image capture 与 4/4 个 screenshot file',
  '2/2 张表格（8 + 4 行）',
  '8/8 次 source 激活、20/20 次 relation 激活',
  'Batch11 accepted source/relation/operator action 的 STY-00 target 为 `0/0/0`',
  '既有生产 STY-00 链接为每个视口 3 个',
  '0 warnings、0 errors、0 page errors',
  '182 次尝试中 46 failed、15 superseded、121 passed，61 次 discarded attempt 均可追踪',
  `Task 5 artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  `仓库测试 \`${expectedRepositoryTestTotal}/${expectedRepositoryTestTotal}\``,
  'Stage B closure 为 52 个已完成主题、94 篇内容文档与 494 个受治理来源',
  '持久故事进度为 `8 / 20`',
  '最近完成 G008，当前 G009，下一项为 STY-00',
  'MOD-13 为 published/complete',
  'STY-00 已有 published 内容且 backlog 保持 pending/planned',
  'Stage B closure — PASS',
];

const expectedBatch11Segment = `- **当前发布基线：** ${backlogEvidence.join('，')}。`;

function assertBacklog(source) {
  const segment = batch11Segment(source);
  assert.equal(segment, expectedBatch11Segment);
  assert.doesNotMatch(segment, /ACTUAL_|STAGE_A_SHA|RUN_ID|JOB_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u);
  for (const literal of backlogEvidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one backlog literal: ${literal}`);
  }
  assert.equal(
    createHash('sha256').update(batch10AndOlderHistory(source)).digest('hex'),
    expectedBatch10AndOlderSha256,
    'Batch 10 and older baseline text remains byte-for-byte unchanged',
  );
  assert.match(source, /^- \[x\] \*\*MOD-13 /mu);
  assert.match(source, /^- \[ \] \*\*STY-00 /mu);
  assert.match(source, /^- \*\*持久故事进度：\*\* 已完成 `8 \/ 20`；最近完成 `G008`。$/mu);
  assert.match(source, /^- \*\*当前持久故事：\*\* `G009`。$/mu);
  assert.equal(segment.split('下一项为 STY-00').length - 1, 1);
}

function assertGeneratedState(manifestValue, statusValue) {
  const topics = new Map(manifestValue.topics.map((topic) => [topic.id, topic]));
  assert.equal(topics.get('MOD-13')?.slug, '/modeling/mod-13');
  assert.equal(topics.get('MOD-13')?.published, true);
  assert.equal(topics.get('MOD-13')?.status.value, 'complete');
  assert.equal(topics.get('STY-00')?.slug, '/styles/sty-00');
  assert.equal(topics.get('STY-00')?.published, true);
  assert.equal(topics.get('STY-00')?.status.value, 'pending');
  assert.deepEqual(statusValue, {
    schema_version: 1,
    durable_stories: expectedProjection.durable_stories,
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

function assertPlanCorrection(source) {
  assert.match(source, /Require MOD-13 published\/complete, STY-00 published\/pending, and the exact Stage B projection\./u);
  assert.match(source, /zero \*\*Batch11 accepted source\/relation\/operator actions\*\* targeting STY-00/u);
  assert.doesNotMatch(source, /STY-00 unpublished\/pending/u);
  assert.doesNotMatch(source, /zero actionable `\/styles\/sty-00` targets/u);
}

test('records exact successful G008 Batch 11 Stage A deployment evidence', () => {
  assertReview(review);
  assert.doesNotThrow(() => execFileSync('git', ['cat-file', '-e', `${expectedStageASha}^{commit}`], {stdio: 'pipe'}));
});

test('rejects every missing duplicate symbolic or weakened review literal', () => {
  assertReview(review);
  for (const lines of reviewSections.values()) {
    for (const literal of lines) {
      assert.throws(() => assertReview(review.replace(literal, '__REMOVED__')));
      assert.throws(() => assertReview(`${review}\n${literal}\n`));
    }
  }
  for (const symbolic of ['ACTUAL_SHA', 'STAGE_A_SHA', 'RUN_ID', 'JOB_ID', 'TEST_COUNT', 'ARTIFACT_SHA', '<value>']) {
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

test('closes only MOD-13 and G008 while projecting G009 and STY-00 next', () => {
  assertBacklog(backlog);
  assertGeneratedState(manifest, projectStatus);
});

test('rejects every backlog evidence identity count state and history mutation', () => {
  const segment = batch11Segment(backlog);
  for (const literal of backlogEvidence) {
    assert.throws(() => assertBacklog(backlog.replace(segment, segment.replace(literal, '__REMOVED__'))));
    assert.throws(() => assertBacklog(backlog.replace(segment, `${segment}${literal}`)));
  }
  for (const mutation of [
    backlog.replace('- [x] **MOD-13 ', '- [ ] **MOD-13 '),
    backlog.replace('- [ ] **STY-00 ', '- [x] **STY-00 '),
    backlog.replace('- **当前持久故事：** `G009`。', '- **当前持久故事：** `G008`。'),
    backlog.replace('下一项为 STY-00', '下一项为 STY-01'),
  ]) assert.throws(() => assertBacklog(mutation));
  const history = batch10AndOlderHistory(backlog);
  assert.throws(() => assertBacklog(backlog.replace(history, history.replace('G008 Batch 10', 'G008 Batch ten'))));
});

test('rejects every generated Stage B state route and count mutation', () => {
  assertGeneratedState(manifest, projectStatus);
  for (const [id, field, value] of [
    ['MOD-13', 'slug', '/modeling/mod-14'],
    ['MOD-13', 'published', false],
    ['MOD-13', 'status', 'pending'],
    ['STY-00', 'slug', '/styles/sty-01'],
    ['STY-00', 'published', false],
    ['STY-00', 'status', 'complete'],
  ]) {
    const mutated = structuredClone(manifest);
    const topic = mutated.topics.find((candidate) => candidate.id === id);
    if (field === 'status') topic.status.value = value;
    else topic[field] = value;
    assert.throws(() => assertGeneratedState(mutated, projectStatus));
  }
  for (const mutate of [
    (value) => { value.schema_version = 2; },
    (value) => { value.durable_stories.completed = 7; },
    (value) => { value.durable_stories.total = 21; },
    (value) => { value.durable_stories.current = 'G008'; },
    (value) => { value.completed_topics = 51; },
    (value) => { value.content_documents = 93; },
    (value) => { value.governed_sources = 493; },
    (value) => { value.sources.completed_topics = 'other'; },
  ]) {
    const mutated = structuredClone(projectStatus);
    mutate(mutated);
    assert.throws(() => assertGeneratedState(manifest, mutated));
  }
});

test('locks the actual STY-00 published-content versus pending-backlog distinction', () => {
  assertPlanCorrection(plan);
  for (const mutation of [
    plan.replace('STY-00 published/pending', 'STY-00 unpublished/pending'),
    plan.replace('zero **Batch11 accepted source/relation/operator actions** targeting STY-00', 'zero actionable `/styles/sty-00` targets'),
  ]) assert.throws(() => assertPlanCorrection(mutation));
});

test('preserves release-review I/O failures', async () => {
  const error = Object.assign(new Error('permission denied'), {code: 'EACCES'});
  await assert.rejects(() => readReview(async () => { throw error; }), (actual) => actual === error);
});
