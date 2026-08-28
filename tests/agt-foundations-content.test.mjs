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
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {parseBacklogTopics} from '../scripts/backlog-topics.mjs';
import {knowledgeTypeContracts} from '../scripts/content-schema.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const articlePath = 'content/concepts/agt-c-01-agent-system-boundary.mdx';
const harnessArticlePath = 'content/concepts/agt-c-02-agent-harness.mdx';
const loopArticlePath = 'content/concepts/agt-c-03-agent-loop.mdx';
const informationLifecycleArticlePath =
  'content/concepts/agt-c-04-context-memory-state-checkpoint.mdx';
const actionBoundaryArticlePath =
  'content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx';
const qualityGovernanceArticlePath =
  'content/concepts/agt-c-06-trace-evaluation-guardrail.mdx';
const reactApprovedLocator = 'https://arxiv.org/abs/2210.03629';
const drawioPath = 'diagrams/agt-c-01-agent-system-boundary.drawio';
const svgPath = 'static/img/diagrams/agt-c-01-agent-system-boundary.svg';
const requiredDiagramLabels = [
  'User / Event',
  'Policy & Routing',
  'Agent Harness',
  'Agent Loop',
  'Knowledge / Retrieval',
  'Tools / Sandbox',
  'State',
  'Memory',
  'Checkpoint',
  'Trace / Evaluation / Guardrail',
];
const requiredClaims = [
  '模型生成候选输出，不拥有任务控制权',
  '增强型大语言模型增加检索、工具或记忆能力，但不必拥有循环',
  '工作流的步骤和分支主要由代码预先定义',
  '智能体让模型在受约束边界内选择下一步动作',
  '自治程度是连续谱，不是四个互斥产品类别',
];
const requiredTerminologyContracts = [
  {
    id: 'agent-harness', canonical_zh: '智能体运行框架', english: 'Agent Harness', acronym: null,
    kind: 'translated-term', first_use: '智能体运行框架（Agent Harness）', subsequent_use: ['智能体运行框架'],
    allowed_aliases: [], forbidden_aliases: ['Agent Harness', 'Harness'],
    note: '包住并约束智能体循环的运行时与治理责任边界。', order: 1810,
  },
  {
    id: 'agent-loop', canonical_zh: '智能体循环', english: 'Agent Loop', acronym: null,
    kind: 'translated-term', first_use: '智能体循环（Agent Loop）', subsequent_use: ['智能体循环'],
    allowed_aliases: [], forbidden_aliases: ['Agent Loop', 'Loop'],
    note: '智能体在受约束边界内反复计划、行动、观察、评估并终止任务的推进机制。', order: 1820,
  },
  {
    id: 'checkpoint', canonical_zh: '执行检查点', english: 'Checkpoint', acronym: null,
    kind: 'translated-term', first_use: '执行检查点（Checkpoint）', subsequent_use: ['执行检查点'],
    allowed_aliases: [], forbidden_aliases: ['Checkpoint'],
    note: '记录已确认的可恢复执行位置，不等同于副作用已生效的证明。', order: 1830,
  },
  {
    id: 'sandbox', canonical_zh: '隔离沙箱', english: 'Sandbox', acronym: null,
    kind: 'translated-term', first_use: '隔离沙箱（Sandbox）', subsequent_use: ['隔离沙箱'],
    allowed_aliases: [], forbidden_aliases: ['Sandbox'],
    note: '在受限网络、文件、凭据与资源边界内执行工具的隔离环境。', order: 1840,
  },
  {
    id: 'augmented-large-language-model', canonical_zh: '增强型大语言模型', english: 'Augmented LLM', acronym: null,
    kind: 'translated-term', first_use: '增强型大语言模型（Augmented LLM）', subsequent_use: ['增强型大语言模型'],
    allowed_aliases: [], forbidden_aliases: ['Augmented LLM'],
    note: '在模型调用上增加检索、工具或记忆能力，但不必拥有多步循环。', order: 1850,
  },
  {
    id: 'agentic-rag', canonical_zh: '智能体检索增强生成', english: 'Agentic RAG', acronym: null,
    kind: 'translated-term', first_use: '智能体检索增强生成（Agentic RAG）', subsequent_use: ['智能体检索增强生成'],
    allowed_aliases: [], forbidden_aliases: ['Agentic RAG'],
    note: '智能体循环围绕证据充分性反复检索、阅读、评估并作答或拒答的具象。', order: 1860,
  },
];
const harnessResponsibilities = [
  '运行时',
  '上下文装配',
  '工具注册与协议',
  '权限与沙箱',
  '检查点与恢复',
  '追踪与评测钩子',
];
const harnessSourceContracts = [
  {
    id: 'src-anthropic-effective-harnesses-long-running-agents',
    title: 'Effective harnesses for long-running agents',
    locator: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents',
  },
  {
    id: 'src-anthropic-harness-design-long-running-apps',
    title: 'Harness design for long-running application development',
    locator: 'https://www.anthropic.com/engineering/harness-design-long-running-apps',
  },
  {
    id: 'src-anthropic-managed-agents',
    title: 'Scaling Managed Agents: Decoupling the brain from the hands',
    locator: 'https://www.anthropic.com/engineering/managed-agents',
  },
];
const loopPhases = [
  ['PLAN', 'Plan', '计划'],
  ['ACT', 'Act', '行动'],
  ['OBSERVE', 'Observe', '观察'],
  ['EVALUATE', 'Evaluate', '评估'],
  ['TERMINATE', 'Terminate', '终止'],
];
const loopTerminalOutcomes = [
  ['SUCCESS', 'success', '成功'],
  ['FAILURE', 'failure', '失败'],
  ['BUDGET_EXHAUSTED', 'budget exhausted', '预算耗尽'],
  ['HUMAN_STOP', 'human stop', '人工停止'],
];
const loopEdges = [
  'PLAN->ACT',
  'ACT->OBSERVE',
  'OBSERVE->EVALUATE',
  'EVALUATE->PLAN',
  'EVALUATE->TERMINATE',
  'TERMINATE->SUCCESS',
  'TERMINATE->FAILURE',
  'TERMINATE->BUDGET_EXHAUSTED',
  'TERMINATE->HUMAN_STOP',
];
const informationLifecycleRows = [
  '上下文（Context）',
  '记忆（Memory）',
  '状态（State）',
  '执行检查点（Checkpoint）',
];
const informationLifecycleHeader = [
  '内容',
  '生命周期',
  '权威性',
  '写入者',
  '恢复用途',
];
const informationLifecycleCellContracts = [
  [
    /单次推理调用[\s\S]*重新装配、裁剪或替换/u,
    /继承各来源的权威性[\s\S]*看见不等于事实成立/u,
    /智能体运行框架按策略装配[\s\S]*用户[\s\S]*检索器[\s\S]*状态服务[\s\S]*工具/u,
    /状态、记忆和新鲜证据[\s\S]*重建当前窗口[\s\S]*不是恢复源/u,
  ],
  [
    /跨轮或跨任务保留[\s\S]*用途[\s\S]*同意[\s\S]*时效[\s\S]*删除策略/u,
    /个体化线索或经验[\s\S]*低于当前指令、显式状态和权威数据源/u,
    /用户确认、受控提取器或应用服务[\s\S]*模型只能提出候选记忆/u,
    /偏好和经验连续性[\s\S]*不决定任务进度或共享业务事实/u,
  ],
  [
    /任务或业务实体生命周期[\s\S]*显式转换演进/u,
    /经校验字段可成为任务事实[\s\S]*业务事实仍以其权威系统为准/u,
    /状态机、受权工具、应用服务或人工批准者/u,
    /已完成、待处理、失败和外部效果状态[\s\S]*驱动下一步/u,
  ],
  [
    /稳定执行边界生成[\s\S]*恢复窗口、审计或删除策略到期/u,
    /快照及位置有记录权威[\s\S]*不自动证明外部效果/u,
    /运行时或检查点器[\s\S]*提交协议/u,
    /执行位置和必要状态[\s\S]*模式、权限与外部效果/u,
  ],
];
const informationLifecycleSourceIds = [
  'src-docs-99e58642fe77',
  'src-docs-7dd57631bd24',
  'src-docs-8050933565ee',
];
const actionBoundaryHeader = [
  '动作级别',
  '外部效果',
  '权限与批准',
  '隔离与凭据',
  '重放与核对',
  '失败与恢复',
];
const actionBoundaryRows = [
  '只读（read）',
  '写入（write）',
  '破坏性（destructive）',
];
const actionBoundaryCellContracts = [
  [
    /不改变权威业务状态/u,
    /最小只读范围[\s\S]*默认拒绝/u,
    /只读凭据[\s\S]*网络与文件范围/u,
    /新鲜度[\s\S]*有界重试/u,
    /超时[\s\S]*不升级为已知失败/u,
  ],
  [
    /创建或修改[\s\S]*可补偿/u,
    /主体、资源、动作、范围与到期[\s\S]*风险决定批准/u,
    /窄权限凭据[\s\S]*不暴露平台主凭据/u,
    /稳定操作标识[\s\S]*传输请求标识[\s\S]*幂等[\s\S]*结果查询/u,
    /结果未知[\s\S]*先查询[\s\S]*补偿/u,
  ],
  [
    /删除、发布或不可逆外部效果/u,
    /不可逆副作用之前[\s\S]*人工批准[\s\S]*缺失或过期[\s\S]*拒绝/u,
    /一次性或短时凭据[\s\S]*撤销/u,
    /禁止盲目重试[\s\S]*权威回执或结果查询/u,
    /停止自动化[\s\S]*人工核对[\s\S]*补偿[\s\S]*吊销凭据/u,
  ],
];
const actionBoundaryNodes = new Map([
  ['INTENT', ['意图']],
  ['POLICY', ['策略']],
  ['APPROVAL', ['人工批准']],
  ['SANDBOX', ['隔离沙箱']],
  ['TOOL', ['工具']],
  ['AUTHORITY', ['权威系统']],
  ['RESULT_VERIFICATION', ['结果验证']],
  ['REJECTED', ['拒绝']],
  ['CONFIRMED', ['已确认']],
  ['UNKNOWN', ['未知 / 不匹配']],
]);
const actionBoundaryEdges = [
  'INTENT->POLICY',
  'POLICY->SANDBOX',
  'POLICY->APPROVAL',
  'POLICY->REJECTED',
  'APPROVAL->SANDBOX',
  'APPROVAL->REJECTED',
  'SANDBOX->TOOL',
  'TOOL->AUTHORITY',
  'AUTHORITY->RESULT_VERIFICATION',
  'RESULT_VERIFICATION->CONFIRMED',
  'RESULT_VERIFICATION->UNKNOWN',
];
const actionBoundarySourceIds = [
  'src-modelcontextprotocol-6a01ecb9df48',
  'src-github-3c46e2b98a84',
  'src-github-bc8615c2a73c',
  'src-saltzer-schroeder-protection-1975',
  'src-nist-sp-800-160-v1r1-2022',
  'src-aws-making-retries-safe-idempotent-apis-2020',
  'src-nist-ai-rmf-1-0',
];
const qualityResponsibilityHeader = [
  '机制',
  '唯一职责',
  '输入',
  '输出',
  '不能替代',
];
const qualityResponsibilityRows = [
  '追踪（Trace）',
  '评测（Evaluation）',
  '执行约束（Guardrail）',
];
const evaluationModeHeader = [
  '评测模式',
  '触发时点',
  '输入样本',
  '主要用途',
  '反馈路径',
  '失败边界',
];
const evaluationModeRows = ['离线评测（offline evaluation）', '在线评测（online evaluation）'];
const traceCorrelationFields = [
  'trace_id',
  'span_id',
  'parent_span_id',
  'task_id',
  'run_id',
  'agent_version',
  'model_version',
  'tool_name',
  'tool_version',
  'operation_id',
];
const qualityGovernanceSourceContracts = [
  {
    id: 'src-anthropic-demystifying-evals-ai-agents',
    title: 'Demystifying evals for AI agents',
    locator: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
    author: 'Anthropic',
    publishedAt: '2026-01-09',
    license: 'LicenseRef-All-Rights-Reserved',
    licenseEvidenceLocator: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
  },
  {
    id: 'src-opentelemetry-genai-agent-semconv',
    title: 'Semantic Conventions for GenAI agent and framework spans',
    locator: 'https://github.com/open-telemetry/semantic-conventions-genai/blob/56d6b11a02129319bf371083fa134b7ce989c976/docs/gen-ai/gen-ai-agent-spans.md',
    author: 'OpenTelemetry Authors',
    publishedAt: null,
    version: 'semantic-conventions-genai commit 56d6b11a02129319bf371083fa134b7ce989c976 checked on 2026-08-26; document status Development',
    license: 'Apache-2.0',
    licenseEvidenceLocator: 'https://github.com/open-telemetry/semantic-conventions-genai/blob/56d6b11a02129319bf371083fa134b7ce989c976/LICENSE',
  },
];

