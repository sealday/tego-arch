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
const document = documents.find(({file}) => file === 'modeling/mod-13-model-sync-strategy.mdx');
const relatedDocuments = new Map(documents.map((entry) => [entry.file, entry]));
const [sourceLedger, sourceLinkHealth, topicRelations, projectStatus, topicManifest] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/topic-relations.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const expectedSourceRecords = [
  {id:'src-structurizr-dsl-model-as-code',canonical_locator:'https://docs.structurizr.com/dsl/tutorial',transport_locator:'https://raw.githubusercontent.com/structurizr/structurizr.github.io/d7f521eb9c6c55f7e9a4dcaf2a1122b844dbcb7f/dsl/02-tutorial.md',query_insensitive:false,locator_aliases:[],tombstone:null,title:'Structurizr DSL tutorial',author_or_org:'Structurizr',published_at:null,registered_at:'2026-08-06',checked_at:'2026-08-06',version:'Structurizr documentation commit d7f521eb9c6c55f7e9a4dcaf2a1122b844dbcb7f',source_kind:'official-docs',tier:'primary',allowed_evidence_roles:['definition','implementation','learning','method'],license:'MIT',license_scope:'The named Structurizr DSL tutorial page at the pinned documentation commit; trademarks, linked works, code, hosted service behavior, and third-party assets excluded',license_evidence_url:'https://github.com/structurizr/structurizr.github.io/blob/d7f521eb9c6c55f7e9a4dcaf2a1122b844dbcb7f/LICENSE',license_evidence_note:'The pinned Structurizr documentation repository LICENSE identifies the repository as MIT licensed; no broader copyright inference is made.',license_family_id:'https://docs.structurizr.com/dsl/tutorial',license_family_grouping:'identity',family_grouping_evidence_url:null,copyright_policy:'facts-and-short-quotation',usage_boundary:'Supports that a workspace wraps a model and views, including a model element and a view scoped to that element; it does not prove that every possible view is mechanically generated from an entire model or that models synchronize with code, deployment, or runtime state.',link_policy:'stable',expected_final_transport_locator:'https://raw.githubusercontent.com/structurizr/structurizr.github.io/d7f521eb9c6c55f7e9a4dcaf2a1122b844dbcb7f/dsl/02-tutorial.md',expected_final_approved_at:'2026-08-06',expected_final_approval_note:'Pinned official DSL tutorial returned HTTP 200 on 2026-08-06.'},
  {id:'src-opengitops-principles-v1',canonical_locator:'https://opengitops.dev/',transport_locator:'https://raw.githubusercontent.com/open-gitops/documents/d36cde829c6ef2c7e5cab662ab98a7173a591a49/PRINCIPLES.md',query_insensitive:false,locator_aliases:[],tombstone:null,title:'GitOps Principles v1.0.0',author_or_org:'OpenGitOps / CNCF GitOps Working Group',published_at:null,registered_at:'2026-08-06',checked_at:'2026-08-06',version:'v1.0.0 peeled commit d36cde829c6ef2c7e5cab662ab98a7173a591a49',source_kind:'standard',tier:'primary',allowed_evidence_roles:['definition','learning','method'],license:'CC-BY-4.0',license_scope:'The GitOps Principles content at v1.0.0 under the repository content license; code, marks, translations, linked works, and later versions excluded',license_evidence_url:'https://github.com/open-gitops/documents/blob/d36cde829c6ef2c7e5cab662ab98a7173a591a49/LICENSE.md',license_evidence_note:'The pinned repository license applies CC BY 4.0 to content and Apache 2.0 to code.',license_family_id:'https://opengitops.dev/',license_family_grouping:'identity',family_grouping_evidence_url:null,copyright_policy:'adapt-with-attribution',usage_boundary:'Supports declarative, versioned and immutable, automatically pulled, continuously reconciled desired state for GitOps-managed systems; it does not make all architecture knowledge automatically reconcilable.',link_policy:'stable',expected_final_transport_locator:'https://raw.githubusercontent.com/open-gitops/documents/d36cde829c6ef2c7e5cab662ab98a7173a591a49/PRINCIPLES.md',expected_final_approved_at:'2026-08-06',expected_final_approval_note:'Pinned v1.0.0 principles file returned HTTP 200 on 2026-08-06.'},
  {id:'src-github-deployment-history',canonical_locator:'https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history',transport_locator:'https://raw.githubusercontent.com/github/docs/738593aef7b8d80183a376d5c692feefc0e8a5ff/content/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history.md',query_insensitive:false,locator_aliases:[],tombstone:null,title:'Viewing deployment history',author_or_org:'GitHub',published_at:null,registered_at:'2026-08-06',checked_at:'2026-08-06',version:'GitHub Docs commit 738593aef7b8d80183a376d5c692feefc0e8a5ff',source_kind:'official-docs',tier:'primary',allowed_evidence_roles:['implementation','learning','runtime-fact'],license:'CC-BY-4.0',license_scope:'The named GitHub documentation page at the pinned docs commit; GitHub marks, product code, linked works, screenshots, and later versions excluded',license_evidence_url:'https://github.com/github/docs/blob/738593aef7b8d80183a376d5c692feefc0e8a5ff/LICENSE',license_evidence_note:'GitHub Docs applies CC BY 4.0 to documentation and content under its LICENSE file.',license_family_id:'https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history',license_family_grouping:'identity',family_grouping_evidence_url:null,copyright_policy:'adapt-with-attribution',usage_boundary:'Supports deployment history associations with environments, commits, workflow logs, URLs, and statuses; it does not prove application functionality, performance, reliability, or complete runtime health.',link_policy:'stable',expected_final_transport_locator:'https://raw.githubusercontent.com/github/docs/738593aef7b8d80183a376d5c692feefc0e8a5ff/content/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history.md',expected_final_approved_at:'2026-08-06',expected_final_approval_note:'Pinned official documentation source returned HTTP 200 on 2026-08-06.'},
  {id:'src-atlas-mod13-authority-drift-loop',canonical_locator:'/img/diagrams/mod-13-authority-drift-loop.svg',transport_locator:'/img/diagrams/mod-13-authority-drift-loop.svg',query_insensitive:false,locator_aliases:[],tombstone:null,title:'权威事实与漂移处置闭环',author_or_org:'Tego Arch maintainers',published_at:null,registered_at:'2026-08-06',checked_at:'2026-08-06',version:'Original Draw.io/SVG pair authored and QA-checked on 2026-08-06',source_kind:'original-illustration',tier:'primary',allowed_evidence_roles:['illustration'],license:'LicenseRef-Atlas-Original',license_scope:'The named project-authored mod-13-authority-drift-loop.svg asset only',license_evidence_url:'https://github.com/sealday/tego-arch/blob/main/static/img/diagrams/mod-13-authority-drift-loop.svg',license_evidence_note:'The project-authored Draw.io/SVG pair contains no third-party reference image, icon, signature, watermark, or copied composition.',license_family_id:'/img/diagrams/mod-13-authority-drift-loop.svg',license_family_grouping:'identity',family_grouping_evidence_url:null,copyright_policy:'original-atlas',usage_boundary:'Original teaching illustration of per-fact authority and drift reconciliation; it does not represent a production topology, team, controller, or tool implementation.',link_policy:null,expected_final_transport_locator:'/img/diagrams/mod-13-authority-drift-loop.svg',expected_final_approved_at:'2026-08-06',expected_final_approval_note:'Approved project-local original illustration locator for the named SVG asset.'},
];

