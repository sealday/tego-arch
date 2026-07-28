import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [review, backlog] = await Promise.all([
  readFile(new URL('../docs/reviews/g007-batch2.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
]);

const shaMatch = review.match(/Exact Stage A SHA: `([0-9a-f]{40})`/u);
const runMatch = review.match(
  /GitHub Pages run: \[`(\d+)`\]\((https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\d+)\)/u,
);
const testGateMatch = review.match(/Repository test gate: `(\d+)\/\1` tests passed\./u);

test('records the exact successful G007 Batch 2 deployment', () => {
  assert.ok(shaMatch, 'review must record an exact 40-character Stage A SHA');
  assert.ok(runMatch, 'review must record the exact GitHub Pages run');
  assert.ok(testGateMatch, 'review must record a self-consistent passing test count');
  const [, sha] = shaMatch;
  const [, runId, runUrl] = runMatch;
  assert.equal(runUrl, `https://github.com/sealday/tego-arch/actions/runs/${runId}`);
  assert.match(review, new RegExp(`headSha=${sha}`, 'u'));
  assert.match(review, /status=completed/u);
  assert.match(review, /conclusion=success/u);
  assert.match(review, /Stage B closure — PASS/u);
  assert.match(review, /desktop `1440x1000`/u);
  assert.match(review, /mobile `390x844`/u);
  assert.match(review, /73 content documents/u);
  assert.match(review, /436 governed sources/u);
});

test('closes only PR-06 through PR-08 with the same deployment evidence', () => {
  const [, sha] = shaMatch;
  const [, runId] = runMatch;
  for (const id of ['06', '07', '08']) {
    const row = backlog
      .split(/\r?\n/u)
      .find((line) => line.startsWith(`- [x] **PR-${id} `));
    assert.ok(row, `PR-${id} must be checked`);
    assert.match(row, new RegExp(sha, 'u'));
    assert.match(row, new RegExp(`actions/runs/${runId}`, 'u'));
    assert.match(
      row,
      new RegExp(`https://sealday\\.github\\.io/tego-arch/principles/pr-${id}`, 'u'),
    );
  }
  assert.match(backlog, /^- \[ \] \*\*PR-09 /mu);
  assert.match(backlog, /- \*\*当前持久故事：\*\* `G007`。/u);
  assert.match(
    backlog,
    /- \*\*持久故事进度：\*\* 已完成 `6 \/ 20`；最近完成 `G006`。/u,
  );
  assert.match(
    backlog,
    new RegExp(`当前发布基线：\\*\\*[^\\n]*${sha}[^\\n]*${runId}`, 'u'),
  );
});
