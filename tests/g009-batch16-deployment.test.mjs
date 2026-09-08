import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import test from 'node:test';
import {BASELINE, ARTICLE, ROUTE, SVG, EXACT_METADATA, ORIGINAL_SOURCE_CONTRACT, WRAPPER_LABELS, SOURCE_ANCHORS, gitBaseline, optionalText, mutation, assertNoDDD02, readerContract} from './g009-batch16-content.test.mjs';

export const REVIEW = 'docs/reviews/g009-batch16.md';
export const LOCAL_BROWSER = 'docs/reviews/evidence/g009-batch16-stage-a-browser.json';
export const STAGE_A_BROWSER = 'docs/reviews/evidence/g009-batch16-stage-a-production-browser.json';
export const STAGE_B_BROWSER = 'docs/reviews/evidence/g009-batch16-stage-b-production-browser.json';
export const PRODUCTION_URL = 'https://sealday.github.io/tego-arch';
export const EXPECTED_CURRENT_PROJECTION = Object.freeze({completed: 85, documents: 127, sources: 600});
export const EXPECTED_STAGE_A_PROJECTION = Object.freeze({completed: 85, documents: 128, sources: 604});
export const EXPECTED_STAGE_B_PROJECTION = Object.freeze({completed: 86, documents: 128, sources: 604});
export const LIFECYCLES = Object.freeze({A: {published: true, value: 'pending'}, B: {published: true, value: 'complete'}});
export const PENDING_BACKLOG_ROW = '- [ ] **DDD-01 P0｜战略 DDD 总览**：子域、统一语言、Bounded Context 和 Context Map。';
export const NEXT_BACKLOG_ROW = '- [ ] **DDD-02 P0｜聚合与一致性边界**：事务、并发、引用和跨聚合流程。';
export const STATE_CONTRACTS = Object.freeze([['desktopLight', 1440, 1000, 'light'], ['desktopDark', 1440, 1000, 'dark'], ['mobileDark', 390, 844, 'dark'], ['mobileLight', 390, 844, 'light']]);
export const HTTP_ROUTES = Object.freeze(['/', '/patterns', '/patterns/ddd-01', '/styles/sty-14', '/references', '/img/diagrams/ddd-01-strategic-ddd-context-map.svg']);
export const RELATION_METHOD = 'exact-href navigation and Browser back; no physical click claimed';
export const STAGE_A_REVIEWED_HEAD = '3777405c02c64b75de38a33d9709cac5a29bcedf';
export const STAGE_A_IMPLEMENTATION_HEAD = '997e4b136b40cab3b96ff033c77830752b16b5dc';
export const STAGE_A_PUBLICATION = Object.freeze({workflowName:'Verify and deploy Docusaurus to GitHub Pages',workflowPath:'.github/workflows/deploy.yml',createdAt:'2026-09-08T13:27:09Z',startedAt:'2026-09-08T13:27:09Z',updatedAt:'2026-09-08T13:30:58Z',runId:34232044270,build:{id:102080344661,startedAt:'2026-09-08T13:27:14Z',completedAt:'2026-09-08T13:30:33Z'},deploy:{id:102081529119,startedAt:'2026-09-08T13:30:38Z',completedAt:'2026-09-08T13:30:51Z'}});
export const REVIEW_ROLES = Object.freeze(['code/spec/security', 'content/evidence/rights', 'architecture/invariants']);
export const BUILD_INPUTS = Object.freeze(['content', 'data', 'src', 'static', 'scripts', 'plugins', 'docusaurus.config.ts', 'sidebars.ts', 'package.json', 'package-lock.json']);
export const OBSERVED_BUILD_COMMIT = '6cdb62fb2013cb28178c77484aac948bd4862067';
const APPROVED_RIGHTS_FIELDS = Object.freeze(['license_evidence_note', 'version', 'expected_final_approval_note']);
const APPROVED_RIGHTS_PATHS = new Set(['data/source-ledger.json', 'src/generated/source-ledger.json']);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
let observedBuildPathsCache;
const observedBuildBytesCache = new Map();
const observedBuildPaths = () => observedBuildPathsCache ??= execFileSync('git', ['ls-tree','-r','--name-only','-z',OBSERVED_BUILD_COMMIT,'--',...BUILD_INPUTS], {encoding:'utf8'}).split('\0').filter(Boolean).sort();
const observedBuildInput = (path) => {
  if (!observedBuildBytesCache.has(path)) observedBuildBytesCache.set(path, execFileSync('git',['show',`${OBSERVED_BUILD_COMMIT}:${path}`],{maxBuffer:20*1024*1024}));
  return observedBuildBytesCache.get(path);
};
const project = (s) => ({completed: s.completed_topics, documents: s.content_documents, sources: s.governed_sources});
const exactKeys = (v, keys, label) => { assert.ok(v && typeof v === 'object', label); assert.deepEqual(Object.keys(v).sort(), [...keys].sort(), label); };
const topic = (manifest, id) => { const found = manifest.topics.filter((t) => t.id === id); assert.equal(found.length, 1, `one canonical ${id}`); return found[0]; };

export function assertProjection(status, manifest, stage, documents = []) {
  assert.ok(LIFECYCLES[stage], 'known lifecycle stage');
  const current = topic(manifest, 'DDD-01');
  assert.equal(current.published, true, 'DDD-01 generated publication must exist');
  assert.deepEqual(project(status), stage === 'A' ? EXPECTED_STAGE_A_PROJECTION : EXPECTED_STAGE_B_PROJECTION, 'exact current/live projection');
  assert.deepEqual(status.durable_stories, {completed: 8, total: 20, current: 'G009'}, 'no unrelated durable-story closure');
  const expected = {id: 'DDD-01', type: 'pattern', title: EXACT_METADATA.title, slug: ROUTE, priority: 'P0', status: {scope: 'backlog-projection', value: LIFECYCLES[stage].value, source: 'docs/content-backlog.md'}, dependencies: [], adjacent_topics: ['STY-14'], primary_sources: ['https://www.domainlanguage.com/ddd/reference/'], related_cases: [], related_questions: [], published: true, pattern_group: 'general-design'};
  assert.deepEqual(Object.fromEntries(Object.keys(expected).map((k) => [k, current[k]])), expected, 'exact DDD-01 projected semantic fields');
  assert.match(current.reviewed_at, /^2026-\d\d-\d\d$/u, 'reviewed article date');
  const baseline = JSON.parse(gitBaseline('src/generated/topic-manifest.json'));
  assert.deepEqual(topic(manifest, 'DDD-02'), topic(baseline, 'DDD-02'), 'existing DDD-02 planned identity stays byte-equivalent and unpublished');
  assert.equal(documents.some((d) => d.metadata?.topic_id === 'DDD-02'), false, 'no fabricated DDD-02 document');
  for (const d of documents) assertNoDDD02(readerContract(d.body ?? '').links.map((l) => l.href), d.metadata?.slug ?? ROUTE);
}
export const assertStageAProjection = (status, manifest, documents) => assertProjection(status, manifest, 'A', documents);
export const assertStageBProjection = (status, manifest, documents) => assertProjection(status, manifest, 'B', documents);
export function projectionFixture(stage = 'A') {
  const status = JSON.parse(gitBaseline('src/generated/project-status.json')), manifest = JSON.parse(gitBaseline('src/generated/topic-manifest.json'));
  const counts = stage === 'A' ? EXPECTED_STAGE_A_PROJECTION : EXPECTED_STAGE_B_PROJECTION;
  Object.assign(status, {completed_topics: counts.completed, content_documents: counts.documents, governed_sources: counts.sources});
  Object.assign(topic(manifest, 'DDD-01'), {title: EXACT_METADATA.title, published: true, reviewed_at: '2026-09-08', adjacent_topics: ['STY-14'], primary_sources: ['https://www.domainlanguage.com/ddd/reference/'], status: {scope: 'backlog-projection', value: LIFECYCLES[stage].value, source: 'docs/content-backlog.md'}});
  return {status, manifest};
}

