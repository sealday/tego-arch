import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const ARTICLE = 'content/styles/sty-13-space-based-architecture.mdx';
export const REVIEW = 'docs/reviews/g009-batch14.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch14-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch14-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch14-stage-b-production-browser.json';
export const CURRENT_TOPIC = 'STY-13';
export const NEXT_TOPIC = 'STY-14';
export const EXPECTED_STAGE_A = Object.freeze({completed: 82, documents: 126, sources: 599});
export const EXPECTED_STAGE_B = Object.freeze({completed: 84, documents: 126, sources: 599});
export const EXPECTED_BROWSER = Object.freeze({states: 4, wrappersPerState: 4, relationsPerState: 4, remoteSourcesPerState: 7, nextTopicActions: 0});

export const CANDIDATE_HEAD = 'f2b7b936ccd64c4748f2417937be2a61b55a3e55';
export const EXPECTED_REVIEWED_HEAD = 'e5e339c3666b7b4c17e5c33fd7e7dd0af9103a03';
export const CONTRACT_REVIEWED_HEAD = '1111111111111111111111111111111111111111';
export const STAGE_A_REVIEWED_LOCAL_HEAD = '18d31033309f0f85a5d609beadbe909861f7ec19';
export const STAGE_A_PUBLISHED_HEAD = '3ec39e0711afc2eb4c68d45e9542f63177f956c6';
export const STAGE_A_PRODUCTION_PAGES = Object.freeze({
  workflow: 'Verify and deploy Docusaurus to GitHub Pages',
  runId: 33_183_143_934,
  runUrl: 'https://github.com/sealday/tego-arch/actions/runs/33183143934',
  event: 'push',
  headSha: STAGE_A_PUBLISHED_HEAD,
  status: 'completed',
  conclusion: 'success',
  build: Object.freeze({jobId: 98_889_219_909, status: 'completed', conclusion: 'success'}),
  deploy: Object.freeze({jobId: 98_890_156_580, status: 'completed', conclusion: 'success'}),
});
export const STAGE_A_EVIDENCE_HEAD = 'a4965c28e5a6b8fc2a36cd4f51886ad09371b08c';
export const STAGE_A_EVIDENCE_PAGES = Object.freeze({
  workflow: 'Verify and deploy Docusaurus to GitHub Pages',
  runId: 33_186_492_151,
  runUrl: 'https://github.com/sealday/tego-arch/actions/runs/33186492151',
  event: 'push',
  headSha: STAGE_A_EVIDENCE_HEAD,
  status: 'completed',
  conclusion: 'success',
  build: Object.freeze({jobId: 98_900_728_461, status: 'completed', conclusion: 'success'}),
  deploy: Object.freeze({jobId: 98_901_759_842, status: 'completed', conclusion: 'success'}),
});
export const STAGE_B_PUBLISHED_HEAD = 'e04605ed2b02568289cbfc1b47b1df77e4996d68';
export const STAGE_B_PRODUCTION_PAGES = Object.freeze({
  workflow: 'Verify and deploy Docusaurus to GitHub Pages',
  runId: 33_189_774_344,
  runUrl: 'https://github.com/sealday/tego-arch/actions/runs/33189774344',
  event: 'push',
  headSha: STAGE_B_PUBLISHED_HEAD,
  status: 'completed',
  conclusion: 'success',
  build: Object.freeze({jobId: 98_911_988_885, status: 'completed', conclusion: 'success'}),
  deploy: Object.freeze({jobId: 98_913_062_798, status: 'completed', conclusion: 'success'}),
});
export const FINAL_EVIDENCE_REVIEWED_HEAD = 'd07c44cf362d0f45531d4b67f01e64d0e81556cf';
export const LOCAL_RAW_IDENTITY = Object.freeze({bytes: 42_484, sha256: 'ebb10045c6ef19fd665767dba270697e552d8c1e074d219aa5ccbf972f2813c1'});
export const PRODUCTION_RAW_IDENTITY = Object.freeze({bytes: 45_978, sha256: '99af96e80750b26f4d52a5c785e57907645f4d95464a821a333b9488a38d062b'});
const ARTICLE_IDENTITY = Object.freeze({bytes: 20_625, sha256: '672ab04acd0c11498f25dbc8890f528c4b863c1308d7157774f01a96effe31bf'});
const LEDGER_IDENTITY = Object.freeze({bytes: 1_681_848, sha256: '422b0ad4e4c128618203157864efb6d16dad7059ba97567a7f8dbdf8e87bd085'});
const DRAWIO = 'diagrams/sty-13-space-based-flight-availability.drawio';
const DRAWIO_IDENTITY = Object.freeze({bytes: 22_184, sha256: 'cff8f280c882f0fab92004b7104f42c7fb79440e3390d7b7aa077f4205c62aeb'});
export const STATES = Object.freeze(['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark']);
const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch13.md';
const IMMEDIATE_LOCAL_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-browser.json';
const IMMEDIATE_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch13-stage-a-production-browser.json';
const IMMEDIATE_STAGE_B_RAW = 'docs/reviews/evidence/g009-batch13-stage-b-production-browser.json';
const IMMEDIATE_REVIEW_IDENTITY = Object.freeze({bytes: 14_502, sha256: '688c800ecafcfc3ed66529e2896d49fd247680412f9eba6c5a25da357e8ae44c'});
const IMMEDIATE_RAW_IDENTITIES = Object.freeze([
  Object.freeze({path: IMMEDIATE_LOCAL_RAW, bytes: 17_260, sha256: 'a0de2d5ea069b2af87ad4aa4ef4696a9a22e6ff99ba96b616763262f1814ed38'}),
  Object.freeze({path: IMMEDIATE_PRODUCTION_RAW, bytes: 33_721, sha256: 'a28bb3269f2b7545b7d77f2ec506ce5b1bd737924a5db6945481ee8ec5763560'}),
  Object.freeze({path: IMMEDIATE_STAGE_B_RAW, bytes: 47_997, sha256: '93540ff26f5d7a6fddb2ca5310a838304d04afa6994788fcf1fb8d0b4a6ff958'}),
]);
const IMMEDIATE_BASELINE_IDENTITY = Object.freeze({bytes: 40_108, sha256: '52c9fe9aa36e1ab9c406162c1d34f489ee439058f73f450e973fe496b35902f0'});
const SVG = 'static/img/diagrams/sty-13-space-based-flight-availability.svg';
const SVG_IDENTITY = Object.freeze({bytes: 26_671, sha256: '68e15b5fe4eefd49f5870c672e125d0fa9e001b5177049d43a09d68d2deb56d7'});
const PRODUCTION_ROUTES = Object.freeze([
  Object.freeze({path: '/tego-arch/', bytes: 17_310, sha256: '8964730a5ad1e9fea1927d2a03e066c4b384e450bfacfc658475e02a7e8a1984'}),
  Object.freeze({path: '/tego-arch/styles', bytes: 24_263, sha256: 'e6931ffc44f1bac9ad287ffc354e4488b7432751de3cdce48d17f6f8542ba143'}),
  Object.freeze({path: '/tego-arch/styles/sty-05', bytes: 40_782, sha256: 'ae9ad424ad12405787ce37181cdbc2e6769299c98f993a64395f2835c7225f9e'}),
  Object.freeze({path: '/tego-arch/styles/sty-08', bytes: 50_754, sha256: '2379acb610033fcaab4246707fc4aefedac62ff30e0c973833127bf6989f0a54'}),
  Object.freeze({path: '/tego-arch/styles/sty-13', bytes: 48_992, sha256: 'ceb02edd3a864b0d0306e53605de709a71db02407abf00da194d01d78fdfcb3a'}),
  Object.freeze({path: '/tego-arch/cases', bytes: 53_503, sha256: '5cf1364daac4d9f2e1c1cd0952cb15dc7ff936d38954e4ad01b01f37018202f8'}),
  Object.freeze({path: '/tego-arch/cases/aws-cell-shuffle-sharding', bytes: 55_593, sha256: 'ee80c5a7999f9f81d68d5d2d4e74093ca4ecc13daf46380c5e088c5d8bbe1aad'}),
  Object.freeze({path: '/tego-arch/cases/cloudflare-durable-objects-workerd', bytes: 89_265, sha256: '5d27d31495dd124434e33e5ae34bf9b1e8c0aedde0f97170ceed76065ac7fa85'}),
  Object.freeze({path: '/tego-arch/references', bytes: 23_533, sha256: '4dca33a4a2f8064ebc6e7399b4887defd7d4528aa13aa872852736a4c9288ad4'}),
]);
const STAGE_B_PRODUCTION_ROUTES = Object.freeze([
  Object.freeze({path: '/tego-arch/', bytes: 17_310, sha256: 'e48cc9503404f11c480a77f8a716c0ef76699c60c81ab6223100c48d33f6b4ce'}),
  Object.freeze({path: '/tego-arch/styles', bytes: 24_266, sha256: 'ffb9b1b50d0facb2f1225db8e41fda77f859c43c9538def3ea60e5971cdd53c3'}),
  Object.freeze({path: '/tego-arch/styles/sty-05', bytes: 40_782, sha256: '1e5b08f5596f860e21f94ad2f211a830a0c4d67bf9f11a08cee37dfdf6584e6f'}),
  Object.freeze({path: '/tego-arch/styles/sty-08', bytes: 50_754, sha256: '7a5f16396648ff3dcd8a5921dea0f8613a4baffb07db1e07fee9cb310723265b'}),
  Object.freeze({path: '/tego-arch/styles/sty-13', bytes: 48_992, sha256: '87fa954c7ddab0b19a5ce824f29df643caac1c7c5366f5e87a4767ce4f8f3427'}),
  Object.freeze({path: '/tego-arch/cases', bytes: 53_503, sha256: '56d2cf05f8d768da84433beb145617a383d0465d23326eb2806bfc3babb44574'}),
  Object.freeze({path: '/tego-arch/cases/aws-cell-shuffle-sharding', bytes: 55_593, sha256: '902aa46164fb94ad315a7ae5da34a342ca5e12fc88519492f330c854a789eebd'}),
  Object.freeze({path: '/tego-arch/cases/cloudflare-durable-objects-workerd', bytes: 89_265, sha256: '5b007f197888e08975b590b2b17ef51728604fe375c8c55b9891b8dd42f07e26'}),
  Object.freeze({path: '/tego-arch/references', bytes: 23_533, sha256: '16b443b8bae51971bbd2de849e7de2e75abd4b44e4f0b183e5479027efe4fc45'}),
]);
const PRODUCTION_SVG = Object.freeze({
  path: '/tego-arch/img/diagrams/sty-13-space-based-flight-availability.svg',
  url: 'https://sealday.github.io/tego-arch/img/diagrams/sty-13-space-based-flight-availability.svg',
  status: 200,
  contentType: 'image/svg+xml',
  ...SVG_IDENTITY,
});
const STAGE_B_PRODUCTION_SVG = Object.freeze({...PRODUCTION_SVG});
const WRAPPER_LABELS = Object.freeze([
  'Space-Based Architecture 航班余位亲和分区、主备与恢复边界图，可横向滚动',
  'Space-Based Architecture 与四种相邻方案边界表，可横向滚动',
  '航班余位六类操作执行与一致性责任表，可横向滚动',
  'Space-Based Architecture 六类故障信号、保护动作与恢复门槛表，可横向滚动',
]);
const EXPECTED_WRAPPERS = Object.freeze({
  desktopLight: Object.freeze([[800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0]]),
  desktopDark: Object.freeze([[800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0], [800, 800, 0, 0]]),
  mobileLight: Object.freeze([[358, 800, 0, 40], [358, 358, 0, 0], [358, 358, 0, 0], [358, 358, 0, 0]]),
  mobileDark: Object.freeze([[358, 800, 0, 40], [358, 358, 0, 0], [358, 358, 0, 0], [358, 358, 0, 0]]),
});
const SCREENSHOTS = Object.freeze([
  Object.freeze({state: 'desktopLight', bytes: 150_209, sha256: 'fc8b0ad6d653e334c2350ea310fa715f210365e50368dd7928eea228c91b0e21'}),
  Object.freeze({state: 'desktopDark', bytes: 152_912, sha256: 'e3195faa40063918bf6cda2b31b17271514842e94c3884ca34ff6c668143042a'}),
  Object.freeze({state: 'mobileLight', bytes: 48_808, sha256: '288d7e292ff21e1264d642348d033e2698d1fbe026c75033884ba5b72f34361e'}),
  Object.freeze({state: 'mobileDark', bytes: 48_605, sha256: '5a0b416073be0f3ff81bc2242ee472587ecabc5ac6756229bb0adeb779ea662e'}),
]);
const RELATIONS = Object.freeze([
  Object.freeze({href: '/tego-arch/styles/sty-05', expectedH1: '微服务：用独立部署换取自治，也承担分布式成本'}),
  Object.freeze({href: '/tego-arch/styles/sty-08', expectedH1: 'Actor Model：用逻辑身份、私有状态与消息隔离并发'}),
  Object.freeze({href: '/tego-arch/cases/aws-cell-shuffle-sharding', expectedH1: '单元架构与洗牌分片：把失控智能体限制在可计算的故障半径内'}),
  Object.freeze({href: '/tego-arch/cases/cloudflare-durable-objects-workerd', expectedH1: '把边缘协调收敛到身份寻址的状态单元'}),
]);
const SOURCE_HREFS = Object.freeze([
  'https://docs.gigaspaces.com/16.2/overview/space-based-architecture.html',
  'https://docs.gigaspaces.com/16.2.1/admin/the-sla-overview.html',
  'https://docs.gigaspaces.com/16.2/admin/leader-election-availability-biased.html',
  'https://docs.gigaspaces.com/16.2/admin/tuning-proxy-connectivity.html',
  'https://docs.oracle.com/en/middleware/fusion-middleware/coherence/12.2.1.4/develop-applications/introduction-coherence.html',
  'https://docs.oracle.com/middleware/1221/coherence/develop-applications/cache_back.htm',
  'https://www.gigaspaces.com/case_studies/booking-and-flight-availability',
]);

