import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {unified} from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';

import {citationMatchesSource} from '../scripts/source-ledger.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => readFile(path.join(root, file), 'utf8');
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);
const protectedLiteralFixture = JSON.parse(await read('tests/fixtures/task7-protected-literals.json'));
const sourceLedger = JSON.parse(await read('data/source-ledger.json'));
const tableContracts = new Map([
  ['content/modeling/mod-01-model-selection-overview.mdx', [7]],
  ['content/modeling/mod-04-arc42-documentation-skeleton.mdx', [7]],
  ['content/modeling/mod-05-conceptual-logical-physical-data-model.mdx', [5]],
  ['content/modeling/mod-06-er-model-relationship-boundaries.mdx', [5, 7]],
  ['content/modeling/mod-09-eventstorming.mdx', [9, 6]],
  ['content/modeling/mod-11-ddd-context-map.mdx', [4, 5]],
  ['content/modeling/mod-12-architecture-diagram-review.mdx', [10, 10]],
  ['content/modeling/mod-13-model-sync-strategy.mdx', [9, 5]],
  ['content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx', [7]],
  ['content/principles/pr-10-idempotency-minimal-coordination.mdx', [9]],
  ['content/principles/pr-11-cqs-cqrs-read-write-separation.mdx', [5]],
  ['content/principles/pr-13-persistence-ignorance.mdx', [5]],
  ['content/principles/pr-14-grasp-responsibility-assignment.mdx', [6]],
  ['content/principles/pr-17-classification-boundaries.mdx', [4, 4, 4]],
]);

const collectTableRows = (source) => {
  const rows = [];
  const visit = (node) => {
    if (node.type === 'table') rows.push(node.children.length);
    for (const child of node.children ?? []) visit(child);
  };
  visit(parser.parse(source));
  return rows;
};

