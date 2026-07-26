# G006 Tego Arch Rename Stage A 部署证据

- 审核日期：2026-07-26
- canonical repository：[`https://github.com/sealday/tego-arch`](https://github.com/sealday/tego-arch)
- Stage A implementation SHA：[`1f958b7b7671d43b55fcd819973ccc1de63e66f4`](https://github.com/sealday/tego-arch/commit/1f958b7b7671d43b55fcd819973ccc1de63e66f4)
- GitHub Pages run：[`30209699876`](https://github.com/sealday/tego-arch/actions/runs/30209699876)
- run identity：`headSha=1f958b7b7671d43b55fcd819973ccc1de63e66f4`
- run result：`status=completed`、`conclusion=success`
- canonical Pages：[`https://sealday.github.io/tego-arch/`](https://sealday.github.io/tego-arch/)
- Pages source：`build_type=workflow`
- custom domain：未配置；仓库无 `static/CNAME`

## Live Route 与资源 Smoke

以下 canonical Pages 路由在 2026-07-26 均返回成功并通过页面内容检查：

1. `/`
2. `/intro`
3. `/cases`
4. `/concepts/fnd-01`
5. `/methods/mth-06`
6. `/paths`
7. `/paths/architecture-thinking`
8. `/references`
9. `/references/primary/page/18`

- asset PASS：首页引用的 CSS 与 JavaScript 均返回 HTTP 200。
- image PASS：`/img/paths/software-architecture-learning-roadmap.png` 返回 HTTP 200。
- homepage status PASS：首页可见 `5 / 20`、`11`、`56`、`394` 与 `G006`。
- base-path PASS：首页输出不包含 `/agentic-architecture-atlas/`。

## 视口与运行时

- desktop PASS：1440x1000 下无页面级横向溢出。
- mobile PASS：390x844 下无页面级横向溢出。
- console PASS：两个视口均无 console warning/error。

## Rename 与发布边界

- 旧 GitHub repository URL 返回 HTTP 301，并重定向到 canonical `https://github.com/sealday/tego-arch`。
- 旧 GitHub Pages 地址停止服务的 discontinuity 已接受；不提供旧 base redirect 或双 base 兼容。
- 不配置 custom domain，GitHub Pages 继续由 workflow 发布。
- 旧 repository slug 不得创建、恢复或复用。
- 本记录只回填 Stage A rename/deploy/live-smoke 证据；`G006` 保持当前故事，不在此记录中标记完成。
