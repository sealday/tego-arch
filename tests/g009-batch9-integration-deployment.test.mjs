import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const [status, manifest, indexes, publicLedger] = await Promise.all([
  readFile(new URL('src/generated/project-status.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('src/generated/topic-manifest.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('src/generated/topic-indexes.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/source-ledger.json', root), 'utf8').then(JSON.parse),
]);

test('projects the combined STY-08 and MTH-07 Stage A truth', () => {
  assert.deepEqual(
    {
      completed: status.completed_topics,
      documents: status.content_documents,
      sources: status.governed_sources,
    },
    {completed: 60, documents: 104, sources: 539},
  );
  assert.equal(publicLedger.sources.length, 539);

  const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));
  const styles = new Map(indexes.style.map((topic) => [topic.id, topic]));
  const methods = new Map(indexes.method.map((topic) => [topic.id, topic]));
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
});
