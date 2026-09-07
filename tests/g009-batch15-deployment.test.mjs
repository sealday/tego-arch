import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const REVIEW = 'docs/reviews/g009-batch15.md';
export const TOPIC_ID = 'STY-14';
export const NEXT_TOPIC = 'STY-15';
export const EXPECTED_CURRENT_PROJECTION = Object.freeze({completed: 84, documents: 126, sources: 599});
export const EXPECTED_STAGE_A_PROJECTION = Object.freeze({completed: 84, documents: 127, sources: 600});
export const EXPECTED_STAGE_B_PROJECTION = Object.freeze({completed: 85, documents: 127, sources: 600});

export const EXPECTED_STAGE_A_TOPIC = Object.freeze({
  id: TOPIC_ID,
  type: 'style',
  title: '架构风格选择矩阵：边界、交互与演进触发器',
  slug: '/styles/sty-14',
  priority: 'P1',
  status: Object.freeze({scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}),
  dependencies: ['STY-00', 'STY-04', 'STY-05', 'STY-06'],
  adjacent_topics: ['STY-04', 'STY-05', 'STY-06'],
  primary_sources: ['https://martinfowler.com/bliki/MonolithFirst.html'],
  related_cases: [],
  related_questions: [],
  reviewed_at: '2026-09-07',
  published: true,
});

export const PENDING_STAGE_A_LINES = Object.freeze([
  '- Scope: `STAGE_A_ONLY`.',
  '- STY-14 lifecycle: `published / pending`.',
  '- STY-15 lifecycle: `absent / unpublished / pending / non-actionable`.',
  '- Projection: `84 completed topics / 127 content documents / 600 governed sources`.',
  '- Code/spec/security review: `PENDING`.',
  '- Content/evidence/rights review: `PENDING`.',
  '- Architecture/invariant review: `PENDING`.',
  '- Final Stage A judgment: `PENDING`.',
  '- Deployment status: `NOT_RUN`.',
]);

const optionalText = (path) => {
  try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; }
};
function exactKeys(value, keys, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} is an object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} exact keys`);
}
function projection(status) {
  return {completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources};
}
function h2Sections(source) {
  return [...source.matchAll(/^## (?<heading>.+)$/gmu)].map((match, index, matches) => {
    const start = match.index + match[0].length;
    const next = [...source.matchAll(/^## .+$/gmu)].find((candidate) => candidate.index > match.index);
    return [match.groups.heading, source.slice(start, next?.index ?? source.length).trim()];
  });
}

export function assertCurrentBaseline(status, manifest) {
  assert.deepEqual(projection(status), EXPECTED_CURRENT_PROJECTION, 'exact pre-STY-14 current 84/126/599 projection');
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID); assert.ok(topic, 'STY-14 canonical backlog projection exists');
  assert.deepEqual({published: topic.published, status: topic.status}, {published: false, status: {scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}}, 'pre-implementation STY-14 remains unpublished/pending');
  assert.equal(manifest.topics.some(({id}) => id === NEXT_TOPIC), false, 'STY-15 is absent from the canonical projection');
}

export function assertStageAProjection(status, manifest, documents = []) {
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-15'), false, 'STY-15 remains non-actionable across all content Markdown/MDX/HTML links');
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID); assert.ok(topic, 'STY-14 Stage A topic record exists');
  assert.equal(topic.published, true, 'STY-14 Stage A projection is absent until the article is generated');
  const selected = Object.fromEntries(Object.keys(EXPECTED_STAGE_A_TOPIC).map((key) => [key, topic[key]]));
  assert.deepEqual(selected, EXPECTED_STAGE_A_TOPIC, 'exact STY-14 Stage A topic projection');
  assert.deepEqual(projection(status), EXPECTED_STAGE_A_PROJECTION, 'exact generated Stage A 84/127/600 projection');
  assert.equal(manifest.topics.some(({id}) => id === NEXT_TOPIC), false, 'STY-15 remains absent, unpublished and non-actionable');
}

export function assertPendingStageAReview(source) {
  assert.ok(source, `${REVIEW} must exist after the Stage A candidate is generated`);
  const sections = h2Sections(source); assert.deepEqual(sections.map(([heading]) => heading), ['Stage A candidate'], 'exact initial review section schema');
  assert.equal(sections[0][1], PENDING_STAGE_A_LINES.join('\n'), 'exact PENDING Stage A review contract');
  for (const line of PENDING_STAGE_A_LINES) assert.equal(source.split(line).length - 1, 1, `one controlled review line: ${line}`);
  assert.doesNotMatch(source, /(?:READY|APPROVE|CONTENT READY|CLEAR \/ READY|SUCCESS|PASS)/u, 'no verdict or deployment success is fabricated in the initial review');
}

function pendingReviewFixture() {
  return `# G009 Batch 15 — STY-14 Architecture Style Choice Matrix Review\n\n## Stage A candidate\n\n${PENDING_STAGE_A_LINES.join('\n')}\n`;
}
function stageAFixture(status, manifest) {
  const projectedStatus = structuredClone(status); projectedStatus.completed_topics = EXPECTED_STAGE_A_PROJECTION.completed; projectedStatus.content_documents = EXPECTED_STAGE_A_PROJECTION.documents; projectedStatus.governed_sources = EXPECTED_STAGE_A_PROJECTION.sources;
  const projectedManifest = structuredClone(manifest); const index = projectedManifest.topics.findIndex(({id}) => id === TOPIC_ID); assert.notEqual(index, -1, 'fixture starts from canonical STY-14 projection'); projectedManifest.topics[index] = {...projectedManifest.topics[index], ...structuredClone(EXPECTED_STAGE_A_TOPIC)};
  return {status: projectedStatus, manifest: projectedManifest};
}
function currentBaselineFixture() {
  return {
    status: {completed_topics: 84, content_documents: 126, governed_sources: 599},
    manifest: {topics: [{id: TOPIC_ID, published: false, status: {scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}}]},
  };
}