const expectedNygardRecord = {id:'src-nygard-documenting-architecture-decisions-2011',canonical_locator:'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',transport_locator:'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',query_insensitive:false,locator_aliases:[],tombstone:null,title:'Documenting Architecture Decisions',author_or_org:'Michael Nygard / Cognitect',published_at:'2011-11-15',registered_at:'2026-07-24',checked_at:'2026-07-24',version:'Article published 2011-11-15; page checked on 2026-07-24',source_kind:'engineering-blog',tier:'primary',allowed_evidence_roles:['definition','method','historical-context','learning'],license:'CC0-1.0',license_scope:'The named Cognitect article text covered by its explicit CC0 waiver; linked works, marks, and third-party material excluded',license_evidence_url:'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',license_evidence_note:'The article page explicitly states that Cognitect waived copyright and related rights to the extent possible under law under CC0.',license_family_id:'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',license_family_grouping:'identity',family_grouping_evidence_url:null,copyright_policy:'adapt-with-attribution',usage_boundary:'Supports the ADR context-decision-consequences form and historical status practice; it does not make every local status vocabulary mandatory.',link_policy:'stable',expected_final_transport_locator:'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',expected_final_approved_at:'2026-07-24',expected_final_approval_note:'Initial reviewed CC0 article transport baseline'};

const expectedCitations = [
  {source_id:'src-structurizr-dsl-model-as-code',citation_url:'https://docs.structurizr.com/dsl/tutorial',roles:['definition','implementation','learning'],manifest_primary:true,usage_mode:'facts-summary',attribution_note:'Structurizr DSL tutorial, Structurizr',modification_note:null,excerpt:null,quotation_reviewed:false},
  {source_id:'src-nygard-documenting-architecture-decisions-2011',citation_url:'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',roles:['definition','method','historical-context'],manifest_primary:true,usage_mode:'facts-summary',attribution_note:'Documenting Architecture Decisions, Michael Nygard / Cognitect',modification_note:null,excerpt:null,quotation_reviewed:false},
  {source_id:'src-opengitops-principles-v1',citation_url:'https://opengitops.dev/',roles:['definition','method','learning'],manifest_primary:true,usage_mode:'facts-summary',attribution_note:'GitOps Principles v1.0.0, OpenGitOps / CNCF GitOps Working Group',modification_note:null,excerpt:null,quotation_reviewed:false},
  {source_id:'src-github-deployment-history',citation_url:'https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history',roles:['implementation','runtime-fact','learning'],manifest_primary:false,usage_mode:'facts-summary',attribution_note:'Viewing deployment history, GitHub Docs',modification_note:null,excerpt:null,quotation_reviewed:false},
  {source_id:'src-atlas-mod13-authority-drift-loop',citation_url:'/img/diagrams/mod-13-authority-drift-loop.svg',roles:['illustration'],manifest_primary:false,usage_mode:'original-illustration',attribution_note:'权威事实与漂移处置闭环，Tego Arch maintainers',modification_note:'Created as an original Draw.io and SVG pair for MOD-13 from a project-authored design; local pre-publication desktop/mobile QA is recorded in .superpowers/sdd/task-2-report.md, while Task 5 production QA remains a separate gate; no third-party reference imagery was used.',excerpt:null,quotation_reviewed:false},
];

