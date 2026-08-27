import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

import {
  buildLineOffsets,
  checkTerminology,
  defaultPaths,
  lineFromOffsets,
  terminologyRuleOrder,
} from '../scripts/check-terminology.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const repositorySourceLedger = JSON.parse(
  await readFile(path.join(repositoryRoot, 'data/source-ledger.json'), 'utf8'),
);
const officialSource = repositorySourceLedger.sources.find(
  ({id}) => id === 'src-sei-quality-attributes',
);
const officialLocator = officialSource.canonical_locator;
const localIllustrationSource = repositorySourceLedger.sources.find(
  ({source_kind: sourceKind}) => sourceKind === 'original-illustration',
);

const terms = [
  {
    id: 'quality-attribute',
    canonical_zh: '质量属性',
    english: 'Quality Attribute',
    acronym: null,
    kind: 'translated-term',
    first_use: '质量属性（Quality Attribute）',
    subsequent_use: ['质量属性'],
    allowed_aliases: [],
    forbidden_aliases: ['quality attribute', 'Quality Attribute'],
    note: '测试普通译名。',
    order: 10,
  },
  {
    id: 'architecturally-significant-requirement',
    canonical_zh: '架构重要需求',
    english: 'Architecturally Significant Requirement',
    acronym: 'ASR',
    kind: 'acronym',
    first_use: '架构重要需求（Architecturally Significant Requirement，ASR）',
    subsequent_use: ['架构重要需求', 'ASR'],
    allowed_aliases: [],
    forbidden_aliases: [
      'Architecturally Significant Requirement',
      'architecture significant requirement',
    ],
    note: '测试缩写。',
    order: 20,
  },
  {
    id: 'application-programming-interface',
    canonical_zh: '应用程序编程接口',
    english: 'Application Programming Interface',
    acronym: 'API',
    kind: 'acronym',
    first_use: '应用程序编程接口（Application Programming Interface，API）',
    subsequent_use: ['应用程序编程接口', 'API'],
    allowed_aliases: [],
    forbidden_aliases: ['Application Programming Interface'],
    note: '测试中文夹杂缩写。',
    order: 30,
  },
  {
    id: 'tego-arch',
    canonical_zh: 'Tego Arch',
    english: null,
    acronym: null,
    kind: 'proper-noun',
    first_use: 'Tego Arch 架构知识项目',
    subsequent_use: ['Tego Arch', '本项目'],
    allowed_aliases: ['Tego Arch'],
    forbidden_aliases: [],
    note: '测试登记的产品专名。',
    order: 40,
  },
];

const withFixture = async (files, callback, registryTerms = terms) => {
  const root = await mkdtemp(path.join(tmpdir(), 'terminology-policy-'));
  try {
    await mkdir(path.join(root, 'data'), {recursive: true});
    await writeFile(
      path.join(root, 'data/terminology.json'),
      JSON.stringify({schema_version: 1, terms: registryTerms}),
    );
    await writeFile(
      path.join(root, 'data/source-ledger.json'),
      JSON.stringify({
        schema_version: 1,
        sources: [officialSource],
        documents: {},
      }),
    );
    for (const [file, source] of Object.entries(files)) {
      const target = path.join(root, file);
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, source);
    }
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
};

const checkFixture = (source, file = 'content/example.mdx') => withFixture(
  {[file]: source},
  (root) => checkTerminology({root, paths: [file]}),
);

test('publishes the stable terminology issue rule order', () => {
  assert.deepEqual(terminologyRuleOrder, [
    'registry-error',
    'parse-error',
    'bare-english-term',
    'first-use-required',
    'unknown-english-term',
    'invalid-suppression',
  ]);
});

test('limits the default terminology governance gate to reader-facing entry points', () => {
  assert.deepEqual(defaultPaths, [
    'README.md',
    'content',
    'src/pages/index.tsx',
  ]);
});

test('default terminology checks cover all repository reader-facing entry points', async () => {
  const result = await checkTerminology({root: repositoryRoot});
  assert.equal(result.checkedFiles.length, 123);
  assert.deepEqual(result.issues, []);
});

test('no-argument CLI checks the repository default terminology scope', () => {
  const run = spawnSync(
    process.execPath,
    [path.join(repositoryRoot, 'scripts/check-terminology.mjs')],
    {cwd: repositoryRoot, encoding: 'utf8'},
  );
  assert.equal(run.status, 0, run.stdout || run.stderr);
  assert.equal(run.stderr, '');
  assert.match(run.stdout, /checked 123 files with 163 registered terms; 0 issues/u);

});

test('accepts governed Saga and reports it as unknown when the registry entry is removed', async () => {
  const registry = JSON.parse(
    await readFile(path.join(repositoryRoot, 'data/terminology.json'), 'utf8'),
  );
  const saga = registry.terms.find(({id}) => id === 'saga');
  const source = 'Saga 用一系列本地事务协调业务过程。后续 Saga 由中文语境解释补偿与恢复边界。';
  const governed = await withFixture(
    {'content/example.mdx': source},
    (root) => checkTerminology({root, paths: ['content/example.mdx']}),
    [...terms, saga],
  );
  assert.deepEqual(governed.issues, []);

  const mutated = await withFixture(
    {'content/example.mdx': source},
    (root) => checkTerminology({root, paths: ['content/example.mdx']}),
    [...terms, {...saga, subsequent_use: []}],
  );
  assert.deepEqual(mutated.issues.map(({ruleId, matched, expected}) => ({ruleId, matched, expected})), [
    {ruleId: 'first-use-required', matched: 'Saga', expected: 'Saga'},
  ]);

  const removed = await checkFixture(source);
  assert.ok(removed.issues.length > 0);
  assert.ok(removed.issues.every(({ruleId, matched}) => (
    ruleId === 'unknown-english-term' && matched === 'Saga'
  )));
});

test('requires bilingual first use and permits registered subsequent use', async () => {
  const result = await checkFixture('质量属性（Quality Attribute）决定取舍。后续质量属性继续使用。');
  assert.deepEqual(result.issues, []);
});

test('reports a repeated first-use display after the term is introduced', async () => {
  const result = await checkFixture('质量属性（Quality Attribute）决定取舍。后续再写质量属性（Quality Attribute）。');
  assert.deepEqual(result.issues.map(({ruleId, matched, expected}) => ({ruleId, matched, expected})), [
    {
      ruleId: 'first-use-required',
      matched: '质量属性（Quality Attribute）',
      expected: '质量属性',
    },
  ]);
});

test('governs STRIDE without claiming the generic Chinese threat-modeling phrase', async () => {
  const registry = JSON.parse(
    await readFile(path.join(repositoryRoot, 'data/terminology.json'), 'utf8'),
  );
  const stride = registry.terms.find(({id}) => id === 'stride-threat-modeling');
  assert.deepEqual(stride.subsequent_use, ['STRIDE']);
  const result = await withFixture(
    {
      'content/generic.mdx': '威胁建模需要持续复查。',
      'content/premature.mdx': 'STRIDE 可以帮助分类威胁。',
      'content/introduced.mdx': 'STRIDE 威胁建模用于提出问题，后续 STRIDE 分类继续使用。',
    },
    (root) => checkTerminology({root, paths: ['content']}),
    [...terms, stride],
  );
  assert.deepEqual(result.issues.map(({file, ruleId, matched, expected}) => ({
    file,
    ruleId,
    matched,
    expected,
  })), [
    {
      file: 'content/premature.mdx',
      ruleId: 'first-use-required',
      matched: 'STRIDE',
      expected: 'STRIDE 威胁建模',
    },
  ]);
});

