import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access, readFile} from 'node:fs/promises';
import test from 'node:test';

const ARTICLE = 'content/styles/sty-05-microservices.mdx';
const DRAWIO = 'diagrams/sty-05-microservices-order-saga.drawio';
const SVG = 'static/img/diagrams/sty-05-microservices-order-saga.svg';
const ROUTE = '/styles/sty-05';
const SVG_ROUTE = '/img/diagrams/sty-05-microservices-order-saga.svg';
const SOURCE_IDS = [
  'src-lewis-fowler-microservices',
  'src-microsoft-microservices-architecture-style',
  'src-microservicesio-database-per-service',
  'src-microservicesio-saga',
  'src-aws-decompose-business-capability',
  'src-atlas-sty05-microservices-order-saga',
];
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const REVIEWED_HEAD = '40283eeadb9525df93ea884d23bd1953070d78a8';
const IMPLEMENTATION_HEAD = 'e82760843a55ba98a09793215e5f13e0c1fbfaa8';
const PAGES_RUN_ID = '31490981657';
const PAGES_BUILD_JOB_ID = '93777183963';
const PAGES_DEPLOY_JOB_ID = '93777844175';
const STAGE_B_REVIEWED_HEAD = '2bf44177045039b6e1037af338350540a69ead3c';
const STAGE_B_DEPLOYED_HEAD = '43573370131e703d004b75d64a820f448235037f';
const STAGE_B_PAGES_RUN_ID = '31502633120';
const STAGE_B_BUILD_JOB_ID = '93816247824';
const STAGE_B_DEPLOY_JOB_ID = '93817077728';
const FINAL_BROWSER_ARTIFACT_HASH = 'ddb8bb0230e03b7a14ea8d0f2f05706d61d209f8ff467dbe20b0ddbfdb691e09';
const IMMEDIATE_HISTORICAL_BASELINE_HASH = '562b90de174139bc103000ff1c83e88b08349300ea67eee554fcd38772251c09';
const HISTORICAL_BACKLOG_SUFFIX_HASH = '050238d189c4170c5d22da13181ce7ff7556f90e193c07358fb9b3d1fe133efa';
const BROWSER_ARTIFACT_HASH = 'b139a174432e1684d9a9387e839807fc22b22c6ba0b2cb6e18009536a416f767';
const PRODUCTION_BROWSER_ARTIFACT_HASH = '638b6141975cba48c43e5956f78fe029b780f6d74b8d9c8ddb1afad4b7be2ff2';
const SCREENSHOT_HASHES = {
  desktopLight: 'b2939596c3ddaadcd2700c32eb019ef943e89160a4e88c896957e8259030ac7e',
  desktopDark: '9f49172f0c2d631799c7b41b92d870913133dfa4ebf9d1d9429f99a3f98c375c',
  mobileLight: '438b4f50bee195a80aac053662d44dd95e75bba4a1bd9723678480f42a1d3b1b',
  mobileDark: '7262a8f5e2066ff57eca1bb287e3b8d7f9faa941f3fe043870b748fe286404d7',
};
const PRODUCTION_SCREENSHOT_HASHES = {
  desktopLight: 'abb7a3b4a0280221c2eb2282917788e3427e5dc75cbddd6dbb9b5cc0e9e70da0',
  desktopDark: '56d3f8184b7bf00d0247bc3521bec4c8c9f84eb9e323445c28819ad3f3839124',
  mobileLight: '9953a1b1cae9bc858e622b2e592906a46ee39f391d0906e9224a48ef2f12c312',
  mobileDark: 'c49b336de616c04c4e5df114844c2fe89828ee360acb12ce6702d034e85594ee',
};
const PRODUCTION_SOURCE_HREFS = [
  'https://martinfowler.com/articles/microservices.html',
  'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices',
  'https://microservices.io/patterns/data/database-per-service.html',
  'https://microservices.io/patterns/data/saga.html',
  'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/decompose-business-capability.html',
];

const [article, backlog, review, manifest, indexes, projectStatus, publicLedger] =
  await Promise.all([
    readFile(new URL(`../${ARTICLE}`, import.meta.url), 'utf8'),
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
    readFile(new URL('../docs/reviews/g009-batch6.md', import.meta.url), 'utf8')
      .catch((error) => error?.code === 'ENOENT' ? '' : Promise.reject(error)),
    readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);

const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));
const stylesById = new Map(indexes.style.map((topic) => [topic.id, topic]));
const publicSourcesById = new Map(publicLedger.sources.map((source) => [source.id, source]));
const publishedRoutes = new Set(manifest.topics.filter(({published}) => published).map(({slug}) => slug));

