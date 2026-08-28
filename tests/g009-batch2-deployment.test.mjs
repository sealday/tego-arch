import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = '124d6ae24d073286787b15387c25163df3cd3f39';
const expectedPagesRunId = '31129131129';
const expectedBuildJobId = '92713285167';
const expectedDeployJobId = '92713365859';
const expectedRepositoryTestTotal = 847;
const expectedArtifactSha256 =
  'ed3e0e69e3c4c63cc174c80b2e13da4f762becaf4429ab0449d082135a0c9531';
const releaseReviewUrl = new URL('../docs/reviews/g009-batch2.md', import.meta.url);

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
    `- Exact run gate: \`event=workflow_dispatch\`, \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]],
  ['Verification', [
    '- Stage A projection: 53 completed topics / 95 content documents / 502 governed sources',
    `- Repository tests: ${expectedRepositoryTestTotal} / ${expectedRepositoryTestTotal}`,
    '- Content validation: 95 content documents / 502 governed sources',
    '- Exact-head verification: PASS',
  ]],
  ['Independent review', [
    '- Critical findings: 0',
    '- Important findings: 0',
    '- Code review: READY',
    '- Content review: READY',
    '- Architecture judgment: CLEAR',
    '- Architecture readiness: READY',
  ]],
  ['Production smoke', [
    '- Production URL: `https://sealday.github.io/tego-arch/styles/sty-01`',
    '- routes: `/styles/sty-01`, `/styles/sty-00`, `/styles`, `/cases/micro-frontends-single-spa`, `/references`',
    '- local / production HTTP probes: 10 / 10',
    '- route / viewport observations: 20 / 20',
    '- desktop viewport: `1440x1000`',
    '- mobile viewport: `390x844`',
    '- desktop document geometry: `1440/1440`; mobile document geometry: `390/390`',
    '- desktop wrappers: responsibility `800/1187`, Mermaid `800/800`, exception `800/2075`',
    '- mobile wrappers: responsibility `358/1187`, Mermaid `358/672`, exception `358/2075`',
    '- table ArrowRight interactions: 8 / 8',
    '- source activations: 16 / 16',
    '- reciprocal / case activations: 12 / 12',
    '- total interactions: 36 / 36',
    '- Tego Arch warnings / errors / page errors: 0 / 0 / 0',
    '- accepted screenshots: 4 / 4',
    `- artifact SHA-256: \`${expectedArtifactSha256}\``,
    '- Production smoke — PASS',
  ]],
  ['Stage B projection', [
    '- 54 completed topics',
    '- 95 content documents',
    '- 502 governed sources',
    '- durable stories 8 / 20',
    '- recently completed G008',
    '- current G009',
    '- next STY-02',
    '- STY-01 published / complete',
    '- STY-02 planned / pending',
  ]],
  ['Final PASS', [
    'Stage B closure — PASS',
  ]],
]);

const expectedReviewText = [
  '# G009 Batch 2 Release Review',
  '',
  ...[...reviewSections].flatMap(([heading, lines]) => [`## ${heading}`, '', ...lines, '']),
].join('\n');

const currentBacklogEvidence = [
  '2026-08-07 G009 Batch 2 已完成 STY-01',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`event=workflow_dispatch\`、\`status=completed\`、\`conclusion=success\``,
  `build job \`${expectedBuildJobId}\`、deploy job \`${expectedDeployJobId}\``,
  'local/production HTTP probes `10/10`',
  'route/viewport observations `20/20`',
  'desktop `1440x1000`、mobile `390x844`',
  'desktop document geometry `1440/1440`、mobile document geometry `390/390`',
  'desktop wrappers 为 responsibility `800/1187`、Mermaid `800/800`、exception `800/2075`',
  'mobile wrappers 为 responsibility `358/1187`、Mermaid `358/672`、exception `358/2075`',
  'table ArrowRight `8/8`',
  'source activations `16/16`、reciprocal/case activations `12/12`',
  'interactions `36/36`',
  'Tego Arch warnings/errors/page errors `0/0/0`',
  'accepted screenshots `4/4`',
  `Task 4 browser artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  `仓库测试 \`${expectedRepositoryTestTotal}/${expectedRepositoryTestTotal}\``,
  'code/content/architecture review verdicts 为 READY/READY/CLEAR',
  'Critical `0`、Important `0`',
  'Stage B closure 为 54 个已完成主题、95 篇内容文档与 502 个受治理来源',
  '持久故事进度为 `8 / 20`',
  '最近完成 G008',
  '当前 G009',
  '下一项为 STY-02',
  'STY-01 为 published/complete',
  'STY-02 为 planned/pending',
  'Stage B closure — PASS',
];

