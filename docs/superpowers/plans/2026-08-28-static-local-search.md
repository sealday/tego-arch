# Tego Arch Static Local Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chinese-first, zero-backend keyword search to the Docusaurus site and publish a verified hashed search index with every GitHub Pages build.

**Architecture:** Configure `@easyops-cn/docusaurus-search-local` as a Docusaurus theme so production builds extract only docs-plugin content from `content/` and emit a hashed Lunr index. Keep Chinese segmentation vocabulary in a focused UTF-8 Jieba dictionary, and add a repository-owned post-build validator so a missing, unscoped, or incorrectly based index blocks release.

**Tech Stack:** Docusaurus 3.10.2, React 19, `@easyops-cn/docusaurus-search-local` 0.55.3, Lunr, `@node-rs/jieba`, Node.js 24 test runner, GitHub Pages

## Global Constraints

- Work in an isolated `codex/static-local-search` worktree created from the commit containing design commit `6be6a4a`; do not modify or absorb unrelated STY-05 or G009 working-tree changes.
- Index only Docusaurus docs sourced from `content/`; keep blog pages, React pages, generated source-ledger pages, `docs/` specs, and review files out of the index.
- Keep runtime search entirely browser-local: no account, secret, telemetry, external search API, or Ask AI configuration.
- Use `language: ['en', 'zh']`, `docsRouteBasePath: '/'`, `docsDir: 'content'`, and `hashed: 'filename'` exactly.
- Preserve the production site URL contract `baseUrl: '/tego-arch/'`; no search path may be hard-coded to the domain root.
- Use the plugin-provided `zh-Hans` messages from version 0.55.3. Add a site translation override only if browser verification proves a missing or incorrect message.
- Keep the first release to keyword search: no filters, history, popular queries, analytics, semantic retrieval, or AI answers.
- Follow TDD for repository code and finish with the full `npm run verify` gate.

---

## File Structure

- Modify `package.json` — pin the search theme, add the post-build search check, and put that check after `npm run build` in `verify`.
- Modify `package-lock.json` — lock the installed search theme and its transitive dependencies.
- Modify `docusaurus.config.ts` — register the local-search theme and its exact index/interaction options.
- Create `src/search/zh-user-dict.txt` — own only stable Chinese architecture segmentation terms.
- Create `tests/search-local-config.test.mjs` — enforce dependency, configuration, scope, localization, and dictionary contracts without running a production build.
- Create `scripts/check-search-index.mjs` — inspect an existing `build/` directory and reject missing, unhashed, empty, mis-based, or over-scoped search indexes.
- Create `tests/search-index-build.test.mjs` — test the post-build validator with isolated synthetic build fixtures.
- Create `docs/reviews/static-local-search.md` — record local and production browser acceptance only after every listed observation passes.

---

### Task 1: Search theme configuration and Chinese dictionary

