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

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const expected = new Map([
  [
    'PR-09',
    [
      'principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx',
      '/principles/pr-09',
      'P0',
    ],
  ],
  [
    'PR-10',
    [
      'principles/pr-10-idempotency-minimal-coordination.mdx',
      '/principles/pr-10',
      'P0',
    ],
  ],
  [
    'PR-11',
    [
      'principles/pr-11-cqs-cqrs-read-write-separation.mdx',
      '/principles/pr-11',
      'P1',
    ],
  ],
]);
const h2 = [
  '学习问题',
  '要保护的性质',
  '冲突与适用上下文',
  '机制',
  '误用与反原则',
  '适用尺度',
  '相邻原则',
  '说明性场景',
  '来源',
];
const relationships = new Map([
  ['PR-09', ['PR-04', 'PR-07', 'PR-10', 'PR-16', 'AGT-C-05']],
  ['PR-10', ['PR-07', 'PR-08', 'PR-09', 'PR-11', 'PR-16', 'MOD-08', 'AGT-C-05']],
  ['PR-11', ['PR-03', 'PR-04', 'PR-10', 'PR-13', 'STY-06']],
]);
const routeByTopic = new Map([
  ['PR-03', '/principles/pr-03'],
  ['PR-04', '/principles/pr-04'],
  ['PR-07', '/principles/pr-07'],
  ['PR-08', '/principles/pr-08'],
  ['PR-09', '/principles/pr-09'],
  ['PR-10', '/principles/pr-10'],
  ['PR-11', '/principles/pr-11'],
  ['PR-13', '/principles/pr-13'],
  ['PR-16', '/principles/pr-16'],
  ['STY-06', '/styles/sty-06'],
  ['MOD-08', '/modeling/mod-08'],
  ['AGT-C-05', '/concepts/agt-c-05'],
]);
const solePrimary = new Map([
  ['PR-09', 'src-saltzer-schroeder-protection-1975'],
  ['PR-10', 'src-aws-making-retries-safe-idempotent-apis-2020'],
  ['PR-11', 'src-martin-fowler-cqrs-2011'],
]);
const requiredCase = new Map([
  ['PR-09', '/cases/litellm-virtual-keys-governance'],
  ['PR-10', '/cases/temporal-saga-durable-execution'],
  ['PR-11', '/cases/temporal-saga-durable-execution'],
]);
const decisionContracts = new Map([
  [
    'PR-09',
    [
      ['least privilege is not role count', '误用与反原则', /最小权限不等于角色数量最大化/u],
      ['actual authority includes scope and duration', '机制', /资源、动作、时长与委派路径/u],
      ['indeterminate is not allow', '机制', /缺少策略或策略求值失败都不得变成隐式允许/u],
      ['fail-safe default remains observable', '误用与反原则', /安全默认值不等于静默失败/u],
      ['defense layers require independence', '机制', /额外控制必须针对已命名威胁，并具有有意义的独立性/u],
      ['emergency access has lifecycle', '机制', /紧急权限必须有所有者、审计、过期与撤销/u],
      [
        'authentication is not authorization',
        '误用与反原则',
        /只完成认证不等于完成授权[^。\n]*知道“是谁”不能回答“能对哪个资源执行什么动作”/u,
      ],
      [
        'shared control dependencies are not independent defense',
        '误用与反原则',
        /同一身份源、同一策略引擎或同一管理员权限[^。\n]*不构成独立防御[^。\n]*信任边界和失效模式是否相关/u,
      ],
      [
        'additional controls name the asset threat boundary and residual risk',
        '机制',
        /授权决策先明确[^。；\n]*资源[^。；\n]*[\s\S]*额外控制必须针对已命名威胁[^。；\n]*[\s\S]*信任边界[^|\n]*\|[^|\n]*残余风险/u,
      ],
      [
        'narrow role names do not prove least privilege',
        '机制',
        /实际权限由资源、动作、时长与委派路径共同界定[^。；\n]*不是只看身份或角色名/u,
      ],
      [
        'permanent emergency credentials require replacement lifecycle',
        '误用与反原则',
        /永久紧急凭证也不是可用性方案[^。\n]*短时窄权限、强审计、到期撤销并复盘/u,
      ],
    ],
  ],
  [
    'PR-10',
    [
      ['idempotency protects effect not bytes', '要保护的性质', /幂等保护的是受约束效果，而不是逐字节相同响应/u],
      ['retry keeps one operation identity', '机制', /同一逻辑操作的传输重试必须复用同一幂等键/u],
      ['unknown is not failed', '机制', /未知结果不是可盲重试的失败/u],
      ['dedupe is not invariant coordination', '冲突与适用上下文', /去重不能替代共享不变量所需的所有权、条件写或串行化/u],
      ['minimal coordination is not zero', '误用与反原则', /最小协调不等于零协调/u],
      ['HTTP method is not proof', '误用与反原则', /超文本传输协议（Hypertext Transfer Protocol，HTTP）方法[^。；\n]*不能证明[^。；\n]*幂等/u],
      ['fresh retry key is rejected', '误用与反原则', /每次(?:传输|网络)重试生成新(?:的)?幂等键[^。；\n]*(?:破坏|错误)/u],
      [
        'success-only state is rejected',
        '机制',
        /只存储(?:一个)?成功(?:标志|旗标)[^。；\n]*(?:不足|不能)[^。；\n]*进行中、已完成、已拒绝、冲突、已过期与未知/u,
      ],
      ['exactly-once is not enough', '误用与反原则', /恰好一次[^。；\n]*不能[^。；\n]*(?:幂等消费者|效果边界)/u],
      ['irreversible retries are bounded', '误用与反原则', /不可逆效果[^。；\n]*(?:无限|无界|不设上限)重试[^。；\n]*(?:补偿|对账|人工终态)/u],
      ['process-local cache is insufficient', '适用尺度', /进程内缓存[^。；\n]*不足以[^。；\n]*(?:跨实例|持久)/u],
    ],
  ],
  [
    'PR-11',
    [
      ['command-query-separation scale', '要保护的性质', /命令查询分离约束方法或接口的可观察状态语义/u],
      ['CQRS scale', '要保护的性质', /CQRS 分离命令与查询责任及其模型/u],
      ['replica is not CQRS', '要保护的性质', /只读副本只是基础设施路由，不能单独证明 CQRS/u],
      ['four outcomes', '机制', /保留现有模型并应用命令查询分离[\s\S]*优化单模型读取[\s\S]*基础设施读写分流[\s\S]*采用 CQRS/u],
      ['CQRS costs are explicit', '冲突与适用上下文', /投影延迟、读己之写、回放重建、对账与模式演化/u],
      ['simple CRUD non-use', '误用与反原则', /简单增删改查边界没有模型分歧证据时不采用 CQRS/u],
      ['return value does not define query', '误用与反原则', /返回值[^。；\n]*不能[^。；\n]*查询/u],
      [
        'CQS is not CQRS',
        '机制',
        /先保留现有模型并应用命令查询分离[^。；\n]*[\s\S]*只有命令规则与查询形状长期不同[^。；\n]*采用 CQRS/u,
      ],
      [
        'read-heavy ratio alone does not justify CQRS',
        '机制',
        /模型相同，只是查询慢或读多\s*\|\s*优化单模型读取[^|\n]*\|[^|\n]*\|\s*不引入投影流水线/u,
      ],
      [
        'conceptual model separation does not require separate databases',
        '要保护的性质',
        /CQRS 分离命令与查询责任及其模型，但不必分离物理存储/u,
      ],
      [
        'eventual visibility is not hidden',
        '误用与反原则',
        /失败模式包括[^。；\n]*命令成功但查询长期不可见/u,
      ],
      [
        'projection lag remains caller-visible',
        '冲突与适用上下文',
        /团队必须承担投影延迟/u,
      ],
      [
        'duplicate events remain explicit',
        '机制',
        /采用 CQRS[^|\n]*\|[^|\n]*投影、重复事件、重建、对账、模式演化/u,
      ],
      [
        'rebuild cost remains explicit',
        '冲突与适用上下文',
        /团队必须承担[^。；\n]*回放重建/u,
      ],
      [
        'read-your-write remains explicit',
        '冲突与适用上下文',
        /团队必须承担[^。；\n]*读己之写/u,
      ],
      [
        'mutating value return is a CQS exception',
        '要保护的性质',
        /改变可观察状态[^。；\n]*返回(?:标识符|ID)、(?:回执|receipt)或(?:结果|outcome)[^。；\n]*组合操作[^。；\n]*命令查询分离例外/u,
      ],
      [
        'strict CQS redesign separates result lookup',
        '要保护的性质',
        /无返回值命令[^。；\n]*独立(?:回执|结果)查询/u,
      ],
      [
        'caller-observable auxiliary changes invalidate query purity',
        '要保护的性质',
        /调用者可观察[^。；\n]*领域(?:状态|语义)[^。；\n]*不能[^。；\n]*(?:纯查询|查询纯粹)/u,
      ],
      [
        'implementation-only auxiliary effects preserve domain contract',
        '要保护的性质',
        /实现内部[^。；\n]*(?:记账|指标|缓存|延迟加载)[^。；\n]*不改变[^。；\n]*领域契约[^。；\n]*(?:披露|命名|说明)/u,
      ],
    ],
  ],
]);

