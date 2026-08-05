# G008 Batch 10 MOD-12 Architecture Diagram Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish and close MOD-12 as an evidence-bounded architecture-diagram review method with two synchronized Draw.io/SVG teaching diagrams, two nine-row review tables, governed sources, reciprocal knowledge relations, exact production QA, and immutable Stage B evidence.

**Architecture:** Build one reviewed modeling article around four ordered review gates and nine explicit checks. A deliberately flawed MOD-02-derived Container diagram feeds a structured finding ledger, then a corrected diagram closes or preserves each finding without inventing protocols, trust, failure, deployment, or runtime facts. Stage A publishes the article as pending; only exact-head Pages deployment and measured desktop/mobile QA authorize Stage B closure.

**Tech Stack:** Docusaurus MDX, Node.js 26.5.0, Node test runner, Draw.io XML, accessible responsive SVG, repository content/source generators, GitHub Pages, Codex in-app Browser.

## Global Constraints

- Work only in `/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch10` on `codex/g008-modeling-batch10`.
- Baseline is `897c884387eda16527e76ede4686e38162469882` from `origin/main`; never merge the root checkout's concurrent local-main commits into this branch.
- Prefix every Node/npm command with `PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH`.
- Publish only MOD-12; MOD-13 remains pending, unlinked, and receives zero browser/operator actions.
- MOD-02 is authoritative for “费用申报系统”, “银行支付服务”, Person/Container/Data Store/External System roles, and the existing high-level relationship intents.
- Use exactly four review gates and nine explicit checks; use exactly two nine-row Markdown tables.
- Use exactly two synchronized Draw.io/SVG pairs under `diagrams/` and `static/img/diagrams/`; do not add raster assets, third-party icons, npm dependencies, or topic-relation overrides.
- Unsupported protocols, authentication, encryption, deployment, SLA, failover, failure isolation, and team ownership stay visibly `待确认`.
- Stage A projection is `50 / 93 / 490`; Stage B is `51 / 93 / 490`; durable stories stay `7 / 20`; G008 stays current; MOD-13 becomes next only after Stage B.
- Preserve root untracked `.codex/config.toml`, `static/img/illustrations/tego-arch-initial-release-roadmap.png`, and unrelated README/homepage commits without modification, staging, cleanup, reset, or representation as synchronized.

---

## File Responsibility Map

- `content/modeling/mod-12-architecture-diagram-review.mdx`: the only MOD-12 narrative, two table contracts, diagram placements, non-proof rules, exercise, relations, and visible sources.
- `tests/g008-batch10-content.test.mjs`: mutation-sensitive MOD-12 article, diagram, source, relation, and Stage A contracts.
- `diagrams/mod-12-architecture-review-problem.drawio` and `static/img/diagrams/mod-12-architecture-review-problem.svg`: editable/published flawed exercise pair.
- `diagrams/mod-12-architecture-review-corrected.drawio` and `static/img/diagrams/mod-12-architecture-review-corrected.svg`: editable/published corrected exercise pair.
- `data/source-ledger.json` and `data/source-link-health.json`: canonical C4 checklist/arc42 records, MOD-12 citations, and checked transports.
- `scripts/content-schema.mjs` and `tests/content-validation.test.mjs`: exact MOD-12 nine-heading schema.
- `content/modeling/mod-11-ddd-context-map.mdx`, `content/quality-attributes/qa-02-reliability-availability-recoverability.mdx`, and `content/quality-attributes/qa-05-security-privacy-trust.mdx`: only the three reciprocal-adjacency owners.
- `src/generated/project-status.json`, `src/generated/source-ledger.json`, `src/generated/topic-indexes.json`, and `src/generated/topic-manifest.json`: deterministic generated Stage A/Stage B projections.
- `docs/reviews/g008-batch10.md`, `docs/content-backlog.md`, and `tests/g008-batch10-deployment.test.mjs`: immutable measured Stage B evidence and closure.

---

### Task 1: Build the MOD-12 article and mutation-sensitive review contract

**Files:**
- Create: `tests/g008-batch10-content.test.mjs`
- Create: `content/modeling/mod-12-architecture-diagram-review.mdx`
- Read before drafting: `.codex/skills/writing-architecture-cases/references/article-contract.md`
- Read before Task 1 completion: `.codex/skills/writing-architecture-cases/references/review-checklist.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-08-05-g008-batch10-architecture-diagram-review-design.md`; MOD-02 authoritative labels; shared `handleHorizontalArrowKey(event)`.
- Produces: an article with exact metadata/headings, `reviewGateRows`, `findingRows`, exact image paths, wrapper labels, non-proof rules, seven-step exercise, and visible internal/source links for Tasks 2–3.

- [ ] **Step 1: Write the failing metadata, heading, gate, and severity contract**

Create the test with these exact top-level contracts:

```js
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
const document = documents.find(({file}) => file === 'modeling/mod-12-architecture-diagram-review.mdx');

const expectedMetadata = {
  title: '架构图审阅清单',
  slug: '/modeling/mod-12',
  content_type: 'modeling',
  status: 'reviewed',
  difficulty: 'intermediate',
  analyzed_at: '2026-08-05',
  source_cutoff: '2026-08-05',
  review_policy: 'quarterly-version-sensitive',
  confidence: 'high',
  domains: ['software-architecture'],
  agent_patterns: [],
  protocols: [],
  quality_attributes: ['understandability', 'maintainability', 'reliability', 'security'],
  tags: ['架构图', '架构评审', 'C4', '威胁建模'],
  summary: '用四道审阅门检查标题、范围、图例、边界、数据、协议、信任域、失败域和版本，并用问题图、发现台账与修正图完成复查。',
  topic_id: 'MOD-12',
  priority: 'P1',
  depends_on: ['MOD-01', 'MOD-02', 'MOD-03'],
  adjacent_topics: ['MOD-11', 'QA-02', 'QA-05'],
  related_cases: ['/cases/microsoft-multi-agent-reference-architecture'],
  related_questions: [],
};

const expectedHeadings = [
  '学习问题',
  '审阅目标与输入',
  '四道审阅门',
  '核心产物',
  '完成判断',
  '常见失败',
  '与其他模型的衔接',
  '完整演练',
  '来源',
];

const expectedGateChecks = new Map([
  ['身份与范围', ['标题', '范围', '版本']],
  ['表示与边界', ['图例', '边界']],
  ['运行与交换', ['数据', '协议']],
  ['风险与隔离', ['信任域', '失败域']],
]);

const expectedSeverities = new Map([
  ['标题', '重要'],
  ['范围', '阻断'],
  ['图例', '重要'],
  ['边界', '阻断'],
  ['数据', '阻断'],
  ['协议', '待澄清'],
  ['信任域', '阻断'],
  ['失败域', '阻断'],
  ['版本', '重要'],
]);
```