test('reports the forbidden Chinese human-in-the-loop alias', async () => {
  const humanInTheLoop = {
    id: 'human-in-the-loop',
    canonical_zh: '人在回路',
    english: 'Human-in-the-loop',
    acronym: null,
    kind: 'translated-term',
    first_use: '人在回路（Human-in-the-loop）',
    subsequent_use: ['人在回路'],
    allowed_aliases: [],
    forbidden_aliases: ['Human-in-the-loop', '人工在环'],
    note: '测试人在回路译名。',
    order: 50,
  };
  const result = await withFixture(
    {'content/example.mdx': '人工在环不能代替接管边界。'},
    (root) => checkTerminology({root, paths: ['content/example.mdx']}),
    [...terms, humanInTheLoop],
  );
  assert.deepEqual(result.issues.map(({ruleId, matched, expected}) => ({ruleId, matched, expected})), [
    {
      ruleId: 'bare-english-term',
      matched: '人工在环',
      expected: '人在回路（Human-in-the-loop）',
    },
  ]);
});

test('reports bare, unknown, and premature acronym uses together in stable rule order', async () => {
  const result = await checkFixture('Quality Attribute 与 ASR 影响 unknown worker。');
  assert.deepEqual(result.issues.map(({ruleId}) => ({ruleId})), [
    {ruleId: 'bare-english-term'},
    {ruleId: 'first-use-required'},
    {ruleId: 'unknown-english-term'},
  ]);
  assert.deepEqual(Object.keys(result.issues[0]), [
    'file', 'line', 'ruleId', 'matched', 'expected',
  ]);
});

test('reports a registered English full name when it is used bare', async () => {
  const result = await checkFixture('Architecturally Significant Requirement 需要说明。');
  assert.deepEqual(result.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'bare-english-term', matched: 'Architecturally Significant Requirement'},
  ]);
});

test('exempts literals, commands, paths, URLs, identifiers, fields, and registered citation titles', async () => {
  const result = await checkFixture([
    '`retry_count` 与 `config.worker.name`',
    '```bash\nnpm run verify -- --config ./worker.json\n```',
    `[Quality Attributes](${officialLocator})`,
    `[Quality Attributes][official]\n\n[official]: ${officialLocator}`,
    '> Direct quotation title',
    '字段 `worker_id` 通过 `/api/v1/workers` 访问。',
  ].join('\n\n'));
  assert.deepEqual(result.issues, []);
});

test('treats canonical topic identifiers as protected navigation literals', async () => {
  const result = await checkFixture('先阅读 MOD-13，再回到 PR-14 与 MTH-02。');
  assert.deepEqual(result.issues, []);
});

test('does not exempt arbitrary external link labels', async () => {
  const result = await checkFixture('[Unknown External Title](https://example.com/not-registered)');
  assert.deepEqual(result.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'Unknown External Title'},
  ]);
});

test('exempts only explicitly registered citation title variants', async () => {
  const result = await checkFixture(
    `[SEI — Quality Attributes](${officialLocator}) 提供历史背景。`,
  );
  assert.deepEqual(result.issues, []);
});

test('does not hard-code case title or sidebar metadata exemptions', async () => {
  const result = await checkFixture([
    '---',
    'title: AWS Cell Architecture + Shuffle Sharding：限制故障半径',
    'sidebar_label: AWS Cell Architecture + Shuffle Sharding',
    '---',
  ].join('\n'));
  assert.ok(result.issues.some(({line, ruleId}) => line === 2 && ruleId === 'unknown-english-term'));
  assert.ok(result.issues.some(({line, ruleId}) => line === 3 && ruleId === 'unknown-english-term'));
});

test('governs case title identity and sidebar introduction through the registry', async () => {
  const identity = {
    id: 'example-product',
    canonical_zh: 'Example Product',
    english: null,
    acronym: null,
    kind: 'proper-noun',
    first_use: 'Example Product 智能体平台',
    subsequent_use: ['Example Product'],
    allowed_aliases: [],
    forbidden_aliases: [],
    note: '测试案例标题中的稳定官方身份。',
    order: 50,
  };
  const document = (title, sidebar = 'Example Product') => [
    '---',
    `title: ${title}`,
    `sidebar_label: ${sidebar}`,
    '---',
  ].join('\n');
  const result = await withFixture({
    'content/arbitrary.mdx': document('Example Product 智能体平台：任意自然中文判断句'),
    'content/changed.mdx': document('Altered Product 智能体平台：中文判断句'),
    'content/extra.mdx': document('Example Product 智能体平台：中文判断句 Extra Unknown'),
    'content/no-context.mdx': document('Example Product：中文判断句'),
    'content/sidebar-only.mdx': document('纯中文判断句'),
  }, (root) => checkTerminology({root, paths: ['content']}), [...terms, identity]);

  assert.equal(result.issues.some(({file}) => file === 'content/arbitrary.mdx'), false);
  assert.ok(result.issues.some(({file}) => file === 'content/changed.mdx'));
  assert.ok(result.issues.some(({file, matched}) => (
    file === 'content/extra.mdx' && matched === 'Extra Unknown'
  )));
  assert.ok(result.issues.some(({file, ruleId, matched}) => (
    file === 'content/no-context.mdx'
      && ruleId === 'first-use-required'
      && matched === 'Example Product'
  )));
  assert.ok(result.issues.some(({file, ruleId, matched}) => (
    file === 'content/sidebar-only.mdx'
      && ruleId === 'first-use-required'
      && matched === 'Example Product'
  )));
});

test('exempts only an exact external source title and never image alt text', async () => {
  const mismatch = await checkFixture(`[Quality Attribute](${officialLocator})`);
  assert.deepEqual(mismatch.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'bare-english-term', matched: 'Quality Attribute'},
  ]);

  const image = await checkFixture(
    `[![Quality Attributes](./cover.png)](${officialLocator})`,
  );
  assert.deepEqual(image.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'Quality Attributes'},
  ]);

  const nestedImage = await checkFixture(
    `[**![Quality Attributes](./cover.png)**](${officialLocator})`,
  );
  assert.deepEqual(nestedImage.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'Quality Attributes'},
  ]);

  await withFixture({
    'content/local.mdx': `[${localIllustrationSource.title}](${localIllustrationSource.canonical_locator})`,
  }, async (root) => {
    await writeFile(path.join(root, 'data/source-ledger.json'), JSON.stringify({
      schema_version: 1,
      sources: [localIllustrationSource],
      documents: {},
    }));
    const local = await checkTerminology({root, paths: ['content/local.mdx']});
    assert.ok(local.issues.some(({ruleId}) => ruleId === 'unknown-english-term'));
  });
});

test('does not grant citation exemptions from an invalid source ledger', async () => {
  await withFixture({'content/example.mdx': `[Unknown External Title](${officialLocator})`}, async (root) => {
    await writeFile(path.join(root, 'data/source-ledger.json'), JSON.stringify({
      schema_version: 1,
      sources: [{canonical_locator: officialLocator}],
      documents: {},
    }));
    const result = await checkTerminology({root, paths: ['content/example.mdx']});
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), [
      'unknown-english-term',
      'parse-error',
    ]);
  });
});

test('reports source-ledger read, JSON, and contract failures while continuing scans', async () => {
  const corruptions = [
    async (root) => rm(path.join(root, 'data/source-ledger.json')),
    async (root) => writeFile(path.join(root, 'data/source-ledger.json'), '{bad json'),
    async (root) => writeFile(path.join(root, 'data/source-ledger.json'), JSON.stringify({
      schema_version: 1,
      sources: [{canonical_locator: officialLocator}],
      documents: {},
    })),
  ];
  for (const corrupt of corruptions) {
    await withFixture({'content/example.mdx': 'unknown worker'}, async (root) => {
      await corrupt(root);
      const result = await checkTerminology({root, paths: ['content/example.mdx']});
      assert.deepEqual(result.issues.map(({file, ruleId}) => ({file, ruleId})), [
        {file: 'content/example.mdx', ruleId: 'unknown-english-term'},
        {file: 'data/source-ledger.json', ruleId: 'parse-error'},
      ]);
    });
  }
});