const allowedNewHistory = new Set([REVIEW, LOCAL_BROWSER, STAGE_A_BROWSER, STAGE_B_BROWSER]);
const baselineHistoryPaths = () => execFileSync('git', ['ls-tree', '-r', '--name-only', BASELINE, 'docs/reviews'], {encoding: 'utf8'}).trim().split('\n');
function reviewFiles(dir = 'docs/reviews') { return readdirSync(dir, {withFileTypes: true}).flatMap((e) => e.isDirectory() ? reviewFiles(`${dir}/${e.name}`) : [`${dir}/${e.name}`]).sort(); }
export function historyFixture() { return new Map(baselineHistoryPaths().map((p) => [p, gitBaseline(p)])); }
export function assertHistoricalArtifacts(files, backlog) {
  const expected = baselineHistoryPaths();
  assert.deepEqual([...files.keys()].filter((p) => !allowedNewHistory.has(p)).sort(), expected, 'complete 76 historical review/evidence membership');
  for (const path of expected) assert.deepEqual(files.get(path), gitBaseline(path), `historical bytes unchanged: ${path}`);
  const base = gitBaseline('docs/content-backlog.md').toString(), historicalRow = base.split('\n').find((l) => l.startsWith('- **当前发布基线：** '));
  assert.ok(historicalRow, 'baseline publication suffix exists');
  const liveRow = backlog.split('\n').find((l) => l.startsWith('- **当前发布基线：** '));
  assert.ok(liveRow?.endsWith(historicalRow.slice('- **当前发布基线：** '.length)), 'entire old publication suffix retained without rewriting');
  const rows = base.split('\n').filter((l) => /^- \[[ xX]\] \*\*/u.test(l) && !l.includes('**DDD-01 '));
  for (const row of rows) assert.equal(backlog.split('\n').filter((l) => l === row).length, 1, 'all other topic rows and closure suffixes unchanged');
  assert.equal(backlog.split('\n').filter((l) => l === NEXT_BACKLOG_ROW).length, 1, 'DDD-02 remains pending');
}
export function assertBacklog(source, stage, evidence = null) {
  const rows = source.split('\n').filter((l) => /^- \[[ xX]\] \*\*DDD-01\b/u.test(l)); assert.equal(rows.length, 1, 'one DDD-01 checkbox');
  if (stage === 'A') assert.equal(rows[0], PENDING_BACKLOG_ROW, 'Stage A keeps exact pending row');
  else {
    assert.ok(evidence?.reviewedHead && evidence?.implementationSha && evidence?.runId, 'Stage B closure requires exact Stage A evidence identities');
    assert.ok(rows[0].startsWith(PENDING_BACKLOG_ROW.replace('- [ ]', '- [x]')), 'only DDD-01 checkbox closes');
    for (const value of [evidence.reviewedHead, evidence.implementationSha, String(evidence.runId)]) assert.ok(rows[0].includes(value), 'closure binds Stage A evidence');
  }
}

