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

function currentG009Batch6Prefix(source) {
  const baselines = source
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(baselines.length, 1, 'backlog must contain one current release baseline');
  const marker = '此前 G009 Batch 5 历史完成基线为：';
  const end = baselines[0].indexOf(marker);
  assert.notEqual(end, -1, 'G009 Batch 5 history boundary');
  return baselines[0].slice(0, end);
}

function assertCurrentG009Batch6Prefix(source) {
  assert.equal(
    currentG009Batch6Prefix(source).split('下一项为 STY-06').length - 1,
    1,
    'G009 Batch 6 current prefix must identify STY-06 as next',
  );
}

function mutateCurrentG009Batch6Prefix(source, replacement) {
  const prefix = currentG009Batch6Prefix(source);
  const mutatedPrefix = prefix.replace('下一项为 STY-06', replacement);
  assert.notEqual(mutatedPrefix, prefix, 'current next-topic mutation must change prefix');
  return source.replace(prefix, mutatedPrefix);
}

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
  assert.equal(projectStatus.completed_topics, 60);
  assert.equal(projectStatus.content_documents, 103);
  assert.equal(projectStatus.governed_sources, 533);
  assert.deepEqual(projectStatus.durable_stories, {
    completed: 8,
    total: 20,
    current: 'G009',
  });
  assert.match(backlog, /当前持久故事：\*\* `G009`/u);
  assertCurrentG009Batch6Prefix(backlog);
  assert.throws(() => assertCurrentG009Batch6Prefix(
    mutateCurrentG009Batch6Prefix(backlog, '下一项为 STY-03'),
  ));
  assert.match(backlog, /最近完成 `G008`/u);
});
