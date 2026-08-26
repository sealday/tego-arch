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
  summary: '以商品、购物车、结算和账户切片说明 Micro-Frontend：薄共享应用外壳通过完整版本化清单组合不可变制品，业务真相与授权留在后端，公共运行时保持最小，同页错误只做有限降级。',
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
export const EDGE_IDS = Object.freeze([
  'catalog-release', 'cart-release', 'checkout-release', 'account-release',
  'store-artifacts', 'validate-candidate', 'publish-manifest', 'promote-manifest',
  'resolve-manifest', 'route-control', 'activate-catalog', 'activate-cart',
  'activate-checkout', 'activate-account', 'share-runtime-catalog', 'share-runtime-cart',
  'share-runtime-checkout', 'share-runtime-account', 'checkout-read-cart',
  'checkout-submit-order', 'catalog-query', 'cart-query', 'account-query',
  'load-failure', 'rollback-manifest', 'return-catalog', 'return-cart-version',
  'return-order-id', 'return-account',
]);
export const EDGE_CONTRACTS = Object.freeze([
  ['catalog-release', 'catalog-pipeline', 'immutable-artifacts', 'release', '商品制品'],
  ['cart-release', 'cart-pipeline', 'immutable-artifacts', 'release', '购物车制品'],
  ['checkout-release', 'checkout-pipeline', 'immutable-artifacts', 'release', '结算制品'],
  ['account-release', 'account-pipeline', 'immutable-artifacts', 'release', '账户制品'],
  ['store-artifacts', 'immutable-artifacts', 'compatibility-gate', 'release', '存储不可变制品'],
  ['validate-candidate', 'compatibility-gate', 'versioned-manifest', 'release', '验证候选组合'],
  ['publish-manifest', 'versioned-manifest', 'atomic-promotion', 'release', '生成完整清单'],
  ['promote-manifest', 'atomic-promotion', 'shell', 'release', '原子提升'],
  ['resolve-manifest', 'versioned-manifest', 'shell', 'resolve', '解析批准清单'],
  ['route-control', 'shell', 'top-router', 'resolve', '匹配顶层路由'],
  ['activate-catalog', 'top-router', 'catalog-slice', 'resolve', '挂载商品'],
  ['activate-cart', 'top-router', 'cart-slice', 'resolve', '挂载购物车'],
  ['activate-checkout', 'top-router', 'checkout-slice', 'resolve', '挂载结算'],
  ['activate-account', 'top-router', 'account-slice', 'resolve', '挂载账户'],
  ['share-runtime-catalog', 'shared-runtime', 'catalog-slice', 'resolve', '共享商品运行时'],
  ['share-runtime-cart', 'shared-runtime', 'cart-slice', 'resolve', '共享购物车运行时'],
  ['share-runtime-checkout', 'shared-runtime', 'checkout-slice', 'resolve', '共享结算运行时'],
  ['share-runtime-account', 'shared-runtime', 'account-slice', 'resolve', '共享账户运行时'],
  ['checkout-read-cart', 'checkout-slice', 'cart-api', 'business', '购物车 ID + 预期版本'],
  ['checkout-submit-order', 'checkout-slice', 'order-api', 'business', '购物车 ID + 幂等键'],
  ['catalog-query', 'catalog-slice', 'catalog-api', 'business', '查询商品'],
  ['cart-query', 'cart-slice', 'cart-api', 'business', '查询购物车'],
  ['account-query', 'account-slice', 'account-api', 'business', '查询账户'],
  ['load-failure', 'checkout-slice', 'slice-fallback', 'recovery', '加载失败'],
  ['rollback-manifest', 'slice-fallback', 'atomic-promotion', 'recovery', '回退完整清单'],
  ['return-catalog', 'catalog-api', 'catalog-slice', 'business', '返回商品事实'],
  ['return-cart-version', 'cart-api', 'checkout-slice', 'business', '返回带版本购物车'],
  ['return-order-id', 'order-api', 'checkout-slice', 'business', '返回订单 ID'],
  ['return-account', 'account-api', 'account-slice', 'business', '返回账户事实'],
]);
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
export function parseDrawio(source) { const cells = [...source.matchAll(/<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/gu)].map(([raw]) => { const open = /^<mxCell\b[^>]*>/u.exec(raw)?.[0] ?? raw; const geometry = /<mxGeometry\b([^>]*)/u.exec(raw)?.[1] ?? ''; const array = /<Array\s+as="points"[^>]*>([\s\S]*?)<\/Array>/u.exec(raw); const points = array ? [...array[1].matchAll(/<mxPoint\b([^>]*)/gu)].map(([, point]) => attributes(`<mxPoint ${point}>`)) : []; return {raw, attributes: attributes(open), geometry: attributes(`<mxGeometry ${geometry}>`), points, hasPointsArray: Boolean(array), misplacedPoints: [...raw.matchAll(/<mxPoint\b/g)].length - points.length, label: decodeXmlText(attributes(open).get('value') ?? '')}; }); return {cells, nodes: cells.filter(({attributes: item}) => item.get('vertex') === '1'), edges: cells.filter(({attributes: item}) => item.get('edge') === '1')}; }
export function parseSvg(source) { const elements = []; const stack = []; for (const match of source.matchAll(/<\/?([A-Za-z][\w:.-]*)\b([^>]*)>/gu)) { const closing = match[0].startsWith('</'); if (closing) { const element = stack.pop(); assert.equal(element?.name, match[1], `balanced SVG element ${match[1]}`); element.closeIndex = match.index; continue; } const element = {name: match[1], attributes: attributes(match[2]), parent: stack.at(-1) ?? null, index: elements.length, sourceIndex: match.index, openEnd: match.index + match[0].length, closeIndex: match.index + match[0].length}; elements.push(element); if (!match[0].endsWith('/>')) stack.push(element); } assert.equal(stack.length, 0, 'balanced SVG tree'); return {elements, nodes: elements.filter(({attributes: item}) => item.has('data-node-id')), edges: elements.filter(({name, attributes: item}) => name === 'path' && item.has('data-edge-id'))}; }
export function assertFlattenedSvg(elements) { for (const element of elements) assert.equal(element.attributes.has('transform'), false, `flattened SVG geometry: <${element.name}> has no transform`); }
function number(value, label) { const result = Number.parseFloat(value); assert.ok(Number.isFinite(result), label); return result; }
function numericBounds(attributesMap, label) { const result = Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, number(attributesMap.get(key), `${label} ${key}`)])); assert.ok(result.width >= 0 && result.height >= 0, `${label} nonnegative size`); return {...result, left: result.x, top: result.y, right: result.x + result.width, bottom: result.y + result.height}; }
export function parsePathPoints(data) { assert.doesNotMatch(data ?? '', /[CQSAZ]/iu, 'connector path uses only M/L/H/V'); const tokens = data.match(/[A-Za-z]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []; const points = []; let cursor = 0; let command; let current = {x: 0, y: 0}; while (cursor < tokens.length) { if (/^[A-Za-z]$/u.test(tokens[cursor])) command = tokens[cursor++]; const relative = command === command?.toLowerCase(); const take = () => number(tokens[cursor++], 'path coordinate'); if (command?.toUpperCase() === 'M' || command?.toUpperCase() === 'L') { const x = take(); const y = take(); current = {x: relative ? current.x + x : x, y: relative ? current.y + y : y}; points.push(current); if (command?.toUpperCase() === 'M') command = relative ? 'l' : 'L'; } else if (command?.toUpperCase() === 'H') { const x = take(); current = {x: relative ? current.x + x : x, y: current.y}; points.push(current); } else if (command?.toUpperCase() === 'V') { const y = take(); current = {x: current.x, y: relative ? current.y + y : y}; points.push(current); } else assert.fail(`unsupported path command ${command}`); } assert.ok(points.length >= 2, 'visible connector path'); return points; }
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
function terminalPoint(node, edge, side, nodeById) { const box = absoluteDrawioBounds(node, nodeById); const style = styleMap(edge.attributes.get('style')); for (const key of [`${side}X`, `${side}Y`, `${side}Dx`, `${side}Dy`, `${side}Perimeter`]) assert.ok(style.has(key), `${edge.attributes.get('id')} ${key}`); assert.equal(style.get(`${side}Dx`), '0', 'terminal dx'); assert.equal(style.get(`${side}Dy`), '0', 'terminal dy'); assert.equal(style.get(`${side}Perimeter`), '1', 'terminal perimeter'); const x = number(style.get(`${side}X`), 'normalized terminal x'); const y = number(style.get(`${side}Y`), 'normalized terminal y'); assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1 && (x === 0 || x === 1 || y === 0 || y === 1), 'normalized terminal on perimeter'); return {x: box.x + box.width * x, y: box.y + box.height * y}; }
export function drawioRoute(edge, nodeById) { const source = nodeById.get(edge.attributes.get('source')); const target = nodeById.get(edge.attributes.get('target')); assert.ok(source && target, `${edge.attributes.get('id')} real terminals`); assert.ok(edge.hasPointsArray, `${edge.attributes.get('id')} waypoint array`); assert.ok(edge.points.length > 0, `${edge.attributes.get('id')} explicit waypoint`); assert.equal(edge.misplacedPoints, 0, `${edge.attributes.get('id')} points only in waypoint array`); assert.equal(edge.points.some((point) => ['sourcePoint', 'targetPoint'].includes(point.get('as'))), false, `${edge.attributes.get('id')} no fallback points`); return [terminalPoint(source, edge, 'exit', nodeById), ...edge.points.map((point) => ({x: number(point.get('x'), 'waypoint x'), y: number(point.get('y'), 'waypoint y')})), terminalPoint(target, edge, 'entry', nodeById)]; }
export function glyphBox({x, y, text, fontSize, anchor = 'start'}) { const width = [...text].reduce((total, character) => total + (/^[\u0000-\u00ff]$/u.test(character) ? .64 : 1), 0) * fontSize; const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x; return {left, right: left + width, top: y - fontSize * .82, bottom: y + fontSize * .22}; }
export function alphaCompose(backdrop, foreground) { const alpha = foreground.alpha + backdrop.alpha * (1 - foreground.alpha); if (alpha === 0) return {red: 0, green: 0, blue: 0, alpha: 0}; return {red: (foreground.red * foreground.alpha + backdrop.red * backdrop.alpha * (1 - foreground.alpha)) / alpha, green: (foreground.green * foreground.alpha + backdrop.green * backdrop.alpha * (1 - foreground.alpha)) / alpha, blue: (foreground.blue * foreground.alpha + backdrop.blue * backdrop.alpha * (1 - foreground.alpha)) / alpha, alpha}; }
function close(left, right, label) { assert.ok(Math.abs(left - right) < .01, `${label}: ${left} !== ${right}`); }
export function markerEnvelope(endpoint, previous, {width, height, refX, refY, viewBox = [0, 0, width, height], pathBounds = {left: viewBox[0], top: viewBox[1], right: viewBox[0] + viewBox[2], bottom: viewBox[1] + viewBox[3]}, preserveAspectRatio = 'xMidYMid meet'}) { const dx = endpoint.x - previous.x; const dy = endpoint.y - previous.y; const length = Math.hypot(dx, dy); assert.ok(length > 0, 'marker terminal direction'); const [, , viewWidth, viewHeight] = viewBox; assert.ok(viewWidth > 0 && viewHeight > 0 && width > 0 && height > 0, 'positive marker viewport and viewBox'); const unit = {x: dx / length, y: dy / length}; const normal = {x: -unit.y, y: unit.x}; const [scaleX, scaleY] = preserveAspectRatio === 'none' ? [width / viewWidth, height / viewHeight] : (assert.equal(preserveAspectRatio, 'xMidYMid meet', 'supported marker preserveAspectRatio'), close(width / viewWidth, height / viewHeight, 'meet marker aspect ratio'), [width / viewWidth, height / viewHeight]); const points = [[pathBounds.left, pathBounds.top], [pathBounds.right, pathBounds.top], [pathBounds.right, pathBounds.bottom], [pathBounds.left, pathBounds.bottom]].map(([x, y]) => ({x: endpoint.x + unit.x * (x - refX) * scaleX + normal.x * (y - refY) * scaleY, y: endpoint.y + unit.y * (x - refX) * scaleX + normal.y * (y - refY) * scaleY})); return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function assertExactDuplicateFreeIds(actual, expected, label) { assert.equal(new Set(actual).size, actual.length, `${label} identities are duplicate-free`); assert.deepEqual([...actual].sort(), [...expected].sort(), `${label} exact identity set`); }

function hiddenDrawioCell(cell) {
  const style = styleMap(cell.attributes.get('style'));
  return cell.attributes.get('visible') === '0' || style.get('visible') === '0' || style.get('opacity') === '0';
}

function hiddenSvgElement(source, element) {
  const opacity = number(svgPresentationValue(source, element, 'opacity') ?? '1', 'SVG opacity');
  const paintIsTransparent = (value) => value === undefined || /^(?:none|transparent)$/iu.test(value.trim()) || /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/iu.test(value.trim()) || /^hsla\([^)]*,\s*0(?:\.0+)?\s*\)$/iu.test(value.trim()) || /^#[\da-f]{6}00$/iu.test(value.trim()) || /^#[\da-f]{3}0$/iu.test(value.trim());
  const painted = (property) => !paintIsTransparent(svgPresentationValue(source, element, property)) && number(svgPresentationValue(source, element, `${property}-opacity`) ?? '1', `${property} opacity`) * opacity > 0;
  const hasVisiblePaint = element.name === 'path' && element.attributes.has('data-edge-id')
    ? painted('stroke') && number(svgPresentationValue(source, element, 'stroke-width') ?? '1', 'stroke width') > 0
    : painted('fill') || painted('stroke') && number(svgPresentationValue(source, element, 'stroke-width') ?? '1', 'stroke width') > 0;
  return element.attributes.get('aria-hidden') === 'true'
    || svgPresentationValue(source, element, 'display') === 'none'
    || ['hidden', 'collapse'].includes(svgPresentationValue(source, element, 'visibility'))
    || opacity === 0
    || !hasVisiblePaint;
}