**Files:**
- Create: `tests/search-local-config.test.mjs`
- Create: `src/search/zh-user-dict.txt`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docusaurus.config.ts`

**Interfaces:**
- Consumes: existing Docusaurus docs plugin at `content/`, root `routeBasePath: '/'`, site `baseUrl: '/tego-arch/'`, and locale `zh-Hans`.
- Produces: one configured local-search theme and the UTF-8 dictionary path `src/search/zh-user-dict.txt`; Task 2 relies on the resulting `search-index-<8 lowercase hex>.json` build artifact.

- [ ] **Step 1: Create the failing configuration contract test**

Create `tests/search-local-config.test.mjs`:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const requiredTerms = [
  '限界上下文',
  '事件风暴',
  '模块化单体',
  '微前端',
  '架构适应度函数',
  '智能体循环',
];

test('configures Chinese-first static docs search without external AI', async () => {
  const [packageSource, config] = await Promise.all([
    read('package.json'),
    read('docusaurus.config.ts'),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.equal(
    packageJson.dependencies['@easyops-cn/docusaurus-search-local'],
    '0.55.3',
  );
  assert.match(config, /from 'node:path'/u);
  assert.match(config, /'@easyops-cn\/docusaurus-search-local'/u);
  assert.match(config, /indexDocs:\s*true/u);
  assert.match(config, /indexBlog:\s*false/u);
  assert.match(config, /indexPages:\s*false/u);
  assert.match(config, /docsRouteBasePath:\s*'\/'/u);
  assert.match(config, /docsDir:\s*'content'/u);
  assert.match(config, /language:\s*\['en', 'zh'\]/u);
  assert.match(config, /hashed:\s*'filename'/u);
  assert.match(config, /searchResultLimits:\s*8/u);
  assert.match(config, /searchResultContextMaxLength:\s*80/u);
  assert.match(config, /explicitSearchResultPath:\s*true/u);
  assert.match(config, /fuzzyMatchingDistance:\s*1/u);
  assert.match(config, /highlightSearchTermsOnTargetPage:\s*false/u);
  assert.match(config, /searchBarShortcutKeymap:\s*'mod\+k'/u);
  assert.match(
    config,
    /\{type:\s*'search',\s*position:\s*'right'\},\s*\{href:\s*repositoryUrl/u,
  );
  assert.match(
    config,
    /zhUserDictPath:\s*path\.resolve\('src\/search\/zh-user-dict\.txt'\)/u,
  );
  assert.doesNotMatch(config, /askAi\s*:/u);
});

test('keeps a focused and valid Jieba architecture dictionary', async () => {
  const dictionary = await read('src/search/zh-user-dict.txt');
  const lines = dictionary
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  assert.ok(lines.length >= 30 && lines.length <= 50);
  assert.equal(new Set(lines).size, lines.length, 'dictionary terms must be unique');
  for (const line of lines) {
    assert.match(line, /^[^\s]+(?:\s+\d+)?(?:\s+[A-Za-z]+)?$/u);
  }
  for (const term of requiredTerms) {
    assert.ok(lines.includes(term), `missing required search term: ${term}`);
  }
});
```

- [ ] **Step 2: Run the new test and verify the red state**

Run:

```bash
node --test tests/search-local-config.test.mjs
```

Expected: FAIL because the dependency, theme configuration, and dictionary do not exist.

- [ ] **Step 3: Install the exact search theme version**

Run:

```bash
npm install --save-exact @easyops-cn/docusaurus-search-local@0.55.3
```

Expected: `package.json` records version `0.55.3`, `package-lock.json` is updated, and npm reports no installation error.

- [ ] **Step 4: Add the curated Chinese dictionary**

Create `src/search/zh-user-dict.txt` with exactly these 40 unique lines:

```text
架构驱动因素
质量属性
架构权衡
敏感点
权衡点
风险点
演进式设计
架构债务
信息隐藏
高内聚
低耦合
依赖倒置
控制反转
依赖注入
限界上下文
上下文映射
事件风暴
领域故事
模块化单体
微服务架构
事件驱动架构
服务导向架构
分层架构
六边形架构
洋葱架构
整洁架构
垂直切片
微内核架构
管道过滤器
参与者模型
无服务器架构
微前端
架构适应度函数
智能体循环
智能体架构
工具调用
长期记忆
检索增强生成
智能体检索增强生成
多智能体
```

- [ ] **Step 5: Configure the search theme**

At the top of `docusaurus.config.ts`, add:

```ts
import path from 'node:path';
```

Replace the current one-item `themes` value with:

```ts
themes: [
  '@docusaurus/theme-mermaid',
  [
    '@easyops-cn/docusaurus-search-local',
    {
      indexDocs: true,
      indexBlog: false,
      indexPages: false,
      docsRouteBasePath: '/',
      docsDir: 'content',
      language: ['en', 'zh'],
      hashed: 'filename',
      searchResultLimits: 8,
      searchResultContextMaxLength: 80,
      explicitSearchResultPath: true,
      fuzzyMatchingDistance: 1,
      highlightSearchTermsOnTargetPage: false,
      searchBarShortcutKeymap: 'mod+k',
      searchBarPosition: 'right',
      zhUserDictPath: path.resolve('src/search/zh-user-dict.txt'),
    },
  ],
],
```

Do not add `askAi`, `searchContextByPaths`, custom result components, or custom search CSS.

In `themeConfig.navbar.items`, insert the explicit search item immediately before the existing GitHub item:

```ts
{type: 'search', position: 'right'},
{href: repositoryUrl, label: 'GitHub', position: 'right'},
```

