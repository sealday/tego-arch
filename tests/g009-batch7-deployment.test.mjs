import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const ARTICLE = 'content/styles/sty-06-event-driven-architecture.mdx';
const DRAWIO = 'diagrams/sty-06-event-driven-four-patterns.drawio';
const SVG = 'static/img/diagrams/sty-06-event-driven-four-patterns.svg';
const LEDGER = 'data/source-ledger.json';
const REVIEW = 'docs/reviews/g009-batch7.md';
const IMMEDIATE_STY05_REVIEW = 'docs/reviews/g009-batch6.md';
const BACKLOG = 'docs/content-backlog.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch7-stage-a-browser.json';
const PRODUCTION_BROWSER = 'docs/reviews/evidence/g009-batch7-stage-a-production-browser.json';
const STAGE_B_PRODUCTION_BROWSER = 'docs/reviews/evidence/g009-batch7-stage-b-production-browser.json';
const REVIEWED_HEAD = '44fcafbef24b68f14a9cbf4be0b3fba09cc6002d';
const EVIDENCE_HEAD = 'f24b4d4a4ebd95bf454f6e87200c83476dc91971';
const IMMEDIATE_STY05_HISTORY_HASH = 'dc7180a0503ebcc2e285d8425e4e37f87b6125339823ba5577eb822992aa7109';
const IMMEDIATE_STY05_REVIEW_HASH = 'b8b16c04ecae53468b9283bcba0d831850c400762840c742f17e7c57933789b0';
const STAGE_B_REVIEWED_HEAD = '9cee8a1ad64cb0fa20213a477087bb3cbae5657f';
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPER_LABELS = [
  '订单事件的四种模式并排比较图，可横向滚动',
  '事件驱动故障检测、自动响应、停止条件与人工责任表，可横向滚动',
  '订单事件四种模式决策矩阵，可横向滚动',
];
const RELATIONS = [
  ['/tego-arch/styles/sty-04', '模块化单体：在一个部署单元内保护业务边界'],
  ['/tego-arch/styles/sty-05', '微服务：用独立部署换取自治，也承担分布式成本'],
  ['/tego-arch/principles/pr-11', '命令查询分离、CQRS 与读写分离'],
  ['/tego-arch/modeling/mod-08', '状态机建模'],
];
const SOURCE_IDS = [
  'src-fowler-what-do-you-mean-event-driven',
  'src-microsoft-event-driven-architecture-style',
  'src-microsoft-event-sourcing-pattern',
  'src-cncf-cloudevents-102-spec',
  'src-w3c-scxml-2015',
  'src-atlas-sty06-event-driven-four-patterns',
];

