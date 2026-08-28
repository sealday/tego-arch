import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

const ARTICLE = 'content/styles/sty-09-pipes-and-filters.mdx';
const DRAWIO = 'diagrams/sty-09-pipes-filters-order-processing.drawio';
const SVG = 'static/img/diagrams/sty-09-pipes-filters-order-processing.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch10.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch10-stage-a-browser.json';
const PRODUCTION_RAW_BROWSER = 'docs/reviews/evidence/g009-batch10-stage-a-production-browser.json';
const STAGE_B_PRODUCTION_RAW_BROWSER = 'docs/reviews/evidence/g009-batch10-stage-b-production-browser.json';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch9.md';
const BACKLOG = 'docs/content-backlog.md';
const IMPLEMENTATION_HEAD = 'd2748e204cd55654d1cd5b6dce4fdc88ca95bbb4';
const EVIDENCE_HEAD = '1691a914037b25d363e33c6c3d5ab3b8a5bf2206';
const RAW_BROWSER_BYTES = 24_971;
const RAW_BROWSER_HASH = 'acc7c8154a8c6199cd92b8d68d258d7a0fb5e2e86eb8a1931219d36d9c72d7bf';
const PRODUCTION_HEAD = '50ba9d2b18617b3bed84c6e17ddb696665b5a434';
const PRODUCTION_RAW_BROWSER_BYTES = 26_937;
const PRODUCTION_RAW_BROWSER_HASH = 'f2c0e43de924aedb9afba39ec26500c869b42f170f4b46e3792003433aa953aa';
const STAGE_B_READY_HEAD = '9ae646d6a0bc63c58f09839727517e8a88e4919f';
const STAGE_B_PRODUCTION_RAW_BROWSER_BYTES = 26_934;
const STAGE_B_PRODUCTION_RAW_BROWSER_HASH = '21be024eb552c15512d0c2773e8b9589bc3358ad15db335c5d46160fb32610a2';
const STAGE_A_RAW_BROWSER_HASH = RAW_BROWSER_HASH;
const PRODUCTION_PAGES = Object.freeze({
  runId: 32_014_770_938,
  status: 'completed',
  conclusion: 'success',
  buildJobId: 95_341_784_622,
  buildStatus: 'completed',
  buildConclusion: 'success',
  deployJobId: 95_342_598_744,
  deployStatus: 'completed',
  deployConclusion: 'success',
});
const STAGE_B_PRODUCTION_PAGES = Object.freeze({
  runId: 32_020_346_025,
  status: 'completed',
  conclusion: 'success',
  buildJobId: 95_358_529_943,
  buildStatus: 'completed',
  buildConclusion: 'success',
  deployJobId: 95_359_241_767,
  deployStatus: 'completed',
  deployConclusion: 'success',
});
const PRODUCTION_ROUTES = Object.freeze([
  {path: '/', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles/sty-09', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles/sty-05', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles/sty-06', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/cases/apache-kafka-consumer-groups', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/quality-attributes/qa-03', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/paths/reliability-state', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/references', status: 200, contentType: 'text/html; charset=utf-8'},
]);
const PRODUCTION_SVG = Object.freeze({
  url: 'https://sealday.github.io/tego-arch/img/diagrams/sty-09-pipes-filters-order-processing.svg',
  status: 200,
  contentType: 'image/svg+xml',
  bytes: 25_205,
  sha256: '1568fc09dbb6637d54e66d0058d9479cbf2e59d990753489781a119a06fb1a29',
});
const IMMEDIATE_REVIEW_HASH = 'f7d0aba59dd69d6479bbfbdb6f9f3cf1befadcf076c44ff5f97f31d6452778ed';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = '3a8d6ccda815614132a33ca8ec2c0dca286628c20900d9e32a4403f0ffd56c6b';
const IMMEDIATE_BACKLOG_MARKER = '此前 G009 Batch 9 历史完成基线为：';
const LIVE_BATCH11_HISTORY_MARKER = '此前 G009 Batch 10 历史完成基线为：';
const STABLE_ARTIFACT_HASHES = new Map([
  [ARTICLE, '1dcf55ace2a6b8f30da94e81d36d9f79a16db400bc419c35318cc8dbe8eba7b6'],
  [DRAWIO, '36da252d3fe71b1f0c3df6db5a887677b83def7ee11f542f938c9d3027fbf97c'],
  [SVG, '1568fc09dbb6637d54e66d0058d9479cbf2e59d990753489781a119a06fb1a29'],
  [LEDGER, 'cc94104f499f07400785118fb791efed66d9d4588f7b3ba9de160eb031e29a7f'],
]);
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPERS = [
  '订单数据批处理与流处理双轨管道图，可横向滚动',
  '批处理轨与流处理轨八维机制对照表，可横向滚动',
  'Pipes and Filters 六类故障检测、响应、停止条件与人工所有者表，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/styles/sty-06', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
  ['/tego-arch/cases/apache-kafka-consumer-groups', '消费者组：用分区所有权组织可重放的智能体工作'],
  ['/tego-arch/quality-attributes/qa-03', '性能、延迟、吞吐与容量'],
  ['/tego-arch/paths/reliability-state', '可靠性与状态管理'],
];
const SOURCE_LINKS = [
  'https://learn.microsoft.com/en-us/azure/architecture/patterns/pipes-and-filters',
  'https://beam.apache.org/documentation/programming-guide/',
  'https://www.reactive-streams.org/',
  'https://www.gnu.org/software/bash/manual/html_node/Pipelines.html',
];
const STATE_CONTRACTS = Object.freeze({
  desktopLight: Object.freeze({
    theme: 'light', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1024, 1024], deltas: [0, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  desktopDark: Object.freeze({
    theme: 'dark', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1024, 1024], deltas: [0, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
  mobileLight: Object.freeze({
    theme: 'light', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1024, 1024], deltas: [40, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  mobileDark: Object.freeze({
    theme: 'dark', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1024, 1024], deltas: [40, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
});
const SVG_GEOMETRY = Object.freeze({
  loaded: true,
  naturalHeight: 150,
  naturalWidth: 120,
  renderedHeight: 1000,
  renderedWidth: 800,
  src: '/tego-arch/assets/images/sty-09-pipes-filters-order-processing-a183aff7774b7e91150caf303ac06eb8.svg',
});
const SCREENSHOT_REJECTION_REASON = 'The in-app Browser full-page capture repeated viewport content and omitted complete architecture-diagram coverage, so the original bytes cannot support trustworthy whole-page visual review.';
const SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-d2748e2-desktop-light.png', bytes: 1_488_746, sha256: '22383e2430533ad43dae9eb9e1bfee235e050ea8228363aa8428fe2d2e6383e9', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-d2748e2-desktop-dark.png', bytes: 1_519_296, sha256: '456460787a2ecf5c30c006ef35a8a8d8764c68d471d6848b5ac81497c563b766', kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-d2748e2-mobile-light.png', bytes: 618_851, sha256: '6e88baad8ec4f9899191936a82512edfc7bf096bf1cdf740e30d11e342a2a0fc', kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
]);
const PRODUCTION_SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-production-50ba9d2-desktop-light.png', bytes: 1_522_487, sha256: 'd360b123a7368fede7338e885d9bae2f136b92de330b80b79331ca07489a2363', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-production-50ba9d2-desktop-dark.png', bytes: 1_536_917, sha256: '49ce10dac3e4f89a3b0ee121f30036ffc91fcf6b1cdc86a173a2d051bb55b6d9', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-a-production-50ba9d2-mobile-light.png', bytes: 658_511, sha256: 'c18edf54f2e3aa5b2233a65713175073c66e2669555269a001abccc34919c88e', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
]);
const STAGE_B_PRODUCTION_SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-b-production-9ae646d-desktop-light.png', bytes: 1_666_011, sha256: '910bcd967bd80a5ec062a16bc502f484397af3e9ffa7e4c28e6ef513e3ff8bdd', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-b-production-9ae646d-desktop-dark.png', bytes: 1_681_064, sha256: '4974f256e5f22dcf097dea1e9cdfff1ef48bcc97f2374a29b97d7c15385cd4a3', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty09-stage-b-production-9ae646d-mobile-light.png', bytes: 658_511, sha256: 'c18edf54f2e3aa5b2233a65713175073c66e2669555269a001abccc34919c88e', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON},
]);
const STY09_CLOSURE_LINE = `- [x] **STY-09 P1｜Pipes and Filters**：批处理、流处理、背压和错误传播。Stage A 关闭证据：2026-08-17 review，commit [\`${PRODUCTION_HEAD}\`](https://github.com/sealday/tego-arch/commit/${PRODUCTION_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`，production HTML routes \`9/9\`，live route \`/styles/sty-09\` 与 \`/img/diagrams/sty-09-pipes-filters-order-processing.svg\` 均为 HTTP 200，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match，Stage A production Browser raw \`${PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes / SHA-256 \`${PRODUCTION_RAW_BROWSER_HASH}\`，functional verdict PASS；screenshot evidence BLOCKED / NOT_ACCEPTED。`;
const CURRENT_BASELINE_PREFIX = `2026-08-17 G009 Batch 10 已完成 STY-09，Stage A 发布基线为 [\`${PRODUCTION_HEAD}\`](https://github.com/sealday/tego-arch/commit/${PRODUCTION_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，exact \`headSha=${PRODUCTION_HEAD}\`、\`event=push\`、\`status=completed\`、\`conclusion=success\`，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`；2026-08-17 production HTTP probes \`9/9\`，live route \`/styles/sty-09\` 与 \`/img/diagrams/sty-09-pipes-filters-order-processing.svg\` 均为 HTTP \`200\`，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match。Production Browser states \`4/4\`、wrapper interactions \`12/12\`、relation destination/H1/return \`20/20\`、exact source destinations \`16/16\`，每个状态 STY-10 actionable count \`0\` 且 diagnostics 完整为零；raw \`${PRODUCTION_RAW_BROWSER}\` 为 \`${PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes / SHA-256 \`${PRODUCTION_RAW_BROWSER_HASH}\`，Stage A production functional verdict \`PASS\`，screenshot evidence \`BLOCKED / NOT_ACCEPTED\`。Stage B local closure projection 为 62 个已完成主题、105 篇内容文档与 544 个受治理来源，持久故事进度仍为 \`8 / 20\`，当前 G009，下一项为 STY-10，STY-09 为 published/complete，STY-10 为 unpublished/pending/nonactionable；Stage B 三个独立 review slots 与 final readiness 均为 \`PENDING\`，deployment status 为 \`PENDING / NOT_RUN\`。`;
const PENDING_STAGE_B_REVIEW_LINES = Object.freeze([
  '- Closure date: `2026-08-17`.',
  `- Exact Stage A implementation head: \`${PRODUCTION_HEAD}\`.`,
  `- Exact Pages run: \`${PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
  `- Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
  `- Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
  '- Required production HTML routes: `9/9`; every route returned `200` with `text/html; charset=utf-8`.',
  `- Reviewed production SVG: HTTP \`200\`; MIME \`${PRODUCTION_SVG.contentType}\`; \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
  `- Stage A Browser raw: \`${RAW_BROWSER}\`; \`${RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${STAGE_A_RAW_BROWSER_HASH}\`.`,
  `- Stage A production Browser raw: \`${PRODUCTION_RAW_BROWSER}\`; \`${PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_BROWSER_HASH}\`.`,
  '- Functional production QA: `PASS`; states `4/4`; wrapper interactions `12/12`; relation checks `20/20`; exact source checks `16/16`; STY-10 actionable count `0`; diagnostics complete and empty.',
  '- Stage A production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three attempts were `CAPTURED_REJECTED`; no visual PASS is claimed.',
  '- Projection: `62 completed topics / 105 content documents / 544 governed sources`.',
  '- STY-09 target: `published / complete`.',
  '- STY-10 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.',
  `- Immediate immutable history: complete Batch 9 review SHA-256 \`${IMMEDIATE_REVIEW_HASH}\`; backlog suffix \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\`.`,
  '- Exact Stage B reviewed head: `PENDING`.',
  '- Independent Stage B code/spec/security review: `PENDING`; findings: `PENDING`.',
  '- Independent Stage B content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`.',
  '- Independent Stage B architecture/invariant review: `PENDING`; blockers: `PENDING`.',
  '- Final Stage B review judgment: `PENDING`.',
  '- Stage B scope boundary: `STAGE_B`.',
  '- Stage B deployment status: `PENDING / NOT_RUN`.',
  '- Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.',
]);
const STAGE_B_REVIEWED_HEAD = '534c76a95e5fd9d39cb0aa650f13ee9a1fa28368';
const FINAL_STAGE_B_REVIEW_LINES = Object.freeze([
  ...PENDING_STAGE_B_REVIEW_LINES.slice(0, 15),
  `- Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\`.`,
  '- Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.',
  '- Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
  '- Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
  '- Final Stage B review judgment: `READY`.',
  '- Stage B scope boundary: `STAGE_B`.',
  '- Stage B deployment status: `SUCCESS / PASS`.',
  '- Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.',
]);

const rootUrl = new URL('../', import.meta.url);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
async function required(path, encoding) { return readFile(new URL(path, rootUrl), encoding); }
async function optional(path, encoding) {
  try { return await required(path, encoding); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; }
}
function section(source, heading) {
  assert.ok(source, `${REVIEW} exists`);
  const starts = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const current = starts.filter((match) => match[1] === heading);
  assert.equal(current.length, 1, `${heading} section`);
  const next = starts.find((match) => match.index > current[0].index);
  return source.slice(current[0].index + current[0][0].length, next?.index ?? source.length).trim();
}
function currentReleaseBaseline(source) {
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(lines.length, 1, 'one current release baseline');
  return lines[0].slice('- **当前发布基线：** '.length);
}
function assertStageBImmediateHistory(reviewBytes = immediateReviewBytes, backlogSource = backlog) {
  assert.equal(sha256(reviewBytes), IMMEDIATE_REVIEW_HASH, `${IMMEDIATE_REVIEW} complete immutable bytes`);
  const baseline = currentReleaseBaseline(backlogSource);
  const liveParts = baseline.split(LIVE_BATCH11_HISTORY_MARKER);
  assert.equal(liveParts.length, 2, 'split live Batch 11 prefix from immutable Batch 10 history');
  const [livePrefix, batch10History] = liveParts;
  for (const literal of [
    '2026-08-20 G009 Batch 11 已完成 STY-10',
    'Stage B local closure projection 为 63 个已完成主题、106 篇内容文档与 550 个受治理来源',
    '当前 G009，下一项为 STY-11',
    'STY-10 为 published/complete',
    'STY-11 为 unpublished/pending/nonactionable',
    'deployment status 为 `PENDING / NOT_RUN`',
  ]) assert.ok(livePrefix.includes(literal), `live Batch 11 literal: ${literal}`);
  assert.doesNotMatch(livePrefix, /下一项为 STY-10/u);
  assert.ok(batch10History.startsWith(CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER), 'exact historical Batch 10 prefix');
  const suffix = batch10History.slice((CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER).length);
  assert.match(suffix, /^2026-08-16 G009 Batch 9 已完成 STY-08/u);
  assert.equal(sha256(suffix), IMMEDIATE_BACKLOG_SUFFIX_HASH, 'complete immediate STY-08 backlog suffix');
}
function assertStageBBacklog(source = backlog) {
  const sty09 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-09 /u.test(line));
  const sty10 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-10 /u.test(line));
  const sty11 = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-11 /u.test(line));
  assert.deepEqual(sty09, [STY09_CLOSURE_LINE]);
  assert.equal(sty10.length, 1, 'one canonical STY-10 backlog line');
  assert.match(sty10[0], /^- \[x\] \*\*STY-10 /u);
  assert.equal(sty11.length, 1, 'one canonical STY-11 backlog line');
  assert.match(sty11[0], /^- \[x\] \*\*STY-11 /u);
  assert.doesNotMatch(source, /\]\(\/styles\/sty-11\)/u);
  assertStageBImmediateHistory(immediateReviewBytes, source);
}
function assertStageBProjection() {
  assert.deepEqual(
    {completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources},
    {completed: 82, documents: 126, sources: 599},
  );
  assert.equal(publicLedger.sources.length, 599);

  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-09')?.published, topics.get('STY-09')?.status.value, styles.get('STY-09')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-10')?.published, topics.get('STY-10')?.status.value, styles.get('STY-10')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-11')?.published, topics.get('STY-11')?.status.value, styles.get('STY-11')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-12')?.published, topics.get('STY-12')?.status.value, styles.get('STY-12')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-13')?.published, topics.get('STY-13')?.status.value, styles.get('STY-13')?.published], [true, 'pending', true]);
  assert.deepEqual([topics.get('STY-14')?.published, topics.get('STY-14')?.status.value, styles.get('STY-14')?.published], [false, 'pending', false]);
}
function assertPendingStageBReview(source = review) {
  assert.equal(section(source, 'Stage B closure candidate'), PENDING_STAGE_B_REVIEW_LINES.join('\n'), 'exact pending Stage B section');
  assert.equal(source.split('## Stage B closure candidate').length - 1, 1, 'one Stage B closure section');
}
function assertFinalStageBReview(source = review) {
  assert.equal(section(source, 'Stage B closure candidate'), FINAL_STAGE_B_REVIEW_LINES.join('\n'), 'exact final Stage B section');
  assert.equal(source.split('## Stage B closure candidate').length - 1, 1, 'one Stage B closure section');
}
async function assertSty12Actionability() {
  const documents = await readContentDocuments('content');
  const reciprocals = new Set(['styles/sty-03-vertical-slice-architecture.mdx', 'styles/sty-10-microkernel-plugin-architecture.mdx', 'cases/micro-frontends-single-spa.mdx']);
  for (const document of documents) assert.equal(extractInternalLinks(document).includes('/styles/sty-12'), reciprocals.has(document.file), `${document.file} exact STY-12 actionability`);
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-13'), true, 'STY-13 has published reciprocal actions');
}
async function assertArtifactIdentities(source) {
  const identities = section(source, 'Artifact identities');
  const rows = [];
  for (const [path, expectedHash] of STABLE_ARTIFACT_HASHES) {
    const bytes = execFileSync('git', ['show', `${IMPLEMENTATION_HEAD}:${path}`], {
      cwd: new URL('../', import.meta.url),
      maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(sha256(bytes), expectedHash, `${path} immutable artifact bytes`);
    rows.push(`| \`${path}\` | ${bytes.length.toLocaleString('en-US')} | \`${expectedHash}\` |`);
  }
  const expected = [
    '| Artifact | Bytes | SHA-256 |',
    '| --- | ---: | --- |',
    ...rows,
    '',
    '- Governed STY-09 sources: `5`; remote anchors per state: `4`; original diagram rights remain governed separately.',
    '- Exactly one STY-09 citation is `manifest_primary`.',
  ].join('\n');
  assert.equal(identities, expected, 'exact artifact identity section with no contradictory rows');
}
function assertFunctionalStates(evidence) {
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
    assert.equal(new Set(state.relations.map(({href}) => href)).size, RELATIONS.length, 'unique relation href map');
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
      assert.equal(relation.navigation, 'direct exact-href navigation; no physical relation click claimed');
    }
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_LINKS);
    for (const source of state.geometry.sources) assert.deepEqual([source.target, source.rel], ['_blank', 'noopener noreferrer']);
    assert.equal(state.geometry.sty10, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {events: [], hasMore: false, truncated: false});
  }
}
function assertBrowser(evidence) {
  assert.ok(evidence, `${RAW_BROWSER} exists and parses`);
  assert.deepEqual(Object.keys(evidence), ['candidateHead', 'collection', 'states', 'screenshotEvidence']);
  assert.equal(evidence.candidateHead, IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'http://127.0.0.1:3420/tego-arch/styles/sty-09',
  });
  assertFunctionalStates(evidence);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated viewport content and omitted complete architecture-diagram coverage; no visual PASS is claimed.',
    attempts: SCREENSHOT_ATTEMPTS,
  });
}
function assertProductionBrowser(evidence) {
  assert.ok(evidence, `${PRODUCTION_RAW_BROWSER} exists and parses`);
  assert.deepEqual(Object.keys(evidence), ['implementationHead', 'pages', 'probes', 'collection', 'states', 'screenshotEvidence']);
  assert.equal(evidence.implementationHead, PRODUCTION_HEAD);
  assert.deepEqual(evidence.pages, PRODUCTION_PAGES);
  assert.deepEqual(evidence.probes, {routes: PRODUCTION_ROUTES, svg: PRODUCTION_SVG});
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'https://sealday.github.io/tego-arch/styles/sty-09',
    build: `GitHub Pages exact reviewed Stage A head ${PRODUCTION_HEAD}; run ${PRODUCTION_PAGES.runId}; build job ${PRODUCTION_PAGES.buildJobId}; deploy job ${PRODUCTION_PAGES.deployJobId}`,
  });
  assertFunctionalStates(evidence);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated viewport content and omitted complete architecture-diagram coverage; no visual PASS is claimed.',
    attempts: PRODUCTION_SCREENSHOT_ATTEMPTS,
  });
}
function assertStageBProductionBrowser(evidence) {
  assert.ok(evidence, `${STAGE_B_PRODUCTION_RAW_BROWSER} exists and parses`);
  assert.deepEqual(Object.keys(evidence), ['implementationHead', 'pages', 'probes', 'collection', 'states', 'screenshotEvidence']);
  assert.equal(evidence.implementationHead, STAGE_B_READY_HEAD);
  assert.deepEqual(evidence.pages, STAGE_B_PRODUCTION_PAGES);
  assert.deepEqual(evidence.probes, {routes: PRODUCTION_ROUTES, svg: PRODUCTION_SVG});
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'https://sealday.github.io/tego-arch/styles/sty-09',
    build: `GitHub Pages exact Stage B READY head ${STAGE_B_READY_HEAD}; run ${STAGE_B_PRODUCTION_PAGES.runId}; build job ${STAGE_B_PRODUCTION_PAGES.buildJobId}; deploy job ${STAGE_B_PRODUCTION_PAGES.deployJobId}`,
  });
  assertFunctionalStates(evidence);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated viewport content and omitted complete architecture-diagram coverage; no visual PASS is claimed.',
    attempts: STAGE_B_PRODUCTION_SCREENSHOT_ATTEMPTS,
  });
}
function assertReviewCommon(source) {
  assert.match(source, /^# G009 Batch 10 Stage A Review$/mu);
  assert.equal(source.match(/^# G009 Batch 10 Stage A Review$/gmu)?.length, 1, 'one review title');
  const projection = section(source, 'Stage A projection');
  assert.equal(projection, [
    '- Projection: `61 completed topics / 105 content documents / 544 governed sources`.',
    '- STY-09: `published / pending`.',
    '- STY-10: `unpublished / pending / non-actionable`; actionable route count: `0`.',
    '- This record is a local Stage A candidate only. It does not close the backlog and does not authorize deployment.',
  ].join('\n'), 'exact Stage A projection section');
  const history = section(source, 'Immutable immediate history');
  assert.equal(history, [
    `- Complete immediate STY-08 review SHA-256: \`${IMMEDIATE_REVIEW_HASH}\`.`,
    `- Complete immediate STY-08 backlog suffix SHA-256: \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\`.`,
    '- The backlog is unchanged: STY-09 remains unchecked for Stage A and STY-10 remains unchecked, unpublished, pending and non-actionable.',
  ].join('\n'), 'exact immutable history section');
  const generated = section(source, 'Generated projection audit');
  assert.equal(generated, [
    '- `npm run generate:content` and `npm run check:content`: `PASS`.',
    '- Generated line delta: `360 insertions / 46 deletions` across four current projection files.',
    '',
    '| Generated artifact | Before bytes | Candidate bytes | Byte delta | Line delta |',
    '| --- | ---: | ---: | ---: | ---: |',
    '| `src/generated/project-status.json` | 415 | 415 | 0 | `+2 / -2` |',
    '| `src/generated/source-ledger.json` | 1,855,594 | 1,871,834 | +16,240 | `+286 / -0` |',
    '| `src/generated/topic-indexes.json` | 221,023 | 221,389 | +366 | `+36 / -22` |',
    '| `src/generated/topic-manifest.json` | 220,869 | 221,235 | +366 | `+36 / -22` |',
    '',
    '- The five new unique governed identities are `src-microsoft-pipes-filters-pattern`, `src-apache-beam-programming-guide`, `src-reactive-streams-1-0-4`, `src-gnu-bash-pipelines`, and `src-atlas-sty09-pipes-filters-order-processing`.',
    '- The first full Node run correctly exposed `66` current projection, pagination, corpus inventory, reciprocal adjacency, prose seam, rights-inventory and current schema-registry fixtures. No historical review/raw/Pages/backlog evidence literal was changed.',
    '- Current-facing fixture synchronization and reciprocal prose seam repair are complete; the final pre-candidate full Node suite is `1260/1260 PASS`.',
  ].join('\n'), 'exact generated projection audit section');
  const qa = section(source, 'Local in-app Browser QA');
  assert.equal(qa, [
    `- The exact implementation candidate \`${IMPLEMENTATION_HEAD}\` was rebuilt and served at \`http://127.0.0.1:3420/tego-arch/styles/sty-09\` through the Codex in-app Browser only.`,
    '- States accepted: `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks: `12/12`.',
    '- Relation destination/H1/return checks: `20/20`.',
    '- SVG loaded in every state: intrinsic `120x150`; rendered `800x1000`.',
    '- Source href/`_blank`/`noopener noreferrer` checks: `16/16`; STY-10 actionable count: `0` per state.',
    '- Diagnostics are complete and empty in every state: warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false` and `truncated=false`.',
    `- Raw Browser JSON: \`${RAW_BROWSER}\`; \`${RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${RAW_BROWSER_HASH}\`.`,
    '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.',
    '- Exactly three fresh IAB full-page captures repeated viewport content and omitted complete architecture-diagram coverage. Each original is recorded as `CAPTURED_REJECTED` with its exact path, byte count, SHA-256 and reason; no fourth attempt was made.',
    '- No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed.',
  ].join('\n'), 'exact local Browser QA section with no contradictory visual claim');
}
function assertFinalReview(source) {
  assertReviewCommon(source);
  const checkpoint = section(source, 'Independent review checkpoint');
  const expected = [
    `Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`,
    `Exact evidence head: \`${EVIDENCE_HEAD}\`.`,
    'Independent code/spec/security review: `READY / APPROVE`; findings: `0`.',
    'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ].map((literal) => `- ${literal}`).join('\n');
  assert.equal(checkpoint, expected, 'exact final checkpoint with no weakened or contradictory verdict');
}
function assertProductionReview(source) {
  assertReviewCommon(source);
  const production = section(source, 'Stage A production deployment');
  const expected = [
    `- Exact reviewed Stage A head: \`${PRODUCTION_HEAD}\`.`,
    '- Preflight: tracked clean; `origin/main` exact merge-base and ancestor; behind/ahead `0/20`; publication used one non-force fast-forward push.',
    `- Exact Pages run: \`${PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
    `- Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
    `- Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
    '- The workflow, build and deploy identities bind the reviewed Stage A head; no evidence-only run is substituted.',
    '',
    '| Production route | Status | Content type |',
    '| --- | ---: | --- |',
    ...PRODUCTION_ROUTES.map(({path, status, contentType}) => `| \`${path}\` | \`${status}\` | \`${contentType}\` |`),
    '',
    '- Required HTML routes: `9/9`; every route returned `200` with `text/html; charset=utf-8`.',
    `- Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
    `- Production raw Browser JSON: \`${PRODUCTION_RAW_BROWSER}\`; \`${PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_BROWSER_HASH}\`.`,
    '- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `12/12`; relation href/H1/return checks `20/20`; source href/target/rel checks `16/16`.',
    '- SVG geometry: intrinsic `120x150`; rendered `800x1000`; STY-10 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.',
    '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED` because each repeated viewport content and omitted complete architecture-diagram coverage.',
    '- No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.',
    '- Stage A deployment status: `SUCCESS`; functional production status: `PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.',
    '- Scope remains `STAGE_A_ONLY`; the STY-09 backlog checkbox and all Stage B/STY-10 state are unchanged.',
  ].join('\n');
  assert.equal(production, expected, 'exact Stage A production section with no substituted run or visual PASS');
  assert.ok(productionBrowserBytes, `${PRODUCTION_RAW_BROWSER} exists`);
  assert.equal(productionBrowserBytes.length, PRODUCTION_RAW_BROWSER_BYTES);
  assert.equal(sha256(productionBrowserBytes), PRODUCTION_RAW_BROWSER_HASH);
}
function assertStageBProductionReview(source) {
  assertFinalStageBReview(source);
  const production = section(source, 'Stage B production deployment');
  const expected = [
    `- Exact published Stage B READY head: \`${STAGE_B_READY_HEAD}\`.`,
    '- Preflight: tracked and untracked clean; `origin/main` exact merge-base and ancestor; behind/ahead `0/2`; publication used one non-force fast-forward push.',
    `- Exact Pages run: \`${STAGE_B_PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
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
    `- Stage B production raw Browser JSON: \`${STAGE_B_PRODUCTION_RAW_BROWSER}\`; \`${STAGE_B_PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${STAGE_B_PRODUCTION_RAW_BROWSER_HASH}\`.`,
    '- Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `12/12`; relation href/H1/return checks `20/20`; source href/target/rel checks `16/16`.',
    '- SVG geometry: intrinsic `120x150`; rendered `800x1000`; STY-10 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.',
    '- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED` because each repeated viewport content and omitted complete architecture-diagram coverage.',
    '- No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.',
    '- Stage B deployment status: `SUCCESS / PASS`; visual screenshot status remains separately `BLOCKED / NOT_ACCEPTED`.',
    '- Scope remains `STAGE_B`; STY-09 is published/complete and STY-10 remains the sole unpublished/pending/non-actionable next topic.',
  ].join('\n');
  assert.equal(production, expected, 'exact Stage B production section with no substituted run or visual PASS');
  assert.ok(stageBProductionBrowserBytes, `${STAGE_B_PRODUCTION_RAW_BROWSER} exists`);
  assert.equal(stageBProductionBrowserBytes.length, STAGE_B_PRODUCTION_RAW_BROWSER_BYTES);
  assert.equal(sha256(stageBProductionBrowserBytes), STAGE_B_PRODUCTION_RAW_BROWSER_HASH);
}

const [review, browserBytes, productionBrowserBytes, stageBProductionBrowserBytes, immediateReviewBytes, backlog, status, manifest, indexes, publicLedger] = await Promise.all([
  optional(REVIEW, 'utf8'), optional(RAW_BROWSER), optional(PRODUCTION_RAW_BROWSER), optional(STAGE_B_PRODUCTION_RAW_BROWSER), required(IMMEDIATE_REVIEW), required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-indexes.json', 'utf8').then(JSON.parse),
  required('src/generated/source-ledger.json', 'utf8').then(JSON.parse),
]);

test('locks complete immediate STY-08 review and backlog suffix with mutation sensitivity', () => {
  assertStageBImmediateHistory();
  for (const changedReview of [Buffer.concat([immediateReviewBytes, Buffer.from('x')]), immediateReviewBytes.subarray(0, -1)]) {
    assert.throws(() => assertStageBImmediateHistory(changedReview), assert.AssertionError);
  }
  const baseline = currentReleaseBaseline(backlog);
  const batch10History = baseline.split(LIVE_BATCH11_HISTORY_MARKER)[1];
  const suffix = batch10History.slice((CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER).length);
  for (const changedSuffix of [`${suffix}x`, suffix.slice(0, -1)]) {
    const changedBacklog = backlog.replace(suffix, changedSuffix);
    assert.throws(() => assertStageBImmediateHistory(immediateReviewBytes, changedBacklog), assert.AssertionError);
  }
  const staleCurrentNext = backlog.replace('下一项为 STY-11', '下一项为 STY-10');
  assert.notEqual(staleCurrentNext, backlog, 'current next-topic mutation applies');
  assert.throws(() => assertStageBBacklog(staleCurrentNext), assert.AssertionError);
});

test('preserves canonical STY-09 history while current STY-10 is complete and STY-11 is pending non-actionable', async () => {
  assertStageBProjection();
  assertStageBBacklog();
  await assertSty12Actionability();
});

test('binds exact STY-09 artifacts, tracked Browser semantics, and final independent review verdicts', async () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  assertBrowser(JSON.parse(browserBytes));
  assertFinalReview(review);
  await assertArtifactIdentities(review);
  assert.equal(EVIDENCE_HEAD, '1691a914037b25d363e33c6c3d5ab3b8a5bf2206');
});

test('binds complete tracked Browser bytes to one fixed SHA-256', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  assert.equal(browserBytes.length, RAW_BROWSER_BYTES);
  assert.equal(sha256(browserBytes), RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([browserBytes, Buffer.from('x')])), RAW_BROWSER_HASH);
  assert.notEqual(sha256(browserBytes.subarray(0, -1)), RAW_BROWSER_HASH);
});

