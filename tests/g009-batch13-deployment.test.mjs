import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const ARTICLE = 'content/styles/sty-12-micro-frontend-architecture.mdx';
export const REVIEW = 'docs/reviews/g009-batch13.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch13-stage-b-production-browser.json';
export const CURRENT_TOPIC = 'STY-12';
export const NEXT_TOPIC = 'STY-13';
export const EXPECTED_STAGE_A = Object.freeze({completed: 64, documents: 108, sources: 565});
export const EXPECTED_STAGE_B = Object.freeze({completed: 65, documents: 108, sources: 565});

export const CANDIDATE_HEAD = 'd672c63a737ae39dcfa0a9a9dd365d1f378f0182';
export const STATES = Object.freeze(['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark']);

const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch12.md';
const IMMEDIATE_REVIEW_HASH = '12b4aa1736041226f6ea574b158815e9fa835469b0e02db66f481d304ac89d87';
const IMMEDIATE_BASELINE_HASH = '0210fad170e4aeefe2f042be2fe6e01552165905bd0083b38bdd6d3b8182d231';
const IMMEDIATE_BASELINE_BYTES = 38_387;
const SVG = 'static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg';
const SVG_BYTES = 35_407;
const SVG_SHA256 = 'c5347b1bf84890cb8e72be387185f2737afefadfdb57090b4fff3d5693e156b3';
const WRAPPER_LABELS = Object.freeze([
  'Micro-Frontend 五种组合方式决策表，可横向滚动',
  'Micro-Frontend 电商运行时、发布与权威状态边界图，可横向滚动',
  'Micro-Frontend 构件所有权矩阵，可横向滚动',
  'Micro-Frontend 六类故障检测、降级与恢复表，可横向滚动',
]);
const RELATIONS = Object.freeze([
  ['/tego-arch/styles/sty-03', '垂直切片架构：按用例收拢变化边界'],
  ['/tego-arch/styles/sty-10', 'Microkernel / Plug-in Architecture：让扩展能力可替换，也让风险止步于边界'],
  ['/tego-arch/cases/micro-frontends-single-spa', '微前端：用垂直业务切片约束跨团队所有权'],
]);
const SOURCE_HREFS = Object.freeze([
  'https://martinfowler.com/articles/micro-frontends.html',
  'https://single-spa.js.org/docs/microfrontends-concept/',
  'https://single-spa.js.org/docs/recommended-setup/',
  'https://html.spec.whatwg.org/multipage/webappapis.html#import-maps',
  'https://www.w3.org/TR/SRI/',
  'https://www.w3.org/TR/CSP3/',
  'https://www.w3.org/TR/longtasks-1/',
]);

