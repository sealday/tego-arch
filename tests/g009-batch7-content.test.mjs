import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const TOPIC_ID = 'STY-06';
const ROUTE = '/styles/sty-06';
const ARTICLE = 'content/styles/sty-06-event-driven-architecture.mdx';
const DRAWIO = 'diagrams/sty-06-event-driven-four-patterns.drawio';
const SVG = 'static/img/diagrams/sty-06-event-driven-four-patterns.svg';
const MODES = ['事件通知', '状态转移', '事件携带状态', '事件溯源'];
const QUESTIONS = ['收到什么', '是否回查', '权威状态', '是否重建', '失败责任'];
const HEADINGS = [
  '学习问题', '组件、连接器与约束', '边界与控制流', '数据所有权与一致性',
  '部署单元与故障域', '团队拓扑', '质量属性收益与成本', '迁移路径',
  '禁用条件', '对比案例', '来源',
];
const SOURCE_IDS = [
  'src-fowler-what-do-you-mean-event-driven',
  'src-microsoft-event-driven-architecture-style',
  'src-microsoft-event-sourcing-pattern',
  'src-cncf-cloudevents-102-spec',
  'src-w3c-scxml-2015',
  'src-atlas-sty06-event-driven-four-patterns',
];

const REQUIRED = {
  eventNotification: ['最小载荷', '回查订单服务', '补偿扫描', '被动攻击式命令'],
  stateTransition: ['from', 'to', '业务原因', '聚合版本', '非法迁移', '缺口'],
  carriedState: ['本地副本', '正常路径不回查', '旧版本不能覆盖新版本', '隐私'],
  eventSourcing: ['事件存储是权威', '按聚合有序', '乐观并发', '回放', '快照', '投影'],
};
const PROHIBITED = [
  '四种模式是成熟度阶梯', '消息带完整数据就是事件溯源', 'Kafka 就是事件存储',
  'Outbox 保证恰好一次', 'CQRS 必须使用事件溯源', '回放可以再次扣款',
];
const COLUMN_IDS = ['notification-column', 'transition-column', 'carried-state-column', 'event-sourcing-column'];
const ROW_IDS = ['producer-write-row', 'event-payload-row', 'consumer-read-row', 'authority-row', 'recovery-row'];
const CRITICAL_IDS = [
  'notification-event', 'notification-lookup', 'transition-event', 'consumer-state-machine',
  'state-snapshot-event', 'consumer-local-copy', 'command-handler', 'aggregate',
  'event-store', 'read-projection', 'integration-event', 'event-broker', 'replay-path',
];

