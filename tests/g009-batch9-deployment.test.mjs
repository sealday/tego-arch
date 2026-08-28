import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

const ARTICLE = 'content/styles/sty-08-actor-model.mdx';
const DRAWIO = 'diagrams/sty-08-actor-order-fulfillment.drawio';
const SVG = 'static/img/diagrams/sty-08-actor-order-fulfillment.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch9.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch9-stage-a-browser.json';
const PRODUCTION_RAW_BROWSER = 'docs/reviews/evidence/g009-batch9-stage-a-production-browser.json';
const STAGE_B_PRODUCTION_RAW_BROWSER = 'docs/reviews/evidence/g009-batch9-stage-b-production-browser.json';
const IMMEDIATE_REVIEW = 'docs/reviews/g009-batch8.md';
const IMMEDIATE_STAGE_A_RAW = 'docs/reviews/evidence/g009-batch8-stage-a-browser.json';
const IMMEDIATE_STAGE_A_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch8-stage-a-production-browser.json';
const IMMEDIATE_STAGE_B_PRODUCTION_RAW = 'docs/reviews/evidence/g009-batch8-stage-b-production-browser.json';
const BACKLOG = 'docs/content-backlog.md';
const CANDIDATE_HEAD = 'bbb2f4234c4c24993dbea108d2a19a751e778409';
const EVIDENCE_HEAD = '4923b7da22d79ecc32400669526196ca852885a4';
const STAGE_B_REVIEWED_HEAD = '0d94d407177f71376a34ffd572d5a7a35a596903';
const RAW_BROWSER_HASH = 'fa3fdecb77c55c8e2a013d95bbe9684afde05e3027583a9b3d1feb405a758932';
const PRODUCTION_IMPLEMENTATION_HEAD = '70c9c61c55fa383b8619be0fbcddb02485918942';
const PRODUCTION_RAW_BROWSER_BYTES = 27_342;
const PRODUCTION_RAW_BROWSER_HASH = '3b3389d0bdfab77a07793f68161fcab6b8a0a198779af231783512553943e6ca';
const PRODUCTION_PAGES = Object.freeze({
  runId: 31_907_316_801,
  status: 'completed',
  conclusion: 'success',
  buildJobId: 95_067_060_526,
  buildStatus: 'completed',
  buildConclusion: 'success',
  deployJobId: 95_067_389_572,
  deployStatus: 'completed',
  deployConclusion: 'success',
});
const PRODUCTION_ROUTES = Object.freeze([
  {path: '/', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles/sty-08', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles/sty-05', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles/sty-06', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/styles/sty-07', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/cases/erlang-otp-supervision-tree', status: 200, contentType: 'text/html; charset=utf-8'},
  {path: '/references', status: 200, contentType: 'text/html; charset=utf-8'},
]);
const PRODUCTION_SVG = Object.freeze({
  url: 'https://sealday.github.io/tego-arch/img/diagrams/sty-08-actor-order-fulfillment.svg',
  status: 200,
  contentType: 'image/svg+xml',
  bytes: 21_562,
  sha256: '93a23b5c57334e96d08908146f82677faad887a30cb45b1f8066633b6e185e65',
});
const STAGE_B_IMPLEMENTATION_HEAD = 'beba7eade41029a307e762cf92bc1e4e76bcce05';
const STAGE_B_PRODUCTION_RAW_BROWSER_BYTES = 27_333;
const STAGE_B_PRODUCTION_RAW_BROWSER_HASH = 'f2771bf2288bbd45e30f8ddb7fa2e82e78320437fbe64ecad681d1683489568a';
const STAGE_B_PRODUCTION_PAGES = Object.freeze({
  runId: 31_910_528_440,
  status: 'completed',
  conclusion: 'success',
  buildJobId: 95_074_776_397,
  buildStatus: 'completed',
  buildConclusion: 'success',
  deployJobId: 95_075_081_532,
  deployStatus: 'completed',
  deployConclusion: 'success',
});
const IMMEDIATE_REVIEW_HASH = '2915584034c0d480ee04713c9fadee2839f03d112ced139901a3fb2033d8ac7e';
const IMMEDIATE_STAGE_A_RAW_HASH = 'b2a09ad041c156faa1493867741dd7b1c74241fbd96005903335b3d5076d4122';
const IMMEDIATE_STAGE_A_PRODUCTION_RAW_HASH = '753a94cf2ef53d054959dc6c115d4f29e484c651a06fe4c5c7d617358fd8b192';
const IMMEDIATE_STAGE_B_PRODUCTION_RAW_HASH = 'b5605b255f87041524e25a898bd5f0b27ec912322b8d1fd814c3032abb88a99a';
const IMMEDIATE_BACKLOG_SUFFIX_HASH = 'dba312f190706ae7112ea057addefe58ceff4cdd15bad39264efbd58b129c354';
const STABLE_ARTIFACT_HASHES = new Map([
  [ARTICLE, 'b9f0af60f535bdce6269e5ffce3ec4aee03730fde344957eee0d3f02196c377c'],
  [DRAWIO, 'd323a34b4130c843f3c3c96547bf61a690d97dcccd93794b9c228f435548e62b'],
  [SVG, '93a23b5c57334e96d08908146f82677faad887a30cb45b1f8066633b6e185e65'],
]);
const HISTORICAL_LEDGER_IDENTITY = Object.freeze({bytes: 1_555_131, sha256: '29b62da07c5dedbf8d87baaf56ccd4bce1036b5aadda176b1d7ee64ac908557e'});
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPERS = [
  '共享订单状态与订单 Actor 履约边界对照图，可横向滚动',
  'Actor、线程、消息消费者、事件驱动与微服务机制对照表，可横向滚动',
  'Actor Model 采用、谨慎采用与停止决策表，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/styles/sty-06', '事件驱动架构：先分清事件携带什么，再决定状态放在哪里'],
  ['/tego-arch/styles/sty-07', '面向服务架构：用稳定合同连接企业能力，也约束集中治理'],
  ['/tego-arch/cases/erlang-otp-supervision-tree', '监督树：把失败恢复设计成层级控制协议'],
];
const SOURCE_LINKS = [
  'https://www.ijcai.org/Proceedings/73/Papers/027B.pdf',
  'https://doc.akka.io/libraries/akka-core/2.10.21/typed/actors.html',
  'https://doc.akka.io/libraries/akka-core/2.10.21/general/message-delivery-reliability.html',
  'https://doc.akka.io/libraries/akka-core/2.10.21/general/remoting.html',
  'https://learn.microsoft.com/en-us/dotnet/orleans/overview',
  'https://www.erlang.org/doc/system/sup_princ.html',
];
const STATE_CONTRACTS = Object.freeze({
  desktopLight: Object.freeze({
    theme: 'light', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1171, 1764], deltas: [0, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  desktopDark: Object.freeze({
    theme: 'dark', width: 1440, height: 1000,
    clients: [800, 800, 800], scrolls: [800, 1171, 1764], deltas: [0, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
  mobileLight: Object.freeze({
    theme: 'light', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1171, 1764], deltas: [40, 40, 40],
    outlines: ['rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px', 'rgb(159, 63, 49) solid 3px'],
  }),
  mobileDark: Object.freeze({
    theme: 'dark', width: 390, height: 844,
    clients: [358, 358, 358], scrolls: [800, 1171, 1764], deltas: [40, 40, 40],
    outlines: ['rgb(227, 144, 125) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px', 'rgba(227, 144, 125, 0.62) solid 3px'],
  }),
});
const SVG_GEOMETRY = Object.freeze({
  src: '/tego-arch/assets/images/sty-08-actor-order-fulfillment-fa568ecfe3b507ce8ca88416844f5b3d.svg',
  loaded: true,
  naturalWidth: 48,
  naturalHeight: 150,
  renderedWidth: 800,
  renderedHeight: 2480,
});
const SCREENSHOT_REJECTION_REASON = 'The in-app Browser full-page capture repeated the opening viewport instead of covering the complete page and architecture diagram, so it cannot support trustworthy whole-page visual review.';
const SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-a-bbb2f42-formal-1.png', bytes: 1778121, sha256: 'baa706e8c005101211ea0f46b5af86bad5a1da1bdbc3ec6845cf60bf34c6dab2'},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-a-bbb2f42-formal-2.png', bytes: 1791254, sha256: '95889769eeea867285baaae655d300b0c0bcd1dc61ccab0dbbe23b43b46f9f51'},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-a-bbb2f42-formal-3.png', bytes: 838206, sha256: 'c8f6898b8bab04415a0c4e6ae587690bbe5acbba5954545e4848a541492c943f'},
]);
const PRODUCTION_SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-production-70c9c61-desktop-light.png', bytes: 1858760, sha256: 'e65e1f2416d808d9cb23c163558e600aebc8f31f878f20bacad2008ecf564667'},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-production-70c9c61-desktop-dark.png', bytes: 1876063, sha256: '5fe642ee0925f6ea60150917a148ab846f6e9f31207c9a28e7151b689df59a10'},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-production-70c9c61-mobile-light.png', bytes: 838206, sha256: 'c8f6898b8bab04415a0c4e6ae587690bbe5acbba5954545e4848a541492c943f'},
]);
const STAGE_B_PRODUCTION_SCREENSHOT_ATTEMPTS = Object.freeze([
  {ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-b-beba7ea-desktop-light.png', bytes: 1778165, sha256: '2a021afadb40d25f7193d79f2542af4c420461fba3e7d7c02a7f98b0ca68f5a3'},
  {ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-b-beba7ea-desktop-dark.png', bytes: 1791254, sha256: '95889769eeea867285baaae655d300b0c0bcd1dc61ccab0dbbe23b43b46f9f51'},
  {ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REJECTION_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-stage-b-beba7ea-mobile-light.png', bytes: 838206, sha256: 'c8f6898b8bab04415a0c4e6ae587690bbe5acbba5954545e4848a541492c943f'},
]);
const STY08_CLOSURE_LINE = `- [x] **STY-08 P1｜Actor Model**：隔离状态、邮箱、监督、位置透明与分布式边界。Stage A 关闭证据：2026-08-16 review，commit [\`${PRODUCTION_IMPLEMENTATION_HEAD}\`](https://github.com/sealday/tego-arch/commit/${PRODUCTION_IMPLEMENTATION_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`，production HTML routes \`8/8\`，live route \`/styles/sty-08\` 与 \`/img/diagrams/sty-08-actor-order-fulfillment.svg\` 均为 HTTP 200，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match，Stage A production functional verdict PASS；screenshot evidence BLOCKED / NOT_ACCEPTED。`;
const CURRENT_BASELINE_PREFIX = `2026-08-16 G009 Batch 9 已完成 STY-08，Stage A 发布基线为 [\`${PRODUCTION_IMPLEMENTATION_HEAD}\`](https://github.com/sealday/tego-arch/commit/${PRODUCTION_IMPLEMENTATION_HEAD})，Pages run [\`${PRODUCTION_PAGES.runId}\`](https://github.com/sealday/tego-arch/actions/runs/${PRODUCTION_PAGES.runId})，exact \`headSha=${PRODUCTION_IMPLEMENTATION_HEAD}\`、\`event=push\`、\`status=completed\`、\`conclusion=success\`，build job \`${PRODUCTION_PAGES.buildJobId}\`、deploy job \`${PRODUCTION_PAGES.deployJobId}\`；2026-08-16 production HTTP probes \`8/8\`，live route \`/styles/sty-08\` 与 \`/img/diagrams/sty-08-actor-order-fulfillment.svg\` 均为 HTTP \`200\`，live SVG SHA-256 \`${PRODUCTION_SVG.sha256}\` 与 reviewed asset exact match。Production Browser states \`4/4\`、wrapper interactions \`12/12\`、relation destination/H1/return \`16/16\`、exact source destinations \`24/24\`，每个状态 STY-09 actionable count \`0\` 且 diagnostics 完整为零；Stage A production functional verdict \`PASS\`，screenshot evidence \`BLOCKED / NOT_ACCEPTED\`。Stage B local closure projection 为 61 个已完成主题、104 篇内容文档与 539 个受治理来源，持久故事进度仍为 \`8 / 20\`，当前 G009，下一项为 STY-09，STY-08 为 published/complete，STY-09 为 unpublished/pending/nonactionable；Stage B 三个独立 review slots 与 final readiness 均为 \`PENDING\`，deployment status 为 \`PENDING / NOT_RUN\`。`;
const CURRENT_HISTORY_MARKER = '此前 G009 Batch 9 历史完成基线为：';
const LIVE_HISTORY_MARKER = '此前 G009 Batch 10 历史完成基线为：';
const IMMEDIATE_BACKLOG_MARKER = '此前 G009 Batch 8 历史完成基线为：';
const STAGE_B_REVIEW_LINES = Object.freeze([
  '- Closure date: `2026-08-16`.',
  `- Exact Stage A implementation head: \`${PRODUCTION_IMPLEMENTATION_HEAD}\`.`,
  `- Exact Pages run: \`${PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
  `- Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
  `- Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
  '- Required production HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.',
  `- Reviewed production SVG: HTTP \`200\`; MIME \`${PRODUCTION_SVG.contentType}\`; \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
  `- Stage A production raw: \`${PRODUCTION_RAW_BROWSER}\`; \`${PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_BROWSER_HASH}\`.`,
  '- Functional production QA: `PASS`; states `4/4`; wrapper interactions `12/12`; relation checks `16/16`; exact source checks `24/24`; STY-09 actionable count `0`; diagnostics complete and empty.',
  '- Stage A production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three attempts were `CAPTURED_REJECTED`; no visual PASS is claimed.',
  '- Projection: `61 completed topics / 104 content documents / 539 governed sources`.',
  '- STY-08 target: `published / complete`.',
  '- STY-09 target: `unpublished / pending / non-actionable`; actionable route count: `0`; sole next topic.',
  `- Immediate immutable history: complete Batch 8 review SHA-256 \`${IMMEDIATE_REVIEW_HASH}\`; Stage A raw \`${IMMEDIATE_STAGE_A_RAW_HASH}\`; Stage A production raw \`${IMMEDIATE_STAGE_A_PRODUCTION_RAW_HASH}\`; Stage B production raw \`${IMMEDIATE_STAGE_B_PRODUCTION_RAW_HASH}\`; backlog suffix \`${IMMEDIATE_BACKLOG_SUFFIX_HASH}\`.`,
  `- Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\`.`,
  '- Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`.',
  '- Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
  '- Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
  '- Final Stage B review judgment: `READY`.',
  '- Stage B scope boundary: `STAGE_B`.',
  `- Exact Stage B implementation head: \`${STAGE_B_IMPLEMENTATION_HEAD}\`.`,
  `- Exact Stage B Pages run: \`${STAGE_B_PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
  `- Stage B build job: \`${STAGE_B_PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
  `- Stage B deploy job: \`${STAGE_B_PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
  '- Stage B required production HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.',
  `- Stage B reviewed production SVG: HTTP \`200\`; MIME \`${PRODUCTION_SVG.contentType}\`; \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
  `- Stage B production raw: \`${STAGE_B_PRODUCTION_RAW_BROWSER}\`; \`${STAGE_B_PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${STAGE_B_PRODUCTION_RAW_BROWSER_HASH}\`.`,
  '- Stage B functional production QA: `PASS`; states `4/4`; wrapper interactions `12/12`; relation checks `16/16`; exact source checks `24/24`; STY-09 actionable count `0`; diagnostics complete and empty.',
  '- Stage B production screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three attempts were `CAPTURED_REJECTED`; no visual PASS is claimed.',
  '- Stage B deployment status: `SUCCESS / PASS`; functional and HTTP production gates passed.',
]);

const rootUrl = new URL('../', import.meta.url);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
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

function subsection(source, heading) {
  assert.ok(source, `${REVIEW} exists`);
  const starts = [...source.matchAll(/^(#{2,3}) ([^\n]+)$/gmu)];
  const current = starts.filter((match) => match[1] === '###' && match[2] === heading);
  assert.equal(current.length, 1, `${heading} subsection`);
  const next = starts.find((match) => match.index > current[0].index);
  return source.slice(current[0].index + current[0][0].length, next?.index ?? source.length).trim();
}

function currentReleaseBaseline(source) {
  const matches = source.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(matches.length, 1, 'one current release baseline');
  return matches[0].slice('- **当前发布基线：** '.length);
}

function g009Batch11HistoricalBaseline(source) {
  const parts = currentReleaseBaseline(source).split('此前 G009 Batch 11 历史完成基线为：');
  assert.equal(parts.length, 2, 'one exact G009 Batch 11 history marker');
  return parts[1];
}

function assertImmediateHistory(history = IMMEDIATE_HISTORY) {
  for (const [path, [bytes, expectedHash]] of history) assert.equal(sha256(bytes), expectedHash, `${path} complete immutable bytes`);
}

function assertStageBReview(source) {
  const expected = STAGE_B_REVIEW_LINES.join('\n');
  assert.equal(section(source, 'Stage B closure candidate'), expected, 'closed exact Stage B section');
  assert.equal(source.split('## Stage B closure candidate').length - 1, 1, 'one Stage B section');
  for (const line of STAGE_B_REVIEW_LINES.slice(13)) {
    const label = line.slice(0, line.indexOf(':') + 1);
    assert.equal(source.split(label).length - 1, 1, `${label} declared once globally`);
  }
}

function assertStageBBacklog(source) {
  const sty08Lines = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-08 /u.test(line));
  assert.deepEqual(sty08Lines, [STY08_CLOSURE_LINE]);
  const sty09Lines = source.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-09 /u.test(line));
  assert.equal(sty09Lines.length, 1, 'one canonical STY-09 backlog line');
  assert.match(sty09Lines[0], /^- \[x\] \*\*STY-09 /u);
  assert.match(source, /^- \[x\] \*\*STY-10 /mu);
  assert.match(source, /^- \[x\] \*\*STY-11 /mu);
  assert.doesNotMatch(source, /\]\(\/styles\/sty-11\)/u);

  const baseline = g009Batch11HistoricalBaseline(source);
  const liveParts = baseline.split(LIVE_HISTORY_MARKER);
  assert.equal(liveParts.length, 2, 'split live Batch 11 prefix from immutable Batch 10 history');
  assert.match(liveParts[0], /^2026-08-20 G009 Batch 11 已完成 STY-10/u);
  assert.match(liveParts[0], /当前 G009，下一项为 STY-11/u);
  assert.doesNotMatch(liveParts[0], /下一项为 STY-10/u);
  assert.match(liveParts[1], /^2026-08-17 G009 Batch 10 已完成 STY-09/u);
  const batch9Parts = liveParts[1].split(CURRENT_HISTORY_MARKER);
  assert.equal(batch9Parts.length, 2, 'one immutable Batch 9 history boundary');
  assert.ok(batch9Parts[1].startsWith(CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER), 'exact historical Batch 9 prefix');
  const suffix = batch9Parts[1].slice((CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER).length);
  assert.match(suffix, /^2026-08-14 G009 Batch 8 已完成 STY-07/u);
  assert.equal(sha256(suffix), IMMEDIATE_BACKLOG_SUFFIX_HASH, 'complete immediate STY-07 backlog suffix');
}

function replaceHistoricalBatch9Literal(source, before, after) {
  const baseline = currentReleaseBaseline(source);
  const parts = baseline.split(CURRENT_HISTORY_MARKER);
  assert.equal(parts.length, 2, 'one immutable Batch 9 history boundary');
  assert.ok(parts[1].includes(before), `${before} historical Batch 9 mutation applies`);
  const mutatedBaseline = `${parts[0]}${CURRENT_HISTORY_MARKER}${parts[1].replace(before, after)}`;
  return source.replace(baseline, mutatedBaseline);
}

function assertStageBProjection() {
  assert.deepEqual(
    {completed_topics: status.completed_topics, content_documents: status.content_documents, governed_sources: status.governed_sources},
    {completed_topics: 82, content_documents: 126, governed_sources: 599},
  );
  assert.equal(publicLedger.sources.length, 599);

  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-08')?.published, topics.get('STY-08')?.status.value, styles.get('STY-08')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-09')?.published, topics.get('STY-09')?.status.value, styles.get('STY-09')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-10')?.published, topics.get('STY-10')?.status.value, styles.get('STY-10')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-11')?.published, topics.get('STY-11')?.status.value, styles.get('STY-11')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-12')?.published, topics.get('STY-12')?.status.value, styles.get('STY-12')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-13')?.published, topics.get('STY-13')?.status.value, styles.get('STY-13')?.published], [true, 'pending', true]);
  assert.deepEqual([topics.get('STY-14')?.published, topics.get('STY-14')?.status.value, styles.get('STY-14')?.published], [false, 'pending', false]);
}

