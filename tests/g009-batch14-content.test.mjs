import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {architectureCaseTopicIds, knowledgeHeadingContract, sty13ArchitectureCaseHeadings} from '../scripts/content-schema.mjs';

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
export const RECIPROCAL_CONTRACTS = Object.freeze([
  ['content/styles/sty-05-microservices.mdx', '[Space-Based Architecture 决策](/styles/sty-13)继续判断微服务何时需要把状态与处理按亲和键共置；它不取消服务所有权，也不把跨分区协调变回本地事务。'],
  ['content/styles/sty-08-actor-model.mdx', '[Space-Based Architecture 决策](/styles/sty-13)比较分区处理单元与 Actor 的状态所有权；两者都收敛本地决定，但亲和分区、主备数据网格与邮箱语义不能互换。'],
  ['content/cases/aws-cell-shuffle-sharding.mdx', '[Space-Based Architecture 决策](/styles/sty-13)可有限类比本案例的放置、热点和故障域边界；Cell 与 Shuffle Sharding 不证明状态和处理已经共置于分区数据空间。'],
  ['content/cases/cloudflare-durable-objects-workerd.mdx', '[Space-Based Architecture 决策](/styles/sty-13)可有限类比按稳定标识路由到状态所有者；Durable Objects 不证明分区数据网格、同步主备或跨对象事务。'],
]);
export const ADJACENT_CONTRACT_FILES = Object.freeze(['content/styles/sty-05-microservices.mdx', 'content/styles/sty-08-actor-model.mdx']);
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
  summary: '以航班余位与报价说明 Space-Based Architecture：入口按航段与日期路由到唯一分区所有者，状态与处理共置，主备只处理受控切换，日志与检查点负责恢复，多航段行程由外部持久工作流（Workflow）协调。',
  topic_id: TOPIC_ID, priority: 'P2', depends_on: ['STY-00', 'STY-05', 'STY-08'], adjacent_topics: ['STY-05', 'STY-08'], related_cases: RELATED_CASES, related_questions: [],
});
export const SOURCE_IDS = Object.freeze(['src-gigaspaces-sba-overview', 'src-gigaspaces-processing-unit-sla', 'src-gigaspaces-split-brain-resolution', 'src-gigaspaces-proxy-connectivity', 'src-oracle-coherence-partitioned-cache', 'src-oracle-coherence-backing-maps', 'src-gigaspaces-flight-availability-case', 'src-atlas-sty13-space-based-flight-availability']);
export const REMOTE_SOURCE_CONTRACTS = Object.freeze([
  ['src-gigaspaces-sba-overview', 'https://docs.gigaspaces.com/16.2/overview/space-based-architecture.html', 'Space-Based Architecture', 'GigaSpaces', null, 'XAP 16.2; checked 2026-08-28', 'official-docs', 'primary', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', 'Supports only the documented Space-Based Architecture definition, Processing Unit, partition-local service, data-affinity and primary-backup mechanisms; it does not prove the original flight design or general performance.'],
  ['src-gigaspaces-processing-unit-sla', 'https://docs.gigaspaces.com/16.2.1/admin/the-sla-overview.html', 'Defining the SLA for Your Processing Unit', 'GigaSpaces', null, 'XAP 16.2.1; checked 2026-08-28', 'official-docs', 'primary', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', 'Supports only the documented Processing Unit SLA, deployment and primary-backup control mechanisms; it does not prove the original flight design or general performance.'],
  ['src-gigaspaces-split-brain-resolution', 'https://docs.gigaspaces.com/16.2/admin/leader-election-availability-biased.html', 'Availability Biased — Split Brain and Primary Resolution', 'GigaSpaces', null, 'XAP 16.2; checked 2026-08-28', 'official-docs', 'primary', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', 'Supports only the documented split-brain detection and primary-resolution mechanism; it does not prove the original flight design or general performance.'],
  ['src-gigaspaces-proxy-connectivity', 'https://docs.gigaspaces.com/16.2/admin/tuning-proxy-connectivity.html', 'Proxy Connectivity', 'GigaSpaces', null, 'XAP 16.2; checked 2026-08-28', 'official-docs', 'primary', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', 'Supports only the documented proxy connectivity, discovery and rerouting mechanism; it does not prove the original flight design or general performance.'],
  ['src-oracle-coherence-partitioned-cache', 'https://docs.oracle.com/en/middleware/fusion-middleware/coherence/12.2.1.4/develop-applications/introduction-coherence.html', 'Introduction to Coherence', 'Oracle', null, 'Coherence 12.2.1.4; checked 2026-08-28', 'official-docs', 'primary', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', 'Supports only Coherence partitioned data, backup and rebalancing mechanisms as a narrow comparison; it does not prove the original flight design or general performance.'],
  ['src-oracle-coherence-backing-maps', 'https://docs.oracle.com/middleware/1221/coherence/develop-applications/cache_back.htm', 'Implementing Storage and Backing Maps', 'Oracle', null, 'Coherence 12.2.1; checked 2026-08-28', 'official-docs', 'primary', 'LicenseRef-All-Rights-Reserved', 'facts-and-short-quotation', 'Supports only Coherence backing-map and persistent-store mechanisms as a narrow recovery comparison; it does not prove the original flight design or general performance.'],
  ['src-gigaspaces-flight-availability-case', 'https://www.gigaspaces.com/case_studies/booking-and-flight-availability', 'Booking and Flight Availability', 'GigaSpaces', null, 'live customer case; checked 2026-08-28', 'vendor-reference-architecture', 'first-party', 'LicenseRef-All-Rights-Reserved', 'vendor-claims-separated', 'Supports only the vendor claim that a booking and flight-availability customer case was published; it does not prove the original flight design or general performance.'],
]);
export const REMOTE_CITATION_NOTES = Object.freeze([
  ['src-gigaspaces-sba-overview', 'Space-Based Architecture, GigaSpaces, XAP 16.2', 'Original Chinese factual summary limited to the documented definition, Processing Unit, partition-local service, data-affinity and primary-backup mechanisms; no source prose, structure or diagrams copied.'],
  ['src-gigaspaces-processing-unit-sla', 'Defining the SLA for Your Processing Unit, GigaSpaces, XAP 16.2.1', 'Original Chinese factual summary limited to documented Processing Unit deployment, SLA and primary-backup control mechanisms; no source prose, structure or diagrams copied.'],
  ['src-gigaspaces-split-brain-resolution', 'Availability Biased — Split Brain and Primary Resolution, GigaSpaces, XAP 16.2', 'Original Chinese factual summary limited to documented split-brain and primary-resolution mechanisms; no source prose, structure or diagrams copied.'],
  ['src-gigaspaces-proxy-connectivity', 'Proxy Connectivity, GigaSpaces, XAP 16.2', 'Original Chinese factual summary limited to documented proxy connectivity, discovery and rerouting mechanisms; no source prose, structure or diagrams copied.'],
  ['src-oracle-coherence-partitioned-cache', 'Introduction to Coherence, Oracle, Coherence 12.2.1.4', 'Original Chinese factual summary limited to documented Coherence partitioned-data, backup and rebalancing mechanisms as a narrow comparison; no source prose, structure or diagrams copied.'],
  ['src-oracle-coherence-backing-maps', 'Implementing Storage and Backing Maps, Oracle, Coherence 12.2.1', 'Original Chinese factual summary limited to documented Coherence backing-map and persistent-store mechanisms as a narrow comparison; no source prose, structure or diagrams copied.'],
  ['src-gigaspaces-flight-availability-case', 'Booking and Flight Availability, GigaSpaces customer case', 'Original Chinese vendor-claim-labeled summary limited to the existence of the published customer case; no metrics, customer quotations, source structure, logos, brand visuals or diagrams copied.'],
]);
export const ORIGINAL_SOURCE_CONTRACT = Object.freeze(['src-atlas-sty13-space-based-flight-availability', '/img/diagrams/sty-13-space-based-flight-availability.svg', 'Space-Based Architecture 航班余位亲和分区、主备与恢复边界图 SVG', 'Tego Arch maintainers', '2026-08-28', 'original-atlas synchronized drawio+svg published 2026-08-28', 'original-illustration', 'primary', 'LicenseRef-Atlas-Original', 'original-atlas', 'Original teaching topology for affinity routing, partition-local authority, primary-backup control, durable recovery and external itinerary coordination; illustration-only and not evidence of production outcomes.']);
const SOURCE_CONTRACT_FIELDS = Object.freeze(['id', 'canonical_locator', 'title', 'author_or_org', 'published_at', 'version', 'source_kind', 'tier', 'license', 'copyright_policy', 'usage_boundary']);
const ORIGINAL_RIGHTS_CONTRACT = Object.freeze({
  transport_locator: '/img/diagrams/sty-13-space-based-flight-availability.svg', query_insensitive: false, locator_aliases: [], tombstone: null,
  registered_at: '2026-08-28', checked_at: '2026-08-28', allowed_evidence_roles: ['illustration'],
  license_scope: 'The named project-authored sty-13-space-based-flight-availability.svg image/svg+xml asset only',
  license_evidence_url: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/sty-13-space-based-flight-availability.svg',
  license_evidence_note: 'Created as an original synchronized Draw.io/SVG topology using only approved article semantics, without third-party diagrams, reference imagery, brand visuals, signatures, watermarks or copied composition.',
  license_family_id: '/img/diagrams/sty-13-space-based-flight-availability.svg', license_family_grouping: 'identity', family_grouping_evidence_url: null, link_policy: null,
  expected_final_transport_locator: '/img/diagrams/sty-13-space-based-flight-availability.svg', expected_final_approved_at: '2026-08-28',
  expected_final_approval_note: 'Approved project-local original image/svg+xml identity after Task 3 pair, semantic, geometry, contrast and rendered raster QA.',
});
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
export const EPISTEMIC_CONTRACTS = Object.freeze([
  '**本站原创分析**：空间内状态是实时余位写权威；长期记录不得形成第二个同步可写权威。',
  '**本站原创分析**：先检查三层之间的所有权：入口只认证、限流和解析亲和键；',
  '**本站原创分析**：下面的说明性场景沿一笔请求追踪控制权。这八步均为本站设计，',
  '**本站原创分析**：图的结论不是“节点越多越快”，而是所有权可证明时才写。备份只有在隔离旧主、校验进度并进入新纪元后才能提升。无法确认唯一主分区时暂停写入，不能让双主继续售卖后再自动合并。',
  '**本站原创分析**：增加无关节点不会消除热门航班形成的热点分区。先用入口排队、每分区在途预算、租户公平限流与只读派生模型保护写路径；只有业务语义允许时才能拆分亲和键，且拆分不能产生两个可独立售卖同一余位的权威。',
]);
export const REGION_IDS = Object.freeze([
  'entry-routing-plane', 'affinity-partition-plane', 'recovery-coordination-plane',
]);
export const NODE_IDS = Object.freeze([
  'authenticated-entry', 'affinity-key', 'partition-router', 'route-epoch',
  'partition-a', 'query-a', 'hold-a', 'confirm-a', 'primary-a', 'backup-a',
  'partition-b', 'primary-b', 'backup-b',
  'hot-partition', 'hot-queue', 'hot-limit',
  'append-log', 'checkpoint-store', 'reservation-record',
  'itinerary-workflow', 'derived-read-model',
]);
export const EDGE_CONTRACTS = Object.freeze([
  ['authenticate-request', 'authenticated-entry', 'affinity-key', 'request-route', '认证请求'],
  ['derive-affinity-key', 'affinity-key', 'partition-router', 'request-route', '航段 + 出发日期'],
  ['resolve-owner', 'partition-router', 'route-epoch', 'request-route', '解析唯一所有者'],
  ['route-partition-a', 'route-epoch', 'primary-a', 'request-route', '路由分区 A'],
  ['route-partition-b', 'route-epoch', 'primary-b', 'request-route', '路由分区 B'],
  ['route-hot-partition', 'route-epoch', 'hot-queue', 'request-route', '热点排队'],
  ['query-local-a', 'query-a', 'partition-a', 'local-command', '本地查询'],
  ['hold-local-a', 'hold-a', 'partition-a', 'local-command', '本地暂留'],
  ['confirm-local-a', 'confirm-a', 'partition-a', 'local-command', '本地确认'],
  ['replicate-a', 'primary-a', 'backup-a', 'replication', '同步复制 A'],
  ['replicate-b', 'primary-b', 'backup-b', 'replication', '同步复制 B'],
  ['promote-backup-a', 'backup-a', 'primary-a', 'coordination', '隔离旧主 + 新纪元'],
  ['persist-append-log', 'partition-a', 'append-log', 'persistence', '追加日志'],
  ['write-checkpoint', 'partition-a', 'checkpoint-store', 'persistence', '写检查点'],
  ['publish-reservation-record', 'partition-a', 'reservation-record', 'persistence', '确认预订记录'],
  ['coordinate-partition-a', 'itinerary-workflow', 'partition-a', 'coordination', '步骤请求 A'],
  ['coordinate-partition-b', 'itinerary-workflow', 'partition-b', 'coordination', '步骤请求 B'],
  ['publish-derived-read-model', 'reservation-record', 'derived-read-model', 'persistence', '发布派生读模型'],
  ['stop-split-brain-write', 'route-epoch', 'primary-a', 'stop', '无唯一主权：停止写入'],
]);
export const EDGE_IDS = Object.freeze(EDGE_CONTRACTS.map(([id]) => id));
export const LEGEND_ROLES = Object.freeze([
  'request-route', 'local-command', 'replication', 'persistence', 'coordination', 'stop',
]);
const REQUIRED_WARNING = '非保证边界：跨分区事务、无限扩展、主备即持久、任意全局查询和脑裂自动合并均不成立';
const RENDER_SCALE = 800 / 2400;
const CSS_THRESHOLDS = Object.freeze({nodeRegion: 12, nodeHorizontal: 16, nodeVertical: 14, baseline: 22, glyphRoute: 8, glyphMarker: 16, edgeLabelNode: 12, legendCaptionMarker: 16});

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
    const element = {name: match[1], attributes: attributes(match[2]), parent: stack.at(-1) ?? null, children: [], index: elements.length, sourceIndex: match.index, openEnd: match.index + match[0].length, closeIndex: match.index + match[0].length};
    element.parent?.children.push(element); elements.push(element); if (!match[0].endsWith('/>')) stack.push(element);
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
function styleRules(source) { const rules = []; let order = 0; for (const [, rawSheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) { const sheet = decodeXmlText(rawSheet); for (const [, selectors, declarations] of sheet.replace(/\/\*[\s\S]*?\*\//gu, '').matchAll(/([^{}]+)\{([^{}]*)\}/gu)) for (const selector of selectors.split(',').map((item) => item.trim()).filter(Boolean)) rules.push({selector, declarations: cssDeclarations(declarations), specificity: selectorSpecificity(selector), order: order++}); } return rules; }
function simpleSelectorMatches(element, selector) { const simple = selector.trim(); if (!simple || /[+~>\s]/u.test(simple)) return false; if (simple.includes(':root') && element.parent) return false; if (simple.includes(':first-of-type') && element.parent?.children.find((candidate) => candidate.name === element.name) !== element) return false; const id = simple.match(/#([\w-]+)/u)?.[1]; const tag = simple.match(/^[A-Za-z][\w-]*/u)?.[0]; const classes = [...simple.matchAll(/\.([\w-]+)/gu)].map((match) => match[1]); const selectors = [...simple.matchAll(/\[([\w:-]+)(?:\s*=\s*["']?([^\]"']+)["']?)?\]/gu)]; return (!tag || element.name === tag) && (!id || element.attributes.get('id') === id) && classes.every((name) => (element.attributes.get('class') ?? '').split(/\s+/u).includes(name)) && selectors.every(([, key, value]) => element.attributes.has(key) && (value === undefined || element.attributes.get(key) === value.trim())); }
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
function semanticSegments(svg) { return svg.edges.flatMap((edge) => { const id = edge.attributes.get('data-edge-id'); return edgePathElements(svg, id).flatMap((path) => { const points = parsePathPoints(path.attributes.get('d')); return points.slice(1).map((end, index) => ({id, source: edge.attributes.get('data-source-id'), target: edge.attributes.get('data-target-id'), start: points[index], end})); }); }); }
function svgRegionBounds(svg) { return new Map(svg.elements.filter(({attributes: item}) => item.has('data-region-bounds')).map((region) => { const values = region.attributes.get('data-region-bounds').split(/\s+/u); return [region.attributes.get('data-region-id'), numericBounds(new Map(['x', 'y', 'width', 'height'].map((key, index) => [key, values[index]])), region.attributes.get('data-region-id'))]; })); }
function markerPathBounds(svg, marker) { const child = marker && svg.elements.find((element) => element.parent === marker && element.name === 'path'); assert.ok(child, (marker?.attributes.get('id') ?? 'marker') + ' marker path'); const coordinates = [...(child.attributes.get('d') ?? '').matchAll(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu)].map(([value]) => Number(value)); assert.ok(coordinates.length >= 4 && coordinates.length % 2 === 0 && coordinates.every(Number.isFinite), marker.attributes.get('id') + ' marker coordinate pairs'); const points = Array.from({length: coordinates.length / 2}, (_, index) => ({x: coordinates[index * 2], y: coordinates[index * 2 + 1]})); return {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
function transformedMarkerBox(svgSource, svg, path) { const markerId = /url\(#([^)]+)\)/u.exec(svgPresentationValue(svgSource, path, 'marker-end') ?? '')?.[1]; const marker = svg.elements.find((element) => element.name === 'marker' && element.attributes.get('id') === markerId); assert.ok(marker, (path.attributes.get('data-edge-id') ?? 'path') + ' marker definition'); const points = parsePathPoints(path.attributes.get('d')); const strokeWidth = number(svgPresentationValue(svgSource, path, 'stroke-width'), 'marker path stroke width'); const units = marker.attributes.get('markerUnits') ?? 'strokeWidth'; const unitScale = units === 'strokeWidth' ? strokeWidth : (assert.equal(units, 'userSpaceOnUse', 'supported marker units'), 1); const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.equal(viewBox.length, 4, markerId + ' marker viewBox'); return markerEnvelope(points.at(-1), points.at(-2), {width: number(marker.attributes.get('markerWidth'), markerId + ' width') * unitScale, height: number(marker.attributes.get('markerHeight'), markerId + ' height') * unitScale, refX: number(marker.attributes.get('refX'), markerId + ' refX'), refY: number(marker.attributes.get('refY'), markerId + ' refY'), viewBox, pathBounds: markerPathBounds(svg, marker), preserveAspectRatio: marker.attributes.get('preserveAspectRatio') ?? 'xMidYMid meet'}); }

function declaredBox(element, attribute, label) { const values = (element.attributes.get(attribute) ?? '').split(/\s+/u); assert.equal(values.length, 4, label + ' four-value bounds'); return numericBounds(new Map(['x', 'y', 'width', 'height'].map((key, index) => [key, values[index]])), label); }
function boxesOverlap(left, right) { return Math.max(left.left, right.left) < Math.min(left.right, right.right) && Math.max(left.top, right.top) < Math.min(left.bottom, right.bottom); }
function insetBox(box, amount) { return {left: box.left + amount, right: box.right - amount, top: box.top + amount, bottom: box.bottom - amount}; }
function assertBoxesClose(actual, expected, label) { for (const side of ['left', 'right', 'top', 'bottom']) assert.ok(Math.abs(actual[side] - expected[side]) <= .01, label + ' ' + side + ': ' + actual[side] + ' !== ' + expected[side]); }
function svgTextContent(source, element) { assert.equal(element.name, 'text', 'SVG text element'); return decodeXmlText(source.slice(element.openEnd, element.closeIndex).replace(/<[^>]+>/gu, '')).trim(); }
function svgPaintAlpha(source, element, property) { const paint = svgPresentationValue(source, element, property); if (paint === undefined || /^(?:none|transparent)$/iu.test(paint.trim()) || /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/iu.test(paint.trim()) || /^#[\da-f]{6}00$/iu.test(paint.trim())) return 0; let opacity = number(svgPresentationValue(source, element, property + '-opacity') ?? '1', property + ' opacity'); for (let current = element; current; current = current.parent) opacity *= number(ownSvgPresentationValue(source, current, 'opacity') ?? '1', 'SVG opacity'); return opacity; }
function actualTextBox(source, element) {
  const text = svgTextContent(source, element); assert.ok(text, 'visible SVG text content');
  const box = glyphBox({x: number(element.attributes.get('x'), text + ' x'), y: number(element.attributes.get('y'), text + ' y'), text, fontSize: number(svgPresentationValue(source, element, 'font-size'), text + ' font-size'), anchor: svgPresentationValue(source, element, 'text-anchor') ?? 'start'});
  const halfStroke = svgPaintAlpha(source, element, 'stroke') > 0 ? number(svgPresentationValue(source, element, 'stroke-width') ?? '1', text + ' text stroke') / 2 : 0;
  return expandedBox(box, halfStroke);
}
function rawShapeBox(element) {
  let box;
  if (element.name === 'rect') box = numericBounds(element.attributes, element.attributes.get('id') ?? 'rect');
  else if (element.name === 'circle') { const cx = number(element.attributes.get('cx'), 'circle cx'); const cy = number(element.attributes.get('cy'), 'circle cy'); const radius = number(element.attributes.get('r'), 'circle radius'); box = {left: cx - radius, right: cx + radius, top: cy - radius, bottom: cy + radius}; }
  else if (element.name === 'ellipse') { const cx = number(element.attributes.get('cx'), 'ellipse cx'); const cy = number(element.attributes.get('cy'), 'ellipse cy'); const rx = number(element.attributes.get('rx'), 'ellipse rx'); const ry = number(element.attributes.get('ry'), 'ellipse ry'); box = {left: cx - rx, right: cx + rx, top: cy - ry, bottom: cy + ry}; }
  else if (['polygon', 'polyline'].includes(element.name)) { const coordinates = [...(element.attributes.get('points') ?? '').matchAll(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu)].map(Number); assert.ok(coordinates.length >= 4 && coordinates.length % 2 === 0, element.name + ' coordinate pairs'); const xs = coordinates.filter((_, index) => index % 2 === 0); const ys = coordinates.filter((_, index) => index % 2 === 1); box = {left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys)}; }
  else if (element.name === 'line') { const x1 = number(element.attributes.get('x1'), 'line x1'); const x2 = number(element.attributes.get('x2'), 'line x2'); const y1 = number(element.attributes.get('y1'), 'line y1'); const y2 = number(element.attributes.get('y2'), 'line y2'); box = {left: Math.min(x1, x2), right: Math.max(x1, x2), top: Math.min(y1, y2), bottom: Math.max(y1, y2)}; }
  else if (element.name === 'path') { const points = parsePathPoints((element.attributes.get('d') ?? '').replace(/[Zz]/gu, '')); box = {left: Math.min(...points.map(({x}) => x)), right: Math.max(...points.map(({x}) => x)), top: Math.min(...points.map(({y}) => y)), bottom: Math.max(...points.map(({y}) => y))}; }
  else assert.fail('unsupported painted geometry ' + element.name);
  return box;
}
function actualShapeBox(source, element) { const box = rawShapeBox(element); const halfStroke = svgPaintAlpha(source, element, 'stroke') > 0 ? number(svgPresentationValue(source, element, 'stroke-width') ?? '1', element.name + ' stroke') / 2 : 0; return expandedBox(box, halfStroke); }
function assertDeclaredGeometry(element, attribute, actual, label) { if (element.attributes.has(attribute)) assertBoxesClose(declaredBox(element, attribute, label + ' metadata'), actual, label + ' metadata matches painted geometry'); }
function assertSemanticBoundaries(svg) {
  const contracts = svg.edges.map((edge) => ({id: edge.attributes.get('data-edge-id'), source: edge.attributes.get('data-source-id'), target: edge.attributes.get('data-target-id'), role: edge.attributes.get('data-legend-role')}));
  for (const edge of contracts) {
    assert.equal(edge.role === 'local-command' && /^backup-/u.test(edge.target), false, 'backup business writes are forbidden');
    assert.equal(edge.source === 'reservation-record' && /^partition-/u.test(edge.target), false, 'database direct-write edge is forbidden');
    assert.equal(/^partition-[ab]$/u.test(edge.source) && /^partition-[ab]$/u.test(edge.target) && edge.source !== edge.target, false, 'multi-partition direct transaction edge is forbidden');
  }
  const stop = contracts.find(({id}) => id === 'stop-split-brain-write');
  assert.deepEqual(stop, {id: 'stop-split-brain-write', source: 'route-epoch', target: 'primary-a', role: 'stop'}, 'split brain cannot continue writes');
}

function assertSpaceBasedGeometry(drawioSource, svgSource, drawio, svg) {
  const nodeById = new Map(drawio.nodes.map((node) => [node.attributes.get('id'), node]));
  const drawioRegions = drawio.nodes.filter(({attributes: item}) => styleMap(item.get('style')).get('semanticRole') === 'region');
  const svgRegions = svg.elements.filter(({attributes: item}) => item.has('data-region-id'));
  exactIds(drawioRegions.map(({attributes: item}) => item.get('id')), REGION_IDS, 'Draw.io regions');
  exactIds(svgRegions.map(({attributes: item}) => item.get('data-region-id')), REGION_IDS, 'SVG regions');
  const drawioRegionBounds = new Map(drawioRegions.map((region) => [region.attributes.get('id'), numericBounds(region.geometry, region.attributes.get('id'))]));
  const declaredRegionBounds = svgRegionBounds(svg); exactIds([...declaredRegionBounds.keys()], REGION_IDS, 'SVG declared region bounds');
  const renderedRegionBounds = new Map(svgRegions.map((region) => {
    const id = region.attributes.get('data-region-id'); const shape = svg.elements.find((element) => element.parent === region && element.name === 'rect'); assert.ok(shape && !hiddenSvgElement(svgSource, shape), id + ' visible region shape');
    const rawBox = rawShapeBox(shape); assertBoxesClose(declaredRegionBounds.get(id), rawBox, id + ' declared bounds match real region geometry'); assertBoxesClose(drawioRegionBounds.get(id), rawBox, id + ' synchronized Draw.io/SVG region geometry');
    return [id, insetBox(rawBox, number(svgPresentationValue(svgSource, shape, 'stroke-width') ?? '0', id + ' region stroke') / 2)];
  }));

  const drawioNodes = drawio.nodes.filter(({attributes: item}) => styleMap(item.get('style')).get('semanticRole') === 'node-shape');
  exactIds(drawioNodes.map(({attributes: item}) => item.get('id').replace(/^node-/u, '')), NODE_IDS, 'Draw.io nodes');
  exactIds(svg.nodes.map(({attributes: item}) => item.get('data-node-id')), NODE_IDS, 'SVG nodes');
  const drawioRegionIds = new Set(REGION_IDS);
  for (const node of drawioNodes) assert.ok(drawioRegionIds.has(node.attributes.get('parent')), node.attributes.get('id') + ' direct Draw.io region child');
  for (const node of svg.nodes) assert.ok(node.parent?.attributes.has('data-region-id') && drawioRegionIds.has(node.parent.attributes.get('data-region-id')), node.attributes.get('data-node-id') + ' direct SVG region child');
  const drawioNodeBySemanticId = new Map(drawioNodes.map((node) => [node.attributes.get('id').replace(/^node-/u, ''), node]));
  const nodeBounds = new Map(svg.nodes.map((node) => {
    const id = node.attributes.get('data-node-id'); const shape = svg.elements.find((element) => element.parent === node && element.attributes.get('data-node-shape-for') === id); assert.ok(shape && ['rect', 'ellipse', 'circle'].includes(shape.name), id + ' visible node shape'); assert.equal(hiddenSvgElement(svgSource, shape), false, id + ' visible node geometry');
    const rawBox = rawShapeBox(shape); assertBoxesClose(rawBox, absoluteDrawioBounds(drawioNodeBySemanticId.get(id), nodeById), id + ' synchronized Draw.io/SVG node geometry');
    const visibleBox = actualShapeBox(svgSource, shape); const region = renderedRegionBounds.get(node.parent.attributes.get('data-region-id')); const minimumRegion = CSS_THRESHOLDS.nodeRegion / RENDER_SCALE;
    assert.ok(visibleBox.left - region.left >= minimumRegion && region.right - visibleBox.right >= minimumRegion && visibleBox.top - region.top >= minimumRegion && region.bottom - visibleBox.bottom >= minimumRegion, id + ' >= 12px visible stroke-envelope to region-inner-stroke padding at 800px');
    const texts = svg.elements.filter((element) => element.parent === node && element.name === 'text'); assert.equal(texts.length, 2, id + ' exact title/type text lines'); const textBoxes = texts.map((text) => actualTextBox(svgSource, text));
    for (const [index, textBox] of textBoxes.entries()) assert.ok(textBox.left - visibleBox.left >= CSS_THRESHOLDS.nodeHorizontal / RENDER_SCALE && visibleBox.right - textBox.right >= CSS_THRESHOLDS.nodeHorizontal / RENDER_SCALE, id + ' line ' + (index + 1) + ' >= 16px horizontal glyph padding');
    assert.ok(textBoxes[0].top - visibleBox.top >= CSS_THRESHOLDS.nodeVertical / RENDER_SCALE, id + ' >= 14px title top padding'); assert.ok(visibleBox.bottom - textBoxes.at(-1).bottom >= CSS_THRESHOLDS.nodeVertical / RENDER_SCALE, id + ' >= 14px type bottom padding');
    assert.ok((number(texts[1].attributes.get('y'), id + ' type baseline') - number(texts[0].attributes.get('y'), id + ' title baseline')) * RENDER_SCALE >= CSS_THRESHOLDS.baseline, id + ' >= 22px title/type baseline separation');
    assert.ok(number(svgPresentationValue(svgSource, texts[0], 'font-size'), id + ' title font') * RENDER_SCALE >= 15 && number(svgPresentationValue(svgSource, texts[1], 'font-size'), id + ' type font') * RENDER_SCALE >= 10, id + ' minimum rendered title/type text sizes');
    return [id, visibleBox];
  }));

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
    assert.deepEqual([svgEdge.attributes.get('data-source-id'), svgEdge.attributes.get('data-target-id'), svgEdge.attributes.get('data-legend-role'), svgEdge.attributes.get('data-label')], [source, target, role, label], id + ' SVG endpoint/role/label contract');
    assert.ok(svgPresentationValue(svgSource, svgEdge, 'marker-end'), id + ' color-independent terminal marker');
    assert.ok(svgPresentationValue(svgSource, svgEdge, 'stroke-dasharray'), id + ' color-independent dash pattern');
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
  const labels = svg.elements.filter(({attributes: item}) => item.has('data-edge-label-for'));
  exactIds(labels.map(({attributes: item}) => item.get('data-edge-label-for')), EDGE_IDS, 'SVG edge labels');
  for (const label of labels) {
    const id = label.attributes.get('data-edge-label-for'); const bounds = actualTextBox(svgSource, label); assertDeclaredGeometry(label, 'data-label-bounds', bounds, id + ' label');
    assert.equal(hiddenSvgElement(svgSource, label), false, id + ' visible edge label');
    for (const [nodeId, box] of nodeBounds) assert.ok(boxDistance(bounds, box) >= CSS_THRESHOLDS.edgeLabelNode / RENDER_SCALE, id + ' >= 12px label clearance from ' + nodeId);
    const routeSegments = segments.filter((segment) => segment.id === id); const strokeWidth = number(svgPresentationValue(svgSource, svgById.get(id), 'stroke-width'), id + ' stroke width');
    for (const segment of routeSegments) assert.ok(boxDistance(bounds, segmentEnvelope(segment.start, segment.end, strokeWidth / 2)) >= CSS_THRESHOLDS.glyphRoute / RENDER_SCALE, id + ' >= 8px glyph-to-stroke clearance');
    assert.ok(boxDistance(bounds, transformedMarkerBox(svgSource, svg, edgePathElements(svg, id).at(-1))) >= CSS_THRESHOLDS.glyphMarker / RENDER_SCALE, id + ' >= 16px glyph-to-marker clearance');
    for (const later of svg.elements.slice(label.index + 1).filter((element) => ['rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'path'].includes(element.name) && !hiddenSvgElement(svgSource, element))) {
      if (later.attributes.has('data-edge-id') || later.attributes.has('data-edge-segment-for')) continue;
      const paint = actualShapeBox(svgSource, later); assertDeclaredGeometry(later, 'data-paint-bounds', paint, 'later paint'); assert.equal(boxesOverlap(bounds, paint), false, id + ' label has no later painted occluder');
    }
  }
  const drawioLegends = drawio.nodes.filter(({attributes: item}) => styleMap(item.get('style')).get('semanticRole') === 'legend');
  exactIds(drawioLegends.map(({attributes: item}) => item.get('id').replace(/^legend-/u, '')), LEGEND_ROLES, 'Draw.io legend roles');
  const svgLegends = svg.elements.filter(({attributes: item}) => item.has('data-legend-id'));
  exactIds(svgLegends.map(({attributes: item}) => item.get('data-legend-id')), LEGEND_ROLES, 'SVG legend roles');
  for (const role of LEGEND_ROLES) {
    const legend = svgLegends.find(({attributes: item}) => item.get('data-legend-id') === role); const swatch = svg.elements.find((element) => element.parent === legend && element.attributes.get('data-legend-swatch-for') === role); const caption = svg.elements.find((element) => element.parent === legend && element.attributes.get('data-legend-caption-for') === role);
    assert.ok(swatch && caption, role + ' legend swatch and caption');
    assert.equal(hiddenSvgElement(svgSource, caption), false, role + ' visible legend caption');
    const swatchBounds = actualShapeBox(svgSource, swatch); const captionBounds = actualTextBox(svgSource, caption); assertDeclaredGeometry(swatch, 'data-paint-bounds', swatchBounds, role + ' legend swatch'); assertDeclaredGeometry(caption, 'data-label-bounds', captionBounds, role + ' legend caption');
    assert.ok(boxDistance(swatchBounds, captionBounds) >= CSS_THRESHOLDS.legendCaptionMarker / RENDER_SCALE, role + ' >= 16px legend caption/marker clearance');
  }
  assertSemanticBoundaries(svg);
}

function assertSpaceBasedArticle(source) {
  const {body} = articleParts(source); const visibleBody = visibleArticleBody(body); assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact STY-13 front matter');
  const headings = findMarkdownHeadings(source); assert.deepEqual(headings.filter(({level}) => level === 2).map(({text}) => text), EXPECTED_HEADINGS, 'exact H2 order');
  const migration = headings.find(({level, text}) => level === 2 && text === '可迁移经验'); const next = headings.find(({level, offset}) => level === 2 && offset > migration.offset);
  assert.deepEqual(headings.filter(({level, offset}) => level === 3 && offset > migration.offset && (!next || offset < next.offset)).map(({text}) => text), MIGRATION_HEADINGS, 'exact migration H3 order');
  for (const label of WRAPPERS) assert.match(source, new RegExp('<div\\b(?=[^>]*role="region")(?=[^>]*aria-label="' + escapeRegExp(label) + '")(?=[^>]*tabIndex=\\{0\\})(?=[^>]*onKeyDown=\\{handleHorizontalArrowKey\\})[^>]*>', 'u'), label + ' keyboard wrapper');
  assert.match(source, /<div\b(?=[^>]*className="architecture-diagram-scroll")(?=[^>]*aria-label="Space-Based Architecture 航班余位亲和分区、主备与恢复边界图，可横向滚动")[^>]*>/u, 'diagram uses the responsive architecture wrapper');
  assert.equal((source.match(/role="region"/gu) ?? []).length, 4, 'exactly four wrappers');
  assert.equal(markdownTables(body).length, 3, 'exactly three STY-13 Markdown tables');
  exactRows(table(body, COMPARISON_HEADERS), COMPARISON_ROWS, 'comparison table'); exactRows(table(body, OPERATION_HEADERS), OPERATION_ROWS, 'operation table'); exactRows(table(body, FAILURE_HEADERS), FAILURE_ROWS, 'failure table');
  for (const sentence of REQUIRED_SENTENCES) assert.ok(visibleBody.includes(sentence), 'visible boundary: ' + sentence);
  for (const statement of EPISTEMIC_CONTRACTS) assert.ok(visibleBody.includes(statement), 'explicit epistemic label: ' + statement);
}
function assertSpaceBasedSources(ledger) {
  const document = ledger.documents?.[ARTICLE]; assert.ok(document, 'STY-13 governed source document'); assert.equal(document.reviewed_at, '2026-08-28', 'exact STY-13 source review date'); assert.deepEqual(document.copyright_checks, ['original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights'], 'exact STY-13 copyright checks'); assert.deepEqual(document.citations.map(({source_id}) => source_id), SOURCE_IDS, 'exact ordered STY-13 citations');
  const sourceById = new Map(ledger.sources.map((source) => [source.id, source]));
  const citationById = new Map(document.citations.map((citation) => [citation.source_id, citation]));
  const notesById = new Map(REMOTE_CITATION_NOTES.map(([id, attribution_note, modification_note]) => [id, {attribution_note, modification_note}]));
  for (const [index, contract] of REMOTE_SOURCE_CONTRACTS.entries()) {
    const expected = Object.fromEntries(SOURCE_CONTRACT_FIELDS.map((field, fieldIndex) => [field, contract[fieldIndex]])); const source = sourceById.get(expected.id); const citation = citationById.get(expected.id);
    assert.ok(source && citation, expected.id + ' governed remote source and citation');
    assert.deepEqual(Object.fromEntries(SOURCE_CONTRACT_FIELDS.map((field) => [field, source[field]])), expected, expected.id + ' exact remote identity, provenance, rights and usage boundary');
    assert.equal(source.transport_locator, expected.canonical_locator, expected.id + ' exact transport locator'); assert.equal(source.registered_at, '2026-08-28', expected.id + ' registration date'); assert.equal(source.checked_at, '2026-08-28', expected.id + ' check date');
    assert.equal(citation.citation_url, expected.canonical_locator, expected.id + ' exact citation locator'); assert.deepEqual(citation.roles, source.allowed_evidence_roles, expected.id + ' citation roles stay within source contract');
    assert.equal(citation.usage_mode, 'facts-summary', expected.id + ' remote citation uses facts-summary'); assert.equal(citation.manifest_primary, index === 0, expected.id + ' exact primary selection'); assert.deepEqual({attribution_note: citation.attribution_note, modification_note: citation.modification_note}, notesById.get(expected.id), expected.id + ' exact attribution and modification notes'); assert.equal(citation.excerpt, null); assert.equal(citation.quotation_reviewed, false);
  }
  const originalExpected = {...Object.fromEntries(SOURCE_CONTRACT_FIELDS.map((field, index) => [field, ORIGINAL_SOURCE_CONTRACT[index]])), ...ORIGINAL_RIGHTS_CONTRACT};
  const original = sourceById.get(originalExpected.id); const originalCitation = citationById.get(originalExpected.id); assert.ok(original && originalCitation, 'STY-13 governed original illustration and citation'); assert.deepEqual(original, originalExpected, 'exact original illustration identity and rights contract');
  assert.deepEqual(originalCitation, {
    source_id: originalExpected.id, citation_url: originalExpected.canonical_locator, roles: ['illustration'], manifest_primary: false, usage_mode: 'original-illustration',
    attribution_note: 'Space-Based Architecture 航班余位亲和分区、主备与恢复边界图，Tego Arch maintainers',
    modification_note: 'Created as the Task 3 original synchronized Draw.io/SVG pair using only approved article semantics without third-party diagrams, reference imagery, logos, brand visuals, signatures, watermarks or copied composition.',
    excerpt: null, quotation_reviewed: false,
  }, 'exact original illustration citation contract');
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1, 'STY-13 has one primary source');
}
function assertSpaceBasedDiagram(drawioSource, svgSource) {
  assert.ok(drawioSource && svgSource, 'STY-13 Draw.io and SVG assets exist'); const drawio = parseDrawio(drawioSource); const svg = parseSvg(svgSource); assertFlattenedSvg(svg.elements);
  const root = svg.elements.find(({name}) => name === 'svg'); assert.equal(root?.attributes.get('role'), 'img', 'accessible SVG role'); assert.equal(root?.attributes.get('aria-labelledby'), 'sty13-title sty13-desc', 'STY-13 SVG labelling');
  assert.match(svgSource, /^<svg\b[^>]*>\s*<title id="sty13-title">Space-Based Architecture 航班余位亲和分区、主备与恢复边界<\/title>\s*<desc id="sty13-desc">入口按航段与出发日期生成亲和键并路由到唯一分区所有者；每个处理单元共置余位状态和本地服务，同步备份只在确认唯一主权后提升，日志、检查点、长期记录和外部工作流分别承担恢复、审计与多航段协调。<\/desc>/u);
  assert.doesNotMatch(svgSource, /<(?:foreignObject|image|script)\b|@font-face|Logo|logo|watermark|水印/iu, 'no embedded HTML, image, script, external font, logo, or watermark');
  assert.equal(root?.attributes.get('width'), '100%', 'responsive SVG width'); assert.equal(root?.attributes.has('height'), false, 'SVG omits fixed rendered height');
  const viewBox = (root?.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number); assert.deepEqual(viewBox, [0, 0, 2400, 3600], 'exact 2400x3600 SVG viewBox');
  assert.ok(drawio.nodes.some((cell) => cell.label === REQUIRED_WARNING && !hiddenDrawioCell(cell)), 'visible Draw.io warning band');
  assert.ok(svg.elements.some((element) => element.name === 'text' && svgSource.slice(element.openEnd, element.closeIndex) === REQUIRED_WARNING && !hiddenSvgElement(svgSource, element)), 'visible SVG warning band');
  assertSpaceBasedGeometry(drawioSource, svgSource, drawio, svg);
}
function assertDiagramMutationRejections(drawioSource, svgSource) {
  assert.throws(() => assertSpaceBasedDiagram(replaceOnce(drawioSource, 'id="node-affinity-key"', 'id="node-authenticated-entry"', 'duplicate Draw.io ID'), svgSource), /duplicate-free|exact identities/u, 'duplicate identities rejected');
  assert.throws(() => assertSpaceBasedDiagram(replaceOnce(drawioSource, ' source="node-authenticated-entry"', '', 'missing real source terminal'), svgSource), /endpoint\/role\/label contract|real terminals/u, 'missing terminals rejected');
  const extraProcessingUnit = replaceOnce(drawioSource, '</root>', '<mxCell id="node-partition-c" value="额外处理单元" vertex="1" parent="affinity-partition-plane" style="semanticRole=node-shape;"><mxGeometry x="100" y="100" width="300" height="180" as="geometry"/></mxCell></root>', 'extra processing unit');
  assert.throws(() => assertSpaceBasedDiagram(extraProcessingUnit, svgSource), /exact identities/u, 'extra processing units rejected');
  const semanticMutation = (edge) => parseSvg(replaceOnce(svgSource, '</svg>', edge + '</svg>', 'semantic edge mutation'));
  assert.throws(() => assertSemanticBoundaries(semanticMutation('<path data-edge-id="fixture-backup-write" data-source-id="hold-a" data-target-id="backup-a" data-legend-role="local-command"/>')), /backup business writes/u, 'backup business writes rejected');
  assert.throws(() => assertSemanticBoundaries(semanticMutation('<path data-edge-id="fixture-db-write" data-source-id="reservation-record" data-target-id="partition-a" data-legend-role="persistence"/>')), /database direct-write/u, 'database direct writes rejected');
  assert.throws(() => assertSemanticBoundaries(semanticMutation('<path data-edge-id="fixture-cross-partition" data-source-id="partition-a" data-target-id="partition-b" data-legend-role="local-command"/>')), /multi-partition direct transaction/u, 'multi-partition direct transactions rejected');
  assert.throws(() => assertSemanticBoundaries(parseSvg(replaceOnce(svgSource, 'data-edge-id="stop-split-brain-write" data-source-id="route-epoch" data-target-id="primary-a" data-legend-role="stop"', 'data-edge-id="stop-split-brain-write" data-source-id="route-epoch" data-target-id="primary-a" data-legend-role="local-command"', 'split-brain continue write'))), /split brain cannot continue writes/u, 'split-brain continue-write edge rejected');
  assert.throws(() => assertSpaceBasedDiagram(drawioSource, replaceOnce(svgSource, 'data-edge-label-for="authenticate-request"', 'opacity="0" data-edge-label-for="authenticate-request"', 'hidden edge label')), /visible edge label/u, 'hidden labels rejected');
  assert.throws(() => assertSpaceBasedDiagram(drawioSource, replaceOnce(svgSource, 'data-edge-label-for="authenticate-request" data-label-bounds="510 603.1 180 46.8" x="510"', 'data-edge-label-for="authenticate-request" data-label-bounds="510 603.1 180 46.8" x="550"', 'moved real label with stale metadata')), /metadata matches painted geometry/u, 'stale label metadata cannot hide moved glyph geometry');
  assert.throws(() => assertSpaceBasedDiagram(drawioSource, replaceOnce(svgSource, '</svg>', '<rect x="510" y="570" width="180" height="55" fill="#fff"/></svg>', 'unannotated later paint mask')), /later painted occluder/u, 'unannotated later white masks rejected from actual paint');
  assert.throws(() => assertSpaceBasedDiagram(drawioSource, replaceOnce(svgSource, 'data-node-shape-for="affinity-key" x="650"', 'data-node-shape-for="affinity-key" x="651"', 'SVG node geometry drift')), /synchronized Draw.io\/SVG node geometry/u, 'SVG node geometry cannot drift from Draw.io');
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
  const reciprocalSources = new Map(RECIPROCAL_CONTRACTS.map(([path]) => [path, readFileSync(path, 'utf8')])); assertReciprocalRelations(reciprocalSources);
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
function assertReciprocalRelations(sources) {
  for (const [path, sentence] of RECIPROCAL_CONTRACTS) { const source = sources.get(path); assert.ok(source, path + ' reciprocal source'); assert.equal(source.split(sentence).length - 1, 1, path + ' exact reciprocal sentence occurs once'); }
  for (const path of ADJACENT_CONTRACT_FILES) { const metadata = parseFrontMatter(sources.get(path)); assert.equal(metadata.adjacent_topics.filter((topic) => topic === TOPIC_ID).length, 1, path + ' adjacent_topics contains STY-13 exactly once'); assert.equal(metadata.adjacent_topics.includes(NEXT_TOPIC), false, path + ' adjacent_topics excludes STY-14'); }
}
function fixtureArticle() {
  const sections = EXPECTED_HEADINGS.map((heading) => '## ' + heading + (heading === '可迁移经验' ? '\n### ' + MIGRATION_HEADINGS.join('\n### ') : '')).join('\n'); const rows = (items) => items.map((row) => '| ' + row.join(' | ') + ' |').join('\n');
  const labeledBoundaries = REQUIRED_SENTENCES.map((sentence) => sentence === REQUIRED_SENTENCES[2] ? EPISTEMIC_CONTRACTS[0] : sentence === REQUIRED_SENTENCES[4] ? EPISTEMIC_CONTRACTS[3] : sentence === REQUIRED_SENTENCES[6] ? EPISTEMIC_CONTRACTS[4] : sentence);
  return '---\n' + frontMatterFixture(EXACT_METADATA) + '\n---\n' + sections + '\n' + WRAPPERS.map((label, index) => '<div ' + (index === 0 ? 'className="architecture-diagram-scroll" ' : '') + 'role="region" aria-label="' + label + '" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>').join('\n') + '\n| ' + COMPARISON_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- | --- |\n' + rows(COMPARISON_ROWS) + '\n\n| ' + OPERATION_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- |\n' + rows(OPERATION_ROWS) + '\n\n| ' + FAILURE_HEADERS.join(' | ') + ' |\n| --- | --- | --- | --- |\n' + rows(FAILURE_ROWS) + '\n' + labeledBoundaries.join('\n') + '\n' + EPISTEMIC_CONTRACTS.slice(1, 3).join('\n');
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
  const transparentStroke = '<svg><rect x="0" y="0" width="10" height="10" fill="#fff" stroke="#000" stroke-width="10" stroke-opacity="0"/></svg>'; const transparentStrokeShape = parseSvg(transparentStroke).elements.at(-1);
  assert.deepEqual(actualShapeBox(transparentStroke, transparentStrokeShape), {left: 0, right: 10, top: 0, bottom: 10}, 'transparent stroke does not enlarge painted geometry');
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
  assertGenericHelperRejections(); assert.equal(architectureCaseTopicIds.has(TOPIC_ID), true, 'STY-13 uses architecture-case contract');
  assert.deepEqual(sty13ArchitectureCaseHeadings, EXPECTED_HEADINGS.map((heading) => '## ' + heading), 'STY-13 specialized schema headings');
  assert.equal(knowledgeHeadingContract('style', TOPIC_ID), sty13ArchitectureCaseHeadings, 'STY-13 resolves its specialized schema headings before the generic architecture-case contract');
  const fixture = fixtureArticle(); assertSpaceBasedArticle(fixture);
  for (const key of Object.keys(EXACT_METADATA)) { assert.throws(() => assertSpaceBasedArticle(removeFrontMatterField(fixture, key)), assert.AssertionError, key + ' deletion rejected'); assert.throws(() => assertSpaceBasedArticle(changeFrontMatterField(fixture, key)), assert.AssertionError, key + ' change rejected'); }
  for (const [headers, rows] of [[COMPARISON_HEADERS, COMPARISON_ROWS], [OPERATION_HEADERS, OPERATION_ROWS], [FAILURE_HEADERS, FAILURE_ROWS]]) { const header = '| ' + headers.join(' | ') + ' |'; assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, header, '| 错误表头 |', 'header')), assert.AssertionError, 'wrong table header rejected'); for (const row of rows) { const exact = '| ' + row.join(' | ') + ' |'; assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, exact, '| ' + [...row.slice(0, -1), '错误的合同值'].join(' | ') + ' |', row[0])), assert.AssertionError, row[0] + ' mutation rejected'); } }
  assert.throws(() => assertSpaceBasedArticle(fixture + '\n| 第四张 | 表 |\n| --- | --- |\n| 不允许 | 出现 |\n'), /exactly three STY-13 Markdown tables/u, 'fourth Markdown table rejected');
  for (const sentence of REQUIRED_SENTENCES) assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, sentence, '错误的事实边界。', sentence)), assert.AssertionError, sentence + ' mutation rejected');
  for (const statement of EPISTEMIC_CONTRACTS) assert.throws(() => assertSpaceBasedArticle(replaceOnce(fixture, statement, statement.replace('**本站原创分析**：', '**说明性场景**：'), statement)), assert.AssertionError, statement + ' label mutation rejected');

  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8')); assertSpaceBasedSources(ledger);
  const mutate = (callback) => { const copy = structuredClone(ledger); callback(copy); return copy; };
  for (const [id] of REMOTE_SOURCE_CONTRACTS) for (const field of [...SOURCE_CONTRACT_FIELDS.slice(1), 'transport_locator', 'registered_at', 'checked_at']) assert.throws(() => assertSpaceBasedSources(mutate((copy) => { copy.sources.find((source) => source.id === id)[field] = field === 'published_at' ? '2026-08-27' : 'mutated'; })), assert.AssertionError, id + ' ' + field + ' mutation rejected');
  for (const [id] of REMOTE_CITATION_NOTES) for (const field of ['attribution_note', 'modification_note']) assert.throws(() => assertSpaceBasedSources(mutate((copy) => { copy.documents[ARTICLE].citations.find((citation) => citation.source_id === id)[field] = 'mutated'; })), assert.AssertionError, id + ' ' + field + ' mutation rejected');
  assert.throws(() => assertSpaceBasedSources(mutate((copy) => { copy.documents[ARTICLE].reviewed_at = '2026-08-27'; })), /exact STY-13 source review date/u, 'wrong document review date rejected');
  assert.throws(() => assertSpaceBasedSources(mutate((copy) => { copy.documents[ARTICLE].copyright_checks.pop(); })), /exact STY-13 copyright checks/u, 'incomplete copyright checks rejected');
  const originalId = ORIGINAL_SOURCE_CONTRACT[0];
  for (const field of [...SOURCE_CONTRACT_FIELDS.slice(1), ...Object.keys(ORIGINAL_RIGHTS_CONTRACT)]) assert.throws(() => assertSpaceBasedSources(mutate((copy) => { const source = copy.sources.find((item) => item.id === originalId); source[field] = Array.isArray(source[field]) ? ['mutated'] : source[field] === null ? 'mutated' : typeof source[field] === 'boolean' ? !source[field] : 'mutated'; })), assert.AssertionError, originalId + ' ' + field + ' mutation rejected');
  assert.throws(() => assertSpaceBasedSources(mutate((copy) => { copy.documents[ARTICLE].citations[0].usage_mode = 'original-illustration'; })), /remote citation uses facts-summary/u, 'remote source cannot masquerade as an original illustration');
  assert.throws(() => assertSpaceBasedSources(mutate((copy) => { copy.documents[ARTICLE].citations.at(-1).usage_mode = 'facts-summary'; })), /exact original illustration citation contract/u, 'original illustration cannot use facts-summary');

  const reciprocalSources = new Map(RECIPROCAL_CONTRACTS.map(([path]) => [path, readFileSync(path, 'utf8')])); assertReciprocalRelations(reciprocalSources);
  const mutateReciprocal = (path, change) => { const copy = new Map(reciprocalSources); copy.set(path, change(copy.get(path))); return copy; };
  for (const [path, sentence] of RECIPROCAL_CONTRACTS) {
    assert.throws(() => assertReciprocalRelations(mutateReciprocal(path, (source) => replaceOnce(source, sentence, '', path + ' deletion'))), /exact reciprocal sentence occurs once/u, path + ' reciprocal deletion rejected');
    assert.throws(() => assertReciprocalRelations(mutateReciprocal(path, (source) => replaceOnce(source, sentence, sentence.replace('决策', '决斥'), path + ' typo'))), /exact reciprocal sentence occurs once/u, path + ' reciprocal typo rejected');
    assert.throws(() => assertReciprocalRelations(mutateReciprocal(path, (source) => source + '\n' + sentence + '\n')), /exact reciprocal sentence occurs once/u, path + ' reciprocal duplicate rejected');
  }
  for (const path of ADJACENT_CONTRACT_FILES) {
    assert.throws(() => assertReciprocalRelations(mutateReciprocal(path, (source) => replaceOnce(source, '  - STY-13\n', '', path + ' adjacent deletion'))), /contains STY-13 exactly once/u, path + ' missing STY-13 adjacency rejected');
    assert.throws(() => assertReciprocalRelations(mutateReciprocal(path, (source) => replaceOnce(source, '  - STY-13\n', '  - STY-13\n  - STY-13\n', path + ' adjacent duplicate'))), /contains STY-13 exactly once/u, path + ' duplicate STY-13 adjacency rejected');
    assert.throws(() => assertReciprocalRelations(mutateReciprocal(path, (source) => replaceOnce(source, '  - STY-13\n', '  - STY-13\n  - STY-14\n', path + ' STY-14 adjacency'))), /excludes STY-14/u, path + ' STY-14 adjacency rejected');
  }
});
test('STY-13 article, governed sources, relations and Stage A projection satisfy Task 2', async () => {
  const source = file(ARTICLE); assert.ok(source, ARTICLE + ' must exist after implementation'); assertSpaceBasedArticle(source); assertSpaceBasedSources(JSON.parse(readFileSync('data/source-ledger.json', 'utf8'))); await assertRelationsAndStage();
});
test('STY-13 synchronized diagram satisfies Task 3 semantic, geometry and mutation contracts', () => {
  const drawio = file(DRAWIO); const svg = file(SVG); assertSpaceBasedDiagram(drawio, svg); assertDiagramMutationRejections(drawio, svg);
});
