import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';

export const ARTICLE = 'content/styles/sty-10-microkernel-plugin-architecture.mdx';
export const DRAWIO = 'diagrams/sty-10-microkernel-order-plugins.drawio';
export const SVG = 'static/img/diagrams/sty-10-microkernel-order-plugins.svg';
export const ROUTE = '/styles/sty-10';
export const TOPIC_ID = 'STY-10';
export const NEXT_TOPIC = 'STY-11';
export const EXPECTED_STAGE_A = Object.freeze({completed: 62, documents: 106, sources: 550});
export const SOURCE_IDS = Object.freeze([
  'src-eclipse-plugin-architecture', 'src-osgi-core-7-lifecycle', 'src-osgi-semantic-versioning',
  'src-hashicorp-go-plugin', 'src-vscode-extension-host', 'src-atlas-sty10-microkernel-order-plugins',
]);
export const EXACT_METADATA = Object.freeze({
  title: 'Microkernel / Plug-in Architecture：让扩展能力可替换，也让风险止步于边界',
  slug: '/styles/sty-10', content_type: 'style', status: 'reviewed', difficulty: 'advanced',
  analyzed_at: '2026-08-19', source_cutoff: '2026-08-19', confidence: 'high',
  domains: ['software-architecture', 'platform-engineering', 'application-security'], agent_patterns: [], protocols: ['grpc'],
  quality_attributes: ['extensibility', 'compatibility', 'security', 'reliability', 'operability', 'maintainability'],
  tags: ['架构风格', 'Microkernel', 'Plug-in Architecture', '扩展点', '能力协商', '插件隔离'],
  summary: '以订单平台宿主和进程外税费、支付、库存、通知插件说明双平面微内核：控制面治理身份、兼容、权限与激活，执行面限制调用和故障，宿主保留业务状态、提交与补偿。',
  topic_id: 'STY-10', priority: 'P1', depends_on: ['STY-00', 'STY-04', 'STY-05'], adjacent_topics: ['STY-04', 'STY-05'], related_cases: [], related_questions: [],
});
export const EXPECTED_HEADINGS = Object.freeze(['学习问题', '一页摘要', '事实边界', '架构图', '扩展合同与运行流', '关键机制导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源']);
export const MIGRATION_HEADINGS = Object.freeze(['可直接复用的机制', '只能有限类比的部分', '不应照搬的部分']);
export const WRAPPERS = Object.freeze([
  '订单平台双平面微内核与进程外插件图，可横向滚动',
  '插件能力、兼容、权限与生命周期八维治理矩阵，可横向滚动',
  '插件五类故障检测、响应、停止条件与人工所有者表，可横向滚动',
]);
export const COMPONENTS = Object.freeze(['插件注册表', '供应链验证器', '策略与权限引擎', '发布控制器', '订单微内核宿主', '受控调用网关', '补偿队列', '税费插件', '支付插件', '库存插件', '通知插件']);
export const GOVERNANCE_ROWS = Object.freeze([
  ['身份与来源', '插件 ID、发布者、摘要、签名', '信任根、来源和撤销检查', '隔离制品并拒绝激活'],
  ['协议/API', '支持的版本范围', '与宿主版本求交并运行合同测试', '使用已批准兼容版或拒绝'],
  ['能力', '能力 ID、版本、必需/可选标记', '扩展点需求与能力集合匹配', '可选能力降级，必需能力拒绝'],
  ['依赖', '插件/平台依赖及范围', '检查存在、兼容和循环', '拒绝或保持旧绑定'],
  ['权限', '数据、网络、凭证、文件需求', '与租户和环境策略求交', '缩小授权；无法运行则拒绝'],
  ['资源', 'CPU、内存、并发、响应大小', '配额、准入、超时与熔断', '限流、隔离或停止新流量'],
  ['数据与结果', '输入字段、输出结构、错误分类', '最小数据投影与结果校验', '拒绝请求或隔离响应'],
  ['生命周期', '健康、灰度、排空和回滚能力', '发布闸门与当前绑定状态', '停止推进并恢复旧绑定'],
]);
export const FAILURE_ROWS = Object.freeze([
  ['版本/能力不兼容', '解析无交集、合同测试或结果结构失败', '保持旧绑定、拒绝候选或使用明确可选降级', '无批准兼容版本', '插件平台负责人'],
  ['税费/支付/库存超时或失败', 'deadline、标准错误、熔断与结果查询', '有限重试；结果未知先查询/对账；关键步骤失败关闭', '预算耗尽或无法判定真实结果', '订单域负责人'],
  ['通知插件失败', '超时、明确失败或不可用', '降级并写入补偿队列，按幂等键有界重试', '次数/时限耗尽或重复失败', '通知能力负责人'],
  ['权限、签名或来源异常', '签名/摘要/撤销/策略拒绝和异常访问', '隔离实例、撤销短期凭证、停止新流量并保留证据', '证据保存后禁止自动重放', '平台安全负责人'],
  ['资源耗尽或崩溃风暴', 'CPU/内存/并发/响应大小、退出率和重启率', '限流、熔断、停止新激活、隔离版本', '健康窗口内未恢复', '插件运营负责人'],
]);
export const LIFECYCLE = Object.freeze(['验证', '预热', '灰度', '排空', '卸载']);
export const REGION_IDS = Object.freeze(['control-plane', 'execution-plane', 'plugin-processes', 'authority-boundary']);
export const NODE_IDS = Object.freeze(['plugin-registry', 'supply-chain-verifier', 'policy-permission-engine', 'release-controller', 'order-microkernel-host', 'controlled-invocation-gateway', 'compensation-queue', 'tax-plugin', 'payment-plugin', 'inventory-plugin', 'notification-plugin', 'order-store', 'payment-authority', 'inventory-authority']);
export const EDGE_IDS = Object.freeze(['register-manifest', 'verify-artifact', 'approve-binding', 'activate-binding', 'resolve-capability', 'project-order-data', 'invoke-tax', 'invoke-payment', 'invoke-inventory', 'invoke-notification', 'commit-order', 'query-payment-result', 'enqueue-notification-compensation', 'isolate-plugin', 'rollback-binding']);

