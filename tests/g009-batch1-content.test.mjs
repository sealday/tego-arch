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
const document = documents.find(({file}) => file === 'styles/sty-00-comparison-framework.mdx');
const [ledger, linkHealth] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const expectedSources = [
  {
    id: 'src-sei-qaw-collection',
    canonical_locator: 'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
    transport_locator: 'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
    expected_final_transport_locator:
      'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
  },
  {
    id: 'src-sei-atam-collection',
    canonical_locator:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
    transport_locator:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
    expected_final_transport_locator:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
  },
  {
    id: 'src-microsoft-architecture-styles',
    canonical_locator:
      'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/',
    transport_locator:
      'https://raw.githubusercontent.com/microsoftdocs/architecture-center/4fb4d75aa5ed8423caa0d6c35d40b32bbc3cc819/docs/guide/architecture-styles/index.md',
    expected_final_transport_locator:
      'https://raw.githubusercontent.com/microsoftdocs/architecture-center/4fb4d75aa5ed8423caa0d6c35d40b32bbc3cc819/docs/guide/architecture-styles/index.md',
  },
  {
    id: 'src-arc42-architecture-decisions',
    canonical_locator: 'https://docs.arc42.org/section-9/',
    transport_locator:
      'https://raw.githubusercontent.com/arc42/docs.arc42.org-site/bcbc20283a2a486305ce72e400e731a3ee30f7f4/_pages/section-9.md',
    expected_final_transport_locator:
      'https://raw.githubusercontent.com/arc42/docs.arc42.org-site/bcbc20283a2a486305ce72e400e731a3ee30f7f4/_pages/section-9.md',
  },
];

const expectedCitations = [
  {
    source_id: 'src-sei-qaw-collection',
    citation_url: 'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
    roles: ['method', 'learning'],
    manifest_primary: false,
  },
  {
    source_id: 'src-sei-atam-collection',
    citation_url:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
    roles: ['definition', 'method', 'learning'],
    manifest_primary: true,
  },
  {
    source_id: 'src-microsoft-architecture-styles',
    citation_url:
      'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/',
    roles: ['comparison', 'definition', 'learning'],
    manifest_primary: false,
  },
  {
    source_id: 'src-arc42-architecture-decisions',
    citation_url: 'https://docs.arc42.org/section-9/',
    roles: ['method', 'learning'],
    manifest_primary: false,
  },
  {
    source_id: 'src-arc42-quality-requirements-v9',
    citation_url: 'https://docs.arc42.org/section-10/',
    roles: ['definition', 'method', 'learning'],
    manifest_primary: false,
  },
];

const expectedHeadings = [
  '学习问题',
  '组件、连接器与约束',
  '边界与控制流',
  '数据所有权与一致性',
  '部署单元与故障域',
  '团队拓扑',
  '质量属性收益与成本',
  '迁移路径',
  '禁用条件',
  '对比案例',
  '来源',
];
const dimensions = [
  '边界',
  '控制流',
  '数据所有权',
  '一致性',
  '部署单元',
  '故障域',
  '团队拓扑',
  '质量属性',
];
const judgments = ['直接支持', '需要补充机制', '与约束冲突', '未知'];
const flowLabels = [
  '质量属性场景',
  '候选架构剖面',
  '硬约束检查',
  '机制与证据比较',
  '证据足够',
  '原型、测量或故障演练',
  '决策记录与复核触发器',
];
const decisionRecordFields = [
  '决策范围与日期',
  '参与的责任角色类型',
  '选定候选',
  '被否决候选与原因',
  '关键敏感点',
  '关键权衡点',
  '仍未关闭的风险',
  '验证动作',
  '复核触发器',
];
const expectedScenarioJudgments = [
  [
    '订单确认与库存预留一致',
    [['候选一', '未知'], ['候选二', '需要补充机制']],
  ],
  [
    '报表消费者隔离与恢复',
    [['候选一', '未知'], ['候选二', '未知']],
  ],
  [
    '回滚且不丢失已接受订单',
    [['候选一', '未知'], ['候选二', '需要补充机制']],
  ],
];
const expectedMermaid = `flowchart TD
  scenarios[质量属性场景] --> profiles[候选架构剖面]
  profiles --> constraints[硬约束检查]
  constraints --> compare[机制与证据比较]
  compare --> enough{证据足够}
  enough -->|是| decision[决策记录与复核触发器]
  enough -->|否| validate[原型、测量或故障演练]
  validate --> compare`;
