import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const REVIEW_PATH = 'docs/reviews/g010-mth07.md';
const EVIDENCE_PATH = 'docs/reviews/evidence/g010-mth07-stage-a-browser.json';
const EVIDENCE_SHA256 = 'c897a83c73b10f5c5f1a9a9a7ea17d1cb22ec671cd05629c4d288dfc011908a8';
const CANDIDATE_HEAD = 'f32e0cb7ae79fb92a2154c03dfe8bf7b5b203974';
const HISTORICAL_REVIEW_TREE_HASH = 'f02ecfe18e12e7ffaf9e1656f5a0fc718e2395c070655d5ede9c590c1d05bde5';
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPER_LABELS = [
  '企业 AI 四阶段十二门禁图，可横向滚动',
  '企业 AI 十二门禁执行表，可横向滚动',
  '人、AI 与程序职责及停止条件表，可横向滚动',
];
const SOURCE_HREFS = [
  'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10',
  'https://sre.google/workbook/canarying-releases/',
  'https://learn.microsoft.com/en-us/azure/ai-studio/how-to/evaluate-generative-ai-app',
];
const RELATIONS = [
  ['/tego-arch/methods/mth-01', '质量属性工作坊（Quality Attribute Workshop，QAW）'],
  ['/tego-arch/methods/mth-04', '架构适应度函数'],
  ['/tego-arch/methods/mth-06', '从需求到演进的架构闭环'],
  ['/tego-arch/cases/temporal-saga-durable-execution', '持久化执行与长事务：为长时智能体任务建立可恢复边界'],
];
const SCREENSHOTS = {
  desktopLight: ['.superpowers/sdd/g010-mth07-stage-a-desktop-light.png', 1132132, '90133ff57a173f8676528c8ab96aa1b1d5c954715cda14c30a3fcc091075cc1e'],
  desktopDark: ['.superpowers/sdd/g010-mth07-stage-a-desktop-dark.png', 1177629, 'b463dc49bab7e85ef01e711507580299a2de350616ee45010ab56cd839af2816'],
  mobileLight: ['.superpowers/sdd/g010-mth07-stage-a-mobile-light.png', 328573, '5910e866b76b31aac6bda6945ba2912582aa2e4e03f88bd850e0aaab49def078'],
  mobileDark: ['.superpowers/sdd/g010-mth07-stage-a-mobile-dark.png', 441763, '0a74a4b29227f9445fab5e513cc34a58f03d01932a4a60b6c40e805ee16057f9'],
};
const ARTIFACTS = new Map([
  ['content/methods/mth-07-fde-enterprise-ai-delivery.mdx', ['17,527', '427e4655402ed74f5a1bc7e798e84d42df9fb3f1d94de87c0a73e02f542dcf7a']],
  ['diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio', ['10,553', '74dcc5c5ba990dfcdd1d0e2806d06fafa01698452689e18a237ba0f1e321c193']],
  ['static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg', ['10,150', '56a914a2f15894ebd1be9453c648976773dfd616dd1d8718be560f62a84c8a7f']],
  ['data/source-ledger.json', ['1,539,273', 'fef9ec7b2414bc353e37c731fbe39c15d239ec70494938d72b320e7fd0c626d2']],
]);

const [review, evidenceBytes, manifest, indexes, projectStatus, publicLedger] = await Promise.all([
  readFile(path.join(ROOT, REVIEW_PATH), 'utf8').catch((error) => error?.code === 'ENOENT' ? '' : Promise.reject(error)),
  readFile(path.join(ROOT, EVIDENCE_PATH)).catch((error) => error?.code === 'ENOENT' ? Buffer.from('{}') : Promise.reject(error)),
  readFile(path.join(ROOT, 'src/generated/topic-manifest.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/topic-indexes.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/project-status.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/source-ledger.json'), 'utf8').then(JSON.parse),
]);
const evidence = JSON.parse(evidenceBytes);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function section(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const matches = headings.filter((match) => match[1] === heading);
  assert.equal(matches.length, 1, `review must contain one ${heading} section`);
  const next = headings.find((match) => match.index > matches[0].index);
  return source.slice(matches[0].index + matches[0][0].length, next?.index ?? source.length).trim();
}

