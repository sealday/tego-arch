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
const document = documents.find(({file}) => file === 'modeling/mod-12-architecture-diagram-review.mdx');
const relatedDocuments = new Map(documents.map((entry) => [entry.file, entry]));
const sourceLedger = JSON.parse(await readFile(new URL('../data/source-ledger.json', import.meta.url)));
const sourceLinkHealth = JSON.parse(await readFile(new URL('../data/source-link-health.json', import.meta.url)));
const projectStatus = JSON.parse(await readFile(new URL('../src/generated/project-status.json', import.meta.url)));
const topicManifest = JSON.parse(await readFile(new URL('../src/generated/topic-manifest.json', import.meta.url)));
const topicRelations = JSON.parse(await readFile(new URL('../data/topic-relations.json', import.meta.url)));
const backlog = await readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8');

function currentNextTopic(source) {
  const baselines = source
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('- **当前发布基线：**'));
  assert.equal(baselines.length, 1, '待办 must contain one current release baseline');
  const liveSegment = baselines[0].split('。此前 ')[0];
  const nextTopics = [...liveSegment.matchAll(/下一项为 ([A-Z]+-\d+)/gu)];
  assert.equal(nextTopics.length, 1, 'live baseline must contain one next topic');
  return nextTopics[0][1];
}

const commonNodes = [
  ['employee', '员工', 'PERSON'],
  ['web', 'Web 应用', 'CONTAINER'],
  ['api', '申报 API', 'CONTAINER'],
  ['database', '申报数据库', 'DATA STORE'],
  ['payment-worker', '支付任务执行器', 'CONTAINER'],
  ['bank', '银行支付服务', 'EXTERNAL SYSTEM'],
];

const diagramPairs = [
  {
    slug: 'mod-12-architecture-review-problem',
    labels: [
      '费用平台架构图',
      '同步/事件？',
      '未经证实的共享失败域（证据缺失）',
      ...commonNodes.flatMap(([, name, type]) => [name, type]),
    ],
  },
  {
    slug: 'mod-12-architecture-review-corrected',
    labels: [
      '费用申报系统 Container 图',
      '费用提交与支付协作',
      'as-is teaching exercise',
      'rev 1',
      '事实截止 2026-08-05',
      '协议：待确认',
      '候选信任边界',
      '候选失败边界',
      '系统与 Container 团队归属：待确认',
      ...commonNodes.flatMap(([, name, type]) => [name, type]),
    ],
  },
];

const closureExplanation = '阻断的错误表示在被删除，或改为明确标注的候选/未知时即可关闭；这只关闭错误表示。认证、授权、部署、故障隔离、故障切换和恢复证据仍然未知，不得自行补全。';

const correctedLegendLabels = [
  '元素：Person｜Container｜Data Store｜External System',
  '边界：权威系统边界（实线）｜候选信任边界（长虚线）｜候选失败边界（短虚线）',
  '关系方向：实线箭头｜待确认/未知：证据缺失，不得推断',
];

