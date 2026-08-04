import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  parseFrontMatter,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks, visibleMdxLines} from '../scripts/source-ledger.mjs';
import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const document = documents.find(
  ({file}) => file === 'modeling/mod-10-domain-storytelling.mdx',
);
const documentsById = new Map(
  documents.map((content) => [content.metadata.topic_id, content]),
);
const ledger = JSON.parse(
  await readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8'),
);
const customCss = await readFile(new URL('../src/css/custom.css', import.meta.url), 'utf8');

const expectedSources = new Map([
  ['src-docs-be2e1512961a', 'https://domainstorytelling.org/quick-start-guide'],
  ['src-docs-9e1e53a50c3b', 'https://domainstorytelling.org/'],
  ['src-docs-a2dceda76218', 'https://domainstorytelling.org/requirements'],
  ['src-docs-0d3f7c6c1483', 'https://domainstorytelling.org/articles/how-to-model-loops/'],
]);

const sourceDefinitions = [
  {id: 'src-docs-be2e1512961a', title: 'Domain Storytelling Quick-Start Guide', author: 'Domain Storytelling', roles: ['definition', 'method', 'learning'], boundary: 'Supports actors, work objects, activities, sequence numbers, annotations, scope choices, typical-case modeling, workshop participation and replay checks; it does not make a Domain Story a complete requirement, executable process or architecture proof.'},
  {id: 'src-docs-9e1e53a50c3b', title: 'Domain Storytelling', author: 'Domain Storytelling', roles: ['definition', 'learning'], boundary: 'Supports the method purpose of shared understanding, domain language, activities and work objects; it does not prove this article’s system boundary or production behavior.'},
  {id: 'src-docs-a2dceda76218', title: 'Requirements', author: 'Domain Storytelling', roles: ['method', 'comparison', 'learning'], boundary: 'Supports bridging a Domain Story into requirements and user stories while retaining scenario context; it does not make Domain Storytelling and use cases or user stories equivalent.'},
  {id: 'src-docs-0d3f7c6c1483', title: 'How to Model Repeating Activities', author: 'Stefan Hofer', roles: ['method', 'comparison'], boundary: 'Supports concrete-instance, annotation and group choices for repeating activities; it does not give a Domain Story formal loop, branch or execution semantics.'},
];

