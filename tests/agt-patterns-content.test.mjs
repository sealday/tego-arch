import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

import {unified} from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';

import {
  extractMarkdownBody,
  findMarkdownHeadings,
  parseFrontMatter,
} from '../scripts/content-metadata.mjs';
import {knowledgeTypeContracts} from '../scripts/content-schema.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const workflowAgentArticlePath =
  'content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx';
const workflowAgentDecisionHeader = [
  '场景身份',
  '任务不确定性',
  '结果可验证性',
  '副作用风险',
  '执行时长',
  '推荐控制形态',
];
const workflowAgentDecisionCells = [
  [
    '已知步骤/低不确定性',
    '低；步骤和分支已知',
    '规则与验收结果明确',
    '低且边界可控',
    '短时或同步完成',
    '确定性代码或确定性工作流',
  ],
  [
    '开放步骤/可验证结果',
    '高；需要依据观察选步',
    '结果可验证且有明确停止标准',
    '低、只读或可逆',
    '在步数、时间和费用内有界',
    '有界智能体循环',
  ],
  [
    '高风险副作用',
    '任意；未知会进一步放大风险',
    '执行前后均须权威验证',
    '高或不可逆',
    '任意',
    '确定性工作流加人工批准',
  ],
  [
    '长时可恢复任务',
    '可低可高；与时长分开判断',
    '阶段结果和恢复点可验证',
    '只允许可去重、可补偿动作',
    '长时或跨进程运行',
    '持久执行；必要时再引入多智能体',
  ],
];
const workflowAgentDecisionRows = workflowAgentDecisionCells.map(([identity]) => identity);
const workflowAgentSourceIds = [
  'src-anthropic-building-effective-agents',
  'src-openai-practical-guide-building-agents',
];
const agenticRagArticlePath = 'content/patterns/agt-p-02-agentic-rag.mdx';
const agenticRagComparisonHeader = [
  '比较维度',
  '基础 RAG',
  '智能体检索增强生成',
];
const agenticRagComparisonCells = [
  ['控制路径', '一次形成查询、检索并生成', '围绕证据充分性循环检索、读取、评估并终止'],
  ['检索时机', '按预定步骤检索一次', '依据证据缺口决定是否继续检索'],
  ['查询策略', '使用初始查询', '在预算门内改写或扩展查询'],
  ['证据判断', '召回结果直接进入生成上下文', '按覆盖度、权威性、新鲜度、一致性与可归因性评估'],
  ['终止输出', '生成答案', '回答、拒答、人工澄清或拒绝并隔离'],
];
const agenticRagNodes = new Map([
  ['FORM_QUERY', ['形成查询']],
  ['RETRIEVE', ['检索']],
  ['READ_ATTRIBUTE', ['读取与归因']],
  ['SUFFICIENCY', ['证据充分性评估']],
  ['BUDGET_GATE', ['预算门']],
  ['REFORMULATE', ['改写或扩展查询']],
  ['ANSWER', ['回答']],
  ['REFUSE', ['拒答']],
  ['HUMAN_CLARIFY', ['人工澄清']],
  ['REJECT_QUARANTINE', ['拒绝并隔离']],
]);
const agenticRagEdges = [
  ['FORM_QUERY', 'RETRIEVE', null],
  ['RETRIEVE', 'READ_ATTRIBUTE', null],
  ['READ_ATTRIBUTE', 'SUFFICIENCY', null],
  ['SUFFICIENCY', 'ANSWER', '证据充分'],
  ['SUFFICIENCY', 'BUDGET_GATE', '证据不足'],
  ['SUFFICIENCY', 'HUMAN_CLARIFY', '证据矛盾'],
  ['SUFFICIENCY', 'REJECT_QUARANTINE', '证据不安全'],
  ['BUDGET_GATE', 'REFORMULATE', '预算可用'],
  ['BUDGET_GATE', 'REFUSE', '预算耗尽'],
  ['REFORMULATE', 'FORM_QUERY', null],
  ['HUMAN_CLARIFY', 'BUDGET_GATE', '已澄清并恢复'],
  ['HUMAN_CLARIFY', 'REFUSE', '超时或无法澄清'],
];
const agenticRagSourceContracts = [
  {
    id: 'src-rag-knowledge-intensive-nlp-tasks',
    locator: 'https://arxiv.org/abs/2005.11401',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authorOrOrg: 'Patrick Lewis et al.',
    publishedAt: '2021-04-12',
    version: 'arXiv:2005.11401v4, NeurIPS 2020 paper revision dated 2021-04-12',
    license: 'LicenseRef-All-Rights-Reserved',
    tier: 'primary',
    healthAttemptAt: '2026-08-26T18:19:10.000Z',
  },
  {
    id: 'src-flare-active-retrieval-augmented-generation',
    locator: 'https://arxiv.org/abs/2305.06983',
    title: 'Active Retrieval Augmented Generation',
    authorOrOrg: 'Zhengbao Jiang et al.',
    publishedAt: '2023-10-22',
    version: 'arXiv:2305.06983v2, EMNLP 2023 revision dated 2023-10-22',
    license: 'LicenseRef-All-Rights-Reserved',
    tier: 'primary',
    healthAttemptAt: '2026-08-26T18:19:10.000Z',
  },
  {
    id: 'src-self-rag-retrieve-generate-critique',
    locator: 'https://arxiv.org/abs/2310.11511',
    title: 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection',
    authorOrOrg: 'Akari Asai et al.',
    publishedAt: '2023-10-17',
    version: 'arXiv:2310.11511v1 dated 2023-10-17',
    license: 'CC-BY-4.0',
    tier: 'primary',
    healthAttemptAt: '2026-08-26T18:19:10.000Z',
  },
  {
    id: 'src-react-reasoning-acting-language-models',
    locator: 'https://arxiv.org/abs/2210.03629',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    authorOrOrg: 'Shunyu Yao et al.',
    publishedAt: '2023-03-10',
    version: 'arXiv:2210.03629v3, ICLR 2023 camera-ready revision dated 2023-03-10',
    license: 'CC-BY-4.0',
    tier: 'primary',
    healthAttemptAt: '2026-08-26T11:09:57.957Z',
  },
  {
    id: 'src-agentic-rag-survey',
    locator: 'https://arxiv.org/abs/2501.09136',
    title: 'Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG',
    authorOrOrg: 'Aditi Singh et al.',
    publishedAt: '2026-04-01',
    version: 'arXiv:2501.09136v4 survey revision dated 2026-04-01',
    license: 'LicenseRef-All-Rights-Reserved',
    tier: 'discovery',
    healthAttemptAt: '2026-08-26T18:19:10.000Z',
  },
];
const markdownParser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

