import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = '21647637a06585f7ba52996f3581dfb3d53b490a';
const expectedPagesRunId = '31152763623';
const expectedBuildJobId = '92785696406';
const expectedDeployJobId = '92785920108';
const expectedRepositoryTestTotal = 886;
const expectedArtifactSha256 =
  '46908af13a1fb66ea4dbebdc5c5c89459160b4b6e28e6cdcfa970fca736b92a9';
const expectedHistoricalSuffixSha256 =
  '56435eb970043b76379680deac0c6600ad0900b8948ce4d051bf4c4a3b99ae45';
const releaseReviewUrl = new URL('../docs/reviews/g009-batch3.md', import.meta.url);

assert.match(expectedStageASha, /^[0-9a-f]{40}$/u);
for (const value of [expectedPagesRunId, expectedBuildJobId, expectedDeployJobId]) {
  assert.match(value, /^[0-9]+$/u);
}
assert.equal(Number.isInteger(expectedRepositoryTestTotal), true);
assert.match(expectedArtifactSha256, /^[0-9a-f]{64}$/u);
assert.match(expectedHistoricalSuffixSha256, /^[0-9a-f]{64}$/u);

const expectedReviewSections = [
  'Stage A identity',
  'Verification',
  'Independent review',
  'Production smoke',
  'Diagram geometry',
  'Stage B projection',
  'Final PASS',
];

const reviewSections = new Map([
  ['Stage A identity', [
    `- Exact Stage A SHA: \`${expectedStageASha}\``,
    `- GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
    `- Pages jobs: build \`${expectedBuildJobId}\`; deploy \`${expectedDeployJobId}\``,
    `- Exact run gate: \`event=push\`, \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
  ]],
  ['Verification', [
    '- Stage A projection: 54 completed topics / 96 content documents / 506 governed sources',
    `- Repository tests: ${expectedRepositoryTestTotal} / ${expectedRepositoryTestTotal}`,
    '- Content validation: 96 content documents / 506 governed sources',
    '- Full validation: PASS',
  ]],
  ['Independent review', [
    '- Critical findings: 0',
    '- Important findings: 0',
    '- Minor findings: 0',
    '- Code review: READY',
    '- Content review: READY',
    '- Architecture judgment: CLEAR',
    '- Architecture readiness: READY',
    '- Narrow remediation exact-head review: READY / CLEAR',
  ]],
  ['Production smoke', [
    '- Production URL: `https://sealday.github.io/tego-arch/styles/sty-02`',
    '- page routes: `/styles/sty-02`, `/styles/sty-01`, `/styles/sty-00`, `/styles`, `/cases/micro-frontends-single-spa`, `/references`',
    '- SVG route: `/img/diagrams/sty-02-hexagonal-onion-clean-order.svg`',
    '- local / production HTTP probes: 14 / 14',
    '- page / viewport observations: 24 / 24',
    '- SVG / viewport observations: 4 / 4',
    '- desktop viewport: `1440x1000`; document geometry: `1440/1440`',
    '- mobile viewport: `390x844`; document geometry: `390/390`',
    '- exact article contract: 2 tables / 1 SVG / 3 focusable wrappers',
    '- desktop wrappers: tables `800/1254` and `800/1279`; diagram `800/800`',
    '- mobile wrappers: tables `358/1254` and `358/1279`; diagram `358/800`',
    '- table ArrowRight interactions: 8 / 8',
    '- diagram keyboard checks: 4 / 4; mobile movement: 2 / 2 (`0→40`); desktop non-overflow no-op: 2 / 2 (`0→0`)',
    '- source activations: 20 / 20',
    '- relation activations: 16 / 16',
    '- total interactions: 48 / 48',
    '- actionable STY-03 targets: 0',
    '- Tego Arch warnings / errors / page errors: 0 / 0 / 0',
    '- accepted screenshots: 4 / 4',
    `- artifact SHA-256: \`${expectedArtifactSha256}\``,
    '- Production smoke — PASS',
  ]],
  ['Diagram geometry', [
    '- Desktop article SVG width: `800px`; rendered scale: `2/3`',
    '- Semantic inventory: 9 nodes / 3 boundaries / 11 directed relations / 8 visible edge labels',
    '- Node clearances: horizontal `19.17px`; top `15.56px`; bottom `13.78px`',
    '- Edge-label clearances: own stroke `11px`; own marker `16.05px`; node `13.33px`; boundary `4px`',
    '- Connector direction, line-style legend, label ownership, boundary containment, and color-independent meaning: PASS',
    '- Diagram geometry — PASS',
  ]],
  ['Stage B projection', [
    '- 55 completed topics',
    '- 96 content documents',
    '- 506 governed sources',
    '- durable stories 8 / 20',
    '- current G009',
    '- next STY-03',
    '- STY-02 published / complete',
    '- STY-03 planned / pending / non-actionable',
  ]],
  ['Final PASS', [
    'Stage B closure — PASS',
  ]],
]);

