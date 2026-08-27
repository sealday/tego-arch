import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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
import {assertControlOwnershipDiagramGeometry} from '../scripts/validate-agt-p-06-control-ownership-diagram.mjs';
import {assertDurableAgentDiagramGeometry} from '../scripts/validate-agt-p-08-durable-agent-diagram.mjs';

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
const evaluatorOptimizerArticlePath = 'content/patterns/agt-p-04-evaluator-optimizer.mdx';
const evaluatorOptimizerSummary =
  '把候选生成、外部量表评估、结构化反馈与版本化修订组成有界循环，保留候选历史和评估不确定性，并以独立检查、修订预算、拒绝、人工复核与确定性回退控制终止。';
const evaluatorOptimizerTags = [
  '评估者—优化者',
  '外部量表',
  '版本化候选',
  '修订预算',
  '独立检查',
];
const evaluatorOptimizerMermaidAccTitle = '评估者—优化者外部量表、修订预算与四类终止控制流';
const evaluatorOptimizerNodes = new Map([
  ['GENERATE', ['生成候选（Generate）']],
  ['VERSION_HISTORY', ['候选与版本历史']],
  ['EXTERNAL_RUBRIC', ['外部量表']],
  ['EVALUATE', ['评估候选（Evaluate）']],
  ['FEEDBACK', ['结构化反馈（Feedback）']],
  ['REVISION_BUDGET', ['修订预算门']],
  ['REVISE', ['修订新版本（Revise）']],
  ['INDEPENDENT_CHECK', ['高风险独立检查']],
  ['ACCEPT', ['接受（accept）']],
  ['REJECT', ['拒绝（reject）']],
  ['BUDGET_EXHAUSTED', ['预算耗尽（budget exhausted）']],
  ['HUMAN_REVIEW', ['人工复核（human review）']],
]);
const evaluatorOptimizerEdges = [
  ['GENERATE', 'VERSION_HISTORY', null],
  ['VERSION_HISTORY', 'EVALUATE', null],
  ['EXTERNAL_RUBRIC', 'EVALUATE', null],
  ['EVALUATE', 'ACCEPT', '符合且低风险'],
  ['EVALUATE', 'FEEDBACK', '不符合且可修订'],
  ['FEEDBACK', 'REVISION_BUDGET', null],
  ['REVISION_BUDGET', 'REVISE', '预算可用'],
  ['REVISION_BUDGET', 'BUDGET_EXHAUSTED', '预算耗尽'],
  ['REVISE', 'VERSION_HISTORY', null],
  ['EVALUATE', 'INDEPENDENT_CHECK', '高风险候选'],
  ['INDEPENDENT_CHECK', 'ACCEPT', '检查通过'],
  ['INDEPENDENT_CHECK', 'REJECT', '检查失败'],
  ['INDEPENDENT_CHECK', 'HUMAN_REVIEW', '检查不确定'],
  ['EVALUATE', 'REJECT', '不可修复或策略拒绝'],
  ['EVALUATE', 'HUMAN_REVIEW', '不确定或未知'],
];
const evaluatorOptimizerSourceIds = [
  'src-anthropic-building-effective-agents',
  'src-anthropic-demystifying-evals-ai-agents',
  'src-github-0e9e961ee207',
];
const evaluatorOptimizerSourceContracts = [
  {
    id: 'src-anthropic-building-effective-agents',
    canonical_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    transport_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    expected_final_transport_locator: 'https://www.anthropic.com/engineering/building-effective-agents',
    title: 'Building Effective Agents',
    author_or_org: 'Anthropic',
    published_at: '2024-12-19',
    version: 'Official engineering article published 2024-12-19 and checked directly in a browser on 2026-08-26',
    source_kind: 'official-docs',
    tier: 'first-party',
    allowed_evidence_roles: ['definition', 'method'],
    license: 'LicenseRef-All-Rights-Reserved',
    usage_boundary: "Supports Anthropic's stated workflow/agent distinction and augmented-LLM building block; it does not establish the article's Harness/Loop ownership model or prove production outcomes.",
    health: {at: '2026-08-26T08:49:28.000Z', status: 200},
  },
  {
    id: 'src-anthropic-demystifying-evals-ai-agents',
    canonical_locator: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
    transport_locator: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
    expected_final_transport_locator: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
    title: 'Demystifying evals for AI agents',
    author_or_org: 'Anthropic',
    published_at: '2026-01-09',
    version: 'Current official engineering article retrieved and checked on 2026-08-26',
    source_kind: 'engineering-blog',
    tier: 'first-party',
    allowed_evidence_roles: ['definition', 'method'],
    license: 'LicenseRef-All-Rights-Reserved',
    usage_boundary: "Supports Anthropic's definitions of tasks, trials, graders, traces or trajectories, outcomes and evaluation harnesses, plus its reported grader-selection and human-calibration guidance; it does not guarantee evaluator accuracy, production quality, or the article's Trace/Evaluation/Guardrail responsibility model.",
    health: {at: '2026-08-26T13:19:25.000Z', status: 200},
  },
  {
    id: 'src-github-0e9e961ee207',
    canonical_locator: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/llm_as_a_judge.py',
    transport_locator: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/llm_as_a_judge.py',
    expected_final_transport_locator: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/llm_as_a_judge.py',
    title: 'LLM-as-a-judge',
    author_or_org: 'OpenAI',
    published_at: null,
    version: 'Git commit 2fa463571e76dae8ff267622f1018eaf06ffeb9f',
    source_kind: 'source-code',
    tier: 'primary',
    allowed_evidence_roles: [
      'case-evidence', 'comparison', 'definition', 'historical-context',
      'implementation', 'learning', 'method', 'runtime-fact',
    ],
    license: 'MIT',
    usage_boundary: 'Shows the implementation in “LLM-as-a-judge” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
    health: {at: '2026-08-25T12:07:24.531Z', status: 206},
  },
];
const evaluatorOptimizerDocumentContract = {
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
      modification_note: 'Original Chinese synthesis of the evaluator–optimizer feedback-loop boundary; no source prose, examples, structure, taxonomy layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-anthropic-demystifying-evals-ai-agents',
      citation_url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
      roles: ['definition', 'method'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'Demystifying evals for AI agents, Anthropic',
      modification_note: 'Original Chinese synthesis of evaluation vocabulary, grader selection and human-calibration boundaries; no source prose, examples, tables, images, structure or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-0e9e961ee207',
      citation_url: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/llm_as_a_judge.py',
      roles: ['implementation'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'LLM-as-a-judge, OpenAI',
      modification_note: 'Bounded implementation-evidence summary of the fixed code example; no code, prompt, output, example task, control structure or repository layout copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
  ],
};
const routerDispatchArticlePath = 'content/patterns/agt-p-05-router-model-dispatch.mdx';
const routerDispatchSummary =
  '以确定性策略门先约束请求，再让模型提出候选路由；通过置信度、能力可用性和版本门只选择一个目的地，并把未知、低置信、不可用、漂移与对抗输入收敛到确定性回退或安全停止。';
const routerDispatchTags = [
  '路由',
  '模型驱动分发',
  '策略门',
  '能力发现',
  '确定性回退',
];
const routerDispatchMermaidAccTitle = '路由与模型驱动分发的策略门、唯一目的地与故障关闭控制流';
const routerDispatchNodes = new Map([
  ['REQUEST', ['待分发请求']],
  ['POLICY_GATE', ['确定性策略门']],
  ['MODEL_ROUTER', ['路由模型']],
  ['CONFIDENCE_GATE', ['置信度与未知门']],
  ['CAPABILITY_REGISTRY', ['版本化能力目录']],
  ['CAPABILITY_CHECK', ['能力与可用性校验']],
  ['SELECTED_DESTINATION', ['唯一选定目的地']],
  ['VERSION_GATE', ['目的地版本门']],
  ['EXECUTE', ['受限执行']],
  ['VERIFY', ['结果与副作用核验']],
  ['COMPLETE', ['完成']],
  ['DETERMINISTIC_FALLBACK', ['确定性回退：澄清、静态队列或安全停止']],
  ['SAFE_STOP', ['安全停止']],
]);
const routerDispatchEdges = [
  ['REQUEST', 'POLICY_GATE', null],
  ['POLICY_GATE', 'MODEL_ROUTER', '策略允许'],
  ['POLICY_GATE', 'SAFE_STOP', '策略拒绝或对抗输入'],
  ['MODEL_ROUTER', 'CONFIDENCE_GATE', '候选路由'],
  ['CONFIDENCE_GATE', 'CAPABILITY_CHECK', '已知且高置信'],
  ['CONFIDENCE_GATE', 'DETERMINISTIC_FALLBACK', '未知或低置信'],
  ['CAPABILITY_REGISTRY', 'CAPABILITY_CHECK', null],
  ['CAPABILITY_CHECK', 'SELECTED_DESTINATION', '恰好一个可用目标'],
  ['CAPABILITY_CHECK', 'DETERMINISTIC_FALLBACK', '目标不可用或多目标冲突'],
  ['SELECTED_DESTINATION', 'VERSION_GATE', null],
  ['VERSION_GATE', 'EXECUTE', '版本一致'],
  ['VERSION_GATE', 'DETERMINISTIC_FALLBACK', '版本漂移'],
  ['EXECUTE', 'VERIFY', null],
  ['VERIFY', 'COMPLETE', '结果已确认'],
  ['VERIFY', 'SAFE_STOP', '失败或副作用未知'],
  ['DETERMINISTIC_FALLBACK', 'SAFE_STOP', null],
];
const routerDispatchSourceIds = [
  'src-github-199e95b0a693',
  'src-github-ee60ab199780',
  'src-github-32ae2040f2fa',
];
const routerDispatchSourceContracts = [
  {
    id: 'src-github-199e95b0a693',
    canonical_locator: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/routing.py',
    transport_locator: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/routing.py',
    expected_final_transport_locator: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/routing.py',
    title: 'Handoff routing',
    author_or_org: 'OpenAI',
    published_at: null,
    version: 'Git commit 2fa463571e76dae8ff267622f1018eaf06ffeb9f',
    source_kind: 'source-code',
    tier: 'primary',
    license: 'MIT',
    usage_boundary: 'Shows the implementation in “Handoff routing” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
    health: {at: '2026-08-25T12:07:24.531Z', status: 206},
  },
  {
    id: 'src-github-ee60ab199780',
    canonical_locator: 'https://github.com/Kong/developer.konghq.com/blob/f144a33379d5b599efaacf92642a2f9b41018fd6/app/ai-gateway/load-balancing.md',
    transport_locator: 'https://github.com/Kong/developer.konghq.com/blob/f144a33379d5b599efaacf92642a2f9b41018fd6/app/ai-gateway/load-balancing.md',
    expected_final_transport_locator: 'https://github.com/Kong/developer.konghq.com/blob/f144a33379d5b599efaacf92642a2f9b41018fd6/app/ai-gateway/load-balancing.md',
    title: 'app/ai-gateway/load-balancing.md@f144a33',
    author_or_org: 'Kong Inc.',
    published_at: null,
    version: 'Git commit f144a33379d5b599efaacf92642a2f9b41018fd6',
    source_kind: 'source-code',
    tier: 'primary',
    license: 'MIT',
    usage_boundary: 'Shows the implementation in “app/ai-gateway/load-balancing.md@f144a33” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
    health: {at: '2026-08-25T12:07:24.531Z', status: 206},
  },
  {
    id: 'src-github-32ae2040f2fa',
    canonical_locator: 'https://github.com/QuantumNous/new-api/blob/1721144221ec5c94dd87891a7ae1bee228e7bb63/service/channel_select.go',
    transport_locator: 'https://github.com/QuantumNous/new-api/blob/1721144221ec5c94dd87891a7ae1bee228e7bb63/service/channel_select.go',
    expected_final_transport_locator: 'https://github.com/QuantumNous/new-api/blob/1721144221ec5c94dd87891a7ae1bee228e7bb63/service/channel_select.go',
    title: 'service/channel_select.go',
    author_or_org: 'QuantumNous / New API maintainers',
    published_at: null,
    version: 'Git commit 1721144221ec5c94dd87891a7ae1bee228e7bb63',
    source_kind: 'source-code',
    tier: 'primary',
    license: 'AGPL-3.0-only',
    usage_boundary: 'Shows the implementation in “service/channel_select.go” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
    health: {at: '2026-08-25T12:07:24.531Z', status: 206},
  },
];
const routerDispatchAllowedRoles = [
  'case-evidence', 'comparison', 'definition', 'historical-context',
  'implementation', 'learning', 'method', 'runtime-fact',
];
const routerDispatchDocumentContract = {
  reviewed_at: '2026-08-27',
  copyright_checks: [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ],
  citations: [
    {
      source_id: 'src-github-199e95b0a693',
      citation_url: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/examples/agent_patterns/routing.py',
      roles: ['implementation'],
      manifest_primary: true,
      usage_mode: 'facts-summary',
      attribution_note: 'Handoff routing, OpenAI',
      modification_note: 'Bounded implementation-evidence summary of the fixed routing example; no code, prompt, output, example task, control structure or repository layout copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-ee60ab199780',
      citation_url: 'https://github.com/Kong/developer.konghq.com/blob/f144a33379d5b599efaacf92642a2f9b41018fd6/app/ai-gateway/load-balancing.md',
      roles: ['case-evidence', 'comparison'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'AI Gateway load-balancing documentation source, Kong Inc.',
      modification_note: 'Original Chinese comparison of traffic-selection mechanics with task-control routing; no source prose, examples, tables, structure or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-32ae2040f2fa',
      citation_url: 'https://github.com/QuantumNous/new-api/blob/1721144221ec5c94dd87891a7ae1bee228e7bb63/service/channel_select.go',
      roles: ['case-evidence', 'comparison'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'service/channel_select.go, QuantumNous / New API maintainers',
      modification_note: 'Original Chinese comparison of channel selection with task-control routing; no source code, examples, control structure, repository layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
  ],
};
const controlOwnershipArticlePath =
  'content/patterns/agt-p-06-supervisor-handoff-agents-as-tools.mdx';
const controlOwnershipDrawioPath =
  'diagrams/agt-p-06-control-ownership-models.drawio';
const controlOwnershipSvgPath =
  'static/img/diagrams/agt-p-06-control-ownership-models.svg';
const controlOwnershipSummary =
  '比较监督者、移交与智能体作为工具三种多智能体控制权模型：分别固定下一步控制者、当前会话所有者、专家结果返回点、共享状态和停止责任，并用有界上下文、权限、副作用、恢复与人工升级约束混合拓扑。';
const controlOwnershipTags = [
  '监督者',
  '移交',
  '智能体作为工具',
  '控制权所有权',
  '多智能体',
];
const controlOwnershipMatrixHeader = [
  '控制形态',
  '下一步控制者',
  '当前会话所有者',
  '专家结果返回点',
  '共享状态',
  '停止责任',
];
const controlOwnershipMatrixCells = [
  [
    'Supervisor',
    'Supervisor；可在全局预算内反复委派',
    'Supervisor',
    'Worker Agent 的结构化结果返回 Supervisor',
    'Supervisor 保留全局任务状态；Worker Agent 只持有受限子任务投影',
    'Supervisor 终止、降级或升级人工',
  ],
  [
    'Handoff',
    'Handoff 后的 Active Agent',
    'Handoff 后的 Active Agent',
    '当前会话不返回原智能体；由 Active Agent 继续',
    '会话状态按移交合同转移；业务真相仍在权威状态',
    'Active Agent 对当前会话终止负责；运行框架强制全局预算',
  ],
  [
    'Agent as Tool',
    'Parent Agent',
    'Parent Agent',
    '有界子任务结果返回 Parent Agent',
    'Parent Agent 保留任务状态；工具智能体只见最小输入',
    'Parent Agent 验收并终止；工具智能体只终止子任务',
  ],
];
const controlOwnershipRequiredLabels = [
  'Supervisor',
  'Worker Agent',
  'Handoff',
  'Active Agent',
  'Agent as Tool',
  'Parent Agent',
];
const controlOwnershipSourceIds = [
  'src-github-ef3d4ce19335',
  'src-github-f832ac155523',
  'src-github-bb9d33890d3e',
  'src-github-70740975c052',
  'src-atlas-agt-p-06-control-ownership-models',
];
const controlOwnershipSourceContracts = [
  {
    id: 'src-github-ef3d4ce19335',
    locator: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/docs/multi_agent.md',
    title: '固定提交文档', author: 'OpenAI', version: 'Git commit 2fa463571e76dae8ff267622f1018eaf06ffeb9f',
    kind: 'source-code', tier: 'primary', license: 'MIT',
    usage: 'Shows the implementation in “固定提交文档” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
  },
  {
    id: 'src-github-f832ac155523',
    locator: 'https://github.com/langchain-ai/langgraph-supervisor-py/blob/88859b34017ac3569bbd4a3092c7e77593a0a960/README.md',
    title: 'langgraph-supervisor-py README', author: 'LangChain', version: 'Git commit 88859b34017ac3569bbd4a3092c7e77593a0a960',
    kind: 'source-code', tier: 'primary', license: 'MIT',
    usage: 'Shows the implementation in “langgraph-supervisor-py README” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
  },
  {
    id: 'src-github-bb9d33890d3e',
    locator: 'https://github.com/a2aproject/A2A/blob/af112d9491c1fd4b2a568ac65755af4a62790490/docs/specification.md',
    title: 'docs/specification.md', author: 'A2A Project', version: 'Git commit af112d9491c1fd4b2a568ac65755af4a62790490',
    kind: 'source-code', tier: 'primary', license: 'Apache-2.0',
    usage: 'Shows the implementation in “docs/specification.md” at the recorded commit or file version; it does not alone prove runtime guarantees or deployment fitness.',
  },
  {
    id: 'src-github-70740975c052',
    locator: 'https://github.com/microsoft/multi-agent-reference-architecture/tree/ed3613b54b46b595dd223aaff8772def376a8c37',
    title: 'Microsoft Multi-Agent Reference Architecture 仓库与 README', author: 'Microsoft', version: 'Git commit ed3613b54b46b595dd223aaff8772def376a8c37',
    kind: 'official-repository', tier: 'primary', license: 'MIT',
    usage: 'Establishes repository structure or release context through “Microsoft Multi-Agent Reference Architecture 仓库与 README”; it does not cover linked third-party works or alone prove runtime behavior.',
  },
];
const controlOwnershipAllowedRoles = [
  'case-evidence', 'comparison', 'definition', 'historical-context',
  'implementation', 'learning', 'method', 'runtime-fact',
];
const controlOwnershipDocumentContract = {
  reviewed_at: '2026-08-27',
  copyright_checks: [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ],
  citations: [
    {
      source_id: 'src-github-ef3d4ce19335',
      citation_url: 'https://github.com/openai/openai-agents-python/blob/2fa463571e76dae8ff267622f1018eaf06ffeb9f/docs/multi_agent.md',
      roles: ['implementation', 'comparison'],
      manifest_primary: true,
      usage_mode: 'facts-summary',
      attribution_note: 'Multi-agent patterns documentation at fixed commit, OpenAI',
      modification_note: 'Original Chinese comparison of manager-style agents-as-tools and handoff control ownership; no source prose, code, examples, structure, taxonomy layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-f832ac155523',
      citation_url: 'https://github.com/langchain-ai/langgraph-supervisor-py/blob/88859b34017ac3569bbd4a3092c7e77593a0a960/README.md',
      roles: ['implementation', 'comparison'],
      manifest_primary: true,
      usage_mode: 'facts-summary',
      attribution_note: 'langgraph-supervisor-py README at fixed commit, LangChain',
      modification_note: 'Bounded implementation-evidence summary of supervisor delegation and return semantics; no source prose, code, examples, topology, repository layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-bb9d33890d3e',
      citation_url: 'https://github.com/a2aproject/A2A/blob/af112d9491c1fd4b2a568ac65755af4a62790490/docs/specification.md',
      roles: ['definition', 'comparison'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'A2A specification at fixed commit, A2A Project',
      modification_note: 'Original Chinese explanation of protocol interoperability boundaries; no specification prose, examples, schemas, structure or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-70740975c052',
      citation_url: 'https://github.com/microsoft/multi-agent-reference-architecture/tree/ed3613b54b46b595dd223aaff8772def376a8c37',
      roles: ['case-evidence', 'comparison'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'Microsoft Multi-Agent Reference Architecture repository at fixed commit, Microsoft',
      modification_note: 'Original Chinese comparison of reference-architecture building blocks, communication and governance boundaries; no source prose, code, examples, topology, repository layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-atlas-agt-p-06-control-ownership-models',
      citation_url: '/img/diagrams/agt-p-06-control-ownership-models.svg',
      roles: ['illustration'],
      manifest_primary: false,
      usage_mode: 'original-illustration',
      attribution_note: 'Multi-agent control ownership models, Tego Arch maintainers',
      modification_note: 'Created as an original synchronized Draw.io/SVG pair without third-party topology, reference imagery, icons, brand visuals, signatures, watermarks or copied composition.',
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

function parseEvaluatorOptimizerMermaid(mermaid) {
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
    if (!headerSeen && statement === 'flowchart LR') {
      headerSeen = true;
      continue;
    }
    if (statement.startsWith('accTitle:')) {
      assert.equal(accTitle, null, 'Evaluator–Optimizer Mermaid has one accTitle declaration');
      accTitle = statement.slice('accTitle:'.length).trim();
      continue;
    }
    assert.match(statement, edgeStatement, `unparsed Evaluator–Optimizer Mermaid: ${line}`);
    const parts = statement.split(/\s*-->(?:\|([^|\n]+)\|)?\s*/u);
    const nodeSegments = [];
    const edgeLabels = [];
    for (let index = 0; index < parts.length; index += 2) {
      nodeSegments.push(parts[index]);
      if (index + 1 < parts.length) edgeLabels.push(parts[index + 1] ?? null);
    }
    const nodeIds = nodeSegments.map((segment) => {
      const match = segment.match(nodeSegment);
      assert.ok(match, `unparsed Evaluator–Optimizer node: ${segment}`);
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
  assert.ok(headerSeen, 'Evaluator–Optimizer Mermaid flowchart LR header');
  assert.equal(
    accTitle,
    evaluatorOptimizerMermaidAccTitle,
    'Evaluator–Optimizer Mermaid exact accessible title',
  );
  return {
    labelsById: new Map([...labelsById].map(([id, labels]) => [id, [...labels].sort()])),
    edges,
  };
}

function assertEvaluatorOptimizerContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.title, '评估者—优化者（Evaluator-Optimizer）：用外部量表与修订预算约束反馈循环');
  assert.equal(metadata.topic_id, 'AGT-P-04');
  assert.equal(metadata.slug, '/patterns/agt-p-04');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'advanced');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, ['agent-loop', 'evaluator-optimizer']);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, ['reliability', 'safety', 'operability']);
  assert.deepEqual(metadata.tags, evaluatorOptimizerTags);
  assert.equal(metadata.summary, evaluatorOptimizerSummary);
  assert.deepEqual(metadata.depends_on, ['AGT-C-03', 'AGT-C-06']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-03',
    'AGT-C-06',
    'AGT-P-01',
    'AGT-P-02',
    'AGT-P-03',
    'AGT-P-07',
    'AGT-P-08',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/multi-agent-research-system',
    '/cases/long-running-coding-agent',
  ]);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(
    findMarkdownHeadings(source)
      .filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const mermaidBlocks = readerVisibleMermaidCodeBlocks(source);
  assert.equal(mermaidBlocks.length, 1, 'exactly one reader-visible Evaluator–Optimizer Mermaid');
  assert.equal(mermaidBlocks[0].rootDirect, true, 'Evaluator–Optimizer Mermaid remains root-direct');
  const graph = parseEvaluatorOptimizerMermaid(mermaidBlocks[0].value);
  assert.deepEqual(graph.labelsById, evaluatorOptimizerNodes);
  assert.deepEqual(graph.edges, evaluatorOptimizerEdges);
  assert.deepEqual(
    graph.edges.filter(([, target]) => target === 'ACCEPT'),
    [
      ['EVALUATE', 'ACCEPT', '符合且低风险'],
      ['INDEPENDENT_CHECK', 'ACCEPT', '检查通过'],
    ],
    'accept is reachable only after rubric-backed evaluation and any required independent check',
  );
  assert.deepEqual(
    graph.edges.filter(([sourceId]) => sourceId === 'REVISION_BUDGET'),
    [
      ['REVISION_BUDGET', 'REVISE', '预算可用'],
      ['REVISION_BUDGET', 'BUDGET_EXHAUSTED', '预算耗尽'],
    ],
    'revision budget has one retry path and one terminal exhausted path',
  );
  assert.equal(
    graph.edges.some(([sourceId]) => sourceId === 'BUDGET_EXHAUSTED'),
    false,
    'budget exhausted is terminal',
  );

  const visible = parseMdxVisibleCopy(source, evaluatorOptimizerArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  for (const contract of [
    /外部量表/u,
    /候选[^。\n]{0,80}版本历史/u,
    /评估者[^。\n]{0,100}(?:不确定|未知)/u,
    /高风险[^。\n]{0,120}(?:独立检查|人工复核)/u,
    /相关(?:性)?模型错误|相关错误/u,
    /(?:judge score|评估分数)[^。\n]{0,80}(?:不是|不等于)[^。\n]{0,40}(?:真相|事实)/iu,
    /回归测试/u,
    /控制所有者/u,
    /状态所有者/u,
    /终止责任/u,
    /权限/u,
    /副作用/u,
    /失败[^。\n]{0,160}恢复/u,
    /确定性回退/u,
    /迁移/u,
    /行业标准/u,
    /实现证据[^。\n]{0,160}(?:不证明|不能证明)[^。\n]{0,100}生产/u,
  ]) assert.match(visible, contract);
}

function assertEvaluatorOptimizerSourceContract(ledger, health) {
  const document = ledger.documents[evaluatorOptimizerArticlePath];
  assert.ok(document, `${evaluatorOptimizerArticlePath} source document`);
  assert.deepEqual(document, evaluatorOptimizerDocumentContract);
  assert.deepEqual(
    document.citations.map(({source_id: sourceId}) => sourceId),
    evaluatorOptimizerSourceIds,
  );

  for (const contract of evaluatorOptimizerSourceContracts) {
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

function parseRouterDispatchMermaid(mermaid) {
  const labelsById = new Map();
  const edges = [];
  let direction = null;
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
    if (direction === null && /^flowchart\s+(?:TB|LR)$/u.test(statement)) {
      direction = statement.slice('flowchart '.length);
      continue;
    }
    if (statement.startsWith('accTitle:')) {
      assert.equal(accTitle, null, 'Router Mermaid has one accTitle declaration');
      accTitle = statement.slice('accTitle:'.length).trim();
      continue;
    }
    assert.match(statement, edgeStatement, `unparsed Router Mermaid: ${line}`);
    const parts = statement.split(/\s*-->(?:\|([^|\n]+)\|)?\s*/u);
    const nodeSegments = [];
    const edgeLabels = [];
    for (let index = 0; index < parts.length; index += 2) {
      nodeSegments.push(parts[index]);
      if (index + 1 < parts.length) edgeLabels.push(parts[index + 1] ?? null);
    }
    const nodeIds = nodeSegments.map((segment) => {
      const match = segment.match(nodeSegment);
      assert.ok(match, `unparsed Router node: ${segment}`);
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
  assert.ok(direction, 'Router Mermaid flowchart direction header');
  assert.equal(accTitle, routerDispatchMermaidAccTitle, 'Router Mermaid exact accessible title');
  return {
    direction,
    labelsById: new Map([...labelsById].map(([id, labels]) => [id, [...labels].sort()])),
    edges,
  };
}

function assertRouterDispatchReadableLayout(graph) {
  assert.equal(graph.direction, 'TB', 'Router Mermaid uses vertical flow to preserve readable text');
  const nodeIds = [...routerDispatchNodes.keys()];
  const indegree = new Map(nodeIds.map((id) => [id, 0]));
  const successors = new Map(nodeIds.map((id) => [id, []]));
  for (const [sourceId, targetId] of graph.edges) {
    indegree.set(targetId, indegree.get(targetId) + 1);
    successors.get(sourceId).push(targetId);
  }
  const queue = nodeIds.filter((id) => indegree.get(id) === 0);
  const rankById = new Map(nodeIds.map((id) => [id, 0]));
  let visited = 0;
  while (queue.length > 0) {
    const sourceId = queue.shift();
    visited += 1;
    for (const targetId of successors.get(sourceId)) {
      rankById.set(targetId, Math.max(rankById.get(targetId), rankById.get(sourceId) + 1));
      indegree.set(targetId, indegree.get(targetId) - 1);
      if (indegree.get(targetId) === 0) queue.push(targetId);
    }
  }
  assert.equal(visited, nodeIds.length, 'Router Mermaid readability ranks cover an acyclic graph');
  const rankCounts = new Map();
  for (const rank of rankById.values()) rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
  assert.ok(Math.max(...rankCounts.values()) <= 3, 'no horizontal rank exceeds three nodes');
  assert.ok(Math.max(...rankCounts.keys()) >= 5, 'vertical flow has enough depth to avoid a flat strip');
  assert.ok(
    [...graph.labelsById.values()].flat().every((label) => [...label].length <= 24),
    'node labels remain short enough for readable vertical cards',
  );
}

function assertRouterDispatchContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.title, '路由与模型驱动分发：先过策略门，再选择唯一目的地');
  assert.equal(metadata.topic_id, 'AGT-P-05');
  assert.equal(metadata.slug, '/patterns/agt-p-05');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'advanced');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, ['agent-loop', 'model-routing', 'capability-routing']);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, ['reliability', 'safety', 'operability']);
  assert.deepEqual(metadata.tags, routerDispatchTags);
  assert.equal(metadata.summary, routerDispatchSummary);
  assert.deepEqual(metadata.depends_on, ['AGT-C-03']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-03',
    'AGT-P-01',
    'AGT-P-03',
    'AGT-P-06',
    'AGT-P-07',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/kong-ai-gateway-routing-resilience',
    '/cases/new-api-channel-pool-routing',
  ]);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(
    findMarkdownHeadings(source)
      .filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const mermaidBlocks = readerVisibleMermaidCodeBlocks(source);
  assert.equal(mermaidBlocks.length, 1, 'exactly one reader-visible Router Mermaid');
  assert.equal(mermaidBlocks[0].rootDirect, true, 'Router Mermaid remains root-direct');
  const graph = parseRouterDispatchMermaid(mermaidBlocks[0].value);
  assertRouterDispatchReadableLayout(graph);
  assert.deepEqual(graph.labelsById, routerDispatchNodes);
  assert.deepEqual(graph.edges, routerDispatchEdges);
  assert.deepEqual(
    graph.edges.filter(([, target]) => target === 'MODEL_ROUTER'),
    [['POLICY_GATE', 'MODEL_ROUTER', '策略允许']],
    'the deterministic policy gate is the only entry to model routing',
  );
  assert.deepEqual(
    graph.edges.filter(([, target]) => target === 'SELECTED_DESTINATION'),
    [['CAPABILITY_CHECK', 'SELECTED_DESTINATION', '恰好一个可用目标']],
    'exactly one selected destination can emerge from the availability check',
  );
  assert.deepEqual(
    graph.edges.filter(([, target]) => target === 'EXECUTE'),
    [['VERSION_GATE', 'EXECUTE', '版本一致']],
    'execution has one version-checked entry and cannot fan out',
  );
  assert.equal(
    graph.edges.some(([sourceId]) => sourceId === 'SAFE_STOP'),
    false,
    'safe stop is terminal',
  );

  const visible = parseMdxVisibleCopy(source, routerDispatchArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  for (const contract of [
    /策略路由/u,
    /语义分类/u,
    /能力发现/u,
    /负载[^。\n]{0,40}成本路由/u,
    /歧义输入/u,
    /目的地不可用/u,
    /版本漂移/u,
    /对抗(?:性)?路由|对抗输入/u,
    /路由级评测/u,
    /控制所有者/u,
    /状态所有者/u,
    /终止责任/u,
    /权限/u,
    /副作用/u,
    /失败[^。\n]{0,160}恢复/u,
    /确定性回退/u,
    /迁移/u,
    /流量路由[^。\n]{0,180}任务控制路由/u,
    /状态[^。\n]{0,80}失败[^。\n]{0,80}副作用[^。\n]{0,80}终止/u,
    /实现证据[^。\n]{0,180}(?:不证明|不能证明)[^。\n]{0,120}生产/u,
    /行业标准/u,
  ]) assert.match(visible, contract);
}

function assertRouterDispatchSourceContract(ledger, health) {
  const document = ledger.documents[routerDispatchArticlePath];
  assert.ok(document, `${routerDispatchArticlePath} source document`);
  assert.deepEqual(document, routerDispatchDocumentContract);
  assert.deepEqual(document.citations.map(({source_id: sourceId}) => sourceId), routerDispatchSourceIds);
  assert.deepEqual(
    Object.entries(ledger.documents)
      .flatMap(([path, item]) => item.citations
        .filter(({source_id: sourceId}) => sourceId === 'src-github-32ae2040f2fa')
        .map(({attribution_note: attributionNote}) => [path, attributionNote]))
      .sort(([left], [right]) => left.localeCompare(right)),
    [
      [
        'content/cases/new-api-channel-pool-routing.mdx',
        'service/channel_select.go, QuantumNous / New API maintainers',
      ],
      [
        routerDispatchArticlePath,
        'service/channel_select.go, QuantumNous / New API maintainers',
      ],
    ],
    'every direct citation uses the exact fixed source filename identity',
  );

  for (const contract of routerDispatchSourceContracts) {
    const source = ledger.sources.find(({id}) => id === contract.id);
    assert.ok(source, contract.id);
    const {health: _health, ...sourceContract} = contract;
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
      {...sourceContract, allowed_evidence_roles: routerDispatchAllowedRoles},
      `${contract.id} governed identity and evidence boundary`,
    );
    const observation = health.results.find(({source_ids: ids}) => ids.includes(contract.id));
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
      `${contract.id} governed health observation`,
    );
  }
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

test('AGT-P-04 publishes the exact rubric-bounded Evaluator–Optimizer contract', () => {
  assert.ok(existsSync(evaluatorOptimizerArticlePath), `Missing ${evaluatorOptimizerArticlePath}`);
  assertEvaluatorOptimizerContract(readFileSync(evaluatorOptimizerArticlePath, 'utf8'));
});

test('AGT-P-04 rejects metadata drift and hidden, duplicate, or bypass Mermaid mutations', () => {
  assert.ok(existsSync(evaluatorOptimizerArticlePath), `Missing ${evaluatorOptimizerArticlePath}`);
  const source = readFileSync(evaluatorOptimizerArticlePath, 'utf8');
  const [{value: mermaid}] = readerVisibleMermaidCodeBlocks(source);
  assert.ok(mermaid, 'Evaluator–Optimizer Mermaid fixture');
  const fence = `\`\`\`mermaid\n${mermaid}\n\`\`\``;
  const decoyFence = `\`\`\`mermaid
flowchart LR
    GENERATE["Generate"] --> ACCEPT["accept"]
\`\`\``;
  const mutations = [
    ['summary drift', source.replace(
      `summary: ${evaluatorOptimizerSummary}`,
      'summary: 结构有效但完全错误的摘要。',
    )],
    ['tag missing', source.replace('  - 独立检查\nsummary:', 'summary:')],
    ['tag reorder', source.replace(
      '  - 评估者—优化者\n  - 外部量表',
      '  - 外部量表\n  - 评估者—优化者',
    )],
    ['depends_on drift', source.replace(
      'depends_on:\n  - AGT-C-03\n  - AGT-C-06',
      'depends_on:\n  - AGT-C-03',
    )],
    ['zero reader-visible Mermaid', source.replace(fence, '')],
    ['duplicate reader-visible Mermaid', `${source}\n\n${decoyFence}\n`],
    ['only nested Mermaid', source.replace(fence, `<div>\n${fence}\n</div>`) ],
    ['only hidden Mermaid', source.replace(fence, `<div hidden>\n\n${fence}\n\n</div>`) ],
    ['accessible name drift', source.replace(
      `accTitle: ${evaluatorOptimizerMermaidAccTitle}`,
      'accTitle: 通用反馈循环',
    )],
    ['accept bypasses evaluation', source.replace(
      'GENERATE["生成候选（Generate）"] --> VERSION_HISTORY["候选与版本历史"]',
      'GENERATE["生成候选（Generate）"] --> ACCEPT["接受（accept）"]',
    )],
    ['rubric bypasses evaluation', source.replace(
      'EXTERNAL_RUBRIC["外部量表"] --> EVALUATE',
      'EXTERNAL_RUBRIC["外部量表"] --> ACCEPT',
    )],
    ['revision bypasses budget', source.replace(
      'FEEDBACK --> REVISION_BUDGET["修订预算门"]',
      'FEEDBACK --> REVISE["修订新版本（Revise）"]',
    )],
    ['uncertainty auto-accepts', source.replace(
      'EVALUATE -->|不确定或未知| HUMAN_REVIEW',
      'EVALUATE -->|不确定或未知| ACCEPT',
    )],
    ['budget exhaustion re-enters loop', source.replace(
      'REVISION_BUDGET -->|预算耗尽| BUDGET_EXHAUSTED["预算耗尽（budget exhausted）"]',
      'REVISION_BUDGET -->|预算耗尽| GENERATE',
    )],
    ['high-risk branch bypasses independent check', source.replace(
      'EVALUATE -->|高风险候选| INDEPENDENT_CHECK["高风险独立检查"]',
      'EVALUATE -->|高风险候选| ACCEPT',
    )],
    ['decoy evaluator identity', source.replace(
      'VERSION_HISTORY --> EVALUATE["评估候选（Evaluate）"]',
      'VERSION_HISTORY --> FAKE_EVALUATE["评估候选（Evaluate）"]',
    )],
    ['alternate connector creates an accept bypass', source.replace(
      'GENERATE["生成候选（Generate）"] --> VERSION_HISTORY["候选与版本历史"]',
      'GENERATE["生成候选（Generate）"] --> VERSION_HISTORY["候选与版本历史"]\n    GENERATE -.-> ACCEPT',
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
      assertEvaluatorOptimizerContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: public metadata, visibility, grammar, node identity and topology fail closed.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-04 locks source identities, health, roles, and citation boundaries', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  assertEvaluatorOptimizerSourceContract(ledger, health);
});

test('AGT-P-04 rejects source and document citation boundary drift', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  assert.ok(
    ledger.documents[evaluatorOptimizerArticlePath],
    `${evaluatorOptimizerArticlePath} source document`,
  );
  const mutateSource = (sourceId, field, value) => {
    const mutant = structuredClone(ledger);
    mutant.sources.find(({id}) => id === sourceId)[field] = value;
    return mutant;
  };
  const mutateCitation = (sourceId, field, value) => {
    const mutant = structuredClone(ledger);
    mutant.documents[evaluatorOptimizerArticlePath].citations
      .find(({source_id: id}) => id === sourceId)[field] = value;
    return mutant;
  };
  const mutations = [
    ['source title drift', mutateSource(
      'src-anthropic-demystifying-evals-ai-agents', 'title', 'Wrong title',
    ), health],
    ['source organization drift', mutateSource(
      'src-anthropic-demystifying-evals-ai-agents', 'author_or_org', 'Wrong org',
    ), health],
    ['source publication date drift', mutateSource(
      'src-anthropic-demystifying-evals-ai-agents', 'published_at', '2099-01-01',
    ), health],
    ['source version drift', mutateSource(
      'src-github-0e9e961ee207', 'version', 'Git commit deadbeef',
    ), health],
    ['source license drift', mutateSource(
      'src-github-0e9e961ee207', 'license', 'LicenseRef-Drift',
    ), health],
    ['source tier drift', mutateSource(
      'src-anthropic-building-effective-agents', 'tier', 'secondary',
    ), health],
    ['source canonical URL drift', mutateSource(
      'src-github-0e9e961ee207', 'canonical_locator', 'https://example.test/drift',
    ), health],
    ['source transport URL drift', mutateSource(
      'src-github-0e9e961ee207', 'transport_locator', 'https://example.test/drift',
    ), health],
    ['source expected-final URL drift', mutateSource(
      'src-github-0e9e961ee207', 'expected_final_transport_locator', 'https://example.test/drift',
    ), health],
    ['source role drift', mutateSource(
      'src-anthropic-building-effective-agents', 'allowed_evidence_roles', ['definition'],
    ), health],
    ['source usage boundary drift', mutateSource(
      'src-github-0e9e961ee207', 'usage_boundary', 'Proves production reliability.',
    ), health],
    ['citation URL drift', mutateCitation(
      'src-github-0e9e961ee207', 'citation_url', 'https://example.test/drift',
    ), health],
    ['citation role drift', mutateCitation(
      'src-github-0e9e961ee207', 'roles', ['definition'],
    ), health],
    ['citation usage drift', mutateCitation(
      'src-github-0e9e961ee207', 'usage_mode', 'quotation',
    ), health],
    ['citation attribution drift', mutateCitation(
      'src-github-0e9e961ee207', 'attribution_note', 'Wrong attribution',
    ), health],
    ['citation modification drift', mutateCitation(
      'src-github-0e9e961ee207', 'modification_note', 'Copied code.',
    ), health],
    ['citation excerpt drift', mutateCitation(
      'src-github-0e9e961ee207', 'excerpt', 'Copied excerpt',
    ), health],
    ['citation quotation review drift', mutateCitation(
      'src-github-0e9e961ee207', 'quotation_reviewed', true,
    ), health],
    ['document review drift', (() => {
      const mutant = structuredClone(ledger);
      mutant.documents[evaluatorOptimizerArticlePath].reviewed_at = '2026-08-26';
      return mutant;
    })(), health],
    ['document copyright drift', (() => {
      const mutant = structuredClone(ledger);
      mutant.documents[evaluatorOptimizerArticlePath].copyright_checks = ['original-structure'];
      return mutant;
    })(), health],
    ['health drift', ledger, (() => {
      const mutant = structuredClone(health);
      mutant.results.find(({source_ids: ids}) =>
        ids.includes('src-github-0e9e961ee207')).last_attempt.http_status = 200;
      return mutant;
    })()],
  ];
  const survivors = [];
  for (const [label, ledgerMutant, healthMutant] of mutations) {
    try {
      assertEvaluatorOptimizerSourceContract(ledgerMutant, healthMutant);
      survivors.push(label);
    } catch {
      // Expected: every governed source, health and citation field fails closed.
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

test('AGT-P-05 publishes the exact fail-closed Router contract', () => {
  assert.ok(existsSync(routerDispatchArticlePath), `Missing ${routerDispatchArticlePath}`);
  const source = readFileSync(routerDispatchArticlePath, 'utf8');
  assert.doesNotThrow(
    () => markdownParser.parse(extractMarkdownBody(source)),
    'the legal P05 article remains valid MDX',
  );
  assertRouterDispatchContract(source);
});

test('AGT-P-05 rejects metadata, visibility, identity, and routing-topology drift', () => {
  assert.ok(existsSync(routerDispatchArticlePath), `Missing ${routerDispatchArticlePath}`);
  const source = readFileSync(routerDispatchArticlePath, 'utf8');
  const [{value: mermaid}] = readerVisibleMermaidCodeBlocks(source);
  assert.ok(mermaid, 'Router Mermaid fixture');
  const fence = `\`\`\`mermaid\n${mermaid}\n\`\`\``;
  const decoyFence = `\`\`\`mermaid
flowchart LR
    REQUEST["待分发请求"] --> EXECUTE["受限执行"]
\`\`\``;
  const mutations = [
    ['summary drift', source.replace(
      `summary: ${routerDispatchSummary}`,
      'summary: 让模型自由选择任意多个目的地。',
    )],
    ['tag missing', source.replace('  - 确定性回退\nsummary:', 'summary:')],
    ['tag reorder', source.replace(
      '  - 路由\n  - 模型驱动分发',
      '  - 模型驱动分发\n  - 路由',
    )],
    ['depends_on drift', source.replace('depends_on:\n  - AGT-C-03', 'depends_on: []')],
    ['zero reader-visible Mermaid', source.replace(fence, '')],
    ['duplicate reader-visible Mermaid', `${source}\n\n${decoyFence}\n`],
    ['only nested Mermaid', source.replace(fence, `<div>\n${fence}\n</div>`) ],
    ['only hidden Mermaid', source.replace(fence, `<div hidden>\n\n${fence}\n\n</div>`) ],
    ['component Mermaid decoy', source.replace(fence, `<ArchitectureDiagram>\n${fence}\n</ArchitectureDiagram>`) ],
    ['accessible name drift', source.replace(
      `accTitle: ${routerDispatchMermaidAccTitle}`,
      'accTitle: 通用模型路由',
    )],
    ['policy gate bypass', source.replace(
      'REQUEST["待分发请求"] --> POLICY_GATE["确定性策略门"]',
      'REQUEST["待分发请求"] --> MODEL_ROUTER["路由模型"]',
    )],
    ['multi-destination fan-out', source.replace(
      'CAPABILITY_CHECK -->|恰好一个可用目标| SELECTED_DESTINATION["唯一选定目的地"]',
      'CAPABILITY_CHECK -->|恰好一个可用目标| SELECTED_DESTINATION["唯一选定目的地"]\n    CAPABILITY_CHECK --> EXECUTE',
    )],
    ['unknown confidence bypass', source.replace(
      'CONFIDENCE_GATE -->|未知或低置信| DETERMINISTIC_FALLBACK',
      'CONFIDENCE_GATE -->|未知或低置信| EXECUTE',
    )],
    ['unavailable destination auto-executes', source.replace(
      'CAPABILITY_CHECK -->|目标不可用或多目标冲突| DETERMINISTIC_FALLBACK',
      'CAPABILITY_CHECK -->|目标不可用或多目标冲突| EXECUTE',
    )],
    ['version drift re-enters execution', source.replace(
      'VERSION_GATE -->|版本漂移| DETERMINISTIC_FALLBACK',
      'VERSION_GATE -->|版本漂移| EXECUTE',
    )],
    ['adversarial input bypasses safe stop', source.replace(
      'POLICY_GATE -->|策略拒绝或对抗输入| SAFE_STOP',
      'POLICY_GATE -->|策略拒绝或对抗输入| MODEL_ROUTER',
    )],
    ['alternate connector bypass', source.replace(
      'REQUEST["待分发请求"] --> POLICY_GATE["确定性策略门"]',
      'REQUEST["待分发请求"] --> POLICY_GATE["确定性策略门"]\n    REQUEST -.-> EXECUTE',
    )],
    ['alternate label bypass', source.replace(
      'CONFIDENCE_GATE -->|未知或低置信| DETERMINISTIC_FALLBACK',
      'CONFIDENCE_GATE -->|高置信| DETERMINISTIC_FALLBACK',
    )],
    ['complete terminal re-enters model routing', source.replace(
      'VERIFY -->|结果已确认| COMPLETE["完成"]',
      'VERIFY -->|结果已确认| COMPLETE["完成"]\n    COMPLETE --> MODEL_ROUTER',
    )],
    ['safe-stop terminal re-enters model routing', source.replace(
      'POLICY_GATE -->|策略拒绝或对抗输入| SAFE_STOP["安全停止"]',
      'POLICY_GATE -->|策略拒绝或对抗输入| SAFE_STOP["安全停止"]\n    SAFE_STOP --> MODEL_ROUTER',
    )],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.doesNotThrow(
      () => markdownParser.parse(extractMarkdownBody(mutant)),
      `${label} fixture remains syntactically valid MDX`,
    );
    try {
      assertRouterDispatchContract(mutant);
      survivors.push(label);
    } catch {
      // Expected: exact public metadata, visibility, node identity, labels and topology fail closed.
    }
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-05 locks governed source identities, health, roles, and document boundaries', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  assertRouterDispatchSourceContract(ledger, health);
});

test('AGT-P-05 rejects every governed source and citation boundary drift', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const mutateSource = (sourceId, field, value) => {
    const mutant = structuredClone(ledger);
    mutant.sources.find(({id}) => id === sourceId)[field] = value;
    return mutant;
  };
  const mutateCitation = (sourceId, field, value) => {
    const mutant = structuredClone(ledger);
    mutant.documents[routerDispatchArticlePath].citations
      .find(({source_id: id}) => id === sourceId)[field] = value;
    return mutant;
  };
  const mutations = [
    ['source title drift', mutateSource('src-github-199e95b0a693', 'title', 'Wrong title'), health],
    ['source organization drift', mutateSource('src-github-ee60ab199780', 'author_or_org', 'Wrong org'), health],
    ['source date drift', mutateSource('src-github-32ae2040f2fa', 'published_at', '2099-01-01'), health],
    ['source version drift', mutateSource('src-github-199e95b0a693', 'version', 'Git commit deadbeef'), health],
    ['source license drift', mutateSource('src-github-32ae2040f2fa', 'license', 'MIT'), health],
    ['source tier drift', mutateSource('src-github-ee60ab199780', 'tier', 'secondary'), health],
    ['source canonical drift', mutateSource('src-github-199e95b0a693', 'canonical_locator', 'https://example.test/drift'), health],
    ['source transport drift', mutateSource('src-github-ee60ab199780', 'transport_locator', 'https://example.test/drift'), health],
    ['source expected-final drift', mutateSource('src-github-32ae2040f2fa', 'expected_final_transport_locator', 'https://example.test/drift'), health],
    ['source role drift', mutateSource('src-github-199e95b0a693', 'allowed_evidence_roles', ['implementation']), health],
    ['source usage boundary drift', mutateSource('src-github-ee60ab199780', 'usage_boundary', 'Proves all production guarantees.'), health],
    ['citation URL drift', mutateCitation('src-github-199e95b0a693', 'citation_url', 'https://example.test/drift'), health],
    ['citation role drift', mutateCitation('src-github-ee60ab199780', 'roles', ['implementation']), health],
    ['citation usage drift', mutateCitation('src-github-32ae2040f2fa', 'usage_mode', 'quotation'), health],
    ['citation attribution drift', mutateCitation('src-github-199e95b0a693', 'attribution_note', 'Wrong attribution'), health],
    ['citation modification drift', mutateCitation('src-github-ee60ab199780', 'modification_note', 'Copied source.'), health],
    ['citation excerpt drift', mutateCitation('src-github-32ae2040f2fa', 'excerpt', 'Copied excerpt'), health],
    ['citation quotation-review drift', mutateCitation('src-github-199e95b0a693', 'quotation_reviewed', true), health],
    ['document review drift', (() => {
      const mutant = structuredClone(ledger);
      mutant.documents[routerDispatchArticlePath].reviewed_at = '2026-08-26';
      return mutant;
    })(), health],
    ['document copyright drift', (() => {
      const mutant = structuredClone(ledger);
      mutant.documents[routerDispatchArticlePath].copyright_checks = ['original-structure'];
      return mutant;
    })(), health],
    ['health drift', ledger, (() => {
      const mutant = structuredClone(health);
      mutant.results.find(({source_ids: ids}) => ids.includes('src-github-199e95b0a693'))
        .last_attempt.final_transport_locator = 'https://example.test/drift';
      return mutant;
    })()],
  ];
  const survivors = [];
  for (const [label, ledgerMutant, healthMutant] of mutations) {
    try {
      assertRouterDispatchSourceContract(ledgerMutant, healthMutant);
      survivors.push(label);
    } catch {
      // Expected: every governed source, observation and document field fails closed.
    }
  }
  assert.deepEqual(survivors, []);
});

function assertControlOwnershipArticleContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.title, '智能体（Agent）的监督者（Supervisor）、移交（Handoff）与智能体作为工具（Agents as Tools）：先决定控制权归谁');
  assert.equal(metadata.slug, '/patterns/agt-p-06');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'advanced');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.topic_id, 'AGT-P-06');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, [
    'supervisor', 'handoff', 'agents-as-tools',
  ]);
  assert.deepEqual(metadata.protocols, ['a2a']);
  assert.deepEqual(metadata.quality_attributes, ['reliability', 'safety', 'operability']);
  assert.deepEqual(metadata.tags, controlOwnershipTags);
  assert.equal(metadata.summary, controlOwnershipSummary);
  assert.deepEqual(metadata.depends_on, ['AGT-C-02', 'AGT-C-03', 'AGT-C-04']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-02', 'AGT-C-03', 'AGT-C-04', 'AGT-P-01', 'AGT-P-05', 'AGT-P-07', 'AGT-P-08',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/openai-agents-sdk',
    '/cases/langgraph-supervisor',
    '/cases/google-adk-a2a',
    '/cases/microsoft-multi-agent-reference-architecture',
  ]);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(
    findMarkdownHeadings(source).filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const {body, tables} = readerVisibleTables(source);
  const matrices = tables.filter(({rows: [header]}) =>
    header?.[0] === controlOwnershipMatrixHeader[0]);
  assert.equal(matrices.length, 1, 'exactly one reader-visible control ownership matrix');
  const [{node, rows: [header, ...rows]}] = matrices;
  assertPhysicalTable(body, node, controlOwnershipMatrixCells.length, 6, 'control ownership matrix');
  assert.deepEqual(header, controlOwnershipMatrixHeader);
  assert.deepEqual(rows, controlOwnershipMatrixCells);

  assert.match(
    source,
    /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';[\s\S]*<div className="architecture-diagram-scroll" role="region" aria-label="三种多智能体控制权模型，可使用左右方向键及首尾键横向滚动" tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}>[\s\S]*!\[[^\]]+\]\(\/img\/diagrams\/agt-p-06-control-ownership-models\.svg\)[\s\S]*<\/div>/u,
  );
  assert.equal(
    [...source.matchAll(/\/img\/diagrams\/agt-p-06-control-ownership-models\.svg/gu)].length,
    1,
  );
  assert.doesNotMatch(source, /```mermaid/u);

  const visible = parseMdxVisibleCopy(source, controlOwnershipArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  for (const contract of [
    /监督者[\s\S]*反复委派[\s\S]*保留全局控制/u,
    /移交[\s\S]*(?:转移|移动)[\s\S]*(?:当前|活动)会话[\s\S]*控制权/u,
    /智能体作为工具[\s\S]*有界子任务[\s\S]*返回[\s\S]*父智能体/u,
    /混合拓扑/u, /上下文泄漏/u, /乒乓移交/u, /监督者瓶颈/u, /人工升级/u,
    /控制所有者/u, /状态所有者/u, /权限/u, /副作用/u, /终止/u,
    /失败[\s\S]*恢复/u, /确定性回退/u, /迁移/u,
    /A2A[\s\S]*(?:互操作|通信)[\s\S]*(?:不证明|不等于)[\s\S]*(?:授权|权限)/u,
    /实现证据[\s\S]*(?:不证明|不能证明)[\s\S]*生产/u,
  ]) assert.match(visible, contract);
}

function assertControlOwnershipDiagramPair(drawio, svg) {
  assertControlOwnershipDiagramGeometry(drawio, svg);
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<svg\b(?=[^>]*viewBox="0 0 1200 720")(?=[^>]*role="img")(?=[^>]*aria-labelledby="agt-p-06-title agt-p-06-desc")(?![^>]*\bwidth=)(?![^>]*\bheight=)[^>]*>/u);
  assert.match(svg, /<title id="agt-p-06-title">[^<]+<\/title>/u);
  assert.match(svg, /<desc id="agt-p-06-desc">[^<]+<\/desc>/u);
  assert.match(svg, /<g transform="translate\(19 29\)">/u);
  for (const label of controlOwnershipRequiredLabels) {
    const escapedXml = label.replaceAll('&', '&amp;');
    const escapedRegex = escapedXml.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    assert.match(drawio, new RegExp(`\\bvalue="${escapedRegex}"`, 'u'));
    assert.match(svg, new RegExp(`>${escapedRegex}<`, 'u'));
  }
  for (const [id, label] of [
    ['supervisor-region', '1 · Supervisor：保留控制'],
    ['handoff-region', '2 · Handoff：移动控制'],
    ['tool-region', '3 · Agent as Tool'],
  ]) {
    assert.match(drawio, new RegExp(`id="${id}"[^>]*value="${label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"`, 'u'));
    assert.match(svg, new RegExp(`data-region-id="${id}"`, 'u'));
    assert.match(svg, new RegExp(`>${label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}<`, 'u'));
  }
  for (const [edgeId, sourceId, targetId, label] of [
    ['edge-supervisor-delegate', 'supervisor', 'worker', '反复委派'],
    ['edge-worker-return', 'worker', 'supervisor', '结构化结果返回'],
    ['edge-handoff-move', 'handoff', 'active-agent', '当前会话与控制权移动'],
    ['edge-parent-call', 'parent-agent', 'agent-as-tool', '调用有界子任务'],
    ['edge-tool-return', 'agent-as-tool', 'parent-agent', '结果返回 Parent'],
  ]) {
    assert.match(drawio, new RegExp(`id="${edgeId}"[^>]*value="${label}"[^>]*source="${sourceId}" target="${targetId}"`, 'u'));
    assert.match(svg, new RegExp(`data-edge-id="${edgeId}" data-source="${sourceId}" data-target="${targetId}"`, 'u'));
    assert.match(svg, new RegExp(`data-edge-label-for="${edgeId}"[^>]*data-stroke-clearance-css="8"[^>]*data-arrow-clearance-css="16"[^>]*data-node-clearance-css="12"`, 'u'));
  }
  for (const [nodeId, x, y, width, height, titleY, typeY] of [
    ['supervisor', '60', '150', '280', '110', '190', '230'],
    ['worker', '60', '440', '280', '110', '480', '520'],
    ['handoff', '460', '150', '280', '110', '190', '230'],
    ['active-agent', '460', '440', '280', '110', '480', '520'],
    ['parent-agent', '860', '150', '280', '110', '190', '230'],
    ['agent-as-tool', '860', '440', '280', '110', '480', '520'],
  ]) {
    assert.match(drawio, new RegExp(`id="${nodeId}"[\\s\\S]*?<mxGeometry x="${x}" y="${y}" width="${width}" height="${height}"`, 'u'));
    // diagrams.net's drawing-bounds export preserves authoring scale and crops
    // nineteen units horizontally and twenty-nine vertically; lock that real
    // export transform rather than trusting mirrored data attributes.
    const exportedX = String(Number(x) - 19);
    const exportedY = String(Number(y) - 29);
    assert.match(svg, new RegExp(`data-node-id="${nodeId}"[^>]*data-padding-horizontal-css="16"[^>]*data-padding-vertical-css="14"[^>]*x="${exportedX}" y="${exportedY}" width="${width}" height="${height}"`, 'u'));
    assert.match(svg, new RegExp(`data-title-for="${nodeId}"[^>]*y="${titleY}"`, 'u'));
    assert.match(svg, new RegExp(`data-type-for="${nodeId}"[^>]*data-bottom-clearance-css="20"[^>]*y="${Number(typeY) - 29}"`, 'u'));
  }
}

function assertControlOwnershipSources(ledger, health) {
  assert.deepEqual(ledger.documents[controlOwnershipArticlePath], controlOwnershipDocumentContract);
  assert.deepEqual(
    ledger.documents[controlOwnershipArticlePath].citations.map(({source_id: id}) => id),
    controlOwnershipSourceIds,
  );
  for (const contract of controlOwnershipSourceContracts) {
    const source = ledger.sources.find(({id}) => id === contract.id);
    assert.ok(source, contract.id);
    assert.deepEqual({
      canonical_locator: source.canonical_locator,
      transport_locator: source.transport_locator,
      expected_final_transport_locator: source.expected_final_transport_locator,
      title: source.title, author: source.author_or_org, published_at: source.published_at,
      version: source.version, kind: source.source_kind, tier: source.tier,
      roles: source.allowed_evidence_roles, license: source.license, usage: source.usage_boundary,
    }, {
      canonical_locator: contract.locator,
      transport_locator: contract.locator,
      expected_final_transport_locator: contract.locator,
      title: contract.title, author: contract.author, published_at: null,
      version: contract.version, kind: contract.kind, tier: contract.tier,
      roles: controlOwnershipAllowedRoles, license: contract.license, usage: contract.usage,
    });
    const observation = health.results.find(({source_ids: ids}) => ids.includes(contract.id));
    assert.ok(observation, `${contract.id} health`);
    assert.deepEqual({
      transport_locator: observation.transport_locator,
      source_ids: observation.source_ids,
      last_attempt: observation.last_attempt,
      last_success: observation.last_success,
      review_status: observation.review_status,
    }, {
      transport_locator: contract.locator,
      source_ids: [contract.id],
      last_attempt: {at: '2026-08-25T12:07:24.531Z', outcome: 'healthy', final_transport_locator: contract.locator, http_status: 206, login_wall_detected: false, redirects: []},
      last_success: {at: '2026-08-25T12:07:24.531Z', outcome: 'healthy', final_transport_locator: contract.locator, http_status: 206, login_wall_detected: false},
      review_status: 'healthy',
    });
  }
  const original = ledger.sources.find(({id}) =>
    id === 'src-atlas-agt-p-06-control-ownership-models');
  assert.deepEqual(original, {
    id: 'src-atlas-agt-p-06-control-ownership-models',
    canonical_locator: '/img/diagrams/agt-p-06-control-ownership-models.svg',
    transport_locator: '/img/diagrams/agt-p-06-control-ownership-models.svg',
    query_insensitive: false, locator_aliases: [], tombstone: null,
    title: 'Multi-agent control ownership models', author_or_org: 'Tego Arch maintainers',
    published_at: '2026-08-27', registered_at: '2026-08-27', checked_at: '2026-08-27',
    version: 'Original synchronized Draw.io/SVG pair authored, exported and deterministically checked on 2026-08-27',
    source_kind: 'original-illustration', tier: 'primary', allowed_evidence_roles: ['illustration'],
    license: 'LicenseRef-Atlas-Original',
    license_scope: 'The named project-authored agt-p-06-control-ownership-models.svg asset only',
    license_evidence_url: 'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/agt-p-06-control-ownership-models.svg',
    license_evidence_note: 'The project-authored Draw.io/SVG pair contains no third-party topology, reference image, icon, brand visual, signature, watermark or copied composition.',
    license_family_id: '/img/diagrams/agt-p-06-control-ownership-models.svg',
    license_family_grouping: 'identity', family_grouping_evidence_url: null,
    copyright_policy: 'original-atlas',
    usage_boundary: 'Original comparison of Supervisor, Handoff and Agent-as-Tool control, conversation ownership and return semantics; illustration-only and not evidence of protocol conformance, authorization, reliability, governance or production outcomes.',
    link_policy: null,
    expected_final_transport_locator: '/img/diagrams/agt-p-06-control-ownership-models.svg',
    expected_final_approved_at: '2026-08-27',
    expected_final_approval_note: 'Approved project-local original illustration after synchronized Draw.io/SVG semantic, geometry, accessibility and deterministic pair validation on 2026-08-27.',
  });
}

test('AGT-P-06 publishes the exact control ownership matrix and synchronized diagram', () => {
  assert.ok(existsSync(controlOwnershipArticlePath), `Missing ${controlOwnershipArticlePath}`);
  assert.ok(existsSync(controlOwnershipDrawioPath), `Missing ${controlOwnershipDrawioPath}`);
  assert.ok(existsSync(controlOwnershipSvgPath), `Missing ${controlOwnershipSvgPath}`);
  const source = readFileSync(controlOwnershipArticlePath, 'utf8');
  assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(source)));
  assertControlOwnershipArticleContract(source);
  assertControlOwnershipDiagramPair(
    readFileSync(controlOwnershipDrawioPath, 'utf8'),
    readFileSync(controlOwnershipSvgPath, 'utf8'),
  );
});

test('AGT-P-06 locks source identities, evidence boundaries, health and original illustration rights', () => {
  assertControlOwnershipSources(
    JSON.parse(readFileSync('data/source-ledger.json', 'utf8')),
    JSON.parse(readFileSync('data/source-link-health.json', 'utf8')),
  );
});

test('AGT-P-06 rejects metadata and exact matrix-cell drift without rejecting legal MDX', () => {
  const source = readFileSync(controlOwnershipArticlePath, 'utf8');
  const legal = `${source}\n\n<aside>补充说明：拓扑选择仍须服从同一运行预算。</aside>\n`;
  assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(legal)));
  assert.doesNotThrow(() => assertControlOwnershipArticleContract(legal));
  const mutations = [
    source.replace(`summary: ${controlOwnershipSummary}`, 'summary: 三种模式可以自由混用。'),
    source.replace('  - 控制权所有权\n  - 多智能体', '  - 多智能体\n  - 控制权所有权'),
    source.replace('depends_on:\n  - AGT-C-02\n  - AGT-C-03\n  - AGT-C-04', 'depends_on:\n  - AGT-C-03'),
    source.replace('| 下一步控制者 |', '| 谁决定 |'),
    source.replaceAll('Supervisor；可在全局预算内反复委派', 'Worker Agent 自行决定'),
    source.replaceAll('当前会话不返回原智能体；由 Active Agent 继续', '结果返回原智能体'),
    source.replaceAll('有界子任务结果返回 Parent Agent', '工具智能体直接回复用户'),
    source.replace('className="architecture-diagram-scroll"', 'className="diagram"'),
  ];
  const survivors = [];
  for (const [index, mutant] of mutations.entries()) {
    assert.notEqual(mutant, source);
    assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(mutant)));
    try { assertControlOwnershipArticleContract(mutant); survivors.push(index); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-06 diagram pair fails closed on missing, drifted, inaccessible, or cramped assets', () => {
  const drawio = readFileSync(controlOwnershipDrawioPath, 'utf8');
  const svg = readFileSync(controlOwnershipSvgPath, 'utf8');
  assert.doesNotThrow(() => assertControlOwnershipDiagramPair(drawio, svg));
  const mutations = [
    ['missing SVG', drawio, ''],
    ['Draw.io label drift', drawio.replace('value="Worker Agent"', 'value="Worker"'), svg],
    ['SVG label drift', drawio, svg.replace('>Active Agent<', '>Active Worker<')],
    ['region drift', drawio, svg.replace('data-region-id="tool-region"', 'data-region-id="other-region"')],
    ['pair topology drift', drawio, svg.replace('data-target="worker"', 'data-target="active-agent"')],
    ['accessibility drift', drawio, svg.replace(' role="img"', '')],
    ['width drift', drawio, svg.replace('viewBox="0 0 1200 720"', 'viewBox="0 0 1199 720"')],
    ['embedded source hash drift', drawio, svg.replace(/data-drawio-sha256="[a-f0-9]{64}"/u, `data-drawio-sha256="${'0'.repeat(64)}"`)],
    ['padding drift', drawio, svg.replace('data-padding-horizontal-css="16"', 'data-padding-horizontal-css="15"')],
    ['label clearance drift', drawio, svg.replace('data-arrow-clearance-css="16"', 'data-arrow-clearance-css="15"')],
    ['direction drift', drawio.replace('source="agent-as-tool" target="parent-agent"', 'source="parent-agent" target="agent-as-tool"'), svg],
    ['Draw.io third-region width drift', drawio.replace('x="820" y="30" width="360" height="650"', 'x="820" y="30" width="300" height="650"'), svg],
    ['SVG handoff path drift with data preserved', drawio, svg.replace('d="M 455 231 L 455 396.53"', 'd="M 500 231 L 500 396.53"')],
    ['SVG third-title shift with data preserved', drawio, svg.replace('data-region-label-for="tool-region" x="846"', 'data-region-label-for="tool-region" x="1000"')],
    ['SVG third-region width drift with data preserved', drawio, svg.replace('data-region-id="tool-region" x="801" y="1" width="360"', 'data-region-id="tool-region" x="801" y="1" width="300"')],
    ['SVG edge-label overlap with clearance data preserved', drawio, svg.replace('data-edge-label-for="edge-handoff-move" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" text-anchor="middle" font-size="24" textLength="234" lengthAdjust="spacingAndGlyphs" x="600"', 'data-edge-label-for="edge-handoff-move" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" text-anchor="middle" font-size="24" textLength="234" lengthAdjust="spacingAndGlyphs" x="455"')],
  ];
  const survivors = [];
  for (const [label, drawioMutant, svgMutant] of mutations) {
    assert.ok(drawioMutant !== drawio || svgMutant !== svg, `${label} must mutate the pair`);
    try { assertControlOwnershipDiagramPair(drawioMutant, svgMutant); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-06 source governance rejects identity, license, citation, document and health drift', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  const mutations = [];
  for (const [sourceId, field, value] of [
    ['src-github-ef3d4ce19335', 'canonical_locator', 'https://example.test/drift'],
    ['src-github-f832ac155523', 'allowed_evidence_roles', ['implementation']],
    ['src-github-bb9d33890d3e', 'license', 'MIT'],
    ['src-github-70740975c052', 'usage_boundary', 'Proves production outcomes.'],
    ['src-atlas-agt-p-06-control-ownership-models', 'version', 'Untracked asset'],
  ]) {
    const mutant = structuredClone(ledger);
    mutant.sources.find(({id}) => id === sourceId)[field] = value;
    mutations.push([`${sourceId} ${field}`, mutant, health]);
  }
  const citationMutant = structuredClone(ledger);
  citationMutant.documents[controlOwnershipArticlePath].citations[0].roles = ['definition'];
  mutations.push(['citation role', citationMutant, health]);
  const documentMutant = structuredClone(ledger);
  documentMutant.documents[controlOwnershipArticlePath].reviewed_at = '2099-01-01';
  mutations.push(['document review', documentMutant, health]);
  const healthMutant = structuredClone(health);
  healthMutant.results.find(({source_ids: ids}) => ids.includes('src-github-f832ac155523'))
    .last_attempt.http_status = 200;
  mutations.push(['source health', ledger, healthMutant]);
  const survivors = [];
  for (const [label, ledgerMutant, healthState] of mutations) {
    try { assertControlOwnershipSources(ledgerMutant, healthState); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

const orchestratorWorkersArticlePath =
  'content/patterns/agt-p-07-orchestrator-workers-fanout-fanin.mdx';
const orchestratorWorkersSummary =
  '由编排者动态分解未知子任务，以稳定任务标识、任务账本、并发预算和隔离上下文约束三个有界工作者，再经扇入、去重与冲突解决形成完整、部分或预算耗尽终态。';
const orchestratorWorkersTags = [
  '编排者–工作者',
  '扇出/扇入',
  '动态分解',
  '任务账本',
  '冲突解决',
];
const orchestratorWorkersMermaidAccTitle =
  '编排者动态分解、三个有界工作者、扇入冲突解决与三类终止控制流';
const orchestratorWorkersNodes = new Map([
  ['REQUEST', ['受控任务请求']],
  ['ORCHESTRATOR', ['编排者（Orchestrator）']],
  ['TASK_LEDGER', ['任务账本（Task ledger）']],
  ['CONCURRENCY_BUDGET', ['并发与总预算门']],
  ['WORKER_A', ['有界工作者甲']],
  ['WORKER_B', ['有界工作者乙']],
  ['WORKER_C', ['有界工作者丙']],
  ['FAN_IN', ['扇入（Fan-in）']],
  ['DUPLICATE_SUPPRESSION', ['重复抑制']],
  ['CONFLICT_RESOLVER', ['冲突解决器（Conflict resolver）']],
  ['COMPLETE', ['完整（complete）']],
  ['PARTIAL', ['部分（partial）']],
  ['BUDGET_EXHAUSTED', ['预算耗尽（budget exhausted）']],
]);
const orchestratorWorkersEdges = [
  ['REQUEST', 'ORCHESTRATOR', null],
  ['ORCHESTRATOR', 'TASK_LEDGER', '动态分解与登记'],
  ['TASK_LEDGER', 'CONCURRENCY_BUDGET', '待执行子任务'],
  ['CONCURRENCY_BUDGET', 'WORKER_A', '槽位甲'],
  ['CONCURRENCY_BUDGET', 'WORKER_B', '槽位乙'],
  ['CONCURRENCY_BUDGET', 'WORKER_C', '槽位丙'],
  ['CONCURRENCY_BUDGET', 'BUDGET_EXHAUSTED', '总预算耗尽'],
  ['WORKER_A', 'FAN_IN', '结构化结果'],
  ['WORKER_B', 'FAN_IN', '结构化结果'],
  ['WORKER_C', 'FAN_IN', '结构化结果'],
  ['FAN_IN', 'DUPLICATE_SUPPRESSION', null],
  ['DUPLICATE_SUPPRESSION', 'COMPLETE', '齐全且一致'],
  ['DUPLICATE_SUPPRESSION', 'PARTIAL', '缺失但策略允许'],
  ['DUPLICATE_SUPPRESSION', 'CONFLICT_RESOLVER', '结果冲突'],
  ['CONFLICT_RESOLVER', 'COMPLETE', '冲突已解决'],
  ['CONFLICT_RESOLVER', 'PARTIAL', '未解决且允许部分'],
  ['CONFLICT_RESOLVER', 'BUDGET_EXHAUSTED', '解决预算耗尽'],
];
const orchestratorWorkersSourceIds = [
  'src-anthropic-building-effective-agents',
  'src-github-4d3dfe89f2a4',
  'src-github-fe00e370c994',
];
const orchestratorWorkersDocumentContract = {
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
      modification_note: 'Original Chinese synthesis of parallelization and orchestrator–workers boundaries; no source prose, examples, structure, taxonomy layout or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-4d3dfe89f2a4',
      citation_url: 'https://github.com/microsoft/multi-agent-reference-architecture/blob/ed3613b54b46b595dd223aaff8772def376a8c37/docs/building-blocks/Building-Blocks.md',
      roles: ['case-evidence', 'comparison'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'Building Blocks at fixed commit, Microsoft',
      modification_note: 'Original Chinese comparison with the reference architecture orchestrator and specialist-agent boundary; no source prose, examples, tables, structure or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
    {
      source_id: 'src-github-fe00e370c994',
      citation_url: 'https://github.com/awslabs/cli-agent-orchestrator/blob/bae80071a17e001380367c461b32d64bc6b54433/README.md',
      roles: ['case-evidence', 'implementation'],
      manifest_primary: false,
      usage_mode: 'facts-summary',
      attribution_note: 'CLI Agent Orchestrator README at fixed commit, Amazon Web Services',
      modification_note: 'Bounded implementation-evidence summary of supervisor–worker assignment and isolated terminal sessions; no source prose, code, examples, structure or diagrams copied.',
      excerpt: null,
      quotation_reviewed: false,
    },
  ],
};

function parseOrchestratorWorkersMermaid(mermaid) {
  const labelsById = new Map();
  const edges = [];
  let direction = null;
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
    if (direction === null && /^flowchart\s+(?:TB|LR)$/u.test(statement)) {
      direction = statement.slice('flowchart '.length);
      continue;
    }
    if (statement.startsWith('accTitle:')) {
      assert.equal(accTitle, null, 'Orchestrator–Workers Mermaid has one accTitle');
      accTitle = statement.slice('accTitle:'.length).trim();
      continue;
    }
    assert.match(statement, edgeStatement, `unparsed Orchestrator–Workers Mermaid: ${line}`);
    const parts = statement.split(/\s*-->(?:\|([^|\n]+)\|)?\s*/u);
    const nodeSegments = [];
    const edgeLabels = [];
    for (let index = 0; index < parts.length; index += 2) {
      nodeSegments.push(parts[index]);
      if (index + 1 < parts.length) edgeLabels.push(parts[index + 1] ?? null);
    }
    const nodeIds = nodeSegments.map((segment) => {
      const match = segment.match(nodeSegment);
      assert.ok(match, `unparsed Orchestrator–Workers node: ${segment}`);
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
  assert.equal(direction, 'TB', 'Orchestrator–Workers Mermaid uses readable vertical flow');
  assert.equal(accTitle, orchestratorWorkersMermaidAccTitle);
  return {
    labelsById: new Map([...labelsById].map(([id, labels]) => [id, [...labels].sort()])),
    edges,
  };
}

function assertOrchestratorWorkersArticleContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.title, '编排者–工作者与扇出/扇入：并行不是无界广播');
  assert.equal(metadata.slug, '/patterns/agt-p-07');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'advanced');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.topic_id, 'AGT-P-07');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, [
    'agent-loop', 'orchestrator-workers', 'fan-out-fan-in',
  ]);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, [
    'performance', 'reliability', 'safety', 'operability',
  ]);
  assert.deepEqual(metadata.tags, orchestratorWorkersTags);
  assert.equal(metadata.summary, orchestratorWorkersSummary);
  assert.deepEqual(metadata.depends_on, ['AGT-C-03', 'AGT-C-04']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-03', 'AGT-C-04', 'AGT-P-01', 'AGT-P-02', 'AGT-P-03', 'AGT-P-04',
    'AGT-P-05', 'AGT-P-06', 'AGT-P-08',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/multi-agent-research-system',
    '/cases/aws-cli-agent-orchestrator',
    '/cases/microsoft-multi-agent-reference-architecture',
  ]);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(
    findMarkdownHeadings(source).filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const mermaidBlocks = readerVisibleMermaidCodeBlocks(source);
  assert.equal(mermaidBlocks.length, 1, 'exactly one reader-visible Orchestrator–Workers Mermaid');
  assert.equal(mermaidBlocks[0].rootDirect, true, 'Orchestrator–Workers Mermaid remains root-direct');
  const graph = parseOrchestratorWorkersMermaid(mermaidBlocks[0].value);
  assert.deepEqual(graph.labelsById, orchestratorWorkersNodes);
  assert.deepEqual(graph.edges, orchestratorWorkersEdges);
  assert.deepEqual(
    graph.edges.filter(([sourceId, targetId]) =>
      sourceId === 'CONCURRENCY_BUDGET' && /^WORKER_[ABC]$/u.test(targetId)),
    [
      ['CONCURRENCY_BUDGET', 'WORKER_A', '槽位甲'],
      ['CONCURRENCY_BUDGET', 'WORKER_B', '槽位乙'],
      ['CONCURRENCY_BUDGET', 'WORKER_C', '槽位丙'],
    ],
    'fan-out is exactly three bounded worker slots',
  );
  for (const terminal of ['COMPLETE', 'PARTIAL', 'BUDGET_EXHAUSTED']) {
    assert.equal(graph.edges.some(([sourceId]) => sourceId === terminal), false, `${terminal} is terminal`);
  }

  const visible = parseMdxVisibleCopy(source, orchestratorWorkersArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  for (const contract of [
    /动态(?:任务)?分解[^。\n]{0,180}静态并行/u,
    /稳定任务(?:标识| ID)/u,
    /并发预算/u,
    /隔离[^。\n]{0,80}工作者[^。\n]{0,80}上下文|工作者[^。\n]{0,80}上下文[^。\n]{0,80}隔离/u,
    /重复抑制/u,
    /部分结果策略/u,
    /冲突解决/u,
    /取消传播/u,
    /控制所有者/u,
    /状态所有者/u,
    /权限/u,
    /副作用/u,
    /终止责任/u,
    /失败[^。\n]{0,180}恢复/u,
    /质量属性/u,
    /迁移/u,
    /确定性回退/u,
    /实现证据[^。\n]{0,180}(?:不证明|不能证明)[^。\n]{0,100}生产/u,
  ]) assert.match(visible, contract);
  assert.match(
    visible,
    /Anthropic[^。\n]{0,160}并行化[^。\n]{0,160}编排者[–—-]工作者/u,
    'reader-visible copy attributes the two pattern descriptions to Anthropic',
  );
  assert.match(
    visible,
    /Anthropic[^。\n]{0,240}(?:不是|不构成|并非)行业标准/u,
    'reader-visible Anthropic attribution remains bounded as non-standard guidance',
  );
}

function assertOrchestratorWorkersSourceContract(ledger) {
  assert.deepEqual(
    ledger.documents[orchestratorWorkersArticlePath],
    orchestratorWorkersDocumentContract,
  );
  assert.deepEqual(
    ledger.documents[orchestratorWorkersArticlePath].citations.map(({source_id: id}) => id),
    orchestratorWorkersSourceIds,
  );
  const expectedSources = [
    ['src-anthropic-building-effective-agents', 'Building Effective Agents', 'Anthropic', 'official-docs', 'first-party', 'LicenseRef-All-Rights-Reserved'],
    ['src-github-4d3dfe89f2a4', 'Building Blocks', 'Microsoft', 'source-code', 'primary', 'MIT'],
    ['src-github-fe00e370c994', 'README.md', 'Amazon Web Services', 'source-code', 'primary', 'Apache-2.0'],
  ];
  for (const [id, title, author, kind, tier, license] of expectedSources) {
    const source = ledger.sources.find((candidate) => candidate.id === id);
    assert.ok(source, id);
    assert.deepEqual(
      [source.id, source.title, source.author_or_org, source.source_kind, source.tier, source.license],
      [id, title, author, kind, tier, license],
    );
    assert.match(source.usage_boundary, /(?:does not|it does not)/u);
  }
}

test('AGT-P-07 publishes exact bounded fan-out, fan-in, conflict and terminal semantics', () => {
  assert.ok(existsSync(orchestratorWorkersArticlePath), `Missing ${orchestratorWorkersArticlePath}`);
  const source = readFileSync(orchestratorWorkersArticlePath, 'utf8');
  assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(source)));
  assertOrchestratorWorkersArticleContract(source);
});

test('AGT-P-07 fails closed on hidden, duplicate, bypass and unbounded Mermaid mutations', () => {
  const source = readFileSync(orchestratorWorkersArticlePath, 'utf8');
  const mermaid = readerVisibleMermaidCodeBlocks(source)[0].value;
  const fence = `\`\`\`mermaid\n${mermaid}\n\`\`\``;
  const mutations = [
    ['zero Mermaid', source.replace(fence, '')],
    ['duplicate Mermaid', `${source}\n\n${fence}\n`],
    ['nested Mermaid', source.replace(fence, `<div>\n${fence}\n</div>`) ],
    ['hidden Mermaid', source.replace(fence, `<div hidden>\n\n${fence}\n\n</div>`) ],
    ['dynamic decomposition bypass', source.replace(
      'ORCHESTRATOR -->|动态分解与登记| TASK_LEDGER',
      'ORCHESTRATOR -->|动态分解与登记| CONCURRENCY_BUDGET',
    )],
    ['fourth worker', source.replace(
      'CONCURRENCY_BUDGET -->|槽位丙| WORKER_C["有界工作者丙"]',
      'CONCURRENCY_BUDGET -->|槽位丙| WORKER_C["有界工作者丙"]\n    CONCURRENCY_BUDGET --> WORKER_D["无界工作者丁"]',
    )],
    ['worker bypasses fan-in', source.replace(
      'WORKER_C -->|结构化结果| FAN_IN',
      'WORKER_C -->|结构化结果| COMPLETE',
    )],
    ['conflict bypasses resolver', source.replace(
      'DUPLICATE_SUPPRESSION -->|结果冲突| CONFLICT_RESOLVER',
      'DUPLICATE_SUPPRESSION -->|结果冲突| COMPLETE',
    )],
    ['complete re-enters orchestration', source.replace(
      'CONFLICT_RESOLVER -->|冲突已解决| COMPLETE',
      'CONFLICT_RESOLVER -->|冲突已解决| COMPLETE\n    COMPLETE --> ORCHESTRATOR',
    )],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture mutates article`);
    assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(mutant)));
    try { assertOrchestratorWorkersArticleContract(mutant); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-07 reuses governed Anthropic, Microsoft and AWS evidence', () => {
  assertOrchestratorWorkersSourceContract(
    JSON.parse(readFileSync('data/source-ledger.json', 'utf8')),
  );
});

test('AGT-P-07 source and citation governance rejects drift', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const mutations = [];
  for (const [sourceId, field, value] of [
    ['src-anthropic-building-effective-agents', 'title', 'Wrong title'],
    ['src-github-4d3dfe89f2a4', 'author_or_org', 'Wrong org'],
    ['src-github-fe00e370c994', 'license', 'MIT'],
  ]) {
    const mutant = structuredClone(ledger);
    mutant.sources.find(({id}) => id === sourceId)[field] = value;
    mutations.push([`${sourceId} ${field}`, mutant]);
  }
  const citationMutant = structuredClone(ledger);
  citationMutant.documents[orchestratorWorkersArticlePath].citations[0].roles = ['implementation'];
  mutations.push(['citation role', citationMutant]);
  const documentMutant = structuredClone(ledger);
  documentMutant.documents[orchestratorWorkersArticlePath].reviewed_at = '2099-01-01';
  mutations.push(['document review', documentMutant]);
  const survivors = [];
  for (const [label, mutant] of mutations) {
    try { assertOrchestratorWorkersSourceContract(mutant); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

const durableAgentArticlePath = 'content/patterns/agt-p-08-durable-agent-hitl.mdx';
const durableAgentDrawioPath = 'diagrams/agt-p-08-durable-agent-hitl.drawio';
const durableAgentSvgPath = 'static/img/diagrams/agt-p-08-durable-agent-hitl.svg';
const durableAgentStates = [
  'running',
  'waiting',
  'approval required',
  'paused',
  'resuming',
  'completed',
  'failed',
  'manual terminal',
];
const durableAgentLabels = [
  'Checkpoint',
  'Approval required',
  'Resume',
  'Result reconciliation',
  'Manual terminal',
];
const durableAgentSourceIds = [
  'src-anthropic-effective-harnesses-long-running-agents',
  'src-anthropic-managed-agents',
  'src-docs-99e58642fe77',
  'src-docs-7dd57631bd24',
  'src-docs-abd3e18c34a9',
  'src-docs-f58d7138ba8f',
  'src-github-06f3f1f4928e',
  'src-atlas-agt-p-08-durable-agent-hitl',
];

function assertDurableAgentArticleContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.slug, '/patterns/agt-p-08');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'advanced');
  assert.equal(metadata.topic_id, 'AGT-P-08');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.depends_on, ['AGT-C-02', 'AGT-C-04', 'AGT-C-05', 'AGT-C-06']);
  assert.deepEqual(
    findMarkdownHeadings(source).filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const {tables} = readerVisibleTables(source);
  const stateTables = tables.filter(({rows: [header]}) => header?.[0] === '状态');
  assert.equal(stateTables.length, 1, 'exactly one reader-visible durable state table');
  const [[header, ...rows]] = stateTables.map(({rows}) => rows);
  assert.deepEqual(header, ['状态', '含义', '允许的下一步', '恢复与终止合同']);
  assert.deepEqual(rows.map(([state]) => state), durableAgentStates);

  assert.match(
    source,
    /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';[\s\S]*<div className="architecture-diagram-scroll" role="region" aria-label="持久智能体恢复、批准、拒绝与人工终止图，可使用左右方向键及首尾键横向滚动" tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}>[\s\S]*!\[[^\]]+\]\(\/img\/diagrams\/agt-p-08-durable-agent-hitl\.svg\)[\s\S]*<\/div>/u,
  );
  assert.equal([...source.matchAll(/\/img\/diagrams\/agt-p-08-durable-agent-hitl\.svg/gu)].length, 1);
  assert.doesNotMatch(source, /```mermaid/u);

  const visible = parseMdxVisibleCopy(source, durableAgentArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  for (const field of ['operation_id', 'checkpoint_schema', 'checkpoint_version']) {
    assert.match(source, new RegExp(`\\b${field}\\b`, 'u'));
  }
  for (const contract of [
    /持久控制状态[\s\S]*外部业务真相/u,
    /检查点[\s\S]*时机/u,
    /确定性重放[\s\S]*边界/u,
    /代码[\s\S]*模型[\s\S]*版本漂移/u,
    /凭证[\s\S]*(?:过期|失效)/u,
    /批准上下文/u,
    /等待[\s\S]*超时/u,
    /幂等[\s\S]*恢复/u,
    /取消/u,
    /未知[\s\S]*副作用[\s\S]*对账/u,
    /控制所有者/u,
    /状态所有者/u,
    /副作用所有者/u,
    /终止责任/u,
    /失败[\s\S]*恢复/u,
    /权衡/u,
    /迁移/u,
    /确定性回退/u,
    /(?:协议|工具|示例)[\s\S]*(?:不证明|不能证明)[\s\S]*(?:授权|可靠性|治理)/u,
  ]) assert.match(visible, contract);
}

function assertDurableAgentDiagramPair(drawio, svg) {
  assertDurableAgentDiagramGeometry(drawio, svg);
  const sourceHash = createHash('sha256').update(drawio).digest('hex');
  assert.match(drawio, /<mxfile\b/u);
  assert.match(svg, /<svg\b(?=[^>]*viewBox="0 0 1400 900")(?=[^>]*role="img")(?=[^>]*aria-labelledby="agt-p-08-title agt-p-08-desc")(?=[^>]*data-drawio-sha256="[a-f0-9]{64}")(?![^>]*\bwidth=)(?![^>]*\bheight=)[^>]*>/u);
  assert.match(svg, new RegExp(`data-drawio-sha256="${sourceHash}"`, 'u'));
  assert.match(svg, /<title id="agt-p-08-title">[^<]+<\/title>/u);
  assert.match(svg, /<desc id="agt-p-08-desc">[^<]+<\/desc>/u);
  assert.doesNotMatch(svg, /\b(?:display="none"|visibility="(?:hidden|collapse)"|aria-hidden="true")/u);
  assert.doesNotMatch(drawio, /\bsource="manual-terminal"/u);
  assert.doesNotMatch(svg, /\bdata-source="manual-terminal"/u);

  for (const label of durableAgentLabels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    assert.equal([...drawio.matchAll(new RegExp(`\\bvalue="${escaped}"`, 'gu'))].length, 1, `${label} Draw.io label count`);
    assert.equal([...svg.matchAll(new RegExp(`>${escaped}<`, 'gu'))].length, 1, `${label} SVG label count`);
  }

  for (const [id, x, y, width, height, textX, titleY, typeY] of [
    ['control-store', 350, 70, 300, 120, 500, 115, 155],
    ['checkpoint', 70, 250, 260, 120, 200, 285, 320],
    ['approval-service', 390, 250, 300, 120, 540, 295, 335],
    ['sandbox-tool', 70, 480, 260, 120, 200, 525, 565],
    ['authority-system', 1010, 250, 300, 120, 1160, 295, 335],
    ['reconciliation', 390, 480, 300, 120, 540, 525, 565],
    ['completed', 390, 700, 300, 120, 540, 745, 785],
    ['manual-terminal', 1010, 700, 300, 120, 1160, 745, 785],
  ]) {
    assert.match(drawio, new RegExp(`id="${id}"[\\s\\S]*?<mxGeometry(?=[^>]*\\bx="${x}")(?=[^>]*\\by="${y}")(?=[^>]*\\bwidth="${width}")(?=[^>]*\\bheight="${height}")[^>]*>`, 'u'));
    assert.match(svg, new RegExp(`data-node-id="${id}"[^>]*data-padding-horizontal-css="16"[^>]*data-padding-vertical-css="14"[^>]*x="${x}" y="${y}" width="${width}" height="${height}"`, 'u'));
    assert.match(svg, new RegExp(`data-title-for="${id}"[^>]*x="${textX}" y="${titleY}"`, 'u'));
    assert.match(svg, new RegExp(`data-type-for="${id}"[^>]*x="${textX}" y="${typeY}"`, 'u'));
  }

  for (const [edgeId, sourceId, targetId] of [
    ['edge-checkpoint', 'control-store', 'checkpoint'],
    ['edge-approval', 'checkpoint', 'approval-service'],
    ['edge-resume', 'approval-service', 'sandbox-tool'],
    ['edge-reject', 'approval-service', 'manual-terminal'],
    ['edge-effect', 'sandbox-tool', 'authority-system'],
    ['edge-reconcile', 'authority-system', 'reconciliation'],
    ['edge-recovery', 'reconciliation', 'control-store'],
    ['edge-unknown', 'reconciliation', 'manual-terminal'],
    ['edge-complete', 'control-store', 'completed'],
  ]) {
    assert.match(drawio, new RegExp(`<mxCell(?=[^>]*\\bid="${edgeId}")(?=[^>]*\\bsource="${sourceId}")(?=[^>]*\\btarget="${targetId}")[^>]*>`, 'u'));
    assert.match(svg, new RegExp(`data-edge-id="${edgeId}" data-source="${sourceId}" data-target="${targetId}"`, 'u'));
  }
  for (const edgeId of ['edge-resume', 'edge-reject', 'edge-reconcile', 'edge-recovery', 'edge-unknown']) {
    assert.match(svg, new RegExp(`data-edge-label-for="${edgeId}"[^>]*data-stroke-clearance-css="8"[^>]*data-arrow-clearance-css="16"[^>]*data-node-clearance-css="12"`, 'u'));
  }
}

function assertDurableAgentSources(ledger) {
  const document = ledger.documents[durableAgentArticlePath];
  assert.ok(document, 'AGT-P-08 document ledger entry');
  assert.equal(document.reviewed_at, '2026-08-27');
  assert.deepEqual(document.copyright_checks, [
    'original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights',
  ]);
  assert.deepEqual(document.citations.map(({source_id: id}) => id), durableAgentSourceIds);
  for (const citation of document.citations) {
    assert.equal(citation.excerpt, null);
    assert.equal(citation.quotation_reviewed, false);
    assert.ok(citation.attribution_note);
    assert.match(citation.modification_note, /Original|Created/u);
  }
  const original = ledger.sources.find(({id}) => id === 'src-atlas-agt-p-08-durable-agent-hitl');
  assert.deepEqual({
    id: original?.id,
    canonical_locator: original?.canonical_locator,
    transport_locator: original?.transport_locator,
    title: original?.title,
    author_or_org: original?.author_or_org,
    source_kind: original?.source_kind,
    tier: original?.tier,
    allowed_evidence_roles: original?.allowed_evidence_roles,
    license: original?.license,
    copyright_policy: original?.copyright_policy,
  }, {
    id: 'src-atlas-agt-p-08-durable-agent-hitl',
    canonical_locator: '/img/diagrams/agt-p-08-durable-agent-hitl.svg',
    transport_locator: '/img/diagrams/agt-p-08-durable-agent-hitl.svg',
    title: 'Durable agent recovery and human approval control flow',
    author_or_org: 'Tego Arch maintainers',
    source_kind: 'original-illustration',
    tier: 'primary',
    allowed_evidence_roles: ['illustration'],
    license: 'LicenseRef-Atlas-Original',
    copyright_policy: 'original-atlas',
  });
  for (const sourceId of durableAgentSourceIds.slice(0, -1)) {
    assert.ok(ledger.sources.some(({id}) => id === sourceId), sourceId);
  }
}

test('AGT-P-08 publishes durable state rows, operation identity, checkpoint versioning, article and paired assets', () => {
  for (const file of [durableAgentArticlePath, durableAgentDrawioPath, durableAgentSvgPath]) {
    assert.ok(existsSync(file), `Missing ${file}`);
  }
  const source = readFileSync(durableAgentArticlePath, 'utf8');
  assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(source)));
  assertDurableAgentArticleContract(source);
  assertDurableAgentDiagramPair(
    readFileSync(durableAgentDrawioPath, 'utf8'),
    readFileSync(durableAgentSvgPath, 'utf8'),
  );
});

test('AGT-P-08 rejects article state, hidden, duplicate, bypass and terminal re-entry mutants', () => {
  const source = readFileSync(durableAgentArticlePath, 'utf8');
  const mutations = [
    ['state drift', source.replace('\n| waiting |', '\n| queued |')],
    ['missing operation identity', source.replaceAll('operation_id', 'action_key')],
    ['missing checkpoint schema', source.replaceAll('checkpoint_schema', 'snapshot_shape')],
    ['hidden table', source.replace('| 状态 | 含义 | 允许的下一步 | 恢复与终止合同 |', '<div hidden>\n\n| 状态 | 含义 | 允许的下一步 | 恢复与终止合同 |').replace('| manual terminal |', '| manual terminal |') + '\n\n</div>'],
    ['duplicate diagram', `${source}\n\n![重复图](/img/diagrams/agt-p-08-durable-agent-hitl.svg)\n`],
    ['responsive wrapper bypass', source.replace('className="architecture-diagram-scroll"', 'className="diagram"')],
  ];
  const survivors = [];
  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture mutates article`);
    assert.doesNotThrow(() => markdownParser.parse(extractMarkdownBody(mutant)));
    try { assertDurableAgentArticleContract(mutant); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-08 diagram pair rejects geometry, source, SVG label, hidden, duplicate, bypass and terminal re-entry mutants', () => {
  const drawio = readFileSync(durableAgentDrawioPath, 'utf8');
  const svg = readFileSync(durableAgentSvgPath, 'utf8');
  const mutations = [
    ['source label drift', drawio.replace('value="Checkpoint"', 'value="Snapshot"'), svg],
    ['SVG label drift', drawio, svg.replace('>Resume<', '>Continue<')],
    ['hidden label', drawio, svg.replace('>Approval required<', ' visibility="hidden">Approval required<')],
    ['duplicate label', `${drawio.replace('</root>', '<mxCell id="duplicate-checkpoint" value="Checkpoint" vertex="1" parent="1"/><\/root>')}`, svg],
    ['geometry drift', drawio, svg.replace('data-node-id="approval-service" data-padding-horizontal-css="16" data-padding-vertical-css="14" x="390"', 'data-node-id="approval-service" data-padding-horizontal-css="16" data-padding-vertical-css="14" x="700"')],
    ['geometry data bypass', drawio, svg.replace('data-title-for="manual-terminal" x="1160" y="745"', 'data-title-for="manual-terminal" x="1320" y="745"')],
    ['label overlap with clearance data preserved', drawio, svg.replace('data-edge-label-for="edge-recovery" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="600" y="420.5"', 'data-edge-label-for="edge-recovery" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="670" y="420.5"')],
    ['approval bypass', drawio.replace('id="edge-resume" edge="1" parent="1" source="approval-service"', 'id="edge-resume" edge="1" parent="1" source="checkpoint"'), svg],
    ['published rejection bypass', drawio, svg.replace('data-edge-id="edge-reject" data-source="approval-service" data-target="manual-terminal"', 'data-edge-id="edge-reject" data-source="approval-service" data-target="completed"')],
    ['terminal re-entry', drawio.replace('</root>', '<mxCell id="edge-reenter" value="Retry" edge="1" parent="1" source="manual-terminal" target="control-store"><mxGeometry relative="1" as="geometry"/></mxCell><\/root>'), svg],
    ['embedded source hash drift', drawio, svg.replace(/data-drawio-sha256="[a-f0-9]{64}"/u, `data-drawio-sha256="${'0'.repeat(64)}"`)],
  ];
  const survivors = [];
  for (const [label, drawioMutant, svgMutant] of mutations) {
    assert.ok(drawioMutant !== drawio || svgMutant !== svg, `${label} mutates pair`);
    try { assertDurableAgentDiagramPair(drawioMutant, svgMutant); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-08 reuses governed evidence and registers original illustration without source drift', () => {
  assertDurableAgentSources(JSON.parse(readFileSync('data/source-ledger.json', 'utf8')));
});