const MODE_KEYS = ['eventNotification', 'stateTransition', 'carriedState', 'eventSourcing'];
const PARTICIPANTS = ['订单', '库存', '支付', '通知'];
const RELATION_METADATA = {
  depends_on: ['STY-00', 'STY-05'],
  adjacent_topics: ['STY-04', 'STY-05', 'PR-11', 'MOD-08'],
  related_cases: ['/cases/apache-kafka-consumer-groups'],
  related_questions: [],
};
const RECIPROCAL_FILES = [
  'styles/sty-05-microservices.mdx',
  'principles/pr-11-cqs-cqrs-read-write-separation.mdx',
  'modeling/mod-08-state-machine-modeling.mdx',
];
const RELIABILITY_PATTERNS = [
  /至少一次|at-least-once/iu,
  /事件\s*(?:ID|Id|id|标识)/u,
  /聚合(?:键|标识)|业务键/u,
  /(?:模式|schema)版本/iu,
  /关联\s*(?:ID|Id|id|标识)|correlation\s*(?:ID|Id|id)/iu,
  /因果\s*(?:ID|Id|id|标识)|causation\s*(?:ID|Id|id)/iu,
  /幂等/u,
  /有界重试|重试上限/u,
  /(?:DLQ|死信).{0,16}(?:所有者|负责)|(?:所有者|负责).{0,16}(?:DLQ|死信)/iu,
  /毒(?:消息|事件).{0,12}隔离|隔离.{0,12}毒(?:消息|事件)/u,
  /受控重放/u,
  /人工终止/u,
  /积压/u,
  /(?:延迟|lag)/iu,
  /投影水位|projection[- ]watermark/iu,
];
const OWNED_FAILURE_PATTERNS = [
  /毒(?:消息|事件).{0,20}隔离.{0,20}(?:所有者|负责|责任)|(?:所有者|负责|责任).{0,20}毒(?:消息|事件).{0,20}隔离/u,
  /受控重放.{0,20}(?:所有者|负责|责任)|(?:所有者|负责|责任).{0,20}受控重放/u,
  /人工终止.{0,20}(?:所有者|负责|责任)|(?:所有者|负责|责任).{0,20}人工终止/u,
  /(?:积压|lag|延迟).{0,24}(?:所有者|负责|责任)|(?:所有者|负责|责任).{0,24}(?:积压|lag|延迟)/iu,
  /(?:顺序|乱序).{0,24}(?:所有者|负责|责任)|(?:所有者|负责|责任).{0,24}(?:顺序|乱序)/u,
  /(?:模式|schema)演进.{0,24}(?:所有者|负责|责任)|(?:所有者|负责|责任).{0,24}(?:模式|schema)演进/iu,
];
const MATRIX_ROWS = [
  /载荷/u, /回查|取数/u, /时间耦合.*模式耦合|模式耦合.*时间耦合/u,
  /权威|事实来源/u, /副本/u, /顺序/u, /重放/u, /审计/u, /隐私/u,
  /演进/u, /成本/u, /采用.*停止|使用.*停止|适用.*禁用/u,
];
const SOURCE_REQUIRED_FIELDS = [
  'canonical_locator', 'transport_locator', 'title', 'author_or_org', 'version',
  'source_kind', 'tier', 'allowed_evidence_roles', 'license', 'license_scope',
  'license_evidence_url', 'license_evidence_note', 'copyright_policy', 'usage_boundary',
];
const TERM_PATTERNS = new Map([
  ['command', /命令（Command）|命令\s*\(Command\)|Command（命令）/u],
  ['domain-event', /领域事件（Domain Event）|领域事件\s*\(Domain Event\)|Domain Event（领域事件）/u],
  ['integration-event', /集成事件（Integration Event）|集成事件\s*\(Integration Event\)|Integration Event（集成事件）/u],
  ['broker', /事件代理（Event Broker）|事件代理\s*\(Event Broker\)|消息代理（Message Broker）|事件中间件/u],
  ['outbox', /事务性发件箱（Outbox）|事务性发件箱\s*\(Outbox\)|Outbox（事务性发件箱）/u],
  ['event-store', /事件存储（Event Store）|事件存储\s*\(Event Store\)|Event Store（事件存储）/u],
  ['local-copy', /本地副本/u],
  ['projection', /派生投影|读取投影/u],
]);
const RESPONSIBILITY_PATTERNS = new Map([
  ['teaching-framework', /(?:四种模式|四类).{0,24}(?:教学比较框架|教学框架).{0,24}(?:并非|不是|不构成).{0,16}(?:唯一|穷尽|成熟度阶梯)|(?:并非|不是|不构成).{0,16}(?:唯一|穷尽|成熟度阶梯).{0,24}(?:教学比较框架|教学框架)/u],
  ['command', /命令.{0,24}(?:意图|请求|要求).{0,24}(?:处理器|接收方|执行)/u],
  ['domain-event', /领域事件.{0,24}(?:聚合|领域).{0,24}(?:已经发生|事实|状态变化)/u],
  ['integration-event', /集成事件.{0,28}(?:边界外|外部消费者|跨边界|公开合同)/u],
  ['broker', /(?:事件|消息)代理.{0,24}(?:传递|路由|投递).{0,24}(?:不拥有|不是权威|不决定).{0,16}(?:业务状态|业务语义)|(?:事件|消息)代理.{0,24}(?:不拥有|不是权威|不决定).{0,16}(?:业务状态|业务语义)/u],
  ['outbox', /(?:Outbox|事务性发件箱).{0,24}(?:本地事务|同一事务).{0,24}(?:待发布|可靠发布|消息)|(?:本地事务|同一事务).{0,24}(?:Outbox|事务性发件箱).{0,24}(?:待发布|可靠发布|消息)/iu],
  ['event-store', /事件存储.{0,24}(?:追加|有序事件流).{0,24}(?:权威|事实记录)|(?:权威|事实记录).{0,24}(?:追加|有序事件流).{0,24}事件存储/u],
  ['authority', /权威(?:状态|写模型).{0,24}(?:唯一写入|业务决定|源服务|事件存储)|(?:唯一写入|业务决定|源服务|事件存储).{0,24}权威(?:状态|写模型)/u],
  ['local-copy', /本地副本.{0,24}(?:派生|只读|消费者拥有).{0,24}(?:不取得|不是|不能成为).{0,16}(?:权威|写入权)|本地副本.{0,24}(?:不取得|不是|不能成为).{0,16}(?:权威|写入权)/u],
  ['projection', /投影.{0,24}(?:事件|权威记录).{0,24}(?:派生|重建).{0,24}(?:读取|查询)|投影.{0,24}(?:读取模型|查询模型).{0,24}(?:派生|重建)/u],
  ['ordered-authority', /按聚合有序.{0,24}(?:事件流|领域事件).{0,24}(?:权威写入记录|权威事实|权威状态)|(?:权威写入记录|权威事实|权威状态).{0,24}按聚合有序.{0,24}(?:事件流|领域事件)/u],
]);
const NON_PROOF_PATTERNS = [
  /(?:完整载荷|完整数据|全量数据).{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}(?:完整载荷|完整数据|全量数据).{0,8}(?:证明|决定)/u,
  /(?:事件|消息)代理.{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}(?:事件|消息)代理.{0,8}(?:证明|决定)/u,
  /Outbox.{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}Outbox.{0,8}(?:证明|决定)/iu,
  /CQRS.{0,24}(?:不要求|不等于|不能证明|并非必须).{0,16}事件溯源|事件溯源.{0,24}(?:不是|并非).{0,12}CQRS.{0,8}(?:必然|要求)/iu,
  /异步.{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}异步.{0,8}(?:证明|决定)/u,
  /可重放(?:日志|流).{0,24}(?:不能|不等于|不足以|并不).{0,16}事件溯源|事件溯源.{0,24}(?:不能由|不由).{0,16}可重放(?:日志|流).{0,8}(?:证明|决定)/u,
];
const REPLAY_SAFETY_PATTERN = /回放.{0,40}(?:不得|不能|禁止|不会).{0,24}(?:再次|重新).{0,12}(?:扣款|支付|发短信|通知|不可逆外部副作用)|(?:扣款|支付|发短信|通知|不可逆外部副作用).{0,40}(?:不得|不能|禁止|不会).{0,16}(?:回放|再次执行)/u;
const MODE_BOUNDARY_PATTERNS = [
  /状态转移.{0,32}(?:不等于|不是|不能替代|不意味着).{0,20}事件携带状态|事件携带状态.{0,32}(?:不等于|不是|不能替代).{0,20}状态转移/u,
  /状态转移.{0,40}(?:from|to|前后状态|合法迁移|状态机).{0,32}(?:不携带|不要求|并非).{0,20}(?:完整快照|完整状态)|(?:完整快照|完整状态).{0,32}(?:不是|不等于).{0,20}状态转移/iu,
  /事件携带状态.{0,40}(?:完整状态|所需字段|变化集).{0,32}(?:本地副本|正常路径不回查)/u,
];
const CONFLATIONS = [
  /命令(?:就是|等于|即为)领域事件/u,
  /领域事件(?:就是|等于|即为)集成事件/u,
  /(?:事件|消息)代理(?:就是|等于|即为)事件存储/u,
  /Outbox(?:就是|等于|即为)事件存储/iu,
  /本地副本(?:就是|等于|即为)(?:权威状态|权威写模型)/u,
  /投影(?:就是|等于|即为)(?:权威状态|事件存储)/u,
];
const NODE_PLACEMENTS = new Map([
  ['notification-event', ['notification-column', 'event-payload-row']],
  ['notification-lookup', ['notification-column', 'consumer-read-row']],
  ['transition-event', ['transition-column', 'event-payload-row']],
  ['consumer-state-machine', ['transition-column', 'consumer-read-row']],
  ['state-snapshot-event', ['carried-state-column', 'event-payload-row']],
  ['consumer-local-copy', ['carried-state-column', 'authority-row']],
  ['command-handler', ['event-sourcing-column', 'producer-write-row']],
  ['aggregate', ['event-sourcing-column', 'producer-write-row']],
  ['event-store', ['event-sourcing-column', 'authority-row']],
  ['read-projection', ['event-sourcing-column', 'consumer-read-row']],
  ['integration-event', ['event-sourcing-column', 'event-payload-row']],
  ['replay-path', ['event-sourcing-column', 'recovery-row']],
]);