test('excludes complete AST blockquotes including compact and lazy continuation forms', async () => {
  const result = await checkFixture([
    '>Quoted English Title',
    'lazy continuation phrase',
    '',
    'outside worker',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({line, matched}) => ({line, matched})), [
    {line: 4, matched: 'outside worker'},
  ]);
});

test('tracks first use per file and follows front matter then body reader order', async () => {
  const result = await withFixture({
    'content/a.mdx': '---\ntitle: API 指南\n---\n应用程序编程接口（Application Programming Interface，API）随后 API。',
    'content/b.mdx': '---\ntitle: 应用程序编程接口（Application Programming Interface，API）\n---\nAPI 正文。',
  }, (root) => checkTerminology({root, paths: ['content']}));
  assert.deepEqual(result.checkedFiles, ['content/a.mdx', 'content/b.mdx']);
  assert.deepEqual(result.issues.map(({file, line, ruleId, matched}) => ({file, line, ruleId, matched})), [
    {file: 'content/a.mdx', line: 2, ruleId: 'first-use-required', matched: 'API'},
  ]);
});

test('checks Mermaid labels in source order without treating diagram identifiers as prose', async () => {
  const result = await checkFixture(`应用程序编程接口（Application Programming Interface，API）

\`\`\`mermaid
flowchart LR
  WorkerNode[API 网关] -->|unknown worker| TargetNode[完成]
\`\`\``);
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {line: 5, ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('excludes Mermaid model identifiers while checking reader-visible relationship labels', async () => {
  const result = await checkFixture(`
\`\`\`mermaid
erDiagram
  ExpenseClaim {
    string claimId
  }
  ExpenseClaim ||--o{ Approval : unknown relationship
\`\`\``);
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {line: 7, ruleId: 'unknown-english-term', matched: 'unknown relationship'},
  ]);
});

test('checks visible TSX strings but excludes imports, paths, props, and ordinary literals', async () => {
  const source = `import workerIcon from './unknown-worker.svg';
const config = {worker_id: 'unknown worker'};
export function Page() {
  return <main aria-label="质量属性（Quality Attribute）">
    <a href="/worker" data-field="worker_id">质量属性与 unknown worker</a>
  </main>;
}`;
  const result = await checkFixture(source, 'src/pages/example.tsx');
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {line: 5, ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('checks SVG and Draw.io visible labels and fails closed on malformed XML', async () => {
  await withFixture({
    'static/example.svg': `<svg xmlns="http://www.w3.org/2000/svg">
<title>hidden title phrase</title>
<defs><text>hidden definition phrase</text></defs>
<g style="display:none"><text>hidden ancestor phrase</text></g>
<text fill="none">hidden unpainted phrase</text>
<text>unknown worker <tspan visibility="hidden">hidden tspan phrase</tspan></text>
<path id="unknown-worker" d="M0 0"/>
</svg>`,
    'diagrams/example.drawio': '<mxfile><diagram name="Page-1"><mxGraphModel><root>\n<mxCell id="1" value="unknown router" vertex="1"/>\n<mxCell id="unknown-worker" value=""/>\n</root></mxGraphModel></diagram></mxfile>',
  }, async (root) => {
    const result = await checkTerminology({
      root,
      paths: ['static/example.svg', 'diagrams/example.drawio'],
    });
    assert.deepEqual(result.issues.map(({file, line, matched}) => ({file, line, matched})), [
      {file: 'diagrams/example.drawio', line: 2, matched: 'unknown router'},
      {file: 'static/example.svg', line: 6, matched: 'unknown worker'},
    ]);
  });

  for (const [file, source, message] of [
    ['static/broken.svg', '<svg><text>unknown worker</svg>', 'mismatched closing tag'],
    ['diagrams/broken.drawio', '<mxfile><diagram></mxfile>', 'mismatched closing tag'],
    [
      'static/entity.svg',
      '<svg xmlns="http://www.w3.org/2000/svg"><text>bad &unknown;</text></svg>',
      'unknown entity',
    ],
  ]) {
    const malformed = await checkFixture(source, file);
    assert.equal(malformed.issues.length, 1);
    assert.equal(malformed.issues[0].ruleId, 'parse-error');
    assert.match(malformed.issues[0].matched, new RegExp(message, 'u'));
  }
});

test('applies a suppression to exactly the next visible record and requires a real hit', async () => {
  const result = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: 官方界面原始标签 -->
unknown worker

second worker`);
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {line: 4, ruleId: 'unknown-english-term', matched: 'second worker'},
  ]);

  const unused = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: 官方界面原始标签 -->
纯中文内容`);
  assert.deepEqual(unused.issues.map(({ruleId}) => ruleId), ['invalid-suppression']);
});

test('accepts an exclusive MDX-native suppression directive', async () => {
  const result = await checkFixture(`{/* terminology-exempt: unknown-english-term | reason: 官方界面原始标签 */}
unknown worker`);
  assert.deepEqual(result.issues, []);
});

test('binds an exact-match suppression to one exact record and current file', async () => {
  const directive = '{/* terminology-exempt: unknown-english-term | match: ID | record: 插件 ID 与 CPU。 | reason: STY-10 固定合同字段字面量 */}';
  const result = await withFixture({
    'content/sty-10.mdx': `${directive}\n插件 ID 与 CPU。\n\n后续 ID。`,
    'content/unrelated.mdx': '另一个文件 ID。',
  }, (root) => checkTerminology({root, paths: ['content']}));
  assert.equal(result.issues.some(({file, line, matched}) => file === 'content/sty-10.mdx' && line === 2 && matched === 'ID'), false, 'exact ID hit is suppressed');
  assert.ok(result.issues.some(({file, line, matched}) => file === 'content/sty-10.mdx' && line === 2 && matched === 'CPU'), 'different term in the same record remains governed');
  assert.ok(result.issues.some(({file, line, matched}) => file === 'content/sty-10.mdx' && line === 4 && matched === 'ID'), 'later prose remains governed');
  assert.ok(result.issues.some(({file, matched}) => file === 'content/unrelated.mdx' && matched === 'ID'), 'unrelated files remain governed');
  assert.equal(result.issues.some(({ruleId}) => ruleId === 'invalid-suppression'), false, 'used exact suppression is valid');

  const changedMatch = await checkFixture(`${directive.replace('match: ID', 'match: deadline')}\n插件 ID 与 CPU。`);
  assert.ok(changedMatch.issues.some(({ruleId}) => ruleId === 'invalid-suppression'), 'non-matching exact suppression is rejected');
  assert.ok(changedMatch.issues.some(({ruleId, matched}) => ruleId === 'unknown-english-term' && matched === 'ID'), 'non-matching term remains governed');

  const changedRecord = await checkFixture(`${directive}\n插件 ID 与内存。`);
  assert.ok(changedRecord.issues.some(({ruleId}) => ruleId === 'invalid-suppression'), 'changed exact record invalidates the suppression');
  assert.ok(changedRecord.issues.some(({ruleId, matched}) => ruleId === 'unknown-english-term' && matched === 'ID'), 'changed record keeps the exact term governed');
});

test('rejects generic and consecutive bulk suppression directives', async () => {
  const generic = await checkFixture(`{/* terminology-exempt: unknown-english-term | reason: 引用原题、产品专名、主题标识或固定内容合同按原样保留 */}
unknown worker`);
  assert.deepEqual(generic.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 1, ruleId: 'invalid-suppression'},
    {line: 2, ruleId: 'unknown-english-term'},
  ]);

  const consecutive = await checkFixture(`{/* terminology-exempt: unknown-english-term | reason: 固定按钮原文 */}
{/* terminology-exempt: unknown-english-term | reason: 固定状态原文 */}
unknown worker`);
  assert.deepEqual(consecutive.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 1, ruleId: 'invalid-suppression'},
    {line: 2, ruleId: 'invalid-suppression'},
    {line: 3, ruleId: 'unknown-english-term'},
  ]);
});

