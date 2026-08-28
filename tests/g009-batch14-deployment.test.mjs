import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const ARTICLE = 'content/styles/sty-13-space-based-architecture.mdx';
export const REVIEW = 'docs/reviews/g009-batch14.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch14-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch14-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch14-stage-b-production-browser.json';
export const CURRENT_TOPIC = 'STY-13';
export const NEXT_TOPIC = 'STY-14';
export const EXPECTED_STAGE_A = Object.freeze({completed: 65, documents: 109, sources: 573});
export const EXPECTED_STAGE_B = Object.freeze({completed: 66, documents: 109, sources: 573});
export const EXPECTED_BROWSER = Object.freeze({states: 4, wrappersPerState: 4, relationsPerState: 4, remoteSourcesPerState: 7, nextTopicActions: 0});

export const CANDIDATE_HEAD = '17e596b23ca2e9ec37093d8bda9e6239e6af9d1f';
export const LOCAL_RAW_IDENTITY = Object.freeze({bytes: 27_953, sha256: '415ca7f78747cff78de84bc025b8a870dabca1f993e558b8a2d6dcae8354fa6d'});
export const STATES = Object.freeze(['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark']);
const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch13.md';
const IMMEDIATE_LOCAL_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-browser.json';
const IMMEDIATE_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-production-browser.json';
const IMMEDIATE_STAGE_B_RAW = 'docs/reviews/evidence/g009-batch13-stage-b-production-browser.json';
const IMMEDIATE_REVIEW_IDENTITY = Object.freeze({bytes: 14_502, sha256: '688c800ecafcfc3ed66529e2896d49fd247680412f9eba6c5a25da357e8ae44c'});
const IMMEDIATE_RAW_IDENTITIES = Object.freeze([
  Object.freeze({path: IMMEDIATE_LOCAL_RAW, bytes: 17_260, sha256: 'a0de2d5ea069b2af87ad4aa4ef4696a9a22e6ff99ba96b616763262f1814ed38'}),
  Object.freeze({path: IMMEDIATE_PRODUCTION_RAW, bytes: 33_721, sha256: 'a28bb3269f2b7545b7d77f2ec506ce5b1bd737924a5db6945481ee8ec5763560'}),
  Object.freeze({path: IMMEDIATE_STAGE_B_RAW, bytes: 47_997, sha256: '93540ff26f5d7a6fddb2ca5310a838304d04afa6994788fcf1fb8d0b4a6ff958'}),
]);
const IMMEDIATE_BASELINE_IDENTITY = Object.freeze({bytes: 40_108, sha256: '52c9fe9aa36e1ab9c406162c1d34f489ee439058f73f450e973fe496b35902f0'});
const SVG = 'static/img/diagrams/sty-13-space-based-flight-availability.svg';
const SVG_IDENTITY = Object.freeze({bytes: 26_671, sha256: '68e15b5fe4eefd49f5870c672e125d0fa9e001b5177049d43a09d68d2deb56d7'});
const WRAPPER_LABELS = Object.freeze([
  'Space-Based Architecture 航班余位亲和分区、主备与恢复边界图，可横向滚动',
  'Space-Based Architecture 与四种相邻方案边界表，可横向滚动',
  '航班余位六类操作执行与一致性责任表，可横向滚动',
  'Space-Based Architecture 六类故障信号、保护动作与恢复门槛表，可横向滚动',
]);
const EXPECTED_WRAPPERS = Object.freeze({
  desktopLight: Object.freeze([[800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0]]),
  desktopDark: Object.freeze([[800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0]]),
  mobileLight: Object.freeze([[358, 800, 0, 40], [358, 358, 0, 0], [358, 358, 0, 0], [358, 358, 0, 0]]),
  mobileDark: Object.freeze([[358, 800, 0, 40], [358, 358, 0, 0], [358, 358, 0, 0], [358, 358, 0, 0]]),
});
const SCREENSHOTS = Object.freeze([
  Object.freeze({state: 'desktopLight', bytes: 157_503, sha256: '68b661c5451587e6c4c078241e058482dcc1da3a9ae9f86f560ed81db36ede56'}),
  Object.freeze({state: 'desktopDark', bytes: 159_782, sha256: 'd36c848666a3768f3427f551314d8c90b4c4523aad4ad7ba1497d45b78c433cc'}),
  Object.freeze({state: 'mobileLight', bytes: 49_728, sha256: '4e788462bd23f4e736a53c5d393b493d3638ff36988371f83e55aeb5e6a1820e'}),
  Object.freeze({state: 'mobileDark', bytes: 49_774, sha256: '7e71b86f5ccdb33eefe2da98a37d1089aa41cc15b44f4a8777945a614f1543e4'}),
]);
const RELATIONS = Object.freeze([
  Object.freeze({href: '/tego-arch/styles/sty-05', expectedH1: '微服务：用独立部署换取自治，也承担分布式成本'}),
  Object.freeze({href: '/tego-arch/styles/sty-08', expectedH1: 'Actor Model：用逻辑身份、私有状态与消息隔离并发'}),
  Object.freeze({href: '/tego-arch/cases/aws-cell-shuffle-sharding', expectedH1: '单元架构与洗牌分片：把失控智能体限制在可计算的故障半径内'}),
  Object.freeze({href: '/tego-arch/cases/cloudflare-durable-objects-workerd', expectedH1: '把边缘协调收敛到身份寻址的状态单元'}),
]);
const SOURCE_HREFS = Object.freeze([
  'https://docs.gigaspaces.com/16.2/overview/space-based-architecture.html',
  'https://docs.gigaspaces.com/16.2.1/admin/the-sla-overview.html',
  'https://docs.gigaspaces.com/16.2/admin/leader-election-availability-biased.html',
  'https://docs.gigaspaces.com/16.2/admin/tuning-proxy-connectivity.html',
  'https://docs.oracle.com/en/middleware/fusion-middleware/coherence/12.2.1.4/develop-applications/introduction-coherence.html',
  'https://docs.oracle.com/middleware/1221/coherence/develop-applications/cache_back.htm',
  'https://www.gigaspaces.com/case_studies/booking-and-flight-availability',
]);

