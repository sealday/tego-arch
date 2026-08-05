import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const modelingHeadings = [
  '学习问题',
  '建模目标与输入',
  '参与者与步骤',
  '模型产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];
const [documents, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8')
    .then(JSON.parse),
]);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);

function requiredDocument(id) {
  const document = byId.get(id);
  assert.ok(document, `${id} must be published`);
  return document;
}

function section(body, heading) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `missing ## ${heading}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start === -1 ? end : start + 1, end);
}

function fencedBlock(body, language) {
  const match = body.match(
    new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'u'),
  );
  assert.ok(match, `missing ${language} fenced block`);
  return match[1];
}

function markdownTableRows(body) {
  return body
    .split('\n')
    .filter((line) => /^\|.+\|$/u.test(line))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/u.test(cell)));
}

function mermaidSemanticEdges(source) {
  const nodeLabels = new Map();
  const edges = [];
  const edgePattern =
    /^\s*([A-Z][A-Z0-9_]*)(?:\["([^"]+)"\])?\s+(-->|-\.[^\n]+\.->)\s+([A-Z][A-Z0-9_]*)(?:\["([^"]+)"\])?\s*$/u;
  for (const line of source.split('\n').slice(1)) {
    if (!line.trim()) continue;
    const match = line.match(
      edgePattern,
    );
    assert.ok(match, `invalid Mermaid edge: ${line.trim()}`);
    const [, fromId, fromLabel, , toId, toLabel] = match;
    if (fromLabel) nodeLabels.set(fromId, fromLabel);
    if (toLabel) nodeLabels.set(toId, toLabel);
    edges.push([fromId, toId]);
  }
  return edges.map(([fromId, toId]) => {
    const fromLabel = nodeLabels.get(fromId);
    const toLabel = nodeLabels.get(toId);
    assert.ok(fromLabel, `missing Mermaid label for ${fromId}`);
    assert.ok(toLabel, `missing Mermaid label for ${toId}`);
    return `${fromLabel} -> ${toLabel}`;
  });
}

test('publishes MOD-04 as an original six-unit arc42 v9 skeleton', () => {
  const document = requiredDocument('MOD-04');
  assert.equal(
    document.file,
    'modeling/mod-04-arc42-documentation-skeleton.mdx',
  );
  assert.equal(document.metadata.slug, '/modeling/mod-04');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.priority, 'P0');
  assert.deepEqual(document.metadata.depends_on, ['MOD-01', 'MOD-03']);
  assert.deepEqual(document.metadata.adjacent_topics, ['MOD-03', 'MOD-05']);
  assert.deepEqual(document.metadata.related_cases, [
    '/cases/microsoft-multi-agent-reference-architecture',
  ]);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );
  assert.match(document.body, /arc42 v9\.0/u);
  assert.match(document.body, /本站原创的六单元教学骨架/u);
  assert.match(document.body, /不是[^。\n]*官方模板/u);
});

test('maps all twelve arc42 problem domains without copying the template', () => {
  const document = requiredDocument('MOD-04');
  const products = section(document.body, '模型产物');
  const rows = markdownTableRows(products);
  assert.deepEqual(rows[0], [
    '本站原创单元',
    '对应 arc42 v9 问题域',
    '核心问题',
    '最小证据与产物',
    '明确不证明',
  ]);
  const dataRows = rows.slice(1);
  assert.equal(rows.length, 7, 'mapping table must contain one header and six rows');
  assert.equal(dataRows.length, 6);
  assert.equal(new Set(dataRows.map(([unit]) => unit)).size, 6);
  assert.deepEqual(
    dataRows.map(([unit, mappedDomains]) => [unit, mappedDomains]),
    [
      ['目标与边界', '1 Introduction and Goals；3 Context and Scope'],
      [
        '约束与权衡',
        '2 Architecture Constraints；4 Solution Strategy；9 Architecture Decisions',
      ],
      [
        '静态组成',
        '5 Building Block View；8 Cross-cutting Concepts 的结构部分',
      ],
      [
        '动态行为',
        '6 Runtime View；8 Cross-cutting Concepts 的运行部分',
      ],
      ['条件性部署', '7 Deployment View'],
      [
        '质量、风险与词汇',
        '10 Quality Requirements；11 Risks and Technical Debt；12 Glossary',
      ],
    ],
  );
  assert.equal(
    [
      ...document.body.matchAll(
        /className="table-wrapper(?: [^"]*)?"/gu,
      ),
    ].length,
    1,
  );
  assert.equal(
    [
      ...document.body.matchAll(
        /className="table-wrapper table-wrapper--mapping"/gu,
      ),
    ].length,
    1,
  );
  assert.match(
    products,
    /className="table-wrapper table-wrapper--mapping"/u,
  );
  assert.match(products, /aria-label="arc42 v9 六单元映射表，可横向滚动"/u);
  assert.match(products, /tabIndex=\{0\}/u);
});

test('keeps evidence classes and non-proof boundaries explicit', () => {
  const document = requiredDocument('MOD-04');
  for (const evidenceClass of [
    '已验证事实',
    '基于证据的推断',
    '本地项目决策',
    '未知项',
  ]) {
    assert.match(document.body, new RegExp(evidenceClass, 'u'), evidenceClass);
  }
  assert.match(
    document.body,
    /Building Block View[^。\n]*(?:核心|主线)[^。\n]*静态/u,
  );
  assert.match(document.body, /未知[^。\n]*(?:生产拓扑|部署拓扑)/u);
  assert.match(document.body, /不[^。\n]*虚构[^。\n]*(?:拓扑|容量|故障切换)/u);
  assert.match(
    document.body,
    /arc42[^。\n]*(?:不替代|不能替代)[^。\n]*(?:ADR|质量场景|风险|运行证据)/u,
  );
});

test('renders one evidence-chain Mermaid with explicit validation gaps', () => {
  const document = requiredDocument('MOD-04');
  assert.equal([...document.body.matchAll(/```mermaid\n/gu)].length, 1);
  const mermaid = fencedBlock(document.body, 'mermaid');
  assert.match(mermaid, /^flowchart LR/mu);
  const expectedEdges = [
    '目标与边界 -> 约束与权衡',
    '约束与权衡 -> 静态组成',
    '静态组成 -> 动态行为',
    '动态行为 -> 条件性部署',
    '条件性部署 -> 质量与风险',
    '决策记录 -> 约束与权衡',
    '决策记录 -> 静态组成',
    '验证证据 -> 动态行为',
    '验证证据 -> 条件性部署',
    '验证证据 -> 质量与风险',
    '未知项 -> 静态组成',
    '未知项 -> 条件性部署',
  ].sort();
  const actualEdges = mermaidSemanticEdges(mermaid);
  assert.equal(actualEdges.length, 12);
  assert.equal(new Set(actualEdges).size, 12);
  assert.deepEqual([...actualEdges].sort(), expectedEdges);

  const [declaration, ...edgeLines] = mermaid.split('\n');
  const reordered = [declaration, ...edgeLines.reverse()].join('\n');
  assert.deepEqual(mermaidSemanticEdges(reordered).sort(), expectedEdges);
  assert.throws(
    () => mermaidSemanticEdges(mermaid.replace(' --> ', ' ==> ')),
    /invalid Mermaid edge/u,
  );
});