const [ledger, manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const article = documents.find(({file}) => `content/${file}` === ARTICLE);

function visibleTextOf(source) {
  return parseMdxVisibleCopy(source, ARTICLE, {includeStructure: true}).blocks.map(({text}) => text).join('\n');
}

function section(source, heading, nextHeading) {
  const start = source.search(new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, 'mu'));
  assert.ok(start >= 0, `${heading} section`);
  const rest = source.slice(start);
  if (!nextHeading) return rest;
  const end = rest.search(new RegExp(`^## ${escapeRegExp(nextHeading)}\\s*$`, 'mu'));
  assert.ok(end > 0, `${nextHeading} follows ${heading}`);
  return rest.slice(0, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertSameCaseComparison(source) {
  const comparison = section(source, '边界与控制流', '数据所有权与一致性');
  const modeHeadings = findMarkdownHeadings(comparison).filter(({level}) => level === 3).map(({text}) => text);
  assert.deepEqual(modeHeadings, MODES, 'exact four ordered mode H3 headings');
  for (let index = 0; index < MODES.length; index += 1) {
    const nextMode = MODES[index + 1];
    const start = comparison.search(new RegExp(`^### ${escapeRegExp(MODES[index])}\\s*$`, 'mu'));
    assert.ok(start >= 0, `${MODES[index]} subsection`);
    const rest = comparison.slice(start);
    const end = nextMode ? rest.search(new RegExp(`^### ${escapeRegExp(nextMode)}\\s*$`, 'mu')) : -1;
    if (nextMode) assert.ok(end > 0, `${nextMode} follows ${MODES[index]}`);
    const modeSource = end > 0 ? rest.slice(0, end) : rest;
    for (const participant of PARTICIPANTS) assert.match(modeSource, new RegExp(participant, 'u'), `${MODES[index]} ${participant}`);
    const answers = QUESTIONS.map((question) => {
      const match = modeSource.match(new RegExp(`(?:^|\\n)(?:[-*]\\s*)?(?:\\*\\*)?${escapeRegExp(question)}(?:\\*\\*)?\\s*[：:]\\s*([^\\n]+)`, 'u'));
      assert.ok(match, `${MODES[index]} structured answer for ${question}`);
      assert.ok(match[1].trim().length >= 4, `${MODES[index]} non-empty answer for ${question}`);
      return match[1].trim();
    });
    assert.equal(new Set(answers).size, QUESTIONS.length, `${MODES[index]} five distinct structured answers`);
  }
}

function assertSemanticContract(source) {
  const visible = visibleTextOf(source);
  for (const [index, key] of MODE_KEYS.entries()) {
    for (const literal of REQUIRED[key]) assert.ok(visible.includes(literal), `${MODES[index]} literal ${literal}`);
  }
  for (const prohibited of PROHIBITED) assert.equal(visible.includes(prohibited), false, `prohibited claim: ${prohibited}`);
  for (const [term, pattern] of TERM_PATTERNS) assert.match(visible, pattern, `${term} separate definition`);
  for (const [responsibility, pattern] of RESPONSIBILITY_PATTERNS) assert.match(visible, pattern, `${responsibility} positive responsibility`);
  for (const pattern of NON_PROOF_PATTERNS) assert.match(visible, pattern, `event-sourcing non-proof ${pattern}`);
  for (const pattern of MODE_BOUNDARY_PATTERNS) assert.match(visible, pattern, `mode boundary ${pattern}`);
  assert.match(visible, REPLAY_SAFETY_PATTERN, 'replay does not re-invoke irreversible external effects');
  for (const conflation of CONFLATIONS) assert.doesNotMatch(visible, conflation, `critical conflation ${conflation}`);
}

function replaceFirstMatching(source, pattern, replacement, label) {
  const mutated = source.replace(pattern, replacement);
  assert.notEqual(mutated, source, `${label} fixture phrase exists`);
  return mutated;
}

function markdownTable(source, label) {
  const tables = [...source.matchAll(/(?:^|\n)(\|[^\n]+\|\n\|(?:\s*:?-{3,}:?\s*\|)+\n(?:\|[^\n]+\|\n?)+)/gu)]
    .map(([, raw]) => raw.trim());
  const table = tables.find((candidate) => MODES.every((mode) => candidate.split('\n')[0].includes(mode)));
  assert.ok(table, label);
  return table;
}

function xmlAttributes(source) {
  return new Map([...source.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, key, value]) => [key, value]));
}