test('rejects Browser head, state, geometry, interaction, relation, source, SVG, diagnostic, STY-10 and screenshot mutations', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  const browser = JSON.parse(browserBytes);
  assertBrowser(browser);
  const mutations = [
    (copy) => { copy.candidateHead = '0'.repeat(40); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.page.scrollWidth += 1; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0]); },
    (copy) => { copy.states.mobileLight.geometry.wrappers[2].scrollWidth += 1; },
    (copy) => { copy.states.desktopDark.interactions.reverse(); },
    (copy) => { copy.states.desktopDark.interactions[1].expectedScrollDelta += 1; },
    (copy) => { copy.states.desktopLight.interactions[0].after.scrollLeft += 1; },
    (copy) => { copy.states.mobileDark.interactions[0].before.focusVisible = false; },
    (copy) => { copy.states.mobileLight.relations[0].returnedToArticle = false; },
    (copy) => { copy.states.mobileDark.relations[0] = {...copy.states.mobileDark.relations[0], href: '/tego-arch/styles/sty-99', h1: 'fabricated', expectedH1: 'fabricated'}; },
    (copy) => { copy.states.desktopLight.relations.reverse(); },
    (copy) => { copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'; },
    (copy) => { copy.states.mobileLight.geometry.sources.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.desktopDark.geometry.svg.renderedHeight += 1; },
    (copy) => { copy.states.mobileDark.geometry.sty10 = 1; },
    (copy) => { copy.states.mobileDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.reason = 'fabricated visual coverage'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts[0].path = '/tmp/fabricated.png'; },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(browser);
    mutate(copy);
    assert.throws(() => assertBrowser(copy), {name: 'AssertionError'});
  }
});