test('ignores suppression-shaped text in fenced code, inline code, TS comments, and strings', async () => {
  const directive = '<!-- terminology-exempt: unknown-english-term | reason: 测试 -->';
  const markdown = await checkFixture([
    `\`\`\`text\n${directive}\n\`\`\``,
    `\`${directive}\``,
    'unknown worker',
  ].join('\n'));
  assert.deepEqual(markdown.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);

  const tsx = await checkFixture([
    `// ${directive}`,
    `const hidden = '${directive}';`,
    'export const Page = () => <div>unknown worker</div>;',
  ].join('\n'), 'src/pages/suppression.tsx');
  assert.deepEqual(tsx.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('requires an exclusive parser-confirmed comment line', async () => {
  const result = await checkFixture([
    '前缀 <!-- terminology-exempt: unknown-english-term | reason: 测试 -->',
    'unknown worker',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 1, ruleId: 'invalid-suppression'},
    {line: 2, ruleId: 'unknown-english-term'},
  ]);
});

test('binds suppression to one stable record instead of another record on the same line', async () => {
  const result = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: 测试 -->
\`\`\`mermaid
flowchart LR
  A[纯中文] -->|unknown worker| B[完成]
\`\`\``);
  assert.deepEqual(result.issues.map(({line, ruleId, matched}) => ({line, ruleId, matched})), [
    {
      line: 1,
      ruleId: 'invalid-suppression',
      matched: '<!-- terminology-exempt: unknown-english-term | reason: 测试 -->',
    },
    {line: 4, ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('reports empty, unknown, and whole-file suppressions as invalid', async () => {
  const result = await checkFixture(`<!-- terminology-exempt: unknown-english-term | reason: -->
unknown worker
<!-- terminology-exempt: made-up-rule | reason: 测试 -->
other worker
<!-- terminology-exempt-file: unknown-english-term | reason: 不允许 -->`);
  assert.deepEqual(result.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 1, ruleId: 'invalid-suppression'},
    {line: 2, ruleId: 'unknown-english-term'},
    {line: 3, ruleId: 'invalid-suppression'},
    {line: 4, ruleId: 'unknown-english-term'},
    {line: 5, ruleId: 'invalid-suppression'},
  ]);
});

test('requires a proper noun first-use form before allowing its official alias', async () => {
  const premature = await checkFixture('Tego Arch 提供资料。');
  assert.deepEqual(premature.issues, [{
    file: 'content/example.mdx',
    line: 1,
    ruleId: 'first-use-required',
    matched: 'Tego Arch',
    expected: 'Tego Arch 架构知识项目',
  }]);

  const introduced = await checkFixture(
    'Tego Arch 架构知识项目提供资料，同一段后续使用 Tego Arch。',
  );
  assert.deepEqual(introduced.issues, []);
});

test('models arc42 section names as standalone bilingual terms', async () => {
  const registry = JSON.parse(
    await readFile(path.join(repositoryRoot, 'data/terminology.json'), 'utf8'),
  );
  const arc42 = registry.terms.find(({id}) => id === 'arc42-template');
  assert.ok(arc42);
  const expected = new Map([
    ['arc42-introduction-and-goals', ['介绍与目标', 'Introduction and Goals']],
    ['arc42-context-and-scope', ['上下文与范围', 'Context and Scope']],
    ['arc42-quality-requirements', ['质量要求', 'Quality Requirements']],
    ['arc42-risks-and-technical-debt', ['风险与技术债务', 'Risks and Technical Debt']],
    ['arc42-glossary', ['术语表', 'Glossary']],
  ]);

  assert.deepEqual(
    arc42.allowed_aliases.filter((alias) => (
      [...expected.values()].some(([, english]) => english === alias)
    )),
    [],
  );
  for (const [id, [canonicalZh, english]] of expected) {
    const term = registry.terms.find((candidate) => candidate.id === id);
    assert.ok(term, id);
    assert.equal(term.canonical_zh, canonicalZh);
    assert.equal(term.english, english);
    assert.equal(term.first_use, `${canonicalZh}（${english}）`);
    assert.deepEqual(term.subsequent_use, [canonicalZh]);
    assert.deepEqual(term.allowed_aliases, []);
    assert.deepEqual(term.forbidden_aliases, [english]);
  }
});

test('rejects bare Glossary after the arc42 product name is introduced', async () => {
  const registry = JSON.parse(
    await readFile(path.join(repositoryRoot, 'data/terminology.json'), 'utf8'),
  );
  const governedTerms = ['arc42-template', 'arc42-glossary'].map((id) => {
    const term = registry.terms.find((candidate) => candidate.id === id);
    assert.ok(term, id);
    return term;
  });
  const result = await withFixture(
    {'content/example.mdx': 'arc42 架构文档模板（arc42）包含 Glossary。'},
    (root) => checkTerminology({root, paths: ['content/example.mdx']}),
    governedTerms,
  );
  assert.deepEqual(result.issues.map(({ruleId, matched, expected}) => ({ruleId, matched, expected})), [
    {
      ruleId: 'bare-english-term',
      matched: 'Glossary',
      expected: '术语表（Glossary）',
    },
  ]);
});

test('accepts the Chinese-context introduction of the project name', async () => {
  const result = await checkTerminology({
    root: repositoryRoot,
    paths: ['content/intro.mdx'],
  });

  assert.deepEqual(result.issues, []);
});

test('uses explicit phrase boundaries and allows introduced acronyms and registered proper nouns', async () => {
  const result = await checkFixture([
    '应用程序编程接口（Application Programming Interface，API）支持中文 API 调用。',
    'Tego Arch 架构知识项目提供资料，后续使用 Tego Arch。',
    '`unknown worker` 不进入检查，worker_id 也不是读者术语。',
    '但 unknown-worker 与 workers 都必须独立报告。',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({matched}) => matched), ['unknown-worker', 'workers']);
});

test('uses UTF-16-safe masking and excludes identifiers only in structural code contexts', async () => {
  const result = await checkFixture([
    '😀 应用程序编程接口（Application Programming Interface，API）支持中文 API。',
    '`retryCount`、`HTTPClient`、`gRPC` 与 `AWSLambda` 是代码字面量。',
    'retryCount',
    'HTTPClient',
    'gRPC',
    'iPhone',
    'eBay',
    'macOS',
    'AWSLambda',
    'IBMCloud',
    'SQLAlchemy',
    'LangGraph',
    'OpenTelemetry',
    'GitHub',
    'WorkerNode',
    'Ordinary Title Phrase 与 unknown-workers。',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({line, matched}) => ({line, matched})), [
    {line: 3, matched: 'retryCount'},
    {line: 4, matched: 'HTTPClient'},
    {line: 5, matched: 'gRPC'},
    {line: 6, matched: 'iPhone'},
    {line: 7, matched: 'eBay'},
    {line: 8, matched: 'macOS'},
    {line: 9, matched: 'AWSLambda'},
    {line: 10, matched: 'IBMCloud'},
    {line: 11, matched: 'SQLAlchemy'},
    {line: 12, matched: 'LangGraph'},
    {line: 13, matched: 'OpenTelemetry'},
    {line: 14, matched: 'GitHub'},
    {line: 15, matched: 'WorkerNode'},
    {line: 16, matched: 'Ordinary Title Phrase'},
    {line: 16, matched: 'unknown-workers'},
  ]);
});

test('does not join unknown phrases across a registered acronym', async () => {
  const result = await checkFixture([
    '应用程序编程接口（Application Programming Interface，API）。',
    'unknown API worker',
  ].join('\n'));
  assert.deepEqual(result.issues.map(({matched}) => matched), ['unknown', 'worker']);
});

test('does not report a shorter registered alias inside another registered term', async () => {
  const workshop = {
    id: 'quality-attribute-workshop',
    canonical_zh: '质量属性工作坊',
    english: 'Quality Attribute Workshop',
    acronym: 'QAW',
    kind: 'acronym',
    first_use: '质量属性工作坊（Quality Attribute Workshop，QAW）',
    subsequent_use: ['质量属性工作坊', 'QAW'],
    allowed_aliases: [],
    forbidden_aliases: ['Quality Attribute Workshop'],
    note: '测试嵌套术语。',
    order: 50,
  };
  const result = await withFixture(
    {'content/example.mdx': '质量属性工作坊（Quality Attribute Workshop，QAW）用于发现场景。'},
    (root) => checkTerminology({root, paths: ['content/example.mdx']}),
    [...terms, workshop],
  );
  assert.deepEqual(result.issues, []);
});

test('returns registry errors before scanning content and CLI reports every issue', async () => {
  await withFixture({'content/example.mdx': 'unknown worker'}, async (root) => {
    await writeFile(path.join(root, 'data/terminology.json'), '{bad json');
    const result = await checkTerminology({root, paths: ['content/example.mdx']});
    assert.equal(result.checkedFiles.length, 0);
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), ['registry-error']);
    assert.deepEqual(Object.keys(result.issues[0]), [
      'file', 'line', 'ruleId', 'matched', 'expected',
    ]);
  });

  await withFixture({'content/example.mdx': 'Quality Attribute 与 unknown worker。'}, async (root) => {
    const run = spawnSync(
      process.execPath,
      [path.join(repositoryRoot, 'scripts/check-terminology.mjs'), '--paths', 'content/example.mdx'],
      {cwd: root, encoding: 'utf8'},
    );
    assert.equal(run.status, 1);
    assert.match(run.stdout, /bare-english-term/u);
    assert.match(run.stdout, /unknown-english-term/u);
    assert.match(run.stdout, /2 issues? in 1 checked file/u);
  });
});

test('collects parse errors with other file issues and keeps CLI diagnostics on stdout', async () => {
  await withFixture({
    'content/bad.mdx': '```text\nunclosed',
    'content/good.mdx': 'unknown worker',
    'static/bad.svg': '<svg><text>broken</svg>',
  }, async (root) => {
    const result = await checkTerminology({root, paths: ['content', 'static/bad.svg']});
    assert.deepEqual(result.issues.map(({file, ruleId}) => ({file, ruleId})), [
      {file: 'content/bad.mdx', ruleId: 'parse-error'},
      {file: 'content/good.mdx', ruleId: 'unknown-english-term'},
      {file: 'static/bad.svg', ruleId: 'parse-error'},
    ]);

    const run = spawnSync(
      process.execPath,
      [path.join(repositoryRoot, 'scripts/check-terminology.mjs'), '--paths', 'content,static/bad.svg'],
      {cwd: root, encoding: 'utf8'},
    );
    assert.equal(run.status, 1);
    assert.equal(run.stderr, '');
    assert.match(run.stdout, /\[parse-error\]/u);
    assert.match(run.stdout, /\[unknown-english-term\]/u);
    assert.match(run.stdout, /3 issues in 3 checked files/u);
  });
});

test('preserves a parser-provided source line on parse-error issues', async () => {
  const result = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg">\n<text>broken</svg>',
    'static/line.svg',
  );
  assert.deepEqual(result.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 2, ruleId: 'parse-error'},
  ]);
});