const pr09AuthorizationRows = [
  ['explicit allow', /明确授权[^|\n]*\|\s*只发放本次操作所需能力/u],
  ['explicit deny', /明确拒绝\s*\|\s*拒绝/u],
  ['no-match deny', /没有匹配策略\s*\|\s*拒绝/u],
  [
    'evaluation or stale-identity conservative deny',
    /策略求值失败或身份陈旧\s*\|\s*保守拒绝并标记控制故障/u,
  ],
  [
    'emergency access lifecycle',
    /\| 紧急访问获批 \| 发放短时、窄范围能力 \| 审批者、负责人、范围、到期、工单 \| 强审计，到期撤销并复盘 \|/u,
  ],
  [
    'independent remaining control',
    /一层控制失效\s*\|\s*由独立层限制剩余路径[^|\n]*\|[^|\n]*(?:trust boundary|信任边界)[^|\n]*(?:independent signal|独立信号)[^|\n]*\|[^|\n]*(?:残余风险|剩余风险)/u,
  ],
];

const pr10ReplayRows = [
  [
    'success with lost response',
    /首次成功但响应丢失[^|\n]*\|[^|\n]*(?:逻辑操作|幂等键)[^|\n]*\|[^|\n]*completed[^|\n]*result_ref[^|\n]*\|[^|\n]*(?:唯一约束|条件写|权威记录)[^|\n]*\|[^|\n]*(?:已记录|语义等价)[^|\n]*\|[^|\n]*返回(?:已记录|记录的)结果/u,
  ],
  [
    'failure before protected effect',
    /首次(?:尝试)?在受保护(?:副作用|效果)前失败[^|\n]*\|[^|\n]*(?:逻辑操作|幂等键)[^|\n]*\|[^|\n]*(?:failed-before-effect|未产生效果)[^|\n]*\|[^|\n]*(?:条件写|状态机|权威记录)[^|\n]*\|[^|\n]*(?:可重试|失败)[^|\n]*\|[^|\n]*有界重试/u,
  ],
  [
    'effect with uncertain completion record',
    /副作用可能成功但完成记录(?:缺失|不确定)[^|\n]*\|[^|\n]*(?:逻辑操作|目标侧键)[^|\n]*\|[^|\n]*unknown[^|\n]*\|[^|\n]*(?:receipt|权威结果|目标侧)[^|\n]*\|[^|\n]*(?:未知|待查)[^|\n]*\|[^|\n]*(?:补偿|人工终态|人工处置)/u,
  ],
  [
    'duplicate while first attempt runs',
    /同键(?:重复|并发).*(?:首次|第一).*(?:运行|执行)[^|\n]*\|[^|\n]*同一(?:逻辑操作|幂等键)[^|\n]*\|[^|\n]*in-progress[^|\n]*\|[^|\n]*(?:租约|条件写|单一执行者)[^|\n]*\|[^|\n]*(?:处理中|in-progress)[^|\n]*\|[^|\n]*(?:返回处理中|安全恢复|返回已记录结果)/u,
  ],
  [
    'duplicate after retention expires',
    /去重记录(?:已)?过期[^|\n]*\|[^|\n]*(?:旧幂等键|原幂等键|原逻辑操作)[^|\n]*\|[^|\n]*expired[^|\n]*\|[^|\n]*(?:权威记录|业务有效期|人工核对)[^|\n]*\|[^|\n]*(?:过期|不能判定)[^|\n]*\|[^|\n]*(?:人工核对|新业务操作)/u,
  ],
  [
    'same key with different payload',
    /同键不同(?:规范化意图|payload|载荷)[^|\n]*\|[^|\n]*同一幂等键[^|\n]*\|[^|\n]*conflict[^|\n]*\|[^|\n]*(?:payload hash|规范化意图 hash|权威记录)[^|\n]*\|[^|\n]*(?:冲突|拒绝)[^|\n]*\|[^|\n]*拒绝冲突/u,
  ],
  [
    'distinct commands conflict on invariant',
    /不同命令竞争同一不变量[^|\n]*\|[^|\n]*独立(?:幂等)?键[^|\n]*\|[^|\n]*(?:各自状态|独立状态)[^|\n]*\|[^|\n]*(?:所有权|条件写|串行化)[^|\n]*\|[^|\n]*(?:冲突|条件失败|拒绝)[^|\n]*\|[^|\n]*拒绝冲突/u,
  ],
  [
    'irreversible external effect cannot commit atomically',
    /外部不可逆效果无法原子耦合[^|\n]*\|[^|\n]*(?:目标侧键|逻辑操作)[^|\n]*\|[^|\n]*(?:pending|unknown)[^|\n]*\|[^|\n]*(?:目标侧|receipt|outbox)[^|\n]*\|[^|\n]*(?:待定|未知)[^|\n]*\|[^|\n]*(?:补偿|人工终态|人工处置)/u,
  ],
];

