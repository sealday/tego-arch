import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const EXPECTED_STAGE_A = Object.freeze({completed: 63, documents: 107, sources: 560});
export const CURRENT_TOPIC = 'STY-11';
export const NEXT_TOPIC = 'STY-12';
export const REVIEW = 'docs/reviews/g009-batch12.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch12-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch12-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch12-stage-b-production-browser.json';
export const STATES = Object.freeze(['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark']);
export const CANDIDATE_HEAD = 'PENDING';
export const LOCAL_RAW_BYTES = 0;
export const LOCAL_RAW_SHA256 = 'PENDING';

const WRAPPER_LABELS = Object.freeze([
  '订单结算与异步履约 Serverless 边界图，可横向滚动',
  'Serverless 执行与状态责任矩阵，可横向滚动',
  'Serverless 七类故障、响应、停止条件与责任表，可横向滚动',
  '冷启动与成本决策表，可横向滚动',
]);
const WRAPPER_SCROLL_WIDTHS = Object.freeze([800, 1024, 1381, 1024]);
const SOURCE_HREFS = Object.freeze([
  'https://github.com/cncf/wg-serverless/blob/79c8a13c26be9066a8723c5896d8aaa0e2ab9e08/whitepapers/serverless-overview/cncf_serverless_whitepaper_v1.0.pdf',
  'https://glossary.cncf.io/serverless/',
  'https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html',
  'https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html',
  'https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html',
  'https://aws.amazon.com/lambda/pricing/',
  'https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale',
  'https://cloud.google.com/run/docs/about-concurrency',
  'https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md',
  'https://github.com/open-workflow-specification/specification/blob/2dd2c84170d5f3e05d58e913e9ca298dcf8d543a/schema/workflow.yaml',
]);
const RELATIONS = Object.freeze([
  ['/tego-arch/styles/sty-06', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
  ['/tego-arch/styles/sty-09', 'Pipes and Filters：用明确合同拆分批处理与流处理'],
  ['/tego-arch/cases/cloudflare-durable-objects-workerd', '把边缘协调收敛到身份寻址的状态单元'],
]);
const SCREENSHOT_ATTEMPTS = Object.freeze([
  ['desktopLight', 838_534, '8640ae56458788dae909a992855e3596a176b38792a1298d1e439b801fcb0bd0', 1440, 10_831],
  ['desktopDark', 839_953, '56b2927cb9d673f16bfcd8f784fe66a523ff1f5b26994af0bc5a99cd2da3190d', 1440, 10_831],
  ['mobileLight', 563_157, 'e27bac3d9ce728cf8b3802eb89ad1c9a7964883d5236d2cf8084b1cdce87f5df', 390, 15_619],
]);

const ARTICLE = 'content/styles/sty-11-serverless-architecture.mdx';
const LEDGER = 'data/source-ledger.json';
const DRAWIO = 'diagrams/sty-11-serverless-order-fulfillment.drawio';
const SVG = 'static/img/diagrams/sty-11-serverless-order-fulfillment.svg';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch11.md';
const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW_HASH = '9276cb7b4c6e66ac50375a4f58df8220255644afd1f45cb46c943db610c10a39';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'aa6c304cf11bca2472f884cba795782e03b579415b859864c5c4e5d0d60a978f';
const STABLE_IDENTITIES = new Map([
  [ARTICLE, [23_126, '85561b6c44acc1518f416e12cb507b6c4a2a57369c6cdda8c8df176165d2bbd6']],
  [LEDGER, [1_644_284, '0f3856dc6291e1e8f78622c08c2fa0da8af54d11cc24cbd679a3557ab920beef']],
  [DRAWIO, [47_529, '9862fcb5be62941553780b2a58751a3f9af2ba7a32dace3549cc3ca6d1daa00e']],
  [SVG, [21_797, 'cab720062be02939b78988613102852453d86aa984ab38226ffc273a856ac251']],
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
function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：** '));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice('- **当前发布基线：** '.length);
}
function assertImmediateHistory(reviewBytes = immediateReview, backlogSource = backlog) {
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_HASH, 'complete immediate Batch 11 review bytes');
  const suffix = currentReleaseBaseline(backlogSource);
  assert.match(suffix, /^2026-08-20 G009 Batch 11 已完成 STY-10/u);
  assert.equal(sha256(suffix), IMMEDIATE_BACKLOG_SUFFIX_HASH, 'complete immediate STY-10 backlog suffix');
}
function assertPendingReview(source = review) {
  assert.ok(source, `${REVIEW} exists`);
  assert.match(source, /^# G009 Batch 12 Stage A Review$/mu);
  assert.match(source, /Projection: `63 completed topics \/ 107 content documents \/ 560 governed sources`/u);
  assert.match(source, /STY-11: `published \/ pending`/u);
  assert.match(source, /STY-12: `unpublished \/ pending \/ non-actionable`; actionable route count: `0`/u);
  for (const [path, [bytes, hash]] of STABLE_IDENTITIES) {
    assert.ok(source.includes(`| \`${path}\` | ${bytes.toLocaleString('en-US')} | \`${hash}\` |`), `${path} exact identity`);
  }
  assert.ok(source.includes(`Complete immediate STY-10 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\``));
  assert.ok(source.includes(`Complete immediate STY-10 backlog suffix SHA-256: \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\``));
  assert.match(source, /Governed STY-11 sources: `11`; remote anchors per state: `10`/u);
  assert.match(source, /Exactly one STY-11 citation is `manifest_primary`/u);
  assert.match(source, /Exact remediation implementation candidate head: `PENDING`/u);
  assert.match(source, /Raw Browser JSON: `NOT_RUN`/u);
  assert.match(source, /Functional Browser QA: `NOT_RUN`/u);
  assert.match(source, /Screenshot evidence: `NOT_RUN`/u);
  assert.match(source, /Independent code\/spec\/security review: `PENDING`; findings: `PENDING`/u);
  assert.match(source, /Independent content\/evidence\/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`/u);
  assert.match(source, /Independent architecture\/invariant review: `PENDING`; blockers: `PENDING`/u);
  assert.match(source, /Final Stage A review judgment: `PENDING`/u);
  assert.match(source, /Scope boundary: `STAGE_A_ONLY`/u);
  assert.match(source, /Deployment status: `NOT_RUN`/u);
  assert.doesNotMatch(source, /^## Stage B/mu);
  assert.doesNotMatch(source, /Stage B (?:review judgment|deployment status): `(?!PENDING|NOT_RUN)/u);
  assert.doesNotMatch(source, /(?:READY \/ APPROVE|CONTENT READY|CLEAR \/ READY|Final Stage A review judgment: `READY`)/u);
}

function assertLocalEvidence(value) {
  assert.ok(value, `${LOCAL_RAW} exists`);
  assert.equal(value.candidateHead, CANDIDATE_HEAD);
  assert.deepEqual(value.stateOrder, STATES);
  assert.deepEqual(value.collection.observedSvgAsset, {
    source: 'Browser pageAssets bundle',
    contentType: 'image/svg+xml',
    bytes: 20_933,
    sha256: STABLE_IDENTITIES.get(SVG)[1],
    viewBox: '0 0 2400 3600',
    bundleFailures: 0,
  });
  assert.deepEqual(value.collection.diagnosticContinuity, [
    {afterSequence: 14, cursor: 86, count: 0, hasMore: false, truncated: false, scope: 'desktopLight'},
    {afterSequence: 86, cursor: 162, count: 0, hasMore: false, truncated: false, scope: 'desktopDark'},
    {afterSequence: 162, cursor: 239, count: 0, hasMore: false, truncated: false, scope: 'discarded mobile theme-restoration probe'},
    {afterSequence: 239, cursor: 311, count: 0, hasMore: false, truncated: false, scope: 'mobileLight'},
    {afterSequence: 311, cursor: 385, count: 0, hasMore: false, truncated: false, scope: 'mobileDark'},
  ]);
  for (const [index, stateName] of STATES.entries()) {
    const state = value.states[stateName];
    assert.ok(state, `${stateName} exists`);
    const desktop = stateName.startsWith('desktop');
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark', `${stateName} theme`);
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844}, `${stateName} viewport`);
    assert.deepEqual(state.geometry.page, desktop
      ? {clientWidth: 1440, scrollWidth: 1440, clientHeight: 1000, scrollHeight: 10_831}
      : {clientWidth: 390, scrollWidth: 390, clientHeight: 844, scrollHeight: 15_619}, `${stateName} page geometry`);
    assert.deepEqual(state.geometry.wrappers, WRAPPER_LABELS.map((label, wrapperIndex) => ({
      label,
      clientWidth: desktop ? 800 : 358,
      scrollWidth: WRAPPER_SCROLL_WIDTHS[wrapperIndex],
    })), `${stateName} exact wrapper geometry`);
    assert.equal(state.interactions.length, 4, `${stateName} interactions`);
    for (const [wrapperIndex, interaction] of state.interactions.entries()) {
      const expectedDelta = desktop && wrapperIndex === 0 ? 0 : 40;
      assert.equal(interaction.index, wrapperIndex);
      assert.equal(interaction.label, WRAPPER_LABELS[wrapperIndex]);
      assert.equal(interaction.key, 'ArrowRight');
      assert.equal(interaction.delta, expectedDelta);
      assert.deepEqual({focus: interaction.before.focus, focusVisible: interaction.before.focusVisible, outlineWidth: interaction.before.outlineWidth, scrollLeft: interaction.before.scrollLeft}, {focus: true, focusVisible: true, outlineWidth: '3px', scrollLeft: 0});
      assert.deepEqual({focus: interaction.after.focus, focusVisible: interaction.after.focusVisible, outlineWidth: interaction.after.outlineWidth, scrollLeft: interaction.after.scrollLeft}, {focus: true, focusVisible: true, outlineWidth: '3px', scrollLeft: expectedDelta});
      assert.match(interaction.before.outline, /solid 3px$/u);
      assert.match(interaction.after.outline, /solid 3px$/u);
    }
    assert.deepEqual(state.relations.map(({href, expectedH1, h1, visibleCount, returnedToArticle}) => [href, expectedH1, h1, visibleCount, returnedToArticle]), RELATIONS.map(([href, h1]) => [href, h1, h1, 1, true]), `${stateName} exact relation destination/H1/return`);
    assert.deepEqual(state.geometry.sources, SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})), `${stateName} exact source links`);
    assert.deepEqual(state.geometry.svg, {
      loaded: true,
      viewBox: '0 0 2400 3600',
      sourceWidth: 2400,
      sourceHeight: 3600,
      naturalWidth: 100,
      naturalHeight: 150,
      renderedWidth: 800,
      renderedHeight: 1200,
      src: '/tego-arch/assets/images/sty-11-serverless-order-fulfillment-dc98eac9a8e157072fe5a6ff2e7084b0.svg',
      observedAssetBytes: 20_933,
    }, `${stateName} exact SVG`);
    assert.equal(state.geometry.sty12, 0, `${stateName} STY-12 actionable count`);
    assert.deepEqual(state.logs, [], `${stateName} warning/error logs`);
    assert.deepEqual(state.diagnostics.events, [], `${stateName} Runtime/Log events`);
    assert.equal(state.diagnostics.pages.length, 1, `${stateName} diagnostic pagination`);
    assert.deepEqual({hasMore: state.diagnostics.hasMore, truncated: state.diagnostics.truncated}, {hasMore: false, truncated: false});
    assert.deepEqual({count: state.diagnostics.pages[0].count, hasMore: state.diagnostics.pages[0].hasMore, truncated: state.diagnostics.pages[0].truncated}, {count: 0, hasMore: false, truncated: false});
    assert.equal(index, STATES.indexOf(stateName));
  }
  assert.deepEqual(value.functionalSummary, {status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 12, sourceObservations: 40, sty12ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPagesTerminal: true, diagnosticsTruncated: false});
  assert.deepEqual({status: value.screenshotEvidence.status, attempted: value.screenshotEvidence.attempted, accepted: value.screenshotEvidence.accepted, noFourthAttempt: value.screenshotEvidence.noFourthAttempt, originalBytesInspected: value.screenshotEvidence.originalBytesInspected}, {status: 'BLOCKED / NOT_ACCEPTED', attempted: 3, accepted: 0, noFourthAttempt: true, originalBytesInspected: true});
  assert.equal(value.screenshotEvidence.attempts.length, 3);
  for (const [index, attempt] of value.screenshotEvidence.attempts.entries()) {
    const [state, bytes, hash, width, height] = SCREENSHOT_ATTEMPTS[index];
    assert.deepEqual({state: attempt.state, status: attempt.status, bytes: attempt.bytes, sha256: attempt.sha256, format: attempt.format, width: attempt.width, height: attempt.height, magic: attempt.magic, uniqueByteValues: attempt.uniqueByteValues}, {state, status: 'CAPTURED_REJECTED', bytes, sha256: hash, format: 'JPEG/JFIF', width, height, magic: 'ffd8ffe000104a4649460001', uniqueByteValues: 256});
    assert.match(attempt.reason, /repeat|blank|omit/iu);
  }
}

