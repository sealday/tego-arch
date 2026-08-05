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
import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const document = documents.find(({file}) => file === 'modeling/mod-11-ddd-context-map.mdx');
const customCss = await readFile(new URL('../src/css/custom.css', import.meta.url), 'utf8');
const sourceLedger = JSON.parse(await readFile(new URL('../data/source-ledger.json', import.meta.url)));
const topicManifest = JSON.parse(await readFile(new URL('../src/generated/topic-manifest.json', import.meta.url)));
const projectStatus = JSON.parse(await readFile(new URL('../src/generated/project-status.json', import.meta.url)));

const expectedMetadata = {
  title: 'DDD Context Map 建模',
  slug: '/modeling/mod-11',
  content_type: 'modeling',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-05',
  source_cutoff: '2026-08-05',
  review_policy: 'quarterly-version-sensitive',
  confidence: 'high',
  domains: ['software-architecture', 'domain-modeling'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['maintainability'],
  tags: ['DDD', 'Bounded Context', 'Context Map', 'Anti-Corruption Layer'],
  summary: '用费用申报系统的语言、规则与权威证据提出三个候选 Bounded Context，并明确四条上下游关系和翻译责任。',
  topic_id: 'MOD-11',
  priority: 'P1',
  depends_on: ['MOD-01', 'MOD-02', 'MOD-09', 'MOD-10'],
  adjacent_topics: ['MOD-05', 'MOD-08'],
  related_cases: ['/cases/temporal-saga-durable-execution'],
  related_questions: [],
};

const expectedHeadings = [
  '学习问题',
  '建模目标与输入',
  '边界候选与证据规则',
  '核心产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];

const expectedBoundaryRows = [
  {
    '候选 Context': '费用申报',
    '本地语言': '费用、凭证、提交、补正、申请人',
    '独立规则': '费用完整性、凭证要求、提交与补正条件',
    '业务权威': '已提交且可供后续判断的费用事实；不含审批决定与支付结果',
    '支持证据': 'MOD-09 的费用提交事件与术语热点；MOD-10 的待支付费用与支付请求协作',
    '反证或备选': '若提交与审批规则长期共同变化，可与费用审批合并',
    '下一项验证与责任类型': '核对规则变更历史与术语冲突；费用业务领域专家',
  },
  {
    '候选 Context': '费用审批',
    '本地语言': '审批决定、审批理由、权限、政策适用',
    '独立规则': '审批层级、额度、拒绝与重新审批',
    '业务权威': '审批决定及其依据；已批准 ≠ 已支付',
    '支持证据': 'MOD-09 发现审批与支付使用不同结果语言',
    '反证或备选': '若决定与支付只是同一规则生命周期，可与支付结算合并',
    '下一项验证与责任类型': '核对政策变更与跨阶段不变量；审批政策责任人',
  },
  {
    '候选 Context': '支付结算',
    '本地语言': '支付请求、银行回执、结果未知、查询、对账',
    '独立规则': '结果确认、未知保持、重查与对账收敛',
    '业务权威': '本地支付执行语义与可展示摘要；银行结果仍以外部回执或查询为证',
    '支持证据': 'MOD-08 的结果未知边界；MOD-10 的银行回执权威与本地展示协作',
    '反证或备选': '对账若有独立语言与变化节奏可继续拆分，否则保留本候选',
    '下一项验证与责任类型': '核对回执、查询、对账案例与契约；支付或对账责任人、外部集成契约责任人',
  },
];

const expectedRelationshipRows = [
  {
    '上游 U': '费用申报',
    '下游 D': '费用审批',
    '交换事实': '已提交的费用事实',
    '翻译或适配责任': '费用审批按审批语言解释输入，不反向改写申报事实',
    '契约责任类型': '审批政策责任人',
    '当前不证明什么': '不证明 API、事件、事务或服务调用',
    '下一项验证与责任类型': '核对字段含义与拒绝、补正规则；费用领域专家、审批政策责任人',
  },
  {
    '上游 U': '费用审批',
    '下游 D': '支付结算',
    '交换事实': '审批决定',
    '翻译或适配责任': '支付结算把已批准解释为可进入支付判断，不解释为已支付',
    '契约责任类型': '审批政策责任人、支付或对账责任人',
    '当前不证明什么': '不证明同步调用、消息格式或执行顺序',
    '下一项验证与责任类型': '核对撤回、过期与重复决定；审批政策责任人',
  },
  {
    '上游 U': '银行支付服务',
    '下游 D': '支付结算',
    '交换事实': '银行回执或查询结果',
    '翻译或适配责任': '支付结算以 D 侧 ACL 转换外部语义并保留可核验原始证据',
    '契约责任类型': '外部集成契约责任人',
    '当前不证明什么': '不证明 ACL 实现、银行 OHS、PL、协议或 SLA 已存在',
    '下一项验证与责任类型': '核对回执状态、未知值与查询语义；外部集成契约责任人',
  },
  {
    '上游 U': '支付结算',
    '下游 D': '费用申报',
    '交换事实': '可展示的支付结果摘要',
    '翻译或适配责任': '费用申报只转换展示语言，不成为银行结果或支付执行状态权威',
    '契约责任类型': '费用业务领域专家、支付或对账责任人',
    '当前不证明什么': '不证明共享数据库、反向写入或数据所有权',
    '下一项验证与责任类型': '核对展示词汇与证据追溯；费用业务领域专家',
  },
];

const expectedNodes = [
  'approval_context:候选 Bounded Context<br/>费用审批',
  'bank_system:外部系统<br/>银行支付服务',
  'claim_context:候选 Bounded Context<br/>费用申报',
  'payment_context:候选 Bounded Context<br/>支付结算',
];
const expectedSubgraphMembers = ['approval_context', 'claim_context', 'payment_context'];
const expectedEdges = [
  'approval_context--U→D：审批决定（已批准 ≠ 已支付）->payment_context',
  'bank_system--U→D：银行回执/查询结果；D 侧 ACL->payment_context',
  'claim_context--U→D：已提交的费用事实->approval_context',
  'payment_context--U→D：可展示的支付结果摘要->claim_context',
];

const nonProofSentences = [
  'Bounded Context 不等于子域、系统、服务、模块、数据库、仓库、部署单元或团队。',
  'Context 与团队不存在自动的一对一关系。',
  '图中的箭头不等于 API、调用、事件、事务、协议、网络方向或执行顺序。',
  'U/D 不等于组织权力、价值高低或数据包方向。',
  'ACL 标签不证明实现已经存在。',
  '业务权威不等于数据库、存储位置或组织所有权。',
  '银行支付服务是外部系统，不是本地 Bounded Context。',
  '三个候选都可能在后续证据下合并、拆分或被否决。',
];
const expectedWrapperLabels = [
  '候选 Bounded Context 证据表，可横向滚动',
  '费用申报系统 Context Map，可横向滚动',
  'Context Map 关系责任表，可横向滚动',
];
const requiredLinks = [
  '/modeling',
  '/modeling/mod-01',
  '/modeling/mod-02',
  '/modeling/mod-05',
  '/modeling/mod-08',
  '/modeling/mod-09',
  '/modeling/mod-10',
  '/cases/temporal-saga-durable-execution',
];
const expectedSources = new Map([
  ['src-docs-8fb33e125d2a', 'https://martinfowler.com/bliki/BoundedContext.html'],
  ['src-docs-1ad75d39a251', 'https://github.com/ddd-crew/context-mapping/tree/970c1ff3a61f7aa8b61b789b697c05bc585f614d'],
  ['src-docs-ac85a74ed0b2', 'https://contextmapper.org/docs/anticorruption-layer/'],
  ['src-docs-fc6e554f1153', 'https://www.avanscoperta.it/en/context-mapping/'],
]);
const expectedCitations = [
  {
    source_id: 'src-docs-8fb33e125d2a',
    citation_url: 'https://martinfowler.com/bliki/BoundedContext.html',
    roles: ['definition', 'method', 'learning'],
    manifest_primary: true,
    usage_mode: 'facts-summary',
    attribution_note: 'Bounded Context, Martin Fowler',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  },
  {
    source_id: 'src-docs-1ad75d39a251',
    citation_url: 'https://github.com/ddd-crew/context-mapping/tree/970c1ff3a61f7aa8b61b789b697c05bc585f614d',
    roles: ['definition', 'method', 'comparison'],
    manifest_primary: false,
    usage_mode: 'facts-summary',
    attribution_note: 'Context Mapping, DDD Crew',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  },
  {
    source_id: 'src-docs-ac85a74ed0b2',
    citation_url: 'https://contextmapper.org/docs/anticorruption-layer/',
    roles: ['definition', 'method'],
    manifest_primary: false,
    usage_mode: 'facts-summary',
    attribution_note: 'Anti-Corruption Layer, Context Mapper',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  },
  {
    source_id: 'src-docs-fc6e554f1153',
    citation_url: 'https://www.avanscoperta.it/en/context-mapping/',
    roles: ['definition', 'method'],
    manifest_primary: false,
    usage_mode: 'facts-summary',
    attribution_note: 'Context Mapping, Avanscoperta',
    modification_note: null,
    excerpt: null,
    quotation_reviewed: false,
  },
];
const expectedExerciseSteps = [
  '复述 MOD-02 权威系统边界，明确银行支付服务位于系统外。',
  '从 MOD-09 与 MOD-10 收集语言、规则、权威记录和协作变化线索，不按现有模块分组。',
  '提出三个候选 Context，并为每个候选填写支持证据、反证和备选划分。',
  '为四条关系逐条判断 U/D，写清交换的业务事实，不画运行时调用链。',
  '只在银行边界标注 downstream ACL，说明翻译内容和未被证明的模式。',
  '为每个未决边界和关系登记责任类型、下一项证据与复查条件。',
  '从系统边界到四条关系完整复述，确认候选、权威和非证明规则没有相互矛盾。',
];
const expectedCompletionItems = [
  '每个候选都记录本地语言、独立规则、业务权威、支持证据、反证或备选以及下一项验证责任；',
  '每条关系都记录 U/D、交换事实、翻译责任、契约责任、非证明边界和下一项验证；',
  '参与者能在不使用 API、调用链或组织权力解释的情况下复述四条箭头；',
  '银行支付服务保持外部系统身份，支付结算的 ACL 责任与银行结果权威不混淆；',
  'MOD-09、MOD-10 的线索被明确接受、否决或保留为待验证项；',
  '所有未决项都有责任类型、下一项证据和复查条件；',
  '所有人理解三块都是候选，不是已批准的系统、服务、数据库、团队或部署划分；',
  '与 MOD-01、MOD-02、MOD-05、MOD-08、MOD-09、MOD-10 和后续 MOD-12 的交接边界清楚。',
];

function requiredDocument() {
  assert.ok(document, 'MOD-11 content document must exist');
  return document;
}

function assertPublicationContract(source) {
  assert.deepEqual(parseFrontMatter(source), expectedMetadata);
  assert.deepEqual(
    findMarkdownHeadings(source).filter(({level}) => level === 2).map(({text}) => text),
    expectedHeadings,
  );
}

function visibleLines(body) {
  const lines = [];
  let inComment = false;
  let fence;
  for (const rawLine of body.split(/\r?\n/u)) {
    let line = rawLine;
    if (inComment) {
      const end = line.indexOf('-->');
      if (end === -1) continue;
      line = line.slice(end + 3);
      inComment = false;
    }
    const comment = line.indexOf('<!--');
    if (comment !== -1) {
      if (!line.includes('-->', comment + 4)) inComment = true;
      line = line.slice(0, comment);
    }
    if (fence) {
      if (new RegExp(`^ {0,3}${fence.marker}{${fence.length},}[ \\t]*$`, 'u').test(line)) {
        if (fence.mermaid) lines.push(line);
        fence = undefined;
      } else if (fence.mermaid) lines.push(line);
      continue;
    }
    const opening = line.match(/^ {0,3}([`~]{3,})(.*)$/u);
    if (opening) {
      fence = {marker: opening[1][0], length: opening[1].length, mermaid: opening[2].trim() === 'mermaid'};
      if (fence.mermaid) lines.push(line);
      continue;
    }
    lines.push(line);
  }
  return lines;
}

function markdownTables(body) {
  const tables = [];
  let current = [];
  for (const line of visibleLines(body)) {
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
  assert.ok(table, 'required Markdown table must exist');
  const [header, separator, ...rows] = table;
  assert.deepEqual(header, expectedHeader);
  assert.deepEqual(separator, expectedHeader.map(() => '---'));
  return rows.map((row) => {
    assert.equal(row.length, header.length, 'table record column count');
    return Object.fromEntries(header.map((key, index) => [key, row[index]]));
  });
}

function assertTableContracts(body) {
  const tables = markdownTables(body);
  assert.equal(tables.length, 2, 'MOD-11 must contain exactly two Markdown tables');
  const boundaryRows = records(tables[0], ['候选 Context', '本地语言', '独立规则', '业务权威', '支持证据', '反证或备选', '下一项验证与责任类型']);
  const relationshipRows = records(tables[1], ['上游 U', '下游 D', '交换事实', '翻译或适配责任', '契约责任类型', '当前不证明什么', '下一项验证与责任类型']);
  assert.deepEqual(boundaryRows, expectedBoundaryRows);
  assert.deepEqual(relationshipRows, expectedRelationshipRows);
  assert.equal(new Set(boundaryRows.map((row) => row['候选 Context'])).size, 3);
  for (const row of boundaryRows) assert.match(row['反证或备选'], /(?:合并|拆分|否决)/u);
  const forbiddenOwner = /(?:团队|team|服务 owner|数据库 owner|仓库 owner|部署 owner)/iu;
  assert.ok(!boundaryRows.some((row) => forbiddenOwner.test(row['下一项验证与责任类型'])));
  assert.ok(!relationshipRows.some((row) => forbiddenOwner.test(`${row['契约责任类型']} ${row['下一项验证与责任类型']}`)));
  assert.equal(relationshipRows.filter((row) => row['翻译或适配责任'].includes('ACL')).length, 1);
  for (const [index, row] of relationshipRows.entries()) {
    if (index !== 2) assert.doesNotMatch(Object.values(row).join(' '), /Partnership|Shared Kernel|Customer-Supplier|Conformist|OHS|\bPL\b/u);
  }
}

function contextDiagram(body) {
  const diagrams = [...visibleLines(body).join('\n').matchAll(/```mermaid\n([\s\S]*?)\n```/gu)].map((match) => match[1]);
  assert.equal(diagrams.length, 1, 'MOD-11 must contain exactly one Mermaid diagram');
  assert.match(diagrams[0], /^flowchart LR(?:\n|$)/u);
  return diagrams[0];
}

function assertContextGraphContract(body) {
  const diagram = contextDiagram(body);
  const nodes = [];
  const edges = [];
  const declared = new Set();
  const endpoints = [];
  const members = [];
  let inSubgraph = false;
  let subgraphCount = 0;
  for (const line of diagram.split('\n').slice(1).filter((item) => item.trim())) {
    let match = line.match(/^\s*subgraph\s+expense_system\["费用申报系统（MOD-02 权威系统边界）"\]\s*$/u);
    if (match) {
      assert.equal(inSubgraph, false, 'nested subgraph');
      inSubgraph = true;
      subgraphCount += 1;
      continue;
    }
    if (/^\s*end\s*$/u.test(line)) {
      assert.equal(inSubgraph, true, 'unexpected subgraph end');
      inSubgraph = false;
      continue;
    }
    match = line.match(/^\s*([a-z_]+)\["([^"\n]+)"\]\s*$/u);
    if (match) {
      assert.ok(!declared.has(match[1]), `duplicate declaration: ${match[1]}`);
      declared.add(match[1]);
      nodes.push(`${match[1]}:${match[2]}`);
      if (inSubgraph) members.push(match[1]);
      continue;
    }
    match = line.match(/^\s*([a-z_]+)\s*-->\|"([^"\n]+)"\|\s*([a-z_]+)\s*$/u);
    if (match) {
      const [, from, label, to] = match;
      assert.match(label, /^U→D：/u, 'every edge label must declare U→D');
      assert.doesNotMatch(label, /API|HTTP|event|topic|transaction/iu);
      edges.push(`${from}--${label}->${to}`);
      endpoints.push(from, to);
      continue;
    }
    assert.fail(`unsupported Context Map line: ${line.trim()}`);
  }
  assert.equal(inSubgraph, false, 'unclosed subgraph');
  assert.equal(subgraphCount, 1, 'exactly one system subgraph');
  for (const endpoint of endpoints) assert.ok(declared.has(endpoint), `unknown endpoint: ${endpoint}`);
  assert.deepEqual(nodes.toSorted(), expectedNodes);
  assert.deepEqual(members.toSorted(), expectedSubgraphMembers);
  assert.deepEqual(edges.toSorted(), expectedEdges);
  assert.equal(edges.length, 4);
  assert.equal(edges.filter((edge) => edge.includes('ACL')).length, 1);
  assert.match(edges.find((edge) => edge.includes('ACL')), /^bank_system--/u);
}

function wrappers(body) {
  const visibleBody = visibleLines(body).join('\n');
  const pattern = /<div\n  className="(diagram-wrapper diagram-wrapper--scroll-owner|table-wrapper table-wrapper--mapping)"\n  role="region"\n  aria-label="([^"]+)"\n  tabIndex=\{0\}\n  onKeyDown=\{handleHorizontalArrowKey\}\n>\n\n([\s\S]*?)\n\n<\/div>/gu;
  const regions = [...visibleBody.matchAll(pattern)];
  assert.equal([...visibleBody.matchAll(/<div\b/gu)].length, 3, 'exactly three div openings');
  assert.equal([...visibleBody.matchAll(/<\/div>/gu)].length, 3, 'exactly three div closings');
  return regions.map((region) => ({className: region[1], label: region[2], content: region[3]}));
}

function assertInteractionContract(body) {
  assert.match(body, /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u);
  const regions = wrappers(body);
  assert.equal(regions.length, 3, 'all wrappers own keyboard scrolling');
  assert.deepEqual(regions.map(({label}) => label), expectedWrapperLabels);
  assert.equal(new Set(regions.map(({label}) => label)).size, 3);
  assert.deepEqual(regions.map(({className}) => className), [
    'table-wrapper table-wrapper--mapping',
    'diagram-wrapper diagram-wrapper--scroll-owner',
    'table-wrapper table-wrapper--mapping',
  ]);
  const boundaryTables = markdownTables(regions[0].content);
  assert.equal(boundaryTables.length, 1, 'first wrapper contains exactly the candidate-boundary table');
  assert.deepEqual(
    records(boundaryTables[0], ['候选 Context', '本地语言', '独立规则', '业务权威', '支持证据', '反证或备选', '下一项验证与责任类型']),
    expectedBoundaryRows,
  );
  assert.equal([...visibleLines(regions[0].content).join('\n').matchAll(/```mermaid\n[\s\S]*?\n```/gu)].length, 0, 'first wrapper contains no Mermaid');
  assert.equal(markdownTables(regions[1].content).length, 0, 'second wrapper contains no Markdown table');
  assert.equal([...visibleLines(regions[1].content).join('\n').matchAll(/```mermaid\n[\s\S]*?\n```/gu)].length, 1, 'second wrapper contains the unique Mermaid');
  const relationshipTables = markdownTables(regions[2].content);
  assert.equal(relationshipTables.length, 1, 'third wrapper contains exactly the relationship table');
  assert.deepEqual(
    records(relationshipTables[0], ['上游 U', '下游 D', '交换事实', '翻译或适配责任', '契约责任类型', '当前不证明什么', '下一项验证与责任类型']),
    expectedRelationshipRows,
  );
  assert.equal([...visibleLines(regions[2].content).join('\n').matchAll(/```mermaid\n[\s\S]*?\n```/gu)].length, 0, 'third wrapper contains no Mermaid');
  assert.match(customCss, /\.theme-doc-markdown \.diagram-wrapper--scroll-owner \{[^}]*overflow-x: auto;[^}]*\}/su);
  assert.match(customCss, /\.theme-doc-markdown \.diagram-wrapper--scroll-owner > \.docusaurus-mermaid-container,[\s\S]*?\.theme-doc-markdown \.diagram-wrapper--scroll-owner > \.docusaurus-mermaid-container > \.mermaid,[\s\S]*?\.theme-doc-markdown \.diagram-wrapper--scroll-owner > \.mermaid \{[^}]*width: max-content;[^}]*max-width: none;[^}]*overflow-x: visible;[^}]*\}/u);
}

function assertMethodContract(body) {
  const visibleBody = visibleLines(body).join('\n');
  for (const sentence of nonProofSentences) assert.match(visibleBody, new RegExp(`(?:^|\\n)${sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\n|$)`, 'u'));
  assert.match(visibleBody, /U 与 D 是逐条关系判定的角色/u);
  assert.match(visibleBody, /箭头只为表达模型影响与集成责任而从 U 指向 D/u);
  assert.match(visibleBody, /已批准 ≠ 已支付/u);
  assert.match(visibleBody, /支付结算翻译银行证据，但不成为外部支付结果权威/u);
  assert.match(visibleBody, /Temporal Saga 案例可检验超时、重试、补偿与人工收敛，但不能确定候选 Context/u);
  assert.match(visibleBody, /完成检查[^\n]*证据[^\n]*备选[^\n]*责任类型[^\n]*下一项证据[^\n]*不带运行时解释重放/u);
  const links = extractInternalLinks({body});
  for (const target of requiredLinks) assert.ok(links.includes(target), `missing visible link: ${target}`);
  assert.ok(!links.includes('/modeling/mod-12'), 'MOD-12 must remain plain text without an internal href');
  assert.doesNotMatch(visibleBody, /\[[^\]]*MOD-12[^\]]*\]\([^)]*\)/u);
  assert.match(visibleBody, /MOD-12/u);
  const exerciseSteps = [...visibleBody.matchAll(/^([1-7])\. (.+)$/gmu)].map((match) => match[2]);
  assert.deepEqual(exerciseSteps, expectedExerciseSteps);
  const completionItems = [...visibleBody.matchAll(/^- (.+[；。])$/gmu)]
    .map((match) => match[1])
    .filter((item) => expectedCompletionItems.includes(item));
  assert.deepEqual(completionItems, expectedCompletionItems);
}

function scrollProbe({scrollWidth, clientWidth, scrollLeft = 0}) {
  const region = {scrollWidth, clientWidth, scrollLeft};
  let prevented = false;
  return {
    region,
    event: {
      target: region,
      currentTarget: region,
      key: 'ArrowRight',
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault() { prevented = true; },
    },
    prevented: () => prevented,
  };
}

test('publishes the exact MOD-11 metadata and heading contract', () => {
  assertPublicationContract(requiredDocument().source);
});

test('locks candidate and relationship responsibility tables', () => {
  assertTableContracts(requiredDocument().body);
});

test('locks the semantic Context Map graph', () => {
  assertContextGraphContract(requiredDocument().body);
});

test('keeps overflow ownership accessible and keyboard-operable', () => {
  const body = requiredDocument().body;
  assertInteractionContract(body);
  const overflow = scrollProbe({scrollWidth: 200, clientWidth: 100});
  handleHorizontalArrowKey(overflow.event);
  assert.equal(overflow.region.scrollLeft, 40);
  assert.equal(overflow.prevented(), true);
  const staticRegion = scrollProbe({scrollWidth: 100, clientWidth: 100});
  handleHorizontalArrowKey(staticRegion.event);
  assert.equal(staticRegion.region.scrollLeft, 0);
  assert.equal(staticRegion.prevented(), false);
});

test('states method, evidence, links, completion and non-proof rules', () => {
  assertMethodContract(requiredDocument().body);
});

test('rejects controlled MOD-11 mutations', () => {
  const {body, source} = requiredDocument();
  const tableBlock = (header) => body.match(new RegExp(`\\| ${header} \\|[\\s\\S]*?(?=\\n\\n<\\/div>)`, 'u'))?.[0];
  const boundaryTable = tableBlock('候选 Context');
  assert.ok(boundaryTable);
  const relationshipTable = tableBlock('上游 U');
  assert.ok(relationshipTable);
  const mermaidBlock = body.match(/```mermaid\n[\s\S]*?\n```/u)?.[0];
  assert.ok(mermaidBlock);
  const mutations = [
    ['removed H2', source.replace('## 学习问题\n', '') , assertPublicationContract],
    ['reordered H2', source.replace('## 学习问题', '## __SWAP_HEADING__').replace('## 建模目标与输入', '## 学习问题').replace('## __SWAP_HEADING__', '## 建模目标与输入'), assertPublicationContract],
    ['bank moved into subgraph', body.replace('  end\n  bank_system', '    bank_system').replace('\n  claim_context -->', '\n  end\n  claim_context -->'), assertContextGraphContract],
    ['candidate moved outside subgraph', body.replace('    claim_context["候选 Bounded Context<br/>费用申报"]\n', '').replace('  bank_system[', '  claim_context["候选 Bounded Context<br/>费用申报"]\n  bank_system['), assertContextGraphContract],
    ['edge removed', body.replace('  claim_context -->|"U→D：已提交的费用事实"| approval_context\n', ''), assertContextGraphContract],
    ['edge reversed', body.replace('claim_context -->|"U→D：已提交的费用事实"| approval_context', 'approval_context -->|"U→D：已提交的费用事实"| claim_context'), assertContextGraphContract],
    ['U/D changed', body.replace('U→D：已提交的费用事实', 'D→U：已提交的费用事实'), assertContextGraphContract],
    ['second ACL', body.replace('U→D：审批决定（已批准 ≠ 已支付）', 'U→D：审批决定（已批准 ≠ 已支付）；D 侧 ACL'), assertContextGraphContract],
    ['table deleted', body.replace(boundaryTable, ''), assertTableContracts],
    ['table duplicated', body.replace(boundaryTable, `${boundaryTable}\n\n${boundaryTable}`), assertTableContracts],
    ['header changed', body.replace('候选 Context | 本地语言', 'Context 候选 | 本地语言'), assertTableContracts],
    ['row swapped', body.replace(`| ${expectedBoundaryRows[0]['候选 Context']} |`, '| __SWAP__ |').replace(`| ${expectedBoundaryRows[1]['候选 Context']} |`, `| ${expectedBoundaryRows[0]['候选 Context']} |`).replace('| __SWAP__ |', `| ${expectedBoundaryRows[1]['候选 Context']} |`), assertTableContracts],
    ['alternative removed', body.replace(expectedBoundaryRows[0]['反证或备选'], '暂无'), assertTableContracts],
    ['fictional team owner', body.replace('费用业务领域专家', '报销平台团队'), assertTableContracts],
    ['tabIndex removed', body.replace('  tabIndex={0}\n', ''), assertInteractionContract],
    ['onKeyDown removed', body.replace('  onKeyDown={handleHorizontalArrowKey}\n', ''), assertInteractionContract],
    ...nonProofSentences.map((sentence, index) => [`non-proof ${index + 1} weakened`, body.replace(sentence, sentence.replace(/不等于|不存在|不证明|不是|都可能/u, '等于')), assertMethodContract]),
    ['actionable MOD-12 link', body.replace('MOD-12', '[MOD-12](/modeling/mod-12)'), assertMethodContract],
    ['actionable MOD-12 href with neutral text', `${body}\n[下一篇](/modeling/mod-12)\n`, assertMethodContract],
    ['boundary table moved outside wrapper', body.replace(`${boundaryTable}\n\n</div>`, `</div>\n\n${boundaryTable}`), assertInteractionContract],
    ['Mermaid moved outside wrapper', body.replace(`${mermaidBlock}\n\n</div>`, `</div>\n\n${mermaidBlock}`), assertInteractionContract],
    ['relationship table moved outside wrapper', body.replace(`${relationshipTable}\n\n</div>`, `</div>\n\n${relationshipTable}`), assertInteractionContract],
  ];
  for (const [label, mutation, contract] of mutations) {
    assert.throws(() => contract(mutation), {name: 'AssertionError'}, label);
  }
});

test('governs the exact MOD-11 source records and citation review', () => {
  const shared = {
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    published_at: null,
    registered_at: '2026-08-05',
    checked_at: '2026-08-05',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    expected_final_approved_at: '2026-08-05',
  };
  const expectedRecords = [
    {
      id: 'src-docs-8fb33e125d2a',
      canonical_locator: 'https://martinfowler.com/bliki/BoundedContext.html',
      transport_locator: 'https://martinfowler.com/bliki/BoundedContext.html',
      ...shared,
      title: 'Bounded Context',
      author_or_org: 'Martin Fowler',
      version: 'Living page retrieved 2026-08-05',
      source_kind: 'independent-blog',
      tier: 'primary',
      allowed_evidence_roles: ['definition', 'method', 'learning'],
      license: 'LicenseRef-All-Rights-Reserved',
      license_scope: 'Facts summarized from the named page only; page prose, diagrams, examples, templates, trademarks, linked works and third-party assets are excluded.',
      license_evidence_url: 'https://martinfowler.com/bliki/BoundedContext.html',
      license_evidence_note: 'Bounded Context at https://martinfowler.com/bliki/BoundedContext.html was checked on 2026-08-05; no open content license was found.',
      license_family_id: 'https://martinfowler.com/bliki/BoundedContext.html',
      copyright_policy: 'facts-and-short-quotation',
      usage_boundary: 'Supports the language/model boundary and explicit Context Map relationship summary; it does not approve this article’s candidate boundaries, services, teams or runtime design.',
      link_policy: 'floating',
      expected_final_transport_locator: 'https://martinfowler.com/bliki/BoundedContext.html',
      expected_final_approval_note: 'Reviewed the direct Bounded Context HTTPS transport and page identity on 2026-08-05.',
    },
    {
      id: 'src-docs-1ad75d39a251',
      canonical_locator: 'https://github.com/ddd-crew/context-mapping/tree/970c1ff3a61f7aa8b61b789b697c05bc585f614d',
      transport_locator: 'https://github.com/ddd-crew/context-mapping/tree/970c1ff3a61f7aa8b61b789b697c05bc585f614d',
      ...shared,
      title: 'Context Mapping',
      author_or_org: 'DDD Crew',
      version: 'ddd-crew/context-mapping@970c1ff3a61f7aa8b61b789b697c05bc585f614d',
      source_kind: 'official-repository',
      tier: 'secondary',
      allowed_evidence_roles: ['definition', 'method', 'comparison'],
      license: 'CC-BY-SA-4.0',
      license_scope: 'The pinned ddd-crew/context-mapping repository content covered by its CC BY-SA 4.0 LICENSE; trademarks, linked works, Miro-hosted assets and separately licensed third-party material are excluded.',
      license_evidence_url: 'https://github.com/ddd-crew/context-mapping/blob/970c1ff3a61f7aa8b61b789b697c05bc585f614d/LICENSE',
      license_evidence_note: 'The pinned repository LICENSE, not abbreviated README wording, governs the reviewed content at commit 970c1ff3a61f7aa8b61b789b697c05bc585f614d.',
      license_family_id: 'github:ddd-crew/context-mapping',
      copyright_policy: 'adapt-sharealike-review',
      usage_boundary: 'Supports small question-specific Context Maps, U/D roles and the existence of relationship patterns; it does not license copying the cheat sheet or Miro board and does not select patterns for this article.',
      link_policy: 'stable',
      expected_final_transport_locator: 'https://github.com/ddd-crew/context-mapping/tree/970c1ff3a61f7aa8b61b789b697c05bc585f614d',
      expected_final_approval_note: 'Reviewed the pinned GitHub tree transport and commit-specific LICENSE on 2026-08-05.',
    },
    {
      id: 'src-docs-ac85a74ed0b2',
      canonical_locator: 'https://contextmapper.org/docs/anticorruption-layer/',
      transport_locator: 'https://contextmapper.org/docs/anticorruption-layer/',
      ...shared,
      title: 'Anti-Corruption Layer',
      author_or_org: 'Context Mapper',
      version: 'Living page retrieved 2026-08-05',
      source_kind: 'official-docs',
      tier: 'primary',
      allowed_evidence_roles: ['definition', 'method'],
      license: 'LicenseRef-All-Rights-Reserved',
      license_scope: 'Facts summarized from the named page only; page prose, diagrams, examples, templates, trademarks, linked works and third-party assets are excluded.',
      license_evidence_url: 'https://contextmapper.org/docs/anticorruption-layer/',
      license_evidence_note: 'Anti-Corruption Layer at https://contextmapper.org/docs/anticorruption-layer/ was checked on 2026-08-05; no open content license was found.',
      license_family_id: 'https://contextmapper.org/docs/anticorruption-layer/',
      copyright_policy: 'facts-and-short-quotation',
      usage_boundary: 'Supports ACL as a downstream translation and isolation role; it does not prove a production ACL implementation, bank OHS/PL, protocol or deployment boundary.',
      link_policy: 'floating',
      expected_final_transport_locator: 'https://contextmapper.org/docs/anticorruption-layer/',
      expected_final_approval_note: 'Reviewed the direct Anti-Corruption Layer HTTPS transport and page identity on 2026-08-05.',
    },
  ];
  const sourcesById = new Map(sourceLedger.sources.map((source) => [source.id, source]));
  for (const record of expectedRecords) assert.deepEqual(sourcesById.get(record.id), record);
  for (const [id, url] of expectedSources) assert.equal(sourcesById.get(id)?.canonical_locator, url, id);

  assert.deepEqual(sourceLedger.documents['content/modeling/mod-11-ddd-context-map.mdx'], {
    reviewed_at: '2026-08-05',
    copyright_checks: [
      'original-structure',
      'quotation-boundary',
      'attribution-complete',
      'illustration-rights',
    ],
    citations: expectedCitations,
  });
});

test('renders exactly four governed MOD-11 sources', () => {
  const sourceSection = requiredDocument().body.split('## 来源\n')[1];
  assert.ok(sourceSection, 'MOD-11 source section');
  assert.deepEqual(
    [...sourceSection.matchAll(/^- \[([^\]]+)\]\((https:\/\/[^)]+)\)：(.+)$/gmu)].map((match) => ({
      label: match[1],
      url: match[2],
      boundary: match[3],
    })),
    [
      {label: 'Bounded Context', url: expectedSources.get('src-docs-8fb33e125d2a'), boundary: '支持语言与模型边界以及显式 Context Map 关系；不证明本文候选边界、服务、团队或运行时设计。'},
      {label: 'DDD Crew Context Mapping', url: expectedSources.get('src-docs-1ad75d39a251'), boundary: '支持围绕具体问题绘制小型 Context Map、逐关系判断 U/D 与关系模式的存在；不复用其 cheat sheet 或 Miro 资产，也不替本文选择关系模式。'},
      {label: 'Anti-Corruption Layer', url: expectedSources.get('src-docs-ac85a74ed0b2'), boundary: '支持 ACL 作为下游翻译与隔离责任；不证明银行边界已有 ACL、OHS/PL、协议或部署实现。'},
      {label: 'Avanscoperta Context Mapping', url: expectedSources.get('src-docs-fc6e554f1153'), boundary: '支持边界指标并非绝对、仍需架构判断；不批准本文候选边界。'},
    ],
  );
});

test('publishes reciprocal MOD-05/MOD-08 relations and actionable MOD-09/MOD-10 handoffs', () => {
  const byTopic = new Map(documents.map((item) => [parseFrontMatter(item.source).topic_id, item]));
  const mod05 = byTopic.get('MOD-05');
  const mod08 = byTopic.get('MOD-08');
  const mod09 = byTopic.get('MOD-09');
  const mod10 = byTopic.get('MOD-10');
  assert.deepEqual(parseFrontMatter(mod05.source).adjacent_topics, ['MOD-04', 'MOD-06', 'MOD-09', 'MOD-11', 'PR-13']);
  assert.deepEqual(parseFrontMatter(mod08.source).adjacent_topics, ['MOD-07', 'MOD-09', 'MOD-10', 'MOD-11', 'PR-10', 'QA-02']);
  assert.equal(extractInternalLinks(mod05).filter((link) => link === '/modeling/mod-11').length, 1);
  assert.equal(extractInternalLinks(mod08).filter((link) => link === '/modeling/mod-11').length, 1);
  assert.match(mod05.body, /\[MOD-11 DDD Context Map 建模\]\(\/modeling\/mod-11\)：实体、关系与权威记录可以为 Context 边界提供证据，但数据模型不能单独决定 Bounded Context。/u);
  assert.match(mod08.body, /\[MOD-11 DDD Context Map 建模\]\(\/modeling\/mod-11\)：状态、不变量和恢复规则的独立变化可以验证候选边界，但状态机不等于 Context Map。/u);
  assert.ok(!parseFrontMatter(mod09.source).adjacent_topics.includes('MOD-11'));
  assert.ok(!parseFrontMatter(mod10.source).adjacent_topics.includes('MOD-11'));
  assert.ok(extractInternalLinks(mod09).includes('/modeling/mod-11'));
  assert.ok(extractInternalLinks(mod10).includes('/modeling/mod-11'));
  assert.match(mod09.body, /EventStorming[^。\n]*(?:lane|swimlane|泳道|信号)[^。\n]*不能[^。\n]*Context/u);
  assert.match(mod10.body, /actor[^。\n]*工作对象[^。\n]*不能[^。\n]*Context/iu);
});

function assertStageAProjection(statusValue, manifestValue, mod11Document) {
  assert.deepEqual(statusValue, {
    schema_version: 1,
    durable_stories: {completed: 7, total: 20, current: 'G008'},
    completed_topics: 49,
    content_documents: 92,
    governed_sources: 488,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  const topicsById = new Map(manifestValue.topics.map((topic) => [topic.id, topic]));
  assert.equal(topicsById.get('MOD-11').published, true);
  assert.equal(topicsById.get('MOD-11').status.value, 'pending');
  for (const id of ['MOD-12', 'MOD-13']) {
    assert.equal(topicsById.get(id).published, false, id);
    assert.equal(topicsById.get(id).status.value, 'pending', id);
    assert.ok(!extractInternalLinks(mod11Document).includes(`/modeling/${id.toLowerCase()}`), id);
  }
}

test('locks the Stage A current projection and keeps MOD-12 through MOD-13 pending', () => {
  assertStageAProjection(projectStatus, topicManifest, requiredDocument());
});

test('rejects controlled MOD-12 through MOD-13 publication, status and link mutations', () => {
  for (const [label, mutateManifest, mutateDocument] of [
    ['MOD-12 published', (value) => { value.topics.find(({id}) => id === 'MOD-12').published = true; }],
    ['MOD-13 complete', (value) => { value.topics.find(({id}) => id === 'MOD-13').status.value = 'complete'; }],
    ['MOD-12 linked', undefined, (value) => { value.body += '\n[MOD-12](/modeling/mod-12)\n'; }],
    ['MOD-13 linked', undefined, (value) => { value.body += '\n[MOD-13](/modeling/mod-13)\n'; }],
  ]) {
    const mutatedManifest = structuredClone(topicManifest);
    const mutatedDocument = structuredClone(requiredDocument());
    mutateManifest?.(mutatedManifest);
    mutateDocument?.(mutatedDocument);
    assert.throws(
      () => assertStageAProjection(projectStatus, mutatedManifest, mutatedDocument),
      {name: 'AssertionError'},
      label,
    );
  }
});
