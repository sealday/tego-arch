import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const REVIEW_PATH = 'docs/reviews/g010-mth07.md';
const EVIDENCE_PATH = 'docs/reviews/evidence/g010-mth07-stage-a-browser.json';
const EVIDENCE_SHA256 = '43985ea2e801e888e55a2cd6f62ed690133d3fdcda7db8f03a1e91ea466fa1b0';
const BROWSER_BUILD_HEAD = 'f32e0cb7ae79fb92a2154c03dfe8bf7b5b203974';
const HISTORICAL_REVIEW_TREE_HASH = 'f02ecfe18e12e7ffaf9e1656f5a0fc718e2395c070655d5ede9c590c1d05bde5';
const MTH07_STATUS = {
  scope: 'content-lifecycle',
  value: 'reviewed',
  source: 'content/methods/mth-07-fde-enterprise-ai-delivery.mdx',
};
const PROJECT_STATUS = {
  schema_version: 1,
  durable_stories: {completed: 8, total: 20, current: 'G009'},
  completed_topics: 59,
  content_documents: 102,
  governed_sources: 529,
  sources: {
    durable_stories: 'docs/content-backlog.md',
    completed_topics: 'docs/content-backlog.md',
    content_documents: 'content/**/*.{md,mdx}',
    governed_sources: 'data/source-ledger.json',
  },
};
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPER_LABELS = [
  '企业 AI 四阶段十二门禁图，可横向滚动',
  '企业 AI 十二门禁执行表，可横向滚动',
  '人、AI 与程序职责及停止条件表，可横向滚动',
];
const SOURCE_HREFS = [
  'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10',
  'https://sre.google/workbook/canarying-releases/',
  'https://learn.microsoft.com/en-us/azure/ai-studio/how-to/evaluate-generative-ai-app',
];
const RELATIONS = [
  ['/tego-arch/methods/mth-01', '质量属性工作坊（Quality Attribute Workshop，QAW）'],
  ['/tego-arch/methods/mth-04', '架构适应度函数'],
  ['/tego-arch/methods/mth-06', '从需求到演进的架构闭环'],
  ['/tego-arch/cases/temporal-saga-durable-execution', '持久化执行与长事务：为长时智能体任务建立可恢复边界'],
];
const REVIEW_H2 = ['Candidate identity', 'Stage A projection', 'Local in-app Browser QA', 'Independent review checkpoint'];
const PRE_VERDICT_SECTION_SHA256 = new Map([
  ['Candidate identity', '2263282fa4de34f4ef7f1f59ca844ba600aa394b42b250fe0184eca0daccc3eb'],
  ['Stage A projection', '1916960444c0955a11e35b48e5892831ec7069324a4f744b3def8b6b35cfa319'],
  ['Local in-app Browser QA', 'e07d8232c0aaf2bed7dfdc39b76ee1433c64c30f7badecafb628b7c2332b322c'],
]);
const PENDING_REVIEW_CHECKPOINT = [
  '- Code review: `PENDING`.',
  '- Content, evidence, and rights review: `PENDING`; rights: `PENDING`.',
  '- Architecture review: `PENDING`.',
  '- Final Stage A review judgment: `PENDING`.',
  '- Scope boundary: `STAGE_A_ONLY`.',
  '- Deployment status: `NOT_RUN`.',
  '',
  'This record is an implementation candidate and local functional Browser artifact only. It does not self-issue an independent verdict, close the MTH-07 backlog item, claim production publication, or claim deployment success.',
].join('\n');
const SCREENSHOT_REASON = 'The four ignored capture files are JPEG/JFIF bytes stored under .png names and contain repeated viewport strips rather than faithful continuous-page captures.';
const SCREENSHOTS = {
  desktopLight: {
    path: '.superpowers/sdd/g010-mth07-stage-a-desktop-light.png',
    encodedFormat: 'JPEG/JFIF',
    filenameExtension: '.png',
    dimensions: {width: 1440, height: 7871},
    viewport: {width: 1440, height: 1000},
    disposition: 'REJECTED_DIAGNOSTIC_ONLY',
  },
  desktopDark: {
    path: '.superpowers/sdd/g010-mth07-stage-a-desktop-dark.png',
    encodedFormat: 'JPEG/JFIF',
    filenameExtension: '.png',
    dimensions: {width: 1440, height: 7871},
    viewport: {width: 1440, height: 1000},
    disposition: 'REJECTED_DIAGNOSTIC_ONLY',
  },
  mobileLight: {
    path: '.superpowers/sdd/g010-mth07-stage-a-mobile-light.png',
    encodedFormat: 'JPEG/JFIF',
    filenameExtension: '.png',
    dimensions: {width: 390, height: 10889},
    viewport: {width: 390, height: 844},
    disposition: 'REJECTED_DIAGNOSTIC_ONLY',
  },
  mobileDark: {
    path: '.superpowers/sdd/g010-mth07-stage-a-mobile-dark.png',
    encodedFormat: 'JPEG/JFIF',
    filenameExtension: '.png',
    dimensions: {width: 390, height: 10889},
    viewport: {width: 390, height: 844},
    disposition: 'REJECTED_DIAGNOSTIC_ONLY',
  },
};
const ARTIFACTS = new Map([
  ['content/methods/mth-07-fde-enterprise-ai-delivery.mdx', ['17,527', '427e4655402ed74f5a1bc7e798e84d42df9fb3f1d94de87c0a73e02f542dcf7a']],
  ['diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio', ['10,553', '74dcc5c5ba990dfcdd1d0e2806d06fafa01698452689e18a237ba0f1e321c193']],
  ['static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg', ['10,150', '56a914a2f15894ebd1be9453c648976773dfd616dd1d8718be560f62a84c8a7f']],
  ['data/source-ledger.json', ['1,539,273', 'fef9ec7b2414bc353e37c731fbe39c15d239ec70494938d72b320e7fd0c626d2']],
]);
const GENERATED_ARTIFACTS = new Map([
  ['src/generated/project-status.json', ['415', 'e1555ff13777d6a1d150a85f828529192aed8bdb3b35546636445db99cf981d7']],
  ['src/generated/topic-manifest.json', ['220,139', '07612145e5715e9a089843f736bbcd85879198733dc2c6e880a366f39408827f']],
  ['src/generated/topic-indexes.json', ['220,293', '2ce7843aec2c3d6b2e5cc194f7d433ca911e50da22c8f1d2c52071ca2708a4bd']],
  ['src/generated/source-ledger.json', ['1,821,547', 'a629a7af1a849f9ce0e2730701cc9ef65f850d8266e10af5a22a9fd17d9c214e']],
]);