const [review, raw, productionRaw, stageBProductionRaw, immediateReview, backlog, status, manifest, documents, stableBytes] = await Promise.all([
  optional(REVIEW, 'utf8'),
  optional(LOCAL_RAW),
  optional(PRODUCTION_RAW),
  optional(STAGE_B_PRODUCTION_RAW),
  required(IMMEDIATE_REVIEW),
  required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  readContentDocuments('content'),
  Promise.all([...STABLE_IDENTITIES.keys()].map((path) => required(path))),
]);

test('locks the complete immediate STY-10 review and backlog suffix with mutation sensitivity', () => {
  assertImmediateHistory();
  for (const changedReview of [Buffer.concat([immediateReview, Buffer.from('x')]), immediateReview.subarray(0, -1)]) {
    assert.throws(() => assertImmediateHistory(changedReview), assert.AssertionError);
  }
  const suffix = currentReleaseBaseline(backlog);
  for (const changedSuffix of [`${suffix}x`, suffix.slice(0, -1)]) {
    const changedBacklog = backlog.replace(suffix, changedSuffix);
    assert.notEqual(changedBacklog, backlog, 'historical suffix mutation applies');
    assert.throws(() => assertImmediateHistory(immediateReview, changedBacklog), assert.AssertionError);
  }
});

