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
const COMPARISON_HEADER = ['比较维度', '分层架构', '垂直切片', '模块化单体'];
const DIAGRAM_NODES = [
  ['deployment-boundary', '单体部署边界', ''],
  ['layered-boundary', '分层架构', ''],
  ['vertical-slice-boundary', '垂直切片', ''],
  ['submit-order-boundary', 'SubmitOrder', ''],
  ['shared-domain-invariants', '共享领域不变量', ''],
  ['layered-http', 'HTTP 请求', '入口 / Request'],
  ['layered-controller', 'Controller', '接口层 / Web'],
  ['layered-service', 'Application Service', '应用层 / Shared Service'],
  ['layered-repository', 'Shared Repository', '共享数据访问 / Infrastructure'],
  ['layered-database', '数据库', 'Shared Database'],
  ['slice-http', 'HTTP 请求', '入口 / Request'],
  ['submit-order-handler', 'SubmitOrder Handler', '切片入口 / Use Case Handler'],
  ['order-rules', 'Order Rules', '领域规则 / Policy'],
  ['inventory-port', 'Inventory Port', 'Driven Port'],
  ['order-store', 'Order Store', 'Persistence Port'],
  ['response-mapper', 'Response Mapper', '输出映射 / Presenter'],
  ['inventory-adapter', 'Inventory Adapter', '外部机制 / Adapter'],
  ['legend-runtime-line', '', ''],
  ['legend-dependency-line', '', ''],
  ['legend-runtime', '运行时控制流', ''],
  ['legend-dependency', '源码依赖', ''],
  ['deployment-note', '切片不等于独立部署单元', ''],
];
const DIAGRAM_EDGES = [
  ['layered-request', 'layered-http', 'layered-controller', '接收请求', [115, 0], [375, 433]],
  ['layered-controller-service', 'layered-controller', 'layered-service', '调用应用', [115, 0], [375, 703]],
  ['layered-service-repository', 'layered-service', 'layered-repository', '访问仓储', [115, 0], [375, 973]],
  ['layered-repository-database', 'layered-repository', 'layered-database', '写入数据', [115, 0], [375, 1243]],
  ['slice-request-handler', 'slice-http', 'submit-order-handler', '进入切片', [125, 0], [1330, 503]],
  ['slice-handler-rules', 'submit-order-handler', 'order-rules', '执行业务规则', [365, 0], [1640, 765]],
  ['slice-rules-inventory', 'order-rules', 'inventory-port', '查询库存', [0, -45], [1110, 1063]],
  ['slice-rules-store', 'order-rules', 'order-store', '保存订单', [0, -45], [1448, 1063]],
  ['slice-rules-response', 'order-rules', 'response-mapper', '映射响应', [0, -45], [1585, 1393]],
  ['layered-repository-service-dependency', 'layered-repository', 'layered-service', '依赖抽象', [40, 0], [720, 960]],
  ['inventory-adapter-port-dependency', 'inventory-adapter', 'inventory-port', '实现端口', [100, 0], [1095, 1408]],
];
const DIAGRAM_BOUNDARIES = [
  ['deployment-boundary', '单体部署边界'],
  ['layered-boundary', '分层架构'],
  ['vertical-slice-boundary', '垂直切片'],
  ['submit-order-boundary', 'SubmitOrder'],
  ['shared-domain-invariants', '共享领域不变量'],
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

function xmlAttributes(tag) {
  return new Map([...tag.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value]));
}

function decodeXmlText(value) {
  return value.replace(/&amp;/gu, '&').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"').replace(/&#39;/gu, "'");
}

function visibleDrawioCells(source) {
  return [...source.matchAll(/<mxCell\b[^>]*>/gu)].map(([tag]) => {
    const attributes = xmlAttributes(tag);
    const style = attributes.get('style') ?? '';
    if (attributes.get('visible') === '0' || /(?:^|;)\s*(?:opacity=0|visible=0)(?:;|$)/u.test(style)) return null;
    return {attributes, label: decodeXmlText(attributes.get('value') ?? '')};
  }).filter(Boolean);
}

function hiddenStylesheetClasses(source) {
  const classes = new Set();
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      if (!/(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|opacity\s*:\s*0(?:\D|$))/u.test(declarations)) continue;
      for (const selector of selectors.split(',')) {
        const className = selector.trim().match(/^\.([\w-]+)$/u)?.[1];
        if (className) classes.add(className);
      }
    }
  }
  return classes;
}

