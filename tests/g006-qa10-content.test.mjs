import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {extractMarkdownBody, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks as extractSources} from '../scripts/source-ledger.mjs';

const root = fileURLToPath(new URL('../content/', import.meta.url));
const file = 'quality-attributes/qa-10-cost-efficiency-sustainability.mdx';
const slug = '/quality-attributes/qa-10';
const h2 = ['学习问题','定义与业务目标','质量属性场景','架构策略','测量信号与阈值','权衡与失败模式','相邻质量属性','说明性场景','来源'];
const remotes = ['src-finops-unit-economics','src-green-software-sci'];
const [documents, ledger, backlog] = await Promise.all([
  readContentDocuments(root),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
]);
const document = documents.find((item) => item.file === file);
const sources = new Map(ledger.sources.map((source) => [source.id, source]));

function body() { assert.ok(document, 'QA-10 must be published'); return extractMarkdownBody(document.source); }

test('publishes QA-10 with the canonical quality-attribute contract', () => {
  assert.equal(document?.metadata.slug, slug);
  assert.equal(document?.metadata.topic_id, 'QA-10');
  assert.deepEqual(document?.metadata.depends_on, ['QA-00', 'QA-01']);
  assert.deepEqual(document?.metadata.adjacent_topics, ['QA-03', 'QA-04', 'QA-06', 'QA-08']);
  assert.deepEqual(document?.metadata.related_cases, ['/cases/litellm-virtual-keys-governance', '/cases/aws-cell-shuffle-sharding']);
  assert.deepEqual(document?.headings.filter(({level}) => level === 2).map(({text}) => text), h2);
  assert.match(body(), /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu);
  assert.match(body(), /本站原创|本站分析/u);
  assert.match(body(), /单位经济|有用工作|成本归属|碳|可持续|反弹效应/iu);
  assert.match(body(), /不适用|不应|不能证明|不等于/iu);
});

test('closes reciprocal links and source governance', () => {
  assert.ok(document, 'QA-10 must exist');
  const links = new Set(extractInternalLinks(document));
  for (const target of ['/quality-attributes/qa-03','/quality-attributes/qa-04','/quality-attributes/qa-06','/quality-attributes/qa-08','/cases/litellm-virtual-keys-governance','/cases/aws-cell-shuffle-sharding']) assert.ok(links.has(target), `QA-10 links ${target}`);
  for (const id of remotes) {
    const source = sources.get(id);
    assert.ok(source, `${id} registered`);
    assert.ok(source.version && source.checked_at && source.license_scope && source.usage_boundary, `${id} governed`);
  }
  const entry = ledger.documents[`content/${file}`];
  assert.ok(entry, 'QA-10 ledger document');
  const primary = entry.citations.filter(({manifest_primary}) => manifest_primary);
  assert.equal(primary.length, 1, 'QA-10 has one primary');
  assert.equal(primary[0].source_id, 'src-finops-unit-economics');
  assert.ok(extractSources(document).includes('https://www.finops.org/framework/')); 
  assert.ok(extractSources(document).includes('https://sci.greensoftware.foundation/'));
});

test('closes QA-10 after the exact successful deployment', () => {
  assert.match(backlog, /^- \[x\] \*\*QA-10 /mu);
  assert.match(backlog, /8a2f4408945919643f71a0aae48e009b537de377/u);
  assert.match(backlog, /30243000249/u);
});