const expectedReviewText = [
  '# G009 Batch 3 Release Review',
  '',
  ...[...reviewSections].flatMap(([heading, lines]) => [`## ${heading}`, '', ...lines, '']),
].join('\n');

const currentBacklogEvidence = [
  '2026-08-07 G009 Batch 3 已完成 STY-02',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`event=push\`、\`status=completed\`、\`conclusion=success\``,
  `build job \`${expectedBuildJobId}\`、deploy job \`${expectedDeployJobId}\``,
  'local/production HTTP probes `14/14`',
  'page/viewport observations `24/24`、SVG observations `4/4`',
  'desktop `1440x1000`、mobile `390x844`',
  'desktop document geometry `1440/1440`、mobile document geometry `390/390`',
  'desktop wrappers 为 tables `800/1254`、`800/1279` 与 diagram `800/800`',
  'mobile wrappers 为 tables `358/1254`、`358/1279` 与 diagram `358/800`',
  'table ArrowRight `8/8`',
  'diagram keyboard checks `4/4`，其中 mobile movement `2/2`（`0→40`）、desktop non-overflow no-op `2/2`（`0→0`）',
  'source activations `20/20`、relation activations `16/16`',
  'interactions `48/48`',
  'Tego Arch warnings/errors/page errors `0/0/0`',
  'accepted screenshots `4/4`',
  `Task 5 browser artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  'desktop SVG article width `800px`、scale `2/3`',
  'diagram inventory 为 9 nodes、3 boundaries、11 relations、8 visible edge labels',
  'diagram minima 为 node horizontal `19.17px`、top `15.56px`、bottom `13.78px`、edge-to-own-stroke `11px`、edge-to-own-marker `16.05px`、edge-to-node `13.33px`、edge-to-boundary `4px`',
  `仓库测试 \`${expectedRepositoryTestTotal}/${expectedRepositoryTestTotal}\`，full validation PASS`,
  'code/content/architecture review verdicts 为 READY/READY/CLEAR/READY',
  'Critical `0`、Important `0`、Minor `0`，narrow remediation exact-head review READY/CLEAR',
  'Stage B closure 为 55 个已完成主题、96 篇内容文档与 506 个受治理来源',
  '持久故事进度为 `8 / 20`',
  '当前 G009',
  '下一项为 STY-03',
  'STY-02 为 published/complete',
  'STY-03 为 planned/pending',
  'Stage B closure — PASS',
];

const expectedCurrentBaseline = `- **当前发布基线：** ${currentBacklogEvidence.join('，')}。`;
const historyMarker = '此前 G009 Batch 2 历史完成基线为：';

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
  assert.doesNotMatch(value, /4\s*\/\s*4 diagram movement/u);
  assert.equal(value, expectedReviewText);
}

function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) =>
    line.startsWith('- **当前发布基线：**'),
  );
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0];
}

function currentG009Batch3Baseline(source) {
  const baseline = currentReleaseBaseline(source);
  assert.equal(baseline.split(historyMarker).length - 1, 1, 'one G009 Batch 2 history boundary');
  return baseline.slice(0, baseline.indexOf(historyMarker));
}

function g009Batch2AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const start = baseline.indexOf(historyMarker);
  assert.notEqual(start, -1, 'G009 Batch 2 history boundary');
  return baseline.slice(start + historyMarker.length);
}

