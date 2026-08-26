import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const EXPECTED_STAGE_A = Object.freeze({completed: 63, documents: 107, sources: 560});
export const EXPECTED_STAGE_B = Object.freeze({completed: 64, documents: 107, sources: 560});
export const CURRENT_TOPIC = 'STY-11';
export const NEXT_TOPIC = 'STY-12';
export const REVIEW = 'docs/reviews/g009-batch12.md';
export const LOCAL_RAW = 'docs/reviews/evidence/g009-batch12-stage-a-browser.json';
export const PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch12-stage-a-production-browser.json';
export const STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch12-stage-b-production-browser.json';
export const STATES = Object.freeze(['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark']);
export const CANDIDATE_HEAD = '4405d38bc70a3eb3711319c00c54f069e333a8aa';
export const EVIDENCE_HEAD = '0e074a91731ae5fe77bca550bf905c213eca5af1';
export const REVIEW_GUARD_HEAD = 'c4431c9d13998ec88cebe716db9156700917b6c2';
export const READY_HEAD = '1cf010f13c6e9e98240de7e1d5e7d1c380bdc073';
export const LOCAL_RAW_BYTES = 34_866;
export const LOCAL_RAW_SHA256 = 'a4c80875fbcf06b3f524a55f3a55a80639f3b3335a3ac7e6d173a4f4b98bbe4d';
export const PRODUCTION_RAW_BYTES = 36_313;
export const PRODUCTION_RAW_SHA256 = '31c7ac54204040af70b529a45ef2fbba2cb92b4635a52f0f0086385f1bee346e';

const PRODUCTION_PAGES = Object.freeze({
  runId: 32_936_647_570,
  event: 'push',
  headSha: READY_HEAD,
  status: 'completed',
  conclusion: 'success',
  buildJobId: 98_079_000_160,
  buildStatus: 'completed',
  buildConclusion: 'success',
  deployJobId: 98_079_641_183,
  deployStatus: 'completed',
  deployConclusion: 'success',
});
const PRODUCTION_ROUTES = Object.freeze([
  {path: '/tego-arch/', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles/sty-06', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles/sty-09', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/styles/sty-11', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/cases', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/cases/cloudflare-durable-objects-workerd', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/tego-arch/references', status: 200, contentType: 'text/html; charset=utf-8'},
]);
const PRODUCTION_SVG = Object.freeze({
  url: 'https://sealday.github.io/tego-arch/img/diagrams/sty-11-serverless-order-fulfillment.svg',
  status: 200,
  contentType: 'image/svg+xml',
  bytes: 21_881,
  sha256: '6a166a208e31cb1c6313cd2a21ff17ce124ab6b463821bb3b108275000fa2094',
});

