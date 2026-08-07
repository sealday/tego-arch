import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [review, backlog, manifest, projectStatus] = await Promise.all([
  readFile(new URL('../docs/reviews/g008-batch1.md', import.meta.url), 'utf8')
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

test('records exact successful G008 Batch 1 deployment evidence', () => {
  const {sha} = parseEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {stdio: 'pipe'}),
  );
  for (const literal of [
    '84 content documents',
    '464 governed sources',
    '39 completed topics',
    'desktop `1440x1000`',
    'mobile `390x844`',
    '0 warnings / 0 errors',
    'no document overflow',
    'keyboard scroll/focus',
    '42 completed topics',
    '7 / 20',
    'current G008',
    'next MOD-04',
    'C4 Model',
    'C4 Model — Diagrams',
    'C4 Model — Notation',
    'C4 Model — Component diagram',
    'C4 Model — Dynamic diagram',
    'C4 Model — Deployment diagram',
    'arc42',
    '申报 API Component 责任边界',
    '费用申报系统 Deployment 教学演练假设拓扑',
    'Stage B closure — PASS',
  ]) {
    assert.ok(review.includes(literal), literal);
  }
});

test('closes exactly MOD-01 through MOD-03 without closing G008', () => {
  const {sha, run} = parseEvidence(review);
  for (const id of ['MOD-01', 'MOD-02', 'MOD-03']) {
    const row = backlog
      .split(/\r?\n/u)
      .find((line) => line.startsWith(`- [x] **${id} `));
    assert.ok(row, `${id} checked`);
    assert.ok(row.includes(sha), `${id} Stage A SHA`);
    assert.ok(
      row.includes(`https://github.com/sealday/tego-arch/actions/runs/${run}`),
      `${id} Pages run`,
    );
    assert.deepEqual(topicsById.get(id)?.status, {
      scope: 'backlog-projection',
      value: 'complete',
      source: 'docs/content-backlog.md',
    });
  }
  assert.equal(projectStatus.completed_topics, 52);
  assert.equal(projectStatus.content_documents, 95);
  assert.equal(projectStatus.governed_sources, 494);
  assert.deepEqual(projectStatus.durable_stories, {
    completed: 8,
    total: 20,
    current: 'G009',
  });
  assert.match(backlog, /当前持久故事：\*\* `G009`/u);
  assert.match(backlog, /下一项[^。\n]*MOD-04/u);
  assert.match(backlog, /最近完成 `G008`/u);
});
