import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {analyzeCaseText} from '../.codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs';
import {findMarkdownHeadings, parseFrontMatter, readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks, parseSourceLedger} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';
import {knowledgeHeadingContract, knowledgeTypeContracts} from '../scripts/content-schema.mjs';
import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const ARTICLE = 'content/methods/mth-07-fde-enterprise-ai-delivery.mdx';
const DRAWIO = 'diagrams/mth-07-fde-enterprise-ai-delivery-gates.drawio';
const SVG = 'static/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg';
const PLAN = 'docs/superpowers/plans/2026-08-13-mth-07-fde-enterprise-ai-delivery.md';
const DENSITY_ANALYZER = '.codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs';
const H2 = ['学习问题','一页摘要','事实边界','交付门禁图','四阶段控制流','证据、产物与责任','架构决策与权衡','生产化分析','可迁移经验','来源'];
const TRANSFER_H3 = ['可直接复用的机制','只能有限类比的部分','不应照搬的部分'];
const STAGES = ['进场期','立项期','交付期','放大期'];
const GATES = ['需求考古','流程测绘','切口选择','验收标准工程','POC 纪律','职责契约','知识结构化','人机分工设计','合规与风险兜底','渐进放量','信任运营','资产化复制'];
const STAGE_IDS = ['stage-entry','stage-initiation','stage-delivery','stage-scale'];
const GATE_IDS = GATES.map((_, index) => `gate-${String(index + 1).padStart(2, '0')}`);
const FEEDBACK_IDS = ['feedback-rollout-to-acceptance','feedback-compliance-to-scope','feedback-reuse-to-contract'];
const FEEDBACK_TOPOLOGY = new Map([
  ['feedback-rollout-to-acceptance', ['gate-10', 'gate-04']],
  ['feedback-compliance-to-scope', ['gate-09', 'gate-03']],
  ['feedback-reuse-to-contract', ['gate-12', 'gate-06']],
]);
const RESPONSIBILITY_IDS = ['owner-customer','owner-delivery','owner-product','owner-platform','owner-security-data'];
const TOPIC_ID = 'MTH-07';
const ROUTE = '/methods/mth-07';
const ILLUSTRATION_SOURCE_ID = 'src-atlas-mth07-fde-delivery-gates';
const ILLUSTRATION_LOCATOR = '/img/diagrams/mth-07-fde-enterprise-ai-delivery-gates.svg';
const SOURCE_CUTOFF = '2026-08-13';
const FIXTURE_TASK_DATE = '2026-08-14';
const DYNAMIC_PROVENANCE_DATE_FIELDS = new Set(['registered_at', 'checked_at', 'expected_final_approved_at']);
const DOCUMENT_SCHEMA_FIELDS = ['citations', 'copyright_checks', 'reviewed_at'];
const CITATION_SCHEMA_FIELDS = [
  'attribution_note', 'citation_url', 'excerpt', 'manifest_primary', 'modification_note',
  'quotation_reviewed', 'roles', 'source_id', 'usage_mode',
];
const SOURCE_SCHEMA_FIELDS = ['allowed_evidence_roles', 'author_or_org', 'canonical_locator', 'checked_at', 'copyright_policy', 'expected_final_approval_note', 'expected_final_approved_at', 'expected_final_transport_locator', 'family_grouping_evidence_url', 'id', 'license', 'license_evidence_note', 'license_evidence_url', 'license_family_grouping', 'license_family_id', 'license_scope', 'link_policy', 'locator_aliases', 'published_at', 'query_insensitive', 'registered_at', 'source_kind', 'tier', 'title', 'tombstone', 'transport_locator', 'usage_boundary', 'version'];
const SOURCE_IDS = ['src-nist-ai-rmf-1-0', 'src-google-sre-canarying-releases', 'src-microsoft-foundry-run-evaluations', 'src-atlas-mth07-fde-delivery-gates'];
const PEER_CONTRACTS = [
  {
    file: 'content/methods/mth-01-quality-attribute-workshop.mdx',
    adjacentTopics: ['FND-02', 'MTH-02', 'MTH-07'],
    backlink: '[企业 AI 前线部署交付门禁](/methods/mth-07)使用这些可测场景作为验收输入，但另行负责交付证据、生产责任和停止条件。',
    forbiddenClaim: '这些可测场景已经证明交付成功。',
    forbiddenPattern: /可测场景.{0,12}(?:证明|保证).{0,8}交付成功/u,
    conclusion: '结果是一份排序场景集，而不是组件图。后续团队把场景甲、乙映射到候选架构，再用 MTH-02 评估隔离边界和策略执行点。',
  },
  {
    file: 'content/methods/mth-04-architecture-fitness-functions.mdx',
    adjacentTopics: ['MTH-03', 'MTH-06', 'MTH-07', 'PR-08'],
    backlink: '[企业 AI 前线部署交付门禁](/methods/mth-07)消费这些信号来决定停止、回退或放量，但适应度函数本身不定义客户验收。',
    forbiddenClaim: '适应度函数即可证明客户验收。',
    forbiddenPattern: /(?:适应度函数即可证明客户验收|适应度函数定义客户验收)/u,
    conclusion: '反馈表、阈值分层和演练是本站原创归纳。来源支持适应度函数作为演进反馈的概念，不证明某个测试、指标、监控、服务等级目标或发布门禁可以互相替代。',
  },
  {
    file: 'content/methods/mth-06-requirements-to-evolution-loop.mdx',
    adjacentTopics: ['MTH-04', 'MTH-05', 'MTH-07', 'FND-05', 'MOD-13'],
    backlink: '[企业 AI 前线部署交付门禁](/methods/mth-07)把这条演进反馈用于现场验收、生产放量与复制复核，但不替代问题发现。',
    forbiddenClaim: '这条演进反馈可以替代问题发现。',
    forbiddenPattern: /(?:演进反馈可以替代问题发现|演进反馈替代问题发现|演进反馈取代问题发现)/u,
    conclusion: '闭环、反馈路由和停止条件是本站原创综合；来源分别支持局部方法，不主张存在一个由这些来源共同规定的固定流程。',
  },
  {
    file: 'content/cases/temporal-saga-durable-execution.mdx',
    adjacentTopics: null,
    backlink: '[企业 AI 前线部署交付门禁](/methods/mth-07)把本案例的长流程、重试、补偿和可观测责任作为工程机制参照；本案例不证明 FDE 组织模式或交付结果。',
    forbiddenClaim: '本案例证明 FDE 组织模式和交付结果。',
    forbiddenPattern: /(?:本案例证明 FDE 组织模式(?:和|与|或)交付结果|本案例保证 FDE 组织模式(?:和|与|或)交付结果)/u,
    conclusion: '[MOD-06 实体关系模型与关系边界](/modeling/mod-06)进一步说明 Temporal 事件历史是控制面恢复记录，不是带有效期的业务关系历史。',
  },
];
const UNSUPPORTED_CLAIM_BOUNDARY = '这些来源支持风险、评估、监测和渐进放量机制，不支持市场、薪资、政策数字、交付成功率或商业收益。';
const TEGO_ARCH_INTRO = '以下边界由 Tego Arch 架构知识项目综合四项登记来源，并把独立事实与本站推断分开。';
const UNSUPPORTED_CLAIM_MUTATIONS = [
  '100 亿市场已经形成。',
  '百亿市场已经形成。',
  '一百亿元市场已经形成。',
  '市场规模达到 100 亿元。',
  '市场规模达到一百亿元。',
  '行业规模达到 100 亿元。',
  '产业规模已经达到百亿元。',
  '赛道规模超过一百亿元。',
  '薪资普遍更高。',
  '薪酬普遍更高。',
  '年薪普遍超过 100 万元。',
  '月薪普遍超过一万元。',
  '工资普遍更高。',
  '收入普遍更高。',
  '政策要求所有企业采用 FDE。',
  '法规要求所有企业采用 FDE。',
  '监管要求所有企业采用 FDE。',
  '监管规定所有企业采用 FDE。',
  '法律要求所有企业采用 FDE。',
];
const SOURCE_CONTRACTS = new Map([
  ['src-nist-ai-rmf-1-0', {id: 'src-nist-ai-rmf-1-0', canonical_locator: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10', transport_locator: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10', query_insensitive: false, locator_aliases: [], tombstone: null, title: 'Artificial Intelligence Risk Management Framework (AI RMF 1.0)', author_or_org: 'Elham Tabassi / National Institute of Standards and Technology', published_at: '2023-01-26', registered_at: FIXTURE_TASK_DATE, checked_at: FIXTURE_TASK_DATE, version: 'NIST AI 100-1 final publication dated 2023-01-26', source_kind: 'standard', tier: 'primary', allowed_evidence_roles: ['method'], license: 'LicenseRef-US-Gov-Public-Domain', license_scope: 'NIST-authored AI RMF publication material; third-party or separately marked copyrighted material, marks, and linked works excluded.', license_evidence_url: 'https://www.nist.gov/nist-research-library/nist-publications', license_evidence_note: 'NIST Technical Series policy grants worldwide reprint and derivative-work rights for NIST-authored works, while third-party works may remain protected.', license_family_id: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10', license_family_grouping: 'identity', family_grouping_evidence_url: null, copyright_policy: 'public-domain-with-provenance', usage_boundary: 'Supports AI RMF risk, evaluation, monitoring, human-oversight, recovery, and decommissioning mechanisms; it does not define FDE, prescribe the twelve gates, or support market, salary, or policy numbers.', link_policy: 'stable', expected_final_transport_locator: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10', expected_final_approved_at: FIXTURE_TASK_DATE, expected_final_approval_note: 'Official NIST publication page must be checked directly when registered.'}],
  ['src-google-sre-canarying-releases', {id: 'src-google-sre-canarying-releases', canonical_locator: 'https://sre.google/workbook/canarying-releases/', transport_locator: 'https://sre.google/workbook/canarying-releases/', query_insensitive: false, locator_aliases: [], tombstone: null, title: 'Canarying Releases', author_or_org: 'Alec Warner and Štěpán Davidovič / Google SRE', published_at: null, registered_at: FIXTURE_TASK_DATE, checked_at: FIXTURE_TASK_DATE, version: 'Google SRE Workbook online edition, Chapter 16; footer Copyright 2018 Google, Inc.', source_kind: 'official-docs', tier: 'primary', allowed_evidence_roles: ['method'], license: 'CC-BY-NC-ND-4.0', license_scope: 'The named Google SRE Workbook chapter within its CC BY-NC-ND 4.0 notice; Google and O’Reilly marks, linked works, code, media, figures, and third-party material under separate notices are excluded.', license_evidence_url: 'https://sre.google/workbook/canarying-releases/', license_evidence_note: 'The official chapter footer identifies Copyright © 2018 Google, Inc., Published by O’Reilly Media, Inc., and CC BY-NC-ND 4.0.', license_family_id: 'https://sre.google/workbook/canarying-releases/', license_family_grouping: 'identity', family_grouping_evidence_url: null, copyright_policy: 'facts-and-short-quotation', usage_boundary: 'Supports original facts summaries of partial time-bounded rollout, control comparison, and proceed-or-stop decisions; it is not a universal rollout process or a requirement to copy Google’s organization.', link_policy: 'stable', expected_final_transport_locator: 'https://sre.google/workbook/canarying-releases/', expected_final_approved_at: FIXTURE_TASK_DATE, expected_final_approval_note: 'Official Google SRE Workbook page must be checked directly when registered.'}],
  ['src-microsoft-foundry-run-evaluations', {id: 'src-microsoft-foundry-run-evaluations', canonical_locator: 'https://learn.microsoft.com/en-us/azure/ai-studio/how-to/evaluate-generative-ai-app', transport_locator: 'https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app', query_insensitive: false, locator_aliases: [], tombstone: null, title: 'Run evaluations from the Microsoft Foundry portal', author_or_org: 'Microsoft', published_at: '2026-06-02', registered_at: FIXTURE_TASK_DATE, checked_at: FIXTURE_TASK_DATE, version: 'MicrosoftDocs/azure-ai-docs 6ad67049e9f712d77cdb6d83c3ce210dceff9c5a, articles/foundry/how-to/evaluate-generative-ai-app.md, ms.date 2026-06-02', source_kind: 'official-docs', tier: 'primary', allowed_evidence_roles: ['method'], license: 'CC-BY-4.0', license_scope: 'The named Microsoft Foundry documentation file covered by the pinned MicrosoftDocs/azure-ai-docs CC BY 4.0 LICENSE; trademarks, linked works, code, media, and third-party assets are excluded.', license_evidence_url: 'https://github.com/MicrosoftDocs/azure-ai-docs/blob/6ad67049e9f712d77cdb6d83c3ce210dceff9c5a/LICENSE', license_evidence_note: 'The official Learn page Edit link resolves to the pinned-source family; the official repository LICENSE is Creative Commons Attribution 4.0 International.', license_family_id: 'explicit:microsoftdocs-azure-ai-docs', license_family_grouping: 'explicit:microsoftdocs-azure-ai-docs', family_grouping_evidence_url: 'https://github.com/MicrosoftDocs/azure-ai-docs/blob/6ad67049e9f712d77cdb6d83c3ce210dceff9c5a/LICENSE', copyright_policy: 'adapt-with-attribution', usage_boundary: 'Supports test-data evaluation before deployment and production-quality monitoring after deployment; it does not prescribe a universal enterprise process or prove deployment success, adoption, or business benefit.', link_policy: 'stable', expected_final_transport_locator: 'https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app', expected_final_approved_at: FIXTURE_TASK_DATE, expected_final_approval_note: 'Canonical Learn URL redirects to the Foundry URL; final transport must be checked directly when registered.'}],
  [ILLUSTRATION_SOURCE_ID, {id: ILLUSTRATION_SOURCE_ID, canonical_locator: ILLUSTRATION_LOCATOR, transport_locator: ILLUSTRATION_LOCATOR, query_insensitive: false, locator_aliases: [], tombstone: null, title: '企业 AI 四阶段十二门禁图', author_or_org: 'Tego Arch maintainers', published_at: FIXTURE_TASK_DATE, registered_at: FIXTURE_TASK_DATE, checked_at: FIXTURE_TASK_DATE, version: 'Original Draw.io and SVG pair for MTH-07', source_kind: 'original-illustration', tier: 'first-party', allowed_evidence_roles: ['illustration'], license: 'LicenseRef-Atlas-Original', license_scope: 'Original Tego Arch Draw.io and SVG assets for MTH-07; no third-party reference imagery.', license_evidence_url: null, license_evidence_note: 'Created as an original Draw.io and SVG pair for MTH-07 without third-party reference imagery.', license_family_id: ILLUSTRATION_LOCATOR, license_family_grouping: 'identity', family_grouping_evidence_url: null, copyright_policy: 'original-atlas', usage_boundary: 'Original MTH-07 illustration only; no third-party provenance or reuse rights are claimed.', link_policy: null, expected_final_transport_locator: ILLUSTRATION_LOCATOR, expected_final_approved_at: FIXTURE_TASK_DATE, expected_final_approval_note: 'Set the local asset creation and approval dates to the actual Task 3/4 date.'}],
]);
const CITATION_CONTRACTS = new Map([
  ['src-nist-ai-rmf-1-0', {source_id: 'src-nist-ai-rmf-1-0', citation_url: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10', roles: ['method'], manifest_primary: true, usage_mode: 'facts-summary', attribution_note: 'National Institute of Standards and Technology, AI RMF 1.0 (NIST AI 100-1).', modification_note: null, excerpt: null, quotation_reviewed: false}],
  ['src-google-sre-canarying-releases', {source_id: 'src-google-sre-canarying-releases', citation_url: 'https://sre.google/workbook/canarying-releases/', roles: ['method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Google SRE Workbook, “Canarying Releases” (Chapter 16).', modification_note: null, excerpt: null, quotation_reviewed: false}],
  ['src-microsoft-foundry-run-evaluations', {source_id: 'src-microsoft-foundry-run-evaluations', citation_url: 'https://learn.microsoft.com/en-us/azure/ai-studio/how-to/evaluate-generative-ai-app', roles: ['method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Microsoft Learn, “Run evaluations from the Microsoft Foundry portal.”', modification_note: null, excerpt: null, quotation_reviewed: false}],
  [ILLUSTRATION_SOURCE_ID, {source_id: ILLUSTRATION_SOURCE_ID, citation_url: ILLUSTRATION_LOCATOR, roles: ['illustration'], manifest_primary: false, usage_mode: 'original-illustration', attribution_note: '企业 AI 四阶段十二门禁图，Tego Arch maintainers', modification_note: 'Created as an original Draw.io and SVG pair for MTH-07 without third-party reference imagery.', excerpt: null, quotation_reviewed: false}],
]);
const RELATIONS = {depends_on: ['MTH-01', 'MTH-04', 'MTH-06'], adjacent_topics: ['MTH-01', 'MTH-04', 'MTH-06'], related_cases: ['/cases/temporal-saga-durable-execution'], related_questions: []};
const EXACT_METADATA = {
  title: '企业 AI 前线部署：从 POC 到可复制系统的交付门禁', slug: ROUTE, content_type: 'method', status: 'reviewed', difficulty: 'advanced', analyzed_at: SOURCE_CUTOFF, source_cutoff: SOURCE_CUTOFF, review_policy: 'quarterly-version-sensitive', confidence: 'high', domains: ['software-architecture', 'ai-systems'], agent_patterns: ['human-in-the-loop'], protocols: [], quality_attributes: ['reliability', 'security', 'maintainability'], tags: ['企业 AI', 'FDE', '交付门禁', 'POC'], summary: '用四阶段十二门禁把企业 AI 的现场问题、验收证据、生产责任、渐进放量与复制边界连接成可停止的交付闭环。', topic_id: TOPIC_ID, priority: 'P1', ...RELATIONS,
};
const TABLE_COLUMNS = ['阶段', '门禁', '风险', '机制', '证据', '通过条件', '责任人', '失败/返回目标'];
const GATE_ROWS = [
  ['进场期','需求考古','把意向当需求','访谈、工单、流程记录交叉核验','问题与基线记录','问题、角色、基线和来源可追溯','客户业务负责人','停止或返回需求考古'],
  ['进场期','流程测绘','局部自动化破坏全流程','测绘等待点、例外、决定和系统边界','现状流程图','明确失败回路与不可自动化步骤','交付/FDE 负责人','返回需求考古'],
  ['进场期','切口选择','高价值切口不可控','按价值、可测量性、可逆性与合规风险评分','切口评分','可测、可逆且数据治理条件满足','产品工程负责人','返回流程测绘'],
  ['立项期','验收标准工程','演示替代验收','建立评估集、阈值、预算和失败分级','可执行验收包','可复现并关联阶段退出条件','客户业务负责人','返回切口选择'],
  ['立项期','POC 纪律','POC 无限外推','限定假设、样本、时间盒和退出标准','POC 假设卡','只验证声明范围内假设','交付/FDE 负责人','停止或返回验收标准工程'],
  ['立项期','职责契约','共同负责导致无人负责','写明输入、决定、审批、值守和终止权','责任契约','每项风险有单一可停止的责任人','客户业务负责人','返回验收标准工程'],
  ['交付期','知识结构化','知识不可追溯或无授权','固定来源、版本、冲突和撤回路径','知识来源清单','每项知识可追溯且有授权边界','产品工程负责人','返回职责契约'],
  ['交付期','人机分工设计','模型输出越权执行','分离程序控制、AI 候选和人工授权','人机职责矩阵','不可逆动作有人授权与审计','客户业务负责人','返回职责契约'],
  ['交付期','合规与风险兜底','风险在上线后暴露','审查数据、场景、降级、停机和复核','风险与合规决定','停止权、降级和回退可触发','安全与数据负责人','返回切口选择'],
  ['放大期','渐进放量','一次性扩大影响半径','影子、白名单、对照、回滚和容量预算','放量阈值记录 v1.0','质量、失败率、成本和队列阈值均通过 v1.0','平台与运维负责人','返回验收标准工程'],
  ['放大期','信任运营','一次演示替代运行信任','监测质量、申诉、漂移、成本和人工负担','生产观测记录 v1.0','质量、成本、人工负担阈值均通过 v1.0','客户业务负责人','返回人机分工设计'],
  ['放大期','资产化复制','把客户特定逻辑当通用资产','分离通用核心、客户资产、许可证与运行责任','复制成本上限记录 v1.0','差异成本上限、数据边界和许可均通过 v1.0','交付/FDE 负责人','返回职责契约'],
];
const GATE_VISUALS = [
  ['需求考古', '风险：意向误判', '证据：基线记录', '通过：全链追溯'],
  ['流程测绘', '风险：局部伤全局', '证据：现状流程', '通过：回路明示'],
  ['切口选择', '风险：切口失控', '证据：切口评分', '通过：可测可逆'],
  ['验收标准工程', '风险：演示冒充', '证据：验收包', '通过：复现退出'],
  ['POC 纪律', '风险：外推失真', '证据：假设卡', '通过：限域验证'],
  ['职责契约', '风险：责任悬空', '证据：责任契约', '通过：单一责任'],
  ['知识结构化', '风险：知识越权', '证据：来源清单', '通过：授权追溯'],
  ['人机分工设计', '风险：模型越权', '证据：职责矩阵', '通过：人工授权'],
  ['合规与风险兜底', '风险：上线暴露', '证据：合规决定', '通过：停机回退'],
  ['渐进放量', '风险：一次放大', '证据：放量阈值', '通过：阈值全过'],
  ['信任运营', '风险：演示冒充', '证据：观测记录', '通过：运行达标'],
  ['资产化复制', '风险：特例泛化', '证据：成本上限', '通过：边界许可'],
];
const FEEDBACK_LABELS = new Map([
  ['feedback-rollout-to-acceptance', '放量回验收'],
  ['feedback-compliance-to-scope', '合规回切口'],
  ['feedback-reuse-to-contract', '复制回契约'],
]);
const LEGEND_ID = 'legend-band';
const LEGEND_LINES = ['从左到右：阶段推进', '虚线：未通过即返回'];
const DIAGRAM_FAILURE_CLASSES = new Map([
  ['route crossing', /no feedback route crossing/u],
  ['boundary collision', /node\/boundary/u],
  ['split duplicate feedback label', /exactly one visible semantic label/u],
  [':is selector override', /supported SVG subset: selector/u],
  ['at-rule override', /supported SVG subset: at-rule/u],
  ['clip-path hiding', /supported SVG subset: forbidden rendering effect clip-path/u],
  ['mask hiding', /supported SVG subset: forbidden rendering effect mask/u],
  ['filter hiding', /supported SVG subset: forbidden rendering effect filter/u],
  ['dual transform cascade', /gate-01 Draw.io\/SVG transformed bounds parity/u],
  ['polyline occluder', /supported SVG subset: element polyline/u],
  ['image occluder', /supported SVG subset: element image/u],
  ['use occluder', /supported SVG subset: element use/u],
  ['foreignObject occluder', /supported SVG subset: element foreignObject/u],
  ['text occluder', /supported SVG subset: semantic text/u],
  ['arrow rectangle', /canonical block marker/u],
  ['marker medium stroke', /stroke-expanded marker footprint/u],
  ['Draw.io endSize drift', /from Draw\.io endSize/u],
  ['SVG marker footprint drift', /markerWidth painted footprint from Draw\.io endSize/u],
  ['SVG marker endpoint offset drift', /endpoint offset from Draw\.io block marker/u],
  ['marker nonidentity translate', /feedback-arrow marker g transform is exactly identity translate\(0 0\)/u],
  ['marker nonidentity scale', /feedback-arrow marker g transform is exactly identity translate\(0 0\)/u],
  ['marker path nonidentity rotate', /feedback-arrow marker path transform is absent identity/u],
  ['percentage label coordinate', /supported SVG subset: text x/u],
  ['letter spacing', /supported SVG subset: CSS property letter-spacing/u],
  ['triangle node', /gate-01 canonical rect node/u],
  ['owner displacement', /owner band exact spacing/u],
  ['root viewBox percentage', /supported SVG subset: svg viewBox/u],
  ['root viewBox junk', /supported SVG subset: svg viewBox/u],
  ['rect x percentage', /supported SVG subset: rect x/u],
  ['rect y junk', /supported SVG subset: rect y/u],
  ['rect width unit', /supported SVG subset: rect width/u],
  ['rect height junk', /supported SVG subset: rect height/u],
  ['CSS font size percentage', /supported SVG subset: CSS property font-size/u],
  ['font size percentage', /supported SVG subset: font-size/u],
  ['translate percentage', /supported SVG subset: transform/u],
  ['translate arity', /supported SVG subset: transform/u],
  ['rotate dimensional junk', /supported SVG subset: transform/u],
  ['rotate arity', /supported SVG subset: transform/u],
  ['Draw.io ellipse node', /gate-01 Draw.io rectangle semantics/u],
  ['Draw.io rhombus node', /gate-01 Draw.io rectangle semantics/u],
  ['Draw.io rounded node', /gate-01 Draw.io rectangle semantics/u],
  ['Draw.io conflicting node shape', /gate-01 Draw.io rectangle semantics/u],
  ['mixed POC near boundary', /(?:POC 纪律 inner node\/boundary gate-05|gate-05 right horizontal padding >=16px)/u],
  ['owner band below viewBox', /owner band contained in canvas\/viewBox/u],
  ['invalid opacity occluder', /supported SVG subset: opacity/u],
  ['canvas after essentials', /opaque canvas paint precedes every essential node drawable and text/u],
  ['node stroke clipped by viewBox', /stage-entry stroke-expanded node contained in canvas\/viewBox at 800px/u],
  ['node-only occluder', /later painted rect cannot occlude essential node stage-entry/u],
  ['text-only occluder', /later painted rect cannot occlude essential text 进场期/u],
  ['owner horizontal padding 12.8px', /owner-delivery right horizontal padding >=16px/u],
  ['legend baseline gap 18px', /legend-band ordered baseline gap 1 >=22px/u],
  ['stage top padding 13.6px', /stage-entry top vertical padding >=14px/u],
  ['legend bottom padding 13.84px', /legend-band final-line bottom clearance >=14px/u],
]);
const REQUIRED_WRAPPERS = [
  {aria: '企业 AI 四阶段十二门禁图，可横向滚动', className: 'architecture-diagram-scroll'},
  {aria: '企业 AI 十二门禁执行表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
  {aria: '人、AI 与程序职责及停止条件表，可横向滚动', className: 'table-wrapper table-wrapper--mapping diagram-wrapper--scroll-owner'},
];
const DELIVERY_TERM_CONTRACTS = new Map([
  ['artificial-intelligence', {id: 'artificial-intelligence', canonical_zh: 'AI', english: null, acronym: null, kind: 'acronym', first_use: 'AI', subsequent_use: ['AI'], allowed_aliases: [], forbidden_aliases: [], note: 'MTH-07 的固定标题与元数据直接使用 AI，正文只在人机职责和企业交付语境中使用。', order: 1650}],
  ['proof-of-concept', {id: 'proof-of-concept', canonical_zh: 'POC', english: null, acronym: null, kind: 'acronym', first_use: 'POC', subsequent_use: ['POC'], allowed_aliases: [], forbidden_aliases: [], note: 'MTH-07 的固定标题与门禁合同保留 POC，正文立即解释其验证范围与禁止外推边界。', order: 1660}],
  ['forward-deployed-engineering', {id: 'forward-deployed-engineering', canonical_zh: 'FDE', english: null, acronym: null, kind: 'acronym', first_use: 'FDE', subsequent_use: ['FDE'], allowed_aliases: [], forbidden_aliases: [], note: 'MTH-07 把 FDE 定义为前线部署工程角色组合，不把职位名称当成成功条件。', order: 1670}],
]);

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const [documents, ledger, manifest, projectStatus, terminology] = await Promise.all([readContentDocuments(contentRoot), readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse), readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse), readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse), readFile(new URL('../data/terminology.json', import.meta.url), 'utf8').then(JSON.parse)]);
const peerSources = new Map(await Promise.all(PEER_CONTRACTS.map(async ({file}) => [file, await readFile(new URL(`../${file}`, import.meta.url), 'utf8')])));
const article = documents.find(({file}) => `content/${file}` === ARTICLE);

function visible(source) { return parseMdxVisibleCopy(source, ARTICLE, {includeStructure: true}).blocks.map(({text}) => text).join('\n'); }
function normalizedInternalRoute(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  const normalized = value.split(/[?#]/u, 1)[0].replace(/\/+$/u, '');
  return normalized || '/';
}
function visibleRouteOccurrenceCount(source, file, route) {
  const {ast} = parseMdxVisibleCopy(source, file, {includeAst: true});
  const definitions = new Map();
  const collectDefinitions = (node) => {
    if (node.type === 'definition') definitions.set(node.identifier, node.url);
    for (const child of node.children ?? []) collectDefinitions(child);
  };
  collectDefinitions(ast);
  const containsImage = (node) => node.type === 'image'
    || node.type === 'imageReference'
    || ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'img')
    || (node.children ?? []).some(containsImage);
  let occurrences = 0;
  const visit = (node) => {
    if (node.type === 'link' || node.type === 'linkReference') {
      const target = node.type === 'link' ? node.url : definitions.get(node.identifier);
      if (!containsImage(node) && normalizedInternalRoute(target) === route) occurrences += 1;
    } else if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      for (const attribute of node.attributes ?? []) {
        if (attribute.type !== 'mdxJsxAttribute' || !['href', 'to'].includes(attribute.name)) continue;
        if (normalizedInternalRoute(attribute.value) === route) occurrences += 1;
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return occurrences;
}
function requiredArticle() { assert.ok(article, `${ARTICLE} must exist after implementation`); return article; }
function calendarDate(value, label) { assert.match(value, /^\d{4}-\d{2}-\d{2}$/u, label); const parsed = new Date(`${value}T00:00:00.000Z`); assert.equal(parsed.toISOString().slice(0, 10), value, label); return value; }
function onOrAfter(value, minimum, label) { calendarDate(value, label); calendarDate(minimum, `${label} minimum`); assert.ok(value >= minimum, label); }
function sourceWithoutDynamicProvenance(source) { return Object.fromEntries(Object.entries(source).filter(([field]) => !DYNAMIC_PROVENANCE_DATE_FIELDS.has(field) && !(source.source_kind === 'original-illustration' && field === 'published_at'))); }
function headings(source, level) { return findMarkdownHeadings(source).filter((item) => item.level === level).map(({text}) => text); }
function section(source, heading, next) { const list = findMarkdownHeadings(source).filter(({level}) => level === 2); const index = list.findIndex(({text}) => text === heading); assert.ok(index >= 0, heading); const end = next ? list.findIndex(({text}, i) => i > index && text === next) : -1; assert.ok(!next || end >= 0, next); return source.slice(source.indexOf('\n', list[index].offset) + 1, end >= 0 ? list[end].offset : source.length); }
function table(source) { const raw = [...source.matchAll(/(?:^|\n)(\|[^\n]+\|\n\|(?:\s*:?-{3,}:?\s*\|)+\n(?:\|[^\n]+\|\n?)+)/gu)].map(([, value]) => value.trim()).find((value) => value.startsWith(`| ${TABLE_COLUMNS.join(' | ')} |`)); assert.ok(raw, 'twelve gate execution table'); return raw.split('\n').slice(2).map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim())); }
function assertMetadataAndHeadings(source) { assert.deepEqual(parseFrontMatter(source), EXACT_METADATA, 'exact canonical metadata'); assert.deepEqual(headings(source, 2), H2, 'MTH-07 only ten H2s'); assert.deepEqual(headings(section(source, '可迁移经验', '来源'), 3), TRANSFER_H3, 'transfer H3s scoped to 可迁移经验'); }
function assertGateRows(source) { const rows = table(source); assert.deepEqual(rows, GATE_ROWS, 'auditable, exact ordered gate contracts'); for (const [index, row] of rows.entries()) { assert.equal(row.length, 8, `${GATES[index]} eight fields`); assert.equal(row[0], STAGES[Math.floor(index / 3)]); assert.equal(row[1], GATES[index]); for (let field = 2; field < 8; field += 1) assert.ok(row[field].length >= 2, `${GATES[index]} field ${field}`); } }
function assertEvidenceAndResponsibilities(source) {
  const text = visible(source); for (const label of ['来源事实', '独立证据', 'Tego Arch 推断']) assert.match(text, new RegExp(label, 'u'), `${label} label`);
  assert.equal(text.split(UNSUPPORTED_CLAIM_BOUNDARY).length - 1, 1, 'one exact unsupported-claim boundary');
  assert.doesNotMatch(
    text.replace(UNSUPPORTED_CLAIM_BOUNDARY, ''),
    /(?:市场|行业规模|产业规模|赛道规模|薪资|薪酬|年薪|月薪|工资|收入|政策|法规|监管要求|监管规定|法律要求|交付成功率|商业收益)/u,
    'current four-source set cannot support claim-bearing market or sector scale, compensation, policy or regulation, delivery-rate, or business-benefit copy',
  );
  assert.equal(text.split(TEGO_ARCH_INTRO).length - 1, 1, 'natural Tego Arch introduction');
  assert.equal(text.split('Tego Arch 推断：').length - 1, 1, 'one exact Tego Arch inference label');
  assert.ok(text.indexOf(TEGO_ARCH_INTRO) < text.indexOf('Tego Arch 推断：'), 'project introduction precedes inference label');
  assert.equal(source.split('**Tego Arch 推断：**').length - 1, 1, 'exact standalone inference label');
  assert.match(text, /NIST AI RMF 1\.0 支持评估、监测与人工覆盖机制/u, 'accepted nonnumeric independent claim');
  assert.doesNotMatch(text, /(?:\u5fae\u4fe1|\u0077\u0065\u0063\u0068\u0061\u0074|mp\.\u0077\u0065\u0069\u0078\u0069\u006e\.qq\.com)/iu, 'MTH-07 visible copy excludes the excluded channel');
  const clauses = ['POC 成功不等于生产可用','生产可用不等于验收通过','验收通过不等于放量','放量不等于复制','程序负责权限校验、确定性规则、审计记录和回滚开关','AI 只负责检索、分类、生成候选或建议，不得最终授权不可逆动作','人负责授权不可逆动作、决定放量与终止','人工队列有上限、时限和能力约束','客户业务负责人拥有明确停止权'];
  for (const clause of clauses) assert.ok(text.includes(clause), clause);
  for (const forbidden of [/POC.{0,12}(?:就是|(?<!不)等于).{0,12}生产/u, /生产.{0,12}(?:就是|(?<!不)等于).{0,12}验收/u, /验收.{0,12}(?:就是|(?<!不)等于).{0,12}放量/u, /放量.{0,12}(?:就是|(?<!不)等于).{0,12}复制/u]) assert.doesNotMatch(text, forbidden, `conflation ${forbidden}`);
}
function assertPeerRelations(sources) {
  for (const {file, adjacentTopics, backlink, conclusion, forbiddenPattern} of PEER_CONTRACTS) {
    const source = sources.get(file);
    assert.ok(source, `${file} is read by the focused contract`);
    if (adjacentTopics) assert.deepEqual(parseFrontMatter(source).adjacent_topics, adjacentTopics, `${file} exact reverse metadata`);
    assert.equal(visibleRouteOccurrenceCount(source, file, ROUTE), 1, `${file} exactly one raw visible MTH-07 route occurrence`);
    assert.equal(source.split(backlink).length - 1, 1, `${file} exact bounded backlink`);
    assert.equal(source.split(conclusion).length - 1, 1, `${file} preserves its conclusion`);
    const text = parseMdxVisibleCopy(source, file, {includeStructure: true}).blocks.map(({text: block}) => block).join('\n');
    assert.doesNotMatch(text, forbiddenPattern, `${file} preserves its bounded conclusion without the contradictory claim`);
  }
}
function assertWrappersAndArrowBehavior(source) {
  assert.match(source, /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u, 'uses canonical handler import'); const region = {scrollLeft: 0, scrollWidth: 200, clientWidth: 100}; let prevented = false; handleHorizontalArrowKey({key: 'ArrowRight', target: region, currentTarget: region, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, preventDefault: () => { prevented = true; }}); assert.equal(region.scrollLeft, 40, 'canonical ArrowRight scrolls focused overflow region'); assert.equal(prevented, true, 'canonical handler prevents default');
  for (const {aria, className} of REQUIRED_WRAPPERS) assert.equal(source.split(`<div className="${className}" role="region" aria-label="${aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>`).length - 1, 1, aria);
}
function assertNarrowHeadingContract() {
  const expected = H2.map((heading) => `## ${heading}`);
  assert.deepEqual(knowledgeHeadingContract('method', TOPIC_ID), expected,
    'MTH-07 exact method-only ten-H2 exception');
  assert.deepEqual(knowledgeHeadingContract('method', 'MTH-06'), knowledgeTypeContracts.method,
    'other methods retain the nine-H2 method contract');
  assert.deepEqual(knowledgeHeadingContract('concept', TOPIC_ID), knowledgeTypeContracts.concept,
    'MTH-07 topic_id cannot escape through non-method metadata');
}
function assertDeliveryTermContracts(value) {
  for (const [id, expected] of DELIVERY_TERM_CONTRACTS) {
    assert.deepEqual(value.terms.find((term) => term.id === id), expected, `${id} exact terminology contract`);
  }
}
function decodeXml(value) {
  return value.replace(/&#x([\da-f]+);/giu, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/gu, '"').replace(/&apos;|&#39;/gu, "'")
    .replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&amp;/gu, '&');
}

function xmlAttributes(raw) {
  return new Map([...raw.matchAll(/([\w:.-]+)\s*=\s*(["'])([\s\S]*?)\2/gu)]
    .map(([, key, , value]) => [key, decodeXml(value)]));
}

function xmlModel(source) {
  const root = {attributes: new Map(), children: [], index: -1, name: '#document', ownText: [], parent: null};
  const elements = [];
  const stack = [root];
  let cursor = 0;
  for (const match of source.matchAll(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\/?[A-Za-z][^>]*>/gu)) {
    if (match.index > cursor) stack.at(-1).ownText.push(source.slice(cursor, match.index));
    const tag = match[0];
    cursor = match.index + tag.length;
    if (tag.startsWith('<!--') || tag.startsWith('<?') || tag.startsWith('<!')) continue;
    if (tag.startsWith('</')) {
      assert.equal(stack.at(-1).name, tag.match(/^<\/([^\s>]+)/u)?.[1], 'well-nested XML');
      stack.pop();
      continue;
    }
    const opening = tag.match(/^<([A-Za-z][\w:.-]*)\b([\s\S]*?)\/?\s*>$/u);
    assert.ok(opening, `XML tag ${tag}`);
    const element = {
      attributes: xmlAttributes(opening[2]),
      children: [],
      index: elements.length,
      name: opening[1],
      ownText: [],
      parent: stack.at(-1),
      sourceIndex: match.index,
      tag,
    };
    elements.push(element);
    stack.at(-1).children.push(element);
    if (!/\/\s*>$/u.test(tag)) stack.push(element);
  }
  if (cursor < source.length) stack.at(-1).ownText.push(source.slice(cursor));
  assert.equal(stack.length, 1, 'closed XML elements');
  return {elements, root, source};
}

function descendants(element, name) {
  const result = [];
  const visit = (current) => {
    for (const child of current.children) {
      if (!name || child.name === name) result.push(child);
      visit(child);
    }
  };
  visit(element);
  return result;
}

function xmlText(element) {
  return decodeXml(`${element.ownText.join('')}${element.children.map(xmlText).join('')}`);
}

function parsedDrawio(source) {
  const model = xmlModel(source);
  assert.ok(model.elements.some(({name}) => name === 'mxfile'), 'Draw.io mxfile');
  const cells = model.elements.filter(({name}) => name === 'mxCell').map((element) => ({
    ...element,
    geometry: element.children.find(({name}) => name === 'mxGeometry'),
  }));
  return {cells, model};
}

function parsedDrawioStyle(cell) {
  return new Map((cell.attributes.get('style') ?? '').split(';').map((item) => item.trim()).filter(Boolean).map((item) => {
    const split = item.indexOf('=');
    return [split < 0 ? item : item.slice(0, split), split < 0 ? '1' : item.slice(split + 1)];
  }));
}

function assertDrawioRectangleStyle(cell, style, id) {
  const diagnostic = `${id} Draw.io rectangle semantics`;
  const styleItems = (cell.attributes.get('style') ?? '').split(';').map((item) => item.trim()).filter(Boolean);
  assert.ok(styleItems.filter((item) => item.split('=', 1)[0] === 'shape').length <= 1, diagnostic);
  assert.equal(style.get('shape') ?? 'rectangle', 'rectangle', diagnostic);
  assert.equal(style.get('rounded') ?? '0', '0', diagnostic);
  assert.equal(style.has('ellipse') || style.has('rhombus'), false, diagnostic);
}

function cssDeclarations(raw) {
  const result = new Map();
  const assign = (property, value) => {
    const previous = result.get(property);
    const previousImportant = /\s*!important\s*$/iu.test(previous ?? '');
    const nextImportant = /\s*!important\s*$/iu.test(value);
    if (previous === undefined || nextImportant || !previousImportant) result.set(property, value);
  };
  for (const item of raw.split(';').map((value) => value.trim()).filter(Boolean)) {
    const split = item.indexOf(':');
    assert.ok(split > 0, `CSS declaration ${item}`);
    const property = item.slice(0, split).trim().toLowerCase();
    const value = item.slice(split + 1).trim();
    assign(property, value);
    if (property === 'font') {
      const important = /\s*!important\s*$/iu.test(value) ? ' !important' : '';
      const font = value.replace(/\s*!important\s*$/iu, '').trim();
      const size = font.match(/(?:^|\s)(\d+(?:\.\d+)?(?:px|pt))(?:\/[^\s]+)?(?:\s|$)/iu);
      assert.ok(size, `CSS font shorthand size ${font}`);
      const before = font.slice(0, size.index).trim().split(/\s+/u).filter(Boolean);
      const after = font.slice(size.index + size[0].length).trim();
      assign('font-family', `${after}${important}`);
      assign('font-size', `${size[1]}${important}`);
      assign('font-style', `${before.find((token) => /^(?:italic|oblique|normal)$/iu.test(token)) ?? 'normal'}${important}`);
      assign('font-weight', `${before.find((token) => /^(?:bold|bolder|lighter|[1-9]00|normal)$/iu.test(token)) ?? 'normal'}${important}`);
    }
  }
  return result;
}

function declarationValue(items, property) {
  return items.get(property);
}

function simpleSelectorMatches(element, selector) {
  let clean = selector.replace(/:root/gu, element.name === 'svg' ? '' : ':never');
  for (const match of [...clean.matchAll(/:not\(([^()]*)\)/gu)]) {
    if (simpleSelectorMatches(element, match[1])) return false;
    clean = clean.replace(match[0], '');
  }
  if (/:/u.test(clean)) return false;
  const type = clean.match(/^[A-Za-z][\w-]*/u)?.[0];
  if (type && type !== element.name) return false;
  const id = clean.match(/#([\w-]+)/u)?.[1];
  if (id && element.attributes.get('id') !== id) return false;
  const classes = new Set((element.attributes.get('class') ?? '').split(/\s+/u).filter(Boolean));
  if (![...clean.matchAll(/\.([\w-]+)/gu)].every(([, className]) => classes.has(className))) return false;
  return [...clean.matchAll(/\[([\w:.-]+)(?:\s*=\s*["']?([^\]"']+)["']?)?\]/gu)]
    .every(([, key, value]) => element.attributes.has(key) &&
      (value === undefined || element.attributes.get(key) === value.trim()));
}

function selectorTokens(selector) {
  return selector.trim().replace(/\s*>\s*/gu, ' > ').split(/\s+/u).filter(Boolean);
}

function selectorMatches(element, selector) {
  const tokens = selectorTokens(selector);
  let cursor = tokens.length - 1;
  let current = element;
  if (!current || !simpleSelectorMatches(current, tokens[cursor])) return false;
  cursor -= 1;
  while (cursor >= 0) {
    if (tokens[cursor] === '>') {
      current = current.parent;
      cursor -= 1;
      if (!current || !simpleSelectorMatches(current, tokens[cursor])) return false;
      cursor -= 1;
    } else {
      const expected = tokens[cursor--];
      current = current.parent;
      while (current && !simpleSelectorMatches(current, expected)) current = current.parent;
      if (!current) return false;
    }
  }
  return true;
}

function selectorSpecificity(selector) {
  const normalized = selector.replace(/:not\(([^()]*)\)/gu, '$1');
  return [
    0,
    [...normalized.matchAll(/#[\w-]+/gu)].length,
    [...normalized.matchAll(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/gu)].length,
    selectorTokens(normalized).filter((token) => /^[A-Za-z][\w-]*/u.test(token)).length,
  ];
}

function compareSpecificity(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function parsedSvg(source) {
  const model = xmlModel(source);
  const root = model.elements.find(({name}) => name === 'svg');
  assert.ok(root, 'SVG root');
  assert.equal(root.attributes.get('role'), 'img', 'SVG role=img');
  const rules = [];
  let order = 0;
  for (const style of model.elements.filter(({name}) => name === 'style')) {
    for (const match of xmlText(style).replace(/\/\*[\s\S]*?\*\//gu, '').matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      for (const selector of match[1].split(',').map((item) => item.trim()).filter(Boolean)) {
        rules.push({declarations: cssDeclarations(match[2]), order: order++, selector, specificity: selectorSpecificity(selector)});
      }
    }
  }
  const result = {...model, root, rules};
  assertSupportedSvgSubset(result);
  return result;
}

function ownSvgValue(model, element, property, includePresentation = true) {
  let winner = includePresentation && element.attributes.has(property) ? {
    important: false,
    order: -1,
    specificity: [0, 0, 0, 0],
    value: element.attributes.get(property),
  } : null;
  const consider = (candidate) => {
    if (!winner || Number(candidate.important) > Number(winner.important) ||
      (candidate.important === winner.important &&
        (compareSpecificity(candidate.specificity, winner.specificity) > 0 ||
          (compareSpecificity(candidate.specificity, winner.specificity) === 0 && candidate.order > winner.order)))) {
      winner = candidate;
    }
  };
  for (const rule of model.rules) {
    const raw = declarationValue(rule.declarations, property);
    if (raw === undefined || !selectorMatches(element, rule.selector)) continue;
    consider({...rule, important: /\s*!important\s*$/iu.test(raw), value: raw.replace(/\s*!important\s*$/iu, '').trim()});
  }
  const inline = declarationValue(cssDeclarations(element.attributes.get('style') ?? ''), property);
  if (inline !== undefined) {
    consider({
      important: /\s*!important\s*$/iu.test(inline),
      order: Number.MAX_SAFE_INTEGER,
      specificity: [1, 0, 0, 0],
      value: inline.replace(/\s*!important\s*$/iu, '').trim(),
    });
  }
  return winner?.value;
}

const INHERITED_SVG_PROPERTIES = new Set([
  'color', 'fill', 'fill-opacity', 'font-family', 'font-size', 'font-style', 'font-weight',
  'marker-end', 'stroke', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
  'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'visibility',
]);
const SVG_DEFAULTS = new Map([
  ['color', '#000000'], ['fill', '#000000'], ['fill-opacity', '1'], ['font-family', 'Arial'],
  ['font-size', '16'], ['font-style', 'normal'], ['font-weight', '400'], ['marker-end', 'none'],
  ['opacity', '1'], ['stroke', 'none'], ['stroke-dasharray', 'none'], ['stroke-opacity', '1'],
  ['stroke-width', '1'], ['text-anchor', 'start'], ['text-decoration', 'none'], ['visibility', 'visible'],
]);

const SUPPORTED_SVG_ELEMENTS = new Set(['svg', 'title', 'desc', 'style', 'defs', 'marker', 'g', 'rect', 'path', 'polygon', 'circle', 'text', 'tspan']);
const SUPPORTED_CSS_PROPERTIES = new Set([
  'color', 'display', 'fill', 'fill-opacity', 'font', 'font-family', 'font-size', 'font-style', 'font-weight',
  'marker-end', 'opacity', 'stroke', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity',
  'stroke-width', 'text-anchor', 'text-decoration', 'transform', 'visibility',
]);
const SVG_PRESENTATION_PROPERTIES = new Set([...SUPPORTED_CSS_PROPERTIES].filter((property) => property !== 'font'));
const SUPPORTED_ATTRIBUTES = new Map([
  ['svg', new Set(['xmlns', 'role', 'aria-labelledby', 'viewBox'])],
  ['title', new Set(['id'])],
  ['desc', new Set(['id'])],
  ['style', new Set([])],
  ['defs', new Set([])],
  ['marker', new Set(['id', 'markerUnits', 'markerWidth', 'markerHeight', 'viewBox', 'refX', 'refY', 'orient', 'preserveAspectRatio'])],
  ['g', new Set(['class', 'data-node-id', 'transform', 'style', 'opacity', 'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width'])],
  ['rect', new Set(['id', 'class', 'data-canvas', 'data-edge-id', 'x', 'y', 'width', 'height', 'transform', 'style', 'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'opacity'])],
  ['path', new Set(['id', 'class', 'data-edge-id', 'data-source', 'data-target', 'd', 'transform', 'style', 'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'stroke-dasharray', 'marker-end', 'opacity'])],
  ['polygon', new Set(['id', 'class', 'points', 'transform', 'style', 'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'opacity'])],
  ['circle', new Set(['id', 'class', 'cx', 'cy', 'r', 'transform', 'style', 'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'opacity'])],
  ['text', new Set(['id', 'class', 'data-edge-label', 'x', 'y', 'transform', 'style', 'fill', 'fill-opacity', 'font-family', 'font-size', 'font-style', 'font-weight', 'text-anchor', 'text-decoration', 'opacity', 'visibility'])],
  ['tspan', new Set(['x', 'y', 'dx', 'dy', 'transform', 'style', 'fill', 'fill-opacity', 'font-family', 'font-size', 'font-style', 'font-weight', 'text-anchor', 'text-decoration', 'opacity', 'visibility'])],
]);
const SVG_NUMBER_SOURCE = String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?`;
const SVG_NUMBER = new RegExp(`^${SVG_NUMBER_SOURCE}$`, 'iu');

function strictNumber(value, label) {
  const source = String(value ?? '').trim();
  assert.match(source, SVG_NUMBER, label);
  const result = Number(source);
  assert.ok(Number.isFinite(result), label);
  return result;
}

function strictNumberList(value, label, allowedCounts) {
  const source = String(value ?? '').trim();
  assert.match(source, new RegExp(`^${SVG_NUMBER_SOURCE}(?:(?:\\s*,\\s*|\\s+)${SVG_NUMBER_SOURCE})*$`, 'iu'), label);
  const result = source.split(/[\s,]+/u).map(Number);
  assert.ok(result.every(Number.isFinite) && allowedCounts.includes(result.length), label);
  return result;
}

function strictPositiveNumber(value, label) {
  const result = strictNumber(value, label);
  assert.ok(result > 0, label);
  return result;
}

function strictUserLength(value, label, {positive = false} = {}) {
  const source = String(value ?? '').trim();
  const match = source.match(new RegExp(`^(${SVG_NUMBER_SOURCE})(?:px)?$`, 'iu'));
  assert.ok(match, label);
  const result = Number(match[1]);
  assert.ok(Number.isFinite(result) && (!positive || result > 0), label);
  return result;
}

function supportedTransformFunctions(value, label = 'supported SVG subset: transform') {
  const source = String(value ?? '').trim();
  if (source === 'none') return [];
  const result = [];
  let cursor = 0;
  for (const match of source.matchAll(/([A-Za-z]+)\s*\(([^()]*)\)/gu)) {
    assert.match(source.slice(cursor, match.index), /^[\s,]*$/u, label);
    const [, name, raw] = match;
    const allowedArities = new Map([
      ['matrix', [6]], ['translate', [1, 2]], ['scale', [1, 2]], ['rotate', [1, 3]],
    ]).get(name);
    assert.ok(allowedArities, label);
    const values = strictNumberList(raw, label, allowedArities);
    result.push({name, values});
    cursor = match.index + match[0].length;
  }
  assert.ok(result.length > 0, label);
  assert.match(source.slice(cursor), /^\s*$/u, label);
  return result;
}

function assertSupportedColor(value, label, {allowNone = true} = {}) {
  const source = String(value ?? '').trim();
  if (allowNone && /^(?:none|transparent)$/iu.test(source)) return;
  if (/^(?:currentColor|white|black|#[\da-f]{3}|#[\da-f]{6})$/iu.test(source)) return;
  const rgb = source.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/u);
  assert.ok(rgb && rgb.slice(1).every((channel) => Number(channel) <= 255), label);
}

function assertSupportedFontShorthand(value, label) {
  const source = String(value ?? '').trim();
  const match = source.match(new RegExp(`^(.*?)(${SVG_NUMBER_SOURCE}px)\\s+(.+)$`, 'iu'));
  assert.ok(match, label);
  const prefix = match[1].trim().split(/\s+/u).filter(Boolean);
  assert.ok(prefix.every((token) => /^(?:normal|italic|oblique|bold|[1-9]00)$/iu.test(token)), label);
  assert.ok(prefix.filter((token) => /^(?:italic|oblique)$/iu.test(token)).length <= 1, label);
  assert.ok(prefix.filter((token) => /^(?:bold|[1-9]00)$/iu.test(token)).length <= 1, label);
  strictUserLength(match[2], label, {positive: true});
  assert.match(match[3].trim(), /^(?:['"]?[\w -]+['"]?)(?:\s*,\s*['"]?[\w -]+['"]?)*$/u, label);
}

function assertSupportedCssValue(property, value, label) {
  const validators = new Map([
    ['color', (item) => assertSupportedColor(item, label, {allowNone: false})],
    ['display', (item) => assert.match(item, /^(?:inline|none)$/u, label)],
    ['fill', (item) => assertSupportedColor(item, label)],
    ['fill-opacity', (item) => { const number = strictNumber(item, label); assert.ok(number >= 0 && number <= 1, label); }],
    ['font', (item) => assertSupportedFontShorthand(item, label)],
    ['font-family', (item) => assert.match(item, /^(?:['"]?[\w -]+['"]?)(?:\s*,\s*['"]?[\w -]+['"]?)*$/u, label)],
    ['font-size', (item) => strictUserLength(item, label, {positive: true})],
    ['font-style', (item) => assert.match(item, /^(?:normal|italic|oblique)$/u, label)],
    ['font-weight', (item) => assert.match(item, /^(?:normal|bold|[1-9]00)$/u, label)],
    ['marker-end', (item) => assert.match(item, /^(?:none|url\(\s*#[\w.-]+\s*\))$/u, label)],
    ['opacity', (item) => { const number = strictNumber(item, label); assert.ok(number >= 0 && number <= 1, label); }],
    ['stroke', (item) => assertSupportedColor(item, label)],
    ['stroke-dasharray', (item) => {
      if (item === 'none') return;
      const numbers = strictNumberList(item, label, [...Array(32)].map((_, index) => index + 1));
      assert.ok(numbers.every((number) => number >= 0) && numbers.some((number) => number > 0), label);
    }],
    ['stroke-linecap', (item) => assert.match(item, /^(?:butt|round|square)$/u, label)],
    ['stroke-linejoin', (item) => assert.match(item, /^(?:miter|round|bevel)$/u, label)],
    ['stroke-opacity', (item) => { const number = strictNumber(item, label); assert.ok(number >= 0 && number <= 1, label); }],
    ['stroke-width', (item) => { const number = strictUserLength(item, label); assert.ok(number >= 0, label); }],
    ['text-anchor', (item) => assert.match(item, /^(?:start|middle|end)$/u, label)],
    ['text-decoration', (item) => assert.match(item, /^(?:none|underline)$/u, label)],
    ['transform', (item) => supportedTransformFunctions(item, label)],
    ['visibility', (item) => assert.match(item, /^(?:visible|hidden|collapse)$/u, label)],
  ]);
  const validator = validators.get(property);
  assert.ok(validator, `supported SVG subset: missing CSS value validator ${property}`);
  validator(value);
}

function assertSupportedAttributeValue(element, attribute, value) {
  const label = `supported SVG subset: ${element.name} ${attribute}`;
  if (SVG_PRESENTATION_PROPERTIES.has(attribute)) {
    assertSupportedCssValue(attribute, value, `supported SVG subset: ${attribute}`);
    return;
  }
  if (['id', 'data-node-id', 'data-edge-id', 'data-edge-label', 'data-source', 'data-target'].includes(attribute)) {
    assert.match(value, /^[\w.-]+$/u, label);
  } else if (attribute === 'xmlns') {
    assert.equal(value, 'http://www.w3.org/2000/svg', label);
  } else if (attribute === 'aria-labelledby') {
    assert.match(value, /^[\w.-]+(?:\s+[\w.-]+)+$/u, label);
  } else if (attribute === 'class') {
    assert.match(value, /^[\w-]+(?:\s+[\w-]+)*$/u, label);
  } else if (attribute === 'data-canvas') {
    assert.equal(value, 'true', label);
  } else if (attribute === 'role') {
    assert.equal(value, 'img', label);
  } else if (attribute === 'style') {
    assertSupportedCssDeclarations(value);
  } else if (attribute === 'viewBox') {
    const numbers = strictNumberList(value, label, [4]);
    assert.ok(numbers[2] > 0 && numbers[3] > 0, label);
  } else if (['x', 'y', 'dx', 'dy', 'cx', 'cy', 'refX', 'refY'].includes(attribute)) {
    strictNumber(value, label);
  } else if (['width', 'height', 'r', 'markerWidth', 'markerHeight'].includes(attribute)) {
    strictPositiveNumber(value, label);
  } else if (attribute === 'transform') {
    supportedTransformFunctions(value, 'supported SVG subset: transform');
  } else if (attribute === 'markerUnits') {
    assert.match(value, /^(?:strokeWidth|userSpaceOnUse)$/u, label);
  } else if (attribute === 'orient') {
    if (!/^(?:auto|auto-start-reverse)$/u.test(value)) strictNumber(value, label);
  } else if (attribute === 'preserveAspectRatio') {
    assert.match(value, /^(?:none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?:\s+(?:meet|slice))?)$/u, label);
  } else if (attribute === 'points') {
    const numbers = strictNumberList(value, label, [...Array(64)].map((_, index) => index + 1));
    assert.ok(numbers.length >= 6 && numbers.length % 2 === 0, label);
  } else if (attribute === 'd') {
    const geometry = parsedPath(value, label);
    assert.ok(geometry.points.length >= 2, label);
  } else {
    assert.fail(`supported SVG subset: missing attribute value validator ${element.name} ${attribute}`);
  }
}

function assertSupportedSelector(selector) {
  assert.doesNotMatch(selector, /[@:+~*]|\(|\)/u, 'supported SVG subset: selector has no pseudo/functional/at-rule syntax');
  for (const token of selectorTokens(selector).filter((token) => token !== '>')) {
    assert.match(token, /^(?:[A-Za-z][\w-]*)?(?:#[\w-]+)?(?:\.[\w-]+)*(?:\[[\w:.-]+(?:=["']?[^\]"']+["']?)?\])*$/u,
      'supported SVG subset: selector token');
  }
}

function assertSupportedCssDeclarations(raw) {
  for (const item of raw.split(';').map((value) => value.trim()).filter(Boolean)) {
    const split = item.indexOf(':');
    assert.ok(split > 0, `supported SVG subset: CSS declaration ${item}`);
    const property = item.slice(0, split).trim().toLowerCase();
    assert.ok(SUPPORTED_CSS_PROPERTIES.has(property), `supported SVG subset: CSS property ${property}`);
    const value = item.slice(split + 1).replace(/\s*!important\s*$/iu, '').trim();
    assertSupportedCssValue(property, value, `supported SVG subset: CSS property ${property}`);
  }
}

function assertSupportedSvgSubset(model) {
  for (const element of model.elements) {
    assert.ok(SUPPORTED_SVG_ELEMENTS.has(element.name), `supported SVG subset: element ${element.name}`);
    for (const attribute of element.attributes.keys()) {
      assert.equal(['clip-path', 'mask', 'filter'].includes(attribute), false,
        `supported SVG subset: forbidden rendering effect ${attribute}`);
      assert.ok(SUPPORTED_ATTRIBUTES.get(element.name).has(attribute),
        `supported SVG subset: ${element.name} attribute ${attribute}`);
      assertSupportedAttributeValue(element, attribute, element.attributes.get(attribute));
    }
    if (['text', 'tspan'].includes(element.name)) {
      assert.equal(descendants(element).some((child) => !['tspan'].includes(child.name)), false,
        'supported SVG subset: semantic text children');
      if (element.name === 'tspan') assert.equal(descendants(element).length, 0,
        'supported SVG subset: flat tspan runs');
    }
  }
  for (const style of model.elements.filter(({name}) => name === 'style')) {
    const css = xmlText(style).replace(/\/\*[\s\S]*?\*\//gu, '');
    assert.doesNotMatch(css, /@/u, 'supported SVG subset: at-rule');
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)];
    assert.equal(rules.map((match) => match[0]).join('').replace(/\s+/gu, ''), css.replace(/\s+/gu, ''),
      'supported SVG subset: flat CSS rules');
    for (const rule of rules) {
      for (const selector of rule[1].split(',').map((item) => item.trim()).filter(Boolean)) assertSupportedSelector(selector);
      assertSupportedCssDeclarations(rule[2]);
    }
  }
  const allowedDuplicateValues = [...FEEDBACK_LABELS.values()];
  for (const element of model.elements.filter(({name}) => name === 'text')) {
    if (!element.attributes.has('data-edge-label') && !owningNodeGroup(element)) {
      assert.ok(allowedDuplicateValues.includes(visibleTextSemanticValue(element)),
        'supported SVG subset: semantic text is only a feedback-cardinality probe');
    }
  }
}

function svgValue(model, element, property) {
  for (let current = element; current; current = INHERITED_SVG_PROPERTIES.has(property) ? current.parent : null) {
    const value = ownSvgValue(model, current, property);
    if (value !== undefined) return value;
  }
  return SVG_DEFAULTS.get(property);
}

function ancestorOpacity(model, element) {
  let value = 1;
  for (let current = element; current && current.name !== '#document'; current = current.parent) {
    value *= Number(ownSvgValue(model, current, 'opacity') ?? 1);
  }
  return value;
}

function isRendered(model, element) {
  for (let current = element; current && current.name !== '#document'; current = current.parent) {
    if (ownSvgValue(model, current, 'display') === 'none') return false;
  }
  return !/^(?:hidden|collapse)$/u.test(svgValue(model, element, 'visibility')) && ancestorOpacity(model, element) > 0;
}

function normalizedColor(value, model, element) {
  let color = String(value ?? '').trim().toLowerCase();
  if (color === 'currentcolor') color = svgValue(model, element, 'color');
  if (color === 'white') color = '#ffffff';
  if (color === 'black') color = '#000000';
  if (/^#[\da-f]{3}$/iu.test(color)) color = `#${[...color.slice(1)].map((digit) => digit.repeat(2)).join('')}`;
  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/u);
  if (rgbMatch) color = `#${rgbMatch.slice(1).map((item) => Number(item).toString(16).padStart(2, '0')).join('')}`;
  assert.match(color, /^#[\da-f]{6}$/iu, `opaque SVG color ${String(value)}`);
  return color.toUpperCase();
}

function effectivePaint(model, element, kind) {
  const raw = svgValue(model, element, kind);
  if (!isRendered(model, element) || raw === 'none' || raw === 'transparent' || raw === undefined) return {color: null, opacity: 0};
  const opacity = ancestorOpacity(model, element) * Number(svgValue(model, element, `${kind}-opacity`) ?? 1);
  assert.ok(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1, `${element.name} effective ${kind} opacity`);
  return {color: opacity > 0 ? normalizedColor(raw, model, element) : null, opacity};
}

function numericTokens(value) {
  return (String(value ?? '').match(/-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/giu) ?? []).map(Number);
}

const IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];

function multiplyMatrices(left, right) {
  return [
    left[0] * right[0] + left[2] * right[1],
    left[1] * right[0] + left[3] * right[1],
    left[0] * right[2] + left[2] * right[3],
    left[1] * right[2] + left[3] * right[3],
    left[0] * right[4] + left[2] * right[5] + left[4],
    left[1] * right[4] + left[3] * right[5] + left[5],
  ];
}

function elementTransform(model, element) {
  const presentation = transformMatrix(element.attributes.get('transform'));
  const css = model ? ownSvgValue(model, element, 'transform', false) : undefined;
  return css === undefined ? presentation : (css === 'none' ? IDENTITY_MATRIX : transformMatrix(css));
}

function transformMatrix(value) {
  let matrix = IDENTITY_MATRIX;
  const functions = String(value ?? '').trim() === '' ? [] : supportedTransformFunctions(value);
  for (const {name, values} of functions) {
    let next;
    if (name === 'matrix') {
      next = values;
    } else if (name === 'translate') {
      next = [1, 0, 0, 1, values[0], values[1] ?? 0];
    } else if (name === 'scale') {
      next = [values[0], 0, 0, values[1] ?? values[0], 0, 0];
    } else if (name === 'rotate') {
      const radians = values[0] * Math.PI / 180;
      const rotation = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0];
      next = values.length >= 3
        ? multiplyMatrices(multiplyMatrices([1, 0, 0, 1, values[1], values[2]], rotation), [1, 0, 0, 1, -values[1], -values[2]])
        : rotation;
    }
    matrix = multiplyMatrices(matrix, next);
  }
  return matrix;
}

function worldTransform(element, model = null) {
  const chain = [];
  for (let current = element; current && current.name !== '#document'; current = current.parent) chain.unshift(current);
  return chain.reduce((matrix, current) => multiplyMatrices(matrix, elementTransform(model, current)), IDENTITY_MATRIX);
}

function transformRelativeTo(element, ancestor, model = null) {
  const chain = [];
  for (let current = element; current; current = current.parent) {
    chain.unshift(current);
    if (current === ancestor) break;
  }
  assert.equal(chain[0], ancestor, 'relative transform ancestor');
  return chain.reduce((matrix, current) => multiplyMatrices(matrix, elementTransform(model, current)), IDENTITY_MATRIX);
}

function transformedPoint(matrix, point) {
  return {
    x: matrix[0] * point.x + matrix[2] * point.y + matrix[4],
    y: matrix[1] * point.x + matrix[3] * point.y + matrix[5],
  };
}

function parsedPath(value, label = 'path') {
  const source = String(value ?? '');
  const unsupported = source
    .replace(/-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/giu, '')
    .replace(/[MmLlHhVvZz]/gu, '').replace(/[\s,]+/gu, '');
  assert.equal(unsupported, '', `${label} contains only supported linear path syntax`);
  const tokens = source.match(/[MmLlHhVvZz]|-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/giu) ?? [];
  const result = [];
  let command;
  let cursor = 0;
  let current = {x: 0, y: 0};
  let closed = false;
  let moveCount = 0;
  const number = () => {
    assert.ok(cursor < tokens.length && !/^[A-Za-z]$/u.test(tokens[cursor]), `${label} coordinate`);
    return Number(tokens[cursor++]);
  };
  while (cursor < tokens.length) {
    if (/^[A-Za-z]$/u.test(tokens[cursor])) command = tokens[cursor++];
    assert.ok(command, `${label} command`);
    if (/[MmLl]/u.test(command)) {
      const relative = command === command.toLowerCase();
      const x = number();
      const y = number();
      current = {x: relative ? current.x + x : x, y: relative ? current.y + y : y};
      result.push(current);
      if (/[Mm]/u.test(command)) {
        moveCount += 1;
        command = relative ? 'l' : 'L';
      }
    } else if (/[Hh]/u.test(command)) {
      const x = number();
      current = {...current, x: command === 'h' ? current.x + x : x};
      result.push(current);
    } else if (/[Vv]/u.test(command)) {
      const y = number();
      current = {...current, y: command === 'v' ? current.y + y : y};
      result.push(current);
    } else if (/[Zz]/u.test(command)) {
      closed = true;
      command = null;
    } else {
      assert.fail(`${label} unsupported command ${command}`);
    }
  }
  assert.ok(result.length >= 2, `${label} visible geometry`);
  assert.equal(moveCount, 1, `${label} exactly one continuous subpath`);
  return {closed, points: result};
}

function parsedPolygonPoints(value) {
  const values = numericTokens(value);
  assert.equal(values.length % 2, 0, 'polygon coordinate pairs');
  const result = [];
  for (let index = 0; index < values.length; index += 2) result.push({x: values[index], y: values[index + 1]});
  return result;
}

function geometryBounds(items) {
  assert.ok(items.length > 0, 'geometry points');
  return {
    bottom: Math.max(...items.map(({y}) => y)),
    left: Math.min(...items.map(({x}) => x)),
    right: Math.max(...items.map(({x}) => x)),
    top: Math.min(...items.map(({y}) => y)),
  };
}

function assertClose(actual, expected, label, tolerance = 1e-9) {
  assert.ok(Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, received ${actual}`);
}

function renderedGeometry(element, relativeTo = null, model = null) {
  const attributes = element.attributes;
  let shapePoints;
  let closed = false;
  if (element.name === 'rect') {
    const x = Number(attributes.get('x') ?? 0);
    const y = Number(attributes.get('y') ?? 0);
    const width = Number(attributes.get('width'));
    const height = Number(attributes.get('height'));
    assert.ok([x, y, width, height].every(Number.isFinite), 'finite rectangle');
    shapePoints = [{x, y}, {x: x + width, y}, {x: x + width, y: y + height}, {x, y: y + height}];
    closed = true;
  } else if (element.name === 'circle') {
    const cx = Number(attributes.get('cx'));
    const cy = Number(attributes.get('cy'));
    const radius = Number(attributes.get('r'));
    assert.ok([cx, cy, radius].every(Number.isFinite), 'finite circle');
    shapePoints = Array.from({length: 96}, (_, index) => ({
      x: cx + Math.cos(index * Math.PI / 48) * radius,
      y: cy + Math.sin(index * Math.PI / 48) * radius,
    }));
    closed = true;
  } else if (element.name === 'polygon' || element.name === 'polyline') {
    shapePoints = parsedPolygonPoints(attributes.get('points'));
    closed = element.name === 'polygon';
  } else if (element.name === 'path') {
    ({closed, points: shapePoints} = parsedPath(attributes.get('d'), attributes.get('data-edge-id') ?? attributes.get('id') ?? 'path'));
  } else {
    return null;
  }
  const matrix = relativeTo ? transformRelativeTo(element, relativeTo, model) : worldTransform(element, model);
  const transformed = shapePoints.map((point) => transformedPoint(matrix, point));
  return {bounds: geometryBounds(transformed), closed, element, points: transformed};
}

function geometrySegments(items, closed = false) {
  const result = items.slice(1).map((right, index) => ({left: items[index], right}));
  if (closed && items.length > 2) result.push({left: items.at(-1), right: items[0]});
  return result;
}

function polygonArea(points) {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
}

function geometryLength(points, closed = false) {
  return geometrySegments(points, closed).reduce((sum, {left, right}) =>
    sum + Math.hypot(right.x - left.x, right.y - left.y), 0);
}

function geometryCross(left, middle, right) {
  return (middle.x - left.x) * (right.y - left.y) - (middle.y - left.y) * (right.x - left.x);
}

function isPointOnSegment(point, left, right) {
  return Math.abs(geometryCross(left, right, point)) < 1e-7 &&
    point.x >= Math.min(left.x, right.x) - 1e-7 && point.x <= Math.max(left.x, right.x) + 1e-7 &&
    point.y >= Math.min(left.y, right.y) - 1e-7 && point.y <= Math.max(left.y, right.y) + 1e-7;
}

function doSegmentsIntersect(first, second) {
  const values = [
    geometryCross(first.left, first.right, second.left),
    geometryCross(first.left, first.right, second.right),
    geometryCross(second.left, second.right, first.left),
    geometryCross(second.left, second.right, first.right),
  ];
  return (values[0] * values[1] < 0 && values[2] * values[3] < 0) ||
    isPointOnSegment(second.left, first.left, first.right) || isPointOnSegment(second.right, first.left, first.right) ||
    isPointOnSegment(first.left, second.left, second.right) || isPointOnSegment(first.right, second.left, second.right);
}

function exactPointToSegment(point, left, right) {
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - left.x, point.y - left.y);
  const ratio = Math.max(0, Math.min(1, ((point.x - left.x) * dx + (point.y - left.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - left.x - ratio * dx, point.y - left.y - ratio * dy);
}

function exactSegmentDistance(first, second) {
  return doSegmentsIntersect(first, second) ? 0 : Math.min(
    exactPointToSegment(first.left, second.left, second.right),
    exactPointToSegment(first.right, second.left, second.right),
    exactPointToSegment(second.left, first.left, first.right),
    exactPointToSegment(second.right, first.left, first.right),
  );
}

function segmentIntersectionParameters(segment, boundary) {
  const parameters = [];
  const route = {x: segment.right.x - segment.left.x, y: segment.right.y - segment.left.y};
  const routeLengthSquared = route.x ** 2 + route.y ** 2;
  const parameter = (point) => ((point.x - segment.left.x) * route.x +
    (point.y - segment.left.y) * route.y) / routeLengthSquared;
  for (const side of geometrySegments(boundary.points, true)) {
    const edge = {x: side.right.x - side.left.x, y: side.right.y - side.left.y};
    const offset = {x: side.left.x - segment.left.x, y: side.left.y - segment.left.y};
    const denominator = route.x * edge.y - route.y * edge.x;
    if (Math.abs(denominator) < 1e-9) {
      if (Math.abs(offset.x * route.y - offset.y * route.x) < 1e-9) {
        parameters.push(parameter(side.left), parameter(side.right));
      }
      continue;
    }
    const alongRoute = (offset.x * edge.y - offset.y * edge.x) / denominator;
    const alongEdge = (offset.x * route.y - offset.y * route.x) / denominator;
    if (alongRoute >= 0 && alongRoute <= 1 && alongEdge >= 0 && alongEdge <= 1) parameters.push(alongRoute);
  }
  return parameters.filter((value) => Number.isFinite(value) && value >= 0 && value <= 1);
}

function isPointInPolygon(point, polygon) {
  if (geometrySegments(polygon, true).some(({left, right}) => isPointOnSegment(point, left, right))) return true;
  let inside = false;
  for (let left = polygon.length - 1, right = 0; right < polygon.length; left = right++) {
    if ((polygon[right].y > point.y) !== (polygon[left].y > point.y) &&
      point.x < (polygon[left].x - polygon[right].x) * (point.y - polygon[right].y) /
        (polygon[left].y - polygon[right].y) + polygon[right].x) inside = !inside;
  }
  return inside;
}

function isPointStrictlyInPolygon(point, polygon) {
  return !geometrySegments(polygon, true).some(({left, right}) => isPointOnSegment(point, left, right)) &&
    isPointInPolygon(point, polygon);
}

function geometryIntersectsSegment(shape, segment) {
  return (shape.closed && (isPointInPolygon(segment.left, shape.points) || isPointInPolygon(segment.right, shape.points))) ||
    geometrySegments(shape.points, shape.closed).some((edge) => doSegmentsIntersect(edge, segment));
}

function boundsPoints(bounds) {
  return [
    {x: bounds.left, y: bounds.top}, {x: bounds.right, y: bounds.top},
    {x: bounds.right, y: bounds.bottom}, {x: bounds.left, y: bounds.bottom},
  ];
}

function boundsDistance(left, right) {
  return Math.hypot(
    Math.max(left.left - right.right, right.left - left.right, 0),
    Math.max(left.top - right.bottom, right.top - left.bottom, 0),
  );
}

function boundsToSegmentDistance(bounds, segment) {
  const rectangle = {closed: true, points: boundsPoints(bounds)};
  return geometryIntersectsSegment(rectangle, segment) ? 0 : Math.min(...geometrySegments(rectangle.points, true)
    .map((edge) => exactSegmentDistance(edge, segment)));
}

function boundsToShapeDistance(bounds, shape) {
  const rectangle = {closed: true, points: boundsPoints(bounds)};
  if (rectangle.points.some((point) => shape.closed && isPointInPolygon(point, shape.points)) ||
    shape.points.some((point) => isPointInPolygon(point, rectangle.points)) ||
    geometrySegments(rectangle.points, true).some((left) =>
      geometrySegments(shape.points, shape.closed).some((right) => doSegmentsIntersect(left, right)))) return 0;
  return Math.min(...geometrySegments(rectangle.points, true).flatMap((left) =>
    geometrySegments(shape.points, shape.closed).map((right) => exactSegmentDistance(left, right))));
}

function geometriesIntersect(left, right) {
  return left.points.some((point) => right.closed && isPointInPolygon(point, right.points)) ||
    right.points.some((point) => left.closed && isPointInPolygon(point, left.points)) ||
    geometrySegments(left.points, left.closed).some((first) =>
      geometrySegments(right.points, right.closed).some((second) => doSegmentsIntersect(first, second)));
}

function boundsContain(outer, inner) {
  return inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
}

function scaledBounds(bounds, scale) {
  return {
    bottom: bounds.bottom * scale, left: bounds.left * scale,
    right: bounds.right * scale, top: bounds.top * scale,
  };
}

function maximumTransformScale(matrix) {
  const squareScaleSum = matrix[0] ** 2 + matrix[1] ** 2 + matrix[2] ** 2 + matrix[3] ** 2;
  const squareDeterminant = (matrix[0] * matrix[3] - matrix[1] * matrix[2]) ** 2;
  return Math.sqrt(Math.max(0, (squareScaleSum +
    Math.sqrt(Math.max(0, squareScaleSum ** 2 - 4 * squareDeterminant))) / 2));
}

function strokeExpandedBoundsAtScale(model, element, bounds, renderScale) {
  const scaled = scaledBounds(bounds, renderScale);
  const stroke = effectivePaint(model, element, 'stroke');
  if (!stroke.color || stroke.opacity <= 0) return scaled;
  const radius = svgUserUnits(svgValue(model, element, 'stroke-width'), `${element.name} stroke-expanded bounds`) *
    maximumTransformScale(worldTransform(element, model)) * renderScale / 2;
  return {
    bottom: scaled.bottom + radius, left: scaled.left - radius,
    right: scaled.right + radius, top: scaled.top - radius,
  };
}

function paintedShapeIntersectsBoundsSurface(model, element, geometry, bounds, surfaceStrokeRadius = 0) {
  const fill = effectivePaint(model, element, 'fill');
  const stroke = effectivePaint(model, element, 'stroke');
  const filledGeometry = {...geometry, closed: true};
  const fillIntersects = fill.color && fill.opacity > 0 && geometry.points.length >= 3 &&
    polygonArea(geometry.points) > 1e-7 && boundsToShapeDistance(bounds, filledGeometry) <= surfaceStrokeRadius;
  if (fillIntersects) return true;
  if (!stroke.color || stroke.opacity <= 0 || geometrySegments(geometry.points, geometry.closed).length === 0) return false;
  const strokeRadius = svgUserUnits(svgValue(model, element, 'stroke-width'), `${element.name} painter stroke-width`) *
    maximumTransformScale(worldTransform(element, model)) / 2;
  return boundsToShapeDistance(bounds, geometry) <= surfaceStrokeRadius + strokeRadius;
}

function visualTextWidth(text, fontSize) {
  return [...text].length * fontSize;
}

function visibleTextRuns(model, textElement) {
  const tspans = descendants(textElement, 'tspan').filter((candidate) => {
    for (let current = candidate.parent; current && current !== textElement; current = current.parent) {
      if (current.name === 'tspan') return false;
    }
    return true;
  });
  const runElements = tspans.length > 0 ? tspans : [textElement];
  let cursorX = Number(textElement.attributes.get('x') ?? 0);
  let cursorY = Number(textElement.attributes.get('y') ?? 0);
  return runElements.map((element) => {
    const text = (element === textElement ? element.ownText.join('') : xmlText(element)).replace(/\s+/gu, ' ').trim();
    assert.ok(text, 'visible text run');
    const xValues = numericTokens(element.attributes.get('x'));
    const yValues = numericTokens(element.attributes.get('y'));
    const dxValues = numericTokens(element.attributes.get('dx'));
    const dyValues = numericTokens(element.attributes.get('dy'));
    const rotations = numericTokens(element.attributes.get('rotate'));
    assert.ok(xValues.length <= 1 && yValues.length <= 1 && dxValues.length <= 1 && dyValues.length <= 1,
      `${text} text run uses one faithful baseline position`);
    assert.ok(rotations.length === 0 || rotations.every((angle) => angle === 0),
      `${text} text run has no per-glyph rotation`);
    assert.equal(element.attributes.has('textLength') || element.attributes.has('lengthAdjust'), false,
      `${text} text run has no unmodeled glyph-length adjustment`);
    cursorX = (xValues[0] ?? cursorX) + (numericTokens(element.attributes.get('dx'))[0] ?? 0);
    cursorY = (yValues[0] ?? cursorY) + (numericTokens(element.attributes.get('dy'))[0] ?? 0);
    const fontSize = svgUserUnits(svgValue(model, element, 'font-size'), `${text} font-size`);
    const weight = svgValue(model, element, 'font-weight');
    const width = visualTextWidth(text, fontSize, weight);
    const anchor = svgValue(model, element, 'text-anchor');
    const left = cursorX - (anchor === 'middle' ? width / 2 : (anchor === 'end' ? width : 0));
    const matrix = worldTransform(element, model);
    const corners = [
      {x: left, y: cursorY - fontSize}, {x: left + width, y: cursorY - fontSize},
      {x: left + width, y: cursorY + fontSize * .3}, {x: left, y: cursorY + fontSize * .3},
    ].map((point) => transformedPoint(matrix, point));
    const squareScaleSum = matrix[0] ** 2 + matrix[1] ** 2 + matrix[2] ** 2 + matrix[3] ** 2;
    const squareDeterminant = (matrix[0] * matrix[3] - matrix[1] * matrix[2]) ** 2;
    const minimumScale = Math.sqrt(Math.max(0, (squareScaleSum -
      Math.sqrt(Math.max(0, squareScaleSum ** 2 - 4 * squareDeterminant))) / 2));
    const baseline = transformedPoint(matrix, {x: cursorX, y: cursorY});
    cursorX += width;
    return {baseline, bounds: geometryBounds(corners), element, fontSize, minimumScale, parentText: textElement, text, weight};
  });
}

function visibleTextLines(element) {
  const tspans = descendants(element, 'tspan');
  return (tspans.length > 0 ? tspans.map(xmlText) : [xmlText(element)])
    .map((item) => item.replace(/\s+/gu, ' ').trim()).filter(Boolean);
}

function visibleTextSemanticValue(element) {
  return xmlText(element).replace(/\s+/gu, ' ').trim();
}

function directNodeShape(group) {
  return descendants(group).find((element) => ['rect', 'polygon', 'circle', 'path'].includes(element.name) &&
    !['text', 'marker'].includes(element.parent?.name));
}

function owningNodeGroup(element) {
  for (let current = element.parent; current; current = current.parent) {
    if (current.name === 'g' && current.attributes.has('data-node-id')) return current;
  }
  return null;
}

function colorChannels(color) {
  return normalizedColor(color, {rules: []}, {attributes: new Map(), name: 'color'}).slice(1)
    .match(/.{2}/gu).map((item) => Number.parseInt(item, 16));
}

function blendColor(foreground, background, opacity) {
  const front = colorChannels(foreground);
  const back = colorChannels(background);
  return `#${front.map((value, index) => Math.round(value * opacity + back[index] * (1 - opacity))
    .toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function exactContrast(foreground, background) {
  const luminance = (color) => colorChannels(color).map((item) => item / 255)
    .map((item) => item <= .04045 ? item / 12.92 : ((item + .055) / 1.055) ** 2.4)
    .reduce((sum, item, index) => sum + item * [.2126, .7152, .0722][index], 0);
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + .05) / (values[1] + .05);
}

function inSvgDefinitions(element) {
  for (let current = element.parent; current; current = current.parent) {
    if (['defs', 'marker', 'clipPath', 'mask', 'symbol'].includes(current.name)) return true;
  }
  return false;
}

function actualLocalBackground(model, point, beforeIndex) {
  const layers = model.elements.filter((element) => element.index < beforeIndex && !inSvgDefinitions(element) &&
    ['rect', 'polygon', 'circle', 'path'].includes(element.name)).flatMap((element) => {
    const geometry = renderedGeometry(element, null, model);
    if (!geometry) return [];
    const fill = effectivePaint(model, element, 'fill');
    const stroke = effectivePaint(model, element, 'stroke');
    const strokeWidth = svgUserUnits(svgValue(model, element, 'stroke-width'), `${element.name} stroke-width`);
    const layersForElement = [];
    if (geometry.points.length >= 3 && fill.color && fill.opacity > 0 && isPointInPolygon(point, geometry.points)) {
      layersForElement.push({element, paint: fill});
    }
    if (stroke.color && stroke.opacity > 0 && geometrySegments(geometry.points, geometry.closed)
      .some(({left, right}) => exactPointToSegment(point, left, right) <= strokeWidth / 2)) {
      layersForElement.push({element, paint: stroke});
    }
    return layersForElement;
  }).sort((left, right) => left.element.index - right.element.index);
  assert.ok(layers.length > 0, 'painted local background');
  return layers.reduce((background, layer) => blendColor(layer.paint.color, background, layer.paint.opacity), '#FFFFFF');
}

function svgUserUnits(value, label) {
  const match = String(value ?? '').trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?)(px)?$/iu);
  assert.ok(match, `${label} uses unitless/px SVG user units`);
  return Number(match[1]);
}

function localBackgroundSamples(model, segment, beforeIndex) {
  const boundaries = model.elements.filter((element) => element.index < beforeIndex && !inSvgDefinitions(element) &&
    ['rect', 'polygon', 'circle', 'path'].includes(element.name)).map((element) => ({
      geometry: renderedGeometry(element, null, model),
      paint: effectivePaint(model, element, 'fill'),
      stroke: effectivePaint(model, element, 'stroke'),
      strokeWidth: svgUserUnits(svgValue(model, element, 'stroke-width'), `${element.name} stroke-width`),
    })).filter(({geometry, paint}) => geometry?.points.length >= 3 && paint.color && paint.opacity > 0);
  const paintedShapes = model.elements.filter((element) => element.index < beforeIndex && !inSvgDefinitions(element) &&
    !owningNodeGroup(element) && ['rect', 'polygon', 'circle', 'path'].includes(element.name)).map((element) => ({
      geometry: renderedGeometry(element, null, model),
      stroke: effectivePaint(model, element, 'stroke'),
      strokeWidth: svgUserUnits(svgValue(model, element, 'stroke-width'), `${element.name} stroke-width`),
    })).filter(({geometry}) => geometry);
  const routeVector = {x: segment.right.x - segment.left.x, y: segment.right.y - segment.left.y};
  const routeLengthSquared = routeVector.x ** 2 + routeVector.y ** 2;
  const projection = (point) => ((point.x - segment.left.x) * routeVector.x +
    (point.y - segment.left.y) * routeVector.y) / routeLengthSquared;
  const strokeBreakpoints = paintedShapes.flatMap(({geometry, stroke, strokeWidth}) => {
    if (!stroke.color || stroke.opacity <= 0 || strokeWidth <= 0) return [];
    return geometrySegments(geometry.points, geometry.closed).flatMap((strokeSegment) => {
      if (exactSegmentDistance(segment, strokeSegment) > strokeWidth / 2) return [];
      const padding = (strokeWidth / 2) / Math.sqrt(routeLengthSquared);
      return [projection(strokeSegment.left) - padding, projection(strokeSegment.right) + padding];
    });
  });
  const breakpoints = [0, 1, ...boundaries.flatMap(({geometry}) =>
    segmentIntersectionParameters(segment, geometry)), ...strokeBreakpoints]
    .map((value) => Math.max(0, Math.min(1, value)))
    .sort((left, right) => left - right)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > 1e-9);
  return breakpoints.slice(1).map((right, index) => (breakpoints[index] + right) / 2).map((ratio) => ({
    x: segment.left.x + (segment.right.x - segment.left.x) * ratio,
    y: segment.left.y + (segment.right.y - segment.left.y) * ratio,
  }));
}

function localBackgroundSamplesForBounds(model, bounds, beforeIndex) {
  const candidates = [
    ...boundsPoints(bounds),
    {x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2},
    {x: (bounds.left + bounds.right) / 2, y: bounds.top},
    {x: (bounds.left + bounds.right) / 2, y: bounds.bottom},
    {x: bounds.left, y: (bounds.top + bounds.bottom) / 2},
    {x: bounds.right, y: (bounds.top + bounds.bottom) / 2},
  ];
  const paintedIntersections = model.elements.filter((element) => element.index < beforeIndex && !inSvgDefinitions(element) &&
    ['rect', 'polygon', 'circle', 'path'].includes(element.name)).map((element) => renderedGeometry(element, null, model))
    .filter(Boolean).flatMap((geometry) => {
      const clippedLeft = Math.max(bounds.left, geometry.bounds.left);
      const clippedRight = Math.min(bounds.right, geometry.bounds.right);
      const clippedTop = Math.max(bounds.top, geometry.bounds.top);
      const clippedBottom = Math.min(bounds.bottom, geometry.bounds.bottom);
      if (clippedLeft > clippedRight || clippedTop > clippedBottom) return [];
      return [{x: (clippedLeft + clippedRight) / 2, y: (clippedTop + clippedBottom) / 2}];
    });
  return [...candidates, ...paintedIntersections];
}

function actualDrawioBounds(cell) {
  assert.ok(cell.geometry, `${cell.attributes.get('id')} mxGeometry`);
  const values = Object.fromEntries(['x', 'y', 'width', 'height']
    .map((key) => [key, Number(cell.geometry.attributes.get(key))]));
  assert.ok(Object.values(values).every(Number.isFinite), `${cell.attributes.get('id')} finite geometry`);
  return {bottom: values.y + values.height, left: values.x, right: values.x + values.width, top: values.y};
}

function actualDrawioWaypoints(cell) {
  const arrays = cell.geometry.children.filter(({name}) => name === 'Array');
  assert.ok(arrays.every(({attributes}) => attributes.get('as') === 'points'),
    `${cell.attributes.get('id')} only Array as=points`);
  assert.equal(arrays.length, 1, `${cell.attributes.get('id')} exactly one Array as=points`);
  const waypoints = arrays[0].children.filter(({name}) => name === 'mxPoint').map((point) => ({
    x: Number(point.attributes.get('x')),
    y: Number(point.attributes.get('y')),
  }));
  assert.ok(waypoints.length > 0 && waypoints.every(({x, y}) => Number.isFinite(x) && Number.isFinite(y)),
    `${cell.attributes.get('id')} actual waypoints`);
  return waypoints;
}

function actualTerminalPoint(cell, cells, side) {
  const style = parsedDrawioStyle(cell);
  const source = side === 'source';
  assert.equal(style.get(source ? 'exitPerimeter' : 'entryPerimeter'), '1',
    `${cell.attributes.get('id')} ${side}Perimeter=1`);
  const x = Number(style.get(source ? 'exitX' : 'entryX'));
  const y = Number(style.get(source ? 'exitY' : 'entryY'));
  assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `${cell.attributes.get('id')} ${side} terminal port`);
  const node = cells.get(cell.attributes.get(side));
  assert.ok(node, `${cell.attributes.get('id')} ${side} node`);
  const bounds = actualDrawioBounds(node);
  assert.ok(x === 0 || x === 1 || y === 0 || y === 1,
    `${cell.attributes.get('id')} ${side} terminal lies on node perimeter`);
  return {
    x: bounds.left + (bounds.right - bounds.left) * x,
    y: bounds.top + (bounds.bottom - bounds.top) * y,
  };
}

function normalizedDash(value) {
  const result = String(value ?? 'none').trim().replace(/,/gu, ' ').replace(/\s+/gu, ' ');
  return result === '' ? 'none' : result;
}

function firstFontFamily(value) {
  return String(value ?? '').split(',')[0].trim().replace(/^['"]|['"]$/gu, '');
}

function assertActualFontParity(model, element, style, label) {
  assert.equal(normalizedColor(svgValue(model, element, 'fill'), model, element),
    normalizedColor(style.get('fontColor'), model, element), `${label} font color`);
  assert.equal(svgUserUnits(svgValue(model, element, 'font-size'), `${label} font-size`),
    Number(style.get('fontSize')), `${label} font size`);
  assert.equal(firstFontFamily(svgValue(model, element, 'font-family')),
    firstFontFamily(style.get('fontFamily')), `${label} font family`);
  assert.equal(/^(?:bold|[6-9]00)$/iu.test(svgValue(model, element, 'font-weight')),
    (Number(style.get('fontStyle') ?? 0) & 1) === 1, `${label} font weight`);
  assert.equal(/^(?:italic|oblique)$/iu.test(svgValue(model, element, 'font-style')),
    (Number(style.get('fontStyle') ?? 0) & 2) === 2, `${label} font italic`);
  assert.equal(/underline/iu.test(svgValue(model, element, 'text-decoration')),
    (Number(style.get('fontStyle') ?? 0) & 4) === 4, `${label} font underline`);
  if (style.has('align')) {
    assert.equal(svgValue(model, element, 'text-anchor'),
      new Map([['left', 'start'], ['center', 'middle'], ['right', 'end']]).get(style.get('align')),
      `${label} horizontal alignment`);
  }
}

function actualMarkerFootprint(model, edge, route, renderScale, drawioStyle) {
  const markerEnd = svgValue(model, edge, 'marker-end');
  const markerId = markerEnd?.match(/^url\(\s*#([\w.-]+)\s*\)$/u)?.[1];
  assert.ok(markerId, `${edge.attributes.get('data-edge-id')} exact marker-end URL`);
  const fragments = model.elements.filter(({attributes}) => attributes.get('id') === markerId);
  assert.equal(fragments.length, 1, `${markerId} is globally unique fragment ID`);
  const markers = fragments.filter(({name}) => name === 'marker');
  assert.equal(markers.length, 1, `${markerId} resolves once`);
  const marker = markers[0];
  const markerGroups = descendants(marker).filter(({name}) => name === 'g');
  assert.equal(markerGroups.length, 1, `${markerId} marker has exactly one canonical g`);
  assert.equal(markerGroups[0].attributes.get('transform'), 'translate(0 0)',
    `${markerId} marker g transform is exactly identity translate(0 0)`);
  assert.deepEqual(elementTransform(model, markerGroups[0]), IDENTITY_MATRIX,
    `${markerId} marker g effective transform is identity`);
  const markerDrawables = descendants(marker).filter((element) => ['rect', 'path', 'polygon', 'circle'].includes(element.name));
  assert.equal(markerDrawables.length, 1, `${markerId} canonical block marker has one drawable`);
  assert.equal(markerDrawables[0].name, 'path', `${markerId} canonical block marker uses a path`);
  assert.equal(markerDrawables[0].attributes.has('transform'), false,
    `${markerId} marker path transform is absent identity`);
  assert.deepEqual(elementTransform(model, markerDrawables[0]), IDENTITY_MATRIX,
    `${markerId} marker path effective transform is identity`);
  assert.ok(drawioStyle.has('endSize'), `${edge.attributes.get('data-edge-id')} Draw.io explicitly sets endSize`);
  const endSize = Number(drawioStyle.get('endSize'));
  const strokeWidth = Number(drawioStyle.get('strokeWidth'));
  assert.ok(Number.isFinite(endSize) && endSize > 0, `${edge.attributes.get('data-edge-id')} finite positive Draw.io endSize`);
  assert.ok(Number.isFinite(strokeWidth) && strokeWidth > 0,
    `${edge.attributes.get('data-edge-id')} finite positive Draw.io strokeWidth`);

  // mxMarker.createArrow(2), used by the Draw.io "block" marker, expands size by the
  // connector stroke, pulls the raw tip back by 1.118 strokes, then fillAndStroke paints
  // a miter-joined triangle. These are the resulting 1:1 SVG user-space dimensions.
  const rawLength = endSize + strokeWidth;
  const strokeRadius = strokeWidth / 2;
  const endpointOffset = strokeWidth * 1.118;
  const tipMiter = strokeWidth * Math.sqrt(5) / 2;
  const baseMiter = strokeWidth * (Math.sqrt(5) + 1) / 4;
  const expectedFootprint = rawLength + strokeRadius + tipMiter;
  const expectedRefX = strokeRadius + rawLength + endpointOffset;
  const expectedCenter = expectedFootprint / 2;
  const expectedRawPoints = [
    {x: strokeRadius + rawLength, y: expectedCenter},
    {x: strokeRadius, y: baseMiter},
    {x: strokeRadius, y: baseMiter + rawLength},
  ];
  const canonicalArrow = parsedPath(markerDrawables[0].attributes.get('d'), `${markerId} canonical block marker`);
  assert.equal(canonicalArrow.closed, true, `${markerId} canonical block marker is closed`);
  assert.equal(canonicalArrow.points.length, 3, `${markerId} canonical block marker topology`);
  canonicalArrow.points.forEach((point, index) => {
    assertClose(point.x, expectedRawPoints[index].x,
      `${markerId} canonical block marker point ${index} x from Draw.io endSize`);
    assertClose(point.y, expectedRawPoints[index].y,
      `${markerId} canonical block marker point ${index} y from Draw.io endSize`);
  });
  const viewBox = numericTokens(marker.attributes.get('viewBox'));
  assert.equal(viewBox.length, 4, `${markerId} viewBox`);
  const width = Number(marker.attributes.get('markerWidth'));
  const height = Number(marker.attributes.get('markerHeight'));
  const refX = Number(marker.attributes.get('refX'));
  const refY = Number(marker.attributes.get('refY'));
  assert.ok([width, height, refX, refY].every(Number.isFinite) && width > 0 && height > 0,
    `${markerId} dimensions/ref`);
  assert.equal(marker.attributes.get('markerUnits'), 'userSpaceOnUse', `${markerId} markerUnits is 1:1 user space`);
  assert.equal(marker.attributes.get('preserveAspectRatio'), 'none', `${markerId} marker viewport has no implicit scaling`);
  assertClose(viewBox[0], 0, `${markerId} viewBox x`);
  assertClose(viewBox[1], 0, `${markerId} viewBox y`);
  assertClose(viewBox[2], expectedFootprint, `${markerId} viewBox painted width from Draw.io endSize`);
  assertClose(viewBox[3], expectedFootprint, `${markerId} viewBox painted height from Draw.io endSize`);
  assertClose(width, expectedFootprint, `${markerId} markerWidth painted footprint from Draw.io endSize`);
  assertClose(height, expectedFootprint, `${markerId} markerHeight painted footprint from Draw.io endSize`);
  assertClose(refX, expectedRefX, `${markerId} endpoint offset from Draw.io block marker`);
  assertClose(refY, expectedCenter, `${markerId} reference center from Draw.io block marker`);
  assertClose(refX - canonicalArrow.points[0].x, endpointOffset,
    `${markerId} raw-tip endpoint offset from Draw.io stroke`);
  const viewportWidth = width;
  const viewportHeight = height;
  const scaleX = viewportWidth / viewBox[2];
  const scaleY = viewportHeight / viewBox[3];
  const mapViewBox = (point) => ({
    x: (point.x - viewBox[0]) * scaleX,
    y: (point.y - viewBox[1]) * scaleY,
  });
  const reference = mapViewBox({x: refX, y: refY});
  const endpoint = route.at(-1);
  const previous = route.at(-2);
  const baseAngle = Math.atan2(endpoint.y - previous.y, endpoint.x - previous.x);
  const orient = marker.attributes.get('orient') ?? '0';
  const angle = /^(?:auto|auto-start-reverse)$/u.test(orient)
    ? baseAngle
    : Number(orient) * Math.PI / 180;
  assert.ok(Number.isFinite(angle), `${markerId} finite orient`);
  const markerPath = markerDrawables[0];
  const fill = effectivePaint(model, markerPath, 'fill');
  const stroke = effectivePaint(model, markerPath, 'stroke');
  const edgeOpacity = ancestorOpacity(model, edge);
  fill.opacity *= edgeOpacity;
  stroke.opacity *= edgeOpacity;
  const edgeStroke = effectivePaint(model, edge, 'stroke');
  assert.ok(fill.color && fill.opacity >= .8, `${markerId} block fill is visibly opaque`);
  assert.ok(stroke.color && stroke.opacity >= .8, `${markerId} block stroke is visibly opaque`);
  assert.equal(fill.color, edgeStroke.color, `${markerId} block fill matches connector stroke`);
  assert.equal(stroke.color, edgeStroke.color, `${markerId} block outline matches connector stroke`);
  assertClose(svgUserUnits(svgValue(model, markerPath, 'stroke-width'), `${markerId} marker stroke-width`),
    strokeWidth, `${markerId} stroke-expanded marker footprint uses Draw.io strokeWidth`);
  assert.equal(svgValue(model, markerPath, 'stroke-linejoin'), 'miter', `${markerId} block marker uses miter joins`);

  const paintedOuterPoints = [
    {x: expectedFootprint, y: expectedCenter},
    {x: 0, y: 0},
    {x: 0, y: expectedFootprint},
  ];
  const shapePoints = paintedOuterPoints.map(mapViewBox).map((point) => {
      const x = point.x - reference.x;
      const y = point.y - reference.y;
      return {
        x: endpoint.x + Math.cos(angle) * x - Math.sin(angle) * y,
        y: endpoint.y + Math.sin(angle) * x + Math.cos(angle) * y,
      };
  });
  const markerShape = {
    bounds: geometryBounds(shapePoints), closed: true, element: markerPath, fill, fillPainted: true,
    points: shapePoints, stroke, strokePainted: true, strokeWidth,
  };
  const tangent = {x: Math.cos(baseAngle), y: Math.sin(baseAngle)};
  const normal = {x: -tangent.y, y: tangent.x};
  const relative = shapePoints.map((point) => ({x: point.x - endpoint.x, y: point.y - endpoint.y}));
  const axialValues = relative.map((point) => point.x * tangent.x + point.y * tangent.y);
  const transverseValues = relative.map((point) => point.x * normal.x + point.y * normal.y);
  const paintedAxialCss = (Math.max(...axialValues) - Math.min(...axialValues)) * renderScale;
  const paintedTransverseCss = (Math.max(...transverseValues) - Math.min(...transverseValues)) * renderScale;
  assertClose(paintedAxialCss, expectedFootprint * renderScale,
    `${markerId} painted axial footprint parity at 800px`);
  assertClose(paintedTransverseCss, expectedFootprint * renderScale,
    `${markerId} painted transverse footprint parity at 800px`);
  assert.ok(paintedAxialCss >= 16 && paintedTransverseCss >= 16,
    `${markerId} painted footprint >=16px at 800px`);
  return {
    endpoint, footprint: markerShape.bounds, marker, markerId, shapes: [markerShape],
    terminalOvershoot: tipMiter - endpointOffset,
  };
}

function assertDiagram(drawio, svg) {
  const {cells: drawCells} = parsedDrawio(drawio);
  const model = parsedSvg(svg);
  const viewBox = numericTokens(model.root.attributes.get('viewBox'));
  assert.deepEqual(viewBox, [0, 0, 2000, 2580], 'SVG exact 2000x2580 viewBox');
  const titles = model.elements.filter(({name}) => name === 'title');
  const descriptions = model.elements.filter(({name}) => name === 'desc');
  assert.equal(titles.length, 1, 'SVG exactly one accessible title');
  assert.equal(descriptions.length, 1, 'SVG exactly one accessible description');
  assert.ok(xmlText(titles[0]).trim(), 'SVG accessible title is nonempty');
  assert.ok(xmlText(descriptions[0]).trim(), 'SVG accessible description is nonempty');
  assert.deepEqual((model.root.attributes.get('aria-labelledby') ?? '').trim().split(/\s+/u),
    [titles[0].attributes.get('id'), descriptions[0].attributes.get('id')],
    'SVG aria-labelledby binds title and description');
  const viewBoxBounds = {
    bottom: viewBox[1] + viewBox[3], left: viewBox[0],
    right: viewBox[0] + viewBox[2], top: viewBox[1],
  };
  const renderScale = 800 / viewBox[2];
  assert.ok(Number.isFinite(renderScale) && renderScale > 0, '800px render scale');
  const vertices = new Map(drawCells.filter(({attributes}) => attributes.get('vertex') === '1')
    .map((cell) => [cell.attributes.get('id'), cell]));
  const drawEdges = new Map(drawCells.filter(({attributes}) => attributes.get('edge') === '1')
    .map((cell) => [cell.attributes.get('id'), cell]));
  const nodeGroups = new Map(model.elements.filter(({attributes, name}) => name === 'g' &&
    attributes.has('data-node-id')).map((group) => [group.attributes.get('data-node-id'), group]));
  const edgeElements = new Map(model.elements.filter(({attributes, name}) => name === 'path' &&
    attributes.has('data-edge-id')).map((edge) => [edge.attributes.get('data-edge-id'), edge]));
  assert.equal(vertices.size, drawCells.filter(({attributes}) => attributes.get('vertex') === '1').length,
    'unique Draw.io vertex IDs');
  assert.equal(drawEdges.size, drawCells.filter(({attributes}) => attributes.get('edge') === '1').length,
    'unique Draw.io edge IDs');
  assert.equal(nodeGroups.size, model.elements.filter(({attributes, name}) => name === 'g' &&
    attributes.has('data-node-id')).length, 'unique SVG data-node-id groups');
  assert.equal(edgeElements.size, model.elements.filter(({attributes, name}) => name === 'path' &&
    attributes.has('data-edge-id')).length, 'unique SVG data-edge-id paths');
  assert.deepEqual([...drawEdges.keys()].sort(), [...FEEDBACK_IDS].sort(), 'exact three Draw.io feedback edges');
  assert.deepEqual([...edgeElements.keys()].sort(), [...FEEDBACK_IDS].sort(), 'exact three SVG feedback edges');

  const nodeIds = [...STAGE_IDS, ...GATE_IDS, ...RESPONSIBILITY_IDS, LEGEND_ID, 'stop-authority'];
  const canvas = model.elements.find(({attributes, name}) => name === 'rect' &&
    attributes.get('data-canvas') === 'true');
  assert.ok(canvas, 'actual canvas element');
  assert.deepEqual(renderedGeometry(canvas, null, model).bounds, viewBoxBounds, 'canvas covers viewBox');
  const canvasPaint = effectivePaint(model, canvas, 'fill');
  assert.ok(canvasPaint.color && canvasPaint.opacity === 1, 'canvas is effectively opaque');
  const viewBoxBoundsAt800 = scaledBounds(viewBoxBounds, renderScale);
  const simpleLabels = new Map([
    ...STAGE_IDS.map((id, index) => [id, [STAGES[index]]]),
    ...RESPONSIBILITY_IDS.map((id, index) => [id,
      [['客户业务', '交付/FDE', '产品工程', '平台与运维', '安全与数据'][index]]]),
    ['stop-authority', ['停止/回退']],
    [LEGEND_ID, LEGEND_LINES],
  ]);
  const nodeShapes = new Map();
  for (const id of nodeIds) {
    const cell = vertices.get(id);
    const group = nodeGroups.get(id);
    assert.ok(cell, `Draw.io ${id}`);
    assert.ok(group, `SVG ${id}`);
    const nodeDrawables = descendants(group).filter((element) => ['rect', 'path', 'polygon', 'circle'].includes(element.name));
    assert.equal(nodeDrawables.length, 1, `${id} exactly one canonical node drawable`);
    const shape = directNodeShape(group);
    assert.ok(shape, `${id} actual SVG shape`);
    assert.equal(shape.name, 'rect', `${id} canonical rect node`);
    const geometry = renderedGeometry(shape, null, model);
    nodeShapes.set(id, {...geometry, group, shape});
    assert.deepEqual(geometry.bounds, actualDrawioBounds(cell), `${id} Draw.io/SVG transformed bounds parity`);
    assert.deepEqual(geometry.points, boundsPoints(actualDrawioBounds(cell)), `${id} Draw.io/SVG exact rect points parity`);
    const labels = descendants(group, 'text');
    assert.equal(labels.length, 1, `${id} exactly one SVG label`);
    const expectedLines = GATE_IDS.includes(id) ? GATE_VISUALS[GATE_IDS.indexOf(id)] : simpleLabels.get(id);
    assert.deepEqual(visibleTextLines(labels[0]), expectedLines, `${id} visible name/risk/evidence/pass`);
    assert.deepEqual((cell.attributes.get('value') ?? '').split(/\r?\n/u), expectedLines,
      `${id} Draw.io visible label parity`);
    assert.ok(canvas.index < shape.index && labels.every((label) => canvas.index < label.index),
      'opaque canvas paint precedes every essential node drawable and text');
    assert.equal(xmlText(group).includes(id), false, `${id} machine ID is not visible`);
    const style = parsedDrawioStyle(cell);
    assertDrawioRectangleStyle(cell, style, id);
    const fill = effectivePaint(model, shape, 'fill');
    const stroke = effectivePaint(model, shape, 'stroke');
    assert.equal(fill.opacity, 1, `${id} node fill is effectively opaque`);
    assert.equal(stroke.opacity, 1, `${id} node stroke is effectively opaque`);
    assert.equal(fill.color, normalizedColor(style.get('fillColor'), model, shape), `${id} fill parity`);
    assert.equal(stroke.color, normalizedColor(style.get('strokeColor'), model, shape), `${id} stroke parity`);
    assert.equal(Number.parseFloat(svgValue(model, shape, 'stroke-width')), Number(style.get('strokeWidth')),
      `${id} stroke width parity`);
    assertActualFontParity(model, labels[0], style, id);
    const nodeRuns = visibleTextRuns(model, labels[0]);
    for (const run of nodeRuns) {
      assertActualFontParity(model, run.element, style, `${id} tspan`);
      const strokeRadius = Number.parseFloat(svgValue(model, shape, 'stroke-width')) / 2;
      const leftPadding = (run.bounds.left - geometry.bounds.left - strokeRadius) * renderScale;
      const rightPadding = (geometry.bounds.right - strokeRadius - run.bounds.right) * renderScale;
      assert.ok(leftPadding >= 16, `${id} left horizontal padding >=16px (${run.text})`);
      assert.ok(rightPadding >= 16, `${id} right horizontal padding >=16px (${run.text})`);
    }
    const strokeRadius = Number.parseFloat(svgValue(model, shape, 'stroke-width')) / 2;
    const topPadding = (Math.min(...nodeRuns.map(({bounds}) => bounds.top)) -
      geometry.bounds.top - strokeRadius) * renderScale;
    const bottomPadding = (geometry.bounds.bottom - strokeRadius -
      nodeRuns.at(-1).bounds.bottom) * renderScale;
    assert.ok(topPadding >= 14, `${id} top vertical padding >=14px`);
    assert.ok(bottomPadding >= 14, `${id} final-line bottom clearance >=14px`);
    for (let runIndex = 1; runIndex < nodeRuns.length; runIndex += 1) {
      const baselineGap = (nodeRuns[runIndex].baseline.y - nodeRuns[runIndex - 1].baseline.y) * renderScale;
      assert.ok(baselineGap >= 22, `${id} ordered baseline gap ${runIndex} >=22px`);
    }
  }
  for (let index = 0; index < GATE_IDS.length; index += 1) {
    assert.ok(boundsContain(nodeShapes.get(STAGE_IDS[Math.floor(index / 3)]).bounds,
      nodeShapes.get(GATE_IDS[index]).bounds), `${GATE_IDS[index]} contained in its stage`);
  }
  const ownerBand = RESPONSIBILITY_IDS.map((id) => nodeShapes.get(id));
  assert.deepEqual(ownerBand.map(({bounds}) => bounds.left), [...ownerBand.map(({bounds}) => bounds.left)].sort((a, b) => a - b),
    'owner band order');
  assert.ok(ownerBand.every(({bounds}) => bounds.top === ownerBand[0].bounds.top && bounds.bottom === ownerBand[0].bounds.bottom),
    'owner band aligned');
  for (let index = 1; index < ownerBand.length; index += 1) {
    assert.ok(ownerBand[index - 1].bounds.right < ownerBand[index].bounds.left, 'owner band nonoverlap');
    assert.equal(ownerBand[index].bounds.left - ownerBand[index - 1].bounds.right, 90, 'owner band exact spacing');
  }
  const stageBandBottom = Math.max(...STAGE_IDS.map((id) => nodeShapes.get(id).bounds.bottom));
  assert.ok(ownerBand.every(({bounds}) => bounds.top > stageBandBottom), 'owner band below stage bands');
  assert.ok(ownerBand.every(({bounds}) => boundsContain(viewBoxBounds, bounds)),
    'owner band contained in canvas/viewBox');
  for (const [id, node] of nodeShapes) {
    assert.ok(boundsContain(viewBoxBoundsAt800,
      strokeExpandedBoundsAtScale(model, node.shape, node.bounds, renderScale)),
    `${id} stroke-expanded node contained in canvas/viewBox at 800px`);
  }

  const feedbackLabels = new Map();
  for (const id of FEEDBACK_IDS) {
    const labels = model.elements.filter(({attributes, name}) => name === 'text' &&
      attributes.get('data-edge-label') === id);
    assert.equal(labels.length, 1, `${id} exactly one feedback label`);
    assert.deepEqual(visibleTextLines(labels[0]), [FEEDBACK_LABELS.get(id)], `${id} human feedback label`);
    const semanticOccurrences = model.elements.filter(({name}) => name === 'text')
      .map(visibleTextSemanticValue).filter((line) => line === FEEDBACK_LABELS.get(id));
    assert.equal(semanticOccurrences.length, 1, `${id} exactly one visible semantic label`);
    assert.equal(effectivePaint(model, labels[0], 'stroke').color, null,
      `${id} feedback label has no inherited connector stroke`);
    feedbackLabels.set(id, labels[0]);
  }
  assert.deepEqual(model.elements.filter(({attributes, name}) => name === 'text' &&
    attributes.has('data-edge-label')).map(({attributes}) => attributes.get('data-edge-label')).sort(),
  [...FEEDBACK_IDS].sort(), 'no missing/duplicate/unknown feedback labels');

  const edgeGeometry = new Map();
  const markerGeometry = new Map();
  for (const [id, [expectedSource, expectedTarget]] of FEEDBACK_TOPOLOGY) {
    const cell = drawEdges.get(id);
    const edge = edgeElements.get(id);
    assert.ok(cell, `Draw.io feedback ${id}`);
    assert.ok(edge, `SVG feedback ${id}`);
    assert.equal(cell.attributes.get('source'), expectedSource, `${id} exact source`);
    assert.equal(cell.attributes.get('target'), expectedTarget, `${id} exact target`);
    assert.equal(edge.attributes.get('data-source'), expectedSource, `${id} SVG source binding`);
    assert.equal(edge.attributes.get('data-target'), expectedTarget, `${id} SVG target binding`);
    assert.equal(edge.attributes.has('data-stroke') || edge.attributes.has('data-dash'), false,
      `${id} has no self-reported stroke/dash`);
    const expectedRoute = [
      actualTerminalPoint(cell, vertices, 'source'),
      ...actualDrawioWaypoints(cell),
      actualTerminalPoint(cell, vertices, 'target'),
    ];
    const routeGeometry = renderedGeometry(edge, null, model);
    assert.equal(routeGeometry.closed, false, `${id} open connector`);
    assert.deepEqual(routeGeometry.points, expectedRoute, `${id} full Draw.io/SVG route parity from Array as=points`);
    edgeGeometry.set(id, {...routeGeometry, cell, edge, route: routeGeometry.points});
    const style = parsedDrawioStyle(cell);
    const stroke = effectivePaint(model, edge, 'stroke');
    const fill = effectivePaint(model, edge, 'fill');
    assert.equal(fill.color, null, `${id} connector has no effective fill`);
    assert.ok(stroke.opacity >= .8, `${id} connector stroke is visibly opaque`);
    assert.equal(stroke.color, normalizedColor(style.get('strokeColor'), model, edge),
      `${id} actual strokeColor parity`);
    assert.equal(Number.parseFloat(svgValue(model, edge, 'stroke-width')), Number(style.get('strokeWidth')),
      `${id} stroke width parity`);
    const expectedDash = style.get('dashed') === '1' ? normalizedDash(style.get('dashPattern')) : 'none';
    assert.equal(normalizedDash(svgValue(model, edge, 'stroke-dasharray')), expectedDash,
      `${id} dashed/dashPattern parity`);
    assert.equal(style.get('endArrow'), 'block', `${id} Draw.io endArrow`);
    assert.equal(style.get('endFill'), '1', `${id} Draw.io endFill`);
    const marker = actualMarkerFootprint(model, edge, routeGeometry.points, renderScale, style);
    assert.ok(marker.shapes.some(({fill, fillPainted}) => fillPainted && fill.color === stroke.color && fill.opacity > 0),
      `${id} filled block marker matches stroke`);
    markerGeometry.set(id, marker);
    const label = feedbackLabels.get(id);
    assert.equal(cell.attributes.get('value'), FEEDBACK_LABELS.get(id), `${id} Draw.io feedback label`);
    assertActualFontParity(model, label, style, `${id} label`);
    for (const run of visibleTextRuns(model, label)) assertActualFontParity(model, run.element, style, `${id} label run`);
  }

  const routedSegments = [...edgeGeometry].flatMap(([id, geometry]) =>
    geometrySegments(geometry.route).map((segment) => ({...segment, id})));
  for (let left = 0; left < routedSegments.length; left += 1) {
    for (let right = left + 1; right < routedSegments.length; right += 1) {
      if (routedSegments[left].id !== routedSegments[right].id) {
        assert.equal(doSegmentsIntersect(routedSegments[left], routedSegments[right]), false,
          `no feedback route crossing/shared segment ${routedSegments[left].id}/${routedSegments[right].id}`);
      }
    }
  }

  for (const [id, geometry] of edgeGeometry) {
    const [expectedSource, expectedTarget] = FEEDBACK_TOPOLOGY.get(id);
    const stroke = effectivePaint(model, geometry.edge, 'stroke');
    for (const segment of geometrySegments(geometry.route)) {
      for (const [nodeId, node] of nodeShapes) {
        if (![...STAGE_IDS].includes(nodeId) && nodeId !== expectedSource && nodeId !== expectedTarget) {
          assert.equal(geometryIntersectsSegment(node, segment), false, `${id} route does not cross ${nodeId}`);
        }
      }
      for (const sample of localBackgroundSamples(model, segment, geometry.edge.index)) {
        const background = actualLocalBackground(model, sample, geometry.edge.index);
        assert.ok(exactContrast(blendColor(stroke.color, background, stroke.opacity), background) >= 4.5,
          `${id} effective local stroke contrast over every painted interval`);
      }
    }
  }

  const essentialTexts = model.elements.filter(({name}) => name === 'text').filter((element) =>
    !inSvgDefinitions(element));
  const runs = essentialTexts.flatMap((element) => visibleTextRuns(model, element));
  assert.ok(runs.length >= nodeIds.length + FEEDBACK_IDS.length, 'essential visible text runs');
  for (const run of runs) {
    assert.ok(boundsContain(viewBoxBounds, run.bounds), `${run.text} essential text contained in canvas/viewBox`);
    assert.ok(run.fontSize * run.minimumScale * renderScale >= 15,
      `${run.text} effective transformed text >=15px at 800px`);
    const fill = effectivePaint(model, run.element, 'fill');
    for (const sample of localBackgroundSamplesForBounds(model, run.bounds, run.element.index)) {
      const background = actualLocalBackground(model, sample, run.element.index);
      assert.ok(fill.color && exactContrast(blendColor(fill.color, background, fill.opacity), background) >= 4.5,
        `${run.text} effective local label contrast across text bounds`);
    }
    for (const [edgeId, geometry] of edgeGeometry) {
      for (const segment of geometrySegments(geometry.route)) {
        const gap = boundsToSegmentDistance(run.bounds, segment) -
          Number.parseFloat(svgValue(model, geometry.edge, 'stroke-width')) / 2;
        assert.ok(gap * renderScale >= 8, `${run.text} label-to-stroke ${edgeId} >=8px`);
      }
    }
    for (const [edgeId, marker] of markerGeometry) {
      for (const shape of marker.shapes) {
        assert.ok(boundsToShapeDistance(run.bounds, shape) * renderScale >= 16,
          `${run.text} marker-label ${edgeId} >=16px`);
      }
    }
    const owner = owningNodeGroup(run.parentText)?.attributes.get('data-node-id');
    const ownerStage = GATE_IDS.includes(owner) ? STAGE_IDS[Math.floor(GATE_IDS.indexOf(owner) / 3)] : null;
    for (const [nodeId, node] of nodeShapes) {
      if (boundsContain(node.bounds, run.bounds)) {
        assert.ok(nodeId === owner || nodeId === ownerStage || STAGE_IDS.includes(nodeId),
          `${run.text} cannot occupy unrelated node/boundary ${nodeId}`);
        const inner = Math.min(
          run.bounds.left - node.bounds.left, node.bounds.right - run.bounds.right,
          run.bounds.top - node.bounds.top, node.bounds.bottom - run.bounds.bottom,
        ) - Number.parseFloat(svgValue(model, node.shape, 'stroke-width')) / 2;
        assert.ok(inner * renderScale >= 12, `${run.text} inner node/boundary ${nodeId} >=12px`);
      } else {
        const gap = boundsDistance(run.bounds, node.bounds) -
          Number.parseFloat(svgValue(model, node.shape, 'stroke-width')) / 2;
        assert.ok(gap * renderScale >= 12,
          `${run.text} node/boundary ${nodeId} >=12px${owner ? ` (${owner})` : ''}`);
      }
    }
  }

  for (const [edgeId, marker] of markerGeometry) {
    for (const shape of marker.shapes) {
      for (const [nodeId, node] of nodeShapes) {
        if (STAGE_IDS.includes(nodeId)) continue;
        if (nodeId === FEEDBACK_TOPOLOGY.get(edgeId)[1]) {
          const insideMarkerPoints = shape.points.filter((point) => isPointStrictlyInPolygon(point, node.points));
          assert.ok(insideMarkerPoints.every((point) =>
            Math.hypot(point.x - marker.endpoint.x, point.y - marker.endpoint.y) <= marker.terminalOvershoot + 1e-9) &&
            !node.points.some((point) => isPointStrictlyInPolygon(point, shape.points)),
          `${edgeId} marker does not paint inside target node beyond mxGraph's 1.118-stroke tip tolerance`);
          continue;
        }
        assert.ok(boundsToShapeDistance(node.bounds, shape) * renderScale >= 16,
          `${edgeId} marker-node ${nodeId} >=16px`);
      }
    }
  }

  const paintable = model.elements.filter((element) => ['rect', 'polygon', 'path', 'circle'].includes(element.name) &&
    !inSvgDefinitions(element));
  const essentialShapeIds = new Map([...nodeShapes].map(([id, {shape}]) => [shape, id]));
  const feedbackEdgeElements = new Set(edgeElements.values());
  const laterOccluderCandidates = paintable.filter((element) => !feedbackEdgeElements.has(element));
  const essentialTextSurfaces = runs.map((run) => ({
    bounds: run.bounds,
    label: run.text,
    paintIndex: run.element.index,
  }));
  const essentialNodeSurfaces = [...nodeShapes].map(([id, node]) => {
    const stroke = effectivePaint(model, node.shape, 'stroke');
    const strokeRadius = stroke.color && stroke.opacity > 0
      ? svgUserUnits(svgValue(model, node.shape, 'stroke-width'), `${id} painter stroke-width`) *
        maximumTransformScale(worldTransform(node.shape, model)) / 2
      : 0;
    return {bounds: node.bounds, id, paintIndex: node.shape.index, strokeRadius};
  });
  for (const surface of essentialTextSurfaces) {
    for (const candidate of laterOccluderCandidates.filter(({index}) => index > surface.paintIndex)) {
      const shape = renderedGeometry(candidate, null, model);
      assert.equal(paintedShapeIntersectsBoundsSurface(model, candidate, shape, surface.bounds), false,
        `${candidate.index} later painted ${candidate.name} cannot occlude essential text ${surface.label}`);
    }
  }
  for (const surface of essentialNodeSurfaces) {
    for (const candidate of laterOccluderCandidates.filter(({index}) => index > surface.paintIndex)) {
      const candidateNodeId = essentialShapeIds.get(candidate);
      const permittedNestedGate = candidateNodeId && GATE_IDS.includes(candidateNodeId) &&
        surface.id === STAGE_IDS[Math.floor(GATE_IDS.indexOf(candidateNodeId) / 3)];
      if (permittedNestedGate) continue;
      const shape = renderedGeometry(candidate, null, model);
      assert.equal(paintedShapeIntersectsBoundsSurface(
        model, candidate, shape, surface.bounds, surface.strokeRadius), false,
      `${candidate.index} later painted ${candidate.name} cannot occlude essential node ${surface.id}`);
    }
  }
  for (const [edgeId, geometry] of edgeGeometry) {
    const edgeStroke = Number.parseFloat(svgValue(model, geometry.edge, 'stroke-width'));
    for (const candidate of paintable.filter((element) => element.index > geometry.edge.index &&
      element !== geometry.edge)) {
      const shape = renderedGeometry(candidate, null, model);
      const fill = effectivePaint(model, candidate, 'fill');
      const stroke = effectivePaint(model, candidate, 'stroke');
      if ((!fill.color || fill.opacity === 0) && (!stroke.color || stroke.opacity === 0)) continue;
      const occludesSegment = geometrySegments(geometry.route).some((segment) =>
        (fill.color && fill.opacity > 0 && geometryIntersectsSegment({...shape, closed: true}, segment)) ||
        (stroke.color && stroke.opacity > 0 && geometrySegments(shape.points, shape.closed).some((side) =>
          exactSegmentDistance(side, segment) <= (edgeStroke +
            Number.parseFloat(svgValue(model, candidate, 'stroke-width'))) / 2)));
      const occludesMarker = markerGeometry.get(edgeId).shapes.some((markerShape) =>
        (fill.color && fill.opacity > 0 && geometriesIntersect({...shape, closed: true}, markerShape)) ||
        (stroke.color && stroke.opacity > 0 && geometrySegments(shape.points, shape.closed).some((side) =>
          geometrySegments(markerShape.points, markerShape.closed).some((markerSide) =>
            exactSegmentDistance(side, markerSide) <=
              Number.parseFloat(svgValue(model, candidate, 'stroke-width')) / 2))));
      assert.equal(occludesSegment || occludesMarker, false,
        `${edgeId} later painted ${candidate.name} ${candidate.index} does not occlude segment/marker`);
    }
  }
}
function mutate(source, from, to, label) { const result = source.replace(from, to); assert.notEqual(result, source, `${label} mutation is non-no-op`); return result; }
function movedElementToEnd(source, elementMarkup, label) {
  const withoutElement = mutate(source, elementMarkup, '', `${label} remove original element`);
  return mutate(withoutElement, '</svg>', `${elementMarkup}</svg>`, `${label} append element`);
}
function assertIllustrationGovernance(value) {
  const illustration = value.sources.find(({id}) => id === ILLUSTRATION_SOURCE_ID);
  assert.ok(illustration, 'MTH-07 original illustration identity');
  assert.equal(illustration.canonical_locator, ILLUSTRATION_LOCATOR,
    'MTH-07 original illustration exact canonical_locator');
  assert.equal(illustration.source_kind, 'original-illustration', 'MTH-07 original illustration source_kind');
  assert.deepEqual(illustration.allowed_evidence_roles, ['illustration'],
    'MTH-07 original illustration exact allowed_evidence_roles');
  assert.equal(illustration.license, 'LicenseRef-Atlas-Original', 'MTH-07 original illustration license');
  assert.equal(illustration.copyright_policy, 'original-atlas', 'MTH-07 original illustration copyright policy');
  const document = value.documents[ARTICLE];
  assert.ok(document, 'MTH-07 exact governed document citation record');
  assert.deepEqual(Object.keys(document).sort(), DOCUMENT_SCHEMA_FIELDS,
    'MTH-07 governed document exact valid schema fields');
  onOrAfter(document.reviewed_at, SOURCE_CUTOFF,
    'MTH-07 governed document reviewed_at is a schema-valid date after source cutoff');
  onOrAfter(document.reviewed_at, illustration.published_at,
    'MTH-07 document review is not earlier than the actual illustration creation date');
  assert.deepEqual(document.copyright_checks,
    ['original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights'],
    'MTH-07 governed document exact copyright checks');
  const citations = document.citations.filter(({source_id: sourceId}) => sourceId === ILLUSTRATION_SOURCE_ID);
  assert.equal(citations.length, 1, 'MTH-07 exactly one original illustration citation');
  const citation = citations[0];
  assert.deepEqual(Object.keys(citation).sort(), CITATION_SCHEMA_FIELDS,
    'MTH-07 illustration citation exact valid schema fields');
  assert.equal(citation.citation_url, ILLUSTRATION_LOCATOR, 'MTH-07 illustration exact citation_url');
  assert.deepEqual(citation.roles, ['illustration'], 'MTH-07 illustration exact citation evidence role');
  assert.equal(citation.manifest_primary, false, 'MTH-07 illustration is not manifest primary');
  assert.equal(citation.usage_mode, 'original-illustration', 'MTH-07 illustration exact usage_mode');
  assert.ok(citation.attribution_note?.trim(), 'MTH-07 illustration attribution_note');
  assert.ok(citation.modification_note?.trim(), 'MTH-07 illustration creation modification_note');
  assert.equal(citation.excerpt, null, 'MTH-07 illustration excerpt');
  assert.equal(citation.quotation_reviewed, false, 'MTH-07 illustration quotation_reviewed');
}
function assertSourceContracts(sources, citations) {
  assert.deepEqual(sources.map(({id}) => id), SOURCE_IDS, 'MTH-07 exact ordered source IDs');
  for (const [id, expected] of SOURCE_CONTRACTS) {
    const item = sources.find((source) => source.id === id);
    assert.ok(item, id);
    assert.deepEqual(Object.keys(item).sort(), SOURCE_SCHEMA_FIELDS, `${id} exact source schema fields`);
    assert.deepEqual(sourceWithoutDynamicProvenance(item), sourceWithoutDynamicProvenance(expected), `${id} complete exact source record apart from Task 3/4 provenance dates`);
    onOrAfter(item.registered_at, SOURCE_CUTOFF, `${id} registered_at is after source cutoff`);
    onOrAfter(item.checked_at, item.registered_at, `${id} checked_at is after registration`);
    onOrAfter(item.expected_final_approved_at, item.checked_at, `${id} final approval is after check`);
    if (item.source_kind === 'original-illustration') {
      onOrAfter(item.published_at, SOURCE_CUTOFF, `${id} actual creation date is after source cutoff`);
      onOrAfter(item.registered_at, item.published_at, `${id} registration is after actual creation`);
    }
    const matches = citations.filter(({source_id: sourceId}) => sourceId === id);
    assert.equal(matches.length, 1, `${id} has exactly one citation`);
    assert.deepEqual(Object.keys(matches[0]).sort(), CITATION_SCHEMA_FIELDS, `${id} citation exact schema fields`);
    assert.deepEqual(matches[0], CITATION_CONTRACTS.get(id), `${id} complete exact citation`);
  }
  assert.equal(citations.filter(({source_id}) => source_id === ILLUSTRATION_SOURCE_ID).length, 1,
    'MTH-07 has exactly one original illustration citation');
  assert.deepEqual(citations.filter(({manifest_primary}) => manifest_primary).map(({source_id}) => source_id),
    ['src-nist-ai-rmf-1-0'], 'MTH-07 has NIST as its sole manifest primary citation');
  assert.deepEqual(parseSourceLedger({schema_version: 1, sources, documents: {}, superseded_transports: []}).errors, [],
    'MTH-07 complete source fixtures parse under the real ledger schema');
}
function fixtureGovernance() {
  return {
    sources: structuredClone([...SOURCE_CONTRACTS.values()]),
    documents: {[ARTICLE]: {
      reviewed_at: FIXTURE_TASK_DATE,
      copyright_checks: ['original-structure', 'quotation-boundary', 'attribution-complete', 'illustration-rights'],
      citations: structuredClone([...CITATION_CONTRACTS.values()]),
    }},
  };
}
function fixtureArticle() { const headingText = H2.map((heading) => heading === '可迁移经验' ? `## ${heading}\n${TRANSFER_H3.map((item) => `### ${item}`).join('\n')}` : `## ${heading}`).join('\n\n'); const metadata = Object.entries(EXACT_METADATA).map(([key, value]) => Array.isArray(value) ? `${key}:\n${value.map((item) => `  - ${item}`).join('\n')}` : `${key}: ${value}`).join('\n'); return `---\n${metadata}\n---\n\nimport {handleHorizontalArrowKey} from '@site/src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';\n\n${headingText}\n\n| ${TABLE_COLUMNS.join(' | ')} |\n| ${TABLE_COLUMNS.map(() => '---').join(' | ')} |\n${GATE_ROWS.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n来源事实。独立证据。${TEGO_ARCH_INTRO}\n\n**Tego Arch 推断：** NIST AI RMF 1.0 支持评估、监测与人工覆盖机制。POC 成功不等于生产可用。生产可用不等于验收通过。验收通过不等于放量。放量不等于复制。程序负责权限校验、确定性规则、审计记录和回滚开关。AI 只负责检索、分类、生成候选或建议，不得最终授权不可逆动作。人负责授权不可逆动作、决定放量与终止。人工队列有上限、时限和能力约束。客户业务负责人拥有明确停止权。${UNSUPPORTED_CLAIM_BOUNDARY}\n\n${REQUIRED_WRAPPERS.map(({aria, className}) => `<div className="${className}" role="region" aria-label="${aria}" tabIndex={0} onKeyDown={handleHorizontalArrowKey}></div>`).join('\n')}`; }
function fixtureDiagram() {
  const boxes = new Map();
  STAGE_IDS.forEach((id, index) => boxes.set(id, {x: index * 500 + 2, y: 2, width: 476, height: 1776}));
  GATE_IDS.forEach((id, index) => boxes.set(id, {
    x: Math.floor(index / 3) * 500 + 20,
    y: [300, 760, 1400][index % 3],
    width: 440,
    height: 340,
  }));
  RESPONSIBILITY_IDS.forEach((id, index) => boxes.set(id, {x: 20 + index * 410, y: 2150, width: 320, height: 160}));
  boxes.set(LEGEND_ID, {x: 20, y: 2360, width: 1500, height: 180});
  boxes.set('stop-authority', {x: 1620, y: 2360, width: 300, height: 180});
  const labels = new Map([
    ...STAGE_IDS.map((id, index) => [id, [STAGES[index]]]),
    ...GATE_IDS.map((id, index) => [id, GATE_VISUALS[index]]),
    ['owner-customer', ['客户业务']], ['owner-delivery', ['交付/FDE']],
    ['owner-product', ['产品工程']], ['owner-platform', ['平台与运维']],
    ['owner-security-data', ['安全与数据']], [LEGEND_ID, LEGEND_LINES], ['stop-authority', ['停止/回退']],
  ]);
  const styleFor = (id) => {
    if (STAGE_IDS.includes(id)) return 'fillColor=#EAF2FF;strokeColor=#1D4ED8;strokeWidth=4;fontColor=#0F172A;fontSize=42;fontFamily=Arial;fontStyle=1;align=center;verticalAlign=top;spacingTop=28;';
    if (GATE_IDS.includes(id)) return 'fillColor=#FFFFFF;strokeColor=#334155;strokeWidth=4;fontColor=#0F172A;fontSize=38;fontFamily=Arial;fontStyle=1;align=center;';
    if (id === 'stop-authority') return 'fillColor=#FFF1F2;strokeColor=#BE123C;strokeWidth=4;fontColor=#881337;fontSize=38;fontFamily=Arial;fontStyle=1;align=center;';
    if (id === LEGEND_ID) return 'fillColor=#F8FAFC;strokeColor=#64748B;strokeWidth=4;fontColor=#0F172A;fontSize=38;fontFamily=Arial;fontStyle=1;align=center;';
    return 'fillColor=#F1F5F9;strokeColor=#475569;strokeWidth=4;fontColor=#0F172A;fontSize=38;fontFamily=Arial;fontStyle=1;align=center;';
  };
  const vertex = (id) => {
    const box = boxes.get(id);
    return `<mxCell id="${id}" value="${labels.get(id).join('&#10;')}" vertex="1" style="${styleFor(id)}"><mxGeometry x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" as="geometry"/></mxCell>`;
  };
  const routes = new Map([
    ['feedback-rollout-to-acceptance', [{x: 1740, y: 200}, {x: 740, y: 200}]],
    ['feedback-compliance-to-scope', [{x: 1240, y: 1940}, {x: 240, y: 1940}]],
    ['feedback-reuse-to-contract', [{x: 1740, y: 1250}, {x: 740, y: 1250}]],
  ]);
  const ports = new Map([
    ['feedback-rollout-to-acceptance', {entryX: .5, entryY: 0, exitX: .5, exitY: 0}],
    ['feedback-compliance-to-scope', {entryX: .5, entryY: 1, exitX: .5, exitY: 1}],
    ['feedback-reuse-to-contract', {entryX: .5, entryY: 0, exitX: .5, exitY: 0}],
  ]);
  const edgeStyle = 'strokeColor=#1D4ED8;strokeWidth=5;dashed=1;dashPattern=18 10;endArrow=block;endFill=1;endSize=40;fontColor=#0F172A;fontSize=38;fontFamily=Arial;fontStyle=1;align=center;';
  const feedback = FEEDBACK_IDS.map((id) => {
    const [source, target] = FEEDBACK_TOPOLOGY.get(id);
    const port = ports.get(id);
    const pointsXml = routes.get(id).map(({x, y}) => `<mxPoint x="${x}" y="${y}"/>`).join('');
    return `<mxCell id="${id}" value="${FEEDBACK_LABELS.get(id)}" edge="1" source="${source}" target="${target}" style="${edgeStyle}exitX=${port.exitX};exitY=${port.exitY};exitPerimeter=1;entryX=${port.entryX};entryY=${port.entryY};entryPerimeter=1;"><mxGeometry relative="1" as="geometry"><Array as="points">${pointsXml}</Array></mxGeometry></mxCell>`;
  }).join('');
  const drawio = `<mxfile><diagram><mxGraphModel><root>${[...boxes.keys()].map(vertex).join('')}${feedback}</root></mxGraphModel></diagram></mxfile>`;

  const nodeGroups = [...boxes.keys()].map((id) => {
    const box = boxes.get(id);
    const className = STAGE_IDS.includes(id) ? 'stage-shape' : (GATE_IDS.includes(id) ? 'gate-shape' : (id === 'stop-authority' ? 'stop-shape' : (id === LEGEND_ID ? 'legend-shape' : 'owner-shape')));
    const labelClass = STAGE_IDS.includes(id) ? 'stage-label' : (GATE_IDS.includes(id) ? 'gate-label' : (id === 'stop-authority' ? 'stop-label' : (id === LEGEND_ID ? 'legend-label' : 'owner-label')));
    const center = box.x + box.width / 2;
    const baselines = GATE_IDS.includes(id) ? [box.y + 80, box.y + 145, box.y + 210, box.y + 275]
      : [STAGE_IDS.includes(id) ? 82 : (id === LEGEND_ID ? 2435 : (id === 'stop-authority' ? 2465 : 2235)), 2490];
    const tspans = labels.get(id).map((label, index) => `<tspan x="${center}" y="${baselines[index]}">${label}</tspan>`).join('');
    return `<g data-node-id="${id}"><rect class="${className}" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/><text class="${labelClass}" x="${center}" y="${baselines[0]}">${tspans}</text></g>`;
  }).join('');
  const endpointFor = (id, side) => {
    const [source, target] = FEEDBACK_TOPOLOGY.get(id);
    const node = boxes.get(side === 'source' ? source : target);
    const port = ports.get(id);
    const x = port[side === 'source' ? 'exitX' : 'entryX'];
    const y = port[side === 'source' ? 'exitY' : 'entryY'];
    return {x: node.x + node.width * x, y: node.y + node.height * y};
  };
  const feedbackLabelPositions = new Map([
    ['feedback-rollout-to-acceptance', {x: 1300, y: 155}],
    ['feedback-compliance-to-scope', {x: 750, y: 1870}],
    ['feedback-reuse-to-contract', {x: 1250, y: 1190}],
  ]);
  const renderedEdges = FEEDBACK_IDS.map((id) => {
    const route = [endpointFor(id, 'source'), ...routes.get(id), endpointFor(id, 'target')];
    const d = route.map(({x, y}, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const [source, target] = FEEDBACK_TOPOLOGY.get(id);
    const label = feedbackLabelPositions.get(id);
    return `<path id="${id}" class="feedback-edge" data-edge-id="${id}" data-source="${source}" data-target="${target}" d="${d}"/><text class="feedback-label" data-edge-label="${id}" x="${label.x}" y="${label.y}">${FEEDBACK_LABELS.get(id)}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="mth07-title mth07-desc" viewBox="0 0 2000 2580"><title id="mth07-title">企业 AI 四阶段十二门禁图</title><desc id="mth07-desc">四个阶段包含十二个门禁，下方责任带明确五类负责人，三条虚线反馈路径连接放量与验收、合规与切口、复制与契约，并保留停止回退节点。</desc><style>
    .stage-shape { fill: #EAF2FF; stroke: #1D4ED8; stroke-width: 4; }
    .gate-shape { fill: #FFFFFF; stroke: #334155; stroke-width: 4; }
    .owner-shape { fill: #F1F5F9; stroke: #475569; stroke-width: 4; }
    .legend-shape { fill: #F8FAFC; stroke: #64748B; stroke-width: 4; }
    .stop-shape { fill: #FFF1F2; stroke: #BE123C; stroke-width: 4; }
    .stage-label { fill: #0F172A; font: 700 42px Arial; text-anchor: middle; }
    .gate-label, .owner-label, .legend-label, .feedback-label { fill: #0F172A; font: 700 38px Arial; text-anchor: middle; }
    .feedback-label { stroke: none; }
    .stop-label { fill: #881337; font: 700 38px Arial; text-anchor: middle; }
    .feedback-layer { stroke: #1D4ED8; stroke-width: 5; }
    .feedback-edge { fill: none; stroke-dasharray: 18 10; marker-end: url(#feedback-arrow); }
  </style><defs><marker id="feedback-arrow" markerUnits="userSpaceOnUse" markerWidth="53.09016994374947" markerHeight="53.09016994374947" viewBox="0 0 53.09016994374947 53.09016994374947" refX="53.09" refY="26.545084971874736" orient="auto" preserveAspectRatio="none"><g transform="translate(0 0)" fill="#1D4ED8" stroke="#1D4ED8" stroke-width="5" style="stroke-linejoin:miter"><path d="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 2.5 49.045084971874736 z"/></g></marker></defs><rect data-canvas="true" x="0" y="0" width="2000" height="2580" fill="#FFFFFF"/>${nodeGroups}<g class="feedback-layer">${renderedEdges}</g></svg>`;
  return {drawio, svg};
}

test('MTH-07 helper contracts are green after non-no-op RED mutation fixtures', () => {
  const source = fixtureArticle(); assertMetadataAndHeadings(source); assertGateRows(source); assertEvidenceAndResponsibilities(source); assertWrappersAndArrowBehavior(source); assertNarrowHeadingContract(); assertDeliveryTermContracts(terminology); assertPeerRelations(peerSources);
  for (const claim of UNSUPPORTED_CLAIM_MUTATIONS) {
    const mutated = source.replace(UNSUPPORTED_CLAIM_BOUNDARY, `${UNSUPPORTED_CLAIM_BOUNDARY}${claim}`);
    assert.notEqual(mutated, source, `${claim} mutation is non-no-op`);
    assert.throws(() => assertEvidenceAndResponsibilities(mutated), assert.AssertionError, claim);
  }
  for (const contract of PEER_CONTRACTS) {
    const current = peerSources.get(contract.file);
    const deletedBacklink = current.replace(contract.backlink, '');
    assert.notEqual(deletedBacklink, current, `${contract.file} backlink deletion is non-no-op`);
    const deletedSources = new Map(peerSources).set(contract.file, deletedBacklink);
    assert.throws(() => assertPeerRelations(deletedSources), assert.AssertionError, `${contract.file} backlink deletion`);
    const overclaimed = current.replace(contract.backlink, `${contract.backlink}\n\n${contract.forbiddenClaim}`);
    assert.notEqual(overclaimed, current, `${contract.file} overclaim mutation is non-no-op`);
    assert.equal(overclaimed.split(contract.backlink).length - 1, 1, `${contract.file} additive overclaim retains the bounded backlink`);
    assert.equal(visibleRouteOccurrenceCount(overclaimed, contract.file, ROUTE), 1, `${contract.file} additive overclaim retains exactly one route`);
    assert.match(parseMdxVisibleCopy(overclaimed, contract.file, {includeStructure: true}).blocks.map(({text}) => text).join('\n'), contract.forbiddenPattern, `${contract.file} additive mutation contains the forbidden semantic claim`);
    const overclaimedSources = new Map(peerSources).set(contract.file, overclaimed);
    assert.throws(() => assertPeerRelations(overclaimedSources), assert.AssertionError, `${contract.file} overclaim`);
    const duplicateRoute = `${current}\n\n[重复的 MTH-07 关系](${ROUTE})\n`;
    assert.notEqual(duplicateRoute, current, `${contract.file} duplicate route mutation is non-no-op`);
    assert.equal(visibleRouteOccurrenceCount(duplicateRoute, contract.file, ROUTE), 2, `${contract.file} duplicate route remains two raw occurrences`);
    const duplicateRouteSources = new Map(peerSources).set(contract.file, duplicateRoute);
    assert.throws(() => assertPeerRelations(duplicateRouteSources), assert.AssertionError, `${contract.file} duplicate visible route`);
    const invisibleRoutes = `${current}\n\n\`[内联代码](${ROUTE})\`\n\n<!-- [注释](${ROUTE}) -->\n\n![图片](${ROUTE})\n\n\`\`\`md\n[代码块](${ROUTE})\n\`\`\`\n`;
    assert.equal(visibleRouteOccurrenceCount(invisibleRoutes, contract.file, ROUTE), 1, `${contract.file} ignores code, comments, and images when counting visible routes`);
    assert.doesNotThrow(() => assertPeerRelations(new Map(peerSources).set(contract.file, invisibleRoutes)), `${contract.file} invisible route lookalikes do not alter relations`);
    if (contract.adjacentTopics) {
      const deletedMetadata = current.replace('  - MTH-07\n', '');
      assert.notEqual(deletedMetadata, current, `${contract.file} metadata deletion is non-no-op`);
      const deletedMetadataSources = new Map(peerSources).set(contract.file, deletedMetadata);
      assert.throws(() => assertPeerRelations(deletedMetadataSources), assert.AssertionError, `${contract.file} reverse metadata deletion`);
    }
  }
  for (const [id] of DELIVERY_TERM_CONTRACTS) {
    const deleted = structuredClone(terminology);
    deleted.terms = deleted.terms.filter((term) => term.id !== id);
    assert.throws(() => assertDeliveryTermContracts(deleted), assert.AssertionError, `${id} deletion mutation`);
    const mutated = structuredClone(terminology);
    mutated.terms.find((term) => term.id === id).first_use += '-changed';
    assert.throws(() => assertDeliveryTermContracts(mutated), assert.AssertionError, `${id} first-use mutation`);
  }
  const governance = fixtureGovernance();
  assertIllustrationGovernance(governance);
  assertSourceContracts(governance.sources, governance.documents[ARTICLE].citations);
  const governanceMutations = [
    ['illustration locator', (value) => { value.sources.find(({id}) => id === ILLUSTRATION_SOURCE_ID).canonical_locator = '/img/diagrams/wrong.svg'; }],
    ['illustration source roles', (value) => { value.sources.find(({id}) => id === ILLUSTRATION_SOURCE_ID).allowed_evidence_roles.push('method'); }],
    ['illustration citation URL', (value) => { value.documents[ARTICLE].citations.find(({source_id}) => source_id === ILLUSTRATION_SOURCE_ID).citation_url = '/img/diagrams/wrong.svg'; }],
    ['illustration citation roles', (value) => { value.documents[ARTICLE].citations.find(({source_id}) => source_id === ILLUSTRATION_SOURCE_ID).roles.push('method'); }],
    ['illustration usage mode', (value) => { value.documents[ARTICLE].citations.find(({source_id}) => source_id === ILLUSTRATION_SOURCE_ID).usage_mode = 'facts-summary'; }],
    ['illustration citation fields', (value) => { value.documents[ARTICLE].citations.find(({source_id}) => source_id === ILLUSTRATION_SOURCE_ID).evidence_role = 'illustration'; }],
    ['illustration missing citation field', (value) => { delete value.documents[ARTICLE].citations.find(({source_id}) => source_id === ILLUSTRATION_SOURCE_ID).attribution_note; }],
    ['illustration document fields', (value) => { value.documents[ARTICLE].evidence_role = 'illustration'; }],
    ['illustration missing document field', (value) => { delete value.documents[ARTICLE].reviewed_at; }],
    ['illustration document reviewed before source cutoff', (value) => { value.documents[ARTICLE].reviewed_at = '2026-08-12'; }],
  ];
  for (const [label, change] of governanceMutations) {
    const mutation = structuredClone(governance);
    change(mutation);
    assert.notDeepEqual(mutation, governance, `${label} mutation is non-no-op`);
    assert.throws(() => assertIllustrationGovernance(mutation), assert.AssertionError, label);
  }
  const sourceMutations = [];
  for (const id of SOURCE_IDS) {
    for (const field of SOURCE_SCHEMA_FIELDS) {
      sourceMutations.push([`${id} missing ${field}`, (value) => {
        delete value.sources.find((item) => item.id === id)[field];
      }]);
    }
    sourceMutations.push([`${id} extra source field`, (value) => {
      value.sources.find((item) => item.id === id).unexpected = true;
    }]);
    sourceMutations.push([`${id} all source fields omitted`, (value) => {
      const item = value.sources.find((source) => source.id === id);
      for (const field of Object.keys(item)) delete item[field];
    }]);
    for (const field of CITATION_SCHEMA_FIELDS) {
      sourceMutations.push([`${id} citation missing ${field}`, (value) => {
        delete value.documents[ARTICLE].citations.find((citation) => citation.source_id === id)[field];
      }]);
    }
    sourceMutations.push([`${id} citation extra field`, (value) => {
      value.documents[ARTICLE].citations.find((citation) => citation.source_id === id).unexpected = true;
    }]);
    sourceMutations.push([`${id} citation all fields omitted`, (value) => {
      const citation = value.documents[ARTICLE].citations.find((item) => item.source_id === id);
      for (const field of Object.keys(citation)) delete citation[field];
    }]);
    sourceMutations.push([`${id} registered before source cutoff`, (value) => {
      value.sources.find((source) => source.id === id).registered_at = '2026-08-12';
    }]);
    sourceMutations.push([`${id} checked before registration`, (value) => {
      value.sources.find((source) => source.id === id).checked_at = '2026-08-13';
    }]);
    sourceMutations.push([`${id} approved before check`, (value) => {
      value.sources.find((source) => source.id === id).expected_final_approved_at = '2026-08-13';
    }]);
  }
  sourceMutations.push(['illustration created before source cutoff', (value) => { value.sources.find(({id}) => id === ILLUSTRATION_SOURCE_ID).published_at = '2026-08-12'; }]);
  sourceMutations.push(['illustration created after registration', (value) => { value.sources.find(({id}) => id === ILLUSTRATION_SOURCE_ID).published_at = '2026-08-15'; }]);
  sourceMutations.push(['NIST is not primary', (value) => { value.documents[ARTICLE].citations.find(({source_id}) => source_id === 'src-nist-ai-rmf-1-0').manifest_primary = false; }]);
  sourceMutations.push(['Google cannot become a second primary', (value) => { value.documents[ARTICLE].citations.find(({source_id}) => source_id === 'src-google-sre-canarying-releases').manifest_primary = true; }]);
  for (const [label, change] of sourceMutations) {
    const mutation = structuredClone(governance);
    change(mutation);
    assert.notDeepEqual(mutation, governance, `${label} mutation is non-no-op`);
    assert.throws(() => assertSourceContracts(mutation.sources, mutation.documents[ARTICLE].citations), assert.AssertionError, label);
  }
  const extraH3 = mutate(source, '### 不应照搬的部分', '### 关键源码导读\n\n### 不应照搬的部分', 'extra transfer H3'); const metadataMutations = [mutate(source, 'topic_id: MTH-07', 'topic_id: MTH-99', 'wrong topic'), mutate(source, 'content_type: method', 'content_type: style', 'wrong type'), mutate(source, '## 一页摘要', '## 完整演练', 'fallback headings'), mutate(source, '### 不应照搬的部分', '', 'missing transfer H3'), extraH3]; metadataMutations.forEach((item) => assert.throws(() => assertMetadataAndHeadings(item), assert.AssertionError));
  for (const row of GATE_ROWS) { for (let index = 0; index < row.length; index += 1) { const changed = [...row]; changed[index] = '错误字段'; const mutation = mutate(source, `| ${row.join(' | ')} |`, `| ${changed.join(' | ')} |`, `${row[1]} field`); assert.throws(() => assertGateRows(mutation), assert.AssertionError); } const deletion = mutate(source, `| ${row.join(' | ')} |\n`, '', `${row[1]} deletion`); assert.throws(() => assertGateRows(deletion), assert.AssertionError); }
  const ownerlessDuplicate = mutate(source, `| ${GATE_ROWS.at(-1).join(' | ')} |`, `| ${GATE_ROWS.at(-1).slice(0, 6).join(' | ')} |  | ${GATE_ROWS.at(-1)[7]} |\n| ${GATE_ROWS.at(-1).join(' | ')} |`, 'ownerless duplicate'); assert.throws(() => assertGateRows(ownerlessDuplicate), assert.AssertionError);
  for (const [from, to] of [['POC 成功不等于生产可用','POC 成功就是生产可用'], ['生产可用不等于验收通过','生产可用就是验收通过'], ['验收通过不等于放量','验收通过就是放量'], ['放量不等于复制','放量就是复制'], ['AI 只负责检索、分类、生成候选或建议，不得最终授权不可逆动作','AI 最终授权不可逆动作'], ['程序负责权限校验、确定性规则、审计记录和回滚开关','程序把确定性规则交给概率模型'], ['人负责授权不可逆动作、决定放量与终止','AI 负责授权不可逆动作、决定放量与终止'], ['人工队列有上限、时限和能力约束','人工兜底无限且无时限'], ['客户业务负责人拥有明确停止权','停止权未指定'], ['NIST AI RMF 1.0 支持评估、监测与人工覆盖机制','NIST 说明市场规模为 100 亿元']]) { const mutation = mutate(source, from, to, from); assert.throws(() => assertEvidenceAndResponsibilities(mutation), assert.AssertionError); }
  const excludedAttribution = mutate(source, 'NIST AI RMF 1.0 支持评估、监测与人工覆盖机制。', 'NIST AI RMF 1.0 支持评估、监测与人工覆盖机制。\u5fae\u4fe1文章构成独立证据。', 'excluded attribution');
  assert.throws(() => assertEvidenceAndResponsibilities(excludedAttribution), assert.AssertionError, 'excluded attribution');
  const detachedHandler = mutate(source, "onKeyDown={handleHorizontalArrowKey}", 'onKeyDown={() => {}}', 'detached ArrowRight handler'); assert.throws(() => assertWrappersAndArrowBehavior(detachedHandler), assert.AssertionError);
  const {drawio, svg} = fixtureDiagram();
  assertDiagram(drawio, svg);
  const crossingDrawio = mutate(
    drawio,
    '<mxPoint x="1240" y="1940"/><mxPoint x="240" y="1940"/>',
    '<mxPoint x="1240" y="1200"/><mxPoint x="240" y="1200"/>',
    'route crossing Draw.io',
  );
  const crossingSvg = mutate(
    svg,
    'L 1240 1940 L 240 1940',
    'L 1240 1200 L 240 1200',
    'route crossing SVG',
  );
  const partialSharedDrawio = mutate(
    drawio,
    '<mxPoint x="1240" y="1940"/><mxPoint x="240" y="1940"/>',
    '<mxPoint x="1240" y="1250"/><mxPoint x="1000" y="1250"/><mxPoint x="1000" y="1940"/><mxPoint x="240" y="1940"/>',
    'partial shared segment Draw.io',
  );
  const partialSharedSvg = mutate(
    svg,
    'M 1240 1740 L 1240 1940 L 240 1940 L 240 1740',
    'M 1240 1740 L 1240 1250 L 1000 1250 L 1000 1940 L 240 1940 L 240 1740',
    'partial shared segment SVG',
  );
  const outsideDrawio = mutate(
    drawio,
    '<mxGeometry x="20" y="300" width="440" height="340" as="geometry"/>',
    '<mxGeometry x="-80" y="300" width="440" height="340" as="geometry"/>',
    'gate outside Draw.io',
  );
  const outsideSvg = mutate(
    svg,
    '<g data-node-id="gate-01">',
    '<g data-node-id="gate-01" transform="translate(-100 0)">',
    'gate outside SVG',
  );
  const shrinkDrawio = mutate(drawio, 'fontSize=38;fontFamily=Arial;fontStyle=1;align=center;',
    'fontSize=20;fontFamily=Arial;fontStyle=1;align=center;', 'node text shrink Draw.io');
  const shrinkSvg = mutate(svg, '</style>',
    'g[data-node-id="gate-01"] .gate-label { font-size: 20px !important; }</style>', 'node text shrink SVG');
  const ownersBelowDrawio = RESPONSIBILITY_IDS.reduce((current, id, index) => mutate(
    current,
    `<mxGeometry x="${20 + index * 410}" y="2150" width="320" height="160" as="geometry"/>`,
    `<mxGeometry x="${20 + index * 410}" y="2750" width="320" height="160" as="geometry"/>`,
    `${id} Draw.io below viewBox`,
  ), drawio);
  const ownersBelowSvg = RESPONSIBILITY_IDS.reduce((current, id) => mutate(
    current,
    `<g data-node-id="${id}">`,
    `<g data-node-id="${id}" transform="translate(0 600)">`,
    `${id} SVG node/text below viewBox`,
  ), svg);
  const diagramMutations = [
    ['missing accessible title', drawio, mutate(svg,
      '<title id="mth07-title">企业 AI 四阶段十二门禁图</title>', '', 'missing accessible title')],
    ['changed accessible binding', drawio, mutate(svg,
      'aria-labelledby="mth07-title mth07-desc"', 'aria-labelledby="mth07-title wrong-desc"', 'changed accessible binding')],
    ['source exit port', mutate(drawio, 'exitX=0.5;exitY=0;', 'exitX=0.2;exitY=0;', 'source exit port'), svg],
    ['target entry port', mutate(drawio, 'entryX=0.5;entryY=0;', 'entryX=0.8;entryY=0;', 'target entry port'), svg],
    ['exit perimeter', mutate(drawio, 'exitPerimeter=1;', 'exitPerimeter=0;', 'exit perimeter'), svg],
    ['entry perimeter', mutate(drawio, 'entryPerimeter=1;', 'entryPerimeter=0;', 'entry perimeter'), svg],
    ['waypoint delete', mutate(drawio, '<mxPoint x="1740" y="200"/>', '', 'waypoint delete'), svg],
    ['waypoint change', mutate(drawio, '<mxPoint x="1740" y="200"/>', '<mxPoint x="1700" y="200"/>', 'waypoint change'), svg],
    ['only Array as=points', mutate(drawio, '<Array as="points">', '<Array as="controlPoints">', 'only Array as=points'), svg],
    ['extra non-points Array', mutate(drawio, '<Array as="points">', '<Array as="controlPoints"><mxPoint x="1" y="1"/></Array><Array as="points">', 'extra non-points Array'), svg],
    ['route crossing', crossingDrawio, crossingSvg],
    ['partial shared segment', partialSharedDrawio, partialSharedSvg],
    ['gate outside stage', outsideDrawio, outsideSvg],
    ['node collision', drawio, mutate(svg, 'data-edge-label="feedback-rollout-to-acceptance" x="1300" y="155"', 'data-edge-label="feedback-rollout-to-acceptance" x="1300" y="400"', 'node collision')],
    ['caption/stroke collision', drawio, mutate(svg,
      'data-edge-label="feedback-rollout-to-acceptance" x="1300" y="155"',
      'data-edge-label="feedback-rollout-to-acceptance" x="1300" y="230"', 'caption/stroke collision')],
    ['boundary collision', drawio, mutate(svg, 'data-edge-label="feedback-rollout-to-acceptance" x="1300" y="155"', 'data-edge-label="feedback-rollout-to-acceptance" x="1390" y="155"', 'boundary collision')],
    ['stop label loss', drawio, mutate(svg, '>停止/回退</tspan>', '>继续运行</tspan>', 'stop label loss')],
    ['owner label loss', drawio, mutate(svg, '>客户业务</tspan>', '>无人负责</tspan>', 'owner label loss')],
    ['legend loss', drawio, mutate(svg, '>虚线：未通过即返回</tspan>', '>无返回路径</tspan>', 'legend loss')],
    ['node text shrink', shrinkDrawio, shrinkSvg],
    ['transformed text shrink', drawio, mutate(svg, '<text class="gate-label" x="240" y="380">', '<text class="gate-label" x="240" y="380" transform="translate(240 380) scale(.1) translate(-240 -380)">', 'transformed text shrink')],
    ['tspan font drift', drawio, mutate(svg, '<tspan x="240" y="380">需求考古</tspan>', '<tspan x="240" y="380" style="font-family:serif;font-weight:400">需求考古</tspan>', 'tspan font drift')],
    ['font point unit drift', drawio, mutate(svg, 'font: 700 38px Arial;', 'font: 700 38pt Arial;', 'font point unit drift')],
    ['per-glyph x positions', drawio, mutate(svg, '<tspan x="240" y="380">需求考古</tspan>', '<tspan x="240 490 600 700" y="380">需求考古</tspan>', 'per-glyph x positions')],
    ['textLength adjustment', drawio, mutate(svg, '<tspan x="240" y="380">需求考古</tspan>', '<tspan x="240" y="380" textLength="900" lengthAdjust="spacingAndGlyphs">需求考古</tspan>', 'textLength adjustment')],
    ['per-glyph dy positions', drawio, mutate(svg, '<tspan x="240" y="380">需求考古</tspan>', '<tspan x="240" y="380" dy="0 0 500 500">需求考古</tspan>', 'per-glyph dy positions')],
    ['per-glyph rotations', drawio, mutate(svg, '<tspan x="240" y="380">需求考古</tspan>', '<tspan x="240" y="380" rotate="0 0 90 90">需求考古</tspan>', 'per-glyph rotations')],
    ['CSS text transform', drawio, mutate(svg, '</style>', '.gate-label { transform: scale(.1); }</style>', 'CSS text transform')],
    ['missing feedback label', drawio, mutate(svg, '>放量回验收</text>', '></text>', 'missing feedback label')],
    ['duplicate feedback label', drawio, mutate(svg, '</svg>', '<text class="feedback-label" data-edge-label="feedback-rollout-to-acceptance" x="1300" y="100">放量回验收</text></svg>', 'duplicate feedback label')],
    ['untagged duplicate feedback label', drawio, mutate(svg, '</svg>', '<text class="feedback-label" x="1300" y="100">放量回验收</text></svg>', 'untagged duplicate feedback label')],
    ['split duplicate feedback label', drawio, mutate(svg, '</svg>', '<text class="feedback-label" x="1300" y="100"><tspan>放量回</tspan><tspan>验收</tspan></text></svg>', 'split duplicate feedback label')],
    ['duplicate Draw.io edge ID', mutate(drawio, '</root>', '<mxCell id="feedback-rollout-to-acceptance" edge="1"/></root>', 'duplicate Draw.io edge ID'), svg],
    ['duplicate SVG edge ID', drawio, mutate(svg, '</svg>', '<path data-edge-id="feedback-rollout-to-acceptance"/></svg>', 'duplicate SVG edge ID')],
    ['duplicate SVG node ID', drawio, mutate(svg, '</svg>', '<g data-node-id="gate-01"></g></svg>', 'duplicate SVG node ID')],
    ['marker missing', drawio, mutate(svg, '<marker id="feedback-arrow"', '<marker id="renamed-arrow"', 'marker missing')],
    ['marker dangling', drawio, mutate(svg, 'url(#feedback-arrow)', 'url(#missing-arrow)', 'marker dangling')],
    ['marker invisible fill none', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="translate(0 0)" fill="none"', 'marker invisible fill none')],
    ['marker zero painted area', drawio, mutate(svg, 'd="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 2.5 49.045084971874736 z"', 'd="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 47.5 26.545084971874736 z"', 'marker zero painted area')],
    ['marker fragment ID collision', drawio, mutate(svg, '<defs>', '<path id="feedback-arrow" d="M 0 0 L 1 1"/><defs>', 'marker fragment ID collision')],
    ['marker clipped outside viewport', drawio, mutate(svg, 'refX="53.09" refY="26.545084971874736"', 'refX="153.09" refY="26.545084971874736"', 'marker clipped ref')
      .replace('d="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 2.5 49.045084971874736 z"', 'd="M 147.5 26.545084971874736 L 102.5 4.045084971874737 L 102.5 49.045084971874736 z"')],
    ['marker near invisible', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="translate(0 0)" fill="#1D4ED8" fill-opacity="0.001"', 'marker near invisible')],
    ['marker huge stroke', drawio, mutate(svg, 'stroke-width="5" style="stroke-linejoin:miter"', 'stroke-width="200" style="stroke-linejoin:miter"', 'marker huge stroke')],
    ['marker target collision', drawio, mutate(svg, 'refX="53.09" refY="26.545084971874736"', 'refX="0" refY="-87"', 'marker target collision')],
    ['marker painter occlusion', drawio, mutate(svg, '</g></marker>', '<path fill="#FFFFFF" d="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 2.5 49.045084971874736 z"/></g></marker>', 'marker painter occlusion')],
    ['node fill opacity drift', drawio, mutate(svg, '</style>', '.gate-shape { fill-opacity: .05 !important; }</style>', 'node fill opacity drift')],
    ['node stroke opacity drift', drawio, mutate(svg, '</style>', '.gate-shape { stroke-opacity: .05 !important; }</style>', 'node stroke opacity drift')],
    ['white essential paint',
      mutate(drawio, 'fontColor=#0F172A;fontSize=42;', 'fontColor=#FFFFFF;fontSize=42;', 'white essential paint Draw.io'),
      mutate(svg, '.stage-label { fill: #0F172A;', '.stage-label { fill: #FFFFFF;', 'white essential paint SVG')],
    ['marker collision', drawio, mutate(svg, 'markerHeight="53.09016994374947"', 'markerHeight="800"', 'marker collision')],
    ['selector override', drawio, mutate(svg, '</style>', '#feedback-rollout-to-acceptance.feedback-edge { stroke: #FFFFFF !important; }</style>', 'selector override')],
    ['uppercase property override', drawio, mutate(svg, '</style>', '.feedback-edge { STROKE: #FFFFFF !important; }</style>', 'uppercase property override')],
    [':not selector override', drawio, mutate(svg, '</style>', 'path.feedback-edge:not(.never) { stroke: #FFFFFF !important; }</style>', ':not selector override')],
    ['source-order override', drawio, mutate(svg, '</style>', '.feedback-edge { stroke: #FFFFFF; }</style>', 'source-order override')],
    ['inline override', drawio, mutate(svg, 'id="feedback-rollout-to-acceptance" class="feedback-edge"', 'id="feedback-rollout-to-acceptance" class="feedback-edge" style="stroke:#FFFFFF"', 'inline override')],
    ['inline important override', drawio, mutate(svg, 'id="feedback-rollout-to-acceptance" class="feedback-edge"', 'id="feedback-rollout-to-acceptance" class="feedback-edge" style="stroke:#FFFFFF !important"', 'inline important override')],
    ['opacity override', drawio, mutate(svg, 'id="feedback-rollout-to-acceptance" class="feedback-edge"', 'id="feedback-rollout-to-acceptance" class="feedback-edge" stroke-opacity="0.05"', 'opacity override')],
    ['ancestor opacity override', drawio, mutate(svg, '<g class="feedback-layer">', '<g class="feedback-layer" opacity="0.05">', 'ancestor opacity override')],
    ['label fill-opacity override', drawio, mutate(svg, 'data-edge-label="feedback-rollout-to-acceptance" x="1300"', 'data-edge-label="feedback-rollout-to-acceptance" fill-opacity="0.05" x="1300"', 'label fill-opacity override')],
    ['visibility collapse', drawio, mutate(svg, 'data-edge-label="feedback-rollout-to-acceptance" x="1300"', 'data-edge-label="feedback-rollout-to-acceptance" visibility="collapse" x="1300"', 'visibility collapse')],
    ['connector fill drift', drawio, mutate(svg, 'id="feedback-rollout-to-acceptance" class="feedback-edge"', 'id="feedback-rollout-to-acceptance" class="feedback-edge" style="fill:#FFFFFF"', 'connector fill drift')],
    ['local background override', drawio, mutate(svg, '<path id="feedback-rollout-to-acceptance"', '<rect x="900" y="180" width="700" height="40" fill="#1D4ED8"/><path id="feedback-rollout-to-acceptance"', 'local background override')],
    ['partial local background override', drawio, mutate(svg, '<path id="feedback-rollout-to-acceptance"', '<rect x="1500" y="180" width="100" height="40" fill="#1D4ED8"/><path id="feedback-rollout-to-acceptance"', 'partial local background override')],
    ['underlying stroke override', drawio, mutate(svg, '<path id="feedback-rollout-to-acceptance"', '<path d="M 1740 300 L 1740 200 L 740 200 L 740 300" fill="none" stroke="#1D4ED8" stroke-width="40"/><path id="feedback-rollout-to-acceptance"', 'underlying stroke override')],
    ['short underlying stroke override', drawio, mutate(svg, '<path id="feedback-rollout-to-acceptance"', '<path d="M 1550 200 L 1570 200" fill="none" stroke="#1D4ED8" stroke-width="40"/><path id="feedback-rollout-to-acceptance"', 'short underlying stroke override')],
    ['partial label background override', drawio, mutate(svg,
      '<rect class="gate-shape" x="20" y="300" width="440" height="340"/><text class="gate-label"',
      '<rect class="gate-shape" x="20" y="300" width="440" height="340"/><rect x="140" y="340" width="75" height="70" fill="#0F172A"/><text class="gate-label"',
      'partial label background override')],
    ['translucent canvas', drawio, mutate(svg, 'data-canvas="true"', 'data-canvas="true" opacity="0.8"', 'translucent canvas')],
    ['Draw.io stroke drift', mutate(drawio, 'strokeColor=#1D4ED8;strokeWidth=5;', 'strokeColor=#DC2626;strokeWidth=5;', 'Draw.io stroke drift'), svg],
    ['SVG stroke drift', drawio, mutate(svg, '.feedback-layer { stroke: #1D4ED8;', '.feedback-layer { stroke: #DC2626;', 'SVG stroke drift')],
    ['Draw.io dash drift', mutate(drawio, 'dashPattern=18 10;', 'dashPattern=5 5;', 'Draw.io dash drift'), svg],
    ['SVG dash drift', drawio, mutate(svg, 'stroke-dasharray: 18 10;', 'stroke-dasharray: 5 5;', 'SVG dash drift')],
    ['Draw.io marker drift', mutate(drawio, 'endArrow=block;endFill=1;', 'endArrow=open;endFill=0;', 'Draw.io marker drift'), svg],
    ['Draw.io endSize drift', mutate(drawio, 'endSize=40;', 'endSize=39;', 'Draw.io endSize drift'), svg],
    ['SVG marker footprint drift', drawio, mutate(svg, 'markerWidth="53.09016994374947"', 'markerWidth="52.09016994374947"', 'SVG marker footprint drift')],
    ['SVG marker endpoint offset drift', drawio, mutate(svg, 'refX="53.09"', 'refX="52.09"', 'SVG marker endpoint offset drift')],
    ['marker nonidentity translate', drawio, mutate(svg,
      'transform="translate(0 0)" fill="#1D4ED8"', 'transform="translate(10 0)" fill="#1D4ED8"',
      'marker nonidentity translate')],
    ['marker nonidentity scale', drawio, mutate(svg,
      'transform="translate(0 0)" fill="#1D4ED8"', 'transform="scale(.5)" fill="#1D4ED8"',
      'marker nonidentity scale')],
    ['marker path nonidentity rotate', drawio, mutate(svg,
      '<path d="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 2.5 49.045084971874736 z"/>',
      '<path transform="rotate(15)" d="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 2.5 49.045084971874736 z"/>',
      'marker path nonidentity rotate')],
    ['SVG marker drift', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="translate(0 0)" fill="#DC2626"', 'SVG marker drift')],
    ['Draw.io label font drift', mutate(drawio, 'fontColor=#0F172A;fontSize=42;', 'fontColor=#0F172A;fontSize=30;', 'Draw.io label font drift'), svg],
    ['SVG label font drift', drawio, mutate(svg, 'font: 700 42px Arial;', 'font: 400 42px Arial;', 'SVG label font drift')],
    ['unsupported cubic route', drawio, mutate(svg, 'd="M 1740 300 L 1740 200 L 740 200 L 740 300"', 'd="M 1740 300 C 1740 200 740 200 740 300"', 'unsupported cubic route')],
    ['disconnected move route', drawio, mutate(svg, 'd="M 1740 300 L 1740 200 L 740 200 L 740 300"', 'd="M 1740 300 M 1740 200 M 740 200 M 740 300"', 'disconnected move route')],
    ['invalid transform suffix', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="translate(0 0) INVALID" fill="#1D4ED8"', 'invalid transform suffix')],
    ['decoy edge occluder', drawio, mutate(svg, '</svg>', '<rect data-edge-id="decoy" x="1200" y="1880" width="200" height="120" fill="#FFFFFF"/></svg>', 'decoy edge occluder')],
    ['known edge ID occluder', drawio, mutate(svg, '</svg>', '<rect data-edge-id="feedback-rollout-to-acceptance" x="1200" y="1880" width="200" height="120" fill="#FFFFFF"/></svg>', 'known edge ID occluder')],
    [':is selector override', drawio, mutate(svg, '</style>', ':is(.feedback-edge) { stroke: #FFFFFF !important; }</style>', ':is selector override')],
    ['at-rule override', drawio, mutate(svg, '</style>', '@media all { .feedback-edge { stroke: #FFFFFF !important; } }</style>', 'at-rule override')],
    ['clip-path hiding', drawio, mutate(svg, 'id="feedback-rollout-to-acceptance" class="feedback-edge"', 'id="feedback-rollout-to-acceptance" class="feedback-edge" clip-path="inset(100%)"', 'clip-path hiding')],
    ['mask hiding', drawio, mutate(svg, 'id="feedback-rollout-to-acceptance" class="feedback-edge"', 'id="feedback-rollout-to-acceptance" class="feedback-edge" mask="url(#missing-mask)"', 'mask hiding')],
    ['filter hiding', drawio, mutate(svg, 'id="feedback-rollout-to-acceptance" class="feedback-edge"', 'id="feedback-rollout-to-acceptance" class="feedback-edge" filter="opacity(0)"', 'filter hiding')],
    ['dual transform cascade', drawio,
      mutate(svg, '<g data-node-id="gate-01">', '<g data-node-id="gate-01" transform="translate(900 0)" style="transform:translate(100 0)">', 'dual transform SVG')],
    ['polyline occluder', drawio, mutate(svg, '</svg>', '<polyline points="1200,1940 1400,1940" stroke="#FFFFFF" stroke-width="100"/></svg>', 'polyline occluder')],
    ['image occluder', drawio, mutate(svg, '</svg>', '<image x="1200" y="1880" width="200" height="120" href="data:image/svg+xml,%3Csvg/%3E"/></svg>', 'image occluder')],
    ['use occluder', drawio, mutate(svg, '</svg>', '<use href="#gate-01" x="1200" y="1880"/></svg>', 'use occluder')],
    ['foreignObject occluder', drawio, mutate(svg, '</svg>', '<foreignObject x="1200" y="1880" width="200" height="120"></foreignObject></svg>', 'foreignObject occluder')],
    ['text occluder', drawio, mutate(svg, '</svg>', '<text x="1200" y="1940" font-size="200" fill="#FFFFFF">████</text></svg>', 'text occluder')],
    ['arrow rectangle', drawio, mutate(svg, '<path d="M 47.5 26.545084971874736 L 2.5 4.045084971874737 L 2.5 49.045084971874736 z"/>', '<rect x="0" y="0" width="53.09016994374947" height="53.09016994374947"/>', 'arrow rectangle')],
    ['marker medium stroke', drawio, mutate(svg, 'stroke-width="5" style="stroke-linejoin:miter"', 'stroke-width="20" style="stroke-linejoin:miter"', 'marker medium stroke')],
    ['percentage label coordinate', drawio, mutate(svg, 'data-edge-label="feedback-rollout-to-acceptance" x="1300"', 'data-edge-label="feedback-rollout-to-acceptance" x="1300%"', 'percentage label coordinate')],
    ['letter spacing', drawio, mutate(svg, '</style>', '.feedback-label { letter-spacing: 100px; }</style>', 'letter spacing')],
    ['triangle node', drawio, mutate(svg, '<rect class="gate-shape" x="20" y="300" width="440" height="340"/>', '<polygon class="gate-shape" points="20,640 240,300 460,640"/>', 'triangle node')],
    ['owner displacement', mutate(drawio, '<mxGeometry x="430" y="2150" width="320" height="160" as="geometry"/>', '<mxGeometry x="530" y="2150" width="320" height="160" as="geometry"/>', 'owner displacement Draw.io'),
      mutate(svg, '<g data-node-id="owner-delivery">', '<g data-node-id="owner-delivery" transform="translate(100 0)">', 'owner displacement SVG')],
    ['owner horizontal padding 12.8px', drawio, mutate(svg,
      '<tspan x="590" y="2235">交付/FDE</tspan>', '<tspan x="602" y="2235">交付/FDE</tspan>',
      'owner horizontal padding 12.8px')],
    ['legend baseline gap 18px', drawio, mutate(svg,
      '<tspan x="770" y="2490">虚线：未通过即返回</tspan>',
      '<tspan x="770" y="2480">虚线：未通过即返回</tspan>', 'legend baseline gap 18px')],
    ['stage top padding 13.6px', drawio, mutate(svg,
      '<tspan x="240" y="82">进场期</tspan>', '<tspan x="240" y="80">进场期</tspan>',
      'stage top padding 13.6px')],
    ['legend bottom padding 13.84px', drawio, mutate(svg,
      '<tspan x="770" y="2490">虚线：未通过即返回</tspan>',
      '<tspan x="770" y="2492">虚线：未通过即返回</tspan>', 'legend bottom padding 13.84px')],
    ['root viewBox percentage', drawio, mutate(svg, 'viewBox="0 0 2000 2580"', 'viewBox="0 0 2000 2580%"', 'root viewBox percentage')],
    ['root viewBox junk', drawio, mutate(svg, 'viewBox="0 0 2000 2580"', 'viewBox="0 0 2000 2580 junk"', 'root viewBox junk')],
    ['rect x percentage', drawio, mutate(svg, 'data-canvas="true" x="0" y="0"', 'data-canvas="true" x="0%" y="0"', 'rect x percentage')],
    ['rect y junk', drawio, mutate(svg, 'data-canvas="true" x="0" y="0"', 'data-canvas="true" x="0" y="0junk"', 'rect y junk')],
    ['rect width unit', drawio, mutate(svg, 'width="2000" height="2580" fill="#FFFFFF"', 'width="2000px" height="2580" fill="#FFFFFF"', 'rect width unit')],
    ['rect height junk', drawio, mutate(svg, 'width="2000" height="2580" fill="#FFFFFF"', 'width="2000" height="2580junk" fill="#FFFFFF"', 'rect height junk')],
    ['CSS font size percentage', drawio, mutate(svg, '</style>', '.gate-label { font-size: 38% !important; }</style>', 'CSS font size percentage')],
    ['font size percentage', drawio, mutate(svg, '<tspan x="240" y="380">需求考古</tspan>', '<tspan x="240" y="380" font-size="38%">需求考古</tspan>', 'font size percentage')],
    ['translate percentage', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="translate(0% 0)" fill="#1D4ED8"', 'translate percentage')],
    ['translate arity', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="translate(0 0 2)" fill="#1D4ED8"', 'translate arity')],
    ['rotate dimensional junk', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="rotate(90deg junk)" fill="#1D4ED8"', 'rotate dimensional junk')],
    ['rotate arity', drawio, mutate(svg, 'transform="translate(0 0)" fill="#1D4ED8"', 'transform="rotate(90 1)" fill="#1D4ED8"', 'rotate arity')],
    ['Draw.io ellipse node', mutate(drawio, 'style="fillColor=#FFFFFF;strokeColor=#334155;', 'style="ellipse;fillColor=#FFFFFF;strokeColor=#334155;', 'Draw.io ellipse node'), svg],
    ['Draw.io rhombus node', mutate(drawio, 'style="fillColor=#FFFFFF;strokeColor=#334155;', 'style="shape=rhombus;fillColor=#FFFFFF;strokeColor=#334155;', 'Draw.io rhombus node'), svg],
    ['Draw.io rounded node', mutate(drawio, 'style="fillColor=#FFFFFF;strokeColor=#334155;', 'style="rounded=1;fillColor=#FFFFFF;strokeColor=#334155;', 'Draw.io rounded node'), svg],
    ['Draw.io conflicting node shape', mutate(drawio, 'style="fillColor=#FFFFFF;strokeColor=#334155;', 'style="shape=ellipse;shape=rectangle;fillColor=#FFFFFF;strokeColor=#334155;', 'Draw.io conflicting node shape'), svg],
    ['mixed POC near boundary', drawio, mutate(svg, '<tspan x="740" y="840">POC 纪律</tspan>', '<tspan x="815" y="840">POC 纪律</tspan>', 'mixed POC near boundary')],
    ['owner band below viewBox', ownersBelowDrawio, ownersBelowSvg],
    ['invalid opacity occluder', drawio, mutate(svg, '</svg>', '<rect x="1200" y="1880" width="200" height="120" fill="#FFFFFF" opacity="NaN"/></svg>', 'invalid opacity occluder')],
    ['canvas after essentials', drawio, movedElementToEnd(svg,
      '<rect data-canvas="true" x="0" y="0" width="2000" height="2580" fill="#FFFFFF"/>', 'canvas after essentials')],
    ['node stroke clipped by viewBox',
      mutate(drawio, '<mxGeometry x="2" y="2" width="476" height="1776" as="geometry"/>', '<mxGeometry x="0" y="2" width="476" height="1776" as="geometry"/>', 'stage-entry Draw.io centerline at border'),
      mutate(svg, '<rect class="stage-shape" x="2" y="2" width="476" height="1776"/>', '<rect class="stage-shape" x="0" y="2" width="476" height="1776"/>', 'stage-entry SVG centerline at border')],
    ['text-only occluder', drawio,
      mutate(svg, '</svg>', '<rect x="200" y="45" width="80" height="45" fill="#FFFFFF"/></svg>', 'text-only occluder')],
    ['node-only occluder', drawio,
      mutate(svg, '</svg>', '<rect x="100" y="150" width="40" height="40" fill="#FFFFFF"/></svg>', 'node-only occluder')],
  ];
  for (const [label, mutatedDrawio, mutatedSvg] of diagramMutations) {
    if (DIAGRAM_FAILURE_CLASSES.has(label)) {
      assert.throws(() => assertDiagram(mutatedDrawio, mutatedSvg), (error) => {
        assert.ok(error instanceof assert.AssertionError, `${label} AssertionError`);
        assert.match(error.message, DIAGRAM_FAILURE_CLASSES.get(label), `${label} diagnostic isolation`);
        return true;
      }, label);
    } else {
      assert.throws(() => assertDiagram(mutatedDrawio, mutatedSvg), assert.AssertionError, label);
    }
  }
  const harmlessLegend = mutate(svg, '</svg>', '<rect x="1540" y="2410" width="50" height="50" fill="#F1F5F9"/></svg>', 'harmless legend');
  assertDiagram(drawio, harmlessLegend);
  for (const [label, occluder] of [
    ['rect occluder', '<rect x="1200" y="1880" width="200" height="120" fill="#FFFFFF"/>'],
    ['polygon occluder', '<polygon points="1200,1880 1400,1880 1400,2000 1200,2000" fill="#FFFFFF"/>'],
    ['path occluder', '<path d="M 1200 1880 L 1400 1880 L 1400 2000 L 1200 2000 Z" fill="#FFFFFF"/>'],
    ['circle occluder', '<circle cx="1300" cy="1940" r="60" fill="#FFFFFF"/>'],
  ]) {
    const mutation = mutate(svg, '</svg>', `${occluder}</svg>`, label);
    assert.throws(() => assertDiagram(drawio, mutation), assert.AssertionError, label);
  }
});

test('MTH-07 locks the narrow method exception while every other method retains nine headings', () => { const source = requiredArticle().source; assertMetadataAndHeadings(source); for (const document of documents.filter(({file}) => file.startsWith('methods/') && file !== 'methods/index.mdx' && file !== 'methods/mth-07-fde-enterprise-ai-delivery.mdx')) { assert.equal(document.metadata.content_type, 'method', `${document.file} cannot escape through metadata`); assert.deepEqual(document.headings.filter(({level}) => level === 2).map(({text}) => `## ${text}`), knowledgeTypeContracts.method, document.file); } });
test('MTH-07 locks twelve auditable gate contracts', () => assertGateRows(requiredArticle().source));
test('MTH-07 locks citation-aware evidence and responsibility boundaries', () => assertEvidenceAndResponsibilities(requiredArticle().source));
test('MTH-07 locks governed source identities, exact relations, wrappers, density, and current projection', () => {
  const source = requiredArticle().source; const record = ledger.documents[ARTICLE]; assert.deepEqual(record?.citations.map(({source_id}) => source_id), SOURCE_IDS); const sources = new Map(SOURCE_IDS.map((id) => [id, ledger.sources.find((item) => item.id === id)]));
  assertIllustrationGovernance(ledger);
  assertSourceContracts(SOURCE_IDS.map((id) => sources.get(id)), record?.citations ?? []);
  assert.equal(new Set([...SOURCE_CONTRACTS.values()].filter(({canonical_locator}) => canonical_locator.startsWith('https://')).map(({canonical_locator}) => new URL(canonical_locator).hostname)).size, 3, 'three independent remote domains'); const illustration = sources.get(ILLUSTRATION_SOURCE_ID); assert.equal(illustration?.source_kind, 'original-illustration'); assert.equal(illustration?.license, 'LicenseRef-Atlas-Original'); assert.equal(illustration?.copyright_policy, 'original-atlas');
  assert.deepEqual(extractInternalLinks({body: article.body}), ['/cases/temporal-saga-durable-execution', '/methods', '/methods/mth-01', '/methods/mth-04', '/methods/mth-06']); const text = visible(source); assert.match(text, /Temporal.{0,60}(?:工程机制参照|不证明 FDE 组织模式)/u); assert.doesNotMatch(text, /(?:\u5fae\u4fe1|\u0077\u0065\u0063\u0068\u0061\u0074|mp\.\u0077\u0065\u0069\u0078\u0069\u006e\.qq\.com)/iu); assert.doesNotMatch(text, /QA-09/u); assert.deepEqual(extractExternalLinks({body: article.body}).sort(), [...SOURCE_CONTRACTS.values()].filter(({canonical_locator}) => canonical_locator.startsWith('https://')).map(({canonical_locator}) => canonical_locator).sort()); assertWrappersAndArrowBehavior(source); assert.ok(analyzeCaseText(article.body).visualBalance.score > 90); assert.deepEqual({completed_topics: projectStatus.completed_topics, content_documents: projectStatus.content_documents, governed_sources: projectStatus.governed_sources}, {completed_topics: 62, content_documents: 105, governed_sources: 544}); const topic = manifest.topics.find(({id}) => id === TOPIC_ID); assert.equal(topic?.published, true); assert.equal(topic?.status?.value, 'reviewed');
});
test('MTH-07 plan pins the runnable canonical density analyzer', async () => {
  const [plan, analyzer] = await Promise.all([
    readFile(new URL(`../${PLAN}`, import.meta.url), 'utf8'),
    readFile(new URL(`../${DENSITY_ANALYZER}`, import.meta.url), 'utf8'),
  ]);
  assert.ok(analyzer.length > 0, 'canonical density analyzer exists');
  assert.doesNotMatch(plan, /scripts\/content-density\.mjs/u, 'stale missing density script');
  assert.equal(plan.split(DENSITY_ANALYZER).length - 1, 2, 'both density-plan references use the canonical analyzer');
});
test('MTH-07 diagram parses actual Draw.io terminals and rendered SVG geometry/style/painter parity', async () => { const [drawio, svg] = await Promise.all([readFile(new URL(`../${DRAWIO}`, import.meta.url), 'utf8'), readFile(new URL(`../${SVG}`, import.meta.url), 'utf8')]); assertDiagram(drawio, svg); });
