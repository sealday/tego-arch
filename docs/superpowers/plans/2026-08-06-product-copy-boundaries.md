# Product Copy Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove design-process and internal editorial-task language from the public homepage and content pages, then prevent the same categories from returning.

**Architecture:** Keep product wording checks in one Node test surface. The test scans the homepage source plus recursively discovered MDX files, masks non-visible MDX regions without changing line numbers, applies narrow contextual rules, and reports every issue with path, line, rule ID, and excerpt. Product copy changes remain in their existing page files; no runtime checker or dependency is added.

**Tech Stack:** Node.js 24, `node:test`, Docusaurus 3, React/TypeScript, MDX

## Global Constraints

- Do not add npm dependencies.
- Preserve the public project-progress link, but label it `查看项目进度`.
- Do not globally ban `本文`, `本站`, `backlog`, `TODO`, `pending`, or other single words.
- Preserve evidence scope, version boundaries, source labels, and legitimate architecture-domain terminology.
- Scan `src/pages/index.tsx` and recursively discovered `content/**/*.mdx`; do not scan `docs/` or collaboration artifacts.
- Ignore MDX front matter, fenced code, HTML comments, and Markdown link destinations while preserving source line numbers.
- A violation must report `<relative-path>:<line> [<rule-id>] <excerpt>`.
- Do not modify `.codex/config.toml`.

---

## File Map

- `tests/product-copy-boundaries.test.mjs` — owns recursive discovery, visible-MDX normalization, rule evaluation, fixture coverage, and the repository-wide product-copy gate.
- `tests/homepage-decision-observatory.test.mjs` — retains exact approved homepage copy contracts close to the homepage design tests.
- `src/pages/index.tsx` — owns homepage reader-facing copy and the public project-progress action.
- `content/{concepts,methods,modeling,principles,quality-attributes,styles}/index.mdx` — own reader-facing topic-directory introductions.
- `content/paths/{07-cloud-native-platform,08-collaborative-state-frontend,09-edge-physical-agents,10-agent-platform-gateway}.mdx` — own reader-facing extension questions.

### Task 1: Replace homepage design rationale with product copy

**Files:**
- Modify: `tests/homepage-decision-observatory.test.mjs`
- Modify: `src/pages/index.tsx`

**Interfaces:**
- Consumes: the existing `RoadmapSection` and `RoadmapStatusContent` components.
- Produces: exact homepage strings `初版沿一条可验证的研究路线展开，连接基础、建模、治理与学习闭环` and `查看项目进度` for the global copy gate in Task 2.

- [ ] **Step 1: Add a failing homepage copy test**

Append this test to `tests/homepage-decision-observatory.test.mjs`:

```js
test('keeps roadmap copy reader-facing instead of exposing design rationale', async () => {
  const homepage = await read('src/pages/index.tsx');

  assert.match(
    homepage,
    /初版沿一条可验证的研究路线展开，连接基础、建模、治理与学习闭环/u,
  );
  assert.match(homepage, />\s*查看项目进度\s*<span aria-hidden="true">↗<\/span>/u);

  for (const internalCopy of [
    '首页保留方向',
    '实时进度回到 backlog',
    '查看实时 backlog',
  ]) {
    assert.doesNotMatch(homepage, new RegExp(internalCopy, 'u'));
  }
});
```

- [ ] **Step 2: Run the test and verify the expected RED**

Run:

```bash
node --test tests/homepage-decision-observatory.test.mjs
```

Expected: FAIL in `keeps roadmap copy reader-facing instead of exposing design rationale`, showing the current roadmap description and action label.

- [ ] **Step 3: Replace only the two homepage strings**

In `src/pages/index.tsx`, update `RoadmapSection`:

```tsx
<SectionIntro
  id="roadmap-title"
  label="01 / 初版路线"
  title="一张持续展开的架构坐标"
  description="初版沿一条可验证的研究路线展开，连接基础、建模、治理与学习闭环"
/>
```

In `RoadmapStatusContent`, keep the destination and change only the action label:

