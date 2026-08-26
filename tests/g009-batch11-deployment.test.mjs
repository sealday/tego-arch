import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const EXPECTED_STAGE_A = Object.freeze({completed: 62, documents: 106, sources: 550});
export const EXPECTED_STAGE_B = Object.freeze({completed: 63, documents: 106, sources: 550});
export const EXPECTED_CURRENT_PROJECTION = Object.freeze({completed: 64, documents: 107, sources: 560});
export const CURRENT_TOPIC = 'STY-10';
export const NEXT_TOPIC = 'STY-11';
export const LATEST_TOPIC = 'STY-12';
export const REVIEW = 'docs/reviews/g009-batch11.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch11-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch11-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch11-stage-b-production-browser.json';
const ARTICLE = 'content/styles/sty-10-microkernel-plugin-architecture.mdx';
const LEDGER = 'data/source-ledger.json';
const DRAWIO = 'diagrams/sty-10-microkernel-order-plugins.drawio';
const SVG = 'static/img/diagrams/sty-10-microkernel-order-plugins.svg';

const IMPLEMENTATION_HEAD = 'f2cdebb413c7cd96fcb630579c82f0f3b6199983';
const EVIDENCE_HEAD = 'c9a0deaea262fd802a5ad151f70818a314da1fe4';
const REVIEW_HEAD = 'c9a0deaea262fd802a5ad151f70818a314da1fe4';
const RAW_BROWSER_BYTES = 26_211;
const RAW_BROWSER_HASH = '3ae7ed0786d712e6e09cb1fbd4320473de44f6f6f7acd477b3f1ab35bd8b7e89';
const READY_HEAD = '05bcd441c21aad16418f1b432af49304cdb0808b';
const STAGE_B_REVIEWED_HEAD = '5150ccad86e7bd410ddfeb83f986ce2cf3b42df9';
const STAGE_B_READY_HEAD = 'fa3faafcd584fecdce593107ff64d764a85ee043';
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
const STAGE_B_PRODUCTION_RAW_BYTES = 79_574;
const STAGE_B_PRODUCTION_RAW_HASH = 'e595943e83c1411f5695ea397761b0be130d2da298382015328d45f7b8eb942d';
const STAGE_B_PRODUCTION_PAGES = Object.freeze({
  runId: 32_367_610_144,
  event: 'push',
  headSha: STAGE_B_READY_HEAD,
  status: 'completed',
  conclusion: 'success',
  buildJobId: 96_420_522_665,
  buildStatus: 'completed',
  buildConclusion: 'success',
  deployJobId: 96_421_392_775,
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
const STAGE_B_REPAIR_SESSION_ID = 'sty10-stage-b-repair-iab-20260821T062920628Z';
const STAGE_B_SCREENSHOT_REJECTION_REASON = 'Original-size inspection shows repeated opening viewport slices and omits complete architecture-diagram coverage.';
const STAGE_B_SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, fullPage: true, status: 'CAPTURED_REJECTED', reason: STAGE_B_SCREENSHOT_REJECTION_REASON, artifactPath: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-b-repair-desktopLight.png', bytes: 1_531_340, sha256: '6fff5ee287070ad1e25ca9215ed07d1f492fc4d6467183ac408828bb8dcdf332'},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, fullPage: true, status: 'CAPTURED_REJECTED', reason: STAGE_B_SCREENSHOT_REJECTION_REASON, artifactPath: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-b-repair-desktopDark.png', bytes: 1_547_151, sha256: '4d24cd3ae4bcb319aa087d2f6a216a41c1fa3aed614a7b947be30f429a5ba180'},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, fullPage: true, status: 'CAPTURED_REJECTED', reason: 'Original-size inspection shows repeated mobile opening viewport slices and omits complete architecture-diagram coverage.', artifactPath: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty10-stage-b-repair-mobileLight.png', bytes: 716_251, sha256: '7ca3d681422f16fcd55731e87dba1bb4cf5a3a2cca387e9793db0190ff8812a4'},
]);
const STAGE_B_PROJECTION = Object.freeze({
  completed: 63,
  documents: 106,
  sources: 550,
  current: {id: 'STY-10', published: true, status: 'complete'},
  next: {id: 'STY-11', published: false, status: 'pending', actionableCount: 0},
});
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch10.md';
const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW_HASH = '69ba4168aa672413d1ed1251365b04f0a85c84eb5aa23d49cc38534d9252337f';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'cd2fadcfbf44800645ca45b6e2b610f38b9af775bb22cef41225bc91dcfdbee5';
const IMMEDIATE_BACKLOG_MARKER = '此前 G009 Batch 10 历史完成基线为：';
const STABLE_IDENTITIES = new Map([
  [ARTICLE, [22_961, 'd106eb2c3b40b34aaa73e50b59ed41f644b5641f50c25790bbefa4a73d1e3e34']],
  [LEDGER, [1_616_387, '92a69680ec25d8c02326e26bb8217354908e8f1c465dc88decf98d97e7912691']],
  [DRAWIO, [40_844, '59678250b3e4046f9eb834f54b09002d2d13a070528ddc8f5303eaa5475dbdcd']],
  [SVG, [20_285, '69080badd0f6500f24b59f4045463c65e17669659da77616ee4520bd4d2c802c']],
  [LOCAL_RAW, [RAW_BROWSER_BYTES, RAW_BROWSER_HASH]],
  [PRODUCTION_RAW, [PRODUCTION_RAW_BYTES, PRODUCTION_RAW_HASH]],
]);
const STY10_CLOSURE_LINE = `- [x] **STY-10 P1｜Microkernel / Plug-in Architecture**：扩展点、兼容性和插件隔离。Stage A 关闭证据：2026-08-20 review，commit [\`${READY_HEAD}\`](https://github.com/sealday/tego-arch/commit/${READY_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`，production HTML routes \`9/9\`，live route \`/styles/sty-10\` 与 \`/img/diagrams/sty-10-microkernel-order-plugins.svg\` 均为 HTTP 200，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match，Stage A production Browser raw \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes / SHA-256 \`${PRODUCTION_RAW_HASH}\`，functional verdict PASS；screenshot evidence BLOCKED / NOT_ACCEPTED。`;
const CURRENT_BASELINE_PREFIX = `2026-08-20 G009 Batch 11 已完成 STY-10，Stage A 发布基线为 [\`${READY_HEAD}\`](https://github.com/sealday/tego-arch/commit/${READY_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，exact \`headSha=${READY_HEAD}\`、\`event=push\`、\`status=completed\`、\`conclusion=success\`，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`；2026-08-20 production HTTP probes \`9/9\`，live route \`/styles/sty-10\` 与 \`/img/diagrams/sty-10-microkernel-order-plugins.svg\` 均为 HTTP \`200\`，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match。Production Browser states \`4/4\`、wrapper interactions \`12/12\`、relation destination/H1/return \`20/20\`、exact source destinations \`20/20\`，每个状态 STY-11 actionable count \`0\` 且 diagnostics 完整为零；raw \`${PRODUCTION_RAW}\` 为 \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes / SHA-256 \`${PRODUCTION_RAW_HASH}\`，Stage A production functional verdict \`PASS\`，screenshot evidence \`BLOCKED / NOT_ACCEPTED\`。Stage B local closure projection 为 63 个已完成主题、106 篇内容文档与 550 个受治理来源，持久故事进度仍为 \`8 / 20\`，当前 G009，下一项为 STY-11，STY-10 为 published/complete，STY-11 为 unpublished/pending/nonactionable；Stage B 三个独立 review slots 与 final readiness 均为 \`PENDING\`，deployment status 为 \`PENDING / NOT_RUN\`。`;
const PENDING_STAGE_B_REVIEW_LINES = Object.freeze([
  '- Closure date: `2026-08-20`.',
  `- Exact Stage A implementation head: \`${READY_HEAD}\`.`,
  `- Exact Pages run: \`${PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
  `- Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
  `- Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
  '- Required production HTML routes: `9/9`; every route returned `200` with `text/html; charset=utf-8`.',
  `- Reviewed production SVG: HTTP \`200\`; MIME \`${PRODUCTION_SVG.contentType}\`; \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
  `- Stage A Browser raw: \`${LOCAL_RAW}\`; \`${RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${RAW_BROWSER_HASH}\`.`,
  `- Stage A production Browser raw: \`${PRODUCTION_RAW}\`; \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_HASH}\`.`,
  '- Functional production QA: `PASS`; states `4/4`; wrapper interactions `12/12`; relation checks `20/20`; exact source checks `20/20`; STY-11 actionable count `0`; diagnostics complete and empty.',
  '- Stage A production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three attempts were `CAPTURED_REJECTED`; no visual PASS is claimed.',
  '- Projection: `63 completed topics / 106 content documents / 550 governed sources`.',
  '- STY-10 target: `published / complete`.',
  '- STY-11 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.',
  `- Immediate immutable history: complete Batch 10 review SHA-256 \`${IMMEDIATE_REVIEW_HASH}\`; backlog suffix \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\`.`,
  '- Exact Stage B reviewed head: `PENDING`.',
  '- Independent Stage B code/spec/security review: `PENDING`; findings: `PENDING`.',
  '- Independent Stage B content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.',
  '- Independent Stage B architecture/invariant review: `PENDING`; blockers: `PENDING`.',
  '- Final Stage B review judgment: `PENDING`.',
  '- Stage B scope boundary: `STAGE_B`.',
  '- Stage B deployment status: `PENDING / NOT_RUN`.',
  '- Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.',
]);
const FINAL_STAGE_B_REVIEW_LINES = Object.freeze([
  ...PENDING_STAGE_B_REVIEW_LINES.slice(0, 15),
  `- Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\`.`,
  '- Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.',
  '- Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
  '- Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
  '- Final Stage B readiness: `READY`.',
  '- Stage B scope boundary: `STAGE_B`.',
  '- Deployment status: `PENDING / NOT_RUN`.',
  '- Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.',
]);
const rootUrl = new URL('../', import.meta.url);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
function assertExactKeys(value, expected, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} is an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} exact keys`);
}
function stageBFunctionalPayload(state) {
  return {
    theme: state.theme,
    viewport: state.viewport,
    geometry: state.geometry,
    interactions: state.interactions,
    relations: state.relations,
    logs: state.logs,
    diagnostics: state.diagnostics,
  };
}
function assertStageBOperationLog(evidence) {
  const log = evidence.operationLog;
  assertExactKeys(log, ['schemaVersion', 'sessionId', 'browser', 'appendOnly', 'targetUrl', 'startedAt', 'completedAt', 'cursorStart', 'cursorEnd', 'entries'], 'Stage B operation log');
  assert.equal(log.schemaVersion, 1);
  assert.equal(log.sessionId, STAGE_B_REPAIR_SESSION_ID);
  assert.equal(log.browser, 'Codex in-app Browser only');
  assert.equal(log.appendOnly, true);
  assert.equal(log.targetUrl, 'https://sealday.github.io/tego-arch/styles/sty-10');
  assert.equal(log.startedAt, '2026-08-21T06:29:20.628Z');
  assert.equal(log.completedAt, '2026-08-21T06:32:08.472Z');
  assert.equal(log.entries.length, 27, 'six operations per state plus exactly three screenshots');
  assert.equal(log.cursorStart, log.entries[0].cursorStart);
  assert.equal(log.cursorEnd, log.entries.at(-1).cursorEnd);
  assert.ok(Date.parse(log.startedAt) <= Date.parse(log.entries[0].startedAt), 'session starts before its first operation');
  assert.ok(Date.parse(log.completedAt) >= Date.parse(log.entries.at(-1).completedAt), 'session completes after screenshot inspection');

  const operationIds = new Set();
  let previousCompletedAt = -Infinity;
  let previousCursorEnd = -Infinity;
  for (const [index, entry] of log.entries.entries()) {
    assertExactKeys(entry, ['sequence', 'operationId', 'state', 'kind', 'startedAt', 'completedAt', 'cursorStart', 'cursorEnd', 'request', 'observation'], `operation ${index + 1}`);
    assert.equal(entry.sequence, index + 1, `operation ${index + 1} append-only sequence`);
    assert.match(entry.operationId, /^sty10-stage-b-repair-op-[0-9]{3}$/u);
    assert.equal(operationIds.has(entry.operationId), false, `unique operation ID ${entry.operationId}`);
    operationIds.add(entry.operationId);
    const startedAt = Date.parse(entry.startedAt);
    const completedAt = Date.parse(entry.completedAt);
    assert.ok(Number.isFinite(startedAt) && Number.isFinite(completedAt), `${entry.operationId} timestamps parse`);
    assert.ok(startedAt >= previousCompletedAt, `${entry.operationId} start timestamp is monotonic`);
    assert.ok(completedAt >= startedAt, `${entry.operationId} completion does not precede start`);
    assert.ok(entry.cursorStart >= previousCursorEnd, `${entry.operationId} cursor start is monotonic`);
    assert.ok(entry.cursorEnd > entry.cursorStart, `${entry.operationId} cursor interval advances`);
    previousCompletedAt = completedAt;
    previousCursorEnd = entry.cursorEnd;
  }

  const stateKinds = ['configure-state', 'observe-geometry', 'exercise-wrappers', 'exercise-relations', 'read-diagnostics', 'seal-state'];
  for (const key of STATES) {
    const state = evidence.states[key];
    assert.ok(state, `${key} state exists`);
    assertExactKeys(state.observationRefs, ['configure', 'geometry', 'interactions', 'relations', 'diagnostics', 'sealed'], `${key} observation references`);
    const entries = Object.values(state.observationRefs).map((operationId) => {
      const entry = log.entries.find((candidate) => candidate.operationId === operationId);
      assert.ok(entry, `${key} references existing operation ${operationId}`);
      assert.equal(entry.state, key, `${operationId} state binding`);
      return entry;
    });
    assert.deepEqual(entries.map(({kind}) => kind), stateKinds, `${key} exact operation sequence`);
    assert.deepEqual(entries[0].request, {targetUrl: log.targetUrl, viewport: state.viewport, theme: state.theme});
    assert.deepEqual(entries[0].observation, {url: log.targetUrl, viewport: state.viewport, theme: state.theme});
    assert.deepEqual(entries[1].request, {labels: WRAPPERS, sourceCount: SOURCE_LINKS.length, svgIdentity: 'sty-10-microkernel-order-plugins'});
    assert.deepEqual(entries[1].observation, {geometry: state.geometry}, `${key} geometry comes from its observation`);
    assert.deepEqual(entries[2].request, {labels: WRAPPERS, key: 'ArrowRight'});
    assert.deepEqual(entries[2].observation, {interactions: state.interactions}, `${key} interactions come from their observation`);
    assert.deepEqual(entries[3].request, {relations: RELATIONS.map(([href, expectedH1]) => ({href, expectedH1}))});
    assert.deepEqual(entries[3].observation, {relations: state.relations}, `${key} relations come from their observation`);
    assert.deepEqual(entries[4].request, {levels: ['warn', 'error'], methods: ['Runtime.exceptionThrown', 'Log.entryAdded'], limit: 100});
    assert.deepEqual(entries[4].observation, {logs: state.logs, diagnostics: state.diagnostics}, `${key} diagnostics come from their observation`);
    const payload = stageBFunctionalPayload(state);
    const payloadBytes = Buffer.from(JSON.stringify(payload));
    assert.deepEqual(entries[5].request, {
      observationRefs: {
        configure: entries[0].operationId,
        geometry: entries[1].operationId,
        interactions: entries[2].operationId,
        relations: entries[3].operationId,
        diagnostics: entries[4].operationId,
      },
    });
    assert.deepEqual(entries[5].observation, {functionalBytes: payloadBytes.length, functionalSha256: sha256(payloadBytes)});
  }

  const screenshotEntries = log.entries.filter(({kind}) => kind === 'capture-screenshot');
  assert.equal(screenshotEntries.length, 3);
  for (const [index, entry] of screenshotEntries.entries()) {
    const attempt = evidence.screenshotEvidence.attempts[index];
    assert.equal(entry.state, attempt.state);
    assert.deepEqual(entry.request, {
      state: attempt.state,
      requestedViewport: attempt.viewport,
      kind: 'fullPage',
      method: 'Codex in-app Browser screenshot',
    });
    assert.deepEqual(entry.observation, {attempt});
  }

  const stageAStates = JSON.parse(productionRaw.toString('utf8')).states;
  for (const key of STATES) {
    assert.notDeepEqual(evidence.states[key], stageAStates[key], `${key} is not a reused Stage A state payload`);
  }
}
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
function assertImmediateHistory(reviewBytes = immediateReview, backlogSource = backlog) {
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_HASH, 'complete immediate Batch 10 review bytes');
  const baseline = currentReleaseBaseline(backlogSource);
  assert.ok(baseline.startsWith(CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER), 'exact current Batch 11 prefix');
  const suffix = baseline.slice((CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER).length);
  assert.match(suffix, /^2026-08-17 G009 Batch 10 已完成 STY-09/u);
  assert.equal(sha256(suffix), IMMEDIATE_BACKLOG_SUFFIX_HASH, 'complete immediate STY-09 backlog suffix');
}
function assertStageBBacklog(source = backlog) {
  const sty10 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-10 /u.test(line));
  const sty11 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-11 /u.test(line));
  assert.deepEqual(sty10, [STY10_CLOSURE_LINE]);
  assert.equal(sty11.length, 1, 'one canonical STY-11 backlog line');
  assert.match(sty11[0], /^- \[x\] \*\*STY-11 /u);
  assert.doesNotMatch(source, /\]\(\/styles\/sty-11\)/u);
  assertImmediateHistory(immediateReview, source);
}
function assertFinalStageBReview(source = review) {
  assert.equal(section(source, 'Stage B closure candidate'), FINAL_STAGE_B_REVIEW_LINES.join('\n'), 'exact reviewed Stage B section');
  assert.equal(source.split('## Stage B closure candidate').length - 1, 1, 'one Stage B closure section');
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
function assertStageBProductionBrowser(evidence) {
  assert.ok(evidence, `${STAGE_B_PRODUCTION_RAW} exists and parses`);
  assert.deepEqual(Object.keys(evidence), ['implementationHead', 'pages', 'probes', 'projection', 'collection', 'operationLog', 'states', 'screenshotEvidence']);
  assert.equal(evidence.implementationHead, STAGE_B_READY_HEAD);
  assert.deepEqual(evidence.pages, STAGE_B_PRODUCTION_PAGES);
  assert.deepEqual(evidence.probes, {routes: PRODUCTION_ROUTES, svg: PRODUCTION_SVG});
  assert.deepEqual(evidence.projection, STAGE_B_PROJECTION);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'https://sealday.github.io/tego-arch/styles/sty-10',
    build: `GitHub Pages exact Stage B READY head ${STAGE_B_READY_HEAD}; push run ${STAGE_B_PRODUCTION_PAGES.runId}; build job ${STAGE_B_PRODUCTION_PAGES.buildJobId}; deploy job ${STAGE_B_PRODUCTION_PAGES.deployJobId}`,
  });
  assertStageBOperationLog(evidence);
  assert.notDeepEqual(evidence.states, JSON.parse(productionRaw.toString('utf8')).states, 'Stage B states carry independent operation-bound observations');
  for (const [key, state] of Object.entries(evidence.states)) {
    assertExactKeys(state, ['theme', 'viewport', 'geometry', 'interactions', 'relations', 'logs', 'diagnostics', 'observationRefs'], `${key} state`);
    assertExactKeys(state.viewport, ['width', 'height'], `${key} viewport`);
    assertExactKeys(state.geometry, ['page', 'sources', 'sty11', 'svg', 'wrappers'], `${key} geometry`);
    assertExactKeys(state.geometry.page, ['clientWidth', 'scrollWidth'], `${key} page geometry`);
    assertExactKeys(state.geometry.svg, ['loaded', 'viewBox', 'sourceWidth', 'sourceHeight', 'naturalHeight', 'naturalWidth', 'renderedHeight', 'renderedWidth', 'src'], `${key} SVG geometry`);
    for (const wrapper of state.geometry.wrappers) assertExactKeys(wrapper, ['clientWidth', 'label', 'scrollWidth'], `${key} wrapper`);
    for (const source of state.geometry.sources) assertExactKeys(source, ['href', 'rel', 'target'], `${key} source`);
    for (const interaction of state.interactions) {
      assertExactKeys(interaction, ['index', 'label', 'key', 'expectedScrollDelta', 'before', 'after'], `${key} interaction`);
      assertExactKeys(interaction.before, ['focus', 'focusVisible', 'outline', 'scrollLeft'], `${key} interaction before`);
      assertExactKeys(interaction.after, ['focus', 'focusVisible', 'outline', 'scrollLeft'], `${key} interaction after`);
    }
    for (const relation of state.relations) assertExactKeys(relation, ['href', 'expectedH1', 'h1', 'returnedToArticle', 'navigation'], `${key} relation`);
    assertExactKeys(state.diagnostics, ['events', 'hasMore', 'truncated'], `${key} diagnostics`);
  }
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
    status: 'BLOCKED',
    acceptance: 'NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures were inspected at original size; all repeat the opening viewport and omit trustworthy complete architecture-diagram coverage.',
    attempts: STAGE_B_SCREENSHOT_ATTEMPTS,
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
function assertStageBProductionReview(source) {
  assertProductionReview(source);
  assertFinalStageBReview(source);
  const production = section(source, 'Stage B production deployment');
  assert.equal(production, [
    `- Exact published Stage B READY head: \`${STAGE_B_READY_HEAD}\`.`,
    '- Preflight: tracked and untracked clean; `origin/main` exact merge-base and ancestor; behind/ahead `0/2`; publication used one non-force fast-forward push.',
    `- Exact Pages push run: \`${STAGE_B_PRODUCTION_PAGES.runId}\`; \`headSha=${STAGE_B_READY_HEAD}\`; workflow: \`completed / success\`.`,
    `- Build job: \`${STAGE_B_PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
    `- Deploy job: \`${STAGE_B_PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
    '- The workflow, build and deploy identities bind the exact Stage B READY head; no evidence-only run is substituted.',
    '',
    '| Production route | Status | Content type |',
    '| --- | ---: | --- |',
    ...PRODUCTION_ROUTES.map(({path, status, contentType}) => `| \`${path}\` | \`${status}\` | \`${contentType}\` |`),
    '',
    '- Required HTML routes: `9/9`; every route returned `200` with `text/html; charset=utf-8`.',
    `- Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
    `- Stage B production raw Browser JSON: \`${STAGE_B_PRODUCTION_RAW}\`; \`${STAGE_B_PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${STAGE_B_PRODUCTION_RAW_HASH}\`.`,
    `- Fresh IAB append-only operation ledger: session \`${STAGE_B_REPAIR_SESSION_ID}\`; operations \`27/27\`; state operations \`24/24\`; screenshot operations \`3/3\`; monotonic cursor range \`0..53\`; every state field is observation-linked and sealed by functional payload bytes/SHA-256.`,
    '- Exact final-gate repository CLIs: `scripts/validate_drawio_svg.mjs` `PASS`; `scripts/check-content-density.mjs` `PASS` with `0` density warnings.',
    '- Projection: `63 completed topics / 106 content documents / 550 governed sources`; STY-10 is `published / complete`; STY-11 is `unpublished / pending / non-actionable` with actionable count `0`.',
    '- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `12/12`; relation href/H1/return checks `20/20`; source href/target/rel checks `20/20`.',
    '- SVG geometry: source `viewBox="0 0 2400 3900"` and `2400x3900`; Browser-natural `92x150`; rendered `800x1300`; STY-11 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.',
    '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh full-page attempts are `CAPTURED_REJECTED`; original bytes were inspected and all repeated opening viewport slices while omitting complete architecture-diagram coverage, so no visual PASS is claimed.',
    '- No Chrome fallback, external Playwright, prior raw, historical screenshot, substituted browser surface or fabricated success is claimed.',
    '- Stage B deployment status: `SUCCESS`; functional production status: `PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.',
    '- Scope is closed at `STAGE_B`; STY-11 remains untouched and non-actionable.',
  ].join('\n'), 'exact Stage B production section');
}

