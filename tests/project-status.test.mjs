import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {parseBacklogTopics} from '../scripts/backlog-topics.mjs';
import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {
  buildProjectStatus,
  parseDurableStoryStatus,
} from '../scripts/project-status.mjs';
import {parseSourceLedger} from '../scripts/source-ledger.mjs';

const declarations = [
  '- **持久故事进度：** 已完成 `7 / 20`；最近完成 `G007`。',
  '- **当前持久故事：** `G008`。',
].join('\n');

test('builds status from canonical input collections', () => {
  const status = buildProjectStatus({
    backlogSource: declarations,
    topics: [
      {id: 'FND-01', complete: true},
      {id: 'FND-02', complete: false},
    ],
    documents: [{file: 'one.mdx'}, {file: 'two.mdx'}],
    ledger: {sources: [{id: 'src-1'}, {id: 'src-2'}, {id: 'src-3'}]},
  });

  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 7, total: 20, current: 'G008'},
    completed_topics: 1,
    content_documents: 2,
    governed_sources: 3,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
});

test('requires one exact durable-story baseline', () => {
  for (const invalid of [
    '',
    `${declarations}\n${declarations}`,
    declarations.replace('7 / 20', '6 / 20'),
    declarations.replace('G007', 'G008'),
  ]) {
    assert.throws(() => parseDurableStoryStatus(invalid), /durable story/u);
  }
});

test('rejects a valid declaration followed by a malformed duplicate label', () => {
  for (const duplicate of [
    '- **持久故事进度：** 已完成很多故事。',
    '- **当前持久故事：** G008。',
  ]) {
    assert.throws(
      () => parseDurableStoryStatus(`${declarations}\n${duplicate}`),
      /exactly one durable story progress and current story declaration/u,
    );
  }
});

test('rejects a valid declaration followed by a contradictory duplicate', () => {
  for (const duplicate of [
    '- **持久故事进度：** 已完成 `4 / 20`；最近完成 `G004`。',
    '- **当前持久故事：** `G007`。',
  ]) {
    assert.throws(
      () => parseDurableStoryStatus(`${declarations}\n${duplicate}`),
      /exactly one durable story progress and current story declaration/u,
    );
  }
});

test('reports an exact-format error for a unique malformed declaration', () => {
  assert.throws(
    () =>
      parseDurableStoryStatus(
        declarations.replace(
          '- **当前持久故事：** `G008`。',
          '- **当前持久故事：** G008。',
        ),
      ),
    /exact durable story declaration format/u,
  );
});

test('rejects malformed canonical collections', () => {
  const input = {
    backlogSource: declarations,
    topics: [{id: 'FND-01', complete: true}],
    documents: [],
    ledger: {sources: []},
  };
  assert.throws(
    () => buildProjectStatus({...input, topics: [...input.topics, ...input.topics]}),
    /duplicate topic ID/u,
  );
  assert.throws(
    () => buildProjectStatus({...input, documents: {}}),
    /documents must be an array/u,
  );
  assert.throws(
    () => buildProjectStatus({...input, ledger: {}}),
    /ledger sources must be an array/u,
  );
});

test('projects the real repository status without rewriting historical evidence', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const backlogSource = await readFile(
    new URL('../docs/content-backlog.md', import.meta.url),
    'utf8',
  );
  const parsedBacklog = parseBacklogTopics(backlogSource, 'docs/content-backlog.md');
  const documents = await readContentDocuments(`${root}/content`);
  const parsedLedger = parseSourceLedger(
    JSON.parse(await readFile(new URL('../data/source-ledger.json', import.meta.url))),
  );

  assert.deepEqual(parsedBacklog.errors, []);
  assert.deepEqual(parsedLedger.errors, []);
  assert.deepEqual(
    buildProjectStatus({
      backlogSource,
      topics: parsedBacklog.topics,
      documents,
      ledger: parsedLedger.ledger,
    }),
    {
      schema_version: 1,
      durable_stories: {completed: 7, total: 20, current: 'G008'},
      completed_topics: 46,
      content_documents: 89,
      governed_sources: 476,
      sources: {
        durable_stories: 'docs/content-backlog.md',
        completed_topics: 'docs/content-backlog.md',
        content_documents: 'content/**/*.{md,mdx}',
        governed_sources: 'data/source-ledger.json',
      },
    },
  );
  assert.match(backlogSource, /https:\/\/sealday\.github\.io\/tego-arch\//u);
  assert.match(backlogSource, /https:\/\/sealday\.github\.io\/agentic-architecture-atlas\//u);
});