function decodeXmlText(value) {
  return value.replace(/&amp;/gu, '&').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"').replace(/&#39;/gu, "'");
}

function drawioContract(source) {
  const cells = [...source.matchAll(/<mxCell\b([^>]*)>([\s\S]*?)<\/mxCell>|<mxCell\b([^>]*)\/>/gu)]
    .map((match) => {
      const attributes = xmlAttributes(match[1] ?? match[3] ?? '');
      const geometry = xmlAttributes((match[2] ?? '').match(/<mxGeometry\b([^>]*)/u)?.[1] ?? '');
      return {attributes, geometry, label: decodeXmlText(attributes.get('value') ?? ''), body: match[2] ?? ''};
    });
  return {
    nodes: cells.filter(({attributes}) => attributes.get('vertex') === '1'),
    edges: cells.filter(({attributes}) => attributes.get('edge') === '1'),
  };
}

function svgContract(source) {
  const nodes = [...source.matchAll(/<g\b([^>]*)data-node-id="([^"]+)"([^>]*)>/gu)]
    .map(([, before, id, after]) => ({id, attributes: xmlAttributes(`${before}${after}`)}));
  const labels = new Map([...source.matchAll(/<text\b[^>]*data-edge-id="([^"]+)"[^>]*>([^<]*)<\/text>/gu)]
    .map(([, id, label]) => [id, decodeXmlText(label).trim()]));
  const edges = [...source.matchAll(/<path\b([^>]*)data-edge-id="([^"]+)"([^>]*)>/gu)]
    .map(([, before, id, after]) => ({id, attributes: xmlAttributes(`${before}${after}`), label: labels.get(id) ?? ''}));
  return {nodes, edges};
}

function geometry(source, id, format) {
  if (format === 'drawio') {
    const cell = drawioContract(source).nodes.find(({attributes}) => attributes.get('id') === id);
    assert.ok(cell, `Draw.io node ${id}`);
    return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number(cell.geometry.get(key))]));
  }
  const node = svgContract(source).nodes.find((candidate) => candidate.id === id);
  assert.ok(node, `SVG node ${id}`);
  const [x, y, width, height] = (node.attributes.get('data-node-bounds') ?? '').split(/\s+/u).map(Number);
  return {x, y, width, height};
}

function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}

function cssDeclarations(source) {
  return new Map(source.split(';').map((item) => item.trim()).filter(Boolean).map((declaration) => {
    const split = declaration.indexOf(':');
    return [declaration.slice(0, split).trim(), declaration.slice(split + 1).trim()];
  }));
}

function svgElements(source) {
  const elements = [];
  const stack = [];
  for (const match of source.matchAll(/<\/?([A-Za-z][\w:-]*)\b([^>]*)>/gu)) {
    const [tag, name, rawAttributes] = match;
    if (tag.startsWith('</')) {
      stack.pop();
      continue;
    }
    const element = {attributes: xmlAttributes(rawAttributes), name, parent: stack.at(-1) ?? null, tag};
    elements.push(element);
    if (!tag.endsWith('/>') && !['path', 'rect'].includes(name)) stack.push(element);
  }
  return elements;
}

function selectorMatches(element, selector) {
  const terminal = selector.trim().split(/\s+|>/u).at(-1);
  const name = terminal.match(/^[A-Za-z][\w-]*/u)?.[0];
  if (name && name !== element.name) return false;
  const classes = new Set((element.attributes.get('class') ?? '').split(/\s+/u).filter(Boolean));
  return [...terminal.matchAll(/\.([\w-]+)/gu)].every(([, className]) => classes.has(className));
}

function ownSvgPresentationValue(source, element, property) {
  const inline = cssDeclarations(element.attributes.get('style') ?? '').get(property);
  if (inline !== undefined) return inline.replace(/\s*!important\s*$/iu, '');
  let resolved = element.attributes.get(property);
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      const value = cssDeclarations(declarations).get(property);
      if (value === undefined) continue;
      for (const rawSelector of selectors.split(',')) {
        if (selectorMatches(element, rawSelector)) resolved = value;
      }
    }
  }
  return resolved?.replace(/\s*!important\s*$/iu, '');
}

function svgPresentationValue(source, element, property) {
  for (let candidate = element; candidate; candidate = candidate.parent) {
    const value = ownSvgPresentationValue(source, candidate, property);
    if (value !== undefined) return value;
  }
  return undefined;
}

function effectiveOpacity(source, element) {
  let opacity = 1;
  for (let candidate = element; candidate; candidate = candidate.parent) {
    for (const property of ['opacity', `${element.name === 'text' ? 'fill' : 'stroke'}-opacity`]) {
      const value = ownSvgPresentationValue(source, candidate, property);
      if (value !== undefined) opacity *= Number(value);
    }
  }
  assert.ok(Number.isFinite(opacity) && opacity > 0 && opacity <= 1, `${element.name} visible effective opacity`);
  return opacity;
}

