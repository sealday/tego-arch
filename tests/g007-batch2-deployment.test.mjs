import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const stageASha = '5f586df19d51a9a29f88ad93c0b3a208ce3651f3';
const pagesRunId = '30339518113';
const pagesRunUrl = `https://github.com/sealday/tego-arch/actions/runs/${pagesRunId}`;
const cssAsset =
  'https://sealday.github.io/tego-arch/assets/css/styles.9684c33a.css';
const jsAsset =
  'https://sealday.github.io/tego-arch/assets/js/runtime~main.87613cf5.js';

const [review, backlog, manifest] = await Promise.all([
  readFile(new URL('../docs/reviews/g007-batch2.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
]);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function assertLiteralDeploymentEvidence(source) {
  assert.ok(
    source.includes(`Exact Stage A SHA: \`${stageASha}\``),
    'review must record the literal Stage A SHA',
  );
  assert.ok(
    source.includes(`GitHub Pages run: [\`${pagesRunId}\`](${pagesRunUrl})`),
    'review must record the literal Pages run ID and URL',
  );
  assert.ok(
    source.includes(
      `Exact run gate: \`headSha=${stageASha}\`, \`status=completed\`, \`conclusion=success\`.`,
    ),
    'review must record the literal exact-SHA run gate',
  );
  assert.ok(
    source.includes('Stage A repository gate — PASS：`446/446` tests passed'),
    'review must preserve the literal Stage A repository gate',
  );
  assert.ok(
    source.includes('Repository test gate: `449/449` tests passed.'),
    'review must record the literal current repository gate',
  );
  for (const [label, literal] of [
    ['production CSS', cssAsset],
    ['production JavaScript', jsAsset],
    ['desktop viewport', 'desktop `1440x1000`'],
    ['mobile viewport', 'mobile `390x844`'],
    ['zero console diagnostics', '0 warnings、0 errors'],
    [
      'click matrix',
      '`16/16 total = 10 adjacent, 2 method, 1 quality-attribute, 3 case`',
    ],
    ['Fowler YAGNI source', 'Fowler YAGNI'],
    ['Pragmatic DRY source', 'Pragmatic DRY'],
    ['AWS Fail Fast source', 'AWS Fail Fast'],
    ['AWS Graceful Degradation source', 'AWS Fail Fast 与 Graceful Degradation'],
    ['Fowler Parallel Change source', 'Fowler Parallel Change'],
    ['Google AIP-180 source', 'Google AIP-180'],
  ]) {
    assert.ok(source.includes(literal), `review must record ${label}`);
  }
  assert.match(source, /Stage B closure — PASS/u);
  assert.match(source, /73 content documents/u);
  assert.match(source, /436 governed sources/u);
}

test('records the exact successful G007 Batch 2 deployment', () => {
  assertLiteralDeploymentEvidence(review);
  assert.doesNotThrow(
    () =>
      execFileSync('git', ['cat-file', '-e', `${stageASha}^{commit}`], {
        cwd: root,
        stdio: 'pipe',
      }),
    'literal Stage A SHA must resolve to a commit object',
  );

  for (const [label, literal, mutation] of [
    ['Stage A SHA', stageASha, '0'.repeat(40)],
    ['Pages run', pagesRunId, '30339518114'],
    [
      'production CSS',
      cssAsset,
      'https://sealday.github.io/tego-arch/assets/css/styles.missing.css',
    ],
    ['click matrix', '16/16 total', '15/16 total'],
  ]) {
    assert.throws(
      () => assertLiteralDeploymentEvidence(review.replaceAll(literal, mutation)),
      {name: 'AssertionError'},
      `${label} mutation must be rejected`,
    );
  }
});

test('closes only PR-06 through PR-08 with the same deployment evidence', () => {
  const publishedBatch3Topics = new Set(['PR-09', 'PR-10', 'PR-11']);
  for (const id of ['06', '07', '08']) {
    const row = backlog
      .split(/\r?\n/u)
      .find((line) => line.startsWith(`- [x] **PR-${id} `));
    assert.ok(row, `PR-${id} must be checked`);
    assert.ok(row.includes(stageASha), `PR-${id} must record the literal Stage A SHA`);
    assert.ok(row.includes(pagesRunUrl), `PR-${id} must record the literal Pages run`);
    assert.ok(
      row.includes(`https://sealday.github.io/tego-arch/principles/pr-${id}`),
      `PR-${id} must record its canonical live route`,
    );
    assert.deepEqual(
      topicsById.get(`PR-${id}`)?.status,
      {
        scope: 'backlog-projection',
        value: 'complete',
        source: 'docs/content-backlog.md',
      },
      `PR-${id} manifest status must be complete`,
    );
  }
  for (let number = 9; number <= 17; number += 1) {
    const id = `PR-${String(number).padStart(2, '0')}`;
    assert.match(backlog, new RegExp(`^- \\[ \\] \\*\\*${id} `, 'mu'), `${id} pending`);
    const topic = topicsById.get(id);
    assert.ok(topic, `${id} must exist in the generated manifest`);
    assert.equal(
      topic.published,
      publishedBatch3Topics.has(id),
      `${id} publication must match current content`,
    );
    assert.deepEqual(
      topic.status,
      {
        scope: 'backlog-projection',
        value: 'pending',
        source: 'docs/content-backlog.md',
      },
      `${id} manifest status must remain pending`,
    );
  }
  assert.match(backlog, /- \*\*当前持久故事：\*\* `G007`。/u);
  assert.match(
    backlog,
    /- \*\*持久故事进度：\*\* 已完成 `6 \/ 20`；最近完成 `G006`。/u,
  );
  assert.ok(
    backlog.includes(
      `当前发布基线：** 2026-07-28 G007 Batch 2 已完成 PR-06..08，发布基线为 [\`${stageASha}\`](https://github.com/sealday/tego-arch/commit/${stageASha})，Pages run [\`${pagesRunId}\`](${pagesRunUrl})`,
    ),
    'current baseline must cross-check the literal Stage A SHA and Pages run',
  );
});
