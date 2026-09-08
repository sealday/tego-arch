import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import test from 'node:test';
import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const REVIEW = 'docs/reviews/g009-batch15.md';
export const LOCAL_BROWSER = 'docs/reviews/evidence/g009-batch15-stage-a-browser.json';
const LOCAL_BROWSER_BYTES = 32300;
const LOCAL_BROWSER_SHA256 = 'b27cf34181529dfbcaf6eccd533d65fd0db5f8552b1dd08def0fbd95150c4609';
const BASE_URL = 'http://localhost:3100/tego-arch';
const TITLE = '架构风格选择矩阵：边界、交互与演进触发器';
const BUILD_INPUTS = ['content', 'data', 'src', 'static', 'scripts', 'plugins', 'docusaurus.config.ts', 'sidebars.ts', 'package.json', 'package-lock.json'];
const INPUT_SHA256 = '76c94055d82ab1460f1a6f93f21245b3e4adf1bd11ac9f21b57535fe2091d610';
const INPUT_CORRECTION = {
  reason: 'Added previously omitted sidebars.ts to the input identity; no new Browser observations were performed.',
  previousInputFiles: 285, previousInputSha256: '23a9c36837a7e2fa29d1efeaf7cd2c2b3797e4f7269d838a66fda2a106092245',
  addedInput: 'sidebars.ts', addedInputSha256: 'd3a60c5e67a717544a2993953b66a9665befa348827d001a71a376cacf95382c',
  verifiedUnchangedAt: ['463f1dec2ae0b35eedcf6fef2933f11ad60d74f8', 'eb723b4de6c5d9ef27072d6dbf797c9e7fe13156'],
};
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const LOCAL_REVIEW_LINES = [
  `- Raw Browser artifact: \`${LOCAL_BROWSER}\`; bytes \`${LOCAL_BROWSER_BYTES}\`; SHA-256 \`${LOCAL_BROWSER_SHA256}\`.`,
  `- Browser build input identity: \`286 files / ${INPUT_SHA256}\`; base head \`463f1dec2ae0b35eedcf6fef2933f11ad60d74f8\`; working-tree candidate, not a deployed head.`,
  '- Input identity correction: added previously omitted `sidebars.ts`; its bytes are unchanged between the base head, observed-candidate commit `eb723b4de6c5d9ef27072d6dbf797c9e7fe13156`, and this correction. No new Browser observations were performed; original capture time, measurements and screenshot limitations remain unchanged.',
  '- Functional observations: `4/4 states`; `12/12 wrapper checks`; `12/12 relation href/H1/return checks`; `24/24 source anchors`; STY-15 actionable total `0`; console warnings/errors and complete CDP diagnostics empty.',
  '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`; viewport images were inspected in tool output, but no durable full-article screenshot artifact was retained.',
  '- Collection boundary: Codex in-app Browser / CUA only; actual Tab/Right keyboard input with DOM focus; exact-href relation navigation plus Browser back, not physical clicks; source destinations are resolved anchors, not remote-page probes. Preliminary tab/log-scope observations remain disclosed in raw collection notes.',
];
export const TOPIC_ID = 'STY-14';
export const NEXT_TOPIC = 'STY-15';
const STAGE_A_EVIDENCE_HEAD = '215908786dde13e7fb19c752ba61b3bfb340a89b';
const STAGE_B_MARKER = '\n## Stage B closure candidate\n';
const STAGE_B_BROWSER = 'docs/reviews/evidence/g009-batch15-stage-b-production-browser.json';
const PREVIOUS_BACKLOG_ROW = '- [ ] **STY-14 P1｜风格选择矩阵**：用三个相同业务场景比较 Modular Monolith、Microservices 与 Event-Driven。';
const STY14_CLOSURE_ROW = '- [x] **STY-14 P1｜风格选择矩阵**：用三个相同业务场景比较 Modular Monolith、Microservices 与 Event-Driven。2026-09-07 Stage A implementation commit `ea452848ac0b77b4271c465a3643799abd17d863`，Pages run `34134613000`，build job `101782500593`、deploy job `101783809244`；evidence commit `215908786dde13e7fb19c752ba61b3bfb340a89b`，Pages run `34136330002`，build job `101788065505`、deploy job `101789152187`，两次均为 exact-head `push / completed / success`。Production HTML routes `7/7` 与 SVG asset `1/1` 为 HTTP `200`，functional Browser `SUCCESS / PASS`（states `4/4`、wrappers `12/12`、relation href/H1/return `12/12`、source anchors `24/24`、STY-15 actionable `0`、完整 diagnostics 零）；screenshot evidence `BLOCKED / NOT_ACCEPTED`（accepted `0/4`）。仅 Stage B 本地关闭候选；独立 code/content-rights/architecture reviews `PENDING`，Stage B deployment `PENDING / NOT_RUN`，不声称 Stage B 生产完成。';
const STAGE_B_LINES = [
  '- Scope: `STAGE_B_FINAL`; STY-14 and the G009 architecture-style batch are closed; the published recovery baseline and all preceding evidence bytes remain unchanged.',
  '- Stage A implementation head: `ea452848ac0b77b4271c465a3643799abd17d863`; Pages run `34134613000`; build job `101782500593`; deploy job `101783809244`; `push / completed / success`; `2026-09-07T14:44:31Z` → `2026-09-07T14:49:19Z`.',
  '- Stage A evidence head: `215908786dde13e7fb19c752ba61b3bfb340a89b`; Pages run `34136330002`; build job `101788065505`; deploy job `101789152187`; `push / completed / success`; `2026-09-07T15:04:01Z` → `2026-09-07T15:08:02Z`.',
  '- Stage A production evidence: `2026-09-07`; HTML routes `7/7` and SVG asset `1/1`, HTTP `200`; functional Browser `SUCCESS / PASS`; states `4/4`, wrappers `12/12`, exact relation href/H1/return `12/12`, source anchors `24/24`, STY-15 actionable `0`, complete diagnostics empty; screenshots `BLOCKED / NOT_ACCEPTED`, accepted `0/4`.',
  '- Immediate history: complete backlog `124996 bytes / 16d9c4013c0df279e1f809ba2fe3dfc35ed2f596f84011feb776de591230d674`; complete release suffix `41918 bytes / 13358d8a29848f9b873225cab669be9e5f2f0f1533245eb12cd591e8b6bc2237`; Stage A review `5767 bytes / 8b649f83c8a3d37af2c29eb47c5ea476a9f48685323b14f57a603db6e5f76eb0`; all `75` prior review/evidence files locked by tree SHA-256 `7fe265f26e05f02cdd66ad4805e5f8a1944fe1da4bc3b49871cc53fb5ee966df`.',
  '- Canonical Stage B projection: `85 completed topics / 127 content documents / 600 governed sources`; durable stories remain `8/20`, current `G009`.',
  '- STY-14 lifecycle: `published / complete`; exact status `{"scope":"backlog-projection","value":"complete","source":"docs/content-backlog.md"}`.',
  '- STY-15 lifecycle: `absent / unpublished / non-actionable`; no new topic is created.',
  '- Independent Stage B code/spec/security review: exact candidate head `0cbf5f77c77ae6cca1868ce7279d5057fbc25512`; verdict `READY / APPROVE / findings 0`; Critical/Important/Minor `0/0/0`; full repository and all gates passed.',
  '- Independent Stage B content/evidence/rights review: exact candidate head `0cbf5f77c77ae6cca1868ce7279d5057fbc25512`; verdict `CONTENT READY / rights PASS / findings 0`; Critical/Important/Minor `0/0/0`; targeted tests `324/324` passed.',
  '- Independent Stage B architecture/invariant review: exact candidate head `0cbf5f77c77ae6cca1868ce7279d5057fbc25512`; verdict `CLEAR / READY / blockers 0`; Critical/Important/Minor `0/0/0`; targeted tests `360/360` passed.',
  '- Final Stage B review judgment: `READY`; all three independent verdicts bind the same exact candidate, not a deployment.',
  '- Stage B deployment status: `SUCCESS / functional PASS; screenshots BLOCKED / NOT_ACCEPTED`.',
  '- Stage B production raw: `docs/reviews/evidence/g009-batch15-stage-b-production-browser.json`; bytes `37120`; SHA-256 `b21fec79aca51707109b3420b5ccfe7d465242c5d4fcddbe3bf62de6af61abba`; captured `2026-09-07T15:48:13.701Z`.',
  '- Stage B implementation push: `c9b0b0bb2c6aa32108b2c7b098c738b995706fcd`; fast-forward from `215908786dde13e7fb19c752ba61b3bfb340a89b`; exact merge-base, behind `0`, ahead `2`, tracked clean, merge commits `0`, remote unchanged after review.',
  '- Stage B Pages workflow: `Verify and deploy Docusaurus to GitHub Pages`; `.github/workflows/deploy.yml`; event `push`; headSha `c9b0b0bb2c6aa32108b2c7b098c738b995706fcd`; run `34139436579`; `completed / success`; created/started `2026-09-07T15:39:40Z`; updated `2026-09-07T15:44:24Z`.',
  '- Stage B build job: `101797853088`; `completed / success`; `2026-09-07T15:40:19Z` → `2026-09-07T15:44:11Z`. Deploy job: `101799017907`; `completed / success`; `2026-09-07T15:44:15Z` → `2026-09-07T15:44:23Z`.',
  '- Stage B production probes: `8/8 HTTP 200`; `/`, `/styles`, `/styles/sty-14`, `/styles/sty-04`, `/styles/sty-05`, `/styles/sty-06`, `/references` are `text/html; charset=utf-8`; STY-14 SVG is `image/svg+xml`, `9959` bytes, SHA-256 `d2032346802f2e722c39c0c5d8772816ff1233a4c96883d0d38e415129e27de5`, matching reviewed and fresh Browser-decoded bytes.',
  '- Stage B production functional judgment: `SUCCESS / PASS`; `4/4 states`; desktop light/dark `1440×1000`, mobile dark/light `390×844`; `12/12 wrapper focus-visible solid 3px / ArrowRight checks`; `12/12 exact relation href/H1/return checks`; `24/24 source anchors`; SVG loaded; STY-15 actionable total `0`; console and complete CDP diagnostics empty, continuous cursor chain `23→147→263→384→508`.',
  '- Stage B production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`. Four viewport images were inspected inline; no durable full-article artifact was retained. Functional PASS is not visual acceptance.',
  '- Stage B production collection boundary: fresh hidden Codex in-app Browser / CUA tab after exact-head deployment; actual Tab/Right plus DOM focus, no synthetic key event; exact-href navigation plus Browser back, no physical relation click claim; sources are observed/resolved anchors, not external loads. Inventory timeouts and preliminary system-dark observation are disclosed in raw evidence; actual site theme selection and complete fresh states were used; original system theme restored, viewport override reset and task tab closed.',
  '- Final Stage B publication judgment: `SUCCESS / PASS`; STY-14 `published / complete`; G009 architecture-style batch `closed`; projection `85/127/600`; durable-story projection remains `8/20`, current `G009`; no STY-15 topic or actionable link is created. The evidence commit own exact-head Pages run is recorded only in the ignored task report to avoid recursive evidence commits.',
  '- Completion boundary: the candidate review, implementation deployment and fresh production functional QA are separate exact identities; all required functional gates passed. Screenshot evidence remains `BLOCKED / NOT_ACCEPTED`, accepted `0/4`; no full-article visual clearance is claimed. The unchanged backlog closure row records the earlier local candidate checkpoint, not the final publication judgment recorded here.',
];
const IMMEDIATE_IDENTITIES = new Map([
  ['docs/content-backlog.md', [124996, '16d9c4013c0df279e1f809ba2fe3dfc35ed2f596f84011feb776de591230d674']],
  ['backlog release suffix', [41918, '13358d8a29848f9b873225cab669be9e5f2f0f1533245eb12cd591e8b6bc2237']],
  ['docs/reviews/g009-batch14.md', [19102, '4670db791ce9d8bd51c6bf904d1c357fd2fe4759761ba09a871eca47a103e4d4']],
  ['docs/reviews/g010-mth07.md', [18240, '3d11a2f00e64ce0edb77886ea95656375591422bb881b9bec43e05592bb8caff']],
  [REVIEW, [5767, '8b649f83c8a3d37af2c29eb47c5ea476a9f48685323b14f57a603db6e5f76eb0']],
  [LOCAL_BROWSER, [32300, LOCAL_BROWSER_SHA256]],
  ['docs/reviews/evidence/g009-batch15-stage-a-production-browser.json', [37303, '28967cff0dad4941577ddb62c3c063b4228cd71647dcc0841face601be54feb0']],
]);