const [review, raw, productionRaw, stageBProductionRaw, immediateReview, backlog, status, manifest, indexes, publicLedger, documents] = await Promise.all([
  optional(REVIEW, 'utf8'),
  optional(LOCAL_RAW),
  optional(PRODUCTION_RAW),
  optional(STAGE_B_PRODUCTION_RAW),
  required(IMMEDIATE_REVIEW),
  required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-indexes.json', 'utf8').then(JSON.parse),
  required('src/generated/source-ledger.json', 'utf8').then(JSON.parse),
  readContentDocuments('content'),
]);

test('locks the complete immediate STY-09 review and backlog suffix with mutation sensitivity', () => {
  assertImmediateHistory();
  for (const changedReview of [Buffer.concat([immediateReview, Buffer.from('x')]), immediateReview.subarray(0, -1)]) {
    assert.throws(() => assertImmediateHistory(changedReview), assert.AssertionError);
  }
  const baseline = currentReleaseBaseline(backlog);
  const suffix = baseline.slice((CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER).length);
  for (const changedSuffix of [`${suffix}x`, suffix.slice(0, -1)]) {
    const changedBacklog = backlog.replace(suffix, changedSuffix);
    assert.notEqual(changedBacklog, backlog, 'historical suffix mutation applies');
    assert.throws(() => assertImmediateHistory(immediateReview, changedBacklog), assert.AssertionError);
  }
});