```tsx
<Link href="https://github.com/sealday/tego-arch/blob/main/docs/content-backlog.md">
  查看项目进度 <span aria-hidden="true">↗</span>
</Link>
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
node --test tests/homepage-decision-observatory.test.mjs tests/homepage-status.test.mjs tests/readme-homepage-contributing.test.mjs
npm run typecheck
```

Expected: all focused tests pass and `tsc --noEmit` exits 0.

- [ ] **Step 5: Commit the homepage copy change**

```bash
git add src/pages/index.tsx tests/homepage-decision-observatory.test.mjs
git commit -m "fix(homepage): remove internal design rationale"
```

### Task 2: Add the product-copy scanner and clean topic directories

**Files:**
- Create: `tests/product-copy-boundaries.test.mjs`
- Modify: `content/concepts/index.mdx`
- Modify: `content/methods/index.mdx`
- Modify: `content/modeling/index.mdx`
- Modify: `content/principles/index.mdx`
- Modify: `content/quality-attributes/index.mdx`
- Modify: `content/styles/index.mdx`

**Interfaces:**
- Consumes: the clean homepage strings from Task 1 and all recursively discovered MDX files.
- Produces: `visibleMdxSource(source)`, `findProductCopyIssues(relativePath, source)`, and repository-wide failure output used by Task 3.

- [ ] **Step 1: Create the scanner test with exact contextual rules**

Create `tests/product-copy-boundaries.test.mjs`:

```js
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

const blankCharacters = (value) => value.replace(/[^\n]/gu, ' ');

const visibleMdxSource = (source) => {
  const lines = source.split('\n');

  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    assert.notEqual(end, -1, 'MDX front matter must have a closing delimiter');
    for (let index = 0; index <= end; index += 1) lines[index] = '';
  }

  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^\s*(`{3,}|~{3,})/u);
    if (!fence && opening) {
      fence = opening[1][0];
      lines[index] = '';
      continue;
    }
    if (fence) {
      const closing = new RegExp(`^\\s*${fence}{3,}\\s*$`, 'u');
      const closesFence = closing.test(lines[index]);
      lines[index] = '';
      if (closesFence) fence = null;
    }
  }

  assert.equal(fence, null, 'MDX fenced code block must have a closing delimiter');

  return lines
    .join('\n')
    .replace(/<!--[\s\S]*?-->/gu, blankCharacters)
    .replace(/(!?)\[([^\]\n]+)\]\([^\n)]+\)/gu, '$1$2');
};

const rules = [
  {
    id: 'homepage-design-rationale',
    applies: (file) => file === 'src/pages/index.tsx',
    pattern: /首页保留方向|实时进度回到\s*backlog/giu,
  },
  {
    id: 'homepage-internal-progress-label',
    applies: (file) => file === 'src/pages/index.tsx',
    pattern: /查看实时\s*backlog/giu,
  },
  {
    id: 'generated-page-meta',
    applies: (file) => file.endsWith('.mdx'),
    pattern: /本页从机器可读主题清单生成|计划主题[^。\n]{0,40}长期\s+backlog\s+跟踪/giu,
  },
];

const findProductCopyIssues = (relativePath, source) => {
  const visible = relativePath.endsWith('.mdx') ? visibleMdxSource(source) : source;
  const issues = [];

  for (const rule of rules) {
    if (!rule.applies(relativePath)) continue;
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of visible.matchAll(pattern)) {
      const line = visible.slice(0, match.index).split('\n').length;
      issues.push({
        file: relativePath,
        line,
        ruleId: rule.id,
        excerpt: visible.split('\n')[line - 1].trim(),
      });
    }
  }

  return issues;
};

const walkMdx = async (directory) => {
  const entries = await readdir(directory, {withFileTypes: true});
  const nested = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return walkMdx(absolute);
        return entry.isFile() && entry.name.endsWith('.mdx') ? [absolute] : [];
      }),
  );
  return nested.flat();
};

test('normalizes only non-visible MDX regions', () => {
  const fixture = `---
title: 首页保留方向
---

本文以固定版本为证据范围。Kafka queue backlog 是领域术语。

\`\`\`text
查看实时 backlog
TODO from upstream
\`\`\`

<!-- 本页从机器可读主题清单生成 -->
[上游 TODO](https://example.com/长期-backlog)
`;

  assert.deepEqual(findProductCopyIssues('content/cases/example.mdx', fixture), []);
});