const WRAPPER_LABELS = Object.freeze([
  '订单结算与异步履约 Serverless 边界图，可横向滚动',
  'Serverless 执行与状态责任矩阵，可横向滚动',
  'Serverless 七类故障、响应、停止条件与责任表，可横向滚动',
  '冷启动与成本决策表，可横向滚动',
]);
const WRAPPER_SCROLL_WIDTHS = Object.freeze([800, 1024, 1381, 1024]);
const SOURCE_HREFS = Object.freeze([
  'https://github.com/cncf/wg-serverless/blob/79c8a13c26be9066a8723c5896d8aaa0e2ab9e08/whitepapers/serverless-overview/cncf_serverless_whitepaper_v1.0.pdf',
  'https://glossary.cncf.io/serverless/',
  'https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html',
  'https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html',
  'https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html',
  'https://aws.amazon.com/lambda/pricing/',
  'https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale',
  'https://cloud.google.com/run/docs/about-concurrency',
  'https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md',
  'https://github.com/open-workflow-specification/specification/blob/2dd2c84170d5f3e05d58e913e9ca298dcf8d543a/schema/workflow.yaml',
]);
const RELATIONS = Object.freeze([
  ['/tego-arch/styles/sty-06', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
  ['/tego-arch/styles/sty-09', 'Pipes and Filters：用明确合同拆分批处理与流处理'],
  ['/tego-arch/cases/cloudflare-durable-objects-workerd', '把边缘协调收敛到身份寻址的状态单元'],
]);
const SCREENSHOT_ATTEMPTS = Object.freeze([
  ['desktopLight', 839_708, 'd73aa6857bd8aedf7bd0f63b330e4712e485c29ffe121f1f3df3257612f4fc71', 1440, 10_881],
  ['desktopDark', 842_052, '619545ee7e57f01eaceca1cdb6b5969e8fb1534c9b0b207403f15870687be5c9', 1440, 10_881],
  ['mobileLight', 599_835, 'e649e892ed2f16ebc0cce8432c87688d888518c9d51213a622b2a478ce344572', 390, 15_730],
]);
const DIAGNOSTIC_PAGES = Object.freeze([
  [25, 97],
  [97, 185],
  [185, 286],
  [286, 372],
]);
const PRODUCTION_DIAGNOSTIC_PAGES = Object.freeze([
  [27, 98],
  [98, 184],
  [184, 283],
  [283, 369],
]);
const PRODUCTION_SCREENSHOT_ATTEMPTS = Object.freeze([
  ['desktopLight', 848_152, 'a12389466cfbe167150ad468bbadd7c3448374b8ebfe4183a00ad6a4458aa8f7', 1440, 10_881],
  ['desktopDark', 850_353, '2a3637b74a7437f00dc87370e3c5afe187cb5ad4745bdaee9c2f130ae562e406', 1440, 10_881],
  ['mobileLight', 599_835, 'e649e892ed2f16ebc0cce8432c87688d888518c9d51213a622b2a478ce344572', 390, 15_730],
]);

const ARTICLE = 'content/styles/sty-11-serverless-architecture.mdx';
const LEDGER = 'data/source-ledger.json';
const DRAWIO = 'diagrams/sty-11-serverless-order-fulfillment.drawio';
const SVG = 'static/img/diagrams/sty-11-serverless-order-fulfillment.svg';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch11.md';
const BACKLOG = 'docs/content-backlog.md';
const IMMEDIATE_REVIEW_HASH = '9276cb7b4c6e66ac50375a4f58df8220255644afd1f45cb46c943db610c10a39';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'aa6c304cf11bca2472f884cba795782e03b579415b859864c5c4e5d0d60a978f';
const STABLE_IDENTITIES = new Map([
  [ARTICLE, [23_126, '85561b6c44acc1518f416e12cb507b6c4a2a57369c6cdda8c8df176165d2bbd6']],
  [LEDGER, [1_644_284, '0f3856dc6291e1e8f78622c08c2fa0da8af54d11cc24cbd679a3557ab920beef']],
  [DRAWIO, [47_529, '9862fcb5be62941553780b2a58751a3f9af2ba7a32dace3549cc3ca6d1daa00e']],
  [SVG, [21_881, '6a166a208e31cb1c6313cd2a21ff17ce124ab6b463821bb3b108275000fa2094']],
]);
const FINAL_STAGE_A_CHECKPOINT = Object.freeze([
  `- Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`,
  `- Exact Browser evidence head: \`${EVIDENCE_HEAD}\`.`,
  `- Exact independent review head: \`${REVIEW_GUARD_HEAD}\`.`,
  '- Independent code/spec/security review: `READY / APPROVE`; findings: `0`.',
  '- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
  '- Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
  '- Final Stage A review judgment: `READY`.',
  '- Scope boundary: `STAGE_A_ONLY`.',
  '- Deployment status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`.',
]);
const PENDING_STAGE_A_CHECKPOINT = Object.freeze([
  `- Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`,
  '- Exact Browser evidence head: `PENDING`.',
  '- Exact independent review head: `PENDING`.',
  '- Independent code/spec/security review: `PENDING`; findings: `PENDING`.',
  '- Independent content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.',
  '- Independent architecture/invariant review: `PENDING`; blockers: `PENDING`.',
  '- Final Stage A review judgment: `PENDING`.',
  '- Scope boundary: `STAGE_A_ONLY`.',
  '- Deployment status: `NOT_RUN`.',
]);
const STAGE_B_CLOSURE_BASELINE_LABEL = '- **G009 Batch 12 Stage B 当前关闭候选：** ';
const STY11_CLOSURE_LINE = `- [x] **STY-11 P1｜Serverless Architecture**：执行模型、状态、并发、冷启动、成本和供应商边界。Stage A 关闭证据：2026-08-26 review，commit [\`${READY_HEAD}\`](https://github.com/sealday/tego-arch/commit/${READY_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`，production HTML routes \`8/8\`，live route \`/styles/sty-11\` 与 \`/img/diagrams/sty-11-serverless-order-fulfillment.svg\` 均为 HTTP 200，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match，Stage A production Browser raw \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes / SHA-256 \`${PRODUCTION_RAW_SHA256}\`，functional verdict PASS；screenshot evidence BLOCKED / NOT_ACCEPTED。`;
const CURRENT_BASELINE_PREFIX = `2026-08-26 G009 Batch 12 已完成 STY-11，Stage A 发布基线为 [\`${READY_HEAD}\`](https://github.com/sealday/tego-arch/commit/${READY_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，exact \`headSha=${READY_HEAD}\`、\`event=push\`、\`status=completed\`、\`conclusion=success\`，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`；2026-08-26 production HTTP probes \`8/8\`，live route \`/styles/sty-11\` 与 \`/img/diagrams/sty-11-serverless-order-fulfillment.svg\` 均为 HTTP \`200\`，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match。Production Browser states \`4/4\`、wrapper interactions \`16/16\`、relation destination/H1/return \`12/12\`、exact source destinations \`40/40\`，每个状态 STY-12 actionable count \`0\` 且 diagnostics 完整为零；raw \`${PRODUCTION_RAW}\` 为 \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes / SHA-256 \`${PRODUCTION_RAW_SHA256}\`，Stage A production functional verdict \`PASS\`，screenshot evidence \`BLOCKED / NOT_ACCEPTED\`。Stage B local closure projection 为 64 个已完成主题、107 篇内容文档与 560 个受治理来源，持久故事进度仍为 \`8 / 20\`，当前 G009，下一项为 STY-12，STY-11 为 published/complete，STY-12 为 unpublished/pending/nonactionable；Stage B 三个独立 review slots 与 final readiness 均为 \`PENDING\`，deployment status 为 \`PENDING / NOT_RUN\`。`;
const PENDING_STAGE_B_REVIEW_LINES = Object.freeze([
  '- Closure date: `2026-08-26`.',
  `- Exact Stage A implementation head: \`${READY_HEAD}\`.`,
  `- Exact Pages run: \`${PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
  `- Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
  `- Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
  '- Required production HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.',
  `- Reviewed production SVG: HTTP \`200\`; MIME \`${PRODUCTION_SVG.contentType}\`; \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
  `- Stage A Browser raw: \`${LOCAL_RAW}\`; \`${LOCAL_RAW_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${LOCAL_RAW_SHA256}\`.`,
  `- Stage A production Browser raw: \`${PRODUCTION_RAW}\`; \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_SHA256}\`.`,
  '- Functional production QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation checks `12/12`; exact source checks `40/40`; STY-12 actionable count `0`; diagnostics complete and empty.',
  '- Stage A production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three attempts were `CAPTURED_REJECTED`; no visual PASS is claimed.',
  '- Projection: `64 completed topics / 107 content documents / 560 governed sources`.',
  '- STY-11 target: `published / complete`.',
  '- STY-12 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.',
  `- Immediate immutable history: complete Batch 11 review SHA-256 \`${IMMEDIATE_REVIEW_HASH}\`; backlog suffix \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\`.`,
  '- Exact Stage B reviewed head: `PENDING`.',
  '- Independent Stage B code/spec/security review: `PENDING`; findings: `PENDING`.',
  '- Independent Stage B content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.',
  '- Independent Stage B architecture/invariant review: `PENDING`; blockers: `PENDING`.',
  '- Final Stage B review judgment: `PENDING`.',
  '- Stage B scope boundary: `STAGE_B`.',
  '- Stage B deployment status: `PENDING / NOT_RUN`.',
  '- Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.',
]);

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
function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：** '));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice('- **当前发布基线：** '.length);
}
function assertImmediateHistory(reviewBytes = immediateReview, backlogSource = backlog) {
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_HASH, 'complete immediate Batch 11 review bytes');
  const suffix = currentReleaseBaseline(backlogSource);
  assert.match(suffix, /^2026-08-20 G009 Batch 11 已完成 STY-10/u);
  assert.equal(sha256(suffix), IMMEDIATE_BACKLOG_SUFFIX_HASH, 'complete immediate STY-10 backlog suffix');
}
function assertStageBBacklog(source = backlog) {
  const sty11 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-11 /u.test(line));
  const sty12 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-12 /u.test(line));
  assert.deepEqual(sty11, [STY11_CLOSURE_LINE], 'one exact checked STY-11 closure line');
  assert.equal(sty12.length, 1, 'one canonical STY-12 backlog line');
  assert.match(sty12[0], /^- \[ \] \*\*STY-12 P1｜Micro-Frontend\*\*/u);
  const closureBaselines = source.split(/\r?\n/u).filter((line) => line.startsWith(STAGE_B_CLOSURE_BASELINE_LABEL));
  assert.deepEqual(closureBaselines, [`${STAGE_B_CLOSURE_BASELINE_LABEL}${CURRENT_BASELINE_PREFIX}`], 'one exact current Batch 12 closure baseline');
  assertImmediateHistory(immediateReview, source);
}
function markdownSection(source, heading) {
  const marker = `## ${heading}\n\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${heading} section exists`);
  const contentStart = start + marker.length;
  const end = source.indexOf('\n## ', contentStart);
  return source.slice(contentStart, end === -1 ? source.length : end).trim();
}
function assertExactKeys(value, expected, label) {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} exact keys`);
}
function assertFinalReview(source = review) {
  assert.ok(source, `${REVIEW} exists`);
  assert.match(source, /^# G009 Batch 12 Stage A Review$/mu);
  assert.match(source, /Projection: `63 completed topics \/ 107 content documents \/ 560 governed sources`/u);
  assert.match(source, /STY-11: `published \/ pending`/u);
  assert.match(source, /STY-12: `unpublished \/ pending \/ non-actionable`; actionable route count: `0`/u);
  assert.match(source, /This record binds the exact candidate, Browser evidence, regression-guard head and three zero-finding independent reviews as the final Stage A READY checkpoint, and now binds its exact production publication below\. It does not close the backlog or run Stage B\./u);
  for (const [path, [bytes, hash]] of STABLE_IDENTITIES) {
    assert.ok(source.includes(`| \`${path}\` | ${bytes.toLocaleString('en-US')} | \`${hash}\` |`), `${path} exact identity`);
  }
  assert.ok(source.includes(`Complete immediate STY-10 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\``));
  assert.ok(source.includes(`Complete immediate STY-10 backlog suffix SHA-256: \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\``));
  assert.match(source, /Governed STY-11 sources: `11`; remote anchors per state: `10`/u);
  assert.match(source, /Exactly one STY-11 citation is `manifest_primary`/u);
  assert.ok(source.includes(`Exact remediation implementation candidate head: \`${CANDIDATE_HEAD}\``));
  assert.ok(source.includes(`Raw Browser JSON: \`${LOCAL_RAW}\`; bytes: \`${LOCAL_RAW_BYTES.toLocaleString('en-US')}\`; SHA-256: \`${LOCAL_RAW_SHA256}\``));
  assert.match(source, /Functional Browser QA: `PASS`; states `4\/4`; wrapper interactions `16\/16`; relation href\/H1\/return observations `12\/12`; source href\/target\/rel observations `40\/40`/u);
  assert.match(source, /SVG loaded in every state: source `2400x3600`; rendered `800x1200`; observed asset bytes `21,881`/u);
  assert.match(source, /STY-12 actionable count: `0` per state/u);
  assert.match(source, /Diagnostics are complete and empty in every state: warning\/error logs `0`, Runtime\/Log events `0`, `hasMore=false`, `truncated=false`/u);
  assert.match(source, /Screenshot evidence: `BLOCKED \/ NOT_ACCEPTED`/u);
  assert.match(source, /Exactly three fresh full-page attempts are `CAPTURED_REJECTED`; original bytes were inspected; no fourth attempt was made/u);
  assert.equal(markdownSection(source, 'Independent review checkpoint'), FINAL_STAGE_A_CHECKPOINT.join('\n'), 'exact final Stage A checkpoint');
  assert.doesNotMatch(source, /Stage B (?:review judgment|deployment status): `(?!PENDING|NOT_RUN)/u);
  assert.doesNotMatch(source, /Screenshot evidence: `PASS`|Stage B deployment status: `SUCCESS`/u);
}

function assertPendingStageBReview(source = review) {
  assertProductionReview(source);
  assert.equal(markdownSection(source, 'Stage B closure candidate'), PENDING_STAGE_B_REVIEW_LINES.join('\n'), 'exact pending Stage B closure section');
  assert.equal(source.split('## Stage B closure candidate').length - 1, 1, 'one Stage B closure section');
  assert.doesNotMatch(source, /^## Stage B production deployment$/mu);
  assert.doesNotMatch(source, /Independent Stage B .*`(?:READY|APPROVE|CONTENT READY|CLEAR)|Final Stage B (?:review judgment|readiness): `READY`|Stage B deployment status: `SUCCESS`/u);
}