const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);
const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));

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

test('publishes PR-09 through PR-11 with the principle contract', () => {
  for (const [id, [file, slug, priority]] of expected) {
    const document = requiredDocument(id);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'principle');
    assert.equal(document.metadata.priority, priority);
    assert.equal(document.metadata.status, 'reviewed');
    assert.deepEqual(document.metadata.adjacent_topics, relationships.get(id));
    assert.deepEqual(
      document.headings.filter(({level}) => level === 2).map(({text}) => text),
      h2,
    );
    const questions = section(document.body, '学习问题')
      .split(/\r?\n/u)
      .filter((line) => /^ {0,3}[-*+]\s+\S.*[?？]\s*$/u.test(line));
    assert.ok(questions.length >= 3 && questions.length <= 5, `${id} learning questions`);
    assert.match(
      document.body,
      /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu,
      `${id} original representation`,
    );
    assert.match(document.body, /\*\*来源事实：\*\*/u, `${id} fact label`);
    assert.match(document.body, /\*\*推断：\*\*/u, `${id} inference label`);
    assert.match(document.body, /\*\*本站分析：\*\*/u, `${id} site-analysis label`);
    assert.match(document.body, /失败模式/u, `${id} failure mode`);
    assert.match(document.body, /不适用|不采用/u, `${id} non-use condition`);
    assert.match(document.body, /运行成本|操作成本|协调成本/u, `${id} operational cost`);
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
});

