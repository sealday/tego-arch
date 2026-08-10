import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const [ledger, linkHealth, licenseInventory] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
]);

const [manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const sty03 = documents.find(({file}) => file === 'styles/sty-03-vertical-slice-architecture.mdx');
const sty01 = documents.find(({file}) => file === 'styles/sty-01-layered-architecture.mdx');
const sty02 = documents.find(({file}) => file === 'styles/sty-02-hexagonal-onion-clean.mdx');
const moduleBoundaries = documents.find(({file}) => file === 'paths/02-module-boundaries.mdx');

const STY03 = 'STY-03';
const STY03_SLUG = '/styles/sty-03';
const SOURCE_IDS = [
  'src-bogard-vertical-slice-architecture',
  'src-microsoft-eshoponweb-architecture',
];
const SOURCE_URLS = [
  'https://www.jimmybogard.com/vertical-slice-architecture/',
  'https://github.com/dotnet-architecture/eShopOnWeb',
];
const DIAGRAM_DRAWIO = 'diagrams/sty-03-vertical-slice-boundary.drawio';
const DIAGRAM_SVG = 'static/img/diagrams/sty-03-vertical-slice-boundary.svg';
const REQUIRED_HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
const LEARNING_QUESTIONS = [
  '变化半径如何从共享技术层转移到提交订单用例边界？',
  '如何判断一个用例切片应当拥有哪些边界和数据访问能力？',
  '共享领域不变量在多个切片之间如何保持一致？',
  '为什么代码切片不自动意味着独立部署或故障域？',
];
const COMPARISON_ROWS = [
  ['组织单元', '技术层', '提交订单用例切片', '能力模块'],
  ['控制流', '请求横向穿过共享层', '请求在切片内端到端流动', '模块内封装用例'],
  ['依赖', '业务依赖共享技术层', '切片拥有用例所需依赖', '模块依赖显式合同'],
  ['数据所有权', '共享模型和仓储', '切片或领域能力拥有数据', '模块拥有数据边界'],
  ['一致性', '跨层共享事务', '在不变量边界内保持一致', '模块合同约束一致性'],
  ['部署', '通常是单体', '可以共存于单体', '通常是单体'],
  ['团队拓扑', '按技术层分工', '按业务能力分工', '按模块责任分工'],
  ['质量属性', '结构熟悉但变化半径可能较大', '变化隔离但重复风险增加', '边界清晰但治理成本存在'],
  ['迁移', '先识别高变化用例', '逐个迁移端到端切片', '收紧模块合同'],
  ['禁用条件', '不适合频繁跨层变化', '不适合强共享且低变化场景', '不适合边界尚未稳定场景'],
];
const DIAGRAM_LABELS = [
  '分层架构', '垂直切片', 'SubmitOrder', '共享领域不变量', '数据库',
  '单体部署边界', '运行时控制流', '源码依赖', '切片不等于独立部署单元',
];

function bodyOf(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '');
}

function internalLinksOf(document) {
  return extractInternalLinks({body: bodyOf(document.source)});
}

function externalLinksOf(document) {
  return extractExternalLinks({body: bodyOf(document.source)});
}

function markdownTables(source) {
  const tables = [];
  const lines = source.split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\|.*\|$/u.test(lines[index]) || !/^\|(?:\s*:?-+:?\s*\|)+$/u.test(lines[index + 1] ?? '')) continue;
    const rows = [];
    for (; index < lines.length && /^\|.*\|$/u.test(lines[index]); index += 1) {
      if (/^\|(?:\s*:?-+:?\s*\|)+$/u.test(lines[index])) continue;
      rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim()));
    }
    tables.push(rows);
  }
  return tables;
}

function sectionBody(source, heading, nextHeading) {
  const start = source.indexOf(`## ${heading}`);
  assert.ok(start >= 0, `${heading} section`);
  const end = nextHeading ? source.indexOf(`## ${nextHeading}`, start + heading.length + 3) : source.length;
  assert.ok(end > start, `${heading} section end`);
  return source.slice(start, end);
}

test('publishes STY-03 metadata and the eleven-section style contract', () => {
  assert.ok(sty03, 'STY-03 page must exist after implementation');
  const metadata = parseFrontMatter(sty03.source);
  assert.equal(metadata.topic_id, STY03);
  assert.equal(metadata.slug, STY03_SLUG);
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.difficulty, 'intermediate');
  assert.equal(metadata.priority, 'P0');
  assert.deepEqual(metadata.depends_on, ['STY-00', 'STY-01']);
  assert.deepEqual(metadata.adjacent_topics, ['STY-01', 'STY-02', 'STY-04']);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(metadata.related_questions, []);
  assert.ok(Array.isArray(metadata.quality_attributes));
  assert.deepEqual(findMarkdownHeadings(sty03.body).map(({text}) => text), REQUIRED_HEADINGS);
});

