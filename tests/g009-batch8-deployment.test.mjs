import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const ARTICLE = 'content/styles/sty-07-service-oriented-architecture.mdx';
const DRAWIO = 'diagrams/sty-07-soa-microservices-order-fulfillment.drawio';
const SVG = 'static/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch8.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch8-stage-a-browser.json';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch7.md';
const BACKLOG = 'docs/content-backlog.md';
const CANDIDATE_HEAD = '4398f045f0595043878102d59353bf1e3ae4de21';
const RAW_BROWSER_HASH = 'b2a09ad041c156faa1493867741dd7b1c74241fbd96005903335b3d5076d4122';
const IMMEDIATE_REVIEW_HASH = 'd8438c66127e9b4411d5dc121a19842aaaab4e03c31a2285cb02fcfde689cf6b';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'dc7180a0503ebcc2e285d8425e4e37f87b6125339823ba5577eb822992aa7109';
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPERS = [
  '经典面向服务架构与微服务订单履约机制对照图，可横向滚动',
  '经典面向服务架构与微服务八维机制对照表，可横向滚动',
  '面向服务架构采用、收紧与停止决策表，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-04', '模块化单体：在一个部署单元内保护业务边界'],
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/styles/sty-06', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
  ['/tego-arch/cases/temporal-saga-durable-execution', '持久化执行与长事务：为长时智能体任务建立可恢复边界'],
];
const SOURCE_IDS = [
  'src-oasis-soa-reference-model-1-0',
  'src-oasis-soa-reference-architecture-foundation-1-0',
  'src-w3c-web-services-architecture',
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-atlas-sty07-soa-microservices-order-fulfillment',
];
const SOURCE_LINKS = [
  'https://docs.oasis-open.org/soa-rm/v1.0/soa-rm.html',
  'https://docs.oasis-open.org/soa-rm/soa-ra/v1.0/soa-ra.html',
  'https://www.w3.org/TR/ws-arch/',
  'https://martinfowler.com/articles/microservices.html',
  'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices',
];