const expectedCurrentBaseline = `- **当前发布基线：** ${currentBacklogEvidence.join('，')}。`;
const batch2HistoryMarker = '此前 G009 Batch 2 历史完成基线为：';
const historyMarker = '此前 G009 Batch 1 历史完成基线为：';
const expectedG009Batch1AndOlderSha256 =
  'c0bbc4af5cbbbe68fb3a61a5fceb30c172a4c132b01931cf55a8cb2ec02489c1';

function normalized(source) {
  return source.replace(/\r\n?/gu, '\n');
}

async function readReleaseReview(read = readFile) {
  try {
    return await read(releaseReviewUrl, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
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

function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) =>
    line.startsWith('- **当前发布基线：**'),
  );
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0];
}

function g009Batch11HistoricalBaseline(source) {
  const parts = currentReleaseBaseline(source).split('此前 G009 Batch 11 历史完成基线为：');
  assert.equal(parts.length, 2, 'one exact G009 Batch 11 history marker');
  return `- **当前发布基线：** ${parts[1]}`;
}

function currentG009Batch2Baseline(source) {
  const baseline = currentReleaseBaseline(source);
  const start = baseline.indexOf(batch2HistoryMarker);
  const end = baseline.indexOf(historyMarker);
  assert.notEqual(start, -1, 'G009 Batch 2 history boundary');
  assert.notEqual(end, -1, 'G009 Batch 1 history boundary');
  return `- **当前发布基线：** ${baseline.slice(start + batch2HistoryMarker.length, end)}`;
}

function mutateG009Batch2History(source, from, to) {
  const historicalBaseline = currentG009Batch2Baseline(source);
  const historicalText = historicalBaseline.slice('- **当前发布基线：** '.length);
  const mutation = historicalText.replace(from, to);
  assert.notEqual(mutation, historicalText, `historical mutation must replace: ${from}`);
  return source.replace(historicalText, mutation);
}

function g009Batch1AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const start = baseline.indexOf(historyMarker);
  assert.notEqual(start, -1, 'G009 Batch 1 history boundary');
  return baseline.slice(start + historyMarker.length);
}

