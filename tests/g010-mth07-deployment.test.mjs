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
const PRODUCTION_EVIDENCE_PATH = 'docs/reviews/evidence/g010-mth07-stage-a-production-browser.json';
const PRODUCTION_EVIDENCE_SHA256 = 'e3d28a498d23aec12d6df4b32c35fa69052d1fa4ec324a2ec6c53caa34beeeb2';
const IMPLEMENTATION_HEAD = 'a413be060c93f7ddd20e7db5417e94f4166dc1e8';
const PAGES = {runId: 31786075868, buildJobId: 94722157542, deployJobId: 94722766883};
const BROWSER_BUILD_HEAD = 'f32e0cb7ae79fb92a2154c03dfe8bf7b5b203974';
const REVIEWED_HEAD = '4c5c9f99148a32998ee03bd8f97b3db2ca29d500';
const HISTORICAL_REVIEW_TREE_HASH = '675a88450c587b392cccc75bfeced523d32acc6bd78830de545586a308a85bff';
const MTH07_STATUS = {
  scope: 'content-lifecycle',
  value: 'reviewed',
  source: 'content/methods/mth-07-fde-enterprise-ai-delivery.mdx',
};
const PROJECT_STATUS = {
  schema_version: 1,
  durable_stories: {completed: 8, total: 20, current: 'G009'},
  completed_topics: 63,
  content_documents: 107,
  governed_sources: 560,
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
const PRODUCTION_ROUTES = [
  ['/', '/tego-arch/', 17310, 'bdb717e4281f4f1814f4f32241985db71581777cb38d4c2fa22b00e61c0933cb'],
  ['/methods', '/tego-arch/methods', 20582, '340081dc771e57fb9538aaaef2a520322a6eed4c4f3509f8851879d1a6dda876'],
  ['/methods/mth-07', '/tego-arch/methods/mth-07', 41342, 'e691982b1ffd8b0ddbd79cdcae9111bfd1f8a027d1bdf5d4833640c69f981614'],
  ['/methods/mth-01', '/tego-arch/methods/mth-01', 30095, 'd263c5eb3772d7d288783b34346ecf69688c19117611b7d5431976ce98cd8c98'],
  ['/methods/mth-04', '/tego-arch/methods/mth-04', 29761, '8efd01a31c217b72107dca34de87da987bab94cd773816da1d689abed172c69c'],
  ['/methods/mth-06', '/tego-arch/methods/mth-06', 30618, '191fce815edee2a8a891286580ffde3d2082df1f6e665ba97ee6fa4e250b3eb3'],
  ['/cases/temporal-saga-durable-execution', '/tego-arch/cases/temporal-saga-durable-execution', 66247, 'aa12adee92266efb5c1db3b71ae75c5b2b540a79281c890f5607690bb3740988'],
  ['/references', '/tego-arch/references', 23533, 'c4deed5f0cc6848389cdd7576fce56500178c2d458132cae6d54cfa5a653a709'],
];
const PRODUCTION_SVG = {
  path: '/tego-arch/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg',
  status: 200,
  contentType: 'image/svg+xml',
  bytes: 10150,
  sha256: '56a914a2f15894ebd1be9453c648976773dfd616dd1d8718be560f62a84c8a7f',
  reviewedBytes: 10150,
  reviewedSha256: '56a914a2f15894ebd1be9453c648976773dfd616dd1d8718be560f62a84c8a7f',
  exactMatch: true,
};
const PRODUCTION_SVG_SRC = 'https://sealday.github.io/tego-arch/assets/images/mth-07-fde-enterprise-ai-delivery-gates-4cc0de890d42a0daf96c9eb73139d892.svg';
const REVIEW_H2 = ['Candidate identity', 'Stage A projection', 'Local in-app Browser QA', 'Independent review checkpoint', 'Production Stage A evidence'];
const PRE_VERDICT_SECTION_SHA256 = new Map([
  ['Candidate identity', '5f2acd3a0da3deea6ced6eba26cb39ace264b78e4f5e399bac3b1a005e655de1'],
  ['Stage A projection', 'e228e91b90d08ba53c6b000fb45f9469a75a68d745d38e7c22a3ebf2ce8dca5f'],
  ['Local in-app Browser QA', 'e07d8232c0aaf2bed7dfdc39b76ee1433c64c30f7badecafb628b7c2332b322c'],
]);
const FINAL_REVIEW_CHECKPOINT = [
  `- Exact Stage A reviewed head: \`${REVIEWED_HEAD}\`.`,
  '- Finding `I1` (`CONFIRMED / REMEDIATED`): the Browser build provenance was not an exact reviewed-head identity.',
  '- Finding `I2` (`CONFIRMED / REMEDIATED`): additive Browser-evidence fields could inject deployment or visual-success claims.',
  '- Finding `I3` (`CONFIRMED / REMEDIATED`): displaced review prose could inject contradictory READY, SUCCESS, or PASS claims.',
  '- Finding `I4` (`CONFIRMED / REMEDIATED`): the historical-tree helper would have absorbed future G010 production evidence.',
  '- Finding `I5` (`CONFIRMED / REMEDIATED`): punctuation-equivalent `is`, `=`, and dash forms bypassed the global review-claim guards.',
  '- Finding `M1` (`CONFIRMED / REMEDIATED`): two plan references named a missing density script instead of the canonical analyzer.',
  '- Remediation lineage: pre-rebase review candidate `2cabbd18c5e304107fccdf34ff386b2d6fb141f4` (rebased counterpart `233d0e2`) → first remediation `c744ce2e6c6c1fd3c23b9907cd6cc365f17885eb` (rebased counterpart `844c2ca`) → syntax remediation `05c03e599f9bf87df763a270d3600f3223084c81` (rebased counterpart `fbe99c2`) → STY-07 integration `ff43419c482ccd0db731fb96ded1e1c0c6449fca` → density-path remediation and final reviewed head `4c5c9f99148a32998ee03bd8f97b3db2ca29d500`.',
  '- Independent code/spec/security review: `READY / APPROVE`; findings: `0`; blockers: `0`.',
  '- Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`; blockers: `0`.',
  '- Independent architecture/invariant review: `CLEAR / READY`; findings: `0`; blockers: `0`.',
  '- Final Stage A review judgment: `READY`.',
  '- Scope boundary: `STAGE_A_ONLY`.',
  '- Deployment status: `NOT_RUN`.',
  '',
  'The three independent final reviews found zero remaining findings or blockers at the exact reviewed head. Screenshot evidence remains `BLOCKED / NOT_ACCEPTED`; this Stage A judgment does not claim production publication, deployment success, visual PASS, backlog closure, or Stage B completion.',
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
const STABLE_ARTIFACTS = new Map([
  ['content/methods/mth-07-fde-enterprise-ai-delivery.mdx', ['17,527', '427e4655402ed74f5a1bc7e798e84d42df9fb3f1d94de87c0a73e02f542dcf7a']],
  ['diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio', ['10,553', '74dcc5c5ba990dfcdd1d0e2806d06fafa01698452689e18a237ba0f1e321c193']],
  ['static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg', ['10,150', '56a914a2f15894ebd1be9453c648976773dfd616dd1d8718be560f62a84c8a7f']],
]);
const HISTORICAL_LEDGER_IDENTITY = ['1,549,383', 'ed822efc7c66c095b5c4a44dd8aec12aa9bb9839ed78719518d87d43a3d7c694'];
const GENERATED_ARTIFACTS = new Map([
  ['src/generated/project-status.json', ['415', 'b75b31e532b97d09d957f7a883501421415edec6b0b5f3059a53cba80e5049f2']],
  ['src/generated/topic-manifest.json', ['220,503', '138ad9abb740787b1823b55641d9b6085da6a9bc2862d637fb8b34e4bd544e70']],
  ['src/generated/topic-indexes.json', ['220,657', '503d7d488ef6cd2cb0e0cfab643caa5be6026e2ef990ebd1d9481fc60d31d0e0']],
  ['src/generated/source-ledger.json', ['1,835,160', 'b4bb74d57a77f1ef2365da526f1547bfc063f19d162dac2a0518990509d14d2d']],
]);

const [review, evidenceBytes, productionEvidenceBytes, manifest, indexes, projectStatus, publicLedger, backlog] = await Promise.all([
  readFile(path.join(ROOT, REVIEW_PATH), 'utf8').catch((error) => error?.code === 'ENOENT' ? '' : Promise.reject(error)),
  readFile(path.join(ROOT, EVIDENCE_PATH)).catch((error) => error?.code === 'ENOENT' ? Buffer.from('{}') : Promise.reject(error)),
  readFile(path.join(ROOT, PRODUCTION_EVIDENCE_PATH)).catch((error) => error?.code === 'ENOENT' ? Buffer.from('{}') : Promise.reject(error)),
  readFile(path.join(ROOT, 'src/generated/topic-manifest.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/topic-indexes.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/project-status.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'src/generated/source-ledger.json'), 'utf8').then(JSON.parse),
  readFile(path.join(ROOT, 'docs/content-backlog.md'), 'utf8'),
]);
const evidence = JSON.parse(evidenceBytes);
const productionEvidence = JSON.parse(productionEvidenceBytes);

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
    relative !== 'docs/reviews/g009-batch9.md' &&
    relative !== 'docs/reviews/g009-batch10.md' &&
    relative !== 'docs/reviews/g009-batch11.md' &&
    relative !== 'docs/reviews/g009-batch12.md' &&
    !relative.startsWith('docs/reviews/evidence/g009-batch9-') &&
    !relative.startsWith('docs/reviews/evidence/g009-batch10-') &&
    !relative.startsWith('docs/reviews/evidence/g009-batch11-') &&
    !relative.startsWith('docs/reviews/evidence/g009-batch12-') &&
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
  assert.equal(publicLedger.sources.length, 560);
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

function assertCleanDiagnostics(actual, label) {
  assertExactKeys(actual, ['runtimeExceptions', 'logEntries', 'events', 'hasMore', 'truncated'], label);
  assert.deepEqual(actual.runtimeExceptions, []);
  assert.deepEqual(actual.logEntries, []);
  assert.deepEqual(actual.events, []);
  assert.equal(actual.hasMore, false);
  assert.equal(actual.truncated, false);
}

function assertProductionEvidence(actual) {
  assertExactKeys(actual, [
    'schemaVersion',
    'collectedAt',
    'freshProductionCapture',
    'localEvidenceReused',
    'implementationHead',
    'pages',
    'probes',
    'states',
    'navigationProbes',
    'navigationDiagnostics',
    'captureNotes',
    'screenshotEvidence',
  ], 'production evidence root');
  assert.equal(actual.schemaVersion, 1);
  assert.equal(actual.collectedAt, '2026-08-14T09:42:31.079Z');
  assert.equal(actual.freshProductionCapture, true);
  assert.equal(actual.localEvidenceReused, false);
  assert.equal(actual.implementationHead, IMPLEMENTATION_HEAD);
  assertExactKeys(actual.pages, ['runId', 'buildJobId', 'deployJobId', 'status', 'conclusion'], 'production Pages');
  assert.deepEqual(actual.pages, {...PAGES, status: 'completed', conclusion: 'success'});
  assertExactKeys(actual.probes, ['routes', 'svg'], 'production probes');
  assert.deepEqual(actual.probes.routes.map(({path: route, deployedPath, bytes, sha256: hash}) => [route, deployedPath, bytes, hash]), PRODUCTION_ROUTES);
  for (const [index, route] of actual.probes.routes.entries()) {
    assertExactKeys(route, ['path', 'deployedPath', 'status', 'contentType', 'bytes', 'sha256'], `production route ${index}`);
    assert.equal(route.status, 200);
    assert.equal(route.contentType, 'text/html; charset=utf-8');
  }
  assertExactKeys(actual.probes.svg, Object.keys(PRODUCTION_SVG), 'production SVG probe');
  assert.deepEqual(actual.probes.svg, PRODUCTION_SVG);
  assert.deepEqual(Object.keys(actual.states), STATES);

  const expectedStates = {
    desktopLight: {theme: 'light', viewport: {width: 1440, height: 1000}, clientWidth: 800},
    desktopDark: {theme: 'dark', viewport: {width: 1440, height: 1000}, clientWidth: 800},
    mobileLight: {theme: 'light', viewport: {width: 390, height: 844}, clientWidth: 358},
    mobileDark: {theme: 'dark', viewport: {width: 390, height: 844}, clientWidth: 358},
  };
  for (const [name, expected] of Object.entries(expectedStates)) {
    const state = actual.states[name];
    assertExactKeys(state, ['state', 'theme', 'viewport', 'actualViewport', 'geometry', 'interactions', 'relations', 'logs', 'diagnostics'], `${name} production state`);
    assert.equal(state.state, name);
    assert.equal(state.theme, expected.theme);
    assertExactKeys(state.viewport, ['width', 'height'], `${name} requested viewport`);
    assertExactKeys(state.actualViewport, ['width', 'height'], `${name} actual viewport`);
    assert.deepEqual(state.viewport, expected.viewport);
    assert.deepEqual(state.actualViewport, expected.viewport);
    assertExactKeys(state.geometry, ['h1', 'page', 'wrappers', 'svg', 'sources', 'paginationNext', 'nextUnpublishedActionable'], `${name} production geometry`);
    assert.equal(state.geometry.h1, '企业 AI 前线部署：从 POC 到可复制系统的交付门禁');
    assert.deepEqual(state.geometry.page, {clientWidth: expected.viewport.width, scrollWidth: expected.viewport.width});
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth}) => clientWidth), [expected.clientWidth, expected.clientWidth, expected.clientWidth]);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth}) => scrollWidth), [800, 1643, 2101]);
    for (const [index, wrapper] of state.geometry.wrappers.entries()) {
      assertExactKeys(wrapper, ['clientWidth', 'label', 'scrollWidth'], `${name} production wrapper ${index}`);
    }
    assertExactKeys(state.geometry.svg, ['loaded', 'naturalHeight', 'naturalWidth', 'renderedHeight', 'renderedWidth', 'src'], `${name} production SVG`);
    assert.deepEqual(state.geometry.svg, {
      loaded: true,
      naturalHeight: 150,
      naturalWidth: 116,
      renderedHeight: 1032,
      renderedWidth: 800,
      src: PRODUCTION_SVG_SRC,
    });
    assert.deepEqual(state.geometry.sources.map(({href}) => href), SOURCE_HREFS);
    for (const source of state.geometry.sources) {
      assertExactKeys(source, ['href', 'rel', 'target'], `${name} production source`);
      assert.equal(source.rel, 'noopener noreferrer');
      assert.equal(source.target, '_blank');
    }
    assert.deepEqual(state.geometry.paginationNext, ['/tego-arch/modeling']);
    assert.equal(state.geometry.nextUnpublishedActionable, 0);
    assert.equal(state.interactions.length, 3);
    for (const [index, interaction] of state.interactions.entries()) {
      assertExactKeys(interaction, ['label', 'before', 'after'], `${name} production interaction ${index}`);
      assert.equal(interaction.label, WRAPPER_LABELS[index]);
      for (const phase of ['before', 'after']) {
        assertExactKeys(interaction[phase], ['focus', 'focusVisible', 'outline', 'scrollLeft'], `${name} ${phase} interaction ${index}`);
        assert.equal(interaction[phase].focus, true);
        assert.equal(interaction[phase].focusVisible, true);
        assert.match(interaction[phase].outline, /solid 3px/u);
      }
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.scrollLeft, state.geometry.wrappers[index].scrollWidth > state.geometry.wrappers[index].clientWidth ? 40 : 0);
    }
    assert.deepEqual(state.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    for (const relation of state.relations) {
      assertExactKeys(relation, ['href', 'visibleHref', 'visibleText', 'count', 'expectedH1'], `${name} production relation`);
      assert.equal(relation.visibleHref, relation.href);
      assert.equal(relation.count, 1);
      assert.ok(relation.visibleText.length > 0);
    }
    assert.deepEqual(state.logs, []);
    assertCleanDiagnostics(state.diagnostics, `${name} production diagnostics`);
  }

  assert.equal(actual.navigationProbes.length, RELATIONS.length);
  for (const [index, probe] of actual.navigationProbes.entries()) {
    const [href, expectedH1] = RELATIONS[index];
    assertExactKeys(probe, ['href', 'expectedH1', 'visibleHref', 'h1', 'destinationUrl', 'returnedH1', 'returnedToArticle', 'navigation', 'navigationTargetEqualsVisibleHref'], `production navigation ${index}`);
    assert.equal(probe.href, href);
    assert.equal(probe.visibleHref, href);
    assert.equal(probe.expectedH1, expectedH1);
    assert.equal(probe.h1, expectedH1);
    assert.equal(new URL(probe.destinationUrl).pathname, href);
    assert.equal(probe.returnedH1, '企业 AI 前线部署：从 POC 到可复制系统的交付门禁');
    assert.equal(probe.returnedToArticle, true);
    assert.equal(probe.navigation, 'direct exact-href navigation and direct article return; no physical relation click claimed');
    assert.equal(probe.navigationTargetEqualsVisibleHref, true);
  }
  assertExactKeys(actual.navigationDiagnostics, ['logs', 'runtimeExceptions', 'logEntries', 'events', 'hasMore', 'truncated'], 'production navigation diagnostics');
  assert.deepEqual(actual.navigationDiagnostics.logs, []);
  assertCleanDiagnostics({
    runtimeExceptions: actual.navigationDiagnostics.runtimeExceptions,
    logEntries: actual.navigationDiagnostics.logEntries,
    events: actual.navigationDiagnostics.events,
    hasMore: actual.navigationDiagnostics.hasMore,
    truncated: actual.navigationDiagnostics.truncated,
  }, 'production navigation diagnostics body');
  assertExactKeys(actual.captureNotes, ['successfulStrategy', 'discardedAttempts', 'mobileThemeSelection'], 'production capture notes');
  assert.equal(actual.captureNotes.successfulStrategy, 'One fresh production tab; four responsive/theme states; four direct exact-href destination and article-return probes split into single navigation legs.');
  assert.equal(actual.captureNotes.discardedAttempts, 'Two earlier monolithic orchestration attempts exceeded the 60-second execution boundary and were discarded without reusing their partial state.');
  assert.equal(actual.captureNotes.mobileThemeSelection, 'The mobile navbar was opened to activate the visible theme toggle, then closed before geometry and interaction capture.');
  assertExactKeys(actual.screenshotEvidence, ['status', 'trackedNewBytes', 'attempts', 'reason'], 'production screenshot evidence');
  assert.equal(actual.screenshotEvidence.status, 'BLOCKED / NOT_ACCEPTED');
  assert.equal(actual.screenshotEvidence.trackedNewBytes, false);
  assert.deepEqual(actual.screenshotEvidence.attempts, []);
  assert.equal(actual.screenshotEvidence.reason, 'No new valid tracked screenshot bytes were captured in this production run. Prior ignored local captures remain rejected diagnostics and are not reused; no screenshot or independent visual-review PASS is claimed.');
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
  for (const [artifact, [bytes, hash]] of STABLE_ARTIFACTS) {
    const body = await readFile(path.join(ROOT, artifact));
    assert.equal(body.length.toLocaleString('en-US'), bytes, `${artifact} byte count fixture`);
    assert.equal(sha256(body), hash, `${artifact} SHA-256 fixture`);
    assert.match(
      identity,
      new RegExp(`\\| ${escapeRegExp(`\`${artifact}\``)} \\| ${escapeRegExp(bytes)} \\| ${escapeRegExp(`\`${hash}\``)} \\|`, 'u'),
      `${artifact} review identity`,
    );
  }
  assert.match(identity, new RegExp(`\\| ${escapeRegExp('`data/source-ledger.json`')} \\| ${escapeRegExp(HISTORICAL_LEDGER_IDENTITY[0])} \\| ${escapeRegExp(`\`${HISTORICAL_LEDGER_IDENTITY[1]}\``)} \\|`, 'u'));

  const projection = section(source, 'Stage A projection');
  assert.match(projection, /60 completed topics \/ 103 content documents \/ 533 governed sources/u);
  assert.match(projection, /MTH-07: `published \/ reviewed`; route: `\/methods\/mth-07`/u);
  assert.ok(projection.includes(`Exact status object: \`${JSON.stringify(MTH07_STATUS)}\`.`));
  assert.ok(projection.includes('MTH-07 is absent from `docs/content-backlog.md`; completed topics remain `60`.'));
  for (const [artifact, [bytes, hash]] of GENERATED_ARTIFACTS) {
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
  assert.equal(checkpoint, FINAL_REVIEW_CHECKPOINT, 'one exact authoritative final review checkpoint');
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
    `Exact Stage A reviewed head: \`${REVIEWED_HEAD}\`.`,
    'Independent code/spec/security review: `READY / APPROVE`; findings: `0`; blockers: `0`.',
    'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`; blockers: `0`.',
    'Independent architecture/invariant review: `CLEAR / READY`; findings: `0`; blockers: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), `checkpoint literal: ${literal}`);
  for (const finding of ['I1', 'I2', 'I3', 'I4', 'I5', 'M1']) {
    assert.ok(checkpoint.includes(`Finding \`${finding}\` (\`CONFIRMED / REMEDIATED\`)`), `${finding} finding history`);
  }
  assert.doesNotMatch(checkpoint, /\bPENDING\b|Deployment status: `SUCCESS`/u);
  assert.doesNotMatch(source, /Visual inspection:.*`PASS`|Screenshot evidence: `PASS`|Deployment status: `SUCCESS`/iu);

  const production = section(source, 'Production Stage A evidence');
  for (const literal of [
    `Exact production implementation head: \`${IMPLEMENTATION_HEAD}\`.`,
    `Exact Pages run: \`${PAGES.runId}\`; build job: \`${PAGES.buildJobId}\`; deploy job: \`${PAGES.deployJobId}\`; every status: \`completed / success\`.`,
    `Raw production Browser JSON: \`${PRODUCTION_EVIDENCE_PATH}\`; bytes: \`${productionEvidenceBytes.length.toLocaleString('en-US')}\`; SHA-256: \`${PRODUCTION_EVIDENCE_SHA256}\`.`,
    'Production Browser capture: `4/4` responsive/theme states from one fresh production session; local evidence reused: `false`.',
    'Exact viewport applications: `4/4`; wrapper geometry and ArrowRight interactions: `12/12`.',
    'Visible relation href/count observations: `16/16`; exact destination H1/direct article-return probes: `4/4`.',
    'Remote source target/rel observations: `12/12`; MTH-08 actionable links: `0` in every state.',
    'State and navigation diagnostics: warning/error logs `0`, runtime exceptions `0`, protocol log entries `0`, `hasMore=false`, `truncated=false`.',
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; new tracked screenshot bytes: `false`; accepted attempts: `0`.',
    'Production deployment: `SUCCESS`.',
    'Final production Stage A judgment: `PASS`, scoped to deployment, HTTP identity, and functional Browser evidence; screenshot and independent visual-review PASS remain excluded.',
    'Stage B: `NOT_RUN`; MTH-07 remains `published / reviewed` and absent from the backlog.',
  ]) assert.ok(production.includes(literal), `production review literal: ${literal}`);
  for (const [route, deployedPath, bytes, hash] of PRODUCTION_ROUTES) {
    assert.ok(production.includes(`| \`${route}\` | \`${deployedPath}\` | \`200\` | \`text/html; charset=utf-8\` | ${bytes.toLocaleString('en-US')} | \`${hash}\` |`), `${route} production HTTP row`);
  }
  assert.ok(production.includes(`| \`${PRODUCTION_SVG.path}\` | \`200\` | \`${PRODUCTION_SVG.contentType}\` | ${PRODUCTION_SVG.bytes.toLocaleString('en-US')} | \`${PRODUCTION_SVG.sha256}\` | \`true\` |`));
  assert.doesNotMatch(production, /Screenshot evidence: `(?:ACCEPTED|PASS)`|Visual inspection:.*`PASS`/iu);
}

