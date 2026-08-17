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
const IMPLEMENTATION_HEAD = 'PENDING';
const EVIDENCE_HEAD = 'PENDING';
const RAW_BROWSER_BYTES = 0;
const RAW_BROWSER_HASH = 'PENDING';
const IMMEDIATE_REVIEW_HASH = 'f7d0aba59dd69d6479bbfbdb6f9f3cf1befadcf076c44ff5f97f31d6452778ed';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = '3a8d6ccda815614132a33ca8ec2c0dca286628c20900d9e32a4403f0ffd56c6b';
const STABLE_ARTIFACT_HASHES = new Map([
  [ARTICLE, '1dcf55ace2a6b8f30da94e81d36d9f79a16db400bc419c35318cc8dbe8eba7b6'],
  [DRAWIO, '36da252d3fe71b1f0c3df6db5a887677b83def7ee11f542f938c9d3027fbf97c'],
  [SVG, '1568fc09dbb6637d54e66d0058d9479cbf2e59d990753489781a119a06fb1a29'],
  [LEDGER, 'cc94104f499f07400785118fb791efed66d9d4588f7b3ba9de160eb031e29a7f'],
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
function assertPendingReview(source) {
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
  assert.ok(qa.includes('Status: `PENDING`; collection has not run.'));
  const checkpoint = section(source, 'Independent review checkpoint');
  for (const literal of [
    'Exact implementation candidate head: `PENDING`.',
    'Exact evidence head: `PENDING`.',
    'Independent code/spec/security review: `PENDING`.',
    'Independent content/evidence/rights review: `PENDING`.',
    'Independent architecture/invariant review: `PENDING`.',
    'Final Stage A review judgment: `PENDING`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), literal);
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
  const changedReview = Buffer.concat([immediateReviewBytes, Buffer.from('\nmutation')]);
  assert.throws(() => assertImmediateHistory(changedReview), assert.AssertionError);
  const changedBacklog = backlog.replace('- [ ] **STY-10 ', '- [x] **STY-10 ');
  assert.notEqual(changedBacklog, backlog, 'current STY-10 mutation applies');
  assert.throws(() => assertStageABacklog(changedBacklog), assert.AssertionError);
});

test('projects canonical STY-09 Stage A truth while STY-10 remains pending and non-actionable', async () => {
  assertProjection();
  assertStageABacklog();
  await assertSty10NonActionable();
});

test('records exact STY-09 artifacts and initial PENDING Stage A gates', async () => {
  assertPendingReview(review);
  await assertArtifactIdentities(review);
  assert.equal(IMPLEMENTATION_HEAD, 'PENDING');
  assert.equal(EVIDENCE_HEAD, 'PENDING');
  assert.equal(RAW_BROWSER_BYTES, 0);
  assert.equal(RAW_BROWSER_HASH, 'PENDING');
  assert.equal(browserBytes, undefined);
});
