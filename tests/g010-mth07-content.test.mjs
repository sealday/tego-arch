import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {analyzeCaseText} from '../.codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs';
import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';
import {knowledgeTypeContracts} from '../scripts/content-schema.mjs';

const ARTICLE = 'content/methods/mth-07-fde-enterprise-ai-delivery.mdx';
const DRAWIO = 'diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio';
const SVG = 'static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg';
const H2 = ['学习问题','一页摘要','事实边界','交付门禁图','四阶段控制流','证据、产物与责任','架构决策与权衡','生产化分析','可迁移经验','来源'];
const TRANSFER_H3 = ['可直接复用的机制','只能有限类比的部分','不应照搬的部分'];
const STAGES = ['进场期','立项期','交付期','放大期'];
const GATES = ['需求考古','流程测绘','切口选择','验收标准工程','POC 纪律','职责契约','知识结构化','人机分工设计','合规与风险兜底','渐进放量','信任运营','资产化复制'];
const STAGE_IDS = ['stage-entry','stage-initiation','stage-delivery','stage-scale'];
const GATE_IDS = GATES.map((_, index) => `gate-${String(index + 1).padStart(2, '0')}`);
const FEEDBACK_IDS = ['feedback-rollout-to-acceptance','feedback-compliance-to-scope','feedback-reuse-to-contract'];
const RESPONSIBILITY_IDS = ['owner-customer','owner-delivery','owner-product','owner-platform','owner-security-data'];
const TOPIC_ID = 'MTH-07';
const ROUTE = '/methods/mth-07';
const SOURCE_IDS = [
  'src-anthropic-enterprise-ai', 'src-openai-enterprise-ai',
  'src-nist-ai-rmf-1-0', 'src-atlas-mth07-fde-delivery-gates',
];
const RELATIONS = {
  depends_on: ['MTH-01', 'MTH-02', 'MTH-03'],
  adjacent_topics: ['MTH-04', 'MTH-05', 'MTH-06'],
  related_cases: ['/cases/microsoft-multi-agent-reference-architecture'],
  related_questions: [],
};
const EXACT_METADATA = {
  title: '企业 AI 交付：把不确定性拆成可验证的交付门禁',
  slug: ROUTE,
  content_type: 'method',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-13',
  source_cutoff: '2026-08-13',
  confidence: 'high',
  domains: ['software-architecture', 'enterprise-architecture', 'artificial-intelligence'],
  agent_patterns: [], protocols: [],
  quality_attributes: ['operability', 'reliability', 'security', 'evolvability'],
  tags: ['交付方法', '企业 AI', '门禁', 'POC', '生产化'],
  summary: '以十二个交付门禁把企业 AI 项目的需求、验收、责任、风险和复制路径拆成可验证的阶段性控制流。',
  topic_id: TOPIC_ID, priority: 'P0', ...RELATIONS,
};
const TABLE_COLUMNS = ['阶段', '门禁', '风险', '机制', '证据', '通过条件', '责任人', '失败/返回目标'];
const GATE_ROWS = [
  ['进场期', '需求考古', '把症状当需求', '访谈、工单与日志三角校验', '需求证据包', '可复述真实任务与约束', '客户业务负责人', '返回需求考古'],
  ['进场期', '流程测绘', '局部自动化破坏全流程', '绘制现状、例外与人工队列', '流程图与例外清单', '关键分支有责任人', '交付负责人', '返回需求考古'],
  ['进场期', '切口选择', '价值与可控性失配', '按价值、风险和可逆性排序', '切口决策记录', '选定可逆且可验收切口', '产品负责人', '返回流程测绘'],
  ['立项期', '验收标准工程', '演示替代验收', '把任务转成可测案例与阈值', '验收集与基线', '验收条件可重复执行', '客户业务负责人', '返回切口选择'],
  ['立项期', 'POC 纪律', 'POC 无限扩张', '固定范围、样本、时限和退出条件', 'POC 记录', 'POC 只验证假设', '交付负责人', '返回验收标准工程'],
  ['立项期', '职责契约', '责任落在模糊接口', '程序、AI 与人工职责分离', '职责契约', '不可逆决定有人授权', '客户业务负责人', '返回验收标准工程'],
  ['交付期', '知识结构化', '知识不可追溯', '来源、版本与适用边界结构化', '知识台账', '每项知识可追溯', '产品负责人', '返回职责契约'],
  ['交付期', '人机分工设计', 'AI 越权执行', '候选、复核、授权与队列分层', '分工设计', '人工保留不可逆授权', '客户业务负责人', '返回职责契约'],
  ['交付期', '合规与风险兜底', '风险在上线后暴露', '策略校验、审计、停机与降级', '风险评估与演练', '停止权可实际触发', '安全与数据负责人', '返回切口选择'],
  ['放大期', '渐进放量', '一次性全量上线', '分批、观测、回滚与人工队列', '放量记录', '指标稳定且队列有界', '平台负责人', '返回验收标准工程'],
  ['放大期', '信任运营', '用户绕过或滥用系统', '反馈、申诉、培训与透明度', '运营看板', '信任指标达标', '客户业务负责人', '返回人机分工设计'],
  ['放大期', '资产化复制', '把个案误当通用方案', '沉淀模板、边界与复用检查', '复用包', '新场景重新通过门禁', '交付负责人', '返回职责契约'],
];
const REQUIRED_WRAPPERS = [
  {aria: '企业 AI 交付四阶段十二门禁图，可横向滚动', className: 'architecture-diagram-scroll'},
  {aria: '企业 AI 交付门禁的证据、产物与责任表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
  {aria: '企业 AI 交付架构决策与权衡表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
];

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const [documents, ledger, manifest, projectStatus] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const article = documents.find(({file}) => `content/${file}` === ARTICLE);

function visible(source) {
  return parseMdxVisibleCopy(source, ARTICLE, {includeStructure: true}).blocks.map(({text}) => text).join('\n');
}
function headingOrder(source, level) { return findMarkdownHeadings(source).filter((item) => item.level === level).map(({text}) => text); }
function requiredArticle() { assert.ok(article, `${ARTICLE} must exist after implementation`); return article; }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'); }
function section(source, heading, next) {
  const headings = findMarkdownHeadings(source).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `section ${heading}`);
  const expectedNext = next ? headings.findIndex(({text}, candidate) => candidate > index && text === next) : -1;
  if (next) assert.notEqual(expectedNext, -1, `section ${next}`);
  const start = source.indexOf('\n', headings[index].offset) + 1;
  const end = next ? headings[expectedNext].offset : source.length;
  return source.slice(start, end);
}
function markdownTable(source, header) {
  const candidates = [...source.matchAll(/(?:^|\n)(\|[^\n]+\|\n\|(?:\s*:?-{3,}:?\s*\|)+\n(?:\|[^\n]+\|\n?)+)/gu)].map(([, raw]) => raw.trim());
  const table = candidates.find((candidate) => candidate.split('\n')[0] === `| ${header.join(' | ')} |`);
  assert.ok(table, `table with ${header.join('/')}`); return table;
}
function tableRows(source) {
  const lines = markdownTable(source, TABLE_COLUMNS).split('\n');
  const rows = lines.slice(2).map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));
  assert.deepEqual(rows, GATE_ROWS, 'exact ordered twelve gate rows'); return rows;
}
function assertMetadataAndHeadings(source) {
  assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact complete MTH-07 front matter');
  assert.deepEqual(headingOrder(source, 2), H2, 'exact MTH-07 H2 order');
  assert.deepEqual(headingOrder(section(source, '可迁移经验', '来源'), 3), TRANSFER_H3, 'exact transfer H3 order');
}
function assertGateRows(source) {
  const rows = tableRows(source);
  for (const [index, row] of rows.entries()) {
    assert.equal(row.length, 8, `${GATES[index]} has all eight contract fields`);
    assert.equal(row[0], STAGES[Math.floor(index / 3)], `${GATES[index]} stage`);
    assert.equal(row[1], GATES[index], `${GATES[index]} gate`);
    for (const [cell, label] of [[2, 'risk'], [3, 'mechanism'], [4, 'evidence'], [5, 'pass condition'], [6, 'owner'], [7, 'failure/return target']]) assert.ok(row[cell], `${GATES[index]} ${label}`);
  }
}
function assertEvidenceAndResponsibility(source) {
  const text = visible(source);
  for (const label of ['来源事实', '独立证据', 'Tego Arch 推断']) assert.match(text, new RegExp(label, 'u'), `${label} label`);
  assert.doesNotMatch(text, /(?:薪资|市场|政策)\s*(?:为|达|超过)?\s*\d+[\d,.%亿元万]/u, 'numbers need an independently cited identity');
  for (const literal of ['程序确定性负责执行', 'AI 只给候选建议，不得最终授权不可逆操作', '人工对不可逆操作最终授权', '人工队列有界并有上限', '客户业务负责人有明确停止权']) assert.ok(text.includes(literal), `exact responsibility clause ${literal}`);
  for (const pattern of [
    /POC.{0,24}(?:不是|不等于|不能替代).{0,24}生产/u,
    /生产.{0,24}(?:不是|不等于|不能替代).{0,24}验收/u,
    /验收.{0,24}(?:不是|不等于|不能替代).{0,24}放量/u,
    /放量.{0,24}(?:不是|不等于|不能替代).{0,24}复制/u,
    /程序.{0,36}(?:确定性|确定).{0,24}(?:负责|执行)/u,
    /AI.{0,36}(?:候选|建议).{0,24}(?:不|不得|不能).{0,24}(?:最终|授权|不可逆)/u,
    /人工.{0,36}(?:不可逆|最终).{0,24}(?:授权|批准)/u,
    /人工队列.{0,24}(?:有界|上限)/u,
    /(?:停止权.{0,24}客户业务负责人|客户业务负责人.{0,24}停止权)/u,
  ]) assert.match(text, pattern, `responsibility/evidence boundary ${pattern}`);
}
function assertWrappers(source) {
  assert.match(source, /function handleHorizontalArrowKey|const handleHorizontalArrowKey/u, 'ArrowRight handler definition');
  for (const {aria, className} of REQUIRED_WRAPPERS) {
    const exact = `<div className="${className}" role="region" aria-label="${aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`;
    assert.equal(source.split(exact).length - 1, 1, `${aria} exact wrapper`);
  }
}
function xmlAttributes(source) { return new Map([...source.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value])); }
function drawioCells(source) { return [...source.matchAll(/<mxCell\b([^>]*)>([\s\S]*?)<\/mxCell>|<mxCell\b([^>]*)\/>/gu)].map((match) => ({attrs: xmlAttributes(match[1] ?? match[3] ?? ''), body: match[2] ?? ''})); }
function svgNodes(source) { return [...source.matchAll(/<g\b([^>]*)data-node-id="([^"]+)"([^>]*)>/gu)].map(([, before, id, after]) => ({id, attrs: xmlAttributes(`${before}${after}`)})); }
function svgEdges(source) { return [...source.matchAll(/<path\b([^>]*)data-edge-id="([^"]+)"([^>]*)>/gu)].map(([, before, id, after]) => ({id, attrs: xmlAttributes(`${before}${after}`)})); }
function assertDiagram(drawio, svg) {
  assert.match(drawio, /<mxfile\b/u, 'Draw.io XML'); assert.match(svg, /<svg\b[^>]*\brole="img"/u, 'accessible SVG');
  const cells = drawioCells(drawio); const vertices = new Set(cells.filter(({attrs}) => attrs.get('vertex') === '1').map(({attrs}) => attrs.get('id')));
  const edges = cells.filter(({attrs}) => attrs.get('edge') === '1'); const svgNodeIds = new Set(svgNodes(svg).map(({id}) => id)); const svgEdgeIds = new Set(svgEdges(svg).map(({id}) => id));
  for (const id of [...STAGE_IDS, ...GATE_IDS, ...RESPONSIBILITY_IDS]) { assert.ok(vertices.has(id), `Draw.io ${id}`); assert.ok(svgNodeIds.has(id), `SVG ${id}`); }
  for (const id of FEEDBACK_IDS) { assert.ok(edges.some(({attrs}) => attrs.get('id') === id), `Draw.io ${id}`); assert.ok(svgEdgeIds.has(id), `SVG ${id}`); }
  assert.ok(vertices.has('stop-authority'), 'Draw.io stop authority'); assert.ok(svgNodeIds.has('stop-authority'), 'SVG stop authority');
  assert.equal(new Set(FEEDBACK_IDS).size, 3, 'three distinct feedback route identities');
  for (const gate of GATE_IDS) assert.ok(cells.some(({attrs}) => attrs.get('parent')?.startsWith('stage-') && attrs.get('id') === gate) || edges.some(({attrs}) => attrs.get('target') === gate), `${gate} is contained or connected`);
  for (const edge of edges) if (FEEDBACK_IDS.includes(edge.attrs.get('id'))) {
    assert.match(edge.body, /<mxPoint\b[^>]*as="(?:sourcePoint|targetPoint|points)"|<Array\b/u, `${edge.attrs.get('id')} terminal port/waypoint`);
  }
  for (const edge of svgEdges(svg)) {
    assert.ok(edge.attrs.get('d')?.includes('L') || edge.attrs.get('d')?.includes('C'), `${edge.id} routed SVG path`);
    assert.ok(edge.attrs.get('marker-end') || /marker-end/u.test(svg), `${edge.id} marker/style parity`);
  }
  for (const id of [...STAGE_IDS, ...GATE_IDS, ...RESPONSIBILITY_IDS, 'stop-authority']) {
    const node = svgNodes(svg).find((candidate) => candidate.id === id); const size = Number(node?.attrs.get('data-font-size-css'));
    assert.ok(size >= 15, `${id} 800px CSS text >=15px`); assert.ok(Number(node?.attrs.get('data-boundary-clearance-css')) >= 12, `${id} node/boundary clearance`);
  }
  for (const edge of svgEdges(svg)) { assert.ok(Number(edge.attrs.get('data-stroke-clearance-css')) >= 8, `${edge.id} label/stroke clearance`); assert.ok(Number(edge.attrs.get('data-marker-size-css')) >= 16, `${edge.id} marker size`); assert.ok(Number(edge.attrs.get('data-contrast-ratio')) >= 4.5, `${edge.id} selector-bound contrast`); }
  assert.doesNotMatch(svg, /data-partial-shared-segment="true"|data-later-occluding-rect="true"/u, 'no shared segment or later occluder');
}
function mutate(source, from, to, label) { const changed = source.replace(from, to); assert.notEqual(changed, source, `${label} fixture applies`); return changed; }

test('helper fixtures reject every MTH-07 contract mutation', () => {
  const fixtureHeadings = H2.map((heading) => heading === '可迁移经验' ? `## ${heading}\n\n${TRANSFER_H3.map((subheading) => `### ${subheading}`).join('\n\n')}` : `## ${heading}`).join('\n\n');
  const fixture = `---\n${Object.entries(EXACT_METADATA).map(([key, value]) => Array.isArray(value) ? `${key}:\n${value.map((item) => `  - ${item}`).join('\n')}` : `${key}: ${value}`).join('\n')}\n---\n\n${fixtureHeadings}\n\n${TABLE_COLUMNS.length ? `| ${TABLE_COLUMNS.join(' | ')} |\n| ${TABLE_COLUMNS.map(() => '---').join(' | ')} |\n${GATE_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}` : ''}\n\n来源事实；独立证据；Tego Arch 推断。POC 不等于生产。生产不等于验收。验收不等于放量。放量不等于复制。程序确定性负责执行。AI 只给候选建议，不得最终授权不可逆操作。人工对不可逆操作最终授权。人工队列有界并有上限。客户业务负责人有明确停止权。\n\nfunction handleHorizontalArrowKey() {}\n${REQUIRED_WRAPPERS.map(({aria, className}) => `<div className="${className}" role="region" aria-label="${aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}></div>`).join('\n')}`;
  assertMetadataAndHeadings(fixture); assertGateRows(fixture); assertEvidenceAndResponsibility(fixture); assertWrappers(fixture);
  assert.throws(() => assertMetadataAndHeadings(mutate(fixture, 'topic_id: MTH-07', 'topic_id: MTH-99', 'topic id')), assert.AssertionError);
  assert.throws(() => assertMetadataAndHeadings(mutate(fixture, '## 一页摘要', '## 组件、连接器与约束', 'normal headings')), assert.AssertionError);
  assert.throws(() => assertMetadataAndHeadings(mutate(fixture, '### 不应照搬的部分', '### 关键源码导读', 'transfer H3')), assert.AssertionError);
  for (const row of GATE_ROWS) { for (let index = 0; index < row.length; index += 1) { const changed = [...row]; changed[index] = '错误字段'; assert.throws(() => assertGateRows(mutate(fixture, `| ${row.join(' | ')} |`, `| ${changed.join(' | ')} |`, `${row[1]} field ${index}`)), assert.AssertionError); } assert.throws(() => assertGateRows(mutate(fixture, `| ${row.join(' | ')} |\n`, '', `${row[1]} deletion`)), assert.AssertionError); }
  assert.throws(() => assertGateRows(`${fixture.replace(`| ${GATE_ROWS.at(-1).join(' | ')} |`, '| 放大期 | 资产化复制 | 风险 | 机制 | 证据 | 条件 |  | 返回 |')}\n| ${GATE_ROWS.at(-1).join(' | ')} |`), assert.AssertionError);
  for (const [from, to] of [['POC 不等于生产', 'POC 就是生产'], ['人工对不可逆操作最终授权', 'AI 对可逆操作最终授权'], ['人工队列有界并有上限', '人工队列无限'], ['客户业务负责人有明确停止权', '停止权未指定']]) assert.throws(() => assertEvidenceAndResponsibility(mutate(fixture, from, to, from)), assert.AssertionError);
  for (const wrapper of REQUIRED_WRAPPERS) assert.throws(() => assertWrappers(mutate(fixture, wrapper.aria, `${wrapper.aria}（错误）`, 'wrapper')), assert.AssertionError);
});

test('locks the narrow MTH-07 method exception and leaves every other method on nine headings', () => {
  const source = requiredArticle().source; assertMetadataAndHeadings(source);
  for (const document of documents.filter(({metadata}) => metadata.content_type === 'method' && metadata.topic_id !== TOPIC_ID)) assert.deepEqual(document.headings.filter(({level}) => level === 2).map(({text}) => `## ${text}`), knowledgeTypeContracts.method, `${document.file} canonical method headings`);
});

test('locks all twelve five-part delivery-gate contracts and responsibility fields', () => { assertGateRows(requiredArticle().source); });

test('locks evidence boundaries, non-conflation inequalities, and authority semantics', () => { assertEvidenceAndResponsibility(requiredArticle().source); });

test('locks governed sources, exact relations, wrappers, density, and Stage A projection', () => {
  const source = requiredArticle().source; const text = visible(source); const record = ledger.documents[ARTICLE];
  assert.deepEqual(record?.citations.map(({source_id}) => source_id), SOURCE_IDS, 'exact source IDs');
  const sources = SOURCE_IDS.map((id) => ledger.sources.find((sourceItem) => sourceItem.id === id));
  assert.ok(sources.every(Boolean), 'all sources governed'); assert.equal(new Set(sources.slice(0, 3).map(({canonical_locator}) => new URL(canonical_locator).hostname)).size, 3, 'three remote domains');
  assert.equal(record.citations.filter(({manifest_primary}) => manifest_primary).length, 1, 'sole manifest primary'); assert.match(record.citations.find(({manifest_primary}) => manifest_primary)?.source_id ?? '', /wechat|weixin/u, 'WeChat is sole primary');
  const illustration = sources.at(-1); assert.equal(illustration.source_kind, 'original-illustration'); assert.equal(illustration.license, 'LicenseRef-Atlas-Original');
  assert.deepEqual(parseFrontMatter(source), EXACT_METADATA); assert.deepEqual(extractInternalLinks({body: article.body}), ['/cases/microsoft-multi-agent-reference-architecture', '/methods', '/methods/mth-04', '/methods/mth-05', '/methods/mth-06'].sort()); assert.equal(text.includes('QA-09'), false, 'no QA-09 relation'); assert.match(text, /Temporal.{0,24}(?:边界|截至|截止)/iu, 'Temporal boundary'); assert.deepEqual(extractExternalLinks({body: article.body}).sort(), sources.slice(0, 3).map(({canonical_locator}) => canonical_locator).sort());
  assertWrappers(source); assert.ok(analyzeCaseText(article.body).visualBalance.score > 90, 'visual-balance >90');
  assert.deepEqual({completed_topics: projectStatus.completed_topics, content_documents: projectStatus.content_documents, governed_sources: projectStatus.governed_sources}, {completed_topics: 59, content_documents: 102, governed_sources: 529}); const topic = manifest.topics.find(({id}) => id === TOPIC_ID); assert.equal(topic?.published, false); assert.equal(topic?.status?.value, 'pending');
});

test('locks Draw.io/SVG delivery-gate parity, geometry, and mutation rejection', async () => {
  const [drawio, svg] = await Promise.all([readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'), readFile(new URL(`../${SVG}`, import.meta.url), 'utf8')]); assertDiagram(drawio, svg);
  assert.throws(() => assertDiagram(mutate(drawio, 'gate-01', 'gate-99', 'Draw.io gate'), svg), assert.AssertionError);
  assert.throws(() => assertDiagram(drawio, mutate(svg, 'feedback-rollout-to-acceptance', 'feedback-duplicate', 'SVG feedback'),), assert.AssertionError);
  assert.throws(() => assertDiagram(drawio, mutate(svg, 'data-stroke-clearance-css="8"', 'data-stroke-clearance-css="7"', 'stroke clearance')), assert.AssertionError);
  assert.throws(() => assertDiagram(drawio, mutate(svg, 'data-marker-size-css="16"', 'data-marker-size-css="15"', 'marker size')), assert.AssertionError);
  assert.throws(() => assertDiagram(drawio, `${svg}<rect data-later-occluding-rect="true"/>`), assert.AssertionError);
});