export function assertReview(source, {stage = 'A', phase = 'pending', reviewedHead, publication, browserIdentity} = {}) {
  assert.ok(source, 'DDD-01 review must exist');
  const r = readerContract(source), headings = r.blocks.filter((b) => b.heading === 2).map((b) => b.text);
  assert.deepEqual(headings, [`Stage ${stage} candidate`, 'Independent reviews', 'Browser evidence', 'Publication'], 'review sections are complete and ordered');
  const sentences = r.blocks.filter((b) => !b.evidence).map((b) => b.text.trim());
  const required = [
    `Scope: STAGE_${stage}_${phase.toUpperCase()}.`,
    `DDD-01 lifecycle: published / ${LIFECYCLES[stage].value}.`,
    'DDD-02 topic: planned / unpublished / pending; document: absent / non-actionable.',
    `Final judgment: ${phase === 'pending' ? 'PENDING' : 'READY'}.`,
    `Deployment: ${phase === 'published' ? 'SUCCESS / functional PASS' : 'NOT_RUN'}.`,
    'Screenshot evidence: BLOCKED / NOT_ACCEPTED; accepted 0/4; functional PASS is not visual acceptance.',
  ];
  if (phase !== 'pending') { assert.match(reviewedHead ?? '', /^[0-9a-f]{40}$/u); required.push(`Reviewed head: ${reviewedHead}.`); }
  for (const role of REVIEW_ROLES) required.push(`${role}: ${phase === 'pending' ? 'PENDING' : `head ${reviewedHead}; ${role === 'content/evidence/rights' ? 'CONTENT READY / rights PASS / findings 0' : role === 'architecture/invariants' ? 'CLEAR / READY / blockers 0' : 'READY / APPROVE / findings 0'}`}.`);
  if (phase === 'published') {
    assert.ok(publication && browserIdentity, 'published review binds independent deployment and Browser identities');
    required.push(`Pages: ${publication.headSha}; run ${publication.runId}; build ${publication.jobs[0].id}; deploy ${publication.jobs[1].id}; push / completed / success.`);
    required.push(`Browser raw: ${browserIdentity.path}; bytes ${browserIdentity.bytes}; SHA-256 ${browserIdentity.sha256}.`);
  }
  const isBinding = (s) => /^Browser raw: docs\/reviews\/evidence\/g009-batch16-stage-[ab]-(?:production-)?browser\.json; bytes [1-9]\d*; SHA-256 [0-9a-f]{64}\.$/u.test(s) || /^Local build: [0-9a-f]{40}; files [1-9]\d*; SHA-256 [0-9a-f]{64}\.$/u.test(s);
  for (const block of r.blocks.filter((b) => b.evidence)) {
    assert.doesNotMatch(block.text, /(?:Deployment|Final judgment|code\/spec\/security|content\/evidence\/rights|architecture\/invariants|Screenshot evidence):/u, 'governed review claims cannot be displaced into evidence cards');
    assert.doesNotMatch(block.text, /(?:accepted\s+(?!0\/4)\d+\/4|(?:visual|full-page|全文页面|全页截图)[^\n。]*(?:PASS|(?<!NOT_)ACCEPTED|已接受|通过))/iu, 'evidence cards cannot inflate screenshot or visual acceptance');
  }
  const bindings = sentences.filter(isBinding); assert.equal(new Set(bindings.map((s) => s.split(';')[0])).size, bindings.length, 'one independent binding per artifact');
  assert.deepEqual(sentences.filter((s) => !headings.includes(s) && s !== 'G009 Batch 16' && (!isBinding(s) || required.includes(s))), required, 'exact review claims, no additive/displaced success');
}
export function reviewFixture(options = {}) {
  const {stage = 'A', phase = 'pending', reviewedHead, publication, browserIdentity} = options;
  const lines = [
    `Scope: STAGE_${stage}_${phase.toUpperCase()}.`, `DDD-01 lifecycle: published / ${LIFECYCLES[stage].value}.`, 'DDD-02 topic: planned / unpublished / pending; document: absent / non-actionable.', `Final judgment: ${phase === 'pending' ? 'PENDING' : 'READY'}.`, `Deployment: ${phase === 'published' ? 'SUCCESS / functional PASS' : 'NOT_RUN'}.`, 'Screenshot evidence: BLOCKED / NOT_ACCEPTED; accepted 0/4; functional PASS is not visual acceptance.',
    ...(phase === 'pending' ? [] : [`Reviewed head: ${reviewedHead}.`]),
    ...REVIEW_ROLES.map((role) => `${role}: ${phase === 'pending' ? 'PENDING' : `head ${reviewedHead}; ${role === 'content/evidence/rights' ? 'CONTENT READY / rights PASS / findings 0' : role === 'architecture/invariants' ? 'CLEAR / READY / blockers 0' : 'READY / APPROVE / findings 0'}`}.`),
    ...(phase !== 'published' ? [] : [`Pages: ${publication.headSha}; run ${publication.runId}; build ${publication.jobs[0].id}; deploy ${publication.jobs[1].id}; push / completed / success.`, `Browser raw: ${browserIdentity.path}; bytes ${browserIdentity.bytes}; SHA-256 ${browserIdentity.sha256}.`]),
  ];
  return `## Stage ${stage} candidate\n\n${lines.slice(0, phase === 'pending' ? 6 : 7).join('\n\n')}\n\n## Independent reviews\n\n${lines.slice(phase === 'pending' ? 6 : 7, phase === 'pending' ? 9 : 10).join('\n\n')}\n\n## Browser evidence\n\n## Publication\n\n${phase === 'published' ? lines.slice(10).join('\n\n') : ''}\n`;
}