test('projects exact STY-11 Stage A while STY-12 remains sole unpublished pending non-actionable next', () => {
  assert.deepEqual({
    completed: status.completed_topics,
    documents: status.content_documents,
    sources: status.governed_sources,
  }, EXPECTED_STAGE_A);
  const current = documents.find(({metadata}) => metadata.topic_id === CURRENT_TOPIC);
  assert.ok(current, 'STY-11 is published as a content document');
  assert.match(backlog, /^- \[ \] \*\*STY-11 P1｜Serverless Architecture\*\*/mu);
  assert.equal(documents.some(({metadata}) => metadata.topic_id === NEXT_TOPIC), false, 'STY-12 is unpublished');
  assert.match(backlog, /^- \[ \] \*\*STY-12 P1｜Micro-Frontend\*\*/mu);
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-12'), false, 'STY-12 is non-actionable');
  const manifestCurrent = manifest.topics.find(({id}) => id === CURRENT_TOPIC);
  const manifestNext = manifest.topics.find(({id}) => id === NEXT_TOPIC);
  assert.deepEqual({published: manifestCurrent?.published, status: manifestCurrent?.status?.value}, {published: true, status: 'pending'});
  assert.deepEqual({published: manifestNext?.published, status: manifestNext?.status?.value}, {published: false, status: 'pending'});
});

