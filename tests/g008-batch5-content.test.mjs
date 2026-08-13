import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';
import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const modelingHeadings = [
  '学习问题',
  '建模目标与输入',
  '参与者与步骤',
  '模型产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];
const documents = await readContentDocuments(contentRoot);
const ledger = JSON.parse(
  await readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8'),
);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);

function requiredDocument(id) {
  const document = byId.get(id);
  assert.ok(document, `${id} must be published`);
  return document;
}

function section(body, heading) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `missing ## ${heading}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start === -1 ? end : start + 1, end);
}

function markdownTables(body) {
  const lines = body.split('\n');
  const tables = [];
  let current = [];
  for (const line of lines) {
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

function fencedBlock(body, language) {
  const matches = [...body.matchAll(
    new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'gu'),
  )];
  assert.equal(matches.length, 1, `expected exactly one ${language} block`);
  return matches[0][1];
}

function boldField(body, label) {
  const matches = [...body.matchAll(
    new RegExp(`^\\*\\*${label}：\\*\\* (.+)$`, 'gmu'),
  )];
  assert.equal(matches.length, 1, `expected exactly one ${label} field`);
  return matches[0][1];
}

function assertQuestionDrivenWorkflow(body) {
  const steps = section(body, '参与者与步骤')
    .split('\n')
    .flatMap((line) => line.match(/^\d+\. (.+)$/u)?.slice(1) ?? []);
  assert.deepEqual(steps, expectedWorkflow);
}

function assertSelectionDecisionRule(body) {
  const artifacts = section(body, '模型产物');
  assert.ok(
    artifacts.includes(expectedSelectionDecisionRule),
    'selection decision rule must remain exact',
  );
}

function reviewRecords(body) {
  const exercise = section(body, '完整演练');
  const headings = findMarkdownHeadings(exercise).filter(({level}) => level === 3);
  return headings.map((heading, index) => {
    const start = exercise.indexOf('\n', heading.offset);
    const end = headings[index + 1]?.offset ?? exercise.length;
    const record = exercise.slice(start === -1 ? end : start + 1, end);
    const diagram = heading.text.match(
      /^(用例|时序图|状态|类|部署)：/u,
    )?.[1];
    assert.ok(diagram, `unexpected review heading: ${heading.text}`);
    return {
      heading: heading.text,
      question: boldField(record, '评审问题'),
      diagram,
      requiredInput: boldField(record, '输入事实'),
      proves: boldField(record, '预期判断'),
      doesNotProve: boldField(record, '证据缺口'),
    };
  });
}

function assertReviewRecords(body) {
  assert.deepEqual(reviewRecords(body), expectedReviewRecords);
}

function assertEvidenceTable(body) {
  const tables = markdownTables(body);
  assert.equal(tables.length, 1, 'MOD-07 must contain exactly one Markdown table');
  assert.deepEqual(tables[0], [
    ['图', '观察对象', '主要证明', '明确不证明', '补充证据'],
    ['---', '---', '---', '---', '---'],
    ...expectedEvidenceRows,
  ]);
}

function assertOverflowWrappers(body) {
  const wrappers = [...body.matchAll(
    /^<div className="(?:diagram-wrapper|table-wrapper table-wrapper--mapping)"[^\n]*>$/gmu,
  )].map(([wrapper]) => wrapper);
  assert.deepEqual(wrappers, expectedOverflowWrappers);
}

const expectedWorkflow = [
  '把“画一张 UML 图”改写成一句可判断的评审问题。',
  '确定观察对象是参与者目标、单场景交互、对象生命周期、静态类型还是运行节点。',
  '选择最小而充分的图，不因工具熟悉度默认选择类。',
  '为图中每个关键元素写出事实来源、截止时间或显式假设。',
  '写出该图明确不能证明的内容，并列出补充证据。',
  '请未参与绘图的评审者复述预期判断和证据缺口。',
  '只有剩余问题需要不同观察对象时，才增加第二个模型。',
];

const expectedSelectionDecisionRule =
  '问题不清楚时返回澄清，而不是先画图。只有存在另一个仍未回答、且观察单元不同的评审问题时，才增加第二张图。';

const expectedOverflowWrappers = [
  '<div className="diagram-wrapper" role="region" aria-label="UML 选图决策流，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>',
  '<div className="table-wrapper table-wrapper--mapping" role="region" aria-label="五类 UML 图证据边界表，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>',
];

test('publishes MOD-07 with the approved metadata and scope', () => {
  const document = requiredDocument('MOD-07');
  assert.equal(document.file, 'modeling/mod-07-uml-diagram-selection-guide.mdx');
  assert.equal(document.metadata.slug, '/modeling/mod-07');
  assert.equal(document.metadata.content_type, 'modeling');
  assert.equal(document.metadata.status, 'reviewed');
  assert.equal(document.metadata.difficulty, 'intermediate');
  assert.equal(document.metadata.priority, 'P0');
  assert.equal(document.metadata.review_policy, 'quarterly-version-sensitive');
  assert.deepEqual(document.metadata.depends_on, ['MOD-01']);
  assert.deepEqual(document.metadata.adjacent_topics, ['MOD-01', 'MOD-03', 'MOD-06', 'MOD-08']);
  assert.deepEqual(document.metadata.related_cases, [
    '/cases/temporal-saga-durable-execution',
  ]);
  assert.deepEqual(
    document.headings.filter(({level}) => level === 2).map(({text}) => text),
    modelingHeadings,
  );
  assert.match(document.body, /MOD-02[^。\n]*权威/u);
  assert.match(document.body, /本站原创[^。\n]*教学/u);
  assert.match(
    document.body,
    /MOD-02[^。\n]*系统边界[^。\n]*员工名称；审批人和财务人员[^。\n]*本站原创[^。\n]*教学假设/u,
  );
});

test('follows the exact ordered seven-step question-driven workflow', () => {
  const body = requiredDocument('MOD-07').body;
  assertQuestionDrivenWorkflow(body);
});

test('clarifies first and adds a second diagram only for a remaining observation unit', () => {
  const body = requiredDocument('MOD-07').body;
  assertSelectionDecisionRule(body);
});

test('routes one review question to exactly five UML choices', () => {
  const body = requiredDocument('MOD-07').body;
  const graph = fencedBlock(body, 'mermaid');
  assert.match(graph, /^flowchart TD$/mu);
  const expected = [
    'Q["当前评审问题观察什么？"]',
    'U["参与者与目标<br/>用例"]',
    'S["单场景交互顺序<br/>时序图"]',
    'T["单对象生命周期<br/>状态"]',
    'C["静态类型与职责<br/>类"]',
    'D["节点与部署单元<br/>部署"]',
  ];
  for (const literal of expected) assert.ok(graph.includes(literal), literal);
  assert.equal([...graph.matchAll(/^  Q --> [USTCD]$/gmu)].length, 5);
  assert.doesNotMatch(graph, /MOD-08|超时|compensation/iu);
});

const expectedEvidenceRows = [
  ['用例', '参与者与目标', '参与者、目标、系统边界和外部交互范围', '操作顺序、内部组件、授权已经正确', '业务规则与授权测试'],
  ['时序图', '单场景交互顺序', '消息顺序、参与者、同步点、分支与异常路径', '性能时限、并发安全、所有状态都被覆盖', '追踪、负载与并发测试'],
  ['状态', '单对象生命周期', '状态、事件、守卫、转换和终态', '跨对象原子性、组件所有权、分布式一致性', '事务、故障与恢复测试'],
  ['类', '静态类型与职责', '类型、职责、关联、多重性和泛化', '运行时顺序、数据库模式、对象数量和生命周期事实', '代码、数据模型与运行检查'],
  ['部署', '节点与部署单元', '节点、执行环境、部署单元和通信路径', '实际库存、容量、故障切换和安全控制已经验证', '资产、容量、演练与安全证据'],
];

const expectedReviewRecords = [
  {
    heading: '用例：参与者与目标',
    question: '员工、审批人和财务人员分别为了什么目标使用费用申报系统？',
    diagram: '用例',
    requiredInput: '采用 MOD-02 的费用申报系统边界与员工名称；审批人和财务人员是本站原创的教学假设。把提交申报、作出审批决定和处理付款作为待核对目标。',
    proves: '选择用例，评审参与者、业务目标、系统边界与外部交互范围是否完整且用词一致。',
    doesNotProve: '角色是否有权执行操作、授权冲突如何处理以及业务规则是否落实，仍需权限策略、业务规则和授权测试证明。',
  },
  {
    heading: '时序图：审批到付款意图',
    question: '已提交申报如何经过审批并形成付款意图？',
    diagram: '时序图',
    requiredInput: '单个教学场景从已提交申报开始，审批人作出决定，系统在批准分支形成付款意图；一个必要的拒绝分支也应显式出现。',
    proves: '选择时序图，评审场景参与者、消息相对顺序、同步点、批准分支和拒绝分支是否支持这一次交互说明。',
    doesNotProve: '延迟目标、并发提交、消息重试（Retry）和事务边界仍需运行追踪、负载、并发与故障测试证明。',
  },
  {
    heading: '状态：申报生命周期',
    question: '一份申报允许经历哪些状态变化？',
    diagram: '状态',
    requiredInput: '以单份申报为观察单位，记录当前已知状态、触发事件、守卫、转换和终态；不把其他对象的变化合并进同一生命周期。',
    proves: '选择状态，评审申报能否从允许的事件和守卫到达合法状态，并识别不允许的转换。',
    doesNotProve: '跨对象原子性、故障恢复和分布式一致性仍需事务与运行证据；完整终态、超时、取消、补偿和人工终态不在本页展开。',
  },
  {
    heading: '类：静态职责',
    question: '申报、审批和付款意图的静态职责如何关联？',
    diagram: '类',
    requiredInput: '复用 MOD-06 的 `ExpenseClaim`、`Approval` 和 `PaymentInstruction` 概念名称，但只把它们当作候选类型及静态职责输入。',
    proves: '选择类，评审类型职责、关联、多重性和必要泛化是否足以表达静态协作结构；UML 类不是实体关系实体，也不是数据库表。',
    doesNotProve: '运行时创建数量、生命周期事实、持久化模式和具体代码归属仍需代码、数据模型与运行检查证明。',
  },
  {
    heading: '部署：指定环境中的运行位置',
    question: '费用申报网页应用、申报应用程序编程接口（Application Programming Interface，API）、支付任务执行器、申报数据库和银行支付服务在指定环境中如何部署？',
    diagram: '部署',
    requiredInput: '采用 MOD-02 的系统边界和银行支付服务权威名称，把指定环境、节点、执行环境、部署单元与通信路径作为待核对输入。',
    proves: '选择部署，评审各软件实例运行位置、节点边界和必要通信路径是否清晰，并与 MOD-03 的部署观察尺度保持一致。',
    doesNotProve: '实际资产库存、容量余量、故障切换结果、网络策略和安全控制仍需资产系统、容量数据、演练记录与安全证据证明。',
  },
];

test('locks every diagram proof and non-proof boundary', () => {
  assertEvidenceTable(requiredDocument('MOD-07').body);
});

test('uses five independent expense-claim review records without requiring five diagrams', () => {
  const body = requiredDocument('MOD-07').body;
  const exercise = section(body, '完整演练');
  assertReviewRecords(body);
  assert.match(exercise, /实际评审[^。\n]*最小子集/u);
  assert.match(exercise, /不是[^。\n]*必须维护五张图/u);
});

test('keeps both overflow regions keyboard accessible', () => {
  assertOverflowWrappers(requiredDocument('MOD-07').body);
});

test('rejects workflow, decision, record, table, and wrapper mutations', () => {
  const body = requiredDocument('MOD-07').body;

  for (const step of expectedWorkflow) {
    assert.throws(
      () => assertQuestionDrivenWorkflow(body.replace(step, `${step}（篡改）`)),
      {name: 'AssertionError'},
      step,
    );
  }
  for (const [literal, mutation] of [
    ['问题不清楚时返回澄清，而不是先画图。', '问题不清楚时直接画图。'],
    [
      '只有存在另一个仍未回答、且观察单元不同的评审问题时，才增加第二张图。',
      '每次评审都增加第二张图。',
    ],
  ]) {
    assert.throws(
      () => assertSelectionDecisionRule(body.replace(literal, mutation)),
      {name: 'AssertionError'},
      literal,
    );
  }
  for (const record of expectedReviewRecords) {
    for (const field of [
      'heading',
      'question',
      'requiredInput',
      'proves',
      'doesNotProve',
    ]) {
      assert.throws(
        () => assertReviewRecords(
          body.replace(record[field], `${record[field]}（篡改）`),
        ),
        {name: 'AssertionError'},
        `${record.diagram} ${field}`,
      );
    }
  }
  assert.throws(
    () => assertEvidenceTable(`${body}\n| 额外 | 表格 |\n| --- | --- |\n`),
    {name: 'AssertionError'},
    'extra Markdown table',
  );
  for (const [literal, mutation] of [
    ['className="table-wrapper table-wrapper--mapping"', 'className="table-wrapper"'],
    ['aria-label="五类 UML 图证据边界表，可横向滚动"', 'aria-label="UML 表"'],
    ['role="region"', 'role="group"'],
    ['tabIndex={0}', 'tabIndex={-1}'],
    ['onKeyDown={handleHorizontalArrowKey}', 'onKeyDown={() => {}}'],
  ]) {
    const tableWrapper = expectedOverflowWrappers[1];
    assert.throws(
      () => assertOverflowWrappers(body.replace(
        tableWrapper,
        tableWrapper.replace(literal, mutation),
      )),
      {name: 'AssertionError'},
      literal,
    );
  }
});

test('governs the four pinned MOD-07 sources and exposes their canonical locators', () => {
  const document = requiredDocument('MOD-07');
  const governed = ledger.documents['content/modeling/mod-07-uml-diagram-selection-guide.mdx'];
  const expectedSources = new Map([
    ['src-omg-uml-2-5-1-2017', 'https://www.omg.org/spec/UML/2.5.1'],
    ['src-c4model-dynamic-diagram', 'https://c4model.com/diagrams/dynamic'],
    ['src-c4model-deployment-diagram', 'https://c4model.com/diagrams/deployment'],
    ['src-larman-applying-uml-patterns-3e-2004', 'https://www.pearson.com/en-us/subject-catalog/p/Larman-Applying-UML-and-Patterns-An-Introduction-to-Object-Oriented-Analysis-and-Design-and-Iterative-Development-3rd-Edition/P200000000422/9780131489066'],
  ]);
  const visible = new Set(extractExternalLinks(document));

  assert.ok(governed, 'MOD-07 source review must exist');
  assert.equal(governed.reviewed_at, '2026-08-01');
  assert.deepEqual(governed.copyright_checks, [
    'original-structure',
    'quotation-boundary',
    'attribution-complete',
    'illustration-rights',
  ]);
  assert.deepEqual(governed.citations, [
    {source_id: 'src-omg-uml-2-5-1-2017', citation_url: 'https://www.omg.org/spec/UML/2.5.1', roles: ['definition', 'method'], manifest_primary: true, usage_mode: 'facts-summary', attribution_note: 'Unified Modeling Language 2.5.1, Object Management Group', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-c4model-dynamic-diagram', citation_url: 'https://c4model.com/diagrams/dynamic', roles: ['definition', 'method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'C4 Model — Dynamic diagram, Simon Brown', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-c4model-deployment-diagram', citation_url: 'https://c4model.com/diagrams/deployment', roles: ['definition', 'method'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'C4 Model — Deployment diagram, Simon Brown', modification_note: null, excerpt: null, quotation_reviewed: false},
    {source_id: 'src-larman-applying-uml-patterns-3e-2004', citation_url: 'https://www.pearson.com/en-us/subject-catalog/p/Larman-Applying-UML-and-Patterns-An-Introduction-to-Object-Oriented-Analysis-and-Design-and-Iterative-Development-3rd-Edition/P200000000422/9780131489066', roles: ['historical-context', 'learning'], manifest_primary: false, usage_mode: 'facts-summary', attribution_note: 'Applying UML and Patterns, 3rd edition, Craig Larman / Pearson', modification_note: null, excerpt: null, quotation_reviewed: false},
  ]);

  for (const [sourceId, locator] of expectedSources) {
    assert.equal(ledger.sources.find(({id}) => id === sourceId)?.canonical_locator, locator);
    assert.ok(visible.has(locator), locator);
  }
  const omg = ledger.sources.find(({id}) => id === 'src-omg-uml-2-5-1-2017');
  assert.equal(omg.source_kind, 'standard');
  assert.equal(omg.tier, 'primary');
  assert.equal(omg.version, 'UML 2.5.1, formal, December 2017; checked 2026-08-01');
  assert.equal(omg.license, 'LicenseRef-All-Rights-Reserved');
  assert.equal(omg.checked_at, '2026-08-01');
  assert.equal(governed.citations.filter(({manifest_primary}) => manifest_primary).length, 1);
});

test('connects MOD-07 reciprocally to its currently published adjacent topics', () => {
  const document = requiredDocument('MOD-07');
  const links = new Set(extractInternalLinks(document));
  for (const href of [
    '/modeling',
    '/modeling/mod-01',
    '/modeling/mod-03',
    '/modeling/mod-06',
    '/modeling/mod-08',
    '/cases/temporal-saga-durable-execution',
  ]) assert.ok(links.has(href), href);
  assert.doesNotMatch(document.body, /MOD-08[^。\n]*仍未发布/u);

  for (const id of ['MOD-01', 'MOD-03', 'MOD-06', 'MOD-08']) {
    const peer = requiredDocument(id);
    assert.ok(peer.metadata.adjacent_topics.includes('MOD-07'), `${id} adjacency`);
    assert.ok(extractInternalLinks(peer).includes('/modeling/mod-07'), `${id} visible link`);
  }
});

test('projects the current G009 counts after G008 closes', async () => {
  const [status, indexes] = await Promise.all([
    readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  assert.deepEqual(status, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 59,
    content_documents: 102,
    governed_sources: 529,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  const topicsById = new Map(
    Object.values(indexes).flat().map((topic) => [topic.id, topic]),
  );
  assert.equal(topicsById.get('MOD-07').published, true);
  assert.equal(topicsById.get('MOD-07').status.value, 'complete');
  assert.equal(topicsById.get('MOD-10').published, true);
  assert.equal(topicsById.get('MOD-10').status.value, 'complete');
  assert.equal(topicsById.get('MOD-11').published, true);
  assert.equal(topicsById.get('MOD-11').status.value, 'complete');
  assert.equal(topicsById.get('MOD-12').published, true);
  assert.equal(topicsById.get('MOD-12').status.value, 'complete');
  assert.equal(topicsById.get('MOD-13').published, true);
  assert.equal(topicsById.get('MOD-13').status.value, 'complete');
  assert.equal(topicsById.get('STY-00').published, true);
  assert.equal(topicsById.get('STY-00').status.value, 'complete');
  assert.equal(topicsById.get('STY-01').published, true);
  assert.equal(topicsById.get('STY-01').status.value, 'complete');
});
