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
  adjacent_topics: ['MOD-11', 'QA-02', 'QA-05'],
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
  {'审阅门': '身份与范围', '检查项': '范围', '必须回答的问题': '抽象层级、场景、环境、受众和非目标是什么', '所需证据': '模型类型、scope 声明、场景与环境记录', '失败信号': 'Context、Container、数据库和外部系统混在未说明层级', '明确不证明': '范围声明不批准边界或实现'},
  {'审阅门': '身份与范围', '检查项': '版本', '必须回答的问题': '这是 as-is、to-be 还是教学假设，事实截止和维护责任是什么', '所需证据': '修订号、日期、状态与责任类型', '失败信号': '没有状态、修订号、日期或责任类型', '明确不证明': '版本块不证明与代码、部署或运行一致'},
  {'审阅门': '表示与边界', '检查项': '图例', '必须回答的问题': '元素、线型、箭头、颜色、边框、缩写和尺寸分别表示什么', '所需证据': '图例与可独立复述的符号说明', '失败信号': '符号只能靠作者口头解释', '明确不证明': '图例完整不允许混用抽象层级'},
  {'审阅门': '表示与边界', '检查项': '边界', '必须回答的问题': '系统内外、外部参与者和当前抽象层级如何分开', '所需证据': 'MOD-02 权威系统边界与元素类型', '失败信号': '银行支付服务位于费用申报系统内部', '明确不证明': '系统边界不等于信任、部署、网络或组织边界'},
  {'审阅门': '运行与交换', '检查项': '数据', '必须回答的问题': '交换什么业务事实，方向、权威和消费责任是什么', '所需证据': '接口、数据、业务权威或可核验案例', '失败信号': '只有“使用”或无标签箭头', '明确不证明': '数据关系不等于所有权、一致性、事务或顺序'},
  {'审阅门': '运行与交换', '检查项': '协议', '必须回答的问题': '哪些协议、通道或同步异步语义已有证据', '所需证据': '接口契约、配置、运行或部署事实', '失败信号': '“同步/事件？”既暗示实现又没有依据', '明确不证明': '协议标签不证明实现、兼容性或运行健康'},
  {'审阅门': '风险与隔离', '检查项': '信任域', '必须回答的问题': '哪些跨界数据和候选信任边界需要安全证据', '所需证据': '身份、权限、数据分类、威胁和安全控制', '失败信号': '员工、本地系统和银行没有任何信任说明', '明确不证明': '系统或网络边界不自动成为信任边界'},
  {'审阅门': '风险与隔离', '检查项': '失败域', '必须回答的问题': '外部依赖、故障传播和候选失败边界在哪里', '所需证据': '部署、依赖、故障、恢复与演练记录', '失败信号': '本地执行器和银行被画成一个已隔离失败域', '明确不证明': '外部系统不自动证明故障隔离或切换'},
];