function assertProductionReview(source = review) {
  assertFinalReview(source);
  assert.equal(markdownSection(source, 'Stage A production deployment'), [
    `- Exact published Stage A READY head: \`${READY_HEAD}\`.`,
    `- Exact Pages push run: \`${PRODUCTION_PAGES.runId}\`; \`headSha=${READY_HEAD}\`; workflow: \`completed / success\`.`,
    `- Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
    `- Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
    '- The workflow, build and deploy identities bind the exact reviewed READY head; no evidence-only run is substituted.',
    '',
    '| Production route | Status | Content type |',
    '| --- | ---: | --- |',
    ...PRODUCTION_ROUTES.map(({path, status, contentType}) => `| \`${path}\` | \`${status}\` | \`${contentType}\` |`),
    '',
    '- Required HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.',
    `- Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
    `- Production raw Browser JSON: \`${PRODUCTION_RAW}\`; \`${PRODUCTION_RAW_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_SHA256}\`.`,
    '- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `16/16`; relation href/H1/return checks `12/12`; source href/target/rel checks `40/40`.',
    '- Relation destinations used direct exact-href navigation followed by Browser back; no physical relation click is claimed.',
    '- SVG geometry: source `viewBox="0 0 2400 3600"` and `2400x3600`; Browser-natural `100x150`; rendered `800x1200`; STY-12 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.',
    '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED`; all repeated article sections or the architecture diagram, and the mobile attempt also contained a large blank interval and omitted faithful continuous diagram coverage.',
    '- No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.',
    '- Stage A deployment status: `SUCCESS`; functional production status: `PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.',
    '- Scope remains `STAGE_A_ONLY`; backlog, generated projection, Stage B and STY-12 are unchanged.',
  ].join('\n'), 'exact Stage A production section');
}

