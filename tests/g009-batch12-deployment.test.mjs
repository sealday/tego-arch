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

const ARTICLE = 'content/styles/sty-11-serverless-architecture.mdx';
const LEDGER = 'data/source-ledger.json';
const DRAWIO = 'diagrams/sty-11-serverless-order-fulfillment.drawio';
const SVG = 'static/img/diagrams/sty-11-serverless-order-fulfillment.svg';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch11.md';
const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW_HASH = '9276cb7b4c6e66ac50375a4f58df8220255644afd1f45cb46c943db610c10a39';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'aa6c304cf11bca2472f884cba795782e03b579415b859864c5c4e5d0d60a978f';
const STABLE_IDENTITIES = new Map([
  [ARTICLE, [22_944, 'b10dc45592afb5a9456108cfbc9616de1285e00199615f566df2011102d1ff34']],
  [LEDGER, [1_644_284, '0f3856dc6291e1e8f78622c08c2fa0da8af54d11cc24cbd679a3557ab920beef']],
  [DRAWIO, [45_682, '30d7342c98e646f1f57ab7489081aa178b2ece91fac11fd3e2ac8c5b7955c51f']],
  [SVG, [20_933, '6a280c627194922d8d9300d40388ece52bc3043414c6ac34d327a157153e376f']],
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
  assert.match(source, /Independent code\/spec\/security review: `PENDING`; findings: `PENDING`/u);
  assert.match(source, /Independent content\/evidence\/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`/u);
  assert.match(source, /Independent architecture\/invariant review: `PENDING`; blockers: `PENDING`/u);
  assert.match(source, /Final Stage A review judgment: `PENDING`/u);
  assert.match(source, /Scope boundary: `STAGE_A_ONLY`/u);
  assert.match(source, /Deployment status: `NOT_RUN`/u);
  assert.match(source, /Raw Browser JSON: `NOT_RUN`/u);
  assert.match(source, /Screenshot evidence: `NOT_RUN`/u);
  assert.doesNotMatch(source, /^## Stage B/mu);
  assert.doesNotMatch(source, /Stage B (?:review judgment|deployment status): `(?!PENDING|NOT_RUN)/u);
  assert.doesNotMatch(source, /(?:READY \/ APPROVE|CONTENT READY|CLEAR \/ READY|Final Stage A review judgment: `READY`)/u);
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

test('requires the pending Stage A review while every Browser and deployment artifact remains absent', () => {
  assertPendingReview();
  assert.equal(raw, undefined, `${LOCAL_RAW} remains absent before Browser collection`);
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
    ['Raw Browser JSON: `NOT_RUN`', `Raw Browser JSON: \`${LOCAL_RAW}\``],
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