const rootUrl = new URL('../', import.meta.url);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const required = (path, encoding) => readFile(new URL(path, rootUrl), encoding);
async function optional(path, encoding) {
  try {
    return await required(path, encoding);
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}
function exactKeys(value, keys, label) {
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} exact keys`);
}
function currentReleaseBaseline(source) {
  const prefix = '- **当前发布基线：** ';
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith(prefix));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice(prefix.length);
}
function assertImmediateBatch12History(reviewBytes = immediateReview, backlogSource = backlog) {
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_HASH, 'complete immediate Batch 12 review bytes');
  const baseline = currentReleaseBaseline(backlogSource);
  assert.equal(Buffer.byteLength(baseline), IMMEDIATE_BASELINE_BYTES, 'complete immediate Batch 12 baseline bytes');
  assert.equal(sha256(baseline), IMMEDIATE_BASELINE_HASH, 'complete immediate Batch 12 baseline SHA-256');
  assert.match(baseline, /^2026-08-26 G009 Batch 12 已完成 STY-11/u);
  assert.match(baseline, /STY-11 为 published\/complete，STY-12 为 unpublished\/pending\/nonactionable/u);
}
function markdownSection(source, heading) {
  const marker = `## ${heading}\n\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${heading} section exists`);
  const contentStart = start + marker.length;
  const end = source.indexOf('\n## ', contentStart);
  return source.slice(contentStart, end === -1 ? source.length : end).trim();
}
function assertReview(source = review, rawBytes = raw) {
  assert.ok(source, `${REVIEW} is missing; record real reviews only after Browser evidence exists`);
  assert.ok(rawBytes, `${LOCAL_RAW} exists before the review is finalized`);
  assert.match(source, /^# G009 Batch 13 Stage A Review$/mu);
  assert.match(source, /Projection: `64 completed topics \/ 108 content documents \/ 565 governed sources`/u);
  assert.match(source, /STY-12: `published \/ pending`/u);
  assert.match(source, /STY-13: `unpublished \/ pending \/ non-actionable`; actionable route count: `0`/u);
  assert.ok(source.includes(`Complete immediate Batch 12 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\``));
  assert.ok(source.includes(`Complete immediate Batch 12 release-baseline SHA-256: \`${IMMEDIATE_BASELINE_HASH}\``));
  assert.ok(source.includes(`Exact implementation candidate head: \`${CANDIDATE_HEAD}\``));
  assert.ok(source.includes(`Raw Browser JSON: \`${LOCAL_RAW}\`; bytes: \`${rawBytes.length.toLocaleString('en-US')}\`; SHA-256: \`${sha256(rawBytes)}\``));
  assert.match(source, /Functional Browser QA: `PASS`; states `4\/4`; wrapper interactions `16\/16`; relation href\/H1\/return observations `12\/12`; source href\/target\/rel observations `28\/28`/u);
  assert.match(source, /STY-13 actionable count: `0` per state/u);
  assert.match(source, /Diagnostics are complete and empty in every state: warning\/error logs `0`, Runtime\/Log events `0`, `hasMore=false`, `truncated=false`/u);
  assert.match(source, /Screenshot evidence: `BLOCKED \/ NOT_ACCEPTED`/u);
  assert.doesNotMatch(source, /Screenshot evidence: `PASS`|Browser: `(?:Chrome|Playwright)`/u);
  const checkpoint = markdownSection(source, 'Independent review checkpoint');
  assert.match(checkpoint, new RegExp('^- Exact implementation candidate head: `' + CANDIDATE_HEAD + '`\\.$', 'mu'));
  assert.match(checkpoint, /^- Exact Browser evidence head: `[0-9a-f]{40}`\.$/mu);
  assert.match(checkpoint, /^- Exact independent review head: `[0-9a-f]{40}`\.$/mu);
  assert.match(checkpoint, /^- Independent code\/spec\/security review: `READY \/ APPROVE`; findings: `0`\.$/mu);
  assert.match(checkpoint, /^- Independent content\/evidence\/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`\.$/mu);
  assert.match(checkpoint, /^- Independent architecture\/invariant review: `CLEAR \/ READY`; blockers: `0`\.$/mu);
  assert.match(checkpoint, /^- Final Stage A review judgment: `READY`\.$/mu);
  assert.match(checkpoint, /^- Scope boundary: `STAGE_A_ONLY`\.$/mu);
  assert.match(checkpoint, /^- Deployment status: `NOT_RUN`\.$/mu);
  assert.doesNotMatch(checkpoint, /PENDING|findings: `[1-9]|blockers: `[1-9]|SUCCESS|STAGE_B/u);
}
function assertDiagnostics(state, stateName) {
  assert.deepEqual(state.logs, [], `${stateName} warning/error logs`);
  assert.deepEqual(state.diagnostics.events, [], `${stateName} Runtime/Log events`);
  assert.ok(state.diagnostics.pages.length >= 1, `${stateName} diagnostic pagination exists`);
  for (const page of state.diagnostics.pages) {
    exactKeys(page, ['afterSequence', 'cursor', 'count', 'hasMore', 'truncated'], `${stateName} diagnostic page`);
    assert.equal(page.count, 0, `${stateName} diagnostic page count`);
    assert.equal(page.hasMore, false, `${stateName} diagnostic page terminal`);
    assert.equal(page.truncated, false, `${stateName} diagnostic page complete`);
    assert.ok(Number.isInteger(page.afterSequence) && Number.isInteger(page.cursor), `${stateName} diagnostic cursors`);
  }
  assert.deepEqual({hasMore: state.diagnostics.hasMore, truncated: state.diagnostics.truncated}, {hasMore: false, truncated: false});
}
function assertLocalEvidence(value) {
  assert.ok(value, `${LOCAL_RAW} is missing; capture real four-state in-app Browser evidence`);
  exactKeys(value, ['candidateHead', 'stateOrder', 'collection', 'states', 'functionalSummary', 'screenshotEvidence'], 'local evidence');
  assert.equal(value.candidateHead, CANDIDATE_HEAD, 'exact clean implementation candidate head');
  assert.deepEqual(value.stateOrder, STATES, 'exact four-state order');
  exactKeys(value.states, STATES, 'four Browser states');
  exactKeys(value.collection, ['browser', 'fresh', 'servedUrl', 'build', 'observedSvgAsset', 'diagnosticContinuity'], 'collection');
  assert.equal(value.collection.browser, 'Codex in-app Browser only', 'no substituted browser');
  assert.equal(value.collection.fresh, true);
  assert.match(value.collection.servedUrl, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/tego-arch\/styles\/sty-12$/u);
  assert.match(value.collection.build, new RegExp(CANDIDATE_HEAD, 'u'));
  assert.deepEqual(value.collection.observedSvgAsset, {
    source: 'Browser pageAssets bundle', contentType: 'image/svg+xml', bytes: SVG_BYTES,
    sha256: SVG_SHA256, viewBox: '0 0 2400 3600', bundleFailures: 0,
  });
  assert.equal(value.collection.diagnosticContinuity.length, 5, 'four states plus whole-session diagnostic continuity');
  for (const page of value.collection.diagnosticContinuity) {
    assert.equal(page.count, 0);
    assert.equal(page.hasMore, false, 'diagnostic continuity terminal');
    assert.equal(page.truncated, false, 'diagnostic continuity complete');
  }
  for (const stateName of STATES) {
    const state = value.states[stateName];
    const desktop = stateName.startsWith('desktop');
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark', `${stateName} theme`);
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844}, `${stateName} viewport`);
    assert.equal(state.geometry.page.clientWidth, desktop ? 1440 : 390, `${stateName} document width`);
    assert.equal(state.geometry.page.scrollWidth, desktop ? 1440 : 390, `${stateName} no document overflow`);
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS, `${stateName} wrapper order`);
    assert.equal(state.geometry.wrappers.length, 4, `${stateName} wrappers`);
    assert.equal(state.interactions.length, 4, `${stateName} wrapper interactions`);
    for (const [index, interaction] of state.interactions.entries()) {
      assert.equal(interaction.index, index);
      assert.equal(interaction.label, WRAPPER_LABELS[index]);
      assert.equal(interaction.key, 'ArrowRight');
      assert.deepEqual({focus: interaction.before.focus, focusVisible: interaction.before.focusVisible, outlineWidth: interaction.before.outlineWidth}, {focus: true, focusVisible: true, outlineWidth: '3px'});
      assert.deepEqual({focus: interaction.after.focus, focusVisible: interaction.after.focusVisible, outlineWidth: interaction.after.outlineWidth}, {focus: true, focusVisible: true, outlineWidth: '3px'});
      assert.equal(interaction.after.scrollLeft - interaction.before.scrollLeft, interaction.delta, `${stateName} ArrowRight delta`);
      assert.ok(interaction.delta === 0 || interaction.delta === 40, `${stateName} honest ArrowRight result`);
    }
    assert.deepEqual(state.relations.map(({href, expectedH1, h1, visibleCount, returnedToArticle}) => [href, expectedH1, h1, visibleCount, returnedToArticle]), RELATIONS.map(([href, h1]) => [href, h1, h1, 1, true]), `${stateName} exact relation destination/H1/return`);
    assert.deepEqual(state.geometry.sources, SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})), `${stateName} exact source links`);
    assert.deepEqual(state.geometry.svg, {
      loaded: true, viewBox: '0 0 2400 3600', sourceWidth: 2400, sourceHeight: 3600,
      naturalWidth: 100, naturalHeight: 150, renderedWidth: 800, renderedHeight: 1200,
      src: state.geometry.svg.src, observedAssetBytes: SVG_BYTES,
    }, `${stateName} exact SVG geometry`);
    assert.match(state.geometry.svg.src, /sty-12-micro-frontend-commerce-runtime-[0-9a-f]+\.svg$/u);
    assert.equal(state.geometry.svg.observedAssetBytes, SVG_BYTES);
    assert.equal(state.geometry.sty13, 0, `${stateName} STY-13 actionable count`);
    assertDiagnostics(state, stateName);
  }
  assert.deepEqual(value.functionalSummary, {
    status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 12,
    sourceObservations: 28, sty13ActionableTotal: 0, warningErrorLogs: 0,
    runtimeAndLogEvents: 0, diagnosticPagesTerminal: true, diagnosticsTruncated: false,
  });
  const screenshot = value.screenshotEvidence;
  assert.equal(screenshot.status, 'BLOCKED / NOT_ACCEPTED', 'screenshot status is separate from functional PASS');
  assert.equal(screenshot.accepted, 0, 'no rejected screenshot is promoted');
  assert.equal(screenshot.attempted, screenshot.attempts.length, 'all attempts are recorded');
  assert.ok(screenshot.attempted >= 0 && screenshot.attempted <= 4, 'at most one honest attempt per state');
  assert.equal(screenshot.fallbackUsed, false, 'no substituted screenshot surface');
  for (const attempt of screenshot.attempts) {
    assert.equal(attempt.status, 'CAPTURED_REJECTED');
    assert.ok(STATES.includes(attempt.state));
    assert.ok(Number.isInteger(attempt.bytes) && attempt.bytes > 0);
    assert.match(attempt.sha256, /^[0-9a-f]{64}$/u);
    assert.ok(typeof attempt.reason === 'string' && attempt.reason.length > 0);
  }
}

const [review, raw, immediateReview, backlog, status, manifest, documents, svgBytes] = await Promise.all([
  optional(REVIEW, 'utf8'),
  optional(LOCAL_RAW),
  required(IMMEDIATE_REVIEW),
  required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  readContentDocuments('content'),
  required(SVG),
]);

test('preserves immutable Batch 12 history and exact STY-12 Stage A projection', () => {
  assertImmediateBatch12History();
  assert.deepEqual({completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}, EXPECTED_STAGE_A);
  const current = manifest.topics.find(({id}) => id === CURRENT_TOPIC);
  const next = manifest.topics.find(({id}) => id === NEXT_TOPIC);
  assert.deepEqual({published: current?.published, status: current?.status?.value}, {published: true, status: 'pending'});
  assert.deepEqual({published: next?.published, status: next?.status?.value}, {published: false, status: 'pending'});
  assert.ok(documents.some(({metadata}) => metadata.topic_id === CURRENT_TOPIC), 'STY-12 content is published');
  assert.equal(documents.some(({metadata}) => metadata.topic_id === NEXT_TOPIC), false, 'STY-13 content is unpublished');
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-13'), false, 'STY-13 remains non-actionable');
  assert.match(backlog, /^- \[ \] \*\*STY-12 P1｜Micro-Frontend\*\*/mu);
  assert.match(backlog, /^- \[ \] \*\*STY-13 P2｜Space-Based Architecture\*\*/mu);
  assert.equal(svgBytes.length, SVG_BYTES, 'reviewed STY-12 SVG exact bytes');
  assert.equal(sha256(svgBytes), SVG_SHA256, 'reviewed STY-12 SVG exact SHA-256');
});

test('requires the missing STY-12 Stage A review with exact heads and three zero-finding verdicts', () => {
  assertReview();
});

test('requires the missing STY-12 four-state local Browser evidence without screenshot overclaim', () => {
  assertLocalEvidence(raw && JSON.parse(raw));
});

test('rejects review head, verdict, pending, deployment and screenshot overclaim mutations', {skip: !review || !raw}, () => {
  assertReview();
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    ['findings: `0`.', 'findings: `1`.'],
    ['blockers: `0`.', 'blockers: `1`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Scope boundary: `STAGE_A_ONLY`.', 'Scope boundary: `STAGE_B`.'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`', 'Screenshot evidence: `PASS`'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertReview(mutated), assert.AssertionError);
  }
});