function assertLocalEvidence(value) {
  assert.ok(value, `${LOCAL_RAW} exists`);
  assert.equal(value.candidateHead, CANDIDATE_HEAD);
  assert.deepEqual(value.stateOrder, STATES);
  assert.deepEqual(value.collection.observedSvgAsset, {
    source: 'Browser pageAssets bundle',
    contentType: 'image/svg+xml',
    bytes: 21_881,
    sha256: STABLE_IDENTITIES.get(SVG)[1],
    viewBox: '0 0 2400 3600',
    bundleFailures: 0,
  });
  const stateDiagnosticContinuity = STATES.map((scope, index) => {
    const [afterSequence, cursor] = DIAGNOSTIC_PAGES[index];
    return {afterSequence, cursor, count: 0, hasMore: false, truncated: false, scope};
  });
  assert.deepEqual(value.collection.diagnosticContinuity, [
    ...stateDiagnosticContinuity,
    {afterSequence: 25, cursor: 372, count: 0, hasMore: false, truncated: false, scope: 'whole session'},
  ]);
  for (const [index, stateName] of STATES.entries()) {
    const state = value.states[stateName];
    assert.ok(state, `${stateName} exists`);
    const desktop = stateName.startsWith('desktop');
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark', `${stateName} theme`);
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844}, `${stateName} viewport`);
    assert.deepEqual(state.geometry.page, desktop
      ? {clientWidth: 1440, scrollWidth: 1440, clientHeight: 1000, scrollHeight: 10_881}
      : {clientWidth: 390, scrollWidth: 390, clientHeight: 844, scrollHeight: 15_730}, `${stateName} page geometry`);
    assert.deepEqual(state.geometry.wrappers, WRAPPER_LABELS.map((label, wrapperIndex) => ({
      label,
      clientWidth: desktop ? 800 : 358,
      scrollWidth: WRAPPER_SCROLL_WIDTHS[wrapperIndex],
    })), `${stateName} exact wrapper geometry`);
    assert.equal(state.interactions.length, 4, `${stateName} interactions`);
    for (const [wrapperIndex, interaction] of state.interactions.entries()) {
      const expectedDelta = desktop && wrapperIndex === 0 ? 0 : 40;
      assert.equal(interaction.index, wrapperIndex);
      assert.equal(interaction.label, WRAPPER_LABELS[wrapperIndex]);
      assert.equal(interaction.key, 'ArrowRight');
      assert.equal(interaction.delta, expectedDelta);
      assert.deepEqual({focus: interaction.before.focus, focusVisible: interaction.before.focusVisible, outlineWidth: interaction.before.outlineWidth, scrollLeft: interaction.before.scrollLeft}, {focus: true, focusVisible: true, outlineWidth: '3px', scrollLeft: 0});
      assert.deepEqual({focus: interaction.after.focus, focusVisible: interaction.after.focusVisible, outlineWidth: interaction.after.outlineWidth, scrollLeft: interaction.after.scrollLeft}, {focus: true, focusVisible: true, outlineWidth: '3px', scrollLeft: expectedDelta});
      assert.match(interaction.before.outline, /solid 3px$/u);
      assert.match(interaction.after.outline, /solid 3px$/u);
    }
    assert.deepEqual(state.relations.map(({href, expectedH1, h1, visibleCount, returnedToArticle}) => [href, expectedH1, h1, visibleCount, returnedToArticle]), RELATIONS.map(([href, h1]) => [href, h1, h1, 1, true]), `${stateName} exact relation destination/H1/return`);
    assert.deepEqual(state.geometry.sources, SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})), `${stateName} exact source links`);
    assert.deepEqual(state.geometry.svg, {
      loaded: true,
      viewBox: '0 0 2400 3600',
      sourceWidth: 2400,
      sourceHeight: 3600,
      naturalWidth: 100,
      naturalHeight: 150,
      renderedWidth: 800,
      renderedHeight: 1200,
      src: '/tego-arch/assets/images/sty-11-serverless-order-fulfillment-a95eeababb40ed1cd544b8cd067271d5.svg',
      observedAssetBytes: 21_881,
    }, `${stateName} exact SVG`);
    assert.equal(state.geometry.sty12, 0, `${stateName} STY-12 actionable count`);
    assert.deepEqual(state.logs, [], `${stateName} warning/error logs`);
    assert.deepEqual(state.diagnostics.events, [], `${stateName} Runtime/Log events`);
    assert.equal(state.diagnostics.pages.length, 1, `${stateName} diagnostic pagination`);
    assert.deepEqual({hasMore: state.diagnostics.hasMore, truncated: state.diagnostics.truncated}, {hasMore: false, truncated: false});
    const [afterSequence, cursor] = DIAGNOSTIC_PAGES[index];
    assert.deepEqual(state.diagnostics.pages[0], {afterSequence, cursor, count: 0, hasMore: false, truncated: false}, `${stateName} exact diagnostic page`);
    assert.equal(index, STATES.indexOf(stateName));
  }
  assert.deepEqual(value.functionalSummary, {status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 12, sourceObservations: 40, sty12ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPagesTerminal: true, diagnosticsTruncated: false});
  assert.deepEqual({status: value.screenshotEvidence.status, attempted: value.screenshotEvidence.attempted, accepted: value.screenshotEvidence.accepted, noFourthAttempt: value.screenshotEvidence.noFourthAttempt, originalBytesInspected: value.screenshotEvidence.originalBytesInspected}, {status: 'BLOCKED / NOT_ACCEPTED', attempted: 3, accepted: 0, noFourthAttempt: true, originalBytesInspected: true});
  assert.equal(value.screenshotEvidence.attempts.length, 3);
  for (const [index, attempt] of value.screenshotEvidence.attempts.entries()) {
    const [state, bytes, hash, width, height] = SCREENSHOT_ATTEMPTS[index];
    assert.deepEqual({state: attempt.state, status: attempt.status, bytes: attempt.bytes, sha256: attempt.sha256, format: attempt.format, width: attempt.width, height: attempt.height, magic: attempt.magic, uniqueByteValues: attempt.uniqueByteValues}, {state, status: 'CAPTURED_REJECTED', bytes, sha256: hash, format: 'JPEG/JFIF', width, height, magic: 'ffd8ffe000104a4649460001', uniqueByteValues: 256});
    assert.match(attempt.reason, /repeat|blank|omit/iu);
  }
}