function logicalDrawioNodeId(value) { return value?.replace(/^node-/u, ''); }
function assertRoutesClose(actual, expected, label) { assert.equal(actual.length, expected.length, `${label} point count`); for (let index = 0; index < actual.length; index += 1) { assert.ok(Math.abs(actual[index].x - expected[index].x) <= .01, `${label} point ${index} x`); assert.ok(Math.abs(actual[index].y - expected[index].y) <= .01, `${label} point ${index} y`); } }
function elementText(source, element) { return decodeXmlText(source.slice(element.openEnd, element.closeIndex).replace(/<[^>]+>/gu, '').trim()); }

function positiveCollinearOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  if (leftStart.x === leftEnd.x && rightStart.x === rightEnd.x && leftStart.x === rightStart.x) return Math.min(Math.max(leftStart.y, leftEnd.y), Math.max(rightStart.y, rightEnd.y)) - Math.max(Math.min(leftStart.y, leftEnd.y), Math.min(rightStart.y, rightEnd.y));
  if (leftStart.y === leftEnd.y && rightStart.y === rightEnd.y && leftStart.y === rightStart.y) return Math.min(Math.max(leftStart.x, leftEnd.x), Math.max(rightStart.x, rightEnd.x)) - Math.max(Math.min(leftStart.x, leftEnd.x), Math.min(rightStart.x, rightEnd.x));
  return 0;
}