const [review, browserBytes, productionBrowserBytes, stageBProductionBrowserBytes, immediateReviewBytes, immediateStageARawBytes, immediateStageAProductionRawBytes, immediateStageBProductionRawBytes, backlog, status, manifest, indexes, publicLedger] = await Promise.all([
  optional(REVIEW, 'utf8'), optional(RAW_BROWSER), optional(PRODUCTION_RAW_BROWSER), optional(STAGE_B_PRODUCTION_RAW_BROWSER), required(IMMEDIATE_REVIEW),
  required(IMMEDIATE_STAGE_A_RAW), required(IMMEDIATE_STAGE_A_PRODUCTION_RAW), required(IMMEDIATE_STAGE_B_PRODUCTION_RAW), required(BACKLOG, 'utf8'),
  required('src/generated/project-status.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-manifest.json', 'utf8').then(JSON.parse),
  required('src/generated/topic-indexes.json', 'utf8').then(JSON.parse),
  required('src/generated/source-ledger.json', 'utf8').then(JSON.parse),
]);

const IMMEDIATE_HISTORY = new Map([
  [IMMEDIATE_REVIEW, [immediateReviewBytes, IMMEDIATE_REVIEW_HASH]],
  [IMMEDIATE_STAGE_A_RAW, [immediateStageARawBytes, IMMEDIATE_STAGE_A_RAW_HASH]],
  [IMMEDIATE_STAGE_A_PRODUCTION_RAW, [immediateStageAProductionRawBytes, IMMEDIATE_STAGE_A_PRODUCTION_RAW_HASH]],
  [IMMEDIATE_STAGE_B_PRODUCTION_RAW, [immediateStageBProductionRawBytes, IMMEDIATE_STAGE_B_PRODUCTION_RAW_HASH]],
]);