const registry = JSON.parse(
  readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'),
);
const groups = JSON.parse(
  readFileSync('data/pattern-groups.json', 'utf8'),
).groups;
// Exact public contract preserved from trusted base b4a28ce before Agentic additions.
const preAgenticPublicGroups = Object.freeze([
  {
    id: 'general-design',
    label: '通用设计模式',
    description: '领域、企业应用、代码责任与结构模式。',
    order: 10,
    topic_ids: [
      'DDD-01', 'DDD-02', 'DDD-03', 'DDD-04', 'DDD-05', 'DDD-06',
      'APP-01', 'APP-02', 'APP-03', 'APP-04',
      'DP-01', 'DP-02', 'DP-03', 'DP-04', 'DP-05', 'DP-06', 'DP-07',
      'DP-08', 'DP-09', 'DP-10',
      'ANTI-01', 'ANTI-02', 'ANTI-06', 'ANTI-07', 'ANTI-08', 'ANTI-09',
      'ANTI-10',
    ],
  },
  {
    id: 'integration',
    label: '集成模式',
    description: '服务、消息、网关、协议与跨边界协作模式。',
    order: 20,
    topic_ids: [
      'PAT-IN-01', 'PAT-IN-02', 'PAT-IN-03', 'PAT-IN-04', 'PAT-IN-05',
      'PAT-IN-06', 'PAT-IN-07', 'PAT-IN-08', 'ANTI-05',
    ],
  },
  {
    id: 'reliability',
    label: '可靠性与生产治理模式',
    description: '恢复、隔离、容量、观测和安全控制模式。',
    order: 30,
    topic_ids: [
      'REL-01', 'REL-02', 'REL-03', 'REL-04', 'REL-05', 'REL-06',
      'REL-07', 'REL-08', 'REL-09', 'REL-10',
      'OPS-01', 'OPS-02', 'OPS-03', 'OPS-04', 'OPS-05', 'OPS-06',
      'SEC-01', 'SEC-02', 'SEC-03', 'SEC-04', 'SEC-05', 'SEC-06', 'ANTI-04',
    ],
  },
  {
    id: 'data',
    label: '数据与一致性模式',
    description: '事务消息、投影、事件和一致性协作模式。',
    order: 40,
    topic_ids: [
      'PAT-DC-01', 'PAT-DC-02', 'PAT-DC-03', 'PAT-DC-04', 'PAT-DC-05',
      'PAT-DC-06', 'PAT-DC-07', 'PAT-DC-08', 'PAT-DC-09', 'ANTI-03',
    ],
  },
  {
    id: 'migration',
    label: '迁移模式',
    description: '渐进替换、兼容窗口和风险受控的结构迁移。',
    order: 50,
    topic_ids: ['PAT-MIG-01', 'PAT-MIG-02', 'PAT-MIG-03'],
  },
]);

function assertPreAgenticPublicGroups(actualGroups) {
  assert.deepEqual(actualGroups, preAgenticPublicGroups);
}

// This is the same fail-closed reader model reviewed for AGT-C-06. Standard
// semantic HTML and the repository Callout are transparent; unknown custom
// components cannot contribute evidence because their rendering is unknown.
const workflowAgentVisibleContainers = new Set([
  'a',
  'article',
  'aside',
  'blockquote',
  'Callout',
  'details',
  'div',
  'em',
  'footer',
  'header',
  'li',
  'main',
  'ol',
  'p',
  'section',
  'span',
  'strong',
  'summary',
  'ul',
]);
const workflowAgentInvisibleAstTypes = new Set([
  'code',
  'definition',
  'html',
  'inlineCode',
  'mdxFlowExpression',
  'mdxTextExpression',
  'mdxjsEsm',
]);
const workflowAgentApprovedComponentImports = new Map([
  ['Callout', '@site/src/components/Callout'],
]);

function mdxJsxAttribute(node, name) {
  const normalizedName = name.toLowerCase();
  return (node.attributes ?? []).find((attribute) =>
    attribute.type === 'mdxJsxAttribute'
      && attribute.name.toLowerCase() === normalizedName);
}

function mdxJsxAttributeExpression(attribute) {
  const program = attribute.value?.data?.estree;
  if (
    program?.type !== 'Program'
    || program.body?.length !== 1
    || program.body[0]?.type !== 'ExpressionStatement'
  ) return null;
  return program.body[0].expression;
}

function staticMdxJsxAttributeValue(attribute) {
  if (attribute.value === null) return {known: true, value: true};
  if (typeof attribute.value === 'string') return {known: true, value: attribute.value};
  const expression = mdxJsxAttributeExpression(attribute);
  if (expression?.type === 'Literal') return {known: true, value: expression.value};
  return {known: false, value: null};
}

