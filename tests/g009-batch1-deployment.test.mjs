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

test('records an exact non-symbolic G009 Batch 1 review', async () => {
  const review = await readFile(new URL('../docs/reviews/g009-batch1.md', import.meta.url), 'utf8');
  assert.ok(review.includes(`Exact Stage A SHA: \`${expectedStageASha}\``));
  assert.match(review, new RegExp(`/actions/runs/${expectedPagesRunId}`, 'u'));
  assert.ok(review.includes(`build \`${expectedBuildJobId}\`; deploy \`${expectedDeployJobId}\``));
  assert.match(
    review,
    new RegExp(`Repository tests: ${expectedRepositoryTestTotal} / ${expectedRepositoryTestTotal}`, 'u'),
  );
  assert.ok(review.includes(`artifact SHA-256: \`${expectedArtifactSha256}\``));
  assert.doesNotMatch(review, /ACTUAL_|STAGE_A_SHA|RUN_ID|JOB_ID|TEST_COUNT|ARTIFACT_SHA|<[^>]+>/u);
  for (const heading of [
    'Stage A identity',
    'Verification',
    'Independent review',
    'Production smoke',
    'Stage B projection',
    'Final PASS',
  ]) {
    assert.equal((review.match(new RegExp(`^## ${heading}$`, 'gmu')) ?? []).length, 1);
  }
});

test('closes only STY-00 and projects G009 to STY-01', async () => {
  const [backlog, manifest, status] = await Promise.all([
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
    readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  assert.match(backlog, /^- \[x\] \*\*STY-00 /mu);
  assert.match(backlog, /^- \[ \] \*\*STY-01 /mu);
  assert.match(backlog, /^- \*\*当前持久故事：\*\* `G009`。$/mu);
  const topic = manifest.topics.find(({id}) => id === 'STY-00');
  assert.equal(topic.published, true);
  assert.equal(topic.status.value, 'complete');
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 53,
    content_documents: 94,
    governed_sources: 498,
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
