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
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch11-stage-a-production-browser.json';

const IMPLEMENTATION_HEAD = 'f2cdebb413c7cd96fcb630579c82f0f3b6199983';
const EVIDENCE_HEAD = 'c9a0deaea262fd802a5ad151f70818a314da1fe4';
const REVIEW_HEAD = 'c9a0deaea262fd802a5ad151f70818a314da1fe4';
const RAW_BROWSER_BYTES = 26_211;
const RAW_BROWSER_HASH = '3ae7ed0786d712e6e09cb1fbd4320473de44f6f6f7acd477b3f1ab35bd8b7e89';
const READY_HEAD = '05bcd441c21aad16418f1b432af49304cdb0808b';
const PRODUCTION_RAW_BYTES = 28_696;
const PRODUCTION_RAW_HASH = 'ccbec59b2392a21170b8fabfbc44ba7fd40ea45b54b69ea43632b33f78122eb7';
const PRODUCTION_PAGES = Object.freeze({
  runId: 32_358_912_394,
  event: 'push',
  headSha: READY_HEAD,
  status: 'completed',
  conclusion: 'success',
  buildJobId: 96_394_049_449,
  buildStatus: 'completed',
  buildConclusion: 'success',
  deployJobId: 96_394_492_501,
  deployStatus: 'completed',
  deployConclusion: 'success',
});
const PRODUCTION_ROUTES = Object.freeze([
  {path: '/tego-arch/', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles/sty-04', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles/sty-05', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles/sty-10', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/principles', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/principles/pr-09', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/principles/pr-12', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/references', status: 200, contentType: 'text/html; charset=utf-8'},
]);
const PRODUCTION_SVG = Object.freeze({
  url: 'https://sealday.github.io/tego-arch/img/diagrams/sty-10-microkernel-order-plugins.svg',
  status: 200,
  contentType: 'image/svg+xml',
  bytes: 20_285,
  sha256: '69080badd0f6500f24b59f4045463c65e17669659da77616ee4520bd4d2c802c',
});
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
const PRODUCTION_SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, observedViewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-a-production-05bcd44-desktop-light.png', bytes: 1_699_955, sha256: '67ea689dde9ca13046bb05218e95360b2d360c824cb58cc59a08fb555f53bc30', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, observedViewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-a-production-05bcd44-desktop-dark.png', bytes: 1_715_623, sha256: 'bcb16ff5ea130ce4ed0facdc00bee8189e5571778d767a7cdd74e1777cc455c1', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, observedViewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-a-production-05bcd44-mobile-light.png', bytes: 1_699_955, sha256: '67ea689dde9ca13046bb05218e95360b2d360c824cb58cc59a08fb555f53bc30', status: 'CAPTURED_REJECTED', reason: 'The in-app Browser full-page capture ignored the requested 390x844 viewport, repeated the 1440x1000 opening viewport bytes, and omitted complete architecture-diagram coverage, so it cannot support trustworthy mobile or whole-page visual review.'},
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
function assertProductionBrowser(evidence) {
  assert.ok(evidence, `${PRODUCTION_RAW} exists and parses`);
  assert.deepEqual(Object.keys(evidence), ['implementationHead', 'pages', 'probes', 'collection', 'states', 'screenshotEvidence']);
  assert.equal(evidence.implementationHead, READY_HEAD);
  assert.deepEqual(evidence.pages, PRODUCTION_PAGES);
  assert.deepEqual(evidence.probes, {routes: PRODUCTION_ROUTES, svg: PRODUCTION_SVG});
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'https://sealday.github.io/tego-arch/styles/sty-10',
    build: `GitHub Pages exact Stage A READY head ${READY_HEAD}; push run ${PRODUCTION_PAGES.runId}; build job ${PRODUCTION_PAGES.buildJobId}; deploy job ${PRODUCTION_PAGES.deployJobId}`,
  });
  assertBrowser({
    candidateHead: IMPLEMENTATION_HEAD,
    collection: {browser: 'Codex in-app Browser only', fresh: true, servedUrl: 'http://127.0.0.1:3421/tego-arch/styles/sty-10'},
    states: evidence.states,
    screenshotEvidence: {
      status: 'BLOCKED / NOT_ACCEPTED',
      reason: 'Exactly three fresh in-app Browser full-page captures repeated viewport content and omitted complete architecture-diagram coverage; no visual PASS is claimed.',
      attempts: SCREENSHOT_ATTEMPTS,
    },
  });
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated viewport content and omitted complete architecture-diagram coverage; the third capture also ignored the requested mobile viewport; no visual PASS is claimed.',
    attempts: PRODUCTION_SCREENSHOT_ATTEMPTS,
  });
}
function assertFinalReview(source) {
  assert.equal(source.match(/^- Screenshot evidence: `BLOCKED \/ NOT_ACCEPTED`\.$/gmu)?.length, 1, 'one honest screenshot verdict');
  assert.equal(source.match(/^- No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed\.$/gmu)?.length, 1, 'one no-overclaim statement');
  assert.doesNotMatch(source, /Screenshot evidence: `PASS`|^Visual PASS is claimed\.$/mu);
  const checkpoint = section(source, 'Independent review checkpoint');
  assert.equal(checkpoint, [
    `- Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`,
    `- Exact Browser evidence head: \`${EVIDENCE_HEAD}\`.`,
    `- Exact independent review head: \`${REVIEW_HEAD}\`.`,
    '- Independent code/spec/security review: `READY / APPROVE`; findings: `0`.',
    '- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    '- Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
    '- Final Stage A review judgment: `READY`.',
    '- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and Stage B deployment have not run.',
    '- Deployment status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`.',
  ].join('\n'), 'exact final Stage A checkpoint');
}
function assertProductionReview(source) {
  assertFinalReview(source);
  const production = section(source, 'Stage A production deployment');
  assert.equal(production, [
    `- Exact published Stage A READY head: \`${READY_HEAD}\`.`,
    '- Preflight: tracked and untracked clean; `origin/main` exact merge-base and ancestor; behind/ahead `0/19`; publication used one non-force fast-forward push.',
    `- Exact Pages push run: \`${PRODUCTION_PAGES.runId}\`; \`headSha=${READY_HEAD}\`; workflow: \`completed / success\`.`,
    `- Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
    `- Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
    '- The workflow, build and deploy identities bind the exact reviewed READY head; no evidence-only run is substituted.',
    '',
    '| Production route | Status | Content type |',
    '| --- | ---: | --- |',
    ...PRODUCTION_ROUTES.map(({path, status, contentType}) => `| \`${path}\` | \`${status}\` | \`${contentType}\` |`),
    '',
    '- Required HTML routes: `9/9`; every route returned `200` with `text/html; charset=utf-8`.',
    `- Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
    `- Production raw Browser JSON: \`${PRODUCTION_RAW}\`; \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_HASH}\`.`,
    '- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `12/12`; relation href/H1/return checks `20/20`; source href/target/rel checks `20/20`.',
    '- SVG geometry: source `viewBox="0 0 2400 3900"` and `2400x3900`; Browser-natural `92x150`; rendered `800x1300`; STY-11 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.',
    '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED`; all repeated viewport content and omitted complete diagram coverage, and the third ignored the requested mobile viewport.',
    '- No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.',
    '- Stage A deployment status: `SUCCESS`; functional production status: `PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.',
    '- Scope remains `STAGE_A_ONLY`; backlog, Stage B and STY-11 are unchanged.',
  ].join('\n'), 'exact Stage A production section');
}