function perpendicularIntersection(leftStart, leftEnd, rightStart, rightEnd) {
  const leftVertical = leftStart.x === leftEnd.x; const rightVertical = rightStart.x === rightEnd.x;
  if (leftVertical === rightVertical) return undefined;
  const vertical = leftVertical ? [leftStart, leftEnd] : [rightStart, rightEnd];
  const horizontal = leftVertical ? [rightStart, rightEnd] : [leftStart, leftEnd];
  const point = {x: vertical[0].x, y: horizontal[0].y};
  return point.y >= Math.min(vertical[0].y, vertical[1].y) && point.y <= Math.max(vertical[0].y, vertical[1].y)
    && point.x >= Math.min(horizontal[0].x, horizontal[1].x) && point.x <= Math.max(horizontal[0].x, horizontal[1].x) ? point : undefined;
}

function expandedBox(box, amount) { return {left: box.left - amount, right: box.right + amount, top: box.top - amount, bottom: box.bottom + amount}; }
function boxDistance(left, right) { const dx = Math.max(0, left.left - right.right, right.left - left.right); const dy = Math.max(0, left.top - right.bottom, right.top - left.bottom); return Math.hypot(dx, dy); }
function segmentEnvelope(start, end, halfStroke) { return expandedBox({left: Math.min(start.x, end.x), right: Math.max(start.x, end.x), top: Math.min(start.y, end.y), bottom: Math.max(start.y, end.y)}, halfStroke); }
function boundsAttribute(element, attribute, label) { const values = element.attributes.get(attribute).split(/\s+/u); return numericBounds(new Map(['x', 'y', 'width', 'height'].map((key, index) => [key, values[index]])), label); }

function markerPathBounds(svg, marker) {
  const child = marker && svg.elements.find((element) => element.parent === marker && element.name === 'path');
  assert.ok(child, `${marker?.attributes.get('id')} marker path`);
  const coordinates = [...(child.attributes.get('d') ?? '').matchAll(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu)].map(([value]) => Number(value));
  assert.ok(coordinates.length >= 4 && coordinates.length % 2 === 0, `${marker.attributes.get('id')} marker coordinate pairs`);
  const points = Array.from({length: coordinates.length / 2}, (_, index) => ({x: coordinates[index * 2], y: coordinates[index * 2 + 1]}));
  return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))};
}