async function historicalReviewTreeHash() {
  const base = path.join(ROOT, 'docs/reviews');
  async function walk(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    const files = await Promise.all(entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }));
    return files.flat();
  }
  const files = (await walk(base))
    .filter((file) => ![REVIEW_PATH, EVIDENCE_PATH].includes(path.relative(ROOT, file)))
    .sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(path.relative(ROOT, file));
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function assertProjection() {
  assert.deepEqual({
    completed_topics: projectStatus.completed_topics,
    content_documents: projectStatus.content_documents,
    governed_sources: projectStatus.governed_sources,
  }, {completed_topics: 59, content_documents: 102, governed_sources: 529});
  assert.equal(publicLedger.sources.length, 529);
  const mth07 = manifest.topics.find(({id}) => id === 'MTH-07');
  assert.deepEqual(
    [mth07?.published, mth07?.status?.value, mth07?.slug],
    [true, 'reviewed', '/methods/mth-07'],
  );
  assert.deepEqual(
    [indexes.method.find(({id}) => id === 'MTH-07')?.published, indexes.method.find(({id}) => id === 'MTH-07')?.status?.value],
    [true, 'reviewed'],
  );
}

function assertBrowserEvidence(actual) {
  assert.equal(actual.schemaVersion, 1);
  assert.equal(actual.candidateHead, CANDIDATE_HEAD);
  assert.deepEqual(actual.servedBuild, {
    kind: 'exact production build',
    buildCommand: 'npm run build',
    serveCommand: 'npm run serve -- --host 127.0.0.1 --port 4173',
    baseUrl: 'http://127.0.0.1:4173/tego-arch/',
    route: 'http://127.0.0.1:4173/tego-arch/methods/mth-07',
  });
  assert.equal(actual.screenshotEvidence.status, 'ACCEPTED');
  assert.match(actual.screenshotEvidence.basis, /non-empty Uint8Array bytes/u);
  assert.deepEqual(Object.keys(actual.screenshotEvidence.captures), STATES);
  for (const [name, expected] of Object.entries(SCREENSHOTS)) {
    const capture = actual.screenshotEvidence.captures[name];
    assert.deepEqual([capture.path, capture.bytes, capture.sha256], expected);
    assert.ok(capture.bytes > 0);
    assert.match(capture.sha256, /^[0-9a-f]{64}$/u);
  }
  assert.deepEqual(Object.keys(actual.states), STATES);

  const expectedStates = {
    desktopLight: {theme: 'light', viewport: {width: 1440, height: 1000}, clientWidth: 800},
    desktopDark: {theme: 'dark', viewport: {width: 1440, height: 1000}, clientWidth: 800},
    mobileLight: {theme: 'light', viewport: {width: 390, height: 844}, clientWidth: 358},
    mobileDark: {theme: 'dark', viewport: {width: 390, height: 844}, clientWidth: 358},
  };

  for (const [name, expected] of Object.entries(expectedStates)) {
    const state = actual.states[name];
    assert.equal(state.state, name);
    assert.equal(state.theme, expected.theme);
    assert.deepEqual(state.viewport, expected.viewport);
    assert.equal(state.geometry.h1, '企业 AI 前线部署：从 POC 到可复制系统的交付门禁');
    assert.deepEqual(state.geometry.page, {
      clientWidth: expected.viewport.width,
      scrollWidth: expected.viewport.width,
    });
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth}) => clientWidth), [expected.clientWidth, expected.clientWidth, expected.clientWidth]);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth}) => scrollWidth), [800, 1643, 2101]);
    assert.equal(state.interactions.length, 3);
    for (const [index, interaction] of state.interactions.entries()) {
      assert.equal(interaction.label, WRAPPER_LABELS[index]);
      assert.deepEqual(Object.keys(interaction.before), ['focus', 'focusVisible', 'outline', 'scrollLeft']);
      assert.deepEqual(Object.keys(interaction.after), ['focus', 'focusVisible', 'outline', 'scrollLeft']);
      assert.equal(interaction.before.focus, true);
      assert.equal(interaction.before.focusVisible, true);
      assert.match(interaction.before.outline, /solid 3px/u);
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.focus, true);
      assert.equal(interaction.after.focusVisible, true);
      assert.match(interaction.after.outline, /solid 3px/u);
      assert.equal(interaction.after.scrollLeft, state.geometry.wrappers[index].scrollWidth > state.geometry.wrappers[index].clientWidth ? 40 : 0);
    }
    assert.equal(state.geometry.svg.loaded, true);
    assert.deepEqual(state.geometry.svg, {
      loaded: true,
      naturalHeight: 150,
      naturalWidth: 116,
      renderedHeight: 1032,
      renderedWidth: 800,
    });
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_HREFS);
    assert.equal(new Set(state.geometry.sources.map(({href}) => new URL(href).hostname)).size, 3);
    for (const source of state.geometry.sources) {
      assert.equal(source.target, '_blank');
      assert.equal(source.rel, 'noopener noreferrer');
    }
    assert.deepEqual(state.geometry.paginationNext, ['/tego-arch/modeling']);
    assert.equal(state.geometry.nextUnpublishedActionable, 0);
    assert.deepEqual(state.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    assert.equal(new Set(state.relations.map(({href}) => href)).size, RELATIONS.length);
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
      assert.equal(
        relation.navigationMode,
        name.startsWith('desktop') ? 'link click' : 'visible href + direct navigation fallback',
      );
    }
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics.runtimeExceptions, []);
    assert.deepEqual(state.diagnostics.logEntries, []);
    assert.deepEqual(state.diagnostics.events, []);
    assert.equal(state.diagnostics.hasMore, false);
    assert.equal(state.diagnostics.truncated, false);
  }

  const wrapperWidths = STATES.map((name) => actual.states[name].geometry.wrappers.map(({scrollWidth}) => scrollWidth));
  assert.deepEqual(wrapperWidths[1], wrapperWidths[0], 'desktop themes retain exact wrapper widths');
  assert.deepEqual(wrapperWidths[2], wrapperWidths[0], 'mobile retains exact wrapper scroll widths');
  assert.deepEqual(wrapperWidths[3], wrapperWidths[0], 'mobile dark retains exact wrapper scroll widths');
  const svgSizes = STATES.map((name) => actual.states[name].geometry.svg);
  for (const svg of svgSizes.slice(1)) assert.deepEqual(svg, svgSizes[0], 'SVG intrinsic/rendered geometry is exact across states');
}

