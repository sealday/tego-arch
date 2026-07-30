# Task 5 pre-release correction report

## Status

PASS. The requested pre-release corrections are implemented and locally
verified. This task creates one local commit only; it does not merge or push.

## TDD evidence

The new content and diagram contracts were written before the correction:

```text
node --test tests/g008-batch1-content.test.mjs tests/g008-batch1-diagrams.test.mjs
tests 19
pass 8
fail 11
```

The failures were specific to the missing behavior: MOD-01 Mermaid boundaries,
reciprocal relations, MOD-03 evidence inputs and `alt`, canonical naming,
diagram types, and legends.

Separate geometry RED:

```text
Component label/boundary clearance -1px
Deployment edge-employee-web association 136.67px
```

Final targeted GREEN before the last visual pass:

```text
node --test tests/g008-batch1-content.test.mjs tests/g008-batch1-diagrams.test.mjs
tests 21
pass 21
fail 0

node --test tests/g008-batch1-diagrams.test.mjs
tests 12
pass 12
fail 0
```

## Content and relationship corrections

- MOD-02's `bank-context` SVG node is the single canonical source for the
  external-system name. The MOD-03 cross-view regression derives that value and
  compares the article Mermaid, Draw.io, and SVG without copying another
  `银行支付服务` test constant.
- The design, implementation-plan global constraint, MOD-01..03 prose,
  MOD-03 Mermaid, Draw.io, and SVG now use `银行支付服务`.
- MOD-01's six Mermaid exits each carry their own concise `不证明` boundary,
  and a fenced-block-specific regression locks all six.
- Component, Dynamic, and Deployment now require their own evidence inputs:
  code/dependency/ownership; use case/test/trace; environment
  inventory/configuration/observation plus the `2026-07-30` fact cutoff.
- The expense-system topology is explicitly a teaching assumption rather than
  an inspected production fact.
- Dynamic locks `发布待执行任务（异步边界）` and one minimal
  `alt 银行受理 / else 银行拒绝` branch without enumerating retries or
  compensation.
- MOD-01, QA-01, and MTH-03 preserve their existing adjacent order, append the
  reciprocal adjacency, and expose visible reverse links. Existing exact
  relation and preservation tests were updated.

## Diagram corrections

- Component adds a compact, synchronized `Component / Container / Data Store`
  legend. The legend is non-empty and covers every normalized node type.
- Deployment types `数据库节点` as `部署节点` and cylindrical
  `申报数据库实例` as `容器实例`; every used node type is present in the
  legend.
- Component `发布待执行任务` was moved into a connector-free lane with
  `9.33px` bottom-boundary clearance.
- All five Deployment labels were rerouted or repositioned. Static regression
  requires each label anchor to remain within `60px` of its own connector and
  requires declared `8 / 16 / 12px` stroke/arrow/node thresholds.
- The longer canonical `银行支付服务` title renders at `15px` with
  `16.36 / 16.36px` horizontal padding.

## Rendered geometry

Both SVGs render at exactly `800px`; scale is
`800 / 1200 = 0.6666667`. Clearance order in the node tables is
`left / right / top / bottom`, in final CSS pixels.

### Component nodes

| Node | Title baseline | Type baseline | Gap | Title clearance | Type clearance |
| --- | ---: | ---: | ---: | --- | --- |
| web | 216.66 | 244.66 | 28.00 | 26.19 / 26.19 / 22.33 / 61.00 | 26.53 / 26.53 / 55.33 / 34.00 |
| submit | 196.66 | 224.66 | 28.00 | 45.35 / 45.35 / 22.33 / 61.00 | 39.48 / 39.48 / 55.33 / 34.00 |
| policy | 196.66 | 224.66 | 28.00 | 45.35 / 45.35 / 22.33 / 61.00 | 39.48 / 39.48 / 55.33 / 34.00 |
| payment | 376.66 | 404.66 | 28.00 | 45.35 / 45.35 / 22.33 / 61.00 | 39.48 / 39.48 / 55.33 / 34.00 |
| persistence | 376.66 | 404.66 | 28.00 | 37.36 / 37.36 / 22.33 / 61.00 | 39.48 / 39.48 / 55.33 / 34.00 |
| db | 190.00 | 218.00 | 28.00 | 20.69 / 20.69 / 39.00 / 57.67 | 24.46 / 24.46 / 72.00 / 30.67 |
| worker | 376.66 | 404.66 | 28.00 | 21.36 / 21.36 / 22.33 / 61.00 | 43.20 / 43.20 / 55.33 / 34.00 |

### Deployment nodes