test('reports rule id, line, and excerpt for product-process language', () => {
  const fixture = `# 架构方法

本页从机器可读主题清单生成。计划主题仍由长期 backlog 跟踪。
`;
  const issues = findProductCopyIssues('content/methods/index.mdx', fixture);

  assert.deepEqual(issues.map(({line, ruleId}) => ({line, ruleId})), [
    {line: 3, ruleId: 'generated-page-meta'},
    {line: 3, ruleId: 'generated-page-meta'},
  ]);
  assert.ok(issues.every(({excerpt}) => excerpt.startsWith('本页从机器可读主题清单生成')));
});

test('keeps public pages free of internal product-process language', async () => {
  const mdxFiles = await walkMdx(path.join(repositoryRoot, 'content'));
  const relativeFiles = [
    'src/pages/index.tsx',
    ...mdxFiles.map((file) => path.relative(repositoryRoot, file)),
  ];
  const issues = (
    await Promise.all(
      relativeFiles.map(async (file) =>
        findProductCopyIssues(file, await readFile(path.join(repositoryRoot, file), 'utf8')),
      ),
    )
  ).flat();

  assert.equal(
    issues.length,
    0,
    `Internal product-process language found:\n${issues
      .map(({file, line, ruleId, excerpt}) => `${file}:${line} [${ruleId}] ${excerpt}`)
      .join('\n')}`,
  );
});
```

- [ ] **Step 2: Run the new test and verify the expected RED**

Run:

```bash
node --test tests/product-copy-boundaries.test.mjs
```

Expected: the fixture tests pass; the repository test fails with 12 `generated-page-meta` issues across the six topic index files, each including path, line, rule ID, and excerpt.

- [ ] **Step 3: Replace the six implementation-facing introductions**

In each listed topic index, replace the existing paragraph after its H1 with exactly:

```mdx
选择已发布主题进入正文，并沿关联内容继续学习。
```

Do not change front matter, the H1, the `TopicIndex` import, or its `type` prop.

- [ ] **Step 4: Run scanner and content validation**

Run:

```bash
node --test tests/product-copy-boundaries.test.mjs
npm run validate:content
npm run check:content
```

Expected: scanner tests pass; all content documents and registered sources validate; generated artifacts are current.

- [ ] **Step 5: Commit the scanner and directory copy**

```bash
git add tests/product-copy-boundaries.test.mjs \
  content/concepts/index.mdx \
  content/methods/index.mdx \
  content/modeling/index.mdx \
  content/principles/index.mdx \
  content/quality-attributes/index.mdx \
  content/styles/index.mdx
git commit -m "test(content): enforce product copy boundaries"
```

### Task 3: Convert learning-path backlog items into extension questions

**Files:**
- Modify: `tests/product-copy-boundaries.test.mjs`
- Modify: `content/paths/07-cloud-native-platform.mdx`
- Modify: `content/paths/08-collaborative-state-frontend.mdx`
- Modify: `content/paths/09-edge-physical-agents.mdx`
- Modify: `content/paths/10-agent-platform-gateway.mdx`

**Interfaces:**
- Consumes: `rules` and `findProductCopyIssues` from Task 2.
- Produces: repository-wide enforcement for internal editorial headings and task-style bullets, with task bullets scoped to the `后续待补` section rather than banned globally.

- [ ] **Step 1: Add a contextual matcher for editorial task sections**

Add this helper before `rules` in `tests/product-copy-boundaries.test.mjs`:

```js
const findEditorialTaskItems = (source) => {
  const matches = [];
  let offset = 0;
  let insideEditorialSection = false;

  for (const line of source.split('\n')) {
    const sectionHeading = line.match(/^(#{1,2})\s+(.+?)\s*$/u);
    if (sectionHeading) {
      insideEditorialSection =
        sectionHeading[1] === '##' && sectionHeading[2] === '后续待补';
    }

    if (insideEditorialSection) {
      const item = line.match(/^-\s+补充[^\n]+$/u);
      if (item) matches.push({index: offset + item.index, text: item[0]});
    }

    offset += line.length + 1;
  }

  return matches;
};
```

In `findProductCopyIssues`, replace the direct `matchAll` loop:

```js
const matches = rule.find
  ? rule.find(visible)
  : visible.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));