function assertProjection() {
  assert.deepEqual({completed_topics: status.completed_topics, content_documents: status.content_documents, governed_sources: status.governed_sources}, {completed_topics: 82, content_documents: 126, governed_sources: 599});
  assert.equal(publicLedger.sources.length, 599);

  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-08')?.published, topics.get('STY-08')?.status.value, styles.get('STY-08')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-09')?.published, topics.get('STY-09')?.status.value, styles.get('STY-09')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-10')?.published, topics.get('STY-10')?.status.value, styles.get('STY-10')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-11')?.published, topics.get('STY-11')?.status.value, styles.get('STY-11')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-12')?.published, topics.get('STY-12')?.status.value, styles.get('STY-12')?.published], [true, 'complete', true]);
  assert.deepEqual([topics.get('STY-13')?.published, topics.get('STY-13')?.status.value, styles.get('STY-13')?.published], [true, 'pending', true]);
  assert.deepEqual([topics.get('STY-14')?.published, topics.get('STY-14')?.status.value, styles.get('STY-14')?.published], [false, 'pending', false]);
}

async function assertSty12Actionability() {
  const documents = await readContentDocuments('content');
  const reciprocals = new Set(['styles/sty-03-vertical-slice-architecture.mdx', 'styles/sty-10-microkernel-plugin-architecture.mdx', 'cases/micro-frontends-single-spa.mdx']);
  for (const document of documents) assert.equal(extractInternalLinks(document).includes('/styles/sty-12'), reciprocals.has(document.file), `${document.file} exact STY-12 actionability`);
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-13'), true, 'STY-13 has published reciprocal actions');
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
    for (const relation of state.relations) {
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
      assert.equal(relation.navigation, 'direct exact-href navigation; no physical relation click claimed');
    }
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_LINKS);
    for (const source of state.geometry.sources) assert.deepEqual([source.target, source.rel], ['_blank', 'noopener noreferrer']);
    assert.equal(state.geometry.sty09, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {events: [], hasMore: false, truncated: false});
  }
}

