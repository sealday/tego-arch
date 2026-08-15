import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = 'fb490e4410047c3047d094c49688bfc431527e89';
const expectedPagesRunId = '31126499205';
const expectedBuildJobId = '92698927987';
const expectedDeployJobId = '92699010802';
const expectedRepositoryTestTotal = 824;
const expectedArtifactSha256 =
  'a1d6ec5b1d749f4816e330dff13d908e06c6a26f04ae2feb7eeba1211a805f75';

assert.match(expectedStageASha, /^[0-9a-f]{40}$/u);
for (const value of [expectedPagesRunId, expectedBuildJobId, expectedDeployJobId]) {
  assert.match(value, /^[0-9]+$/u);
}
assert.equal(Number.isInteger(expectedRepositoryTestTotal), true);
assert.match(expectedArtifactSha256, /^[0-9a-f]{64}$/u);

const expectedReviewSections = [
  'Stage A identity',
  'Verification',
  'Independent review',
  'Production smoke',
  'Stage B projection',
  'Final PASS',
];

const reviewSections = new Map([
  ['Stage A identity', [
    `- Exact Stage A SHA: \`${expectedStageASha}\``,
    `- GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `- Pages jobs: build \`${expectedBuildJobId}\`; deploy \`${expectedDeployJobId}\``,
    `- Exact run gate: \`workflow=Verify and deploy Docusaurus to GitHub Pages\`, \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]],
  ['Verification', [
    '- Stage A projection: 52 completed topics / 94 content documents / 498 governed sources',
    `- Repository tests: ${expectedRepositoryTestTotal} / ${expectedRepositoryTestTotal}`,
    '- Content validation: 94 content documents / 498 governed sources',
    '- Local final-head QA: PASS',
  ]],
  ['Independent review', [
    '- Critical findings: 0',
    '- Important findings: 0',
    '- Minor findings: 0',
    '- Architecture judgment: CLEAR',
    '- Production readiness: READY',
  ]],
  ['Production smoke', [
    '- Production URL: `https://sealday.github.io/tego-arch/styles/sty-00`',
    '- canonical pages: 6 / 6',
    '- routes: `/styles/sty-00`, `/styles`, `/principles/pr-01`, `/modeling/mod-02`, `/cases/micro-frontends-single-spa`, `/references`',
    '- page / viewport observations: 12 / 12',
    '- desktop viewport: `1440x1000`',
    '- mobile viewport: `390x844`',
    '- Mermaid: 1 / 1; tables: 2 / 2',
    '- source activations: 10 / 10',
    '- relation activations: 8 / 8',
    '- desktop wrappers: profile `800/1024`, Mermaid `800/800`, matrix `800/1760`',
    '- mobile wrappers: profile `358/1024`, Mermaid `358/672`, matrix `358/1760`',
    '- profile ArrowRight: desktop `0→40`, mobile `0→40`',
    '- matrix ArrowRight: desktop `0→40`, mobile `0→40`',
    '- warnings / errors / page errors: 0 / 0 / 0',
    '- local screenshots: 4 / 4; production screenshots: 4 / 4',
    '- attempt dispositions: `local-initial` superseded by code review; `local-review-remediation` superseded by architecture review; `local-final-head` accepted',
    `- artifact SHA-256: \`${expectedArtifactSha256}\``,
    '- Production smoke — PASS',
  ]],
  ['Stage B projection', [
    '- 53 completed topics',
    '- 94 content documents',
    '- 498 governed sources',
    '- durable stories 8 / 20',
    '- recently completed G008',
    '- current G009',
    '- next STY-01',
    '- STY-00 published / complete',
    '- STY-01 planned / pending',
  ]],
  ['Final PASS', [
    'Stage B closure — PASS',
  ]],
]);

const expectedReviewText = [
  '# G009 Batch 1 Release Review',
  '',
  ...[...reviewSections].flatMap(([heading, lines]) => [`## ${heading}`, '', ...lines, '']),
].join('\n');