const registry = JSON.parse(
  readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'),
);
const backlog = readFileSync('docs/content-backlog.md', 'utf8');
const contentDocuments = await readContentDocuments('content');
const expectedFoundationAdjacency = new Map([
  ['AGT-C-01', ['AGT-C-02', 'AGT-C-03', 'AGT-P-01']],
  ['AGT-C-02', ['AGT-C-01', 'AGT-C-03', 'AGT-C-04', 'AGT-C-05', 'AGT-C-06', 'AGT-P-06', 'AGT-P-08']],
  ['AGT-C-03', ['AGT-C-01', 'AGT-C-02', 'AGT-C-04', 'AGT-C-05', 'AGT-C-06', 'AGT-P-01', 'AGT-P-02', 'AGT-P-03', 'AGT-P-04', 'AGT-P-05', 'AGT-P-06', 'AGT-P-07', 'AGT-P-08']],
  ['AGT-C-04', ['AGT-C-02', 'AGT-C-03', 'AGT-C-05', 'AGT-C-06', 'AGT-P-02', 'AGT-P-06', 'AGT-P-07', 'AGT-P-08']],
  ['AGT-C-05', ['AGT-C-02', 'AGT-C-03', 'AGT-C-04', 'AGT-C-06', 'AGT-P-08', 'PR-09', 'PR-10']],
  ['AGT-C-06', ['AGT-C-02', 'AGT-C-03', 'AGT-C-04', 'AGT-C-05', 'AGT-P-02', 'AGT-P-04', 'AGT-P-08', 'QA-08', 'PR-07']],
]);
const markdownParser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

function markdownTableRows(source, header) {
  const lines = source.split(/\r?\n/u);
  const index = lines.findIndex((line) => line === header);
  assert.notEqual(index, -1, `Missing table header: ${header}`);
  assert.match(lines[index + 1] ?? '', /^\|(?:\s*:?-{3,}:?\s*\|)+$/u);
  const rows = [];
  for (let cursor = index + 2; /^\|.*\|$/u.test(lines[cursor] ?? ''); cursor += 1) {
    rows.push(lines[cursor]);
  }
  return rows;
}

function nodeVisibleText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  return (node.children ?? []).map(nodeVisibleText).join('');
}

function markdownTables(source) {
  const tables = [];
  const visit = (node) => {
    if (node.type === 'table') {
      tables.push(node.children.map((row) =>
        row.children.map((cell) => nodeVisibleText(cell).replace(/\s+/gu, ' ').trim())));
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(markdownParser.parse(extractMarkdownBody(source)));
  return tables;
}

function rootMermaidCodeBlocks(source) {
  const root = markdownParser.parse(extractMarkdownBody(source));
  assert.equal(root.type, 'root', 'MDX document root');
  assert.ok(Array.isArray(root.children), 'MDX document root children');
  const blocks = [];
  for (const node of root.children) {
    assert.ok(
      node && typeof node === 'object' && typeof node.type === 'string',
      'unknown root MDX AST node',
    );
    if (node.type === 'code' && node.lang === 'mermaid') {
      assert.equal(typeof node.value, 'string', 'Mermaid code node value');
      assert.notEqual(node.value.trim(), '', 'Mermaid code node must not be empty');
      blocks.push(node.value);
    }
  }
  return blocks;
}

function visibleBodyRecords(source) {
  return parseMdxVisibleCopy(source, informationLifecycleArticlePath).blocks
    .map(({text}) => text.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
}

const qualityGovernanceVisibleHtmlContainers = new Set([
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
// Any custom component outside this explicit reader-visible set fails closed because
// its rendering and embedding behavior cannot be established from the MDX source.

const qualityGovernanceInvisibleAstTypes = new Set([
  'code',
  'definition',
  'html',
  'inlineCode',
  'mdxFlowExpression',
  'mdxTextExpression',
  'mdxjsEsm',
]);

function isQualityGovernanceContainer(node) {
  return node.name === null || qualityGovernanceVisibleHtmlContainers.has(node.name);
}

function visibleQualityGovernance(ast) {
  const text = (node) => {
    assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
    if (qualityGovernanceInvisibleAstTypes.has(node.type)) return '';
    if (node.type === 'text') return node.value;
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (isReaderHiddenJsx(node)) return '';
      if (!isQualityGovernanceContainer(node)) return '';
    }
    return (node.children ?? []).map(text).join('');
  };
  return ast.children.map(text)
    .map((value) => value.replace(/\s+/gu, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

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
  ) {
    return null;
  }
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
    ) {
      return null;
    }
    const key = property.key?.type === 'Identifier'
      ? property.key.name
      : property.key?.type === 'Literal' ? property.key.value : null;
    if (typeof key !== 'string') return null;
    if (!['string', 'number'].includes(typeof property.value.value)) return null;
    entries.push([key, String(property.value.value)]);
  }
  return entries;
}

function hasUnresolvedQualityGovernanceAttribute(node) {
  return (node.attributes ?? []).some((attribute) => {
    if (attribute.type !== 'mdxJsxAttribute') return true;
    if (attribute.name.toLowerCase() === 'style') {
      return staticStyleEntries(attribute) === null;
    }
    return !staticMdxJsxAttributeValue(attribute).known;
  });
}

function isReaderHiddenJsx(node) {
  if (hasUnresolvedQualityGovernanceAttribute(node)) return true;
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
      ) {
        return true;
      }
    }
  }
  return false;
}

function parseQualityGovernanceAst(source) {
  const body = extractMarkdownBody(source);
  const ast = markdownParser.parse(body);
  assert.equal(ast.type, 'root', 'AGT-C-06 MDX document root');
  assert.ok(Array.isArray(ast.children), 'AGT-C-06 MDX root children');
  return {ast, body};
}