function reviewBeforeStageB(source) {
  const start = source.indexOf(STAGE_B_MARKER);
  return start < 0 ? source : source.slice(0, start);
}
function reviewFiles(directory = 'docs/reviews') {
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? reviewFiles(path) : [path];
  }).sort();
}
function immediateHistoryFiles() {
  const files = new Map(reviewFiles().filter(isImmediateHistoricalPath).map((path) => [path, readFileSync(path)]));
  files.set(REVIEW, Buffer.from(reviewBeforeStageB(files.get(REVIEW).toString())));
  return files;
}
function isImmediateHistoricalPath(path) {
  return path !== STAGE_B_BROWSER &&
    path !== 'docs/reviews/g009-batch16.md' &&
    path !== 'docs/reviews/evidence/g009-batch16-stage-a-browser.json';
}
test('STY-14 immediate history excludes only the exact newly bound Stage B raw path', () => {
  assert.equal(isImmediateHistoricalPath(STAGE_B_BROWSER), false);
  for (const path of [STAGE_B_BROWSER.replace('.json', '-fabricated.json'), STAGE_B_BROWSER + '.bak', STAGE_B_BROWSER.replace('stage-b', 'stage-c')]) {
    assert.equal(isImmediateHistoricalPath(path), true, 'near matches retain historical membership protection');
    const files = immediateHistoryFiles(); files.set(path, Buffer.from('fabricated'));
    assert.throws(() => assertImmediateHistory(readFileSync('docs/content-backlog.md', 'utf8'), files), assert.AssertionError);
  }
});
function assertImmediateHistory(backlog, files = immediateHistoryFiles()) {
  const suffix = backlog.match(/^- \*\*当前发布基线：\*\* (.+)$/mu)?.[1];
  assert.ok(suffix, 'complete immediately previous release suffix exists');
  const previousBacklog = backlog.replace(STY14_CLOSURE_ROW, PREVIOUS_BACKLOG_ROW);
  const identities = new Map([...files, ['docs/content-backlog.md', Buffer.from(previousBacklog)], ['backlog release suffix', Buffer.from(suffix)]]);
  for (const [path, [length, digest]] of IMMEDIATE_IDENTITIES) {
    const bytes = identities.get(path);
    assert.ok(bytes, `immediate history exists: ${path}`);
    assert.equal(bytes.length, length, `immediate history byte length: ${path}`);
    assert.equal(sha256(bytes), digest, `immediate history SHA-256: ${path}`);
  }
  assert.equal(files.size, 75, 'complete historical review/evidence membership');
  assert.equal(sha256([...files.keys()].sort().map((path) => `${path}\0${sha256(files.get(path))}\n`).join('')), '7fe265f26e05f02cdd66ad4805e5f8a1944fe1da4bc3b49871cc53fb5ee966df', 'complete historical review/evidence tree SHA-256');
}

test('STY-14 locks the complete immediate backlog suffix and every preceding review/evidence byte', () => {
  assertImmediateHistory(readFileSync('docs/content-backlog.md', 'utf8'));
});

