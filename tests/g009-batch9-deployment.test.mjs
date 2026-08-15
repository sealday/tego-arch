import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

const ARTICLE = 'content/styles/sty-08-actor-model.mdx';
const DRAWIO = 'diagrams/sty-08-actor-order-fulfillment.drawio';
const SVG = 'static/img/diagrams/sty-08-actor-order-fulfillment.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch9.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch9-stage-a-browser.json';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch8.md';
const BACKLOG = 'docs/content-backlog.md';
const CANDIDATE_HEAD = 'bbb2f4234c4c24993dbea108d2a19a751e778409';
const EVIDENCE_HEAD = '4923b7da22d79ecc32400669526196ca852885a4';
const RAW_BROWSER_HASH = 'fa3fdecb77c55c8e2a013d95bbe9684afde05e3027583a9b3d1feb405a758932';
const IMMEDIATE_REVIEW_HASH = '2915584034c0d480ee04713c9fadee2839f03d112ced139901a3fb2033d8ac7e';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'dba312f190706ae7112ea057addefe58ceff4cdd15bad39264efbd58b129c354';
const ARTIFACT_HASHES = new Map([
  [ARTICLE, 'b9f0af60f535bdce6269e5ffce3ec4aee03730fde344957eee0d3f02196c377c'],
  [DRAWIO, 'd323a34b4130c843f3c3c96547bf61a690d97dcccd93794b9c228f435548e62b'],
  [SVG, '93a23b5c57334e96d08908146f82677faad887a30cb45b1f8066633b6e185e65'],
  [LEDGER, '29b62da07c5dedbf8d87baaf56ccd4bce1036b5aadda176b1d7ee64ac908557e'],
]);
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPERS = [
  '共享订单状态与订单 Actor 履约边界对照图，可横向滚动',
  'Actor、线程、消息消费者、事件驱动与微服务机制对照表，可横向滚动',
  'Actor Model 采用、谨慎采用与停止决策表，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/styles/sty-06', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
  ['/tego-arch/styles/sty-07', '面向服务架构：用稳定合同连接企业能力，也约束集中治理'],
  ['/tego-arch/cases/erlang-otp-supervision-tree', '监督树：把失败恢复设计成层级控制协议'],
];
const SOURCE_LINKS = [
  'https://www.ijcai.org/Proceedings/73/Papers/027B.pdf',
  'https://doc.akka.io/libraries/akka-core/2.10.21/typed/actors.html',
  'https://doc.akka.io/libraries/akka-core/2.10.21/general/message-delivery-reliability.html',
  'https://doc.akka.io/libraries/akka-core/2.10.21/general/remoting.html',
  'https://learn.microsoft.com/en-us/dotnet/orleans/overview',
  'https://www.erlang.org/doc/system/sup_princ.html',
];
const STATE_CONTRACTS = Object.freeze({
  desktopLight: Object.freeze({
    theme: 'light', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1171, 1764], deltas: [0, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  desktopDark: Object.freeze({
    theme: 'dark', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1171, 1764], deltas: [0, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
  mobileLight: Object.freeze({
    theme: 'light', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1171, 1764], deltas: [40, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  mobileDark: Object.freeze({
    theme: 'dark', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1171, 1764], deltas: [40, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
});
const SVG_GEOMETRY = Object.freeze({
  src: '/tego-arch/assets/images/sty-08-actor-order-fulfillment-fa568ecfe3b507ce8ca88416844f5b3d.svg',
  loaded: true,
  naturalWidth: 48,
  naturalHeight: 150,
  renderedWidth: 800,
  renderedHeight: 2480,
});
const SCREENSHOT_REJECTION_REASON = 'The in-app Browser full-page capture repeated the opening viewport instead of covering the complete page and architecture diagram, so it cannot support trustworthy whole-page visual review.';
const SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-a-bbb2f42-formal-1.png', bytes: 1778121, sha256: 'baa706e8c005101211ea0f46b5af86bad5a1da1bdbc3ec6845cf60bf34c6dab2'},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-a-bbb2f42-formal-2.png', bytes: 1791254, sha256: '95889769eeea867285baaae655d300b0c0bcd1dc61ccab0dbbe23b43b46f9f51'},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-a-bbb2f42-formal-3.png', bytes: 838206, sha256: 'c8f6898b8bab04415a0c4e6ae587690bbe5acbba5954545e4848a541492c943f'},
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

const [review, browserBytes, immediateReviewBytes, backlog, status, manifest, indexes, publicLedger] = await Promise.all([
  optional(REVIEW, 'utf8'), optional(RAW_BROWSER), required(IMMEDIATE_REVIEW), required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-indexes.json', 'utf8').then(JSON.parse),
  required('src/generated/source-ledger.json', 'utf8').then(JSON.parse),
]);

function assertProjection() {
  assert.deepEqual({completed_topics: status.completed_topics, content_documents: status.content_documents, governed_sources: status.governed_sources}, {completed_topics: 60, content_documents: 103, governed_sources: 535});
  assert.equal(publicLedger.sources.length, 535);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-08')?.published, topics.get('STY-08')?.status.value, styles.get('STY-08')?.published], [true, 'pending', true]);
  assert.deepEqual([topics.get('STY-09')?.published, topics.get('STY-09')?.status.value, styles.get('STY-09')?.published], [false, 'pending', false]);
}

async function assertSty09NonActionable() {
  const documents = await readContentDocuments('content');
  for (const document of documents) assert.equal(extractInternalLinks(document).includes('/styles/sty-09'), false, `${document.file} STY-09 non-actionable`);
}

function assertBrowser(evidence) {
  assert.ok(evidence, `${RAW_BROWSER} exists and parses`);
  assert.equal(evidence.candidateHead, CANDIDATE_HEAD);
  assert.deepEqual(Object.keys(evidence.states), STATES);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'http://127.0.0.1:3418/tego-arch/styles/sty-08',
  });
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
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
      assert.equal(relation.navigation, 'direct exact-href navigation; no physical relation click claimed');
    }
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_LINKS);
    for (const source of state.geometry.sources) assert.deepEqual([source.target, source.rel], ['_blank', 'noopener noreferrer']);
    assert.equal(state.geometry.sty09, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {events: [], hasMore: false, truncated: false});
  }
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram; no visual PASS is claimed.',
    attempts: SCREENSHOT_ATTEMPTS,
  });
}

