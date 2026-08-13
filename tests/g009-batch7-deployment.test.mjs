import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const ARTICLE = 'content/styles/sty-06-event-driven-architecture.mdx';
const DRAWIO = 'diagrams/sty-06-event-driven-four-patterns.drawio';
const SVG = 'static/img/diagrams/sty-06-event-driven-four-patterns.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch7.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch7-stage-a-browser.json';
const REVIEWED_HEAD = '44fcafbef24b68f14a9cbf4be0b3fba09cc6002d';
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPER_LABELS = [
  '订单事件的四种模式并排比较图，可横向滚动',
  '事件驱动故障检测、自动响应、停止条件与人工责任表，可横向滚动',
  '订单事件四种模式决策矩阵，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-04', '模块化单体：在一个部署单元内保护业务边界'],
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/principles/pr-11', '命令查询分离、CQRS 与读写分离'],
  ['/tego-arch/modeling/mod-08', '状态机建模'],
];
const SOURCE_IDS = [
  'src-fowler-what-do-you-mean-event-driven',
  'src-microsoft-event-driven-architecture-style',
  'src-microsoft-event-sourcing-pattern',
  'src-cncf-cloudevents-102-spec',
  'src-w3c-scxml-2015',
  'src-atlas-sty06-event-driven-four-patterns',
];

const [review, rawBrowserBytes, manifest, indexes, status, publicLedger] = await Promise.all([
  readFile(new URL(`../${REVIEW}`, import.meta.url), 'utf8').catch((error) =>
    error?.code === 'ENOENT' ? '' : Promise.reject(error)),
  readFile(new URL(`../${RAW_BROWSER}`, import.meta.url)),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const rawBrowser = JSON.parse(rawBrowserBytes);

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

function assertRawBrowserEvidence(evidence) {
  assert.equal(evidence.candidateHead, REVIEWED_HEAD);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: evidence.screenshotEvidence.reason,
  });
  assert.ok(evidence.screenshotEvidence.reason.trim().length > 0);
  assert.doesNotMatch(evidence.screenshotEvidence.reason, /\bPASS\b/iu);
  assert.deepEqual(Object.keys(evidence.states), STATES);
  for (const [state, expected] of Object.entries({
    desktopLight: {theme: 'light', width: 1440, height: 1000, clientWidths: [800, 800, 800], scrollLefts: [0, 40, 40]},
    desktopDark: {theme: 'dark', width: 1440, height: 1000, clientWidths: [800, 800, 800], scrollLefts: [0, 40, 40]},
    mobileLight: {theme: 'light', width: 390, height: 844, clientWidths: [358, 358, 358], scrollLefts: [40, 40, 40]},
    mobileDark: {theme: 'dark', width: 390, height: 844, clientWidths: [358, 358, 358], scrollLefts: [40, 40, 40]},
  })) {
    const actual = evidence.states[state];
    assert.deepEqual(actual.viewport, {width: expected.width, height: expected.height});
    assert.equal(actual.theme, expected.theme);
    assert.deepEqual(actual.geometry.page, {clientWidth: expected.width, scrollWidth: expected.width});
    assert.deepEqual(actual.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS);
    assert.deepEqual(actual.geometry.wrappers.map(({clientWidth}) => clientWidth), expected.clientWidths);
    assert.deepEqual(actual.geometry.wrappers.map(({scrollWidth}) => scrollWidth), [800, 1118, 1342]);
    assert.equal(actual.interactions.length, 3);
    for (const [index, interaction] of actual.interactions.entries()) {
      assert.equal(interaction.before.focus, true);
      assert.equal(interaction.before.focusVisible, true);
      assert.match(interaction.before.outline, /solid 3px/u);
      assert.equal(interaction.after.focus, true);
      assert.equal(interaction.after.focusVisible, true);
      assert.match(interaction.after.outline, /solid 3px/u);
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.scrollLeft, expected.scrollLefts[index]);
      assert.equal(
        interaction.after.scrollLeft > interaction.before.scrollLeft,
        actual.geometry.wrappers[index].scrollWidth > actual.geometry.wrappers[index].clientWidth,
      );
    }
    assert.equal(actual.geometry.svg.loaded, true);
    assert.deepEqual(
      [actual.geometry.svg.naturalWidth, actual.geometry.svg.naturalHeight],
      [92, 150],
    );
    assert.deepEqual(
      [actual.geometry.svg.renderedWidth, actual.geometry.svg.renderedHeight],
      [800, 1300],
    );
    assert.equal(actual.geometry.sources.length, 5);
    assert.ok(new Set(actual.geometry.sources.map(({href}) => new URL(href).hostname)).size >= 4);
    for (const source of actual.geometry.sources) {
      assert.equal(source.target, '_blank');
      assert.equal(source.rel, 'noopener noreferrer');
    }
    assert.equal(actual.geometry.sty07, 0);
    assert.deepEqual(actual.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    assert.equal(new Set(actual.relations.map(({href}) => href)).size, RELATIONS.length);
    for (const relation of actual.relations) {
      assert.equal(relation.h1, RELATIONS.find(([href]) => href === relation.href)?.[1]);
      assert.equal(relation.returnedToArticle, true);
    }
    assert.deepEqual(actual.logs, []);
    assert.deepEqual(actual.diagnostics.events, []);
    assert.equal(actual.diagnostics.hasMore, false);
    assert.equal(actual.diagnostics.truncated, false);
  }
}