const currentBacklogEvidence = [
  '2026-08-06 G009 Batch 1 已完成 STY-00',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  `build job \`${expectedBuildJobId}\`、deploy job \`${expectedDeployJobId}\``,
  '6/6 个 canonical page route',
  '12/12 个 page/viewport observation',
  'desktop `1440x1000`、mobile `390x844`',
  '1/1 Mermaid、2/2 张表格',
  '10/10 次 source 激活、8/8 次 relation 激活',
  'desktop wrappers 为 profile `800/1024`、Mermaid `800/800`、matrix `800/1760`',
  'mobile wrappers 为 profile `358/1024`、Mermaid `358/672`、matrix `358/1760`',
  'profile 与 matrix 的 ArrowRight 在 desktop/mobile 均为 `0→40`',
  '0 warnings、0 errors、0 page errors',
  'local screenshots `4/4`、production screenshots `4/4`',
  '`local-initial` 由 code review superseded、`local-review-remediation` 由 architecture review superseded、`local-final-head` accepted',
  `Task 4 browser artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  `仓库测试 \`${expectedRepositoryTestTotal}/${expectedRepositoryTestTotal}\``,
  'Stage B closure 为 53 个已完成主题、94 篇内容文档与 498 个受治理来源',
  '持久故事进度为 `8 / 20`',
  '最近完成 G008',
  '当前 G009',
  '下一项为 STY-01',
  'STY-00 为 published/complete',
  'STY-01 为 planned/pending',
  'Stage B closure — PASS',
];

