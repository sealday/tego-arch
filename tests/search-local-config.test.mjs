import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const requiredTerms = [
  '限界上下文',
  '事件风暴',
  '模块化单体',
  '微前端',
  '架构适应度函数',
  '智能体循环',
];

test('configures Chinese-first static docs search without external AI', async () => {
  const [packageSource, config] = await Promise.all([
    read('package.json'),
    read('docusaurus.config.ts'),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.equal(
    packageJson.dependencies['@easyops-cn/docusaurus-search-local'],
    '0.55.3',
  );
  assert.match(config, /from 'node:path'/u);
  assert.match(config, /'@easyops-cn\/docusaurus-search-local'/u);
  assert.match(config, /indexDocs:\s*true/u);
  assert.match(config, /indexBlog:\s*false/u);
  assert.match(config, /indexPages:\s*false/u);
  assert.match(config, /docsRouteBasePath:\s*'\/'/u);
  assert.match(config, /docsDir:\s*'content'/u);
  assert.match(config, /language:\s*\['en', 'zh'\]/u);
  assert.match(config, /hashed:\s*'filename'/u);
  assert.match(config, /searchResultLimits:\s*8/u);
  assert.match(config, /searchResultContextMaxLength:\s*80/u);
  assert.match(config, /explicitSearchResultPath:\s*true/u);
  assert.match(config, /fuzzyMatchingDistance:\s*1/u);
  assert.match(config, /highlightSearchTermsOnTargetPage:\s*false/u);
  assert.match(config, /searchBarShortcutKeymap:\s*'mod\+k'/u);
  assert.match(
    config,
    /\{type:\s*'search',\s*position:\s*'right'\},\s*\{href:\s*repositoryUrl/u,
  );
  assert.match(
    config,
    /zhUserDictPath:\s*path\.resolve\('src\/search\/zh-user-dict\.txt'\)/u,
  );
  assert.doesNotMatch(config, /askAi\s*:/u);
});

test('keeps a focused and valid Jieba architecture dictionary', async () => {
  const dictionary = await read('src/search/zh-user-dict.txt');
  const lines = dictionary
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  assert.ok(lines.length >= 30 && lines.length <= 50);
  assert.equal(new Set(lines).size, lines.length, 'dictionary terms must be unique');
  for (const line of lines) {
    assert.match(line, /^[^\s]+(?:\s+\d+)?(?:\s+[A-Za-z]+)?$/u);
  }
  for (const term of requiredTerms) {
    assert.ok(lines.includes(term), `missing required search term: ${term}`);
  }
});