// No actual run, head, hash or observation is invented here. Tasks 4–7 pass the independently
// recorded reviewed identity into these semantic validators, then freeze the resulting raw bytes.
export function assertBrowserEvidence(raw, {baseUrl = PRODUCTION_URL, expectedHead, expectedBuild, local = false, svgBytes, rawIdentity, rawBytes} = {}) {
  assert.ok(raw, 'DDD-01 raw Browser evidence must exist');
  exactKeys(raw, local ? ['schemaVersion', 'tool', 'baseUrl', 'capturedAt', 'build', 'svgAsset', 'states'] : ['schemaVersion', 'tool', 'baseUrl', 'capturedAt', 'publication', 'http', 'svgAsset', 'sessionDiagnostics', 'states'], 'Browser root schema');
  assert.equal(raw.schemaVersion, 1); assert.equal(raw.tool, 'Codex in-app Browser / CUA'); assert.equal(raw.baseUrl, baseUrl);
  if (local) {
    assert.ok(expectedBuild, 'independently bound local build inputs');
    exactKeys(raw.build, ['baseHead', 'inputFiles', 'inputSha256'], 'local build schema');
    assert.match(raw.build.baseHead, /^[0-9a-f]{40}$/u); assert.match(raw.build.inputSha256, /^[0-9a-f]{64}$/u); assert.ok(raw.build.inputFiles > 0);
    assert.deepEqual(raw.build, expectedBuild, 'local raw belongs to independently recorded build');
  } else {
  assert.match(expectedHead ?? '', /^[0-9a-f]{40}$/u, 'independently expected head');
  const p = raw.publication;
  exactKeys(p, ['reviewedHead', 'implementationSha', 'headSha', 'workflowName', 'workflowPath', 'runId', 'event', 'status', 'conclusion', 'createdAt', 'startedAt', 'updatedAt', 'jobs'], 'publication schema');
  assert.match(p.reviewedHead, /^[0-9a-f]{40}$/u); assert.equal(p.implementationSha, expectedHead); assert.equal(p.headSha, expectedHead);
  assert.equal(p.workflowName, 'Verify and deploy Docusaurus to GitHub Pages'); assert.equal(p.workflowPath, '.github/workflows/deploy.yml');
  assert.equal(p.event, 'push'); assert.equal(p.status, 'completed'); assert.equal(p.conclusion, 'success'); assert.ok(Number.isSafeInteger(p.runId) && p.runId > 0);
  assert.deepEqual(p.jobs.map((j) => j.name), ['build', 'deploy']);
  for (const job of p.jobs) { exactKeys(job, ['name', 'id', 'status', 'conclusion', 'startedAt', 'completedAt'], 'job schema'); assert.ok(Number.isSafeInteger(job.id) && job.id > 0); assert.equal(job.status, 'completed'); assert.equal(job.conclusion, 'success'); assert.ok(Date.parse(job.startedAt) >= Date.parse(p.startedAt)); assert.ok(Date.parse(job.completedAt) <= Date.parse(p.updatedAt)); }
  assert.notEqual(p.jobs[0].id, p.jobs[1].id); assert.ok(Date.parse(raw.capturedAt) > Date.parse(p.updatedAt), 'fresh Browser after exact-head deployment');
  assert.deepEqual(raw.sessionDiagnostics, {scope:'one continuous production Browser session spanning all four states, relation/source audits, and final log read',methods:['Runtime.consoleAPICalled','Runtime.exceptionThrown','Log.entryAdded'],afterSequence:22,cursor:182,events:[],hasMore:false,truncated:false,nativeLogs:[]}, 'honest session-wide diagnostics; no fabricated per-state cursors');
  assert.deepEqual(raw.http.map((h) => h.route), HTTP_ROUTES);
  for (const h of raw.http) { exactKeys(h, ['route', 'url', 'status', 'contentType', 'observedAt', 'bytes', 'sha256'], 'HTTP schema'); assert.equal(h.url, baseUrl + h.route); assert.equal(h.status, 200); assert.equal(h.contentType, h.route.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8'); assert.ok(h.bytes > 0); assert.match(h.sha256, /^[0-9a-f]{64}$/u); assert.ok(Date.parse(h.observedAt) > Date.parse(p.updatedAt) && Date.parse(h.observedAt) <= Date.parse(raw.capturedAt)); }
  }
  assert.ok(svgBytes?.length, 'independent reviewed SVG bytes');
  const svgIdentity = {bytes: svgBytes.length, sha256: hash(svgBytes)};
  assert.deepEqual(raw.svgAsset, svgIdentity, 'reviewed SVG identity');
  if (!local) assert.deepEqual({bytes: raw.http.at(-1).bytes, sha256: raw.http.at(-1).sha256}, svgIdentity, 'HTTP SVG equals local reviewed SVG');
  exactKeys(raw.states, STATE_CONTRACTS.map(([id]) => id), 'four states');
  for (const [id,width,height,theme] of STATE_CONTRACTS) {
    const s = raw.states[id];
    exactKeys(s, ['url', 'h1', 'viewport', 'theme', 'page', 'wrappers', 'interactions', 'svg', 'relations', 'sources', 'ddd02ActionableCount', 'logs', 'diagnostics', 'screenshot'], 'state schema');
    assert.equal(s.url, baseUrl + ROUTE); assert.equal(s.h1, EXACT_METADATA.title); assert.deepEqual(s.viewport, {width,height}); assert.equal(s.theme, theme); assert.deepEqual(s.page, {clientWidth: width, scrollWidth: width});
    assert.equal(s.wrappers.length, 3); assert.equal(s.interactions.length, 3);
    const expectedWrapperWidth = width === 1440 ? 800 : 358;
    const expectedScrollWidths = [800, 1447, 1529];
    for (const [i,w] of s.wrappers.entries()) {
      exactKeys(w, ['label','role','tabIndex','clientWidth','scrollWidth'], 'wrapper schema'); assert.equal(w.label, WRAPPER_LABELS[i]); assert.equal(w.role, 'region'); assert.equal(w.tabIndex, 0); assert.equal(w.clientWidth, expectedWrapperWidth); assert.equal(w.scrollWidth, expectedScrollWidths[i]);
      const action = s.interactions[i]; exactKeys(action, ['label','key','before','after','focused','focusVisible','outlineWidth','outlineStyle','method'], 'keyboard observation schema');
      assert.equal(action.label, w.label); assert.equal(action.method, 'actual Tab/ArrowRight input; no synthetic event'); assert.equal(action.key, 'ArrowRight'); assert.equal(action.before, 0); assert.equal(action.after, w.scrollWidth > w.clientWidth ? 40 : 0); assert.equal(action.focused, true); assert.equal(action.focusVisible, true); assert.equal(action.outlineWidth, '3px'); assert.equal(action.outlineStyle, 'solid');
    }
    exactKeys(s.svg, ['complete','naturalWidth','naturalHeight','width','height','bytes','sha256'], 'loaded SVG schema'); assert.equal(s.svg.complete, true); assert.deepEqual({naturalWidth:s.svg.naturalWidth,naturalHeight:s.svg.naturalHeight,width:s.svg.width,height:s.svg.height}, {naturalWidth:53,naturalHeight:150,width:800,height:2260}, 'exact natural and rendered SVG geometry'); assert.deepEqual({bytes:s.svg.bytes,sha256:s.svg.sha256}, svgIdentity);
    assert.deepEqual(s.relations, [{href:'/tego-arch/styles/sty-14',method:RELATION_METHOD,destination:{url:baseUrl+'/styles/sty-14',h1:'架构风格选择矩阵：边界、交互与演进触发器',returnHref:'/tego-arch/patterns/ddd-01'},returned:{url:baseUrl+ROUTE,h1:EXACT_METADATA.title,theme}}], 'actual adjacent href/H1/return chain');
    assert.deepEqual(s.sources, SOURCE_ANCHORS.map(([text,href]) => ({text,href,destination:href,rel:'noopener noreferrer',target:'_blank'})), 'six governed remote anchors');
    assert.equal(s.ddd02ActionableCount, 0);
    if (local) {
      assert.deepEqual(s.logs, []);
      exactKeys(s.diagnostics, ['runtimeAndLog','console'], 'complete local diagnostics');
      assert.deepEqual(s.diagnostics, {runtimeAndLog:{methods:['Runtime.exceptionThrown','Log.entryAdded'],afterSequence:157,cursor:181,events:[],hasMore:false,truncated:false},console:{methods:['Runtime.consoleAPICalled'],afterSequence:157,cursor:191,events:[],hasMore:false,truncated:false}}, 'local per-state diagnostic observations');
    } else {
      assert.deepEqual(s.logs, {scope:'session-wide',ref:'productionSession'});
      assert.deepEqual(s.diagnostics, {scope:'session-wide',ref:'productionSession'}, 'state honestly references the one observed production diagnostic window');
    }
    const screenshot = id === 'mobileDark'
      ? {attempted:true,bytes:local?427000:707150,status:'BLOCKED',acceptance:'NOT_ACCEPTED',artifact:null,reason:'fullPage capture returned bytes in the Browser session but could not be persisted as a durable artifact'}
      : {attempted:false,status:'BLOCKED',acceptance:'NOT_ACCEPTED',artifact:null,reason:'fullPage capture was not attempted in this state'};
    assert.deepEqual(s.screenshot, screenshot, 'one mobile-dark attempt only; no functional-to-visual promotion');
  }
  if (rawIdentity || rawBytes) { assert.ok(rawIdentity && rawBytes, 'raw bytes and independent frozen identity supplied together'); assert.equal(rawBytes.length, rawIdentity.bytes); assert.equal(hash(rawBytes), rawIdentity.sha256); assert.deepEqual(JSON.parse(rawBytes), raw, 'semantic object is exact raw artifact'); }
}
export const assertLocalBrowserEvidence = (raw, options) => assertBrowserEvidence(raw, {...options, local:true});
export function currentBuildIdentity(paths = execFileSync('git', ['ls-files','--cached','--others','--exclude-standard','-z',...BUILD_INPUTS], {encoding:'utf8'}).split('\0').filter(Boolean).sort(), readInput = (path) => readFileSync(path)) {
  assert.ok(paths.includes('sidebars.ts'), 'complete build inputs include sidebars.ts');
  return {inputFiles: paths.length, inputSha256: hash(paths.map((path) => `${path}\0${hash(readInput(path))}\n`).join(''))};
}
export function assertBuildDerivation(rawBuild, {
  currentPaths = execFileSync('git', ['ls-files','--cached','--others','--exclude-standard','-z',...BUILD_INPUTS], {encoding:'utf8'}).split('\0').filter(Boolean).sort(),
  observedPaths = observedBuildPaths(),
  currentRead = (path) => readFileSync(path),
  observedRead = observedBuildInput,
} = {}) {
  assert.deepEqual(currentPaths, observedPaths, 'no build-input membership drift since the observed candidate');
  assert.deepEqual(currentBuildIdentity(observedPaths, observedRead), {inputFiles:rawBuild.inputFiles,inputSha256:rawBuild.inputSha256}, 'recorded digest reproducibly derives from the observed candidate tree');
  for (const path of currentPaths) {
    const currentBytes = currentRead(path), observedBytes = observedRead(path);
    if (!APPROVED_RIGHTS_PATHS.has(path)) { assert.deepEqual(currentBytes, observedBytes, `unapproved build-input drift: ${path}`); continue; }
    const current = JSON.parse(currentBytes.toString()), observed = JSON.parse(observedBytes.toString());
    const currentRecord = current.sources.find((s) => s.id === 'src-atlas-ddd01-strategic-context-map');
    const observedRecord = observed.sources.find((s) => s.id === 'src-atlas-ddd01-strategic-context-map');
    assert.ok(currentRecord && observedRecord, `DDD-01 original rights record exists in ${path}`);
    for (const field of APPROVED_RIGHTS_FIELDS) assert.equal(currentRecord[field], ORIGINAL_SOURCE_CONTRACT[field], `approved ${field} completion in ${path}`);
    const normalized = structuredClone(current);
    const normalizedRecord = normalized.sources.find((s) => s.id === 'src-atlas-ddd01-strategic-context-map');
    for (const field of APPROVED_RIGHTS_FIELDS) normalizedRecord[field] = observedRecord[field];
    assert.deepEqual(normalized, observed, `only approved original-rights completion fields may differ in ${path}`);
  }
}
export function assertRecordedBrowserArtifact(path, review, {local = false, rawSource, svgBytes} = {}) {
  const source = rawSource ?? optionalText(path); assert.ok(source, `${path} raw Browser evidence must exist`);
  assert.ok(review, 'independent review evidence binding exists');
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const binding = new RegExp(`Browser raw: ${escaped}; bytes (\\d+); SHA-256 ([0-9a-f]{64})\\.`, 'u').exec(review);
  assert.ok(binding, 'raw artifact bytes/hash bound in independent review');
  const expectedHead = /Pages: ([0-9a-f]{40});/u.exec(review)?.[1];
  const build = /Local build: ([0-9a-f]{40}); files (\d+); SHA-256 ([0-9a-f]{64})\./u.exec(review);
  assertBrowserEvidence(JSON.parse(source), {local,baseUrl:local?'http://localhost:3100/tego-arch':PRODUCTION_URL,expectedHead,expectedBuild:build?{baseHead:build[1],inputFiles:Number(build[2]),inputSha256:build[3]}:undefined,svgBytes:svgBytes ?? readFileSync(SVG),rawBytes:Buffer.from(source),rawIdentity:{bytes:Number(binding[1]),sha256:binding[2]}});
}
export function assertStageAProductionGate(review, options = {}) {
  const rawSource = Object.hasOwn(options, 'rawSource') ? options.rawSource : optionalText(STAGE_A_BROWSER);
  const {svgBytes} = options;
  assert.ok(review, 'Stage A review exists before production evidence is required');
  const judgment = /^Final judgment: ([A-Z]+)\.$/mu.exec(review)?.[1];
  const deployment = /^Deployment: ([^\n]+)\.$/mu.exec(review)?.[1];
  if (deployment === 'NOT_RUN') {
    assert.equal(rawSource, undefined, 'prepublish review cannot coexist with a claimed production raw');
    if (judgment === 'PENDING') return assertReview(review, {stage:'A',phase:'pending'});
    if (judgment === 'READY') {
      const reviewedHead = /^Reviewed head: ([0-9a-f]{40})\.$/mu.exec(review)?.[1];
      return assertReview(review, {stage:'A',phase:'ready',reviewedHead});
    }
    assert.fail('NOT_RUN Stage A must be PENDING or independently READY');
  }
  assert.equal(deployment, 'SUCCESS / functional PASS', 'only the published state may require production raw');
  assert.ok(rawSource, 'published Stage A requires production raw');
  const raw = JSON.parse(rawSource);
  assert.deepEqual(raw.publication, {reviewedHead:STAGE_A_REVIEWED_HEAD,implementationSha:STAGE_A_IMPLEMENTATION_HEAD,headSha:STAGE_A_IMPLEMENTATION_HEAD,workflowName:STAGE_A_PUBLICATION.workflowName,workflowPath:STAGE_A_PUBLICATION.workflowPath,runId:STAGE_A_PUBLICATION.runId,event:'push',status:'completed',conclusion:'success',createdAt:STAGE_A_PUBLICATION.createdAt,startedAt:STAGE_A_PUBLICATION.startedAt,updatedAt:STAGE_A_PUBLICATION.updatedAt,jobs:[{name:'build',id:STAGE_A_PUBLICATION.build.id,status:'completed',conclusion:'success',startedAt:STAGE_A_PUBLICATION.build.startedAt,completedAt:STAGE_A_PUBLICATION.build.completedAt},{name:'deploy',id:STAGE_A_PUBLICATION.deploy.id,status:'completed',conclusion:'success',startedAt:STAGE_A_PUBLICATION.deploy.startedAt,completedAt:STAGE_A_PUBLICATION.deploy.completedAt}]}, 'Stage A publication is independently literal-bound');
  const binding = /Browser raw: docs\/reviews\/evidence\/g009-batch16-stage-a-production-browser\.json; bytes (\d+); SHA-256 ([0-9a-f]{64})\./u.exec(review);
  assert.ok(binding, 'published review binds production raw identity');
  assertReview(review, {stage:'A',phase:'published',reviewedHead:STAGE_A_REVIEWED_HEAD,publication:raw.publication,browserIdentity:{path:STAGE_A_BROWSER,bytes:Number(binding[1]),sha256:binding[2]}});
  return assertRecordedBrowserArtifact(STAGE_A_BROWSER, review, {rawSource,svgBytes});
}
export function browserFixture() {
  const expectedHead = STAGE_A_IMPLEMENTATION_HEAD, svgBytes = Buffer.from('<svg>fixture, not observed production</svg>'), svgAsset = {bytes:svgBytes.length,sha256:hash(svgBytes)}, baseUrl = PRODUCTION_URL;
  const publication={reviewedHead:STAGE_A_REVIEWED_HEAD,implementationSha:expectedHead,headSha:expectedHead,workflowName:STAGE_A_PUBLICATION.workflowName,workflowPath:STAGE_A_PUBLICATION.workflowPath,runId:STAGE_A_PUBLICATION.runId,event:'push',status:'completed',conclusion:'success',createdAt:STAGE_A_PUBLICATION.createdAt,startedAt:STAGE_A_PUBLICATION.startedAt,updatedAt:STAGE_A_PUBLICATION.updatedAt,jobs:[{name:'build',id:STAGE_A_PUBLICATION.build.id,status:'completed',conclusion:'success',startedAt:STAGE_A_PUBLICATION.build.startedAt,completedAt:STAGE_A_PUBLICATION.build.completedAt},{name:'deploy',id:STAGE_A_PUBLICATION.deploy.id,status:'completed',conclusion:'success',startedAt:STAGE_A_PUBLICATION.deploy.startedAt,completedAt:STAGE_A_PUBLICATION.deploy.completedAt}]};
  const sessionDiagnostics={scope:'one continuous production Browser session spanning all four states, relation/source audits, and final log read',methods:['Runtime.consoleAPICalled','Runtime.exceptionThrown','Log.entryAdded'],afterSequence:22,cursor:182,events:[],hasMore:false,truncated:false,nativeLogs:[]};
  const raw = {schemaVersion:1,tool:'Codex in-app Browser / CUA',baseUrl,capturedAt:'2026-09-08T13:34:50Z',publication,http:HTTP_ROUTES.map((route) => ({route,url:baseUrl+route,status:200,contentType:route.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8',observedAt:'2026-09-08T13:31:55Z',...svgAsset})),svgAsset,sessionDiagnostics,states:{}};
  for (const [id,width,height,theme] of STATE_CONTRACTS) raw.states[id] = {url:baseUrl+ROUTE,h1:EXACT_METADATA.title,viewport:{width,height},theme,page:{clientWidth:width,scrollWidth:width},wrappers:WRAPPER_LABELS.map((label,j) => ({label,role:'region',tabIndex:0,clientWidth:width===1440?800:358,scrollWidth:[800,1447,1529][j]})),interactions:WRAPPER_LABELS.map((label,j) => ({label,key:'ArrowRight',before:0,after:width===1440&&j===0?0:40,focused:true,focusVisible:true,outlineWidth:'3px',outlineStyle:'solid',method:'actual Tab/ArrowRight input; no synthetic event'})),svg:{complete:true,naturalWidth:53,naturalHeight:150,width:800,height:2260,...svgAsset},relations:[{href:'/tego-arch/styles/sty-14',method:RELATION_METHOD,destination:{url:baseUrl+'/styles/sty-14',h1:'架构风格选择矩阵：边界、交互与演进触发器',returnHref:'/tego-arch/patterns/ddd-01'},returned:{url:baseUrl+ROUTE,h1:EXACT_METADATA.title,theme}}],sources:SOURCE_ANCHORS.map(([text,href]) => ({text,href,destination:href,rel:'noopener noreferrer',target:'_blank'})),ddd02ActionableCount:0,logs:{scope:'session-wide',ref:'productionSession'},diagnostics:{scope:'session-wide',ref:'productionSession'},screenshot:id==='mobileDark'?{attempted:true,bytes:707150,status:'BLOCKED',acceptance:'NOT_ACCEPTED',artifact:null,reason:'fullPage capture returned bytes in the Browser session but could not be persisted as a durable artifact'}:{attempted:false,status:'BLOCKED',acceptance:'NOT_ACCEPTED',artifact:null,reason:'fullPage capture was not attempted in this state'}};
  return {raw, options:{expectedHead,svgBytes}};
}

if (process.argv[1]?.endsWith('g009-batch16-deployment.test.mjs')) {
test('DDD-01 immutable production baseline is 85/127/600 and both DDD topics planned', () => { const status = JSON.parse(gitBaseline('src/generated/project-status.json')), manifest = JSON.parse(gitBaseline('src/generated/topic-manifest.json')); assert.deepEqual(project(status),EXPECTED_CURRENT_PROJECTION); for(const id of ['DDD-01','DDD-02']) {assert.equal(topic(manifest,id).published,false);assert.equal(topic(manifest,id).status.value,'pending');} });
for (const stage of ['A','B']) {
  test(`DDD-01 Stage ${stage} projection fixture is GREEN`, () => {const f=projectionFixture(stage); assertProjection(f.status,f.manifest,stage);});
  test(`DDD-01 Stage ${stage} rejects relative DDD-02 document link`, () => {
    const f = projectionFixture(stage), documents = [{metadata: {topic_id: 'DDD-01'}, body: '[下一篇](ddd-02?view=full#next)'}];
    assertProjection(f.status, f.manifest, stage, [{...documents[0], body: '[当前页](?view=full#next)'}]);
    assert.throws(() => assertProjection(f.status, f.manifest, stage, documents), /DDD-02 must remain non-actionable/u);
  });
  for(const [label,change] of [
    ['lifecycle drift',(f)=>{topic(f.manifest,'DDD-01').status.value=stage==='A'?'complete':'pending';}],
    ['stale counts',(f)=>{f.status.content_documents=127;}],
    ['fabricated DDD-02',(f)=>{topic(f.manifest,'DDD-02').published=true;}],
    ['duplicate DDD-02',(f)=>{f.manifest.topics.push(structuredClone(topic(f.manifest,'DDD-02')));}],
    ['wrong primary',(f)=>{topic(f.manifest,'DDD-01').primary_sources=['https://example.com/fake'];}],
  ]) test(`DDD-01 Stage ${stage} rejects ${label}`,()=>{const f=projectionFixture(stage),before=structuredClone(f);change(f);assert.notDeepEqual(f,before);assert.throws(()=>assertProjection(f.status,f.manifest,stage),assert.AssertionError);});
}
test('DDD-01 all 76 historical reviews/evidence and backlog publication suffixes remain locked',()=>assertHistoricalArtifacts(new Map(reviewFiles().map((p)=>[p,readFileSync(p)])),readFileSync('docs/content-backlog.md','utf8')));
test('DDD-01 history helper rejects material add/edit/delete and suffix modifications',()=>{
  const files=historyFixture(),backlog=gitBaseline('docs/content-backlog.md').toString();assertHistoricalArtifacts(files,backlog);
  for(const change of [(f)=>{const p=[...f.keys()][0];f.set(p,Buffer.concat([f.get(p),Buffer.from('fabricated')]));},(f)=>f.delete([...f.keys()][0]),(f)=>f.set('docs/reviews/evidence/g009-batch16-stage-c-fabricated.json',Buffer.from('fake'))]){const f=new Map(files);change(f);assert.notDeepEqual(f,files);assert.throws(()=>assertHistoricalArtifacts(f,backlog),assert.AssertionError);}
  assert.throws(()=>assertHistoricalArtifacts(files,mutation(backlog,'当前发布基线：','伪造发布基线：')),assert.AssertionError);
});
test('DDD-01 backlog helper keeps Stage A pending and requires bound Stage B closure',()=>{const base=gitBaseline('docs/content-backlog.md').toString();assertBacklog(base,'A');const evidence={reviewedHead:'a'.repeat(40),implementationSha:'b'.repeat(40),runId:123};const closed=mutation(base,PENDING_BACKLOG_ROW,PENDING_BACKLOG_ROW.replace('- [ ]','- [x]')+` Stage A ${evidence.reviewedHead} ${evidence.implementationSha} ${evidence.runId}`);assertBacklog(closed,'B',evidence);assert.throws(()=>assertBacklog(closed,'A'),assert.AssertionError);assert.throws(()=>assertBacklog(base,'B',evidence),assert.AssertionError);});
for(const stage of ['A','B']) for(const phase of ['pending','ready','published']) test(`DDD-01 Stage ${stage} ${phase} review helper and mutations`,()=>{const f=browserFixture();const options={stage,phase,reviewedHead:'b'.repeat(40),publication:f.raw.publication,browserIdentity:{path:stage==='A'?STAGE_A_BROWSER:STAGE_B_BROWSER,bytes:123,sha256:'c'.repeat(64)}};const s=reviewFixture(options);assertReview(s,options);for(const [before,after] of [['DDD-01 lifecycle: published','DDD-01 lifecycle: unpublished'],['Screenshot evidence: BLOCKED / NOT_ACCEPTED','Screenshot evidence: PASS / ACCEPTED'],['DDD-02 topic: planned / unpublished / pending; document: absent / non-actionable.','DDD-02 topic: published / complete; document: present / actionable.']])assert.throws(()=>assertReview(mutation(s,before,after),options),assert.AssertionError);assert.throws(()=>assertReview(s+'\n\nSUCCESS: fabricated.\n',options),assert.AssertionError);for(const claim of ['Deployment: SUCCESS / functional PASS.','code/spec/security: READY / APPROVE / findings 0.','Final judgment: READY.','Screenshot evidence: PASS / ACCEPTED; accepted 4/4.','全文页面截图已接受并通过。','full-page visual PASS.']){const displaced=s.replace('## Publication',`<details className="evidence-card">\n<summary>证据</summary>\n\n${claim}\n\n</details>\n\n## Publication`);assert.notEqual(displaced,s);assert.throws(()=>assertReview(displaced,options),assert.AssertionError);}});
test('DDD-01 Stage A production gate allows honest prepublish states and rejects state/deployment bypasses',()=>{const pending=reviewFixture(),ready=reviewFixture({stage:'A',phase:'ready',reviewedHead:'b'.repeat(40)});assertStageAProductionGate(pending,{rawSource:undefined});assertStageAProductionGate(ready,{rawSource:undefined});assert.throws(()=>assertStageAProductionGate(mutation(pending,'Final judgment: PENDING.','Final judgment: READY.'),{rawSource:undefined}),assert.AssertionError);assert.throws(()=>assertStageAProductionGate(mutation(pending,'Deployment: NOT_RUN.','Deployment: SUCCESS / functional PASS.'),{rawSource:undefined}),assert.AssertionError);assert.throws(()=>assertStageAProductionGate(pending,{rawSource:JSON.stringify(browserFixture().raw)}),assert.AssertionError);});
test('DDD-01 Stage A production gate retains exact published raw and deployment constraints',()=>{const f=browserFixture(),rawSource=JSON.stringify(f.raw),browserIdentity={path:STAGE_A_BROWSER,bytes:Buffer.byteLength(rawSource),sha256:hash(rawSource)},review=reviewFixture({stage:'A',phase:'published',reviewedHead:f.raw.publication.reviewedHead,publication:f.raw.publication,browserIdentity});assertStageAProductionGate(review,{rawSource,svgBytes:f.options.svgBytes});const failed=structuredClone(f.raw);failed.publication.jobs[1].conclusion='failure';assert.throws(()=>assertStageAProductionGate(review,{rawSource:JSON.stringify(failed),svgBytes:f.options.svgBytes}),assert.AssertionError);assert.throws(()=>assertStageAProductionGate(mutation(review,'Deployment: SUCCESS / functional PASS.','Deployment: UNKNOWN.'),{rawSource,svgBytes:f.options.svgBytes}),assert.AssertionError);});
test('DDD-01 Stage A gate rejects coordinated review/raw head drift even after rebinding bytes',()=>{const f=browserFixture();f.raw.publication.reviewedHead='a'.repeat(40);f.raw.publication.implementationSha='b'.repeat(40);f.raw.publication.headSha='b'.repeat(40);const rawSource=JSON.stringify(f.raw),browserIdentity={path:STAGE_A_BROWSER,bytes:Buffer.byteLength(rawSource),sha256:hash(rawSource)},review=reviewFixture({stage:'A',phase:'published',reviewedHead:f.raw.publication.reviewedHead,publication:f.raw.publication,browserIdentity});assert.throws(()=>assertStageAProductionGate(review,{rawSource,svgBytes:f.options.svgBytes}),assert.AssertionError);});
test('DDD-01 Browser helper accepts independent identity-bound four-state evidence fixture',()=>{const f=browserFixture();assertBrowserEvidence(f.raw,f.options);const rawBytes=Buffer.from(JSON.stringify(f.raw));assertBrowserEvidence(f.raw,{...f.options,rawBytes,rawIdentity:{bytes:rawBytes.length,sha256:hash(rawBytes)}});});
test('DDD-01 recorded Browser helper rejects changed bytes against independent review binding',()=>{const f=browserFixture(),rawSource=JSON.stringify(f.raw),review=`Pages: ${f.options.expectedHead};\nBrowser raw: ${STAGE_A_BROWSER}; bytes ${Buffer.byteLength(rawSource)}; SHA-256 ${hash(rawSource)}.`;assertRecordedBrowserArtifact(STAGE_A_BROWSER,review,{rawSource,svgBytes:f.options.svgBytes});assert.throws(()=>assertRecordedBrowserArtifact(STAGE_A_BROWSER,review,{rawSource:rawSource+' ',svgBytes:f.options.svgBytes}),assert.AssertionError);});
test('DDD-01 local Browser helper binds build inputs without pretending deployment happened',()=>{const f=browserFixture();delete f.raw.publication;delete f.raw.http;delete f.raw.sessionDiagnostics;f.raw.build={baseHead:'b'.repeat(40),inputFiles:290,inputSha256:'c'.repeat(64)};for(const [id,s] of Object.entries(f.raw.states)){s.logs=[];s.diagnostics={runtimeAndLog:{methods:['Runtime.exceptionThrown','Log.entryAdded'],afterSequence:157,cursor:181,events:[],hasMore:false,truncated:false},console:{methods:['Runtime.consoleAPICalled'],afterSequence:157,cursor:191,events:[],hasMore:false,truncated:false}};if(id==='mobileDark')s.screenshot.bytes=427000;}const options={...f.options,baseUrl:PRODUCTION_URL,expectedBuild:structuredClone(f.raw.build)};assertLocalBrowserEvidence(f.raw,options);f.raw.build.inputFiles++;assert.throws(()=>assertLocalBrowserEvidence(f.raw,options),assert.AssertionError);});
test('DDD-01 recorded observation is reproducible and current build derives only through approved rights completion',()=>{const raw=JSON.parse(readFileSync(LOCAL_BROWSER));assert.deepEqual(raw.build,{baseHead:'e499588ab97cc116435fa3fa4cfc6b307dc7576a',inputFiles:288,inputSha256:'239e1575ba779dc9d4896696075bba34a7f6b628c8b8e840b662cd4024c44c48'});assertBuildDerivation(raw.build);assert.notEqual(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),raw.build.baseHead,'observation base is not the post-commit HEAD');});
for(const path of ['content/patterns/ddd-01-strategic-ddd-overview.mdx','sidebars.ts','content/styles/sty-14-architecture-choice-matrix.mdx','scripts/content-relations.mjs']) test(`DDD-01 build derivation rejects later drift in ${path}`,()=>{const raw=JSON.parse(readFileSync(LOCAL_BROWSER));assertBuildDerivation(raw.build);assert.throws(()=>assertBuildDerivation(raw.build,{currentRead:(p)=>p===path?Buffer.concat([readFileSync(p),Buffer.from('\nDRIFT')]):readFileSync(p)}),assert.AssertionError);});
test('DDD-01 build derivation rejects unapproved source-ledger drift',()=>{const raw=JSON.parse(readFileSync(LOCAL_BROWSER));assertBuildDerivation(raw.build);assert.throws(()=>assertBuildDerivation(raw.build,{currentRead:(p)=>p==='data/source-ledger.json'?Buffer.from(readFileSync(p,'utf8').replace('Original illustrative Context Map only','Changed usage boundary')):readFileSync(p)}),assert.AssertionError);});
for(const [label,change] of [
  ['wrong head',(r)=>{r.publication.headSha='f'.repeat(40);}],['wrong workflow',(r)=>{r.publication.workflowPath='.github/workflows/fabricated.yml';}],['failed deploy job',(r)=>{r.publication.jobs[1].conclusion='failure';}],['job timestamp drift',(r)=>{r.publication.jobs[1].completedAt='2026-09-08T14:30:51Z';}],['stale HTTP',(r)=>{r.http[0].observedAt='2026-09-08T00:00:00Z';}],['HTTP failure',(r)=>{r.http[0].status=404;}],['incomplete session diagnostics',(r)=>{r.sessionDiagnostics.truncated=true;}],['session console error',(r)=>{r.sessionDiagnostics.nativeLogs.push({level:'error',message:'failure'});}],['SVG byte drift',(r)=>{r.svgAsset.bytes++;}],['additive observation',(r)=>{r.fabricated='PASS';}],
])test(`DDD-01 Browser rejects ${label}`,()=>{const f=browserFixture();assertBrowserEvidence(f.raw,f.options);const before=structuredClone(f.raw);change(f.raw);assert.notDeepEqual(f.raw,before);assert.throws(()=>assertBrowserEvidence(f.raw,f.options),assert.AssertionError);});
for(const [state] of STATE_CONTRACTS) for(const [label,change] of [
  ['wrong viewport',(s)=>{s.viewport.width++;}],['wrong theme',(s)=>{s.theme=s.theme==='light'?'dark':'light';}],['overflow',(s)=>{s.page.scrollWidth++;}],['wrapper width off by 1px',(s)=>{s.wrappers[0].clientWidth++;}],['wrapper scroll width off by 1px',(s)=>{s.wrappers[1].scrollWidth++;}],['false no-overflow table',(s)=>{s.wrappers[1].scrollWidth=s.wrappers[1].clientWidth;s.interactions[1].after=0;}],['lost focus',(s)=>{s.interactions[0].focused=false;}],['thin outline',(s)=>{s.interactions[0].outlineWidth='1px';}],['no scroll',(s)=>{s.interactions[1].after=0;}],['missing wrapper',(s)=>{s.wrappers.pop();}],['duplicate wrapper',(s)=>{s.wrappers[1]=structuredClone(s.wrappers[0]);}],['swapped wrapper',(s)=>{[s.wrappers[0],s.wrappers[1]]=[s.wrappers[1],s.wrappers[0]];}],['SVG rendered width off by 1px',(s)=>{s.svg.width=799;}],['SVG natural width off by 1px',(s)=>{s.svg.naturalWidth=52;}],['SVG wrong rendered ratio',(s)=>{s.svg.height=2259;}],['lost reciprocal',(s)=>{s.relations[0].destination.returnHref='/patterns';}],['false source destination',(s)=>{s.sources[0].destination='https://example.com/fake';}],['false source target',(s)=>{s.sources[0].target='_self';}],['fabricated DDD-02',(s)=>{s.ddd02ActionableCount=1;}],['diagnostic reference drift',(s)=>{s.diagnostics.ref='fabricated';}],['log reference drift',(s)=>{s.logs.ref='fabricated';}],['unloaded SVG',(s)=>{s.svg.complete=false;}],['stale SVG',(s)=>{s.svg.sha256='0'.repeat(64);}],['visual PASS inflation',(s)=>{s.screenshot.status='PASS';s.screenshot.acceptance='ACCEPTED';}],['copied screenshot attempt',(s)=>{if(!s.screenshot.attempted){s.screenshot={...s.screenshot,attempted:true,bytes:707150,reason:'fullPage capture returned bytes in the Browser session but could not be persisted as a durable artifact'};}else{s.screenshot={attempted:false,status:'BLOCKED',acceptance:'NOT_ACCEPTED',artifact:null,reason:'fullPage capture was not attempted in this state'};}}],
]) test(`DDD-01 Browser ${state} rejects ${label}`,()=>{const f=browserFixture();assertBrowserEvidence(f.raw,f.options);const before=structuredClone(f.raw);change(f.raw.states[state]);assert.notDeepEqual(f.raw,before);assert.throws(()=>assertBrowserEvidence(f.raw,f.options),assert.AssertionError);});
test('DDD-01 production generated publication reaches Stage A published/pending',()=>assertStageAProjection(JSON.parse(readFileSync('src/generated/project-status.json')),JSON.parse(readFileSync('src/generated/topic-manifest.json'))));
test('DDD-01 production review binds exact-head independent verdicts and published evidence',()=>assertStageAProductionGate(optionalText(REVIEW)));
test('DDD-01 production local Browser evidence is independently bound and semantic',()=>assertRecordedBrowserArtifact(LOCAL_BROWSER,optionalText(REVIEW),{local:true}));
test('DDD-01 production Stage A gate requires Browser evidence only after publication',()=>assertStageAProductionGate(optionalText(REVIEW)));
}