const rootUrl = new URL('../', import.meta.url);
const required = (path, encoding) => readFile(new URL(path, rootUrl), encoding);
async function optional(path, encoding) {
  try { return await required(path, encoding); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; }
}
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
function exactKeys(value, keys, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} is an object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} exact keys`);
}
function currentReleaseBaseline(source) {
  const prefix = '- **当前发布基线：** ';
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith(prefix));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice(prefix.length);
}
function markdownSection(source, heading) {
  const marker = `## ${heading}\n\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${heading} section exists`);
  const contentStart = start + marker.length;
  const end = source.indexOf('\n## ', contentStart);
  return source.slice(contentStart, end === -1 ? source.length : end).trim();
}

function assertImmediateBatch13History(reviewBytes = immediateReview, rawBytes = immediateRaws, backlogSource = backlog) {
  assert.equal(reviewBytes.length, IMMEDIATE_REVIEW_IDENTITY.bytes, 'complete immediate Batch 13 review bytes');
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_IDENTITY.sha256, 'complete immediate Batch 13 review SHA-256');
  assert.equal(rawBytes.length, IMMEDIATE_RAW_IDENTITIES.length, 'complete immediate Batch 13 raw set');
  for (const [index, identity] of IMMEDIATE_RAW_IDENTITIES.entries()) {
    assert.equal(rawBytes[index].length, identity.bytes, `${identity.path} exact bytes`);
    assert.equal(sha256(rawBytes[index]), identity.sha256, `${identity.path} exact SHA-256`);
  }
  const baseline = currentReleaseBaseline(backlogSource);
  assert.equal(Buffer.byteLength(baseline), IMMEDIATE_BASELINE_IDENTITY.bytes, 'complete immediate Batch 13 backlog baseline bytes');
  assert.equal(sha256(baseline), IMMEDIATE_BASELINE_IDENTITY.sha256, 'complete immediate Batch 13 backlog baseline SHA-256');
  assert.match(baseline, /^2026-08-27 G009 Batch 13 已完成 STY-12/u);
  assert.match(baseline, /STY-12 为 published\/complete，STY-13 为 unpublished\/pending\/nonactionable/u);
}