const expectedHeadings = [
  '学习问题',
  '建模目标与输入',
  '元素选择与证据边界',
  '核心产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];

const expectedMetadata = {
  title: 'Domain Storytelling 协作建模',
  slug: '/modeling/mod-10',
  content_type: 'modeling',
  status: 'reviewed',
  difficulty: 'intermediate',
  analyzed_at: '2026-08-04',
  source_cutoff: '2026-08-04',
  review_policy: 'quarterly-version-sensitive',
  confidence: 'high',
  domains: ['software-architecture', 'domain-modeling'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['maintainability'],
  tags: ['Domain Storytelling', '领域协作', '业务流程', '模型比较'],
  summary: '用费用支付典型场景演练 Domain Storytelling，并明确它与流程图、用例和 EventStorming 的证据边界。',
  topic_id: 'MOD-10',
  priority: 'P1',
  depends_on: ['MOD-01', 'MOD-02', 'MOD-09'],
  adjacent_topics: ['MOD-08', 'MOD-09'],
  related_cases: ['/cases/temporal-saga-durable-execution'],
  related_questions: [],
};

const expectedStoryRows = [
  {'序号': '1', '主体 actor': '费用申报系统', activity: '展示', 'work object': '待支付费用', '协作 actor': '财务人员', '证据说明': '费用申报系统中的待支付费用视图；不证明银行已经接受请求'},
  {'序号': '2', '主体 actor': '财务人员', activity: '提交', 'work object': '支付请求', '协作 actor': '费用申报系统', '证据说明': '本地支付请求记录；只证明财务人员表达了支付意图'},
  {'序号': '3', '主体 actor': '费用申报系统', activity: '传递', 'work object': '支付请求', '协作 actor': '银行支付服务', '证据说明': '请求传递记录；不证明支付已经发生或成功'},
  {'序号': '4', '主体 actor': '银行支付服务', activity: '提供', 'work object': '银行支付回执', '协作 actor': '费用申报系统', '证据说明': '银行支付服务回执；是本故事支付结果的外部权威证据'},
  {'序号': '5', '主体 actor': '费用申报系统', activity: '创建', 'work object': '支付结果记录', '协作 actor': '—', '证据说明': '依据银行支付回执创建的本地记录；不能反向替代银行回执'},
  {'序号': '6', '主体 actor': '费用申报系统', activity: '展示', 'work object': '支付结果记录', '协作 actor': '财务人员', '证据说明': '向财务人员展示的本地结果；结论仍由银行回执支撑'},
];

const expectedActors = [
  {id: 'bank_actor', type: 'Actor', label: '银行支付服务'},
  {id: 'expense_actor', type: 'Actor', label: '费用申报系统'},
  {id: 'finance_actor', type: 'Actor', label: '财务人员'},
];

const expectedWorkObjects = [
  {id: 'pending_object', type: 'Work Object', label: '待支付费用'},
  {id: 'receipt_object', type: 'Work Object', label: '银行支付回执'},
  {id: 'request_submit_object', type: 'Work Object', label: '支付请求'},
  {id: 'request_transfer_object', type: 'Work Object', label: '支付请求'},
  {id: 'result_create_object', type: 'Work Object', label: '支付结果记录'},
  {id: 'result_view_object', type: 'Work Object', label: '支付结果记录'},
];

const expectedActivityEdges = [
  'expense_actor--1 展示->pending_object',
  'finance_actor--2 提交->request_submit_object',
  'expense_actor--3 传递->request_transfer_object',
  'bank_actor--4 提供->receipt_object',
  'expense_actor--5 创建->result_create_object',
  'expense_actor--6 展示->result_view_object',
].toSorted();

const expectedCollaboratorEdges = [
  'pending_object-.->finance_actor',
  'request_submit_object-.->expense_actor',
  'request_transfer_object-.->bank_actor',
  'receipt_object-.->expense_actor',
  'result_view_object-.->finance_actor',
].toSorted();

const expectedComparisonRows = [
  {'模型': 'Domain Storytelling', '主要问题': '一个具体业务场景中，谁对什么做了什么并与谁协作', '典型输入': '领域专家讲述、业务语言、具体实例与 scope 决定', '核心产物': '带 actor、work object、activity、序号与 annotation 的 Domain Story', '适合发现什么': '共同语言、参与者协作、工作对象、遗漏、分歧与重要变体', '明确不证明什么': '完整分支、正式需求、API、事务、服务边界或组织设计'},
  {'模型': '流程图', '主要问题': '活动、判断、分支与路径如何连接', '典型输入': '已识别的活动、条件、入口、出口与规则', '核心产物': '活动节点、判断与有向路径', '适合发现什么': '路径遗漏、分支、循环、顺序与规则缺口', '明确不证明什么': '参与者已经共享领域语言或系统实现满足流程'},
  {'模型': '用例', '主要问题': 'actor 为实现目标如何与系统交互', '典型输入': 'actor 目标、系统范围、前后条件及主与替代流程', '核心产物': '用例、参与者、前后条件与场景描述', '适合发现什么': '系统责任、目标、交互边界与需求场景', '明确不证明什么': 'actor、work object、activity 与用例元素存在一一映射'},
  {'模型': 'EventStorming', '主要问题': '领域中发生了什么，哪里存在热点、未知项和边界线索', '典型输入': '领域事件、参与者叙述、政策、系统、事故与术语证据', '核心产物': '过去时事件时间线、Process Model、热点与候选假设', '适合发现什么': '事件语言、业务转折、政策、未知项和候选边界信号', '明确不证明什么': '与 Domain Storytelling 等价或可按元素严格互换'},
];

const expectedWorkshopSteps = [
  '主持人说明场景、粒度、as-is、digitalized、权威名称和非目标。',
  '领域专家从一个具体费用支付实例开始，用自己的领域语言回答“接下来发生什么”。',
  '主持人逐句画出 actor、work object、activity 和 sequence number，并当场朗读。',
  '参与者即时纠正术语、遗漏、顺序和工作对象，不用抽象词掩盖真实分歧。',
  '团队先完成典型路径；小差异写入 annotation，重要替代情形另建 Domain Story。',
  '全体从第一句开始复述，检查明显错误、遗漏和领域专家是否认可。',
  '团队复查 annotations，为每个分歧或变体确定澄清方式、后续故事或其他模型。',
];

const annotationRule = '如果费用申报系统未取得可核验的银行回执，则停止典型故事，将“支付结果仍未知”保留为 annotation，并依据 MOD-08 另建异常故事。';

const scopeSentence = '本文只建立 one narrow、digitalized、as-is、typical/80% 的费用支付故事：财务人员从费用申报系统查看待支付费用，提交支付请求，系统把请求传递给银行支付服务，并依据可核验的银行回执创建和展示支付结果记录。';
const nameAuthoritySentence = '本文承接 [MOD-02 C4 模型](/modeling/mod-02)的名称与系统权威：本地软件 actor 始终称为“费用申报系统”，外部软件 actor 始终称为“银行支付服务”。';
const paymentEvidenceSentence = '它也承接 [MOD-08 状态机建模](/modeling/mod-08)的结果证据边界：本地支付请求、传递记录和支付结果记录都不能代替银行支付服务回执。';

const nonProofSentences = [
  'actor 不等于团队、长期 owner、服务或部署单元。',
  'software actor 不证明真实 API、契约、协议、SLA 或安全责任。',
  'work object 不等于数据库表、聚合、数据 owner 或权威存储。',
  'activity arrow 不等于同步调用、消息、事务或网络连接。',
  'sequence number 不等于完整时序、并发语义或性能保证。',
  'annotation 不等于已经实现的分支、错误处理或正式需求。',
  '一张典型 Domain Story 不证明全部异常、循环、合规路径或流程完备性。',
  '一次 workshop 不单独确认正式系统边界、Bounded Context 或组织结构。',
];

const expectedWrapperLabels = [
  '费用支付故事句子表，可横向滚动',
  '费用支付 Domain Story，可横向滚动',
  'Domain Storytelling 四模型比较表，可横向滚动',
];

function requiredDocument() {
  assert.ok(document, 'MOD-10 content document must exist');
  return document;
}

function assertPublicationContract(source) {
  const metadata = parseFrontMatter(source);
  assert.deepEqual(metadata, expectedMetadata);
  assert.deepEqual(
    findMarkdownHeadings(source).filter(({level}) => level === 2).map(({text}) => text),
    expectedHeadings,
  );
}

function sectionBody(body, heading) {
  const marker = `## ${heading}\n`;
  const start = body.indexOf(marker);
  assert.notEqual(start, -1, `missing section: ${heading}`);
  const contentStart = start + marker.length;
  const next = body.indexOf('\n## ', contentStart);
  return body.slice(contentStart, next === -1 ? body.length : next).trim();
}

function markdownTables(body) {
  const tables = [];
  let current = [];
  for (const line of visibleMdxLines({body})) {
    if (/^\|.+\|$/u.test(line)) {
      current.push(line.slice(1, -1).split('|').map((cell) => cell.trim()));
    } else if (current.length > 0) {
      tables.push(current);
      current = [];
    }
  }
  if (current.length > 0) tables.push(current);
  return tables;
}

function records(table, expectedHeader) {
  const [header, separator, ...rows] = table;
  assert.deepEqual(header, expectedHeader);
  assert.deepEqual(separator, expectedHeader.map(() => '---'));
  return rows.map((row) => {
    assert.equal(row.length, header.length, 'table record column count');
    return Object.fromEntries(header.map((key, index) => [key, row[index]]));
  });
}

function stripHtmlComments(line, state) {
  let visible = '';
  let cursor = 0;
  while (cursor < line.length) {
    if (state.inComment) {
      const end = line.indexOf('-->', cursor);
      if (end === -1) return visible;
      state.inComment = false;
      cursor = end + 3;
      continue;
    }
    const start = line.indexOf('<!--', cursor);
    if (start === -1) return visible + line.slice(cursor);
    visible += line.slice(cursor, start);
    const end = line.indexOf('-->', start + 4);
    if (end === -1) {
      state.inComment = true;
      return visible;
    }
    cursor = end + 3;
  }
  return visible;
}

function visibleContractLines(body) {
  const lines = [];
  const state = {inComment: false};
  let fence;
  for (const rawLine of body.split(/\r?\n/u)) {
    if (fence) {
      const closing = rawLine.match(/^ {0,3}([`~]{3,})[ \t]*$/u);
      if (closing && closing[1][0] === fence.marker && closing[1].length >= fence.length) {
        if (fence.isMermaid) lines.push(rawLine);
        fence = undefined;
      } else if (fence.isMermaid) {
        lines.push(rawLine);
      }
      continue;
    }
    const line = stripHtmlComments(rawLine, state);
    const opening = line.match(/^ {0,3}([`~]{3,})([^\r\n]*)$/u);
    if (opening) {
      fence = {
        marker: opening[1][0],
        length: opening[1].length,
        isMermaid: opening[2].trim() === 'mermaid',
      };
      if (fence.isMermaid) lines.push(line);
      continue;
    }
    lines.push(line);
  }
  return lines;
}

function assertTableContracts(body) {
  const tables = markdownTables(body);
  assert.equal(tables.length, 2, 'MOD-10 must contain exactly two Markdown tables');
  const storyRows = records(tables[0], ['序号', '主体 actor', 'activity', 'work object', '协作 actor', '证据说明']);
  const comparisonRows = records(tables[1], ['模型', '主要问题', '典型输入', '核心产物', '适合发现什么', '明确不证明什么']);
  assert.deepEqual(storyRows, expectedStoryRows);
  assert.deepEqual(storyRows.map((row) => row['序号']), ['1', '2', '3', '4', '5', '6']);
  assert.equal(new Set(storyRows.flatMap((row) => [row['主体 actor'], row['协作 actor']]).filter((actor) => actor !== '—')).size, 3);
  assert.equal(new Set(storyRows.map((row) => row['work object'])).size, 4);
  assert.deepEqual(comparisonRows, expectedComparisonRows);
}

function storyDiagram(body) {
  const visibleBody = visibleContractLines(body).join('\n');
  const diagrams = [...visibleBody.matchAll(/```mermaid\n([\s\S]*?)\n```/gu)].map((match) => match[1]);
  assert.equal(diagrams.length, 1, 'MOD-10 must contain exactly one Mermaid diagram');
  assert.match(diagrams[0], /^flowchart LR(?:\n|$)/u);
  return diagrams[0];
}

function assertStoryGraphContract(body) {
  const actors = [];
  const workObjects = [];
  const activityEdges = [];
  const collaboratorEdges = [];
  const declared = new Set();
  const endpoints = [];
  const activityNumbers = [];
  for (const line of storyDiagram(body).split('\n').slice(1).filter((item) => item.trim())) {
    let match = line.match(/^\s*([a-z_]+)\(\["Actor<br\/>((?:[^"\n])+?)"\]\)\s*$/u);
    if (match) {
      assert.ok(!declared.has(match[1]), `duplicate declaration: ${match[1]}`);
      declared.add(match[1]);
      actors.push({id: match[1], type: 'Actor', label: match[2]});
      continue;
    }
    match = line.match(/^\s*([a-z_]+)\[\["Work Object<br\/>((?:[^"\n])+?)"\]\]\s*$/u);
    if (match) {
      assert.ok(!declared.has(match[1]), `duplicate declaration: ${match[1]}`);
      declared.add(match[1]);
      workObjects.push({id: match[1], type: 'Work Object', label: match[2]});
      continue;
    }
    match = line.match(/^\s*([a-z_]+)\s*-->\|"([1-9]\d*) ([^"\n]+)"\|\s*([a-z_]+)\s*$/u);
    if (match) {
      const [, from, number, verb, to] = match;
      assert.match(verb, /^(?:展示|提交|传递|提供|创建)$/u, 'activity label must contain an approved verb');
      activityNumbers.push(number);
      activityEdges.push(`${from}--${number} ${verb}->${to}`);
      endpoints.push(from, to);
      continue;
    }
    match = line.match(/^\s*([a-z_]+)\s*-\.->\s*([a-z_]+)\s*$/u);
    if (match) {
      collaboratorEdges.push(`${match[1]}-.->${match[2]}`);
      endpoints.push(match[1], match[2]);
      continue;
    }
    assert.fail(`unsupported story diagram line: ${line.trim()}`);
  }
  assert.equal(new Set(activityNumbers).size, activityNumbers.length, 'activity numbers must be unique');
  for (const endpoint of endpoints) assert.ok(declared.has(endpoint), `undeclared endpoint: ${endpoint}`);
  assert.deepEqual(actors.toSorted((a, b) => a.id.localeCompare(b.id)), expectedActors);
  assert.deepEqual(workObjects.toSorted((a, b) => a.id.localeCompare(b.id)), expectedWorkObjects);
  assert.deepEqual(activityEdges.toSorted(), expectedActivityEdges);
  assert.deepEqual(collaboratorEdges.toSorted(), expectedCollaboratorEdges);
  assert.ok(!collaboratorEdges.some((edge) => edge.startsWith('result_create_object-.->')), 'activity 5 must not have a collaborator edge');
}

function wrappers(body) {
  const visibleBody = visibleContractLines(body).join('\n');
  const openings = [...visibleBody.matchAll(/<div\n  className="(diagram-wrapper diagram-wrapper--scroll-owner|table-wrapper table-wrapper--mapping)"\n  role="region"\n  aria-label="([^"]+)"\n  tabIndex=\{0\}\n  onKeyDown=\{handleHorizontalArrowKey\}\n>/gu)];
  assert.equal([...visibleBody.matchAll(/<div\b/gu)].length, 3, 'MOD-10 must have exactly three div openings');
  assert.equal([...visibleBody.matchAll(/<\/div>/gu)].length, 3, 'MOD-10 must have exactly three div closings');
  return openings.map((opening) => {
    const contentStart = opening.index + opening[0].length;
    const contentEnd = visibleBody.indexOf('</div>', contentStart);
    assert.notEqual(contentEnd, -1, `unclosed wrapper: ${opening[2]}`);
    const nextOpening = visibleBody.indexOf('<div', contentStart);
    assert.ok(nextOpening === -1 || nextOpening > contentEnd, `nested or prematurely closed wrapper: ${opening[2]}`);
    return {className: opening[1], label: opening[2], content: visibleBody.slice(contentStart, contentEnd).trim()};
  });
}

function assertInteractionContract(body) {
  assert.match(body, /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u);
  const regions = wrappers(body);
  assert.equal(regions.length, 3, 'MOD-10 must have exactly three accessible overflow wrappers');
  assert.deepEqual(regions.map(({label}) => label), expectedWrapperLabels);
  assert.deepEqual(regions.map(({className}) => className), [
    'table-wrapper table-wrapper--mapping',
    'diagram-wrapper diagram-wrapper--scroll-owner',
    'table-wrapper table-wrapper--mapping',
  ]);
  assert.equal(new Set(regions.map(({label}) => label)).size, 3, 'wrapper labels must be unique');
  assert.equal([...visibleContractLines(body).join('\n').matchAll(/className="(?:diagram-wrapper diagram-wrapper--scroll-owner|table-wrapper table-wrapper--mapping)"/gu)].length, 3, 'no unvalidated overflow wrappers');
  const storyTables = markdownTables(regions[0].content);
  assert.equal(storyTables.length, 1, 'story wrapper must contain exactly the story table');
  assert.deepEqual(records(storyTables[0], ['序号', '主体 actor', 'activity', 'work object', '协作 actor', '证据说明']), expectedStoryRows);
  assertStoryGraphContract(regions[1].content);
  const comparisonTables = markdownTables(regions[2].content);
  assert.equal(comparisonTables.length, 1, 'comparison wrapper must contain exactly the comparison table');
  assert.deepEqual(records(comparisonTables[0], ['模型', '主要问题', '典型输入', '核心产物', '适合发现什么', '明确不证明什么']), expectedComparisonRows);
}

function assertDiagramScrollOwnership(css) {
  assert.match(
    css,
    /\.theme-doc-markdown \.diagram-wrapper--scroll-owner \{[^}]*max-width: 100%;[^}]*overflow-x: auto;[^}]*\}/su,
    'focused diagram wrapper must own horizontal overflow',
  );
  assert.match(
    css,
    /\.theme-doc-markdown \.diagram-wrapper--scroll-owner > \.docusaurus-mermaid-container,[\s\S]*?\.theme-doc-markdown \.diagram-wrapper--scroll-owner > \.docusaurus-mermaid-container > \.mermaid,[\s\S]*?\.theme-doc-markdown \.diagram-wrapper--scroll-owner > \.mermaid \{[^}]*width: max-content;[^}]*max-width: none;[^}]*overflow-x: visible;[^}]*\}/u,
    'nested Mermaid containers must not retain horizontal overflow',
  );
}