| Node | Title baseline | Type baseline | Gap | Title clearance | Type clearance |
| --- | ---: | ---: | ---: | --- | --- |
| employee-terminal | 236.66 | 264.66 | 28.00 | 25.68 / 25.68 / 22.67 / 74.67 | 36.75 / 36.75 / 55.67 / 47.67 |
| web-node | 210.00 | 238.00 | 28.00 | 39.86 / 39.86 / 16.00 / 134.66 | 53.42 / 53.42 / 49.00 / 107.66 |
| web-instance | 283.33 | 311.33 | 28.00 | 16.86 / 16.86 / 22.33 / 54.33 | 46.42 / 46.42 / 55.33 / 27.33 |
| api-node | 210.00 | 238.00 | 28.00 | 43.70 / 43.70 / 16.00 / 134.66 | 53.42 / 53.42 / 49.00 / 107.66 |
| api-instance | 283.33 | 311.33 | 28.00 | 19.03 / 19.03 / 22.33 / 54.33 | 46.42 / 46.42 / 55.33 / 27.33 |
| db-node | 210.00 | 238.00 | 28.00 | 43.69 / 43.69 / 16.00 / 134.66 | 62.75 / 62.75 / 49.00 / 107.66 |
| db-instance | 283.33 | 311.33 | 28.00 | 18.03 / 18.03 / 22.33 / 54.33 | 53.08 / 53.08 / 55.33 / 27.33 |
| task-node | 436.66 | 464.66 | 28.00 | 53.02 / 53.02 / 16.00 / 154.66 | 80.08 / 80.08 / 49.00 / 127.66 |
| worker-instance | 516.66 | 544.66 | 28.00 | 18.70 / 18.70 / 22.33 / 61.00 | 69.75 / 69.75 / 55.33 / 34.00 |
| bank | 469.99 | 497.99 | 28.00 | 16.36 / 16.36 / 23.33 / 61.00 | 40.42 / 40.42 / 55.33 / 34.00 |

### Relationship clearances

| Diagram / edge | Stroke | Arrow | Node | Association |
| --- | ---: | ---: | ---: | ---: |
| Component / edge-web-submit | 86.20 | 79.00 | 17.18 | 96.00 |
| Component / edge-submit-policy | 69.53 | 62.33 | 20.38 | 79.33 |
| Component / edge-submit-payment | 23.21 | 22.77 | 25.67 | 70.00 |
| Component / edge-payment-persistence | 66.20 | 59.00 | 17.18 | 76.00 |
| Component / edge-persistence-db | 48.54 | 72.13 | 21.00 | 80.00 |
| Component / edge-payment-worker | 14.20 | 155.45 | 17.67 | 24.00 |
| Deployment / edge-employee-web | 28.53 | 62.19 | 37.70 | 60.00 |
| Deployment / edge-web-api | 28.53 | 63.76 | 14.00 | 60.00 |
| Deployment / edge-api-db | 28.53 | 65.47 | 14.00 | 60.00 |
| Deployment / edge-api-task | 9.87 | 77.58 | 17.33 | 56.67 |
| Deployment / edge-task-bank | 20.87 | 16.66 | 12.00 | 30.67 |

Component association maxima are reported for completeness; the new maximum
association contract is intentionally scoped to the five Deployment labels.
Component edge labels still satisfy the required minimum stroke, marker, and
node clearances.

Deployment boundary clearances are database-to-production `14.67px`,
production-to-bank `17.00px`, and bank-to-viewBox `12.67px`.

## Real browser QA

Fresh Google Chrome `150.0.7871.187` ran against a fresh production build.

### Desktop 1440x1000

- MOD-01, MOD-02, and MOD-03: document `scrollWidth = clientWidth = 1440`.
- MOD-02 image: exactly `800px`.
- MOD-03 Component and Deployment images: exactly `800px` each.
- MOD-01 and MOD-03 Mermaid: one rendered SVG each.
- MOD-01 table: `display:block; overflow-x:auto`.
- Source sections visible on all three pages.
- Console/runtime events: `0`.

### Mobile 390x844

- All three documents: `scrollWidth = clientWidth = 390`.
- MOD-02 wrapper: `358px` client / `800px` scroll width.
- Both MOD-03 wrappers: `358px` client / `800px` scroll width.
- Real Tab reached Component, four more Tabs reached Deployment.
- Real Shift+Tab returned from Deployment to Component in four presses.
- Both wrappers matched `:focus-visible` with
  `rgb(159, 63, 49) solid 3px`.
- Real ArrowRight changed both wrappers `0 → 40`; document width stayed fixed.
- No `element.focus()` call was used.
- Console/runtime events: `0`.

Visible parent, adjacent, and case relations were actually clicked:
`14 / 14` PASS.

## Evidence paths

Raw CDP measurements:

- `.superpowers/sdd/task-5-cdp-measurements.json`

Desktop/mobile screenshots:

- `.superpowers/sdd/task-5-mod01-desktop.png`
- `.superpowers/sdd/task-5-mod01-mobile.png`
- `.superpowers/sdd/task-5-mod03-desktop.png`
- `.superpowers/sdd/task-5-mod03-mobile.png`

Exact 800px diagram screenshots:

- `.superpowers/sdd/task-5-component-800px.png`
- `.superpowers/sdd/task-5-deployment-800px.png`

## Deterministic validation

Both bundled validators passed with their complete contract labels:

```text
Validated mod-03-c4-component
Validated mod-03-c4-deployment
```

The relationship compatibility suite passed `51 / 51`.

Fresh full `npm run verify` evidence:

- Node tests: `512 / 512` passed.
- Content validation: `84` documents and `464` sources passed.
- Content, link, and review checks passed.
- TypeScript typecheck passed.
- Production build passed.

## Concerns

No open Critical or High finding. The raw CDP JSON and PNG files remain in the
requested `.superpowers/sdd/` paths under that directory's existing ignore
policy; this report and the updated Task 3 report are tracked.
