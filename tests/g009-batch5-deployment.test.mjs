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

function assertExactStageAProductionEvidence(source) {
  const deployment = section(source, 'Stage A deployment evidence');
  for (const literal of [
    'Exact run gate: workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, `headSha=9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63`, `status=completed`, `conclusion=success`.',
    'Implementation build job `93610482485`: `status=completed`, `conclusion=success`.',
    'Implementation deploy job `93611048927`: `status=completed`, `conclusion=success`.',
    'Evidence commit exact head: `9d60259599c43dbd10c7ec31507dabf6db5d0ac5`.',
    'Evidence-contract Pages run: [`31438264944`](https://github.com/sealday/tego-arch/actions/runs/31438264944); workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, `headSha=9d60259599c43dbd10c7ec31507dabf6db5d0ac5`, `status=completed`, `conclusion=success`.',
    'Evidence build job `93617237855`: `status=completed`, `conclusion=success`.',
    'Evidence deploy job `93617748403`: `status=completed`, `conclusion=success`.',
  ]) {
    assert.ok(deployment.includes(literal), `deployment literal: ${literal}`);
  }

  const browser = section(source, 'Production Browser QA');
  const relationOutcomes = [
    '| `desktopLight` | visible-DOM click | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |',
    '| `desktopDark` | visible-DOM click | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |',
    '| `mobileLight` | visible-DOM href selection + direct navigation (`responsive offscreen-click fallback`) | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |',
    '| `mobileDark` | visible-DOM href selection + direct navigation (`responsive offscreen-click fallback`) | `STY-01 → 分层架构：用依赖方向约束职责分层 → return /styles/sty-04`; `STY-02 → 六边形架构、洋葱架构与整洁架构：用依赖方向判断边界所有权 → return /styles/sty-04`; `STY-03 → 垂直切片架构：按用例收拢变化边界 → return /styles/sty-04`; `case → 微前端：用垂直业务切片约束跨团队所有权 → return /styles/sty-04` |',
  ];
  const sourceOutcomes = [
    '| `desktopLight` | visible-DOM anchor click; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |',
    '| `desktopDark` | visible-DOM anchor click; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |',
    '| `mobileLight` | exact anchor resolution; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |',
    '| `mobileDark` | exact anchor resolution; `_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab | `3/3` exact governed destinations resolved |',
  ];
  const diagnostics = [
    '| `desktopLight` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |',
    '| `desktopDark` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |',
    '| `mobileLight` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |',
    '| `mobileDark` | warning/error logs `0`; `Runtime.exceptionThrown=0`; `Log.entryAdded=0`; `hasMore=false`; `truncated=false` |',
  ];
  for (const literal of [...relationOutcomes, ...sourceOutcomes, ...diagnostics]) {
    assert.ok(browser.includes(literal), `browser literal: ${literal}`);
  }
  for (const screenshotHash of [
    'ff220fe6595578400011fabc7776d9c5c2dab82b6b90c4ebecd03ce42d12d961',
    '5ac79ac96baef4192704504d8ced113bbf73fe44d402652c0e37ca1974621c82',
    'c50f50bbba21d1e36e9415063d786b2c7cca3a254d26db1fbc9e02d5728bd0e5',
    'ecb38667f37778277925f67dda957d569e3c73f49e3118eb9105dbfa68c4110d',
  ]) {
    assert.ok(browser.includes(screenshotHash), `screenshot SHA-256: ${screenshotHash}`);
  }
}

function assertStageBIndependentReview(source) {
  const stageBClosure = section(source, 'Stage B closure implementation');
  for (const literal of [
    'Exact reviewed local head: `2a46df9`.',
    'Independent code reviewer (`code-reviewer`): `READY / APPROVE`; findings: `0`.',
    'Independent content reviewer: `READY`; rights: `PASS`; blocking findings: `0`.',
    'Nonblocking item 1: the plan/brief 512-source forecast is stale; the authoritative Stage A and generated projection remain 513 sources — `ACCEPTED`.',
    'Nonblocking item 2: the stale STY-04 mutation expectation and six assertion messages were corrected in `2a46df9` — `RESOLVED`.',
    'Independent architecture reviewer (`architect`): `CLEAR / READY`; blockers: `0`.',
    'Invariant proof: module contracts, unique data ownership, explicit transaction/event semantics, shared deployment/failure boundaries, and evidence-based extraction remain intact.',
    'Local Stage B review readiness: `READY`; this is not Stage B deployment evidence.',
    'Stage B deployment status: `PENDING`.',
  ]) {
    assert.ok(stageBClosure.includes(literal), `Stage B review literal: ${literal}`);
  }
  assert.doesNotMatch(stageBClosure, /Stage B deployment status: `(?:PASS|DEPLOYED|SUCCESS)`/u);
}

