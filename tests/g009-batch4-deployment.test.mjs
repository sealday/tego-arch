import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import test from 'node:test';

const [backlog, article, review, manifest, indexes, projectStatus, publicLedger] = await Promise.all([
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../content/styles/sty-03-vertical-slice-architecture.mdx', import.meta.url), 'utf8'),
  readFile(new URL('../docs/reviews/g009-batch4.md', import.meta.url), 'utf8'),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const STY03_ROUTE = '/styles/sty-03';
const STY03_ASSET = '/img/diagrams/sty-03-vertical-slice-boundary.svg';
const deploymentInventory = {
  routes: manifest.topics.filter(({published}) => published).map(({slug}) => slug),
  assets: [...article.matchAll(/\]\((\/img\/[^)]+)\)/gu)].map(([, asset]) => asset),
};

test('preserves the STY-03 closure under the current STY-04 closure', () => {
  const currentBaseline = backlog.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  assert.match(currentBaseline, /G009 Batch 5 已完成 STY-04/u);
  assert.match(currentBaseline, /当前 G009，下一项为 STY-05/u);
  assert.match(backlog, /^- \[x\] \*\*STY-03 /mu);
  assert.match(backlog, /^- \[x\] \*\*STY-04 /mu);
  assert.match(backlog, /^- \[ \] \*\*STY-05 /mu);
});

test('projects both STY-03 and STY-04 complete', () => {
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styleTopics = new Map(indexes.style.map((topic) => [topic.id, topic]));

  assert.equal(topics.get('STY-03')?.published, true);
  assert.equal(topics.get('STY-03')?.status.value, 'complete');
  assert.equal(styleTopics.get('STY-03')?.published, true);
  assert.equal(styleTopics.get('STY-03')?.status.value, 'complete');
  assert.equal(topics.get('STY-04')?.published, true);
  assert.equal(topics.get('STY-04')?.status.value, 'complete');
  assert.equal(styleTopics.get('STY-04')?.published, true);
  assert.equal(styleTopics.get('STY-04')?.status.value, 'complete');
});

test('retains the published corpus and closes the deployed topic', () => {
  assert.deepEqual(
    {
      completed_topics: projectStatus.completed_topics,
      content_documents: projectStatus.content_documents,
      governed_sources: projectStatus.governed_sources,
    },
    {
      completed_topics: 57,
      content_documents: 100,
      governed_sources: 519,
    },
  );
  assert.equal(publicLedger.sources.length, 519);
});

test('includes the canonical STY-03 route and SVG in the deployment inventory', async () => {
  assert.ok(deploymentInventory.routes.includes(STY03_ROUTE));
  assert.ok(deploymentInventory.assets.includes(STY03_ASSET));
  assert.equal(deploymentInventory.routes.includes('/styles/sty-04'), true);
  await access(new URL(`../static${STY03_ASSET}`, import.meta.url));
});

test('records exact successful Stage A deployment, production QA, and Stage B closure', () => {
  assert.match(review, /Stage A exact head: `75b1838eb37d1bc41bc3260c6fc5f71cd2f9a00e`/u);
  assert.match(review, /Pages run: \[`31366156479`\]\(https:\/\/github\.com\/sealday\/tego-arch\/actions\/runs\/31366156479\)/u);
  assert.match(review, /build job `93384860162`; deploy job `93385369626`/u);
  assert.match(review, /https:\/\/sealday\.github\.io\/tego-arch\/styles\/sty-03/u);
  assert.match(review, /desktop `1440x1000`.*mobile `390x844`/su);
  assert.match(review, /1092\/1092/u);
  assert.match(review, /Production smoke verdict: \*\*PASS\*\*/u);
  assert.match(review, /STY-03 backlog checkbox: checked/u);
  assert.match(review, /STY-04 projected status: unpublished \/ pending/u);
  assert.match(review, /Stage B closure verdict: \*\*PASS\*\*/u);
  assert.doesNotMatch(review, /PARENT PRODUCTION QA REQUIRED|NOT RUN \/ NOT ACCEPTED|BLOCKED —/u);
});
