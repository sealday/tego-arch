import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const RELEASE_SHA = 'd10547acf0b1815e6477c92684f22a9870aed7d6';
const BASE_URL = 'https://sealday.github.io/tego-arch';
const DEPLOYMENT_PATH = 'docs/reviews/evidence/agentic-architecture-topic-system-deployment.json';
const BROWSER_PATH = 'docs/reviews/evidence/agentic-architecture-topic-system-production-browser.json';

const registry = JSON.parse(readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'));
const routes = [...registry.concepts, ...registry.patterns, ...registry.cases]
  .map(({route}) => route);
const svgRoutes = [
  '/img/diagrams/agt-c-01-agent-system-boundary.svg',
  '/img/diagrams/agt-p-06-control-ownership-models.svg',
  '/img/diagrams/agt-p-08-durable-agent-hitl.svg',
  '/img/diagrams/multi-agent-research-system.svg',
  '/img/diagrams/long-running-coding-agent.svg',
  '/img/diagrams/production-incident-response-agent.svg',
];
const browserRoutes = [
  '/paths/agentic-architecture',
  '/concepts',
  '/patterns',
  '/cases',
  ...routes,
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function exactKeys(value, expected, label) {
  assert.deepEqual(Object.keys(value).toSorted(), expected.toSorted(), `${label} exact keys`);
}

function recordByPath(records, path, label) {
  const matches = records.filter((record) => record.path === path);
  assert.equal(matches.length, 1, `${label} has one ${path} record`);
  return matches[0];
}

test('binds the release to one exact successful GitHub Pages workflow run', () => {
  const evidence = readJson(DEPLOYMENT_PATH);
  exactKeys(evidence, ['schemaVersion', 'releaseSha', 'workflow', 'httpProbes', 'summary'], 'deployment evidence');
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.releaseSha, RELEASE_SHA);
  assert.deepEqual(
    {
      path: evidence.workflow.path,
      name: evidence.workflow.name,
      headSha: evidence.workflow.headSha,
      event: evidence.workflow.event,
      status: evidence.workflow.status,
      conclusion: evidence.workflow.conclusion,
    },
    {
      path: '.github/workflows/deploy.yml',
      name: 'Verify and deploy Docusaurus to GitHub Pages',
      headSha: RELEASE_SHA,
      event: 'push',
      status: 'completed',
      conclusion: 'success',
    },
  );
  for (const name of ['build', 'deploy']) {
    const job = evidence.workflow.jobs[name];
    assert.equal(job.name, name);
    assert.equal(job.status, 'completed');
    assert.equal(job.conclusion, 'success');
    assert.ok(Number.isInteger(job.jobId) && job.jobId > 0);
    assert.match(job.url, new RegExp(`/job/${job.jobId}$`, 'u'));
  }
  assert.ok(Number.isInteger(evidence.workflow.runId) && evidence.workflow.runId > 0);
  assert.match(evidence.workflow.runUrl, new RegExp(`/runs/${evidence.workflow.runId}$`, 'u'));
});

test('records successful production HTTP probes for every Agentic route and SVG', () => {
  const evidence = readJson(DEPLOYMENT_PATH);
  const required = [...browserRoutes, ...svgRoutes];
  assert.equal(evidence.httpProbes.length, required.length);
  for (const path of required) {
    const probe = recordByPath(evidence.httpProbes, path, 'HTTP probes');
    assert.equal(probe.url, `${BASE_URL}${path}`);
    assert.equal(probe.status, 200);
    assert.equal(probe.verdict, 'PASS');
    assert.ok(['text/html', 'image/svg+xml'].some((type) => probe.contentType.startsWith(type)));
  }
  assert.deepEqual(evidence.summary, {
    required: required.length,
    passed: required.length,
    failed: 0,
    verdict: 'PASS',
  });
});

test('records fresh in-app Browser evidence for desktop and mobile production states', () => {
  const evidence = readJson(BROWSER_PATH);
  exactKeys(evidence, ['schemaVersion', 'releaseSha', 'baseUrl', 'browser', 'collectedAt', 'viewports', 'states', 'reciprocalChecks', 'svgAssets', 'screenshotEvidence', 'summary'], 'Browser evidence');
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.releaseSha, RELEASE_SHA);
  assert.equal(evidence.baseUrl, BASE_URL);
  assert.equal(evidence.browser, 'in-app Browser');
  assert.deepEqual(evidence.viewports, [
    {name: 'desktop', width: 1200, height: 900},
    {name: 'mobile', width: 390, height: 844},
  ]);
  assert.equal(evidence.states.length, browserRoutes.length * evidence.viewports.length);
  for (const viewport of evidence.viewports) {
    for (const path of browserRoutes) {
      const states = evidence.states.filter((state) => state.viewport === viewport.name && state.path === path);
      assert.equal(states.length, 1, `${viewport.name} has one ${path} state`);
      const [state] = states;
      assert.equal(state.url, `${BASE_URL}${path}`);
      assert.equal(state.h1Count, 1);
      assert.ok(state.h1.length > 0);
      assert.equal(state.documentOverflow, false);
      assert.equal(state.warningErrorLogs, 0);
      assert.equal(state.verdict, 'PASS');
    }
  }
  assert.equal(evidence.reciprocalChecks.length >= 3, true);
  for (const check of evidence.reciprocalChecks) {
    assert.equal(check.destinationH1Match, true);
    assert.equal(check.returned, true);
    assert.equal(check.verdict, 'PASS');
  }
  assert.deepEqual(evidence.svgAssets.map(({path}) => path), svgRoutes);
  assert.equal(evidence.svgAssets.every(({status, verdict}) => status === 200 && verdict === 'PASS'), true);
  assert.deepEqual(evidence.summary, {
    states: browserRoutes.length * evidence.viewports.length,
    passed: browserRoutes.length * evidence.viewports.length,
    failed: 0,
    warningErrorLogs: 0,
    documentOverflowFailures: 0,
    reciprocalChecks: evidence.reciprocalChecks.length,
    svgAssets: svgRoutes.length,
    screenshots: 2,
    verdict: 'PASS',
  });
});

test('closes the 17-item backlog and review only after production PASS', () => {
  const deployment = readJson(DEPLOYMENT_PATH);
  const backlog = readFileSync('docs/content-backlog.md', 'utf8');
  const review = readFileSync('docs/reviews/agentic-architecture-topic-system.md', 'utf8');
  const ids = [
    ...registry.concepts.map(({id}) => id),
    ...registry.patterns.map(({id}) => id),
    'CASE-21', 'CASE-22', 'CASE-23',
  ];
  for (const id of ids) {
    const lines = backlog.split(/\r?\n/u).filter((line) => line.startsWith(`- [x] **${id} `));
    assert.equal(lines.length, 1, `${id} has one closed backlog row`);
    assert.ok(lines[0].includes(RELEASE_SHA), `${id} names the release SHA`);
    assert.ok(lines[0].includes(String(deployment.workflow.runId)), `${id} names the Pages run`);
  }
  assert.match(review, new RegExp(`Production release SHA: \\x60${RELEASE_SHA}\\x60\\.`, 'u'));
  assert.match(review, new RegExp(`GitHub Pages run: \\x60${deployment.workflow.runId}\\x60`, 'u'));
  assert.match(review, /Production Browser verdict: `PASS`\./u);
  assert.match(review, /Final publication verdict: `PASS`\./u);
});