const CONTENT_ROOT = fileURLToPath(new URL('../content/', import.meta.url));
function file(path) { try { return readFileSync(path, 'utf8'); } catch (error) { if (error?.code === 'ENOENT') return undefined; throw error; } }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'); }
function articleParts(source) { assert.ok(source, `${ARTICLE} must exist after implementation`); const close = source.indexOf('\n---', 3); assert.ok(close >= 0, 'front matter closes'); return {source, body: source.slice(close + 4)}; }
function exactWrapper(label) { return `<div className="table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner" role="region" aria-label="${label}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`; }
function replaceOnce(source, oldValue, newValue, label) { const changed = source.replace(oldValue, newValue); assert.notEqual(changed, source, `${label} mutation applies`); return changed; }
function frontMatterFixture(metadata) { return Object.entries(metadata).flatMap(([key, value]) => Array.isArray(value) ? value.length ? [`${key}:`, ...value.map((item) => `  - ${item}`)] : [`${key}: []`] : [`${key}: ${value}`]).join('\n'); }
function removeFrontMatterField(source, key) { return source.replace(new RegExp(`^${escapeRegExp(key)}:.*(?:\\r?\\n  - [^\\r\\n]+)*(?:\\r?\\n|$)`, 'mu'), ''); }
function changeFrontMatterField(source, key) { const value = EXACT_METADATA[key]; return Array.isArray(value) && value.length ? replaceOnce(source, `  - ${value[0]}`, '  - changed', `${key} changed`) : replaceOnce(source, `${key}: ${Array.isArray(value) ? '[]' : value}`, `${key}: changed`, `${key} changed`); }
export function markdownTables(body) { const tables = []; const lines = body.split(/\r?\n/u); for (let index = 0; index < lines.length; index += 1) { if (!lines[index].startsWith('|')) continue; const rows = []; while (index < lines.length && lines[index].startsWith('|')) { rows.push(lines[index].slice(1, -1).split('|').map((cell) => cell.trim())); index += 1; } if (rows.length >= 3 && rows[1].every((cell) => /^:?-{3,}:?$/u.test(cell))) tables.push(rows); } return tables; }
function table(body, header) { const found = markdownTables(body).find((candidate) => JSON.stringify(candidate[0]) === JSON.stringify(header)); assert.ok(found, `table ${header.join(' | ')}`); return found; }
function exactRows(actual, expected, name) { assert.deepEqual(actual.slice(2), expected, `${name} exact ordered rows`); }
function section(source, heading) { const result = new RegExp(`(?:^|\\n)## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n## |$)`, 'u').exec(source)?.[1]; assert.ok(result, `${heading} section`); return result; }
function includesOrdered(source, values, label) { let at = -1; for (const value of values) { const next = source.indexOf(value, at + 1); assert.ok(next > at, `${label}: ${value}`); at = next; } }