Add exact tests that require the document, compare `parseFrontMatter(document.source)` with `expectedMetadata`, compare all H2 values from `findMarkdownHeadings(document.body)`, require `4` learning questions, and count severities as `{阻断: 5, 重要: 3, 待澄清: 1}`.

- [ ] **Step 2: Run the focused test and prove RED**

Run:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch10-content.test.mjs
```

Expected: FAIL because `modeling/mod-12-architecture-diagram-review.mdx` does not exist.

- [ ] **Step 3: Add the exact table parser and failing row contracts**

Add this parser so the contract compares complete cell values rather than keyword counts:

```js
function markdownTables(body) {
  return [...body.matchAll(/(^\|[^\n]+\|\n^\|(?:\s*:?-+:?\s*\|)+\n(?:^\|[^\n]+\|\n?)+)/gmu)]
    .map(([source]) => {
      const lines = source.trim().split('\n');
      const headers = lines[0].split('|').slice(1, -1).map((cell) => cell.trim());
      return lines.slice(2).map((line) => Object.fromEntries(
        line.split('|').slice(1, -1).map((cell, index) => [headers[index], cell.trim()]),
      ));
    });
}

const expectedGateRows = [
  {'审阅门': '身份与范围', '检查项': '标题', '必须回答的问题': '图的类型、目标系统或主题，以及本图回答的主要问题是什么', '所需证据': '评审问题、目标受众、图类型与权威名称', '失败信号': '只有项目名或“架构图”', '明确不证明': '标题完整不等于图中事实正确'},
  {'审阅门': '身份与范围', '检查项': '范围', '必须回答的问题': '抽象层级、场景、环境、受众和非目标是什么', '所需证据': '模型类型、scope 声明、场景与环境记录', '失败信号': 'Context、Container、数据库和外部系统混在未说明层级', '明确不证明': '范围声明不批准边界或实现'},
  {'审阅门': '身份与范围', '检查项': '版本', '必须回答的问题': '这是 as-is、to-be 还是教学假设，事实截止和维护责任是什么', '所需证据': '修订号、日期、状态与责任类型', '失败信号': '没有状态、修订号、日期或责任类型', '明确不证明': '版本块不证明与代码、部署或运行一致'},
  {'审阅门': '表示与边界', '检查项': '图例', '必须回答的问题': '元素、线型、箭头、颜色、边框、缩写和尺寸分别表示什么', '所需证据': '图例与可独立复述的符号说明', '失败信号': '符号只能靠作者口头解释', '明确不证明': '图例完整不允许混用抽象层级'},
  {'审阅门': '表示与边界', '检查项': '边界', '必须回答的问题': '系统内外、外部参与者和当前抽象层级如何分开', '所需证据': 'MOD-02 权威系统边界与元素类型', '失败信号': '银行支付服务位于费用申报系统内部', '明确不证明': '系统边界不等于信任、部署、网络或组织边界'},
  {'审阅门': '运行与交换', '检查项': '数据', '必须回答的问题': '交换什么业务事实，方向、权威和消费责任是什么', '所需证据': '接口、数据、业务权威或可核验案例', '失败信号': '只有“使用”或无标签箭头', '明确不证明': '数据关系不等于所有权、一致性、事务或顺序'},
  {'审阅门': '运行与交换', '检查项': '协议', '必须回答的问题': '哪些协议、通道或同步异步语义已有证据', '所需证据': '接口契约、配置、运行或部署事实', '失败信号': '“同步/事件？”既暗示实现又没有依据', '明确不证明': '协议标签不证明实现、兼容性或运行健康'},
  {'审阅门': '风险与隔离', '检查项': '信任域', '必须回答的问题': '哪些跨界数据和候选信任边界需要安全证据', '所需证据': '身份、权限、数据分类、威胁和安全控制', '失败信号': '员工、本地系统和银行没有任何信任说明', '明确不证明': '系统或网络边界不自动成为信任边界'},
  {'审阅门': '风险与隔离', '检查项': '失败域', '必须回答的问题': '外部依赖、故障传播和候选失败边界在哪里', '所需证据': '部署、依赖、故障、恢复与演练记录', '失败信号': '本地执行器和银行被画成一个已隔离失败域', '明确不证明': '外部系统不自动证明故障隔离或切换'},
];

