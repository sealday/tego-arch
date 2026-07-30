# Task 3 final asset report — MOD-03 diagrams

## Outcome

PASS after the complete Task 5 Stage A re-review corrections. This report is
the single current record for the Component and Deployment asset pairs.

## Final files and hashes

```text
43099b02286013a641231ff8c06efa0d7446a71f21a91208eca57dab55226b00  diagrams/mod-03-c4-component.drawio
409eef69c1d593893b4578737d13854985522cc33365eee10eae83f37ff8289f  diagrams/mod-03-c4-deployment.drawio
835c9aff892a48450e43d447a0db3ec9f9ece4b5250798635cb9259e9a745f10  static/img/diagrams/mod-03-c4-component.svg
58a2ac087a0945dc049a8cbad4e862f2ccf858d573c30870cc8430096763f420  static/img/diagrams/mod-03-c4-deployment.svg
```

The article is
`content/modeling/mod-03-c4-component-dynamic-deployment.mdx`; the structured
pair and geometry contract is `tests/g008-batch1-diagrams.test.mjs`.

## Final semantics

- MOD-02 remains authoritative for the external-system name
  `银行支付服务`.
- Component expands only `申报 API` and retains the
  `Component / Container / Data Store` legend.
- Deployment names `数据库节点` as a deployment node that contains the
  `申报数据库实例` Container instance.
- `基础设施节点` is an optional notation type. The minimum teaching diagram
  has no infrastructure-node instance and adds no DNS or LB.
- The Draw.io and SVG title and description identify the Deployment asset as
  `费用申报系统 Deployment 教学演练假设拓扑`, not an inspected production
  fact.

## Final geometry at 800px

Both SVGs use a `1200`-unit viewBox and render at `800px`.

- Component `edge-payment-worker` starts `0.67px` from the payment boundary
  and ends `0.67px` from the worker boundary. Its terminal vector is
  `[0, -0.67]` and its target-interior dot product is `33.78`, so the arrow
  approaches the worker upward from below.
- The Component task label has boundary `9.33px`, stroke `14.20px`, arrow
  `156.76px`, and node `18.33px` clearance.
- Deployment `edge-employee-web`, `edge-web-api`, and `edge-api-db` start
  `0.67px` from their source boundaries and end `2.00px` from their target
  boundaries. All terminal vectors are `[0.67, 0]`; target-interior dot
  products are `45.78`, `45.78`, and `50.22`.
- Deployment minimum label-to-label clearance is `18.67px`. The specifically
  reviewed `edge-api-db / edge-api-task` pair has `27.37px`.
- Deployment minimum label-to-stroke, label-to-arrow, and label-to-node
  clearances are `9.87px`, `23.92px`, and `13.00px`; maximum label
  association is `60.00px`.

All raw endpoints, vectors, dots, label rectangles, pairwise distances, and
clearances are in `.superpowers/sdd/task-5-cdp-measurements.json`.

## Browser evidence

Fresh isolated Google Chrome `150.0.7871.187` QA passed against the final
production build:

- desktop `1440x1000`: document width `1440 = 1440`;
- mobile `390x844`: document width `390 = 390`;
- mobile diagram wrappers: `358px` client / `800px` scroll width;
- real Tab reached Component, four more Tabs reached Deployment, and four
  real Shift+Tabs returned to Component;
- both wrappers showed `rgb(159, 63, 49) solid 3px` focus-visible and real
  ArrowRight changed `scrollLeft 0 → 40`;
- MOD-01 and MOD-03 each rendered one Mermaid SVG at both viewport sizes;
- console/runtime events: `0`.

Final screenshots:

- `.superpowers/sdd/task-5-component-800px.png`
- `.superpowers/sdd/task-5-deployment-800px.png`
- `.superpowers/sdd/task-5-mod03-desktop.png`
- `.superpowers/sdd/task-5-mod03-mobile.png`

## Verification

- Both bundled Draw.io/SVG validators: PASS.
- `node --test tests/g008-batch1-diagrams.test.mjs`: `15/15` PASS.
- Full verification is recorded in `task-5-report.md`.