test('projects the exact STY-04 Stage B closure inventory', () => {
  assert.deepEqual(
    {
      completed_topics: projectStatus.completed_topics,
      content_documents: projectStatus.content_documents,
      governed_sources: projectStatus.governed_sources,
    },
    {completed_topics: 57, content_documents: 99, governed_sources: 513},
  );
  assert.equal(publicLedger.sources.length, 513);

  const topic = topicsById.get('STY-04');
  const style = stylesById.get('STY-04');
  for (const projection of [topic, style]) {
    assert.equal(projection?.published, true);
    assert.equal(projection?.status.value, 'complete');
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

test('closes only STY-04 and advances the G009 release baseline to STY-05', () => {
  const currentBaseline = backlog.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  assert.match(currentBaseline, /2026-08-11 G009 Batch 5 已完成 STY-04/u);
  assert.match(currentBaseline, /57 个已完成主题、99 篇内容文档与 513 个受治理来源/u);
  assert.match(currentBaseline, /当前 G009，下一项为 STY-05/u);
  assert.match(currentBaseline, /STY-04 为 published\/complete/u);
  assert.match(currentBaseline, /STY-05 为 unpublished\/pending/u);
  assert.match(currentBaseline, /Stage B 独立 code review verdict 为 READY\/APPROVE，findings `0`/u);
  assert.match(currentBaseline, /content review verdict 为 READY，rights PASS，blocking findings `0`/u);
  assert.match(currentBaseline, /architecture review verdict 为 CLEAR\/READY，blockers `0`/u);
  assert.match(currentBaseline, /Stage B deployment status 仍为 `PENDING`/u);
  assert.doesNotMatch(currentBaseline, /最终独立评审槽位保持 pending/u);
  assert.match(backlog, /^- \[x\] \*\*STY-03 /mu);
  assert.match(backlog, /^- \[ \] \*\*STY-05 /mu);

  const sty04Lines = backlog.split(/\r?\n/u)
    .filter((line) => /^- \[[ x]\] \*\*STY-04 /u.test(line));
  assert.equal(sty04Lines.length, 1);
  const [sty04Line] = sty04Lines;
  for (const literal of [
    '- [x] **STY-04 ',
    '2026-08-11',
    '9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63',
    '31436111404',
    '/styles/sty-04',
    '/img/diagrams/sty-04-modular-monolith-boundaries.svg',
    'Stage A production verdict PASS',
  ]) {
    assert.ok(sty04Line.includes(literal), `STY-04 closure literal: ${literal}`);
  }
});

test('rejects stale Stage B review and fabricated deployment state in the canonical baseline', () => {
  const mutations = [
    ['stale review slots', 'Stage B 独立 code review verdict 为 READY/APPROVE，findings `0`', 'Stage B 本地实现的最终独立评审槽位保持 pending'],
    ['code verdict', 'READY/APPROVE，findings `0`', 'PENDING，findings `1`'],
    ['content verdict', 'READY，rights PASS，blocking findings `0`', 'PENDING，rights UNKNOWN，blocking findings `1`'],
    ['architecture verdict', 'CLEAR/READY，blockers `0`', 'BLOCKED，blockers `1`'],
    ['deployment status', 'Stage B deployment status 仍为 `PENDING`', 'Stage B deployment status 为 `SUCCESS`'],
  ];

  for (const [label, exact, replacement] of mutations) {
    const mutatedBacklog = backlog.replace(exact, replacement);
    assert.notEqual(mutatedBacklog, backlog, `${label} mutation must apply`);
    const mutatedBaseline = mutatedBacklog.split(/\r?\n/u)
      .find((line) => line.startsWith('- **当前发布基线：**'));
    assert.ok(mutatedBaseline, `${label} current baseline`);
    assert.throws(() => {
      assert.match(mutatedBaseline, /Stage B 独立 code review verdict 为 READY\/APPROVE，findings `0`/u);
      assert.match(mutatedBaseline, /content review verdict 为 READY，rights PASS，blocking findings `0`/u);
      assert.match(mutatedBaseline, /architecture review verdict 为 CLEAR\/READY，blockers `0`/u);
      assert.match(mutatedBaseline, /Stage B deployment status 仍为 `PENDING`/u);
      assert.doesNotMatch(mutatedBaseline, /最终独立评审槽位保持 pending/u);
    }, {name: 'AssertionError'}, label);
  }
});

test('preserves exact Stage A evidence and records final Stage B independent verdicts', async () => {
  assertExactStageAProductionEvidence(review);
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
  assert.match(browserQa, /STY-05 actionable article links: `0` in each state/u);
  assert.match(
    browserQa,
    /Raw production evidence: `\.superpowers\/sdd\/task-6-production-evidence\.json`, SHA-256 `f2bfe05bd293c5f896cfedb591143bbcdd736d70aa8d88c69302ec44876879de`/u,
  );
  assert.match(browserQa, /Stage A production verdict: \*\*PASS\*\*/u);

  assertStageBIndependentReview(review);
  const stageBClosure = section(review, 'Stage B closure implementation');
  assert.match(stageBClosure, /Projection: 57 completed topics \/ 99 content documents \/ 513 governed sources/u);
  assert.match(stageBClosure, /STY-04: `published \/ complete`/u);
  assert.match(stageBClosure, /STY-05: `unpublished \/ pending`/u);
  assert.match(stageBClosure, /Local Stage B review readiness: `READY`/u);
  assert.match(stageBClosure, /Stage B deployment status: `PENDING`/u);
  assert.doesNotMatch(review, /Stage B closure verdict:\s*\*\*PASS\*\*/iu);
});

test('rejects missing or fabricated Stage B independent verdicts', () => {
  const mutations = [
    ['reviewed head', 'Exact reviewed local head: `2a46df9`.', 'Exact reviewed local head: `46cc7a1`.'],
    ['code verdict', '`READY / APPROVE`; findings: `0`.', '`PENDING`; findings: `1`.'],
    ['content rights', '`READY`; rights: `PASS`; blocking findings: `0`.', '`READY`; rights: `UNKNOWN`; blocking findings: `0`.'],
    ['brief item', '513 sources — `ACCEPTED`.', '512 sources — `ACCEPTED`.'],
    ['message cleanup', 'corrected in `2a46df9` — `RESOLVED`.', 'deferred — `PENDING`.'],
    ['architecture verdict', '`CLEAR / READY`; blockers: `0`.', '`BLOCKED`; blockers: `1`.'],
    ['invariant proof', 'unique data ownership', 'shared data ownership'],
    ['deployment boundary', 'Stage B deployment status: `PENDING`.', 'Stage B deployment status: `SUCCESS`.'],
  ];

  for (const [label, exact, replacement] of mutations) {
    const stageBClosure = section(review, 'Stage B closure implementation');
    const mutatedStageBClosure = stageBClosure.replace(exact, replacement);
    assert.notEqual(mutatedStageBClosure, stageBClosure, `${label} mutation must apply`);
    const mutatedReview = review.replace(stageBClosure, mutatedStageBClosure);
    assert.throws(() => assertStageBIndependentReview(mutatedReview), {name: 'AssertionError'}, label);
  }
});

test('rejects mutated Stage A run and four-state production evidence', () => {
  const mutations = [
    ['implementation run conclusion', 'Exact run gate: workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, `headSha=9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63`, `status=completed`, `conclusion=success`.', 'Exact run gate: workflow `Verify and deploy Docusaurus to GitHub Pages`, `event=push`, `headSha=9cfe1de9497dd7e0a38e2c6358ba5bded59b0c63`, `status=completed`, `conclusion=failure`.'],
    ['implementation build status', 'Implementation build job `93610482485`: `status=completed`, `conclusion=success`.', 'Implementation build job `93610482485`: `status=completed`, `conclusion=failure`.'],
    ['implementation deploy job', 'Implementation deploy job `93611048927`', 'Implementation deploy job `93611048928`'],
    ['evidence build status', 'Evidence build job `93617237855`: `status=completed`, `conclusion=success`.', 'Evidence build job `93617237855`: `status=in_progress`, `conclusion=success`.'],
    ['evidence deploy conclusion', 'Evidence deploy job `93617748403`: `status=completed`, `conclusion=success`.', 'Evidence deploy job `93617748403`: `status=completed`, `conclusion=failure`.'],
    ['evidence run status', '`headSha=9d60259599c43dbd10c7ec31507dabf6db5d0ac5`, `status=completed`, `conclusion=success`.', '`headSha=9d60259599c43dbd10c7ec31507dabf6db5d0ac5`, `status=in_progress`, `conclusion=success`.'],
    ['desktop relation outcome', '| `desktopLight` | visible-DOM click |', '| `desktopLight` | unverified |'],
    ['mobile relation fallback', 'visible-DOM href selection + direct navigation (`responsive offscreen-click fallback`)', 'ordinary click'],
    ['source popup fallback', '`_blank` popup suppressed; exact selected href direct-opened in a temporary Browser tab', '`_blank` popup opened normally'],
    ['desktop light screenshot', 'ff220fe6595578400011fabc7776d9c5c2dab82b6b90c4ebecd03ce42d12d961', '0'.repeat(64)],
    ['desktop dark screenshot', '5ac79ac96baef4192704504d8ced113bbf73fe44d402652c0e37ca1974621c82', '1'.repeat(64)],
    ['mobile light screenshot', 'c50f50bbba21d1e36e9415063d786b2c7cca3a254d26db1fbc9e02d5728bd0e5', '2'.repeat(64)],
    ['mobile dark screenshot', 'ecb38667f37778277925f67dda957d569e3c73f49e3118eb9105dbfa68c4110d', '3'.repeat(64)],
    ['runtime exceptions', '`Runtime.exceptionThrown=0`', '`Runtime.exceptionThrown=1`'],
    ['log entries', '`Log.entryAdded=0`', '`Log.entryAdded=1`'],
    ['diagnostic pagination', '`hasMore=false`', '`hasMore=true`'],
    ['diagnostic truncation', '`truncated=false`', '`truncated=true`'],
  ];

  for (const [label, exact, replacement] of mutations) {
    const mutatedReview = review.replace(exact, replacement);
    assert.notEqual(mutatedReview, review, `${label} mutation must apply`);
    assert.throws(
      () => assertExactStageAProductionEvidence(mutatedReview),
      {name: 'AssertionError'},
      label,
    );
  }
});