export function assertExactMetadata(source) { assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-10 front matter'); }
export function assertArticleHeadings(source) { const headings = findMarkdownHeadings(source); assert.deepEqual(headings.filter(({level}) => level === 2).map(({text}) => text), EXPECTED_HEADINGS, 'approved exact H2 order'); const migration = headings.find(({level, text}) => level === 2 && text === '可迁移经验'); const next = headings.find(({level, offset}) => level === 2 && offset > migration.offset); assert.deepEqual(headings.filter(({level, offset}) => level === 3 && offset > migration.offset && (!next || offset < next.offset)).map(({text}) => text), MIGRATION_HEADINGS, 'approved exact H3 order'); }
export function assertWrappers(source) { for (const label of WRAPPERS) { const tag = new RegExp(`<div\\b[^>]*aria-label="${escapeRegExp(label)}"[^>]*>`, 'u').exec(source)?.[0]; assert.ok(tag, `scroll wrapper: ${label}`); for (const attribute of ['role="region"', `aria-label="${label}"`, 'tabIndex={0}', 'onKeyDown={handleHorizontalArrowKey}']) assert.ok(tag.includes(attribute), `${label} ${attribute}`); } assert.equal((source.match(/role="region"/gu) ?? []).length, 3, 'exactly three scroll wrappers'); }
export function assertOwnership(source) {
  const contracts = [
    ['插件注册表', /保存[^。；\n]*(?:插件标识|制品摘要|状态)/u, /不执行订单业务/u],
    ['供应链验证器', /检查[^。；\n]*(?:来源|签名|摘要|撤销)/u, /不证明插件业务逻辑正确/u],
    ['策略与权限引擎', /(?:最小数据|网络|凭证|资源).*(?:范围|授予)|(?:范围|授予).*(?:最小数据|网络|凭证|资源)/u, /插件声明需求[^。；\n]*不决定授权/u],
    ['发布控制器', /(?:验证|预热|灰度|排空|卸载)/u, /不替订单域决定业务补偿/u],
    ['订单微内核宿主', /(?:订单流程|权威状态|提交|补偿)/u, /插件[^。；\n]*不拥有订单状态机/u],
    ['受控调用网关', /(?:能力解析|协议协商|最小数据投影|幂等键|短期凭证)/u, /不(?:取得|拥有)订单业务决策权/u],
    ['补偿队列', /通知类工作/u, /不接受税费、支付或库存[^。；\n]*默认跳过/u],
  ];
  for (const component of COMPONENTS) assert.match(source, new RegExp(escapeRegExp(component), 'u'), `${component} visible`);
  for (const [name, positive, negative] of contracts) { const context = source.slice(Math.max(0, source.indexOf(name) - 180), source.indexOf(name) + 520); assert.match(context, positive, `${name} positive responsibility`); assert.match(source, negative, `${name} explicit non-ownership`); }
  for (const name of ['税费插件', '支付插件', '库存插件', '通知插件']) { assert.match(source, new RegExp(`${escapeRegExp(name)}[^。；\\n]*(?:只实现一个|被批准的扩展能力)`, 'u'), `${name} constrained capability`); }
}
export function assertGovernance(source) { const rows = table(source, ['维度', '插件声明', '宿主/平台门禁', '不满足时']); exactRows(rows, GOVERNANCE_ROWS, 'eight-row governance matrix'); assert.deepEqual(rows.slice(2).map(([dimension]) => dimension), GOVERNANCE_ROWS.map(([dimension]) => dimension), 'governance row order'); assert.match(source, /未知(?:能力|字段)[^。；\n]*(?:拒绝|不允许|不能).*静默/u, 'unknown capability cannot silently pass'); assert.match(source, /(?:声明[^。；\n]*不决定授权|不允许声明[^。；\n]*自动扩大授权)/u, 'declaration is not authorization'); assert.match(source, /没有安全相交范围[^。；\n]*拒绝激活/u, 'no forced adapter'); }
export function assertInvocationFailureAndLifecycle(source) {
  includesOrdered(source, ['订单宿主到达', '调用网关向控制面解析', '宿主生成最小数据投影', '网关加入操作 ID、幂等键、期限', '插件返回版本化结果', '网关校验响应结构、大小', '宿主根据业务失败策略', '控制面只接收健康与策略信号'], 'eight-step invocation');
  for (const item of ['订单 ID、地区、应税项目和合同版本', '短期凭证', 'deadline', '结果未知先查询', '权威结果', '不能盲目重放']) assert.match(source, new RegExp(escapeRegExp(item), 'u'), `invocation boundary: ${item}`);
  exactRows(table(source, ['故障类别', '检测', '自动响应', '停止条件', '人工所有者']), FAILURE_ROWS, 'five-row failure ownership');
  includesOrdered(source, LIFECYCLE, 'controlled lifecycle');
  assert.match(source, /任何阶段失败[^。；\n]*(?:停止推进|恢复上一批准绑定)/u, 'lifecycle failure restores old binding');
  assert.match(source, /回滚[^。；\n]*不会撤销[^。；\n]*外部效果/u, 'rollback does not erase effects');
  for (const unsafe of [/无限重试/u, /税费[^。；\n]*失败开放/u, /通知[^。；\n]*失败关闭/u, /盲目重放[^。；\n]*(?:支付|外部效果)/u, /人工所有者待定/u, /原地热替换/u, /回滚撤销已发生外部效果/u]) assert.doesNotMatch(source, unsafe, 'unsafe failure claim');
}
export function assertNarrativeBoundaries(source) {
  for (const expression of [/不直连订单数据库/u, /不互相(?:调用|组成隐藏业务流程)/u, /不允许声明自动扩大授权/u, /进程外执行只提供进程故障边界[^。；\n]*不自动形成安全沙箱/u, /不为假想需求预建扩展点/u]) assert.match(source, expression, `explicit prohibition: ${expression}`);
  includesOrdered(source, ['收集真实变化和实现差异', '在宿主内提取', '固定业务所有权', '引入清单、注册表', '独立交付或第三方风险成立时，再迁移为进程外 RPC 插件', '建立签名、最小权限、配额、灰度、排空、回滚和人工处置'], 'six-step migration');
  for (const unsafe of [/插件可以直连订单数据库/u, /插件之间可以互相调用/u, /插件可以自行扩大权限/u, /进程隔离就是安全沙箱/u, /插件可组成隐藏业务流程/u, /插件(?:可以|应)[^。；\n]*为假想需求预建扩展点/u]) assert.doesNotMatch(source, unsafe, 'unsafe narrative claim');
}

const REMOTE_SOURCES = Object.freeze({
  'src-eclipse-plugin-architecture': {canonical_locator: 'https://www.eclipse.org/articles/Article-Plug-in-architecture/plugin_architecture.html', title: 'Notes on the Eclipse Plug-in Architecture', roles: ['definition', 'historical-context'], license: 'LicenseRef-All-Rights-Reserved', primary: true},
  'src-osgi-core-7-lifecycle': {canonical_locator: 'https://docs.osgi.org/specification/osgi.core/7.0.0/framework.lifecycle.html', title: 'OSGi Core Release 7: Life Cycle Layer', roles: ['runtime-fact'], license: 'LicenseRef-Proprietary-Standard', primary: false},
  'src-osgi-semantic-versioning': {canonical_locator: 'https://docs.osgi.org/whitepaper/semantic-versioning/040-semantic-versions.html', title: 'Semantic Versioning', roles: ['method'], license: 'LicenseRef-Proprietary-Standard', primary: false},
  'src-hashicorp-go-plugin': {canonical_locator: 'https://github.com/hashicorp/go-plugin', title: 'go-plugin', roles: ['implementation', 'runtime-fact'], license: 'MPL-2.0', primary: false},
  'src-vscode-extension-host': {canonical_locator: 'https://code.visualstudio.com/api/advanced-topics/extension-host', title: 'Extension Host', roles: ['implementation', 'comparison'], license: 'LicenseRef-All-Rights-Reserved', primary: false},
});
export function assertSourceContracts(ledger) {
  const document = ledger.documents?.[ARTICLE]; assert.ok(document, `${ARTICLE} governed document`); const remoteIds = SOURCE_IDS.slice(0, -1); assert.equal(remoteIds.length, 5, 'five remote sources'); assert.equal(new Set(remoteIds.map((id) => REMOTE_SOURCES[id].canonical_locator)).size, 5, 'five independent remote identities');
  for (const id of remoteIds) { const expected = REMOTE_SOURCES[id]; const record = ledger.sources.find((entry) => entry.id === id); const citation = document.citations.find((entry) => entry.source_id === id); assert.ok(record && citation, `${id} source and citation`); assert.equal(record.canonical_locator, expected.canonical_locator, `${id} canonical locator`); assert.equal(record.title, expected.title, `${id} title`); assert.equal(record.license, expected.license, `${id} license`); assert.deepEqual(record.allowed_evidence_roles, expected.roles, `${id} narrow roles`); assert.deepEqual(citation.roles, expected.roles, `${id} citation roles`); assert.equal(citation.manifest_primary, expected.primary, `${id} manifest primary`); assert.equal(citation.usage_mode, 'facts-summary', `${id} facts-summary only`); }
  const original = ledger.sources.find((entry) => entry.id === SOURCE_IDS.at(-1)); assert.ok(original, 'original illustration registered'); assert.equal(original.canonical_locator, '/img/diagrams/sty-10-microkernel-order-plugins.svg', 'original illustration asset'); assert.equal(original.license, 'LicenseRef-Atlas-Original', 'original illustration rights'); assert.equal(original.copyright_policy, 'original-atlas', 'original illustration policy');
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1, 'exactly one manifest primary'); assert.equal(document.citations.find(({manifest_primary}) => manifest_primary)?.source_id, 'src-eclipse-plugin-architecture', 'Eclipse is sole primary');
}
export async function assertRelationsAndStageA() { const documents = (await readContentDocuments(CONTENT_ROOT)).map((document) => ({...document, file: `content/${document.file}`})); const article = documents.find(({file: path}) => path === ARTICLE); assert.ok(article, 'STY-10 article appears in content documents'); const links = extractInternalLinks(article); for (const route of ['/styles/sty-04', '/styles/sty-05', '/principles/pr-09', '/principles/pr-12']) assert.ok(links.includes(route), `visible STY-10 relation: ${route}`); assert.equal(links.includes('/styles/sty-11'), false, 'STY-11 remains non-actionable'); const reciprocal = ['content/styles/sty-04-modular-monolith.mdx', 'content/styles/sty-05-microservices.mdx', 'content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx', 'content/principles/pr-12-open-closed-interface-segregation.mdx']; for (const path of reciprocal) { const target = documents.find((document) => document.file === path); assert.ok(target, `${path} exists`); assert.ok(extractInternalLinks(target).includes(ROUTE), `${path} reciprocates STY-10`); } const status = JSON.parse(readFileSync('src/generated/project-status.json', 'utf8')); assert.deepEqual({completed: status.completed_topics, documents: status.content_documents, sources: status.governed_sources}, EXPECTED_STAGE_A, 'Stage A projection'); }