const [review, evidenceBytes, manifest, indexes, projectStatus, publicLedger, backlog] = await Promise.all([
  readFile(path.join(ROOT, REVIEW_PATH), 'utf8').catch((error) => error?.code === 'ENOENT' ? '' : Promise.reject(error)),
  readFile(path.join(ROOT, EVIDENCE_PATH)).catch((error) => error?.code === 'ENOENT' ? Buffer.from('{}') : Promise.reject(error)),
  readFile(path.join(ROOT, 'src/generated/topic-manifest.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/topic-indexes.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/project-status.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/source-ledger.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'docs/content-backlog.md'), 'utf8'),
]);
const evidence = JSON.parse(evidenceBytes);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertExactKeys(actual, expected, label) {
  assert.deepEqual(Object.keys(actual), expected, `${label} exact keys`);
}

function section(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const matches = headings.filter((match) => match[1] === heading);
  assert.equal(matches.length, 1, `review must contain one ${heading} section`);
  const next = headings.find((match) => match.index > matches[0].index);
  return source.slice(matches[0].index + matches[0][0].length, next?.index ?? source.length).trim();
}

function isHistoricalReviewArtifact(relative) {
  return relative.startsWith('docs/reviews/') &&
    relative !== REVIEW_PATH &&
    !relative.startsWith('docs/reviews/evidence/g010-mth07-');
}

async function historicalReviewEntries() {
  const base = path.join(ROOT, 'docs/reviews');
  async function walk(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    const files = await Promise.all(entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }));
    return files.flat();
  }
  const files = (await walk(base)).sort();
  const entries = await Promise.all(files.map(async (file) => ({
    relative: path.relative(ROOT, file),
    bytes: await readFile(file),
  })));
  return entries.filter(({relative}) => isHistoricalReviewArtifact(relative));
}

