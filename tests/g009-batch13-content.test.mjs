import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {architectureCaseTopicIds, knowledgeHeadingContract, sty12ArchitectureCaseHeadings} from '../scripts/content-schema.mjs';

export const ARTICLE = 'content/styles/sty-12-micro-frontend-architecture.mdx';
export const DRAWIO = 'diagrams/sty-12-micro-frontend-commerce-runtime.drawio';
export const SVG = 'static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg';
export const ROUTE = '/styles/sty-12';
export const TOPIC_ID = 'STY-12';
export const NEXT_TOPIC = 'STY-13';
export const RELATED_CASE = '/cases/micro-frontends-single-spa';
export const EXPECTED_STAGE_A = Object.freeze({completed: 64, documents: 108, sources: 565});
export const EXPECTED_HEADINGS = Object.freeze([
  '学习问题', '一页摘要', '事实边界', '架构图', '运行时组合与发布流',
  '关键机制导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源',
]);
export const MIGRATION_HEADINGS = Object.freeze(['可直接复用的机制', '只能有限类比的部分', '不应照搬的部分']);
export const WRAPPERS = Object.freeze([
  'Micro-Frontend 电商运行时、发布与权威状态边界图，可横向滚动',
  'Micro-Frontend 五种组合方式决策表，可横向滚动',
  'Micro-Frontend 构件所有权矩阵，可横向滚动',
  'Micro-Frontend 六类故障检测、降级与恢复表，可横向滚动',
]);
export const EXACT_METADATA = Object.freeze({
  title: 'Micro-Frontend：用独立交付证明运行时拆分', slug: ROUTE,
  content_type: 'style', status: 'reviewed', difficulty: 'advanced',
  analyzed_at: '2026-08-26', source_cutoff: '2026-08-26', confidence: 'high',
  domains: ['software-architecture', 'frontend-architecture', 'platform-engineering'],
  agent_patterns: [], protocols: ['https', 'es-modules'],
  quality_attributes: ['deployability', 'modularity', 'reliability', 'operability', 'security', 'performance'],
  tags: ['架构风格', 'Micro-Frontend', '运行时组合', '独立部署', '共享依赖', '故障隔离'],
  summary: '以商品、购物车、结算和账户切片说明 Micro-Frontend：薄 Shell 通过完整版本化清单组合不可变制品，业务真相与授权留在后端，公共运行时保持最小，同页错误只做有限降级。',
  topic_id: TOPIC_ID, priority: 'P1', depends_on: ['STY-00', 'STY-03', 'STY-04'],
  adjacent_topics: ['STY-03', 'STY-10'], related_cases: [RELATED_CASE], related_questions: [],
});
export const SOURCE_IDS = Object.freeze([
  'src-martinfowler-0ec749cd01b8', 'src-single-spa-03f49f2c5ddb',
  'src-single-spa-f1207fc2c485', 'src-whatwg-html-import-maps',
  'src-w3c-subresource-integrity', 'src-w3c-content-security-policy-3',
  'src-w3c-long-tasks-api', 'src-atlas-sty12-micro-frontend-commerce-runtime',
]);
export const COMPOSITION_ROWS = Object.freeze([
  ['模块化前端单体', '单一团队或统一发布节奏', '构建时', '最低', '独立上线成为持续瓶颈'],
  ['构建时包组合', '代码边界稳定但无需独立上线', '构建时', '低', '仍需整体重建发布'],
  ['浏览器运行时组合', '多个稳定业务团队确需独立交付', '浏览器', '高', '共享运行时与同页故障成本失控'],
  ['服务端组合', '首屏与边缘装配优先', '服务端或边缘', '高', '片段合同与缓存协调失控'],
  ['跨源 iframe', '安全或运行时隔离是硬要求', '浏览器隔离上下文', '最高', '体验、通信和可访问性成本不可接受'],
]);
export const OWNER_ROWS = Object.freeze([
  ['Shell', '顶层路由、完整清单、槽位、系统恢复入口', '领域规则、业务真相、跨域授权'],
  ['业务切片', '私有 DOM、内部路由、公开入口、流水线与值班', '其他切片私有状态与发布'],
  ['公共运行时', '少量高收益依赖与兼容矩阵', '领域模型、可变全局状态、跨域写入'],
  ['发布控制面', '不可变制品校验、候选清单、原子提升与回滚', '运行时猜测版本、业务终态'],
  ['权威业务面', '逐请求授权、不变量、购物车与订单事实', '浏览器挂载与展示状态'],
]);
export const FAILURE_ROWS = Object.freeze([
  ['清单无效', '真实性、内容身份或结构校验', '保留上一已知可用清单', '阻止候选提升', '发布控制面'],
  ['制品加载失败', '网络、超时、完整性错误', '只降级对应槽位', '回退清单或离开旅程', '切片团队'],
  ['挂载或运行失败', '错误边界与长任务信号', '清理槽位并限制重试', '持续失败时回退', '切片团队'],
  ['合同不兼容', '公开入口与兼容范围', '拒绝未知组合', '回退整份清单', '平台与切片共同负责'],
  ['后端结果不确定', '订单 ID、幂等键与权威查询', '显示待确认而非重放', '进入人工终态', '业务域团队'],
  ['全局资源争用', '主线程、内存、CSS 与同源资源', '停止非关键切片并降级', '改用更强隔离或合并切片', '平台与责任切片'],
]);
export const REGION_IDS = Object.freeze(['release-control-plane', 'browser-runtime-plane', 'authority-business-plane']);
export const NODE_IDS = Object.freeze([
  'catalog-pipeline', 'cart-pipeline', 'checkout-pipeline', 'account-pipeline',
  'immutable-artifacts', 'compatibility-gate', 'versioned-manifest', 'atomic-promotion',
  'shell', 'top-router', 'catalog-slice', 'cart-slice', 'checkout-slice', 'account-slice',
  'shared-runtime', 'slice-fallback', 'catalog-api', 'cart-api', 'order-api', 'account-api',
]);
export const LEGEND_ROLES = Object.freeze(['release', 'resolve', 'business', 'recovery']);
export const NOTE_COPY = Object.freeze({
  'authority-note': '稳定 ID 跨切片；业务真相留在后端',
  'isolation-warning': '非隔离边界：主线程、DOM、全局 CSS、同源存储与网络会话',
  'auth-warning': '切片已挂载 ≠ 已获业务权限',
});

