import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

import {
  findMarkdownHeadings,
  parseFrontMatter,
} from '../scripts/content-metadata.mjs';
import {knowledgeTypeContracts} from '../scripts/content-schema.mjs';

const articlePath = 'content/concepts/agt-c-01-agent-system-boundary.mdx';
const drawioPath = 'diagrams/agt-c-01-agent-system-boundary.drawio';
const svgPath = 'static/img/diagrams/agt-c-01-agent-system-boundary.svg';
const requiredClaims = [
  'Model 生成候选输出，不拥有任务控制权',
  'Augmented LLM 增加检索、工具或记忆能力，但不必拥有循环',
  'Workflow 的步骤和分支主要由代码预先定义',
  'Agent 让模型在受约束边界内选择下一步动作',
  '自治程度是连续谱，不是四个互斥产品类别',
];

const registry = JSON.parse(
  readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'),
);
const backlog = readFileSync('docs/content-backlog.md', 'utf8');

test('agentic topic registry is exact and globally unique', () => {
  assert.equal(registry.schema_version, 1);
  assert.equal(registry.concepts.length, 6);
  assert.equal(registry.patterns.length, 8);
  assert.equal(registry.cases.length, 3);
  const ids = [...registry.concepts, ...registry.patterns].map(({id}) => id);
  assert.equal(new Set(ids).size, 14);
  assert.deepEqual(ids, [
    'AGT-C-01', 'AGT-C-02', 'AGT-C-03', 'AGT-C-04', 'AGT-C-05',
    'AGT-C-06', 'AGT-P-01', 'AGT-P-02', 'AGT-P-03', 'AGT-P-04',
    'AGT-P-05', 'AGT-P-06', 'AGT-P-07', 'AGT-P-08',
  ]);
  for (const item of [...registry.concepts, ...registry.patterns]) {
    assert.match(backlog, new RegExp(`- \\[[ x]\\] \\*\\*${item.id} P[0-3]`));
  }
  for (const item of registry.cases) {
    assert.match(
      backlog,
      new RegExp(`- \\[[ x]\\] \\*\\*${item.backlog_id} P[0-3]`),
    );
  }
});

test('AGT-C-01 publishes the canonical agent-system boundary and diagram pair', () => {
  assert.ok(existsSync(articlePath), `Missing ${articlePath}`);
  assert.ok(existsSync(drawioPath), `Missing ${drawioPath}`);
  assert.ok(existsSync(svgPath), `Missing ${svgPath}`);

  const source = readFileSync(articlePath, 'utf8');
  const metadata = parseFrontMatter(source);
  assert.equal(metadata.topic_id, 'AGT-C-01');
  assert.equal(metadata.slug, '/concepts/agt-c-01');
  assert.equal(metadata.content_type, 'concept');
  assert.deepEqual(metadata.depends_on, []);
  assert.deepEqual(metadata.adjacent_topics, ['AGT-C-02', 'AGT-C-03', 'AGT-P-01']);
  assert.deepEqual(metadata.related_cases, [
    '/cases/openai-agents-sdk',
    '/cases/kubernetes-reconciliation-loop',
  ]);

  const headings = findMarkdownHeadings(source)
    .filter(({level}) => level === 2)
    .map(({text}) => `## ${text}`);
  assert.deepEqual(headings, knowledgeTypeContracts.concept);
  for (const claim of requiredClaims) assert.match(source, new RegExp(claim, 'u'));

  assert.match(
    source,
    /<div\b(?=[^>]*className="architecture-diagram-scroll")(?=[^>]*role="region")(?=[^>]*tabIndex=\{0\})[^>]*>/u,
  );
  assert.match(source, /\/img\/diagrams\/agt-c-01-agent-system-boundary\.svg/u);
});
