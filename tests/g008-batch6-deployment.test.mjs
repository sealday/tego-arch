import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const expectedStageASha = 'c6f00af333640dca5b65b92c77ed9dea34df4964';
const expectedPagesRunId = '30734305213';
const expectedArtifactSha256 =
  '6888658877c9187cd7f387b4619bce8de9beb6886c33bf25fe6e1e24af0ca51b';
const expectedBatch5AndOlderSha256 =
  'f69e8a00192985508b8aa0d903f433ca8e164353c9dad01e48b138e77b747d41';
const releaseReviewUrl = new URL('../docs/reviews/g008-batch6.md', import.meta.url);

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

const expectedStageAIdentityLines = [
  `- Exact Stage A SHA: \`${expectedStageASha}\``,
  `- GitHub Pages run: [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `- Exact run gate: \`workflow=Verify and deploy Docusaurus to GitHub Pages\`, \`headSha=${expectedStageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
];

const expectedVerificationLines = [
  '- Stage A projection: 46 completed topics / 89 content documents / 476 governed sources',
  '- Repository tests: 595 / 595',
  '- Content validation: 89 content documents / 476 governed sources',
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
  '- Mermaid regions / SVGs: 2 / 2',
  '- seven-row mapping table: 1 / 1',
  '- source activations: 10 / 10',
  '- relation activations: 16 / 16',
  '- closed-world operator actions: 26; MOD-09 targets: 0',
  '- document overflow: 0 at desktop and mobile',
  '- keyboard ArrowRight: diagrams 0 → 0; mapping table 0 → 40 at desktop and mobile',
  '- warnings / errors / page errors: 0 / 0 / 0',
  `- artifact SHA-256: \`${expectedArtifactSha256}\``,
];

