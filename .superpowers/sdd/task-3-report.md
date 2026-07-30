# Task 3 final report — MOD-03 Component and Deployment diagrams

## Outcome

PASS. The MOD-03 article publishes synchronized editable Draw.io and responsive
SVG pairs for the Component and Deployment views. The final contract compares
stable node, boundary, and directed-relation structure in both formats; it does
not rely on a unique text Set.

## Final files

- Article:
  `content/modeling/mod-03-c4-component-dynamic-deployment.mdx`
- Component source:
  `diagrams/mod-03-c4-component.drawio`
- Component SVG:
  `static/img/diagrams/mod-03-c4-component.svg`
- Deployment source:
  `diagrams/mod-03-c4-deployment.drawio`
- Deployment SVG:
  `static/img/diagrams/mod-03-c4-deployment.svg`
- Contract:
  `tests/g008-batch1-diagrams.test.mjs`

Final paired-asset SHA-256 values:

```text
4ab0625d264e7b52bd5fef0e300c82c0db4dc4825364d358652e7aea50090d2d  diagrams/mod-03-c4-component.drawio
b755566936437401a1578988e6c2a99de80b72aecc575eccbd38b361c1cc303f  diagrams/mod-03-c4-deployment.drawio
255d48a11ee2781071f9541713fa691b26737e5df8ba411819002faafdcc996b  static/img/diagrams/mod-03-c4-component.svg
43db2f20a846644abe00857d90766d2d8c8c807e1028ccfe5bf41fbfa52c7451  static/img/diagrams/mod-03-c4-deployment.svg
```

## Preserved semantics

The Component view expands only the `申报 API` container into four internal
components and shows its direct dependencies. It does not claim that code and
diagram are synchronized.

The Deployment view maps container instances to the `生产环境` deployment
boundary and keeps `外部银行` outside it. It does not claim capacity,
redundancy, resilience, or failover.

The structured bidirectional contract checks:

- every node as `[stable ID, title, type, boundary ID or null]`;
- every boundary as `[stable ID, name, ordered member IDs]`;
- every relation as
  `[stable edge ID, label, source ID, target ID, marker-end present]`;
- the complete rendered text multiset, retaining repeated type counts;
- exact SVG accessible title and description.

The SVG and Draw.io sources explicitly carry the boundary membership used by
the contract. SVG connectors explicitly carry the same stable edge IDs,
sources, and targets as Draw.io.

## Regression evidence

The mutation tests were written against the former unique-text Set approach
before the structured contract was implemented:

```text
node --test tests/g008-batch1-diagrams.test.mjs
tests 8
pass 5
fail 3
```

All three failures preserved the same unique text inventory:

1. exchanged `部署节点` and `外部系统` between stable node IDs;
2. moved `外部银行` into the `production` boundary;
3. reversed `edge-employee-web` source and target.

The final suite also mutates only `data-node-bounds` while leaving the actual
database path unchanged. The geometry contract rejects that metadata/path
drift.

Final targeted result:

```text
node --test tests/g008-batch1-diagrams.test.mjs
tests 9
pass 9
fail 0
```

## Geometry rules

All measurements below are final CSS pixels at an exact 800px rendered SVG
width. Both SVGs use a 1200-unit viewBox width, so the scale is
`800 / 1200 = 0.6666667`.

Applied thresholds:

- node horizontal padding: at least 16px;
- node vertical padding: at least 14px;
- title/type baseline gap: at least 22px;
- text-to-bottom clearance: at least 14px;
- label-to-stroke clearance: at least 8px;
- label-to-arrow clearance: at least 16px;
- label-to-node clearance: at least 12px;
- body and edge text: at least 15px;
- type text: at least 10px.

Node clearance columns are `left / right / top / bottom`. Baselines and
clearances were read from the real Chromium SVG DOM using actual text and path
bounding boxes.

### Component nodes

