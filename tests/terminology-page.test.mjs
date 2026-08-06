import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import test from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';

const root = new URL('../', import.meta.url);
const require = createRequire(import.meta.url);
const ts = require('typescript');

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

function loadTerminologyModule(component, registry) {
  const {outputText} = ts.transpileModule(component, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = {exports: {}};
  const localRequire = (specifier) => {
    if (specifier === '@site/data/terminology.json') {
      return registry;
    }
    if (specifier === './styles.module.css') {
      return {tableRegion: 'tableRegion'};
    }
    return require(specifier);
  };

  Function('require', 'module', 'exports', outputText)(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}

function injectFunctionStatement(component, functionName, statement) {
  const syntax = ts.createSourceFile(
    'TerminologyIndex.tsx',
    component,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let insertionPoint = null;

  function visit(node) {
    if (
      ts.isFunctionDeclaration(node)
      && node.name?.text === functionName
      && node.body
    ) {
      insertionPoint = node.body.getStart(syntax) + 1;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  assert.notEqual(insertionPoint, null, `${functionName} function body`);

  return `${component.slice(0, insertionPoint)}\n  ${statement}${component.slice(insertionPoint)}`;
}

function assertRenderedTerms(markup, terms) {
  const rows = [...markup.matchAll(
    /<tr data-term-id="([^"]+)">([\s\S]*?)<\/tr>/gu,
  )].map((match) => ({id: match[1], content: match[2]}));
  const expected = [...terms].sort((left, right) => left.order - right.order);

  assert.deepEqual(rows.map(({id}) => id), expected.map(({id}) => id));
  assert.equal(new Set(rows.map(({id}) => id)).size, expected.length);

  for (const [index, term] of expected.entries()) {
    const row = rows[index];
    assert.ok(row.content.includes(`>${term.canonical_zh}</th>`), term.id);
    assert.ok(row.content.includes(`<td>${term.first_use}</td>`), term.id);
    assert.ok(
      row.content.includes(`<td>${term.subsequent_use.join('、')}</td>`),
      term.id,
    );
    assert.ok(row.content.includes(`<td>${term.note}</td>`), term.id);
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

test('renders every injected and canonical registry row exactly once without truncation', async () => {
  const [component, registryText] = await Promise.all([
    source('src/components/TerminologyIndex/index.tsx'),
    source('data/terminology.json'),
  ]);
  const registry = JSON.parse(registryText);
  const fixture = [
    {
      id: 'third',
      canonical_zh: '第三项',
      first_use: '第三项（Third）',
      subsequent_use: ['第三项', 'T'],
      note: '第三项边界',
      order: 30,
    },
    {
      id: 'first',
      canonical_zh: '第一项',
      first_use: '第一项（First）',
      subsequent_use: ['第一项'],
      note: '第一项边界',
      order: 10,
    },
    {
      id: 'second',
      canonical_zh: '第二项',
      first_use: '第二项（Second）',
      subsequent_use: ['第二项', 'S'],
      note: '第二项边界',
      order: 20,
    },
  ];
  const registryImports = component.match(
    /\bfrom\s+["']@site\/data\/terminology\.json["']/gu,
  ) ?? [];
  const expectedFixture = structuredClone(fixture);

  assert.equal(registryImports.length, 1);

  const injectedModule = loadTerminologyModule(component, {terms: []});
  assert.equal(typeof injectedModule.TerminologyTable, 'function');
  const injectedMarkup = renderToStaticMarkup(
    injectedModule.TerminologyTable({terms: fixture}),
  );
  assertRenderedTerms(injectedMarkup, expectedFixture);
  assert.deepEqual(fixture, expectedFixture);
  assert.match(injectedMarkup, /role="region"/u);
  assert.match(injectedMarkup, /aria-label="规范术语表"/u);
  assert.match(injectedMarkup, /tabindex="0"/u);
  assert.match(injectedMarkup, /<th scope="row">/u);

  const canonicalModule = loadTerminologyModule(component, registry);
  assert.ok(registry.terms.length > 0);
  assertRenderedTerms(
    renderToStaticMarkup(canonicalModule.default()),
    registry.terms,
  );

  const lengthMutation = injectFunctionStatement(
    component,
    'TerminologyTable',
    'terms.length = 1;',
  );
  const mutantModule = loadTerminologyModule(lengthMutation, {terms: []});
  const mutantFixture = structuredClone(expectedFixture);
  assert.throws(() =>
    assertRenderedTerms(
      renderToStaticMarkup(
        mutantModule.TerminologyTable({terms: mutantFixture}),
      ),
      expectedFixture,
    ));
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