function transformedMarkerBox(svgSource, svg, edge) {
  const markerId = /url\(#([^)]+)\)/u.exec(svgPresentationValue(svgSource, edge, 'marker-end') ?? '')?.[1];
  const marker = svg.elements.find((element) => element.name === 'marker' && element.attributes.get('id') === markerId);
  assert.ok(marker, `${edge.attributes.get('data-edge-id')} marker definition`);
  const points = parsePathPoints(edge.attributes.get('d')); const endpoint = points.at(-1); const previous = points.at(-2);
  const strokeWidth = number(svgPresentationValue(svgSource, edge, 'stroke-width'), `${edge.attributes.get('data-edge-id')} stroke width`);
  const units = marker.attributes.get('markerUnits') ?? 'strokeWidth'; const unitScale = units === 'strokeWidth' ? strokeWidth : (assert.equal(units, 'userSpaceOnUse', 'supported marker units'), 1);
  const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.equal(viewBox.length, 4, `${markerId} marker viewBox`);
  return markerEnvelope(endpoint, previous, {
    width: number(marker.attributes.get('markerWidth'), `${markerId} width`) * unitScale,
    height: number(marker.attributes.get('markerHeight'), `${markerId} height`) * unitScale,
    refX: number(marker.attributes.get('refX'), `${markerId} refX`), refY: number(marker.attributes.get('refY'), `${markerId} refY`),
    viewBox, pathBounds: markerPathBounds(svg, marker), preserveAspectRatio: marker.attributes.get('preserveAspectRatio') ?? 'xMidYMid meet',
  });
}

function segmentCrossesBox(start, end, box) {
  if (start.x === end.x) return start.x > box.left && start.x < box.right && Math.max(Math.min(start.y, end.y), box.top) < Math.min(Math.max(start.y, end.y), box.bottom);
  if (start.y === end.y) return start.y > box.top && start.y < box.bottom && Math.max(Math.min(start.x, end.x), box.left) < Math.min(Math.max(start.x, end.x), box.right);
  assert.fail('semantic connectors must remain orthogonal');
}

function assertRenderedGeometry(svgSource, svg) {
  const scale = 800 / 2400;
  const nodeMetrics = [];
  const edgeLabelMetrics = [];
  const regionBounds = new Map(svg.elements.filter(({attributes}) => attributes.has('data-region-bounds')).map((region) => [region.attributes.get('data-region-id'), numericBounds(new Map(['x', 'y', 'width', 'height'].map((key, index) => [key, region.attributes.get('data-region-bounds').split(/\s+/u)[index]])), region.attributes.get('data-region-id'))]));
  const nodeBounds = new Map();
  for (const node of svg.nodes) {
    const id = node.attributes.get('data-node-id'); const shape = svg.elements.find((element) => element.parent === node && element.attributes.get('data-node-shape-for') === id);
    assert.ok(shape && shape.name === 'rect', `${id} actual node rectangle`);
    const box = numericBounds(shape.attributes, id); const halfStroke = number(svgPresentationValue(svgSource, shape, 'stroke-width'), `${id} stroke width`) / 2;
    nodeBounds.set(id, expandedBox(box, halfStroke));
    const region = regionBounds.get(node.parent.attributes.get('data-region-id'));
    const regionClearance = Math.min(box.left - region.left, region.right - box.right, box.top - region.top, region.bottom - box.bottom) * scale;
    assert.ok(regionClearance >= 12, `${id} >= 12px node-to-region clearance`);
    const title = svg.elements.find((element) => element.parent === node && element.attributes.get('data-node-title-for') === id);
    const type = svg.elements.find((element) => element.parent === node && element.attributes.get('data-node-type-for') === id);
    assert.ok(title && type, `${id} title/type pair`);
    const titleFont = number(svgPresentationValue(svgSource, title, 'font-size'), `${id} title font`);
    const typeFont = number(svgPresentationValue(svgSource, type, 'font-size'), `${id} type font`);
    assert.ok(titleFont * scale >= 15 && typeFont * scale >= 10, `${id} rendered fonts >= 15px / 10px`);
    const titleBox = glyphBox({x: number(title.attributes.get('x'), `${id} title x`), y: number(title.attributes.get('y'), `${id} title y`), text: elementText(svgSource, title), fontSize: titleFont, anchor: title.attributes.get('text-anchor')});
    const typeBox = glyphBox({x: number(type.attributes.get('x'), `${id} type x`), y: number(type.attributes.get('y'), `${id} type y`), text: elementText(svgSource, type), fontSize: typeFont, anchor: type.attributes.get('text-anchor')});
    const horizontalTitlePadding = Math.min(titleBox.left - box.left, box.right - titleBox.right) * scale;
    const titleTopPadding = (titleBox.top - box.top) * scale;
    const baselineGap = (number(type.attributes.get('y'), `${id} type baseline`) - number(title.attributes.get('y'), `${id} title baseline`)) * scale;
    const textBottomClearance = (box.bottom - typeBox.bottom) * scale;
    assert.ok(horizontalTitlePadding >= 16, `${id} >= 16px horizontal title padding`);
    assert.ok(titleTopPadding >= 14, `${id} >= 14px title top padding`);
    assert.ok(baselineGap >= 22, `${id} >= 22px title/type baseline gap`);
    assert.ok(textBottomClearance >= 14, `${id} >= 14px text bottom clearance`);
    nodeMetrics.push({id, regionClearance, horizontalTitlePadding, titleTopPadding, baselineGap, textBottomClearance});
  }
  const segments = svg.edges.flatMap((edge) => { const points = parsePathPoints(edge.attributes.get('d')); const halfStroke = number(svgPresentationValue(svgSource, edge, 'stroke-width'), `${edge.attributes.get('data-edge-id')} stroke width`) / 2; return points.slice(1).map((end, index) => ({id: edge.attributes.get('data-edge-id'), source: edge.attributes.get('data-source'), target: edge.attributes.get('data-target'), start: points[index], end, envelope: segmentEnvelope(points[index], end, halfStroke)})); });
  for (const segment of segments) for (const [id, box] of nodeBounds) if (![segment.source, segment.target].includes(id)) assert.equal(segmentCrossesBox(segment.start, segment.end, box), false, `${segment.id} does not cross unrelated ${id}`);
  for (let left = 0; left < segments.length; left += 1) for (let right = left + 1; right < segments.length; right += 1) if (segments[left].id !== segments[right].id) {
    assert.ok(positiveCollinearOverlap(segments[left].start, segments[left].end, segments[right].start, segments[right].end) <= 0, `${segments[left].id}/${segments[right].id} no positive collinear overlap`);
    assert.equal(perpendicularIntersection(segments[left].start, segments[left].end, segments[right].start, segments[right].end), undefined, `${segments[left].id}/${segments[right].id} no perpendicular intersection`);
  }
  const glyphBounds = (element, label) => {
    const runs = svg.elements.filter((candidate) => candidate.parent === element && candidate.name === 'tspan');
    const boxes = (runs.length ? runs : [element]).map((run, index) => glyphBox({x: number(run.attributes.get('x') ?? element.attributes.get('x'), `${label} run ${index} x`), y: number(run.attributes.get('y') ?? element.attributes.get('y'), `${label} run ${index} y`), text: elementText(svgSource, run), fontSize: number(svgPresentationValue(svgSource, run, 'font-size') ?? svgPresentationValue(svgSource, element, 'font-size'), `${label} run ${index} font`), anchor: run.attributes.get('text-anchor') ?? element.attributes.get('text-anchor')}));
    return {left: Math.min(...boxes.map(({left}) => left)), right: Math.max(...boxes.map(({right}) => right)), top: Math.min(...boxes.map(({top}) => top)), bottom: Math.max(...boxes.map(({bottom}) => bottom))};
  };
  const protectedText = svg.elements.filter((element) => element.name === 'text' && ['data-node-title-for', 'data-node-type-for', 'data-region-label-for', 'data-note-text-for'].some((attribute) => element.attributes.has(attribute)));
  for (const textElement of protectedText) {
    const identity = ['data-node-title-for', 'data-node-type-for', 'data-region-label-for', 'data-note-text-for'].map((attribute) => textElement.attributes.get(attribute)).find(Boolean);
    const box = glyphBounds(textElement, identity);
    for (const segment of segments) assert.ok(boxDistance(box, segment.envelope) * scale >= 8, `${segment.id} clears protected text ${identity} by 8px`);
  }
  const regionLabels = new Map(svg.elements.filter((element) => element.name === 'text' && element.attributes.has('data-region-label-for')).map((element) => [element.attributes.get('data-region-label-for'), glyphBounds(element, element.attributes.get('data-region-label-for'))]));
  const noteBoxes = svg.elements.filter(({attributes}) => attributes.has('data-note-id')).map((group) => { const id = group.attributes.get('data-note-id'); const shape = svg.elements.find((element) => element.parent === group && element.name === 'rect'); assert.ok(shape, `${id} note rectangle`); return [id, expandedBox(numericBounds(shape.attributes, id), number(svgPresentationValue(svgSource, shape, 'stroke-width'), `${id} stroke width`) / 2)]; });
  for (const [id, noteBox] of noteBoxes) {
    for (const [nodeId, nodeBox] of nodeBounds) assert.ok(boxDistance(noteBox, nodeBox) > 0, `${id} does not overlap ${nodeId}`);
    for (const [regionId, labelBox] of regionLabels) assert.ok(boxDistance(noteBox, labelBox) > 0, `${id} does not overlap region label ${regionId}`);
  }
  for (let left = 0; left < noteBoxes.length; left += 1) for (let right = left + 1; right < noteBoxes.length; right += 1) assert.ok(boxDistance(noteBoxes[left][1], noteBoxes[right][1]) > 0, `${noteBoxes[left][0]}/${noteBoxes[right][0]} notes do not overlap`);
  for (const [regionId, labelBox] of regionLabels) for (const [nodeId, nodeBox] of nodeBounds) assert.ok(boxDistance(labelBox, nodeBox) > 0, `${regionId} label does not overlap ${nodeId}`);

  const labelElements = svg.elements.filter((element) => element.name === 'text' && element.attributes.has('data-edge-label-for'));
  assertExactDuplicateFreeIds(labelElements.map(({attributes}) => attributes.get('data-edge-label-for')), EDGE_IDS, 'SVG edge labels');
  const markerBoxes = svg.edges.map((edge) => [edge.attributes.get('data-edge-id'), transformedMarkerBox(svgSource, svg, edge)]);
  for (const labelElement of labelElements) {
    const id = labelElement.attributes.get('data-edge-label-for'); const labelBox = glyphBounds(labelElement, `${id} edge label`);
    assert.ok(number(svgPresentationValue(svgSource, labelElement, 'font-size'), `${id} label font`) * scale >= 15, `${id} rendered label font >= 15px`);
    const [nearestStrokeId, strokeDistance] = segments.map(({id: edgeId, envelope}) => [edgeId, boxDistance(labelBox, envelope)]).sort((left, right) => left[1] - right[1])[0];
    const [nearestMarkerId, markerDistance] = markerBoxes.map(([edgeId, box]) => [edgeId, boxDistance(labelBox, box)]).sort((left, right) => left[1] - right[1])[0];
    const [nearestNodeId, nodeDistance] = [...nodeBounds].map(([nodeId, box]) => [nodeId, boxDistance(labelBox, box)]).sort((left, right) => left[1] - right[1])[0];
    const strokeClearance = strokeDistance * scale; const markerClearance = markerDistance * scale; const nodeClearance = nodeDistance * scale;
    assert.ok(strokeClearance >= 8, `${id} visible glyph-to-stroke clearance ${strokeClearance}px >= 8px (nearest ${nearestStrokeId}; glyph ${JSON.stringify(labelBox)}; envelope ${JSON.stringify(segments.find(({id: edgeId, envelope}) => edgeId === nearestStrokeId && boxDistance(labelBox, envelope) === strokeDistance)?.envelope)})`);
    assert.ok(markerClearance >= 16, `${id} visible glyph-to-marker clearance ${markerClearance}px >= 16px (nearest ${nearestMarkerId})`);
    assert.ok(nodeClearance >= 12, `${id} visible glyph-to-node clearance ${nodeClearance}px >= 12px (nearest ${nearestNodeId})`);
    edgeLabelMetrics.push({id, strokeClearance, markerClearance, nodeClearance, nearestStrokeId, nearestMarkerId, nearestNodeId});
  }
  assert.ok(svg.edges.every((edge) => edge.index > Math.max(...svg.nodes.map(({index}) => index))), 'semantic routes paint after nodes; no later node mask can erase a route');
  const rolePatterns = new Map();
  for (const role of LEGEND_ROLES) { const representative = svg.edges.find(({attributes}) => attributes.get('data-edge-role') === role); assert.ok(representative, `${role} representative edge`); rolePatterns.set(role, `${representative.attributes.get('stroke-dasharray') ?? 'solid'}|${representative.attributes.get('marker-end')}`); }
  assert.equal(new Set(rolePatterns.values()).size, LEGEND_ROLES.length, 'line patterns and markers encode all roles without color');
  for (const role of LEGEND_ROLES) { const caption = svg.elements.find(({attributes}) => attributes.get('data-legend-caption-for') === role); const marker = svg.elements.find(({attributes}) => attributes.get('data-legend-role') === role); const captionFont = number(svgPresentationValue(svgSource, caption, 'font-size'), `${role} caption font`); assert.ok(captionFont * scale >= 10, `${role} rendered legend caption >= 10px`); const captionBox = glyphBox({x: number(caption.attributes.get('x'), `${role} caption x`), y: number(caption.attributes.get('y'), `${role} caption y`), text: elementText(svgSource, caption), fontSize: captionFont, anchor: caption.attributes.get('text-anchor')}); const path = parsePathPoints(marker.attributes.get('d')); const markerBox = transformedMarkerBox(svgSource, svg, {...marker, attributes: new Map([...marker.attributes, ['marker-end', marker.attributes.get('marker-end')]])}); const swatchSegments = path.slice(1).map((end, index) => segmentEnvelope(path[index], end, number(svgPresentationValue(svgSource, marker, 'stroke-width'), `${role} legend stroke width`) / 2)); assert.ok(boxDistance(captionBox, markerBox) * scale >= 16, `${role} caption-to-marker clearance >= 16px`); assert.ok(Math.min(...swatchSegments.map((box) => boxDistance(captionBox, box))) * scale >= 8, `${role} caption-to-swatch clearance >= 8px`); }
  if (process.env.STY12_GEOMETRY_REPORT === '1') console.log(`STY12_GEOMETRY ${JSON.stringify({nodeMetrics, edgeLabelMetrics})}`);
}

function assertEdgeInventory(drawio, svg, svgSource) {
  assert.equal(EDGE_CONTRACTS.length, EDGE_IDS.length, 'one endpoint/role contract per edge identity');
  assertExactDuplicateFreeIds(EDGE_CONTRACTS.map(([id]) => id), EDGE_IDS, 'edge contracts');
  const drawioEdges = drawio.edges.filter(({attributes}) => EDGE_IDS.includes(attributes.get('id')));
  assertExactDuplicateFreeIds(drawioEdges.map(({attributes}) => attributes.get('id')), EDGE_IDS, 'Draw.io semantic edges');
  assertExactDuplicateFreeIds(svg.edges.map(({attributes}) => attributes.get('data-edge-id')), EDGE_IDS, 'SVG semantic edges');
  const drawioById = new Map(drawioEdges.map((edge) => [edge.attributes.get('id'), edge]));
  const svgById = new Map(svg.edges.map((edge) => [edge.attributes.get('data-edge-id'), edge]));
  const svgLabels = svg.elements.filter((element) => element.name === 'text' && element.attributes.has('data-edge-label-for'));
  assertExactDuplicateFreeIds(svgLabels.map(({attributes}) => attributes.get('data-edge-label-for')), EDGE_IDS, 'SVG visible edge labels');
  const svgLabelById = new Map(svgLabels.map((element) => [element.attributes.get('data-edge-label-for'), element]));
  const nodeById = new Map(drawio.nodes.map((node) => [node.attributes.get('id'), node]));
  for (const [id, source, target, role, label] of EDGE_CONTRACTS) {
    const drawioEdge = drawioById.get(id); const svgEdge = svgById.get(id);
    assert.ok(drawioEdge && svgEdge, `${id} paired edge`);
    assert.equal(hiddenDrawioCell(drawioEdge), false, `${id} Draw.io edge visible`);
    assert.equal(hiddenSvgElement(svgSource, svgEdge), false, `${id} SVG edge visible`);
    assert.deepEqual([
      logicalDrawioNodeId(drawioEdge.attributes.get('source')),
      logicalDrawioNodeId(drawioEdge.attributes.get('target')),
      styleMap(drawioEdge.attributes.get('style')).get('semanticRole'), drawioEdge.label,
    ], [source, target, role, label], `${id} Draw.io endpoint/role/label contract`);
    assert.deepEqual([
      svgEdge.attributes.get('data-source'), svgEdge.attributes.get('data-target'),
      svgEdge.attributes.get('data-edge-role'),
    ], [source, target, role], `${id} SVG endpoint/role contract`);
    const svgLabel = svgLabelById.get(id); assert.ok(svgLabel && !hiddenSvgElement(svgSource, svgLabel), `${id} visible SVG label`);
    assert.equal(elementText(svgSource, svgLabel), label, `${id} exact visible SVG label text`);
    const drawioRoutePoints = drawioRoute(drawioEdge, nodeById);
    const svgRoutePoints = parsePathPoints(svgEdge.attributes.get('d'));
    assertRoutesClose(svgRoutePoints, drawioRoutePoints, `${id} synchronized orthogonal route`);
  }
}

function assertLegendGeometry(drawio, svg) {
  const nodeById = new Map(drawio.nodes.map((node) => [node.attributes.get('id'), node]));
  const terminalIds = LEGEND_ROLES.flatMap((role) => [`legend-terminal-${role}-start`, `legend-terminal-${role}-end`]);
  assertExactDuplicateFreeIds(drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'legend-terminal').map(({attributes}) => attributes.get('id')), terminalIds, 'Draw.io legend terminals');
  for (const role of LEGEND_ROLES) {
    const edge = drawio.edges.find(({attributes}) => attributes.get('id') === `legend-edge-${role}`);
    const swatch = svg.elements.find(({attributes}) => attributes.get('data-legend-role') === role);
    assert.ok(edge && swatch, `${role} synchronized legend swatch`);
    assert.equal(edge.attributes.get('source'), `legend-terminal-${role}-start`, `${role} standalone legend source`);
    assert.equal(edge.attributes.get('target'), `legend-terminal-${role}-end`, `${role} standalone legend target`);
    assert.notEqual(edge.attributes.get('source'), edge.attributes.get('target'), `${role} legend is not a self-loop`);
    assert.equal(styleMap(edge.attributes.get('style')).get('semanticRole'), role, `${role} Draw.io legend role`);
    assertRoutesClose(drawioRoute(edge, nodeById), parsePathPoints(swatch.attributes.get('d')), `${role} synchronized legend geometry`);
  }
}

