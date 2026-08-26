import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

import {unified} from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';

import {
  extractMarkdownBody,
  findMarkdownHeadings,
  parseFrontMatter,
} from '../scripts/content-metadata.mjs';
import {knowledgeTypeContracts} from '../scripts/content-schema.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const workflowAgentArticlePath =
  'content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx';
const workflowAgentDecisionHeader = [
  '场景身份',
  '任务不确定性',
  '结果可验证性',
  '副作用风险',
  '执行时长',
  '推荐控制形态',
];
const workflowAgentDecisionRows = [
  '已知步骤/低不确定性',
  '开放步骤/可验证结果',
  '高风险副作用',
  '长时可恢复任务',
];
const workflowAgentSourceIds = [
  'src-anthropic-building-effective-agents',
  'src-openai-practical-guide-building-agents',
];
const markdownParser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

const registry = JSON.parse(
  readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'),
);
const groups = JSON.parse(
  readFileSync('data/pattern-groups.json', 'utf8'),
).groups;
// Exact public contract preserved from trusted base b4a28ce before Agentic additions.
const preAgenticPublicGroups = Object.freeze([
  {
    id: 'general-design',
    label: '通用设计模式',
    description: '领域、企业应用、代码责任与结构模式。',
    order: 10,
    topic_ids: [
      'DDD-01', 'DDD-02', 'DDD-03', 'DDD-04', 'DDD-05', 'DDD-06',
      'APP-01', 'APP-02', 'APP-03', 'APP-04',
      'DP-01', 'DP-02', 'DP-03', 'DP-04', 'DP-05', 'DP-06', 'DP-07',
      'DP-08', 'DP-09', 'DP-10',
      'ANTI-01', 'ANTI-02', 'ANTI-06', 'ANTI-07', 'ANTI-08', 'ANTI-09',
      'ANTI-10',
    ],
  },
  {
    id: 'integration',
    label: '集成模式',
    description: '服务、消息、网关、协议与跨边界协作模式。',
    order: 20,
    topic_ids: [
      'PAT-IN-01', 'PAT-IN-02', 'PAT-IN-03', 'PAT-IN-04', 'PAT-IN-05',
      'PAT-IN-06', 'PAT-IN-07', 'PAT-IN-08', 'ANTI-05',
    ],
  },
  {
    id: 'reliability',
    label: '可靠性与生产治理模式',
    description: '恢复、隔离、容量、观测和安全控制模式。',
    order: 30,
    topic_ids: [
      'REL-01', 'REL-02', 'REL-03', 'REL-04', 'REL-05', 'REL-06',
      'REL-07', 'REL-08', 'REL-09', 'REL-10',
      'OPS-01', 'OPS-02', 'OPS-03', 'OPS-04', 'OPS-05', 'OPS-06',
      'SEC-01', 'SEC-02', 'SEC-03', 'SEC-04', 'SEC-05', 'SEC-06', 'ANTI-04',
    ],
  },
  {
    id: 'data',
    label: '数据与一致性模式',
    description: '事务消息、投影、事件和一致性协作模式。',
    order: 40,
    topic_ids: [
      'PAT-DC-01', 'PAT-DC-02', 'PAT-DC-03', 'PAT-DC-04', 'PAT-DC-05',
      'PAT-DC-06', 'PAT-DC-07', 'PAT-DC-08', 'PAT-DC-09', 'ANTI-03',
    ],
  },
  {
    id: 'migration',
    label: '迁移模式',
    description: '渐进替换、兼容窗口和风险受控的结构迁移。',
    order: 50,
    topic_ids: ['PAT-MIG-01', 'PAT-MIG-02', 'PAT-MIG-03'],
  },
]);

function assertPreAgenticPublicGroups(actualGroups) {
  assert.deepEqual(actualGroups, preAgenticPublicGroups);
}

function nodeVisibleText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  return (node.children ?? []).map(nodeVisibleText).join('');
}