function historicalReviewEntriesHash(entries) {
  const hash = createHash('sha256');
  for (const {relative, bytes} of [...entries].sort((left, right) => left.relative.localeCompare(right.relative))) {
    hash.update(relative);
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function historicalReviewTreeHash() {
  return historicalReviewEntriesHash(await historicalReviewEntries());
}

function assertProjection() {
  assert.deepEqual(projectStatus, PROJECT_STATUS);
  assert.equal(publicLedger.sources.length, 529);
  const mth07 = manifest.topics.find(({id}) => id === 'MTH-07');
  assert.equal(mth07?.published, true);
  assert.equal(mth07?.slug, '/methods/mth-07');
  assert.deepEqual(mth07?.status, MTH07_STATUS);
  const methodIndex = indexes.method.find(({id}) => id === 'MTH-07');
  assert.equal(methodIndex?.published, true);
  assert.deepEqual(methodIndex?.status, MTH07_STATUS);
  assert.equal(/\bMTH-07\b/u.test(backlog), false, 'MTH-07 remains absent from the Stage A backlog');
}

function assertBrowserEvidence(actual) {
  assertExactKeys(actual, ['schemaVersion', 'browserBuildHead', 'servedBuild', 'screenshotEvidence', 'states'], 'Browser evidence root');
  assert.equal(actual.schemaVersion, 1);
  assert.equal(actual.browserBuildHead, BROWSER_BUILD_HEAD);
  assert.equal('candidateHead' in actual, false);
  assertExactKeys(actual.servedBuild, ['kind', 'buildCommand', 'serveCommand', 'baseUrl', 'route'], 'served build');
  assert.deepEqual(actual.servedBuild, {
    kind: 'exact production build',
    buildCommand: 'npm run build',
    serveCommand: 'npm run serve -- --host 127.0.0.1 --port 4173',
    baseUrl: 'http://127.0.0.1:4173/tego-arch/',
    route: 'http://127.0.0.1:4173/tego-arch/methods/mth-07',
  });
  assertExactKeys(actual.screenshotEvidence, ['status', 'acceptance', 'reason', 'captures'], 'screenshot evidence');
  assert.equal(actual.screenshotEvidence.status, 'BLOCKED');
  assert.equal(actual.screenshotEvidence.acceptance, 'NOT_ACCEPTED');
  assert.equal(actual.screenshotEvidence.reason, SCREENSHOT_REASON);
  assert.deepEqual(Object.keys(actual.screenshotEvidence.captures), STATES);
  for (const [name, expected] of Object.entries(SCREENSHOTS)) {
    const capture = actual.screenshotEvidence.captures[name];
    assertExactKeys(capture, ['path', 'encodedFormat', 'filenameExtension', 'dimensions', 'viewport', 'disposition'], `${name} screenshot capture`);
    assertExactKeys(capture.dimensions, ['width', 'height'], `${name} screenshot dimensions`);
    assertExactKeys(capture.viewport, ['width', 'height'], `${name} screenshot viewport`);
    assert.deepEqual(capture, expected);
  }
  assert.equal('acceptedHashes' in actual.screenshotEvidence, false);
  assert.equal(JSON.stringify(actual.screenshotEvidence).includes('sha256'), false);
  assert.equal(JSON.stringify(actual.screenshotEvidence).includes('Uint8Array'), false);
  assert.deepEqual(Object.keys(actual.states), STATES);

  const expectedStates = {
    desktopLight: {theme: 'light', viewport: {width: 1440, height: 1000}, clientWidth: 800},
    desktopDark: {theme: 'dark', viewport: {width: 1440, height: 1000}, clientWidth: 800},
    mobileLight: {theme: 'light', viewport: {width: 390, height: 844}, clientWidth: 358},
    mobileDark: {theme: 'dark', viewport: {width: 390, height: 844}, clientWidth: 358},
  };

  for (const [name, expected] of Object.entries(expectedStates)) {
    const state = actual.states[name];
    assertExactKeys(state, ['state', 'theme', 'viewport', 'geometry', 'interactions', 'relations', 'logs', 'diagnostics'], `${name} state`);
    assertExactKeys(state.viewport, ['width', 'height'], `${name} viewport`);
    assert.equal(state.state, name);
    assert.equal(state.theme, expected.theme);
    assert.deepEqual(state.viewport, expected.viewport);
    assert.equal(state.geometry.h1, '企业 AI 前线部署：从 POC 到可复制系统的交付门禁');
    assertExactKeys(state.geometry, ['h1', 'page', 'wrappers', 'svg', 'sources', 'paginationNext', 'nextUnpublishedActionable'], `${name} geometry`);
    assertExactKeys(state.geometry.page, ['clientWidth', 'scrollWidth'], `${name} page`);
    assert.deepEqual(state.geometry.page, {
      clientWidth: expected.viewport.width,
      scrollWidth: expected.viewport.width,
    });
    for (const [index, wrapper] of state.geometry.wrappers.entries()) {
      assertExactKeys(wrapper, ['clientWidth', 'label', 'scrollWidth'], `${name} wrapper ${index}`);
    }
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth}) => clientWidth), [expected.clientWidth, expected.clientWidth, expected.clientWidth]);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth}) => scrollWidth), [800, 1643, 2101]);
    assert.equal(state.interactions.length, 3);
    for (const [index, interaction] of state.interactions.entries()) {
      assertExactKeys(interaction, ['label', 'before', 'after'], `${name} interaction ${index}`);
      assert.equal(interaction.label, WRAPPER_LABELS[index]);
      assert.deepEqual(Object.keys(interaction.before), ['focus', 'focusVisible', 'outline', 'scrollLeft']);
      assert.deepEqual(Object.keys(interaction.after), ['focus', 'focusVisible', 'outline', 'scrollLeft']);
      assert.equal(interaction.before.focus, true);
      assert.equal(interaction.before.focusVisible, true);
      assert.match(interaction.before.outline, /solid 3px/u);
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.focus, true);
      assert.equal(interaction.after.focusVisible, true);
      assert.match(interaction.after.outline, /solid 3px/u);
      assert.equal(interaction.after.scrollLeft, state.geometry.wrappers[index].scrollWidth > state.geometry.wrappers[index].clientWidth ? 40 : 0);
    }
    assert.equal(state.geometry.svg.loaded, true);
    assertExactKeys(state.geometry.svg, ['loaded', 'naturalHeight', 'naturalWidth', 'renderedHeight', 'renderedWidth'], `${name} SVG`);
    assert.deepEqual(state.geometry.svg, {
      loaded: true,
      naturalHeight: 150,
      naturalWidth: 116,
      renderedHeight: 1032,
      renderedWidth: 800,
    });
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_HREFS);
    assert.equal(new Set(state.geometry.sources.map(({href}) => new URL(href).hostname)).size, 3);
    for (const source of state.geometry.sources) {
      assertExactKeys(source, ['href', 'rel', 'target'], `${name} source`);
      assert.equal(source.target, '_blank');
      assert.equal(source.rel, 'noopener noreferrer');
    }
    assert.deepEqual(state.geometry.paginationNext, ['/tego-arch/modeling']);
    assert.equal(state.geometry.nextUnpublishedActionable, 0);
    assert.deepEqual(state.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    assert.equal(new Set(state.relations.map(({href}) => href)).size, RELATIONS.length);
    for (const relation of state.relations) {
      assertExactKeys(relation, [
        'href',
        'visibleHref',
        'actionability',
        'h1',
        'expectedH1',
        'returnedToArticle',
        'navigationMode',
        'selectionReason',
        'clickAttempted',
        'forceUsed',
        'navigationTarget',
        'navigationTargetEqualsVisibleHref',
        'fallbackTargetEqualsVisibleHref',
      ], `${name} relation`);
      assertExactKeys(relation.actionability, ['status', 'reason'], `${name} relation actionability`);
      assert.equal(relation.h1, relation.expectedH1);
      assert.equal(relation.returnedToArticle, true);
      assert.equal(relation.visibleHref, relation.href);
      assert.equal(relation.navigationTarget, relation.visibleHref);
      assert.equal(relation.navigationTargetEqualsVisibleHref, true);
      assert.equal(relation.actionability.status, 'NOT_MEASURED');
      if (name.startsWith('desktop')) {
        assert.equal(relation.navigationMode, 'forced link activation');
        assert.deepEqual(relation.actionability, {
          status: 'NOT_MEASURED',
          reason: 'Forced activation bypassed a pre-click visibility/actionability probe.',
        });
        assert.equal(relation.selectionReason, 'The capture harness selected forced link activation for viewport width > 390.');
        assert.equal(relation.clickAttempted, true);
        assert.equal(relation.forceUsed, true);
        assert.equal(relation.fallbackTargetEqualsVisibleHref, null);
      } else {
        assert.equal(relation.navigationMode, 'harness-selected compatibility navigation');
        assert.deepEqual(relation.actionability, {
          status: 'NOT_MEASURED',
          reason: 'The capture harness selected compatibility navigation before attempting a click.',
        });
        assert.equal(relation.selectionReason, 'The capture harness selected direct navigation for viewport width <= 390 before any click attempt.');
        assert.equal(relation.clickAttempted, false);
        assert.equal(relation.forceUsed, false);
        assert.equal(relation.fallbackTargetEqualsVisibleHref, true);
      }
    }
    assert.deepEqual(state.logs, []);
    assertExactKeys(state.diagnostics, ['runtimeExceptions', 'logEntries', 'events', 'hasMore', 'truncated'], `${name} diagnostics`);
    assert.deepEqual(state.diagnostics.runtimeExceptions, []);
    assert.deepEqual(state.diagnostics.logEntries, []);
    assert.deepEqual(state.diagnostics.events, []);
    assert.equal(state.diagnostics.hasMore, false);
    assert.equal(state.diagnostics.truncated, false);
  }

  const wrapperWidths = STATES.map((name) => actual.states[name].geometry.wrappers.map(({scrollWidth}) => scrollWidth));
  assert.deepEqual(wrapperWidths[1], wrapperWidths[0], 'desktop themes retain exact wrapper widths');
  assert.deepEqual(wrapperWidths[2], wrapperWidths[0], 'mobile retains exact wrapper scroll widths');
  assert.deepEqual(wrapperWidths[3], wrapperWidths[0], 'mobile dark retains exact wrapper scroll widths');
  const svgSizes = STATES.map((name) => actual.states[name].geometry.svg);
  for (const svg of svgSizes.slice(1)) assert.deepEqual(svg, svgSizes[0], 'SVG intrinsic/rendered geometry is exact across states');
}

