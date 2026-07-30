import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [review, backlog, manifest, projectStatus] = await Promise.all([
  readFile(new URL('../docs/reviews/g008-batch2.md', import.meta.url), 'utf8')
    .catch(() => ''),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8')
    .then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8')
    .then(JSON.parse),
]);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function parseEvidence(source) {
  const sha = source.match(/^Exact Stage A SHA: `([0-9a-f]{40})`$/mu)?.[1];
  const run = source.match(
    /^GitHub Pages run: \[`([0-9]+)`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\1\)$/mu,
  )?.[1];
  const gate = source.match(
    /^Exact run gate: `headSha=([0-9a-f]{40})`, `status=completed`, `conclusion=success`\.$/mu,
  )?.[1];
  assert.ok(sha, 'review must contain one exact Stage A SHA');
  assert.ok(run, 'review must contain one exact Pages run');
  assert.equal(gate, sha, 'run gate must use the Stage A SHA');
  return {sha, run};
}

test('records exact successful G008 Batch 2 deployment evidence', () => {
  const {sha} = parseEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {stdio: 'pipe'}),
  );
  for (const literal of [
    '85 content documents',
    '468 governed sources',
    '42 completed topics',
    'desktop `1440x1000`',
    'mobile `390x844`',
    'Mermaid: 1 / 1',
    'mapping table: 1 / 1',
    'source labels: 7 / 7',
    '0 warnings / 0 errors',
    'no document overflow',
    'keyboard scroll/focus',
    '43 completed topics',
    '7 / 20',
    'current G008',
    'next MOD-05',
    'Stage B closure — PASS',
  ]) {
    assert.ok(review.includes(literal), literal);
  }
});

test('closes exactly MOD-04 without closing G008', () => {
  const {sha, run} = parseEvidence(review);
  const row = backlog
    .split(/\r?\n/u)
    .find((line) => line.startsWith('- [x] **MOD-04 '));
  assert.ok(row, 'MOD-04 checked');
  assert.ok(row.includes(sha), 'MOD-04 Stage A SHA');
  assert.ok(
    row.includes(`https://github.com/sealday/tego-arch/actions/runs/${run}`),
    'MOD-04 Pages run',
  );
  assert.deepEqual(topicsById.get('MOD-04')?.status, {
    scope: 'backlog-projection',
    value: 'complete',
    source: 'docs/content-backlog.md',
  });
  for (const id of ['MOD-05', 'MOD-06', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13']) {
    assert.equal(topicsById.get(id)?.status.value, 'pending', id);
  }
  assert.equal(projectStatus.completed_topics, 43);
  assert.equal(projectStatus.content_documents, 85);
  assert.equal(projectStatus.governed_sources, 468);
  assert.deepEqual(projectStatus.durable_stories, {
    completed: 7,
    total: 20,
    current: 'G008',
  });
  assert.match(backlog, /当前持久故事：\*\* `G008`/u);
  assert.match(backlog, /下一项[^。\n]*MOD-05/u);
  assert.doesNotMatch(backlog, /最近完成 `G008`/u);
});
