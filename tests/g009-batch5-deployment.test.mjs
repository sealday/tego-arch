import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access, readFile} from 'node:fs/promises';
import test from 'node:test';

const ARTICLE = 'content/styles/sty-04-modular-monolith.mdx';
const ROUTE = '/styles/sty-04';
const SVG_ROUTE = '/img/diagrams/sty-04-modular-monolith-boundaries.svg';
const SOURCE_IDS = [
  'src-fowler-monolith-first',
  'src-spring-modulith-fundamentals',
  'src-spring-modulith-events',
  'src-atlas-sty04-modular-monolith-boundaries',
];

const [article, backlog, review, manifest, indexes, projectStatus, publicLedger] =
  await Promise.all([
    readFile(new URL(`../${ARTICLE}`, import.meta.url), 'utf8'),
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
    readFile(new URL('../docs/reviews/g009-batch5.md', import.meta.url), 'utf8')
      .catch((error) => error?.code === 'ENOENT' ? '' : Promise.reject(error)),
    readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8')
      .then(JSON.parse),
    readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8')
      .then(JSON.parse),
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8')
      .then(JSON.parse),
    readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8')
      .then(JSON.parse),
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

test('projects the exact STY-04 Stage A inventory', () => {
  assert.deepEqual(
    {
      completed_topics: projectStatus.completed_topics,
      content_documents: projectStatus.content_documents,
      governed_sources: projectStatus.governed_sources,
    },
    {completed_topics: 56, content_documents: 99, governed_sources: 513},
  );
  assert.equal(publicLedger.sources.length, 513);

  const topic = topicsById.get('STY-04');
  const style = stylesById.get('STY-04');
  for (const projection of [topic, style]) {
    assert.equal(projection?.published, true);
    assert.equal(projection?.status.value, 'pending');
    assert.equal(projection?.slug, ROUTE);
  }

  const nextTopic = topicsById.get('STY-05');
  const nextStyle = stylesById.get('STY-05');
  for (const projection of [nextTopic, nextStyle]) {
    assert.equal(projection?.published, false);
    assert.equal(projection?.status.value, 'pending');
  }
});

test('publishes only the governed STY-04 route, SVG, and sources', async () => {
  assert.equal(publishedRoutes.has(ROUTE), true);
  assert.equal(publishedRoutes.has('/styles/sty-05'), false);
  assert.ok(markdownLinks(article).includes(SVG_ROUTE));
  assert.equal(markdownLinks(article).includes('/styles/sty-05'), false);
  await access(new URL(`../static${SVG_ROUTE}`, import.meta.url));

  assert.deepEqual(
    SOURCE_IDS.filter((sourceId) => publicSourcesById.has(sourceId)),
    SOURCE_IDS,
  );
});

test('preserves the pre-closure G009 backlog state', () => {
  const currentBaseline = backlog.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  assert.match(currentBaseline, /当前 G009，下一项为 STY-04/u);
  assert.match(backlog, /^- \[x\] \*\*STY-03 /mu);
  assert.match(backlog, /^- \[ \] \*\*STY-04 /mu);
  assert.match(backlog, /^- \[ \] \*\*STY-05 /mu);
});

test('records exact Stage A deployment and production evidence without closing STY-04', async () => {
  assert.match(review, /^# G009 Batch 5 Stage A Review$/mu);
  assert.match(section(review, 'Stage A projection'), /56 completed topics \/ 99 content documents \/ 513 governed sources/u);
  assert.match(section(review, 'Stage A projection'), /STY-04: `published \/ pending`/u);
  assert.match(section(review, 'Stage A projection'), /STY-05: `unpublished \/ pending`/u);

  const artifacts = [
    ARTICLE,
    'diagrams/sty-04-modular-monolith-boundaries.drawio',
    'static/img/diagrams/sty-04-modular-monolith-boundaries.svg',
  ];
  for (const artifact of artifacts) {
    const body = await readFile(new URL(`../${artifact}`, import.meta.url));
    assert.match(
      section(review, 'Artifact identities'),
      new RegExp(`\\| ${escapeRegExp(`\`${artifact}\``)} \\| [0-9,]+ \\| ${escapeRegExp(`\`${sha256(body)}\``)} \\|`, 'u'),
      `${artifact} exact SHA-256`,
    );
  }

  const independentReview = section(review, 'Independent review');
  assert.match(independentReview, /Exact reviewed head: `2edba43`/u);
  assert.match(independentReview,
    /Independent code reviewer \(`code-reviewer`\): `READY \/ APPROVE`; findings: `0`/u);
  assert.match(independentReview,
    /selector-bound contrast.*four-state browser evidence/u);
  assert.match(independentReview,
    /Independent content and rights reviewer: `READY`; rights: `PASS`; findings: `0`/u);
  assert.match(independentReview,
    /original-illustration governance.*payment recovery/u);
  assert.match(independentReview,
    /Independent architecture reviewer \(`architect`\): `CLEAR \/ READY`; findings: `0`/u);
  assert.match(independentReview, /invariant proof/u);
  assert.match(independentReview, /Final Stage A release judgment: `READY`/u);
  assert.doesNotMatch(independentReview, /`PENDING`/u);

  const deployment = section(review, 'Stage A deployment evidence');
  assert.match(
    deployment,
    /Stage A exact head: `9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63`/u,
  );
  assert.match(
    deployment,
    /Pages run: \[`31436111404`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/31436111404\); build job `93610482485`; deploy job `93611048927`/u,
  );
  assert.match(
    deployment,
    /workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, `headSha=9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63`, `status=completed`, `conclusion=success`/u,
  );
  assert.match(deployment, /created `2026-08-10T21:56:13Z`/u);
  assert.match(deployment, /completed\/updated `2026-08-10T21:59:03Z`/u);

  const productionHttp = section(review, 'Production HTTP smoke');
  for (const route of [
    '/styles/sty-04',
    '/styles',
    '/paths/module-boundaries',
    '/styles/sty-01',
    '/styles/sty-02',
    '/styles/sty-03',
    '/cases/micro-frontends-single-spa',
    '/references',
  ]) {
    assert.match(productionHttp, new RegExp(escapeRegExp(`\`${route}\``), 'u'));
  }
  assert.match(productionHttp, /HTTP 200 with `text\/html; charset=utf-8`/u);
  assert.match(productionHttp, /HTTP 200 with `image\/svg\+xml`, 19,722 bytes/u);
  assert.match(
    productionHttp,
    /SHA-256 `d78f3231d9aaaa4cdbf39e04ec3070fabc9b4a8cb7f64aad862cc340ce8da8e4`/u,
  );
  assert.match(productionHttp, /Production HTTP probes: `9\/9` passed \(`8` HTML routes \+ `1` SVG asset\)/u);

  const browserQa = section(review, 'Production Browser QA');
  assert.match(browserQa, /Desktop light and dark, `1440x1000`/u);
  assert.match(browserQa, /document `1440\/1440`/u);
  assert.match(browserQa, /ArrowRight movement was `0\/40\/40`/u);
  assert.match(browserQa, /Mobile light and dark, `390x844`/u);
  assert.match(browserQa, /document `390\/390`/u);
  assert.match(browserQa, /ArrowRight movement was `40\/40\/40`/u);
  assert.match(browserQa, /all 12 wrapper checks began at `0`/u);
  assert.match(browserQa, /matched `:focus-visible`/u);
  assert.match(browserQa, /rendered a `3px solid` outline/u);
  assert.match(browserQa, /STY-01, STY-02, STY-03, and the linked micro-frontends case/u);
  assert.match(browserQa, /5 exact source anchors per state/u);
  assert.match(browserQa, /The 3 unique source targets resolved in all four states/u);
  assert.match(browserQa, /STY-05 actionable article links: `0` in each state/u);
  assert.match(browserQa, /warning\/error logs.*events were empty in each state/u);
  assert.match(browserQa, /`hasMore=false` and `truncated=false`/u);
  assert.match(
    browserQa,
    /Raw production evidence: `\.superpowers\/sdd\/task-6-production-evidence\.json`, SHA-256 `f2bfe05bd293c5f896cfedb591143bbcdd736d70aa8d88c69302ec44876879de`/u,
  );
  assert.match(browserQa, /Stage A production verdict: \*\*PASS\*\*/u);

  const releaseState = section(review, 'Release state');
  assert.match(releaseState, /STY-04 remains `published \/ pending`/u);
  assert.match(releaseState, /backlog checkbox remains unchecked/u);
  assert.match(releaseState, /STY-05 remains `unpublished \/ pending`/u);
  assert.match(releaseState, /No Stage B closure is claimed/u);
  assert.doesNotMatch(review, /Stage B closure verdict:\s*\*\*PASS\*\*/iu);
});
