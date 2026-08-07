# 中文优先术语治理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立注册表驱动的中文术语规范，发布 `/terminology` 正文页，清理首页、README、图示与全部现有正文，并用自动门禁阻止未说明英文再次进入产品。

**Architecture:** `data/terminology.json` 是唯一术语事实源；Node.js 解析器负责严格校验和生成索引，React 组件负责把同一数据投影为正文术语页。共享的可见文本提取模块为现有产品文案测试和新术语检查器提供一致的读者文本边界；检查器扫描 MDX、README、首页用户文案、Mermaid 与矢量图文字，位图继续使用闭集文字清单和视觉验收。

**Tech Stack:** Docusaurus 3、React 19、TypeScript、Node.js 原生测试运行器、`@mdx-js/mdx`、TypeScript 编译器 API、项目内 imagegen 与插图技能。

## Global Constraints

- 所有面向读者的英文术语首次出现时使用“中文（English）”；带缩写时使用“中文（English，ACRONYM）”。
- 同一页面后续只使用规范中文、已说明缩写或注册表允许的官方专名。
- 代码、命令、网址、路径、程序标识符、配置键、字段名和文献原题保持原样。
- 不修改现有 slug、外链、来源标识和历史 `docs/` 记录。
- 不使用机械全局替换，不自动修复术语问题，不新增运行时依赖。
- 新术语页 route 为 `/terminology`，标题和侧栏标签均为“术语规范”，位于根侧栏参考类内容之后，不新增顶部导航入口。
- 首页路线图把“基础与质量”替换为“需求与约束”，除文字外保持已批准构图、颜色和主题适配。
- 所有实现遵循测试先行；每个新行为必须先看到对应测试因预期原因失败。
- 完成标准是检查范围内零个未说明违规，不接受 baseline、snapshot 或整文件豁免。

---

### Task 1: 建立严格的术语注册表解析器

**Files:**
- Create: `scripts/terminology-registry.mjs`
- Create: `tests/terminology-registry.test.mjs`
- Create: `data/terminology.json`

**Interfaces:**
- Produces: `parseTerminologyRegistry(value, file)` → `{registry, byId, byAlias, errors}`
- Produces: `loadTerminologyRegistry(root)` → 同一结构的 Promise
- Consumes: 无；后续页面、检查器和测试都依赖此任务。

- [x] **Step 1: 写注册表解析失败测试**

在 `tests/terminology-registry.test.mjs` 中先写以下合同测试：

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {parseTerminologyRegistry} from '../scripts/terminology-registry.mjs';

const validEntry = {
  id: 'quality-attribute',
  canonical_zh: '质量属性',
  english: 'Quality Attribute',
  acronym: null,
  kind: 'translated-term',
  first_use: '质量属性（Quality Attribute）',
  subsequent_use: ['质量属性'],
  allowed_aliases: [],
  forbidden_aliases: ['quality attribute', 'Quality Attribute'],
  note: '描述系统在运行或演化中的关键特性，不简称为“质量”。',
  order: 10,
};

test('accepts and indexes a canonical terminology registry', () => {
  const result = parseTerminologyRegistry({schema_version: 1, terms: [validEntry]});
  assert.deepEqual(result.errors, []);
  assert.equal(result.byId.get('quality-attribute').canonical_zh, '质量属性');
  assert.equal(result.byAlias.get('quality attribute').id, 'quality-attribute');
});

test('collects exact-key, duplicate, alias-conflict, and display-contract errors', () => {
  const result = parseTerminologyRegistry({
    schema_version: 1,
    terms: [
      {...validEntry, extra: true},
      {...validEntry, id: 'second-term'},
      {...validEntry, id: 'third-term', order: 30, allowed_aliases: ['Quality Attribute']},
    ],
  });
  assert.ok(result.errors.some((error) => error.includes('unknown or missing fields')));
  assert.ok(result.errors.some((error) => error.includes('duplicate')));
  assert.ok(result.errors.some((error) => error.includes('both allowed and forbidden')));
});
```

- [x] **Step 2: 运行测试并确认 RED**

Run: `node --test tests/terminology-registry.test.mjs`

Expected: FAIL，原因是 `scripts/terminology-registry.mjs` 尚不存在。

- [x] **Step 3: 实现最小严格解析器**

`scripts/terminology-registry.mjs` 必须：

```js
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const entryKeys = [
  'id', 'canonical_zh', 'english', 'acronym', 'kind', 'first_use',
  'subsequent_use', 'allowed_aliases', 'forbidden_aliases', 'note', 'order',
];
const kinds = new Set([
  'translated-term', 'proper-noun', 'acronym', 'standard', 'code-literal',
]);
const prototypeNames = new Set(['__proto__', 'constructor', 'prototype']);
const normalizeAlias = (value) => value.normalize('NFC').trim().toLocaleLowerCase('en');
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const exactKeys = (value, keys) => isRecord(value)
  && Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
const isNonEmpty = (value) => typeof value === 'string' && value.trim() !== '';
const isNullableText = (value) => value === null || isNonEmpty(value);
const isTextArray = (value) => Array.isArray(value)
  && value.every((item) => isNonEmpty(item));