test('preserves exact MTH-07 history under current totals without publishing a fabricated next topic', () => {
  assertProjection();
  const publishedRoutes = new Set(manifest.topics.filter(({published}) => published).map(({slug}) => slug));
  assert.equal(publishedRoutes.has('/methods/mth-07'), true);
});

test('binds exact candidate artifacts, raw four-state Browser semantics, and final independent review slots', async () => {
  assert.equal(sha256(evidenceBytes), EVIDENCE_SHA256);
  assertBrowserEvidence(evidence);
  await assertReview(review);
});

test('binds exact successful Pages, HTTP, SVG, and fresh production Browser evidence without screenshot overclaim', async () => {
  assert.equal(productionEvidenceBytes.length, 26048);
  assert.equal(sha256(productionEvidenceBytes), PRODUCTION_EVIDENCE_SHA256);
  assertProductionEvidence(productionEvidence);
  await assertReview(review);
});

test('preserves every historical review and evidence artifact byte for byte', async () => {
  assert.equal(await historicalReviewTreeHash(), HISTORICAL_REVIEW_TREE_HASH);
});

test('separates the Browser build provenance from the exact reviewed head', () => {
  assert.equal(evidence.browserBuildHead, BROWSER_BUILD_HEAD);
  assert.equal('candidateHead' in evidence, false);
  const identity = section(review, 'Candidate identity');
  assert.ok(identity.includes(`Exact Browser build head: \`${BROWSER_BUILD_HEAD}\`.`));
  assert.doesNotMatch(identity, /Exact candidate head:/u);
  assert.ok(section(review, 'Independent review checkpoint').includes(`Exact Stage A reviewed head: \`${REVIEWED_HEAD}\`.`));
  assert.notEqual(BROWSER_BUILD_HEAD, REVIEWED_HEAD);
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
    'docs/reviews/g009-batch10.md',
    'docs/reviews/evidence/g009-batch10-stage-a-browser.json',
    'docs/reviews/g009-batch11.md',
    'docs/reviews/evidence/g009-batch11-stage-a-browser.json',
    'docs/reviews/g009-batch12.md',
    'docs/reviews/evidence/g009-batch12-stage-a-browser.json',
    'docs/reviews/evidence/g010-mth07-stage-a-production-browser.json',
    'docs/reviews/evidence/g010-mth07-stage-b-production-browser.json',
  ]) assert.equal(isHistoricalReviewArtifact(currentPath), false, `${currentPath} is current G010 evidence`);
  assert.equal(isHistoricalReviewArtifact('docs/reviews/g009-batch7.md'), true);

  const entries = await historicalReviewEntries();
  assert.equal(entries.length, 39);
  assert.equal(historicalReviewEntriesHash(entries), HISTORICAL_REVIEW_TREE_HASH);
  const added = [...entries, {relative: 'docs/reviews/fabricated-history.md', bytes: Buffer.from('fabricated')}];
  const edited = entries.map((entry, index) => index === 0 ? {...entry, bytes: Buffer.concat([entry.bytes, Buffer.from(' ')])} : entry);
  const deleted = entries.slice(1);
  assert.notEqual(historicalReviewEntriesHash(added), HISTORICAL_REVIEW_TREE_HASH);
  assert.notEqual(historicalReviewEntriesHash(edited), HISTORICAL_REVIEW_TREE_HASH);
  assert.notEqual(historicalReviewEntriesHash(deleted), HISTORICAL_REVIEW_TREE_HASH);
});