const rootUrl = new URL('../', import.meta.url);
const required = (path, encoding) => readFile(new URL(path, rootUrl), encoding);
const reviewedArtifact = (path) => execFileSync(
  'git',
  ['show', `${EXPECTED_REVIEWED_HEAD}:${path}`],
  {cwd: fileURLToPath(rootUrl), maxBuffer: 4 * 1024 * 1024},
);
const historicalArtifact = (head, path, encoding) => execFileSync(
  'git',
  ['show', `${head}:${path}`],
  {cwd: fileURLToPath(rootUrl), encoding, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']},
);
function optionalHistoricalArtifact(head, path, encoding) {
  try { return historicalArtifact(head, path, encoding); } catch (error) { if (error?.status === 128) return undefined; throw error; }
}
async function optional(path, encoding) {
  try { return await required(path, encoding); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; }
}
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
function exactKeys(value, keys, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} is an object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} exact keys`);
}
function currentReleaseBaseline(source) {
  const prefix = '- **当前发布基线：** ';
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith(prefix));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice(prefix.length);
}
const IMMEDIATE_HISTORY_MARKER = '此前 G009 Batch 13 历史完成基线为：';
const BATCH13_PRIOR_HISTORY_MARKER = '此前 G009 Batch 12 历史完成基线为：';
function immediateBatch13Baseline(source) {
  const baseline = currentReleaseBaseline(source);
  const markerIndex = baseline.indexOf(IMMEDIATE_HISTORY_MARKER);
  return markerIndex === -1 ? baseline : baseline.slice(markerIndex + IMMEDIATE_HISTORY_MARKER.length);
}
function batch13CurrentPrefix(source) {
  const history = immediateBatch13Baseline(source);
  const markerIndex = history.indexOf(BATCH13_PRIOR_HISTORY_MARKER);
  assert.notEqual(markerIndex, -1, 'Batch 13 baseline contains the exact Batch 12 history marker');
  return history.slice(0, markerIndex);
}
function markdownSection(source, heading) {
  const marker = `## ${heading}\n\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${heading} section exists`);
  const contentStart = start + marker.length;
  const end = source.indexOf('\n## ', contentStart);
  return source.slice(contentStart, end === -1 ? source.length : end).trim();
}

const STY13_CLOSURE_LINE = `- [x] **STY-13 P2｜Space-Based Architecture**：仅在找到足够一手机制与案例后启动。Stage A 关闭证据：2026-08-28 review，reviewed local commit [\`${STAGE_A_REVIEWED_LOCAL_HEAD}\`](https://github.com/sealday/tego-arch/commit/${STAGE_A_REVIEWED_LOCAL_HEAD})；implementation commit [\`${STAGE_A_PUBLISHED_HEAD}\`](https://github.com/sealday/tego-arch/commit/${STAGE_A_PUBLISHED_HEAD})，Pages run [\`${STAGE_A_PRODUCTION_PAGES.runId}\`](${STAGE_A_PRODUCTION_PAGES.runUrl})，build job \`${STAGE_A_PRODUCTION_PAGES.build.jobId}\`、deploy job \`${STAGE_A_PRODUCTION_PAGES.deploy.jobId}\`；evidence commit [\`${STAGE_A_EVIDENCE_HEAD}\`](https://github.com/sealday/tego-arch/commit/${STAGE_A_EVIDENCE_HEAD})，Pages run [\`${STAGE_A_EVIDENCE_PAGES.runId}\`](${STAGE_A_EVIDENCE_PAGES.runUrl})，build job \`${STAGE_A_EVIDENCE_PAGES.build.jobId}\`、deploy job \`${STAGE_A_EVIDENCE_PAGES.deploy.jobId}\`；production HTML routes \`9/9\`，live route \`/styles/sty-13\` 与 \`/img/diagrams/sty-13-space-based-flight-availability.svg\` 均为 HTTP 200，live SVG \`${SVG_IDENTITY.bytes.toLocaleString('en-US')}\` bytes / SHA-256 \`${SVG_IDENTITY.sha256}\` 与 reviewed asset exact match，Stage A production Browser raw \`${PRODUCTION_RAW_IDENTITY.bytes.toLocaleString('en-US')}\` bytes / SHA-256 \`${PRODUCTION_RAW_IDENTITY.sha256}\`，functional verdict PASS；screenshot evidence PASS / ACCEPTED（\`4/4\`）。`;

export const STAGE_B_REVIEWED_HEAD = '999d24b0262bcbe583a0a807835c3e81f1b0960d';
const READY_STAGE_B_REVIEW_LINES = Object.freeze([
  '- Closure date: `2026-08-28`.',
  `- Exact reviewed local Stage A head: \`${STAGE_A_REVIEWED_LOCAL_HEAD}\`.`,
  `- Exact Stage A implementation head: \`${STAGE_A_PUBLISHED_HEAD}\`.`,
  `- Exact Stage A Pages run: \`${STAGE_A_PRODUCTION_PAGES.runId}\`; workflow: \`${STAGE_A_PRODUCTION_PAGES.status} / ${STAGE_A_PRODUCTION_PAGES.conclusion}\`; build job: \`${STAGE_A_PRODUCTION_PAGES.build.jobId}\`; deploy job: \`${STAGE_A_PRODUCTION_PAGES.deploy.jobId}\`.`,
  `- Exact Stage A evidence head: \`${STAGE_A_EVIDENCE_HEAD}\`.`,
  `- Exact Stage A evidence Pages run: \`${STAGE_A_EVIDENCE_PAGES.runId}\`; workflow: \`${STAGE_A_EVIDENCE_PAGES.status} / ${STAGE_A_EVIDENCE_PAGES.conclusion}\`; build job: \`${STAGE_A_EVIDENCE_PAGES.build.jobId}\`; deploy job: \`${STAGE_A_EVIDENCE_PAGES.deploy.jobId}\`.`,
  '- Required production HTML routes: `9/9`; every route returned `200` with `text/html; charset=utf-8`.',
  `- Reviewed production SVG: HTTP \`200\`; MIME \`image/svg+xml\`; \`${SVG_IDENTITY.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${SVG_IDENTITY.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
  `- Stage A production Browser raw: \`${PRODUCTION_RAW}\`; \`${PRODUCTION_RAW_IDENTITY.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_IDENTITY.sha256}\`.`,
  '- Functional production QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation checks `16/16`; exact source checks `28/28`; STY-14 actionable count `0`; diagnostics complete and empty.',
  '- Stage A production screenshot evidence: `PASS / ACCEPTED`; accepted `4/4`; fallback used: `false`.',
  '- Projection: `83 completed topics / 126 content documents / 599 governed sources`.',
  '- STY-13 target: `published / complete`.',
  '- STY-14 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.',
  `- Immediate immutable history: complete Batch 13 review SHA-256 \`${IMMEDIATE_REVIEW_IDENTITY.sha256}\`; local raw SHA-256 \`${IMMEDIATE_RAW_IDENTITIES[0].sha256}\`; Stage A production raw SHA-256 \`${IMMEDIATE_RAW_IDENTITIES[1].sha256}\`; Stage B production raw SHA-256 \`${IMMEDIATE_RAW_IDENTITIES[2].sha256}\`; release-baseline SHA-256 \`${IMMEDIATE_BASELINE_IDENTITY.sha256}\`.`,
  `- Exact Stage B candidate tree identity: \`${STAGE_B_REVIEWED_HEAD}\`.`,
  `- Independent Stage B code/spec/security review: \`READY / APPROVE\`; findings: \`0\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`,
  `- Independent Stage B content/evidence/rights review: \`CONTENT READY\`; rights: \`PASS\`; findings: \`0\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`,
  `- Independent Stage B architecture/invariant review: \`CLEAR / READY\`; blockers: \`0\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`,
  '- Review finding totals: Critical `0`; Important `0`; Minor `0`; ⚠️ `0`.',
  '- Final Stage B review judgment: `READY`.',
  '- Stage B scope boundary: `STAGE_B`.',
  '- Stage B deployment status: `PENDING / NOT_RUN`.',
  '- Stage B production raw: `NOT_RECORDED`.',
]);

function assertReadyStageBCandidate(source = review) {
  assert.equal(markdownSection(source, 'Stage B closure candidate'), READY_STAGE_B_REVIEW_LINES.join('\n'), 'exact independently reviewed Stage B candidate section');
  assert.equal(source.split('## Stage B closure candidate').length - 1, 1, 'one Stage B candidate section');
}

function assertImmediateBatch13History(reviewBytes = immediateReview, rawBytes = immediateRaws, backlogSource = backlog) {
  assert.equal(reviewBytes.length, IMMEDIATE_REVIEW_IDENTITY.bytes, 'complete immediate Batch 13 review bytes');
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_IDENTITY.sha256, 'complete immediate Batch 13 review SHA-256');
  assert.equal(rawBytes.length, IMMEDIATE_RAW_IDENTITIES.length, 'complete immediate Batch 13 raw set');
  for (const [index, identity] of IMMEDIATE_RAW_IDENTITIES.entries()) {
    assert.equal(rawBytes[index].length, identity.bytes, `${identity.path} exact bytes`);
    assert.equal(sha256(rawBytes[index]), identity.sha256, `${identity.path} exact SHA-256`);
  }
  const baseline = immediateBatch13Baseline(backlogSource);
  assert.equal(Buffer.byteLength(baseline), IMMEDIATE_BASELINE_IDENTITY.bytes, 'complete immediate Batch 13 backlog baseline bytes');
  assert.equal(sha256(baseline), IMMEDIATE_BASELINE_IDENTITY.sha256, 'complete immediate Batch 13 backlog baseline SHA-256');
  assert.match(baseline, /^2026-08-27 G009 Batch 13 已完成 STY-12/u);
  assert.match(baseline, /STY-12 为 published\/complete，STY-13 为 unpublished\/pending\/nonactionable/u);
}

function assertDiagnosticPage(page, expectedScope, label) {
  exactKeys(page, ['scope', 'afterSequence', 'cursor', 'count', 'hasMore', 'truncated'], label);
  assert.equal(page.scope, expectedScope, `${label} exact scope`);
  assert.ok(Number.isInteger(page.afterSequence) && page.afterSequence >= 0, `${label} non-negative request cursor`);
  assert.ok(Number.isInteger(page.cursor) && page.cursor >= page.afterSequence, `${label} monotonic response cursor`);
  assert.equal(page.count, 0, `${label} no accepted Runtime/Log events`);
  assert.equal(page.hasMore, false, `${label} terminal page`);
  assert.equal(page.truncated, false, `${label} complete page`);
}
function expectedScopes(stateName) {
  return [
    `${stateName}:prepare`,
    ...WRAPPER_LABELS.map((_, index) => `${stateName}:interaction${index}`),
    ...RELATIONS.flatMap((_, index) => [`${stateName}:relation${index}:destination`, `${stateName}:relation${index}:return`]),
    `${stateName}:screenshot`,
  ];
}
const ALL_STATE_SCOPES = Object.freeze(STATES.flatMap(expectedScopes));

function assertScreenshotEvidence(value, expectedIdentities = SCREENSHOTS) {
  exactKeys(value, ['status', 'attempted', 'accepted', 'fallbackUsed', 'storage', 'attempts'], 'screenshot evidence');
  assert.equal(value.fallbackUsed, false, 'no substituted screenshot surface');
  assert.match(value.storage, /Codex in-app Browser/u, 'in-app Browser storage identity');
  assert.ok(Number.isInteger(value.attempted) && value.attempted >= 0 && value.attempted <= STATES.length, 'honest screenshot attempt count');
  assert.equal(value.attempts.length, value.attempted, 'every screenshot attempt is recorded');
  if (value.status === 'PASS / ACCEPTED') {
    assert.equal(value.attempted, STATES.length, 'all four screenshots attempted');
    assert.equal(value.accepted, STATES.length, 'all four screenshots accepted');
  } else {
    assert.equal(value.status, 'BLOCKED / NOT_ACCEPTED', 'only the explicit blocked screenshot status is allowed');
    assert.equal(value.accepted, 0, 'blocked captures are not accepted');
  }
  for (const [index, attempt] of value.attempts.entries()) {
    exactKeys(attempt, ['state', 'status', 'bytes', 'sha256', 'reason'], `screenshot attempt ${index}`);
    assert.equal(attempt.state, STATES[index], `screenshot attempt ${index} state order`);
    assert.ok(typeof attempt.reason === 'string' && attempt.reason.length > 0, `screenshot attempt ${index} reason`);
    if (value.status === 'PASS / ACCEPTED') {
      assert.equal(attempt.status, 'CAPTURED_ACCEPTED', `screenshot attempt ${index} accepted`);
      assert.ok(Number.isInteger(attempt.bytes) && attempt.bytes > 0, `screenshot attempt ${index} bytes`);
      assert.match(attempt.sha256, /^[0-9a-f]{64}$/u, `screenshot attempt ${index} SHA-256`);
      if (expectedIdentities) {
        assert.deepEqual({state: attempt.state, bytes: attempt.bytes, sha256: attempt.sha256}, expectedIdentities[index], `screenshot attempt ${index} exact byte identity`);
      }
    } else {
      assert.match(attempt.status, /^(?:CAPTURE_BLOCKED|CAPTURED_NOT_ACCEPTED)$/u, `screenshot attempt ${index} honest rejection`);
      assert.equal(attempt.bytes, null, `screenshot attempt ${index} has no trusted byte identity`);
      assert.equal(attempt.sha256, null, `screenshot attempt ${index} has no trusted hash identity`);
    }
  }
}