test('rejects unsafe, symlinked, missing, and unsupported scan paths while deduplicating files', async () => {
  await withFixture({'content/example.mdx': 'unknown worker'}, async (root) => {
    await symlink(path.join(root, 'content/example.mdx'), path.join(root, 'content/link.mdx'));
    const result = await checkTerminology({
      root,
      paths: [
        'content/example.mdx',
        'content/example.mdx',
        'content/link.mdx',
        '../outside.mdx',
        'missing.mdx',
        'data/terminology.json',
      ],
    });
    assert.deepEqual(result.checkedFiles, ['content/example.mdx']);
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), [
      'parse-error',
      'unknown-english-term',
      'parse-error',
      'parse-error',
      'parse-error',
    ]);
  });
});

test('rejects a scan path that traverses a symlinked parent directory', async () => {
  await withFixture({'real/example.mdx': 'unknown worker'}, async (root) => {
    await symlink(path.join(root, 'real'), path.join(root, 'alias'));
    const result = await checkTerminology({root, paths: ['alias/example.mdx']});
    assert.deepEqual(result.checkedFiles, []);
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), ['parse-error']);
    assert.match(result.issues[0].matched, /symbolic links are not allowed/u);
  });
});

test('reports a symlink encountered during recursive directory scanning', async () => {
  await withFixture({'content/example.mdx': 'unknown worker'}, async (root) => {
    await symlink(path.join(root, 'content/example.mdx'), path.join(root, 'content/link.mdx'));
    const result = await checkTerminology({root, paths: ['content']});
    assert.deepEqual(result.checkedFiles, ['content/example.mdx']);
    assert.deepEqual(result.issues.map(({file, ruleId}) => ({file, ruleId})), [
      {file: 'content/example.mdx', ruleId: 'unknown-english-term'},
      {file: 'content/link.mdx', ruleId: 'parse-error'},
    ]);
  });
});

test('CLI succeeds with accurate file and term counts', async () => {
  await withFixture({'content/example.mdx': '纯中文内容。'}, async (root) => {
    const run = spawnSync(
      process.execPath,
      [path.join(repositoryRoot, 'scripts/check-terminology.mjs'), '--paths=content/example.mdx'],
      {cwd: root, encoding: 'utf8'},
    );
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /checked 1 file with 4 registered terms; 0 issues/u);
  });
});

test('the repository registry contains every approved foundational term in unique order', async () => {
  const registry = JSON.parse(await readFile(path.join(repositoryRoot, 'data/terminology.json')));
  const required = [
    'architecture-decision-record',
    'quality-attribute-workshop',
    'architecture-tradeoff-analysis-method',
    'application-programming-interface',
    'hypertext-transfer-protocol',
    'uniform-resource-locator',
    'c4-model',
    'unified-modeling-language',
    'domain-driven-design',
    'command-query-responsibility-segregation',
    'conflict-free-replicated-data-type',
    'model-context-protocol',
    'agent-to-agent-protocol',
    'retry',
    'exponential-backoff',
    'jitter',
    'fail-fast',
    'fail-safe',
    'graceful-degradation',
    'human-in-the-loop',
    'router',
    'supervisor',
    'handoff',
    'fan-out-fan-in',
    'checkpointer',
    'reducer',
    'workflow',
    'agent',
    'software-development-kit',
  ];
  assert.deepEqual(required.filter((id) => !registry.terms.some((term) => term.id === id)), []);
  assert.equal(new Set(registry.terms.map(({order}) => order)).size, registry.terms.length);
});

test('keeps source titles and adjacent concepts out of the normative terminology registry', async () => {
  const registry = JSON.parse(await readFile(path.join(repositoryRoot, 'data/terminology.json')));
  const byId = new Map(registry.terms.map((term) => [term.id, term]));

  assert.deepEqual(
    registry.terms.filter(({id}) => id.startsWith('source-')).map(({id}) => id),
    [],
  );
  assert.deepEqual(
    registry.terms.filter(({note}) => /^受保护的.*来源链接标题/u.test(note)).map(({id}) => id),
    [],
  );
  assert.equal(byId.has('state-source-label'), false);
  assert.equal(byId.has('limits-source-label'), false);
  assert.deepEqual(byId.get('google-agent-development-kit').allowed_aliases, []);
  assert.deepEqual(byId.get('cloudflare-durable-objects').allowed_aliases, ['Durable Object']);
  assert.deepEqual(byId.get('aws-cli-agent-orchestrator').allowed_aliases, ['AWS CLI Agent Orchestrator']);
  assert.deepEqual(byId.get('git-version-control-system').allowed_aliases, []);
  assert.deepEqual(byId.get('kong-ai-proxy-advanced').allowed_aliases, []);
  assert.deepEqual(
    registry.terms.filter(({id}) => id.endsWith('-title')).map(({id}) => id),
    [],
  );
  assert.deepEqual(
    registry.terms
      .filter(({canonical_zh, note}) => canonical_zh.includes('：') && /案例标题/u.test(note))
      .map(({id}) => id),
    [],
  );
});

