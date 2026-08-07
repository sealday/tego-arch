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

const root = fileURLToPath(new URL('../', import.meta.url));
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

test('publishes MOD-01 as the six-question model-selection router', () => {
  const document = requiredDocument('MOD-01');
  assert.equal(document.file, 'modeling/mod-01-model-selection-overview.mdx');
  assert.equal(document.metadata.slug, '/modeling/mod-01');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.priority, 'P0');
  assert.deepEqual(document.metadata.depends_on, ['FND-03']);
  assert.deepEqual(document.metadata.adjacent_topics, [
    'MOD-02',
    'MOD-06',
    'MOD-07',
    'QA-01',
    'MTH-03',
  ]);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );
  for (const label of ['问题空间', '结构', '行为', '数据', '部署', '决策']) {
    assert.match(document.body, new RegExp(label, 'u'), label);
  }
  assert.match(document.body, /```mermaid[\s\S]*?flowchart/u);
  assert.match(document.body, /\| 问题类别 \| 首选产物 \| 主要证明 \| 明确不证明 \|/u);
});

test('puts a concise non-proof boundary on every MOD-01 Mermaid exit', () => {
  const mermaid = fencedBlock(requiredDocument('MOD-01').body, 'mermaid');
  assert.match(mermaid, /^flowchart TD/mu);
  const exits = [
    ['PM', '问题空间模型', '内部结构'],
    ['SM', '结构模型', '运行顺序'],
    ['BM', '行为模型', '静态所有权'],
    ['DM', '数据模型', '流程完整'],
    ['EM', '部署模型', '容量容灾'],
    ['RM', '决策记录', '运行事实'],
  ];
  for (const [id, model, boundary] of exits) {
    assert.match(
      mermaid,
      new RegExp(
        `^\\s*\\w+\\s+-->\\s+${id}\\["${model}<br\\/>不证明：${boundary}"\\]$`,
        'mu',
      ),
      `${model} exit boundary`,
    );
  }
});

test('governs MOD-01 sources and reciprocal navigation', () => {
  const mod01 = requiredDocument('MOD-01');
  const mod02 = requiredDocument('MOD-02');
  const mod01Links = new Set(extractInternalLinks(mod01));
  const mod02Links = new Set(extractInternalLinks(mod02));
  assert.ok(mod01Links.has('/modeling'));
  assert.ok(mod01Links.has('/modeling/mod-02'));
  assert.ok(mod01Links.has('/methods/mth-03'));
  assert.ok(mod01Links.has('/quality-attributes/qa-01'));
  assert.ok(mod02Links.has('/modeling/mod-01'));
  assert.ok(mod01.metadata.adjacent_topics.includes('MOD-02'));
  assert.ok(mod02.metadata.adjacent_topics.includes('MOD-01'));

  const governed = ledger.documents[
    'content/modeling/mod-01-model-selection-overview.mdx'
  ];
  assert.ok(governed);
  assert.deepEqual(
    governed.citations.map(({source_id}) => source_id),
    ['src-c4model-diagrams', 'src-c4model-notation', 'src-arc42-8b346f00707f'],
  );
  const visibleExternal = new Set(extractExternalLinks(mod01));
  for (const citation of governed.citations) {
    assert.ok(visibleExternal.has(citation.citation_url));
  }
});

test('keeps reciprocal MOD-01 adjacency and visible backlinks with QA-01 and MTH-03', () => {
  const mod01 = requiredDocument('MOD-01');
  const qa01 = requiredDocument('QA-01');
  const mth03 = requiredDocument('MTH-03');
  assert.deepEqual(mod01.metadata.adjacent_topics, [
    'MOD-02',
    'MOD-06',
    'MOD-07',
    'QA-01',
    'MTH-03',
  ]);
  assert.deepEqual(qa01.metadata.adjacent_topics, [
    'QA-00',
    'QA-02',
    'MTH-03',
    'REL-02',
    'PR-07',
    'MOD-01',
  ]);
  assert.deepEqual(mth03.metadata.adjacent_topics, [
    'FND-05',
    'MTH-04',
    'QA-01',
    'PR-08',
    'MOD-01',
    'MOD-13',
  ]);
  assert.ok(extractInternalLinks(qa01).includes('/modeling/mod-01'));
  assert.ok(extractInternalLinks(mth03).includes('/modeling/mod-01'));
});

test('publishes MOD-03 with three evidence-bounded C4 views', () => {
  const document = requiredDocument('MOD-03');
  assert.equal(
    document.file,
    'modeling/mod-03-c4-component-dynamic-deployment.mdx',
  );
  assert.equal(document.metadata.slug, '/modeling/mod-03');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.priority, 'P0');
  assert.deepEqual(document.metadata.depends_on, ['MOD-01', 'MOD-02']);
  assert.deepEqual(document.metadata.adjacent_topics, ['MOD-02', 'MOD-04', 'MOD-07']);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );

  const products = section(document.body, '模型产物');
  for (const label of [
    '组件',
    '动态图',
    '部署',
    '提交用例',
    '审批策略',
    '付款编排',
    '持久化端口',
  ]) {
    assert.match(products, new RegExp(label, 'u'), label);
  }
  assert.match(products, /```mermaid[\s\S]*?sequenceDiagram/u);
  assert.match(document.body, /组件[^。；\n]*(?:不证明|不能证明)[^。；\n]*代码/u);
  assert.match(document.body, /动态图[^。；\n]*(?:不等于|不证明)[^。；\n]*(?:性能|追踪)/u);
  assert.match(document.body, /部署[^。；\n]*(?:不证明|不能证明)[^。；\n]*(?:容量|故障切换)/u);
});

