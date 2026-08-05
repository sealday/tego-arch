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

test('positions experienced engineers for architecture design with the learning-path CTA', async () => {
  const homepage = await readFile(
    new URL('../src/pages/index.tsx', import.meta.url),
    'utf8',
  );

  assert.match(
    homepage,
    /<Heading as="h1">从高级工程师到架构设计者。<\/Heading>/u,
  );
  assert.match(
    homepage,
    /<p className=\{styles\.lede\}>\s*面向有经验的高级工程师，用证据、权衡与真实案例训练从实现到架构决策的能力。\s*<\/p>/u,
  );
  assert.match(
    homepage,
    /<Link className=\{styles\.primaryAction\} to="\/paths">\s*沿学习路径开始/u,
  );
  assert.match(
    homepage,
    /<Link\s+className=\{styles\.secondaryAction\}\s+href="https:\/\/github\.com\/sealday\/tego-arch#参与贡献">\s*参与贡献/u,
  );
  assert.match(homepage, /五步读懂一个软件架构主题/u);
  assert.doesNotMatch(homepage, /浏览首发案例/u);
  assert.doesNotMatch(homepage, /五步读透一个多智能体系统/u);
  assert.doesNotMatch(
    homepage,
    /description="[^"]*AI 多智能体系统的控制权/u,
  );
});
