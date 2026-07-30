# G008 Batch 1 Task 3 Report

## Status

PASS — MOD-03 now publishes synchronized, accessible Draw.io/SVG pairs for
Component and Deployment, embeds both in focusable local-scroll regions, and
governs both as original illustrations.

## Scope and semantics

- Article: `content/modeling/mod-03-c4-component-dynamic-deployment.mdx`
- Route: `/modeling/mod-03`
- Component pair:
  - `diagrams/mod-03-c4-component.drawio`
  - `static/img/diagrams/mod-03-c4-component.svg`
- Deployment pair:
  - `diagrams/mod-03-c4-deployment.drawio`
  - `static/img/diagrams/mod-03-c4-deployment.svg`
- Component expands only `申报 API`, contains exactly the four named
  responsibility units, and does not claim code conformance.
- Deployment maps the named instances to the named production nodes, keeps
  `外部银行` outside the environment boundary, and makes no replica, capacity,
  availability-zone, autoscaling, resilience, or failover claim.
- Both SVGs use a 1200-unit-wide `viewBox`; at the measured desktop width of
  800px, the authoring-to-rendered scale is `800 / 1200 = 2/3`.

## RED

Command:

```text
node --test tests/g008-batch1-diagrams.test.mjs
```

Observed result:

```text
tests 4
pass 0
fail 4
Error: ENOENT: no such file or directory, open
'/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch1/diagrams/mod-03-c4-component.drawio'
Error: ENOENT: no such file or directory, open
'/Users/seal/projects/tego-arch/.worktrees/g008-modeling-batch1/diagrams/mod-03-c4-deployment.drawio'
```

The two embed assertions also failed because neither diagram wrapper existed.

## GREEN

### Diagram contract

```text
node --test tests/g008-batch1-diagrams.test.mjs

tests 4
pass 4
fail 0
```

### Validator commands and complete output

```text
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs diagrams/mod-03-c4-component.drawio static/img/diagrams/mod-03-c4-component.svg --label '申报 API' --label '提交用例' --label '审批策略' --label '付款编排' --label '持久化端口' --label 'Web 应用' --label '申报数据库' --label '支付任务执行器'
Validated mod-03-c4-component

node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs diagrams/mod-03-c4-deployment.drawio static/img/diagrams/mod-03-c4-deployment.svg --label '生产环境' --label '员工终端' --label 'Web 节点' --label 'API 节点' --label '数据库节点' --label '任务执行节点' --label 'Web 应用实例' --label '申报 API 实例' --label '申报数据库实例' --label '支付任务执行器实例' --label '外部银行'
Validated mod-03-c4-deployment
```

### Content and generated state

```text
node --test tests/g008-batch1-content.test.mjs
tests 4
pass 4
fail 0

npm run generate:content
npm run validate:content
Validated 84 content document(s) and 464 registered source(s).

npm run check:content
PASS

node --test tests/project-status.test.mjs tests/content-review-health.test.mjs tests/source-ledger-pagination.test.mjs tests/source-ledger-rendering.test.mjs
tests 37
pass 37
fail 0

git diff --check
PASS (no output)
```

Generated project status is exactly:

```text
completed_topics: 39
content_documents: 84
governed_sources: 464
```

Ledger projections are exactly 464 unique cards, 421 primary sources, 162
official-docs sources, and 27 original illustrations.

### Full verification

The first full run found one stale count guard:

```text
npm run verify
tests 499
pass 498
fail 1
canonical-identity: 27 !== 25
```

After advancing that original-asset count to 27, the required final run passed:

```text
npm run verify
tests 499
pass 499
fail 0
Validated 84 content document(s) and 464 registered source(s).
Content review health passed for 84 document(s) and 464 source(s).
tsc --noEmit
[SUCCESS] Generated static files in "build".
```

## Browser QA

Production service:

```text
npm run build
npm run serve -- --host 127.0.0.1 --port 3100
http://127.0.0.1:3100/tego-arch/modeling/mod-03
```

