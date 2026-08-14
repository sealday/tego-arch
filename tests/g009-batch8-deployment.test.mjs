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
const PRODUCTION_BROWSER = 'docs/reviews/evidence/g009-batch8-stage-a-production-browser.json';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch7.md';
const BACKLOG = 'docs/content-backlog.md';
const CANDIDATE_HEAD = '4398f045f0595043878102d59353bf1e3ae4de21';
const EVIDENCE_HEAD = '570b55eddac0d888f5f5356b5e97a80106958259';
const RAW_BROWSER_HASH = 'b2a09ad041c156faa1493867741dd7b1c74241fbd96005903335b3d5076d4122';
const IMPLEMENTATION_HEAD = '087ebc19322bbb5660ba9f2997e8384d209e3494';
const PRODUCTION_BROWSER_HASH = '753a94cf2ef53d054959dc6c115d4f29e484c651a06fe4c5c7d617358fd8b192';
const IMMEDIATE_REVIEW_HASH = 'd8438c66127e9b4411d5dc121a19842aaaab4e03c31a2285cb02fcfde689cf6b';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = '4f53eceafe34f274d494bacf5bc35be770a872666dacce54a818f796542e01c8';
const STAGE_B_CANDIDATE_HEAD = '4b9d2c718d96adeba6910805bd02116b162f3c06';
const STAGE_B_REVIEWED_HEAD = '44cfed91f9773e2e43d271b30a76a1ed1a70f10e';
const STAGE_A_ARTIFACT_HASHES = new Map([
  [ARTICLE, 'f98c075a6bf38c4d7d345d792f3dbdba361b682eef2c458095b96bcd4dbb4bf4'],
  [DRAWIO, 'b985dcaea8f5fe4ebd3601f34dcdc1eb51ff1f2a08acf7407dd4e309a51ed78e'],
  [SVG, 'b4827479133743999c7c14cf14b5d61abf91c7e217a540378ac0d4b9b77b3c8f'],
  [LEDGER, '52e33d9996222026ffe74e53b5d6da77a61e442d982fa9e93b14517216f5f778'],
  [RAW_BROWSER, RAW_BROWSER_HASH],
  [PRODUCTION_BROWSER, PRODUCTION_BROWSER_HASH],
]);
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