function assertWorkshopAndNonProofContracts(body) {
  const workshop = visibleSection(body, '完整演练');
  assert.deepEqual(
    [...workshop.matchAll(/^\d+\. (.+)$/gmu)].map((match) => match[1]),
    expectedWorkshopSteps,
  );
  assert.ok(workshop.includes(annotationRule), annotationRule);
  const completion = visibleSection(body, '完成判断');
  for (const sentence of nonProofSentences) assert.ok(completion.includes(sentence), sentence);
}

function assertScopeAndRelations(body, peers = documentsById) {
  const inputs = visibleSection(body, '建模目标与输入');
  assert.ok(inputs.includes(scopeSentence), scopeSentence);
  assert.ok(inputs.includes(nameAuthoritySentence), nameAuthoritySentence);
  assert.ok(inputs.includes(paymentEvidenceSentence), paymentEvidenceSentence);
  const links = extractInternalLinks({body});
  for (const href of ['/modeling', '/modeling/mod-01', '/modeling/mod-02', '/modeling/mod-08', '/modeling/mod-09', '/cases/temporal-saga-durable-execution']) assert.ok(links.includes(href), href);
  assert.match(visibleMdxLines({body}).join('\n'), /MOD-11/u);
  for (const id of ['MOD-11', 'MOD-12', 'MOD-13']) {
    assert.ok(!links.includes(`/modeling/${id.toLowerCase()}`), `${id} must remain non-actionable`);
  }
  const mod08 = peers.get('MOD-08');
  const mod09 = peers.get('MOD-09');
  const mod10 = peers.get('MOD-10');
  for (const [peer, peerId] of [[mod08, 'MOD-08'], [mod09, 'MOD-09']]) {
    assert.ok(peer, `${peerId} must be published`);
    assert.ok(peer.metadata.adjacent_topics.includes('MOD-10'), `${peerId} -> MOD-10 adjacency`);
    assert.equal(extractInternalLinks(peer).filter((href) => href === '/modeling/mod-10').length, 1, `${peerId} -> MOD-10 backlink`);
    assert.ok(mod10.metadata.adjacent_topics.includes(peerId), `MOD-10 -> ${peerId} adjacency`);
    assert.equal(links.filter((href) => href === `/modeling/${peerId.toLowerCase()}`).length, 1, `MOD-10 -> ${peerId} backlink`);
  }
  assert.match(mod08.body, /重要的 Domain Story 变体[^。\n]*状态、终态与恢复语义/u);
  assert.match(mod09.body, /Domain Storytelling[^。\n]*可以组合[^。\n]*不是替代关系[^。\n]*没有严格的元素映射/u);
}