function assertTask5NestedEvidence(value, label, screenshotIdentities) {
  assert.deepEqual(value.stateOrder, STATES, 'exact four-state order');
  assert.equal(value.collection.diagnosticContinuity.length, ALL_STATE_SCOPES.length + 1, 'every required action plus whole-session terminal is paged');
  let previousCursor;
  for (const [index, scope] of [...ALL_STATE_SCOPES, 'terminal'].entries()) {
    const page = value.collection.diagnosticContinuity[index];
    assertDiagnosticPage(page, scope, `${label} collection diagnostic page ${index}`);
    if (previousCursor !== undefined) assert.equal(page.afterSequence, previousCursor, `${label} collection diagnostic page ${index} continuous cursor`);
    previousCursor = page.cursor;
  }

  exactKeys(value.states, STATES, `${label} four Browser states`);
  let offset = 0;
  for (const stateName of STATES) {
    const state = value.states[stateName];
    const desktop = stateName.startsWith('desktop');
    exactKeys(state, ['theme', 'viewport', 'documentGeometry', 'wrappers', 'relations', 'sources', 'sty14ActionableCount', 'logs', 'runtimeEvents', 'diagnostics'], `${stateName} state`);
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark', `${stateName} theme`);
    exactKeys(state.viewport, ['width', 'height'], `${stateName} viewport`);
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844}, `${stateName} exact viewport`);
    exactKeys(state.documentGeometry, ['clientWidth', 'scrollWidth'], `${stateName} document geometry`);
    assert.deepEqual(state.documentGeometry, desktop ? {clientWidth: 1440, scrollWidth: 1440} : {clientWidth: 390, scrollWidth: 390}, `${stateName} no document overflow`);
    assert.equal(state.wrappers.length, EXPECTED_BROWSER.wrappersPerState, `${stateName} wrapper count`);
    assert.deepEqual(state.wrappers.map(({label}) => label), WRAPPER_LABELS, `${stateName} wrapper order`);
    for (const [index, wrapper] of state.wrappers.entries()) {
      exactKeys(wrapper, ['label', 'clientWidth', 'scrollWidth', 'before', 'after', 'focus', 'focusVisible', 'outlineWidth'], `${stateName} wrapper ${index}`);
      assert.ok(Number.isInteger(wrapper.clientWidth) && wrapper.clientWidth > 0, `${stateName} wrapper ${index} client width`);
      assert.ok(Number.isInteger(wrapper.scrollWidth) && wrapper.scrollWidth >= wrapper.clientWidth, `${stateName} wrapper ${index} contained overflow`);
      assert.ok(Number.isFinite(wrapper.before) && wrapper.before >= 0, `${stateName} wrapper ${index} before scroll`);
      assert.ok(Number.isFinite(wrapper.after) && wrapper.after >= wrapper.before, `${stateName} wrapper ${index} after scroll`);
      assert.equal(wrapper.focus, true, `${stateName} wrapper ${index} focus`);
      assert.equal(wrapper.focusVisible, true, `${stateName} wrapper ${index} focus-visible`);
      assert.equal(wrapper.outlineWidth, '3px', `${stateName} wrapper ${index} outline`);
      assert.ok(wrapper.after - wrapper.before === 0 || wrapper.after - wrapper.before === 40, `${stateName} wrapper ${index} honest ArrowRight result`);
      assert.deepEqual(
        [wrapper.clientWidth, wrapper.scrollWidth, wrapper.before, wrapper.after],
        EXPECTED_WRAPPERS[stateName][index],
        `${stateName} wrapper ${index} exact geometry and interaction`,
      );
    }
    assert.equal(state.relations.length, EXPECTED_BROWSER.relationsPerState, `${stateName} relation count`);
    for (const [index, relation] of state.relations.entries()) {
      exactKeys(relation, ['href', 'expectedH1', 'h1', 'visibleCount', 'returnedToArticle'], `${stateName} relation ${index}`);
      assert.deepEqual(relation, {...RELATIONS[index], h1: RELATIONS[index].expectedH1, visibleCount: 1, returnedToArticle: true}, `${stateName} relation ${index} destination/H1/return`);
    }
    assert.equal(state.sources.length, EXPECTED_BROWSER.remoteSourcesPerState, `${stateName} remote source count`);
    for (const [index, source] of state.sources.entries()) {
      exactKeys(source, ['href', 'target', 'rel'], `${stateName} source ${index}`);
      assert.deepEqual(source, {href: SOURCE_HREFS[index], target: '_blank', rel: 'noopener noreferrer'}, `${stateName} source ${index} identity`);
    }
    assert.equal(state.sty14ActionableCount, EXPECTED_BROWSER.nextTopicActions, `${stateName} STY-14 non-actionable`);
    assert.deepEqual(state.logs, [], `${stateName} warning/error logs`);
    assert.deepEqual(state.runtimeEvents, [], `${stateName} Runtime/Log events`);
    const scopes = expectedScopes(stateName);
    assert.ok(Array.isArray(state.diagnostics), `${stateName} diagnostics exact page array`);
    assert.deepEqual(Object.keys(state.diagnostics), scopes.map((_, index) => String(index)), `${stateName} diagnostics has no additive array properties`);
    assert.equal(state.diagnostics.length, scopes.length, `${stateName} deliberate diagnostic page count`);
    assert.deepEqual(state.diagnostics, value.collection.diagnosticContinuity.slice(offset, offset + scopes.length), `${stateName} pages bind continuous collection pages`);
    offset += scopes.length;
  }
  exactKeys(value.functionalSummary, ['status', 'states', 'wrapperInteractions', 'relationObservations', 'sourceObservations', 'sty14ActionableTotal', 'warningErrorLogs', 'runtimeAndLogEvents', 'diagnosticPages', 'diagnosticPagesTerminal', 'diagnosticsTruncated'], 'functional summary');
  assert.deepEqual(value.functionalSummary, {
    status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 16, sourceObservations: 28,
    sty14ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPages: ALL_STATE_SCOPES.length + 1,
    diagnosticPagesTerminal: true, diagnosticsTruncated: false,
  });
  assertScreenshotEvidence(value.screenshotEvidence, screenshotIdentities);
}