const [review, immediateSty05ReviewBytes, backlog, rawBrowserBytes, productionBrowserBytes, stageBProductionBrowserBytes, manifest, indexes, status, publicLedger] = await Promise.all([
  readFile(new URL(`../${REVIEW}`, import.meta.url), 'utf8').catch((error) =>
    error?.code === 'ENOENT' ? '' : Promise.reject(error)),
  readFile(new URL(`../${IMMEDIATE_STY05_REVIEW}`, import.meta.url)),
  readFile(new URL(`../${BACKLOG}`, import.meta.url), 'utf8'),
  readFile(new URL(`../${RAW_BROWSER}`, import.meta.url)),
  readFile(new URL(`../${PRODUCTION_BROWSER}`, import.meta.url)),
  readFile(new URL(`../${STAGE_B_PRODUCTION_BROWSER}`, import.meta.url)),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const rawBrowser = JSON.parse(rawBrowserBytes);
const productionBrowser = JSON.parse(productionBrowserBytes);
const stageBProductionBrowser = JSON.parse(stageBProductionBrowserBytes);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function section(source, heading) {
  const headings = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  const current = headings.filter((match) => match[1] === heading);
  assert.equal(current.length, 1, `review must contain one ${heading} section`);
  const next = headings.find((match) => match.index > current[0].index);
  return source.slice(current[0].index + current[0][0].length, next?.index ?? source.length).trim();
}

function assertProjection() {
  assert.deepEqual({
    completed_topics: status.completed_topics,
    content_documents: status.content_documents,
    governed_sources: status.governed_sources,
  }, {completed_topics: 63, content_documents: 107, governed_sources: 560});
  assert.equal(publicLedger.sources.length, 560);

  const sty06 = manifest.topics.find(({id}) => id === 'STY-06');
  const sty07 = manifest.topics.find(({id}) => id === 'STY-07');
  assert.deepEqual([sty06?.published, sty06?.status.value, sty06?.slug], [true, 'complete', '/styles/sty-06']);
  assert.deepEqual([sty07?.published, sty07?.status.value], [true, 'complete']);
  assert.equal(indexes.style.find(({id}) => id === 'STY-06')?.published, true);
  assert.equal(indexes.style.find(({id}) => id === 'STY-07')?.published, true);
  assert.deepEqual(SOURCE_IDS.filter((id) => publicLedger.sources.some((source) => source.id === id)), SOURCE_IDS);
}

function assertRawBrowserEvidence(evidence) {
  assert.equal(evidence.candidateHead, REVIEWED_HEAD);
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: evidence.screenshotEvidence.reason,
  });
  assert.ok(evidence.screenshotEvidence.reason.trim().length > 0);
  assert.doesNotMatch(evidence.screenshotEvidence.reason, /\bPASS\b/iu);
  assert.deepEqual(Object.keys(evidence.states), STATES);
  for (const [state, expected] of Object.entries({
    desktopLight: {theme: 'light', width: 1440, height: 1000, clientWidths: [800, 800, 800], scrollLefts: [0, 40, 40]},
    desktopDark: {theme: 'dark', width: 1440, height: 1000, clientWidths: [800, 800, 800], scrollLefts: [0, 40, 40]},
    mobileLight: {theme: 'light', width: 390, height: 844, clientWidths: [358, 358, 358], scrollLefts: [40, 40, 40]},
    mobileDark: {theme: 'dark', width: 390, height: 844, clientWidths: [358, 358, 358], scrollLefts: [40, 40, 40]},
  })) {
    const actual = evidence.states[state];
    assert.deepEqual(actual.viewport, {width: expected.width, height: expected.height});
    assert.equal(actual.theme, expected.theme);
    assert.deepEqual(actual.geometry.page, {clientWidth: expected.width, scrollWidth: expected.width});
    assert.deepEqual(actual.geometry.wrappers.map(({label}) => label), WRAPPER_LABELS);
    assert.deepEqual(actual.geometry.wrappers.map(({clientWidth}) => clientWidth), expected.clientWidths);
    assert.deepEqual(actual.geometry.wrappers.map(({scrollWidth}) => scrollWidth), [800, 1118, 1342]);
    assert.equal(actual.interactions.length, 3);
    for (const [index, interaction] of actual.interactions.entries()) {
      assert.equal(interaction.before.focus, true);
      assert.equal(interaction.before.focusVisible, true);
      assert.match(interaction.before.outline, /solid 3px/u);
      assert.equal(interaction.after.focus, true);
      assert.equal(interaction.after.focusVisible, true);
      assert.match(interaction.after.outline, /solid 3px/u);
      assert.equal(interaction.before.scrollLeft, 0);
      assert.equal(interaction.after.scrollLeft, expected.scrollLefts[index]);
      assert.equal(
        interaction.after.scrollLeft > interaction.before.scrollLeft,
        actual.geometry.wrappers[index].scrollWidth > actual.geometry.wrappers[index].clientWidth,
      );
    }
    assert.equal(actual.geometry.svg.loaded, true);
    assert.deepEqual(
      [actual.geometry.svg.naturalWidth, actual.geometry.svg.naturalHeight],
      [92, 150],
    );
    assert.deepEqual(
      [actual.geometry.svg.renderedWidth, actual.geometry.svg.renderedHeight],
      [800, 1300],
    );
    assert.equal(actual.geometry.sources.length, 5);
    assert.ok(new Set(actual.geometry.sources.map(({href}) => new URL(href).hostname)).size >= 4);
    for (const source of actual.geometry.sources) {
      assert.equal(source.target, '_blank');
      assert.equal(source.rel, 'noopener noreferrer');
    }
    assert.equal(actual.geometry.sty07, 0);
    assert.deepEqual(actual.relations.map(({href, expectedH1}) => [href, expectedH1]), RELATIONS);
    assert.equal(new Set(actual.relations.map(({href}) => href)).size, RELATIONS.length);
    for (const relation of actual.relations) {
      assert.equal(relation.h1, RELATIONS.find(([href]) => href === relation.href)?.[1]);
      assert.equal(relation.returnedToArticle, true);
    }
    assert.deepEqual(actual.logs, []);
    assert.deepEqual(actual.diagnostics.events, []);
    assert.equal(actual.diagnostics.hasMore, false);
    assert.equal(actual.diagnostics.truncated, false);
  }
}

