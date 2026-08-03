import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  parseFrontMatter,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const document = documents.find(
  ({file}) => file === 'modeling/mod-09-eventstorming.mdx',
);

const expectedHeadings = [
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

const expectedBigPictureRows = [
  {'领域事件': '费用已提交', '事件来源或权威记录': '费用申报记录', '关键转折候选': '否：仍处于申报准备阶段', '热点': '票据或政策信息可能不完整', '未知项': '由谁确认补件完成'},
  {'领域事件': '费用已审批', '事件来源或权威记录': '审批决定记录', '关键转折候选': '是：进入财务复核', '热点': '加签、越级与撤回规则存在分歧', '未知项': '审批撤回后哪些事实仍然有效'},
  {'领域事件': '财务复核已完成', '事件来源或权威记录': '财务复核记录', '关键转折候选': '是：费用具备支付条件', '热点': '财务政策与审批结论可能冲突', '未知项': '冲突时由哪条记录裁定'},
  {'领域事件': '支付已请求', '事件来源或权威记录': '费用申报系统的支付请求记录', '关键转折候选': '是：进入外部效果阶段', '热点': '重复请求、超时与幂等身份', '未知项': '银行支付服务是否已经接受请求'},
  {'领域事件': '支付结果已确认', '事件来源或权威记录': '银行支付服务回执与本地核对记录', '关键转折候选': '是：正常路径收束', '热点': '外部回执与费用申报的身份映射', '未知项': '该确认是否已经满足业务终态条件'},
  {'领域事件': '支付结果仍未知', '事件来源或权威记录': '超时记录与缺失回执证据', '关键转折候选': '是：进入异常恢复', '热点': '重试、取消与对账顺序', '未知项': '外部支付效果是否已经发生'},
  {'领域事件': '支付对账已完成', '事件来源或权威记录': '银行支付服务查询结果与对账记录', '关键转折候选': '是：重新获得权威结果', '热点': '回执、查询与本地记录可能冲突', '未知项': '冲突记录的更正由谁批准'},
  {'领域事件': '人工处理已登记', '事件来源或权威记录': '持久人工处理记录', '关键转折候选': '是：进入人工收敛路径', '热点': '处理 owner、证据和 disposition', '未知项': '谁有权限确认最终业务结论'},
];

const expectedProcessNodes = [
  {id: 'bank_payment_service', type: 'System', label: '银行支付服务'},
  {id: 'expense_system', type: 'System', label: '费用申报系统'},
  {id: 'finance_person', type: 'Person', label: '财务人员'},
  {id: 'manual_registered', type: 'Event', label: '人工处理已登记'},
  {id: 'payment_confirmed', type: 'Event', label: '支付结果已确认'},
  {id: 'payment_requested', type: 'Event', label: '支付已请求'},
  {id: 'payment_result_policy', type: 'Policy', label: '支付结果核对政策'},
  {id: 'payment_unknown', type: 'Event', label: '支付结果仍未知'},
  {id: 'pending_read_model', type: 'Read Model', label: '待支付费用'},
  {id: 'query_payment', type: 'Command', label: '查询支付结果'},
  {id: 'register_manual', type: 'Command', label: '登记人工处理'},
  {id: 'request_payment', type: 'Command', label: '请求支付'},
];

const expectedProcessEdges = [
  'bank_payment_service->payment_confirmed',
  'bank_payment_service->payment_unknown',
  'expense_system->manual_registered',
  'expense_system->payment_requested',
  'finance_person->pending_read_model',
  'payment_result_policy->query_payment',
  'payment_result_policy->register_manual',
  'payment_requested->payment_result_policy',
  'payment_unknown->payment_result_policy',
  'pending_read_model->request_payment',
  'query_payment->bank_payment_service',
  'register_manual->expense_system',
  'request_payment->expense_system',
].toSorted();

const expectedBoundaryRows = [
  {'观察到的信号': '审批与支付使用不同结果语言', '候选边界假设': '审批判断与支付执行可能属于不同业务边界', '替代解释': '它们也可能只是同一费用生命周期的不同阶段', '仍需的证据': '术语 owner、规则变更历史与跨阶段不变量', '当前处置': '交给 MOD-11'},
  {'观察到的信号': '银行支付服务具有独立契约与变更节奏', '候选边界假设': '外部支付集成需要明确的翻译与隔离边界', '替代解释': '它也可能只是技术适配器，而非新的业务边界', '仍需的证据': '契约所有权、版本策略、失败语义与变更记录', '当前处置': '下一轮验证'},
  {'观察到的信号': '费用申报记录与支付结果由不同权威记录裁定', '候选边界假设': '申报事实与支付结果可能需要分离的权威边界', '替代解释': '它们也可能是同一边界内的权威记录与投影视图', '仍需的证据': '数据 owner、更正规则、审计责任与一致性需求', '当前处置': '保留假设'},
  {'观察到的信号': '人工处理跨越财务判断与技术排障', '候选边界假设': '异常处理可能形成独立协作能力', '替代解释': '它也可能只是低频运营升级路径', '仍需的证据': '发生频率、稳定规则、持久 owner 与独立目标', '当前处置': '不作为边界证据'},
  {'观察到的信号': '审批政策与支付核对政策的变化节奏不同', '候选边界假设': '两类政策可能需要分别演进', '替代解释': '它们也可能由同一 owner 通过配置独立调整', '仍需的证据': '变更历史、发布耦合、规则 owner 与共同不变量', '当前处置': '下一轮验证'},
];

const nonProofSentences = [
  'pivotal event 不等于 Bounded Context。',
  'swimlane 不等于团队、系统或服务。',
  'hotspot 不等于 backlog item、服务或已批准决策。',
  'Person 不等于长期 owner。',
  '工作坊排列顺序不等于运行时调用顺序。',
  '一次 EventStorming 工作坊不能单独确认正式边界，候选关系仍须在 MOD-11 或等价架构活动中验证。',
];

function requiredDocument() {
  assert.ok(document, 'MOD-09 content document must exist');
  return document;
}

function assertPublicationContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'MOD-09');
  assert.equal(metadata.slug, '/modeling/mod-09');
  assert.equal(metadata.content_type, 'modeling');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.depends_on, ['MOD-01', 'MOD-02']);
  assert.deepEqual(metadata.adjacent_topics, ['MOD-05', 'MOD-08']);
  assert.deepEqual(metadata.related_cases, ['/cases/temporal-saga-durable-execution']);
  assert.deepEqual(metadata.related_questions, []);
  assert.deepEqual(
    findMarkdownHeadings(source).filter(({level}) => level === 2).map(({text}) => text),
    expectedHeadings,
  );
}