function assertHiddenRouteMutationGuards(svgSource) {
  const mutations = [
    ['stroke none', (source) => source.replace(/(<path\b[^>]*data-edge-id="catalog-release"[^>]*\bstroke=")[^"]+/u, '$1none')],
    ['transparent stroke', (source) => source.replace(/(<path\b[^>]*data-edge-id="catalog-release"[^>]*\bstroke=")[^"]+/u, '$1transparent')],
    ['zero stroke width', (source) => source.replace(/(<path\b[^>]*data-edge-id="catalog-release"[^>]*\bstroke-width=")[^"]+/u, '$10')],
    ['zero stroke opacity', (source) => source.replace(/(<path\b[^>]*data-edge-id="catalog-release")/u, '$1 stroke-opacity="0"')],
    ['inherited zero stroke opacity', (source) => source.replace(/(<g\b[^>]*data-edge-layer="semantic-routes")/u, '$1 stroke-opacity="0"')],
  ];
  for (const [label, mutate] of mutations) {
    const changed = mutate(svgSource); assert.notEqual(changed, svgSource, `${label} mutation applies`);
    const parsed = parseSvg(changed); const edge = parsed.edges.find(({attributes}) => attributes.get('data-edge-id') === 'catalog-release');
    assert.equal(hiddenSvgElement(changed, edge), true, `${label} hides semantic route`);
  }
}