### Desktop 1440x1000

Verdict: PASS.

- HTTP: 200
- Document width: `scrollWidth 1440 = clientWidth 1440`
- Component rendered SVG: exactly `800px × 533.328125px`
- Deployment rendered SVG: exactly `800px × 666.6640625px`
- Both wrappers: `clientWidth 800px`
- Both SVGs: non-zero dimensions and completed image load after their lazy
  regions entered the viewport
- Console warnings/errors: 0
- Browser-visible SVG text matched every required validator label
- No cropping, boundary ambiguity, interrupted connector, or unreadable text
  was observed after the final geometry pass

All coordinates and clearances below are final rendered CSS pixels within the
SVG, using the measured `2/3` scale. Node clearance order is
`left/right/top/bottom`. Required minima are 16px horizontal padding, 14px
vertical padding, 22px baseline gap, 14px bottom clearance, 15px body text,
and 10px type text.

#### Component measured nodes

| Node | Title baseline (x,y) | Type baseline (x,y) | Gap | Clearance L/R/T/B |
| --- | --- | --- | ---: | --- |
| Web 应用 | 80, 216.67 | 80, 244.67 | 28 | 25.50 / 25.50 / 21.38 / 33.10 |
| 提交用例 | 283.33, 196.67 | 283.33, 224.67 | 28 | 38.80 / 38.80 / 21.38 / 33.10 |
| 审批策略 | 516.67, 196.67 | 516.67, 224.67 | 28 | 38.80 / 38.80 / 21.38 / 33.10 |
| 付款编排 | 283.33, 376.67 | 283.33, 404.67 | 28 | 38.80 / 38.80 / 21.38 / 33.10 |
| 持久化端口 | 516.67, 376.67 | 516.67, 404.67 | 28 | 36.67 / 36.67 / 21.38 / 33.10 |
| 申报数据库 | 720, 190 | 720, 218 | 28 | 20.00 / 20.00 / 38.04 / 29.76 |
| 支付任务执行器 | 716.67, 376.67 | 716.67, 404.67 | 28 | 20.66 / 20.66 / 21.38 / 33.10 |

Component title font is 16px rendered; type font is 10.67px rendered.

#### Component connector labels

Required minima are 8px label-to-stroke, 16px label-to-arrow, and 12px
label-to-node clearance.

| Label | Stroke | Arrow | Node |
| --- | ---: | ---: | ---: |
| 提交请求 | 85.84 | 78.64 | 16.42 |
| 校验审批 | 69.18 | 61.98 | 19.62 |
| 创建付款任务 | 23.20 | 22.52 | 25.41 |
| 保存任务 | 65.84 | 58.64 | 16.42 |
| 读写申报 | 48.53 | 71.57 | 20.75 |
| 发布待执行任务 | 14.28 | 155.26 | 27.41 |

#### Deployment measured nodes

| Node | Title baseline (x,y) | Type baseline (x,y) | Gap | Clearance L/R/T/B |
| --- | --- | --- | ---: | --- |
| 员工终端 | 83.33, 236.67 | 83.33, 264.67 | 28 | 16.62 / 16.62 / 21.28 / 46.34 |
| Web 节点 | 243.33, 210 | 243.33, 238 | 28 | 29.95 / 29.95 / 14.62 / 106.34 |
| Web 应用实例 | 243.33, 283.33 | 243.33, 311.33 | 28 | 16.45 / 16.45 / 21.28 / 26.34 |
| API 节点 | 416.67, 210 | 416.67, 238 | 28 | 29.95 / 29.95 / 14.62 / 106.34 |
| 申报 API 实例 | 416.67, 283.33 | 416.67, 311.33 | 28 | 16.45 / 16.45 / 21.28 / 26.34 |
| 数据库节点 | 583.33, 210 | 583.33, 238 | 28 | 27.67 / 27.67 / 14.62 / 106.34 |
| 申报数据库实例 | 583.33, 283.33 | 583.33, 311.33 | 28 | 17.33 / 17.33 / 21.28 / 26.34 |
| 任务执行节点 | 466.67, 436.67 | 466.67, 464.67 | 28 | 46.62 / 46.62 / 14.62 / 126.34 |
| 支付任务执行器实例 | 466.67, 516.67 | 466.67, 544.67 | 28 | 18.00 / 18.00 / 21.28 / 33.00 |
| 外部银行 | 730, 470 | 730, 498 | 28 | 18.27 / 18.27 / 21.28 / 33.00 |

