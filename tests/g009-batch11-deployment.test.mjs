import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const EXPECTED_STAGE_A = Object.freeze({completed: 62, documents: 106, sources: 550});
export const CURRENT_TOPIC = 'STY-10';
export const NEXT_TOPIC = 'STY-11';
export const REVIEW = 'docs/reviews/g009-batch11.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch11-stage-a-browser.json';

const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch10.md';
const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW_HASH = '69ba4168aa672413d1ed1251365b04f0a85c84eb5aa23d49cc38534d9252337f';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'cd2fadcfbf44800645ca45b6e2b610f38b9af775bb22cef41225bc91dcfdbee5';
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

const [review, raw, immediateReview, backlog, status, documents] = await Promise.all([
  optional(REVIEW, 'utf8'),
  optional(LOCAL_RAW),
  required(IMMEDIATE_REVIEW),
  required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  readContentDocuments('content'),
]);

test('locks the complete immediate STY-09 review and backlog suffix', () => {
  assert.equal(sha256(immediateReview), IMMEDIATE_REVIEW_HASH, 'complete immediate review bytes');
  assert.equal(sha256(currentReleaseBaseline(backlog)), IMMEDIATE_BACKLOG_SUFFIX_HASH, 'complete immediate STY-09 backlog suffix');
});

test('projects exact STY-10 Stage A while STY-11 remains unpublished and non-actionable', () => {
  assert.deepEqual({
    completed: status.completed_topics,
    documents: status.content_documents,
    sources: status.governed_sources,
  }, EXPECTED_STAGE_A);
  const current = documents.find(({metadata}) => metadata.topic_id === CURRENT_TOPIC);
  assert.ok(current, 'STY-10 is published as a content document');
  assert.match(backlog, /^- \[ \] \*\*STY-10 P1\uff5cMicrokernel \/ Plug-in Architecture\*\*/mu);
  assert.equal(documents.some(({metadata}) => metadata.topic_id === NEXT_TOPIC), false, 'STY-11 is unpublished');
  assert.match(backlog, /^- \[ \] \*\*STY-11 P1\uff5cServerless Architecture\*\*/mu);
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-11'), false, 'STY-11 is non-actionable');
});

test('requires the pending Stage A review and exact local Browser evidence', () => {
  assert.ok(review, `${REVIEW} exists`);
  assert.match(review, /^# G009 Batch 11 Stage A Review$/mu);
  assert.match(review, /Projection: `62 completed topics \/ 106 content documents \/ 550 governed sources`/u);
  assert.match(review, /STY-10: `published \/ pending`/u);
  assert.match(review, /STY-11: `unpublished \/ pending \/ non-actionable`; actionable route count: `0`/u);
  assert.ok(review.includes(`Complete immediate STY-09 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\``));
  assert.ok(review.includes(`Complete immediate STY-09 backlog suffix SHA-256: \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\``));
  assert.match(review, /Independent code\/spec\/security review: `PENDING`/u);
  assert.match(review, /Independent content\/evidence\/rights review: `PENDING`/u);
  assert.match(review, /Independent architecture\/invariant review: `PENDING`/u);
  assert.match(review, /Final Stage A review judgment: `PENDING`/u);
  assert.match(review, /Scope boundary: `STAGE_A_ONLY`/u);
  assert.match(review, /Deployment status: `NOT_RUN`/u);
  assert.match(review, /Raw Browser JSON: `NOT_RUN`/u);
  assert.match(review, /Screenshot evidence: `NOT_RUN`/u);
  assert.doesNotMatch(review, /^## Stage B/mu);
  assert.doesNotMatch(review, /Stage B (?:review judgment|deployment status): `(?!PENDING|NOT_RUN)/u);
  assert.equal(raw, undefined, `${LOCAL_RAW} remains absent before Browser collection`);
});