function readerVisibleQualityGovernanceTables(ast) {
  const tables = [];
  const visit = (node) => {
    assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
    if (qualityGovernanceInvisibleAstTypes.has(node.type)) return;
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (isReaderHiddenJsx(node) || !isQualityGovernanceContainer(node)) return;
    }
    if (node.type === 'table') {
      tables.push({
        node,
        rows: node.children.map((row) =>
          row.children.map((cell) => nodeVisibleText(cell).replace(/\s+/gu, ' ').trim())),
      });
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return tables;
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

function assertPhysicalQualityTable(body, tableNode, columnCount, dataRowCount) {
  const startLine = tableNode.position?.start.line;
  const endLine = tableNode.position?.end.line;
  assert.ok(Number.isInteger(startLine) && Number.isInteger(endLine));
  const lines = body.split(/\r?\n/u).slice(startLine - 1, endLine);
  assert.equal(lines.length, dataRowCount + 2, 'physical header, delimiter, and data rows');
  for (const [rowIndex, line] of lines.entries()) {
    assert.equal(
      physicalGfmCells(line).length,
      columnCount,
      `physical table line ${rowIndex + 1} has exactly ${columnCount} cells`,
    );
  }
  assert.ok(
    physicalGfmCells(lines[1]).every((cell) => /^:?-{3,}:?$/u.test(cell)),
    'physical delimiter row contains only GFM delimiters',
  );
}

function assertNoQualityGovernanceVisuals(ast) {
  const embeddingAttributes = new Set(['data', 'poster', 'src', 'srcset']);
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
        'AGT-C-06 permits only non-rendering block comments as MDX expressions',
      );
    }
    assert.ok(
      node.type !== 'image' && node.type !== 'imageReference',
      'AGT-C-06 must not embed Markdown images',
    );
    assert.ok(
      node.type !== 'code'
        || typeof node.lang !== 'string'
        || node.lang.toLowerCase() !== 'mermaid',
      'AGT-C-06 must not embed Mermaid diagrams',
    );
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      assert.ok(
        isQualityGovernanceContainer(node),
        `AGT-C-06 permits only non-visual semantic HTML containers; found ${node.name}`,
      );
      for (const attribute of node.attributes ?? []) {
        assert.equal(
          attribute.type,
          'mdxJsxAttribute',
          'AGT-C-06 JSX spreads fail the no-visual contract closed',
        );
        const name = attribute.name.toLowerCase();
        assert.ok(
          !embeddingAttributes.has(name),
          `AGT-C-06 must not declare embedding attribute ${attribute.name}`,
        );
        if (name === 'style') {
          const entries = staticStyleEntries(attribute);
          assert.ok(entries, 'AGT-C-06 dynamic JSX style fails the no-visual contract closed');
          for (const [property, value] of entries) {
            const normalizedProperty = property.replace(/-/gu, '').toLowerCase();
            assert.ok(
              !['background', 'backgroundimage'].includes(normalizedProperty)
                || !/url\s*\(/iu.test(value),
              'AGT-C-06 must not embed any background URL',
            );
          }
        } else {
          assert.ok(
            staticMdxJsxAttributeValue(attribute).known,
            `AGT-C-06 unresolved ${attribute.name} attribute fails closed`,
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
      const style = node.value.match(/\bstyle\s*=\s*(['"])(.*?)\1/iu)?.[2] ?? '';
      assert.ok(
        !/background(?:-?image)?\s*:[\s\S]*url\s*\(/iu.test(style),
        'raw HTML visual background resource',
      );
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
}

test('agentic topic registry is exact and globally unique', () => {
  assert.equal(registry.schema_version, 1);
  assert.equal(registry.concepts.length, 6);
  assert.equal(registry.patterns.length, 8);
  assert.equal(registry.cases.length, 3);
  const ids = [...registry.concepts, ...registry.patterns].map(({id}) => id);
  assert.equal(new Set(ids).size, 14);
  assert.deepEqual(ids, [
    'AGT-C-01', 'AGT-C-02', 'AGT-C-03', 'AGT-C-04', 'AGT-C-05',
    'AGT-C-06', 'AGT-P-01', 'AGT-P-02', 'AGT-P-03', 'AGT-P-04',
    'AGT-P-05', 'AGT-P-06', 'AGT-P-07', 'AGT-P-08',
  ]);
  for (const item of [...registry.concepts, ...registry.patterns]) {
    assert.match(backlog, new RegExp(`- \\[[ x]\\] \\*\\*${item.id} P[0-3]`));
  }
  for (const item of registry.cases) {
    assert.match(
      backlog,
      new RegExp(`- \\[[ x]\\] \\*\\*${item.backlog_id} P[0-3]`),
    );
  }
});

test('foundation priorities follow the canonical backlog', () => {
  const parsedBacklog = parseBacklogTopics(backlog, 'docs/content-backlog.md');
  assert.deepEqual(parsedBacklog.errors, []);
  const backlogById = new Map(parsedBacklog.topics.map((topic) => [topic.id, topic]));
  const documentsById = new Map(
    contentDocuments
      .filter(({metadata}) => typeof metadata.topic_id === 'string')
      .map((document) => [document.metadata.topic_id, document]),
  );

  for (const topicId of expectedFoundationAdjacency.keys()) {
    const document = documentsById.get(topicId);
    const backlogTopic = backlogById.get(topicId);
    assert.ok(document, `${topicId} published document`);
    assert.ok(backlogTopic, `${topicId} canonical backlog row`);
    assert.equal(backlogTopic.priority, 'P1', `${topicId} canonical backlog priority`);
    assert.equal(
      document.metadata.priority,
      backlogTopic.priority,
      `${topicId} frontmatter priority follows the canonical backlog`,
    );
  }
});

test('published foundation adjacency is exact and reciprocal', () => {
  const documentsById = new Map(
    contentDocuments
      .filter(({metadata}) => typeof metadata.topic_id === 'string')
      .map((document) => [document.metadata.topic_id, document]),
  );

  for (const [topicId, expectedAdjacentTopics] of expectedFoundationAdjacency) {
    const document = documentsById.get(topicId);
    assert.ok(document, `${topicId} published document`);
    assert.deepEqual(
      document.metadata.adjacent_topics,
      expectedAdjacentTopics,
      `${topicId} preserves the approved adjacency set and canonical order`,
    );

    for (const adjacentTopicId of expectedAdjacentTopics) {
      const target = documentsById.get(adjacentTopicId);
      if (!target) continue;
      assert.ok(
        target.metadata.adjacent_topics?.includes(topicId),
        `${topicId} -> ${adjacentTopicId} has reverse edge ${adjacentTopicId} -> ${topicId}`,
      );
    }
  }
});

test('AGT-C-01 publishes the canonical agent-system boundary and diagram pair', () => {
  assert.ok(existsSync(articlePath), `Missing ${articlePath}`);
  assert.ok(existsSync(drawioPath), `Missing ${drawioPath}`);
  assert.ok(existsSync(svgPath), `Missing ${svgPath}`);

  const source = readFileSync(articlePath, 'utf8');
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-01');
  assert.equal(metadata.slug, '/concepts/agt-c-01');
  assert.equal(metadata.content_type, 'concept');
  assert.deepEqual(metadata.depends_on, []);
  assert.deepEqual(metadata.adjacent_topics, ['AGT-C-02', 'AGT-C-03', 'AGT-P-01']);
  assert.deepEqual(metadata.related_cases, [
    '/cases/openai-agents-sdk',
    '/cases/kubernetes-reconciliation-loop',
  ]);
  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);
  for (const claim of requiredClaims) assert.match(source, new RegExp(claim, 'u'));

  assert.match(
    source,
    /<div\b(?=[^>]*className="architecture-diagram-scroll")(?=[^>]*role="region")(?=[^>]*tabIndex=\{0\})[^>]*>/u,
  );
  assert.match(source, /\/img\/diagrams\/agt-c-01-agent-system-boundary\.svg/u);
});

test('registers exact reusable terminology contracts for the agent foundations', () => {
  const terminology = JSON.parse(readFileSync('data/terminology.json', 'utf8'));
  for (const expected of requiredTerminologyContracts) {
    assert.deepEqual(
      terminology.terms.find(({id}) => id === expected.id),
      expected,
      `${expected.id} exact terminology contract`,
    );
  }
});

test('AGT-C-01 protects the complete boundary, ownership, and runtime contracts', () => {
  const source = readFileSync(articlePath, 'utf8');
  const boundaryRows = markdownTableRows(
    source,
    '| 边界 | 候选能力 | 下一步由谁决定 | 不自动证明 |',
  );
  assert.deepEqual(boundaryRows.map((row) => row.split('|')[1].trim()), [
    '模型', '增强型大语言模型', '工作流', '智能体',
  ]);

  const ownershipRows = markdownTableRows(
    source,
    '| 架构平面 | 主要所有者 | 必须显式化的合同 |',
  );
  assert.deepEqual(ownershipRows.map((row) => row.split('|')[1].trim()), [
    '交互', '控制', '知识与上下文', '状态与记忆', '动作与工具', '治理与评测',
  ]);

  for (const terminal of ['成功', '明确失败', '预算耗尽', '人工中止']) {
    assert.match(source, new RegExp(terminal, 'u'), `terminal outcome: ${terminal}`);
  }
  assert.match(source, /智能体运行框架包住并约束智能体循环/u);
  assert.match(source, /智能体检索增强生成（Agentic RAG）不是与智能体运行框架和智能体循环并列的底层构件/u);
  assert.match(source, /停止智能体循环[^\n]*预定步骤[^\n]*显式分支[^\n]*人工批准的工作流/u);
  assert.match(source, /模型输出不能在未经外部验证时成为权威业务状态/u);
});

test('AGT-C-01 keeps the full shared label set visible and connectors above the Harness fill', () => {
  const drawio = readFileSync(drawioPath, 'utf8');
  const svg = readFileSync(svgPath, 'utf8');
  for (const label of requiredDiagramLabels) {
    const escaped = label.replaceAll('&', '&amp;');
    assert.match(drawio, new RegExp(`\\bvalue="${escaped.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"`, 'u'));
    assert.match(svg, new RegExp(`>${escaped.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}<`, 'u'));
  }

  const harnessFill = svg.indexOf('<rect data-node-id="harness"');
  const capabilityFill = svg.indexOf('<rect data-node-id="knowledge"');
  assert.ok(harnessFill >= 0, 'Harness fill has stable node identity');
  assert.ok(capabilityFill >= 0, 'capability fill has stable node identity');
  for (const edgeId of ['edge-loop-knowledge', 'edge-loop-tools', 'edge-loop-human']) {
    const connector = svg.indexOf(`<path data-edge-id="${edgeId}"`);
    assert.ok(connector > harnessFill, `${edgeId} paints after opaque Harness fill`);
    assert.ok(connector < capabilityFill, `${edgeId} paints before capability nodes`);
  }
});

test('AGT-C-01 preserves measured padding geometry and connector endpoint identities', () => {
  const drawio = readFileSync(drawioPath, 'utf8');
  const svg = readFileSync(svgPath, 'utf8');

  const widenedNodes = [
    ['budget', '580', '45', '318', '120'],
    ['approval', '924', '45', '256', '120'],
    ['knowledge', '110', '550', '318', '110'],
    ['human-agents', '760', '550', '330', '110'],
    ['checkpoint', '440', '780', '190', '74'],
  ];
  for (const [nodeId, x, y, width, height] of widenedNodes) {
    assert.match(
      drawio,
      new RegExp(`id="${nodeId}"[\\s\\S]*?<mxGeometry x="${x}" y="${y}" width="${width}" height="${height}"`, 'u'),
    );
    assert.match(
      svg,
      new RegExp(`data-node-id="${nodeId}" x="${x}" y="${y}" width="${width}" height="${height}"`, 'u'),
    );
  }

  for (const nodeId of ['state', 'memory', 'trace']) {
    assert.match(
      drawio,
      new RegExp(`id="${nodeId}"[\\s\\S]*?<mxGeometry[^>]*y="780"[^>]*height="74"`, 'u'),
    );
    assert.match(
      svg,
      new RegExp(`data-node-id="${nodeId}"[^>]*y="780"[^>]*height="74"`, 'u'),
    );
  }
  assert.match(svg, /data-node-id="foundation"[\s\S]*?<text x="110" y="760"/u);
  assert.match(svg, /data-node-id="state"[\s\S]*?<text x="165" y="825\.5"/u);

  const endpoints = [
    ['edge-loop-knowledge', 'loop', 'knowledge'],
    ['edge-loop-tools', 'loop', 'tools'],
    ['edge-loop-human', 'loop', 'human-agents'],
  ];
  for (const [edgeId, sourceId, targetId] of endpoints) {
    assert.match(
      drawio,
      new RegExp(`id="${edgeId}"[^>]*source="${sourceId}" target="${targetId}"`, 'u'),
    );
    assert.match(
      svg,
      new RegExp(`data-edge-id="${edgeId}" data-source="${sourceId}" data-target="${targetId}"`, 'u'),
    );
  }
});

test('AGT-C-01 source health observes the cited Anthropic article, not a companion work', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const id = 'src-anthropic-building-effective-agents';
  const expected = 'https://www.anthropic.com/engineering/building-effective-agents';
  const source = ledger.sources.find((item) => item.id === id);
  assert.ok(source, id);
  assert.equal(source.canonical_locator, expected);
  assert.equal(source.transport_locator, expected);
  assert.equal(source.expected_final_transport_locator, expected);
  const result = health.results.find((item) => item.source_ids.includes(id));
  assert.ok(result, `${id} health observation`);
  assert.equal(result.transport_locator, expected);
  assert.equal(result.last_attempt.final_transport_locator, expected);
});

function assertAgentHarnessContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-02');
  assert.equal(metadata.slug, '/concepts/agt-c-02');
  assert.equal(metadata.content_type, 'concept');
  assert.deepEqual(metadata.depends_on, ['AGT-C-01']);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);
  assert.match(source, /智能体运行框架约束并运行智能体循环；它本身不决定任务/u);

  const responsibilityRows = markdownTableRows(
    source,
    '| 智能体运行框架责任 | 输入 / 资产 | 强制合同 | 失败时行为 |',
  );
  assert.equal(responsibilityRows.length, 6);
  assert.deepEqual(
    responsibilityRows.map((row) => row.split('|')[1].trim()),
    harnessResponsibilities,
  );

  const mermaid = source.match(/```mermaid\n([\s\S]*?)```/u)?.[1];
  assert.ok(mermaid, 'Mermaid layered flow');
  assert.match(mermaid, /^flowchart TB\n\s+accTitle: 智能体运行框架六项责任与恢复升级边界$/mu);
  assert.match(mermaid, /subgraph HARNESS\["智能体运行框架"\]/u);
  assert.match(mermaid, /subgraph LOOP\["智能体循环"\]/u);
  for (const responsibility of harnessResponsibilities) {
    assert.match(mermaid, new RegExp(responsibility, 'u'));
  }
  assert.match(mermaid, /运行时[\s\S]*上下文装配[\s\S]*智能体循环/u);
  assert.match(mermaid, /智能体循环[\s\S]*工具注册与协议[\s\S]*权限与沙箱/u);
  assert.match(mermaid, /CR\["检查点与恢复"\][\s\S]*CR --> EXIT\["恢复或升级人工"\]/u);
  assert.doesNotMatch(mermaid, /CR .*\.-> RT/u);
  assert.match(source, /末端分支表示核对后恢复或升级人工/u);
  assert.doesNotMatch(source, /图中的回边/u);

  assert.match(source, /### 薄 SDK 反例/u);
  assert.match(source, /只转发模型请求[\s\S]*不是智能体运行框架/u);
  assert.match(source, /上下文预算[\s\S]*工具预算[\s\S]*智能体运行框架/u);
  assert.match(source, /工具调用真正执行之前[\s\S]*权限与沙箱/u);
  assert.match(source, /副作用账本[\s\S]*恢复时[\s\S]*不盲目重试/u);
  assert.match(
    source,
    /长时编码智能体案例[^。\n]*说明性参考链路[^。\n]*可审计责任边界[^。\n]*不证明真实部署或生产效果/u,
  );
  assert.doesNotMatch(source, /真实执行链/u);

  const evidenceRows = markdownTableRows(
    source,
    '| 智能体运行框架能证明 | 智能体运行框架不能证明 |',
  );
  assert.equal(evidenceRows.length, 4);
  for (const boundary of [
    '请求经过已声明的运行与权限边界',
    '上下文和工具消耗受预算约束',
    '可从已确认检查点恢复',
    '执行链留下可评测追踪',
    '模型选择的动作正确',
    '工具结果天然可信',
    '恢复一定不会重复副作用',
    '一次评测代表生产质量',
  ]) {
    assert.match(evidenceRows.join('\n'), new RegExp(boundary, 'u'));
  }
}

test('AGT-C-02 publishes the Agent Harness responsibility contract and layered Mermaid', () => {
  assert.ok(existsSync(harnessArticlePath), `Missing ${harnessArticlePath}`);
  assertAgentHarnessContract(readFileSync(harnessArticlePath, 'utf8'));
});

test('AGT-C-02 contract rejects responsibility, SDK, recovery, and evidence-boundary mutations', () => {
  const source = readFileSync(harnessArticlePath, 'utf8');
  const mutations = [
    ...harnessResponsibilities.map((label) => source.replaceAll(label, `${label}（缺失）`)),
    source.replace('### 薄 SDK 反例', '### SDK 包装'),
    source.replaceAll('副作用账本', '运行日志'),
    source.replace('模型选择的动作正确', '模型输出可用'),
    source.replace('说明性参考链路', '真实执行链'),
    source.replace('    accTitle: 智能体运行框架六项责任与恢复升级边界\n', ''),
    source.replace('accTitle: 智能体运行框架六项责任与恢复升级边界', 'accTitle: 通用运行图'),
  ];
  for (const mutant of mutations) {
    assert.throws(() => assertAgentHarnessContract(mutant));
  }
});

test('AGT-C-02 governs exact Anthropic engineering sources and matching health transports', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const document = ledger.documents[harnessArticlePath];
  assert.ok(document, `${harnessArticlePath} source document`);
  assert.deepEqual(
    document.citations.map(({source_id}) => source_id),
    harnessSourceContracts.map(({id}) => id),
  );
  assert.ok(document.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));

  for (const contract of harnessSourceContracts) {
    const source = ledger.sources.find(({id}) => id === contract.id);
    assert.ok(source, contract.id);
    assert.equal(source.title, contract.title);
    assert.equal(source.author_or_org, 'Anthropic');
    assert.equal(source.tier, 'first-party');
    assert.equal(source.license, 'LicenseRef-All-Rights-Reserved');
    assert.equal(source.copyright_policy, 'facts-and-short-quotation');
    assert.equal(source.canonical_locator, contract.locator);
    assert.equal(source.transport_locator, contract.locator);
    assert.equal(source.expected_final_transport_locator, contract.locator);

    const result = health.results.find(({source_ids}) => source_ids.includes(contract.id));
    assert.ok(result, `${contract.id} health observation`);
    assert.deepEqual(result.source_ids, [contract.id]);
    assert.equal(result.transport_locator, contract.locator);
    assert.equal(result.last_attempt.outcome, 'healthy');
    assert.equal(result.last_attempt.http_status, 200);
    assert.equal(result.last_attempt.final_transport_locator, contract.locator);
  }
});

function parseMermaidFlowchart(mermaid, direction = 'LR') {
  const labelsById = new Map();
  const edges = [];
  let headerSeen = false;
  let accTitle = null;
  const nodeSegmentPattern = '[A-Z][A-Z_]*(?:\\["[^"\\n]+"\\])?';
  const nodeSegment = /^([A-Z][A-Z_]*)(?:\["([^"\n]+)"\])?$/u;
  const approvedEdgeStatement = new RegExp(
    `^${nodeSegmentPattern}(?:\\s*-->(?:\\|[^|\\n]+\\|)?\\s*${nodeSegmentPattern})+$`,
    'u',
  );

  for (const line of mermaid.split(/\r?\n/u)) {
    const statement = line.trim();
    if (!statement) continue;
    if (!headerSeen && statement === `flowchart ${direction}`) {
      headerSeen = true;
      continue;
    }
    if (statement.startsWith('accTitle:')) {
      assert.equal(accTitle, null, 'foundation Mermaid has one accTitle');
      accTitle = statement.slice('accTitle:'.length).trim();
      continue;
    }

    assert.match(
      statement,
      approvedEdgeStatement,
      `unparsed Mermaid statement: ${line}`,
    );
    const segments = statement.split(/\s*-->(?:\|[^|\n]+\|)?\s*/u);
    assert.ok(segments.length >= 2, `unparsed Mermaid edge line: ${line}`);
    const nodeIds = segments.map((segment) => {
      const match = segment.match(nodeSegment);
      assert.ok(match, `unparsed Mermaid node segment: ${segment}`);
      const [, id, label] = match;
      if (label !== undefined) {
        const labels = labelsById.get(id) ?? new Set();
        labels.add(label);
        labelsById.set(id, labels);
      }
      return id;
    });
    for (let index = 1; index < nodeIds.length; index += 1) {
      edges.push(`${nodeIds[index - 1]}->${nodeIds[index]}`);
    }
  }
  assert.ok(headerSeen, `Mermaid flowchart ${direction} header`);

  return {
    accTitle,
    edges,
    labelsById: new Map(
      [...labelsById].map(([id, labels]) => [id, [...labels].sort()]),
    ),
  };
}

test('foundation Mermaid topology parser preserves legal chained edges', () => {
  const graph = parseMermaidFlowchart(
    'flowchart TB\n    INTENT["意图"] -->|策略检查| POLICY["策略"] --> SANDBOX["隔离沙箱"]',
    'TB',
  );
  assert.deepEqual(graph.edges, ['INTENT->POLICY', 'POLICY->SANDBOX']);
  assert.deepEqual(graph.labelsById, new Map([
    ['INTENT', ['意图']],
    ['POLICY', ['策略']],
    ['SANDBOX', ['隔离沙箱']],
  ]));
});

function assertAgentLoopContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-03');
  assert.equal(metadata.slug, '/concepts/agt-c-03');
  assert.equal(metadata.content_type, 'concept');
  assert.deepEqual(metadata.depends_on, ['AGT-C-01', 'AGT-C-02']);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);

  const mermaid = source.match(/```mermaid\n([\s\S]*?)```/u)?.[1];
  assert.ok(mermaid, 'Mermaid Agent Loop');
  const graph = parseMermaidFlowchart(mermaid);
  assert.equal(graph.accTitle, '智能体循环五阶段与四类终止结果');
  for (const [id, phase, chinese] of loopPhases) {
    assert.deepEqual(graph.labelsById.get(id), [chinese], `loop phase: ${phase}`);
    assert.ok(source.includes(`\`${phase}\``), `canonical phase vocabulary: ${phase}`);
  }
  for (const [id, outcome, chinese] of loopTerminalOutcomes) {
    assert.deepEqual(graph.labelsById.get(id), [chinese], `terminal: ${outcome}`);
    assert.ok(source.includes(`\`${outcome}\``), `documented terminal: ${outcome}`);
  }

  assert.deepEqual(graph.edges.sort(), [...loopEdges].sort());

  assert.match(source, /观察是结构化环境反馈[^\n]*不自动等于真相/u);
  assert.match(source, /模型选择[“"]下一步做什么[”"]/u);
  assert.match(source, /代码强制执行[“"]还能不能继续[”"]/u);
  assert.match(source, /拒绝[“"]直到足够好[”"]的无限循环/u);
  assert.match(source, /ReAct[^\n]*提示与交互模式[^\n]*不是生产运行时保证/u);
  assert.match(
    source,
    /Building Effective Agents[^\n]*支持工作流主要沿代码预定路径运行、智能体让模型动态控制过程和工具使用的区分；不建立本文的五阶段拓扑/u,
  );
}

function assertReactLocatorPins(react, reactHealth) {
  const locatorPins = [
    ['canonical locator', react.canonical_locator],
    ['transport locator', react.transport_locator],
    ['expected-final locator', react.expected_final_transport_locator],
    ['cache transport', reactHealth.transport_locator],
    ['observed final transport', reactHealth.last_attempt.final_transport_locator],
  ];
  for (const [label, actual] of locatorPins) {
    assert.equal(actual, reactApprovedLocator, `ReAct ${label}`);
  }
}

test('AGT-C-03 publishes the canonical five-phase Agent Loop and terminal contract', () => {
  assert.ok(existsSync(loopArticlePath), `Missing ${loopArticlePath}`);
  assertAgentLoopContract(readFileSync(loopArticlePath, 'utf8'));
});

test('AGT-C-03 rejects phase, terminal, and evaluation-bypass topology mutations', () => {
  const source = readFileSync(loopArticlePath, 'utf8');
  const mutations = [
    source.replace('    accTitle: 智能体循环五阶段与四类终止结果\n', ''),
    source.replace('accTitle: 智能体循环五阶段与四类终止结果', 'accTitle: 通用循环'),
    source.replace('PLAN["计划"]', 'PLAN["思考"]'),
    source.replace('TERMINATE --> SUCCESS["成功"]', 'TERMINATE --> SUCCESS["完成"]'),
    source.replace('OBSERVE --> EVALUATE', 'OBSERVE --> PLAN'),
    source.replace('EVALUATE -->|继续| PLAN', 'ACT -->|继续| PLAN'),
    source.replace('EVALUATE -->|停止| TERMINATE', 'OBSERVE -->|停止| TERMINATE'),
    source.replace('ACT --> OBSERVE', 'ACT --> OBSERVE\n    ACT --> TERMINATE'),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT --> TERMINATE --> FAILURE',
    ),
    source.replace(
      'PLAN["计划"] --> ACT["行动"]',
      'PLAN["思考"] --> ACT["行动"]\n    DECOY["计划"]',
    ),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT ==> TERMINATE',
    ),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT -.-> TERMINATE',
    ),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT <--> TERMINATE',
    ),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT --o TERMINATE',
    ),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT --x TERMINATE',
    ),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT ==>|旁路| TERMINATE',
    ),
    source.replace(
      'ACT --> OBSERVE["观察"]',
      'ACT --> OBSERVE["观察"]\n    ACT -.->|旁路| TERMINATE',
    ),
  ];
  for (const mutant of mutations) {
    assert.notEqual(mutant, source, 'mutation fixture must alter the article');
    assert.throws(() => assertAgentLoopContract(mutant));
  }
});