export function parseTerminologyRegistry(value, file = 'data/terminology.json') {
  const errors = [];
  const terms = [];
  const byId = new Map();
  const byAlias = new Map();
  const orders = new Set();
  if (!exactKeys(value, ['schema_version', 'terms'])) {
    return {
      registry: {schema_version: 1, terms: []}, byId, byAlias,
      errors: [`${file}: expected exactly schema_version and terms`],
    };
  }
  if (value.schema_version !== 1 || !Array.isArray(value.terms)) {
    return {
      registry: {schema_version: 1, terms: []}, byId, byAlias,
      errors: [`${file}: schema_version must equal 1 and terms must be an array`],
    };
  }
  for (const [index, entry] of value.terms.entries()) {
    const label = `${file}: term ${index + 1}`;
    if (!exactKeys(entry, entryKeys)) {
      errors.push(`${label} has unknown or missing fields`);
      continue;
    }
    const validId = isNonEmpty(entry.id)
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)
      && !prototypeNames.has(entry.id);
    if (!validId) errors.push(`${label} id must be non-prototype kebab-case`);
    if (validId && byId.has(entry.id)) errors.push(`${label} has duplicate id "${entry.id}"`);
    if (!isNonEmpty(entry.canonical_zh)
      || !isNullableText(entry.english)
      || !isNullableText(entry.acronym)
      || !kinds.has(entry.kind)
      || !isNonEmpty(entry.first_use)
      || !isTextArray(entry.subsequent_use)
      || !isTextArray(entry.allowed_aliases)
      || !isTextArray(entry.forbidden_aliases)
      || !isNonEmpty(entry.note)
      || !Number.isInteger(entry.order)
      || entry.order <= 0) {
      errors.push(`${label} has invalid field values`);
    }
    if (orders.has(entry.order)) errors.push(`${label} has duplicate order "${entry.order}"`);
    orders.add(entry.order);
    if (!entry.first_use.includes(entry.canonical_zh)
      || (entry.english !== null && !entry.first_use.includes(entry.english))
      || (entry.acronym !== null && !entry.first_use.includes(entry.acronym))) {
      errors.push(`${label} first_use must contain canonical_zh, english, and acronym when present`);
    }
    const allowed = [
      entry.canonical_zh, ...entry.subsequent_use, ...entry.allowed_aliases,
    ].filter(Boolean);
    const forbidden = entry.forbidden_aliases;
    const allowedKeys = new Set(allowed.map(normalizeAlias));
    for (const alias of forbidden) {
      if (allowedKeys.has(normalizeAlias(alias))) {
        errors.push(`${label} alias "${alias}" is both allowed and forbidden`);
      }
    }
    const normalized = {...entry};
    terms.push(normalized);
    if (validId && !byId.has(entry.id)) byId.set(entry.id, normalized);
    const lookupAliases = [entry.english, entry.acronym, ...allowed, ...forbidden].filter(Boolean);
    for (const alias of lookupAliases) {
      const key = normalizeAlias(alias);
      const existing = byAlias.get(key);
      if (existing && existing.id !== entry.id) {
        errors.push(`${label} alias "${alias}" conflicts with "${existing.id}"`);
      } else if (!existing) {
        byAlias.set(key, normalized);
      }
    }
  }
  terms.sort((left, right) => left.order - right.order);
  errors.sort((left, right) => left.localeCompare(right, 'en'));
  return {registry: {schema_version: 1, terms}, byId, byAlias, errors};
}

export async function loadTerminologyRegistry(root) {
  const file = path.join(root, 'data/terminology.json');
  const source = await readFile(file, 'utf8');
  return parseTerminologyRegistry(JSON.parse(source), 'data/terminology.json');
}
```

实现必须展开注释中的每条校验，不得用快照代替字段级断言。

- [x] **Step 4: 写入首批规范术语**

`data/terminology.json` 先登记后续基础设施和首页会直接使用的术语：

```json
{
  "schema_version": 1,
  "terms": [
    {
      "id": "quality-attribute",
      "canonical_zh": "质量属性",
      "english": "Quality Attribute",
      "acronym": null,
      "kind": "translated-term",
      "first_use": "质量属性（Quality Attribute）",
      "subsequent_use": ["质量属性"],
      "allowed_aliases": [],
      "forbidden_aliases": ["quality attribute", "Quality Attribute"],
      "note": "描述系统在运行或演化中的关键特性，不简称为“质量”。",
      "order": 10
    },
    {
      "id": "architecturally-significant-requirement",
      "canonical_zh": "架构重要需求",
      "english": "Architecturally Significant Requirement",
      "acronym": "ASR",
      "kind": "acronym",
      "first_use": "架构重要需求（Architecturally Significant Requirement，ASR）",
      "subsequent_use": ["架构重要需求", "ASR"],
      "allowed_aliases": [],
      "forbidden_aliases": ["architecture significant requirement"],
      "note": "指足以显著影响架构结构或关键决策的需求。",
      "order": 20
    },
    {
      "id": "tego-arch",
      "canonical_zh": "Tego Arch 架构知识项目",
      "english": "Tego Arch",
      "acronym": null,
      "kind": "proper-noun",
      "first_use": "Tego Arch 架构知识项目（Tego Arch）",
      "subsequent_use": ["Tego Arch", "本项目"],
      "allowed_aliases": ["Tego Arch"],
      "forbidden_aliases": [],
      "note": "项目官方名称保持不变，首次出现由中文上下文说明其用途。",
      "order": 30
    }
  ]
}
```

- [x] **Step 5: 运行测试并确认 GREEN**

Run: `node --test tests/terminology-registry.test.mjs`

Expected: PASS，且测试输出无警告。

- [x] **Step 6: Commit**

```bash
git add scripts/terminology-registry.mjs tests/terminology-registry.test.mjs data/terminology.json
git commit -m "feat(terminology): add canonical registry"
```

### Task 2: 发布注册表驱动的术语规范正文页

**Files:**
- Create: `src/components/TerminologyIndex/index.tsx`
- Create: `src/components/TerminologyIndex/styles.module.css`
- Create: `content/terminology.mdx`
- Create: `tests/terminology-page.test.mjs`
- Modify: `tests/sidebar-navigation.test.mjs`

**Interfaces:**
- Consumes: `data/terminology.json`
- Produces: `<TerminologyIndex />` 和 `/terminology`

- [x] **Step 1: 写页面与导航失败测试**

测试必须锁定 route、中文规则、单一数据源和侧栏位置：

```js
test('publishes one registry-driven terminology policy page', async () => {
  const [page, component] = await Promise.all([
    read('content/terminology.mdx'),
    read('src/components/TerminologyIndex/index.tsx'),
  ]);
  assert.match(page, /^title: 术语规范$/mu);
  assert.match(page, /^slug: \/terminology$/mu);
  assert.match(page, /^sidebar_position: 13$/mu);
  assert.match(page, /中文（English，ACRONYM）/u);
  assert.match(page, /<TerminologyIndex\s*\/>/u);
  assert.match(component, /data\/terminology\.json/u);
  assert.doesNotMatch(page, /\|\s*质量属性\s*\|/u);
});
```

`tests/sidebar-navigation.test.mjs` 的根入口合同新增：

```js
['content/terminology.mdx', 13, '术语规范'],
```

- [x] **Step 2: 运行测试并确认 RED**

Run: `node --test tests/terminology-page.test.mjs tests/sidebar-navigation.test.mjs`

Expected: FAIL，原因是页面和组件不存在。

- [x] **Step 3: 实现术语表组件**

组件直接消费注册表并输出可访问表格：

```tsx
import type {ReactNode} from 'react';
import terminology from '@site/data/terminology.json';
import styles from './styles.module.css';