function staticStyleEntries(attribute) {
  if (typeof attribute.value === 'string') {
    if (/\/\*|\*\//u.test(attribute.value)) return null;
    const entries = [];
    for (const declaration of attribute.value.split(';')) {
      const separator = declaration.indexOf(':');
      if (separator === -1) {
        if (declaration.trim()) return null;
        continue;
      }
      entries.push([
        declaration.slice(0, separator).trim(),
        declaration.slice(separator + 1).trim(),
      ]);
    }
    return entries;
  }
  const expression = mdxJsxAttributeExpression(attribute);
  if (expression?.type !== 'ObjectExpression') return null;
  const entries = [];
  for (const property of expression.properties ?? []) {
    if (
      property.type !== 'Property'
      || property.computed
      || property.kind !== 'init'
      || property.value?.type !== 'Literal'
    ) return null;
    const key = property.key?.type === 'Identifier'
      ? property.key.name
      : property.key?.type === 'Literal' ? property.key.value : null;
    if (typeof key !== 'string') return null;
    if (!['string', 'number'].includes(typeof property.value.value)) return null;
    const value = String(property.value.value);
    if (/\/\*|\*\//u.test(value)) return null;
    entries.push([key, value]);
  }
  return entries;
}

function hasUnresolvedWorkflowAgentAttribute(node) {
  return (node.attributes ?? []).some((attribute) => {
    if (attribute.type !== 'mdxJsxAttribute') return true;
    if (attribute.name.toLowerCase() === 'style') {
      return staticStyleEntries(attribute) === null;
    }
    return !staticMdxJsxAttributeValue(attribute).known;
  });
}

function isReaderHiddenJsx(node) {
  if (hasUnresolvedWorkflowAgentAttribute(node)) return true;
  if (mdxJsxAttribute(node, 'hidden')) return true;
  const ariaHidden = mdxJsxAttribute(node, 'aria-hidden');
  if (ariaHidden) {
    const {known, value} = staticMdxJsxAttributeValue(ariaHidden);
    if (!known || String(value).trim().toLowerCase() !== 'false') return true;
  }
  const style = mdxJsxAttribute(node, 'style');
  if (style) {
    for (const [name, value] of staticStyleEntries(style)) {
      const normalizedName = name.replace(/-/gu, '').toLowerCase();
      const normalizedValue = value.trim().toLowerCase().replace(/\s*!important\s*$/u, '');
      if (
        (normalizedName === 'display' && normalizedValue === 'none')
        || (normalizedName === 'visibility' && normalizedValue === 'hidden')
        || (
          ['display', 'visibility'].includes(normalizedName)
          && /(?:var|env)\s*\(/iu.test(normalizedValue)
        )
      ) return true;
    }
  }
  return false;
}

function isWorkflowAgentContainer(node) {
  return node.name === null || workflowAgentVisibleContainers.has(node.name);
}

function esmBindingNames(pattern) {
  if (!pattern || typeof pattern !== 'object') return [];
  if (pattern.type === 'Identifier') return [pattern.name];
  if (pattern.type === 'AssignmentPattern') return esmBindingNames(pattern.left);
  if (pattern.type === 'RestElement') return esmBindingNames(pattern.argument);
  if (pattern.type === 'ArrayPattern') {
    return (pattern.elements ?? []).flatMap(esmBindingNames);
  }
  if (pattern.type === 'ObjectPattern') {
    return (pattern.properties ?? []).flatMap((property) =>
      property.type === 'RestElement'
        ? esmBindingNames(property.argument)
        : esmBindingNames(property.value));
  }
  return [];
}

function readerVisibleNodeText(node) {
  assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
  if (workflowAgentInvisibleAstTypes.has(node.type)) return '';
  if (node.type === 'text') return node.value;
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    if (isReaderHiddenJsx(node) || !isWorkflowAgentContainer(node)) return '';
  }
  return (node.children ?? []).map(readerVisibleNodeText).join('');
}

function readerVisibleTables(source) {
  const body = extractMarkdownBody(source);
  const ast = markdownParser.parse(body);
  assert.equal(ast.type, 'root', 'AGT-P-01 MDX document root');
  assert.ok(Array.isArray(ast.children), 'AGT-P-01 MDX root children');
  const tables = [];
  const visit = (node) => {
    assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
    if (workflowAgentInvisibleAstTypes.has(node.type)) return;
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (isReaderHiddenJsx(node) || !isWorkflowAgentContainer(node)) return;
    }
    if (node.type === 'table') {
      tables.push({
        node,
        rows: node.children.map((row) => row.children.map((cell) =>
          readerVisibleNodeText(cell).replace(/\s+/gu, ' ').trim())),
      });
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return {ast, body, tables};
}

function rootMermaidCodeBlocks(source) {
  const ast = markdownParser.parse(extractMarkdownBody(source));
  assert.equal(ast.type, 'root', 'MDX document root');
  assert.ok(Array.isArray(ast.children), 'MDX document root children');
  return ast.children.flatMap((node) => {
    assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
    if (node.type !== 'code' || node.lang !== 'mermaid') return [];
    assert.equal(typeof node.value, 'string');
    assert.notEqual(node.value.trim(), '');
    return [node.value];
  });
}

function assertAgenticRagSourceRecords(ledger, health) {
  for (const contract of agenticRagSourceContracts) {
    const source = ledger.sources.find(({id}) => id === contract.id);
    assert.ok(source, contract.id);
    assert.deepEqual(
      {
        canonical_locator: source.canonical_locator,
        transport_locator: source.transport_locator,
        expected_final_transport_locator: source.expected_final_transport_locator,
        title: source.title,
        author_or_org: source.author_or_org,
        published_at: source.published_at,
        version: source.version,
        source_kind: source.source_kind,
        tier: source.tier,
        license: source.license,
      },
      {
        canonical_locator: contract.locator,
        transport_locator: contract.locator,
        expected_final_transport_locator: contract.locator,
        title: contract.title,
        author_or_org: contract.authorOrOrg,
        published_at: contract.publishedAt,
        version: contract.version,
        source_kind: 'paper',
        tier: contract.tier,
        license: contract.license,
      },
      contract.id,
    );
    const observation = health.results.find(({source_ids: sourceIds}) =>
      sourceIds.includes(contract.id));
    assert.ok(observation, `${contract.id} health observation`);
    assert.equal(observation.transport_locator, contract.locator, contract.id);
    assert.deepEqual(
      observation.last_attempt,
      {
        at: contract.healthAttemptAt,
        outcome: 'healthy',
        final_transport_locator: contract.locator,
        http_status: 206,
        login_wall_detected: false,
        redirects: [],
      },
      `${contract.id} last attempt`,
    );
    assert.deepEqual(
      observation.last_success,
      {
        at: contract.healthAttemptAt,
        outcome: 'healthy',
        final_transport_locator: contract.locator,
        http_status: 206,
        login_wall_detected: false,
      },
      `${contract.id} last success`,
    );
    assert.equal(observation.review_status, 'healthy', `${contract.id} health review status`);
  }
}

function parseAgenticRagMermaid(mermaid) {
  const labelsById = new Map();
  const edges = [];
  let headerSeen = false;
  const nodePattern = '[A-Z][A-Z_]*(?:\\["[^"\\n]+"\\])?';
  const nodeSegment = /^([A-Z][A-Z_]*)(?:\["([^"\n]+)"\])?$/u;
  const edgeStatement = new RegExp(
    `^${nodePattern}(?:\\s*-->(?:\\|[^|\\n]+\\|)?\\s*${nodePattern})+$`,
    'u',
  );

  for (const line of mermaid.split(/\r?\n/u)) {
    const statement = line.trim();
    if (!statement) continue;
    if (!headerSeen && statement === 'flowchart TB') {
      headerSeen = true;
      continue;
    }
    assert.match(statement, edgeStatement, `unparsed Agentic RAG Mermaid: ${line}`);
    const parts = statement.split(/\s*-->(?:\|([^|\n]+)\|)?\s*/u);
    const nodeSegments = [];
    const labels = [];
    for (let index = 0; index < parts.length; index += 2) {
      nodeSegments.push(parts[index]);
      if (index + 1 < parts.length) labels.push(parts[index + 1] ?? null);
    }
    assert.ok(nodeSegments.length >= 2, `unparsed Agentic RAG edge: ${line}`);
    const nodeIds = nodeSegments.map((segment) => {
      const match = segment.match(nodeSegment);
      assert.ok(match, `unparsed Agentic RAG node: ${segment}`);
      const [, id, label] = match;
      if (label !== undefined) {
        const knownLabels = labelsById.get(id) ?? new Set();
        knownLabels.add(label);
        labelsById.set(id, knownLabels);
      }
      return id;
    });
    for (let index = 1; index < nodeIds.length; index += 1) {
      edges.push([nodeIds[index - 1], nodeIds[index], labels[index - 1]]);
    }
  }
  assert.ok(headerSeen, 'Agentic RAG Mermaid flowchart TB header');
  return {
    labelsById: new Map([...labelsById].map(([id, labels]) => [id, [...labels].sort()])),
    edges,
  };
}

function assertPhysicalTable(body, tableNode, expectedRows, expectedColumns, label) {
  const startLine = tableNode.position?.start.line;
  const endLine = tableNode.position?.end.line;
  assert.ok(Number.isInteger(startLine) && Number.isInteger(endLine));
  const lines = body.split(/\r?\n/u).slice(startLine - 1, endLine);
  assert.equal(lines.length, expectedRows + 2, `${label} physical row count`);
  for (const [index, line] of lines.entries()) {
    assert.equal(
      physicalGfmCells(line).length,
      expectedColumns,
      `${label} physical row ${index + 1} cell count`,
    );
  }
  assert.ok(
    physicalGfmCells(lines[1]).every((cell) => /^:?-{3,}:?$/u.test(cell)),
    `${label} physical delimiter row`,
  );
}

function assertAgenticRagContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.title, '智能体检索增强生成（Agentic RAG）：用证据充分性约束检索循环');
  assert.equal(metadata.topic_id, 'AGT-P-02');
  assert.equal(metadata.slug, '/patterns/agt-p-02');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'advanced');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, ['agent-loop', 'agentic-rag']);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, ['reliability', 'safety', 'cost-efficiency']);
  assert.deepEqual(metadata.tags, [
    '智能体检索增强生成',
    '证据充分性',
    '检索循环',
    '来源归因',
    '拒答',
  ]);
  assert.equal(
    metadata.summary,
    '把智能体检索增强生成定义为以证据充分性为终止判断的有界智能体循环（Agent Loop），用覆盖度、权威性、新鲜度、一致性与可归因性控制继续检索、回答、拒答、澄清或隔离。',
  );
  assert.deepEqual(metadata.depends_on, ['AGT-C-03', 'AGT-C-04', 'AGT-C-06']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-03',
    'AGT-C-04',
    'AGT-C-06',
    'AGT-P-01',
    'AGT-P-04',
    'AGT-P-07',
  ]);
  assert.deepEqual(metadata.related_cases, ['/cases/multi-agent-research-system']);
  assert.deepEqual(metadata.related_questions, []);

  assert.deepEqual(
    findMarkdownHeadings(source)
      .filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const {body, tables} = readerVisibleTables(source);
  const comparisonTables = tables.filter(({rows: [header]}) =>
    header?.[0] === agenticRagComparisonHeader[0]);
  assert.equal(comparisonTables.length, 1, 'exactly one reader-visible RAG comparison table');
  const [{node, rows: [header, ...rows]}] = comparisonTables;
  assertPhysicalTable(
    body,
    node,
    agenticRagComparisonCells.length,
    agenticRagComparisonHeader.length,
    'RAG comparison table',
  );
  assert.deepEqual(header, agenticRagComparisonHeader);
  assert.deepEqual(rows, agenticRagComparisonCells);

  const mermaidBlocks = rootMermaidCodeBlocks(source);
  assert.equal(mermaidBlocks.length, 1, 'exactly one root-level visible Agentic RAG Mermaid');
  const graph = parseAgenticRagMermaid(mermaidBlocks[0]);
  assert.deepEqual(graph.labelsById, agenticRagNodes);
  assert.deepEqual(graph.edges, agenticRagEdges);
  assert.deepEqual(
    graph.edges.filter(([, target]) => target === 'ANSWER'),
    [['SUFFICIENCY', 'ANSWER', '证据充分']],
    'answer has exactly one sufficiency-gated predecessor',
  );
  assert.ok(
    graph.edges.some(([sourceId, target]) =>
      sourceId === 'REFORMULATE' && target === 'FORM_QUERY'),
    'query-rewrite loop returns through the budget gate',
  );

  const visible = parseMdxVisibleCopy(source, agenticRagArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  for (const contract of [
    /覆盖度[\s\S]*权威性[\s\S]*新鲜度[\s\S]*一致性[\s\S]*可归因性/u,
    /评测器[\s\S]*(?:会出错|可错|并非事实裁判)/u,
    /查询次数[\s\S]*词元成本[\s\S]*经过时间[\s\S]*来源多样性/u,
    /提示注入[\s\S]*投毒检索/u,
    /控制所有者/u,
    /状态所有者/u,
    /只读/u,
    /终止/u,
    /失败[\s\S]*恢复/u,
    /自动循环[\s\S]*安全暂停/u,
    /外部新输入[\s\S]*预算门/u,
    /确定性工作流/u,
    /综述[\s\S]*(?:分类|谱系)[\s\S]*发现[\s\S]*不替代[\s\S]*原始论文/u,
  ]) assert.match(visible, contract);
}

function physicalGfmCells(line) {
  const trimmed = line.trim();
  assert.match(trimmed, /^\|.*\|$/u, 'GFM table row owns leading and trailing pipes');
  const cells = [''];
  let codeFenceLength = 0;
  for (let index = 1; index < trimmed.length - 1; index += 1) {
    const character = trimmed[index];
    if (character === '\\' && index + 1 < trimmed.length - 1) {
      cells[cells.length - 1] += `${character}${trimmed[index + 1]}`;
      index += 1;
      continue;
    }
    if (character === '`') {
      let end = index + 1;
      while (trimmed[end] === '`') end += 1;
      const runLength = end - index;
      if (codeFenceLength === 0) codeFenceLength = runLength;
      else if (codeFenceLength === runLength) codeFenceLength = 0;
      index = end - 1;
      continue;
    }
    if (character === '|' && codeFenceLength === 0) cells.push('');
    else cells[cells.length - 1] += character;
  }
  assert.equal(codeFenceLength, 0, 'GFM table row closes inline code');
  return cells.map((cell) => cell.trim());
}

function assertPhysicalDecisionTable(body, tableNode) {
  const startLine = tableNode.position?.start.line;
  const endLine = tableNode.position?.end.line;
  assert.ok(Number.isInteger(startLine) && Number.isInteger(endLine));
  const lines = body.split(/\r?\n/u).slice(startLine - 1, endLine);
  assert.equal(lines.length, workflowAgentDecisionRows.length + 2);
  for (const [index, line] of lines.entries()) {
    assert.equal(
      physicalGfmCells(line).length,
      workflowAgentDecisionHeader.length,
      `decision-table physical row ${index + 1} has exactly six cells`,
    );
  }
  assert.ok(
    physicalGfmCells(lines[1]).every((cell) => /^:?-{3,}:?$/u.test(cell)),
    'decision-table delimiter row contains only GFM delimiters',
  );
}

function assertNoWorkflowAgentVisual(ast) {
  const embeddingAttributes = new Set(['data', 'poster', 'src', 'srcset']);
  const visualIdentity = /(?:architecture)?diagram|illustration|image|picture|canvas|chart|figure|graph|visual/iu;
  const visualAsset = /\.(?:apng|avif|bmp|gif|heic|heif|ico|jpe?g|jxl|png|svg|tiff?|webp)(?:[?#].*)?$/iu;
  const visualCssFunction = /(?:cross-fade|image-set|url)\s*\(/iu;
  const indeterminateCssFunction = /(?:env|var)\s*\(/iu;
  const visit = (node) => {
    assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      const expressionProgram = node.data?.estree;
      const isNonRenderingAnnotation = node.type === 'mdxFlowExpression'
        && expressionProgram?.type === 'Program'
        && expressionProgram.body?.length === 0
        && expressionProgram.comments?.length === 1
        && expressionProgram.comments[0]?.type === 'Block'
        && /^\/\*(?:(?!\*\/)[\s\S])*\*\/$/u.test(node.value.trim());
      assert.ok(
        isNonRenderingAnnotation,
        'AGT-P-01 permits only non-rendering block comments as MDX expressions',
      );
    }
    if (node.type === 'mdxjsEsm') {
      const program = node.data?.estree;
      assert.equal(program?.type, 'Program', 'AGT-P-01 ESM must expose a parsed program');
      for (const statement of program.body ?? []) {
        const declaration = statement.declaration ?? statement;
        const locallyDeclaredNames = [];
        if (declaration.type === 'VariableDeclaration') {
          for (const item of declaration.declarations ?? []) {
            locallyDeclaredNames.push(...esmBindingNames(item.id));
          }
        } else if (
          ['ClassDeclaration', 'FunctionDeclaration'].includes(declaration.type)
          && declaration.id?.type === 'Identifier'
        ) locallyDeclaredNames.push(declaration.id.name);
        for (const name of locallyDeclaredNames) {
          assert.ok(
            !workflowAgentApprovedComponentImports.has(name),
            `AGT-P-01 local ${name} declaration cannot impersonate an approved component`,
          );
        }
        if (!['ImportDeclaration', 'ExportAllDeclaration', 'ExportNamedDeclaration']
          .includes(statement.type)) continue;
        const source = statement.source?.value;
        const importedNames = (statement.specifiers ?? []).flatMap((specifier) => [
          specifier.local?.name,
          specifier.imported?.name,
          specifier.exported?.name,
        ]).filter(Boolean);
        if (statement.type === 'ImportDeclaration') {
          for (const specifier of statement.specifiers ?? []) {
            const localName = specifier.local?.name;
            if (typeof localName !== 'string' || !/^[A-Z]/u.test(localName)) continue;
            const approvedSource = workflowAgentApprovedComponentImports.get(localName);
            const importedName = specifier.type === 'ImportDefaultSpecifier'
              ? 'default'
              : specifier.type === 'ImportSpecifier' ? specifier.imported?.name : '*';
            assert.ok(
              approvedSource === source
                && ['default', localName].includes(importedName),
              `AGT-P-01 custom component binding ${localName} lacks approved provenance`,
            );
          }
        }
        assert.ok(
          !(typeof source === 'string' && (visualIdentity.test(source) || visualAsset.test(source)))
            && !importedNames.some((name) => visualIdentity.test(name)),
          'AGT-P-01 must not import or re-export a visual resource or component',
        );
      }
    }
    assert.ok(
      node.type !== 'image' && node.type !== 'imageReference',
      'AGT-P-01 has no Markdown image',
    );
    assert.ok(
      node.type !== 'code'
        || typeof node.lang !== 'string'
        || node.lang.toLowerCase() !== 'mermaid',
      'AGT-P-01 has no Mermaid diagram',
    );
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      assert.ok(
        isWorkflowAgentContainer(node),
        `AGT-P-01 permits only known non-visual semantic containers; found ${node.name}`,
      );
      for (const attribute of node.attributes ?? []) {
        assert.equal(
          attribute.type,
          'mdxJsxAttribute',
          'AGT-P-01 JSX spreads fail the no-visual contract closed',
        );
        const name = attribute.name.toLowerCase();
        assert.ok(
          !embeddingAttributes.has(name),
          `AGT-P-01 must not declare embedding attribute ${attribute.name}`,
        );
        if (name === 'style') {
          const entries = staticStyleEntries(attribute);
          assert.ok(entries, 'AGT-P-01 dynamic JSX style fails the no-visual contract closed');
          for (const [property, value] of entries) {
            const normalizedProperty = property.replace(/-/gu, '').toLowerCase();
            assert.ok(
              !visualCssFunction.test(value),
              'AGT-P-01 inline style must not contain a visual resource function',
            );
            assert.ok(
              !['background', 'backgroundimage'].includes(normalizedProperty)
                || !indeterminateCssFunction.test(value),
              'AGT-P-01 background resources cannot be indeterminate',
            );
          }
        } else {
          const staticValue = staticMdxJsxAttributeValue(attribute);
          assert.ok(
            staticValue.known,
            `AGT-P-01 unresolved ${attribute.name} attribute fails closed`,
          );
          assert.ok(
            name !== 'role'
              || !String(staticValue.value).trim().toLowerCase().split(/\s+/u).includes('img'),
            'AGT-P-01 semantic containers must not impersonate an image',
          );
        }
      }
    }
    if (node.type === 'html') {
      assert.doesNotMatch(
        node.value,
        /<(?:canvas|embed|figure|iframe|img|object|picture|svg|video)\b/iu,
      );
      assert.doesNotMatch(node.value, /\b(?:data|poster|src|srcset)\s*=/iu);
      const role = node.value.match(/\brole\s*=\s*(['"])(.*?)\1/iu)?.[2] ?? '';
      assert.ok(
        !role.trim().toLowerCase().split(/\s+/u).includes('img'),
        'AGT-P-01 raw HTML must not declare an image fallback role',
      );
      const style = node.value.match(/\bstyle\s*=\s*(['"])(.*?)\1/iu)?.[2] ?? '';
      assert.doesNotMatch(style, /\/\*|\*\//u, 'AGT-P-01 raw CSS comments fail closed');
      assert.ok(
        !/background(?:-?image)?\s*:[\s\S]*url\s*\(/iu.test(style),
        'AGT-P-01 raw HTML must not embed a visual background resource',
      );
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
}

function assertWorkflowAgentContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.title, '确定性工作流（Workflow）与自治智能体（Agent）');
  assert.equal(metadata.topic_id, 'AGT-P-01');
  assert.equal(metadata.slug, '/patterns/agt-p-01');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'intermediate');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, ['agent-loop']);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, ['reliability', 'safety', 'operability']);
  assert.deepEqual(metadata.tags, [
    '确定性工作流',
    '自治智能体（Agent）',
    '智能体循环（Agent Loop）',
    '控制权',
    '确定性回退',
  ]);
  assert.equal(
    metadata.summary,
    '用任务不确定性、结果可验证性、副作用风险与执行时长选择确定性代码、含模型步骤的工作流、有界智能体循环（Agent Loop）或持久与多智能体执行，并规定升级与回退合同。',
  );
  assert.deepEqual(metadata.depends_on, ['AGT-C-01', 'AGT-C-03']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-01',
    'AGT-C-03',
    'AGT-P-02',
    'AGT-P-03',
    'AGT-P-04',
    'AGT-P-05',
    'AGT-P-06',
    'AGT-P-07',
    'AGT-P-08',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/multi-agent-research-system',
    '/cases/long-running-coding-agent',
    '/cases/production-incident-response-agent',
  ]);
  assert.deepEqual(metadata.related_questions, []);

  assert.deepEqual(
    findMarkdownHeadings(source)
      .filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const {ast, body, tables} = readerVisibleTables(source);
  assertNoWorkflowAgentVisual(ast);
  const decisionTables = tables.filter(({rows: [header]}) =>
    header?.[0] === workflowAgentDecisionHeader[0]);
  assert.equal(decisionTables.length, 1, 'exactly one reader-visible autonomy decision table');
  const [{node, rows: [header, ...rows]}] = decisionTables;
  assertPhysicalDecisionTable(body, node);
  assert.deepEqual(header, workflowAgentDecisionHeader);
  assert.equal(rows.length, 4, 'exactly four autonomy decision rows');
  assert.deepEqual(rows.map(([identity]) => identity), workflowAgentDecisionRows);
  for (const [rowIndex, row] of rows.entries()) {
    assert.equal(row.length, 6, `decision row ${rowIndex + 1} has six cells`);
    assert.ok(row.every(Boolean), `decision row ${rowIndex + 1} has no empty cell`);
  }
  assert.deepEqual(
    rows,
    workflowAgentDecisionCells,
    'all four row identities and all five decision-axis cells preserve approved semantics',
  );

  const visibleCopy = parseMdxVisibleCopy(source, workflowAgentArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  assert.match(
    visibleCopy,
    /deterministic code → workflow with model step → bounded agent loop → durable\/multi-agent/u,
  );
  for (const contract of [
    /控制所有者/u,
    /状态所有者/u,
    /副作用/u,
    /终止条件/u,
    /失败/u,
    /恢复/u,
    /权衡/u,
    /迁移/u,
    /回退[\s\S]*确定性工作流|确定性工作流[\s\S]*回退/u,
    /不是(?:全行业|行业)标准/u,
  ]) assert.match(visibleCopy, contract);
  assert.match(visibleCopy, /任务不确定性/u);
  assert.match(visibleCopy, /结果可验证性/u);
  assert.match(visibleCopy, /执行时长/u);
  assert.match(visibleCopy, /Building Effective Agents/u);
  assert.match(visibleCopy, /A Practical Guide to Building Agents/u);
}

function replaceDecisionCell(source, rowIndex, columnIndex, replacement) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.findIndex((line) =>
    line === `| ${workflowAgentDecisionHeader.join(' | ')} |`);
  assert.notEqual(headerIndex, -1, 'decision table physical header');
  const lineIndex = headerIndex + 2 + rowIndex;
  const cells = physicalGfmCells(lines[lineIndex]);
  cells[columnIndex] = replacement;
  lines[lineIndex] = `| ${cells.join(' | ')} |`;
  return lines.join('\n');
}

test('agent-control group exposes the eight approved patterns in order', () => {
  const matchingGroups = groups.filter(({id}) => id === 'agent-control');
  assert.equal(matchingGroups.length, 1);

  const [group] = matchingGroups;
  assert.deepEqual(group.topic_ids, registry.patterns.map(({id}) => id));
  assert.equal(
    group.description,
    '从确定性工作流到检索循环、多 Agent 控制与可恢复执行。',
  );

  assert.equal(new Set(groups.map(({id}) => id)).size, groups.length);
  const assignedTopicIds = groups.flatMap(({topic_ids: topicIds}) => topicIds);
  assert.equal(new Set(assignedTopicIds).size, assignedTopicIds.length);
});

test('preserves the approved pre-Agentic public group contract', () => {
  const existingGroups = groups.filter(({id}) => id !== 'agent-control');
  assertPreAgenticPublicGroups(existingGroups);

  const swappedAssignment = structuredClone(existingGroups);
  const generalDesign = swappedAssignment.find(({id}) => id === 'general-design');
  const integration = swappedAssignment.find(({id}) => id === 'integration');
  [generalDesign.topic_ids[0], integration.topic_ids[0]] = [
    integration.topic_ids[0],
    generalDesign.topic_ids[0],
  ];
  assert.throws(
    () => assertPreAgenticPublicGroups(swappedAssignment),
    assert.AssertionError,
    'the contract rejects swapping general-design DDD-01 with integration PAT-IN-01',
  );
});

test('AGT-P-01 publishes the exact workflow-versus-agent contract', () => {
  assert.ok(existsSync(workflowAgentArticlePath), `Missing ${workflowAgentArticlePath}`);
  assertWorkflowAgentContract(readFileSync(workflowAgentArticlePath, 'utf8'));
});

test('AGT-P-01 decision matrix rejects structural and semantic mutations', () => {
  assert.ok(existsSync(workflowAgentArticlePath), `Missing ${workflowAgentArticlePath}`);
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const mutations = [];
  for (let rowIndex = 0; rowIndex < workflowAgentDecisionRows.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < workflowAgentDecisionHeader.length; columnIndex += 1) {
      mutations.push([
        `empty row ${rowIndex + 1} column ${columnIndex + 1}`,
        replaceDecisionCell(source, rowIndex, columnIndex, ''),
      ], [
        `wrong semantics row ${rowIndex + 1} column ${columnIndex + 1}`,
        replaceDecisionCell(source, rowIndex, columnIndex, '非空但错误'),
      ]);
    }
  }
  mutations.push([
    'known-step recommendation loses deterministic control',
    replaceDecisionCell(source, 0, 5, '自治优先'),
  ], [
    'open-step recommendation loses bounded loop',
    replaceDecisionCell(source, 1, 5, '无界循环'),
  ], [
    'high-risk recommendation loses deterministic workflow and approval',
    replaceDecisionCell(source, 2, 5, '完全自治执行'),
  ], [
    'long-running recommendation loses durable execution',
    replaceDecisionCell(source, 3, 5, '单次同步调用'),
  ], [
    'extra physical column',
    source
      .replace(
        `| ${workflowAgentDecisionHeader.join(' | ')} |`,
        `| ${workflowAgentDecisionHeader.join(' | ')} | 冗余列 |`,
      )
      .replace('| --- | --- | --- | --- | --- | --- |', '| --- | --- | --- | --- | --- | --- | --- |'),
  ]);

  const firstRowLine = `| ${workflowAgentDecisionRows[0]} |`;
  const hiddenDecoy = source.replace(firstRowLine, '| 错误身份 |');
  mutations.push([
    'HTML-comment decision-table decoy',
    `${hiddenDecoy}\n\n<!--\n${source.slice(source.indexOf(`| ${workflowAgentDecisionHeader.join(' | ')} |`))}\n-->`,
  ], [
    'code-fence decision-table decoy',
    `${hiddenDecoy}\n\n\`\`\`markdown\n${source.slice(source.indexOf(`| ${workflowAgentDecisionHeader.join(' | ')} |`))}\n\`\`\``,
  ]);

  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.throws(() => assertWorkflowAgentContract(mutant), undefined, label);
  }
});

test('AGT-P-01 decision evidence excludes reader-hidden and indeterminate cell copy', () => {
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const mutations = [
    ['present hidden attribute', '<span hidden>确定性代码或确定性工作流</span>自治优先'],
    ['aria-hidden attribute', '<span aria-hidden="true">确定性代码或确定性工作流</span>自治优先'],
    ['display-none style', '<span style="display: none">确定性代码或确定性工作流</span>自治优先'],
    [
      'comment-suffixed display none',
      '<span style="display:none/* hidden */">确定性代码或确定性工作流</span>',
    ],
    ['visibility-hidden object style', "<span style={{visibility: 'hidden'}}>确定性代码或确定性工作流</span>自治优先"],
    [
      'custom-property hidden display',
      '<span style="--evidence-display:none; display:var(--evidence-display)">确定性代码或确定性工作流</span>',
    ],
    ['inline-code evidence', '自治优先 `确定性代码或确定性工作流`'],
    ['text-expression evidence', "自治优先 <span>{'确定性代码或确定性工作流'}</span>"],
    ['dynamic hidden state', '自治优先 <span aria-hidden={hiddenState}>确定性代码或确定性工作流</span>'],
  ].map(([label, replacement]) => [label, replaceDecisionCell(source, 0, 5, replacement)]);
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.doesNotThrow(
      () => markdownParser.parse(extractMarkdownBody(mutant)),
      `${label} fixture remains syntactically valid MDX`,
    );
    try {
      assertWorkflowAgentContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: hidden, code-only, expression, and unresolved evidence cannot count.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-01 reader-visible semantics cannot be satisfied by hidden or code-only decoys', () => {
  assert.ok(existsSync(workflowAgentArticlePath), `Missing ${workflowAgentArticlePath}`);
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const progression =
    'deterministic code → workflow with model step → bounded agent loop → durable/multi-agent';
  for (const decoy of [
    `{/* ${progression} */}`,
    `\`\`\`text\n${progression}\n\`\`\``,
    `<span hidden>${progression}</span>`,
  ]) {
    const mutant = `${source.replace(
      `**${progression}**`,
      '**自治级别可以任意跳跃**',
    )}\n\n${decoy}`;
    assert.doesNotThrow(
      () => parseMdxVisibleCopy(mutant, workflowAgentArticlePath),
      'decoy mutation remains valid MDX',
    );
    assert.throws(() => assertWorkflowAgentContract(mutant));
  }
});

test('AGT-P-01 rejects the review-survivor contract mutations', () => {
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const mutations = [
    [
      'high-risk verification becomes unnecessary',
      source.replace('执行前后均须权威验证', '无需任何验证'),
    ],
    [
      'long-running side effects become irreversible',
      source.replace('只允许可去重、可补偿动作', '允许不可逆写入'),
    ],
    [
      'hidden deterministic text backs an autonomy-first recommendation',
      replaceDecisionCell(source, 0, 5, '自治优先<span hidden>确定性代码</span>'),
    ],
    ['custom architecture component', `${source}\n\n<ArchitectureDiagram />\n`],
    ['semantic container impersonates an image', `${source}\n\n<div role="img">架构图</div>\n`],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.doesNotThrow(
      () => markdownParser.parse(extractMarkdownBody(mutant)),
      `${label} fixture remains syntactically valid MDX`,
    );
    try {
      assertWorkflowAgentContract(mutant);
      survivors.push(label);
    } catch {
      // Expected after the fail-closed contract is implemented.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-01 no-visual contract fails closed across MDX embedding surfaces', () => {
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const mutations = [
    ['Markdown image', `${source}\n\n![architecture](/assets/architecture.svg)\n`],
    ['referenced Markdown image', `${source}\n\n![architecture][visual]\n\n[visual]: /assets/architecture.svg\n`],
    ['custom visual component', `${source}\n\n<ArchitectureDiagram />\n`],
    ['unknown visual wrapper', `${source}\n\n<VisualCard>架构</VisualCard>\n`],
    ['role img', `${source}\n\n<div role="img">架构</div>\n`],
    ['fallback role list contains img', `${source}\n\n<div role="unknown-role img">架构</div>\n`],
    ['source attribute', `${source}\n\n<div src="/assets/architecture.svg">架构</div>\n`],
    ['data attribute', `${source}\n\n<div data="/assets/architecture.svg">架构</div>\n`],
    ['poster attribute', `${source}\n\n<div poster="/assets/architecture.png">架构</div>\n`],
    ['srcSet attribute', `${source}\n\n<div srcSet="/assets/a.png 1x">架构</div>\n`],
    ['dynamic source attribute', `${source}\n\n<div src={visualSource}>架构</div>\n`],
    ['spread attributes', `${source}\n\n<div {...visualProps}>架构</div>\n`],
    ['background URL string style', `${source}\n\n<div style="background: url('/assets/a.png')">架构</div>\n`],
    ['backgroundImage URL object style', `${source}\n\n<div style={{backgroundImage: "url('/assets/a.png')"}}>架构</div>\n`],
    [
      'custom-property background URL',
      `${source}\n\n<div style="--hero:url('/assets/a.png'); background:var(--hero)">架构</div>\n`,
    ],
    [
      'externally unresolved background variable',
      `${source}\n\n<div style={{backgroundImage: 'var(--hero)'}}>架构</div>\n`,
    ],
    ['dynamic style', `${source}\n\n<div style={visualStyle}>架构</div>\n`],
    ['case-insensitive Mermaid', `${source}\n\n\`\`\`Mermaid\ngraph TD\n A --> B\n\`\`\`\n`],
    ['renderable flow expression', `${source}\n\n{<ArchitectureDiagram />}\n`],
    ['renderable text expression', `${source}\n\n正文 {'可渲染视觉占位'}。\n`],
    [
      'visual ESM component import',
      `${source}\n\nimport ArchitectureDiagram from './ArchitectureDiagram.js';\n`,
    ],
    [
      'visual ESM asset import',
      `${source}\n\nimport architectureAsset from './architecture.svg';\n`,
    ],
    ['ICO visual ESM asset import', `${source}\n\nimport hero from './hero.ico';\n`],
    [
      'unknown renderer aliases the Callout binding',
      `${source}\n\nimport Callout from './UnknownRenderer.js';\n\n<Callout>架构</Callout>\n`,
    ],
    ['Chart component import', `${source}\n\nimport Chart from './Chart.js';\n`],
    [
      'local declaration impersonates Callout',
      `${source}\n\nexport const Callout = ({children}) => children;\n\n<Callout>架构</Callout>\n`,
    ],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.doesNotThrow(
      () => markdownParser.parse(extractMarkdownBody(mutant)),
      `${label} fixture remains syntactically valid MDX`,
    );
    try {
      assertWorkflowAgentContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: every visual or indeterminate rendering surface fails closed.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-01 accepts known static non-visual semantic containers', () => {
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  for (const addition of [
    '<Callout className="decision-note">普通文字提示</Callout>',
    '<div className="table-wrapper">普通表格辅助说明</div>',
    "import Callout from '@site/src/components/Callout';\n\n<Callout>普通导入提示</Callout>",
  ]) {
    assert.doesNotThrow(() => assertWorkflowAgentContract(`${source}\n\n${addition}\n`));
  }
});

test('AGT-P-01 rejects public metadata mutations', () => {
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const mutations = [
    ['title', source.replace(
      'title: 确定性工作流（Workflow）与自治智能体（Agent）',
      'title: 自治智能体优先',
    )],
    ['tags', source.replace('  - 确定性回退', '  - 完全自治')],
    ['summary', source.replace(
      'summary: 用任务不确定性、结果可验证性、副作用风险与执行时长选择确定性代码、含模型步骤的工作流、有界智能体循环（Agent Loop）或持久与多智能体执行，并规定升级与回退合同。',
      'summary: Agent 总是比工作流先进。',
    )],
    ['related_questions', source.replace('related_questions: []', 'related_questions:\n  - /questions/agent-first')],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    try {
      assertWorkflowAgentContract(mutant);
      survivors.push(label);
    } catch {
      // Expected after exact public metadata is asserted.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-01 reuses the two governed first-party taxonomy sources without a visual', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const document = ledger.documents[workflowAgentArticlePath];
  assert.ok(document, `${workflowAgentArticlePath} source document`);
  assert.deepEqual(
    document.citations.map(({source_id: sourceId}) => sourceId),
    workflowAgentSourceIds,
  );
  assert.ok(document.citations.every(({usage_mode: usageMode}) => usageMode === 'facts-summary'));
  assert.equal(document.citations.filter(({manifest_primary: primary}) => primary).length, 1);
  assert.ok(document.citations.every(({roles}) =>
    roles.includes('definition') && roles.includes('method')));
  assert.ok(
    document.citations.every(({roles}) => !roles.includes('illustration')),
    'no AGT-P-01 illustration citation',
  );

  const governedSources = workflowAgentSourceIds.map((sourceId) => {
    const source = ledger.sources.find(({id}) => id === sourceId);
    assert.ok(source, sourceId);
    assert.equal(source.tier, 'first-party', sourceId);
    assert.deepEqual(source.allowed_evidence_roles, ['definition', 'method'], sourceId);
    assert.match(source.usage_boundary, /does not|does not prove/u, sourceId);
    return source;
  });
  assert.deepEqual(governedSources.map(({canonical_locator: locator}) => locator), [
    'https://www.anthropic.com/engineering/building-effective-agents',
    'https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/',
  ]);

  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  for (const source of governedSources) {
    const result = health.results.find(({transport_locator: locator}) =>
      locator === source.transport_locator);
    assert.ok(result, `${source.id} existing health observation`);
    assert.deepEqual(result.source_ids, [source.id]);
    assert.equal(result.review_status, 'healthy');
  }
});

test('Agentic RAG Mermaid parser preserves legal chained edges', () => {
  const graph = parseAgenticRagMermaid(
    'flowchart TB\n    FORM_QUERY["形成查询"] --> RETRIEVE["检索"] --> READ_ATTRIBUTE["读取与归因"]',
  );
  assert.deepEqual(graph.edges, [
    ['FORM_QUERY', 'RETRIEVE', null],
    ['RETRIEVE', 'READ_ATTRIBUTE', null],
  ]);
  assert.deepEqual(graph.labelsById, new Map([
    ['FORM_QUERY', ['形成查询']],
    ['RETRIEVE', ['检索']],
    ['READ_ATTRIBUTE', ['读取与归因']],
  ]));
});

test('AGT-P-02 publishes the exact evidence-bounded Agentic RAG contract', () => {
  assert.ok(existsSync(agenticRagArticlePath), `Missing ${agenticRagArticlePath}`);
  assertAgenticRagContract(readFileSync(agenticRagArticlePath, 'utf8'));
});

test('AGT-P-02 comparison table rejects structural, semantic, and hidden-copy mutations', () => {
  assert.ok(existsSync(agenticRagArticlePath), `Missing ${agenticRagArticlePath}`);
  const source = readFileSync(agenticRagArticlePath, 'utf8');
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(`| ${agenticRagComparisonHeader.join(' | ')} |`);
  assert.notEqual(headerIndex, -1, 'Agentic RAG comparison table header fixture');
  const mutateCell = (rowIndex, columnIndex, replacement) => {
    const candidate = [...lines];
    const lineIndex = headerIndex + 2 + rowIndex;
    const cells = physicalGfmCells(candidate[lineIndex]);
    cells[columnIndex] = replacement;
    candidate[lineIndex] = `| ${cells.join(' | ')} |`;
    return candidate.join('\n');
  };
  const mutations = [];
  for (let rowIndex = 0; rowIndex < agenticRagComparisonCells.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < agenticRagComparisonHeader.length; columnIndex += 1) {
      mutations.push([
        `empty comparison row ${rowIndex + 1} column ${columnIndex + 1}`,
        mutateCell(rowIndex, columnIndex, ''),
      ], [
        `wrong comparison row ${rowIndex + 1} column ${columnIndex + 1}`,
        mutateCell(rowIndex, columnIndex, '非空但错误'),
      ]);
    }
  }
  mutations.push([
    'hidden exact cell backs wrong visible semantics',
    mutateCell(
      0,
      2,
      `错误控制路径<span hidden>${agenticRagComparisonCells[0][2]}</span>`,
    ),
  ], [
    'extra physical column',
    source
      .replace(
        `| ${agenticRagComparisonHeader.join(' | ')} |`,
        `| ${agenticRagComparisonHeader.join(' | ')} | 冗余 |`,
      )
      .replace('| --- | --- | --- |', '| --- | --- | --- | --- |'),
  ]);

  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.throws(() => assertAgenticRagContract(mutant), undefined, label);
  }
});

test('AGT-P-02 requires one root-visible Mermaid and rejects topology bypasses fail closed', () => {
  assert.ok(existsSync(agenticRagArticlePath), `Missing ${agenticRagArticlePath}`);
  const source = readFileSync(agenticRagArticlePath, 'utf8');
  const [mermaid] = rootMermaidCodeBlocks(source);
  assert.ok(mermaid, 'Agentic RAG Mermaid fixture');
  const fence = `\`\`\`mermaid\n${mermaid}\n\`\`\``;
  const bypassFence = `\`\`\`mermaid
flowchart TB
    FORM_QUERY["形成查询"] --> ANSWER["回答"]
\`\`\``;
  const mutations = [
    ['zero root-visible Mermaid', source.replace(fence, '')],
    ['multiple root-visible Mermaid', `${source}\n\n${bypassFence}\n`],
    ['only compliant Mermaid hidden in comment', source.replace(fence, `{/*\n${fence}\n*/}`)],
    ['only compliant Mermaid hidden in JSX', source.replace(fence, `<div hidden>\n\n${fence}\n\n</div>`)],
    ['answer bypasses sufficiency', source.replace(
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]',
      'FORM_QUERY["形成查询"] --> ANSWER["回答"]',
    )],
    ['budget gate bypassed', source.replace(
      'SUFFICIENCY -->|证据不足| BUDGET_GATE["预算门"]',
      'SUFFICIENCY -->|证据不足| REFORMULATE["改写或扩展查询"]',
    )],
    ['human clarification bypasses the budget gate', source.replace(
      'HUMAN_CLARIFY -->|已澄清并恢复| BUDGET_GATE',
      'HUMAN_CLARIFY -->|已澄清并恢复| FORM_QUERY',
    )],
    ['human clarification timeout bypasses refusal', source.replace(
      'HUMAN_CLARIFY -->|超时或无法澄清| REFUSE',
      'HUMAN_CLARIFY -->|超时后继续| FORM_QUERY',
    )],
    ['decoy stable identity', source.replace(
      'READ_ATTRIBUTE --> SUFFICIENCY["证据充分性评估"]',
      'READ_ATTRIBUTE --> FAKE_SUFFICIENCY["证据充分性评估"]',
    )],
    ['chained answer bypass', source.replace(
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]',
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"] --> ANSWER',
    )],
    ['alternate solid connector bypass', source.replace(
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]',
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]\n    RETRIEVE ==> ANSWER',
    )],
    ['alternate dotted connector bypass', source.replace(
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]',
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]\n    RETRIEVE -.-> ANSWER',
    )],
    ['alternate bidirectional connector bypass', source.replace(
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]',
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]\n    RETRIEVE <--> ANSWER',
    )],
    ['alternate circle connector bypass', source.replace(
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]',
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]\n    RETRIEVE --o ANSWER',
    )],
    ['alternate cross connector bypass', source.replace(
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]',
      'FORM_QUERY["形成查询"] --> RETRIEVE["检索"]\n    RETRIEVE --x ANSWER',
    )],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.doesNotThrow(
      () => markdownParser.parse(extractMarkdownBody(mutant)),
      `${label} fixture remains valid MDX`,
    );
    try {
      assertAgenticRagContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: visibility, cardinality, grammar, stable identity, and bypass mutants fail.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-02 ignores a nested hidden Mermaid when the root topology remains', () => {
  const source = readFileSync(agenticRagArticlePath, 'utf8');
  const hiddenBypass = `<div hidden>\n\n\`\`\`mermaid
flowchart TB
    FORM_QUERY["形成查询"] --> ANSWER["回答"]
\`\`\`\n\n</div>`;
  const mutant = `${source}\n\n${hiddenBypass}\n`;
  assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(mutant)));
  assert.doesNotThrow(() => assertAgenticRagContract(mutant));
});

