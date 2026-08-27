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
const agenticRagMermaidAccTitle = 'Agentic RAG 证据充分性与安全终止循环';
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
const plannerExecutorArticlePath = 'content/patterns/agt-p-03-planner-executor.mdx';
const plannerExecutorSummary =
  '把规划权与执行权分开，以有界且版本化的计划、步骤前置条件、最小权限执行、结构化观察、陈旧计划检测和重规划预算约束开放任务，并在副作用结果未知时安全停止。';
const plannerExecutorTags = [
  '规划者–执行者',
  '版本化计划',
  '重规划',
  '最小权限',
  '安全停止',
];
const plannerExecutorMermaidAccTitle = '规划者–执行者版本化计划、重规划与安全停止控制流';
const plannerExecutorNodes = new Map([
  ['GOAL', ['智能体目标节点（Goal）']],
  ['PLANNER', ['规划者节点（Planner）']],
  ['VERSIONED_PLAN', ['版本化计划节点（Versioned plan）']],
  ['EXECUTOR', ['执行者节点（Executor）']],
  ['RESULT_VALIDATOR', ['结果验证者节点（Result validator）']],
  ['REPLAN_BUDGET', ['重规划预算门']],
  ['UNKNOWN_SIDE_EFFECT', ['未知副作用']],
  ['SAFE_STOP', ['安全停止']],
]);
const plannerExecutorEdges = [
  ['GOAL', 'PLANNER', null],
  ['PLANNER', 'VERSIONED_PLAN', null],
  ['VERSIONED_PLAN', 'EXECUTOR', null],
  ['EXECUTOR', 'RESULT_VALIDATOR', null],
  ['EXECUTOR', 'UNKNOWN_SIDE_EFFECT', '结果未知'],
  ['RESULT_VALIDATOR', 'VERSIONED_PLAN', '继续分支（continue）'],
  ['RESULT_VALIDATOR', 'REPLAN_BUDGET', '重规划分支（replan）'],
  ['RESULT_VALIDATOR', 'SAFE_STOP', '规划执行停止分支（stop）'],
  ['REPLAN_BUDGET', 'PLANNER', '预算可用'],
  ['REPLAN_BUDGET', 'SAFE_STOP', '预算耗尽'],
  ['UNKNOWN_SIDE_EFFECT', 'SAFE_STOP', null],
];
const plannerExecutorSourceIds = [
  'src-anthropic-building-effective-agents',
  'src-openai-practical-guide-building-agents',
  'src-github-27d330c0760f',
];
const plannerExecutorSourceContracts = [
  {
    id: 'src-anthropic-building-effective-agents',
    canonical_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    transport_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    expected_final_transport_locator:
      'https://www.anthropic.com/engineering/building-effective-agents',
    title: 'Building Effective Agents',
    author_or_org: 'Anthropic',
    published_at: '2024-12-19',
    version:
      'Official engineering article published 2024-12-19 and checked directly in a browser on 2026-08-26',
    source_kind: 'official-docs',
    tier: 'first-party',
    allowed_evidence_roles: ['definition', 'method'],
    license: 'LicenseRef-All-Rights-Reserved',
    usage_boundary:
      "Supports Anthropic's stated workflow/agent distinction and augmented-LLM building block; it does not establish the article's Harness/Loop ownership model or prove production outcomes.",
    health: {
      at: '2026-08-26T08:49:28.000Z',
      status: 200,
    },
  },
  {
    id: 'src-openai-practical-guide-building-agents',
    canonical_locator:
      'https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/',
    transport_locator:
      'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf?file=a-practical-guide-to-building-agents.pdf',
    expected_final_transport_locator:
      'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf?file=a-practical-guide-to-building-agents.pdf',
    title: 'A Practical Guide to Building Agents',
    author_or_org: 'OpenAI',
    published_at: null,
    version: 'Official web guide and PDF edition checked 2026-08-26',
    source_kind: 'official-docs',
    tier: 'first-party',
    allowed_evidence_roles: ['definition', 'method'],
    license: 'LicenseRef-All-Rights-Reserved',
    usage_boundary:
      "Supports OpenAI's stated agent control, tool-selection, loop, exit-condition and deterministic-fallback boundaries; it does not prove any implementation's production reliability.",
    health: {
      at: '2026-08-26T08:24:01.325Z',
      status: 200,
    },
  },
  {
    id: 'src-github-27d330c0760f',
    canonical_locator:
      'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/deterministic.py',
    transport_locator:
      'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/deterministic.py',
    expected_final_transport_locator:
      'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/deterministic.py',
    title: 'deterministic flow',
    author_or_org: 'OpenAI',
    published_at: null,
    version: 'Git commit 2fa463571e76dae8ff267622f1018eaf06ffeb9f',
    source_kind: 'source-code',
    tier: 'primary',
    allowed_evidence_roles: [
      'case-evidence',
      'comparison',
      'definition',
      'historical-context',
      'implementation',
      'learning',
      'method',
      'runtime-fact',
    ],
    license: 'MIT',
    usage_boundary:
      'Shows the implementation in “deterministic flow” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
    health: {
      at: '2026-08-25T12:07:24.531Z',
      status: 206,
    },
  },
];
const plannerExecutorDocumentContract = {
  reviewed_at: '2026-08-27',
  copyright_checks: [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ],
  citations: [
    {
      source_id: 'src-anthropic-building-effective-agents',
      citation_url: 'https://www.anthropic.com/engineering/building-effective-agents',
      roles: ['definition', 'method'],
      manifest_primary: true,
      usage_mode: 'facts-summary',
      attribution_note: 'Building Effective Agents, Anthropic',
      modification_note:
        'Original Chinese synthesis of planning and orchestration boundaries; no source prose, examples, structure, taxonomy layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-openai-practical-guide-building-agents',
      citation_url:
        'https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/',
      roles: ['definition', 'method'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'A Practical Guide to Building Agents, OpenAI',
      modification_note:
        'Original Chinese synthesis of agent control, tool-selection, loop, exit-condition and incremental adoption boundaries; no source prose, examples, code, structure, taxonomy layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-27d330c0760f',
      citation_url:
        'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/deterministic.py',
      roles: ['implementation'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'deterministic flow, OpenAI',
      modification_note:
        'Bounded implementation-evidence summary of the fixed code example; no code, prompt, output, example task, control structure or repository layout copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
  ],
};
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

function readerVisibleMermaidCodeBlocks(source) {
  const ast = markdownParser.parse(extractMarkdownBody(source));
  assert.equal(ast.type, 'root', 'MDX document root');
  assert.ok(Array.isArray(ast.children), 'MDX document root children');
  const mermaidBlocks = [];
  const visit = (node, parent = null) => {
    assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
    if (node.type === 'code' && node.lang === 'mermaid') {
      assert.equal(typeof node.value, 'string');
      assert.notEqual(node.value.trim(), '');
      mermaidBlocks.push({
        value: node.value,
        rootDirect: parent?.type === 'root',
      });
      return;
    }
    if (workflowAgentInvisibleAstTypes.has(node.type)) return;
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (isReaderHiddenJsx(node) || !isWorkflowAgentContainer(node)) return;
    }
    for (const child of node.children ?? []) visit(child, node);
  };
  visit(ast);
  return mermaidBlocks;
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
  let accTitle = null;
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
    if (statement.startsWith('accTitle:')) {
      assert.equal(accTitle, null, 'Agentic RAG Mermaid has one accTitle declaration');
      accTitle = statement.slice('accTitle:'.length).trim();
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
  assert.equal(accTitle, agenticRagMermaidAccTitle, 'Agentic RAG Mermaid exact accessible title');
  return {
    labelsById: new Map([...labelsById].map(([id, labels]) => [id, [...labels].sort()])),
    edges,
  };
}

function parsePlannerExecutorMermaid(mermaid) {
  const labelsById = new Map();
  const edges = [];
  let headerSeen = false;
  let accTitle = null;
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
    if (statement.startsWith('accTitle:')) {
      assert.equal(accTitle, null, 'Planner–Executor Mermaid has one accTitle declaration');
      accTitle = statement.slice('accTitle:'.length).trim();
      continue;
    }
    assert.match(statement, edgeStatement, `unparsed Planner–Executor Mermaid: ${line}`);
    const parts = statement.split(/\s*-->(?:\|([^|\n]+)\|)?\s*/u);
    const nodeSegments = [];
    const edgeLabels = [];
    for (let index = 0; index < parts.length; index += 2) {
      nodeSegments.push(parts[index]);
      if (index + 1 < parts.length) edgeLabels.push(parts[index + 1] ?? null);
    }
    const nodeIds = nodeSegments.map((segment) => {
      const match = segment.match(nodeSegment);
      assert.ok(match, `unparsed Planner–Executor node: ${segment}`);
      const [, id, label] = match;
      if (label !== undefined) {
        const knownLabels = labelsById.get(id) ?? new Set();
        knownLabels.add(label);
        labelsById.set(id, knownLabels);
      }
      return id;
    });
    for (let index = 1; index < nodeIds.length; index += 1) {
      edges.push([nodeIds[index - 1], nodeIds[index], edgeLabels[index - 1]]);
    }
  }
  assert.ok(headerSeen, 'Planner–Executor Mermaid flowchart TB header');
  assert.equal(
    accTitle,
    plannerExecutorMermaidAccTitle,
    'Planner–Executor Mermaid exact accessible title',
  );
  return {
    labelsById: new Map([...labelsById].map(([id, labels]) => [id, [...labels].sort()])),
    edges,
  };
}

function assertPlannerExecutorContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.title, '规划者–执行者（Planner–Executor）：用版本化计划约束重规划');
  assert.equal(metadata.topic_id, 'AGT-P-03');
  assert.equal(metadata.slug, '/patterns/agt-p-03');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'advanced');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, ['agent-loop', 'planner-executor']);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, ['reliability', 'safety', 'operability']);
  assert.deepEqual(metadata.tags, plannerExecutorTags);
  assert.equal(metadata.summary, plannerExecutorSummary);
  assert.deepEqual(metadata.depends_on, ['AGT-C-03']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-03',
    'AGT-P-01',
    'AGT-P-04',
    'AGT-P-05',
    'AGT-P-07',
    'AGT-P-08',
  ]);
  assert.deepEqual(metadata.related_cases, [
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

  const mermaidBlocks = readerVisibleMermaidCodeBlocks(source);
  assert.equal(mermaidBlocks.length, 1, 'exactly one reader-visible Planner–Executor Mermaid');
  assert.equal(mermaidBlocks[0].rootDirect, true, 'Planner–Executor Mermaid remains root-direct');
  const graph = parsePlannerExecutorMermaid(mermaidBlocks[0].value);
  assert.deepEqual(graph.labelsById, plannerExecutorNodes);
  assert.deepEqual(graph.edges, plannerExecutorEdges);
  assert.deepEqual(
    graph.edges.filter(([, target]) => target === 'SAFE_STOP'),
    [
      ['RESULT_VALIDATOR', 'SAFE_STOP', '规划执行停止分支（stop）'],
      ['REPLAN_BUDGET', 'SAFE_STOP', '预算耗尽'],
      ['UNKNOWN_SIDE_EFFECT', 'SAFE_STOP', null],
    ],
    'all terminal paths converge on the safe stop owner',
  );

  const visible = parseMdxVisibleCopy(source, plannerExecutorArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  for (const contract of [
    /计划[^。\n]{0,100}(?:不是|不等于)[^。\n]{0,100}(?:权威任务状态|任务真相)/u,
    /有界计划规模/u,
    /步骤前置条件/u,
    /执行者[^。\n]{0,100}最小权限/u,
    /观察模式/u,
    /陈旧计划检测/u,
    /重规划预算/u,
    /未知副作用[^。\n]{0,100}(?:停止|故障关闭)/u,
    /控制所有者/u,
    /状态所有者/u,
    /终止责任/u,
    /失败[^。\n]{0,160}恢复/u,
    /确定性工作流/u,
    /实现证据[^。\n]{0,160}(?:不证明|不能证明)[^。\n]{0,100}生产/u,
    /分类[^。\n]{0,100}(?:不是|不等于)行业标准/u,
  ]) assert.match(visible, contract);
}

function assertPlannerExecutorSourceContract(ledger, health) {
  const document = ledger.documents[plannerExecutorArticlePath];
  assert.ok(document, `${plannerExecutorArticlePath} source document`);
  assert.deepEqual(document, plannerExecutorDocumentContract);
  assert.deepEqual(
    document.citations.map(({source_id: sourceId}) => sourceId),
    plannerExecutorSourceIds,
  );

  for (const contract of plannerExecutorSourceContracts) {
    const source = ledger.sources.find(({id}) => id === contract.id);
    assert.ok(source, contract.id);
    assert.deepEqual(
      {
        id: source.id,
        canonical_locator: source.canonical_locator,
        transport_locator: source.transport_locator,
        expected_final_transport_locator: source.expected_final_transport_locator,
        title: source.title,
        author_or_org: source.author_or_org,
        published_at: source.published_at,
        version: source.version,
        source_kind: source.source_kind,
        tier: source.tier,
        allowed_evidence_roles: source.allowed_evidence_roles,
        license: source.license,
        usage_boundary: source.usage_boundary,
      },
      {
        id: contract.id,
        canonical_locator: contract.canonical_locator,
        transport_locator: contract.transport_locator,
        expected_final_transport_locator: contract.expected_final_transport_locator,
        title: contract.title,
        author_or_org: contract.author_or_org,
        published_at: contract.published_at,
        version: contract.version,
        source_kind: contract.source_kind,
        tier: contract.tier,
        allowed_evidence_roles: contract.allowed_evidence_roles,
        license: contract.license,
        usage_boundary: contract.usage_boundary,
      },
      `${contract.id} governed identity and evidence boundary`,
    );

    const observation = health.results.find(({source_ids: sourceIds}) =>
      sourceIds.includes(contract.id));
    assert.ok(observation, `${contract.id} health observation`);
    assert.deepEqual(
      {
        transport_locator: observation.transport_locator,
        source_ids: observation.source_ids,
        last_attempt: observation.last_attempt,
        last_success: observation.last_success,
        review_status: observation.review_status,
      },
      {
        transport_locator: contract.transport_locator,
        source_ids: [contract.id],
        last_attempt: {
          at: contract.health.at,
          outcome: 'healthy',
          final_transport_locator: contract.transport_locator,
          http_status: contract.health.status,
          login_wall_detected: false,
          redirects: [],
        },
        last_success: {
          at: contract.health.at,
          outcome: 'healthy',
          final_transport_locator: contract.transport_locator,
          http_status: contract.health.status,
          login_wall_detected: false,
        },
        review_status: 'healthy',
      },
      `${contract.id} exact current health observation`,
    );
  }
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

  const mermaidBlocks = readerVisibleMermaidCodeBlocks(source);
  assert.equal(mermaidBlocks.length, 1, 'exactly one reader-visible Agentic RAG Mermaid');
  assert.equal(mermaidBlocks[0].rootDirect, true, 'the unique Mermaid remains root-direct for stable layout');
  const graph = parseAgenticRagMermaid(mermaidBlocks[0].value);
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
    `flowchart TB\n    accTitle: ${agenticRagMermaidAccTitle}\n    FORM_QUERY["形成查询"] --> RETRIEVE["检索"] --> READ_ATTRIBUTE["读取与归因"]`,
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

test('AGT-P-02 requires one reader-visible root-direct Mermaid and rejects topology bypasses fail closed', () => {
  assert.ok(existsSync(agenticRagArticlePath), `Missing ${agenticRagArticlePath}`);
  const source = readFileSync(agenticRagArticlePath, 'utf8');
  const [{value: mermaid}] = readerVisibleMermaidCodeBlocks(source);
  assert.ok(mermaid, 'Agentic RAG Mermaid fixture');
  const fence = `\`\`\`mermaid\n${mermaid}\n\`\`\``;
  const bypassFence = `\`\`\`mermaid
flowchart TB
    FORM_QUERY["形成查询"] --> ANSWER["回答"]
\`\`\``;
  const mutations = [
    ['zero reader-visible Mermaid', source.replace(fence, '')],
    ['multiple root-visible Mermaid', `${source}\n\n${bypassFence}\n`],
    ['extra nested reader-visible Mermaid', `${source}\n\n<div>\n${bypassFence}\n</div>\n`],
    ['only nested reader-visible Mermaid', source.replace(fence, `<div>\n${fence}\n</div>`)],
    ['only compliant Mermaid hidden in comment', source.replace(fence, `{/*\n${fence}\n*/}`)],
    ['only compliant Mermaid hidden in JSX', source.replace(fence, `<div hidden>\n\n${fence}\n\n</div>`)],
    ['Mermaid accTitle removed', source.replace(`  accTitle: ${agenticRagMermaidAccTitle}\n`, '')],
    ['Mermaid accTitle drifted', source.replace(
      `accTitle: ${agenticRagMermaidAccTitle}`,
      'accTitle: 错误图表名称',
    )],
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

test('AGT-P-03 publishes the exact versioned Planner–Executor contract', () => {
  assert.ok(existsSync(plannerExecutorArticlePath), `Missing ${plannerExecutorArticlePath}`);
  assertPlannerExecutorContract(readFileSync(plannerExecutorArticlePath, 'utf8'));
});

test('AGT-P-03 rejects summary and ordered-tag metadata drift', () => {
  const source = readFileSync(plannerExecutorArticlePath, 'utf8');
  const metadataMutants = [
    ['summary drift', source.replace(
      'summary: 把规划权与执行权分开，以有界且版本化的计划、步骤前置条件、最小权限执行、结构化观察、陈旧计划检测和重规划预算约束开放任务，并在副作用结果未知时安全停止。',
      'summary: 结构有效但完全错误的摘要。',
    )],
    ['tag missing', source.replace('  - 安全停止\nsummary:', 'summary:')],
    ['tag reorder', source.replace(
      '  - 规划者–执行者\n  - 版本化计划',
      '  - 版本化计划\n  - 规划者–执行者',
    )],
    ['tag drift', source.replace('  - 最小权限\n', '  - 错误标签\n')],
  ];
  const survivors = [];
  for (const [label, mutant] of metadataMutants) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.doesNotThrow(() => parseFrontMatter(mutant), `${label} remains valid front matter`);
    try {
      assertPlannerExecutorContract(mutant);
      survivors.push(label);
    } catch {
      // Expected after the exact metadata contract is locked.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-03 rejects hidden, duplicate, unnamed, and fail-open Mermaid mutations', () => {
  assert.ok(existsSync(plannerExecutorArticlePath), `Missing ${plannerExecutorArticlePath}`);
  const source = readFileSync(plannerExecutorArticlePath, 'utf8');
  const [{value: mermaid}] = readerVisibleMermaidCodeBlocks(source);
  assert.ok(mermaid, 'Planner–Executor Mermaid fixture');
  const fence = `\`\`\`mermaid\n${mermaid}\n\`\`\``;
  const bypassFence = `\`\`\`mermaid
flowchart TB
    GOAL["Goal"] --> SAFE_STOP["Safe stop"]
\`\`\``;
  const mutations = [
    ['zero reader-visible Mermaid', source.replace(fence, '')],
    ['duplicate reader-visible Mermaid', `${source}\n\n${bypassFence}\n`],
    ['only nested Mermaid', source.replace(fence, `<div>\n${fence}\n</div>`) ],
    ['only hidden Mermaid', source.replace(fence, `<div hidden>\n\n${fence}\n\n</div>`) ],
    ['accessible name removed', source.replace(
      `    accTitle: ${plannerExecutorMermaidAccTitle}\n`,
      '',
    )],
    ['continue bypasses the versioned plan', source.replace(
      'RESULT_VALIDATOR -->|继续分支（continue）| VERSIONED_PLAN',
      'RESULT_VALIDATOR -->|继续分支（continue）| EXECUTOR',
    )],
    ['replan bypasses its budget', source.replace(
      'RESULT_VALIDATOR -->|重规划分支（replan）| REPLAN_BUDGET["重规划预算门"]',
      'RESULT_VALIDATOR -->|重规划分支（replan）| PLANNER',
    )],
    ['unknown side effect resumes execution', source.replace(
      'UNKNOWN_SIDE_EFFECT --> SAFE_STOP',
      'UNKNOWN_SIDE_EFFECT --> EXECUTOR',
    )],
    ['budget exhaustion resumes planning', source.replace(
      'REPLAN_BUDGET -->|预算耗尽| SAFE_STOP',
      'REPLAN_BUDGET -->|预算耗尽| PLANNER',
    )],
    ['alternate connector creates a stop bypass', source.replace(
      'GOAL["智能体目标节点（Goal）"] --> PLANNER["规划者节点（Planner）"]',
      'GOAL["智能体目标节点（Goal）"] --> PLANNER["规划者节点（Planner）"]\n    EXECUTOR -.-> SAFE_STOP',
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
      assertPlannerExecutorContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: visibility, cardinality, grammar, stable identity, and topology mutants fail.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-03 reuses governed pattern sources and bounds the deterministic example', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  assertPlannerExecutorSourceContract(ledger, health);
});

test('AGT-P-03 rejects source identity, evidence, health, and document-boundary drift', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const mutateSource = (sourceId, field, value) => {
    const mutant = structuredClone(ledger);
    const source = mutant.sources.find(({id}) => id === sourceId);
    assert.ok(source, `${sourceId} mutation fixture`);
    source[field] = value;
    return mutant;
  };
  const mutateCitation = (sourceId, field, value) => {
    const mutant = structuredClone(ledger);
    const citation = mutant.documents[plannerExecutorArticlePath].citations
      .find(({source_id: citationSourceId}) => citationSourceId === sourceId);
    assert.ok(citation, `${sourceId} citation mutation fixture`);
    citation[field] = value;
    return mutant;
  };
  const mutations = [
    ['Anthropic identity drift', mutateSource(
      'src-anthropic-building-effective-agents', 'title', 'Wrong source title',
    ), health],
    ['OpenAI canonical URL drift', mutateSource(
      'src-openai-practical-guide-building-agents',
      'canonical_locator',
      'https://example.com/wrong-guide',
    ), health],
    ['OpenAI transport URL drift', mutateSource(
      'src-openai-practical-guide-building-agents',
      'transport_locator',
      'https://example.com/wrong-transport',
    ), health],
    ['OpenAI expected-final URL drift', mutateSource(
      'src-openai-practical-guide-building-agents',
      'expected_final_transport_locator',
      'https://example.com/wrong-final',
    ), health],
    ['OpenAI tier drift', mutateSource(
      'src-openai-practical-guide-building-agents', 'tier', 'secondary',
    ), health],
    ['OpenAI license drift', mutateSource(
      'src-openai-practical-guide-building-agents', 'license', 'CC-BY-4.0',
    ), health],
    ['Anthropic allowed-role drift', mutateSource(
      'src-anthropic-building-effective-agents', 'allowed_evidence_roles', ['definition'],
    ), health],
    ['Anthropic unsafe usage boundary', mutateSource(
      'src-anthropic-building-effective-agents',
      'usage_boundary',
      'This taxonomy is the industry standard and proves production outcomes.',
    ), health],
    ['SDK fixed commit drift', mutateSource(
      'src-github-27d330c0760f', 'version', 'Git commit deadbeef',
    ), health],
    ['citation URL drift', mutateCitation(
      'src-openai-practical-guide-building-agents',
      'citation_url',
      'https://example.com/wrong-citation',
    ), health],
    ['citation role drift', mutateCitation(
      'src-openai-practical-guide-building-agents', 'roles', ['definition'],
    ), health],
    ['citation usage-mode drift', mutateCitation(
      'src-openai-practical-guide-building-agents', 'usage_mode', 'quotation',
    ), health],
    ['citation attribution drift', mutateCitation(
      'src-openai-practical-guide-building-agents',
      'attribution_note',
      'Wrong attribution',
    ), health],
    ['unexpected attribution-required field', mutateCitation(
      'src-openai-practical-guide-building-agents', 'attribution_required', false,
    ), health],
    ['citation modification boundary drift', mutateCitation(
      'src-anthropic-building-effective-agents',
      'modification_note',
      'Copied source prose, examples, structure, taxonomy layout and diagrams.',
    ), health],
    ['document copyright drift', (() => {
      const mutant = structuredClone(ledger);
      mutant.documents[plannerExecutorArticlePath].copyright_checks = ['original-structure'];
      return mutant;
    })(), health],
    ['document review date drift', (() => {
      const mutant = structuredClone(ledger);
      mutant.documents[plannerExecutorArticlePath].reviewed_at = '2026-08-26';
      return mutant;
    })(), health],
    ['quotation boundary drift', mutateCitation(
      'src-github-27d330c0760f', 'excerpt', 'Copied code excerpt',
    ), health],
    ['quotation review drift', mutateCitation(
      'src-github-27d330c0760f', 'quotation_reviewed', true,
    ), health],
    ['health final URL drift', ledger, (() => {
      const mutant = structuredClone(health);
      const result = mutant.results.find(({source_ids: sourceIds}) =>
        sourceIds.includes('src-openai-practical-guide-building-agents'));
      result.last_attempt.final_transport_locator = 'https://example.com/wrong-final';
      return mutant;
    })()],
  ];
  const survivors = [];
  for (const [label, ledgerMutant, healthMutant] of mutations) {
    try {
      assertPlannerExecutorSourceContract(ledgerMutant, healthMutant);
      survivors.push(label);
    } catch {
      // Expected after every governed field and observation is locked.
    }
  }
  assert.deepEqual(survivors, []);
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