const expectedStageBProjectionLines = [
  '- 47 completed topics',
  '- 89 content documents',
  '- 476 governed sources',
  '- durable stories 7 / 20',
  '- current G008',
  '- next MOD-09',
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

function assertDeploymentEvidence(source) {
  assert.equal(
    source.match(/^# G008 Batch 6 Release Review$/gmu)?.length,
    1,
    'exact release review title',
  );
  for (const [heading, lines] of expectedReviewSections) {
    assert.deepEqual(reviewSectionLines(source, heading), lines);
  }
  for (const literal of expectedReviewSections.values()) {
    for (const line of literal) {
      assert.equal(source.split(line).length - 1, 1, `one review literal: ${line}`);
    }
  }
  assert.doesNotMatch(source, /ACTUAL_|STAGE_A_SHA|RUN_ID|<[^>]+>/u);
}

function currentReleaseBaseline(source) {
  const baselines = source
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(baselines.length, 1, 'backlog must contain one current release baseline');
  return baselines[0];
}

function batch6Segment(source) {
  const baseline = currentReleaseBaseline(source);
  const end = baseline.indexOf('此前 G008 Batch 5 历史完成基线为：');
  assert.notEqual(end, -1, 'Batch 5 history boundary');
  return baseline.slice(0, end);
}

function batch5AndOlderHistory(source) {
  const baseline = currentReleaseBaseline(source);
  const marker = '此前 G008 Batch 5 历史完成基线为：';
  const start = baseline.indexOf(marker);
  assert.notEqual(start, -1, 'Batch 5 history boundary');
  return baseline.slice(start + marker.length);
}

const expectedBatch6Evidence = [
  '2026-08-02 G008 Batch 6 已完成 MOD-08',
  `Stage A 发布基线为 [\`${expectedStageASha}\`](https://github.com/sealday/tego-arch/commit/${expectedStageASha})`,
  `Pages run [\`${expectedPagesRunId}\`](https://github.com/sealday/tego-arch/actions/runs/${expectedPagesRunId})`,
  `exact \`headSha=${expectedStageASha}\`、\`status=completed\`、\`conclusion=success\``,
  '8/8 个 canonical HTTP route 检查通过',
  'desktop `1440x1000`、mobile `390x844`',
  'desktop/mobile 均无 document overflow',
  '2/2 Mermaid region/SVG',
  '1/1 七行映射表',
  '10/10 次 source 激活',
  '16/16 次 relation 激活',
  '26 次 closed-world operator action 且 MOD-09 target 为 0',
  'diagram ArrowRight 在 desktop/mobile 均为 0→0',
  'mapping table ArrowRight 在 desktop/mobile 均为 0→40',
  '0 warnings、0 errors、0 page errors',
  `Task 4 raw artifact SHA-256 为 \`${expectedArtifactSha256}\``,
  'Stage A 为 46 个已完成主题、89 篇内容文档与 476 个受治理来源',
  '仓库测试 `595/595`',
  'Stage B closure 投影为 47 个已完成主题、89 篇内容文档与 476 个受治理来源',
  '持久故事进度仍为 `7 / 20`',
  'G008 仍在进行中',
  '下一项为 MOD-09',
  'Stage B closure — PASS',
];

function assertBacklogClosure(source) {
  const segment = batch6Segment(source);
  for (const literal of expectedBatch6Evidence) {
    assert.equal(segment.split(literal).length - 1, 1, `one Batch 6 ${literal}`);
  }
  assert.equal(
    createHash('sha256').update(batch5AndOlderHistory(source)).digest('hex'),
    expectedBatch5AndOlderSha256,
    'Batch 5 and older baseline text must remain byte-for-byte unchanged',
  );
  assert.match(source, /^- \[x\] \*\*MOD-08 /mu);
  for (const id of ['09', '10', '11', '12', '13']) {
    assert.match(source, new RegExp(`^- \\[ \\] \\*\\*MOD-${id} `, 'mu'));
  }
  assert.match(source, /当前持久故事：\*\* `G008`/u);
  assert.doesNotMatch(source, /最近完成 `G008`/u);
}

test('records exact successful G008 Batch 6 deployment evidence', () => {
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
  for (const symbolic of ['ACTUAL_SHA', 'STAGE_A_SHA', 'RUN_ID', '<run-id>']) {
    assert.throws(() => assertDeploymentEvidence(review.replace(expectedStageASha, symbolic)));
  }
});

test('closes only MOD-08 while keeping G008 current and MOD-09 next', () => {
  assertBacklogClosure(backlog);
  const row = backlog.split(/\r?\n/u).find((line) => line.startsWith('- [x] **MOD-08 '));
  assert.ok(row?.includes(expectedStageASha), 'MOD-08 exact Stage A SHA');
  assert.ok(row?.includes(`/actions/runs/${expectedPagesRunId}`), 'MOD-08 exact Pages run');
  assert.equal(topicsById.get('MOD-08')?.status.value, 'complete');
  for (const id of ['MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13']) {
    assert.equal(topicsById.get(id)?.status.value, 'pending', id);
  }
  assert.deepEqual(projectStatus, {
    schema_version: 1,
    durable_stories: {completed: 7, total: 20, current: 'G008'},
    completed_topics: 47,
    content_documents: 90,
    governed_sources: 481,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
});

test('rejects backlog evidence status and next-topic mutations', () => {
  assert.doesNotThrow(() => assertBacklogClosure(backlog));
  const segment = batch6Segment(backlog);
  for (const literal of expectedBatch6Evidence) {
    assert.throws(() => assertBacklogClosure(
      backlog.replace(segment, segment.replace(literal, '__REMOVED__')),
    ));
  }
  for (const mutation of [
    backlog.replace('- [x] **MOD-08 ', '- [ ] **MOD-08 '),
    backlog.replace('- [ ] **MOD-09 ', '- [x] **MOD-09 '),
    backlog.replace('- **当前持久故事：** `G008`。', '- **当前持久故事：** `G009`。'),
    backlog.replace('下一项为 MOD-09', '下一项为 MOD-10'),
  ]) {
    assert.throws(() => assertBacklogClosure(mutation));
  }
});

test('locks Batch 5 and all older release evidence byte-for-byte', () => {
  const original = batch5AndOlderHistory(backlog);
  assert.throws(() => assertBacklogClosure(
    backlog.replace(original, original.replace('G008 Batch 5', 'G008 Batch five')),
  ));
});

test('preserves release-review I/O failures', async () => {
  const permissionError = Object.assign(new Error('permission denied'), {code: 'EACCES'});
  await assert.rejects(
    () => readReleaseReview(async () => { throw permissionError; }),
    (error) => error === permissionError,
  );
});