function luminance(color) {
  const match = color?.trim().match(/^#([\da-f]{6})$/iu);
  assert.ok(match, `opaque six-digit color ${String(color)}`);
  const channels = match[1].match(/.{2}/gu).map((item) => Number.parseInt(item, 16) / 255)
    .map((item) => item <= 0.04045 ? item / 12.92 : ((item + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(left, right) {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function blendHex(foreground, background, opacity) {
  const channels = (color) => color.match(/[\da-f]{2}/giu).map((value) => Number.parseInt(value, 16));
  const foregroundChannels = channels(foreground);
  const backgroundChannels = channels(background);
  return `#${foregroundChannels.map((value, index) => Math.round(
    value * opacity + backgroundChannels[index] * (1 - opacity),
  ).toString(16).padStart(2, '0')).join('')}`;
}

function parsePathPoints(data) {
  const tokens = data.match(/[MHV]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? [];
  const points = [];
  let cursor = 0;
  let x = 0;
  let y = 0;
  while (cursor < tokens.length) {
    const command = tokens[cursor++];
    if (command === 'M') {
      x = Number(tokens[cursor++]); y = Number(tokens[cursor++]);
    } else if (command === 'H') x = Number(tokens[cursor++]);
    else if (command === 'V') y = Number(tokens[cursor++]);
    else assert.fail(`unsupported connector path command ${command}`);
    points.push({x, y});
  }
  assert.ok(points.length >= 2, `orthogonal connector path ${data}`);
  return points;
}

function labelBounds(tag, label, fontSize) {
  const attributes = xmlAttributes(tag);
  const x = Number(attributes.get('x'));
  const y = Number(attributes.get('y'));
  const width = [...label].reduce((sum, character) => sum + (/^[\u0000-\u00ff]$/u.test(character) ? 0.62 : 1), 0) * fontSize;
  return {left: x - width / 2, right: x + width / 2, top: y - fontSize, bottom: y + fontSize * 0.3};
}

function pointRectangleDistance(point, rectangle) {
  const dx = Math.max(rectangle.left - point.x, 0, point.x - rectangle.right);
  const dy = Math.max(rectangle.top - point.y, 0, point.y - rectangle.bottom);
  return Math.hypot(dx, dy);
}

function markerGeometry(source, edgeElement, points) {
  const markerId = svgPresentationValue(source, edgeElement, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1];
  assert.ok(markerId, `${edgeElement.attributes.get('data-edge-id')} marker-end resolves`);
  const elements = svgElements(source);
  const marker = elements.find(({attributes, name}) => name === 'marker' && attributes.get('id') === markerId);
  assert.ok(marker, `${markerId} marker definition`);
  const markerPath = elements.find(({name, parent}) => name === 'path' && parent === marker);
  assert.ok(markerPath, `${markerId} marker shape`);
  const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number);
  assert.equal(viewBox.length, 4, `${markerId} marker viewBox`);
  const markerWidth = Number(marker.attributes.get('markerWidth'));
  const markerHeight = Number(marker.attributes.get('markerHeight'));
  assert.ok(markerWidth > 0 && markerHeight > 0 && markerWidth <= 16 && markerHeight <= 16,
    `${markerId} bounded marker dimensions`);
  const endpoint = points.at(-1);
  const previous = points.at(-2);
  const magnitude = Math.hypot(endpoint.x - previous.x, endpoint.y - previous.y);
  assert.ok(magnitude > 0, `${markerId} non-zero terminal segment`);
  const axis = {x: (endpoint.x - previous.x) / magnitude, y: (endpoint.y - previous.y) / magnitude};
  const perpendicular = {x: -axis.y, y: axis.x};
  const strokeWidth = Number(svgPresentationValue(source, edgeElement, 'stroke-width'));
  const unitScale = marker.attributes.get('markerUnits') === 'userSpaceOnUse' ? 1 : strokeWidth;
  const scaleX = markerWidth / viewBox[2] * unitScale;
  const scaleY = markerHeight / viewBox[3] * unitScale;
  const refX = Number(marker.attributes.get('refX'));
  const refY = Number(marker.attributes.get('refY'));
  const coordinates = (markerPath.attributes.get('d')?.match(/-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? []).map(Number);
  const pointsOnMarker = [];
  for (let index = 0; index < coordinates.length; index += 2) {
    const localX = (coordinates[index] - refX) * scaleX;
    const localY = (coordinates[index + 1] - refY) * scaleY;
    pointsOnMarker.push({
      x: endpoint.x + axis.x * localX + perpendicular.x * localY,
      y: endpoint.y + axis.y * localX + perpendicular.y * localY,
    });
  }
  assert.ok(pointsOnMarker.length >= 3 && pointsOnMarker.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)),
    `${markerId} actual marker bounds`);
  return pointsOnMarker;
}

function localBackground(source, labelElement) {
  const x = Number(labelElement.attributes.get('x'));
  const y = Number(labelElement.attributes.get('y'));
  const candidates = svgElements(source).filter(({attributes, name}) => {
    if (name !== 'rect') return false;
    const left = Number(attributes.get('x'));
    const top = Number(attributes.get('y'));
    const width = Number(attributes.get('width'));
    const height = Number(attributes.get('height'));
    return [left, top, width, height].every(Number.isFinite) && x >= left && x <= left + width && y >= top && y <= top + height;
  }).map((element) => ({
    area: Number(element.attributes.get('width')) * Number(element.attributes.get('height')),
    color: svgPresentationValue(source, element, 'fill'),
    element,
  })).filter(({color, element}) => color && color !== 'none' && effectiveOpacity(source, element) === 1)
    .sort((left, right) => left.area - right.area);
  assert.ok(candidates.length > 0, `${labelElement.attributes.get('data-edge-id')} painted local background`);
  return candidates[0].color;
}

function assertDiagramPresentation(source) {
  const elements = svgElements(source);
  const root = elements.find(({name}) => name === 'svg');
  const viewBox = (root?.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number);
  assert.equal(viewBox.length, 4, 'SVG viewBox');
  const scale = 800 / viewBox[2];
  assert.ok(Number.isFinite(scale) && scale > 0 && scale <= 1, '800px/viewBox rendered scale');
  const edges = svgContract(source).edges;
  assert.equal(new Set(edges.map(({attributes}) => attributes.get('d'))).size, edges.length, 'unique connector paths');
  for (const edge of edges) {
    const pathElement = elements.find(({attributes, name}) => name === 'path' && attributes.get('data-edge-id') === edge.id);
    const labelElement = elements.find(({attributes, name}) => name === 'text' && attributes.get('data-edge-id') === edge.id);
    assert.ok(pathElement && labelElement, `${edge.id} visible edge and label`);
    const backgroundColor = localBackground(source, labelElement);
    const pathColor = blendHex(svgPresentationValue(source, pathElement, 'stroke'), backgroundColor,
      effectiveOpacity(source, pathElement));
    const labelColor = blendHex(svgPresentationValue(source, labelElement, 'fill'), backgroundColor,
      effectiveOpacity(source, labelElement));
    assert.ok(contrastRatio(pathColor, backgroundColor) >= 3, `${edge.id} effective path contrast`);
    assert.ok(contrastRatio(labelColor, backgroundColor) >= 4.5, `${edge.id} effective label contrast`);
    const labelText = edge.label;
    const fontSize = Number.parseFloat(svgPresentationValue(source, labelElement, 'font-size'));
    const bounds = labelBounds(labelElement.tag, labelText, fontSize);
    const points = parsePathPoints(edge.attributes.get('d') ?? '');
    const markerGap = Math.min(...markerGeometry(source, pathElement, points)
      .map((point) => pointRectangleDistance(point, bounds))) * scale;
    assert.ok(markerGap >= 16, `${edge.id} marker-aware label clearance ${markerGap}`);
  }
}

async function runMutation(source, mutate, validator, label) {
  const mutated = mutate(source);
  assert.notEqual(mutated, source, `${label} mutation applies`);
  await assert.rejects(async () => validator(mutated), {name: 'AssertionError'}, label);
}

test('publishes exact STY-06 metadata, headings, relations, and one same-case comparison', async () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const metadata = parseFrontMatter(article.source);
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.topic_id, TOPIC_ID);
  assert.equal(metadata.priority, 'P0');
  assert.equal(metadata.slug, ROUTE);
  for (const [field, value] of Object.entries(RELATION_METADATA)) assert.deepEqual(metadata[field], value, field);
  const headings = findMarkdownHeadings(article.body);
  const h2Headings = headings.filter(({level}) => level === 2).map(({text}) => text);
  assert.deepEqual(h2Headings, HEADINGS, 'exact eleven ordered H2 headings');
  for (const heading of HEADINGS) assert.equal(h2Headings.filter((candidate) => candidate === heading).length, 1, `${heading} H2 once`);
  assertSameCaseComparison(article.source);
  await runMutation(article.source, (source) => source.replace(
    /(^### 事件携带状态\s*$)([\s\S]*?)(?=^### 事件溯源\s*$)/mu,
    '$1\n\n客户资料变更后，目录消费者更新商品分类。\n\n',
  ), assertSameCaseComparison, 'unrelated customer/catalog scenario');
});

test('locks semantic boundaries, distinct responsibilities, prohibitions, and reliability ownership', async () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  assertSemanticContract(article.source);
  const visible = visibleTextOf(article.source);
  for (const pattern of RELIABILITY_PATTERNS) assert.match(visible, pattern, `reliability ${pattern}`);
  for (const pattern of OWNED_FAILURE_PATTERNS) assert.match(visible, pattern, `explicit failure owner ${pattern}`);
  for (const [index, conflation] of CONFLATIONS.entries()) {
    await runMutation(article.source, (source) => `${source}\n\n${[
      '命令就是领域事件。', '领域事件就是集成事件。', '事件代理就是事件存储。',
      'Outbox 就是事件存储。', '本地副本就是权威状态。', '投影就是事件存储。',
    ][index]}\n`, assertSemanticContract, `critical conflation ${conflation}`);
  }
  for (const prohibited of PROHIBITED) {
    await runMutation(article.source, (source) => `${source}\n\n${prohibited}。\n`, assertSemanticContract, prohibited);
  }
  const semanticMutations = [
    ['transition conflated with carried state', MODE_BOUNDARY_PATTERNS[0], '状态转移就是事件携带状态'],
    ['full payload proves event sourcing', NON_PROOF_PATTERNS[0], '完整数据就是事件溯源'],
    ['broker proves event sourcing', NON_PROOF_PATTERNS[1], '消息代理就是事件溯源'],
    ['Outbox proves event sourcing', NON_PROOF_PATTERNS[2], 'Outbox 就是事件溯源'],
    ['CQRS proves event sourcing', NON_PROOF_PATTERNS[3], 'CQRS 必须使用事件溯源'],
    ['async proves event sourcing', NON_PROOF_PATTERNS[4], '异步就是事件溯源'],
    ['replayable log proves event sourcing', NON_PROOF_PATTERNS[5], '可重放日志就是事件溯源'],
    ['replay invokes payment', REPLAY_SAFETY_PATTERN, '回放可以再次扣款、发短信并调用不可逆外部副作用'],
  ];
  for (const [label, pattern, replacement] of semanticMutations) {
    await runMutation(article.source,
      (source) => replaceFirstMatching(source, pattern, replacement, label), assertSemanticContract, label);
  }
});

test('locks the four-mode decision matrix dimensions', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const table = markdownTable(article.body, 'four-mode decision matrix');
  const rows = table.split('\n').map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));
  assert.deepEqual(rows[0].slice(1), MODES, 'fixed four mode columns');
  assert.ok(rows.slice(2).every((row) => row.length === 5), 'one dimension plus four mode answers');
  const rowLabels = rows.slice(2).map(([label]) => label).join('\n');
  for (const pattern of MATRIX_ROWS) assert.match(rowLabels, pattern, `decision row ${pattern}`);
});