function isReaderHiddenJsx(node) {
  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== 'mdxJsxAttribute') return true;
    const name = attribute.name.toLowerCase();
    if (name === 'hidden') return true;
    if (name === 'aria-hidden' && attribute.value !== 'false') return true;
    if (
      name === 'style'
      && (
        typeof attribute.value !== 'string'
        || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/iu.test(attribute.value)
      )
    ) return true;
    if (typeof attribute.value === 'object' && attribute.value !== null) return true;
  }
  return false;
}

function readerVisibleTables(source) {
  const body = extractMarkdownBody(source);
  const ast = markdownParser.parse(body);
  const tables = [];
  const invisibleTypes = new Set([
    'code', 'definition', 'html', 'mdxFlowExpression', 'mdxTextExpression', 'mdxjsEsm',
  ]);
  const visit = (node) => {
    assert.ok(node && typeof node === 'object' && typeof node.type === 'string');
    if (invisibleTypes.has(node.type)) return;
    if (
      (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement')
      && isReaderHiddenJsx(node)
    ) return;
    if (node.type === 'table') {
      tables.push({
        node,
        rows: node.children.map((row) => row.children.map((cell) =>
          nodeVisibleText(cell).replace(/\s+/gu, ' ').trim())),
      });
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return {ast, body, tables};
}

function physicalGfmCells(line) {
  const trimmed = line.trim();
  assert.match(trimmed, /^\|.*\|$/u, 'GFM table row owns leading and trailing pipes');
  const cells = [''];
  let codeFenceLength = 0;
  for (let index = 1; index < trimmed.length - 1; index += 1) {
    const character = trimmed[index];
    if (character === '\\' && index + 1 < trimmed.length - 1) {
      cells[cells.length - 1] += `${character}${trimmed[index + 1]}`;
      index += 1;
      continue;
    }
    if (character === '`') {
      let end = index + 1;
      while (trimmed[end] === '`') end += 1;
      const runLength = end - index;
      if (codeFenceLength === 0) codeFenceLength = runLength;
      else if (codeFenceLength === runLength) codeFenceLength = 0;
      index = end - 1;
      continue;
    }
    if (character === '|' && codeFenceLength === 0) cells.push('');
    else cells[cells.length - 1] += character;
  }
  assert.equal(codeFenceLength, 0, 'GFM table row closes inline code');
  return cells.map((cell) => cell.trim());
}

function assertPhysicalDecisionTable(body, tableNode) {
  const startLine = tableNode.position?.start.line;
  const endLine = tableNode.position?.end.line;
  assert.ok(Number.isInteger(startLine) && Number.isInteger(endLine));
  const lines = body.split(/\r?\n/u).slice(startLine - 1, endLine);
  assert.equal(lines.length, workflowAgentDecisionRows.length + 2);
  for (const [index, line] of lines.entries()) {
    assert.equal(
      physicalGfmCells(line).length,
      workflowAgentDecisionHeader.length,
      `decision-table physical row ${index + 1} has exactly six cells`,
    );
  }
  assert.ok(
    physicalGfmCells(lines[1]).every((cell) => /^:?-{3,}:?$/u.test(cell)),
    'decision-table delimiter row contains only GFM delimiters',
  );
}

function assertNoWorkflowAgentVisual(ast) {
  const visit = (node) => {
    assert.notEqual(node.type, 'image', 'AGT-P-01 has no Markdown image');
    assert.notEqual(node.type, 'imageReference', 'AGT-P-01 has no referenced image');
    assert.ok(
      node.type !== 'code' || node.lang?.toLowerCase() !== 'mermaid',
      'AGT-P-01 has no Mermaid diagram',
    );
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      assert.ok(
        !['canvas', 'embed', 'figure', 'iframe', 'img', 'object', 'picture', 'svg', 'video']
          .includes(node.name?.toLowerCase()),
        `AGT-P-01 has no JSX visual embed: ${node.name}`,
      );
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
}

function assertWorkflowAgentContract(source) {
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-P-01');
  assert.equal(metadata.slug, '/patterns/agt-p-01');
  assert.equal(metadata.content_type, 'pattern');
  assert.equal(metadata.status, 'reviewed');
  assert.equal(metadata.difficulty, 'intermediate');
  assert.equal(metadata.analyzed_at, '2026-08-26');
  assert.equal(metadata.source_cutoff, '2026-08-26');
  assert.equal(metadata.confidence, 'high');
  assert.equal(metadata.priority, 'P1');
  assert.deepEqual(metadata.domains, ['software-architecture', 'artificial-intelligence']);
  assert.deepEqual(metadata.agent_patterns, ['agent-loop']);
  assert.deepEqual(metadata.protocols, []);
  assert.deepEqual(metadata.quality_attributes, ['reliability', 'safety', 'operability']);
  assert.deepEqual(metadata.depends_on, ['AGT-C-01', 'AGT-C-03']);
  assert.deepEqual(metadata.adjacent_topics, [
    'AGT-C-01',
    'AGT-C-03',
    'AGT-P-02',
    'AGT-P-03',
    'AGT-P-04',
    'AGT-P-05',
    'AGT-P-06',
    'AGT-P-07',
    'AGT-P-08',
  ]);
  assert.deepEqual(metadata.related_cases, [
    '/cases/multi-agent-research-system',
    '/cases/long-running-coding-agent',
    '/cases/production-incident-response-agent',
  ]);

  assert.deepEqual(
    findMarkdownHeadings(source)
      .filter(({level}) => level === 2)
      .map(({text}) => `## ${text}`),
    knowledgeTypeContracts.pattern,
  );

  const {ast, body, tables} = readerVisibleTables(source);
  assertNoWorkflowAgentVisual(ast);
  const decisionTables = tables.filter(({rows: [header]}) =>
    header?.[0] === workflowAgentDecisionHeader[0]);
  assert.equal(decisionTables.length, 1, 'exactly one reader-visible autonomy decision table');
  const [{node, rows: [header, ...rows]}] = decisionTables;
  assertPhysicalDecisionTable(body, node);
  assert.deepEqual(header, workflowAgentDecisionHeader);
  assert.equal(rows.length, 4, 'exactly four autonomy decision rows');
  assert.deepEqual(rows.map(([identity]) => identity), workflowAgentDecisionRows);
  for (const [rowIndex, row] of rows.entries()) {
    assert.equal(row.length, 6, `decision row ${rowIndex + 1} has six cells`);
    assert.ok(row.every(Boolean), `decision row ${rowIndex + 1} has no empty cell`);
  }
  assert.match(rows[0][1], /低|已知/u);
  assert.match(rows[0][2], /规则|明确/u);
  assert.match(rows[0][3], /低|受控|可控/u);
  assert.match(rows[0][4], /短|同步/u);
  assert.match(rows[0][5], /确定性(?:代码|工作流)/u);
  assert.match(rows[1][1], /开放|高/u);
  assert.match(rows[1][2], /可验证|明确|验收/u);
  assert.match(rows[1][3], /低|只读|可逆/u);
  assert.match(rows[1][4], /有界|短|中/u);
  assert.match(rows[1][5], /有界智能体循环/u);
  assert.match(rows[2][3], /高|不可逆/u);
  assert.match(rows[2][5], /确定性工作流[\s\S]*人工批准|人工批准[\s\S]*确定性工作流/u);
  assert.match(rows[3][4], /长时|跨进程/u);
  assert.match(rows[3][5], /持久|Durable/iu);

  const visibleCopy = parseMdxVisibleCopy(source, workflowAgentArticlePath, {
    includeStructure: true,
  }).blocks.map(({text}) => text).join('\n');
  assert.match(
    visibleCopy,
    /deterministic code → workflow with model step → bounded agent loop → durable\/multi-agent/u,
  );
  for (const contract of [
    /控制所有者/u,
    /状态所有者/u,
    /副作用/u,
    /终止条件/u,
    /失败/u,
    /恢复/u,
    /权衡/u,
    /迁移/u,
    /回退[\s\S]*确定性工作流|确定性工作流[\s\S]*回退/u,
    /不是(?:全行业|行业)标准/u,
  ]) assert.match(visibleCopy, contract);
  assert.match(visibleCopy, /任务不确定性/u);
  assert.match(visibleCopy, /结果可验证性/u);
  assert.match(visibleCopy, /执行时长/u);
  assert.match(visibleCopy, /Building Effective Agents/u);
  assert.match(visibleCopy, /A Practical Guide to Building Agents/u);
}

function replaceDecisionCell(source, rowIndex, columnIndex, replacement) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.findIndex((line) =>
    line === `| ${workflowAgentDecisionHeader.join(' | ')} |`);
  assert.notEqual(headerIndex, -1, 'decision table physical header');
  const lineIndex = headerIndex + 2 + rowIndex;
  const cells = physicalGfmCells(lines[lineIndex]);
  cells[columnIndex] = replacement;
  lines[lineIndex] = `| ${cells.join(' | ')} |`;
  return lines.join('\n');
}

test('agent-control group exposes the eight approved patterns in order', () => {
  const matchingGroups = groups.filter(({id}) => id === 'agent-control');
  assert.equal(matchingGroups.length, 1);

  const [group] = matchingGroups;
  assert.deepEqual(group.topic_ids, registry.patterns.map(({id}) => id));
  assert.equal(
    group.description,
    '从确定性工作流到检索循环、多 Agent 控制与可恢复执行。',
  );

  assert.equal(new Set(groups.map(({id}) => id)).size, groups.length);
  const assignedTopicIds = groups.flatMap(({topic_ids: topicIds}) => topicIds);
  assert.equal(new Set(assignedTopicIds).size, assignedTopicIds.length);
});

test('preserves the approved pre-Agentic public group contract', () => {
  const existingGroups = groups.filter(({id}) => id !== 'agent-control');
  assertPreAgenticPublicGroups(existingGroups);

  const swappedAssignment = structuredClone(existingGroups);
  const generalDesign = swappedAssignment.find(({id}) => id === 'general-design');
  const integration = swappedAssignment.find(({id}) => id === 'integration');
  [generalDesign.topic_ids[0], integration.topic_ids[0]] = [
    integration.topic_ids[0],
    generalDesign.topic_ids[0],
  ];
  assert.throws(
    () => assertPreAgenticPublicGroups(swappedAssignment),
    assert.AssertionError,
    'the contract rejects swapping general-design DDD-01 with integration PAT-IN-01',
  );
});

test('AGT-P-01 publishes the exact workflow-versus-agent contract', () => {
  assert.ok(existsSync(workflowAgentArticlePath), `Missing ${workflowAgentArticlePath}`);
  assertWorkflowAgentContract(readFileSync(workflowAgentArticlePath, 'utf8'));
});

test('AGT-P-01 decision matrix rejects structural and semantic mutations', () => {
  assert.ok(existsSync(workflowAgentArticlePath), `Missing ${workflowAgentArticlePath}`);
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const mutations = [];
  for (let rowIndex = 0; rowIndex < workflowAgentDecisionRows.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < workflowAgentDecisionHeader.length; columnIndex += 1) {
      mutations.push([
        `empty row ${rowIndex + 1} column ${columnIndex + 1}`,
        replaceDecisionCell(source, rowIndex, columnIndex, ''),
      ]);
    }
    mutations.push([
      `wrong row ${rowIndex + 1} identity`,
      replaceDecisionCell(source, rowIndex, 0, '非空但错误'),
    ]);
  }
  mutations.push([
    'known-step recommendation loses deterministic control',
    replaceDecisionCell(source, 0, 5, '自治优先'),
  ], [
    'open-step recommendation loses bounded loop',
    replaceDecisionCell(source, 1, 5, '无界循环'),
  ], [
    'high-risk recommendation loses deterministic workflow and approval',
    replaceDecisionCell(source, 2, 5, '完全自治执行'),
  ], [
    'long-running recommendation loses durable execution',
    replaceDecisionCell(source, 3, 5, '单次同步调用'),
  ], [
    'extra physical column',
    source
      .replace(
        `| ${workflowAgentDecisionHeader.join(' | ')} |`,
        `| ${workflowAgentDecisionHeader.join(' | ')} | 冗余列 |`,
      )
      .replace('| --- | --- | --- | --- | --- | --- |', '| --- | --- | --- | --- | --- | --- | --- |'),
  ]);

  const firstRowLine = `| ${workflowAgentDecisionRows[0]} |`;
  const hiddenDecoy = source.replace(firstRowLine, '| 错误身份 |');
  mutations.push([
    'HTML-comment decision-table decoy',
    `${hiddenDecoy}\n\n<!--\n${source.slice(source.indexOf(`| ${workflowAgentDecisionHeader.join(' | ')} |`))}\n-->`,
  ], [
    'code-fence decision-table decoy',
    `${hiddenDecoy}\n\n\`\`\`markdown\n${source.slice(source.indexOf(`| ${workflowAgentDecisionHeader.join(' | ')} |`))}\n\`\`\``,
  ]);

  for (const [label, mutant] of mutations) {
    assert.notEqual(mutant, source, `${label} fixture must alter the article`);
    assert.throws(() => assertWorkflowAgentContract(mutant), undefined, label);
  }
});

test('AGT-P-01 reader-visible semantics cannot be satisfied by hidden or code-only decoys', () => {
  assert.ok(existsSync(workflowAgentArticlePath), `Missing ${workflowAgentArticlePath}`);
  const source = readFileSync(workflowAgentArticlePath, 'utf8');
  const progression =
    'deterministic code → workflow with model step → bounded agent loop → durable/multi-agent';
  for (const decoy of [
    `{/* ${progression} */}`,
    `\`\`\`text\n${progression}\n\`\`\``,
    `<span hidden>${progression}</span>`,
  ]) {
    const mutant = `${source.replace(
      `**${progression}**`,
      '**自治级别可以任意跳跃**',
    )}\n\n${decoy}`;
    assert.doesNotThrow(
      () => parseMdxVisibleCopy(mutant, workflowAgentArticlePath),
      'decoy mutation remains valid MDX',
    );
    assert.throws(() => assertWorkflowAgentContract(mutant));
  }
});

test('AGT-P-01 reuses the two governed first-party taxonomy sources without a visual', () => {
  const ledger = JSON.parse(readFileSync('data/source-ledger.json', 'utf8'));
  const document = ledger.documents[workflowAgentArticlePath];
  assert.ok(document, `${workflowAgentArticlePath} source document`);
  assert.deepEqual(
    document.citations.map(({source_id: sourceId}) => sourceId),
    workflowAgentSourceIds,
  );
  assert.ok(document.citations.every(({usage_mode: usageMode}) => usageMode === 'facts-summary'));
  assert.equal(document.citations.filter(({manifest_primary: primary}) => primary).length, 1);
  assert.ok(document.citations.every(({roles}) =>
    roles.includes('definition') && roles.includes('method')));
  assert.ok(
    document.citations.every(({roles}) => !roles.includes('illustration')),
    'no AGT-P-01 illustration citation',
  );

  const governedSources = workflowAgentSourceIds.map((sourceId) => {
    const source = ledger.sources.find(({id}) => id === sourceId);
    assert.ok(source, sourceId);
    assert.equal(source.tier, 'first-party', sourceId);
    assert.deepEqual(source.allowed_evidence_roles, ['definition', 'method'], sourceId);
    assert.match(source.usage_boundary, /does not|does not prove/u, sourceId);
    return source;
  });
  assert.deepEqual(governedSources.map(({canonical_locator: locator}) => locator), [
    'https://www.anthropic.com/engineering/building-effective-agents',
    'https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/',
  ]);

  const health = JSON.parse(readFileSync('data/source-link-health.json', 'utf8'));
  for (const source of governedSources) {
    const result = health.results.find(({transport_locator: locator}) =>
      locator === source.transport_locator);
    assert.ok(result, `${source.id} existing health observation`);
    assert.deepEqual(result.source_ids, [source.id]);
    assert.equal(result.review_status, 'healthy');
  }
});