The explicit item is required because Docusaurus otherwise appends its implicit search control after every right-side navbar item.

- [ ] **Step 6: Run focused tests and type checking**

Run:

```bash
node --test tests/search-local-config.test.mjs
npm run typecheck
```

Expected: both commands exit 0. If TypeScript rejects an inferred theme option, use the plugin-exported `PluginOptions` type without changing any configured value.

- [ ] **Step 7: Commit Task 1**

```bash
git add package.json package-lock.json docusaurus.config.ts src/search/zh-user-dict.txt tests/search-local-config.test.mjs
git commit -m "feat: add Chinese local documentation search"
```

---

### Task 2: Search build-artifact release guard

**Files:**
- Create: `scripts/check-search-index.mjs`
- Create: `tests/search-index-build.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: a completed Docusaurus output directory and the Task 1 filename contract `search-index-<8 lowercase hex>.json`.
- Produces: `inspectSearchBuild(buildDir, policy): Promise<SearchBuildReport>` and CLI command `npm run check:search-index`; the report has `filename`, `bytes`, `gzipBytes`, `documentCount`, and `urlCount` integer fields.

- [ ] **Step 1: Write failing unit tests for the build validator**

Create `tests/search-index-build.test.mjs`:

```js
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {inspectSearchBuild} from '../scripts/check-search-index.mjs';

const require = createRequire(import.meta.url);
const pluginPackagePath = require.resolve(
  '@easyops-cn/docusaurus-search-local/package.json',
);
const {getIndexHash} = require(path.join(
  path.dirname(pluginPackagePath),
  'dist/server/server/utils/getIndexHash.js',
));

const requiredUrls = [
  '/tego-arch/styles/sty-12',
  '/tego-arch/modeling/mod-11',
  '/tego-arch/principles/pr-11',
  '/tego-arch/cases/kubernetes-reconciliation-loop',
];

const makeIndex = (urls) => [
  {
    documents: urls.map((u, index) => ({i: index + 1, t: `title-${index}`, u})),
    index: {version: '2.3.9', fields: ['t'], fieldVectors: [], invertedIndex: [], pipeline: []},
  },
];

const withBuild = async (callback) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'tego-search-'));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
};

test('accepts one hashed, scoped, non-empty search index', async () => {
  await withBuild(async (directory) => {
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(makeIndex(requiredUrls)),
    );
    const report = await inspectSearchBuild(directory);

    assert.equal(report.filename, 'search-index-1a2b3c4d.json');
    assert.equal(report.documentCount, 4);
    assert.equal(report.urlCount, 4);
    assert.ok(report.bytes > 0);
    assert.ok(report.gzipBytes > 0);
  });
});

test('rejects an unhashed index and missing representative docs', async () => {
  await withBuild(async (directory) => {
    await writeFile(
      path.join(directory, 'search-index.json'),
      JSON.stringify(makeIndex(['/tego-arch/styles/sty-12'])),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /expected exactly one hashed search index/u,
    );
  });
});

test('rejects generated source-ledger pages in the docs index', async () => {
  await withBuild(async (directory) => {
    await writeFile(
      path.join(directory, 'search-index-deadbeef.json'),
      JSON.stringify(makeIndex([
        ...requiredUrls,
        '/tego-arch/references/primary',
      ])),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /forbidden indexed URL/u,
    );
  });
});

test('changes the filename hash when indexed MDX content changes', async () => {
  await withBuild(async (directory) => {
    const fixture = path.join(directory, 'fixture.mdx');
    const config = {
      hashed: 'filename',
      indexDocs: true,
      docsDir: [directory],
      indexBlog: false,
      blogDir: [],
    };

    await writeFile(fixture, '# First indexed value\n');
    const firstHash = getIndexHash(config);
    await writeFile(fixture, '# Changed indexed value\n');
    const secondHash = getIndexHash(config);

    assert.match(firstHash, /^[0-9a-f]{8}$/u);
    assert.match(secondHash, /^[0-9a-f]{8}$/u);
    assert.notEqual(secondHash, firstHash);
  });
});
```

- [ ] **Step 2: Run the validator tests and verify the red state**

Run:

```bash
node --test tests/search-index-build.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/check-search-index.mjs`.

- [ ] **Step 3: Implement the build validator**

Create `scripts/check-search-index.mjs`:

```js
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';