function assertBrowserEvidence(source, evidence = rawBrowser, evidenceBytes = rawBrowserBytes) {
  assertRawBrowserEvidence(evidence);
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
  assert.ok(browser.includes(`Raw Browser JSON: \`${RAW_BROWSER}\`, SHA-256 \`${sha256(evidenceBytes)}\`.`));
}

function assertFinalReview(source) {
  const checkpoint = section(source, 'Independent review checkpoint');
  assert.ok(checkpoint.includes(`Exact reviewed head: \`${REVIEWED_HEAD}\`.`));
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
    ['wrong reviewed head', `Exact reviewed head: \`${REVIEWED_HEAD}\`.`, `Exact reviewed head: \`${'0'.repeat(40)}\`.`],
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

test('rejects raw Browser count, return, load, diagnostic, and head mutations', () => {
  assertRawBrowserEvidence(rawBrowser);
  const mutations = [
    ['wrong head', (copy) => copy.candidateHead = '0'.repeat(40)],
    ['missing interaction', (copy) => copy.states.desktopDark.interactions.pop()],
    ['missing relation', (copy) => copy.states.mobileLight.relations.pop()],
    ['missing return', (copy) => copy.states.mobileDark.relations[0].returnedToArticle = false],
    ['wrong viewport', (copy) => copy.states.desktopDark.geometry.page.clientWidth = 390],
    ['duplicate wrapper', (copy) => copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0])],
    ['swapped wrappers', (copy) => copy.states.mobileLight.geometry.wrappers.reverse()],
    ['swapped interactions', (copy) => copy.states.desktopLight.interactions.reverse()],
    ['fabricated relation', (copy) => {
      copy.states.desktopDark.relations[0].href = '/tego-arch/styles/sty-99';
      copy.states.desktopDark.relations[0].h1 = '自洽但未经验证的标题';
      copy.states.desktopDark.relations[0].expectedH1 = '自洽但未经验证的标题';
    }],
    ['fabricated screenshot pass', (copy) => copy.screenshotEvidence.status = 'PASS'],
    ['missing screenshot reason', (copy) => copy.screenshotEvidence.reason = ''],
    ['unloaded SVG', (copy) => copy.states.mobileLight.geometry.svg.loaded = false],
    ['truncated diagnostics', (copy) => copy.states.desktopLight.diagnostics.truncated = true],
    ['fabricated STY-07 absence', (copy) => copy.states.desktopLight.geometry.sty07 = 1],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(rawBrowser);
    mutate(copy);
    assert.throws(() => assertRawBrowserEvidence(copy), {name: 'AssertionError'}, label);
  }
  assert.notEqual(sha256(Buffer.from(`${rawBrowserBytes} `)), sha256(rawBrowserBytes));
});