test('AGT-P-02 registers four primary papers and one discovery-only survey', () => {
  assert.ok(existsSync(agenticRagArticlePath), `Missing ${agenticRagArticlePath}`);
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const document = ledger.documents[agenticRagArticlePath];
  assert.ok(document, `${agenticRagArticlePath} source document`);
  assert.deepEqual(
    document.citations.map(({source_id: sourceId}) => sourceId),
    agenticRagSourceContracts.map(({id}) => id),
  );
  assert.ok(document.citations.every(({usage_mode: usageMode}) => usageMode === 'facts-summary'));
  assert.equal(document.citations.filter(({manifest_primary: primary}) => primary).length, 1);

  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  assertAgenticRagSourceRecords(ledger, health);

  const survey = ledger.sources.find(({id}) => id === 'src-agentic-rag-survey');
  assert.deepEqual(survey.allowed_evidence_roles, ['discovery']);
  assert.match(survey.usage_boundary, /taxonomy and discovery only/u);
  assert.match(survey.usage_boundary, /does not replace the original papers/u);
  const surveyCitation = document.citations.find(({source_id: sourceId}) =>
    sourceId === survey.id);
  assert.deepEqual(surveyCitation.roles, ['discovery']);
  assert.equal(surveyCitation.manifest_primary, false);
});

