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
export const EVIDENCE_HEAD = '7f679b1452584bce633df8835ebef10668bbc46b';
export const INDEPENDENT_REVIEW_HEAD = 'f61c4cf83c1f3e97caa8abe494725db3d61305f3';
export const STATES = Object.freeze(['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark']);
export const DIAGNOSTIC_STATE_ORDER = Object.freeze(['mobileDark', 'mobileLight', 'desktopLight', 'desktopDark']);
export const DIAGNOSTIC_CONTINUITY = Object.freeze([
  Object.freeze({afterSequence: 177, cursor: 178, count: 0, hasMore: false, truncated: false}),
  Object.freeze({afterSequence: 178, cursor: 212, count: 0, hasMore: false, truncated: false}),
  Object.freeze({afterSequence: 212, cursor: 247, count: 0, hasMore: false, truncated: false}),
  Object.freeze({afterSequence: 247, cursor: 268, count: 0, hasMore: false, truncated: false}),
  Object.freeze({afterSequence: 268, cursor: 268, count: 0, hasMore: false, truncated: false}),
]);
export const SCREENSHOTS = Object.freeze([
  Object.freeze({state: 'desktopLight', bytes: 160_987, sha256: '401930b11532de59e113b1a4d4896b3de2c6f00fb23720094abb51b4edfc04da'}),
  Object.freeze({state: 'desktopDark', bytes: 163_811, sha256: '1bf6b508dfc7858f88fcc8bdd7cc042321836e0c8964504a823a8db2147117a0'}),
  Object.freeze({state: 'mobileLight', bytes: 54_856, sha256: 'd3d889a7a1dd5d25cffa87d751f271ef2b0083e3ec5954099eaeb7834dcf35f2'}),
  Object.freeze({state: 'mobileDark', bytes: 54_827, sha256: '5a7bd0b6334206b1bdde52f6a072d3faff38952ac6ec6b138b06f66de1348bad'}),
]);
export const STAGE_A_PUBLISHED_HEAD = 'f8fa62a1c116f1d3bca8633623ed2910af29bedc';
export const STAGE_A_PRODUCTION_RAW_BYTES = 33_721;
export const STAGE_A_PRODUCTION_RAW_SHA256 = 'a28bb3269f2b7545b7d77f2ec506ce5b1bd737924a5db6945481ee8ec5763560';
export const STAGE_A_PRODUCTION_PAGES = Object.freeze({
  workflow: 'Verify and deploy Docusaurus to GitHub Pages',
  runId: 33067038136,
  runUrl: 'https://github.com/sealday/tego-arch/actions/runs/33067038136',
  event: 'push',
  headSha: STAGE_A_PUBLISHED_HEAD,
  status: 'completed',
  conclusion: 'success',
  build: Object.freeze({jobId: 98499561708, status: 'completed', conclusion: 'success'}),
  deploy: Object.freeze({jobId: 98500236998, status: 'completed', conclusion: 'success'}),
});
export const STAGE_A_PRODUCTION_SCREENSHOTS = Object.freeze([
  Object.freeze({state: 'desktopLight', bytes: 160_898, sha256: 'fc5cb49ed49f502659450c841b100327c0a889009256129b3964897a85b86a9d'}),
  Object.freeze({state: 'desktopDark', bytes: 163_194, sha256: 'f7b37d7ae87b5fa2ce239d46a500f9ba50b09b84dc204bfb122844c8aa6827d3'}),
  Object.freeze({state: 'mobileLight', bytes: 38_704, sha256: '10735fbe083f6d7786ac9c0a3d42a8772847061a1f670774800aca98412eec85'}),
  Object.freeze({state: 'mobileDark', bytes: 38_233, sha256: 'e5f5b9a77e2764366551e7e9a3174ba11df9b88763a94ff7720073094812f1b2'}),
]);
const STAGE_A_PRODUCTION_DIAGNOSTICS = Object.freeze([
  Object.freeze({scope: 'desktopLight', afterSequence: 13, cursor: 133, count: 0, hasMore: false, truncated: false}),
  Object.freeze({scope: 'desktopDark', afterSequence: 133, cursor: 216, count: 0, hasMore: false, truncated: false}),
  Object.freeze({scope: 'mobileDark', afterSequence: 438, cursor: 524, count: 0, hasMore: false, truncated: false}),
  Object.freeze({scope: 'mobileLight', afterSequence: 524, cursor: 610, count: 0, hasMore: false, truncated: false}),
  Object.freeze({scope: 'whole-session terminal', afterSequence: 610, cursor: 610, count: 0, hasMore: false, truncated: false}),
]);
const STAGE_A_PRODUCTION_ROUTES = Object.freeze([
  Object.freeze({path: '/tego-arch/', bytes: 17_310, sha256: '37a400214dd5f9c574f773b8ed6bd6db5a7f7609ad612b1ecdfdf94b06d46a5b'}),
  Object.freeze({path: '/tego-arch/styles', bytes: 23_851, sha256: '062251a3113c4366e244dfc44b9bec9013e6eabaa06eefec00cd87d2c3cdadf2'}),
  Object.freeze({path: '/tego-arch/styles/sty-03', bytes: 41_952, sha256: 'a0e8d8f70ee62433928d4b5ad9c8cd9c327d95002f6f671c0ba0688f3bdaafeb'}),
  Object.freeze({path: '/tego-arch/styles/sty-10', bytes: 48_594, sha256: 'f67928cb28da3dd3aa4cab0133f5c8186027698b35787eb4ee82adc97703287b'}),
  Object.freeze({path: '/tego-arch/styles/sty-12', bytes: 46_875, sha256: 'acc189628d31d5a16566ec497c32043a097576f735bf3578a3806a6dad463b08'}),
  Object.freeze({path: '/tego-arch/cases', bytes: 47_702, sha256: '477ef8b9054e57e78a005e8ace290fc23e9412ace3fa62d38270ae3772e9b577'}),
  Object.freeze({path: '/tego-arch/cases/micro-frontends-single-spa', bytes: 62_040, sha256: '8ed2d935444c5c7994adc244c9f4243c49799ebcf63f5eb91948c36f57e27e44'}),
  Object.freeze({path: '/tego-arch/references', bytes: 23_533, sha256: '72d679e026a0cd0b47cd2607f384c7a197772e0624a9204483f3404634e893ff'}),
]);

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
  assert.match(source, /Screenshot evidence: `PASS \/ ACCEPTED`; accepted `4\/4`; fallback used: `false`/u);
  assert.doesNotMatch(source, /Screenshot evidence: `BLOCKED \/ NOT_ACCEPTED`|Browser: `(?:Chrome|Playwright)`/u);
  const checkpoint = markdownSection(source, 'Independent review checkpoint');
  assert.match(checkpoint, new RegExp('^- Exact implementation candidate head: `' + CANDIDATE_HEAD + '`\\.$', 'mu'));
  assert.match(checkpoint, new RegExp('^- Exact Browser evidence head: `' + EVIDENCE_HEAD + '`\\.$', 'mu'));
  assert.match(checkpoint, new RegExp('^- Exact independent review head: `' + INDEPENDENT_REVIEW_HEAD + '`\\.$', 'mu'));
  assert.match(checkpoint, /^- Independent code\/spec\/security review: `READY \/ APPROVE`; findings: `0`\.$/mu);
  assert.match(checkpoint, /^- Independent content\/evidence\/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`\.$/mu);
  assert.match(checkpoint, /^- Independent architecture\/invariant review: `CLEAR \/ READY`; blockers: `0`\.$/mu);
  assert.match(checkpoint, /^- Final Stage A review judgment: `READY`\.$/mu);
  assert.match(checkpoint, /^- Scope boundary: `STAGE_A_ONLY`\.$/mu);
  assert.match(checkpoint, /^- Checkpoint phase: `IMMUTABLE_PRE_PUBLICATION`\.$/mu);
  assert.match(checkpoint, /^- Deployment status at this checkpoint: `NOT_RUN`\.$/mu);
  assert.doesNotMatch(checkpoint, /PENDING|findings: `[1-9]|blockers: `[1-9]|SUCCESS|STAGE_B/u);
}
function assertDiagnostics(state, stateName) {
  exactKeys(state.diagnostics, ['events', 'pages', 'hasMore', 'truncated'], `${stateName} diagnostics`);
  assert.deepEqual(state.logs, [], `${stateName} warning/error logs`);
  assert.deepEqual(state.diagnostics.events, [], `${stateName} Runtime/Log events`);
  assert.ok(state.diagnostics.pages.length >= 1, `${stateName} diagnostic pagination exists`);
  for (const page of state.diagnostics.pages) {
    exactKeys(page, ['afterSequence', 'cursor', 'count', 'hasMore', 'truncated'], `${stateName} diagnostic page`);
    assert.equal(page.count, 0, `${stateName} diagnostic page count`);
    assert.equal(page.hasMore, false, `${stateName} diagnostic page terminal`);
    assert.equal(page.truncated, false, `${stateName} diagnostic page complete`);
    assert.ok(Number.isInteger(page.afterSequence) && page.afterSequence >= 0, `${stateName} diagnostic afterSequence is a non-negative integer`);
    assert.ok(Number.isInteger(page.cursor) && page.cursor >= 0, `${stateName} diagnostic cursor is a non-negative integer`);
    assert.ok(page.cursor >= page.afterSequence, `${stateName} diagnostic cursor never precedes its request`);
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
    exactKeys(page, ['afterSequence', 'cursor', 'count', 'hasMore', 'truncated'], 'collection diagnostic continuity page');
    assert.ok(Number.isInteger(page.afterSequence) && page.afterSequence >= 0, 'collection afterSequence is a non-negative integer');
    assert.ok(Number.isInteger(page.cursor) && page.cursor >= page.afterSequence, 'collection cursor is a non-negative integer at or after its request');
    assert.equal(page.count, 0);
    assert.equal(page.hasMore, false, 'diagnostic continuity terminal');
    assert.equal(page.truncated, false, 'diagnostic continuity complete');
  }
  assert.deepEqual(value.collection.diagnosticContinuity, DIAGNOSTIC_CONTINUITY, 'exact four-state collection order plus whole-session terminal page');
  for (const [index, stateName] of DIAGNOSTIC_STATE_ORDER.entries()) assert.deepEqual(
    value.states[stateName].diagnostics.pages,
    [value.collection.diagnosticContinuity[index]],
    `${stateName} diagnostic page binds collection continuity page ${index + 1}`,
  );
  assert.deepEqual(value.collection.diagnosticContinuity.at(-1), {
    afterSequence: value.collection.diagnosticContinuity.at(-2).cursor,
    cursor: value.collection.diagnosticContinuity.at(-2).cursor,
    count: 0,
    hasMore: false,
    truncated: false,
  }, 'whole-session diagnostics terminate at the final state cursor');
  for (const stateName of STATES) {
    const state = value.states[stateName];
    const desktop = stateName.startsWith('desktop');
    exactKeys(state, ['theme', 'viewport', 'geometry', 'interactions', 'relations', 'logs', 'diagnostics'], `${stateName} state`);
    exactKeys(state.viewport, ['height', 'width'], `${stateName} viewport`);
    exactKeys(state.geometry, ['page', 'wrappers', 'svg', 'sources', 'sty13'], `${stateName} geometry`);
    exactKeys(state.geometry.page, ['clientWidth', 'scrollWidth'], `${stateName} page geometry`);
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark', `${stateName} theme`);
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844}, `${stateName} viewport`);
    assert.equal(state.geometry.page.clientWidth, desktop ? 1440 : 390, `${stateName} document width`);
    assert.equal(state.geometry.page.scrollWidth, desktop ? 1440 : 390, `${stateName} no document overflow`);
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS, `${stateName} wrapper order`);
    assert.equal(state.geometry.wrappers.length, 4, `${stateName} wrappers`);
    for (const wrapper of state.geometry.wrappers) exactKeys(wrapper, ['label', 'clientWidth', 'scrollWidth'], `${stateName} wrapper`);
    assert.equal(state.interactions.length, 4, `${stateName} wrapper interactions`);
    for (const [index, interaction] of state.interactions.entries()) {
      exactKeys(interaction, ['index', 'label', 'key', 'before', 'after', 'delta'], `${stateName} interaction ${index}`);
      exactKeys(interaction.before, ['focus', 'focusVisible', 'outlineWidth', 'scrollLeft'], `${stateName} interaction ${index} before`);
      exactKeys(interaction.after, ['focus', 'focusVisible', 'outlineWidth', 'scrollLeft'], `${stateName} interaction ${index} after`);
      assert.equal(interaction.index, index);
      assert.equal(interaction.label, WRAPPER_LABELS[index]);
      assert.equal(interaction.key, 'ArrowRight');
      assert.deepEqual({focus: interaction.before.focus, focusVisible: interaction.before.focusVisible, outlineWidth: interaction.before.outlineWidth}, {focus: true, focusVisible: true, outlineWidth: '3px'});
      assert.deepEqual({focus: interaction.after.focus, focusVisible: interaction.after.focusVisible, outlineWidth: interaction.after.outlineWidth}, {focus: true, focusVisible: true, outlineWidth: '3px'});
      assert.equal(interaction.after.scrollLeft - interaction.before.scrollLeft, interaction.delta, `${stateName} ArrowRight delta`);
      assert.ok(interaction.delta === 0 || interaction.delta === 40, `${stateName} honest ArrowRight result`);
    }
    for (const relation of state.relations) exactKeys(relation, ['href', 'expectedH1', 'h1', 'returnedToArticle', 'visibleCount'], `${stateName} relation`);
    assert.deepEqual(state.relations.map(({href, expectedH1, h1, visibleCount, returnedToArticle}) => [href, expectedH1, h1, visibleCount, returnedToArticle]), RELATIONS.map(([href, h1]) => [href, h1, h1, 1, true]), `${stateName} exact relation destination/H1/return`);
    for (const source of state.geometry.sources) exactKeys(source, ['href', 'rel', 'target'], `${stateName} source`);
    assert.deepEqual(state.geometry.sources, SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})), `${stateName} exact source links`);
    exactKeys(state.geometry.svg, ['loaded', 'viewBox', 'sourceWidth', 'sourceHeight', 'naturalWidth', 'naturalHeight', 'renderedWidth', 'renderedHeight', 'src', 'observedAssetBytes'], `${stateName} SVG`);
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
  exactKeys(screenshot, ['status', 'attempted', 'accepted', 'fallbackUsed', 'storage', 'attempts'], 'screenshot evidence');
  assert.equal(screenshot.status, 'PASS / ACCEPTED', 'exact accepted visual-evidence status');
  assert.equal(screenshot.attempted, 4, 'exactly one fresh screenshot per state');
  assert.equal(screenshot.accepted, 4, 'all four faithful captures were accepted');
  assert.equal(screenshot.attempts.length, 4, 'all four attempts are recorded');
  assert.equal(screenshot.fallbackUsed, false, 'no substituted screenshot surface');
  assert.equal(screenshot.storage, 'Codex in-app Browser captures retained in the task conversation; no substituted surface or repository screenshot file.');
  for (const [index, attempt] of screenshot.attempts.entries()) {
    exactKeys(attempt, ['state', 'status', 'bytes', 'sha256', 'reason'], `${STATES[index]} screenshot attempt`);
    assert.deepEqual(
      {state: attempt.state, status: attempt.status, bytes: attempt.bytes, sha256: attempt.sha256},
      {...SCREENSHOTS[index], status: 'CAPTURED_ACCEPTED'},
      `${STATES[index]} exact accepted screenshot identity`,
    );
    assert.equal(attempt.reason, 'Faithful viewport capture inspected at original dimensions; content, theme, crop and typography matched the visible state.');
  }
}

function assertStageAProductionReview(source = review, rawBytes = productionRaw) {
  assert.ok(source, `${REVIEW} exists before production evidence is bound`);
  assert.ok(rawBytes, `${PRODUCTION_RAW} is missing; record fresh production Browser evidence`);
  assert.equal(rawBytes.length, STAGE_A_PRODUCTION_RAW_BYTES, 'exact production raw bytes');
  assert.equal(sha256(rawBytes), STAGE_A_PRODUCTION_RAW_SHA256, 'exact production raw SHA-256');
  const section = markdownSection(source, 'Stage A production publication');
  assert.ok(section.includes(`- Exact published Stage A head: \`${STAGE_A_PUBLISHED_HEAD}\`.`));
  assert.ok(section.includes(`- Exact Pages workflow/run: \`${STAGE_A_PRODUCTION_PAGES.workflow}\`; [\`${STAGE_A_PRODUCTION_PAGES.runId}\`](${STAGE_A_PRODUCTION_PAGES.runUrl}); \`headSha=${STAGE_A_PUBLISHED_HEAD}\`; \`event=push\`; \`status=completed\`; \`conclusion=success\`.`));
  assert.ok(section.includes(`- Exact jobs: build \`${STAGE_A_PRODUCTION_PAGES.build.jobId}\` \`completed/success\`; deploy \`${STAGE_A_PRODUCTION_PAGES.deploy.jobId}\` \`completed/success\`.`));
  assert.ok(section.includes('- Production HTTP probes: `8/8` HTML routes returned `200` with `text/html; charset=utf-8`; canonical SVG returned `200` with `image/svg+xml` and exact reviewed bytes/SHA-256.'));
  assert.ok(section.includes(`- Production raw Browser JSON: \`${PRODUCTION_RAW}\`; bytes: \`${rawBytes.length.toLocaleString('en-US')}\`; SHA-256: \`${sha256(rawBytes)}\`.`));
  assert.ok(section.includes('- Production functional Browser QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation observations `12/12`; source observations `28/28`; STY-13 actionable total `0`.'));
  assert.ok(section.includes('- Production diagnostics: accepted pages complete and empty; warning/error logs `0`; Runtime/Log events `0`; terminal page `610 -> 610`; `hasMore=false`; `truncated=false`.'));
  assert.ok(section.includes('- One initial `mobileLight` collection attempt (`216 -> 438`) returned no events but `truncated=true`; it was discarded and replaced by the complete accepted retry (`524 -> 610`).'));
  assert.ok(section.includes('- Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical link click is claimed.'));
  assert.ok(section.includes(`- Production PageAssets bound the fingerprinted SVG to the canonical reviewed identity: \`${SVG_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${SVG_SHA256}\`; bundle \`1 requested / 1 downloaded / 0 failed\`.`));
  assert.ok(section.includes('- Production screenshot evidence: `PASS / ACCEPTED`; accepted `4/4`; fallback used: `false`; captures are faithful viewport captures of the production-analysis table section reached through browser history restoration, not opening or full-page screenshots.'));
  for (const screenshot of STAGE_A_PRODUCTION_SCREENSHOTS) assert.ok(section.includes(
    `| \`${screenshot.state}\` | ${screenshot.bytes.toLocaleString('en-US')} | \`${screenshot.sha256}\` | \`CAPTURED_ACCEPTED\` |`,
  ), `${screenshot.state} production screenshot review identity`);
  assert.ok(section.includes('- Current release status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`; STY-12 backlog status remains `pending` until Stage B closure.'));
  assert.doesNotMatch(section, /PENDING|BLOCKED|substituted browser|Current release status: `(?:STAGE_A_NOT_RUN|STAGE_B_SUCCESS)`|Screenshot capture scope: `(?:OPENING|FULL_PAGE)`/u);
}

