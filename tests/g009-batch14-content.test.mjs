import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {architectureCaseTopicIds} from '../scripts/content-schema.mjs';

export const ARTICLE = 'content/styles/sty-13-space-based-architecture.mdx';
export const DRAWIO = 'diagrams/sty-13-space-based-flight-availability.drawio';
export const SVG = 'static/img/diagrams/sty-13-space-based-flight-availability.svg';
export const ROUTE = '/styles/sty-13';
export const TOPIC_ID = 'STY-13';
export const NEXT_TOPIC = 'STY-14';
export const NEXT_ROUTE = '/styles/sty-14';
export const STAGE_B_REVIEW = 'docs/reviews/g009-batch14.md';
export const STAGE_B_BROWSER = 'docs/reviews/evidence/g009-batch14-stage-b-production-browser.json';
export const RELATED_CASES = Object.freeze(['/cases/aws-cell-shuffle-sharding', '/cases/cloudflare-durable-objects-workerd']);
export const EXPECTED_STAGE_A = Object.freeze({completed: 65, documents: 109, sources: 573});
export const EXPECTED_STAGE_B = Object.freeze({completed: 66, documents: 109, sources: 573});
export const EXPECTED_HEADINGS = Object.freeze(['学习问题', '一页摘要', '事实边界', '架构图', '亲和分区与预订流', '关键机制导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源']);
export const MIGRATION_HEADINGS = Object.freeze(['可直接复用的机制', '只能有限类比的部分', '不应照搬的部分']);
export const WRAPPERS = Object.freeze([
  'Space-Based Architecture 航班余位亲和分区、主备与恢复边界图，可横向滚动',
  'Space-Based Architecture 与四种相邻方案边界表，可横向滚动',
  '航班余位六类操作执行与一致性责任表，可横向滚动',
  'Space-Based Architecture 六类故障信号、保护动作与恢复门槛表，可横向滚动',
]);
export const EXACT_METADATA = Object.freeze({
  title: 'Space-Based Architecture：让状态与处理在亲和分区相遇', slug: ROUTE, content_type: 'style', status: 'reviewed', difficulty: 'advanced',
  analyzed_at: '2026-08-28', source_cutoff: '2026-08-28', confidence: 'high',
  domains: ['software-architecture', 'distributed-systems', 'data-intensive-systems'], agent_patterns: [], protocols: [],
  quality_attributes: ['scalability', 'performance', 'availability', 'consistency', 'recoverability', 'operability'],
  tags: ['架构风格', 'Space-Based Architecture', '数据亲和', '分区处理', '内存数据网格', '热点治理'],
  summary: '以航班余位与报价说明 Space-Based Architecture：入口按航段与日期路由到唯一分区所有者，状态与处理共置，主备只处理受控切换，日志与检查点负责恢复，多航段行程由外部持久工作流协调。',
  topic_id: TOPIC_ID, priority: 'P2', depends_on: ['STY-00', 'STY-05', 'STY-08'], adjacent_topics: ['STY-05', 'STY-08'], related_cases: RELATED_CASES, related_questions: [],
});
export const SOURCE_IDS = Object.freeze(['src-gigaspaces-sba-overview', 'src-gigaspaces-processing-unit-sla', 'src-gigaspaces-split-brain-resolution', 'src-gigaspaces-proxy-connectivity', 'src-oracle-coherence-partitioned-cache', 'src-oracle-coherence-backing-maps', 'src-gigaspaces-flight-availability-case', 'src-atlas-sty13-space-based-flight-availability']);
export const COMPARISON_HEADERS = Object.freeze(['方案', '状态与处理', '实时权威', '跨分区协调', '采用边界']);
export const OPERATION_HEADERS = Object.freeze(['操作', '执行者', '一致性责任', '合同']);
export const FAILURE_HEADERS = Object.freeze(['故障', '信号', '保护动作', '恢复门槛']);
export const COMPARISON_ROWS = Object.freeze([
  ['Space-Based Architecture', '状态与处理按亲和键共置', '分区内运行状态', '外部工作流', '热点、内存与恢复复杂度可控'],
  ['普通数据库分区', '数据按键分布，应用可远程处理', '数据库', '数据库事务或应用协调', '数据库已经满足延迟与容量目标'],
  ['读缓存', '副本加速读取，写入仍回权威库', '数据库', '数据库或应用', '写瓶颈不是主要问题'],
  ['Actor Model', '逻辑身份拥有私有状态并串行处理消息', 'Actor 持久模型', '消息与工作流', '按实体身份而非数据分区建模更自然'],
  ['单元架构', '按租户或请求集合限制故障半径', '单元内各自系统', '单元外控制面', '首要目标是隔离而非数据处理亲和'],
]);
export const OPERATION_ROWS = Object.freeze([
  ['余位查询', '亲和分区本地服务', '分区状态版本', '可返回带版本结果，不能直接证明后续可售'],
  ['暂留', '亲和分区所有者', '余位、期限、幂等键', '本地原子判断并写入暂留'],
  ['确认', '原暂留所在分区', '暂留令牌、版本、期限', '重复请求返回同一权威结果'],
  ['释放', '原暂留所在分区', '暂留状态与幂等键', '超时后查询，不假定释放成功'],
  ['多航段协调', '外部持久工作流', '步骤、期限、补偿与人工终态', '不直接写分区，不宣称全局 ACID'],
  ['全局统计', '派生读模型或批处理', '更新时间与来源版本', '不得处理最新余位写判断'],
]);
export const FAILURE_ROWS = Object.freeze([
  ['热点分区', '在途量、队列时长、拒绝率', '排队、限流、隔离读模型', '只有业务语义允许才拆亲和键'],
  ['主节点失败', '心跳、复制进度、纪元', '隔离旧主并确认唯一主权', '新主完成状态校验后恢复写'],
  ['网络分区与脑裂', '同分区出现多个主权候选', '暂停写入；查询标注陈旧度', '选择权威分支并重建副本'],
  ['再平衡', '迁移流量、延迟、内存峰值', '限速、暂停或回滚迁移', '业务延迟和容量水位恢复'],
  ['内存压力', '主备、索引、暂留与迁移水位', '拒绝新暂留并保护权威写', '容量回落且索引状态完整'],
  ['恢复失败', '日志损坏、检查点过旧、重放超时', '保持隔离或只读', '纪元、版本与日志位置全部验证'],
]);
export const REQUIRED_SENTENCES = Object.freeze([
  'Space-Based Architecture 不是数据库前加一层读缓存。',
  '航段与出发日期共同形成亲和键，余位状态与处理该状态的服务位于同一分区。',
  '空间内状态是实时余位写权威；长期记录不得形成第二个同步可写权威。',
  '单航段暂留与确认保持分区本地，多航段行程由外部持久工作流协调。',
  '无法确认唯一主分区时暂停写入，不能让双主继续售卖后再自动合并。',
  '同步备份不等于持久日志、异地灾备、零数据丢失或跨分区事务。',
  '增加无关节点不会消除热门航班形成的热点分区。',
  '若普通数据库分区或读缓存已满足延迟与容量目标，不应引入专用空间运行时。',
]);
export const REGION_IDS = Object.freeze(['ingress-routing', 'partition-runtime', 'recovery-and-durability', 'external-coordination']);
export const NODE_IDS = Object.freeze(['booking-gateway', 'affinity-router', 'flight-date-key', 'primary-partition', 'backup-partition', 'availability-state', 'partition-service', 'replication-stream', 'checkpoint-log', 'recovery-controller', 'itinerary-workflow', 'derived-read-model']);
export const EDGE_CONTRACTS = Object.freeze([
  ['route-affinity', 'booking-gateway', 'affinity-router', 'route', '航段 + 日期'], ['select-owner', 'affinity-router', 'flight-date-key', 'route', '亲和键'], ['dispatch-owner', 'flight-date-key', 'primary-partition', 'route', '唯一所有者'], ['local-operation', 'primary-partition', 'partition-service', 'local', '本地原子操作'], ['read-write-state', 'partition-service', 'availability-state', 'local', '余位、暂留、版本'], ['replicate-backup', 'primary-partition', 'backup-partition', 'replication', '同步复制'], ['persist-recovery', 'primary-partition', 'checkpoint-log', 'durability', '日志与检查点'], ['recover-owner', 'checkpoint-log', 'recovery-controller', 'recovery', '验证纪元与日志位置'], ['restore-write', 'recovery-controller', 'primary-partition', 'recovery', '恢复写入'], ['coordinate-itinerary', 'booking-gateway', 'itinerary-workflow', 'workflow', '多航段请求'], ['workflow-steps', 'itinerary-workflow', 'partition-service', 'workflow', '暂留、确认、补偿'], ['publish-statistics', 'availability-state', 'derived-read-model', 'derived', '带版本事件'],
]);
export const EDGE_IDS = Object.freeze(EDGE_CONTRACTS.map(([id]) => id));