const [review, browserBytes, productionBytes, immediateReviewBytes, backlog, status, manifest, indexes, publicLedger] = await Promise.all([
  readFile(new URL(`../${REVIEW}`, import.meta.url), 'utf8'),
  readFile(new URL(`../${RAW_BROWSER}`, import.meta.url)),
  readFile(new URL(`../${PRODUCTION_BROWSER}`, import.meta.url)),
  readFile(new URL(`../${IMMEDIATE_REVIEW}`, import.meta.url)),
  readFile(new URL(`../${BACKLOG}`, import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const browser = JSON.parse(browserBytes);
const production = JSON.parse(productionBytes);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

function section(source, heading) {
  const starts = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const current = starts.filter((match) => match[1] === heading);
  assert.equal(current.length, 1, `${heading} section`);
  const next = starts.find((match) => match.index > current[0].index);
  return source.slice(current[0].index + current[0][0].length, next?.index ?? source.length).trim();
}

function currentReleaseBaseline(source) {
  const matches = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(matches.length, 1, 'one current release baseline');
  return matches[0];
}

function mutateImmediateHistory(source) {
  const marker = '此前 G009 Batch 7 历史完成基线为：';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'immediate history mutation boundary');
  const boundary = start + marker.length;
  const suffix = source.slice(boundary);
  const mutatedSuffix = suffix.replace('build job `94348112279`', 'build job `0`');
  assert.notEqual(mutatedSuffix, suffix, 'immediate history mutation applies');
  return source.slice(0, boundary) + mutatedSuffix;
}

function assertStageBClosure(source = review, backlogSource = backlog) {
  const projection = section(source, 'Stage B closure candidate');
  for (const literal of [
    'Projection: `60 completed topics / 102 content documents / 529 governed sources`.',
    'STY-07 target: `published / complete`.',
    'STY-08 target: `unpublished / pending`; actionable route count: `0`; sole next topic.',
    `Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\`.`,
    `Review history: initial closure candidate \`${STAGE_B_CANDIDATE_HEAD}\` was remediated by \`${STAGE_B_REVIEWED_HEAD}\`.`,
    'Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.',
    'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
    'Final Stage B review judgment: `READY`.',
    'Stage B deployment status: `PENDING`.',
  ]) assert.ok(projection.includes(literal), literal);

  const baseline = currentReleaseBaseline(backlogSource);
  for (const literal of [
    '2026-08-14 G009 Batch 8 已完成 STY-07',
    `Stage A 发布基线为 [\`${IMPLEMENTATION_HEAD}\`]`,
    'Pages run [`31724488128`]',
    'live route `/styles/sty-07`',
    '`/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg`',
    'Stage B local closure projection 为 60 个已完成主题、102 篇内容文档与 529 个受治理来源',
    '当前 G009，下一项为 STY-08',
    'STY-07 为 published/complete',
    'STY-08 为 unpublished/pending/nonactionable',
    'Stage B 独立 review slots 与 deployment status 均为 `PENDING`',
  ]) assert.ok(baseline.includes(literal), literal);

  const immediateMarker = '此前 G009 Batch 7 历史完成基线为：';
  const historyStart = baseline.indexOf(immediateMarker);
  assert.notEqual(historyStart, -1, 'complete immediate STY-06 history marker');
  assert.equal(sha256(baseline.slice(historyStart + immediateMarker.length)), IMMEDIATE_BACKLOG_SUFFIX_HASH);

  const sty07Lines = backlogSource.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-07 /u.test(line));
  assert.equal(sty07Lines.length, 1, 'one canonical STY-07 backlog line');
  for (const literal of [
    '- [x] **STY-07 ',
    '2026-08-14',
    IMPLEMENTATION_HEAD,
    '31724488128',
    '/styles/sty-07',
    '/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg',
    'Stage A production verdict PASS',
  ]) assert.ok(sty07Lines[0].includes(literal), literal);
  assert.match(backlogSource, /^- \[ \] \*\*STY-08 /mu);
  assert.doesNotMatch(backlogSource, /\]\(\/styles\/sty-08\)/u);
}

function assertProjection() {
  assert.deepEqual({completed_topics: status.completed_topics, content_documents: status.content_documents, governed_sources: status.governed_sources}, {completed_topics: 60, content_documents: 102, governed_sources: 529});
  assert.equal(publicLedger.sources.length, 529);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-07')?.published, topics.get('STY-07')?.status.value, styles.get('STY-07')?.published], [true, 'complete', true]);
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

function assertProduction(evidence) {
  assert.equal(evidence.implementationHead, IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.pages, {runId:31724488128,buildJobId:94529359551,deployJobId:94530100965,status:'completed',conclusion:'success'});
  assert.deepEqual(evidence.probes.routes.map(({path,status,contentType}) => [path,status,contentType]), [
    ['/',200,'text/html; charset=utf-8'], ['/tego-arch/',200,'text/html; charset=utf-8'], ['/tego-arch/styles',200,'text/html; charset=utf-8'],
    ['/tego-arch/styles/sty-07',200,'text/html; charset=utf-8'], ['/tego-arch/styles/sty-04',200,'text/html; charset=utf-8'],
    ['/tego-arch/styles/sty-05',200,'text/html; charset=utf-8'], ['/tego-arch/styles/sty-06',200,'text/html; charset=utf-8'],
    ['/tego-arch/cases/temporal-saga-durable-execution',200,'text/html; charset=utf-8'], ['/tego-arch/references',200,'text/html; charset=utf-8'],
  ]);
  assert.deepEqual(evidence.probes.svg, {path:'/tego-arch/img/diagrams/sty-07-soa-microservices-order-fulfillment.svg',status:200,contentType:'image/svg+xml',bytes:29229,sha256:'b4827479133743999c7c14cf14b5d61abf91c7e217a540378ac0d4b9b77b3c8f',reviewedBytes:29229,reviewedSha256:'b4827479133743999c7c14cf14b5d61abf91c7e217a540378ac0d4b9b77b3c8f',exactMatch:true});
  assert.deepEqual(Object.keys(evidence.states), STATES);
  for (const [key, expected] of Object.entries({desktopLight:{theme:'light',width:1440,height:1000,clients:[800,800,800],scrolls:[800,1024,1024],deltas:[0,40,40]},desktopDark:{theme:'dark',width:1440,height:1000,clients:[800,800,800],scrolls:[800,1024,1024],deltas:[0,40,40]},mobileLight:{theme:'light',width:390,height:844,clients:[358,358,358],scrolls:[800,1024,1024],deltas:[40,40,40]},mobileDark:{theme:'dark',width:390,height:844,clients:[358,358,358],scrolls:[800,1024,1024],deltas:[40,40,40]}})) {
    const state = evidence.states[key];
    assert.deepEqual([state.theme,state.viewport.width,state.viewport.height],[expected.theme,expected.width,expected.height]);
    assert.deepEqual(state.geometry.page,{clientWidth:expected.width,scrollWidth:expected.width});
    assert.deepEqual(state.geometry.wrappers.map(({label})=>label),WRAPPERS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth})=>clientWidth),expected.clients);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth})=>scrollWidth),expected.scrolls);
    assert.deepEqual(state.interactions.map((entry)=>entry.index),[0,1,2]);
    for (const [index, interaction] of state.interactions.entries()) {
      assert.deepEqual([interaction.before.focus,interaction.before.focusVisible,interaction.before.scrollLeft],[true,true,0]);
      assert.deepEqual([interaction.after.focus,interaction.after.focusVisible,interaction.after.scrollLeft],[true,true,expected.deltas[index]]);
      assert.match(interaction.before.outline,/solid 3px/u); assert.match(interaction.after.outline,/solid 3px/u);
    }
    assert.deepEqual([state.geometry.svg.loaded,state.geometry.svg.naturalWidth,state.geometry.svg.naturalHeight,state.geometry.svg.renderedWidth,state.geometry.svg.renderedHeight],[true,82,150,800,1466.6640625]);
    assert.deepEqual(state.relations.map(({href,expectedH1})=>[href,expectedH1]),RELATIONS);
    for (const relation of state.relations) { assert.equal(relation.h1,relation.expectedH1); assert.equal(relation.returnedToArticle,true); assert.match(relation.navigation,/no physical relation click claimed/u); }
    assert.deepEqual(state.geometry.sources.map(({href})=>href),SOURCE_LINKS);
    for (const source of state.geometry.sources) assert.deepEqual([source.target,source.rel],['_blank','noopener noreferrer']);
    assert.equal(state.geometry.sty08,0); assert.deepEqual(state.logs,[]); assert.deepEqual(state.diagnostics,{events:[],hasMore:false,truncated:false});
  }
  assert.equal(evidence.screenshotEvidence.status,'BLOCKED / NOT_ACCEPTED');
  assert.equal(evidence.screenshotEvidence.attempts.length,3);
  assert.deepEqual(evidence.screenshotEvidence.attempts.map(({ordinal,state,status})=>[ordinal,state,status]),[[1,'desktopLight','CAPTURED_REJECTED'],[2,'desktopDark','CAPTURED_REJECTED'],[3,'mobileLight','CAPTURED_REJECTED']]);
  for (const attempt of evidence.screenshotEvidence.attempts) { assert.ok(attempt.bytes>0); assert.match(attempt.sha256,/^[0-9a-f]{64}$/u); assert.ok(attempt.reason.length>0); }
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
    `Exact evidence head: \`${EVIDENCE_HEAD}\`.`,
    'Independent code/spec/security review: `READY / APPROVE`; findings: `0`.',
    'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), literal);
  const qa = section(source, 'Local in-app Browser QA');
  assert.ok(qa.includes(`Raw Browser JSON: \`${RAW_BROWSER}\`, SHA-256 \`${sha256(browserBytes)}\`.`));
}

