import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access, readFile} from 'node:fs/promises';
import test from 'node:test';

const ARTICLE = 'content/styles/sty-05-microservices.mdx';
const DRAWIO = 'diagrams/sty-05-microservices-order-saga.drawio';
const SVG = 'static/img/diagrams/sty-05-microservices-order-saga.svg';
const ROUTE = '/styles/sty-05';
const SVG_ROUTE = '/img/diagrams/sty-05-microservices-order-saga.svg';
const SOURCE_IDS = [
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-microservicesio-database-per-service',
  'src-microservicesio-saga',
  'src-aws-decompose-business-capability',
  'src-atlas-sty05-microservices-order-saga',
];
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const REVIEWED_HEAD = '40283eeadb9525df93ea884d23bd1953070d78a8';
const BROWSER_ARTIFACT_HASH = 'b139a174432e1684d9a9387e839807fc22b22c6ba0b2cb6e18009536a416f767';
const SCREENSHOT_HASHES = {
  desktopLight: 'b2939596c3ddaadcd2700c32eb019ef943e89160a4e88c896957e8259030ac7e',
  desktopDark: '9f49172f0c2d631799c7b41b92d870913133dfa4ebf9d1d9429f99a3f98c375c',
  mobileLight: '438b4f50bee195a80aac053662d44dd95e75bba4a1bd9723678480f42a1d3b1b',
  mobileDark: '7262a8f5e2066ff57eca1bb287e3b8d7f9faa941f3fe043870b748fe286404d7',
};

const [article, backlog, review, manifest, indexes, projectStatus, publicLedger] =
  await Promise.all([
    readFile(new URL(`../${ARTICLE}`, import.meta.url), 'utf8'),
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
    readFile(new URL('../docs/reviews/g009-batch6.md', import.meta.url), 'utf8')
      .catch((error) => error?.code === 'ENOENT' ? '' : Promise.reject(error)),
    readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);

const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));
const stylesById = new Map(indexes.style.map((topic) => [topic.id, topic]));
const publicSourcesById = new Map(publicLedger.sources.map((source) => [source.id, source]));
const publishedRoutes = new Set(manifest.topics.filter(({published}) => published).map(({slug}) => slug));

function markdownLinks(source) {
  return [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)].map(([, target]) => target);
}