function browserReviewRow(name, state) {
  const sourceDomains = new Set(state.geometry.sources.map(({href}) => new URL(href).hostname));
  const relationPasses = state.relations.filter(({h1, expectedH1, returnedToArticle}) =>
    h1 === expectedH1 && returnedToArticle).length;
  const diagnosticsComplete = !state.diagnostics.hasMore && !state.diagnostics.truncated;
  return [
    `\`${name}\``,
    `\`${state.viewport.width}x${state.viewport.height}\` / \`${state.theme}\``,
    `\`${state.geometry.page.clientWidth}/${state.geometry.page.scrollWidth}\``,
    state.geometry.wrappers.map(({clientWidth, scrollWidth}) => `\`${clientWidth}/${scrollWidth}\``).join('; '),
    state.interactions.map(({before, after}) => `\`${before.scrollLeft}→${after.scrollLeft}\``).join('; '),
    `\`${state.geometry.svg.naturalWidth}x${state.geometry.svg.naturalHeight}\` / \`${state.geometry.svg.renderedWidth}x${state.geometry.svg.renderedHeight}\``,
    `\`${state.geometry.sources.length}\`, domains \`${sourceDomains.size}\``,
    `\`${relationPasses}/${state.relations.length}\``,
    `\`${state.relations[0].navigationMode}\``,
    `\`${state.logs.length}/${state.diagnostics.runtimeExceptions.length}\`, ${diagnosticsComplete ? 'complete' : 'incomplete'}`,
  ].join(' | ').replace(/^/u, '| ').replace(/$/u, ' |');
}

function screenshotReviewRow(capture) {
  return `| \`${capture.path}\` | \`${capture.encodedFormat}\` | \`${capture.filenameExtension}\` | \`${capture.dimensions.width}x${capture.dimensions.height}\` | \`${capture.disposition}\` |`;
}