test('projects the exact STY-07 Stage B closure candidate and keeps STY-08 non-actionable', assertProjection);
test('binds exact artifacts, raw Browser bytes, and final independent review verdicts', async () => { assertBrowser(browser); await assertReview(review); });
test('binds the complete tracked raw Browser bytes to one fixed SHA-256', () => {
  assert.equal(sha256(browserBytes), RAW_BROWSER_HASH);
});
test('preserves every Stage A implementation, evidence, and production identity byte-for-byte', async () => {
  for (const [path, expectedHash] of STAGE_A_ARTIFACT_HASHES) {
    assert.equal(sha256(await readFile(new URL(`../${path}`, import.meta.url))), expectedHash, path);
  }
});
test('binds the exact successful STY-07 production deployment and functional evidence', () => {
  assert.equal(sha256(productionBytes), PRODUCTION_BROWSER_HASH);
  assertProduction(production);
  const productionSection = section(review, 'Production Stage A evidence');
  for (const literal of [IMPLEMENTATION_HEAD,'31724488128','94529359551','94530100965',PRODUCTION_BROWSER_HASH,'Stage A deployment status: `SUCCESS`.','Final Stage A production judgment: `PASS`','Stage B remains `NOT_RUN`']) assert.ok(productionSection.includes(literal),literal);
});