test('keeps code signatures, source identities, authors, and institutions out of terminology', async () => {
  const registry = JSON.parse(await readFile(path.join(repositoryRoot, 'data/terminology.json')));
  const forbiddenIds = new Set([
    'awesome-software-architecture',
    'google-sre-workbook',
    'linkedin-engineering',
    'netdb-workshop',
    'microsoft-research',
    'jay-kreps',
    'durable-object-get-by-name-signature',
  ]);
  assert.deepEqual(registry.terms.filter(({id}) => forbiddenIds.has(id)).map(({id}) => id), []);
  assert.deepEqual(registry.terms.filter(({kind}) => kind === 'code-literal').map(({id}) => id), []);
  assert.deepEqual(
    registry.terms.filter(({note}) => /来源题名|来源署名|作者姓名|机构官方名称|会议类别|受审阅签名/u.test(note)).map(({id}) => id),
    [],
  );
});

test('uses natural first-use forms and only same-concept aliases', async () => {
  const registry = JSON.parse(await readFile(path.join(repositoryRoot, 'data/terminology.json')));
  const byId = new Map(registry.terms.map((term) => [term.id, term]));
  assert.deepEqual(
    registry.terms
      .filter(({canonical_zh, english, first_use}) => english && canonical_zh.includes(english) && first_use.includes(`（${english}`))
      .map(({id}) => id),
    [],
  );
  assert.deepEqual(byId.get('quality-attribute-scenario-fields').allowed_aliases, []);
  assert.equal(byId.get('manager').first_use, '多智能体管理者（Manager）');
  assert.deepEqual(
    Object.fromEntries(registry.terms.filter(({allowed_aliases}) => allowed_aliases.length).map(({id, allowed_aliases}) => [id, allowed_aliases])),
    {
      'tego-arch': ['Tego Arch'],
      'cloudflare-durable-objects': ['Durable Object'],
      'aws-cli-agent-orchestrator': ['AWS CLI Agent Orchestrator'],
      'ros2-jazzy': ['Jazzy'],
      'service-oriented-architecture': ['Service-Oriented Architecture', 'SOA'],
      'enterprise-service-bus': ['Enterprise Service Bus', 'ESB'],
      'actor-model': ['Actor'],
    },
  );
  for (const id of [
    'quality-scenario-source',
    'quality-scenario-stimulus',
    'quality-scenario-environment',
    'quality-scenario-artifact',
    'quality-scenario-response',
    'quality-scenario-response-measure',
    'cloudflare-workers',
  ]) assert.ok(byId.has(id), id);
});

test('projects every approved foundational term exactly', async () => {
  const registry = JSON.parse(await readFile(path.join(repositoryRoot, 'data/terminology.json')));
  const metadata = new Map([
    ['architecture-decision-record', 40, 'acronym', [], ['Architecture Decision Record']],
    ['quality-attribute-workshop', 50, 'acronym', [], ['Quality Attribute Workshop']],
    ['architecture-tradeoff-analysis-method', 60, 'acronym', [], ['Architecture Tradeoff Analysis Method']],
    ['application-programming-interface', 70, 'acronym', [], ['Application Programming Interface']],
    ['hypertext-transfer-protocol', 80, 'standard', [], ['Hypertext Transfer Protocol']],
    ['uniform-resource-locator', 90, 'standard', [], ['Uniform Resource Locator']],
    ['c4-model', 100, 'standard', [], ['C4 Model']],
    ['unified-modeling-language', 110, 'standard', [], ['Unified Modeling Language']],
    ['domain-driven-design', 120, 'acronym', [], ['Domain-Driven Design']],
    ['command-query-responsibility-segregation', 130, 'acronym', [], ['Command Query Responsibility Segregation']],
    ['conflict-free-replicated-data-type', 140, 'acronym', [], ['Conflict-free Replicated Data Type']],
    ['model-context-protocol', 150, 'standard', [], ['Model Context Protocol']],
    ['agent-to-agent-protocol', 160, 'standard', [], ['Agent2Agent Protocol']],
    ['retry', 170, 'translated-term', [], ['Retry']],
    ['exponential-backoff', 180, 'translated-term', [], ['Exponential Backoff']],
    ['jitter', 190, 'translated-term', [], ['Jitter']],
    ['fail-fast', 200, 'translated-term', [], ['Fail Fast']],
    ['fail-safe', 210, 'translated-term', [], ['Fail Safe']],
    ['graceful-degradation', 220, 'translated-term', [], ['Graceful Degradation']],
    ['human-in-the-loop', 230, 'translated-term', [], ['Human-in-the-loop', '人工在环']],
    ['router', 240, 'translated-term', [], ['Router']],
    ['supervisor', 250, 'translated-term', [], ['Supervisor']],
    ['handoff', 260, 'translated-term', [], ['Handoff']],
    ['fan-out-fan-in', 270, 'translated-term', [], ['Fan-out/Fan-in']],
    ['checkpointer', 280, 'translated-term', [], ['Checkpointer']],
    ['reducer', 290, 'translated-term', [], ['Reducer']],
    ['workflow', 300, 'translated-term', [], ['Workflow']],
    ['agent', 310, 'translated-term', [], ['Agent']],
    ['software-development-kit', 320, 'acronym', [], ['Software Development Kit']],
  ].map(([id, order, kind, allowed_aliases, forbidden_aliases]) => [
    id,
    {order, kind, allowed_aliases, forbidden_aliases},
  ]));
  const approved = [
    ['architecture-decision-record', '架构决策记录', 'Architecture Decision Record', 'ADR'],
    ['quality-attribute-workshop', '质量属性工作坊', 'Quality Attribute Workshop', 'QAW'],
    ['architecture-tradeoff-analysis-method', '架构权衡分析方法', 'Architecture Tradeoff Analysis Method', 'ATAM'],
    ['application-programming-interface', '应用程序编程接口', 'Application Programming Interface', 'API'],
    ['hypertext-transfer-protocol', '超文本传输协议', 'Hypertext Transfer Protocol', 'HTTP'],
    ['uniform-resource-locator', '统一资源定位符', 'Uniform Resource Locator', 'URL'],
    ['c4-model', 'C4 架构模型', 'C4 Model', null],
    ['unified-modeling-language', '统一建模语言', 'Unified Modeling Language', 'UML'],
    ['domain-driven-design', '领域驱动设计', 'Domain-Driven Design', 'DDD'],
    ['command-query-responsibility-segregation', '命令查询职责分离', 'Command Query Responsibility Segregation', 'CQRS'],
    ['conflict-free-replicated-data-type', '无冲突复制数据类型', 'Conflict-free Replicated Data Type', 'CRDT'],
    ['model-context-protocol', '模型上下文协议', 'Model Context Protocol', 'MCP'],
    ['agent-to-agent-protocol', '智能体间协议', 'Agent2Agent Protocol', 'A2A'],
    ['retry', '重试', 'Retry', null],
    ['exponential-backoff', '指数退避', 'Exponential Backoff', null],
    ['jitter', '抖动', 'Jitter', null],
    ['fail-fast', '快速失败', 'Fail Fast', null],
    ['fail-safe', '故障安全', 'Fail Safe', null],
    ['graceful-degradation', '优雅降级', 'Graceful Degradation', null],
    ['human-in-the-loop', '人在回路', 'Human-in-the-loop', null],
    ['router', '路由器', 'Router', null],
    ['supervisor', '监督者', 'Supervisor', null],
    ['handoff', '移交', 'Handoff', null],
    ['fan-out-fan-in', '扇出与扇入', 'Fan-out/Fan-in', null],
    ['checkpointer', '检查点器', 'Checkpointer', null],
    ['reducer', '归约器', 'Reducer', null],
    ['workflow', '工作流', 'Workflow', null],
    ['agent', '智能体', 'Agent', null],
    ['software-development-kit', '软件开发工具包', 'Software Development Kit', 'SDK'],
  ].map(([id, canonical_zh, english, acronym]) => ({
    id,
    canonical_zh,
    first_use: acronym === null
      ? `${canonical_zh}（${english}）`
      : `${canonical_zh}（${english}，${acronym}）`,
    acronym,
    subsequent_use: acronym === null ? [canonical_zh] : [canonical_zh, acronym],
    ...metadata.get(id),
  }));
  const actual = approved.map(({id}) => {
    const term = registry.terms.find((candidate) => candidate.id === id);
    return {
      id: term.id,
      canonical_zh: term.canonical_zh,
      first_use: term.first_use,
      acronym: term.acronym,
      subsequent_use: term.subsequent_use,
      order: term.order,
      kind: term.kind,
      allowed_aliases: term.allowed_aliases,
      forbidden_aliases: term.forbidden_aliases,
    };
  });
  assert.deepEqual(actual, approved);

  const routerIndex = actual.findIndex(({id}) => id === 'router');
  const mutated = structuredClone(actual);
  mutated[routerIndex].allowed_aliases = ['Router'];
  assert.throws(() => assert.deepEqual(mutated, approved));
});