const loadText = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8').catch((error) => error?.code === 'ENOENT' ? '' : Promise.reject(error));
const [review, browserBytes, immediateReviewBytes, backlog, status, manifest, indexes, publicLedger] = await Promise.all([
  loadText(REVIEW),
  readFile(new URL(`../${RAW_BROWSER}`, import.meta.url)).catch((error) => error?.code === 'ENOENT' ? Buffer.from('{}') : Promise.reject(error)),
  readFile(new URL(`../${IMMEDIATE_REVIEW}`, import.meta.url)),
  loadText(BACKLOG),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const browser = JSON.parse(browserBytes);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

function section(source, heading) {
  const starts = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const current = starts.filter((match) => match[1] === heading);
  assert.equal(current.length, 1, `${heading} section`);
  const next = starts.find((match) => match.index > current[0].index);
  return source.slice(current[0].index + current[0][0].length, next?.index ?? source.length).trim();
}

function assertProjection() {
  assert.deepEqual({completed_topics: status.completed_topics, content_documents: status.content_documents, governed_sources: status.governed_sources}, {completed_topics: 59, content_documents: 102, governed_sources: 529});
  assert.equal(publicLedger.sources.length, 529);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-07')?.published, topics.get('STY-07')?.status.value, styles.get('STY-07')?.published], [true, 'pending', true]);
  assert.deepEqual([topics.get('STY-08')?.published, topics.get('STY-08')?.status.value, styles.get('STY-08')?.published], [false, 'pending', false]);
  assert.deepEqual(SOURCE_IDS.filter((id) => publicLedger.sources.some((source) => source.id === id)), SOURCE_IDS);
}

function assertBrowser(evidence) {
  assert.equal(evidence.candidateHead, CANDIDATE_HEAD);
  assert.deepEqual(Object.keys(evidence.states), STATES);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: evidence.screenshotEvidence.reason,
    attempts: evidence.screenshotEvidence.attempts,
  });
  assert.match(evidence.screenshotEvidence.reason, /Three fresh in-app Browser full-page captures repeated viewport slices/iu);
  assert.equal(evidence.screenshotEvidence.attempts.length, 3);
  const attemptReason = 'The in-app Browser full-page capture repeated a viewport slice and did not provide trustworthy whole-page visual coverage of both the opening and architecture diagram.';
  assert.deepEqual(evidence.screenshotEvidence.attempts, [
    {ordinal:1,state:'desktopLight',viewport:{width:1440,height:1000},kind:'fullPage',status:'CAPTURED_REJECTED',reason:attemptReason,path:'/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty07-stage-a-4398f04-formal-1.png',bytes:1299746,sha256:'1e7aff6f0a7dab8df27d309cd5df7ea991a6bf50cb0fa6de4513a9248c3af4da'},
    {ordinal:2,state:'desktopDark',viewport:{width:1440,height:1000},kind:'fullPage',status:'CAPTURED_REJECTED',reason:attemptReason,path:'/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty07-stage-a-4398f04-formal-2.png',bytes:1308256,sha256:'05ff527c85901a250c6355ec7d3d55b57b16950b166d220be52b919f21c15bd5'},
    {ordinal:3,state:'mobileLight',viewport:{width:390,height:844},kind:'fullPage',status:'CAPTURED_REJECTED',reason:attemptReason,path:'/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty07-stage-a-4398f04-formal-3.png',bytes:642526,sha256:'6878290ee0846c74b25efb4fb674f2ee9e2e362b2069a572646f632307692b11'},
  ]);
  for (const [key, expected] of Object.entries({
    desktopLight:{theme:'light',width:1440,height:1000,clients:[800,800,800],scrolls:[800,1024,1024],deltas:[0,40,40]},
    desktopDark:{theme:'dark',width:1440,height:1000,clients:[800,800,800],scrolls:[800,1024,1024],deltas:[0,40,40]},
    mobileLight:{theme:'light',width:390,height:844,clients:[358,358,358],scrolls:[800,1024,1024],deltas:[40,40,40]},
    mobileDark:{theme:'dark',width:390,height:844,clients:[358,358,358],scrolls:[800,1024,1024],deltas:[40,40,40]},
  })) {
    const state = evidence.states[key];
    assert.deepEqual([state.theme, state.viewport.width, state.viewport.height], [expected.theme, expected.width, expected.height]);
    assert.deepEqual(state.geometry.page, {clientWidth: expected.width, scrollWidth: expected.width});
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPERS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth}) => clientWidth), expected.clients);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth}) => scrollWidth), expected.scrolls);
    assert.equal(state.interactions.length, 3);
    for (const [index, interaction] of state.interactions.entries()) {
      assert.equal(interaction.index, index);
      assert.equal(interaction.before.focus, true);
      assert.equal(interaction.before.focusVisible, true);
      assert.match(interaction.before.outline, /solid 3px/u);
      assert.equal(interaction.after.focus, true);
      assert.equal(interaction.after.focusVisible, true);
      assert.match(interaction.after.outline, /solid 3px/u);
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.scrollLeft, expected.deltas[index]);
    }
    assert.equal(state.geometry.svg.loaded, true);
    assert.deepEqual([state.geometry.svg.naturalWidth, state.geometry.svg.naturalHeight], [82,150]);
    assert.deepEqual([state.geometry.svg.renderedWidth, state.geometry.svg.renderedHeight], [800,1466.6640625]);
    assert.deepEqual(state.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
    }
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_LINKS);
    for (const source of state.geometry.sources) assert.deepEqual([source.target, source.rel], ['_blank', 'noopener noreferrer']);
    assert.equal(state.geometry.sty08, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics.events, []);
    assert.equal(state.diagnostics.hasMore, false);
    assert.equal(state.diagnostics.truncated, false);
  }
}

