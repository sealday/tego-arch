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
const expected = new Map([
  ['PR-12', [
    'principles/pr-12-open-closed-interface-segregation.mdx',
    '/principles/pr-12',
    'P1',
  ]],
  ['PR-13', [
    'principles/pr-13-persistence-ignorance.mdx',
    '/principles/pr-13',
    'P1',
  ]],
  ['PR-14', [
    'principles/pr-14-grasp-responsibility-assignment.mdx',
    '/principles/pr-14',
    'P1',
  ]],
]);
const h2 = [
  '学习问题',
  '要保护的性质',
  '冲突与适用上下文',
  '机制',
  '误用与反原则',
  '适用尺度',
  '相邻原则',
  '说明性场景',
  '来源',
];
const relationships = new Map([
  ['PR-12', ['PR-01', 'PR-02', 'PR-03', 'PR-04', 'PR-05', 'PR-08', 'PR-14']],
  ['PR-13', ['PR-03', 'PR-04', 'PR-11', 'MOD-05']],
  ['PR-14', ['PR-02', 'PR-03', 'PR-04', 'PR-12', 'PR-15', 'PR-17']],
]);
const routeByTopic = new Map([
  ['PR-01', '/principles/pr-01'],
  ['PR-02', '/principles/pr-02'],
  ['PR-03', '/principles/pr-03'],
  ['PR-04', '/principles/pr-04'],
  ['PR-05', '/principles/pr-05'],
  ['PR-08', '/principles/pr-08'],
  ['PR-11', '/principles/pr-11'],
  ['PR-12', '/principles/pr-12'],
  ['PR-13', '/principles/pr-13'],
  ['PR-14', '/principles/pr-14'],
  ['PR-15', '/principles/pr-15'],
  ['PR-17', '/principles/pr-17'],
  ['MOD-05', '/modeling/mod-05'],
]);
const solePrimary = new Map([
  ['PR-12', 'src-objectmentor-ocp-1996'],
  ['PR-13', 'src-nilsson-ddd-patterns-2006'],
  ['PR-14', 'src-larman-applying-uml-patterns-3e-2004'],
]);
const terminalLink = new Map([
  ['PR-12', /^\/(?:cases|questions)\//u],
  ['PR-13', /^\/(?:cases|questions)\//u],
  ['PR-14', /^\/(?:cases|questions)\//u],
]);

const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8')
    .then(JSON.parse),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8')
    .then(JSON.parse),
]);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);
const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));

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

test('publishes PR-12 through PR-14 with the principle contract', () => {
  for (const [id, [file, slug, priority]] of expected) {
    const document = requiredDocument(id);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'principle');
    assert.equal(document.metadata.priority, priority);
    assert.equal(document.metadata.status, 'reviewed');
    assert.deepEqual(document.metadata.adjacent_topics, relationships.get(id));
    assert.deepEqual(
      document.headings.filter(({level}) => level === 2).map(({text}) => text),
      h2,
    );
    const questions = section(document.body, '学习问题')
      .split(/\r?\n/u)
      .filter((line) => /^ {0,3}[-*+]\s+\S.*[?？]\s*$/u.test(line));
    assert.ok(questions.length >= 3 && questions.length <= 5, `${id} learning questions`);
    assert.match(
      document.body,
      /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu,
      `${id} original representation`,
    );
    assert.match(document.body, /\*\*来源事实：\*\*/u, `${id} fact label`);
    assert.match(document.body, /\*\*推断：\*\*/u, `${id} inference label`);
    assert.match(document.body, /\*\*本站分析：\*\*/u, `${id} site-analysis label`);
    assert.match(document.body, /失败模式/u, `${id} failure mode`);
    assert.match(document.body, /不适用|不采用/u, `${id} non-use condition`);
    assert.match(document.body, /运行成本|操作成本|协调成本/u, `${id} operational cost`);
  }
});

