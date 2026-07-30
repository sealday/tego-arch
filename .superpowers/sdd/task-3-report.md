# Task 3 current asset report — MOD-03 diagrams

## Outcome

PASS after the Task 5 pre-release corrections. This report describes the
current Component and Deployment assets rather than the superseded first-pass
geometry.

## Current files and hashes

```text
43099b02286013a641231ff8c06efa0d7446a71f21a91208eca57dab55226b00  diagrams/mod-03-c4-component.drawio
108601e2aa6a56fa16738db5b65e37d4042ac3ce69a424f0b378cf50217444e2  diagrams/mod-03-c4-deployment.drawio
c6b6064e4ba6b31a3e469eaf45408c5805a1dc62496d8f85d31c5c40291b1fcf  static/img/diagrams/mod-03-c4-component.svg
9c7790069ff3f1afa13afd989f971e1fc54164c32364ed360d87e4a39946ceeb  static/img/diagrams/mod-03-c4-deployment.svg
```

The publication article is
`content/modeling/mod-03-c4-component-dynamic-deployment.mdx`; the structured
pair contract is `tests/g008-batch1-diagrams.test.mjs`.

## Current semantics

- The MOD-02 canonical external-system node is authoritative; MOD-03 derives
  and uses `银行支付服务` instead of maintaining a second literal.
- Component still expands only `申报 API` into `提交用例`, `审批策略`, `付款编排`,
  and `持久化端口`.
- Component now has a non-empty `Component / Container / Data Store` legend.
- Deployment types `数据库节点` as `部署节点` and the cylindrical
  `申报数据库实例` as `容器实例`.
- The Deployment legend covers every node type. `基础设施节点` remains a
  documented notation option but is not assigned to either database element.
- The Deployment topology is an explicitly dated teaching assumption, not a
  claim about an inspected production environment.

## Current geometry

Both SVGs render at exactly `800px`; both have a `1200`-unit viewBox, so the
authoring-to-rendered scale is `800 / 1200 = 0.6666667`.

The required final CSS-pixel thresholds are:

- node horizontal padding `>= 16`;
- node vertical padding `>= 14`;
- title/type baseline gap `>= 22`;
- text-to-bottom clearance `>= 14`;
- label-to-stroke `>= 8`;
- label-to-arrow `>= 16`;
- label-to-node `>= 12`;
- Deployment label association `<= 60`;
- Component `发布待执行任务` label-to-boundary clearance `>= 8`.

Current notable minima:

- every title/type baseline gap: `28.00px`;
- `银行支付服务` horizontal title padding: `16.36 / 16.36px`;
- Component task label: boundary `9.33px`, stroke `14.20px`, arrow
  `155.45px`, node `17.67px`;
- Deployment `发布付款任务`: stroke `9.87px`, arrow `77.58px`, node
  `17.33px`, association `56.67px`;
- Deployment `发起付款`: stroke `20.87px`, arrow `16.66px`, node `12.00px`,
  association `30.67px`;
- database-to-production boundary `14.67px`;
- production-boundary-to-bank `17.00px`;
- bank-to-viewBox `12.67px`.

All per-node baselines/clearances and per-edge stroke, marker, node, and
association measurements are preserved in
`.superpowers/sdd/task-5-cdp-measurements.json`.

## Browser evidence

Fresh Google Chrome `150.0.7871.187` QA against a production build passed at
`1440x1000` and `390x844`.

- Component and Deployment images were each exactly `800px` wide on desktop.
- Mobile wrappers were `358px` client width and `800px` scroll width.
- Document width stayed `390 = 390` while each wrapper scrolled `0 → 40`.
- Real CDP Tab reached Component, four further Tabs reached Deployment, four
  real Shift+Tabs returned to Component, and both wrappers showed the `3px`
  focus-visible outline.
- Console/runtime events: `0`.

Current screenshots:

- `.superpowers/sdd/task-5-component-800px.png`
- `.superpowers/sdd/task-5-deployment-800px.png`
- `.superpowers/sdd/task-5-mod03-desktop.png`
- `.superpowers/sdd/task-5-mod03-mobile.png`

## Verification

- Both bundled Draw.io/SVG validators: PASS.
- `node --test tests/g008-batch1-diagrams.test.mjs`: `12/12` PASS.
- Full verification is recorded in `task-5-report.md`.