test('AGT-C-03 rejects observation-truth and Anthropic evidence-boundary mutations', () => {
  const source = readFileSync(loopArticlePath, 'utf8');
  const mutations = [
    source.replace('也不自动等于真相', '因此自动等于真相'),
    source.replace(
      '支持工作流主要沿代码预定路径运行、智能体让模型动态控制过程和工具使用的区分',
      '支持固定五阶段生产运行时',
    ),
    source.replace('不建立本文的五阶段拓扑', '建立本文的五阶段拓扑'),
  ];
  for (const mutant of mutations) {
    assert.notEqual(mutant, source, 'mutation fixture must alter the article');
    assert.throws(() => assertAgentLoopContract(mutant));
  }
});

test('AGT-C-03 governs ReAct and reuses the exact Anthropic workflow/agent source', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const document = ledger.documents[loopArticlePath];
  assert.ok(document, `${loopArticlePath} source document`);
  assert.deepEqual(document.citations.map(({source_id}) => source_id), [
    'src-react-reasoning-acting-language-models',
    'src-anthropic-building-effective-agents',
  ]);
  assert.ok(document.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));

  const react = ledger.sources.find(
    ({id}) => id === 'src-react-reasoning-acting-language-models',
  );
  assert.ok(react, 'src-react-reasoning-acting-language-models');
  assert.equal(react.title, 'ReAct: Synergizing Reasoning and Acting in Language Models');
  assert.equal(react.author_or_org, 'Shunyu Yao et al.');
  assert.equal(react.source_kind, 'paper');
  assert.equal(react.tier, 'primary');
  assert.equal(react.license, 'CC-BY-4.0');
  assert.equal(react.copyright_policy, 'adapt-with-attribution');
  assert.match(react.usage_boundary, /prompting and interaction pattern/u);
  assert.match(react.usage_boundary, /production runtime guarantees/u);
  const reactHealth = health.results.find(
    ({source_ids: sourceIds}) => sourceIds.includes(react.id),
  );
  assert.ok(reactHealth, `${react.id} health observation`);
  assertReactLocatorPins(react, reactHealth);
  assert.deepEqual(reactHealth.source_ids, [react.id]);
  assert.equal(reactHealth.last_attempt.outcome, 'healthy');

  const anthropic = ledger.sources.filter(
    ({id}) => id === 'src-anthropic-building-effective-agents',
  );
  assert.equal(anthropic.length, 1);
  assert.deepEqual(anthropic[0], {
    id: 'src-anthropic-building-effective-agents',
    canonical_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    transport_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'Building Effective Agents',
    author_or_org: 'Anthropic',
    published_at: '2024-12-19',
    registered_at: '2026-08-26',
    checked_at: '2026-08-26',
    version: 'Official engineering article published 2024-12-19 and checked directly in a browser on 2026-08-26',
    source_kind: 'official-docs',
    tier: 'first-party',
    allowed_evidence_roles: ['definition', 'method'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: 'The named Anthropic engineering article and bibliographic facts only; prose, examples, diagrams, linked works, trademarks and third-party material excluded',
    license_evidence_url: 'https://www.anthropic.com/engineering/building-effective-agents',
    license_evidence_note: 'The official page exposes no reusable page license; Tego Arch uses attributed factual summary without copying prose, examples, structure or diagrams.',
    license_family_id: 'https://www.anthropic.com/engineering/building-effective-agents',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: "Supports Anthropic's stated workflow/agent distinction and augmented-LLM building block; it does not establish the article's Harness/Loop ownership model or prove production outcomes.",
    link_policy: 'floating',
    expected_final_transport_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    expected_final_approved_at: '2026-08-26',
    expected_final_approval_note: 'The exact canonical article returned HTTP 200 and exposed the expected title and workflow/agent distinction in a real browser on 2026-08-26; no non-equivalent companion page is used as health evidence.',
  });
});

test('AGT-C-03 rejects coordinated drift from the approved ReAct transport', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const react = ledger.sources.find(
    ({id}) => id === 'src-react-reasoning-acting-language-models',
  );
  const reactHealth = health.results.find(
    ({source_ids: sourceIds}) => sourceIds.includes(react.id),
  );
  const driftedReact = structuredClone(react);
  const driftedHealth = structuredClone(reactHealth);
  const driftedLocator = 'https://arxiv.org/abs/2210.03629v3';
  driftedReact.transport_locator = driftedLocator;
  driftedReact.expected_final_transport_locator = driftedLocator;
  driftedHealth.transport_locator = driftedLocator;
  driftedHealth.last_attempt.final_transport_locator = driftedLocator;

  assert.notDeepEqual(driftedReact, react);
  assert.notDeepEqual(driftedHealth, reactHealth);
  assert.throws(() => assertReactLocatorPins(driftedReact, driftedHealth));
});

function assertInformationLifecycleContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-04');
  assert.equal(metadata.slug, '/concepts/agt-c-04');
  assert.equal(metadata.content_type, 'concept');
  assert.equal(metadata.status, 'reviewed');
  assert.deepEqual(metadata.depends_on, ['AGT-C-01', 'AGT-C-02', 'AGT-C-03']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-02',
    'AGT-C-03',
    'AGT-C-05',
    'AGT-C-06',
    'AGT-P-02',
    'AGT-P-06',
    'AGT-P-07',
    'AGT-P-08',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/multi-agent-research-system',
    '/cases/long-running-coding-agent',
    '/cases/production-incident-response-agent',
  ]);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);

  const lifecycleTables = markdownTables(source).filter(
    ([header]) => header?.[0] === informationLifecycleHeader[0],
  );
  assert.equal(lifecycleTables.length, 1, 'exactly one information lifecycle table');
  const [header, ...lifecycleRows] = lifecycleTables[0];
  assert.deepEqual(header, informationLifecycleHeader);
  assert.equal(lifecycleRows.length, 4, 'exactly four lifecycle data rows');
  for (const [rowIndex, row] of lifecycleRows.entries()) {
    assert.equal(row.length, 5, `lifecycle row ${rowIndex + 1} has five cells`);
    for (const [columnIndex, cell] of row.entries()) {
      assert.notEqual(
        cell,
        '',
        `lifecycle row ${rowIndex + 1} column ${columnIndex + 1} is non-empty`,
      );
    }
  }
  assert.deepEqual(
    lifecycleRows.map(([identity]) => identity),
    informationLifecycleRows,
  );
  for (const [rowIndex, contracts] of informationLifecycleCellContracts.entries()) {
    for (const [contractIndex, contract] of contracts.entries()) {
      assert.match(
        lifecycleRows[rowIndex][contractIndex + 1],
        contract,
        `lifecycle semantic row ${rowIndex + 1} column ${contractIndex + 2}`,
      );
    }
  }

  const visibleRecords = visibleBodyRecords(source);
  const exactMemoryBoundary = 'Memory 不承载共享业务真相';
  assert.equal(
    visibleRecords.filter((record) => record === exactMemoryBoundary).length,
    1,
    'exact Memory authority sentence is visible once',
  );
  const visibleBody = visibleRecords.join('\n');
  assert.match(
    visibleBody,
    /过时记忆[\s\S]*与当前指令或权威状态冲突时隔离该记忆、重新确认或删除，不能让模型按旧偏好继续/u,
  );
  assert.match(
    visibleBody,
    /检查点与模式漂移[\s\S]*不能安全解释就停止自动恢复并升级人工/u,
  );
  assert.match(
    visibleBody,
    /重放[\s\S]*写操作先用幂等键、回执或权威系统查询核对是否已生效[\s\S]*结果仍未知时暂停/u,
  );
  assert.match(
    visibleBody,
    /删除与保留[\s\S]*原始记录、派生摘要、向量表示、检查点副本、缓存和备份各自的删除语义与完成证据/u,
  );
  assert.match(
    visibleBody,
    /不能证明本文四分法是 LangGraph 自身的定义[\s\S]*LangGraph 文档只支持上述框架行为，不定义所有智能体的通用状态模型/u,
  );
  assert.match(visibleBody, /不证明任意外部写入具备恰好一次语义/u);
  assert.doesNotMatch(source, /```mermaid|architecture-diagram-scroll|\/img\//u);
}

function replaceLifecycleCell(source, rowIndex, columnIndex, replacement) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf('| 内容 | 生命周期 | 权威性 | 写入者 | 恢复用途 |');
  assert.notEqual(headerIndex, -1, 'lifecycle table header');
  const lineIndex = headerIndex + 2 + rowIndex;
  const cells = lines[lineIndex].slice(1, -1).split('|').map((cell) => cell.trim());
  assert.equal(cells.length, 5, `lifecycle row ${rowIndex + 1} fixture`);
  cells[columnIndex] = replacement;
  lines[lineIndex] = `| ${cells.join(' | ')} |`;
  return lines.join('\n');
}

function addLifecycleColumn(source) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf('| 内容 | 生命周期 | 权威性 | 写入者 | 恢复用途 |');
  assert.notEqual(headerIndex, -1, 'lifecycle table header');
  lines[headerIndex] = '| 内容 | 生命周期 | 权威性 | 写入者 | 恢复用途 | 备注 |';
  lines[headerIndex + 1] = '| --- | --- | --- | --- | --- | --- |';
  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    lines[headerIndex + 2 + rowIndex] = lines[headerIndex + 2 + rowIndex]
      .replace(/\|$/u, '| 新增信息 |');
  }
  return lines.join('\n');
}

function deleteLifecycleRow(source, rowIndex) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf('| 内容 | 生命周期 | 权威性 | 写入者 | 恢复用途 |');
  assert.notEqual(headerIndex, -1, 'lifecycle table header');
  lines.splice(headerIndex + 2 + rowIndex, 1);
  return lines.join('\n');
}

test('AGT-C-04 publishes the four-part information lifecycle and recovery contract', () => {
  assert.ok(
    existsSync(informationLifecycleArticlePath),
    `Missing ${informationLifecycleArticlePath}`,
  );
  assertInformationLifecycleContract(
    readFileSync(informationLifecycleArticlePath, 'utf8'),
  );
});

test('AGT-C-04 rejects lifecycle-table, hidden-copy, and recovery-boundary mutations', () => {
  const source = readFileSync(informationLifecycleArticlePath, 'utf8');
  const mutations = [];

  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < 5; columnIndex += 1) {
      mutations.push([
        `empty row ${rowIndex + 1} column ${columnIndex + 1}`,
        replaceLifecycleCell(source, rowIndex, columnIndex, ''),
      ]);
    }
    for (let columnIndex = 1; columnIndex < 5; columnIndex += 1) {
      mutations.push([
        `wrong semantic row ${rowIndex + 1} column ${columnIndex + 1}`,
        replaceLifecycleCell(source, rowIndex, columnIndex, '非空但错误'),
      ]);
    }
  }
  mutations.push(
    ['sixth column', addLifecycleColumn(source)],
    [
      'visible Memory sentence moved to a hidden comment',
      source.replace(
        '> Memory 不承载共享业务真相',
        '{/* Memory 不承载共享业务真相 */}',
      ),
    ],
    [
      'stale memory can override current truth',
      source.replace(
        '与当前指令或权威状态冲突时隔离该记忆、重新确认或删除，不能让模型按旧偏好继续',
        '与当前指令或权威状态冲突时仍让模型按旧偏好继续',
      ),
    ],
    [
      'schema drift resumes without a safe interpretation',
      source.replace(
        '不能安全解释就停止自动恢复并升级人工',
        '不能安全解释时仍继续自动恢复',
      ),
    ],
    [
      'replay blindly resends writes',
      source.replace(
        '写操作先用幂等键、回执或权威系统查询核对是否已生效',
        '写操作无需核对便直接重发',
      ),
    ],
    [
      'deletion ignores derived and backup copies',
      source.replace(
        '原始记录、派生摘要、向量表示、检查点副本、缓存和备份各自的删除语义与完成证据',
        '当前检索索引的删除结果',
      ),
    ],
    [
      'LangGraph is generalized through a hidden original boundary',
      source.replace(
        'LangGraph 文档只支持上述框架行为，不定义所有智能体的通用状态模型。',
        'LangGraph 文档定义所有智能体的通用状态模型。{/* LangGraph 文档只支持上述框架行为，不定义所有智能体的通用状态模型 */}',
      ),
    ],
    [
      'LangGraph is generalized to exactly-once effects',
      source.replace(
        '不证明任意外部写入具备恰好一次语义',
        '证明任意外部写入天然具备恰好一次语义',
      ),
    ],
  );
  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    mutations.push([
      `deleted row ${rowIndex + 1}`,
      deleteLifecycleRow(source, rowIndex),
    ]);
    mutations.push([
      `changed row ${rowIndex + 1} identity`,
      replaceLifecycleCell(
        source,
        rowIndex,
        0,
        informationLifecycleRows[(rowIndex + 1) % informationLifecycleRows.length]
          .replace(/([A-Za-z]+)/gu, '`$1`'),
      ),
    ]);
  }

  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.throws(
      () => assertInformationLifecycleContract(mutant),
      undefined,
      label,
    );
  }
});

test('AGT-C-04 reuses the governed LangGraph persistence sources without changing health cache', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const document = ledger.documents[informationLifecycleArticlePath];
  assert.ok(document, `${informationLifecycleArticlePath} source document`);
  assert.deepEqual(
    document.citations.map(({source_id}) => source_id),
    informationLifecycleSourceIds,
  );
  assert.ok(document.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));

  for (const sourceId of informationLifecycleSourceIds) {
    const governedSource = ledger.sources.find(({id}) => id === sourceId);
    assert.ok(governedSource, sourceId);
    assert.equal(governedSource.author_or_org, 'LangChain');
    assert.equal(governedSource.source_kind, 'official-docs');
    assert.equal(governedSource.tier, 'primary');
    assert.equal(governedSource.license, 'MIT');
    assert.equal(governedSource.copyright_policy, 'facts-and-short-quotation');
    const observation = health.results.find(({source_ids: sourceIds}) =>
      sourceIds.includes(sourceId));
    assert.ok(observation, `${sourceId} health observation`);
    assert.equal(observation.transport_locator, governedSource.transport_locator);
    assert.equal(observation.last_attempt.outcome, 'healthy');
    assert.equal(
      observation.last_attempt.final_transport_locator,
      governedSource.expected_final_transport_locator,
    );
  }
});

function directedPaths(edges, start, terminal) {
  const adjacency = new Map();
  for (const edge of edges) {
    const [source, target] = edge.split('->');
    adjacency.set(source, [...(adjacency.get(source) ?? []), target]);
  }
  const paths = [];
  const visit = (node, path) => {
    assert.ok(!path.includes(node), `side-effect flow must be acyclic at ${node}`);
    const nextPath = [...path, node];
    if (node === terminal) {
      paths.push(nextPath);
      return;
    }
    for (const next of adjacency.get(node) ?? []) visit(next, nextPath);
  };
  visit(start, []);
  return paths;
}

function visibleActionBoundary(source) {
  return parseMdxVisibleCopy(source, actionBoundaryArticlePath).blocks
    .map(({text}) => text.replace(/\s+/gu, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function assertActionBoundaryContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-05');
  assert.equal(metadata.slug, '/concepts/agt-c-05');
  assert.equal(metadata.content_type, 'concept');
  assert.equal(metadata.status, 'reviewed');
  assert.deepEqual(metadata.depends_on, ['AGT-C-01', 'AGT-C-02', 'AGT-C-03']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-02',
    'AGT-C-03',
    'AGT-C-04',
    'AGT-C-06',
    'AGT-P-08',
    'PR-09',
    'PR-10',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/long-running-coding-agent',
    '/cases/production-incident-response-agent',
  ]);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);

  const actionTables = markdownTables(source).filter(
    ([header]) => header?.[0] === actionBoundaryHeader[0],
  );
  assert.equal(actionTables.length, 1, 'exactly one action boundary matrix');
  const [header, ...rows] = actionTables[0];
  assert.deepEqual(header, actionBoundaryHeader);
  assert.equal(rows.length, 3, 'exactly three action-level rows');
  for (const [rowIndex, row] of rows.entries()) {
    assert.equal(row.length, 6, `action row ${rowIndex + 1} has six cells`);
    for (const [columnIndex, cell] of row.entries()) {
      assert.notEqual(cell, '', `action row ${rowIndex + 1} column ${columnIndex + 1} is non-empty`);
    }
  }
  assert.deepEqual(rows.map(([identity]) => identity), actionBoundaryRows);
  for (const [rowIndex, contracts] of actionBoundaryCellContracts.entries()) {
    for (const [contractIndex, contract] of contracts.entries()) {
      assert.match(
        rows[rowIndex][contractIndex + 1],
        contract,
        `action semantic row ${rowIndex + 1} column ${contractIndex + 2}`,
      );
    }
  }
  assert.match(
    source,
    /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u,
  );
  assert.match(
    source,
    /<div className="table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner" role="region" aria-label="只读、写入与破坏性动作安全矩阵，可横向滚动" tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}>[\s\S]*\| 动作级别 \| 外部效果 \| 权限与批准 \| 隔离与凭据 \| 重放与核对 \| 失败与恢复 \|[\s\S]*<\/div>/u,
  );

  const rootMermaidBlocks = rootMermaidCodeBlocks(source);
  assert.equal(
    rootMermaidBlocks.length,
    1,
    'exactly one root-level Mermaid action boundary flow',
  );
  const [mermaid] = rootMermaidBlocks;
  const graph = parseMermaidFlowchart(mermaid, 'TB');
  assert.equal(graph.accTitle, '工具动作经过策略、批准、沙箱、权威系统与结果验证的安全边界');
  assert.deepEqual(graph.labelsById, actionBoundaryNodes);
  assert.deepEqual(graph.edges.sort(), [...actionBoundaryEdges].sort());
  assert.match(mermaid, /POLICY -->\|只读 \/ 可补偿写入\| SANDBOX/u);
  assert.match(mermaid, /POLICY -->\|不可逆副作用\| APPROVAL/u);
  assert.match(mermaid, /POLICY -->\|拒绝 \/ 控制故障\| REJECTED/u);
  assert.match(mermaid, /APPROVAL -->\|批准有效\| SANDBOX/u);
  assert.match(mermaid, /APPROVAL -->\|拒绝 \/ 过期\| REJECTED/u);
  assert.match(mermaid, /RESULT_VERIFICATION -->\|一致\| CONFIRMED/u);
  assert.match(mermaid, /RESULT_VERIFICATION -->\|未知 \/ 不一致\| UNKNOWN/u);

  for (const terminal of ['CONFIRMED', 'UNKNOWN']) {
    const paths = directedPaths(graph.edges, 'INTENT', terminal);
    assert.ok(paths.length > 0, `reachable side-effect terminal: ${terminal}`);
    for (const path of paths) {
      for (const mandatory of ['POLICY', 'SANDBOX', 'TOOL', 'AUTHORITY', 'RESULT_VERIFICATION']) {
        assert.ok(path.includes(mandatory), `${terminal} path includes ${mandatory}`);
      }
    }
  }
  const destructivePath = ['INTENT', 'POLICY', 'APPROVAL', 'SANDBOX', 'TOOL', 'AUTHORITY', 'RESULT_VERIFICATION'];
  for (let index = 1; index < destructivePath.length; index += 1) {
    assert.ok(
      graph.edges.includes(`${destructivePath[index - 1]}->${destructivePath[index]}`),
      `approval ordering edge ${destructivePath[index - 1]}->${destructivePath[index]}`,
    );
  }

  const visible = visibleActionBoundary(source);
  for (const contract of [
    /工具模式只描述名称、参数与结果合同，不等于授权/u,
    /隔离沙箱约束执行环境，不等于主体身份/u,
    /超时只说明观察者没有得到结果，不等于已知失败/u,
    /稳定操作标识代表一次逻辑效果，传输请求标识只代表一次网络尝试/u,
    /MCP 暴露能力不自动授予安全授权/u,
    /最小权限[\s\S]*默认拒绝[\s\S]*幂等[\s\S]*结果查询[\s\S]*补偿[\s\S]*凭据撤销/u,
    /MCP Architecture[\s\S]*主机、客户端与服务端[\s\S]*不证明授权、安全性（Security）或生产适用性/u,
    /OpenAI Agents SDK[\s\S]*工具文档[\s\S]*函数工具的模式与调用形态[\s\S]*不授予业务权限/u,
    /Guardrails[\s\S]*输入、输出与函数工具护栏[\s\S]*不等于资源级业务授权或副作用批准/u,
    /Saltzer[\s\S]*基于许可的默认值与完成工作所需最低权限[\s\S]*不证明已部署策略/u,
    /NIST SP 800-160[\s\S]*生命周期安全工程、验证与风险处置[\s\S]*不规定本文拓扑/u,
    /Making retries safe with idempotent APIs[\s\S]*调用者提供请求身份与语义等价[\s\S]*不提供普遍恰好一次/u,
    /AI RMF 1\.0[\s\S]*风险、监测、人工监督、恢复与退役[\s\S]*不规定动作矩阵或批准阈值/u,
  ]) {
    assert.match(visible, contract);
  }
}

function replaceActionCell(source, rowIndex, columnIndex, replacement) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf('| 动作级别 | 外部效果 | 权限与批准 | 隔离与凭据 | 重放与核对 | 失败与恢复 |');
  assert.notEqual(headerIndex, -1, 'action boundary table header');
  const lineIndex = headerIndex + 2 + rowIndex;
  const cells = lines[lineIndex].slice(1, -1).split('|').map((cell) => cell.trim());
  assert.equal(cells.length, 6, `action row ${rowIndex + 1} fixture`);
  cells[columnIndex] = replacement;
  lines[lineIndex] = `| ${cells.join(' | ')} |`;
  return lines.join('\n');
}

function deleteActionRow(source, rowIndex) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf('| 动作级别 | 外部效果 | 权限与批准 | 隔离与凭据 | 重放与核对 | 失败与恢复 |');
  assert.notEqual(headerIndex, -1, 'action boundary table header');
  lines.splice(headerIndex + 2 + rowIndex, 1);
  return lines.join('\n');
}

test('AGT-C-05 publishes a fail-closed tool, sandbox, permission, and side-effect contract', () => {
  assert.ok(existsSync(actionBoundaryArticlePath), `Missing ${actionBoundaryArticlePath}`);
  assertActionBoundaryContract(readFileSync(actionBoundaryArticlePath, 'utf8'));
});

test('AGT-C-05 requires exactly one root-level Mermaid topology', () => {
  const source = readFileSync(actionBoundaryArticlePath, 'utf8');
  const [compliantMermaid] = rootMermaidCodeBlocks(source);
  assert.ok(compliantMermaid, 'AGT-C-05 Mermaid mutation fixture');
  const compliantMermaidFence = `\`\`\`mermaid\n${compliantMermaid}\n\`\`\``;
  assert.ok(source.includes(compliantMermaidFence), 'AGT-C-05 Mermaid fence fixture');
  const bypassMermaidFence = `\`\`\`mermaid
flowchart TB
    INTENT["意图"] --> AUTHORITY["权威系统"] --> CONFIRMED["已确认"]
\`\`\``;
  const hiddenCompliantMermaid = `{/*\n${compliantMermaidFence}\n*/}`;
  const hiddenDivCompliantMermaid = `<div hidden>\n\n${compliantMermaidFence}\n\n</div>`;
  const displayNoneCompliantMermaid = `<div style={{display: 'none'}}>\n\n${compliantMermaidFence}\n\n</div>`;
  const mutations = [
    ['zero visible Mermaid diagrams', source.replace(compliantMermaidFence, '')],
    ['multiple visible Mermaid diagrams with bypass', `${source}\n\n${bypassMermaidFence}\n`],
    ['only compliant Mermaid diagram hidden', source.replace(compliantMermaidFence, hiddenCompliantMermaid)],
    ['hidden compliant Mermaid plus visible bypass', `${source.replace(compliantMermaidFence, hiddenCompliantMermaid)}\n\n${bypassMermaidFence}\n`],
    ['compliant Mermaid nested in hidden JSX container', source.replace(compliantMermaidFence, hiddenDivCompliantMermaid)],
    ['compliant Mermaid nested in display-none JSX container', source.replace(compliantMermaidFence, displayNoneCompliantMermaid)],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.doesNotThrow(
      () => markdownParser.parse(extractMarkdownBody(mutant)),
      `${label} must be valid MDX`,
    );
    try {
      assertActionBoundaryContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: every visibility/cardinality mutant is rejected.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-C-05 ignores a nested hidden Mermaid when the root topology remains', () => {
  const source = readFileSync(actionBoundaryArticlePath, 'utf8');
  const hiddenBypass = `<div hidden>\n\n\`\`\`mermaid
flowchart TB
    INTENT["意图"] --> AUTHORITY["权威系统"] --> CONFIRMED["已确认"]
\`\`\`\n\n</div>`;
  const mutant = `${source}\n\n${hiddenBypass}\n`;
  assert.doesNotThrow(
    () => markdownParser.parse(extractMarkdownBody(mutant)),
    'hidden bypass fixture must be valid MDX',
  );
  assert.doesNotThrow(() => assertActionBoundaryContract(mutant));
});

test('AGT-C-05 rejects action-matrix, authority-bypass, and approval-order mutations', () => {
  const source = readFileSync(actionBoundaryArticlePath, 'utf8');
  const mutations = [];
  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < 6; columnIndex += 1) {
      mutations.push([
        `empty action row ${rowIndex + 1} column ${columnIndex + 1}`,
        replaceActionCell(source, rowIndex, columnIndex, ''),
      ]);
    }
    for (let columnIndex = 1; columnIndex < 6; columnIndex += 1) {
      mutations.push([
        `wrong action semantic row ${rowIndex + 1} column ${columnIndex + 1}`,
        replaceActionCell(source, rowIndex, columnIndex, '非空但错误'),
      ]);
    }
    mutations.push([`deleted action row ${rowIndex + 1}`, deleteActionRow(source, rowIndex)]);
  }
  mutations.push(
    ['accessible title removed', source.replace('    accTitle: 工具动作经过策略、批准、沙箱、权威系统与结果验证的安全边界\n', '')],
    ['accessible title drift', source.replace('accTitle: 工具动作经过策略、批准、沙箱、权威系统与结果验证的安全边界', 'accTitle: 通用工具流')],
    ['policy bypass', source.replace('INTENT["意图"] --> POLICY["策略"]', 'INTENT["意图"] --> SANDBOX["隔离沙箱"]')],
    ['sandbox bypass', source.replace('SANDBOX --> TOOL["工具"]', 'POLICY --> TOOL["工具"]')],
    ['authority bypass', source.replace('TOOL --> AUTHORITY["权威系统"]', 'TOOL --> RESULT_VERIFICATION["结果验证"]')],
    ['verification bypass', source.replace('AUTHORITY --> RESULT_VERIFICATION["结果验证"]', 'AUTHORITY --> CONFIRMED["已确认"]')],
    ['approval after tool', source.replace('POLICY -->|不可逆副作用| APPROVAL["人工批准"]', 'TOOL -->|不可逆副作用| APPROVAL["人工批准"]')],
    ['approval bypass', source.replace('APPROVAL -->|批准有效| SANDBOX', 'APPROVAL -->|批准有效| AUTHORITY')],
    ['alternate solid connector bypass', source.replace('SANDBOX --> TOOL["工具"]', 'SANDBOX --> TOOL["工具"]\n    POLICY ==> AUTHORITY')],
    ['alternate dotted connector bypass', source.replace('SANDBOX --> TOOL["工具"]', 'SANDBOX --> TOOL["工具"]\n    POLICY -.-> AUTHORITY')],
    ['alternate bidirectional connector bypass', source.replace('SANDBOX --> TOOL["工具"]', 'SANDBOX --> TOOL["工具"]\n    POLICY <--> AUTHORITY')],
    ['alternate circle connector bypass', source.replace('SANDBOX --> TOOL["工具"]', 'SANDBOX --> TOOL["工具"]\n    POLICY --o AUTHORITY')],
    ['alternate cross connector bypass', source.replace('SANDBOX --> TOOL["工具"]', 'SANDBOX --> TOOL["工具"]\n    POLICY --x AUTHORITY')],
    ['decoy stable identity', source.replace('INTENT["意图"] --> POLICY["策略"]', 'INTENT["意图"] --> FAKE_POLICY["策略"]')],
    ['mobile table wrapper removed', source.replace('table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner', 'table-wrapper')],
    ['MCP auto-authorization', source.replace('MCP 暴露能力不自动授予安全授权', 'MCP 暴露能力会自动授予安全授权')],
    ['hidden original MCP boundary', source.replace('MCP 暴露能力不自动授予安全授权', 'MCP 暴露能力会自动授予安全授权{/* MCP 暴露能力不自动授予安全授权 */}')],
  );

  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.throws(() => assertActionBoundaryContract(mutant), undefined, label);
  }
});