function assertDiagnosticPage(page, expectedScope, label) {
  exactKeys(page, ['scope', 'afterSequence', 'cursor', 'count', 'hasMore', 'truncated'], label);
  assert.equal(page.scope, expectedScope, `${label} exact scope`);
  assert.ok(Number.isInteger(page.afterSequence) && page.afterSequence >= 0, `${label} non-negative request cursor`);
  assert.ok(Number.isInteger(page.cursor) && page.cursor >= page.afterSequence, `${label} monotonic response cursor`);
  assert.equal(page.count, 0, `${label} no accepted Runtime/Log events`);
  assert.equal(page.hasMore, false, `${label} terminal page`);
  assert.equal(page.truncated, false, `${label} complete page`);
}
function expectedScopes(stateName) {
  return [
    `${stateName}:prepare`,
    ...WRAPPER_LABELS.map((_, index) => `${stateName}:interaction${index}`),
    ...RELATIONS.flatMap((_, index) => [`${stateName}:relation${index}:destination`, `${stateName}:relation${index}:return`]),
    `${stateName}:screenshot`,
  ];
}
const ALL_STATE_SCOPES = Object.freeze(STATES.flatMap(expectedScopes));

function assertScreenshotEvidence(value) {
  exactKeys(value, ['status', 'attempted', 'accepted', 'fallbackUsed', 'storage', 'attempts'], 'screenshot evidence');
  assert.equal(value.fallbackUsed, false, 'no substituted screenshot surface');
  assert.match(value.storage, /Codex in-app Browser/u, 'in-app Browser storage identity');
  assert.ok(Number.isInteger(value.attempted) && value.attempted >= 0 && value.attempted <= STATES.length, 'honest screenshot attempt count');
  assert.equal(value.attempts.length, value.attempted, 'every screenshot attempt is recorded');
  if (value.status === 'PASS / ACCEPTED') {
    assert.equal(value.attempted, STATES.length, 'all four screenshots attempted');
    assert.equal(value.accepted, STATES.length, 'all four screenshots accepted');
  } else {
    assert.equal(value.status, 'BLOCKED / NOT_ACCEPTED', 'only the explicit blocked screenshot status is allowed');
    assert.equal(value.accepted, 0, 'blocked captures are not accepted');
  }
  for (const [index, attempt] of value.attempts.entries()) {
    exactKeys(attempt, ['state', 'status', 'bytes', 'sha256', 'reason'], `screenshot attempt ${index}`);
    assert.equal(attempt.state, STATES[index], `screenshot attempt ${index} state order`);
    assert.ok(typeof attempt.reason === 'string' && attempt.reason.length > 0, `screenshot attempt ${index} reason`);
    if (value.status === 'PASS / ACCEPTED') {
      assert.equal(attempt.status, 'CAPTURED_ACCEPTED', `screenshot attempt ${index} accepted`);
      assert.ok(Number.isInteger(attempt.bytes) && attempt.bytes > 0, `screenshot attempt ${index} bytes`);
      assert.match(attempt.sha256, /^[0-9a-f]{64}$/u, `screenshot attempt ${index} SHA-256`);
      assert.deepEqual({state: attempt.state, bytes: attempt.bytes, sha256: attempt.sha256}, SCREENSHOTS[index], `screenshot attempt ${index} exact byte identity`);
    } else {
      assert.match(attempt.status, /^(?:CAPTURE_BLOCKED|CAPTURED_NOT_ACCEPTED)$/u, `screenshot attempt ${index} honest rejection`);
      assert.equal(attempt.bytes, null, `screenshot attempt ${index} has no trusted byte identity`);
      assert.equal(attempt.sha256, null, `screenshot attempt ${index} has no trusted hash identity`);
    }
  }
}