function assertProductionBrowserEvidence(evidence) {
  assert.equal(evidence.implementationHead, '56773ffad24427b33444fb4e5d86aa524fea1577');
  assert.deepEqual(evidence.pages, {
    runId: 31668483971,
    buildJobId: 94348112279,
    deployJobId: 94348514127,
    status: 'completed',
    conclusion: 'success',
  });
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: evidence.screenshotEvidence.reason,
  });
  assert.ok(evidence.screenshotEvidence.reason.trim().length > 0);
  assert.doesNotMatch(evidence.screenshotEvidence.reason, /\bPASS\b/iu);
  assertRawBrowserEvidence({
    candidateHead: REVIEWED_HEAD,
    states: evidence.states,
    screenshotEvidence: evidence.screenshotEvidence,
  });
}

function assertProductionDeployment(source, evidence = productionBrowser, evidenceBytes = productionBrowserBytes) {
  assertProductionBrowserEvidence(evidence);
  const deployment = section(source, 'Stage A production deployment');
  const literals = [
    'Implementation head: `56773ffad24427b33444fb4e5d86aa524fea1577`.',
    'Pages run: `31668483971`; build job: `94348112279`; deploy job: `94348514127`; all `completed / success`.',
    'HTTP probes: `9/9` returned `200` with expected content types.',
    'Production Browser states: `4/4`; wrapper interactions: `12/12`; relation destination/H1/return checks: `16/16`.',
    'Remote source anchors: `5` per state across at least `4` domains; STY-07 actionable count: `0` per state.',
    'Diagnostics: warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, `truncated=false` in every state.',
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; no production visual PASS is claimed.',
    'Deployment status: `SUCCESS / PASS`.',
  ];
  for (const literal of literals) assert.ok(deployment.includes(literal), `production literal: ${literal}`);
  assert.match(deployment, /Live SVG: `28,517` bytes; SHA-256 `72d99df5265620262517c218eb83555b6004de77432630e87eaa8a55cbc6388b`; exact reviewed-asset match\./u);
  assert.ok(deployment.includes(`Raw production Browser JSON: \`${PRODUCTION_BROWSER}\`, SHA-256 \`${sha256(evidenceBytes)}\`.`));
}

function assertBrowserEvidence(source, evidence = rawBrowser, evidenceBytes = rawBrowserBytes) {
  assertRawBrowserEvidence(evidence);
  const browser = section(source, 'Local in-app Browser QA');
  for (const state of STATES) {
    assert.ok(browser.includes(`| \`${state}\` |`), `${state} evidence row`);
  }
  for (const literal of [
    'States accepted: `4/4`.',
    'Wrapper interaction checks: `12/12`.',
    'Relation destination/H1/return checks: `16/16`.',
    'Remote source anchors: `5` per state; unique remote domains: at least `4` per state.',
    'STY-07 actionable count: `0` in every state.',
    'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.',
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.',
  ]) assert.ok(browser.includes(literal), `Browser literal: ${literal}`);
  assert.ok(browser.includes(`Raw Browser JSON: \`${RAW_BROWSER}\`, SHA-256 \`${sha256(evidenceBytes)}\`.`));
}