test('AGT-C-05 reuses governed MCP, OpenAI, PR-09, PR-10, and NIST sources', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const document = ledger.documents[actionBoundaryArticlePath];
  assert.ok(document, `${actionBoundaryArticlePath} source document`);
  assert.deepEqual(
    document.citations.map(({source_id}) => source_id),
    actionBoundarySourceIds,
  );
  assert.ok(document.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1);

  for (const sourceId of actionBoundarySourceIds) {
    const governedSource = ledger.sources.find(({id}) => id === sourceId);
    assert.ok(governedSource, sourceId);
    assert.ok(
      governedSource.allowed_evidence_roles.some((role) =>
        ['definition', 'implementation', 'method', 'runtime-fact'].includes(role)),
      `${sourceId} supports the cited evidence role`,
    );
  }
});

function assertQualityGovernanceContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-06');
  assert.equal(metadata.slug, '/concepts/agt-c-06');
  assert.equal(metadata.content_type, 'concept');
  assert.equal(metadata.status, 'reviewed');
  assert.deepEqual(metadata.depends_on, [
    'AGT-C-01',
    'AGT-C-02',
    'AGT-C-03',
    'AGT-C-04',
    'AGT-C-05',
  ]);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-02',
    'AGT-C-03',
    'AGT-C-04',
    'AGT-C-05',
    'AGT-P-02',
    'AGT-P-04',
    'AGT-P-08',
    'QA-08',
    'PR-07',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/multi-agent-research-system',
    '/cases/long-running-coding-agent',
    '/cases/production-incident-response-agent',
  ]);
  assert.equal(
    metadata.summary,
    '把追踪、评测与执行约束分成证据记录、质量判断和政策强制三项独立且不可互相替代的责任，并用离线/在线评测、关联字段、故障关闭和人工升级约束模型与工具动作。',
  );

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);
  const {ast, body} = parseQualityGovernanceAst(source);
  assertNoQualityGovernanceVisuals(ast);

  const tables = readerVisibleQualityGovernanceTables(ast);
  assert.equal(tables.length, 3, 'exactly three reader-visible AGT-C-06 tables');
  assert.deepEqual(
    tables.map(({rows: [header]}) => header?.[0]).sort((left, right) =>
      left.localeCompare(right, 'en')),
    [
      qualityResponsibilityHeader[0],
      evaluationModeHeader[0],
      '关联字段',
    ].sort((left, right) => left.localeCompare(right, 'en')),
    'reader-visible AGT-C-06 table identity set',
  );
  const responsibilityTables = tables.filter(
    ({rows: [header]}) => header?.[0] === qualityResponsibilityHeader[0],
  );
  assert.equal(responsibilityTables.length, 1, 'exactly one responsibility table');
  const [{node: responsibilityNode, rows: responsibilityTable}] = responsibilityTables;
  const [responsibilityHeader, ...responsibilityRows] = responsibilityTable;
  assertPhysicalQualityTable(body, responsibilityNode, 5, 3);
  assert.deepEqual(responsibilityHeader, qualityResponsibilityHeader);
  assert.equal(responsibilityRows.length, 3, 'exactly three responsibility rows');
  assert.deepEqual(
    responsibilityRows.map(([identity]) => identity),
    qualityResponsibilityRows,
  );
  for (const [rowIndex, row] of responsibilityRows.entries()) {
    assert.equal(row.length, 5, `responsibility row ${rowIndex + 1} has five cells`);
    assert.ok(row.every(Boolean), `responsibility row ${rowIndex + 1} has no empty cell`);
  }
  assert.match(responsibilityRows[0][1], /记录[\s\S]*证据/u);
  assert.doesNotMatch(responsibilityRows[0][1], /判断质量|执行约束/u);
  assert.match(responsibilityRows[1][1], /将[\s\S]*证据[\s\S]*转为[\s\S]*质量判断/u);
  assert.doesNotMatch(responsibilityRows[1][1], /记录证据|执行约束/u);
  assert.match(
    responsibilityRows[2][1],
    /模型或工具动作[\s\S]*之前和之后[\s\S]*执行约束/u,
  );
  assert.doesNotMatch(responsibilityRows[2][1], /记录证据|判断质量/u);

  const evaluationTables = tables.filter(
    ({rows: [header]}) => header?.[0] === evaluationModeHeader[0],
  );
  assert.equal(evaluationTables.length, 1, 'exactly one evaluation mode table');
  const [{node: evaluationNode, rows: evaluationTable}] = evaluationTables;
  const [evaluationHeader, ...evaluationRows] = evaluationTable;
  assertPhysicalQualityTable(body, evaluationNode, 6, 2);
  assert.deepEqual(evaluationHeader, evaluationModeHeader);
  assert.equal(evaluationRows.length, 2, 'exactly two evaluation mode rows');
  assert.deepEqual(evaluationRows.map(([identity]) => identity), evaluationModeRows);
  for (const [rowIndex, row] of evaluationRows.entries()) {
    assert.equal(row.length, 6, `evaluation row ${rowIndex + 1} has six cells`);
    assert.ok(row.every(Boolean), `evaluation row ${rowIndex + 1} has no empty cell`);
  }
  assert.match(evaluationRows[0][1], /发布前|变更前/u);
  assert.match(evaluationRows[0][2], /固定[\s\S]*数据集[\s\S]*多次试验/u);
  assert.match(evaluationRows[0][3], /基线[\s\S]*回归[\s\S]*版本比较/u);
  assert.match(evaluationRows[0][4], /发布门[\s\S]*缺陷样本/u);
  assert.match(evaluationRows[0][5], /分布变化[\s\S]*不能代表生产/u);
  assert.match(evaluationRows[1][1], /生产请求[\s\S]*运行中或完成后/u);
  assert.match(evaluationRows[1][2], /真实流量[\s\S]*抽样[\s\S]*反馈/u);
  assert.match(evaluationRows[1][3], /漂移[\s\S]*长尾[\s\S]*风险/u);
  assert.match(evaluationRows[1][4], /告警[\s\S]*回灌离线数据集/u);
  assert.match(evaluationRows[1][5], /不能把用户暴露当实验前提[\s\S]*不替代发布前评测/u);

  const correlationTables = tables.filter(
    ({rows: [header]}) => header?.[0] === '关联字段',
  );
  assert.equal(correlationTables.length, 1, 'exactly one trace correlation table');
  const [{node: correlationNode, rows: correlationTable}] = correlationTables;
  const [correlationHeader, ...correlationRows] = correlationTable;
  assertPhysicalQualityTable(body, correlationNode, 2, 10);
  assert.deepEqual(correlationHeader, ['关联字段', '关联问题']);
  assert.deepEqual(correlationRows.map(([field]) => field), traceCorrelationFields);
  assert.ok(correlationRows.every((row) => row.length === 2 && row.every(Boolean)));

  const visible = visibleQualityGovernance(ast);
  for (const contract of [
    /追踪只记录证据，不自动判断质量，也不执行约束/u,
    /评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权/u,
    /执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点/u,
    /缺失追踪片段[\s\S]*不能把未记录解释为未发生/u,
    /评测器漂移[\s\S]*裁判偏差/u,
    /政策绕过[\s\S]*未经过同一执行约束点/u,
    /误报[\s\S]*不能静默放宽安全关键政策/u,
    /安全关键执行约束[\s\S]*超时、不可用、策略无匹配或证据不足[\s\S]*fail-closed[\s\S]*不能 fail-open/u,
    /fail-open 只允许[\s\S]*非安全关键[\s\S]*不产生外部效果[\s\S]*告警/u,
    /高风险动作[\s\S]*执行约束无法判定[\s\S]*评测器与人工分歧[\s\S]*升级人工/u,
    /Anthropic[\s\S]*作者指导[\s\S]*不构成实现保证/u,
    /OpenTelemetry[\s\S]*Development[\s\S]*字段与命名语义[\s\S]*不保证埋点完整、关联正确或生产安全/u,
    /AI RMF 1\.0[\s\S]*风险、监测、评测与人工监督[\s\S]*不规定本文职责表、阈值或执行拓扑/u,
  ]) {
    assert.match(visible, contract);
  }
}

