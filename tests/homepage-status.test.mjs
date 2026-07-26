import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('renders canonical project status only from the generated projection', async () => {
  const homepage = await readFile(
    new URL('../src/pages/index.tsx', import.meta.url),
    'utf8',
  );

  assert.match(
    homepage,
    /from '@site\/src\/generated\/project-status\.json'/u,
  );
  assert.doesNotMatch(
    homepage,
    /from ['"][^'"]*(?:docs\/content-backlog|data\/source-ledger)|readFile|fetch\(/u,
  );
  for (const label of [
    '持久故事',
    '已完成主题',
    '内容文档',
    '治理来源',
    '当前故事',
  ]) {
    assert.match(homepage, new RegExp(label, 'u'));
  }
  for (const field of [
    'durable_stories.completed',
    'durable_stories.total',
    'durable_stories.current',
    'completed_topics',
    'content_documents',
    'governed_sources',
  ]) {
    assert.match(homepage, new RegExp(field.replace('.', '\\.'), 'u'));
  }
  assert.doesNotMatch(homepage, /const projectStatus\s*=/u);
  assert.doesNotMatch(homepage, /to=["']\/status|href=["']\/status/u);
});