function assertLocalEvidence(value) {
  assert.ok(value, `${LOCAL_RAW} is missing; capture real four-state in-app Browser evidence`);
  exactKeys(value, ['candidateHead', 'stateOrder', 'collection', 'states', 'functionalSummary', 'screenshotEvidence'], 'local evidence');
  assert.equal(value.candidateHead, CANDIDATE_HEAD, 'exact clean implementation head');
  assert.deepEqual(value.stateOrder, STATES, 'exact four-state order');
  exactKeys(value.collection, ['browser', 'fresh', 'servedUrl', 'build', 'navigationMethod', 'observedSvgAsset', 'diagnosticContinuity'], 'collection');
  assert.equal(value.collection.browser, 'Codex in-app Browser only', 'no substituted browser');
  assert.equal(value.collection.fresh, true, 'fresh collection');
  assert.match(value.collection.servedUrl, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/tego-arch\/styles\/sty-13$/u, 'exact local article URL');
  assert.equal(value.collection.build, `local build from exact clean implementation head ${CANDIDATE_HEAD}`);
  assert.equal(value.collection.navigationMethod, 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.');
  exactKeys(value.collection.observedSvgAsset, ['source', 'contentType', 'bytes', 'sha256', 'viewBox'], 'observed SVG asset');
  assert.deepEqual(value.collection.observedSvgAsset, {
    source: 'local Browser pageAssets bundle', contentType: 'image/svg+xml', ...SVG_IDENTITY, viewBox: '0 0 2400 3600',
  }, 'exact observed SVG identity');
  assert.equal(value.collection.diagnosticContinuity.length, ALL_STATE_SCOPES.length + 1, 'every required action plus whole-session terminal is paged');
  let previousCursor;
  for (const [index, scope] of [...ALL_STATE_SCOPES, 'whole-session:terminal'].entries()) {
    const page = value.collection.diagnosticContinuity[index];
    assertDiagnosticPage(page, scope, `collection diagnostic page ${index}`);
    if (previousCursor !== undefined) assert.equal(page.afterSequence, previousCursor, `collection diagnostic page ${index} continuous cursor`);
    previousCursor = page.cursor;
  }

  exactKeys(value.states, STATES, 'four Browser states');
  let offset = 0;
  for (const stateName of STATES) {
    const state = value.states[stateName];
    const desktop = stateName.startsWith('desktop');
    exactKeys(state, ['theme', 'viewport', 'documentGeometry', 'wrappers', 'relations', 'sources', 'sty14ActionableCount', 'logs', 'runtimeEvents', 'diagnostics'], `${stateName} state`);
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark', `${stateName} theme`);
    exactKeys(state.viewport, ['width', 'height'], `${stateName} viewport`);
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844}, `${stateName} exact viewport`);
    exactKeys(state.documentGeometry, ['clientWidth', 'scrollWidth'], `${stateName} document geometry`);
    assert.deepEqual(state.documentGeometry, desktop ? {clientWidth: 1440, scrollWidth: 1440} : {clientWidth: 390, scrollWidth: 390}, `${stateName} no document overflow`);
    assert.equal(state.wrappers.length, EXPECTED_BROWSER.wrappersPerState, `${stateName} wrapper count`);
    assert.deepEqual(state.wrappers.map(({label}) => label), WRAPPER_LABELS, `${stateName} wrapper order`);
    for (const [index, wrapper] of state.wrappers.entries()) {
      exactKeys(wrapper, ['label', 'clientWidth', 'scrollWidth', 'before', 'after', 'focus', 'focusVisible', 'outlineWidth'], `${stateName} wrapper ${index}`);
      assert.ok(Number.isInteger(wrapper.clientWidth) && wrapper.clientWidth > 0, `${stateName} wrapper ${index} client width`);
      assert.ok(Number.isInteger(wrapper.scrollWidth) && wrapper.scrollWidth >= wrapper.clientWidth, `${stateName} wrapper ${index} contained overflow`);
      assert.ok(Number.isFinite(wrapper.before) && wrapper.before >= 0, `${stateName} wrapper ${index} before scroll`);
      assert.ok(Number.isFinite(wrapper.after) && wrapper.after >= wrapper.before, `${stateName} wrapper ${index} after scroll`);
      assert.equal(wrapper.focus, true, `${stateName} wrapper ${index} focus`);
      assert.equal(wrapper.focusVisible, true, `${stateName} wrapper ${index} focus-visible`);
      assert.equal(wrapper.outlineWidth, '3px', `${stateName} wrapper ${index} outline`);
      assert.ok(wrapper.after - wrapper.before === 0 || wrapper.after - wrapper.before === 40, `${stateName} wrapper ${index} honest ArrowRight result`);
      assert.deepEqual(
        [wrapper.clientWidth, wrapper.scrollWidth, wrapper.before, wrapper.after],
        EXPECTED_WRAPPERS[stateName][index],
        `${stateName} wrapper ${index} exact geometry and interaction`,
      );
    }
    assert.equal(state.relations.length, EXPECTED_BROWSER.relationsPerState, `${stateName} relation count`);
    for (const [index, relation] of state.relations.entries()) {
      exactKeys(relation, ['href', 'expectedH1', 'h1', 'visibleCount', 'returnedToArticle'], `${stateName} relation ${index}`);
      assert.deepEqual(relation, {...RELATIONS[index], h1: RELATIONS[index].expectedH1, visibleCount: 1, returnedToArticle: true}, `${stateName} relation ${index} destination/H1/return`);
    }
    assert.equal(state.sources.length, EXPECTED_BROWSER.remoteSourcesPerState, `${stateName} remote source count`);
    for (const [index, source] of state.sources.entries()) {
      exactKeys(source, ['href', 'target', 'rel'], `${stateName} source ${index}`);
      assert.deepEqual(source, {href: SOURCE_HREFS[index], target: '_blank', rel: 'noopener noreferrer'}, `${stateName} source ${index} identity`);
    }
    assert.equal(state.sty14ActionableCount, EXPECTED_BROWSER.nextTopicActions, `${stateName} STY-14 non-actionable`);
    assert.deepEqual(state.logs, [], `${stateName} warning/error logs`);
    assert.deepEqual(state.runtimeEvents, [], `${stateName} Runtime/Log events`);
    exactKeys(state.diagnostics, ['pages', 'hasMore', 'truncated'], `${stateName} diagnostics`);
    const scopes = expectedScopes(stateName);
    assert.equal(state.diagnostics.pages.length, scopes.length, `${stateName} deliberate diagnostic page count`);
    assert.deepEqual(state.diagnostics.pages, value.collection.diagnosticContinuity.slice(offset, offset + scopes.length), `${stateName} pages bind continuous collection pages`);
    assert.equal(state.diagnostics.hasMore, false, `${stateName} diagnostics terminal`);
    assert.equal(state.diagnostics.truncated, false, `${stateName} diagnostics complete`);
    offset += scopes.length;
  }
  exactKeys(value.functionalSummary, ['status', 'states', 'wrapperInteractions', 'relationObservations', 'sourceObservations', 'sty14ActionableTotal', 'warningErrorLogs', 'runtimeAndLogEvents', 'diagnosticPages', 'diagnosticPagesTerminal', 'diagnosticsTruncated'], 'functional summary');
  assert.deepEqual(value.functionalSummary, {
    status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 16, sourceObservations: 28,
    sty14ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPages: ALL_STATE_SCOPES.length + 1,
    diagnosticPagesTerminal: true, diagnosticsTruncated: false,
  });
  assertScreenshotEvidence(value.screenshotEvidence);
}