function assertSourceGovernance(ledgerData, content) {
  const governed = ledgerData.documents['content/modeling/mod-10-domain-storytelling.mdx'];
  assert.ok(governed, 'MOD-10 source review must exist');
  assert.equal(governed.reviewed_at, '2026-08-04');
  assert.deepEqual(governed.copyright_checks, [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ]);
  assert.equal(governed.citations.length, 4);
  const visible = extractExternalLinks(content);
  assert.deepEqual(visible, [...expectedSources.values()].toSorted());
  assert.deepEqual(
    [...visibleSection(content.body, '来源').matchAll(/\[[^\]]+\]\((https:[^)]+)\)/gu)].map((match) => match[1]),
    [...expectedSources.values()],
  );
  const citations = new Map(governed.citations.map((citation) => [citation.source_id, citation]));
  for (const definition of sourceDefinitions) {
    const url = expectedSources.get(definition.id);
    assert.deepEqual(ledgerData.sources.find(({id}) => id === definition.id), {
      id: definition.id,
      canonical_locator: url,
      transport_locator: url,
      query_insensitive: false,
      locator_aliases: [],
      tombstone: null,
      title: definition.title,
      author_or_org: definition.author,
      published_at: null,
      registered_at: '2026-08-04',
      checked_at: '2026-08-04',
      version: 'Living page retrieved 2026-08-04',
      source_kind: 'official-docs',
      tier: 'primary',
      allowed_evidence_roles: definition.roles,
      license: 'CC-BY-4.0',
      license_scope: 'The named Domain Storytelling page within its visible CC BY 4.0 scope; trademarks, third-party icons, books, linked works, tool code and separately licensed media are excluded.',
      license_evidence_url: url,
      license_evidence_note: 'The named page displayed the Domain Storytelling CC BY 4.0 footer when checked on 2026-08-04; separately licensed and third-party material remains excluded.',
      license_family_id: url,
      license_family_grouping: 'identity',
      family_grouping_evidence_url: null,
      copyright_policy: 'adapt-with-attribution',
      usage_boundary: definition.boundary,
      link_policy: 'floating',
      expected_final_transport_locator: url,
      expected_final_approved_at: '2026-08-04',
      expected_final_approval_note: 'Reviewed the direct Domain Storytelling HTTPS transport and visible CC BY 4.0 footer on 2026-08-04.',
    });
    assert.deepEqual(citations.get(definition.id), {
      source_id: definition.id,
      citation_url: url,
      roles: definition.roles,
      manifest_primary: definition.id === 'src-docs-be2e1512961a',
      usage_mode: 'facts-summary',
      attribution_note: `${definition.title}, ${definition.author}`,
      modification_note: null,
      excerpt: null,
      quotation_reviewed: false,
    });
  }
  assert.match(
    visibleSection(content.body, '来源'),
    /\[How to Model Repeating Activities\]\(https:\/\/domainstorytelling\.org\/articles\/how-to-model-loops\/\)（Stefan Hofer）/u,
    'the visible source list must credit Stefan Hofer',
  );
  assert.equal(governed.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
}

