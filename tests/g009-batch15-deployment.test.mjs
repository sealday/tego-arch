import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const REVIEW = 'docs/reviews/g009-batch15.md';
export const LOCAL_BROWSER = 'docs/reviews/evidence/g009-batch15-stage-a-browser.json';
const LOCAL_BROWSER_BYTES = 31736;
const LOCAL_BROWSER_SHA256 = '7090136f07c2042a52c783c83ae70c757492c834a203d22a2271e1cb9df70eab';
const BASE_URL = 'http://localhost:3100/tego-arch';
const TITLE = '架构风格选择矩阵：边界、交互与演进触发器';
const BUILD_INPUTS = ['content', 'data', 'src', 'static', 'scripts', 'plugins', 'docusaurus.config.ts', 'package.json', 'package-lock.json'];
const INPUT_SHA256 = '23a9c36837a7e2fa29d1efeaf7cd2c2b3797e4f7269d838a66fda2a106092245';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const LOCAL_REVIEW_LINES = [
  `- Raw Browser artifact: \`${LOCAL_BROWSER}\`; bytes \`${LOCAL_BROWSER_BYTES}\`; SHA-256 \`${LOCAL_BROWSER_SHA256}\`.`,
  `- Browser build input identity: \`285 files / ${INPUT_SHA256}\`; base head \`463f1dec2ae0b35eedcf6fef2933f11ad60d74f8\`; working-tree candidate, not a deployed head.`,
  '- Functional observations: `4/4 states`; `12/12 wrapper checks`; `12/12 relation href/H1/return checks`; `24/24 source anchors`; STY-15 actionable total `0`; console warnings/errors and complete CDP diagnostics empty.',
  '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`; viewport images were inspected in tool output, but no durable full-article screenshot artifact was retained.',
  '- Collection boundary: Codex in-app Browser / CUA only; actual Tab/Right keyboard input with DOM focus; exact-href relation navigation plus Browser back, not physical clicks; source destinations are resolved anchors, not remote-page probes. Preliminary tab/log-scope observations remain disclosed in raw collection notes.',
];
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
  const sections = h2Sections(source); assert.deepEqual(sections.map(([heading]) => heading), ['Stage A candidate', 'Local Browser evidence'], 'exact initial review section schema');
  assert.equal(sections[0][1], PENDING_STAGE_A_LINES.join('\n'), 'exact PENDING Stage A review contract');
  assert.equal(sections[1][1], LOCAL_REVIEW_LINES.join('\n'), 'exact local Browser evidence binding');
  for (const line of PENDING_STAGE_A_LINES) assert.equal(source.split(line).length - 1, 1, `one controlled review line: ${line}`);
  assert.doesNotMatch(source, /(?:READY|APPROVE|CONTENT READY|CLEAR \/ READY|SUCCESS|PASS)/u, 'no verdict or deployment success is fabricated in the initial review');
}