function assertProductionEvidence(value) {
  assert.ok(value, `${PRODUCTION_RAW} exists`);
  assertExactKeys(value, ['implementationHead', 'pages', 'probes', 'collection', 'stateOrder', 'states', 'functionalSummary', 'screenshotEvidence'], 'production evidence');
  assert.equal(value.implementationHead, READY_HEAD);
  assertExactKeys(value.pages, Object.keys(PRODUCTION_PAGES), 'production Pages identity');
  assert.deepEqual(value.pages, PRODUCTION_PAGES);
  assertExactKeys(value.probes, ['routes', 'svg'], 'production probes');
  assert.deepEqual(value.probes.routes, PRODUCTION_ROUTES);
  for (const route of value.probes.routes) assertExactKeys(route, ['path', 'status', 'contentType'], `route ${route.path}`);
  assertExactKeys(value.probes.svg, ['url', 'status', 'contentType', 'bytes', 'sha256'], 'production SVG probe');
  assert.deepEqual(value.probes.svg, PRODUCTION_SVG);
  assertExactKeys(value.collection, ['browser', 'fresh', 'servedUrl', 'session', 'build', 'browserBindingId', 'observedSvgAsset', 'diagnosticContinuity'], 'production collection');
  assert.equal(value.collection.browser, 'Codex in-app Browser only');
  assert.equal(value.collection.fresh, true);
  assert.equal(value.collection.servedUrl, 'https://sealday.github.io/tego-arch/styles/sty-11');
  assert.equal(value.collection.session, 'sty11-stage-a-production-iab-20260826');
  assert.equal(value.collection.build, `GitHub Pages exact Stage A READY head ${READY_HEAD}; push run ${PRODUCTION_PAGES.runId}; build job ${PRODUCTION_PAGES.buildJobId}; deploy job ${PRODUCTION_PAGES.deployJobId}`);
  assert.equal(value.collection.browserBindingId, '-4688-49ea-8e04-9ca7ed8efe48');
  assertExactKeys(value.collection.observedSvgAsset, ['source', 'contentType', 'bytes', 'sha256', 'viewBox', 'bundleFailures'], 'observed production SVG');
  assert.deepEqual(value.collection.observedSvgAsset, {
    source: 'production Browser pageAssets bundle',
    contentType: 'image/svg+xml',
    bytes: 21_881,
    sha256: PRODUCTION_SVG.sha256,
    viewBox: '0 0 2400 3600',
    bundleFailures: 0,
  });
  const stateDiagnosticContinuity = STATES.map((scope, index) => {
    const [afterSequence, cursor] = PRODUCTION_DIAGNOSTIC_PAGES[index];
    return {afterSequence, cursor, count: 0, hasMore: false, truncated: false, scope};
  });
  assert.deepEqual(value.collection.diagnosticContinuity, [
    ...stateDiagnosticContinuity,
    {afterSequence: 27, cursor: 369, count: 0, hasMore: false, truncated: false, scope: 'whole session'},
  ]);
  for (const page of value.collection.diagnosticContinuity) assertExactKeys(page, ['afterSequence', 'cursor', 'count', 'hasMore', 'truncated', 'scope'], `diagnostic continuity ${page.scope}`);
  assert.deepEqual(value.stateOrder, STATES);
  assertExactKeys(value.states, STATES, 'production states');
  for (const [index, stateName] of STATES.entries()) {
    const state = value.states[stateName];
    const desktop = stateName.startsWith('desktop');
    assertExactKeys(state, ['theme', 'viewport', 'geometry', 'interactions', 'relations', 'logs', 'diagnostics'], `${stateName} state`);
    assert.equal(state.theme, stateName.endsWith('Light') ? 'light' : 'dark', `${stateName} theme`);
    assertExactKeys(state.viewport, ['width', 'height'], `${stateName} viewport`);
    assert.deepEqual(state.viewport, desktop ? {width: 1440, height: 1000} : {width: 390, height: 844}, `${stateName} viewport`);
    assertExactKeys(state.geometry, ['page', 'wrappers', 'sources', 'svg', 'sty12'], `${stateName} geometry`);
    assertExactKeys(state.geometry.page, ['clientWidth', 'scrollWidth', 'clientHeight', 'scrollHeight'], `${stateName} page geometry`);
    assert.deepEqual(state.geometry.page, desktop
      ? {clientWidth: 1440, scrollWidth: 1440, clientHeight: 1000, scrollHeight: 10_881}
      : {clientWidth: 390, scrollWidth: 390, clientHeight: 844, scrollHeight: 15_730}, `${stateName} page geometry`);
    assert.deepEqual(state.geometry.wrappers, WRAPPER_LABELS.map((label, wrapperIndex) => ({
      label,
      clientWidth: desktop ? 800 : 358,
      scrollWidth: WRAPPER_SCROLL_WIDTHS[wrapperIndex],
    })), `${stateName} wrappers`);
    for (const wrapper of state.geometry.wrappers) assertExactKeys(wrapper, ['label', 'clientWidth', 'scrollWidth'], `${stateName} wrapper`);
    assert.equal(state.interactions.length, 4, `${stateName} interactions`);
    for (const [wrapperIndex, interaction] of state.interactions.entries()) {
      const expectedDelta = desktop && wrapperIndex === 0 ? 0 : 40;
      assertExactKeys(interaction, ['index', 'label', 'key', 'delta', 'before', 'after'], `${stateName} interaction ${wrapperIndex}`);
      assert.deepEqual({index: interaction.index, label: interaction.label, key: interaction.key, delta: interaction.delta}, {index: wrapperIndex, label: WRAPPER_LABELS[wrapperIndex], key: 'ArrowRight', delta: expectedDelta});
      for (const phase of ['before', 'after']) assertExactKeys(interaction[phase], ['focus', 'focusVisible', 'outlineWidth', 'outline', 'scrollLeft'], `${stateName} interaction ${wrapperIndex} ${phase}`);
      assert.deepEqual({focus: interaction.before.focus, focusVisible: interaction.before.focusVisible, outlineWidth: interaction.before.outlineWidth, scrollLeft: interaction.before.scrollLeft}, {focus: true, focusVisible: true, outlineWidth: '3px', scrollLeft: 0});
      assert.deepEqual({focus: interaction.after.focus, focusVisible: interaction.after.focusVisible, outlineWidth: interaction.after.outlineWidth, scrollLeft: interaction.after.scrollLeft}, {focus: true, focusVisible: true, outlineWidth: '3px', scrollLeft: expectedDelta});
      assert.match(interaction.before.outline, /solid 3px$/u);
      assert.match(interaction.after.outline, /solid 3px$/u);
    }
    assert.deepEqual(state.relations.map(({href, expectedH1, h1, visibleCount, returnedToArticle}) => [href, expectedH1, h1, visibleCount, returnedToArticle]), RELATIONS.map(([href, h1]) => [href, h1, h1, 1, true]), `${stateName} relations`);
    for (const relation of state.relations) {
      assertExactKeys(relation, ['href', 'expectedH1', 'h1', 'visibleCount', 'returnedToArticle', 'navigation'], `${stateName} relation`);
      assert.equal(relation.navigation, 'direct exact-href navigation followed by Browser back; no physical relation click claimed');
    }
    assert.deepEqual(state.geometry.sources, SOURCE_HREFS.map((href) => ({href, target: '_blank', rel: 'noopener noreferrer'})), `${stateName} sources`);
    for (const source of state.geometry.sources) assertExactKeys(source, ['href', 'target', 'rel'], `${stateName} source`);
    assertExactKeys(state.geometry.svg, ['loaded', 'viewBox', 'sourceWidth', 'sourceHeight', 'naturalWidth', 'naturalHeight', 'renderedWidth', 'renderedHeight', 'src', 'observedAssetBytes'], `${stateName} SVG`);
    assert.deepEqual(state.geometry.svg, {
      loaded: true,
      viewBox: '0 0 2400 3600',
      sourceWidth: 2400,
      sourceHeight: 3600,
      naturalWidth: 100,
      naturalHeight: 150,
      renderedWidth: 800,
      renderedHeight: 1200,
      src: '/tego-arch/assets/images/sty-11-serverless-order-fulfillment-a95eeababb40ed1cd544b8cd067271d5.svg',
      observedAssetBytes: 21_881,
    }, `${stateName} SVG`);
    assert.equal(state.geometry.sty12, 0, `${stateName} STY-12 actionable count`);
    assert.deepEqual(state.logs, [], `${stateName} logs`);
    assertExactKeys(state.diagnostics, ['events', 'pages', 'hasMore', 'truncated'], `${stateName} diagnostics`);
    assert.deepEqual(state.diagnostics.events, [], `${stateName} diagnostic events`);
    assert.deepEqual({hasMore: state.diagnostics.hasMore, truncated: state.diagnostics.truncated}, {hasMore: false, truncated: false});
    const [afterSequence, cursor] = PRODUCTION_DIAGNOSTIC_PAGES[index];
    assert.deepEqual(state.diagnostics.pages, [{afterSequence, cursor, count: 0, hasMore: false, truncated: false}], `${stateName} diagnostic page`);
    assertExactKeys(state.diagnostics.pages[0], ['afterSequence', 'cursor', 'count', 'hasMore', 'truncated'], `${stateName} diagnostic page`);
  }
  assertExactKeys(value.functionalSummary, ['status', 'states', 'wrapperInteractions', 'relationObservations', 'sourceObservations', 'sty12ActionableTotal', 'warningErrorLogs', 'runtimeAndLogEvents', 'diagnosticPagesTerminal', 'diagnosticsTruncated'], 'production functional summary');
  assert.deepEqual(value.functionalSummary, {status: 'PASS', states: 4, wrapperInteractions: 16, relationObservations: 12, sourceObservations: 40, sty12ActionableTotal: 0, warningErrorLogs: 0, runtimeAndLogEvents: 0, diagnosticPagesTerminal: true, diagnosticsTruncated: false});
  assertExactKeys(value.screenshotEvidence, ['status', 'attempted', 'accepted', 'noFourthAttempt', 'originalBytesInspected', 'storage', 'attempts'], 'production screenshots');
  assert.deepEqual({status: value.screenshotEvidence.status, attempted: value.screenshotEvidence.attempted, accepted: value.screenshotEvidence.accepted, noFourthAttempt: value.screenshotEvidence.noFourthAttempt, originalBytesInspected: value.screenshotEvidence.originalBytesInspected, storage: value.screenshotEvidence.storage}, {status: 'BLOCKED / NOT_ACCEPTED', attempted: 3, accepted: 0, noFourthAttempt: true, originalBytesInspected: true, storage: 'Rejected screenshot originals retained only in the active IAB production evidence session; no screenshot file is tracked.'});
  assert.equal(value.screenshotEvidence.attempts.length, 3);
  for (const [index, attempt] of value.screenshotEvidence.attempts.entries()) {
    const [state, bytes, hash, width, height] = PRODUCTION_SCREENSHOT_ATTEMPTS[index];
    assertExactKeys(attempt, ['state', 'status', 'reason', 'bytes', 'sha256', 'format', 'width', 'height', 'magic', 'uniqueByteValues'], `production screenshot ${index + 1}`);
    assert.deepEqual({state: attempt.state, status: attempt.status, bytes: attempt.bytes, sha256: attempt.sha256, format: attempt.format, width: attempt.width, height: attempt.height, magic: attempt.magic, uniqueByteValues: attempt.uniqueByteValues}, {state, status: 'CAPTURED_REJECTED', bytes, sha256: hash, format: 'JPEG/JFIF', width, height, magic: 'ffd8ffe000104a4649460001', uniqueByteValues: 256});
    assert.match(attempt.reason, /repeat|blank|omit/iu);
  }
}

