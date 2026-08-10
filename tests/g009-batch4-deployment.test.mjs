import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import test from 'node:test';

const [backlog, article, manifest, indexes, projectStatus, publicLedger] = await Promise.all([
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  readFile(new URL('../content/styles/sty-03-vertical-slice-architecture.mdx', import.meta.url), 'utf8'),
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

test('preserves STY-03 as the current pre-closure backlog target', () => {
  const currentBaseline = backlog.split(/\r?\n/u)
    .find((line) => line.startsWith('- **当前发布基线：**'));
  assert.ok(currentBaseline, 'current release baseline');
  assert.match(currentBaseline, /当前 G009，下一项为 STY-03/u);
  assert.match(backlog, /^- \[ \] \*\*STY-03 /mu);
  assert.match(backlog, /^- \[ \] \*\*STY-04 /mu);
});

test('projects STY-03 published but pending while keeping STY-04 unpublished', () => {
  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styleTopics = new Map(indexes.style.map((topic) => [topic.id, topic]));

  assert.equal(topics.get('STY-03')?.published, true);
  assert.equal(topics.get('STY-03')?.status.value, 'pending');
  assert.equal(styleTopics.get('STY-03')?.published, true);
  assert.equal(styleTopics.get('STY-03')?.status.value, 'pending');
  assert.equal(topics.get('STY-04')?.published, false);
  assert.equal(topics.get('STY-04')?.status.value, 'pending');
  assert.equal(styleTopics.get('STY-04')?.published, false);
  assert.equal(styleTopics.get('STY-04')?.status.value, 'pending');
});

test('adds one document and two sources without closing the topic before deployment', () => {
  assert.deepEqual(
    {
      completed_topics: projectStatus.completed_topics,
      content_documents: projectStatus.content_documents,
      governed_sources: projectStatus.governed_sources,
    },
    {
      completed_topics: 55,
      content_documents: 97 + 1,
      governed_sources: 506 + 2,
    },
  );
  assert.equal(publicLedger.sources.length, 506 + 2);
});

test('includes the canonical STY-03 route and SVG in the deployment inventory', async () => {
  assert.ok(deploymentInventory.routes.includes(STY03_ROUTE));
  assert.ok(deploymentInventory.assets.includes(STY03_ASSET));
  assert.equal(deploymentInventory.routes.includes('/styles/sty-04'), false);
  await access(new URL(`../static${STY03_ASSET}`, import.meta.url));
});