function assertStageAProductionEvidence(value) {
  assert.ok(value, `${PRODUCTION_RAW} is missing; capture fresh Stage A production evidence`);
  exactKeys(value, ['implementationHead', 'pages', 'probes', 'collection', 'stateOrder', 'states', 'functionalSummary', 'screenshotEvidence'], 'Stage A production evidence');
  assert.equal(value.implementationHead, STAGE_A_PUBLISHED_HEAD, 'exact published Stage A head');
  assert.deepEqual(value.pages, STAGE_A_PRODUCTION_PAGES, 'exact Pages run and job identity');

  exactKeys(value.probes, ['routes', 'svg'], 'production probes');
  assert.equal(value.probes.routes.length, STAGE_A_PRODUCTION_ROUTES.length, 'eight production HTML routes');
  for (const [index, route] of value.probes.routes.entries()) {
    exactKeys(route, ['path', 'status', 'contentType', 'bytes', 'sha256'], `production route ${index}`);
    assert.deepEqual(route, {...STAGE_A_PRODUCTION_ROUTES[index], status: 200, contentType: 'text/html; charset=utf-8'}, `exact production route ${index}`);
  }
  exactKeys(value.probes.svg, ['path', 'url', 'status', 'contentType', 'bytes', 'sha256'], 'production SVG probe');
  assert.deepEqual(value.probes.svg, {
    path: '/tego-arch/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg',
    url: 'https://sealday.github.io/tego-arch/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg',
    status: 200, contentType: 'image/svg+xml', bytes: SVG_BYTES, sha256: SVG_SHA256,
  });

  exactKeys(value.collection, ['browser', 'fresh', 'servedUrl', 'build', 'navigationMethod', 'observedSvgAsset', 'diagnosticContinuity', 'discardedAttempts'], 'production collection');
  assert.equal(value.collection.browser, 'Codex in-app Browser only');
  assert.equal(value.collection.fresh, true);
  assert.equal(value.collection.servedUrl, 'https://sealday.github.io/tego-arch/styles/sty-12');
  assert.equal(value.collection.build, `GitHub Pages exact Stage A head ${STAGE_A_PUBLISHED_HEAD}; push run ${STAGE_A_PRODUCTION_PAGES.runId}; build job ${STAGE_A_PRODUCTION_PAGES.build.jobId}; deploy job ${STAGE_A_PRODUCTION_PAGES.deploy.jobId}`);
  assert.equal(value.collection.navigationMethod, 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical link click is claimed.');
  exactKeys(value.collection.observedSvgAsset, ['source', 'inventoryId', 'assetId', 'contentType', 'bytes', 'sha256', 'viewBox', 'requested', 'downloaded', 'failed'], 'PageAssets SVG');
  assert.deepEqual(value.collection.observedSvgAsset, {
    source: 'production Browser pageAssets bundle', inventoryId: '2c296ea6-3542-4042-9233-2b0400ba1537', assetId: 'faffe609e627d4f9',
    contentType: 'image/svg+xml', bytes: SVG_BYTES, sha256: SVG_SHA256, viewBox: '0 0 2400 3600', requested: 1, downloaded: 1, failed: 0,
  });
  assert.deepEqual(value.collection.diagnosticContinuity, STAGE_A_PRODUCTION_DIAGNOSTICS, 'exact accepted production diagnostic continuity');
  assert.deepEqual(value.collection.discardedAttempts, [{
    state: 'mobileLight', afterSequence: 216, cursor: 438, count: 0, hasMore: false, truncated: true,
    disposition: 'DISCARDED; replaced by the complete accepted mobileLight retry at 524 -> 610.',
  }], 'honest discarded truncated attempt');

  assert.deepEqual(value.stateOrder, STATES, 'exact production state order');
  exactKeys(value.states, STATES, 'production states');
  const statePage = new Map(STAGE_A_PRODUCTION_DIAGNOSTICS.slice(0, 4).map(({scope, ...page}) => [scope, page]));
  for (const stateName of STATES) {
    const state = value.states[stateName];
    const desktop = stateName.startsWith('desktop');
    exactKeys(state, ['theme', 'viewport', 'geometry', 'interactions', 'relations', 'logs', 'diagnostics'], `${stateName} production state`);
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark');
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844});
    exactKeys(state.geometry, ['page', 'wrappers', 'svg', 'sources', 'sty13'], `${stateName} production geometry`);
    assert.deepEqual(state.geometry.page, desktop ? {clientWidth: 1440, scrollWidth: 1440} : {clientWidth: 390, scrollWidth: 390});
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth, scrollWidth}) => [clientWidth, scrollWidth]), desktop
      ? [[800, 800], [800, 800], [800, 800], [800, 800]]
      : [[358, 358], [358, 800], [358, 358], [358, 358]]);
    for (const wrapper of state.geometry.wrappers) exactKeys(wrapper, ['label', 'clientWidth', 'scrollWidth'], `${stateName} production wrapper`);
    assert.deepEqual(state.geometry.svg, {
      loaded: true, viewBox: '0 0 2400 3600', sourceWidth: 2400, sourceHeight: 3600,
      naturalWidth: 100, naturalHeight: 150, renderedWidth: 800, renderedHeight: 1200,
      src: 'https://sealday.github.io/tego-arch/assets/images/sty-12-micro-frontend-commerce-runtime-f59e777fca88537fe0a140fab619968f.svg', observedAssetBytes: SVG_BYTES,
    });
    assert.deepEqual(state.geometry.sources, SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})));
    assert.equal(state.geometry.sty13, 0);
    assert.equal(state.interactions.length, 4);
    for (const [index, interaction] of state.interactions.entries()) {
      exactKeys(interaction, ['index', 'label', 'key', 'before', 'after', 'delta'], `${stateName} production interaction ${index}`);
      assert.equal(interaction.index, index);
      assert.equal(interaction.label, WRAPPER_LABELS[index]);
      assert.equal(interaction.key, 'ArrowRight');
      const expectedDelta = desktop ? 0 : [0, 40, 0, 0][index];
      assert.equal(interaction.delta, expectedDelta);
      for (const phase of ['before', 'after']) {
        exactKeys(interaction[phase], ['focus', 'focusVisible', 'outlineWidth', 'clientWidth', 'scrollWidth', 'scrollLeft'], `${stateName} interaction ${index} ${phase}`);
        assert.equal(interaction[phase].focus, true);
        assert.equal(interaction[phase].focusVisible, true);
        assert.equal(interaction[phase].outlineWidth, '3px');
        assert.equal(interaction[phase].clientWidth, state.geometry.wrappers[index].clientWidth);
        assert.equal(interaction[phase].scrollWidth, state.geometry.wrappers[index].scrollWidth);
      }
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.scrollLeft, expectedDelta);
    }
    assert.deepEqual(state.relations, RELATIONS.map(([href, h1]) => ({href, expectedH1: h1, h1, visibleCount: 1, returnedToArticle: true})));
    assert.deepEqual(state.logs, []);
    exactKeys(state.diagnostics, ['events', 'pages', 'hasMore', 'truncated'], `${stateName} production diagnostics`);
    assert.deepEqual(state.diagnostics, {events: [], pages: [statePage.get(stateName)], hasMore: false, truncated: false});
  }
  assert.deepEqual(value.functionalSummary, {
    status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 12, sourceObservations: 28,
    sty13ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPagesTerminal: true, diagnosticsTruncated: false,
  });
  exactKeys(value.screenshotEvidence, ['status', 'attempted', 'accepted', 'fallbackUsed', 'storage', 'captureScope', 'attempts'], 'production screenshot evidence');
  assert.deepEqual({
    status: value.screenshotEvidence.status, attempted: value.screenshotEvidence.attempted, accepted: value.screenshotEvidence.accepted,
    fallbackUsed: value.screenshotEvidence.fallbackUsed, storage: value.screenshotEvidence.storage, captureScope: value.screenshotEvidence.captureScope,
  }, {
    status: 'PASS / ACCEPTED', attempted: 4, accepted: 4, fallbackUsed: false,
    storage: 'Codex in-app Browser captures retained in the task conversation; no substituted surface or repository screenshot file.',
    captureScope: 'Faithful viewport captures of the production-analysis table section reached through browser history restoration; not opening or full-page screenshots.',
  });
  assert.equal(value.screenshotEvidence.attempts.length, 4);
  for (const [index, attempt] of value.screenshotEvidence.attempts.entries()) {
    exactKeys(attempt, ['state', 'status', 'bytes', 'sha256', 'reason'], `production screenshot ${index}`);
    assert.deepEqual({state: attempt.state, status: attempt.status, bytes: attempt.bytes, sha256: attempt.sha256}, {...STAGE_A_PRODUCTION_SCREENSHOTS[index], status: 'CAPTURED_ACCEPTED'});
    assert.equal(attempt.reason, 'Faithful viewport capture inspected at original dimensions; content, theme, crop and typography matched the visible production-analysis table section restored by browser history.');
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
const productionRaw = await optional(PRODUCTION_RAW);

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

test('requires exact STY-12 four-state local Browser and accepted screenshot evidence', () => {
  assertLocalEvidence(raw && JSON.parse(raw));
});

test('rejects review head, verdict, pending, deployment and screenshot understatement mutations', {skip: !review || !raw}, () => {
  assertReview();
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    [`Exact Browser evidence head: \`${EVIDENCE_HEAD}\`.`, `Exact Browser evidence head: \`${'0'.repeat(40)}\`.`],
    [`Exact independent review head: \`${INDEPENDENT_REVIEW_HEAD}\`.`, `Exact independent review head: \`${'0'.repeat(40)}\`.`],
    ['findings: `0`.', 'findings: `1`.'],
    ['blockers: `0`.', 'blockers: `1`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Scope boundary: `STAGE_A_ONLY`.', 'Scope boundary: `STAGE_B`.'],
    ['Checkpoint phase: `IMMUTABLE_PRE_PUBLICATION`.', 'Checkpoint phase: `STAGE_B`.'],
    ['Deployment status at this checkpoint: `NOT_RUN`.', 'Deployment status at this checkpoint: `SUCCESS`.'],
    ['Screenshot evidence: `PASS / ACCEPTED`; accepted `4/4`; fallback used: `false`', 'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; accepted `0/4`; fallback used: `false`'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertReview(mutated), assert.AssertionError);
  }
});