export const defaultSearchPolicy = Object.freeze({
  baseUrl: '/tego-arch/',
  requiredUrls: [
    '/tego-arch/styles/sty-12',
    '/tego-arch/modeling/mod-11',
    '/tego-arch/principles/pr-11',
    '/tego-arch/cases/kubernetes-reconciliation-loop',
  ],
  forbiddenUrlPrefixes: [
    '/tego-arch/references/primary',
    '/tego-arch/references/secondary',
    '/tego-arch/references/discovery',
  ],
});

export async function inspectSearchBuild(
  buildDir,
  policy = defaultSearchPolicy,
) {
  const entries = await readdir(buildDir);
  const indexFiles = entries.filter((name) =>
    /^search-index-[0-9a-f]{8}\.json$/u.test(name),
  );
  if (indexFiles.length !== 1) {
    throw new Error(
      `expected exactly one hashed search index, found ${indexFiles.length}`,
    );
  }

  const filename = indexFiles[0];
  const bytes = await readFile(path.join(buildDir, filename));
  let payload;
  try {
    payload = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`search index is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(payload)) {
    throw new Error('search index root must be an array');
  }

  const documents = payload.flatMap((part) =>
    Array.isArray(part?.documents) ? part.documents : [],
  );
  if (documents.length === 0) {
    throw new Error('search index contains no documents');
  }
  const urls = [...new Set(documents.map(({u}) => u).filter(Boolean))].sort();
  const invalidBaseUrl = urls.find((url) => !url.startsWith(policy.baseUrl));
  if (invalidBaseUrl) {
    throw new Error(`indexed URL has invalid baseUrl: ${invalidBaseUrl}`);
  }
  for (const requiredUrl of policy.requiredUrls) {
    if (!urls.includes(requiredUrl)) {
      throw new Error(`required indexed URL is missing: ${requiredUrl}`);
    }
  }
  for (const prefix of policy.forbiddenUrlPrefixes) {
    const forbidden = urls.find(
      (url) => url === prefix || url.startsWith(`${prefix}/`),
    );
    if (forbidden) {
      throw new Error(`forbidden indexed URL: ${forbidden}`);
    }
  }

  return {
    filename,
    bytes: bytes.byteLength,
    gzipBytes: gzipSync(bytes).byteLength,
    documentCount: documents.length,
    urlCount: urls.length,
  };
}

const isCli = process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
  const buildDir = path.resolve(process.argv[2] ?? 'build');
  try {
    const report = await inspectSearchBuild(buildDir);
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } catch (error) {
    process.stderr.write(`search-index-check: ${error.message}\n`);
    process.exitCode = 1;
  }
}
```

- [ ] **Step 4: Run validator tests and verify the green state**

Run:

```bash
node --test tests/search-index-build.test.mjs
```

Expected: 4 tests pass, including the isolated content-hash change test.

- [ ] **Step 5: Wire the validator after production build**

In `package.json`, add:

```json
"check:search-index": "node scripts/check-search-index.mjs build"
```

Change `verify` so its final two commands are:

```json
"verify": "npm run test && npm run validate:content && npm run check:terminology && npm run check:content && npm run check:links && npm run check:reviews && npm run typecheck && npm run build && npm run check:search-index"
```

- [ ] **Step 6: Build the real site and inspect the search baseline**

Run:

```bash
npm run build
npm run check:search-index
```

Expected: both commands exit 0. The second command prints one JSON object whose filename matches `search-index-<8 lowercase hex>.json`, whose `documentCount` and `urlCount` are positive, and whose `bytes` and `gzipBytes` establish the first-release baseline.

- [ ] **Step 7: Run all search-focused tests**

Run:

```bash
node --test tests/search-local-config.test.mjs tests/search-index-build.test.mjs
```

Expected: all 6 tests pass.

- [ ] **Step 8: Commit Task 2**

```bash
git add package.json scripts/check-search-index.mjs tests/search-index-build.test.mjs
git commit -m "test: guard local search build artifacts"
```

---

### Task 3: Local production browser acceptance

**Files:**
- Create: `docs/reviews/static-local-search.md`
- Modify only if an acceptance check fails: `src/search/zh-user-dict.txt` or `docusaurus.config.ts`

**Interfaces:**
- Consumes: Task 1 search UI and Task 2 verified production build.
- Produces: an evidence-backed review record showing the local production UI meets query, keyboard, responsive, theme, locale, base-path, and network boundaries.

- [ ] **Step 1: Start the production server**

Run:

```bash
npm run serve -- --host 127.0.0.1
```

Expected: Docusaurus serves the completed build under `http://127.0.0.1:3000/tego-arch/`. Keep the process running for the following checks.

- [ ] **Step 2: Verify desktop search behavior in the browser**

At a desktop viewport, verify all of the following:

- the search control is on the right side of the navbar before the GitHub link;
- `⌘K` on macOS or `Ctrl+K` elsewhere focuses the search input;
- arrow keys change the active result and Enter opens it;
- the complete results action opens the plugin route `/tego-arch/search/?q=<query>`;
- `微前端` returns `/tego-arch/styles/sty-12` or `/tego-arch/cases/micro-frontends-single-spa` in the first three results;
- `限界上下文` returns `/tego-arch/modeling/mod-11` in the first three results;
- `CQRS` returns `/tego-arch/principles/pr-11` in the first three results;
- `适应度函数` returns `/tego-arch/methods/mth-04`;
- `Kubernetes` returns `/tego-arch/cases/kubernetes-reconciliation-loop`;
- the one-character typo `Kubernete` still returns the Kubernetes reconciliation-loop case;
- the impossible sentinel query `龘靐齉xyz987` shows `没有找到任何文档`.

Expected: every check passes. If a representative term is incorrectly segmented, add only that stable term to `src/search/zh-user-dict.txt`, rerun Task 1 tests and `npm run build`, then repeat this step. Do not add custom ranking code.

- [ ] **Step 3: Verify locale, responsive layout, themes, and network isolation**

Verify:

- search placeholder and empty/no-result/results-page copy are Simplified Chinese;
- no local `i18n/zh-Hans/code.json` override is added when the plugin-provided 0.55.3 translations are correct;
- the modal fits a mobile viewport without horizontal overflow;
- active result, highlights, input border, and text remain legible in light and dark themes;
- result and index requests remain under `/tego-arch/`;
- no request is sent to Algolia, Typesense, an Ask AI endpoint, or any other search service;
- blocking the search-index request leaves article content and ordinary navigation usable; the search may remain unavailable because the pinned plugin exposes no index-load failure UI callback, and the first release deliberately does not fork its search components.

Expected: every check passes and no external search request is present.

- [ ] **Step 4: Record the passing local evidence**

Create `docs/reviews/static-local-search.md` only after Steps 2–3 pass:

```markdown
# Static local search review

**Review date:** 2026-08-28  
**Implementation:** local production build  
**Result:** PASS

## Build baseline

The production build generated exactly one hashed root search index. The repository validator recorded its filename, raw bytes, gzip bytes, indexed document entries, and unique URLs in the command output for `npm run check:search-index`.

## Query acceptance

| Query | Observation | Result |
| --- | --- | --- |
| `微前端` | The STY-12 article or single-spa case appeared within the first three results. | PASS |
| `限界上下文` | MOD-11 appeared within the first three results. | PASS |
| `CQRS` | PR-11 appeared within the first three results. | PASS |
| `适应度函数` | MTH-04 was returned. | PASS |
| `Kubernetes` | The Kubernetes reconciliation-loop case was returned. | PASS |
| `Kubernete` | The one-character typo still returned the Kubernetes reconciliation-loop case. | PASS |
| `龘靐齉xyz987` | The Chinese no-results message was shown. | PASS |

## Interaction and boundaries

- Mouse, keyboard selection, Enter navigation, and the platform `mod+k` shortcut passed.
- Desktop, mobile, light-theme, and dark-theme checks passed without overflow or illegible states.
- Search UI and result-page messages rendered in Simplified Chinese from the plugin's `zh-Hans` locale.
- Index and result URLs retained `/tego-arch/`.
- No external search or Ask AI request was observed.
- A blocked index request did not break article content or ordinary navigation; no custom failure UI was added because the plugin does not expose a supported callback for it.
```

- [ ] **Step 5: Re-run focused validation and commit Task 3**

Run:

```bash
node --test tests/search-local-config.test.mjs tests/search-index-build.test.mjs
npm run build
npm run check:search-index
git diff --check
```

Expected: all tests and commands pass with no whitespace errors.

Commit:

```bash
git add docs/reviews/static-local-search.md src/search/zh-user-dict.txt docusaurus.config.ts
git commit -m "docs: record local search acceptance"
```

If neither configuration nor dictionary changed during browser QA, `git add` simply stages the new review file.

---

### Task 4: Full verification, integration, publication, and production smoke test

**Files:**
- Modify after successful deployment: `docs/reviews/static-local-search.md`

**Interfaces:**
- Consumes: Tasks 1–3 and the existing GitHub Pages workflow triggered by pushes to `main`.
- Produces: a verified `main` integration, deployed GitHub Pages search, and production acceptance record.

- [ ] **Step 1: Run the complete release gate from a clean feature worktree**

Run:

```bash
git status --short
npm run verify
git diff --check
```

Expected: the worktree is clean before verification, `npm run verify` exits 0 including `check:search-index`, and `git diff --check` reports nothing.

- [ ] **Step 2: Review the implementation diff against the approved design**

Run:

```bash
git diff --stat main...HEAD
git diff main...HEAD -- package.json docusaurus.config.ts src/search/zh-user-dict.txt scripts/check-search-index.mjs tests/search-local-config.test.mjs tests/search-index-build.test.mjs docs/reviews/static-local-search.md
```

Expected: only the planned search dependency, configuration, dictionary, validator, tests, and review record appear; there is no Ask AI configuration, external API, unrelated content edit, or generated `build/` artifact.

- [ ] **Step 3: Integrate using the repository's branch-finishing workflow**

Use the `finishing-a-development-branch` skill. Because the primary checkout may still contain unrelated user changes, do not merge through a command that could overwrite that checkout. Integrate only after confirming the target `main` commit and preserving those changes, then push the updated `main` to `origin`.

Expected: remote `main` contains all search commits and no unrelated worktree changes were included.

- [ ] **Step 4: Wait for the GitHub Pages workflow**

Inspect the workflow triggered by the pushed `main` commit until both `build` and `deploy` complete successfully.

Expected: the workflow's `Verify site` step includes the search-index guard, and GitHub Pages reports a successful deployment for the same commit SHA.

- [ ] **Step 5: Run production smoke tests**

Open `https://sealday.github.io/tego-arch/` and repeat these checks against production:

- `微前端`, `限界上下文`, `CQRS`, `适应度函数`, and `Kubernetes` return the accepted targets;
- `⌘K / Ctrl+K`, arrow keys, Enter, and the full results page work;
- mobile and dark-mode layouts remain usable;
- search index and result links retain `/tego-arch/`;
- no external search or Ask AI network request appears.

Expected: all production checks pass on the deployed commit.

- [ ] **Step 6: Append production evidence and commit the record**

Append to `docs/reviews/static-local-search.md`:

```markdown
## Production verification

GitHub Pages deployment for the integrated search commit completed successfully. The production site repeated the five representative queries, keyboard flow, mobile and dark-theme checks, `/tego-arch/` path checks, and network-isolation check with result PASS.
```

Then run:

```bash
git add docs/reviews/static-local-search.md
git commit -m "docs: record production search verification"
npm run test
git push origin main
```

Expected: the review update is committed, the full repository test suite passes, and remote `main` contains the production verification record.

---

## Completion Criteria

- The Docusaurus navbar exposes Chinese local search and `mod+k` keyboard access.
- Exactly one hashed root search index is generated from `content/` docs and served under `/tego-arch/`.
- Generated source-ledger pages, React pages, blog content, internal specs, and reviews are absent from the index.
- The 40-term Jieba dictionary passes format and uniqueness checks.
- Representative Chinese and English queries meet their result expectations locally and in production.
- No external search, telemetry, Ask AI endpoint, account, or secret is introduced.
- Search-index failure blocks release, while browser index-fetch failure does not break ordinary reading.
- `npm run verify` and the GitHub Pages build/deploy workflow pass on the integrated commit.
