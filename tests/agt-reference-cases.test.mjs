import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

import {
  extractMarkdownBody,
  findMarkdownHeadings,
  parseFrontMatter,
} from '../scripts/content-metadata.mjs';
import {
  collectDrawioPairValidation,
  collectXmlVisibleCopy,
  parseXml,
  xmlElements,
} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

const registry = JSON.parse(readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'));
const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));

const researchCasePath = 'content/cases/multi-agent-research-system.mdx';
const researchDrawioPath = 'diagrams/multi-agent-research-system.drawio';
const researchSvgPath = 'static/img/diagrams/multi-agent-research-system.svg';
const codingCasePath = 'content/cases/long-running-coding-agent.mdx';
const codingDrawioPath = 'diagrams/long-running-coding-agent.drawio';
const codingSvgPath = 'static/img/diagrams/long-running-coding-agent.svg';
const researchDiagramLabels = [
  'Research Orchestrator',
  'Question Decomposer',
  'Task Ledger',
  'Research Workers',
  'Retrieval Boundary',
  'Evidence Store',
  'Citation Verifier',
  'Synthesis Agent',
  'Human Review',
  'Budget / Stop',
];
const researchDiagramRegions = [
  'Control',
  'Parallel research',
  'Evidence authority',
  'Review/terminal',
];
const codingDiagramLabels = [
  'Task Intake',
  'Agent Harness',
  'Plan / Progress Ledger',
  'Coding Loop',
  'Isolated Worktree',
  'Sandbox',
  'Test Runner',
  'Checkpoint Store',
  'Approval Gate',
  'Version Control',
  'Recovery / Reconcile',
];
const codingDiagramRegions = [
  'Harness control',
  'Isolated execution',
  'Durable state',
  'External authority',
];
const caseH2s = [
  '学习问题',
  '一页摘要',
  '事实边界',
  '架构图',
  '控制权与任务流',
  '关键源码导读',
  '架构决策与权衡',
  '生产化分析',
  '可迁移经验',
  '来源',
];
const transferH3s = [
  '可直接复用的机制',
  '只能有限类比的部分',
  '不应照搬的部分',
];

function readRequired(path) {
  assert.ok(existsSync(path), `required file is missing: ${path}`);
  return readFileSync(path, 'utf8');
}

function drawioCellSignatures(root) {
  return xmlElements(root, 'mxCell', '').map((cell) => ({
    attributes: [...cell.attributes].sort(([left], [right]) => left.localeCompare(right)),
    geometry: xmlElements(cell, 'mxGeometry', '').map((geometry) =>
      [...geometry.attributes].sort(([left], [right]) => left.localeCompare(right))),
  }));
}

test('the three approved reference cases have unique routes and global catalog order', () => {
  assert.deepEqual(registry.cases.map(({backlog_id}) => backlog_id), ['CASE-21','CASE-22','CASE-23']);
  assert.deepEqual(registry.cases.map(({order}) => order), [19,20,21]);
  assert.equal(new Set(registry.cases.map(({route}) => route)).size, 3);
  assert.equal(new Set(registry.cases.map(({file}) => file)).size, 3);
  assert.ok(registry.cases.every(({visual}) => visual === 'Draw.io + SVG'));
});

