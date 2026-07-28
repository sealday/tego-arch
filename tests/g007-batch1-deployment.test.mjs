import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [review, backlog] = await Promise.all([
  readFile(new URL('../docs/reviews/g007-batch1.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
]);

const shaMatch = review.match(/Exact Stage A SHA: `([0-9a-f]{40})`/u);
const runMatch = review.match(
  /GitHub Pages run: \[`(\d+)`\]\((https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\d+)\)/u,
);

test('records the exact successful G007 Batch 1 deployment', () => {
  assert.ok(shaMatch, 'review must record an exact 40-character Stage A SHA');
  assert.ok(runMatch, 'review must record the exact GitHub Pages run');
  const [, sha] = shaMatch;
  const [, runId, runUrl] = runMatch;
  assert.equal(runUrl, `https://github.com/sealday/tego-arch/actions/runs/${runId}`);
  assert.match(review, new RegExp(`headSha=${sha}`, 'u'));
  assert.match(review, /status=completed/u);
  assert.match(review, /conclusion=success/u);
  assert.match(review, /Stage B closure — PASS/u);
  assert.match(review, /desktop `1440x1000`/u);
  assert.match(review, /mobile `390x844`/u);
  assert.match(review, /437\/437/u);
  assert.match(review, /431 个来源/u);
});

test('closes only PR-01 through PR-05 with the same deployment evidence', () => {
  const [, sha] = shaMatch;
  const [, runId] = runMatch;
  for (const id of ['01', '02', '03', '04', '05']) {
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
  assert.match(backlog, /^- \[ \] \*\*PR-06 /mu);
  assert.match(backlog, /- \*\*当前持久故事：\*\* `G007`。/u);
  assert.match(
    backlog,
    /- \*\*持久故事进度：\*\* 已完成 `6 \/ 20`；最近完成 `G006`。/u,
  );
  assert.match(
    backlog,
    new RegExp(`当前发布基线：\\*\\*[^\n]*${sha}[^\n]*${runId}`, 'u'),
  );
});
