# Task 5 final Stage A pre-release correction report

## Status

PASS. All original Task 5 findings and all remaining Stage A re-review
findings are implemented and locally verified. This task creates local commits
only; it does not merge or push.

## TDD evidence

The original Task 5 contracts first failed on the missing MOD-01 boundaries,
reciprocal relations, MOD-03 evidence inputs, Dynamic `alt`, canonical naming,
diagram types, legends, and geometry.

The Stage A re-review added contracts before its correction. The exact RED was:

```text
node --test tests/g008-batch1-content.test.mjs tests/g008-batch1-diagrams.test.mjs
tests 24
pass 19
fail 5
```

The five failures covered:

- inconsistent database/infrastructure prose and source identity;
- Deployment asset title/description still phrased as production fact;
- Component `payment → worker` target endpoint not on the boundary;
- missing rendered label-bounds metadata and pairwise label clearance;
- structured Draw.io/SVG teaching-assumption text drift.

Final targeted GREEN:

```text
node --test tests/g008-batch1-content.test.mjs tests/g008-batch1-diagrams.test.mjs
tests 24
pass 24
fail 0

node --test tests/g008-batch1-diagrams.test.mjs
tests 15
pass 15
fail 0
```

Mutation checks reject node-type swaps, boundary-membership drift, reversed
declared relations, metadata/path drift, and terminal routes that point away
from the declared target.

## Final content and identity

- MOD-02 `bank-context` remains the canonical source for
  `银行支付服务`; MOD-03 derives and checks the same name.
- MOD-01 keeps six explicit per-exit non-proof boundaries and reciprocal
  navigation with QA-01 and MTH-03.
- MOD-03 keeps view-specific evidence, the dated `2026-07-30` fact cutoff,
  one asynchronous Dynamic boundary, and one minimal accepted/rejected bank
  branch.
- Database wording is now uniformly
  `数据库部署节点承载申报数据库 Container 实例`.
- `基础设施节点` is explicitly optional. The minimum teaching diagram
  instantiates none and adds no DNS or LB.
- Deployment Draw.io/SVG `<title>`, `<desc>`, canvas heading, and canvas note
  use `费用申报系统 Deployment 教学演练假设拓扑` and explicitly say the
  topology is not a production inventory fact.
- `data/source-ledger.json`, generated source-ledger projections, attribution,
  design, implementation plan, and Task 6 expected source labels use that same
  identity and usage boundary without changing the asset path.

## Final structured diagram contracts

- Component retains its `Component / Container / Data Store` legend, node
  names, types, memberships, and relations.
- Deployment retains its deployment-node, Container-instance, optional
  infrastructure-node, and external-system legend.
- Component `edge-payment-worker` and the first three Deployment relations
  now have source and target endpoint boundary contracts based on actual SVG
  paths and node geometry.
- The same contracts require the first vector to leave the source interior and
  the terminal vector to point into the target interior.
- Every Deployment relationship label carries final rendered bounds; every
  visible label pair must retain at least `12px` clearance.
- Deployment labels retain `stroke >= 8`, `arrow >= 16`, `node >= 12`, and
  `association <= 60`; the Component task label retains
  `boundary >= 8`.

## Real Chrome/CDP geometry

Chrome: `150.0.7871.187`. Both diagrams were measured at an exact `800px`
rendered width.

### Corrected endpoints and directions

| Edge | Source boundary | Target boundary | Terminal vector | Target-interior dot |
| --- | ---: | ---: | --- | ---: |
| Component `payment-worker` | 0.67 | 0.67 | `[0, -0.67]` | 33.78 |
| Deployment `employee-web` | 0.67 | 2.00 | `[0.67, 0]` | 45.78 |
| Deployment `web-api` | 0.67 | 2.00 | `[0.67, 0]` | 45.78 |
| Deployment `api-db` | 0.67 | 2.00 | `[0.67, 0]` | 50.22 |