const CONTENT_ROOT = fileURLToPath(new URL('../content/', import.meta.url));
function file(path) { try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; } }
function escapeRegExp(value) { return value.replace(/[.*+?^\$\{\}()|[\]\\]/gu, '\\$&'); }
function articleParts(source) { assert.ok(source, ARTICLE + ' must exist after implementation'); const close = source.indexOf('\n---', 3); assert.ok(close >= 0, 'front matter closes'); return {body: source.slice(close + 4)}; }
function visibleArticleBody(body) { return body.replace(/\{\/\*[\s\S]*?\*\/\}/gu, ''); }
function replaceOnce(source, oldValue, newValue, label) { const changed = source.replace(oldValue, newValue); assert.notEqual(changed, source, label + ' mutation applies'); return changed; }
function frontMatterFixture(metadata) { return Object.entries(metadata).flatMap(([key, value]) => Array.isArray(value) ? value.length ? [key + ':', ...value.map((item) => '  - ' + item)] : [key + ': []'] : [key + ': ' + value]).join('\n'); }
function removeFrontMatterField(source, key) { return source.replace(new RegExp('^' + escapeRegExp(key) + ':.*(?:\\r?\\n  - [^\\r\\n]+)*(?:\\r?\\n|$)', 'mu'), ''); }
export function markdownTables(body) { const tables = []; const lines = body.split(/\r?\n/u); for (let index = 0; index < lines.length; index += 1) { if (!lines[index].startsWith('|')) continue; const rows = []; while (index < lines.length && lines[index].startsWith('|')) { rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim())); index += 1; } if (rows.length >= 3 && rows[1].every((cell) => /^:?-{3,}:?$/u.test(cell))) tables.push(rows); } return tables; }
function table(body, header) { const found = markdownTables(body).find((candidate) => JSON.stringify(candidate[0]) === JSON.stringify(header)); assert.ok(found, 'table ' + header.join(' | ')); return found; }
function exactRows(actual, expected, name) { assert.deepEqual(actual.slice(2), expected, name + ' exact ordered rows'); }
function attributes(tag) { return new Map([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)].map(([, key, double, single]) => [key, double ?? single])); }
function decodeXmlText(value) { return value.replace(/&(?:#(\d+)|#x([\da-f]+)|amp|lt|gt|quot|apos);/giu, (entity, decimal, hex) => decimal ? String.fromCodePoint(Number(decimal)) : hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : ({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"})[entity] ?? entity); }
export function parseDrawio(source) { const cells = [...source.matchAll(/<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/gu)].map(([raw]) => { const open = /^<mxCell\b[^>]*>/u.exec(raw)?.[0] ?? raw; return {attributes: attributes(open), label: decodeXmlText(attributes(open).get('value') ?? '')}; }); return {nodes: cells.filter(({attributes: item}) => item.get('vertex') === '1'), edges: cells.filter(({attributes: item}) => item.get('edge') === '1')}; }
export function parseSvg(source) { const elements = []; const stack = []; for (const match of source.matchAll(/<\/?([A-Za-z][\w:.-]*)\b([^>]*)>/gu)) { if (match[0].startsWith('</')) { const element = stack.pop(); assert.equal(element?.name, match[1], 'balanced SVG element ' + match[1]); continue; } const element = {name: match[1], attributes: attributes(match[2]), parent: stack.at(-1) ?? null}; elements.push(element); if (!match[0].endsWith('/>')) stack.push(element); } assert.equal(stack.length, 0, 'balanced SVG tree'); return {elements, nodes: elements.filter(({attributes: item}) => item.has('data-node-id')), edges: elements.filter(({name, attributes: item}) => name === 'path' && item.has('data-edge-id'))}; }
export function assertFlattenedSvg(elements) { for (const element of elements) assert.equal(element.attributes.has('transform'), false, 'flattened SVG geometry: <' + element.name + '> has no transform'); }
function styleMap(value = '') { return new Map(value.split(';').filter(Boolean).map((item) => item.split(/=(.*)/su).map((part) => part.trim()))); }
function cssDeclarations(source = '') { return new Map(source.split(';').map((item) => item.trim()).filter(Boolean).map((item) => { const index = item.indexOf(':'); return [item.slice(0, index).trim(), item.slice(index + 1).trim()]; })); }
export function svgPresentationValue(source, element, property) { const inline = cssDeclarations(element.attributes.get('style')).get(property); if (inline !== undefined) return inline; if (element.attributes.has(property)) return element.attributes.get(property); for (const [, selector, declarations] of source.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) if (selector.split(',').map((item) => item.trim()).includes(element.name)) return cssDeclarations(declarations).get(property); return undefined; }
export function parsePathPoints(data) { assert.doesNotMatch(data ?? '', /[CQSAZ]/iu, 'connector path uses only M/L/H/V'); const tokens = data.match(/[A-Za-z]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []; const points = []; let cursor = 0; let command; let current = {x: 0, y: 0}; while (cursor < tokens.length) { if (/^[A-Za-z]$/u.test(tokens[cursor])) command = tokens[cursor++]; const take = () => Number.parseFloat(tokens[cursor++]); if (command?.toUpperCase() === 'M' || command?.toUpperCase() === 'L') { current = {x: take(), y: take()}; points.push(current); if (command?.toUpperCase() === 'M') command = 'L'; } else if (command?.toUpperCase() === 'H') { current = {x: take(), y: current.y}; points.push(current); } else if (command?.toUpperCase() === 'V') { current = {x: current.x, y: take()}; points.push(current); } else assert.fail('unsupported path command ' + command); } assert.ok(points.length >= 2 && points.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), 'visible connector path'); return points; }
export function glyphBox({x, y, text, fontSize, anchor = 'start'}) { const width = [...text].reduce((total, character) => total + (/^[\u0000-\u00ff]$/u.test(character) ? .64 : 1), 0) * fontSize; const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x; return {left, right: left + width, top: y - fontSize * .82, bottom: y + fontSize * .22}; }
export function alphaCompose(backdrop, foreground) { const alpha = foreground.alpha + backdrop.alpha * (1 - foreground.alpha); return alpha === 0 ? {red: 0, green: 0, blue: 0, alpha: 0} : {red: (foreground.red * foreground.alpha + backdrop.red * backdrop.alpha * (1 - foreground.alpha)) / alpha, green: (foreground.green * foreground.alpha + backdrop.green * backdrop.alpha * (1 - foreground.alpha)) / alpha, blue: (foreground.blue * foreground.alpha + backdrop.blue * backdrop.alpha * (1 - foreground.alpha)) / alpha, alpha}; }
export function markerEnvelope(endpoint, previous, {width, height, refX, refY}) { const dx = endpoint.x - previous.x; const dy = endpoint.y - previous.y; const length = Math.hypot(dx, dy); assert.ok(length > 0 && width > 0 && height > 0, 'positive marker geometry'); const ux = dx / length; const uy = dy / length; const nx = -uy; const ny = ux; const points = [[-refX, -refY], [width - refX, -refY], [width - refX, height - refY], [-refX, height - refY]].map(([x, y]) => ({x: endpoint.x + ux * x + nx * y, y: endpoint.y + uy * x + ny * y})); return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function exactIds(actual, expected, label) { assert.equal(new Set(actual).size, actual.length, label + ' duplicate-free'); assert.deepEqual([...actual].sort(), [...expected].sort(), label + ' exact identities'); }

function assertSpaceBasedArticle(source) {
  const {body} = articleParts(source); const visibleBody = visibleArticleBody(body); assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-13 front matter');
  const headings = findMarkdownHeadings(source); assert.deepEqual(headings.filter(({level}) => level === 2).map(({text}) => text), EXPECTED_HEADINGS, 'exact H2 order');
  const migration = headings.find(({level, text}) => level === 2 && text === '可迁移经验'); const next = headings.find(({level, offset}) => level === 2 && offset > migration.offset);
  assert.deepEqual(headings.filter(({level, offset}) => level === 3 && offset > migration.offset && (!next || offset < next.offset)).map(({text}) => text), MIGRATION_HEADINGS, 'exact migration H3 order');
  for (const label of WRAPPERS) assert.match(source, new RegExp('<div\\b(?=[^>]*role="region")(?=[^>]*aria-label="' + escapeRegExp(label) + '")(?=[^>]*tabIndex=\\{0\\})(?=[^>]*onKeyDown=\\{handleHorizontalArrowKey\\})[^>]*>', 'u'), label + ' keyboard wrapper');
  assert.equal((source.match(/role="region"/gu) ?? []).length, 4, 'exactly four wrappers');
  exactRows(table(body, COMPARISON_HEADERS), COMPARISON_ROWS, 'comparison table'); exactRows(table(body, OPERATION_HEADERS), OPERATION_ROWS, 'operation table'); exactRows(table(body, FAILURE_HEADERS), FAILURE_ROWS, 'failure table');
  for (const sentence of REQUIRED_SENTENCES) assert.ok(visibleBody.includes(sentence), 'visible boundary: ' + sentence);
}
function assertSpaceBasedSources(ledger) {
  const document = ledger.documents?.[ARTICLE]; assert.ok(document, 'STY-13 governed source document'); assert.deepEqual(document.citations.map(({source_id}) => source_id), SOURCE_IDS, 'exact ordered STY-13 citations');
  for (const id of SOURCE_IDS) { const source = ledger.sources.find((item) => item.id === id); assert.ok(source, id + ' governed source'); for (const field of ['canonical_locator', 'transport_locator', 'title', 'license', 'copyright_policy', 'usage_boundary']) assert.ok(source[field], id + ' ' + field); }
  assert.ok(document.citations.every(({citation_url, roles, usage_mode, attribution_note, modification_note, excerpt, quotation_reviewed}) => citation_url && roles.length > 0 && usage_mode === 'facts-summary' && attribution_note && modification_note && excerpt === null && quotation_reviewed === false), 'STY-13 source governance');
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1, 'STY-13 has one primary source');
}
function assertSpaceBasedDiagram(drawioSource, svgSource) {
  assert.ok(drawioSource && svgSource, 'STY-13 Draw.io and SVG assets exist'); const drawio = parseDrawio(drawioSource); const svg = parseSvg(svgSource); assertFlattenedSvg(svg.elements);
  const root = svg.elements.find(({name}) => name === 'svg'); assert.equal(root?.attributes.get('role'), 'img', 'accessible SVG role'); assert.equal(root?.attributes.get('aria-labelledby'), 'sty13-title sty13-desc', 'STY-13 SVG labelling');
  assert.match(svgSource, /<title id="sty13-title">Space-Based Architecture 航班余位亲和分区、主备与恢复边界<\/title>/u); assert.match(svgSource, /<desc id="sty13-desc">入口按航段与日期选择唯一分区所有者；分区内服务本地处理余位与暂留，主备复制，日志与检查点恢复，多航段由外部持久工作流协调。<\/desc>/u);
  exactIds(drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'region').map(({attributes}) => attributes.get('id')), REGION_IDS, 'Draw.io regions'); exactIds(svg.elements.filter(({attributes}) => attributes.has('data-region-id')).map(({attributes}) => attributes.get('data-region-id')), REGION_IDS, 'SVG regions');
  exactIds(drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'node-shape').map(({attributes}) => attributes.get('id').replace(/^node-/u, '')), NODE_IDS, 'Draw.io nodes'); exactIds(svg.nodes.map(({attributes}) => attributes.get('data-node-id')), NODE_IDS, 'SVG nodes');
  exactIds(drawio.edges.map(({attributes}) => attributes.get('id')), EDGE_IDS, 'Draw.io edges'); exactIds(svg.edges.map(({attributes}) => attributes.get('data-edge-id')), EDGE_IDS, 'SVG edges');
  const drawioById = new Map(drawio.edges.map((edge) => [edge.attributes.get('id'), edge])); const svgById = new Map(svg.edges.map((edge) => [edge.attributes.get('data-edge-id'), edge]));
  for (const [id, source, target, role, label] of EDGE_CONTRACTS) { const edge = drawioById.get(id); assert.equal(edge.attributes.get('source'), 'node-' + source, id + ' Draw.io source'); assert.equal(edge.attributes.get('target'), 'node-' + target, id + ' Draw.io target'); assert.equal(styleMap(edge.attributes.get('style')).get('semanticRole'), role, id + ' Draw.io role'); assert.equal(edge.label, label, id + ' Draw.io label'); const svgEdge = svgById.get(id); assert.equal(svgEdge.attributes.get('data-source'), source, id + ' SVG source'); assert.equal(svgEdge.attributes.get('data-target'), target, id + ' SVG target'); assert.equal(svgEdge.attributes.get('data-role'), role, id + ' SVG role'); assert.equal(svgEdge.attributes.get('data-label'), label, id + ' SVG label'); }
}
async function assertRelationsAndStage() {
  const documents = await readContentDocuments(CONTENT_ROOT); const article = documents.find(({file: path}) => 'content/' + path === ARTICLE); assert.ok(article, 'STY-13 content document'); const links = extractInternalLinks(article);
  for (const related of RELATED_CASES) assert.ok(links.includes(related), 'visible related case: ' + related); assert.equal(links.includes(NEXT_ROUTE), false, 'STY-14 remains non-actionable from STY-13'); assert.equal(documents.flatMap(extractInternalLinks).filter((link) => link === NEXT_ROUTE).length, 0, 'STY-14 actionable route count is zero');
  const backlog = readFileSync('docs/content-backlog.md', 'utf8'); assert.match(backlog, new RegExp('^- \\[ \\] \\*\\*' + NEXT_TOPIC + ' P1', 'mu'), 'STY-14 is pending');
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8')); const projection = {completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}; const published = new RegExp('^- \\[x\\] \\*\\*' + TOPIC_ID + ' ', 'mu').test(backlog);
  if (!published) { assert.deepEqual(projection, EXPECTED_STAGE_A, 'Stage A projection while STY-13 remains pending'); return; }
  assert.deepEqual(projection, EXPECTED_STAGE_B, 'Stage B projection');
  const review = file(STAGE_B_REVIEW); const browser = file(STAGE_B_BROWSER); assert.ok(review && browser, 'Stage B review and four-state Browser evidence exist'); const evidence = JSON.parse(browser); const head = spawnSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).stdout.trim();
  assert.deepEqual(evidence.pages, {...evidence.pages, workflow: 'Verify and deploy Docusaurus to GitHub Pages', headSha: head, event: 'push', status: 'completed', conclusion: 'success'}, 'exact-head Pages deployment identity'); assert.equal(evidence.implementationHead, head, 'Browser evidence exact implementation head'); assert.deepEqual(Object.keys(evidence.states).sort(), ['desktopDark', 'desktopLight', 'mobileDark', 'mobileLight'], 'four Browser states'); assert.equal(evidence.functionalSummary.status, 'PASS', 'Browser functional QA passes'); assert.equal(evidence.functionalSummary.states, 4, 'four Browser states accepted'); assert.equal(evidence.functionalSummary.sty14ActionableTotal, 0, 'STY-14 actionable count is zero'); for (const state of Object.values(evidence.states)) assert.equal(state.geometry?.sty14, 0, 'each accepted state has zero STY-14 actions');
  for (const closing of ['code review', 'content review', 'architecture review']) assert.match(review, new RegExp(closing + '[\\s\\S]{0,200}(?:READY|APPROVE|PASS|CLEAR)', 'iu'), closing + ' final review closed'); assert.match(review, new RegExp(head, 'u'), 'review binds exact head');
}
function fixtureArticle() {
  const sections = EXPECTED_HEADINGS.map((heading) => '## ' + heading + (heading === '可迁移经验' ? '\n### ' + MIGRATION_HEADINGS.join('\n### ') : '')).join('\n'); const rows = (items) => items.map((row) => '| ' + row.join(' | ') + ' |').join('\n');
  return '---\n' + frontMatterFixture(EXACT_METADATA) + '\n---\n' + sections + '\n' + WRAPPERS.map((label) => '<div role="region" aria-label="' + label + '" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>').join('\n') + '\n| ' + COMPARISON_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- | --- |\n' + rows(COMPARISON_ROWS) + '\n\n| ' + OPERATION_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- |\n' + rows(OPERATION_ROWS) + '\n\n| ' + FAILURE_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- |\n' + rows(FAILURE_ROWS) + '\n' + REQUIRED_SENTENCES.join('\n');
}
function assertGenericHelperRejections() { assert.throws(() => parsePathPoints('M 0 0 L'), assert.AssertionError, 'missing path coordinate rejected'); assert.deepEqual(parsePathPoints('M 0 0 H 10 V 5'), [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 5}], 'orthogonal route parsing'); const cssFixture = 'path { stroke: #123456; }'; assert.equal(svgPresentationValue(cssFixture, parseSvg('<svg><path/></svg>').elements[1], 'stroke'), '#123456', 'CSS cascade helper'); assert.ok(markerEnvelope({x: 10, y: 0}, {x: 0, y: 0}, {width: 2, height: 2, refX: 1, refY: 1}).right > 10, 'marker helper'); }

