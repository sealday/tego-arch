import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const ARTICLE = 'content/styles/sty-06-event-driven-architecture.mdx';
const DRAWIO = 'diagrams/sty-06-event-driven-four-patterns.drawio';
const SVG = 'static/img/diagrams/sty-06-event-driven-four-patterns.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch7.md';
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const SOURCE_IDS = [
  'src-fowler-what-do-you-mean-event-driven',
  'src-microsoft-event-driven-architecture-style',
  'src-microsoft-event-sourcing-pattern',
  'src-cncf-cloudevents-102-spec',
  'src-w3c-scxml-2015',
  'src-atlas-sty06-event-driven-four-patterns',
];

const [review, manifest, indexes, status, publicLedger] = await Promise.all([
  readFile(new URL(`../${REVIEW}`, import.meta.url), 'utf8').catch((error) =>
    error?.code === 'ENOENT' ? '' : Promise.reject(error)),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function section(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const current = headings.filter((match) => match[1] === heading);
  assert.equal(current.length, 1, `review must contain one ${heading} section`);
  const next = headings.find((match) => match.index > current[0].index);
  return source.slice(current[0].index + current[0][0].length, next?.index ?? source.length).trim();
}

function assertProjection() {
  assert.deepEqual({
    completed_topics: status.completed_topics,
    content_documents: status.content_documents,
    governed_sources: status.governed_sources,
  }, {completed_topics: 58, content_documents: 101, governed_sources: 525});
  assert.equal(publicLedger.sources.length, 525);
  const sty06 = manifest.topics.find(({id}) => id === 'STY-06');
  const sty07 = manifest.topics.find(({id}) => id === 'STY-07');
  assert.deepEqual([sty06?.published, sty06?.status.value, sty06?.slug], [true, 'pending', '/styles/sty-06']);
  assert.deepEqual([sty07?.published, sty07?.status.value], [false, 'pending']);
  assert.equal(indexes.style.find(({id}) => id === 'STY-06')?.published, true);
  assert.equal(indexes.style.find(({id}) => id === 'STY-07')?.published, false);
  assert.deepEqual(SOURCE_IDS.filter((id) => publicLedger.sources.some((source) => source.id === id)), SOURCE_IDS);
}

function assertBrowserEvidence(source) {
  const browser = section(source, 'Local in-app Browser QA');
  for (const state of STATES) {
    assert.ok(browser.includes(`| \`${state}\` |`), `${state} evidence row`);
  }
  for (const literal of [
    'States accepted: `4/4`.',
    'Wrapper interaction checks: `12/12`.',
    'Relation destination/H1/return checks: `16/16`.',
    'Remote source anchors: `5` per state; unique remote domains: at least `4` per state.',
    'STY-07 actionable count: `0` in every state.',
    'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.',
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.',
  ]) assert.ok(browser.includes(literal), `Browser literal: ${literal}`);
  assert.match(browser, /Raw Browser JSON: `\.superpowers\/sdd\/sty06-task-4-browser-qa\.json`, SHA-256 `[a-f0-9]{64}`\./u);
  assert.ok(browser.includes('Desktop dark functional status: `acceptedFunctional=true`; `exactViewportFinalRead=false`.'));
}

function assertFinalReview(source) {
  const checkpoint = section(source, 'Independent review checkpoint');
  assert.match(checkpoint, /Exact reviewed head: `[a-f0-9]{40}`\./u);
  for (const literal of [
    'Independent code reviewer (`code-reviewer`): `PENDING`; findings: `NOT_RUN`.',
    'Independent content, evidence, and rights reviewer: `PENDING`; rights: `PENDING`; findings: `NOT_RUN`.',
    'Independent architecture reviewer (`architect`): `PENDING`; findings: `NOT_RUN`.',
    'Final Stage A review judgment: `PENDING`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), `review literal: ${literal}`);
  assert.doesNotMatch(checkpoint, /`READY \/ APPROVE`|`CONTENT READY`|`CLEAR \/ READY`/u);
}

async function assertArtifactIdentities(source) {
  const identities = section(source, 'Artifact identities');
  for (const path of [ARTICLE, DRAWIO, SVG, LEDGER]) {
    const body = await readFile(new URL(`../${path}`, import.meta.url));
    const row = new RegExp(`\\| ${escapeRegExp(`\`${path}\``)} \\| [0-9,]+ \\| ${escapeRegExp(`\`${sha256(body)}\``)} \\|`, 'u');
    assert.match(identities, row, `${path} exact identity`);
  }
}

test('projects the exact STY-06 Stage A candidate without closing Stage B', () => {
  assertProjection();
  assert.equal(manifest.topics.filter(({published}) => published).some(({slug}) => slug === '/styles/sty-07'), false);
});

test('binds exact artifacts, four local Browser states, and pending independent verdict slots', async () => {
  assert.match(review, /^# G009 Batch 7 Stage A Review$/mu);
  assert.match(section(review, 'Stage A projection'), /58 completed topics \/ 101 content documents \/ 525 governed sources/u);
  assert.match(section(review, 'Stage A projection'), /STY-06: `published \/ pending`/u);
  assert.match(section(review, 'Stage A projection'), /STY-07: `unpublished \/ pending`; actionable route count: `0`/u);
  await assertArtifactIdentities(review);
  assertBrowserEvidence(review);
  assertFinalReview(review);
});

test('rejects weakened or fabricated Stage A evidence', async () => {
  await assertArtifactIdentities(review);
  assertBrowserEvidence(review);
  assertFinalReview(review);
  const mutations = [
    ['wrong count', '58 completed topics / 101 content documents / 525 governed sources', '58 completed topics / 100 content documents / 525 governed sources'],
    ['wrong artifact hash', sha256(await readFile(new URL(`../${SVG}`, import.meta.url))), '0'.repeat(64)],
    ['missing Browser state', '| `mobileDark` |', '| `mobileMissing` |'],
    ['truncated diagnostics', 'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.', 'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=true`.'],
    ['fabricated desktop dark exact read', '`acceptedFunctional=true`; `exactViewportFinalRead=false`', '`acceptedFunctional=true`; `exactViewportFinalRead=true`'],
    ['fabricated STY-07 absence', 'STY-07 actionable count: `0` in every state.', 'STY-07 actionable count: `1` in every state.'],
    ['fabricated screenshot success', 'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Visual inspection: diagram `PASS` in light and dark themes.'],
    ['fabricated code verdict', '`PENDING`; findings: `NOT_RUN`.', '`READY / APPROVE`; findings: `0`.'],
    ['fabricated content verdict', '`PENDING`; rights: `PENDING`; findings: `NOT_RUN`.', '`CONTENT READY`; rights: `PASS`; findings: `0`.'],
    ['fabricated architecture verdict', 'Independent architecture reviewer (`architect`): `PENDING`; findings: `NOT_RUN`.', 'Independent architecture reviewer (`architect`): `CLEAR / READY`; findings: `0`.'],
    ['fabricated deployment', 'Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
  ];
  for (const [label, before, after] of mutations) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    await assert.rejects(async () => {
      assert.match(section(mutated, 'Stage A projection'), /58 completed topics \/ 101 content documents \/ 525 governed sources/u);
      await assertArtifactIdentities(mutated);
      assertBrowserEvidence(mutated);
      assertFinalReview(mutated);
      assert.doesNotMatch(mutated, /Visual inspection: diagram `PASS`/u);
    }, {name: 'AssertionError'}, label);
  }
});