for (const match of matches) {
  const line = visible.slice(0, match.index).split('\n').length;
  issues.push({
    file: relativePath,
    line,
    ruleId: rule.id,
    excerpt: visible.split('\n')[line - 1].trim(),
  });
}
```

Then add these two entries to `rules`:

```js
{
  id: 'editorial-todo-heading',
  applies: (file) => file.endsWith('.mdx'),
  pattern: /^##\s+后续待补\s*$/gmu,
},
{
  id: 'editorial-task-item',
  applies: (file) => file.endsWith('.mdx'),
  find: findEditorialTaskItems,
},
```

Extend `reports rule id, line, and excerpt for product-process language` with a second fixture:

```js
const pathFixture = `# 云原生与平台

## 后续待补

- 补充镜像供应链案例。
`;
assert.deepEqual(
  findProductCopyIssues('content/paths/example.mdx', pathFixture).map(({ruleId}) => ruleId),
  ['editorial-todo-heading', 'editorial-task-item'],
);

const legitimatePathFixture = `# 容量设计

- 补充容量用于吸收短时突发，并不是编辑任务。

## 延伸问题

- 补充容量应由哪些负载信号决定？
`;
assert.deepEqual(
  findProductCopyIssues('content/paths/example.mdx', legitimatePathFixture),
  [],
);
```

- [ ] **Step 2: Run the scanner and verify the expected RED**

Run:

```bash
node --test tests/product-copy-boundaries.test.mjs
```

Expected: FAIL with four `editorial-todo-heading` findings and 21 `editorial-task-item` findings across the four learning-path files.

- [ ] **Step 3: Rewrite cloud-native extension questions**

Replace the `后续待补` section in `content/paths/07-cloud-native-platform.mdx` with:

```mdx
## 延伸问题

- 镜像供应链、签名验证、制品晋级与运行时准入如何形成端到端证据链？
- 服务网格、Gateway API 与多集群流量切换分别在哪些故障边界生效？
- HPA、VPA、集群扩容与队列背压同时作用时，容量决策应以哪些信号为准？
- GitOps 漂移、IaC 状态和平台 API 版本分别由谁拥有？
- SLI、错误预算、发布暂停与复盘怎样形成可验证闭环？
```

- [ ] **Step 4: Rewrite collaborative-state extension questions**

Replace the section in `content/paths/08-collaborative-state-frontend.mdx` with:

```mdx
## 延伸问题

- 在同一编辑场景中，OT 与主流 CRDT 的操作语义和失败窗口有哪些差异？
- 离线队列、快照压缩、增量同步与服务端持久化如何共同支持恢复？
- 权限撤销与离线编辑相遇时，系统在哪里重新授权、拒绝并留下审计证据？
- 评论、审批、删除与唯一约束等语义冲突由谁裁决？
- 共享依赖升级、跨微前端通信与 shell 故障如何被隔离和复盘？
```

- [ ] **Step 5: Rewrite edge-system extension questions**

Replace the section in `content/paths/09-edge-physical-agents.mdx` with:

```mdx
## 延伸问题

- 云边模型、工具与配置包如何完成签名分发、版本回滚和反回滚保护？
- 长时间断网后，冲突分类、审计重放和人工裁决怎样形成闭环？
- ROS 2 执行器、实时操作系统与设备总线之间的延迟预算如何测量和分配？
- 急停、限位、硬件联锁与软件降级路径如何保持相互独立？
- 多边缘节点在网络分区下如何避免重复物理任务和双重控制？
```

- [ ] **Step 6: Rewrite Agent-platform extension questions**

Replace the section in `content/paths/10-agent-platform-gateway.mdx` with:

```mdx
## 延伸问题