function elementIsHidden(attributes, hiddenClasses) {
  const values = xmlAttributes(attributes);
  const presentation = `${attributes};${values.style ?? ''}`;
  if (/(?:display\s*(?::|=\s*")\s*none|visibility\s*(?::|=\s*")\s*(?:hidden|collapse)|opacity\s*(?::|=\s*")\s*0(?:\D|$))/u.test(presentation)) return true;
  if (values['aria-hidden'] === 'true') return true;
  return (values.class ?? '').split(/\s+/u).some((className) => hiddenClasses.has(className));
}

function visibleSvgText(source) {
  const hiddenClasses = hiddenStylesheetClasses(source);
  const stack = [];
  const visible = [];
  const withoutComments = source.replace(/<!--[\s\S]*?-->/gu, '');
  for (const [token] of withoutComments.matchAll(/<\/?[\w:-]+\b[^>]*>|[^<]+/gu)) {
    if (!token.startsWith('<')) {
      const textFrame = stack.findLast((frame) => frame.name === 'text');
      if (textFrame && !stack.at(-1).hidden) textFrame.content += token;
      continue;
    }
    if (token.startsWith('</')) {
      const frame = stack.pop();
      if (frame?.name === 'text' && !frame.hidden) visible.push(decodeXmlText(frame.content.trim()));
      continue;
    }
    const [, name = '', attributes = ''] = token.match(/^<([\w:-]+)\b([^>]*)>/u) ?? [];
    const hidden = (stack.at(-1)?.hidden ?? false) || elementIsHidden(attributes, hiddenClasses);
    const frame = {name, hidden, content: ''};
    if (!/\/\s*>$/u.test(token)) stack.push(frame);
  }
  return visible.filter(Boolean);
}

function drawioDiagramContract(source) {
  const cells = visibleDrawioCells(source);
  const typeCells = cells.filter(({attributes}) => attributes.get('dataRole') === 'type');
  const typesByParent = new Map(typeCells.map(({attributes, label}) => [attributes.get('parent'), label]));
  return {
    nodes: cells.filter(({attributes}) => attributes.get('vertex') === '1' && attributes.get('dataRole') !== 'type')
      .map(({attributes, label}) => ({id: attributes.get('id'), label, visibleTypeLabel: typesByParent.get(attributes.get('id')) ?? ''})),
    typeCells: typeCells.map(({attributes, label}) => ({id: attributes.get('id'), parent: attributes.get('parent'), label, style: attributes.get('style') ?? ''})),
    edges: cells.filter(({attributes}) => attributes.get('edge') === '1')
      .map(({attributes, label}) => ({id: attributes.get('id'), label, source: attributes.get('source'), target: attributes.get('target')})),
  };
}

function svgDiagramContract(source) {
  const nodes = [...source.matchAll(/<g\b([^>]*)data-node-id="([^"]+)"([^>]*)>([\s\S]*?)<\/g>/gu)]
    .filter(([, before, , after]) => !/(?:style|visibility)="[^"]*(?:display\s*:\s*none|hidden)/u.test(`${before}${after}`))
    .map(([, before, id, after, contents]) => ({
      id,
      label: decodeXmlText(contents.match(/<text\b[^>]*data-text-role="title"[^>]*>([^<]+)<\/text>/u)?.[1] ?? ''),
      typeLabel: decodeXmlText(xmlAttributes(`${before}${after}`).get('data-type-label') ?? ''),
      visibleTypeLabel: decodeXmlText(contents.match(/<text\b[^>]*data-text-role="type"[^>]*>([^<]+)<\/text>/u)?.[1] ?? ''),
    }));
  const labels = new Map([...source.matchAll(/<text\b[^>]*data-edge-id="([^"]+)"[^>]*>([^<]*)<\/text>/gu)]
    .map(([, id, label]) => [id, decodeXmlText(label).trim()]));
  const edges = [...source.matchAll(/<path\b([^>]*)data-edge-id="([^"]+)"([^>]*)>/gu)].map(([, before, id, after]) => {
    const attributes = xmlAttributes(`${before}${after}`);
    const labelTag = source.match(new RegExp(`<text\\b([^>]*)data-edge-id="${id}"([^>]*)>`, 'u'));
    const labelAttributes = xmlAttributes(`${labelTag?.[1] ?? ''}${labelTag?.[2] ?? ''}`);
    return {
      id, label: labels.get(id) ?? '', source: attributes.get('data-source'), target: attributes.get('data-target'),
      labelX: Number(labelAttributes.get('x')), labelY: Number(labelAttributes.get('y')),
    };
  });
  return {nodes, edges};
}

