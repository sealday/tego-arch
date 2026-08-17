import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

const ARTICLE = 'content/styles/sty-09-pipes-and-filters.mdx';
const DRAWIO = 'diagrams/sty-09-pipes-filters-order-processing.drawio';
const SVG = 'static/img/diagrams/sty-09-pipes-filters-order-processing.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch10.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch10-stage-a-browser.json';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch9.md';
const BACKLOG = 'docs/content-backlog.md';
const IMPLEMENTATION_HEAD = 'd2748e204cd55654d1cd5b6dce4fdc88ca95bbb4';
const EVIDENCE_HEAD = 'PENDING';
const RAW_BROWSER_BYTES = 24_971;
const RAW_BROWSER_HASH = 'acc7c8154a8c6199cd92b8d68d258d7a0fb5e2e86eb8a1931219d36d9c72d7bf';
const IMMEDIATE_REVIEW_HASH = 'f7d0aba59dd69d6479bbfbdb6f9f3cf1befadcf076c44ff5f97f31d6452778ed';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = '3a8d6ccda815614132a33ca8ec2c0dca286628c20900d9e32a4403f0ffd56c6b';
const STABLE_ARTIFACT_HASHES = new Map([
  [ARTICLE, '1dcf55ace2a6b8f30da94e81d36d9f79a16db400bc419c35318cc8dbe8eba7b6'],
  [DRAWIO, '36da252d3fe71b1f0c3df6db5a887677b83def7ee11f542f938c9d3027fbf97c'],
  [SVG, '1568fc09dbb6637d54e66d0058d9479cbf2e59d990753489781a119a06fb1a29'],
  [LEDGER, 'cc94104f499f07400785118fb791efed66d9d4588f7b3ba9de160eb031e29a7f'],
]);
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPERS = [
  '订单数据批处理与流处理双轨管道图，可横向滚动',
  '批处理轨与流处理轨八维机制对照表，可横向滚动',
  'Pipes and Filters 六类故障检测、响应、停止条件与人工所有者表，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/styles/sty-06', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
  ['/tego-arch/cases/apache-kafka-consumer-groups', '消费者组：用分区所有权组织可重放的智能体工作'],
  ['/tego-arch/quality-attributes/qa-03', '性能、延迟、吞吐与容量'],
  ['/tego-arch/paths/reliability-state', '可靠性与状态管理'],
];
const SOURCE_LINKS = [
  'https://learn.microsoft.com/en-us/azure/architecture/patterns/pipes-and-filters',
  'https://beam.apache.org/documentation/programming-guide/',
  'https://www.reactive-streams.org/',
  'https://www.gnu.org/software/bash/manual/html_node/Pipelines.html',
];
const STATE_CONTRACTS = Object.freeze({
  desktopLight: Object.freeze({
    theme: 'light', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1024, 1024], deltas: [0, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  desktopDark: Object.freeze({
    theme: 'dark', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1024, 1024], deltas: [0, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
  mobileLight: Object.freeze({
    theme: 'light', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1024, 1024], deltas: [40, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  mobileDark: Object.freeze({
    theme: 'dark', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1024, 1024], deltas: [40, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
});
const SVG_GEOMETRY = Object.freeze({
  loaded: true,
  naturalHeight: 150,
  naturalWidth: 120,
  renderedHeight: 1000,
  renderedWidth: 800,
  src: '/tego-arch/assets/images/sty-09-pipes-filters-order-processing-a183aff7774b7e91150caf303ac06eb8.svg',
});
const SCREENSHOT_REJECTION_REASON = 'The in-app Browser full-page capture repeated viewport content and omitted complete architecture-diagram coverage, so the original bytes cannot support trustworthy whole-page visual review.';
const SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-d2748e2-desktop-light.png', bytes: 1_488_746, sha256: '22383e2430533ad43dae9eb9e1bfee235e050ea8228363aa8428fe2d2e6383e9', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-d2748e2-desktop-dark.png', bytes: 1_519_296, sha256: '456460787a2ecf5c30c006ef35a8a8d8764c68d471d6848b5ac81497c563b766', kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-d2748e2-mobile-light.png', bytes: 618_851, sha256: '6e88baad8ec4f9899191936a82512edfc7bf096bf1cdf740e30d11e342a2a0fc', kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
]);

const rootUrl = new URL('../', import.meta.url);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
async function required(path, encoding) { return readFile(new URL(path, rootUrl), encoding); }
async function optional(path, encoding) {
  try { return await required(path, encoding); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; }
}
function section(source, heading) {
  assert.ok(source, `${REVIEW} exists`);
  const starts = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const current = starts.filter((match) => match[1] === heading);
  assert.equal(current.length, 1, `${heading} section`);
  const next = starts.find((match) => match.index > current[0].index);
  return source.slice(current[0].index + current[0][0].length, next?.index ?? source.length).trim();
}
function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice('- **当前发布基线：** '.length);
}
function assertImmediateHistory(reviewBytes = immediateReviewBytes, backlogSource = backlog) {
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_HASH, `${IMMEDIATE_REVIEW} complete immutable bytes`);
  assert.equal(sha256(currentReleaseBaseline(backlogSource)), IMMEDIATE_BACKLOG_SUFFIX_HASH, 'complete immediate STY-08 backlog suffix');
}
function assertStageABacklog(source = backlog) {
  const sty09 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-09 /u.test(line));
  const sty10 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-10 /u.test(line));
  assert.equal(sty09.length, 1, 'one canonical STY-09 backlog line');
  assert.equal(sty10.length, 1, 'one canonical STY-10 backlog line');
  assert.match(sty09[0], /^- \[ \] \*\*STY-09 /u);
  assert.match(sty10[0], /^- \[ \] \*\*STY-10 /u);
  assert.doesNotMatch(source, /\]\(\/styles\/sty-10\)/u);
  assertImmediateHistory(immediateReviewBytes, source);
}
function assertProjection() {
  assert.deepEqual(
    {completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources},
    {completed: 61, documents: 105, sources: 544},
  );
  assert.equal(publicLedger.sources.length, 544);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-09')?.published, topics.get('STY-09')?.status.value, styles.get('STY-09')?.published], [true, 'pending', true]);
  assert.deepEqual([topics.get('STY-10')?.published, topics.get('STY-10')?.status.value, styles.get('STY-10')?.published], [false, 'pending', false]);
}
async function assertSty10NonActionable() {
  const documents = await readContentDocuments('content');
  for (const document of documents) assert.equal(extractInternalLinks(document).includes('/styles/sty-10'), false, `${document.file} STY-10 non-actionable`);
}
async function assertArtifactIdentities(source) {
  const identities = section(source, 'Artifact identities');
  for (const [path, expectedHash] of STABLE_ARTIFACT_HASHES) {
    const bytes = await required(path);
    assert.equal(sha256(bytes), expectedHash, `${path} immutable artifact bytes`);
    assert.match(identities, new RegExp(`\\| ${escapeRegExp(`\`${path}\``)} \\| ${bytes.length.toLocaleString('en-US')} \\| ${escapeRegExp(`\`${expectedHash}\``)} \\|`, 'u'));
  }
}
function assertFunctionalStates(evidence) {
  assert.deepEqual(Object.keys(evidence.states), STATES);
  for (const [key, expected] of Object.entries(STATE_CONTRACTS)) {
    const state = evidence.states[key];
    assert.deepEqual([state.theme, state.viewport.width, state.viewport.height], [expected.theme, expected.width, expected.height]);
    assert.deepEqual(state.geometry.page, {clientWidth: expected.width, scrollWidth: expected.width});
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPERS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth}) => clientWidth), expected.clients);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth}) => scrollWidth), expected.scrolls);
    assert.deepEqual(state.interactions.map(({index}) => index), [0, 1, 2]);
    assert.equal(state.geometry.wrappers.length, state.interactions.length);
    for (const [index, interaction] of state.interactions.entries()) {
      assert.deepEqual(interaction, {
        index,
        label: WRAPPERS[index],
        key: 'ArrowRight',
        expectedScrollDelta: expected.deltas[index],
        before: {focus: true, focusVisible: true, outline: expected.outlines[index], scrollLeft: 0},
        after: {focus: true, focusVisible: true, outline: expected.outlines[index], scrollLeft: expected.deltas[index]},
      });
    }
    assert.deepEqual(state.geometry.svg, SVG_GEOMETRY);
    assert.deepEqual(state.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    assert.equal(new Set(state.relations.map(({href}) => href)).size, RELATIONS.length, 'unique relation href map');
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
      assert.equal(relation.navigation, 'direct exact-href navigation; no physical relation click claimed');
    }
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_LINKS);
    for (const source of state.geometry.sources) assert.deepEqual([source.target, source.rel], ['_blank', 'noopener noreferrer']);
    assert.equal(state.geometry.sty10, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {events: [], hasMore: false, truncated: false});
  }
}
function assertBrowser(evidence) {
  assert.ok(evidence, `${RAW_BROWSER} exists and parses`);
  assert.deepEqual(Object.keys(evidence), ['candidateHead', 'collection', 'states', 'screenshotEvidence']);
  assert.equal(evidence.candidateHead, IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'http://127.0.0.1:3420/tego-arch/styles/sty-09',
  });
  assertFunctionalStates(evidence);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated viewport content and omitted complete architecture-diagram coverage; no visual PASS is claimed.',
    attempts: SCREENSHOT_ATTEMPTS,
  });
}
function assertReviewCommon(source) {
  assert.match(source, /^# G009 Batch 10 Stage A Review$/mu);
  const projection = section(source, 'Stage A projection');
  for (const literal of [
    'Projection: `61 completed topics / 105 content documents / 544 governed sources`.',
    'STY-09: `published / pending`.',
    'STY-10: `unpublished / pending / non-actionable`; actionable route count: `0`.',
  ]) assert.ok(projection.includes(literal), literal);
  const history = section(source, 'Immutable immediate history');
  assert.ok(history.includes(`Complete immediate STY-08 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\`.`));
  assert.ok(history.includes(`Complete immediate STY-08 backlog suffix SHA-256: \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\`.`));
  const qa = section(source, 'Local in-app Browser QA');
  for (const literal of [
    `The exact implementation candidate \`${IMPLEMENTATION_HEAD}\` was rebuilt and served at \`http://127.0.0.1:3420/tego-arch/styles/sty-09\``,
    'States accepted: `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks: `12/12`.',
    'Relation destination/H1/return checks: `20/20`.',
    'SVG loaded in every state: intrinsic `120x150`; rendered `800x1000`.',
    'Source href/`_blank`/`noopener noreferrer` checks: `16/16`; STY-10 actionable count: `0` per state.',
    'warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false` and `truncated=false`.',
    `Raw Browser JSON: \`${RAW_BROWSER}\`; \`${RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${RAW_BROWSER_HASH}\`.`,
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.',
    'Exactly three fresh IAB full-page captures repeated viewport content and omitted complete architecture-diagram coverage.',
    'No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed.',
  ]) assert.ok(qa.includes(literal), literal);
}
function assertPendingReview(source) {
  assertReviewCommon(source);
  const checkpoint = section(source, 'Independent review checkpoint');
  const expected = [
    `Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`,
    'Exact evidence head: `PENDING`.',
    'Independent code/spec/security review: `PENDING`.',
    'Independent content/evidence/rights review: `PENDING`.',
    'Independent architecture/invariant review: `PENDING`.',
    'Final Stage A review judgment: `PENDING`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ].map((literal) => `- ${literal}`).join('\n');
  assert.equal(checkpoint, expected, 'exact PENDING checkpoint with no contradictory appended verdict');
}

const [review, browserBytes, immediateReviewBytes, backlog, status, manifest, indexes, publicLedger] = await Promise.all([
  optional(REVIEW, 'utf8'), optional(RAW_BROWSER), required(IMMEDIATE_REVIEW), required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-indexes.json', 'utf8').then(JSON.parse),
  required('src/generated/source-ledger.json', 'utf8').then(JSON.parse),
]);

test('locks complete immediate STY-08 review and backlog history with mutation sensitivity', () => {
  assertImmediateHistory();
  for (const changedReview of [Buffer.concat([immediateReviewBytes, Buffer.from('x')]), immediateReviewBytes.subarray(0, -1)]) {
    assert.throws(() => assertImmediateHistory(changedReview), assert.AssertionError);
  }
  const baseline = currentReleaseBaseline(backlog);
  for (const changedBaseline of [`${baseline}x`, baseline.slice(0, -1)]) {
    const changedBacklog = backlog.replace(baseline, changedBaseline);
    assert.throws(() => assertImmediateHistory(immediateReviewBytes, changedBacklog), assert.AssertionError);
  }
  const changedCurrentSty10 = backlog.replace('- [ ] **STY-10 ', '- [x] **STY-10 ');
  assert.notEqual(changedCurrentSty10, backlog, 'current STY-10 mutation applies');
  assert.throws(() => assertStageABacklog(changedCurrentSty10), assert.AssertionError);
});

test('projects canonical STY-09 Stage A truth while STY-10 remains pending and non-actionable', async () => {
  assertProjection();
  assertStageABacklog();
  await assertSty10NonActionable();
});

test('binds exact STY-09 artifacts, tracked Browser semantics, and PENDING review slots', async () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  assertBrowser(JSON.parse(browserBytes));
  assertPendingReview(review);
  await assertArtifactIdentities(review);
  assert.equal(EVIDENCE_HEAD, 'PENDING');
});