function assertDirectRegionChildren(drawio, svg) {
  const drawioRegionIds = new Set(REGION_IDS);
  for (const node of drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'node-shape')) {
    assert.ok(drawioRegionIds.has(node.attributes.get('parent')), `${node.attributes.get('id')} direct Draw.io region child`);
  }
  for (const node of svg.nodes) {
    assert.ok(node.parent?.attributes.has('data-region-id'), `${node.attributes.get('data-node-id')} direct SVG region child`);
    assert.ok(REGION_IDS.includes(node.parent.attributes.get('data-region-id')), `${node.attributes.get('data-node-id')} declared SVG region`);
  }
}

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

function assertMicroFrontendSourcePolicy(ledger) {
  const source = ledger.sources.find(({id}) => id === 'src-whatwg-html-import-maps');
  assert.ok(source, 'WHATWG import-map source');
  assert.deepEqual({canonical_locator: source.canonical_locator, transport_locator: source.transport_locator, license: source.license, copyright_policy: source.copyright_policy}, {
    canonical_locator: 'https://html.spec.whatwg.org/multipage/webappapis.html',
    transport_locator: 'https://html.spec.whatwg.org/multipage/webappapis.html',
    license: 'CC-BY-4.0',
    copyright_policy: 'adapt-with-attribution',
  }, 'WHATWG fragment-free locator and schema-compatible license policy');
  const citations = ledger.documents?.[ARTICLE]?.citations;
  assert.ok(citations, 'STY-12 governed citations');
  const citation = citations.find(({source_id}) => source_id === source.id);
  assert.equal(citation?.citation_url, 'https://html.spec.whatwg.org/multipage/webappapis.html#import-maps', 'article citation retains the import-map fragment');
  assert.ok(citations.every(({excerpt, quotation_reviewed}) => excerpt === null && quotation_reviewed === false), 'STY-12 uses no quotation excerpts');
}