test('rejects wrong review heads, weakened verdicts, deployment, scope and fabricated visual PASS mutations', () => {
  assertFinalReview(review);
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${IMPLEMENTATION_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    [`Exact evidence head: \`${EVIDENCE_HEAD}\`.`, `Exact evidence head: \`${'1'.repeat(40)}\`.`],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `NOT READY`; findings: `0`.'],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `READY / APPROVE`; findings: `1`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PENDING`; findings: `0`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `BLOCKED`; blockers: `0`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `1`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `READY`.\n- Final Stage A review judgment: `PENDING`.'],
    ['Scope boundary: `STAGE_A_ONLY`;', 'Scope boundary: `STAGE_B`;'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `NOT_RUN`.\n- Deployment status: `SUCCESS`.'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `PASS`.'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.\n- Screenshot evidence: `PASS`.'],
    ['No Chrome fallback, prior raw, historical screenshot or visual PASS is claimed.', 'Visual PASS is claimed.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertFinalReview(mutated), {name: 'AssertionError'});
  }
});

test('binds exact reviewed-head Stage A production publication and functional IAB evidence', () => {
  assert.ok(productionBrowserBytes, `${PRODUCTION_RAW_BROWSER} exists`);
  assert.equal(productionBrowserBytes.length, PRODUCTION_RAW_BROWSER_BYTES);
  assert.equal(sha256(productionBrowserBytes), PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([productionBrowserBytes, Buffer.from('x')])), PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(productionBrowserBytes.subarray(0, -1)), PRODUCTION_RAW_BROWSER_HASH);
  assertProductionBrowser(JSON.parse(productionBrowserBytes));
  assertProductionReview(review);
});