function assertFinalReview(source) {
  const checkpoint = section(source, 'Independent review checkpoint');
  assert.ok(checkpoint.includes(`Exact reviewed head: \`${REVIEWED_HEAD}\`.`));
  for (const literal of [
    `Exact evidence/remediation head: \`${EVIDENCE_HEAD}\`.`,
    'Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.',
    'Independent content, evidence, and rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`.',
    'Independent architecture reviewer (`architect`): `CLEAR / READY`; blockers: `0`.',
    'Final Stage A review judgment: `READY`.',
    'Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.',
    'Deployment status: `NOT_RUN`.',
  ]) assert.ok(checkpoint.includes(literal), `review literal: ${literal}`);
  assert.doesNotMatch(checkpoint, /`PENDING`|`NOT_RUN` findings/u);
}

async function assertArtifactIdentities(source) {
  const identities = section(source, 'Artifact identities');
  for (const row of [
    '| `content/styles/sty-06-event-driven-architecture.mdx` | 22,808 | `ebae2fcdb42bf59b57f9ee27c9b013c8fa99cab3bb7bea68a075feabf438ff7f` |',
    '| `diagrams/sty-06-event-driven-four-patterns.drawio` | 42,873 | `b6b704da9045795aa7dab7c8b8b0bd1a54a26ee02e11c347284ef8a7ad037d90` |',
    '| `static/img/diagrams/sty-06-event-driven-four-patterns.svg` | 28,517 | `72d99df5265620262517c218eb83555b6004de77432630e87eaa8a55cbc6388b` |',
    '| `data/source-ledger.json` | 1,530,168 | `d190f155af33d18e40a106cc08ade2adde71e3928e9b4d12b823940a85a7c96c` |',
  ]) assert.ok(identities.includes(row), row);
}

test('preserves the exact STY-06 closure under the current STY-10 next-topic projection', () => {
  assertProjection();
  assert.equal(manifest.topics.filter(({published}) => published).some(({slug}) => slug === '/styles/sty-07'), true);
});

test('binds exact artifacts, four local Browser states, and final independent verdicts', async () => {
  assert.match(review, /^# G009 Batch 7 Stage A Review$/mu);
  assert.match(section(review, 'Stage A projection'), /58 completed topics \/ 101 content documents \/ 525 governed sources/u);
  assert.match(section(review, 'Stage A projection'), /STY-06: `published \/ pending`/u);
  assert.match(section(review, 'Stage A projection'), /STY-07: `unpublished \/ pending`; actionable route count: `0`/u);
  await assertArtifactIdentities(review);
  assertBrowserEvidence(review);
  assertFinalReview(review);
});

test('rejects weakened or fabricated Stage A evidence', async () => {
  await assertArtifactIdentities(review);
  assertBrowserEvidence(review);
  assertFinalReview(review);
  const mutations = [
    ['wrong count', '58 completed topics / 101 content documents / 525 governed sources', '58 completed topics / 100 content documents / 525 governed sources'],
    ['wrong artifact hash', '72d99df5265620262517c218eb83555b6004de77432630e87eaa8a55cbc6388b', '0'.repeat(64)],
    ['missing Browser state', '| `mobileDark` |', '| `mobileMissing` |'],
    ['truncated diagnostics', 'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=false`.', 'Every state recorded warning/error logs `0`, `Runtime.exceptionThrown=0`, `Log.entryAdded=0`, `hasMore=false`, and `truncated=true`.'],
    ['wrong reviewed head', `Exact reviewed head: \`${REVIEWED_HEAD}\`.`, `Exact reviewed head: \`${'0'.repeat(40)}\`.`],
    ['fabricated STY-07 absence', 'STY-07 actionable count: `0` in every state.', 'STY-07 actionable count: `1` in every state.'],
    ['fabricated screenshot success', 'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Visual inspection: diagram `PASS` in light and dark themes.'],
    ['wrong evidence head', `Exact evidence/remediation head: \`${EVIDENCE_HEAD}\`.`, `Exact evidence/remediation head: \`${'0'.repeat(40)}\`.`],
    ['weakened code verdict', '`READY / APPROVE`; findings: `0`.', '`READY / APPROVE`; findings: `1`.'],
    ['weakened content verdict', '`CONTENT READY`; rights: `PASS`; findings: `0`.', '`CONTENT READY`; rights: `PENDING`; findings: `0`.'],
    ['weakened architecture verdict', '`CLEAR / READY`; blockers: `0`.', '`CLEAR / READY`; blockers: `1`.'],
    ['stale final verdict', 'Final Stage A review judgment: `READY`.', 'Final Stage A review judgment: `PENDING`.'],
    ['fabricated deployment', 'Deployment status: `NOT_RUN`.', 'Deployment status: `SUCCESS`.'],
  ];
  for (const [label, before, after] of mutations) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    await assert.rejects(async () => {
      assert.match(section(mutated, 'Stage A projection'), /58 completed topics \/ 101 content documents \/ 525 governed sources/u);
      await assertArtifactIdentities(mutated);
      assertBrowserEvidence(mutated);
      assertFinalReview(mutated);
      assert.doesNotMatch(mutated, /Visual inspection: diagram `PASS`/u);
    }, {name: 'AssertionError'}, label);
  }
});