Deployment title font is 16px rendered; type font is exactly 10px rendered.

#### Deployment connector labels

| Label | Stroke | Arrow | Node |
| --- | ---: | ---: | ---: |
| 访问页面 | 132.60 | 125.40 | 29.07 |
| 提交申报 | 142.60 | 135.40 | 29.07 |
| 读写申报 | 70.95 | 63.75 | 17.41 |
| 发布付款任务 | 119.87 | 134.76 | 19.07 |
| 发起付款 | 129.29 | 121.58 | 29.07 |

Arrow clearance used the real marker triangle transformed from its `refX=8`,
`refY=5`, `markerUnits=strokeWidth`, terminal direction, and 2.4-unit edge
stroke. Node and boundary measurements included the visible stroke envelope.

### Mobile 390x844

The connected Chrome extension timed out after the viewport switch. Per the
authorized recovery path, the final mobile measurements were repeated against
the same production service with a fresh headless Google Chrome instance over
the Chrome DevTools Protocol. This is a real Chromium render, not a static DOM
or arithmetic substitute.

Verdict: PASS.

- HTTP: 200
- Viewport: exactly `390 × 844`
- Document: `scrollWidth 390 = clientWidth 390` before and after keyboard
  scrolling
- Component wrapper: `scrollWidth 800 > clientWidth 358`
- Deployment wrapper: `scrollWidth 800 > clientWidth 358`
- Both rendered images remained 800px wide with non-zero heights
  (`533.328125px` and `666.65625px`)
- Both images completed loading
- Programmatic keyboard focus on each `tabIndex=0` region matched
  `:focus-visible`
- Focus indicator: `outline-style: solid`, `outline-width: 3px`
- ArrowRight changed each wrapper from `scrollLeft 0` to `scrollLeft 40`
- Document width stayed fixed at 390 during both local-scroll interactions
- Console errors, logged browser errors, and runtime exceptions: 0

## Source governance

Added:

- `src-atlas-mod03-c4-component`
- `src-atlas-mod03-c4-deployment`

Both are primary `original-illustration` records with illustration-only
evidence roles, `LicenseRef-Atlas-Original`, project-local asset identity,
canonical GitHub license evidence, and an explicit statement that the
project-authored Draw.io/SVG pair contains no third-party reference image or
copied composition. Both citations are attached only to the MOD-03 document.

## Files changed

- Added two editable Draw.io sources and two published SVGs.
- Added `tests/g008-batch1-diagrams.test.mjs`.
- Updated MOD-03 with Component and Deployment wrappers while retaining the
  Dynamic Mermaid between them.
- Updated source ledger identities/citations and regenerated project-status and
  source-ledger projections.
- Advanced all affected 464/421/27 count and pagination guards, including the
  canonical self-authored asset guard.
- Updated the MOD-03 content governance expectation for its two new citations.

## Self-review

- `git diff --check`: PASS.
- Draw.io/SVG label inventories: synchronized and validator-clean.
- No fixed root SVG width/height; both roots retain `role="img"`, `viewBox`,
  `aria-labelledby`, non-empty title, and non-empty description.
- No new dependencies.
- No Task 1, Task 2, or link-health guard changes were reverted.
- No debug scripts or browser automation files were retained.
- Initial browser FAIL measurements were repaired before final PASS:
  Component worker padding and three label lanes; Deployment instance widths,
  database baseline/bottom clearance, and two label-to-node clearances.