const [review, raw, productionRaw, stageBProductionRaw, immediateReview, backlog, status, manifest, documents, stableBytes] = await Promise.all([
  optional(REVIEW, 'utf8'),
  optional(LOCAL_RAW),
  optional(PRODUCTION_RAW),
  optional(STAGE_B_PRODUCTION_RAW),
  required(IMMEDIATE_REVIEW),
  required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  readContentDocuments('content'),
  Promise.all([...STABLE_IDENTITIES.keys()].map((path) => required(path))),
]);

test('locks the complete immediate STY-10 review and backlog suffix with mutation sensitivity', () => {
  assertImmediateHistory();
  for (const changedReview of [Buffer.concat([immediateReview, Buffer.from('x')]), immediateReview.subarray(0, -1)]) {
    assert.throws(() => assertImmediateHistory(changedReview), assert.AssertionError);
  }
  const suffix = currentReleaseBaseline(backlog);
  for (const changedSuffix of [`${suffix}x`, suffix.slice(0, -1)]) {
    const changedBacklog = backlog.replace(suffix, changedSuffix);
    assert.notEqual(changedBacklog, backlog, 'historical suffix mutation applies');
    assert.throws(() => assertImmediateHistory(immediateReview, changedBacklog), assert.AssertionError);
  }
});

test('projects exact STY-11 Stage B closure while STY-12 remains sole unpublished pending non-actionable next', () => {
  assert.deepEqual({
    completed: status.completed_topics,
    documents: status.content_documents,
    sources: status.governed_sources,
  }, EXPECTED_STAGE_B);
  const current = documents.find(({metadata}) => metadata.topic_id === CURRENT_TOPIC);
  assert.ok(current, 'STY-11 is published as a content document');
  assertStageBBacklog();
  assert.equal(documents.some(({metadata}) => metadata.topic_id === NEXT_TOPIC), false, 'STY-12 is unpublished');
  assert.match(backlog, /^- \[ \] \*\*STY-12 P1｜Micro-Frontend\*\*/mu);
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-12'), false, 'STY-12 is non-actionable');
  const manifestCurrent = manifest.topics.find(({id}) => id === CURRENT_TOPIC);
  const manifestNext = manifest.topics.find(({id}) => id === NEXT_TOPIC);
  assert.deepEqual({published: manifestCurrent?.published, status: manifestCurrent?.status?.value}, {published: true, status: 'complete'});
  assert.deepEqual({published: manifestNext?.published, status: manifestNext?.status?.value}, {published: false, status: 'pending'});
  const staleNext = backlog.replace('下一项为 STY-12', '下一项为 STY-11');
  assert.notEqual(staleNext, backlog, 'current next-topic mutation applies');
  assert.throws(() => assertStageBBacklog(staleNext), assert.AssertionError);
});

test('requires published reciprocal adjacency metadata for both STY-11 adjacent topics', () => {
  for (const topicId of ['STY-06', 'STY-09']) {
    const peer = documents.find(({metadata}) => metadata.topic_id === topicId);
    assert.ok(peer, `${topicId} is published`);
    assert.ok(peer.metadata.adjacent_topics.includes(CURRENT_TOPIC), `${topicId} metadata reciprocates STY-11`);
    const withoutCurrent = {...peer.metadata, adjacent_topics: peer.metadata.adjacent_topics.filter((id) => id !== CURRENT_TOPIC)};
    assert.equal(withoutCurrent.adjacent_topics.includes(CURRENT_TOPIC), false, `${topicId} deletion mutation applies`);
  }
});

test('locks exact STY-11 article, ledger, Draw.io and SVG identities', () => {
  for (const [[path, [bytes, hash]], value] of [...STABLE_IDENTITIES].map((entry, index) => [entry, stableBytes[index]])) {
    assert.equal(value.length, bytes, `${path} bytes`);
    assert.equal(sha256(value), hash, `${path} SHA-256`);
  }
});