test('governs sources and visible Batch 3 relationships', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has at least two sources`);
    const primary = governed.citations.filter(({manifest_primary}) => manifest_primary);
    assert.equal(primary.length, 1, `${id} has exactly one manifest primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary identity`);
    const visibleExternal = new Set(extractExternalLinks(document));
    const domains = new Set();
    for (const citation of governed.citations) {
      assert.ok(visibleExternal.has(citation.citation_url), `${id} visible ${citation.source_id}`);
      domains.add(new URL(citation.citation_url).hostname);
    }
    assert.ok(domains.size >= 2, `${id} independent source domains`);
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id)) {
      assert.ok(links.has(routeByTopic.get(adjacent)), `${id} visibly links ${adjacent}`);
    }
    assert.ok(links.has(requiredCase.get(id)), `${id} links its required case`);
    for (const adjacent of relationships.get(id).filter((topic) => /^PR-1[5-7]$/u.test(topic))) {
      assert.equal(topics.get(adjacent)?.published, true, `${id} closing relationship is published`);
    }
  }
});

for (const [id, contracts] of decisionContracts) {
  test(`keeps ${id} decision boundaries distinct`, () => {
    const body = requiredDocument(id).body;
    for (const [label, heading, pattern] of contracts) {
      assert.match(section(body, heading), pattern, `${id}: ${label}`);
    }
  });
}

test('keeps every PR-09 authorization outcome independently explicit', () => {
  const mechanism = section(requiredDocument('PR-09').body, '机制');
  assert.match(
    mechanism,
    /\|\s*决策状态\s*\|\s*当前请求结果\s*\|\s*必需证据\s*\|\s*后续动作\s*\|/u,
  );
  for (const [label, pattern] of pr09AuthorizationRows) {
    assert.match(mechanism, pattern, `PR-09 authorization matrix: ${label}`);
  }
});

test('defines the complete PR-10 replay contract row by row', () => {
  const mechanism = section(requiredDocument('PR-10').body, '机制');
  assert.match(
    mechanism,
    /\|\s*重放情形\s*\|\s*(?:操作身份|所需身份)\s*\|\s*(?:存储状态|权威状态)\s*\|\s*协调点\s*\|\s*可观察响应(?:类别)?\s*\|\s*终态路径\s*\|/u,
    'PR-10 replay matrix contract dimensions',
  );
  for (const [label, pattern] of pr10ReplayRows) {
    assert.match(mechanism, pattern, `PR-10 replay matrix: ${label}`);
  }
  assert.match(
    section(requiredDocument('PR-10').body, '要保护的性质'),
    /业务有效(?:期|窗口)[^。；\n]*不同于[^。；\n]*去重记录(?:的)?保留(?:期|窗口)/u,
    'PR-10 business validity and dedup retention are distinct',
  );
});

test('does not misclassify a value-returning mutation as a strict CQS command', () => {
  const boundary = section(requiredDocument('PR-11').body, '要保护的性质');
  assert.doesNotMatch(
    boundary,
    /命令可以返回(?:标识符|ID)、(?:回执|receipt)或(?:结果|outcome)[^。；\n]*(?:只要[^。；\n]*改变领域状态|仍是命令)/u,
  );
});

test('does not equate CQS with CQRS', () => {
  const mechanism = section(requiredDocument('PR-11').body, '机制');
  assert.doesNotMatch(mechanism, /CQS\s*(?:就是|等于|等同于)\s*CQRS/u);
});