test('locks the four learning questions, order scenario, and comparison dimensions', () => {
  assert.ok(sty03);
  const learningQuestions = [...sectionBody(sty03.source, '学习问题', '组件、连接器与约束')
    .matchAll(/^- (.+？)$/gmu)].map(([, question]) => question);
  assert.deepEqual(learningQuestions, LEARNING_QUESTIONS);
  assert.match(sty03.source, /提交订单/u);
  assert.match(sty03.source, /SubmitOrder/u);
  const tables = markdownTables(sty03.source);
  assert.ok(tables.some((rows) => rows.length === COMPARISON_ROWS.length + 1 &&
    COMPARISON_ROWS.every((row) => rows.some((candidate) => JSON.stringify(candidate) === JSON.stringify(row)))));
  for (const section of REQUIRED_HEADINGS.slice(1, -1)) assert.match(sty03.source, new RegExp(section, 'u'));
  assert.match(sty03.source, /不是固定目录模板/u);
  assert.match(sty03.source, /不自动.*独立部署单元/u);
});

test('requires STY-03 sources, citations, and reviewed transport evidence', () => {
  assert.ok(sty03);
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  const healthBySource = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  const documentReview = ledger.documents[sty03.file];
  assert.ok(documentReview, 'STY-03 source review record');
  assert.deepEqual(documentReview.citations.map(({source_id}) => source_id), SOURCE_IDS);
  for (const [id, url] of SOURCE_IDS.map((id, index) => [id, SOURCE_URLS[index]])) {
    const record = records.get(id);
    assert.ok(record, `${id} ledger record`);
    assert.equal(record.canonical_locator, url);
    assert.ok(record.author_or_org, `${id} source identity`);
    assert.ok(record.checked_at, `${id} health date`);
    assert.ok(record.license, `${id} license`);
    assert.ok(record.license_evidence_url, `${id} license evidence`);
    assert.ok(record.usage_boundary, `${id} usage boundary`);
    assert.equal(healthBySource.get(id)?.review_status, 'healthy', `${id} reviewed health`);
    assert.ok(licenseInventory.includes(record.license_family_id), `${id} license inventory`);
    assert.ok(externalLinksOf(sty03).includes(url), `${id} visible citation`);
  }
});

test('keeps adjacent relations reciprocal without activating STY-04', () => {
  assert.ok(sty03);
  assert.ok(sty01);
  assert.ok(sty02);
  assert.ok(moduleBoundaries);
  assert.ok(parseFrontMatter(sty01.source).adjacent_topics.includes(STY03));
  assert.ok(parseFrontMatter(sty02.source).adjacent_topics.includes(STY03));
  assert.ok(internalLinksOf(sty01).includes(STY03_SLUG));
  assert.ok(internalLinksOf(sty02).includes(STY03_SLUG));
  assert.ok(internalLinksOf(sty03).includes('/styles/sty-01'));
  assert.ok(internalLinksOf(sty03).includes('/styles/sty-02'));
  assert.ok(internalLinksOf(moduleBoundaries).includes(STY03_SLUG));
  assert.equal(parseFrontMatter(sty03.source).adjacent_topics.includes('STY-04'), true);
  assert.equal(manifest.topics.find(({id}) => id === 'STY-04')?.published, false);
  assert.equal(manifest.topics.find(({id}) => id === 'STY-04')?.status.value, 'pending');
});

test('projects the completed STY-03 topic and exact Batch 4 counts', () => {
  const topic = manifest.topics.find(({id}) => id === STY03);
  assert.equal(topic?.published, true);
  assert.equal(topic?.slug, STY03_SLUG);
  assert.equal(topic?.status.value, 'complete');
  assert.deepEqual(topic?.dependencies, ['STY-00', 'STY-01']);
  assert.deepEqual(topic?.adjacent_topics, ['STY-01', 'STY-02', 'STY-04']);
  assert.deepEqual(topic?.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.equal(projectStatus.completed_topics, 56);
  assert.equal(projectStatus.content_documents, 98);
  assert.equal(projectStatus.governed_sources, 508);
  assert.equal(publicLedger.sources.length, 508);
  assert.ok(indexes.style.some(({id, status}) => id === STY03 && status.value === 'complete'));
});

test('publishes the synchronized STY-03 diagram pair with the minimum inventory', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DIAGRAM_DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${DIAGRAM_SVG}`, import.meta.url), 'utf8'),
  ]);
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<title\b[^>]*>[^<]+<\/title>/u);
  assert.match(svg, /<desc\b[^>]*>[^<]+<\/desc>/u);
  for (const label of DIAGRAM_LABELS) {
    assert.ok(drawio.includes(label), `Draw.io label: ${label}`);
    assert.ok(svg.includes(label), `SVG label: ${label}`);
  }
  const drawioNodes = [...drawio.matchAll(/<mxCell\b[^>]*\bvertex="1"/gu)];
  const drawioEdges = [...drawio.matchAll(/<mxCell\b[^>]*\bedge="1"/gu)];
  const svgNodes = [...svg.matchAll(/data-node-id=/gu)];
  const svgEdges = [...svg.matchAll(/data-edge-id=/gu)];
  assert.ok(drawioNodes.length >= 8, 'Draw.io has at least eight visible nodes');
  assert.ok(drawioEdges.length >= 10, 'Draw.io has at least ten directed relations');
  assert.equal(svgNodes.length, drawioNodes.length, 'paired node inventory');
  assert.equal(svgEdges.length, drawioEdges.length, 'paired relation inventory');
});