test('preserves exact STY-10 Stage B history while current STY-11 is complete and STY-12 remains non-actionable', () => {
  assert.deepEqual({
    completed: status.completed_topics,
    documents: status.content_documents,
    sources: status.governed_sources,
  }, EXPECTED_CURRENT_PROJECTION);
  assert.equal(publicLedger.sources.length, EXPECTED_CURRENT_PROJECTION.sources);
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get(CURRENT_TOPIC)?.published, topics.get(CURRENT_TOPIC)?.status.value, styles.get(CURRENT_TOPIC)?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get(NEXT_TOPIC)?.published, topics.get(NEXT_TOPIC)?.status.value, styles.get(NEXT_TOPIC)?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get(LATEST_TOPIC)?.published, topics.get(LATEST_TOPIC)?.status.value, styles.get(LATEST_TOPIC)?.published], [false, 'pending', false]);
  const current = documents.find(({metadata}) => metadata.topic_id === CURRENT_TOPIC);
  assert.ok(current, 'STY-10 is published as a content document');
  assertStageBBacklog();
  assert.ok(documents.some(({metadata}) => metadata.topic_id === NEXT_TOPIC), 'STY-11 is published');
  assert.equal(documents.some(({metadata}) => metadata.topic_id === LATEST_TOPIC), false, 'STY-12 is unpublished');
  assert.match(backlog, /^- \[ \] \*\*STY-12 P1\uff5cMicro-Frontend\*\*/mu);
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-12'), false, 'STY-12 is non-actionable');
  const staleNext = backlog.replace('下一项为 STY-11', '下一项为 STY-10');
  assert.notEqual(staleNext, backlog, 'current next-topic mutation applies');
  assert.throws(() => assertStageBBacklog(staleNext), assert.AssertionError);
});