async function assertReview(source) {
  assert.match(source, /^# G009 Batch 9 Stage A Review$/mu);
  const projection = section(source, 'Stage A projection');
  for (const literal of [
    'Projection: `60 completed topics / 103 content documents / 535 governed sources`.',
    'STY-08: `published / pending`.',
    'STY-09: `unpublished / pending / non-actionable`; actionable route count: `0`.',
  ]) assert.ok(projection.includes(literal), literal);
  const identities = section(source, 'Artifact identities');
  for (const [path, expectedHash] of ARTIFACT_HASHES) {
    const bytes = await required(path);
    assert.equal(sha256(bytes), expectedHash, `${path} immutable artifact bytes`);
    assert.match(identities, new RegExp(`\\| ${escapeRegExp(`\`${path}\``)} \\| ${bytes.length.toLocaleString('en-US')} \\| ${escapeRegExp(`\`${expectedHash}\``)} \\|`, 'u'));
  }
  const qa = section(source, 'Local in-app Browser QA');
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  for (const literal of [
    `The exact implementation candidate \`${CANDIDATE_HEAD}\` was rebuilt and served at \`http://127.0.0.1:3418/tego-arch/styles/sty-08\``,
    'States accepted: `4/4`; wrapper interaction checks: `12/12`',
    'Relation destination/H1/return checks: `16/16`.',
    'The Erlang/OTP case route\'s rendered H1 is `监督树：把失败恢复设计成层级控制协议`',
    'SVG loaded in every state: intrinsic `48x150`; rendered `800x2480`.',
    'exact href/`_blank`/`noopener noreferrer` checks: `24/24`; STY-09 actionable count: `0` per state.',
    'warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false` and `truncated=false`.',
    `Raw Browser JSON: \`${RAW_BROWSER}\`, SHA-256 \`${sha256(browserBytes)}\`.`,
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.',
    'Exactly three fresh IAB full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram.',
    'No Chrome fallback, prior raw, old screenshot or visual PASS is claimed.',
  ]) assert.ok(qa.includes(literal), literal);
  const checkpoint = section(source, 'Independent review checkpoint');
  for (const literal of [
    `Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`,
    `Exact evidence head: \`${EVIDENCE_HEAD}\`.`,
    'Independent code/spec/security review: `READY / APPROVE`; findings: `0`.',
    'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), literal);
}

test('preserves the complete immediate STY-07 backlog suffix and Batch 8 review bytes', () => {
  assert.equal(sha256(immediateReviewBytes), IMMEDIATE_REVIEW_HASH);
  const lines = backlog.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(lines.length, 1, 'one current release baseline');
  const marker = '- **当前发布基线：** ';
  assert.ok(lines[0].startsWith(marker));
  const suffix = lines[0].slice(marker.length);
  assert.match(suffix, /^2026-08-14 G009 Batch 8 已完成 STY-07/u);
  assert.equal(sha256(suffix), IMMEDIATE_BACKLOG_SUFFIX_HASH);
  for (const mutated of [Buffer.concat([immediateReviewBytes, Buffer.from('x')]), immediateReviewBytes.subarray(0, -1)]) assert.notEqual(sha256(mutated), IMMEDIATE_REVIEW_HASH);
  for (const mutated of [`${suffix}x`, suffix.slice(0, -1)]) assert.notEqual(sha256(mutated), IMMEDIATE_BACKLOG_SUFFIX_HASH);
});

test('projects canonical STY-08 Stage A and leaves STY-09 pending and non-actionable', async () => {
  assertProjection();
  await assertSty09NonActionable();
});

test('binds exact artifacts, tracked Browser bytes, and final independent review verdicts', async () => {
  const browser = browserBytes && JSON.parse(browserBytes);
  assertBrowser(browser);
  await assertReview(review);
});

test('binds complete tracked Browser bytes to one fixed SHA-256', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  assert.equal(sha256(browserBytes), RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([browserBytes, Buffer.from('x')])), RAW_BROWSER_HASH);
  assert.notEqual(sha256(browserBytes.subarray(0, -1)), RAW_BROWSER_HASH);
});

