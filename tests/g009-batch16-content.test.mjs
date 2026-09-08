import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {parseFrontMatter} from '../scripts/content-metadata.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';
import {parseSourceLedger} from '../scripts/source-ledger.mjs';
import {parseXml, xmlElements, xmlTextContent, svgPresentationState} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

// Approved design values are independent of mutable production artifacts.
export const BASELINE = 'd0ba33e2f9dd2b66eacf2b46de7757f65754b191';
export const ARTICLE = 'content/patterns/ddd-01-strategic-ddd-overview.mdx';
export const ROUTE = '/patterns/ddd-01';
export const DRAWIO = 'diagrams/ddd-01-strategic-ddd-context-map.drawio';
export const SVG = 'static/img/diagrams/ddd-01-strategic-ddd-context-map.svg';
export const ORIGINAL_SOURCE_ID = 'src-atlas-ddd01-strategic-context-map';
export const EXACT_METADATA = Object.freeze({title: '战略领域驱动设计总览：从语言冲突到限界上下文', slug: '/patterns/ddd-01', content_type: 'pattern', status: 'reviewed', difficulty: 'advanced', topic_id: 'DDD-01', priority: 'P0', depends_on: [], adjacent_topics: ['STY-14'], related_cases: [], related_questions: []});
export const EXPECTED_H2 = Object.freeze(['学习问题', '一页摘要', '事实边界', '架构图', '控制权与任务流', '关键源码导读', '架构决策与权衡', '生产化分析', '可迁移经验', '来源']);
export const EXPECTED_H3 = Object.freeze(['可直接复用的机制', '只能有限类比的部分', '不应照搬的部分']);
export const CONTEXTS = Object.freeze(['销售订单', '库存承诺', '支付结算', '履约配送', '客户支持']);
export const CONTEXT_HEADERS = Object.freeze(['上下文', '本地术语', '主要不变量', '权威事实', '变化来源', '边界反证']);
export const RELATION_HEADERS = Object.freeze(['上游', '下游', '交换事实', '关系模式', '契约所有者', '翻译位置', '失败影响', '反证或重画条件']);
export const WRAPPER_LABELS = Object.freeze(['战略上下文映射，可横向滚动', '五个候选限界上下文契约表，可横向滚动', '上下文映射关系契约表，可横向滚动']);
export const WRAPPERS = Object.freeze(WRAPPER_LABELS.map((label, i) => ({className: i === 0 ? 'architecture-diagram-scroll' : 'table-wrapper table-wrapper--mapping', role: 'region', 'aria-label': label, tabIndex: '0', onKeyDown: 'handleHorizontalArrowKey'})));
export const FORBIDDEN_EQUIVALENCES = Object.freeze(['微服务', '团队', '代码仓库', '数据库', '部署单元']);
export const DDD02_ACTIONABLE_PATTERNS = Object.freeze([/(?:^|\/)patterns\/ddd-02(?:[/?#]|$)/iu, /(?:^|\/)ddd-02[^/]*\.mdx?(?:[?#]|$)/iu]);
export const CONTEXT_ROWS = Object.freeze([
  ['销售订单', '购买意图、价格承诺、订单接受、取消资格', '商业订单状态只由销售订单决定', '订单接受与取消资格', '价格与商业承诺规则', '若库存或配送状态改变商业承诺定义就重画边界'],
  ['库存承诺', '可承诺数量、预留、缺货、替代、释放', '销售订单不能越界写库存事实', '库存预留与释放结果', '可售承诺与替代规则', '若多个上下文同时拥有预留事实就重画边界'],
  ['支付结算', '授权、扣款、退款、结算、对账', '未知支付结果不能猜测为成功', '资金动作与外部支付结果', '支付通道与资金规则', '若销售订单决定资金终态就重画边界'],
  ['履约配送', '拣货、打包、交接、运输、交付', '不重新判定商业订单是否成立', '配送任务与交付结果', '配送网络与履约例外规则', '若交付与订单接受无法独立解释就重画边界'],
  ['客户支持', '诉求、补救方案、退换货协调、人工例外', '退款取消释放命令交回事实所有者', '诉求与补救协调状态', '补救政策与客户诉求', '若组合视图获得写入权就重画边界'],
]);
export const REQUIRED_SENTENCES = Object.freeze([
  '本文使用本站原创说明性场景，不代表真实企业、事故、指标或生产结果。',
  '订单已完成在销售订单中可能指商业承诺成立，在履约配送中可能指货物交付，在支付结算中仍可能等待结算或退款窗口收敛。',
  '子域属于问题空间，限界上下文是模型适用边界。',
  '统一语言不是全公司唯一词典，而是在限界上下文内部保持一致并持续演化的语言。',
  '限界上下文不是微服务、团队、代码仓库、数据库或部署单元的同义词。',
  '若竞争优势来自可售承诺、履约时效或复杂订单承诺，相应子域可以是核心子域。',
  '支付通道连接通常更接近通用能力，但授信、费用、退款或风险规则仍可能形成核心或支撑子域。',
  '客户支持不能因为使用通用工单产品就被视为没有领域模型。',
  '若所谓核心子域没有独特规则、没有持续领域投入，也不能解释竞争差异，就应重新分类。',
  '子域分类不由技术难度、代码数量或服务数量决定，分类变化不自动要求立即改变部署边界。',
  '未知外部支付结果必须由支付结算查询权威状态或进入明确的人工终态，销售订单不能猜测成功。',
  '客户—供应方仅用于下游优先级真实进入上游计划的协作关系，不能作为任意调用箭头的标签。',
  '开放主机服务与发布语言用于上游向多个消费者提供稳定集成入口和公开语言。',
  '防腐层标在承担翻译责任的下游或外部适配边界，不能与客户—供应方无依据地叠加。',
  '组合视图只提供用途受限的读取模型，不表示共享数据库、共享领域对象或写入权转移。',
  '客户支持把取消、退款、库存释放或补救命令交回相应事实所有者。',
  '若同一术语仍有互斥含义、不变量需要跨边界同步写入、多个上下文争夺同一权威事实，就应重访语言与所有权。',
  '若下游只能复制上游模型、边界总是联动发布、防腐层翻译失败无人处理，就应允许合并、拆分或重画边界。',
  '上下文映射记录协作关系与模型代价，关系模式不是传输协议。',
]);

// Semantic IDs are an authoring interface, not a claim that a particular company uses these boundaries.
export const NODES = Object.freeze([
  ['context-sales-order', '销售订单'], ['context-inventory-promise', '库存承诺'], ['context-payment-settlement', '支付结算'], ['context-fulfillment-delivery', '履约配送'], ['context-customer-support', '客户支持'],
  ['support-view', '只读组合视图'], ['external-payment-provider', '外部支付提供方'], ['system-boundary', '订单履约系统边界'], ['external-system-boundary', '外部支付系统边界'],
  ['payment-acl', '支付结算内部防腐层'], ['legend', '上游（U）；下游（D）；客户—供应方（Customer/Supplier，C/S）；开放主机服务（Open Host Service，OHS）；发布语言（Published Language，PL）；防腐层（Anti-Corruption Layer，ACL）；关系模式不是传输协议'], ['failure-boundary', '未知支付结果：查询支付事实所有者或人工终态；组合视图失败不转移写入权'],
]);
export const RELATIONS = Object.freeze([
  ['inventory-sales', 'context-inventory-promise', 'context-sales-order', '库存承诺', '销售订单', '预留或拒绝', '客户—供应方', '库存承诺', '销售订单本地语言适配', '不能猜测库存已预留', '下游优先级不再进入上游计划就重选关系'],
  ['payment-sales', 'context-payment-settlement', 'context-sales-order', '支付结算', '销售订单', '资金确认或未知结果', '客户—供应方', '支付结算', '销售订单本地语言适配', '未知结果回到支付结算查询', '销售订单拥有支付终态就重画边界'],
  ['sales-fulfillment', 'context-sales-order', 'context-fulfillment-delivery', '销售订单', '履约配送', '已接受商业承诺', '开放主机服务＋发布语言', '销售订单', '履约配送入口', '等待确认事实而非重判订单', '消费方被迫复制内部模型就重画边界'],
  ['provider-payment', 'external-payment-provider', 'context-payment-settlement', '外部支付提供方', '支付结算', '外部授权扣款退款结果', '防腐层', '外部支付提供方', '支付结算内部防腐层', '查询权威状态或人工终态', '防腐层无所有者就停止集成'],
  ['sales-view', 'context-sales-order', 'support-view', '销售订单', '只读组合视图', '商业订单状态', '开放主机服务＋发布语言', '销售订单', '组合视图投影器', '展示陈旧但不能写订单', '投影获得写入权就重画边界'],
  ['payment-view', 'context-payment-settlement', 'support-view', '支付结算', '只读组合视图', '资金动作状态', '开放主机服务＋发布语言', '支付结算', '组合视图投影器', '不能把陈旧投影当作资金终态', '投影决定退款就重画边界'],
  ['fulfillment-view', 'context-fulfillment-delivery', 'support-view', '履约配送', '只读组合视图', '配送任务状态', '开放主机服务＋发布语言', '履约配送', '组合视图投影器', '不能把陈旧投影当作交付事实', '投影决定交付就重画边界'],
  ['view-support', 'support-view', 'context-customer-support', '只读组合视图', '客户支持', '面向补救的只读组合事实', '发布语言', '各事实所有者', '客户支持读取入口', '补救命令仍交回事实所有者', '形成共享领域对象就重画边界'],
]);
export const RELATION_ROWS = Object.freeze(RELATIONS.map((r) => r.slice(3)));
export const REUSED_SOURCES = Object.freeze(['src-docs-8fb33e125d2a', 'src-docs-1ad75d39a251', 'src-docs-ac85a74ed0b2']);
export const NEW_REMOTE_SOURCES = Object.freeze([
  {id: 'src-evans-ddd-reference', canonical_locator: 'https://www.domainlanguage.com/ddd/reference/', allowed_evidence_roles: ['definition', 'method'], license: 'CC-BY-4.0', copyright_policy: 'adapt-with-attribution', usage_boundary: 'Supports DDD definitions, subdomains, ubiquitous language, bounded contexts, Context Maps and relationship patterns only; does not validate the illustrative scenario or its five candidate boundaries.'},
  {id: 'src-fowler-ubiquitous-language', canonical_locator: 'https://martinfowler.com/bliki/UbiquitousLanguage.html', allowed_evidence_roles: ['definition', 'method'], license: 'LicenseRef-All-Rights-Reserved', copyright_policy: 'facts-and-short-quotation', usage_boundary: 'Supports context-local language and its evolution only; does not establish a company-wide dictionary or approve the illustrative boundaries.'},
  {id: 'src-microsoft-domain-analysis', canonical_locator: 'https://learn.microsoft.com/azure/architecture/microservices/model/domain-analysis', allowed_evidence_roles: ['method'], license: 'CC-BY-4.0', copyright_policy: 'adapt-with-attribution', usage_boundary: 'Supports strategic analysis before service identification and iterative boundary analysis only; does not prove that bounded contexts equal microservices or approve the five illustrative boundaries.'},
]);
export const ORIGINAL_SOURCE_CONTRACT = Object.freeze({id: ORIGINAL_SOURCE_ID, canonical_locator: '/img/diagrams/ddd-01-strategic-ddd-context-map.svg', transport_locator: '/img/diagrams/ddd-01-strategic-ddd-context-map.svg', source_kind: 'original-illustration', allowed_evidence_roles: ['illustration'], license: 'LicenseRef-Atlas-Original', copyright_policy: 'original-atlas', link_policy: null, usage_boundary: 'Original illustrative Context Map only; not evidence of a real company, production outcome, service topology or approved business boundaries.'});
export const SOURCE_ANCHORS = Object.freeze([
  ['Bounded Context', 'https://martinfowler.com/bliki/BoundedContext.html'],
  ['Context Mapping', 'https://github.com/ddd-crew/context-mapping/tree/970c1ff3a61f7aa8b61b789b697c05bc585f614d'],
  ['Anti-Corruption Layer', 'https://contextmapper.org/docs/anticorruption-layer/'],
  ['DDD Reference', 'https://www.domainlanguage.com/ddd/reference/'],
  ['Ubiquitous Language', 'https://martinfowler.com/bliki/UbiquitousLanguage.html'],
  ['Domain analysis', 'https://learn.microsoft.com/azure/architecture/microservices/model/domain-analysis'],
]);
const baselineBytes = new Map();
export const gitBaseline = (path) => { if (!baselineBytes.has(path)) baselineBytes.set(path, execFileSync('git', ['show', `${BASELINE}:${path}`], {maxBuffer: 32 * 1024 * 1024})); return Buffer.from(baselineBytes.get(path)); };
export const optionalText = (path) => { try { return readFileSync(path, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return undefined; throw e; } };
export function mutation(source, before, after) { const next = source.replace(before, after); assert.notEqual(next, source, `non-no-op mutation: ${before}`); return next; }
function exactSet(actual, expected, label) { assert.equal(new Set(actual).size, actual.length, `${label}: duplicate`); assert.deepEqual([...actual].sort(), [...expected].sort(), label); }
function subset(actual, expected, label) { assert.ok(actual, label); assert.deepEqual(Object.fromEntries(Object.keys(expected).map((key) => [key, actual[key]])), expected, label); }
const compact = (text) => text.replace(/\s/gu, '');

export function readerContract(source) {
  const parsed = parseMdxVisibleCopy(source, ARTICLE, {includeAst: true});
  const chars = parsed.normalized.split(''), blocks = [], wrappers = [], images = [], links = [], definitions = new Map(), excluded = new Set(), evidenceNodes = new Set();
  const mask = (n) => { for (let i = n.position.start.offset; i < n.position.end.offset; i++) if (chars[i] !== '\n') chars[i] = ' '; };
  const literal = (n) => excluded.has(n) ? '' : ['text'].includes(n.type) ? n.value : ['inlineCode', 'code', 'mdxFlowExpression', 'mdxTextExpression'].includes(n.type) ? '' : (n.children ?? []).map(literal).join('');
  const walk = (n, owner, evidence = false) => {
    if (['code', 'inlineCode', 'mdxjsEsm', 'definition'].includes(n.type)) { if (n.type === 'definition') definitions.set(n.identifier, n.url); excluded.add(n); mask(n); return; }
    if (['mdxFlowExpression', 'mdxTextExpression'].includes(n.type)) { assert.match(n.value.trim(), /^(?:\/\*[\s\S]*?\*\/\s*)*$/u, 'dynamic narrative rejected'); excluded.add(n); mask(n); return; }
    if (n.type.startsWith('mdxJsx')) {
      const attrs = {};
      for (const a of n.attributes) { assert.equal(a.type, 'mdxJsxAttribute'); assert.ok(!Object.hasOwn(attrs, a.name), 'no duplicate attrs'); attrs[a.name] = typeof a.value === 'object' && a.value !== null ? a.value.value : a.value; }
      if (Object.hasOwn(attrs, 'hidden') || attrs['aria-hidden'] === 'true') { excluded.add(n); mask(n); return; }
      assert.ok(!Object.hasOwn(attrs, 'style'), 'inline hiding/styles require review');
      if (['SourceLedger', 'PatternTopicIndex'].includes(n.name)) {
        assert.deepEqual(attrs, {}); assert.equal(n.children?.length ?? 0, 0, 'non-rendered component must be childless');
        excluded.add(n); mask(n); return;
      }
      assert.ok(['div', 'span', 'p', 'a', 'Link', 'img', 'details', 'summary'].includes(n.name), 'known static MDX element');
      if (n.name === 'details') { assert.deepEqual(attrs, {className: 'evidence-card'}); mask(n); evidence = true; }
      if (attrs.className) assert.ok(['evidence-card', ...WRAPPERS.map((w) => w.className)].includes(attrs.className), 'known visible class');
      if (attrs.role === 'region') { assert.equal(n.name, 'div'); assert.equal(owner, undefined); owner = wrappers.length; wrappers.push({attributes: attrs, start: n.position.start.offset, end: n.position.end.offset}); }
      if (attrs.href || attrs.to) links.push({node: n, href: attrs.href ?? attrs.to, evidence});
      if (n.name === 'img') images.push({url: attrs.src, owner, evidence});
    }
    if (n.type === 'link') links.push({node: n, href: n.url, evidence});
    if (n.type === 'linkReference') links.push({node: n, reference: n.identifier, evidence});
    if (n.type === 'image') images.push({url: n.url, owner, evidence});
    if (evidence) evidenceNodes.add(n);
    for (const child of n.children ?? []) walk(child, owner, evidence);
  };
  walk(parsed.ast);
  // Collect each visible text leaf once, including direct JSX text. Block boundaries
  // separate statements, while emphasis, spans and soft wraps preserve inline text.
  let current;
  const flush = () => { if (current?.text.trim()) blocks.push(current); current = undefined; };
  const collect = (n, heading = null) => {
    if (excluded.has(n)) return;
    const boundary = ['paragraph', 'heading', 'mdxJsxFlowElement'].includes(n.type);
    if (boundary) flush();
    if (n.type === 'heading') heading = n.depth;
    if (n.type === 'text') {
      current ??= {text: '', heading, start: n.position.start.offset, evidence: evidenceNodes.has(n)};
      current.text += n.value;
    }
    for (const child of n.children ?? []) collect(child, heading);
    if (boundary) flush();
  };
  collect(parsed.ast); flush();
  // Resolve labels only after every descendant's visibility has been classified.
  return {visible: chars.join(''), blocks, wrappers, images, links: links.map(({node, ...l}) => ({...l, label: literal(node), href: l.href ?? definitions.get(l.reference)}))};
}
export function assertNoDDD02(value, baseRoute = ROUTE) {
  const visit = (v) => {
    if (typeof v === 'string') {
      // Callers pass actual link destinations, not prose mentions of the planned topic.
      let decoded = v; try { decoded = decodeURIComponent(v); } catch { /* Invalid URL is not a valid escape hatch. */ }
      let destination;
      try { destination = new URL(decoded.replaceAll('\\', '/'), new URL(baseRoute, 'https://tego-arch.invalid')).pathname; }
      catch { assert.fail('link destination must resolve against the page route'); }
      for (const pattern of DDD02_ACTIONABLE_PATTERNS) assert.doesNotMatch(destination, pattern, 'DDD-02 must remain non-actionable');
    } else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === 'object') Object.values(v).forEach(visit);
  }; visit(value);
}
function tables(source) { return [...source.matchAll(/(?:^\|[^\n]+\|\n){2,}(?:^\|[^\n]+\|(?:\n|$))/gmu)].map(([s]) => s.trim().split('\n').map((line) => line.slice(1, -1).split('|').map((c) => c.trim()))); }
export function assertArticleContract(source) {
  assert.ok(source, `${ARTICLE} must exist`);
  subset(parseFrontMatter(source), EXACT_METADATA, 'exact approved frontmatter');
  const r = readerContract(source), primary = r.blocks.filter((b) => !b.evidence), headings = primary.filter((b) => b.heading === 2);
  assert.deepEqual(headings.map((b) => b.text), EXPECTED_H2, 'exact visible H2 sequence');
  const migration = primary.filter((b) => b.start > headings[8].start && b.start < headings[9].start && b.heading === 3);
  assert.deepEqual(migration.map((b) => b.text), EXPECTED_H3, 'exact migration H3 sequence');
  assert.deepEqual(r.wrappers.map((w) => w.attributes), WRAPPERS, 'three named focusable wrappers');
  assert.deepEqual(r.images.filter((i) => !i.evidence), [{url: ORIGINAL_SOURCE_CONTRACT.canonical_locator, owner: 0, evidence: false}], 'actual SVG inside first wrapper');
  const physical = tables(r.visible); assert.equal(physical.length, 2, 'two physical visible tables');
  for (const [i, [headers, rows]] of [[CONTEXT_HEADERS, CONTEXT_ROWS], [RELATION_HEADERS, RELATION_ROWS]].entries()) {
    assert.deepEqual(physical[i], [headers, headers.map(() => '---'), ...rows], 'exact decision fields and substantive rows');
    assert.deepEqual(tables(r.visible.slice(r.wrappers[i + 1].start, r.wrappers[i + 1].end)), [physical[i]], 'table wrapper owns correct table');
  }
  const statements = (items) => items.flatMap((b) => b.text.split(/(?<=[。！？])/u)).map(compact).filter(Boolean);
  const narrative = statements(primary), all = statements(r.blocks);
  const polarity = (s) => s.replace(/不是/gu, '是').replace(/不能|不得|不应|并非|不|未|非|无需|无须|没有/gu, '');
  for (const sentence of REQUIRED_SENTENCES) {
    assert.equal(narrative.filter((s) => s === compact(sentence)).length, 1, `one affirmative visible narrative: ${sentence}`);
    assert.equal(all.filter((s) => polarity(s) === polarity(compact(sentence))).length, 1, `no negated/contradictory duplicate: ${sentence}`);
  }
  const text = all.join('\n');
  for (const noun of FORBIDDEN_EQUIVALENCES) assert.doesNotMatch(text, new RegExp(`限界上下文(?:就是|是|等于|天然对应|等同于)${noun}`, 'u'), 'no context equivalence');
  assert.doesNotMatch(text, /统一语言(?:就是|是|等于)全公司唯一词典|子域(?:就是|等于)限界上下文|销售订单(?:可以|应当|必须)猜测(?:支付)?成功/u, 'no shortened semantic contradictions');
  assert.doesNotMatch(text, /(?:真实企业|本公司|生产事故|吞吐量提升|延迟降低)[^。\n]*(?:证明|达到|提升|降低)|核心子域(?:由技术复杂度|由服务数量|必然是)/u, 'no fabricated experience or unconditional classification');
  for (const [label, href] of SOURCE_ANCHORS) assert.ok(r.links.some((l) => l.label === label && l.href === href), `visible source anchor: ${label}`);
  for (const link of r.links) assert.doesNotMatch(link.href ?? '', /weixin|wechat/iu, 'no WeChat citation or source anchor');
  assertNoDDD02(r.links.map((l) => l.href));
}
export function assertRelations(article, sty14, index) {
  assert.ok(article && sty14 && index, 'DDD-01 article and reciprocal surfaces must exist');
  const destinations = (s) => readerContract(s).links.filter((l) => !l.evidence).map((l) => l.href);
  assert.ok(destinations(article).includes('/patterns'), 'visible parent route');
  assert.ok(destinations(article).includes('/styles/sty-14'), 'visible STY-14 adjacent route');
  // The registry-backed Pattern index already supplies publication navigation.
  assert.ok(destinations(sty14).includes(ROUTE), 'visible STY-14 reciprocal link');
  assert.ok(index.includes('<PatternTopicIndex />') || destinations(index).includes(ROUTE), 'existing dynamic Pattern registry or direct index navigation');
  for (const [source, base] of [[article, ROUTE], [sty14, '/styles/sty-14'], [index, '/patterns']]) assertNoDDD02(destinations(source), base);
}

const attr = (n, key) => n.attributes.get(key);
const styleMap = (s = '') => Object.fromEntries(s.split(';').filter(Boolean).map((v) => v.split(/=(.*)/su)));
function xml(source, label) { assert.ok(source, `${label} must exist`); try { return parseXml(source).root; } catch (e) { assert.fail(`${label} valid XML: ${e.message}`); } }
const edgeLabel = (r) => `上游 → 下游；${r[5]}；${r[6]}；翻译：${r[8]}；失败：${r[9]}`;
export function assertDiagramContract(drawio, svg) {
  const dr = xml(drawio, DRAWIO), sr = xml(svg, SVG);
  assert.equal(xmlElements(dr, 'mxGraphModel').length + Number(dr.localName === 'mxGraphModel'), 1, 'one uncompressed graph');
  const cells = xmlElements(dr, 'mxCell'), byId = new Map(cells.map((c) => [attr(c, 'id'), c]));
  exactSet(cells.map((c) => attr(c, 'id')), ['0', '1', ...NODES.map(([id]) => id), ...RELATIONS.map(([id]) => id)], 'Draw.io semantic inventory');
  const groups = xmlElements(sr, 'g'), owners = new Map(groups.map((g) => [attr(g, 'data-semantic-id'), g]));
  exactSet(groups.map((g) => attr(g, 'data-semantic-id')), [...NODES.map(([id]) => id), ...RELATIONS.map(([id]) => id)], 'SVG semantic inventory');
  assert.equal(attr(sr, 'role'), 'img'); assert.equal(attr(sr, 'data-illustration-id'), ORIGINAL_SOURCE_ID);
  assert.ok(xmlElements(sr, 'title').some((n) => xmlTextContent(n).trim())); assert.ok(xmlElements(sr, 'desc').some((n) => xmlTextContent(n).trim()));
  const states = new Map();
  const opacity = (value) => Number(String(value).replace(/%$/u, '')) / (String(value).endsWith('%') ? 100 : 1);
  const paints = (n, kind) => {
    const state = states.get(n), color = state[kind];
    // Bounded static authoring contract: only demonstrably opaque literal colors.
    // Functional/alpha colors and unresolved paint servers need an explicit future
    // parser extension, never a permissive non-"none" visibility assumption.
    return /^(?:#[0-9a-f]{3}|#[0-9a-f]{6}|black|white)$/iu.test(color ?? '') && opacity(state[`${kind}-opacity`]) > 0 && (kind !== 'stroke' || Number(state['stroke-width']) > 0);
  };
  const inspect = (n, inherited) => {
    assert.ok(['svg', 'g', 'defs', 'marker', 'path', 'line', 'rect', 'text', 'tspan', 'title', 'desc'].includes(n.localName), 'static safe SVG elements');
    for (const [key] of n.attributes) assert.ok(!['style', 'class', 'transform', 'clip-path', 'mask', 'filter', 'hidden'].includes(key) && !key.startsWith('on'), 'no hidden presentation override');
    const state = svgPresentationState(n, inherited);
    const width = attr(n, 'stroke-width')?.trim().toLowerCase();
    assert.ok(!['revert', 'revert-layer'].includes(width), 'known stroke width cascade');
    state['stroke-width'] = !width || ['inherit', 'unset'].includes(width) ? inherited?.['stroke-width'] ?? '1' : width === 'initial' ? '1' : width;
    states.set(n, state);
    assert.ok(state.display !== 'none' && !['hidden', 'collapse'].includes(state.visibility) && opacity(state.opacity) > 0 && attr(n, 'aria-hidden') !== 'true', 'effective visible SVG');
    if (['text', 'tspan'].includes(n.localName)) assert.ok(paints(n, 'fill') && Number(state['font-size'] ?? 16) >= 12, 'effective readable text');
    for (const child of n.children) inspect(child, state);
  }; inspect(sr);
  const bounds = (c) => { const g = c.children.find((n) => n.localName === 'mxGeometry'); assert.ok(g, 'real mxGeometry'); const a = ['x', 'y', 'width', 'height'].map((k) => Number(attr(g, k))); assert.ok(a.every(Number.isFinite) && a[2] > 0 && a[3] > 0, 'positive node geometry'); return a; };
  for (const [id, label] of NODES) {
    const c = byId.get(id), g = owners.get(id), style = styleMap(attr(c, 'style'));
    assert.equal(attr(c, 'vertex'), '1'); assert.equal(attr(c, 'value').replaceAll('\n', ''), label, 'Draw.io label (native line breaks only)');
    assert.ok(style.fontColor && style.fontColor !== 'none' && Number(style.opacity ?? 100) > 0, 'effective Draw.io paint');
    assert.equal(xmlElements(g, 'text').map(xmlTextContent).join('').replaceAll('\n', ''), label, 'visible SVG text, not metadata');
    const rects = xmlElements(g, 'rect'); assert.equal(rects.length, 1, 'one real node/boundary rect');
    assert.deepEqual(['x', 'y', 'width', 'height'].map((k) => Number(attr(rects[0], k))), bounds(c), 'source/SVG node geometry parity');
    if (id.endsWith('system-boundary') || id === 'system-boundary') {
      assert.equal(states.get(rects[0]).fill, 'none', 'transparent system boundaries');
      assert.ok(paints(rects[0], 'stroke'), 'effective painted boundary stroke');
    } else assert.ok(paints(rects[0], 'stroke') || paints(rects[0], 'fill'), 'effective painted node');
  }
  const markers = new Map(xmlElements(sr, 'marker').map((m) => [attr(m, 'id'), m]));
  for (const r of RELATIONS) {
    const [id, source, target] = r, c = byId.get(id), g = owners.get(id), st = styleMap(attr(c, 'style'));
    assert.equal(attr(c, 'edge'), '1'); assert.equal(attr(c, 'source'), source); assert.equal(attr(c, 'target'), target);
    assert.equal(attr(g, 'data-source-id'), source); assert.equal(attr(g, 'data-target-id'), target);
    assert.equal(attr(c, 'value').replaceAll('\n', ''), edgeLabel(r)); assert.equal(xmlElements(g, 'text').map(xmlTextContent).join('').replaceAll('\n', ''), edgeLabel(r), 'direction fact pattern translation failure visible');
    assert.equal(st.endArrow, 'block'); assert.equal(st.startArrow, 'none'); assert.equal(st.endFill, '1');
    assert.ok(st.strokeColor && st.strokeColor !== 'none' && Number(st.strokeWidth) > 0 && Number(st.opacity ?? 100) > 0, 'real painted Draw.io connector');
    const geo = c.children.find((n) => n.localName === 'mxGeometry'); assert.ok(geo, 'connector geometry');
    for (const key of ['exitX', 'exitY', 'entryX', 'entryY']) assert.ok(st[key] !== undefined && Number(st[key]) >= 0 && Number(st[key]) <= 1, 'explicit terminal ports');
    const waypointArray = geo.children.find((n) => n.localName === 'Array' && attr(n, 'as') === 'points');
    const points = xmlElements(waypointArray ?? geo, 'mxPoint').filter((n) => attr(n, 'as') !== 'offset').map((n) => [Number(attr(n, 'x')), Number(attr(n, 'y'))]); assert.ok(points.length > 0 && points.flat().every(Number.isFinite), 'real waypoints');
    const start = bounds(byId.get(source)), end = bounds(byId.get(target));
    const route = [[start[0] + start[2] * Number(st.exitX), start[1] + start[3] * Number(st.exitY)], ...points, [end[0] + end[2] * Number(st.entryX), end[1] + end[3] * Number(st.entryY)]];
    const paths = xmlElements(g, 'path'); assert.equal(paths.length, 1, 'one actual connector path');
    // Draw.io's native filled block shortens the painted route by endSize +
    // strokeWidth + 1.118 * strokeWidth, leaving its stroked tip at the port.
    if (st.convertToSvg === '1') {
      const last = route.at(-1), prev = route.at(-2), cut = Number(st.endSize) + Number(st.strokeWidth) * 2.118;
      route[route.length - 1] = last.map((v, i) => Number((v - Math.sign(v - prev[i]) * cut).toFixed(2)));
    }
    assert.equal(attr(paths[0], 'd'), route.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' '), 'Draw.io/SVG terminal and waypoint parity');
    assert.ok(paints(paths[0], 'stroke'), 'effective visible connector stroke');
    const markerId = /^url\(#([\w-]+)\)$/u.exec(attr(paths[0], 'marker-end') ?? '')?.[1], marker = markers.get(markerId); assert.ok(marker, 'real referenced arrow marker');
    assert.ok(Number(attr(marker, 'markerWidth')) > 0 && Number(attr(marker, 'markerHeight')) > 0);
    assert.ok(xmlElements(marker, 'path').some((p) => /Z$/u.test(attr(p, 'd') ?? '') && paints(p, 'fill')), 'effective painted closed arrowhead');
  }
}

// Conservative Noto Sans SC advance envelope, calibrated against native font
// metrics in Task 3. It deliberately overestimates ink, never trusts authored
// data-bounds, and remains separate from the semantic fixture's toy geometry.
export const diagramTextWidth = (text, size) => [...text].reduce((sum, ch) => sum + size * (/[^\x00-\x7f]/u.test(ch) ? 1 : /[MW@]/u.test(ch) ? 1 : /[mw]/u.test(ch) ? .9 : /[A-Z]/u.test(ch) ? .8 : /[il.,:;'!| ]/u.test(ch) ? .4 : /[\/-]/u.test(ch) ? .5 : /[a-z0-9]/u.test(ch) ? .65 : 1), 0);
export function assertDiagramGeometry(drawio, svg) {
  const root = xml(svg, SVG), a = (n, k) => attr(n, k), number = (n, k) => Number(a(n, k));
  assertDiagramContract(drawio, svg);
  assert.equal(a(root, 'data-drawio-sha256'), createHash('sha256').update(drawio).digest('hex'), 'byte-bound exact Draw.io source');
  assert.deepEqual(a(root, 'viewBox').split(' ').map(Number), [0, 0, 800, 2260], 'authored 800px geometry');
  assert.equal(a(root, 'width'), undefined); assert.equal(a(root, 'height'), undefined);
  assert.equal(a(root, 'fill'), 'none', 'transparent root');
  assert.equal(root.children.some((n) => n.localName === 'rect'), false, 'no opaque root background');
  const groups = xmlElements(root, 'g'), ids = groups.map((g) => a(g, 'data-semantic-id'));
  const effective = new Map();
  const inspectStyle = (n, parent = {}) => {
    const state = svgPresentationState(n, parent);
    for (const [key, initial] of Object.entries({'stroke-width':'1','stroke-dasharray':'none','font-family':'serif','font-size':'16','font-weight':'normal','font-style':'normal','text-decoration':'none','text-anchor':'start','stroke-miterlimit':'4','stroke-linejoin':'miter','stroke-linecap':'butt'})) {
      const v = a(n,key);
      state[key] = !v || ['inherit','unset'].includes(v) ? parent[key] ?? initial : v === 'initial' ? initial : v;
    }
    effective.set(n,state);for(const child of n.children)inspectStyle(child,state);
  };inspectStyle(root);
  const painted = (n,kind) => {const s=effective.get(n);return !['none','transparent'].includes(s[kind]) && Number(s[`${kind}-opacity`]??1)>0 && (kind!=='stroke'||Number(s['stroke-width'])>0);};
  assert.deepEqual(ids, ['system-boundary', 'external-system-boundary', ...RELATIONS.map(([id]) => id), ...NODES.filter(([id]) => !id.endsWith('system-boundary')).map(([id]) => id)], 'boundary → connector/label → node paint order');
  const rect = (r) => [number(r, 'x'), number(r, 'y'), number(r, 'x') + number(r, 'width'), number(r, 'y') + number(r, 'height')];
  const inflate = (b, d) => [b[0]-d,b[1]-d,b[2]+d,b[3]+d];
  const separation = (b, c) => Math.hypot(Math.max(c[0]-b[2],b[0]-c[2],0), Math.max(c[1]-b[3],b[1]-c[3],0));
  const textBoxes = (g) => xmlElements(g, 'tspan').map((t) => {
    const size = number(t, 'font-size'), x = number(t, 'x'), y = number(t, 'y');
    assert.ok(size >= 15, 'body/edge font at least 15 CSSpx');
    assert.ok(a(t, 'textLength') === undefined && a(t, 'transform') === undefined, 'no compressed or transformed text');
    return {box: [x,y-size,x+diagramTextWidth(xmlTextContent(t),size),y+size*.25], baseline:y};
  });
  const nodes = groups.filter((g) => NODES.some(([id]) => id === a(g,'data-semantic-id'))).map((g) => {
    const id = a(g,'data-semantic-id'), r = xmlElements(g,'rect')[0], b = rect(r), half = Number(effective.get(r)['stroke-width'])/2, lines = textBoxes(g);
    assert.ok(lines.length, 'measured visible node lines');
    const pad = lines.map(({box:t}) => [t[0]-b[0]-half,b[2]-half-t[2],t[1]-b[1]-half,b[3]-half-t[3]]);
    for(const p of pad) assert.ok(p[0]>=16 && p[1]>=16 && p[2]>=14 && p[3]>=14, `node padding: ${id} ${p}`);
    for(let i=1;i<lines.length;i++) assert.ok(lines[i].baseline-lines[i-1].baseline>=22,'node baseline gap >=22 CSSpx');
    const border=[[b[0],b[1],b[2],b[1]],[b[0],b[3],b[2],b[3]],[b[0],b[1],b[0],b[3]],[b[2],b[1],b[2],b[3]]].map(s=>inflate(s,half));
    return {id,box:inflate(b,half),border,lines,padding:pad};
  });
  const edges = groups.filter((g) => RELATIONS.some(([id]) => id === a(g,'data-semantic-id'))).map((g) => {
    const id=a(g,'data-semantic-id'), p=xmlElements(g,'path')[0], nums=a(p,'d').match(/-?\d+(?:\.\d+)?/gu).map(Number), points=[];
    for(let i=0;i<nums.length;i+=2) points.push([nums[i],nums[i+1]]);
    const segments=points.slice(1).map((end,i)=>{const start=points[i];assert.ok(start[0]===end[0]||start[1]===end[1],'orthogonal route');assert.notDeepEqual(start,end,'nonzero segment');return inflate([Math.min(start[0],end[0]),Math.min(start[1],end[1]),Math.max(start[0],end[0]),Math.max(start[1],end[1])],Number(effective.get(p)['stroke-width'])/2);});
    const marker=xmlElements(root,'marker').find(m=>`url(#${a(m,'id')})`===a(p,'marker-end'));
    assert.ok(marker,'measurable referenced marker');
    assert.equal(a(marker,'markerUnits'),'userSpaceOnUse');assert.equal(a(marker,'viewBox'),'-2 -10 20 20');assert.equal(a(marker,'refX'),'0');assert.equal(a(marker,'refY'),'0');assert.equal(a(marker,'markerWidth'),'20');assert.equal(a(marker,'markerHeight'),'20');assert.equal(a(marker,'orient'),'auto');
    const markerPath=xmlElements(marker,'path')[0];assert.equal(a(markerPath,'d'),'M 14 0 L 0 7 L 0 -7 Z','native block marker geometry');
    const end=points.at(-1),prev=points.at(-2),dx=Math.sign(end[0]-prev[0]),dy=Math.sign(end[1]-prev[1]);
    // Includes the actual stroked block's miter tip (2.236px) and wing envelope.
    const arrow=inflate(dx ? [end[0]+Math.min(dx,0)*14,end[1]-7,end[0]+Math.max(dx,0)*14,end[1]+7] : [end[0]-7,end[1]+Math.min(dy,0)*14,end[0]+7,end[1]+Math.max(dy,0)*14],2.24);
    const lines=textBoxes(g); assert.ok(lines.length,'edge label visible');
    for(let i=1;i<lines.length;i++)assert.ok(lines[i].baseline-lines[i-1].baseline>=22,'edge baseline gap >=22 CSSpx');
    // Every painted rectangle counts, not just the first or the known label
    // card. Include strokes and inherited paint; invisible selection bounds do
    // not count. This protects against additional/expanded opaque backplates.
    const plates=xmlElements(g,'rect').filter(r=>painted(r,'fill')||painted(r,'stroke')).map(r=>({box:inflate(rect(r),painted(r,'stroke')?Number(effective.get(r)['stroke-width'])/2:0)}));
    return {id,segments,arrow,lines,plates,source:a(g,'data-source-id'),target:a(g,'data-target-id')};
  });
  const allLines=[...nodes,...edges].flatMap(x=>x.lines.map(l=>({...l,id:x.id})));
  for(const {box:b} of [...allLines,...edges.flatMap(e=>e.plates)]) assert.ok(b[0]>=0&&b[1]>=0&&b[2]<=800&&b[3]<=2260,'no clipped visible label/plate');
  const metrics=[];
  for(const e of edges){
    let stroke=Infinity,arrow=Infinity,node=Infinity;
    for(const l of [...e.lines,...e.plates]){
      for(const route of edges) { for(const s of route.segments) stroke=Math.min(stroke,separation(l.box,s)); arrow=Math.min(arrow,separation(l.box,route.arrow)); }
      for(const n of nodes.filter(n=>!n.id.endsWith('system-boundary')))node=Math.min(node,separation(l.box,n.box));
      for(const n of nodes.filter(n=>n.id.endsWith('system-boundary')))for(const side of n.border){stroke=Math.min(stroke,separation(l.box,side));node=Math.min(node,separation(l.box,side));}
    }
    assert.ok(stroke>=8,`label/stroke clearance ${e.id}: ${stroke}`);assert.ok(arrow>=16,`label/arrow clearance ${e.id}: ${arrow}`);assert.ok(node>=12,`label/node clearance ${e.id}: ${node}`);
    for(const s of e.segments){
      for(const n of nodes.filter(n=>!n.id.endsWith('system-boundary')&&![e.source,e.target].includes(n.id)))assert.ok(separation(s,n.box)>=12,`connector/node clearance ${e.id}/${n.id}`);
      for(const l of allLines)assert.ok(separation(s,l.box)>=8,`connector over text ${e.id}/${l.id}`);
      for(const label of edges)for(const plate of label.plates)assert.ok(separation(s,plate.box)>=8,`painted label plate occludes connector ${e.id}/${label.id}`);
    }
    metrics.push({id:e.id,stroke,arrow,node});
  }
  for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++)for(const s of edges[i].segments)for(const t of edges[j].segments)assert.ok(separation(s,t)>=8,`connector route overlap ${edges[i].id}/${edges[j].id}`);
  const sourceCells=new Map(xmlElements(xml(drawio,DRAWIO),'mxCell').map(c=>[a(c,'id'),c]));
  for(const g of groups){
    const id=a(g,'data-semantic-id'),c=sourceCells.get(id),st=styleMap(a(c,'style')),ts=xmlElements(g,'tspan'),edge=a(c,'edge')==='1',geo=xmlElements(c,'mxGeometry')[0];
    const commonStyle=['fontFamily','fontColor','fontSize','html','whiteSpace','rounded','arcSize','strokeColor','strokeWidth','fillColor','align','verticalAlign','spacingLeft','spacingTop','shape','convertToSvg','fontStyle','spacing','spacingRight','spacingBottom','opacity','textOpacity','strokeOpacity','fillOpacity'];
    const nativeKeys=new Set([...commonStyle,...(edge?['labelBackgroundColor','labelBorderColor','labelWidth','endArrow','startArrow','endFill','endSize','exitX','exitY','entryX','entryY','labelPadding']:['absoluteArcSize','dashed','dashPattern'])]);
    for(const key of Object.keys(st))assert.ok(nativeKeys.has(key),`unmodeled native style ${key}: ${id}`);
    assert.equal(a(c,'data-label-layout'),undefined,'native properties, no self-reported layout');
    assert.equal(st.fontFamily,'Noto Sans SC','measured font required for the conservative ink envelope');
    for(const [key,value] of Object.entries({html:'0',whiteSpace:'nowrap',convertToSvg:'1',align:'left',verticalAlign:'top',spacing:'0',fontStyle:'0',shape:edge?'connector':'rectangle'}))assert.equal(st[key],value,`native ${key}: ${id}`);
    assert.equal(st.lineHeight,undefined,'unsupported lineHeight cannot certify spacing');
    const size=Number(st.fontSize),step=Math.round(size*1.2),sourceLines=a(c,'value').split('\n');
    const lines=sourceLines.map((text,i)=>({text,i})).filter(l=>l.text);
    assert.equal(ts.length,lines.length,'native newline count, including blank-line spacing');
    let x,y;
    if(edge){
      const r=RELATIONS.find(([key])=>key===id),sgeo=xmlElements(sourceCells.get(r[1]),'mxGeometry')[0],tgeo=xmlElements(sourceCells.get(r[2]),'mxGeometry')[0];
      const port=(n,prefix)=>[number(n,'x')+number(n,'width')*Number(st[`${prefix}X`]),number(n,'y')+number(n,'height')*Number(st[`${prefix}Y`])];
      const points=[port(sgeo,'exit'),...xmlElements(geo,'mxPoint').filter(p=>a(p,'as')!=='offset').map(p=>[number(p,'x'),number(p,'y')]),port(tgeo,'entry')];
      const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
      // mxGraphView.getPoint rounds arclength, not the final coordinates.
      const distance=Math.round((number(geo,'x')/2+.5)*lengths.reduce((s,n)=>s+n,0));let consumed=0,i=0;
      while(distance>=Math.round(consumed+lengths[i])&&i<lengths.length-1)consumed+=lengths[i++];
      assert.equal(number(geo,'y'),0,'no perpendicular label drift');assert.equal(a(geo,'relative'),'1');
      const offset=xmlElements(c,'mxPoint').find(p=>a(p,'as')==='offset');assert.ok(offset,'native label offset');
      const mid=points[i].map((v,j)=>v+(points[i+1][j]-v)*(distance-consumed)/lengths[i]);
      x=mid[0]+number(offset,'x')+Number(st.spacingLeft);y=mid[1]+number(offset,'y')+Number(st.spacingTop)+5+size-1;
      const path=xmlElements(g,'path')[0],ps=effective.get(path),marker=xmlElements(root,'marker')[0],mp=xmlElements(marker,'path')[0],ms=effective.get(mp);
      assert.equal(st.rounded,'0','native unrounded route');
      assert.equal(Number(st.endSize)+Number(st.strokeWidth),14,'native block marker size including stroke');
      for(const shape of [ps,ms]){assert.equal(shape.stroke,st.strokeColor,'effective native stroke color');assert.equal(Number(shape['stroke-width']),Number(st.strokeWidth),'effective native stroke width');assert.equal(shape['stroke-linejoin'],'miter','native stroke join');assert.equal(shape['stroke-linecap'],'butt','native stroke cap');}
      assert.equal(ms.fill,st.strokeColor,'native filled marker color');assert.equal(ms['stroke-miterlimit'],'10','native marker miter');
      assert.equal(ps['stroke-dasharray'],st.dashed==='1'?st.dashPattern.split(' ').map(n=>Number(n)*Number(st.strokeWidth)).join(' '):'none','native route dash');
      assert.equal(Number(st.labelPadding),7,'native visible label padding');
      const plate=xmlElements(g,'rect')[0];assert.ok(plate,'native painted text background');
      assert.equal(effective.get(plate).fill,st.labelBackgroundColor,'native plate fill');assert.equal(effective.get(plate).stroke,st.labelBorderColor??'none','native plate border');
      // Native plain SVG export uses its text getBBox plus labelPadding and
      // integer expansion. These Noto Sans SC rows are all CJK-width dominated.
      const maxWidth=Math.max(...lines.map(l=>diagramTextWidth(l.text,size)));
      assert.deepEqual(rect(plate),[Math.floor(x-8),Math.floor(y-20),Math.floor(x-8)+Math.ceil(maxWidth+16),Math.floor(y-20)+(sourceLines.length-1)*step+29],'native exported label plate geometry');
      assert.ok(Number(st.labelWidth)>=maxWidth,'native label lane width');
    } else {
      x=number(geo,'x')+Number(st.spacingLeft);y=number(geo,'y')+Number(st.spacingTop)+5+size-1;
      const shape=xmlElements(g,'rect')[0],ss=effective.get(shape);
      assert.equal(ss.stroke,st.strokeColor,'native node stroke');assert.equal(Number(ss['stroke-width']),Number(st.strokeWidth),'native node stroke width');assert.equal(ss.fill,st.fillColor,'native node fill');
      assert.equal(ss['stroke-dasharray'],st.dashed==='1'?st.dashPattern.split(' ').map(n=>Number(n)*Number(st.strokeWidth)).join(' '):'none','native boundary dash');
      assert.equal(Number(a(shape,'rx')??0),st.rounded==='1'?Number(st.arcSize)/2:0,'native absolute corner radius');assert.equal(st.absoluteArcSize,'1');
      assert.equal(st.spacingRight,'24');assert.equal(st.spacingBottom,'14');
    }
    for(const [i,t] of ts.entries()){
      const actual=effective.get(t);
      assert.equal(actual['font-family'],st.fontFamily,'effective native font family');assert.equal(Number(actual['font-size']),size,'effective native font size');
      assert.equal(actual['font-weight'],'normal');assert.equal(actual['font-style'],'normal');assert.equal(actual['text-decoration'],'none');assert.equal(actual['text-anchor'],'start','effective left alignment');assert.equal(actual.fill,st.fontColor,'native text color');assert.equal(actual.stroke,'none','no unmatched text halo');
      assert.deepEqual([number(t,'x'),number(t,'y'),xmlTextContent(t)],[Number(x.toFixed(2)),Number((y+lines[i].i*step).toFixed(2)),lines[i].text],'native source ↔ SVG line position and content');
    }
    for(const key of ['opacity','textOpacity','strokeOpacity','fillOpacity'])assert.equal(Number(st[key]??100),100,`native ${key}`);
    for(const n of [g,...xmlElements(g,'text'),...ts,...xmlElements(g,'rect'),...xmlElements(g,'path')])for(const key of ['opacity','fill-opacity','stroke-opacity'])assert.equal(Number(effective.get(n)[key]??1),1,`effective ${key} parity`);
  }
  return {scale:1,nodes:nodes.map(({id,padding,lines})=>({id,padding,baselines:lines.map(l=>l.baseline)})),labels:metrics};
}

export function assertGovernance(ledger, inventory, health) {
  assert.ok(ledger.documents?.[ARTICLE], 'DDD-01 governed source document must exist');
  const baseline = JSON.parse(gitBaseline('data/source-ledger.json'));
  const newIds = [...NEW_REMOTE_SOURCES.map((s) => s.id), ORIGINAL_SOURCE_ID];
  exactSet(ledger.sources.map((s) => s.id), [...baseline.sources.map((s) => s.id), ...newIds], 'only four new governed identities');
  assert.deepEqual(ledger.sources.filter((s) => !newIds.includes(s.id)), baseline.sources, 'all 600 historical source records unchanged');
  const records = new Map(ledger.sources.map((s) => [s.id, s]));
  for (const expected of [...NEW_REMOTE_SOURCES, ORIGINAL_SOURCE_CONTRACT]) subset(records.get(expected.id), expected, `bounded source role and license: ${expected.id}`);
  for (const expected of NEW_REMOTE_SOURCES) assert.equal(records.get(expected.id).transport_locator, expected.canonical_locator, 'exact registered remote transport; redirects are health observations');
  assert.ok(!/^https?:/u.test(records.get(ORIGINAL_SOURCE_ID).transport_locator), 'original has no remote transport');
  const document = ledger.documents[ARTICLE], citations = document.citations;
  exactSet(citations.map((c) => c.source_id), [...REUSED_SOURCES, ...newIds], 'seven exact citation identities');
  assert.deepEqual(citations.filter((c) => c.manifest_primary).map((c) => c.source_id), ['src-evans-ddd-reference'], 'Evans is sole manifest primary');
  for (const citation of citations) {
    const source = records.get(citation.source_id);
    assert.equal(citation.citation_url, source.canonical_locator, 'no remote citation URL drift');
    assert.deepEqual(citation.roles, source.allowed_evidence_roles, 'exact bounded citation roles');
    assert.equal(citation.usage_mode, source.id === ORIGINAL_SOURCE_ID ? 'original-illustration' : 'facts-summary');
    assert.equal(citation.excerpt, null); assert.equal(citation.quotation_reviewed, false);
  }
  assert.doesNotMatch(JSON.stringify(document) + JSON.stringify(newIds.map((id) => records.get(id))), /weixin|wechat|微信/iu, 'no WeChat source or evidence');
  const parsed = parseSourceLedger(ledger); assert.deepEqual(parsed.errors, [], 'real ledger parser accepts rights and identities');
  assert.ok(inventory, 'license inventory provided');
  const rows = inventory.split('\n').filter((line) => line.startsWith('| ')).map((line) => line.slice(1, -1).split('|').map((x) => x.trim()));
  for (const id of newIds) {
    const s = records.get(id), matches = rows.filter((r) => r[0] === s.license_family_id);
    assert.equal(matches.length, 1, 'one matching new license inventory row');
    subset(Object.fromEntries(['license_family_id', 'canonical_locator', 'author_or_org', 'license_evidence_url', 'license_evidence_note', 'checked_at', 'license', 'license_scope'].map((k, i) => [k, matches[0][i]])), Object.fromEntries(['license_family_id', 'canonical_locator', 'author_or_org', 'license_evidence_url', 'license_evidence_note', 'checked_at', 'license', 'license_scope'].map((k) => [k, s[k]])), 'inventory matches governed rights exactly');
  }
  assert.ok(health?.results, 'remote health observations provided');
  const oldHealth = JSON.parse(gitBaseline('data/source-link-health.json'));
  assert.deepEqual(health.superseded_results, oldHealth.superseded_results, 'historical health archives unchanged');
  assert.equal(health.results.length, oldHealth.results.length + NEW_REMOTE_SOURCES.length, 'only three new remote health entries');
  for (const entry of oldHealth.results) assert.deepEqual(health.results.find((h) => h.transport_locator === entry.transport_locator), entry, 'historical health transport and observations unchanged');
  for (const {id} of NEW_REMOTE_SOURCES) {
    const s = records.get(id), matches = health.results.filter((h) => h.source_ids.includes(id)); assert.equal(matches.length, 1, 'one new transport health record');
    assert.equal(matches[0].transport_locator, s.transport_locator); assert.ok(matches[0].last_attempt?.at && matches[0].last_attempt?.outcome, 'actual attempt, never assumed healthy');
  }
  assert.equal(health.results.some((h) => h.source_ids.includes(ORIGINAL_SOURCE_ID)), false, 'local illustration has no remote health');
}

const frontmatter = (m) => Object.entries(m).flatMap(([k, v]) => Array.isArray(v) ? v.length ? [k + ':', ...v.map((x) => '  - ' + x)] : [k + ': []'] : [k + ': ' + v]).join('\n');
const table = (headers, rows) => [headers, headers.map(() => '---'), ...rows].map((row) => '| ' + row.join(' | ') + ' |').join('\n');
export function articleFixture() {
  const contents = [`![战略 DDD Context Map](${ORIGINAL_SOURCE_CONTRACT.canonical_locator})`, table(CONTEXT_HEADERS, CONTEXT_ROWS), table(RELATION_HEADERS, RELATION_ROWS)];
  const wrappers = WRAPPERS.map((w, i) => `<div className="${w.className}" role="region" aria-label="${w['aria-label']}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>\n\n${contents[i]}\n\n</div>`).join('\n\n');
  return `---\n${frontmatter(EXACT_METADATA)}\n---\nimport {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';\n\n${EXPECTED_H2.map((h, i) => `## ${h}\n\n${i === 1 ? REQUIRED_SENTENCES.join('\n\n') : i === 3 ? wrappers : i === 8 ? EXPECTED_H3.map((x) => '### ' + x).join('\n\n') : i === 9 ? SOURCE_ANCHORS.map(([label, url]) => `[${label}](${url})`).join('\n\n') : ''}`).join('\n\n')}\n\n[Pattern 索引](/patterns)\n\n[架构风格选择矩阵](/styles/sty-14)\n`;
}
export function diagramFixture() {
  const box = (i) => [100 + i % 3 * 500, 100 + Math.floor(i / 3) * 260, 400, 160];
  const cell = ([id, label], i) => { const [x,y,w,h] = box(i); return `<mxCell id="${id}" value="${label}" vertex="1" parent="1" style="fontColor=#111111;opacity=100;"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`; };
  const group = ([id,label], i) => { const [x,y,w,h] = box(i); return `<g data-semantic-id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#111111"/><text x="${x+20}" y="${y+40}" fill="#111111" font-size="16">${label}</text></g>`; };
  const paths = RELATIONS.map((r, i) => { const s = box(NODES.findIndex(([id]) => id === r[1])), t = box(NODES.findIndex(([id]) => id === r[2])); return [[s[0]+s[2],s[1]+s[3]/2], [550+i*10,80+i*10], [t[0],t[1]+t[3]/2]]; });
  return {
    drawio: `<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${NODES.map(cell).join('')}${RELATIONS.map((r,i) => `<mxCell id="${r[0]}" value="${edgeLabel(r)}" edge="1" parent="1" source="${r[1]}" target="${r[2]}" style="endArrow=block;startArrow=none;endFill=1;strokeColor=#111111;strokeWidth=2;exitX=1;exitY=0.5;entryX=0;entryY=0.5;"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="${paths[i][1][0]}" y="${paths[i][1][1]}"/></Array></mxGeometry></mxCell>`).join('')}</root></mxGraphModel></diagram></mxfile>`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" role="img" data-illustration-id="${ORIGINAL_SOURCE_ID}" viewBox="0 0 1800 1400"><title>说明性战略 DDD Context Map</title><desc>语言与事实所有权边界；不是部署图。</desc><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#111111"/></marker></defs>${NODES.map(group).join('')}${RELATIONS.map((r,i) => `<g data-semantic-id="${r[0]}" data-source-id="${r[1]}" data-target-id="${r[2]}"><path d="${paths[i].map(([x,y],j) => `${j ? 'L' : 'M'} ${x} ${y}`).join(' ')}" fill="none" stroke="#111111" stroke-width="2" marker-end="url(#arrow)"/><text x="${paths[i][1][0]}" y="${paths[i][1][1]-20}" fill="#111111" font-size="16">${edgeLabel(r)}</text></g>`).join('')}</svg>`,
  };
}
export function governanceFixture() {
  const ledger = JSON.parse(gitBaseline('data/source-ledger.json')), health = JSON.parse(gitBaseline('data/source-link-health.json'));
  const template = ledger.sources.find((s) => s.id === REUSED_SOURCES[0]);
  for (const expected of [...NEW_REMOTE_SOURCES, ORIGINAL_SOURCE_CONTRACT]) {
    const record = {...structuredClone(template), ...structuredClone(expected), title: expected.id, author_or_org: expected.id === ORIGINAL_SOURCE_ID ? 'Tego Arch maintainers' : expected.id, transport_locator: expected.canonical_locator, registered_at: '2026-09-08', checked_at: '2026-09-08', version: 'fixture-only contract, not a live observation', license_family_id: expected.canonical_locator, license_scope: 'The named work only; third-party assets excluded.', license_evidence_url: expected.id === ORIGINAL_SOURCE_ID ? 'https://github.com/sealday/tego-arch/blob/main/' + SVG : expected.canonical_locator, license_evidence_note: 'Fixture only; Task 2 must verify the real license evidence.', expected_final_transport_locator: expected.canonical_locator, expected_final_approved_at: '2026-09-08', expected_final_approval_note: 'Fixture only; no live check claimed.'};
    ledger.sources.push(record);
    if (expected.id !== ORIGINAL_SOURCE_ID) health.results.push({transport_locator: record.transport_locator, source_ids: [record.id], last_attempt: {at: '2026-09-08T00:00:00Z', outcome: 'unreachable'}, last_success: null, attempt_history: []});
  }
  ledger.documents[ARTICLE] = {reviewed_at: '2026-09-08', copyright_checks: ['original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights'], citations: [...REUSED_SOURCES, ...NEW_REMOTE_SOURCES.map((s) => s.id), ORIGINAL_SOURCE_ID].map((id) => { const s = ledger.sources.find((r) => r.id === id); return {source_id: id, citation_url: s.canonical_locator, roles: s.allowed_evidence_roles, manifest_primary: id === 'src-evans-ddd-reference', usage_mode: id === ORIGINAL_SOURCE_ID ? 'original-illustration' : 'facts-summary', attribution_note: s.title, modification_note: s.usage_boundary, excerpt: null, quotation_reviewed: false}; })};
  const inventory = ledger.sources.slice(-4).map((s) => '| ' + [s.license_family_id,s.canonical_locator,s.author_or_org,s.license_evidence_url,s.license_evidence_note,s.checked_at,s.license,s.license_scope,s.copyright_policy,'identity','not-applicable'].join(' | ') + ' |').join('\n');
  return {ledger, inventory, health};
}

if (process.argv[1]?.endsWith('g009-batch16-content.test.mjs')) {
test('DDD-01 article helper fixture is GREEN', () => assertArticleContract(articleFixture()));
for (const name of ['SourceLedger', 'PatternTopicIndex']) {
  test(`DDD-01 article helper accepts childless ${name}`, () => assertArticleContract(articleFixture() + `\n\n<${name} />\n`));
  test(`DDD-01 article rejects non-rendered ${name} children`, () => {
    const source = articleFixture(), changed = mutation(source, REQUIRED_SENTENCES[2], `<${name}>\n\n${REQUIRED_SENTENCES[2]}\n\n</${name}>`);
    assertArticleContract(source);
    assert.throws(() => assertArticleContract(changed), /component must be childless/u);
  });
}
test('DDD-01 article helper accepts multiline emphasis softwrap and JSX visible narrative', () => {
  const source = articleFixture();
  assertArticleContract(mutation(source, REQUIRED_SENTENCES[2], '<p>子域属于**问题空间**，\n限界上下文是模型适用边界。</p>'));
  assertArticleContract(mutation(source, REQUIRED_SENTENCES[2], '<div>子域属于<span>问题空间</span>，限界上下文是模型适用边界。</div>'));
});
for (const tag of ['p', 'div', 'span', 'summary']) test(`DDD-01 article rejects JSX direct ${tag} equivalence`, () => {
  const source = articleFixture(), changed = source + `\n\n<${tag}>限界上下文就是微服务。</${tag}>\n`;
  assertArticleContract(source); assert.notEqual(changed, source);
  assert.throws(() => assertArticleContract(changed), /no context equivalence/u);
});
test('DDD-01 article rejects JSX split inline equivalence', () => {
  const source = articleFixture(), changed = source + '\n\n<div>限界<span>上下文</span>就是微服务。</div>\n';
  assertArticleContract(source); assert.notEqual(changed, source);
  assert.throws(() => assertArticleContract(changed), /no context equivalence/u);
});
for (const kind of ['markdown', 'reference', 'HTML', 'MDX']) test(`DDD-01 article rejects hidden source label ${kind}`, () => {
  const source = articleFixture(), [label, href] = SOURCE_ANCHORS[0], hidden = `<span hidden>${label}</span>`;
  const replacement = kind === 'markdown' ? `[${hidden}](${href})` : kind === 'reference' ? `[${hidden}][hidden-source]\n\n[hidden-source]: ${href}` : kind === 'HTML' ? `<a href="${href}">${hidden}</a>` : `<Link to="${href}">${hidden}</Link>`;
  const changed = mutation(source, `[${label}](${href})`, replacement);
  assertArticleContract(source);
  assert.throws(() => assertArticleContract(changed), /visible source anchor/u);
});
test('DDD-01 article helper accepts query and hash on the current page', () => {
  assertArticleContract(articleFixture() + '\n\n[查询](?topic=ddd-02)\n\n[锚点](#ddd-02)\n');
});
for (const href of ['ddd-02', './ddd-02', 'ddd-02?view=full', 'ddd-02#next', './draft/../ddd-02?view=full#next', '%64dd-02']) test(`DDD-01 article rejects relative DDD-02 ${href}`, () => {
  const source = articleFixture(), changed = source + `\n\n[下一篇](${href})\n`;
  assertArticleContract(source); assert.notEqual(changed, source);
  assert.throws(() => assertArticleContract(changed), /DDD-02 must remain non-actionable/u);
});
for (const [label, change] of [
  ['hidden narrative', (s) => mutation(s, REQUIRED_SENTENCES[2], `<span hidden>${REQUIRED_SENTENCES[2]}</span>`)],
  ['inline hidden definition', (s) => mutation(s, '子域属于问题空间', '<span hidden>子域属于问题空间</span>')],
  ['comment narrative', (s) => mutation(s, REQUIRED_SENTENCES[2], `{/* ${REQUIRED_SENTENCES[2]} */}`)],
  ['code literal narrative', (s) => mutation(s, REQUIRED_SENTENCES[2], '`' + REQUIRED_SENTENCES[2] + '`')],
  ['evidence-only narrative', (s) => mutation(s, REQUIRED_SENTENCES[2], `<details className="evidence-card">\n<summary>证据</summary>\n\n${REQUIRED_SENTENCES[2]}\n\n</details>`)],
  ['negated narrative', (s) => mutation(s, REQUIRED_SENTENCES[2], '并非' + REQUIRED_SENTENCES[2])],
  ['opposing narrative', (s) => s + '\n' + REQUIRED_SENTENCES[3].replace('不是', '是')],
  ['context equivalence', (s) => s + '\n限界上下文就是微服务。'],
  ['shortened language contradiction', (s) => s + '\n统一语言是全公司唯一词典。'],
  ['WeChat source insertion', (s) => s + '\n[微信来源](https://mp.weixin.qq.com/s/fake)'],
  ['missing context invariant', (s) => mutation(s, CONTEXT_ROWS[0][2], '无')],
  ['wrong relation direction', (s) => mutation(s, '| 库存承诺 | 销售订单 |', '| 销售订单 | 库存承诺 |')],
  ['wrong H2 order', (s) => mutation(s, '## 学习问题', '## 来源')],
  ['wrong H3', (s) => mutation(s, '### 不应照搬的部分', '### 可以全部复制')],
  ['lost focus', (s) => mutation(s, 'tabIndex={0}', 'tabIndex={-1}')],
  ['wrong source href', (s) => mutation(s, SOURCE_ANCHORS[0][1], 'https://example.com/fake')],
  ['DDD-02 HTML', (s) => s + '\n<a href="/patterns/ddd-02">下一篇</a>'],
  ['DDD-02 MDX', (s) => s + '\n<Link to="/patterns/ddd-02">下一篇</Link>'],
  ['DDD-02 reference', (s) => s + '\n[下一篇][next]\n\n[next]: /patterns/ddd-02'],
]) test(`DDD-01 article rejects ${label}`, () => { const source = articleFixture(); assertArticleContract(source); const changed = change(source); assert.notEqual(changed, source); assert.throws(() => assertArticleContract(changed), assert.AssertionError); });
test('DDD-01 diagram helper fixture is GREEN', () => { const f = diagramFixture(); assertDiagramContract(f.drawio, f.svg); });
for (const color of ['rgba(0,0,0,0)', 'hsla(0,0%,0%,0)', 'rgb(0 0 0 / 0%)', 'hsl(0 0% 0% / 0)', '#0000', '#00000000']) {
  for (const [target, before, after] of [
    ['connector', 'stroke="#111111" stroke-width="2" marker-end=', `stroke="${color}" stroke-width="2" marker-end=`],
    ['boundary', '<g data-semantic-id="system-boundary"><rect x="600" y="620" width="400" height="160" fill="none" stroke="#111111"', `<g data-semantic-id="system-boundary"><rect x="600" y="620" width="400" height="160" fill="none" stroke="${color}"`],
    ['marker', 'd="M 0 0 L 10 5 L 0 10 Z" fill="#111111"', `d="M 0 0 L 10 5 L 0 10 Z" fill="${color}"`],
    ['text', '<text x="120" y="140" fill="#111111"', `<text x="120" y="140" fill="${color}"`],
  ]) test(`DDD-01 diagram rejects color alpha ${target} ${color}`, () => {
    const f = diagramFixture(); assertDiagramContract(f.drawio, f.svg);
    f.svg = mutation(f.svg, before, after);
    assert.throws(() => assertDiagramContract(f.drawio, f.svg), /effective/u);
  });
}
test('DDD-01 diagram helper accepts supported opaque colors consistently', () => {
  for (const color of ['#123', '#123456', 'black', 'white']) {
    const f = diagramFixture(); f.svg = f.svg.replaceAll('#111111', color);
    assertDiagramContract(f.drawio, f.svg);
  }
});
test('DDD-01 diagram helper accepts effective inherited paint and local overrides', () => {
  const f = diagramFixture();
  f.svg = mutation(f.svg, '<g data-semantic-id="inventory-sales"', '<g stroke="#111111" stroke-width="2" stroke-opacity="50%" data-semantic-id="inventory-sales"');
  f.svg = mutation(f.svg, 'stroke="#111111" stroke-width="2" marker-end=', 'marker-end=');
  f.svg = mutation(f.svg, '<marker id="arrow"', '<marker fill="#111111" fill-opacity="50%" id="arrow"');
  f.svg = mutation(f.svg, 'd="M 0 0 L 10 5 L 0 10 Z" fill="#111111"', 'd="M 0 0 L 10 5 L 0 10 Z"');
  f.svg = mutation(f.svg, '<defs>', '<defs fill-opacity="0">');
  assertDiagramContract(f.drawio, f.svg);
});
for (const [label, field, before, after] of [
  ['missing context', 'svg', 'data-semantic-id="context-sales-order"', 'data-semantic-id="fake"'],
  ['reversed U/D', 'svg', '上游 → 下游', '下游 → 上游'],
  ['fake relationship', 'drawio', '客户—供应方', 'HTTP'],
  ['illegal pattern stack', 'svg', '客户—供应方', '客户—供应方 + 开放主机服务'],
  ['lost ACL owner', 'svg', '支付结算内部防腐层', '无所有者防腐层'],
  ['terminal loss', 'drawio', 'source="context-inventory-promise"', 'source="fake"'],
  ['waypoint drift', 'drawio', 'x="550" y="80"', 'x="551" y="80"'],
  ['hidden text', 'svg', '<text ', '<text visibility="hidden" '],
  ['marker loss', 'svg', 'marker-end="url(#arrow)"', 'marker-end="none"'],
  ['unpainted connector', 'svg', 'stroke-width="2"', 'stroke-width="0"'],
  ['effective connector stroke opacity', 'svg', 'stroke-width="2"', 'stroke-width="2" stroke-opacity="0"'],
  ['effective connector inherited stroke opacity', 'svg', '<g data-semantic-id="inventory-sales"', '<g stroke-opacity="0" data-semantic-id="inventory-sales"'],
  ['effective connector transparent stroke', 'svg', 'stroke-width="2"', 'stroke-width="2" stroke-opacity="0%"'],
  ['effective boundary missing stroke', 'svg', '<g data-semantic-id="system-boundary"><rect', '<g data-semantic-id="system-boundary"><rect stroke-opacity="0"'],
  ['effective boundary stroke none', 'svg', '<g data-semantic-id="system-boundary"><rect x="600" y="620" width="400" height="160" fill="none" stroke="#111111"', '<g data-semantic-id="system-boundary"><rect x="600" y="620" width="400" height="160" fill="none" stroke="none"'],
  ['effective boundary inherited stroke opacity', 'svg', '<g data-semantic-id="system-boundary">', '<g data-semantic-id="system-boundary" stroke-opacity="0">'],
  ['effective marker fill opacity', 'svg', '<marker id="arrow"', '<marker fill-opacity="0" id="arrow"'],
  ['effective marker path fill opacity', 'svg', 'd="M 0 0 L 10 5 L 0 10 Z"', 'fill-opacity="0" d="M 0 0 L 10 5 L 0 10 Z"'],
  ['effective marker inherited fill opacity', 'svg', '<defs>', '<defs fill-opacity="0">'],
  ['zero Draw.io opacity', 'drawio', 'opacity=100', 'opacity=0'],
  ['opaque boundary', 'svg', '<g data-semantic-id="system-boundary"><rect', '<g data-semantic-id="system-boundary" opacity="0"><rect'],
]) test(`DDD-01 diagram rejects ${label}`, () => { const f = diagramFixture(); assertDiagramContract(f.drawio, f.svg); f[field] = mutation(f[field], before, after); assert.throws(() => assertDiagramContract(f.drawio, f.svg), assert.AssertionError); });
test('DDD-01 governance helper fixture and actual ledger parser are GREEN', () => { const f = governanceFixture(); assertGovernance(f.ledger, f.inventory, f.health); });
for (const id of REUSED_SOURCES) {
  test(`DDD-01 governance preserves exact record bytes for ${id}`, () => {
    const recordBytes = (text) => {
      const start = text.indexOf(`    {\n      "id": "${id}"`);
      assert.notEqual(start, -1);
      const end = text.indexOf('\n    }', start);
      assert.notEqual(end, -1);
      return text.slice(start, end + '\n    }'.length);
    };
    assert.equal(recordBytes(readFileSync('data/source-ledger.json', 'utf8')), recordBytes(gitBaseline('data/source-ledger.json').toString()));
  });
  for (const field of ['canonical_locator', 'transport_locator', 'version', 'license', 'allowed_evidence_roles', 'usage_boundary', 'expected_final_transport_locator']) {
    test(`DDD-01 governance rejects reused ${id} ${field} drift`, () => {
      const f = governanceFixture(); assertGovernance(f.ledger, f.inventory, f.health);
      const source = f.ledger.sources.find((s) => s.id === id);
      source[field] = Array.isArray(source[field]) ? [...source[field], 'runtime-fact'] : source[field] + '-drift';
      assert.throws(() => assertGovernance(f.ledger, f.inventory, f.health), assert.AssertionError);
    });
  }
  test(`DDD-01 governance rejects reused ${id} health transport drift`, () => {
    const f = governanceFixture(); assertGovernance(f.ledger, f.inventory, f.health);
    const entry = f.health.results.find((h) => h.source_ids.includes(id));
    assert.ok(entry); entry.transport_locator += '/drift';
    assert.throws(() => assertGovernance(f.ledger, f.inventory, f.health), assert.AssertionError);
  });
}
for (const [label, change] of [
  ['identity duplication', (f) => f.ledger.sources.push({...f.ledger.sources.at(-2)})],
  ['remote URL drift', (f) => { f.ledger.sources.at(-2).canonical_locator += '/fake'; }],
  ['remote transport drift', (f) => { f.ledger.sources.at(-2).transport_locator += '/fake'; }],
  ['license weakening', (f) => { f.ledger.sources.at(-2).license = 'CC0-1.0'; }],
  ['WeChat insertion', (f) => { f.ledger.documents[ARTICLE].citations[0].attribution_note = '微信 https://mp.weixin.qq.com/s/fake'; }],
  ['runtime claim inflation', (f) => f.ledger.sources.at(-2).allowed_evidence_roles.push('runtime-fact')],
  ['wrong manifest primary', (f) => { f.ledger.documents[ARTICLE].citations[0].manifest_primary = true; }],
  ['remote illustration', (f) => { f.ledger.sources.at(-1).transport_locator = 'https://example.com/fake.svg'; }],
  ['license row drift', (f) => { f.inventory = mutation(f.inventory, 'CC-BY-4.0', 'CC0-1.0'); }],
  ['health transport drift', (f) => { f.health.results.at(-1).transport_locator += '/fake'; }],
  ['historical source edit', (f) => { f.ledger.sources[0].version += '-fake'; }],
  ['historical health archive edit', (f) => { f.health.superseded_results = []; }],
  ['unrelated new health entry', (f) => { f.health.results.push(structuredClone(f.health.results.at(-1))); }],
]) test(`DDD-01 governance rejects ${label}`, () => { const f = governanceFixture(); assertGovernance(f.ledger, f.inventory, f.health); const before = structuredClone(f); change(f); assert.notDeepEqual(f, before); assert.throws(() => assertGovernance(f.ledger, f.inventory, f.health), assert.AssertionError); });
test('DDD-01 reciprocal helper is GREEN and rejects reciprocal loss', () => { const a = articleFixture(), s = '[战略 DDD](/patterns/ddd-01)', i = '<PatternTopicIndex />'; assertRelations(a, s, i); assert.throws(() => assertRelations(a, mutation(s, ROUTE, '/patterns'), i), assert.AssertionError); });

test('DDD-01 production article satisfies reader contract', () => assertArticleContract(optionalText(ARTICLE)));

test('DDD-01 original source anchor preserves its canonical path and safe new-window attributes', () => {
  const source = optionalText(ARTICLE);
  const check = (text) => assert.match(text, /<Link to="\/img\/diagrams\/ddd-01-strategic-ddd-context-map\.svg" target="_blank" rel="noopener noreferrer">原创上下文映射矢量图<\/Link>/u, 'canonical safe original-source anchor, not a bundled Markdown asset link');
  check(source);
  for (const [before, after] of [['to="/img/diagrams/', 'to="/assets/files/'], ['rel="noopener noreferrer"', 'rel=""'], ['target="_blank"', 'target="_self"']]) assert.throws(() => check(mutation(source, before, after)), assert.AssertionError);
});
test('DDD-01 production diagram satisfies semantic and endpoint parity', () => assertDiagramContract(optionalText(DRAWIO), optionalText(SVG)));
test('DDD-01 production diagram has measured 800px geometry', () => assertDiagramGeometry(optionalText(DRAWIO), optionalText(SVG)));
for(const [name,before,after] of [
  ['swapped context','data-semantic-id="context-sales-order"','data-semantic-id="context-inventory-promise"'],
  ['opaque background','fill="none" data-illustration-id','fill="#ffffff" data-illustration-id'],
  ['narrow padding','x="84" y="592"','x="61" y="592"'],
  ['line over text','M 160 550 L 160 270 L 385 270 L 385 533.76','M 160 550 L 160 324 L 385 324 L 385 533.76'],
  ['line over node','M 160 550 L 160 270 L 385 270 L 385 533.76','M 160 550 L 160 592 L 385 592 L 385 533.76'],
  ['line over route','M 160 550 L 160 270 L 385 270 L 385 533.76','M 160 550 L 160 250 L 475 250 L 475 533.76'],
  ['marker footprint drift','markerWidth="20"','markerWidth="30"'],
  ['opaque label plate erases connector','x="176" y="304" width="196"','x="159" y="304" width="213"'],
  ['opaque plate near stroke','x="176" y="304" width="196"','x="167" y="304" width="205"'],
  ['opaque plate near arrow','x="486" y="1506" width="241"','x="484" y="1506" width="243"'],
  ['opaque plate near node','x="486" y="1506" width="241" height="173"','x="486" y="1499" width="241" height="180"'],
  ['additional opaque plate hides earlier route','data-semantic-id="view-support" data-source-id="support-view" data-target-id="context-customer-support">','data-semantic-id="view-support" data-source-id="support-view" data-target-id="context-customer-support"><rect x="158" y="300" width="8" height="200" fill="#ffffff"/>'],
  ['inherited painted plate hides route','data-semantic-id="inventory-sales" data-source-id="context-inventory-promise" data-target-id="context-sales-order">','data-semantic-id="inventory-sales" data-source-id="context-inventory-promise" data-target-id="context-sales-order" fill="#ffffff"><rect x="158" y="300" width="8" height="200"/>'],
  ['outlined plate clearance uses stroke','x="176" y="304" width="196" height="209" fill="#f3f6fb" stroke="none" stroke-width="0"','x="176" y="304" width="196" height="209" fill="#f3f6fb" stroke="#71839b" stroke-width="20"'],
  ['narrow baseline','y="360" font-size="15"','y="335" font-size="15"'],
  ['effective inherited font weight','font-weight="normal"','font-weight="bold"'],
  ['effective tspan font family','<tspan x="64" y="232"','<tspan font-family="serif" x="64" y="232"'],
  ['effective marker stroke width','d="M 14 0 L 0 7 L 0 -7 Z" fill="#71839b" stroke="#71839b" stroke-width="2"','d="M 14 0 L 0 7 L 0 -7 Z" fill="#71839b" stroke="#71839b" stroke-width="3"'],
])test(`DDD-01 authored geometry rejects ${name}`,()=>{
  const d=optionalText(DRAWIO),s=optionalText(SVG);assertDiagramGeometry(d,s);
  assert.throws(()=>assertDiagramGeometry(d,mutation(s,before,after)),assert.AssertionError);
});
test('DDD-01 authored pair rejects exact source byte drift',()=>{const d=optionalText(DRAWIO),s=optionalText(SVG);assertDiagramGeometry(d,s);assert.throws(()=>assertDiagramGeometry(d+'\n',s),/byte-bound/u);});
for(const [name,change] of [
  ['native label offset drift',d=>mutation(d,/x="([^"]+)" y="([^"]+)" as="offset"/u,'x="0" y="0" as="offset"')],
  ['native source line break loss',d=>mutation(d,'&#xa;&#xa;','')],
  ['native source compact baseline',d=>mutation(d,'&#xa;&#xa;','&#xa;')],
  ['native edge alignment drift',d=>mutation(d,'labelBackgroundColor=#f3f6fb;align=left','labelBackgroundColor=#f3f6fb;align=center')],
  ['native vertical alignment drift',d=>mutation(d,'verticalAlign=top','verticalAlign=middle')],
  ['native font size drift',d=>mutation(d,'fontSize=15','fontSize=16')],
  ['native font family drift',d=>mutation(d,'fontFamily=Noto Sans SC','fontFamily=serif')],
  ['native font style drift',d=>mutation(d,'fontStyle=0','fontStyle=1')],
  ['native text color drift',d=>mutation(d,'fontColor=#172b4d','fontColor=#ffffff')],
  ['native spacing drift',d=>mutation(d,'spacingLeft=24','spacingLeft=25')],
  ['native label padding drift',d=>mutation(d,'labelPadding=7','labelPadding=8')],
  ['native marker size drift',d=>mutation(d,'endSize=12','endSize=20')],
  ['native dashed style drift',d=>mutation(d,'dashPattern=4 3','dashPattern=3 3')],
  ['native node fill drift',d=>mutation(d,'fillColor=#edf3fa','fillColor=#ffffff')],
  ['native node corner drift',d=>mutation(d,'absoluteArcSize=1','absoluteArcSize=0')],
  ['native unsupported lineHeight',d=>mutation(d,'fontStyle=0;','fontStyle=0;lineHeight=1.6;')],
  ['native unmodeled rotation',d=>mutation(d,'fontStyle=0;','fontStyle=0;rotation=45;')],
  ['native rounded route drift',d=>mutation(d,'entryY=0;rounded=0;shape=connector','entryY=0;rounded=1;shape=connector')],
  ['native connector width drift',d=>mutation(d,'endSize=12;strokeColor=#71839b;strokeWidth=2','endSize=12;strokeColor=#71839b;strokeWidth=20')],
])test(`DDD-01 authored layout rejects ${name} after rebind`,()=>{
  const d=optionalText(DRAWIO),s=optionalText(SVG);assertDiagramGeometry(d,s);const changed=change(d);
  const rebound=s.replace(/data-drawio-sha256="[a-f0-9]{64}"/u,`data-drawio-sha256="${createHash('sha256').update(changed).digest('hex')}"`);
  assert.throws(()=>assertDiagramGeometry(changed,rebound),assert.AssertionError);
});
test('DDD-01 production governance closes seven identities and license/health records', () => assertGovernance(JSON.parse(readFileSync('data/source-ledger.json')), optionalText('docs/source-license-inventory.md'), JSON.parse(readFileSync('data/source-link-health.json'))));
test('DDD-01 production reciprocal links and Pattern navigation exist', () => assertRelations(optionalText(ARTICLE), optionalText('content/styles/sty-14-architecture-choice-matrix.mdx'), optionalText('content/patterns/index.mdx')));
}