test('rejects raw Browser count, return, load, diagnostic, and head mutations', () => {
  assertRawBrowserEvidence(rawBrowser);
  const mutations = [
    ['wrong head', (copy) => copy.candidateHead = '0'.repeat(40)],
    ['missing interaction', (copy) => copy.states.desktopDark.interactions.pop()],
    ['missing relation', (copy) => copy.states.mobileLight.relations.pop()],
    ['missing return', (copy) => copy.states.mobileDark.relations[0].returnedToArticle = false],
    ['wrong viewport', (copy) => copy.states.desktopDark.geometry.page.clientWidth = 390],
    ['duplicate wrapper', (copy) => copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0])],
    ['swapped wrappers', (copy) => copy.states.mobileLight.geometry.wrappers.reverse()],
    ['swapped interactions', (copy) => copy.states.desktopLight.interactions.reverse()],
    ['fabricated relation', (copy) => {
      copy.states.desktopDark.relations[0].href = '/tego-arch/styles/sty-99';
      copy.states.desktopDark.relations[0].h1 = '自洽但未经验证的标题';
      copy.states.desktopDark.relations[0].expectedH1 = '自洽但未经验证的标题';
    }],
    ['fabricated screenshot pass', (copy) => copy.screenshotEvidence.status = 'PASS'],
    ['missing screenshot reason', (copy) => copy.screenshotEvidence.reason = ''],
    ['unloaded SVG', (copy) => copy.states.mobileLight.geometry.svg.loaded = false],
    ['truncated diagnostics', (copy) => copy.states.desktopLight.diagnostics.truncated = true],
    ['fabricated STY-07 absence', (copy) => copy.states.desktopLight.geometry.sty07 = 1],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(rawBrowser);
    mutate(copy);
    assert.throws(() => assertRawBrowserEvidence(copy), {name: 'AssertionError'}, label);
  }
  assert.notEqual(sha256(Buffer.from(`${rawBrowserBytes} `)), sha256(rawBrowserBytes));
});

test('binds exact STY-06 Stage A production evidence', () => {
  assertProductionDeployment(review);
});

