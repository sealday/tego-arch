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
const CANDIDATE_HEAD = '76607c67242757e0e1da1f9e352844b36481fcef';
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
  assert.equal(evidence.screenshotEvidence.status, 'CAPTURED / ACCEPTED');
  assert.deepEqual(Object.keys(evidence.screenshotEvidence.artifacts), STATES);
  for (const artifact of Object.values(evidence.screenshotEvidence.artifacts)) {
    assert.equal(artifact.status, 'CAPTURED');
    assert.ok(artifact.path.startsWith('/'));
    assert.ok(artifact.bytes > 0);
    assert.match(artifact.sha256, /^[0-9a-f]{64}$/u);
  }
  for (const [key, expected] of Object.entries({desktopLight:['light',1440,1000], desktopDark:['dark',1440,1000], mobileLight:['light',390,844], mobileDark:['dark',390,844]})) {
    const state = evidence.states[key];
    assert.deepEqual([state.theme, state.viewport.width, state.viewport.height], expected);
    assert.deepEqual(state.geometry.page, {clientWidth: expected[1], scrollWidth: expected[1]});
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPERS);
    assert.equal(state.interactions.length, 3);
    for (const [index, interaction] of state.interactions.entries()) {
      assert.equal(interaction.index, index);
      assert.equal(interaction.before.focus, true);
      assert.equal(interaction.after.focus, true);
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.scrollLeft > 0, state.geometry.wrappers[index].scrollWidth > state.geometry.wrappers[index].clientWidth);
    }
    assert.equal(state.geometry.svg.loaded, true);
    assert.deepEqual(state.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
    }
    assert.equal(state.geometry.sources.length, 5);
    assert.ok(new Set(state.geometry.sources.map(({href}) => new URL(href).hostname)).size >= 4);
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
    (copy) => copy.states.desktopDark.interactions.reverse(),
    (copy) => copy.states.mobileLight.relations[0].returnedToArticle = false,
    (copy) => copy.states.mobileDark.relations[0] = {...copy.states.mobileDark.relations[0], href:'/tego-arch/styles/sty-99', h1:'fabricated', expectedH1:'fabricated'},
    (copy) => copy.states.desktopLight.geometry.svg.loaded = false,
    (copy) => copy.states.desktopDark.diagnostics.truncated = true,
    (copy) => copy.states.mobileLight.geometry.sty08 = 1,
    (copy) => copy.screenshotEvidence.status = 'PASS',
  ];
  for (const mutate of mutations) { const copy = structuredClone(browser); mutate(copy); assert.throws(() => assertBrowser(copy), {name:'AssertionError'}); }
  assert.notEqual(sha256(Buffer.from(`${browserBytes} `)), sha256(browserBytes));
});