test('rejects substituted Browser, incomplete diagnostics, STY-13 actions and visual overclaim mutations', {skip: !raw}, () => {
  const evidence = JSON.parse(raw);
  assertLocalEvidence(evidence);
  const mutations = [
    ['candidate head', (copy) => copy.candidateHead = '0'.repeat(40)],
    ['substituted browser', (copy) => copy.collection.browser = 'Chrome'],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['wrong viewport', (copy) => copy.states.mobileLight.viewport.width = 391],
    ['wrapper focus', (copy) => copy.states.desktopLight.interactions[0].before.focusVisible = false],
    ['outline', (copy) => copy.states.desktopDark.interactions[1].after.outlineWidth = '2px'],
    ['relation return', (copy) => copy.states.mobileDark.relations[0].returnedToArticle = false],
    ['source destination', (copy) => copy.states.mobileLight.geometry.sources[0].href = 'https://example.invalid/'],
    ['STY-13 action', (copy) => copy.states.desktopLight.geometry.sty13 = 1],
    ['runtime diagnostic', (copy) => copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'})],
    ['diagnostic continuation', (copy) => copy.states.desktopDark.diagnostics.hasMore = true],
    ['truncated diagnostics', (copy) => copy.states.mobileLight.diagnostics.truncated = true],
    ['visual PASS', (copy) => copy.screenshotEvidence.status = 'PASS'],
    ['screenshot fallback', (copy) => copy.screenshotEvidence.fallbackUsed = true],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.throws(() => assertLocalEvidence(copy), assert.AssertionError, label);
  }
});

test('locks immutable Batch 12 history against byte and baseline mutations', () => {
  assert.throws(() => assertImmediateBatch12History(Buffer.concat([immediateReview, Buffer.from('x')])), assert.AssertionError);
  const baseline = currentReleaseBaseline(backlog);
  const mutated = backlog.replace(baseline, `${baseline}x`);
  assert.throws(() => assertImmediateBatch12History(immediateReview, mutated), assert.AssertionError);
});
