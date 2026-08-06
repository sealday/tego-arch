import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertCompleteRegistryProjection(component, registry) {
  assert.equal(
    [...component.matchAll(/@site\/data\/terminology\.json/gu)].length,
    1,
    'the canonical registry must have exactly one import',
  );
  assert.match(
    component,
    /import terminology from '@site\/data\/terminology\.json';/u,
  );
  assert.match(
    component,
    /const terms = \[\.\.\.terminology\.terms\]\.sort\(\s*\(left, right\) => left\.order - right\.order,?\s*\);/su,
  );
  assert.doesNotMatch(
    component,
    /(?:terminology\.terms|\bterms)\.(?:filter|slice|splice|pop|shift)\(/u,
  );
  assert.match(
    component,
    /\{terms\.map\(\(term\) => \(\s*<tr key=\{term\.id\}>\s*<th scope="row">\{term\.canonical_zh\}<\/th>\s*<td>\{term\.first_use\}<\/td>\s*<td>\{term\.subsequent_use\.join\('、'\)\}<\/td>\s*<td>\{term\.note\}<\/td>\s*<\/tr>\s*\)\)\}/su,
  );

  for (const term of registry.terms) {
    for (const value of [
      term.canonical_zh,
      term.first_use,
      ...term.subsequent_use,
      term.note,
    ]) {
      assert.doesNotMatch(
        component,
        new RegExp(escapeRegExp(value), 'u'),
        `registry value must be projected, not copied: ${value}`,
      );
    }
  }
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
  assert.match(page, /代码、命令、网址、路径、程序标识符、配置键与字段名/u);
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
    '代码、命令、网址、路径、程序标识符、配置键与字段名',
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

test('enforces one first-use form, mandatory Chinese context for proper nouns, and exact text exceptions', async () => {
  const page = await source('content/terminology.mdx');
  const frontMatter = page.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? '';

  assert.match(
    page,
    /同一页面完成首次说明后，后续只使用规范中文、已说明的缩写或注册表允许的专名。/u,
  );
  assert.doesNotMatch(page, /可在该局部重新给出完整形式/u);
  assert.match(
    page,
    /专名保留官方名称，但在同一页面首次出现时必须用中文上下文说明其类别或意义。/u,
  );
  assert.match(
    page,
    /以下文字保持原样：代码、命令、网址、路径、程序标识符、配置键、字段名、文献原题和直接引文。/u,
  );
  assert.match(page, /图中文字不属于上述文字例外，仍须遵守中文优先规则。/u);
  assert.doesNotMatch(page, /API 字段/u);

  assert.match(frontMatter, /^agent_patterns: \[\]$/mu);
  assert.match(frontMatter, /^protocols: \[\]$/mu);
  assert.doesNotMatch(
    frontMatter,
    /(?:supervisor|handoff|hierarchical-teams|A2A|MCP)/u,
  );
});

test('projects every canonical registry row and field through one mutation-sensitive mapping', async () => {
  const [component, registryText] = await Promise.all([
    source('src/components/TerminologyIndex/index.tsx'),
    source('data/terminology.json'),
  ]);
  const registry = JSON.parse(registryText);

  assert.ok(registry.terms.length > 0);
  assertCompleteRegistryProjection(component, registry);

  const mutations = [
    component.replace('terminology.terms', 'terminology.terms.slice(0, 1)'),
    component.replace('term.canonical_zh', 'term.id'),
    component.replace('term.first_use', 'term.id'),
    component.replace("term.subsequent_use.join('、')", 'term.id'),
    component.replace('term.note', 'term.id'),
    component.replace('return (', 'terms.pop();\n\n  return ('),
    `${component}\nimport duplicate from '@site/data/terminology.json';\n`,
  ];

  for (const mutant of mutations) {
    assert.throws(() => assertCompleteRegistryProjection(mutant, registry));
  }
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