async function assertReview(source) {
  assert.match(source, /^# G009 Batch 8 Stage A Review$/mu);
  assert.match(section(source, 'Stage A projection'), /59 completed topics \/ 102 content documents \/ 529 governed sources/u);
  const identities = section(source, 'Artifact identities');
  for (const path of [ARTICLE, DRAWIO, SVG, LEDGER]) {
    const bytes = await readFile(new URL(`../${path}`, import.meta.url));
    assert.match(identities, new RegExp(`\\| ${escapeRegExp(`\`${path}\``)} \\| [0-9,]+ \\| ${escapeRegExp(`\`${sha256(bytes)}\``)} \\|`, 'u'));
  }
  const checkpoint = section(source, 'Independent review checkpoint');
  for (const literal of [
    `Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`,
    'Independent code/spec/security review: `PENDING`.',
    'Independent content/evidence/rights review: `PENDING`.',
    'Independent architecture/invariant review: `PENDING`.',
    'Final Stage A review judgment: `PENDING`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), literal);
  const qa = section(source, 'Local in-app Browser QA');
  assert.ok(qa.includes(`Raw Browser JSON: \`${RAW_BROWSER}\`, SHA-256 \`${sha256(browserBytes)}\`.`));
}

test('projects the exact STY-07 Stage A candidate and keeps STY-08 non-actionable', assertProjection);
test('binds exact artifacts, raw Browser bytes, and PENDING review slots', async () => { assertBrowser(browser); await assertReview(review); });
test('binds the complete tracked raw Browser bytes to one fixed SHA-256', () => {
  assert.equal(sha256(browserBytes), RAW_BROWSER_HASH);
});
test('preserves the complete immediate STY-06 backlog suffix and Batch 7 review', () => {
  assert.equal(sha256(immediateReviewBytes), IMMEDIATE_REVIEW_HASH);
  const line = backlog.split(/\r?\n/u).find((value) => value.startsWith('- **当前发布基线：**'));
  const marker = '此前 G009 Batch 6 历史完成基线为：';
  assert.ok(line?.includes(marker));
  assert.equal(sha256(line.slice(line.indexOf(marker) + marker.length)), IMMEDIATE_BACKLOG_SUFFIX_HASH);
  assert.notEqual(sha256(Buffer.concat([immediateReviewBytes, Buffer.from('x')])), IMMEDIATE_REVIEW_HASH);
  assert.notEqual(sha256(`${line.slice(line.indexOf(marker) + marker.length)}x`), IMMEDIATE_BACKLOG_SUFFIX_HASH);
});

test('rejects raw Browser semantic and diagnostic mutations', () => {
  assertBrowser(browser);
  const mutations = [
    (copy) => copy.states.desktopLight.geometry.wrappers.reverse(),
    (copy) => copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0]),
    (copy) => copy.states.desktopDark.interactions.reverse(),
    (copy) => copy.states.desktopDark.interactions[1].after.scrollLeft = 41,
    (copy) => copy.states.mobileDark.interactions[0].before.focusVisible = false,
    (copy) => copy.states.mobileLight.relations[0].returnedToArticle = false,
    (copy) => copy.states.mobileDark.relations[0] = {...copy.states.mobileDark.relations[0], href:'/tego-arch/styles/sty-99', h1:'fabricated', expectedH1:'fabricated'},
    (copy) => copy.states.desktopLight.geometry.svg.loaded = false,
    (copy) => copy.states.desktopLight.geometry.svg.naturalWidth = 83,
    (copy) => copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated',
    (copy) => copy.states.desktopDark.diagnostics.truncated = true,
    (copy) => copy.states.mobileLight.geometry.sty08 = 1,
    (copy) => copy.screenshotEvidence.status = 'PASS',
    (copy) => copy.screenshotEvidence.attempts[0].bytes = 1,
    (copy) => copy.screenshotEvidence.attempts[0].sha256 = '0'.repeat(64),
    (copy) => copy.screenshotEvidence.attempts.splice(1,1),
    (copy) => copy.screenshotEvidence.attempts.splice(2,1),
    (copy) => copy.screenshotEvidence.attempts[1].status = 'PASS',
    (copy) => copy.screenshotEvidence.attempts[2].reason = 'changed',
  ];
  for (const mutate of mutations) { const copy = structuredClone(browser); mutate(copy); assert.throws(() => assertBrowser(copy), {name:'AssertionError'}); }
  assert.notEqual(sha256(Buffer.from(`${browserBytes} `)), sha256(browserBytes));
});
