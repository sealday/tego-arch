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
function changeFrontMatterField(source, key) { const value = EXACT_METADATA[key]; return Array.isArray(value) && value.length ? replaceOnce(source, '  - ' + value[0], '  - changed', key + ' changed') : replaceOnce(source, key + ': ' + (Array.isArray(value) ? '[]' : value), key + ': changed', key + ' changed'); }
export function markdownTables(body) { const tables = []; const lines = body.split(/\r?\n/u); for (let index = 0; index < lines.length; index += 1) { if (!lines[index].startsWith('|')) continue; const rows = []; while (index < lines.length && lines[index].startsWith('|')) { rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim())); index += 1; } if (rows.length >= 3 && rows[1].every((cell) => /^:?-{3,}:?$/u.test(cell))) tables.push(rows); } return tables; }
function table(body, header) { const found = markdownTables(body).find((candidate) => JSON.stringify(candidate[0]) === JSON.stringify(header)); assert.ok(found, 'table ' + header.join(' | ')); return found; }
function exactRows(actual, expected, name) { assert.deepEqual(actual.slice(2), expected, name + ' exact ordered rows'); }
function attributes(tag) { return new Map([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)].map(([, key, double, single]) => [key, double ?? single])); }
function decodeXmlText(value) { return value.replace(/&(?:#(\d+)|#x([\da-f]+)|amp|lt|gt|quot|apos);/giu, (entity, decimal, hex) => decimal ? String.fromCodePoint(Number(decimal)) : hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : ({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"})[entity] ?? entity); }
export function parseDrawio(source) {
  const cells = [...source.matchAll(/<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/gu)].map(([raw]) => {
    const open = /^<mxCell\b[^>]*>/u.exec(raw)?.[0] ?? raw;
    const geometry = /<mxGeometry\b([^>]*)/u.exec(raw)?.[1] ?? '';
    const array = /<Array\s+as="points"[^>]*>([\s\S]*?)<\/Array>/u.exec(raw);
    const points = array ? [...array[1].matchAll(/<mxPoint\b([^>]*)/gu)].map(([, point]) => attributes('<mxPoint ' + point + '>')) : [];
    return {raw, attributes: attributes(open), geometry: attributes('<mxGeometry ' + geometry + '>'), points, hasPointsArray: Boolean(array), misplacedPoints: [...raw.matchAll(/<mxPoint\b/gu)].length - points.length, label: decodeXmlText(attributes(open).get('value') ?? '')};
  });
  return {cells, nodes: cells.filter(({attributes: item}) => item.get('vertex') === '1'), edges: cells.filter(({attributes: item}) => item.get('edge') === '1')};
}
export function parseSvg(source) {
  const elements = []; const stack = [];
  for (const match of source.matchAll(/<\/?([A-Za-z][\w:.-]*)\b([^>]*)>/gu)) {
    if (match[0].startsWith('</')) { const element = stack.pop(); assert.equal(element?.name, match[1], 'balanced SVG element ' + match[1]); element.closeIndex = match.index; continue; }
    const element = {name: match[1], attributes: attributes(match[2]), parent: stack.at(-1) ?? null, index: elements.length, sourceIndex: match.index, openEnd: match.index + match[0].length, closeIndex: match.index + match[0].length};
    elements.push(element); if (!match[0].endsWith('/>')) stack.push(element);
  }
  assert.equal(stack.length, 0, 'balanced SVG tree');
  return {elements, nodes: elements.filter(({attributes: item}) => item.has('data-node-id')), edges: elements.filter(({name, attributes: item}) => name === 'path' && item.has('data-edge-id'))};
}
export function assertFlattenedSvg(elements) { for (const element of elements) assert.equal(element.attributes.has('transform'), false, 'flattened SVG geometry: <' + element.name + '> has no transform'); }
function number(value, label) { const result = Number.parseFloat(value); assert.ok(Number.isFinite(result), label); return result; }
function numericBounds(attributesMap, label) { const result = Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, number(attributesMap.get(key), label + ' ' + key)])); assert.ok(result.width >= 0 && result.height >= 0, label + ' nonnegative size'); return {...result, left: result.x, top: result.y, right: result.x + result.width, bottom: result.y + result.height}; }
export function parsePathPoints(data) {
  assert.doesNotMatch(data ?? '', /[CQSAZ]/iu, 'connector path uses only M/L/H/V');
  const tokens = data?.match(/[A-Za-z]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []; const points = []; let cursor = 0; let command; let current = {x: 0, y: 0};
  while (cursor < tokens.length) {
    if (/^[A-Za-z]$/u.test(tokens[cursor])) command = tokens[cursor++];
    const relative = command === command?.toLowerCase(); const take = () => number(tokens[cursor++], 'path coordinate');
    if (command?.toUpperCase() === 'M' || command?.toUpperCase() === 'L') { const x = take(); const y = take(); current = {x: relative ? current.x + x : x, y: relative ? current.y + y : y}; points.push(current); if (command?.toUpperCase() === 'M') command = relative ? 'l' : 'L'; }
    else if (command?.toUpperCase() === 'H') { const x = take(); current = {x: relative ? current.x + x : x, y: current.y}; points.push(current); }
    else if (command?.toUpperCase() === 'V') { const y = take(); current = {x: current.x, y: relative ? current.y + y : y}; points.push(current); }
    else assert.fail('unsupported path command ' + command);
  }
  assert.ok(points.length >= 2 && points.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)), 'visible connector path'); return points;
}
function styleMap(value = '') { return new Map(value.split(';').filter(Boolean).map((item) => item.split(/=(.*)/su).map((part) => part.trim()))); }
function cssDeclarations(source = '') { const result = new Map(); for (const declaration of source.split(';').map((item) => item.trim()).filter(Boolean)) { const split = declaration.indexOf(':'); if (split < 0) continue; const property = declaration.slice(0, split).trim().toLowerCase(); const raw = declaration.slice(split + 1).trim(); result.set(property, {value: raw.replace(/\s*!important\s*$/iu, '').trim(), important: /\s*!important\s*$/iu.test(raw)}); } return result; }
function selectorSpecificity(selector) { return [(selector.match(/#[\w-]+/gu) ?? []).length, (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/gu) ?? []).length, (selector.match(/(?:^|[\s>+~])([A-Za-z][\w-]*)/gu) ?? []).length]; }
function compareSpecificity(left, right) { return left[0] - right[0] || left[1] - right[1] || left[2] - right[2]; }
function styleRules(source) { const rules = []; let order = 0; for (const [, sheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) for (const [, selectors, declarations] of sheet.replace(/\/\*[\s\S]*?\*\//gu, '').matchAll(/([^{}]+)\{([^{}]*)\}/gu)) for (const selector of selectors.split(',').map((item) => item.trim()).filter(Boolean)) rules.push({selector, declarations: cssDeclarations(declarations), specificity: selectorSpecificity(selector), order: order++}); return rules; }
function simpleSelectorMatches(element, selector) { const simple = selector.trim(); if (!simple || /[+~>\s]/u.test(simple)) return false; if (simple.includes(':root') && element.parent) return false; const id = simple.match(/#([\w-]+)/u)?.[1]; const tag = simple.match(/^[A-Za-z][\w-]*/u)?.[0]; const classes = [...simple.matchAll(/\.([\w-]+)/gu)].map((match) => match[1]); const selectors = [...simple.matchAll(/\[([\w:-]+)(?:\s*=\s*["']?([^\]"']+)["']?)?\]/gu)]; return (!tag || element.name === tag) && (!id || element.attributes.get('id') === id) && classes.every((name) => (element.attributes.get('class') ?? '').split(/\s+/u).includes(name)) && selectors.every(([, key, value]) => element.attributes.has(key) && (value === undefined || element.attributes.get(key) === value.trim())); }
function selectorMatches(element, selector) { const parts = selector.trim().replace(/\s*>\s*/gu, ' > ').split(/\s+/u).filter(Boolean); let candidate = element; let cursor = parts.length - 1; if (!simpleSelectorMatches(candidate, parts[cursor])) return false; cursor -= 1; while (cursor >= 0) { if (parts[cursor] === '>') { candidate = candidate.parent; if (!candidate || cursor === 0 || !simpleSelectorMatches(candidate, parts[cursor - 1])) return false; cursor -= 2; } else { candidate = candidate.parent; while (candidate && !simpleSelectorMatches(candidate, parts[cursor])) candidate = candidate.parent; if (!candidate) return false; cursor -= 1; } } return true; }
function ownSvgPresentationValue(source, element, property) { let winner = element.attributes.has(property) ? {tier: 0, specificity: [0, 0, 0], order: -1, value: element.attributes.get(property)} : null; for (const rule of styleRules(source)) { const declaration = rule.declarations.get(property); if (!declaration || !selectorMatches(element, rule.selector)) continue; const candidate = {tier: declaration.important ? 3 : 1, specificity: rule.specificity, order: rule.order, value: declaration.value}; if (!winner || candidate.tier > winner.tier || candidate.tier === winner.tier && (compareSpecificity(candidate.specificity, winner.specificity) > 0 || compareSpecificity(candidate.specificity, winner.specificity) === 0 && candidate.order > winner.order)) winner = candidate; } const inline = cssDeclarations(element.attributes.get('style')).get(property); if (inline) { const candidate = {tier: inline.important ? 4 : 2, specificity: [1, 0, 0], order: Number.MAX_SAFE_INTEGER, value: inline.value}; if (!winner || candidate.tier >= winner.tier) winner = candidate; } return winner?.value; }
const INHERITED_SVG_PROPERTIES = new Set(['color', 'fill', 'fill-opacity', 'font-family', 'font-size', 'font-style', 'font-weight', 'marker-end', 'marker-mid', 'marker-start', 'stroke', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'stroke-width', 'text-anchor', 'visibility']);
export function svgPresentationValue(source, element, property) { const own = ownSvgPresentationValue(source, element, property); if (own !== undefined && !['inherit', 'unset'].includes(own)) return own === 'initial' ? undefined : own; if ((own === 'inherit' || own === 'unset' && INHERITED_SVG_PROPERTIES.has(property) || own === undefined && INHERITED_SVG_PROPERTIES.has(property)) && element.parent) return svgPresentationValue(source, element.parent, property); return undefined; }
function absoluteDrawioBounds(node, nodeById) { const box = numericBounds(node.geometry, node.attributes.get('id')); const parent = nodeById.get(node.attributes.get('parent')); if (!parent || styleMap(parent.attributes.get('style')).get('semanticRole') !== 'region') return box; const parentBox = numericBounds(parent.geometry, parent.attributes.get('id')); return {...box, x: box.x + parentBox.x, y: box.y + parentBox.y, left: box.left + parentBox.x, right: box.right + parentBox.x, top: box.top + parentBox.y, bottom: box.bottom + parentBox.y}; }
function terminalPoint(node, edge, side, nodeById) { const box = absoluteDrawioBounds(node, nodeById); const style = styleMap(edge.attributes.get('style')); for (const key of [side + 'X', side + 'Y', side + 'Dx', side + 'Dy', side + 'Perimeter']) assert.ok(style.has(key), edge.attributes.get('id') + ' ' + key); assert.equal(style.get(side + 'Dx'), '0', 'terminal dx'); assert.equal(style.get(side + 'Dy'), '0', 'terminal dy'); assert.equal(style.get(side + 'Perimeter'), '1', 'terminal perimeter'); const x = number(style.get(side + 'X'), 'normalized terminal x'); const y = number(style.get(side + 'Y'), 'normalized terminal y'); assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1 && (x === 0 || x === 1 || y === 0 || y === 1), 'normalized terminal on perimeter'); return {x: box.x + box.width * x, y: box.y + box.height * y}; }
export function drawioRoute(edge, nodeById) { const source = nodeById.get(edge.attributes.get('source')); const target = nodeById.get(edge.attributes.get('target')); assert.ok(source && target, edge.attributes.get('id') + ' real terminals'); assert.ok(edge.hasPointsArray, edge.attributes.get('id') + ' waypoint array'); assert.ok(edge.points.length > 0, edge.attributes.get('id') + ' explicit waypoint'); assert.equal(edge.misplacedPoints, 0, edge.attributes.get('id') + ' points only in waypoint array'); assert.equal(edge.points.some((point) => ['sourcePoint', 'targetPoint'].includes(point.get('as'))), false, edge.attributes.get('id') + ' no fallback points'); return [terminalPoint(source, edge, 'exit', nodeById), ...edge.points.map((point) => ({x: number(point.get('x'), 'waypoint x'), y: number(point.get('y'), 'waypoint y')})), terminalPoint(target, edge, 'entry', nodeById)]; }
export function glyphBox({x, y, text, fontSize, anchor = 'start'}) { const width = [...text].reduce((total, character) => total + (/^[\u0000-\u00ff]$/u.test(character) ? .64 : 1), 0) * fontSize; const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x; return {left, right: left + width, top: y - fontSize * .82, bottom: y + fontSize * .22}; }
export function alphaCompose(backdrop, foreground) { const alpha = foreground.alpha + backdrop.alpha * (1 - foreground.alpha); if (alpha === 0) return {red: 0, green: 0, blue: 0, alpha: 0}; return {red: (foreground.red * foreground.alpha + backdrop.red * backdrop.alpha * (1 - foreground.alpha)) / alpha, green: (foreground.green * foreground.alpha + backdrop.green * backdrop.alpha * (1 - foreground.alpha)) / alpha, blue: (foreground.blue * foreground.alpha + backdrop.blue * backdrop.alpha * (1 - foreground.alpha)) / alpha, alpha}; }
function close(left, right, label) { assert.ok(Math.abs(left - right) < .01, label + ': ' + left + ' !== ' + right); }
export function markerEnvelope(endpoint, previous, {width, height, refX, refY, viewBox = [0, 0, width, height], pathBounds = {left: viewBox[0], top: viewBox[1], right: viewBox[0] + viewBox[2], bottom: viewBox[1] + viewBox[3]}, preserveAspectRatio = 'xMidYMid meet'}) { const dx = endpoint.x - previous.x; const dy = endpoint.y - previous.y; const length = Math.hypot(dx, dy); assert.ok(length > 0, 'marker terminal direction'); const [, , viewWidth, viewHeight] = viewBox; assert.ok(viewWidth > 0 && viewHeight > 0 && width > 0 && height > 0, 'positive marker viewport and viewBox'); const unit = {x: dx / length, y: dy / length}; const normal = {x: -unit.y, y: unit.x}; const [scaleX, scaleY] = preserveAspectRatio === 'none' ? [width / viewWidth, height / viewHeight] : (assert.equal(preserveAspectRatio, 'xMidYMid meet', 'supported marker preserveAspectRatio'), close(width / viewWidth, height / viewHeight, 'meet marker aspect ratio'), [width / viewWidth, height / viewHeight]); const points = [[pathBounds.left, pathBounds.top], [pathBounds.right, pathBounds.top], [pathBounds.right, pathBounds.bottom], [pathBounds.left, pathBounds.bottom]].map(([x, y]) => ({x: endpoint.x + unit.x * (x - refX) * scaleX + normal.x * (y - refY) * scaleY, y: endpoint.y + unit.y * (x - refX) * scaleX + normal.y * (y - refY) * scaleY})); return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function exactIds(actual, expected, label) { assert.equal(new Set(actual).size, actual.length, label + ' duplicate-free'); assert.deepEqual([...actual].sort(), [...expected].sort(), label + ' exact identities'); }
function hiddenDrawioCell(cell) { const style = styleMap(cell.attributes.get('style')); return cell.attributes.get('visible') === '0' || style.get('visible') === '0' || style.get('opacity') === '0'; }
function hiddenSvgElement(source, element) { const ancestors = []; for (let current = element; current; current = current.parent) ancestors.push(current); if (ancestors.some((candidate) => candidate.attributes.get('aria-hidden') === 'true' || ownSvgPresentationValue(source, candidate, 'display') === 'none')) return true; if (['hidden', 'collapse'].includes(svgPresentationValue(source, element, 'visibility'))) return true; const opacity = ancestors.reduce((product, candidate) => product * number(ownSvgPresentationValue(source, candidate, 'opacity') ?? '1', 'SVG opacity'), 1); const paintIsTransparent = (value) => value === undefined || /^(?:none|transparent)$/iu.test(value.trim()) || /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/iu.test(value.trim()) || /^hsla\([^)]*,\s*0(?:\.0+)?\s*\)$/iu.test(value.trim()) || /^#[\da-f]{6}00$/iu.test(value.trim()) || /^#[\da-f]{3}0$/iu.test(value.trim()); const painted = (property) => !paintIsTransparent(svgPresentationValue(source, element, property)) && number(svgPresentationValue(source, element, property + '-opacity') ?? '1', property + ' opacity') * opacity > 0; const visiblePaint = element.name === 'path' && element.attributes.has('data-edge-id') ? painted('stroke') && number(svgPresentationValue(source, element, 'stroke-width') ?? '1', 'stroke width') > 0 : painted('fill') || painted('stroke') && number(svgPresentationValue(source, element, 'stroke-width') ?? '1', 'stroke width') > 0; return opacity === 0 || !visiblePaint; }
function assertRoutesClose(actual, expected, label) { assert.equal(actual.length, expected.length, label + ' point count'); for (let index = 0; index < actual.length; index += 1) { assert.ok(Math.abs(actual[index].x - expected[index].x) <= .01, label + ' point ' + index + ' x'); assert.ok(Math.abs(actual[index].y - expected[index].y) <= .01, label + ' point ' + index + ' y'); } }
function expandedBox(box, amount) { return {left: box.left - amount, right: box.right + amount, top: box.top - amount, bottom: box.bottom + amount}; }
function boxDistance(left, right) { const dx = Math.max(0, left.left - right.right, right.left - left.right); const dy = Math.max(0, left.top - right.bottom, right.top - left.bottom); return Math.hypot(dx, dy); }
function segmentEnvelope(start, end, halfStroke) { return expandedBox({left: Math.min(start.x, end.x), right: Math.max(start.x, end.x), top: Math.min(start.y, end.y), bottom: Math.max(start.y, end.y)}, halfStroke); }
function segmentCrossesBox(start, end, box) { if (start.x === end.x) return start.x > box.left && start.x < box.right && Math.max(Math.min(start.y, end.y), box.top) < Math.min(Math.max(start.y, end.y), box.bottom); if (start.y === end.y) return start.y > box.top && start.y < box.bottom && Math.max(Math.min(start.x, end.x), box.left) < Math.min(Math.max(start.x, end.x), box.right); assert.fail('semantic connectors must remain orthogonal'); }
function positiveCollinearOverlap(leftStart, leftEnd, rightStart, rightEnd) { if (leftStart.x === leftEnd.x && rightStart.x === rightEnd.x && leftStart.x === rightStart.x) return Math.min(Math.max(leftStart.y, leftEnd.y), Math.max(rightStart.y, rightEnd.y)) - Math.max(Math.min(leftStart.y, leftEnd.y), Math.min(rightStart.y, rightEnd.y)); if (leftStart.y === leftEnd.y && rightStart.y === rightEnd.y && leftStart.y === rightStart.y) return Math.min(Math.max(leftStart.x, leftEnd.x), Math.max(rightStart.x, rightEnd.x)) - Math.max(Math.min(leftStart.x, leftEnd.x), Math.min(rightStart.x, rightEnd.x)); return 0; }
function edgePathElements(svg, id) { const primary = svg.edges.find(({attributes: item}) => item.get('data-edge-id') === id); assert.ok(primary, id + ' primary semantic path'); const segments = svg.elements.filter(({name, attributes: item}) => name === 'path' && item.get('data-edge-segment-for') === id).sort((left, right) => number(left.attributes.get('data-segment-order'), id + ' segment order') - number(right.attributes.get('data-segment-order'), id + ' segment order')); assert.deepEqual(segments.map(({attributes: item}) => number(item.get('data-segment-order'), id + ' segment order')), segments.map((_, index) => index + 2), id + ' contiguous additional segment order'); return [primary, ...segments]; }
function logicalSvgRoute(svg, id) { return edgePathElements(svg, id).flatMap((path) => parsePathPoints(path.attributes.get('d'))); }
function semanticSegments(svg) { return svg.edges.flatMap((edge) => { const id = edge.attributes.get('data-edge-id'); return edgePathElements(svg, id).flatMap((path) => { const points = parsePathPoints(path.attributes.get('d')); return points.slice(1).map((end, index) => ({id, source: edge.attributes.get('data-source'), target: edge.attributes.get('data-target'), start: points[index], end})); }); }); }
function svgRegionBounds(svg) { return new Map(svg.elements.filter(({attributes: item}) => item.has('data-region-bounds')).map((region) => { const values = region.attributes.get('data-region-bounds').split(/\s+/u); return [region.attributes.get('data-region-id'), numericBounds(new Map(['x', 'y', 'width', 'height'].map((key, index) => [key, values[index]])), region.attributes.get('data-region-id'))]; })); }
function markerPathBounds(svg, marker) { const child = marker && svg.elements.find((element) => element.parent === marker && element.name === 'path'); assert.ok(child, (marker?.attributes.get('id') ?? 'marker') + ' marker path'); const coordinates = [...(child.attributes.get('d') ?? '').matchAll(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu)].map(([value]) => Number(value)); assert.ok(coordinates.length >= 4 && coordinates.length % 2 === 0 && coordinates.every(Number.isFinite), marker.attributes.get('id') + ' marker coordinate pairs'); const points = Array.from({length: coordinates.length / 2}, (_, index) => ({x: coordinates[index * 2], y: coordinates[index * 2 + 1]})); return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function transformedMarkerBox(svgSource, svg, path) { const markerId = /url\(#([^)]+)\)/u.exec(svgPresentationValue(svgSource, path, 'marker-end') ?? '')?.[1]; const marker = svg.elements.find((element) => element.name === 'marker' && element.attributes.get('id') === markerId); assert.ok(marker, (path.attributes.get('data-edge-id') ?? 'path') + ' marker definition'); const points = parsePathPoints(path.attributes.get('d')); const strokeWidth = number(svgPresentationValue(svgSource, path, 'stroke-width'), 'marker path stroke width'); const units = marker.attributes.get('markerUnits') ?? 'strokeWidth'; const unitScale = units === 'strokeWidth' ? strokeWidth : (assert.equal(units, 'userSpaceOnUse', 'supported marker units'), 1); const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.equal(viewBox.length, 4, markerId + ' marker viewBox'); return markerEnvelope(points.at(-1), points.at(-2), {width: number(marker.attributes.get('markerWidth'), markerId + ' width') * unitScale, height: number(marker.attributes.get('markerHeight'), markerId + ' height') * unitScale, refX: number(marker.attributes.get('refX'), markerId + ' refX'), refY: number(marker.attributes.get('refY'), markerId + ' refY'), viewBox, pathBounds: markerPathBounds(svg, marker), preserveAspectRatio: marker.attributes.get('preserveAspectRatio') ?? 'xMidYMid meet'}); }

function assertSpaceBasedGeometry(drawioSource, svgSource, drawio, svg) {
  const nodeById = new Map(drawio.nodes.map((node) => [node.attributes.get('id'), node]));
  const drawioRegions = drawio.nodes.filter(({attributes: item}) => styleMap(item.get('style')).get('semanticRole') === 'region');
  const svgRegions = svg.elements.filter(({attributes: item}) => item.has('data-region-id'));
  exactIds(drawioRegions.map(({attributes: item}) => item.get('id')), REGION_IDS, 'Draw.io regions');
  exactIds(svgRegions.map(({attributes: item}) => item.get('data-region-id')), REGION_IDS, 'SVG regions');
  const drawioRegionBounds = new Map(drawioRegions.map((region) => [region.attributes.get('id'), numericBounds(region.geometry, region.attributes.get('id'))]));
  const renderedRegionBounds = svgRegionBounds(svg);
  exactIds([...renderedRegionBounds.keys()], REGION_IDS, 'SVG region bounds');
  for (const id of REGION_IDS) assert.deepEqual(renderedRegionBounds.get(id), drawioRegionBounds.get(id), id + ' synchronized Draw.io/SVG bounds');

  const drawioNodes = drawio.nodes.filter(({attributes: item}) => styleMap(item.get('style')).get('semanticRole') === 'node-shape');
  exactIds(drawioNodes.map(({attributes: item}) => item.get('id').replace(/^node-/u, '')), NODE_IDS, 'Draw.io nodes');
  exactIds(svg.nodes.map(({attributes: item}) => item.get('data-node-id')), NODE_IDS, 'SVG nodes');
  const drawioRegionIds = new Set(REGION_IDS);
  for (const node of drawioNodes) assert.ok(drawioRegionIds.has(node.attributes.get('parent')), node.attributes.get('id') + ' direct Draw.io region child');
  for (const node of svg.nodes) assert.ok(node.parent?.attributes.has('data-region-id') && drawioRegionIds.has(node.parent.attributes.get('data-region-id')), node.attributes.get('data-node-id') + ' direct SVG region child');
  const nodeBounds = new Map(svg.nodes.map((node) => { const id = node.attributes.get('data-node-id'); const shape = svg.elements.find((element) => element.parent === node && element.attributes.get('data-node-shape-for') === id); assert.ok(shape && ['rect', 'ellipse', 'circle'].includes(shape.name), id + ' visible node shape'); assert.equal(hiddenSvgElement(svgSource, shape), false, id + ' visible node geometry'); let box; if (shape.name === 'rect') box = numericBounds(shape.attributes, id); else if (shape.name === 'circle') { const cx = number(shape.attributes.get('cx'), id + ' cx'); const cy = number(shape.attributes.get('cy'), id + ' cy'); const radius = number(shape.attributes.get('r'), id + ' r'); box = {left: cx - radius, right: cx + radius, top: cy - radius, bottom: cy + radius}; } else { const cx = number(shape.attributes.get('cx'), id + ' cx'); const cy = number(shape.attributes.get('cy'), id + ' cy'); const rx = number(shape.attributes.get('rx'), id + ' rx'); const ry = number(shape.attributes.get('ry'), id + ' ry'); box = {left: cx - rx, right: cx + rx, top: cy - ry, bottom: cy + ry}; } return [id, expandedBox(box, number(svgPresentationValue(svgSource, shape, 'stroke-width') ?? '0', id + ' stroke width') / 2)]; }));

  assert.equal(EDGE_CONTRACTS.length, EDGE_IDS.length, 'one endpoint/role contract per STY-13 edge');
  exactIds(EDGE_CONTRACTS.map(([id]) => id), EDGE_IDS, 'STY-13 edge contracts');
  const drawioEdges = drawio.edges.filter(({attributes: item}) => EDGE_IDS.includes(item.get('id')));
  exactIds(drawioEdges.map(({attributes: item}) => item.get('id')), EDGE_IDS, 'Draw.io semantic edges');
  exactIds(svg.edges.map(({attributes: item}) => item.get('data-edge-id')), EDGE_IDS, 'SVG semantic edges');
  const drawioById = new Map(drawioEdges.map((edge) => [edge.attributes.get('id'), edge]));
  const svgById = new Map(svg.edges.map((edge) => [edge.attributes.get('data-edge-id'), edge]));
  for (const [id, source, target, role, label] of EDGE_CONTRACTS) {
    const drawioEdge = drawioById.get(id); const svgEdge = svgById.get(id);
    assert.equal(hiddenDrawioCell(drawioEdge), false, id + ' Draw.io route visible');
    assert.deepEqual([drawioEdge.attributes.get('source'), drawioEdge.attributes.get('target'), styleMap(drawioEdge.attributes.get('style')).get('semanticRole'), drawioEdge.label], ['node-' + source, 'node-' + target, role, label], id + ' Draw.io endpoint/role/label contract');
    assert.deepEqual([svgEdge.attributes.get('data-source'), svgEdge.attributes.get('data-target'), svgEdge.attributes.get('data-role'), svgEdge.attributes.get('data-label')], [source, target, role, label], id + ' SVG endpoint/role/label contract');
    const paths = edgePathElements(svg, id);
    for (const [index, path] of paths.entries()) { assert.equal(hiddenSvgElement(svgSource, path), false, id + ' visible SVG route segment ' + (index + 1)); assert.ok(number(svgPresentationValue(svgSource, path, 'stroke-width'), id + ' stroke width') > 0, id + ' positive route stroke'); }
    const terminalPaths = paths.filter((path) => svgPresentationValue(svgSource, path, 'marker-end'));
    assert.equal(terminalPaths.length, 1, id + ' exactly one terminal marker');
    const markerBox = transformedMarkerBox(svgSource, svg, terminalPaths[0]);
    assert.ok([markerBox.left, markerBox.right, markerBox.top, markerBox.bottom].every(Number.isFinite), id + ' finite marker envelope');
    assertRoutesClose(logicalSvgRoute(svg, id), drawioRoute(drawioEdge, nodeById), id + ' synchronized orthogonal route');
  }
  const segments = semanticSegments(svg);
  for (const segment of segments) for (const [nodeId, box] of nodeBounds) if (![segment.source, segment.target].includes(nodeId)) assert.equal(segmentCrossesBox(segment.start, segment.end, box), false, segment.id + ' does not cross unrelated ' + nodeId);
  for (let left = 0; left < segments.length; left += 1) for (let right = left + 1; right < segments.length; right += 1) if (segments[left].id !== segments[right].id) assert.ok(positiveCollinearOverlap(segments[left].start, segments[left].end, segments[right].start, segments[right].end) <= 0, segments[left].id + '/' + segments[right].id + ' no positive collinear overlap');
  for (const segment of segments) { const edge = svgById.get(segment.id); const envelope = segmentEnvelope(segment.start, segment.end, number(svgPresentationValue(svgSource, edge, 'stroke-width'), segment.id + ' stroke width') / 2); assert.equal(boxDistance(envelope, envelope), 0, segment.id + ' finite rendered segment envelope'); }
}

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
  assert.doesNotMatch(svgSource, /<(?:foreignObject|image|script)\b|@font-face|Logo|logo|watermark|水印/iu, 'no embedded HTML, image, script, external font, logo, or watermark');
  const viewBox = (root?.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.equal(viewBox.length, 4, 'SVG viewBox has four numeric values'); assert.ok(viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0, 'SVG viewBox has positive finite geometry');
  assertSpaceBasedGeometry(drawioSource, svgSource, drawio, svg);
}
const FINAL_REVIEW_TYPES = Object.freeze(['code review', 'content review', 'architecture review']);
function assertExactHeadFinalReviews(source, head) {
  assert.match(head, /^[\da-f]{40}$/u, 'exact reviewed head is a full commit SHA');
  const headings = [...source.matchAll(/^##\s+(code review|content review|architecture review)\s*$/gimu)];
  assert.equal(headings.length, FINAL_REVIEW_TYPES.length, 'exactly three typed final-review sections');
  const seen = [];
  for (const [index, heading] of headings.entries()) {
    const type = heading[1].toLowerCase(); const start = heading.index + heading[0].length; const end = /^##\s+/gmu.exec(source.slice(start))?.index; const section = source.slice(start, end === undefined ? source.length : start + end);
    seen.push(type);
    const typeFields = [...section.matchAll(/^-\s*Review type:\s*(code review|content review|architecture review)\s*$/gimu)];
    const headFields = [...section.matchAll(/^-\s*Reviewed head:\s*([\da-f]{40})\s*$/gimu)];
    const verdictFields = [...section.matchAll(/^-\s*Verdict:\s*([^\r\n]+?)\s*$/gimu)];
    assert.equal(typeFields.length, 1, type + ' has exactly one structured review type');
    assert.equal(typeFields[0]?.[1].toLowerCase(), type, type + ' section binds its own review type');
    assert.equal(headFields.length, 1, type + ' has exactly one structured reviewed head');
    assert.equal(headFields[0]?.[1].toLowerCase(), head, type + ' binds the exact implementation head');
    assert.equal(verdictFields.length, 1, type + ' has exactly one structured verdict');
    assert.equal(verdictFields[0]?.[1].trim().toUpperCase(), 'APPROVED', type + ' has an explicit affirmative APPROVED verdict');
    assert.doesNotMatch(section, /\b(?:NOT\s+READY|NOT\s+APPROVED|FAIL(?:ED|URE)?)\b/iu, type + ' contains no negative closing verdict');
    const mentionedHeads = section.match(/\b[\da-f]{40}\b/giu) ?? [];
    assert.ok(mentionedHeads.length > 0 && mentionedHeads.every((value) => value.toLowerCase() === head), type + ' contains no old-head review plus new-head aside');
    assert.equal(headings[index + 1]?.index === heading.index, false, type + ' is a distinct section');
  }
  assert.deepEqual([...seen].sort(), [...FINAL_REVIEW_TYPES].sort(), 'code/content/architecture reviews are each present exactly once');
}
async function assertRelationsAndStage() {
  const documents = await readContentDocuments(CONTENT_ROOT); const article = documents.find(({file: path}) => 'content/' + path === ARTICLE); assert.ok(article, 'STY-13 content document'); const links = extractInternalLinks(article);
  for (const related of RELATED_CASES) assert.ok(links.includes(related), 'visible related case: ' + related); assert.equal(links.includes(NEXT_ROUTE), false, 'STY-14 remains non-actionable from STY-13'); assert.equal(documents.flatMap(extractInternalLinks).filter((link) => link === NEXT_ROUTE).length, 0, 'STY-14 actionable route count is zero');
  const backlog = readFileSync('docs/content-backlog.md', 'utf8'); assert.match(backlog, new RegExp('^- \\[ \\] \\*\\*' + NEXT_TOPIC + ' P1', 'mu'), 'STY-14 is pending');
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8')); const projection = {completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}; const published = new RegExp('^- \\[x\\] \\*\\*' + TOPIC_ID + ' ', 'mu').test(backlog);
  if (!published) { assert.deepEqual(projection, EXPECTED_STAGE_A, 'Stage A projection while STY-13 remains pending'); return; }
  assert.deepEqual(projection, EXPECTED_STAGE_B, 'Stage B projection');
  const review = file(STAGE_B_REVIEW); const browser = file(STAGE_B_BROWSER); assert.ok(review && browser, 'Stage B review and four-state Browser evidence exist'); const evidence = JSON.parse(browser); const headResult = spawnSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}); assert.equal(headResult.status, 0, headResult.stderr || 'resolve exact implementation head'); const head = headResult.stdout.trim();
  assert.deepEqual(evidence.pages, {...evidence.pages, workflow: 'Verify and deploy Docusaurus to GitHub Pages', headSha: head, event: 'push', status: 'completed', conclusion: 'success'}, 'exact-head Pages deployment identity'); assert.equal(evidence.implementationHead, head, 'Browser evidence exact implementation head'); assert.deepEqual(Object.keys(evidence.states).sort(), ['desktopDark', 'desktopLight', 'mobileDark', 'mobileLight'], 'four Browser states'); assert.equal(evidence.functionalSummary.status, 'PASS', 'Browser functional QA passes'); assert.equal(evidence.functionalSummary.states, 4, 'four Browser states accepted'); assert.equal(evidence.functionalSummary.sty14ActionableTotal, 0, 'STY-14 actionable count is zero'); for (const state of Object.values(evidence.states)) assert.equal(state.geometry?.sty14, 0, 'each accepted state has zero STY-14 actions');
  assertExactHeadFinalReviews(review, head);
}
function fixtureArticle() {
  const sections = EXPECTED_HEADINGS.map((heading) => '## ' + heading + (heading === '可迁移经验' ? '\n### ' + MIGRATION_HEADINGS.join('\n### ') : '')).join('\n'); const rows = (items) => items.map((row) => '| ' + row.join(' | ') + ' |').join('\n');
  return '---\n' + frontMatterFixture(EXACT_METADATA) + '\n---\n' + sections + '\n' + WRAPPERS.map((label) => '<div role="region" aria-label="' + label + '" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>').join('\n') + '\n| ' + COMPARISON_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- | --- |\n' + rows(COMPARISON_ROWS) + '\n\n| ' + OPERATION_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- |\n' + rows(OPERATION_ROWS) + '\n\n| ' + FAILURE_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- |\n' + rows(FAILURE_ROWS) + '\n' + REQUIRED_SENTENCES.join('\n');
}
function assertGenericHelperRejections() {
  assert.throws(() => parsePathPoints('M 0 0 L'), assert.AssertionError, 'missing path coordinate rejected');
  assert.throws(() => parsePathPoints('M 0 0 Q 5 5 10 0'), /connector path uses only M\/L\/H\/V/u, 'unsupported curved command rejected');
  assert.deepEqual(parsePathPoints('M 1 2 h 9 v 3'), [{x: 1, y: 2}, {x: 10, y: 2}, {x: 10, y: 5}], 'relative orthogonal route parsing');
  assert.throws(() => assertFlattenedSvg(parseSvg('<svg><g transform="translate(1 1)"/></svg>').elements), /flattened SVG geometry/u, 'transformed SVG geometry rejected');
  assert.throws(() => numericBounds(new Map([['x', '0'], ['y', '0'], ['width', 'NaN'], ['height', '1']]), 'fixture'), assert.AssertionError, 'non-finite bounds rejected');

  const cssFixture = '<svg><style>g { stroke: #111; stroke-width: 3; } path.route { stroke: #222; } #chosen { stroke: #333; } .route { stroke: #444 !important; }</style><g><path id="chosen" class="route" style="stroke: #555"/></g></svg>';
  const cssPath = parseSvg(cssFixture).elements.at(-1);
  assert.equal(svgPresentationValue(cssFixture, cssPath, 'stroke'), '#444', 'stylesheet important overrides normal inline style');
  assert.equal(svgPresentationValue(cssFixture.replace(' !important', ''), parseSvg(cssFixture.replace(' !important', '')).elements.at(-1), 'stroke'), '#555', 'inline style wins normal selector specificity');
  const specificityFixture = '<svg><style>.route { stroke: #111; } #chosen { stroke: #222; }</style><path id="chosen" class="route"/></svg>';
  assert.equal(svgPresentationValue(specificityFixture, parseSvg(specificityFixture).elements.at(-1), 'stroke'), '#222', 'ID specificity wins class specificity');
  assert.equal(svgPresentationValue(cssFixture, cssPath, 'stroke-width'), '3', 'inherited presentation value resolves through parent');

  const drawioFixture = '<mxCell id="region" vertex="1" style="semanticRole=region;"><mxGeometry x="10" y="20" width="500" height="200"/></mxCell><mxCell id="left" vertex="1" parent="region"><mxGeometry x="0" y="0" width="100" height="100"/></mxCell><mxCell id="right" vertex="1" parent="region"><mxGeometry x="300" y="0" width="100" height="100"/></mxCell><mxCell id="edge" edge="1" source="left" target="right" style="exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=1;"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="210" y="70"/></Array></mxGeometry></mxCell>';
  const drawio = parseDrawio(drawioFixture); const nodeById = new Map(drawio.nodes.map((node) => [node.attributes.get('id'), node]));
  assert.deepEqual(drawioRoute(drawio.edges[0], nodeById), [{x: 110, y: 70}, {x: 210, y: 70}, {x: 310, y: 70}], 'absolute Draw.io region geometry, explicit waypoint, and terminals resolve');
  const missingWaypoint = parseDrawio(drawioFixture.replace('<Array as="points"><mxPoint x="210" y="70"/></Array>', '')).edges[0];
  assert.throws(() => drawioRoute(missingWaypoint, nodeById), /waypoint array/u, 'missing waypoint array rejected');
  const misplacedWaypoint = parseDrawio(drawioFixture.replace('<Array as="points"><mxPoint x="210" y="70"/></Array>', '<mxPoint x="210" y="70"/>')).edges[0];
  assert.throws(() => drawioRoute(misplacedWaypoint, nodeById), /waypoint array|points only in waypoint array/u, 'misplaced waypoint rejected');
  const nonfiniteWaypoint = parseDrawio(drawioFixture.replace('x="210" y="70"', 'x="NaN" y="70"')).edges[0];
  assert.throws(() => drawioRoute(nonfiniteWaypoint, nodeById), /waypoint x/u, 'non-finite waypoint rejected');

  assert.deepEqual(glyphBox({x: 50, y: 20, text: 'A航', fontSize: 10, anchor: 'middle'}), {left: 41.8, right: 58.2, top: 11.8, bottom: 22.2}, 'mixed glyph bounds and anchor');
  assert.deepEqual(alphaCompose({red: 0, green: 0, blue: 0, alpha: 1}, {red: 1, green: 1, blue: 1, alpha: .5}), {red: .5, green: .5, blue: .5, alpha: 1}, 'alpha composition');
  assert.deepEqual(markerEnvelope({x: 10, y: 0}, {x: 0, y: 0}, {width: 20, height: 20, refX: 8, refY: 2, viewBox: [0, 0, 10, 5], pathBounds: {left: 2, right: 8, top: 1, bottom: 4}, preserveAspectRatio: 'none'}), {left: -2, right: 10, top: -4, bottom: 8}, 'marker viewBox, path bounds, and nonuniform aspect ratio');
  const markerFixture = '<svg><defs><marker id="arrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="8" refY="5" viewBox="0 0 10 10" preserveAspectRatio="xMidYMid meet"><path d="M 1 1 L 8 5 L 1 9 Z"/></marker></defs><path data-edge-id="route" d="M 0 0 L 10 0" fill="none" stroke="#123" stroke-width="2" marker-end="url(#arrow)"/></svg>';
  const markerSvg = parseSvg(markerFixture);
  assert.deepEqual(transformedMarkerBox(markerFixture, markerSvg, markerSvg.edges[0]), {left: 3, right: 10, top: -4, bottom: 4}, 'marker path bounds are transformed through its viewBox and aspect ratio');
  assert.throws(() => markerEnvelope({x: 10, y: 0}, {x: 0, y: 0}, {width: 20, height: 10, refX: 8, refY: 2, viewBox: [0, 0, 10, 5], preserveAspectRatio: 'xMaxYMax slice'}), /supported marker preserveAspectRatio/u, 'unsupported marker aspect ratio rejected');

  const visibleSvg = '<svg><g stroke="#123456" stroke-width="2"><path data-edge-id="route" d="M 0 0 L 10 0" fill="none"/></g></svg>';
  assert.equal(hiddenSvgElement(visibleSvg, parseSvg(visibleSvg).edges[0]), false, 'inherited painted route is visible');
  const hiddenSvg = visibleSvg.replace('<g ', '<g stroke-opacity="0" ');
  assert.equal(hiddenSvgElement(hiddenSvg, parseSvg(hiddenSvg).edges[0]), true, 'inherited zero-opacity mutation hides route');
  assert.throws(() => assertRoutesClose([{x: 0, y: 0}, {x: 10, y: 0}], [{x: 0, y: 0}, {x: 9, y: 0}], 'route mutation'), /route mutation point 1 x/u, 'route geometry mutation rejected');
  assert.equal(segmentCrossesBox({x: 5, y: 0}, {x: 5, y: 10}, {left: 0, right: 10, top: 2, bottom: 8}), true, 'segment/box crossing detected');
  assert.equal(boxDistance(segmentEnvelope({x: 0, y: 0}, {x: 10, y: 0}, 1), {left: 20, right: 30, top: -1, bottom: 1}), 9, 'painted segment envelope distance');

  const reviewedHead = 'a'.repeat(40); const oldHead = 'b'.repeat(40);
  const reviews = FINAL_REVIEW_TYPES.map((type) => '## ' + type + '\n\n- Review type: ' + type + '\n- Reviewed head: ' + reviewedHead + '\n- Verdict: APPROVED\n\nIndependent ' + type + ' findings closed.').join('\n\n');
  assertExactHeadFinalReviews(reviews, reviewedHead);
  assert.throws(() => assertExactHeadFinalReviews(reviews.replace('- Reviewed head: ' + reviewedHead, '- Reviewed head: ' + oldHead + '\n- Implementation head: ' + reviewedHead), reviewedHead), /binds the exact implementation head|old-head review/u, 'old-head review plus new-head aside rejected');
  assert.throws(() => assertExactHeadFinalReviews(reviews.replace('- Verdict: APPROVED', '- Verdict: NOT APPROVED'), reviewedHead), /affirmative APPROVED verdict/u, 'negative verdict rejected');
  assert.throws(() => assertExactHeadFinalReviews('Implementation head: ' + reviewedHead + '\n' + reviews.replace('- Reviewed head: ' + reviewedHead + '\n', ''), reviewedHead), /structured reviewed head/u, 'head only elsewhere rejected');
  assert.throws(() => assertExactHeadFinalReviews(reviews.replace('- Review type: code review\n', ''), reviewedHead), /structured review type/u, 'missing review type rejected');
  assert.throws(() => assertExactHeadFinalReviews(reviews + '\n\n## code review\n- Review type: code review\n- Reviewed head: ' + reviewedHead + '\n- Verdict: APPROVED', reviewedHead), /exactly three typed final-review sections/u, 'duplicate reused review section rejected');
}

test('STY-13 helper fixture locks its public content contract', () => {
  assertGenericHelperRejections(); assert.equal(architectureCaseTopicIds.has(TOPIC_ID), true, 'STY-13 uses architecture-case contract'); const fixture = fixtureArticle(); assertSpaceBasedArticle(fixture);
  for (const key of Object.keys(EXACT_METADATA)) { assert.throws(() => assertSpaceBasedArticle(removeFrontMatterField(fixture, key)), assert.AssertionError, key + ' deletion rejected'); assert.throws(() => assertSpaceBasedArticle(changeFrontMatterField(fixture, key)), assert.AssertionError, key + ' change rejected'); }
  for (const [headers, rows] of [[COMPARISON_HEADERS, COMPARISON_ROWS], [OPERATION_HEADERS, OPERATION_ROWS], [FAILURE_HEADERS, FAILURE_ROWS]]) { const header = '| ' + headers.join(' | ') + ' |'; assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, header, '| 错误表头 |', 'header')), assert.AssertionError, 'wrong table header rejected'); for (const row of rows) { const exact = '| ' + row.join(' | ') + ' |'; assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, exact, '| ' + [...row.slice(0, -1), '错误的合同值'].join(' | ') + ' |', row[0])), assert.AssertionError, row[0] + ' mutation rejected'); } }
  for (const sentence of REQUIRED_SENTENCES) assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, sentence, '错误的事实边界。', sentence)), assert.AssertionError, sentence + ' mutation rejected');
});
test('STY-13 publication contract remains RED until the article exists', async () => {
  const source = file(ARTICLE); assert.ok(source, ARTICLE + ' must exist after implementation'); assertSpaceBasedArticle(source); assertSpaceBasedSources(JSON.parse(readFileSync('data/source-ledger.json', 'utf8'))); assertSpaceBasedDiagram(file(DRAWIO), file(SVG)); await assertRelationsAndStage();
});