test('multi-agent research case contract', () => {
  const source = readRequired(researchCasePath);
  const drawio = readRequired(researchDrawioPath);
  const svg = readRequired(researchSvgPath);
  const metadata = parseFrontMatter(source);
  const headings = findMarkdownHeadings(extractMarkdownBody(source));

  assert.equal(metadata.slug, '/cases/multi-agent-research-system');
  assert.equal(metadata.title, '多智能体研究系统：让证据完成度而不是工作者数量决定终止');
  assert.equal(metadata.content_type, 'case');
  assert.equal(metadata.series, 'ai-native');
  assert.equal(metadata.catalog_order, 19);
  assert.deepEqual(metadata.source_kinds, [
    'paper',
    'engineering-blog',
    'official-repository',
    'original-illustration',
  ]);
  assert.deepEqual(metadata.migration_targets, [
    'task-decomposition',
    'evidence-sufficiency',
    'fan-out-fan-in',
  ]);
  assert.deepEqual(headings.filter(({level}) => level === 2).map(({text}) => text), caseH2s);
  assert.deepEqual(
    headings.filter(({level, text}) => level === 3 && transferH3s.includes(text)).map(({text}) => text),
    transferH3s,
  );

  for (const label of ['已证实事实', '基于证据的推断', '个人分析']) {
    assert.match(source, new RegExp(`\\*\\*${label}\\*\\*`, 'u'), `reader-visible evidence label: ${label}`);
  }
  assert.match(source, /参考设计/u);
  assert.match(source, /不是(?:真实|特定)客户部署/u);
  assert.match(source, /没有任何单一来源证明(?:这张图|本文|该设计)的完整拓扑/u);
  assert.match(source, /完整拓扑是 Tego Arch 原创综合/u);
  assert.match(source, /编排器拥有任务完成权/u);
  assert.match(source, /研究工作者不得直接写最终答案/u);
  assert.match(source, /有界检索轮次/u);
  assert.match(source, /拒答/u);
  assert.match(source, /证据权威性不足[^。]*停止自动化/u);
  assert.match(source, /重大矛盾[^。]*无法解决[^。]*停止自动化/u);
  assert.match(
    source,
    /`open_deep_research` 固定提交 `1b7d2e80db9faa586165c60e09096dbbfd483a64`/u,
    'the prose owns the fixed implementation seam instead of leaving it only in the source list',
  );

  for (const failure of [
    '重复问题',
    '污染来源',
    '证据冲突',
    '工作者超时',
    '部分覆盖',
    '合成幻觉',
    '引文不匹配',
    '预算耗尽',
  ]) {
    assert.match(source, new RegExp(`\\|\\s*${failure}\\s*\\|`, 'u'), `failure row: ${failure}`);
  }

  assert.equal((source.match(/className="architecture-diagram-scroll"/gu) ?? []).length, 1);
  assert.match(source, /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u);
  assert.match(source, /tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}/u);
  assert.match(source, /\/img\/diagrams\/multi-agent-research-system\.svg/u);

  for (const label of [...researchDiagramRegions, ...researchDiagramLabels]) {
    assert.ok(drawio.includes(label), `Draw.io label: ${label}`);
    assert.ok(svg.includes(label), `SVG label: ${label}`);
  }

  const drawioParsed = parseXml(drawio, researchDrawioPath);
  const svgParsed = parseXml(svg, researchSvgPath);
  assert.match(svg, /^<svg\b/u, 'published SVG begins with its image root for build-time sizing');
  assert.equal(
    svgParsed.root.attributes.has('content'),
    false,
    'the publishable SVG strips the source copy after raw provenance validation',
  );
  assert.equal(
    svgParsed.root.attributes.get('data-source-sha256'),
    createHash('sha256').update(drawio).digest('hex'),
    'published provenance binds the exact Draw.io source',
  );
  assert.match(svgParsed.root.attributes.get('data-raw-sha256') ?? '', /^[a-f0-9]{64}$/u);
  assert.equal(svgParsed.root.attributes.has('width'), false, 'published SVG has no fixed width');
  assert.equal(svgParsed.root.attributes.has('height'), false, 'published SVG has no fixed height');
  assert.equal(xmlElements(svgParsed.root, 'foreignObject', 'http://www.w3.org/2000/svg').length, 0);
  const renderedCellIds = xmlElements(svgParsed.root, 'g', 'http://www.w3.org/2000/svg')
    .filter((element) => element.attributes.has('data-cell-id'))
    .map((element) => element.attributes.get('data-cell-id')).sort();
  const sourceCellIds = xmlElements(drawioParsed.root, 'mxCell', '')
    .map((element) => element.attributes.get('id')).sort();
  assert.deepEqual(renderedCellIds, sourceCellIds, 'every source cell owns one UI-exported group');
  const drawioVisible = collectDrawioPairValidation(drawioParsed, researchDrawioPath);
  const svgVisible = collectXmlVisibleCopy(svgParsed, researchSvgPath, 'svg');
  assert.deepEqual(
    svgVisible.records.map(({text}) => text).sort(),
    drawioVisible.records.map(({text}) => text).sort(),
    'all and only source labels remain visibly rendered',
  );

  const illustration = ledger.sources.find(({id}) => id === 'src-atlas-multi-agent-research-system');
  assert.ok(illustration, 'original illustration source');
  assert.deepEqual({
    source_kind: illustration.source_kind,
    tier: illustration.tier,
    allowed_evidence_roles: illustration.allowed_evidence_roles,
    license: illustration.license,
    copyright_policy: illustration.copyright_policy,
  }, {
    source_kind: 'original-illustration',
    tier: 'primary',
    allowed_evidence_roles: ['illustration'],
    license: 'LicenseRef-Atlas-Original',
    copyright_policy: 'original-atlas',
  });

  const document = ledger.documents[researchCasePath];
  assert.ok(document, 'governed case document');
  assert.ok(document.copyright_checks.includes('illustration-rights'));
  const sourcesById = new Map(ledger.sources.map((record) => [record.id, record]));
  assert.deepEqual(
    [...new Set(document.citations.map(({source_id}) => sourcesById.get(source_id)?.source_kind))].sort(),
    ['engineering-blog', 'official-repository', 'original-illustration', 'paper'],
  );
  assert.ok(document.citations.some(({source_id, roles, usage_mode}) =>
    source_id === 'src-atlas-multi-agent-research-system'
    && roles.includes('illustration')
    && usage_mode === 'original-illustration'));
});