function markdownTables(body) {
  const tables = [];
  let current = [];
  for (const line of body.split('\n')) {
    if (/^\|.+\|$/u.test(line)) current.push(line.slice(1, -1).split('|').map((cell) => cell.trim()));
    else if (current.length > 0) {
      tables.push(current);
      current = [];
    }
  }
  if (current.length > 0) tables.push(current);
  return tables;
}

function records(table, expectedHeader) {
  const [header, separator, ...rows] = table;
  assert.deepEqual(header, expectedHeader);
  assert.deepEqual(separator, expectedHeader.map(() => '---'));
  return rows.map((row) => {
    assert.equal(row.length, header.length, 'table record column count');
    return Object.fromEntries(header.map((key, index) => [key, row[index]]));
  });
}

function assertTableContracts(body) {
  const tables = markdownTables(body);
  assert.equal(tables.length, 2, 'MOD-09 must contain exactly two Markdown tables');
  const bigPicture = records(tables[0], ['领域事件', '事件来源或权威记录', '关键转折候选', '热点', '未知项']);
  const boundaries = records(tables[1], ['观察到的信号', '候选边界假设', '替代解释', '仍需的证据', '当前处置']);
  assert.deepEqual(bigPicture, expectedBigPictureRows);
  assert.deepEqual(boundaries, expectedBoundaryRows);
  assert.deepEqual(bigPicture.map((row) => row['领域事件']), expectedBigPictureRows.map((row) => row['领域事件']));
  assert.deepEqual(boundaries.map((row) => row['观察到的信号']), expectedBoundaryRows.map((row) => row['观察到的信号']));
  const dispositions = new Set(['保留假设', '下一轮验证', '交给 MOD-11', '不作为边界证据']);
  for (const row of boundaries) {
    assert.ok(row['替代解释'], 'candidate boundary alternative must not be empty');
    assert.ok(row['仍需的证据'], 'candidate boundary evidence must not be empty');
    assert.ok(dispositions.has(row['当前处置']), `invalid disposition: ${row['当前处置']}`);
  }
}

