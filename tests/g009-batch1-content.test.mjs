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
const exerciseScenarios = [
  '订单确认与库存预留一致',
  '报表消费者隔离与恢复',
  '回滚且不丢失已接受订单',
];

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
  assert.deepEqual(metadata.adjacent_topics, ['PR-01', 'MOD-02']);
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
  for (const value of dimensions) {
    assert.match(document.source, new RegExp(`\\| ${value} \\|`, 'u'));
  }
  for (const value of judgments) assert.match(document.source, new RegExp(value, 'u'));
  assert.match(document.source, /维度 \| 候选约束 \| 实现机制 \| 当前证据 \| 未知项/u);
  assert.match(
    document.source,
    /场景与响应度量 \| 候选响应 \| 判断 \| 所需机制 \| 风险或代价 \| 证据 \| 置信度/u,
  );
  assert.doesNotMatch(document.source, /`?[012]`?\s*表示/u);
  assert.doesNotMatch(document.source, /总分[^。\n]*(选择|胜出|最高)/u);
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
  for (const scenario of exerciseScenarios) {
    const rows = document.source.match(new RegExp(`^\\| ${scenario} \\|`, 'gmu')) ?? [];
    assert.equal(rows.length, 2, `${scenario} must have candidate A and B rows`);
  }
  assert.match(document.source, /报表消费者隔离与恢复 \| 候选 A[^\n]*\| 未知 \|/u);
  assert.match(document.source, /报表消费者隔离与恢复 \| 候选 B[^\n]*\| 未知 \|/u);
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
  assert.match(document.source, /模块化单体 \+ 事务性 Outbox \+ 独立报表消费者/u);
  assert.match(document.source, /订单、库存、报表独立部署/u);
  assert.match(document.source, /选择候选 A/u);
  assert.match(document.source, /团队所有权拆分/u);
  assert.match(document.source, /容量或故障隔离目标变化/u);
  assert.match(document.source, /独立发布需求持续出现/u);
});