test('contains one measurable local quality scenario', () => {
  const exercise = section(requiredDocument('MOD-04').body, '完整演练');
  for (const field of ['来源', '刺激', '环境', '制品', '响应', '度量']) {
    assert.match(exercise, new RegExp(`\\*\\*${field}：\\*\\*`, 'u'), field);
  }
  assert.match(exercise, /全部关键步骤[^。\n]*一致关联标识/u);
  assert.match(exercise, /故障步骤[^。\n]*10 分钟内定位/u);
  assert.match(exercise, /本站教学验收标准/u);
  assert.match(exercise, /不是 Microsoft[^。\n]*生产承诺/u);
});

test('links the real learning chain without publishing MOD-13 early', () => {
  const mod04 = requiredDocument('MOD-04');
  const links = new Set(extractInternalLinks(mod04));
  for (const slug of [
    '/modeling',
    '/modeling/mod-01',
    '/modeling/mod-02',
    '/modeling/mod-03',
    '/methods/mth-03',
    '/methods/mth-06',
    '/cases/microsoft-multi-agent-reference-architecture',
  ]) {
    assert.ok(links.has(slug), slug);
  }
  assert.equal(links.has('/modeling/mod-13'), false);
  assert.match(mod04.body, /MOD-13[^。\n]*尚未发布/u);
  assert.ok(
    extractInternalLinks(requiredDocument('MTH-03')).includes('/modeling/mod-04'),
  );
  assert.ok(
    extractInternalLinks(requiredDocument('MTH-06')).includes('/modeling/mod-04'),
  );
  const microsoft = documents.find(
    ({metadata}) =>
      metadata.slug === '/cases/microsoft-multi-agent-reference-architecture',
  );
  assert.ok(microsoft);
  assert.ok(extractInternalLinks(microsoft).includes('/modeling/mod-04'));
});