test('STY-13 helper fixture locks its public content contract', () => {
  assertGenericHelperRejections(); assert.equal(architectureCaseTopicIds.has(TOPIC_ID), true, 'STY-13 uses architecture-case contract'); const fixture = fixtureArticle(); assertSpaceBasedArticle(fixture);
  for (const key of Object.keys(EXACT_METADATA)) assert.throws(() => assertSpaceBasedArticle(removeFrontMatterField(fixture, key)), assert.AssertionError, key + ' deletion rejected');
  for (const [headers, rows] of [[COMPARISON_HEADERS, COMPARISON_ROWS], [OPERATION_HEADERS, OPERATION_ROWS], [FAILURE_HEADERS, FAILURE_ROWS]]) { const header = '| ' + headers.join(' | ') + ' |'; assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, header, '| 错误表头 |', 'header')), assert.AssertionError, 'wrong table header rejected'); for (const row of rows) { const exact = '| ' + row.join(' | ') + ' |'; assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, exact, '| ' + [...row.slice(0, -1), '错误的合同值'].join(' | ') + ' |', row[0])), assert.AssertionError, row[0] + ' mutation rejected'); } }
  for (const sentence of REQUIRED_SENTENCES) assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, sentence, '错误的事实边界。', sentence)), assert.AssertionError, sentence + ' mutation rejected');
});
test('STY-13 publication contract remains RED until the article exists', async () => {
  const source = file(ARTICLE); assert.ok(source, ARTICLE + ' must exist after implementation'); assertSpaceBasedArticle(source); assertSpaceBasedSources(JSON.parse(readFileSync('data/source-ledger.json', 'utf8'))); assertSpaceBasedDiagram(file(DRAWIO), file(SVG)); await assertRelationsAndStage();
});