function assertBrowserReviewClosedWorld(browser) {
  const forbiddenClaims = [
    ['standalone screenshot acceptance', /\bACCEPTED\b/u],
    [
      'screenshot hash identity',
      /^(?=[^\n]*(?:screenshot|capture))(?=[^\n]*(?:SHA-256|hash identity|hash\s*[:=]|hash\s+`[0-9a-f]{64}`))[^\n]*$/imu,
    ],
    [
      'full-page visual PASS',
      /^(?=[^\n]*\bfull-page\b)(?=[^\n]*(?::|=|\bis\b)\s*`?PASS\b)[^\n]*$/imu,
    ],
    [
      'desktop visible or exact link-click claim',
      /^(?=[^\n]*\bDesktop\b)(?=[^\n]*\blink clicks?\b)(?=[^\n]*\b(?:visible|exact)\b)[^\n]*$/imu,
    ],
    [
      'mobile click failure claim',
      /^\s*(?!-\s*No\b|No\b)(?:-\s*)?(?=[^\n]*\bMobile\b)(?=[^\n]*\bclick\b)(?=[^\n]*\b(?:failed|failure)\b)[^\n]*$/imu,
    ],
    [
      'mobile Browser-back claim',
      /^\s*(?!-\s*No\b|No\b)(?:-\s*)?(?=[^\n]*\bMobile\b)(?=[^\n]*\bafter Browser back\b)[^\n]*$/imu,
    ],
    ['non-zero warning diagnostics', /\b(?:warning\/error logs|warning logs|error logs)\s*[:=]?\s*`?[1-9][0-9]*\b/iu],
    ['non-zero runtime diagnostics', /\bruntime exceptions?\s*[:=]?\s*`?[1-9][0-9]*\b/iu],
    ['incomplete diagnostic pagination', /\bhasMore\s*=\s*`?true\b/iu],
    ['truncated diagnostics', /\btruncated\s*=\s*`?true\b/iu],
  ];
  for (const [label, pattern] of forbiddenClaims) {
    assert.doesNotMatch(browser, pattern, label);
  }
}

async function assertReview(source) {
  assert.match(source, /^# G010 MTH-07 Stage A Review$/mu);
  assert.deepEqual([...source.matchAll(/^## ([^\n]+)$/gmu)].map((match) => match[1]), REVIEW_H2, 'current review H2 sequence');
  const firstH2 = source.indexOf('\n## ');
  assert.notEqual(firstH2, -1, 'current review has sections');
  assert.equal(source.slice('# G010 MTH-07 Stage A Review'.length, firstH2).trim(), '', 'no claim-bearing preamble');
  for (const [heading, expected] of PRE_VERDICT_SECTION_SHA256) {
    assert.equal(sha256(section(source, heading)), expected, `${heading} exact pre-verdict bytes`);
  }
  assertBrowserReviewClosedWorld(source);
  const identity = section(source, 'Candidate identity');
  assert.ok(identity.includes(`Exact Browser build head: \`${BROWSER_BUILD_HEAD}\`.`));
  assert.doesNotMatch(identity, /Exact candidate head:/u);
  assert.ok(identity.includes(`Immutable historical review tree: \`${HISTORICAL_REVIEW_TREE_HASH}\`.`));
  for (const [artifact, [bytes, hash]] of ARTIFACTS) {
    const body = await readFile(path.join(ROOT, artifact));
    assert.equal(body.length.toLocaleString('en-US'), bytes, `${artifact} byte count fixture`);
    assert.equal(sha256(body), hash, `${artifact} SHA-256 fixture`);
    assert.match(
      identity,
      new RegExp(`\\| ${escapeRegExp(`\`${artifact}\``)} \\| ${escapeRegExp(bytes)} \\| ${escapeRegExp(`\`${hash}\``)} \\|`, 'u'),
      `${artifact} review identity`,
    );
  }

  const projection = section(source, 'Stage A projection');
  assert.match(projection, /59 completed topics \/ 102 content documents \/ 529 governed sources/u);
  assert.match(projection, /MTH-07: `published \/ reviewed`; route: `\/methods\/mth-07`/u);
  assert.ok(projection.includes(`Exact status object: \`${JSON.stringify(MTH07_STATUS)}\`.`));
  assert.ok(projection.includes('MTH-07 is absent from `docs/content-backlog.md`; completed topics remain `59`.'));
  for (const [artifact, [bytes, hash]] of GENERATED_ARTIFACTS) {
    const body = await readFile(path.join(ROOT, artifact));
    assert.equal(body.length.toLocaleString('en-US'), bytes, `${artifact} generated byte count fixture`);
    assert.equal(sha256(body), hash, `${artifact} generated SHA-256 fixture`);
    assert.match(
      projection,
      new RegExp(`\\| ${escapeRegExp(`\`${artifact}\``)} \\| ${escapeRegExp(bytes)} \\| ${escapeRegExp(`\`${hash}\``)} \\|`, 'u'),
      `${artifact} generated review identity`,
    );
  }

  const browser = section(source, 'Local in-app Browser QA');
  assertBrowserReviewClosedWorld(browser);
  for (const name of STATES) {
    assert.ok(browser.includes(browserReviewRow(name, evidence.states[name])), `${name} exact review row`);
  }
  for (const literal of [
    'Functional state records complete: `4/4`.',
    'Wrapper interaction checks: `12/12`.',
    'Relation destination/H1/return checks: `16/16`.',
    'Remote source anchors: `3` per state across exactly `3` domains.',
    'Next unpublished actionable link count: `0` in every state.',
    'Every state recorded warning/error logs `0`, runtime exceptions `0`, protocol log entries `0`, `hasMore=false`, and `truncated=false`.',
    'Desktop navigation mode: `forced link activation`; the capture harness selected it for viewport width > 390, used `force=true`, and did not measure pre-click actionability.',
    'Mobile navigation mode: `harness-selected compatibility navigation`; the capture harness selected direct navigation for viewport width <= 390 before any click attempt, and every fallback target exactly equaled the recorded visible href.',
    'No click-dispatch failure is claimed for the mobile capture run.',
    'Screenshot evidence status: `BLOCKED / NOT_ACCEPTED`.',
    `Screenshot rejection reason: ${SCREENSHOT_REASON}`,
    'The ignored captures remain rejected diagnostics only; no screenshot hash, continuous full-page capture, or independent visual-review PASS is accepted.',
  ]) assert.ok(browser.includes(literal), `Browser review literal: ${literal}`);
  for (const name of STATES) {
    assert.ok(browser.includes(screenshotReviewRow(evidence.screenshotEvidence.captures[name])), `${name} screenshot rejection row`);
  }
  assert.ok(browser.includes(`Raw Browser JSON: \`${EVIDENCE_PATH}\`, SHA-256 \`${sha256(evidenceBytes)}\`.`));

  const checkpoint = section(source, 'Independent review checkpoint');
  assert.equal(checkpoint, PENDING_REVIEW_CHECKPOINT, 'one exact authoritative pending checkpoint');
  const outsideCheckpoint = source.slice(0, source.indexOf('## Independent review checkpoint'));
  for (const [label, pattern] of [
    ['displaced code verdict', /^\s*(?:-\s*)?Code review\s*:/imu],
    ['displaced content verdict', /^\s*(?:-\s*)?Content, evidence, and rights review\s*:/imu],
    ['displaced architecture verdict', /^\s*(?:-\s*)?Architecture review\s*:/imu],
    ['displaced final verdict', /^\s*(?:-\s*)?Final Stage A review judgment\s*:/imu],
    ['displaced deployment status', /^\s*(?:-\s*)?Deployment status\s*:/imu],
    ['fabricated production deployment', /^\s*(?:-\s*)?Production deployment\s*:\s*.*\bSUCCESS\b/imu],
    ['fabricated visual review', /^\s*(?:-\s*)?Visual inspection\s*:\s*`?PASS\b/imu],
  ]) assert.doesNotMatch(outsideCheckpoint, pattern, label);
  for (const literal of [
    'Code review: `PENDING`.',
    'Content, evidence, and rights review: `PENDING`; rights: `PENDING`.',
    'Architecture review: `PENDING`.',
    'Final Stage A review judgment: `PENDING`.',
    'Scope boundary: `STAGE_A_ONLY`.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), `checkpoint literal: ${literal}`);
  assert.doesNotMatch(checkpoint, /\bREADY\b|\bAPPROVE(?:D)?\b|Deployment status: `SUCCESS`/u);
  assert.doesNotMatch(source, /Visual inspection:.*`PASS`|Screenshot evidence: `PASS`|Deployment status: `SUCCESS`/iu);
}

test('projects exact MTH-07 Stage A totals without publishing a fabricated next topic', () => {
  assertProjection();
  const publishedRoutes = new Set(manifest.topics.filter(({published}) => published).map(({slug}) => slug));
  assert.equal(publishedRoutes.has('/methods/mth-07'), true);
});

test('binds exact candidate artifacts, raw four-state Browser semantics, and pending review slots', async () => {
  assert.equal(sha256(evidenceBytes), EVIDENCE_SHA256);
  assertBrowserEvidence(evidence);
  await assertReview(review);
});

test('preserves every historical review and evidence artifact byte for byte', async () => {
  assert.equal(await historicalReviewTreeHash(), HISTORICAL_REVIEW_TREE_HASH);
});

test('separates the Browser build provenance from the future exact reviewed head', () => {
  assert.equal(evidence.browserBuildHead, BROWSER_BUILD_HEAD);
  assert.equal('candidateHead' in evidence, false);
  const identity = section(review, 'Candidate identity');
  assert.ok(identity.includes(`Exact Browser build head: \`${BROWSER_BUILD_HEAD}\`.`));
  assert.doesNotMatch(identity, /Exact candidate head:/u);
});