function decodeXmlText(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function xmlAttributes(tag) {
  return new Map([...tag.matchAll(/([\w:-]+)=(['"])(.*?)\2/gu)]
    .map(([, name, , value]) => [name, decodeXmlText(value)]));
}

function hiddenPresentation(attributes, inherited = false) {
  const style = attributes.get('style') ?? '';
  return inherited
    || attributes.get('aria-hidden') === 'true'
    || attributes.get('display') === 'none'
    || ['hidden', 'collapse'].includes(attributes.get('visibility'))
    || attributes.get('opacity') === '0'
    || /(?:^|;)\s*display\s*:\s*none(?:;|$)/iu.test(style)
    || /(?:^|;)\s*visibility\s*:\s*(?:hidden|collapse)(?:;|$)/iu.test(style)
    || /(?:^|;)\s*opacity\s*:\s*0(?:;|$)/u.test(style);
}

function visibleDrawioLabels(drawio) {
  return [...drawio.matchAll(/<mxCell\b[^>]*>/gu)].flatMap(([tag]) => {
    const attributes = xmlAttributes(tag);
    const style = attributes.get('style') ?? '';
    if (attributes.get('visible') === '0' || /(?:^|;)\s*(?:opacity=0|visible=0)(?:;|$)/u.test(style)) return [];
    const value = attributes.get('value')?.trim();
    return value ? [value] : [];
  });
}

function visibleSvgTextLabels(svg) {
  const nonRendered = new Set(['defs', 'desc', 'metadata', 'symbol', 'title']);
  const stack = [];
  const labels = [];

  for (const [token] of svg.matchAll(/<[^>]+>|[^<]+/gu)) {
    if (!token.startsWith('<')) {
      const current = stack.at(-1);
      if (!current?.hidden) {
        const text = stack.findLast(({name}) => name === 'text');
        if (text) text.value += decodeXmlText(token);
      }
      continue;
    }
    if (/^<\//u.test(token)) {
      const closed = stack.pop();
      if (closed?.name === 'text' && !closed.hidden && closed.painted) {
        const label = closed.value.replace(/\s+/gu, ' ').trim();
        if (label) labels.push(label);
      }
      continue;
    }
    if (/^<(?:\?|!)/u.test(token)) continue;
    const name = token.match(/^<([\w:-]+)/u)?.[1] ?? '';
    const attributes = xmlAttributes(token);
    const parent = stack.at(-1);
    const style = attributes.get('style') ?? '';
    const fill = attributes.get('fill') ?? (/(?:^|;)\s*fill\s*:\s*([^;]+)/iu.exec(style)?.[1]?.trim() ?? 'black');
    const stroke = attributes.get('stroke') ?? (/(?:^|;)\s*stroke\s*:\s*([^;]+)/iu.exec(style)?.[1]?.trim() ?? 'none');
    const fillOpacity = attributes.get('fill-opacity') ?? (/(?:^|;)\s*fill-opacity\s*:\s*([^;]+)/iu.exec(style)?.[1]?.trim() ?? '1');
    const strokeOpacity = attributes.get('stroke-opacity') ?? (/(?:^|;)\s*stroke-opacity\s*:\s*([^;]+)/iu.exec(style)?.[1]?.trim() ?? '1');
    const painted = (fill !== 'none' && fillOpacity !== '0') || (stroke !== 'none' && strokeOpacity !== '0');
    stack.push({
      name,
      hidden: hiddenPresentation(attributes, parent?.hidden || nonRendered.has(name)),
      painted,
      value: '',
    });
    if (/\/>$/u.test(token)) stack.pop();
  }
  return labels;
}

const expectedMetadata = {
  title: '架构图审阅清单',
  slug: '/modeling/mod-12',
  content_type: 'modeling',
  status: 'reviewed',
  difficulty: 'intermediate',
  analyzed_at: '2026-08-05',
  source_cutoff: '2026-08-05',
  review_policy: 'quarterly-version-sensitive',
  confidence: 'high',
  domains: ['software-architecture'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['understandability', 'maintainability', 'reliability', 'security'],
  tags: ['架构图', '架构评审', 'C4', '威胁建模'],
  summary: '用四道审阅门检查标题、范围、图例、边界、数据、协议、信任域、失败域和版本，并用问题图、发现台账与修正图完成复查。',
  topic_id: 'MOD-12',
  priority: 'P1',
  depends_on: ['MOD-01', 'MOD-02', 'MOD-03'],
  adjacent_topics: ['MOD-11', 'QA-02', 'QA-05', 'MOD-13'],
  related_cases: ['/cases/microsoft-multi-agent-reference-architecture'],
  related_questions: [],
};

const expectedHeadings = [
  '学习问题',
  '审阅目标与输入',
  '四道审阅门',
  '核心产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];

const expectedGateChecks = new Map([
  ['身份与范围', ['标题', '范围', '版本']],
  ['表示与边界', ['图例', '边界']],
  ['运行与交换', ['数据', '协议']],
  ['风险与隔离', ['信任域', '失败域']],
]);

const expectedSeverities = new Map([
  ['标题', '重要'],
  ['范围', '阻断'],
  ['图例', '重要'],
  ['边界', '阻断'],
  ['数据', '阻断'],
  ['协议', '待澄清'],
  ['信任域', '阻断'],
  ['失败域', '阻断'],
  ['版本', '重要'],
]);

const expectedGateRows = [
  {'审阅门': '身份与范围', '检查项': '标题', '必须回答的问题': '图的类型、目标系统或主题，以及本图回答的主要问题是什么', '所需证据': '评审问题、目标受众、图类型与权威名称', '失败信号': '只有项目名或“架构图”', '明确不证明': '标题完整不等于图中事实正确'},
  {'审阅门': '身份与范围', '检查项': '范围', '必须回答的问题': '抽象层级、场景、环境、受众和非目标是什么', '所需证据': '模型类型、范围声明、场景与环境记录', '失败信号': '上下文、容器、数据库和外部系统混在未说明层级', '明确不证明': '范围声明不批准边界或实现'},
  {'审阅门': '身份与范围', '检查项': '版本', '必须回答的问题': '这是现状、目标状态还是教学假设，事实截止和维护责任是什么', '所需证据': '修订号、日期、状态与责任类型', '失败信号': '没有状态、修订号、日期或责任类型', '明确不证明': '版本块不证明与代码、部署或运行一致'},
  {'审阅门': '表示与边界', '检查项': '图例', '必须回答的问题': '元素、线型、箭头、颜色、边框、缩写和尺寸分别表示什么', '所需证据': '图例与可独立复述的符号说明', '失败信号': '符号只能靠作者口头解释', '明确不证明': '图例完整不允许混用抽象层级'},
  {'审阅门': '表示与边界', '检查项': '边界', '必须回答的问题': '系统内外、外部参与者和当前抽象层级如何分开', '所需证据': 'MOD-02 权威系统边界与元素类型', '失败信号': '银行支付服务位于费用申报系统内部', '明确不证明': '系统边界不等于信任、部署、网络或组织边界'},
  {'审阅门': '运行与交换', '检查项': '数据', '必须回答的问题': '交换什么业务事实，方向、权威和消费责任是什么', '所需证据': '接口、数据、业务权威或可核验案例', '失败信号': '只有“使用”或无标签箭头', '明确不证明': '数据关系不等于所有权、一致性、事务或顺序'},
  {'审阅门': '运行与交换', '检查项': '协议', '必须回答的问题': '哪些协议、通道或同步异步语义已有证据', '所需证据': '接口契约、配置、运行或部署事实', '失败信号': '“同步/事件？”既暗示实现又没有依据', '明确不证明': '协议标签不证明实现、兼容性或运行健康'},
  {'审阅门': '风险与隔离', '检查项': '信任域', '必须回答的问题': '哪些跨界数据和候选信任边界需要安全证据', '所需证据': '身份、权限、数据分类、威胁和安全控制', '失败信号': '员工、本地系统和银行没有任何信任说明', '明确不证明': '系统或网络边界不自动成为信任边界'},
  {'审阅门': '风险与隔离', '检查项': '失败域', '必须回答的问题': '外部依赖、故障传播和候选失败边界在哪里', '所需证据': '部署、依赖、故障、恢复与演练记录', '失败信号': '本地执行器和银行被画成一个已隔离失败域', '明确不证明': '外部系统不自动证明故障隔离或切换'},
];

const expectedFindingRows = [
  {'检查项': '标题', '严重度': '重要', '图中证据': '标题只有“费用平台架构图”', '风险': '评审者不知道图类型和问题', '修复建议': '写明费用申报系统容器图和费用提交与支付协作问题', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
  {'检查项': '范围', '严重度': '阻断', '图中证据': '系统、容器、数据库和外部系统处于同一未说明层级', '风险': '把不同观察单位当成可直接比较的结构', '修复建议': '固定为容器图并声明现状教学范围与非目标', '责任类型': '系统边界维护者', '复查状态': '已关闭'},
  {'检查项': '图例', '严重度': '重要', '图中证据': '元素类型、边框和线型没有说明', '风险': '图只能由作者口头解释', '修复建议': '增加人员、容器、数据存储、外部系统和边界图例', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
  {'检查项': '边界', '严重度': '阻断', '图中证据': '银行支付服务位于费用申报系统边界内', '风险': '错误分配系统责任和外部依赖', '修复建议': '恢复 MOD-02 权威系统边界并把银行移到边界外', '责任类型': '系统边界维护者', '复查状态': '已关闭'},
  {'检查项': '数据', '严重度': '阻断', '图中证据': '重要箭头没有业务事实、方向或权威说明', '风险': '无法判断数据责任和跨界含义', '修复建议': '写明提交申报、读写、支付任务、支付请求与外部结果证据', '责任类型': '接口契约责任人', '复查状态': '已关闭'},
  {'检查项': '协议', '严重度': '待澄清', '图中证据': '连线写成“同步/事件？”', '风险': '把猜测当成实现承诺', '修复建议': '删除猜测并统一标记“协议：待确认”', '责任类型': '接口契约责任人', '复查状态': '保留待澄清'},
  {'检查项': '信任域', '严重度': '阻断', '图中证据': '员工、费用申报系统和银行之间没有信任说明', '风险': '跨界数据与身份检查被隐藏', '修复建议': '标出候选信任边界并回链 QA-05 所需证据', '责任类型': '安全责任人', '复查状态': '已关闭（证据仍待澄清）'},
  {'检查项': '失败域', '严重度': '阻断', '图中证据': '支付任务执行器与银行被画成同一失败域', '风险': '误判故障隔离、传播和恢复责任', '修复建议': '只标外部依赖与候选失败边界，内部隔离继续待证', '责任类型': '可靠性责任人', '复查状态': '已关闭（证据仍待澄清）'},
  {'检查项': '版本', '严重度': '重要', '图中证据': '没有状态、修订号、日期和维护责任类型', '风险': '无法判断图适用时间和复查责任', '修复建议': '增加现状教学练习、修订版 1、2026-08-05 和责任类型', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
];

const nonProofSentences = [
  '标题完整不等于图中事实正确。',
  '图例完整不等于所有抽象层级可以混用。',
  '系统边界不等于信任边界、网络边界、部署边界或组织边界。',
  '数据关系不等于数据所有权、一致性、事务或运行顺序。',
  '协议标签不证明实现、配置、兼容性或运行健康。',
  '容器、上下文、数据库或团队不存在自动一一映射。',
  '外部系统不自动构成独立失败域或完成故障隔离。',
  '版本块不证明图与当前代码、部署或运行状态一致。',
  '审阅清单不替代威胁建模、可靠性演练、代码检查、部署盘点或生产观测。',
];

const expectedExerciseSteps = [
  '只看问题图，用一句话复述它声称回答的问题，并记录无法复述的部分。',
  '执行身份与范围门，检查标题、范围和版本。',
  '执行表示与边界门，检查图例和系统内外边界。',
  '执行运行与交换门，检查数据事实、方向、权威和协议依据。',
  '执行风险与隔离门，检查信任域、失败域和未知项。',
  '将九条发现写入台账，分配严重度、责任类型和复查状态，再制作修正图。',
  '由未参与修图的人重新复述，逐项关闭、保留或退回发现，并确认没有引入新事实。',
];

const expectedWrapperLabels = [
  '架构图九项审阅矩阵，可横向滚动',
  '故意含缺陷的费用申报系统架构图，可横向滚动',
  '架构图审阅发现台账，可横向滚动',
  '修正后的费用申报系统架构图，可横向滚动',
];

const expectedImages = [
  '![故意混合层级、边界、数据、协议、信任域、失败域和版本信息的费用申报系统审阅练习图](/img/diagrams/mod-12-architecture-review-problem.svg)',
  '![恢复 MOD-02 系统边界并明确未知协议、候选信任边界和候选失败边界的费用申报系统容器图](/img/diagrams/mod-12-architecture-review-corrected.svg)',
];

const requiredLinks = [
  '/modeling', '/modeling/mod-01', '/modeling/mod-02', '/modeling/mod-03',
  '/modeling/mod-04', '/modeling/mod-11', '/quality-attributes/qa-02',
  '/quality-attributes/qa-05', '/modeling/mod-13', '/cases/microsoft-multi-agent-reference-architecture',
];

const expectedGovernedSources = new Map([
  ['src-c4model-review-checklist', 'https://c4model.com/diagrams/checklist'],
  ['src-c4model-notation', 'https://c4model.com/diagrams/notation'],
  ['src-arc42-context-scope-v9', 'https://docs.arc42.org/section-3/'],
  ['src-cheatsheetseries-ea079221bd09', 'https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html'],
]);

const expectedSources = [
  {
    attribution: 'C4 Model — Software architecture diagram review checklist',
    url: 'https://c4model.com/diagrams/checklist',
    support: '支持标题、图类型、范围、图例、元素名称、类型、职责、关系方向、标签和适用时协议等通用检查',
    nonProof: '不提供或认可本站四道门、九行方法、示例、措辞或布局',
  },
  {
    attribution: 'C4 Model — Notation',
    url: 'https://c4model.com/diagrams/notation',
    support: '支持自描述表示法、标题、范围、图例、元素类型与职责、方向和关系标签',
    nonProof: '不证明本练习图正确或可读',
  },
  {
    attribution: 'arc42 v9 — Context and Scope',
    url: 'https://docs.arc42.org/section-3/',
    support: '支持区分系统与通信伙伴、业务输入输出、技术通道或协议，以及业务与技术上下文',
    nonProof: '不提供本站审阅矩阵或演练',
  },
  {
    attribution: 'Threat Modeling Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html',
    support: '支持建模数据流与信任边界，并持续更新和复查模型',
    nonProof: '不把 MOD-12 变成完整威胁建模流程，也不支持失败域或版本结论',
  },
];

function sourceBullet({attribution, url, support, nonProof}) {
  return `- [${attribution}](${url})（\`facts-summary\`）：${support}；${nonProof}。`;
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
  assert.ok(document, 'modeling/mod-12-architecture-diagram-review.mdx must exist');
  return document;
}

function assertPublicationContract(source) {
  assert.deepEqual(parseFrontMatter(source), expectedMetadata);
  const body = source.slice(source.indexOf('---', 3) + 3);
  assert.deepEqual(findMarkdownHeadings(body).filter(({level}) => level === 2).map(({text}) => text), expectedHeadings);
  const learning = body.match(/## 学习问题\n\n([\s\S]*?)\n\n## 审阅目标与输入/u)?.[1] ?? '';
  assert.equal([...learning.matchAll(/^- /gmu)].length, 4, 'exactly four learning questions');
}

function assertTableContracts(body) {
  const tables = markdownTables(body);
  assert.equal(tables.length, 2, 'MOD-12 must contain exactly two Markdown tables');
  assert.deepEqual(tables[0], expectedGateRows);
  assert.deepEqual(tables[1], expectedFindingRows);
  const gates = new Map();
  for (const row of tables[0]) gates.set(row['审阅门'], [...(gates.get(row['审阅门']) ?? []), row['检查项']]);
  assert.deepEqual(gates, expectedGateChecks);
  assert.deepEqual(new Map(tables[1].map((row) => [row['检查项'], row['严重度']])), expectedSeverities);
  const counts = Object.fromEntries([...expectedSeverities.values()].map((severity) => [severity, tables[1].filter((row) => row['严重度'] === severity).length]));
  assert.deepEqual(counts, {重要: 3, 阻断: 5, 待澄清: 1});
}

function wrappers(body) {
  const pattern = /<div\n  className="(architecture-diagram-scroll|table-wrapper table-wrapper--mapping)"\n  role="region"\n  aria-label="([^"]+)"\n  tabIndex=\{0\}\n  onKeyDown=\{handleHorizontalArrowKey\}\n>\n\n([\s\S]*?)\n\n<\/div>/gu;
  return [...body.matchAll(pattern)].map((match) => ({className: match[1], label: match[2], content: match[3]}));
}

function assertInteractionContract(body) {
  assert.match(body, /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u);
  assert.equal([...body.matchAll(/<div\b/gu)].length, 4);
  const regions = wrappers(body);
  assert.equal(regions.length, 4, 'all four wrappers must own keyboard scrolling');
  assert.deepEqual(regions.map(({label}) => label), expectedWrapperLabels);
  assert.deepEqual(regions.map(({className}) => className), [
    'table-wrapper table-wrapper--mapping', 'architecture-diagram-scroll',
    'table-wrapper table-wrapper--mapping', 'architecture-diagram-scroll',
  ]);
  assert.deepEqual(markdownTables(regions[0].content)[0], expectedGateRows);
  assert.equal(regions[1].content, expectedImages[0]);
  assert.deepEqual(markdownTables(regions[2].content)[0], expectedFindingRows);
  assert.equal(regions[3].content, expectedImages[1]);
}

function assertMethodContract(body) {
  assert.match(body, new RegExp(closureExplanation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'));
  for (const sentence of nonProofSentences) {
    assert.match(body, new RegExp(`(?:^|\\n)${sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\n|$)`, 'u'));
  }
  assert.deepEqual([...body.matchAll(/^([1-7])\. (.+)$/gmu)].map((match) => match[2]), expectedExerciseSteps);
  const links = extractInternalLinks({body});
  for (const target of requiredLinks) assert.ok(links.includes(target), `missing visible link: ${target}`);
  assert.match(body, /MOD-13/u);
  assert.ok(links.includes('/modeling/mod-13'));
  const sourceSection = body.match(/## 来源\n\n([\s\S]*)$/u)?.[1] ?? '';
  const sourceBullets = [...sourceSection.matchAll(/^- .+$/gmu)].map((match) => match[0]);
  assert.deepEqual(sourceBullets, expectedSources.map(sourceBullet));
  for (const {url} of expectedSources) assert.equal(body.split(url).length - 1, 1, `source URL must appear once: ${url}`);
  assert.match(body, /四道门、九项矩阵、严重度、问题图、修正图、两张表、七步演练和中文表述均为本站原创综合/u);
  assert.equal([...body.matchAll(/facts-summary/gu)].length, 4);
}

function scrollProbe({scrollWidth, clientWidth, scrollLeft = 0, nested = false, key = 'ArrowRight'}) {
  const region = {scrollWidth, clientWidth, scrollLeft};
  let prevented = false;
  return {
    region,
    event: {
      target: nested ? {} : region, currentTarget: region, key,
      altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
      preventDefault() { prevented = true; },
    },
    prevented: () => prevented,
  };
}

test('publishes exact MOD-12 metadata, headings and learning questions', () => {
  assertPublicationContract(requiredDocument().source);
});

test('locks all gate and finding rows with exact severities', () => {
  assertTableContracts(requiredDocument().body);
});

test('keeps all wrappers accessible and shared keyboard behavior correct', () => {
  assertInteractionContract(requiredDocument().body);
  const overflow = scrollProbe({scrollWidth: 200, clientWidth: 100});
  handleHorizontalArrowKey(overflow.event);
  assert.equal(overflow.region.scrollLeft, 40);
  assert.equal(overflow.prevented(), true);
  overflow.event.key = 'ArrowLeft';
  overflow.region.scrollLeft = 10;
  handleHorizontalArrowKey(overflow.event);
  assert.equal(overflow.region.scrollLeft, 0);
  const nested = scrollProbe({scrollWidth: 200, clientWidth: 100, nested: true});
  handleHorizontalArrowKey(nested.event);
  assert.equal(nested.region.scrollLeft, 0);
  const staticRegion = scrollProbe({scrollWidth: 100, clientWidth: 100});
  handleHorizontalArrowKey(staticRegion.event);
  assert.equal(staticRegion.region.scrollLeft, 0);
});

test('states method, non-proof rules, exercise, relations and source boundaries', () => {
  assertMethodContract(requiredDocument().body);
});

test('governs the four MOD-12 citations in visible source order', () => {
  const governed = sourceLedger.documents['content/modeling/mod-12-architecture-diagram-review.mdx'];
  assert.ok(governed);
  assert.deepEqual(
    governed.citations.map(({source_id, citation_url}) => [source_id, citation_url]),
    [...expectedGovernedSources],
  );
  assert.equal(governed.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
  assert.equal(governed.citations.find(({manifest_primary}) => manifest_primary)?.source_id, 'src-c4model-review-checklist');
  for (const citation of governed.citations) {
    assert.equal(citation.usage_mode, 'facts-summary');
    assert.equal(citation.modification_note, null);
    assert.equal(citation.excerpt, null);
    assert.equal(citation.quotation_reviewed, false);
  }
  const sourcesById = new Map(sourceLedger.sources.map((source) => [source.id, source]));
  for (const [id, canonicalUrl] of expectedGovernedSources) {
    assert.equal(sourcesById.get(id)?.canonical_locator, canonicalUrl, id);
  }
  const sourceSection = requiredDocument().body.match(/## 来源\n\n([\s\S]*)$/u)?.[1] ?? '';
  const visibleUrls = [...sourceSection.matchAll(/\]\((https:\/\/[^)]+)\)/gu)].map((match) => match[1]);
  assert.deepEqual(visibleUrls, [...expectedGovernedSources.values()]);
});

test('commits current stable-policy health for the two new transports', () => {
  const healthByTransport = new Map(sourceLinkHealth.results.map((result) => [result.transport_locator, result]));
  for (const transport of [
    'https://c4model.com/diagrams/checklist',
    'https://docs.arc42.org/section-3/',
  ]) {
    const health = healthByTransport.get(transport);
    assert.ok(health, transport);
    assert.equal(health.review_status, 'healthy', transport);
    assert.equal(health.last_attempt.outcome, 'healthy', transport);
    assert.equal(health.last_attempt.final_transport_locator, transport);
    assert.deepEqual(health.last_success, {
      at: health.last_attempt.at,
      outcome: 'healthy',
      final_transport_locator: transport,
      http_status: health.last_attempt.http_status,
      login_wall_detected: false,
    });
    assert.equal(health.attempt_history.at(-1).at, health.last_attempt.at);
  }
});

test('publishes exact reciprocal MOD-12 relations without an override', () => {
  assert.deepEqual(extractInternalLinks(requiredDocument()), requiredLinks.toSorted());
  assert.equal('MOD-12' in topicRelations, false);
  const reciprocal = [
    ['modeling/mod-11-ddd-context-map.mdx', ['MOD-05', 'MOD-08', 'MOD-12'], /\[MOD-12 架构图审阅清单\]\(\/modeling\/mod-12\)[^。\n]*候选上下文不是组件分解/u],
    ['quality-attributes/qa-02-reliability-availability-recoverability.mdx', ['QA-00', 'QA-01', 'QA-03', 'QA-08', 'MOD-08', 'MOD-12'], /\[架构图审阅清单\]\(\/modeling\/mod-12\)[^。\n]*视觉分离[^。\n]*不证明[^。\n]*故障隔离[^。\n]*传播限制[^。\n]*故障切换[^。\n]*恢复/u],
    ['quality-attributes/qa-05-security-privacy-trust.mdx', ['QA-07', 'QA-08', 'QA-09', 'MOD-12'], /\[架构图审阅清单\]\(\/modeling\/mod-12\)[^。\n]*系统[^。\n]*网络边界[^。\n]*不证明[^。\n]*信任边界[^。\n]*身份[^。\n]*权限[^。\n]*数据[^。\n]*威胁/u],
  ];
  for (const [file, adjacentTopics, backlink] of reciprocal) {
    const related = relatedDocuments.get(file);
    assert.deepEqual(parseFrontMatter(related.source).adjacent_topics, adjacentTopics, file);
    assert.match(related.body, backlink, file);
  }
  assert.match(requiredDocument().body, /\[MOD-04[^\]]*\]\(\/modeling\/mod-04\)[^。\n]*文档[^。\n]*版本/u);
  assert.equal(extractInternalLinks(requiredDocument()).length, 10);
  assert.match(requiredDocument().body, /\[MOD-13[^\]]*\]\(\/modeling\/mod-13\)/u);
});

test('locks the generated MOD-13 Stage B projection', () => {
  assert.deepEqual({
    completed_topics: projectStatus.completed_topics,
    content_documents: projectStatus.content_documents,
    governed_sources: projectStatus.governed_sources,
    durable_stories: {
      completed: projectStatus.durable_stories.completed,
      total: projectStatus.durable_stories.total,
    },
    current_goal: projectStatus.durable_stories.current,
    next_topic: currentNextTopic(backlog),
  }, {
    completed_topics: 56,
    content_documents: 99,
    governed_sources: 512,
    durable_stories: {completed: 8, total: 20},
    current_goal: 'G009',
    next_topic: 'STY-04',
  });
  const topicsById = new Map(topicManifest.topics.map((topic) => [topic.id, topic]));
  assert.equal(topicsById.get('MOD-12').published, true);
  assert.equal(topicsById.get('MOD-12').status.value, 'complete');
  assert.equal(topicsById.get('MOD-13').published, true);
  assert.equal(topicsById.get('MOD-13').status.value, 'complete');
  assert.equal(topicsById.get('STY-00').published, true);
  assert.equal(topicsById.get('STY-00').status.value, 'complete');
  assert.equal(topicsById.get('STY-01').published, true);
  assert.equal(topicsById.get('STY-01').status.value, 'complete');
  const staleNextTopic = backlog.replace('下一项为 STY-04', '下一项为 STY-03');
  assert.notEqual(staleNextTopic, backlog, 'next-topic mutation must change backlog');
  assert.throws(
    () => assert.equal(
      currentNextTopic(staleNextTopic),
      'STY-04',
    ),
    {name: 'AssertionError'},
  );
});

test('publishes synchronized accessible MOD-12 Draw.io and SVG pairs', async () => {
  for (const {slug, labels} of diagramPairs) {
    const [drawio, svg] = await Promise.all([
      readFile(fileURLToPath(new URL(`../diagrams/${slug}.drawio`, import.meta.url)), 'utf8'),
      readFile(fileURLToPath(new URL(`../static/img/diagrams/${slug}.svg`, import.meta.url)), 'utf8'),
    ]);

    assert.match(svg, /^<svg\b[^>]*\bviewBox="0 0 1200 840"/u, `${slug} must use the prescribed viewBox`);
    assert.doesNotMatch(svg.match(/^<svg\b[^>]*>/u)?.[0] ?? '', /\s(?:width|height)="/u, `${slug} root must stay responsive`);
    assert.match(svg, /^<svg\b[^>]*\brole="img"/u, `${slug} must expose an image role`);
    assert.match(svg, /<title\b[^>]*>[^<]+<\/title>/u, `${slug} must provide a title`);
    assert.match(svg, /<desc\b[^>]*>[^<]+<\/desc>/u, `${slug} must provide a description`);
    assert.match(svg, /^<svg\b[^>]*\bpreserveAspectRatio="xMidYMid meet"/u, `${slug} must preserve its aspect ratio`);
    assert.match(drawio, /<mxCell id="employee"[^>]*>[\s\S]*?<mxGeometry x="40" y="300" width="150" height="104" as="geometry"\/>[\s\S]*?<\/mxCell>/u, `${slug}.drawio must lock the repaired employee geometry`);
    assert.match(svg, /<g data-node-id="employee" data-node-bounds="40 300 150 104">/u, `${slug}.svg must lock the repaired employee geometry`);
    const drawioLabels = visibleDrawioLabels(drawio);
    const svgLabels = visibleSvgTextLabels(svg);

    for (const label of labels) {
      assert.ok(drawioLabels.some((value) => value.includes(label)), `${slug}.drawio missing visible label: ${label}`);
      assert.ok(svgLabels.some((value) => value.includes(label)), `${slug}.svg missing visible label: ${label}`);
    }

    if (slug.endsWith('problem')) {
      const assertProblemFailureDomain = (drawioValue, svgValue) => {
        assert.match(drawioValue, /id="problem-shared-failure-domain"[^>]*value="未经证实的共享失败域（证据缺失）"[^>]*style="[^"]*fontSize=23;[^"]*"[^>]*>[\s\S]*?<mxGeometry x="675" y="220" width="440" height="230" as="geometry"\/>/u);
        assert.match(svgValue, /\.risk-label\{font-size:23px[^}]*\}[\s\S]*?<g data-layout-id="problem-shared-failure-domain" data-layout-bounds="675 220 440 230">[\s\S]*?<text[^>]*>未经证实的共享失败域（证据缺失）<\/text>[\s\S]*?<\/g>/u);
        assert.ok(drawioValue.indexOf('id="problem-shared-failure-domain"') < drawioValue.indexOf('id="payment-worker"'), 'problem Draw.io enclosure must remain behind nodes');
        assert.ok(svgValue.indexOf('data-layout-id="problem-shared-failure-domain"') < svgValue.indexOf('data-node-id="payment-worker"'), 'problem SVG enclosure must remain behind nodes');
        assert.ok(drawioValue.indexOf('id="problem-shared-failure-domain"') < drawioValue.indexOf('id="edge-worker-bank"'), 'problem Draw.io enclosure must remain behind connectors');
        assert.ok(svgValue.indexOf('data-layout-id="problem-shared-failure-domain"') < svgValue.indexOf('data-edge-id="edge-worker-bank"'), 'problem SVG enclosure must remain behind connectors');
      };
      assertProblemFailureDomain(drawio, svg);
      for (const [label, drawioMutation, svgMutation] of [
        ['wording', drawio.replace('证据缺失', '证据已确认'), svg],
        ['Draw.io geometry', drawio.replace('x="675" y="220" width="440" height="230"', 'x="676" y="220" width="440" height="230"'), svg],
        ['SVG geometry', drawio, svg.replace('data-layout-bounds="675 220 440 230"', 'data-layout-bounds="676 220 440 230"')],
        ['SVG visible synchronization', drawio, svg.replace('>未经证实的共享失败域（证据缺失）</text>', '>已变更</text>')],
      ]) assert.throws(() => assertProblemFailureDomain(drawioMutation, svgMutation), {name: 'AssertionError'}, label);
      const hiddenDrawio = drawio.replace('id="employee" value="员工" style="', 'id="employee" value="员工" style="opacity=0;');
      const hiddenSvg = svg.replace('data-text-role="title">员工</text>', 'data-text-role="title" style="display:none">员工</text>');
      const hiddenAncestorSvg = svg.replace('<g data-node-id="employee"', '<g style="visibility:hidden" data-node-id="employee"');
      const descOnlySvg = svg.replace(/<text x="115" y="346"([^>]*)>员工<\/text>/u, '<desc>员工</desc>');
      assert.ok(!visibleDrawioLabels(hiddenDrawio).includes('员工'), 'hidden Draw.io employee label must not satisfy visibility');
      assert.ok(!visibleSvgTextLabels(hiddenSvg).includes('员工'), 'hidden SVG employee label must not satisfy visibility');
      assert.ok(!visibleSvgTextLabels(hiddenAncestorSvg).includes('员工'), 'ancestor-hidden SVG employee label must not satisfy visibility');
      assert.ok(!visibleSvgTextLabels(descOnlySvg).includes('员工'), 'desc-only SVG employee label must not satisfy visibility');
    } else {
      assert.match(drawio, /id="system-boundary"[^>]*style="(?![^"]*dashed=1)[^"]*"/u, 'corrected Draw.io system boundary must be solid');
      assert.match(svg, /data-boundary-id="system-boundary"[^>]*stroke-width="3"\/>/u, 'corrected SVG system boundary must be solid');
      assert.doesNotMatch(svg.match(/<path data-boundary-id="system-boundary"[^>]*>/u)?.[0] ?? '', /stroke-dasharray/u);
      assert.match(drawio, /id="trust-employee-line"[\s\S]*?<mxPoint x="215" y="190" as="sourcePoint"\/>[\s\S]*?<mxPoint x="215" y="440" as="targetPoint"\/>/u);
      assert.match(drawio, /id="trust-bank-line"[\s\S]*?<mxPoint x="940" y="190" as="sourcePoint"\/>[\s\S]*?<mxPoint x="940" y="465" as="targetPoint"\/>/u);
      const assertCorrectedLegend = (drawioValue, svgValue) => {
        const drawioLegend = drawioValue.match(/<mxCell id="legend"[\s\S]*?<mxCell id="legend-end"[^>]*\/>/u)?.[0] ?? '';
        const svgLegend = svgValue.match(/<g data-layout-id="legend"[^>]*>[\s\S]*?<\/g>/u)?.[0] ?? '';
        assert.match(drawioLegend, /<mxGeometry x="40" y="680" width="1120" height="120" as="geometry"\/>/u);
        assert.match(svgLegend, /data-layout-bounds="40 680 1120 120"/u);
        for (const label of correctedLegendLabels) {
          assert.ok(visibleDrawioLabels(drawioLegend).includes(label), `corrected Draw.io legend missing scoped label: ${label}`);
          assert.ok(visibleSvgTextLabels(svgLegend).includes(label), `corrected SVG legend missing scoped label: ${label}`);
        }
      };
      assertCorrectedLegend(drawio, svg);
      const drawioLegend = drawio.match(/<mxCell id="legend"[\s\S]*?<mxCell id="legend-end"[^>]*\/>/u)?.[0] ?? '';
      const svgLegend = svg.match(/<g data-layout-id="legend"[^>]*>[\s\S]*?<\/g>/u)?.[0] ?? '';
      const hiddenLegendSvg = svgLegend.replace('>元素：Person｜Container｜Data Store｜External System</text>', ' style="display:none">元素：Person｜Container｜Data Store｜External System</text>');
      const descOnlyLegendSvg = svgLegend.replace(/<text([^>]*)>元素：Person｜Container｜Data Store｜External System<\/text>/u, '<desc>元素：Person｜Container｜Data Store｜External System</desc>');
      const hiddenLegendDrawio = drawioLegend.replace('id="legend-elements" value="元素：Person｜Container｜Data Store｜External System" style="', 'id="legend-elements" value="元素：Person｜Container｜Data Store｜External System" style="opacity=0;');
      assert.ok(!visibleDrawioLabels(hiddenLegendDrawio).includes(correctedLegendLabels[0]), 'hidden corrected Draw.io legend inventory must not satisfy visibility');
      assert.ok(!visibleSvgTextLabels(hiddenLegendSvg).includes(correctedLegendLabels[0]), 'hidden corrected legend inventory must not satisfy visibility');
      assert.ok(!visibleSvgTextLabels(descOnlyLegendSvg).includes(correctedLegendLabels[0]), 'desc-only corrected legend inventory must not satisfy visibility');
      for (const label of correctedLegendLabels) {
        assert.throws(() => assertCorrectedLegend(drawio.replace(label, '已变更'), svg), {name: 'AssertionError'}, `Draw.io scoped legend mutation: ${label}`);
        assert.throws(() => assertCorrectedLegend(drawio, svg.replace(label, '已变更')), {name: 'AssertionError'}, `SVG scoped legend mutation: ${label}`);
      }
    }
  }
});

test('rejects controlled MOD-12 mutations', () => {
  const {body, source} = requiredDocument();
  const mutations = [];
  for (const heading of expectedHeadings) mutations.push([`H2 ${heading}`, source.replace(`## ${heading}\n`, ''), assertPublicationContract]);
  for (const gate of expectedGateChecks.keys()) mutations.push([`gate ${gate}`, body.replaceAll(`| ${gate} |`, '| 已变更 |'), assertTableContracts]);
  for (const row of expectedGateRows) mutations.push([`check ${row['检查项']}`, body.replace(`| ${row['审阅门']} | ${row['检查项']} |`, `| ${row['审阅门']} | 已变更 |`), assertTableContracts]);
  for (const row of expectedFindingRows) {
    mutations.push([`finding ${row['检查项']}`, body.replace(`| ${row['检查项']} | ${row['严重度']} | ${row['图中证据']} |`, `| ${row['检查项']} | ${row['严重度']} | 已变更 |`), assertTableContracts]);
    mutations.push([`severity ${row['检查项']}`, body.replace(`| ${row['检查项']} | ${row['严重度']} |`, `| ${row['检查项']} | 已变更 |`), assertTableContracts]);
    if (['信任域', '失败域'].includes(row['检查项'])) {
      mutations.push([`closure status ${row['检查项']}`, body.replace(`| ${row['责任类型']} | ${row['复查状态']}|`, `| ${row['责任类型']} | 保留待澄清|`), assertTableContracts]);
    }
  }
  for (const label of expectedWrapperLabels) {
    const wrapperClass = label.includes('架构图九项审阅矩阵') || label.includes('发现台账')
      ? 'table-wrapper table-wrapper--mapping'
      : 'architecture-diagram-scroll';
    mutations.push([`wrapper 类 ${label}`, body.replace(`  className="${wrapperClass}"\n  role="region"\n  aria-label="${label}"`, `  className="changed"\n  role="region"\n  aria-label="${label}"`), assertInteractionContract]);
    mutations.push([`wrapper role ${label}`, body.replace(`  role="region"\n  aria-label="${label}"`, `  role="group"\n  aria-label="${label}"`), assertInteractionContract]);
    mutations.push([`wrapper label ${label}`, body.replace(`  aria-label="${label}"`, '  aria-label="已变更"'), assertInteractionContract]);
    mutations.push([`wrapper tabindex ${label}`, body.replace(`  aria-label="${label}"\n  tabIndex={0}`, `  aria-label="${label}"\n  tabIndex={-1}`), assertInteractionContract]);
    mutations.push([`wrapper handler ${label}`, body.replace(`  aria-label="${label}"\n  tabIndex={0}\n  onKeyDown={handleHorizontalArrowKey}`, `  aria-label="${label}"\n  tabIndex={0}`), assertInteractionContract]);
  }
  for (const sentence of nonProofSentences) mutations.push([`non-proof ${sentence}`, body.replace(sentence, '已变更。'), assertMethodContract]);
  mutations.push(['closure explanation', body.replace(closureExplanation, '已变更。'), assertMethodContract]);
  for (const step of expectedExerciseSteps) mutations.push([`exercise ${step}`, body.replace(step, '已变更。'), assertMethodContract]);
  for (const link of requiredLinks) mutations.push([`relation ${link}`, body.replace(`(${link})`, '(#已变更)'), assertMethodContract]);
  for (const sourceRecord of expectedSources) {
    const bullet = sourceBullet(sourceRecord);
    mutations.push([`source URL ${sourceRecord.url}`, body.replace(sourceRecord.url, 'https://example.invalid/changed'), assertMethodContract]);
    mutations.push([`source attribution ${sourceRecord.url}`, body.replace(bullet, sourceBullet({...sourceRecord, attribution: `${sourceRecord.attribution} 已变更`})), assertMethodContract]);
    mutations.push([`source facts-summary placement ${sourceRecord.url}`, body.replace(bullet, bullet.replace('（`facts-summary`）：', '：facts-summary；')), assertMethodContract]);
    mutations.push([`source support boundary ${sourceRecord.url}`, body.replace(bullet, sourceBullet({...sourceRecord, support: '支持范围已变更'})), assertMethodContract]);
    mutations.push([`source non-proof boundary ${sourceRecord.url}`, body.replace(bullet, sourceBullet({...sourceRecord, nonProof: '不证明边界已变更'})), assertMethodContract]);
  }
  mutations.push(['problem image suffix', body.replace('mod-12-architecture-review-problem.svg)', 'mod-12-architecture-review-problem.svg.bak)'), assertInteractionContract]);
  mutations.push(['corrected image suffix', body.replace('mod-12-architecture-review-corrected.svg)', 'mod-12-architecture-review-corrected.svg.bak)'), assertInteractionContract]);
  mutations.push(['missing MOD-13 href', body.replace('(/modeling/mod-13)', '(#removed)'), assertMethodContract]);
  for (const [label, mutation, contract] of mutations) assert.throws(() => contract(mutation), {name: 'AssertionError'}, label);
});