test('AGT-P-02 source identity and health contract rejects drift for every paper', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const sourceFieldMutants = [
    ['author', 'author_or_org', 'Drift author'],
    ['publication date', 'published_at', '2099-01-01'],
    ['version', 'version', 'Drift version'],
    ['license', 'license', 'LicenseRef-Drift'],
    ['tier', 'tier', 'secondary'],
    ['canonical URL', 'canonical_locator', 'https://example.test/drift'],
  ];
  for (const [label, field, value] of sourceFieldMutants) {
    const mutatedLedger = structuredClone(ledger);
    mutatedLedger.sources.find(({id}) => id === 'src-react-reasoning-acting-language-models')[field] = value;
    assert.throws(
      () => assertAgenticRagSourceRecords(mutatedLedger, health),
      assert.AssertionError,
      `ReAct reuse ${label} drift fails closed`,
    );
  }

  for (const [label, mutate] of [
    ['attempt timestamp', (result) => { result.last_attempt.at = '2099-01-01T00:00:00.000Z'; }],
    ['HTTP result', (result) => { result.last_attempt.http_status = 200; }],
    ['health outcome', (result) => { result.last_attempt.outcome = 'stale'; }],
    ['health review', (result) => { result.review_status = 'stale'; }],
  ]) {
    const mutatedHealth = structuredClone(health);
    mutate(mutatedHealth.results.find(({source_ids: sourceIds}) =>
      sourceIds.includes('src-agentic-rag-survey')));
    assert.throws(
      () => assertAgenticRagSourceRecords(ledger, mutatedHealth),
      assert.AssertionError,
      `survey ${label} drift fails closed`,
    );
  }
});