function visibleSection(body, heading) {
  return sectionBody(visibleMdxLines({body}).join('\n'), heading);
}

function horizontalArrowEvent({clientWidth = 100, scrollWidth = 300} = {}) {
  const region = {clientWidth, scrollWidth, scrollLeft: 0};
  let defaultPrevented = false;
  return {
    event: {key: 'ArrowRight', currentTarget: region, target: region, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, preventDefault() { defaultPrevented = true; }},
    region,
    wasDefaultPrevented: () => defaultPrevented,
  };
}

function moveWrapperContentOutside(body, label, placement = 'after') {
  const pattern = new RegExp(
    `(<div\\n  className="(?:diagram-wrapper diagram-wrapper--scroll-owner|table-wrapper table-wrapper--mapping)"\\n  role="region"\\n  aria-label="${label}"\\n  tabIndex=\\{0\\}\\n  onKeyDown=\\{handleHorizontalArrowKey\\}\\n>\\n\\n)([\\s\\S]*?)(\\n\\n<\\/div>)`,
    'u',
  );
  return body.replace(
    pattern,
    placement === 'before' ? '$2\n\n$1</div>' : '$1</div>\n\n$2',
  );
}

function hideMarkdownTable(body, headerStart, mode) {
  const pattern = new RegExp(`(^\\| ${headerStart} \\|[\\s\\S]*?)(?=\\n\\n<\\/div>)`, 'mu');
  return body.replace(
    pattern,
    mode === 'fence' ? '```text\n$1\n```' : '<!--\n$1\n-->',
  );
}