function assertReview(source = review, rawBytes = raw) {
  assert.ok(source, `${REVIEW} is missing; prepare the factual record without inventing verdicts`);
  assert.ok(rawBytes, `${LOCAL_RAW} exists before the review is finalized`);
  assert.equal(rawBytes.length, LOCAL_RAW_IDENTITY.bytes, 'exact local Browser raw bytes');
  assert.equal(sha256(rawBytes), LOCAL_RAW_IDENTITY.sha256, 'exact local Browser raw SHA-256');
  assert.match(source, /^# G009 Batch 14 Stage A Review$/mu);
  assert.ok(source.includes('Projection: `65 completed topics / 109 content documents / 573 governed sources`.'));
  assert.ok(source.includes(`Exact clean implementation head: \`${CANDIDATE_HEAD}\`.`));
  assert.ok(source.includes(`Raw Browser JSON: \`${LOCAL_RAW}\`; bytes: \`${rawBytes.length.toLocaleString('en-US')}\`; SHA-256: \`${sha256(rawBytes)}\`.`));
  assert.ok(source.includes('- Functional Browser QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation href/H1/return observations `16/16`; source href/target/rel observations `28/28`.'));
  assert.ok(source.includes('- Diagnostics: `57/57` deliberately paged preparation, interaction, destination, return, screenshot and terminal pages; every accepted page has `count=0`, `hasMore=false`, `truncated=false`; terminal cursor `503 -> 503`.'));
  assert.ok(source.includes('- Screenshot evidence: `PASS / ACCEPTED`; accepted `4/4`; captures faithfully cover the production-analysis table viewport, not the opening or full page.'));
  assert.equal(JSON.parse(rawBytes).screenshotEvidence.status, 'PASS / ACCEPTED', 'review readiness requires accepted raw screenshot evidence');
  assert.ok(source.includes(`Complete immediate Batch 13 review SHA-256: \`${IMMEDIATE_REVIEW_IDENTITY.sha256}\`.`));
  assert.ok(source.includes(`Complete immediate Batch 13 release-baseline SHA-256: \`${IMMEDIATE_BASELINE_IDENTITY.sha256}\`.`));
  const checkpoint = markdownSection(source, 'Independent review checkpoint');
  const reviewedHead = checkpoint.match(/^- Exact reviewed candidate head: `([0-9a-f]{40})`\.$/mu)?.[1];
  assert.ok(reviewedHead, 'exact reviewed candidate head is bound');
  assert.match(checkpoint, new RegExp('^- Independent code/spec/security review: `READY / APPROVE`; findings: `0`; exact head: `' + reviewedHead + '`\\.$', 'mu'));
  assert.match(checkpoint, new RegExp('^- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`; exact head: `' + reviewedHead + '`\\.$', 'mu'));
  assert.match(checkpoint, new RegExp('^- Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`; exact head: `' + reviewedHead + '`\\.$', 'mu'));
  assert.match(checkpoint, /^- Review finding totals: Critical `0`; Important `0`; Minor `0`; ⚠️ `0`\.$/mu);
  assert.match(checkpoint, /^- Final Stage A review judgment: `READY`\.$/mu);
  assert.match(checkpoint, /^- Scope boundary: `STAGE_A_ONLY`\.$/mu);
  assert.match(checkpoint, /^- Deployment status at this checkpoint: `NOT_RUN`\.$/mu);
  assert.doesNotMatch(checkpoint, /PENDING|UNBOUND|findings: `[1-9]|blockers: `[1-9]|SUCCESS|STAGE_B/u);
  assert.doesNotMatch(source, /Screenshot capture scope: `(?:FULL_PAGE|OPENING)`|substituted browser/u);
}

function contractOnlyReadyReviewFixture() {
  const head = '1'.repeat(40);
  return review
    .replace('- Exact reviewed candidate head: `UNBOUND — controller must create and bind the exact post-evidence candidate head`.', `- Exact reviewed candidate head: \`${head}\`.`)
    .replace('- Independent code/spec/security review: `UNBOUND — controller must assign a read-only reviewer`.', `- Independent code/spec/security review: \`READY / APPROVE\`; findings: \`0\`; exact head: \`${head}\`.`)
    .replace('- Independent content/evidence/rights review: `UNBOUND — controller must assign a different read-only reviewer`.', `- Independent content/evidence/rights review: \`CONTENT READY\`; rights: \`PASS\`; findings: \`0\`; exact head: \`${head}\`.`)
    .replace('- Independent architecture/invariant review: `UNBOUND — controller must assign a third read-only reviewer`.', `- Independent architecture/invariant review: \`CLEAR / READY\`; blockers: \`0\`; exact head: \`${head}\`.`)
    .replace('- Review finding totals: `UNBOUND`.', '- Review finding totals: Critical `0`; Important `0`; Minor `0`; ⚠️ `0`.')
    .replace('- Final Stage A review judgment: `NOT_RECORDED`.', '- Final Stage A review judgment: `READY`.');
}

function sampleDiagnosticPages() {
  let cursor = 0;
  return [...ALL_STATE_SCOPES, 'whole-session:terminal'].map((scope) => {
    const page = {scope, afterSequence: cursor, cursor: cursor + (scope === 'whole-session:terminal' ? 0 : 1), count: 0, hasMore: false, truncated: false};
    cursor = page.cursor;
    return page;
  });
}
function sampleEvidence() {
  const pages = sampleDiagnosticPages();
  let offset = 0;
  const states = Object.fromEntries(STATES.map((stateName) => {
    const desktop = stateName.startsWith('desktop');
    const scopes = expectedScopes(stateName);
    const statePages = pages.slice(offset, offset + scopes.length); offset += scopes.length;
    return [stateName, {
      theme: stateName.endsWith('Light') ? 'light' : 'dark', viewport: desktop ? {width: 1440, height: 1000} : {width: 390, height: 844},
      documentGeometry: desktop ? {clientWidth: 1440, scrollWidth: 1440} : {clientWidth: 390, scrollWidth: 390},
      wrappers: WRAPPER_LABELS.map((label, index) => {
        const [clientWidth, scrollWidth, before, after] = EXPECTED_WRAPPERS[stateName][index];
        return {label, clientWidth, scrollWidth, before, after, focus: true, focusVisible: true, outlineWidth: '3px'};
      }),
      relations: RELATIONS.map((relation) => ({...relation, h1: relation.expectedH1, visibleCount: 1, returnedToArticle: true})),
      sources: SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})),
      sty14ActionableCount: 0, logs: [], runtimeEvents: [], diagnostics: {pages: statePages, hasMore: false, truncated: false},
    }];
  }));
  return {
    candidateHead: CANDIDATE_HEAD, stateOrder: [...STATES],
    collection: {browser: 'Codex in-app Browser only', fresh: true, servedUrl: 'http://127.0.0.1:4173/tego-arch/styles/sty-13', build: `local build from exact clean implementation head ${CANDIDATE_HEAD}`, navigationMethod: 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.', observedSvgAsset: {source: 'local Browser pageAssets bundle', contentType: 'image/svg+xml', ...SVG_IDENTITY, viewBox: '0 0 2400 3600'}, diagnosticContinuity: pages},
    states,
    functionalSummary: {status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 16, sourceObservations: 28, sty14ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPages: 57, diagnosticPagesTerminal: true, diagnosticsTruncated: false},
    screenshotEvidence: {status: 'BLOCKED / NOT_ACCEPTED', attempted: 0, accepted: 0, fallbackUsed: false, storage: 'Codex in-app Browser capture status retained in the task conversation; no substituted surface or repository screenshot file.', attempts: []},
  };
}