test('rejects additive Browser evidence claims at every schema boundary', () => {
  const mutations = [
    ['root deployment', (copy) => copy.deployment = {status: 'SUCCESS'}],
    ['root visual inspection', (copy) => copy.visualInspection = 'PASS'],
    ['served-build claim', (copy) => copy.servedBuild.deployment = 'SUCCESS'],
    ['screenshot claim', (copy) => copy.screenshotEvidence.visualInspection = 'PASS'],
    ['screenshot capture claim', (copy) => copy.screenshotEvidence.captures.desktopLight.sha256 = '0'.repeat(64)],
    ['state claim', (copy) => copy.states.desktopLight.deployment = 'SUCCESS'],
    ['viewport claim', (copy) => copy.states.desktopLight.viewport.device = 'desktop'],
    ['geometry claim', (copy) => copy.states.desktopLight.geometry.visualInspection = 'PASS'],
    ['page claim', (copy) => copy.states.desktopLight.geometry.page.overflow = 'PASS'],
    ['wrapper claim', (copy) => copy.states.desktopLight.geometry.wrappers[0].actionable = true],
    ['SVG claim', (copy) => copy.states.desktopLight.geometry.svg.visualInspection = 'PASS'],
    ['source claim', (copy) => copy.states.desktopLight.geometry.sources[0].verified = true],
    ['interaction claim', (copy) => copy.states.desktopLight.interactions[0].passed = true],
    ['relation claim', (copy) => copy.states.desktopLight.relations[0].passed = true],
    ['actionability claim', (copy) => copy.states.desktopLight.relations[0].actionability.measured = true],
    ['diagnostic claim', (copy) => copy.states.desktopLight.diagnostics.clean = true],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.notDeepEqual(copy, evidence, `${label} mutation applies`);
    assert.throws(() => assertBrowserEvidence(copy), {name: 'AssertionError'}, label);
  }
});

