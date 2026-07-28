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
  ['PR-06', ['principles/pr-06-kiss-yagni-dry.mdx', '/principles/pr-06']],
  [
    'PR-07',
    [
      'principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx',
      '/principles/pr-07',
    ],
  ],
  ['PR-08', ['principles/pr-08-evolutionary-design.mdx', '/principles/pr-08']],
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
  ['PR-06', ['PR-01', 'PR-02', 'PR-05', 'PR-08']],
  ['PR-07', ['PR-02', 'PR-04', 'QA-01']],
  ['PR-08', ['PR-01', 'PR-04', 'PR-05', 'PR-06', 'MTH-03', 'MTH-04']],
]);
const solePrimary = new Map([
  ['PR-06', 'src-martin-fowler-yagni-2015'],
  ['PR-07', 'src-aws-rel05-bp01-graceful-degradation'],
  ['PR-08', 'src-martin-fowler-parallel-change-2014'],
]);
const routeByTopic = new Map([
  ['PR-01', '/principles/pr-01'],
  ['PR-02', '/principles/pr-02'],
  ['PR-04', '/principles/pr-04'],
  ['PR-05', '/principles/pr-05'],
  ['PR-06', '/principles/pr-06'],
  ['PR-08', '/principles/pr-08'],
  ['QA-01', '/quality-attributes/qa-01'],
  ['MTH-03', '/methods/mth-03'],
  ['MTH-04', '/methods/mth-04'],
]);

const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
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

test('publishes PR-06 through PR-08 with the principle contract', () => {
  for (const [id, [file, slug]] of expected) {
    const document = requiredDocument(id);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'principle');
    assert.equal(document.metadata.priority, 'P0');
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
    assert.match(document.body, /不应|不适用|反例|误用/u, `${id} negative boundary`);
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
});

test('governs sources and visible Batch 2 relationships', () => {
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
    assert.ok([...links].some((link) => link.startsWith('/cases/')), `${id} links a case`);
    assert.equal(
      [...links].some((link) => /^\/principles\/pr-(?:0[9]|1[0-7])$/u.test(link)),
      false,
      `${id} must not link unpublished principles`,
    );
  }
});

test('keeps Batch 2 decisions distinct from their slogans', () => {
  assert.match(
    requiredDocument('PR-06').body,
    /当前复杂度|未来需求证据|知识重复|同步修改|错误抽象|临时重复/u,
  );
  assert.match(
    requiredDocument('PR-07').body,
    /错误可检测|副作用|可逆|安全状态|降级|诚实|静默/u,
  );
  assert.match(
    requiredDocument('PR-08').body,
    /兼容窗口|可替换点|渐进迁移|遥测|退出条件|重新评估/u,
  );
});