const [review, raw, productionRaw, immediateReview, backlog, status, documents] = await Promise.all([
  optional(REVIEW, 'utf8'),
  optional(LOCAL_RAW),
  optional(PRODUCTION_RAW),
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

test('binds exact heads, final Stage A verdicts, and local Browser evidence', () => {
  assert.ok(review, `${REVIEW} exists`);
  assert.match(review, /^# G009 Batch 11 Stage A Review$/mu);
  assert.match(review, /Projection: `62 completed topics \/ 106 content documents \/ 550 governed sources`/u);
  assert.match(review, /STY-10: `published \/ pending`/u);
  assert.match(review, /STY-11: `unpublished \/ pending \/ non-actionable`; actionable route count: `0`/u);
  assert.ok(review.includes(`Complete immediate STY-09 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\``));
  assert.ok(review.includes(`Complete immediate STY-09 backlog suffix SHA-256: \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\``));
  assertFinalReview(review);
  assert.ok(review.includes(`Raw Browser JSON: \`${LOCAL_RAW}\`; \`${RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${RAW_BROWSER_HASH}\``));
  assert.match(review, /Screenshot evidence: `BLOCKED \/ NOT_ACCEPTED`/u);
  assert.match(review, /Exactly three fresh IAB full-page captures repeated viewport content and omitted complete architecture-diagram coverage/u);
  assert.match(review, /No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed/u);
  assert.doesNotMatch(review, /^## Stage B/mu);
  assert.doesNotMatch(review, /Stage B (?:review judgment|deployment status): `(?!PENDING|NOT_RUN)/u);
  assert.ok(raw, `${LOCAL_RAW} exists`);
  assertBrowser(JSON.parse(raw));
});

test('rejects wrong review heads, weakened verdicts, findings, scope, deployment, and visual overclaim', () => {
  assertFinalReview(review);
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    [`Exact Browser evidence head: \`${EVIDENCE_HEAD}\`.`, `Exact Browser evidence head: \`${'1'.repeat(40)}\`.`],
    [`Exact independent review head: \`${REVIEW_HEAD}\`.`, `Exact independent review head: \`${'2'.repeat(40)}\`.`],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `NOT READY`; findings: `0`.'],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `READY / APPROVE`; findings: `1`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `FAIL`; findings: `0`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `BLOCKED`; blockers: `0`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `1`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `READY`.\n- Final Stage A review judgment: `PENDING`.'],
    ['Scope boundary: `STAGE_A_ONLY`;', 'Scope boundary: `STAGE_B`;'],
    ['Deployment status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`.', 'Deployment status: `STAGE_B_SUCCESS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertFinalReview(mutated), {name: 'AssertionError'});
  }
  for (const [before, after] of [
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `PASS`.'],
    ['No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed.', 'Visual PASS is claimed.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertFinalReview(mutated), {name: 'AssertionError'});
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

test('binds the exact READY-head production publication, probes and functional IAB evidence', () => {
  assert.ok(productionRaw, `${PRODUCTION_RAW} exists`);
  assert.equal(productionRaw.length, PRODUCTION_RAW_BYTES);
  assert.equal(sha256(productionRaw), PRODUCTION_RAW_HASH);
  assert.notEqual(sha256(Buffer.concat([productionRaw, Buffer.from('x')])), PRODUCTION_RAW_HASH);
  assert.notEqual(sha256(productionRaw.subarray(0, -1)), PRODUCTION_RAW_HASH);
  assertProductionBrowser(JSON.parse(productionRaw));
  assertProductionReview(review);
});

test('rejects production deployment, probe, semantic, additive, diagnostic, screenshot and review mutations', () => {
  assert.ok(productionRaw, `${PRODUCTION_RAW} exists`);
  const production = JSON.parse(productionRaw);
  assertProductionBrowser(production);
  const mutations = [
    (copy) => { copy.implementationHead = '0'.repeat(40); },
    (copy) => { copy.fabricated = true; },
    (copy) => { copy.pages.runId += 1; },
    (copy) => { copy.pages.event = 'workflow_dispatch'; },
    (copy) => { copy.pages.headSha = '1'.repeat(40); },
    (copy) => { copy.pages.buildConclusion = 'failure'; },
    (copy) => { copy.pages.deployJobId += 1; },
    (copy) => { copy.pages.fabricated = 'PASS'; },
    (copy) => { copy.probes.routes.reverse(); },
    (copy) => { copy.probes.routes[4].path = '/tego-arch/styles/sty-11'; },
    (copy) => { copy.probes.routes[4].status = 404; },
    (copy) => { copy.probes.routes[8].contentType = 'text/plain'; },
    (copy) => { copy.probes.routes.push({path: '/fabricated', status: 200, contentType: 'text/html; charset=utf-8'}); },
    (copy) => { copy.probes.svg.bytes += 1; },
    (copy) => { copy.probes.svg.sha256 = '2'.repeat(64); },
    (copy) => { copy.probes.svg.fabricated = true; },
    (copy) => { copy.collection.browser = 'Chrome'; },
    (copy) => { copy.collection.fabricated = 'PASS'; },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.fabricated = structuredClone(copy.states.desktopLight); },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopDark.interactions[1].after.scrollLeft += 1; },
    (copy) => { copy.states.mobileLight.relations[0].h1 = 'fabricated'; },
    (copy) => { copy.states.mobileDark.geometry.sources.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.viewBox = '0 0 2401 3900'; },
    (copy) => { copy.states.mobileDark.geometry.sty11 = 1; },
    (copy) => { copy.states.desktopDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileLight.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts.push(structuredClone(copy.screenshotEvidence.attempts[0])); },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '3'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].observedViewport.width = 390; },
    (copy) => { copy.screenshotEvidence.fabricatedVisualPass = true; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(production);
    mutate(copy);
    assert.notDeepEqual(copy, production, 'production mutation is non-no-op');
    assert.throws(() => assertProductionBrowser(copy), {name: 'AssertionError'});
  }

  assertProductionReview(review);
  for (const [before, after] of [
    [`Exact published Stage A READY head: \`${READY_HEAD}\`.`, `Exact published Stage A READY head: \`${'0'.repeat(40)}\`.`],
    [`Exact Pages push run: \`${PRODUCTION_PAGES.runId}\`;`, 'Exact Pages push run: `0`;'],
    [`Build job: \`${PRODUCTION_PAGES.buildJobId}\`;`, 'Build job: `0`;'],
    [`Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`;`, 'Deploy job: `0`;'],
    ['Required HTML routes: `9/9`;', 'Required HTML routes: `8/9`;'],
    [PRODUCTION_RAW_HASH, '4'.repeat(64)],
    ['Functional production QA: `PASS`;', 'Functional production QA: `PENDING`;'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`;', 'Screenshot evidence: `PASS`;'],
    ['No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.', 'Fabricated deployment and visual PASS are claimed.'],
    ['Stage A deployment status: `SUCCESS`;', 'Stage A deployment status: `PENDING`;'],
    ['Scope remains `STAGE_A_ONLY`;', 'Scope remains `STAGE_B`;'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} production-review mutation applies`);
    assert.throws(() => assertProductionReview(mutated), {name: 'AssertionError'});
  }
});