test('rejects weakened or fabricated STY-06 production evidence', () => {
  assertProductionDeployment(review);
  const evidenceMutations = [
    ['wrong implementation head', (copy) => copy.implementationHead = '0'.repeat(40)],
    ['wrong run', (copy) => copy.pages.runId = 1],
    ['wrong build job', (copy) => copy.pages.buildJobId = 1],
    ['wrong deploy job', (copy) => copy.pages.deployJobId = 1],
    ['failed conclusion', (copy) => copy.pages.conclusion = 'failure'],
    ['missing state', (copy) => delete copy.states.mobileDark],
    ['missing relation return', (copy) => copy.states.mobileLight.relations[0].returnedToArticle = false],
    ['altered source rel', (copy) => copy.states.desktopDark.geometry.sources[0].rel = 'noopener'],
    ['truncated diagnostics', (copy) => copy.states.mobileDark.diagnostics.truncated = true],
    ['fabricated screenshot pass', (copy) => copy.screenshotEvidence.status = 'PASS'],
  ];
  for (const [label, mutate] of evidenceMutations) {
    const copy = structuredClone(productionBrowser);
    mutate(copy);
    assert.throws(() => assertProductionBrowserEvidence(copy), {name: 'AssertionError'}, label);
  }
  for (const [label, before, after] of [
    ['wrong HTTP total', 'HTTP probes: `9/9`', 'HTTP probes: `8/9`'],
    ['wrong SVG hash', 'Live SVG: `28,517` bytes; SHA-256 `72d99df5265620262517c218eb83555b6004de77432630e87eaa8a55cbc6388b`', 'Live SVG: `28,517` bytes; SHA-256 `0000000000000000000000000000000000000000000000000000000000000000`'],
    ['fabricated production visual pass', 'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; no production visual PASS is claimed.', 'Screenshot evidence: `PASS`.'],
    ['weakened deployment', 'Deployment status: `SUCCESS / PASS`.', 'Deployment status: `PENDING`.'],
  ]) {
    const mutated = review.replace(before, after);
    assert.notEqual(mutated, review, `${label} mutation applies`);
    assert.throws(() => assertProductionDeployment(mutated), {name: 'AssertionError'}, label);
  }
});

test('preserves STY-06 Stage B history under the current STY-10 next-topic projection', () => {
  assert.deepEqual({
    completed_topics: status.completed_topics,
    content_documents: status.content_documents,
    governed_sources: status.governed_sources,
  }, {completed_topics: 63, content_documents: 107, governed_sources: 560});

  const sty06 = manifest.topics.find(({id}) => id === 'STY-06');
  const sty07 = manifest.topics.find(({id}) => id === 'STY-07');
  assert.deepEqual([sty06?.published, sty06?.status.value], [true, 'complete']);
  assert.deepEqual([sty07?.published, sty07?.status.value], [true, 'complete']);
  const currentBaseline = backlog.split(/\r?\n/u).find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  const batch7Marker = '此前 G009 Batch 7 历史完成基线为：';
  const batch7Start = currentBaseline.indexOf(batch7Marker);
  assert.notEqual(batch7Start, -1, 'immutable STY-06 history marker');
  const batch7History = currentBaseline.slice(batch7Start + batch7Marker.length);
  for (const literal of [
    '2026-08-13 G009 Batch 7 已完成 STY-06',
    '59 个已完成主题、101 篇内容文档与 525 个受治理来源',
    '当前 G009，下一项为 STY-07',
    'STY-06 为 published/complete',
    'STY-07 为 unpublished/pending',
  ]) assert.ok(batch7History.includes(literal), `immutable Stage B history literal: ${literal}`);
  const immediateMarker = '此前 G009 Batch 6 历史完成基线为：';
  const historyStart = currentBaseline.indexOf(immediateMarker);
  assert.notEqual(historyStart, -1, 'immediate STY-05 history marker');
  assert.equal(sha256(currentBaseline.slice(historyStart + immediateMarker.length)), IMMEDIATE_STY05_HISTORY_HASH);
  assert.equal(sha256(immediateSty05ReviewBytes), IMMEDIATE_STY05_REVIEW_HASH);
  const sty06Lines = backlog.split(/\r?\n/u).filter((line) => /^- \[[ x]\] \*\*STY-06 /u.test(line));
  assert.equal(sty06Lines.length, 1);
  for (const literal of ['- [x] **STY-06 ', '2026-08-13', '56773ffad24427b33444fb4e5d86aa524fea1577', '31668483971', '/styles/sty-06', '/img/diagrams/sty-06-event-driven-four-patterns.svg', 'Stage A production verdict PASS']) {
    assert.ok(sty06Lines[0].includes(literal), `STY-06 closure literal: ${literal}`);
  }
  assert.match(backlog, /^- \[x\] \*\*STY-07 /mu);
  assert.doesNotMatch(backlog, /\]\(\/styles\/sty-07\)/u);
  const closure = section(review, 'Stage B closure candidate');
  assert.match(closure, /59 completed topics \/ 101 content documents \/ 525 governed sources/u);
  assert.match(closure, /STY-06 target: `published \/ complete`; STY-07 target: `unpublished \/ pending`, actionable count `0`/u);
  assert.match(closure, new RegExp(`Exact Stage B reviewed head: \`${STAGE_B_REVIEWED_HEAD}\``, 'u'));
  assert.match(closure, /Independent Stage B code reviewer: `READY \/ APPROVE`; findings: `0`/u);
  assert.match(closure, /Independent Stage B content\/rights reviewer: `CONTENT READY`; rights: `PASS`; findings: `0`/u);
  assert.match(closure, /Independent Stage B architecture reviewer: `CLEAR \/ READY`; blockers: `0`/u);
  assert.match(closure, /Final Stage B review judgment: `READY`/u);
  assert.match(closure, /Stage B deployment status: `PENDING`/u);
});