const expectedFindingRows = [
  {'检查项': '标题', '严重度': '重要', '图中证据': '标题只有“费用平台架构图”', '风险': '评审者不知道图类型和问题', '修复建议': '写明费用申报系统 Container 图和费用提交与支付协作问题', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
  {'检查项': '范围', '严重度': '阻断', '图中证据': '系统、Container、数据库和外部系统处于同一未说明层级', '风险': '把不同观察单位当成可直接比较的结构', '修复建议': '固定为 Container 图并声明 as-is 教学范围与非目标', '责任类型': '系统边界维护者', '复查状态': '已关闭'},
  {'检查项': '图例', '严重度': '重要', '图中证据': '元素类型、边框和线型没有说明', '风险': '图只能由作者口头解释', '修复建议': '增加 Person、Container、Data Store、External System 和边界图例', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
  {'检查项': '边界', '严重度': '阻断', '图中证据': '银行支付服务位于费用申报系统边界内', '风险': '错误分配系统责任和外部依赖', '修复建议': '恢复 MOD-02 权威系统边界并把银行移到边界外', '责任类型': '系统边界维护者', '复查状态': '已关闭'},
  {'检查项': '数据', '严重度': '阻断', '图中证据': '重要箭头没有业务事实、方向或权威说明', '风险': '无法判断数据责任和跨界含义', '修复建议': '写明提交申报、读写、支付任务、支付请求与外部结果证据', '责任类型': '接口契约责任人', '复查状态': '已关闭'},
  {'检查项': '协议', '严重度': '待澄清', '图中证据': '连线写成“同步/事件？”', '风险': '把猜测当成实现承诺', '修复建议': '删除猜测并统一标记“协议：待确认”', '责任类型': '接口契约责任人', '复查状态': '保留待澄清'},
  {'检查项': '信任域', '严重度': '阻断', '图中证据': '员工、费用申报系统和银行之间没有信任说明', '风险': '跨界数据与身份检查被隐藏', '修复建议': '标出候选信任边界并回链 QA-05 所需证据', '责任类型': '安全责任人', '复查状态': '保留待澄清'},
  {'检查项': '失败域', '严重度': '阻断', '图中证据': '支付任务执行器与银行被画成同一失败域', '风险': '误判故障隔离、传播和恢复责任', '修复建议': '只标外部依赖与候选失败边界，内部隔离继续待证', '责任类型': '可靠性责任人', '复查状态': '保留待澄清'},
  {'检查项': '版本', '严重度': '重要', '图中证据': '没有状态、修订号、日期和维护责任类型', '风险': '无法判断图适用时间和复查责任', '修复建议': '增加 as-is teaching exercise、rev 1、2026-08-05 和责任类型', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
];

const nonProofSentences = [
  '标题完整不等于图中事实正确。',
  '图例完整不等于所有抽象层级可以混用。',
  '系统边界不等于信任边界、网络边界、部署边界或组织边界。',
  '数据关系不等于数据所有权、一致性、事务或运行顺序。',
  '协议标签不证明实现、配置、兼容性或运行健康。',
  'Container、Context、数据库或团队不存在自动一一映射。',
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
  '![恢复 MOD-02 系统边界并明确未知协议、候选信任边界和候选失败边界的费用申报系统 Container 图](/img/diagrams/mod-12-architecture-review-corrected.svg)',
];

const requiredLinks = [
  '/modeling', '/modeling/mod-01', '/modeling/mod-02', '/modeling/mod-03',
  '/modeling/mod-04', '/modeling/mod-11', '/quality-attributes/qa-02',
  '/quality-attributes/qa-05', '/cases/microsoft-multi-agent-reference-architecture',
];

const expectedSources = [
  {
    attribution: 'C4 Model：Software Architecture Diagram Review Checklist',
    url: 'https://c4model.com/diagrams/checklist',
    support: '支持标题、图类型、范围、图例、元素名称、类型、职责、关系方向、标签和适用时协议等通用检查',
    nonProof: '不提供或认可本站四道门、九行方法、示例、措辞或布局',
  },
  {
    attribution: 'C4 Model：Notation',
    url: 'https://c4model.com/diagrams/notation',
    support: '支持自描述表示法、标题、范围、图例、元素类型与职责、方向和关系标签',
    nonProof: '不证明本练习图正确或可读',
  },
  {
    attribution: 'arc42：Context and Scope',
    url: 'https://docs.arc42.org/section-3/',
    support: '支持区分系统与通信伙伴、业务输入输出、技术通道或协议，以及业务与技术上下文',
    nonProof: '不提供本站审阅矩阵或演练',
  },
  {
    attribution: 'OWASP Threat Modeling Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html',
    support: '支持建模数据流与信任边界，并持续更新和复查模型',
    nonProof: '不把 MOD-12 变成完整威胁建模流程，也不支持失败域或版本结论',
  },
];

function sourceBullet({attribution, url, support, nonProof}) {
  return `- [${attribution}](${url})（facts-summary）：${support}；${nonProof}。`;
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
  for (const sentence of nonProofSentences) {
    assert.match(body, new RegExp(`(?:^|\\n)${sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\n|$)`, 'u'));
  }
  assert.deepEqual([...body.matchAll(/^([1-7])\. (.+)$/gmu)].map((match) => match[2]), expectedExerciseSteps);
  const links = extractInternalLinks({body});
  for (const target of requiredLinks) assert.ok(links.includes(target), `missing visible link: ${target}`);
  assert.match(body, /MOD-13/u);
  assert.ok(!links.includes('/modeling/mod-13'));
  assert.doesNotMatch(body, /\[[^\]]*MOD-13[^\]]*\]\([^)]*\)/u);
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

test('rejects controlled MOD-12 mutations', () => {
  const {body, source} = requiredDocument();
  const mutations = [];
  for (const heading of expectedHeadings) mutations.push([`H2 ${heading}`, source.replace(`## ${heading}\n`, ''), assertPublicationContract]);
  for (const gate of expectedGateChecks.keys()) mutations.push([`gate ${gate}`, body.replaceAll(`| ${gate} |`, '| 已变更 |'), assertTableContracts]);
  for (const row of expectedGateRows) mutations.push([`check ${row['检查项']}`, body.replace(`| ${row['审阅门']} | ${row['检查项']} |`, `| ${row['审阅门']} | 已变更 |`), assertTableContracts]);
  for (const row of expectedFindingRows) {
    mutations.push([`finding ${row['检查项']}`, body.replace(`| ${row['检查项']} | ${row['严重度']} | ${row['图中证据']} |`, `| ${row['检查项']} | ${row['严重度']} | 已变更 |`), assertTableContracts]);
    mutations.push([`severity ${row['检查项']}`, body.replace(`| ${row['检查项']} | ${row['严重度']} |`, `| ${row['检查项']} | 已变更 |`), assertTableContracts]);
  }
  for (const label of expectedWrapperLabels) {
    const wrapperClass = label.includes('架构图九项审阅矩阵') || label.includes('发现台账')
      ? 'table-wrapper table-wrapper--mapping'
      : 'architecture-diagram-scroll';
    mutations.push([`wrapper class ${label}`, body.replace(`  className="${wrapperClass}"\n  role="region"\n  aria-label="${label}"`, `  className="changed"\n  role="region"\n  aria-label="${label}"`), assertInteractionContract]);
    mutations.push([`wrapper role ${label}`, body.replace(`  role="region"\n  aria-label="${label}"`, `  role="group"\n  aria-label="${label}"`), assertInteractionContract]);
    mutations.push([`wrapper label ${label}`, body.replace(`  aria-label="${label}"`, '  aria-label="已变更"'), assertInteractionContract]);
    mutations.push([`wrapper tabindex ${label}`, body.replace(`  aria-label="${label}"\n  tabIndex={0}`, `  aria-label="${label}"\n  tabIndex={-1}`), assertInteractionContract]);
    mutations.push([`wrapper handler ${label}`, body.replace(`  aria-label="${label}"\n  tabIndex={0}\n  onKeyDown={handleHorizontalArrowKey}`, `  aria-label="${label}"\n  tabIndex={0}`), assertInteractionContract]);
  }
  for (const sentence of nonProofSentences) mutations.push([`non-proof ${sentence}`, body.replace(sentence, '已变更。'), assertMethodContract]);
  for (const step of expectedExerciseSteps) mutations.push([`exercise ${step}`, body.replace(step, '已变更。'), assertMethodContract]);
  for (const link of requiredLinks) mutations.push([`relation ${link}`, body.replace(`(${link})`, '(#已变更)'), assertMethodContract]);
  for (const sourceRecord of expectedSources) {
    const bullet = sourceBullet(sourceRecord);
    mutations.push([`source URL ${sourceRecord.url}`, body.replace(sourceRecord.url, 'https://example.invalid/changed'), assertMethodContract]);
    mutations.push([`source attribution ${sourceRecord.url}`, body.replace(bullet, sourceBullet({...sourceRecord, attribution: `${sourceRecord.attribution} 已变更`})), assertMethodContract]);
    mutations.push([`source facts-summary placement ${sourceRecord.url}`, body.replace(bullet, bullet.replace('（facts-summary）：', '：facts-summary；')), assertMethodContract]);
    mutations.push([`source support boundary ${sourceRecord.url}`, body.replace(bullet, sourceBullet({...sourceRecord, support: '支持范围已变更'})), assertMethodContract]);
    mutations.push([`source non-proof boundary ${sourceRecord.url}`, body.replace(bullet, sourceBullet({...sourceRecord, nonProof: '不证明边界已变更'})), assertMethodContract]);
  }
  mutations.push(['problem image suffix', body.replace('mod-12-architecture-review-problem.svg)', 'mod-12-architecture-review-problem.svg.bak)'), assertInteractionContract]);
  mutations.push(['corrected image suffix', body.replace('mod-12-architecture-review-corrected.svg)', 'mod-12-architecture-review-corrected.svg.bak)'), assertInteractionContract]);
  mutations.push(['forbidden MOD-13 href', `${body}\n\n[下一篇](/modeling/mod-13)\n`, assertMethodContract]);
  mutations.push(['forbidden neutral MOD-13 href', `${body}\n\n[下一篇模型](/modeling/mod-13)\n`, assertMethodContract]);
  for (const [label, mutation, contract] of mutations) assert.throws(() => contract(mutation), {name: 'AssertionError'}, label);
});