test('rejects displaced duplicated or contradictory current-review claims', async () => {
  const additions = [
    ['displaced code readiness', 'Code review: READY / APPROVE.'],
    ['displaced code readiness is-form', 'Code review is READY / APPROVE.'],
    ['displaced code readiness equals-form', 'Code review = READY / APPROVE.'],
    ['displaced code readiness dash-form', 'Code review — READY / APPROVE.'],
    ['displaced deployment success', 'Production deployment: SUCCESS.'],
    ['displaced deployment success is-form', 'Production deployment is SUCCESS.'],
    ['displaced deployment success equals-form', 'Production deployment = SUCCESS.'],
    ['displaced deployment success dash-form', 'Production deployment — SUCCESS.'],
    ['displaced visual pass', 'Visual inspection: PASS.'],
    ['displaced visual pass is-form', 'Visual inspection is PASS.'],
    ['displaced visual pass equals-form', 'Visual inspection = PASS.'],
    ['displaced visual pass dash-form', 'Visual inspection — PASS.'],
    ['duplicate verdict heading', '## Independent review checkpoint\n\n- Final Stage A review judgment: `READY`.'],
  ];
  for (const [label, addition] of additions) {
    const mutated = review.replace('## Stage A projection', `${addition}\n\n## Stage A projection`);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    await assert.rejects(() => assertReview(mutated), {name: 'AssertionError'}, label);
  }
});

test('locks the exact pre-G010 review namespace against add edit and delete mutations', async () => {
  for (const currentPath of [
    REVIEW_PATH,
    EVIDENCE_PATH,
    'docs/reviews/evidence/g010-mth07-stage-a-production-browser.json',
    'docs/reviews/evidence/g010-mth07-stage-b-production-browser.json',
  ]) assert.equal(isHistoricalReviewArtifact(currentPath), false, `${currentPath} is current G010 evidence`);
  assert.equal(isHistoricalReviewArtifact('docs/reviews/g009-batch7.md'), true);

  const entries = await historicalReviewEntries();
  assert.equal(entries.length, 35);
  assert.equal(historicalReviewEntriesHash(entries), HISTORICAL_REVIEW_TREE_HASH);
  const added = [...entries, {relative: 'docs/reviews/fabricated-history.md', bytes: Buffer.from('fabricated')}];
  const edited = entries.map((entry, index) => index === 0 ? {...entry, bytes: Buffer.concat([entry.bytes, Buffer.from(' ')])} : entry);
  const deleted = entries.slice(1);
  assert.notEqual(historicalReviewEntriesHash(added), HISTORICAL_REVIEW_TREE_HASH);
  assert.notEqual(historicalReviewEntriesHash(edited), HISTORICAL_REVIEW_TREE_HASH);
  assert.notEqual(historicalReviewEntriesHash(deleted), HISTORICAL_REVIEW_TREE_HASH);
});