test('rejects immediate-history drift and fabricated Stage B readiness or deployment', () => {
  assert.notEqual(sha256(Buffer.concat([immediateSty05ReviewBytes, Buffer.from(' ')])), IMMEDIATE_STY05_REVIEW_HASH);
  const mutations = [
    ['history drift', backlog, backlog.replace('build job `93777183963`', 'build job `0`')],
    ['wrong projection', review, review.replace('59 completed topics / 101 content documents / 525 governed sources', '58 completed topics / 101 content documents / 525 governed sources')],
    ['weakened review', review, review.replace('Final Stage B review judgment: `READY`.', 'Final Stage B review judgment: `PENDING`.')],
    ['fabricated deployment', review, review.replace('Stage B deployment status: `PENDING`.', 'Stage B deployment status: `SUCCESS`.')],
  ];
  for (const [label, original, mutated] of mutations) {
    assert.notEqual(mutated, original, `${label} mutation applies`);
    if (label === 'history drift') {
      const line = mutated.split(/\r?\n/u).find((entry) => entry.startsWith('- **当前发布基线：**'));
      const marker = '此前 G009 Batch 6 历史完成基线为：';
      assert.notEqual(sha256(line.slice(line.indexOf(marker) + marker.length)), IMMEDIATE_STY05_HISTORY_HASH);
    } else {
      const closure = section(mutated, 'Stage B closure candidate');
      assert.throws(() => {
        assert.match(closure, /59 completed topics \/ 101 content documents \/ 525 governed sources/u);
        assert.match(closure, /Final Stage B review judgment: `READY`/u);
        assert.match(closure, /Stage B deployment status: `PENDING`/u);
      }, {name: 'AssertionError'}, label);
    }
  }
});