async function assertReview(source) {
  assert.match(source, /^# G010 MTH-07 Stage A Review$/mu);
  const identity = section(source, 'Candidate identity');
  assert.ok(identity.includes(`Exact candidate head: \`${CANDIDATE_HEAD}\`.`));
  assert.ok(identity.includes(`Immutable historical review tree: \`${HISTORICAL_REVIEW_TREE_HASH}\`.`));
  for (const [artifact, [bytes, hash]] of ARTIFACTS) {
    const body = await readFile(path.join(ROOT, artifact));
    assert.equal(body.length.toLocaleString('en-US'), bytes, `${artifact} byte count fixture`);
    assert.equal(sha256(body), hash, `${artifact} SHA-256 fixture`);
    assert.match(
      identity,
      new RegExp(`\\| ${escapeRegExp(`\`${artifact}\``)} \\| ${escapeRegExp(bytes)} \\| ${escapeRegExp(`\`${hash}\``)} \\|`, 'u'),
      `${artifact} review identity`,
    );
  }

  const projection = section(source, 'Stage A projection');
  assert.match(projection, /59 completed topics \/ 102 content documents \/ 529 governed sources/u);
  assert.match(projection, /MTH-07: `published \/ reviewed`; route: `\/methods\/mth-07`/u);

  const browser = section(source, 'Local in-app Browser QA');
  for (const name of STATES) assert.ok(browser.includes(`| \`${name}\` |`), `${name} review row`);
  for (const literal of [
    'States accepted: `4/4`.',
    'Wrapper interaction checks: `12/12`.',
    'Relation destination/H1/return checks: `16/16`.',
    'Remote source anchors: `3` per state across exactly `3` domains.',
    'Next unpublished actionable link count: `0` in every state.',
    'Every state recorded warning/error logs `0`, runtime exceptions `0`, protocol log entries `0`, `hasMore=false`, and `truncated=false`.',
    'Screenshot byte captures: `ACCEPTED`, `4/4`; no independent visual-review PASS is claimed.',
  ]) assert.ok(browser.includes(literal), `Browser review literal: ${literal}`);
  assert.ok(browser.includes(`Raw Browser JSON: \`${EVIDENCE_PATH}\`, SHA-256 \`${sha256(evidenceBytes)}\`.`));

  const checkpoint = section(source, 'Independent review checkpoint');
  for (const literal of [
    'Code review: `PENDING`.',
    'Content, evidence, and rights review: `PENDING`; rights: `PENDING`.',
    'Architecture review: `PENDING`.',
    'Final Stage A review judgment: `PENDING`.',
    'Scope boundary: `STAGE_A_ONLY`.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), `checkpoint literal: ${literal}`);
  assert.doesNotMatch(checkpoint, /\bREADY\b|\bAPPROVE(?:D)?\b|Deployment status: `SUCCESS`/u);
  assert.doesNotMatch(source, /Visual inspection:.*`PASS`|Screenshot evidence: `PASS`|Deployment status: `SUCCESS`/iu);
}

test('projects exact MTH-07 Stage A totals without publishing a fabricated next topic', () => {
  assertProjection();
  const publishedRoutes = new Set(manifest.topics.filter(({published}) => published).map(({slug}) => slug));
  assert.equal(publishedRoutes.has('/methods/mth-07'), true);
});

test('binds exact candidate artifacts, raw four-state Browser semantics, and pending review slots', async () => {
  assert.equal(sha256(evidenceBytes), EVIDENCE_SHA256);
  assertBrowserEvidence(evidence);
  await assertReview(review);
});

test('preserves every historical review and evidence artifact byte for byte', async () => {
  assert.equal(await historicalReviewTreeHash(), HISTORICAL_REVIEW_TREE_HASH);
});

test('rejects Browser evidence mutations and any fabricated Stage A readiness or deployment', async () => {
  assertBrowserEvidence(evidence);
  const evidenceMutations = [
    ['candidate head', (copy) => copy.candidateHead = '0'.repeat(40)],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['wrong document width', (copy) => copy.states.desktopDark.geometry.page.scrollWidth += 1],
    ['missing wrapper', (copy) => copy.states.mobileLight.geometry.wrappers.pop()],
    ['lost focus-visible', (copy) => copy.states.mobileDark.interactions[0].before.focusVisible = false],
    ['wrong arrow movement', (copy) => copy.states.desktopLight.interactions[1].after.scrollLeft = 0],
    ['unloaded SVG', (copy) => copy.states.mobileLight.geometry.svg.loaded = false],
    ['source drift', (copy) => copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'],
    ['relation H1 drift', (copy) => copy.states.mobileDark.relations[0].h1 = 'fabricated'],
    ['missing relation return', (copy) => copy.states.mobileLight.relations[0].returnedToArticle = false],
    ['unpublished next link', (copy) => copy.states.desktopLight.geometry.nextUnpublishedActionable = 1],
    ['runtime exception', (copy) => copy.states.desktopLight.diagnostics.runtimeExceptions.push('boom')],
    ['truncated protocol log', (copy) => copy.states.desktopLight.diagnostics.truncated = true],
    ['missing screenshot bytes', (copy) => copy.screenshotEvidence.captures.mobileDark.bytes = 0],
  ];
  for (const [label, mutate] of evidenceMutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.throws(() => assertBrowserEvidence(copy), {name: 'AssertionError'}, label);
  }
  assert.notEqual(sha256(Buffer.concat([evidenceBytes, Buffer.from(' ')])), sha256(evidenceBytes));

  for (const [label, before, after] of [
    ['code readiness', 'Code review: `PENDING`.', 'Code review: `READY / APPROVE`.'],
    ['content readiness', 'Content, evidence, and rights review: `PENDING`; rights: `PENDING`.', 'Content, evidence, and rights review: `CONTENT READY`; rights: `PASS`.'],
    ['architecture readiness', 'Architecture review: `PENDING`.', 'Architecture review: `CLEAR / READY`.'],
    ['final readiness', 'Final Stage A review judgment: `PENDING`.', 'Final Stage A review judgment: `READY`.'],
    ['fabricated deployment', 'Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['fabricated visual pass', 'Screenshot byte captures: `ACCEPTED`, `4/4`; no independent visual-review PASS is claimed.', 'Visual inspection: `PASS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    await assert.rejects(() => assertReview(mutated), {name: 'AssertionError'}, label);
  }
});