function assertMicroFrontendDiagram(drawioSource, svgSource) {
  const drawio = parseDrawio(drawioSource); const svg = parseSvg(svgSource); assertFlattenedSvg(svg.elements);
  const root = svg.elements.find(({name}) => name === 'svg');
  assert.equal(root?.attributes.get('viewBox'), '0 0 2400 3600', 'exact 2400 × 3600 viewBox');
  assert.equal(root?.attributes.has('height'), false, 'no fixed rendered SVG height');
  assert.equal(root?.attributes.get('width'), '100%', 'exact responsive SVG root width');
  assert.equal(root?.attributes.get('role'), 'img', 'accessible SVG role');
  assert.equal(root?.attributes.get('aria-labelledby'), 'sty12-title sty12-desc', 'accessible SVG labelling');
  assert.match(svgSource, /<title id="sty12-title">Micro-Frontend 电商运行时、发布与权威状态边界<\/title>/u);
  assert.match(svgSource, /<desc id="sty12-desc">四条独立流水线生成不可变制品，兼容门禁产生完整版本化清单并原子提升；薄 Shell 在共享浏览器环境加载商品、购物车、结算和账户切片，稳定标识连接权威后端，失败只降级对应槽位并可回退整份清单。<\/desc>/u);
  assert.doesNotMatch(svgSource, /<(?:foreignObject|image|script)\b|@font-face|Logo|logo|watermark|水印/iu, 'no embedded HTML, image, script, external font, logo, or watermark');
  assertExactDuplicateFreeIds(drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'region').map(({attributes}) => attributes.get('id')), REGION_IDS, 'Draw.io regions');
  assertExactDuplicateFreeIds(svg.elements.filter(({attributes}) => attributes.has('data-region-id')).map(({attributes}) => attributes.get('data-region-id')), REGION_IDS, 'SVG regions');
  assertExactDuplicateFreeIds(drawio.nodes.filter(({attributes}) => styleMap(attributes.get('style')).get('semanticRole') === 'node-shape').map(({attributes}) => attributes.get('id').replace(/^node-/u, '')), NODE_IDS, 'Draw.io nodes');
  assertExactDuplicateFreeIds(svg.nodes.map(({attributes}) => attributes.get('data-node-id')), NODE_IDS, 'SVG nodes');
  assertExactDuplicateFreeIds(drawio.edges.filter(({attributes}) => attributes.get('id')?.startsWith('legend-edge-')).map(({attributes}) => attributes.get('id')), LEGEND_ROLES.map((role) => `legend-edge-${role}`), 'Draw.io legend edges');
  assertExactDuplicateFreeIds(svg.elements.filter(({attributes}) => attributes.has('data-legend-role')).map(({attributes}) => attributes.get('data-legend-role')), LEGEND_ROLES, 'SVG legend roles');
  assertLegendGeometry(drawio, svg);
  const drawioNotes = drawio.nodes.filter(({attributes}) => attributes.get('id')?.startsWith('note-text-'));
  const svgNotes = svg.elements.filter(({attributes}) => attributes.has('data-note-text-for'));
  assertExactDuplicateFreeIds(drawioNotes.map(({attributes}) => attributes.get('id').replace(/^note-text-/u, '')), Object.keys(NOTE_COPY), 'Draw.io notes');
  assertExactDuplicateFreeIds(svgNotes.map(({attributes}) => attributes.get('data-note-text-for')), Object.keys(NOTE_COPY), 'SVG notes');
  for (const [id, copy] of Object.entries(NOTE_COPY)) { assert.equal(drawioNotes.find(({attributes}) => attributes.get('id') === `note-text-${id}`)?.label, copy, `${id} exact Draw.io note`); const svgNote = svgNotes.find(({attributes}) => attributes.get('data-note-text-for') === id); assert.ok(svgNote && !hiddenSvgElement(svgSource, svgNote), `${id} visible SVG note`); assert.equal(elementText(svgSource, svgNote), copy, `${id} exact visible SVG note`); }
  assertHiddenRouteMutationGuards(svgSource);
  assertDirectRegionChildren(drawio, svg);
  assertEdgeInventory(drawio, svg, svgSource);
  assertRenderedGeometry(svgSource, svg);
}