function drawioEdgeGeometry(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = source.match(new RegExp(`<mxCell\\b([^>]*)\\bid="${escapedId}"([^>]*)>([\\s\\S]*?)<\\/mxCell>`, 'u'));
  assert.ok(match, `Draw.io edge geometry ${id}`);
  const attributes = xmlAttributes(`${match[1]}${match[2]}`);
  const style = new Map((attributes.get('style') ?? '').split(';').filter(Boolean).map((part) => part.split('=')));
  const waypointSource = match[3].match(/<Array\b[^>]*as="points"[^>]*>([\s\S]*?)<\/Array>/u)?.[1] ?? '';
  const points = [...waypointSource.matchAll(/<mxPoint\b[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*\/>/gu)]
    .map(([, x, y]) => [Number(x), Number(y)]);
  const offsetTag = [...match[3].matchAll(/<mxPoint\b([^>]*)\/>/gu)]
    .map(([, attributes]) => xmlAttributes(attributes)).find((attributes) => attributes.get('as') === 'offset');
  return {style, points, offset: [Number(offsetTag?.get('x')), Number(offsetTag?.get('y'))]};
}

function drawioCellGeometry(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = source.match(new RegExp(`<mxCell\\b[^>]*\\bid="${escapedId}"[^>]*>([\\s\\S]*?)<\\/mxCell>`, 'u'));
  assert.ok(match, `Draw.io cell geometry ${id}`);
  const geometryTag = match[1].match(/<mxGeometry\b([^>]*)\/>/u);
  assert.ok(geometryTag, `Draw.io mxGeometry ${id}`);
  const geometry = xmlAttributes(geometryTag[1]);
  return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(geometry.get(key) ?? 0)]));
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
  const comparisonTable = tables.find((rows) => rows.length === COMPARISON_ROWS.length + 1 &&
    JSON.stringify(rows[0]) === JSON.stringify(COMPARISON_HEADER));
  assert.ok(comparisonTable, 'comparison table header and row count');
  assert.deepEqual(comparisonTable.slice(1), COMPARISON_ROWS, 'comparison table row order and exact columns');
  for (const section of REQUIRED_HEADINGS.slice(1, -1)) assert.match(sty03.source, new RegExp(section, 'u'));
  assert.match(sty03.source, /不是固定目录模板/u);
  assert.match(sty03.source, /不自动.*独立部署单元/u);
});

test('embeds the comparison diagram accessibly and separates knowledge claims', () => {
  assert.ok(sty03);
  assert.match(sty03.source,
    /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u);
  assert.match(sty03.source,
    /<div className="architecture-diagram-scroll" role="region" aria-label="分层架构与垂直切片的提交订单边界对照图，可横向滚动" tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}>\s+!\[提交订单在分层架构与垂直切片架构中的边界、控制流与单体部署关系\]\(\/img\/diagrams\/sty-03-vertical-slice-boundary\.svg\)\s+<\/div>/u);
  for (const marker of ['来源支持的事实', '证据推断', 'Tego Arch 分析', '未知生产结果']) {
    assert.match(sty03.source, new RegExp(`\\*\\*${marker}：\\*\\*`, 'u'), `${marker} marker`);
  }
  assert.doesNotMatch(sty03.source, /当前骨架|后续(?:内容)?任务|本阶段只/u);
});