function processDiagram(body) {
  const diagrams = [...body.matchAll(/```mermaid\n(flowchart LR[\s\S]*?)\n```/gu)].map((match) => match[1]);
  assert.equal(diagrams.length, 1, 'MOD-09 must contain exactly one flowchart LR diagram');
  return diagrams[0];
}

function assertProcessContract(body) {
  const lines = processDiagram(body).split('\n').slice(1).filter((line) => line.trim());
  const declarations = new Map();
  const edges = [];
  for (const line of lines) {
    const edge = line.match(/^\s*([a-z_]+)(?:\["([^"<]+)<br\/>[\s\S]*?"\])? --> ([a-z_]+)(?:\["([^"<]+)<br\/>[\s\S]*?"\])?\s*$/u);
    assert.ok(edge, `unsupported process diagram line: ${line.trim()}`);
    for (const [id, declaration] of [[edge[1], line.match(/^\s*[a-z_]+\["([^"<]+)<br\/>((?:(?!"\]).)+)"\]/u)], [edge[3], line.match(/-->\s*[a-z_]+\["([^"<]+)<br\/>((?:(?!"\]).)+)"\]\s*$/u)]]) {
      if (!declaration) continue;
      assert.ok(!declarations.has(id), `duplicate node declaration: ${id}`);
      declarations.set(id, {id, type: declaration[1], label: declaration[2]});
    }
    edges.push(`${edge[1]}->${edge[3]}`);
  }
  assert.equal(new Set(edges).size, edges.length, 'directed edges must be unique');
  for (const edge of edges) {
    for (const endpoint of edge.split('->')) assert.ok(declarations.has(endpoint), `undeclared endpoint: ${endpoint}`);
  }
  assert.deepEqual([...declarations.values()].toSorted((a, b) => a.id.localeCompare(b.id)), expectedProcessNodes);
  assert.deepEqual(edges.toSorted(), expectedProcessEdges);
}

function wrappers(body) {
  return [...body.matchAll(/<div\n  className="(?:diagram-wrapper|table-wrapper table-wrapper--mapping)"\n  role="region"\n  aria-label="([^"]+)"\n  tabIndex=\{0\}\n  onKeyDown=\{handleHorizontalArrowKey\}\n>/gu)];
}

function assertInteractionContract(body) {
  assert.match(body, /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u);
  const regions = wrappers(body);
  assert.equal(regions.length, 3, 'MOD-09 must have exactly three accessible overflow wrappers');
  assert.equal(new Set(regions.map((match) => match[1])).size, 3, 'wrapper aria-label values must be unique');
  assert.equal([...body.matchAll(/className="(?:diagram-wrapper|table-wrapper table-wrapper--mapping)"/gu)].length, 3, 'no unvalidated overflow wrappers');
}

function assertTerminologyAndNonProof(body) {
  assert.match(body, /Person/u);
  assert.doesNotMatch(body, /Actor/u);
  assert.doesNotMatch(body, /(?:Big Picture|Process Modelling|Software Design).{0,8}层级|层级.{0,8}(?:Big Picture|Process Modelling|Software Design)/u);
  for (const format of ['Big Picture', 'Process Modelling', 'Software Design']) assert.match(body, new RegExp(`${format}[^。\\n]{0,24}工作坊格式`, 'u'));
  for (const sentence of nonProofSentences) assert.ok(body.includes(sentence), sentence);
  const graphIndex = body.indexOf('```mermaid\nflowchart LR');
  assert.ok(graphIndex > -1);
  const before = body.slice(Math.max(0, graphIndex - 500), graphIndex);
  const after = body.slice(graphIndex, graphIndex + 1500);
  for (const term of ['运行时顺序', '同步或异步协议', '事务边界', '服务边界', '组织 owner']) {
    assert.ok(before.includes(term), `pre-diagram disclaimer: ${term}`);
    assert.ok(after.includes(term), `post-diagram disclaimer: ${term}`);
  }
}

function horizontalArrowEvent({clientWidth = 100, scrollWidth = 300} = {}) {
  const region = {clientWidth, scrollWidth, scrollLeft: 0};
  let defaultPrevented = false;
  return {event: {key: 'ArrowRight', currentTarget: region, target: region, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, preventDefault() { defaultPrevented = true; }}, region, wasDefaultPrevented: () => defaultPrevented};
}

test('publishes MOD-09 with the approved metadata and H2 sequence', () => {
  const content = requiredDocument();
  assertPublicationContract(content.source);
});

test('locks both complete workshop tables', () => {
  assertTableContracts(requiredDocument().body);
});

test('locks the typed Process Model graph', () => {
  assertProcessContract(requiredDocument().body);
});

test('keeps the diagram and both tables keyboard accessible', () => {
  assertInteractionContract(requiredDocument().body);
});

test('scrolls only a directly focused overflowing region by 40 pixels', () => {
  const overflow = horizontalArrowEvent();
  handleHorizontalArrowKey(overflow.event);
  assert.equal(overflow.region.scrollLeft, 40);
  assert.equal(overflow.wasDefaultPrevented(), true);
  const staticRegion = horizontalArrowEvent({clientWidth: 300, scrollWidth: 300});
  handleHorizontalArrowKey(staticRegion.event);
  assert.equal(staticRegion.region.scrollLeft, 0);
  assert.equal(staticRegion.wasDefaultPrevented(), false);
});

test('states the workshop terminology and non-proof rules verbatim', () => {
  assertTerminologyAndNonProof(requiredDocument().body);
});

test('rejects heading, table, graph, wrapper, terminology and non-proof mutations', () => {
  const {source, body} = requiredDocument();
  assert.throws(() => assertPublicationContract(source.replace('## 学习问题\n', '')), {name: 'AssertionError'}, 'removed H2');
  assert.throws(() => assertPublicationContract(source
    .replace('## 学习问题\n', '## __SWAP__\n')
    .replace('## 建模目标与输入\n', '## 学习问题\n')
    .replace('## __SWAP__\n', '## 建模目标与输入\n')), {name: 'AssertionError'}, 'reordered H2');
  assert.throws(() => assertTableContracts(body.replace(/\n\| 观察到的信号[\s\S]*?<\/div>/u, '\n</div>')), {name: 'AssertionError'}, 'removed table');
  assert.throws(() => assertTableContracts(`${body}\n| 重复 | 表格 |\n| --- | --- |\n`), {name: 'AssertionError'}, 'duplicated table');
  assert.throws(() => assertTableContracts(body.replace('| 领域事件 |', '| 事件 |')), {name: 'AssertionError'}, 'changed header');
  assert.throws(() => assertTableContracts(body.replace('| 费用已提交 |', '| 费用提交中 |')), {name: 'AssertionError'}, 'changed event');
  assert.throws(() => assertTableContracts(body.replace(/\| 支付结果仍未知 \|[^\n]+\n/u, '')), {name: 'AssertionError'}, 'removed event');
  assert.throws(() => assertProcessContract(body.replace('Person<br/>财务人员', 'Actor<br/>财务人员')), {name: 'AssertionError'}, 'changed node type');
  assert.throws(() => assertProcessContract(body.replace('finance_person["Person<br/>财务人员"]', 'finance_person')), {name: 'AssertionError'}, 'removed node type');
  assert.throws(() => assertProcessContract(body.replace('payment_unknown --> payment_result_policy', 'payment_result_policy --> payment_unknown')), {name: 'AssertionError'}, 'reversed edge');
  assert.throws(() => assertProcessContract(body.replace('  register_manual --> expense_system\n', '')), {name: 'AssertionError'}, 'removed edge');
  assert.throws(() => assertTableContracts(body.replace('它也可能只是低频运营升级路径', '')), {name: 'AssertionError'}, 'empty alternative');
  assert.throws(() => assertTableContracts(body.replace('不作为边界证据', '已批准边界')), {name: 'AssertionError'}, 'invalid disposition');
  assert.throws(() => assertInteractionContract(body.replace('  tabIndex={0}\n', '')), {name: 'AssertionError'}, 'removed tabIndex');
  assert.throws(() => assertInteractionContract(body.replace('  onKeyDown={handleHorizontalArrowKey}\n', '')), {name: 'AssertionError'}, 'removed onKeyDown');
  assert.throws(() => assertTerminologyAndNonProof(body.replaceAll('Person', 'Actor')), {name: 'AssertionError'}, 'Actor mutation');
  for (const sentence of nonProofSentences) {
    assert.throws(() => assertTerminologyAndNonProof(body.replace(sentence, `${sentence.slice(0, -1)}通常不等于。`)), {name: 'AssertionError'}, sentence);
  }
});