function attributes(tag) { return new Map([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)].map(([, key, double, single]) => [key, double ?? single])); }
export function parseDrawio(source) { const cells = [...source.matchAll(/<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/gu)].map(([raw]) => { const open = /^<mxCell\b[^>]*>/u.exec(raw)?.[0] ?? raw; const geometry = /<mxGeometry\b([^>]*)/u.exec(raw)?.[1] ?? ''; const points = [...raw.matchAll(/<Array\s+as="points"[^>]*>([\s\S]*?)<\/Array>/gu)].flatMap(([, value]) => [...value.matchAll(/<mxPoint\b([^>]*)/gu)].map(([, point]) => attributes(`<mxPoint ${point}>`))); return {raw, attributes: attributes(open), geometry: attributes(`<mxGeometry ${geometry}>`), points}; }); return {cells, nodes: cells.filter(({attributes: item}) => item.get('vertex') === '1'), edges: cells.filter(({attributes: item}) => item.get('edge') === '1')}; }
function styleMap(value = '') { return new Map(value.split(';').filter(Boolean).map((item) => item.split(/=(.*)/su).map((part) => part.trim()))); }
function number(value, label) { const result = Number(value); assert.ok(Number.isFinite(result), label); return result; }
function terminalPoint(node, edge, side) { const box = ['x', 'y', 'width', 'height'].reduce((result, key) => ({...result, [key]: number(node.geometry.get(key), `${node.attributes.get('id')} ${key}`)}), {}); const style = styleMap(edge.attributes.get('style')); for (const key of [`${side}X`, `${side}Y`, `${side}Dx`, `${side}Dy`, `${side}Perimeter`]) assert.ok(style.has(key), `${edge.attributes.get('id')} ${key}`); assert.equal(style.get(`${side}Dx`), '0', 'terminal dx'); assert.equal(style.get(`${side}Dy`), '0', 'terminal dy'); assert.equal(style.get(`${side}Perimeter`), '1', 'terminal perimeter'); const x = number(style.get(`${side}X`), 'normalized terminal x'); const y = number(style.get(`${side}Y`), 'normalized terminal y'); assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1 && (x === 0 || x === 1 || y === 0 || y === 1), 'normalized terminal on perimeter'); return {x: box.x + box.width * x, y: box.y + box.height * y}; }
export function drawioRoute(edge, nodeById) { const source = nodeById.get(edge.attributes.get('source')); const target = nodeById.get(edge.attributes.get('target')); assert.ok(source && target, `${edge.attributes.get('id')} real terminals`); assert.match(edge.raw, /<Array\s+as="points"/u, `${edge.attributes.get('id')} waypoint array`); assert.doesNotMatch(edge.raw, /<mxPoint\b[^>]+as="(?:sourcePoint|targetPoint)"/u, `${edge.attributes.get('id')} no fallback point`); return [terminalPoint(source, edge, 'exit'), ...edge.points.map((point) => ({x: number(point.get('x'), 'waypoint x'), y: number(point.get('y'), 'waypoint y')})), terminalPoint(target, edge, 'entry')]; }
function parseSvg(source) { const elements = []; const stack = []; for (const match of source.matchAll(/<\/?([A-Za-z][\w:.-]*)\b([^>]*)>/gu)) { if (match[0].startsWith('</')) { stack.pop(); continue; } const element = {name: match[1], attributes: attributes(match[2]), parent: stack.at(-1), index: elements.length}; elements.push(element); if (!match[0].endsWith('/>')) stack.push(element); } assert.equal(stack.length, 0, 'balanced SVG'); return elements; }
function cssRules(source) { return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gu)].flatMap(([, css]) => [...css.matchAll(/([^{}]+)\{([^}]*)\}/gu)].flatMap(([, selectors, declarations]) => selectors.split(',').map((selector) => [selector.trim(), new Map(declarations.split(';').filter(Boolean).map((part) => part.split(':').map((value) => value.trim())))]))); }
function matches(element, selector) { const final = selector.trim().split(/\s+|>/u).at(-1); const tag = /^[A-Za-z][\w-]*/u.exec(final)?.[0]; const classes = [...final.matchAll(/\.([\w-]+)/gu)].map(([, value]) => value); return (!tag || element.name === tag) && classes.every((value) => (element.attributes.get('class') ?? '').split(/\s+/u).includes(value)); }
export function svgPresentationValue(source, element, property) { const result = []; for (const [selector, declarations] of cssRules(source)) if (matches(element, selector) && declarations.has(property)) result.push(declarations.get(property)); return element.attributes.get(property) ?? result.at(-1) ?? (element.parent ? svgPresentationValue(source, element.parent, property) : undefined); }
function routePoints(path) { return [...(path.attributes.get('d') ?? '').matchAll(/(?:M|L)\s*([\d.-]+)[ ,]([\d.-]+)/gu)].map(([, x, y]) => ({x: number(x, 'SVG x'), y: number(y, 'SVG y')})); }
export function glyphBox({x, y, text, fontSize, anchor = 'start'}) { const width = [...text].reduce((total, character) => total + (/^[\u0000-\u00ff]$/u.test(character) ? .64 : 1), 0) * fontSize; const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x; return {left, right: left + width, top: y - fontSize * .82, bottom: y + fontSize * .22}; }
export function alphaCompose(backdrop, foreground) { const alpha = foreground.alpha + backdrop.alpha * (1 - foreground.alpha); if (alpha === 0) return {red: 0, green: 0, blue: 0, alpha: 0}; return {red: (foreground.red * foreground.alpha + backdrop.red * backdrop.alpha * (1 - foreground.alpha)) / alpha, green: (foreground.green * foreground.alpha + backdrop.green * backdrop.alpha * (1 - foreground.alpha)) / alpha, blue: (foreground.blue * foreground.alpha + backdrop.blue * backdrop.alpha * (1 - foreground.alpha)) / alpha, alpha}; }
export function markerEnvelope(endpoint, previous, {width, height, refX, refY, scale = 1}) { const dx = endpoint.x - previous.x; const dy = endpoint.y - previous.y; const length = Math.hypot(dx, dy); assert.ok(length > 0, 'marker terminal direction'); const unit = {x: dx / length, y: dy / length}; const normal = {x: -unit.y, y: unit.x}; const points = [[-refX, -refY], [width - refX, -refY], [width - refX, height - refY], [-refX, height - refY]].map(([x, y]) => ({x: endpoint.x + scale * (unit.x * x + normal.x * y), y: endpoint.y + scale * (unit.y * x + normal.y * y)})); return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function overlaps(left, right) { return left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top; }
export function assertNoLaterPaintMask(route, masks) { const routeBounds = {left: Math.min(...route.map(({x}) => x)), right: Math.max(...route.map(({x}) => x)), top: Math.min(...route.map(({y}) => y)), bottom: Math.max(...route.map(({y}) => y))}; for (const mask of masks) assert.equal(mask.alpha > 0 && overlaps(routeBounds, mask), false, 'later paint does not mask a semantic route'); }
export function assertDiagram(drawioSource, svgSource) { const drawio = parseDrawio(drawioSource); const nodes = new Map(drawio.nodes.map((node) => [node.attributes.get('id'), node])); const edges = new Map(drawio.edges.map((edge) => [edge.attributes.get('id'), edge])); for (const id of [...REGION_IDS.map((id) => `region-${id}`), ...NODE_IDS.map((id) => `node-${id}`)]) assert.ok(nodes.has(id), `Draw.io node ${id}`); for (const id of EDGE_IDS) { const edge = edges.get(id); assert.ok(edge, `Draw.io edge ${id}`); drawioRoute(edge, nodes); }
  const svg = parseSvg(svgSource); const viewBox = (svg.find(({name}) => name === 'svg')?.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.deepEqual(viewBox, [0, 0, 2400, 3900], '800 CSS-pixel diagram canvas'); for (const id of NODE_IDS) assert.ok(svg.some(({attributes: item}) => item.get('data-node-id') === `node-${id}`), `SVG node ${id}`); for (const id of EDGE_IDS) { const edge = svg.find(({name, attributes: item}) => name === 'path' && item.get('data-edge-id') === id); assert.ok(edge, `SVG edge ${id}`); assert.ok(routePoints(edge).length >= 2, `${id} visible route`); const font = svgPresentationValue(svgSource, edge, 'font-size'); if (font) assert.ok(Number.parseFloat(font) >= 45, `${id} 15 CSS-pixel edge type`); }
  for (const text of svg.filter(({name}) => name === 'text')) { const font = Number.parseFloat(svgPresentationValue(svgSource, text, 'font-size') ?? '0'); assert.ok(font >= 45, 'body text is at least 15 CSS pixels'); }
}

test('STY-10 helper contracts reject metadata, wrapper, table, ownership and recovery mutations', () => {
  const headings = EXPECTED_HEADINGS.map((heading) => heading === '可迁移经验' ? `## ${heading}\n${MIGRATION_HEADINGS.map((item) => `### ${item}`).join('\n')}` : `## ${heading}`).join('\n');
  const article = `---\n${frontMatterFixture(EXACT_METADATA)}\n---\n${WRAPPERS.map(exactWrapper).join('\n')}\n${headings}\n插件注册表保存插件标识、制品摘要和状态，注册表不执行订单业务。供应链验证器检查来源、签名、摘要和撤销，通过验证不证明插件业务逻辑正确。策略与权限引擎授予最小数据、网络、凭证和资源范围，插件声明需求不决定授权。发布控制器执行验证、预热、灰度、排空和卸载，它不替订单域决定业务补偿。订单微内核宿主拥有订单流程、权威状态、提交和补偿，插件不拥有订单状态机。受控调用网关执行能力解析、协议协商、最小数据投影、幂等键和短期凭证，不取得订单业务决策权。补偿队列只承载通知类工作，不接受税费、支付或库存正确性结果的默认跳过。税费插件、支付插件、库存插件、通知插件每个插件只实现一个被批准的扩展能力。\n未知能力必须拒绝，不能静默接受。没有安全相交范围时拒绝激活，不允许声明自动扩大授权。\n| 维度 | 插件声明 | 宿主/平台门禁 | 不满足时 |\n| --- | --- | --- | --- |\n${GOVERNANCE_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n| 故障类别 | 检测 | 自动响应 | 停止条件 | 人工所有者 |\n| --- | --- | --- | --- | --- |\n${FAILURE_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n订单宿主到达扩展点。调用网关向控制面解析绑定。宿主生成最小数据投影：订单 ID、地区、应税项目和合同版本。网关加入操作 ID、幂等键、期限、deadline 和短期凭证。插件返回版本化结果。网关校验响应结构、大小。宿主根据业务失败策略处理。控制面只接收健康与策略信号。超时后结果未知先查询权威结果，不能盲目重放。\n任何阶段失败停止推进并恢复上一批准绑定。回滚只改变新请求绑定，不会撤销已经产生的外部效果。\n插件不得不直连订单数据库，不互相调用或组成隐藏业务流程。进程外执行只提供进程故障边界，不自动形成安全沙箱。不为假想需求预建扩展点。\n收集真实变化和实现差异。在宿主内提取一个合同。固定业务所有权。引入清单、注册表。独立交付或第三方风险成立时，再迁移为进程外 RPC 插件。建立签名、最小权限、配额、灰度、排空、回滚和人工处置。`;
  assertExactMetadata(article); assertArticleHeadings(article); assertWrappers(article); assertOwnership(article); assertGovernance(article); assertInvocationFailureAndLifecycle(article); assertNarrativeBoundaries(article);
  for (const key of Object.keys(EXACT_METADATA)) { const deleted = removeFrontMatterField(article, key); assert.notEqual(deleted, article, `${key} deletion applies`); assert.throws(() => assertExactMetadata(deleted), assert.AssertionError, `${key} deletion rejected`); assert.throws(() => assertExactMetadata(changeFrontMatterField(article, key)), assert.AssertionError, `${key} changed rejected`); }
  for (const heading of [...EXPECTED_HEADINGS, ...MIGRATION_HEADINGS]) assert.throws(() => assertArticleHeadings(replaceOnce(article, `##${MIGRATION_HEADINGS.includes(heading) ? '#' : ''} ${heading}`, '', `${heading} deletion`)), assert.AssertionError, `${heading} deletion rejected`);
  for (const label of WRAPPERS) for (const [from, to] of [['role="region"', 'role="table"'], ['aria-label=', 'aria-labelX='], ['tabIndex={0}', 'tabIndex={-1}'], ['onKeyDown={handleHorizontalArrowKey}', 'onKeyDown={undefined}']]) assert.throws(() => assertWrappers(replaceOnce(article, exactWrapper(label), replaceOnce(exactWrapper(label), from, to, `${label} attr`), `${label} attr`)), assert.AssertionError, `${label} wrapper attribute rejected`);
  for (const row of GOVERNANCE_ROWS) { const exact = `| ${row.join(' | ')} |`; assert.throws(() => assertGovernance(replaceOnce(article, `${exact}\n`, '', `${row[0]} deletion`)), assert.AssertionError, `${row[0]} row deletion rejected`); for (let index = 1; index < row.length; index += 1) { const changed = [...row]; changed[index] = '错误的合同值'; assert.throws(() => assertGovernance(replaceOnce(article, exact, `| ${changed.join(' | ')} |`, `${row[0]} changed`)), assert.AssertionError, `${row[0]} cell rejected`); } }
  for (const row of FAILURE_ROWS) { const exact = `| ${row.join(' | ')} |`; assert.throws(() => assertInvocationFailureAndLifecycle(replaceOnce(article, `${exact}\n`, '', `${row[0]} deletion`)), assert.AssertionError, `${row[0]} failure deletion rejected`); for (let index = 1; index < row.length; index += 1) { const changed = [...row]; changed[index] = '错误故障语义'; assert.throws(() => assertInvocationFailureAndLifecycle(replaceOnce(article, exact, `| ${changed.join(' | ')} |`, `${row[0]} changed`)), assert.AssertionError, `${row[0]} failure cell rejected`); } }
  for (const unsafe of ['无限重试', '税费失败开放', '通知失败关闭', '超时后盲目重放支付外部效果', '人工所有者待定', '原地热替换在途调用', '回滚撤销已发生外部效果']) assert.throws(() => assertInvocationFailureAndLifecycle(`${article}\n${unsafe}`), assert.AssertionError, `${unsafe} rejected`);
  for (const unsafe of ['插件可以直连订单数据库', '插件之间可以互相调用', '插件可以自行扩大权限', '进程隔离就是安全沙箱', '插件可组成隐藏业务流程', '插件可以为假想需求预建扩展点']) assert.throws(() => assertNarrativeBoundaries(`${article}\n${unsafe}`), assert.AssertionError, `${unsafe} rejected`);
});

test('STY-10 source fixture rejects deletion, rights, role, and primary mutations', () => {
  const remoteIds = SOURCE_IDS.slice(0, -1); const ledger = {sources: [...remoteIds.map((id) => ({id, canonical_locator: REMOTE_SOURCES[id].canonical_locator, title: REMOTE_SOURCES[id].title, license: REMOTE_SOURCES[id].license, allowed_evidence_roles: REMOTE_SOURCES[id].roles})), {id: SOURCE_IDS.at(-1), canonical_locator: '/img/diagrams/sty-10-microkernel-order-plugins.svg', license: 'LicenseRef-Atlas-Original', copyright_policy: 'original-atlas'}], documents: {[ARTICLE]: {citations: remoteIds.map((id) => ({source_id: id, roles: REMOTE_SOURCES[id].roles, manifest_primary: REMOTE_SOURCES[id].primary, usage_mode: 'facts-summary'}))}}}; assertSourceContracts(ledger);
  for (const id of SOURCE_IDS) { const changed = structuredClone(ledger); changed.sources = changed.sources.filter((entry) => entry.id !== id); assert.throws(() => assertSourceContracts(changed), assert.AssertionError, `${id} deletion rejected`); }
  const rights = structuredClone(ledger); rights.sources[0].license = 'MIT'; assert.throws(() => assertSourceContracts(rights), assert.AssertionError, 'rights mutation rejected'); const role = structuredClone(ledger); role.sources[1].allowed_evidence_roles = ['learning']; role.documents[ARTICLE].citations[1].roles = ['learning']; assert.throws(() => assertSourceContracts(role), assert.AssertionError, 'role mutation rejected'); const primary = structuredClone(ledger); primary.documents[ARTICLE].citations[0].manifest_primary = false; primary.documents[ARTICLE].citations[1].manifest_primary = true; assert.throws(() => assertSourceContracts(primary), assert.AssertionError, 'primary mutation rejected');
});

test('STY-10 SVG cascade and real terminal helpers reject drift', () => {
  const svg = '<svg><style>.edge { stroke:#0F766E; font-size:45px; }</style><g><path class="edge" data-edge-id="x" d="M 0 0 L 30 0"/></g></svg>'; const edge = parseSvg(svg).find(({attributes: item}) => item.get('data-edge-id') === 'x'); assert.equal(svgPresentationValue(svg, edge, 'stroke'), '#0F766E', 'effective SVG class style'); assert.equal(svgPresentationValue(svg, edge, 'font-size'), '45px', 'effective SVG font size'); assert.deepEqual(routePoints(edge), [{x: 0, y: 0}, {x: 30, y: 0}], 'real SVG path points'); const node = {attributes: new Map([['id', 'node']]), geometry: new Map([['x', '0'], ['y', '0'], ['width', '100'], ['height', '100']])}; const edgeCell = {attributes: new Map([['id', 'edge'], ['style', 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1']])}; assert.deepEqual(terminalPoint(node, edgeCell, 'exit'), {x: 100, y: 50}, 'real normalized terminal'); assert.throws(() => terminalPoint(node, {attributes: new Map([['id', 'edge'], ['style', 'exitX=0.7;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=1']])}, 'exit'), assert.AssertionError, 'non-perimeter terminal rejected'); const box = glyphBox({x: 100, y: 100, text: '订单宿主', fontSize: 45, anchor: 'middle'}); assert.ok(box.left < box.right && box.top < box.bottom, 'glyph box has visible geometry'); assert.deepEqual(alphaCompose({red: 0, green: 0, blue: 0, alpha: 0}, {red: 255, green: 255, blue: 255, alpha: .5}), {red: 255, green: 255, blue: 255, alpha: .5}, 'alpha composition uses source-over'); const marker = markerEnvelope({x: 30, y: 0}, {x: 0, y: 0}, {width: 12, height: 12, refX: 10, refY: 6}); assert.ok(marker.left < marker.right && marker.top < marker.bottom, 'marker envelope is transformed from its terminal'); assert.throws(() => assertNoLaterPaintMask([{x: 0, y: 0}, {x: 30, y: 0}], [{left: 10, right: 20, top: -1, bottom: 1, alpha: 1}]), assert.AssertionError, 'later opaque paint mask rejected');
});

test('STY-10 article locks exact metadata, semantic contracts, and wrappers', () => { const {source, body} = articleParts(file(ARTICLE)); assertExactMetadata(source); assertArticleHeadings(source); assertWrappers(source); assertOwnership(body); assertGovernance(body); assertInvocationFailureAndLifecycle(body); assertNarrativeBoundaries(body); });
test('STY-10 source governance, reciprocal relations, and Stage A projection are exact', async () => { assertSourceContracts(JSON.parse(readFileSync('data/source-ledger.json', 'utf8'))); await assertRelationsAndStageA(); });
test('STY-10 Draw.io/SVG diagram locks dual-plane inventory and physical source terminals', () => { const drawio = file(DRAWIO); const svg = file(SVG); assert.ok(drawio, `${DRAWIO} must exist after implementation`); assert.ok(svg, `${SVG} must exist after implementation`); assertDiagram(drawio, svg); });