function assertBrowser(evidence) {
  assert.ok(evidence, `${RAW_BROWSER} exists and parses`);
  assert.equal(evidence.candidateHead, CANDIDATE_HEAD);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'http://127.0.0.1:3418/tego-arch/styles/sty-08',
  });
  assertFunctionalStates(evidence);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram; no visual PASS is claimed.',
    attempts: SCREENSHOT_ATTEMPTS,
  });
}

function assertProductionBrowser(evidence) {
  assert.ok(evidence, `${PRODUCTION_RAW_BROWSER} exists and parses`);
  assert.equal(evidence.implementationHead, PRODUCTION_IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.pages, PRODUCTION_PAGES);
  assert.deepEqual(evidence.probes, {routes: PRODUCTION_ROUTES, svg: PRODUCTION_SVG});
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'https://sealday.github.io/tego-arch/styles/sty-08',
    build: `GitHub Pages exact implementation head ${PRODUCTION_IMPLEMENTATION_HEAD}; run ${PRODUCTION_PAGES.runId}; build job ${PRODUCTION_PAGES.buildJobId}; deploy job ${PRODUCTION_PAGES.deployJobId}`,
  });
  assertFunctionalStates(evidence);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram; no visual PASS is claimed.',
    attempts: PRODUCTION_SCREENSHOT_ATTEMPTS,
  });
}

function assertStageBProductionBrowser(evidence) {
  assert.ok(evidence, `${STAGE_B_PRODUCTION_RAW_BROWSER} exists and parses`);
  assert.deepEqual(Object.keys(evidence), ['implementationHead', 'pages', 'probes', 'collection', 'states', 'screenshotEvidence']);
  assert.equal(evidence.implementationHead, STAGE_B_IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.pages, STAGE_B_PRODUCTION_PAGES);
  assert.deepEqual(evidence.probes, {routes: PRODUCTION_ROUTES, svg: PRODUCTION_SVG});
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'https://sealday.github.io/tego-arch/styles/sty-08',
    build: `GitHub Pages exact implementation head ${STAGE_B_IMPLEMENTATION_HEAD}; run ${STAGE_B_PRODUCTION_PAGES.runId}; build job ${STAGE_B_PRODUCTION_PAGES.buildJobId}; deploy job ${STAGE_B_PRODUCTION_PAGES.deployJobId}`,
  });
  assertFunctionalStates(evidence);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram; no visual PASS is claimed.',
    attempts: STAGE_B_PRODUCTION_SCREENSHOT_ATTEMPTS,
  });
}

