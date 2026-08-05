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
  for (const label of ['研究主题', '治理来源', '当前研究']) {
    assert.match(homepage, new RegExp(label, 'u'));
  }
  for (const field of [
    'content_documents',
    'governed_sources',
    'durable_stories.current',
  ]) {
    assert.match(homepage, new RegExp(field.replace('.', '\\.'), 'u'));
  }
  for (const removedField of [
    'durable_stories.completed',
    'durable_stories.total',
    'completed_topics',
  ]) {
    assert.doesNotMatch(homepage, new RegExp(removedField.replace('.', '\\.'), 'u'));
  }
  assert.doesNotMatch(homepage, /const projectStatus\s*=/u);
  assert.doesNotMatch(homepage, /to=["']\/status|href=["']\/status/u);
});

test('positions architecture judgment with the approved homepage actions', async () => {
  const homepage = await readFile(
    new URL('../src/pages/index.tsx', import.meta.url),
    'utf8',
  );

  assert.match(homepage, /<Heading as="h1">\s*在复杂系统里 做清醒的选择\s*<\/Heading>/u);
  assert.match(homepage, /从边界、状态、控制与质量属性出发，让每个架构决定都能解释、验证和演化/u);
  assert.match(homepage, /to="\/paths"[\s\S]*开始建立判断坐标/u);
  assert.match(homepage, /to="\/intro"[\s\S]*了解研究方法/u);
});