function assertStageBBacklog(source) {
  assert.equal(source.split(STY14_CLOSURE_ROW + '\n').length - 1, 1, 'one exact checked STY-14 row binds Stage A evidence and pending Stage B gates');
  assert.equal((source.match(/^- \[[ xX]\] \*\*STY-14\b/gmu) ?? []).length, 1, 'exactly one STY-14 checkbox');
  assertImmediateHistory(source);
}
function assertStageBReview(source) {
  assert.equal(source, productionReviewFixture() + STAGE_B_MARKER + '\n' + STAGE_B_LINES.join('\n') + '\n', 'exact Stage B review preserves Stage A bytes and binds independent verdicts and deployment state');
}
function assertStageBProjection(status, manifest, documents = []) {
  assert.deepEqual(projection(status), EXPECTED_STAGE_B_PROJECTION, 'exact generated Stage B 85/127/600 projection');
  assert.deepEqual(status.durable_stories, {completed: 8, total: 20, current: 'G009'}, 'durable story closure is not authorized at this candidate checkpoint');
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID);
  assert.ok(topic, 'STY-14 Stage B topic exists');
  assert.deepEqual(Object.fromEntries(Object.keys(EXPECTED_STAGE_A_TOPIC).map((key) => [key, topic[key]])), {...EXPECTED_STAGE_A_TOPIC, adjacent_topics: [...EXPECTED_STAGE_A_TOPIC.adjacent_topics, 'DDD-01'], status: {...EXPECTED_STAGE_A_TOPIC.status, value: 'complete'}}, 'exact STY-14 published complete projection');
  assert.equal(manifest.topics.some(({id}) => id === NEXT_TOPIC), false, 'STY-15 stays absent');
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-15'), false, 'STY-15 stays non-actionable');
}
test('STY-14 Stage B candidate requires exactly one evidence-bound backlog closure', () => {
  assertStageBBacklog(readFileSync('docs/content-backlog.md', 'utf8'));
});
test('STY-14 Stage B candidate requires the actual complete generator projection', async () => {
  assertStageBProjection(projectStatus, manifest, await readContentDocuments('content'));
});
test('STY-14 Stage B final review binds exact independent READY reviews and production SUCCESS', () => {
  assertStageBReview(readFileSync(REVIEW, 'utf8'));
});
test('STY-14 Stage B tracks fresh exact-head production Browser evidence', () => {
  assert.ok(optionalText('docs/reviews/evidence/g009-batch15-stage-b-production-browser.json'), 'fresh Stage B production raw exists');
});
test('STY-14 Stage B verdicts reject wrong head, weakened verdict, rights failure and pending review', () => {
  const source = productionReviewFixture() + STAGE_B_MARKER + '\n' + STAGE_B_LINES.join('\n') + '\n';
  assertStageBReview(source);
  for (const [before, after] of [
    ['0cbf5f77c77ae6cca1868ce7279d5057fbc25512', '215908786dde13e7fb19c752ba61b3bfb340a89b'],
    ['verdict `READY / APPROVE / findings 0`', 'verdict `READY / findings 0`'],
    ['verdict `CONTENT READY / rights PASS / findings 0`', 'verdict `CONTENT READY / rights FAIL / findings 0`'],
    ['verdict `CLEAR / READY / blockers 0`', 'verdict `READY / blockers 0`'],
    ['Final Stage B review judgment: `READY`', 'Final Stage B review judgment: `PENDING`'],
    ['Critical/Important/Minor `0/0/0`; targeted tests `324/324`', 'Critical/Important/Minor `0/1/0`; targeted tests `324/324`'],
    ['Stage B deployment status: `SUCCESS / functional PASS; screenshots BLOCKED / NOT_ACCEPTED`', 'Stage B deployment status: `PENDING / NOT_RUN`'],
  ]) {
    const marker = source.indexOf(STAGE_B_MARKER);
    const changed = source.slice(0, marker) + source.slice(marker).replace(before, after);
    assert.notEqual(changed, source, 'Stage B verdict mutation applies');
    assert.throws(() => assertStageBReview(changed), assert.AssertionError);
  }
});
test('STY-14 Stage B backlog and review reject changed, deleted, displaced and additive claims', () => {
  const previous = execFileSync('git', ['show', `${STAGE_A_EVIDENCE_HEAD}:docs/content-backlog.md`], {encoding: 'utf8'});
  const backlog = previous.replace(PREVIOUS_BACKLOG_ROW, STY14_CLOSURE_ROW);
  const review = productionReviewFixture() + STAGE_B_MARKER + '\n' + STAGE_B_LINES.join('\n') + '\n';
  assertStageBBacklog(backlog); assertStageBReview(review);
  for (const token of STY14_CLOSURE_ROW.split(/(?<=。|；|，|`)/u).filter(Boolean)) {
    for (const replacement of [token + 'fabricated', '']) {
      const changed = backlog.replace(STY14_CLOSURE_ROW, STY14_CLOSURE_ROW.replace(token, replacement));
      assert.notEqual(changed, backlog, 'closure mutation applies');
      assert.throws(() => assertStageBBacklog(changed), assert.AssertionError);
    }
  }
  for (const changed of [backlog + STY14_CLOSURE_ROW + '\n', backlog.replace('- [ ] **OPS-04', '- [x] **OPS-04'), backlog.replace(STY14_CLOSURE_ROW + '\n', '') + STY14_CLOSURE_ROW + '\n']) {
    assert.notEqual(changed, backlog, 'only-one-row mutation applies');
    assert.throws(() => assertStageBBacklog(changed), assert.AssertionError);
  }
  for (const line of STAGE_B_LINES) for (const changed of [review.replace(line, line + 'fabricated'), review.replace(line + '\n', ''), review.replace(line + '\n', '') + '\n' + line + '\n', review + line + '\n']) {
    assert.notEqual(changed, review, 'Stage B review mutation applies');
    assert.throws(() => assertStageBReview(changed), assert.AssertionError);
  }
});
test('STY-14 Stage B projection rejects stale counts, lifecycle, source identity and fabricated STY-15', () => {
  const stage = stageAFixture(projectStatus, manifest);
  stage.status.completed_topics = 85;
  stage.status.content_documents = 128;
  stage.status.governed_sources = 604;
  stage.manifest.topics.find(({id}) => id === TOPIC_ID).status.value = 'complete';
  stage.manifest.topics.find(({id}) => id === TOPIC_ID).adjacent_topics.push('DDD-01');
  assertStageBProjection(stage.status, stage.manifest);
  for (const mutate of [
    (copy) => { copy.status.completed_topics = 84; },
    (copy) => { copy.status.content_documents--; },
    (copy) => { copy.status.governed_sources++; },
    (copy) => { copy.status.durable_stories.completed++; },
    (copy) => { copy.manifest.topics.find(({id}) => id === TOPIC_ID).status.value = 'pending'; },
    (copy) => { copy.manifest.topics.find(({id}) => id === TOPIC_ID).published = false; },
    (copy) => { copy.manifest.topics.find(({id}) => id === TOPIC_ID).primary_sources = []; },
    (copy) => { copy.manifest.topics.push({id: NEXT_TOPIC}); },
  ]) {
    const changed = structuredClone(stage); mutate(changed);
    assert.notDeepEqual(changed, stage, 'projection mutation applies');
    assert.throws(() => assertStageBProjection(changed.status, changed.manifest), assert.AssertionError);
  }
  for (const body of ['[Next](/styles/sty-15)', '<Link to="/styles/sty-15">Next</Link>', '<a href="/styles/sty-15">Next</a>']) {
    assert.throws(() => assertStageBProjection(stage.status, stage.manifest, [{file: 'other.mdx', body}]), /non-actionable/u);
  }
});
test('STY-14 immediate history rejects non-no-op add/edit/delete mutations', () => {
  const backlog = readFileSync('docs/content-backlog.md', 'utf8');
  const files = immediateHistoryFiles(); assertImmediateHistory(backlog, files);
  for (const [path, bytes] of files) {
    for (const mutated of [Buffer.concat([bytes, Buffer.from('x')]), Buffer.from(bytes.map((byte, index) => index === 0 ? byte ^ 1 : byte)), bytes.subarray(1)]) {
      assert.notDeepEqual(mutated, bytes, `${path} bytes mutation applies`);
      const changed = new Map(files); changed.set(path, mutated);
      assert.throws(() => assertImmediateHistory(backlog, changed), assert.AssertionError, path);
    }
    const deleted = new Map(files); deleted.delete(path);
    assert.notDeepEqual(deleted, files, 'file deletion applies');
    assert.throws(() => assertImmediateHistory(backlog, deleted), assert.AssertionError, path);
  }
  const added = new Map(files); added.set('docs/reviews/fabricated.md', Buffer.from('PASS'));
  assert.notDeepEqual(added, files, 'file addition applies');
  assert.throws(() => assertImmediateHistory(backlog, added), assert.AssertionError);
  for (const changed of [backlog + 'x', backlog.replace('2026-08-28 G009 Batch 14', '2026-08-29 G009 Batch 14'), backlog.replace('2026-08-28 G009 Batch 14', '')]) {
    assert.notEqual(changed, backlog, 'backlog suffix mutation applies');
    assert.throws(() => assertImmediateHistory(changed, files), assert.AssertionError);
  }
});
export const EXPECTED_CURRENT_PROJECTION = Object.freeze({completed: 84, documents: 126, sources: 599});
export const EXPECTED_STAGE_A_PROJECTION = Object.freeze({completed: 84, documents: 127, sources: 600});
export const EXPECTED_STAGE_B_PROJECTION = Object.freeze({completed: 85, documents: 128, sources: 604});

export const EXPECTED_STAGE_A_TOPIC = Object.freeze({
  id: TOPIC_ID,
  type: 'style',
  title: '架构风格选择矩阵：边界、交互与演进触发器',
  slug: '/styles/sty-14',
  priority: 'P1',
  status: Object.freeze({scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}),
  dependencies: ['STY-00', 'STY-04', 'STY-05', 'STY-06'],
  adjacent_topics: ['STY-04', 'STY-05', 'STY-06'],
  primary_sources: ['https://martinfowler.com/bliki/MonolithFirst.html'],
  related_cases: [],
  related_questions: [],
  reviewed_at: '2026-09-07',
  published: true,
});

export const PENDING_STAGE_A_LINES = Object.freeze([
  '- Scope: `STAGE_A_ONLY`.',
  '- STY-14 lifecycle: `published / pending`.',
  '- STY-15 lifecycle: `absent / unpublished / pending / non-actionable`.',
  '- Projection: `84 completed topics / 127 content documents / 600 governed sources`.',
  '- Code/spec/security review: `PENDING`.',
  '- Content/evidence/rights review: `PENDING`.',
  '- Architecture/invariant review: `PENDING`.',
  '- Final Stage A judgment: `PENDING`.',
  '- Deployment status: `NOT_RUN`.',
]);

export const STAGE_A_REVIEWED_HEAD = '1b5ab36d4fd7fb660f7a3df90c2e564d95e331cb';
const READY_STAGE_A_LINES = [
  ...PENDING_STAGE_A_LINES.slice(0, 4),
  `- Reviewed implementation/evidence head: \`${STAGE_A_REVIEWED_HEAD}\`.`,
  '- Code/spec/security review: `READY / APPROVE / findings 0`.',
  '- Content/evidence/rights review: `CONTENT READY / rights PASS / findings 0`.',
  '- Architecture/invariant review: `CLEAR / READY / blockers 0`.',
  '- Final Stage A judgment: `READY`.',
  '- Deployment status: `NOT_RUN`.',
];
const INDEPENDENT_REVIEW_LINES = [
  `- Code/spec/security: exact head \`${STAGE_A_REVIEWED_HEAD}\`; reviewed range \`6a6ebe3..1b5ab36\`; verdict \`READY / APPROVE / findings 0\`; Critical/Important/Minor \`0/0/0\`; \`352\` targeted tests and full repository/gates passed.`,
  `- Content/evidence/rights: exact head \`${STAGE_A_REVIEWED_HEAD}\`; verdict \`CONTENT READY / rights PASS / findings 0\`; \`391\` targeted tests passed; no new Browser observations performed.`,
  `- Architecture/invariants: exact head \`${STAGE_A_REVIEWED_HEAD}\`; verdict \`CLEAR / READY / blockers 0\`; \`1804/1804\` repository tests passed; no new Browser observations performed; production still requires fresh four-state verification.`,
  '- Binding boundary: these three independent read-only verdicts review the candidate and existing evidence, not a deployment. Task 5 performs no new Browser collection or deployment; screenshot evidence remains `BLOCKED / NOT_ACCEPTED`; deployment remains `NOT_RUN`.',
];

const optionalText = (path) => {
  try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; }
};
function exactKeys(value, keys, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} is an object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} exact keys`);
}
function projection(status) {
  return {completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources};
}
function h2Sections(source) {
  return [...source.matchAll(/^## (?<heading>.+)$/gmu)].map((match, index, matches) => {
    const start = match.index + match[0].length;
    const next = matches[index + 1];
    return [match.groups.heading, source.slice(start, next?.index ?? source.length).trim()];
  });
}

export function assertCurrentBaseline(status, manifest) {
  assert.deepEqual(projection(status), EXPECTED_CURRENT_PROJECTION, 'exact pre-STY-14 current 84/126/599 projection');
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID); assert.ok(topic, 'STY-14 canonical backlog projection exists');
  assert.deepEqual({published: topic.published, status: topic.status}, {published: false, status: {scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}}, 'pre-implementation STY-14 remains unpublished/pending');
  assert.equal(manifest.topics.some(({id}) => id === NEXT_TOPIC), false, 'STY-15 is absent from the canonical projection');
}

export function assertStageAProjection(status, manifest, documents = []) {
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-15'), false, 'STY-15 remains non-actionable across all content Markdown/MDX/HTML links');
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID); assert.ok(topic, 'STY-14 Stage A topic record exists');
  assert.equal(topic.published, true, 'STY-14 Stage A projection is absent until the article is generated');
  const selected = Object.fromEntries(Object.keys(EXPECTED_STAGE_A_TOPIC).map((key) => [key, topic[key]]));
  assert.deepEqual(selected, EXPECTED_STAGE_A_TOPIC, 'exact STY-14 Stage A topic projection');
  assert.deepEqual(projection(status), EXPECTED_STAGE_A_PROJECTION, 'exact generated Stage A 84/127/600 projection');
  assert.equal(manifest.topics.some(({id}) => id === NEXT_TOPIC), false, 'STY-15 remains absent, unpublished and non-actionable');
}

export function assertPendingStageAReview(source) {
  assert.ok(source, `${REVIEW} must exist after the Stage A candidate is generated`);
  const sections = h2Sections(source); assert.deepEqual(sections.map(([heading]) => heading), ['Stage A candidate', 'Local Browser evidence'], 'exact initial review section schema');
  assert.equal(sections[0][1], PENDING_STAGE_A_LINES.join('\n'), 'exact PENDING Stage A review contract');
  assert.equal(sections[1][1], LOCAL_REVIEW_LINES.join('\n'), 'exact local Browser evidence binding');
  for (const line of PENDING_STAGE_A_LINES) assert.equal(source.split(line).length - 1, 1, `one controlled review line: ${line}`);
  assert.doesNotMatch(source, /(?:READY|APPROVE|CONTENT READY|CLEAR \/ READY|SUCCESS|PASS)/u, 'no verdict or deployment success is fabricated in the initial review');
}

function pendingReviewFixture() {
  return `# G009 Batch 15 — STY-14 Architecture Style Choice Matrix Review\n\n## Stage A candidate\n\n${PENDING_STAGE_A_LINES.join('\n')}\n\n## Local Browser evidence\n\n${LOCAL_REVIEW_LINES.join('\n')}\n`;
}
function readyReviewFixture() {
  return `# G009 Batch 15 — STY-14 Architecture Style Choice Matrix Review\n\n## Stage A candidate\n\n${READY_STAGE_A_LINES.join('\n')}\n\n## Independent Stage A reviews\n\n${INDEPENDENT_REVIEW_LINES.join('\n')}\n\n## Local Browser evidence\n\n${LOCAL_REVIEW_LINES.join('\n')}\n`;
}
export function assertReadyStageAReview(source) {
  assert.equal(source, readyReviewFixture(), 'exact READY Stage A review binds reviewed head, independent verdicts and honest evidence boundaries without displaced/additive claims');
}
function stageAFixture(status, manifest) {
  const projectedStatus = structuredClone(status); projectedStatus.completed_topics = EXPECTED_STAGE_A_PROJECTION.completed; projectedStatus.content_documents = EXPECTED_STAGE_A_PROJECTION.documents; projectedStatus.governed_sources = EXPECTED_STAGE_A_PROJECTION.sources;
  const projectedManifest = structuredClone(manifest); const index = projectedManifest.topics.findIndex(({id}) => id === TOPIC_ID); assert.notEqual(index, -1, 'fixture starts from canonical STY-14 projection'); projectedManifest.topics[index] = {...projectedManifest.topics[index], ...structuredClone(EXPECTED_STAGE_A_TOPIC)};
  return {status: projectedStatus, manifest: projectedManifest};
}
function currentBaselineFixture() {
  return {
    status: {completed_topics: 84, content_documents: 126, governed_sources: 599},
    manifest: {topics: [{id: TOPIC_ID, published: false, status: {scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}}]},
  };
}

const projectStatus = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8'));
const manifest = JSON.parse(readFileSync('src/generated/topic-manifest.json', 'utf8'));

test('STY-14 deployment helpers are GREEN for the current baseline and mutation-sensitive Stage A fixtures', () => {
  const baseline = currentBaselineFixture(); assertCurrentBaseline(baseline.status, baseline.manifest);
  const projected = stageAFixture(baseline.status, baseline.manifest); assertStageAProjection(projected.status, projected.manifest);
  const review = pendingReviewFixture(); assertPendingStageAReview(review);

  const wrongCount = structuredClone(projected); wrongCount.status.content_documents = 126; assert.throws(() => assertStageAProjection(wrongCount.status, wrongCount.manifest), /84\/127\/600/u, 'stale document count rejected');
  const completed = structuredClone(projected); completed.manifest.topics.find(({id}) => id === TOPIC_ID).status.value = 'complete'; assert.throws(() => assertStageAProjection(completed.status, completed.manifest), /exact STY-14 Stage A topic projection/u, 'premature complete status rejected');
  const sty15 = structuredClone(projected); sty15.manifest.topics.push({id: NEXT_TOPIC, published: false}); assert.throws(() => assertStageAProjection(sty15.status, sty15.manifest), /STY-15 remains absent/u, 'fabricated STY-15 rejected');
  const primary = structuredClone(projected); primary.manifest.topics.find(({id}) => id === TOPIC_ID).primary_sources = ['https://example.com/complete-matrix']; assert.throws(() => assertStageAProjection(primary.status, primary.manifest), /exact STY-14 Stage A topic projection/u, 'wrong manifest primary rejected');

  assert.throws(() => assertPendingStageAReview(review.replace('`PENDING`.', '`READY / APPROVE`.')), /exact PENDING Stage A review contract|fabricated/u, 'premature verdict rejected');
  assert.throws(() => assertPendingStageAReview(review.replace('`NOT_RUN`.', '`SUCCESS`.')), /exact PENDING Stage A review contract|fabricated/u, 'fabricated deployment rejected');
  assert.throws(() => assertPendingStageAReview(`${review}\n${PENDING_STAGE_A_LINES[4]}\n`), /exact local Browser evidence binding|one controlled review line/u, 'duplicate controlled claim rejected');
  assert.throws(() => assertPendingStageAReview(review.replace('`STAGE_A_ONLY`', '`STAGE_B`')), /exact PENDING Stage A review contract/u, 'wrong scope rejected');
});

test('STY-14 production Stage A review binds exact-head independent READY verdicts and production evidence', () => {
  assertProductionStageAReview(reviewBeforeStageB(optionalText(REVIEW)));
});

const verdictMutations = [
  ['wrong candidate head', (s) => s.replace(STAGE_A_REVIEWED_HEAD, '0'.repeat(40))],
  ['wrong code reviewed head', (s) => s.replace(`Code/spec/security: exact head \`${STAGE_A_REVIEWED_HEAD}`, `Code/spec/security: exact head \`${'0'.repeat(40)}`)],
  ['wrong content reviewed head', (s) => s.replace(`Content/evidence/rights: exact head \`${STAGE_A_REVIEWED_HEAD}`, `Content/evidence/rights: exact head \`${'0'.repeat(40)}`)],
  ['wrong architecture reviewed head', (s) => s.replace(`Architecture/invariants: exact head \`${STAGE_A_REVIEWED_HEAD}`, `Architecture/invariants: exact head \`${'0'.repeat(40)}`)],
  ['weakened code verdict', (s) => s.replaceAll('READY / APPROVE / findings 0', 'READY / findings 0')],
  ['weakened content verdict', (s) => s.replaceAll('CONTENT READY / rights PASS / findings 0', 'CONTENT READY / rights PASS')],
  ['weakened architecture verdict', (s) => s.replaceAll('CLEAR / READY / blockers 0', 'READY / blockers 0')],
  ['rights failure', (s) => s.replaceAll('rights PASS', 'rights FAIL')],
  ['nonzero findings', (s) => s.replaceAll('findings 0', 'findings 1')],
  ['nonzero blockers', (s) => s.replaceAll('blockers 0', 'blockers 1')],
  ['stale code PENDING', (s) => s.replace('`READY / APPROVE / findings 0`', '`PENDING`')],
  ['stale content PENDING', (s) => s.replace('`CONTENT READY / rights PASS / findings 0`', '`PENDING`')],
  ['stale architecture PENDING', (s) => s.replace('`CLEAR / READY / blockers 0`', '`PENDING`')],
  ['stale final PENDING', (s) => s.replace('Final Stage A judgment: `READY`', 'Final Stage A judgment: `PENDING`')],
  ['fabricated deployment success', (s) => s.replaceAll('`NOT_RUN`', '`SUCCESS`')],
  ['fabricated accepted screenshot', (s) => s.replaceAll('`BLOCKED / NOT_ACCEPTED`', '`PASS / ACCEPTED`')],
  ['fabricated new Browser collection', (s) => s.replace('Task 5 performs no new Browser collection or deployment', 'Task 5 performed new Browser collection and deployment')],
  ['displaced candidate verdict', (s) => s.replace(`${READY_STAGE_A_LINES[5]}\n`, '') + `\n${READY_STAGE_A_LINES[5]}\n`],
  ['displaced independent verdict', (s) => s.replace(`${INDEPENDENT_REVIEW_LINES[0]}\n`, '') + `\n${INDEPENDENT_REVIEW_LINES[0]}\n`],
  ['additive duplicate verdict', (s) => `${s}\n${READY_STAGE_A_LINES[5]}\n`],
  ['additive preamble deployment', (s) => `Deployment: SUCCESS\n${s}`],
  ['additive candidate deployment', (s) => s.replace('## Stage A candidate\n', '## Stage A candidate\n\nDeployment: SUCCESS\n')],
  ['additive independent claim', (s) => s.replace('## Independent Stage A reviews\n', '## Independent Stage A reviews\n\nAll screenshots accepted.\n')],
  ['additive extra section', (s) => `${s}\n## Deployment\n\nSUCCESS\n`],
];
for (const [label, mutate] of verdictMutations) test(`STY-14 Stage A verdict binding rejects ${label}`, () => {
  const source = readyReviewFixture(); assertReadyStageAReview(source);
  const changed = mutate(source); assert.notEqual(changed, source, 'mutation changes the actual review');
  assert.throws(() => assertReadyStageAReview(changed), /exact READY Stage A review/u);
});

for (const [format, body] of [
  ['Markdown', '[下一篇](/styles/sty-15#next)'],
  ['MDX', '<Link to="/styles/sty-15/">下一篇</Link>'],
  ['HTML', '<a href="/styles/sty-15?from=sty14">下一篇</a>'],
]) test(`STY-14 deployment helper rejects actionable STY-15 ${format} links anywhere`, () => {
  const baseline = currentBaselineFixture(); const projected = stageAFixture(baseline.status, baseline.manifest);
  assertStageAProjection(projected.status, projected.manifest, [{file: 'other.mdx', body: '待规划的下一篇。'}]);
  assert.throws(() => assertStageAProjection(projected.status, projected.manifest, [{file: 'other.mdx', body}]), /STY-15.*non-actionable/u);
});

test('STY-14 immutable Stage A projection advanced only documents and original-source count', () => {
  assertStageAProjection(JSON.parse(stageAInput('src/generated/project-status.json')), JSON.parse(stageAInput('src/generated/topic-manifest.json')));
});

test('STY-14 Stage A tracks raw local Browser evidence', () => {
  assert.ok(optionalText(LOCAL_BROWSER), 'raw local Browser evidence exists');
});

test('STY-14 Stage A tracks fresh exact-head production Browser evidence', () => {
  assert.ok(optionalText('docs/reviews/evidence/g009-batch15-stage-a-production-browser.json'), 'raw production Browser evidence exists');
});

const STATE_CONTRACTS = [
  ['desktopLight', 1440, 1000, 'light', 800, 347, 480, 177567],
  ['desktopDark', 1440, 1000, 'dark', 800, 480, 595, 179003],
  ['mobileLight', 390, 844, 'light', 358, 595, 716, 59905],
  ['mobileDark', 390, 844, 'dark', 358, 716, 826, 58585],
];
const WRAPPER_LABELS = ['架构风格选择矩阵双轴图，可横向滚动', '三类压力与四种结构决策矩阵，可横向滚动', '演进动作、观察窗口与回滚路径表，可横向滚动'];
const RELATION_CONTRACTS = [
  ['04', 'STY-04 模块化单体', '模块化单体：在一个部署单元内保护业务边界'],
  ['05', 'STY-05 微服务', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['06', 'STY-06 事件驱动架构', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
];
const SOURCE_CONTRACTS = [
  ['Monolith First', 'https://martinfowler.com/bliki/MonolithFirst.html'],
  ['Spring Modulith Fundamentals', 'https://docs.spring.io/spring-modulith/reference/fundamentals.html'],
  ['Microservices', 'https://martinfowler.com/articles/microservices.html'],
  ['Microservices architecture style', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices'],
  ['What do you mean by “Event-Driven”?', 'https://martinfowler.com/articles/201701-event-driven.html'],
  ['Event-driven architecture style', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven'],
];
const RELATION_METHOD = 'exact-href navigation and Browser back; no physical click claimed';
const SCREENSHOT_REASON = 'Viewport screenshot rendered in tool output only; no durable full-article screenshot artifact was retained.';

export function assertLocalBrowser(raw) {
  exactKeys(raw, ['schemaVersion', 'tool', 'baseUrl', 'capturedAt', 'buildProvenance', 'collection', 'svgAsset', 'states'], 'Browser root');
  assert.equal(raw.schemaVersion, 1);
  assert.equal(raw.tool, 'Codex in-app Browser / CUA CDP');
  assert.equal(raw.baseUrl, BASE_URL);
  assert.equal(raw.capturedAt, '2026-09-07T14:01:05.707Z');
  assert.deepEqual(raw.buildProvenance, {
    baseHead: '463f1dec2ae0b35eedcf6fef2933f11ad60d74f8', kind: 'working-tree candidate after canonical generation; not a committed or deployed head',
    inputFiles: 286, inputSha256: INPUT_SHA256, inputIdentityCorrection: INPUT_CORRECTION,
    scriptUrls: [`${BASE_URL}/assets/js/runtime~main.a15b5364.js`, `${BASE_URL}/assets/js/main.ce66ac75.js`],
  }, 'exact Browser build provenance');
  assert.deepEqual(raw.collection, {
    tabId: '2', diagnosticMethods: ['Runtime.exceptionThrown', 'Log.entryAdded'], consoleLevels: ['warn', 'error'],
    keyboardMethod: 'CUA Tab then DOM focus and CUA Right; browser-reported focus-visible and computed outline; no synthetic key event',
    relationMethod: RELATION_METHOD, sourceMethod: 'actual article anchors and browser-resolved destinations; no external page loading claim',
    initialAttempt: 'A preliminary tab spanning rebuild recorded React recoverable hydration error #418 at 2026-09-07T13:57:08.264Z. A stale closure initially read that old tab log while inspecting tab 2. Accepted observations use fixed tab 2 and its native logs; the prior error was not hidden or relabeled as passing.',
  }, 'exact collection scope and preliminary diagnostic disclosure');
  const svgBytes = readFileSync('static/img/diagrams/sty-14-architecture-choice-matrix.svg');
  assert.deepEqual(raw.svgAsset, {bytes: svgBytes.length, sha256: sha256(svgBytes), viewBox: '0 0 1600 2200'}, 'observed SVG matches reviewed bytes');
  exactKeys(raw.states, STATE_CONTRACTS.map(([name]) => name), 'four states');
  for (const [name, width, height, theme, clientWidth, afterSequence, cursor, screenshotBytes] of STATE_CONTRACTS) {
    const state = raw.states[name];
    exactKeys(state, ['url', 'h1', 'viewport', 'theme', 'page', 'wrappers', 'svg', 'relations', 'sources', 'sty15ActionableCount', 'interactions', 'relationChecks', 'logs', 'diagnostics', 'screenshot'], name);
    assert.equal(state.url, `${BASE_URL}/styles/sty-14`, `${name} route`);
    assert.equal(state.h1, TITLE, `${name} H1`);
    assert.deepEqual(state.viewport, {width, height}, `${name} viewport`);
    assert.equal(state.theme, theme, `${name} theme`);
    assert.deepEqual(state.page, {clientWidth: width, scrollWidth: width}, `${name} no page overflow`);
    assert.deepEqual(state.wrappers, WRAPPER_LABELS.map((label, i) => ({label, className: i === 0 ? 'architecture-diagram-scroll' : 'table-wrapper table-wrapper--mapping', role: 'region', tabIndex: 0, clientWidth, scrollWidth: [800, 1527, 1406][i]})), `${name} exact ordered wrappers`);
    assert.deepEqual(state.interactions, WRAPPER_LABELS.map((label, i) => ({label, key: 'ArrowRight', before: 0, after: width === 1440 && i === 0 ? 0 : 40, focused: true, focusVisible: true, outlineWidth: '3px', outlineStyle: 'solid', outlineColor: theme === 'light' ? 'rgb(159, 63, 49)' : i === 0 ? 'rgb(227, 144, 125)' : 'rgba(227, 144, 125, 0.62)'})), `${name} bound keyboard interactions`);
    assert.deepEqual(state.svg, [{srcKind: 'data:image/svg+xml;base64', encodedLength: 13280, complete: true, naturalWidth: 109, naturalHeight: 150, width: 800, height: 1100}], `${name} loaded SVG dimensions`);
    assert.deepEqual(state.relations, RELATION_CONTRACTS.map(([id, text]) => ({text, href: `/tego-arch/styles/sty-${id}`, destination: `${BASE_URL}/styles/sty-${id}`})), `${name} exact relation anchors`);
    assert.deepEqual(state.relationChecks, RELATION_CONTRACTS.map(([id, , h1]) => ({href: `/tego-arch/styles/sty-${id}`, method: RELATION_METHOD, destination: {url: `${BASE_URL}/styles/sty-${id}`, h1, returnHref: '/tego-arch/styles/sty-14'}, returned: {url: `${BASE_URL}/styles/sty-14`, h1: TITLE, theme}})), `${name} exact relation href H1 and return`);
    assert.deepEqual(state.sources, SOURCE_CONTRACTS.map(([text, href]) => ({text, href, destination: href, rel: 'noopener noreferrer', target: '_blank'})), `${name} exact governed sources`);
    assert.equal(state.sty15ActionableCount, 0, `${name} STY-15 absent`);
    assert.deepEqual(state.logs, [], `${name} no console warnings/errors`);
    assert.deepEqual(state.diagnostics, {afterSequence, cursor, events: [], hasMore: false, truncated: false}, `${name} complete continuous diagnostics`);
    assert.deepEqual(state.screenshot, {attempted: true, bytes: screenshotBytes, artifact: null, status: 'BLOCKED', acceptance: 'NOT_ACCEPTED', reason: SCREENSHOT_REASON}, `${name} honest screenshot boundary`);
  }
}

function stageABuildInputPaths() {
  return execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', STAGE_A_EVIDENCE_HEAD, '--', ...BUILD_INPUTS], {encoding: 'utf8'}).split('\0').filter(Boolean).sort();
}

const stageAInputCache = new Map();
function stageAInput(path) {
  if (!stageAInputCache.has(path)) stageAInputCache.set(path, execFileSync('git', ['show', `${STAGE_A_EVIDENCE_HEAD}:${path}`], {maxBuffer: 16 * 1024 * 1024}));
  return stageAInputCache.get(path);
}
function assertBuildInputBinding(provenance, paths = stageABuildInputPaths(), readInput = stageAInput) {
  assert.equal(paths.length, provenance.inputFiles, 'exact build input file count');
  assert.equal(sha256(paths.map((path) => `${path}\0${sha256(readInput(path))}\n`).join('')), provenance.inputSha256, 'raw observations bind the immutable Stage A build inputs');
}

function assertCurrentBuildBoundary(files) {
  const paths = stageABuildInputPaths();
  assert.deepEqual([...files.keys()].sort(), [...paths, 'content/patterns/ddd-01-strategic-ddd-overview.mdx', 'static/img/diagrams/ddd-01-strategic-ddd-context-map.svg'].sort(), 'current tree adds only the two DDD-01 build inputs');
  assert.deepEqual(paths.filter((path) => sha256(files.get(path)) !== sha256(stageAInput(path))), [
    'content/modeling/mod-11-ddd-context-map.mdx', 'content/styles/sty-14-architecture-choice-matrix.mdx', 'data/source-ledger.json', 'data/source-link-health.json', 'data/terminology.json', 'scripts/check-terminology.mjs', 'scripts/content-relations.mjs', 'scripts/content-schema.mjs', 'scripts/validate-content.mjs', 'src/generated/project-status.json', 'src/generated/source-ledger.json', 'src/generated/topic-indexes.json', 'src/generated/topic-manifest.json',
  ], 'only reviewed post-STY-14 and DDD-01 build inputs differ from the observed Stage A inputs');
}
test('STY-14 candidate changes only canonical lifecycle inputs and never rebinds old Browser raw to live inputs', () => {
  const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', ...BUILD_INPUTS], {encoding: 'utf8'}).split('\0').filter(Boolean).sort();
  const files = new Map(paths.map((path) => [path, readFileSync(path)]));
  assertCurrentBuildBoundary(files);
  const provenance = JSON.parse(readFileSync(LOCAL_BROWSER)).buildProvenance;
  assertBuildInputBinding(provenance);
  assert.throws(() => assertBuildInputBinding(provenance, paths, (path) => files.get(path)), /build input file count|immutable Stage A build inputs/u, 'Stage B generated bytes cannot be relabeled as the Stage A observed input identity');
  for (const mutate of [
    (copy) => copy.set('sidebars.ts', Buffer.from('changed')),
    (copy) => copy.delete('sidebars.ts'),
    (copy) => copy.set('src/fabricated.ts', Buffer.from('added')),
    (copy) => copy.set('src/generated/project-status.json', stageAInput('src/generated/project-status.json')),
  ]) {
    const changed = new Map(files); mutate(changed);
    assert.notDeepEqual(changed, files, 'build boundary mutation applies');
    assert.throws(() => assertCurrentBuildBoundary(changed), assert.AssertionError);
  }
});

test('STY-14 local Browser contract binds exact raw bytes and immutable Stage A build inputs', () => {
  const bytes = readFileSync(LOCAL_BROWSER);
  assert.equal(bytes.length, LOCAL_BROWSER_BYTES, 'exact raw bytes');
  assert.equal(sha256(bytes), LOCAL_BROWSER_SHA256, 'exact raw SHA-256');
  assertLocalBrowser(JSON.parse(bytes));
  assertBuildInputBinding(JSON.parse(bytes).buildProvenance);
});

for (const [label, mutate] of [
  ['changed sidebars.ts', (files) => files.set('sidebars.ts', Buffer.from('export default {atlasSidebar: []};\n'))],
  ['deleted sidebars.ts', (files) => files.delete('sidebars.ts')],
]) test(`STY-14 build input binding rejects ${label}`, () => {
  const provenance = JSON.parse(readFileSync(LOCAL_BROWSER)).buildProvenance;
  const paths = stageABuildInputPaths();
  const files = new Map([...new Set([...paths, 'sidebars.ts'])].map((path) => [path, stageAInput(path)]));
  const readInput = (path) => {
    assert.ok(files.has(path), `missing build input: ${path}`);
    return files.get(path);
  };
  assertBuildInputBinding(provenance, paths, readInput);
  const before = new Map(files); mutate(files);
  assert.notDeepEqual(files, before, 'mutation changes actual input bytes or availability');
  assert.throws(() => assertBuildInputBinding(provenance, paths, readInput), /immutable Stage A build inputs|missing build input/u);
});

for (const [label, mutate] of [
  ['omitted sidebars.ts', (paths) => paths.filter((path) => path !== 'sidebars.ts')],
  ['added source input', (paths) => [...paths, 'src/new-build-input.ts'].sort()],
  ['same-count replaced source input', (paths) => paths.map((path) => path === 'src/package.json' ? 'src/new-build-input.ts' : path).sort()],
]) test(`STY-14 build input binding rejects ${label}`, () => {
  const provenance = JSON.parse(readFileSync(LOCAL_BROWSER)).buildProvenance;
  const paths = stageABuildInputPaths(); assertBuildInputBinding(provenance, paths);
  const changed = mutate(paths);
  assert.notDeepEqual(changed, paths, 'mutation changes selected build input membership');
  assert.throws(() => assertBuildInputBinding(provenance, changed, (path) => path === 'src/new-build-input.ts' ? Buffer.from('export default {};\n') : stageAInput(path)), /build input file count|immutable Stage A build inputs/u);
});

for (const [label, mutate] of [
  ['stale input count', (p) => { p.inputFiles = 285; }],
  ['stale input digest', (p) => { p.inputSha256 = INPUT_CORRECTION.previousInputSha256; }],
  ['missing correction disclosure', (p) => { delete p.inputIdentityCorrection; }],
]) test(`STY-14 raw Browser provenance rejects ${label}`, () => {
  const raw = JSON.parse(readFileSync(LOCAL_BROWSER)); assertLocalBrowser(raw);
  const changed = structuredClone(raw); mutate(changed.buildProvenance);
  assert.notDeepEqual(changed, raw, 'mutation changes provenance');
  assert.throws(() => assertLocalBrowser(changed), /exact Browser build provenance/u);
});

const PRODUCTION_BROWSER = 'docs/reviews/evidence/g009-batch15-stage-a-production-browser.json';
const PRODUCTION_BYTES = 37303;
const PRODUCTION_SHA256 = '28967cff0dad4941577ddb62c3c063b4228cd71647dcc0841face601be54feb0';
const PRODUCTION_OBJECT_SHA256 = 'e77bac6d6885b41cd39874eb022389a5a80572b8466ec5735970b1eb13490894';
const PRODUCTION_URL = 'https://sealday.github.io/tego-arch';
const IMPLEMENTATION_SHA = 'ea452848ac0b77b4271c465a3643799abd17d863';
const PRODUCTION_LINES = [
  '- Implementation push: `ea452848ac0b77b4271c465a3643799abd17d863`; fast-forward from `23a0afc5af16bc85f1f8991fde1f53ecf5118e81`; exact merge-base, behind `0`, ahead `13`, tracked clean, merge commits `0`, remote unchanged after review.',
  '- Pages workflow: `Verify and deploy Docusaurus to GitHub Pages`; `.github/workflows/deploy.yml`; event `push`; headSha `ea452848ac0b77b4271c465a3643799abd17d863`; run `34134613000`; `completed / success`; created/started `2026-09-07T14:44:31Z`; updated `2026-09-07T14:49:19Z`.',
  '- Build job: `101782500593`; `completed / success`; `2026-09-07T14:45:10Z` → `2026-09-07T14:49:02Z`. Deploy job: `101783809244`; `completed / success`; `2026-09-07T14:49:07Z` → `2026-09-07T14:49:18Z`.',
  '- Production probes: `8/8 HTTP 200`; `/`, `/styles`, `/styles/sty-14`, `/styles/sty-04`, `/styles/sty-05`, `/styles/sty-06`, `/references` are `text/html; charset=utf-8`; STY-14 SVG is `image/svg+xml`, `9959` bytes, SHA-256 `d2032346802f2e722c39c0c5d8772816ff1233a4c96883d0d38e415129e27de5`, matching reviewed and Browser-decoded bytes.',
  '- Raw production artifact: `docs/reviews/evidence/g009-batch15-stage-a-production-browser.json`; bytes `37303`; SHA-256 `28967cff0dad4941577ddb62c3c063b4228cd71647dcc0841face601be54feb0`; captured `2026-09-07T14:56:11.391Z`.',
  '- Production functional judgment: `SUCCESS / PASS`; `4/4 states`; `12/12 wrapper focus-visible 3px / ArrowRight checks`; `12/12 exact relation href/H1/return checks`; `24/24 source anchors`; SVG loaded; STY-15 actionable total `0`; console and complete CDP diagnostics empty, continuous cursor chain `22→151→390→513→780`.',
  '- Production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`. Desktop-light full-page output had duplicate/incomplete stitching; other captures were viewport-only. No trustworthy durable full-article artifact was retained; functional PASS is not visual acceptance.',
  '- Production collection boundary: fresh Codex in-app Browser / CUA tab after exact-head deployment; exact-href navigation plus Browser back, no physical relation click claim; sources are observed/resolved anchors, not external loads. Theme-selection retries and continuous diagnostics are disclosed in raw evidence; viewport/theme instrumentation was restored and task tabs closed.',
  '- Stage A only: STY-14 remains `published / pending`, projection `84/127/600`; STY-15 absent and non-actionable. Stage B was not performed. The evidence commit own Pages run is recorded only in the ignored task report to avoid recursive evidence commits.',
];
function productionReviewFixture() {
  return readyReviewFixture().replace('- Deployment status: `NOT_RUN`.', '- Deployment status: `SUCCESS / functional PASS; screenshots BLOCKED / NOT_ACCEPTED`.') + '\n## Production Stage A evidence\n\n' + PRODUCTION_LINES.join('\n') + '\n';
}
export function assertProductionStageAReview(source) {
  assert.equal(source, productionReviewFixture(), 'exact production review: no missing displaced duplicate or additive claims');
}
export function assertProductionBrowser(raw) {
  exactKeys(raw, ['schemaVersion', 'tool', 'baseUrl', 'capturedAt', 'publication', 'http', 'collection', 'svgAsset', 'states'], 'production root');
  assert.equal(raw.baseUrl, PRODUCTION_URL);
  assert.equal(raw.publication.implementationSha, IMPLEMENTATION_SHA);
  assert.equal(raw.publication.headSha, IMPLEMENTATION_SHA);
  assert.equal(raw.publication.event, 'push');
  assert.equal(raw.publication.status, 'completed');
  assert.equal(raw.publication.conclusion, 'success');
  assert.deepEqual(raw.publication.jobs.map(({name, status, conclusion}) => ({name, status, conclusion})), ['build', 'deploy'].map((name) => ({name, status: 'completed', conclusion: 'success'})));
  assert.deepEqual(raw.http.routes.map(({route}) => route), ['/', '/styles', '/styles/sty-14', '/styles/sty-04', '/styles/sty-05', '/styles/sty-06', '/references', '/img/diagrams/sty-14-architecture-choice-matrix.svg']);
  for (const route of raw.http.routes) {
    assert.equal(route.status, 200);
    assert.equal(route.url, PRODUCTION_URL + route.route);
    assert.equal(route.contentType, route.route.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8');
    assert.ok(Date.parse(route.observedAt) > Date.parse(raw.publication.updatedAt), 'probe follows deployment');
  }
  const bytes = readFileSync('static/img/diagrams/sty-14-architecture-choice-matrix.svg');
  assert.deepEqual(raw.svgAsset, {bytes: bytes.length, sha256: sha256(bytes), viewBox: '0 0 1600 2200'});
  assert.equal(raw.http.routes.at(-1).sha256, raw.svgAsset.sha256);
  assert.equal(raw.http.routes.at(-1).bytes, raw.svgAsset.bytes);
  assert.deepEqual(raw.collection.order, ['desktopLight', 'desktopDark', 'mobileDark', 'mobileLight']);
  exactKeys(raw.states, raw.collection.order, 'four production states');
  let cursor = 22;
  for (const name of raw.collection.order) {
    const state = raw.states[name], desktop = name.startsWith('desktop'), theme = name.endsWith('Light') ? 'light' : 'dark';
    assert.equal(state.theme, theme);
    assert.deepEqual(state.viewport, {width: desktop ? 1440 : 390, height: desktop ? 1000 : 844});
    assert.deepEqual(state.page, {clientWidth: state.viewport.width, scrollWidth: state.viewport.width});
    assert.equal(state.url, PRODUCTION_URL + '/styles/sty-14');
    assert.equal(state.h1, TITLE);
    assert.deepEqual(state.wrappers.map(({label}) => label), WRAPPER_LABELS);
    assert.equal(state.interactions.length, 3);
    for (const [i, interaction] of state.interactions.entries()) {
      assert.equal(interaction.label, WRAPPER_LABELS[i]);
      assert.equal(interaction.focused, true); assert.equal(interaction.focusVisible, true);
      assert.equal(interaction.outlineWidth, '3px'); assert.equal(interaction.outlineStyle, 'solid');
      assert.equal(interaction.key, 'ArrowRight'); assert.equal(interaction.before, 0);
      assert.equal(interaction.after, desktop && i === 0 ? 0 : 40);
    }
    assert.deepEqual(state.relationChecks, RELATION_CONTRACTS.map(([id, , h1]) => ({href: '/tego-arch/styles/sty-' + id, method: RELATION_METHOD, destination: {url: PRODUCTION_URL + '/styles/sty-' + id, h1, returnHref: '/tego-arch/styles/sty-14'}, returned: {url: PRODUCTION_URL + '/styles/sty-14', h1: TITLE, theme}})));
    assert.deepEqual(state.sources, SOURCE_CONTRACTS.map(([text, href]) => ({text, href, destination: href, rel: 'noopener noreferrer', target: '_blank'})));
    assert.equal(state.sty15ActionableCount, 0); assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics.events, []); assert.equal(state.diagnostics.hasMore, false); assert.equal(state.diagnostics.truncated, false);
    assert.equal(state.diagnostics.afterSequence, cursor); cursor = state.diagnostics.cursor;
    assert.equal(state.screenshot.status, 'BLOCKED'); assert.equal(state.screenshot.acceptance, 'NOT_ACCEPTED'); assert.equal(state.screenshot.artifact, null);
  }
  // Immutable serialization identity locks every observation, including fields beyond the semantic checks.
  // It is a fixed reviewed constant, never derived from the artifact under test.
  assert.equal(sha256(JSON.stringify(raw)), PRODUCTION_OBJECT_SHA256, 'exact production observation identity');
}
test('STY-14 production raw bytes and all semantic observations are bound', () => {
  const bytes = readFileSync(PRODUCTION_BROWSER);
  assert.equal(bytes.length, PRODUCTION_BYTES); assert.equal(sha256(bytes), PRODUCTION_SHA256);
  assertProductionBrowser(JSON.parse(bytes));
});
function observationNodes(value, path = []) {
  return [[path, value], ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, child]) => observationNodes(child, [...path, key])) : [])];
}
function mutationTarget(raw, path) {
  return path.slice(0, -1).reduce((value, key) => value[key], raw);
}
test('STY-14 production rejects changed, deleted and additive fields at every raw node', () => {
  const raw = JSON.parse(readFileSync(PRODUCTION_BROWSER)); assertProductionBrowser(raw);
  let mutations = 0;
  for (const [path, value] of observationNodes(raw)) {
    if (path.length) {
      const changed = structuredClone(raw), target = mutationTarget(changed, path), key = path.at(-1);
      target[key] = value === null ? 'fabricated' : typeof value === 'boolean' ? !value : typeof value === 'number' ? value + 1 : typeof value === 'string' ? value + '-fabricated' : Array.isArray(value) ? [...value, 'fabricated'] : {...value, fabricated: true};
      assert.notDeepEqual(changed, raw, 'mutation applies at ' + path.join('.'));
      assert.throws(() => assertProductionBrowser(changed), {name: 'AssertionError'}, path.join('.')); mutations++;
      const deleted = structuredClone(raw); delete mutationTarget(deleted, path)[key];
      assert.throws(() => assertProductionBrowser(deleted), undefined, 'deleted ' + path.join('.')); mutations++;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const added = structuredClone(raw), node = path.reduce((current, key) => current[key], added);
      node.fabricatedClaim = 'SUCCESS';
      assert.throws(() => assertProductionBrowser(added), {name: 'AssertionError'}, 'additive ' + path.join('.')); mutations++;
    }
  }
  assert.ok(mutations > 1500, 'strong mutation coverage across run/job/route/SVG/state/wrapper/relation/source/diagnostic/screenshot nodes');
});
test('STY-14 production review rejects every changed line and displaced/additive sections', () => {
  const source = productionReviewFixture(); assertProductionStageAReview(source);
  for (const line of source.split('\n').filter(Boolean)) {
    assert.throws(() => assertProductionStageAReview(source.replace(line, line + ' fabricated')), /exact production review/u);
    const displaced = source.replace(line + '\n', '') + '\n' + line + '\n';
    assert.notEqual(displaced, source, 'displacement mutation applies');
    assert.throws(() => assertProductionStageAReview(displaced), /exact production review/u);
  }
  assert.throws(() => assertProductionStageAReview(source + '\n## Extra\nSUCCESS\n'), /exact production review/u);
});

const STAGE_B_RAW_BYTES = 37120;
const STAGE_B_RAW_SHA256 = 'b21fec79aca51707109b3420b5ccfe7d465242c5d4fcddbe3bf62de6af61abba';
const STAGE_B_OBJECT_SHA256 = 'c19f6239b6d3c59366845a41e0ea8dc3a388395bffd566906f5d0a87b61e355a';
const STAGE_B_PUBLICATION = {
  "implementationSha": "c9b0b0bb2c6aa32108b2c7b098c738b995706fcd",
  "reviewedHead": "0cbf5f77c77ae6cca1868ce7279d5057fbc25512",
  "remoteBefore": "215908786dde13e7fb19c752ba61b3bfb340a89b",
  "mergeBase": "215908786dde13e7fb19c752ba61b3bfb340a89b",
  "behind": 0,
  "ahead": 2,
  "trackedClean": true,
  "mergeCommits": 0,
  "remoteUnchangedAfterReview": true,
  "push": "git push origin HEAD:main",
  "workflow": "Verify and deploy Docusaurus to GitHub Pages",
  "workflowPath": ".github/workflows/deploy.yml",
  "event": "push",
  "headSha": "c9b0b0bb2c6aa32108b2c7b098c738b995706fcd",
  "runId": 34139436579,
  "status": "completed",
  "conclusion": "success",
  "createdAt": "2026-09-07T15:39:40Z",
  "startedAt": "2026-09-07T15:39:40Z",
  "updatedAt": "2026-09-07T15:44:24Z",
  "url": "https://github.com/sealday/tego-arch/actions/runs/34139436579",
  "jobs": [
    {
      "name": "build",
      "id": 101797853088,
      "status": "completed",
      "conclusion": "success",
      "startedAt": "2026-09-07T15:40:19Z",
      "completedAt": "2026-09-07T15:44:11Z",
      "url": "https://github.com/sealday/tego-arch/actions/runs/34139436579/job/101797853088"
    },
    {
      "name": "deploy",
      "id": 101799017907,
      "status": "completed",
      "conclusion": "success",
      "startedAt": "2026-09-07T15:44:15Z",
      "completedAt": "2026-09-07T15:44:23Z",
      "url": "https://github.com/sealday/tego-arch/actions/runs/34139436579/job/101799017907"
    }
  ]
};
function assertStageBProductionBrowser(raw) {
  exactKeys(raw, ['schemaVersion', 'tool', 'baseUrl', 'capturedAt', 'publication', 'http', 'collection', 'svgAsset', 'states'], 'Stage B production root');
  assert.equal(raw.schemaVersion, 1);
  assert.equal(raw.tool, 'Codex in-app Browser / CUA CDP');
  assert.equal(raw.baseUrl, PRODUCTION_URL);
  assert.equal(raw.capturedAt, '2026-09-07T15:48:13.701Z');
  assert.deepEqual(raw.publication, STAGE_B_PUBLICATION, 'exact reviewed candidate, implementation, preflight, run and both jobs');
  assert.equal(raw.http.method, 'Node fetch GET; separate from Browser observations');
  assert.deepEqual(raw.http.routes.map(({route}) => route), ['/', '/styles', '/styles/sty-14', '/styles/sty-04', '/styles/sty-05', '/styles/sty-06', '/references', '/img/diagrams/sty-14-architecture-choice-matrix.svg']);
  for (const route of raw.http.routes) {
    exactKeys(route, ['route', 'url', 'status', 'contentType', 'bytes', 'sha256', 'observedAt'], 'Stage B HTTP observation');
    assert.equal(route.status, 200);
    assert.equal(route.url, PRODUCTION_URL + route.route);
    assert.equal(route.contentType, route.route.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8');
    assert.ok(route.bytes > 0);
    assert.match(route.sha256, /^[0-9a-f]{64}$/u);
    assert.ok(Date.parse(route.observedAt) > Date.parse(raw.publication.updatedAt), 'HTTP follows successful deployment');
    assert.ok(Date.parse(route.observedAt) < Date.parse(raw.capturedAt), 'HTTP precedes completed collection');
  }
  const bytes = readFileSync('static/img/diagrams/sty-14-architecture-choice-matrix.svg');
  assert.deepEqual(raw.svgAsset, {bytes: bytes.length, sha256: sha256(bytes), viewBox: '0 0 1600 2200'});
  assert.equal(raw.http.routes.at(-1).sha256, raw.svgAsset.sha256);
  assert.equal(raw.http.routes.at(-1).bytes, raw.svgAsset.bytes);
  assert.deepEqual(raw.collection.order, ['desktopLight', 'desktopDark', 'mobileDark', 'mobileLight']);
  assert.deepEqual(raw.collection.diagnosticMethods, ['Runtime.exceptionThrown', 'Log.entryAdded']);
  assert.deepEqual(raw.collection.consoleLevels, ['warn', 'error']);
  assert.equal(raw.collection.relationMethod, RELATION_METHOD);
  exactKeys(raw.collection, ['tabId', 'visibility', 'diagnosticMethods', 'consoleLevels', 'keyboardMethod', 'relationMethod', 'relationCompatibility', 'sourceMethod', 'order', 'scriptUrls', 'preliminaryAttempts', 'cleanup'], 'Stage B complete collection schema');
  assert.equal(raw.collection.visibility, 'hidden subagent tab; created with visible:false');
  exactKeys(raw.states, raw.collection.order, 'four Stage B production states');
  const observations = [
    ['desktopLight', 1440, 1000, 'light', 800, 23, 147, 166737],
    ['desktopDark', 1440, 1000, 'dark', 800, 147, 263, 186469],
    ['mobileDark', 390, 844, 'dark', 358, 263, 384, 62028],
    ['mobileLight', 390, 844, 'light', 358, 384, 508, 61524],
  ];
  for (const [name, width, height, theme, clientWidth, afterSequence, cursor, screenshotBytes] of observations) {
    const state = raw.states[name];
    exactKeys(state, ['url', 'h1', 'viewport', 'theme', 'page', 'wrappers', 'svg', 'relations', 'sources', 'sty15ActionableCount', 'interactions', 'relationChecks', 'logs', 'diagnostics', 'screenshot'], name);
    assert.equal(state.url, PRODUCTION_URL + '/styles/sty-14');
    assert.equal(state.h1, TITLE);
    assert.deepEqual(state.viewport, {width, height});
    assert.equal(state.theme, theme);
    assert.deepEqual(state.page, {clientWidth: width, scrollWidth: width});
    assert.deepEqual(state.wrappers, WRAPPER_LABELS.map((label, i) => ({label, className: i === 0 ? 'architecture-diagram-scroll' : 'table-wrapper table-wrapper--mapping', role: 'region', tabIndex: 0, clientWidth, scrollWidth: [800, 1527, 1406][i]})));
    assert.deepEqual(state.interactions, WRAPPER_LABELS.map((label, i) => ({label, key: 'ArrowRight', before: 0, after: width === 1440 && i === 0 ? 0 : 40, focused: true, focusVisible: true, outlineWidth: '3px', outlineStyle: 'solid', outlineColor: theme === 'light' ? 'rgb(159, 63, 49)' : i === 0 ? 'rgb(227, 144, 125)' : 'rgba(227, 144, 125, 0.62)'})));
    assert.deepEqual(state.svg, [{srcKind: 'data:image/svg+xml;base64', encodedLength: 13280, complete: true, naturalWidth: 109, naturalHeight: 150, width: 800, height: 1100}]);
    assert.deepEqual(state.relations, RELATION_CONTRACTS.map(([id, text]) => ({text, href: '/tego-arch/styles/sty-' + id, destination: PRODUCTION_URL + '/styles/sty-' + id})));
    assert.deepEqual(state.relationChecks, RELATION_CONTRACTS.map(([id, , h1]) => ({href: '/tego-arch/styles/sty-' + id, method: RELATION_METHOD, destination: {url: PRODUCTION_URL + '/styles/sty-' + id, h1, returnHref: '/tego-arch/styles/sty-14'}, returned: {url: PRODUCTION_URL + '/styles/sty-14', h1: TITLE, theme}})));
    assert.deepEqual(state.sources, SOURCE_CONTRACTS.map(([text, href]) => ({text, href, destination: href, rel: 'noopener noreferrer', target: '_blank'})));
    assert.equal(state.sty15ActionableCount, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {afterSequence, cursor, events: [], hasMore: false, truncated: false});
    assert.deepEqual(state.screenshot, {attempted: true, fullPageRequested: false, bytes: screenshotBytes, artifact: null, status: 'BLOCKED', acceptance: 'NOT_ACCEPTED', reason: 'Viewport screenshot inspected in tool output only; no durable full-article screenshot artifact was retained.'});
  }
  // Fixed observed identity, independent of mutable input: includes every collection and raw node.
  assert.equal(sha256(JSON.stringify(raw)), STAGE_B_OBJECT_SHA256, 'exact Stage B production observation identity');
}
test('STY-14 Stage B production raw binds exact bytes and complete semantic schema', () => {
  const bytes = readFileSync(STAGE_B_BROWSER);
  assert.equal(bytes.length, STAGE_B_RAW_BYTES);
  assert.equal(sha256(bytes), STAGE_B_RAW_SHA256);
  assertStageBProductionBrowser(JSON.parse(bytes));
});
test('STY-14 Stage B production rejects every changed deleted and additive observation node', () => {
  const raw = JSON.parse(readFileSync(STAGE_B_BROWSER)); assertStageBProductionBrowser(raw);
  let mutations = 0;
  for (const [path, value] of observationNodes(raw)) {
    if (path.length) {
      const changed = structuredClone(raw), target = mutationTarget(changed, path), key = path.at(-1);
      target[key] = value === null ? 'fabricated' : typeof value === 'boolean' ? !value : typeof value === 'number' ? value + 1 : typeof value === 'string' ? value + '-fabricated' : Array.isArray(value) ? [...value, 'fabricated'] : {...value, fabricated: true};
      assert.notDeepEqual(changed, raw, 'changed mutation applies at ' + path.join('.'));
      assert.throws(() => assertStageBProductionBrowser(changed), {name: 'AssertionError'}, path.join('.')); mutations++;
      const deleted = structuredClone(raw); delete mutationTarget(deleted, path)[key];
      assert.notDeepEqual(deleted, raw, 'deleted mutation applies at ' + path.join('.'));
      assert.throws(() => assertStageBProductionBrowser(deleted), undefined, 'deleted ' + path.join('.')); mutations++;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const added = structuredClone(raw), node = path.reduce((current, key) => current[key], added);
      node.fabricatedClaim = 'SUCCESS';
      assert.notDeepEqual(added, raw, 'additive mutation applies at ' + path.join('.'));
      assert.throws(() => assertStageBProductionBrowser(added), {name: 'AssertionError'}, 'additive ' + path.join('.')); mutations++;
    }
  }
  assert.equal(mutations, 1788, 'all Stage B run job route SVG state wrapper relation source diagnostic screenshot nodes have strong non-no-op mutations');
});

const browserMutations = [
  ['duplicate wrapper', (s) => { s.wrappers[1] = structuredClone(s.wrappers[0]); }],
  ['swapped wrapper', (s) => { [s.wrappers[1], s.wrappers[2]] = [s.wrappers[2], s.wrappers[1]]; }],
  ['missing wrapper', (s) => { s.wrappers.pop(); }],
  ['wrong viewport', (s) => { s.viewport.width++; }],
  ['wrong theme', (s) => { s.theme = 'system'; }],
  ['page overflow', (s) => { s.page.scrollWidth++; }],
  ['lost focus', (s) => { s.interactions[0].focused = false; }],
  ['lost focus-visible', (s) => { s.interactions[0].focusVisible = false; }],
  ['thin outline', (s) => { s.interactions[0].outlineWidth = '1px'; }],
  ['wrong ArrowRight delta', (s) => { s.interactions[1].after = 0; }],
  ['swapped interaction', (s) => { [s.interactions[0], s.interactions[1]] = [s.interactions[1], s.interactions[0]]; }],
  ['fabricated relation href', (s) => { s.relationChecks[0].href = '/styles/sty-15'; }],
  ['fabricated destination H1', (s) => { s.relationChecks[0].destination.h1 = TITLE; }],
  ['missing reciprocal href', (s) => { delete s.relationChecks[0].destination.returnHref; }],
  ['missing return', (s) => { delete s.relationChecks[0].returned; }],
  ['fabricated physical click', (s) => { s.relationChecks[0].method = 'physical click'; }],
  ['source href', (s) => { s.sources[0].href += '/fake'; }],
  ['source destination', (s) => { s.sources[0].destination += '/fake'; }],
  ['source rel', (s) => { s.sources[0].rel = ''; }],
  ['source target', (s) => { s.sources[0].target = '_self'; }],
  ['unloaded SVG', (s) => { s.svg[0].complete = false; }],
  ['SVG intrinsic size', (s) => { s.svg[0].naturalWidth = 0; }],
  ['SVG rendered size', (s) => { s.svg[0].width = 358; }],
  ['truncated diagnostics', (s) => { s.diagnostics.truncated = true; }],
  ['unread diagnostics', (s) => { s.diagnostics.hasMore = true; }],
  ['discontinuous cursor', (s) => { s.diagnostics.afterSequence++; }],
  ['runtime exception', (s) => { s.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); }],
  ['console error', (s) => { s.logs.push({level: 'error', message: 'failure'}); }],
  ['fabricated STY-15', (s) => { s.sty15ActionableCount = 1; }],
  ['fabricated screenshot PASS', (s) => { s.screenshot.status = 'PASS'; s.screenshot.acceptance = 'ACCEPTED'; }],
  ['fabricated screenshot artifact', (s) => { s.screenshot.artifact = 'history.png'; }],
  ['additive state claim', (s) => { s.deployment = 'SUCCESS'; }],
];
for (const [stateName] of STATE_CONTRACTS) for (const [label, mutate] of browserMutations) {
  test(`STY-14 raw Browser rejects ${stateName}: ${label}`, () => {
    const raw = JSON.parse(readFileSync(LOCAL_BROWSER));
    assertLocalBrowser(raw);
    const copy = structuredClone(raw); mutate(copy.states[stateName]);
    assert.notDeepEqual(copy, raw, 'mutation applies');
    assert.throws(() => assertLocalBrowser(copy), {name: 'AssertionError'});
  });
}