test('rejects production head, run, job, route, SVG, semantic, diagnostic, screenshot and review mutations', () => {
  assert.ok(productionBrowserBytes, `${PRODUCTION_RAW_BROWSER} exists`);
  const production = JSON.parse(productionBrowserBytes);
  assertProductionBrowser(production);
  const mutations = [
    (copy) => { copy.implementationHead = '0'.repeat(40); },
    (copy) => { copy.pages.runId = 0; },
    (copy) => { copy.pages.buildConclusion = 'failure'; },
    (copy) => { copy.pages.deployJobId = 0; },
    (copy) => { copy.probes.routes.reverse(); },
    (copy) => { copy.probes.routes[2].status = 404; },
    (copy) => { copy.probes.routes[8].contentType = 'text/plain'; },
    (copy) => { copy.probes.svg.bytes += 1; },
    (copy) => { copy.probes.svg.sha256 = '0'.repeat(64); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopDark.interactions[1].after.scrollLeft += 1; },
    (copy) => { copy.states.mobileLight.relations[0].h1 = 'fabricated'; },
    (copy) => { copy.states.mobileDark.geometry.sources.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.mobileDark.geometry.sty10 = 1; },
    (copy) => { copy.states.desktopDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileLight.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '1'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(production);
    mutate(copy);
    assert.throws(() => assertProductionBrowser(copy), {name: 'AssertionError'});
  }

  assertProductionReview(review);
  for (const [before, after] of [
    [`Exact reviewed Stage A head: \`${PRODUCTION_HEAD}\`.`, `Exact reviewed Stage A head: \`${'0'.repeat(40)}\`.`],
    [`Exact Pages run: \`${PRODUCTION_PAGES.runId}\`;`, 'Exact Pages run: `0`;'],
    [`Build job: \`${PRODUCTION_PAGES.buildJobId}\`;`, 'Build job: `0`;'],
    [`Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`;`, 'Deploy job: `0`;'],
    ['Required HTML routes: `9/9`;', 'Required HTML routes: `8/9`;'],
    [`Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`, `Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${'0'.repeat(64)}\`; exact reviewed byte identity: \`PASS\`.`],
    [PRODUCTION_RAW_BROWSER_HASH, '1'.repeat(64)],
    ['Functional production QA: `PASS`;', 'Functional production QA: `PENDING`;'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`;', 'Screenshot evidence: `PASS`;'],
    ['No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.', 'Visual PASS is claimed.'],
    ['Stage A deployment status: `SUCCESS`;', 'Stage A deployment status: `PENDING`;'],
    ['Scope remains `STAGE_A_ONLY`;', 'Scope remains `STAGE_B`;'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} production-review mutation applies`);
    assert.throws(() => assertProductionReview(mutated), {name: 'AssertionError'});
  }
});

test('closes only STY-09 from exact Stage A production evidence and preserves complete STY-08 history', () => {
  assertStageBBacklog();
});

test('projects STY-09 and STY-10 complete with STY-11 unpublished/non-actionable', async () => {
  assertStageBProjection();
  await assertSty12Actionability();
});

test('rejects the superseded all-PENDING Stage B checkpoint after independent review', () => {
  assertFinalStageBReview();
  let pendingReview = review;
  for (let index = 15; index < 20; index += 1) {
    pendingReview = pendingReview.replace(FINAL_STAGE_B_REVIEW_LINES[index], PENDING_STAGE_B_REVIEW_LINES[index]);
  }
  pendingReview = pendingReview.replace(FINAL_STAGE_B_REVIEW_LINES[21], PENDING_STAGE_B_REVIEW_LINES[21]);
  assert.notEqual(pendingReview, review, 'all-PENDING checkpoint mutation applies');
  assertPendingStageBReview(pendingReview);
  assert.throws(() => assertFinalStageBReview(pendingReview), {name: 'AssertionError'});
});

test('binds the exact independently reviewed Stage B head and zero-finding verdicts', () => {
  assertFinalStageBReview();
});

test('rejects wrong Stage B head, weakened verdicts, stale PENDING, deployment drift, and visual fabrication', () => {
  assertFinalStageBReview();
  for (const [before, after] of [
    [`Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\`.`, `Exact Stage B reviewed head: \`${'0'.repeat(40)}\`.`],
    ['Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent Stage B code/spec/security review: `PENDING`; findings: `PENDING`.'],
    ['Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `1`.'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent Stage B content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`.'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PENDING`; findings: `0`.'],
    ['Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent Stage B architecture/invariant review: `BLOCKED`; blockers: `0`.'],
    ['Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `1`.'],
    ['Final Stage B review judgment: `READY`.', 'Final Stage B review judgment: `PENDING`.'],
    ['Stage B scope boundary: `STAGE_B`.', 'Stage B scope boundary: `STAGE_B_DEPLOYED`.'],
    ['Stage B deployment status: `SUCCESS / PASS`.', 'Stage B deployment status: `NOT_RUN`.'],
    ['Stage B deployment status: `SUCCESS / PASS`.', 'Stage B deployment status: `READY / NOT_RUN`.'],
    ['Stage B deployment status: `SUCCESS / PASS`.', 'Stage B deployment status: `PENDING / SUCCESS`.'],
    ['Stage B screenshot status remains `BLOCKED / NOT_ACCEPTED`.', 'Stage B screenshot status remains `PASS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertFinalStageBReview(mutated), {name: 'AssertionError'});
  }
});

test('binds exact Stage B READY-head production publication and functional IAB evidence', () => {
  assert.ok(stageBProductionBrowserBytes, `${STAGE_B_PRODUCTION_RAW_BROWSER} exists`);
  assert.equal(stageBProductionBrowserBytes.length, STAGE_B_PRODUCTION_RAW_BROWSER_BYTES);
  assert.equal(sha256(stageBProductionBrowserBytes), STAGE_B_PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([stageBProductionBrowserBytes, Buffer.from('x')])), STAGE_B_PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(stageBProductionBrowserBytes.subarray(0, -1)), STAGE_B_PRODUCTION_RAW_BROWSER_HASH);
  assertStageBProductionBrowser(JSON.parse(stageBProductionBrowserBytes));
  assertStageBProductionReview(review);
});

test('rejects Stage B production head, run, job, route, SVG, semantic, diagnostic, screenshot and review mutations', () => {
  assert.ok(stageBProductionBrowserBytes, `${STAGE_B_PRODUCTION_RAW_BROWSER} exists`);
  const production = JSON.parse(stageBProductionBrowserBytes);
  assertStageBProductionBrowser(production);
  const mutations = [
    (copy) => { copy.implementationHead = '0'.repeat(40); },
    (copy) => { copy.pages.runId = 0; },
    (copy) => { copy.pages.buildConclusion = 'failure'; },
    (copy) => { copy.pages.deployJobId = 0; },
    (copy) => { copy.probes.routes.reverse(); },
    (copy) => { copy.probes.routes[2].status = 404; },
    (copy) => { copy.probes.routes[8].contentType = 'text/plain'; },
    (copy) => { copy.probes.svg.bytes += 1; },
    (copy) => { copy.probes.svg.sha256 = '0'.repeat(64); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopDark.interactions[1].after.scrollLeft += 1; },
    (copy) => { copy.states.mobileLight.relations[0].h1 = 'fabricated'; },
    (copy) => { copy.states.mobileDark.geometry.sources.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.mobileDark.geometry.sty10 = 1; },
    (copy) => { copy.states.desktopDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileLight.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '1'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const copy = structuredClone(production);
    mutate(copy);
    assert.throws(() => assertStageBProductionBrowser(copy), {name: 'AssertionError'}, `Stage B production raw mutation ${index}`);
  }

  assertStageBProductionReview(review);
  for (const [before, after] of [
    [`Exact published Stage B READY head: \`${STAGE_B_READY_HEAD}\`.`, `Exact published Stage B READY head: \`${'0'.repeat(40)}\`.`],
    [`Exact Pages run: \`${STAGE_B_PRODUCTION_PAGES.runId}\`;`, 'Exact Pages run: `0`;'],
    [`Build job: \`${STAGE_B_PRODUCTION_PAGES.buildJobId}\`;`, 'Build job: `0`;'],
    [`Deploy job: \`${STAGE_B_PRODUCTION_PAGES.deployJobId}\`;`, 'Deploy job: `0`;'],
    ['Required HTML routes: `9/9`;', 'Required HTML routes: `8/9`;'],
    [`Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`, `Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${'0'.repeat(64)}\`; exact reviewed byte identity: \`PASS\`.`],
    [STAGE_B_PRODUCTION_RAW_BROWSER_HASH, '1'.repeat(64)],
    ['Functional production QA: `PASS`;', 'Functional production QA: `PENDING`;'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`;', 'Screenshot evidence: `PASS`;'],
    ['No Chrome fallback, prior raw, historical screenshot, substituted browser surface or visual PASS is claimed.', 'Visual PASS is claimed.'],
    ['Stage B deployment status: `SUCCESS / PASS`;', 'Stage B deployment status: `PENDING / NOT_RUN`;'],
    ['Scope remains `STAGE_B`;', 'Scope remains `STAGE_B_DEPLOYED`;'],
  ]) {
    const stageBProductionStart = review.indexOf('## Stage B production deployment');
    assert.notEqual(stageBProductionStart, -1, 'Stage B production section exists');
    const mutated = review.slice(0, stageBProductionStart) + review.slice(stageBProductionStart).replace(before, after);
    assert.notEqual(mutated, review, `${before} Stage B production-review mutation applies`);
    assert.throws(() => assertStageBProductionReview(mutated), {name: 'AssertionError'});
  }
});