test('rejects Browser evidence mutations and any fabricated Stage A readiness or deployment', async () => {
  assertBrowserEvidence(evidence);
  const evidenceMutations = [
    ['Browser build head', (copy) => copy.browserBuildHead = '0'.repeat(40)],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['wrong document width', (copy) => copy.states.desktopDark.geometry.page.scrollWidth += 1],
    ['missing wrapper', (copy) => copy.states.mobileLight.geometry.wrappers.pop()],
    ['lost focus-visible', (copy) => copy.states.mobileDark.interactions[0].before.focusVisible = false],
    ['wrong arrow movement', (copy) => copy.states.desktopLight.interactions[1].after.scrollLeft = 0],
    ['unloaded SVG', (copy) => copy.states.mobileLight.geometry.svg.loaded = false],
    ['source drift', (copy) => copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'],
    ['relation H1 drift', (copy) => copy.states.mobileDark.relations[0].h1 = 'fabricated'],
    ['missing relation return', (copy) => copy.states.mobileLight.relations[0].returnedToArticle = false],
    ['visible href drift', (copy) => copy.states.desktopLight.relations[0].visibleHref = '/tego-arch/fabricated'],
    ['actionability overclaim', (copy) => copy.states.desktopDark.relations[0].actionability.status = 'ACTIONABLE'],
    ['desktop mode overclaim', (copy) => copy.states.desktopLight.relations[0].navigationMode = 'link click'],
    ['desktop selection reason drift', (copy) => copy.states.desktopDark.relations[0].selectionReason = 'fabricated'],
    ['mobile click overclaim', (copy) => copy.states.mobileLight.relations[0].clickAttempted = true],
    ['mobile compatibility reason drift', (copy) => copy.states.mobileDark.relations[0].selectionReason = 'fabricated'],
    ['fallback target mismatch', (copy) => copy.states.mobileLight.relations[0].fallbackTargetEqualsVisibleHref = false],
    ['unpublished next link', (copy) => copy.states.desktopLight.geometry.nextUnpublishedActionable = 1],
    ['runtime exception', (copy) => copy.states.desktopLight.diagnostics.runtimeExceptions.push('boom')],
    ['truncated protocol log', (copy) => copy.states.desktopLight.diagnostics.truncated = true],
    ['accepted screenshot status', (copy) => copy.screenshotEvidence.status = 'ACCEPTED'],
    ['accepted screenshot disposition', (copy) => copy.screenshotEvidence.acceptance = 'ACCEPTED'],
    ['screenshot reason drift', (copy) => copy.screenshotEvidence.reason = 'fabricated'],
    ['screenshot identity drift', (copy) => copy.screenshotEvidence.captures.mobileDark.path = '.superpowers/sdd/fabricated.png'],
    ['accepted screenshot hash', (copy) => copy.screenshotEvidence.captures.desktopLight.sha256 = '0'.repeat(64)],
  ];
  for (const [label, mutate] of evidenceMutations) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.throws(() => assertBrowserEvidence(copy), {name: 'AssertionError'}, label);
  }
  assert.notEqual(sha256(Buffer.concat([evidenceBytes, Buffer.from(' ')])), sha256(evidenceBytes));

  for (const [label, before, after] of [
    ['code readiness', 'Code review: `PENDING`.', 'Code review: `READY / APPROVE`.'],
    ['content readiness', 'Content, evidence, and rights review: `PENDING`; rights: `PENDING`.', 'Content, evidence, and rights review: `CONTENT READY`; rights: `PASS`.'],
    ['architecture readiness', 'Architecture review: `PENDING`.', 'Architecture review: `CLEAR / READY`.'],
    ['final readiness', 'Final Stage A review judgment: `PENDING`.', 'Final Stage A review judgment: `READY`.'],
    ['fabricated deployment', 'Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['review geometry drift', '`1440/1440`', '`1440/1441`'],
    ['generated hash drift', 'e1555ff13777d6a1d150a85f828529192aed8bdb3b35546636445db99cf981d7', '0'.repeat(64)],
    ['screenshot status overclaim', 'Screenshot evidence status: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence status: `ACCEPTED`.'],
    ['screenshot identity drift', '.superpowers/sdd/g010-mth07-stage-a-mobile-dark.png', '.superpowers/sdd/fabricated.png'],
    ['screenshot reason drift', SCREENSHOT_REASON, 'fabricated screenshot reason'],
    ['desktop fallback wording drift', 'Desktop navigation mode: `forced link activation`;', 'Desktop navigation mode: `link click`;'],
    ['mobile fallback wording drift', 'Mobile navigation mode: `harness-selected compatibility navigation`;', 'Mobile navigation mode: `link click`;'],
    ['fabricated visual pass', 'The ignored captures remain rejected diagnostics only; no screenshot hash, continuous full-page capture, or independent visual-review PASS is accepted.', 'Visual inspection: `PASS`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    await assert.rejects(() => assertReview(mutated), {name: 'AssertionError'}, label);
  }
});

test('keeps Browser review claims closed across the complete current review', async () => {
  const browser = section(review, 'Local in-app Browser QA');
  assert.match(browser, /\bNOT_ACCEPTED\b/u);
  assert.doesNotMatch(browser, /\bACCEPTED\b/u);

  const checkpoint = '## Independent review checkpoint';
  const additiveClaims = [
    ['standalone acceptance', 'ACCEPTED'],
    ['acceptance claim', 'Screenshot evidence claim: ACCEPTED.'],
    ['screenshot SHA-256 identity', `Screenshot SHA-256: \`${'0'.repeat(64)}\`.`],
    ['screenshot hash identity', `Screenshot hash identity: \`${'0'.repeat(64)}\`.`],
    ['full-page visual pass', 'Full-page screenshot: PASS.'],
    ['distant full-page visual pass', 'Full-page screenshot with a long compatibility explanation that is still not visual evidence: PASS.'],
    ['desktop visible click claim', 'Desktop relations used visible link clicks.'],
    ['desktop exact click claim', 'Desktop relations used exact link clicks.'],
    ['mobile click failure claim', 'Mobile relation click failed.'],
    ['mobile Browser-back claim', 'Mobile relation click stopped dispatching after Browser back.'],
    ['warning diagnostics', 'Warning/error logs: 1.'],
    ['runtime diagnostics', 'Runtime exceptions: 1.'],
    ['pagination remainder', 'hasMore=true.'],
    ['truncated diagnostics', 'truncated=true.'],
  ];
  for (const [label, addition] of additiveClaims) {
    const mutated = review.replace(checkpoint, `${addition}\n\n${checkpoint}`);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    await assert.rejects(() => assertReview(mutated), {name: 'AssertionError'}, label);
  }
});