test('requires view-specific evidence and marks the expense topology as a dated teaching assumption', () => {
  const document = requiredDocument('MOD-03');
  const inputs = section(document.body, '建模目标与输入');
  assert.match(inputs, /组件[^。\n]*代码[^。\n]*依赖[^。\n]*所有权/u);
  assert.match(inputs, /动态图[^。\n]*用例[^。\n]*测试[^。\n]*追踪/u);
  assert.match(inputs, /部署[^。\n]*环境清单[^。\n]*配置[^。\n]*观测/u);
  assert.match(inputs, /事实截止时间[^。\n]*2026-07-30/u);
  assert.match(document.body, /费用申报系统[^。\n]*教学演练假设/u);
  assert.match(document.body, /并非[^。\n]*生产拓扑事实/u);
  assert.match(
    document.body,
    /数据库部署节点承载申报数据库容器实例/u,
  );
  assert.match(
    document.body,
    /基础设施节点[^。\n]*可选类型[^。\n]*最小教学图[^。\n]*未引入/u,
  );
  assert.doesNotMatch(document.body, /数据库等基础设施节点|托管数据库基础设施节点/u);
  assert.match(document.body, /不[^。\n]*域名系统[^。\n]*负载均衡器/u);

  const source = ledger.sources.find(
    ({id}) => id === 'src-atlas-mod03-c4-deployment',
  );
  assert.ok(source, 'MOD-03 Deployment illustration identity');
  assert.equal(source.title, '费用申报系统 Deployment 教学演练假设拓扑');
  assert.match(source.usage_boundary, /teaching exercise assumption topology/iu);
  assert.match(source.usage_boundary, /not a production inventory fact/iu);
  const citation =
    ledger.documents[
      'content/modeling/mod-03-c4-component-dynamic-deployment.mdx'
    ].citations.find(
      ({source_id}) => source_id === 'src-atlas-mod03-c4-deployment',
    );
  assert.equal(
    citation.attribution_note,
    '费用申报系统 Deployment 教学演练假设拓扑, Tego Arch maintainers',
  );
  assert.match(citation.modification_note, /teaching exercise assumption/iu);
});

test('locks the MOD-03 dynamic-diagram asynchronous boundary and one minimal failure alt', () => {
  const mermaid = fencedBlock(requiredDocument('MOD-03').body, 'mermaid');
  assert.match(mermaid, /^sequenceDiagram/mu);
  assert.match(
    mermaid,
    /^\s*Payment-->>Worker: 发布待执行任务（异步边界）$/mu,
  );
  assert.match(mermaid, /^\s*alt 银行受理$/mu);
  assert.match(mermaid, /^\s*else 银行拒绝$/mu);
  assert.match(mermaid, /^\s*Bank-->>Worker: 返回拒绝结果$/mu);
  assert.doesNotMatch(mermaid, /重试|补偿/u);
});

test('keeps MOD-02 and MOD-03 reciprocal and governed', () => {
  const mod02 = requiredDocument('MOD-02');
  const mod03 = requiredDocument('MOD-03');
  assert.ok(extractInternalLinks(mod02).includes('/modeling/mod-03'));
  assert.ok(extractInternalLinks(mod03).includes('/modeling/mod-02'));
  assert.ok(mod02.metadata.adjacent_topics.includes('MOD-03'));
  assert.ok(mod03.metadata.adjacent_topics.includes('MOD-02'));

  const governed = ledger.documents[
    'content/modeling/mod-03-c4-component-dynamic-deployment.mdx'
  ];
  assert.ok(governed);
  assert.deepEqual(
    governed.citations.map(({
      source_id,
      citation_url,
      roles,
      usage_mode,
      manifest_primary,
    }) => ({
      source_id,
      citation_url,
      roles,
      usage_mode,
      manifest_primary,
    })),
    [
      {
        source_id: 'src-c4model-component-diagram',
        citation_url: 'https://c4model.com/diagrams/component',
        roles: ['definition', 'method'],
        usage_mode: 'facts-summary',
        manifest_primary: true,
      },
      {
        source_id: 'src-c4model-dynamic-diagram',
        citation_url: 'https://c4model.com/diagrams/dynamic',
        roles: ['definition', 'method'],
        usage_mode: 'facts-summary',
        manifest_primary: false,
      },
      {
        source_id: 'src-c4model-deployment-diagram',
        citation_url: 'https://c4model.com/diagrams/deployment',
        roles: ['definition', 'method'],
        usage_mode: 'facts-summary',
        manifest_primary: false,
      },
      {
        source_id: 'src-arc42-8b346f00707f',
        citation_url: 'https://arc42.org/',
        roles: ['method', 'learning'],
        usage_mode: 'facts-summary',
        manifest_primary: false,
      },
      {
        source_id: 'src-atlas-mod03-c4-component',
        citation_url: '/img/diagrams/mod-03-c4-component.svg',
        roles: ['illustration'],
        usage_mode: 'original-illustration',
        manifest_primary: false,
      },
      {
        source_id: 'src-atlas-mod03-c4-deployment',
        citation_url: '/img/diagrams/mod-03-c4-deployment.svg',
        roles: ['illustration'],
        usage_mode: 'original-illustration',
        manifest_primary: false,
      },
    ],
  );
});

test('projects G008 Batch 1 completion during Stage B', async () => {
  const [status, backlog] = await Promise.all([
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8')
      .then(JSON.parse),
    readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
  ]);
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 52,
    content_documents: 95,
    governed_sources: 494,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  for (const id of ['MOD-01', 'MOD-02', 'MOD-03']) {
    assert.match(backlog, new RegExp(`^- \\[x\\] \\*\\*${id} `, 'mu'));
  }
});