const [review, raw, backlog, article, svgBytes, immediateReview, ...immediateRaws] = await Promise.all([
  optional(REVIEW, 'utf8'), optional(LOCAL_RAW), required(BACKLOG, 'utf8'), required(ARTICLE, 'utf8'), required(SVG), required(IMMEDIATE_REVIEW),
  ...IMMEDIATE_RAW_IDENTITIES.map(({path}) => required(path)),
]);

test('freezes the complete immediate Batch 13 review/raw/backlog identity', () => assertImmediateBatch13History());

test('keeps the Stage A projection and STY-14 non-actionability separate from immutable history', async () => {
  const documents = await readContentDocuments('content');
  const projectStatus = JSON.parse(await required('src/generated/project-status.json', 'utf8'));
  assert.deepEqual({completed: projectStatus.completed_topics, documents: projectStatus.content_documents, sources: projectStatus.governed_sources}, EXPECTED_STAGE_A);
  assert.match(article, /^# Space-Based Architecture：让状态与处理在亲和分区相遇$/mu);
  assert.equal(documents.flatMap(extractInternalLinks).filter((href) => href === '/styles/sty-14').length, 0, 'STY-14 remains non-actionable');
  assert.equal(svgBytes.length, SVG_IDENTITY.bytes, 'STY-13 SVG exact bytes');
  assert.equal(sha256(svgBytes), SVG_IDENTITY.sha256, 'STY-13 SVG exact SHA-256');
});

test('requires exact-byte four-state local in-app Browser evidence', () => {
  assert.equal(raw?.length, LOCAL_RAW_IDENTITY.bytes, 'exact local Browser raw bytes');
  assert.equal(raw && sha256(raw), LOCAL_RAW_IDENTITY.sha256, 'exact local Browser raw SHA-256');
  assertLocalEvidence(raw && JSON.parse(raw));
});

test('rejects valid-looking wrapper and screenshot byte-identity mutations', {skip: !raw}, () => {
  const evidence = JSON.parse(raw);
  for (const [label, mutate] of [
    ['wrapper geometry drift', (copy) => { copy.states.mobileLight.wrappers[0].scrollWidth += 1; }],
    ['screenshot byte drift', (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; }],
    ['screenshot hash drift', (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); }],
    ['screenshot attempt additive field', (copy) => { copy.screenshotEvidence.attempts[2].verified = true; }],
  ]) {
    const copy = structuredClone(evidence); mutate(copy);
    assert.throws(() => assertLocalEvidence(copy), assert.AssertionError, label);
  }
});

