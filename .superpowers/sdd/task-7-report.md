# Task 7 报告：中文优先架构术语

## 完成结果

- 完成 `concepts`、`principles`、`methods`、`modeling`、`patterns`、`styles` 六个知识域共 49 个正文文件的中文优先术语清理。
- 锁定六个指定标题：持久化无知、安全内建、开闭原则与接口隔离原则、重试/指数退避/抖动、领域叙事、领域驱动设计上下文映射。
- 扩展术语注册表，覆盖智能体作为工具、评估者—优化者、分层团队等术语，并保持 URL、slug、topic/source ID、代码、命令和图结构标识符不被翻译。
- Mermaid 检查只扫描读者可见标签；MDX 3 使用原生 `{/* terminology-exempt */}` 抑制指令，并由共享解析器按“仅下一条可见记录、仅一个问题”规则验证。
- 修复机械翻译和排版问题，包括中文词间空格、Open/Closed 混写、重复的 arc42/上下文映射措辞、错误中文化的内部链接和测试名称。
- Task 7 不提交生成投影或与生成投影耦合的测试；`src/generated/*.json`、项目状态/主题索引测试和 G008 部署测试均保持 `HEAD`，留待 Task 8/10 统一刷新。

## 验证证据

- 六个目录分别运行 `node scripts/check-terminology.mjs --paths content/<dir>`：全部 0 issue；每次检查加载 57 个登记术语。
- `node --test tests/terminology-content-contract.test.mjs tests/g005*.test.mjs tests/g006*.test.mjs tests/g007*.test.mjs tests/g008*.test.mjs`：356/356 通过。
- `node --test tests/visible-copy.test.mjs tests/terminology-policy.test.mjs`：77/77 通过。
- `npm test`：880 项中 877 项通过；3 项失败均来自 Task 8/10 延后的生成投影/计数刷新：`content-review-health` 仍锁定 94 个文档、`project-status` 仍锁定 94 个文档、`topic-index` 仍读取旧 Pattern 主题索引。
- `npm run validate:content`：通过，验证 95 个内容文档和 494 个登记来源。
- `npm run check:content`：按预期失败，仅报告四个未刷新的生成文件：`project-status.json`、`source-ledger.json`、`topic-indexes.json`、`topic-manifest.json`。
- `npm run check:links`、`npm run check:reviews`、`npm run typecheck`：全部通过。
- `npm run build`：Docusaurus 生产构建成功。
- `git diff --check`：通过。
- 自然中文审计检查了汉字间异常空格、括号内空格、误译链接、`Open/Closed` 混写和“绞杀者无花果”等机械翻译痕迹；剩余命中仅为 Mermaid 列表分隔符和登记术语/来源标题中的正式 `Open/Closed` 写法。

## 边界与剩余风险

- Task 7 范围内无已知功能或验证缺口；聚焦 G005–G008 套件、术语解析/策略套件、六目录检查、内容验证、链接检查、审阅检查、类型检查和生产构建均通过。
- 仓库级剩余缺口仅是刻意延后的生成投影与耦合断言刷新，由 Task 8/10 处理；本任务没有修改或提交这些文件。
- 构建仅输出 Node.js `localStorage` 实验性警告，不影响静态站点产物。
