import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const expectedStageASha = '2169c3a0f09fc9edbe4589ea657d1383eeecf758';
const expectedPagesRunId = '30445404784';
const routes = ['15', '16', '17'];
const repositoryGate = 'Repository test gate: `487/487` tests passed.';
const sourceLabels = [
  'How Do Committees Invent?',
  'Organization Dynamics with Team Topologies',
  'CISA Secure by Design',
  'NIST SP 800-160 Vol. 1 Rev. 1',
  "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services",
  'Strangler Fig',
  '沟通路径、团队边界、系统边界、平台能力与交付反馈之间的循环关系',
  'CAP、Strangler Fig 与 GRASP 的分类边界、主归属及交叉关系',
];

const review = await readFile(
  new URL('../docs/reviews/g007-batch5.md', import.meta.url),
  'utf8',
).catch(() => '');
const backlog = await readFile(
  new URL('../docs/content-backlog.md', import.meta.url),
  'utf8',
);
const manifest = JSON.parse(
  await readFile(
    new URL('../src/generated/topic-manifest.json', import.meta.url),
    'utf8',
  ),
);
const projectStatus = JSON.parse(
  await readFile(
    new URL('../src/generated/project-status.json', import.meta.url),
    'utf8',
  ),
);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));

function parseLiteralEvidence(source) {
  const shaMatches = [...source.matchAll(
    /^Exact Stage A SHA: `([0-9a-f]{40})`$/gmu,
  )];
  const runMatches = [...source.matchAll(
    /^GitHub Pages run: \[`([0-9]+)`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/\1\)$/gmu,
  )];
  const gateMatches = [...source.matchAll(
    /^Exact run gate: `headSha=([0-9a-f]{40})`, `status=completed`, `conclusion=success`\.$/gmu,
  )];

  assert.equal(shaMatches.length, 1, 'review must contain exactly one Stage A SHA');
  assert.equal(runMatches.length, 1, 'review must contain exactly one Pages run');
  assert.equal(gateMatches.length, 1, 'review must contain exactly one run gate');
  assert.equal(shaMatches[0][1], expectedStageASha);
  assert.equal(runMatches[0][1], expectedPagesRunId);
  assert.equal(gateMatches[0][1], shaMatches[0][1]);

  return {
    pagesRunId: runMatches[0][1],
    stageASha: shaMatches[0][1],
  };
}

function assertLiteralEvidence(source) {
  parseLiteralEvidence(source);
  for (const literal of [
    '82 content documents',
    '457 governed sources',
    '36 completed topics',
    repositoryGate,
    'desktop `1440x1000`',
    'mobile `390x844`',
    '0 warnings / 0 errors',
    'no document overflow',
    'contained overflow',
    '800 px',
    'keyboard scroll/focus',
    '15/15 total',
    ...sourceLabels,
    '39 completed topics',
    '7 / 20',
    'recently completed G007',
    'current G008',
    'Stage B closure — PASS',
  ]) {
    assert.ok(source.includes(literal), `review must record ${literal}`);
  }
}