test('rejects Browser evidence mutations and weakened stale or fabricated Stage A review claims', async () => {
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
    ['wrong reviewed head', REVIEWED_HEAD, '0'.repeat(40)],
    ['weakened code verdict', 'Independent code/spec/security review: `READY / APPROVE`; findings: `0`; blockers: `0`.', 'Independent code/spec/security review: `READY`; findings: `0`; blockers: `0`.'],
    ['stale code slot', 'Independent code/spec/security review: `READY / APPROVE`; findings: `0`; blockers: `0`.', 'Independent code/spec/security review: `PENDING`; findings: `0`; blockers: `0`.'],
    ['stale content slot', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`; blockers: `0`.', 'Independent content/evidence/rights review: `PENDING`; rights: `PASS`; findings: `0`; blockers: `0`.'],
    ['rights failure', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `PASS`; findings: `0`; blockers: `0`.', 'Independent content/evidence/rights review: `CONTENT READY`; rights: `FAIL`; findings: `0`; blockers: `0`.'],
    ['stale architecture slot', 'Independent architecture/invariant review: `CLEAR / READY`; findings: `0`; blockers: `0`.', 'Independent architecture/invariant review: `PENDING`; findings: `0`; blockers: `0`.'],
    ['stale final verdict', 'Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['fabricated deployment', 'Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
    ['review geometry drift', '`1440/1440`', '`1440/1441`'],
    ['generated hash drift', 'b75b31e532b97d09d957f7a883501421415edec6b0b5f3059a53cba80e5049f2', '0'.repeat(64)],
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

test('rejects production provenance, probe, Browser, navigation, screenshot, and review overclaim mutations', async () => {
  const mutations = [
    ['additive root claim', (copy) => copy.visualInspection = 'PASS'],
    ['local evidence reuse', (copy) => copy.localEvidenceReused = true],
    ['non-fresh capture', (copy) => copy.freshProductionCapture = false],
    ['wrong implementation head', (copy) => copy.implementationHead = '0'.repeat(40)],
    ['wrong Pages run', (copy) => copy.pages.runId += 1],
    ['wrong build job', (copy) => copy.pages.buildJobId += 1],
    ['failed deploy', (copy) => copy.pages.conclusion = 'failure'],
    ['missing route', (copy) => copy.probes.routes.pop()],
    ['route status drift', (copy) => copy.probes.routes[0].status = 404],
    ['route hash drift', (copy) => copy.probes.routes[2].sha256 = '0'.repeat(64)],
    ['SVG byte drift', (copy) => copy.probes.svg.bytes += 1],
    ['SVG mismatch', (copy) => copy.probes.svg.exactMatch = false],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['actual viewport drift', (copy) => copy.states.desktopLight.actualViewport.width = 1280],
    ['wrapper width drift', (copy) => copy.states.mobileLight.geometry.wrappers[1].scrollWidth += 1],
    ['interaction focus-visible loss', (copy) => copy.states.desktopDark.interactions[1].before.focusVisible = false],
    ['source rel drift', (copy) => copy.states.mobileDark.geometry.sources[0].rel = 'noreferrer'],
    ['relation count drift', (copy) => copy.states.desktopLight.relations[0].count = 2],
    ['unpublished next link', (copy) => copy.states.desktopDark.geometry.nextUnpublishedActionable = 1],
    ['runtime exception', (copy) => copy.states.mobileLight.diagnostics.runtimeExceptions.push('boom')],
    ['navigation target drift', (copy) => copy.navigationProbes[0].visibleHref = '/tego-arch/fabricated'],
    ['navigation H1 drift', (copy) => copy.navigationProbes[1].h1 = 'fabricated'],
    ['navigation return loss', (copy) => copy.navigationProbes[2].returnedToArticle = false],
    ['navigation physical-click overclaim', (copy) => copy.navigationProbes[3].navigation = 'physical click'],
    ['navigation diagnostics truncated', (copy) => copy.navigationDiagnostics.truncated = true],
    ['capture fallback drift', (copy) => copy.captureNotes.discardedAttempts = 'No discarded attempts.'],
    ['accepted screenshot status', (copy) => copy.screenshotEvidence.status = 'ACCEPTED'],
    ['tracked screenshot overclaim', (copy) => copy.screenshotEvidence.trackedNewBytes = true],
    ['fabricated screenshot attempt', (copy) => copy.screenshotEvidence.attempts.push({status: 'PASS'})],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(productionEvidence);
    mutate(copy);
    assert.notDeepEqual(copy, productionEvidence, `${label} mutation applies`);
    assert.throws(() => assertProductionEvidence(copy), {name: 'AssertionError'}, label);
  }
  assert.notEqual(sha256(Buffer.concat([productionEvidenceBytes, Buffer.from(' ')])), PRODUCTION_EVIDENCE_SHA256);

  for (const [label, before, after] of [
    ['production head drift', IMPLEMENTATION_HEAD, '0'.repeat(40)],
    ['Pages run drift', String(PAGES.runId), String(PAGES.runId + 1)],
    ['production evidence hash drift', PRODUCTION_EVIDENCE_SHA256, '0'.repeat(64)],
    ['viewport total drift', 'Exact viewport applications: `4/4`;', 'Exact viewport applications: `3/4`;'],
    ['navigation total drift', 'exact destination H1/direct article-return probes: `4/4`.', 'exact destination H1/direct article-return probes: `3/4`.'],
    ['screenshot acceptance overclaim', 'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`;', 'Screenshot evidence: `ACCEPTED`;'],
    ['visual-review overclaim', 'No production screenshot or independent visual-review PASS is claimed.', 'Visual inspection: `PASS`.'],
    ['Stage B overclaim', 'Stage B: `NOT_RUN`;', 'Stage B: `COMPLETE`;'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    await assert.rejects(() => assertReview(mutated), {name: 'AssertionError'}, label);
  }
});
