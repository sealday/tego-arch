# Task 10 执行报告

## 范围

- 接入 `check:terminology` package script，并把它放在完整 `verify` 链的内容校验之后、生成物检查之前。
- 增加 package/workflow 合同测试。
- 运行真实内容生成器；生成结果无漂移，因此未人为修改 `src/generated/*.json`。
- 按真实执行状态勾选计划步骤；Task 10 浏览器视觉验收保持未勾选，由控制器独立执行。

## TDD 证据

### RED

命令：`node --test tests/workflow-configuration.test.mjs`

- 6 tests，5 pass，1 fail。
- 失败断言：`packageJson.scripts['check:terminology']` 实际为 `undefined`，期望为 `node scripts/check-terminology.mjs`。

### GREEN

命令：`node --test tests/workflow-configuration.test.mjs`

- 6 tests，6 pass，0 fail。

## 生成物

命令：`npm run generate:content`

- 退出 0。
- `git diff -- src/generated` 无输出；95 篇正文的现有真实投影已是最新状态。

## 静态与完整验证

- `node --check scripts/terminology-registry.mjs`：退出 0。
- `node --check scripts/visible-copy.mjs`：退出 0。
- `node --check scripts/check-terminology.mjs`：退出 0。
- `npm run check:terminology`：检查 97 个文件（95 篇正文、README、首页），119 个注册术语，0 issue。
- `npm run verify`：退出 0。
  - 测试：918 / 918 pass，0 fail、0 skipped、0 todo。
  - 内容：95 篇文档、494 个注册来源通过校验。
  - 术语：97 个文件、119 个术语、0 issue。
  - 内容生成物检查：通过。
  - 离线链接缓存检查：通过。
  - 内容复核健康：95 篇文档、494 个来源通过。
  - TypeScript：`tsc --noEmit` 退出 0。
  - 生产构建：Docusaurus `[SUCCESS] Generated static files in "build".`
- `rg -n 'terminology-exempt:' content README.md src/pages/index.tsx`：无匹配，suppression 为 0。
- `git diff --check`：退出 0。

## 浏览器边界

控制器在提交 `c2e1ff20b479d13aafd6d2ec2c67a3df38271cdf` 后独立完成浏览器 QA；以下证据由控制器提供，本执行切片没有伪称亲自执行浏览器操作。

- 生产构建通过 `http://127.0.0.1:58042/tego-arch/` 提供服务。
- 首页 `/`：在 `1440×1000` 与 `390×844`、light/dark 四种组合下完成检查。
  - document `scrollWidth === clientWidth`，分别为 `1440 === 1440` 与 `390 === 390`。
  - 旧词“基础与质量”不存在，新词存在。
  - light/dark 主题分别加载对应的 light/dark PNG。
  - 四种组合的 console errors 均为 `[]`。
- 术语页 `/terminology`：在同样四种视口与主题组合下完成检查，共渲染 119 rows。
  - desktop 表格区域 `clientWidth=800`、`scrollWidth=832`；mobile 为 `clientWidth=358`、`scrollWidth=832`。
  - 表格区域 `overflow-x: auto`；移动端 document `scrollWidth/clientWidth=390/390`。
  - 在表格上水平滚动后区域 `scrollLeft` 从 `0` 变为 `300`，document 宽度仍为 `390`，证明只有表格区域滚动。
  - 四种组合的 console errors 均为 `[]`。
- 站内导航：从 `/intro` 点击“术语规范”成功进入 `/terminology`，再点击“首页”成功进入 `/`。

基于上述独立证据，Task 10 Step 5 已勾选完成。

## 提交

- `c2e1ff20b479d13aafd6d2ec2c67a3df38271cdf` — `feat(terminology): enforce Chinese-first content governance`
