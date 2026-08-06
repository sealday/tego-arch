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
  tags: ['模型同步', '架构漂移', 'ADR', 'GitOps'],
  summary: '为代码、架构图、ADR、期望部署和实际运行事实指定单一权威、同步方向与检测证据，并用四类漂移和六步闭环完成修复与发布复核。',
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
  {事实:'主题完成状态',权威来源:'docs/content-backlog.md checkbox',派生产物:'topic manifest 与 project status',同步关系:'生成',触发时机:'Stage B closure',检测方式:'generate:content 与状态测试',责任类型:'内容发布维护者',修复方向:'修改 backlog 后重新生成',明确不证明:'checkbox 不证明部署成功'},
  {事实:'已发布内容元数据',权威来源:'MDX front matter',派生产物:'topic manifest 与 indexes',同步关系:'生成',触发时机:'内容变更或发布',检测方式:'内容 schema 与生成差异',责任类型:'内容维护者',修复方向:'修改 MDX 后重新生成',明确不证明:'元数据不证明正文事实正确'},
  {事实:'代码接口与受测结构',权威来源:'受测代码与接口契约',派生产物:'结构检查结果',同步关系:'验证',触发时机:'代码或接口变更',检测方式:'测试、schema 与接口差异',责任类型:'代码责任人',修复方向:'修改代码或经批准修订模型',明确不证明:'静态与测试证据不证明运行健康或业务边界'},
  {事实:'架构模型与图中语义',权威来源:'已批准模型与 Draw.io 图源',派生产物:'SVG 与文章视图',同步关系:'生成',触发时机:'模型或图源变更',检测方式:'Draw.io/SVG pair validator 与独立复述',责任类型:'架构文档维护者',修复方向:'修改图源并重新导出',明确不证明:'图不证明代码、部署或运行一致'},
  {事实:'ADR 决策及状态',权威来源:'ADR 文件、状态与替代关系',派生产物:'决策索引与可见链接',同步关系:'验证',触发时机:'架构显著变更或定期复核',检测方式:'状态、替代链接与实现复核',责任类型:'决策责任人',修复方向:'恢复实现或新增替代 ADR',明确不证明:'ADR 不证明实现遵循决定'},
  {事实:'期望部署声明',权威来源:'版本化 workflow 与配置声明',派生产物:'待部署计划与制品选择',同步关系:'生成',触发时机:'配置、制品或发布变更',检测方式:'配置差异、策略与构建测试',责任类型:'平台维护者',修复方向:'经批准修改声明并重新发布',明确不证明:'期望状态不等于实际状态'},
  {事实:'实际部署身份与状态',权威来源:'GitHub Deployment 与 Actions 记录',派生产物:'发布复审证据',同步关系:'观测',触发时机:'部署完成或状态变化',检测方式:'exact SHA、run、jobs、status 与 route 查询',责任类型:'发布维护者',修复方向:'回滚或前滚后形成新部署记录',明确不证明:'workflow success 不证明全部运行健康'},
  {事实:'运行观测',权威来源:'线上 route、日志、指标与实际环境查询',派生产物:'运行复核证据',同步关系:'观测',触发时机:'部署后、事件发生或定时检查',检测方式:'浏览器、端点与可观测性查询',责任类型:'运行责任人',修复方向:'修复期望或实际状态后重新观测',明确不证明:'单次观测不证明 SLA、因果或长期健康'},
];