const expectedMetadata = {
  title: '模型同步策略',
  slug: '/modeling/mod-13',
  content_type: 'modeling',
  status: 'reviewed',
  difficulty: 'advanced',
  analyzed_at: '2026-08-06',
  source_cutoff: '2026-08-06',
  review_policy: 'quarterly-version-sensitive',
  confidence: 'high',
  domains: ['software-architecture'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['understandability', 'maintainability', 'auditability', 'reliability'],
  tags: ['模型同步', '架构漂移', 'ADR', '声明式持续调谐'],
  summary: '为代码、架构图、架构决策记录（Architecture Decision Record，ADR）、期望部署和实际运行事实指定单一权威、同步方向与检测证据，并用四类漂移和六步闭环完成修复与发布复核。',
  topic_id: 'MOD-13',
  priority: 'P2',
  depends_on: ['MOD-04', 'MOD-12', 'MTH-03', 'MTH-06'],
  adjacent_topics: ['MOD-04', 'MOD-12', 'MTH-03', 'MTH-06'],
  related_cases: ['/cases/kubernetes-reconciliation-loop'],
  related_questions: [],
};

const expectedHeadings = [
  '学习问题',
  '同步目标与输入',
  '权威事实台账',
  '漂移检测闭环',
  '核心产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];

const expectedAuthorityRows = [
  {事实:'主题完成状态',权威来源:'`docs/content-backlog.md` 复选框',派生产物:'主题清单与项目状态',同步关系:'生成',触发时机:'第二阶段关闭',检测方式:'`generate:content` 与状态测试',责任类型:'内容发布维护者',修复方向:'修改待办后重新生成',明确不证明:'复选框不证明部署成功'},
  {事实:'已发布内容元数据',权威来源:'`MDX` 前置元数据',派生产物:'主题清单与索引',同步关系:'生成',触发时机:'内容变更或发布',检测方式:'内容模式与生成差异',责任类型:'内容维护者',修复方向:'修改 `MDX` 后重新生成',明确不证明:'元数据不证明正文事实正确'},
  {事实:'代码接口与受测结构',权威来源:'受测代码与接口契约',派生产物:'结构检查结果',同步关系:'验证',触发时机:'代码或接口变更',检测方式:'测试、模式与接口差异',责任类型:'代码责任人',修复方向:'修改代码或经批准修订模型',明确不证明:'静态与测试证据不证明运行健康或业务边界'},
  {事实:'架构模型与图中语义',权威来源:'已批准模型与 Draw.io 图源',派生产物:'矢量图与文章视图',同步关系:'生成',触发时机:'模型或图源变更',检测方式:'Draw.io 与矢量图配对校验器及独立复述',责任类型:'架构文档维护者',修复方向:'修改图源并重新导出',明确不证明:'图不证明代码、部署或运行一致'},
  {事实:'ADR 决策及状态',权威来源:'ADR 文件、状态与替代关系',派生产物:'决策索引与可见链接',同步关系:'验证',触发时机:'架构显著变更或定期复核',检测方式:'状态、替代链接与实现复核',责任类型:'决策责任人',修复方向:'恢复实现或新增替代 ADR',明确不证明:'ADR 不证明实现遵循决定'},
  {事实:'期望部署声明',权威来源:'版本化工作流（Workflow）与配置声明',派生产物:'待部署计划与制品选择',同步关系:'生成',触发时机:'配置、制品或发布变更',检测方式:'配置差异、策略与构建测试',责任类型:'平台维护者',修复方向:'经批准修改声明并重新发布',明确不证明:'期望状态不等于实际状态'},
  {事实:'实际部署身份与状态',权威来源:'代码托管平台的部署与自动化记录',派生产物:'发布复审证据',同步关系:'观测',触发时机:'部署完成或状态变化',检测方式:'精确提交哈希、运行、作业、状态与路由查询',责任类型:'发布维护者',修复方向:'回滚或前滚后形成新部署记录',明确不证明:'工作流成功不证明全部运行健康'},
  {事实:'运行观测',权威来源:'线上路由、日志、指标与实际环境查询',派生产物:'运行复核证据',同步关系:'观测',触发时机:'部署后、事件发生或定时检查',检测方式:'浏览器、端点与可观测性查询',责任类型:'运行责任人',修复方向:'修复期望或实际状态后重新观测',明确不证明:'单次观测不证明服务级别协议、因果或长期健康'},
];

const expectedDriftRows = [
  {漂移类型:'内容漂移',差异证据:'待办、前置元数据与生成清单状态不同',严重度:'阻断',当前状态:'修复中',责任类型:'内容发布维护者',修复动作:'修改权威输入并重新生成，禁止手改生成的 `JSON`',重新验证证据:'生成命令、状态测试与精确差异',明确不证明:'生成一致不证明正文结论正确'},
  {漂移类型:'结构漂移',差异证据:'代码已移除接口而架构图仍保留旧关系',严重度:'待分级',当前状态:'待分级',责任类型:'代码责任人与架构文档维护者',修复动作:'先裁决结构事实权威，再修改代码或图源',重新验证证据:'接口测试、图对验证与独立复述',明确不证明:'图与代码对齐不证明部署或运行状态'},
  {漂移类型:'决策漂移',差异证据:'实现绕过已接受 ADR 且旧状态仍有效',严重度:'阻断',当前状态:'修复中',责任类型:'决策责任人',修复动作:'恢复实现，或新增 ADR 并标记旧记录已取代',重新验证证据:'ADR 状态、替代链接与实现复核',明确不证明:'记录替代关系不证明新实现已经上线'},
  {漂移类型:'运行漂移',差异证据:'期望提交与实际部署或线上观测身份不同',严重度:'阻断',当前状态:'未知',责任类型:'平台维护者与运行责任人',修复动作:'保留实际观测，前滚或回滚后重新部署',重新验证证据:'新精确版本运行、作业、路由与运行复核',明确不证明:'部署成功不证明功能、性能、可靠性或长期健康'},
];

const expectedSteps = [
  '声明权威',
  '生成或验证',
  '检测差异',
  '分级处置',
  '重建证据',
  '发布复核',
];

const expectedExerciseSteps = [
  '盘点主题状态、内容元数据、代码接口、图中语义、ADR、期望部署、实际部署与运行观测。',
  '把每项事实拆到单一写者粒度，指定当前权威、责任类型与非证明边界。',
  '把每条同步关系分类为生成、验证或观测。',
  '注入一个受控差异：代码移除接口，但架构图仍保留旧关系。',
  '把差异分类为结构漂移，记录严重度与当前状态，并分配责任类型。',
  '裁决结构事实权威，修改代码或图源，再重建受影响的派生产物与检测证据。',
  '由未参与修复的人独立复放检测，并用精确提交、发布流程与线上路由完成发布复核。',
];

const expectedStatuses = ['待分级', '阻断', '修复中', '接受差异', '已验证关闭', '未知'];

const expectedDriftDefinition = '四类漂移按内容漂移 → 结构漂移 → 决策漂移 → 运行漂移排列。内容漂移比较待办、前置元数据与生成清单；结构漂移比较受测接口与模型关系；决策漂移比较有效 ADR 与实现；运行漂移比较期望提交、实际部署身份和线上观测。';

const expectedScenarioLabel = '**说明性场景：**';

const diagram = {
  slug: 'mod-13-authority-drift-loop',
  labels: [
    '权威事实源', '同步合同与检测', '漂移处置与发布',
    '代码事实', '架构模型与图源', 'ADR 决策状态', '部署与运行证据',
    '权威事实合同', '生成器', '验证器', '观测器',
    '漂移队列', '责任人修复', '重新验证', '已验证发布证据',
    '声明权威', '生成', '验证', '观测', '差异或未知',
    '分级与分派', '修改权威或新增替代记录',
    '实线箭头：生成或检查', '虚线箭头：修复反馈', '点线边框：实际观测或未知',
  ],
};

const sourceIds = ['code-facts', 'architecture-source', 'adr-state', 'runtime-evidence'];
const measuredNodeIds = [
  ...sourceIds,
  'authority-contract', 'generator', 'validator', 'observer', 'drift-queue',
  'owner-repair', 'revalidate', 'release-evidence',
];
const renderedScale = 800 / 1200;

function decodeXmlText(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function drawioCells(source) {
  return [...source.matchAll(/<mxCell\b([^>]*)>/gu)].map(([, attributes]) => {
    const entries = [...attributes.matchAll(/([\w-]+)="([^"]*)"/gu)]
      .map(([, key, value]) => [key, decodeXmlText(value)]);
    return Object.fromEntries(entries);
  });
}

function xmlAttributes(source) {
  return Object.fromEntries([...source.matchAll(/([\w:-]+)="([^"]*)"/gu)]
    .map(([, key, value]) => [key, decodeXmlText(value)]));
}

function svgElements(source, name) {
  return [...source.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gu'))]
    .map(([, attributes]) => xmlAttributes(attributes));
}

function boundsAttribute(attributes, name) {
  return (attributes[name] ?? '').split(/\s+/u).map(Number);
}

function rectDistance(left, right) {
  const horizontal = Math.max(left[0] - (right[0] + right[2]), right[0] - (left[0] + left[2]), 0);
  const vertical = Math.max(left[1] - (right[1] + right[3]), right[1] - (left[1] + left[3]), 0);
  return Math.hypot(horizontal, vertical);
}

function orthogonalPathPoints(pathData) {
  const commands = [...pathData.matchAll(/([MHV])\s*(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/gu)];
  const points = [];
  let x = 0;
  let y = 0;
  for (const [, command, first, second] of commands) {
    if (command === 'M') [x, y] = [Number(first), Number(second)];
    if (command === 'H') x = Number(first);
    if (command === 'V') y = Number(first);
    points.push([x, y]);
  }
  return points;
}

function segmentIntersectsRectInterior(start, end, [x, y, width, height]) {
  const left = x;
  const right = x + width;
  const top = y;
  const bottom = y + height;
  if (start[0] === end[0]) {
    return start[0] > left && start[0] < right && Math.max(start[1], end[1]) > top && Math.min(start[1], end[1]) < bottom;
  }
  return start[1] > top && start[1] < bottom && Math.max(start[0], end[0]) > left && Math.min(start[0], end[0]) < right;
}

function hiddenStylesheetClasses(source) {
  const classes = new Set();
  for (const [, stylesheet] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)) {
    for (const [, selectors, declarations] of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      if (!/(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|opacity\s*:\s*0(?:\D|$))/u.test(declarations)) continue;
      for (const selector of selectors.split(',')) {
        const className = selector.trim().match(/^\.([\w-]+)$/u)?.[1];
        if (className) classes.add(className);
      }
    }
  }
  return classes;
}

function elementIsHidden(attributes, hiddenClasses) {
  const values = xmlAttributes(attributes);
  const presentation = `${attributes};${values.style ?? ''}`;
  if (/(?:display\s*(?::|=\s*")\s*none|visibility\s*(?::|=\s*")\s*(?:hidden|collapse)|opacity\s*(?::|=\s*")\s*0(?:\D|$))/u.test(presentation)) return true;
  if (values['aria-hidden'] === 'true') return true;
  return (values.class ?? '').split(/\s+/u).some((className) => hiddenClasses.has(className));
}

function visibleSvgTexts(source) {
  const hiddenClasses = hiddenStylesheetClasses(source);
  const stack = [];
  const visible = [];
  for (const [token] of source.matchAll(/<\/?[\w:-]+\b[^>]*>|[^<]+/gu)) {
    if (!token.startsWith('<')) {
      const textFrame = stack.findLast((frame) => frame.name === 'text');
      if (textFrame && !stack.at(-1).hidden) textFrame.content += token;
      continue;
    }
    if (token.startsWith('</')) {
      const frame = stack.pop();
      if (frame?.name === 'text' && !frame.hidden) visible.push(decodeXmlText(frame.content.trim()));
      continue;
    }
    const [, name = '', attributes = ''] = token.match(/^<([\w:-]+)\b([^>]*)>/u) ?? [];
    const hidden = (stack.at(-1)?.hidden ?? false) || elementIsHidden(attributes, hiddenClasses);
    const frame = {name, hidden, content: ''};
    if (!/\/\s*>$/u.test(token)) stack.push(frame);
  }
  return visible;
}

function assertDiagramContract(drawio, svg) {
  const cells = drawioCells(drawio);
  const byId = new Map(cells.map((cell) => [cell.id, cell]));
  const svgPaths = svgElements(svg, 'path');
  const svgPathsById = new Map(svgPaths.map((path) => [path.id, path]));
  assert.match(drawio, /<mxGraphModel\b[^>]*\bpageWidth="1200"[^>]*\bpageHeight="900"/u);
  assert.match(svg, /<svg\b(?=[^>]*\bviewBox="0 0 1200 900")(?=[^>]*\brole="img")(?=[^>]*\baria-labelledby="mod13-title mod13-desc")(?![^>]*\bwidth=)(?![^>]*\bheight=)[^>]*>/u);
  assert.match(svg, /<title id="mod13-title">[^<]+<\/title>/u);
  assert.match(svg, /<desc id="mod13-desc">[^<]+<\/desc>/u);

  const visibleSvgText = visibleSvgTexts(svg);
  for (const label of diagram.labels) {
    assert.ok(cells.some((cell) => cell.value === label), `Draw.io must visibly declare exact label: ${label}`);
    assert.ok(visibleSvgText.includes(label), `SVG must paint exact label: ${label}`);
  }

  for (const regionId of ['region-authority', 'region-contract', 'region-resolution']) {
    assert.equal(byId.get(regionId)?.vertex, '1', `missing region ${regionId}`);
  }
  for (const source of sourceIds) {
    const declaration = byId.get(`declare-${source}`);
    assert.equal(declaration?.source, source, `${source} must originate its authority declaration`);
    assert.equal(declaration?.target, 'authority-contract', `${source} must point to authority-contract`);
    assert.match(declaration?.style ?? '', /endArrow=block/u);
    const feedback = byId.get(`repair-${source}`);
    assert.equal(feedback?.source, 'owner-repair', `repair feedback must originate at owner-repair for ${source}`);
    assert.equal(feedback?.target, source, `repair feedback must return to ${source}`);
    assert.match(feedback?.style ?? '', /dashed=1/u, `repair feedback must be dashed for ${source}`);
    const svgFeedback = svgPathsById.get(`repair-${source}`);
    assert.equal(svgFeedback?.['data-source'], 'owner-repair', `SVG repair feedback must originate at owner-repair for ${source}`);
    assert.equal(svgFeedback?.['data-target'], source, `SVG repair feedback must return to ${source}`);
    assert.ok((svgFeedback?.class ?? '').split(/\s+/u).includes('feedback'), `SVG repair feedback must use the feedback class for ${source}`);
  }
  assert.equal(byId.get('repair-revalidate')?.value, '', 'revalidation stays semantically separate from authority repair feedback');
  assert.equal(byId.get('repair-runtime-evidence')?.value, '修改权威或新增替代记录', 'repair wording belongs to a dashed feedback edge');
  const repairLabel = svgElements(svg, 'text').find((text) => text['data-edge-id'] === 'repair-runtime-evidence');
  assert.equal(repairLabel?.class, 'edge-label');
  assert.ok(visibleSvgText.includes('修改权威或新增替代记录'));
  for (const [id, source, target] of [
    ['contract-generate', 'authority-contract', 'generator'],
    ['contract-validate', 'authority-contract', 'validator'],
    ['contract-observe', 'authority-contract', 'observer'],
    ['generate-drift', 'generator', 'drift-queue'],
    ['validate-drift', 'validator', 'drift-queue'],
    ['observe-drift', 'observer', 'drift-queue'],
    ['queue-repair', 'drift-queue', 'owner-repair'],
    ['repair-revalidate', 'owner-repair', 'revalidate'],
    ['revalidate-release', 'revalidate', 'release-evidence'],
  ]) {
    assert.equal(byId.get(id)?.source, source, `${id} source`);
    assert.equal(byId.get(id)?.target, target, `${id} target`);
  }
  assert.ok(!cells.some((cell) => cell.edge === '1' && cell.source === 'release-evidence'), 'release evidence must have no reverse edge');
  assert.ok(!svgPaths.some((path) => path['data-source'] === 'release-evidence'), 'SVG release evidence must have no outgoing edge');

  for (const edge of cells.filter((cell) => cell.edge === '1')) {
    assert.match(edge.style ?? '', /edgeStyle=orthogonalEdgeStyle/u, `${edge.id} must be orthogonal`);
    assert.match(edge.style ?? '', /exitX=/u, `${edge.id} must declare an explicit exit port`);
    assert.match(edge.style ?? '', /entryX=/u, `${edge.id} must declare an explicit entry port`);
  }
  for (const [source, target] of [
    ['code-facts', 'authority-contract'], ['architecture-source', 'authority-contract'],
    ['adr-state', 'authority-contract'], ['runtime-evidence', 'authority-contract'],
    ['authority-contract', 'generator'], ['authority-contract', 'validator'],
    ['authority-contract', 'observer'], ['generator', 'drift-queue'],
    ['validator', 'drift-queue'], ['observer', 'drift-queue'],
    ['drift-queue', 'owner-repair'], ['owner-repair', 'revalidate'],
    ['revalidate', 'release-evidence'],
  ]) {
    assert.match(svg, new RegExp(`<path\\b(?=[^>]*\\bdata-source="${source}")(?=[^>]*\\bdata-target="${target}")[^>]*>`, 'u'));
  }

  assert.match(svg, /\.node-title\s*\{[^}]*font:\s*700 23px/u);
  assert.match(svg, /\.node-type\s*\{[^}]*font:\s*16px/u);
  assert.match(svg, /\.edge-label\s*\{[^}]*font:\s*700 23px/u);
  for (const edge of cells.filter((cell) => cell.edge === '1')) {
    assert.match(edge.style ?? '', /fontSize=23/u, `${edge.id} label font must be 23 authoring units`);
  }

  const measuredGroups = [...svg.matchAll(/<g\b([^>]*)>([\s\S]*?)<\/g>/gu)]
    .map(([, attributes, contents]) => [xmlAttributes(attributes), contents])
    .filter(([attributes]) => attributes['data-node-id']);
  assert.equal(measuredGroups.length, measuredNodeIds.length);
  for (const [attributes, contents] of measuredGroups) {
    const nodeId = attributes['data-node-id'];
    assert.ok(measuredNodeIds.includes(nodeId), `unexpected measured node ${nodeId}`);
    const nodeBounds = boundsAttribute(attributes, 'data-node-bounds');
    assert.equal(nodeBounds.length, 4, `${nodeId} node bounds`);
    const texts = [...contents.matchAll(/<text\b([^>]*)>/gu)].map(([, value]) => xmlAttributes(value));
    const title = texts.find((text) => text['data-text-role'] === 'title');
    const type = texts.find((text) => text['data-text-role'] === 'type');
    assert.ok(title && type, `${nodeId} title/type measurement metadata`);
    const titleBounds = boundsAttribute(title, 'data-text-bounds');
    const typeBounds = boundsAttribute(type, 'data-text-bounds');
    assert.ok((Number(type.y) - Number(title.y)) * renderedScale >= 22, `${nodeId} baseline gap`);
    assert.ok((Math.min(titleBounds[0], typeBounds[0]) - nodeBounds[0]) * renderedScale >= 16, `${nodeId} left padding`);
    assert.ok((Math.max(titleBounds[0] + titleBounds[2], typeBounds[0] + typeBounds[2]) - (nodeBounds[0] + nodeBounds[2])) * renderedScale <= -16, `${nodeId} right padding`);
    assert.ok((nodeBounds[1] + nodeBounds[3] - (typeBounds[1] + typeBounds[3])) * renderedScale >= 14, `${nodeId} bottom clearance`);
  }

  const nodeBoundsById = new Map(measuredGroups.map(([attributes]) => [attributes['data-node-id'], boundsAttribute(attributes, 'data-node-bounds')]));
  for (const feedback of svgPaths.filter((path) => (path.class ?? '').split(/\s+/u).includes('feedback'))) {
    const points = orthogonalPathPoints(feedback.d ?? '');
    assert.ok(points.length >= 2, `${feedback.id} orthogonal 路由`);
    for (const [nodeId, bounds] of nodeBoundsById) {
      if ([feedback['data-source'], feedback['data-target']].includes(nodeId)) continue;
      for (let index = 1; index < points.length; index += 1) {
        assert.equal(segmentIntersectsRectInterior(points[index - 1], points[index], bounds), false, `${feedback.id} must not intersect ${nodeId}`);
      }
    }
  }

  const edgeLabels = [...svg.matchAll(/<text\b([^>]*)class="edge-label"([^>]*)>/gu)]
    .map(([, before, after]) => xmlAttributes(`${before} class="edge-label" ${after}`));
  assert.equal(edgeLabels.length, 12);
  for (const label of edgeLabels) {
    assert.equal(boundsAttribute(label, 'data-label-bounds').length, 4, `${label['data-edge-id']} label bounds`);
    assert.ok(Number(label['data-stroke-clearance-css']) >= 8, `${label['data-edge-id']} stroke clearance`);
    assert.ok(Number(label['data-arrow-clearance-css']) >= 16, `${label['data-edge-id']} arrow clearance`);
    assert.ok(Number(label['data-node-clearance-css']) >= 12, `${label['data-edge-id']} node clearance`);
  }
  const queueLabelBounds = boundsAttribute(edgeLabels.find((label) => label['data-edge-id'] === 'queue-repair'), 'data-label-bounds');
  const feedbackLabelBounds = boundsAttribute(edgeLabels.find((label) => label['data-edge-id'] === 'repair-runtime-evidence'), 'data-label-bounds');
  assert.ok((680 - (queueLabelBounds[1] + queueLabelBounds[3])) * renderedScale >= 12, 'queue label clears the contract-region border');
  assert.ok((feedbackLabelBounds[1] - 695) * renderedScale >= 12, 'feedback label clears the resolution-region border');
}

function markdownTables(body) {
  return [...body.matchAll(/(^\|[^\n]+\|\n^\|(?:\s*:?-+:?\s*\|)+\n(?:^\|[^\n]+\|\n?)+)/gmu)]
    .map(([source]) => {
      const lines = source.trim().split('\n');
      const headers = lines[0].split('|').slice(1, -1).map((cell) => cell.trim());
      return lines.slice(2).map((line) => Object.fromEntries(
        line.split('|').slice(1, -1).map((cell, index) => [headers[index], cell.trim()]),
      ));
    });
}

function requiredDocument() {
  assert.ok(document, 'modeling/mod-13-model-sync-strategy.mdx must exist');
  return document;
}

test('publishes MOD-13 with exact metadata, headings, and learning-question shape', () => {
  const entry = requiredDocument();
  assert.deepEqual(parseFrontMatter(entry.source), expectedMetadata);
  assert.deepEqual(
    findMarkdownHeadings(entry.body).filter(({level}) => level === 2).map(({text}) => text),
    expectedHeadings,
  );
  const learning = entry.body.match(/## 学习问题\n\n([\s\S]*?)\n\n## 同步目标与输入/u)?.[1] ?? '';
  assert.equal([...learning.matchAll(/^- /gmu)].length, 5, 'exactly five learning questions');
  assert.equal([...entry.body.matchAll(/^# (?!#)/gmu)].length, 1, 'exactly one H1');
});

function assertOrderedText(body, values, label) {
  const positions = values.map((value) => body.indexOf(value));
  assert.ok(positions.every((position) => position >= 0), `${label} must be complete`);
  assert.deepEqual([...positions].sort((left, right) => left - right), positions, `${label} must stay ordered`);
}

function assertMethodContract(body) {
  const tables = markdownTables(body);
  assert.equal(tables.length, 2, 'MOD-13 must contain exactly two Markdown tables');
  assert.deepEqual(tables[0], expectedAuthorityRows);
  assert.deepEqual(tables[1], expectedDriftRows);
  assert.equal(tables[0].length, 8, 'authority ledger 包含 eight rows');
  assert.equal(tables[1].length, 4, 'drift ledger 包含 four rows');

  const statusLine = body.match(/状态词汇限定为：([^。]+)。/u)?.[1] ?? '';
  assert.deepEqual([...statusLine.matchAll(/`([^`]+)`/gu)].map(([, value]) => value), expectedStatuses);
  assert.match(body, /生成是从当前权威确定性重建派生产物/u);
  assert.match(body, /验证是按合同比较两个独立事实并只报告差异/u);
  assert.match(body, /观测是读取并保留实际状态，不把它反写成期望状态/u);
  const driftDefinition = body.match(/## 漂移检测闭环\n\n([^\n]+)/u)?.[1] ?? '';
  assert.equal(driftDefinition, expectedDriftDefinition, 'canonical drift definition and order');
  assertOrderedText(body, expectedSteps.map((step) => `**${step}：**`), 'closure steps');
  assert.match(body, /禁止手工修补派生产物/u);
  assert.match(body, /同步不是双向复制；每项事实先指定一个当前权威。/u);
  assert.match(body, /生成关系重建派生产物，验证关系只报告合同差异，观测关系保留实际状态。/u);
  assert.match(body, /检测器不可用时状态是“未知”，不是“无漂移”或通过。/u);
  assert.match(body, /派生产物必须由权威重新生成，不能手工修补。/u);
  assert.match(body, /ADR 记录决定与状态，但不证明实现遵循决定。/u);
  assert.match(body, /部署成功只证明指定提交完成指定发布流程，不证明全部运行健康。/u);
  const exercise = body.match(/## 完整演练\n\n([\s\S]*?)\n\n## 来源/u)?.[1] ?? '';
  assert.ok(exercise.startsWith(`${expectedScenarioLabel} `), 'exercise starts with exact scenario label');
  const numberedBlocks = [...exercise.matchAll(/(?:^\d+\. [^\n]+\n?)+/gmu)]
    .map(([block]) => block.trim().split('\n'));
  assert.deepEqual(
    numberedBlocks,
    [expectedExerciseSteps.map((step, index) => `${index + 1}. ${step}`)],
    'exercise contains one exact ordered seven-step numbered list',
  );
}

test('renders exact authority and drift ledgers with the complete method vocabulary', () => {
  assertMethodContract(requiredDocument().body);
});

test('uses the fixed diagram path and accessible keyboard-scroll wrappers', async () => {
  const body = requiredDocument().body;
  const expectedRegions = [
    ['table-wrapper table-wrapper--mapping', '模型同步权威事实台账，可横向滚动'],
    ['table-wrapper table-wrapper--mapping', '四类漂移处置台账，可横向滚动'],
    ['architecture-diagram-scroll', '权威事实与漂移处置闭环图，可横向滚动'],
  ];
  const regions = [...body.matchAll(/<div\n  className="([^"]+)"\n  role="region"\n  aria-label="([^"]+)"\n  tabIndex=\{0\}\n  onKeyDown=\{handleHorizontalArrowKey\}\n>/gu)]
    .map(([, className, label]) => [className, label]);
  assert.deepEqual(regions, expectedRegions);
  assert.match(body, /!\[[^\]]+\]\(\/img\/diagrams\/mod-13-authority-drift-loop\.svg\)/u);
  assert.match(await readFile(new URL('../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs', import.meta.url), 'utf8'), /export function handleHorizontalArrowKey/u);
  const target = {scrollLeft: 0, scrollWidth: 200, clientWidth: 100};
  handleHorizontalArrowKey({
    key: 'ArrowRight',
    target,
    currentTarget: target,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
  assert.equal(target.scrollLeft, 40);
});

test('publishes a synchronized accessible MOD-13 authority-drift diagram pair', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../diagrams/${diagram.slug}.drawio`, import.meta.url), 'utf8'),
    readFile(new URL(`../static/img/diagrams/${diagram.slug}.svg`, import.meta.url), 'utf8'),
  ]);
  assertDiagramContract(drawio, svg);

  const body = requiredDocument().body;
  assert.match(body, /请逐一检查为什么每类事实源都通过自己的修复反馈边返回，而不是由发布证据反写权威。/u);
  assert.match(body, /!\[不同事实拥有不同权威，并通过生成、验证、观测和修复完成发布复核的闭环图\]\(\/img\/diagrams\/mod-13-authority-drift-loop\.svg\)/u);
  assert.match(body, /发布证据只关闭一次经过验证的变更，绝不会覆盖权威，也不证明长期运行健康。/u);
});

test('rejects controlled diagram-pair accessibility, topology, style, and wording mutations', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(new URL(`../diagrams/${diagram.slug}.drawio`, import.meta.url), 'utf8'),
    readFile(new URL(`../static/img/diagrams/${diagram.slug}.svg`, import.meta.url), 'utf8'),
  ]);
  const mutations = [
    ['missing label', drawio.replace('value="代码事实"', 'value=""'), svg],
    ['hidden SVG text', drawio, svg.replace('<text class="node-title" data-text-role="title" data-text-bounds="132.5 122.5 115 27" x="190" y="145">代码事实</text>', '<text class="node-title" data-text-role="title" data-text-bounds="132.5 122.5 115 27" x="190" y="145" visibility="hidden">代码事实</text>')],
    ['ancestor-hidden SVG text', drawio, svg.replace('<text class="node-title" data-text-role="title" data-text-bounds="132.5 122.5 115 27" x="190" y="145">代码事实</text>', '<g visibility="hidden"><text class="node-title" data-text-role="title" data-text-bounds="132.5 122.5 115 27" x="190" y="145">代码事实</text></g>'), /SVG must paint exact label: 代码事实/u],
    ['stylesheet-hidden SVG text', drawio, svg.replace('</style>', '.node-title { display: none; }\n    </style>'), /SVG must paint exact label: 代码事实/u],
    ['wrong arrow direction', drawio.replace('id="declare-code-facts" value="声明权威" edge="1" source="code-facts" target="authority-contract"', 'id="declare-code-facts" value="声明权威" edge="1" source="authority-contract" target="code-facts"'), svg],
    ['solid repair feedback', drawio.replace('id="repair-code-facts" value="" edge="1" source="owner-repair" target="code-facts" parent="1" style="edgeStyle=orthogonalEdgeStyle;dashed=1;', 'id="repair-code-facts" value="" edge="1" source="owner-repair" target="code-facts" parent="1" style="edgeStyle=orthogonalEdgeStyle;dashed=0;'), svg],
    ['reversed SVG repair feedback', drawio, svg.replace('data-source="owner-repair" data-target="code-facts"', 'data-source="code-facts" data-target="owner-repair"'), /SVG repair feedback must originate at owner-repair for code-facts/u],
    ['solid SVG repair feedback', drawio, svg.replace('id="repair-code-facts" class="feedback"', 'id="repair-code-facts" class="edge"'), /SVG repair feedback must use the feedback class for code-facts/u],
    ['SVG release-evidence outgoing edge', drawio, svg.replace('</svg>', '<path id="release-backflow" class="edge" data-source="release-evidence" data-target="authority-contract" d="M950 755 V700 H600 V417"/>\n</svg>'), /SVG release evidence must have no outgoing edge/u],
    ['missing region', drawio.replace('id="region-authority"', 'id="deleted-region-authority"'), svg],
    ['fixed SVG width', drawio, svg.replace('<svg ', '<svg width="1200" ')],
    ['diagram/SVG wording drift', drawio, svg.replace('>代码事实</text>', '>程序事实</text>')],
    ['repair wording rebound to revalidation', drawio.replace('id="repair-revalidate" value=""', 'id="repair-revalidate" value="修改权威或新增替代记录"'), svg, /revalidation stays semantically separate/u],
    ['feedback path intersects revalidate', drawio, svg.replace('d="M350 780 V770 H1180 V161 H1140"', 'd="M350 826 H1180 V161 H1140"'), /repair-runtime-evidence must not intersect revalidate/u],
    ['queue label crowds region border', drawio, svg.replace('data-label-bounds="151 627.5 138 27"', 'data-label-bounds="151 650 138 27"'), /queue label clears the contract-region border/u],
    ['feedback label loses stroke clearance', drawio, svg.replace('data-stroke-clearance-css="18.33"', 'data-stroke-clearance-css="7.99"'), /repair-runtime-evidence stroke clearance/u],
  ];
  for (const [label, mutatedDrawio, mutatedSvg, expectedFailure] of mutations) {
    assert.notEqual(`${mutatedDrawio}\n${mutatedSvg}`, `${drawio}\n${svg}`, `${label} must change the fixture`);
    assert.throws(
      () => assertDiagramContract(mutatedDrawio, mutatedSvg),
      expectedFailure ?? assert.AssertionError,
      label,
    );
  }
});

test('links the parent, four related topics, and the reconciliation case to real documents', () => {
  const links = new Set(extractInternalLinks(requiredDocument()));
  const expectedLinks = [
    '/modeling',
    '/modeling/mod-04',
    '/modeling/mod-12',
    '/methods/mth-03',
    '/methods/mth-06',
    '/cases/kubernetes-reconciliation-loop',
  ];
  for (const link of expectedLinks) assert.ok(links.has(link), `missing internal link ${link}`);
  const slugs = new Set([...relatedDocuments.values()].map(({metadata}) => metadata.slug));
  for (const link of expectedLinks) assert.ok(slugs.has(link), `internal link must resolve: ${link}`);
});

test('rejects controlled mutations to closure order and epistemic boundaries', () => {
  const body = requiredDocument().body;
  const mutations = [
    ['removed step', body.replace('**检测差异：**', '**已删除：**')],
    ['reordered steps', body.replace('**声明权威：**', '**临时：**').replace('**生成或验证：**', '**声明权威：**').replace('**临时：**', '**生成或验证：**')],
    ['renamed drift type', body.replace(
      expectedDriftDefinition,
      expectedDriftDefinition.replaceAll('决策漂移', '决定偏差'),
    )],
    ['unknown changed to PASS', body.replaceAll('未知', 'PASS')],
    ['manual patch prohibition removed', body.replace('禁止手工修补派生产物', '可以直接修改派生产物')],
    ['ADR falsely proves implementation', body.replace('ADR 记录决定与状态，但不证明实现遵循决定。', 'ADR 记录决定与状态，并证明实现遵循决定。')],
    ['部署 falsely proves runtime health', body.replace('部署成功只证明指定提交完成指定发布流程，不证明全部运行健康。', '部署成功证明全部运行健康。')],
    ['scenario label removed', body.replace(expectedScenarioLabel, '**示例：**')],
  ];

  for (const [label, mutation] of mutations) {
    assert.notEqual(mutation, body, `${label} must change the fixture`);
    assert.throws(() => assertMethodContract(mutation), assert.AssertionError, label);
  }
});

test('rejects reordering the canonical drift-definition paragraph', () => {
  const body = requiredDocument().body;
  const mutation = body.replace(
    expectedDriftDefinition,
    expectedDriftDefinition.replace(
      '内容漂移 → 结构漂移 → 决策漂移 → 运行漂移',
      '结构漂移 → 内容漂移 → 决策漂移 → 运行漂移',
    ),
  );
  assert.notEqual(mutation, body);
  assert.throws(() => assertMethodContract(mutation), assert.AssertionError);
});

test('rejects changing only the exact exercise scenario label', () => {
  const body = requiredDocument().body;
  const mutation = body.replace(expectedScenarioLabel, '**示例：**');
  assert.notEqual(mutation, body);
  assert.throws(() => assertMethodContract(mutation), assert.AssertionError);
});

test('rejects reordering exact entries in the seven-step numbered exercise', () => {
  const body = requiredDocument().body;
  const firstTwoSteps = `1. ${expectedExerciseSteps[0]}\n2. ${expectedExerciseSteps[1]}`;
  const mutation = body.replace(
    firstTwoSteps,
    `1. ${expectedExerciseSteps[1]}\n2. ${expectedExerciseSteps[0]}`,
  );
  assert.notEqual(mutation, body);
  assert.throws(() => assertMethodContract(mutation), assert.AssertionError);
});

test('governs the exact MOD-13 source identities and citation review', () => {
  const sourcesById = new Map(sourceLedger.sources.map((source) => [source.id, source]));
  for (const expected of expectedSourceRecords) assert.deepEqual(sourcesById.get(expected.id), expected, expected.id);
  assert.deepEqual(sourcesById.get(expectedNygardRecord.id), expectedNygardRecord);
  assert.deepEqual(sourceLedger.documents['content/modeling/mod-13-model-sync-strategy.mdx'], {
    reviewed_at: '2026-08-06',
    copyright_checks: ['original-structure','quotation-boundary','attribution-complete','illustration-rights'],
    citations: expectedCitations,
  });
  assert.deepEqual(
    expectedCitations.filter(({manifest_primary}) => manifest_primary).map(({source_id}) => source_id),
    ['src-structurizr-dsl-model-as-code','src-nygard-documenting-architecture-decisions-2011','src-opengitops-principles-v1'],
  );
});

test('commits healthy real attempts for the three pinned MOD-13 transports', () => {
  const healthByTransport = new Map(sourceLinkHealth.results.map((result) => [result.transport_locator, result]));
  for (const {transport_locator: transport} of expectedSourceRecords.slice(0, 3)) {
    const health = healthByTransport.get(transport);
    assert.ok(health, transport);
    assert.equal(health.review_status, 'healthy', transport);
    assert.equal(health.last_attempt.outcome, 'healthy', transport);
    assert.equal(health.last_attempt.final_transport_locator, transport);
    assert.ok(health.last_attempt.http_status >= 200 && health.last_attempt.http_status <= 299, transport);
    assert.deepEqual(health.last_success, {
      at: health.last_attempt.at,
      outcome: 'healthy',
      final_transport_locator: transport,
      http_status: health.last_attempt.http_status,
      login_wall_detected: false,
    }, transport);
    assert.deepEqual(health.attempt_history.at(-1), health.last_success, transport);
  }
});

test('publishes exact reciprocal MOD-13 relations without changing relation overrides', () => {
  assert.equal('MOD-13' in topicRelations, false);
  const reciprocal = [
    ['modeling/mod-04-arc42-documentation-skeleton.mdx', ['MOD-03','MOD-05','MOD-13'], '/modeling/mod-13'],
    ['modeling/mod-12-architecture-diagram-review.mdx', ['MOD-11','QA-02','QA-05','MOD-13'], '/modeling/mod-13'],
    ['methods/mth-03-adr-lifecycle.mdx', ['FND-05','MTH-04','QA-01','PR-08','MOD-01','MOD-13'], '/modeling/mod-13'],
    ['methods/mth-06-requirements-to-evolution-loop.mdx', ['MTH-04','MTH-05','MTH-07','FND-05','MOD-13'], '/modeling/mod-13'],
  ];
  for (const [file, adjacentTopics, backlink] of reciprocal) {
    const related = relatedDocuments.get(file);
    assert.deepEqual(parseFrontMatter(related.source).adjacent_topics, adjacentTopics, file);
    assert.ok(extractInternalLinks(related).includes(backlink), `${file} visible backlink`);
  }
  assert.doesNotMatch(relatedDocuments.get('modeling/mod-04-arc42-documentation-skeleton.mdx').body, /MOD-13 尚未发布/u);
  assert.doesNotMatch(relatedDocuments.get('modeling/mod-12-architecture-diagram-review.mdx').body, /MOD-13[^。\n]*发布前/u);
  assert.match(relatedDocuments.get('methods/mth-03-adr-lifecycle.mdx').body, /ADR 状态不证明实现符合决定/u);
  assert.match(relatedDocuments.get('methods/mth-06-requirements-to-evolution-loop.mdx').body, /反馈[^。\n]*MOD-13[^。\n]*权威[^。\n]*检测/u);
  assert.match(requiredDocument().body, /控制器协调[^。\n]*有限类比/u);
});

test('locks the generated MOD-13 Stage B projection', () => {
  assert.equal(projectStatus.completed_topics, 84);
  assert.equal(projectStatus.content_documents, 126);
  assert.equal(projectStatus.governed_sources, 599);


  assert.deepEqual(projectStatus.durable_stories, {completed:8,total:20,current:'G009'});
  const topicsById = new Map(topicManifest.topics.map((topic) => [topic.id, topic]));
  assert.equal(topicsById.get('MOD-13').published, true);
  assert.equal(topicsById.get('MOD-13').status.value, 'complete');
  assert.equal(topicsById.get('STY-00').published, true);
  assert.equal(topicsById.get('STY-00').status.value, 'complete');
  assert.equal(topicsById.get('STY-01').published, true);
  assert.equal(topicsById.get('STY-01').status.value, 'complete');
});
