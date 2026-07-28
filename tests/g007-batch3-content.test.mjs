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
  [
    'PR-09',
    [
      'principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx',
      '/principles/pr-09',
      'P0',
    ],
  ],
  [
    'PR-10',
    [
      'principles/pr-10-idempotency-minimal-coordination.mdx',
      '/principles/pr-10',
      'P0',
    ],
  ],
  [
    'PR-11',
    [
      'principles/pr-11-cqs-cqrs-read-write-separation.mdx',
      '/principles/pr-11',
      'P1',
    ],
  ],
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
  ['PR-09', ['PR-04', 'PR-07', 'PR-10']],
  ['PR-10', ['PR-07', 'PR-08', 'PR-09', 'PR-11']],
  ['PR-11', ['PR-03', 'PR-04', 'PR-10']],
]);
const routeByTopic = new Map([
  ['PR-03', '/principles/pr-03'],
  ['PR-04', '/principles/pr-04'],
  ['PR-07', '/principles/pr-07'],
  ['PR-08', '/principles/pr-08'],
  ['PR-09', '/principles/pr-09'],
  ['PR-10', '/principles/pr-10'],
  ['PR-11', '/principles/pr-11'],
]);
const solePrimary = new Map([
  ['PR-09', 'src-saltzer-schroeder-protection-1975'],
  ['PR-10', 'src-aws-making-retries-safe-idempotent-apis-2020'],
  ['PR-11', 'src-martin-fowler-cqrs-2011'],
]);
const requiredCase = new Map([
  ['PR-09', '/cases/litellm-virtual-keys-governance'],
  ['PR-10', '/cases/temporal-saga-durable-execution'],
  ['PR-11', '/cases/temporal-saga-durable-execution'],
]);
const decisionContracts = new Map([
  [
    'PR-09',
    [
      ['least privilege is not role count', '误用与反原则', /最小权限不等于角色数量最大化/u],
      ['actual authority includes scope and duration', '机制', /资源、动作、时长与委派路径/u],
      ['indeterminate is not allow', '机制', /缺少策略或策略求值失败都不得变成隐式允许/u],
      ['fail-safe default remains observable', '误用与反原则', /安全默认值不等于静默失败/u],
      ['defense layers require independence', '机制', /额外控制必须针对已命名威胁，并具有有意义的独立性/u],
      ['emergency access has lifecycle', '机制', /紧急权限必须有所有者、审计、过期与撤销/u],
    ],
  ],
  [
    'PR-10',
    [
      ['idempotency protects effect not bytes', '要保护的性质', /幂等保护的是受约束效果，而不是逐字节相同响应/u],
      ['retry keeps one operation identity', '机制', /同一逻辑操作的传输重试必须复用同一幂等键/u],
      ['replay states are explicit', '机制', /in-progress、completed、conflict、expired 与 unknown/u],
      ['unknown is not failed', '机制', /未知结果不是可盲重试的失败/u],
      ['dedupe is not invariant coordination', '冲突与适用上下文', /去重不能替代共享不变量所需的所有权、条件写或串行化/u],
      ['minimal coordination is not zero', '误用与反原则', /最小协调不等于零协调/u],
    ],
  ],
  [
    'PR-11',
    [
      ['CQS scale', '要保护的性质', /CQS 约束方法或接口的可观察状态语义/u],
      ['CQRS scale', '要保护的性质', /CQRS 分离命令与查询责任及其模型/u],
      ['replica is not CQRS', '要保护的性质', /只读副本只是基础设施路由，不能单独证明 CQRS/u],
      ['four outcomes', '机制', /保留现有模型并应用 CQS[\s\S]*优化单模型读取[\s\S]*基础设施读写分流[\s\S]*采用 CQRS/u],
      ['CQRS costs are explicit', '冲突与适用上下文', /投影延迟、read-your-write、回放重建、对账与模式演化/u],
      ['simple CRUD non-use', '误用与反原则', /简单 CRUD 边界没有模型分歧证据时不采用 CQRS/u],
    ],
  ],
]);

const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
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

test('publishes PR-09 through PR-11 with the principle contract', () => {
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
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
});

test('governs sources and visible Batch 3 relationships', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has at least two sources`);
    const primary = governed.citations.filter(({manifest_primary}) => manifest_primary);
    assert.equal(primary.length, 1, `${id} has exactly one manifest primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary identity`);
    const visibleExternal = new Set(extractExternalLinks(document));
    const domains = new Set();
    for (const citation of governed.citations) {
      assert.ok(visibleExternal.has(citation.citation_url), `${id} visible ${citation.source_id}`);
      domains.add(new URL(citation.citation_url).hostname);
    }
    assert.ok(domains.size >= 2, `${id} independent source domains`);
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id)) {
      assert.ok(links.has(routeByTopic.get(adjacent)), `${id} visibly links ${adjacent}`);
    }
    assert.ok(links.has(requiredCase.get(id)), `${id} links its required case`);
    assert.equal(
      [...links].some((link) => /^\/principles\/pr-1[2-7]$/u.test(link)),
      false,
      `${id} must not link unpublished principles`,
    );
  }
});

test('keeps authorization replay and responsibility decisions distinct', () => {
  for (const [id, contracts] of decisionContracts) {
    const body = requiredDocument(id).body;
    for (const [label, heading, pattern] of contracts) {
      assert.match(section(body, heading), pattern, `${id}: ${label}`);
    }
  }
});