## Concerns

- None blocking. The in-app Chrome extension timeout during the mobile viewport
  switch is recorded above; the required mobile evidence was independently
  reproduced in a fresh real Chrome process against the same production build.

## Review-request fixes

The review `REQUEST CHANGES` was resolved without changing the article scope or
adding dependencies.

### Semantic synchronization

- Component Draw.io now contains the exact SVG title and non-claim note.
- Deployment Draw.io now contains the exact SVG title, non-claim note, and the
  complete four-item legend: `部署节点`, `容器实例`, `基础设施节点`, `外部系统`.
- Deployment node type wording is unified in both formats, including
  `基础设施节点` for the database node and `数据实例` for its deployed instance.
- `tests/g008-batch1-diagrams.test.mjs` now defines the complete unique semantic
  inventory for each diagram and compares the expected inventory exactly and
  bidirectionally with both Draw.io `mxCell.value` values and visible SVG
  `title` / `desc` / `text` values.

The new regression was observed RED before the asset changes:

```text
node --test tests/g008-batch1-diagrams.test.mjs
tests 5; pass 2; fail 3
```

The failures identified the missing Component title/note, missing Deployment
title/note/legend and mismatched English type labels, plus absent Deployment
boundary metadata. After the fixes the same command passed `5/5`.

Both complete-inventory validator invocations also passed:

```text
Validated mod-03-c4-component
Validated mod-03-c4-deployment
```

### Deployment geometry

At the required 800px rendered width, real Chromium measurements and the
regression test agree on these visible-stroke clearances:

| Relationship | CSS px |
| --- | ---: |
| Database node outer stroke → production boundary inner stroke | 12.67 |
| Production boundary outer stroke → external bank outer stroke | 13.00 |
| External bank outer stroke → viewBox right edge | 18.00 |

All are at least the 12px review threshold. The Deployment node text minima
were 16.17px horizontal, 14.67px top, 26.67px bottom, with a 28px baseline
gap. Connector-label minima were 17.67px to nodes, 71.20px to edge strokes,
and 56.00px to arrow regions. Component remained above its thresholds:
20.00px minimum horizontal node clearance, 21.11px minimum top clearance,
29.78px minimum bottom clearance, 28px baseline gap, and connector-label
minima of 16.71px to nodes, 14.20px to strokes, and 21.39px to arrows.

### Real keyboard and responsive QA

A fresh production build was served locally and inspected with real headless
Google Chrome through bounded Chrome DevTools Protocol calls. Navigation used
`document.readyState === "complete"` polling; every CDP call and keyboard
traversal had a 10-second timeout. No `element.focus()` call was used.

- Desktop `1440 × 1000`: HTTP 200; document width `1440 = 1440`; both wrappers
  and images rendered at exactly 800px; both images completed loading.
- Mobile `390 × 844`: HTTP 200; document width `390 = 390`; each wrapper was
  `358px` wide with `scrollWidth 800`; both images completed loading with
  non-zero natural dimensions.
- Real forward Tab reached Component after 2 key presses and Deployment after
  4 further key presses.
- Real Shift+Tab reached Component again from Deployment after 4 key presses.
- At every wrapper stop, `document.activeElement` was the expected
  `.architecture-diagram-scroll`, `:focus-visible` was true, and the computed
  focus outline was `solid 3px`.
- Real ArrowRight retained the expected active element and changed Component
  `scrollLeft 0 → 37` and Deployment `0 → 36` during the sampled smooth scroll.
- Browser console entries and runtime exceptions: 0.

### Final verification

```text
npm run verify
tests 500; pass 500; fail 0
Validated 84 content document(s) and 464 registered source(s).
Content review health passed for 84 document(s) and 464 source(s).
typecheck: PASS
production build: PASS
```

No temporary browser automation file was retained.