function sha256(source) {
  return createHash('sha256').update(source).digest('hex');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function section(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const matches = headings.filter((match) => match[1] === heading);
  assert.equal(matches.length, 1, `review must contain one ${heading} section`);
  const match = matches[0];
  const next = headings.find((candidate) => candidate.index > match.index);
  return source.slice(match.index + match[0].length, next?.index ?? source.length).trim();
}

function assertFinalIndependentReview(source) {
  const independent = section(source, 'Independent review checkpoint');
  for (const literal of [
    `Exact reviewed head: \`${REVIEWED_HEAD}\`.`,
    'Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.',
    'Independent content, evidence, and rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent architecture reviewer (`architect`): `CLEAR / READY`; findings: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) {
    assert.ok(independent.includes(literal), `independent-review literal: ${literal}`);
  }
  assert.doesNotMatch(independent, /`PENDING`|Deployment status: `SUCCESS`/u);
}

function assertFourStateEvidence(source) {
  const browser = section(source, 'Local in-app Browser QA');
  for (const state of STATES) {
    assert.ok(browser.includes(`| \`${state}\` |`), `${state} row`);
  }
  for (const literal of [
    'States accepted: `4/4`.',
    'Wrapper interaction checks: `12/12`.',
    'Relation destination/H1/return checks: `16/16`.',
    'Remote source anchors: `5` per state; unique remote domains: `4` observed per state (minimum `3`).',
    'STY-06 actionable count: `0` in every state.',
    'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.',
    'Visual inspection: diagram `PASS` in light and dark themes.',
  ]) {
    assert.ok(browser.includes(literal), `Browser literal: ${literal}`);
  }
  assert.ok(browser.includes(
    `Raw Browser JSON: \`.superpowers/sdd/task-5-browser-qa.json\`, SHA-256 \`${BROWSER_ARTIFACT_HASH}\`.`,
  ));
  for (const state of STATES) {
    const screenshotLine = browser.split(/\r?\n/u)
      .find((line) => line.includes(`${state} screenshot:`));
    assert.ok(screenshotLine, `${state} screenshot line`);
    assert.match(screenshotLine, /`\.superpowers\/sdd\/task-5-[A-Za-z]+\.jpg`, SHA-256 `[a-f0-9]{64}`/u);
    assert.ok(screenshotLine.includes(SCREENSHOT_HASHES[state]), `${state} exact screenshot SHA-256`);
  }
  assert.match(browser, /visible-DOM href selection \+ direct navigation \(local relation audit fallback\)/u);
}

function assertEvidenceProvenance(source) {
  const implementation = section(source, 'Stage A implementation evidence');
  assert.match(
    implementation,
    /Selector-bound contrast provenance:.*actual `\.sync`, `\.message`, `\.compensation`, `\.edge-label`, canvas, node, and legend presentation/su,
  );
  assert.doesNotMatch(implementation, /hard-coded expected colors unrelated to the selected elements/u);
}

test('projects the exact STY-05 Stage A inventory', () => {
  assert.deepEqual(
    {
      completed_topics: projectStatus.completed_topics,
      content_documents: projectStatus.content_documents,
      governed_sources: projectStatus.governed_sources,
    },
    {completed_topics: 57, content_documents: 100, governed_sources: 519},
  );
  assert.equal(publicLedger.sources.length, 519);

  for (const projection of [topicsById.get('STY-05'), stylesById.get('STY-05')]) {
    assert.equal(projection?.published, true);
    assert.equal(projection?.status.value, 'pending');
    assert.equal(projection?.slug, ROUTE);
  }
  for (const projection of [topicsById.get('STY-06'), stylesById.get('STY-06')]) {
    assert.equal(projection?.published, false);
    assert.equal(projection?.status.value, 'pending');
  }
});

test('publishes only the canonical STY-05 article, SVG, and six governed sources', async () => {
  assert.equal(publishedRoutes.has(ROUTE), true);
  assert.equal(publishedRoutes.has('/styles/sty-06'), false);
  assert.ok(markdownLinks(article).includes(SVG_ROUTE));
  assert.equal(markdownLinks(article).includes('/styles/sty-06'), false);
  await access(new URL(`../static${SVG_ROUTE}`, import.meta.url));
  assert.deepEqual(SOURCE_IDS.filter((sourceId) => publicSourcesById.has(sourceId)), SOURCE_IDS);
});

test('keeps the backlog at the STY-05 pre-closure checkpoint', () => {
  const currentBaseline = backlog.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  assert.match(currentBaseline, /当前 G009，下一项为 STY-05/u);
  assert.match(backlog, /^- \[ \] \*\*STY-05 /mu);
  assert.match(backlog, /^- \[ \] \*\*STY-06 /mu);
});

test('binds exact local artifacts, four-state Browser evidence, and final exact-head review verdicts', async () => {
  assert.match(review, /^# G009 Batch 6 Stage A Review$/mu);
  const projection = section(review, 'Stage A projection');
  assert.match(projection, /57 completed topics \/ 100 content documents \/ 519 governed sources/u);
  assert.match(projection, /STY-05: `published \/ pending`/u);
  assert.match(projection, /STY-06: `unpublished \/ pending`/u);

  for (const artifact of [ARTICLE, DRAWIO, SVG, 'data/source-ledger.json']) {
    const body = await readFile(new URL(`../${artifact}`, import.meta.url));
    assert.match(
      section(review, 'Artifact identities'),
      new RegExp(`\\| ${escapeRegExp(`\`${artifact}\``)} \\| [0-9,]+ \\| ${escapeRegExp(`\`${sha256(body)}\``)} \\|`, 'u'),
      `${artifact} exact SHA-256`,
    );
  }
  assertFourStateEvidence(review);
  assertEvidenceProvenance(review);
  assertFinalIndependentReview(review);
});

test('rejects incomplete evidence, wrong hashes, weakened verdicts, stale PENDING, and fabricated deployment', () => {
  assertFourStateEvidence(review);
  assertFinalIndependentReview(review);
  const mutations = [
    ['missing state', '| `mobileDark` |', '| `mobileMissing` |'],
    ['incomplete state total', 'States accepted: `4/4`.', 'States accepted: `3/4`.'],
    ['wrong artifact hash', BROWSER_ARTIFACT_HASH, '0'.repeat(64)],
    ['wrong screenshot hash', SCREENSHOT_HASHES.mobileDark, '1'.repeat(64)],
    ['truncated diagnostics', '`truncated=false`', '`truncated=true`'],
    ['missing fallback provenance', 'visible-DOM href selection + direct navigation (local relation audit fallback)', 'unrecorded navigation'],
    ['unbound contrast colors', 'Selector-bound contrast provenance:', 'hard-coded expected colors unrelated to the selected elements:'],
    ['wrong reviewed head', `Exact reviewed head: \`${REVIEWED_HEAD}\`.`, `Exact reviewed head: \`${'0'.repeat(40)}\`.`],
    ['weakened code verdict', '`READY / APPROVE`; findings: `0`.', '`READY / COMMENT`; findings: `0`.'],
    ['weakened content verdict', '`CONTENT READY`; rights: `PASS`; findings: `0`.', '`CONTENT CHANGES`; rights: `PASS`; findings: `0`.'],
    ['weakened rights verdict', 'rights: `PASS`; findings: `0`.', 'rights: `UNKNOWN`; findings: `0`.'],
    ['weakened architecture verdict', '`CLEAR / READY`; findings: `0`.', '`BLOCKED`; findings: `1`.'],
    ['stale PENDING final slot', 'Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.', 'Code review (`code-reviewer`): `PENDING`.'],
    ['deployment fabricated', 'Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
  ];
  for (const [label, exact, replacement] of mutations) {
    const mutated = review.replace(exact, replacement);
    assert.notEqual(mutated, review, `${label} mutation must apply`);
    assert.throws(() => {
      assertFourStateEvidence(mutated);
      assertEvidenceProvenance(mutated);
      assertFinalIndependentReview(mutated);
      assert.doesNotMatch(mutated, /Deployment status: `SUCCESS`/u);
    }, {name: 'AssertionError'}, label);
  }
});
