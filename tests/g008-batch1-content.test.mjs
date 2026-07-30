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

test('publishes MOD-01 as the six-question model-selection router', () => {
  const document = requiredDocument('MOD-01');
  assert.equal(document.file, 'modeling/mod-01-model-selection-overview.mdx');
  assert.equal(document.metadata.slug, '/modeling/mod-01');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.priority, 'P0');
  assert.deepEqual(document.metadata.depends_on, ['FND-03']);
  assert.deepEqual(document.metadata.adjacent_topics, ['MOD-02']);
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