test('binds exact Stage A evidence and pending Stage B closure while Stage B production remains absent', () => {
  assertPendingStageBReview();
  assert.equal(raw.length, LOCAL_RAW_BYTES, `${LOCAL_RAW} exact bytes`);
  assert.equal(sha256(raw), LOCAL_RAW_SHA256, `${LOCAL_RAW} exact SHA-256`);
  assertLocalEvidence(raw && JSON.parse(raw));
  assert.equal(productionRaw.length, PRODUCTION_RAW_BYTES, `${PRODUCTION_RAW} exact bytes`);
  assert.equal(sha256(productionRaw), PRODUCTION_RAW_SHA256, `${PRODUCTION_RAW} exact SHA-256`);
  assertProductionEvidence(productionRaw && JSON.parse(productionRaw));
  assert.equal(stageBProductionRaw, undefined, `${STAGE_B_PRODUCTION_RAW} remains absent before Stage B deployment`);
});

test('rejects wrong review heads, weakened final verdicts, scope, deployment and visual overclaim mutations', () => {
  assertFinalReview();
  for (const [before, after] of [
    [IMMEDIATE_REVIEW_HASH, '0'.repeat(64)],
    [IMMEDIATE_BACKLOG_SUFFIX_HASH, '1'.repeat(64)],
    [`Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    [`Exact Browser evidence head: \`${EVIDENCE_HEAD}\`.`, `Exact Browser evidence head: \`${'1'.repeat(40)}\`.`],
    [`Exact independent review head: \`${REVIEW_GUARD_HEAD}\`.`, `Exact independent review head: \`${'2'.repeat(40)}\`.`],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`', 'Independent code/spec/security review: `NOT READY`; findings: `0`'],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`', 'Independent code/spec/security review: `READY / APPROVE`; findings: `1`'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `FAIL`; findings: `0`'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `1`'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`', 'Independent architecture/invariant review: `BLOCKED`; blockers: `0`'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `1`'],
    ['Final Stage A review judgment: `READY`', 'Final Stage A review judgment: `PENDING`'],
    ['Scope boundary: `STAGE_A_ONLY`', 'Scope boundary: `STAGE_B`'],
    ['Deployment status: `STAGE_A_SUCCESS / STAGE_B_NOT_RUN`', 'Deployment status: `STAGE_B_SUCCESS`'],
    ['Functional Browser QA: `PASS`', 'Functional Browser QA: `FAIL`'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`', 'Screenshot evidence: `PASS`'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertFinalReview(mutated), assert.AssertionError);
  }
  const stalePending = review.replace(FINAL_STAGE_A_CHECKPOINT.join('\n'), PENDING_STAGE_A_CHECKPOINT.join('\n'));
  assert.notEqual(stalePending, review, 'stale pending Stage A checkpoint mutation applies');
  assert.throws(() => assertFinalReview(stalePending), assert.AssertionError);
  for (const addition of ['\nStage B deployment status: `SUCCESS`.\n']) {
    assert.throws(() => assertFinalReview(`${review}${addition}`), assert.AssertionError);
  }
});

test('rejects changed Stage B evidence, stale next topic, premature verdicts, deployment and visual claims', () => {
  assertPendingStageBReview();
  for (const [before, after] of [
    [`Exact Stage A implementation head: \`${READY_HEAD}\`.`, `Exact Stage A implementation head: \`${'0'.repeat(40)}\`.`],
    [`Exact Pages run: \`${PRODUCTION_PAGES.runId}\`;`, 'Exact Pages run: `0`;'],
    [`Build job: \`${PRODUCTION_PAGES.buildJobId}\`;`, 'Build job: `0`;'],
    [`Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`;`, 'Deploy job: `0`;'],
    ['Required production HTML routes: `8/8`;', 'Required production HTML routes: `7/8`;'],
    [PRODUCTION_SVG.sha256, '3'.repeat(64)],
    [PRODUCTION_RAW_SHA256, '4'.repeat(64)],
    ['Projection: `64 completed topics / 107 content documents / 560 governed sources`.', 'Projection: `63 completed topics / 107 content documents / 560 governed sources`.'],
    ['STY-11 target: `published / complete`.', 'STY-11 target: `published / pending`.'],
    ['STY-12 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.', 'STY-11 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.'],
    ['Exact Stage B reviewed head: `PENDING`.', `Exact Stage B reviewed head: \`${READY_HEAD}\`.`],
    ['Independent Stage B code/spec/security review: `PENDING`; findings: `PENDING`.', 'Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.'],
    ['Independent Stage B content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.', 'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.'],
    ['Independent Stage B architecture/invariant review: `PENDING`; blockers: `PENDING`.', 'Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.'],
    ['Final Stage B review judgment: `PENDING`.', 'Final Stage B review judgment: `READY`.'],
    ['Stage B scope boundary: `STAGE_B`.', 'Stage B scope boundary: `STAGE_A_ONLY`.'],
    ['Stage B deployment status: `PENDING / NOT_RUN`.', 'Stage B deployment status: `SUCCESS`.'],
    ['Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.', 'Stage B screenshot status: `PASS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} Stage B mutation applies`);
    assert.throws(() => assertPendingStageBReview(mutated), assert.AssertionError);
  }
  assert.throws(() => assertPendingStageBReview(`${review}\n## Stage B production deployment\n\n- Fabricated success.\n`), assert.AssertionError);
});

test('rejects Browser head, state, geometry, interaction, navigation, source, SVG, diagnostics and screenshot mutations', () => {
  const evidence = raw && JSON.parse(raw);
  assertLocalEvidence(evidence);
  const mutations = [
    ['candidate head', (copy) => copy.candidateHead = '0'.repeat(40)],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['state order', (copy) => [copy.stateOrder[0], copy.stateOrder[1]] = [copy.stateOrder[1], copy.stateOrder[0]]],
    ['duplicate wrapper', (copy) => copy.states.desktopLight.geometry.wrappers.push(structuredClone(copy.states.desktopLight.geometry.wrappers[0]))],
    ['wrapper order', (copy) => [copy.states.desktopDark.geometry.wrappers[0], copy.states.desktopDark.geometry.wrappers[1]] = [copy.states.desktopDark.geometry.wrappers[1], copy.states.desktopDark.geometry.wrappers[0]]],
    ['client width', (copy) => copy.states.mobileLight.geometry.wrappers[0].clientWidth += 1],
    ['scroll width', (copy) => copy.states.desktopLight.geometry.wrappers[1].scrollWidth += 1],
    ['focus visible', (copy) => copy.states.mobileDark.interactions[0].before.focusVisible = false],
    ['outline', (copy) => copy.states.desktopDark.interactions[1].after.outlineWidth = '2px'],
    ['ArrowRight delta', (copy) => copy.states.mobileLight.interactions[0].delta = 39],
    ['relation H1', (copy) => copy.states.desktopLight.relations[0].h1 = 'fabricated'],
    ['relation return', (copy) => copy.states.mobileDark.relations[1].returnedToArticle = false],
    ['source href', (copy) => copy.states.desktopDark.geometry.sources[0].href = 'https://example.invalid/fabricated'],
    ['unloaded SVG', (copy) => copy.states.mobileLight.geometry.svg.loaded = false],
    ['resized SVG', (copy) => copy.states.desktopDark.geometry.svg.renderedWidth = 799],
    ['STY-12 fabrication', (copy) => copy.states.desktopLight.geometry.sty12 = 1],
    ['state continuity cursor', (copy) => copy.collection.diagnosticContinuity[2].cursor -= 1],
    ['whole-session diagnostic cursor', (copy) => copy.collection.diagnosticContinuity[4].cursor -= 1],
    ['state diagnostic afterSequence', (copy) => copy.states.desktopDark.diagnostics.pages[0].afterSequence -= 1],
    ['runtime event', (copy) => copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'})],
    ['diagnostic continuation', (copy) => copy.states.desktopLight.diagnostics.hasMore = true],
    ['truncated diagnostics', (copy) => copy.states.mobileLight.diagnostics.truncated = true],
    ['deleted screenshot attempt', (copy) => copy.screenshotEvidence.attempts.pop()],
    ['changed screenshot attempt', (copy) => copy.screenshotEvidence.attempts[0].sha256 = '1'.repeat(64)],
    ['visual PASS', (copy) => copy.screenshotEvidence.status = 'PASS'],
  ];
  assert.ok(mutations.length >= 22, 'at least 22 semantic Browser evidence mutations');
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.notDeepEqual(copy, evidence, `${label} mutation applies`);
    assert.throws(() => assertLocalEvidence(copy), assert.AssertionError, label);
  }
});

test('rejects production deployment, probe, semantic, additive, diagnostic, screenshot and review mutations', () => {
  const evidence = productionRaw && JSON.parse(productionRaw);
  assertProductionEvidence(evidence);
  const mutations = [
    ['implementation head', (copy) => copy.implementationHead = '0'.repeat(40)],
    ['additive top-level claim', (copy) => copy.fabricatedSuccess = true],
    ['Pages run', (copy) => copy.pages.runId += 1],
    ['Pages event', (copy) => copy.pages.event = 'workflow_dispatch'],
    ['Pages head', (copy) => copy.pages.headSha = '1'.repeat(40)],
    ['build conclusion', (copy) => copy.pages.buildConclusion = 'failure'],
    ['deploy job', (copy) => copy.pages.deployJobId += 1],
    ['additive Pages claim', (copy) => copy.pages.fabricated = 'PASS'],
    ['route order', (copy) => copy.probes.routes.reverse()],
    ['route path', (copy) => copy.probes.routes[4].path = '/tego-arch/styles/sty-12'],
    ['route status', (copy) => copy.probes.routes[4].status = 404],
    ['route type', (copy) => copy.probes.routes[7].contentType = 'text/plain'],
    ['additive route', (copy) => copy.probes.routes.push({path: '/fabricated', status: 200, contentType: 'text/html; charset=utf-8'})],
    ['SVG bytes', (copy) => copy.probes.svg.bytes += 1],
    ['SVG hash', (copy) => copy.probes.svg.sha256 = '2'.repeat(64)],
    ['additive SVG claim', (copy) => copy.probes.svg.fabricated = true],
    ['browser surface', (copy) => copy.collection.browser = 'Chrome'],
    ['build binding', (copy) => copy.collection.build = 'fabricated'],
    ['additive collection claim', (copy) => copy.collection.fabricated = 'PASS'],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['additive state', (copy) => copy.states.fabricated = structuredClone(copy.states.desktopLight)],
    ['state order', (copy) => copy.stateOrder.reverse()],
    ['wrapper order', (copy) => copy.states.desktopLight.geometry.wrappers.reverse()],
    ['interaction delta', (copy) => copy.states.desktopDark.interactions[1].after.scrollLeft += 1],
    ['relation H1', (copy) => copy.states.mobileLight.relations[0].h1 = 'fabricated'],
    ['relation navigation overclaim', (copy) => copy.states.mobileDark.relations[0].navigation = 'physically clicked'],
    ['source order', (copy) => copy.states.mobileDark.geometry.sources.reverse()],
    ['SVG render', (copy) => copy.states.desktopLight.geometry.svg.renderedWidth = 799],
    ['STY-12 fabrication', (copy) => copy.states.mobileDark.geometry.sty12 = 1],
    ['state continuity cursor', (copy) => copy.collection.diagnosticContinuity[2].cursor -= 1],
    ['whole-session continuity cursor', (copy) => copy.collection.diagnosticContinuity[4].cursor -= 1],
    ['diagnostic event', (copy) => copy.states.mobileLight.diagnostics.events.push({method: 'Runtime.exceptionThrown'})],
    ['diagnostic continuation', (copy) => copy.states.mobileDark.diagnostics.hasMore = true],
    ['diagnostic truncation', (copy) => copy.states.mobileDark.diagnostics.truncated = true],
    ['functional summary', (copy) => copy.functionalSummary.status = 'FAIL'],
    ['visual PASS', (copy) => copy.screenshotEvidence.status = 'PASS'],
    ['missing screenshot', (copy) => copy.screenshotEvidence.attempts.pop()],
    ['screenshot order', (copy) => copy.screenshotEvidence.attempts.reverse()],
    ['screenshot bytes', (copy) => copy.screenshotEvidence.attempts[0].bytes += 1],
    ['additive visual claim', (copy) => copy.screenshotEvidence.fabricatedVisualPass = true],
  ];
  assert.ok(mutations.length >= 36, 'production mutations cover deployment, every evidence group and additive claims');
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.notDeepEqual(copy, evidence, `${label} mutation applies`);
    assert.throws(() => assertProductionEvidence(copy), assert.AssertionError, label);
  }

  assertProductionReview();
  for (const [before, after] of [
    [`Exact published Stage A READY head: \`${READY_HEAD}\`.`, `Exact published Stage A READY head: \`${'0'.repeat(40)}\`.`],
    [`Exact Pages push run: \`${PRODUCTION_PAGES.runId}\`;`, 'Exact Pages push run: `0`;'],
    [`Build job: \`${PRODUCTION_PAGES.buildJobId}\`;`, 'Build job: `0`;'],
    [`Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`;`, 'Deploy job: `0`;'],
    ['Required HTML routes: `8/8`;', 'Required HTML routes: `7/8`;'],
    [PRODUCTION_RAW_SHA256, '3'.repeat(64)],
    ['Functional production QA: `PASS`;', 'Functional production QA: `PENDING`;'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`;', 'Screenshot evidence: `PASS`;'],
    ['No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.', 'Fabricated deployment and visual PASS are claimed.'],
    ['Stage A deployment status: `SUCCESS`;', 'Stage A deployment status: `PENDING`;'],
    ['Scope remains `STAGE_A_ONLY`;', 'Scope remains `STAGE_B`;'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} production-review mutation applies`);
    assert.throws(() => assertProductionReview(mutated), assert.AssertionError);
  }
});