const expectedCurrentBaseline = `- **当前发布基线：** ${currentBacklogEvidence.join('，')}。`;

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
  assert.deepEqual(
    [...value.matchAll(/^## ([^\n]+)$/gmu)].map((match) => match[1]),
    expectedReviewSections,
  );
  for (const [heading, lines] of reviewSections) {
    assert.deepEqual(sectionLines(value, heading), lines);
  }
  assert.doesNotMatch(value, /ACTUAL_|STAGE_A_SHA|RUN_ID|JOB_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u);
  assert.equal(value, expectedReviewText);
}

function currentG009Baseline(source) {
  const marker = '此前 G009 Batch 1 历史完成基线为：';
  const nextMarker = '此前 G008 Batch 11 历史完成基线为：';
  const baseline = currentReleaseBaseline(source);
  const start = baseline.indexOf(marker);
  const end = baseline.indexOf(nextMarker);
  assert.notEqual(start, -1, 'G009 Batch 1 history boundary');
  assert.notEqual(end, -1, 'G008 Batch 11 history boundary');
  return `- **当前发布基线：** ${baseline.slice(start + marker.length, end)}`;
}

function assertBacklog(source) {
  const liveBaseline = currentReleaseBaseline(source);
  const liveParts = liveBaseline.split('此前 G009 Batch 7 历史完成基线为：');
  assert.equal(liveParts.length, 2, 'one immutable Batch 7 history boundary');
  const [livePrefix] = liveParts;
  assert.match(livePrefix, /^- \*\*当前发布基线：\*\* 2026-08-14 G009 Batch 8 已完成 STY-07/u);
  assert.match(livePrefix, /Stage B local closure projection 为 60 个已完成主题、102 篇内容文档与 529 个受治理来源/u);
  assert.match(livePrefix, /下一项为 STY-08/u);
  assert.doesNotMatch(livePrefix, /下一项为 STY-07/u);
  assert.equal(liveBaseline.split('此前 G009 Batch 3 历史完成基线为：').length - 1, 1);
  const segment = currentG009Baseline(source);
  assert.equal(segment, expectedCurrentBaseline);
  for (const literal of currentBacklogEvidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one backlog literal: ${literal}`);
  }
  assert.match(source, /^- \[x\] \*\*STY-00 /mu);
  assert.match(source, /^- \[x\] \*\*STY-01 /mu);
  assert.match(source, /^- \[x\] \*\*STY-02 /mu);
  assert.match(source, /^- \[x\] \*\*STY-03 /mu);
  assert.match(source, /^- \[x\] \*\*STY-04 /mu);
  assert.match(source, /^- \*\*当前持久故事：\*\* `G009`。$/mu);
}

test('records an exact non-symbolic G009 Batch 1 review', async () => {
  const review = await readFile(new URL('../docs/reviews/g009-batch1.md', import.meta.url), 'utf8');
  assertReview(review);
});

test('rejects closure mutations accepted by the former weak predicates', async (t) => {
  const [review, backlog] = await Promise.all([
    readFile(new URL('../docs/reviews/g009-batch1.md', import.meta.url), 'utf8'),
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  ]);
  const reviewMutations = [
    ['run conclusion failure', review.replace('`conclusion=success`', '`conclusion=failure`')],
    ['Critical finding', review.replace('Critical findings: 0', 'Critical findings: 1')],
    ['architecture blocked', review.replace('Architecture judgment: CLEAR', 'Architecture judgment: BLOCK')],
    ['production not ready', review.replace('Production readiness: READY', 'Production readiness: NOT READY')],
    ['production smoke failure', review.replace('Production smoke — PASS', 'Production smoke — FAIL')],
    ['Stage B closure failure', review.replace('Stage B closure — PASS', 'Stage B closure — FAIL')],
  ];
  for (const [name, mutation] of reviewMutations) {
    await t.test(`review ${name}`, () => {
      assert.notEqual(mutation, review, `${name} mutation must change review`);
      assert.throws(() => assertReview(mutation), {name: 'AssertionError'});
    });
  }

  const historicalBaseline = currentG009Baseline(backlog);
  const historicalText = historicalBaseline.slice('- **当前发布基线：** '.length);
  const baselineMutations = [
    ['run conclusion failure', historicalBaseline.replace('`conclusion=success`', '`conclusion=failure`')],
    ['route failure', historicalBaseline.replace('6/6 个 canonical page route', '0/6 个 canonical page route')],
    ['Stage B closure failure', historicalBaseline.replace('Stage B closure — PASS', 'Stage B closure — FAIL')],
  ].map(([name, mutation]) => [
    name,
    backlog.replace(
      historicalText,
      mutation.slice('- **当前发布基线：** '.length),
    ),
  ]);
  for (const [name, mutation] of baselineMutations) {
    await t.test(`baseline ${name}`, () => {
      assert.notEqual(mutation, backlog, `${name} mutation must change backlog`);
      assert.throws(() => assertBacklog(mutation), {name: 'AssertionError'});
    });
  }
});

test('preserves the Batch 1 closure under the current STY-07 Stage B projection', async () => {
  const [backlog, manifest, status] = await Promise.all([
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
    readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  assertBacklog(backlog);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  assert.equal(topics.get('STY-00')?.published, true);
  assert.equal(topics.get('STY-00')?.status.value, 'complete');
  assert.equal(topics.get('STY-01')?.published, true);
  assert.equal(topics.get('STY-01')?.status.value, 'complete');
  assert.equal(topics.get('STY-02')?.published, true);
  assert.equal(topics.get('STY-02')?.status.value, 'complete');
  assert.equal(topics.get('STY-03')?.published, true);
  assert.equal(topics.get('STY-03')?.status.value, 'complete');
  assert.equal(topics.get('STY-04')?.published, true);
  assert.equal(topics.get('STY-04')?.status.value, 'complete');
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 60,
    content_documents: 103,
    governed_sources: 535,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
});

const expectedG008AndOlderSha256 =
  'e422815754478aa6514653f75e2b63ca9325e5078c1339d7b85eb5862572f80e';

function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) =>
    line.startsWith('- **当前发布基线：**'),
  );
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0];
}

function g008AndOlderHistory(source) {
  const marker = '此前 G008 Batch 11 历史完成基线为：';
  const baseline = currentReleaseBaseline(source);
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'G008 Batch 11 history boundary');
  return baseline.slice(start + marker.length);
}

test('preserves the complete G008 and older release history', async () => {
  const backlog = await readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8');
  assert.equal(
    createHash('sha256').update(g008AndOlderHistory(backlog)).digest('hex'),
    expectedG008AndOlderSha256,
  );
});