test('binds complete tracked Browser bytes to one fixed SHA-256', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  assert.equal(browserBytes.length, RAW_BROWSER_BYTES);
  assert.equal(sha256(browserBytes), RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([browserBytes, Buffer.from('x')])), RAW_BROWSER_HASH);
  assert.notEqual(sha256(browserBytes.subarray(0, -1)), RAW_BROWSER_HASH);
});

test('rejects Browser head, state, geometry, interaction, relation, source, SVG, diagnostic, STY-10 and screenshot mutations', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  const browser = JSON.parse(browserBytes);
  assertBrowser(browser);
  const mutations = [
    (copy) => { copy.candidateHead = '0'.repeat(40); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.page.scrollWidth += 1; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0]); },
    (copy) => { copy.states.mobileLight.geometry.wrappers[2].scrollWidth += 1; },
    (copy) => { copy.states.desktopDark.interactions.reverse(); },
    (copy) => { copy.states.desktopDark.interactions[1].expectedScrollDelta += 1; },
    (copy) => { copy.states.desktopLight.interactions[0].after.scrollLeft += 1; },
    (copy) => { copy.states.mobileDark.interactions[0].before.focusVisible = false; },
    (copy) => { copy.states.mobileLight.relations[0].returnedToArticle = false; },
    (copy) => { copy.states.mobileDark.relations[0] = {...copy.states.mobileDark.relations[0], href: '/tego-arch/styles/sty-99', h1: 'fabricated', expectedH1: 'fabricated'}; },
    (copy) => { copy.states.desktopLight.relations.reverse(); },
    (copy) => { copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'; },
    (copy) => { copy.states.mobileLight.geometry.sources.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.desktopDark.geometry.svg.renderedHeight += 1; },
    (copy) => { copy.states.mobileDark.geometry.sty10 = 1; },
    (copy) => { copy.states.mobileDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.reason = 'fabricated visual coverage'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts[0].path = '/tmp/fabricated.png'; },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(browser);
    mutate(copy);
    assert.throws(() => assertBrowser(copy), {name: 'AssertionError'});
  }
});

test('rejects review head, premature verdict, deployment, scope and fabricated visual PASS mutations', () => {
  assertPendingReview(review);
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    ['Exact evidence head: `PENDING`.', `Exact evidence head: \`${'1'.repeat(40)}\`.`],
    ['Independent code/spec/security review: `PENDING`.', 'Independent code/spec/security review: `READY / APPROVE`; findings: `0`.'],
    ['Independent content/evidence/rights review: `PENDING`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.'],
    ['Independent architecture/invariant review: `PENDING`.', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.'],
    ['Final Stage A review judgment: `PENDING`.', 'Final Stage A review judgment: `READY`.'],
    ['Final Stage A review judgment: `PENDING`.', 'Final Stage A review judgment: `PENDING`.\n- Final Stage A review judgment: `READY`.'],
    ['Scope boundary: `STAGE_A_ONLY`;', 'Scope boundary: `STAGE_B`;'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `NOT_RUN`.\n- Deployment status: `SUCCESS`.'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `PASS`.'],
    ['No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed.', 'Visual PASS is claimed.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertPendingReview(mutated), {name: 'AssertionError'});
  }
});
