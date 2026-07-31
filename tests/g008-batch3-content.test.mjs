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

function markdownTableRows(body) {
  return body
    .split('\n')
    .filter((line) => /^\|.+\|$/u.test(line))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/u.test(cell)));
}

function fencedBlock(body, language) {
  const matches = [...body.matchAll(
    new RegExp(`\\\`\\\`\\\`${language}\\n([\\s\\S]*?)\\n\\\`\\\`\\\``, 'gu'),
  )];
  assert.equal(matches.length, 1, `expected exactly one ${language} block`);
  return matches[0][1];
}

test('publishes MOD-05 as one progressive expense-claim data model', () => {
  const document = requiredDocument('MOD-05');
  assert.equal(
    document.file,
    'modeling/mod-05-conceptual-logical-physical-data-model.mdx',
  );
  assert.equal(document.metadata.slug, '/modeling/mod-05');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.priority, 'P0');
  assert.deepEqual(document.metadata.depends_on, ['MOD-01']);
  assert.deepEqual(document.metadata.adjacent_topics, ['MOD-04', 'PR-13']);
  assert.deepEqual(document.metadata.related_cases, [
    '/cases/temporal-saga-durable-execution',
  ]);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );
  for (const label of [
    '概念模型',
    '逻辑模型',
    '可移植关系模式',
    'PostgreSQL 18 物理实现切片',
  ]) {
    assert.match(document.body, new RegExp(label, 'u'), label);
  }
  assert.match(document.body, /费用申报系统/u);
  assert.match(document.body, /银行支付服务/u);
});

test('keeps the portable schema distinct from a DBMS physical model', () => {
  const body = requiredDocument('MOD-05').body;
  assert.match(body, /可移植关系模式[^。\n]*(?:不等于|不是)[^。\n]*(?:严格|完整)[^。\n]*物理模型/u);
  assert.match(body, /PostgreSQL 18[^。\n]*(?:切片|示例)/u);
  assert.match(body, /不是[^。\n]*(?:生产 schema|生产数据库|可部署 schema)/u);
  assert.match(body, /本站原创[^。\n]*教学/u);
  assert.doesNotMatch(body, /CREATE\s+TABLE/iu);
});

test('uses only published relationships and leaves MOD-06 unlinked', () => {
  const document = requiredDocument('MOD-05');
  const links = new Set(extractInternalLinks(document));
  for (const slug of [
    '/modeling',
    '/modeling/mod-01',
    '/modeling/mod-02',
    '/modeling/mod-04',
    '/principles/pr-13',
    '/cases/temporal-saga-durable-execution',
  ]) {
    assert.ok(links.has(slug), slug);
  }
  assert.equal(links.has('/modeling/mod-06'), false);
  assert.match(document.body, /MOD-06[^。\n]*尚未发布/u);
});