test('long-running coding agent case contract', () => {
  const source = readRequired(codingCasePath);
  const drawio = readRequired(codingDrawioPath);
  const svg = readRequired(codingSvgPath);
  const metadata = parseFrontMatter(source);
  const headings = findMarkdownHeadings(extractMarkdownBody(source));

  assert.equal(metadata.slug, '/cases/long-running-coding-agent');
  assert.equal(metadata.title, '长任务编码智能体：把完成状态留在上下文窗口之外');
  assert.equal(metadata.content_type, 'case');
  assert.equal(metadata.series, 'ai-native');
  assert.equal(metadata.catalog_order, 20);
  assert.equal(metadata.topic_id, undefined, 'reference cases do not fabricate topic ids');
  assert.deepEqual(metadata.source_kinds, [
    'engineering-blog',
    'official-repository',
    'source-code',
    'original-illustration',
  ]);
  assert.deepEqual(metadata.migration_targets, [
    'agent-harness',
    'sandboxed-execution',
    'checkpoint-recovery',
    'test-feedback',
  ]);
  assert.deepEqual(headings.filter(({level}) => level === 2).map(({text}) => text), caseH2s);
  assert.deepEqual(
    headings.filter(({level, text}) => level === 3 && transferH3s.includes(text)).map(({text}) => text),
    transferH3s,
  );

  for (const label of ['已证实事实', '基于证据的推断', '个人分析']) {
    assert.match(source, new RegExp(`\\*\\*${label}\\*\\*`, 'u'), `reader-visible evidence label: ${label}`);
  }
  assert.match(source, /参考设计/u);
  assert.match(source, /不是(?:真实|特定)客户部署/u);
  assert.match(source, /没有任何单一来源证明(?:这张图|本文|该设计)的完整拓扑/u);
  assert.match(source, /完整拓扑是 Tego Arch 原创综合/u);
  assert.match(source, /模型上下文[^。]*绝不是[^。]*唯一记录/u);
  assert.match(source, /恢复[^。]*仓库[^。]*检查点[^。]*事实/u);
  assert.match(source, /重新运行验证/u);
  assert.match(source, /可逆的仓库操作[^。]*外部或不可逆/u);
  assert.match(source, /危险或破坏性命令[^。]*外部发布[^。]*批准/u);
  assert.match(source, /自动停止|停止自动化/u);
  assert.match(source, /拒绝执行|弃权/u);

  for (const failure of [
    '上下文丢失',
    '计划陈旧',
    '测试抖动',
    '沙箱逃逸尝试',
    '破坏性命令',
    '依赖漂移',
    '部分提交',
    '凭据过期',
    '未知外部效果后重启',
  ]) {
    assert.match(source, new RegExp(`\\|\\s*${failure}\\s*\\|`, 'u'), `failure row: ${failure}`);
  }
  for (const required of ['降级运行', '超时', '部分失败', '恢复验证']) {
    assert.match(source, new RegExp(required, 'u'), `operational contract: ${required}`);
  }

  assert.equal((source.match(/className="architecture-diagram-scroll"/gu) ?? []).length, 1);
  assert.match(source, /import \{handleHorizontalArrowKey\} from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u);
  assert.match(source, /tabIndex=\{0\} onKeyDown=\{handleHorizontalArrowKey\}/u);
  assert.match(source, /\/img\/diagrams\/long-running-coding-agent\.svg/u);

  for (const label of [...codingDiagramRegions, ...codingDiagramLabels]) {
    assert.ok(drawio.includes(label), `Draw.io label: ${label}`);
    assert.ok(svg.includes(label), `SVG label: ${label}`);
  }

  const drawioParsed = parseXml(drawio, codingDrawioPath);
  const svgParsed = parseXml(svg, codingSvgPath);
  assert.match(svg, /^<svg\b/u, 'published SVG begins with its image root for build-time sizing');
  assert.equal(svgParsed.root.attributes.has('content'), false, 'published SVG strips the source copy');
  assert.equal(
    svgParsed.root.attributes.get('data-source-sha256'),
    createHash('sha256').update(drawio).digest('hex'),
    'published provenance binds the exact Draw.io source',
  );
  assert.match(svgParsed.root.attributes.get('data-raw-sha256') ?? '', /^[a-f0-9]{64}$/u);
  assert.equal(svgParsed.root.attributes.has('width'), false, 'published SVG has no fixed width');
  assert.equal(svgParsed.root.attributes.has('height'), false, 'published SVG has no fixed height');
  assert.equal(xmlElements(svgParsed.root, 'foreignObject', 'http://www.w3.org/2000/svg').length, 0);
  const renderedCellIds = xmlElements(svgParsed.root, 'g', 'http://www.w3.org/2000/svg')
    .filter((element) => element.attributes.has('data-cell-id'))
    .map((element) => element.attributes.get('data-cell-id')).sort();
  const sourceCellIds = xmlElements(drawioParsed.root, 'mxCell', '')
    .map((element) => element.attributes.get('id')).sort();
  assert.deepEqual(renderedCellIds, sourceCellIds, 'every source cell owns one UI-exported group');
  assert.deepEqual(
    collectXmlVisibleCopy(svgParsed, codingSvgPath, 'svg').records.map(({text}) => text).sort(),
    collectDrawioPairValidation(drawioParsed, codingDrawioPath).records.map(({text}) => text).sort(),
    'all and only source labels remain visibly rendered',
  );

  const illustration = ledger.sources.find(({id}) => id === 'src-atlas-long-running-coding-agent');
  assert.ok(illustration, 'original illustration source');
  assert.deepEqual({
    source_kind: illustration.source_kind,
    tier: illustration.tier,
    allowed_evidence_roles: illustration.allowed_evidence_roles,
    license: illustration.license,
    copyright_policy: illustration.copyright_policy,
  }, {
    source_kind: 'original-illustration',
    tier: 'primary',
    allowed_evidence_roles: ['illustration'],
    license: 'LicenseRef-Atlas-Original',
    copyright_policy: 'original-atlas',
  });

  const document = ledger.documents[codingCasePath];
  assert.ok(document, 'governed case document');
  assert.ok(document.copyright_checks.includes('illustration-rights'));
  const sourcesById = new Map(ledger.sources.map((record) => [record.id, record]));
  assert.deepEqual(
    [...new Set(document.citations.map(({source_id}) => sourcesById.get(source_id)?.source_kind))].sort(),
    ['engineering-blog', 'official-docs', 'official-repository', 'original-illustration', 'source-code'],
    'citations include the governed Anthropic method source without changing the exact frontmatter inventory',
  );
  assert.ok(document.citations.some(({source_id, roles, usage_mode}) =>
    source_id === 'src-atlas-long-running-coding-agent'
    && roles.includes('illustration')
    && usage_mode === 'original-illustration'));
});