const projectStatus = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8'));
const manifest = JSON.parse(readFileSync('src/generated/topic-manifest.json', 'utf8'));

test('STY-14 deployment helpers are GREEN for the current baseline and mutation-sensitive Stage A fixtures', () => {
  const baseline = currentBaselineFixture(); assertCurrentBaseline(baseline.status, baseline.manifest);
  const projected = stageAFixture(baseline.status, baseline.manifest); assertStageAProjection(projected.status, projected.manifest);
  const review = pendingReviewFixture(); assertPendingStageAReview(review);

  const wrongCount = structuredClone(projected); wrongCount.status.content_documents = 126; assert.throws(() => assertStageAProjection(wrongCount.status, wrongCount.manifest), /84\/127\/600/u, 'stale document count rejected');
  const completed = structuredClone(projected); completed.manifest.topics.find(({id}) => id === TOPIC_ID).status.value = 'complete'; assert.throws(() => assertStageAProjection(completed.status, completed.manifest), /exact STY-14 Stage A topic projection/u, 'premature complete status rejected');
  const sty15 = structuredClone(projected); sty15.manifest.topics.push({id: NEXT_TOPIC, published: false}); assert.throws(() => assertStageAProjection(sty15.status, sty15.manifest), /STY-15 remains absent/u, 'fabricated STY-15 rejected');
  const primary = structuredClone(projected); primary.manifest.topics.find(({id}) => id === TOPIC_ID).primary_sources = ['https://example.com/complete-matrix']; assert.throws(() => assertStageAProjection(primary.status, primary.manifest), /exact STY-14 Stage A topic projection/u, 'wrong manifest primary rejected');

  assert.throws(() => assertPendingStageAReview(review.replace('`PENDING`.', '`READY / APPROVE`.')), /exact PENDING Stage A review contract|fabricated/u, 'premature verdict rejected');
  assert.throws(() => assertPendingStageAReview(review.replace('`NOT_RUN`.', '`SUCCESS`.')), /exact PENDING Stage A review contract|fabricated/u, 'fabricated deployment rejected');
  assert.throws(() => assertPendingStageAReview(`${review}\n${PENDING_STAGE_A_LINES[4]}\n`), /exact PENDING Stage A review contract|one controlled review line/u, 'duplicate controlled claim rejected');
  assert.throws(() => assertPendingStageAReview(review.replace('`STAGE_A_ONLY`', '`STAGE_B`')), /exact PENDING Stage A review contract/u, 'wrong scope rejected');
});

test('STY-14 production Stage A review exists with only honest PENDING evidence slots', () => {
  assertPendingStageAReview(optionalText(REVIEW));
});

for (const [format, body] of [
  ['Markdown', '[下一篇](/styles/sty-15#next)'],
  ['MDX', '<Link to="/styles/sty-15/">下一篇</Link>'],
  ['HTML', '<a href="/styles/sty-15?from=sty14">下一篇</a>'],
]) test(`STY-14 deployment helper rejects actionable STY-15 ${format} links anywhere`, () => {
  const baseline = currentBaselineFixture(); const projected = stageAFixture(baseline.status, baseline.manifest);
  assertStageAProjection(projected.status, projected.manifest, [{file: 'other.mdx', body: '待规划的下一篇。'}]);
  assert.throws(() => assertStageAProjection(projected.status, projected.manifest, [{file: 'other.mdx', body}]), /STY-15.*non-actionable/u);
});

test('STY-14 production Stage A projection advances only documents and original-source count', async () => {
  assertStageAProjection(projectStatus, manifest, await readContentDocuments('content'));
});