Every dot is positive, proving the terminal segment points toward the target
interior. The Component arrow approaches the worker upward from below; the
three Deployment arrows approach their targets horizontally from the left.

### Final label geometry

| Deployment edge | Stroke | Arrow | Node | Association |
| --- | ---: | ---: | ---: | ---: |
| `edge-employee-web` | 28.54 | 72.32 | 39.00 | 60.00 |
| `edge-web-api` | 28.54 | 74.08 | 15.00 | 60.00 |
| `edge-api-db` | 28.54 | 77.47 | 15.00 | 60.00 |
| `edge-api-task` | 9.87 | 77.01 | 24.01 | 56.67 |
| `edge-task-bank` | 20.87 | 23.92 | 13.00 | 36.67 |

- minimum label-to-label clearance: `18.67px`;
- `读写申报 / 发布付款任务` clearance: `27.37px`;
- Component task label: boundary `9.33px`, stroke `14.20px`, arrow
  `156.76px`, node `18.33px`, association `30.00px`.

The first browser pass correctly exposed two intermediate failures:
`edge-api-task` stroke clearance `6.54px` and a Component label/stroke
intersection. Both were corrected before the final measurements above.

## Final responsive and keyboard QA

Fresh isolated Chrome ran against the final production build.

### Desktop `1440x1000`

- MOD-01 and MOD-03 document widths: `1440 = 1440`;
- both MOD-03 images: exactly `800px`;
- MOD-01 and MOD-03: one rendered Mermaid SVG each.

### Mobile `390x844`

- MOD-01 and MOD-03 document widths: `390 = 390`;
- both MOD-03 wrappers: `358px` client / `800px` scroll width;
- real Tab reached Component in 15 presses;
- four more real Tabs reached Deployment;
- four real Shift+Tabs returned to Component;
- both wrappers matched `rgb(159, 63, 49) solid 3px` focus-visible;
- real ArrowRight changed both wrappers `scrollLeft 0 → 40`;
- document width remained `390 = 390`;
- no `element.focus()` call was used.

Console/runtime events: `0`.

## Evidence

Raw final CDP record:

- `.superpowers/sdd/task-5-cdp-measurements.json`

Final desktop/mobile screenshots:

- `.superpowers/sdd/task-5-mod01-desktop.png`
- `.superpowers/sdd/task-5-mod01-mobile.png`
- `.superpowers/sdd/task-5-mod03-desktop.png`
- `.superpowers/sdd/task-5-mod03-mobile.png`

Final exact-width screenshots:

- `.superpowers/sdd/task-5-component-800px.png`
- `.superpowers/sdd/task-5-deployment-800px.png`

Final asset hashes:

```text
43099b02286013a641231ff8c06efa0d7446a71f21a91208eca57dab55226b00  diagrams/mod-03-c4-component.drawio
409eef69c1d593893b4578737d13854985522cc33365eee10eae83f37ff8289f  diagrams/mod-03-c4-deployment.drawio
835c9aff892a48450e43d447a0db3ec9f9ece4b5250798635cb9259e9a745f10  static/img/diagrams/mod-03-c4-component.svg
58a2ac087a0945dc049a8cbad4e862f2ccf858d573c30870cc8430096763f420  static/img/diagrams/mod-03-c4-deployment.svg
```

## Deterministic validation

Both bundled validators passed:

```text
Validated mod-03-c4-component
Validated mod-03-c4-deployment
```

Fresh full `npm run verify` passed:

- Node tests: `515 / 515`;
- content validation: `84` documents / `464` governed sources;
- generated-content, link-health, and review-health checks: PASS;
- TypeScript typecheck: PASS;
- Docusaurus production build: PASS.

## Concerns

No open Critical or High finding. Raw JSON and PNG evidence remains under the
existing `.superpowers/sdd/` ignore policy; Task 3 and Task 5 reports are
tracked.