test('rejects wrong XML roots, undeclared namespaced text, compressed Draw.io, and XML 1.0 NUL', async () => {
  const fixtures = [
    ['static/wrong.svg', '<html><text>unknown worker</text></html>'],
    ['static/prefixed.svg', '<svg xmlns="http://www.w3.org/2000/svg"><svg:text>unknown worker</svg:text></svg>'],
    ['diagrams/compressed.drawio', '<mxfile><diagram name="Page-1">eJyrVkrLz1eyUkpKLFKqBQAQSwQJ</diagram></mxfile>'],
    ['diagrams/nul.drawio', '<mxfile><diagram name="Page-1"><mxGraphModel value="&#0;"/></diagram></mxfile>'],
    ['static/cdata-outside.svg', '<![CDATA[text]]><svg xmlns="http://www.w3.org/2000/svg"/>'],
    ['static/bad-attribute.svg', '<svg xmlns="http://www.w3.org/2000/svg" 1bad="value"/>'],
    ['static/raw-less-than.svg', '<svg xmlns="http://www.w3.org/2000/svg" data-note="a < b"/>'],
  ];
  await withFixture(Object.fromEntries(fixtures), async (root) => {
    const result = await checkTerminology({root, paths: fixtures.map(([file]) => file)});
    assert.deepEqual(result.issues.map(({file, ruleId}) => ({file, ruleId})), fixtures
      .map(([file]) => ({file, ruleId: 'parse-error'}))
      .sort((left, right) => left.file.localeCompare(right.file, 'en')));
    assert.match(
      result.issues.find(({file}) => file === 'diagrams/compressed.drawio').matched,
      /compressed Draw\.io diagrams are unsupported/u,
    );
  });
});

test('supports explicitly bound SVG namespace prefixes', async () => {
  const result = await checkFixture(
    '<svg:svg svg:data="value" xmlns:svg="http://www.w3.org/2000/svg"><svg:text>unknown worker</svg:text></svg:svg>',
    'static/prefixed.svg',
  );
  assert.deepEqual(result.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('shares strict XML visibility and tokenization contracts with the diagram validator', async () => {
  const visibleOverride = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg"><g visibility="hidden"><text visibility="visible">unknown worker</text></g></svg>',
    'static/override.svg',
  );
  assert.deepEqual(visibleOverride.issues.map(({matched}) => matched), ['unknown worker']);

  const importantDisplay = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg"><g style="display:none !important"><text>hidden worker</text></g></svg>',
    'static/important.svg',
  );
  assert.deepEqual(importantDisplay.issues, []);

  for (const source of [
    '<svg xmlns="http://www.w3.org/2000/svg"><text role="img"id="bad">worker</text></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><text>worker</ text></svg>',
  ]) {
    const malformed = await checkFixture(source, 'static/malformed.svg');
    assert.deepEqual(malformed.issues.map(({ruleId}) => ruleId), ['parse-error']);
  }

  const [checkerSource, validatorSource] = await Promise.all([
    readFile(path.join(repositoryRoot, 'scripts/check-terminology.mjs'), 'utf8'),
    readFile(path.join(
      repositoryRoot,
      '.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs',
    ), 'utf8'),
  ]);
  const sharedImport = /from ['"]\.\/xml-visible-copy\.mjs['"]/u;
  assert.match(checkerSource, /xml-visible-copy\.mjs/u);
  assert.match(validatorSource, sharedImport);
  assert.doesNotMatch(checkerSource, /const parseXmlVisibleCopy\s*=/u);
});

test('enforces reserved namespaces and namespace-aware structural XML queries', async () => {
  const invalidNamespaces = [
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xml="urn:wrong"/>',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xmlns="urn:wrong"/>',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x=""/>',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/2000/xmlns/"/>',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="urn:same" xmlns:y="urn:same" x:id="1" y:id="2"/>',
  ];
  for (const source of invalidNamespaces) {
    const result = await checkFixture(source, 'static/namespace.svg');
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), ['parse-error']);
  }

  const foreignModel = await checkFixture(
    '<mxfile xmlns:x="urn:foreign"><diagram name="Page-1"><x:mxGraphModel/></diagram></mxfile>',
    'diagrams/foreign.drawio',
  );
  assert.deepEqual(foreignModel.issues.map(({ruleId}) => ruleId), ['parse-error']);
});

test('applies CSS declaration order and important priority to SVG presentation', async () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">
<text style="display:block;display:none">hidden display last</text>
<text style="display:none;display:block">visible display last</text>
<text style="display:none!important;display:block">hidden display important</text>
<text style="display:none;display:block!important">visible display important</text>
<text style="visibility:visible;visibility:hidden">hidden visibility last</text>
<text style="visibility:hidden;visibility:visible">visible visibility last</text>
<text style="visibility:hidden!important;visibility:visible">hidden visibility important</text>
<text style="visibility:hidden;visibility:visible!important">visible visibility important</text>
<text style="fill:black;fill:none">hidden fill last</text>
<text style="fill:none;fill:black">visible fill last</text>
<text style="fill:none!important;fill:black">hidden fill important</text>
<text style="fill:none;fill:black!important">visible fill important</text>
<text fill="none" style="stroke:black;stroke:none">hidden stroke last</text>
<text fill="none" style="stroke:none;stroke:black">visible stroke last</text>
<text fill="none" style="stroke:none!important;stroke:black">hidden stroke important</text>
<text fill="none" style="stroke:none;stroke:black!important">visible stroke important</text>
<text display="none" style="display:block">visible display over attribute</text>
<text visibility="hidden" style="visibility:visible">visible visibility over attribute</text>
<text fill="none" style="fill:black">visible fill over attribute</text>
<text fill="none" stroke="none" style="stroke:black">visible stroke over attribute</text>
</svg>`;
  const result = await checkFixture(svg, 'static/cascade.svg');
  assert.deepEqual(result.issues.map(({matched}) => matched), [
    'visible display last',
    'visible display important',
    'visible visibility last',
    'visible visibility important',
    'visible fill last',
    'visible fill important',
    'visible stroke last',
    'visible stroke important',
    'visible display over attribute',
    'visible visibility over attribute',
    'visible fill over attribute',
    'visible stroke over attribute',
  ]);
});

test('resolves supported CSS-wide keywords and fails closed on revert variants', async () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">
<g visibility="hidden"><text visibility="inherit">hidden visibility inherit</text><text visibility="unset">hidden visibility unset</text><text visibility="initial">visible visibility initial</text></g>
<g fill="none"><text fill="inherit">hidden fill inherit</text><text fill="unset">hidden fill unset</text><text fill="initial">visible fill initial</text></g>
<g fill-opacity="0"><text fill-opacity="inherit">hidden fill opacity inherit</text><text fill-opacity="unset">hidden fill opacity unset</text><text fill-opacity="initial">visible fill opacity initial</text></g>
<g fill="none" stroke="black" stroke-opacity="0"><text stroke-opacity="inherit">hidden stroke opacity inherit</text><text stroke-opacity="unset">hidden stroke opacity unset</text><text stroke-opacity="initial">visible stroke opacity initial</text></g>
<g display="none"><text display="initial">hidden display ancestor</text></g>
<g opacity="0"><text opacity="initial">hidden opacity ancestor</text></g>
</svg>`;
  const result = await checkFixture(svg, 'static/css-wide.svg');
  assert.deepEqual(result.issues.map(({matched}) => matched), [
    'visible visibility initial',
    'visible fill initial',
    'visible fill opacity initial',
    'visible stroke opacity initial',
  ]);

  for (const keyword of ['revert', 'revert-layer']) {
    const unsupported = await checkFixture(
      `<svg xmlns="http://www.w3.org/2000/svg"><text visibility="${keyword}">worker</text></svg>`,
      'static/css-wide-unsupported.svg',
    );
    assert.deepEqual(unsupported.issues.map(({ruleId}) => ruleId), ['parse-error']);
  }
});