function assertStageBProductionEvidence(evidence = stageBProductionBrowser, bytes = stageBProductionBrowserBytes, source = review) {
  assert.equal(evidence.implementationHead, '6d254d4689f0e7f41e3c0ed3973d0d9897887414');
  assert.deepEqual(evidence.pages, {runId: 31673329108, buildJobId: 94362435390, deployJobId: 94362837626, status: 'completed', conclusion: 'success'});
  assert.deepEqual(evidence.http, {passed: 9, total: 9, status: 200});
  assert.deepEqual(Object.keys(evidence.states), STATES);
  for (const [name, expected] of Object.entries({desktopLight:[[1440,1000],[1440,1440],[[800,800],[800,1118],[800,1342]],[0,40,40]],desktopDark:[[1440,1000],[1440,1440],[[800,800],[800,1118],[800,1342]],[0,40,40]],mobileLight:[[390,844],[390,390],[[358,800],[358,1118],[358,1342]],[40,40,40]],mobileDark:[[390,844],[390,390],[[358,800],[358,1118],[358,1342]],[40,40,40]]})) {
    const state = evidence.states[name];
    assert.deepEqual(state.viewport, expected[0]);
    assert.deepEqual(state.page, expected[1]);
    assert.deepEqual(state.wrappers, expected[2]);
    assert.deepEqual(state.arrowRight, expected[3]);
    assert.equal(state.focusChecks, 3);
    assert.equal(state.relations, 4);
    assert.equal(state.sources, 5);
    assert.equal(state.sourceDomains, 4);
    assert.equal(state.sty07, 0);
    assert.deepEqual(state.svg, [true,92,150,800,1300]);
    assert.deepEqual(state.diagnostics, [0,0,false,false]);
  }
  assert.deepEqual(evidence.relationMap, RELATIONS);
  assert.deepEqual(evidence.sourceContract, {target:'_blank', rel:'noopener noreferrer', checks:20});
  assert.equal(evidence.screenshotEvidence.status, 'BLOCKED / NOT_ACCEPTED');
  assert.doesNotMatch(evidence.screenshotEvidence.reason, /visual PASS/iu);
  const deployment = section(source, 'Stage B production deployment');
  for (const literal of ['Exact deployed head: `6d254d4689f0e7f41e3c0ed3973d0d9897887414`.','Pages run: `31673329108`; build job: `94362435390`; deploy job: `94362837626`; all `completed / success`.','HTTP probes: `9/9` returned `200`','Production Browser states: `4/4`','checks: `12/12`','checks: `16/16`','Remote source checks: `20/20`','STY-07 actionable count: `0`','Screenshot evidence: `BLOCKED / NOT_ACCEPTED`','Functional Stage B deployment status: `SUCCESS / PASS`']) assert.ok(deployment.includes(literal), literal);
  assert.ok(deployment.includes(`Raw production Browser JSON: \`${STAGE_B_PRODUCTION_BROWSER}\`, SHA-256 \`${sha256(bytes)}\`.`));
}

test('binds exact STY-06 Stage B production identity and functional evidence', () => assertStageBProductionEvidence());

test('rejects mutated Stage B production identity, geometry, links, diagnostics, or screenshot overclaim', () => {
  const mutations = [
    ['head', c=>c.implementationHead='0'.repeat(40)], ['run', c=>c.pages.runId=1], ['state', c=>delete c.states.mobileDark],
    ['viewport', c=>c.states.desktopDark.viewport=[390,844]], ['wrapper', c=>c.states.mobileLight.wrappers[0]=[358,358]],
    ['focus', c=>c.states.desktopLight.focusChecks=2], ['relation', c=>c.relationMap[0][0]='/tego-arch/fabricated'],
    ['source', c=>c.sourceContract.checks=19], ['sty07', c=>c.states.mobileDark.sty07=1], ['svg', c=>c.states.mobileLight.svg[0]=false],
    ['diagnostic', c=>c.states.desktopLight.diagnostics[3]=true], ['screenshot', c=>c.screenshotEvidence.status='PASS']
  ];
  for (const [label, mutate] of mutations) { const copy=structuredClone(stageBProductionBrowser); mutate(copy); assert.throws(()=>assertStageBProductionEvidence(copy), {name:'AssertionError'}, label); }
  assert.notEqual(sha256(Buffer.concat([stageBProductionBrowserBytes,Buffer.from(' ')])), sha256(stageBProductionBrowserBytes));
});