test('rejects mutated production SHA, run, jobs, routes, SVG, states and visual claims', () => {
  assertProduction(production);
  const mutations = [
    (copy)=>copy.implementationHead='0'.repeat(40), (copy)=>copy.pages.runId=1, (copy)=>copy.pages.buildJobId=1, (copy)=>copy.pages.deployJobId=1,
    (copy)=>copy.pages.conclusion='failure', (copy)=>copy.probes.routes.splice(2,1), (copy)=>copy.probes.routes[0].status=404,
    (copy)=>copy.probes.svg.sha256='0'.repeat(64), (copy)=>copy.probes.svg.exactMatch=false, (copy)=>delete copy.states.mobileDark,
    (copy)=>copy.states.desktopLight.geometry.wrappers[0].clientWidth=1, (copy)=>copy.states.mobileLight.relations[0].returnedToArticle=false,
    (copy)=>copy.states.desktopDark.geometry.sources[0].rel='', (copy)=>copy.states.mobileDark.diagnostics.truncated=true,
    (copy)=>copy.states.mobileDark.geometry.sty08=1, (copy)=>copy.screenshotEvidence.status='PASS', (copy)=>copy.screenshotEvidence.attempts.splice(1,1),
  ];
  for (const mutate of mutations) { const copy=structuredClone(production); mutate(copy); assert.throws(()=>assertProduction(copy),{name:'AssertionError'}); }
  assert.notEqual(sha256(Buffer.concat([productionBytes,Buffer.from('x')])),PRODUCTION_BROWSER_HASH);
});
test('preserves the complete immediate STY-06 backlog suffix and Batch 7 review', () => {
  assert.equal(sha256(immediateReviewBytes), IMMEDIATE_REVIEW_HASH);
  const line = backlog.split(/\r?\n/u).find((value) => value.startsWith('- **当前发布基线：**'));
  const marker = '此前 G009 Batch 7 历史完成基线为：';
  assert.ok(line?.includes(marker));
  assert.equal(sha256(line.slice(line.indexOf(marker) + marker.length)), IMMEDIATE_BACKLOG_SUFFIX_HASH);
  assert.notEqual(sha256(Buffer.concat([immediateReviewBytes, Buffer.from('x')])), IMMEDIATE_REVIEW_HASH);
  assert.notEqual(sha256(`${line.slice(line.indexOf(marker) + marker.length)}x`), IMMEDIATE_BACKLOG_SUFFIX_HASH);
});