const expectedRegionContracts = [
  {
    className: 'table-wrapper table-wrapper--mapping',
    role: 'region',
    'aria-label': '候选架构剖面八维表，可横向滚动',
    tabIndex: '0',
    onKeyDown: 'handleHorizontalArrowKey',
  },
  {
    className: 'diagram-wrapper diagram-wrapper--scroll-owner',
    role: 'region',
    'aria-label': '架构风格比较决策流程，可横向滚动',
    tabIndex: '0',
    onKeyDown: 'handleHorizontalArrowKey',
  },
  {
    className: 'table-wrapper table-wrapper--mapping',
    role: 'region',
    'aria-label': '场景响应比较矩阵，可横向滚动',
    tabIndex: '0',
    onKeyDown: 'handleHorizontalArrowKey',
  },
];

function extractTableRows(source, header) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(header);
  assert.notEqual(headerIndex, -1, `missing table header: ${header}`);
  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith('|')) break;
    rows.push(line.split('|').slice(1, -1).map((cell) => cell.trim()));
  }
  return rows;
}

function jsxAttributes(source) {
  return Object.fromEntries(
    [...source.matchAll(/\b(?<name>[A-Za-z][\w-]*)=(?:"(?<quoted>[^"]*)"|\{(?<expression>[^}]*)\})/gu)]
      .map(({groups}) => [groups.name, groups.quoted ?? groups.expression]),
  );
}

function overflowRegionContracts(source) {
  const expectedClasses = new Set(
    expectedRegionContracts.map(({className}) => className),
  );
  return [...source.matchAll(/<div\b(?<attributes>[^>]*)>/gu)]
    .map(({groups}) => jsxAttributes(groups.attributes))
    .filter(({className}) => expectedClasses.has(className))
    .map(({className, role, 'aria-label': accessibleName, tabIndex, onKeyDown}) => ({
      className,
      role,
      'aria-label': accessibleName,
      tabIndex,
      onKeyDown,
    }));
}

function assertMethodStructure(source) {
  const profileRows = extractTableRows(
    source,
    '| 维度 | 候选约束 | 实现机制 | 当前证据 | 未知项 |',
  );
  assert.deepEqual(profileRows.map(([dimension]) => dimension), dimensions, '八维顺序');

  const mermaid = source.match(/```mermaid\n(?<graph>[\s\S]*?)\n```/u)?.groups?.graph;
  assert.equal(mermaid, expectedMermaid, 'exact Mermaid nodes and edges');

  assert.deepEqual(
    overflowRegionContracts(source),
    expectedRegionContracts,
    'complete overflow-owner contracts',
  );

  const scenarioRows = extractTableRows(
    source,
    '| 场景与响应度量 | 候选响应 | 判断 | 所需机制 | 风险或代价 | 证据 | 置信度 |',
  );
  for (const [scenario, expected] of expectedScenarioJudgments) {
    const actual = scenarioRows
      .filter(([rowScenario]) => rowScenario === scenario)
      .map(([, response, judgment]) => [response.match(/^候选[一二]/u)?.[0], judgment]);
    assert.deepEqual(actual, expected, `${scenario} candidate order and judgments`);
  }
}

function candidateDimensions(source, candidate, nextMarker) {
  const start = source.indexOf(`\n候选${candidate}：`);
  assert.notEqual(start, -1, `missing Candidate ${candidate} exercise`);
  const end = source.indexOf(nextMarker, start + 1);
  assert.notEqual(end, -1, `missing Candidate ${candidate} exercise boundary`);
  return source
    .slice(start, end)
    .split(/\r?\n/u)
    .flatMap((line) => {
      const match = line.match(/^- \*\*(?<label>[^：]+)：\*\*\s*(?<value>.+)$/u);
      return match ? [[match.groups.label, match.groups.value]] : [];
    });
}

function assertExerciseDimensions(source) {
  const expectedLabels = dimensions;
  for (const [candidate, nextMarker] of [
    ['一', '\n候选二：'],
    ['二', '\n当前选择候选一'],
  ]) {
    const entries = candidateDimensions(source, candidate, nextMarker);
    assert.deepEqual(
      entries.map(([label]) => label),
      expectedLabels,
      `Candidate ${candidate} ordered dimensions`,
    );
    assert.ok(
      entries.every(([, value]) => value.trim().length > 0),
      `Candidate ${candidate} dimension values`,
    );
  }
}

function mutateCandidateExercise(source, candidate, nextMarker, mutate) {
  const start = source.indexOf(`\n候选${candidate}：`);
  assert.notEqual(start, -1, `missing Candidate ${candidate} mutation fixture`);
  const end = source.indexOf(nextMarker, start + 1);
  assert.notEqual(end, -1, `missing Candidate ${candidate} mutation boundary`);
  return `${source.slice(0, start)}${mutate(source.slice(start, end))}${source.slice(end)}`;
}

function observationFields({
  at,
  outcome,
  final_transport_locator,
  http_status,
  login_wall_detected,
}) {
  return {at, outcome, final_transport_locator, http_status, login_wall_detected};
}

function assertHealthyObservation(observation, transportLocator, message) {
  assert.equal(observation.outcome, 'healthy', `${message} outcome`);
  assert.equal(
    observation.final_transport_locator,
    transportLocator,
    `${message} final transport`,
  );
  assert.ok(Number.isInteger(observation.http_status), `${message} integer HTTP status`);
  assert.ok(
    observation.http_status >= 200 && observation.http_status <= 299,
    `${message} successful HTTP status`,
  );
  assert.equal(observation.login_wall_detected, false, `${message} no login wall`);
}

test('governs five specific visible STY-00 sources', () => {
  assert.ok(document, 'STY-00 must remain published');
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  assert.deepEqual(
    expectedSources.map(({id}) => {
      const {canonical_locator, transport_locator, expected_final_transport_locator} =
        records.get(id) ?? {};
      return {id, canonical_locator, transport_locator, expected_final_transport_locator};
    }),
    expectedSources,
  );
  assert.equal(
    records.get('src-microsoft-architecture-styles')?.license_evidence_url,
    'https://github.com/microsoftdocs/architecture-center/blob/4fb4d75aa5ed8423caa0d6c35d40b32bbc3cc819/LICENSE',
  );
  for (const {source_id, citation_url} of expectedCitations) {
    assert.ok(document.source.includes(`](${citation_url})`), `${source_id} visible citation`);
  }
  const review = ledger.documents['content/styles/sty-00-comparison-framework.mdx'];
  assert.equal(review.reviewed_at, '2026-08-06');
  assert.deepEqual(
    review.citations.map(({source_id, citation_url, roles, manifest_primary}) => ({
      source_id,
      citation_url,
      roles,
      manifest_primary,
    })),
    expectedCitations,
  );
});

test('keeps every new remote source in the reviewed health cache', () => {
  const expectedSourceIds = new Set(expectedSources.map(({id}) => id));
  const governedResults = linkHealth.results.filter(({source_ids}) =>
    source_ids.some((sourceId) => expectedSourceIds.has(sourceId)),
  );
  assert.equal(governedResults.length, expectedSources.length);
  const resultsByTransport = new Map(
    governedResults.map((result) => [result.transport_locator, result]),
  );
  for (const {id, transport_locator} of expectedSources) {
    const result = resultsByTransport.get(transport_locator);
    assert.ok(result, `${id} exact transport result`);
    assert.deepEqual(result.source_ids, [id], `${id} source binding`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
    assertHealthyObservation(result.last_attempt, transport_locator, `${id} last attempt`);
    assertHealthyObservation(result.last_success, transport_locator, `${id} last success`);
    assert.deepEqual(
      observationFields(result.last_success),
      observationFields(result.last_attempt),
      `${id} current healthy attempt is the latest success`,
    );
    assert.ok(result.attempt_history.length > 0, `${id} attempt history`);
    assert.deepEqual(
      observationFields(result.attempt_history.at(-1)),
      observationFields(result.last_attempt),
      `${id} history ends with the current attempt`,
    );
  }
});

test('publishes the approved STY-00 metadata and style headings', () => {
  const metadata = parseFrontMatter(document.source);
  assert.equal(metadata.title, '架构风格比较框架');
  assert.equal(metadata.slug, '/styles/sty-00');
  assert.equal(metadata.content_type, 'style');
  assert.equal(metadata.topic_id, 'STY-00');
  assert.equal(metadata.analyzed_at, '2026-08-06');
  assert.equal(metadata.source_cutoff, '2026-08-06');
  assert.deepEqual(metadata.adjacent_topics, ['PR-01', 'MOD-02', 'STY-01']);
  assert.deepEqual(metadata.related_cases, ['/cases/micro-frontends-single-spa']);
  assert.deepEqual(
    findMarkdownHeadings(document.body)
      .filter(({level}) => level === 2)
      .map(({text}) => text),
    expectedHeadings,
  );
  assert.match(
    document.source,
    /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u,
  );
  assert.match(document.body, /风格是一组约束|风格是约束族/u);
  assert.match(document.body, /候选[^\n。]*组合[^\n。]*风格/u);
  assert.match(document.body, /比较架构剖面[^\n。]*不是[^\n。]*标签/u);
});

test('locks the eight-dimension profile and non-numeric judgments', () => {
  assertMethodStructure(document.source);
  assertExerciseDimensions(document.source);
  for (const value of judgments) assert.match(document.source, new RegExp(value, 'u'));
  assert.match(document.source, /维度 \| 候选约束 \| 实现机制 \| 当前证据 \| 未知项/u);
  assert.match(
    document.source,
    /场景与响应度量 \| 候选响应 \| 判断 \| 所需机制 \| 风险或代价 \| 证据 \| 置信度/u,
  );
  assert.doesNotMatch(document.source, /`?[012]`?\s*表示/u);
  assert.doesNotMatch(document.source, /总分[^。\n]*(选择|胜出|最高)/u);
});

test('parses accessible overflow wrapper contracts independent of formatting', () => {
  const reformatted = document.source.replace(
    '<div className="table-wrapper table-wrapper--mapping" role="region" aria-label="候选架构剖面八维表，可横向滚动" tabIndex={0} onKeyDown={handleHorizontalArrowKey}>',
    `<div
  aria-label="候选架构剖面八维表，可横向滚动"
  onKeyDown={handleHorizontalArrowKey}
  role="region"
  className="table-wrapper table-wrapper--mapping"
  tabIndex={0}
>`,
  );
  assert.notEqual(reformatted, document.source, 'wrapper fixture changed');
  assertMethodStructure(reformatted);
});

test('requires explicitly non-login-wall observations for G009 healthy sources', () => {
  const forged = structuredClone(
    linkHealth.results.find(({source_ids}) =>
      source_ids.includes('src-sei-qaw-collection'),
    ).last_attempt,
  );
  forged.login_wall_detected = true;
  assert.throws(
    () =>
      assertHealthyObservation(
        forged,
        expectedSources[0].transport_locator,
        'forged healthy attempt',
      ),
    {name: 'AssertionError'},
  );
});

test('locks the Mermaid recovery loop and accessible local overflow owners', () => {
  assert.equal((document.source.match(/```mermaid/gmu) ?? []).length, 1);
  for (const label of flowLabels) assert.match(document.source, new RegExp(label, 'u'));
  assert.match(document.source, /证据足够.*-->\|否\|.*原型、测量或故障演练/su);
  assert.match(document.source, /validate --> compare/u);
  assert.equal((document.source.match(/role="region"/gmu) ?? []).length, 3);
  assert.equal((document.source.match(/tabIndex=\{0\}/gmu) ?? []).length, 3);
  assert.equal(
    (document.source.match(/onKeyDown=\{handleHorizontalArrowKey\}/gmu) ?? []).length,
    3,
  );
  const region = {scrollWidth: 900, clientWidth: 360, scrollLeft: 0};
  let prevented = false;
  handleHorizontalArrowKey({
    key: 'ArrowRight',
    currentTarget: region,
    target: region,
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(region.scrollLeft, 40);
  assert.equal(prevented, true);
});

test('records all decision fields and compares both candidates against the same scenarios', () => {
  for (const field of decisionRecordFields) {
    assert.match(document.source, new RegExp(`\\*\\*${field}：\\*\\*`, 'u'));
  }
  assertMethodStructure(document.source);
  assert.match(
    document.source,
    /仍未关闭的风险：\*\*[^\n]*本地事务[^\n]*回滚[^\n]*恢复时长/u,
  );
  assert.match(
    document.source,
    /验证动作：\*\*[^\n]*事务[^\n]*已接受订单[^\n]*事务性发件箱[^\n]*消费者不可用[^\n]*恢复时长/u,
  );
  assert.match(document.source, /选择候选一[^\n。]*条件[^\n。]*验证门槛/u);
  assert.match(document.source, /验证门槛[^\n。]*不能[^\n。]*验证完成/u);
});

test('rejects reviewed method-contract mutations', async (t) => {
  const mutations = [
    {
      name: 'swap dimension order',
      source: document.source.replace(
        /(^\| 边界 \|.*$)\n(^\| 控制流 \|.*$)/mu,
        '$2\n$1',
      ),
    },
    {
      name: 'bypass constraints edge',
      source: document.source.replace(
        '  profiles --> constraints[硬约束检查]\n  constraints --> compare[机制与证据比较]',
        '  profiles --> compare[机制与证据比较]',
      ),
    },
    {
      name: 'duplicate candidate A',
      source: document.source.replace(
        '| 报表消费者隔离与恢复 | 候选二',
        '| 报表消费者隔离与恢复 | 候选一',
      ),
    },
    {
      name: 'remove scroll-owner class',
      source: document.source.replace(
        'diagram-wrapper diagram-wrapper--scroll-owner',
        'diagram-wrapper',
      ),
    },
    {
      name: 'change wrapper role',
      source: document.source.replace('role="region"', 'role="group"'),
    },
    {
      name: 'remove wrapper accessible name',
      source: document.source.replace(
        'aria-label="候选架构剖面八维表，可横向滚动"',
        '',
      ),
    },
    {
      name: 'remove wrapper tab focusability',
      source: document.source.replace('tabIndex={0}', 'tabIndex={-1}'),
    },
    {
      name: 'change wrapper keyboard handler',
      source: document.source.replace(
        'onKeyDown={handleHorizontalArrowKey}',
        'onKeyDown={() => {}}',
      ),
    },
    {
      name: 'remove Candidate A dimension',
      source: mutateCandidateExercise(
        document.source,
        '一',
        '\n候选二：',
        (exercise) => exercise.replace(/^- \*\*控制流：\*\*.*\n/mu, ''),
      ),
    },
    {
      name: 'reorder Candidate B dimensions',
      source: mutateCandidateExercise(
        document.source,
        '二',
        '\n当前选择候选一',
        (exercise) => exercise.replace(
          /(^- \*\*边界：\*\*.*$)\n(^- \*\*控制流：\*\*.*$)/mu,
          '$2\n$1',
        ),
      ),
    },
  ];
  for (const mutation of mutations) {
    await t.test(mutation.name, () => {
      assert.notEqual(mutation.source, document.source, `${mutation.name} fixture changed`);
      assert.throws(() => {
        assertMethodStructure(mutation.source);
        assertExerciseDimensions(mutation.source);
      }, undefined, mutation.name);
    });
  }
});

test('keeps the approved visible relations and exercise decision', () => {
  const links = new Set(extractInternalLinks(document));
  for (const href of [
    '/styles',
    '/principles/pr-01',
    '/modeling/mod-02',
    '/cases/micro-frontends-single-spa',
  ]) {
    assert.ok(links.has(href), href);
  }
  assert.match(document.source, /模块化单体 \+ 事务性发件箱 \+ 独立报表消费者/u);
  assert.match(document.source, /订单、库存、报表独立部署/u);
  assert.match(document.source, /选择候选一/u);
  assert.match(document.source, /团队所有权拆分/u);
  assert.match(document.source, /容量或故障隔离目标变化/u);
  assert.match(document.source, /独立发布需求持续出现/u);
});

const [manifest, projectStatus, indexes, publicLedger] = await Promise.all([
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/project-status.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../src/generated/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);

test('preserves the STY-00 closure in the current Batch 4 projection', () => {
  const topic = manifest.topics.find(({id}) => id === 'STY-00');
  assert.equal(topic.published, true);
  assert.equal(topic.status.value, 'complete');
  assert.deepEqual(topic.primary_sources, [
    'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
  ]);
  assert.deepEqual(projectStatus, {
    schema_version: 1,
    durable_stories: {completed: 8, total: 20, current: 'G009'},
    completed_topics: 56,
    content_documents: 98,
    governed_sources: 509,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  });
  assert.ok(indexes.style.some(({id, status}) => id === 'STY-00' && status.value === 'complete'));
  assert.ok(indexes.style.some(({id, status}) => id === 'STY-01' && status.value === 'complete'));
  assert.ok(indexes.style.some(({id, published, status}) =>
    id === 'STY-03' && published === true && status.value === 'complete'));
  assert.ok(indexes.style.some(({id, published, status}) =>
    id === 'STY-04' && published === false && status.value === 'pending'));
  assert.equal(publicLedger.sources.length, 509);
});