function replaceQualityTableCell(source, header, rowIndex, columnIndex, replacement) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(header);
  assert.notEqual(headerIndex, -1, `table header: ${header}`);
  const lineIndex = headerIndex + 2 + rowIndex;
  const cells = lines[lineIndex].slice(1, -1).split('|').map((cell) => cell.trim());
  cells[columnIndex] = replacement;
  lines[lineIndex] = `| ${cells.join(' | ')} |`;
  return lines.join('\n');
}

function qualityTableBlock(source, header) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(header);
  assert.notEqual(headerIndex, -1, `table header: ${header}`);
  let endIndex = headerIndex;
  while (/^\|.*\|$/u.test(lines[endIndex] ?? '')) endIndex += 1;
  return lines.slice(headerIndex, endIndex).join('\n');
}

function addQualityTablePhysicalCell(source, header, lineOffset, value) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(header);
  assert.notEqual(headerIndex, -1, `table header: ${header}`);
  const lineIndex = headerIndex + lineOffset;
  lines[lineIndex] = lines[lineIndex].replace(/\|$/u, `| ${value} |`);
  return lines.join('\n');
}

function removeQualityTablePhysicalCell(source, header, lineOffset) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(header);
  assert.notEqual(headerIndex, -1, `table header: ${header}`);
  const lineIndex = headerIndex + lineOffset;
  const cells = lines[lineIndex].slice(1, -1).split('|').map((cell) => cell.trim());
  cells.pop();
  lines[lineIndex] = `| ${cells.join(' | ')} |`;
  return lines.join('\n');
}

test('AGT-C-06 publishes distinct trace, evaluation, and guardrail contracts', () => {
  assert.ok(
    existsSync(qualityGovernanceArticlePath),
    `Missing ${qualityGovernanceArticlePath}`,
  );
  assertQualityGovernanceContract(
    readFileSync(qualityGovernanceArticlePath, 'utf8'),
  );
});

test('AGT-C-06 rejects responsibility, evaluation-mode, correlation, and bypass mutations', () => {
  const source = readFileSync(qualityGovernanceArticlePath, 'utf8');
  const responsibilityHeader = '| 机制 | 唯一职责 | 输入 | 输出 | 不能替代 |';
  const modeHeader = '| 评测模式 | 触发时点 | 输入样本 | 主要用途 | 反馈路径 | 失败边界 |';
  const mutations = [
    ['summary conflates responsibilities', source.replace('三项独立且不可互相替代的责任', '三项互斥责任')],
    ['trace judges quality', replaceQualityTableCell(source, responsibilityHeader, 0, 1, '记录证据并判断质量')],
    ['evaluation enforces policy', replaceQualityTableCell(source, responsibilityHeader, 1, 1, '将证据转为质量判断并执行约束')],
    ['guardrail only advises', replaceQualityTableCell(source, responsibilityHeader, 2, 1, '给模型提供一条约束建议')],
    ['offline loses fixed trials', replaceQualityTableCell(source, modeHeader, 0, 2, '临时抽样')],
    ['online becomes pre-release', replaceQualityTableCell(source, modeHeader, 1, 1, '只在发布前')],
    ['deleted correlation field', source.replace('| `operation_id` |', '| `request_note` |')],
    ['missing spans become absence proof', source.replace('不能把未记录解释为未发生', '可以把未记录解释为未发生')],
    ['safety gate fails open', source.replace('必须 fail-closed', '可以 fail-open')],
    ['policy bypass ignored', source.replace('未经过同一执行约束点', '仍可视为已经受控')],
    ['human escalation removed', source.replace('评测器与人工分歧', '评测器单独决定')],
    [
      'visible trace boundary moved to hidden comment',
      source.replace(
        '追踪只记录证据，不自动判断质量，也不执行约束。',
        '{/* 追踪只记录证据，不自动判断质量，也不执行约束。 */}',
      ),
    ],
    [
      'unsafe visible boundary backed by hidden original',
      source.replace(
        '执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。',
        '执行约束只给模型建议。{/* 执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。 */}',
      ),
    ],
  ];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.throws(() => assertQualityGovernanceContract(mutant), undefined, label);
  }
});