const collectProtectedLiterals = (source) => {
  const inline = [];
  const code = [];
  const mermaid = [];
  const collectMermaidIds = (value) => {
    const ids = [];
    for (const line of value.split('\n')) {
      const structural = line.replace(/"(?:[^"\\]|\\.)*"/gu, '""');
      for (const pattern of [
        /^\s*(?:actor|participant)\s+([A-Za-z_][\w-]*)/u,
        /^\s*state\s+""\s+as\s+([A-Za-z_][\w-]*)/u,
        /^\s*subgraph\s+([A-Za-z_][\w-]*)/u,
        /^\s*([A-Za-z_][\w-]*)\s*[\[({]/u,
        /^\s*([A-Za-z_][\w-]*)\s+\|[|o{}-]+\s+([A-Za-z_][\w-]*)/u,
        /^\s*([A-Za-z_][\w-]*)\s+(?:-->|-->>|->>|-.->|==>)\s*([A-Za-z_][\w-]*)/u,
      ]) {
        const match = structural.match(pattern);
        if (match) ids.push(...match.slice(1));
      }
      if (/^\s+[A-Za-z][\w-]*\s+[A-Za-z_][\w-]*(?:\s|$)/u.test(structural)) {
        const field = structural.trim().match(/^\S+\s+([A-Za-z_][\w-]*)/u);
        if (field) ids.push(field[1]);
      }
    }
    return ids.sort();
  };
  const visit = (node) => {
    if (node.type === 'inlineCode') inline.push(node.value);
    if (node.type === 'code' && node.lang !== 'mermaid') code.push(`${node.lang ?? ''}\u0000${node.value}`);
    if (node.type === 'code' && node.lang === 'mermaid') mermaid.push(collectMermaidIds(node.value));
    for (const child of node.children ?? []) visit(child);
  };
  visit(parser.parse(source));
  return {inline: inline.sort(), code: code.sort(), mermaid};
};

test('production MDX parsing preserves every governed table and row', async () => {
  for (const [file, expectedRows] of tableContracts) {
    assert.deepEqual(collectTableRows(await read(file)), expectedRows, file);
  }
});

test('preserves every pre-Task-7 code literal block and Mermaid structural identifier', async () => {
  for (const [file, expected] of Object.entries(protectedLiteralFixture)) {
    const actual = collectProtectedLiterals(await read(file));
    for (const literal of expected.inline) assert.ok(actual.inline.includes(literal), `${file}: ${literal}`);
    for (const block of expected.code) assert.ok(actual.code.includes(block), `${file}: fenced code`);
    assert.deepEqual(
      actual.mermaid.map((ids) => [...new Set(ids)]),
      expected.mermaid.map((ids) => [...new Set(ids)]),
      `${file}: Mermaid structure`,
    );
  }
});

test('six knowledge domains contain no bulk terminology suppressions', async () => {
  const files = [...tableContracts.keys()];
  for (const file of files) {
    assert.doesNotMatch(await read(file), /terminology-exempt/u, file);
  }
});

test('preserves protected commands paths schema identifiers and exact source titles', async () => {
  const mod13 = await read('content/modeling/mod-13-model-sync-strategy.mdx');
  assert.match(mod13, /`docs\/content-backlog\.md`/u);
  assert.match(mod13, /`generate:content`/u);
  assert.doesNotMatch(mod13, /`文档\/内容-待办\.md`|`生成:内容`/u);

  const mod05 = await read('content/modeling/mod-05-conceptual-logical-physical-data-model.mdx');
  assert.match(mod05, /`approval`/u);

  const sourceContracts = [
    ['content/concepts/fnd-02-architecture-drivers-asr.mdx', 'The Architecture Tradeoff Analysis Method'],
    ['content/principles/pr-13-persistence-ignorance.mdx', 'Applying Domain-Driven Design and Patterns: With Examples in C# and .NET'],
    ['content/principles/pr-17-classification-boundaries.mdx', 'Applying UML and Patterns: An Introduction to Object-Oriented Analysis and Design and Iterative Development, 3rd edition'],
  ];
  for (const [file, title] of sourceContracts) assert.match(await read(file), new RegExp(`\\[${title.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\]`, 'u'), file);
});

test('uses exact ledger titles for external links in source sections', async () => {
  for (const file of Object.keys(protectedLiteralFixture)) {
    const source = await read(file);
    const sectionStart = source.search(/^## 来源(?:与证据边界)?\s*$/mu);
    if (sectionStart === -1) continue;
    const ast = parser.parse(source.slice(sectionStart));
    const visit = (node) => {
      if (node.type === 'link' && /^https?:/u.test(node.url)) {
        const sourceRecord = sourceLedger.sources.find((entry) => citationMatchesSource(node.url, entry));
        assert.ok(sourceRecord, `${file}: unregistered source ${node.url}`);
        const label = (node.children ?? []).map(({value = ''}) => value).join('').trim();
        assert.ok(
          [sourceRecord.title, ...(sourceRecord.citation_titles ?? [])].includes(label),
          `${file}: ${JSON.stringify(label)} must equal a ledger title`,
        );
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(ast);
  }
});

test('uses Chinese-primary GRASP names and a fully Chinese classification table', async () => {
  const pr14 = await read('content/principles/pr-14-grasp-responsibility-assignment.mdx');
  assert.match(pr14, /通用职责分配软件模式（General Responsibility Assignment Software Patterns，GRASP）/u);
  assert.doesNotMatch(pr14, /\b(?:Expert|Controller|Information Expert|High Cohesion|Low Coupling|Creator|Pure Fabrication|Indirection|Polymorphism|Protected Variations)\b/u);

  const pr17 = await read('content/principles/pr-17-classification-boundaries.mdx');
  assert.doesNotMatch(pr17, /What guarantees|How can legacy|可行性\/trade-off|对象\/module|Information,|创建,|协调,|变化,/u);
  assert.match(pr17, /在既定网络模型下，哪些保证可以同时成立/u);
});

test('removes reviewed mechanical Chinese regressions and the generic Context Map alias', async () => {
  const combined = await Promise.all([
    read('content/concepts/fnd-03-architecture-taxonomy.mdx'),
    read('content/methods/mth-02-architecture-tradeoff-analysis-method.mdx'),
  ]).then((parts) => parts.join('\n'));
  assert.doesNotMatch(combined, /方法方法|分类框架分类|头脑风暴\/prioritization|单单元数据面/u);

  const registry = JSON.parse(await read('data/terminology.json'));
  const contextMap = registry.terms.find(({id}) => id === 'ddd-context-map');
  assert.ok(contextMap);
  assert.ok(!contextMap.forbidden_aliases.includes('Context Map'));
});