- 跨供应商模型能力、语义回退与数据驻留约束如何被验证？
- 端用户、服务、Agent、工具与上游模型之间如何委托和撤销身份？
- 输入、输出、工具执行与人工审批的多层 Guardrail 如何接受绕过测试和审计？
- A2A 与 MCP 如何协商版本、发现能力、授权调用并从失败中恢复？
- 离线评估、在线反馈、追踪、成本与安全事件如何关联到同一任务？
- 多租户执行沙箱、缓存和记忆如何防止泄漏并限制故障半径？
```

- [ ] **Step 7: Run the scanner and content checks**

Run:

```bash
node --test tests/product-copy-boundaries.test.mjs
npm run validate:content
npm run check:content
```

Expected: all scanner tests pass; content and generated-artifact checks pass without modifying article facts or metadata.

- [ ] **Step 8: Commit the learning-path rewrite**

```bash
git add tests/product-copy-boundaries.test.mjs \
  content/paths/07-cloud-native-platform.mdx \
  content/paths/08-collaborative-state-frontend.mdx \
  content/paths/09-edge-physical-agents.mdx \
  content/paths/10-agent-platform-gateway.mdx
git commit -m "fix(content): replace editorial backlog with reader questions"
```

### Task 4: Run full verification and final review

**Files:**
- Verify: all files changed in Tasks 1–3
- Modify only if a verification or review finding requires a fix

**Interfaces:**
- Consumes: the complete product-copy gate and reader-facing copy.
- Produces: fresh merge-readiness evidence.

- [ ] **Step 1: Run the focused copy and homepage suite**

```bash
node --test \
  tests/product-copy-boundaries.test.mjs \
  tests/homepage-decision-observatory.test.mjs \
  tests/homepage-status.test.mjs \
  tests/readme-homepage-contributing.test.mjs
```

Expected: all focused tests pass with zero skipped tests.

- [ ] **Step 2: Run the full repository gate**

```bash
npm run verify
```

Expected: all Node tests, content validation, generated-content checks, offline link checks, review health, TypeScript, and production build pass.

- [ ] **Step 3: Run direct leakage and cleanliness checks**

```bash
if rg -n \
  '首页保留方向|实时进度回到 backlog|查看实时 backlog|本页从机器可读主题清单生成|长期 backlog 跟踪' \
  src/pages/index.tsx \
  content/{concepts,methods,modeling,principles,quality-attributes,styles}/index.mdx; then
  echo 'FAIL: internal product-process copy remains'
  exit 1
fi

if rg -n \
  '^## 后续待补$|^- 补充' \
  content/paths/{07-cloud-native-platform,08-collaborative-state-frontend,09-edge-physical-agents,10-agent-platform-gateway}.mdx; then
  echo 'FAIL: internal product-process copy remains'
  exit 1
fi

git diff --check
git status --short
```

Expected: no leakage match; no whitespace errors; only the user's existing untracked `.codex/config.toml` may remain outside the implementation worktree.

- [ ] **Step 4: Request a whole-change review**

The reviewer must verify:

- every design-spec category maps to an enforced rule or exact copy contract;
- the scanner preserves line numbers and reports every issue;
- front matter, fences, comments, and link destinations are excluded;
- legitimate evidence language and domain backlog examples remain accepted;
- homepage progress remains reachable under `查看项目进度`;
- no article fact, metadata, source boundary, or heading contract outside the four path sections changed;
- no dependency or `.codex/config.toml` change occurred.

Expected: no Critical or Important finding and `Ready to merge: Yes`.

---

## Plan Self-Review Record

- Spec coverage: homepage copy, public progress label, six topic directories, four learning paths, recursive scanning, exclusions, diagnostics, false-positive controls, and full verification all map to explicit tasks.
- Placeholder scan: no deferred implementation markers or shorthand references remain; `TODO` appears only in the intentional legal-counterexample fixture.
- Type consistency: Task 3 extends the same `rules` array and `findProductCopyIssues(relativePath, source)` interface created in Task 2.
- Scope: one presentation-copy boundary across existing public pages; no content architecture, evidence model, or dependency change.