function hideWrapper(body, label, mode) {
  const pattern = new RegExp(
    `(<div\\n  className="(?:diagram-wrapper diagram-wrapper--scroll-owner|table-wrapper table-wrapper--mapping)"\\n  role="region"\\n  aria-label="${label}"\\n  tabIndex=\\{0\\}\\n  onKeyDown=\\{handleHorizontalArrowKey\\}\\n>\\n\\n[\\s\\S]*?\\n\\n<\\/div>)`,
    'u',
  );
  return body.replace(
    pattern,
    mode === 'fence' ? '````text\n$1\n````' : '<!--\n$1\n-->',
  );
}

test('publishes MOD-10 with the approved metadata and H2 sequence', () => {
  assertPublicationContract(requiredDocument().source);
});

test('locks the story sentences and four-model comparison tables', () => {
  assertTableContracts(requiredDocument().body);
});

test('locks the typed and numbered Domain Story graph', () => {
  assertStoryGraphContract(requiredDocument().body);
});

test('keeps the diagram and both tables keyboard accessible', () => {
  assertInteractionContract(requiredDocument().body);
});

test('makes the focused diagram wrapper the real horizontal scroll owner', () => {
  assertInteractionContract(requiredDocument().body);
  assertDiagramScrollOwnership(customCss);
  assert.throws(
    () => assertDiagramScrollOwnership(customCss.replace(
      '.theme-doc-markdown .diagram-wrapper--scroll-owner {\n  max-width: 100%;\n  overflow-x: auto;',
      '.theme-doc-markdown .diagram-wrapper--scroll-owner {\n  max-width: 100%;\n  overflow-x: visible;',
    )),
    {name: 'AssertionError'},
    'outer wrapper stopped owning horizontal overflow',
  );
  assert.throws(
    () => assertDiagramScrollOwnership(customCss.replace(
      '  width: max-content;\n  max-width: none;\n  overflow-x: visible;\n}',
      '  width: max-content;\n  max-width: none;\n  overflow-x: auto;\n}',
    )),
    {name: 'AssertionError'},
    'nested Mermaid resumed owning horizontal overflow',
  );
});

test('scrolls only a directly focused overflowing region by 40 pixels', () => {
  const overflow = horizontalArrowEvent();
  handleHorizontalArrowKey(overflow.event);
  assert.equal(overflow.region.scrollLeft, 40);
  assert.equal(overflow.wasDefaultPrevented(), true);
  const staticRegion = horizontalArrowEvent({clientWidth: 300, scrollWidth: 300});
  handleHorizontalArrowKey(staticRegion.event);
  assert.equal(staticRegion.region.scrollLeft, 0);
  assert.equal(staticRegion.wasDefaultPrevented(), false);
});

test('locks the workshop, annotation and non-proof contracts', () => {
  assertWorkshopAndNonProofContracts(requiredDocument().body);
});

test('states the narrow story scope and required modeling relations', () => {
  assertScopeAndRelations(requiredDocument().body);
});

test('rejects reciprocal relation regressions on every MOD-08/MOD-09/MOD-10 side', () => {
  for (const peerId of ['MOD-08', 'MOD-09']) {
    const peer = documentsById.get(peerId);
    const withoutPeerAdjacency = new Map(documentsById);
    withoutPeerAdjacency.set(peerId, {
      ...peer,
      metadata: {...peer.metadata, adjacent_topics: peer.metadata.adjacent_topics.filter((id) => id !== 'MOD-10')},
    });
    assert.throws(() => assertScopeAndRelations(requiredDocument().body, withoutPeerAdjacency), {name: 'AssertionError'}, `${peerId} deleted MOD-10 adjacency`);

    const withoutPeerBacklink = new Map(documentsById);
    withoutPeerBacklink.set(peerId, {...peer, body: peer.body.replace('/modeling/mod-10', '/modeling')});
    assert.throws(() => assertScopeAndRelations(requiredDocument().body, withoutPeerBacklink), {name: 'AssertionError'}, `${peerId} deleted MOD-10 backlink`);

    const withoutMod10Adjacency = new Map(documentsById);
    withoutMod10Adjacency.set('MOD-10', {
      ...requiredDocument(),
      metadata: {...requiredDocument().metadata, adjacent_topics: requiredDocument().metadata.adjacent_topics.filter((id) => id !== peerId)},
    });
    assert.throws(() => assertScopeAndRelations(requiredDocument().body, withoutMod10Adjacency), {name: 'AssertionError'}, `MOD-10 deleted ${peerId} adjacency`);

    assert.throws(
      () => assertScopeAndRelations(requiredDocument().body.replaceAll(`/modeling/${peerId.toLowerCase()}`, '/modeling')),
      {name: 'AssertionError'},
      `MOD-10 deleted ${peerId} backlink`,
    );
  }

  const weakenedMod08 = new Map(documentsById);
  const mod08 = weakenedMod08.get('MOD-08');
  weakenedMod08.set('MOD-08', {...mod08, body: mod08.body.replace('状态、终态与恢复语义', '一般说明')});
  assert.throws(() => assertScopeAndRelations(requiredDocument().body, weakenedMod08), {name: 'AssertionError'}, 'weakened MOD-08 reciprocal semantics');

  const weakenedMod09 = new Map(documentsById);
  const mod09 = weakenedMod09.get('MOD-09');
  weakenedMod09.set('MOD-09', {...mod09, body: mod09.body.replace('可以组合，但不是替代关系，两种协作方法之间没有严格的元素映射', '可以相互替代')});
  assert.throws(() => assertScopeAndRelations(requiredDocument().body, weakenedMod09), {name: 'AssertionError'}, 'weakened MOD-09 reciprocal semantics');
});