test('governs exact arc42 and Microsoft evidence identities', () => {
  const document = requiredDocument('MOD-04');
  const governed =
    ledger.documents['content/modeling/mod-04-arc42-documentation-skeleton.mdx'];
  assert.ok(governed);
  const exactArc42Locators = new Map([
    ['src-arc42-building-block-view-v9', 'https://docs.arc42.org/section-5/'],
    ['src-arc42-overview-v9', 'https://arc42.org/overview'],
    ['src-arc42-quality-requirements-v9', 'https://docs.arc42.org/section-10/'],
    [
      'src-arc42-template-v9-record',
      'https://github.com/arc42/arc42-template/blob/8dff0d9b1f9640684df8c3bbcdc2ee45f989ca0f/EN/version.properties',
    ],
  ]);
  const expectedCitationIds = [
    ...exactArc42Locators.keys(),
    'src-github-2dd3cdefac57',
    'src-github-4d3dfe89f2a4',
    'src-github-ccef43990f14',
  ];
  assert.deepEqual(
    governed.citations.map(({source_id}) => source_id),
    expectedCitationIds,
  );
  const visibleExternal = new Set(extractExternalLinks(document));
  for (const citation of governed.citations) {
    assert.ok(visibleExternal.has(citation.citation_url), citation.citation_url);
  }
  for (const [sourceId, exactLocator] of exactArc42Locators) {
    const source = ledger.sources.find(({id}) => id === sourceId);
    assert.ok(source, sourceId);
    assert.equal(source.canonical_locator, exactLocator);
    assert.equal(
      source.transport_locator,
      sourceId === 'src-arc42-overview-v9' ? `${exactLocator}/` : exactLocator,
    );
    assert.equal(source.license, 'CC-BY-SA-4.0');
    assert.equal(source.copyright_policy, 'adapt-sharealike-review');
    const citation = governed.citations.find(({source_id}) => source_id === sourceId);
    assert.equal(citation?.citation_url, exactLocator);
    assert.ok(visibleExternal.has(exactLocator), exactLocator);
  }
});

test('projects G008 Batch 2 completion during Stage B', async () => {
  const [status, backlog] = await Promise.all([
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8')
      .then(JSON.parse),
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  ]);
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 7, total: 20, current: 'G008'},
    completed_topics: 50,
    content_documents: 92,
    governed_sources: 488,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assert.match(backlog, /^- \[x\] \*\*MOD-04 /mu);
  assert.match(backlog, /下一项[^。\n]*MOD-05/u);
});