function pendingReviewFixture() {
  return `# G009 Batch 15 — STY-14 Architecture Style Choice Matrix Review\n\n## Stage A candidate\n\n${PENDING_STAGE_A_LINES.join('\n')}\n\n## Local Browser evidence\n\n${LOCAL_REVIEW_LINES.join('\n')}\n`;
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
  assert.throws(() => assertPendingStageAReview(`${review}\n${PENDING_STAGE_A_LINES[4]}\n`), /exact local Browser evidence binding|one controlled review line/u, 'duplicate controlled claim rejected');
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

test('STY-14 Stage A tracks raw local Browser evidence', () => {
  assert.ok(optionalText(LOCAL_BROWSER), 'raw local Browser evidence exists');
});

const STATE_CONTRACTS = [
  ['desktopLight', 1440, 1000, 'light', 800, 347, 480, 177567],
  ['desktopDark', 1440, 1000, 'dark', 800, 480, 595, 179003],
  ['mobileLight', 390, 844, 'light', 358, 595, 716, 59905],
  ['mobileDark', 390, 844, 'dark', 358, 716, 826, 58585],
];
const WRAPPER_LABELS = ['架构风格选择矩阵双轴图，可横向滚动', '三类压力与四种结构决策矩阵，可横向滚动', '演进动作、观察窗口与回滚路径表，可横向滚动'];
const RELATION_CONTRACTS = [
  ['04', 'STY-04 模块化单体', '模块化单体：在一个部署单元内保护业务边界'],
  ['05', 'STY-05 微服务', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['06', 'STY-06 事件驱动架构', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
];
const SOURCE_CONTRACTS = [
  ['Monolith First', 'https://martinfowler.com/bliki/MonolithFirst.html'],
  ['Spring Modulith Fundamentals', 'https://docs.spring.io/spring-modulith/reference/fundamentals.html'],
  ['Microservices', 'https://martinfowler.com/articles/microservices.html'],
  ['Microservices architecture style', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices'],
  ['What do you mean by “Event-Driven”?', 'https://martinfowler.com/articles/201701-event-driven.html'],
  ['Event-driven architecture style', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven'],
];
const RELATION_METHOD = 'exact-href navigation and Browser back; no physical click claimed';
const SCREENSHOT_REASON = 'Viewport screenshot rendered in tool output only; no durable full-article screenshot artifact was retained.';

export function assertLocalBrowser(raw) {
  exactKeys(raw, ['schemaVersion', 'tool', 'baseUrl', 'capturedAt', 'buildProvenance', 'collection', 'svgAsset', 'states'], 'Browser root');
  assert.equal(raw.schemaVersion, 1);
  assert.equal(raw.tool, 'Codex in-app Browser / CUA CDP');
  assert.equal(raw.baseUrl, BASE_URL);
  assert.equal(raw.capturedAt, '2026-09-07T14:01:05.707Z');
  assert.deepEqual(raw.buildProvenance, {
    baseHead: '463f1dec2ae0b35eedcf6fef2933f11ad60d74f8', kind: 'working-tree candidate after canonical generation; not a committed or deployed head',
    inputFiles: 285, inputSha256: INPUT_SHA256,
    scriptUrls: [`${BASE_URL}/assets/js/runtime~main.a15b5364.js`, `${BASE_URL}/assets/js/main.ce66ac75.js`],
  }, 'exact Browser build provenance');
  assert.deepEqual(raw.collection, {
    tabId: '2', diagnosticMethods: ['Runtime.exceptionThrown', 'Log.entryAdded'], consoleLevels: ['warn', 'error'],
    keyboardMethod: 'CUA Tab then DOM focus and CUA Right; browser-reported focus-visible and computed outline; no synthetic key event',
    relationMethod: RELATION_METHOD, sourceMethod: 'actual article anchors and browser-resolved destinations; no external page loading claim',
    initialAttempt: 'A preliminary tab spanning rebuild recorded React recoverable hydration error #418 at 2026-09-07T13:57:08.264Z. A stale closure initially read that old tab log while inspecting tab 2. Accepted observations use fixed tab 2 and its native logs; the prior error was not hidden or relabeled as passing.',
  }, 'exact collection scope and preliminary diagnostic disclosure');
  const svgBytes = readFileSync('static/img/diagrams/sty-14-architecture-choice-matrix.svg');
  assert.deepEqual(raw.svgAsset, {bytes: svgBytes.length, sha256: sha256(svgBytes), viewBox: '0 0 1600 2200'}, 'observed SVG matches reviewed bytes');
  exactKeys(raw.states, STATE_CONTRACTS.map(([name]) => name), 'four states');
  for (const [name, width, height, theme, clientWidth, afterSequence, cursor, screenshotBytes] of STATE_CONTRACTS) {
    const state = raw.states[name];
    exactKeys(state, ['url', 'h1', 'viewport', 'theme', 'page', 'wrappers', 'svg', 'relations', 'sources', 'sty15ActionableCount', 'interactions', 'relationChecks', 'logs', 'diagnostics', 'screenshot'], name);
    assert.equal(state.url, `${BASE_URL}/styles/sty-14`, `${name} route`);
    assert.equal(state.h1, TITLE, `${name} H1`);
    assert.deepEqual(state.viewport, {width, height}, `${name} viewport`);
    assert.equal(state.theme, theme, `${name} theme`);
    assert.deepEqual(state.page, {clientWidth: width, scrollWidth: width}, `${name} no page overflow`);
    assert.deepEqual(state.wrappers, WRAPPER_LABELS.map((label, i) => ({label, className: i === 0 ? 'architecture-diagram-scroll' : 'table-wrapper table-wrapper--mapping', role: 'region', tabIndex: 0, clientWidth, scrollWidth: [800, 1527, 1406][i]})), `${name} exact ordered wrappers`);
    assert.deepEqual(state.interactions, WRAPPER_LABELS.map((label, i) => ({label, key: 'ArrowRight', before: 0, after: width === 1440 && i === 0 ? 0 : 40, focused: true, focusVisible: true, outlineWidth: '3px', outlineStyle: 'solid', outlineColor: theme === 'light' ? 'rgb(159, 63, 49)' : i === 0 ? 'rgb(227, 144, 125)' : 'rgba(227, 144, 125, 0.62)'})), `${name} bound keyboard interactions`);
    assert.deepEqual(state.svg, [{srcKind: 'data:image/svg+xml;base64', encodedLength: 13280, complete: true, naturalWidth: 109, naturalHeight: 150, width: 800, height: 1100}], `${name} loaded SVG dimensions`);
    assert.deepEqual(state.relations, RELATION_CONTRACTS.map(([id, text]) => ({text, href: `/tego-arch/styles/sty-${id}`, destination: `${BASE_URL}/styles/sty-${id}`})), `${name} exact relation anchors`);
    assert.deepEqual(state.relationChecks, RELATION_CONTRACTS.map(([id, , h1]) => ({href: `/tego-arch/styles/sty-${id}`, method: RELATION_METHOD, destination: {url: `${BASE_URL}/styles/sty-${id}`, h1, returnHref: '/tego-arch/styles/sty-14'}, returned: {url: `${BASE_URL}/styles/sty-14`, h1: TITLE, theme}})), `${name} exact relation href H1 and return`);
    assert.deepEqual(state.sources, SOURCE_CONTRACTS.map(([text, href]) => ({text, href, destination: href, rel: 'noopener noreferrer', target: '_blank'})), `${name} exact governed sources`);
    assert.equal(state.sty15ActionableCount, 0, `${name} STY-15 absent`);
    assert.deepEqual(state.logs, [], `${name} no console warnings/errors`);
    assert.deepEqual(state.diagnostics, {afterSequence, cursor, events: [], hasMore: false, truncated: false}, `${name} complete continuous diagnostics`);
    assert.deepEqual(state.screenshot, {attempted: true, bytes: screenshotBytes, artifact: null, status: 'BLOCKED', acceptance: 'NOT_ACCEPTED', reason: SCREENSHOT_REASON}, `${name} honest screenshot boundary`);
  }
}

test('STY-14 local Browser contract binds exact raw bytes and current build inputs', () => {
  const bytes = readFileSync(LOCAL_BROWSER);
  assert.equal(bytes.length, LOCAL_BROWSER_BYTES, 'exact raw bytes');
  assert.equal(sha256(bytes), LOCAL_BROWSER_SHA256, 'exact raw SHA-256');
  assertLocalBrowser(JSON.parse(bytes));
  const paths = execFileSync('git', ['ls-files', '-z', ...BUILD_INPUTS], {encoding: 'utf8'}).split('\0').filter(Boolean).sort();
  assert.equal(paths.length, 285, 'exact build input file count');
  assert.equal(sha256(paths.map((path) => `${path}\0${sha256(readFileSync(path))}\n`).join('')), INPUT_SHA256, 'raw observations bind the current candidate build inputs');
});

const browserMutations = [
  ['duplicate wrapper', (s) => { s.wrappers[1] = structuredClone(s.wrappers[0]); }],
  ['swapped wrapper', (s) => { [s.wrappers[1], s.wrappers[2]] = [s.wrappers[2], s.wrappers[1]]; }],
  ['missing wrapper', (s) => { s.wrappers.pop(); }],
  ['wrong viewport', (s) => { s.viewport.width++; }],
  ['wrong theme', (s) => { s.theme = 'system'; }],
  ['page overflow', (s) => { s.page.scrollWidth++; }],
  ['lost focus', (s) => { s.interactions[0].focused = false; }],
  ['lost focus-visible', (s) => { s.interactions[0].focusVisible = false; }],
  ['thin outline', (s) => { s.interactions[0].outlineWidth = '1px'; }],
  ['wrong ArrowRight delta', (s) => { s.interactions[1].after = 0; }],
  ['swapped interaction', (s) => { [s.interactions[0], s.interactions[1]] = [s.interactions[1], s.interactions[0]]; }],
  ['fabricated relation href', (s) => { s.relationChecks[0].href = '/styles/sty-15'; }],
  ['fabricated destination H1', (s) => { s.relationChecks[0].destination.h1 = TITLE; }],
  ['missing reciprocal href', (s) => { delete s.relationChecks[0].destination.returnHref; }],
  ['missing return', (s) => { delete s.relationChecks[0].returned; }],
  ['fabricated physical click', (s) => { s.relationChecks[0].method = 'physical click'; }],
  ['source href', (s) => { s.sources[0].href += '/fake'; }],
  ['source destination', (s) => { s.sources[0].destination += '/fake'; }],
  ['source rel', (s) => { s.sources[0].rel = ''; }],
  ['source target', (s) => { s.sources[0].target = '_self'; }],
  ['unloaded SVG', (s) => { s.svg[0].complete = false; }],
  ['SVG intrinsic size', (s) => { s.svg[0].naturalWidth = 0; }],
  ['SVG rendered size', (s) => { s.svg[0].width = 358; }],
  ['truncated diagnostics', (s) => { s.diagnostics.truncated = true; }],
  ['unread diagnostics', (s) => { s.diagnostics.hasMore = true; }],
  ['discontinuous cursor', (s) => { s.diagnostics.afterSequence++; }],
  ['runtime exception', (s) => { s.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); }],
  ['console error', (s) => { s.logs.push({level: 'error', message: 'failure'}); }],
  ['fabricated STY-15', (s) => { s.sty15ActionableCount = 1; }],
  ['fabricated screenshot PASS', (s) => { s.screenshot.status = 'PASS'; s.screenshot.acceptance = 'ACCEPTED'; }],
  ['fabricated screenshot artifact', (s) => { s.screenshot.artifact = 'history.png'; }],
  ['additive state claim', (s) => { s.deployment = 'SUCCESS'; }],
];
for (const [stateName] of STATE_CONTRACTS) for (const [label, mutate] of browserMutations) {
  test(`STY-14 raw Browser rejects ${stateName}: ${label}`, () => {
    const raw = JSON.parse(readFileSync(LOCAL_BROWSER));
    assertLocalBrowser(raw);
    const copy = structuredClone(raw); mutate(copy.states[stateName]);
    assert.notDeepEqual(copy, raw, 'mutation applies');
    assert.throws(() => assertLocalBrowser(copy), {name: 'AssertionError'});
  });
}