test('governs the four exact MOD-10 sources and citation boundaries', () => {
  assertSourceGovernance(ledger, requiredDocument());
  for (const definition of sourceDefinitions) {
    for (const [label, mutate] of [
      ['identity', (source) => { source.id = `${source.id}-changed`; }],
      ['author', (source) => { source.author_or_org = source.author_or_org === 'Domain Storytelling' ? 'Changed author' : 'Domain Storytelling'; }],
      ['license', (source) => { source.license = 'LicenseRef-All-Rights-Reserved'; }],
      ['roles', (source) => { source.allowed_evidence_roles = ['learning']; }],
      ['boundary', (source) => { source.usage_boundary = 'Boundary weakened.'; }],
    ]) {
      const mutated = structuredClone(ledger);
      mutate(mutated.sources.find(({id}) => id === definition.id));
      assert.throws(() => assertSourceGovernance(mutated, requiredDocument()), {name: 'AssertionError'}, `${definition.id} ${label}`);
    }
    for (const [label, mutate] of [
      ['citation', (citation) => { citation.attribution_note = 'Changed attribution'; }],
      ['primary', (citation) => { citation.manifest_primary = !citation.manifest_primary; }],
    ]) {
      const mutated = structuredClone(ledger);
      const citation = mutated.documents['content/modeling/mod-10-domain-storytelling.mdx'].citations.find(({source_id}) => source_id === definition.id);
      mutate(citation);
      assert.throws(() => assertSourceGovernance(mutated, requiredDocument()), {name: 'AssertionError'}, `${definition.id} ${label}`);
    }
  }
});

test('rejects controlled article mutations', () => {
  const {source, body} = requiredDocument();
  const mutations = [
    ['removed H2', source.replace('## 学习问题\n', ''), assertPublicationContract],
    ['reordered H2', source.replace('## 学习问题\n', '## __SWAP__\n').replace('## 建模目标与输入\n', '## 学习问题\n').replace('## __SWAP__\n', '## 建模目标与输入\n'), assertPublicationContract],
    ['removed table', body.replace(/\n\| 模型 \|[\s\S]*?<\/div>/u, '\n</div>'), assertTableContracts],
    ['duplicated table', `${body}\n| 重复 | 表格 |\n| --- | --- |\n`, assertTableContracts],
    ['changed table header', body.replace('| 序号 |', '| 步骤 |'), assertTableContracts],
    ['deleted story row', body.replace(/\| 3 \|[^\n]+\n/u, ''), assertTableContracts],
    ['swapped story rows', body.replace(/(\| 2 \|[^\n]+\n)(\| 3 \|[^\n]+\n)/u, '$2$1'), assertTableContracts],
    ['changed comparison row', body.replace('活动、判断、分支与路径如何连接', '系统怎样部署'), assertTableContracts],
    ['duplicated actor declaration', body.replace('  finance_actor(["Actor<br/>财务人员"])\n', '  finance_actor(["Actor<br/>财务人员"])\n  finance_actor(["Actor<br/>财务人员"])\n'), assertStoryGraphContract],
    ['merged work-object instances', body.replaceAll('request_transfer_object', 'request_submit_object'), assertStoryGraphContract],
    ['changed work-object label', body.replace('Work Object<br/>银行支付回执', 'Work Object<br/>本地支付记录'), assertStoryGraphContract],
    ['removed activity edge', body.replace('  expense_actor -->|"3 传递"| request_transfer_object\n', ''), assertStoryGraphContract],
    ['reversed activity edge', body.replace('  expense_actor -->|"3 传递"| request_transfer_object', '  request_transfer_object -->|"3 传递"| expense_actor'), assertStoryGraphContract],
    ['duplicated activity number', body.replace('|"6 展示"|', '|"5 展示"|'), assertStoryGraphContract],
    ['removed collaborator edge', body.replace('  receipt_object -.-> expense_actor\n', ''), assertStoryGraphContract],
    ['attached collaborator to activity 5', body.replace('  expense_actor -->|"6 展示"|', '  result_create_object -.-> finance_actor\n  expense_actor -->|"6 展示"|'), assertStoryGraphContract],
    ['removed annotation rule', body.replace(annotationRule, ''), assertWorkshopAndNonProofContracts],
    ['removed diagram scroll-owner modifier', body.replace('diagram-wrapper diagram-wrapper--scroll-owner', 'diagram-wrapper'), assertInteractionContract],
    ['removed tabIndex', body.replace('  tabIndex={0}\n', ''), assertInteractionContract],
    ['removed onKeyDown', body.replace('  onKeyDown={handleHorizontalArrowKey}\n', ''), assertInteractionContract],
  ];
  for (const [label, mutation, contract] of mutations) {
    assert.throws(() => contract(mutation), {name: 'AssertionError'}, label);
  }
  for (const sentence of nonProofSentences) {
    assert.throws(
      () => assertWorkshopAndNonProofContracts(body.replace(sentence, `${sentence.slice(0, -1)}通常如此。`)),
      {name: 'AssertionError'},
      `weakened non-proof sentence: ${sentence}`,
    );
  }
});