const expectedDriftRows = [
  {漂移类型:'内容漂移',差异证据:'backlog、front matter 与 generated manifest 状态不同',严重度:'阻断',当前状态:'修复中',责任类型:'内容发布维护者',修复动作:'修改权威输入并重新生成，禁止手改 generated JSON',重新验证证据:'生成命令、状态测试与 exact diff',明确不证明:'生成一致不证明正文结论正确'},
  {漂移类型:'结构漂移',差异证据:'代码已移除接口而架构图仍保留旧关系',严重度:'待分级',当前状态:'待分级',责任类型:'代码责任人与架构文档维护者',修复动作:'先裁决结构事实权威，再修改代码或图源',重新验证证据:'接口测试、图对验证与独立复述',明确不证明:'图与代码对齐不证明部署或运行状态'},
  {漂移类型:'决策漂移',差异证据:'实现绕过 accepted ADR 且旧状态仍有效',严重度:'阻断',当前状态:'修复中',责任类型:'决策责任人',修复动作:'恢复实现，或新增 ADR 并标记旧记录 superseded',重新验证证据:'ADR 状态、替代链接与实现复核',明确不证明:'记录替代关系不证明新实现已经上线'},
  {漂移类型:'运行漂移',差异证据:'期望 commit 与实际部署或线上观测身份不同',严重度:'阻断',当前状态:'未知',责任类型:'平台维护者与运行责任人',修复动作:'保留实际观测，前滚或回滚后重新部署',重新验证证据:'新 exact-head run、jobs、route 与运行复核',明确不证明:'部署成功不证明功能、性能、可靠性或长期健康'},
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
  '由未参与修复的人独立复放检测，并用精确提交、发布流程与线上 route 完成发布复核。',
];

const expectedStatuses = ['待分级', '阻断', '修复中', '接受差异', '已验证关闭', '未知'];

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
  assert.equal(tables[0].length, 8, 'authority ledger has eight rows');
  assert.equal(tables[1].length, 4, 'drift ledger has four rows');

  const statusLine = body.match(/状态词汇限定为：([^。]+)。/u)?.[1] ?? '';
  assert.deepEqual([...statusLine.matchAll(/`([^`]+)`/gu)].map(([, value]) => value), expectedStatuses);
  assert.match(body, /生成是从当前权威确定性重建派生产物/u);
  assert.match(body, /验证是按合同比较两个独立事实并只报告差异/u);
  assert.match(body, /观测是读取并保留实际状态，不把它反写成期望状态/u);
  assertOrderedText(body, ['内容漂移', '结构漂移', '决策漂移', '运行漂移'], 'drift types');
  assertOrderedText(body, expectedSteps.map((step) => `**${step}：**`), 'closure steps');
  assert.match(body, /禁止手工修补派生产物/u);
  assert.match(body, /同步不是双向复制；每项事实先指定一个当前权威。/u);
  assert.match(body, /生成关系重建派生产物，验证关系只报告合同差异，观测关系保留实际状态。/u);
  assert.match(body, /检测器不可用时状态是“未知”，不是“无漂移”或 PASS。/u);
  assert.match(body, /派生产物必须由权威重新生成，不能手工修补。/u);
  assert.match(body, /ADR 记录决定与状态，但不证明实现遵循决定。/u);
  assert.match(body, /部署成功只证明指定提交完成指定发布流程，不证明全部运行健康。/u);
  assert.match(body, /说明性场景/u);
  for (const step of expectedExerciseSteps) assert.match(body, new RegExp(step.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
}

test('renders exact authority and drift ledgers with the complete method vocabulary', () => {
  assertMethodContract(requiredDocument().body);
});

test('uses the fixed diagram path and accessible keyboard-scroll wrappers', async () => {
  const body = requiredDocument().body;
  const expectedRegions = [
    ['table-wrapper table-wrapper--mapping', '模型同步权威事实台账，可横向滚动'],
    ['table-wrapper table-wrapper--mapping', '四类漂移处置台账，可横向滚动'],
    ['architecture-diagram-scroll', '模型同步权威、检测、漂移处置与发布闭环图，可横向滚动'],
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
    ['renamed drift type', body.replace('决策漂移', '决定偏差')],
    ['unknown changed to PASS', body.replaceAll('未知', 'PASS')],
    ['manual patch prohibition removed', body.replace('禁止手工修补派生产物', '可以直接修改派生产物')],
    ['ADR falsely proves implementation', body.replace('ADR 记录决定与状态，但不证明实现遵循决定。', 'ADR 记录决定与状态，并证明实现遵循决定。')],
    ['deployment falsely proves runtime health', body.replace('部署成功只证明指定提交完成指定发布流程，不证明全部运行健康。', '部署成功证明全部运行健康。')],
    ['scenario label removed', body.replaceAll('说明性场景', '示例')],
  ];

  for (const [label, mutation] of mutations) {
    assert.notEqual(mutation, body, `${label} must change the fixture`);
    assert.throws(() => assertMethodContract(mutation), assert.AssertionError, label);
  }
});