function fixtureArticle() {
  const sections = EXPECTED_HEADINGS.map((heading) => '## ' + heading + (heading === '可迁移经验' ? '\n### ' + MIGRATION_HEADINGS.join('\n### ') : '')).join('\n');
  const rows = (items) => items.map((row) => '| ' + row.join(' | ') + ' |').join('\n');
  return `---\n${frontMatterFixture(EXACT_METADATA)}\n---\n${sections}\n${WRAPPERS.map(exactWrapper).join('\n')}\n| 组合方式 | 适用条件 | 组合时机 | 隔离成本 | 停止采用信号 |\n| --- | --- | --- | --- | --- |\n${rows(COMPOSITION_ROWS)}\n\n| 构件 | 拥有 | 明确不拥有 |\n| --- | --- | --- |\n${rows(OWNER_ROWS)}\n\n| 故障 | 检测 | 自动响应 | 停止条件 | 最终责任人 |\n| --- | --- | --- | --- | --- |\n${rows(FAILURE_ROWS)}`;
}

function assertGenericHelperRejections() {
  assert.throws(() => parsePathPoints('M 0 0 L'), assert.AssertionError, 'missing path coordinate rejected');
  const nodes = new Map([
    ['left', {attributes: new Map([['id', 'left']]), geometry: new Map([['x', '0'], ['y', '0'], ['width', '100'], ['height', '100']])}],
    ['right', {attributes: new Map([['id', 'right']]), geometry: new Map([['x', '300'], ['y', '0'], ['width', '100'], ['height', '100']])}],
  ]);
  const misplaced = '<mxCell id="edge" edge="1" source="left" target="right" style="exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=1;"><mxGeometry relative="1" as="geometry"><mxPoint x="200" y="50"/></mxGeometry></mxCell>';
  assert.throws(() => drawioRoute(parseDrawio(misplaced).edges[0], nodes), assert.AssertionError, 'waypoint outside Array is rejected');
}

test('STY-12 helper fixture locks its public content contract', () => {
  assertGenericHelperRejections();
  assert.equal(architectureCaseTopicIds.has(TOPIC_ID), true, 'STY-12 uses the architecture-case heading contract');
  assert.deepEqual(sty12ArchitectureCaseHeadings, EXPECTED_HEADINGS.map((heading) => `## ${heading}`), 'STY-12 specialized schema headings');
  assert.equal(knowledgeHeadingContract('style', TOPIC_ID), sty12ArchitectureCaseHeadings, 'STY-12 resolves its specialized schema headings before the generic architecture-case contract');
  const fixture = fixtureArticle(); assertMicroFrontendArticle(fixture);
  for (const key of Object.keys(EXACT_METADATA)) { assert.throws(() => assertMicroFrontendArticle(removeFrontMatterField(fixture, key)), assert.AssertionError, `${key} deletion rejected`); assert.throws(() => assertMicroFrontendArticle(changeFrontMatterField(fixture, key)), assert.AssertionError, `${key} change rejected`); }
  for (const rows of [COMPOSITION_ROWS, OWNER_ROWS, FAILURE_ROWS]) for (const row of rows) { const exact = '| ' + row.join(' | ') + ' |'; assert.throws(() => assertMicroFrontendArticle(replaceOnce(fixture, exact, '| ' + [...row.slice(0, -1), '错误的合同值'].join(' | ') + ' |', `${row[0]} mutation`)), assert.AssertionError, `${row[0]} change rejected`); }
});

test('STY-12 governed sources use the executable WHATWG license policy without quotations', () => {
  assertMicroFrontendSourcePolicy(JSON.parse(readFileSync('data/source-ledger.json', 'utf8')));
});

test('STY-12 publication asset binds article, sources, relations, and the exact synchronized diagram', async () => {
  const source = file(ARTICLE); assert.ok(source, ARTICLE + ' must exist after implementation'); assertMicroFrontendArticle(source);
  assertMicroFrontendSources(JSON.parse(readFileSync('data/source-ledger.json', 'utf8')));
  const documents = await readContentDocuments(CONTENT_ROOT); const article = documents.find(({file: path}) => 'content/' + path === ARTICLE);
  assert.ok(article, 'STY-12 content document'); assert.ok(extractInternalLinks(article).includes(RELATED_CASE), 'visible related case link');
  for (const path of ['content/styles/sty-03-vertical-slice-architecture.mdx', 'content/styles/sty-10-microkernel-plugin-architecture.mdx', 'content/cases/micro-frontends-single-spa.mdx']) { const target = documents.find(({file: documentPath}) => 'content/' + documentPath === path); assert.ok(target, `${path} exists`); assert.ok(extractInternalLinks(target).includes(ROUTE), `${path} visibly reciprocates STY-12`); }
  assert.equal(documents.flatMap(extractInternalLinks).includes('/styles/sty-13'), false, 'STY-13 remains non-actionable');
  const diagram = file(DRAWIO); const svg = file(SVG); assert.ok(diagram && svg, 'STY-12 diagram pair'); assertMicroFrontendDiagram(diagram, svg);
});

test('STY-12 Task 4 Stage A projection remains RED until generated artifacts are refreshed', () => {
  const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8')); assert.deepEqual({completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}, EXPECTED_STAGE_A, 'exact Stage A projection');
});