test('rejects substituted Browser, incomplete diagnostics, STY-13 actions and screenshot integrity mutations', {skip: !raw}, () => {
  const evidence = JSON.parse(raw);
  assertLocalEvidence(evidence);
  const mutations = [
    ['root deployment overclaim', (copy) => copy.deployment = 'SUCCESS'],
    ['state visual-inspection overclaim', (copy) => copy.states.desktopLight.visualInspection = 'PASS'],
    ['viewport verification overclaim', (copy) => copy.states.desktopLight.viewport.verified = true],
    ['geometry visual-inspection overclaim', (copy) => copy.states.desktopLight.geometry.visualInspection = 'PASS'],
    ['page verification overclaim', (copy) => copy.states.desktopLight.geometry.page.verified = true],
    ['wrapper verification overclaim', (copy) => copy.states.desktopLight.geometry.wrappers[0].verified = true],
    ['SVG visual-inspection overclaim', (copy) => copy.states.desktopLight.geometry.svg.visualInspection = 'PASS'],
    ['source verification overclaim', (copy) => copy.states.desktopLight.geometry.sources[0].verified = true],
    ['interaction PASS overclaim', (copy) => copy.states.desktopLight.interactions[0].PASS = true],
    ['interaction-before verification overclaim', (copy) => copy.states.desktopLight.interactions[0].before.verified = true],
    ['interaction-after verification overclaim', (copy) => copy.states.desktopLight.interactions[0].after.verified = true],
    ['relation verification overclaim', (copy) => copy.states.desktopLight.relations[0].verified = true],
    ['diagnostics verification overclaim', (copy) => copy.states.desktopLight.diagnostics.verified = true],
    ['diagnostic-page verification overclaim', (copy) => copy.states.desktopLight.diagnostics.pages[0].verified = true],
    ['diagnostic-continuity verification overclaim', (copy) => copy.collection.diagnosticContinuity[0].verified = true],
    ['screenshot-attempt visual-inspection overclaim', (copy) => copy.screenshotEvidence.attempts[0].visualInspection = 'PASS'],
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
    ['negative diagnostic cursor', (copy) => copy.states.mobileDark.diagnostics.pages[0].afterSequence = -1],
    ['diagnostic cursor behind request', (copy) => copy.states.mobileDark.diagnostics.pages[0] = {...copy.states.mobileDark.diagnostics.pages[0], afterSequence: 999, cursor: 0}],
    ['collection 999-to-0 cursor regression', (copy) => copy.collection.diagnosticContinuity[0] = {...copy.collection.diagnosticContinuity[0], afterSequence: 999, cursor: 0}],
    ['arbitrary collection continuity cursor', (copy) => copy.collection.diagnosticContinuity[1].cursor += 1],
    ['state page detached from collection', (copy) => copy.states.desktopLight.diagnostics.pages[0].afterSequence += 1],
    ['generic visual PASS', (copy) => copy.screenshotEvidence.status = 'PASS'],
    ['screenshot understatement', (copy) => copy.screenshotEvidence.status = 'BLOCKED / NOT_ACCEPTED'],
    ['accepted overclaim', (copy) => copy.screenshotEvidence.accepted = 5],
    ['attempted overclaim', (copy) => copy.screenshotEvidence.attempted = 5],
    ['screenshot fallback', (copy) => copy.screenshotEvidence.fallbackUsed = true],
    ['screenshot storage overclaim', (copy) => copy.screenshotEvidence.storage = 'Repository screenshot files'],
    ['screenshot status', (copy) => copy.screenshotEvidence.attempts[0].status = 'CAPTURED_REJECTED'],
    ['screenshot bytes', (copy) => copy.screenshotEvidence.attempts[1].bytes += 1],
    ['screenshot hash', (copy) => copy.screenshotEvidence.attempts[2].sha256 = '0'.repeat(64)],
    ['screenshot state order', (copy) => [copy.screenshotEvidence.attempts[2], copy.screenshotEvidence.attempts[3]] = [copy.screenshotEvidence.attempts[3], copy.screenshotEvidence.attempts[2]]],
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

test('requires exact-head Stage A Pages, HTTP/SVG probes and fresh production Browser evidence', () => {
  assert.equal(productionRaw?.length, STAGE_A_PRODUCTION_RAW_BYTES, `${PRODUCTION_RAW} exact bytes`);
  assert.equal(productionRaw && sha256(productionRaw), STAGE_A_PRODUCTION_RAW_SHA256, `${PRODUCTION_RAW} exact SHA-256`);
  assertStageAProductionEvidence(productionRaw && JSON.parse(productionRaw));
  assertStageAProductionReview();
});

test('rejects Stage A production identity, probe, Browser, diagnostic, interaction and screenshot mutations', {skip: !productionRaw}, () => {
  const evidence = JSON.parse(productionRaw);
  assertStageAProductionEvidence(evidence);
  const mutations = [
    ['extra root key', (copy) => copy.deployment = 'SUCCESS'],
    ['published head', (copy) => copy.implementationHead = '0'.repeat(40)],
    ['Pages run', (copy) => copy.pages.runId += 1],
    ['Pages head', (copy) => copy.pages.headSha = '0'.repeat(40)],
    ['build conclusion', (copy) => copy.pages.build.conclusion = 'failure'],
    ['deploy job', (copy) => copy.pages.deploy.jobId += 1],
    ['route status', (copy) => copy.probes.routes[0].status = 404],
    ['route bytes', (copy) => copy.probes.routes[4].bytes += 1],
    ['route SHA', (copy) => copy.probes.routes[7].sha256 = '0'.repeat(64)],
    ['SVG identity', (copy) => copy.probes.svg.sha256 = '0'.repeat(64)],
    ['substituted Browser', (copy) => copy.collection.browser = 'Chrome'],
    ['physical-click overclaim', (copy) => copy.collection.navigationMethod = 'Relations were clicked.'],
    ['PageAssets inventory', (copy) => copy.collection.observedSvgAsset.inventoryId = 'substituted'],
    ['discarded attempt hidden', (copy) => copy.collection.discardedAttempts = []],
    ['accepted diagnostic truncated', (copy) => copy.states.mobileLight.diagnostics.truncated = true],
    ['diagnostic continuity', (copy) => copy.collection.diagnosticContinuity[3].cursor += 1],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['document overflow', (copy) => copy.states.mobileDark.geometry.page.scrollWidth = 800],
    ['wrapper geometry', (copy) => copy.states.mobileLight.geometry.wrappers[1].scrollWidth = 799],
    ['focus-visible', (copy) => copy.states.desktopLight.interactions[0].before.focusVisible = false],
    ['ArrowRight delta', (copy) => copy.states.mobileDark.interactions[1].delta = 0],
    ['relation return', (copy) => copy.states.desktopDark.relations[0].returnedToArticle = false],
    ['source target', (copy) => copy.states.mobileDark.geometry.sources[0].target = '_self'],
    ['STY-13 action', (copy) => copy.states.desktopLight.geometry.sty13 = 1],
    ['runtime event', (copy) => copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'})],
    ['functional understatement', (copy) => copy.functionalSummary.status = 'PENDING'],
    ['screenshot scope overclaim', (copy) => copy.screenshotEvidence.captureScope = 'Opening full-page screenshots.'],
    ['screenshot fallback', (copy) => copy.screenshotEvidence.fallbackUsed = true],
    ['screenshot bytes', (copy) => copy.screenshotEvidence.attempts[2].bytes += 1],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.throws(() => assertStageAProductionEvidence(copy), assert.AssertionError, label);
  }
});

test('rejects Stage A production review identity and screenshot-scope overclaims', {skip: !productionRaw}, () => {
  assertStageAProductionReview();
  for (const [before, after] of [
    [`Exact published Stage A head: \`${STAGE_A_PUBLISHED_HEAD}\`.`, `Exact published Stage A head: \`${'0'.repeat(40)}\`.`],
    [`[\`${STAGE_A_PRODUCTION_PAGES.runId}\`](${STAGE_A_PRODUCTION_PAGES.runUrl})`, '[`0`](https://example.invalid/run/0)'],
    ['Production functional Browser QA: `PASS`', 'Production functional Browser QA: `PENDING`'],
    ['One initial `mobileLight` collection attempt (`216 -> 438`) returned no events but `truncated=true`; it was discarded and replaced by the complete accepted retry (`524 -> 610`).', 'All collection attempts were complete.'],
    ['Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical link click is claimed.', 'Relations were physically clicked.'],
    [`Production PageAssets bound the fingerprinted SVG to the canonical reviewed identity: \`${SVG_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${SVG_SHA256}\`; bundle \`1 requested / 1 downloaded / 0 failed\`.`, 'Production PageAssets passed.'],
    [`| \`mobileLight\` | ${STAGE_A_PRODUCTION_SCREENSHOTS[2].bytes.toLocaleString('en-US')} | \`${STAGE_A_PRODUCTION_SCREENSHOTS[2].sha256}\` | \`CAPTURED_ACCEPTED\` |`, '| `mobileLight` | 1 | `bad` | `CAPTURED_ACCEPTED` |'],
    ['Current release status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`; STY-12 backlog status remains `pending` until Stage B closure.', 'Current release status: `STAGE_B_SUCCESS`; STY-12 backlog status is `complete`.'],
    ['captures are faithful viewport captures of the production-analysis table section reached through browser history restoration, not opening or full-page screenshots.', 'Screenshot capture scope: `FULL_PAGE`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertStageAProductionReview(mutated), assert.AssertionError);
  }
});