test('requires three independent exact-head zero-finding review verdicts before READY', () => assertReview());

test('exact-schema validator rejects additive and semantic Browser evidence mutations', () => {
  const valid = sampleEvidence();
  assertLocalEvidence(valid);
  const mutations = [
    ['root additive deployment', (copy) => { copy.deployment = 'SUCCESS'; }],
    ['wrong head', (copy) => { copy.candidateHead = '0'.repeat(40); }],
    ['substituted browser', (copy) => { copy.collection.browser = 'Chrome'; }],
    ['fabricated build', (copy) => { copy.collection.build = 'deployed'; }],
    ['collection additive field', (copy) => { copy.collection.verified = true; }],
    ['state additive field', (copy) => { copy.states.desktopLight.visualInspection = 'PASS'; }],
    ['viewport additive field', (copy) => { copy.states.desktopLight.viewport.verified = true; }],
    ['document additive field', (copy) => { copy.states.desktopLight.documentGeometry.verified = true; }],
    ['document overflow', (copy) => { copy.states.mobileLight.documentGeometry.scrollWidth = 800; }],
    ['wrapper additive field', (copy) => { copy.states.desktopLight.wrappers[0].verified = true; }],
    ['wrapper focus', (copy) => { copy.states.mobileDark.wrappers[0].focusVisible = false; }],
    ['wrapper outline', (copy) => { copy.states.desktopDark.wrappers[1].outlineWidth = '2px'; }],
    ['relation additive click overclaim', (copy) => { copy.states.desktopLight.relations[0].physicallyClicked = true; }],
    ['relation wrong H1', (copy) => { copy.states.desktopLight.relations[0].h1 = 'fabricated'; }],
    ['relation return', (copy) => { copy.states.mobileDark.relations[0].returnedToArticle = false; }],
    ['source additive field', (copy) => { copy.states.desktopLight.sources[0].verified = true; }],
    ['source target', (copy) => { copy.states.mobileLight.sources[0].target = '_self'; }],
    ['STY-14 action', (copy) => { copy.states.desktopLight.sty14ActionableCount = 1; }],
    ['runtime event', (copy) => { copy.states.mobileDark.runtimeEvents.push({method: 'Runtime.exceptionThrown'}); }],
    ['diagnostic page additive field', (copy) => { copy.collection.diagnosticContinuity[0].verified = true; }],
    ['diagnostic hasMore', (copy) => { copy.collection.diagnosticContinuity[1].hasMore = true; }],
    ['diagnostic truncated', (copy) => { copy.states.mobileLight.diagnostics.truncated = true; }],
    ['diagnostic missing action page', (copy) => { copy.collection.diagnosticContinuity.splice(3, 1); }],
    ['diagnostic cursor discontinuity', (copy) => { copy.collection.diagnosticContinuity[2].afterSequence += 1; }],
    ['functional pending', (copy) => { copy.functionalSummary.status = 'PENDING'; }],
    ['screenshot generic pass overclaim', (copy) => { copy.screenshotEvidence.status = 'PASS'; }],
    ['screenshot accepted overclaim', (copy) => { copy.screenshotEvidence.accepted = 4; }],
    ['screenshot fallback', (copy) => { copy.screenshotEvidence.fallbackUsed = true; }],
    ['screenshot nested additive field', (copy) => { copy.screenshotEvidence.verified = true; }],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(valid); mutate(copy);
    assert.throws(() => assertLocalEvidence(copy), assert.AssertionError, label);
  }
});