test('rejects Browser semantic, diagnostic, screenshot, and exact-head mutations', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  const browser = JSON.parse(browserBytes);
  assertBrowser(browser);
  const mutations = [
    (copy) => { copy.candidateHead = '0'.repeat(40); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.page.scrollWidth += 1; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0]); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[0].clientWidth += 1; },
    (copy) => { copy.states.mobileLight.geometry.wrappers[2].scrollWidth += 1; },
    (copy) => { copy.states.desktopDark.interactions.reverse(); },
    (copy) => { copy.states.desktopDark.interactions[1].expectedScrollDelta += 1; },
    (copy) => { copy.states.desktopLight.interactions[0].after.scrollLeft += 1; },
    (copy) => { copy.states.desktopDark.interactions[2].before.outline = 'none'; },
    (copy) => { copy.states.mobileDark.interactions[0].before.focusVisible = false; },
    (copy) => { copy.states.mobileLight.relations[0].returnedToArticle = false; },
    (copy) => { copy.states.mobileDark.relations[0] = {...copy.states.mobileDark.relations[0], href: '/tego-arch/styles/sty-99', h1: 'fabricated', expectedH1: 'fabricated'}; },
    (copy) => { copy.states.desktopLight.relations.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.desktopLight.geometry.svg.naturalWidth = 0; },
    (copy) => { copy.states.desktopDark.geometry.svg.renderedHeight += 1; },
    (copy) => { copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'; },
    (copy) => { copy.states.desktopDark.geometry.sources[0].rel = ''; },
    (copy) => { copy.states.mobileLight.geometry.sources.reverse(); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.states.mobileDark.geometry.sty09 = 1; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.reason = 'fabricated visual coverage'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts[0].path = '/tmp/fabricated.png'; },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(browser); mutate(copy);
    assert.throws(() => assertBrowser(copy), {name: 'AssertionError'});
  }
});

test('rejects wrong review heads, weakened verdicts, stale PENDING, fabricated deployment, and fabricated visual PASS', async () => {
  await assertReview(review);
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    [`Exact evidence head: \`${EVIDENCE_HEAD}\`.`, `Exact evidence head: \`${'1'.repeat(40)}\`.`],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `NOT READY`; findings: `0`.'],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `READY / APPROVE`; findings: `1`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PENDING`; findings: `0`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `1`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `BLOCKED`; blockers: `0`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `1`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Scope boundary: `STAGE_A_ONLY`;', 'Scope boundary: `STAGE_B`;'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `PASS`.'],
    ['No Chrome fallback, prior raw, old screenshot or visual PASS is claimed.', 'Visual PASS is claimed.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    await assert.rejects(() => assertReview(mutated), {name: 'AssertionError'});
  }
});