test('locks exact STY-10 article, ledger, Draw.io/SVG and Stage A raw byte identities', async () => {
  for (const [path, [expectedBytes, expectedHash]] of STABLE_IDENTITIES) {
    const bytes = [LOCAL_RAW, PRODUCTION_RAW].includes(path)
      ? await required(path)
      : execFileSync('git', ['show', `${IMPLEMENTATION_HEAD}:${path}`], {cwd: new URL('../', import.meta.url), maxBuffer: 4 * 1024 * 1024});
    assert.equal(bytes.length, expectedBytes, `${path} exact bytes`);
    assert.equal(sha256(bytes), expectedHash, `${path} exact SHA-256`);
    for (const changed of [Buffer.concat([bytes, Buffer.from('x')]), bytes.subarray(0, -1)]) {
      assert.notEqual(sha256(changed), expectedHash, `${path} identity mutation is non-no-op`);
    }
  }
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
  assertFinalStageBReview(review);
  assert.ok(raw, `${LOCAL_RAW} exists`);
  assertBrowser(JSON.parse(raw));
});

test('rejects wrong Stage B head, weakened verdicts, stale pending, scope drift, deployment fabrication and visual overclaim', () => {
  assertFinalStageBReview(review);
  for (const [before, after] of [
    [`Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\`.`, `Exact Stage B reviewed head: \`${'0'.repeat(40)}\`.`],
    ['Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent Stage B code/spec/security review: `NOT READY`; findings: `0`.'],
    ['Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `1`.'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent Stage B content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`.'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `FAIL`; findings: `0`.'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `1`.'],
    ['Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent Stage B architecture/invariant review: `BLOCKED`; blockers: `0`.'],
    ['Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `1`.'],
    ['Final Stage B readiness: `READY`.', 'Final Stage B readiness: `PENDING`.'],
    ['Stage B scope boundary: `STAGE_B`.', 'Stage B scope boundary: `STAGE_A_ONLY`.'],
    ['Deployment status: `PENDING / NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['Deployment status: `PENDING / NOT_RUN`.', 'Deployment status: `READY / NOT_RUN`.'],
    ['Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.', 'Stage B screenshot status: `PASS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} Stage B mutation applies`);
    assert.throws(() => assertFinalStageBReview(mutated), {name: 'AssertionError'});
  }
  const stalePending = review.replace(FINAL_STAGE_B_REVIEW_LINES.join('\n'), PENDING_STAGE_B_REVIEW_LINES.join('\n'));
  assert.notEqual(stalePending, review, 'stale pending Stage B section mutation applies');
  assert.throws(() => assertFinalStageBReview(stalePending), {name: 'AssertionError'});
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

test('binds the exact Stage B READY-head publication, projection and fresh production IAB evidence', () => {
  assert.ok(stageBProductionRaw, `${STAGE_B_PRODUCTION_RAW} exists`);
  assert.equal(stageBProductionRaw.length, STAGE_B_PRODUCTION_RAW_BYTES);
  assert.equal(sha256(stageBProductionRaw), STAGE_B_PRODUCTION_RAW_HASH);
  assert.notEqual(sha256(Buffer.concat([stageBProductionRaw, Buffer.from('x')])), STAGE_B_PRODUCTION_RAW_HASH);
  assert.notEqual(sha256(stageBProductionRaw.subarray(0, -1)), STAGE_B_PRODUCTION_RAW_HASH);
  assertStageBProductionBrowser(JSON.parse(stageBProductionRaw));
  assertStageBProductionReview(review);
});

test('rejects every Stage B production semantic, additive, fabricated-success and screenshot-attempt mutation', () => {
  assert.ok(stageBProductionRaw, `${STAGE_B_PRODUCTION_RAW} exists`);
  const production = JSON.parse(stageBProductionRaw);
  assertStageBProductionBrowser(production);
  const mutations = [
    (copy) => { copy.implementationHead = '0'.repeat(40); },
    (copy) => { copy.fabricated = true; },
    (copy) => { copy.pages.runId += 1; },
    (copy) => { copy.pages.event = 'workflow_dispatch'; },
    (copy) => { copy.pages.headSha = '1'.repeat(40); },
    (copy) => { copy.pages.status = 'in_progress'; },
    (copy) => { copy.pages.conclusion = 'failure'; },
    (copy) => { copy.pages.buildJobId += 1; },
    (copy) => { copy.pages.buildStatus = 'queued'; },
    (copy) => { copy.pages.buildConclusion = 'failure'; },
    (copy) => { copy.pages.deployJobId += 1; },
    (copy) => { copy.pages.deployStatus = 'queued'; },
    (copy) => { copy.pages.deployConclusion = 'failure'; },
    (copy) => { copy.pages.fabricatedSuccess = true; },
    (copy) => { copy.probes.routes.reverse(); },
    (copy) => { copy.probes.routes[4].path = '/tego-arch/styles/sty-11'; },
    (copy) => { copy.probes.routes[4].status = 404; },
    (copy) => { copy.probes.routes[8].contentType = 'text/plain'; },
    (copy) => { copy.probes.routes.push({path: '/fabricated', status: 200, contentType: 'text/html; charset=utf-8'}); },
    (copy) => { copy.probes.svg.bytes += 1; },
    (copy) => { copy.probes.svg.sha256 = '2'.repeat(64); },
    (copy) => { copy.probes.svg.status = 404; },
    (copy) => { copy.probes.svg.fabricated = true; },
    (copy) => { copy.projection.completed -= 1; },
    (copy) => { copy.projection.documents += 1; },
    (copy) => { copy.projection.sources += 1; },
    (copy) => { copy.projection.current.published = false; },
    (copy) => { copy.projection.current.status = 'pending'; },
    (copy) => { copy.projection.next.published = true; },
    (copy) => { copy.projection.next.status = 'complete'; },
    (copy) => { copy.projection.next.actionableCount = 1; },
    (copy) => { copy.projection.fabricated = true; },
    (copy) => { copy.collection.browser = 'Chrome'; },
    (copy) => { copy.collection.fresh = false; },
    (copy) => { copy.collection.build = 'fabricated success'; },
    (copy) => { copy.collection.fabricated = true; },
    (copy) => { copy.operationLog.schemaVersion += 1; },
    (copy) => { copy.operationLog.sessionId = 'stage-a-reuse'; },
    (copy) => { copy.operationLog.browser = 'Chrome'; },
    (copy) => { copy.operationLog.appendOnly = false; },
    (copy) => { copy.operationLog.targetUrl = 'http://127.0.0.1/reused'; },
    (copy) => { copy.operationLog.startedAt = '2026-08-20T00:00:00.000Z'; },
    (copy) => { copy.operationLog.cursorStart -= 1; },
    (copy) => { copy.operationLog.entries.pop(); },
    (copy) => { copy.operationLog.entries.reverse(); },
    (copy) => { copy.operationLog.entries.push(structuredClone(copy.operationLog.entries.at(-1))); },
    (copy) => { copy.operationLog.entries[1].operationId = copy.operationLog.entries[0].operationId; },
    (copy) => { copy.operationLog.entries[1].sequence += 1; },
    (copy) => { copy.operationLog.entries[1].state = 'desktopDark'; },
    (copy) => { copy.operationLog.entries[1].kind = 'fabricated-observation'; },
    (copy) => { copy.operationLog.entries[1].startedAt = copy.operationLog.entries[0].startedAt; },
    (copy) => { copy.operationLog.entries[1].completedAt = new Date(Date.parse(copy.operationLog.entries[1].startedAt) - 1).toISOString(); },
    (copy) => { copy.operationLog.entries[1].cursorStart = copy.operationLog.entries[0].cursorEnd - 1; },
    (copy) => { copy.operationLog.entries[1].cursorEnd = copy.operationLog.entries[1].cursorStart; },
    (copy) => { copy.operationLog.entries[0].request.viewport.width += 1; },
    (copy) => { copy.operationLog.entries[0].observation.viewport.width += 1; },
    (copy) => { copy.operationLog.entries[1].observation.geometry.page.scrollWidth += 1; },
    (copy) => { copy.operationLog.entries[2].observation.interactions[0].after.scrollLeft += 1; },
    (copy) => { copy.operationLog.entries[3].observation.relations[0].h1 = 'fabricated'; },
    (copy) => { copy.operationLog.entries[4].observation.logs.push({level: 'error'}); },
    (copy) => { copy.operationLog.entries[5].request.observationRefs.geometry = copy.operationLog.entries[5].request.observationRefs.interactions; },
    (copy) => { copy.operationLog.entries[5].observation.functionalSha256 = '5'.repeat(64); },
    (copy) => { copy.states.desktopLight.observationRefs.configure = copy.states.desktopDark.observationRefs.configure; },
    (copy) => { copy.states.desktopLight = structuredClone(JSON.parse(productionRaw.toString('utf8')).states.desktopLight); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.fabricated = structuredClone(copy.states.desktopLight); },
    (copy) => { copy.states.desktopLight.fabricated = true; },
    (copy) => { copy.states.desktopLight.viewport.fabricated = true; },
    (copy) => { copy.states.desktopLight.geometry.fabricated = true; },
    (copy) => { copy.states.desktopLight.geometry.page.fabricated = true; },
    (copy) => { copy.states.desktopLight.geometry.wrappers[0].fabricated = true; },
    (copy) => { copy.states.desktopLight.geometry.svg.fabricated = true; },
    (copy) => { copy.states.desktopLight.interactions[0].fabricated = true; },
    (copy) => { copy.states.desktopLight.interactions[0].before.fabricated = true; },
    (copy) => { copy.states.desktopLight.interactions[0].after.fabricated = true; },
    (copy) => { copy.states.desktopLight.relations[0].fabricated = true; },
    (copy) => { copy.states.desktopLight.geometry.sources[0].fabricated = true; },
    (copy) => { copy.states.desktopLight.diagnostics.fabricated = true; },
    (copy) => { copy.states.desktopLight.observationRefs.fabricated = 'sty10-stage-b-repair-op-999'; },
    (copy) => { copy.states.desktopLight.observationRefs.geometry = copy.states.desktopLight.observationRefs.interactions; },
    (copy) => { copy.states.desktopLight.observationRefs.sealed = copy.states.desktopLight.observationRefs.diagnostics; },
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
    (copy) => { copy.screenshotEvidence.reason = 'fabricated visual success'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts.push(structuredClone(copy.screenshotEvidence.attempts[0])); },
    (copy) => { copy.screenshotEvidence.attempts[0].status = 'CAPTURED_ACCEPTED'; },
    (copy) => { copy.screenshotEvidence.attempts[0].viewport.width += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].viewport.width += 1; },
    (copy) => { copy.screenshotEvidence.attempts[2].method = 'external Playwright'; },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes = 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '3'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].path = '/fabricated.png'; },
    (copy) => { copy.screenshotEvidence.fabricatedVisualPass = true; },
  ];
  assert.equal(mutations.length, 104, 'complete explicit Stage B production mutation inventory');
  for (const [index, mutate] of mutations.entries()) {
    const copy = structuredClone(production);
    mutate(copy);
    assert.notDeepEqual(copy, production, `Stage B production mutation ${index + 1} is non-no-op`);
    assert.throws(() => assertStageBProductionBrowser(copy), {name: 'AssertionError'}, `Stage B production mutation ${index + 1} is rejected`);
  }
});

test('rejects Stage B production review fabrication, visual PASS, and duplicate or displaced readiness lines', () => {
  assertStageBProductionReview(review);
  for (const [before, after] of [
    [`Exact published Stage B READY head: \`${STAGE_B_READY_HEAD}\`.`, `Exact published Stage B READY head: \`${'0'.repeat(40)}\`.`],
    [`Exact Pages push run: \`${STAGE_B_PRODUCTION_PAGES.runId}\`;`, 'Exact Pages push run: `0`;'],
    [`Build job: \`${STAGE_B_PRODUCTION_PAGES.buildJobId}\`;`, 'Build job: `0`;'],
    [`Deploy job: \`${STAGE_B_PRODUCTION_PAGES.deployJobId}\`;`, 'Deploy job: `0`;'],
    ['Required HTML routes: `9/9`;', 'Required HTML routes: `8/9`;'],
    [STAGE_B_PRODUCTION_RAW_HASH, '4'.repeat(64)],
    [`session \`${STAGE_B_REPAIR_SESSION_ID}\`;`, 'session `stage-a-reuse`;'],
    ['operations `27/27`;', 'operations `26/27`;'],
    ['`scripts/validate_drawio_svg.mjs` `PASS`;', '`scripts/validate_drawio_svg.mjs` `FAIL`;'],
    ['`scripts/check-content-density.mjs` `PASS`', '`scripts/check-content-density.mjs` `FAIL`'],
    ['Projection: `63 completed topics / 106 content documents / 550 governed sources`;', 'Projection: `62 completed topics / 106 content documents / 550 governed sources`;'],
    ['Functional production QA: `PASS`;', 'Functional production QA: `PENDING`;'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`;', 'Screenshot evidence: `PASS`;'],
    ['original bytes were inspected and all repeated opening viewport slices while omitting complete architecture-diagram coverage, so no visual PASS is claimed.', 'all screenshots prove a fabricated visual PASS.'],
    ['No Chrome fallback, external Playwright, prior raw, historical screenshot, substituted browser surface or fabricated success is claimed.', 'Fabricated success is claimed.'],
    ['Stage B deployment status: `SUCCESS`;', 'Stage B deployment status: `PENDING`;'],
    ['Scope is closed at `STAGE_B`;', 'Scope is closed at `STAGE_A_ONLY`;'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} Stage B production-review mutation applies`);
    assert.throws(() => assertStageBProductionReview(mutated), {name: 'AssertionError'});
  }
  const readiness = '- Final Stage B readiness: `READY`.';
  const duplicatedReadiness = review.replace(readiness, `${readiness}\n${readiness}`);
  assert.notEqual(duplicatedReadiness, review, 'duplicate readiness mutation applies');
  assert.throws(() => assertStageBProductionReview(duplicatedReadiness), {name: 'AssertionError'});
  const displacedReadiness = `${review.replace(`${readiness}\n`, '')}\n${readiness}\n`;
  assert.notEqual(displacedReadiness, review, 'displaced readiness mutation applies');
  assert.throws(() => assertStageBProductionReview(displacedReadiness), {name: 'AssertionError'});
});