function assertBacklog(source) {
  const liveBaseline = g009Batch11HistoricalBaseline(source);
  const liveParts = liveBaseline.split('此前 G009 Batch 10 历史完成基线为：');
  assert.equal(liveParts.length, 2, 'split live Batch 11 prefix from immutable Batch 10 history');
  const [livePrefix] = liveParts;
  assert.match(livePrefix, /^- \*\*当前发布基线：\*\* 2026-08-20 G009 Batch 11 已完成 STY-10/u);
  assert.match(livePrefix, /Stage B local closure projection 为 63 个已完成主题、106 篇内容文档与 550 个受治理来源/u);
  assert.match(livePrefix, /下一项为 STY-11/u);
  assert.doesNotMatch(livePrefix, /下一项为 STY-10/u);
  assert.equal(liveBaseline.split('此前 G009 Batch 3 历史完成基线为：').length - 1, 1);
  const segment = currentG009Batch2Baseline(source);
  assert.equal(segment, expectedCurrentBaseline);
  for (const literal of currentBacklogEvidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one backlog literal: ${literal}`);
  }
  assert.match(source, /^- \[x\] \*\*STY-01 /mu);
  assert.match(source, /^- \[x\] \*\*STY-02 /mu);
  assert.match(source, /^- \[x\] \*\*STY-03 /mu);
  assert.match(source, /^- \[x\] \*\*STY-04 /mu);
  assert.match(source, /^- \*\*当前持久故事：\*\* `G009`。$/mu);
}

test('treats ENOENT as missing and preserves other release-review I/O failures', async () => {
  const missingError = Object.assign(new Error('not found'), {code: 'ENOENT'});
  const permissionError = Object.assign(new Error('permission denied'), {code: 'EACCES'});
  assert.equal(
    await readReleaseReview(async () => { throw missingError; }),
    null,
  );
  await assert.rejects(
    () => readReleaseReview(async () => { throw permissionError; }),
    (error) => error === permissionError,
  );
});

test('records an exact non-symbolic G009 Batch 2 review', async () => {
  const review = await readReleaseReview();
  assert.ok(review, 'G009 Batch 2 release review exists');
  assertReview(review);
});

test('rejects review and historical-baseline contradictions', async (t) => {
  const [review, backlog] = await Promise.all([
    readReleaseReview(),
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  ]);
  assert.ok(review, 'G009 Batch 2 release review exists');
  const reviewMutations = [
    ['run conclusion failure', review.replace('`conclusion=success`', '`conclusion=failure`')],
    ['Critical finding', review.replace('Critical findings: 0', 'Critical findings: 1')],
    ['Important finding', review.replace('Important findings: 0', 'Important findings: 1')],
    ['architecture blocked', review.replace('Architecture judgment: CLEAR', 'Architecture judgment: BLOCK')],
    ['review not ready', review.replace('Code review: READY', 'Code review: NOT READY')],
    ['production smoke failure', review.replace('Production smoke — PASS', 'Production smoke — FAIL')],
    ['Stage B closure failure', review.replace('Stage B closure — PASS', 'Stage B closure — FAIL')],
  ];
  for (const [name, mutation] of reviewMutations) {
    await t.test(`review ${name}`, () => {
      assert.notEqual(mutation, review, `${name} mutation must change review`);
      assert.throws(() => assertReview(mutation), {name: 'AssertionError'});
    });
  }

  const baselineMutations = [
    ['run conclusion failure', mutateG009Batch2History(backlog, '`conclusion=success`', '`conclusion=failure`')],
    ['route observation failure', mutateG009Batch2History(backlog, 'route/viewport observations `20/20`', 'route/viewport observations `19/20`')],
    ['interaction failure', mutateG009Batch2History(backlog, 'interactions `36/36`', 'interactions `35/36`')],
    ['repository test failure', mutateG009Batch2History(backlog, '仓库测试 `847/847`', '仓库测试 `846/847`')],
    ['Stage B count regression', mutateG009Batch2History(backlog, 'Stage B closure 为 54 个已完成主题、95 篇内容文档与 502 个受治理来源', 'Stage B closure 为 53 个已完成主题、95 篇内容文档与 502 个受治理来源')],
    ['next topic regression', mutateG009Batch2History(backlog, '下一项为 STY-02', '下一项为 STY-01')],
    ['Stage B closure failure', mutateG009Batch2History(backlog, 'Stage B closure — PASS', 'Stage B closure — FAIL')],
  ];
  for (const [name, mutation] of baselineMutations) {
    await t.test(`baseline ${name}`, () => {
      assert.notEqual(mutation, backlog, `${name} mutation must change backlog`);
      assert.throws(() => assertBacklog(mutation), {name: 'AssertionError'});
    });
  }
});

test('preserves the STY-01 closure under the current STY-10 next-topic projection', async () => {
  const [backlog, manifest, status, sourceLedger] = await Promise.all([
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
    readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  assertBacklog(backlog);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
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
    completed_topics: 65,
    content_documents: 109,
    governed_sources: 573,

    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assert.equal(sourceLedger.sources.length, 573);

});

test('preserves the complete G009 Batch 1 and older release history', async () => {
  const backlog = await readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8');
  assert.equal(
    createHash('sha256').update(g009Batch1AndOlderHistory(backlog)).digest('hex'),
    expectedG009Batch1AndOlderSha256,
  );
});