function assertStageBClosure(
  snapshotBacklog,
  snapshotTopicsById,
  snapshotProjectStatus,
) {
  const {pagesRunId, stageASha} = parseLiteralEvidence(review);
  const runUrl =
    `https://github.com/sealday/tego-arch/actions/runs/${pagesRunId}`;

  for (const number of routes) {
    const id = `PR-${number}`;
    const row = snapshotBacklog
      .split(/\r?\n/u)
      .find((line) => line.startsWith(`- [x] **${id} `));
    assert.ok(row, `${id} must be checked`);
    assert.ok(row.includes(stageASha), `${id} must record the Stage A SHA`);
    assert.ok(row.includes(runUrl), `${id} must record the Pages run`);
    assert.ok(
      row.includes(
        `https://sealday.github.io/tego-arch/principles/pr-${number}`,
      ),
      `${id} must record its canonical live route`,
    );
    assert.deepEqual(snapshotTopicsById.get(id)?.status, {
      scope: 'backlog-projection',
      value: 'complete',
      source: 'docs/content-backlog.md',
    });
  }

  assert.match(
    snapshotBacklog,
    /- \*\*持久故事进度：\*\* 已完成 `7 \/ 20`；最近完成 `G007`。/u,
  );
  assert.match(snapshotBacklog, /- \*\*当前持久故事：\*\* `G008`。/u);
  assert.equal(snapshotProjectStatus.completed_topics, 45);
  assert.deepEqual(snapshotProjectStatus.durable_stories, {
    completed: 7,
    total: 20,
    current: 'G008',
  });

  const currentBaselineLines = snapshotBacklog
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(
    currentBaselineLines.length,
    1,
    'backlog must contain exactly one current release baseline',
  );
  const currentBaseline = currentBaselineLines[0];
  for (const literal of [
    'G007 Batch 5 已完成 PR-15..17',
    stageASha,
    runUrl,
    '36 个已完成主题、82 篇内容文档与 457 个受治理来源',
    'G007 已完成',
    '当前持久故事为 G008',
    '此前 G007 Batch 4 历史完成基线',
    '3520f4f9e469019b9f3dbf84ec3170171264174d',
    '30422992605',
  ]) {
    assert.ok(
      currentBaseline.includes(literal),
      `current baseline must record ${literal}`,
    );
  }
  const currentSegment = currentBaseline.split(
    '此前 G007 Batch 4 历史完成基线',
  )[0];
  assert.doesNotMatch(currentSegment, /G007 仍在进行中|下一项为 PR-15/u);
}

test('records one exact successful G007 Batch 5 Stage A deployment', () => {
  const {stageASha} = parseLiteralEvidence(review);
  assertLiteralEvidence(review);
  assert.doesNotThrow(() =>
    execFileSync('git', ['cat-file', '-e', `${stageASha}^{commit}`], {
      cwd: root,
      stdio: 'pipe',
    }),
  );
});

test('rejects weakened or contradictory Batch 5 deployment evidence', () => {
  assertLiteralEvidence(review);

  for (const [literal, mutation] of [
    ['82 content documents', '81 content documents'],
    ['457 governed sources', '456 governed sources'],
    ['36 completed topics', '35 completed topics'],
    [repositoryGate, 'Repository test gate: `486/487` tests passed.'],
    ['0 warnings / 0 errors', '1 warning / 0 errors'],
    ['no document overflow', 'document overflow present'],
    ['contained overflow', 'clipped overflow'],
    ['800 px', '799 px'],
    ['keyboard scroll/focus', 'pointer-only scrolling'],
    ['15/15 total', '14/15 total'],
    ['39 completed topics', '38 completed topics'],
    ['7 / 20', '6 / 20'],
    ['current G008', 'current G007'],
    ['Stage B closure — PASS', 'Stage B closure — FAIL'],
    ...sourceLabels.map((label) => [label, 'REMOVED-SOURCE-LABEL']),
  ]) {
    assert.throws(
      () => assertLiteralEvidence(review.replaceAll(literal, mutation)),
      {name: 'AssertionError'},
    );
  }

  const otherSha = '0'.repeat(40);
  const otherRun = String(Number(expectedPagesRunId) + 1);
  const contradictory = [
    review,
    `Exact Stage A SHA: \`${otherSha}\``,
    `GitHub Pages run: [\`${otherRun}\`](https://github.com/sealday/tego-arch/actions/runs/${otherRun})`,
    `Exact run gate: \`headSha=${otherSha}\`, \`status=completed\`, \`conclusion=success\`.`,
    '',
  ].join('\n');
  assert.throws(() => assertLiteralEvidence(contradictory), {
    name: 'AssertionError',
  });
});

test('closes exactly PR-15 through PR-17 and advances the durable story', () => {
  assertStageBClosure(backlog, topicsById, projectStatus);

  const reopenedBacklog = backlog.replace(
    '- [x] **PR-15 ',
    '- [ ] **PR-15 ',
  );
  assert.throws(
    () => assertStageBClosure(reopenedBacklog, topicsById, projectStatus),
    {name: 'AssertionError'},
  );
});
