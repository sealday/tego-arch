import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {parseFrontMatter} from '../scripts/content-metadata.mjs';
import {parseMdxVisibleCopy} from '../scripts/visible-copy.mjs';

const root = new URL('../', import.meta.url);

const task8Directories = [
  'content/paths',
  'content/questions',
  'content/references',
  'content/cases',
];

async function task8Files() {
  const files = ['content/intro.mdx'];
  for (const directory of task8Directories) {
    for (const entry of await readdir(new URL(`${directory}/`, root), {recursive: true})) {
      if (entry.endsWith('.mdx')) files.push(path.posix.join(directory, entry));
    }
  }
  return files.sort();
}

function textFrom(node) {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(textFrom).join('');
}

function mermaidStructure(source) {
  const ids = [];
  for (const line of source.split('\n')) {
    const structural = line.replace(/"(?:[^"\\]|\\.)*"/gu, '""');
    for (const pattern of [
      /^\s*(?:actor|participant)\s+([A-Za-z_][\w-]*)/u,
      /^\s*state\s+""\s+as\s+([A-Za-z_][\w-]*)/u,
      /^\s*subgraph\s+([A-Za-z_][\w-]*)/u,
      /^\s*([A-Za-z_][\w-]*)\s*[\[({]/u,
      /^\s*([A-Za-z_][\w-]*)\s+(?:-->|-->>|->>|-.->|==>)\s*([A-Za-z_][\w-]*)/u,
    ]) {
      const match = structural.match(pattern);
      if (match) ids.push(...match.slice(1));
    }
  }
  return ids;
}

function protectedContract(source, file) {
  const metadata = parseFrontMatter(source);
  const {ast} = parseMdxVisibleCopy(source, file, {includeAst: true});
  const contract = {
    metadata: Object.fromEntries(
      ['slug', 'topic_id', 'source_id', 'status', 'schema_version']
        .filter((key) => metadata[key] !== undefined)
        .map((key) => [key, metadata[key]]),
    ),
    inlineCode: [],
    code: [],
    mermaid: [],
    externalLinks: [],
  };
  const visit = (node) => {
    if (node.type === 'inlineCode') contract.inlineCode.push(node.value);
    if (node.type === 'code' && node.lang !== 'mermaid') {
      contract.code.push(`${node.lang ?? ''}\u0000${node.value}`);
    }
    if (node.type === 'code' && node.lang === 'mermaid') {
      contract.mermaid.push(mermaidStructure(node.value));
    }
    if (node.type === 'link' && /^https?:/u.test(node.url)) {
      contract.externalLinks.push([textFrom(node), node.url]);
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  contract.inlineCode.sort();
  contract.code.sort();
  contract.externalLinks.sort(([left], [right]) => left.localeCompare(right, 'en'));
  return contract;
}

async function readCase(filename) {
  return readFile(new URL(`../content/cases/${filename}`, import.meta.url), 'utf8');
}

function visibleOpening(source) {
  const withoutFrontMatter = source.replace(/^---\n[\s\S]*?\n---\n/u, '');
  return withoutFrontMatter.split(/\n## /u, 1)[0];
}

test('labels the Google ADK cancellation conclusion as an evidence-based inference', async () => {
  const source = await readCase('google-adk-a2a.mdx');
  const opening = visibleOpening(source);

  assert.match(
    opening,
    /\*\*基于证据的推断\*\*：因此超时关闭超文本传输协议（Hypertext Transfer Protocol，HTTP）连接、用户点击“停止”和远端副作用停止是三件不同的事。/,
  );
});

test('keeps the Microsoft opening artifact role separate from its evidence scope', async () => {
  const source = await readCase('microsoft-multi-agent-reference-architecture.mdx');
  const opening = visibleOpening(source);

  assert.match(
    opening,
    /它更像一张企业架构问题清单：编排器、注册表、记忆、通信、评估和治理各自承担什么责任，以及这些责任之间应画出哪些边界。/,
  );
  assert.match(
    opening,
    /本文据此只把职责分工视为已证实事实，框架选择和运行合同仍是项目决策。/,
  );
  assert.equal(
    opening.match(/实施团队/g)?.length ?? 0,
    0,
    'the opening should not repeat the implementation-team formulation',
  );
});

test('preserves the complete pre-Task-8 literal and source-link contract', async () => {
  const contracts = {};
  for (const file of await task8Files()) {
    contracts[file] = protectedContract(await readFile(new URL(file, root), 'utf8'), file);
  }
  const digest = createHash('sha256').update(JSON.stringify(contracts)).digest('hex');
  assert.equal(digest, 'eb46f68035531c0c6efd9b27a7105edd565f53acd2f28004c2d258f087f47bea');
});

test('uses Chinese-primary control vocabulary in high-risk reader-facing copy', async () => {
  const [questions, openai, langgraph, singleSpa] = await Promise.all([
    readFile(new URL('content/questions/index.mdx', root), 'utf8'),
    readCase('openai-agents-sdk.mdx'),
    readCase('langgraph-supervisor.mdx'),
    readCase('micro-frontends-single-spa.mdx'),
  ]);

  assert.match(questions, /## 2\.[^\n]*管理者（Manager）[^\n]*移交（Handoff）/u);
  assert.match(questions, /## 3\. 编码智能体工作进程（worker）崩溃后如何恢复/u);
  for (const [source, firstUse] of [
    [openai, '工作流（Workflow）'],
    [openai, '护栏（guardrail）'],
    [openai, '人在回路（Human-in-the-loop）'],
    [langgraph, '检查点器（Checkpointer）'],
    [langgraph, '归约器（Reducer）'],
  ]) {
    assert.match(source, new RegExp(firstUse.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
  assert.doesNotMatch(singleSpa, /and 准备新应用/u);
  const langgraphProse = langgraph.replace(/```mermaid[\s\S]*?```/gu, '');
  assert.doesNotMatch(langgraphProse, /\bNote\b|Fetch again from offset/u);
});

test('uses Chinese-primary case titles while retaining official names where needed', async () => {
  for (const file of (await task8Files()).filter((entry) => entry.startsWith('content/cases/') && entry !== 'content/cases/index.mdx')) {
    const source = await readFile(new URL(file, root), 'utf8');
    const title = parseFrontMatter(source).title;
    assert.match(title, /\p{Script=Han}/u, `${file}: Chinese-primary title`);
    assert.doesNotMatch(title, /\b(?:Agent|Supervisor|Worker|Workflow|Handoff|Manager)\b/u, `${file}: untranslated title`);
  }
});

test('does not leave mechanical spacing or half-translated case prose', async () => {
  const suspectHalfTranslations = /\b(?:coding|script|provider|result|ownership|Operator|tree|data|backend|workflow)\b/u;
  const suspectMechanicalCopy = /(?:数据库数据库|语言语言|存储存储|工作进程进程|结构化数据数据|收件箱待处理\/DELIVERED|已验证\/merged|直接API\/运行时|终端 ownership|原始工程团队\d|偏移量\d|分叉\/merge|旧\/new|工具包\/A2A|MCP\/业务工具|任务和MCP|所有SDK\/版本|持续集成\/CD|\p{Script=Han}-\p{Script=Han})/u;
  const suspectAsciiSlash = /(?:\p{Script=Han}\/[A-Za-z]|[A-Za-z][A-Za-z0-9.-]*\/\p{Script=Han})/u;
  for (const file of (await task8Files()).filter((entry) => entry.startsWith('content/cases/'))) {
    const source = await readFile(new URL(file, root), 'utf8');
    const sourceLines = source.split('\n');
    const parsed = parseMdxVisibleCopy(source, file);
    for (const record of [...parsed.frontMatter, ...parsed.blocks].filter(({structural}) => !structural)) {
      if (record.kind !== 'mermaid') {
        assert.doesNotMatch(sourceLines[record.line - 1], /\p{Script=Han}\s+\p{Script=Han}|）\s+\p{Script=Han}/u, `${file}:${record.line}`);
      }
      const proseWithoutProtectedLinkLabels = record.excerpt.replace(/\[[^\]]+\]/gu, '');
      assert.doesNotMatch(proseWithoutProtectedLinkLabels, suspectHalfTranslations, `${file}:${record.line}`);
      assert.doesNotMatch(proseWithoutProtectedLinkLabels, suspectMechanicalCopy, `${file}:${record.line}`);
      assert.doesNotMatch(sourceLines[record.line - 1], /\p{Script=Han}\s*\+\s*\p{Script=Han}/u, `${file}:${record.line}`);
      assert.doesNotMatch(proseWithoutProtectedLinkLabels, suspectAsciiSlash, `${file}:${record.line}`);
    }
  }
});