export default function TerminologyIndex(): ReactNode {
  const terms = [...terminology.terms].sort((left, right) => left.order - right.order);
  return (
    <div className={styles.tableRegion} role="region" aria-label="规范术语表" tabIndex={0}>
      <table>
        <thead><tr><th>规范中文</th><th>首次出现</th><th>后续使用</th><th>使用边界</th></tr></thead>
        <tbody>{terms.map((term) => (
          <tr key={term.id}>
            <th scope="row">{term.canonical_zh}</th>
            <td>{term.first_use}</td>
            <td>{term.subsequent_use.join('、')}</td>
            <td>{term.note}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
```

CSS 只允许容器横向滚动，不允许整页溢出：

```css
.tableRegion { overflow-x: auto; max-width: 100%; }
.tableRegion table { min-width: 52rem; }
.tableRegion th, .tableRegion td { vertical-align: top; }
```

- [x] **Step 4: 创建正文页面**

`content/terminology.mdx` 使用完整 reference metadata，正文包含：中文优先、首次出现、后续使用、专名、缩写、代码与引用、图中文字、贡献流程，并以 `<TerminologyIndex />` 投影注册表。不得手写第二份术语表。

- [x] **Step 5: 运行聚焦测试与构建**

Run: `node --test tests/terminology-page.test.mjs tests/sidebar-navigation.test.mjs && npm run typecheck && npm run build`

Expected: PASS；`/terminology` 被 Docusaurus 构建且无 broken link。

- [x] **Step 6: Commit**

```bash
git add content/terminology.mdx src/components/TerminologyIndex tests/terminology-page.test.mjs tests/sidebar-navigation.test.mjs
git commit -m "feat(terminology): publish terminology policy page"
```

### Task 3: 抽取共享的读者可见文本解析模块

**Files:**
- Create: `scripts/visible-copy.mjs`
- Modify: `tests/product-copy-boundaries.test.mjs`
- Create: `tests/visible-copy.test.mjs`

**Interfaces:**
- Produces: `parseMdxVisibleCopy(source, relativePath)` → `{blocks, frontMatter}`
- Produces: `extractMermaidLabels(source, relativePath)` → label records
- Produces: `extractVisibleTsxStrings(source, relativePath)` → string records

- [x] **Step 1: 先运行现有回归测试并记录 GREEN**

Run: `node --test tests/product-copy-boundaries.test.mjs`

Expected: PASS。这是行为保持重构的基线。

- [x] **Step 2: 写共享模块的失败测试**

测试必须证明：可见正文、链接标签、图片 alt 和用户可见 front matter 被保留；代码、URL、路径、MDX 表达式和注释被排除；Mermaid 只返回标签；TSX 只返回可见属性、JSX 文本和 `title/term/description` 数据字段。

```js
const mdx = `---\ntitle: 示例 API\nslug: /example-api\n---\n\n正文 Agent，[官方标题](https://example.com)。\n\n\`const Agent = 1\`\n\n![Agent 图](./agent.png)\n\n\`\`\`mermaid\nflowchart LR\n  A[Agent worker] --> B[完成]\n\`\`\``;
const result = parseMdxVisibleCopy(mdx, 'content/example.mdx');
assert.deepEqual(result.frontMatter, [{field: 'title', text: '示例 API', line: 2}]);
assert.ok(result.blocks.some(({text}) => text.includes('正文 Agent')));
assert.ok(result.blocks.some(({text}) => text.includes('Agent 图')));
assert.ok(result.blocks.every(({text}) => !text.includes('const Agent')));
assert.deepEqual(extractMermaidLabels(mdx, 'content/example.mdx').map(({text}) => text), ['Agent worker', '完成']);
```

- [x] **Step 3: 运行测试并确认 RED**

Run: `node --test tests/visible-copy.test.mjs`

Expected: FAIL，原因是共享模块不存在。

- [x] **Step 4: 移动并扩展现有 AST 逻辑**

把 `tests/product-copy-boundaries.test.mjs` 中的 MDX 规范化、HTML comment 保护、AST 解析、可见 block 渲染和行号恢复逻辑移动到 `scripts/visible-copy.mjs`。现有测试改为导入共享函数，不保留第二份实现。

新增功能使用同一行号结构：

```js
{file: relativePath, line, text, excerpt, kind: 'body' | 'front-matter' | 'mermaid' | 'tsx'}
```

TSX 使用已安装的 `typescript` 编译器 API，收集 JSX 文本、`alt/title/label/description/aria-label` 属性，以及对象属性 `title/term/description` 的字符串值；排除 import、href、to、className 和资源路径。

- [x] **Step 5: 运行重构与新行为测试**

Run: `node --test tests/visible-copy.test.mjs tests/product-copy-boundaries.test.mjs`

Expected: PASS；现有文案边界行为不变。

- [x] **Step 6: Commit**

```bash
git add scripts/visible-copy.mjs tests/visible-copy.test.mjs tests/product-copy-boundaries.test.mjs
git commit -m "refactor(content): share visible copy parser"
```

### Task 4: 实现中文优先术语检查器

**Files:**
- Create: `scripts/check-terminology.mjs`
- Create: `tests/terminology-policy.test.mjs`
- Modify: `data/terminology.json`

**Interfaces:**
- Consumes: `loadTerminologyRegistry` 和 `scripts/visible-copy.mjs`
- Produces: `checkTerminology({root, paths})` → `{issues, checkedFiles}`
- Produces: CLI `node scripts/check-terminology.mjs [--paths <comma-list>]`

- [x] **Step 1: 写检查器正反例测试**

临时 fixture 必须覆盖：

```js
test('requires bilingual first use and permits registered subsequent use', async () => {
  const result = await checkFixture(`质量属性（Quality Attribute）决定取舍。后续质量属性继续使用。`);
  assert.deepEqual(result.issues, []);
});

test('reports bare, unknown, and premature acronym uses together', async () => {
  const result = await checkFixture(`Quality Attribute 与 ASR 影响 unknown worker。`);
  assert.deepEqual(result.issues.map(({ruleId}) => ({ruleId})), [
    {ruleId: 'bare-english-term'},
    {ruleId: 'first-use-required'},
    {ruleId: 'unknown-english-term'},
  ]);
});

test('exempts literals and official citation titles without exempting surrounding prose', async () => {
  const result = await checkFixture([
    '`retry_count`',
    '```bash\nnpm run verify\n```',
    '[Quality Attributes](https://www.sei.cmu.edu/library/quality-attributes/)',
  ].join('\n\n'));
  assert.deepEqual(result.issues, []);
});
```

另写 Mermaid、SVG/Draw.io、TSX、无理由 suppression 和一次输出全部命中的测试。

- [x] **Step 2: 运行测试并确认 RED**

Run: `node --test tests/terminology-policy.test.mjs`

Expected: FAIL，原因是检查器不存在。

- [x] **Step 3: 实现检查器**

检查器必须：

```js
export async function checkTerminology({root, paths = defaultPaths}) {
  const registry = await loadTerminologyRegistry(root);
  if (registry.errors.length) return {issues: registry.errors.map(registryIssue), checkedFiles: []};
  const records = await collectVisibleRecords(root, paths);
  const issues = records.flatMap((record) => inspectRecord(record, registry));
  return {
    issues: issues.sort(compareByFileLineRule),
    checkedFiles: [...new Set(records.map(({file}) => file))].sort(),
  };
}
```

规则顺序固定为：注册表错误、禁用别名、首次出现、未知英文、无效 suppression。每个 issue 含 `file`、`line`、`ruleId`、`matched`、`expected`。CLI 非零退出并输出全部问题；零问题时输出检查文件数和术语数。

局部例外语法固定为单次下一行：

```md
<!-- terminology-exempt: unknown-english-term | reason: 官方界面原始标签 -->
```

检查器消费一次后失效；空理由、未知规则、未命中下一行和整文件标记均失败。

- [x] **Step 4: 扩充基础术语注册表**

按下表登记跨页面核心术语。`first_use` 必须逐字使用表中形式；`subsequent_use` 为中文主称与缩写；英文全称及列出的英文短语进入 `forbidden_aliases`，只有产品专名可以进入 `allowed_aliases`：

| id | 规范中文 | 首次出现 |
| --- | --- | --- |
| `architecture-decision-record` | 架构决策记录 | 架构决策记录（Architecture Decision Record，ADR） |
| `quality-attribute-workshop` | 质量属性工作坊 | 质量属性工作坊（Quality Attribute Workshop，QAW） |
| `architecture-tradeoff-analysis-method` | 架构权衡分析方法 | 架构权衡分析方法（Architecture Tradeoff Analysis Method，ATAM） |
| `application-programming-interface` | 应用程序编程接口 | 应用程序编程接口（Application Programming Interface，API） |
| `hypertext-transfer-protocol` | 超文本传输协议 | 超文本传输协议（Hypertext Transfer Protocol，HTTP） |
| `uniform-resource-locator` | 统一资源定位符 | 统一资源定位符（Uniform Resource Locator，URL） |
| `c4-model` | C4 架构模型 | C4 架构模型（C4 Model） |
| `unified-modeling-language` | 统一建模语言 | 统一建模语言（Unified Modeling Language，UML） |
| `domain-driven-design` | 领域驱动设计 | 领域驱动设计（Domain-Driven Design，DDD） |
| `command-query-responsibility-segregation` | 命令查询职责分离 | 命令查询职责分离（Command Query Responsibility Segregation，CQRS） |
| `conflict-free-replicated-data-type` | 无冲突复制数据类型 | 无冲突复制数据类型（Conflict-free Replicated Data Type，CRDT） |
| `model-context-protocol` | 模型上下文协议 | 模型上下文协议（Model Context Protocol，MCP） |
| `agent-to-agent-protocol` | 智能体间协议 | 智能体间协议（Agent2Agent Protocol，A2A） |
| `retry` | 重试 | 重试（Retry） |
| `exponential-backoff` | 指数退避 | 指数退避（Exponential Backoff） |
| `jitter` | 抖动 | 抖动（Jitter） |
| `fail-fast` | 快速失败 | 快速失败（Fail Fast） |
| `fail-safe` | 故障安全 | 故障安全（Fail Safe） |
| `graceful-degradation` | 优雅降级 | 优雅降级（Graceful Degradation） |
| `human-in-the-loop` | 人在回路 | 人在回路（Human-in-the-loop） |
| `router` | 路由器 | 路由器（Router） |
| `supervisor` | 监督者 | 监督者（Supervisor） |
| `handoff` | 移交 | 移交（Handoff） |
| `fan-out-fan-in` | 扇出与扇入 | 扇出与扇入（Fan-out/Fan-in） |
| `checkpointer` | 检查点器 | 检查点器（Checkpointer） |
| `reducer` | 归约器 | 归约器（Reducer） |
| `workflow` | 工作流 | 工作流（Workflow） |
| `agent` | 智能体 | 智能体（Agent） |
| `software-development-kit` | 软件开发工具包 | 软件开发工具包（Software Development Kit，SDK） |

- [x] **Step 5: 运行 fixture 测试并生成首次仓库报告**

Run: `node --test tests/terminology-policy.test.mjs && node scripts/check-terminology.mjs --paths README.md,src/pages/index.tsx,content/intro.mdx`

Expected: fixture 测试 PASS；仓库命令因当前裸英文而非零退出，并一次列出首页、README 和 intro 的全部问题。

- [x] **Step 6: Commit**

```bash
git add scripts/check-terminology.mjs tests/terminology-policy.test.mjs data/terminology.json
git commit -m "feat(terminology): add Chinese-first policy checker"
```

### Task 5: 更新首页、README 与贡献入口的术语表达

**Files:**
- Modify: `tests/readme-homepage-contributing.test.mjs`
- Modify: `src/pages/index.tsx`
- Modify: `README.md`
- Modify: `.github/pull_request_template.md`
- Modify: `data/terminology.json`

**Interfaces:**
- Consumes: 术语检查 CLI
- Produces: 首页与 README 的零违规高可见文案

- [x] **Step 1: 先修改合同测试并确认 RED**

把测试期待改为：

```js
assert.match(homepage, /从需求与约束出发，经过建模、模式与治理，在案例和复盘中形成判断/u);
assert.match(homepage, /精选研究/u);
assert.match(homepage, /开放研究/u);
assert.doesNotMatch(homepage, /基础与质量|FEATURED NOTE|OPEN RESEARCH/u);
assert.match(readme, /术语规范/u);
assert.match(readme, /中文（English，ACRONYM）/u);
assert.match(readme, /新术语先登记/u);
```

三个方向的合同改为中文主称加首次括注，不再要求独立英文行。

Run: `node --test tests/readme-homepage-contributing.test.mjs`

Expected: FAIL，命中旧首页和 README。

- [x] **Step 2: 更新首页用户文案**

精确替换：

```tsx
description="从需求与约束出发，经过建模、模式与治理，在案例和复盘中形成判断"
alt="架构判断从需求与约束出发，经过建模、模式与治理，在案例和复盘中逐步形成"
<span className={styles.sectionLabel}>精选研究</span>
label="开放研究"
```

未来方向卡片使用单一可见名称，例如：

```ts
title: '架构决策速查（Architecture Decision Quick Reference）'
```

不再把英文副标渲染为独立层级；相应删除 `term` 字段和 `.futureTerm` 未使用样式。

- [x] **Step 3: 更新 README 与 PR 模板**

README 顶部增加 `[术语规范](https://sealday.github.io/tego-arch/terminology)`；贡献规则写明首次出现、专名例外、先登记后写作。三个未来方向把独立英文行合并到中文标题后的全角括号。

PR 模板新增：

```md
## 术语与中文表达检查

- [ ] 已检索 `/terminology` 与 `data/terminology.json`，正文使用规范中文主称。
- [ ] 新术语已先登记；首次出现使用“中文（English，ACRONYM）”。
- [ ] 产品专名、代码、引用和图中文字已按例外边界复核，没有裸英文说明文字。
```

- [x] **Step 4: 运行聚焦合同与术语检查**

Run: `node --test tests/readme-homepage-contributing.test.mjs && node scripts/check-terminology.mjs --paths README.md,src/pages/index.tsx`

Expected: PASS，零术语问题。

- [x] **Step 5: Commit**

```bash
git add src/pages/index.tsx src/pages/index.module.css README.md .github/pull_request_template.md data/terminology.json tests/readme-homepage-contributing.test.mjs
git commit -m "feat(copy): apply Chinese-first homepage terminology"
```

### Task 6: 中文化质量属性场景的固定结构

**Files:**
- Modify: `scripts/content-schema.mjs`
- Modify: `tests/content-validation.test.mjs`
- Modify: `tests/g006-batch1-content.test.mjs`
- Modify: `tests/g006-batch1-deployment.test.mjs`
- Modify: `content/quality-attributes/*.mdx`
- Modify: `data/terminology.json`

**Interfaces:**
- Produces: 六字段中文主称加英文首次括注的稳定 schema

- [x] **Step 1: 修改 schema 合同测试并确认 RED**

新合同：

```js
[
  '来源（Source）',
  '刺激（Stimulus）',
  '环境（Environment）',
  '对象（Artifact）',
  '响应（Response）',
  '响应度量（Response Measure）',
]
```

Run: `node --test tests/content-validation.test.mjs tests/g006-batch1-content.test.mjs`

Expected: FAIL，当前 schema 与 11 篇文章仍使用英文标题。

- [x] **Step 2: 原子更新 schema 与 11 篇文章**

把 `qualityAttributeScenarioHeadings` 和每篇质量属性正文中的六个 H3 同步替换为批准形式；正文后续提及字段时只使用中文。同步修正标题中的裸英文：

- `Safety、物理风险与控制约束` → `安全保障（Safety）、物理风险与控制约束`；
- `human in the loop` → 首次 `人在回路（Human-in-the-loop）`，后续“人在回路”；
- 其他 quality attribute 英文只在每页首次括注。

- [x] **Step 3: 运行目录级术语和内容合同**

Run: `node --test tests/content-validation.test.mjs tests/g006-batch1-content.test.mjs tests/g006-batch2-content.test.mjs tests/g006-batch3-content.test.mjs tests/g006-qa10-content.test.mjs && node scripts/check-terminology.mjs --paths content/quality-attributes`

Expected: PASS，质量属性目录零未说明英文。

- [x] **Step 4: Commit**

```bash
git add scripts/content-schema.mjs tests/content-validation.test.mjs tests/g006-*.test.mjs content/quality-attributes data/terminology.json
git commit -m "refactor(content): localize quality scenario vocabulary"
```

### Task 7: 清理概念、原则、方法、建模、模式与风格正文

**Files:**
- Modify: `content/concepts/**/*.mdx`
- Modify: `content/principles/**/*.mdx`
- Modify: `content/methods/**/*.mdx`
- Modify: `content/modeling/**/*.mdx`
- Modify: `content/patterns/**/*.mdx`
- Modify: `content/styles/**/*.mdx`
- Create: `tests/terminology-content-contract.test.mjs`
- Modify: `tests/g005-content.test.mjs`
- Modify: `tests/g005-batch2-content.test.mjs`
- Modify: `tests/g005-batch3-content.test.mjs`
- Modify: `tests/g006-batch1-content.test.mjs`
- Modify: `tests/g006-batch2-content.test.mjs`
- Modify: `tests/g006-batch3-content.test.mjs`
- Modify: `tests/g007-batch1-content.test.mjs`
- Modify: `tests/g007-batch2-content.test.mjs`
- Modify: `tests/g007-batch3-content.test.mjs`
- Modify: `tests/g007-batch4-content.test.mjs`
- Modify: `tests/g007-batch5-content.test.mjs`
- Modify: `tests/g008-batch1-content.test.mjs`
- Modify: `tests/g008-batch2-content.test.mjs`
- Modify: `tests/g008-batch3-content.test.mjs`
- Modify: `tests/g008-batch4-content.test.mjs`
- Modify: `tests/g008-batch5-content.test.mjs`
- Modify: `tests/g008-batch6-content.test.mjs`
- Modify: `tests/g008-batch7-content.test.mjs`
- Modify: `tests/g008-batch8-content.test.mjs`
- Modify: `tests/g008-batch9-content.test.mjs`
- Modify: `tests/g008-batch10-content.test.mjs`
- Modify: `tests/g008-batch11-content.test.mjs`
- Modify: `data/terminology.json`

**Interfaces:**
- Consumes: `check:terminology` 的目录过滤
- Produces: 六个知识域零未说明英文

- [x] **Step 1: 为已知标题改写添加失败合同**

测试至少锁定：

```js
[
  ['Persistence Ignorance', '持久化无知（Persistence Ignorance）'],
  ['Secure by Design', '安全内建（Secure by Design）'],
  ['Open/Closed 与 Interface Segregation', '开闭原则（Open/Closed Principle）与接口隔离原则（Interface Segregation Principle）'],
  ['Retry、Exponential Backoff 与 Jitter', '重试（Retry）、指数退避（Exponential Backoff）与抖动（Jitter）'],
  ['DDD Context Map 建模', '领域驱动设计上下文映射（DDD Context Map）'],
  ['Domain Storytelling 协作建模', '领域叙事（Domain Storytelling）协作建模'],
]
```

Run: `node --test tests/terminology-content-contract.test.mjs tests/g005*.test.mjs tests/g006*.test.mjs tests/g007*.test.mjs tests/g008*.test.mjs`

Expected: FAIL，当前标题仍使用裸英文。

- [x] **Step 2: 按目录逐页应用首次出现规则**

每页依次处理标题、summary、学习问题、正文、表格、alt、图注和 Mermaid 标签。不得改 slug、topic_id、source_id、代码、命令或外部引用原题。arc42 表格使用：

```text
介绍与目标（Introduction and Goals）
上下文与范围（Context and Scope）
质量要求（Quality Requirements）
风险与技术债务（Risks and Technical Debt）
术语表（Glossary）
```

模式目录中的 Router、Supervisor、Agents as Tools、Handoff、Fan-out/Fan-in、Evaluator-Optimizer、Hierarchical Teams 必须改为中文主称加首次英文括注，并登记后续允许形式。

- [x] **Step 3: 每完成一个目录即运行聚焦检查**

依次运行：

```bash
node scripts/check-terminology.mjs --paths content/concepts
node scripts/check-terminology.mjs --paths content/principles
node scripts/check-terminology.mjs --paths content/methods
node scripts/check-terminology.mjs --paths content/modeling
node scripts/check-terminology.mjs --paths content/patterns
node scripts/check-terminology.mjs --paths content/styles
```

Expected: 每条命令零 issue；相应内容测试全部 PASS。

- [x] **Step 4: Commit**

```bash
git add content/concepts content/principles content/methods content/modeling content/patterns content/styles data/terminology.json tests
git commit -m "refactor(content): standardize architecture terminology"
```

### Task 8: 清理导读、学习路径、设计题、资料页与案例正文

**Files:**
- Modify: `content/intro.mdx`
- Modify: `content/paths/**/*.mdx`
- Modify: `content/questions/**/*.mdx`
- Modify: `content/references/**/*.mdx`
- Modify: `content/cases/**/*.mdx`
- Modify: `tests/learning-path.test.mjs`
- Modify: `tests/case-prose-boundaries.test.mjs`
- Modify: `tests/case-writing-density.test.mjs`
- Modify: `tests/canonical-identity.test.mjs`
- Modify: `tests/sidebar-navigation.test.mjs`
- Modify: `tests/g007-batch1-content.test.mjs`
- Modify: `tests/g007-batch2-content.test.mjs`
- Modify: `tests/g007-batch3-content.test.mjs`
- Modify: `tests/g007-batch4-content.test.mjs`
- Modify: `tests/g007-batch5-content.test.mjs`
- Modify: `tests/g008-batch1-content.test.mjs`
- Modify: `tests/g008-batch2-content.test.mjs`
- Modify: `tests/g008-batch3-content.test.mjs`
- Modify: `tests/g008-batch4-content.test.mjs`
- Modify: `tests/g008-batch5-content.test.mjs`
- Modify: `tests/g008-batch6-content.test.mjs`
- Modify: `tests/g008-batch7-content.test.mjs`
- Modify: `tests/g008-batch8-content.test.mjs`
- Modify: `tests/g008-batch9-content.test.mjs`
- Modify: `tests/g008-batch10-content.test.mjs`
- Modify: `tests/g008-batch11-content.test.mjs`
- Modify: `data/terminology.json`

**Interfaces:**
- Produces: 剩余全部正文零未说明英文

- [x] **Step 1: 添加高风险混合用词失败合同**

测试锁定以下改写意图：

- Manager / Handoff 问题标题必须有中文主称；
- worker、workflow、guardrail、checkpointer、reducer、handoff、human-in-the-loop 首次出现必须双语；
- Mermaid `and 准备新应用` 改为 `并准备新应用`；
- Mermaid `Note` 与 `Fetch again from offset` 改为中文；
- case 标题保留官方产品名，但冒号后的判断句必须中文；
- 官方来源标题和 URL 保持原样。

Run: `node --test tests/learning-path.test.mjs tests/case-prose-boundaries.test.mjs tests/case-writing-density.test.mjs tests/canonical-identity.test.mjs tests/sidebar-navigation.test.mjs tests/g007*.test.mjs tests/g008*.test.mjs`

Expected: FAIL，至少命中已知混合表达。

- [x] **Step 2: 分三批清理并登记术语**

1. `intro`、`paths`、`questions`、`references`；
2. 智能体控制与工作流案例；
3. 分布式系统、前端、边缘与物理系统案例。

专名使用“中文类别说明（官方名称）”或“官方名称：中文判断句”；同一案例后续可保留官方专名。所有普通英文动作、角色和状态改为中文，只有在首次解释时保留括注。

- [x] **Step 3: 运行全部正文术语检查**

Run: `node scripts/check-terminology.mjs --paths content`

Expected: 检查 95 篇正文（含术语页），零 issue。

- [x] **Step 4: 运行内容测试**

Run: `npm run test && npm run validate:content && npm run check:content`

Expected: PASS；若标题测试失败，更新产品期待值而不是放宽规则。

- [x] **Step 5: Commit**

```bash
git add content data/terminology.json tests src/generated
git commit -m "refactor(content): complete Chinese-first terminology cleanup"
```

### Task 9: 编辑首页判断路径浅色与深色位图

**Files:**
- Modify: `static/img/illustrations/tego-arch-judgment-path-light.png`
- Modify: `static/img/illustrations/tego-arch-judgment-path-dark.png`
- Modify: `tests/readme-homepage-contributing.test.mjs`
- Create: `.superpowers/terminology-visual-qa.md`

**Interfaces:**
- Consumes: 既有两张路线图作为 edit targets
- Produces: 文字改为“需求与约束”的同构亮暗图

- [x] **Step 1: 阅读并执行必需视觉技能**

主执行者必须完整读取：

- `.codex/skills/illustrating-architecture-articles/SKILL.md`
- 其中要求的 `references/visual-language.md`
- `references/prompt-contract.md`
- `references/repository-integration.md`
- 系统 `imagegen/SKILL.md`

格式决策记录为 `位图`：该资产是概念性路线总结，且本次仅修改现有位图文字。

- [x] **Step 2: 写图片合同失败测试**

保留现有 PNG 尺寸与纯色边缘检查，并新增人工文字闭集报告合同：

```js
assert.match(report, /需求与约束/u);
assert.doesNotMatch(report, /基础与质量/u);
assert.match(report, /浅色.*PASS[\s\S]*深色.*PASS/u);
```

Run: `node --test tests/readme-homepage-contributing.test.mjs`

Expected: FAIL，视觉报告尚不存在。

- [x] **Step 3: 查看 edit targets 并调用 built-in imagegen**

先用 `view_image` 分别检查亮暗图。两张都作为 edit target；不得把一张仅当风格参考。

每次编辑使用以下不变量提示：

```text
Use case: text-localization
Asset type: Tego Arch homepage judgment-path infographic
Primary request: Replace only the label “基础与质量” with the exact Chinese label “需求与约束”.
Input image role: edit target.
Text (verbatim): “需求与约束”
Constraints: preserve every other label verbatim; preserve 1672×941 composition, node positions, arrows, hand-drawn texture, spacing, background, edge color, and theme palette; change no other pixels except those needed around the replaced label.
Avoid: new labels, English, watermark, signature, logo, status marks, changed topology, changed palette.
```

亮暗版本分别调用 built-in imagegen；生成后复制回项目路径。用户已经明确要求替换现有资产，因此允许覆盖这两个文件。

- [x] **Step 4: 视觉验收与报告**

在 `.superpowers/terminology-visual-qa.md` 记录：最终 prompt、edit target 角色、输出路径、六个闭集标签、亮暗背景 RGB、尺寸、桌面/手机可读性、无水印、无额外英文和禁用旧词。

用 `view_image` 检查两张最终图，并运行 PNG 边缘测试。

- [x] **Step 5: Commit**

```bash
git add static/img/illustrations/tego-arch-judgment-path-light.png static/img/illustrations/tego-arch-judgment-path-dark.png tests/readme-homepage-contributing.test.mjs .superpowers/terminology-visual-qa.md
git commit -m "fix(homepage): localize judgment path terminology"
```

### Task 10: 接入完整验证链并完成最终验收

**Files:**
- Modify: `package.json`
- Modify: `tests/workflow-configuration.test.mjs`
- Modify: `src/generated/*.json` as generated by existing scripts
- Modify: `docs/superpowers/plans/2026-08-07-chinese-first-terminology-governance.md` task checkboxes during execution

**Interfaces:**
- Produces: `npm run check:terminology` 与完整 `npm run verify` 门禁

- [x] **Step 1: 写 package/workflow 失败合同**

```js
assert.equal(packageJson.scripts['check:terminology'], 'node scripts/check-terminology.mjs');
assert.match(packageJson.scripts.verify, /npm run check:terminology/u);
```

Run: `node --test tests/workflow-configuration.test.mjs`

Expected: FAIL，脚本尚未接入。

- [x] **Step 2: 接入验证链**

`package.json` 新增：

```json
"check:terminology": "node scripts/check-terminology.mjs"
```

并在 `verify` 中把它放在 `validate:content` 之后、生成物检查之前：

```json
"verify": "npm run test && npm run validate:content && npm run check:terminology && npm run check:content && npm run check:links && npm run check:reviews && npm run typecheck && npm run build"
```

- [x] **Step 3: 重新生成内容投影**

Run: `npm run generate:content`

Expected: `src/generated/project-status.json` 的内容文档数从 94 更新为 95，其他生成物只反映批准的标题和术语变化。

- [x] **Step 4: 运行静态和完整验证**

依次运行：

```bash
node --check scripts/terminology-registry.mjs
node --check scripts/visible-copy.mjs
node --check scripts/check-terminology.mjs
npm run check:terminology
npm run verify
git diff --check
```

Expected: 全部退出 0；术语检查报告 95 篇正文及 README/首页零 issue；完整测试、内容验证、生成物、链接缓存、复核健康、类型检查和生产构建全部通过。

- [x] **Step 5: 进行浏览器视觉验收**

启动生产构建或本地站点，在浅色与深色主题分别检查：

- `/`：`1440×1000`、`390×844`；
- `/terminology`：`1440×1000`、`390×844`。

确认：首页无旧词和独立英文标签；路线图文字正确；术语表只在自身区域滚动；页面无横向溢出；控制台零 error；两个 route 均可从站内链接访问。

- [x] **Step 6: 最终范围与工作树检查**

Run: `git status --short --branch && git diff --stat HEAD~10..HEAD`

Expected: 只保留用户已有的 `.codex/config.toml` 未跟踪文件；没有临时图、生成器输出或未登记资产。

- [x] **Step 7: Commit**

```bash
git add package.json package-lock.json tests/workflow-configuration.test.mjs src/generated docs/superpowers/plans/2026-08-07-chinese-first-terminology-governance.md
git commit -m "feat(terminology): enforce Chinese-first content governance"
```

## Plan Self-Review

- Spec coverage: registry、术语页、首次出现、专名/代码/引用例外、首页、README、94 篇存量正文、QA 六字段、图示、贡献门禁、完整验证均有对应任务。
- Boundary consistency: `data/terminology.json` 是唯一事实源；页面和检查器不维护平行词表。
- Test order: 每个新行为先 RED，再实现 GREEN；行为保持的解析器抽取先运行已有回归测试。
- Scope control: 历史 `docs/`、slug、代码、URL、引用原题和来源身份保持不变。
- Remaining dynamic work: 存量未知英文由 Task 4 的确定性报告发现，再按 Task 6–8 的固定目录边界逐项审阅；验收仍为零 issue，不允许基线豁免。
