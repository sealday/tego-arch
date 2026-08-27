import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {parseFrontMatter} from '../scripts/content-metadata.mjs';
import {citationMatchesSource} from '../scripts/source-ledger.mjs';
import {parseMdxVisibleCopy, renderVisibleBlock} from '../scripts/visible-copy.mjs';

const root = new URL('../', import.meta.url);

const task8Directories = [
  'content/paths',
  'content/questions',
  'content/references',
  'content/cases',
];
const latinHanBoundary = /(?:[A-Za-z][A-Za-z0-9.+-]*(?:[ \t]+[A-Za-z0-9.+-]+)*(?=\p{Script=Han})|(?<=\p{Script=Han})[A-Za-z][A-Za-z0-9.+-]*(?:[ \t]+[A-Za-z0-9.+-]+)*)/u;
const asciiProseSlash = /(?:\p{Script=Han}|[A-Za-z][A-Za-z0-9.+-]*)\s*\/\s*(?:\p{Script=Han}|[A-Za-z][A-Za-z0-9.+-]*)/u;
const sourceLedger = JSON.parse(await readFile(new URL('data/source-ledger.json', root), 'utf8'));

function normalizeLinkLabel(value) {
  return value.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

function governedCitation(url, label) {
  if (!/^https?:/u.test(url ?? '')) return false;
  const source = sourceLedger.sources.find((candidate) => citationMatchesSource(url, candidate));
  return [source?.title, ...(source?.citation_titles ?? [])]
    .some((title) => title && normalizeLinkLabel(title) === normalizeLinkLabel(label));
}

function linkBoundaryIssues(source, file = 'content/example.mdx') {
  const {ast} = parseMdxVisibleCopy(source, file, {includeAst: true});
  const issues = [];
  const visit = (node) => {
    if (node.type === 'link' || node.type === 'linkReference') {
      const start = node.position.start.offset;
      const end = node.position.end.offset;
      const before = source[start - 1] ?? '';
      const after = source[end] ?? '';
      const label = renderVisibleBlock(node, {includeInlineCode: true}).text;
      const first = label.match(/[\p{Script=Han}A-Za-z0-9]/u)?.[0] ?? '';
      const last = [...label.matchAll(/[\p{Script=Han}A-Za-z0-9]/gu)].at(-1)?.[0] ?? '';
      const crossScript = (left, right) => (
        (/\p{Script=Han}/u.test(left) && /[A-Za-z0-9]/u.test(right))
        || (/[A-Za-z0-9]/u.test(left) && /\p{Script=Han}/u.test(right))
      );
      const exactCitation = governedCitation(node.url, label);
      const word = /^[\p{Script=Han}A-Za-z0-9]$/u;
      if (before === ']' || crossScript(before, first) || (exactCitation && word.test(before))) {
        issues.push({line: node.position.start.line, side: 'before'});
      }
      if (after === '[' || crossScript(last, after) || (exactCitation && word.test(after))) {
        issues.push({line: node.position.end.line, side: 'after'});
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return issues;
}

function naturalCopyIssues(source, file = 'content/example.mdx') {
  const repeatedNoun = /(数据库|语言|存储|进程|数据|终端|接口|状态|服务|工作流|管理者)\1/u;
  const parsed = parseMdxVisibleCopy(source, file, {
    excludeLink: ({hasImage, label, url}) => !hasImage && governedCitation(url, label),
  });
  const issues = [];
  for (const record of [...parsed.frontMatter, ...parsed.blocks].filter(({structural}) => !structural)) {
    const reviewedText = record.text
      .replaceAll('Erlang/OTP', 'Erlang OTP')
      .replaceAll('Fan-out/Fan-in', 'Fan-out 与 Fan-in');
    for (const [kind, pattern] of [
      ['Latin↔Han', latinHanBoundary],
      ['prose slash', asciiProseSlash],
      ['repeated noun', repeatedNoun],
    ]) {
      if (pattern.test(reviewedText)) issues.push({line: record.line, kind});
    }
  }
  return issues;
}

async function task8Files() {
  const files = ['content/intro.mdx'];
  for (const directory of task8Directories) {
    for (const entry of await readdir(new URL(`${directory}/`, root), {recursive: true})) {
      if (entry.endsWith('.mdx')) files.push(path.posix.join(directory, entry));
    }
  }
  return files.sort();
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

function jsxStructure(ast) {
  const structure = [];
  const visit = (node) => {
    if (/^mdxJsx(?:Flow|Text)Element$/u.test(node.type)) {
      structure.push([
        node.name,
        (node.attributes ?? [])
          .filter(({name}) => ['className', 'role', 'tabIndex'].includes(name))
          .map(({name, value}) => [
            name,
            typeof value === 'string' ? value : value?.value ?? null,
          ]),
      ]);
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return structure;
}

function mdxModuleStructure(ast) {
  const modules = [];
  const visit = (node) => {
    if (node.type === 'mdxjsEsm') modules.push(node.value);
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  return modules;
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
    externalUrls: [],
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
      contract.externalUrls.push(node.url);
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(ast);
  if (file === 'content/cases/cloudflare-durable-objects-workerd.mdx') {
    contract.inlineCode.splice(contract.inlineCode.indexOf('getByName(name)'), 1);
  }
  contract.inlineCode.sort();
  contract.code.sort();
  contract.externalUrls.sort((left, right) => left.localeCompare(right, 'en'));
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

test('preserves the complete pre-Task-8 literal and external-URL contract', async () => {
  const contracts = {};
  for (const file of await task8Files()) {
    contracts[file] = protectedContract(await readFile(new URL(file, root), 'utf8'), file);
  }
  const digest = createHash('sha256').update(JSON.stringify(contracts)).digest('hex');
  assert.equal(digest, '292baa412f44072f5c583227f4c6867a682c6df3aa5df2395440e5516c6cc308');
});

test('preserves the complete pre-Task-8 JSX structure contract', async () => {
  const structures = {};
  for (const file of await task8Files()) {
    const source = await readFile(new URL(file, root), 'utf8');
    const {ast} = parseMdxVisibleCopy(source, file, {includeAst: true});
    structures[file] = jsxStructure(ast);
  }
  const digest = createHash('sha256').update(JSON.stringify(structures)).digest('hex');
  assert.equal(digest, '08902d9f73c4c6346d4e15a508fa11af2eeec09c6fe2a7f7368a47797b42da56');
});

test('preserves the complete pre-Task-8 MDX module contract', async () => {
  const structures = {};
  for (const file of await task8Files()) {
    const source = await readFile(new URL(file, root), 'utf8');
    const {ast} = parseMdxVisibleCopy(source, file, {includeAst: true});
    structures[file] = mdxModuleStructure(ast);
  }
  const digest = createHash('sha256').update(JSON.stringify(structures)).digest('hex');
  assert.equal(digest, '4a38059b3b93ea6b3190ec93868dd04d0243de8b604155d5b1ec65d13014e71d');
});

test('preserves official product identity in every reviewed Task 8 case title', async () => {
  const identities = new Map([
    ['aws-cell-shuffle-sharding.mdx', ['AWS Cell Architecture + Shuffle Sharding 架构方案', 'AWS Cell Architecture + Shuffle Sharding']],
    ['aws-cli-agent-orchestrator.mdx', ['AWS Labs CLI Agent Orchestrator 多进程编排项目', 'AWS Labs CLI Agent Orchestrator']],
    ['cloudflare-durable-objects-workerd.mdx', ['Cloudflare Durable Objects + workerd 边缘协调方案', 'Cloudflare Durable Objects + workerd']],
    ['google-adk-a2a.mdx', ['Google ADK 与 A2A 智能体协作方案', 'Google ADK 与 A2A']],
    ['kubeedge-cloud-edge-autonomy.mdx', ['KubeEdge Cloud-Edge Autonomy 云边自治方案', 'KubeEdge Cloud-Edge Autonomy']],
    ['langgraph-supervisor.mdx', ['LangGraph Supervisor 智能体编排方案', 'LangGraph Supervisor']],
    ['ros2-dds-agent-lifecycle.mdx', ['ROS 2 + DDS Agent Lifecycle 机器人智能体生命周期方案', 'ROS 2 + DDS Agent Lifecycle']],
    ['temporal-saga-durable-execution.mdx', ['Temporal Durable Execution + Saga 长事务执行方案', 'Temporal Durable Execution + Saga']],
  ]);
  for (const [file, [titleIdentity, sidebarIdentity]] of identities) {
    const metadata = parseFrontMatter(await readCase(file));
    assert.match(metadata.title, new RegExp(`^${titleIdentity.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}：\\p{Script=Han}`, 'u'), `${file}: title`);
    assert.equal(metadata.sidebar_label, sidebarIdentity, `${file}: sidebar_label`);
  }
});

test('keeps production-visible Task 8 prose free of mechanical script boundaries', async () => {
  for (const file of await task8Files()) {
    const source = await readFile(new URL(file, root), 'utf8');
    assert.deepEqual(linkBoundaryIssues(source, file), [], `${file}: link boundary`);
    assert.deepEqual(naturalCopyIssues(source, file), [], `${file}: natural copy`);
  }
});

test('scopes governed citation exemptions to the exact link node', () => {
  const governedUrl = 'https://developers.cloudflare.com/durable-objects/api/state/';

  assert.notDeepEqual(
    naturalCopyIssues(`[State](${governedUrl}) 有说明。\n\n普通 State状态 必须检查。`),
    [],
    'the same governed label outside the link must remain visible to prose checks',
  );
  assert.notDeepEqual(
    naturalCopyIssues('[State](https://example.com/wrong)状态'),
    [],
    'a correct label with the wrong URL must not be exempt',
  );
  assert.notDeepEqual(
    naturalCopyIssues(`[State Variant](${governedUrl})状态`),
    [],
    'a correct URL with the wrong label must not be exempt',
  );
  assert.deepEqual(naturalCopyIssues(`前文 [State](${governedUrl}) 后文`), []);
  assert.notDeepEqual(linkBoundaryIssues(`前文[State](${governedUrl}) 后文`), []);
  assert.notDeepEqual(linkBoundaryIssues(`前文 [State](${governedUrl})后文`), []);
});

test('rejects glued Markdown link seams while preserving exact governed labels', () => {
  const governedUrl = 'https://github.com/mehdihadeli/awesome-software-architecture';
  for (const source of [
    '前文[arc42](/inside)分别说明',
    `前文[Awesome Software Architecture](${governedUrl})后文`,
    `[Awesome Software Architecture](${governedUrl})可继续阅读`,
  ]) assert.notDeepEqual(linkBoundaryIssues(source), [], source);

  assert.deepEqual(linkBoundaryIssues('前文 [arc42](/inside) 分别说明'), []);
  assert.deepEqual(
    linkBoundaryIssues(`前文 [Awesome Software Architecture](${governedUrl}) 后文`),
    [],
  );
});

test('recognizes product, acronym, both slash styles, and repeated-word review candidates', () => {
  for (const candidate of ['New API通道', 'KubeEdge能', 'ROS 2用', '数据分发服务QoS']) {
    assert.match(candidate, latinHanBoundary, candidate);
  }
  for (const candidate of ['期望/报告状态', '客户端/ 智能体']) {
    assert.match(candidate, asciiProseSlash, candidate);
  }
  assert.match('数据数据', /(数据库|语言|存储|进程|数据|终端|接口|状态|服务|工作流|管理者)\1/u);
});

test('uses reviewed natural wording for known semantic seams and Kafka generations', async () => {
  const files = await Promise.all((await task8Files()).map(async (file) => [
    file,
    await readFile(new URL(file, root), 'utf8'),
  ]));
  const prose = files.map(([, source]) => source).join('\n');
  assert.doesNotMatch(prose, /Google ADK与A2A|A2A 与MCP|扇出\/ 扇入|图API|终止活终端|进度存存储|Temporal用/u);
  const kafka = await readCase('apache-kafka-consumer-groups.mdx');
  assert.doesNotMatch(kafka.replace(/`[^`]*`/gu, ''), /\bgeneration(?:s)?\b/iu);
  assert.match(kafka, /世代/u);
});

test('keeps Cloudflare Workers and workerd facts distinct from generic workers and languages', async () => {
  const source = await readCase('cloudflare-durable-objects-workerd.mdx');
  assert.match(source, /Cloudflare Workers/u);
  assert.match(source, /按名称获取`getByName\(name\)`是更短的等价入口/u);
  assert.doesNotMatch(source, /Cloudflare 工作进程（worker）/u);
  assert.match(source, /面向 JavaScript 与 WebAssembly 的开源服务端运行时（workerd）/u);
  assert.doesNotMatch(source, /开源 JavaScript (?:语言|编程语言)/u);
});

test('registers immutable official citation labels and localizes descriptive source labels', async () => {
  const ledger = JSON.parse(await readFile(new URL('data/source-ledger.json', root), 'utf8'));
  const byId = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, title] of [
    ['src-erlang-f24784704ffe', '— STDLIB'],
    ['src-single-spa-e413a44ee5ff', 'Applications API'],
    ['src-docs-135f0dce83d9', 'Virtual Keys'],
    ['src-github-bfb5499bfab6', '根 LICENSE'],
  ]) {
    assert.ok(byId.get(id).citation_titles?.includes(title), `${id}: ${title}`);
  }
  const erlang = await readCase('erlang-otp-supervision-tree.mdx');
  assert.match(erlang, /\[`restart\/2` 及策略 1472–1562\]\(/u);
  assert.doesNotMatch(erlang, /\[`restart\/2` 及 strategy 1472–1562\]\(/u);
});

test('preserves the reviewed Task 8 source-link labels together with their URLs', async () => {
  const expected = new Map([
    ['content/paths/01-architecture-thinking.mdx', [[
      'Awesome Software Architecture 的设计原则主题',
      'https://github.com/mehdihadeli/awesome-software-architecture#architectural-design-principles',
    ]]],
    ['content/paths/04-reliability-state.mdx', [[
      'Google SRE Workbook',
      'https://sre.google/workbook/table-of-contents/',
    ]]],
    ['content/paths/05-production-governance.mdx', [[
      'Google SRE Workbook',
      'https://sre.google/workbook/table-of-contents/',
    ]]],
    ['content/paths/07-cloud-native-platform.mdx', [[
      'Google SRE Workbook',
      'https://sre.google/workbook/table-of-contents/',
    ]]],
  ]);
  for (const [file, links] of expected) {
    const source = await readFile(new URL(file, root), 'utf8');
    const {ast} = parseMdxVisibleCopy(source, file, {includeAst: true});
    const actual = [];
    const visit = (node) => {
      if (node.type === 'link' && links.some(([, url]) => node.url === url)) {
        actual.push([node.children.map(({value = ''}) => value).join(''), node.url]);
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(ast);
    assert.deepEqual(actual, links, file);
  }
});

test('uses no terminology suppressions in Task 8 content', async () => {
  for (const file of await task8Files()) {
    const source = await readFile(new URL(file, root), 'utf8');
    assert.doesNotMatch(source, /terminology-exempt:/u, file);
  }
});

test('uses Chinese-primary control vocabulary in high-risk reader-facing copy', async () => {
  const [questions, openai, langgraph, singleSpa] = await Promise.all([
    readFile(new URL('content/questions/index.mdx', root), 'utf8'),
    readCase('openai-agents-sdk.mdx'),
    readCase('langgraph-supervisor.mdx'),
    readCase('micro-frontends-single-spa.mdx'),
  ]);

  assert.match(questions, /## 2\.[^\n]*多智能体管理者（Manager）[^\n]*移交（Handoff）/u);
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
  const officialIdentityTitles = new Set([
    'aws-cell-shuffle-sharding.mdx',
    'aws-cli-agent-orchestrator.mdx',
    'cloudflare-durable-objects-workerd.mdx',
    'google-adk-a2a.mdx',
    'kubeedge-cloud-edge-autonomy.mdx',
    'langgraph-supervisor.mdx',
    'ros2-dds-agent-lifecycle.mdx',
    'temporal-saga-durable-execution.mdx',
  ]);
  for (const file of (await task8Files()).filter((entry) => entry.startsWith('content/cases/') && entry !== 'content/cases/index.mdx')) {
    const source = await readFile(new URL(file, root), 'utf8');
    const title = parseFrontMatter(source).title;
    assert.match(title, /\p{Script=Han}/u, `${file}: Chinese-primary title`);
    if (!officialIdentityTitles.has(path.posix.basename(file))) {
      assert.doesNotMatch(title, /\b(?:Agent|Supervisor|Worker|Workflow|Handoff|Manager)\b/u, `${file}: untranslated title`);
    }
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