| Node ID | Title baseline | Type baseline | Gap | Title clearance | Type clearance |
| --- | ---: | ---: | ---: | ---: | ---: |
| `web` | 80.00, 216.67 | 80.00, 244.67 | 28.00 | 25.50 / 25.50 / 21.11 / 60.00 | 25.85 / 25.85 / 54.11 / 33.11 |
| `submit` | 283.33, 196.67 | 283.33, 224.67 | 28.00 | 44.67 / 44.67 / 21.11 / 60.00 | 38.80 / 38.80 / 54.11 / 33.11 |
| `policy` | 516.67, 196.67 | 516.67, 224.67 | 28.00 | 44.67 / 44.67 / 21.11 / 60.00 | 38.80 / 38.80 / 54.11 / 33.11 |
| `payment` | 283.33, 376.67 | 283.33, 404.67 | 28.00 | 44.67 / 44.67 / 21.11 / 60.00 | 38.80 / 38.80 / 54.11 / 33.11 |
| `persistence` | 516.67, 376.67 | 516.67, 404.67 | 28.00 | 36.67 / 36.67 / 21.11 / 60.00 | 38.80 / 38.80 / 54.11 / 33.11 |
| `db` | 720.00, 190.00 | 720.00, 218.00 | 28.00 | 20.00 / 20.00 / 37.78 / 56.67 | 23.78 / 23.78 / 70.78 / 29.78 |
| `worker` | 716.67, 376.67 | 716.67, 404.67 | 28.00 | 20.66 / 20.66 / 21.11 / 60.00 | 42.52 / 42.52 / 54.11 / 33.11 |

Component title text renders at 16px and type text at 10.67px.

### Component relations

Arrow clearance uses the actual marker triangle transformed by terminal
direction, `refX`, `refY`, marker viewBox, `markerUnits=strokeWidth`, and the
actual connector stroke. Node clearance includes the visible node stroke
envelope.

| Edge ID | Label | Stroke | Arrow | Node |
| --- | --- | ---: | ---: | ---: |
| `edge-web-submit` | 提交请求 | 85.87 | 78.67 | 16.86 |
| `edge-submit-policy` | 校验审批 | 69.20 | 62.00 | 20.06 |
| `edge-submit-payment` | 创建付款任务 | 23.20 | 22.53 | 25.67 |
| `edge-payment-persistence` | 保存任务 | 65.87 | 58.67 | 16.86 |
| `edge-persistence-db` | 读写申报 | 48.53 | 71.49 | 21.00 |
| `edge-payment-worker` | 发布待执行任务 | 14.20 | 155.25 | 27.67 |

### Deployment nodes

| Node ID | Title baseline | Type baseline | Gap | Title clearance | Type clearance |
| --- | ---: | ---: | ---: | ---: | ---: |
| `employee-terminal` | 70.00, 236.67 | 70.00, 264.67 | 28.00 | 24.67 / 24.67 / 21.33 / 73.33 | 35.73 / 35.73 / 54.67 / 46.67 |
| `web-node` | 213.33, 210.00 | 213.33, 238.00 | 28.00 | 38.83 / 38.83 / 14.67 / 133.33 | 52.40 / 52.40 / 48.00 / 106.67 |
| `web-instance` | 213.33, 283.33 | 213.33, 311.33 | 28.00 | 16.17 / 16.17 / 21.33 / 53.33 | 45.73 / 45.73 / 54.67 / 26.67 |
| `api-node` | 373.33, 210.00 | 373.33, 238.00 | 28.00 | 42.69 / 42.69 / 14.67 / 133.33 | 52.40 / 52.40 / 48.00 / 106.67 |
| `api-instance` | 373.33, 283.33 | 373.33, 311.33 | 28.00 | 18.33 / 18.33 / 21.33 / 53.33 | 45.73 / 45.73 / 54.67 / 26.67 |
| `db-node` | 549.33, 210.00 | 549.33, 238.00 | 28.00 | 42.67 / 42.67 / 14.67 / 133.33 | 51.27 / 51.27 / 48.00 / 106.67 |
| `db-instance` | 549.33, 283.33 | 549.33, 311.33 | 28.00 | 17.33 / 17.33 / 21.33 / 53.33 | 52.40 / 52.40 / 54.67 / 26.67 |
| `task-node` | 466.67, 436.67 | 466.67, 464.67 | 28.00 | 52.00 / 52.00 / 14.67 / 153.33 | 79.06 / 79.06 / 48.00 / 126.67 |
| `worker-instance` | 466.67, 516.67 | 466.67, 544.67 | 28.00 | 18.00 / 18.00 / 21.33 / 60.00 | 69.06 / 69.06 / 54.67 / 33.33 |
| `bank` | 721.33, 470.00 | 721.33, 498.00 | 28.00 | 28.00 / 28.00 / 21.33 / 60.00 | 39.06 / 39.06 / 54.67 / 33.33 |