test('requires STY-03 sources, citations, and reviewed transport evidence', () => {
  assert.ok(sty03);
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  const healthBySource = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  const documentReview = ledger.documents[`content/${sty03.file}`];
  assert.ok(documentReview, 'STY-03 source review record');
  assert.equal(documentReview.reviewed_at, '2026-08-10');
  assert.deepEqual(documentReview.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(documentReview.citations.map(({source_id}) => source_id), SOURCE_IDS);
  assert.deepEqual(documentReview.citations.map(({manifest_primary}) => manifest_primary), [true, true]);
  for (const citation of documentReview.citations) {
    assert.equal(citation.usage_mode, 'facts-summary');
    assert.equal(citation.modification_note, null);
    assert.equal(citation.excerpt, null);
    assert.equal(citation.quotation_reviewed, false);
    assert.ok(citation.attribution_note?.trim(), `${citation.source_id} attribution`);
  }
  for (const [id, url] of SOURCE_IDS.map((id, index) => [id, SOURCE_URLS[index]])) {
    const record = records.get(id);
    assert.ok(record, `${id} ledger record`);
    assert.equal(record.canonical_locator, url);
    assert.ok(record.author_or_org, `${id} source identity`);
    assert.equal(record.registered_at, '2026-08-10', `${id} registration date`);
    assert.equal(record.checked_at, '2026-08-10', `${id} health date`);
    assert.equal(record.expected_final_approved_at, '2026-08-10', `${id} transport approval date`);
    for (const [field, value] of [
      ['version', record.version],
      ['license_evidence_note', record.license_evidence_note],
      ['expected_final_approval_note', record.expected_final_approval_note],
    ]) {
      assert.doesNotMatch(value, /2026-08-08/u, `${id} ${field} must not claim a 2026-08-08 live review`);
      assert.match(value, /2026-08-10/u, `${id} ${field} actual review date`);
    }
    assert.ok(record.license, `${id} license`);
    assert.ok(record.license_evidence_url, `${id} license evidence`);
    assert.ok(record.usage_boundary, `${id} usage boundary`);
    const health = healthBySource.get(id);
    assert.equal(health?.last_attempt?.outcome, 'healthy', `${id} current transport`);
    assert.equal(health?.review_status, 'healthy', `${id} reviewed health`);
    assert.equal(health?.last_attempt?.final_transport_locator, record.transport_locator, `${id} final transport`);
    assert.ok(health?.last_attempt?.at, `${id} health timestamp`);
    const escapedFamily = record.license_family_id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    assert.match(licenseInventory, new RegExp(`^\\|\\s*${escapedFamily}\\s*\\|`, 'mu'), `${id} license inventory`);
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
  assert.ok(internalLinksOf(sty03).includes('/cases/micro-frontends-single-spa'));
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
  assert.deepEqual(topic?.primary_sources, SOURCE_URLS);
  const styleIndexEntry = indexes.style.find(({id}) => id === STY03);
  assert.deepEqual(styleIndexEntry?.primary_sources, SOURCE_URLS);
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
  assert.match(svg, /<svg\b(?=[^>]*\bviewBox="0 0 1800 1950")(?=[^>]*\brole="img")(?=[^>]*\baria-labelledby="[^"]+")[^>]*>/u);
  assert.doesNotMatch(svg.match(/<svg\b[^>]*>/u)?.[0] ?? '', /\b(?:width|height)="/u, 'responsive SVG root');
  const drawioContract = drawioDiagramContract(drawio);
  const svgContract = svgDiagramContract(svg);
  const drawioNodeMap = new Map(drawioContract.nodes.map((node) => [node.id, node]));
  const svgNodeMap = new Map(svgContract.nodes.map((node) => [node.id, node]));
  assert.equal(drawioNodeMap.size, drawioContract.nodes.length, 'Draw.io node IDs are unique');
  assert.equal(svgNodeMap.size, svgContract.nodes.length, 'SVG node IDs are unique');
  assert.deepEqual([...drawioNodeMap.keys()].sort(), [...svgNodeMap.keys()].sort(), 'paired node inventory');
  for (const [id, label, typeLabel] of DIAGRAM_NODES) {
    assert.equal(drawioNodeMap.get(id)?.label, label, `Draw.io node ${id} title`);
    assert.equal(svgNodeMap.get(id)?.label, label, `SVG node ${id} title`);
    assert.equal(drawioNodeMap.get(id)?.visibleTypeLabel, typeLabel, `Draw.io node ${id} visible type`);
    assert.equal(svgNodeMap.get(id)?.typeLabel, typeLabel, `SVG node ${id} data type`);
    assert.equal(svgNodeMap.get(id)?.visibleTypeLabel, typeLabel, `SVG node ${id} visible type`);
    if (typeLabel) {
      const typeCell = drawioContract.typeCells.find(({parent}) => parent === id);
      assert.equal(typeCell?.label, typeLabel, `Draw.io node ${id} type child value`);
      assert.match(typeCell?.style ?? '', /(?:^|;)text(?:;|$)/u, `Draw.io node ${id} type child is visible text`);
      assert.match(typeCell?.style ?? '', /(?:^|;)fontSize=23(?:;|$)/u, `Draw.io node ${id} type child font size`);
      const parentGeometry = drawioCellGeometry(drawio, id);
      const childGeometry = drawioCellGeometry(drawio, `${id}-type`);
      assert.ok(childGeometry.x >= 0 && childGeometry.y >= 0 &&
        childGeometry.x + childGeometry.width <= parentGeometry.width &&
        childGeometry.y + childGeometry.height <= parentGeometry.height, `Draw.io node ${id} type child stays inside parent`);
    }
  }
  const drawioEdges = new Map(drawioContract.edges.map((edge) => [edge.id, edge]));
  const svgEdges = new Map(svgContract.edges.map((edge) => [edge.id, edge]));
  assert.equal(drawioEdges.size, drawioContract.edges.length, 'Draw.io edge IDs are unique');
  assert.equal(svgEdges.size, svgContract.edges.length, 'SVG edge IDs are unique');
  for (const [id, source, target, label, drawioOffset, svgLabelPosition] of DIAGRAM_EDGES) {
    assert.equal(drawioEdges.get(id)?.source, source, `Draw.io edge ${id} source`);
    assert.equal(drawioEdges.get(id)?.target, target, `Draw.io edge ${id} target`);
    assert.equal(drawioEdges.get(id)?.label, label, `Draw.io edge ${id} label`);
    assert.equal(svgEdges.get(id)?.source, source, `SVG edge ${id} source`);
    assert.equal(svgEdges.get(id)?.target, target, `SVG edge ${id} target`);
    assert.equal(svgEdges.get(id)?.label, label, `SVG edge ${id} label`);
    assert.deepEqual(drawioEdgeGeometry(drawio, id).offset, drawioOffset, `Draw.io edge ${id} actual label offset`);
    assert.deepEqual([svgEdges.get(id)?.labelX, svgEdges.get(id)?.labelY], svgLabelPosition, `SVG edge ${id} actual text position`);
  }
  const visibleDrawioLabels = drawioContract.nodes.map(({label}) => label)
    .concat(drawioContract.edges.map(({label}) => label));
  assert.ok(DIAGRAM_LABELS.every((label) => visibleDrawioLabels.includes(label)), 'Draw.io visible semantic labels');
  assert.ok(DIAGRAM_LABELS.every((label) => visibleSvgText(svg).includes(label)), 'SVG visible semantic labels');
  assert.ok(DIAGRAM_BOUNDARIES.every(([id, label]) => drawioNodeMap.get(id)?.label === label), 'comparison boundaries');
  assert.equal(drawioNodeMap.get('submit-order-boundary')?.label, 'SubmitOrder', 'SubmitOrder slice boundary');
  assert.equal(drawioNodeMap.get('deployment-boundary')?.label, '单体部署边界', 'single deployment boundary');
  assert.ok(drawioContract.nodes.length >= 8, 'Draw.io has at least eight visible nodes');
  assert.ok(drawioContract.edges.length >= 10, 'Draw.io has at least ten directed relations');
  assert.deepEqual([...drawioEdges.keys()], [...svgEdges.keys()], 'paired relation inventory');
  const responseRoute = drawioEdgeGeometry(drawio, 'slice-rules-response');
  assert.equal(responseRoute.style.get('exitX'), '0.75', 'response route exits Order Rules at the lower 75% port');
  assert.equal(responseRoute.style.get('exitY'), '1', 'response route exits from the bottom');
  assert.equal(responseRoute.style.get('entryX'), '0.5', 'response route enters Response Mapper at its top center');
  assert.equal(responseRoute.style.get('entryY'), '0', 'response route enters from the top');
  assert.deepEqual(responseRoute.points, [[1375, 1100], [1700, 1100], [1700, 1425], [1490, 1425]], 'response route waypoints');
  assert.match(svg, /data-edge-id="slice-rules-response"[^>]*d="M1375 1000V1100H1700V1425H1490V1469"/u, 'SVG response route matches Draw.io bottom-to-top route');
  for (const [lineId, className] of [['legend-runtime-line', 'runtime'], ['legend-dependency-line', 'dependency']]) {
    assert.match(drawio, new RegExp(`<mxCell\\b(?=[^>]*\\bid="${lineId}")(?=[^>]*\\blegendLine="${className}")[^>]*>`, 'u'), `Draw.io ${lineId}`);
    assert.match(svg, new RegExp(`<g\\b[^>]*data-node-id="${lineId}"[^>]*data-legend-line="${className}"[^>]*>`, 'u'), `SVG ${lineId}`);
  }
});