test('AGT-C-06 rejects hidden evidence, physical table drift, and visual embeddings', () => {
  const source = readFileSync(qualityGovernanceArticlePath, 'utf8');
  const responsibilityHeader = '| 机制 | 唯一职责 | 输入 | 输出 | 不能替代 |';
  const modeHeader = '| 评测模式 | 触发时点 | 输入样本 | 主要用途 | 反馈路径 | 失败边界 |';
  const responsibilityTable = qualityTableBlock(source, responsibilityHeader);
  const modeTable = qualityTableBlock(source, modeHeader);
  const pseudoResponsibilityTable = responsibilityTable.replace(
    responsibilityHeader,
    '| 可见伪表 | 唯一职责 | 输入 | 输出 | 不能替代 |',
  );
  const pseudoModeTable = modeTable.replace(
    modeHeader,
    '| 可见伪评测表 | 触发时点 | 输入样本 | 主要用途 | 反馈路径 | 失败边界 |',
  );
  const boundaryParagraph = '本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。';
  const mutations = [
    [
      'trace claim nested in hidden JSX',
      source.replace(
        boundaryParagraph,
        '本文固定三条边界。\n\n<div hidden>\n\n追踪只记录证据，不自动判断质量，也不执行约束。\n\n</div>\n\n评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。',
      ),
    ],
    [
      'guardrail claim nested in display-none JSX',
      source.replace(
        boundaryParagraph,
        "本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。\n\n<div style={{display: 'none'}}>\n\n执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</div>",
      ),
    ],
    [
      'evaluation claim nested in aria-hidden JSX',
      source.replace(
        boundaryParagraph,
        '本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。\n\n<section aria-hidden="true">\n\n评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。\n\n</section>\n\n执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。',
      ),
    ],
    [
      'trace claim nested in visibility-hidden JSX',
      source.replace(
        boundaryParagraph,
        "本文固定三条边界。\n\n<div style={{visibility: 'hidden'}}>\n\n追踪只记录证据，不自动判断质量，也不执行约束。\n\n</div>\n\n评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。",
      ),
    ],
    [
      'trace claim nested under present false-valued hidden attribute',
      source.replace(
        boundaryParagraph,
        '本文固定三条边界。\n\n<section hidden="false">\n\n追踪只记录证据，不自动判断质量，也不执行约束。\n\n</section>\n\n评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。',
      ),
    ],
    [
      'guardrail claim nested under ESM-referenced hidden style',
      `${source.replace(
        boundaryParagraph,
        '本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。\n\n<section style={hiddenEvidenceStyle}>\n\n执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</section>',
      )}\n\nexport const hiddenEvidenceStyle = {display: 'none'};\n`,
    ],
    [
      'guardrail claim nested under computed hidden style property',
      `${source.replace(
        boundaryParagraph,
        "本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。\n\n<section style={{display: computedDisplay}}>\n\n执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</section>",
      )}\n\nexport const computedDisplay = 'none';\n`,
    ],
    [
      'evaluation claim nested under computed aria-hidden value',
      `${source.replace(
        boundaryParagraph,
        '本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。\n\n<section aria-hidden={computedHidden}>\n\n评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。\n\n</section>\n\n执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。',
      )}\n\nexport const computedHidden = false;\n`,
    ],
    [
      'trace claim only in inline code',
      source.replace(
        '追踪只记录证据，不自动判断质量，也不执行约束。',
        '`追踪只记录证据，不自动判断质量，也不执行约束。`',
      ),
    ],
    [
      'hidden responsibility table plus visible pseudo-table',
      source.replace(
        responsibilityTable,
        `<div hidden>\n\n${responsibilityTable}\n\n</div>\n\n${pseudoResponsibilityTable}`,
      ),
    ],
    [
      'display-none evaluation table plus visible pseudo-table',
      source.replace(
        modeTable,
        `<div style={{display: 'none'}}>\n\n${modeTable}\n\n</div>\n\n${pseudoModeTable}`,
      ),
    ],
    [
      'seventh physical online-evaluation cell',
      addQualityTablePhysicalCell(source, modeHeader, 3, '不应存在的第七列'),
    ],
    [
      'seventh physical evaluation header cell',
      addQualityTablePhysicalCell(source, modeHeader, 0, '不应存在的第七列表头'),
    ],
    [
      'seventh physical evaluation delimiter cell',
      addQualityTablePhysicalCell(source, modeHeader, 1, '---'),
    ],
    [
      'missing physical offline-evaluation cell',
      removeQualityTablePhysicalCell(source, modeHeader, 2),
    ],
    ['extra required evaluation table', `${source}\n\n${modeTable}\n`],
    [
      'arbitrary fourth root table',
      `${source}\n\n| 附录字段 | 说明 |\n| --- | --- |\n| owner | 不属于三张契约表 |\n`,
    ],
    [
      'arbitrary fourth table nested in a visible section',
      `${source}\n\n<section>\n\n| 附录字段 | 说明 |\n| --- | --- |\n| owner | 不属于三张契约表 |\n\n</section>\n`,
    ],
    [
      'arbitrary fourth table nested in visible details',
      `${source}\n\n<details>\n\n| 附录字段 | 说明 |\n| --- | --- |\n| owner | 不属于三张契约表 |\n\n</details>\n`,
    ],
    [
      'arbitrary fourth table nested in visible Callout',
      `${source}\n\n<Callout>\n\n| 附录字段 | 说明 |\n| --- | --- |\n| owner | 不属于三张契约表 |\n\n</Callout>\n`,
    ],
    ['Markdown image', `${source}\n\n![architecture](https://example.com/visual.svg)\n`],
    ['HTML img', `${source}\n\n<img src="https://example.com/visual.svg" alt="architecture" />\n`],
    ['Picture component', `${source}\n\n<Picture src="/visual.webp" alt="architecture" />\n`],
    ['architecture component', `${source}\n\n<ArchitectureDiagram />\n`],
    ['architecture diagram wrapper', `${source}\n\n<ArchitectureDiagramScroll />\n`],
    ['iframe visual resource', `${source}\n\n<iframe src="/assets/incident-diagram.svg" />\n`],
    ['object visual resource', `${source}\n\n<object data="/assets/incident-diagram.svg" />\n`],
    ['embed visual resource', `${source}\n\n<embed src="/assets/incident-diagram.svg" />\n`],
    ['canvas visual surface', `${source}\n\n<canvas aria-label="architecture" />\n`],
    [
      'JSX background image',
      `${source}\n\n<div style={{backgroundImage: "url('/assets/incident-diagram.svg')"}}>背景</div>\n`,
    ],
    [
      'JSX generic background URL',
      `${source}\n\n<div style={{backgroundImage: "url('/assets/texture.bin')"}}>背景</div>\n`,
    ],
    [
      'JSX ESM-referenced visual style',
      `${source}\n\n<section style={computedVisualStyle}>背景</section>\n\nexport const computedVisualStyle = {backgroundImage: "url('/assets/texture.bin')"};\n`,
    ],
    [
      'JSX ESM-referenced source attribute',
      `${source}\n\n<section src={computedVisualSource}>背景</section>\n\nexport const computedVisualSource = '/assets/texture.bin';\n`,
    ],
    [
      'JSX spread may carry visual attributes',
      `${source}\n\n<section {...visualProps}>背景</section>\n\nexport const visualProps = {src: '/assets/texture.bin'};\n`,
    ],
    [
      'JSX poster resource',
      `${source}\n\n<section poster="/assets/incident-diagram.svg">背景</section>\n`,
    ],
    [
      'JSX expression image resource',
      `${source}\n\n<section src={'/assets/architecture.svg'}>背景</section>\n`,
    ],
    [
      'flow expression returns intrinsic image',
      `${source}\n\n{<img src='/assets/visual.svg' alt='architecture' />}\n`,
    ],
    [
      'flow expression returns uncounted table',
      `${source}\n\n{<table><tbody><tr><td>绕过表格清单</td></tr></tbody></table>}\n`,
    ],
    [
      'flow expression returns Picture component',
      `${source}\n\n{<Picture src='/assets/visual.svg' alt='architecture' />}\n`,
    ],
    [
      'flow expression surrounds a visual with comments',
      `${source}\n\n{/* before */ <img src='/assets/visual.svg' alt='architecture' /> /* after */}\n`,
    ],
    [
      'text expression returns intrinsic image',
      `${source}\n\n正文 {<img src='/assets/visual.svg' alt='architecture' />} 绕过。\n`,
    ],
    [
      'non-comment rendering expression',
      `${source}\n\n{'普通可渲染表达式'}\n`,
    ],
    ['case-insensitive Mermaid fence', `${source}\n\n\`\`\`Mermaid\ngraph TD\n  A --> B\n\`\`\`\n`],
    ['invalid MDX fails closed', `${source}\n\n<div hidden>\n`],
  ];
  const readerHiddenClaims = new Map([
    ['trace claim nested under present false-valued hidden attribute', /追踪只记录证据，不自动判断质量，也不执行约束/u],
    ['guardrail claim nested under ESM-referenced hidden style', /执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点/u],
    ['guardrail claim nested under computed hidden style property', /执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点/u],
    ['evaluation claim nested under computed aria-hidden value', /评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权/u],
  ]);
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    if (readerHiddenClaims.has(label)) {
      const {ast} = parseQualityGovernanceAst(mutant);
      assert.doesNotMatch(
        visibleQualityGovernance(ast),
        readerHiddenClaims.get(label),
        `${label} cannot contribute critical reader-visible evidence`,
      );
    }
    try {
      assertQualityGovernanceContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: reader-hidden, malformed, over-wide, duplicate, and visual mutants fail closed.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-C-06 accepts visible semantic wrappers and ordinary diagram links', () => {
  const source = readFileSync(qualityGovernanceArticlePath, 'utf8');
  const boundaryParagraph = '本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。';
  const wrapped = source.replace(
    boundaryParagraph,
    '<section>\n\n本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</section>',
  );
  const detailsWrapped = source.replace(
    boundaryParagraph,
    '<details className="evidence-card">\n\n本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</details>',
  );
  const calloutWrapped = source.replace(
    boundaryParagraph,
    '<Callout>\n\n本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</Callout>',
  );
  const staticallyVisibleStyle = source.replace(
    boundaryParagraph,
    "<section style={{color: 'red'}}>\n\n本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</section>",
  );
  const explicitVisibleAria = source.replace(
    boundaryParagraph,
    '<section aria-hidden={false}>\n\n本文固定三条边界。追踪只记录证据，不自动判断质量，也不执行约束。评测将追踪、结果和参考标准转为质量判断，不拥有工具执行权。执行约束在模型或工具动作之前和之后强制政策，不把模型自律当执行点。\n\n</section>',
  );
  const hiddenAppendixTable = `${source}\n\n<section hidden="false">\n\n| 隐藏附录 | 说明 |\n| --- | --- |\n| owner | 不进入可见表格清单 |\n\n</section>\n`;
  const linked = `${source}\n\n[diagram naming guide](https://example.com/diagram)\n`;
  const prose = `${source}\n\n“diagram” 在这里是普通正文术语，不是视觉嵌入。\n`;
  assert.notEqual(wrapped, source, 'visible section fixture must alter the article');
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(wrapped),
    'visible semantic wrapper contributes reader-visible copy',
  );
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(detailsWrapped),
    'visible details wrapper contributes reader-visible copy',
  );
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(calloutWrapped),
    'visible Callout wrapper contributes reader-visible copy',
  );
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(staticallyVisibleStyle),
    'statically visible style contributes reader-visible copy',
  );
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(explicitVisibleAria),
    'explicit false aria-hidden contributes reader-visible copy',
  );
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(hiddenAppendixTable),
    'a present hidden attribute excludes its table regardless of attribute value',
  );
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(linked),
    'ordinary href containing diagram is not a visual embed',
  );
  assert.doesNotThrow(
    () => assertQualityGovernanceContract(prose),
    'ordinary prose containing diagram is not a visual embed',
  );
});

function assertQualityGovernanceSourceContract(ledger, health) {
  const document = ledger.documents[qualityGovernanceArticlePath];
  assert.ok(document, `${qualityGovernanceArticlePath} source document`);
  assert.deepEqual(document.citations.map(({source_id}) => source_id), [
    ...qualityGovernanceSourceContracts.map(({id}) => id),
    'src-nist-ai-rmf-1-0',
  ]);
  assert.ok(document.citations.every(({usage_mode}) => usage_mode === 'facts-summary'));
  assert.equal(document.citations.filter(({manifest_primary}) => manifest_primary).length, 1);

  for (const contract of qualityGovernanceSourceContracts) {
    const governedSource = ledger.sources.find(({id}) => id === contract.id);
    assert.ok(governedSource, contract.id);
    assert.equal(governedSource.title, contract.title);
    assert.equal(governedSource.author_or_org, contract.author);
    assert.equal(governedSource.published_at, contract.publishedAt);
    assert.equal(governedSource.registered_at, '2026-08-26');
    assert.equal(governedSource.checked_at, '2026-08-26');
    if (contract.version !== undefined) {
      assert.equal(governedSource.version, contract.version);
    }
    assert.equal(governedSource.canonical_locator, contract.locator);
    assert.equal(governedSource.transport_locator, contract.locator);
    assert.equal(governedSource.expected_final_transport_locator, contract.locator);
    assert.equal(governedSource.license, contract.license);
    assert.equal(governedSource.license_evidence_url, contract.licenseEvidenceLocator);
    assert.equal(governedSource.copyright_policy, 'facts-and-short-quotation');
    assert.match(governedSource.usage_boundary, /does not guarantee|does not prove/u);

    const observation = health.results.find(({source_ids}) =>
      source_ids.includes(contract.id));
    assert.ok(observation, `${contract.id} health observation`);
    assert.deepEqual(observation.source_ids, [contract.id]);
    assert.equal(observation.transport_locator, contract.locator);
    assert.equal(observation.last_attempt.outcome, 'healthy');
    assert.equal(observation.last_attempt.final_transport_locator, contract.locator);
  }

  const nist = ledger.sources.filter(({id}) => id === 'src-nist-ai-rmf-1-0');
  assert.equal(nist.length, 1, 'reuse exactly one NIST AI RMF identity');
}

test('AGT-C-06 governs exact Anthropic, OpenTelemetry, and NIST source boundaries', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  assertQualityGovernanceSourceContract(ledger, health);
});

test('AGT-C-06 rejects OpenTelemetry Development-status drift', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const drifted = structuredClone(ledger);
  const openTelemetry = drifted.sources.find(
    ({id}) => id === 'src-opentelemetry-genai-agent-semconv',
  );
  assert.ok(openTelemetry, 'OpenTelemetry mutation fixture');
  openTelemetry.version = openTelemetry.version.replace('Development', 'Stable');
  assert.notDeepEqual(drifted, ledger, 'OpenTelemetry status fixture must drift');
  assert.throws(
    () => assertQualityGovernanceSourceContract(drifted, health),
    undefined,
    'OpenTelemetry Development status is pinned',
  );
});