test('projects the published Batch 4 and closing-principle boundary', () => {
  for (const id of expected.keys()) {
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
  for (let number = 15; number <= 17; number += 1) {
    assert.equal(topics.get(`PR-${number}`)?.published, true);
  }
});

test('governs every visible source and relationship', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has multiple governed sources`);
    const primary = governed.citations.filter(({manifest_primary}) => manifest_primary);
    assert.equal(primary.length, 1, `${id} has exactly one manifest primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary identity`);
    const visibleExternal = new Set(
      extractExternalLinks(document).filter((url) => url.startsWith('https://')),
    );
    const citationUrls = new Set(
      governed.citations.map(({citation_url}) => citation_url),
    );
    for (const url of visibleExternal) {
      assert.ok(citationUrls.has(url), `${id} governs visible ${url}`);
    }
    for (const citation of governed.citations) {
      assert.ok(visibleExternal.has(citation.citation_url), `${id} visible ${citation.source_id}`);
    }
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id)) {
      assert.ok(links.has(routeByTopic.get(adjacent)), `${id} visibly links ${adjacent}`);
    }
    assert.ok(
      [...links].some((link) => terminalLink.get(id).test(link)),
      `${id} links a real case or learning question`,
    );
    for (const adjacent of relationships.get(id).filter((topic) => /^PR-1[5-7]$/u.test(topic))) {
      assert.equal(topics.get(adjacent)?.published, true, `${id} closing relationship is published`);
    }
  }
});

const decisionContracts = new Map([
  ['PR-12', [
    ['OCP absorbs evidenced variation', '要保护的性质', /Open\/Closed[^。；\n]*可能变化[^。；\n]*稳定政策[^。；\n]*扩展点/u],
    ['ISP constrains consumer dependencies', '要保护的性质', /Interface Segregation[^。；\n]*消费者[^。；\n]*所需能力/u],
    ['principles remain distinct', '要保护的性质', /一个回答变化在哪里被吸收[^。；\n]*另一个回答消费者依赖哪些能力/u],
    ['extension ownership and compatibility cost', '机制', /所有者、兼容性、测试与运行成本/u],
    ['strategic closure not universal closure', '冲突与适用上下文', /(?:不可能对所有变化关闭[\s\S]*战略性关闭|战略性关闭[\s\S]*不可能对所有变化关闭)/u],
    ['coherent interfaces not fragments', '机制', /较小接口[^。；\n]*契约仍然内聚/u],
    ['fragmentation failure', '误用与反原则', /接口碎片化[^。；\n]*(?:适配器泛滥|编排泄漏)/u],
    ['interfaces everywhere rejected', '误用与反原则', /并非到处使用接口|不是所有位置都需要接口/u],
    ['existing code may change', '误用与反原则', /不意味着现有代码永远不能修改/u],
  ]],
  ['PR-13', [
    ['definition keeps decisions independent', '要保护的性质', /领域决策[^。；\n]*独立于持久化机制/u],
    ['storage behavior remains relevant', '要保护的性质', /不等于忽略存储行为/u],
    ['domain mapping repository split', '机制', /领域规则[^。；\n]*映射[^。；\n]*仓储/u],
    ['aggregate transaction boundary', '机制', /聚合[^。；\n]*事务边界/u],
    ['query models may bypass domain model', '机制', /(?:报表|查询模型)[^。；\n]*不必[^。；\n]*领域模型/u],
    ['leakage is named', '冲突与适用上下文', /身份、延迟加载、并发、批处理与查询形状/u],
    ['persistence-aware optimization is honest', '冲突与适用上下文', /显式[^。；\n]*持久化感知[^。；\n]*优化/u],
    ['ORM requirement rejected', '误用与反原则', /不要求 ORM|并非必须使用 ORM/u],
    ['annotation ban rejected', '误用与反原则', /不要求在所有上下文禁止持久化注解/u],
    ['database costs remain', '误用与反原则', /数据库与事务成本[^。；\n]*(?:不会消失|仍然存在)/u],
  ]],
  ['PR-14', [
    ['decision system not catalog', '要保护的性质', /责任分配决策系统[^。；\n]*不是模式名称目录/u],
    ['all nine patterns', '机制', /Information Expert[\s\S]*Creator[\s\S]*Controller[\s\S]*Low Coupling[\s\S]*High Cohesion[\s\S]*Polymorphism[\s\S]*Pure Fabrication[\s\S]*Indirection[\s\S]*Protected Variations/u],
    ['ownership dimensions', '机制', /信息、创建、协调、变化与基础设施责任/u],
    ['heuristics can conflict', '冲突与适用上下文', /不同方向|相互拉扯|发生冲突/u],
    ['controller is not god object', '误用与反原则', /Controller[^。；\n]*(?:不是|不应成为)[^。；\n]*(?:god object|上帝对象)/u],
    ['expert is not data holder', '误用与反原则', /Information Expert[^。；\n]*(?:不是|不等于)[^。；\n]*(?:数据持有者|数据对象)/u],
    ['pure fabrication has cost', '冲突与适用上下文', /(?:Pure Fabrication[^。；\n]*成本|成本[^。；\n]*Pure Fabrication)/u],
    ['indirection has cost', '冲突与适用上下文', /(?:Indirection[^。；\n]*成本|成本[^。；\n]*Indirection)/u],
    ['protected variation is evidence-led', '机制', /Protected Variations[^。；\n]*变化证据/u],
  ]],
]);

for (const [id, contracts] of decisionContracts) {
  test(`keeps ${id} responsibility boundaries explicit`, () => {
    const body = requiredDocument(id).body;
    for (const [label, heading, pattern] of contracts) {
      assert.match(section(body, heading), pattern, `${id}: ${label}`);
    }
  });
}

test('does not collapse the Batch 4 misconceptions into slogans', () => {
  assert.doesNotMatch(requiredDocument('PR-12').body, /应该在所有地方使用接口/u);
  assert.doesNotMatch(requiredDocument('PR-12').body, /现有代码永远不应修改/u);
  assert.doesNotMatch(requiredDocument('PR-13').body, /Persistence Ignorance[^。\n]*必须使用 ORM/u);
  assert.doesNotMatch(requiredDocument('PR-13').body, /Persistence Ignorance[^。\n]*(?:等于|就是)忽略存储行为/u);
  assert.doesNotMatch(requiredDocument('PR-13').body, /所有上下文[^。\n]*必须禁止持久化注解/u);
  assert.doesNotMatch(requiredDocument('PR-13').body, /数据库成本可以忽略/u);
  assert.doesNotMatch(requiredDocument('PR-14').body, /Controller[^。\n]*(?:就是|应成为)[^。\n]*(?:god object|上帝对象)/u);
  assert.doesNotMatch(requiredDocument('PR-14').body, /Information Expert[^。\n]*就是数据持有者/u);
});
