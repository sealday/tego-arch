import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const REVIEW = 'docs/reviews/g009-batch9.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch9-integration-browser.json';
const IMPLEMENTATION_HEAD = 'c1aebf57c638d30efe987d1c29e578f502bafb46';
const EVIDENCE_HEAD = '1b002b8fa0f2c58019fc05e6e93efbae0bd23570';
const REVIEWED_INTEGRATION_HEAD = '2b47267977fedfba933d2d01198a476254a670fc';
const REMEDIATION_HEADS = Object.freeze([
  '21bc9650236059afb0d0c94066394664a162e826',
  '18978171ea236bbaa076b722e662ea51650ee317',
  REVIEWED_INTEGRATION_HEAD,
]);
const RAW_BROWSER_SHA256 = '14a206017541f2c7f6f09b28a3e2ab34ce0e5c1b01973777b0b4759d9a576733';
const MERGE_PARENTS = [
  'd83ac7d119f63745f8abb62a7a3fd029c1b32e8a',
  '00da8b412394e89bf823c7899816026b78c71b74',
];
const MTH07_PRODUCTION = Object.freeze({
  implementation: 'a413be060c93f7ddd20e7db5417e94f4166dc1e8',
  pagesRun: '31786075868',
  buildJob: '94722157542',
  deployJob: '94722766883',
});
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
  loaded: true,
  naturalHeight: 150,
  naturalWidth: 48,
  renderedHeight: 2480,
  renderedWidth: 800,
  src: '/tego-arch/assets/images/sty-08-actor-order-fulfillment-fa568ecfe3b507ce8ca88416844f5b3d.svg',
});
const SCREENSHOT_REASON = 'The in-app Browser full-page capture repeated the opening viewport instead of covering the complete page and architecture diagram, so it cannot support trustworthy whole-page visual review.';
const SCREENSHOT_ATTEMPTS = Object.freeze([
  Object.freeze({ordinal: 1, state: 'desktopLight', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-integration-c1aebf5-desktop-light.jpg', bytes: 1778121, sha256: 'baa706e8c005101211ea0f46b5af86bad5a1da1bdbc3ec6845cf60bf34c6dab2'}),
  Object.freeze({ordinal: 2, state: 'desktopDark', viewport: {width: 1440, height: 1000}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-integration-c1aebf5-desktop-dark.jpg', bytes: 1791254, sha256: '95889769eeea867285baaae655d300b0c0bcd1dc61ccab0dbbe23b43b46f9f51'}),
  Object.freeze({ordinal: 3, state: 'mobileLight', viewport: {width: 390, height: 844}, kind: 'fullPage', status: 'CAPTURED_REJECTED', reason: SCREENSHOT_REASON, path: '/Users/seal/projects/tego-arch/.worktrees/g009-styles-batch7/.superpowers/sdd/sty08-integration-c1aebf5-mobile-light.jpg', bytes: 838206, sha256: 'c8f6898b8bab04415a0c4e6ae587690bbe5acbba5954545e4848a541492c943f'}),
]);
const REVIEW_H2 = [
  'Stage A projection',
  'Artifact identities',
  'Local in-app Browser QA',
  'Independent review checkpoint',
  'Integration candidate after origin/main divergence',
  'Stage B closure candidate',
];
const REVIEW_H3 = [
  'Historical heads and review boundary',
  'Exact integration identities',
  'Combined canonical projection and semantics',
  'Integration in-app Browser QA',
  'Integration review checkpoint',
];
const EXPECTED_REVIEW = Object.freeze({
  h2: REVIEW_H2,
  integration: Object.freeze({
    heading: 'Integration candidate after origin/main divergence',
    intro: 'This section records the non-destructive integration of the original STY-08 Stage A line with the MTH-07 line already present on `origin/main`. It does not rewrite or widen the scope of the historical Stage A approval above.',
    fields: Object.freeze({
      'Historical heads and review boundary': [
        '- Original STY-08 implementation candidate: `bbb2f4234c4c24993dbea108d2a19a751e778409`.',
        '- Original STY-08 evidence head: `4923b7da22d79ecc32400669526196ca852885a4`.',
        `- Original STY-08 final evidence-binding head: \`${MERGE_PARENTS[0]}\`.`,
        '- The three independent approvals in `Independent review checkpoint` apply only to the original implementation/evidence bundle named there. They do not review or approve the integration bundle below.',
        `- MTH-07's existing published production record remains historical evidence: implementation \`${MTH07_PRODUCTION.implementation}\`. Exact Pages run: \`${MTH07_PRODUCTION.pagesRun}\`; build job: \`${MTH07_PRODUCTION.buildJob}\`; deploy job: \`${MTH07_PRODUCTION.deployJob}\`; every status: \`completed / success\`. This integration neither weakens nor re-labels that production record.`,
      ],
      'Exact integration identities': [
        `- Integration implementation candidate: \`${IMPLEMENTATION_HEAD}\`.`,
        `- Merge parents: \`${MERGE_PARENTS[0]}\` and \`${MERGE_PARENTS[1]}\`.`,
        `- Integration evidence head: \`${EVIDENCE_HEAD}\`.`,
        `- Integration Browser raw: \`${RAW_BROWSER}\`, SHA-256 \`${RAW_BROWSER_SHA256}\`.`,
      ],
      'Combined canonical projection and semantics': [
        '- Projection: `60 completed topics / 104 content documents / 539 governed sources`.',
        '- STY-08 remains `published / pending`.',
        '- STY-09 remains `unpublished / pending / non-actionable`; actionable route count: `0`.',
        '- MTH-07 remains `published / reviewed` and retains its content, diagram, sources, review, evidence, tests, and production provenance.',
        "- Canonical ledgers were joined by stable record identity before regenerating derived content; neither branch's ledger or generated fixture was accepted as a whole-file replacement.",
      ],
      'Integration in-app Browser QA': [
        '- The exact integration implementation candidate was built and served locally before fresh collection using only the Codex in-app Browser.',
        '- States accepted: `4/4`; wrapper focus checks: `12/12`; ArrowRight checks: `12/12`; relation destination/H1/return checks: `16/16`; exact remote href/target/rel checks: `24/24`.',
        '- STY-09 actionable link count: `0` in every state. Warning/error logs: `0`; diagnostic events: `0`; every diagnostic page reported `hasMore=false` and `truncated=false`.',
        '- Integration screenshot evidence: `BLOCKED / NOT_ACCEPTED`. Exactly three fresh IAB full-page captures repeated the opening viewport rather than the complete page and architecture diagram. No visual PASS is claimed.',
      ],
      'Integration review checkpoint': [
        `- Exact reviewed integration head: \`${REVIEWED_INTEGRATION_HEAD}\`.`,
        `- Integration lineage: implementation \`${IMPLEMENTATION_HEAD}\`; evidence \`${EVIDENCE_HEAD}\`; binding/remediation \`${REMEDIATION_HEADS[0]}\` → \`${REMEDIATION_HEADS[1]}\` → \`${REMEDIATION_HEADS[2]}\`.`,
        `- Integration review head coverage: all three reviews examined exactly \`${REVIEWED_INTEGRATION_HEAD}\`; no verdict covers a later binding commit.`,
        '- Independent code/spec/security review for the integration bundle: `READY / APPROVE`; findings: `0`.',
        '- Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PASS`; findings: `0`.',
        '- Independent architecture/invariant review for the integration bundle: `CLEAR / READY`; blockers: `0`.',
        '- Final integration readiness: `READY`.',
        '- Integration scope boundary: `INTEGRATION_ONLY`; no Stage B backlog mutation is authorized or performed.',
        '- Integration deployment status: `NOT_RUN`.',
      ],
    }),
  }),
});

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const [status, manifest, indexes, publicLedger, review, rawBrowserBytes] = await Promise.all([
  readFile(new URL('src/generated/project-status.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('src/generated/topic-manifest.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('src/generated/topic-indexes.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/source-ledger.json', root), 'utf8').then(JSON.parse),
  readFile(new URL(REVIEW, root), 'utf8'),
  readFile(new URL(RAW_BROWSER, root)),
]);

function assertKeys(value, expected, label) {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} closed keys`);
}

function assertCombinedProjection(statusValue = status, manifestValue = manifest, indexesValue = indexes, ledgerValue = publicLedger) {
  assert.deepEqual(
    {completed: statusValue.completed_topics, documents: statusValue.content_documents, sources: statusValue.governed_sources},
    {completed: 83, documents: 126, sources: 599},
  );
  assert.equal(ledgerValue.sources.length, 599);

  const topics = new Map(manifestValue.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexesValue.style.map((topic) => [topic.id, topic]));
  const methods = new Map(indexesValue.method.map((topic) => [topic.id, topic]));
  assert.deepEqual([topics.get('STY-08')?.published, topics.get('STY-08')?.status, styles.get('STY-08')?.published], [true, {scope: 'backlog-projection', value: 'complete', source: 'docs/content-backlog.md'}, true]);
  assert.deepEqual([topics.get('STY-09')?.published, topics.get('STY-09')?.status, styles.get('STY-09')?.published], [true, {scope: 'backlog-projection', value: 'complete', source: 'docs/content-backlog.md'}, true]);
  assert.deepEqual([topics.get('STY-10')?.published, topics.get('STY-10')?.status, styles.get('STY-10')?.published], [true, {scope: 'backlog-projection', value: 'complete', source: 'docs/content-backlog.md'}, true]);
  assert.deepEqual([topics.get('STY-11')?.published, topics.get('STY-11')?.status, styles.get('STY-11')?.published], [true, {scope: 'backlog-projection', value: 'complete', source: 'docs/content-backlog.md'}, true]);
  assert.deepEqual([topics.get('STY-12')?.published, topics.get('STY-12')?.status, styles.get('STY-12')?.published], [true, {scope: 'backlog-projection', value: 'complete', source: 'docs/content-backlog.md'}, true]);
  assert.deepEqual([topics.get('STY-13')?.published, topics.get('STY-13')?.status, styles.get('STY-13')?.published], [true, {scope: 'backlog-projection', value: 'complete', source: 'docs/content-backlog.md'}, true]);
  assert.deepEqual([topics.get('STY-14')?.published, topics.get('STY-14')?.status, styles.get('STY-14')?.published], [false, {scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}, false]);
  assert.deepEqual([topics.get('MTH-07')?.published, topics.get('MTH-07')?.status, methods.get('MTH-07')?.published], [true, {scope: 'content-lifecycle', value: 'reviewed', source: 'content/methods/mth-07-fde-enterprise-ai-delivery.mdx'}, true]);
}

function assertBrowserEvidence(evidence) {
  assertKeys(evidence, ['candidateHead', 'collection', 'states', 'screenshotEvidence'], 'raw');
  assert.equal(evidence.candidateHead, IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'http://127.0.0.1:3418/tego-arch/styles/sty-08',
    build: 'npm run build from exact candidate head; npm run serve -- --host 127.0.0.1 --port 3418',
  });
  assert.deepEqual(Object.keys(evidence.states), STATES, 'exact state order');
  for (const [stateName, expected] of Object.entries(STATE_CONTRACTS)) {
    const state = evidence.states[stateName];
    assertKeys(state, ['theme', 'viewport', 'geometry', 'interactions', 'relations', 'logs', 'diagnostics'], stateName);
    assert.equal(state.theme, expected.theme);
    assert.deepEqual(state.viewport, {width: expected.width, height: expected.height});
    assertKeys(state.geometry, ['page', 'wrappers', 'svg', 'sources', 'sty09'], `${stateName}.geometry`);
    assert.deepEqual(state.geometry.page, {clientWidth: expected.width, scrollWidth: expected.width});
    assert.deepEqual(state.geometry.wrappers, WRAPPERS.map((label, index) => ({clientWidth: expected.clients[index], label, scrollWidth: expected.scrolls[index]})));
    assert.deepEqual(state.geometry.svg, SVG_GEOMETRY);
    assert.deepEqual(state.geometry.sources, SOURCE_LINKS.map((href) => ({href, rel: 'noopener noreferrer', target: '_blank'})));
    assert.equal(state.geometry.sty09, 0);
    assert.deepEqual(state.interactions, WRAPPERS.map((label, index) => ({
      index,
      label,
      key: 'ArrowRight',
      expectedScrollDelta: expected.deltas[index],
      before: {focus: true, focusVisible: true, outline: expected.outlines[index], scrollLeft: 0},
      after: {focus: true, focusVisible: true, outline: expected.outlines[index], scrollLeft: expected.deltas[index]},
    })));
    assert.deepEqual(state.relations, RELATIONS.map(([href, expectedH1]) => ({
      href,
      expectedH1,
      h1: expectedH1,
      returnedToArticle: true,
      navigation: 'direct exact-href navigation; no physical relation click claimed',
    })));
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {events: [], hasMore: false, truncated: false});
  }
  assert.deepEqual(evidence.screenshotEvidence, {
    status: 'BLOCKED / NOT_ACCEPTED',
    reason: 'Exactly three fresh in-app Browser full-page captures repeated the opening viewport instead of covering the complete page and architecture diagram; no visual PASS is claimed.',
    attempts: SCREENSHOT_ATTEMPTS,
  });
}

function parseIntegrationReview(source) {
  const h2 = [...source.matchAll(/^## ([^\n]+)$/gmu)];
  assert.deepEqual(h2.map((match) => match[1]), REVIEW_H2, 'exact H2 order and uniqueness');
  const integration = h2.filter((match) => match[1] === 'Integration candidate after origin/main divergence');
  assert.equal(integration.length, 1, 'one integration section');
  const start = integration[0].index + integration[0][0].length;
  const next = h2.find((match) => match.index > integration[0].index);
  const end = next?.index ?? source.length;
  const body = source.slice(start, end).trim();
  for (const label of [
    'Exact reviewed integration head',
    'Integration lineage',
    'Integration review head coverage',
    'Independent code/spec/security review for the integration bundle',
    'Independent content/evidence/rights review for the integration bundle',
    'Independent architecture/invariant review for the integration bundle',
    'Final integration readiness',
    'Integration scope boundary',
    'Integration deployment status',
    'Integration screenshot evidence',
  ]) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const claims = [...source.matchAll(new RegExp(`${escaped}:[^\\n]*`, 'gu'))];
    assert.equal(claims.length, 1, `${label} declared exactly once globally`);
    assert.ok(claims[0].index >= start && claims[0].index < end, `${label} belongs to the integration section`);
  }
  assert.doesNotMatch(source, /Final integration readiness:\s*`?PENDING`?/u);
  assert.doesNotMatch(source, /Integration deployment status:\s*`?SUCCESS`?/u);
  assert.doesNotMatch(source, /Integration screenshot evidence:\s*`?PASS`?/u);
  const h3 = [...body.matchAll(/^### ([^\n]+)$/gmu)];
  assert.deepEqual(h3.map((match) => match[1]), REVIEW_H3, 'exact integration field headings');
  const fields = {};
  for (const [index, match] of h3.entries()) {
    const fieldStart = match.index + match[0].length;
    const fieldEnd = h3[index + 1]?.index ?? body.length;
    const lines = body.slice(fieldStart, fieldEnd).trim().split(/\r?\n/u).filter(Boolean);
    assert.ok(lines.every((line) => line.startsWith('- ')), `${match[1]} contains only closed fields`);
    fields[match[1]] = lines;
  }
  return {
    h2: h2.map((match) => match[1]),
    integration: {
      heading: integration[0][1],
      intro: body.slice(0, h3[0].index).trim(),
      fields,
    },
  };
}

function assertIntegrationReview(source) {
  assert.deepEqual(parseIntegrationReview(source), EXPECTED_REVIEW);
}

function assertRejectsEvidenceMutation(evidence, mutate) {
  const copy = structuredClone(evidence);
  mutate(copy);
  assert.throws(() => assertBrowserEvidence(copy), {name: 'AssertionError'});
}

function replaceRequired(source, before, after) {
  assert.ok(source.includes(before), `${before} mutation applies`);
  return source.replace(before, after);
}

test('preserves combined STY-08 and MTH-07 history under the current Stage B truth', () => {
  assertCombinedProjection();
});

test('binds exact closed integration Browser evidence and the unique final review section', () => {
  assert.equal(sha256(rawBrowserBytes), RAW_BROWSER_SHA256);
  assertBrowserEvidence(JSON.parse(rawBrowserBytes));
  assertIntegrationReview(review);
});

test('rejects combined projection and topic semantic mutations', () => {
  for (const mutate of [
    (copy) => { copy.completed_topics -= 1; },
    (copy) => { copy.content_documents -= 1; },
    (copy) => { copy.governed_sources -= 1; },
  ]) {
    const copy = structuredClone(status);
    mutate(copy);
    assert.throws(() => assertCombinedProjection(copy), {name: 'AssertionError'});
  }
  for (const [id, field, value] of [['STY-08', 'published', false], ['STY-12', 'published', false], ['MTH-07', 'published', false]]) {
    const copy = structuredClone(manifest);
    copy.topics.find((topic) => topic.id === id)[field] = value;
    assert.throws(() => assertCombinedProjection(status, copy), {name: 'AssertionError'});
  }
});

test('rejects exact-head, state, geometry, interaction, relation, source, SVG, and diagnostic mutations', () => {
  const evidence = JSON.parse(rawBrowserBytes);
  const mutations = [
    (copy) => { copy.candidateHead = '0'.repeat(40); },
    (copy) => { copy.visualInspection = 'PASS'; },
    (copy) => { copy.collection.visualInspection = 'PASS'; },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states = {desktopDark: copy.states.desktopDark, desktopLight: copy.states.desktopLight, mobileLight: copy.states.mobileLight, mobileDark: copy.states.mobileDark}; },
    (copy) => { copy.states.desktopLight.theme = 'dark'; },
    (copy) => { copy.states.mobileLight.viewport.width = 391; },
    (copy) => { copy.states.desktopLight.geometry.page.scrollWidth = 1441; },
    (copy) => { copy.states.desktopLight.geometry.wrappers[1] = structuredClone(copy.states.desktopLight.geometry.wrappers[0]); },
    (copy) => { copy.states.desktopLight.geometry.wrappers.reverse(); },
    (copy) => { [copy.states.desktopDark.interactions[0], copy.states.desktopDark.interactions[1]] = [copy.states.desktopDark.interactions[1], copy.states.desktopDark.interactions[0]]; },
    (copy) => { copy.states.mobileDark.interactions[0].expectedScrollDelta = 39; },
    (copy) => { copy.states.desktopDark.interactions[2].before.outline = 'none'; },
    (copy) => { copy.states.mobileLight.interactions[1].after.focusVisible = false; },
    (copy) => { copy.states.mobileLight.interactions[2].after.scrollLeft = 41; },
    (copy) => { copy.states.desktopLight.relations[0] = {...copy.states.desktopLight.relations[0], href: '/tego-arch/styles/sty-99', expectedH1: 'fabricated', h1: 'fabricated'}; },
    (copy) => { copy.states.desktopDark.relations.reverse(); },
    (copy) => { copy.states.desktopDark.geometry.sources[0].href = 'https://example.com/fabricated'; },
    (copy) => { copy.states.mobileDark.geometry.sources.reverse(); },
    (copy) => { copy.states.desktopLight.geometry.svg.src = '/fabricated.svg'; },
    (copy) => { copy.states.desktopLight.geometry.svg.loaded = false; },
    (copy) => { copy.states.mobileLight.geometry.svg.naturalWidth = 49; },
    (copy) => { copy.states.mobileDark.geometry.svg.renderedHeight = 2481; },
    (copy) => { copy.states.mobileLight.geometry.sty09 = 1; },
    (copy) => { copy.states.desktopDark.logs.push({level: 'error'}); },
    (copy) => { copy.states.mobileDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.mobileDark.diagnostics.hasMore = true; },
    (copy) => { copy.states.mobileDark.diagnostics.truncated = true; },
    (copy) => { copy.states.desktopLight.diagnostics.visualInspection = 'PASS'; },
  ];
  for (const mutate of mutations) assertRejectsEvidenceMutation(evidence, mutate);
});

test('rejects every screenshot deletion, change, additive field, and fabricated PASS', () => {
  const evidence = JSON.parse(rawBrowserBytes);
  assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.status = 'PASS'; });
  assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.reason = 'visual PASS'; });
  assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.visualInspection = 'PASS'; });
  for (let index = 0; index < SCREENSHOT_ATTEMPTS.length; index += 1) {
    assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.attempts.splice(index, 1); });
    assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.attempts[index].sha256 = '0'.repeat(64); });
    assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.attempts[index].bytes += 1; });
    assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.attempts[index].state = 'fabricated'; });
    assertRejectsEvidenceMutation(evidence, (copy) => { copy.screenshotEvidence.attempts[index].visualInspection = 'PASS'; });
  }
});

test('rejects MTH-07 job relabeling and any weakened, duplicated, displaced, or additive integration review claim', () => {
  assertIntegrationReview(review);
  const exactJobs = `Exact Pages run: \`${MTH07_PRODUCTION.pagesRun}\`; build job: \`${MTH07_PRODUCTION.buildJob}\`; deploy job: \`${MTH07_PRODUCTION.deployJob}\`; every status: \`completed / success\`.`;
  const swappedJobs = `Exact Pages run: \`${MTH07_PRODUCTION.pagesRun}\`; build job: \`${MTH07_PRODUCTION.deployJob}\`; deploy job: \`${MTH07_PRODUCTION.buildJob}\`; every status: \`completed / success\`.`;
  const insertBeforeIntegration = (claims) => replaceRequired(
    review,
    '\n## Integration candidate after origin/main divergence',
    `\n${claims}\n\n## Integration candidate after origin/main divergence`,
  );
  const reviewMutations = [
    replaceRequired(review, `Integration implementation candidate: \`${IMPLEMENTATION_HEAD}\`.`, `Integration implementation candidate: \`${'0'.repeat(40)}\`.`),
    replaceRequired(review, `Integration evidence head: \`${EVIDENCE_HEAD}\`.`, `Integration evidence head: \`${'1'.repeat(40)}\`.`),
    replaceRequired(review, `Exact reviewed integration head: \`${REVIEWED_INTEGRATION_HEAD}\`.`, `Exact reviewed integration head: \`${'3'.repeat(40)}\`.`),
    replaceRequired(review, RAW_BROWSER_SHA256, '2'.repeat(64)),
    replaceRequired(review, exactJobs, swappedJobs),
    replaceRequired(review, `build job: \`${MTH07_PRODUCTION.buildJob}\``, 'build job: `94722157543`'),
    replaceRequired(review, 'Independent code/spec/security review for the integration bundle: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review for the integration bundle: `NOT READY`; findings: `0`.'),
    replaceRequired(review, 'Independent code/spec/security review for the integration bundle: `READY / APPROVE`; findings: `0`.', 'Independent code/spec/security review for the integration bundle: `READY / APPROVE`; findings: `1`.'),
    replaceRequired(review, 'Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review for the integration bundle: `CHANGES`; rights: `PASS`; findings: `0`.'),
    replaceRequired(review, 'Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PENDING`; findings: `0`.'),
    replaceRequired(review, 'Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PASS`; findings: `0`.', 'Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PASS`; findings: `1`.'),
    replaceRequired(review, 'Independent architecture/invariant review for the integration bundle: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review for the integration bundle: `BLOCKED`; blockers: `0`.'),
    replaceRequired(review, 'Independent architecture/invariant review for the integration bundle: `CLEAR / READY`; blockers: `0`.', 'Independent architecture/invariant review for the integration bundle: `CLEAR / READY`; blockers: `1`.'),
    replaceRequired(review, 'Final integration readiness: `READY`.', 'Final integration readiness: `PENDING`.'),
    replaceRequired(review, 'Integration scope boundary: `INTEGRATION_ONLY`;', 'Integration scope boundary: `STAGE_B`;'),
    replaceRequired(review, 'Integration deployment status: `NOT_RUN`.', 'Integration deployment status: `SUCCESS`.'),
    replaceRequired(
      review,
      '- Integration screenshot evidence: `BLOCKED / NOT_ACCEPTED`. Exactly three fresh IAB full-page captures repeated the opening viewport rather than the complete page and architecture diagram. No visual PASS is claimed.',
      '- Integration screenshot evidence: `PASS`. Exactly three fresh IAB full-page captures repeated the opening viewport rather than the complete page and architecture diagram. Visual PASS is claimed.',
    ),
    review.replace(/\n## Integration candidate after origin\/main divergence[\s\S]*$/u, (section) => `${section}\n${section}`),
    review.replace(/(\n## Independent review checkpoint[\s\S]*?)(\n## Integration candidate after origin\/main divergence[\s\S]*)$/u, '$2$1'),
    replaceRequired(review, '\n## Stage B closure candidate', '\n- visualInspection: `PASS`.\n\n## Stage B closure candidate'),
    insertBeforeIntegration([
      '- Final integration readiness: `READY`.',
      '- Integration deployment status: `SUCCESS`.',
      '- Integration screenshot evidence: `PASS`.',
    ].join('\n')),
    insertBeforeIntegration('- Final integration readiness: `READY`.'),
    insertBeforeIntegration('- Integration deployment status: `SUCCESS`.'),
    insertBeforeIntegration('- Integration screenshot evidence: `PASS`.'),
    insertBeforeIntegration([
      `- Exact reviewed integration head: \`${REVIEWED_INTEGRATION_HEAD}\`.`,
      '- Independent code/spec/security review for the integration bundle: `READY / APPROVE`; findings: `0`.',
      '- Independent content/evidence/rights review for the integration bundle: `CONTENT READY`; rights: `PASS`; findings: `0`.',
      '- Independent architecture/invariant review for the integration bundle: `CLEAR / READY`; blockers: `0`.',
    ].join('\n')),
  ];
  for (const mutated of reviewMutations) {
    assert.notEqual(mutated, review, 'review mutation applies');
    assert.throws(() => assertIntegrationReview(mutated), {name: 'AssertionError'});
  }
});