function assertLocalEvidence(value) {
  assert.ok(value, `${LOCAL_RAW} is missing; capture real four-state in-app Browser evidence`);
  exactKeys(value, ['candidateHead', 'stateOrder', 'collection', 'states', 'functionalSummary', 'screenshotEvidence'], 'local evidence');
  assert.equal(value.candidateHead, CANDIDATE_HEAD, 'exact clean implementation head');
  exactKeys(value.collection, ['browser', 'fresh', 'servedUrl', 'build', 'navigationMethod', 'observedSvgAsset', 'diagnosticContinuity'], 'collection');
  assert.equal(value.collection.browser, 'Codex in-app Browser only', 'no substituted browser');
  assert.equal(value.collection.fresh, true, 'fresh collection');
  assert.match(value.collection.servedUrl, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/tego-arch\/styles\/sty-13$/u, 'exact local article URL');
  assert.equal(value.collection.build, `local build from exact clean implementation head ${CANDIDATE_HEAD}`);
  assert.equal(value.collection.navigationMethod, 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.');
  exactKeys(value.collection.observedSvgAsset, ['source', 'contentType', 'bytes', 'sha256', 'viewBox'], 'observed SVG asset');
  assert.deepEqual(value.collection.observedSvgAsset, {
    source: 'local Browser pageAssets bundle', contentType: 'image/svg+xml', ...SVG_IDENTITY, viewBox: '0 0 2400 3600',
  }, 'exact observed SVG identity');
  assertTask5NestedEvidence(value, 'local', SCREENSHOTS);
}

function assertStageAProductionEvidence(value) {
  assert.ok(value, `${PRODUCTION_RAW} is missing; capture fresh Stage A production in-app Browser evidence`);
  exactKeys(value, ['implementationHead', 'pages', 'probes', 'stateOrder', 'collection', 'states', 'functionalSummary', 'screenshotEvidence'], 'Stage A production evidence');
  assert.equal(value.implementationHead, STAGE_A_PUBLISHED_HEAD, 'exact published Stage A head');
  exactKeys(value.pages, ['workflow', 'runId', 'runUrl', 'event', 'headSha', 'status', 'conclusion', 'build', 'deploy'], 'production Pages run');
  exactKeys(value.pages.build, ['jobId', 'status', 'conclusion'], 'production build job');
  exactKeys(value.pages.deploy, ['jobId', 'status', 'conclusion'], 'production deploy job');
  assert.deepEqual(value.pages, STAGE_A_PRODUCTION_PAGES, 'exact successful Pages run and jobs');

  exactKeys(value.probes, ['routes', 'svg'], 'production probes');
  assert.ok(Array.isArray(value.probes.routes), 'production routes are an exact array');
  assert.deepEqual(Object.keys(value.probes.routes), PRODUCTION_ROUTES.map((_, index) => String(index)), 'production routes have no additive array properties');
  assert.equal(value.probes.routes.length, PRODUCTION_ROUTES.length, 'nine production HTML routes');
  for (const [index, route] of value.probes.routes.entries()) {
    exactKeys(route, ['path', 'status', 'contentType', 'bytes', 'sha256'], `production route ${index}`);
    assert.deepEqual(route, {...PRODUCTION_ROUTES[index], status: 200, contentType: 'text/html; charset=utf-8'}, `exact production route ${index}`);
  }
  exactKeys(value.probes.svg, ['path', 'url', 'status', 'contentType', 'bytes', 'sha256'], 'production SVG probe');
  assert.deepEqual(value.probes.svg, PRODUCTION_SVG, 'canonical production SVG is the exact reviewed asset');

  exactKeys(value.collection, ['browser', 'fresh', 'session', 'servedUrl', 'build', 'navigationMethod', 'observedSvgAsset', 'diagnosticContinuity'], 'production collection');
  assert.equal(value.collection.browser, 'Codex in-app Browser only', 'no substituted production browser');
  assert.equal(value.collection.fresh, true, 'fresh production collection');
  assert.equal(value.collection.session, 'fresh Stage A production session; local Stage A tab and evidence were not reused', 'fresh production session boundary');
  assert.equal(value.collection.servedUrl, 'https://sealday.github.io/tego-arch/styles/sty-13', 'exact production article URL');
  assert.equal(value.collection.build, `GitHub Pages exact Stage A head ${STAGE_A_PUBLISHED_HEAD}; push run ${STAGE_A_PRODUCTION_PAGES.runId}; build job ${STAGE_A_PRODUCTION_PAGES.build.jobId}; deploy job ${STAGE_A_PRODUCTION_PAGES.deploy.jobId}`, 'exact production build identity');
  assert.equal(value.collection.navigationMethod, 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.', 'honest production navigation method');
  exactKeys(value.collection.observedSvgAsset, ['source', 'inventoryId', 'assetId', 'contentType', 'bytes', 'sha256', 'viewBox', 'requested', 'downloaded', 'failed'], 'production PageAssets SVG bundle');
  assert.equal(value.collection.observedSvgAsset.source, 'production Browser pageAssets bundle', 'production PageAssets source');
  assert.match(value.collection.observedSvgAsset.inventoryId, /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u, 'production PageAssets inventory ID');
  assert.match(value.collection.observedSvgAsset.assetId, /^[0-9a-f]{16}$/u, 'production PageAssets asset ID');
  assert.deepEqual({
    contentType: value.collection.observedSvgAsset.contentType,
    bytes: value.collection.observedSvgAsset.bytes,
    sha256: value.collection.observedSvgAsset.sha256,
    viewBox: value.collection.observedSvgAsset.viewBox,
    requested: value.collection.observedSvgAsset.requested,
    downloaded: value.collection.observedSvgAsset.downloaded,
    failed: value.collection.observedSvgAsset.failed,
  }, {
    contentType: 'image/svg+xml', ...SVG_IDENTITY, viewBox: '0 0 2400 3600', requested: 1, downloaded: 1, failed: 0,
  }, 'exact production PageAssets SVG bundle identity');

  assertTask5NestedEvidence(value, 'production', null);
}

function assertStageBProductionEvidence(value) {
  assert.ok(value, `${STAGE_B_PRODUCTION_RAW} is missing; capture fresh Stage B production in-app Browser evidence`);
  exactKeys(value, ['implementationHead', 'pages', 'probes', 'stateOrder', 'collection', 'states', 'functionalSummary', 'screenshotEvidence'], 'Stage B production evidence');
  assert.equal(value.implementationHead, STAGE_B_PUBLISHED_HEAD, 'exact published Stage B head');
  exactKeys(value.pages, ['workflow', 'runId', 'runUrl', 'event', 'headSha', 'status', 'conclusion', 'build', 'deploy'], 'Stage B Pages run');
  exactKeys(value.pages.build, ['jobId', 'status', 'conclusion'], 'Stage B build job');
  exactKeys(value.pages.deploy, ['jobId', 'status', 'conclusion'], 'Stage B deploy job');
  assert.deepEqual(value.pages, STAGE_B_PRODUCTION_PAGES, 'exact successful Stage B Pages run and jobs');

  exactKeys(value.probes, ['routes', 'svg'], 'Stage B production probes');
  assert.ok(Array.isArray(value.probes.routes), 'Stage B production routes are an exact array');
  assert.deepEqual(Object.keys(value.probes.routes), STAGE_B_PRODUCTION_ROUTES.map((_, index) => String(index)), 'Stage B production routes have no additive array properties');
  assert.equal(value.probes.routes.length, STAGE_B_PRODUCTION_ROUTES.length, 'nine Stage B production HTML routes');
  for (const [index, route] of value.probes.routes.entries()) {
    exactKeys(route, ['path', 'status', 'contentType', 'bytes', 'sha256'], `Stage B production route ${index}`);
    assert.deepEqual(route, {...STAGE_B_PRODUCTION_ROUTES[index], status: 200, contentType: 'text/html; charset=utf-8'}, `exact Stage B production route ${index}`);
  }
  exactKeys(value.probes.svg, ['path', 'url', 'status', 'contentType', 'bytes', 'sha256'], 'Stage B production SVG probe');
  assert.deepEqual(value.probes.svg, STAGE_B_PRODUCTION_SVG, 'Stage B canonical production SVG is the exact reviewed asset');

  exactKeys(value.collection, ['browser', 'fresh', 'session', 'servedUrl', 'build', 'navigationMethod', 'observedSvgAsset', 'diagnosticContinuity'], 'Stage B production collection');
  assert.equal(value.collection.browser, 'Codex in-app Browser only', 'no substituted Stage B production browser');
  assert.equal(value.collection.fresh, true, 'fresh Stage B production collection');
  assert.equal(value.collection.session, 'fresh Stage B production session; Stage A and pre-deployment Stage B tabs and evidence were not reused', 'fresh Stage B production session boundary');
  assert.equal(value.collection.servedUrl, 'https://sealday.github.io/tego-arch/styles/sty-13', 'exact Stage B production article URL');
  assert.equal(value.collection.build, `GitHub Pages exact Stage B head ${STAGE_B_PUBLISHED_HEAD}; push run ${STAGE_B_PRODUCTION_PAGES.runId}; build job ${STAGE_B_PRODUCTION_PAGES.build.jobId}; deploy job ${STAGE_B_PRODUCTION_PAGES.deploy.jobId}`, 'exact Stage B production build identity');
  assert.equal(value.collection.navigationMethod, 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.', 'honest Stage B production navigation method');
  exactKeys(value.collection.observedSvgAsset, ['source', 'inventoryId', 'assetId', 'contentType', 'bytes', 'sha256', 'viewBox', 'requested', 'downloaded', 'failed'], 'Stage B production PageAssets SVG bundle');
  assert.equal(value.collection.observedSvgAsset.source, 'production Browser pageAssets bundle', 'Stage B production PageAssets source');
  assert.match(value.collection.observedSvgAsset.inventoryId, /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u, 'Stage B production PageAssets inventory ID');
  assert.match(value.collection.observedSvgAsset.assetId, /^[0-9a-f]{16}$/u, 'Stage B production PageAssets asset ID');
  assert.deepEqual({
    contentType: value.collection.observedSvgAsset.contentType,
    bytes: value.collection.observedSvgAsset.bytes,
    sha256: value.collection.observedSvgAsset.sha256,
    viewBox: value.collection.observedSvgAsset.viewBox,
    requested: value.collection.observedSvgAsset.requested,
    downloaded: value.collection.observedSvgAsset.downloaded,
    failed: value.collection.observedSvgAsset.failed,
  }, {
    contentType: 'image/svg+xml', ...SVG_IDENTITY, viewBox: '0 0 2400 3600', requested: 1, downloaded: 1, failed: 0,
  }, 'exact Stage B production PageAssets SVG bundle identity');

  assertTask5NestedEvidence(value, 'Stage B production', null);
}

const PRODUCTION_REVIEW_HEADING = 'Stage A production publication';
const PRODUCTION_REVIEW_MARKER = `\n## ${PRODUCTION_REVIEW_HEADING}\n\n`;
const STAGE_B_REVIEW_HEADING = 'Stage B closure candidate';
const STAGE_B_REVIEW_MARKER = `\n## ${STAGE_B_REVIEW_HEADING}\n\n`;
const FINAL_STAGE_B_REVIEW_HEADING = 'Stage B production recovery candidate';
const FINAL_STAGE_B_REVIEW_MARKER = `\n## ${FINAL_STAGE_B_REVIEW_HEADING}\n\n`;
function reviewBeforeProductionCheckpoint(source) {
  const start = source.indexOf(PRODUCTION_REVIEW_MARKER);
  if (start === -1) return source;
  assert.equal(source.indexOf(PRODUCTION_REVIEW_MARKER, start + PRODUCTION_REVIEW_MARKER.length), -1, 'one Stage A production publication section');
  return source.slice(0, start);
}
function reviewBeforeStageBCandidate(source) {
  const start = source.indexOf(STAGE_B_REVIEW_MARKER);
  if (start === -1) return source;
  assert.equal(source.indexOf(STAGE_B_REVIEW_MARKER, start + STAGE_B_REVIEW_MARKER.length), -1, 'one Stage B closure candidate section');
  return source.slice(0, start);
}
function reviewBeforeFinalStageBCandidate(source) {
  const start = source.indexOf(FINAL_STAGE_B_REVIEW_MARKER);
  if (start === -1) return source;
  assert.equal(source.indexOf(FINAL_STAGE_B_REVIEW_MARKER, start + FINAL_STAGE_B_REVIEW_MARKER.length), -1, 'one Stage B production recovery candidate section');
  return source.slice(0, start);
}

const REVIEW_HEADING_SCHEMA = Object.freeze([
  [1, 'G009 Batch 14 Stage A Review'],
  [2, 'Stage A projection'],
  [2, 'Artifact identities'],
  [2, 'Immutable immediate history'],
  [2, 'Local in-app Browser QA'],
  [2, 'Independent review checkpoint'],
  [2, 'Review requests'],
  [3, 'Code / spec / security'],
  [3, 'Content / evidence / rights'],
  [3, 'Architecture / invariant'],
]);

function readyCheckpointLines(expectedCandidateHead) {
  return [
    `- Exact reviewed candidate head: \`${expectedCandidateHead}\`.`,
    `- Independent code/spec/security review: \`READY / APPROVE\`; findings: \`0\`; exact head: \`${expectedCandidateHead}\`.`,
    `- Independent content/evidence/rights review: \`CONTENT READY\`; rights: \`PASS\`; findings: \`0\`; exact head: \`${expectedCandidateHead}\`.`,
    `- Independent architecture/invariant review: \`CLEAR / READY\`; blockers: \`0\`; exact head: \`${expectedCandidateHead}\`.`,
    '- Review finding totals: Critical `0`; Important `0`; Minor `0`; ⚠️ `0`.',
    '- Final Stage A review judgment: `READY`.',
    '- Scope boundary: `STAGE_A_ONLY`.',
    '- Deployment status at this checkpoint: `NOT_RUN`.',
  ];
}

const PLACEHOLDER_CHECKPOINT_LINES = Object.freeze([
  '- Exact reviewed candidate head: `UNBOUND — controller must create and bind the exact post-evidence candidate head`.',
  '- Independent code/spec/security review: `UNBOUND — controller must assign a read-only reviewer`.',
  '- Independent content/evidence/rights review: `UNBOUND — controller must assign a different read-only reviewer`.',
  '- Independent architecture/invariant review: `UNBOUND — controller must assign a third read-only reviewer`.',
  '- Review finding totals: `UNBOUND`.',
  '- Final Stage A review judgment: `NOT_RECORDED`.',
  '- Scope boundary: `STAGE_A_ONLY`.',
  '- Deployment status at this checkpoint: `NOT_RUN`.',
]);

function expectedReviewSource(checkpointLines, finalParagraph) {
  const screenshotRows = SCREENSHOTS.map(({state, bytes, sha256: hash}) => `| \`${state}\` | ${bytes.toLocaleString('en-US')} | \`${hash}\` | \`CAPTURED_ACCEPTED\` |`).join('\n');
  return `# G009 Batch 14 Stage A Review

## Stage A projection

- Projection: \`65 completed topics / 109 content documents / 573 governed sources\`.
- STY-13: \`published / pending\`.
- STY-14: \`unpublished / pending / non-actionable\`; actionable route count: \`0\`.
- Exact clean implementation head: \`${CANDIDATE_HEAD}\`.
- This is a factual Stage A evidence candidate only. It does not close the backlog, claim deployment, or supply any independent verdict.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| \`${ARTICLE}\` | ${ARTICLE_IDENTITY.bytes.toLocaleString('en-US')} | \`${ARTICLE_IDENTITY.sha256}\` |
| \`data/source-ledger.json\` | ${LEDGER_IDENTITY.bytes.toLocaleString('en-US')} | \`${LEDGER_IDENTITY.sha256}\` |
| \`${DRAWIO}\` | ${DRAWIO_IDENTITY.bytes.toLocaleString('en-US')} | \`${DRAWIO_IDENTITY.sha256}\` |
| \`${SVG}\` | ${SVG_IDENTITY.bytes.toLocaleString('en-US')} | \`${SVG_IDENTITY.sha256}\` |
| \`${LOCAL_RAW}\` | ${LOCAL_RAW_IDENTITY.bytes.toLocaleString('en-US')} | \`${LOCAL_RAW_IDENTITY.sha256}\` |

- Governed STY-13 sources: \`8\`; remote anchors per state: \`7\`; original diagram rights remain governed separately.
- The Browser-observed SVG PageAssets bundle is an exact byte match for the reviewed SVG.

## Immutable immediate history

- Complete immediate Batch 13 review SHA-256: \`${IMMEDIATE_REVIEW_IDENTITY.sha256}\`.
- Complete immediate Batch 13 local raw SHA-256: \`${IMMEDIATE_RAW_IDENTITIES[0].sha256}\`.
- Complete immediate Batch 13 Stage A production raw SHA-256: \`${IMMEDIATE_RAW_IDENTITIES[1].sha256}\`.
- Complete immediate Batch 13 Stage B production raw SHA-256: \`${IMMEDIATE_RAW_IDENTITIES[2].sha256}\`.
- Complete immediate Batch 13 release-baseline SHA-256: \`${IMMEDIATE_BASELINE_IDENTITY.sha256}\`.
- The validator freezes the complete review, all three raw artifacts, and the complete \`40,108\`-byte current release-baseline suffix; no historical literal is weakened.

## Local in-app Browser QA

- Exact local URL: \`http://127.0.0.1:4173/tego-arch/styles/sty-13\`.
- Raw Browser JSON: \`${LOCAL_RAW}\`; bytes: \`${LOCAL_RAW_IDENTITY.bytes.toLocaleString('en-US')}\`; SHA-256: \`${LOCAL_RAW_IDENTITY.sha256}\`.
- Browser surface: \`Codex in-app Browser only\`; fallback used: \`false\`.
- Functional Browser QA: \`PASS\`; states \`4/4\`; wrapper interactions \`16/16\`; relation href/H1/return observations \`16/16\`; source href/target/rel observations \`28/28\`.
- STY-14 actionable count: \`0\` per state.
- Diagnostics: \`57/57\` deliberately paged preparation, interaction, destination, return, screenshot and terminal pages; every accepted page has \`count=0\`, \`hasMore=false\`, \`truncated=false\`; terminal cursor \`477 -> 477\`.
- Screenshot evidence: \`PASS / ACCEPTED\`; accepted \`4/4\`; captures faithfully cover the production-analysis table viewport, not the opening or full page.

| State | Bytes | SHA-256 | Judgment |
| --- | ---: | --- | --- |
${screenshotRows}

- Fresh exact-X collection begins at diagnostic cursor \`13\`; no stale pre-remediation screenshot or substituted Browser evidence is present in the accepted raw.
- Exact preparation cursor spans are desktop light \`13 -> 26\`, desktop dark \`122 -> 134\`, mobile light \`230 -> 258\`, and mobile dark \`354 -> 381\`; every preparation page has zero Runtime/Log events and no truncation.

## Independent review checkpoint

${checkpointLines.join('\n')}

${finalParagraph}

## Review requests

### Code / spec / security

Read-only scope: exact-schema validators at every nested object and array; mutation sensitivity; exact implementation/head binding; complete Batch 13 review/raw/backlog identity; unique-writer and split-brain stop contracts; substituted-browser, fabricated-deployment, diagnostic-pagination and screenshot-overclaim rejection.

### Content / evidence / rights

Read-only scope: fact, vendor-case, evidence-based inference and original-analysis boundaries; seven remote source identities and summary limits; eight governed identities; original Draw.io/SVG rights; screenshot scope and the rejected pre-session attempt.

### Architecture / invariant

Read-only scope: stable affinity key; partition-local operation boundary; unique real-time authority; external durable workflow; hotspot and rebalance controls; primary epoch and split-brain stop behavior; checkpoint/log recovery; explicit non-use conditions.
`;
}

function assertReviewArtifacts(rawBytes = raw) {
  assert.ok(rawBytes, `${LOCAL_RAW} exists before the review is finalized`);
  for (const [label, bytes, identity] of [
    [ARTICLE, Buffer.from(article), ARTICLE_IDENTITY],
    ['data/source-ledger.json', ledgerBytes, LEDGER_IDENTITY],
    [DRAWIO, drawioBytes, DRAWIO_IDENTITY],
    [SVG, svgBytes, SVG_IDENTITY],
    [LOCAL_RAW, rawBytes, LOCAL_RAW_IDENTITY],
  ]) {
    assert.equal(bytes.length, identity.bytes, `${label} exact bytes`);
    assert.equal(sha256(bytes), identity.sha256, `${label} exact SHA-256`);
  }
  assert.equal(JSON.parse(rawBytes).screenshotEvidence.status, 'PASS / ACCEPTED', 'review readiness requires accepted raw screenshot evidence');
}

function assertReviewShape(source, checkpointLines, finalParagraph, rawBytes = raw) {
  assert.ok(source, `${REVIEW} is missing; prepare the factual record without inventing verdicts`);
  assertReviewArtifacts(rawBytes);
  const baseSource = reviewBeforeProductionCheckpoint(source);
  const headings = [...baseSource.matchAll(/^(#{1,3}) ([^\n]+)$/gmu)].map((match) => [match[1].length, match[2]]);
  assert.deepEqual(headings, REVIEW_HEADING_SCHEMA, 'unique exact ordered H1/H2/H3 review schema');
  assert.equal(baseSource, expectedReviewSource(checkpointLines, finalParagraph), 'complete pre-production review exact bytes and claims');
  const checkpoint = markdownSection(baseSource, 'Independent review checkpoint');
  assert.deepEqual(checkpoint.split('\n').filter((line) => line.startsWith('- ')), checkpointLines, 'checkpoint exact controlled lines and order');
}

function assertPlaceholderReview(source = review, rawBytes = raw) {
  assertReviewShape(source, PLACEHOLDER_CHECKPOINT_LINES, 'No independent verdict is recorded in advance. The controller must bind all three reviews to the same exact candidate head and may record the final judgment only after each review reports its own findings.', rawBytes);
}

function assertReview(source = review, expectedCandidateHead = EXPECTED_REVIEWED_HEAD, rawBytes = raw) {
  assert.match(expectedCandidateHead, /^[0-9a-f]{40}$/u, 'explicit expected candidate head is bound');
  const expectedLines = readyCheckpointLines(expectedCandidateHead);
  assertReviewShape(source, expectedLines, 'All three independent zero-finding verdicts above are recorded against the same explicit expected candidate head; deployment remains outside this Stage A checkpoint.', rawBytes);
  const checkpointLines = markdownSection(source, 'Independent review checkpoint').split('\n').filter((line) => line.startsWith('- '));
  assert.equal(checkpointLines[0], `- Exact reviewed candidate head: \`${expectedCandidateHead}\`.`, 'checkpoint head equals explicit expected candidate head');
  assert.equal(checkpointLines[1], `- Independent code/spec/security review: \`READY / APPROVE\`; findings: \`0\`; exact head: \`${expectedCandidateHead}\`.`, 'code verdict head equals explicit expected candidate head');
  assert.equal(checkpointLines[2], `- Independent content/evidence/rights review: \`CONTENT READY\`; rights: \`PASS\`; findings: \`0\`; exact head: \`${expectedCandidateHead}\`.`, 'content verdict head equals explicit expected candidate head');
  assert.equal(checkpointLines[3], `- Independent architecture/invariant review: \`CLEAR / READY\`; blockers: \`0\`; exact head: \`${expectedCandidateHead}\`.`, 'architecture verdict head equals explicit expected candidate head');
}

function contractOnlyReadyReviewFixture(expectedCandidateHead = CONTRACT_REVIEWED_HEAD) {
  return expectedReviewSource(readyCheckpointLines(expectedCandidateHead), 'All three independent zero-finding verdicts above are recorded against the same explicit expected candidate head; deployment remains outside this Stage A checkpoint.');
}

function expectedStageAProductionReviewSection(evidence, rawBytes) {
  const routeRows = evidence.probes.routes.map(({path, status, contentType, bytes, sha256: hash}) => `| \`${path}\` | \`${status}\` | \`${contentType}\` | ${bytes.toLocaleString('en-US')} | \`${hash}\` |`).join('\n');
  const screenshotRows = evidence.screenshotEvidence.attempts.map(({state, status, bytes, sha256: hash}) => `| \`${state}\` | \`${status}\` | ${bytes === null ? '`null`' : bytes.toLocaleString('en-US')} | \`${hash ?? 'null'}\` |`).join('\n');
  const terminal = evidence.collection.diagnosticContinuity.at(-1);
  const asset = evidence.collection.observedSvgAsset;
  return `- Exact published Stage A head: \`${STAGE_A_PUBLISHED_HEAD}\`.
- Exact Pages workflow/run: \`${STAGE_A_PRODUCTION_PAGES.workflow}\`; [\`${STAGE_A_PRODUCTION_PAGES.runId}\`](${STAGE_A_PRODUCTION_PAGES.runUrl}); \`headSha=${STAGE_A_PUBLISHED_HEAD}\`; \`event=push\`; \`status=completed\`; \`conclusion=success\`.
- Exact jobs: build \`${STAGE_A_PRODUCTION_PAGES.build.jobId}\` \`completed/success\`; deploy \`${STAGE_A_PRODUCTION_PAGES.deploy.jobId}\` \`completed/success\`.
- Production HTTP probes: \`9/9\` HTML routes returned \`200\` with \`text/html; charset=utf-8\`; canonical SVG returned \`200\` with \`image/svg+xml\` and exact reviewed bytes/SHA-256.

| Production route | Status | Content type | Bytes | SHA-256 |
| --- | ---: | --- | ---: | --- |
${routeRows}

- Canonical production SVG: \`${evidence.probes.svg.path}\`; \`${evidence.probes.svg.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${evidence.probes.svg.sha256}\`; exact reviewed asset match.
- Production raw Browser JSON: \`${PRODUCTION_RAW}\`; bytes: \`${rawBytes.length.toLocaleString('en-US')}\`; SHA-256: \`${sha256(rawBytes)}\`.
- Browser surface: \`Codex in-app Browser only\`; fresh collection: \`true\`; session: \`${evidence.collection.session}\`; fallback used: \`${evidence.screenshotEvidence.fallbackUsed}\`.
- Production functional Browser QA: \`PASS\`; states \`4/4\`; wrapper interactions \`16/16\`; relation href/H1/return observations \`16/16\`; source href/target/rel observations \`28/28\`; STY-14 actionable total \`0\`.
- Production diagnostics: \`57/57\` deliberately paged preparation, interaction, destination, return, screenshot and terminal pages; warning/error logs \`0\`; Runtime/Log events \`0\`; terminal \`${terminal.afterSequence} -> ${terminal.cursor}\`; \`hasMore=false\`; \`truncated=false\`.
- Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.
- Production PageAssets bound the SVG bundle to the reviewed identity: inventory \`${asset.inventoryId}\`; asset \`${asset.assetId}\`; \`${asset.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${asset.sha256}\`; bundle \`${asset.requested} requested / ${asset.downloaded} downloaded / ${asset.failed} failed\`.
- Production screenshot evidence: \`${evidence.screenshotEvidence.status}\`; attempted \`${evidence.screenshotEvidence.attempted}/4\`; accepted \`${evidence.screenshotEvidence.accepted}/4\`; fallback used: \`${evidence.screenshotEvidence.fallbackUsed}\`; attempts are recorded honestly and no opening/full-page scope is claimed.

| State | Judgment | Bytes | SHA-256 |
| --- | --- | ---: | --- |
${screenshotRows}

- Current release status: \`STAGE_A_SUCCESS / STAGE_B_NOT_RUN\`; STY-13 backlog status remains \`pending\` until Stage B closure.`;
}

function expectedStageAProductionReviewSource(baseSource, evidence, rawBytes) {
  return `${baseSource}\n## ${PRODUCTION_REVIEW_HEADING}\n\n${expectedStageAProductionReviewSection(evidence, rawBytes)}\n`;
}

function assertStageAProductionReview(source = review, rawBytes = productionRaw, expectedReviewedHead = EXPECTED_REVIEWED_HEAD) {
  assert.ok(source, `${REVIEW} exists before production evidence is bound`);
  markdownSection(source, PRODUCTION_REVIEW_HEADING);
  assert.ok(rawBytes, `${PRODUCTION_RAW} is missing; record fresh production Browser evidence`);
  const evidence = JSON.parse(rawBytes);
  assertStageAProductionEvidence(evidence);
  assertReview(source, expectedReviewedHead);
  const baseSource = reviewBeforeProductionCheckpoint(source);
  assert.equal(reviewBeforeStageBCandidate(source), expectedStageAProductionReviewSource(baseSource, evidence, rawBytes), 'exact Stage A production review checkpoint');
  assert.equal(markdownSection(source, PRODUCTION_REVIEW_HEADING), expectedStageAProductionReviewSection(evidence, rawBytes), 'complete Stage A production section exact claims');
}

const PLACEHOLDER_FINAL_REVIEW_LINES = Object.freeze([
  '- Exact final evidence candidate head: `UNBOUND — controller must create and bind the exact post-production-evidence candidate head`.',
  '- Independent final code/spec/security review: `UNBOUND — controller must assign a read-only reviewer`.',
  '- Independent final content/evidence/rights review: `UNBOUND — controller must assign a different read-only reviewer`.',
  '- Independent final architecture/invariant review: `UNBOUND — controller must assign a third read-only reviewer`.',
  '- Final review finding totals: `UNBOUND`.',
  '- Final Stage B recovery judgment: `NOT_RECORDED`.',
  '- Recovery baseline status: `NOT_UPDATED`.',
]);
function readyFinalReviewLines(expectedHead) {
  assert.match(expectedHead, /^[0-9a-f]{40}$/u, 'explicit final evidence candidate head is bound');
  return [
    `- Exact final evidence candidate head: \`${expectedHead}\`.`,
    `- Independent final code/spec/security review: \`READY / APPROVE\`; findings: \`0\`; exact head: \`${expectedHead}\`.`,
    `- Independent final content/evidence/rights review: \`CONTENT READY\`; rights: \`PASS\`; findings: \`0\`; exact head: \`${expectedHead}\`.`,
    `- Independent final architecture/invariant review: \`CLEAR / READY\`; blockers: \`0\`; exact head: \`${expectedHead}\`.`,
    '- Final review finding totals: Critical `0`; Important `0`; Minor `0`; ⚠️ `0`.',
    '- Final Stage B recovery judgment: `READY`.',
    '- Recovery baseline status: `READY_TO_BIND`.',
  ];
}
function expectedStageBProductionReviewSection(evidence, rawBytes, finalReviewLines) {
  const routeRows = evidence.probes.routes.map(({path, status, contentType, bytes, sha256: hash}) => `| \`${path}\` | \`${status}\` | \`${contentType}\` | ${bytes.toLocaleString('en-US')} | \`${hash}\` |`).join('\n');
  const screenshotRows = evidence.screenshotEvidence.attempts.map(({state, status, bytes, sha256: hash}) => `| \`${state}\` | \`${status}\` | ${bytes === null ? '`null`' : bytes.toLocaleString('en-US')} | \`${hash ?? 'null'}\` |`).join('\n');
  const terminal = evidence.collection.diagnosticContinuity.at(-1);
  const asset = evidence.collection.observedSvgAsset;
  return `- Exact published Stage B head: \`${STAGE_B_PUBLISHED_HEAD}\`.
- Exact Pages workflow/run: \`${STAGE_B_PRODUCTION_PAGES.workflow}\`; [\`${STAGE_B_PRODUCTION_PAGES.runId}\`](${STAGE_B_PRODUCTION_PAGES.runUrl}); \`headSha=${STAGE_B_PUBLISHED_HEAD}\`; \`event=push\`; \`status=completed\`; \`conclusion=success\`.
- Exact jobs: build \`${STAGE_B_PRODUCTION_PAGES.build.jobId}\` \`completed/success\`; deploy \`${STAGE_B_PRODUCTION_PAGES.deploy.jobId}\` \`completed/success\`.
- Stage B production HTTP probes: \`9/9\` HTML routes returned \`200\` with \`text/html; charset=utf-8\`; canonical SVG returned \`200\` with \`image/svg+xml\` and exact reviewed bytes/SHA-256.

| Production route | Status | Content type | Bytes | SHA-256 |
| --- | ---: | --- | ---: | --- |
${routeRows}

- Canonical Stage B production SVG: \`${evidence.probes.svg.path}\`; \`${evidence.probes.svg.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${evidence.probes.svg.sha256}\`; exact reviewed asset match.
- Stage B production raw Browser JSON: \`${STAGE_B_PRODUCTION_RAW}\`; bytes: \`${rawBytes.length.toLocaleString('en-US')}\`; SHA-256: \`${sha256(rawBytes)}\`.
- Browser surface: \`Codex in-app Browser only\`; fresh collection: \`true\`; session: \`${evidence.collection.session}\`; fallback used: \`${evidence.screenshotEvidence.fallbackUsed}\`.
- Stage B production functional Browser QA: \`PASS\`; states \`4/4\`; wrapper interactions \`16/16\`; relation href/H1/return observations \`16/16\`; source href/target/rel observations \`28/28\`; STY-14 actionable total \`0\`.
- Stage B production diagnostics: \`57/57\` deliberately paged preparation, interaction, destination, return, screenshot and terminal pages; warning/error logs \`0\`; Runtime/Log events \`0\`; terminal \`${terminal.afterSequence} -> ${terminal.cursor}\`; \`hasMore=false\`; \`truncated=false\`.
- Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.
- Stage B production PageAssets bound the SVG bundle to the reviewed identity: inventory \`${asset.inventoryId}\`; asset \`${asset.assetId}\`; \`${asset.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${asset.sha256}\`; bundle \`${asset.requested} requested / ${asset.downloaded} downloaded / ${asset.failed} failed\`.
- Stage B production screenshot evidence: \`${evidence.screenshotEvidence.status}\`; attempted \`${evidence.screenshotEvidence.attempted}/4\`; accepted \`${evidence.screenshotEvidence.accepted}/4\`; fallback used: \`${evidence.screenshotEvidence.fallbackUsed}\`; attempts are recorded honestly and no opening/full-page scope is claimed.

| State | Judgment | Bytes | SHA-256 |
| --- | --- | ---: | --- |
${screenshotRows}

- Projection: \`83 completed topics / 126 content documents / 599 governed sources\`.
- Current release target: STY-13 \`published / complete\`; STY-14 \`unpublished / pending / non-actionable\`; actionable route count \`0\`.

### Final code / spec / security

Read-only scope: exact Stage B head, run/jobs/probes, exact nested Browser schema and mutation sensitivity, raw/review byte binding, immutable Stage A/Batch 13 identities and recovery-baseline preservation.

### Final content / evidence / rights

Read-only scope: production evidence truthfulness, source and relation observations, original Draw.io/SVG rights, screenshot scope, and STY-14 non-actionability.

### Final architecture / invariant

Read-only scope: the complete STY-13 authority, affinity, split-brain, workflow, hotspot, rebalance and recovery contract at the exact published Stage B head.

${finalReviewLines.join('\n')}`;
}
function expectedStageBProductionReviewSource(baseSource, evidence, rawBytes, finalReviewLines) {
  return `${baseSource}\n## ${FINAL_STAGE_B_REVIEW_HEADING}\n\n${expectedStageBProductionReviewSection(evidence, rawBytes, finalReviewLines)}\n`;
}
function assertStageBProductionReview(source = review, rawBytes = stageBProductionRaw, expectedFinalHead = FINAL_EVIDENCE_REVIEWED_HEAD) {
  assert.ok(source, `${REVIEW} exists before Stage B production evidence is bound`);
  markdownSection(source, FINAL_STAGE_B_REVIEW_HEADING);
  assert.ok(rawBytes, `${STAGE_B_PRODUCTION_RAW} is missing; record fresh Stage B production Browser evidence`);
  const evidence = JSON.parse(rawBytes);
  assertStageBProductionEvidence(evidence);
  assertStageAProductionReview(source);
  assertReadyStageBCandidate(source);
  const finalReviewLines = expectedFinalHead === 'UNBOUND' ? PLACEHOLDER_FINAL_REVIEW_LINES : readyFinalReviewLines(expectedFinalHead);
  const baseSource = reviewBeforeFinalStageBCandidate(source);
  assert.equal(source, expectedStageBProductionReviewSource(baseSource, evidence, rawBytes, finalReviewLines), 'exact Stage B production recovery candidate review');
  assert.equal(markdownSection(source, FINAL_STAGE_B_REVIEW_HEADING), expectedStageBProductionReviewSection(evidence, rawBytes, finalReviewLines), 'complete Stage B production recovery section exact claims and slots');
}
function finalRecoveryBaselinePrefix(evidence, rawBytes, expectedFinalHead) {
  const screenshot = evidence.screenshotEvidence;
  return `2026-08-28 G009 Batch 14 已完成 STY-13，Stage B 发布基线为 [\`${STAGE_B_PUBLISHED_HEAD}\`](https://github.com/sealday/tego-arch/commit/${STAGE_B_PUBLISHED_HEAD})，Pages run [\`${STAGE_B_PRODUCTION_PAGES.runId}\`](${STAGE_B_PRODUCTION_PAGES.runUrl})，exact \`headSha=${STAGE_B_PUBLISHED_HEAD}\`、\`event=push\`、\`status=completed\`、\`conclusion=success\`，build job \`${STAGE_B_PRODUCTION_PAGES.build.jobId}\`、deploy job \`${STAGE_B_PRODUCTION_PAGES.deploy.jobId}\`；2026-08-28 Stage B production HTTP probes \`9/9\`，live route \`/styles/sty-13\` 与 \`/img/diagrams/sty-13-space-based-flight-availability.svg\` 均为 HTTP \`200\`，live SVG \`${SVG_IDENTITY.bytes.toLocaleString('en-US')}\` bytes / SHA-256 \`${SVG_IDENTITY.sha256}\` 与 reviewed asset exact match。Production Browser states \`4/4\`、wrapper interactions \`16/16\`、relation destination/H1/return \`16/16\`、exact source destinations \`28/28\`，每个状态 STY-14 actionable count \`0\` 且 diagnostics \`57/57\` 完整为零；raw \`${STAGE_B_PRODUCTION_RAW}\` 为 \`${rawBytes.length.toLocaleString('en-US')}\` bytes / SHA-256 \`${sha256(rawBytes)}\`，Stage B production functional verdict \`PASS\`，screenshot evidence \`${screenshot.status}\`（attempted \`${screenshot.attempted}/4\`，accepted \`${screenshot.accepted}/4\`，fallback \`${screenshot.fallbackUsed}\`，attempts recorded honestly）。Stage B closure projection 为 83 个已完成主题、126 篇内容文档与 599 个受治理来源，持久故事进度仍为 \`8 / 20\`，当前 G009，下一项为 STY-14，STY-13 为 published/complete，STY-14 为 unpublished/pending/nonactionable；Stage B 三个独立 final review slots 均绑定 exact head \`${expectedFinalHead}\` 且 final readiness 为 \`READY\`，findings \`0\`，deployment status 为 \`SUCCESS\`。`;
}
function batch13CandidateLine(history) {
  return `- **G009 Batch 13 Stage B 当前关闭候选：** ${history}`;
}
function batch14CandidateLine(prefix) {
  return `- **G009 Batch 14 Stage B 当前关闭候选：** ${prefix}`;
}
function assertFinalRecoveryBaseline(source = backlog, rawBytes = stageBProductionRaw, expectedFinalHead = FINAL_EVIDENCE_REVIEWED_HEAD) {
  const current = currentReleaseBaseline(source);
  const history = immediateBatch13Baseline(source);
  assert.equal(Buffer.byteLength(history), IMMEDIATE_BASELINE_IDENTITY.bytes, 'complete Batch 13 history suffix bytes in recovery baseline');
  assert.equal(sha256(history), IMMEDIATE_BASELINE_IDENTITY.sha256, 'complete Batch 13 history suffix SHA-256 in recovery baseline');
  const candidates = source.split(/\r?\n/u).filter((line) => /^- \*\*G009 Batch .* Stage B 当前关闭候选：\*\*/u.test(line));
  if (expectedFinalHead === 'UNBOUND') {
    assert.equal(current, history, 'current Batch 13 baseline remains untouched before final reviews are bound');
    assert.deepEqual(candidates, [batch13CandidateLine(batch13CurrentPrefix(source))], 'no premature Batch 14 recovery candidate before final reviews');
    return;
  }
  assert.ok(rawBytes, `${STAGE_B_PRODUCTION_RAW} exists before the recovery baseline is bound`);
  const evidence = JSON.parse(rawBytes);
  assertStageBProductionEvidence(evidence);
  const prefix = finalRecoveryBaselinePrefix(evidence, rawBytes, expectedFinalHead);
  assert.equal(current, `${prefix}${IMMEDIATE_HISTORY_MARKER}${history}`, 'exact current Stage B recovery baseline and history marker');
  assert.deepEqual(candidates, [batch14CandidateLine(prefix)], 'one exact Batch 14 Stage B recovery candidate');
}

function sampleDiagnosticPages() {
  let cursor = 0;
  return [...ALL_STATE_SCOPES, 'terminal'].map((scope) => {
    const page = {scope, afterSequence: cursor, cursor: cursor + (scope === 'terminal' ? 0 : 1), count: 0, hasMore: false, truncated: false};
    cursor = page.cursor;
    return page;
  });
}
function sampleEvidence() {
  const pages = sampleDiagnosticPages();
  let offset = 0;
  const states = Object.fromEntries(STATES.map((stateName) => {
    const desktop = stateName.startsWith('desktop');
    const scopes = expectedScopes(stateName);
    const statePages = pages.slice(offset, offset + scopes.length); offset += scopes.length;
    return [stateName, {
      theme: stateName.endsWith('Light') ? 'light' : 'dark', viewport: desktop ? {width: 1440, height: 1000} : {width: 390, height: 844},
      documentGeometry: desktop ? {clientWidth: 1440, scrollWidth: 1440} : {clientWidth: 390, scrollWidth: 390},
      wrappers: WRAPPER_LABELS.map((label, index) => {
        const [clientWidth, scrollWidth, before, after] = EXPECTED_WRAPPERS[stateName][index];
        return {label, clientWidth, scrollWidth, before, after, focus: true, focusVisible: true, outlineWidth: '3px'};
      }),
      relations: RELATIONS.map((relation) => ({...relation, h1: relation.expectedH1, visibleCount: 1, returnedToArticle: true})),
      sources: SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})),
      sty14ActionableCount: 0, logs: [], runtimeEvents: [], diagnostics: statePages,
    }];
  }));
  return {
    candidateHead: CANDIDATE_HEAD, stateOrder: [...STATES],
    collection: {browser: 'Codex in-app Browser only', fresh: true, servedUrl: 'http://127.0.0.1:4173/tego-arch/styles/sty-13', build: `local build from exact clean implementation head ${CANDIDATE_HEAD}`, navigationMethod: 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.', observedSvgAsset: {source: 'local Browser pageAssets bundle', contentType: 'image/svg+xml', ...SVG_IDENTITY, viewBox: '0 0 2400 3600'}, diagnosticContinuity: pages},
    states,
    functionalSummary: {status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 16, sourceObservations: 28, sty14ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPages: 57, diagnosticPagesTerminal: true, diagnosticsTruncated: false},
    screenshotEvidence: {status: 'BLOCKED / NOT_ACCEPTED', attempted: 0, accepted: 0, fallbackUsed: false, storage: 'Codex in-app Browser capture status retained in the task conversation; no substituted surface or repository screenshot file.', attempts: []},
  };
}

function sampleProductionEvidence() {
  const local = sampleEvidence();
  return {
    implementationHead: STAGE_A_PUBLISHED_HEAD,
    pages: structuredClone(STAGE_A_PRODUCTION_PAGES),
    probes: {
      routes: PRODUCTION_ROUTES.map((route) => ({...route, status: 200, contentType: 'text/html; charset=utf-8'})),
      svg: {...PRODUCTION_SVG},
    },
    stateOrder: local.stateOrder,
    collection: {
      browser: 'Codex in-app Browser only',
      fresh: true,
      session: 'fresh Stage A production session; local Stage A tab and evidence were not reused',
      servedUrl: 'https://sealday.github.io/tego-arch/styles/sty-13',
      build: `GitHub Pages exact Stage A head ${STAGE_A_PUBLISHED_HEAD}; push run ${STAGE_A_PRODUCTION_PAGES.runId}; build job ${STAGE_A_PRODUCTION_PAGES.build.jobId}; deploy job ${STAGE_A_PRODUCTION_PAGES.deploy.jobId}`,
      navigationMethod: 'Relation destinations were opened by exact href direct navigation and returned with Browser back; no physical-click claim is made.',
      observedSvgAsset: {
        source: 'production Browser pageAssets bundle',
        inventoryId: '11111111-2222-3333-4444-555555555555',
        assetId: '0123456789abcdef',
        contentType: 'image/svg+xml',
        ...SVG_IDENTITY,
        viewBox: '0 0 2400 3600',
        requested: 1,
        downloaded: 1,
        failed: 0,
      },
      diagnosticContinuity: local.collection.diagnosticContinuity,
    },
    states: local.states,
    functionalSummary: local.functionalSummary,
    screenshotEvidence: local.screenshotEvidence,
  };
}

function sampleProductionCheckpointFixture() {
  const evidence = sampleProductionEvidence();
  const rawBytes = Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`);
  const baseSource = contractOnlyReadyReviewFixture(CONTRACT_REVIEWED_HEAD);
  return {evidence, rawBytes, source: expectedStageAProductionReviewSource(baseSource, evidence, rawBytes)};
}

function sampleStageBProductionEvidence() {
  const stageA = sampleProductionEvidence();
  return {
    ...stageA,
    implementationHead: STAGE_B_PUBLISHED_HEAD,
    pages: structuredClone(STAGE_B_PRODUCTION_PAGES),
    probes: {
      routes: STAGE_B_PRODUCTION_ROUTES.map((route) => ({...route, status: 200, contentType: 'text/html; charset=utf-8'})),
      svg: {...STAGE_B_PRODUCTION_SVG},
    },
    collection: {
      ...stageA.collection,
      session: 'fresh Stage B production session; Stage A and pre-deployment Stage B tabs and evidence were not reused',
      build: `GitHub Pages exact Stage B head ${STAGE_B_PUBLISHED_HEAD}; push run ${STAGE_B_PRODUCTION_PAGES.runId}; build job ${STAGE_B_PRODUCTION_PAGES.build.jobId}; deploy job ${STAGE_B_PRODUCTION_PAGES.deploy.jobId}`,
    },
  };
}
function sampleStageBRecoveryFixture(expectedFinalHead = CONTRACT_REVIEWED_HEAD) {
  const evidence = sampleStageBProductionEvidence();
  const rawBytes = Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`);
  const reviewSource = expectedStageBProductionReviewSource(reviewBeforeFinalStageBCandidate(review), evidence, rawBytes, readyFinalReviewLines(expectedFinalHead));
  const current = currentReleaseBaseline(backlog);
  const history = immediateBatch13Baseline(backlog);
  const prefix = finalRecoveryBaselinePrefix(evidence, rawBytes, expectedFinalHead);
  const existingCandidate = backlog.split(/\r?\n/u).find((line) => /^- \*\*G009 Batch .* Stage B 当前关闭候选：\*\*/u.test(line));
  assert.ok(existingCandidate, 'one existing Stage B candidate line for the recovery fixture');
  const backlogSource = backlog
    .replace(`- **当前发布基线：** ${current}`, `- **当前发布基线：** ${prefix}${IMMEDIATE_HISTORY_MARKER}${history}`)
    .replace(existingCandidate, batch14CandidateLine(prefix));
  return {evidence, rawBytes, reviewSource, backlogSource};
}

const [review, raw, backlog, article, ledgerBytes, drawioBytes, svgBytes, immediateReview, ...immediateRaws] = await Promise.all([
  optional(REVIEW, 'utf8'), optional(LOCAL_RAW), required(BACKLOG, 'utf8'), required(ARTICLE, 'utf8'), Promise.resolve(reviewedArtifact('data/source-ledger.json')), required(DRAWIO), required(SVG), required(IMMEDIATE_REVIEW),
  ...IMMEDIATE_RAW_IDENTITIES.map(({path}) => required(path)),
]);
const productionRaw = await optional(PRODUCTION_RAW);
const stageBProductionRaw = await optional(STAGE_B_PRODUCTION_RAW);

test('freezes the complete immediate Batch 13 review/raw/backlog identity', () => assertImmediateBatch13History());

test('closes only STY-13 at the exact Stage B projection and keeps STY-14 non-actionable', async () => {
  const documents = await readContentDocuments('content');
  const projectStatus = JSON.parse(await required('src/generated/project-status.json', 'utf8'));
  assert.deepEqual({
    completed_topics: projectStatus.completed_topics,
    content_documents: projectStatus.content_documents,
    governed_sources: projectStatus.governed_sources,
    durable_stories: {completed: projectStatus.durable_stories.completed, total: projectStatus.durable_stories.total},
    current_goal: projectStatus.durable_stories.current,
    next_topic: NEXT_TOPIC,
  }, {
    completed_topics: EXPECTED_STAGE_B.completed,
    content_documents: EXPECTED_STAGE_B.documents,
    governed_sources: EXPECTED_STAGE_B.sources,
    durable_stories: {completed: 8, total: 20},
    current_goal: 'G009',
    next_topic: 'STY-14',
  });
  assert.match(article, /^# Space-Based Architecture：让状态与处理在亲和分区相遇$/mu);
  assert.equal(documents.flatMap(extractInternalLinks).filter((href) => href === '/styles/sty-14').length, 0, 'STY-14 remains non-actionable');
  assert.ok(backlog.includes(STY13_CLOSURE_LINE), 'exact STY-13 Stage A closure evidence');
  assert.doesNotMatch(backlog, /^- \[ \] \*\*STY-13 P2｜Space-Based Architecture\*\*/mu);
  assert.match(backlog, /^- \[ \] \*\*STY-14 P1｜风格选择矩阵\*\*/mu);
  assert.doesNotMatch(backlog, /^- \[x\] \*\*STY-14 P1｜风格选择矩阵\*\*/mu);
  assert.equal(svgBytes.length, SVG_IDENTITY.bytes, 'STY-13 SVG exact bytes');
  assert.equal(sha256(svgBytes), SVG_IDENTITY.sha256, 'STY-13 SVG exact SHA-256');
});

test('binds the exact historical Stage B READY checkpoint without deployment or production raw', () => {
  const historicalReview = historicalArtifact(STAGE_B_PUBLISHED_HEAD, REVIEW, 'utf8');
  assertReadyStageBCandidate(historicalReview);
  assert.equal(optionalHistoricalArtifact(STAGE_B_PUBLISHED_HEAD, STAGE_B_PRODUCTION_RAW), undefined, 'exact Stage B READY tree must not contain production raw before deployment');
});

test('Stage B READY contract rejects wrong heads, weakened verdicts, findings, deployment and raw claims', () => {
  assertReadyStageBCandidate();
  for (const [before, after] of [
    [`Exact Stage B candidate tree identity: \`${STAGE_B_REVIEWED_HEAD}\`.`, `Exact Stage B candidate tree identity: \`${'0'.repeat(40)}\`.`],
    [`Independent Stage B code/spec/security review: \`READY / APPROVE\`; findings: \`0\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`, `Independent Stage B code/spec/security review: \`READY / APPROVE\`; findings: \`0\`; exact head: \`${'0'.repeat(40)}\`.`],
    [`Independent Stage B content/evidence/rights review: \`CONTENT READY\`; rights: \`PASS\`; findings: \`0\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`, `Independent Stage B content/evidence/rights review: \`CONTENT READY\`; rights: \`PASS\`; findings: \`1\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`],
    [`Independent Stage B architecture/invariant review: \`CLEAR / READY\`; blockers: \`0\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`, `Independent Stage B architecture/invariant review: \`CLEAR / READY\`; blockers: \`1\`; exact head: \`${STAGE_B_REVIEWED_HEAD}\`.`],
    ['Review finding totals: Critical `0`; Important `0`; Minor `0`; ⚠️ `0`.\n- Final Stage B review judgment: `READY`.', 'Review finding totals: Critical `0`; Important `1`; Minor `0`; ⚠️ `0`.\n- Final Stage B review judgment: `READY`.'],
    ['Final Stage B review judgment: `READY`.', 'Final Stage B review judgment: `NOT_RECORDED`.'],
    ['Stage B deployment status: `PENDING / NOT_RUN`.', 'Stage B deployment status: `SUCCESS`.'],
    ['Stage B production raw: `NOT_RECORDED`.', `Stage B production raw: \`${STAGE_B_PRODUCTION_RAW}\`.`],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertReadyStageBCandidate(mutated), assert.AssertionError);
  }
  const consistentlyWrong = review.replaceAll(STAGE_B_REVIEWED_HEAD, '2'.repeat(40));
  assert.notEqual(consistentlyWrong, review, 'all four Stage B heads mutated together');
  assert.throws(() => assertReadyStageBCandidate(consistentlyWrong), assert.AssertionError, 'mutually consistent wrong heads are rejected');
});

test('requires exact-byte four-state local in-app Browser evidence', () => {
  assert.equal(raw?.length, LOCAL_RAW_IDENTITY.bytes, 'exact local Browser raw bytes');
  assert.equal(raw && sha256(raw), LOCAL_RAW_IDENTITY.sha256, 'exact local Browser raw SHA-256');
  assertLocalEvidence(raw && JSON.parse(raw));
});

test('rejects valid-looking wrapper and screenshot byte-identity mutations', {skip: !raw}, () => {
  const evidence = JSON.parse(raw);
  for (const [label, mutate] of [
    ['wrapper geometry drift', (copy) => { copy.states.mobileLight.wrappers[0].scrollWidth += 1; }],
    ['screenshot byte drift', (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; }],
    ['screenshot hash drift', (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); }],
    ['screenshot attempt additive field', (copy) => { copy.screenshotEvidence.attempts[2].verified = true; }],
  ]) {
    const copy = structuredClone(evidence); mutate(copy);
    assert.throws(() => assertLocalEvidence(copy), assert.AssertionError, label);
  }
});

test('requires three independent exact-head zero-finding review verdicts before READY', () => {
  assert.notEqual(EXPECTED_REVIEWED_HEAD, 'UNBOUND', 'controller must bind the exact reviewed candidate head after three independent reviews');
  assertReview(review, EXPECTED_REVIEWED_HEAD);
});

test('review contract compares all four checkpoint heads with an explicit expected candidate head', {skip: !review || !raw}, () => {
  const fixture = contractOnlyReadyReviewFixture();
  assertReview(fixture, CONTRACT_REVIEWED_HEAD);
  const consistentlyWrong = fixture.replaceAll(CONTRACT_REVIEWED_HEAD, '2222222222222222222222222222222222222222');
  assert.notEqual(consistentlyWrong, fixture, 'all four checkpoint heads were mutated together');
  assert.throws(() => assertReview(consistentlyWrong, CONTRACT_REVIEWED_HEAD), assert.AssertionError, 'four mutually consistent but wrong heads are rejected');
});

test('exact-schema validator rejects additive and semantic Browser evidence mutations', () => {
  const valid = sampleEvidence();
  assertLocalEvidence(valid);
  const mutations = [
    ['root additive deployment', (copy) => { copy.deployment = 'SUCCESS'; }],
    ['wrong head', (copy) => { copy.candidateHead = '0'.repeat(40); }],
    ['substituted browser', (copy) => { copy.collection.browser = 'Chrome'; }],
    ['fabricated build', (copy) => { copy.collection.build = 'deployed'; }],
    ['collection additive field', (copy) => { copy.collection.verified = true; }],
    ['state additive field', (copy) => { copy.states.desktopLight.visualInspection = 'PASS'; }],
    ['viewport additive field', (copy) => { copy.states.desktopLight.viewport.verified = true; }],
    ['document additive field', (copy) => { copy.states.desktopLight.documentGeometry.verified = true; }],
    ['document overflow', (copy) => { copy.states.mobileLight.documentGeometry.scrollWidth = 800; }],
    ['wrapper additive field', (copy) => { copy.states.desktopLight.wrappers[0].verified = true; }],
    ['wrapper focus', (copy) => { copy.states.mobileDark.wrappers[0].focusVisible = false; }],
    ['wrapper outline', (copy) => { copy.states.desktopDark.wrappers[1].outlineWidth = '2px'; }],
    ['relation additive click overclaim', (copy) => { copy.states.desktopLight.relations[0].physicallyClicked = true; }],
    ['relation wrong H1', (copy) => { copy.states.desktopLight.relations[0].h1 = 'fabricated'; }],
    ['relation return', (copy) => { copy.states.mobileDark.relations[0].returnedToArticle = false; }],
    ['source additive field', (copy) => { copy.states.desktopLight.sources[0].verified = true; }],
    ['source target', (copy) => { copy.states.mobileLight.sources[0].target = '_self'; }],
    ['STY-14 action', (copy) => { copy.states.desktopLight.sty14ActionableCount = 1; }],
    ['runtime event', (copy) => { copy.states.mobileDark.runtimeEvents.push({method: 'Runtime.exceptionThrown'}); }],
    ['diagnostic page additive field', (copy) => { copy.collection.diagnosticContinuity[0].verified = true; }],
    ['diagnostic hasMore', (copy) => { copy.collection.diagnosticContinuity[1].hasMore = true; }],
    ['diagnostic truncated', (copy) => { copy.states.mobileLight.diagnostics.at(-1).truncated = true; }],
    ['diagnostic missing action page', (copy) => { copy.collection.diagnosticContinuity.splice(3, 1); }],
    ['diagnostic cursor discontinuity', (copy) => { copy.collection.diagnosticContinuity[2].afterSequence += 1; }],
    ['functional pending', (copy) => { copy.functionalSummary.status = 'PENDING'; }],
    ['screenshot generic pass overclaim', (copy) => { copy.screenshotEvidence.status = 'PASS'; }],
    ['screenshot accepted overclaim', (copy) => { copy.screenshotEvidence.accepted = 4; }],
    ['screenshot fallback', (copy) => { copy.screenshotEvidence.fallbackUsed = true; }],
    ['screenshot nested additive field', (copy) => { copy.screenshotEvidence.verified = true; }],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(valid); mutate(copy);
    assert.throws(() => assertLocalEvidence(copy), assert.AssertionError, label);
  }
});

test('requires exact-head Stage A Pages, HTTP/SVG probes and fresh production in-app Browser evidence', () => {
  assertStageAProductionEvidence(productionRaw && JSON.parse(productionRaw));
});

test('requires the exact Stage A production publication checkpoint in the review', () => {
  assertStageAProductionReview();
});

test('production contract rejects identity, probe, Task 5 nested-schema, screenshot and review mutations', () => {
  const fixture = sampleProductionCheckpointFixture();
  assertStageAProductionEvidence(fixture.evidence);
  assertStageAProductionReview(fixture.source, fixture.rawBytes, CONTRACT_REVIEWED_HEAD);
  const evidenceMutations = [
    ['root additive deployment', (copy) => { copy.deployment = 'SUCCESS'; }],
    ['published head', (copy) => { copy.implementationHead = '0'.repeat(40); }],
    ['Pages additive field', (copy) => { copy.pages.verified = true; }],
    ['Pages run', (copy) => { copy.pages.runId += 1; }],
    ['Pages head', (copy) => { copy.pages.headSha = '0'.repeat(40); }],
    ['build conclusion', (copy) => { copy.pages.build.conclusion = 'failure'; }],
    ['deploy job', (copy) => { copy.pages.deploy.jobId += 1; }],
    ['probe additive field', (copy) => { copy.probes.verified = true; }],
    ['route array additive field', (copy) => { copy.probes.routes.verified = true; }],
    ['route status', (copy) => { copy.probes.routes[0].status = 404; }],
    ['route bytes', (copy) => { copy.probes.routes[4].bytes += 1; }],
    ['route SHA', (copy) => { copy.probes.routes[8].sha256 = '0'.repeat(64); }],
    ['SVG identity', (copy) => { copy.probes.svg.sha256 = '0'.repeat(64); }],
    ['collection additive field', (copy) => { copy.collection.verified = true; }],
    ['substituted browser', (copy) => { copy.collection.browser = 'Chrome'; }],
    ['stale collection', (copy) => { copy.collection.fresh = false; }],
    ['reused session', (copy) => { copy.collection.session = 'reused local session'; }],
    ['wrong served URL', (copy) => { copy.collection.servedUrl = 'http://127.0.0.1:4173/tego-arch/styles/sty-13'; }],
    ['physical-click overclaim', (copy) => { copy.collection.navigationMethod = 'Relations were physically clicked.'; }],
    ['PageAssets additive field', (copy) => { copy.collection.observedSvgAsset.verified = true; }],
    ['PageAssets inventory', (copy) => { copy.collection.observedSvgAsset.inventoryId = 'substituted'; }],
    ['PageAssets asset', (copy) => { copy.collection.observedSvgAsset.assetId = 'substituted'; }],
    ['PageAssets bytes', (copy) => { copy.collection.observedSvgAsset.bytes += 1; }],
    ['PageAssets bundle failure', (copy) => { copy.collection.observedSvgAsset.failed = 1; }],
    ['state additive field', (copy) => { copy.states.desktopLight.verified = true; }],
    ['viewport', (copy) => { copy.states.mobileLight.viewport.height += 1; }],
    ['document overflow', (copy) => { copy.states.mobileDark.documentGeometry.scrollWidth = 800; }],
    ['wrapper geometry', (copy) => { copy.states.mobileLight.wrappers[0].scrollWidth += 1; }],
    ['wrapper focus-visible', (copy) => { copy.states.desktopDark.wrappers[0].focusVisible = false; }],
    ['relation H1', (copy) => { copy.states.desktopLight.relations[0].h1 = 'fabricated'; }],
    ['relation return', (copy) => { copy.states.mobileDark.relations[3].returnedToArticle = false; }],
    ['source target', (copy) => { copy.states.mobileLight.sources[0].target = '_self'; }],
    ['STY-14 action', (copy) => { copy.states.desktopLight.sty14ActionableCount = 1; }],
    ['diagnostic missing page', (copy) => { copy.collection.diagnosticContinuity.splice(2, 1); }],
    ['diagnostic cursor discontinuity', (copy) => { copy.collection.diagnosticContinuity[2].afterSequence += 1; }],
    ['diagnostic truncated', (copy) => { copy.states.mobileDark.diagnostics.at(-1).truncated = true; }],
    ['functional pending', (copy) => { copy.functionalSummary.status = 'PENDING'; }],
    ['screenshot generic pass overclaim', (copy) => { copy.screenshotEvidence.status = 'PASS'; }],
    ['screenshot accepted overclaim', (copy) => { copy.screenshotEvidence.accepted = 4; }],
    ['screenshot fallback', (copy) => { copy.screenshotEvidence.fallbackUsed = true; }],
  ];
  for (const [label, mutate] of evidenceMutations) {
    const copy = structuredClone(fixture.evidence);
    mutate(copy);
    assert.throws(() => assertStageAProductionEvidence(copy), assert.AssertionError, label);
  }

  const whitespaceMutatedRaw = Buffer.concat([fixture.rawBytes, Buffer.from(' ')]);
  assert.throws(() => assertStageAProductionReview(fixture.source, whitespaceMutatedRaw, CONTRACT_REVIEWED_HEAD), assert.AssertionError, 'production review binds the exact complete raw bytes');
  for (const [before, after] of [
    [`Exact published Stage A head: \`${STAGE_A_PUBLISHED_HEAD}\`.`, `Exact published Stage A head: \`${'0'.repeat(40)}\`.`],
    [`[\`${STAGE_A_PRODUCTION_PAGES.runId}\`](${STAGE_A_PRODUCTION_PAGES.runUrl})`, '[`0`](https://example.invalid/run/0)'],
    ['Production HTTP probes: `9/9`', 'Production HTTP probes: `8/9`'],
    ['Production functional Browser QA: `PASS`', 'Production functional Browser QA: `PENDING`'],
    ['Production diagnostics: `57/57`', 'Production diagnostics: `56/57`'],
    [`asset \`${fixture.evidence.collection.observedSvgAsset.assetId}\``, 'asset `substituted`'],
    ['attempts are recorded honestly and no opening/full-page scope is claimed.', 'Screenshot capture scope: `FULL_PAGE`.'],
    ['Current release status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`', 'Current release status: `STAGE_B_SUCCESS`'],
  ]) {
    const mutated = fixture.source.replace(before, after);
    assert.notEqual(mutated, fixture.source, `${before} review mutation applies`);
    assert.throws(() => assertStageAProductionReview(mutated, fixture.rawBytes, CONTRACT_REVIEWED_HEAD), assert.AssertionError);
  }
});

test('requires exact-head Stage B Pages, HTTP/SVG probes and fresh production in-app Browser evidence', () => {
  assertStageBProductionEvidence(stageBProductionRaw && JSON.parse(stageBProductionRaw));
});

test('requires the exact no-final-verdict Stage B production recovery candidate in the review', () => {
  assertStageBProductionReview();
});

test('keeps the Batch 13 recovery baseline current until final Stage B evidence reviews are bound', () => {
  assertFinalRecoveryBaseline();
});

test('Stage B contract rejects Stage A-schema, run, probe, freshness, diagnostic, screenshot, final-review and recovery mutations', () => {
  const fixture = sampleStageBRecoveryFixture();
  assertStageBProductionEvidence(fixture.evidence);
  assertStageBProductionReview(fixture.reviewSource, fixture.rawBytes, CONTRACT_REVIEWED_HEAD);
  assertFinalRecoveryBaseline(fixture.backlogSource, fixture.rawBytes, CONTRACT_REVIEWED_HEAD);
  const evidenceMutations = [
    ['root additive deployment', (copy) => { copy.deployment = 'SUCCESS'; }],
    ['published head', (copy) => { copy.implementationHead = '0'.repeat(40); }],
    ['Pages additive field', (copy) => { copy.pages.verified = true; }],
    ['Pages run', (copy) => { copy.pages.runId += 1; }],
    ['Pages head', (copy) => { copy.pages.headSha = '0'.repeat(40); }],
    ['build conclusion', (copy) => { copy.pages.build.conclusion = 'failure'; }],
    ['deploy job', (copy) => { copy.pages.deploy.jobId += 1; }],
    ['probe additive field', (copy) => { copy.probes.verified = true; }],
    ['route array additive field', (copy) => { copy.probes.routes.verified = true; }],
    ['route status', (copy) => { copy.probes.routes[0].status = 404; }],
    ['route bytes', (copy) => { copy.probes.routes[4].bytes += 1; }],
    ['route SHA', (copy) => { copy.probes.routes[8].sha256 = '0'.repeat(64); }],
    ['SVG identity', (copy) => { copy.probes.svg.sha256 = '0'.repeat(64); }],
    ['collection additive field', (copy) => { copy.collection.verified = true; }],
    ['substituted browser', (copy) => { copy.collection.browser = 'Chrome'; }],
    ['stale collection', (copy) => { copy.collection.fresh = false; }],
    ['reused Stage A session', (copy) => { copy.collection.session = 'fresh Stage A production session; local Stage A tab and evidence were not reused'; }],
    ['wrong served URL', (copy) => { copy.collection.servedUrl = 'http://127.0.0.1:4173/tego-arch/styles/sty-13'; }],
    ['physical-click overclaim', (copy) => { copy.collection.navigationMethod = 'Relations were physically clicked.'; }],
    ['PageAssets additive field', (copy) => { copy.collection.observedSvgAsset.verified = true; }],
    ['PageAssets inventory', (copy) => { copy.collection.observedSvgAsset.inventoryId = 'substituted'; }],
    ['PageAssets asset', (copy) => { copy.collection.observedSvgAsset.assetId = 'substituted'; }],
    ['PageAssets bytes', (copy) => { copy.collection.observedSvgAsset.bytes += 1; }],
    ['PageAssets bundle failure', (copy) => { copy.collection.observedSvgAsset.failed = 1; }],
    ['state additive field', (copy) => { copy.states.desktopLight.verified = true; }],
    ['viewport', (copy) => { copy.states.mobileLight.viewport.height += 1; }],
    ['document overflow', (copy) => { copy.states.mobileDark.documentGeometry.scrollWidth = 800; }],
    ['wrapper geometry', (copy) => { copy.states.mobileLight.wrappers[0].scrollWidth += 1; }],
    ['wrapper focus-visible', (copy) => { copy.states.desktopDark.wrappers[0].focusVisible = false; }],
    ['relation H1', (copy) => { copy.states.desktopLight.relations[0].h1 = 'fabricated'; }],
    ['relation return', (copy) => { copy.states.mobileDark.relations[3].returnedToArticle = false; }],
    ['source target', (copy) => { copy.states.mobileLight.sources[0].target = '_self'; }],
    ['STY-14 action', (copy) => { copy.states.desktopLight.sty14ActionableCount = 1; }],
    ['diagnostic missing page', (copy) => { copy.collection.diagnosticContinuity.splice(2, 1); }],
    ['diagnostic cursor discontinuity', (copy) => { copy.collection.diagnosticContinuity[2].afterSequence += 1; }],
    ['diagnostic truncated', (copy) => { copy.states.mobileDark.diagnostics.at(-1).truncated = true; }],
    ['functional pending', (copy) => { copy.functionalSummary.status = 'PENDING'; }],
    ['screenshot generic pass overclaim', (copy) => { copy.screenshotEvidence.status = 'PASS'; }],
    ['screenshot accepted overclaim', (copy) => { copy.screenshotEvidence.accepted = 4; }],
    ['screenshot fallback', (copy) => { copy.screenshotEvidence.fallbackUsed = true; }],
  ];
  for (const [label, mutate] of evidenceMutations) {
    const copy = structuredClone(fixture.evidence);
    mutate(copy);
    assert.throws(() => assertStageBProductionEvidence(copy), assert.AssertionError, label);
  }

  const whitespaceMutatedRaw = Buffer.concat([fixture.rawBytes, Buffer.from(' ')]);
  assert.throws(() => assertStageBProductionReview(fixture.reviewSource, whitespaceMutatedRaw, CONTRACT_REVIEWED_HEAD), assert.AssertionError, 'Stage B review binds the exact complete raw bytes');
  for (const [before, after] of [
    [`Exact published Stage B head: \`${STAGE_B_PUBLISHED_HEAD}\`.`, `Exact published Stage B head: \`${'0'.repeat(40)}\`.`],
    [`[\`${STAGE_B_PRODUCTION_PAGES.runId}\`](${STAGE_B_PRODUCTION_PAGES.runUrl})`, '[`0`](https://example.invalid/run/0)'],
    ['Stage B production HTTP probes: `9/9`', 'Stage B production HTTP probes: `8/9`'],
    ['Stage B production functional Browser QA: `PASS`', 'Stage B production functional Browser QA: `PENDING`'],
    ['Stage B production diagnostics: `57/57`', 'Stage B production diagnostics: `56/57`'],
    [`asset \`${fixture.evidence.collection.observedSvgAsset.assetId}\``, 'asset `substituted`'],
    ['attempts are recorded honestly and no opening/full-page scope is claimed.', 'Screenshot capture scope: `FULL_PAGE`.'],
    [`Exact final evidence candidate head: \`${CONTRACT_REVIEWED_HEAD}\`.`, `Exact final evidence candidate head: \`${'2'.repeat(40)}\`.`],
    ['Independent final code/spec/security review: `READY / APPROVE`; findings: `0`;', 'Independent final code/spec/security review: `READY / APPROVE`; findings: `1`;'],
    ['Independent final content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`;', 'Independent final content/evidence/rights review: `CONTENT READY`; rights: `FAIL`; findings: `1`;'],
    ['Independent final architecture/invariant review: `CLEAR / READY`; blockers: `0`;', 'Independent final architecture/invariant review: `BLOCKED`; blockers: `1`;'],
    ['Final review finding totals: Critical `0`; Important `0`; Minor `0`; ⚠️ `0`.', 'Final review finding totals: Critical `0`; Important `1`; Minor `0`; ⚠️ `0`.'],
    ['Final Stage B recovery judgment: `READY`.', 'Final Stage B recovery judgment: `NOT_RECORDED`.'],
    ['Recovery baseline status: `READY_TO_BIND`.', 'Recovery baseline status: `NOT_UPDATED`.'],
  ]) {
    const mutated = fixture.reviewSource.replace(before, after);
    assert.notEqual(mutated, fixture.reviewSource, `${before} Stage B review mutation applies`);
    assert.throws(() => assertStageBProductionReview(mutated, fixture.rawBytes, CONTRACT_REVIEWED_HEAD), assert.AssertionError);
  }
  const consistentlyWrongReview = fixture.reviewSource.replaceAll(CONTRACT_REVIEWED_HEAD, '2'.repeat(40));
  assert.throws(() => assertStageBProductionReview(consistentlyWrongReview, fixture.rawBytes, CONTRACT_REVIEWED_HEAD), assert.AssertionError, 'mutually consistent wrong final review heads are rejected');

  const baseline = currentReleaseBaseline(fixture.backlogSource);
  for (const [label, mutated] of [
    ['recovery baseline suffix mutation', fixture.backlogSource.replace(baseline, `${baseline}x`)],
    ['recovery history marker mutation', fixture.backlogSource.replace(IMMEDIATE_HISTORY_MARKER, '此前不精确历史基线为：')],
    ['recovery candidate head mutation', fixture.backlogSource.replaceAll(CONTRACT_REVIEWED_HEAD, '2'.repeat(40))],
    ['recovery candidate duplication', `${fixture.backlogSource}\n${batch14CandidateLine(finalRecoveryBaselinePrefix(fixture.evidence, fixture.rawBytes, CONTRACT_REVIEWED_HEAD))}\n`],
  ]) assert.throws(() => assertFinalRecoveryBaseline(mutated, fixture.rawBytes, CONTRACT_REVIEWED_HEAD), assert.AssertionError, label);
});

test('immutable history validator rejects review, raw and backlog suffix mutation', () => {
  assert.throws(() => assertImmediateBatch13History(Buffer.concat([immediateReview, Buffer.from('x')])), assert.AssertionError);
  for (const index of IMMEDIATE_RAW_IDENTITIES.keys()) {
    const copies = immediateRaws.map((value) => Buffer.from(value));
    copies[index] = Buffer.concat([copies[index], Buffer.from('x')]);
    assert.throws(() => assertImmediateBatch13History(immediateReview, copies), assert.AssertionError);
  }
  const baseline = currentReleaseBaseline(backlog);
  assert.throws(() => assertImmediateBatch13History(immediateReview, immediateRaws, backlog.replace(baseline, `${baseline}x`)), assert.AssertionError);
});

test('contract-only review fixture closes all review sections and rejects displaced, duplicated and contradictory claims', {skip: !review || !raw}, () => {
  const contractFixture = contractOnlyReadyReviewFixture();
  assertReview(contractFixture, CONTRACT_REVIEWED_HEAD);
  for (const [before, after] of [
    [`Exact reviewed candidate head: \`${CONTRACT_REVIEWED_HEAD}\`.`, `Exact reviewed candidate head: \`${'0'.repeat(40)}\`.`],
    ['findings: `0`; exact head:', 'findings: `1`; exact head:'],
    ['blockers: `0`; exact head:', 'blockers: `1`; exact head:'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Deployment status at this checkpoint: `NOT_RUN`.', 'Deployment status at this checkpoint: `SUCCESS`.'],
    ['Browser surface: `Codex in-app Browser only`', 'Browser surface: `Chrome`'],
    ['captures faithfully cover the production-analysis table viewport, not the opening or full page.', 'Full-page PASS.'],
    ['Diagnostics: `57/57` deliberately paged', 'Diagnostics: `58/58` fabricated pages'],
    [ARTICLE_IDENTITY.sha256, '0'.repeat(64)],
    [LEDGER_IDENTITY.sha256, '1'.repeat(64)],
    [DRAWIO_IDENTITY.sha256, '2'.repeat(64)],
    [SVG_IDENTITY.sha256, '3'.repeat(64)],
    [IMMEDIATE_RAW_IDENTITIES[0].sha256, '4'.repeat(64)],
    [SCREENSHOTS[0].sha256, '5'.repeat(64)],
  ]) {
    const mutated = contractFixture.replace(before, after);
    assert.notEqual(mutated, contractFixture, `${before} mutation applies`);
    assert.throws(() => assertReview(mutated, CONTRACT_REVIEWED_HEAD), assert.AssertionError);
  }
  const outsideDeploymentClaim = contractFixture.replace('## Stage A projection', 'Deployment SUCCESS\n\n## Stage A projection');
  assert.throws(() => assertReview(outsideDeploymentClaim, CONTRACT_REVIEWED_HEAD), assert.AssertionError, 'checkpoint-external Deployment SUCCESS rejected');
  const duplicateReadyCheckpoint = `${contractFixture}\n## Independent review checkpoint\n\n${readyCheckpointLines(CONTRACT_REVIEWED_HEAD).join('\n')}\n`;
  assert.throws(() => assertReview(duplicateReadyCheckpoint, CONTRACT_REVIEWED_HEAD), assert.AssertionError, 'second READY checkpoint rejected');
});