test('requires published reciprocal adjacency metadata for both STY-11 adjacent topics', () => {
  for (const topicId of ['STY-06', 'STY-09']) {
    const peer = documents.find(({metadata}) => metadata.topic_id === topicId);
    assert.ok(peer, `${topicId} is published`);
    assert.ok(peer.metadata.adjacent_topics.includes(CURRENT_TOPIC), `${topicId} metadata reciprocates STY-11`);
    const withoutCurrent = {...peer.metadata, adjacent_topics: peer.metadata.adjacent_topics.filter((id) => id !== CURRENT_TOPIC)};
    assert.equal(withoutCurrent.adjacent_topics.includes(CURRENT_TOPIC), false, `${topicId} deletion mutation applies`);
  }
});

test('locks exact STY-11 article, ledger, Draw.io and SVG identities', () => {
  for (const [[path, [bytes, hash]], value] of [...STABLE_IDENTITIES].map((entry, index) => [entry, stableBytes[index]])) {
    assert.equal(value.length, bytes, `${path} bytes`);
    assert.equal(sha256(value), hash, `${path} SHA-256`);
  }
});

test('requires fresh remediation Browser evidence to remain absent before exact-candidate collection', () => {
  assertPendingReview();
  assert.equal(raw, undefined, `${LOCAL_RAW} remains absent before remediation Browser collection`);
  assert.equal(productionRaw, undefined, `${PRODUCTION_RAW} remains absent before deployment`);
  assert.equal(stageBProductionRaw, undefined, `${STAGE_B_PRODUCTION_RAW} remains absent before Stage B`);
});

test('rejects pending review verdict, history, scope, deployment and Stage B fabrication mutations', () => {
  assertPendingReview();
  for (const [before, after] of [
    [IMMEDIATE_REVIEW_HASH, '0'.repeat(64)],
    [IMMEDIATE_BACKLOG_SUFFIX_HASH, '1'.repeat(64)],
    ['Independent code/spec/security review: `PENDING`; findings: `PENDING`', 'Independent code/spec/security review: `READY / APPROVE`; findings: `0`'],
    ['Independent content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`'],
    ['Independent architecture/invariant review: `PENDING`; blockers: `PENDING`', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`'],
    ['Final Stage A review judgment: `PENDING`', 'Final Stage A review judgment: `READY`'],
    ['Scope boundary: `STAGE_A_ONLY`', 'Scope boundary: `STAGE_B`'],
    ['Deployment status: `NOT_RUN`', 'Deployment status: `SUCCESS`'],
    ['Functional Browser QA: `NOT_RUN`', 'Functional Browser QA: `PASS`'],
    ['Screenshot evidence: `NOT_RUN`', 'Screenshot evidence: `PASS`'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertPendingReview(mutated), assert.AssertionError);
  }
  for (const addition of ['\n## Stage B closure candidate\n', '\nStage B deployment status: `SUCCESS`.\n']) {
    assert.throws(() => assertPendingReview(`${review}${addition}`), assert.AssertionError);
  }
});

test('does not accept the prior candidate Browser raw after render-changing remediation', () => {
  assert.equal(raw, undefined, `${LOCAL_RAW} is deliberately absent`);
});