function markdownLinks(source) {
  return [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)].map(([, target]) => target);
}

function sha256(source) {
  return createHash('sha256').update(source).digest('hex');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function section(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const matches = headings.filter((match) => match[1] === heading);
  assert.equal(matches.length, 1, `review must contain one ${heading} section`);
  const match = matches[0];
  const next = headings.find((candidate) => candidate.index > match.index);
  return source.slice(match.index + match[0].length, next?.index ?? source.length).trim();
}

function assertFinalIndependentReview(source) {
  const independent = section(source, 'Independent review checkpoint');
  for (const literal of [
    `Exact reviewed head: \`${REVIEWED_HEAD}\`.`,
    'Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.',
    'Independent content, evidence, and rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent architecture reviewer (`architect`): `CLEAR / READY`; findings: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) {
    assert.ok(independent.includes(literal), `independent-review literal: ${literal}`);
  }
  assert.doesNotMatch(independent, /`PENDING`|Deployment status: `SUCCESS`/u);
}

function assertFourStateEvidence(source) {
  const browser = section(source, 'Local in-app Browser QA');
  for (const state of STATES) {
    assert.ok(browser.includes(`| \`${state}\` |`), `${state} row`);
  }
  for (const literal of [
    'States accepted: `4/4`.',
    'Wrapper interaction checks: `12/12`.',
    'Relation destination/H1/return checks: `16/16`.',
    'Remote source anchors: `5` per state; unique remote domains: `4` observed per state (minimum `3`).',
    'STY-06 actionable count: `0` in every state.',
    'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.',
    'Visual inspection: diagram `PASS` in light and dark themes.',
  ]) {
    assert.ok(browser.includes(literal), `Browser literal: ${literal}`);
  }
  assert.ok(browser.includes(
    `Raw Browser JSON: \`.superpowers/sdd/task-5-browser-qa.json\`, SHA-256 \`${BROWSER_ARTIFACT_HASH}\`.`,
  ));
  for (const state of STATES) {
    const screenshotLine = browser.split(/\r?\n/u)
      .find((line) => line.includes(`${state} screenshot:`));
    assert.ok(screenshotLine, `${state} screenshot line`);
    assert.match(screenshotLine, /`\.superpowers\/sdd\/task-5-[A-Za-z]+\.jpg`, SHA-256 `[a-f0-9]{64}`/u);
    assert.ok(screenshotLine.includes(SCREENSHOT_HASHES[state]), `${state} exact screenshot SHA-256`);
  }
  assert.match(browser, /visible-DOM href selection \+ direct navigation \(local relation audit fallback\)/u);
}

function assertEvidenceProvenance(source) {
  const implementation = section(source, 'Stage A implementation evidence');
  assert.match(
    implementation,
    /Selector-bound contrast provenance:.*actual `\.sync`, `\.message`, `\.compensation`, `\.edge-label`, canvas, node, and legend presentation/su,
  );
  assert.doesNotMatch(implementation, /hard-coded expected colors unrelated to the selected elements/u);
}

function assertProductionEvidence(source) {
  const production = section(source, 'Production Stage A evidence');
  for (const literal of [
    `Exact implementation head: \`${IMPLEMENTATION_HEAD}\`.`,
    'Workflow: `Verify and deploy Docusaurus to GitHub Pages`; event: `push`.',
    `Run: \`${PAGES_RUN_ID}\`; status: \`completed\`; conclusion: \`success\`.`,
    `Build job: \`${PAGES_BUILD_JOB_ID}\`; status: \`completed\`; conclusion: \`success\`.`,
    `Deploy job: \`${PAGES_DEPLOY_JOB_ID}\`; status: \`completed\`; conclusion: \`success\`.`,
    'HTTP probes: `9/9` returned `200`; HTML content types: `8/8`; SVG content types: `1/1`.',
    'Production Browser states accepted: `4/4`.',
    'Production wrapper interaction checks: `12/12`.',
    'Production relation destination/H1/return checks: `16/16`.',
    'Production source destinations resolved: `20/20` from five exact anchors and four unique hostnames per state.',
    'STY-06 production actionable DOM count: `0` in every state.',
    'Every production state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.',
    'Stage A deployment status: `SUCCESS`.',
    'Stage B backlog closure status: `PENDING`.',
  ]) {
    assert.ok(production.includes(literal), `production literal: ${literal}`);
  }
  assert.match(
    production,
    /Live SVG: `36,867` bytes; SHA-256 `35bf03e73a1fda674701dd98a9f5dd016eaedbfb10a7a6f89485e110c5b9eb65`; exact reviewed-asset match: `true`\./u,
  );

  const stateRows = {
    desktopLight: '`1440x1000` / `light` | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40`',
    desktopDark: '`1440x1000` / `dark` | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40`',
    mobileLight: '`390x844` / `light` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40`',
    mobileDark: '`390x844` / `dark` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40`',
  };
  for (const state of STATES) {
    assert.ok(production.includes(`| \`${state}\` | ${stateRows[state]} |`), `${state} production geometry`);
    assert.ok(production.includes(
      `${state} screenshot: \`.superpowers/sdd/task-6-production-${state}.jpg\`, SHA-256 \`${PRODUCTION_SCREENSHOT_HASHES[state]}\`.`,
    ), `${state} production screenshot`);
  }

  for (const href of PRODUCTION_SOURCE_HREFS) {
    assert.ok(
      production.includes(`| \`${href}\` | \`_blank\` | \`noopener noreferrer\` | \`4/4\` |`),
      `${href} exact production source destination`,
    );
  }
  for (const [href, h1] of [
    ['/tego-arch/styles', '架构风格'],
    ['/tego-arch/styles/sty-04', '模块化单体：在一个部署单元内保护业务边界'],
    ['/tego-arch/styles/sty-03', '垂直切片架构：按用例收拢变化边界'],
    ['/tego-arch/cases/micro-frontends-single-spa', '微前端：用垂直业务切片约束跨团队所有权'],
  ]) {
    assert.ok(production.includes(`| \`${href}\` | \`${h1}\` | \`4/4\` |`), `${href} production relation return`);
  }
  assert.ok(production.includes(
    'Relation fallback: `visible-DOM href selection + direct navigation (production offscreen relation audit fallback); browser history return; no physical relation click claimed`.',
  ));
  assert.ok(production.includes(
    'Source fallback: `visible-DOM exact href selection + direct open of the same URL in an in-app Browser destination tab (_blank compatibility fallback); no physical source-anchor click claimed`.',
  ));
  assert.ok(production.includes(
    `Raw production Browser JSON: \`.superpowers/sdd/task-6-production-evidence.json\`, SHA-256 \`${PRODUCTION_BROWSER_ARTIFACT_HASH}\`.`,
  ));
}

function assertStageBClosureReview(source) {
  const closure = section(source, 'Stage B closure candidate');
  for (const literal of [
    'Closure head binding: `2bf44177045039b6e1037af338350540a69ead3c`; all independent Stage B verdicts below bind to this immutable local closure/remediation head.',
    `Evidence authority: Stage A implementation \`${IMPLEMENTATION_HEAD}\`, Pages run \`${PAGES_RUN_ID}\`, and the exact live route/SVG evidence recorded above.`,
    'Projection: 58 completed topics / 100 content documents / 519 governed sources.',
    'STY-05: `published / complete`.',
    'STY-06: `unpublished / pending`; its checkbox and route remain non-actionable.',
    'Independent Stage B code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.',
    'Independent Stage B content/evidence/rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent Stage B architecture reviewer (`architect`): `CLEAR / READY`; findings: `0`.',
    'Final Stage B review judgment: `READY`.',
    'Stage B review/remediation history: initial closure candidate `53a6b811d2dee50ab43ca817abc39fbf397cea84` received code `NOT READY` with one `IMPORTANT` and one `MINOR`, content `READY` / rights `PASS` with one `MINOR`, and architecture `CLEAR / READY` with findings `0`; remediation head `2bf44177045039b6e1037af338350540a69ead3c` then received all clean exact-head verdicts recorded above.',
    'Stage B deployment status: `SUCCESS`.',
    'Local closure status: `COMPLETE`.',
    'Final Stage B closure judgment: `PASS`; scope: functional DOM, interaction, navigation, HTTP, and exact-head deployment. New final-head screenshot evidence remains `BLOCKED / NOT_AVAILABLE` and is not claimed as `PASS`.',
  ]) {
    assert.ok(closure.includes(literal), `Stage B closure literal: ${literal}`);
  }
  assert.doesNotMatch(closure, /review slot: `PENDING`|Stage B deployment status: `PENDING`/u);
  return closure;
}

function assertStageBProductionEvidence(source) {
  const production = section(source, 'Stage B production evidence');
  for (const literal of [
    'Exact deployed closure/remediation head: `43573370131e703d004b75d64a820f448235037f`.',
    'Pages run: `31502633120`; event: `push`; status: `completed`; conclusion: `success`.',
    'Build job: `93816247824`; status: `completed`; conclusion: `success`.',
    'Deploy job: `93817077728`; status: `completed`; conclusion: `success`.',
    'HTTP probes: `9/9` returned `200`; HTML content types: `8/8`; SVG content types: `1/1`.',
    'Generated authority: `58` completed topics / `100` content documents / `519` governed sources; homepage intentionally renders only `100 / 519 / G009`.',
    'Final production IAB states: `4/4`; wrapper focus/`:focus-visible`/3px outline/ArrowRight: `12/12`; relation exact href/H1/return: `16/16`; source exact href/target/rel/destination: `20/20`; extra route/H1 navigation: `8/8`.',
    'Styles directory: STY-05 actionable and visible in every state; STY-06 text present with actionable href count `0` in every state.',
    'Article: exact H1 in every state; SVG complete at intrinsic `44x150`, rendered `800x2736`; STY-06 actionable count `0`.',
    'Mobile G009: visible `true` in light and dark, nonzero rectangles approximately `111.33x46.25`, and homepage document geometry `390/390` in both states.',
    'Every final production state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.',
    'Relation fallback: `visible-DOM href selection + direct navigation; return to exact article URL; no physical offscreen click claimed`.',
    'Source fallback: `visible-DOM exact href selection + direct open of same URL in an in-app Browser destination tab; no physical _blank click claimed`.',
    'Raw final Browser JSON: `.superpowers/sdd/task-7-production-final-evidence.json`, `45,556` bytes, SHA-256 `ddb8bb0230e03b7a14ea8d0f2f05706d61d209f8ff467dbe20b0ddbfdb691e09`.',
    'Screenshot capture status: `BLOCKED`; per-state screenshot status: `NOT_AVAILABLE`; new screenshot artifacts: `0`.',
    'Screenshot attempt 1: `desktopLight-fullPage` on fresh tab 12 -> `Page.captureScreenshot` timeout.',
    'Screenshot attempt 2: `desktopDark-viewport` on fresh tab 13 -> `Page.captureScreenshot` timeout.',
    'Screenshot attempt 3: `mobileLight-clip` on fresh tab 14 -> `Page.captureScreenshot` timeout.',
    'Screenshot limitation: supported in-app Browser capture timed out on three fresh exact-head tabs; no alternate browser, external Playwright, old screenshot substitution, invented hash, or final-head visual PASS is claimed.',
    'Historical visual baseline: Task 6 accepted article/diagram screenshots remain evidence only that the unchanged article and diagram assets were visually inspected before this final head; they are not final-head captures.',
    'Functional production acceptance: `SUCCESS`.',
    'Visual screenshot evidence: `BLOCKED / NOT_AVAILABLE`.',
    'Stage B deployment status: `SUCCESS`.',
    'Final Stage B closure judgment: `PASS` for functional DOM, interaction, navigation, HTTP, and exact-head deployment; screenshot evidence remains explicitly outside that PASS scope.',
  ]) {
    assert.ok(production.includes(literal), `Stage B production literal: ${literal}`);
  }

  for (const row of [
    '| `desktopLight` | `1440x1000` / `light` | `1440/1440`; `100/519/G009` visible | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40` |',
    '| `desktopDark` | `1440x1000` / `dark` | `1440/1440`; `100/519/G009` visible | `1440/1440` | `800/800`; `800/1024`; `800/1024` | `0→0`; `0→40`; `0→40` |',
    '| `mobileLight` | `390x844` / `light` | `390/390`; `100/519/G009` visible; G009 `111.34x46.25` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` |',
    '| `mobileDark` | `390x844` / `dark` | `390/390`; `100/519/G009` visible; G009 `111.34x46.25` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` |',
  ]) {
    assert.ok(production.includes(row), `Stage B production state row: ${row}`);
  }

  for (const href of PRODUCTION_SOURCE_HREFS) {
    assert.ok(
      production.includes(`| \`${href}\` | \`_blank\` | \`noopener noreferrer\` | \`4/4\` |`),
      `${href} final production source destination`,
    );
  }
  assert.doesNotMatch(production, /task-7-production-final[^\n]*(?:\.png|\.jpg)[^\n]*SHA-256/u);
  assert.doesNotMatch(production, /Final-head visual (?:inspection|screenshots?): `PASS`/u);
  return production;
}

function assertCurrentStageBProductionBaseline(source) {
  const currentBaseline = source.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  for (const literal of [
    'Stage B exact deployed head [`43573370131e703d004b75d64a820f448235037f`]',
    'Pages run [`31502633120`]',
    'build job `93816247824`、deploy job `93817077728`',
    'production HTTP probes `9/9`',
    'final IAB states `4/4`、wrapper interactions `12/12`、relation checks `16/16`、source resolutions `20/20`、extra route checks `8/8`',
    '首页 `100/519/G009` 四态均 visible',
    'mobile G009 rect 约 `111.34x46.25` 且 document `390/390`',
    'new screenshot artifacts `0`，capture status `BLOCKED / NOT_AVAILABLE`',
    'Stage B deployment status 为 `SUCCESS`，functional closure verdict PASS，final-head screenshot evidence 明确不在 PASS scope',
  ]) {
    assert.ok(currentBaseline.includes(literal), `current Stage B production baseline literal: ${literal}`);
  }
  assert.doesNotMatch(currentBaseline, /final-head (?:screenshots?|visual)(?: status)? (?:为|:)?\s*`PASS`/iu);
}

function assertHistoricalBacklogLocks(source) {
  const currentBaseline = source.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');

  const immediateHistoryMarker = '此前 G009 Batch 5 历史完成基线为：';
  const immediateHistoryStart = currentBaseline.indexOf(immediateHistoryMarker);
  assert.notEqual(immediateHistoryStart, -1, 'G009 Batch 5 history marker');
  const immediateHistory = currentBaseline.slice(immediateHistoryStart + immediateHistoryMarker.length);
  assert.match(immediateHistory, /^2026-08-11 G009 Batch 5 已完成 STY-04/u);
  assert.equal(sha256(immediateHistory), IMMEDIATE_HISTORICAL_BASELINE_HASH);

  const historyMarker = '此前 G009 Batch 4 历史完成基线为：';
  const historyStart = currentBaseline.indexOf(historyMarker);
  assert.notEqual(historyStart, -1, 'G009 Batch 4-and-older history marker');
  assert.equal(sha256(currentBaseline.slice(historyStart)), HISTORICAL_BACKLOG_SUFFIX_HASH);
}

test('preserves the exact STY-05 closure under the live STY-06 projection', () => {
  assert.deepEqual(
    {
      completed_topics: projectStatus.completed_topics,
      content_documents: projectStatus.content_documents,
      governed_sources: projectStatus.governed_sources,
    },
    {completed_topics: 59, content_documents: 102, governed_sources: 529},
  );
  assert.equal(publicLedger.sources.length, 529);

  for (const projection of [topicsById.get('STY-05'), stylesById.get('STY-05')]) {
    assert.equal(projection?.published, true);
    assert.equal(projection?.status.value, 'complete');
    assert.equal(projection?.slug, ROUTE);
  }
  for (const projection of [topicsById.get('STY-06'), stylesById.get('STY-06')]) {
    assert.equal(projection?.published, true);
    assert.equal(projection?.status.value, 'complete');
  }
});

test('publishes only the canonical STY-05 article, SVG, and six governed sources', async () => {
  assert.equal(publishedRoutes.has(ROUTE), true);
  assert.equal(publishedRoutes.has('/styles/sty-06'), true);
  assert.ok(markdownLinks(article).includes(SVG_ROUTE));
  assert.equal(markdownLinks(article).includes('/styles/sty-06'), true);
  await access(new URL(`../static${SVG_ROUTE}`, import.meta.url));
  assert.deepEqual(SOURCE_IDS.filter((sourceId) => publicSourcesById.has(sourceId)), SOURCE_IDS);
});

test('closes only STY-05 and advances the G009 release baseline to STY-06', () => {
  const currentBaseline = backlog.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  assert.match(currentBaseline, /2026-08-11 G009 Batch 6 已完成 STY-05/u);
  assert.match(currentBaseline, /58 个已完成主题、100 篇内容文档与 519 个受治理来源/u);
  assert.match(currentBaseline, /当前 G009，下一项为 STY-06/u);
  assert.match(currentBaseline, /STY-05 为 published\/complete/u);
  assert.match(currentBaseline, /STY-06 为 unpublished\/pending/u);
  assert.match(backlog, /^- \[x\] \*\*STY-05 /mu);
  assert.match(backlog, /^- \[x\] \*\*STY-06 /mu);

  const sty05Lines = backlog.split(/\r?\n/u)
    .filter((line) => /^- \[[ x]\] \*\*STY-05 /u.test(line));
  assert.equal(sty05Lines.length, 1);
  for (const literal of [
    '- [x] **STY-05 ',
    '2026-08-11',
    IMPLEMENTATION_HEAD,
    PAGES_RUN_ID,
    ROUTE,
    SVG_ROUTE,
    'Stage A production verdict PASS',
  ]) {
    assert.ok(sty05Lines[0].includes(literal), `STY-05 closure literal: ${literal}`);
  }

  assertHistoricalBacklogLocks(backlog);
  assertCurrentStageBProductionBaseline(backlog);
});

test('rejects mutation of the complete immediate G009 Batch 5 history', () => {
  const mutated = backlog.replace('build job `93610482485`', 'build job `0`');
  assert.notEqual(mutated, backlog, 'Batch 5 build-job mutation must apply');
  assert.throws(() => assertHistoricalBacklogLocks(mutated), {name: 'AssertionError'});
});

test('rejects mutated current Stage B deployment and screenshot boundary', () => {
  assertCurrentStageBProductionBaseline(backlog);
  for (const [label, exact, replacement] of [
    ['wrong deployed head', STAGE_B_DEPLOYED_HEAD, '0'.repeat(40)],
    ['wrong Pages run', STAGE_B_PAGES_RUN_ID, '31502633121'],
    ['wrong build job', STAGE_B_BUILD_JOB_ID, '93816247825'],
    ['wrong deploy job', STAGE_B_DEPLOY_JOB_ID, '93817077729'],
    ['hidden mobile G009', 'mobile G009 rect 约 `111.34x46.25`', 'mobile G009 rect `0x0`'],
    ['fabricated screenshot PASS', 'capture status `BLOCKED / NOT_AVAILABLE`', 'capture status `PASS`'],
    ['deployment regression', 'Stage B deployment status 为 `SUCCESS`', 'Stage B deployment status 为 `PENDING`'],
  ]) {
    const mutated = backlog.replace(exact, replacement);
    assert.notEqual(mutated, backlog, `${label} backlog mutation must apply`);
    assert.throws(() => assertCurrentStageBProductionBaseline(mutated), {name: 'AssertionError'}, label);
  }
});

test('binds exact local artifacts, four-state Browser evidence, and final exact-head review verdicts', async () => {
  assert.match(review, /^# G009 Batch 6 Stage A Review$/mu);
  const projection = section(review, 'Stage A projection');
  assert.match(projection, /57 completed topics \/ 100 content documents \/ 519 governed sources/u);
  assert.match(projection, /STY-05: `published \/ pending`/u);
  assert.match(projection, /STY-06: `unpublished \/ pending`/u);

  const historicalIdentities = section(review, 'Artifact identities');
  for (const row of [
    '| `content/styles/sty-05-microservices.mdx` | 13,651 | `493a227b19702a78d0141e6254eb2bb153ea0b00073c0b9773854e5c714e460f` |',
    '| `diagrams/sty-05-microservices-order-saga.drawio` | 55,145 | `3a5bb4db02eb8b81513807b59f879155c206607df7a28c6c78dce7b19a5436e5` |',
    '| `static/img/diagrams/sty-05-microservices-order-saga.svg` | 36,867 | `35bf03e73a1fda674701dd98a9f5dd016eaedbfb10a7a6f89485e110c5b9eb65` |',
    '| `data/source-ledger.json` | 1,515,289 | `21253b11dd39eebf75fba34e4f661d08bfbe19a95dc61cf5e2201c0d067d019c` |',
  ]) assert.ok(historicalIdentities.includes(row), `historical artifact row: ${row}`);
  assert.equal(
    sha256(historicalIdentities),
    '1b939ff784240c3b4ebec14a89438158c55951084a6736a06badb429374668d1',
    'complete historical artifact section hash',
  );
  assertFourStateEvidence(review);
  assertEvidenceProvenance(review);
  assertFinalIndependentReview(review);
  assertStageBClosureReview(review);
  assertStageBProductionEvidence(review);
});

test('rejects wrong Stage B counts, reviewed head, evidence, weakened verdicts, stale final PENDING, and fabricated deployment', () => {
  const mutations = [
    ['wrong counts', '58 completed topics / 100 content documents / 519 governed sources', '57 completed topics / 100 content documents / 519 governed sources'],
    ['wrong STY-05 state', 'STY-05: `published / complete`.', 'STY-05: `published / pending`.'],
    ['wrong STY-06 state', 'STY-06: `unpublished / pending`; its checkbox and route remain non-actionable.', 'STY-06: `published / pending`; its checkbox and route remain non-actionable.'],
    ['wrong reviewed head', STAGE_B_REVIEWED_HEAD, '0'.repeat(40)],
    ['wrong Stage A evidence', `Evidence authority: Stage A implementation \`${IMPLEMENTATION_HEAD}\`, Pages run \`${PAGES_RUN_ID}\``, `Evidence authority: Stage A implementation \`${'0'.repeat(40)}\`, Pages run \`0\``],
    ['weakened code verdict', 'Independent Stage B code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.', 'Independent Stage B code reviewer (`code-reviewer`): `NOT READY`; findings: `1`.'],
    ['weakened content verdict', 'Independent Stage B content/evidence/rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent Stage B content/evidence/rights reviewer: `CHANGES`; rights: `PASS`; findings: `1`.'],
    ['weakened rights verdict', 'Independent Stage B content/evidence/rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent Stage B content/evidence/rights reviewer: `CONTENT READY`; rights: `UNKNOWN`; findings: `0`.'],
    ['weakened architecture verdict', 'Independent Stage B architecture reviewer (`architect`): `CLEAR / READY`; findings: `0`.', 'Independent Stage B architecture reviewer (`architect`): `BLOCKED`; findings: `1`.'],
    ['stale final PENDING slot', 'Independent Stage B code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.', 'Code review slot: `PENDING`.'],
    ['deployment regression', 'Stage B deployment status: `SUCCESS`.', 'Stage B deployment status: `PENDING`.'],
  ];
  for (const [label, exact, replacement] of mutations) {
    const mutated = review.replace(exact, replacement);
    assert.notEqual(mutated, review, `${label} mutation must apply`);
    assert.throws(() => assertStageBClosureReview(mutated), {name: 'AssertionError'}, label);
  }
});

test('rejects mutated Stage B production identity, final DOM evidence, screenshot provenance, and PASS scope', () => {
  assertStageBProductionEvidence(review);
  const mutations = [
    ['wrong deployed head', STAGE_B_DEPLOYED_HEAD, '0'.repeat(40)],
    ['wrong Pages run', STAGE_B_PAGES_RUN_ID, '31502633121'],
    ['wrong build job', STAGE_B_BUILD_JOB_ID, '93816247825'],
    ['wrong deploy job', STAGE_B_DEPLOY_JOB_ID, '93817077729'],
    ['wrong run outcome', 'Pages run: `31502633120`; event: `push`; status: `completed`; conclusion: `success`.', 'Pages run: `31502633120`; event: `push`; status: `completed`; conclusion: `failure`.'],
    ['wrong HTTP total', 'Deploy job: `93817077728`; status: `completed`; conclusion: `success`.\n- HTTP probes: `9/9` returned `200`', 'Deploy job: `93817077728`; status: `completed`; conclusion: `success`.\n- HTTP probes: `8/9` returned `200`'],
    ['wrong final raw hash', FINAL_BROWSER_ARTIFACT_HASH, 'f'.repeat(64)],
    ['weakened state total', 'Final production IAB states: `4/4`', 'Final production IAB states: `3/4`'],
    ['hidden mobile G009', 'Mobile G009: visible `true` in light and dark', 'Mobile G009: visible `false` in light and dark'],
    ['zero mobile G009 rectangle', 'G009 `111.34x46.25`', 'G009 `0x0`'],
    ['wrong mobile document geometry', '`390/390`; `100/519/G009` visible', '`390/391`; `100/519/G009` visible'],
    ['fabricated completed homepage metric', 'homepage intentionally renders only `100 / 519 / G009`', 'homepage renders `58 / 100 / 519 / G009`'],
    ['weakened interaction total', 'ArrowRight: `12/12`', 'ArrowRight: `11/12`'],
    ['weakened relation total', 'return: `16/16`', 'return: `15/16`'],
    ['weakened source total', 'destination: `20/20`', 'destination: `19/20`'],
    ['weakened extra-route total', 'navigation: `8/8`', 'navigation: `7/8`'],
    ['truncated diagnostics', 'Every final production state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.', 'Every final production state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=true`.'],
    ['missing screenshot blocker provenance', 'Screenshot limitation: supported in-app Browser capture timed out on three fresh exact-head tabs; no alternate browser, external Playwright, old screenshot substitution, invented hash, or final-head visual PASS is claimed.', 'Screenshot limitation: unavailable.'],
    ['invented screenshot artifact', 'new screenshot artifacts: `0`', 'new screenshot artifacts: `1`; SHA-256 `0000000000000000000000000000000000000000000000000000000000000000`'],
    ['fabricated visual PASS', 'Visual screenshot evidence: `BLOCKED / NOT_AVAILABLE`.', 'Final-head visual screenshots: `PASS`.'],
    ['weakened functional PASS scope', 'for functional DOM, interaction, navigation, HTTP, and exact-head deployment; screenshot evidence remains explicitly outside that PASS scope', 'including final-head screenshots'],
  ];
  for (const [label, exact, replacement] of mutations) {
    const mutated = review.replace(exact, replacement);
    assert.notEqual(mutated, review, `${label} mutation must apply`);
    assert.throws(() => assertStageBProductionEvidence(mutated), {name: 'AssertionError'}, label);
  }
});

test('rejects incomplete evidence, wrong hashes, weakened verdicts, stale PENDING, and fabricated deployment', () => {
  assertFourStateEvidence(review);
  assertFinalIndependentReview(review);
  const mutations = [
    ['missing state', '| `mobileDark` |', '| `mobileMissing` |'],
    ['incomplete state total', 'States accepted: `4/4`.', 'States accepted: `3/4`.'],
    ['wrong artifact hash', BROWSER_ARTIFACT_HASH, '0'.repeat(64)],
    ['wrong screenshot hash', SCREENSHOT_HASHES.mobileDark, '1'.repeat(64)],
    ['truncated diagnostics', '`truncated=false`', '`truncated=true`'],
    ['missing fallback provenance', 'visible-DOM href selection + direct navigation (local relation audit fallback)', 'unrecorded navigation'],
    ['unbound contrast colors', 'Selector-bound contrast provenance:', 'hard-coded expected colors unrelated to the selected elements:'],
    ['wrong reviewed head', `Exact reviewed head: \`${REVIEWED_HEAD}\`.`, `Exact reviewed head: \`${'0'.repeat(40)}\`.`],
    ['weakened code verdict', '`READY / APPROVE`; findings: `0`.', '`READY / COMMENT`; findings: `0`.'],
    ['weakened content verdict', '`CONTENT READY`; rights: `PASS`; findings: `0`.', '`CONTENT CHANGES`; rights: `PASS`; findings: `0`.'],
    ['weakened rights verdict', 'rights: `PASS`; findings: `0`.', 'rights: `UNKNOWN`; findings: `0`.'],
    ['weakened architecture verdict', '`CLEAR / READY`; findings: `0`.', '`BLOCKED`; findings: `1`.'],
    ['stale PENDING final slot', 'Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.', 'Code review (`code-reviewer`): `PENDING`.'],
    ['deployment fabricated', 'Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
  ];
  for (const [label, exact, replacement] of mutations) {
    const mutated = review.replace(exact, replacement);
    assert.notEqual(mutated, review, `${label} mutation must apply`);
    assert.throws(() => {
      assertFourStateEvidence(mutated);
      assertEvidenceProvenance(mutated);
      assertFinalIndependentReview(mutated);
      assert.doesNotMatch(mutated, /Deployment status: `SUCCESS`/u);
    }, {name: 'AssertionError'}, label);
  }
});

test('binds the exact Stage A Pages, HTTP, and production Browser evidence', () => {
  assertProductionEvidence(review);
});

test('rejects mutated production identity, outcomes, geometry, diagnostics, links, and screenshots', () => {
  assertProductionEvidence(review);
  const mutations = [
    ['wrong implementation SHA', IMPLEMENTATION_HEAD, '0'.repeat(40)],
    ['wrong Pages run', PAGES_RUN_ID, '31490981658'],
    ['wrong build job', PAGES_BUILD_JOB_ID, '93777183964'],
    ['wrong deploy job', PAGES_DEPLOY_JOB_ID, '93777844176'],
    ['wrong workflow outcome', 'Run: `31490981657`; status: `completed`; conclusion: `success`.', 'Run: `31490981657`; status: `completed`; conclusion: `failure`.'],
    [
      'omitted production state',
      '| `mobileDark` | `390x844` / `dark` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |',
      '| `mobileMissing` | `390x844` / `dark` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |',
    ],
    [
      'wrong mobile geometry',
      '| `mobileLight` | `390x844` / `light` | `390/390` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |',
      '| `mobileLight` | `390x844` / `light` | `390/391` | `358/800`; `358/1024`; `358/1024` | `0→40`; `0→40`; `0→40` | `0/0/0`; `hasMore=false`; `truncated=false` |',
    ],
    [
      'truncated production diagnostics',
      'Every production state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.',
      'Every production state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=true`.',
    ],
    ['missing relation return', '| `/tego-arch/styles` | `架构风格` | `4/4` |', '| `/tego-arch/styles` | `架构风格` | `3/4` |'],
    ['changed source href', PRODUCTION_SOURCE_HREFS[0], 'https://example.com/microservices'],
    ['weakened source target', '`_blank` | `noopener noreferrer`', '`_self` | `noopener noreferrer`'],
    ['weakened source rel', '`_blank` | `noopener noreferrer`', '`_blank` | `noreferrer`'],
    ['wrong production screenshot', PRODUCTION_SCREENSHOT_HASHES.mobileDark, '1'.repeat(64)],
    ['fabricated STY-06 absence', 'STY-06 production actionable DOM count: `0` in every state.', 'STY-06 production actionable DOM count: `1` in every state.'],
  ];
  for (const [label, exact, replacement] of mutations) {
    const mutated = review.replace(exact, replacement);
    assert.notEqual(mutated, review, `${label} mutation must apply`);
    assert.throws(() => assertProductionEvidence(mutated), {name: 'AssertionError'}, label);
  }
});
