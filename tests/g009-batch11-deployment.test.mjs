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

const IMPLEMENTATION_HEAD = 'f2cdebb413c7cd96fcb630579c82f0f3b6199983';
const RAW_BROWSER_BYTES = 26_211;
const RAW_BROWSER_HASH = '3ae7ed0786d712e6e09cb1fbd4320473de44f6f6f7acd477b3f1ab35bd8b7e89';
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPERS = [
  '订单平台双平面微内核与进程外插件图，可横向滚动',
  '插件能力、兼容、权限与生命周期八维治理矩阵，可横向滚动',
  '插件五类故障检测、响应、停止条件与人工所有者表，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-04', '模块化单体：在一个部署单元内保护业务边界'],
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/principles/pr-09', '最小权限、安全默认值与纵深防御'],
  ['/tego-arch/principles/pr-12', '开闭原则与接口隔离原则'],
  ['/tego-arch/cases/micro-frontends-single-spa', '微前端：用垂直业务切片约束跨团队所有权'],
];
const SOURCE_LINKS = [
  'https://www.eclipse.org/articles/Article-Plug-in-architecture/plugin_architecture.html',
  'https://docs.osgi.org/specification/osgi.core/7.0.0/framework.lifecycle.html',
  'https://docs.osgi.org/whitepaper/semantic-versioning/040-semantic-versions.html',
  'https://github.com/hashicorp/go-plugin',
  'https://code.visualstudio.com/api/advanced-topics/extension-host',
];
const STATE_CONTRACTS = Object.freeze({
  desktopLight: Object.freeze({
    theme: 'light', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1024, 1305], deltas: [0, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  desktopDark: Object.freeze({
    theme: 'dark', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1024, 1305], deltas: [0, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
  mobileLight: Object.freeze({
    theme: 'light', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1024, 1305], deltas: [40, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  mobileDark: Object.freeze({
    theme: 'dark', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1024, 1305], deltas: [40, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
});
const SVG_GEOMETRY = Object.freeze({
  loaded: true,
  viewBox: '0 0 2400 3900',
  sourceWidth: 2400,
  sourceHeight: 3900,
  naturalHeight: 150,
  naturalWidth: 92,
  renderedHeight: 1300,
  renderedWidth: 800,
  src: '/tego-arch/assets/images/sty-10-microkernel-order-plugins-afa21c8c80186b5f3074ae295d54919e.svg',
});
const SCREENSHOT_REJECTION_REASON = 'The in-app Browser full-page capture repeated viewport content and omitted complete architecture-diagram coverage, so the original bytes cannot support trustworthy whole-page visual review.';
const SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-a-f2cdebb-desktop-light.png', bytes: 1_531_340, sha256: '6fff5ee287070ad1e25ca9215ed07d1f492fc4d6467183ac408828bb8dcdf332', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-a-f2cdebb-desktop-dark.png', bytes: 1_547_151, sha256: '4d24cd3ae4bcb319aa087d2f6a216a41c1fa3aed614a7b947be30f429a5ba180', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-a-f2cdebb-mobile-light.png', bytes: 716_251, sha256: '7ca3d681422f16fcd55731e87dba1bb4cf5a3a2cca387e9793db0190ff8812a4', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
]);

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
function section(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const matches = headings.filter((match) => match[1] === heading);
  assert.equal(matches.length, 1, `review must contain one ${heading} section`);
  const next = headings.find((match) => match.index > matches[0].index);
  return source.slice(matches[0].index + matches[0][0].length, next?.index ?? source.length).trim();
}
function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：** '));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice('- **当前发布基线：** '.length);
}
function assertBrowser(evidence) {
  assert.deepEqual(Object.keys(evidence), ['candidateHead', 'collection', 'states', 'screenshotEvidence']);
  assert.equal(evidence.candidateHead, IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'http://127.0.0.1:3421/tego-arch/styles/sty-10',
  });
  assert.deepEqual(Object.keys(evidence.states), STATES);
  for (const [key, expected] of Object.entries(STATE_CONTRACTS)) {
    const state = evidence.states[key];
    assert.deepEqual([state.theme, state.viewport.width, state.viewport.height], [expected.theme, expected.width, expected.height]);
    assert.deepEqual(state.geometry.page, {clientWidth: expected.width, scrollWidth: expected.width});
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPERS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth}) => clientWidth), expected.clients);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth}) => scrollWidth), expected.scrolls);
    assert.deepEqual(state.interactions.map(({index}) => index), [0, 1, 2]);
    assert.equal(state.geometry.wrappers.length, state.interactions.length);
    for (const [index, interaction] of state.interactions.entries()) {
      assert.deepEqual(interaction, {
        index,
        label: WRAPPERS[index],
        key: 'ArrowRight',
        expectedScrollDelta: expected.deltas[index],
        before: {focus: true, focusVisible: true, outline: expected.outlines[index], scrollLeft: 0},
        after: {focus: true, focusVisible: true, outline: expected.outlines[index], scrollLeft: expected.deltas[index]},
      });
    }
    assert.deepEqual(state.geometry.svg, SVG_GEOMETRY);
    assert.deepEqual(state.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    assert.equal(new Set(state.relations.map(({href}) => href)).size, RELATIONS.length, 'five unique relation destinations');
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
      assert.equal(relation.navigation, 'direct exact-href navigation; no physical relation click claimed');
    }
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_LINKS);
    for (const source of state.geometry.sources) assert.deepEqual([source.target, source.rel], ['_blank', 'noopener noreferrer']);
    assert.equal(state.geometry.sty11, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {events: [], hasMore: false, truncated: false});
  }
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated viewport content and omitted complete architecture-diagram coverage; no visual PASS is claimed.',
    attempts: SCREENSHOT_ATTEMPTS,
  });
}
function assertPendingReview(source) {
  assert.equal(source.match(/^- Screenshot evidence: `BLOCKED \/ NOT_ACCEPTED`\.$/gmu)?.length, 1, 'one honest screenshot verdict');
  assert.equal(source.match(/^- No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed\.$/gmu)?.length, 1, 'one no-overclaim statement');
  assert.doesNotMatch(source, /Screenshot evidence: `PASS`|^Visual PASS is claimed\.$/mu);
  const checkpoint = section(source, 'Independent review checkpoint');
  assert.equal(checkpoint, [
    `- Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`,
    '- Exact Browser evidence head: `PENDING`.',
    '- Exact independent review head: `PENDING`.',
    '- Independent code/spec/security review: `PENDING`; findings: `PENDING`.',
    '- Independent content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.',
    '- Independent architecture/invariant review: `PENDING`; blockers: `PENDING`.',
    '- Final Stage A review judgment: `PENDING`.',
    '- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    '- Deployment status: `NOT_RUN`.',
  ].join('\n'), 'exact pending Stage A checkpoint');
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

test('binds the exact candidate, pending review checkpoint, and local Browser evidence', () => {
  assert.ok(review, `${REVIEW} exists`);
  assert.match(review, /^# G009 Batch 11 Stage A Review$/mu);
  assert.match(review, /Projection: `62 completed topics \/ 106 content documents \/ 550 governed sources`/u);
  assert.match(review, /STY-10: `published \/ pending`/u);
  assert.match(review, /STY-11: `unpublished \/ pending \/ non-actionable`; actionable route count: `0`/u);
  assert.ok(review.includes(`Complete immediate STY-09 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\``));
  assert.ok(review.includes(`Complete immediate STY-09 backlog suffix SHA-256: \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\``));
  assertPendingReview(review);
  assert.ok(review.includes(`Raw Browser JSON: \`${LOCAL_RAW}\`; \`${RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${RAW_BROWSER_HASH}\``));
  assert.match(review, /Screenshot evidence: `BLOCKED \/ NOT_ACCEPTED`/u);
  assert.match(review, /Exactly three fresh IAB full-page captures repeated viewport content and omitted complete architecture-diagram coverage/u);
  assert.match(review, /No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed/u);
  assert.doesNotMatch(review, /^## Stage B/mu);
  assert.doesNotMatch(review, /Stage B (?:review judgment|deployment status): `(?!PENDING|NOT_RUN)/u);
  assert.ok(raw, `${LOCAL_RAW} exists`);
  assertBrowser(JSON.parse(raw));
});

test('rejects wrong pending checkpoint, scope, deployment, and visual overclaim', () => {
  assertPendingReview(review);
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    ['Exact Browser evidence head: `PENDING`.', `Exact Browser evidence head: \`${'1'.repeat(40)}\`.`],
    ['Exact independent review head: `PENDING`.', `Exact independent review head: \`${'2'.repeat(40)}\`.`],
    ['Independent code/spec/security review: `PENDING`; findings: `PENDING`.', 'Independent code/spec/security review: `READY / APPROVE`; findings: `0`.'],
    ['Independent content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.'],
    ['Independent architecture/invariant review: `PENDING`; blockers: `PENDING`.', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.'],
    ['Final Stage A review judgment: `PENDING`.', 'Final Stage A review judgment: `READY`.'],
    ['Scope boundary: `STAGE_A_ONLY`;', 'Scope boundary: `STAGE_B`;'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertPendingReview(mutated), {name: 'AssertionError'});
  }
  for (const [before, after] of [
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `PASS`.'],
    ['No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed.', 'Visual PASS is claimed.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertPendingReview(mutated), {name: 'AssertionError'});
  }
});

test('rejects Browser state, geometry, interaction, relation, source, SVG, diagnostic, STY-11 and screenshot mutations', () => {
  assert.ok(raw, `${LOCAL_RAW} exists`);
  const evidence = JSON.parse(raw);
  assertBrowser(evidence);
  const mutations = [
    (copy) => { copy.candidateHead = '0'.repeat(40); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.page.scrollWidth += 1; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0]); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[0].clientWidth += 1; },
    (copy) => { copy.states.mobileLight.geometry.wrappers[2].scrollWidth += 1; },
    (copy) => { copy.states.desktopDark.interactions[1].expectedScrollDelta += 1; },
    (copy) => { delete copy.states.desktopDark.interactions[1].before.outline; },
    (copy) => { copy.states.desktopDark.interactions[1].after.outline = 'none'; },
    (copy) => { copy.states.mobileDark.interactions[0].before.focusVisible = false; },
    (copy) => { copy.states.mobileLight.relations[4].returnedToArticle = false; },
    (copy) => { copy.states.mobileDark.relations[0].href = '/tego-arch/styles/sty-99'; },
    (copy) => { copy.states.mobileDark.relations[0].h1 = 'fabricated'; },
    (copy) => { copy.states.desktopLight.relations.reverse(); },
    (copy) => { copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'; },
    (copy) => { copy.states.mobileLight.geometry.sources.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.desktopLight.geometry.svg.viewBox = '0 0 2401 3900'; },
    (copy) => { copy.states.desktopDark.geometry.svg.sourceWidth += 1; },
    (copy) => { copy.states.mobileLight.geometry.svg.sourceHeight += 1; },
    (copy) => { copy.states.desktopLight.geometry.svg.naturalWidth += 1; },
    (copy) => { copy.states.desktopDark.geometry.svg.naturalHeight += 1; },
    (copy) => { copy.states.mobileLight.geometry.svg.renderedWidth += 1; },
    (copy) => { copy.states.desktopDark.geometry.svg.renderedHeight += 1; },
    (copy) => { copy.states.mobileDark.geometry.sty11 = 1; },
    (copy) => { copy.states.mobileDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  assert.equal(mutations.length, 35, 'complete explicit Browser mutation inventory');
  for (const mutate of mutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.notDeepEqual(copy, evidence, 'mutation fixture is non-no-op');
    assert.throws(() => assertBrowser(copy), {name: 'AssertionError'});
  }
});

test('binds the complete tracked Browser bytes to one fixed SHA-256', () => {
  assert.ok(raw, `${LOCAL_RAW} exists`);
  assert.equal(raw.length, RAW_BROWSER_BYTES);
  assert.equal(sha256(raw), RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([raw, Buffer.from('x')])), RAW_BROWSER_HASH);
  assert.notEqual(sha256(raw.subarray(0, -1)), RAW_BROWSER_HASH);
});