Deployment title text renders at 16px and type text at 10px.

### Deployment relations

| Edge ID | Label | Stroke | Arrow | Node |
| --- | --- | ---: | ---: | ---: |
| `edge-employee-web` | 访问页面 | 132.53 | 125.33 | 29.00 |
| `edge-web-api` | 提交申报 | 142.53 | 135.33 | 29.00 |
| `edge-api-db` | 读写申报 | 71.20 | 64.00 | 17.67 |
| `edge-api-task` | 发布付款任务 | 163.20 | 172.60 | 19.00 |
| `edge-task-bank` | 发起付款 | 129.22 | 121.51 | 29.33 |

### Deployment boundary clearances

The regression parses the actual `M/H/V/Q` path geometry, reads the actual
`stroke-width` values, and requires metadata bounds to equal actual path
bounds before calculating:

| Relationship | CSS px |
| --- | ---: |
| Database outer stroke → production boundary inner stroke | 12.67 |
| Production boundary outer stroke → external bank outer stroke | 13.00 |
| External bank outer stroke → viewBox right edge | 18.00 |

## Real browser QA

QA ran against a fresh production build served at
`http://127.0.0.1:3100/tego-arch/modeling/mod-03`.
Google Chrome was controlled through bounded Chrome DevTools Protocol calls;
each CDP operation and keyboard traversal had a 10-second limit.

### Desktop 1440x1000

PASS.

- HTTP 200.
- Document `scrollWidth 1440 = clientWidth 1440`.
- Component image: exactly `800 × 533.328125px`, loaded.
- Deployment image: exactly `800 × 666.65625px`, loaded.
- Both wrappers: `clientWidth 800`, `scrollWidth 800`.
- Accessible titles and non-claim descriptions matched the final contract.
- Every node and relation measurement is recorded above.
- Browser console/runtime entries: 0.

### Mobile 390x844

PASS.

- HTTP 200.
- Document `scrollWidth 390 = clientWidth 390` before and after local scrolling.
- Each wrapper: `clientWidth 358`, `scrollWidth 800`.
- Both SVG images loaded with non-zero natural dimensions.
- Real Tab reached Component after 2 key presses.
- Real Tab then reached Deployment after 4 further key presses.
- Real Shift+Tab returned from Deployment to Component after 4 key presses.
- At every stop, `document.activeElement` was the expected
  `.architecture-diagram-scroll`, `:focus-visible` was true, and the computed
  outline was `rgb(159, 63, 49) solid 3px`.
- Real ArrowRight changed Component `scrollLeft 0 → 37` and Deployment
  `scrollLeft 0 → 36`; the document width remained fixed.
- No `element.focus()` call was used.
- Browser console/runtime entries: 0.

## Deterministic validators

Commands used the complete unique label list derived from each structured
contract:

```text
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/mod-03-c4-component.drawio \
  static/img/diagrams/mod-03-c4-component.svg \
  --label <each Component contract label>
Validated mod-03-c4-component

node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/mod-03-c4-deployment.drawio \
  static/img/diagrams/mod-03-c4-deployment.svg \
  --label <each Deployment contract label>
Validated mod-03-c4-deployment
```

## Full verification

```text
npm run verify
tests 504
pass 504
fail 0
Validated 84 content document(s) and 464 registered source(s).
Content review health passed for 84 document(s) and 464 source(s).
check:content: PASS
check:links: PASS
typecheck: PASS
production build: PASS
```

`git diff --check` passed. No temporary browser automation file or dependency
was retained.

## Concerns

None.
