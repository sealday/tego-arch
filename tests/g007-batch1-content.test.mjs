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
  ['PR-01', ['principles/pr-01-information-hiding.mdx', '/principles/pr-01']],
  ['PR-02', ['principles/pr-02-cohesion-coupling.mdx', '/principles/pr-02']],
  ['PR-03', ['principles/pr-03-single-responsibility-separation-of-concerns.mdx', '/principles/pr-03']],
  ['PR-04', ['principles/pr-04-dip-ioc-dependency-injection.mdx', '/principles/pr-04']],
  ['PR-05', ['principles/pr-05-composition-over-inheritance.mdx', '/principles/pr-05']],
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
  ['PR-01', ['PR-02', 'PR-03', 'PR-04', 'PR-06', 'PR-08', 'PR-12', 'STY-00']],
  ['PR-02', ['PR-01', 'PR-03', 'PR-05', 'PR-06', 'PR-07', 'PR-12', 'PR-14']],
  ['PR-03', ['PR-01', 'PR-02', 'PR-05', 'PR-11', 'PR-12', 'PR-13', 'PR-14']],
  ['PR-04', ['PR-01', 'PR-05', 'PR-07', 'PR-08', 'PR-09', 'PR-11', 'PR-12', 'PR-13', 'PR-14']],
  ['PR-05', ['PR-02', 'PR-03', 'PR-04', 'PR-06', 'PR-08', 'PR-12']],
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

test('publishes PR-01 through PR-05 with the principle contract', () => {
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
      .split(/\r?\n/)
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

test('governs sources and reciprocal visible relationships', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has two sources`);
    assert.equal(
      governed.citations.filter(({manifest_primary}) => manifest_primary).length,
      1,
      `${id} has exactly one manifest primary`,
    );
    assert.ok(extractExternalLinks(document).length >= 2, `${id} visible sources`);
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id).filter((topic) => topic.startsWith('PR-'))) {
      assert.ok(links.has(`/principles/${adjacent.toLowerCase()}`), `${id} visibly links ${adjacent}`);
    }
    assert.ok([...links].some((link) => link.startsWith('/cases/')), `${id} links a case`);
    assert.equal(
      [...links].some((link) => /^\/principles\/pr-1[5-7]$/u.test(link)),
      false,
      `${id} must not link unpublished principles`,
    );
  }
});

test('keeps the five concepts distinct at their decision boundaries', () => {
  assert.match(requiredDocument('PR-01').body, /设计决策|访问修饰符|private/iu);
  assert.match(requiredDocument('PR-02').body, /变化耦合|运行时耦合|数据耦合|团队耦合/u);
  assert.match(requiredDocument('PR-03').body, /变化原因|责任主体|关注点分离|一件事/u);
  assert.ok(
    ledger.documents['content/principles/pr-03-single-responsibility-separation-of-concerns.mdx']
      .citations.some(({source_id}) => source_id === 'src-dijkstra-ewd447-1974'),
    'PR-03 governs Dijkstra EWD447 as an original separation-of-concerns source',
  );
  assert.match(requiredDocument('PR-04').body, /依赖倒置|控制反转|依赖注入|容器/u);
  assert.match(requiredDocument('PR-05').body, /多态|共享实现|状态耦合|替换成本/u);
});