async function assertReview(source) {
  assert.match(source, /^# G009 Batch 9 Stage A Review$/mu);
  const projection = section(source, 'Stage A projection');
  for (const literal of [
    'Projection: `60 completed topics / 103 content documents / 535 governed sources`.',
    'STY-08: `published / pending`.',
    'STY-09: `unpublished / pending / non-actionable`; actionable route count: `0`.',
  ]) assert.ok(projection.includes(literal), literal);
  const identities = section(source, 'Artifact identities');
  for (const [path, expectedHash] of STABLE_ARTIFACT_HASHES) {
    const bytes = execFileSync('git', ['show', `${CANDIDATE_HEAD}:${path}`], {
      encoding: null,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.equal(sha256(bytes), expectedHash, `${path} immutable artifact bytes`);
    assert.match(identities, new RegExp(`\\| ${escapeRegExp(`\`${path}\``)} \\| ${bytes.length.toLocaleString('en-US')} \\| ${escapeRegExp(`\`${expectedHash}\``)} \\|`, 'u'));
  }
  assert.match(identities, new RegExp(`\\| ${escapeRegExp(`\`${LEDGER}\``)} \\| ${HISTORICAL_LEDGER_IDENTITY.bytes.toLocaleString('en-US')} \\| ${escapeRegExp(`\`${HISTORICAL_LEDGER_IDENTITY.sha256}\``)} \\|`, 'u'));
  const qa = section(source, 'Local in-app Browser QA');
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  for (const literal of [
    `The exact implementation candidate \`${CANDIDATE_HEAD}\` was rebuilt and served at \`http://127.0.0.1:3418/tego-arch/styles/sty-08\``,
    'States accepted: `4/4`; wrapper interaction checks: `12/12`',
    'Relation destination/H1/return checks: `16/16`.',
    'The Erlang/OTP case route\'s rendered H1 is `监督树：把失败恢复设计成层级控制协议`',
    'SVG loaded in every state: intrinsic `48x150`; rendered `800x2480`.',
    'exact href/`_blank`/`noopener noreferrer` checks: `24/24`; STY-09 actionable count: `0` per state.',
    'warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false` and `truncated=false`.',
    `Raw Browser JSON: \`${RAW_BROWSER}\`, SHA-256 \`${sha256(browserBytes)}\`.`,
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.',
    'Exactly three fresh IAB full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram.',
    'No Chrome fallback, prior raw, old screenshot or visual PASS is claimed.',
  ]) assert.ok(qa.includes(literal), literal);
  const checkpoint = section(source, 'Independent review checkpoint');
  for (const literal of [
    `Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`,
    `Exact evidence head: \`${EVIDENCE_HEAD}\`.`,
    'Independent code/spec/security review: `READY / APPROVE`; findings: `0`.',
    'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), literal);
}

async function assertProductionReview(source) {
  const production = subsection(source, 'Stage A production deployment');
  for (const literal of [
    `Exact implementation head: \`${PRODUCTION_IMPLEMENTATION_HEAD}\`.`,
    `Exact Pages run: \`${PRODUCTION_PAGES.runId}\`; workflow: \`completed / success\`.`,
    `Build job: \`${PRODUCTION_PAGES.buildJobId}\`; status: \`completed / success\`.`,
    `Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`; status: \`completed / success\`.`,
    'Required HTML routes: `8/8`; every route returned `200` with `text/html; charset=utf-8`.',
    `Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`,
    `Production raw Browser JSON: \`${PRODUCTION_RAW_BROWSER}\`; \`${PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes; SHA-256 \`${PRODUCTION_RAW_BROWSER_HASH}\`.`,
    'Functional production QA: `PASS`; states `4/4`; wrapper focus/`:focus-visible`/3px/ArrowRight checks `12/12`; relation href/H1/return checks `16/16`; source href/target/rel checks `24/24`.',
    'SVG geometry: intrinsic `48x150`; rendered `800x2480`; STY-09 actionable count `0` in every state; warning/error logs and diagnostic events `0`; every diagnostic page has `hasMore=false` and `truncated=false`.',
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; exactly three fresh attempts are `CAPTURED_REJECTED` because each repeated the opening viewport instead of covering the complete page and architecture diagram.',
    'No visual PASS is claimed.',
    'Production status: `STAGE_A_FUNCTIONAL_PASS / SCREENSHOTS_BLOCKED_NOT_ACCEPTED`.',
    'Scope remains `STAGE_A_ONLY`; backlog and Stage B are unchanged.',
  ]) assert.ok(production.includes(literal), literal);

  assert.ok(productionBrowserBytes, `${PRODUCTION_RAW_BROWSER} exists`);
  assert.equal(productionBrowserBytes.length, PRODUCTION_RAW_BROWSER_BYTES);
  assert.equal(sha256(productionBrowserBytes), PRODUCTION_RAW_BROWSER_HASH);
}

test('preserves the complete immediate STY-07 backlog suffix and Batch 8 review bytes', () => {
  assert.equal(sha256(immediateReviewBytes), IMMEDIATE_REVIEW_HASH);
  const lines = backlog.split(/\r?\n/u).filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(lines.length, 1, 'one current release baseline');
  const marker = '- **当前发布基线：** ';
  assert.ok(lines[0].startsWith(marker));
  const current = lines[0].slice(marker.length);
  const historyParts = current.split(CURRENT_HISTORY_MARKER);
  assert.equal(historyParts.length, 2, 'one immutable Batch 9 history boundary');
  const immediateMarker = CURRENT_BASELINE_PREFIX + IMMEDIATE_BACKLOG_MARKER;
  assert.ok(historyParts[1].startsWith(immediateMarker));
  const suffix = historyParts[1].slice(immediateMarker.length);
  assert.match(suffix, /^2026-08-14 G009 Batch 8 已完成 STY-07/u);
  assert.equal(sha256(suffix), IMMEDIATE_BACKLOG_SUFFIX_HASH);
  for (const mutated of [Buffer.concat([immediateReviewBytes, Buffer.from('x')]), immediateReviewBytes.subarray(0, -1)]) assert.notEqual(sha256(mutated), IMMEDIATE_REVIEW_HASH);
  for (const mutated of [`${suffix}x`, suffix.slice(0, -1)]) assert.notEqual(sha256(mutated), IMMEDIATE_BACKLOG_SUFFIX_HASH);
});

test('preserves canonical STY-08 Stage A history while current projection leaves STY-10 published/pending and STY-11 non-actionable', async () => {
  assertProjection();
  await assertSty12Actionability();
});

test('binds exact artifacts, tracked Browser bytes, and final independent review verdicts', async () => {
  const browser = browserBytes && JSON.parse(browserBytes);
  assertBrowser(browser);
  await assertReview(review);
});

test('binds complete tracked Browser bytes to one fixed SHA-256', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  assert.equal(sha256(browserBytes), RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([browserBytes, Buffer.from('x')])), RAW_BROWSER_HASH);
  assert.notEqual(sha256(browserBytes.subarray(0, -1)), RAW_BROWSER_HASH);
});

test('rejects Browser semantic, diagnostic, screenshot, and exact-head mutations', () => {
  assert.ok(browserBytes, `${RAW_BROWSER} exists`);
  const browser = JSON.parse(browserBytes);
  assertBrowser(browser);
  const mutations = [
    (copy) => { copy.candidateHead = '0'.repeat(40); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.page.scrollWidth += 1; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0]); },
    (copy) => { copy.states.desktopLight.geometry.wrappers[0].clientWidth += 1; },
    (copy) => { copy.states.mobileLight.geometry.wrappers[2].scrollWidth += 1; },
    (copy) => { copy.states.desktopDark.interactions.reverse(); },
    (copy) => { copy.states.desktopDark.interactions[1].expectedScrollDelta += 1; },
    (copy) => { copy.states.desktopLight.interactions[0].after.scrollLeft += 1; },
    (copy) => { copy.states.desktopDark.interactions[2].before.outline = 'none'; },
    (copy) => { copy.states.mobileDark.interactions[0].before.focusVisible = false; },
    (copy) => { copy.states.mobileLight.relations[0].returnedToArticle = false; },
    (copy) => { copy.states.mobileDark.relations[0] = {...copy.states.mobileDark.relations[0], href: '/tego-arch/styles/sty-99', h1: 'fabricated', expectedH1: 'fabricated'}; },
    (copy) => { copy.states.desktopLight.relations.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.desktopLight.geometry.svg.naturalWidth = 0; },
    (copy) => { copy.states.desktopDark.geometry.svg.renderedHeight += 1; },
    (copy) => { copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'; },
    (copy) => { copy.states.desktopDark.geometry.sources[0].rel = ''; },
    (copy) => { copy.states.mobileLight.geometry.sources.reverse(); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.states.mobileDark.geometry.sty09 = 1; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.reason = 'fabricated visual coverage'; },
    (copy) => { copy.screenshotEvidence.attempts.splice(1, 1); },
    (copy) => { copy.screenshotEvidence.attempts[0].path = '/tmp/fabricated.png'; },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(browser); mutate(copy);
    assert.throws(() => assertBrowser(copy), {name: 'AssertionError'});
  }
});

test('rejects wrong review heads, weakened verdicts, stale PENDING, fabricated deployment, and fabricated visual PASS', async () => {
  await assertReview(review);
  for (const [before, after] of [
    [`Exact implementation candidate head: \`${CANDIDATE_HEAD}\`.`, `Exact implementation candidate head: \`${'0'.repeat(40)}\`.`],
    [`Exact evidence head: \`${EVIDENCE_HEAD}\`.`, `Exact evidence head: \`${'1'.repeat(40)}\`.`],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `NOT READY`; findings: `0`.'],
    ['Independent code/spec/security review: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review: `READY / APPROVE`; findings: `1`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PENDING`; findings: `0`.'],
    ['Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `1`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `BLOCKED`; blockers: `0`.'],
    ['Independent architecture/invariant review: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review: `CLEAR / READY`; blockers: `1`.'],
    ['Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['Scope boundary: `STAGE_A_ONLY`;', 'Scope boundary: `STAGE_B`;'],
    ['Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `PASS`.'],
    ['No Chrome fallback, prior raw, old screenshot or visual PASS is claimed.', 'Visual PASS is claimed.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    await assert.rejects(() => assertReview(mutated), {name: 'AssertionError'});
  }
});

test('binds exact Stage A production publication and functional IAB evidence', async () => {
  assert.ok(productionBrowserBytes, `${PRODUCTION_RAW_BROWSER} exists`);
  assert.equal(productionBrowserBytes.length, PRODUCTION_RAW_BROWSER_BYTES);
  assert.equal(sha256(productionBrowserBytes), PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([productionBrowserBytes, Buffer.from('x')])), PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(productionBrowserBytes.subarray(0, -1)), PRODUCTION_RAW_BROWSER_HASH);
  assertProductionBrowser(JSON.parse(productionBrowserBytes));
  await assertProductionReview(review);
});

test('rejects production SHA, run, job, route, SVG, semantic, diagnostic, screenshot, and review mutations', async () => {
  assert.ok(productionBrowserBytes, `${PRODUCTION_RAW_BROWSER} exists`);
  const productionBrowser = JSON.parse(productionBrowserBytes);
  assertProductionBrowser(productionBrowser);
  const mutations = [
    (copy) => { copy.implementationHead = '0'.repeat(40); },
    (copy) => { copy.pages.runId += 1; },
    (copy) => { copy.pages.status = 'in_progress'; },
    (copy) => { copy.pages.conclusion = 'failure'; },
    (copy) => { copy.pages.buildJobId += 1; },
    (copy) => { copy.pages.buildStatus = 'queued'; },
    (copy) => { copy.pages.buildConclusion = 'failure'; },
    (copy) => { copy.pages.deployJobId += 1; },
    (copy) => { copy.pages.deployStatus = 'queued'; },
    (copy) => { copy.pages.deployConclusion = 'failure'; },
    (copy) => { copy.probes.routes.pop(); },
    (copy) => { copy.probes.routes.reverse(); },
    (copy) => { copy.probes.routes[2].path = '/styles/sty-09'; },
    (copy) => { copy.probes.routes[2].status = 404; },
    (copy) => { copy.probes.routes[2].contentType = 'text/plain'; },
    (copy) => { copy.probes.svg.url = 'https://example.com/fabricated.svg'; },
    (copy) => { copy.probes.svg.status = 404; },
    (copy) => { copy.probes.svg.contentType = 'text/html'; },
    (copy) => { copy.probes.svg.bytes += 1; },
    (copy) => { copy.probes.svg.sha256 = '0'.repeat(64); },
    (copy) => { copy.collection.browser = 'Chrome'; },
    (copy) => { copy.collection.servedUrl = 'http://127.0.0.1/'; },
    (copy) => { copy.collection.build = 'later evidence run'; },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.desktopLight.geometry.page.scrollWidth += 1; },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { copy.states.mobileLight.geometry.wrappers[0].clientWidth += 1; },
    (copy) => { copy.states.desktopDark.interactions[1].after.scrollLeft += 1; },
    (copy) => { copy.states.mobileDark.interactions[0].before.focusVisible = false; },
    (copy) => { copy.states.mobileLight.relations[0].returnedToArticle = false; },
    (copy) => { copy.states.desktopLight.relations[0].href = '/tego-arch/styles/sty-99'; },
    (copy) => { copy.states.desktopLight.geometry.sources[0].target = '_self'; },
    (copy) => { copy.states.desktopDark.geometry.sources[0].rel = ''; },
    (copy) => { copy.states.desktopDark.geometry.svg.renderedHeight += 1; },
    (copy) => { copy.states.mobileDark.geometry.sty09 = 1; },
    (copy) => { copy.states.mobileDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.reason = 'fabricated visual coverage'; },
    (copy) => { copy.screenshotEvidence.attempts.pop(); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts[0].path = '/tmp/fabricated.png'; },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); },
    (copy) => { copy.screenshotEvidence.attempts[2].status = 'PASS'; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(productionBrowser); mutate(copy);
    assert.throws(() => assertProductionBrowser(copy), {name: 'AssertionError'});
  }

  await assertProductionReview(review);
  for (const [before, after] of [
    [`Exact implementation head: \`${PRODUCTION_IMPLEMENTATION_HEAD}\`.`, `Exact implementation head: \`${'0'.repeat(40)}\`.`],
    [`Exact Pages run: \`${PRODUCTION_PAGES.runId}\`;`, 'Exact Pages run: `0`;'],
    [`Build job: \`${PRODUCTION_PAGES.buildJobId}\`;`, 'Build job: `0`;'],
    [`Deploy job: \`${PRODUCTION_PAGES.deployJobId}\`;`, 'Deploy job: `0`;'],
    ['Required HTML routes: `8/8`;', 'Required HTML routes: `7/8`;'],
    [`Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${PRODUCTION_SVG.sha256}\`; exact reviewed byte identity: \`PASS\`.`, `Reviewed SVG: \`${PRODUCTION_SVG.bytes.toLocaleString('en-US')}\` bytes; MIME \`${PRODUCTION_SVG.contentType}\`; SHA-256 \`${'0'.repeat(64)}\`; exact reviewed byte identity: \`PASS\`.`],
    [`\`${PRODUCTION_RAW_BROWSER_BYTES.toLocaleString('en-US')}\` bytes;`, '`0` bytes;'],
    [`SHA-256 \`${PRODUCTION_RAW_BROWSER_HASH}\`.`, `SHA-256 \`${'1'.repeat(64)}\`.`],
    ['Functional production QA: `PASS`;', 'Functional production QA: `PENDING`;'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`;', 'Screenshot evidence: `PASS`;'],
    ['No Chrome fallback, prior raw, historical screenshot, or substituted browser surface supports this production record. No visual PASS is claimed.', 'No Chrome fallback, prior raw, historical screenshot, or substituted browser surface supports this production record. Visual PASS is claimed.'],
    ['Scope remains `STAGE_A_ONLY`; backlog and Stage B are unchanged.', 'Scope is `STAGE_B`; backlog is closed.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${before} production-review mutation applies`);
    await assert.rejects(() => assertProductionReview(mutated), {name: 'AssertionError'}, `${before} production-review mutation rejected`);
  }
});

test('closes only STY-08 from exact Stage A production evidence and preserves complete Batch 8 history', async () => {
  assertImmediateHistory();
  assertStageBBacklog(backlog);
  assertStageBProjection();
  assertStageBReview(review);
  await assertSty12Actionability();
});

test('binds exact Stage B production publication and functional IAB evidence', () => {
  assert.ok(stageBProductionBrowserBytes, `${STAGE_B_PRODUCTION_RAW_BROWSER} exists`);
  assert.equal(stageBProductionBrowserBytes.length, STAGE_B_PRODUCTION_RAW_BROWSER_BYTES);
  assert.equal(sha256(stageBProductionBrowserBytes), STAGE_B_PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(Buffer.concat([stageBProductionBrowserBytes, Buffer.from('x')])), STAGE_B_PRODUCTION_RAW_BROWSER_HASH);
  assert.notEqual(sha256(stageBProductionBrowserBytes.subarray(0, -1)), STAGE_B_PRODUCTION_RAW_BROWSER_HASH);
  assertStageBProductionBrowser(JSON.parse(stageBProductionBrowserBytes));
  assertStageBReview(review);
});

test('rejects Stage B run, job, route, SVG, semantic, diagnostic, screenshot, and deployment-review mutations', () => {
  assert.ok(stageBProductionBrowserBytes, `${STAGE_B_PRODUCTION_RAW_BROWSER} exists`);
  const production = JSON.parse(stageBProductionBrowserBytes);
  assertStageBProductionBrowser(production);
  const mutations = [
    (copy) => { copy.fabricatedEvidence = true; },
    (copy) => { copy.implementationHead = '0'.repeat(40); },
    (copy) => { copy.pages.runId += 1; },
    (copy) => { copy.pages.buildJobId += 1; },
    (copy) => { copy.pages.deployJobId += 1; },
    (copy) => { copy.pages.conclusion = 'failure'; },
    (copy) => { copy.probes.routes.pop(); },
    (copy) => { copy.probes.routes.reverse(); },
    (copy) => { copy.probes.routes[2].path = '/styles/sty-09'; },
    (copy) => { copy.probes.svg.bytes += 1; },
    (copy) => { copy.probes.svg.sha256 = '0'.repeat(64); },
    (copy) => { copy.collection.browser = 'Chrome'; },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.mobileLight.geometry.wrappers[0].clientWidth += 1; },
    (copy) => { copy.states.desktopDark.interactions[1].after.scrollLeft += 1; },
    (copy) => { copy.states.mobileDark.interactions[0].before.focusVisible = false; },
    (copy) => { copy.states.mobileLight.relations[0].returnedToArticle = false; },
    (copy) => { copy.states.desktopLight.geometry.sources[0].target = '_self'; },
    (copy) => { copy.states.desktopDark.geometry.svg.renderedHeight += 1; },
    (copy) => { copy.states.mobileDark.geometry.sty09 = 1; },
    (copy) => { copy.states.mobileDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
    (copy) => { copy.screenshotEvidence.attempts.pop(); },
    (copy) => { copy.screenshotEvidence.attempts.reverse(); },
    (copy) => { copy.screenshotEvidence.attempts[0].bytes += 1; },
    (copy) => { copy.screenshotEvidence.attempts[1].sha256 = '0'.repeat(64); },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(production); mutate(copy);
    assert.throws(() => assertStageBProductionBrowser(copy), {name: 'AssertionError'});
  }
  const stageBSource = section(review, 'Stage B closure candidate');
  for (const [before, after] of [
    [`Exact Stage B implementation head: \`${STAGE_B_IMPLEMENTATION_HEAD}\``, `Exact Stage B implementation head: \`${'0'.repeat(40)}\``],
    [`Exact Stage B Pages run: \`${STAGE_B_PRODUCTION_PAGES.runId}\``, 'Exact Stage B Pages run: `0`'],
    [`Stage B build job: \`${STAGE_B_PRODUCTION_PAGES.buildJobId}\``, 'Stage B build job: `0`'],
    [`Stage B deploy job: \`${STAGE_B_PRODUCTION_PAGES.deployJobId}\``, 'Stage B deploy job: `0`'],
    ['Stage B required production HTML routes: `8/8`', 'Stage B required production HTML routes: `7/8`'],
    [STAGE_B_PRODUCTION_RAW_BROWSER_HASH, '0'.repeat(64)],
    ['Stage B functional production QA: `PASS`', 'Stage B functional production QA: `PENDING`'],
    ['Stage B production screenshot evidence: `BLOCKED / NOT_ACCEPTED`', 'Stage B production screenshot evidence: `PASS`'],
    ['Stage B deployment status: `SUCCESS / PASS`', 'Stage B deployment status: `PENDING / NOT_RUN`'],
  ]) {
    const mutatedStageB = stageBSource.replace(before, after);
    assert.notEqual(mutatedStageB, stageBSource, `${before} Stage B production review mutation applies`);
    assert.throws(() => assertStageBReview(review.replace(stageBSource, mutatedStageB)), {name: 'AssertionError'});
  }
});

test('rejects Stage B production, projection, history, next-topic, verdict, deployment, and visual-claim mutations', () => {
  assertImmediateHistory();
  assertStageBBacklog(backlog);
  assertStageBReview(review);

  for (const [path, [bytes, expectedHash]] of IMMEDIATE_HISTORY) {
    const appended = new Map(IMMEDIATE_HISTORY);
    appended.set(path, [Buffer.concat([bytes, Buffer.from('x')]), expectedHash]);
    assert.throws(() => assertImmediateHistory(appended), {name: 'AssertionError'});
    const truncated = new Map(IMMEDIATE_HISTORY);
    truncated.set(path, [bytes.subarray(0, -1), expectedHash]);
    assert.throws(() => assertImmediateHistory(truncated), {name: 'AssertionError'});
  }

  const backlogMutations = [
    [PRODUCTION_IMPLEMENTATION_HEAD, '0'.repeat(40)],
    ['2026-08-16 review', '2026-08-15 review'],
    [`Pages run [\`${PRODUCTION_PAGES.runId}\`]`, 'Pages run [`0`]'],
    [`build job \`${PRODUCTION_PAGES.buildJobId}\``, 'build job `0`'],
    [`deploy job \`${PRODUCTION_PAGES.deployJobId}\``, 'deploy job `0`'],
    ['production HTML routes `8/8`', 'production HTML routes `7/8`'],
    ['live route `/styles/sty-08` 与 `/img/diagrams/sty-08-actor-order-fulfillment.svg` 均为 HTTP 200', 'live route `/styles/sty-08` 与 `/img/diagrams/sty-08-actor-order-fulfillment.svg` 均为 HTTP 404'],
    [PRODUCTION_SVG.sha256, '0'.repeat(64)],
    ['functional verdict PASS', 'functional verdict PENDING'],
    ['screenshot evidence BLOCKED / NOT_ACCEPTED', 'screenshot evidence PASS'],
    ['下一项为 STY-09', '下一项为 STY-08'],
    ['STY-08 为 published/complete', 'STY-08 为 published/pending'],
    ['STY-09 为 unpublished/pending/nonactionable', 'STY-09 为 published/complete'],
    ['61 个已完成主题、104 篇内容文档与 539 个受治理来源', '60 个已完成主题、104 篇内容文档与 539 个受治理来源'],
    ['final readiness 均为 `PENDING`', 'final readiness 均为 `READY`'],
    ['deployment status 为 `PENDING / NOT_RUN`', 'deployment status 为 `NOT_RUN`'],
    ['deployment status 为 `PENDING / NOT_RUN`', 'deployment status 为 `PENDING`'],
    ['deployment status 为 `PENDING / NOT_RUN`', 'deployment status 为 `READY / NOT_RUN`'],
    ['deployment status 为 `PENDING / NOT_RUN`', 'deployment status 为 `PENDING / SUCCESS`'],
  ];
  for (const [before, after] of backlogMutations) {
    const historicalOnly = before.includes('final readiness') || before.includes('deployment status');
    const mutated = historicalOnly ? replaceHistoricalBatch9Literal(backlog, before, after) : backlog.replace(before, after);
    assert.notEqual(mutated, backlog, `${before} backlog mutation applies`);
    assert.throws(() => assertStageBBacklog(mutated), {name: 'AssertionError'}, `${before} backlog mutation rejected`);
  }
  const baseline = currentReleaseBaseline(backlog);
  const suffixStart = baseline.indexOf(IMMEDIATE_BACKLOG_MARKER) + IMMEDIATE_BACKLOG_MARKER.length;
  const suffix = baseline.slice(suffixStart);
  for (const mutatedSuffix of [`${suffix}x`, suffix.slice(0, -1)]) {
    const mutated = backlog.replace(suffix, mutatedSuffix);
    assert.throws(() => assertStageBBacklog(mutated), {name: 'AssertionError'});
  }

  const reviewMutations = [
    ['Closure date: `2026-08-16`', 'Closure date: `2026-08-15`'],
    [`Exact Stage A implementation head: \`${PRODUCTION_IMPLEMENTATION_HEAD}\``, `Exact Stage A implementation head: \`${'0'.repeat(40)}\``],
    [`Exact Pages run: \`${PRODUCTION_PAGES.runId}\``, 'Exact Pages run: `0`'],
    [`Build job: \`${PRODUCTION_PAGES.buildJobId}\``, 'Build job: `0`'],
    [`Deploy job: \`${PRODUCTION_PAGES.deployJobId}\``, 'Deploy job: `0`'],
    ['Required production HTML routes: `8/8`', 'Required production HTML routes: `7/8`'],
    ['Reviewed production SVG: HTTP `200`', 'Reviewed production SVG: HTTP `404`'],
    [PRODUCTION_SVG.sha256, '0'.repeat(64)],
    ['Functional production QA: `PASS`', 'Functional production QA: `PENDING`'],
    ['Stage A production screenshot evidence: `BLOCKED / NOT_ACCEPTED`', 'Stage A production screenshot evidence: `PASS`'],
    ['Projection: `61 completed topics / 104 content documents / 539 governed sources`', 'Projection: `60 completed topics / 104 content documents / 539 governed sources`'],
    ['STY-08 target: `published / complete`', 'STY-08 target: `published / pending`'],
    ['STY-09 target: `unpublished / pending / non-actionable`', 'STY-09 target: `published / complete`'],
    [`Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\``, `Exact Stage B reviewed head: \`${'0'.repeat(40)}\``],
    ['Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`', 'Independent Stage B code/spec/security review: `PENDING`; findings: `PENDING`'],
    ['Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`', 'Independent Stage B code/spec/security review: `NOT READY`; findings: `0`'],
    ['Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `0`', 'Independent Stage B code/spec/security review: `READY / APPROVE`; findings: `1`'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent Stage B content/evidence/rights review: `PENDING`; rights: `PENDING`; findings: `PENDING`'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent Stage B content/evidence/rights review: `CHANGES`; rights: `PASS`; findings: `0`'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PENDING`; findings: `0`'],
    ['Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`', 'Independent Stage B content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `1`'],
    ['Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`', 'Independent Stage B architecture/invariant review: `PENDING`; blockers: `PENDING`'],
    ['Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`', 'Independent Stage B architecture/invariant review: `BLOCKED`; blockers: `0`'],
    ['Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `0`', 'Independent Stage B architecture/invariant review: `CLEAR / READY`; blockers: `1`'],
    ['Final Stage B review judgment: `READY`', 'Final Stage B review judgment: `PENDING`'],
    ['Stage B scope boundary: `STAGE_B`', 'Stage B scope boundary: `STAGE_B_CANDIDATE_ONLY`'],
    ['Stage B scope boundary: `STAGE_B`', 'Stage B scope boundary: `STAGE_B_DEPLOYED`'],
    ['Stage B deployment status: `SUCCESS / PASS`', 'Stage B deployment status: `NOT_RUN`'],
    ['Stage B deployment status: `SUCCESS / PASS`', 'Stage B deployment status: `PENDING`'],
    ['Stage B deployment status: `SUCCESS / PASS`', 'Stage B deployment status: `READY / NOT_RUN`'],
    ['Stage B deployment status: `SUCCESS / PASS`', 'Stage B deployment status: `PENDING / SUCCESS`'],
    ['no visual PASS is claimed', 'visual PASS is claimed'],
  ];
  const stageBSource = section(review, 'Stage B closure candidate');
  for (const [before, after] of reviewMutations) {
    const mutatedStageB = stageBSource.replace(before, after);
    assert.notEqual(mutatedStageB, stageBSource, `${before} Stage B review mutation applies`);
    const mutated = review.replace(stageBSource, mutatedStageB);
    assert.throws(() => assertStageBReview(mutated), {name: 'AssertionError'}, `${before} review mutation rejected`);
  }
  assert.throws(() => assertStageBReview(`${review}\n\n## Stage B closure candidate\n${STAGE_B_REVIEW_LINES.join('\n')}`), {name: 'AssertionError'});
});