const expectedFindingRows = [
  {'检查项': '标题', '严重度': '重要', '图中证据': '标题只有“费用平台架构图”', '风险': '评审者不知道图类型和问题', '修复建议': '写明费用申报系统 Container 图和费用提交与支付协作问题', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
  {'检查项': '范围', '严重度': '阻断', '图中证据': '系统、Container、数据库和外部系统处于同一未说明层级', '风险': '把不同观察单位当成可直接比较的结构', '修复建议': '固定为 Container 图并声明 as-is 教学范围与非目标', '责任类型': '系统边界维护者', '复查状态': '已关闭'},
  {'检查项': '图例', '严重度': '重要', '图中证据': '元素类型、边框和线型没有说明', '风险': '图只能由作者口头解释', '修复建议': '增加 Person、Container、Data Store、External System 和边界图例', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
  {'检查项': '边界', '严重度': '阻断', '图中证据': '银行支付服务位于费用申报系统边界内', '风险': '错误分配系统责任和外部依赖', '修复建议': '恢复 MOD-02 权威系统边界并把银行移到边界外', '责任类型': '系统边界维护者', '复查状态': '已关闭'},
  {'检查项': '数据', '严重度': '阻断', '图中证据': '重要箭头没有业务事实、方向或权威说明', '风险': '无法判断数据责任和跨界含义', '修复建议': '写明提交申报、读写、支付任务、支付请求与外部结果证据', '责任类型': '接口契约责任人', '复查状态': '已关闭'},
  {'检查项': '协议', '严重度': '待澄清', '图中证据': '连线写成“同步/事件？”', '风险': '把猜测当成实现承诺', '修复建议': '删除猜测并统一标记“协议：待确认”', '责任类型': '接口契约责任人', '复查状态': '保留待澄清'},
  {'检查项': '信任域', '严重度': '阻断', '图中证据': '员工、费用申报系统和银行之间没有信任说明', '风险': '跨界数据与身份检查被隐藏', '修复建议': '标出候选信任边界并回链 QA-05 所需证据', '责任类型': '安全责任人', '复查状态': '保留待澄清'},
  {'检查项': '失败域', '严重度': '阻断', '图中证据': '支付任务执行器与银行被画成同一失败域', '风险': '误判故障隔离、传播和恢复责任', '修复建议': '只标外部依赖与候选失败边界，内部隔离继续待证', '责任类型': '可靠性责任人', '复查状态': '保留待澄清'},
  {'检查项': '版本', '严重度': '重要', '图中证据': '没有状态、修订号、日期和维护责任类型', '风险': '无法判断图适用时间和复查责任', '修复建议': '增加 as-is teaching exercise、rev 1、2026-08-05 和责任类型', '责任类型': '架构文档维护者', '复查状态': '已关闭'},
];
```

Require exactly two Markdown tables, deep-equal them to these arrays, require the first table to group exactly as `expectedGateChecks`, and require the second table to match `expectedSeverities` without extra rows.

- [ ] **Step 4: Create the minimum article shell and make structural tests GREEN**

Create the MDX with the exact front matter from `expectedMetadata`, import `handleHorizontalArrowKey`, add one H1 and the nine exact H2 headings. Under `四道审阅门`, wrap the exact `expectedGateRows` table in this keyboard-scrollable region:

```mdx
<div
  className="table-wrapper table-wrapper--mapping"
  role="region"
  aria-label="架构图九项审阅矩阵，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>

| 审阅门 | 检查项 | 必须回答的问题 | 所需证据 | 失败信号 | 明确不证明 |
| --- | --- | --- | --- | --- | --- |
| 身份与范围 | 标题 | 图的类型、目标系统或主题，以及本图回答的主要问题是什么 | 评审问题、目标受众、图类型与权威名称 | 只有项目名或“架构图” | 标题完整不等于图中事实正确 |
| 身份与范围 | 范围 | 抽象层级、场景、环境、受众和非目标是什么 | 模型类型、scope 声明、场景与环境记录 | Context、Container、数据库和外部系统混在未说明层级 | 范围声明不批准边界或实现 |
| 身份与范围 | 版本 | 这是 as-is、to-be 还是教学假设，事实截止和维护责任是什么 | 修订号、日期、状态与责任类型 | 没有状态、修订号、日期或责任类型 | 版本块不证明与代码、部署或运行一致 |
| 表示与边界 | 图例 | 元素、线型、箭头、颜色、边框、缩写和尺寸分别表示什么 | 图例与可独立复述的符号说明 | 符号只能靠作者口头解释 | 图例完整不允许混用抽象层级 |
| 表示与边界 | 边界 | 系统内外、外部参与者和当前抽象层级如何分开 | MOD-02 权威系统边界与元素类型 | 银行支付服务位于费用申报系统内部 | 系统边界不等于信任、部署、网络或组织边界 |
| 运行与交换 | 数据 | 交换什么业务事实，方向、权威和消费责任是什么 | 接口、数据、业务权威或可核验案例 | 只有“使用”或无标签箭头 | 数据关系不等于所有权、一致性、事务或顺序 |
| 运行与交换 | 协议 | 哪些协议、通道或同步异步语义已有证据 | 接口契约、配置、运行或部署事实 | “同步/事件？”既暗示实现又没有依据 | 协议标签不证明实现、兼容性或运行健康 |
| 风险与隔离 | 信任域 | 哪些跨界数据和候选信任边界需要安全证据 | 身份、权限、数据分类、威胁和安全控制 | 员工、本地系统和银行没有任何信任说明 | 系统或网络边界不自动成为信任边界 |
| 风险与隔离 | 失败域 | 外部依赖、故障传播和候选失败边界在哪里 | 部署、依赖、故障、恢复与演练记录 | 本地执行器和银行被画成一个已隔离失败域 | 外部系统不自动证明故障隔离或切换 |

</div>
```

Under `核心产物`, place these exact wrappers and image paths around the exact `expectedFindingRows` table:

```mdx
<div
  className="architecture-diagram-scroll"
  role="region"
  aria-label="故意含缺陷的费用申报系统架构图，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>

![故意混合层级、边界、数据、协议、信任域、失败域和版本信息的费用申报系统审阅练习图](/img/diagrams/mod-12-architecture-review-problem.svg)

</div>

<div
  className="table-wrapper table-wrapper--mapping"
  role="region"
  aria-label="架构图审阅发现台账，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>

| 检查项 | 严重度 | 图中证据 | 风险 | 修复建议 | 责任类型 | 复查状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 标题 | 重要 | 标题只有“费用平台架构图” | 评审者不知道图类型和问题 | 写明费用申报系统 Container 图和费用提交与支付协作问题 | 架构文档维护者 | 已关闭 |
| 范围 | 阻断 | 系统、Container、数据库和外部系统处于同一未说明层级 | 把不同观察单位当成可直接比较的结构 | 固定为 Container 图并声明 as-is 教学范围与非目标 | 系统边界维护者 | 已关闭 |
| 图例 | 重要 | 元素类型、边框和线型没有说明 | 图只能由作者口头解释 | 增加 Person、Container、Data Store、External System 和边界图例 | 架构文档维护者 | 已关闭 |
| 边界 | 阻断 | 银行支付服务位于费用申报系统边界内 | 错误分配系统责任和外部依赖 | 恢复 MOD-02 权威系统边界并把银行移到边界外 | 系统边界维护者 | 已关闭 |
| 数据 | 阻断 | 重要箭头没有业务事实、方向或权威说明 | 无法判断数据责任和跨界含义 | 写明提交申报、读写、支付任务、支付请求与外部结果证据 | 接口契约责任人 | 已关闭 |
| 协议 | 待澄清 | 连线写成“同步/事件？” | 把猜测当成实现承诺 | 删除猜测并统一标记“协议：待确认” | 接口契约责任人 | 保留待澄清 |
| 信任域 | 阻断 | 员工、费用申报系统和银行之间没有信任说明 | 跨界数据与身份检查被隐藏 | 标出候选信任边界并回链 QA-05 所需证据 | 安全责任人 | 保留待澄清 |
| 失败域 | 阻断 | 支付任务执行器与银行被画成同一失败域 | 误判故障隔离、传播和恢复责任 | 只标外部依赖与候选失败边界，内部隔离继续待证 | 可靠性责任人 | 保留待澄清 |
| 版本 | 重要 | 没有状态、修订号、日期和维护责任类型 | 无法判断图适用时间和复查责任 | 增加 as-is teaching exercise、rev 1、2026-08-05 和责任类型 | 架构文档维护者 | 已关闭 |

</div>

<div
  className="architecture-diagram-scroll"
  role="region"
  aria-label="修正后的费用申报系统架构图，可横向滚动"
  tabIndex={0}
  onKeyDown={handleHorizontalArrowKey}
>

![恢复 MOD-02 系统边界并明确未知协议、候选信任边界和候选失败边界的费用申报系统 Container 图](/img/diagrams/mod-12-architecture-review-corrected.svg)

</div>
```

- [ ] **Step 5: Add method, non-proof, relations, exercise, and source prose**

Require and write these exact non-proof sentences as visible standalone paragraphs:

```js
const nonProofSentences = [
  '标题完整不等于图中事实正确。',
  '图例完整不等于所有抽象层级可以混用。',
  '系统边界不等于信任边界、网络边界、部署边界或组织边界。',
  '数据关系不等于数据所有权、一致性、事务或运行顺序。',
  '协议标签不证明实现、配置、兼容性或运行健康。',
  'Container、Context、数据库或团队不存在自动一一映射。',
  '外部系统不自动构成独立失败域或完成故障隔离。',
  '版本块不证明图与当前代码、部署或运行状态一致。',
  '审阅清单不替代威胁建模、可靠性演练、代码检查、部署盘点或生产观测。',
];
```

Require and write this exact seven-step exercise:

1. `只看问题图，用一句话复述它声称回答的问题，并记录无法复述的部分。`
2. `执行身份与范围门，检查标题、范围和版本。`
3. `执行表示与边界门，检查图例和系统内外边界。`
4. `执行运行与交换门，检查数据事实、方向、权威和协议依据。`
5. `执行风险与隔离门，检查信任域、失败域和未知项。`
6. `将九条发现写入台账，分配严重度、责任类型和复查状态，再制作修正图。`
7. `由未参与修图的人重新复述，逐项关闭、保留或退回发现，并确认没有引入新事实。`

Require internal links to `/modeling`, MOD-01, MOD-02, MOD-03, MOD-04, MOD-11, QA-02, QA-05, and the Microsoft case. Require visible plain text `MOD-13`, zero `/modeling/mod-13` hrefs, and zero Markdown links whose label contains MOD-13.

Write four visible source bullets with these exact canonical URLs and boundaries:

- `https://c4model.com/diagrams/checklist`: supports the general checks for title, diagram type, scope, legend, element name/type/responsibility, relationship direction/label, and protocol when applicable; it does not supply or endorse the site's four-gate, nine-row method, examples, wording, or layout.
- `https://c4model.com/diagrams/notation`: supports self-describing notation, title, scope, legend, element type/responsibility, direction, and relationship labels; it does not prove this exercise diagram correct or readable.
- `https://docs.arc42.org/section-3/`: supports separating the system from communication partners, business inputs/outputs, technical channels/protocols, and business versus technical context; it does not supply the site's review matrix or exercise.
- `https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html`: supports modeling data flow and trust boundaries and keeping models updated/reviewed; it does not turn MOD-12 into a complete threat-modeling process or support failure-domain/version conclusions.

State that the four gates, nine-item matrix, severities, flawed and corrected diagrams, two tables, seven-step exercise, and Chinese prose are original synthesis. Keep all four citations as `facts-summary`; do not reproduce external tables, phrasing, layouts, templates, or examples.

- [ ] **Step 6: Add accessibility and controlled mutation tests**

Require exactly four wrapper labels:

```js
const expectedWrapperLabels = [
  '架构图九项审阅矩阵，可横向滚动',
  '故意含缺陷的费用申报系统架构图，可横向滚动',
  '架构图审阅发现台账，可横向滚动',
  '修正后的费用申报系统架构图，可横向滚动',
];
```

For each wrapper require `role="region"`, `tabIndex={0}`, and `onKeyDown={handleHorizontalArrowKey}`. Unit-test the shared handler with a directly focused overflowing element: ArrowRight moves `40`, ArrowLeft clamps at `0`, nested targets and non-overflow elements do not move.

Build a mutation table that separately removes or changes each H2, gate, check row, finding row, severity, wrapper attribute, non-proof sentence, exercise step, required relation, source URL, and forbidden MOD-13 href. Every controlled mutation must throw `AssertionError`.

- [ ] **Step 7: Run Task 1 verification and commit**

Run:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch10-content.test.mjs
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs \
  content/modeling/mod-12-architecture-diagram-review.mdx
git diff --check
```

Expected: focused tests PASS; density has no `missing-visual-content`, `duplicate-evidence-summary`, `repeated-evidence-label`, `missing-illustrative-label`, or `unanchored-evidence-card`; any long prose warning is reviewed rather than silently ignored.

Commit:

```bash
git add content/modeling/mod-12-architecture-diagram-review.mdx \
  tests/g008-batch10-content.test.mjs
git commit -m "docs: add mod12 architecture review"
```

---

### Task 2: Create, synchronize, and validate the two Draw.io/SVG pairs

**Files:**
- Create: `diagrams/mod-12-architecture-review-problem.drawio`
- Create: `static/img/diagrams/mod-12-architecture-review-problem.svg`
- Create: `diagrams/mod-12-architecture-review-corrected.drawio`
- Create: `static/img/diagrams/mod-12-architecture-review-corrected.svg`
- Modify: `tests/g008-batch10-content.test.mjs`
- Read before editing: `.codex/skills/creating-drawio-architecture-diagrams/references/layout-and-typography.md`
- Read before saving: `.codex/skills/creating-drawio-architecture-diagrams/references/repository-integration.md`

**Interfaces:**
- Consumes: exact image paths and labels from Task 1; MOD-02 source geometry/semantics; validator CLI.
- Produces: two `viewBox="0 0 1200 840"` semantic pairs with stable node IDs/positions, accessible SVG metadata, and measured geometry used by Task 5.

- [ ] **Step 1: Add failing pair and semantic-label tests**

Read both Draw.io and SVG files in the content test. Require each pair to exist, share the expected visible labels, use no fixed SVG `width`/`height`, and include SVG `role="img"`, `<title>`, `<desc>`, and `preserveAspectRatio="xMidYMid meet"`.

Use these exact semantic inventories:

```js
const commonNodes = [
  ['employee', '员工', 'PERSON'],
  ['web', 'Web 应用', 'CONTAINER'],
  ['api', '申报 API', 'CONTAINER'],
  ['database', '申报数据库', 'DATA STORE'],
  ['payment-worker', '支付任务执行器', 'CONTAINER'],
  ['bank', '银行支付服务', 'EXTERNAL SYSTEM'],
];

const problemLabels = [
  '费用平台架构图',
  '同步/事件？',
  ...commonNodes.flatMap(([, name, type]) => [name, type]),
];

const correctedLabels = [
  '费用申报系统 Container 图',
  '费用提交与支付协作',
  'as-is teaching exercise',
  'rev 1',
  '事实截止 2026-08-05',
  '协议：待确认',
  '候选信任边界',
  '候选失败边界',
  ...commonNodes.flatMap(([, name, type]) => [name, type]),
];
```

Run the focused test. Expected: FAIL because all four asset files are missing.

- [ ] **Step 2: Build the flawed pair with exact stable geometry**

Use a 1200×840 authoring canvas and left-to-right reading direction. Use these exact outer geometry anchors in both the Draw.io source and SVG export:

| Element | x | y | width | height |
| --- | ---: | ---: | ---: | ---: |
| title | 40 | 24 | 1120 | 64 |
| employee | 40 | 300 | 150 | 96 |
| system boundary | 180 | 140 | 950 | 500 |
| web | 240 | 260 | 160 | 104 |
| api | 470 | 260 | 160 | 104 |
| database | 470 | 460 | 160 | 104 |
| payment-worker | 700 | 260 | 180 | 104 |
| bank in wrong boundary | 920 | 260 | 170 | 104 |

The flawed pair visibly contains only the controlled defects: the vague title, no legend/version/trust/failure explanation, the bank inside the system boundary, unlabeled or ambiguous data responsibility, and one `同步/事件？` relationship label. It must not add fake capacity, instance, team, SLA, auth, encryption, or production claims.

- [ ] **Step 3: Build the corrected pair with the same comparison geometry**

Keep employee, web, API, database, and payment-worker at the same coordinates. Narrow the system boundary to `x=180, y=140, width=720, height=500`; move bank to `x=980, y=300, width=170, height=104`. Add a bottom legend from `x=40, y=680, width=1120, height=120`.

Use exact title text `费用申报系统 Container 图：费用提交与支付协作`, exact version text `as-is teaching exercise｜rev 1｜事实截止 2026-08-05｜维护责任：架构文档维护者`, and exact notes:

- `员工↔系统：候选信任边界；认证与授权证据待确认`
- `系统↔银行：候选信任边界；协议、加密与 SLA 待确认`
- `银行是外部依赖；候选失败边界，故障隔离与切换待确认`
- `内部 Container 是否独立失败域：待部署、运行与恢复证据确认`
- `所有跨进程协议：待确认`

Relationship labels remain evidence-bounded: `使用`, `提交申报`, `读写`, `创建支付任务`, `请求付款`; data annotations can add `费用资料`, `已提交的费用事实`, `支付任务`, `支付请求`, and `银行回执/查询结果`, but cannot add order, transaction, consistency, or delivery guarantees.

- [ ] **Step 4: Apply geometry and accessibility thresholds**

With `800 / 1200 = 2/3`, require final rendered CSS-pixel thresholds from the design: 16/14 node padding, 22 title/type baseline separation, 14 text-to-bottom clearance, 8 edge-label-to-stroke clearance, 16 edge-label-to-marker clearance, 12 edge-label-to-node clearance, 15 body/edge text, and 10 type/role text.

Use explicit orthogonal ports and connector-free label lanes. Do not use opaque backgrounds that erase a connector. Add textual type/role and dashed/solid semantics so color is never the only distinction.

- [ ] **Step 5: Run both validators and focused tests**

Run both complete validators with the pinned Node runtime:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/mod-12-architecture-review-problem.drawio \
  static/img/diagrams/mod-12-architecture-review-problem.svg \
  --label '费用平台架构图' \
  --label '员工' \
  --label 'Web 应用' \
  --label '申报 API' \
  --label '申报数据库' \
  --label '支付任务执行器' \
  --label '银行支付服务' \
  --label '同步/事件？'

PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/mod-12-architecture-review-corrected.drawio \
  static/img/diagrams/mod-12-architecture-review-corrected.svg \
  --label '费用申报系统 Container 图' \
  --label '员工' \
  --label 'Web 应用' \
  --label '申报 API' \
  --label '申报数据库' \
  --label '支付任务执行器' \
  --label '银行支付服务' \
  --label '协议：待确认' \
  --label '候选信任边界' \
  --label '候选失败边界'
```

Then run:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/drawio-diagram-validator.test.mjs \
  tests/g008-batch10-content.test.mjs
git diff --check
```

Expected: both validators PASS with every required label; both test files PASS.

- [ ] **Step 6: Render locally and record preliminary geometry evidence**

Run:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run build
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run serve -- \
  --host 127.0.0.1 --port 4173
```

In a real browser measure `/tego-arch/modeling/mod-12`: desktop 1440×1000 gives each SVG exactly 800px rendered width; mobile 390×844 gives local wrapper overflow, zero document overflow, readable labels, continuous connectors, and no clipped title/type text. Store preliminary evidence under ignored `.superpowers/sdd/task-2-diagram-qa.json`.

- [ ] **Step 7: Commit the diagram task**

```bash
git add diagrams/mod-12-architecture-review-problem.drawio \
  diagrams/mod-12-architecture-review-corrected.drawio \
  static/img/diagrams/mod-12-architecture-review-problem.svg \
  static/img/diagrams/mod-12-architecture-review-corrected.svg \
  tests/g008-batch10-content.test.mjs
git commit -m "docs: add mod12 review diagrams"
```

---

### Task 3: Govern sources, relations, heading schema, and Stage A projection

**Files:**
- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `content/modeling/mod-12-architecture-diagram-review.mdx`
- Modify: `content/modeling/mod-11-ddd-context-map.mdx`
- Modify: `content/quality-attributes/qa-02-reliability-availability-recoverability.mdx`
- Modify: `content/quality-attributes/qa-05-security-privacy-trust.mdx`
- Modify: `scripts/content-schema.mjs`
- Modify: `tests/content-validation.test.mjs`
- Modify: `tests/g008-batch10-content.test.mjs`
- Modify generated: `src/generated/project-status.json`
- Modify generated: `src/generated/source-ledger.json`
- Modify generated: `src/generated/topic-indexes.json`
- Modify generated: `src/generated/topic-manifest.json`
- Update only stale live-projection literals when generated output proves them stale: `tests/content-review-health.test.mjs`, `tests/g005-batch3-content.test.mjs`, `tests/g007-batch5-deployment.test.mjs`, `tests/g008-batch1-content.test.mjs`, `tests/g008-batch1-deployment.test.mjs`, `tests/g008-batch2-content.test.mjs`, `tests/g008-batch2-deployment.test.mjs`, `tests/g008-batch3-content.test.mjs`, `tests/g008-batch3-deployment.test.mjs`, `tests/g008-batch4-deployment.test.mjs`, `tests/g008-batch5-content.test.mjs`, `tests/g008-batch5-deployment.test.mjs`, `tests/g008-batch6-content.test.mjs`, `tests/g008-batch6-deployment.test.mjs`, `tests/g008-batch7-content.test.mjs`, `tests/g008-batch7-deployment.test.mjs`, `tests/g008-batch8-content.test.mjs`, `tests/g008-batch8-deployment.test.mjs`, `tests/g008-batch9-content.test.mjs`, `tests/g008-batch9-deployment.test.mjs`, `tests/project-status.test.mjs`, `tests/source-ledger-pagination.test.mjs`, `tests/source-ledger-rendering.test.mjs`

**Interfaces:**
- Consumes: Task 1 visible citations/relations; Task 2 original diagram rights; baseline `50 / 92 / 488`.
- Produces: validated `50 / 93 / 490` Stage A, exact MOD-12 heading schema, four governed citations, reciprocal relations, and healthy committed link cache.

- [ ] **Step 1: Add failing exact source-governance tests**

In the Batch 10 test, require these source IDs and canonical URLs:

```js
const expectedSources = new Map([
  ['src-c4model-review-checklist', 'https://c4model.com/diagrams/checklist'],
  ['src-c4model-notation', 'https://c4model.com/diagrams/notation'],
  ['src-arc42-context-scope-v9', 'https://docs.arc42.org/section-3/'],
  ['src-cheatsheetseries-ea079221bd09', 'https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html'],
]);
```

Require exactly one manifest primary (`src-c4model-review-checklist`), all four citations `usage_mode: facts-summary`, null excerpt/modification, `quotation_reviewed: false`, and visible source links in article source order.

- [ ] **Step 2: Add the two exact source records**

Insert these complete records into `data/source-ledger.json.sources` in canonical sort order:

```json
{
  "id": "src-c4model-review-checklist",
  "canonical_locator": "https://c4model.com/diagrams/checklist",
  "transport_locator": "https://c4model.com/diagrams/checklist",
  "query_insensitive": false,
  "locator_aliases": [],
  "tombstone": null,
  "title": "C4 Model — Software architecture diagram review checklist",
  "author_or_org": "Simon Brown",
  "published_at": null,
  "registered_at": "2026-08-05",
  "checked_at": "2026-08-05",
  "version": "Current review checklist checked on 2026-08-05",
  "source_kind": "official-docs",
  "tier": "primary",
  "allowed_evidence_roles": ["definition", "learning", "method"],
  "license": "CC-BY-4.0",
  "license_scope": "C4 Model site content covered by the CC BY 4.0 footer; trademarks, linked works, code, media, and third-party assets excluded",
  "license_evidence_url": "https://c4model.com/",
  "license_evidence_note": "The official C4 Model site footer identifies its content and example diagrams as CC BY 4.0; this record uses a factual summary with attribution.",
  "license_family_id": "https://c4model.com/diagrams/checklist",
  "license_family_grouping": "identity",
  "family_grouping_evidence_url": null,
  "copyright_policy": "adapt-with-attribution",
  "usage_boundary": "Supports title, type, scope, legend, element, relationship, and applicable protocol review questions; it does not make the Tego Arch four-gate method an official C4 checklist or certify a diagram.",
  "link_policy": "stable",
  "expected_final_transport_locator": "https://c4model.com/diagrams/checklist",
  "expected_final_approved_at": "2026-08-05",
  "expected_final_approval_note": "Reviewed the official C4 checklist HTTPS transport and CC BY 4.0 site footer on 2026-08-05."
}
```

```json
{
  "id": "src-arc42-context-scope-v9",
  "canonical_locator": "https://docs.arc42.org/section-3/",
  "transport_locator": "https://docs.arc42.org/section-3/",
  "query_insensitive": false,
  "locator_aliases": [],
  "tombstone": null,
  "title": "arc42 v9 — Context and Scope",
  "author_or_org": "arc42 contributors",
  "published_at": null,
  "registered_at": "2026-08-05",
  "checked_at": "2026-08-05",
  "version": "arc42 v9 section checked on 2026-08-05",
  "source_kind": "official-docs",
  "tier": "primary",
  "allowed_evidence_roles": ["definition", "learning", "method"],
  "license": "CC-BY-SA-4.0",
  "license_scope": "The named arc42 documentation page within the official CC BY-SA 4.0 scope; linked third-party works, trademarks, code, and separately licensed media excluded",
  "license_evidence_url": "https://arc42.org/license",
  "license_evidence_note": "The official arc42 license page identifies arc42 documentation as CC BY-SA 4.0.",
  "license_family_id": "https://docs.arc42.org/section-3/",
  "license_family_grouping": "identity",
  "family_grouping_evidence_url": null,
  "copyright_policy": "adapt-sharealike-review",
  "usage_boundary": "Supports factual summary of system scope, communication partners, business inputs/outputs, technical channels, and protocol context; it does not approve this project scope or authorize copying the template examples.",
  "link_policy": "stable",
  "expected_final_transport_locator": "https://docs.arc42.org/section-3/",
  "expected_final_approved_at": "2026-08-05",
  "expected_final_approval_note": "Reviewed the official arc42 v9 Context and Scope HTTPS transport and CC BY-SA 4.0 license evidence on 2026-08-05."
}
```

- [ ] **Step 3: Add the exact MOD-12 document citation review**

Insert under `data/source-ledger.json.documents`:

```json
"content/modeling/mod-12-architecture-diagram-review.mdx": {
  "reviewed_at": "2026-08-05",
  "copyright_checks": [
    "original-structure",
    "quotation-boundary",
    "attribution-complete",
    "illustration-rights"
  ],
  "citations": [
    {"source_id":"src-c4model-review-checklist","citation_url":"https://c4model.com/diagrams/checklist","roles":["definition","method","learning"],"manifest_primary":true,"usage_mode":"facts-summary","attribution_note":"Software architecture diagram review checklist, C4 Model / Simon Brown","modification_note":null,"excerpt":null,"quotation_reviewed":false},
    {"source_id":"src-c4model-notation","citation_url":"https://c4model.com/diagrams/notation","roles":["definition","method"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"C4 Model — Notation, Simon Brown","modification_note":null,"excerpt":null,"quotation_reviewed":false},
    {"source_id":"src-arc42-context-scope-v9","citation_url":"https://docs.arc42.org/section-3/","roles":["definition","method"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"arc42 v9 — Context and Scope, arc42 contributors","modification_note":null,"excerpt":null,"quotation_reviewed":false},
    {"source_id":"src-cheatsheetseries-ea079221bd09","citation_url":"https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html","roles":["definition","method","learning"],"manifest_primary":false,"usage_mode":"facts-summary","attribution_note":"Threat Modeling Cheat Sheet, OWASP Cheat Sheet Series","modification_note":null,"excerpt":null,"quotation_reviewed":false}
  ]
}
```

- [ ] **Step 4: Refresh and prove link health**

Run:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run refresh:links
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run check:links
```

Require the C4 checklist and arc42 Context/Scope transports to have committed current attempts accepted by their `stable` policy and exact final transports. If unrelated live origins fail during the full refresh, retain their previous reviewed cache observations and merge only real new attempts through the repository's exported `mergeLinkHealthCaches`; do not invent status or hand-edit attempt history.

- [ ] **Step 5: Add exact reciprocal and forward relationship contracts**

Update front matter and visible prose:

- MOD-11 adds MOD-12 to `adjacent_topics` and changes its plain future handoff to `[MOD-12 架构图审阅清单](/modeling/mod-12)` while retaining “candidate Context is not component decomposition”.
- QA-02 adds MOD-12 to `adjacent_topics` and one visible backlink stating that visual separation does not prove failure isolation, propagation limits, failover, or recovery.
- QA-05 adds MOD-12 to `adjacent_topics` and one visible backlink stating that system/network boundaries do not prove trust boundaries without identity, permission, data, and threat evidence.
- MOD-12 links MOD-04 as ordinary documentation/version context and keeps MOD-13 plain text only.

Test exact reciprocal front matter, visible backlinks, all nine MOD-12 links, zero relation override, and zero MOD-13 href.

- [ ] **Step 6: Register and test the exact MOD-12 heading schema**

Add to `scripts/content-schema.mjs`:

```js
export const mod12ModelingHeadings = [
  '## 学习问题',
  '## 审阅目标与输入',
  '## 四道审阅门',
  '## 核心产物',
  '## 完成判断',
  '## 常见失败',
  '## 与其他模型的衔接',
  '## 完整演练',
  '## 来源',
];
```

Return it from `knowledgeHeadingContract('modeling', 'MOD-12')`. Add validation tests for exact acceptance, one missing `四道审阅门`, and `四道审阅门`/`核心产物` reordered; require precise position errors.

- [ ] **Step 7: Generate and lock Stage A**

Run:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run generate:content
```

In Batch 10 tests require:

```js
assert.deepEqual(projectStatus, {
  completed_topics: 50,
  content_documents: 93,
  governed_sources: 490,
  durable_stories: {completed: 7, total: 20},
  current_goal: 'G008',
  next_topic: 'MOD-12',
});

const topicsById = new Map(topicManifest.topics.map((topic) => [topic.id, topic]));
assert.equal(topicsById.get('MOD-12').published, true);
assert.equal(topicsById.get('MOD-12').status.value, 'pending');
assert.equal(topicsById.get('MOD-13').published, false);
assert.equal(topicsById.get('MOD-13').status.value, 'pending');
```

Update only live current-state/count assertions proven stale by generated output. Preserve all historical Stage A/Stage B SHA, run, route, artifact, and count literals byte-for-byte.

- [ ] **Step 8: Verify and commit Task 3**

Run:

```bash
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH \
  node --test tests/g008-batch10-content.test.mjs \
  tests/content-validation.test.mjs \
  tests/content-review-health.test.mjs \
  tests/source-ledger.test.mjs \
  tests/source-link-health.test.mjs
PATH=/Users/seal/.volta/tools/image/node/26.5.0/bin:$PATH npm run verify
git diff --check
```

Expected: all targeted and full checks PASS; validation reports `93` documents and `490` sources; build succeeds. Record, but do not suppress, any existing Node 26 `localStorage` warning.

Commit every Task 3 tracked change, including generated projections and only justified live assertion updates:

```bash
git add content data scripts src/generated tests
git commit -m "docs: govern mod12 sources and relations"
```

---

### Task 4: Verify, independently review, and publish exact Stage A

**Files:**
- Create ignored report: `.superpowers/sdd/task-4-stagea-report.md`
- No tracked file is required unless review finds a defect.

**Interfaces:**
- Consumes: committed Task 3 HEAD, clean worktree, full verification, exact Stage A projection.
- Produces: exact Stage A SHA, successful Pages run ID/jobs, and a review-clean prerequisite for Task 5.

- [ ] **Step 1: Run fresh targeted and full verification**

Run both diagram validators, Batch 10/content-schema/source tests, density analysis, `npm run verify`, `git diff --check`, and `git status --short --branch`. Record exact test/document/source counts and both validator outputs in the report.

- [ ] **Step 2: Run independent cumulative review**

Review from baseline `897c884387eda16527e76ede4686e38162469882..HEAD` for spec compliance, factual scope, source/license boundaries, relation integrity, accessible geometry, TDD adequacy, generated-state integrity, historical evidence preservation, and accidental inclusion of root concurrent work. Require Critical `0` and Important `0`; fix and re-review otherwise.

- [ ] **Step 3: Publish exact Stage A**

Push `codex/g008-modeling-batch10`, then fast-forward `origin/main` only after proving `origin/main` is still an ancestor of HEAD. Use a normal non-force push. Do not checkout, merge, reset, clean, or modify the root local main.

Capture:

```bash
stage_a_sha=$(git rev-parse HEAD)
git rev-parse origin/codex/g008-modeling-batch10
git rev-parse origin/main
```

Require all three remote/feature values to equal `stage_a_sha` after publication.

- [ ] **Step 4: Wait for the exact Pages run**

Query GitHub Actions by `stage_a_sha`. Require workflow `Verify and deploy Docusaurus to GitHub Pages`, exact `headSha`, `status=completed`, `conclusion=success`, and successful build/deploy jobs. Record the numeric run ID and job IDs in the report.

---

### Task 5: Execute exact production browser QA

**Files:**
- Create ignored artifact: `.superpowers/sdd/task-5-final-browser-qa.json`
- Create ignored report: `.superpowers/sdd/task-5-browser-qa-report.md`
- No tracked file is required unless QA finds a defect.

**Interfaces:**
- Consumes: Task 4 exact Stage A SHA/run and live production at `https://sealday.github.io/tego-arch/`.
- Produces: immutable 13-page/2-asset route evidence, two-viewpoint geometry and interaction evidence, `8/8` sources, `24/24` relations, MOD-13 target `0`, diagnostics `0/0/0`, and artifact SHA-256.

- [ ] **Step 1: Verify all canonical page and asset routes**

Cache-bust and require HTTP 200 for these thirteen canonical page routes:

1. `/`
2. `/modeling`
3. `/modeling/mod-01`
4. `/modeling/mod-02`
5. `/modeling/mod-03`
6. `/modeling/mod-04`
7. `/modeling/mod-11`
8. `/modeling/mod-12`
9. `/quality-attributes/qa-02`
10. `/quality-attributes/qa-05`
11. `/cases/microsoft-multi-agent-reference-architecture`
12. `/references`
13. `/references/primary`

Also require HTTP 200 for `/img/diagrams/mod-12-architecture-review-problem.svg` and `/img/diagrams/mod-12-architecture-review-corrected.svg`. Record requested URL, final URL, status, and timestamp. Do not replace a failed canonical route with a redirecting or guessed alternative.

- [ ] **Step 2: Verify desktop and mobile content/geometry**

At desktop `1440x1000` and mobile `390x844`, verify exact H1/H2 sequence, four learning questions, four gates, both nine-row tables, both rendered SVGs, common node labels, problem defects, corrected labels, and MOD-02 authoritative names.

Measure per SVG: rendered width, viewBox width, authoring-to-rendered scale, named node title/type baselines, bottom clearance, every label-to-stroke/marker/node clearance, wrapper client/scroll width, and document client/scroll width. Desktop width must be exactly `800px`; mobile document overflow must be false and only focused wrappers may scroll.

- [ ] **Step 3: Activate every source and relation**

Use real browser clicks at both viewports. Activate the four source links once per viewport (`8/8`). Activate MOD-12's nine visible internal relations plus MOD-11, QA-02, and QA-05 reciprocal backlinks once per viewport (`24/24`). Record source IDs, requested/final URL, page title, and relation origin/target.

- [ ] **Step 4: Verify keyboard isolation, closed world, and diagnostics**

For both diagrams and both tables, focus the wrapper directly, require ArrowRight movement of `40px` only when overflow exists, ArrowLeft clamping at zero, and no document scroll. Record all attempted operator/browser targets and require no target equals `/modeling/mod-13`. Require `/modeling` to show MOD-12 published/pending and MOD-13 planned/non-actionable. Collect fresh console warnings, errors, and page errors from each viewport and require `0/0/0`.

- [ ] **Step 5: Freeze and review the artifact**

Serialize deterministic JSON with Stage A SHA/run, route evidence, both viewport objects, geometry, table rows, sources, relations, target ledger, diagnostics, and PASS booleans. Compute SHA-256 and independently review for exact counts, no symbolic values, no hidden failed actions, and no screenshot-only claims.

---

### Task 6: Record Stage B closure and deploy the final state

**Files:**
- Create: `tests/g008-batch10-deployment.test.mjs`
- Create: `docs/reviews/g008-batch10.md`
- Modify: `docs/content-backlog.md`
- Modify generated: `src/generated/project-status.json`
- Modify generated: `src/generated/topic-indexes.json`
- Modify generated: `src/generated/topic-manifest.json`
- Modify live current-state assertions only where required: the exact test files listed in Task 3 Step 7 plus `tests/g008-batch10-content.test.mjs`

**Interfaces:**
- Consumes: exact Stage A SHA/run/test count and Task 5 artifact hash/measured totals.
- Produces: immutable Batch 10 review, `51 / 93 / 490`, MOD-12 complete, MOD-13 pending/next, final deployed SHA.

- [ ] **Step 1: Write and prove the failing deployment contract**

Model the test after the immutable Batch 9 release contract, but use exact Batch 10 sections:

```js
const expectedReviewSections = [
  'Stage A identity',
  'Verification',
  'Independent review',
  'Production smoke',
  'Stage B projection',
  'Final PASS',
];

const expectedProjection = {
  completed_topics: 51,
  content_documents: 93,
  governed_sources: 490,
  durable_stories: {completed: 7, total: 20},
  current_goal: 'G008',
  next_topic: 'MOD-13',
};
```

Capture the exact 40-character Stage A SHA, numeric Pages run, exact repository test total, and 64-character Task 5 artifact hash from Tasks 4–5 and write them as immutable literals in the test. Reject symbolic tokens, duplicate sections, reordered/extra lines, weakened totals, and any value that does not match the committed review/backlog text.

Run the deployment test. Expected: FAIL because `docs/reviews/g008-batch10.md` and Batch 10 backlog closure do not yet exist.

- [ ] **Step 2: Create the exact review and backlog segment**

Create `docs/reviews/g008-batch10.md` with only the exact title and six ordered sections. Include exact Stage A identity, full verification counts, independent review `0/0/0` and CLEAR, thirteen page routes/two assets, both viewports, `2/2` Draw.io/SVG pairs, `2/2` tables with `9 + 9` rows, `8/8` source activations, `24/24` relation activations, MOD-13 target `0`, diagnostics `0/0/0`, artifact hash, Stage B `51 / 93 / 490`, durable `7 / 20`, current G008, next MOD-13, and `Stage B closure — PASS`.

Prepend one `2026-08-05 G008 Batch 10 已完成 MOD-12` current release segment to the backlog baseline, preserve the entire Batch 9-and-older suffix byte-for-byte, and change only MOD-12 from `[ ]` to `[x]`.

- [ ] **Step 3: Generate Stage B and update only live assertions**

Run `npm run generate:content`. Require MOD-12 published/complete, MOD-13 unpublished/pending, and exact `expectedProjection`. Add mutation cases for every review/backlog literal, each route/viewport/diagram/table/source/relation/diagnostic total, current/next state, and historical-suffix hash. Never rewrite Batch 9 or older historical evidence.

- [ ] **Step 4: Verify, review, and commit Stage B**

Run deployment/content/source/schema/drawio tests, both diagram validators, density, `npm run verify`, `git diff --check`, and clean-scope review. Require Critical `0`, Important `0`, no historical drift, and no root concurrent files in the commit.

Commit:

```bash
git add docs/content-backlog.md docs/reviews/g008-batch10.md \
  src/generated/project-status.json src/generated/topic-indexes.json \
  src/generated/topic-manifest.json tests
git commit -m "docs: close g008 batch10 architecture review"
```

- [ ] **Step 5: Publish and verify final exact-head production**

Push the feature branch and normally fast-forward `origin/main` from the feature ref after proving ancestry. Preserve local root main unchanged if it remains divergent. Wait for the final SHA's exact Pages run and require successful build/deploy jobs. Recheck all thirteen pages and both assets; `/modeling` must show MOD-12 linked/complete and MOD-13 planned/non-actionable.

---

### Task 7: Run final consistency audit and deliver

**Files:**
- Create ignored report: `.superpowers/sdd/final-audit-report.md`
- Modify tracked files only if the audit proves a defect.

**Interfaces:**
- Consumes: final committed branch, origin feature/main, final Pages run, production smoke, all Task reports.
- Produces: final 0/0/0 review verdict, clean feature worktree, protected root exception report, and completion evidence.

- [ ] **Step 1: Run fresh committed-HEAD verification**

From final HEAD run both diagram validators, Batch 10 content/deployment tests, all source/schema tests, density, `npm run verify`, and `git diff --check 897c884387eda16527e76ede4686e38162469882..HEAD`. Read every result after completion; do not reuse earlier output.

- [ ] **Step 2: Audit architecture, facts, licenses, visuals, and generated state**

Require Critical `0`, Important `0`, Minor `0`, Architecture CLEAR, Production readiness READY. Verify the C4 and arc42 license evidence, four citation boundaries, original diagram rights, no invented protocols/trust/failure claims, exact pair synchronization, nine-row tables, reciprocal links, MOD-13 closed world, immutable Batch 9 history, and exact `51 / 93 / 490` projection.

- [ ] **Step 3: Verify refs, deployment, and protected root state**

Require feature HEAD, origin feature, and freshly fetched origin/main to equal the final SHA. Verify final workflow/head/status/jobs, thirteen page routes, two SVG assets, linked complete MOD-12, and unlinked planned MOD-13. Record local root main and its unrelated files as a protected concurrent exception if it remains divergent; do not normalize it.

- [ ] **Step 4: Deliver exact evidence and preserve the worktree**

Report final SHA/run/jobs, fresh full verification count, `51 / 93 / 490`, durable `7 / 20`, current G008, next MOD-13, both diagram pairs, table/source/relation/diagnostic totals, Task 5 artifact hash, final review verdict, and any non-blocking Node warning. Preserve `codex/g008-modeling-batch10` and its worktree for auditability.