function assertBacklog(source) {
  const segment = currentG009Batch3Baseline(source);
  assert.equal(segment, expectedCurrentBaseline);
  for (const literal of currentBacklogEvidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one backlog literal: ${literal}`);
  }
  assert.match(source, /^- \[x\] \*\*STY-02 /mu);
  assert.match(source, /^- \[ \] \*\*STY-03 /mu);
  assert.match(source, /^- \*\*当前持久故事：\*\* `G009`。$/mu);
  assert.doesNotMatch(segment, /4\s*\/\s*4 diagram movement/u);
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

test('records an exact non-symbolic G009 Batch 3 review', async () => {
  const review = await readReleaseReview();
  assert.ok(review, 'G009 Batch 3 release review exists');
  assertReview(review);
});

test('rejects review contradictions', async (t) => {
  const review = await readReleaseReview();
  assert.ok(review, 'G009 Batch 3 release review exists');
  const mutations = [
    ['run conclusion failure', review.replace('`conclusion=success`', '`conclusion=failure`')],
    ['Critical finding', review.replace('Critical findings: 0', 'Critical findings: 1')],
    ['Important finding', review.replace('Important findings: 0', 'Important findings: 1')],
    ['architecture blocked', review.replace('Architecture judgment: CLEAR', 'Architecture judgment: BLOCK')],
    ['review not ready', review.replace('Code review: READY', 'Code review: NOT READY')],
    ['HTTP probe failure', review.replace('14 / 14', '13 / 14')],
    ['page viewport failure', review.replace('24 / 24', '23 / 24')],
    ['SVG observation failure', review.replace('4 / 4', '3 / 4')],
    ['interaction failure', review.replace('48 / 48', '47 / 48')],
    ['SVG width regression', review.replace('`800px`', '`799px`')],
    ['diagnostic failure', review.replace('0 / 0 / 0', '1 / 0 / 0')],
    ['repository test failure', review.replace('886 / 886', '885 / 886')],
    ['Stage B count regression', review.replace('55 completed topics', '54 completed topics')],
    ['next topic regression', review.replace('next STY-03', 'next STY-02')],
    ['mobile keyboard movement failure', review.replace('mobile movement: 2 / 2', 'mobile movement: 1 / 2')],
    ['desktop keyboard no-op failure', review.replace('desktop non-overflow no-op: 2 / 2', 'desktop non-overflow no-op: 1 / 2')],
    ['Stage B closure failure', review.replace('Stage B closure — PASS', 'Stage B closure — FAIL')],
  ];
  for (const [name, mutation] of mutations) {
    await t.test(name, () => {
      assert.notEqual(mutation, review, `${name} mutation must change review`);
      assert.throws(() => assertReview(mutation), {name: 'AssertionError'});
    });
  }
});

test('rejects current-baseline contradictions', async (t) => {
  const backlog = await readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8');
  assertBacklog(backlog);
  const mutations = [
    ['run conclusion failure', backlog.replace('`conclusion=success`', '`conclusion=failure`')],
    ['Critical finding', backlog.replace('Critical `0`', 'Critical `1`')],
    ['Important finding', backlog.replace('Important `0`', 'Important `1`')],
    ['architecture blocked', backlog.replace('READY/READY/CLEAR/READY', 'READY/READY/BLOCK/NOT READY')],
    ['HTTP probe failure', backlog.replace('HTTP probes `14/14`', 'HTTP probes `13/14`')],
    ['page viewport failure', backlog.replace('page/viewport observations `24/24`', 'page/viewport observations `23/24`')],
    ['SVG observation failure', backlog.replace('SVG observations `4/4`', 'SVG observations `3/4`')],
    ['interaction failure', backlog.replace('interactions `48/48`', 'interactions `47/48`')],
    ['SVG width regression', backlog.replace('SVG article width `800px`', 'SVG article width `799px`')],
    ['diagnostic failure', backlog.replace('warnings/errors/page errors `0/0/0`', 'warnings/errors/page errors `1/0/0`')],
    ['repository test failure', backlog.replace('仓库测试 `886/886`', '仓库测试 `885/886`')],
    ['Stage B count regression', backlog.replace('Stage B closure 为 55 个已完成主题、96 篇内容文档与 506 个受治理来源', 'Stage B closure 为 54 个已完成主题、96 篇内容文档与 506 个受治理来源')],
    ['next topic regression', backlog.replace('下一项为 STY-03', '下一项为 STY-02')],
    ['mobile keyboard movement failure', backlog.replace('mobile movement `2/2`', 'mobile movement `1/2`')],
    ['desktop keyboard no-op failure', backlog.replace('desktop non-overflow no-op `2/2`', 'desktop non-overflow no-op `1/2`')],
    ['Stage B closure failure', backlog.replace('Stage B closure — PASS', 'Stage B closure — FAIL')],
  ];
  for (const [name, mutation] of mutations) {
    await t.test(name, () => {
      assert.notEqual(mutation, backlog, `${name} mutation must change backlog`);
      assert.throws(() => assertBacklog(mutation), {name: 'AssertionError'});
    });
  }
});

test('preserves STY-02 closure while projecting STY-03 published and pending', async () => {
  const [backlog, manifest, status, sourceLedger, indexes] = await Promise.all([
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
    readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  assert.equal(topics.get('STY-02')?.published, true);
  assert.equal(topics.get('STY-02')?.status.value, 'complete');
  assert.equal(topics.get('STY-03')?.published, true);
  assert.equal(topics.get('STY-03')?.status.value, 'pending');
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 55,
    content_documents: 98,
    governed_sources: 509,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assert.equal(sourceLedger.sources.length, 509);
  assert.ok(indexes.style.some(({id, published, status: topicStatus}) =>
    id === 'STY-02' && published === true && topicStatus.value === 'complete'));
  assert.ok(indexes.style.some(({id, published, status: topicStatus}) =>
    id === 'STY-03' && published === true && topicStatus.value === 'pending'));
  assertBacklog(backlog);
});

test('preserves the complete G009 Batch 2 and older release history byte for byte', async () => {
  const backlog = await readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8');
  assert.equal(
    createHash('sha256').update(g009Batch2AndOlderHistory(backlog)).digest('hex'),
    expectedHistoricalSuffixSha256,
  );
});