const CONTENT_ROOT = fileURLToPath(new URL('../content/', import.meta.url));
function file(path) { try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; } }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'); }
function articleParts(source) { assert.ok(source, `${ARTICLE} must exist after implementation`); const close = source.indexOf('\n---', 3); assert.ok(close >= 0, 'front matter closes'); return {body: source.slice(close + 4)}; }
function exactWrapper(label) { return `<div role="region" aria-label="${label}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`; }
function replaceOnce(source, oldValue, newValue, label) { const changed = source.replace(oldValue, newValue); assert.notEqual(changed, source, `${label} mutation applies`); return changed; }
function frontMatterFixture(metadata) { return Object.entries(metadata).flatMap(([key, value]) => Array.isArray(value) ? value.length ? [`${key}:`, ...value.map((item) => `  - ${item}`)] : [`${key}: []`] : [`${key}: ${value}`]).join('\n'); }
function removeFrontMatterField(source, key) { return source.replace(new RegExp(`^${escapeRegExp(key)}:.*(?:\\r?\\n  - [^\\r\\n]+)*(?:\\r?\\n|$)`, 'mu'), ''); }
function changeFrontMatterField(source, key) { const value = EXACT_METADATA[key]; return Array.isArray(value) && value.length ? replaceOnce(source, `  - ${value[0]}`, '  - changed', `${key} changed`) : replaceOnce(source, `${key}: ${Array.isArray(value) ? '[]' : value}`, `${key}: changed`, `${key} changed`); }
export function markdownTables(body) { const tables = []; const lines = body.split(/\r?\n/u); for (let index = 0; index < lines.length; index += 1) { if (!lines[index].startsWith('|')) continue; const rows = []; while (index < lines.length && lines[index].startsWith('|')) { rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim())); index += 1; } if (rows.length >= 3 && rows[1].every((cell) => /^:?-{3,}:?$/u.test(cell))) tables.push(rows); } return tables; }
function table(body, header) { const found = markdownTables(body).find((candidate) => JSON.stringify(candidate[0]) === JSON.stringify(header)); assert.ok(found, `table ${header.join(' | ')}`); return found; }
function exactRows(actual, expected, name) { assert.deepEqual(actual.slice(2), expected, `${name} exact ordered rows`); }
function attributes(tag) { return new Map([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)].map(([, key, double, single]) => [key, double ?? single])); }
function decodeXmlText(value) { return value.replace(/&(?:#(\d+)|#x([\da-f]+)|amp|lt|gt|quot|apos);/giu, (entity, decimal, hex) => decimal ? String.fromCodePoint(Number(decimal)) : hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : ({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"})[entity] ?? entity); }
export function parseDrawio(source) { const cells = [...source.matchAll(/<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/gu)].map(([raw]) => { const open = /^<mxCell\b[^>]*>/u.exec(raw)?.[0] ?? raw; const geometry = /<mxGeometry\b([^>]*)/u.exec(raw)?.[1] ?? ''; return {raw, attributes: attributes(open), geometry: attributes(`<mxGeometry ${geometry}>`), label: decodeXmlText(attributes(open).get('value') ?? '')}; }); return {cells, nodes: cells.filter(({attributes: item}) => item.get('vertex') === '1'), edges: cells.filter(({attributes: item}) => item.get('edge') === '1')}; }
export function parseSvg(source) { const elements = []; const stack = []; for (const match of source.matchAll(/<\/?([A-Za-z][\w:.-]*)\b([^>]*)>/gu)) { if (match[0].startsWith('</')) { const element = stack.pop(); assert.equal(element?.name, match[1], `balanced SVG element ${match[1]}`); element.closeIndex = match.index; continue; } const element = {name: match[1], attributes: attributes(match[2]), parent: stack.at(-1) ?? null, sourceIndex: match.index, openEnd: match.index + match[0].length, closeIndex: match.index + match[0].length}; elements.push(element); if (!match[0].endsWith('/>')) stack.push(element); } assert.equal(stack.length, 0, 'balanced SVG tree'); return {elements, nodes: elements.filter(({attributes: item}) => item.has('data-node-id')), edges: elements.filter(({name, attributes: item}) => name === 'path' && item.has('data-edge-id'))}; }
export function assertFlattenedSvg(elements) { for (const element of elements) assert.equal(element.attributes.has('transform'), false, `flattened SVG geometry: <${element.name}> has no transform`); }
export function parsePathPoints(data) { assert.doesNotMatch(data ?? '', /[CQSAZ]/iu, 'connector path uses only M/L/H/V'); const tokens = data.match(/[A-Za-z]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []; const points = []; let cursor = 0; let command; let current = {x: 0, y: 0}; while (cursor < tokens.length) { if (/^[A-Za-z]$/u.test(tokens[cursor])) command = tokens[cursor++]; const relative = command === command?.toLowerCase(); const take = () => Number(tokens[cursor++]); if (command?.toUpperCase() === 'M' || command?.toUpperCase() === 'L') { const x = take(); const y = take(); current = {x: relative ? current.x + x : x, y: relative ? current.y + y : y}; points.push(current); if (command?.toUpperCase() === 'M') command = relative ? 'l' : 'L'; } else if (command?.toUpperCase() === 'H') { const x = take(); current = {x: relative ? current.x + x : x, y: current.y}; points.push(current); } else if (command?.toUpperCase() === 'V') { const y = take(); current = {x: current.x, y: relative ? current.y + y : y}; points.push(current); } else assert.fail(`unsupported path command ${command}`); } assert.ok(points.length >= 2, 'visible connector path'); return points; }
function styleMap(value = '') { return new Map(value.split(';').filter(Boolean).map((item) => item.split(/=(.*)/su).map((part) => part.trim()))); }
function assertExactDuplicateFreeIds(actual, expected, label) { assert.equal(new Set(actual).size, actual.length, `${label} identities are duplicate-free`); assert.deepEqual([...actual].sort(), [...expected].sort(), `${label} exact identity set`); }

function assertMicroFrontendArticle(source) {
  const {body} = articleParts(source);
  assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-12 front matter');
  const headings = findMarkdownHeadings(source);
  assert.deepEqual(headings.filter(({level}) => level === 2).map(({text}) => text), EXPECTED_HEADINGS, 'exact H2 order');
  const migration = headings.find(({level, text}) => level === 2 && text === '可迁移经验');
  const next = headings.find(({level, offset}) => level === 2 && offset > migration.offset);
  assert.deepEqual(headings.filter(({level, offset}) => level === 3 && offset > migration.offset && (!next || offset < next.offset)).map(({text}) => text), MIGRATION_HEADINGS, 'exact migration H3 order');
  for (const label of WRAPPERS) assert.match(source, new RegExp('<div\\b(?=[^>]*role="region")(?=[^>]*aria-label="' + escapeRegExp(label) + '")(?=[^>]*tabIndex=\\{0\\})(?=[^>]*onKeyDown=\\{handleHorizontalArrowKey\\})[^>]*>', 'u'), label + ' keyboard scroll wrapper');
  assert.equal((source.match(/role="region"/gu) ?? []).length, 4, 'exactly four wrappers');
  exactRows(table(body, ['组合方式', '适用条件', '组合时机', '隔离成本', '停止采用信号']), COMPOSITION_ROWS, 'composition table');
  exactRows(table(body, ['构件', '拥有', '明确不拥有']), OWNER_ROWS, 'ownership table');
  exactRows(table(body, ['故障', '检测', '自动响应', '停止条件', '最终责任人']), FAILURE_ROWS, 'failure table');
}

function assertMicroFrontendSources(ledger) {
  const document = ledger.documents?.[ARTICLE];
  assert.ok(document, 'STY-12 governed source document');
  assert.deepEqual(document.citations.map(({source_id}) => source_id), SOURCE_IDS, 'exact ordered source citations');
  for (const id of SOURCE_IDS) assert.ok(ledger.sources.some((source) => source.id === id), `${id} governed source`);
  assert.deepEqual(document.citations.filter(({manifest_primary}) => manifest_primary).map(({source_id}) => source_id), ['src-single-spa-03f49f2c5ddb'], 'single-spa is sole primary');
}

function assertMicroFrontendDiagram(drawioSource, svgSource) {
  const drawio = parseDrawio(drawioSource); const svg = parseSvg(svgSource); assertFlattenedSvg(svg.elements);
  assertExactDuplicateFreeIds(drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'region').map(({attributes}) => attributes.get('id')), REGION_IDS, 'Draw.io regions');
  assertExactDuplicateFreeIds(svg.elements.filter(({attributes}) => attributes.has('data-region-id')).map(({attributes}) => attributes.get('data-region-id')), REGION_IDS, 'SVG regions');
  assertExactDuplicateFreeIds(drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'node-shape').map(({attributes}) => attributes.get('id').replace(/^node-/u, '')), NODE_IDS, 'Draw.io nodes');
  assertExactDuplicateFreeIds(svg.nodes.map(({attributes}) => attributes.get('data-node-id')), NODE_IDS, 'SVG nodes');
  assertExactDuplicateFreeIds(drawio.edges.filter(({attributes}) => LEGEND_ROLES.includes(styleMap(attributes.get('style')).get('semanticRole'))).map(({attributes}) => attributes.get('id')), LEGEND_ROLES.map((role) => `legend-edge-${role}`), 'Draw.io legend edges');
  assertExactDuplicateFreeIds(svg.elements.filter(({attributes}) => attributes.has('data-legend-role')).map(({attributes}) => attributes.get('data-legend-role')), LEGEND_ROLES, 'SVG legend roles');
  for (const [id, copy] of Object.entries(NOTE_COPY)) { assert.ok(drawio.nodes.some(({attributes, label}) => attributes.get('id') === `note-text-${id}` && label === copy), `${id} Draw.io note`); assert.ok(svg.elements.some(({attributes}) => attributes.get('data-note-text-for') === id), `${id} SVG note`); }
}

function fixtureArticle() {
  const sections = EXPECTED_HEADINGS.map((heading) => '## ' + heading + (heading === '可迁移经验' ? '\n### ' + MIGRATION_HEADINGS.join('\n### ') : '')).join('\n');
  const rows = (items) => items.map((row) => '| ' + row.join(' | ') + ' |').join('\n');
  return `---\n${frontMatterFixture(EXACT_METADATA)}\n---\n${sections}\n${WRAPPERS.map(exactWrapper).join('\n')}\n| 组合方式 | 适用条件 | 组合时机 | 隔离成本 | 停止采用信号 |\n| --- | --- | --- | --- | --- |\n${rows(COMPOSITION_ROWS)}\n\n| 构件 | 拥有 | 明确不拥有 |\n| --- | --- | --- |\n${rows(OWNER_ROWS)}\n\n| 故障 | 检测 | 自动响应 | 停止条件 | 最终责任人 |\n| --- | --- | --- | --- | --- |\n${rows(FAILURE_ROWS)}`;
}

test('STY-12 helper fixture locks its public content contract', () => {
  assert.equal(architectureCaseTopicIds.has(TOPIC_ID), true, 'STY-12 uses the architecture-case heading contract');
  assert.deepEqual(sty12ArchitectureCaseHeadings, EXPECTED_HEADINGS.map((heading) => `## ${heading}`), 'STY-12 specialized schema headings');
  assert.equal(knowledgeHeadingContract('style', TOPIC_ID), sty12ArchitectureCaseHeadings, 'STY-12 resolves its specialized schema headings before the generic architecture-case contract');
  const fixture = fixtureArticle(); assertMicroFrontendArticle(fixture);
  for (const key of Object.keys(EXACT_METADATA)) { assert.throws(() => assertMicroFrontendArticle(removeFrontMatterField(fixture, key)), assert.AssertionError, `${key} deletion rejected`); assert.throws(() => assertMicroFrontendArticle(changeFrontMatterField(fixture, key)), assert.AssertionError, `${key} change rejected`); }
  for (const rows of [COMPOSITION_ROWS, OWNER_ROWS, FAILURE_ROWS]) for (const row of rows) { const exact = '| ' + row.join(' | ') + ' |'; assert.throws(() => assertMicroFrontendArticle(replaceOnce(fixture, exact, '| ' + [...row.slice(0, -1), '错误的合同值'].join(' | ') + ' |', `${row[0]} mutation`)), assert.AssertionError, `${row[0]} change rejected`); }
});

test('STY-12 implementation remains RED until its article, sources, relations, diagram, and projection exist', async () => {
  const source = file(ARTICLE); assert.ok(source, ARTICLE + ' must exist after implementation'); assertMicroFrontendArticle(source);
  assertMicroFrontendSources(JSON.parse(readFileSync('data/source-ledger.json', 'utf8')));
  const documents = await readContentDocuments(CONTENT_ROOT); const article = documents.find(({file: path}) => 'content/' + path === ARTICLE);
  assert.ok(article, 'STY-12 content document'); assert.ok(extractInternalLinks(article).includes(RELATED_CASE), 'visible related case link');
  for (const path of ['content/styles/sty-03-vertical-slice-architecture.mdx', 'content/styles/sty-10-microkernel-plugin-architecture.mdx', 'content/cases/micro-frontends-single-spa.mdx']) { const target = documents.find(({file: documentPath}) => 'content/' + documentPath === path); assert.ok(target, `${path} exists`); assert.ok(extractInternalLinks(target).includes(ROUTE), `${path} visibly reciprocates STY-12`); }
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-13'), false, 'STY-13 remains non-actionable');
  const diagram = file(DRAWIO); const svg = file(SVG); assert.ok(diagram && svg, 'STY-12 diagram pair'); assertMicroFrontendDiagram(diagram, svg);
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8')); assert.deepEqual({completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}, EXPECTED_STAGE_A, 'exact Stage A projection');
});