test('accepts strict XML declarations and ordinary PIs while rejecting reserved targets', async () => {
  const valid = await checkFixture(
    '\uFEFF<?xml version="1.0" encoding="UTF-8" standalone="yes"?><?audit ok?><svg xmlns="http://www.w3.org/2000/svg"><text>unknown worker</text><?inside ok?></svg><?after ok?>',
    'static/pi-valid.svg',
  );
  assert.deepEqual(valid.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);

  const invalid = [
    '<?XML?><svg xmlns="http://www.w3.org/2000/svg"/>',
    '<?1bad?><svg xmlns="http://www.w3.org/2000/svg"/>',
    '<!--before--><?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>',
    '<svg xmlns="http://www.w3.org/2000/svg"><?xml version="1.0"?></svg>',
    '<?xml encoding="UTF-8" version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>',
    '<?xml version="1.1"?><svg xmlns="http://www.w3.org/2000/svg"/>',
    '<?xml version="1.0" standalone="maybe"?><svg xmlns="http://www.w3.org/2000/svg"/>',
    '<?xml version="1.0"?><?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>',
  ];
  for (const source of invalid) {
    const result = await checkFixture(source, 'static/pi-invalid.svg');
    assert.deepEqual(result.issues.map(({ruleId}) => ruleId), ['parse-error'], source);
  }
});

test('accepts only XML S as syntax and document-boundary whitespace', async () => {
  const root = '<svg xmlns="http://www.w3.org/2000/svg"/>';
  for (const whitespace of ['\u00A0', '\u2028']) {
    const invalid = [
      {line: 2, source: `\n<svg xmlns="http://www.w3.org/2000/svg"${whitespace}role="img"/>`},
      {line: 1, source: `<?xml${whitespace}version="1.0"?>${root}`},
      {line: 1, source: `<?audit${whitespace}ok?>${root}`},
      {line: 2, source: `\n${whitespace}${root}`},
      {line: 2, source: `${root}\n${whitespace}`},
    ];
    for (const {line, source} of invalid) {
      const result = await checkFixture(source, 'static/xml-s-invalid.svg');
      assert.deepEqual(
        result.issues.map(({file, line: issueLine, ruleId}) => ({file, line: issueLine, ruleId})),
        [{file: 'static/xml-s-invalid.svg', line, ruleId: 'parse-error'}],
        JSON.stringify(source),
      );
    }
  }

  const content = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg"><text>unknown\u00A0worker</text></svg>',
    'static/xml-s-content.svg',
  );
  assert.deepEqual(content.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown worker'},
  ]);
});

test('reports a forbidden raw XML character on its actual source line', async () => {
  const result = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg">\n<text>valid</text>\n<text>bad\0value</text></svg>',
    'static/raw-line.svg',
  );
  assert.deepEqual(result.issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 3, ruleId: 'parse-error'},
  ]);
});

test('parses quoted greater-than and CDATA while validating hidden XML entities', async () => {
  const valid = await checkFixture(
    '<!----><svg xmlns="http://www.w3.org/2000/svg"><text data-note="a > b"><![CDATA[unknown & worker]]></text></svg>',
    'static/cdata.svg',
  );
  assert.deepEqual(valid.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown'},
    {ruleId: 'unknown-english-term', matched: 'worker'},
  ]);

  const hidden = await checkFixture(
    '<svg xmlns="http://www.w3.org/2000/svg"><desc>bad &unknown;</desc></svg>',
    'static/hidden-entity.svg',
  );
  assert.deepEqual(hidden.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(hidden.issues[0].matched, /unknown entity/u);
});

test('accepts parser-confirmed XML suppression and requires named Draw.io pages', async () => {
  const svg = await checkFixture(`<svg xmlns="http://www.w3.org/2000/svg">
<!-- terminology-exempt: unknown-english-term | reason: 官方图示标签 -->
<text>unknown worker</text>
</svg>`, 'static/suppressed.svg');
  assert.deepEqual(svg.issues, []);

  const drawio = await checkFixture(
    '<mxfile><diagram><mxGraphModel><root/></mxGraphModel></diagram></mxfile>',
    'diagrams/unnamed.drawio',
  );
  assert.deepEqual(drawio.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(drawio.issues[0].matched, /named diagram/u);

  const misplaced = await checkFixture(
    '<mxfile><diagram name="Page-1"></diagram><mxGraphModel/> </mxfile>',
    'diagrams/misplaced.drawio',
  );
  assert.deepEqual(misplaced.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(misplaced.issues[0].matched, /mxGraphModel/u);
});

test('decodes Draw.io entities once and rejects embedded HTML cell values', async () => {
  const escaped = await checkFixture(
    '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell value="unknown &amp; worker"/></root></mxGraphModel></diagram></mxfile>',
    'diagrams/escaped.drawio',
  );
  assert.deepEqual(escaped.issues.map(({ruleId, matched}) => ({ruleId, matched})), [
    {ruleId: 'unknown-english-term', matched: 'unknown'},
    {ruleId: 'unknown-english-term', matched: 'worker'},
  ]);

  const html = await checkFixture(
    '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell value="&lt;b&gt;unknown worker&lt;/b&gt;"/></root></mxGraphModel></diagram></mxfile>',
    'diagrams/html.drawio',
  );
  assert.deepEqual(html.issues.map(({ruleId}) => ruleId), ['parse-error']);
  assert.match(html.issues[0].matched, /HTML in mxCell.value/u);
});

test('uses indexed XML line lookup with near-linear 5k/10k scaling', async () => {
  const source = `${'line\n'.repeat(10_000)}tail`;
  const offsets = buildLineOffsets(source);
  assert.equal(offsets.length, 10_001);
  assert.equal(lineFromOffsets(offsets, source.length), 10_001);

  const measure = async (count) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${'<text>纯中文</text>\n'.repeat(count)}</svg>`;
    const started = performance.now();
    await checkFixture(svg, 'static/scale.svg');
    return performance.now() - started;
  };
  await measure(1_000);
  const small = Math.min(await measure(5_000), await measure(5_000));
  const large = Math.min(await measure(10_000), await measure(10_000));
  assert.ok(large / small < 3.5, `expected near-linear scaling, got ${small}ms -> ${large}ms`);
});