test('governs six sources, independent hosts, evidence roles, rights, and one manifest primary', () => {
  const documentRecord = ledger.documents[ARTICLE];
  assert.ok(documentRecord, `${ARTICLE} source-ledger document`);
  assert.deepEqual(documentRecord.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(documentRecord.citations.map(({source_id}) => source_id), SOURCE_IDS);
  assert.equal(documentRecord.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  assert.equal(documentRecord.citations.find(({manifest_primary}) => manifest_primary)?.source_id,
    'src-fowler-what-do-you-mean-event-driven');
  for (const sourceId of SOURCE_IDS) {
    const source = ledger.sources.find(({id}) => id === sourceId);
    const citation = documentRecord.citations.find(({source_id}) => source_id === sourceId);
    assert.ok(source, `${sourceId} governed source`);
    for (const field of SOURCE_REQUIRED_FIELDS) {
      assert.notDeepEqual(source[field], undefined, `${sourceId}.${field}`);
      assert.notDeepEqual(source[field], '', `${sourceId}.${field} nonempty`);
    }
    assert.ok(Array.isArray(source.allowed_evidence_roles) && source.allowed_evidence_roles.length > 0,
      `${sourceId} allowed evidence roles`);
    assert.ok(Array.isArray(citation?.roles) && citation.roles.length > 0, `${sourceId} citation roles`);
    assert.ok(citation.roles.every((role) => source.allowed_evidence_roles.includes(role)), `${sourceId} role boundary`);
    assert.equal(typeof citation.usage_mode, 'string', `${sourceId} usage mode`);
    assert.equal(typeof citation.attribution_note, 'string', `${sourceId} attribution`);
  }
  const remoteSources = SOURCE_IDS.slice(0, -1).map((id) => ledger.sources.find((source) => source.id === id));
  assert.ok(new Set(remoteSources.map(({canonical_locator}) => new URL(canonical_locator).hostname)).size >= 4,
    'at least four independent remote hostnames');
  const illustration = ledger.sources.find(({id}) => id === SOURCE_IDS.at(-1));
  assert.equal(illustration.source_kind, 'original-illustration');
  assert.equal(illustration.license, 'LicenseRef-Atlas-Original');
  assert.equal(illustration.copyright_policy, 'original-atlas');
  assert.match(illustration.license_evidence_note, /不含|no third-party/iu);
  assert.match(illustration.license_evidence_note, /参考图|reference image/iu);
  assert.match(illustration.license_evidence_note, /品牌|brand/iu);
  assert.match(illustration.license_evidence_note, /签名|signature/iu);
  assert.match(illustration.license_evidence_note, /水印|watermark/iu);
  assert.match(illustration.license_evidence_note, /构图|composition/iu);
  assert.ok(article, `${ARTICLE} visible sources`);
  assert.deepEqual(extractExternalLinks({body: article.body}).sort(), remoteSources.map(({canonical_locator}) => canonical_locator).sort());
});

test('locks reciprocal visible links and excludes actionable STY-07', () => {
  assert.ok(article, `${ARTICLE} must exist after implementation`);
  const articleLinks = extractInternalLinks({body: article.body});
  assert.ok(articleLinks.includes('/styles'), 'visible parent styles route');
  assert.ok(articleLinks.includes('/cases/apache-kafka-consumer-groups'), 'visible related case');
  assert.equal(articleLinks.includes('/styles/sty-07'), false, 'STY-07 is non-actionable');
  for (const file of RECIPROCAL_FILES) {
    const document = documents.find((candidate) => candidate.file === file);
    assert.ok(document, `${file} reciprocal document`);
    assert.ok(extractInternalLinks({body: document.body}).includes(ROUTE), `${file} visible ${ROUTE}`);
  }
  for (const document of documents) {
    assert.equal(extractInternalLinks({body: document.body}).includes('/styles/sty-07'), false,
      `${document.file} no actionable STY-07`);
  }
});

test('projects the exact STY-06 Stage A pre-closure state', () => {
  assert.deepEqual({
    completed_topics: projectStatus.completed_topics,
    content_documents: projectStatus.content_documents,
    governed_sources: projectStatus.governed_sources,
  }, {completed_topics: 58, content_documents: 101, governed_sources: 525});
  assert.equal(publicLedger.sources.length, 525);
  const topic = manifest.topics.find(({id}) => id === TOPIC_ID);
  assert.equal(topic?.slug, ROUTE);
  assert.equal(topic?.published, true);
  assert.equal(topic?.status.value, 'pending');
  assert.deepEqual(topic?.dependencies, RELATION_METADATA.depends_on);
  assert.deepEqual(topic?.adjacent_topics, RELATION_METADATA.adjacent_topics);
  assert.deepEqual(topic?.related_cases, RELATION_METADATA.related_cases);
  assert.deepEqual(topic?.primary_sources, ['https://martinfowler.com/articles/201701-event-driven.html']);
  const nextTopic = manifest.topics.find(({id}) => id === 'STY-07');
  assert.equal(nextTopic?.published, false);
  assert.equal(nextTopic?.status.value, 'pending');
  assert.equal(indexes.style.find(({id}) => id === TOPIC_ID)?.published, true);
  assert.equal(indexes.style.find(({id}) => id === 'STY-07')?.published, false);
});

test('locks synchronized four-column/five-row diagram geometry and replay boundaries', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${SVG}`, import.meta.url), 'utf8'),
  ]);
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<title\b[^>]*>[^<]*(?:事件通知|事件驱动)[^<]*<\/title>/u);
  assert.match(svg, /<desc\b[^>]*>[^<]*(?=[^<]*事件通知)(?=[^<]*状态转移)(?=[^<]*事件携带状态)(?=[^<]*事件溯源)[^<]*<\/desc>/u);
  const root = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.match(root, /\bviewBox="0 0 [0-9.]+ [0-9.]+"/u);
  assert.match(root, /\brole="img"/u);
  assert.doesNotMatch(root, /\b(?:width|height)="/u);
  const drawioNodes = new Set(drawioContract(drawio).nodes.map(({attributes}) => attributes.get('id')));
  const svgNodes = new Set(svgContract(svg).nodes.map(({id}) => id));
  for (const id of [...COLUMN_IDS, ...ROW_IDS, ...CRITICAL_IDS]) {
    assert.ok(drawioNodes.has(id), `Draw.io ${id}`);
    assert.ok(svgNodes.has(id), `SVG ${id}`);
  }
  assert.deepEqual([...drawioNodes].sort(), [...svgNodes].sort(), 'Draw.io/SVG node ID parity');
  const drawioEdges = drawioContract(drawio).edges.map(({attributes}) => ({
    id: attributes.get('id'), source: attributes.get('source'), target: attributes.get('target'),
  }));
  const svgEdges = svgContract(svg).edges.map(({id, attributes}) => ({
    id, source: attributes.get('data-source'), target: attributes.get('data-target'),
  }));
  assert.deepEqual(drawioEdges.sort((left, right) => left.id.localeCompare(right.id)),
    svgEdges.sort((left, right) => left.id.localeCompare(right.id)), 'Draw.io/SVG edge ID and endpoint parity');
  for (const format of ['drawio', 'svg']) {
    const source = format === 'drawio' ? drawio : svg;
    for (const [nodeId, [columnId, rowId]] of NODE_PLACEMENTS) {
      assert.ok(contains(geometry(source, columnId, format), geometry(source, nodeId, format)),
        `${format} ${columnId} contains ${nodeId}`);
      assert.ok(contains(geometry(source, rowId, format), geometry(source, nodeId, format)),
        `${format} ${rowId} contains ${nodeId}`);
    }
  }
  for (const edges of [drawioEdges, svgEdges]) {
    const replayEdges = edges.filter(({id, source}) => id?.includes('replay') || source === 'replay-path');
    assert.ok(replayEdges.length > 0, 'explicit replay connector');
    for (const edge of replayEdges) assert.doesNotMatch(edge.target ?? '', /payment|notification|side-effect/u,
      `${edge.id} replay cannot target an external side effect`);
    assert.notEqual(edges.some(({source, target}) => source === 'event-store' && target === 'event-broker'), true,
      'event store and broker are separate responsibilities');
  }
});

test('keeps marker-aware label clearance and selector-bound effective contrast mutation-sensitive', async () => {
  const svg = await readFile(new URL(`../${SVG}`, import.meta.url), 'utf8');
  assertDiagramPresentation(svg);
  const whiteEdge = svg.replace(/(\.[\w-]*edge[\w-]*\s*\{[^}]*\bstroke\s*:\s*)#[0-9A-Fa-f]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteEdge, svg, 'edge selector mutation applies');
  assert.throws(() => assertDiagramPresentation(whiteEdge), {name: 'AssertionError'}, 'selector-bound edge contrast');
  const whiteLabel = svg.replace(/(\.edge-label\s*\{[^}]*\bfill\s*:\s*)#[0-9A-Fa-f]{6}/u, '$1#FFFFFF');
  assert.notEqual(whiteLabel, svg, 'edge-label selector mutation applies');
  assert.throws(() => assertDiagramPresentation(whiteLabel), {name: 'AssertionError'}, 'selector-bound label contrast');
  const firstEdge = svgContract(svg).edges[0];
  const targetPoint = parsePathPoints(firstEdge.attributes.get('d') ?? '').at(-1);
  const hiddenLabel = svg.replace(
    new RegExp(`(<text\\b[^>]*data-edge-id="${escapeRegExp(firstEdge.id)}"[^>]*\\bx=")[^"]+("[^>]*\\by=")[^"]+`, 'u'),
    `$1${targetPoint.x}$2${targetPoint.y}`,
  );
  assert.notEqual(hiddenLabel, svg, 'marker/label collision mutation applies');
  assert.throws(() => assertDiagramPresentation(hiddenLabel), {name: 'AssertionError'}, 'actual marker-aware label clearance');
  const removedMarker = svg.replace(/(\.[\w-]+\s*\{[^}]*?)\s*marker-end\s*:\s*url\(#[^)]+\)\s*;/u, '$1');
  assert.notEqual(removedMarker, svg, 'marker removal mutation applies');
  assert.throws(() => assertDiagramPresentation(removedMarker), {name: 'AssertionError'}, 'missing effective marker-end');
  const oversizedMarker = svg.replace(/(<marker\b[^>]*\bmarkerWidth=")[^"]+("[^>]*\bmarkerHeight=")[^"]+/u,
    '$1999$2999');
  assert.notEqual(oversizedMarker, svg, 'oversized marker mutation applies');
  assert.throws(() => assertDiagramPresentation(oversizedMarker), {name: 'AssertionError'}, 'oversized actual marker bounds');
  const localBackgroundMutation = svg.replace(
    /(<rect\b(?=[^>]*(?:data-label-background|data-edge-label-background))[^>]*\bfill=")#[0-9A-Fa-f]{6}/u,
    '$1#111827',
  );
  assert.notEqual(localBackgroundMutation, svg, 'local edge-label background mutation applies');
  assert.throws(() => assertDiagramPresentation(localBackgroundMutation), {name: 'AssertionError'},
    'local-background effective contrast');
  const opacityMutation = svg.replace(/(<text\b[^>]*data-edge-id="[^"]+"[^>]*)(>)/u, '$1 opacity="0.05"$2');
  assert.notEqual(opacityMutation, svg, 'edge-label opacity mutation applies');
  assert.throws(() => assertDiagramPresentation(opacityMutation), {name: 'AssertionError'}, 'effective opacity contrast');
});
