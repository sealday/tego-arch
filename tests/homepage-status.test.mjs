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

test('introduces the complete architecture knowledge map to experienced developers', async () => {
  const homepage = await readFile(
    new URL('../src/pages/index.tsx', import.meta.url),
    'utf8',
  );

  assert.match(
    homepage,
    /为有开发经验、第一次系统学习架构的工程师/u,
  );
  assert.match(homepage, /从真实系统、成熟方法与可核验的证据出发/u);
  for (const subject of [
    '概念',
    '质量属性',
    '方法',
    '模式',
    '架构风格',
    '真实案例',
  ]) {
    assert.match(homepage, new RegExp(subject, 'u'));
  }
  assert.match(homepage, /浏览架构案例/u);
  assert.match(homepage, /五步读懂一个软件架构主题/u);
  assert.doesNotMatch(homepage, /浏览首发案例/u);
  assert.doesNotMatch(homepage, /五步读透一个多智能体系统/u);
  assert.doesNotMatch(
    homepage,
    /description="[^"]*AI 多智能体系统的控制权/u,
  );
});
