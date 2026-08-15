import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const REVIEW = 'docs/reviews/g009-batch9.md';
const RAW_BROWSER = 'docs/reviews/evidence/g009-batch9-integration-browser.json';
const IMPLEMENTATION_HEAD = 'c1aebf57c638d30efe987d1c29e578f502bafb46';
const EVIDENCE_HEAD = '1b002b8fa0f2c58019fc05e6e93efbae0bd23570';
const RAW_BROWSER_SHA256 = '14a206017541f2c7f6f09b28a3e2ab34ce0e5c1b01973777b0b4759d9a576733';
const MERGE_PARENTS = [
  'd83ac7d119f63745f8abb62a7a3fd029c1b32e8a',
  '00da8b412394e89bf823c7899816026b78c71b74',
];
const STATES = ['desktopLight', 'desktopDark', 'mobileLight', 'mobileDark'];
const WRAPPERS = [
  '共享订单状态与订单 Actor 履约边界对照图，可横向滚动',
  'Actor、线程、消息消费者、事件驱动与微服务机制对照表，可横向滚动',
  'Actor Model 采用、谨慎采用与停止决策表，可横向滚动',
];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const [status, manifest, indexes, publicLedger, review, rawBrowserBytes] = await Promise.all([
  readFile(new URL('src/generated/project-status.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('src/generated/topic-manifest.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('src/generated/topic-indexes.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/source-ledger.json', root), 'utf8').then(JSON.parse),
  readFile(new URL(REVIEW, root), 'utf8'),
  readFile(new URL(RAW_BROWSER, root)),
]);

function assertCombinedProjection(statusValue = status, manifestValue = manifest, indexesValue = indexes, ledgerValue = publicLedger) {
  assert.deepEqual(
    {
      completed: statusValue.completed_topics,
      documents: statusValue.content_documents,
      sources: statusValue.governed_sources,
    },
    {completed: 60, documents: 104, sources: 539},
  );
  assert.equal(ledgerValue.sources.length, 539);

  const topics = new Map(manifestValue.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexesValue.style.map((topic) => [topic.id, topic]));
  const methods = new Map(indexesValue.method.map((topic) => [topic.id, topic]));
  assert.deepEqual(
    [topics.get('STY-08')?.published, topics.get('STY-08')?.status, styles.get('STY-08')?.published],
    [true, {scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}, true],
  );
  assert.deepEqual(
    [topics.get('STY-09')?.published, topics.get('STY-09')?.status, styles.get('STY-09')?.published],
    [false, {scope: 'backlog-projection', value: 'pending', source: 'docs/content-backlog.md'}, false],
  );
  assert.deepEqual(
    [topics.get('MTH-07')?.published, topics.get('MTH-07')?.status, methods.get('MTH-07')?.published],
    [true, {scope: 'content-lifecycle', value: 'reviewed', source: 'content/methods/mth-07-fde-enterprise-ai-delivery.mdx'}, true],
  );
}

function assertBrowserEvidence(evidence) {
  assert.equal(evidence.candidateHead, IMPLEMENTATION_HEAD);
  assert.deepEqual(evidence.collection, {
    browser: 'Codex in-app Browser only',
    fresh: true,
    servedUrl: 'http://127.0.0.1:3418/tego-arch/styles/sty-08',
    build: 'npm run build from exact candidate head; npm run serve -- --host 127.0.0.1 --port 3418',
  });
  assert.deepEqual(Object.keys(evidence.states), STATES);
  for (const [stateName, state] of Object.entries(evidence.states)) {
    const mobile = stateName.startsWith('mobile');
    assert.deepEqual(state.geometry.page, {clientWidth: mobile ? 390 : 1440, scrollWidth: mobile ? 390 : 1440});
    assert.deepEqual(state.geometry.wrappers.map(({label}) => label), WRAPPERS);
    assert.deepEqual(state.geometry.wrappers.map(({clientWidth}) => clientWidth), mobile ? [358, 358, 358] : [800, 800, 800]);
    assert.deepEqual(state.geometry.wrappers.map(({scrollWidth}) => scrollWidth), [800, 1171, 1764]);
    assert.deepEqual(state.interactions.map(({after, before}) => after.scrollLeft - before.scrollLeft), mobile ? [40, 40, 40] : [0, 40, 40]);
    assert.ok(state.interactions.every(({before, after}) => before.focus && before.focusVisible && after.focus && after.focusVisible));
    assert.ok(state.interactions.every(({before, after}) => before.outline.endsWith('solid 3px') && after.outline === before.outline));
    assert.equal(state.relations.length, 4);
    assert.ok(state.relations.every((relation) => relation.h1 === relation.expectedH1 && relation.returnedToArticle));
    assert.equal(state.geometry.sources.length, 6);
    assert.ok(state.geometry.sources.every(({target, rel}) => target === '_blank' && rel === 'noopener noreferrer'));
    assert.equal(state.geometry.sty09, 0);
    assert.deepEqual(state.logs, []);
    assert.deepEqual(state.diagnostics, {events: [], hasMore: false, truncated: false});
  }
  assert.equal(evidence.screenshotEvidence.status, 'BLOCKED / NOT_ACCEPTED');
  assert.equal(evidence.screenshotEvidence.attempts.length, 3);
  assert.ok(evidence.screenshotEvidence.attempts.every(({status}) => status === 'CAPTURED_REJECTED'));
}

function assertIntegrationReview(source) {
  for (const literal of [
    `Original STY-08 implementation candidate: \`${'bbb2f4234c4c24993dbea108d2a19a751e778409'}\`.`,
    `Original STY-08 evidence head: \`${'4923b7da22d79ecc32400669526196ca852885a4'}\`.`,
    `Original STY-08 final evidence-binding head: \`${MERGE_PARENTS[0]}\`.`,
    `Integration implementation candidate: \`${IMPLEMENTATION_HEAD}\`.`,
    `Merge parents: \`${MERGE_PARENTS[0]}\` and \`${MERGE_PARENTS[1]}\`.`,
    `Integration evidence head: \`${EVIDENCE_HEAD}\`.`,
    `Integration Browser raw: \`${RAW_BROWSER}\`, SHA-256 \`${RAW_BROWSER_SHA256}\`.`,
    'Projection: `60 completed topics / 104 content documents / 539 governed sources`.',
    'STY-08 remains `published / pending`.',
    'STY-09 remains `unpublished / pending / non-actionable`; actionable route count: `0`.',
    'MTH-07 remains `published / reviewed`',
    'The three independent approvals in `Independent review checkpoint` apply only to the original implementation/evidence bundle named there. They do not review or approve the integration bundle below.',
    'Independent code/spec/security review for the integration bundle: `PENDING`.',
    'Independent content/evidence/rights review for the integration bundle: `PENDING`; rights: `PENDING`.',
    'Independent architecture/invariant review for the integration bundle: `PENDING`.',
    'Final integration readiness: `PENDING`.',
    'Scope boundary: `INTEGRATION_ONLY`; no Stage B backlog mutation is authorized or performed.',
    'Integration deployment status: `NOT_RUN`.',
    'Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.',
    'No visual PASS is claimed.',
  ]) assert.ok(source.includes(literal), literal);
}

test('projects the combined STY-08 and MTH-07 Stage A truth', () => {
  assertCombinedProjection();
});

test('binds the exact integration implementation, evidence bytes, and pending review boundary', () => {
  assert.equal(sha256(rawBrowserBytes), RAW_BROWSER_SHA256);
  assertBrowserEvidence(JSON.parse(rawBrowserBytes));
  assertIntegrationReview(review);
});

test('rejects combined projection, semantic, evidence, and readiness mutations', () => {
  for (const mutate of [
    (copy) => { copy.completed_topics -= 1; },
    (copy) => { copy.content_documents -= 1; },
    (copy) => { copy.governed_sources -= 1; },
  ]) {
    const copy = structuredClone(status);
    mutate(copy);
    assert.throws(() => assertCombinedProjection(copy), {name: 'AssertionError'});
  }

  const mutatedManifest = structuredClone(manifest);
  mutatedManifest.topics.find(({id}) => id === 'STY-09').published = true;
  assert.throws(() => assertCombinedProjection(status, mutatedManifest), {name: 'AssertionError'});

  const evidence = JSON.parse(rawBrowserBytes);
  for (const mutate of [
    (copy) => { copy.candidateHead = '0'.repeat(40); },
    (copy) => { delete copy.states.mobileDark; },
    (copy) => { copy.states.mobileLight.geometry.sty09 = 1; },
    (copy) => { copy.states.desktopDark.diagnostics.events.push({method: 'Runtime.exceptionThrown'}); },
    (copy) => { copy.states.desktopLight.relations[0].returnedToArticle = false; },
    (copy) => { copy.screenshotEvidence.status = 'PASS'; },
  ]) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.throws(() => assertBrowserEvidence(copy), {name: 'AssertionError'});
  }

  for (const [before, after] of [
    [`Integration implementation candidate: \`${IMPLEMENTATION_HEAD}\`.`, `Integration implementation candidate: \`${'0'.repeat(40)}\`.`],
    [`Integration evidence head: \`${EVIDENCE_HEAD}\`.`, `Integration evidence head: \`${'1'.repeat(40)}\`.`],
    ['Final integration readiness: `PENDING`.', 'Final integration readiness: `READY`.'],
    ['Integration deployment status: `NOT_RUN`.', 'Integration deployment status: `SUCCESS`.'],
    ['Screenshot evidence: `BLOCKED / NOT_ACCEPTED`.', 'Screenshot evidence: `PASS`.'],
  ]) {
    const mutated = review.replaceAll(before, after);
    assert.notEqual(mutated, review, `${before} mutation applies`);
    assert.throws(() => assertIntegrationReview(mutated), {name: 'AssertionError'});
  }
});