test('rejects review regressions that the original contract missed', () => {
  const {source, body} = requiredDocument();
  for (const [label, mutation] of [
    ['title', source.replace('title: Domain Storytelling 协作建模', 'title: 领域故事')],
    ['difficulty', source.replace('difficulty: intermediate', 'difficulty: advanced')],
    ['agent_patterns', source.replace('agent_patterns: []', 'agent_patterns:\n  - tool-use')],
    ['protocols', source.replace('protocols: []', 'protocols:\n  - HTTP')],
    ['quality_attributes', source.replace('  - maintainability', '  - maintainability\n  - reliability')],
    ['summary', source.replace('summary: 用费用支付典型场景演练 Domain Storytelling，并明确它与流程图、用例和 EventStorming 的证据边界。', 'summary: 被弱化的摘要。')],
    ['extra field', source.replace('title: Domain Storytelling 协作建模', 'title: Domain Storytelling 协作建模\nreviewer_extra: true')],
  ]) {
    assert.throws(() => assertPublicationContract(mutation), {name: 'AssertionError'}, `metadata mutation: ${label}`);
  }

  for (const [label, mutation] of [
    ['premature story close', body.replace('>\n\n| 序号 |', '>\n\n</div>\n\n| 序号 |')],
    ['story table after wrapper', moveWrapperContentOutside(body, expectedWrapperLabels[0])],
    ['Mermaid before wrapper', moveWrapperContentOutside(body, expectedWrapperLabels[1], 'before')],
    ['comparison table after wrapper', moveWrapperContentOutside(body, expectedWrapperLabels[2])],
  ]) {
    assert.throws(() => assertInteractionContract(mutation), {name: 'AssertionError'}, label);
  }

  for (const [label, mutation] of [
    ['scope negated', body.replace(scopeSentence, scopeSentence.replace('只建立', '不建立'))],
    ['scope moved section', body.replace(scopeSentence, '').replace('## 完成判断\n', `## 完成判断\n\n${scopeSentence}\n`)],
    ['scope hidden comment', body.replace(scopeSentence, `<!-- ${scopeSentence} -->`)],
    ['scope hidden fence', body.replace(scopeSentence, `\`\`\`text\n${scopeSentence}\n\`\`\``)],
    ['name authority negated', body.replace(nameAuthoritySentence, nameAuthoritySentence.replace('始终称为', '不再称为'))],
    ['name authority moved section', body.replace(nameAuthoritySentence, '').replace('## 常见失败\n', `## 常见失败\n\n${nameAuthoritySentence}\n`)],
    ['name authority hidden comment', body.replace(nameAuthoritySentence, `<!-- ${nameAuthoritySentence} -->`)],
    ['payment evidence reversed', body.replace(paymentEvidenceSentence, paymentEvidenceSentence.replace('都不能代替', '都能够代替'))],
    ['payment evidence moved section', body.replace(`${paymentEvidenceSentence}\n`, '').replace('## 来源\n', `## 来源\n\n${paymentEvidenceSentence}\n`)],
    ['payment evidence hidden fence', body.replace(paymentEvidenceSentence, `\n\n\`\`\`text\n${paymentEvidenceSentence}\n\`\`\``)],
  ]) {
    assert.throws(() => assertScopeAndRelations(mutation), {name: 'AssertionError'}, label);
  }

  for (const id of ['MOD-11', 'MOD-12', 'MOD-13']) {
    assert.throws(
      () => assertScopeAndRelations(`${body}\n[forbidden](/modeling/${id.toLowerCase()})\n`),
      {name: 'AssertionError'},
      `${id} actionable link`,
    );
  }

  for (const [label, mutation] of [
    ['annotation moved section', body.replace(`${annotationRule}\n`, '').replace('## 来源\n', `## 来源\n\n${annotationRule}\n`)],
    ['annotation hidden comment', body.replace(annotationRule, `<!-- ${annotationRule} -->`)],
    ['annotation hidden fence', body.replace(annotationRule, `\`\`\`text\n${annotationRule}\n\`\`\``)],
    ['non-proof sign reversed', body.replace(nonProofSentences[0], 'actor 等于团队、长期 owner、服务或部署单元。')],
    ['non-proof moved section', body.replace(`${nonProofSentences[1]}\n`, '').replace('## 常见失败\n', `## 常见失败\n\n${nonProofSentences[1]}\n`)],
    ['non-proof hidden comment', body.replace(nonProofSentences[2], `<!-- ${nonProofSentences[2]} -->`)],
    ['non-proof hidden fence', body.replace(nonProofSentences[3], `\`\`\`text\n${nonProofSentences[3]}\n\`\`\``)],
  ]) {
    assert.throws(() => assertWorkshopAndNonProofContracts(mutation), {name: 'AssertionError'}, label);
  }

  for (const [label, mutation] of [
    ['story table hidden fence', hideMarkdownTable(body, '序号', 'fence')],
    ['story table hidden comment', hideMarkdownTable(body, '序号', 'comment')],
    ['comparison table hidden fence', hideMarkdownTable(body, '模型', 'fence')],
    ['comparison table hidden comment', hideMarkdownTable(body, '模型', 'comment')],
  ]) {
    assert.throws(() => assertTableContracts(mutation), {name: 'AssertionError'}, label);
  }

  for (const [label, mutation] of [
    ['diagram wrapper hidden in outer fence', hideWrapper(body, expectedWrapperLabels[1], 'fence')],
    ['diagram wrapper hidden in comment', hideWrapper(body, expectedWrapperLabels[1], 'comment')],
  ]) {
    assert.throws(() => assertInteractionContract(mutation), {name: 'AssertionError'}, label);
    assert.throws(() => assertStoryGraphContract(mutation), {name: 'AssertionError'}, `${label}: graph visibility`);
  }
});