test('closes only STY-07 at 60/102/529 and leaves STY-08 sole next and non-actionable', () => {
  assert.deepEqual({
    completed_topics: status.completed_topics,
    content_documents: status.content_documents,
    governed_sources: status.governed_sources,
  }, {completed_topics: 60, content_documents: 102, governed_sources: 529});
  assert.equal(publicLedger.sources.length, 529);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-07')?.published, topics.get('STY-07')?.status.value, styles.get('STY-07')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-08')?.published, topics.get('STY-08')?.status.value, styles.get('STY-08')?.published], [false, 'pending', false]);
  assertStageBClosure();
});

test('rejects Stage B history drift, stale next-topic state, weakened review slots, and fabricated deployment', () => {
  assertStageBClosure();
  const mutations = [
    ['history drift', 'backlog', backlog, mutateImmediateHistory(backlog)],
    ['checked STY-08', 'backlog', backlog, backlog.replace('- [ ] **STY-08 ', '- [x] **STY-08 ')],
    ['actionable STY-08', 'backlog', backlog, `${backlog}\n[Actor](/styles/sty-08)\n`],
    ['wrong projection', 'review', review, review.replace('60 completed topics / 102 content documents / 529 governed sources', '59 completed topics / 102 content documents / 529 governed sources')],
    ['wrong reviewed head', 'review', review, review.replace(STAGE_B_REVIEWED_HEAD, '0'.repeat(40))],
    ['weakened code verdict', 'review', review, review.replace('Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`', 'Independent Stage B code/spec/security review: `NOT READY`; findings: `1`')],
    ['weakened content verdict', 'review', review, review.replace('Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent Stage B content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `1`')],
    ['weakened rights', 'review', review, review.replace('Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `UNKNOWN`; findings: `0`')],
    ['weakened architecture verdict', 'review', review, review.replace('Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`', 'Independent Stage B architecture/invariant review: `BLOCKED`; blockers: `1`')],
    ['stale review slot', 'review', review, review.replace('Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`', 'Independent Stage B code/spec/security review: `PENDING`')],
    ['stale final verdict', 'review', review, review.replace('Final Stage B review judgment: `READY`', 'Final Stage B review judgment: `PENDING`')],
    ['fabricated deployment', 'review', review, review.replace('Stage B deployment status: `PENDING`', 'Stage B deployment status: `SUCCESS`')],
  ];
  for (const [label, target, original, mutated] of mutations) {
    assert.notEqual(mutated, original, `${label} mutation applies`);
    assert.throws(() => assertStageBClosure(target === 'review' ? mutated : review, target === 'backlog' ? mutated : backlog), {name:'AssertionError'}, label);
  }
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

test('rejects wrong exact heads, weakened verdicts, stale PENDING, and fabricated deployment', async () => {
  await assertReview(review);
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    [`Exact evidence head: \`${EVIDENCE_HEAD}\`.`, `Exact evidence head: \`${'1'.repeat(40)}\`.`],
    ['`READY / APPROVE`; findings: `0`.', '`READY / APPROVE`; findings: `1`.'],
    ['`CONTENT READY`; rights: `PASS`; findings: `0`.', '`CONTENT READY`; rights: `PENDING`; findings: `0`.'],
    ['`CLEAR / READY`; blockers: `0`.', '`CLEAR / READY`; blockers: `1`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review);
    await assert.rejects(() => assertReview(mutated), {name:'AssertionError'});
  }
});