test('immutable history validator rejects review, raw and backlog suffix mutation', () => {
  assert.throws(() => assertImmediateBatch13History(Buffer.concat([immediateReview, Buffer.from('x')])), assert.AssertionError);
  for (const index of IMMEDIATE_RAW_IDENTITIES.keys()) {
    const copies = immediateRaws.map((value) => Buffer.from(value));
    copies[index] = Buffer.concat([copies[index], Buffer.from('x')]);
    assert.throws(() => assertImmediateBatch13History(immediateReview, copies), assert.AssertionError);
  }
  const baseline = currentReleaseBaseline(backlog);
  assert.throws(() => assertImmediateBatch13History(immediateReview, immediateRaws, backlog.replace(baseline, `${baseline}x`)), assert.AssertionError);
});

test('contract-only review fixture rejects wrong head, nonzero findings, stale pending, fabricated deployment and screenshot overclaim', {skip: !review || !raw}, () => {
  const contractFixture = contractOnlyReadyReviewFixture();
  assertReview(contractFixture);
  const contractHead = contractFixture.match(/^- Exact reviewed candidate head: `([0-9a-f]{40})`\.$/mu)?.[1];
  assert.ok(contractHead, 'contract fixture head');
  for (const [before, after] of [
    [`Exact reviewed candidate head: \`${contractHead}\`.`, `Exact reviewed candidate head: \`${'0'.repeat(40)}\`.`],
    ['findings: `0`; exact head:', 'findings: `1`; exact head:'],
    ['blockers: `0`; exact head:', 'blockers: `1`; exact head:'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Deployment status at this checkpoint: `NOT_RUN`.', 'Deployment status at this checkpoint: `SUCCESS`.'],
    ['captures faithfully cover the production-analysis table viewport, not the opening or full page.', 'Screenshot capture scope: `FULL_PAGE`.'],
  ]) {
    const mutated = contractFixture.replace(before, after);
    assert.notEqual(mutated, contractFixture, `${before} mutation applies`);
    assert.throws(() => assertReview(mutated), assert.AssertionError);
  }
});
