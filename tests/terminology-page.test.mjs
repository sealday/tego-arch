import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('publishes one registry-driven terminology policy page', async () => {
  const [page, component, styles] = await Promise.all([
    source('content/terminology.mdx'),
    source('src/components/TerminologyIndex/index.tsx'),
    source('src/components/TerminologyIndex/styles.module.css'),
  ]);

  assert.match(page, /^title: 术语规范$/mu);
  assert.match(page, /^slug: \/terminology$/mu);
  assert.match(page, /^sidebar_position: 13$/mu);
  assert.match(page, /^content_type: reference$/mu);
  assert.match(page, /中文（English，ACRONYM）/u);
  assert.match(page, /代码、命令、路径、标识符与字段名/u);
  assert.match(page, /文献原题/u);
  assert.match(page, /图中文字/u);
  assert.match(page, /贡献流程/u);
  assert.match(page, /<TerminologyIndex\s*\/>/u);
  assert.doesNotMatch(page, /\|\s*质量属性\s*\|/u);

  assert.match(component, /@site\/data\/terminology\.json/u);
  assert.match(
    component,
    /\.sort\(\s*\(left, right\) => left\.order - right\.order,?\s*\)/su,
  );
  assert.match(component, /role="region"/u);
  assert.match(component, /aria-label="规范术语表"/u);
  assert.match(component, /tabIndex=\{0\}/u);
  assert.match(component, /<th scope="row">\{term\.canonical_zh\}<\/th>/u);

  assert.match(styles, /\.tableRegion\s*\{[^}]*overflow-x:\s*auto;[^}]*\}/su);
  assert.match(styles, /\.tableRegion\s*\{[^}]*max-width:\s*100%;[^}]*\}/su);
  assert.match(styles, /\.tableRegion table\s*\{[^}]*min-width:\s*52rem;[^}]*\}/su);
  assert.doesNotMatch(styles, /(?:html|body)\s*\{/u);
});

test('documents the contributor-facing terminology rules without becoming a glossary', async () => {
  const page = await source('content/terminology.mdx');

  for (const heading of [
    '中文优先',
    '首次出现与后续使用',
    '专名与缩写',
    '代码、命令、路径、标识符与字段名',
    '文献原题',
    '图中文字',
    '贡献流程',
  ]) {
    assert.match(page, new RegExp(`^## ${heading}$`, 'mu'));
  }

  assert.match(page, /data\/terminology\.json/u);
  assert.match(page, /不要在本页手工维护第二份术语表/u);
  assert.doesNotMatch(page, /^## (?:术语定义|概念定义|事实来源)$/mu);
});

test('registers the terminology page copyright review without inventing citations', async () => {
  const ledger = JSON.parse(await source('data/source-ledger.json'));

  assert.deepEqual(ledger.documents['content/terminology.mdx'], {
    reviewed_at: '2026-08-07',
    copyright_checks: [
      'original-structure',
      'quotation-boundary',
      'attribution-complete',
      'illustration-rights',
    ],
    citations: [],
  });
});
